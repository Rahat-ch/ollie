/**
 * The voice manifest: which bundled lines have audio, and what rendered each
 * one. A file is named after a hash of what the line says (src/voice/key),
 * so the name alone cannot tell an old voice from a new one; the manifest
 * records the model ID and the voice ID behind every line, and `pnpm
 * voice:lines` re-renders a line when either differs from the configured
 * model and voice, instead of keeping whatever file is already there.
 *
 * Lines are grouped by what rendered them, so the manifest the app bundles
 * stays one key per line. A group whose `voiceId` is null was rendered
 * before the manifest recorded the voice; `pnpm voice:lines --adopt` records
 * the configured voice on it once, by hand, for whoever knows it is the same.
 */
import { audioKey } from "./key";
import type { OllieLine } from "./lines";

/** What a line was rendered on. A null voice was never recorded. */
export type Rendition = {
  readonly modelId: string;
  readonly voiceId: string | null;
};

export type RenditionGroup = Rendition & { readonly keys: readonly string[] };

/** Sorted by model, then voice; the keys in each group sorted. */
export type VoiceManifest = readonly RenditionGroup[];

/** The configured model and voice. The voice can be unset, as in a dry run on a machine without one. */
export type ConfiguredVoice = {
  readonly modelId: string;
  readonly voiceId: string | undefined;
};

export type RenderPlan = {
  /** No audio on disk. */
  readonly missing: OllieLine[];
  /** Audio on disk, rendered on another model or voice, or on nothing the manifest records. */
  readonly stale: OllieLine[];
  /** Audio on disk, rendered on the configured model and voice. */
  readonly current: OllieLine[];
};

/** Each key in the manifest with what rendered it. */
export function renditions(manifest: VoiceManifest): Map<string, Rendition> {
  const byKey = new Map<string, Rendition>();
  for (const { keys, ...rendition } of manifest) for (const key of keys) byKey.set(key, rendition);
  return byKey;
}

/**
 * Whether audio rendered on `rendition` is what the configured voice would
 * render. The model must match; the voice must match too whenever one is
 * configured, and a voice that was never recorded matches none.
 */
export function isCurrent(rendition: Rendition | undefined, configured: ConfiguredVoice): boolean {
  if (rendition === undefined || rendition.modelId !== configured.modelId) return false;
  return configured.voiceId === undefined || rendition.voiceId === configured.voiceId;
}

/** Sorts the wanted lines into missing, stale, and current, in the order they were asked for. */
export function planRender(wanted: readonly OllieLine[], onDisk: ReadonlySet<string>, manifest: VoiceManifest, configured: ConfiguredVoice): RenderPlan {
  const byKey = renditions(manifest);
  const plan: RenderPlan = { missing: [], stale: [], current: [] };
  for (const line of wanted) {
    const key = audioKey(line.text);
    if (!onDisk.has(key)) plan.missing.push(line);
    else if (isCurrent(byKey.get(key), configured)) plan.current.push(line);
    else plan.stale.push(line);
  }
  return plan;
}

const renditionId = ({ modelId, voiceId }: Rendition): string => `${modelId}\u0000${voiceId ?? ""}`;

/** Groups keys by rendition, sorted, so the same records always write the same file. */
function grouped(byKey: ReadonlyMap<string, Rendition>): VoiceManifest {
  const groups = new Map<string, { rendition: Rendition; keys: string[] }>();
  for (const [key, rendition] of byKey) {
    const id = renditionId(rendition);
    const group = groups.get(id) ?? { rendition, keys: [] };
    group.keys.push(key);
    groups.set(id, group);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([, { rendition, keys }]) => ({ modelId: rendition.modelId, voiceId: rendition.voiceId, keys: keys.sort() }));
}

/**
 * The manifest after a run: what was just rendered is recorded on the
 * configured model and voice, every other line keeps its record, and a
 * record whose file is gone is dropped, so it never claims audio that is not
 * there. A file the manifest has no record of stays unrecorded, and so stale.
 */
export function recordRendered(manifest: VoiceManifest, onDisk: ReadonlySet<string>, rendered: readonly string[], configured: ConfiguredVoice): VoiceManifest {
  const byKey = renditions(manifest);
  const now: Rendition = { modelId: configured.modelId, voiceId: configured.voiceId ?? null };
  for (const key of rendered) byKey.set(key, now);
  for (const key of [...byKey.keys()]) if (!onDisk.has(key)) byKey.delete(key);
  return grouped(byKey);
}

/**
 * Records the configured voice on every line whose voice was never recorded
 * and whose model is the configured one. Only for whoever knows those lines
 * were rendered on that voice: nothing else can tell.
 */
export function adoptRendition(manifest: VoiceManifest, configured: { readonly modelId: string; readonly voiceId: string }): { manifest: VoiceManifest; adopted: number } {
  const byKey = renditions(manifest);
  let adopted = 0;
  for (const [key, rendition] of byKey) {
    if (rendition.voiceId !== null || rendition.modelId !== configured.modelId) continue;
    byKey.set(key, { modelId: configured.modelId, voiceId: configured.voiceId });
    adopted += 1;
  }
  return { manifest: grouped(byKey), adopted };
}

/**
 * A short tag of what rendered a line, for its URL. A bundled file is served
 * with a year's immutable cache-control, so the same line re-rendered on a new
 * voice needs a new URL, or a device that heard it before keeps the old Ollie.
 */
export const renditionTag = (rendition: Rendition): string => audioKey(renditionId(rendition));

/** Each bundled line's key with the tag of what rendered it. */
export function bundledRenditions(manifest: VoiceManifest): Map<string, string> {
  const tags = new Map<string, string>();
  for (const { keys, ...rendition } of manifest) {
    const tag = renditionTag(rendition);
    for (const key of keys) tags.set(key, tag);
  }
  return tags;
}

/** The manifest as read from its file, checked for shape. */
export function parseManifest(json: unknown): VoiceManifest {
  if (!Array.isArray(json)) throw new Error("The voice manifest is not a list of renditions");
  return json.map((group: unknown): RenditionGroup => {
    const g = group as Partial<RenditionGroup> | null;
    if (!g || typeof g.modelId !== "string" || !(g.voiceId === null || typeof g.voiceId === "string") || !Array.isArray(g.keys)) {
      throw new Error("The voice manifest has a group without a model, a voice, and keys");
    }
    return { modelId: g.modelId, voiceId: g.voiceId, keys: g.keys };
  });
}

/**
 * What the Parent chooses at onboarding: the Nickname Ollie says, the
 * Avatar's colour, and the Theme every Story is set in. The Nickname is the
 * only one of these that ever leaves the device, and only so that a Story
 * addressed to the Learner can be voiced (ADR 0002) — the home greeting shows
 * the Nickname on screen and does not say it, so nothing is sent for it. A
 * Story is written with a placeholder and never with the Nickname
 * (src/story/nickname).
 */

export type AvatarColor = "cream" | "sky" | "leaf" | "berry";

export type ThemeId = "puppies" | "dinosaurs" | "space" | "ocean" | "fairies" | "trucks";

export type Identity = {
  readonly nickname: string;
  readonly avatarColor: AvatarColor;
  readonly theme: ThemeId;
};

/**
 * The four colour bases, each with the Tailwind fills for its base tone and
 * for the deep tone of the same hue its paper shadow is cut from (paper-3
 * for cream, which has no deep tone). Adding a colour is one entry here.
 */
export const AVATAR_COLORS: readonly {
  readonly id: AvatarColor;
  readonly name: string;
  readonly fill: string;
  readonly deepFill: string;
}[] = [
  { id: "cream", name: "Cream", fill: "fill-cream", deepFill: "fill-paper-3" },
  { id: "sky", name: "Sky", fill: "fill-sky", deepFill: "fill-sky-deep" },
  { id: "leaf", name: "Leaf", fill: "fill-leaf", deepFill: "fill-leaf-deep" },
  { id: "berry", name: "Berry", fill: "fill-berry", deepFill: "fill-berry-deep" },
];

export function avatarColor(id: AvatarColor) {
  return AVATAR_COLORS.find((c) => c.id === id) ?? AVATAR_COLORS[0];
}

/** The six Themes, in the order onboarding shows them. Vocabulary joins with ticket 10. */
export const THEMES: readonly { readonly id: ThemeId; readonly name: string }[] = [
  { id: "puppies", name: "Puppies" },
  { id: "dinosaurs", name: "Dinosaurs" },
  { id: "space", name: "Space" },
  { id: "ocean", name: "Ocean" },
  { id: "fairies", name: "Fairies" },
  { id: "trucks", name: "Trucks" },
];

/** Shown to the Parent verbatim before play; the app's one statement of what leaves the device (ADR 0002). */
export const NICKNAME_DISCLOSURE =
  "The Nickname is sent to voice the Stories Ollie reads aloud, and nothing else leaves this device. No account, no recording.";

/** Ollie says the Nickname aloud in a Story, and a Story has under 25 words, so it stays short. */
export const NICKNAME_MAX = 20;

/** One line, no stray spaces, at most NICKNAME_MAX characters; empty means none was given. */
export function cleanNickname(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, NICKNAME_MAX).trim();
}

export function isIdentity(value: unknown): value is Identity {
  if (typeof value !== "object" || value === null) return false;
  const { nickname, avatarColor, theme } = value as Record<string, unknown>;
  return (
    typeof nickname === "string" &&
    nickname.length > 0 &&
    nickname === cleanNickname(nickname) &&
    AVATAR_COLORS.some((c) => c.id === avatarColor) &&
    THEMES.some((t) => t.id === theme)
  );
}

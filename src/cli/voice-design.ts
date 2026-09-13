/**
 * Design Ollie's voice, once. Sends the brief (src/voice/design) to
 * ElevenLabs Voice Design, writes the three previews it answers with as MP3s
 * so they can be listened to, and then saves the chosen one as a voice in
 * the library. The voice ID it prints goes in ELEVENLABS_VOICE_ID, in the
 * environment and in Coolify; it is never written into the code.
 *
 *   pnpm voice:design                    # three previews of the brief, written to ./data/voice-previews
 *   pnpm voice:design --save <id>        # save that preview as the voice "Ollie" and print its voice ID
 *   pnpm voice:design --brief "..."      # try another brief
 *
 * Voice Design is charged once per generation, for the preview text, however
 * many previews come back. Listen to all three before saving one: a saved
 * voice takes a slot in the library.
 */
import { parseArgs } from "node:util";
import { writeAudioFile } from "@/lib/audio-file";
import { elevenLabsVoiceDesign } from "@/generation/elevenlabs";
import { OLLIE_VOICE_BRIEF, OLLIE_VOICE_NAME, OLLIE_VOICE_PREVIEW, PREVIEW_LIMITS } from "@/voice/design";
import { elevenLabsApiKey } from "./generation";

const { values } = parseArgs({
  options: {
    brief: { type: "string", default: OLLIE_VOICE_BRIEF },
    name: { type: "string", default: OLLIE_VOICE_NAME },
    save: { type: "string" },
    out: { type: "string", default: "./data/voice-previews" },
  },
});

/** ElevenLabs refuses a preview text outside its own bounds, so pad Ollie's lines out with more of them. */
function previewText(): string {
  let text = OLLIE_VOICE_PREVIEW;
  while (text.length < PREVIEW_LIMITS.min) text = `${text}\n${OLLIE_VOICE_PREVIEW}`;
  return text.slice(0, PREVIEW_LIMITS.max);
}

async function main(): Promise<void> {
  const design = elevenLabsVoiceDesign({ apiKey: elevenLabsApiKey() });

  if (values.save !== undefined) {
    const voiceId = await design.save({ generatedVoiceId: values.save, name: values.name, brief: values.brief });
    console.log(`Saved "${values.name}" from preview ${values.save}.\n`);
    console.log(`ELEVENLABS_VOICE_ID=${voiceId}`);
    console.log("\nPut that in .env.local and in the Coolify environment, then run pnpm voice:lines.");
    return;
  }

  console.log(`Brief:\n  ${values.brief}\n`);
  console.log(`Preview text:\n  ${previewText().split("\n").join("\n  ")}\n`);
  const previews = await design.design({ brief: values.brief, previewText: previewText() });
  for (const preview of previews) {
    const file = `${preview.generatedVoiceId}.mp3`;
    await writeAudioFile(values.out, file, preview.audio);
    console.log(`  ${values.out}/${file}`);
  }
  console.log(`\n${previews.length} previews. Listen to each, then save the one you want:`);
  console.log(`  pnpm voice:design --save ${previews[0]?.generatedVoiceId ?? "<generated voice id>"}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

# Third-party components and AI assistance

This file is pasted into the Nerdy AI Hackathon submission form. It lists every API, model, font, image, audio source, and open-source component used by Ollie, with its licence, and discloses the generative-AI assistance used to build it. Only permissive licences are used, with three MPL-2.0 build-time tools recorded as reviewed exceptions below; no GPL, LGPL, AGPL, or SSPL code or assets, as the hackathon terms require.

## APIs and models

- **Anthropic Claude** via the official `@anthropic-ai/sdk` (MIT), with `zod` (MIT) for the structured-output schema; both are dependencies.
  - Claude Opus 5 (`claude-opus-5`) runs the Coach, the Parent Summary, and the Judge (eval-only, reading against a written rubric for Story readability and Parent Summary faithfulness). The Coach reads the Session Log and the Learner Notes and writes the next Session Plan; the Parent Summary is written from the engine's tally of the Session Log and those Notes, and is checked by a deterministic validator before a Parent reads it. Neither is ever given the Nickname.
  - Claude Sonnet 5 (`claude-sonnet-5`) writes Stories: the two-sentence word problems around the engine's numbers, at build time into the Content Pool and live for a missing variant. Every Story is checked by a deterministic validator before a child hears it.
  - Used under the Anthropic Commercial Terms of Service; no model weights are distributed.
- **ElevenLabs** for Ollie's voice, called over HTTPS with `fetch` from `src/generation/elevenlabs.ts`; no npm package is added for it.
  - **Voice Design** (`POST /v1/text-to-voice/design`, then `POST /v1/text-to-voice` to save the chosen preview) designs Ollie's voice once from a written brief and gives it a reusable voice ID. The ID is configuration (`ELEVENLABS_VOICE_ID`), never in the code.
  - **Text to speech** (`POST /v1/text-to-speech/{voice_id}`, `output_format=mp3_44100_128`) renders each line on the model named by `ELEVENLABS_MODEL_ID`, which defaults to `eleven_v3`, the model documented to support audio tags. 128 kbps is used because "MP3 with 192kbps bitrate requires you to be subscribed to Creator tier or above" ([API reference](https://elevenlabs.io/docs/api-reference/text-to-speech/convert)).
  - **Commercial licence.** ElevenLabs' Terms of Use §1(c): a Free User "may only use the Services for non-commercial purposes"; a paid subscriber "may use the Services for commercial purposes" ([terms](https://elevenlabs.io/terms-of-use)). The cheapest paid tier carrying the Commercial License bullet is **Starter, $6/month, 30,000 credits** ([pricing](https://elevenlabs.io/pricing)). **Every voice render for this entry must therefore be made on a Starter or higher subscription; the entrant must be on such a plan before rendering.** This file does not claim that the account used was on a paid tier — that is for the entrant to confirm at submission. Output ownership is the user's under §4(c)(ii), and §4(a) permits using downloaded Output outside the Services. Full fact-check, with what could not be verified, in `docs/research/k5-math-game/06-elevenlabs-terms.md`.
  - No child audio is ever sent to ElevenLabs: the app has no microphone and records nothing (ADR 0002). The only personal word sent is the Nickname, and only so that a line addressed to the Learner can be spoken; onboarding says so verbatim. Generated audio is stored (bundled fixed lines in `public/voice/`, Nickname lines on the server volume) and is not redistributed as a dataset.

## Fonts

Both fonts are under the **SIL Open Font License 1.1** and are self-hosted with `next/font/local` (no request goes to Google at runtime). Only the latin subset is shipped, as woff2, in `src/app/fonts/`, with each font's OFL text saved next to it.

- **Fredoka** (variable weight; used at 500 and 600) — display face for headings, buttons, the number pad, and Ollie's speech. Copyright 2016 The Fredoka Project Authors (https://github.com/hafontia/Fredoka-One). Files obtained from Google Fonts (`fonts.gstatic.com`, Fredoka v17); licence at `src/app/fonts/OFL-Fredoka.txt`, copied from https://github.com/google/fonts/tree/main/ofl/fredoka.
- **Andika** (400 and 700) — text face for body, captions, and the Parent Area. Copyright 2004-2022 SIL International (https://www.sil.org/), Reserved Font Names "Andika" and "SIL". Files obtained from Google Fonts (`fonts.gstatic.com`, Andika v27); licence at `src/app/fonts/OFL-Andika.txt`, copied from https://github.com/google/fonts/tree/main/ofl/andika.

## Images and audio

- **Ollie illustrations** (`public/ollie/*.svg`): the four base states, the four Power poses, and the head, hand-tuned flat SVG in one consistent style, original to this project. Authored as SVG source with Claude Code under the entrant's direction and review (see "Generative-AI assistance"); no third-party assets and no image-model output. `src/ollie/poses.generated.ts` is the same SVG as a module, written from these files by `pnpm ollie:poses`.
- **Theme pictures** (`src/ui/ThemeIcon.tsx`): one flat SVG picture per Theme (puppies, dinosaurs, space, ocean, fairies, trucks), drawn inline in the same style and palette. Original to this project, authored as SVG source with Claude Code under the entrant's direction. No image-model output.
- **Avatar and Avatar Items** (`src/ui/Avatar.tsx`, `src/ui/AvatarItems.tsx`): the four colour bases and the six Items (Party Hat, Stripy Scarf, Round Glasses, Pet Snail, Gold Crown, Pet Bunny), drawn inline as flat SVG. Original to this project, same provenance.
- **Power marks, Coin, Streak, celebration and milestone art, and the interface icons** (`src/ui/PowerMark.tsx`, `src/ui/RewardChips.tsx`, `src/app/play/Celebration.tsx`, `src/ui/LockIcon.tsx`, `src/ui/icons.tsx`, `src/ui/art.tsx`, `src/ui/Path.tsx`, `src/ui/TenFrame.tsx`, `src/ui/NumberLine.tsx`): the four Power marks, the Coin, the Streak's flame, the paper confetti, the milestone rosette, the padlock, the tick, the wing beats and magnifying glass on the number line, and the number-line and ten-frame rules, all drawn inline as flat SVG. The eye and the four-pointed star are one shared cut in `src/ui/art.tsx`. Original to this project, same provenance.
- **Icon set and social image** (`src/app/icon.svg`, `src/app/favicon.ico`, `src/app/apple-icon.png`, `src/app/opengraph-image.png`): rendered from those SVGs and the fonts above by `scripts/brand-images.mjs` (Playwright's bundled Chromium; no image library). Derivative of the entrant's own work.
- **Design review screenshots** (`docs/design/screens/*.png`, shown in `docs/design/review-2026-09-13.html`): Playwright screenshots of this app's own screens, written by `pnpm design:review`. Derivative of the entrant's own work; no third-party content appears in them.
- **No image-model output ships.** Every picture in the app is SVG written by hand as source, in the palette of `src/app/tokens.css` and the style of `docs/design/direction.md`. No generated pixels, no downloaded assets, no icon fonts.
- **Not used:** small icons from Kenney (kenney.nl), CC0 1.0 Universal, were allowed by the spec for small icons only. None are in the repo; every icon is drawn here.
- **Ollie's spoken lines** (`public/voice/*.mp3`): Ollie's fixed lines, and as many of the Problems' spoken lines as the voice budget allows, rendered from the app's own hand-written text on the ElevenLabs voice above by `pnpm voice:lines`, one file per line, bundled with the app and served with long cache headers. The words are the entrant's; only the voice is generated. Lines with the Nickname in them are not bundled: they are rendered per Nickname at creation time and kept on the server volume. **The bundled files are not in this commit**: no ElevenLabs key was available while the app was built, so `src/voice/lines.generated.json` is empty and the speech chain falls through to the platform's own speech and then to the line on screen. Running `pnpm voice:lines` with a key fills them in.

## Generative-AI assistance

- This codebase is developed with **Claude Code**, Anthropic's agentic coding tool, acting as the implementer under the entrant's direction. Specs, design decisions, and review are the entrant's; code, tests, documentation, the design canvas, and every SVG illustration in the app — Ollie's poses, the six Theme pictures, the Avatar and its Items, the Power marks, the Coin and Streak marks, the celebration and milestone art, and the interface icons, along with the icon and Open Graph renders made from them — are written with Claude Code as SVG source, not generated as images.
- Image models may be used for reference and ideation only (mood boards, poses, palette ideas). No image model was used for any asset in this repo, and no AI-generated pixels ship in the app. Ollie's voice is generated: the words are hand-written by the entrant and the speech is rendered by ElevenLabs from the brief in `src/voice/design.ts`, as listed in "Images and audio" above.

## Open-source dependencies

Every npm package in the installed tree, including devDependencies and optionalDependencies, with the licence declared in its `package.json`. The table is generated; run `node scripts/third-party.mjs --write` to refresh it. Platform-specific optional packages (for example `lightningcss-<platform>`) appear as installed on the machine that ran the audit; the Linux production image installs the corresponding `linux-x64-musl` variant of the same package, under the same licence.

<!-- BEGIN:deps -->
Generated by `node scripts/third-party.mjs --write` from `pnpm licenses list --json --long`: 373 packages (dependencies, devDependencies, and optionalDependencies). Do not edit by hand.

Licence counts: MIT 319, Apache-2.0 22, ISC 14, BSD-2-Clause 7, MPL-2.0 3, BSD-3-Clause 2, 0BSD 1, BlueOak-1.0.0 1, CC-BY-4.0 1, CC0-1.0 1, Python-2.0 1, Unlicense 1. Last audited 2026-09-13.

**Reviewed exceptions.** The following transitive packages are under MPL-2.0, a file-level weak copyleft licence that the hackathon terms do not prohibit (they name GPL, LGPL, AGPL, and SSPL). Each is an unmodified build-time or lint-time tool; none is bundled into shipped code. They are recorded in `REVIEWED_EXCEPTIONS` in `scripts/third-party.mjs`; removing an entry makes `pnpm licenses:check` fail.

- `axe-core` 4.13.0 (MPL-2.0): Accessibility rule engine used only by `eslint-plugin-jsx-a11y` (a devDependency via `eslint-config-next`) at lint time. Unmodified; never part of the built app.
- `lightningcss` 1.32.0, 1.33.0 (MPL-2.0): CSS transformer required by Tailwind CSS v4 (`@tailwindcss/node`) and Vite (via `vitest`). Build-time tool, unmodified; MPL-2.0 copyleft covers only modified MPL files, none of which exist here. Not shipped to the browser.
- `lightningcss-darwin-arm64` 1.32.0, 1.33.0 (MPL-2.0): Platform binary for `lightningcss` (see above). Build-time only, unmodified.

| Package | Version(s) | Licence | Source |
| --- | --- | --- | --- |
| `@alloc/quick-lru` | 5.3.0 | MIT | https://github.com/aleclarson/quick-lru |
| `@anthropic-ai/sdk` | 0.125.0 | MIT | https://github.com/anthropics/anthropic-sdk-typescript |
| `@babel/code-frame` | 7.29.7 | MIT | https://github.com/babel/babel |
| `@babel/compat-data` | 7.29.7 | MIT | https://github.com/babel/babel |
| `@babel/core` | 7.29.7 | MIT | https://github.com/babel/babel |
| `@babel/generator` | 7.29.8 | MIT | https://github.com/babel/babel |
| `@babel/helper-compilation-targets` | 7.29.7 | MIT | https://github.com/babel/babel |
| `@babel/helper-globals` | 7.29.7 | MIT | https://github.com/babel/babel |
| `@babel/helper-module-imports` | 7.29.7 | MIT | https://github.com/babel/babel |
| `@babel/helper-module-transforms` | 7.29.7 | MIT | https://github.com/babel/babel |
| `@babel/helper-string-parser` | 7.29.7 | MIT | https://github.com/babel/babel |
| `@babel/helper-validator-identifier` | 7.29.7 | MIT | https://github.com/babel/babel |
| `@babel/helper-validator-option` | 7.29.7 | MIT | https://github.com/babel/babel |
| `@babel/helpers` | 7.29.7 | MIT | https://github.com/babel/babel |
| `@babel/parser` | 7.29.8 | MIT | https://github.com/babel/babel |
| `@babel/runtime` | 7.29.7 | MIT | https://github.com/babel/babel |
| `@babel/template` | 7.29.7 | MIT | https://github.com/babel/babel |
| `@babel/traverse` | 7.29.8 | MIT | https://github.com/babel/babel |
| `@babel/types` | 7.29.8 | MIT | https://github.com/babel/babel |
| `@esbuild/darwin-arm64` | 0.28.2 | MIT | https://github.com/evanw/esbuild |
| `@eslint-community/eslint-utils` | 4.9.1, 4.10.1 | MIT | https://github.com/eslint-community/eslint-utils |
| `@eslint-community/regexpp` | 4.12.2 | MIT | https://github.com/eslint-community/regexpp |
| `@eslint/config-array` | 0.21.2 | Apache-2.0 | https://github.com/eslint/rewrite |
| `@eslint/config-helpers` | 0.4.2 | Apache-2.0 | https://github.com/eslint/rewrite |
| `@eslint/core` | 0.17.0 | Apache-2.0 | https://github.com/eslint/rewrite |
| `@eslint/eslintrc` | 3.3.7 | MIT | https://github.com/eslint/eslintrc |
| `@eslint/js` | 9.39.5 | MIT | https://github.com/eslint/eslint |
| `@eslint/object-schema` | 2.1.7 | Apache-2.0 | https://github.com/eslint/rewrite |
| `@eslint/plugin-kit` | 0.4.1 | Apache-2.0 | https://github.com/eslint/rewrite |
| `@humanfs/core` | 0.19.2 | Apache-2.0 | https://github.com/humanwhocodes/humanfs |
| `@humanfs/node` | 0.16.8 | Apache-2.0 | https://github.com/humanwhocodes/humanfs |
| `@humanfs/types` | 0.15.0 | Apache-2.0 | https://github.com/humanwhocodes/humanfs |
| `@humanwhocodes/module-importer` | 1.0.1 | Apache-2.0 | https://github.com/humanwhocodes/module-importer |
| `@humanwhocodes/retry` | 0.4.3 | Apache-2.0 | https://github.com/humanwhocodes/retry |
| `@jridgewell/gen-mapping` | 0.3.13 | MIT | https://github.com/jridgewell/sourcemaps |
| `@jridgewell/remapping` | 2.3.5 | MIT | https://github.com/jridgewell/sourcemaps |
| `@jridgewell/resolve-uri` | 3.1.2 | MIT | https://github.com/jridgewell/resolve-uri |
| `@jridgewell/sourcemap-codec` | 1.6.0 | MIT | https://github.com/jridgewell/sourcemaps |
| `@jridgewell/trace-mapping` | 0.3.31 | MIT | https://github.com/jridgewell/sourcemaps |
| `@next/env` | 16.3.4 | MIT | https://github.com/vercel/next.js |
| `@next/eslint-plugin-next` | 16.3.4 | MIT | https://github.com/vercel/next.js |
| `@next/swc-darwin-arm64` | 16.3.4 | MIT | https://github.com/vercel/next.js |
| `@nodelib/fs.scandir` | 2.1.5 | MIT | https://github.com/nodelib/nodelib/tree/master/packages/fs/fs.scandir |
| `@nodelib/fs.stat` | 2.0.5 | MIT | https://github.com/nodelib/nodelib/tree/master/packages/fs/fs.stat |
| `@nodelib/fs.walk` | 1.2.8 | MIT | https://github.com/nodelib/nodelib/tree/master/packages/fs/fs.walk |
| `@nolyfill/is-core-module` | 1.0.39 | MIT | https://github.com/SukkaW/nolyfill |
| `@oxc-project/types` | 0.149.0 | MIT | https://github.com/oxc-project/oxc |
| `@playwright/test` | 1.63.0 | Apache-2.0 | https://github.com/microsoft/playwright |
| `@rolldown/binding-darwin-arm64` | 1.2.8 | MIT | https://github.com/rolldown/rolldown |
| `@rolldown/pluginutils` | 1.0.1 | MIT | https://github.com/rolldown/plugins |
| `@rtsao/scc` | 1.1.0 | MIT | https://github.com/rtsao/scc |
| `@stablelib/base64` | 1.0.1 | MIT | https://github.com/StableLib/stablelib |
| `@swc/helpers` | 0.5.23 | Apache-2.0 | https://github.com/swc-project/swc |
| `@tailwindcss/node` | 4.3.3 | MIT | https://github.com/tailwindlabs/tailwindcss |
| `@tailwindcss/oxide` | 4.3.3 | MIT | https://github.com/tailwindlabs/tailwindcss |
| `@tailwindcss/oxide-darwin-arm64` | 4.3.3 | MIT | https://github.com/tailwindlabs/tailwindcss |
| `@tailwindcss/postcss` | 4.3.3 | MIT | https://github.com/tailwindlabs/tailwindcss |
| `@types/chai` | 5.2.3 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped |
| `@types/deep-eql` | 4.0.2 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped |
| `@types/estree` | 1.0.9 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped |
| `@types/json-schema` | 7.0.15 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped |
| `@types/json5` | 0.0.29 | MIT | https://www.github.com/DefinitelyTyped/DefinitelyTyped |
| `@types/node` | 24.13.4 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped |
| `@types/react` | 19.3.0 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped |
| `@types/react-dom` | 19.3.0 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped |
| `@typescript-eslint/eslint-plugin` | 8.70.0 | MIT | https://github.com/typescript-eslint/typescript-eslint |
| `@typescript-eslint/parser` | 8.70.0 | MIT | https://github.com/typescript-eslint/typescript-eslint |
| `@typescript-eslint/project-service` | 8.70.0 | MIT | https://github.com/typescript-eslint/typescript-eslint |
| `@typescript-eslint/scope-manager` | 8.70.0 | MIT | https://github.com/typescript-eslint/typescript-eslint |
| `@typescript-eslint/tsconfig-utils` | 8.70.0 | MIT | https://github.com/typescript-eslint/typescript-eslint |
| `@typescript-eslint/type-utils` | 8.70.0 | MIT | https://github.com/typescript-eslint/typescript-eslint |
| `@typescript-eslint/types` | 8.70.0 | MIT | https://github.com/typescript-eslint/typescript-eslint |
| `@typescript-eslint/typescript-estree` | 8.70.0 | MIT | https://github.com/typescript-eslint/typescript-eslint |
| `@typescript-eslint/utils` | 8.70.0 | MIT | https://github.com/typescript-eslint/typescript-eslint |
| `@typescript-eslint/visitor-keys` | 8.70.0 | MIT | https://github.com/typescript-eslint/typescript-eslint |
| `@unrs/resolver-binding-darwin-arm64` | 1.12.2 | MIT | https://github.com/unrs/unrs-resolver |
| `@vitest/mocker` | 5.0.0 | MIT | https://github.com/vitest-dev/vitest |
| `@vitest/spy` | 5.0.0 | MIT | https://github.com/vitest-dev/vitest |
| `acorn` | 8.18.0 | MIT | https://github.com/acornjs/acorn |
| `acorn-jsx` | 5.3.2 | MIT | https://github.com/acornjs/acorn-jsx |
| `ajv` | 6.15.0 | MIT | https://github.com/ajv-validator/ajv |
| `ansi-styles` | 4.3.0 | MIT | https://github.com/chalk/ansi-styles |
| `argparse` | 2.0.1 | Python-2.0 | https://github.com/nodeca/argparse |
| `aria-query` | 5.3.2 | Apache-2.0 | https://github.com/A11yance/aria-query |
| `array-buffer-byte-length` | 1.0.2 | MIT | https://github.com/inspect-js/array-buffer-byte-length |
| `array-includes` | 3.2.0 | MIT | https://github.com/es-shims/array-includes |
| `array.prototype.findlast` | 1.2.5 | MIT | https://github.com/es-shims/Array.prototype.findLast |
| `array.prototype.findlastindex` | 1.2.6 | MIT | https://github.com/es-shims/Array.prototype.findLastIndex |
| `array.prototype.flat` | 1.3.3 | MIT | https://github.com/es-shims/Array.prototype.flat |
| `array.prototype.flatmap` | 1.3.3 | MIT | https://github.com/es-shims/Array.prototype.flatMap |
| `array.prototype.tosorted` | 1.1.4 | MIT | https://github.com/es-shims/Array.prototype.toSorted |
| `arraybuffer.prototype.slice` | 1.0.4 | MIT | https://github.com/es-shims/ArrayBuffer.prototype.slice |
| `assertion-error` | 2.0.1 | MIT | https://github.com/chaijs/assertion-error |
| `ast-types-flow` | 0.0.8 | MIT | https://github.com/kyldvs/ast-types-flow |
| `async-function` | 1.0.0 | MIT | https://github.com/ljharb/async-function |
| `available-typed-arrays` | 1.0.7 | MIT | https://github.com/inspect-js/available-typed-arrays |
| `axe-core` | 4.13.0 | MPL-2.0 | https://github.com/dequelabs/axe-core |
| `axobject-query` | 4.1.0 | Apache-2.0 | https://github.com/A11yance/axobject-query |
| `balanced-match` | 1.0.2, 4.0.4 | MIT | https://github.com/juliangruber/balanced-match |
| `baseline-browser-mapping` | 2.11.22 | Apache-2.0 | https://github.com/web-platform-dx/baseline-browser-mapping |
| `brace-expansion` | 1.1.18, 5.0.9 | MIT | https://github.com/juliangruber/brace-expansion |
| `braces` | 3.0.3 | MIT | https://github.com/micromatch/braces |
| `browserslist` | 4.28.9 | MIT | https://github.com/browserslist/browserslist |
| `call-bind` | 1.0.9 | MIT | https://github.com/ljharb/call-bind |
| `call-bind-apply-helpers` | 1.0.2 | MIT | https://github.com/ljharb/call-bind-apply-helpers |
| `call-bound` | 1.0.4 | MIT | https://github.com/ljharb/call-bound |
| `callsites` | 3.1.0 | MIT | https://github.com/sindresorhus/callsites |
| `caniuse-lite` | 1.0.30001810 | CC-BY-4.0 | https://github.com/browserslist/caniuse-lite |
| `chai` | 6.2.2 | MIT | https://github.com/chaijs/chai |
| `chalk` | 4.1.2 | MIT | https://github.com/chalk/chalk |
| `client-only` | 0.0.1 | MIT | https://reactjs.org/ |
| `color-convert` | 2.0.1 | MIT | https://github.com/Qix-/color-convert |
| `color-name` | 1.1.4 | MIT | https://github.com/colorjs/color-name |
| `concat-map` | 0.0.1 | MIT | https://github.com/substack/node-concat-map |
| `convert-source-map` | 2.0.0 | MIT | https://github.com/thlorenz/convert-source-map |
| `cross-spawn` | 7.0.6 | MIT | https://github.com/moxystudio/node-cross-spawn |
| `csstype` | 3.2.3 | MIT | https://github.com/frenic/csstype |
| `damerau-levenshtein` | 1.0.8 | BSD-2-Clause | https://github.com/tad-lispy/node-damerau-levenshtein |
| `data-view-buffer` | 1.0.2 | MIT | https://github.com/inspect-js/data-view-buffer |
| `data-view-byte-length` | 1.0.2 | MIT | https://github.com/inspect-js/data-view-byte-length |
| `data-view-byte-offset` | 1.0.1 | MIT | https://github.com/inspect-js/data-view-byte-offset |
| `debug` | 3.2.7, 4.4.3 | MIT | https://github.com/visionmedia/debug |
| `deep-is` | 0.1.4 | MIT | http://github.com/thlorenz/deep-is |
| `define-data-property` | 1.1.4 | MIT | https://github.com/ljharb/define-data-property |
| `define-properties` | 1.2.1 | MIT | https://github.com/ljharb/define-properties |
| `detect-libc` | 2.1.2 | Apache-2.0 | https://github.com/lovell/detect-libc |
| `doctrine` | 2.1.0 | Apache-2.0 | https://github.com/eslint/doctrine |
| `dunder-proto` | 1.0.1 | MIT | https://github.com/es-shims/dunder-proto |
| `electron-to-chromium` | 1.5.426 | ISC | https://github.com/Kilian/electron-to-chromium |
| `emoji-regex` | 9.2.2 | MIT | https://github.com/mathiasbynens/emoji-regex |
| `enhanced-resolve` | 5.24.5 | MIT | https://github.com/webpack/enhanced-resolve |
| `es-abstract` | 1.24.2 | MIT | https://github.com/ljharb/es-abstract |
| `es-abstract-get` | 1.0.0 | MIT | https://github.com/ljharb/es-abstract-get |
| `es-define-property` | 1.0.1 | MIT | https://github.com/ljharb/es-define-property |
| `es-errors` | 1.3.0 | MIT | https://github.com/ljharb/es-errors |
| `es-iterator-helpers` | 1.4.0 | MIT | https://github.com/es-shims/iterator-helpers |
| `es-module-lexer` | 2.3.2 | MIT | https://github.com/guybedford/es-module-lexer |
| `es-object-atoms` | 1.1.2 | MIT | https://github.com/ljharb/es-object-atoms |
| `es-set-tostringtag` | 2.1.0 | MIT | https://github.com/es-shims/es-set-tostringtag |
| `es-shim-unscopables` | 1.1.0 | MIT | https://github.com/ljharb/es-shim-unscopables |
| `es-to-primitive` | 1.3.4 | MIT | https://github.com/ljharb/es-to-primitive |
| `esbuild` | 0.28.2 | MIT | https://github.com/evanw/esbuild |
| `escalade` | 3.2.0 | MIT | https://github.com/lukeed/escalade |
| `escape-string-regexp` | 4.0.0 | MIT | https://github.com/sindresorhus/escape-string-regexp |
| `eslint` | 9.39.5 | MIT | https://github.com/eslint/eslint |
| `eslint-config-next` | 16.3.4 | MIT | https://github.com/vercel/next.js |
| `eslint-import-resolver-node` | 0.3.10 | MIT | https://github.com/import-js/eslint-plugin-import |
| `eslint-import-resolver-typescript` | 3.10.1 | ISC | https://github.com/import-js/eslint-import-resolver-typescript |
| `eslint-module-utils` | 2.14.0 | MIT | https://github.com/import-js/eslint-plugin-import |
| `eslint-plugin-import` | 2.32.0 | MIT | https://github.com/import-js/eslint-plugin-import |
| `eslint-plugin-jsx-a11y` | 6.10.2 | MIT | https://github.com/jsx-eslint/eslint-plugin-jsx-a11y |
| `eslint-plugin-react` | 7.37.5 | MIT | https://github.com/jsx-eslint/eslint-plugin-react |
| `eslint-plugin-react-hooks` | 7.1.1 | MIT | https://github.com/facebook/react |
| `eslint-scope` | 8.4.0 | BSD-2-Clause | https://github.com/eslint/js |
| `eslint-visitor-keys` | 3.4.3, 4.2.1, 5.0.1 | Apache-2.0 | https://github.com/eslint/eslint-visitor-keys |
| `espree` | 10.4.0 | BSD-2-Clause | https://github.com/eslint/js |
| `esquery` | 1.7.0 | BSD-3-Clause | https://github.com/estools/esquery |
| `esrecurse` | 4.3.0 | BSD-2-Clause | https://github.com/estools/esrecurse |
| `estraverse` | 5.3.0 | BSD-2-Clause | http://github.com/estools/estraverse |
| `estree-walker` | 3.0.3 | MIT | https://github.com/Rich-Harris/estree-walker |
| `esutils` | 2.0.3 | BSD-2-Clause | http://github.com/estools/esutils |
| `expect-type` | 1.4.0 | Apache-2.0 | https://github.com/mmkal/expect-type |
| `fast-deep-equal` | 3.1.3 | MIT | https://github.com/epoberezkin/fast-deep-equal |
| `fast-glob` | 3.3.1 | MIT | https://github.com/mrmlnc/fast-glob |
| `fast-json-stable-stringify` | 2.1.0 | MIT | https://github.com/epoberezkin/fast-json-stable-stringify |
| `fast-levenshtein` | 2.0.6 | MIT | https://github.com/hiddentao/fast-levenshtein |
| `fast-sha256` | 1.3.0 | Unlicense | https://github.com/dchest/fast-sha256-js |
| `fastq` | 1.20.3 | ISC | https://github.com/mcollina/fastq |
| `fdir` | 6.5.0 | MIT | https://github.com/thecodrr/fdir |
| `file-entry-cache` | 8.0.0 | MIT | https://github.com/jaredwray/file-entry-cache |
| `fill-range` | 7.1.1 | MIT | https://github.com/jonschlinkert/fill-range |
| `find-up` | 5.0.0 | MIT | https://github.com/sindresorhus/find-up |
| `flat-cache` | 4.0.1 | MIT | https://github.com/jaredwray/flat-cache |
| `flatted` | 3.4.4 | ISC | https://github.com/WebReflection/flatted |
| `for-each` | 0.3.5 | MIT | https://github.com/Raynos/for-each |
| `fsevents` | 2.3.3 | MIT | https://github.com/fsevents/fsevents |
| `function-bind` | 1.1.2 | MIT | https://github.com/Raynos/function-bind |
| `function.prototype.name` | 1.2.0 | MIT | https://github.com/es-shims/Function.prototype.name |
| `functions-have-names` | 1.2.3 | MIT | https://github.com/inspect-js/functions-have-names |
| `generator-function` | 2.0.1 | MIT | https://github.com/TimothyGu/generator-function |
| `gensync` | 1.0.0-beta.2 | MIT | https://github.com/loganfsmyth/gensync |
| `get-intrinsic` | 1.3.0 | MIT | https://github.com/ljharb/get-intrinsic |
| `get-proto` | 1.0.1 | MIT | https://github.com/ljharb/get-proto |
| `get-symbol-description` | 1.1.0 | MIT | https://github.com/inspect-js/get-symbol-description |
| `get-tsconfig` | 4.14.3 | MIT | https://github.com/privatenumber/get-tsconfig |
| `glob-parent` | 5.1.2, 6.0.2 | ISC | https://github.com/gulpjs/glob-parent |
| `globals` | 14.0.0, 16.4.0 | MIT | https://github.com/sindresorhus/globals |
| `globalthis` | 1.0.4 | MIT | https://github.com/ljharb/System.global |
| `gopd` | 1.2.0 | MIT | https://github.com/ljharb/gopd |
| `graceful-fs` | 4.2.11 | ISC | https://github.com/isaacs/node-graceful-fs |
| `has-bigints` | 1.1.0 | MIT | https://github.com/ljharb/has-bigints |
| `has-flag` | 4.0.0 | MIT | https://github.com/sindresorhus/has-flag |
| `has-property-descriptors` | 1.0.2 | MIT | https://github.com/inspect-js/has-property-descriptors |
| `has-proto` | 1.2.0 | MIT | https://github.com/inspect-js/has-proto |
| `has-symbols` | 1.1.0 | MIT | https://github.com/inspect-js/has-symbols |
| `has-tostringtag` | 1.0.2 | MIT | https://github.com/inspect-js/has-tostringtag |
| `hasown` | 2.0.4 | MIT | https://github.com/inspect-js/hasOwn |
| `hermes-estree` | 0.25.1 | MIT | https://github.com/facebook/hermes |
| `hermes-parser` | 0.25.1 | MIT | https://github.com/facebook/hermes |
| `ignore` | 5.3.2, 7.0.9 | MIT | https://github.com/kaelzhang/node-ignore |
| `import-fresh` | 3.3.1 | MIT | https://github.com/sindresorhus/import-fresh |
| `imurmurhash` | 0.1.4 | MIT | https://github.com/jensyt/imurmurhash-js |
| `internal-slot` | 1.1.0 | MIT | https://github.com/ljharb/internal-slot |
| `is-array-buffer` | 3.0.5 | MIT | https://github.com/inspect-js/is-array-buffer |
| `is-async-function` | 2.1.1 | MIT | https://github.com/inspect-js/is-async-function |
| `is-bigint` | 1.1.0 | MIT | https://github.com/inspect-js/is-bigint |
| `is-boolean-object` | 1.2.2 | MIT | https://github.com/inspect-js/is-boolean-object |
| `is-bun-module` | 2.0.0 | MIT | https://github.com/SunsetTechuila/is-bun-module |
| `is-callable` | 1.2.7 | MIT | https://github.com/inspect-js/is-callable |
| `is-core-module` | 2.16.2 | MIT | https://github.com/inspect-js/is-core-module |
| `is-data-view` | 1.0.2 | MIT | https://github.com/inspect-js/is-data-view |
| `is-date-object` | 1.1.0 | MIT | https://github.com/inspect-js/is-date-object |
| `is-document.all` | 1.0.0 | MIT | https://github.com/inspect-js/is-document.all |
| `is-extglob` | 2.1.1 | MIT | https://github.com/jonschlinkert/is-extglob |
| `is-finalizationregistry` | 1.1.1 | MIT | https://github.com/inspect-js/is-finalizationregistry |
| `is-generator-function` | 1.1.2 | MIT | https://github.com/inspect-js/is-generator-function |
| `is-glob` | 4.0.3 | MIT | https://github.com/micromatch/is-glob |
| `is-map` | 2.0.3 | MIT | https://github.com/inspect-js/is-map |
| `is-negative-zero` | 2.0.3 | MIT | https://github.com/inspect-js/is-negative-zero |
| `is-number` | 7.0.0 | MIT | https://github.com/jonschlinkert/is-number |
| `is-number-object` | 1.1.1 | MIT | https://github.com/inspect-js/is-number-object |
| `is-regex` | 1.2.1 | MIT | https://github.com/inspect-js/is-regex |
| `is-set` | 2.0.3 | MIT | https://github.com/inspect-js/is-set |
| `is-shared-array-buffer` | 1.0.4 | MIT | https://github.com/inspect-js/is-shared-array-buffer |
| `is-string` | 1.1.1 | MIT | https://github.com/inspect-js/is-string |
| `is-symbol` | 1.1.1 | MIT | https://github.com/inspect-js/is-symbol |
| `is-typed-array` | 1.1.15 | MIT | https://github.com/inspect-js/is-typed-array |
| `is-weakmap` | 2.0.2 | MIT | https://github.com/inspect-js/is-weakmap |
| `is-weakref` | 1.1.1 | MIT | https://github.com/inspect-js/is-weakref |
| `is-weakset` | 2.0.4 | MIT | https://github.com/inspect-js/is-weakset |
| `isarray` | 2.0.5 | MIT | https://github.com/juliangruber/isarray |
| `isexe` | 2.0.0 | ISC | https://github.com/isaacs/isexe |
| `iterator.prototype` | 1.1.5 | MIT | https://github.com/ljharb/Iterator.prototype |
| `jiti` | 2.7.0 | MIT | https://github.com/unjs/jiti |
| `js-tokens` | 4.0.0 | MIT | https://github.com/lydell/js-tokens |
| `js-yaml` | 4.3.2 | MIT | https://github.com/nodeca/js-yaml |
| `jsesc` | 3.1.0 | MIT | https://github.com/mathiasbynens/jsesc |
| `json-buffer` | 3.0.1 | MIT | https://github.com/dominictarr/json-buffer |
| `json-schema-to-ts` | 3.1.1 | MIT | https://github.com/ThomasAribart/json-schema-to-ts |
| `json-schema-traverse` | 0.4.1 | MIT | https://github.com/epoberezkin/json-schema-traverse |
| `json-stable-stringify-without-jsonify` | 1.0.1 | MIT | https://github.com/samn/json-stable-stringify |
| `json5` | 1.0.2, 2.2.3 | MIT | https://github.com/json5/json5 |
| `jsx-ast-utils` | 3.3.5 | MIT | https://github.com/jsx-eslint/jsx-ast-utils |
| `keyv` | 4.5.4 | MIT | https://github.com/jaredwray/keyv |
| `language-subtag-registry` | 0.3.23 | CC0-1.0 | https://github.com/mattcg/language-subtag-registry |
| `language-tags` | 1.0.9 | MIT | https://github.com/mattcg/language-tags |
| `levn` | 0.4.1 | MIT | https://github.com/gkz/levn |
| `lightningcss` | 1.32.0, 1.33.0 | MPL-2.0 | https://github.com/parcel-bundler/lightningcss |
| `lightningcss-darwin-arm64` | 1.32.0, 1.33.0 | MPL-2.0 | https://github.com/parcel-bundler/lightningcss |
| `locate-path` | 6.0.0 | MIT | https://github.com/sindresorhus/locate-path |
| `lodash.merge` | 4.6.2 | MIT | https://github.com/lodash/lodash |
| `loose-envify` | 1.4.0 | MIT | https://github.com/zertosh/loose-envify |
| `lru-cache` | 5.1.1 | ISC | https://github.com/isaacs/node-lru-cache |
| `magic-string` | 0.30.21, 1.3.1 | MIT | https://github.com/Rich-Harris/magic-string |
| `math-intrinsics` | 1.1.0 | MIT | https://github.com/es-shims/math-intrinsics |
| `merge2` | 1.4.1 | MIT | https://github.com/teambition/merge2 |
| `micromatch` | 4.0.8 | MIT | https://github.com/micromatch/micromatch |
| `minimatch` | 10.2.6 | BlueOak-1.0.0 | https://github.com/isaacs/minimatch |
| `minimatch` | 3.1.5 | ISC | https://github.com/isaacs/minimatch |
| `minimist` | 1.2.8 | MIT | https://github.com/minimistjs/minimist |
| `ms` | 2.1.3 | MIT | https://github.com/vercel/ms |
| `nanoid` | 3.3.18 | MIT | https://github.com/ai/nanoid |
| `napi-postinstall` | 0.3.4 | MIT | https://github.com/un-ts/napi-postinstall |
| `natural-compare` | 1.4.0 | MIT | https://github.com/litejs/natural-compare-lite |
| `next` | 16.3.4 | MIT | https://github.com/vercel/next.js |
| `node-exports-info` | 1.6.2 | MIT | https://github.com/inspect-js/node-exports-info |
| `node-releases` | 2.0.55 | MIT | https://github.com/chicoxyzzy/node-releases |
| `object-assign` | 4.1.1 | MIT | https://github.com/sindresorhus/object-assign |
| `object-inspect` | 1.13.4 | MIT | https://github.com/inspect-js/object-inspect |
| `object-keys` | 1.1.1 | MIT | https://github.com/ljharb/object-keys |
| `object.assign` | 4.1.7 | MIT | https://github.com/ljharb/object.assign |
| `object.entries` | 1.1.9 | MIT | https://github.com/es-shims/Object.entries |
| `object.fromentries` | 2.0.8 | MIT | https://github.com/es-shims/Object.fromEntries |
| `object.groupby` | 1.0.3 | MIT | https://github.com/es-shims/Object.groupBy |
| `object.values` | 1.2.1 | MIT | https://github.com/es-shims/Object.values |
| `obug` | 2.2.1 | MIT | https://github.com/sxzz/obug |
| `optionator` | 0.9.4 | MIT | https://github.com/gkz/optionator |
| `own-keys` | 1.0.2 | MIT | https://github.com/ljharb/own-keys |
| `p-limit` | 3.1.0 | MIT | https://github.com/sindresorhus/p-limit |
| `p-locate` | 5.0.0 | MIT | https://github.com/sindresorhus/p-locate |
| `parent-module` | 1.0.1 | MIT | https://github.com/sindresorhus/parent-module |
| `path-exists` | 4.0.0 | MIT | https://github.com/sindresorhus/path-exists |
| `path-key` | 3.1.1 | MIT | https://github.com/sindresorhus/path-key |
| `path-parse` | 1.0.7 | MIT | https://github.com/jbgutierrez/path-parse |
| `picocolors` | 1.1.1 | ISC | https://github.com/alexeyraspopov/picocolors |
| `picomatch` | 2.3.2, 4.0.7 | MIT | https://github.com/micromatch/picomatch |
| `playwright` | 1.63.0 | Apache-2.0 | https://github.com/microsoft/playwright |
| `playwright-core` | 1.63.0 | Apache-2.0 | https://github.com/microsoft/playwright |
| `possible-typed-array-names` | 1.1.0 | MIT | https://github.com/ljharb/possible-typed-array-names |
| `postcss` | 8.5.23, 8.5.28 | MIT | https://github.com/postcss/postcss |
| `prelude-ls` | 1.2.1 | MIT | https://github.com/gkz/prelude-ls |
| `prop-types` | 15.8.1 | MIT | https://github.com/facebook/prop-types |
| `punycode` | 2.3.1 | MIT | https://github.com/mathiasbynens/punycode.js |
| `queue-microtask` | 1.2.3 | MIT | https://github.com/feross/queue-microtask |
| `react` | 19.2.8 | MIT | https://github.com/react/react |
| `react-dom` | 19.2.8 | MIT | https://github.com/react/react |
| `react-is` | 16.13.1 | MIT | https://github.com/facebook/react |
| `reflect.getprototypeof` | 1.0.10 | MIT | https://github.com/es-shims/Reflect.getPrototypeOf |
| `regexp.prototype.flags` | 1.5.4 | MIT | https://github.com/es-shims/RegExp.prototype.flags |
| `resolve` | 2.0.0-next.7 | MIT | https://github.com/browserify/resolve#readme |
| `resolve-from` | 4.0.0 | MIT | https://github.com/sindresorhus/resolve-from |
| `resolve-pkg-maps` | 1.0.0 | MIT | https://github.com/privatenumber/resolve-pkg-maps |
| `reusify` | 1.1.0 | MIT | https://github.com/mcollina/reusify |
| `rolldown` | 1.2.8 | MIT | https://github.com/rolldown/rolldown |
| `run-parallel` | 1.2.0 | MIT | https://github.com/feross/run-parallel |
| `safe-array-concat` | 1.1.4 | MIT | https://github.com/ljharb/safe-array-concat |
| `safe-push-apply` | 1.0.0 | MIT | https://github.com/ljharb/safe-push-apply |
| `safe-regex-test` | 1.1.0 | MIT | https://github.com/ljharb/safe-regex-test |
| `scheduler` | 0.27.0 | MIT | https://github.com/facebook/react |
| `semver` | 6.3.1, 7.8.5 | ISC | https://github.com/npm/node-semver |
| `set-function-length` | 1.2.2 | MIT | https://github.com/ljharb/set-function-length |
| `set-function-name` | 2.0.2 | MIT | https://github.com/ljharb/set-function-name |
| `set-proto` | 1.0.0 | MIT | https://github.com/ljharb/set-proto |
| `shebang-command` | 2.0.0 | MIT | https://github.com/kevva/shebang-command |
| `shebang-regex` | 3.0.0 | MIT | https://github.com/sindresorhus/shebang-regex |
| `side-channel` | 1.1.1 | MIT | https://github.com/ljharb/side-channel |
| `side-channel-list` | 1.0.1 | MIT | https://github.com/ljharb/side-channel-list |
| `side-channel-map` | 1.0.1 | MIT | https://github.com/ljharb/side-channel-map |
| `side-channel-weakmap` | 1.0.2 | MIT | https://github.com/ljharb/side-channel-weakmap |
| `siginfo` | 2.0.0 | ISC | https://github.com/emilbayes/siginfo |
| `source-map-js` | 1.2.1 | BSD-3-Clause | https://github.com/7rulnik/source-map-js |
| `stable-hash` | 0.0.5 | MIT | https://github.com/shuding/stable-hash |
| `stackback` | 0.0.2 | MIT | https://github.com/shtylman/node-stackback |
| `standardwebhooks` | 1.1.1 | MIT | https://github.com/standard-webhooks/standard-webhooks |
| `std-env` | 4.2.0 | MIT | https://github.com/unjs/std-env |
| `stop-iteration-iterator` | 1.1.0 | MIT | https://github.com/ljharb/stop-iteration-iterator |
| `string.prototype.includes` | 2.0.1 | MIT | https://github.com/mathiasbynens/String.prototype.includes |
| `string.prototype.matchall` | 4.1.0 | MIT | https://github.com/es-shims/String.prototype.matchAll |
| `string.prototype.repeat` | 1.0.0 | MIT | https://github.com/mathiasbynens/String.prototype.repeat |
| `string.prototype.trim` | 1.2.11 | MIT | https://github.com/es-shims/String.prototype.trim |
| `string.prototype.trimend` | 1.0.10 | MIT | https://github.com/es-shims/String.prototype.trimEnd |
| `string.prototype.trimstart` | 1.0.8 | MIT | https://github.com/es-shims/String.prototype.trimStart |
| `strip-bom` | 3.0.0 | MIT | https://github.com/sindresorhus/strip-bom |
| `strip-json-comments` | 3.1.1 | MIT | https://github.com/sindresorhus/strip-json-comments |
| `styled-jsx` | 5.1.6 | MIT | https://github.com/vercel/styled-jsx |
| `supports-color` | 7.2.0 | MIT | https://github.com/chalk/supports-color |
| `supports-preserve-symlinks-flag` | 1.0.0 | MIT | https://github.com/inspect-js/node-supports-preserve-symlinks-flag |
| `tailwindcss` | 4.3.3 | MIT | https://github.com/tailwindlabs/tailwindcss |
| `tapable` | 2.3.3 | MIT | http://github.com/webpack/tapable |
| `tinybench` | 6.1.4 | MIT | https://github.com/tinylibs/tinybench |
| `tinyexec` | 1.3.0 | MIT | https://github.com/tinylibs/tinyexec |
| `tinyglobby` | 0.2.17 | MIT | https://github.com/SuperchupuDev/tinyglobby |
| `to-regex-range` | 5.0.1 | MIT | https://github.com/micromatch/to-regex-range |
| `ts-algebra` | 2.0.0 | MIT | https://github.com/ThomasAribart/ts-algebra |
| `ts-api-utils` | 2.5.0 | MIT | https://github.com/JoshuaKGoldberg/ts-api-utils |
| `tsconfig-paths` | 3.15.0 | MIT | https://github.com/dividab/tsconfig-paths |
| `tslib` | 2.8.1 | 0BSD | https://github.com/Microsoft/tslib |
| `tsx` | 4.23.13 | MIT | https://github.com/privatenumber/tsx |
| `type-check` | 0.4.0 | MIT | https://github.com/gkz/type-check |
| `typed-array-buffer` | 1.0.3 | MIT | https://github.com/inspect-js/typed-array-buffer |
| `typed-array-byte-length` | 1.0.3 | MIT | https://github.com/inspect-js/typed-array-byte-length |
| `typed-array-byte-offset` | 1.0.4 | MIT | https://github.com/inspect-js/typed-array-byte-offset |
| `typed-array-length` | 1.0.8 | MIT | https://github.com/inspect-js/typed-array-length |
| `typescript` | 5.9.3 | Apache-2.0 | https://github.com/microsoft/TypeScript |
| `typescript-eslint` | 8.70.0 | MIT | https://github.com/typescript-eslint/typescript-eslint |
| `unbox-primitive` | 1.1.0 | MIT | https://github.com/ljharb/unbox-primitive |
| `undici-types` | 7.18.2 | MIT | https://github.com/nodejs/undici |
| `unrs-resolver` | 1.12.2 | MIT | https://github.com/unrs/unrs-resolver |
| `update-browserslist-db` | 1.3.3 | MIT | https://github.com/browserslist/update-db |
| `uri-js` | 4.4.1 | BSD-2-Clause | http://github.com/garycourt/uri-js |
| `vite` | 8.3.0 | MIT | https://github.com/vitejs/vite |
| `vitest` | 5.0.0 | MIT | https://github.com/vitest-dev/vitest |
| `which` | 2.0.2 | ISC | https://github.com/isaacs/node-which |
| `which-boxed-primitive` | 1.1.1 | MIT | https://github.com/inspect-js/which-boxed-primitive |
| `which-builtin-type` | 1.2.1 | MIT | https://github.com/inspect-js/which-builtin-type |
| `which-collection` | 1.0.2 | MIT | https://github.com/inspect-js/which-collection |
| `which-typed-array` | 1.1.22 | MIT | https://github.com/inspect-js/which-typed-array |
| `why-is-node-running` | 2.3.0 | MIT | https://github.com/mafintosh/why-is-node-running |
| `word-wrap` | 1.2.5 | MIT | https://github.com/jonschlinkert/word-wrap |
| `yallist` | 3.1.1 | ISC | https://github.com/isaacs/yallist |
| `yocto-queue` | 0.1.0 | MIT | https://github.com/sindresorhus/yocto-queue |
| `zod` | 4.6.2 | MIT | https://github.com/colinhacks/zod |
| `zod-validation-error` | 4.0.2 | MIT | https://github.com/causaly/zod-validation-error |
<!-- END:deps -->

## Audit

Run `pnpm licenses:check` (`node scripts/third-party.mjs --check`) to verify that every dependency is permissively licensed or a documented, reviewed exception; it exits non-zero otherwise; the audit date is stamped in the generated section above.

# K-5 Math Game (Voice Input, Age 6-7): Mobile Feasibility Research

Researched 2026-09-09. Primary audience: US 1st grader (age 6-7). Scope: a **gamified learning app** — streaks, badges, a profile the child customizes with earned items, and an animated character with a voice — with microphone-based answer input (the child speaks answers) and possibly a cloud voice-AI/WebRTC pipeline (e.g. LiveKit). This is closer to a "Duolingo-for-1st-grade-math" app than a physics/platformer game, which changes the stack calculus in §1: standard app frameworks with strong animation libraries (React Native/Expo + Reanimated + Rive/Lottie, Flutter + Rive, SwiftUI) are first-class candidates alongside dedicated game engines (Unity, Godot, Flame), not a fallback from them.

## Summary (decision-relevant)

1. **Buildable, but the legal surface (COPPA), not the tech, is the hard constraint.** A child's voice recording is "personal information" under COPPA from the moment it's captured. ([16 CFR 312.2](https://www.law.cornell.edu/cfr/text/16/312.2))
2. **Because this is a gamified app, not a physics-heavy game, standard app frameworks + an animation library are first-class choices, not compromises.** React Native/Expo (Reanimated for UI/gesture animation + Rive or Lottie for the character) and Flutter (native Rive support) can deliver streaks/badges/profile-customization screens and an animated, voiced character without a game-engine's overhead; reserve Unity/Godot for a later, more game-mechanics-heavy iteration. See [§1.7](#17-animation-libraries-for-the-character-rive-vs-lottie-vs-swiftui).
3. **Rive vs. Lottie**: Rive is a real-time, state-machine-driven vector format (better fit for an interactive, reactive character) with **MIT-licensed runtimes** for RN, Flutter, iOS, Android, Web, and **official Unity** (no Godot); its editor is free to design in, but export/shipping appears to require a paid ($9+/seat/mo) tier — verify exact commercial terms before committing. Lottie is a simpler, pre-baked (After Effects/Bodymovin JSON) timeline format with **Apache-2.0/MIT runtimes** (RN, iOS, Android, Web all official; the Flutter port is a well-adopted but **unofficial** community package) — cheaper and simpler, but not state-machine-reactive. **Neither has a documented, built-in audio-lipsync/viseme feature**; real-time mouth-sync to a TTS voice would be custom-wired in both.
4. **LiveKit has official first-party client SDKs for React Native, Flutter, Unity, Swift (iOS/macOS/tvOS/visionOS), Android/Kotlin, and JavaScript/Web** — but **not for Godot**; Godot integration exists only via a third-party community GDExtension (`NodotProject/godot-livekit`). See [Tech stack](#1-tech-stack-options).
5. **Apple's Kids Category (Guideline 1.3) and Guideline 5.1.4 both bar third-party analytics and third-party advertising** for apps aimed at kids, with only narrow, tightly-conditioned exceptions — verbatim quotes below. A solo/indie parent-built app should plan to ship with **zero third-party analytics/ad SDKs** if it wants Kids Category eligibility. ([Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/))
6. **Google Play's Families Policy requires "Families Self-Certified Ads SDKs" only, bans most non-approved third-party SDKs for child-only apps, and explicitly classifies microphone data as "sensitive information" requiring disclosure.** ([Play Console Help](https://support.google.com/googleplay/android-developer/answer/9893335))
7. **The FTC's 2017 enforcement policy statement carves out a narrow, conditional exception**: no prior verifiable parental consent (VPC) is needed to collect a child's voice recording *only* when it is used **solely as a stand-in for typed input (e.g., a search or spoken command/request), held for a brief time, used for no other purpose, not disclosed, and deleted immediately after responding** — and the operator must still disclose this practice and its deletion policy in its privacy policy. A math game capturing a child's *spoken answer* to evaluate correctness plausibly fits this pattern, but it has not been tested in enforcement. ([FTC policy statement / press release](https://www.ftc.gov/news-events/news/press-releases/2017/10/ftc-provides-additional-guidance-coppa-voice-recordings))
8. **The FTC's 2025 COPPA Rule amendments add "biometric identifiers" (explicitly including voiceprints) to the definition of personal information**, but the Commission **declined to add new exceptions for biometric/voice data** beyond the existing audio-file exception above, and now require **separate VPC before disclosing a child's data to third parties** — directly relevant to routing a child's voice to a cloud voice-AI vendor. ([FTC press release](https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-finalizes-changes-childrens-privacy-rule-limiting-companies-ability-monetize-kids-data))
9. **iOS home-screen-installed PWA mic/WebRTC reliability vs. a plain Safari tab could not be confirmed from a current primary source** — `getUserMedia` has been supported since iOS Safari 11 ([caniuse](https://caniuse.com/stream)), but installed-PWA parity is **UNVERIFIED**; test on-device before committing to PWA-only distribution.
10. **TestFlight internal testing (up to 100 team-member testers, no App Review) and Google Play's internal testing track (up to 100 testers, may skip standard review) are both clean, low-friction "family-only" pilot paths**, and no mature, permissively-licensed K-5 math game exists to fork — build on a generic app/animation template instead. ([Apple TestFlight](https://developer.apple.com/testflight/), [Play Console Help](https://support.google.com/googleplay/android-developer/answer/9845334))

---

## 1. Tech stack options

**Framing note**: the product is a gamified learning app (streaks, badges, profile customization with earned items, an animated voiced character) rather than a physics/platformer game. That means §1.1-1.6 below (framed around "2D game dev maturity") should be read alongside §1.7, which covers the animation-library path (Rive/Lottie/SwiftUI) that most directly serves this product shape — a dedicated game engine (Unity/Godot/Flame) is one way to render an animated character, but not the only or necessarily best one for an app that's mostly screens, streak counters, and a character that reacts and talks rather than a scrolling/physics world.

### 1.1 React Native / Expo

- **2D game dev maturity**: React Native is not a game engine; UI-driven "games" (the likely shape here — cartoon character, buttons, drag/drop, simple animations) are very buildable with React Native + Reanimated/Skia, but a scrolling/physics-heavy game engine is not native to RN. Expo's official position is that RN is best suited to app-like UI, not engine-grade 2D games — there's no first-party Expo game engine.
- **Audio/mic**: `expo-av`'s Audio API is **deprecated as of Expo SDK 52 and removed in SDK 54**, replaced by `expo-audio` (recording/playback) and `expo-video`. ([Expo SDK 54 docs — Audio (expo-av)](https://docs.expo.dev/versions/v54.0.0/sdk/audio-av/); [expo/expo PR #36020](https://github.com/expo/expo/pull/36020); [expo/expo#37259](https://github.com/expo/expo/issues/37259)) `expo-audio`'s current docs are at [docs.expo.dev/versions/latest/sdk/audio](https://docs.expo.dev/versions/latest/sdk/audio/). Recording requires calling `requestRecordingPermissionsAsync()`, and on Android the `RECORD_AUDIO` permission is auto-added to the manifest via the `expo-audio` config plugin; you configure a custom `microphonePermission` prompt string in `app.json`.
- **Speech**: `expo-speech` provides text-to-speech (for the animated character's voice) — a separate concern from speech *recognition*, which is not an Expo-maintained module (you'd use `react-native-voice`/platform APIs, or stream audio to a cloud STT service).
- **Voice pipeline**: LiveKit has an **official React Native SDK**: [`@livekit/react-native`](https://github.com/livekit/client-sdk-react-native), documented at [docs.livekit.io/transport/sdk-platforms/react-native/](https://docs.livekit.io/transport/sdk-platforms/react-native/), with a separate Expo quickstart referenced from that page ("If you're planning to integrate LiveKit into an Expo app, see the quickstart guide for Expo instead"). It depends on `@livekit/react-native-webrtc` and `livekit-client`.
- **Offline**: The core game loop (math problems, animation, local scoring) can run fully offline; only the voice-AI/LiveKit path needs network.

### 1.2 Flutter (Flame engine)

- **2D game dev maturity**: [Flame](https://flame-engine.org/) is Flutter's most established 2D game engine — game loop, component system (FCS), collision detection, sprites/animation, particles — actively maintained at [github.com/flame-engine/flame](https://github.com/flame-engine/flame), docs at [docs.flame-engine.org](https://docs.flame-engine.org/latest/). Google's own [Flutter Casual Games Toolkit](https://flutter.dev/games) and a [Google Codelab](https://codelabs.developers.google.com/codelabs/flutter-flame-brick-breaker) both endorse Flame for casual 2D games, which is a meaningfully stronger official-Google endorsement than RN gets.
- **Audio/mic**: Flutter has mature, widely-used audio packages (`audioplayers`, `just_audio`), and Flame has bridge packages for audio. Mic recording is handled by community packages (e.g., `record`) requesting the platform `RECORD_AUDIO`/`NSMicrophoneUsageDescription` permission — standard Flutter plugin permission flow, not a gap.
- **Voice pipeline**: LiveKit has an **official Flutter SDK**: `livekit_client` on [pub.dev](https://pub.dev/packages/livekit_client), source at [github.com/livekit/client-sdk-flutter](https://github.com/livekit/client-sdk-flutter), docs at [docs.livekit.io/reference/client-sdk-flutter/](https://docs.livekit.io/reference/client-sdk-flutter/index.html), quickstart at [docs.livekit.io/transport/sdk-platforms/flutter/](https://docs.livekit.io/transport/sdk-platforms/flutter/). It explicitly targets "all platforms supported by Flutter: Android, iOS, Web, macOS, Windows, and Linux."
- **Offline**: Same pattern — Flame game loop works fully offline; LiveKit/voice-AI requires network.

### 1.3 Unity

- **2D game dev maturity**: Unity has first-class, long-standing 2D tooling (2D URP, Sprite/Tilemap systems, 2D physics, Animator) — arguably the most mature and best-documented of any option here for a polished animated character + game loop.
- **Audio/mic**: Native `Microphone` scripting API records to an `AudioClip` ([docs.unity3d.com/ScriptReference/Microphone.html](https://docs.unity3d.com/ScriptReference/Microphone.html)); on Unity Web (WebGL) builds, mic access additionally requires `Application.RequestUserAuthorization` per the same docs.
- **Voice pipeline**: LiveKit has an **official Unity SDK**, [github.com/livekit/client-sdk-unity](https://github.com/livekit/client-sdk-unity) (installed via Unity Package Manager), plus a separate [Unity-WebGL-specific SDK](https://github.com/livekit/client-sdk-unity-web) for browser-embedded Unity builds. General connection docs at [docs.livekit.io/home/client/connect/](https://docs.livekit.io/home/client/connect/).
- **Offline**: Game loop can run fully offline (no forced network dependency in the base engine); Unity Cloud services are opt-in, so this is compatible with an offline-first design.

### 1.4 Godot

- **2D game dev maturity**: Godot is purpose-built with 2D as a first-class citizen (not an add-on onto a 3D engine), widely regarded as very strong for 2D. Official docs at [docs.godotengine.org](https://docs.godotengine.org/en/stable/).
- **Audio/mic**: Native support via `AudioStreamMicrophone` played through an `AudioStreamPlayer`, requires enabling `ProjectSettings.audio/enable_audio_input`, and can be combined with `AudioEffectRecord`/`AudioEffectCapture` to capture/process the stream. Official tutorial: [Recording with microphone — Godot Docs](https://docs.godotengine.org/en/stable/tutorials/audio/recording_with_microphone.html); class ref: [AudioStreamMicrophone](https://docs.godotengine.org/en/stable/classes/class_audiostreammicrophone.html).
- **Voice pipeline — gap confirmed**: LiveKit **does not publish an official Godot SDK**. The only Godot integration found is a **third-party community GDExtension**, [`NodotProject/godot-livekit`](https://github.com/NodotProject/godot-livekit) (listed on the [Godot Asset Library](https://godotengine.org/asset-library/asset/4934)), not maintained by LiveKit itself. A separate real-world case, [Decentraland's `godot-explorer`](https://github.com/decentraland/godot-explorer), does use LiveKit/WebRTC inside Godot, but again via custom/bespoke integration, not an official SDK. **This is the clearest stack-selection risk if LiveKit specifically is required**: expect to write and maintain your own binding, or avoid Godot if LiveKit is a hard requirement.
- **Offline**: Fully capable offline; same caveat that voice-AI needs network.

### 1.5 Phaser / PixiJS in a WebView or as a PWA

- **2D game dev maturity**: Both are mature, widely-used JS 2D engines (Phaser is scene/physics/animation-oriented and closer to a full game framework; PixiJS is a lower-level WebGL/Canvas renderer). Both run identically inside a plain browser tab, an installed PWA, or a native WebView wrapper.
- **Audio/mic**: Mic access uses the standard browser `getUserMedia` API. MDN confirms `getUserMedia()` is "widely available" and has been supported across browsers since September 2017, and that it **requires a secure context (HTTPS, or `localhost`)** — with no `navigator.mediaDevices` at all in insecure contexts. ([MDN: MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)) iOS Safari specifically has supported `getUserMedia` since **Safari 11** per [caniuse.com/stream](https://caniuse.com/stream). See §4 for the unresolved question of whether this differs for a **home-screen-installed** PWA vs. a Safari tab.
- **Voice pipeline**: LiveKit has an **official JavaScript/Web SDK**, `livekit-client` — [github.com/livekit/client-sdk-js](https://github.com/livekit/client-sdk-js), reference docs at [docs.livekit.io/reference/client-sdk-js/](https://docs.livekit.io/reference/client-sdk-js/), quickstart at [docs.livekit.io/home/quickstarts/javascript/](https://docs.livekit.io/home/quickstarts/javascript/). This is the SDK a Phaser/PixiJS web app would use directly, and it's also what a WebView-wrapped native shell would effectively be using under the hood.
- **Offline**: A PWA can be made to work offline for the core game (service worker + cached assets); voice-AI features require network regardless of shell.

### 1.6 Native Swift (iOS) and Kotlin (Android)

- **Swift/iOS**: Audio playback/recording via `AVFoundation`; on-device/cloud speech-to-text via Apple's `Speech` framework, specifically `SFSpeechRecognizer` ([Apple docs](https://developer.apple.com/documentation/speech/sfspeechrecognizer)) and the newer `SpeechAnalyzer` introduced at WWDC25 ([session video](https://developer.apple.com/videos/play/wwdc2025/277/)). LiveKit's **official Swift SDK**, `client-sdk-swift` ([github.com/livekit/client-sdk-swift](https://github.com/livekit/client-sdk-swift)), supports iOS, macOS, tvOS, and visionOS, distributed via Swift Package Manager; a components library (`components-swift`) is recommended for the fastest path to a working UI.
- **Kotlin/Android**: Google's built-in `SpeechRecognizer` API ([developer.android.com/reference/android/speech/SpeechRecognizer](https://developer.android.com/reference/android/speech/SpeechRecognizer)) has existed since API level 8; since Android 13 (API 33), `createOnDeviceSpeechRecognizer()` forces on-device-only recognition (useful for a privacy-by-design argument, since audio never leaves the device for that path). LiveKit's **official Android SDK**, `client-sdk-android` ([github.com/livekit/client-sdk-android](https://github.com/livekit/client-sdk-android)), is published as a Maven artifact (`io.livekit:livekit-android`), currently on the v2 API line.
- **2D game dev maturity**: Neither platform has a first-party 2D game framework; you'd be building animation/game-loop code by hand (SpriteKit exists on iOS but has no Android equivalent), which is why native Swift/Kotlin is a weak choice specifically for the *game* half of this project even though it's the strongest choice for speech/voice integration depth.
- **Offline**: Fully controllable; on-device speech recognition (Android 13+ on-device mode, iOS on-device dictation where available) can even make voice *input* work offline, independent of any cloud voice-AI feature.

### 1.7 Animation libraries for the character: Rive vs. Lottie vs. SwiftUI

For a gamified app (not a physics game), the character is most naturally built with a **vector/timeline animation library driven from app UI code**, not a game-engine scene graph. Two dominant, cross-platform options — plus SwiftUI's native (iOS-only) tools:

**Rive** ([rive.app](https://rive.app)) is a real-time, interactive vector animation tool: designers build animations plus **State Machines** — a visual graph of animation states linked by transitions driven by app-supplied inputs (booleans/numbers/triggers) — in the Rive editor, and ship a `.riv` file to a lightweight runtime. [Rive runtimes overview](https://rive.app/docs/runtimes/)
- Official, **MIT-licensed** runtimes confirmed via [rive.app/docs/runtimes](https://rive.app/docs/runtimes/) and the [rive-app GitHub org](https://github.com/rive-app): [React Native](https://github.com/rive-app/rive-react-native) (783★, plus a newer Nitro-based `rive-nitro-react-native`), [Flutter](https://github.com/rive-app/rive-flutter) (also on [pub.dev/packages/rive](https://pub.dev/packages/rive)), [iOS/Swift](https://github.com/rive-app/rive-ios), [Android/Kotlin](https://github.com/rive-app/rive-android), [Web/JS](https://github.com/rive-app/rive-wasm) (966★) and [rive-react](https://github.com/rive-app/rive-react) (1,200★), and an **official Unity** runtime ([rive-unity](https://github.com/rive-app/rive-unity), 205★; per [rive.app/docs/game-runtimes/unity](https://rive.app/docs/game-runtimes/unity) supports Unity LTS 2021+ on Windows/Mac/iOS/Android/WebGL). Also official: Unreal, C++, C#/UWP. **No official or notable community Godot runtime found.**
- **Editor cost**: per [rive.app/pricing](https://rive.app/pricing), the free tier ($0/seat) gives editor access, 3 collaborative files, and a 10MB asset cap, but **"Exports" are listed as included starting at the paid Cadet tier ($9/seat/mo)** — Rive's own marketing text is "$9/mo to ship." Exact commercial-use terms for any free-tier output are **UNVERIFIED**; check Rive's Terms of Service directly.
- **Audio/lip-sync**: no documented, built-in audio-driven-animation or viseme/lip-sync feature was found in Rive's [state machine docs](https://rive.app/docs/editor/state-machine/state-machine) or runtime READMEs. Because state machines accept arbitrary numeric inputs from host code, an app *could* drive a "talking" input from audio-amplitude analysis of TTS output to approximate lip-sync — but this is custom integration work, not an out-of-the-box feature. **UNVERIFIED as an official capability.**

**Lottie** is a JSON animation format exported from Adobe After Effects via the Bodymovin plugin, rendered natively (not as embedded video) by platform runtimes. [lottie-react-native README](https://github.com/airbnb/lottie-react-native)
- **React Native**: canonical repo moved to [lottie-react-native/lottie-react-native](https://github.com/lottie-react-native/lottie-react-native) (**Apache-2.0**, actively maintained); its latest major version requires React Native 0.84+ and the New Architecture, so older RN projects must pin to the 7.3.x line.
- **iOS**: [airbnb/lottie-ios](https://github.com/airbnb/lottie-ios) (Apache-2.0, active, still under Airbnb). **Android**: [airbnb/lottie-android](https://github.com/airbnb/lottie-android) (Apache-2.0, active, still under Airbnb). **Web**: [airbnb/lottie-web](https://github.com/airbnb/lottie-web) (MIT, active).
- **Flutter**: the [pub.dev/packages/lottie](https://pub.dev/packages/lottie) package is **not an Airbnb/official port** — it's an "unofficial conversion of the Lottie-android library in pure Dart" ([xvrh/lottie-flutter](https://github.com/xvrh/lottie-flutter)), MIT-licensed, well-adopted (1.8M+ downloads) but community-maintained, not Airbnb-blessed.
- **Audio/lip-sync**: Lottie plays a pre-authored, fixed timeline (with named markers/segments you can seek/trigger from code) — well-suited to triggered/looping animations (idle, celebrate, "thinking") but architecturally less suited than Rive's input-driven state machines to continuous, real-time audio-synced mouth movement. No official audio-reactive or viseme feature found. **UNVERIFIED** beyond "timeline/segment-based, not state-machine-based."

**SwiftUI** (iOS/macOS/watchOS/tvOS/visionOS only) ships a native `Animation` type plus, per [developer.apple.com/documentation/swiftui/phaseanimator](https://developer.apple.com/documentation/swiftui/phaseanimator) and [.../keyframeanimator](https://developer.apple.com/documentation/swiftui/keyframeanimator), **`PhaseAnimator`** (cycles a view through value "phases," e.g. an idle/react/celebrate cycle) and **`KeyframeAnimator`** (parallel, timeline-keyed animation of multiple properties) — both introduced alongside iOS 17. Exact API wording/availability strings are **UNVERIFIED by direct fetch** in this research (Apple's doc pages are JS-rendered); confirm on the live page. Critically, **SwiftUI has no Android path** — it cannot alone deliver one cross-platform mobile codebase, so it only makes sense paired with a separate Android implementation (e.g. Jetpack Compose, not researched here) or as an iOS-only MVP.

**Reanimated + Lottie/Rive as a pattern**: [Reanimated's docs](https://docs.swmansion.com/react-native-reanimated/) describe it as a UI-thread-driven library for gesture, layout, and general property animation — a different layer from Lottie/Rive, not a bundling mechanism. **No mention of Lottie or Rive in Reanimated's own docs** was found. In practice, Reanimated typically drives UI chrome (screen transitions, button presses, layout) while Lottie/Rive render the character asset itself; they're commonly used side-by-side, but this is ecosystem convention, not a documented first-party integration. Expo does not appear to ship Lottie as a first-party SDK module (`docs.expo.dev/versions/latest/sdk/lottie/` 404s) — it would be installed as a regular community package via Expo's config-plugin model, same as Rive.

| | Rive | Lottie |
|---|---|---|
| Source format | Real-time vector + state machine (`.riv`) | JSON export of a fixed After Effects timeline |
| Editor cost | Free to design; **export/shipping gated behind $9+/seat/mo tier** (verify ToS) | Free (After Effects + Bodymovin/LottieFiles export; LottieFiles design tool has separate commercial tiers, not verified here) |
| Runtime license | MIT (RN, Flutter, iOS, Android, Web, Unity) | Apache-2.0 (RN, iOS, Android) / MIT (Web); Flutter port MIT but **unofficial** |
| Audio/viseme sync | Not a documented built-in feature; state-machine inputs could be custom-wired to audio analysis | Not a documented built-in feature; timeline/segment-triggered only |
| Platform coverage | RN, Flutter, iOS, Android, Web, **official Unity**, Unreal, C++/C#; **no Godot** | RN, Flutter (unofficial), iOS, Android, Web; no official game-engine runtimes found |

### Comparison table

| Stack | App/game-UI maturity for this product shape | Mic/audio support | Official LiveKit SDK | Offline core loop |
|---|---|---|---|---|
| React Native / Expo (+ Reanimated + Rive/Lottie) | Strong for a screens-and-character app (streaks/badges/profile UI is RN's home turf); not a physics engine, but that's not needed here | `expo-audio` (post-SDK54; `expo-av` deprecated) | Yes — [`client-sdk-react-native`](https://github.com/livekit/client-sdk-react-native) | Yes |
| Flutter (+ Rive, or + Flame for a more game-like loop) | Strong both ways: native Rive support for an app-shaped build, or Google-endorsed Flame if more game mechanics are added later | Mature plugin ecosystem | Yes — [`client-sdk-flutter`](https://github.com/livekit/client-sdk-flutter) | Yes |
| Unity | Very strong 2D/game tooling but heavier than this product needs; official Rive runtime exists if a game-engine build is chosen | Native `Microphone` API | Yes — [`client-sdk-unity`](https://github.com/livekit/client-sdk-unity) (+ WebGL variant) | Yes |
| Godot | Strong 2D engine, but no official Rive or LiveKit SDK — two integration gaps for this product | Native `AudioStreamMicrophone` | **No official SDK** — only community GDExtension [`godot-livekit`](https://github.com/NodotProject/godot-livekit) | Yes |
| Phaser/PixiJS (WebView/PWA) | Workable for a web-first prototype of the game screens | `getUserMedia`, widely available since 2017 ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)) | Yes — [`client-sdk-js`](https://github.com/livekit/client-sdk-js) | Yes, with service worker caching |
| Native Swift (+ SwiftUI animation) / Kotlin | SwiftUI is a strong native fit for the character/UI on iOS alone; no cross-platform path without a separate Android build | `AVFoundation`/`Speech` (iOS), `SpeechRecognizer` (Android, on-device since API 33) | Yes — [`client-sdk-swift`](https://github.com/livekit/client-sdk-swift), [`client-sdk-android`](https://github.com/livekit/client-sdk-android) | Yes (best on-device speech option) |

---

## 2. App store policy for children's apps

### 2.1 Apple — App Store Review Guidelines §1.3 "Kids Category"

Quoted directly from [developer.apple.com/app-store/review/guidelines](https://developer.apple.com/app-store/review/guidelines/) (§1.3):

> "The Kids Category is a great way for people to easily find apps that are designed for children. If you want to participate in the Kids Category, you should focus on creating a great experience specifically for younger users. These apps must not include links out of the app, purchasing opportunities, or other distractions to kids unless reserved for a designated area behind a [parental gate](https://developer.apple.com/app-store/kids-apps/)... You must comply with applicable privacy laws around the world relating to the collection of data from children online... Kids Category apps may not send personally identifiable information or device information to third parties. **Apps in the Kids Category should not include third-party analytics or third-party advertising.** This provides a safer experience for kids. In limited cases, third-party analytics may be permitted provided that the services do not collect or transmit the IDFA or any identifiable information about children (such as name, date of birth, email address), their location, or their devices... Third-party contextual advertising may also be permitted in limited cases provided that the services have publicly documented practices and policies for Kids Category apps that include human review of ad creatives for age appropriateness."

### 2.2 Apple — App Store Review Guidelines §5.1.4 "Kids"

Also quoted directly from the same source:

> "(a) For many reasons, it is critical to use care when dealing with personal data from kids, and we encourage you to carefully review all the requirements for complying with laws like the Children's Online Privacy Protection Act ("COPPA"), the European Union's General Data Protection Regulation ("GDPR"), and any other applicable regulations or laws. Apps may ask for birthdate and parental contact information only for the purpose of complying with these statutes, but must include some useful functionality or entertainment value regardless of a person's age. **Apps intended primarily for kids should not include third-party analytics or third-party advertising.** This provides a safer experience for kids.
>
> (b) In limited cases, third-party analytics and third-party advertising may be permitted provided that the services adhere to the same terms set forth in Guideline 1.3. Moreover, apps in the Kids Category or those that collect, transmit, or have the capability to share personal information (e.g. name, address, email, location, photos, videos, drawings, the ability to chat, other personal data, or persistent identifiers used in combination with any of the above) from a minor must include a privacy policy and must comply with all applicable children's privacy statutes. **For the sake of clarity, the parental gate requirement for the Kids Category is generally not the same as securing parental consent to collect personal data under these privacy statutes** [i.e., a parental gate alone does not satisfy COPPA's VPC requirement]. As a reminder, Guideline 2.3.8 requires that use of terms like 'For Kids' and 'For Children' in app metadata is reserved for the Kids Category."

**Practical implication**: A math game with voice input plausibly *collects personal information from a minor* (audio containing the child's voice), which under 5.1.4(b) independently triggers the privacy-policy and children's-privacy-statute-compliance requirement even outside the Kids Category, and Apple explicitly states its parental gate ≠ COPPA-style parental consent.

### 2.3 Google Play — Families Policy

Primary source: [Play Console Help — Google Play Families Policies](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en), with the ads-specific rules cross-referenced from [Comply with Google Play's Families Policy using AdMob](https://support.google.com/admob/answer/6223431?hl=en) and self-certified SDK rules at [Families Self-Certified Ads SDK Policy](https://support.google.com/googleplay/android-developer/answer/12918983?hl=en).

- **Ads**: Apps that include a child age group in the Play Console's Target Audience declaration **must use only Google Play Families Self-Certified Ads SDKs** to serve ads to children/users of unknown age, and **personalized/remarketing ads are prohibited**; disruptive formats (full-screen ads with no clear dismissal, launch interstitials) are also banned.
- **Third-party SDKs generally**: Apps whose *entire* target audience is children **cannot use APIs/SDKs not approved for use in primarily child-directed services**; mixed-audience apps must gate unapproved SDKs behind a neutral age screen or ensure they don't collect data from users who self-identify as children.
- **Data collection**: Certain identifiers are outright prohibited for children's apps: **Android Advertising ID (AAID), SIM Serial, Build Serial, BSSID, MAC, SSID, IMEI, and/or IMSI**. Developers must disclose collection of "personal and sensitive information," and the policy **explicitly names "microphone and camera sensor data"** as sensitive information subject to disclosure requirements — i.e., microphone use is allowed but must be transparently disclosed via the Play Console Data Safety section and privacy policy.
- **Compliance baseline**: Apps must comply with COPPA and GDPR and keep Play Console disclosures accurate and consistent with actual behavior.

---

## 3. Law: COPPA, FTC guidance, 2025 amendments, and international notes

### 3.1 COPPA scope and "personal information" (16 CFR 312.2)

COPPA (the Children's Online Privacy Protection Act, implemented via the FTC's COPPA Rule, 16 CFR Part 312) applies to operators of online services that are either **directed to children under 13**, or that have **actual knowledge** they are collecting personal information from a child under 13. The Rule's definitions are at [16 CFR 312.2, via eCFR/Cornell LII](https://www.law.cornell.edu/cfr/text/16/312.2). Personal information is defined as "individually identifiable information about an individual collected online," and the enumerated list explicitly includes **"a photograph, video, or audio file where such file contains a child's image or voice."** This means a 1st grader's spoken answer, as an audio file, is personal information under COPPA the moment it's captured — full stop, subject only to the narrow exception below.

### 3.2 The FTC's 2017 enforcement policy statement on voice recordings

Source: [FTC press release, Oct. 23, 2017](https://www.ftc.gov/news-events/news/press-releases/2017/10/ftc-provides-additional-guidance-coppa-voice-recordings); official statement indexed at [ftc.gov/legal-library](https://www.ftc.gov/legal-library/browse/federal-trade-commission-enforcement-policy-statement-regarding-applicability-childrens-online) and published in the [Federal Register, Dec. 8, 2017](https://www.federalregister.gov/documents/2017/12/08/2017-26509/enforcement-policy-statement-regarding-the-applicability-of-the-coppa-rule-to-the-collection-and-use).

The FTC's 2013 COPPA Rule amendments added voice recordings to "personal information," which raised the question of whether every voice-command device/app now needed VPC just to process a spoken instruction. The 2017 policy statement narrows this:

> The FTC **will not take an enforcement action** against an operator for not obtaining parental consent before collecting the audio file containing a child's voice **when it is collected solely as a replacement of written words, such as to perform a search or to fulfill a verbal instruction or request — as long as it is held for a brief time and only for that purpose.**

Explicit limits on this exception, per the same source:

- It **does not apply** when the operator additionally requests other information via voice that would itself be personal information (e.g., asking the child to say their name).
- The audio file **cannot be used for any other purpose** and **cannot be disclosed** before it is deleted.
- It must be **deleted immediately** after fulfilling the request.
- The operator must still provide **clear notice in its privacy policy** of its audio collection, use, and deletion practices.
- This exception is limited to enforcement discretion around the *consent* requirement specifically — **all other COPPA obligations (privacy policy, security, data minimization, etc.) still apply.**

**Assessment for this project (not a legal conclusion)**: A design where the child's spoken numeric answer is streamed to a cloud STT service, transcribed, compared against the expected answer, and **immediately discarded with no storage, no logging, and no forwarding to any third party beyond the minimal processing necessary**, sits closely to the fact pattern the FTC described ("replacement of written words... to fulfill a request"), which supports **not** requiring VPC for that narrow flow. However: (1) this exact scenario (an educational quiz answer, not a voice-assistant command) has not been the subject of an FTC enforcement action or additional guidance that this research could locate, so it is **UNVERIFIED** whether the FTC would treat "answer a math question" identically to "perform a search"; (2) using a **third-party cloud STT/AI vendor** introduces a disclosure-to-a-third-party question that must be resolved by contract (the vendor must act strictly as your service provider, processing only for your instructed purpose, not for its own purposes) — see §3.4.

### 3.3 The FTC's 2025 COPPA Rule amendments

Sources: [FTC press release, Jan. 2025](https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-finalizes-changes-childrens-privacy-rule-limiting-companies-ability-monetize-kids-data); [Federal Register notice, Apr. 22, 2025](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule); secondary legal summary used only to locate/confirm these primary facts: [Securiti — FTC's 2025 COPPA Final Rule Amendments](https://securiti.ai/ftc-coppa-final-rule-amendments/).

Key changes relevant to this project:

- The amended Rule **expands "personal information" to include biometric identifiers usable for automated/semi-automated recognition of an individual**, and **explicitly lists voiceprints** alongside fingerprints, iris/retina patterns, and facial templates as examples of biometric identifiers.
- The Commission **considered but declined to add new consent exceptions for biometric data**, "other than the exception to prior parental consent for the collection of audio files containing a child's voice" — i.e., the 2017 audio-file exception (§3.2) survives unchanged as the sole carve-out; anything that would count as a biometric "voiceprint" (e.g., voice fingerprinting/identification, as opposed to transient transcription) falls under the new, stricter biometric-identifier category and would need VPC.
- The Final Rule took effect **June 23, 2025**, with a **365-day compliance window** from the April 22, 2025 Federal Register publication date (i.e., full compliance required by roughly April 2026).
- Other 2025 changes (separate consent for third-party disclosure/targeted advertising, tightened data-retention/minimization requirements, updated data security program requirements) generally raise the bar on sharing any child data — including voice-derived data — with third parties such as an AI/analytics vendor, reinforcing that a cloud voice-AI integration needs a clean service-provider relationship, not a general-purpose third-party API call with child audio in the payload.

### 3.4 Verifiable Parental Consent (VPC) — approved methods (16 CFR 312.5)

Source: [16 CFR 312.5(b)(2), via Cornell LII](https://www.law.cornell.edu/cfr/text/16/312.5). The Rule enumerates specific approved methods (an operator may also petition the FTC to approve additional methods, as ESRB did for a facial-age-estimation method, per the [2023 Federal Register notice](https://www.federalregister.gov/documents/2023/07/20/2023-15415/childrens-online-privacy-protection-rule-proposed-parental-consent-method-application-of-the-esrb)):

1. A signed consent form returned by postal mail, fax, or electronic scan.
2. A parent using a credit/debit card or other online payment system that provides transaction notification, in connection with a monetary transaction.
3. A toll-free number staffed by trained personnel.
4. A video-conference call with trained personnel.
5. Checking a form of government-issued ID against a database, with the ID discarded promptly after verification.
6. Answering a series of knowledge-based dynamic, multiple-choice questions where guessing correctly is improbable.
7. Facial-recognition comparison of a submitted government photo ID against a live selfie, verified by trained personnel.
8. Email combined with additional confirmatory steps ("email plus").
9. A text-message-based method combined with additional confirmatory steps.

None of these are "click I agree" — all require friction that a self-serve consumer app must design around (typically: a parent-facing onboarding flow, e.g., email+additional step, or a payment-card "$0" verification charge).

### 3.5 UK Age Appropriate Design Code (ICO)

Source: [ICO — Introduction to the Children's code](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/introduction-to-the-childrens-code/) (fetch of this exact page was blocked by the site in this research pass — content below is reconstructed from ICO's own page title/summary metadata surfaced in search and is marked accordingly).

- The Code ("Children's Code") applies to **"information society services likely to be accessed by children"** operating in/targeting the UK — a broader trigger than "directed at children," since it can apply even if children are not your intended audience. **UNVERIFIED beyond this summary** — the primary page itself could not be fetched directly in this session; treat exact wording as needing re-verification at ico.org.uk before relying on it.
- Reported standards (per ICO's own code, generally described): privacy settings **high by default**, **data minimization**, geolocation off by default, no "nudge techniques" pushing children to weaken privacy settings or over-share.
- Non-compliance is enforceable by the ICO under UK GDPR, with fines up to **4% of global annual turnover**.

### 3.6 GDPR Article 8 ("GDPR-K")

Source: [gdpr-info.eu — Art. 8 GDPR](https://gdpr-info.eu/art-8-gdpr/) (unofficial but widely-used consolidated text mirror of the official EU Regulation 2016/679).

> "Where point (a) of Article 6(1) applies, in relation to the offer of information society services directly to a child, the processing of the personal data of a child shall be lawful **where the child is at least 16 years old**. Where the child is below the age of 16 years, such processing shall be lawful only if and to the extent that consent is given or authorised by the holder of parental responsibility over the child. **Member States may provide by law for a lower age for those purposes provided that such lower age is not below 13 years.**"

Controllers must make "reasonable efforts to verify" that consent was given by the parent, "taking into consideration available technology." This is directly analogous to, but legally separate from, COPPA's VPC — relevant only if the app has EU users; note the age threshold (13–16, member-state-dependent) is higher than COPPA's flat 13.

---

## 4. Distribution alternatives

### 4.1 iOS PWA (home-screen web app) microphone/WebRTC limits

- `getUserMedia()` is, per MDN, **"widely available"** and has been supported across browsers, including desktop/mobile Safari, **since September 2017**, and it strictly requires a **secure context** (HTTPS or `localhost`) — in an insecure context `navigator.mediaDevices` is simply `undefined`. ([MDN: MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia))
- Per [caniuse.com/stream](https://caniuse.com/stream), **iOS Safari has supported `getUserMedia`/Media Capture and Streams since version 11**.
- Safari 17.4's WebKit release notes ([webkit.org/blog/15063/webkit-features-in-safari-17-4](https://webkit.org/blog/15063/webkit-features-in-safari-17-4/)) confirm ongoing WebRTC-stack fixes (media track constraint handling, framerate degradation behavior) as of that release, i.e., WebRTC is an actively maintained part of WebKit, not a legacy/frozen feature.
- **UNVERIFIED / could not confirm from a primary source in this session**: whether microphone access and WebRTC behave identically inside a **home-screen-installed** PWA (`display: standalone`, launched from the Home Screen icon) versus a normal Safari tab on iOS. This is a well-known pain point historically raised by web developers, and Apple made and then reversed a controversial change to home-screen web app behavior in the EU around iOS 17.4 (widely reported in the press at the time), but this research could not locate a current, still-live Apple or WebKit primary-source page describing that episode or confirming present-day mic/WebRTC parity for installed PWAs (`developer.apple.com/support/dma-and-apps-in-the-eu/` was checked directly and does not mention PWAs at all). **Recommendation: test on a real iOS device before relying on PWA + microphone as the primary product**, rather than trusting this from docs alone.

### 4.2 TestFlight (Apple)

Source: [developer.apple.com/testflight](https://developer.apple.com/testflight/).

- **Internal testing**: up to **100 testers** (must be members of your Apple Developer team/organization) — **no App Review required**, and builds can be set to auto-distribute to the group.
- **External testing**: up to **10,000 testers** — **requires App Review**: "your builds are automatically sent for review once they're added to a group," and your first external build must already be approved before external testing can begin.
- Both modes: up to **100 builds**, testers can access builds across up to **30 devices**, and testers use the TestFlight app to receive invites and install betas.
- **UNVERIFIED in this pass**: the commonly-cited "builds expire after 90 days" limit was not directly confirmed against a current Apple primary-source page in this session (the Apple Support TestFlight guide page returned a 404 on the URL attempted) — treat as needing re-confirmation, though it is a long-standing, widely corroborated TestFlight behavior.
- **Practical read**: for a solo-developer, family-only rollout, **internal TestFlight testing is the cleanest path** — no review gate, small known set of testers (e.g., your own family/close friends' kids), fast iteration.

### 4.3 Web-first / browser-only distribution

COPPA is medium-agnostic: it applies to any "operator of a Web site or online service" directed at children or with actual knowledge of collecting data from a child under 13, with no carve-out for distributing outside an app store. Shipping as a website instead of a native/store app **does not reduce your COPPA obligations** — the same personal-information, notice, and VPC requirements from §3 apply identically. (General FTC COPPA guidance restates this operator definition across its compliance materials; no app-store-specific exemption exists.) The practical benefit of web-first distribution is avoiding Apple/Google's *additional* Kids Category/Families policy layers (§2) while you validate the product, not avoiding COPPA itself.

### 4.4 Android equivalents

- **Chrome/Android PWA mic support**: Chrome for Android is Chromium-based and implements the same standard `getUserMedia`/WebRTC APIs referenced in §4.1; Chromium's general web-platform support for these APIs is mature and has been stable for years. **UNVERIFIED specific citation**: this research could not retrieve a current, specific `developer.chrome.com` page confirming installed-PWA (vs. tab) mic-permission parity on Android in this session (two attempted URLs 404'd and a search-engine fallback was blocked by a CAPTCHA after the WebSearch tool budget was exhausted) — the general Chromium/W3C standard-support claim is solid, but the Android-PWA-specific nuance should be spot-checked at [developer.chrome.com](https://developer.chrome.com/) or by direct device testing before relying on it.
- **Google Play internal testing track**: per [Play Console Help](https://support.google.com/googleplay/android-developer/answer/9845334), internal testing supports **up to 100 testers**, and internal tests **"might not be subject to standard Play policy or security reviews,"** are exempt from inclusion in the Data Safety section, and become available to testers within minutes — Android's direct analog to TestFlight's internal track, and similarly the cleanest family-only rollout path.

---

## 5. Existing open-source math game repos as starting points

All entries below were verified live via the GitHub REST API (`api.github.com/search/repositories`) and, for the top candidates, by fetching the repo page directly, on 2026-09-09. "License: None" means GitHub's license detector found no `LICENSE` file (i.e., all-rights-reserved by default, not open-source-usable without contacting the author) — that materially matters if you intend to fork/reuse code, not just study it.

| Repo | Stack | License | Stars | Last push | Notes |
|---|---|---|---|---|---|
| [alsharafiabdulmalek/MathEdu-Unity-Game](https://github.com/alsharafiabdulmalek/MathEdu-Unity-Game) | Unity 6, C# | Not specified in repo (bundled commercial UI asset pack under separate terms) | 1 | 2026-05-19 | **Closest direct match**: mobile educational math game explicitly for **grades 1–5**, 5 learning modes (Learn/Practice/Quiz/Story/Speed Round), 11 math topics, EN+AR localization, parental controls, achievement/progress tracking. Very small project (1 star) — useful as an architecture reference, not a battle-tested base. |
| [tamakiramimy/kids-learning-games](https://github.com/tamakiramimy/kids-learning-games) | React + TypeScript + Phaser + Electron + Capacitor | Referenced but not fully confirmed (see `THIRD_PARTY_NOTICES.md` in repo) | 1 | 2026-08-30 (very recent) | Offline-first (explicitly: "Android application doesn't request internet permissions"), ages 3–6, includes a math module among others; directly demonstrates the Phaser+Capacitor path to native Android/iOS from a web codebase. |
| [jaysavsani07/math-metrix](https://github.com/jaysavsani07/math-metrix) | Flutter (Dart) | None detected | 447 | 2025-11-03 | Most-starred Flutter math game found; general audience (not specifically K-5), but a solid, actively-maintained reference for Flutter game/quiz UI patterns. |
| [lakshmanroy/Math_Game_for_Kids](https://github.com/lakshmanroy/Math_Game_for_Kids) | Kotlin (native Android) | None detected | 34 | 2024-02-03 | Native Android kids' math app, previously shipped on Play Store per its own description; useful native-Kotlin reference. |
| [alyanwarr/Kidjent-Application](https://github.com/alyanwarr/Kidjent-Application) | Java (native Android) | None detected | 26 | 2017-01-02 (stale) | Explicitly "ages 5-10," combined math+English; stale (no commits since 2017) but closest age-range match among native-Android options. |
| [nividata-consultancy/math-riddle-free](https://github.com/nividata-consultancy/math-riddle-free) | Flutter (Dart) | **GPL-3.0** | 10 | 2025-07-19 | Genuinely open-source (copyleft) Flutter math game, previously live on Play Store; GPL-3.0 means derivative apps must also be released under GPL-3.0 — a real constraint if you plan a closed-source or paid product. |
| [David-Turley/ElementaryMathGame](https://github.com/David-Turley/ElementaryMathGame) | Visual Basic .NET | **MIT** | 2 | 2023-04-05 | Targets 4th/5th graders; MIT-licensed (permissive) but wrong stack (VB.NET, not mobile) — conceptual/content reference only. |
| [40ants/multitrainer](https://github.com/40ants/multitrainer) | Common Lisp | None detected | 26 | 2026-08-22 (active) | Actively maintained multiplication trainer for kids; wrong stack for a mobile app but shows sustained-maintenance is possible for this niche. |

**Takeaway**: there is **no mature, permissively-licensed, actively-maintained K-5-specific mobile math game template** ready to fork as-is. The closest content/age-range fits (`MathEdu-Unity-Game`, `Kidjent-Application`) are tiny, single-contributor, unlicensed-or-stale projects; the most-starred/most-active projects (`math-metrix`, `multitrainer`) are not K-5-specific and/or not mobile-native. `nividata-consultancy/math-riddle-free` is the only genuinely OSS-licensed, mobile, actively-recent option, but its GPL-3.0 license is a real consideration for a commercial product. Practically, this supports **building from a general-purpose engine/template (Flutter+Flame or Unity) rather than forking an existing math-game repo**, treating the above only as UI/architecture references.

---

## Recommended stack and why

**React Native/Expo (current `expo-audio`, not the deprecated `expo-av`) with Reanimated for UI/gesture animation and Rive for the character, using LiveKit's official React Native SDK for the voice-AI path, shipped first as an internal-TestFlight/Play-internal-track native app, with no third-party analytics/ad SDKs.** Flutter + Rive (or, if the product later grows more game-mechanics-heavy, Flutter + Flame) is an equally strong second choice — pick it instead if you or a collaborator already know Dart/Flutter better than TypeScript/React.

Reasoning:

- **This product is a gamified app (streaks, badges, profile customization, a reactive talking character), not a physics/platformer game** — so the deciding factor is less "which engine has the best 2D physics" and more "which stack builds ordinary app screens fast *and* has a solid animation library *and* an official LiveKit SDK." React Native and Flutter both clear that bar; Unity and Godot are strong dedicated game engines but bring real overhead (bigger binaries, engine-specific tooling, less natural fit for standard list/form/profile UI) that this product shape doesn't need — reserve them for a later iteration if the product grows more game-mechanics-heavy.
- **Rive over Lottie for the character**, tentatively: Rive's state-machine model (§1.7) is a better fit for a character that needs to *react* to game events (celebrate on a correct streak, encourage on a wrong answer, idle-loop while waiting) rather than just play a fixed clip — and it has official, MIT-licensed runtimes on both RN and Flutter. The tradeoff is Rive's paid export tier (~$9/seat/mo, unverified exact commercial terms) versus Lottie's fully free, Apache-2.0/MIT tooling; if budget is the binding constraint, Lottie (via After Effects/Bodymovin, free to author) is a perfectly viable fallback for simpler triggered animations, accepting a less reactive character.
- **Neither Rive nor Lottie has a documented, built-in audio-lipsync feature** (§1.7) — budget custom engineering (e.g., driving a Rive state-machine "talking" input from TTS audio-amplitude) if precise mouth-sync to the character's voice is a must-have; a simpler "mouth open/closed while audio is playing" loop is achievable without it.
- React Native/Expo has an **official** LiveKit SDK ([client-sdk-react-native](https://github.com/livekit/client-sdk-react-native)), workable mic support via `expo-audio`, and a fully offline-capable core loop (game/streak/badge logic works with no network; only the cloud voice-AI step needs connectivity). Flutter's position is essentially identical on all these axes, plus it has Google's own casual-games endorsement ([flutter.dev/games](https://flutter.dev/games)) if the game-mechanics side grows later — hence "equally strong second choice" rather than a clear loser.
- Godot is the weakest fit for a LiveKit-based voice pipeline specifically: LiveKit has **no official SDK** for it (§1.4), only a third-party community GDExtension — a real integration risk if the voice-AI vendor integration matters. Unity, by contrast, has both an official LiveKit SDK and an official Rive runtime, so it remains a credible (if heavier) fallback if the product pivots toward more game mechanics.
- A **Phaser/PixiJS PWA is the right *starting* environment**, not necessarily the shipping one: it lets you validate the voice-input UX cheaply and web-first (§4.3) using the same official LiveKit JS SDK, while you confirm — by direct device testing, since the docs couldn't settle this (§4.1) — whether iOS home-screen-installed mic access is reliable enough for a young child's single-tap flow. If it is, PWA/web-first can remain the long-term distribution path and sidesteps §2's Kids Category/Families policy machinery entirely (though not COPPA itself, §4.3). If it isn't reliable, fall back to the native React Native (or Flutter) build.
- **Policy-wise**, plan the product from day one with **zero third-party analytics and zero third-party ads** — both Apple (§2.1–2.2) and Google (§2.3) effectively require this for anything aimed at kids, and it also simplifies COPPA compliance by minimizing "third parties" that ever see a child's data.
- **Legally, the voice-answer flow should be designed to fit the FTC's narrow 2017 exception**: capture audio only to transcribe/evaluate a specific spoken answer, use a voice-AI vendor under a strict service-provider/no-further-use contract, retain nothing, disclose the flow and deletion policy in a privacy policy, and avoid any secondary use (no voice-print/speaker-identification features, which the 2025 amendments now separately regulate as biometric data, §3.3). Given this is fact-specific and untested by enforcement (§3.2), treat this as the "no VPC needed" design goal, but build the data pipeline so that adding full VPC (§3.4) later is a contained change, not a rearchitecture, in case the FTC's actual-scope reading turns out to be narrower than expected.
- **Distribution**: start with **TestFlight internal testing** (§4.2, no App Review, up to 100 testers, ideal for a "just my family/close friends" rollout) and/or **Google Play's internal testing track** (§4.4, same no-review benefit), and only pursue Kids Category/Families Policy listing (§2) once the product, privacy policy, and consent flow are fully built out for a public launch.

---

## Sources

**Tech / SDKs**
- [LiveKit Docs home](https://docs.livekit.io/)
- [LiveKit React Native SDK (GitHub)](https://github.com/livekit/client-sdk-react-native) / [quickstart](https://docs.livekit.io/transport/sdk-platforms/react-native/)
- [LiveKit Flutter SDK (GitHub)](https://github.com/livekit/client-sdk-flutter) / [pub.dev](https://pub.dev/packages/livekit_client) / [API docs](https://docs.livekit.io/reference/client-sdk-flutter/index.html)
- [LiveKit Unity SDK (GitHub)](https://github.com/livekit/client-sdk-unity) / [Unity WebGL SDK](https://github.com/livekit/client-sdk-unity-web) / [connect docs](https://docs.livekit.io/home/client/connect/)
- [LiveKit Swift SDK (GitHub)](https://github.com/livekit/client-sdk-swift)
- [LiveKit Android SDK (GitHub)](https://github.com/livekit/client-sdk-android)
- [LiveKit JS/Web SDK (GitHub)](https://github.com/livekit/client-sdk-js) / [reference docs](https://docs.livekit.io/reference/client-sdk-js/) / [quickstart](https://docs.livekit.io/home/quickstarts/javascript/)
- [Community Godot LiveKit GDExtension](https://github.com/NodotProject/godot-livekit) / [Godot Asset Library listing](https://godotengine.org/asset-library/asset/4934)
- [Expo — Audio (expo-audio) docs](https://docs.expo.dev/versions/latest/sdk/audio/) / [Audio (expo-av) SDK 54 deprecation notice](https://docs.expo.dev/versions/v54.0.0/sdk/audio-av/) / [expo/expo#37259](https://github.com/expo/expo/issues/37259) / [expo/expo PR #36020](https://github.com/expo/expo/pull/36020)
- [Flame Engine site](https://flame-engine.org/) / [docs](https://docs.flame-engine.org/latest/) / [GitHub](https://github.com/flame-engine/flame)
- [Flutter Casual Games Toolkit](https://flutter.dev/games) / [Flutter+Flame Codelab](https://codelabs.developers.google.com/codelabs/flutter-flame-brick-breaker)
- [Rive — runtimes overview](https://rive.app/docs/runtimes/) / [Rive — Unity game runtime](https://rive.app/docs/game-runtimes/unity) / [Rive — state machine docs](https://rive.app/docs/editor/state-machine/state-machine) / [Rive pricing](https://rive.app/pricing)
- [rive-app GitHub org](https://github.com/rive-app) — [rive-react-native](https://github.com/rive-app/rive-react-native), [rive-flutter](https://github.com/rive-app/rive-flutter) ([pub.dev](https://pub.dev/packages/rive)), [rive-ios](https://github.com/rive-app/rive-ios), [rive-android](https://github.com/rive-app/rive-android), [rive-wasm](https://github.com/rive-app/rive-wasm), [rive-react](https://github.com/rive-app/rive-react), [rive-unity](https://github.com/rive-app/rive-unity)
- [lottie-react-native/lottie-react-native (canonical RN repo)](https://github.com/lottie-react-native/lottie-react-native)
- [airbnb/lottie-ios](https://github.com/airbnb/lottie-ios), [airbnb/lottie-android](https://github.com/airbnb/lottie-android), [airbnb/lottie-web](https://github.com/airbnb/lottie-web)
- [pub.dev/packages/lottie (unofficial Flutter port)](https://pub.dev/packages/lottie) / [xvrh/lottie-flutter](https://github.com/xvrh/lottie-flutter)
- [Apple SwiftUI — PhaseAnimator](https://developer.apple.com/documentation/swiftui/phaseanimator) / [KeyframeAnimator](https://developer.apple.com/documentation/swiftui/keyframeanimator)
- [React Native Reanimated docs](https://docs.swmansion.com/react-native-reanimated/)
- [Godot — Recording with microphone](https://docs.godotengine.org/en/stable/tutorials/audio/recording_with_microphone.html) / [AudioStreamMicrophone class ref](https://docs.godotengine.org/en/stable/classes/class_audiostreammicrophone.html)
- [Unity — Microphone scripting API](https://docs.unity3d.com/ScriptReference/Microphone.html)
- [Android SpeechRecognizer API reference](https://developer.android.com/reference/android/speech/SpeechRecognizer)
- [Apple Speech framework / SFSpeechRecognizer](https://developer.apple.com/documentation/speech/sfspeechrecognizer) / [SpeechAnalyzer WWDC25](https://developer.apple.com/videos/play/wwdc2025/277/)
- [MDN — MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [caniuse — Media Capture and Streams (getUserMedia)](https://caniuse.com/stream)
- [WebKit — Safari 17.4 release notes blog](https://webkit.org/blog/15063/webkit-features-in-safari-17-4/)

**App store policy**
- [Apple App Store Review Guidelines (§1.3, §5.1.4)](https://developer.apple.com/app-store/review/guidelines/)
- [Apple — parental gates](https://developer.apple.com/app-store/kids-apps/)
- [Google Play Families Policies](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en)
- [Google Play Families Self-Certified Ads SDK Policy](https://support.google.com/googleplay/android-developer/answer/12918983?hl=en)
- [Comply with Google Play's Families Policy using AdMob](https://support.google.com/admob/answer/6223431?hl=en)
- [Google Play — Internal testing overview](https://support.google.com/googleplay/android-developer/answer/9845334)

**Law**
- [16 CFR 312.2 — Definitions (Cornell LII / eCFR mirror)](https://www.law.cornell.edu/cfr/text/16/312.2)
- [16 CFR 312.5 — Parental consent (Cornell LII / eCFR mirror)](https://www.law.cornell.edu/cfr/text/16/312.5)
- [FTC — Enforcement Policy Statement re: COPPA Rule and Voice Recordings (index page)](https://www.ftc.gov/legal-library/browse/federal-trade-commission-enforcement-policy-statement-regarding-applicability-childrens-online)
- [FTC press release, Oct. 23, 2017 — additional guidance on COPPA voice recordings](https://www.ftc.gov/news-events/news/press-releases/2017/10/ftc-provides-additional-guidance-coppa-voice-recordings)
- [Federal Register, Dec. 8, 2017 — Enforcement Policy Statement text](https://www.federalregister.gov/documents/2017/12/08/2017-26509/enforcement-policy-statement-regarding-the-applicability-of-the-coppa-rule-to-the-collection-and-use)
- [FTC press release, Jan. 2025 — Final COPPA Rule changes](https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-finalizes-changes-childrens-privacy-rule-limiting-companies-ability-monetize-kids-data)
- [Federal Register, Apr. 22, 2025 — Children's Online Privacy Protection Rule (final rule)](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule)
- [Securiti — summary of FTC's 2025 COPPA Final Rule Amendments](https://securiti.ai/ftc-coppa-final-rule-amendments/) *(secondary source, used only to help locate/confirm primary FTC facts)*
- [Federal Register, 2023 — ESRB proposed VPC method](https://www.federalregister.gov/documents/2023/07/20/2023-15415/childrens-online-privacy-protection-rule-proposed-parental-consent-method-application-of-the-esrb)
- [ICO — Introduction to the Children's code](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/introduction-to-the-childrens-code/) *(page could not be directly fetched in this session; treat summary as UNVERIFIED pending re-check)*
- [gdpr-info.eu — Art. 8 GDPR text](https://gdpr-info.eu/art-8-gdpr/)

**Distribution**
- [Apple — TestFlight](https://developer.apple.com/testflight/)
- [Apple — DMA and apps in the EU](https://developer.apple.com/support/dma-and-apps-in-the-eu/) *(checked directly; does not mention PWAs — cited to show the gap, not to support a claim)*

**Open-source repos** (all verified via GitHub API / direct repo fetch, 2026-09-09)
- [alsharafiabdulmalek/MathEdu-Unity-Game](https://github.com/alsharafiabdulmalek/MathEdu-Unity-Game)
- [tamakiramimy/kids-learning-games](https://github.com/tamakiramimy/kids-learning-games)
- [jaysavsani07/math-metrix](https://github.com/jaysavsani07/math-metrix)
- [lakshmanroy/Math_Game_for_Kids](https://github.com/lakshmanroy/Math_Game_for_Kids)
- [alyanwarr/Kidjent-Application](https://github.com/alyanwarr/Kidjent-Application)
- [nividata-consultancy/math-riddle-free](https://github.com/nividata-consultancy/math-riddle-free)
- [David-Turley/ElementaryMathGame](https://github.com/David-Turley/ElementaryMathGame)
- [40ants/multitrainer](https://github.com/40ants/multitrainer)

**Notes on unverified items**: iOS home-screen PWA mic/WebRTC parity with Safari tabs (§4.1); Android installed-PWA mic parity specific citation (§4.4); TestFlight's 90-day build expiration (§4.2); ICO Children's Code exact standards wording (§3.5); Rive's exact commercial/export licensing terms on paid vs. free tiers (§1.7); whether Rive or Lottie has any built-in audio-lipsync/viseme feature, as opposed to custom-wired audio-driven inputs (§1.7); exact SwiftUI `PhaseAnimator`/`KeyframeAnimator` API text and minimum-OS availability (§1.7) — all flagged inline above and should be re-confirmed before being treated as settled facts in a build decision.

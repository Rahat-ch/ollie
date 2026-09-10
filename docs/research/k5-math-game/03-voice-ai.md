# Voice AI for a K-5 Math Game (Primary User: US 1st Grader, Age 6–7)

**Research date: 2026-09-09.** All claims are cited inline to primary sources (vendor docs, pricing pages, API references, statute/rule text, peer-reviewed papers, official repos). Anything not confirmed against a primary source this session is marked **UNVERIFIED**. Several vendor pricing pages are client-rendered SPAs that return no static numbers to automated fetch — those are flagged individually.

---

## Summary — 10 decision-relevant findings

1. **Two vendor ToS clauses eliminate the two most obvious choices for child *audio input*.** ElevenLabs' Privacy Policy §11 states "All users are **strictly prohibited** from uploading, transmitting, emailing, or otherwise making Voice Data from children under the age of 18 available to us or other users or using them for any of our Services" ([elevenlabs.io/privacy-policy](https://elevenlabs.io/privacy-policy), updated 2026-05-20). The Gemini Developer API terms state "You also will not use the Services as part of a website, application, or other service … that is directed towards or is likely to be accessed by individuals under the age of 18" ([ai.google.dev/gemini-api/terms](https://ai.google.dev/gemini-api/terms), 2026-04-28). **ElevenLabs Conversational AI and Gemini Live API are off the table for child speech input** as written. (ElevenLabs TTS *output*, which sends no child audio, is a different question — see §2.)
2. **OpenAI does permit under-13 end users, but conditionally**: "You should not use OpenAI services to process any personal data of children under 13 … **without first implementing zero data retention in our API**" ([Under-18 API Guidance](https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance)). ZDR requires prior approval and covers `/v1/realtime`, `/v1/audio/speech`, `/v1/audio/transcriptions` ([your-data](https://developers.openai.com/api/docs/guides/your-data)). So the OpenAI Realtime path is legally workable, but gated on a ZDR approval you must secure before launch.
3. **A child's voice is COPPA "personal information" twice over.** 16 CFR 312.2 lists "A photograph, video, or audio file where such file contains a child's image or voice", and the 2025 amendments added "A biometric identifier … such as … **voiceprints**" ([law.cornell.edu/cfr/text/16/312.2](https://www.law.cornell.edu/cfr/text/16/312.2)). The escape hatch is the FTC's non-enforcement policy for voice used purely as a replacement for typing — see finding 4.
4. **The FTC's voice-as-text safe harbor is the single most important design constraint.** Per the FTC's COPPA FAQ: "when an operator collects an audio file containing a child's voice **solely as a replacement for written words** … and only maintains the file for the **brief time necessary** for that purpose, the FTC will not take an enforcement action" ([FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions), FAQ F.6; underlying [2017 Enforcement Policy Statement](https://www.ftc.gov/legal-library/browse/federal-trade-commission-enforcement-policy-statement-regarding-applicability-childrens-online)). Design so the child's audio is *only* ever "say the answer / say next" — never open-ended chat, never a name — and delete it immediately. That posture is compatible with an ASR-only pipeline and **incompatible** with a chatty full-duplex agent that retains conversation transcripts.
5. **If you ship in Apple's Kids Category, cloud voice is effectively banned.** Guideline 1.3: "Kids Category apps **may not send personally identifiable information or device information to third parties**" ([App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)). Google Play Families: apps solely targeting children "must not contain any APIs or SDKs that are not approved for use in primarily child-directed services" ([Play Families policy](https://support.google.com/googleplay/android-developer/answer/9893335)). This pushes hard toward on-device ASR.
6. **Children's speech is genuinely much harder for ASR, and no vendor publishes age-segmented WER.** Zero-shot Whisper measures **12.5–20.6% WER on MyST** and **19.9–53.8% on OGI Kids** depending on model size ([Fan/Shankar/Alwan 2024](https://arxiv.org/html/2406.10507v1)); Kid-Whisper reports Whisper-Small at **13.93% zero-shot → 9.11% fine-tuned** on MyST ([arXiv:2309.07927](https://arxiv.org/abs/2309.07927)). Deepgram, AssemblyAI, Google, Azure and OpenAI publish **no** child-speech WER — a confirmed transparency gap, not a search failure.
7. **Your vocabulary is closed, so don't use open-vocabulary ASR for answers.** Digits 0–100 plus ~6 commands is a finite grammar. **Vosk's `SetGrammar()` actually prunes the Kaldi FST decoding graph** to a supplied phrase list ([vosk-api test_words.py](https://raw.githubusercontent.com/alphacep/vosk-api/master/python/example/test_words.py)) — a genuinely harder constraint than any cloud vendor's soft phrase-boost. Picovoice Rhino claims ">99% accuracy in clean … 97% accuracy in noisy environments with SNR 9dB" for offline slot grammars ([Rhino FAQ](https://picovoice.ai/docs/faq/rhino/)).
8. **Do not design around Azure's `IntentRecognizer`/`PatternMatchingModel` — it was retired 2025-09-30** ([migrate-intent-recognition](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/migrate-intent-recognition)). Azure's live replacement lever is **phrase lists** (up to ~2,000 phrases, weight 0.0–2.0), which also work inside the **Azure Voice Live API** realtime agent via `session.input_audio_transcription.phrase_list` ([voice-live-how-to-customize](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-how-to-customize)).
9. **Because nearly every line is known in advance, pre-render the character voice — the whole voice-asset budget is under $25.** 2,000 lines × 60 chars ≈ 120k characters costs $0.48 on Google Standard (free under the 4M-char tier) up to ~$22 on ElevenLabs v3 (§2.4). Pre-rendering buys a permanently consistent voice, zero runtime latency, offline playback, QA-able audio — and it ships *no user data* to the vendor, sidestepping the child-audio ToS problem entirely. **Amazon Polly has the clearest license for this**: "You can cache and replay Amazon Polly's generated speech at no additional cost" ([Polly FAQ](https://aws.amazon.com/polly/faqs/)). If you want an actual *child*-sounding voice off the shelf, Polly has Ivy/Justin/Kevin ("child") and Azure has `en-US-AnaNeural` ("Female, Child"); if you want a designed *cartoon character*, ElevenLabs Voice Design is the only text-prompt-to-voice tool surveyed.
10. **Cost swing across architectures is ~30x.** For one child at 20 min/day (600 min/month): fully on-device ≈ **$0/month recurring**; hybrid (on-device ASR + pre-rendered clips + occasional LLM) ≈ **well under $1/month**; full cloud realtime agent ≈ **$7–$48/month** depending on vendor, because realtime agents bill wall-clock session time and 6-year-olds spend most of a session silently thinking. Full details in §5.

---

## 1. Full-duplex voice agent platforms

### 1.1 At-a-glance

| Platform | Client transport | Derived $/min (audio only) | Turn detection | Can tools reach in-app game state? | Under-13 end users permitted by ToS? |
|---|---|---|---|---|---|
| **LiveKit Agents** | WebRTC (client↔agent) | $0.01/min agent-session + model costs ([pricing](https://livekit.com/pricing)) | Semantic + acoustic EOU model | **Yes** — `RunContext` / session userdata in `@function_tool` | Silent on age; SOC 2 Type II, DPA, "audio … aren't logged or kept" for inference ([security](https://livekit.com/security)) |
| **Pipecat / Pipecat Cloud (Daily)** | WebRTC (Daily / LiveKit / SmallWebRTC) or WebSocket | $0.01–0.03/min compute + transport + models ([pricing](https://www.daily.co/pricing/pipecat-cloud/)) | Smart Turn v3 (BSD-2, Whisper-Tiny-based, CPU) | **Yes** — `FunctionCallParams.result_callback` | Not stated (self-hostable OSS, BSD-2) |
| **Vapi** | WebRTC via Daily, or raw WebSocket | $0.05/min platform fee + at-cost STT/LLM/TTS ([pricing](https://vapi.ai/pricing)) | Bundled, not separately documented | **No** — server-webhook tools only | Not verified |
| **OpenAI Realtime** (`gpt-realtime-2.1`) | **WebRTC recommended for browser/mobile**, WS for server | ~$0.048/min turn-taking, ~$0.096 full-duplex; mini ~$0.015–0.030 | Native to model | **Yes** — `session.update` function tools + MCP | **Yes, with ZDR** ([guidance](https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance)) |
| **Google Gemini Live** | **WebSocket only** | ~$0.0115/min turn-taking, $0.023 full-duplex ([pricing](https://ai.google.dev/gemini-api/docs/pricing)) | Native to model | Yes, but **manual** — "doesn't support automatic tool response handling" | **NO — explicitly prohibited** ([terms](https://ai.google.dev/gemini-api/terms)) |
| **Amazon Nova 2 Sonic** | **Backend only** (SigV4; no browser-direct path) | UNVERIFIED (no published audio-token/duration rate) | Built into unified S2S model | Yes, via `toolUse`/`toolResult` | Not stated; AWS uses content for service improvement **by default** unless you opt out ([AI opt-out policy](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_ai-opt-out.html)) |
| **ElevenLabs Agents** | WebSocket, or WebRTC-via-LiveKit (RN SDK) | $0.080/min overage ([pricing](https://elevenlabs.io/pricing/agents)) | Proprietary turn-taking model | **Yes** — Client Tools run in your app | **NO for voice input** — see §4 |
| **Azure Voice Live API** | WebSocket (server-to-server) | UNVERIFIED (pricing page JS-rendered) | "Advanced end-of-turn detection", noise suppression, echo cancellation | Yes — function calling | Azure is B2B; real-time STT is "no data trace" ([data-privacy-security](https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/speech-service/speech-to-text/data-privacy-security)) |

### 1.2 LiveKit Agents

**Architecture.** "LiveKit WebRTC is used between the frontend and the agent, while the agent communicates with your backend using HTTP and WebSockets" ([docs.livekit.io/agents](https://docs.livekit.io/agents/)). The media server is an Apache-2.0 self-hostable WebRTC SFU in Go ([github.com/livekit/livekit](https://github.com/livekit/livekit)). Current release: **`livekit-agents@1.8.0`, published 2026-09-05** ([GitHub releases](https://github.com/livekit/agents/releases)).

**Turn detection.** "Predicts end of turn from both the meaning of speech and its acoustic properties, on top of VAD", enabled by default in `AgentSession` ([docs.livekit.io/agents/logic/turns](https://docs.livekit.io/agents/logic/turns/)). The model is distilled from Qwen2.5-0.5B-Instruct, exported to INT8 ONNX, requires **<500MB RAM, CPU-only**, 14 languages ([huggingface.co/livekit/turn-detector](https://huggingface.co/livekit/turn-detector); [plugin README](https://github.com/livekit/agents/blob/main/livekit-plugins/livekit-plugins-turn-detector/README.md)). Published benchmark: "At a 300 ms latency budget, it reaches a 9.9% false-cutoff rate, compared with 12.9% for Deepgram Flux and 27.7% for ultraVAD… At a 5% false-cutoff target it reaches 543 ms mean latency… At 10% it reaches 295 ms" ([LiveKit blog](https://livekit.com/blog/solving-end-of-turn-detection)). **These are LiveKit-run benchmarks on adult speech — UNVERIFIED for 6-year-olds**, and turn detection on children (long thinking pauses, false starts, "ummm… seven!") is exactly where a generic EOU model is most likely to misfire. Note also the licensing split: the bundled **v1-mini is Apache-2.0**; the best-performing full v1 model is **cloud-hosted only** under a LiveKit Model License.

**Pricing** ([livekit.com/pricing](https://livekit.com/pricing)): Build $0/mo (1,000 agent-session min, 5 concurrent sessions, 5,000 WebRTC participant-min); Ship $50/mo minimum; Scale $500/mo minimum. Overage: **agent-session minutes $0.01/min**; bandwidth $0.12/GB (Ship) / $0.10/GB (Scale); SIP $0.003–0.004/min. LiveKit Inference gateway example: "OpenAI GPT-4o mini: $0.0006/min". The raw WebRTC participant-minute overage rate is **UNVERIFIED**.

**Plugins.** Docs explicitly name LLM: OpenAI, Google; STT: Deepgram, AssemblyAI; TTS: Cartesia, Inworld, Fish Audio; plus a unified **LiveKit Inference** gateway spanning "OpenAI, Google, AssemblyAI, Deepgram, Cartesia, Inworld, and more" ([integrations](https://docs.livekit.io/agents/integrations/)). The published list is not exhaustive relative to the plugin directory in the repo — treat the full roster as **incomplete/UNVERIFIED** beyond what's quoted.

**Client SDKs (verified via the LiveKit GitHub org).** `client-sdk-js` (TS), `components-js` (React), `client-sdk-react-native` + `client-sdk-react-native-expo-plugin`, `client-sdk-flutter` (Dart) + `components-flutter`, `client-sdk-swift` + `components-swift`, `client-sdk-android` (Kotlin) + `components-android`, **`client-sdk-unity` (C#)** and `client-sdk-unity-web`, `client-sdk-cpp`, `client-sdk-esp32`, `rust-sdks`. This is the broadest client matrix of any option surveyed and the only one with a first-party **Unity** SDK — relevant if the game engine is Unity.

**Plugging in game logic.** The `@function_tool` decorator gives the agent direct access to in-process state:

```python
from livekit.agents import function_tool, Agent, RunContext

class MathAgent(Agent):
    @function_tool()
    async def submit_answer(self, context: RunContext, value: int) -> dict:
        """Record the child's spoken answer to the current problem."""
        ...
```

Tools can "store and retrieve session data from the `context`", call `session.say()` / `session.generate_reply()` mid-execution, and "call methods on the frontend using RPC" ([tool definition docs](https://docs.livekit.io/agents/logic/tools/definition/); [tools overview](https://docs.livekit.io/agents/build/tools/)). For a game whose authoritative state lives in the *client*, the RPC-forwarding path ([forwarding docs](https://docs.livekit.io/agents/logic/tools/forwarding.md)) is the relevant pattern.

### 1.3 Pipecat / Pipecat Cloud (Daily)

BSD-2-Clause Python framework ([github.com/pipecat-ai/pipecat](https://github.com/pipecat-ai/pipecat); [docs.pipecat.ai](https://docs.pipecat.ai/)). Transports: Daily (WebRTC), LiveKit (WebRTC), `SmallWebRTCTransport`, Vonage, FastAPI WebSocket, WebSocket Server, WhatsApp, local.

**Pipecat Cloud pricing** ([daily.co/pricing/pipecat-cloud](https://www.daily.co/pricing/pipecat-cloud/)):

| Tier | Specs | Active | Reserved |
|---|---|---|---|
| agent-1x | 0.5 vCPU / 1 GB | $0.01/min | $0.0005/min |
| agent-2x | 1 vCPU / 2 GB | $0.02/min | $0.0010/min |
| agent-3x | 1.5 vCPU / 3 GB | $0.03/min | $0.0015/min |

Daily WebRTC voice (1:1) is **free**; voice+video $0.004/participant-min. Krisp noise cancellation free to 10k min/mo then $0.0015/min.

**Turn detection**: Smart Turn v3, "fast CPU inference directly inside your Pipecat Cloud instance", weights bundled ([smart-turn guide](https://docs.pipecat.ai/pipecat-cloud/guides/smart-turn)). Weights are **BSD-2-Clause — genuinely open source** — built on Whisper Tiny + a linear classifier (~8M params, int8), 23 languages ([huggingface.co/pipecat-ai/smart-turn-v3](https://huggingface.co/pipecat-ai/smart-turn-v3)). **No quantified ms latency benchmark is published** — a gap vs LiveKit's 295–543 ms figures.

**Tool calling** ([function-calling docs](https://docs.pipecat.ai/pipecat/learn/function-calling)):

```python
async def submit_answer(params: FunctionCallParams, value: int):
    await params.result_callback({"correct": True, "streak": 4})
```

**Client SDKs**: JS, React, React Native, iOS/Swift, Android/Kotlin, C++ ([clients overview](https://docs.pipecat.ai/overview/clients)); the latter three repo URLs are **UNVERIFIED**. No Unity SDK found.

### 1.4 Vapi

Web SDK uses **Daily.co WebRTC**: "The SDK uses Daily.co (a WebRTC-based platform) for call transport" ([github.com/VapiAI/web](https://github.com/VapiAI/web)); a raw WebSocket transport also exists (`pcm_s16le` 16 kHz or Mu-Law 8 kHz) ([websocket-transport](https://docs.vapi.ai/calls/websocket-transport)). Latency claim: "Real-time conversations: Sub-600ms response times with natural turn-taking" ([quickstart](https://docs.vapi.ai/quickstart/introduction)).

**Pricing** ([vapi.ai/pricing](https://vapi.ai/pricing)): **$0.05/min** platform fee; STT/LLM/TTS "At cost ($0 if you bring your own API key)"; ZDR add-on **$1,000/mo**; HIPAA add-on $2,000/mo.

**Tool calling is server-webhook only** ([custom-tools](https://docs.vapi.ai/tools/custom-tools)) — Vapi POSTs a `toolCallList` to your server and expects `{"results":[{"toolCallId":…, "result":…}]}`. For a math game whose state lives client-side, that adds a network hop to "is 3+4=7?" and requires you to run a backend. **This is a poor structural fit for this product**, independent of price.

SDKs: Web, Flutter, React Native, iOS/Swift, Python, and an Android repo not listed in the official SDK docs ([docs.vapi.ai/sdks](https://docs.vapi.ai/sdks)).

### 1.5 OpenAI Realtime API

> ⚠️ Docs moved: `platform.openai.com/docs/...` now 301-redirects to `developers.openai.com/api/docs/...`.

**Current models (2026-09-09)** ([models](https://developers.openai.com/api/docs/models), [realtime guide](https://developers.openai.com/api/docs/guides/realtime)): **`gpt-realtime-2.1`** (flagship S2S) and **`gpt-realtime-2.1-mini`**; older `gpt-realtime-2`, `gpt-realtime-1.5`, `gpt-realtime`, `gpt-realtime-mini` still live. `gpt-4o-realtime-preview` was **shut down 2026-05-07**; `gpt-realtime`, `gpt-4o-realtime`, `gpt-realtime-mini`, `gpt-4o-mini-realtime` are slated for removal **2027-01-20** ([deprecations](https://developers.openai.com/api/docs/deprecations)). **Build against `gpt-realtime-2.1` / `-mini`.**

**Pricing per 1M tokens** ([pricing](https://developers.openai.com/api/docs/pricing)):

| Model | Modality | Input | Cached in | Output |
|---|---|---|---|---|
| gpt-realtime-2.1 | Audio | $32.00 | $0.40 | $64.00 |
| gpt-realtime-2.1 | Text | $4.00 | $0.40 | $24.00 |
| gpt-realtime-2.1-mini | Audio | $10.00 | $0.30 | $20.00 |
| gpt-realtime-2.1-mini | Text | $0.60 | $0.06 | $2.40 |
| gpt-realtime-1.5 | Audio | $32.00 | $0.40 | $16.00 |
| gpt-live-transcribe / gpt-realtime-whisper | — | — | — | **$0.017/min** |

**Derived $/min.** "Audio tokens in user messages are 1 token per 100 ms of audio" ([realtime-costs](https://developers.openai.com/api/docs/guides/realtime-costs)) = 600 input tok/min; output audio ≈ 1 token/50 ms = 1,200 tok/min. So `gpt-realtime-2.1` ≈ **$0.096/min** if both sides talk continuously, ≈ **$0.048/min** at 50/50 turn-taking; `-mini` ≈ **$0.030 / $0.015**. Note the **4× jump** in 2.1's audio-output rate ($64) vs 1.5's ($16).

**WebRTC.** "When connecting to a Realtime model from the client (like a web browser or mobile device), we recommend using WebRTC" ([realtime-webrtc](https://developers.openai.com/api/docs/guides/realtime-webrtc)). Flow: backend mints an **ephemeral key** via `POST /v1/realtime/client_secrets` → client `RTCPeerConnection` → POST SDP offer to `https://api.openai.com/v1/realtime/calls`. "You only use standard OpenAI API keys on the server, not in the browser." This means **no relay server is needed for the media path** — a real operational advantage for a small team.

**Tool calling** ([realtime tools/MCP](https://developers.openai.com/api/docs/guides/realtime-mcp)): app-executed function tools declared via `session.update`, results returned as `conversation.item.create` with `type: "function_call_output"`; MCP servers and connectors also supported.

### 1.6 Google Gemini Live API — **blocked by ToS for this product**

Models: `gemini-3.1-flash-live-preview` ("low-latency, audio-to-audio"), `gemini-2.5-flash-native-audio-preview-12-2025` ([capabilities](https://ai.google.dev/gemini-api/docs/live-api/capabilities)). Pricing for `gemini-3.1-flash-live-preview`: input audio **$0.005/min**, output audio **$0.018/min** ([pricing](https://ai.google.dev/gemini-api/docs/pricing)) — full-duplex **$0.023/min**, the cheapest surveyed. WebSocket only, no WebRTC; ephemeral tokens exist for direct client use ([ephemeral-tokens](https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens)). Session limits: "audio-only sessions are limited to 15 minutes… The lifetime of a connection is limited as well, to around 10 minutes" ([session-management](https://ai.google.dev/gemini-api/docs/live-api/session-management)). Tool calling is manual: "Unlike the `generateContent` API, the Live API doesn't support automatic tool response handling" ([tools](https://ai.google.dev/gemini-api/docs/live-api/tools)).

**None of that matters here**: the Gemini Developer API terms bar use in a service "directed towards or … likely to be accessed by individuals under the age of 18" ([ai.google.dev/gemini-api/terms](https://ai.google.dev/gemini-api/terms), last modified 2026-04-28). A **Vertex AI** deployment is governed by the Google Cloud agreement instead, and no equivalent end-user age clause was found in the [Google Cloud Service Specific Terms](https://cloud.google.com/terms/service-terms) — but absence of a prohibition is **not** affirmative permission; get this in writing from Google before relying on it. **UNVERIFIED.**

Note also: "half-cascade" no longer appears in current Google Live API docs; treat that terminology as stale.

### 1.7 Amazon Nova Sonic

**Time-critical:** AWS lists Nova Sonic v1 as "Legacy (EOL: 2026-09-14)" in `us-east-1` and `ap-northeast-1` ([models-region-compatibility](https://docs.aws.amazon.com/bedrock/latest/userguide/models-region-compatibility.html)). **Build against `amazon.nova-2-sonic-v1:0`, not `amazon.nova-sonic-v1:0`.**

"Unified speech understanding and generation architecture" over `InvokeModelWithBidirectionalStream` — a typed event stream (`contentStart`, `audioInput`, `textOutput`, `audioOutput`, `toolUse`, `contentEnd`), not a plain WebSocket ([speech](https://docs.aws.amazon.com/nova/latest/userguide/speech.html); [Nova 2 conversational speech](https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-conversational-speech.html)). Connection limit 8 minutes with a renewal pattern.

Pricing per 1M tokens ([aws.amazon.com/bedrock/pricing](https://aws.amazon.com/bedrock/pricing/), manifest dated 2026-09-01): Nova 2 Sonic speech **$3.00 in / $12.00 out** (us-east-1/us-west-2); text $0.33 in / $2.75 out. **A $/minute figure is UNVERIFIED** — AWS publishes no audio-token-to-duration conversion.

**Disqualifying architectural fact for a client-side game**: Nova Sonic is a backend API requiring AWS SigV4 credentials with **no documented ephemeral-token or browser-direct path**. You must run your own audio relay server. Combined with AWS's default-opt-in service-improvement posture, this is the weakest fit of the group.

### 1.8 ElevenLabs Conversational AI / Agents

Architecture: fine-tuned ASR + choice of LLM + low-latency TTS + "a proprietary turn-taking model that handles conversation timing" ([overview](https://elevenlabs.io/docs/conversational-ai/overview)). The React Native SDK runs over **WebRTC via LiveKit** ([react-native docs](https://elevenlabs.io/docs/eleven-agents/libraries/react-native)).

Latency, per-model, with an explicit caveat "† Excluding application & network latency" ([models](https://elevenlabs.io/docs/overview/models)): **Flash v2.5 ~75 ms**, **Eleven v3 Conversational ~280 ms**, **Scribe v2 Realtime (STT) ~150 ms**.

Pricing ([elevenlabs.io/pricing/agents](https://elevenlabs.io/pricing/agents)): Free 15 min; Starter $6/75 min; Creator $11/275 min; Pro $99/1,238 min; Scale $299/3,738 min; Business $990/12,375 min. **Overage $0.080/min; burst $0.160/min.** "LLM models and telephony provider fees are billed separately on top."

**Client Tools are the best-in-class fit for a client-side game** — a JS function that runs in your app and returns data straight into the conversation context ([client-tools](https://elevenlabs.io/docs/conversational-ai/customization/tools/client-tools)):

```javascript
const conversation = await Conversation.startSession({
  clientTools: {
    submitAnswer: async ({ value }) => ({ correct: value === 7, streak: 4 })
  },
});
```

SDKs: JS (`@elevenlabs/client`), React, React Native, Swift, Kotlin/Android, Python. **No Unity SDK found.** The `<elevenlabs-convai>` widget "requires public agents with authentication disabled" ([widget](https://elevenlabs.io/docs/eleven-agents/customization/widget)) — unusable for a children's product.

**But**: §4 shows ElevenLabs' own privacy policy prohibits transmitting under-18 voice data to their services. **Use ElevenLabs for TTS output only.**

### 1.9 Azure Voice Live API (a strong option the brief didn't list)

Microsoft's managed realtime voice-agent API, docs updated **2026-09-06** ([voice-live overview](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live)). WebSocket, server-to-server, "designed for compatibility with the Azure OpenAI Realtime API". Model choice spans `gpt-realtime-1.5`, `gpt-5.x`, `gpt-4.1-*`, `phi4-mm-realtime`, and `azure-realtime`. Documented features directly relevant here:

- **Phrase list on audio input**, set in `session.update` — the constrained-vocabulary lever, inside a realtime agent ([voice-live-how-to-customize](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-how-to-customize)):
  ```json
  {"session": {"input_audio_transcription": {"model": "azure-speech", "phrase_list": ["seven", "seventeen", "next", "hint"]}}}
  ```
- **Custom speech models** per locale (you could fine-tune on child speech — the single most effective known fix for child ASR).
- **Custom voice (professional)** for a consistent character voice, and **custom lexicon** for pronunciation.
- Noise suppression, echo cancellation, "robust interruption detection", "advanced end-of-turn detection".
- Function calling; VoiceRAG pattern.

Pricing is tiered Pro/Basic/Lite by model, with token estimation "~10 tokens/sec input audio, ~20 tokens/sec output audio" for Azure OpenAI models — but the **actual $ rates are UNVERIFIED** because [azure.microsoft.com/pricing/details/cognitive-services/speech-services](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/) renders prices client-side. Custom voice access is gated behind an eligibility intake form.

Combined with Azure's "no data trace" real-time STT posture (§4), this is the most compliance-friendly *cloud realtime* option — at the cost of needing your own server-to-server relay (no browser-direct path).

### 1.10 Other comparables

| Platform | Pricing (primary-sourced) | Notes |
|---|---|---|
| **Deepgram Voice Agent API** | Standard **$0.075/min** (promo $0.056 through 2026-09-12); BYO-LLM $0.065/min; Advanced $0.163/min ([pricing](https://deepgram.com/pricing)) | Single WebSocket, "handles the full speech pipeline"; function calling with a `defer_until_eot` flag ([docs](https://developers.deepgram.com/docs/voice-agents-function-calling)). No published ms latency. |
| **Retell AI** | All-in **$0.07–$0.31/min**; no platform base fee ([pricing](https://www.retellai.com/pricing)) | Function nodes + MCP. Latency UNVERIFIED. |
| **Cartesia Agents / Line** | Voice-agent calls **$0.06/min** ([pricing](https://cartesia.ai/pricing)) | Apache-2.0 "Line" SDK ([github](https://github.com/cartesia-ai/line)); Sonic TTFB "about 90ms" ([docs.cartesia.ai](https://docs.cartesia.ai/)). |
| **Speechmatics Flow** | Product page 404s; current positioning is STT under third-party orchestrators ([ai-voice-agents](https://www.speechmatics.com/use-cases/ai-voice-agents)) | Treat Flow as **not a currently marketed standalone agent platform**. |

---

## 2. Text-to-speech for the character voice

### 2.1 At-a-glance

| Vendor | Model for this use case | Streaming TTFB | $/1,000 chars | Child/character voice? | Pre-render + ship in a game? |
|---|---|---|---|---|---|
| **ElevenLabs** | Eleven v3 + Voice Design (pre-render); Flash v2.5 (live) | **~75 ms** Flash v2.5, **~280 ms** v3 Conversational ([models](https://elevenlabs.io/docs/models)) | ~$0.083 (Flash) – $0.165 (Multilingual v2) at Pro rates | **"Characters & Animation"** library category — "Playful and engaging voices for cartoons or video games" ([voice library](https://elevenlabs.io/voice-library)); no kid age filter | Yes — "you are permitted to use such Output outside of the Services" ([ToS §4(a)](https://elevenlabs.io/terms-of-use)); which tier unlocks commercial rights is **UNVERIFIED** |
| **Cartesia Sonic 3.5** | Sonic 3.5 | **~90 ms** ("streams the first byte of audio in about 90ms") ([overview](https://docs.cartesia.ai/get-started/overview)) | $0.037–$0.050 (1 credit = 1 char) ([pricing](https://cartesia.ai/pricing)) | No child/character preset | **Paid tier only** — "you will not… make commercial use of… any of Your Outputs (unless commercial use is expressly permitted by your subscription tier)" ([ToS §5.3(b)](https://cartesia.ai/legal/terms)) |
| **OpenAI TTS** | `gpt-4o-mini-tts` | Chunked HTTP streaming only; no ms published ([guide](https://developers.openai.com/api/docs/guides/text-to-speech)) | `tts-1` $15/1M chars; `gpt-4o-mini-tts` $/char not derivable — **UNVERIFIED** | 13 preset voices; **instructable** via the `instructions` param | ToS pages return HTTP 403 to automated fetch on every attempt — **UNVERIFIED** |
| **Google Cloud TTS** | Chirp 3: HD / Neural2 | Chirp 3 HD supports streaming synthesis; no ms published ([voice types](https://docs.cloud.google.com/text-to-speech/docs/voice-types)) | Standard/WaveNet $4/1M; Neural2 $16/1M; **Chirp 3 HD $30/1M**; Studio $160/1M ([pricing](https://cloud.google.com/text-to-speech/pricing)) | None flagged as child | General "you keep your content" language; TTS-specific clause not locatable — **UNVERIFIED** |
| **Azure Neural TTS** | Standard prebuilt Neural | Not published | **$15/1M** Neural; $22/1M Neural HD; $48/1M Custom Neural HD ([Azure Retail Prices API](https://prices.azure.com/api/retail/prices)) | **YES — `en-US-AnaNeural` is labeled "(Female, Child)"** ([voice list](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts)) | TTS-specific clause not locatable — **UNVERIFIED** |
| **Amazon Polly** | Neural / Generative | Not verified | Standard $4/1M; Neural $16/1M; Generative $30/1M; Long-Form $100/1M ([pricing](https://aws.amazon.com/polly/pricing/)) | **YES — Ivy "Female (child)", Justin "Male (child)", Kevin "Male (child)"** ([voice list](https://docs.aws.amazon.com/polly/latest/dg/available-voices.html)) | **Explicitly yes — the clearest language of any vendor** ([FAQ](https://aws.amazon.com/polly/faqs/)) |
| **Rime** | Coda (quality) / Mist v3 (speed) | **Conflicting: 37 ms vs 96 ms P50 — UNVERIFIED**, benchmark yourself | Mist v3 $0.03/1k; Coda $0.05/1k ([pricing](https://rime.ai/pricing)) | Not flagged | You own Input and Output ([terms](https://rime.ai/terms)); no explicit caching clause — ambiguous |
| **PlayHT / play.ai** | PlayDialog | **UNVERIFIED** | **UNVERIFIED** | **UNVERIFIED** | **UNVERIFIED** — apex domains unreachable in two passes; `docs.play.ht` works ([API docs](https://docs.play.ht/reference/api-getting-started)) |
| **Kokoro-82M** | 82M StyleTTS2 | Local | Free | No | **Apache-2.0, commercial use explicit** ([model card](https://huggingface.co/hexgrad/Kokoro-82M)) |
| **Piper** | — | Local, real-time on Pi-class HW | Free | Community voices vary | **License hazard — see 2.5** |
| **Apple AVSpeechSynthesizer** | System voices | On-device | Free | No character voice | Standard voices OK; **Personal Voice is contractually non-commercial** |
| **Android TextToSpeech** | System engine | On-device | Free | No character voice | AOSP is "predominantly Apache License, Version 2.0" ([licenses](https://source.android.com/setup/start/licenses)) |

### 2.2 ElevenLabs

**Models** ([elevenlabs.io/docs/models](https://elevenlabs.io/docs/models)): **Eleven v3** — most expressive, not real-time optimized, 5,000-char limit, positioned for "Character Discussions, Audiobook Production, Emotional Dialogue"; **Eleven v3 Conversational** ~280 ms; **Flash v2.5** ~75 ms, 40,000-char limit, cheapest; **Multilingual v2** — "Character Voiceovers, Professional Content", 10,000 chars. Turbo v2.5/v2 are deprecated and "functionally equivalent to `eleven_flash_v2_5`". Latency figures exclude application and network latency.

**Voice Design** ([product guide](https://elevenlabs.io/docs/product-guides/voices/voice-design)) is the feature that most directly answers "a fun character with a nice, consistent kid-friendly voice": you describe a voice in text (`Native [Language]. [Gender], [Age range]. [Quality]. Persona: [2-5 words]. Emotion: [...]`) and get 3 candidates, billed once for the preview text. Documented example personas include evil ogre, mad scientist, angry pirate — i.e. it is explicitly aimed at cartoon characters. Generated voices are backward-compatible with all other ElevenLabs models, which is what gives you long-term consistency. **ElevenLabs itself labels Voice Design "still experimental."**

**Pricing** ([elevenlabs.io/pricing](https://elevenlabs.io/pricing)): Free 10k credits; Starter $6/30k; Creator $22/121k; Pro $99/600k; Scale $299/1.8M; Business $990/6M. Credit multipliers: Multilingual v2 and v3 = **1 credit/char**; Flash/Turbo are "discounted… costing between 0.5 and 1 credit per character" (≈0.5). Derived at Pro rates: **Multilingual v2 ≈ $0.165/1k chars; Flash v2.5 ≈ $0.083/1k chars.**

**Licensing.** ToS §4(c)(ii): "you retain all rights in and to your Output." §4(a): "We may enable you to download Output from some (but not all) of the Services; in such cases, **you are permitted to use such Output outside of the Services** but always subject to these Terms and our Prohibited Use Policy" ([ToS](https://elevenlabs.io/terms-of-use)). A targeted search of the ToS for "minor / child / children / COPPA" returned **zero hits** — the 18+ rule governs the account holder, not your game's players. Which paid tier unlocks commercial rights is **UNVERIFIED** — confirm before shipping on a low tier.

### 2.3 The commodity cloud vendors

**Azure** is the only major vendor with an off-the-shelf, ungated **US-English child voice**: `en-US-AnaNeural` is labeled "(Female, Child)" in Microsoft's own voice table; other child voices are `de-DE-GiselaNeural`, `en-GB-MaisieNeural`, `es-MX-MarinaNeural`, `fr-FR-EloiseNeural`, `it-IT-PierinaNeural`, `pt-BR-LeticiaNeural` — **no US-English *male* child voice exists** ([language-support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts)). SSML `mstts:express-as` supports styles like `cheerful`, `excited`, `friendly`, `whispering`, but availability varies per voice and **whether AnaNeural supports `cheerful` is UNVERIFIED** ([SSML voice docs](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice), updated 2026-08-18). Note the gate on cloning: "custom neural voice is a Limited Access feature available by registration only… **Only customers managed by Microsoft**… are eligible for access" ([limited access](https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/speech-service/text-to-speech/limited-access), updated 2026-08-26) — impractical for a small studio. The prebuilt voices are not gated.

**Amazon Polly** has three US-English child voices — Ivy "Female (child)", Justin "Male (child)", Kevin "Male (child)" ([available voices](https://docs.aws.amazon.com/polly/latest/dg/available-voices.html); Kevin's [launch note](https://aws.amazon.com/about-aws/whats-new/2020/06/amazon-polly-launches-a-child-us-english-ntts-voice/) says it "imitates the voice of a male child"). They are available on Neural and/or Standard engines, **not** Generative or Long-Form.

**OpenAI** offers `gpt-4o-mini-tts` with an `instructions` parameter that steers "accent, emotional range, intonation, impressions, speed of speech, tone, whispering" — the documented example is literally "Speak in a cheerful and positive tone" ([TTS guide](https://developers.openai.com/api/docs/guides/text-to-speech)). 13 preset voices (`alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer, verse, marin, cedar`). **One clause matters for a kids' product**: "Our usage policies require you to provide a clear disclosure to end users that the TTS voice they are hearing is AI-generated and not a human voice." Disclosing that to a 6-year-old is a product-design problem worth raising with legal early. Pricing: `tts-1` $15/1M chars, `tts-1-hd` $30/1M chars, `gpt-4o-mini-tts` $0.60/1M input text tokens + $12.00/1M output audio tokens — **no published token-to-character conversion, so its $/char is UNVERIFIED**.

**Google Cloud TTS** tiers and prices ([pricing](https://cloud.google.com/text-to-speech/pricing)): Standard $4/1M, WaveNet $4/1M, Neural2 $16/1M, Polyglot (preview) $16/1M, **Chirp 3: HD $30/1M**, Instant Custom Voice $60/1M, Studio $160/1M. Chirp 3: HD (30 voices, GA) supports streaming synthesis for "low-latency real-time communication using text streaming" ([voice types](https://docs.cloud.google.com/text-to-speech/docs/voice-types)). Generous free tiers: 4M chars/month Standard+WaveNet, 1M chars/month for Neural2/Chirp 3 HD/Studio. No child-specific voices flagged.

### 2.4 Pre-rendering vs live TTS — what the terms actually say

This is the decisive question for this product, because nearly every line is scripted.

| Vendor | Clause | Verdict |
|---|---|---|
| **Amazon Polly** | FAQ: *"Can I use the service for generating static voice prompts that will be replayed multiple times?"* → **"Yes, you can. The service does not restrict this and there are no additional costs for doing so."** Also "You can cache and replay Amazon Polly's generated speech at no additional cost" and "As between you and AWS, your Polly output belongs to you" ([FAQ](https://aws.amazon.com/polly/faqs/)). Service Terms §50.2: "The output that you generate using AI Services is Your Content" ([service terms](https://aws.amazon.com/service-terms/)). | **Explicitly allowed — the clearest language found anywhere.** Caveat: §50.3 lets AWS use content you process to improve the services **unless you opt out** via an AWS Organizations policy. |
| **ElevenLabs** | ToS §4(a) permits use of downloaded Output outside the Services, subject to the Prohibited Use Policy; §4(c)(ii) you retain rights ([ToS](https://elevenlabs.io/terms-of-use)) | Allowed in principle; commercial-tier gating **UNVERIFIED**. |
| **Cartesia** | ToS §5.3(b): commercial use of Outputs requires a tier where "commercial use is expressly permitted" ([terms](https://cartesia.ai/legal/terms)) | **Paid tier required** (Pro $5/mo entry point). |
| **OpenAI** | `openai.com/policies/terms-of-use/`, `/usage-policies/`, `/business-terms/` all return **HTTP 403** to automated fetch — reproducibly, across two independent passes | **UNVERIFIED — check manually before shipping.** |
| **Google Cloud** | General Terms §5.1: "this Agreement does not grant either party any rights… to the other's content" ([terms](https://cloud.google.com/terms/)); no TTS-specific caching clause locatable | **UNVERIFIED at the TTS-specific level.** |
| **Azure** | No scrapable TTS-specific clause found; governed by Microsoft Product Terms | **UNVERIFIED.** |

**One-time cost to pre-render ~2,000 lines × ~60 chars = 120,000 characters:**

| Vendor / tier | Cost | Note |
|---|---|---|
| Google Standard/WaveNet | $0.48 | likely **$0** — inside the 4M-char free tier |
| Amazon Polly Standard | $0.48 | likely **$0** — inside the 5M-char free tier |
| Azure Standard Neural | $1.80 | likely **$0** — inside the 500k-char F0 tier |
| OpenAI `tts-1` | $1.80 | |
| Google Neural2 / Polly Neural | $1.92 | likely $0 under free tiers |
| Azure Neural HD | $2.64 | |
| OpenAI `tts-1-hd` / Google Chirp 3 HD / Polly Generative / Rime Mist v3 | $3.60 | |
| Rime Coda | $6.00 | |
| **ElevenLabs Flash v2.5** | **~$10–11** | fits inside one Creator-tier month (121k credits) |
| **ElevenLabs Multilingual v2 / v3** | **~$20–22** | just fits one Creator-tier month |
| Google Studio | $19.20 | |
| Kokoro / Piper (self-hosted) | ~$0 | compute only |

**The entire voice-asset budget for the game is under $25 on any vendor.** Pre-rendering is therefore not a cost optimization — it is a *quality and reliability* decision: fixed clips give you a permanently identical character voice, zero runtime latency, offline playback, and audio you can actually QA before it reaches a child. Choose the TTS vendor on voice quality and licensing clarity, not price.

### 2.5 On-device / open-source TTS

- **Kokoro-82M** — Apache-2.0, 82M params, StyleTTS2 architecture; the model card states "This is an Apache-licensed model, and Kokoro has been deployed in numerous projects and commercial APIs" ([hexgrad/Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M)). ONNX export at [onnx-community/Kokoro-82M-ONNX](https://huggingface.co/onnx-community/Kokoro-82M-ONNX) (also Apache-2.0, fp16/quantized variants), browser support via Transformers.js and `kokoro-js`, plus an MIT-licensed native wrapper [`kokoro-onnx`](https://github.com/thewh1teagle/kokoro-onnx) (~300 MB, 80 MB quantized, "near real-time on macOS M1"). **The cleanest fully-free path for pre-rendering with no vendor terms at all.**
- **Piper — license hazard.** The original [`rhasspy/piper`](https://github.com/rhasspy/piper) is **MIT but archived** (archived 2025-10-06). The actively maintained fork [`OHF-Voice/piper1-gpl`](https://github.com/OHF-Voice/piper1-gpl) is **GPL-3.0**. Embedding a GPL-3.0 engine in a closed-source game can trigger source-disclosure obligations for the combined work. If you use Piper at all, use it as an **offline build-time tool** producing WAV files (the output is not GPL-encumbered) rather than shipping the engine — and get a legal review.
- **Apple AVSpeechSynthesizer** — free, offline, on-device, fine for commercial App Store apps under standard SDK terms ([docs](https://developer.apple.com/documentation/avfoundation/avspeechsynthesizer)). **Personal Voice is NOT usable**: "You can use Personal Voice only to create a voice that sounds like you on device, using only your own voice, and only for your own **personal, non-commercial use**" ([support.apple.com/en-us/104993](https://support.apple.com/en-us/104993)). It is an accessibility feature, not a character-voice tool.
- **Android TextToSpeech** — free system API; AOSP is "predominantly Apache License, Version 2.0" ([AOSP licenses](https://source.android.com/setup/start/licenses)). Offline capability depends on the installed engine (Google Speech Services supports offline synthesis) — **UNVERIFIED via a primary API page**, since the reference page returns only navigation shell to automated fetch.

**Neither platform TTS engine ships a distinctive cartoon voice.** They are natural assistant voices; getting a real character persona from them requires pitch/rate manipulation at minimum. For this product that argues strongly against runtime system TTS as the character's voice, and in favour of pre-rendered clips from a vendor that can actually design a character.

---

## 3. Speech-to-text for children

### 3.1 The core problem, quantified

No vendor publishes age-segmented WER. The academic literature does. Zero-shot Whisper, measured on two standard child corpora ([Fan, Shankar & Alwan, arXiv:2406.10507, 2024-06-15](https://arxiv.org/html/2406.10507v1)):

| Model | MyST test (WER) | OGI Kids test (WER) | MyST fine-tuned | OGI fine-tuned |
|---|---|---|---|---|
| Whisper-tiny | 20.6% | 53.8% | — | — |
| Whisper-base | 16.8% | 38.0% | — | — |
| Whisper-small | 13.4% | 25.4% | 9.3% | 1.8% |
| Whisper-medium | 13.1% | 20.8% | 8.9% | 1.5% |
| Whisper-large-v3 | 12.6% | 19.9% | 9.1% | 1.4% |
| NVIDIA Canary | 9.5% | 18.2% | — | — |
| NVIDIA Parakeet-RNNT | 11.1% | 16.7% | — | — |

Corroborating results:

- **Kid-Whisper**: Whisper-Small **13.93% → 9.11%** and Whisper-Medium **13.23% → 8.61%** on MyST after fine-tuning ([arXiv:2309.07927](https://arxiv.org/abs/2309.07927), AAAI/ACM AIES).
- **On-device edge**: Whisper `tiny.en` on a Raspberry Pi hits **15.9% WER unfiltered / 11.8% filtered** on MyST; compression to a 0.51M-param encoder costs +11% relative WER for 1.26× speedup ([arXiv:2507.14451](https://arxiv.org/abs/2507.14451), WOCCI/Interspeech 2025).
- **Magnitude of the child penalty**: an Arabic child corpus (ages 6–13) yields **66% WER with Whisper large-v3 vs <20% on adult Arabic benchmarks** ([arXiv:2510.23319](https://arxiv.org/abs/2510.23319)). Non-English, but the ratio is instructive.
- **Non-native child ASR challenge**: unconstrained baseline **35.09% WER**; the winning systems reached 15.67–17.59% largely via domain-restricted LM rescoring ([arXiv:2005.08433](https://arxiv.org/abs/2005.08433), Interspeech 2020).
- **Why constraining helps**: a causal analysis of child ASR errors finds age is the top physiological factor and flags **"vocabulary difficulty" as a significant extrinsic error driver** ([arXiv:2502.08587](https://arxiv.org/abs/2502.08587)).
- **Closest prior art to this exact product**: Intel's "Inspecting Spoken Language Understanding from Kids for Basic Math Learning at Home" — a gamified math-learning SLU pipeline for children, comparing Google Cloud STT vs Whisper ([BEA @ ACL 2023, arXiv:2306.00482](https://arxiv.org/pdf/2306.00482)).

Relevant corpora if you want to benchmark: **CMU Kids** (ages **6–11, grades 1–3** — a direct age match; 76 speakers, 5,180 utterances, [LDC97S63](https://catalog.ldc.upenn.edu/LDC97S63)); **CSLU/OGI Kids** (K–grade 10, ~1,100 children, [LDC2007S18](https://catalog.ldc.upenn.edu/LDC2007S18)); MyST (K–8 tutoring dialogues, cited throughout the papers above).

### 3.2 Cloud ASR vendors

| Vendor / model | Pricing | Child-speech statement |
|---|---|---|
| **Deepgram Nova-3** | Streaming mono **$0.0048/min** promo (reg. $0.0077); pre-recorded $0.0043/min PAYG ([pricing](https://deepgram.com/pricing)) | **None.** Only a general "53.4% WER reduction (streaming) vs competitors" claim ([Nova-3 announcement](https://deepgram.com/learn/introducing-nova-3-speech-to-text-api)). |
| **AssemblyAI** Universal-3.5 Pro / Universal-2 | Async Pro $0.21/hr, Universal-2 $0.15/hr; Realtime Pro $0.45/hr, Universal-Streaming $0.15/hr ([pricing](https://www.assemblyai.com/pricing)) | None found. |
| **OpenAI** `gpt-4o-transcribe` / `-mini-transcribe` / `whisper-1` | ~$0.006/min, ~$0.003/min, $0.006/min respectively ([pricing](https://developers.openai.com/api/docs/pricing)) | None found. |
| **OpenAI Whisper (weights)** | Free, MIT ([github](https://github.com/openai/whisper)) | Extensive third-party WER data (above). |
| **Google Cloud STT v2 / Chirp 2 / Chirp 3** | **UNVERIFIED** — pricing page redirect-looped repeatedly | None found. |
| **Azure AI Speech** | Base STT $/hr **UNVERIFIED** (JS-rendered page); F0 free tier = 5 hrs/month | **The only vendor that acknowledges children.** Its Pronunciation Assessment docs define a **"Gaming"** scenario, and its Responsible-AI page states "the grading method for children's learning might not be as strict as that for adult learning" ([characteristics-and-limitations](https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/speech-service/pronunciation-assessment/characteristics-and-limitations-pronunciation-assessment), updated 2026-06-20). |

### 3.3 On-device ASR

**Apple.**

| API | Availability | On-device | Vocabulary control |
|---|---|---|---|
| `SFSpeechRecognizer` | iOS 10+ | `requiresOnDeviceRecognition` (iOS 13+) "prevent[s] an … request from sending audio over the network. However, on-device requests won't be as accurate." ([doc](https://developer.apple.com/documentation/speech/sfspeechrecognitionrequest/requiresondevicerecognition)) | `contextualStrings`: "An array of phrases that should be recognized, even if they are not in the system vocabulary." Keep to 1–2 words; **"Limit the total number of phrases to no more than 100."** ([doc](https://developer.apple.com/documentation/speech/sfspeechrecognitionrequest/contextualstrings)) — a **soft bias, not a hard grammar**. |
| **`SpeechAnalyzer` / `SpeechTranscriber`** | **iOS/iPadOS/macOS/tvOS/visionOS 26.0+** ([SpeechAnalyzer](https://developer.apple.com/documentation/speech/speechanalyzer), [SpeechTranscriber](https://developer.apple.com/documentation/speech/speechtranscriber)) | Fully on-device; models live in system storage with "no app size impact" ([WWDC25 session 277](https://developer.apple.com/videos/play/wwdc2025/277/)) | `AnalysisContext.contextualStrings` — tag-grouped phrase lists shared across modules ([doc](https://developer.apple.com/documentation/speech/analysiscontext)); custom LM via `SFSpeechLanguageModel`. |
| `DictationTranscriber` | iOS 26.0+ | Uses the same on-device models as system dictation; "does not support languages or locales that [SpeechTranscriber] only supports via network access" | "You can bias recognition towards certain words, supply custom vocabulary, or adjust the transcriber's algorithm" ([doc](https://developer.apple.com/documentation/speech/dictationtranscriber)) |

**Android.** `SpeechRecognizer.createOnDeviceSpeechRecognizer(Context)` and `isOnDeviceRecognitionAvailable(Context)` are present in the platform API ([SpeechRecognizer reference](https://developer.android.com/reference/android/speech/SpeechRecognizer); [AOSP source](https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/core/java/android/speech/SpeechRecognizer.java)). Biasing extras confirmed on `RecognizerIntent` ([reference](https://developer.android.com/reference/android/speech/RecognizerIntent)): **`EXTRA_BIASING_STRINGS`** — "Optional list of strings, towards which the recognizer should bias the recognition results"; **`EXTRA_PREFER_OFFLINE`** — "indicate whether to only use an offline speech recognition engine"; `EXTRA_ENABLE_FORMATTING`; `EXTRA_ENABLE_LANGUAGE_DETECTION`.

**Open source.**

| Project | License | Constraint mechanism |
|---|---|---|
| **Vosk** ([site](https://alphacephei.com/vosk/), [repo](https://github.com/alphacep/vosk-api)) | Apache-2.0; "Portable per-language models are only 50Mb each" | **Hard FST constraint.** `KaldiRecognizer` takes a JSON grammar at init and via `SetGrammar()` — e.g. `'["oh one two three", "four five six", "seven eight nine zero", "[unk]"]'` — pruning the Kaldi decoding graph to only those phrases, updatable mid-session ([test_words.py](https://raw.githubusercontent.com/alphacep/vosk-api/master/python/example/test_words.py)). Requires a dynamic-graph model for runtime vocabulary swaps ([adaptation](https://alphacephei.com/vosk/adaptation)). |
| **whisper.cpp** ([repo](https://github.com/ggml-org/whisper.cpp)) | MIT | Ships a `/grammars` folder with GBNF grammar files — llama.cpp-style grammar-constrained decoding. tiny ≈ 75 MiB / 273 MB RAM. |
| **Moonshine** ([repo](https://github.com/moonshine-ai/moonshine)) | MIT (English models) | "everything runs on-device"; tiny models ~1 MB. No grammar feature found. Accuracy claims **UNVERIFIED**. |
| **sherpa-onnx** ([repo](https://github.com/k2-fsa/sherpa-onnx)) | Apache-2.0 | **Hotwords / contextual biasing** via Aho-Corasick over tokenized hotwords during `modified_beam_search` (transducer models only) ([hotwords doc](https://k2-fsa.github.io/sherpa/onnx/hotwords/index.html)). Android/iOS/WASM/RPi/NPU. |

### 3.4 Constrained recognition — the decisive lever for this product

Your answer vocabulary is roughly 110 tokens (numbers 0–100 in word and digit form, plus `yes / no / next / hint / repeat / help`). Two qualitatively different mechanisms exist:

**(a) Soft phrase-boosting on an open decoder** — cheap, universally available, moderate benefit:

| Feature | Vendor | Limit | Cost |
|---|---|---|---|
| **Keyterm Prompting** ([docs](https://developers.deepgram.com/docs/keyterm)) | Deepgram Nova-3 / Flux only | 500 tokens (~100 words)/request | **+$0.0013/min** streaming PAYG ([pricing](https://deepgram.com/pricing)) |
| **Keywords** (legacy `keyword:INTENSIFIER`) ([docs](https://developers.deepgram.com/docs/keywords)) | Deepgram Nova-2 and older — **not** Nova-3 | 100 keywords/request | — |
| **Keyterms Prompting** ([docs](https://www.assemblyai.com/docs/pre-recorded-audio/universal-3-5-pro/prompting)) | AssemblyAI Universal-3.5 Pro | 1,000 words total, 6 words/phrase | +$0.05/hr async, +$0.04/hr streaming; free on some streaming tiers |
| **Phrase List / `PhraseListGrammar`** ([docs](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/improve-accuracy-phrase-list), updated 2026-09-03) | Azure Speech SDK (C#/C++/Java/JS/Python/Go), Fast Transcription, LLM Speech Transcription, **Voice Live API** | **~2,000 phrases**; weight **0.0–2.0** (default 1.0) | Included in base STT |
| **Speech Adaptation `PhraseSet` + boost** ([docs](https://docs.cloud.google.com/speech-to-text/docs/speech-adaptation)) | Google Cloud STT | boost float, practical max ~20; boost applies to whole phrases only | Adaptation free |
| **`contextualStrings`** | Apple SFSpeechRecognizer | **≤100 phrases** | Free, on-device |
| **`AnalysisContext.contextualStrings`** | Apple SpeechAnalyzer, iOS 26+ | tag-grouped | Free, on-device |
| **`EXTRA_BIASING_STRINGS`** | Android RecognizerIntent | not documented | Free |
| **hotwords** ([docs](https://k2-fsa.github.io/sherpa/onnx/hotwords/index.html)) | sherpa-onnx | — | Free, on-device |

**(b) Hard grammar / speech-to-intent** — a genuinely smaller search space, and the right answer for a closed vocabulary:

- **Vosk `SetGrammar()`** — prunes the Kaldi FST. Free, Apache-2.0, offline, ~50 MB. The only surveyed technology with a fetched, verbatim code example matching this exact digit-list pattern.
- **whisper.cpp GBNF grammars** — grammar-constrained decoding on a Whisper model.
- **Picovoice Rhino Speech-to-Intent** — YAML contexts with expressions + slots compiled to a `.rhn` file, fully offline on Cortex-M4 / Android / iOS / browser. Claims **">99% accuracy in clean (no noise) environments"** and **"97% accuracy in noisy environments with SNR 9dB at mic level"** ([Rhino FAQ](https://picovoice.ai/docs/faq/rhino/); [repo](https://github.com/Picovoice/rhino); [docs](https://picovoice.ai/docs/rhino/)). Licensing: **B2B subscription only** — "there are no dedicated free or paid plans for personal or non-commercial use"; Porcupine/Rhino/Cobra bill **per Monthly Active User** ([general FAQ](https://picovoice.ai/docs/faq/general/)). Exact $/MAU is **UNVERIFIED** — [picovoice.ai/pricing](https://picovoice.ai/pricing/) is a pure client-rendered SPA returning no static figures.
- **Azure `IntentRecognizer` / `PatternMatchingModel` — RETIRED 2025-09-30.** "Intent recognition in Azure Speech in Foundry Tools was retired on September 30, 2025 … `IntentRecognizer`, pattern matching intents/entities, and related parameters are no longer available" ([migrate-intent-recognition](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/migrate-intent-recognition)). It was always cloud-based, never on-device. **Do not design around it.**

**(c) Number-specific helpers:**

- **Google class tokens** ([docs](https://docs.cloud.google.com/speech-to-text/v2/docs/class-tokens)): **`$OOV_CLASS_DIGIT_SEQUENCE`** — "A digit sequence of any length" — embeddable directly inside a `PhraseSet` phrase. Also `$OOV_CLASS_OPERAND` ("numerical value incl. whole numbers, fractions, decimals"), `$OOV_CLASS_ORDINAL`, `$OPERAND`, `$ORDINAL`.
- **Deepgram `numerals=true`** ([docs](https://developers.deepgram.com/docs/numerals)): "nine hundred" → "900". `smart_format` is a superset ([docs](https://developers.deepgram.com/docs/smart-format)).

**Evidence caveat.** No controlled open-vocab-vs-constrained-vocab ablation *on child speech* was found in the literature — **UNVERIFIED / confirmed gap**. The supporting evidence is indirect: vocabulary difficulty is a measured extrinsic error driver for children ([arXiv:2502.08587](https://arxiv.org/abs/2502.08587)); the Interspeech 2020 child-ASR challenge halved WER largely via domain-restricted LM rescoring ([arXiv:2005.08433](https://arxiv.org/abs/2005.08433)); and Deepgram's own (unaudited) claim is that keyterms raise keyword recall "up to 90%" ([docs](https://developers.deepgram.com/docs/keyterm)). **Benchmark this yourself on 6–7-year-old recordings before committing.**

**Product design note that matters more than any vendor choice.** Constrained recognition also lets you do *disambiguation instead of transcription*: for "3 + 4", you know the answer is 7 and the plausible confusions are 6, 8, 11, 12, 34. Score the audio against that tiny candidate set rather than transcribing freely, and accept a match above threshold. This is far more robust on child speech than open dictation plus string matching, and it works identically offline.

---

## 4. Privacy & compliance for voice from under-13 users

### 4.1 What the law actually requires

- **A child's voice is personal information.** 16 CFR 312.2 item (8): "A photograph, video, or audio file where such file contains a child's image or voice"; item (10), added by the 2025 amendments: "A biometric identifier that can be used for the automated or semi-automated recognition of an individual, such as … **voiceprints** …" ([law.cornell.edu/cfr/text/16/312.2](https://www.law.cornell.edu/cfr/text/16/312.2)).
- **Retention rule (amended).** 16 CFR 312.10: information "may not be retained indefinitely. At a minimum, the operator must **establish, implement, and maintain a written data retention policy** that sets forth the purposes for which children's personal information is collected, the business need for retaining such information, and a timeframe for deletion" — and must publish it in the §312.4(d) notice ([law.cornell.edu/cfr/text/16/312.10](https://www.law.cornell.edu/cfr/text/16/312.10)).
- **Timeline.** The FTC's COPPA FAQ states "The COPPA Rule was amended on April 22, 2025" ([FTC FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)). Secondary sources report an effective date of 2025-06-23 and a full-compliance date of **2026-04-22** — i.e. **already past as of today**; the Federal Register page ([2025-05904](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule)) blocked automated fetch this session, so treat the exact dates as **UNVERIFIED against primary text** and confirm before relying on them.
- **The voice-as-text safe harbor.** FTC FAQ F.6: "when an operator collects an audio file containing a child's voice **solely as a replacement for written words**, such as to perform a search or fulfill a verbal instruction or request, and only maintains the file for the **brief time necessary** for that purpose, the FTC will not take an enforcement action" — but the operator must still give "clear online notice of its collection, use, and deletion policy regarding these audio files" ([FTC FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions); [2017 Enforcement Policy Statement, issued 2017-10-20](https://www.ftc.gov/legal-library/browse/federal-trade-commission-enforcement-policy-statement-regarding-applicability-childrens-online)). It does **not** apply if you ask for information via voice that would itself be personal information (e.g. a name).
- **The "internal operations" exception does not cover audio.** 16 CFR 312.5(c)(7) applies only "where an operator collects a persistent identifier **and no other personal information**" ([law.cornell.edu/cfr/text/16/312.5](https://www.law.cornell.edu/cfr/text/16/312.5)). And §312.5(a)(2) now requires separate parental consent for disclosure to third parties "unless such disclosure is integral to the website or online service." Sending child audio to a cloud ASR vendor is therefore a design decision with real legal weight — the voice-as-text policy above is the practical path, and on-device processing removes the question entirely.
- **State law / COPPA 2.0**: not researched this session — **UNVERIFIED**.

### 4.2 Platform store rules (these bite before the FTC does)

- **Apple, Guideline 1.3**: "Kids Category apps **may not send personally identifiable information or device information to third parties**. Apps in the Kids Category should not include third-party analytics or third-party advertising." Guideline 5.1.4 adds that apps collecting personal information from a minor "must include a privacy policy and must comply with all applicable children's privacy statutes", and warns "the parental gate requirement for the Kid's Category is generally **not** the same as securing parental consent to collect personal data under these privacy statutes" ([App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)).
- **Google Play Families**: apps solely targeting children "must not contain any APIs or SDKs that are not approved for use in primarily child-directed services"; mixed-audience apps must put unapproved SDKs "behind a neutral age screen". Explicitly names COPPA and GDPR ([Families policy](https://support.google.com/googleplay/android-developer/answer/9893335)).
- Apple's **Declared Age Range** API exists (page title confirmed at [developer.apple.com/documentation/DeclaredAgeRange](https://developer.apple.com/documentation/DeclaredAgeRange)) but its details could not be extracted — **UNVERIFIED**.

**Implication:** if you want the Kids Category badge, architecture (A) or (B) below is effectively mandatory.

### 4.3 Vendor-by-vendor

| Vendor | Under-13 end users? | Trains on your data? | Retention default | Zero retention? | Mentions COPPA? | DPA |
|---|---|---|---|---|---|---|
| **OpenAI** | **Yes, with ZDR** — "You should not use OpenAI services to process any personal data of children under 13 … without first implementing zero data retention in our API" ([guidance](https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance)) | No — "data sent to the OpenAI API is not used to train or improve OpenAI models" since 2023-03-01 ([your-data](https://developers.openai.com/api/docs/guides/your-data)) | Abuse logs up to 30 days | **Yes**, with prior approval; eligible endpoints include `/v1/realtime`, `/v1/audio/speech`, `/v1/audio/transcriptions` | **Yes**, explicitly | Yes |
| **ElevenLabs** | **No for voice input.** Privacy Policy §11: "All users are strictly prohibited from uploading, transmitting … Voice Data from children under the age of 18 available to us … or using them for any of our Services." ToS: "If you are under 18 years of age … you may not use our Services" ([ToS](https://elevenlabs.io/terms-of-use), 2026-03-31; [privacy](https://elevenlabs.io/privacy-policy), 2026-05-20) | Broad license to use Content "to improve the Services" ([ToS](https://elevenlabs.io/terms-of-use)) | Not specified generally; voice data ≤3 years | **Yes** — enterprise Zero Retention Mode ([API ZRM](https://elevenlabs.io/docs/eleven-api/resources/zero-retention-mode); [per-agent ZRM](https://elevenlabs.io/docs/eleven-agents/customization/privacy/zrm)) | **No** | Yes (policy "does not apply when we … process Personal Data on behalf of enterprise/business customers") |
| **Google — Gemini Developer API** | **No** — "will not use the Services as part of a … service that is directed towards or is likely to be accessed by individuals under the age of 18" ([terms](https://ai.google.dev/gemini-api/terms), 2026-04-28) | Paid tier: "Google doesn't use your prompts … or responses to improve our products." Unpaid tier: it does. | Paid: limited-period safety logs | n/a | No | Google Cloud DPA |
| **Google Cloud STT / Vertex AI** | No age clause found in [Service Specific Terms](https://cloud.google.com/terms/service-terms) — **absence ≠ permission, UNVERIFIED** | "By default, Cloud Speech-to-Text does not log customer audio data or transcripts" — logging is **opt-in** ([data-logging](https://docs.cloud.google.com/speech-to-text/docs/data-logging)) | No logging by default | Effectively yes | No | Yes |
| **Microsoft Azure AI Speech** | B2B; no end-user age clause found | No | **"No data trace"** — "For real-time speech to text, audio input is processed only on the Azure's server memory, and **no data is stored at rest**" / "Microsoft does not retain or store the data provided by customers" ([data-privacy-security](https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/speech-service/speech-to-text/data-privacy-security), updated 2026-08-26) | Effectively yes by default | No | Yes; also **Speech containers** run entirely on your own infrastructure |
| **Deepgram** | ToS: "You must be at least 18 years old or the minimum age required to consent…" ([terms](https://deepgram.com/terms), 2026-08-06). Privacy policy: "Our services are not intended for children under the age of 13" ([privacy](https://deepgram.com/privacy), dated 2021-10-26) | **Yes by default** — "you may opt out of model training on a per-request basis by setting the applicable parameter in your request" ([terms](https://deepgram.com/terms)) | Perpetual license to Your Content unless you opt out | Self-hosted deployment available | **No** ([compliance docs](https://developers.deepgram.com/docs/data-privacy-compliance): SOC 2 Type 1/2, HIPAA BAA, GDPR, CCPA — no COPPA) | Yes |
| **AssemblyAI** | "We do not knowingly collect or solicit Personal Data from children under 16 years of age" ([privacy](https://www.assemblyai.com/legal/privacy-policy), 2026-05-26) | Not addressed in the privacy policy | "as long as necessary" | Not documented | No | UNVERIFIED |
| **AWS (Transcribe / Polly / Nova)** | Not stated | **Yes by default** — "AWS AI services may use and store customer content for service improvement"; opt out via AWS Organizations AI services opt-out policy ([docs](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_ai-opt-out.html)) | Content may be stored, possibly out of region | Only via org-level opt-out | No | Yes |
| **LiveKit** | Not stated | For LiveKit Inference: "Prompts, audio, and completions pass through and aren't logged or kept" ([security](https://livekit.com/security)) | Media not stored by default; Egress writes to **your** buckets | Effectively yes; SRTP/DTLS in transit, AES-256 at rest | No | Yes — SOC 2 Type II, GDPR DPA, HIPAA BAA (Scale/Enterprise), EU-US DPF; **fully self-hostable (Apache-2.0)** |
| **Cartesia** | "Our Services are not intended for children"; deletes data from under-13s if discovered ([privacy](https://cartesia.ai/legal/privacy), 2024-06-14) | **Yes unless you opt out** via a form | Not specified | Not documented | No | UNVERIFIED |
| **Vapi** | Not verified | Pass-through to underlying vendors | Not verified | **ZDR add-on $1,000/mo** ([pricing](https://vapi.ai/pricing)) | No | HIPAA add-on $2,000/mo |
| **Picovoice** | n/a | n/a — runs entirely on-device, no cloud dependency after model download ([Rhino docs](https://picovoice.ai/docs/rhino/)) | No data leaves the device | n/a | No | n/a |

### 4.4 Practical read

1. **No cloud voice vendor advertises COPPA compliance or offers a COPPA-specific addendum.** Only OpenAI even mentions COPPA, and only to push the obligation onto you.
2. **The cleanest legal position by a wide margin is: the child's audio never leaves the device.** That eliminates the third-party disclosure question, the retention question, the Apple Kids Category question, and the Play Families SDK-approval question in one move.
3. **If you must use cloud ASR**, the ranking on compliance posture is: **Azure** ("no data trace", real-time audio never stored at rest, plus on-prem Speech containers) > **Google Cloud STT** (logging opt-in, no default retention) > **OpenAI with approved ZDR** > **LiveKit self-hosted** (you control everything) > Deepgram/Cartesia (train-by-default, opt-out required) > AWS (service-improvement by default).
4. **Whatever you choose, you still need**: a published written data retention policy (§312.10), notice covering audio collection/use/deletion (FTC FAQ F.6), a strictly "voice-as-text" interaction design, and immediate deletion.

---

## 5. Architecture options and cost

### 5.1 The three options

**(A) Fully on-device.** iOS `SpeechAnalyzer`/`DictationTranscriber` (iOS 26+) or `SFSpeechRecognizer` with `requiresOnDeviceRecognition = true` (iOS 13+) and `contextualStrings`; Android `createOnDeviceSpeechRecognizer` + `EXTRA_BIASING_STRINGS`; or Vosk/Picovoice Rhino for a hard grammar with identical behaviour on both platforms. Character voice = pre-rendered audio clips shipped with the app. No LLM.

**(B) Hybrid (recommended).** Same on-device ASR for answers and navigation. Same pre-rendered character clips for the ~2,000 known lines. A cloud LLM (+ live TTS) **only** for genuinely open-ended moments — "why is that wrong?", "explain it another way" — behind an explicit affordance, with a scripted offline fallback.

**(C) Full cloud realtime agent.** LiveKit Agents, OpenAI Realtime, Azure Voice Live, ElevenLabs Agents, etc. Continuous audio streaming both directions for the whole session.

### 5.2 Comparison

| Dimension | (A) On-device | (B) Hybrid | (C) Cloud realtime |
|---|---|---|---|
| **Recurring cost / child / month** (600 min) | **$0** | **< $1** | **$7 – $48** |
| **Answer latency** | ~100–300 ms, no network | Same for answers; ~1–3 s only for "explain it" | 300 ms – 1.5 s, network-dependent; LiveKit publishes 295–543 ms EOU alone ([blog](https://livekit.com/blog/solving-end-of-turn-detection)) |
| **Character voice consistency** | Perfect (fixed clips) | Perfect for scripted lines; live TTS may drift | Depends on model determinism |
| **Offline** | Full | Core loop works offline | None |
| **Privacy exposure** | **Zero** — no child audio leaves device | Zero for answers; LLM sees only text of a question | Continuous child audio to a third party |
| **Apple Kids Category / Play Families** | Clean | Clean for the core loop; the LLM call needs review | Likely disqualifying under Apple 1.3 |
| **Build complexity** | Low–medium (two platform ASR paths, or one via Vosk/Picovoice) | Medium | Medium–high (backend, session management, turn-detection tuning, ZDR approval) |
| **Robustness on 6-year-old speech** | **Best** — hard grammar over ~110 tokens | Best for answers | Worst — open-vocabulary ASR on the hardest speaker population, plus a generic EOU model that will cut off a thinking child |

### 5.3 Rough monthly cost for one child at 20 min/day (600 min/month)

Assumptions stated so you can re-run them: 30 days; a 20-minute session contains ~40 spoken answers of ~2 s each (≈80 s of actual child speech, ~7% of wall clock); ~2 "explain it" LLM turns per session; pre-rendered clips are a one-time cost, not recurring.

| Architecture | Component | Monthly |
|---|---|---|
| **(A) On-device** | Apple/Android speech APIs, Vosk (Apache-2.0), or whisper.cpp (MIT) | **$0.00** |
| | Picovoice Rhino instead, if chosen | per-MAU, **UNVERIFIED** ([pricing](https://picovoice.ai/pricing/)) |
| **(B) Hybrid** | On-device ASR | $0.00 |
| | ~60 LLM turns × ~700 tok, at `gpt-realtime-2.1-mini` text rates ($0.60/$2.40 per 1M) | ~$0.05 |
| | Live TTS for ~60 explanations ≈ 15k chars, at Azure's documented $15/1M chars ([quotas doc](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-services-quotas-and-limits)) | ~$0.23 |
| | **Total** | **≈ $0.30** |
| | *If you swap in cloud ASR (streaming only during answer windows, ~90 min/mo) at Deepgram Nova-3 streaming $0.0048/min + keyterm $0.0013/min* ([pricing](https://deepgram.com/pricing)) | *+ ~$0.55* |
| **(C) Cloud realtime** | Google Gemini 3.1 Flash Live @ $0.023/min full-duplex | $13.80 — **but ToS-blocked** |
| | OpenAI `gpt-realtime-2.1-mini` @ $0.015–0.030/min | **$9 – $18** |
| | OpenAI `gpt-realtime-2.1` @ $0.048–0.096/min | **$29 – $58** |
| | LiveKit Cloud agent-session $0.01/min + STT/LLM/TTS | **$6 + models** |
| | Pipecat Cloud agent-1x $0.01/min (active) + free Daily voice transport + models | **$6 + models** |
| | Vapi $0.05/min platform + at-cost models | **$30 + models** |
| | Deepgram Voice Agent @ $0.075/min standard | **$45** |
| | ElevenLabs Agents @ $0.080/min overage | **$48** |
| | Cartesia Agents @ $0.06/min | **$36** |
| | Retell @ $0.07–0.31/min | **$42 – $186** |

**The dominant cost driver in (C) is not talking — it's silence.** Realtime agents bill wall-clock session time, and a 6-year-old solving "8 + 5" spends most of a session thinking. At ~7% actual speech, you are paying roughly 14× the rate you'd pay for the audio you actually process. At scale this is decisive: 10,000 daily-active children on option (C) with `gpt-realtime-2.1` is **~$290k/month**; on option (B) it is **~$3k/month**.

### 5.4 One-time pre-rendering cost

See §2 for the per-vendor calculation on ~2,000 lines × ~60 chars ≈ 120,000 characters. On every vendor surveyed this is a **one-time cost in the tens of dollars at most** — trivially cheaper than paying for the same audio repeatedly at runtime, and it buys you determinism, offline support, zero latency, and QA-able audio you can listen to before shipping.

---

## Recommendation

**Ship architecture (B): on-device constrained ASR + pre-rendered character voice + a narrow cloud LLM escape hatch.**

1. **Character voice — pre-render everything.** Design one voice, render all ~2,000 lines offline, ship them as assets. This gives perfect consistency (the thing a 6-year-old actually notices), zero runtime latency, zero per-play cost, offline play, and — critically — it sends **no user data anywhere**, so the child-voice ToS problems in §4 simply don't arise. The whole render costs under $25 on any vendor, so choose on voice quality and licensing clarity:
   - **First choice: ElevenLabs Eleven v3 + Voice Design**, for an actual designed cartoon character with a "Characters & Animation" library to audition against, and a ToS that permits using downloaded Output outside the Services ([§4(a)](https://elevenlabs.io/terms-of-use)). Nail down which tier grants commercial rights in writing first — that clause is **UNVERIFIED**.
   - **Safest license: Amazon Polly**, whose FAQ answers this exact question affirmatively — "You can cache and replay Amazon Polly's generated speech at no additional cost" — and which ships three US-English child voices (Ivy, Justin, Kevin). Remember to set the AWS Organizations AI-services opt-out so your text isn't used for service improvement.
   - **Free fallback: Kokoro-82M** (Apache-2.0, commercial use explicit) if you want zero vendor terms at all. **Avoid `OHF-Voice/piper1-gpl` (GPL-3.0)** inside a closed-source game.
   - **Do not** use Apple Personal Voice — it is contractually "personal, non-commercial use" only.
2. **Answers and navigation — on-device, grammar-constrained.** Build the recognizer against a closed grammar of numbers 0–100 plus `yes/no/next/hint/repeat/help`. Two viable paths:
   - *Platform-native*: iOS `SpeechAnalyzer`/`DictationTranscriber` (iOS 26+) or `SFSpeechRecognizer` with `requiresOnDeviceRecognition` + `contextualStrings` (≤100 phrases — so bias toward the *plausible* answers for the current problem, not all 110 tokens); Android `createOnDeviceSpeechRecognizer` + `EXTRA_BIASING_STRINGS`. Free, no SDK to get approved, best store-policy posture.
   - *Cross-platform, harder constraint*: **Vosk** with `SetGrammar()` (Apache-2.0, ~50 MB, genuinely prunes the decoding graph) or **Picovoice Rhino** (better published accuracy: >99% clean / 97% at 9 dB SNR, but B2B per-MAU licensing you must price out).
   Whichever you pick, **score against the small candidate set for the current problem** rather than transcribing freely — this is the single biggest accuracy win available on child speech, and it is free.
3. **"Explain it" — cloud LLM behind an explicit button, with an offline fallback.** Send *text* (the problem, the child's answer), not audio. That keeps you inside the FTC voice-as-text posture and outside every vendor's child-audio clause. Cost is negligible (~$0.05/child/month).
4. **Do not build on a full-duplex agent for v1.** It costs 30–150× more per child, is 10–20× worse on the exact speaker population you're targeting, breaks offline play, likely disqualifies you from Apple's Kids Category (Guideline 1.3), and its turn-detection models are tuned on adult conversational rhythm — they will cut off a first-grader mid-think. Revisit only if you add genuinely conversational tutoring.
5. **If and when you do need a cloud realtime agent, the two defensible choices are:**
   - **LiveKit Agents** — Apache-2.0 and fully self-hostable (so the audio can stay on infrastructure you control), the broadest client SDK matrix including **Unity**, first-class in-process tool calling via `@function_tool` + `RunContext`, and the only published EOU benchmark. $0.01/min agent-session on Cloud, or $0 self-hosted plus your own model costs.
   - **Azure Voice Live API** — the best compliance posture of any cloud realtime option ("no data trace", Speech containers for on-prem), and uniquely it supports **phrase lists on audio input** *and* **custom speech models** inside the realtime loop, meaning you can both constrain the vocabulary and eventually fine-tune on child speech — the two interventions the literature says actually work. Cost is **UNVERIFIED** (JS-rendered pricing page); get quotes before committing.
   Avoid Gemini Live (ToS-blocked), ElevenLabs Agents (child-audio prohibited), Nova Sonic (backend-only, v1 EOL 2026-09-14, service-improvement by default), and Vapi (server-webhook-only tools, poor fit for client-side game state).
6. **Compliance to-do regardless of architecture**: publish a written data retention policy (16 CFR 312.10 requires it, and the compliance date has passed); give notice of audio collection/use/deletion; never ask a child to *say* anything that is itself personal information; delete audio immediately; and if you target the Kids Category, verify every SDK against Apple 1.3 and Play Families before submission.
7. **Before locking anything in, run one experiment**: record 20–30 US first-graders saying numbers 0–100 and the six commands in a realistic noisy room, and measure (a) open-vocabulary cloud ASR, (b) the same with phrase boosting, (c) on-device platform ASR with contextual strings, and (d) Vosk/Rhino grammar. Nobody publishes this number for 6-year-olds — you will have to be the source.

---

## Sources

**Law and policy**
- 16 CFR 312.2 — definitions incl. audio files and voiceprints: https://www.law.cornell.edu/cfr/text/16/312.2
- 16 CFR 312.5 — exceptions to parental consent: https://www.law.cornell.edu/cfr/text/16/312.5
- 16 CFR 312.10 — data retention and deletion: https://www.law.cornell.edu/cfr/text/16/312.10
- FTC, Complying with COPPA: Frequently Asked Questions: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
- FTC Enforcement Policy Statement on voice recordings (2017-10-20): https://www.ftc.gov/legal-library/browse/federal-trade-commission-enforcement-policy-statement-regarding-applicability-childrens-online
- Federal Register, COPPA Rule amendments (2025-04-22): https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule
- Apple App Review Guidelines (1.3, 5.1.4): https://developer.apple.com/app-store/review/guidelines/
- Google Play Families policy: https://support.google.com/googleplay/android-developer/answer/9893335

**Voice agent platforms**
- LiveKit Agents docs: https://docs.livekit.io/agents/ · tools: https://docs.livekit.io/agents/logic/tools/definition/ · turns: https://docs.livekit.io/agents/logic/turns/ · integrations: https://docs.livekit.io/agents/integrations/
- LiveKit pricing: https://livekit.com/pricing · security: https://livekit.com/security · EOU benchmark: https://livekit.com/blog/solving-end-of-turn-detection · turn-detector model: https://huggingface.co/livekit/turn-detector · repos: https://github.com/livekit
- Pipecat: https://github.com/pipecat-ai/pipecat · docs: https://docs.pipecat.ai/ · function calling: https://docs.pipecat.ai/pipecat/learn/function-calling · Smart Turn v3: https://huggingface.co/pipecat-ai/smart-turn-v3 · Pipecat Cloud pricing: https://www.daily.co/pricing/pipecat-cloud/
- Vapi pricing: https://vapi.ai/pricing · custom tools: https://docs.vapi.ai/tools/custom-tools · web SDK: https://github.com/VapiAI/web
- OpenAI Realtime: https://developers.openai.com/api/docs/guides/realtime · WebRTC: https://developers.openai.com/api/docs/guides/realtime-webrtc · costs: https://developers.openai.com/api/docs/guides/realtime-costs · pricing: https://developers.openai.com/api/docs/pricing · deprecations: https://developers.openai.com/api/docs/deprecations
- Gemini Live API: https://ai.google.dev/gemini-api/docs/live-api · capabilities: https://ai.google.dev/gemini-api/docs/live-api/capabilities · pricing: https://ai.google.dev/gemini-api/docs/pricing · session mgmt: https://ai.google.dev/gemini-api/docs/live-api/session-management · terms: https://ai.google.dev/gemini-api/terms
- Amazon Nova Sonic: https://docs.aws.amazon.com/nova/latest/userguide/speech.html · Nova 2: https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-conversational-speech.html · region/EOL: https://docs.aws.amazon.com/bedrock/latest/userguide/models-region-compatibility.html · pricing: https://aws.amazon.com/bedrock/pricing/
- ElevenLabs Agents: https://elevenlabs.io/docs/conversational-ai/overview · client tools: https://elevenlabs.io/docs/conversational-ai/customization/tools/client-tools · pricing: https://elevenlabs.io/pricing/agents · models/latency: https://elevenlabs.io/docs/overview/models
- Azure Voice Live: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live · customization: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-how-to-customize
- Deepgram Voice Agent: https://developers.deepgram.com/docs/voice-agent · Retell: https://www.retellai.com/pricing · Cartesia: https://cartesia.ai/pricing

**Text-to-speech**
- ElevenLabs models: https://elevenlabs.io/docs/models · Voice Design: https://elevenlabs.io/docs/product-guides/voices/voice-design · Voice Library: https://elevenlabs.io/voice-library · pricing: https://elevenlabs.io/pricing · ToS: https://elevenlabs.io/terms-of-use
- Cartesia overview: https://docs.cartesia.ai/get-started/overview · pricing: https://cartesia.ai/pricing · terms: https://cartesia.ai/legal/terms
- OpenAI TTS guide: https://developers.openai.com/api/docs/guides/text-to-speech · pricing: https://developers.openai.com/api/docs/pricing
- Google Cloud TTS voice types: https://docs.cloud.google.com/text-to-speech/docs/voice-types · pricing: https://cloud.google.com/text-to-speech/pricing · general terms: https://cloud.google.com/terms/
- Azure TTS voice list (child voices): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts · SSML styles: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice · Custom Neural Voice limited access: https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/speech-service/text-to-speech/limited-access · Retail Prices API: https://prices.azure.com/api/retail/prices
- Amazon Polly pricing: https://aws.amazon.com/polly/pricing/ · voices: https://docs.aws.amazon.com/polly/latest/dg/available-voices.html · FAQ (caching): https://aws.amazon.com/polly/faqs/ · AWS Service Terms §50: https://aws.amazon.com/service-terms/ · Kevin child voice launch: https://aws.amazon.com/about-aws/whats-new/2020/06/amazon-polly-launches-a-child-us-english-ntts-voice/
- Rime models: https://docs.rime.ai/api-reference/models · pricing: https://rime.ai/pricing · terms: https://rime.ai/terms
- PlayHT API docs: https://docs.play.ht/reference/api-getting-started
- Kokoro-82M: https://huggingface.co/hexgrad/Kokoro-82M · ONNX: https://huggingface.co/onnx-community/Kokoro-82M-ONNX · kokoro-onnx: https://github.com/thewh1teagle/kokoro-onnx
- Piper (archived, MIT): https://github.com/rhasspy/piper · Piper (active, GPL-3.0): https://github.com/OHF-Voice/piper1-gpl
- Apple AVSpeechSynthesizer: https://developer.apple.com/documentation/avfoundation/avspeechsynthesizer · Personal Voice terms: https://support.apple.com/en-us/104993
- AOSP licenses: https://source.android.com/setup/start/licenses

**Child speech ASR**
- Fan, Shankar & Alwan, "Benchmarking Children's ASR…" arXiv:2406.10507: https://arxiv.org/html/2406.10507v1
- Attia et al., "Kid-Whisper" arXiv:2309.07927: https://arxiv.org/abs/2309.07927
- Jain et al., Interspeech 2023, arXiv:2307.13008: https://arxiv.org/abs/2307.13008
- Dutta et al., WOCCI/Interspeech 2025, arXiv:2507.14451: https://arxiv.org/abs/2507.14451
- Lo et al., Interspeech 2020 challenge, arXiv:2005.08433: https://arxiv.org/abs/2005.08433
- "Causal Analysis of ASR Errors for Children" arXiv:2502.08587: https://arxiv.org/abs/2502.08587
- Okur et al. (Intel), BEA @ ACL 2023, arXiv:2306.00482: https://arxiv.org/pdf/2306.00482
- Arabic Little STT, arXiv:2510.23319: https://arxiv.org/abs/2510.23319
- CMU Kids corpus: https://catalog.ldc.upenn.edu/LDC97S63 · CSLU Kids: https://catalog.ldc.upenn.edu/LDC2007S18

**STT vendors and constrained recognition**
- Deepgram pricing: https://deepgram.com/pricing · keyterm: https://developers.deepgram.com/docs/keyterm · keywords: https://developers.deepgram.com/docs/keywords · numerals: https://developers.deepgram.com/docs/numerals · smart-format: https://developers.deepgram.com/docs/smart-format · models: https://developers.deepgram.com/docs/model
- AssemblyAI pricing: https://www.assemblyai.com/pricing · keyterms prompting: https://www.assemblyai.com/docs/pre-recorded-audio/universal-3-5-pro/prompting
- Azure phrase list: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/improve-accuracy-phrase-list · intent recognition retirement: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/migrate-intent-recognition · pronunciation assessment limitations: https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/speech-service/pronunciation-assessment/characteristics-and-limitations-pronunciation-assessment
- Google speech adaptation: https://docs.cloud.google.com/speech-to-text/docs/speech-adaptation · class tokens: https://docs.cloud.google.com/speech-to-text/v2/docs/class-tokens · data logging: https://docs.cloud.google.com/speech-to-text/docs/data-logging
- Apple: SpeechAnalyzer https://developer.apple.com/documentation/speech/speechanalyzer · SpeechTranscriber https://developer.apple.com/documentation/speech/speechtranscriber · DictationTranscriber https://developer.apple.com/documentation/speech/dictationtranscriber · AnalysisContext https://developer.apple.com/documentation/speech/analysiscontext · contextualStrings https://developer.apple.com/documentation/speech/sfspeechrecognitionrequest/contextualstrings · requiresOnDeviceRecognition https://developer.apple.com/documentation/speech/sfspeechrecognitionrequest/requiresondevicerecognition · WWDC25 session 277 https://developer.apple.com/videos/play/wwdc2025/277/
- Android: SpeechRecognizer https://developer.android.com/reference/android/speech/SpeechRecognizer · RecognizerIntent https://developer.android.com/reference/android/speech/RecognizerIntent · AOSP source https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/core/java/android/speech/
- Vosk: https://alphacephei.com/vosk/ · https://github.com/alphacep/vosk-api · grammar example https://raw.githubusercontent.com/alphacep/vosk-api/master/python/example/test_words.py · adaptation https://alphacephei.com/vosk/adaptation
- whisper.cpp: https://github.com/ggml-org/whisper.cpp · Moonshine: https://github.com/moonshine-ai/moonshine · sherpa-onnx: https://github.com/k2-fsa/sherpa-onnx · hotwords: https://k2-fsa.github.io/sherpa/onnx/hotwords/index.html
- Picovoice Rhino: https://github.com/Picovoice/rhino · docs https://picovoice.ai/docs/rhino/ · FAQ https://picovoice.ai/docs/faq/rhino/ · general FAQ https://picovoice.ai/docs/faq/general/ · pricing https://picovoice.ai/pricing/

**Privacy / terms**
- OpenAI under-18 API guidance: https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance · data controls: https://developers.openai.com/api/docs/guides/your-data
- ElevenLabs ToS: https://elevenlabs.io/terms-of-use · privacy: https://elevenlabs.io/privacy-policy · ZRM (API): https://elevenlabs.io/docs/eleven-api/resources/zero-retention-mode · ZRM (agents): https://elevenlabs.io/docs/eleven-agents/customization/privacy/zrm
- Azure Speech data/privacy/security: https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/speech-service/speech-to-text/data-privacy-security
- Deepgram terms: https://deepgram.com/terms · privacy: https://deepgram.com/privacy · compliance: https://developers.deepgram.com/docs/data-privacy-compliance
- AssemblyAI privacy: https://www.assemblyai.com/legal/privacy-policy
- Cartesia privacy: https://cartesia.ai/legal/privacy
- AWS AI services opt-out policy: https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_ai-opt-out.html
- Google Cloud Service Specific Terms: https://cloud.google.com/terms/service-terms

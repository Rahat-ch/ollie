# ElevenLabs Licensing, IP & API Terms — Primary-Source Fact-Check

**Research date: 2026-09-10.** This note is a targeted primary-source fact-check done by fetching pages directly from `elevenlabs.io` (and attempting `help.elevenlabs.io`) with WebFetch, not by relying on search-result summaries. It answers 5 specific licensing/IP/API questions raised while evaluating ElevenLabs for the K-5 math game. `help.elevenlabs.io` returned **HTTP 403 to automated fetch on every attempt** — its content is not represented here except where a docs.elevenlabs.io page happened to restate the same fact. Where a claim could not be pinned to fetched primary-source text, it is marked **UNVERIFIED** with the reason.

---

## Summary — 7 decision-relevant findings

1. **Free tier is explicitly non-commercial; Starter ($6/mo, 30,000 credits/mo) is the cheapest tier with a commercial license.** ToS §1(c): "if you access or use our Services free of charge (such a user, a 'Free User'), you may only use the Services for non-commercial purposes; if you access or use our Services through a paid subscription plan (such a user, a 'Paid User'), you may use the Services for commercial purposes" ([elevenlabs.io/terms-of-use](https://elevenlabs.io/terms-of-use)). The pricing page lists "Commercial License" as a bullet that first appears under Starter, not Free ([elevenlabs.io/pricing](https://elevenlabs.io/pricing)).
2. **The ToS does not squarely address the "hackathon IP assigned to a third-party company" scenario — it is silent, not explicit.** §4(c)(ii) gives the *user* ("as between you and ElevenLabs") all rights in Output; §5(b)'s "non-transferable, non-sublicensable" language applies to the **license to access the ElevenLabs Service/app**, not to the Output itself. No clause was found restricting the user's own downstream assignment or transfer of Output ownership to a third party (e.g., "Nerdy"). This is a **meaningful but unverified gap** — absence of a prohibition is not the same as an affirmative permission, and no ElevenLabs lawyer statement was found confirming it.
3. **Voice Design is available via both the web app and the API**, and appears to require no tier above Free — it's listed as a Free-plan bullet ([elevenlabs.io/pricing](https://elevenlabs.io/pricing)). A generation produces **3 voice variants**, billed once for the preview text ([product guide](https://elevenlabs.io/docs/product-guides/voices/voice-design)). Saving a variant consumes one voice-library slot, and its `generated_voice_id` is used with `/v1/text-to-voice` to create a persistent voice usable in the standard TTS endpoint ([API reference](https://elevenlabs.io/docs/api-reference/text-to-voice)).
4. **`eleven_v3` (and its realtime sibling `eleven_v3_conversational`) is the only documented model with inline "audio tags"** for emotional/expressive control (laugh, whisper, sarcasm, curiosity) ([v3 prompting guide](https://elevenlabs.io/docs/best-practices/prompting/eleven-v3)). Older/cheaper models (`eleven_multilingual_v2`, `eleven_flash_v2_5`) are not documented as supporting this tag syntax.
5. **The `/v1/text-to-speech/{voice_id}` convert endpoint supports MP3, PCM, WAV, µ-law/A-law, and Opus output formats** via the `output_format` parameter (e.g. `mp3_44100_128`, `pcm_44100`, `opus_48000_128`); higher MP3 bitrates are tier-gated — "MP3 with 192kbps bitrate requires you to be subscribed to Creator tier or above" ([API reference](https://elevenlabs.io/docs/api-reference/text-to-speech/convert)).
6. **Neither the ToS nor the docs make an affirmative statement that generated audio can be cached/reused indefinitely, but they also impose no re-generation requirement.** ToS §4(a): "We may enable you to download Output from some (but not all) of the Services; in such cases, you are permitted to use such Output outside of the Services but always subject to these Terms and our Prohibited Use Policy" ([elevenlabs.io/terms-of-use](https://elevenlabs.io/terms-of-use)) — no duration limit is stated. **UNVERIFIED as an explicit "yes, cache forever" clause** (contrast with Amazon Polly's explicit caching FAQ language, per sibling doc `03-voice-ai.md` §2.4).
7. **No clause was found prohibiting cartoon/character voices or Voice Design of fictional personas — the Voice Design feature is explicitly marketed for characters.** The Prohibited Use Policy's impersonation clause targets replicating **a real, identifiable person's voice** without consent, and carves out fiction: violent-content restrictions "do not apply to activity in purely fictional contexts (e.g. violent speech by a character in a book, video game or movie)" ([elevenlabs.io/use-policy](https://elevenlabs.io/use-policy)). Separately, the ToS/Privacy Policy children's clause found is about **inputting** children's voice/personal data (barred under 18), not about generating output **for** a child audience — see §5 below.

---

## 1. Commercial licensing by tier

**Pricing page tiers** (fetched fresh; consistent with the sibling doc `03-voice-ai.md`'s numbers from the previous day) ([elevenlabs.io/pricing](https://elevenlabs.io/pricing)):

| Tier | Price/mo | Credits/mo | "Commercial License" bullet? |
|---|---|---|---|
| Free | $0 | 10,000 | Not listed |
| Starter | $6 | 30,000 | **Yes** — first tier where "Commercial License" appears as a bullet, under "Everything in free, plus" |
| Creator | $22 (first month $11) | 121,000 | Inherits from Starter |
| Pro | $99 | 600,000 | Inherits |
| Scale | $299 | 1,800,000 | Inherits |
| Business | $990 | 6,000,000 | Inherits |
| Enterprise | Custom | Custom | Custom terms |

The **Free** plan's fetched feature list is: "$0 per month, 10k credits per month, Text to Speech, Speech to Text, Sound Effects, Voice Design, Music, Productions, Image, 3 Projects in Studio" — no "Commercial License" bullet. **Starter**'s list adds: "Commercial License, Instant Voice Cloning, 20 Projects in Studio, Music commercial use, Dubbing Studio, Image & Video" ([elevenlabs.io/pricing](https://elevenlabs.io/pricing)).

**ToS confirms the Free-tier restriction directly.** §1(c): "if you access or use our Services free of charge (such a user, a 'Free User'), you may only use the Services for non-commercial purposes; if you access or use our Services through a paid subscription plan (such a user, a 'Paid User'), you may use the Services for commercial purposes" ([elevenlabs.io/terms-of-use](https://elevenlabs.io/terms-of-use)).

**The billing docs restate this in plainer language, and add an attribution condition for Free use**: "When generating content on our paid plans, you get commercial rights to use that content. If you are on the free plan, you can use the content non-commercially with attribution" ([elevenlabs.io/docs/product-guides/administration/billing](https://elevenlabs.io/docs/product-guides/administration/billing)). The "with attribution" condition on Free-tier non-commercial use was not found stated this explicitly anywhere else — worth re-confirming before relying on it, but it is a directly fetched docs quote.

**Answer: the cheapest paid tier with commercial rights is Starter — $6/month, 30,000 credits/month.**

---

## 2. IP assignment / third-party ownership

**Output ownership (§4(c)(ii)):** "Except as expressly set forth herein, as between you and ElevenLabs, you retain all rights in and to your Output" ([elevenlabs.io/terms-of-use](https://elevenlabs.io/terms-of-use)). Input ownership is parallel: "as between you and ElevenLabs, you retain all rights in and to your Input" (§4(c)(i)).

**License to use Output outside the platform (§4(a)):** "We may enable you to download Output from some (but not all) of the Services; in such cases, you are permitted to use such Output outside of the Services but always subject to these Terms and our Prohibited Use Policy."

**License you grant back to ElevenLabs (§4(d), "License to Your Content"):** "You hereby grant to ElevenLabs a license to use, reproduce, modify, adapt, publish, translate, create derivative works from, distribute, publicly or otherwise perform and display, and use your Content to provide the Services." That license is described as "perpetual and irrevocable," "nonexclusive," "royalty-free and fully paid," "worldwide," and "sub-licensable, through multiple tiers" — but note this is a grant **from the user to ElevenLabs**, not a grant of sublicensing rights **to** the user over the Output.

**The clause that actually says "non-transferable, non-sublicensable" is §5(b), and it governs a different thing than Output ownership:** "Subject to your compliance with these Terms, ElevenLabs hereby grants to you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to access and use our Services" ([elevenlabs.io/terms-of-use](https://elevenlabs.io/terms-of-use)). This is the license to use the **ElevenLabs app/API itself** (i.e., you can't let someone else log into your account or resell API access) — it is under "Section 5: Our Intellectual Property," a section about ElevenLabs' own IP in the Services, not about the audio files you generate.

**Net read for the hackathon scenario:** The ToS does not contain a clause that says "Output may not be assigned/transferred to a third party" or, conversely, a clause that affirmatively says "you may assign your rights in Output to anyone." It grants the account holder full ownership of Output (§4(c)(ii)) and permits using downloaded Output outside the Services (§4(a)), subject to the Prohibited Use Policy. Since the user (the hackathon participant, presumably the ElevenLabs account holder) owns the Output outright, ordinary IP-assignment principles would suggest they can assign their own rights in that Output to Nerdy the same way they'd assign rights in any other work product — **but this is an inference from silence, not a quoted clause, and should be confirmed with counsel before relying on it for a real product launch.** **UNVERIFIED as an explicitly-addressed scenario — the ToS is silent on downstream Output-ownership transfer specifically.**

Also relevant: separate credit-transfer restrictions exist but are about **Prepaid Credits**, not Output — §6(b)(iv): "Prepaid Credits may not be transferred, sold, gifted, traded, sublicensed, or assigned," and §6(b)(viii): "ElevenLabs does not permit or recognize the sale, transfer, gift, trade, or exchange of Prepaid Credits." These do not apply to the generated audio files themselves.

---

## 3. Voice Design (text-to-voice) API access

**Available via both the web app and API.** The product guide states: "You can find Voice Design by heading to Voices -> My Voices -> Add a new voice -> Voice Design in the ElevenLabs app **or via the API**" ([elevenlabs.io/docs/product-guides/voices/voice-design](https://elevenlabs.io/docs/product-guides/voices/voice-design)).

**Tier gating:** No explicit "Voice Design requires tier X" statement was found in the docs or API reference. It is a listed bullet under the **Free** plan on the pricing page ([elevenlabs.io/pricing](https://elevenlabs.io/pricing)), implying it's available account-wide from Free upward (subject, on Free, to the non-commercial restriction from §1 above). **UNVERIFIED beyond this inference** — no page directly states "Voice Design available on: Free, Starter, ...".

**Cost per generation:** "When you hit generate, we'll generate **three voice options** for you," and "The only charge for using voice design is the number of credits to generate your preview text, which you are only charged once even though we are generating three samples for you" ([elevenlabs.io/docs/product-guides/voices/voice-design](https://elevenlabs.io/docs/product-guides/voices/voice-design)). This means cost = (credits for the preview-text character count), charged once, regardless of the 3 variants produced. The exact credit-per-character multiplier for Voice Design's underlying model (`eleven_ttv_v3` / `eleven_multilingual_ttv_v2`) was **not found stated as a number** — **UNVERIFIED**.

**API mechanics:** The endpoint is `POST https://api.elevenlabs.io/v1/text-to-voice/design`. "This method returns a list of voice previews. Each preview has a `generated_voice_id` and a sample of the voice as base64 encoded mp3 audio." To persist a voice: "use the `generated_voice_id` of the preferred preview with the `/v1/text-to-voice` endpoint" ([elevenlabs.io/docs/api-reference/text-to-voice](https://elevenlabs.io/docs/api-reference/text-to-voice)).

**Reuse in TTS calls — confirmed.** The product guide states that after generating, "you'll have the option to select and save one of the generations, which will take up one of your voice slots" ([elevenlabs.io/docs/product-guides/voices/voice-design](https://elevenlabs.io/docs/product-guides/voices/voice-design)). Combined with the API reference's statement that the saved voice is created via `/v1/text-to-voice` from a `generated_voice_id`, and that ElevenLabs' standard voice objects carry a persistent `voice_id` used by the TTS convert endpoint (`/v1/text-to-speech/{voice_id}`, per §4 below), a Voice-Design-created voice does become a normal library voice with a `voice_id` reusable in TTS calls. **The exact field name transition (`generated_voice_id` → final `voice_id`) is a reasonable inference from the fetched text but was not seen spelled out in one single quoted sentence — flagging as a minor UNVERIFIED point on naming, though the overall reuse capability is well supported.**

---

## 4. Text-to-speech API specifics

**Current model IDs**, fetched from the models docs ([elevenlabs.io/docs/models](https://elevenlabs.io/docs/models)):

| Model ID | Description (quoted) | Audio tags? |
|---|---|---|
| `eleven_v3` | "Human-like and expressive speech generation," 70+ languages, 5,000-char limit | **Yes** — confirmed separately via the v3 prompting guide (below) |
| `eleven_v3_conversational` | "Our most expressive, realtime speech synthesis model (~280ms)," 70+ languages | **Yes** — docs explicitly say "Supports audio tags for fine-grained control" |
| `eleven_multilingual_v2` | "Lifelike, consistent quality speech synthesis model," 29 languages, 10,000-char limit | Not documented as supporting audio tags |
| `eleven_flash_v2_5` | "Ultra-fast model optimized for real-time use (~75ms)," 32 languages, 40,000-char limit | Not documented as supporting audio tags |
| `eleven_flash_v2` | English-only, ~75ms latency, 30,000-char limit | Not documented |
| `eleven_ttv_v3` | Text-to-Voice model, 70+ languages (Voice Design) | N/A (voice-design, not TTS) |
| `eleven_multilingual_ttv_v2` | "State-of-the-art multilingual voice designer," 29 languages (Voice Design) | N/A |
| `scribe_v2` / `scribe_v2_realtime` | Speech-to-text models | N/A |
| `eleven_multilingual_sts_v2` / `eleven_english_sts_v2` | Speech-to-speech voice changers | N/A |
| `music_v2` / `eleven_text_to_sound_v2` | Music / sound-effects generation | N/A |

**Audio tags** are confirmed specifically for `eleven_v3`: "Eleven v3 introduces emotional control through audio tags. You can direct voices to laugh, whisper, act sarcastic, or express curiosity among many other styles" ([elevenlabs.io/docs/best-practices/prompting/eleven-v3](https://elevenlabs.io/docs/best-practices/prompting/eleven-v3)). Whether `eleven_v3_conversational` shares the identical tag syntax was stated in the models table ("Supports audio tags for fine-grained control") but not cross-verified against the prompting guide itself.

**Per-character cost at the cheapest commercial tier (Starter, $6/30,000 credits):**
- Rate: $6 ÷ 30,000 credits = **$0.0002/credit**.
- Docs state the credit multiplier generically: "For V2 Multilingual models, 1 text character equals 1 credit. For V2 Flash/Turbo English and V2.5 Flash/Turbo Multilingual models, discounted pricing applies... costing between 0.5 and 1 credit per character" ([elevenlabs.io/pricing](https://elevenlabs.io/pricing)).
- Derived: `eleven_multilingual_v2` (1 credit/char) ≈ **$0.0002/char = $0.20 per 1,000 characters** at Starter rates. Flash models (~0.5 credit/char at the cheap end) ≈ **$0.0001/char = $0.10 per 1,000 characters**.
- **`eleven_v3`'s specific credit-per-character multiplier was not found stated as a number anywhere fetched** (pricing page, billing docs, or v3 prompting guide) — **UNVERIFIED**. Given `eleven_v3` is grouped with "V2 Multilingual" models in general messaging elsewhere in ElevenLabs' docs ecosystem, 1 credit/char is a plausible but unconfirmed assumption; do not build cost projections on it without confirming directly (e.g., by generating a small sample and checking credit deduction).

**Output format / codec — confirmed via the API reference** ([elevenlabs.io/docs/api-reference/text-to-speech/convert](https://elevenlabs.io/docs/api-reference/text-to-speech/convert)): the `/v1/text-to-speech/{voice_id}` convert endpoint's `output_format` parameter accepts, among others:
- MP3: `mp3_22050_32`, `mp3_24000_48`, `mp3_44100_32`, `mp3_44100_64`, `mp3_44100_96`, `mp3_44100_128`, `mp3_44100_192`
- PCM: `pcm_8000` through `pcm_48000`
- WAV: `wav_8000` through `wav_48000`
- Opus: `opus_48000_32` through `opus_48000_192`
- Telephony codecs: `alaw_8000`, `ulaw_8000`

with a tier gate noted: "MP3 with 192kbps bitrate requires you to be subscribed to Creator tier or above." The response for a successful call ("The generated audio file") is a direct binary file download — i.e., **yes, MP3 is available (default/common choice), and it's one of several selectable formats, not the only one.**

**Caching/reuse of generated audio:** No explicit "you may cache/store Output indefinitely" clause was found, but also no explicit prohibition or required re-generation cadence. The operative language is ToS §4(a): "We may enable you to download Output from some (but not all) of the Services; in such cases, you are permitted to use such Output outside of the Services but always subject to these Terms and our Prohibited Use Policy" ([elevenlabs.io/terms-of-use](https://elevenlabs.io/terms-of-use)) — no duration or retention limit is stated in that sentence. Separately, §6(b)(vi) says unused **Prepaid Credits** (not generated audio) expire after 12 months — that is a billing-credit rule, not an audio-retention rule, and should not be confused with the Output itself. **Net: permissive by omission, not by affirmative grant — mark the "cache forever" claim UNVERIFIED** pending an explicit ElevenLabs statement (contrast with Amazon Polly's FAQ, which affirmatively states caching/replay is free and unrestricted, per `03-voice-ai.md` §2.4).

---

## 5. Children's content clause

**What exists: an input-side clause about collecting children's voice/personal data, in both the ToS and the Privacy Policy.**

- **ToS §11 doesn't exist as such in the non-EEA ToS fetched** — but the same restriction is present in the **Privacy Policy §11 ("Children's Privacy")**: "Our Services are not intended for or directed at children under the age of 18 and ElevenLabs does not knowingly collect, store, or process Personal Data from children under the age of 18," and: "Additionally, all users are strictly prohibited from uploading, transmitting, emailing, or otherwise making Voice Data from children under the age of 18 available to us or other users or using them for any of our Services" ([elevenlabs.io/privacy-policy](https://elevenlabs.io/privacy-policy)) — this matches the sibling doc `03-voice-ai.md`'s finding 1 from the previous day.
- The **Prohibited Use Policy** separately addresses accessing the Services as a minor: "Making our Services available to anyone under the age of 13, or anyone between the ages 13-18 without parental or guardian consent" is prohibited, and there is a child-safety clause banning "sexually explicit material involving minors" and "age-inappropriate material, including material that targets minors" ([elevenlabs.io/use-policy](https://elevenlabs.io/use-policy)).

**What was NOT found: a clause specifically about producing/generating output CONTENT for or directed at a child *audience*** (as opposed to inputting a child's own voice, or a child using the Services themselves). A targeted fetch of the Privacy Policy for exactly this distinction returned: "Not found. The policy contains no clause addressing generation or production of content targeted to children" (fetched directly against [elevenlabs.io/privacy-policy](https://elevenlabs.io/privacy-policy)). The closest thing is the Prohibited Use Policy's "age-inappropriate material, including material that targets minors" line, which is about *inappropriate* content aimed at minors (a content-rating restriction), not a blanket restriction on generating child-*directed* content generally (e.g., an educational game aimed at 6-year-olds is not itself prohibited by this language). **Conclusion: only the input-side / account-access-side clauses were found; no distinct "you may not generate output content for a child audience" clause exists in the fetched ToS, Privacy Policy, or Prohibited Use Policy.**

**Cartoon/character voice and impersonation restrictions — found, and they do not block character work.** The Prohibited Use Policy's "Unauthorized impersonation" language targets "creating or using ElevenLabs audio output to intentionally replicate the voice of another person: (a) without consent or legal right," and separately bars use "in a manner intended to deceive others about whether the voice was generated by artificial intelligence" ([elevenlabs.io/use-policy](https://elevenlabs.io/use-policy)). This is about cloning a **real, identifiable person's** voice without consent — not about designing original cartoon/character voices, which is a core marketed use case (per `03-voice-ai.md`'s finding that ElevenLabs' voice library has a "Characters & Animation" category: "Playful and engaging voices for cartoons or video games"). The policy also explicitly carves out fiction for its violence-related restrictions: such restrictions "do not apply to activity in purely fictional contexts (e.g. violent speech by a character in a book, video game or movie)" ([elevenlabs.io/use-policy](https://elevenlabs.io/use-policy)). No clause was found specifically naming "voice cloning of copyrighted fictional characters" (e.g., cloning a copyrighted cartoon character's actual voice) — that would likely fall under ordinary copyright/trademark law and the general impersonation clause rather than a dedicated ElevenLabs clause, but this specific scenario is **UNVERIFIED** as its own named prohibition.

---

## Sources fetched this session

- [elevenlabs.io/pricing](https://elevenlabs.io/pricing) — tiers, credits, Commercial License bullet, Free/Starter feature lists
- [elevenlabs.io/terms-of-use](https://elevenlabs.io/terms-of-use) — §1(c) commercial/non-commercial; §4(a),(c),(d) Input/Output/License to Content; §5(a),(b) ElevenLabs IP / Services license; §6(b) Prepaid Credits
- [elevenlabs.io/use-policy](https://elevenlabs.io/use-policy) — Prohibited Use Policy: impersonation, child safety, fiction carve-out
- [elevenlabs.io/privacy-policy](https://elevenlabs.io/privacy-policy) — §11 Children's Privacy
- [elevenlabs.io/docs/product-guides/voices/voice-design](https://elevenlabs.io/docs/product-guides/voices/voice-design) — Voice Design mechanics, 3 variants, one-time charge, voice-slot save
- [elevenlabs.io/docs/api-reference/text-to-voice](https://elevenlabs.io/docs/api-reference/text-to-voice) — `/v1/text-to-voice/design` endpoint, `generated_voice_id`
- [elevenlabs.io/docs/api-reference/text-to-speech/convert](https://elevenlabs.io/docs/api-reference/text-to-speech/convert) — `output_format` options, Creator-tier gate on 192kbps MP3
- [elevenlabs.io/docs/models](https://elevenlabs.io/docs/models) — current model IDs and descriptions
- [elevenlabs.io/docs/best-practices/prompting/eleven-v3](https://elevenlabs.io/docs/best-practices/prompting/eleven-v3) — audio tags confirmation
- [elevenlabs.io/docs/product-guides/administration/billing](https://elevenlabs.io/docs/product-guides/administration/billing) — plain-language commercial-rights-by-plan statement

**Not reachable:** `help.elevenlabs.io` returned **HTTP 403 Forbidden** on every fetch attempt (root and `/hc/en-us`) — none of its help-center articles could be used as primary sources this session. `elevenlabs.io/prohibited-uses` and `elevenlabs.io/legal/prohibited-uses` both 404'd; the correct current URL is `elevenlabs.io/use-policy`. `elevenlabs.io/docs/api-reference/text-to-voice/create-previews` 404'd (superseded by the endpoint documented at `/docs/api-reference/text-to-voice`). WebSearch was used only to locate the correct URL paths, not as a source of any factual claim in this note; two attempted searches (for `help.elevenlabs.io` commercial-license articles and Voice Design credit-cost articles) failed because the session's WebSearch budget was already exhausted by other work earlier in this session — those specific sub-questions (exact `eleven_v3` credit multiplier; explicit Voice Design tier gating statement) remain **UNVERIFIED** as a result and are flagged individually above.

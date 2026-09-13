"use client";

import { useRouter } from "next/navigation";
import { useEffect, useReducer, useState } from "react";
import { hintFor } from "@/loop";
import type { Problem } from "@/loop";
import { Ollie, type OlliePose } from "@/ollie/Ollie";
import { cheerFor, revealLine } from "@/play/lines";
import { beginPlay, playReducer, problemShown, triedAnswer, type Phase } from "@/play/play";
import type { SpeechRequest } from "@/play/speech-cache";
import { storyInputFor } from "@/play/stories";
import { useSpeech } from "@/play/use-speech";
import { useStories } from "@/play/use-stories";
import { visualFor, type Stage } from "@/play/visuals";
import type { Identity } from "@/profile/identity";
import type { Profile } from "@/profile/profile";
import { profileStore } from "@/profile/store";
import { BigButton } from "@/ui/BigButton";
import { Equation } from "@/ui/Equation";
import { NumberLine } from "@/ui/NumberLine";
import { NumberPad } from "@/ui/NumberPad";
import { ProgressDots } from "@/ui/ProgressDots";
import { RepeatButton } from "@/ui/RepeatButton";
import { SpeechBubble } from "@/ui/SpeechBubble";
import { TenFrame } from "@/ui/TenFrame";
import { ThemeIcon } from "@/ui/ThemeIcon";
import { Celebration } from "./Celebration";

/** How long Ollie celebrates a correct answer before the next Problem. */
export const CORRECT_BEAT_MS = 1400;

type ProblemPhase = Exclude<Phase, { kind: "celebration" }>;

/** What each phase puts on screen: the line Ollie says, the visual's stage, Ollie's pose, and whether the pad takes taps. */
const VIEW: Readonly<
  Record<
    ProblemPhase["kind"],
    {
      readonly line: (problem: Problem, position: number) => string;
      readonly stage: Stage;
      /** Idle Ollie talks while the line is being spoken. */
      readonly pose: OlliePose | "idle";
      readonly answering: boolean;
    }
  >
> = {
  asking: { line: (problem) => problem.spoken, stage: "asking", pose: "idle", answering: true },
  hint: { line: hintFor, stage: "hint", pose: "encourage", answering: true },
  correct: { line: (problem, position) => cheerFor(position, problem.answer), stage: "reveal", pose: "celebrate", answering: false },
  reveal: { line: (problem) => revealLine(problem.answer), stage: "reveal", pose: "encourage", answering: false },
};

/**
 * One Session, tap by tap: the state lives in the Play reducer, every step
 * is written to the Profile so a reload resumes it, and the celebration
 * moves the Profile on. A Unit 3 Problem is asked with its Story in the
 * Profile's Theme, addressed by Nickname; until the Story is there it is
 * asked with the engine's template line, so nothing waits. Ollie says every
 * line through the fallback chain (src/play/use-speech) and the beak moves
 * for as long as the audio plays.
 */
export function SessionScreen({ profile, identity }: { readonly profile: Profile; readonly identity: Identity }) {
  const router = useRouter();
  const [state, dispatch] = useReducer(playReducer, profile, (p) => beginPlay(p, Date.now()));
  const [repeats, setRepeats] = useState(0);
  const { phase, session } = state;
  const stories = useStories(session.problems, identity);
  const problem = problemShown(state);
  const view = phase.kind === "celebration" ? undefined : VIEW[phase.kind];
  const position = session.entries.length + (view?.answering ? 1 : 0);
  const story = problem && phase.kind === "asking" ? stories.get(problem.id) : undefined;
  const line = story ? story.text : problem && view ? view.line(problem, position) : "";
  // A Story is the one line on this screen with the Nickname in it, so it is
  // the one the server renders; every other line is bundled with the app.
  const storyInput = story && problem ? storyInputFor(problem, identity.theme) : null;
  const request: SpeechRequest | undefined =
    story && storyInput ? { kind: "story", nickname: identity.nickname, text: story.text, ...storyInput } : undefined;
  // Repeat says the line again from what is already on the device; it never sets off a new render.
  const lineKey = `${problem?.id ?? "done"}:${phase.kind}:${repeats}:${story ? story.source : "spoken"}`;
  const { speaking, source: speechSource } = useSpeech({ text: line, request }, lineKey);

  useEffect(() => {
    if (phase.kind === "celebration") {
      const { profile: progress } = phase.result;
      profileStore.update((current) => ({ ...current, progress, session: null }));
    } else {
      profileStore.update((current) => ({ ...current, session }));
    }
  }, [phase, session]);

  useEffect(() => {
    if (phase.kind !== "correct") return;
    const timer = setTimeout(() => dispatch({ type: "next", at: Date.now() }), CORRECT_BEAT_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  if (phase.kind === "celebration") {
    return <Celebration result={phase.result} onDone={() => router.push("/")} />;
  }
  if (!problem || !view) return null;

  const { stage, answering } = view;
  const visual = visualFor(problem, stage);
  const pose = view.pose === "idle" && speaking ? "talking" : view.pose;

  return (
    <main
      className="learner-stage"
      data-phase={phase.kind}
      data-problem={problem.id}
      data-story-source={story?.source}
      data-speech-source={speechSource ?? undefined}
    >
      <h1 className="sr-only">Play</h1>
      <div className="pt-7">
        <ProgressDots total={session.problems.length} done={session.entries.length} />
      </div>
      <div className="mx-auto mt-4 grid max-w-content grid-cols-[minmax(0,1fr)_352px] gap-8 px-gutter">
        <section className="flex flex-col gap-6" aria-label="Problem">
          <div className="flex items-start gap-4">
            <SpeechBubble key={lineKey} className="max-w-110">
              {line}
            </SpeechBubble>
            <RepeatButton onClick={() => setRepeats((n) => n + 1)} />
          </div>
          <Equation equation={problem.equation} answerShown={!answering} />
          <div className="flex justify-center" key={`${problem.id}:${stage}`}>
            {visual.kind === "ten-frame" && <TenFrame model={visual} />}
            {visual.kind === "number-line" && <NumberLine model={visual} />}
            {visual.kind === "theme-picture" && (
              <div className="flex size-56 items-center justify-center rounded-card bg-paper-2 shadow-card" data-testid="theme-picture">
                <ThemeIcon theme={identity.theme} size={176} />
              </div>
            )}
          </div>
        </section>
        <aside className="flex flex-col items-center gap-6 pt-4">
          <NumberPad
            onTap={(answer) => dispatch({ type: "tap", answer, at: Date.now() })}
            disabled={!answering}
            tried={triedAnswer(state)}
          />
          {phase.kind === "reveal" && (
            <BigButton onClick={() => dispatch({ type: "next", at: Date.now() })} autoFocus>
              Next
            </BigButton>
          )}
        </aside>
      </div>
      <Ollie pose={pose} size={200} className="absolute bottom-6 left-gutter" />
    </main>
  );
}


"use client";

import { useRouter } from "next/navigation";
import { useEffect, useReducer, useState } from "react";
import { hintFor } from "@/loop";
import type { Problem } from "@/loop";
import { Ollie, type OlliePose } from "@/ollie/Ollie";
import { cheerFor, revealLine, speakingMs } from "@/play/lines";
import { beginPlay, playReducer, problemShown, triedAnswer, type Phase } from "@/play/play";
import { visualFor, type Stage } from "@/play/visuals";
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
import { useTimedFlag } from "@/ui/use-timed-flag";
import { Celebration } from "./Celebration";

/** How long Ollie celebrates a correct answer before the next Problem. */
export const CORRECT_BEAT_MS = 1400;

function lineFor(phase: Phase, problem: Problem, position: number): string {
  switch (phase.kind) {
    case "asking":
      return problem.spoken;
    case "hint":
      return hintFor(problem);
    case "correct":
      return cheerFor(position, problem.answer);
    case "reveal":
      return revealLine(problem.answer);
    case "celebration":
      return "";
  }
}

const STAGE: Readonly<Record<Exclude<Phase["kind"], "celebration">, Stage>> = {
  asking: "asking",
  hint: "hint",
  correct: "reveal",
  reveal: "reveal",
};

function poseFor(phase: Phase, speaking: boolean): OlliePose {
  if (phase.kind === "correct") return "celebrate";
  if (phase.kind === "hint" || phase.kind === "reveal") return "encourage";
  return speaking ? "talking" : "idle";
}

/**
 * One Session, tap by tap: the state lives in the Play reducer, every step
 * is written to the Profile so a reload resumes it, and the celebration
 * moves the Profile on.
 */
export function SessionScreen({ profile }: { readonly profile: Profile }) {
  const router = useRouter();
  const [state, dispatch] = useReducer(playReducer, profile, (p) => beginPlay(p, Date.now()));
  const [repeats, setRepeats] = useState(0);
  const { phase, session } = state;
  const problem = problemShown(state);
  const position = session.entries.length + (phase.kind === "asking" || phase.kind === "hint" ? 1 : 0);
  const line = problem ? lineFor(phase, problem, position) : "";
  const speaking = useTimedSpeech(`${problem?.id ?? "done"}:${phase.kind}:${repeats}`, line);

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
  if (!problem) return null;

  const stage = STAGE[phase.kind];
  const visual = visualFor(problem, stage);
  const answering = phase.kind === "asking" || phase.kind === "hint";

  return (
    <main className="learner-stage" data-phase={phase.kind} data-problem={problem.id}>
      <h1 className="sr-only">Play</h1>
      <div className="pt-7">
        <ProgressDots total={session.problems.length} done={session.entries.length} />
      </div>
      <div className="mx-auto mt-4 grid max-w-content grid-cols-[minmax(0,1fr)_352px] gap-8 px-gutter">
        <section className="flex flex-col gap-6" aria-label="Problem">
          <div className="flex items-start gap-4">
            <SpeechBubble key={`${problem.id}:${phase.kind}:${repeats}`} className="max-w-110">
              {line}
            </SpeechBubble>
            <RepeatButton onClick={() => setRepeats((n) => n + 1)} />
          </div>
          <Equation equation={problem.equation} answerShown={!answering} />
          <div className="flex justify-center" key={`${problem.id}:${stage}`}>
            {visual.kind === "ten-frame" ? <TenFrame model={visual} /> : <NumberLine model={visual} />}
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
      <Ollie pose={poseFor(phase, speaking)} size={200} className="absolute bottom-6 left-gutter" />
    </main>
  );
}


/** Ollie talks for as long as the line takes to read, until ticket 11 plays audio. */
function useTimedSpeech(key: string, line: string): boolean {
  return useTimedFlag(key, speakingMs(line));
}

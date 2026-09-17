"use client";

import { useRouter } from "next/navigation";
import { useEffect, useReducer, useState } from "react";
import { awaitCoach } from "@/coach";
import { hintFor, powerUsedOn } from "@/loop";
import type { PowerId, Problem } from "@/loop";
import { Ollie, type OlliePose } from "@/ollie/Ollie";
import { poseFor } from "@/ollie/powers";
import { cheerFor, revealLine } from "@/play/lines";
import { beginPlay, playReducer, problemShown, triedAnswer, type Phase } from "@/play/play";
import { storySpeechRequest } from "@/play/speech-pool";
import { useSessionCoach } from "@/play/use-coach";
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
import { PowerMark } from "@/ui/PowerMark";
import { ProgressDots } from "@/ui/ProgressDots";
import { RepeatButton } from "@/ui/RepeatButton";
import { SpeechBubble } from "@/ui/SpeechBubble";
import { TenFrame } from "@/ui/TenFrame";
import { ThemeIcon } from "@/ui/ThemeIcon";
import { Celebration } from "./Celebration";

/** How long Ollie celebrates a correct answer before the next Problem. */
export const CORRECT_BEAT_MS = 1400;

type ProblemPhase = Exclude<Phase, { kind: "celebration" }>;

/**
 * Ollie's pose: the Power's on a Problem Ollie has one for, so the Learner
 * sees it used from the Problem it is asked on; the phase's own pose when
 * Ollie is reacting (encouraging after a miss, celebrating a right answer),
 * and talking while a line is being said. The beak moves on its own class,
 * so a Power pose still speaks.
 */
function olliePose(phasePose: OlliePose | "idle", power: PowerId | null, speaking: boolean): OlliePose {
  if (phasePose !== "idle") return phasePose;
  if (power) return poseFor(power);
  return speaking ? "talking" : "idle";
}

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
  const { phase, session, powers } = state;
  const stories = useStories(session.problems, identity, powers);
  // One Coach run and one Parent Summary per completed Session, in the background.
  useSessionCoach(profile);
  const problem = problemShown(state);
  const view = phase.kind === "celebration" ? undefined : VIEW[phase.kind];
  const position = session.entries.length + (view?.answering ? 1 : 0);
  // The Power Ollie uses on this Problem: the pose while it is asked, and
  // the way the ten-frame, the number line, or the Story is drawn.
  const power = problem ? powerUsedOn(powers, problem) : null;
  const story = problem && phase.kind === "asking" ? stories.get(problem.id) : undefined;
  const line = story ? story.text : problem && view ? view.line(problem, position) : "";
  // A Story is the one line on this screen with the Nickname in it, so it is
  // the one the server renders; every other line is bundled with the app.
  const request = story && problem ? storySpeechRequest(problem, identity, story.text) : undefined;
  // Repeat says the line again from what is already on the device; it never sets off a new render.
  const lineKey = `${problem?.id ?? "done"}:${phase.kind}:${repeats}:${story ? story.source : "spoken"}`;
  const { speaking, source: speechSource } = useSpeech({ text: line, request }, lineKey);

  useEffect(() => {
    if (phase.kind === "celebration") {
      const { profile: progress } = phase.result;
      // The Session's Coins and Streak land with its progress, and only once: a
      // Session that has already paid adds nothing when it is celebrated again.
      // The Powers are the reducer's, which added what this Session taught to
      // the ones already held and never takes one away, so celebrating the
      // same Session again changes nothing. The Session itself waits on the
      // record until a Coach run writes it, so the run outlives this screen
      // and a reload, and the Powers it earned wait with it, for the Parent
      // Summary to name.
      profileStore.update((current) => ({
        ...current,
        progress,
        rewards: phase.award.rewards,
        powers,
        session: null,
        coach: awaitCoach(current.coach, phase.result),
      }));
    } else {
      profileStore.update((current) => ({ ...current, session }));
    }
  }, [phase, session, powers]);

  useEffect(() => {
    if (phase.kind !== "correct") return;
    const timer = setTimeout(() => dispatch({ type: "next", at: Date.now() }), CORRECT_BEAT_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  if (phase.kind === "celebration") {
    return <Celebration result={phase.result} award={phase.award} onDone={() => router.push("/")} />;
  }
  if (!problem || !view) return null;

  const { stage, answering } = view;
  const visual = visualFor(problem, stage, powers);
  const pose = olliePose(view.pose, power, speaking);

  return (
    <main
      className="learner-stage session-stage"
      data-phase={phase.kind}
      data-problem={problem.id}
      data-story-source={story?.source}
      data-power={power ?? undefined}
      data-speech-source={speechSource ?? undefined}
    >
      <h1 className="sr-only">Play</h1>
      <div className="session-dots" data-stage-dots>
        <ProgressDots total={session.problems.length} done={session.entries.length} />
      </div>
      <div className="session-body" data-stage-body>
        <section className="session-problem" aria-label="Problem">
          <div className="session-bubble" data-stage-bubble>
            <SpeechBubble key={lineKey} className="session-speech">
              {line}
            </SpeechBubble>
            <RepeatButton onClick={() => setRepeats((n) => n + 1)} />
          </div>
          <div className="session-equation">
            <Equation equation={problem.equation} answerShown={!answering} />
          </div>
          <div className="session-visual" data-stage-visual key={`${problem.id}:${stage}`}>
            {visual.kind === "ten-frame" && <TenFrame model={visual} />}
            {visual.kind === "number-line" && <NumberLine model={visual} />}
            {visual.kind === "theme-picture" && (
              <div
                className="story-card relative flex items-center justify-center rounded-card bg-paper-2 shadow-card"
                data-testid="theme-picture"
                data-power={visual.power ?? undefined}
              >
                <ThemeIcon theme={identity.theme} size={176} />
                {/* Story Solver: the book opens on the picture, and the Story itself comes from the rich set. */}
                {visual.power === "story-solver" && (
                  <span className="story-page absolute right-3 bottom-3" data-testid="story-book">
                    <PowerMark power="story-solver" size={44} />
                  </span>
                )}
              </div>
            )}
          </div>
          {/* Ollie stands under his own bubble, so the bubble's tail points at him. */}
          <div className="session-ollie" data-stage-ollie>
            {/* No size: `--ollie-stage` in src/app/tokens.css scales him with the column he stands in. */}
            <Ollie pose={pose} speaking={speaking} />
          </div>
        </section>
        <aside className="session-pad" data-stage-pad>
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
    </main>
  );
}


"use client";

import { useState } from "react";
import { Ollie } from "@/ollie/Ollie";
import { AVATAR_COLORS, cleanNickname, NICKNAME_DISCLOSURE, THEMES, type AvatarColor, type Identity, type ThemeId } from "@/profile/identity";
import { profileStore } from "@/profile/store";
import { Avatar } from "@/ui/Avatar";
import { BigButton } from "@/ui/BigButton";
import { LockIcon } from "@/ui/LockIcon";
import { ThemeIcon } from "@/ui/ThemeIcon";

const STEPS = ["nickname", "avatar", "theme", "note"] as const;
type Step = (typeof STEPS)[number];

const HEADINGS: Readonly<Record<Step, string>> = {
  nickname: "What should Ollie call you?",
  avatar: "Pick an Avatar colour",
  theme: "Pick a Theme",
  note: "One thing to know",
};

const CAPTIONS: Readonly<Record<Step, string>> = {
  nickname: "A nickname is best. Ollie says it out loud.",
  avatar: "Hats, accessories and pets come later, from the Shop.",
  theme: "Every Story is set here. Change it any time in the Shop.",
  note: "Then hand over the tablet.",
};

/** A choice made by tapping: the picked one carries the teal ring from the canvas. */
const picked = (on: boolean) => (on ? "shadow-[0_0_0_4px_var(--paper),0_0_0_8px_var(--teal)]" : "");

/**
 * The Parent sets up the Profile in four screens: the Nickname, the Avatar
 * colour, the Theme, and the note on what leaves the device. The Home
 * screen renders this until the Profile has an identity.
 */
export function Onboarding() {
  const [step, setStep] = useState<Step>("nickname");
  const [nickname, setNickname] = useState("");
  const [avatarColor, setAvatarColor] = useState<AvatarColor>("cream");
  const [theme, setTheme] = useState<ThemeId>("puppies");
  const index = STEPS.indexOf(step);
  const cleaned = cleanNickname(nickname);

  const forward = () => {
    if (step === "note") {
      const identity: Identity = { nickname: cleaned, avatarColor, theme };
      profileStore.update((profile) => ({ ...profile, identity }));
    } else {
      setStep(STEPS[index + 1]);
    }
  };

  return (
    <main className="learner-stage flex flex-col gap-6 px-gutter pt-8 pb-10" data-testid="onboarding" data-step={step}>
      <header className="mx-auto flex w-full max-w-content items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-display-l font-semibold text-ink">Set up in a minute</h1>
          <p className="font-text text-body text-ink-soft">For the grown-up. Three choices, then hand over the tablet.</p>
        </div>
        <Ollie pose="idle" size={96} />
      </header>

      <form
        className="mx-auto my-auto flex w-full max-w-160 flex-col gap-4 rounded-card bg-paper-2 p-6 shadow-card"
        onSubmit={(event) => {
          event.preventDefault();
          if (step !== "nickname" || cleaned) forward();
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-pill bg-sun font-display text-body font-semibold text-ink">
            {index + 1}
          </div>
          <h2 className="font-display text-display-s font-semibold text-ink">{HEADINGS[step]}</h2>
        </div>

        {step === "nickname" && (
          <input
            type="text"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            maxLength={40}
            autoFocus
            autoComplete="off"
            enterKeyHint="next"
            aria-label="Nickname"
            className="h-16 rounded-chip border-[3px] border-sky bg-paper px-5 font-display text-display-m font-semibold text-ink outline-none focus:border-sky-deep"
          />
        )}

        {step === "avatar" && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-4" role="group" aria-label="Avatar colour">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setAvatarColor(color.id)}
                  aria-label={color.name}
                  aria-pressed={avatarColor === color.id}
                  className={`size-touch-learner rounded-pill ${picked(avatarColor === color.id)}`}
                >
                  <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
                    <circle cx="32" cy="32" r="32" className={color.fill} />
                  </svg>
                </button>
              ))}
            </div>
            <div className="flex justify-center">
              <Avatar color={avatarColor} size={88} label="Avatar preview" />
            </div>
          </div>
        )}

        {step === "theme" && (
          <div className="grid grid-cols-3 gap-3" role="group" aria-label="Theme">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                aria-pressed={theme === t.id}
                className={`flex flex-col items-center gap-2 rounded-chip bg-paper px-1 pt-3 pb-2 font-display text-caption font-medium text-ink ${picked(theme === t.id)}`}
              >
                <ThemeIcon theme={t.id} />
                {t.name}
              </button>
            ))}
          </div>
        )}

        {step === "note" && (
          <div className="flex items-start gap-3">
            <LockIcon size={28} className="mt-1 shrink-0" />
            <p className="font-text text-body-l text-ink text-pretty" data-testid="disclosure">
              {NICKNAME_DISCLOSURE}
            </p>
          </div>
        )}

        <p className="font-text text-caption text-ink-soft">{CAPTIONS[step]}</p>

        <div className="mt-2 flex items-center justify-between gap-6">
          <span className="font-text text-caption text-ink-soft">
            {index + 1} of {STEPS.length}
          </span>
          <div className="flex items-center gap-4">
            {index > 0 && (
              <BigButton type="button" tone="paper" onClick={() => setStep(STEPS[index - 1])}>
                Back
              </BigButton>
            )}
            {step === "note" ? (
              <BigButton type="submit" size="xl">
                Start playing
              </BigButton>
            ) : (
              <BigButton type="submit" disabled={step === "nickname" && !cleaned}>
                Next
              </BigButton>
            )}
          </div>
        </div>
      </form>
    </main>
  );
}

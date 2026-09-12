/**
 * What the Parent chooses at onboarding: the Nickname Ollie says, the
 * Avatar's colour, and the Theme every Story is set in. The Nickname is the
 * only one of these that ever leaves the device, and only to generate
 * Stories and audio (ADR 0002).
 */

export type AvatarColor = "cream" | "sky" | "leaf" | "berry";

export type ThemeId = "puppies" | "dinosaurs" | "space" | "ocean" | "fairies" | "trucks";

export type Identity = {
  readonly nickname: string;
  readonly avatarColor: AvatarColor;
  readonly theme: ThemeId;
};

/** The four colour bases, each with the deep tone its paper shadow uses. */
export const AVATAR_COLORS: readonly { readonly id: AvatarColor; readonly name: string }[] = [
  { id: "cream", name: "Cream" },
  { id: "sky", name: "Sky" },
  { id: "leaf", name: "Leaf" },
  { id: "berry", name: "Berry" },
];

/** The six Themes, in the order onboarding shows them. Vocabulary joins with ticket 10. */
export const THEMES: readonly { readonly id: ThemeId; readonly name: string }[] = [
  { id: "puppies", name: "Puppies" },
  { id: "dinosaurs", name: "Dinosaurs" },
  { id: "space", name: "Space" },
  { id: "ocean", name: "Ocean" },
  { id: "fairies", name: "Fairies" },
  { id: "trucks", name: "Trucks" },
];

/** Ollie says the Nickname aloud and a Story has under 25 words, so it stays short. */
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

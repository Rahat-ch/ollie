/**
 * Stories are written and pooled with a placeholder where the Nickname
 * goes, so one Story serves every Profile and the Nickname itself is not
 * needed to write one; it is filled in on the device.
 */
export const NICKNAME_PLACEHOLDER = "{{nickname}}";

/** The Story with the Nickname in place of every placeholder. */
export const withNickname = (text: string, nickname: string): string =>
  text.split(NICKNAME_PLACEHOLDER).join(nickname);

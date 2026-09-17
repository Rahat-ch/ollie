/**
 * What every browser page does before it loads, so that a test run is silent.
 * It runs in the page, so it is a single self-contained function with nothing
 * closed over: Playwright sends it as source.
 *
 * Two things make noise. The platform's own speech synthesis reads the line
 * out loud — Chromium on a Mac speaks through the system voice, so thirty
 * tests reading Problems fill the room — and `speak` is stubbed to fail at
 * once, which hands the Speech Chain to the on-screen step, the path a device
 * with no voices takes. And Ollie's bundled mp3s play through an audio
 * element: `--mute-audio` is a Chromium launch flag and the nine WebKit iPad
 * projects played them aloud, so every media element is muted the moment it
 * is asked to play. Playback itself is real — `play` is called through and
 * its events fire — so the Speech Chain still reports the bundled step and
 * e2e/voice.spec.ts can still see it.
 */
export function quiet() {
  const synth = window.speechSynthesis;
  if (synth) {
    synth.speak = (utterance) => {
      setTimeout(() => utterance.dispatchEvent(new Event("error")), 0);
    };
  }
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function mutedPlay() {
    this.muted = true;
    this.volume = 0;
    return play.call(this);
  };
}

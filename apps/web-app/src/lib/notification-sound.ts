import notificationSoundUrl from "@/assets/notification.wav";

let audioEl: HTMLAudioElement | null = null;

function getAudioEl(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio(notificationSoundUrl);
    audioEl.preload = "auto";
  }
  return audioEl;
}

/**
 * Unlock playback inside a user gesture so later programmatic plays are not
 * blocked by browser autoplay policies. Plays the element muted, then
 * rewinds it so the chime stays silent until a real notification arrives.
 */
export function primeNotificationSound(): void {
  const el = getAudioEl();
  el.muted = true;
  void el
    .play()
    .then(() => {
      el.pause();
      el.currentTime = 0;
    })
    .catch(() => {})
    .finally(() => {
      el.muted = false;
    });
}

/** Play the notification chime. Never throws; ignores autoplay rejections. */
export function playNotificationSound(): void {
  const el = getAudioEl();
  el.currentTime = 0;
  void el.play().catch(() => {});
}

function attachUnlockListeners(): void {
  const prime = () => {
    primeNotificationSound();
    window.removeEventListener("pointerdown", prime);
    window.removeEventListener("keydown", prime);
  };
  window.addEventListener("pointerdown", prime);
  window.addEventListener("keydown", prime);
}

if (typeof window !== "undefined") {
  attachUnlockListeners();
}

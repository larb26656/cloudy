let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

/** Prime the AudioContext inside a user gesture so later beeps are not blocked. */
export function initAudioContext(): void {
  getCtx();
}

export function playBeep(times: number, freq: number): void {
  const c = getCtx();
  for (let i = 0; i < times; i++) {
    const start = c.currentTime + i * 0.4;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.2, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
    osc.connect(gain).connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.3);
  }
}

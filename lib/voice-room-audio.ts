/** Lightweight processing tone loop for voice room "thinking" state. */
export class VoiceRoomProcessingTone {
  private audioContext: AudioContext | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private active = false;

  start(): void {
    if (this.active || typeof window === "undefined") return;
    this.active = true;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    this.audioContext = new AudioCtx();
    void this.audioContext.resume();

    const playPulse = () => {
      const ctx = this.audioContext;
      if (!ctx || !this.active) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 392;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.028, ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    };

    playPulse();
    this.intervalId = setInterval(playPulse, 900);
  }

  stop(): void {
    this.active = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export function playVoiceRoomCue(kind: "start" | "end"): void {
  if (typeof window === "undefined") return;
  const AudioCtx = window.AudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  void ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = kind === "start" ? 523.25 : 440;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.14);
  osc.onended = () => void ctx.close();
}

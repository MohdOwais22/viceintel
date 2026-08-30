/**
 * Notification Sound & Audio Chime Utility
 * Handles Web Audio API synth sounds for notifications with mute/unmute persistence.
 */

const SOUND_MUTED_KEY = 'gtavi_notifications_sound_muted';

export function isNotificationSoundMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SOUND_MUTED_KEY) === 'true';
}

export function setNotificationSoundMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_MUTED_KEY, muted ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('gtavi_sound_toggle', { detail: { muted } }));
}

export function toggleNotificationSound(): boolean {
  const newMuted = !isNotificationSoundMuted();
  setNotificationSoundMuted(newMuted);
  return newMuted;
}

// Lazy singleton AudioContext to prevent browser memory leaks and AudioContext limit exhaustion
let sharedAudioCtx: AudioContext | null = null;

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      sharedAudioCtx = new AudioCtxClass();
    }
  }
  return sharedAudioCtx;
}

/**
 * Plays a clean 2-tone Vice City futuristic synth notification chime.
 * Uses Web Audio API with minimal resource footprint.
 */
export function playNotificationChime(force: boolean = false): void {
  if (!force && isNotificationSoundMuted()) return;

  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Tone 1: E5 (659Hz) - Bright attack
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.18);

    // Tone 2: B5 (987.77Hz) - High chime finish
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.08);
    gain2.gain.setValueAtTime(0.16, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.35);
  } catch {
    // Gracefully handle browser audio restrictions
  }
}


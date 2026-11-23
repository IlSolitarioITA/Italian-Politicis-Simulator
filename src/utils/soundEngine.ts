/**
 * Motore Audio Sintetizzato Leggero (100% Web Audio API nativa, zero file MP3 esterni).
 * Genera 4 brevi suoni discreti e puliti stile Diretta TV politica.
 * Lo stato muto è salvato separatamente senza mai toccare `palazzo_chigi_saves_v1`.
 */

const AUDIO_MUTED_STORAGE_KEY = 'palazzo_chigi_audio_muted_v1';

type AudioContextConstructor = typeof AudioContext;

let sharedCtx: AudioContext | null = null;
let cachedMuted: boolean | null = null;

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === 'undefined') return null;
  const win = window as Window & { webkitAudioContext?: AudioContextConstructor };
  return window.AudioContext ?? win.webkitAudioContext ?? null;
}

function getContext(): AudioContext | null {
  if (isAudioMuted()) return null;
  const Ctor = getAudioContextConstructor();
  if (!Ctor) return null;

  try {
    if (!sharedCtx) {
      sharedCtx = new Ctor();
    }
    if (sharedCtx.state === 'suspended') {
      void sharedCtx.resume().catch(() => undefined);
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

export function isAudioMuted(): boolean {
  if (cachedMuted !== null) return cachedMuted;
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(AUDIO_MUTED_STORAGE_KEY);
    cachedMuted = raw === '1';
  } catch {
    cachedMuted = false;
  }
  return cachedMuted;
}

export function setAudioMuted(muted: boolean): void {
  cachedMuted = muted;
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AUDIO_MUTED_STORAGE_KEY, muted ? '1' : '0');
  } catch {
    // Ignora errori storage in navigazione privata ristretta
  }
}

export function toggleAudioMuted(): boolean {
  const nextMuted = !isAudioMuted();
  setAudioMuted(nextMuted);
  if (!nextMuted) {
    playTactileClick();
  }
  return nextMuted;
}

/** 1. Click tattile breve e pulito per pulsanti e tab */
export function playTactileClick(): void {
  const ctx = getContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.032);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.045, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.038);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.042);
  } catch {
    // Ignora errori audio browser
  }
}

/** 2. Jingle Breaking News (crisi di governo, scissione o edizione straordinaria) */
export function playBreakingNewsJingle(): void {
  const ctx = getContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // 4 impulsi stile telegiornale in diretta (Re5, Fa#5, La5, Re6)
    const notes = [587.33, 739.99, 880.0, 1174.66];
    const step = 0.095;

    notes.forEach((freq, idx) => {
      const start = now + idx * step;
      const duration = idx === notes.length - 1 ? 0.24 : 0.085;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = idx === notes.length - 1 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.055, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration + 0.02);
    });
  } catch {
    // Ignora errori audio browser
  }
}

/** 3. Applauso / Esito Duello TV (rumore filtrato stile studio + accordo di chiusura) */
export function playTvDuelOutcome(positive: boolean): void {
  const ctx = getContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (positive) {
      // Breve applauso sintetizzato con rumore filtrato a inviluppo morbido
      const bufferLen = Math.floor(ctx.sampleRate * 0.65);
      const buffer = ctx.createBuffer(1, bufferLen, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferLen; i++) {
        // Modulazione ritmica leggera per ricordare battiti di mani in studio TV
        const envPulse = 0.65 + 0.35 * Math.sin((i / ctx.sampleRate) * 48);
        data[i] = (Math.random() * 2 - 1) * envPulse;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1400, now);
      bandpass.Q.setValueAtTime(1.1, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.linearRampToValueAtTime(0.05, now + 0.08);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);

      noise.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.65);

      // Stacchetto positivo a due accordi
      const chordNotes = [
        { freq: 523.25, t: 0, dur: 0.16 },
        { freq: 659.25, t: 0.11, dur: 0.28 },
        { freq: 783.99, t: 0.11, dur: 0.28 },
      ];
      chordNotes.forEach(({ freq, t, dur }) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + t);
        g.gain.setValueAtTime(0.0001, now + t);
        g.gain.linearRampToValueAtTime(0.045, now + t + 0.018);
        g.gain.exponentialRampToValueAtTime(0.0001, now + t + dur);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + dur + 0.02);
      });
    } else {
      // Stacco teso da studio TV per round/duello perso
      const dropNotes = [
        { freq: 392.0, t: 0, dur: 0.14 },
        { freq: 311.13, t: 0.13, dur: 0.28 },
      ];
      dropNotes.forEach(({ freq, t, dur }) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + t);
        g.gain.setValueAtTime(0.0001, now + t);
        g.gain.linearRampToValueAtTime(0.05, now + t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, now + t + dur);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + dur + 0.02);
      });
    }
  } catch {
    // Ignora errori audio browser
  }
}

/** 4. Sigla Notte Elettorale (breve tema solenne stile speciale televisivo) */
export function playElectionNightTheme(): void {
  const ctx = getContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const sequence = [
      { freq: 261.63, t: 0.0, dur: 0.18 }, // Do4
      { freq: 392.0, t: 0.17, dur: 0.18 }, // Sol4
      { freq: 440.0, t: 0.34, dur: 0.16 }, // La4
      { freq: 392.0, t: 0.5, dur: 0.16 }, // Sol4
      { freq: 523.25, t: 0.66, dur: 0.45 }, // Do5 finale
    ];

    sequence.forEach(({ freq, t, dur }) => {
      const osc = ctx.createOscillator();
      const harmonic = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + t);

      harmonic.type = 'triangle';
      harmonic.frequency.setValueAtTime(freq * 0.5, now + t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now + t);

      gain.gain.setValueAtTime(0.0001, now + t);
      gain.gain.linearRampToValueAtTime(0.048, now + t + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + dur);

      osc.connect(filter);
      harmonic.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + t);
      harmonic.start(now + t);
      osc.stop(now + t + dur + 0.03);
      harmonic.stop(now + t + dur + 0.03);
    });
  } catch {
    // Ignora errori audio browser
  }
}

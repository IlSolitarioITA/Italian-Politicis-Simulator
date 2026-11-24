/**
 * Utilità di sanitizzazione e validazione rigorosa per input utente e import/export JSON.
 * Previene XSS, prototype pollution (__proto__, constructor, prototype), URL malevoli e crash da dati corrotti.
 */

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_JSON_BYTES = 2_500_000; // 2.5 MB max per file salvataggio
const MAX_JSON_DEPTH = 18;
const MAX_EMBLEM_DATA_URL_LENGTH = 1_800_000;

const SAFE_HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const SAFE_RASTER_DATA_URL_RE = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/;

/**
 * Sanitizza testo libero (nome partito, leader, coalizione, titoli leggi/referendum):
 * rimuove tag HTML, caratteri di controllo, schemi pericolosi e limita la lunghezza.
 */
export function sanitizePlainText(
  input: unknown,
  maxLength = 80,
  fallback = ''
): string {
  if (typeof input !== 'string') return fallback;

  let cleaned = input
    // Rimuove caratteri di controllo ASCII/Unicode non stampabili
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
    // Rimuove eventuali tag HTML / script
    .replace(/<[^>]*>/g, '')
    // Rimuove residui di delimitatori angolari per sicurezza extra
    .replace(/[<>]/g, '')
    // Rimuove schemi potenzialmente eseguibili se incollati nel testo
    .replace(/(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/gi, '')
    // Normalizza spazi multipli
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength).trim();
  }

  return cleaned.length > 0 ? cleaned : fallback;
}

/**
 * Sanitizza la sigla del partito (es. "NR", "+Eu", "M5S"), massimo 5 caratteri sicuri.
 */
export function sanitizeAcronym(input: unknown, fallback = 'PT'): string {
  if (typeof input !== 'string') return fallback;
  const cleaned = input
    .replace(/[^a-zA-Z0-9+À-ÖØ-öø-ÿ]/g, '')
    .toUpperCase()
    .slice(0, 5);
  return cleaned.length > 0 ? cleaned : fallback;
}

/**
 * Valida un colore esadecimale rigoroso (#RRGGBB) prevenendo CSS injection.
 */
export function sanitizeHexColor(input: unknown, fallback = '#06B6D4'): string {
  if (typeof input !== 'string') return fallback;
  const trimmed = input.trim();
  return SAFE_HEX_COLOR_RE.test(trimmed) ? trimmed : fallback;
}

/**
 * Accetta esclusivamente immagini raster base64 (PNG/JPEG/WEBP/GIF).
 * Blocca SVG (che può contenere <script>), javascript: e URL esterni non verificati.
 */
export function sanitizeCustomEmblemUrl(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_EMBLEM_DATA_URL_LENGTH) {
    return undefined;
  }
  return SAFE_RASTER_DATA_URL_RE.test(trimmed) ? trimmed : undefined;
}

/**
 * Rimozione ricorsiva di chiavi prototype pollution (__proto__, constructor, prototype)
 * con limite di profondità contro payload JSON annidati malevoli.
 */
function stripDangerousKeysRecursive(value: unknown, depth: number): unknown {
  if (depth > MAX_JSON_DEPTH) {
    throw new Error('Struttura JSON troppo annidata o corrotta.');
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => stripDangerousKeysRecursive(item, depth + 1));
  }

  const cleanObj: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>)) {
    if (DANGEROUS_KEYS.has(key)) continue;
    cleanObj[key] = stripDangerousKeysRecursive(
      (value as Record<string, unknown>)[key],
      depth + 1
    );
  }
  return cleanObj;
}

/**
 * Parsing JSON sicuro con controllo dimensione, blocco prototype pollution e profondità massima.
 */
export function safeJsonParse<T = unknown>(
  raw: string,
  maxBytes = MAX_JSON_BYTES
): { ok: true; value: T } | { ok: false; error: string } {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return { ok: false, error: 'Contenuto JSON vuoto o non valido.' };
  }

  if (raw.length > maxBytes) {
    return {
      ok: false,
      error: 'Il file di salvataggio supera la dimensione massima consentita (2,5 MB).',
    };
  }

  try {
    const parsed = JSON.parse(raw, (key, val) => {
      if (DANGEROUS_KEYS.has(key)) return undefined;
      return val;
    });
    const sanitized = stripDangerousKeysRecursive(parsed, 0) as T;
    return { ok: true, value: sanitized };
  } catch {
    return {
      ok: false,
      error: 'Impossibile leggere il file JSON: formato corrotto o non sicuro.',
    };
  }
}

/**
 * Genera un UUID v4 crittograficamente sicuro per isolare la sessione locale del dispositivo.
 */
export function generateSessionUuid(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
  } catch {
    // Fallback deterministico-casuale se crypto non disponibile
  }
  return `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

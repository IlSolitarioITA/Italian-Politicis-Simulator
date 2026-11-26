/**
 * Utilità di sanitizzazione e validazione rigorosa per input utente e import/export JSON.
 * Previene XSS, prototype pollution (__proto__, constructor, prototype), URL malevoli,
 * payload annidati eccessivi e crash da dati corrotti o valori numerici non finiti.
 */

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** Limite massimo rigido per i file di salvataggio JSON: 2 MB (2.097.152 byte) */
export const MAX_SAVE_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_JSON_DEPTH = 12;
export const MAX_JSON_ARRAY_LENGTH = 5_000;
export const MAX_JSON_NODES = 60_000;
const MAX_EMBLEM_DATA_URL_LENGTH = 1_500_000;

const SAFE_HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const SAFE_RASTER_DATA_URL_RE = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/;
const ALLOWED_JSON_MIME_TYPES = new Set(['', 'application/json', 'text/json', 'text/plain']);

/**
 * Rileva qualsiasi stringa che inizi con uno schema URL potenzialmente eseguibile
 * (javascript:, vbscript:, data:text/html, data:image/svg+xml), anche con spazi o caratteri di controllo iniziali.
 */
export function hasDangerousUrlScheme(input: unknown): boolean {
  if (typeof input !== 'string') return false;
  const normalized = input
    .replace(/[\u0000-\u0020\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '')
    .toLowerCase();
  return (
    normalized.startsWith('javascript:') ||
    normalized.startsWith('vbscript:') ||
    normalized.startsWith('data:text/html') ||
    normalized.startsWith('data:image/svg')
  );
}

/**
 * Valida un file selezionato dall'utente PRIMA di leggerlo con FileReader:
 * rifiuta qualsiasi file non .json, con MIME non coerente, vuoto o superiore a 2 MB.
 */
export function validateJsonFileBeforeRead(
  file: File
): { ok: true } | { ok: false; error: string } {
  if (!file || typeof file.name !== 'string') {
    return { ok: false, error: 'Nessun file selezionato.' };
  }

  const trimmedName = file.name.trim();
  if (!/\.json$/i.test(trimmedName)) {
    return {
      ok: false,
      error: 'Formato file non valido: sono accettati esclusivamente file .json.',
    };
  }

  const normalizedMime = (file.type || '').trim().toLowerCase();
  if (!ALLOWED_JSON_MIME_TYPES.has(normalizedMime)) {
    return {
      ok: false,
      error: 'Tipo di file non consentito: seleziona un file di salvataggio .json valido.',
    };
  }

  if (file.size <= 0) {
    return {
      ok: false,
      error: 'Il file selezionato è vuoto e non può essere importato.',
    };
  }

  if (file.size > MAX_SAVE_FILE_BYTES) {
    return {
      ok: false,
      error: 'File troppo grande: la dimensione massima consentita è 2 MB.',
    };
  }

  return { ok: true };
}

/**
 * Calcola la lunghezza reale in byte UTF-8 di una stringa.
 */
function getUtf8ByteLength(text: string): number {
  try {
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(text).length;
    }
  } catch {
    // Fallback approssimato se TextEncoder non disponibile
  }
  return text.length * 2;
}

/**
 * Sanitizza testo libero (nome partito, leader, coalizione, titoli leggi/referendum):
 * rimuove caratteri di controllo/invisibili, tag HTML, schemi URL pericolosi e limita la lunghezza.
 */
export function sanitizePlainText(
  input: unknown,
  maxLength = 80,
  fallback = ''
): string {
  if (typeof input !== 'string') return fallback;

  let cleaned = input
    // Rimuove caratteri di controllo ASCII/Unicode e caratteri invisibili/BiDi
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, ' ')
    // Rimuove eventuali tag HTML / script
    .replace(/<[^>]*>/g, '')
    // Rimuove residui di delimitatori angolari per sicurezza extra
    .replace(/[<>]/g, '')
    // Rimuove schemi potenzialmente eseguibili se incollati nel testo
    .replace(/(?:javascript|vbscript)\s*:/gi, '')
    .replace(/data\s*:\s*(?:text\/html|image\/svg\+xml)/gi, '')
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
 * Blocca esplicitamente javascript:, vbscript:, data:text/html, SVG e URL esterni.
 */
export function sanitizeCustomEmblemUrl(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;
  const trimmed = input.trim();
  if (
    trimmed.length === 0 ||
    trimmed.length > MAX_EMBLEM_DATA_URL_LENGTH ||
    hasDangerousUrlScheme(trimmed)
  ) {
    return undefined;
  }
  return SAFE_RASTER_DATA_URL_RE.test(trimmed) ? trimmed : undefined;
}

/**
 * Rimozione ricorsiva di chiavi prototype pollution (__proto__, constructor, prototype),
 * verifica assenza di numeri non finiti e limiti di profondità/cardinalità contro payload malevoli.
 */
function stripDangerousKeysRecursive(
  value: unknown,
  depth: number,
  counter: { nodes: number }
): unknown {
  if (depth > MAX_JSON_DEPTH) {
    throw new Error('Struttura JSON troppo annidata o corrotta.');
  }

  counter.nodes += 1;
  if (counter.nodes > MAX_JSON_NODES) {
    throw new Error('Struttura JSON eccessivamente complessa.');
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Valore numerico non valido (NaN o Infinity) rilevato nel file.');
    }
    return value;
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length > MAX_JSON_ARRAY_LENGTH) {
      throw new Error('Array JSON oltre il limite massimo consentito.');
    }
    return value.map((item) => stripDangerousKeysRecursive(item, depth + 1, counter));
  }

  const source = value as Record<string, unknown>;
  const cleanObj: Record<string, unknown> = {};
  for (const key of Object.keys(source)) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
    if (DANGEROUS_KEYS.has(key)) continue;
    const sanitizedVal = stripDangerousKeysRecursive(source[key], depth + 1, counter);
    Object.defineProperty(cleanObj, key, {
      value: sanitizedVal,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }
  return cleanObj;
}

/**
 * Parsing JSON sicuro con controllo dimensione reale in byte (max 2 MB),
 * reviver anti-prototype pollution, profondità massima e blocco NaN/Infinity.
 */
export function safeJsonParse<T = unknown>(
  raw: string,
  maxBytes = MAX_SAVE_FILE_BYTES
): { ok: true; value: T } | { ok: false; error: string } {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return { ok: false, error: 'Contenuto JSON vuoto o non valido.' };
  }

  if (getUtf8ByteLength(raw) > maxBytes) {
    return {
      ok: false,
      error: 'Il file di salvataggio supera la dimensione massima consentita (2 MB).',
    };
  }

  try {
    const parsed = JSON.parse(raw, (key, val) => {
      if (DANGEROUS_KEYS.has(key)) return undefined;
      if (typeof val === 'number' && !Number.isFinite(val)) {
        throw new Error('Valore numerico non finito');
      }
      return val;
    });
    const sanitized = stripDangerousKeysRecursive(parsed, 0, { nodes: 0 }) as T;
    return { ok: true, value: sanitized };
  } catch {
    return {
      ok: false,
      error: 'Impossibile leggere il file JSON: formato corrotto, troppo annidato o non sicuro.',
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

import React from 'react';
import { sanitizeHexColor } from '../utils/sanitizer';

interface LeaderAvatarProps {
  name: string;
  color: string;
  size?: number;
  partyAcronym?: string;
}

const HONORIFICS = new Set([
  'on.',
  'on',
  'sen.',
  'sen',
  'dott.',
  'dott.ssa',
  'dr.',
  'prof.',
  'prof.ssa',
  'avv.',
  'ing.',
  'gen.',
]);

function extractInitials(rawName: string): string {
  const tokens = rawName
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0 && !HONORIFICS.has(t.toLowerCase()));
  if (tokens.length === 0) return 'LD';
  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase();
  }
  const first = tokens[0][0] ?? '';
  const last = tokens[tokens.length - 1][0] ?? '';
  return `${first}${last}`.toUpperCase();
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Ritratto/monogramma istituzionale vettoriale del leader politico.
 * Zero dipendenze da immagini esterne (nessun avatar rotto), tinteggiato con il colore del partito.
 */
export const LeaderAvatar: React.FC<LeaderAvatarProps> = ({
  name,
  color,
  size = 38,
  partyAcronym,
}) => {
  const safeColor = sanitizeHexColor(color, '#06B6D4');
  const initials = extractInitials(name || 'Leader');
  const seed = hashSeed(`${name}-${partyAcronym ?? ''}`);
  const gradId = `leader-grad-${seed % 100000}`;

  return (
    <div
      style={{ width: size, height: size }}
      title={partyAcronym ? `${name} (${partyAcronym})` : name}
      aria-label={`Ritratto di ${name}`}
      className="relative rounded-full shrink-0 overflow-hidden select-none ring-1 ring-slate-700/90 shadow-inner"
    >
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        className="block w-full h-full"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={gradId} cx="35%" cy="25%" r="75%">
            <stop offset="0%" stopColor={safeColor} stopOpacity="0.48" />
            <stop offset="65%" stopColor="#111827" stopOpacity="0.96" />
            <stop offset="100%" stopColor="#090D16" stopOpacity="1" />
          </radialGradient>
        </defs>

        {/* Sfondo istituzionale tinteggiato */}
        <circle cx="32" cy="32" r="32" fill={`url(#${gradId})`} />

        {/* Cornice sottile nel colore del partito */}
        <circle
          cx="32"
          cy="32"
          r="29.5"
          fill="none"
          stroke={safeColor}
          strokeOpacity="0.55"
          strokeWidth="1.5"
        />

        {/* Silhouette stilizzata giacca + collo sullo sfondo */}
        <path
          d="M12 60 C14 46, 22 41, 32 41 C42 41, 50 46, 52 60 Z"
          fill={safeColor}
          fillOpacity="0.22"
        />
        <circle cx="32" cy="25" r="10.5" fill={safeColor} fillOpacity="0.18" />

        {/* Monogramma nitido centrato */}
        <text
          x="32"
          y="37"
          textAnchor="middle"
          fill="#F8FAFC"
          fontSize="21"
          fontWeight="700"
          fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
          letterSpacing="0.5"
        >
          {initials}
        </text>
      </svg>
    </div>
  );
};

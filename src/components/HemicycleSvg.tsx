import React, { useMemo, useState } from 'react';
import { PartyState, SeatAllocation } from '../types/game';

interface HemicycleSvgProps {
  parties: PartyState[];
  seats: SeatAllocation[];
  playerPartyId: string;
  compact?: boolean;
  title?: string;
  subtitle?: string;
  isProjection?: boolean;
}

interface SeatDot {
  x: number;
  y: number;
  partyId: string;
  color: string;
  partyName: string;
  acronym: string;
  seatCount: number;
}

export const HemicycleSvg: React.FC<HemicycleSvgProps> = ({
  parties,
  seats,
  playerPartyId,
  compact = false,
  title,
  subtitle,
  isProjection = false,
}) => {
  const [chamber, setChamber] = useState<'camera' | 'senato'>('camera');
  const [hoveredPartyId, setHoveredPartyId] = useState<string | null>(null);

  const totalSeats = chamber === 'camera' ? 400 : 200;
  const majorityThreshold = chamber === 'camera' ? 201 : 101;

  // Sort parties Left -> Right along economic axis so the hemicycle looks authentically parliamentary
  const orderedParties = useMemo(() => {
    return [...parties]
      .filter((p) => p.id !== 'altri')
      .sort((a, b) => a.axis.economic - b.axis.economic);
  }, [parties]);

  const seatCountsMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of seats) {
      map.set(s.partyId, chamber === 'camera' ? s.camera : s.senato);
    }
    return map;
  }, [seats, chamber]);

  // Generate concentric arc dot coordinates (left-to-right sweep by angle)
  const dots = useMemo<SeatDot[]>(() => {
    const rowConfigs =
      chamber === 'camera'
        ? [
            { radius: 82, count: 31 },
            { radius: 97, count: 38 },
            { radius: 112, count: 44 },
            { radius: 127, count: 51 },
            { radius: 142, count: 57 },
            { radius: 157, count: 64 },
            { radius: 172, count: 71 },
            { radius: 187, count: 44 },
          ]
        : [
            { radius: 92, count: 24 },
            { radius: 112, count: 31 },
            { radius: 132, count: 38 },
            { radius: 152, count: 48 },
            { radius: 172, count: 59 },
          ];

    // Exact total check
    const rawCoords: { x: number; y: number; angle: number }[] = [];
    const cx = 220;
    const cy = 205;

    for (const row of rowConfigs) {
      for (let i = 0; i < row.count; i++) {
        const t = row.count === 1 ? 0.5 : i / (row.count - 1);
        const angle = Math.PI - t * Math.PI; // PI (left) -> 0 (right)
        const x = cx + Math.cos(angle) * row.radius;
        const y = cy - Math.sin(angle) * row.radius;
        rawCoords.push({ x, y, angle });
      }
    }

    // Sort strictly by angle descending (left-to-right slices across all rows)
    rawCoords.sort((a, b) => b.angle - a.angle);

    // Flatten party seats in left-to-right order
    const flatPartyList: PartyState[] = [];
    for (const p of orderedParties) {
      const count = seatCountsMap.get(p.id) ?? 0;
      for (let i = 0; i < count; i++) {
        flatPartyList.push(p);
      }
    }

    return rawCoords.slice(0, totalSeats).map((coord, idx) => {
      const p = flatPartyList[idx];
      return {
        x: coord.x,
        y: coord.y,
        partyId: p?.id ?? 'vacant',
        color: p?.color ?? '#334155',
        partyName: p?.name ?? 'Non assegnato',
        acronym: p?.acronym ?? '--',
        seatCount: p ? seatCountsMap.get(p.id) ?? 0 : 0,
      };
    });
  }, [orderedParties, seatCountsMap, chamber, totalSeats]);

  const playerParty = parties.find((p) => p.id === playerPartyId);
  const hasAllies = useMemo(() => {
    if (!playerParty || !playerParty.coalitionId) return false;
    return parties.some(
      (p) =>
        p.id !== 'altri' &&
        p.id !== playerParty.id &&
        p.coalitionId === playerParty.coalitionId
    );
  }, [parties, playerParty]);

  const playerCoalitionSeats = useMemo(() => {
    if (!playerParty) return 0;
    return parties
      .filter(
        (p) =>
          p.id !== 'altri' &&
          (p.id === playerParty.id ||
            (Boolean(playerParty.coalitionId) && p.coalitionId === playerParty.coalitionId))
      )
      .reduce((acc, p) => acc + (seatCountsMap.get(p.id) ?? 0), 0);
  }, [parties, playerParty, seatCountsMap]);

  const resolvedTitle =
    title ??
    (isProjection
      ? 'Proiezione Emiciclo (se si votasse oggi)'
      : 'Emiciclo Parlamentare');
  const resolvedSubtitle =
    subtitle ??
    (isProjection
      ? 'Stima basata sui sondaggi attuali; i seggi reali cambiano solo dopo il voto'
      : undefined);
  const playerSeatsLabel = hasAllies
    ? isProjection
      ? 'Tua coalizione (proiezione)'
      : 'Tua coalizione'
    : isProjection
      ? 'Tuo partito (proiezione)'
      : 'Tuo partito';

  const hoveredParty = hoveredPartyId
    ? parties.find((p) => p.id === hoveredPartyId)
    : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h3
            className={`text-sm font-semibold ${
              isProjection ? 'text-amber-200' : 'text-slate-100'
            }`}
          >
            {resolvedTitle}
          </h3>
          {resolvedSubtitle && (
            <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
              {resolvedSubtitle}
            </p>
          )}
          <div className="text-[11px] text-slate-400 mt-0.5">
            Maggioranza:{' '}
            <span className="font-mono tabular-nums text-amber-400">
              {majorityThreshold}
            </span>{' '}
            · {playerSeatsLabel}:{' '}
            <span
              className={`font-mono tabular-nums font-semibold ${
                playerCoalitionSeats >= majorityThreshold ? 'text-emerald-400' : 'text-cyan-400'
              }`}
            >
              {playerCoalitionSeats}
            </span>
          </div>
        </div>

        {/* Interactive Segmented Toggle */}
        <div className="flex items-center p-0.5 bg-[#090D16] border border-slate-800 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setChamber('camera')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              chamber === 'camera'
                ? 'bg-slate-800 text-slate-50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Camera (400)
          </button>
          <button
            type="button"
            onClick={() => setChamber('senato')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              chamber === 'senato'
                ? 'bg-slate-800 text-slate-50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Senato (200)
          </button>
        </div>
      </div>

      {/* SVG Arc */}
      <div className="relative flex-1 flex items-center justify-center min-h-[170px]">
        <svg
          viewBox="0 0 440 225"
          className={`w-full ${compact ? 'max-h-[195px]' : 'max-h-[225px]'}`}
          role="img"
          aria-label={`${resolvedTitle} · ${
            chamber === 'camera' ? 'Camera dei Deputati' : 'Senato della Repubblica'
          }`}
        >
          {/* Majority center reference line */}
          <line
            x1="220"
            y1="14"
            x2="220"
            y2="138"
            stroke="#F59E0B"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.5"
          />

          {dots.map((dot, idx) => {
            const dimmed = hoveredPartyId && hoveredPartyId !== dot.partyId;
            return (
              <circle
                key={idx}
                cx={dot.x}
                cy={dot.y}
                r={chamber === 'camera' ? 3.5 : 4.7}
                fill={dot.color}
                opacity={dimmed ? 0.22 : 0.95}
                className="transition-opacity duration-150 cursor-pointer"
                onMouseEnter={() => setHoveredPartyId(dot.partyId)}
                onMouseLeave={() => setHoveredPartyId(null)}
              />
            );
          })}

          {/* Center readout */}
          <text
            x="220"
            y="180"
            textAnchor="middle"
            className="fill-slate-100 font-mono text-[24px] font-bold"
          >
            {hoveredParty ? seatCountsMap.get(hoveredParty.id) ?? 0 : totalSeats}
          </text>
          <text
            x="220"
            y="200"
            textAnchor="middle"
            className="fill-slate-400 text-[11px] font-sans"
          >
            {hoveredParty
              ? `${hoveredParty.name} (${hoveredParty.nationalPoll.toFixed(1)}%)`
              : isProjection
                ? chamber === 'camera'
                  ? 'Stima Deputati · Soglia 3%'
                  : 'Stima Senatori · Soglia 3%'
                : chamber === 'camera'
                  ? 'Deputati · Camera (400)'
                  : 'Senatori Elettivi · Senato (200)'}
          </text>
        </svg>
      </div>

      {/* Compact Party Legend */}
      <div className="mt-2 pt-2.5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1.5">
        {orderedParties.map((p) => {
          const count = seatCountsMap.get(p.id) ?? 0;
          const isPlayer = p.id === playerPartyId;
          return (
            <div
              key={p.id}
              onMouseEnter={() => setHoveredPartyId(p.id)}
              onMouseLeave={() => setHoveredPartyId(null)}
              className={`flex items-center justify-between text-[11px] cursor-pointer transition-opacity ${
                hoveredPartyId && hoveredPartyId !== p.id ? 'opacity-40' : 'opacity-100'
              }`}
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <span
                  style={{ backgroundColor: p.color }}
                  className="w-2.5 h-2.5 rounded-xs shrink-0"
                />
                <span
                  className={`truncate ${
                    isPlayer ? 'text-cyan-300 font-semibold' : 'text-slate-300'
                  }`}
                >
                  {p.acronym}
                </span>
              </span>
              <span className="font-mono tabular-nums text-slate-200 font-medium">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { DEMOGRAPHICS } from '../data/presets';
import { ITALIAN_REGIONS, REGION_MAP_BY_ID } from '../data/italyRegions';
import { PartyState, RegionId } from '../types/game';
import { Building2, CheckCircle2, MapPin, XCircle } from 'lucide-react';

interface ItalyRegionsMapProps {
  parties: PartyState[];
  playerPartyId: string;
  budget: number;
  openHeadquarters: RegionId[];
  selectedRegion: RegionId;
  onSelectRegion: (region: RegionId) => void;
  onOpenHq: (region: RegionId) => void;
  onCloseHq: (region: RegionId) => void;
}

export const ItalyRegionsMap: React.FC<ItalyRegionsMapProps> = ({
  parties,
  playerPartyId,
  budget,
  openHeadquarters,
  selectedRegion,
  onSelectRegion,
  onOpenHq,
  onCloseHq,
}) => {
  const [hoveredRegionId, setHoveredRegionId] = useState<RegionId | null>(null);

  const player = parties.find((p) => p.id === playerPartyId)!;
  const activeRegion = REGION_MAP_BY_ID[selectedRegion] ?? ITALIAN_REGIONS[3];
  const hoveredRegion = hoveredRegionId ? REGION_MAP_BY_ID[hoveredRegionId] : null;

  const regionLeaders = useMemo(() => {
    const map = new Map<RegionId, PartyState>();
    const mainParties = parties.filter((p) => p.id !== 'altri');
    for (const reg of ITALIAN_REGIONS) {
      let best = mainParties[0];
      let bestVal = -1;
      for (const p of mainParties) {
        const v = p.regionPolls?.[reg.id] ?? p.regions[reg.macroRegion];
        if (v > bestVal) {
          bestVal = v;
          best = p;
        }
      }
      if (best) map.set(reg.id, best);
    }
    return map;
  }, [parties]);

  const activeRanking = useMemo(() => {
    return [...parties]
      .filter((p) => p.id !== 'altri')
      .map((p) => ({
        party: p,
        val: p.regionPolls?.[activeRegion.id] ?? p.regions[activeRegion.macroRegion],
      }))
      .sort((a, b) => b.val - a.val);
  }, [parties, activeRegion]);

  const hasHqHere = openHeadquarters.includes(activeRegion.id);
  const canAffordHq = budget >= activeRegion.hqCost;
  const totalHqUpkeep = openHeadquarters.reduce(
    (sum, id) => sum + (REGION_MAP_BY_ID[id]?.hqWeeklyUpkeep ?? 0),
    0
  );

  const hoveredLeader = hoveredRegion ? regionLeaders.get(hoveredRegion.id) : null;
  const hoveredLeaderVal = hoveredRegion && hoveredLeader
    ? hoveredLeader.regionPolls?.[hoveredRegion.id] ?? hoveredLeader.regions[hoveredRegion.macroRegion]
    : 0;
  const hoveredPlayerVal = hoveredRegion
    ? player.regionPolls?.[hoveredRegion.id] ?? player.regions[hoveredRegion.macroRegion]
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
      {/* Left: Realistic 20-Region SVG Map of Italy */}
      <div className="lg:col-span-6 flex flex-col justify-between gap-2.5 min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Mappa Elettorale · 20 Regioni e Sedi
            </h3>
            <p className="text-[11px] text-slate-400">
              Colore per partito di maggioranza relativa · Clicca una regione per gestire la sede
            </p>
          </div>
          <div className="text-[11px] font-mono tabular-nums text-amber-400 shrink-0">
            Sedi attive: {openHeadquarters.length}/20
            {totalHqUpkeep > 0 && (
              <span className="text-slate-400"> · -€{totalHqUpkeep.toLocaleString('it-IT')}/s</span>
            )}
          </div>
        </div>

        {/* SVG Map Viewport */}
        <div className="relative bg-[#090D16] border border-slate-800/80 rounded-xl p-2 flex flex-col items-center justify-center overflow-hidden">
          {/* Dynamic Hover Info Strip */}
          <div className="w-full min-h-[24px] px-2 pb-1 flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/60">
            {hoveredRegion ? (
              <>
                <span className="font-semibold text-slate-100 truncate">
                  {hoveredRegion.name} ({hoveredRegion.capital})
                </span>
                <span className="font-mono tabular-nums shrink-0 ml-2">
                  1° <span style={{ color: hoveredLeader?.color }}>{hoveredLeader?.acronym}</span>{' '}
                  {hoveredLeaderVal.toFixed(1)}% · {player.acronym}{' '}
                  <span className="text-cyan-300">{hoveredPlayerVal.toFixed(1)}%</span>
                </span>
              </>
            ) : (
              <>
                <span className="truncate">
                  Selezionata: <strong className="text-slate-200">{activeRegion.name}</strong> (
                  {activeRegion.capital})
                </span>
                <span className="font-mono text-cyan-400 shrink-0 ml-2">
                  ★ Capoluogo con Sede
                </span>
              </>
            )}
          </div>

          <svg
            viewBox="0 0 500 580"
            className="w-full max-w-[340px] sm:max-w-[360px] h-auto max-h-[370px] mt-1 select-none"
            role="img"
            aria-label="Mappa elettorale delle 20 regioni italiane"
          >
            <defs>
              <filter id="hqGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="3.2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* All 20 Real Regions */}
            {ITALIAN_REGIONS.map((reg) => {
              const leader = regionLeaders.get(reg.id);
              const isSelected = reg.id === activeRegion.id;
              const isHovered = reg.id === hoveredRegionId;
              const fillColor = leader?.color ?? '#334155';

              return (
                <path
                  key={reg.id}
                  d={reg.path}
                  fill={fillColor}
                  fillOpacity={isSelected ? 0.92 : isHovered ? 0.78 : 0.56}
                  stroke={isSelected ? '#F8FAFC' : isHovered ? '#CBD5E1' : '#090D16'}
                  strokeWidth={isSelected ? 2.4 : isHovered ? 1.6 : 1.1}
                  strokeLinejoin="round"
                  onClick={() => onSelectRegion(reg.id)}
                  onMouseEnter={() => setHoveredRegionId(reg.id)}
                  onMouseLeave={() => setHoveredRegionId(null)}
                  className="transition-all duration-150 cursor-pointer"
                >
                  <title>
                    {reg.name} ({reg.capital}) — 1° {leader?.name ?? ''}
                  </title>
                </path>
              );
            })}

            {/* Luminous Headquarters Markers on Capitals */}
            {ITALIAN_REGIONS.filter((r) => openHeadquarters.includes(r.id)).map((reg) => (
              <g
                key={`hq_${reg.id}`}
                onClick={() => onSelectRegion(reg.id)}
                className="cursor-pointer"
              >
                <circle
                  cx={reg.capitalX}
                  cy={reg.capitalY}
                  r={8.5}
                  fill="#F59E0B"
                  fillOpacity={0.28}
                  filter="url(#hqGlow)"
                />
                <circle
                  cx={reg.capitalX}
                  cy={reg.capitalY}
                  r={4.8}
                  fill="#FDE047"
                  stroke="#090D16"
                  strokeWidth="1.5"
                  filter="url(#hqGlow)"
                />
                <circle cx={reg.capitalX} cy={reg.capitalY} r={1.8} fill="#090D16" />
              </g>
            ))}

            {/* Subtle pin on currently selected region capital if no HQ yet */}
            {!hasHqHere && (
              <circle
                cx={activeRegion.capitalX}
                cy={activeRegion.capitalY}
                r={3.5}
                fill="#FFFFFF"
                stroke="#090D16"
                strokeWidth="1.2"
                className="pointer-events-none"
              />
            )}
          </svg>
        </div>

        {/* Accessible 20-Region Quick Selector (essential for small regions on touchscreens) */}
        <div className="flex items-center gap-2">
          <label htmlFor="region-select" className="text-[11px] text-slate-400 shrink-0">
            Seleziona regione:
          </label>
          <select
            id="region-select"
            value={activeRegion.id}
            onChange={(e) => onSelectRegion(e.target.value as RegionId)}
            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-[#090D16] border border-slate-700/80 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            {ITALIAN_REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.capital}){openHeadquarters.includes(r.id) ? ' ★ Sede' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Selected Region Dossier + Regional HQ Management + Demographics */}
      <div className="lg:col-span-6 flex flex-col justify-between gap-3 min-w-0">
        {/* Region Header & HQ Control Box */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2 border-b border-slate-800/80">
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-50 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{activeRegion.name}</span>
                <span className="text-xs font-normal text-slate-400">
                  · Capoluogo: {activeRegion.capital}
                </span>
              </div>
            </div>
            <div className="text-[11px] font-mono tabular-nums text-amber-400 shrink-0">
              {activeRegion.cameraSeats} Cam. · {activeRegion.senatoSeats} Sen.
            </div>
          </div>

          {/* Regional Headquarters Action Panel */}
          <div
            className={`p-3 rounded-lg border ${
              hasHqHere
                ? 'bg-amber-500/8 border-amber-500/45'
                : 'bg-[#090D16] border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                  <Building2
                    className={`w-3.5 h-3.5 shrink-0 ${
                      hasHqHere ? 'text-amber-400' : 'text-cyan-400'
                    }`}
                  />
                  <span>
                    {hasHqHere
                      ? `Sede Regionale Attiva · ${activeRegion.capital}`
                      : `Apri Sede Regionale a ${activeRegion.capital}`}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
                  +{activeRegion.hqWeeklyGrowth.toFixed(1)}%/sett. consenso · +€
                  {activeRegion.hqMembershipIncome.toLocaleString('it-IT')}/s tessere · Costo fiss.
                  €{activeRegion.hqWeeklyUpkeep.toLocaleString('it-IT')}/s
                </div>
              </div>

              {hasHqHere ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Operativa
                  </span>
                  <button
                    type="button"
                    onClick={() => onCloseHq(activeRegion.id)}
                    className="px-2.5 py-1.5 rounded-md bg-rose-950/40 hover:bg-rose-950/70 border border-rose-500/40 text-[11px] font-medium text-rose-300 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <XCircle className="w-3 h-3" />
                    Chiudi
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!canAffordHq}
                  onClick={() => onOpenHq(activeRegion.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    canAffordHq
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Apri Sede (€{activeRegion.hqCost.toLocaleString('it-IT')})
                </button>
              )}
            </div>
          </div>

          {/* All Parties Ranking in Selected Region */}
          <div className="space-y-1.5 max-h-[205px] overflow-y-auto war-scroll pr-1">
            {activeRanking.map(({ party, val }) => {
              const isPlayer = party.id === playerPartyId;
              return (
                <div key={party.id} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span
                      className={`truncate ${
                        isPlayer ? 'text-cyan-300 font-semibold' : 'text-slate-300'
                      }`}
                    >
                      {party.name} ({party.acronym})
                    </span>
                    <span className="font-mono tabular-nums text-slate-100 font-medium shrink-0">
                      {val.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[#090D16] rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(100, val * 2.2)}%`,
                        backgroundColor: party.color,
                      }}
                      className="h-full rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Player Demographic Breakdown */}
        <div className="pt-2.5 border-t border-slate-800/80">
          <div className="text-xs font-semibold text-slate-200 mb-2">
            Consenso {player.acronym} per Fascia Demografica
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DEMOGRAPHICS.map((d) => (
              <div
                key={d.id}
                className="p-2 rounded-lg bg-[#090D16] border border-slate-800/80"
              >
                <div className="text-[10px] text-slate-400 truncate">{d.shortLabel}</div>
                <div className="font-mono text-sm font-bold tabular-nums text-cyan-300 mt-0.5">
                  {player.demographics[d.id].toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

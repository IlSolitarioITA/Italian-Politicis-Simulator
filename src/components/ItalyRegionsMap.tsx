import React, { useMemo, useRef, useState } from 'react';
import { DEMOGRAPHICS } from '../data/presets';
import {
  CHAPTER_TIERS,
  ITALIAN_REGIONS,
  ITALY_MAP_VIEWBOX,
  REGION_MAP_BY_ID,
  getRegionChapterMetrics,
} from '../data/italyRegions';
import { ChapterLevel, PartyState, RegionId, RegionalChapterState } from '../types/game';
import {
  ArrowUpCircle,
  Building2,
  CheckCircle2,
  Layers,
  MapPin,
  XCircle,
} from 'lucide-react';

export type MapColorMode = 'leader' | 'presenza';

interface ItalyRegionsMapProps {
  parties: PartyState[];
  playerPartyId: string;
  budget: number;
  openHeadquarters: RegionId[];
  regionalChapters?: Partial<Record<RegionId, RegionalChapterState>>;
  selectedRegion: RegionId;
  onSelectRegion: (region: RegionId) => void;
  onOpenHq: (region: RegionId) => void;
  onCloseHq: (region: RegionId) => void;
  onDowngradeChapter?: (region: RegionId) => void;
  /** Optional default map coloring mode */
  defaultColorMode?: MapColorMode;
  /** When true, renders only the interactive high-def ISTAT map viewport + controls (for TabTerritory) */
  mapOnly?: boolean;
}

const CHAPTER_LEVEL_FILL: Record<ChapterLevel, string> = {
  0: '#1E293B',
  1: '#0284C7',
  2: '#06B6D4',
  3: '#F59E0B',
};

const CHAPTER_LEVEL_MARKER: Record<ChapterLevel, string> = {
  0: '#FFFFFF',
  1: '#38BDF8',
  2: '#22D3EE',
  3: '#FDE047',
};

export const ItalyRegionsMap: React.FC<ItalyRegionsMapProps> = ({
  parties,
  playerPartyId,
  budget,
  openHeadquarters,
  regionalChapters,
  selectedRegion,
  onSelectRegion,
  onOpenHq,
  onCloseHq,
  onDowngradeChapter,
  defaultColorMode = 'leader',
  mapOnly = false,
}) => {
  const [hoveredRegionId, setHoveredRegionId] = useState<RegionId | null>(null);
  const [colorMode, setColorMode] = useState<MapColorMode>(defaultColorMode);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const player = parties.find((p) => p.id === playerPartyId)!;
  const activeRegion = REGION_MAP_BY_ID[selectedRegion] ?? ITALIAN_REGIONS[3];
  const hoveredRegion = hoveredRegionId ? REGION_MAP_BY_ID[hoveredRegionId] : null;

  const getLevel = (regionId: RegionId): ChapterLevel => {
    const ch = regionalChapters?.[regionId];
    if (ch && ch.level > 0) return ch.level;
    return openHeadquarters.includes(regionId) ? 1 : 0;
  };

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

  const activeChaptersSummary = useMemo(() => {
    let count = 0;
    let totalWeeklyUpkeep = 0;
    for (const reg of ITALIAN_REGIONS) {
      const lv = getLevel(reg.id);
      if (lv > 0) {
        count += 1;
        totalWeeklyUpkeep += getRegionChapterMetrics(reg, lv).weeklyUpkeep;
      }
    }
    return { count, totalWeeklyUpkeep };
  }, [regionalChapters, openHeadquarters]);

  const activeLevel = getLevel(activeRegion.id);
  const activeMetrics = getRegionChapterMetrics(activeRegion, activeLevel);
  const canAffordNext = activeLevel < 3 && budget >= activeMetrics.openOrUpgradeCost;
  const nextMetrics = activeMetrics.nextLevel
    ? getRegionChapterMetrics(activeRegion, activeMetrics.nextLevel)
    : null;

  const hoveredLeader = hoveredRegion ? regionLeaders.get(hoveredRegion.id) : null;
  const hoveredLeaderVal =
    hoveredRegion && hoveredLeader
      ? hoveredLeader.regionPolls?.[hoveredRegion.id] ??
        hoveredLeader.regions[hoveredRegion.macroRegion]
      : 0;
  const hoveredPlayerVal = hoveredRegion
    ? player.regionPolls?.[hoveredRegion.id] ?? player.regions[hoveredRegion.macroRegion]
    : 0;
  const hoveredLevel: ChapterLevel = hoveredRegion ? getLevel(hoveredRegion.id) : 0;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    // Clamp tooltip horizontally/vertically inside the map frame
    const clampedX = Math.max(12, Math.min(rect.width - 210, relX + 14));
    const clampedY = Math.max(40, Math.min(rect.height - 92, relY - 12));
    setTooltipPos({ x: clampedX, y: clampedY });
  };

  const mapViewport = (
    <div className="flex flex-col justify-between gap-2.5 min-w-0 h-full">
      {/* Header + Coloring Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-100">
            Mappa Italia ISTAT · 20 Regioni
          </h3>
          <p className="text-[11px] text-slate-400">
            {colorMode === 'leader'
              ? 'Colore per partito in testa · Tocca o clicca una regione'
              : 'Colore per livello sezioni & circoli del tuo partito'}
          </p>
        </div>

        <div className="flex items-center gap-1 p-0.5 bg-[#090D16] border border-slate-800 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setColorMode('leader')}
            className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
              colorMode === 'leader'
                ? 'bg-slate-800 text-slate-50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Partito 1°
          </button>
          <button
            type="button"
            onClick={() => setColorMode('presenza')}
            className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
              colorMode === 'presenza'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Layers className="w-3 h-3 shrink-0" />
            <span>Sezioni ({activeChaptersSummary.count}/20)</span>
          </button>
        </div>
      </div>

      {/* High-Definition ISTAT SVG Map Viewport */}
      <div
        ref={mapContainerRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => {
          setHoveredRegionId(null);
          setTooltipPos(null);
        }}
        className="relative bg-[#090D16] border border-slate-800/90 rounded-xl p-2 sm:p-2.5 flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Always-Visible Mobile & Desktop Telemetry Bar */}
        <div className="w-full min-h-[26px] px-2 pb-1.5 flex items-center justify-between gap-2 text-[11px] text-slate-400 border-b border-slate-800/70">
          {hoveredRegion ? (
            <>
              <span className="font-semibold text-slate-100 truncate">
                {hoveredRegion.name} ({hoveredRegion.capital})
              </span>
              <span className="font-mono tabular-nums shrink-0">
                1° <span style={{ color: hoveredLeader?.color }}>{hoveredLeader?.acronym}</span>{' '}
                {hoveredLeaderVal.toFixed(1)}% · {player.acronym}{' '}
                <span className="text-cyan-300">{hoveredPlayerVal.toFixed(1)}%</span>
              </span>
            </>
          ) : (
            <>
              <span className="truncate">
                Selezionata: <strong className="text-slate-100">{activeRegion.name}</strong> (
                {activeRegion.capital})
              </span>
              <span className="font-mono tabular-nums text-amber-400 shrink-0">
                {activeLevel > 0 ? CHAPTER_TIERS[activeLevel].shortLabel : 'Nessuna Sezione'}
              </span>
            </>
          )}
        </div>

        <svg
          viewBox={ITALY_MAP_VIEWBOX}
          className={`w-full h-auto mt-1 select-none ${
            mapOnly
              ? 'max-w-[390px] max-h-[455px]'
              : 'max-w-[340px] sm:max-w-[360px] max-h-[385px]'
          }`}
          role="img"
          aria-label="Mappa ad alta definizione delle 20 regioni italiane (confini ISTAT)"
        >
          <defs>
            <filter id="hqGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Subtle maritime backdrop grid lines */}
          <g stroke="#1E293B" strokeOpacity="0.28" strokeWidth="0.6" className="pointer-events-none">
            <line x1="0" y1="160" x2="540" y2="160" strokeDasharray="3 6" />
            <line x1="0" y1="320" x2="540" y2="320" strokeDasharray="3 6" />
            <line x1="0" y1="480" x2="540" y2="480" strokeDasharray="3 6" />
            <line x1="180" y1="0" x2="180" y2="640" strokeDasharray="3 6" />
            <line x1="360" y1="0" x2="360" y2="640" strokeDasharray="3 6" />
          </g>

          {/* All 20 High-Def ISTAT Italian Regions */}
          {ITALIAN_REGIONS.map((reg) => {
            const leader = regionLeaders.get(reg.id);
            const lv = getLevel(reg.id);
            const isSelected = reg.id === activeRegion.id;
            const isHovered = reg.id === hoveredRegionId;

            const fillColor =
              colorMode === 'leader'
                ? leader?.color ?? '#334155'
                : CHAPTER_LEVEL_FILL[lv];

            const baseOpacity =
              colorMode === 'leader'
                ? 0.58
                : lv === 0
                  ? 0.42
                  : lv === 1
                    ? 0.64
                    : lv === 2
                      ? 0.78
                      : 0.88;

            const fillOpacity = isSelected
              ? Math.min(0.96, baseOpacity + 0.34)
              : isHovered
                ? Math.min(0.9, baseOpacity + 0.2)
                : baseOpacity;

            return (
              <path
                key={reg.id}
                d={reg.path}
                fill={fillColor}
                fillOpacity={fillOpacity}
                stroke={isSelected ? '#F8FAFC' : isHovered ? '#E2E8F0' : '#090D16'}
                strokeWidth={isSelected ? 2.4 : isHovered ? 1.7 : 1.05}
                strokeLinejoin="round"
                onClick={() => onSelectRegion(reg.id)}
                onMouseEnter={() => setHoveredRegionId(reg.id)}
                onMouseLeave={() => setHoveredRegionId(null)}
                className="transition-[fill-opacity,stroke,stroke-width] duration-150 cursor-pointer"
              >
                <title>
                  {reg.name} ({reg.capital}) — 1° {leader?.name ?? ''} ·{' '}
                  {CHAPTER_TIERS[lv].label}
                </title>
              </path>
            );
          })}

          {/* Tiered Chapter / Headquarters Markers on Capitals */}
          {ITALIAN_REGIONS.filter((r) => getLevel(r.id) > 0).map((reg) => {
            const lv = getLevel(reg.id);
            const markerColor = CHAPTER_LEVEL_MARKER[lv];
            const outerR = lv === 3 ? 10 : lv === 2 ? 8.5 : 7;
            const coreR = lv === 3 ? 5.8 : lv === 2 ? 5.2 : 4.5;

            return (
              <g
                key={`hq_${reg.id}`}
                onClick={() => onSelectRegion(reg.id)}
                onMouseEnter={() => setHoveredRegionId(reg.id)}
                className="cursor-pointer"
              >
                <circle
                  cx={reg.capitalX}
                  cy={reg.capitalY}
                  r={outerR}
                  fill={markerColor}
                  fillOpacity={0.28}
                  filter="url(#hqGlow)"
                />
                <circle
                  cx={reg.capitalX}
                  cy={reg.capitalY}
                  r={coreR}
                  fill={markerColor}
                  stroke="#090D16"
                  strokeWidth="1.4"
                />
                <text
                  x={reg.capitalX}
                  y={reg.capitalY + 2.6}
                  textAnchor="middle"
                  fontSize="7"
                  fontWeight="800"
                  fill="#090D16"
                  className="pointer-events-none select-none font-mono"
                >
                  {lv}
                </text>
              </g>
            );
          })}

          {/* Subtle pin on currently selected region capital if no chapter yet */}
          {activeLevel === 0 && (
            <circle
              cx={activeRegion.capitalX}
              cy={activeRegion.capitalY}
              r={3.8}
              fill="#FFFFFF"
              stroke="#090D16"
              strokeWidth="1.4"
              className="pointer-events-none"
            />
          )}
        </svg>

        {/* Desktop Floating Tooltip (pointer-tracked, clamped inside container) */}
        {hoveredRegion && tooltipPos && (
          <div
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
            className="hidden sm:block pointer-events-none absolute z-20 w-[200px] p-2.5 rounded-lg bg-[#0B1120]/96 border border-slate-700/90 shadow-xl backdrop-blur-xs space-y-1"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-slate-50 truncate">
                {hoveredRegion.name}
              </span>
              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                {hoveredRegion.capital}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
              <span className="text-slate-400">In testa:</span>
              <span className="font-semibold" style={{ color: hoveredLeader?.color }}>
                {hoveredLeader?.acronym} {hoveredLeaderVal.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
              <span className="text-slate-400">{player.acronym}:</span>
              <span className="font-semibold text-cyan-300">{hoveredPlayerVal.toFixed(1)}%</span>
            </div>
            <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Presidio:</span>
              <span
                className={
                  hoveredLevel === 3
                    ? 'text-amber-300 font-semibold'
                    : hoveredLevel > 0
                      ? 'text-cyan-300 font-semibold'
                      : 'text-slate-500'
                }
              >
                {CHAPTER_TIERS[hoveredLevel].shortLabel}
              </span>
            </div>
          </div>
        )}

        {/* Map Legend Footer */}
        <div className="w-full pt-1.5 mt-1 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
          {colorMode === 'presenza' ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#1E293B] border border-slate-700" />
                Assente
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#0284C7]" />
                Liv. 1 Circolo
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#06B6D4]" />
                Liv. 2 Provinciale
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#F59E0B]" />
                Liv. 3 Federazione
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <span>Confini regionali ISTAT</span>
              <span className="font-mono text-amber-400">
                ① ② ③ Livello Sezione sul Capoluogo
              </span>
            </div>
          )}

          {activeChaptersSummary.totalWeeklyUpkeep > 0 && (
            <span className="font-mono tabular-nums text-slate-300">
              Costi sezioni: -€{activeChaptersSummary.totalWeeklyUpkeep.toLocaleString('it-IT')}/s
            </span>
          )}
        </div>
      </div>

      {/* Accessible 20-Region Quick Selector (essential for small regions on touchscreens) */}
      <div className="flex items-center gap-2">
        <label htmlFor="region-select" className="text-[11px] text-slate-400 shrink-0">
          Regione:
        </label>
        <select
          id="region-select"
          value={activeRegion.id}
          onChange={(e) => onSelectRegion(e.target.value as RegionId)}
          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-[#090D16] border border-slate-700/80 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
        >
          {ITALIAN_REGIONS.map((r) => {
            const lv = getLevel(r.id);
            return (
              <option key={r.id} value={r.id}>
                {r.name} ({r.capital})
                {lv > 0 ? ` · ${CHAPTER_TIERS[lv].shortLabel}` : ''}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );

  if (mapOnly) {
    return mapViewport;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
      {/* Left: High-Def ISTAT 20-Region SVG Map */}
      <div className="lg:col-span-6 min-w-0">{mapViewport}</div>

      {/* Right: Selected Region Dossier + Regional Chapter Management + Demographics */}
      <div className="lg:col-span-6 flex flex-col justify-between gap-3 min-w-0">
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

          {/* Regional Chapter / Circolo Action Panel */}
          <div
            className={`p-3 rounded-lg border ${
              activeLevel > 0
                ? 'bg-cyan-500/8 border-cyan-500/40'
                : 'bg-[#090D16] border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                  <Building2
                    className={`w-3.5 h-3.5 shrink-0 ${
                      activeLevel === 3
                        ? 'text-amber-400'
                        : activeLevel > 0
                          ? 'text-cyan-400'
                          : 'text-slate-400'
                    }`}
                  />
                  <span>
                    {activeLevel > 0
                      ? `${activeMetrics.tier.label} (Liv. ${activeLevel}/3) · ${activeRegion.capital}`
                      : `Apri Circolo Territoriale a ${activeRegion.capital}`}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
                  {activeLevel > 0 ? (
                    <>
                      +{activeMetrics.weeklyConsensusBoost.toFixed(2)}%/s · +
                      {activeMetrics.weeklyNewMembers} iscritti/s · Manten. €
                      {activeMetrics.monthlyUpkeep.toLocaleString('it-IT')}/mese
                    </>
                  ) : nextMetrics ? (
                    <>
                      Liv. 1: +{nextMetrics.weeklyConsensusBoost.toFixed(2)}%/s · +
                      {nextMetrics.weeklyNewMembers} iscritti/s · €
                      {nextMetrics.monthlyUpkeep.toLocaleString('it-IT')}/mese
                    </>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {activeLevel < 3 ? (
                  <button
                    type="button"
                    disabled={!canAffordNext}
                    onClick={() => onOpenHq(activeRegion.id)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1 ${
                      canAffordNext
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <ArrowUpCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {activeLevel === 0 ? 'Apri' : `Liv. ${activeLevel + 1}`} (€
                      {activeMetrics.openOrUpgradeCost.toLocaleString('it-IT')})
                    </span>
                  </button>
                ) : (
                  <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Max Liv. 3
                  </span>
                )}

                {activeLevel > 1 && onDowngradeChapter && (
                  <button
                    type="button"
                    onClick={() => onDowngradeChapter(activeRegion.id)}
                    className="px-2 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-medium text-slate-200 cursor-pointer whitespace-nowrap"
                  >
                    -1 Liv.
                  </button>
                )}

                {activeLevel > 0 && (
                  <button
                    type="button"
                    onClick={() => onCloseHq(activeRegion.id)}
                    className="px-2 py-1.5 rounded-md bg-rose-950/40 hover:bg-rose-950/70 border border-rose-500/40 text-[11px] font-medium text-rose-300 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <XCircle className="w-3 h-3" />
                    Chiudi
                  </button>
                )}
              </div>
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

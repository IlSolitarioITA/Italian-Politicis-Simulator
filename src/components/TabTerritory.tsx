import React, { useMemo, useState } from 'react';
import {
  CHAPTER_TIERS,
  ITALIAN_REGIONS,
  REGION_MAP_BY_ID,
  getRegionChapterMetrics,
} from '../data/italyRegions';
import {
  BANCHETTO_SIGNATURE_COST,
  MAX_BANCHETTI_PER_WEEK,
  getNormalizedRegionalChapters,
} from '../engine/simulation';
import { ChapterLevel, GameState, MacroRegionId, RegionId } from '../types/game';
import { ItalyRegionsMap } from './ItalyRegionsMap';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  CheckCircle2,
  FileSignature,
  MapPin,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';

interface TabTerritoryProps {
  state: GameState;
  onOpenOrUpgradeChapter: (regionId: RegionId) => void;
  onDowngradeChapter: (regionId: RegionId) => void;
  onCloseChapter: (regionId: RegionId) => void;
  onOrganizeBanchetto?: (regionId: RegionId) => void;
}

type TerritoryFilter = 'tutte' | 'attive' | 'assenti' | MacroRegionId;

const MACRO_LABELS: Record<MacroRegionId, string> = {
  nord_ovest: 'Nord-Ovest',
  nord_est: 'Nord-Est',
  centro: 'Centro',
  sud: 'Sud',
  isole: 'Isole',
};

export const TabTerritory: React.FC<TabTerritoryProps> = ({
  state,
  onOpenOrUpgradeChapter,
  onDowngradeChapter,
  onCloseChapter,
  onOrganizeBanchetto,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<RegionId>('lombardia');
  const [filter, setFilter] = useState<TerritoryFilter>('tutte');

  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const chapters = useMemo(() => getNormalizedRegionalChapters(state), [state]);

  const totals = useMemo(() => {
    let activeRegions = 0;
    let level1Count = 0;
    let level2Count = 0;
    let level3Count = 0;
    let totalLocalMembers = 0;
    let weeklyNewMembers = 0;
    let weeklyUpkeep = 0;
    let weeklyIncome = 0;
    let totalBallotSigBonus = 0;
    let totalReferendumSigBonus = 0;

    for (const reg of ITALIAN_REGIONS) {
      const ch = chapters[reg.id];
      const level = (ch?.level ?? 0) as ChapterLevel;
      if (level > 0) {
        activeRegions += 1;
        if (level === 1) level1Count += 1;
        if (level === 2) level2Count += 1;
        if (level === 3) level3Count += 1;
        totalLocalMembers += ch?.localMembers ?? 0;
        const m = getRegionChapterMetrics(reg, level);
        weeklyNewMembers += m.weeklyNewMembers;
        weeklyUpkeep += m.weeklyUpkeep;
        weeklyIncome += m.weeklyMembershipIncome;
        totalBallotSigBonus += m.ballotSigBonus;
        totalReferendumSigBonus += m.referendumSigBonus;
      }
    }

    return {
      activeRegions,
      level1Count,
      level2Count,
      level3Count,
      totalLocalMembers,
      weeklyNewMembers,
      weeklyUpkeep,
      monthlyUpkeep: weeklyUpkeep * 4,
      weeklyIncome,
      weeklyNet: weeklyIncome - weeklyUpkeep,
      totalBallotSigBonus,
      totalReferendumSigBonus,
    };
  }, [chapters]);

  const activeRegion = REGION_MAP_BY_ID[selectedRegion] ?? ITALIAN_REGIONS[3];
  const activeChapter = chapters[activeRegion.id];
  const activeLevel = (activeChapter?.level ?? 0) as ChapterLevel;
  const activeMetrics = getRegionChapterMetrics(activeRegion, activeLevel);
  const nextMetrics = activeMetrics.nextLevel
    ? getRegionChapterMetrics(activeRegion, activeMetrics.nextLevel)
    : null;
  const canAffordNext = activeLevel < 3 && state.budget >= activeMetrics.openOrUpgradeCost;

  const activeRegionRanking = useMemo(() => {
    return [...state.parties]
      .filter((p) => p.id !== 'altri')
      .map((p) => ({
        party: p,
        val: p.regionPolls?.[activeRegion.id] ?? p.regions[activeRegion.macroRegion],
      }))
      .sort((a, b) => b.val - a.val);
  }, [state.parties, activeRegion]);

  const playerRegionRank =
    activeRegionRanking.findIndex((r) => r.party.id === state.playerPartyId) + 1;
  const playerRegionPoll =
    player.regionPolls?.[activeRegion.id] ?? player.regions[activeRegion.macroRegion];

  const filteredRegions = useMemo(() => {
    return ITALIAN_REGIONS.filter((reg) => {
      const lv = (chapters[reg.id]?.level ?? 0) as ChapterLevel;
      if (filter === 'tutte') return true;
      if (filter === 'attive') return lv > 0;
      if (filter === 'assenti') return lv === 0;
      return reg.macroRegion === filter;
    });
  }, [filter, chapters]);

  const showBanchettoAction =
    Boolean(onOrganizeBanchetto) &&
    Boolean(state.ballotSignatures) &&
    !state.ballotSignatures.exempt &&
    !state.ballotSignatures.excludedFromBallot &&
    state.ballotSignatures.collectedSignatures < state.ballotSignatures.targetSignatures;

  const canRunBanchetto =
    showBanchettoAction &&
    state.ballotSignatures.banchettiThisWeek < MAX_BANCHETTI_PER_WEEK &&
    state.budget >= BANCHETTO_SIGNATURE_COST;

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden war-scroll p-3 sm:p-4 lg:p-5 space-y-4">
      {/* Top KPI Strip (4 Operational Territory Metrics) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Sezioni &amp; Circoli Attivi</span>
            <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
          </div>
          <div className="font-mono text-xl font-bold tabular-nums text-slate-50">
            {totals.activeRegions}
            <span className="text-xs font-normal text-slate-400"> / 20 Regioni</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 tabular-nums">
            L1: {totals.level1Count} · L2: {totals.level2Count} · L3: {totals.level3Count}
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Iscritti nei Circoli</span>
            <Users className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="font-mono text-xl font-bold tabular-nums text-slate-50">
            {totals.totalLocalMembers.toLocaleString('it-IT')}
          </div>
          <div className="text-[11px] font-mono text-emerald-400 tabular-nums">
            +{totals.weeklyNewMembers.toLocaleString('it-IT')} nuovi tesserati/sett.
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Bilancio Rete Territoriale</span>
            <Wallet className="w-4 h-4 text-amber-400 shrink-0" />
          </div>
          <div
            className={`font-mono text-xl font-bold tabular-nums ${
              totals.weeklyNet >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {totals.weeklyNet >= 0 ? '+' : '-'}€
            {Math.abs(totals.weeklyNet).toLocaleString('it-IT')}
            <span className="text-xs font-normal text-slate-400">/sett.</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 tabular-nums">
            Mantenimento: €{totals.monthlyUpkeep.toLocaleString('it-IT')}/mese · Quote: +€
            {totals.weeklyIncome.toLocaleString('it-IT')}/s
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Velocità Raccolta Firme</span>
            <FileSignature className="w-4 h-4 text-cyan-400 shrink-0" />
          </div>
          <div className="font-mono text-xl font-bold tabular-nums text-cyan-300">
            +{totals.totalBallotSigBonus.toLocaleString('it-IT')}
            <span className="text-xs font-normal text-slate-400"> liste/sett.</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 tabular-nums">
            Referendum: +{totals.totalReferendumSigBonus.toLocaleString('it-IT')} firme/sett.
          </div>
        </div>
      </section>

      {/* Main 12-Col Workspace: High-Def ISTAT Map (left) + Selected Region Management (right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left (6 cols): Interactive ISTAT High-Def Map */}
        <section className="xl:col-span-6 bg-[#111827] border border-slate-800/90 rounded-xl p-4 min-w-0">
          <ItalyRegionsMap
            parties={state.parties}
            playerPartyId={state.playerPartyId}
            budget={state.budget}
            openHeadquarters={state.openHeadquarters}
            regionalChapters={chapters}
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
            onOpenHq={onOpenOrUpgradeChapter}
            onCloseHq={onCloseChapter}
            onDowngradeChapter={onDowngradeChapter}
            defaultColorMode="presenza"
            mapOnly
          />
        </section>

        {/* Right (6 cols): Selected Region Strategic Chapter Dossier */}
        <section className="xl:col-span-6 bg-[#111827] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between gap-4 min-w-0">
          <div className="space-y-3.5">
            {/* Selected Region Header */}
            <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-base font-bold text-slate-50">
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{activeRegion.name}</span>
                  <span className="text-xs font-normal text-slate-400">
                    · {activeRegion.capital} ({MACRO_LABELS[activeRegion.macroRegion]})
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono tabular-nums">
                  <span>
                    {player.acronym}:{' '}
                    <strong className="text-cyan-300">{playerRegionPoll.toFixed(1)}%</strong> (#
                    {playerRegionRank})
                  </span>
                  <span>
                    Seggi: {activeRegion.cameraSeats} Cam. / {activeRegion.senatoSeats} Sen.
                  </span>
                  <span>
                    Iscritti locali:{' '}
                    <strong className="text-slate-100">
                      {(activeChapter?.localMembers ?? 0).toLocaleString('it-IT')}
                    </strong>
                  </span>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-semibold shrink-0 ${
                  activeLevel === 3
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                    : activeLevel > 0
                      ? 'bg-cyan-500/15 border-cyan-500/45 text-cyan-200'
                      : 'bg-[#090D16] border-slate-800 text-slate-400'
                }`}
              >
                {activeMetrics.tier.shortLabel}
              </span>
            </div>

            {/* 3-Tier Progression Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {([1, 2, 3] as const).map((tierLevel) => {
                const m = getRegionChapterMetrics(activeRegion, tierLevel);
                const isReached = activeLevel >= tierLevel;
                const isCurrent = activeLevel === tierLevel;
                const isNext = activeLevel + 1 === tierLevel;
                const stepCost = getRegionChapterMetrics(
                  activeRegion,
                  (tierLevel - 1) as ChapterLevel
                ).openOrUpgradeCost;

                return (
                  <div
                    key={tierLevel}
                    className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                      isCurrent
                        ? 'bg-cyan-500/12 border-cyan-400/75'
                        : isReached
                          ? 'bg-emerald-950/20 border-emerald-500/35'
                          : isNext
                            ? 'bg-[#090D16] border-amber-500/45'
                            : 'bg-[#090D16]/60 border-slate-800/80 opacity-75'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 text-[11px] font-mono">
                        <span
                          className={
                            isReached
                              ? 'text-emerald-400 font-semibold'
                              : isNext
                                ? 'text-amber-400 font-semibold'
                                : 'text-slate-500'
                          }
                        >
                          Livello {tierLevel}
                        </span>
                        {isReached && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <div className="text-xs font-bold text-slate-100 mt-0.5 leading-snug">
                        {CHAPTER_TIERS[tierLevel].label}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {CHAPTER_TIERS[tierLevel].description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 space-y-0.5 text-[11px] font-mono tabular-nums">
                      <div className="flex justify-between text-slate-300">
                        <span>Radicamento:</span>
                        <span className="text-emerald-400">
                          +{m.weeklyConsensusBoost.toFixed(2)}%/s
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Iscritti:</span>
                        <span className="text-cyan-300">+{m.weeklyNewMembers}/s</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Firme liste:</span>
                        <span className="text-cyan-300">
                          +{m.ballotSigBonus.toLocaleString('it-IT')}/s
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Manten./mese:</span>
                        <span className="text-rose-300">
                          €{m.monthlyUpkeep.toLocaleString('it-IT')}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Quote/sett.:</span>
                        <span className="text-emerald-300">
                          +€{m.weeklyMembershipIncome.toLocaleString('it-IT')}
                        </span>
                      </div>
                      {!isReached && (
                        <div className="flex justify-between text-amber-300 pt-0.5">
                          <span>Costo apertura:</span>
                          <span>€{stepCost.toLocaleString('it-IT')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons Row */}
            <div className="p-3 rounded-xl bg-[#090D16] border border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
              <div className="text-xs text-slate-300 min-w-0">
                {activeLevel < 3 && nextMetrics ? (
                  <span>
                    Prossimo salto:{' '}
                    <strong className="text-slate-100">{nextMetrics.tier.label}</strong> (
                    <span className="font-mono text-amber-300">
                      €{activeMetrics.openOrUpgradeCost.toLocaleString('it-IT')}
                    </span>
                    )
                  </span>
                ) : (
                  <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 shrink-0" />
                    Federazione Regionale al massimo potenziale organizzativo.
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {activeLevel < 3 && (
                  <button
                    type="button"
                    disabled={!canAffordNext}
                    onClick={() => onOpenOrUpgradeChapter(activeRegion.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      canAffordNext
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <ArrowUpCircle className="w-4 h-4 shrink-0" />
                    <span>
                      {activeLevel === 0
                        ? `Apri Circolo (€${activeMetrics.openOrUpgradeCost.toLocaleString('it-IT')})`
                        : `Potenzia Liv. ${activeLevel + 1} (€${activeMetrics.openOrUpgradeCost.toLocaleString('it-IT')})`}
                    </span>
                  </button>
                )}

                {showBanchettoAction && (
                  <button
                    type="button"
                    disabled={!canRunBanchetto}
                    onClick={() => onOrganizeBanchetto?.(activeRegion.id)}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      canRunBanchetto
                        ? 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/45 text-cyan-200 cursor-pointer'
                        : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <FileSignature className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Banchetto Firme (€{BANCHETTO_SIGNATURE_COST.toLocaleString('it-IT')} ·{' '}
                      {state.ballotSignatures.banchettiThisWeek}/{MAX_BANCHETTI_PER_WEEK})
                    </span>
                  </button>
                )}

                {activeLevel > 1 && (
                  <button
                    type="button"
                    onClick={() => onDowngradeChapter(activeRegion.id)}
                    className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowDownCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Ridimensiona</span>
                  </button>
                )}

                {activeLevel > 0 && (
                  <button
                    type="button"
                    onClick={() => onCloseChapter(activeRegion.id)}
                    className="px-2.5 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-950/70 border border-rose-500/40 text-xs font-medium text-rose-300 flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Chiudi</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Selected Region Top 6 Poll Snapshot */}
          <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">
                Rapporti di Forza in {activeRegion.name}
              </span>
              <span className="text-[11px] text-slate-400">
                Radicamento attivo: +{activeMetrics.weeklyConsensusBoost.toFixed(2)}%/sett.
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
              {activeRegionRanking.slice(0, 6).map(({ party, val }) => {
                const isPlayer = party.id === state.playerPartyId;
                return (
                  <div key={party.id} className="space-y-0.5">
                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <span
                        className={`whitespace-normal leading-snug break-words ${
                          isPlayer ? 'text-cyan-300 font-semibold' : 'text-slate-300'
                        }`}
                      >
                        {party.acronym} · {party.name}
                      </span>
                      <span className="font-mono tabular-nums text-slate-100 shrink-0">
                        {val.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#090D16] rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${Math.min(100, val * 2.2)}%`,
                          backgroundColor: party.color,
                        }}
                        className="h-full rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Full-Width 20-Region Chapters Registry */}
      <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Registro Nazionale delle 20 Regioni · Sezioni, Costi e Raccolta Firme
            </h3>
            <p className="text-[11px] text-slate-400">
              Apri o potenzia i circoli regionali per generare tesserati, consolidare i sondaggi locali ed evitare l’attrito territoriale.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-0.5 bg-[#090D16] border border-slate-800 rounded-lg">
            {(
              [
                { id: 'tutte', label: 'Tutte (20)' },
                { id: 'attive', label: `Attive (${totals.activeRegions})` },
                { id: 'assenti', label: `Scoperte (${20 - totals.activeRegions})` },
                { id: 'nord_ovest', label: 'Nord-Ovest' },
                { id: 'nord_est', label: 'Nord-Est' },
                { id: 'centro', label: 'Centro' },
                { id: 'sud', label: 'Sud' },
                { id: 'isole', label: 'Isole' },
              ] as { id: TerritoryFilter; label: string }[]
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                  filter === f.id
                    ? 'bg-slate-800 text-slate-50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto war-scroll">
          <table className="w-full text-xs border-collapse min-w-[740px]">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                <th className="text-left font-medium py-2 pr-3">Regione</th>
                <th className="text-right font-medium py-2 px-2">Consenso</th>
                <th className="text-left font-medium py-2 px-2">Presidio</th>
                <th className="text-right font-medium py-2 px-2">Iscritti</th>
                <th className="text-right font-medium py-2 px-2">Radicamento</th>
                <th className="text-right font-medium py-2 px-2">Manten./Mese</th>
                <th className="text-right font-medium py-2 px-2">Firme/Sett.</th>
                <th className="text-right font-medium py-2 pl-2">Azione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRegions.map((reg) => {
                const ch = chapters[reg.id];
                const lv = (ch?.level ?? 0) as ChapterLevel;
                const m = getRegionChapterMetrics(reg, lv);
                const regPoll = player.regionPolls?.[reg.id] ?? player.regions[reg.macroRegion];
                const isSelected = reg.id === selectedRegion;
                const affordable = lv < 3 && state.budget >= m.openOrUpgradeCost;

                return (
                  <tr
                    key={reg.id}
                    onClick={() => setSelectedRegion(reg.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-cyan-500/10' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="py-2 pr-3">
                      <div className="font-semibold text-slate-100">{reg.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {reg.capital} · {MACRO_LABELS[reg.macroRegion]}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums text-cyan-300 font-semibold">
                      {regPoll.toFixed(1)}%
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className={`text-[11px] font-mono ${
                          lv === 3
                            ? 'text-amber-300 font-semibold'
                            : lv > 0
                              ? 'text-cyan-300 font-medium'
                              : 'text-slate-500'
                        }`}
                      >
                        {CHAPTER_TIERS[lv].shortLabel}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-200">
                      {(ch?.localMembers ?? 0).toLocaleString('it-IT')}
                    </td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums text-emerald-400">
                      {lv > 0 ? `+${m.weeklyConsensusBoost.toFixed(2)}%` : '—'}
                    </td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-300">
                      {lv > 0 ? `€${m.monthlyUpkeep.toLocaleString('it-IT')}` : '—'}
                    </td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-300">
                      {lv > 0 ? `+${m.ballotSigBonus.toLocaleString('it-IT')}` : '—'}
                    </td>
                    <td
                      className="py-2 pl-2 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {lv < 3 ? (
                        <button
                          type="button"
                          disabled={!affordable}
                          onClick={() => {
                            setSelectedRegion(reg.id);
                            onOpenOrUpgradeChapter(reg.id);
                          }}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap ${
                            affordable
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {lv === 0 ? 'Apri' : `Liv. ${lv + 1}`} · €
                          {m.openOrUpgradeCost.toLocaleString('it-IT')}
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-emerald-400">
                          Liv. Max
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

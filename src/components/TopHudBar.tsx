import React from 'react';
import { GameState } from '../types/game';
import { formatGameDate } from '../data/presets';
import { getNextEuropeanElectionWeek } from '../data/european';
import {
  calculateWeeklyPartyFinances,
  getBudgetHealthStatus,
  getPendingCrisesCount,
} from '../engine/simulation';
import { PartyEmblem } from './PartyEmblem';
import {
  AlertCircle,
  AlertTriangle,
  FastForward,
  LayoutGrid,
  Save,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface TopHudBarProps {
  state: GameState;
  activeSlot: 1 | 2 | 3;
  audioMuted: boolean;
  onToggleAudio: () => void;
  onAdvanceWeek: () => void;
  onOpenMenu: () => void;
  onOpenSaveModal: () => void;
  onOpenCrisesTab?: () => void;
  onOpenFinancesTab?: () => void;
}

export const TopHudBar: React.FC<TopHudBarProps> = ({
  state,
  activeSlot,
  audioMuted,
  onToggleAudio,
  onAdvanceWeek,
  onOpenMenu,
  onOpenSaveModal,
  onOpenCrisesTab,
  onOpenFinancesTab,
}) => {
  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const dateInfo = formatGameDate(state.week);
  const delta = Math.round((player.nationalPoll - player.previousPoll) * 10) / 10;
  const weeksToElection = Math.max(0, state.electionWeek - state.week);
  const pendingCrisesCount = getPendingCrisesCount(state);
  const finances = calculateWeeklyPartyFinances(state);
  const budgetHealth = getBudgetHealthStatus(state);
  const netSign = finances.netBalance >= 0 ? '+' : '-';
  const absNet = Math.abs(finances.netBalance);
  const compactNet =
    absNet >= 1000 ? `${netSign}€${(absNet / 1000).toFixed(1)}k` : `${netSign}€${absNet}`;
  const euElectionWeek =
    state.european?.nextElectionWeek ??
    state.europeanElectionWeek ??
    getNextEuropeanElectionWeek(state.week);
  const weeksToEu = Math.max(0, euElectionWeek - state.week);
  const euElectionActive = Boolean(
    state.european?.activeElection && !state.european.activeElection.postElectionResolved
  );
  const euPostFlowActive = Boolean(state.european?.postElectionFlow?.active);
  const electionBlocking =
    Boolean(state.election && !state.election.postElectionResolved) ||
    euElectionActive ||
    euPostFlowActive;
  const advanceDisabled = electionBlocking || pendingCrisesCount > 0;

  return (
    <header className="bg-[#0D1322] border-b border-slate-800/90 shrink-0 w-full overflow-x-hidden">
      {/* Desktop War Room HUD (lg+) */}
      <div className="hidden lg:flex min-h-16 py-2 px-4 xl:px-6 flex-wrap xl:flex-nowrap items-center justify-between gap-x-4 gap-y-2">
        {/* Zone 1: Party Identity & Date */}
        <div className="flex items-center gap-3 min-w-[220px] flex-1">
          <PartyEmblem
            emblem={player.emblem}
            color={player.color}
            customUrl={player.customEmblemUrl}
            size={36}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 leading-snug">
              <span className="font-display font-bold text-sm xl:text-base text-slate-50 whitespace-normal break-words">
                {player.name}
              </span>
              <span className="text-xs font-mono text-slate-400 shrink-0">({player.acronym})</span>
            </div>
            <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 leading-snug">
              <span className="font-mono tabular-nums text-cyan-400">{dateInfo.fullLabel}</span>
              {!state.election && !euElectionActive && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    {state.committee.active
                      ? `Comitato: ${state.committee.weeksRemaining} sett.`
                      : `Politiche -${weeksToElection}s`}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums text-indigo-300/90">
                    Europee -{weeksToEu}s
                  </span>
                </>
              )}
              {euElectionActive && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-indigo-300 font-semibold">Diretta Europee</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Zone 2: Live War Room Metrics */}
        <div className="flex items-center divide-x divide-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => onOpenFinancesTab?.()}
            title={`${budgetHealth.headline} — ${budgetHealth.guidance}`}
            className={`px-3 xl:px-4 text-right transition-colors cursor-pointer rounded-l-md ${
              budgetHealth.level === 'deficit'
                ? 'bg-rose-950/35 hover:bg-rose-950/55'
                : budgetHealth.level === 'low'
                  ? 'bg-amber-950/25 hover:bg-amber-950/40'
                  : 'hover:bg-slate-800/40'
            }`}
          >
            <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1">
              {budgetHealth.level !== 'ok' && (
                <AlertTriangle
                  className={`w-3 h-3 shrink-0 ${
                    budgetHealth.level === 'deficit' ? 'text-rose-400' : 'text-amber-400'
                  }`}
                />
              )}
              <span>
                {budgetHealth.level === 'deficit'
                  ? 'Deficit Cassa'
                  : budgetHealth.level === 'low'
                    ? 'Cassa Bassa'
                    : 'Cassa Partito'}
              </span>
            </div>
            <div
              className={`font-mono text-sm font-semibold tabular-nums ${
                budgetHealth.level === 'deficit'
                  ? 'text-rose-400'
                  : budgetHealth.level === 'low'
                    ? 'text-amber-300'
                    : 'text-amber-400'
              }`}
            >
              {state.budget < 0 ? '-' : ''}€{Math.abs(state.budget).toLocaleString('it-IT')}
            </div>
          </button>

          <div className="px-3 xl:px-4 text-right">
            <div className="text-[11px] text-slate-400">Consenso</div>
            <div className="flex items-baseline justify-end gap-1.5 font-mono tabular-nums">
              <span className="text-sm font-bold text-slate-50">
                {player.nationalPoll.toFixed(1)}%
              </span>
              <span
                className={`text-xs font-medium ${
                  delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-rose-400' : 'text-slate-500'
                }`}
              >
                {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
              </span>
            </div>
          </div>

          <div
            className="px-3 xl:px-4 text-right"
            title={`Entrate settimanali: +€${finances.totalIncome.toLocaleString('it-IT')} · Uscite: -€${finances.totalExpenses.toLocaleString('it-IT')}`}
          >
            <div className="text-[11px] text-slate-400">Bilancio / sett.</div>
            <div
              className={`font-mono text-sm font-semibold tabular-nums ${
                finances.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {netSign}€{absNet.toLocaleString('it-IT')}
            </div>
          </div>
        </div>

        {/* Zone 3: Audio, Menu / Switch Session, Save & Advance Week */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleAudio}
            aria-label={audioMuted ? 'Attiva Audio Diretta TV' : 'Silenzia Audio Diretta TV'}
            aria-pressed={!audioMuted}
            title={audioMuted ? 'Audio: Muto (clicca per attivare)' : 'Audio: ON (clicca per silenziare)'}
            className={`px-2 py-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer ${
              audioMuted
                ? 'bg-[#111827] hover:bg-slate-800 border-slate-700/80 text-slate-400'
                : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/45 text-cyan-200'
            }`}
          >
            {audioMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            )}
            <span className="hidden 2xl:inline">{audioMuted ? 'Muto' : 'Audio'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenMenu}
            title={`Torna a Le Mie Partite (Slot attivo: ${activeSlot})`}
            className="px-2.5 py-2 rounded-lg bg-[#111827] hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="hidden 2xl:inline">Menu / Partite</span>
            <span className="2xl:hidden">Menu</span>
          </button>

          <button
            type="button"
            onClick={onOpenSaveModal}
            className="px-2.5 py-2 rounded-lg bg-[#111827] hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>S{activeSlot}</span>
          </button>

          {pendingCrisesCount > 0 && !electionBlocking && (
            <button
              type="button"
              onClick={onOpenCrisesTab}
              title="Rispondi o salta gli eventi settimanali in Dossier & Crisi prima di avanzare"
              className="px-2.5 py-2 rounded-lg bg-amber-500/12 hover:bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{pendingCrisesCount} Dossier</span>
            </button>
          )}

          <button
            type="button"
            disabled={advanceDisabled}
            onClick={onAdvanceWeek}
            title={
              pendingCrisesCount > 0
                ? `Gestisci o salta i ${pendingCrisesCount} eventi settimanali in Crisi & Media prima di avanzare`
                : 'Avanza alla prossima settimana'
            }
            className={`px-3 py-2 rounded-lg font-display font-bold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              advanceDisabled
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer'
            }`}
          >
            <span className="hidden xl:inline">Avanza Settimana</span>
            <span className="xl:hidden">Avanza</span>
            {pendingCrisesCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-rose-500/25 text-rose-300 font-mono text-[10px]">
                {pendingCrisesCount}
              </span>
            )}
            <FastForward className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Compact 2-Row HUD (< lg) — Zero premature truncation */}
      <div className="lg:hidden px-3 py-2.5 space-y-2">
        {/* Row 1: Party + Date + Advance Week CTA */}
        <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-[180px] flex-1">
            <PartyEmblem
              emblem={player.emblem}
              color={player.color}
              customUrl={player.customEmblemUrl}
              size={30}
            />
            <div className="min-w-0">
              <div className="font-display font-bold text-xs sm:text-sm text-slate-50 whitespace-normal leading-snug break-words">
                {player.name}{' '}
                <span className="font-mono font-normal text-slate-400">({player.acronym})</span>
              </div>
              <div className="text-[11px] font-mono tabular-nums text-cyan-400 whitespace-normal leading-snug">
                {dateInfo.shortLabel}
                {!state.election && !euElectionActive && (
                  <span className="text-slate-400">
                    {' '}
                    · {state.committee.active ? `Com. ${state.committee.weeksRemaining}s` : `Pol. -${weeksToElection}s`}
                    <span className="text-indigo-300/90"> · UE -{weeksToEu}s</span>
                  </span>
                )}
                {euElectionActive && (
                  <span className="text-indigo-300 font-semibold"> · Diretta UE</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <button
              type="button"
              onClick={onToggleAudio}
              aria-label={audioMuted ? 'Attiva Audio' : 'Silenzia Audio'}
              aria-pressed={!audioMuted}
              className={`p-1.5 rounded-lg border transition-colors shrink-0 cursor-pointer ${
                audioMuted
                  ? 'bg-[#111827] border-slate-700/80 text-slate-400'
                  : 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
              }`}
            >
              {audioMuted ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>

            {pendingCrisesCount > 0 && !electionBlocking && (
              <button
                type="button"
                onClick={onOpenCrisesTab}
                title="Eventi settimanali senza risposta"
                className="px-2 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/50 text-amber-300 text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                <span>{pendingCrisesCount} Dossier</span>
              </button>
            )}

            <button
              type="button"
              disabled={advanceDisabled}
              onClick={onAdvanceWeek}
              title={
                pendingCrisesCount > 0
                  ? `Rispondi o salta i ${pendingCrisesCount} eventi in Crisi & Media`
                  : 'Avanza Settimana'
              }
              className={`px-2.5 py-1.5 rounded-lg font-display font-bold text-[11px] sm:text-xs transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                advanceDisabled
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer'
              }`}
            >
              <span>Avanza</span>
              {pendingCrisesCount > 0 && (
                <span className="px-1 py-0.2 rounded bg-rose-500/25 text-rose-300 font-mono text-[10px]">
                  {pendingCrisesCount}
                </span>
              )}
              <FastForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2: Cassa, Consenso, PA, Menu & Salva */}
        <div className="grid grid-cols-12 gap-1.5 pt-1.5 border-t border-slate-800/80 items-center">
          <button
            type="button"
            onClick={() => onOpenFinancesTab?.()}
            title={`${budgetHealth.headline} — ${budgetHealth.guidance}`}
            className="col-span-3 min-w-0 text-left cursor-pointer"
          >
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              {budgetHealth.level !== 'ok' && (
                <AlertTriangle
                  className={`w-2.5 h-2.5 shrink-0 ${
                    budgetHealth.level === 'deficit' ? 'text-rose-400' : 'text-amber-400'
                  }`}
                />
              )}
              <span className="truncate">
                {budgetHealth.level === 'deficit'
                  ? 'Deficit'
                  : budgetHealth.level === 'low'
                    ? 'Cassa!'
                    : 'Cassa'}
              </span>
            </div>
            <div
              className={`font-mono text-[11px] sm:text-xs font-semibold tabular-nums leading-tight break-words ${
                budgetHealth.level === 'deficit'
                  ? 'text-rose-400'
                  : budgetHealth.level === 'low'
                    ? 'text-amber-300'
                    : 'text-amber-400'
              }`}
            >
              {state.budget < 0 ? '-' : ''}€{Math.abs(state.budget).toLocaleString('it-IT')}
            </div>
          </button>

          <div className="col-span-3 min-w-0">
            <div className="text-[10px] text-slate-400">Consenso</div>
            <div className="font-mono text-[11px] sm:text-xs font-bold tabular-nums text-slate-50 leading-tight flex flex-wrap items-baseline gap-x-1">
              <span>{player.nationalPoll.toFixed(1)}%</span>
              <span
                className={`text-[10px] font-medium ${
                  delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-rose-400' : 'text-slate-500'
                }`}
              >
                {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="col-span-2 min-w-0">
            <div className="text-[10px] text-slate-400">Bil./s</div>
            <div
              className={`font-mono text-[11px] sm:text-xs font-semibold tabular-nums ${
                finances.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {compactNet}
            </div>
          </div>

          <div className="col-span-4 flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={onOpenMenu}
              className="px-2 py-1.5 rounded-md bg-[#111827] hover:bg-slate-800 border border-slate-700/80 text-[11px] font-medium text-slate-200 flex items-center gap-1 whitespace-nowrap cursor-pointer"
              aria-label="Menu e Cambia Partita"
            >
              <LayoutGrid className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>Menu</span>
            </button>
            <button
              type="button"
              onClick={onOpenSaveModal}
              className="px-2 py-1.5 rounded-md bg-[#111827] hover:bg-slate-800 border border-slate-700/80 text-[11px] font-medium text-slate-200 flex items-center gap-1 whitespace-nowrap cursor-pointer"
              aria-label="Salva o Esporta JSON"
            >
              <Save className="w-3 h-3 text-amber-400 shrink-0" />
              <span>S{activeSlot}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

import React, { useMemo, useState } from 'react';
import {
  calculateParliamentSeats,
  getCurrentParliamentSeats,
  getPlayerParliamentSeats,
  syncBallotSignatureExemption,
} from '../engine/simulation';
import { GameState, MinistryId } from '../types/game';
import { playTactileClick } from '../utils/soundEngine';
import { ElectionNightView } from './ElectionNightView';
import { HemicycleSvg } from './HemicycleSvg';
import {
  AlertTriangle,
  FileSignature,
  Flame,
  Lock,
} from 'lucide-react';

interface TabElectionsProps {
  state: GameState;
  onTriggerEarlyElection: () => void;
  onAdvanceElectionStage: (finalJump?: boolean) => void;
  onCompletePostElection: () => void;
  onFormGovernment: (
    assignments: Partial<Record<MinistryId, string>>,
    execAssignments?: Partial<Record<MinistryId, string>>
  ) => void;
  onDeclineMandate: () => void;
  onDissolveParty: () => void;
  onStartFreshGame: () => void;
}

export const TabElections: React.FC<TabElectionsProps> = ({
  state,
  onTriggerEarlyElection,
  onAdvanceElectionStage,
  onCompletePostElection,
  onFormGovernment,
  onDeclineMandate,
  onDissolveParty,
  onStartFreshGame,
}) => {
  const [hemicycleView, setHemicycleView] = useState<'current' | 'projection'>('current');

  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const projectedSeats = useMemo(
    () => calculateParliamentSeats(state.parties, state.electoralLaw),
    [state.parties, state.electoralLaw]
  );
  const currentParliamentSeats = useMemo(() => {
    const seats = getCurrentParliamentSeats(state);
    if (!state.extraParliamentary) return seats;
    return seats.map((s) =>
      s.partyId === state.playerPartyId ? { ...s, camera: 0, senato: 0 } : s
    );
  }, [state]);
  const playerParliamentSeats = useMemo(
    () => getPlayerParliamentSeats(state),
    [state]
  );
  const isPlayerExtraParliamentary = Boolean(
    state.extraParliamentary ||
      playerParliamentSeats.isExtraParliamentary ||
      playerParliamentSeats.total === 0
  );

  const coalitionMembers = state.parties.filter(
    (p) =>
      p.id !== 'altri' &&
      (p.id === player.id ||
        (Boolean(player.coalitionId) && p.coalitionId === player.coalitionId))
  );
  const hasAllies = coalitionMembers.some((m) => m.id !== player.id);
  const playerBlocLabel = hasAllies ? state.coalitionName : player.name;

  // PRE-ELECTION VIEW
  if (!state.election) {
    const weeksRemaining = Math.max(0, state.electionWeek - state.week);
    const coalCamera = coalitionMembers.reduce(
      (acc, m) => acc + (projectedSeats.find((s) => s.partyId === m.id)?.camera ?? 0),
      0
    );
    const coalSenato = coalitionMembers.reduce(
      (acc, m) => acc + (projectedSeats.find((s) => s.partyId === m.id)?.senato ?? 0),
      0
    );
    const coalPoll = coalitionMembers.reduce((acc, m) => acc + m.nationalPoll, 0);

    return (
      <div className="h-full overflow-y-auto overflow-x-hidden war-scroll p-3 sm:p-4 lg:p-5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-4">
          <section className="xl:col-span-7 bg-[#111827] border border-slate-800/90 rounded-xl p-4 sm:p-5 space-y-5 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <p className="text-xs font-medium text-cyan-400">
                  Sala Controllo Elettorale
                </p>
                <h2 className="text-2xl font-bold text-slate-50 mt-1">
                  Verso le Elezioni Politiche
                </h2>
              </div>
              <div className="text-right font-mono tabular-nums">
                <div className="text-xs text-slate-400">Scadenza elettorale</div>
                <div className="text-xl font-bold text-amber-400">
                  {weeksRemaining} {weeksRemaining === 1 ? 'settimana' : 'settimane'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-lg bg-[#090D16] border border-slate-800">
                <div className="text-xs text-slate-400">Consenso {playerBlocLabel}</div>
                <div className="font-mono text-xl font-bold tabular-nums text-cyan-300 mt-1">
                  {coalPoll.toFixed(1)}%
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#090D16] border border-slate-800">
                <div className="text-xs text-slate-400">Proiezione Camera</div>
                <div
                  className={`font-mono text-xl font-bold tabular-nums mt-1 ${
                    coalCamera >= 201 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {coalCamera} <span className="text-xs text-slate-500">/ 201</span>
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#090D16] border border-slate-800">
                <div className="text-xs text-slate-400">Proiezione Senato</div>
                <div
                  className={`font-mono text-xl font-bold tabular-nums mt-1 ${
                    coalSenato >= 101 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {coalSenato} <span className="text-xs text-slate-500">/ 101</span>
                </div>
              </div>
            </div>

            {/* Stato Raccolta Firme Liste per Partiti Extra-Parlamentari */}
            {(() => {
              const ballot = syncBallotSignatureExemption(state);
              if (ballot.exempt) return null;
              const pct = Math.min(
                100,
                Math.round(
                  (ballot.collectedSignatures / Math.max(1, ballot.targetSignatures)) * 100
                )
              );
              const ready = pct >= 100 && !ballot.excludedFromBallot;
              return (
                <div
                  className={`p-3.5 rounded-xl border space-y-2 ${
                    ballot.excludedFromBallot
                      ? 'bg-rose-950/30 border-rose-500/50'
                      : ready
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : 'bg-amber-950/20 border-amber-500/45'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                      {ballot.excludedFromBallot ? (
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : (
                        <FileSignature className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span>
                        Ammissione Lista ({ballot.electionType}) · Chiusura Sett.{' '}
                        {ballot.deadlineWeek}
                      </span>
                    </span>
                    <span className="font-mono font-bold tabular-nums text-slate-100">
                      {ballot.collectedSignatures.toLocaleString('it-IT')} /{' '}
                      {ballot.targetSignatures.toLocaleString('it-IT')} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#090D16] border border-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${
                        ballot.excludedFromBallot
                          ? 'bg-rose-500'
                          : ready
                            ? 'bg-emerald-400'
                            : 'bg-amber-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {ballot.excludedFromBallot
                      ? 'Lista esclusa dalla scheda: firme insufficienti entro la chiusura. Apparentati con un partito in Parlamento nella scheda Partito per rientrare.'
                      : ready
                        ? 'Soglia firme completata al 100%: il tuo simbolo sarà presente sulle schede elettorali.'
                        : 'Attenzione: se apri le urne o arrivi alla chiusura liste sotto il 100% senza apparentamento, la tua lista verrà esclusa dal voto. Organizza banchetti nella scheda Partito.'}
                  </p>
                </div>
              );
            })()}

            <div
              className={`p-4 rounded-xl bg-[#090D16] border space-y-3 ${
                isPlayerExtraParliamentary
                  ? 'border-slate-800'
                  : 'border-rose-500/35'
              }`}
            >
              <div className="flex items-start gap-3">
                {isPlayerExtraParliamentary ? (
                  <Lock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                ) : (
                  <Flame className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    Mozione di Sfiducia e Scioglimento Anticipato
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {isPlayerExtraParliamentary
                      ? 'Solo i partiti con rappresentanza parlamentare possono presentare o votare una mozione di sfiducia in Aula. Con 0 seggi in Camera e Senato dovrai attendere la scadenza elettorale.'
                      : 'Se ritieni di avere già il picco nei sondaggi e i numeri pronti per superare quota 201 deputati e 101 senatori, puoi forzare la crisi parlamentare e aprire immediatamente la Notte Elettorale.'}
                  </p>
                </div>
              </div>
              {isPlayerExtraParliamentary ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    Riservato ai partiti presenti in Parlamento (seggi attuali: 0).
                  </span>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={onTriggerEarlyElection}
                    className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-display font-bold text-xs transition-colors cursor-pointer"
                  >
                    Vota la Sfiducia · Apri Subito le Urne
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="xl:col-span-5 bg-[#111827] border border-slate-800/90 rounded-xl p-4 sm:p-5 flex flex-col gap-3 min-w-0">
            <div
              role="tablist"
              aria-label="Modalità visualizzazione emiciclo"
              className="grid grid-cols-2 gap-1 p-1 bg-[#090D16] border border-slate-800 rounded-lg"
            >
              <button
                type="button"
                role="tab"
                aria-selected={hemicycleView === 'current'}
                onClick={() => {
                  playTactileClick();
                  setHemicycleView('current');
                }}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold leading-tight text-center transition-colors cursor-pointer ${
                  hemicycleView === 'current'
                    ? 'bg-slate-800 text-slate-50 border border-slate-700/80'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                Parlamento Attuale (in carica)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={hemicycleView === 'projection'}
                onClick={() => {
                  playTactileClick();
                  setHemicycleView('projection');
                }}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold leading-tight text-center transition-colors cursor-pointer ${
                  hemicycleView === 'projection'
                    ? 'bg-amber-500/15 text-amber-200 border border-amber-500/45'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                Proiezione Sondaggi (se si votasse oggi)
              </button>
            </div>

            <div className="flex-1 min-h-0">
              <HemicycleSvg
                parties={state.parties}
                seats={
                  hemicycleView === 'current' ? currentParliamentSeats : projectedSeats
                }
                playerPartyId={state.playerPartyId}
                isProjection={hemicycleView === 'projection'}
                title={
                  hemicycleView === 'projection'
                    ? 'Proiezione Emiciclo (se si votasse oggi)'
                    : 'Parlamento Attuale (in carica)'
                }
                subtitle={
                  hemicycleView === 'projection'
                    ? 'Stima basata sui sondaggi attuali; i seggi reali cambiano solo dopo il voto'
                    : 'Seggi reali attualmente detenuti nella Legislatura in carica'
                }
              />
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ELECTION NIGHT LIVE VIEW (3-Phase Immersive Broadcast)
  return (
    <ElectionNightView
      state={state}
      onAdvanceElectionStage={onAdvanceElectionStage}
      onCompletePostElection={onCompletePostElection}
      onFormGovernment={onFormGovernment}
      onDeclineMandate={onDeclineMandate}
      onDissolveParty={onDissolveParty}
      onStartFreshGame={onStartFreshGame}
    />
  );
};

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MACRO_REGIONS } from '../data/presets';
import { calculateParliamentSeats } from '../engine/simulation';
import { GameState, MinistryId } from '../types/game';
import {
  playBreakingNewsJingle,
  playElectionNightTheme,
  playTactileClick,
} from '../utils/soundEngine';
import { HemicycleSvg } from './HemicycleSvg';
import { PartyEmblem } from './PartyEmblem';
import { QuirinaleConsultationsView } from './QuirinaleConsultationsView';
import {
  Award,
  CheckCircle2,
  FastForward,
  Flame,
  Landmark,
  Radio,
  RotateCcw,
  SkipForward,
} from 'lucide-react';

interface TabElectionsProps {
  state: GameState;
  onTriggerEarlyElection: () => void;
  onAdvanceElectionStage: (finalJump?: boolean) => void;
  onCompletePostElection: () => void;
  onFormGovernment: (assignments: Partial<Record<MinistryId, string>>) => void;
  onDeclineMandate: () => void;
  onDissolveParty: () => void;
  onStartFreshGame: () => void;
}

interface MarathonPhaseMeta {
  index: 0 | 1 | 2;
  timeLabel: string;
  title: string;
  subtitle: string;
  stageValue: 0 | 1 | 3;
}

const MARATHON_PHASES: MarathonPhaseMeta[] = [
  {
    index: 0,
    timeLabel: 'Ore 23:00',
    title: 'Ore 23:00 — Exit Poll',
    subtitle: 'Urne appena chiuse: prime intenzioni rilevate fuori dai seggi (margine ±2%).',
    stageValue: 0,
  },
  {
    index: 1,
    timeLabel: 'Ore 00:30',
    title: 'Ore 00:30 — Prime Proiezioni',
    subtitle: 'Copertura campionaria al 28% delle sezioni reali: trend consolidato.',
    stageValue: 1,
  },
  {
    index: 2,
    timeLabel: 'Definitivo',
    title: 'Risultato Definitivo & Seggi',
    subtitle: 'Scrutinio completato al 100% · Ripartizione ufficiale Camera (400) e Senato (200).',
    stageValue: 3,
  },
];

const MARATHON_STEP_DURATION_MS = 3200;

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
  const [consultationsOpen, setConsultationsOpen] = useState(false);
  const [autoMarathonActive, setAutoMarathonActive] = useState(true);
  const lastSoundStageRef = useRef<string | null>(null);

  const electionKey = state.election ? `${state.election.conductedAtWeek}` : null;

  useEffect(() => {
    setConsultationsOpen(false);
    setAutoMarathonActive(true);
    lastSoundStageRef.current = null;
  }, [electionKey]);

  // Suono Diretta TV coerente con la fase della Maratona Elettorale
  useEffect(() => {
    if (!state.election) return;
    const stageKey = `${state.election.conductedAtWeek}_${state.election.stage}`;
    if (lastSoundStageRef.current === stageKey) return;
    lastSoundStageRef.current = stageKey;

    if (state.election.stage === 0 || state.election.stage === 3) {
      playElectionNightTheme();
    } else {
      playBreakingNewsJingle();
    }
  }, [state.election?.conductedAtWeek, state.election?.stage]);

  // Sequenza automatica rapida in 3 fasi: Ore 23:00 -> Ore 00:30 -> Risultato Definitivo
  useEffect(() => {
    if (!state.election || !autoMarathonActive || state.election.stage >= 3) {
      return;
    }
    const timer = window.setTimeout(() => {
      onAdvanceElectionStage(false);
    }, MARATHON_STEP_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [state.election?.stage, state.election?.conductedAtWeek, autoMarathonActive, onAdvanceElectionStage]);

  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const projectedSeats = useMemo(
    () => calculateParliamentSeats(state.parties, state.electoralLaw),
    [state.parties, state.electoralLaw]
  );

  // PRE-ELECTION VIEW
  if (!state.election) {
    const weeksRemaining = Math.max(0, state.electionWeek - state.week);
    const coalitionMembers = state.parties.filter(
      (p) =>
        p.id !== 'altri' &&
        (p.id === player.id ||
          (player.coalitionId && p.coalitionId === player.coalitionId))
    );
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
                <div className="text-xs text-slate-400">Consenso {state.coalitionName}</div>
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

            <div className="p-4 rounded-xl bg-[#090D16] border border-rose-500/35 space-y-3">
              <div className="flex items-start gap-3">
                <Flame className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    Mozione di Sfiducia e Scioglimento Anticipato
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Se ritieni di avere già il picco nei sondaggi e la coalizione pronta per superare quota 201 deputati e 101 senatori, puoi forzare la crisi parlamentare e aprire immediatamente la Notte Elettorale.
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onTriggerEarlyElection}
                  className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-display font-bold text-xs transition-colors cursor-pointer"
                >
                  Vota la Sfiducia · Apri Subito le Urne
                </button>
              </div>
            </div>
          </section>

          <section className="xl:col-span-5 bg-[#111827] border border-slate-800/90 rounded-xl p-5">
            <HemicycleSvg
              parties={state.parties}
              seats={projectedSeats}
              playerPartyId={state.playerPartyId}
            />
          </section>
        </div>
      </div>
    );
  }

  // ELECTION NIGHT LIVE COUNT VIEW (MARATONA ELETTORALE)
  const election = state.election;
  const isFinal = election.stage === 3;
  const playerFinalSeats = election.seats.find((s) => s.partyId === state.playerPartyId);
  const isExtraParliamentary =
    isFinal &&
    (election.playerRole === 'fuori_parlamento' ||
      ((playerFinalSeats?.camera ?? 0) === 0 && (playerFinalSeats?.senato ?? 0) === 0));
  const hasMajorityForQuirinale =
    isFinal && !isExtraParliamentary && election.playerCoalitionCamera >= 201;

  if (hasMajorityForQuirinale && consultationsOpen) {
    return (
      <QuirinaleConsultationsView
        state={state}
        onFormGovernment={(assignments) => {
          setConsultationsOpen(false);
          onFormGovernment(assignments);
        }}
        onDeclineMandate={() => {
          setConsultationsOpen(false);
          onDeclineMandate();
        }}
        onReviewResults={() => setConsultationsOpen(false)}
      />
    );
  }

  const activePhaseIdx: 0 | 1 | 2 =
    election.stage === 0 ? 0 : election.stage === 3 ? 2 : 1;
  const currentPhase = MARATHON_PHASES[activePhaseIdx];

  // Apply stage uncertainty jitter for Exit Poll / Prime Proiezioni
  const stageNoiseFactor = [1.1, 0.45, 0.2, 0][election.stage];
  const displayedParties = [...state.parties]
    .filter((p) => p.id !== 'altri')
    .map((p, idx) => {
      const exact = election.finalVotes[p.id] ?? p.nationalPoll;
      const offset =
        stageNoiseFactor === 0
          ? 0
          : (idx % 2 === 0 ? 1 : -1) * stageNoiseFactor * ((idx + 1) % 3 === 0 ? 1.15 : 0.72);
      const shownVote = Math.max(0.4, Math.round((exact + offset) * 10) / 10);
      const seat = election.seats.find((s) => s.partyId === p.id) ?? {
        camera: 0,
        senato: 0,
      };
      return {
        party: p,
        shownVote,
        camera: seat.camera,
        senato: seat.senato,
      };
    })
    .sort((a, b) => b.shownVote - a.shownVote);

  const playerEntry = displayedParties.find((d) => d.party.id === state.playerPartyId);
  const topThreeText = displayedParties
    .slice(0, 3)
    .map((d) => `${d.party.acronym} ${d.shownVote.toFixed(1)}%`)
    .join(' · ');

  const tickerItems: string[] = [
    `MARATONA ELETTORALE · ${currentPhase.title.toUpperCase()}`,
    `AFFLUENZA NAZIONALE: ${election.turnout.toFixed(1)}%`,
    `PODIO LIVE: ${topThreeText}`,
    playerEntry
      ? `${player.name.toUpperCase()} (${player.acronym}): ${playerEntry.shownVote.toFixed(1)}%${isFinal ? ` · ${playerEntry.camera} Deputati / ${playerEntry.senato} Senatori` : ' (dato in aggiornamento)'}`
      : '',
    isFinal
      ? `MAGGIORANZA CAMERA (SOGLIA 201): ${election.winningCoalitionName} a ${election.winningCoalitionCamera} seggi · ${state.coalitionName} a ${election.playerCoalitionCamera} seggi`
      : `PROIEZIONE COALIZIONI: testa a testa nei collegi uninominali di Nord, Centro e Mezzogiorno`,
    isFinal && hasMajorityForQuirinale
      ? `QUIRINALE: ${state.coalitionName} supera quota 201 alla Camera — attese a breve le consultazioni per l'incarico di Governo`
      : `COLLEGAMENTO DAL VIMINALE: affluenza definitiva consolidata in tutte le 20 regioni italiane`,
  ].filter(Boolean);

  const roleAccent =
    election.playerRole === 'premier'
      ? 'border-amber-500/70 bg-amber-500/10 text-amber-300'
      : election.playerRole === 'partner_governo'
        ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
        : election.playerRole === 'capo_opposizione'
          ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-300'
          : 'border-rose-500/60 bg-rose-500/10 text-rose-300';

  const handleSkipAnimation = () => {
    setAutoMarathonActive(false);
    playTactileClick();
    onAdvanceElectionStage(true);
  };

  const handleManualNextPhase = () => {
    playTactileClick();
    onAdvanceElectionStage(false);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Main Scrollable Election Night Broadcast Area */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden war-scroll p-3 sm:p-4 lg:p-5">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Live Broadcast Header & 3-Phase Marathon Stepper */}
          <section className="bg-[#111827] border border-amber-500/50 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono">
                  <span className="inline-flex items-center gap-1.5 text-rose-400 font-bold">
                    <Radio className="w-3.5 h-3.5 shrink-0" />
                    <span>MARATONA ELETTORALE</span>
                  </span>
                  <span className="text-slate-600" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-amber-400">{election.dateLabel}</span>
                  <span className="text-slate-600" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-slate-300 tabular-nums">
                    Affluenza {election.turnout.toFixed(1)}%
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-50 mt-1">
                  {currentPhase.title}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{currentPhase.subtitle}</p>
              </div>

              {!isFinal ? (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleManualNextPhase}
                    className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>Prossima Fase</span>
                    <FastForward className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipAnimation}
                    className="px-3.5 py-2 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <SkipForward className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Salta animazione</span>
                  </button>
                </div>
              ) : isExtraParliamentary ? (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={onCompletePostElection}
                    className="px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Continua all&apos;Opposizione Extra-Parlamentare</span>
                  </button>
                  <button
                    type="button"
                    onClick={onDissolveParty}
                    className="px-3.5 py-2.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/50 text-xs font-semibold text-rose-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    <span>Sciogli il Partito</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {hasMajorityForQuirinale ? (
                    <button
                      type="button"
                      onClick={() => {
                        playTactileClick();
                        setConsultationsOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Landmark className="w-4 h-4" />
                      <span>Apri Consultazioni al Quirinale</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onCompletePostElection}
                      className="px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Insediati e Continua Legislatura</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onStartFreshGame}
                    className="px-3.5 py-2.5 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Nuova Partita</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3-Phase Marathon Timeline Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
              {MARATHON_PHASES.map((phase) => {
                const isDone = activePhaseIdx > phase.index || (isFinal && phase.index === 2);
                const isCurrent = activePhaseIdx === phase.index;
                return (
                  <div
                    key={phase.index}
                    className={`px-3 py-2 rounded-lg border text-xs transition-colors ${
                      isCurrent
                        ? 'bg-amber-500/12 border-amber-500/60 text-amber-200'
                        : isDone
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                          : 'bg-[#090D16] border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                      <span>Fase {phase.index + 1}/3</span>
                      <span>
                        {isDone ? 'Completata' : isCurrent ? 'In onda' : 'In attesa'}
                      </span>
                    </div>
                    <div className="font-semibold mt-0.5 truncate">{phase.title}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Quirinale Outcome Banner (when final) */}
          {isFinal && (
            <section className={`rounded-xl border p-4 sm:p-5 ${roleAccent}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    {election.playerRole === 'premier' ? (
                      <Award className="w-4 h-4" />
                    ) : (
                      <Landmark className="w-4 h-4" />
                    )}
                    <span>
                      {isExtraParliamentary
                        ? 'Esito Elettorale · Opposizione Extra-Parlamentare'
                        : 'Verdetto delle Consultazioni al Quirinale'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-50">{election.outcomeTitle}</h3>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {election.outcomeNarrative}
                  </p>
                </div>
                <div className="text-right font-mono tabular-nums shrink-0">
                  <div className="text-xs text-slate-300">Tua Coalizione</div>
                  <div className="text-lg font-bold text-slate-50 mt-0.5">
                    {election.playerCoalitionCamera} Cam. / {election.playerCoalitionSenato} Sen.
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Vincitrice: {election.winningCoalitionName} ({election.winningCoalitionCamera})
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Main Election Results Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            {/* Vote & Seat Table */}
            <section className="xl:col-span-6 bg-[#111827] border border-slate-800/90 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-100 mb-3">
                {isFinal
                  ? 'Scrutinio Definitivo e Assegnazione Seggi'
                  : activePhaseIdx === 0
                    ? 'Exit Poll Nazionali (Stima Ore 23:00)'
                    : 'Prime Proiezioni Reali (Ore 00:30)'}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                      <th className="text-left font-medium py-2">Lista</th>
                      <th className="text-right font-medium py-2 px-2">Voti %</th>
                      <th className="text-right font-medium py-2 px-2">Camera</th>
                      <th className="text-right font-medium py-2">Senato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {displayedParties.map(({ party, shownVote, camera, senato }) => {
                      const isPlayer = party.id === state.playerPartyId;
                      return (
                        <tr
                          key={party.id}
                          className={isPlayer ? 'bg-cyan-500/10' : ''}
                        >
                          <td className="py-2.5 pr-2">
                            <div className="flex items-center gap-2">
                              <PartyEmblem
                                emblem={party.emblem}
                                color={party.color}
                                customUrl={party.customEmblemUrl}
                                size={24}
                              />
                              <span
                                className={
                                  isPlayer
                                    ? 'font-bold text-cyan-300'
                                    : 'font-medium text-slate-200'
                                }
                              >
                                {party.name} ({party.acronym})
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono tabular-nums font-bold text-slate-50">
                            {shownVote.toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono tabular-nums text-slate-200">
                            {isFinal ? camera : '—'}
                          </td>
                          <td className="py-2.5 text-right font-mono tabular-nums text-slate-400">
                            {isFinal ? senato : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Hemicycle & Macro-Area Winners */}
            <section className="xl:col-span-6 bg-[#111827] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between gap-4">
              <HemicycleSvg
                parties={state.parties}
                seats={election.seats}
                playerPartyId={state.playerPartyId}
                compact
              />

              <div className="pt-3 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-200 mb-2">
                  Primo Partito per Macro-Area
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {MACRO_REGIONS.map((reg) => {
                    const regScores = election.regionalVotes[reg.id];
                    const winnerId = Object.entries(regScores)
                      .filter(([id]) => id !== 'altri')
                      .sort((a, b) => b[1] - a[1])[0]?.[0];
                    const winParty = state.parties.find((p) => p.id === winnerId);
                    return (
                      <div
                        key={reg.id}
                        className="p-2 rounded-lg bg-[#090D16] border border-slate-800 text-center"
                      >
                        <div className="text-[10px] text-slate-400">{reg.label}</div>
                        <div
                          style={{ color: winParty?.color ?? '#94A3B8' }}
                          className="font-mono text-xs font-bold mt-0.5"
                        >
                          {winParty?.acronym ?? '--'}
                        </div>
                        <div className="font-mono text-[10px] tabular-nums text-slate-300">
                          {(regScores[winnerId] ?? 0).toFixed(1)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Bottom Live TV Broadcast Scrolling Ticker */}
      <div
        role="region"
        aria-label="Ultime notizie diretta elettorale"
        className="shrink-0 bg-[#0B101D] border-t border-rose-500/45 flex items-center overflow-hidden h-9"
      >
        <div className="bg-rose-600 text-white font-mono text-[10px] font-bold uppercase tracking-wider px-3 h-full flex items-center gap-1.5 shrink-0 z-10">
          <Radio className="w-3 h-3 shrink-0" />
          <span>DIRETTA</span>
        </div>
        <div className="flex-1 min-w-0 overflow-hidden whitespace-nowrap">
          <div className="war-ticker-track items-center text-xs font-mono text-slate-200">
            {[0, 1].map((loopIdx) => (
              <div key={loopIdx} className="inline-flex items-center">
                {tickerItems.map((item, idx) => (
                  <span
                    key={`${loopIdx}_${idx}`}
                    className="inline-flex items-center px-4"
                  >
                    <span>{item}</span>
                    <span className="ml-6 text-amber-400" aria-hidden="true">
                      ◆
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

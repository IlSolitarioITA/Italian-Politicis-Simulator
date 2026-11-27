import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  EU_THRESHOLD_PCT,
  EU_TOTAL_SEATS,
  EUROPEAN_CONSTITUENCIES,
  EUROPEAN_CONSTITUENCY_BY_ID,
} from '../data/european';
import { EuropeanConstituencyId, GameState } from '../types/game';
import {
  playBreakingNewsJingle,
  playElectionNightTheme,
  playTactileClick,
} from '../utils/soundEngine';
import { PartyEmblem } from './PartyEmblem';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  FastForward,
  Flag,
  Globe,
  Landmark,
  Pause,
  Play,
  Radio,
  ShieldAlert,
  SkipForward,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface EuropeanElectionNightViewProps {
  state: GameState;
  onAdvanceStage: (finalJump?: boolean) => void;
  onResolveLeaderDecision: (decision: 'bruxelles' | 'resta_italia') => void;
  onCompleteElection: () => void;
}

const TOTAL_SECTIONS = 61417;
const EU_CHECKPOINTS = [25, 42, 60, 82, 100] as const;

function deterministicJitter(id: string, seed: number): number {
  let h = seed * 37 + 19;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) % 100003;
  }
  return (h % 2001) / 1000 - 1;
}

function clockForProgress(pct: number): string {
  if (pct <= 25) return 'Ore 23:45';
  if (pct <= 42) return 'Ore 00:30';
  if (pct <= 60) return 'Ore 01:15';
  if (pct <= 82) return 'Ore 02:10';
  return 'Ore 03:05';
}

export const EuropeanElectionNightView: React.FC<EuropeanElectionNightViewProps> = ({
  state,
  onAdvanceStage,
  onResolveLeaderDecision,
  onCompleteElection,
}) => {
  const eu = state.european!;
  const res = eu.activeElection!;
  const player = state.parties.find((p) => p.id === state.playerPartyId)!;

  const [checkpointIdx, setCheckpointIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [selectedConst, setSelectedConst] = useState<EuropeanConstituencyId>('nord_ovest');
  const lastSoundRef = useRef<string | null>(null);

  const electionKey = `${res.conductedAtWeek}`;

  useEffect(() => {
    setCheckpointIdx(0);
    setPaused(false);
    setSpeed(1);
    lastSoundRef.current = null;
  }, [electionKey]);

  useEffect(() => {
    if (res.stage === 1) {
      setCheckpointIdx(0);
      setPaused(false);
    }
  }, [res.stage, electionKey]);

  useEffect(() => {
    const key = `eu_${res.conductedAtWeek}_${res.stage}`;
    if (lastSoundRef.current === key) return;
    lastSoundRef.current = key;
    if (res.stage === 0 || res.stage === 2) {
      playElectionNightTheme();
    } else {
      playBreakingNewsJingle();
    }
  }, [res.conductedAtWeek, res.stage]);

  useEffect(() => {
    if (res.stage !== 1 || paused || checkpointIdx >= EU_CHECKPOINTS.length - 1) return;
    const ms = speed === 2 ? 1100 : 2100;
    const t = window.setTimeout(() => {
      setCheckpointIdx((prev) => Math.min(EU_CHECKPOINTS.length - 1, prev + 1));
    }, ms);
    return () => window.clearTimeout(t);
  }, [res.stage, paused, speed, checkpointIdx]);

  const isPhase1 = res.stage === 0;
  const isPhase2 = res.stage === 1;
  const isPhase3 = res.stage === 2;

  const sectionsPct = isPhase3 ? 100 : isPhase1 ? 0 : EU_CHECKPOINTS[checkpointIdx];
  const sectionsCounted = Math.round((TOTAL_SECTIONS * sectionsPct) / 100);
  const phase2Done = isPhase2 && sectionsPct >= 100;

  const cartelMemberSet = useMemo(
    () => new Set(res.cartelUsed?.memberPartyIds ?? []),
    [res.cartelUsed]
  );

  // Costruisci righe live per ciascun partito (e lista combinata del cartello)
  const partyRows = useMemo(() => {
    const progRatio = sectionsPct / 100;
    const phase2Err = isPhase2 ? Math.max(0, (1 - progRatio) * 1.1) : 0;

    return state.parties
      .filter((p) => p.id !== 'altri')
      .map((party) => {
        const isExcluded = party.id === state.playerPartyId && res.playerExcludedFromBallot;
        const finalVote = isExcluded ? 0 : res.finalVotes[party.id] ?? 0;
        const prePoll = res.preElectionPolls[party.id] ?? party.nationalPoll;
        const jitter = deterministicJitter(party.id, res.conductedAtWeek);

        const exitHalf = isExcluded
          ? 0
          : Math.min(2.1, Math.max(0.4, Number((0.4 + finalVote * 0.06).toFixed(1))));
        const exitCenter = isExcluded
          ? 0
          : Math.max(0.2, Math.round((finalVote + jitter * exitHalf * 0.65) * 10) / 10);
        const exitMin = isExcluded ? 0 : Math.max(0, Math.round((exitCenter - exitHalf) * 10) / 10);
        const exitMax = isExcluded ? 0 : Math.round((exitCenter + exitHalf) * 10) / 10;

        const phase2Noise = isExcluded
          ? 0
          : jitter * Math.min(1.4, 0.3 + finalVote * 0.05) * phase2Err;
        const liveVote = isExcluded
          ? 0
          : isPhase3 || sectionsPct >= 100
            ? finalVote
            : Math.max(0.1, Math.round((finalVote + phase2Noise) * 10) / 10);

        const seatEntry = res.seats.find((s) => s.partyId === party.id);
        const totalSeats = seatEntry?.totalSeats ?? 0;
        const byConstituency = seatEntry?.byConstituency ?? {
          nord_ovest: 0,
          nord_est: 0,
          centro: 0,
          sud: 0,
          isole: 0,
        };
        const prevEuSeats = eu.euSeats[party.id] ?? 0;

        return {
          party,
          isExcluded,
          inCartel: cartelMemberSet.has(party.id),
          finalVote,
          prePoll,
          pollDelta: Math.round((finalVote - prePoll) * 10) / 10,
          exitCenter,
          exitMin,
          exitMax,
          liveVote,
          displaySort: isPhase1 ? exitCenter : liveVote,
          totalSeats,
          byConstituency,
          prevEuSeats,
          seatDelta: totalSeats - prevEuSeats,
        };
      })
      .sort((a, b) => b.displaySort - a.displaySort);
  }, [
    state.parties,
    state.playerPartyId,
    res,
    eu.euSeats,
    cartelMemberSet,
    isPhase1,
    isPhase2,
    isPhase3,
    sectionsPct,
  ]);

  const thresholdRadarRows = useMemo(() => {
    return partyRows
      .filter((r) => !r.isExcluded && r.liveVote >= 1.8 && r.liveVote <= 6.2)
      .sort((a, b) => Math.abs(a.liveVote - EU_THRESHOLD_PCT) - Math.abs(b.liveVote - EU_THRESHOLD_PCT))
      .slice(0, 8);
  }, [partyRows]);

  const seatWinnerRows = useMemo(
    () => partyRows.filter((r) => r.totalSeats > 0).sort((a, b) => b.totalSeats - a.totalSeats),
    [partyRows]
  );

  const totalAssignedSeats = useMemo(
    () => seatWinnerRows.reduce((acc, r) => acc + r.totalSeats, 0),
    [seatWinnerRows]
  );

  const constituencyLiveRows = useMemo(() => {
    const map = res.constituencyVotes[selectedConst] ?? {};
    const progRatio = sectionsPct / 100;
    const err = isPhase2 ? Math.max(0, (1 - progRatio) * 1.2) : 0;
    return state.parties
      .filter((p) => p.id !== 'altri')
      .map((p) => {
        const finalV = map[p.id] ?? 0;
        const j = deterministicJitter(`${p.id}_${selectedConst}`, res.conductedAtWeek);
        const liveV =
          isPhase3 || sectionsPct >= 100
            ? finalV
            : Math.max(0, Math.round((finalV + j * 0.8 * err) * 10) / 10);
        return { party: p, liveV, finalV };
      })
      .filter((r) => r.liveV >= 0.4 || r.party.id === state.playerPartyId)
      .sort((a, b) => b.liveV - a.liveV)
      .slice(0, 10);
  }, [res.constituencyVotes, res.conductedAtWeek, selectedConst, state.parties, state.playerPartyId, isPhase2, isPhase3, sectionsPct]);

  const phaseTitles = [
    {
      idx: 0,
      label: 'Fase 1 · Affluenza & Exit Poll',
      time: 'Ore 23:00',
    },
    {
      idx: 1,
      label: 'Fase 2 · Spoglio Progressivo',
      time: isPhase2 ? clockForProgress(sectionsPct) : 'Live',
    },
    {
      idx: 2,
      label: 'Fase 3 · 76 Seggi & Mid-Term',
      time: 'Definitivo',
    },
  ];

  const canComplete =
    isPhase3 && (!res.leaderDecisionRequired || res.leaderDecision !== null);

  return (
    <div className="h-full max-h-[90dvh] lg:max-h-full overflow-y-auto overflow-x-hidden war-scroll bg-[#080D18] text-slate-100 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      {/* Diretta Broadcast Header */}
      <div className="sticky top-0 z-20 bg-[#0A1328]/95 backdrop-blur border-b border-blue-500/35 px-3 sm:px-5 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-600/25 border border-blue-400/50 text-blue-200 text-[11px] font-bold uppercase tracking-wider shrink-0">
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Speciale Europee {res.year}</span>
            </span>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-slate-50 truncate">
                Parlamento Europeo · {EU_TOTAL_SEATS} Seggi Italiani ({res.dateLabel})
              </h1>
              <p className="text-[11px] text-slate-400 truncate">
                Proporzionale puro · Soglia 4% · 5 Circoscrizioni Ufficiali Eligendo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {phaseTitles.map((ph) => {
              const active = res.stage === ph.idx;
              const done = res.stage > ph.idx;
              return (
                <div
                  key={ph.idx}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium border flex items-center gap-1.5 ${
                    active
                      ? 'bg-blue-500/20 border-blue-400/60 text-blue-100'
                      : done
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-[#090D16] border-slate-800 text-slate-500'
                  }`}
                >
                  {done && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                  <span>{ph.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-3 sm:p-5 space-y-4">
        {/* Top Metrics Strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-[#101829] border border-blue-500/30">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Affluenza Nazionale UE</span>
            </div>
            <div className="font-mono text-2xl font-bold tabular-nums text-amber-300 mt-1">
              {res.nationalTurnout.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Media tipica europea (45%–55%)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#101829] border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Stato Spoglio</span>
            </div>
            <div className="font-mono text-2xl font-bold tabular-nums text-cyan-300 mt-1">
              {isPhase1 ? 'Ore 23:00' : `${sectionsPct}%`}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
              {isPhase1
                ? 'Exit Poll fuori dai seggi'
                : `${sectionsCounted.toLocaleString('it-IT')} / ${TOTAL_SECTIONS.toLocaleString('it-IT')} sezioni`}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#101829] border border-slate-800">
            <div className="text-[11px] text-slate-400">
              {res.cartelUsed ? `Cartello ${res.cartelUsed.name}` : `Lista ${player.acronym}`}
            </div>
            <div className="font-mono text-2xl font-bold tabular-nums text-slate-50 mt-1">
              {res.playerExcludedFromBallot
                ? 'Esclusa'
                : isPhase1
                  ? (() => {
                      const pr = partyRows.find((r) => r.party.id === player.id);
                      return pr ? `${pr.exitMin.toFixed(1)}–${pr.exitMax.toFixed(1)}%` : '—';
                    })()
                  : `${(partyRows.find((r) => r.party.id === player.id)?.liveVote ?? 0).toFixed(1)}%`}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {res.cartelUsed
                ? `Somma Cartello: ${res.cartelCombinedPct.toFixed(1)}% (soglia 4%)`
                : 'Soglia di sbarramento nazionale: 4,0%'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#101829] border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Eurodeputati {player.acronym}</span>
            </div>
            <div className="font-mono text-2xl font-bold tabular-nums text-emerald-300 mt-1">
              {isPhase3 ? `${res.playerWonSeats} / ${EU_TOTAL_SEATS}` : 'In calcolo'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {isPhase3
                ? `Precedenti: ${res.playerPrevEuSeats} (${res.playerWonSeats - res.playerPrevEuSeats >= 0 ? '+' : ''}${res.playerWonSeats - res.playerPrevEuSeats})`
                : 'Camera e Senato nazionali invariati'}
            </div>
          </div>
        </section>

        {/* PHASE 1: ORE 23:00 — AFFLUENZA & EXIT POLL */}
        {isPhase1 && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <section className="xl:col-span-7 bg-[#111827] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-slate-100">
                    Exit Poll Nazionali (Ore 23:00 · Forchette Statistiche)
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Con affluenza europea al {res.nationalTurnout.toFixed(1)}%, i partiti con forte radicamento territoriale tengono meglio dei voti d’opinione.
                  </p>
                </div>
                <span className="px-2 py-1 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold">
                  Soglia 4,0%
                </span>
              </div>

              {res.cartelUsed && (
                <div className="p-3 rounded-lg bg-blue-950/35 border border-blue-500/40 text-xs text-blue-100 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <strong>Cartello "{res.cartelUsed.name}"</strong> in corsa unita per superare il 4%
                  </span>
                  <span className="font-mono font-bold text-amber-300">
                    Forchetta combinata: {Math.max(0, res.cartelCombinedPct - 0.9).toFixed(1)}% – {(res.cartelCombinedPct + 0.9).toFixed(1)}%
                  </span>
                </div>
              )}

              <div className="space-y-2.5">
                {partyRows.slice(0, 11).map((row) => {
                  const isPlayerRow = row.party.id === player.id;
                  const barW = Math.min(100, (row.exitMax / 38) * 100);
                  return (
                    <div
                      key={row.party.id}
                      className={`p-2.5 rounded-lg border ${
                        isPlayerRow
                          ? 'bg-cyan-950/25 border-cyan-500/50'
                          : 'bg-[#090D16] border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <PartyEmblem
                            emblem={row.party.emblem}
                            color={row.party.color}
                            customUrl={row.party.customEmblemUrl}
                            size={18}
                          />
                          <span className="font-semibold text-slate-100 truncate">
                            {row.party.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            ({row.party.acronym})
                          </span>
                          {row.inCartel && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-500/40">
                              Cartello
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-bold tabular-nums text-slate-100 shrink-0">
                          {row.isExcluded
                            ? 'Esclusa'
                            : `${row.exitMin.toFixed(1)}% – ${row.exitMax.toFixed(1)}%`}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-900 overflow-hidden relative">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${barW}%`, backgroundColor: row.party.color }}
                        />
                        <div
                          title="Soglia 4%"
                          className="absolute top-0 bottom-0 w-0.5 bg-amber-400/90"
                          style={{ left: `${(EU_THRESHOLD_PCT / 38) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="xl:col-span-5 bg-[#111827] border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2.5">
                  Affluenza nelle 5 Circoscrizioni Ufficiali
                </h2>
                <div className="space-y-2.5">
                  {EUROPEAN_CONSTITUENCIES.map((c) => {
                    const t = res.constituencyTurnout[c.id];
                    return (
                      <div
                        key={c.id}
                        className="p-3 rounded-lg bg-[#090D16] border border-slate-800/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="font-semibold text-slate-100">{c.name}</span>
                            <span className="text-[10px] text-slate-400 ml-2 font-mono">
                              {c.seats} seggi
                            </span>
                          </div>
                          <span className="font-mono font-bold tabular-nums text-amber-300">
                            {t.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">{c.regionsLabel}</div>
                        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-blue-400"
                            style={{ width: `${Math.min(100, t)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    playTactileClick();
                    onAdvanceStage(false);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span>Avvia Spoglio Sezioni (Fase 2)</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playTactileClick();
                    onAdvanceStage(true);
                  }}
                  className="py-2.5 px-3 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Salta ai Definitivi</span>
                </button>
              </div>
            </section>
          </div>
        )}

        {/* PHASE 2: SPOGLIO PROGRESSIVO (25% -> 60% -> 100%) */}
        {isPhase2 && (
          <div className="space-y-4">
            {/* Barra controllo Spoglio Progressivo */}
            <section className="p-4 rounded-xl bg-[#111827] border border-blue-500/40 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-blue-200 flex items-center gap-2">
                    <span>Spoglio Progressivo Viminale / Eligendo</span>
                    <span className="font-mono text-amber-300">
                      {clockForProgress(sectionsPct)} · {sectionsPct}% sezioni
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                    {sectionsCounted.toLocaleString('it-IT')} su {TOTAL_SECTIONS.toLocaleString('it-IT')} sezioni scrutinate
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setPaused((v) => !v)}
                    disabled={phase2Done}
                    className="px-2.5 py-1.5 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{paused ? 'Riprendi' : 'Pausa'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpeed((s) => (s === 1 ? 2 : 1))}
                    disabled={phase2Done}
                    className="px-2.5 py-1.5 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>{speed}x</span>
                  </button>
                  {!phase2Done ? (
                    <button
                      type="button"
                      onClick={() => {
                        playTactileClick();
                        setCheckpointIdx(EU_CHECKPOINTS.length - 1);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                      <span>Accelera al 100%</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        playTactileClick();
                        onAdvanceStage(true);
                      }}
                      className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Proclama i 76 Seggi (Fase 3)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-[#090D16] border border-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${sectionsPct}%` }}
                />
              </div>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              {/* Radar Soglia del 4% */}
              <section className="xl:col-span-6 bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <h2 className="text-sm font-bold text-slate-100">
                    Focus Soglia di Sbarramento 4,0%
                  </h2>
                  <span className="text-[10px] font-mono text-amber-300">
                    DENTRO vs FUORI STRASBURGO
                  </span>
                </div>

                {res.cartelUsed && (
                  <div
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                      res.cartelCombinedPct >= EU_THRESHOLD_PCT
                        ? 'bg-emerald-950/30 border-emerald-500/45 text-emerald-200'
                        : 'bg-rose-950/30 border-rose-500/45 text-rose-200'
                    }`}
                  >
                    <span>
                      Cartello <strong>{res.cartelUsed.name}</strong>
                    </span>
                    <span className="font-mono font-bold">
                      {res.cartelCombinedPct.toFixed(1)}% ·{' '}
                      {res.cartelCombinedPct >= EU_THRESHOLD_PCT ? 'SOPRA IL 4%' : 'SOTTO IL 4%'}
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  {thresholdRadarRows.map((row) => {
                    const effectiveVal = row.inCartel ? res.cartelCombinedPct : row.liveVote;
                    const over = effectiveVal >= EU_THRESHOLD_PCT;
                    return (
                      <div
                        key={row.party.id}
                        className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs ${
                          over
                            ? 'bg-emerald-950/15 border-emerald-500/35'
                            : 'bg-rose-950/15 border-rose-500/35'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <PartyEmblem
                            emblem={row.party.emblem}
                            color={row.party.color}
                            customUrl={row.party.customEmblemUrl}
                            size={16}
                          />
                          <span className="font-semibold text-slate-100 truncate">
                            {row.party.name}
                          </span>
                          {row.inCartel && (
                            <span className="text-[10px] text-blue-300 font-mono">(Cartello)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 font-mono">
                          <span className="font-bold text-slate-100">
                            {row.liveVote.toFixed(1)}%
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              over
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {over ? 'DENTRO' : 'SOTTO 4%'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Andamento nelle 5 Circoscrizioni */}
              <section className="xl:col-span-6 bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <h2 className="text-sm font-bold text-slate-100">
                    Andamento nelle 5 Circoscrizioni
                  </h2>
                  <div className="flex items-center gap-1 flex-wrap">
                    {EUROPEAN_CONSTITUENCIES.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedConst(c.id)}
                        className={`px-2 py-1 rounded text-[10px] font-semibold cursor-pointer transition-colors ${
                          selectedConst === c.id
                            ? 'bg-blue-500 text-slate-950'
                            : 'bg-[#090D16] text-slate-400 hover:text-slate-100 border border-slate-800'
                        }`}
                      >
                        {c.shortName}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{EUROPEAN_CONSTITUENCY_BY_ID[selectedConst].regionsLabel}</span>
                  <span className="font-mono text-amber-300">
                    {EUROPEAN_CONSTITUENCY_BY_ID[selectedConst].seats} seggi · Affluenza{' '}
                    {res.constituencyTurnout[selectedConst].toFixed(1)}%
                  </span>
                </div>

                <div className="space-y-2">
                  {constituencyLiveRows.map((row) => (
                    <div
                      key={row.party.id}
                      className="flex items-center justify-between gap-2 text-xs px-2.5 py-1.5 rounded bg-[#090D16] border border-slate-800/80"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: row.party.color }}
                        />
                        <span className="font-medium text-slate-100 truncate">
                          {row.party.name}
                        </span>
                      </div>
                      <span className="font-mono font-bold tabular-nums text-slate-100 shrink-0">
                        {row.liveV.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* PHASE 3: RISULTATI DEFINITIVI, 76 SEGGI, SCELTA LEADER & EFFETTO MID-TERM */}
        {isPhase3 && (
          <div className="space-y-4">
            {/* Effetto Mid-Term sul Governo Nazionale */}
            <section
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                res.midTermImpactTone === 'logorato'
                  ? 'bg-rose-950/25 border-rose-500/50'
                  : res.midTermImpactTone === 'rafforzato'
                    ? 'bg-emerald-950/25 border-emerald-500/45'
                    : 'bg-slate-900/80 border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3">
                {res.midTermImpactTone === 'logorato' ? (
                  <TrendingDown className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                ) : res.midTermImpactTone === 'rafforzato' ? (
                  <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Landmark className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-200">
                    Effetto Mid-Term sul Governo Nazionale
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {res.midTermSummary}
                  </p>
                </div>
              </div>
              <div className="shrink-0 font-mono text-right">
                <div className="text-[10px] text-slate-400">Delta Governo vs Sondaggi</div>
                <div
                  className={`text-lg font-bold tabular-nums ${
                    res.midTermGovDeltaPct >= 1.5
                      ? 'text-emerald-400'
                      : res.midTermGovDeltaPct <= -2.0
                        ? 'text-rose-400'
                        : 'text-slate-200'
                  }`}
                >
                  {res.midTermGovDeltaPct >= 0 ? '+' : ''}
                  {res.midTermGovDeltaPct.toFixed(1)}%
                </div>
              </div>
            </section>

            {/* Dilemma Scelta del Leader (se candidato ed eletto) */}
            {res.leaderDecisionRequired && (
              <section className="p-4 rounded-xl bg-amber-950/25 border border-amber-500/55 space-y-3">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-sm font-bold text-amber-200">
                      Decisione del Leader: {state.leader.name} è stato eletto a Strasburgo!
                    </h2>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {res.leaderCandidacyMode === 'all_five'
                        ? 'Hai candidato il Leader in tutte e 5 le circoscrizioni massimizzando il traino. Ora devi scegliere: accettare il mandato europeo oppure rinunciare per restare in Italia affrontando le polemiche sulla "candidatura finta".'
                        : `Hai candidato il Leader nella circoscrizione ${
                            res.leaderCandidacyConstituency
                              ? EUROPEAN_CONSTITUENCY_BY_ID[res.leaderCandidacyConstituency].shortName
                              : ''
                          }. Scegli se assumere il seggio a Bruxelles o cederlo al primo dei non eletti restando in Italia.`}
                    </p>
                  </div>
                </div>

                {res.leaderDecision === null ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        playTactileClick();
                        onResolveLeaderDecision('bruxelles');
                      }}
                      className="p-3 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/60 text-left cursor-pointer transition-colors"
                    >
                      <div className="text-xs font-bold text-blue-100">
                        Accetta il Seggio a Bruxelles / Strasburgo
                      </div>
                      <div className="text-[11px] text-slate-300 mt-1">
                        Coerenza premiata: +3 gradimento personale e +4 rapporti UE (continui a guidare il partito dalla War Room).
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playTactileClick();
                        onResolveLeaderDecision('resta_italia');
                      }}
                      className="p-3 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/50 text-left cursor-pointer transition-colors"
                    >
                      <div className="text-xs font-bold text-rose-200">
                        Rinuncia al Seggio &amp; Resta in Italia
                      </div>
                      <div className="text-[11px] text-slate-300 mt-1">
                        {res.leaderCandidacyMode === 'all_five'
                          ? 'Forte polemica "candidatura finta": -5 gradimento e -0,4% consenso nazionale.'
                          : 'Critiche moderate stampa: -2 gradimento personale, il seggio passa al primo dei non eletti.'}
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-[#090D16] border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      Scelta registrata:{' '}
                      {res.leaderDecision === 'bruxelles'
                        ? `${state.leader.name} accetta il mandato al Parlamento Europeo.`
                        : `${state.leader.name} rinuncia al seggio europeo e resta in Italia.`}
                    </span>
                  </div>
                )}
              </section>
            )}

            {/* Tabella Ufficiale dei 76 Seggi per Partito e 5 Circoscrizioni */}
            <section className="bg-[#111827] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-slate-100">
                    Ripartizione Ufficiale dei {totalAssignedSeats} Seggi Italiani (5 Circoscrizioni)
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Soglia nazionale 4,0% · Quozienti naturali e più alti resti · Seggi nazionali di Camera e Senato invariati.
                  </p>
                </div>
                {res.svpMinoritySeatAwarded && (
                  <span className="px-2 py-1 rounded bg-cyan-500/15 border border-cyan-500/40 text-cyan-200 text-[10px] font-semibold">
                    Tutela minoranza linguistica SVP (1 seggio Nord-Est)
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse min-w-[620px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                      <th className="text-left py-2 pr-3 font-semibold">Partito / Lista</th>
                      <th className="text-right py-2 px-2 font-mono">Voto %</th>
                      <th className="text-right py-2 px-2 font-mono">Δ Sond.</th>
                      <th className="text-right py-2 px-2 font-mono">N-O (20)</th>
                      <th className="text-right py-2 px-2 font-mono">N-E (15)</th>
                      <th className="text-right py-2 px-2 font-mono">Cen (15)</th>
                      <th className="text-right py-2 px-2 font-mono">Sud (18)</th>
                      <th className="text-right py-2 px-2 font-mono">Iso (8)</th>
                      <th className="text-right py-2 pl-2 font-mono text-amber-300">Tot. 76</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {seatWinnerRows.map((row) => {
                      const isP = row.party.id === player.id;
                      return (
                        <tr
                          key={row.party.id}
                          className={isP ? 'bg-cyan-950/25' : 'hover:bg-slate-900/50'}
                        >
                          <td className="py-2 pr-3">
                            <div className="flex items-center gap-2">
                              <PartyEmblem
                                emblem={row.party.emblem}
                                color={row.party.color}
                                customUrl={row.party.customEmblemUrl}
                                size={18}
                              />
                              <span className="font-semibold text-slate-100">
                                {row.party.name}
                              </span>
                              {row.inCartel && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-500/40">
                                  Cartello
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-bold text-slate-100">
                            {row.finalVote.toFixed(1)}%
                          </td>
                          <td
                            className={`py-2 px-2 text-right font-mono ${
                              row.pollDelta > 0
                                ? 'text-emerald-400'
                                : row.pollDelta < 0
                                  ? 'text-rose-400'
                                  : 'text-slate-500'
                            }`}
                          >
                            {row.pollDelta > 0 ? '+' : ''}
                            {row.pollDelta.toFixed(1)}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-slate-300">
                            {row.byConstituency.nord_ovest}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-slate-300">
                            {row.byConstituency.nord_est}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-slate-300">
                            {row.byConstituency.centro}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-slate-300">
                            {row.byConstituency.sud}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-slate-300">
                            {row.byConstituency.isole}
                          </td>
                          <td className="py-2 pl-2 text-right font-mono font-bold text-amber-300">
                            {row.totalSeats}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Liste sotto il 4% (escluse dal riparto) */}
              {partyRows.some((r) => r.totalSeats === 0 && r.finalVote >= 0.5) && (
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-300">Sotto soglia 4% (0 seggi):</span>
                  {partyRows
                    .filter((r) => r.totalSeats === 0 && (r.finalVote >= 0.5 || r.party.id === player.id))
                    .slice(0, 8)
                    .map((r) => (
                      <span
                        key={r.party.id}
                        className="px-2 py-0.5 rounded bg-[#090D16] border border-slate-800 font-mono text-[10px]"
                      >
                        {r.party.acronym}: {r.isExcluded ? 'Esclusa' : `${r.finalVote.toFixed(1)}%`}
                      </span>
                    ))}
                </div>
              )}
            </section>

            {/* CTA Finale */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-[#101829] border border-blue-500/40">
              <div className="text-xs text-slate-300 flex items-center gap-2">
                <Flag className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  I nuovi eurodeputati entrano in carica a Strasburgo. I seggi nazionali di Camera e Senato restano invariati.
                </span>
              </div>
              <button
                type="button"
                disabled={!canComplete}
                onClick={() => {
                  playTactileClick();
                  onCompleteElection();
                }}
                className={`px-5 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 shrink-0 transition-colors ${
                  canComplete
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>
                  {canComplete
                    ? 'Archivia Risultati & Torna alla War Room'
                    : 'Scegli prima il destino del Leader sopra'}
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

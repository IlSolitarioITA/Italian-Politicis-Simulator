import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MACRO_REGIONS } from '../data/presets';
import { getCurrentParliamentSeats } from '../engine/simulation';
import { GameState, MinistryId, PartyState } from '../types/game';
import {
  playBreakingNewsJingle,
  playElectionNightTheme,
  playTactileClick,
} from '../utils/soundEngine';
import { HemicycleSvg } from './HemicycleSvg';
import { PartyEmblem } from './PartyEmblem';
import { QuirinaleConsultationsView } from './QuirinaleConsultationsView';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  FastForward,
  Gauge,
  Landmark,
  Newspaper,
  Pause,
  Play,
  Radio,
  RotateCcw,
  SkipForward,
  Swords,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface ElectionNightViewProps {
  state: GameState;
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

const TOTAL_ITALIAN_SECTIONS = 61417;
const PROGRESS_CHECKPOINTS = [15, 25, 42, 60, 82, 100] as const;

interface PhaseMeta {
  index: 0 | 1 | 2;
  shortLabel: string;
  timeLabel: string;
  title: string;
  subtitle: string;
}

const ELECTION_PHASES: PhaseMeta[] = [
  {
    index: 0,
    shortLabel: 'Chiusura Urne & Exit Poll',
    timeLabel: 'Ore 23:00',
    title: 'Fase 1 — Chiusura Urne & Exit Poll (Ore 23:00)',
    subtitle:
      'Urne chiuse in tutte le 20 regioni italiane. Prime forchette degli Exit Poll fuori dai seggi con margine d’errore statistico.',
  },
  {
    index: 1,
    shortLabel: 'Proiezioni & Scrutinio',
    timeLabel: 'Spoglio Live',
    title: 'Fase 2 — Proiezioni & Scrutinio Progressivo',
    subtitle:
      'Avanzamento in diretta delle 61.417 sezioni del Viminale: monitoraggio della soglia del 3% e dei testa a testa decisivi.',
  },
  {
    index: 2,
    shortLabel: 'Definitivi, Seggi & Analisi',
    timeLabel: 'Ufficiale 100%',
    title: 'Fase 3 — Risultati Definitivi, Seggi & Analisi',
    subtitle:
      'Scrutinio completato al 100%. Ripartizione ufficiale di Camera (400) e Senato (200), confronto con i sondaggi e rassegna della stampa.',
  },
];

/** Deterministic signed noise in [-1, 1] per party + election week so ranges never flicker chaotically */
function deterministicPartyJitter(partyId: string, seed: number): number {
  let hash = seed * 31 + 17;
  for (let i = 0; i < partyId.length; i += 1) {
    hash = (hash * 33 + partyId.charCodeAt(i)) % 100003;
  }
  return ((hash % 2001) / 1000) - 1;
}

function getClockForSectionProgress(pct: number): string {
  if (pct <= 15) return 'Ore 23:35';
  if (pct <= 25) return 'Ore 00:10';
  if (pct <= 42) return 'Ore 00:55';
  if (pct <= 60) return 'Ore 01:40';
  if (pct <= 82) return 'Ore 02:35';
  return 'Ore 03:20';
}

interface PressVerdict {
  newspaper: string;
  kicker: string;
  headline: string;
  analysis: string;
  tone: 'trionfo' | 'positivo' | 'neutro' | 'negativo';
}

function buildPressVerdict(params: {
  player: PartyState;
  finalVote: number;
  prePoll: number;
  newCamera: number;
  newSenato: number;
  prevCamera: number;
  prevSenato: number;
  playerRole: NonNullable<GameState['election']>['playerRole'];
  excluded: boolean;
  winningCoalitionName: string;
}): PressVerdict {
  const {
    player,
    finalVote,
    prePoll,
    newCamera,
    newSenato,
    prevCamera,
    prevSenato,
    playerRole,
    excluded,
    winningCoalitionName,
  } = params;
  const pollDelta = Math.round((finalVote - prePoll) * 10) / 10;
  const seatDelta = newCamera + newSenato - (prevCamera + prevSenato);
  const wasExtraParl = prevCamera + prevSenato === 0;
  const isNowInParl = newCamera + newSenato > 0;

  if (excluded) {
    return {
      newspaper: 'Il Corriere Nazionale',
      kicker: 'Esclusione dalla Scheda · Deposito Liste',
      headline: `Fuori dal voto: ${player.name} paga il mancato raggiungimento delle firme`,
      analysis: `Una tornata amara per ${player.leaderName}: senza l’ammissione alle schede il partito resta a 0 seggi e dovrà riorganizzare la rete territoriale e i banchetti in vista della prossima scadenza.`,
      tone: 'negativo',
    };
  }

  if (playerRole === 'premier') {
    return {
      newspaper: 'Il Corriere Nazionale',
      kicker: 'Speciale Elezioni · Palazzo Chigi',
      headline: `Trionfo ${player.acronym}: ${player.leaderName} conquista la guida del Paese`,
      analysis: `Con il ${finalVote.toFixed(1)}% (${pollDelta >= 0 ? '+' : ''}${pollDelta.toFixed(1)}% rispetto agli ultimi sondaggi) e ${newCamera} deputati / ${newSenato} senatori (${seatDelta >= 0 ? '+' : ''}${seatDelta} seggi rispetto alla legislatura uscente), ${player.name} ottiene un mandato chiaro per guidare le consultazioni al Quirinale.`,
      tone: 'trionfo',
    };
  }

  if (wasExtraParl && isNowInParl) {
    return {
      newspaper: 'La Tribuna Politica',
      kicker: 'Svolta Parlamentare · Soglia 3% Superata',
      headline: `Storico ingresso alle Camere: ${player.name} sfonda il muro del 3% (${finalVote.toFixed(1)}%)`,
      analysis: `Dalla piazza ai banchi di Montecitorio e Palazzo Madama: ${player.leaderName} porta ${newCamera} deputati e ${newSenato} senatori in Parlamento, superando le previsioni della vigilia di ${pollDelta >= 0 ? '+' : ''}${pollDelta.toFixed(1)} punti.`,
      tone: 'trionfo',
    };
  }

  if (playerRole === 'partner_governo') {
    return {
      newspaper: 'Cronaca di Palazzo',
      kicker: 'Equilibri di Maggioranza · Manuale Cencelli',
      headline: `${player.name} decisivo per la nuova maggioranza: ${newCamera + newSenato} parlamentari`,
      analysis: `Al ${finalVote.toFixed(1)}% (${pollDelta >= 0 ? '+' : ''}${pollDelta.toFixed(1)}% sui sondaggi pre-voto), la formazione di ${player.leaderName} diventa perno della coalizione vincitrice e si prepara a trattare i ministeri chiave.`,
      tone: 'positivo',
    };
  }

  if (playerRole === 'fuori_parlamento') {
    return {
      newspaper: 'L’Osservatore Italiano',
      kicker: 'Analisi del Voto · Sbarramento 3%',
      headline: `Doccia fredda per ${player.acronym}: al ${finalVote.toFixed(1)}% resta sotto la soglia del 3%`,
      analysis: `Non basta la rincorsa finale di ${player.leaderName} (${pollDelta >= 0 ? '+' : ''}${pollDelta.toFixed(1)}% rispetto ai sondaggi della vigilia). Con 0 seggi in Camera e Senato si apre una nuova fase di radicamento extra-parlamentare.`,
      tone: 'negativo',
    };
  }

  if (playerRole === 'capo_opposizione') {
    return {
      newspaper: 'La Tribuna Politica',
      kicker: 'Nuovo Assetto d’Aula · Opposizione',
      headline: `${player.name} al ${finalVote.toFixed(1)}%: ${player.leaderName} guida l’opposizione`,
      analysis: `${winningCoalitionName} vince la sfida dei collegi, ma ${player.acronym} (${seatDelta >= 0 ? '+' : ''}${seatDelta} seggi rispetto alla legislatura precedente, ${pollDelta >= 0 ? '+' : ''}${pollDelta.toFixed(1)}% sui sondaggi) resta il principale argine parlamentare.`,
      tone: pollDelta >= 0 ? 'positivo' : 'neutro',
    };
  }

  return {
    newspaper: 'Il Foglio Economico',
    kicker: 'Bilancio della Notte Elettorale',
    headline:
      pollDelta >= 0.4
        ? `Effetto ${player.leaderName}: ${player.name} sorprende i sondaggi e sale al ${finalVote.toFixed(1)}%`
        : pollDelta <= -0.5
          ? `Frenata per ${player.name}: chiude al ${finalVote.toFixed(1)}% sotto le attese della vigilia`
          : `${player.name} tiene le posizioni al ${finalVote.toFixed(1)}% con ${newCamera + newSenato} eletti`,
    analysis: `Variazione rispetto ai sondaggi pre-voto: ${pollDelta >= 0 ? '+' : ''}${pollDelta.toFixed(1)}% · Bilancio parlamentare: ${newCamera} Camera e ${newSenato} Senato (${seatDelta >= 0 ? '+' : ''}${seatDelta} seggi vs legislatura uscente).`,
    tone: pollDelta >= 0.3 ? 'positivo' : pollDelta <= -0.5 ? 'negativo' : 'neutro',
  };
}

export const ElectionNightView: React.FC<ElectionNightViewProps> = ({
  state,
  onAdvanceElectionStage,
  onCompletePostElection,
  onFormGovernment,
  onDeclineMandate,
  onDissolveParty,
  onStartFreshGame,
}) => {
  const election = state.election!;
  const [consultationsOpen, setConsultationsOpen] = useState(false);
  const [checkpointIdx, setCheckpointIdx] = useState<number>(0);
  const [countingPaused, setCountingPaused] = useState<boolean>(false);
  const [countingSpeed, setCountingSpeed] = useState<1 | 2>(1);
  const lastSoundStageRef = useRef<string | null>(null);

  const electionKey = `${election.conductedAtWeek}`;

  // Reset local progressive-count state when a new election starts
  useEffect(() => {
    setConsultationsOpen(false);
    setCheckpointIdx(0);
    setCountingPaused(false);
    setCountingSpeed(1);
    lastSoundStageRef.current = null;
  }, [electionKey]);

  // Reset progressive counting checkpoint whenever entering Phase 2 (stage 1)
  useEffect(() => {
    if (election.stage === 1 || election.stage === 2) {
      setCheckpointIdx(0);
      setCountingPaused(false);
    }
  }, [election.stage, electionKey]);

  // Broadcast audio cue per election phase
  useEffect(() => {
    const stageKey = `${election.conductedAtWeek}_${election.stage}`;
    if (lastSoundStageRef.current === stageKey) return;
    lastSoundStageRef.current = stageKey;

    if (election.stage === 0 || election.stage === 3) {
      playElectionNightTheme();
    } else {
      playBreakingNewsJingle();
    }
  }, [election.conductedAtWeek, election.stage]);

  // Progressive section-counting timer ONLY during Phase 2 (stage 1 / 2)
  useEffect(() => {
    const inPhase2 = election.stage === 1 || election.stage === 2;
    if (!inPhase2 || countingPaused || checkpointIdx >= PROGRESS_CHECKPOINTS.length - 1) {
      return;
    }
    const intervalMs = countingSpeed === 2 ? 1200 : 2300;
    const timer = window.setTimeout(() => {
      setCheckpointIdx((prev) => Math.min(PROGRESS_CHECKPOINTS.length - 1, prev + 1));
    }, intervalMs);
    return () => window.clearTimeout(timer);
  }, [election.stage, countingPaused, countingSpeed, checkpointIdx]);

  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const previousParliamentSeats = useMemo(
    () => getCurrentParliamentSeats(state),
    [state]
  );

  const activePhaseIdx: 0 | 1 | 2 =
    election.stage === 0 ? 0 : election.stage === 3 ? 2 : 1;
  const isPhase1 = activePhaseIdx === 0;
  const isPhase2 = activePhaseIdx === 1;
  const isPhase3 = activePhaseIdx === 2;

  const sectionsPct = isPhase3
    ? 100
    : isPhase1
      ? 0
      : PROGRESS_CHECKPOINTS[checkpointIdx];
  const sectionsCounted = Math.round((TOTAL_ITALIAN_SECTIONS * sectionsPct) / 100);
  const phase2Completed = isPhase2 && sectionsPct >= 100;

  const coalitionMembers = state.parties.filter(
    (p) =>
      p.id !== 'altri' &&
      (p.id === player.id ||
        (Boolean(player.coalitionId) && p.coalitionId === player.coalitionId))
  );
  const hasAllies = coalitionMembers.some((m) => m.id !== player.id);
  const playerBlocLabel = hasAllies ? state.coalitionName : player.name;

  const playerFinalSeats = election.seats.find((s) => s.partyId === state.playerPartyId);
  const playerWonSeatsTotal = (playerFinalSeats?.camera ?? 0) + (playerFinalSeats?.senato ?? 0);
  const isExtraParliamentary =
    isPhase3 &&
    (election.playerRole === 'fuori_parlamento' || playerWonSeatsTotal === 0);
  const hasMajorityForQuirinale =
    isPhase3 &&
    !isExtraParliamentary &&
    playerWonSeatsTotal > 0 &&
    election.playerCoalitionCamera >= 201 &&
    (election.playerRole === 'premier' || election.playerRole === 'partner_governo');

  // Build deterministic party metrics across all 3 phases
  const partyRows = useMemo(() => {
    const progressRatio = sectionsPct / 100; // 0 in phase 1, 0.15..1.0 in phase 2, 1.0 in phase 3
    const phase2ErrorScale = isPhase2 ? Math.max(0, (1 - progressRatio) * 1.15) : 0;

    return state.parties
      .filter((p) => p.id !== 'altri')
      .map((party) => {
        const finalVote = election.finalVotes[party.id] ?? party.nationalPoll;
        const prePoll = election.preElectionPolls?.[party.id] ?? party.previousPoll ?? finalVote;
        const isExcludedPlayer =
          party.id === state.playerPartyId && Boolean(election.playerExcludedFromBallot);

        const jitter = deterministicPartyJitter(party.id, election.conductedAtWeek);

        // Phase 1 Exit Poll realistic margin of error (bigger parties ±1.5..2.0%, small parties ±0.5..1.2%)
        const exitHalfWidth = isExcludedPlayer
          ? 0
          : Math.min(2.2, Math.max(0.5, Number((0.45 + finalVote * 0.065).toFixed(1))));
        const exitCenter = isExcludedPlayer
          ? 0
          : Math.max(0.2, Math.round((finalVote + jitter * exitHalfWidth * 0.65) * 10) / 10);
        const exitMin = isExcludedPlayer
          ? 0
          : Math.max(0, Math.round((exitCenter - exitHalfWidth) * 10) / 10);
        const exitMax = isExcludedPlayer
          ? 0
          : Math.round((exitCenter + exitHalfWidth) * 10) / 10;

        // Phase 2 Progressive Estimate converging smoothly to finalVote as sectionsPct -> 100%
        const phase2Noise = isExcludedPlayer
          ? 0
          : jitter * Math.min(1.6, 0.35 + finalVote * 0.05) * phase2ErrorScale;
        const liveVote = isExcludedPlayer
          ? 0
          : isPhase3 || sectionsPct >= 100
            ? finalVote
            : Math.max(0.2, Math.round((finalVote + phase2Noise) * 10) / 10);

        const seat = election.seats.find((s) => s.partyId === party.id) ?? {
          camera: 0,
          senato: 0,
        };
        const prevSeat = previousParliamentSeats.find((s) => s.partyId === party.id) ?? {
          camera: 0,
          senato: 0,
        };

        const displayedSortValue = isPhase1 ? exitCenter : liveVote;

        return {
          party,
          finalVote,
          prePoll,
          pollDelta: Math.round((finalVote - prePoll) * 10) / 10,
          exitCenter,
          exitMin,
          exitMax,
          exitHalfWidth,
          liveVote,
          displayedSortValue,
          camera: seat.camera,
          senato: seat.senato,
          prevCamera: prevSeat.camera,
          prevSenato: prevSeat.senato,
          cameraDelta: seat.camera - prevSeat.camera,
          senatoDelta: seat.senato - prevSeat.senato,
          isExcludedPlayer,
        };
      })
      .sort((a, b) => b.displayedSortValue - a.displayedSortValue);
  }, [
    state.parties,
    state.playerPartyId,
    election,
    previousParliamentSeats,
    isPhase1,
    isPhase2,
    isPhase3,
    sectionsPct,
  ]);

  // Coalitions live rollup for Exit Poll / Head-to-Head
  const coalitionBlocks = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        label: string;
        voteSum: number;
        exitMinSum: number;
        exitMaxSum: number;
        cameraSeats: number;
        senatoSeats: number;
        color: string;
        includesPlayer: boolean;
        members: string[];
      }
    >();

    for (const row of partyRows) {
      const p = row.party;
      const key = p.coalitionId ? `coal_${p.coalitionId}` : `solo_${p.id}`;
      const label =
        p.coalitionId && p.coalitionId === player.coalitionId
          ? state.coalitionName
          : p.coalitionId === 'centrodestra'
            ? 'Coalizione di Centrodestra'
            : p.coalitionId === 'centrosinistra'
              ? 'Campo Largo Progressista'
              : p.coalitionId === 'centro'
                ? 'Polo Riformista di Centro'
                : p.name;

      const voteVal = isPhase1 ? row.exitCenter : row.liveVote;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          key,
          label,
          voteSum: voteVal,
          exitMinSum: row.exitMin,
          exitMaxSum: row.exitMax,
          cameraSeats: row.camera,
          senatoSeats: row.senato,
          color: p.color,
          includesPlayer: p.id === player.id,
          members: [p.acronym],
        });
      } else {
        existing.voteSum = Math.round((existing.voteSum + voteVal) * 10) / 10;
        existing.exitMinSum = Math.round((existing.exitMinSum + row.exitMin) * 10) / 10;
        existing.exitMaxSum = Math.round((existing.exitMaxSum + row.exitMax) * 10) / 10;
        existing.cameraSeats += row.camera;
        existing.senatoSeats += row.senato;
        existing.includesPlayer = existing.includesPlayer || p.id === player.id;
        existing.members.push(p.acronym);
      }
    }

    return Array.from(map.values()).sort((a, b) => b.voteSum - a.voteSum);
  }, [partyRows, player, state.coalitionName, isPhase1]);

  // Parties hovering near the 3% threshold (for Phase 2 Radar)
  const thresholdWatchRows = useMemo(() => {
    return partyRows
      .filter((r) => !r.isExcludedPlayer && r.liveVote >= 1.6 && r.liveVote <= 4.6)
      .sort((a, b) => Math.abs(a.liveVote - 3.0) - Math.abs(b.liveVote - 3.0))
      .slice(0, 6);
  }, [partyRows]);

  // Head-to-head matchups for Phase 2
  const headToHeadMatchups = useMemo(() => {
    const items: {
      title: string;
      leftLabel: string;
      leftVal: number;
      leftColor: string;
      rightLabel: string;
      rightVal: number;
      rightColor: string;
      gap: number;
    }[] = [];

    if (partyRows.length >= 2) {
      const a = partyRows[0];
      const b = partyRows[1];
      items.push({
        title: 'Duello Primo Partito Nazionale',
        leftLabel: a.party.acronym,
        leftVal: a.liveVote,
        leftColor: a.party.color,
        rightLabel: b.party.acronym,
        rightVal: b.liveVote,
        rightColor: b.party.color,
        gap: Math.round(Math.abs(a.liveVote - b.liveVote) * 10) / 10,
      });
    }

    if (coalitionBlocks.length >= 2) {
      const c1 = coalitionBlocks[0];
      const c2 = coalitionBlocks[1];
      items.push({
        title: 'Testa a Testa tra Coalizioni',
        leftLabel: c1.label,
        leftVal: c1.voteSum,
        leftColor: c1.color,
        rightLabel: c2.label,
        rightVal: c2.voteSum,
        rightColor: c2.color,
        gap: Math.round(Math.abs(c1.voteSum - c2.voteSum) * 10) / 10,
      });
    }

    const playerIdx = partyRows.findIndex((r) => r.party.id === state.playerPartyId);
    if (playerIdx >= 0 && !partyRows[playerIdx].isExcludedPlayer) {
      const pRow = partyRows[playerIdx];
      const neighbor =
        playerIdx > 0
          ? partyRows[playerIdx - 1]
          : partyRows[1] ?? null;
      if (neighbor && neighbor.party.id !== pRow.party.id && !(playerIdx === 0 && partyRows[1] === neighbor)) {
        items.push({
          title: `Sfida Diretta di ${pRow.party.acronym}`,
          leftLabel: pRow.party.acronym,
          leftVal: pRow.liveVote,
          leftColor: pRow.party.color,
          rightLabel: neighbor.party.acronym,
          rightVal: neighbor.liveVote,
          rightColor: neighbor.party.color,
          gap: Math.round(Math.abs(pRow.liveVote - neighbor.liveVote) * 10) / 10,
        });
      }
    }

    return items;
  }, [partyRows, coalitionBlocks, state.playerPartyId]);

  const playerRow = partyRows.find((r) => r.party.id === state.playerPartyId)!;

  const pressVerdict = useMemo(
    () =>
      buildPressVerdict({
        player,
        finalVote: playerRow?.finalVote ?? player.nationalPoll,
        prePoll: playerRow?.prePoll ?? player.previousPoll,
        newCamera: playerRow?.camera ?? 0,
        newSenato: playerRow?.senato ?? 0,
        prevCamera: playerRow?.prevCamera ?? 0,
        prevSenato: playerRow?.prevSenato ?? 0,
        playerRole: election.playerRole,
        excluded: Boolean(election.playerExcludedFromBallot),
        winningCoalitionName: election.winningCoalitionName,
      }),
    [player, playerRow, election]
  );

  // If the player opened Quirinale Consultations after Phase 3
  if (hasMajorityForQuirinale && consultationsOpen) {
    return (
      <QuirinaleConsultationsView
        state={state}
        onFormGovernment={(assignments, execAssignments) => {
          setConsultationsOpen(false);
          onFormGovernment(assignments, execAssignments);
        }}
        onDeclineMandate={() => {
          setConsultationsOpen(false);
          onDeclineMandate();
        }}
        onReviewResults={() => setConsultationsOpen(false)}
      />
    );
  }

  const currentPhase = ELECTION_PHASES[activePhaseIdx];

  const topThreeText = partyRows
    .slice(0, 3)
    .map((d) =>
      isPhase1
        ? `${d.party.acronym} ${d.exitMin.toFixed(1)}–${d.exitMax.toFixed(1)}%`
        : `${d.party.acronym} ${d.liveVote.toFixed(1)}%`
    )
    .join(' · ');

  const tickerItems: string[] = [
    `SPECIALE ELEZIONI · ${currentPhase.shortLabel.toUpperCase()}`,
    `AFFLUENZA NAZIONALE: ${election.turnout.toFixed(1)}%`,
    isPhase2
      ? `SEZIONI SCRUTINATE: ${sectionsCounted.toLocaleString('it-IT')} / ${TOTAL_ITALIAN_SECTIONS.toLocaleString('it-IT')} (${sectionsPct}%)`
      : isPhase1
        ? `ORE 23:00 · URNE CHIUSE IN TUTTE LE 20 REGIONI`
        : `SCRUTINIO DEFINITIVO 100% · CAMERA 400 / SENATO 200`,
    `PODIO: ${topThreeText}`,
    playerRow
      ? isPhase1
        ? `${player.acronym} EXIT POLL: ${playerRow.exitMin.toFixed(1)}% – ${playerRow.exitMax.toFixed(1)}%`
        : `${player.acronym}: ${playerRow.liveVote.toFixed(1)}%${isPhase3 ? ` · ${playerRow.camera} Deputati / ${playerRow.senato} Senatori` : ' (dato parziale)'}`
      : '',
    isPhase3
      ? `MAGGIORANZA CAMERA (201): ${election.winningCoalitionName} a ${election.winningCoalitionCamera} seggi · ${playerBlocLabel} a ${election.playerCoalitionCamera} seggi`
      : `SOGLIA DI SBARRAMENTO 3%: riflettori puntati sulle liste tra 2% e 4%`,
  ].filter(Boolean);

  const roleAccent =
    election.playerRole === 'premier'
      ? 'border-amber-500/70 bg-amber-500/10 text-amber-300'
      : election.playerRole === 'partner_governo'
        ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
        : election.playerRole === 'capo_opposizione'
          ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-300'
          : 'border-rose-500/60 bg-rose-500/10 text-rose-300';

  const handleStartCount = () => {
    playTactileClick();
    onAdvanceElectionStage(false);
  };

  const handleStepForwardCount = () => {
    playTactileClick();
    if (checkpointIdx < PROGRESS_CHECKPOINTS.length - 1) {
      setCheckpointIdx((prev) => Math.min(PROGRESS_CHECKPOINTS.length - 1, prev + 1));
    } else {
      onAdvanceElectionStage(true);
    }
  };

  const handleSkipToFinal = () => {
    playTactileClick();
    onAdvanceElectionStage(true);
  };

  return (
    <div className="h-full max-h-[100dvh] flex flex-col overflow-hidden">
      {/* Main Scrollable Election Night Broadcast Area */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden war-scroll safe-area-scroll-bottom p-3 sm:p-4 lg:p-5">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Broadcast Header & 3-Phase Stepper */}
          <section className="bg-[#111827] border border-amber-500/45 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono">
                  <span className="inline-flex items-center gap-1.5 text-rose-400 font-bold">
                    <Radio className="w-3.5 h-3.5 shrink-0" />
                    <span>NOTTE ELETTORALE</span>
                  </span>
                  <span className="text-slate-600" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-amber-300">{election.dateLabel}</span>
                  <span className="text-slate-600" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-slate-200 tabular-nums">
                    Affluenza {election.turnout.toFixed(1)}%
                  </span>
                  {isPhase2 && (
                    <>
                      <span className="text-slate-600" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-cyan-300 tabular-nums inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{getClockForSectionProgress(sectionsPct)}</span>
                      </span>
                    </>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-50 mt-1">
                  {currentPhase.title}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  {currentPhase.subtitle}
                </p>
              </div>

              {/* Phase-Specific Action Controls */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {isPhase1 && (
                  <>
                    <button
                      type="button"
                      onClick={handleStartCount}
                      className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                    >
                      <span>Avvia lo Scrutinio</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={handleSkipToFinal}
                      className="px-3.5 py-2.5 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                    >
                      <SkipForward className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Salta ai Definitivi</span>
                    </button>
                  </>
                )}

                {isPhase2 && (
                  <>
                    {!phase2Completed ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            playTactileClick();
                            setCountingPaused((v) => !v);
                          }}
                          className="px-3 py-2 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                        >
                          {countingPaused ? (
                            <Play className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Pause className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                          <span>{countingPaused ? 'Riprendi' : 'Pausa'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            playTactileClick();
                            setCountingSpeed((s) => (s === 1 ? 2 : 1));
                          }}
                          className={`px-3 py-2 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                            countingSpeed === 2
                              ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200'
                              : 'bg-[#090D16] hover:bg-slate-800 border-slate-700 text-slate-300'
                          }`}
                        >
                          <Gauge className="w-3.5 h-3.5 shrink-0" />
                          <span>Velocità {countingSpeed}x</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleStepForwardCount}
                          className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                        >
                          <span>Avanza Sezioni</span>
                          <FastForward className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSkipToFinal}
                        className="px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                      >
                        <span>Risultati Definitivi &amp; Seggi</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </button>
                    )}

                    {!phase2Completed && (
                      <button
                        type="button"
                        onClick={handleSkipToFinal}
                        className="px-3 py-2 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                      >
                        <SkipForward className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Salta</span>
                      </button>
                    )}
                  </>
                )}

                {isPhase3 && isExtraParliamentary && (
                  <>
                    <button
                      type="button"
                      onClick={onCompletePostElection}
                      className="px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Continua all&apos;Opposizione Extra-Parlamentare</span>
                    </button>
                    <button
                      type="button"
                      onClick={onDissolveParty}
                      className="px-3.5 py-2.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/50 text-xs font-semibold text-rose-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                      <span>Sciogli il Partito</span>
                    </button>
                  </>
                )}

                {isPhase3 && !isExtraParliamentary && (
                  <>
                    {hasMajorityForQuirinale ? (
                      <button
                        type="button"
                        onClick={() => {
                          playTactileClick();
                          setConsultationsOpen(true);
                        }}
                        className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                      >
                        <Landmark className="w-4 h-4 shrink-0" />
                        <span>Apri Consultazioni al Quirinale</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onCompletePostElection}
                        className="px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          {election.playerRole === 'premier' ||
                          election.playerRole === 'partner_governo'
                            ? 'Avvia Governo & Nuova Legislatura'
                            : 'Insediati in Parlamento (Opposizione)'}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onStartFreshGame}
                      className="px-3.5 py-2.5 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                      <span>Nuova Partita</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 3-Phase Stepper Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
              {ELECTION_PHASES.map((phase) => {
                const isDone = activePhaseIdx > phase.index || (isPhase3 && phase.index === 2);
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
                      <span>
                        Fase {phase.index + 1}/3 · {phase.timeLabel}
                      </span>
                      <span>
                        {isDone ? 'Completata' : isCurrent ? 'In onda' : 'In attesa'}
                      </span>
                    </div>
                    <div className="font-semibold mt-0.5 truncate">{phase.shortLabel}</div>
                  </div>
                );
              })}
            </div>

            {/* Phase 2 Live Section-Counting Progress Bar */}
            {isPhase2 && (
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-100">
                    Sezioni scrutinate (Viminale · Eligendo)
                  </span>
                  <div className="flex items-center gap-3 font-mono tabular-nums">
                    <span className="text-slate-400">
                      {sectionsCounted.toLocaleString('it-IT')} /{' '}
                      {TOTAL_ITALIAN_SECTIONS.toLocaleString('it-IT')} sezioni
                    </span>
                    <span className="text-cyan-300 font-bold text-sm">{sectionsPct}%</span>
                  </div>
                </div>
                <div className="h-2.5 w-full rounded-full bg-[#090D16] border border-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      phase2Completed ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                    style={{ width: `${sectionsPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-500">
                  <span>0% (Urne chiuse)</span>
                  <span className={sectionsPct >= 25 ? 'text-amber-300' : ''}>25%</span>
                  <span className={sectionsPct >= 60 ? 'text-amber-300' : ''}>60%</span>
                  <span className={sectionsPct >= 100 ? 'text-emerald-400 font-semibold' : ''}>
                    100% (Definitivo)
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* ================================================================= */}
          {/* FASE 1 — CHIUSURA URNE & EXIT POLL (ORE 23:00)                     */}
          {/* ================================================================= */}
          {isPhase1 && (
            <>
              {/* Key KPI Strip: National Turnout, Player Exit Poll Range, Leading Coalition */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-1">
                  <div className="text-xs text-slate-400">Affluenza Definitiva Nazionale</div>
                  <div className="font-mono text-2xl font-bold tabular-nums text-amber-300">
                    {election.turnout.toFixed(1)}%
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Dato consolidato su 61.417 sezioni alle ore 23:00
                  </div>
                </div>

                <div className="bg-[#111827] border border-cyan-500/40 rounded-xl p-4 space-y-1">
                  <div className="text-xs text-slate-400">
                    Forchetta Exit Poll · {player.name} ({player.acronym})
                  </div>
                  <div className="font-mono text-2xl font-bold tabular-nums text-cyan-300">
                    {playerRow.isExcludedPlayer
                      ? 'Non presente'
                      : `${playerRow.exitMin.toFixed(1)}% – ${playerRow.exitMax.toFixed(1)}%`}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {playerRow.isExcludedPlayer
                      ? 'Lista esclusa dalla scheda per firme insufficienti'
                      : `Margine di errore ±${playerRow.exitHalfWidth.toFixed(1)}% · Sondaggio vigilia: ${playerRow.prePoll.toFixed(1)}%`}
                  </div>
                </div>

                <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-1">
                  <div className="text-xs text-slate-400">Prima Coalizione negli Exit Poll</div>
                  <div className="font-display text-lg font-bold text-slate-50 truncate">
                    {coalitionBlocks[0]?.label ?? '—'}
                  </div>
                  <div className="font-mono text-xs tabular-nums text-emerald-300">
                    Stima {coalitionBlocks[0]?.exitMinSum.toFixed(1)}% –{' '}
                    {coalitionBlocks[0]?.exitMaxSum.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                {/* Exit Poll Ranges Table */}
                <section className="xl:col-span-7 bg-[#111827] border border-slate-800/90 rounded-xl p-4 sm:p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-100">
                      Forchette Exit Poll Nazionali (Ore 23:00)
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      Soglia sbarramento: 3,0%
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {partyRows.map((row) => {
                      const isPlayer = row.party.id === state.playerPartyId;
                      const barMax = Math.max(35, (partyRows[0]?.exitMax ?? 30) + 2);
                      const leftPct = Math.min(100, (row.exitMin / barMax) * 100);
                      const widthPct = Math.max(
                        1.5,
                        Math.min(100 - leftPct, ((row.exitMax - row.exitMin) / barMax) * 100)
                      );
                      const statusText = row.isExcludedPlayer
                        ? 'Esclusa'
                        : row.exitMin >= 3.0
                          ? 'Oltre 3%'
                          : row.exitMax >= 3.0
                            ? 'In bilico (3%)'
                            : 'Sotto 3%';
                      const statusClass = row.isExcludedPlayer
                        ? 'text-rose-400'
                        : row.exitMin >= 3.0
                          ? 'text-emerald-400'
                          : row.exitMax >= 3.0
                            ? 'text-amber-300'
                            : 'text-slate-500';

                      return (
                        <div
                          key={row.party.id}
                          className={`p-2.5 rounded-lg border ${
                            isPlayer
                              ? 'bg-cyan-500/10 border-cyan-500/45'
                              : 'bg-[#090D16] border-slate-800/80'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <PartyEmblem
                                emblem={row.party.emblem}
                                color={row.party.color}
                                customUrl={row.party.customEmblemUrl}
                                size={22}
                              />
                              <span
                                className={
                                  isPlayer
                                    ? 'font-bold text-cyan-200 truncate'
                                    : 'font-medium text-slate-200 truncate'
                                }
                              >
                                {row.party.name} ({row.party.acronym})
                              </span>
                            </div>

                            <div className="flex items-center gap-3 font-mono tabular-nums shrink-0">
                              <span className={`text-[11px] font-medium ${statusClass}`}>
                                {statusText}
                              </span>
                              <span className="font-bold text-slate-50">
                                {row.isExcludedPlayer
                                  ? '0.0%'
                                  : `${row.exitMin.toFixed(1)}% – ${row.exitMax.toFixed(1)}%`}
                              </span>
                            </div>
                          </div>

                          {/* Range bar visualizing statistical uncertainty */}
                          {!row.isExcludedPlayer && (
                            <div className="mt-2 relative h-2 rounded-full bg-slate-900 overflow-hidden">
                              <div
                                className="absolute top-0 bottom-0 rounded-full opacity-30"
                                style={{
                                  left: 0,
                                  width: `${Math.min(100, (row.exitCenter / barMax) * 100)}%`,
                                  backgroundColor: row.party.color,
                                }}
                              />
                              <div
                                className="absolute top-0 bottom-0 rounded-full"
                                style={{
                                  left: `${leftPct}%`,
                                  width: `${widthPct}%`,
                                  backgroundColor: row.party.color,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Coalition Exit Poll Overview + Call to Start Count */}
                <section className="xl:col-span-5 bg-[#111827] border border-slate-800/90 rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4">
                  <div className="space-y-4">
                    <div className="pb-2 border-b border-slate-800">
                      <h3 className="text-sm font-semibold text-slate-100">
                        Stima Coalizioni &amp; Poli (Exit Poll)
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Le forchette sommano le liste coalizzate: i collegi uninominali si decideranno nello scrutinio reale.
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {coalitionBlocks.slice(0, 5).map((block) => (
                        <div
                          key={block.key}
                          className={`p-3 rounded-lg border ${
                            block.includesPlayer
                              ? 'bg-cyan-500/8 border-cyan-500/45'
                              : 'bg-[#090D16] border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-slate-100 truncate">
                              {block.label}
                            </span>
                            <span className="font-mono font-bold tabular-nums text-slate-50 shrink-0">
                              {block.exitMinSum.toFixed(1)}% – {block.exitMaxSum.toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            Liste: {block.members.join(' · ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#090D16] border border-amber-500/35 space-y-3">
                    <div className="text-xs text-slate-200 leading-relaxed">
                      Gli istituti demoscopici stanno elaborando le prime schede reali dai seggi campione. Quando sei pronto, apri lo scrutinio progressivo del Viminale.
                    </div>
                    <button
                      type="button"
                      onClick={handleStartCount}
                      className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <span>Avanza allo Scrutinio Progressivo</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                </section>
              </div>
            </>
          )}

          {/* ================================================================= */}
          {/* FASE 2 — PROIEZIONI & SCRUTINIO PROGRESSIVO                       */}
          {/* ================================================================= */}
          {isPhase2 && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              {/* Left (7 cols): Live Progressive Results Table */}
              <section className="xl:col-span-7 bg-[#111827] border border-slate-800/90 rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-100">
                    Scrutinio Live · Sezioni al {sectionsPct}%
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                    {sectionsPct < 100
                      ? `Margine residuo ±${Math.max(0.1, ((100 - sectionsPct) / 100) * 1.1).toFixed(1)}%`
                      : 'Tutte le sezioni scrutinate'}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                        <th className="text-left font-medium py-2">Lista</th>
                        <th className="text-right font-medium py-2 px-2">Live %</th>
                        <th className="text-right font-medium py-2 px-2">vs Sondaggi</th>
                        <th className="text-right font-medium py-2">Soglia 3%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {partyRows.map((row) => {
                        const isPlayer = row.party.id === state.playerPartyId;
                        const liveDelta = Math.round((row.liveVote - row.prePoll) * 10) / 10;
                        const nearThreshold =
                          !row.isExcludedPlayer && row.liveVote >= 2.3 && row.liveVote <= 3.7;
                        const aboveThreshold = !row.isExcludedPlayer && row.liveVote >= 3.0;
                        return (
                          <tr
                            key={row.party.id}
                            className={isPlayer ? 'bg-cyan-500/10' : ''}
                          >
                            <td className="py-2.5 pr-2">
                              <div className="flex items-center gap-2">
                                <PartyEmblem
                                  emblem={row.party.emblem}
                                  color={row.party.color}
                                  customUrl={row.party.customEmblemUrl}
                                  size={22}
                                />
                                <span
                                  className={
                                    isPlayer
                                      ? 'font-bold text-cyan-200'
                                      : 'font-medium text-slate-200'
                                  }
                                >
                                  {row.party.name} ({row.party.acronym})
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono tabular-nums font-bold text-slate-50">
                              {row.liveVote.toFixed(1)}%
                            </td>
                            <td
                              className={`py-2.5 px-2 text-right font-mono tabular-nums ${
                                liveDelta > 0
                                  ? 'text-emerald-400'
                                  : liveDelta < 0
                                    ? 'text-rose-400'
                                    : 'text-slate-500'
                              }`}
                            >
                              {row.isExcludedPlayer
                                ? '—'
                                : `${liveDelta > 0 ? '+' : ''}${liveDelta.toFixed(1)}`}
                            </td>
                            <td className="py-2.5 text-right font-mono text-[11px] whitespace-nowrap">
                              {row.isExcludedPlayer ? (
                                <span className="text-rose-400">Esclusa</span>
                              ) : nearThreshold ? (
                                <span className="text-amber-300 font-semibold">
                                  Sul filo ({row.liveVote >= 3 ? 'In' : 'Out'})
                                </span>
                              ) : aboveThreshold ? (
                                <span className="text-emerald-400">Oltre soglia</span>
                              ) : (
                                <span className="text-slate-500">Sotto soglia</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Right (5 cols): Radar Soglia 3% + Testa a Testa Principali */}
              <div className="xl:col-span-5 space-y-4">
                {/* Radar Soglia 3% */}
                <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Radar Soglia di Sbarramento (3%)</span>
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">Rosatellum</span>
                  </div>

                  {thresholdWatchRows.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      Nessuna lista attualmente in bilico attorno alla soglia del 3,0%.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {thresholdWatchRows.map((row) => {
                        const isPlayer = row.party.id === state.playerPartyId;
                        const diff3 = Math.round((row.liveVote - 3.0) * 10) / 10;
                        const isIn = row.liveVote >= 3.0;
                        const isTight = Math.abs(diff3) <= 0.4;
                        return (
                          <div
                            key={row.party.id}
                            className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs ${
                              isPlayer
                                ? 'bg-cyan-500/10 border-cyan-500/50'
                                : 'bg-[#090D16] border-slate-800/80'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <PartyEmblem
                                emblem={row.party.emblem}
                                color={row.party.color}
                                customUrl={row.party.customEmblemUrl}
                                size={20}
                              />
                              <span className="font-semibold text-slate-100 truncate">
                                {row.party.name} ({row.party.acronym})
                              </span>
                            </div>
                            <div className="text-right font-mono tabular-nums shrink-0">
                              <div className="font-bold text-slate-50">
                                {row.liveVote.toFixed(1)}%
                              </div>
                              <div
                                className={`text-[10px] font-semibold ${
                                  isTight
                                    ? 'text-amber-300'
                                    : isIn
                                      ? 'text-emerald-400'
                                      : 'text-rose-400'
                                }`}
                              >
                                {isTight
                                  ? `Sul filo (${diff3 >= 0 ? '+' : ''}${diff3.toFixed(1)}%)`
                                  : isIn
                                    ? `Dentro (+${diff3.toFixed(1)}%)`
                                    : `Sotto (${diff3.toFixed(1)}%)`}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Testa a Testa Principali */}
                <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      <Swords className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Testa a Testa Principali</span>
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">Distacchi Live</span>
                  </div>

                  <div className="space-y-2.5">
                    {headToHeadMatchups.map((match) => {
                      const total = Math.max(0.1, match.leftVal + match.rightVal);
                      const leftShare = (match.leftVal / total) * 100;
                      return (
                        <div
                          key={match.title}
                          className="p-3 rounded-lg bg-[#090D16] border border-slate-800/80 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="text-slate-400 font-medium">{match.title}</span>
                            <span className="font-mono tabular-nums text-amber-300 font-semibold">
                              Distacco {match.gap.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums">
                            <span className="font-bold text-slate-100 truncate">
                              {match.leftLabel}{' '}
                              <span style={{ color: match.leftColor }}>
                                {match.leftVal.toFixed(1)}%
                              </span>
                            </span>
                            <span className="font-bold text-slate-100 truncate text-right">
                              <span style={{ color: match.rightColor }}>
                                {match.rightVal.toFixed(1)}%
                              </span>{' '}
                              {match.rightLabel}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-900 overflow-hidden flex">
                            <div
                              style={{
                                width: `${leftShare}%`,
                                backgroundColor: match.leftColor,
                              }}
                              className="h-full transition-all duration-500"
                            />
                            <div
                              style={{
                                width: `${100 - leftShare}%`,
                                backgroundColor: match.rightColor,
                              }}
                              className="h-full transition-all duration-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Phase 2 Completion Banner when 100% reached */}
                {phase2Completed && (
                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/50 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>100% delle sezioni scrutinate · Dato definitivo pronto</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSkipToFinal}
                      className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <span>Apri Risultati Definitivi, Seggi &amp; Analisi</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* FASE 3 — RISULTATI DEFINITIVI, SEGGI & ANALISI                    */}
          {/* ================================================================= */}
          {isPhase3 && (
            <>
              {/* Institutional Outcome Banner */}
              <section className={`rounded-xl border p-4 sm:p-5 ${roleAccent}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      {election.playerRole === 'premier' ? (
                        <Award className="w-4 h-4 shrink-0" />
                      ) : (
                        <Landmark className="w-4 h-4 shrink-0" />
                      )}
                      <span>
                        {election.playerExcludedFromBallot
                          ? 'Lista Esclusa dalla Scheda · Firme Insufficienti'
                          : isExtraParliamentary
                            ? 'Esito Elettorale · Opposizione Extra-Parlamentare'
                            : 'Verdetto Elettorale · Ripartizione Ufficiale delle Camere'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-50">{election.outcomeTitle}</h3>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {election.outcomeNarrative}
                    </p>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <div className="text-xs text-slate-300">
                      {hasAllies ? 'Tua Coalizione' : 'Tuo Partito'}
                    </div>
                    <div className="text-lg font-bold text-slate-50 mt-0.5">
                      {election.playerCoalitionCamera} Cam. / {election.playerCoalitionSenato} Sen.
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      Vincitrice: {election.winningCoalitionName} ({election.winningCoalitionCamera})
                    </div>
                  </div>
                </div>
              </section>

              {/* Press Front-Page Commentary & Player Delta Summary */}
              <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                <div className="lg:col-span-8 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <Newspaper className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-semibold text-slate-200">{pressVerdict.newspaper}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-300">{pressVerdict.kicker}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-50 leading-snug">
                    “{pressVerdict.headline}”
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {pressVerdict.analysis}
                  </p>
                </div>

                <div className="lg:col-span-4 grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800">
                    <div className="text-[11px] text-slate-400">Risultato {player.acronym}</div>
                    <div className="font-mono text-xl font-bold tabular-nums text-cyan-300 mt-0.5">
                      {playerRow.finalVote.toFixed(1)}%
                    </div>
                    <div
                      className={`text-[11px] font-mono tabular-nums mt-0.5 flex items-center gap-1 ${
                        playerRow.pollDelta > 0
                          ? 'text-emerald-400'
                          : playerRow.pollDelta < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                      }`}
                    >
                      {playerRow.pollDelta > 0 ? (
                        <TrendingUp className="w-3 h-3 shrink-0" />
                      ) : playerRow.pollDelta < 0 ? (
                        <TrendingDown className="w-3 h-3 shrink-0" />
                      ) : null}
                      <span>
                        {playerRow.pollDelta > 0 ? '+' : ''}
                        {playerRow.pollDelta.toFixed(1)}% vs sondaggi
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800">
                    <div className="text-[11px] text-slate-400">Seggi {player.acronym}</div>
                    <div className="font-mono text-lg font-bold tabular-nums text-slate-50 mt-0.5">
                      {playerRow.camera} C · {playerRow.senato} S
                    </div>
                    <div
                      className={`text-[11px] font-mono tabular-nums mt-0.5 ${
                        playerRow.cameraDelta + playerRow.senatoDelta > 0
                          ? 'text-emerald-400'
                          : playerRow.cameraDelta + playerRow.senatoDelta < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                      }`}
                    >
                      {playerRow.cameraDelta + playerRow.senatoDelta > 0 ? '+' : ''}
                      {playerRow.cameraDelta + playerRow.senatoDelta} vs prec.
                    </div>
                  </div>
                </div>
              </section>

              {/* Final Vote & Seat Table + Hemicycle & Macro-Area Winners */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <section className="xl:col-span-6 bg-[#111827] border border-slate-800/90 rounded-xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-slate-100">
                      Scrutinio Definitivo, Confronto &amp; Seggi
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      Δ vs Sondaggi / Seggi Prec.
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                          <th className="text-left font-medium py-2">Lista</th>
                          <th className="text-right font-medium py-2 px-1.5">Voti %</th>
                          <th className="text-right font-medium py-2 px-1.5">vs Sond.</th>
                          <th className="text-right font-medium py-2 px-1.5">Camera</th>
                          <th className="text-right font-medium py-2">Senato</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {partyRows.map((row) => {
                          const isPlayer = row.party.id === state.playerPartyId;
                          return (
                            <tr
                              key={row.party.id}
                              className={isPlayer ? 'bg-cyan-500/10' : ''}
                            >
                              <td className="py-2.5 pr-2">
                                <div className="flex items-center gap-2">
                                  <PartyEmblem
                                    emblem={row.party.emblem}
                                    color={row.party.color}
                                    customUrl={row.party.customEmblemUrl}
                                    size={22}
                                  />
                                  <span
                                    className={
                                      isPlayer
                                        ? 'font-bold text-cyan-300'
                                        : 'font-medium text-slate-200'
                                    }
                                  >
                                    {row.party.name} ({row.party.acronym})
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-1.5 text-right font-mono tabular-nums font-bold text-slate-50">
                                {row.finalVote.toFixed(1)}%
                              </td>
                              <td
                                className={`py-2.5 px-1.5 text-right font-mono tabular-nums ${
                                  row.pollDelta > 0
                                    ? 'text-emerald-400'
                                    : row.pollDelta < 0
                                      ? 'text-rose-400'
                                      : 'text-slate-500'
                                }`}
                              >
                                {row.isExcludedPlayer
                                  ? '—'
                                  : `${row.pollDelta > 0 ? '+' : ''}${row.pollDelta.toFixed(1)}`}
                              </td>
                              <td className="py-2.5 px-1.5 text-right font-mono tabular-nums text-slate-100 whitespace-nowrap">
                                <span>{row.camera}</span>
                                {row.cameraDelta !== 0 && (
                                  <span
                                    className={`ml-1 text-[10px] ${
                                      row.cameraDelta > 0 ? 'text-emerald-400' : 'text-rose-400'
                                    }`}
                                  >
                                    ({row.cameraDelta > 0 ? '+' : ''}
                                    {row.cameraDelta})
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 text-right font-mono tabular-nums text-slate-300 whitespace-nowrap">
                                <span>{row.senato}</span>
                                {row.senatoDelta !== 0 && (
                                  <span
                                    className={`ml-1 text-[10px] ${
                                      row.senatoDelta > 0 ? 'text-emerald-400' : 'text-rose-400'
                                    }`}
                                  >
                                    ({row.senatoDelta > 0 ? '+' : ''}
                                    {row.senatoDelta})
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

                <section className="xl:col-span-6 bg-[#111827] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between gap-4">
                  <HemicycleSvg
                    parties={state.parties}
                    seats={election.seats}
                    playerPartyId={state.playerPartyId}
                    isProjection={false}
                    title="Nuovo Emiciclo Eletto (Camera 400 / Senato 200)"
                    subtitle="Ripartizione definitiva dei seggi della nuova Legislatura"
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
            </>
          )}
        </div>
      </div>

      {/* Bottom Live TV Broadcast Scrolling Ticker */}
      <div
        role="region"
        aria-label="Ultime notizie diretta elettorale"
        className="shrink-0 bg-[#0B101D] border-t border-rose-500/45 overflow-hidden safe-area-bottom"
      >
        <div className="flex items-center overflow-hidden h-9">
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
    </div>
  );
};

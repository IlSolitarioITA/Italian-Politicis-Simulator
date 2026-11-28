import React, { useMemo, useState } from 'react';
import {
  LEADERSHIP_STYLES,
  LEADER_TRAITS,
  ORIENTATIONS,
  formatGameDate,
} from '../data/presets';
import { computeTvDuelImpactPreview, getActiveTraitProfile } from '../engine/simulation';
import {
  GameState,
  LeaderProfile,
  PartyState,
  TvDuelApproachId,
  TvDuelResultPayload,
  TvDuelTopicId,
} from '../types/game';
import { PartyEmblem } from './PartyEmblem';
import { playTactileClick, playTvDuelOutcome } from '../utils/soundEngine';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Flame,
  Newspaper,
  Swords,
  Trophy,
  Tv,
  X,
} from 'lucide-react';

interface TvDuelModalProps {
  state: GameState;
  opponentPartyId: string;
  onCancel: () => void;
  onCompleteDuel: (result: TvDuelResultPayload) => void;
}

interface DuelTopicConfig {
  id: TvDuelTopicId;
  label: string;
  moderatorQuestion: string;
  tacticLines: Record<
    TvDuelApproachId,
    {
      quote: string;
      winNote: string;
      loseNote: string;
    }
  >;
  rivalRetorts: Record<TvDuelApproachId, string>;
}

const DUEL_SHOWS = [
  'Faccia a Faccia Prima Serata',
  'Arena Sette · Speciale Duello',
  'Confronto Diretto TV',
  'Tribuna Nazionale 1v1',
];

const DUEL_TOPICS: DuelTopicConfig[] = [
  {
    id: 'economia',
    label: 'Economia',
    moderatorQuestion:
      'Inflazione, cuneo fiscale e debito pubblico: come rilanciare i redditi senza far esplodere lo spread BTP–Bund?',
    tacticLines: {
      dati_tecnici: {
        quote:
          '“Ecco le coperture riga per riga: taglio mirato del cuneo finanziato da lotta all’evasione e revisione della spesa.”',
        winNote: 'I numeri convincono lo studio e la grafica in sovrimpressione rafforza la tua credibilità.',
        loseNote: 'L’esposizione appare troppo tecnica per il pubblico della prima serata.',
      },
      affondo_populista: {
        quote:
          '“Basta prediche dai tecnici: le famiglie non arrivano a fine mese mentre banche e colossi accumulano extraprofitti!”',
        winNote: 'Applauso fragoroso in studio: il pubblico da casa premia il messaggio diretto.',
        loseNote: 'Il conduttore chiede le coperture in diretta e lo slogan perde smalto.',
      },
      attacco_avversario: {
        quote:
          '“Avete promesso miracoli fiscali per anni e avete lasciato solo tasse nascoste e bollette record!”',
        winNote: 'Colpo preciso: l’avversario balbetta sulla propria coerenza passata.',
        loseNote: 'L’avversario gira la frittata accusandoti di fare solo propaganda senza proposte.',
      },
    },
    rivalRetorts: {
      dati_tecnici: '“I vostri conti non tornano: senza crescita del PIL nessuna tabella regge.”',
      affondo_populista: '“Gli italiani sono stanchi di promesse irrealizzabili: servono fatti concreti.”',
      attacco_avversario: '“Chi ci attacca oggi è lo stesso che ieri ha bloccato le riforme chiave.”',
    },
  },
  {
    id: 'sanita',
    label: 'Sanità',
    moderatorQuestion:
      'Liste d’attesa infinite e pronto soccorso al collasso: da dove arrivano subito medici, infermieri e risorse per il SSN?',
    tacticLines: {
      dati_tecnici: {
        quote:
          '“Servono 4 miliardi strutturali per sbloccare il tetto alle assunzioni e digitalizzare il CUP unico nazionale.”',
        winNote: 'Piano sanitario concreto e verificabile: consenso trasversale tra famiglie e pensionati.',
        loseNote: 'Il pubblico percepisce le cifre come lontane dall’urgenza quotidiana negli ospedali.',
      },
      affondo_populista: {
        quote:
          '“Chi ha i soldi si cura domani nel privato, chi non li ha aspetta un anno: difenderemo la sanità pubblica con le unghie!”',
        winNote: 'Frase da titolo di apertura: impennata immediata nel televoto istantaneo.',
        loseNote: 'L’avversario ribatte che gli slogan non assumono un solo medico in corsia.',
      },
      attacco_avversario: {
        quote:
          '“Nelle regioni guidate dal vostro schieramento i pronto soccorso sono al tracollo e tagliate i reparti!”',
        winNote: 'L’affondo sul terreno regionale mette l’avversario sulla difensiva.',
        loseNote: 'L’avversario risponde citando dati sanitari locali che smentiscono l’accusa.',
      },
    },
    rivalRetorts: {
      dati_tecnici: '“Abbiamo già aumentato il Fondo Sanitario Nazionale a livelli record.”',
      affondo_populista: '“La salute degli italiani non è terreno per demagogia da talk show.”',
      attacco_avversario: '“Ricordiamo ai telespettatori chi ha tagliato 30 miliardi alla sanità in passato.”',
    },
  },
  {
    id: 'immigrazione',
    label: 'Immigrazione',
    moderatorQuestion:
      'Gestione dei flussi, sicurezza urbana e carenza di manodopera: qual è la vostra ricetta realistica per i prossimi cinque anni?',
    tacticLines: {
      dati_tecnici: {
        quote:
          '“Quote d’ingresso legate ai contratti reali, accordi bilaterali con i Paesi di origine e corridoi legali certificati.”',
        winNote: 'Approccio pragmatico apprezzato da imprese ed elettorato moderato.',
        loseNote: 'Su un tema così emotivo la linea tecnica fatica a scaldare gli spettatori.',
      },
      affondo_populista: {
        quote:
          '“Prima la sicurezza nei quartieri popolari e il rispetto rigoroso delle regole: basta ipocrisia dei salotti!”',
        winNote: 'Forte presa sul pubblico generalista: picco netto nel gradimento live.',
        loseNote: 'Tono giudicato eccessivo da una fetta di telespettatori moderati.',
      },
      attacco_avversario: {
        quote:
          '“Sbandierate soluzioni facili in TV, ma gli sbarchi e il degrado nelle stazioni smentiscono i vostri annunci!”',
        winNote: 'Affondo chirurgico: l’avversario perde la calma in diretta.',
        loseNote: 'L’avversario contrattacca ricordando le tue contraddizioni sui decreti flussi.',
      },
    },
    rivalRetorts: {
      dati_tecnici: '“Senza controllo delle frontiere esterne UE ogni piano resta sulla carta.”',
      affondo_populista: '“Noi difendiamo legalità e cittadini, non le teorie astratte.”',
      attacco_avversario: '“Sulla sicurezza avete sempre voltato la faccia dall’altra parte.”',
    },
  },
  {
    id: 'europa',
    label: 'Europa',
    moderatorQuestion:
      'Patto di Stabilità, PNRR e dazi globali: l’Italia deve cercare un’intesa con Bruxelles o alzare la voce in Consiglio Europeo?',
    tacticLines: {
      dati_tecnici: {
        quote:
          '“Scorporo degli investimenti strategici dal Patto di Stabilità e debito comune europeo per difesa, energia e industria.”',
        winNote: 'Profilo da statista europeo: lo studio applaude la competenza sul dossier Bruxelles.',
        loseNote: 'Il linguaggio comunitario risulta freddo per chi guarda da casa.',
      },
      affondo_populista: {
        quote:
          '“L’Italia è un Paese fondatore, non una colonia dei burocrati: prima gli interessi delle nostre fabbriche e agricoltori!”',
        winNote: 'Richiamo d’orgoglio nazionale che sposta subito l’ago del pubblico TV.',
        loseNote: 'Il conduttore ricorda i rischi sullo spread e la battuta si ritorce contro.',
      },
      attacco_avversario: {
        quote:
          '“A Roma fate i leoni, ma poi a Bruxelles votate tutto quello che vi chiedono senza portare a casa un risultato!”',
        winNote: 'Stoccata devastante: il rivale fatica a difendere i propri voti al Parlamento Europeo.',
        loseNote: 'L’avversario risponde rivendicando il proprio peso nelle trattative europee.',
      },
    },
    rivalRetorts: {
      dati_tecnici: '“L’Italia conta in Europa solo quando è credibile sui conti pubblici.”',
      affondo_populista: '“Non accettiamo lezioni da chi ha sempre detto sì a ogni vincolo di Bruxelles.”',
      attacco_avversario: '“Il vostro isolamento in Europa danneggia imprese e risparmiatori italiani.”',
    },
  },
  {
    id: 'lavoro',
    label: 'Lavoro',
    moderatorQuestion:
      'Salari fermi da vent’anni, precariato giovanile e impatto dell’IA: salario minimo legale o detassazione dei contratti?',
    tacticLines: {
      dati_tecnici: {
        quote:
          '“Contrattazione di secondo livello detassata al 5%, incentivi per under 35 e fondo nazionale per la riqualificazione IA.”',
        winNote: 'Soluzione bilanciata che convince lavoratori qualificati e piccole imprese.',
        loseNote: 'La proposta suona complessa rispetto alle risposte nette richieste in TV.',
      },
      affondo_populista: {
        quote:
          '“Un giovane laureato pagato 800 euro al mese è una vergogna nazionale: basta stage infiniti e paghe da fame!”',
        winNote: 'Clip virale sui social già durante la pubblicità: balzo del gradimento live.',
        loseNote: 'L’avversario ti accusa di non spiegare come aiutare le aziende a sostenere i costi.',
      },
      attacco_avversario: {
        quote:
          '“Parlate di lavoro ma avete difeso contratti pirata e bloccato ogni misura reale per alzare le buste paga!”',
        winNote: 'Colpo diretto sul nervo scoperto del rivale, che perde punti nel sondaggio flash.',
        loseNote: 'L’avversario ribalta l’accusa snocciolando i dati sull’occupazione.',
      },
    },
    rivalRetorts: {
      dati_tecnici: '“I salari crescono aumentando la produttività, non per decreto.”',
      affondo_populista: '“Chi lavora onestamente merita dignità subito, non chiacchiere da convegno.”',
      attacco_avversario: '“Avete lasciato i giovani precari per anni e ora scoprite il tema in campagna.”',
    },
  },
  {
    id: 'giustizia',
    label: 'Giustizia',
    moderatorQuestion:
      'Processi troppo lunghi, separazione delle carriere e scontro tra politica e magistratura: che riforma serve davvero ai cittadini?',
    tacticLines: {
      dati_tecnici: {
        quote:
          '“Assunzione di cancellieri, processo telematico integrale e tempi certi in ogni grado di giudizio secondo standard OCSE.”',
        winNote: 'Tono garantista e misurato: apprezzato dal pubblico stanco delle risse istituzionali.',
        loseNote: 'Troppo istituzionale: l’avversario ruba la scena con battute più incisive.',
      },
      affondo_populista: {
        quote:
          '“I cittadini onesti aspettano dieci anni per una sentenza mentre i furbi la fanno franca: serve giustizia rapida e severa!”',
        winNote: 'Messaggio chiaro e immediato: il pubblico in studio sostiene l’affondo.',
        loseNote: 'L’avversario ti accusa di populismo giudiziario e recupera terreno.',
      },
      attacco_avversario: {
        quote:
          '“Volete una giustizia forte coi deboli e indulgente con i vostri amici di partito indagati!”',
        winNote: 'Stoccata durissima che congela lo studio e manda in affanno l’avversario.',
        loseNote: 'L’accusa appare forzata e il pubblico premia la replica composta del rivale.',
      },
    },
    rivalRetorts: {
      dati_tecnici: '“La riforma della giustizia serve a far crescere l’economia e attrarre investimenti.”',
      affondo_populista: '“Rispettiamo la Costituzione e difendiamo i cittadini dalla mala giustizia.”',
      attacco_avversario: '“Usate la magistratura come clava politica perché non avete argomenti.”',
    },
  },
];

interface ApproachMeta {
  id: TvDuelApproachId;
  label: string;
  shortDesc: string;
  icon: React.ReactNode;
}

const APPROACHES: ApproachMeta[] = [
  {
    id: 'dati_tecnici',
    label: 'Dati Tecnici',
    shortDesc: 'Numeri, coperture e credibilità da statista.',
    icon: <BarChart3 className="w-4 h-4 text-cyan-400 shrink-0" />,
  },
  {
    id: 'affondo_populista',
    label: 'Affondo Populista',
    shortDesc: 'Messaggio diretto, impatto emotivo e televoto.',
    icon: <Flame className="w-4 h-4 text-amber-400 shrink-0" />,
  },
  {
    id: 'attacco_avversario',
    label: "Attacco all'Avversario",
    shortDesc: 'Colpo frontale sulle contraddizioni del rivale.',
    icon: <Swords className="w-4 h-4 text-rose-400 shrink-0" />,
  },
];

interface RoundOutcomeRecord {
  roundNumber: number;
  topic: DuelTopicConfig;
  playerApproach: TvDuelApproachId;
  opponentApproach: TvDuelApproachId;
  playerSuccessChance: number;
  outcome: 'ko' | 'win' | 'tie' | 'loss';
  outcomeLabel: string;
  swing: number;
  playerQuote: string;
  opponentQuote: string;
  note: string;
  shareAfter: number;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function pickThreeTopics(): DuelTopicConfig[] {
  const pool = [...DUEL_TOPICS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}

function getOpponentPreferredApproach(opponent: PartyState): TvDuelApproachId {
  switch (opponent.orientation) {
    case 'riformista':
    case 'moderato':
    case 'tecnopragmatico':
      return 'dati_tecnici';
    case 'populista':
    case 'territorialista':
    case 'conservatore':
      return 'affondo_populista';
    case 'progressista':
    case 'socialista':
    default:
      return 'attacco_avversario';
  }
}

function evaluateApproachFit(
  leader: LeaderProfile,
  playerParty: PartyState,
  opponent: PartyState,
  opponentApproval: number,
  playerApproval: number,
  topicId: TvDuelTopicId,
  approach: TvDuelApproachId,
  tvMult: number,
  tvTechBonus: number,
  spinDoctorLevel: number
): { chance: number; activeBonuses: string[] } {
  let chance = 52;
  const activeBonuses: string[] = [];

  const styleMeta = LEADERSHIP_STYLES.find((s) => s.id === leader.style);
  const orientMeta = ORIENTATIONS.find((o) => o.id === playerParty.orientation);
  const hasTrait = (id: LeaderProfile['traits'][number]) => leader.traits.includes(id);
  const traitLabel = (id: LeaderProfile['traits'][number]) =>
    LEADER_TRAITS.find((t) => t.id === id)?.label ?? id;

  // Leadership Style synergy
  if (approach === 'dati_tecnici') {
    if (leader.style === 'istituzionale') {
      chance += 15;
      activeBonuses.push(`${styleMeta?.label ?? 'Istituzionale'} +15%`);
    } else if (leader.style === 'stratega') {
      chance += 10;
      activeBonuses.push(`${styleMeta?.label ?? 'Stratega'} +10%`);
    } else if (leader.style === 'tribuno') {
      chance -= 5;
    }
  } else if (approach === 'affondo_populista') {
    if (leader.style === 'tribuno') {
      chance += 16;
      activeBonuses.push(`${styleMeta?.label ?? 'Tribuno'} +16%`);
    } else if (leader.style === 'carismatico') {
      chance += 12;
      activeBonuses.push(`${styleMeta?.label ?? 'Carismatico'} +12%`);
    } else if (leader.style === 'istituzionale') {
      chance -= 6;
    }
  } else if (approach === 'attacco_avversario') {
    if (leader.style === 'carismatico') {
      chance += 13;
      activeBonuses.push(`${styleMeta?.label ?? 'Carismatico'} +13%`);
    } else if (leader.style === 'stratega') {
      chance += 11;
      activeBonuses.push(`${styleMeta?.label ?? 'Stratega'} +11%`);
    } else if (leader.style === 'tribuno') {
      chance += 9;
      activeBonuses.push(`${styleMeta?.label ?? 'Tribuno'} +9%`);
    }
  }

  // Party Orientation synergy in live TV debates
  if (
    approach === 'dati_tecnici' &&
    (playerParty.orientation === 'tecnopragmatico' ||
      playerParty.orientation === 'riformista' ||
      playerParty.orientation === 'moderato')
  ) {
    const orientBonus = playerParty.orientation === 'tecnopragmatico' ? 9 : 6;
    chance += orientBonus;
    activeBonuses.push(`Partito ${orientMeta?.label ?? playerParty.orientation} +${orientBonus}%`);
  } else if (
    approach === 'affondo_populista' &&
    (playerParty.orientation === 'populista' ||
      playerParty.orientation === 'territorialista' ||
      playerParty.orientation === 'conservatore')
  ) {
    const orientBonus = playerParty.orientation === 'populista' ? 9 : 6;
    chance += orientBonus;
    activeBonuses.push(`Partito ${orientMeta?.label ?? playerParty.orientation} +${orientBonus}%`);
  } else if (
    approach === 'attacco_avversario' &&
    (playerParty.orientation === 'socialista' ||
      playerParty.orientation === 'progressista' ||
      playerParty.orientation === 'populista')
  ) {
    const orientBonus = 6;
    chance += orientBonus;
    activeBonuses.push(`Partito ${orientMeta?.label ?? playerParty.orientation} +${orientBonus}%`);
  }

  // Trait & Topic synergies (all 8 leader traits covered)
  if (hasTrait('oratore_tv')) {
    const bonus = approach === 'dati_tecnici' ? 7 : 12;
    chance += bonus;
    activeBonuses.push(`${traitLabel('oratore_tv')} +${bonus}%`);
  }

  if (hasTrait('economista') && approach === 'dati_tecnici') {
    const bonus = topicId === 'economia' || topicId === 'europa' ? 14 : 8;
    chance += bonus;
    activeBonuses.push(`${traitLabel('economista')} +${bonus}%`);
  }

  if (hasTrait('diplomazia_ue') && topicId === 'europa') {
    const bonus = approach === 'dati_tecnici' ? 14 : 7;
    chance += bonus;
    activeBonuses.push(`${traitLabel('diplomazia_ue')} +${bonus}%`);
  }

  if (hasTrait('ex_magistrato')) {
    if (topicId === 'giustizia' || topicId === 'immigrazione') {
      const bonus = approach === 'attacco_avversario' || approach === 'dati_tecnici' ? 13 : 6;
      chance += bonus;
      activeBonuses.push(`${traitLabel('ex_magistrato')} +${bonus}%`);
    } else if (approach === 'attacco_avversario') {
      chance += 6;
      activeBonuses.push(`${traitLabel('ex_magistrato')} +6%`);
    }
  }

  if (hasTrait('sindacalista') && (topicId === 'lavoro' || topicId === 'sanita')) {
    const bonus = approach === 'affondo_populista' || approach === 'dati_tecnici' ? 12 : 7;
    chance += bonus;
    activeBonuses.push(`${traitLabel('sindacalista')} +${bonus}%`);
  }

  if (hasTrait('fundraiser') && (topicId === 'economia' || topicId === 'lavoro')) {
    const bonus = approach === 'dati_tecnici' || approach === 'affondo_populista' ? 9 : 5;
    chance += bonus;
    activeBonuses.push(`${traitLabel('fundraiser')} +${bonus}%`);
  }

  if (hasTrait('maestro_social') && approach !== 'dati_tecnici') {
    chance += 8;
    activeBonuses.push(`${traitLabel('maestro_social')} +8%`);
  }

  if (hasTrait('volto_nuovo') && (approach === 'affondo_populista' || approach === 'attacco_avversario')) {
    chance += 7;
    activeBonuses.push(`${traitLabel('volto_nuovo')} +7%`);
  }

  // Additional profile TV bonus (subtle fine-tuning from getActiveTraitProfile)
  if (approach === 'dati_tecnici' && tvTechBonus > 0) {
    chance += Math.round(tvTechBonus * 0.4);
  }
  if (tvMult > 1.05) {
    chance += Math.round((tvMult - 1) * 14);
  } else if (tvMult < 0.96) {
    chance -= Math.round((1 - tvMult) * 14);
  }

  if (spinDoctorLevel > 0) {
    const spinBonus = spinDoctorLevel * 5;
    chance += spinBonus;
    activeBonuses.push(`Spin Doctor Lv.${spinDoctorLevel} +${spinBonus}%`);
  }

  // Relative approval & opponent strength adjustment
  const approvalGap = clamp(Math.round((playerApproval - opponentApproval) * 0.25), -8, 8);
  chance += approvalGap;

  // Opponent strong home turf penalty
  const oppPreferred = getOpponentPreferredApproach(opponent);
  if (oppPreferred === approach) {
    chance -= 4;
  }

  return {
    chance: clamp(chance, 24, 92),
    activeBonuses: activeBonuses.slice(0, 4),
  };
}

export const TvDuelModal: React.FC<TvDuelModalProps> = ({
  state,
  opponentPartyId,
  onCancel,
  onCompleteDuel,
}) => {
  const playerParty = state.parties.find((p) => p.id === state.playerPartyId)!;
  const opponentParty = state.parties.find((p) => p.id === opponentPartyId)!;

  const playerApproval = state.leaderApproval[playerParty.id] ?? 32;
  const opponentApproval = state.leaderApproval[opponentParty.id] ?? 32;

  const [showName] = useState<string>(
    () => DUEL_SHOWS[(state.week + opponentParty.id.length) % DUEL_SHOWS.length]
  );
  const [topics] = useState<DuelTopicConfig[]>(() => pickThreeTopics());
  const [roundIndex, setRoundIndex] = useState<number>(0);
  const [phase, setPhase] = useState<'choosing' | 'round_result' | 'verdict'>('choosing');
  const [playerShare, setPlayerShare] = useState<number>(() =>
    clamp(50 + Math.round((playerApproval - opponentApproval) * 0.12), 46, 54)
  );
  const [history, setHistory] = useState<RoundOutcomeRecord[]>([]);

  const dateLabel = formatGameDate(state.week).fullLabel;
  const currentTopic = topics[roundIndex];
  const opponentShare = 100 - playerShare;
  const lastRecord = history[history.length - 1] ?? null;

  const traitProfile = useMemo(() => getActiveTraitProfile(state), [state]);
  const spinDoctorLevel = state.partyInvestments?.spinDoctorLevel ?? 0;

  const approachEvaluations = useMemo(() => {
    if (!currentTopic) return null;
    return {
      dati_tecnici: evaluateApproachFit(
        state.leader,
        playerParty,
        opponentParty,
        opponentApproval,
        playerApproval,
        currentTopic.id,
        'dati_tecnici',
        traitProfile.tvMult,
        traitProfile.tvTechBonus,
        spinDoctorLevel
      ),
      affondo_populista: evaluateApproachFit(
        state.leader,
        playerParty,
        opponentParty,
        opponentApproval,
        playerApproval,
        currentTopic.id,
        'affondo_populista',
        traitProfile.tvMult,
        traitProfile.tvTechBonus,
        spinDoctorLevel
      ),
      attacco_avversario: evaluateApproachFit(
        state.leader,
        playerParty,
        opponentParty,
        opponentApproval,
        playerApproval,
        currentTopic.id,
        'attacco_avversario',
        traitProfile.tvMult,
        traitProfile.tvTechBonus,
        spinDoctorLevel
      ),
    };
  }, [
    state.leader,
    playerParty,
    opponentParty,
    opponentApproval,
    playerApproval,
    currentTopic,
    traitProfile.tvMult,
    traitProfile.tvTechBonus,
    spinDoctorLevel,
  ]);

  const handleChooseApproach = (approach: TvDuelApproachId) => {
    if (!currentTopic || !approachEvaluations) return;

    const evalInfo = approachEvaluations[approach];
    const roll = Math.random() * 100;
    const margin = evalInfo.chance - roll;

    const oppChoices: TvDuelApproachId[] = [
      getOpponentPreferredApproach(opponentParty),
      'dati_tecnici',
      'affondo_populista',
      'attacco_avversario',
    ];
    const opponentApproach = oppChoices[Math.floor(Math.random() * oppChoices.length)];

    let outcome: RoundOutcomeRecord['outcome'];
    let outcomeLabel: string;
    let swing: number;

    if (margin >= 26) {
      outcome = 'ko';
      outcomeLabel = 'Colpo da KO in Diretta';
      swing = 7 + Math.floor(Math.random() * 3); // +7..+9
    } else if (margin >= 4) {
      outcome = 'win';
      outcomeLabel = 'Round Vinto';
      swing = 4 + Math.floor(Math.random() * 3); // +4..+6
    } else if (margin >= -10) {
      outcome = 'tie';
      outcomeLabel = 'Scontro alla Pari';
      swing = Math.random() < 0.5 ? 1 : -1;
    } else {
      outcome = 'loss';
      outcomeLabel = 'In Difficoltà';
      swing = -(4 + Math.floor(Math.random() * 4)); // -4..-7
    }

    const nextShare = clamp(playerShare + swing, 18, 82);
    const tacticText = currentTopic.tacticLines[approach];
    const note = swing > 0 ? tacticText.winNote : tacticText.loseNote;

    const record: RoundOutcomeRecord = {
      roundNumber: roundIndex + 1,
      topic: currentTopic,
      playerApproach: approach,
      opponentApproach,
      playerSuccessChance: evalInfo.chance,
      outcome,
      outcomeLabel,
      swing,
      playerQuote: tacticText.quote,
      opponentQuote: currentTopic.rivalRetorts[opponentApproach],
      note,
      shareAfter: nextShare,
    };

    setPlayerShare(nextShare);
    setHistory((prev) => [...prev, record]);
    setPhase('round_result');
    playTvDuelOutcome(swing >= 0);
  };

  const handleNextStep = () => {
    if (roundIndex < 2) {
      playTactileClick();
      setRoundIndex((prev) => prev + 1);
      setPhase('choosing');
    } else {
      playTvDuelOutcome(playerShare >= 50);
      setPhase('verdict');
    }
  };

  const verdictPreview = useMemo(
    () => computeTvDuelImpactPreview(playerShare),
    [playerShare]
  );

  const handleConfirmFinish = () => {
    const roundsWon = history.filter((h) => h.swing > 1).length;
    const roundsLost = history.filter((h) => h.swing < -1).length;
    const roundsTied = history.length - roundsWon - roundsLost;

    const bestRound = [...history].sort((a, b) => Math.abs(b.swing) - Math.abs(a.swing))[0];
    const bestMomentSummary = bestRound
      ? `Momento decisivo su ${bestRound.topic.label} (${bestRound.swing >= 0 ? '+' : ''}${bestRound.swing}% nel televoto live).`
      : 'Confronto serrato su tutti e tre i temi in studio.';

    onCompleteDuel({
      opponentPartyId: opponentParty.id,
      showName,
      topics: topics.map((t) => t.id),
      topicLabels: topics.map((t) => t.label),
      finalPlayerShare: playerShare,
      finalOpponentShare: opponentShare,
      roundsWon,
      roundsLost,
      roundsTied,
      bestMomentSummary,
    });
  };

  const canCancel = history.length === 0;
  const approachLabelMap: Record<TvDuelApproachId, string> = {
    dati_tecnici: 'Dati Tecnici',
    affondo_populista: 'Affondo Populista',
    attacco_avversario: "Attacco all'Avversario",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tv-duel-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center safe-area-modal-backdrop sm:p-4 overflow-hidden"
    >
      <div className="w-full max-w-4xl max-h-[90dvh] overflow-y-auto overflow-x-hidden war-scroll safe-area-scroll-bottom bg-[#111827] border border-cyan-500/45 rounded-xl shadow-2xl p-4 sm:p-5 space-y-4">
        {/* Studio Header */}
        <header className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-800">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-rose-400 font-medium">
              <Tv className="w-4 h-4 shrink-0" />
              <span>Diretta TV 1v1</span>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <span className="text-cyan-300">{showName}</span>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <span className="font-mono text-slate-400">{dateLabel}</span>
            </div>
            <h2
              id="tv-duel-title"
              className="text-base sm:text-xl font-bold text-slate-50 leading-tight"
            >
              {state.leader.name} ({playerParty.acronym}) vs {opponentParty.leaderName} (
              {opponentParty.acronym})
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-xs font-semibold tabular-nums text-amber-300 bg-[#090D16] border border-slate-800 px-2.5 py-1 rounded-md">
              {phase === 'verdict' ? 'Verdetto Finale' : `Round ${roundIndex + 1} / 3`}
            </span>
            {canCancel && (
              <button
                type="button"
                onClick={onCancel}
                aria-label="Annulla Duello TV"
                className="p-1.5 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Live TV Audience Approval Bar (Tu vs Avversario) */}
        <section className="p-3.5 sm:p-4 rounded-xl bg-[#090D16] border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-200">
              Gradimento Pubblico TV (Live)
            </span>
            {lastRecord ? (
              <span
                className={`font-mono font-semibold tabular-nums ${
                  lastRecord.swing > 0
                    ? 'text-emerald-400'
                    : lastRecord.swing < 0
                      ? 'text-rose-400'
                      : 'text-slate-300'
                }`}
              >
                Round {lastRecord.roundNumber}: {lastRecord.swing >= 0 ? '+' : ''}
                {lastRecord.swing}% per te
              </span>
            ) : (
              <span className="font-mono text-slate-500">Televoto istantaneo attivo</span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* Player side */}
            <div className="flex items-center gap-2 min-w-0">
              <PartyEmblem
                emblem={playerParty.emblem}
                color={playerParty.color}
                customUrl={playerParty.customEmblemUrl}
                size={34}
              />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-100 whitespace-normal leading-tight break-words">
                  {state.leader.name}
                </div>
                <div className="text-[10px] text-cyan-400 font-mono">
                  {playerParty.acronym} · Tu
                </div>
              </div>
            </div>

            <div className="flex items-baseline gap-2 sm:gap-3 font-mono tabular-nums shrink-0">
              <span className="text-xl sm:text-2xl font-bold text-cyan-300">
                {playerShare}%
              </span>
              <span className="text-xs text-slate-600">vs</span>
              <span className="text-xl sm:text-2xl font-bold text-rose-300">
                {opponentShare}%
              </span>
            </div>

            {/* Opponent side */}
            <div className="flex items-center gap-2 min-w-0 justify-end text-right">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-100 whitespace-normal leading-tight break-words">
                  {opponentParty.leaderName}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {opponentParty.acronym}
                </div>
              </div>
              <PartyEmblem
                emblem={opponentParty.emblem}
                color={opponentParty.color}
                customUrl={opponentParty.customEmblemUrl}
                size={34}
              />
            </div>
          </div>

          {/* Dual Audience Bar */}
          <div className="relative h-3.5 rounded-full bg-slate-900 overflow-hidden flex border border-slate-800">
            <div
              style={{
                width: `${playerShare}%`,
                backgroundColor: playerParty.color,
              }}
              className="h-full transition-all duration-500"
            />
            <div
              style={{
                width: `${opponentShare}%`,
                backgroundColor: opponentParty.color,
              }}
              className="h-full transition-all duration-500 opacity-85"
            />
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-100/80 -translate-x-1/2"
            />
          </div>

          {/* 3-Round Progress Track */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {topics.map((topic, idx) => {
              const rec = history[idx];
              const isCurrent = phase !== 'verdict' && idx === roundIndex;
              return (
                <div
                  key={topic.id}
                  className={`px-2.5 py-1.5 rounded-md border text-[11px] flex items-center justify-between gap-1.5 ${
                    isCurrent
                      ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-200'
                      : rec
                        ? 'bg-[#111827] border-slate-700/80 text-slate-200'
                        : 'bg-[#0B101D] border-slate-800/70 text-slate-500'
                  }`}
                >
                  <span className="font-medium whitespace-normal leading-tight">
                    R{idx + 1} · {topic.label}
                  </span>
                  {rec && (
                    <span
                      className={`font-mono font-semibold tabular-nums shrink-0 ${
                        rec.swing > 0
                          ? 'text-emerald-400'
                          : rec.swing < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                      }`}
                    >
                      {rec.swing >= 0 ? '+' : ''}
                      {rec.swing}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* PHASE 1: Choose Tactical Approach */}
        {phase === 'choosing' && currentTopic && approachEvaluations && (
          <section className="space-y-3">
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#090D16] border border-slate-800 space-y-1.5">
              <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide">
                Tema del Round {roundIndex + 1} · {currentTopic.label}
              </div>
              <p className="text-sm text-slate-100 font-medium leading-relaxed">
                Domanda del conduttore: «{currentTopic.moderatorQuestion}»
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {APPROACHES.map((approach) => {
                const evalData = approachEvaluations[approach.id];
                const sampleQuote = currentTopic.tacticLines[approach.id].quote;
                const chanceColor =
                  evalData.chance >= 68
                    ? 'text-emerald-400'
                    : evalData.chance >= 52
                      ? 'text-cyan-300'
                      : 'text-amber-400';

                return (
                  <button
                    key={approach.id}
                    type="button"
                    onClick={() => handleChooseApproach(approach.id)}
                    className="p-3.5 rounded-xl bg-[#090D16] hover:bg-slate-900/90 border border-slate-800 hover:border-cyan-500/60 text-left flex flex-col justify-between gap-3 transition-colors cursor-pointer"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                          {approach.icon}
                          <span>{approach.label}</span>
                        </span>
                        <span className={`font-mono text-xs font-bold tabular-nums ${chanceColor}`}>
                          {evalData.chance}%
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-snug">
                        {approach.shortDesc}
                      </p>

                      <p className="text-[11px] text-slate-300 italic leading-relaxed border-t border-slate-800/80 pt-2">
                        {sampleQuote}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                      {evalData.activeBonuses.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1 whitespace-normal leading-snug">
                          <span className="text-[10px] text-emerald-400/90 font-mono font-semibold">
                            Bonus:
                          </span>
                          {evalData.activeBonuses.map((bonus) => (
                            <span
                              key={bonus}
                              className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/12 border border-emerald-500/30 text-[10px] text-emerald-300 font-mono whitespace-normal leading-snug"
                            >
                              {bonus}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500 font-mono whitespace-normal leading-snug">
                          Nessun bonus tratto specifico
                        </div>
                      )}
                      <div className="text-[11px] font-semibold text-cyan-300 flex items-center justify-between">
                        <span>Scegli mossa</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* PHASE 2: Round Result Breakdown */}
        {phase === 'round_result' && lastRecord && (
          <section className="space-y-3">
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                lastRecord.swing > 0
                  ? 'bg-emerald-950/20 border-emerald-500/45'
                  : lastRecord.swing < 0
                    ? 'bg-rose-950/20 border-rose-500/45'
                    : 'bg-[#090D16] border-slate-700'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] text-slate-400">
                    Esito Round {lastRecord.roundNumber} · {lastRecord.topic.label}
                  </div>
                  <h3
                    className={`text-base font-bold ${
                      lastRecord.swing > 0
                        ? 'text-emerald-300'
                        : lastRecord.swing < 0
                          ? 'text-rose-300'
                          : 'text-slate-100'
                    }`}
                  >
                    {lastRecord.outcomeLabel}
                  </h3>
                </div>
                <span
                  className={`font-mono text-base font-bold tabular-nums ${
                    lastRecord.swing > 0
                      ? 'text-emerald-400'
                      : lastRecord.swing < 0
                        ? 'text-rose-400'
                        : 'text-slate-300'
                  }`}
                >
                  {lastRecord.swing >= 0 ? '+' : ''}
                  {lastRecord.swing}% pubblico TV
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800 space-y-1">
                  <div className="text-[11px] font-semibold text-cyan-300">
                    {state.leader.name} · {approachLabelMap[lastRecord.playerApproach]}
                  </div>
                  <p className="text-slate-200 italic leading-relaxed">{lastRecord.playerQuote}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800 space-y-1">
                  <div className="text-[11px] font-semibold text-rose-300">
                    {opponentParty.leaderName} · {approachLabelMap[lastRecord.opponentApproach]}
                  </div>
                  <p className="text-slate-300 italic leading-relaxed">
                    {lastRecord.opponentQuote}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed">{lastRecord.note}</p>
            </div>

            <button
              type="button"
              onClick={handleNextStep}
              className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>
                {roundIndex < 2
                  ? `Passa al Round ${roundIndex + 2} di 3`
                  : 'Vedi Verdetto Finale del Duello'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </section>
        )}

        {/* PHASE 3: Final Verdict & Impact Summary */}
        {phase === 'verdict' && (
          <section className="space-y-4">
            <div className="p-4 rounded-xl bg-[#090D16] border border-amber-500/45 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-[11px] text-slate-400">Verdetto Finale Televoto</div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-50">
                      {verdictPreview.verdictLabel}
                    </h3>
                  </div>
                </div>
                <div className="font-mono text-lg font-bold tabular-nums text-cyan-300">
                  {playerShare}% — {opponentShare}%
                </div>
              </div>

              {/* Impact KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-lg bg-[#111827] border border-slate-800">
                  <div className="text-[10px] text-slate-400">Tuo Gradimento</div>
                  <div
                    className={`font-mono text-sm font-bold tabular-nums mt-0.5 ${
                      verdictPreview.playerApprovalDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {verdictPreview.playerApprovalDelta >= 0 ? '+' : ''}
                    {verdictPreview.playerApprovalDelta}%
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#111827] border border-slate-800">
                  <div className="text-[10px] text-slate-400">Consenso {playerParty.acronym}</div>
                  <div
                    className={`font-mono text-sm font-bold tabular-nums mt-0.5 ${
                      verdictPreview.playerPollDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {verdictPreview.playerPollDelta >= 0 ? '+' : ''}
                    {verdictPreview.playerPollDelta.toFixed(1)}%
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#111827] border border-slate-800">
                  <div className="text-[10px] text-slate-400">
                    Gradimento {opponentParty.acronym}
                  </div>
                  <div
                    className={`font-mono text-sm font-bold tabular-nums mt-0.5 ${
                      verdictPreview.opponentApprovalDelta <= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {verdictPreview.opponentApprovalDelta >= 0 ? '+' : ''}
                    {verdictPreview.opponentApprovalDelta}%
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#111827] border border-slate-800">
                  <div className="text-[10px] text-slate-400">
                    Consenso {opponentParty.acronym}
                  </div>
                  <div
                    className={`font-mono text-sm font-bold tabular-nums mt-0.5 ${
                      verdictPreview.opponentPollDelta <= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {verdictPreview.opponentPollDelta >= 0 ? '+' : ''}
                    {verdictPreview.opponentPollDelta.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Compact Round-by-Round Scorecard */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-semibold text-slate-300">
                  Riepilogo dei 3 Round
                </div>
                {history.map((item) => (
                  <div
                    key={item.roundNumber}
                    className="flex items-center justify-between gap-2 text-xs px-2.5 py-1.5 rounded-md bg-[#111827] border border-slate-800/80"
                  >
                    <div className="min-w-0 whitespace-normal leading-snug text-slate-200">
                      <span className="font-mono text-slate-500 mr-1.5">R{item.roundNumber}</span>
                      <span className="font-semibold">{item.topic.label}</span>
                      <span className="text-slate-400">
                        {' '}
                        · {approachLabelMap[item.playerApproach]}
                      </span>
                    </div>
                    <span
                      className={`font-mono font-semibold tabular-nums shrink-0 ${
                        item.swing > 0
                          ? 'text-emerald-400'
                          : item.swing < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                      }`}
                    >
                      {item.swing >= 0 ? '+' : ''}
                      {item.swing}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Front-Page Media Notice */}
              <div className="flex items-center gap-2 text-[11px] text-cyan-300 pt-1">
                <Newspaper className="w-3.5 h-3.5 shrink-0" />
                <span>
                  L’esito verrà pubblicato in Prima Pagina nel Feed Media della War Room.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmFinish}
              className="w-full py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Applica Esito del Duello TV</span>
            </button>
          </section>
        )}
      </div>
    </div>
  );
};

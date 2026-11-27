import {
  ActiveCrisis,
  ActiveDecreeLaw,
  ActiveReferendum,
  AllySatisfactionReport,
  BallotElectionType,
  BallotSignatureCampaign,
  BudgetAllocation,
  BudgetModifiers,
  ChapterLevel,
  CoalitionStatus,
  CrisisEvent,
  CrisisOption,
  CrisisOutcomeStats,
  DemographicId,
  ElectionResult,
  ElectoralLawId,
  EmblemId,
  ExecutiveMember,
  ExecutiveScandal,
  FundraisingState,
  GameMode,
  GameState,
  InquiryCommission,
  InstitutionalFlags,
  LawDefinition,
  LawVoteRecord,
  LeaderProfile,
  LeaderTraitId,
  LeadershipStyle,
  LegislativeInstrument,
  MacroRegionId,
  MediaItem,
  MinistryId,
  NewPartyDraft,
  OrientationId,
  PartyState,
  PendingBill,
  PoliticalAxis,
  PollSnapshot,
  QuirinaleBallotResult,
  QuirinaleCandidate,
  QuirinaleElectionState,
  ReferendumStance,
  ReferendumTemplate,
  RegimeStatus,
  RegionalChapterState,
  RegionId,
  SeatAllocation,
  StateIndicators,
  TvDuelResultPayload,
} from '../types/game';
import {
  DEMOGRAPHICS,
  EXISTING_PARTIES_2026,
  HISTORICAL_POLL_LABELS,
  INITIAL_GOVERNMENT_PARTY_IDS,
  LEADER_TRAITS,
  LEADERSHIP_STYLES,
  MACRO_REGIONS,
  MINOR_PARTIES_BASELINE,
  ORIENTATIONS,
  REAL_INITIAL_LEGISLATURE_SEATS,
  REPLACEMENT_CANDIDATES,
  buildDefaultLeaderApproval,
  createInitialExecutives,
  formatGameDate,
} from '../data/presets';
import {
  CHAPTER_TIERS,
  ITALIAN_REGIONS,
  REGION_MAP_BY_ID,
  getRegionChapterMetrics,
} from '../data/italyRegions';
import { CRISIS_POOL } from '../data/crises';
import { PARLIAMENT_LAWS } from '../data/laws';
import {
  BASELINE_ABROGATIVE_REFERENDUMS,
  buildAbrogativeTemplateForEnactedLaw,
  buildConstitutionalReferendumTemplate,
  getAvailableAbrogativeTemplates,
} from '../data/referendums';
import {
  KEY_MINISTRIES,
  ORIENTATION_PREFERRED_MINISTRIES,
  TOTAL_MINISTRY_WEIGHT,
  buildAutoMinistryExecutives,
  evaluateExecutiveMinistryAffinity,
  getMinistryById,
  getSpecializationLabel,
  pickBestExecutiveForMinistry,
} from '../data/ministries';
import {
  sanitizeAcronym,
  sanitizeCustomEmblemUrl,
  sanitizeHexColor,
  sanitizePlainText,
} from '../utils/sanitizer';

/** Soglie coerenti per le scissioni interne di partito */
export const SCHISM_MIN_POLL = 4.0;
export const SCHISM_CRITICAL_COHESION = 40;
export const SCHISM_REQUIRED_WEEKS = 3;

export function calculatePartyCohesion(executives: ExecutiveMember[]): number {
  if (!executives || executives.length === 0) return 70;
  const avg = executives.reduce((acc, e) => acc + e.loyalty, 0) / executives.length;
  return Math.round(avg);
}

export function isPartyCohesionCritical(executives: ExecutiveMember[]): boolean {
  if (!executives || executives.length === 0) return false;
  const avg = calculatePartyCohesion(executives);
  const hasOpenRebel = executives.some((e) => e.loyalty <= 24);
  return avg < SCHISM_CRITICAL_COHESION || (avg < 52 && hasOpenRebel);
}

interface SplinterTemplate {
  key: string;
  name: string;
  acronym: string;
  color: string;
  emblem: EmblemId;
  orientation: OrientationId;
  axisDelta: Partial<PoliticalAxis>;
  demoTilt: Record<DemographicId, number>;
  tagline: string;
}

const SPLINTER_TEMPLATES: Record<string, SplinterTemplate[]> = {
  liberale: [
    {
      key: 'lib_1',
      name: 'Area Liberale',
      acronym: 'AL',
      color: '#0284C7',
      emblem: 'bilancia',
      orientation: 'riformista',
      axisDelta: { economic: 32, europe: 26, institutions: -18 },
      demoTilt: { giovani: 1.0, lavoratori: 0.75, imprese: 1.35, pensionati: 0.9 },
      tagline: 'Scissione dell’ala liberale e pro-impresa, critica verso le derive stataliste.',
    },
    {
      key: 'lib_2',
      name: 'Riformisti Europei',
      acronym: 'RE',
      color: '#38BDF8',
      emblem: 'bussola',
      orientation: 'riformista',
      axisDelta: { economic: 26, europe: 34, institutions: -22 },
      demoTilt: { giovani: 1.15, lavoratori: 0.8, imprese: 1.25, pensionati: 0.85 },
      tagline: 'Nuova formazione riformista nata dal dissenso della componente europeista.',
    },
  ],
  identitaria: [
    {
      key: 'id_1',
      name: 'Identità & Nazione',
      acronym: 'IN',
      color: '#1D4ED8',
      emblem: 'aquila',
      orientation: 'conservatore',
      axisDelta: { society: -28, europe: -32, institutions: 18 },
      demoTilt: { giovani: 0.85, lavoratori: 1.15, imprese: 1.05, pensionati: 1.15 },
      tagline: 'Scissione dell’ala sovranista e identitaria in rottura con la segreteria.',
    },
    {
      key: 'id_2',
      name: 'Patria Sovrana',
      acronym: 'PSV',
      color: '#1E3A8A',
      emblem: 'scudo',
      orientation: 'conservatore',
      axisDelta: { society: -30, europe: -35, institutions: 20 },
      demoTilt: { giovani: 0.8, lavoratori: 1.15, imprese: 1.0, pensionati: 1.2 },
      tagline: 'Movimento conservatore nato dallo strappo dell’ala più intransigente.',
    },
  ],
  sociale: [
    {
      key: 'soc_1',
      name: 'Sinistra del Lavoro',
      acronym: 'SL',
      color: '#BE123C',
      emblem: 'ruota',
      orientation: 'socialista',
      axisDelta: { economic: -35, society: 22, europe: -10 },
      demoTilt: { giovani: 1.05, lavoratori: 1.35, imprese: 0.65, pensionati: 1.1 },
      tagline: 'Formazione nata dalla scissione dell’ala sociale e sindacale del partito.',
    },
    {
      key: 'soc_2',
      name: 'Democrazia & Lavoro',
      acronym: 'DLV',
      color: '#E11D48',
      emblem: 'stella',
      orientation: 'socialista',
      axisDelta: { economic: -30, society: 20, institutions: -15 },
      demoTilt: { giovani: 1.0, lavoratori: 1.3, imprese: 0.7, pensionati: 1.1 },
      tagline: 'Gruppo scissionista vicino al mondo del lavoro e dei diritti sociali.',
    },
  ],
  ecologista: [
    {
      key: 'eco_1',
      name: 'Fronte Ecologista',
      acronym: 'FE',
      color: '#15803D',
      emblem: 'ulivo',
      orientation: 'progressista',
      axisDelta: { society: 30, europe: 24, economic: -16 },
      demoTilt: { giovani: 1.4, lavoratori: 0.9, imprese: 0.75, pensionati: 0.85 },
      tagline: 'Scissione della componente ambientalista e giovanile per la transizione verde.',
    },
    {
      key: 'eco_2',
      name: 'Onda Verde Civica',
      acronym: 'OVC',
      color: '#10B981',
      emblem: 'sole',
      orientation: 'progressista',
      axisDelta: { society: 28, europe: 28, economic: -12 },
      demoTilt: { giovani: 1.35, lavoratori: 0.95, imprese: 0.8, pensionati: 0.85 },
      tagline: 'Movimento verde nato dalla frattura con la linea ufficiale del partito.',
    },
  ],
  moderata: [
    {
      key: 'mod_1',
      name: 'Centro Popolare',
      acronym: 'CP',
      color: '#2563EB',
      emblem: 'arco',
      orientation: 'moderato',
      axisDelta: { economic: 14, society: -8, europe: 26, institutions: -24 },
      demoTilt: { giovani: 0.85, lavoratori: 0.95, imprese: 1.15, pensionati: 1.2 },
      tagline: 'Scissione dei moderati e popolari in dissenso verso la linea della segreteria.',
    },
    {
      key: 'mod_2',
      name: 'Unione Civica Moderata',
      acronym: 'UCM',
      color: '#0D9488',
      emblem: 'scudo',
      orientation: 'moderato',
      axisDelta: { economic: 16, europe: 22, institutions: -22 },
      demoTilt: { giovani: 0.85, lavoratori: 0.95, imprese: 1.2, pensionati: 1.15 },
      tagline: 'Area moderata e istituzionale staccatasi per costruire un polo centrista.',
    },
  ],
  territoriale: [
    {
      key: 'ter_1',
      name: 'Autonomia & Territori',
      acronym: 'AT',
      color: '#16A34A',
      emblem: 'torre',
      orientation: 'territorialista',
      axisDelta: { economic: 10, europe: -14, society: -8 },
      demoTilt: { giovani: 0.9, lavoratori: 1.1, imprese: 1.2, pensionati: 1.0 },
      tagline: 'Scissione degli amministratori locali e delle federazioni territoriali.',
    },
    {
      key: 'ter_2',
      name: 'Patto dei Sindaci',
      acronym: 'PDS',
      color: '#059669',
      emblem: 'bussola',
      orientation: 'territorialista',
      axisDelta: { economic: 8, institutions: -14 },
      demoTilt: { giovani: 0.95, lavoratori: 1.1, imprese: 1.15, pensionati: 1.05 },
      tagline: 'Lista territoriale fondata da amministratori ed esponenti locali dissidenti.',
    },
  ],
  civica: [
    {
      key: 'civ_1',
      name: 'Alternativa Civica',
      acronym: 'AC',
      color: '#D97706',
      emblem: 'stella',
      orientation: 'populista',
      axisDelta: { economic: -12, europe: -18, institutions: -10 },
      demoTilt: { giovani: 1.15, lavoratori: 1.2, imprese: 0.85, pensionati: 0.95 },
      tagline: 'Movimento nato dalla base militante in rottura con i vertici del partito.',
    },
    {
      key: 'civ_2',
      name: 'Rete Popolare Libera',
      acronym: 'RPL',
      color: '#CA8A04',
      emblem: 'sole',
      orientation: 'populista',
      axisDelta: { economic: -15, europe: -20 },
      demoTilt: { giovani: 1.1, lavoratori: 1.25, imprese: 0.8, pensionati: 1.0 },
      tagline: 'Scissione dal basso contro le scelte verticistiche della direzione nazionale.',
    },
  ],
};

function selectSplinterWingKey(player: PartyState, rebelExec: ExecutiveMember): string {
  const f = `${rebelExec.faction} ${rebelExec.trait}`.toLowerCase();
  if (f.includes('clima') || f.includes('ecolog') || f.includes('verde') || f.includes('circolar')) {
    return 'ecologista';
  }
  if (f.includes('lavoro') || f.includes('social') || f.includes('welfare') || f.includes('sinistra')) {
    return 'sociale';
  }
  if (f.includes('patria') || f.includes('tradizion') || f.includes('destra') || f.includes('sovran')) {
    return 'identitaria';
  }
  if (f.includes('territor') || f.includes('sindac') || f.includes('amministrator') || f.includes('sud') || f.includes('nord') || f.includes('opere')) {
    return 'territoriale';
  }
  if (f.includes('popolar') || f.includes('cattolic') || f.includes('istituz') || f.includes('garant')) {
    return 'moderata';
  }
  if (f.includes('liberal') || f.includes('tesoro') || f.includes('impresa') || f.includes('mercat') || f.includes('europ') || f.includes('riformist')) {
    return 'liberale';
  }
  switch (player.orientation) {
    case 'conservatore':
      return player.axis.europe < -20 ? 'moderata' : 'identitaria';
    case 'progressista':
      return player.axis.economic < -20 ? 'liberale' : 'ecologista';
    case 'socialista':
      return player.axis.economic < -35 ? 'liberale' : 'sociale';
    case 'riformista':
    case 'tecnopragmatico':
      return 'moderata';
    case 'moderato':
      return player.axis.economic > 15 ? 'liberale' : 'territoriale';
    case 'territorialista':
      return 'territoriale';
    case 'populista':
    default:
      return 'civica';
  }
}

function buildSplinterParty(
  player: PartyState,
  rebelExec: ExecutiveMember,
  existingParties: PartyState[],
  shareRatio: number,
  defectedSeats?: { camera: number; senato: number }
): {
  splinter: PartyState;
  updatedPlayer: PartyState;
  actualLostPoll: number;
} {
  const wingKey = selectSplinterWingKey(player, rebelExec);
  const candidates = [
    ...(SPLINTER_TEMPLATES[wingKey] ?? []),
    ...Object.values(SPLINTER_TEMPLATES).flat(),
  ];

  const usedNames = new Set(existingParties.map((p) => p.name.toLowerCase()));
  const usedAcronyms = new Set(existingParties.map((p) => p.acronym.toUpperCase()));
  const usedColors = new Set(existingParties.map((p) => p.color.toLowerCase()));

  const chosen =
    candidates.find(
      (c) => !usedNames.has(c.name.toLowerCase()) && !usedAcronyms.has(c.acronym.toUpperCase())
    ) ?? candidates[0];

  let finalName = chosen.name;
  let finalAcronym = chosen.acronym;
  let suffix = 2;
  while (usedNames.has(finalName.toLowerCase())) {
    finalName = `${chosen.name} ${suffix}`;
    suffix += 1;
  }
  let acIdx = 2;
  while (usedAcronyms.has(finalAcronym.toUpperCase())) {
    finalAcronym = `${chosen.acronym.slice(0, 2)}${acIdx}`;
    acIdx += 1;
  }

  const fallbackPalette = [
    '#0EA5E9',
    '#F97316',
    '#14B8A6',
    '#A855F7',
    '#EC4899',
    '#84CC16',
    '#EAB308',
    '#6366F1',
  ];
  const finalColor = !usedColors.has(chosen.color.toLowerCase())
    ? chosen.color
    : fallbackPalette.find((c) => !usedColors.has(c.toLowerCase())) ?? '#F97316';

  const newAxis: PoliticalAxis = {
    economic: clamp(Math.round(player.axis.economic + (chosen.axisDelta.economic ?? 0)), -100, 100),
    society: clamp(Math.round(player.axis.society + (chosen.axisDelta.society ?? 0)), -100, 100),
    europe: clamp(Math.round(player.axis.europe + (chosen.axisDelta.europe ?? 0)), -100, 100),
    institutions: clamp(
      Math.round(player.axis.institutions + (chosen.axisDelta.institutions ?? 0)),
      -100,
      100
    ),
  };

  // Trasferimento diretto e coerente di consensi demografici e regionali dal partito del giocatore
  const updatedPlayerDemographics = { ...player.demographics };
  const splinterDemographics: Record<DemographicId, number> = {
    giovani: 0,
    lavoratori: 0,
    imprese: 0,
    pensionati: 0,
  };

  for (const d of DEMOGRAPHICS) {
    const base = player.demographics[d.id];
    const tilt = chosen.demoTilt[d.id] ?? 1.0;
    const transfer = clamp(round1(base * shareRatio * tilt), 0.3, Math.max(0.3, base - 1.2));
    splinterDemographics[d.id] = round1(transfer);
    updatedPlayerDemographics[d.id] = round1(Math.max(0.8, base - transfer));
  }

  const updatedPlayerRegionPolls = { ...player.regionPolls };
  const splinterRegionPolls = { ...player.regionPolls };
  for (const r of ITALIAN_REGIONS) {
    const base = player.regionPolls[r.id] ?? player.nationalPoll;
    const regionBias =
      wingKey === 'territoriale' && (r.macroRegion === 'sud' || r.macroRegion === 'nord_est')
        ? 1.2
        : wingKey === 'liberale' && (r.macroRegion === 'nord_ovest' || r.macroRegion === 'centro')
          ? 1.15
          : 1.0;
    const transfer = clamp(round1(base * shareRatio * regionBias), 0.3, Math.max(0.3, base - 1.0));
    splinterRegionPolls[r.id] = round1(transfer);
    updatedPlayerRegionPolls[r.id] = round1(Math.max(0.6, base - transfer));
  }

  const weightedDemoAvg = (demos: Record<DemographicId, number>) =>
    round1(DEMOGRAPHICS.reduce((acc, d) => acc + demos[d.id] * d.weight, 0));
  const splinterRegions = { ...player.regions };
  const updatedPlayerRegions = { ...player.regions };
  const splinterNatPoll = weightedDemoAvg(splinterDemographics);
  const updatedPlayerNatPoll = weightedDemoAvg(updatedPlayerDemographics);

  const splinter: PartyState = {
    id: uid('splinter'),
    name: finalName,
    acronym: finalAcronym,
    color: finalColor,
    emblem: chosen.emblem,
    orientation: chosen.orientation,
    axis: newAxis,
    leaderName: rebelExec.name,
    isPlayer: false,
    isInGovernment: false,
    coalitionId: null,
    demographics: splinterDemographics,
    regions: splinterRegions,
    regionPolls: splinterRegionPolls,
    nationalPoll: splinterNatPoll,
    previousPoll: 0,
    relationWithPlayer: -48,
    coalitionStatus: 'avversario',
    description: `${chosen.tagline} Guidata da ${rebelExec.name} (ex ${rebelExec.roleLabel} di ${player.acronym}, corrente ${rebelExec.faction}).`,
    isSplinterParty: true,
    splinterFromPartyId: player.id,
    splinterDefectedSeats:
      defectedSeats && (defectedSeats.camera > 0 || defectedSeats.senato > 0)
        ? defectedSeats
        : undefined,
  };

  const updatedPlayer: PartyState = {
    ...player,
    demographics: updatedPlayerDemographics,
    regions: updatedPlayerRegions,
    regionPolls: updatedPlayerRegionPolls,
    nationalPoll: updatedPlayerNatPoll,
  };

  return {
    splinter,
    updatedPlayer,
    actualLostPoll: round1(Math.max(0.5, player.nationalPoll - updatedPlayerNatPoll)),
  };
}

const NEWSPAPERS = [
  'Il Corriere Nazionale',
  'La Tribuna Politica',
  'Il Foglio Economico',
  'Cronaca di Palazzo',
  'L’Osservatore Italiano',
];

export const CAMPAIGN_ACTION_COSTS = {
  talk_show: 2000,
  social_campaign: 4500,
  territorial_tour: 6000,
  law_proposal: 3000,
  party_talks: 2000,
  committee_drive: 2500,
} as const;

export const EXECUTIVE_ACTION_COSTS = {
  colloquio: 0,
  incarico: 6000,
  sostituisci: 12000,
} as const;

export const COALITION_ACTION_COSTS = {
  proponi_alleanza: 2500,
  patto_governo: 2500,
  attacco: 3500,
  rompi_alleanza: 0,
} as const;

export const INQUIRY_COMMISSION_COST = 12000;

export const FUNDRAISING_BASE_REVENUE: Record<'cena' | 'crowdfunding' | 'gazebo', number> = {
  cena: 11000,
  crowdfunding: 7500,
  gazebo: 5500,
};

export interface ActiveTraitItem {
  source: 'partito' | 'stile' | 'tratto';
  title: string;
  badge: string;
  effects: string[];
}

export interface ActiveTraitProfile {
  tvMult: number;
  tvTechBonus: number;
  socialMult: number;
  socialCostMult: number;
  territorialMult: number;
  chapterCostMult: number;
  chapterUpkeepMult: number;
  fundraisingMult: number;
  membershipMult: number;
  overheadMult: number;
  coalitionBonus: number;
  diplomacyGainBonus: number;
  cohesionWeeklyBonus: number;
  colloquioBonus: number;
  quirinaleVetoMod: number;
  crisisDamageMult: number;
  scandalShieldMult: number;
  signatureMult: number;
  youthCrisisMult: number;
  weeklySpreadDrift: number;
  weeklyEuDrift: number;
  weeklyDemDrift: number;
  items: ActiveTraitItem[];
}

/**
 * Calcola in modo centralizzato tutti i modificatori reali derivanti da:
 * 1) Orientamento / identità del Partito
 * 2) Stile di Leadership del Leader
 * 3) Entrambi i Tratti Personali del Leader
 */
export function getActiveTraitProfile(
  state: Pick<GameState, 'parties' | 'playerPartyId' | 'leader'>
): ActiveTraitProfile {
  const player = state.parties.find((p) => p.id === state.playerPartyId);
  const orientation = player?.orientation ?? 'moderato';
  const style = state.leader?.style ?? 'istituzionale';
  const traits = state.leader?.traits ?? [];

  const profile: ActiveTraitProfile = {
    tvMult: 1.0,
    tvTechBonus: 0,
    socialMult: 1.0,
    socialCostMult: 1.0,
    territorialMult: 1.0,
    chapterCostMult: 1.0,
    chapterUpkeepMult: 1.0,
    fundraisingMult: 1.0,
    membershipMult: 1.0,
    overheadMult: 1.0,
    coalitionBonus: 0,
    diplomacyGainBonus: 0,
    cohesionWeeklyBonus: 0,
    colloquioBonus: 0,
    quirinaleVetoMod: 0,
    crisisDamageMult: 1.0,
    scandalShieldMult: 1.0,
    signatureMult: 1.0,
    youthCrisisMult: 1.0,
    weeklySpreadDrift: 0,
    weeklyEuDrift: 0,
    weeklyDemDrift: 0,
    items: [],
  };

  // 1. Tratto strutturale di Partito (Orientamento)
  const orientMeta = ORIENTATIONS.find((o) => o.id === orientation);
  switch (orientation) {
    case 'riformista':
      profile.fundraisingMult *= 1.15;
      profile.coalitionBonus += 6;
      profile.weeklySpreadDrift -= 1;
      profile.weeklyEuDrift += 1;
      profile.items.push({
        source: 'partito',
        title: orientMeta?.label ?? 'Riformista',
        badge: 'Identità Partito',
        effects: ['+15% raccolta fondi e donazioni', '+6 trattative di coalizione', 'Stabilizza Spread e rapporti UE'],
      });
      break;
    case 'conservatore':
      profile.cohesionWeeklyBonus += 1;
      profile.colloquioBonus += 2;
      profile.tvMult *= 1.1;
      profile.items.push({
        source: 'partito',
        title: orientMeta?.label ?? 'Conservatore',
        badge: 'Identità Partito',
        effects: ['+Coesione interna e lealtà dirigenti', '+10% efficacia dibattiti TV', 'Base elettorale più resiliente'],
      });
      break;
    case 'progressista':
      profile.socialMult *= 1.15;
      profile.membershipMult *= 1.12;
      profile.overheadMult *= 0.92;
      profile.items.push({
        source: 'partito',
        title: orientMeta?.label ?? 'Progressista / Ambientalista',
        badge: 'Identità Partito',
        effects: ['+15% efficacia campagne digitali', '+12% tesseramento e volontari', '-8% spese fisse di struttura'],
      });
      break;
    case 'populista':
      profile.tvMult *= 1.15;
      profile.fundraisingMult *= 1.1;
      profile.signatureMult *= 1.12;
      profile.coalitionBonus -= 5;
      profile.weeklyEuDrift -= 1;
      profile.items.push({
        source: 'partito',
        title: orientMeta?.label ?? 'Populista / Anti-sistema',
        badge: 'Identità Partito',
        effects: ['+15% impatto TV/Piazza e +12% firme', '+10% crowdfunding dal basso', 'Attrito con UE e partiti tradizionali'],
      });
      break;
    case 'socialista':
      profile.chapterCostMult *= 0.85;
      profile.chapterUpkeepMult *= 0.88;
      profile.membershipMult *= 1.15;
      profile.cohesionWeeklyBonus += 1;
      profile.items.push({
        source: 'partito',
        title: orientMeta?.label ?? 'Socialista / Lavoro',
        badge: 'Identità Partito',
        effects: ['-15% costo sezioni e -12% gestione circoli', '+15% gettito tesseramento', '+Coesione della segreteria'],
      });
      break;
    case 'moderato':
      profile.coalitionBonus += 10;
      profile.diplomacyGainBonus += 3;
      profile.quirinaleVetoMod -= 10;
      profile.crisisDamageMult *= 0.9;
      profile.items.push({
        source: 'partito',
        title: orientMeta?.label ?? 'Moderato / Popolare',
        badge: 'Identità Partito',
        effects: ['+10 punti trattative di coalizione', '-10% rischio veto del Quirinale', '-10% danni elettorali nelle crisi'],
      });
      break;
    case 'territorialista':
      profile.chapterCostMult *= 0.8;
      profile.chapterUpkeepMult *= 0.82;
      profile.territorialMult *= 1.2;
      profile.signatureMult *= 1.15;
      profile.items.push({
        source: 'partito',
        title: orientMeta?.label ?? 'Territorialista / Sud',
        badge: 'Identità Partito',
        effects: ['-20% costo apertura e -18% gestione sezioni', '+20% radicamento locale e tour', '+15% raccolta firme sul territorio'],
      });
      break;
    case 'tecnopragmatico':
      profile.tvTechBonus += 12;
      profile.overheadMult *= 0.88;
      profile.weeklySpreadDrift -= 1;
      profile.weeklyEuDrift += 1;
      profile.items.push({
        source: 'partito',
        title: orientMeta?.label ?? 'Tecno-Pragmatico',
        badge: 'Identità Partito',
        effects: ['+12% resa nei duelli e dossier tecnici', '-12% spese fisse di partito', 'Migliora Spread e credibilità UE'],
      });
      break;
  }

  // 2. Stile di Leadership del Leader
  const styleMeta = LEADERSHIP_STYLES.find((s) => s.id === style);
  switch (style) {
    case 'carismatico':
      profile.tvMult *= 1.2;
      profile.fundraisingMult *= 1.1;
      profile.items.push({
        source: 'stile',
        title: styleMeta?.label ?? 'Carismatico Mediatico',
        badge: 'Stile Leader',
        effects: ['+20% efficacia in Talk Show e Duelli TV', '+10% ricavi da eventi e cene'],
      });
      break;
    case 'istituzionale':
      profile.crisisDamageMult *= 0.85;
      profile.quirinaleVetoMod -= 12;
      profile.coalitionBonus += 6;
      profile.weeklySpreadDrift -= 1;
      profile.items.push({
        source: 'stile',
        title: styleMeta?.label ?? 'Statista Istituzionale',
        badge: 'Stile Leader',
        effects: ['-15% danno nelle crisi politiche', '-12% rischio veto del Quirinale', '+6 dialogo con alleati e stabilità Spread'],
      });
      break;
    case 'tribuno':
      profile.territorialMult *= 1.2;
      profile.signatureMult *= 1.15;
      profile.coalitionBonus -= 3;
      profile.items.push({
        source: 'stile',
        title: styleMeta?.label ?? 'Tribuno di Piazza',
        badge: 'Stile Leader',
        effects: ['+20% resa nei Tour e circoli locali', '+15% raccolta firme ai gazebo', 'Tono duro raffredda i partiti moderati'],
      });
      break;
    case 'stratega':
      profile.cohesionWeeklyBonus += 1;
      profile.colloquioBonus += 4;
      profile.coalitionBonus += 12;
      profile.diplomacyGainBonus += 5;
      profile.items.push({
        source: 'stile',
        title: styleMeta?.label ?? 'Stratega di Palazzo',
        badge: 'Stile Leader',
        effects: ['+12 trattative di coalizione e +5 rapporti nei vertici', '+Coesione interna e colloqui più efficaci'],
      });
      break;
  }

  // 3. Tratti Personali del Leader (2 tratti)
  for (const traitId of traits) {
    const meta = LEADER_TRAITS.find((t) => t.id === traitId);
    switch (traitId) {
      case 'oratore_tv':
        profile.tvMult *= 1.18;
        profile.items.push({
          source: 'tratto',
          title: meta?.label ?? 'Oratore Televisivo',
          badge: meta?.category ?? 'Media',
          effects: ['+18% impatto in Talk Show e Duelli TV', 'Sblocca repliche esclusive nelle crisi mediatiche'],
        });
        break;
      case 'economista':
        profile.tvTechBonus += 10;
        profile.weeklySpreadDrift -= 1;
        profile.overheadMult *= 0.94;
        profile.items.push({
          source: 'tratto',
          title: meta?.label ?? 'Economista di Scuola',
          badge: meta?.category ?? 'Finanza',
          effects: ['-6% spese fisse e Spread più stabile', '+10% efficacia su dossier economici e Bilancio'],
        });
        break;
      case 'sindacalista':
        profile.chapterCostMult *= 0.88;
        profile.membershipMult *= 1.15;
        profile.cohesionWeeklyBonus += 1;
        profile.items.push({
          source: 'tratto',
          title: meta?.label ?? 'Radicamento Sindacale',
          badge: meta?.category ?? 'Lavoro',
          effects: ['-12% costo sezioni e +15% tesseramento', '+Coesione e mediazione diretta nelle vertenze lavoro'],
        });
        break;
      case 'maestro_social':
        profile.socialCostMult *= 0.8;
        profile.socialMult *= 1.2;
        profile.items.push({
          source: 'tratto',
          title: meta?.label ?? 'Maestro dei Social',
          badge: meta?.category ?? 'Digitale',
          effects: ['-20% costo campagne digitali e +20% resa social', 'Sblocca contro-dossier virali nelle crisi'],
        });
        break;
      case 'ex_magistrato':
        profile.scandalShieldMult *= 0.5;
        profile.weeklyDemDrift += 1;
        profile.quirinaleVetoMod -= 6;
        profile.items.push({
          source: 'tratto',
          title: meta?.label ?? 'Ex Magistrato',
          badge: meta?.category ?? 'Giustizia',
          effects: ['-50% impatto elettorale degli scandali', '+Salute democratica e opzioni esclusive su legalità'],
        });
        break;
      case 'diplomazia_ue':
        profile.coalitionBonus += 8;
        profile.diplomacyGainBonus += 3;
        profile.weeklyEuDrift += 1;
        profile.items.push({
          source: 'tratto',
          title: meta?.label ?? 'Diplomazia Europea',
          badge: meta?.category ?? 'Esteri',
          effects: ['+8 trattative di coalizione e +Relazioni UE', 'Sblocca canali riservati con Bruxelles'],
        });
        break;
      case 'fundraiser':
        profile.fundraisingMult *= 1.28;
        profile.membershipMult *= 1.15;
        profile.items.push({
          source: 'tratto',
          title: meta?.label ?? 'Cacciatore di Fondi',
          badge: meta?.category ?? 'Cassa',
          effects: ['+28% ricavi da raccolta fondi ed eventi', '+15% gettito da campagne di tesseramento'],
        });
        break;
      case 'volto_nuovo':
        profile.youthCrisisMult *= 1.2;
        profile.signatureMult *= 1.12;
        profile.items.push({
          source: 'tratto',
          title: meta?.label ?? 'Volto Nuovo',
          badge: meta?.category ?? 'Consenso',
          effects: ['+20% slancio tra giovani e astensionisti', '+12% raccolta firme e opzioni di rinnovamento civico'],
        });
        break;
    }
  }

  return profile;
}

/** Calcola il costo effettivo di apertura/potenziamento di una sezione regionale tenendo conto dei tratti attivi */
export function getEffectiveChapterCost(
  state: Pick<GameState, 'parties' | 'playerPartyId' | 'leader'>,
  baseCost: number
): number {
  const traits = getActiveTraitProfile(state);
  return Math.max(1500, Math.round((baseCost * traits.chapterCostMult) / 250) * 250);
}

/**
 * Costruisce la distribuzione reale dei seggi della XIX Legislatura (400 Camera / 200 Senato).
 * Tutti i partiti non presenti in REAL_INITIAL_LEGISLATURE_SEATS hanno 0 seggi (extra-parlamentari).
 */
export function buildInitialLegislatureSeats(parties: PartyState[]): SeatAllocation[] {
  return parties.map((p) => {
    const real = REAL_INITIAL_LEGISLATURE_SEATS[p.id];
    return {
      partyId: p.id,
      camera: real?.camera ?? 0,
      senato: real?.senato ?? 0,
      coalitionId: p.coalitionId,
    };
  });
}

/**
 * Restituisce i seggi EFFETTIVI della Legislatura in carica (Camera 400 / Senato 200).
 * REGOLA FERREA: non ricalcola MAI i seggi dai sondaggi. I seggi cambiano solo alle elezioni o per scissione parlamentare.
 */
export function getCurrentParliamentSeats(
  state: Pick<GameState, 'legislatureSeats' | 'parties'>
): SeatAllocation[] {
  const baseSeats =
    Array.isArray(state.legislatureSeats) && state.legislatureSeats.length > 0
      ? state.legislatureSeats
      : buildInitialLegislatureSeats(state.parties);

  const byId = new Map<string, SeatAllocation>();
  for (const s of baseSeats) {
    byId.set(s.partyId, {
      partyId: s.partyId,
      camera: Math.max(0, Math.round(Number(s.camera) || 0)),
      senato: Math.max(0, Math.round(Number(s.senato) || 0)),
      coalitionId: s.coalitionId ?? null,
    });
  }

  return state.parties.map((p) => {
    const existing = byId.get(p.id);
    return {
      partyId: p.id,
      camera: existing?.camera ?? 0,
      senato: existing?.senato ?? 0,
      coalitionId: p.coalitionId,
    };
  });
}

/**
 * Ricavo realistico raccolta fondi conforme alla L. 13/2014 (tetto €100.000/anno per donatore,
 * zero finanziamento pubblico diretto). Scala col radicamento/consenso e i tratti del partito.
 */
export function getFundraisingReward(
  state: GameState,
  format: 'cena' | 'crowdfunding' | 'gazebo'
): number {
  const player = state.parties.find((p) => p.id === state.playerPartyId);
  const poll = Math.max(0, player?.nationalPoll ?? 0);
  const traits = getActiveTraitProfile(state);
  const raw =
    format === 'cena'
      ? Math.min(42000, Math.round(FUNDRAISING_BASE_REVENUE.cena + poll * 820))
      : format === 'crowdfunding'
        ? Math.min(28000, Math.round(FUNDRAISING_BASE_REVENUE.crowdfunding + poll * 520))
        : Math.min(22000, Math.round(FUNDRAISING_BASE_REVENUE.gazebo + poll * 320));
  return Math.round(raw * traits.fundraisingMult);
}

export interface WeeklyPartyFinances {
  /** Quota settimanale stimata 2×1000 IRPEF (solo partiti iscritti al Registro Nazionale) */
  twoPerThousand: number;
  /** Quote versate dai parlamentari eletti (+€450/sett. per deputato/senatore, €0 se 0 eletti) */
  parliamentaryContributions: number;
  /** Tesseramento nazionale (proporzionale a iscritti/consenso) e circoli regionali attivi */
  membershipAndHq: number;
  totalIncome: number;
  baseOverhead: number;
  hqUpkeep: number;
  totalExpenses: number;
  netBalance: number;
  electedSeats: number;
}

/** Returns the normalized map of regional chapters (level 1..3), auto-syncing from openHeadquarters if missing */
export function getNormalizedRegionalChapters(
  state: Pick<GameState, 'openHeadquarters' | 'regionalChapters' | 'week'>
): Partial<Record<RegionId, RegionalChapterState>> {
  const map: Partial<Record<RegionId, RegionalChapterState>> = {
    ...(state.regionalChapters ?? {}),
  };
  for (const regId of state.openHeadquarters ?? []) {
    if (!map[regId] || map[regId]!.level < 1) {
      map[regId] = {
        level: 1,
        openedAtWeek: state.week ?? 1,
        localMembers: 85,
      };
    }
  }
  return map;
}

/** Returns the active chapter level (0..3) for a given region */
export function getRegionChapterLevel(
  state: Pick<GameState, 'openHeadquarters' | 'regionalChapters'>,
  regionId: RegionId
): ChapterLevel {
  const ch = state.regionalChapters?.[regionId];
  if (ch && ch.level >= 1 && ch.level <= 3) return ch.level;
  return state.openHeadquarters?.includes(regionId) ? 1 : 0;
}

export const MAX_PLAYER_DEFICIT_FLOOR = -25000;
export const MAX_AI_DEFICIT_FLOOR = -15000;
export const EMERGENCY_FUNDRAISER_ACTION_KEY = 'emergency_volunteers';

export interface BudgetHealthStatus {
  level: 'ok' | 'low' | 'deficit';
  threshold: number;
  weeksOfRunway: number | null;
  headline: string;
  guidance: string;
  canRunEmergencyFundraiser: boolean;
}

export function getBudgetHealthStatus(state: GameState): BudgetHealthStatus {
  const finances = calculateWeeklyPartyFinances(state);
  const threshold = Math.max(10000, Math.round(finances.totalExpenses * 2));
  const weeksOfRunway =
    finances.netBalance < 0
      ? state.budget <= 0
        ? 0
        : Math.max(0, Math.floor(state.budget / Math.abs(finances.netBalance)))
      : null;
  const canRunEmergencyFundraiser = !state.actionsTakenThisWeek.includes(
    EMERGENCY_FUNDRAISER_ACTION_KEY
  );

  if (state.budget <= 0) {
    return {
      level: 'deficit',
      threshold,
      weeksOfRunway: 0,
      headline: 'Deficit di cassa: liquidità esaurita',
      guidance:
        'Le iniziative a pagamento sono sospese finché non torni in attivo. Puoi sempre usare l’Autofinanziamento Volontari (€0), il Crowdfunding (€0) o chiudere sedi superflue.',
      canRunEmergencyFundraiser,
    };
  }

  if (state.budget < threshold || (weeksOfRunway !== null && weeksOfRunway <= 3)) {
    return {
      level: 'low',
      threshold,
      weeksOfRunway,
      headline:
        weeksOfRunway !== null
          ? `Cassa bassa · autonomia stimata ${weeksOfRunway} sett.`
          : 'Cassa bassa · margine operativo ridotto',
      guidance:
        'Ricarica subito la cassa con iniziative a costo zero (Colletta Volontari, Tesseramento, 2×1000 o Crowdfunding) per evitare lo stop delle campagne.',
      canRunEmergencyFundraiser,
    };
  }

  return {
    level: 'ok',
    threshold,
    weeksOfRunway,
    headline: 'Cassa in equilibrio',
    guidance: 'Liquidità adeguata alle spese settimanali e alle campagne programmate.',
    canRunEmergencyFundraiser,
  };
}

/**
 * Scala la resa economica delle sezioni/circoli regionali in base alla reale presenza parlamentare:
 * un partito extra-parlamentare (0 seggi) raccoglie quote locali più contenute rispetto a una forza radicata in Parlamento.
 */
export function getChapterIncomeScaleForSeats(electedSeats: number): number {
  if (electedSeats <= 0) return 0.55;
  if (electedSeats < 25) return 0.8;
  return 1.0;
}

/**
 * Calcola il bilancio settimanale realistico del partito secondo il sistema italiano (L. 13/2014):
 * - Zero finanziamento pubblico diretto (abolito nel 2014)
 * - 2×1000 IRPEF legato soprattutto alla reale presenza parlamentare (quote simboliche/ridotte se 0 seggi)
 * - Contributi parlamentari (+€450/settimana per ogni deputato o senatore effettivamente eletto, €0 se 0 seggi)
 * - Tesseramento ordinario e circoli regionali proporzionati agli iscritti e alle sezioni attive
 */
export function calculateWeeklyPartyFinances(
  state: GameState,
  partiesOverride?: PartyState[]
): WeeklyPartyFinances {
  const parties = partiesOverride ?? state.parties;
  const player = parties.find((p) => p.id === state.playerPartyId);
  const poll = Math.max(0, player?.nationalPoll ?? 0);
  const traits = getActiveTraitProfile({
    parties,
    playerPartyId: state.playerPartyId,
    leader: state.leader,
  });

  // Regola ferrea: i contributi parlamentari spettano SOLO ai seggi realmente eletti nella Legislatura corrente
  const sittingSeats = getCurrentParliamentSeats({
    legislatureSeats: state.legislatureSeats,
    parties,
  });
  const playerSeatRow = sittingSeats.find((s) => s.partyId === state.playerPartyId);
  const electedSeats =
    state.committee.active || state.extraParliamentary
      ? 0
      : (playerSeatRow?.camera ?? 0) + (playerSeatRow?.senato ?? 0);

  const isExtraParl = state.committee.active || electedSeats === 0;
  const chapterIncomeScale = getChapterIncomeScaleForSeats(electedSeats);

  let hqUpkeep = 0;
  let hqMembership = 0;
  for (const reg of ITALIAN_REGIONS) {
    const level = getRegionChapterLevel(state, reg.id);
    if (level <= 0) continue;
    const metrics = getRegionChapterMetrics(reg, level);
    hqUpkeep += Math.round(metrics.weeklyUpkeep * traits.chapterUpkeepMult);
    hqMembership += Math.round(
      metrics.weeklyMembershipIncome * traits.membershipMult * chapterIncomeScale
    );
  }

  // 2×1000 IRPEF: la quota consistente dipende dai gruppi parlamentari eletti;
  // i partiti extra-parlamentari (0 seggi) ricevono una quota minima solo oltre lo 0,8% nei sondaggi.
  const twoPerThousand = state.committee.active
    ? 0
    : isExtraParl
      ? poll < 0.8
        ? 0
        : Math.round(Math.min(1350, 180 + poll * 175))
      : Math.round(
          (600 + poll * 1400) * Math.min(1, 0.4 + electedSeats / 40) + electedSeats * 65
        );

  const parliamentaryContributions = electedSeats * 450;
  const activeMembersCount = Math.max(0, state.fundraising?.activeMembersCount ?? 0);
  const activeMembersExtra = isExtraParl
    ? Math.min(1400, Math.round(activeMembersCount * 0.06))
    : Math.round((activeMembersCount * 1.15) / 10);

  const baseMembership = state.committee.active
    ? Math.round(800 + (state.committee.signatures ?? 0) / 22)
    : isExtraParl
      ? Math.round(
          (1550 + Math.min(poll, 12) * 195 + activeMembersExtra) * traits.membershipMult
        )
      : Math.round((900 + poll * 360 + activeMembersExtra) * traits.membershipMult);

  const membershipAndHq = baseMembership + hqMembership;
  const totalIncome = twoPerThousand + parliamentaryContributions + membershipAndHq;

  const econExec = state.executives.find((e) => e.role === 'economia');
  const overheadDiscount = (econExec?.competence ?? 70) >= 80 ? 0.9 : 1.0;
  // Tetto realistico ai costi fissi nazionali per partiti extra-parlamentari (anche su salvataggi esistenti)
  const effectiveWeeklyOverhead = isExtraParl
    ? Math.min(state.weeklyOverhead, state.committee.active ? 950 : 2800)
    : state.weeklyOverhead;
  const baseOverhead = Math.round(effectiveWeeklyOverhead * overheadDiscount * traits.overheadMult);
  const totalExpenses = baseOverhead + hqUpkeep;

  return {
    twoPerThousand,
    parliamentaryContributions,
    membershipAndHq,
    totalIncome,
    baseOverhead,
    hqUpkeep,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    electedSeats,
  };
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Moltiplicatore di visibilità realistico (stretto anche retroattivamente sui salvataggi esistenti):
 * - Sotto 1,5%: ×0.10 – ×0.15 (crescita lentissima di frazioni di punto per micro-partiti)
 * - Tra 1,5% e 5,0%: ×0.16 – ×0.30
 * - Tra 5,0% e 10,0%: ×0.30 – ×0.45
 * - Tra 10,0% e 20,0%: ×0.50
 * - Tra 20,0% e 28,0%: rendimenti decrescenti (×0.38 giù fino a ×0.22)
 * - Oltre 28,0%: ×0.16
 */
export function getPollVisibilityMultiplier(currentPoll: number, isPositiveGain = true): number {
  if (!isPositiveGain) {
    if (currentPoll < 1.2) return 0.45;
    if (currentPoll < 3.0) return 0.75;
    return 1.0;
  }
  if (currentPoll < 1.5) {
    return Number((0.1 + (Math.max(0, currentPoll) / 1.5) * 0.05).toFixed(3));
  }
  if (currentPoll < 5.0) {
    return Number((0.16 + ((currentPoll - 1.5) / 3.5) * 0.14).toFixed(3));
  }
  if (currentPoll < 10.0) {
    return Number((0.3 + ((currentPoll - 5.0) / 5.0) * 0.15).toFixed(3));
  }
  if (currentPoll <= 20.0) {
    return 0.5;
  }
  if (currentPoll <= 28.0) {
    return Number((0.38 - ((currentPoll - 20.0) / 8.0) * 0.16).toFixed(3));
  }
  return 0.16;
}

/**
 * Tetto massimo di crescita ordinaria settimanale (Weekly Cap ferreo, applicato anche ai salvataggi esistenti):
 * - Sotto 9,0% (partiti piccoli e medi): max +0,1% a settimana (passare dall'1-2% al 9% richiede una legislatura intera)
 * - Dal 9,0% in su (partiti grandi): max +0,2% a settimana
 */
export function getWeeklyMaxPollGrowthCap(weekStartPoll: number): number {
  if (weekStartPoll < 9.0) return 0.1;
  return 0.2;
}

function adjustLeaderApproval(
  approvalMap: Record<string, number> | undefined,
  partyId: string,
  delta: number,
  fallback = 30
): Record<string, number> {
  const next = { ...(approvalMap ?? {}) };
  const current = typeof next[partyId] === 'number' ? next[partyId] : fallback;
  next[partyId] = Math.round(clamp(current + delta, 5, 95));
  return next;
}

/** Ideological compatibility score between two parties across all 4 dynamic axes (0..100) */
export function computeIdeologicalCompatibility(a: PartyState, b: PartyState): number {
  const econDiff = Math.abs(a.axis.economic - b.axis.economic);
  const socDiff = Math.abs(a.axis.society - b.axis.society);
  const euDiff = Math.abs(a.axis.europe - b.axis.europe);
  const instDiff = Math.abs(a.axis.institutions - b.axis.institutions);
  const distance = econDiff * 0.34 + socDiff * 0.26 + euDiff * 0.22 + instDiff * 0.18;
  return Math.round(clamp(100 - distance * 0.58, 5, 98));
}

function applyAxisShift(axis: PoliticalAxis, shift?: Partial<PoliticalAxis>): PoliticalAxis {
  if (!shift) return axis;
  return {
    economic: Math.round(clamp(axis.economic + (shift.economic ?? 0), -100, 100)),
    society: Math.round(clamp(axis.society + (shift.society ?? 0), -100, 100)),
    europe: Math.round(clamp(axis.europe + (shift.europe ?? 0), -100, 100)),
    institutions: Math.round(clamp(axis.institutions + (shift.institutions ?? 0), -100, 100)),
  };
}

function applyStateEffects(
  indicators: StateIndicators,
  effects?: Partial<StateIndicators>
): StateIndicators {
  if (!effects) return indicators;
  return {
    spread: Math.round(clamp(indicators.spread + (effects.spread ?? 0), 65, 450)),
    socialStability: Math.round(
      clamp(indicators.socialStability + (effects.socialStability ?? 0), 0, 100)
    ),
    euRelations: Math.round(clamp(indicators.euRelations + (effects.euRelations ?? 0), 0, 100)),
    democraticHealth: Math.round(
      clamp(indicators.democraticHealth + (effects.democraticHealth ?? 0), 0, 100)
    ),
  };
}

function deriveRegimeStatus(
  flags: InstitutionalFlags,
  democraticHealth: number
): RegimeStatus {
  if (flags.fullPowers) return 'regime_autoritario';
  if (democraticHealth < 45) return 'democrazia_illiberale';
  return 'repubblica_parlamentare';
}

function isProInstitutionalParty(p: PartyState): boolean {
  return p.axis.europe >= 25 && p.axis.institutions <= -20;
}

/** Builds initial 20-region poll map from macro-region baselines + optional region overrides */
export function buildRegionPollsFromMacro(
  macroRegions: Record<MacroRegionId, number>,
  overrides?: Partial<Record<RegionId, number>>
): Record<RegionId, number> {
  const result = {} as Record<RegionId, number>;
  for (const reg of ITALIAN_REGIONS) {
    result[reg.id] = overrides?.[reg.id] ?? macroRegions[reg.macroRegion];
  }
  return result;
}

/**
 * Normalizes a non-negative vector of weights to tenths of a percent summing to EXACTLY 100.0%,
 * using Hamilton's largest-remainder method while strictly keeping exact 0.0 entries at 0.0.
 */
function normalizeToTenths100(rawValues: number[]): number[] {
  const safe = rawValues.map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
  const total = safe.reduce((acc, v) => acc + v, 0);
  if (total <= 0) return safe.map(() => 0);

  const TARGET_TENTHS = 1000;
  const exactTenths = safe.map((v) => (v / total) * TARGET_TENTHS);
  const floors = exactTenths.map((v) => Math.floor(v));
  let remainderTenths = TARGET_TENTHS - floors.reduce((acc, v) => acc + v, 0);

  const order = exactTenths
    .map((v, idx) => ({ idx, frac: v - floors[idx], positive: safe[idx] > 0 }))
    .filter((item) => item.positive)
    .sort((a, b) => b.frac - a.frac);

  for (let i = 0; i < remainderTenths && order.length > 0; i++) {
    floors[order[i % order.length].idx] += 1;
  }

  return floors.map((t) => t / 10);
}

/** Re-normalizes all parties across every demographic & all 20 regions so totals = 100.0%, derives macro-regions & nationalPoll */
export function normalizeAllPolls(parties: PartyState[]): PartyState[] {
  const cloned = parties.map((p) => ({
    ...p,
    demographics: { ...p.demographics },
    regions: { ...p.regions },
    regionPolls: p.regionPolls
      ? { ...p.regionPolls }
      : buildRegionPollsFromMacro(p.regions),
  }));

  // 1. Normalize each demographic to sum to exactly 100.0% (supports exact 0.0% for brand-new committees)
  for (const demo of DEMOGRAPHICS) {
    const raw = cloned.map((p) => {
      const floor = p.id === 'altri' ? 0.2 : 0;
      return Math.max(floor, p.demographics[demo.id] ?? 0);
    });
    const normalized = normalizeToTenths100(raw);
    cloned.forEach((p, idx) => {
      p.demographics[demo.id] = normalized[idx];
    });
  }

  // 2. Normalize each of the 20 Italian regions to sum to exactly 100.0%
  for (const reg of ITALIAN_REGIONS) {
    const raw = cloned.map((p) => {
      const floor = p.id === 'altri' ? 0.2 : 0;
      return Math.max(floor, p.regionPolls[reg.id] ?? 0);
    });
    const normalized = normalizeToTenths100(raw);
    cloned.forEach((p, idx) => {
      p.regionPolls[reg.id] = normalized[idx];
    });
  }

  // 3. Recompute 5 macro-regions as population-weighted average of their constituent 20 regions
  for (const macro of MACRO_REGIONS) {
    const subRegions = ITALIAN_REGIONS.filter((r) => r.macroRegion === macro.id);
    const weightSum = subRegions.reduce((acc, r) => acc + r.populationWeight, 0);
    const rawMacro = cloned.map((p) => {
      const weighted = subRegions.reduce(
        (acc, r) => acc + p.regionPolls[r.id] * r.populationWeight,
        0
      );
      return weighted / Math.max(0.001, weightSum);
    });
    const normMacro = normalizeToTenths100(rawMacro);
    cloned.forEach((p, idx) => {
      p.regions[macro.id] = normMacro[idx];
    });
  }

  // 4. Compute national poll as 50% demographic-weighted + 50% 20-region-weighted, normalized to exact 100.0%
  const rawNat = cloned.map((p) => {
    const demoAvg = DEMOGRAPHICS.reduce(
      (acc, d) => acc + p.demographics[d.id] * d.weight,
      0
    );
    const regAvg = ITALIAN_REGIONS.reduce(
      (acc, r) => acc + p.regionPolls[r.id] * r.populationWeight,
      0
    );
    const floor = p.id === 'altri' ? 0.2 : 0;
    return Math.max(floor, demoAvg * 0.5 + regAvg * 0.5);
  });
  const normNat = normalizeToTenths100(rawNat);
  cloned.forEach((p, idx) => {
    p.nationalPoll = normNat[idx];
  });

  return cloned;
}

export interface ElectoralShiftOptions {
  /** If true, skips the poll visibility multiplier & weekly cap (used for elections, schisms, government collapse) */
  bypassInertia?: boolean;
  /** Player party's national poll at the start of the week, used to enforce the Weekly Cap */
  weekStartPoll?: number;
}

/**
 * Calcola il peso di trasferimento per affinità ideologica (vasi comunicanti):
 * i voti acquisiti o persi da un partito fluiscono principalmente da/verso i partiti ideologicamente
 * contigui (e in parte verso l'astensione/altri), mai a caso verso il polo opposto.
 */
function computeAffinityFlowWeights(
  target: PartyState,
  others: PartyState[],
  getPoolValue: (p: PartyState) => number
): number[] {
  const altriIdx = others.findIndex((o) => o.id === 'altri');
  const rawPartyWeights = others.map((o) => {
    if (o.id === 'altri') return 0;
    const pool = Math.max(0.05, getPoolValue(o));
    const compat = computeIdeologicalCompatibility(target, o); // 5..98
    const sameCoalitionBoost =
      target.coalitionId && o.coalitionId === target.coalitionId ? 1.5 : 1.0;
    // Esponente elevato sull'affinità: ~80-85% dei flussi avviene tra partiti ideologicamente vicini
    const affinityFactor = Math.pow(Math.max(6, compat) / 50, 2.55) * sameCoalitionBoost;
    return Math.pow(pool, 0.72) * affinityFactor;
  });

  const partySum = rawPartyWeights.reduce((a, b) => a + b, 0);
  if (partySum <= 0) {
    return others.map(() => 1 / Math.max(1, others.length));
  }

  // L'area astensione / indecisi ('altri') assorbe o cede una quota cuscinetto realistica (14%-20%)
  const altriPool = altriIdx >= 0 ? Math.max(0.2, getPoolValue(others[altriIdx])) : 0;
  const altriShare = altriIdx >= 0 ? clamp(0.12 + altriPool * 0.014, 0.14, 0.21) : 0;
  const partyBudget = 1 - altriShare;

  return rawPartyWeights.map((w, idx) =>
    idx === altriIdx ? altriShare : (w / partySum) * partyBudget
  );
}

/**
 * Shifts a party's support in demographics, macro-regions, and/or specific 20 regions
 * with realistic Electoral Inertia (Visibility Multiplier + Weekly Cap) and Ideological Affinity Flows (Vasi Comunicanti).
 */
export function applyElectoralShift(
  parties: PartyState[],
  targetPartyId: string,
  demoShift: Partial<Record<DemographicId, number>>,
  macroRegionShift?: Partial<Record<MacroRegionId, number>>,
  specificRegionShift?: Partial<Record<RegionId, number>>,
  options?: ElectoralShiftOptions
): PartyState[] {
  const updated = parties.map((p) => ({
    ...p,
    demographics: { ...p.demographics },
    regions: { ...p.regions },
    regionPolls: { ...p.regionPolls },
  }));

  const target = updated.find((p) => p.id === targetPartyId);
  if (!target) return parties;
  const others = updated.filter((p) => p.id !== targetPartyId);

  const bypass = Boolean(options?.bypassInertia);
  const currentPoll = Number.isFinite(target.nationalPoll) ? target.nationalPoll : 0;
  const rawWeekStart = options?.weekStartPoll ?? target.previousPoll ?? currentPoll;
  const weekStartPoll = Number.isFinite(rawWeekStart) ? rawWeekStart : currentPoll;
  const maxWeeklyGain = getWeeklyMaxPollGrowthCap(weekStartPoll);
  const alreadyGainedThisWeek = Math.max(0, currentPoll - weekStartPoll);

  // Hard Weekly Cap: nessuna azione cumulativa nella stessa settimana può sforare il tetto settimanale
  const capDampener =
    !bypass && alreadyGainedThisWeek >= maxWeeklyGain - 1e-6
      ? 0
      : !bypass && alreadyGainedThisWeek >= maxWeeklyGain * 0.55
        ? 0.35
        : 1.0;

  // 1. Demographic shifts with visibility multiplier & ideological affinity flows
  for (const [demoKey, rawDelta] of Object.entries(demoShift)) {
    const d = demoKey as DemographicId;
    if (typeof rawDelta !== 'number' || !Number.isFinite(rawDelta) || rawDelta === 0) continue;
    const visMult = bypass
      ? 1.0
      : getPollVisibilityMultiplier(currentPoll, rawDelta > 0) * (rawDelta > 0 ? capDampener : 1.0);
    const scaledDelta = rawDelta * visMult;

    const prevVal = Number.isFinite(target.demographics[d]) ? target.demographics[d] : 0;
    const nextVal = clamp(prevVal + scaledDelta, 0, 62);
    const actualDelta = nextVal - prevVal;
    target.demographics[d] = nextVal;

    const flowWeights = computeAffinityFlowWeights(target, others, (o) =>
      Number.isFinite(o.demographics[d]) ? o.demographics[d] : 0
    );
    for (let i = 0; i < others.length; i++) {
      const o = others[i];
      const floor = o.id === 'altri' ? 0.2 : 0;
      const otherPrev = Number.isFinite(o.demographics[d]) ? o.demographics[d] : floor;
      o.demographics[d] = clamp(otherPrev - actualDelta * flowWeights[i], floor, 62);
    }
  }

  const validDemoValues = Object.values(demoShift).filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v)
  );
  const avgDemoDelta =
    validDemoValues.length > 0
      ? validDemoValues.reduce((a, b) => a + b, 0) / validDemoValues.length
      : 0;

  // 2. 20-Region shifts with visibility multiplier & ideological affinity flows
  for (const reg of ITALIAN_REGIONS) {
    const explicitSingle = specificRegionShift?.[reg.id];
    const explicitMacro = macroRegionShift?.[reg.macroRegion];
    const baseDelta =
      typeof explicitSingle === 'number' && Number.isFinite(explicitSingle)
        ? explicitSingle
        : typeof explicitMacro === 'number' && Number.isFinite(explicitMacro)
          ? explicitMacro
          : avgDemoDelta * 0.65;

    if (!Number.isFinite(baseDelta) || Math.abs(baseDelta) < 0.01) continue;
    const visMult = bypass
      ? 1.0
      : getPollVisibilityMultiplier(currentPoll, baseDelta > 0) * (baseDelta > 0 ? capDampener : 1.0);
    const delta = baseDelta * visMult;

    const prevVal = Number.isFinite(target.regionPolls[reg.id]) ? target.regionPolls[reg.id] : 0;
    const nextVal = clamp(prevVal + delta, 0, 65);
    const actualDelta = nextVal - prevVal;
    target.regionPolls[reg.id] = nextVal;

    const flowWeights = computeAffinityFlowWeights(target, others, (o) =>
      Number.isFinite(o.regionPolls[reg.id]) ? o.regionPolls[reg.id] : 0
    );
    for (let i = 0; i < others.length; i++) {
      const o = others[i];
      const floor = o.id === 'altri' ? 0.2 : 0;
      const otherPrev = Number.isFinite(o.regionPolls[reg.id]) ? o.regionPolls[reg.id] : floor;
      o.regionPolls[reg.id] = clamp(
        otherPrev - actualDelta * flowWeights[i],
        floor,
        65
      );
    }
  }

  let normalized = normalizeAllPolls(updated);

  // 3. Enforce strict Weekly Cap on nationalPoll with zero rounding leakage across stacked actions
  if (!bypass) {
    const maxAllowedPoll = Math.floor((weekStartPoll + maxWeeklyGain) * 10 + 1e-6) / 10;
    const ceiling = Math.max(currentPoll, maxAllowedPoll);
    for (let pass = 0; pass < 2; pass += 1) {
      const postTarget = normalized.find((p) => p.id === targetPartyId);
      if (!postTarget || postTarget.nationalPoll <= ceiling + 1e-6) break;
      const excess = Number((postTarget.nationalPoll - ceiling).toFixed(2));
      if (excess <= 0) break;
      const corrOthers = normalized.filter((p) => p.id !== targetPartyId);
      const weights = computeAffinityFlowWeights(postTarget, corrOthers, (o) => o.nationalPoll);
      const correctionFactor = pass === 0 ? 1.25 : 1.45;
      for (const d of DEMOGRAPHICS) {
        postTarget.demographics[d.id] = Math.max(
          0,
          postTarget.demographics[d.id] - excess * correctionFactor
        );
        corrOthers.forEach((o, idx) => {
          o.demographics[d.id] += excess * correctionFactor * weights[idx];
        });
      }
      for (const r of ITALIAN_REGIONS) {
        postTarget.regionPolls[r.id] = Math.max(
          0,
          postTarget.regionPolls[r.id] - excess * correctionFactor
        );
        corrOthers.forEach((o, idx) => {
          o.regionPolls[r.id] += excess * correctionFactor * weights[idx];
        });
      }
      normalized = normalizeAllPolls(normalized);
    }
  }

  return normalized;
}

/**
 * Proiezione parlamentare fedele al sistema elettorale italiano (Camera 400 / Senato 200).
 * Rosatellum (Legge 165/2017 post-riforma 2020):
 * - 63% Proporzionale (252 Camera / 126 Senato) + 37% Collegi Uninominali (148 Camera / 74 Senato)
 * - Soglia lista singola: 3,0% nazionale
 * - Soglia coalizione: 10,0% nazionale (con almeno una lista >= 3,0%)
 * - Regola 1%–3% in coalizione: le liste tra 1,0% e 2,99% in una coalizione >= 10% non ottengono
 *   seggi proporzionali propri, ma trasferiscono pro-quota i propri voti agli alleati >= 3,0%
 * - Liste < 1,0% disperse (0 seggi proporzionali e 0 collegi uninominali)
 */
export function calculateParliamentSeats(
  parties: PartyState[],
  electoralLaw: ElectoralLawId = 'rosatellum',
  applyMidTermSplinters = true
): SeatAllocation[] {
  const CAMERA_TOTAL = 400;
  const SENATO_TOTAL = 200;

  const propRatio =
    electoralLaw === 'proporzionale'
      ? 1.0
      : electoralLaw === 'maggioritario'
        ? 0.35
        : 0.63;

  const CAMERA_PROP = Math.round(CAMERA_TOTAL * propRatio);
  const SENATO_PROP = Math.round(SENATO_TOTAL * propRatio);
  const CAMERA_COLLEGES = CAMERA_TOTAL - CAMERA_PROP;
  const SENATO_COLLEGES = SENATO_TOTAL - SENATO_PROP;

  const competingParties = parties.filter((p) => p.id !== 'altri');
  const eligible = competingParties.filter((p) => p.nationalPoll >= 3.0);

  // Calcola i voti effettivi per il riparto proporzionale (con trasferimento 1%-3% nel Rosatellum)
  const effectivePropVotes: Record<string, number> = {};
  for (const p of eligible) {
    effectivePropVotes[p.id] = p.nationalPoll;
  }

  if (electoralLaw === 'rosatellum' || electoralLaw === 'maggioritario') {
    const coalitions = new Map<string, PartyState[]>();
    for (const p of competingParties) {
      if (!p.coalitionId) continue;
      const list = coalitions.get(p.coalitionId) ?? [];
      list.push(p);
      coalitions.set(p.coalitionId, list);
    }

    for (const members of coalitions.values()) {
      // Nel Rosatellum contano per la soglia del 10% solo le liste >= 1,0%
      const coalitionValidVotes = members
        .filter((m) => m.nationalPoll >= 1.0)
        .reduce((acc, m) => acc + m.nationalPoll, 0);
      const coalitionEligible = members.filter((m) => m.nationalPoll >= 3.0);
      const coalitionTransfers = members.filter(
        (m) => m.nationalPoll >= 1.0 && m.nationalPoll < 3.0
      );

      // Se la coalizione supera il 10% e ha almeno una lista >= 3%, i voti 1%–2,99% si trasferiscono
      if (
        coalitionValidVotes >= 10.0 &&
        coalitionEligible.length > 0 &&
        coalitionTransfers.length > 0
      ) {
        const transferPool = coalitionTransfers.reduce((acc, m) => acc + m.nationalPoll, 0);
        const eligibleSum = coalitionEligible.reduce((acc, m) => acc + m.nationalPoll, 0);
        if (eligibleSum > 0) {
          for (const m of coalitionEligible) {
            effectivePropVotes[m.id] =
              (effectivePropVotes[m.id] ?? m.nationalPoll) +
              transferPool * (m.nationalPoll / eligibleSum);
          }
        }
      }
    }
  }

  const allocProp = (
    totalSeats: number,
    pool: PartyState[],
    weightFn: (p: PartyState) => number = (p) => effectivePropVotes[p.id] ?? p.nationalPoll
  ): Record<string, number> => {
    const result: Record<string, number> = {};
    for (const p of parties) result[p.id] = 0;
    if (totalSeats <= 0) return result;
    const sumVotes = pool.reduce((acc, p) => acc + Math.max(0, weightFn(p)), 0);
    if (sumVotes <= 0) return result;

    const remainders: { id: string; rem: number }[] = [];
    let assigned = 0;
    for (const p of pool) {
      const exact = (Math.max(0, weightFn(p)) / sumVotes) * totalSeats;
      const whole = Math.floor(exact);
      result[p.id] = whole;
      assigned += whole;
      remainders.push({ id: p.id, rem: exact - whole });
    }
    remainders.sort((a, b) => b.rem - a.rem);
    let idx = 0;
    while (assigned < totalSeats && remainders.length > 0) {
      result[remainders[idx % remainders.length].id] += 1;
      assigned += 1;
      idx += 1;
    }
    return result;
  };

  let cameraSeats = allocProp(CAMERA_PROP, eligible);
  let senatoSeats = allocProp(SENATO_PROP, eligible);

  const groupCoalitionsInRegion = (regionId: MacroRegionId) => {
    const blocks = new Map<string, { key: string; score: number; members: PartyState[] }>();
    for (const p of competingParties) {
      // Liste singole < 3,0% o liste in coalizione < 1,0% nazionale non accedono al riparto
      if (p.coalitionId ? p.nationalPoll < 1.0 : p.nationalPoll < 3.0) continue;
      const key = p.coalitionId ? `coal_${p.coalitionId}` : `solo_${p.id}`;
      const existing = blocks.get(key) ?? { key, score: 0, members: [] };
      existing.score += p.regions[regionId];
      existing.members.push(p);
      blocks.set(key, existing);
    }
    return Array.from(blocks.values())
      .filter((b) => b.score >= 3.0 && b.members.some((m) => m.nationalPoll >= 3.0))
      .sort((a, b) => b.score - a.score);
  };

  const distributeColleges = (
    seatMap: Record<string, number>,
    regionId: MacroRegionId,
    collegesCount: number,
    exponent: number
  ) => {
    if (collegesCount <= 0) return;
    const blocks = groupCoalitionsInRegion(regionId);
    if (blocks.length === 0) return;

    const topBlocks = blocks.slice(0, 3);
    const weights = topBlocks.map((b) => Math.pow(Math.max(1, b.score), exponent));
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    let assigned = 0;
    topBlocks.forEach((block, i) => {
      const share =
        i === topBlocks.length - 1
          ? collegesCount - assigned
          : Math.round((weights[i] / totalWeight) * collegesCount);
      const safeShare = Math.max(0, Math.min(collegesCount - assigned, share));
      assigned += safeShare;

      // Nei collegi uninominali i seggi propri spettano alle liste che superano la soglia del 3,0%
      const validCandidates = block.members.filter((m) => m.nationalPoll >= 3.0);
      if (validCandidates.length === 0) return;
      const memberTotal = validCandidates.reduce(
        (acc, m) => acc + Math.max(0.1, m.regions[regionId]),
        0
      );
      let memberAssigned = 0;
      const sortedMembers = [...validCandidates].sort(
        (a, b) => b.regions[regionId] - a.regions[regionId]
      );
      sortedMembers.forEach((m, mi) => {
        const mSeats =
          mi === sortedMembers.length - 1
            ? safeShare - memberAssigned
            : Math.round((Math.max(0.1, m.regions[regionId]) / Math.max(0.1, memberTotal)) * safeShare);
        const clampedSeats = Math.max(0, Math.min(safeShare - memberAssigned, mSeats));
        seatMap[m.id] = (seatMap[m.id] ?? 0) + clampedSeats;
        memberAssigned += clampedSeats;
      });
    });
  };

  if (CAMERA_COLLEGES > 0 && SENATO_COLLEGES > 0) {
    const camScale = CAMERA_COLLEGES / 148;
    const senScale = SENATO_COLLEGES / 74;
    const exponent = electoralLaw === 'maggioritario' ? 2.9 : 2.4;
    for (const reg of MACRO_REGIONS) {
      distributeColleges(cameraSeats, reg.id, Math.round(reg.cameraColleges * camScale), exponent);
      distributeColleges(senatoSeats, reg.id, Math.round(reg.senatoColleges * senScale), exponent);
    }
  }

  // Premio di Maggioranza: top block >= 38% gets guaranteed 55% (220 Camera / 110 Senato)
  if (electoralLaw === 'premio_maggioranza' && eligible.length > 0) {
    const natBlocks = new Map<string, { poll: number; members: PartyState[] }>();
    for (const p of eligible) {
      const key = p.coalitionId ? `coal_${p.coalitionId}` : `solo_${p.id}`;
      const prev = natBlocks.get(key) ?? { poll: 0, members: [] };
      prev.poll += p.nationalPoll;
      prev.members.push(p);
      natBlocks.set(key, prev);
    }
    const topBlock = Array.from(natBlocks.values()).sort((a, b) => b.poll - a.poll)[0];
    if (topBlock && topBlock.poll >= 38.0) {
      const winnerIds = new Set(topBlock.members.map((m) => m.id));
      const losers = eligible.filter((p) => !winnerIds.has(p.id));
      const winCam = allocProp(220, topBlock.members, (p) => p.nationalPoll);
      const loseCam = allocProp(CAMERA_TOTAL - 220, losers, (p) => p.nationalPoll);
      const winSen = allocProp(110, topBlock.members, (p) => p.nationalPoll);
      const loseSen = allocProp(SENATO_TOTAL - 110, losers, (p) => p.nationalPoll);

      const nextCam: Record<string, number> = {};
      const nextSen: Record<string, number> = {};
      for (const p of parties) {
        nextCam[p.id] = (winCam[p.id] ?? 0) + (loseCam[p.id] ?? 0);
        nextSen[p.id] = (winSen[p.id] ?? 0) + (loseSen[p.id] ?? 0);
      }
      cameraSeats = nextCam;
      senatoSeats = nextSen;
    }
  }

  const fixTotal = (seatMap: Record<string, number>, target: number) => {
    const current = Object.values(seatMap).reduce((a, b) => a + b, 0);
    const diff = target - current;
    if (diff !== 0 && eligible.length > 0) {
      const largest = [...eligible].sort((a, b) => b.nationalPoll - a.nationalPoll)[0];
      seatMap[largest.id] = Math.max(0, (seatMap[largest.id] ?? 0) + diff);
    }
  };
  fixTotal(cameraSeats, CAMERA_TOTAL);
  fixTotal(senatoSeats, SENATO_TOTAL);

  // Scissioni parlamentari in corso di legislatura: i parlamentari scissionisti passano al nuovo mini-partito fino alle prossime elezioni
  if (applyMidTermSplinters) {
    for (const p of parties) {
      if (!p.isSplinterParty || !p.splinterFromPartyId || !p.splinterDefectedSeats) continue;
      const srcId = p.splinterFromPartyId;
      if ((cameraSeats[p.id] ?? 0) === 0 && (cameraSeats[srcId] ?? 0) > 1 && p.splinterDefectedSeats.camera > 0) {
        const movedCam = Math.min(p.splinterDefectedSeats.camera, Math.max(0, (cameraSeats[srcId] ?? 0) - 1));
        cameraSeats[srcId] = (cameraSeats[srcId] ?? 0) - movedCam;
        cameraSeats[p.id] = (cameraSeats[p.id] ?? 0) + movedCam;
      }
      if ((senatoSeats[p.id] ?? 0) === 0 && (senatoSeats[srcId] ?? 0) > 1 && p.splinterDefectedSeats.senato > 0) {
        const movedSen = Math.min(p.splinterDefectedSeats.senato, Math.max(0, (senatoSeats[srcId] ?? 0) - 1));
        senatoSeats[srcId] = (senatoSeats[srcId] ?? 0) - movedSen;
        senatoSeats[p.id] = (senatoSeats[p.id] ?? 0) + movedSen;
      }
    }
  }

  return parties.map((p) => ({
    partyId: p.id,
    camera: cameraSeats[p.id] ?? 0,
    senato: senatoSeats[p.id] ?? 0,
    coalitionId: p.coalitionId,
  }));
}

/**
 * Returns the player's current effective parliamentary representation from REAL sitting legislatureSeats.
 * Regola ferrea: superare il 3% nei sondaggi NON assegna mai seggi; solo le elezioni (o una scissione parlamentare) cambiano i seggi.
 */
export function getPlayerParliamentSeats(state: GameState): {
  camera: number;
  senato: number;
  total: number;
  isExtraParliamentary: boolean;
} {
  const seats = getCurrentParliamentSeats(state);
  const row = seats.find((s) => s.partyId === state.playerPartyId);
  const camera = state.extraParliamentary ? 0 : row?.camera ?? 0;
  const senato = state.extraParliamentary ? 0 : row?.senato ?? 0;
  const total = camera + senato;
  return {
    camera,
    senato,
    total,
    isExtraParliamentary: total === 0,
  };
}

const CRISIS_COOLDOWN_WEEKS = 18;

/** Events with context 'any' that still presuppose elected MPs or regional party officials */
const PARLIAMENTARY_ONLY_ANY_IDS = new Set([
  'scandalo_esponente',
  'diritti_civili_fine_vita',
  'riforma_fiscale_flattax',
  'riforma_cittadinanza_ius',
]);

/** Returns the list of active weekly crises (fallback to [state.currentCrisis] for legacy saves) */
export function getWeeklyCrisesList(state: GameState): ActiveCrisis[] {
  if (Array.isArray(state.weeklyCrises) && state.weeklyCrises.length > 0) {
    return state.weeklyCrises;
  }
  return state.currentCrisis ? [state.currentCrisis] : [];
}

/** Returns how many weekly events are still awaiting a player response */
export function getPendingCrisesCount(state: GameState): number {
  return getWeeklyCrisesList(state).filter((c) => !c.resolved).length;
}

/**
 * Picks 1 to 3 non-repetitive contextual crises for the week based on the player's real status:
 * - Extra-parliamentary (0 seats): signature drives, manifesto drafting, street booths, local/social visibility, minor circle scandals.
 * - Parliamentary opposition: question time, filibustering, amendments, chamber clashes, alliances.
 * - In Government / PM: majority crises, EU summits, decrees, national strikes, market/spread tensions.
 */
export function pickWeeklyCrises(
  week: number,
  crisisCooldowns: Record<string, number>,
  ctx: {
    isInGovernment: boolean;
    isExtraParliamentary: boolean;
    isCommitteeActive?: boolean;
    isCampaign: boolean;
    highTension?: boolean;
    orientation?: OrientationId;
    leaderStyle?: LeadershipStyle;
    leaderTraits?: LeaderTraitId[];
  },
  explicitCount?: number
): ActiveCrisis[] {
  const matchesContext = (crisis: CrisisEvent) => {
    const context = crisis.context ?? 'any';
    if (ctx.isExtraParliamentary) {
      if (context === 'extraparlamentare') return true;
      if (ctx.isCommitteeActive) return false;
      if (context === 'any' && !PARLIAMENTARY_ONLY_ANY_IDS.has(crisis.id)) return true;
      return false;
    }
    if (context === 'extraparlamentare') return false;
    if (context === 'governo') return ctx.isInGovernment;
    if (context === 'opposizione') return !ctx.isInGovernment;
    if (context === 'campagna') return ctx.isCampaign;
    return true;
  };

  const matchesPlayerProfile = (crisis: CrisisEvent) => {
    const traitMatch =
      Boolean(ctx.leaderTraits?.length) &&
      (Boolean(crisis.preferredTraits?.some((t) => ctx.leaderTraits!.includes(t))) ||
        crisis.options.some((o) => o.requiredTrait && ctx.leaderTraits!.includes(o.requiredTrait)));
    const styleMatch =
      Boolean(ctx.leaderStyle) && Boolean(crisis.preferredStyles?.includes(ctx.leaderStyle!));
    const orientMatch =
      Boolean(ctx.orientation) && Boolean(crisis.preferredOrientations?.includes(ctx.orientation!));
    return traitMatch || styleMatch || orientMatch;
  };

  const preferredRoleContext = ctx.isExtraParliamentary
    ? 'extraparlamentare'
    : ctx.isInGovernment
      ? 'governo'
      : 'opposizione';

  // Determine coherent number of weekly events (1 to 3)
  let count = explicitCount;
  if (count === undefined) {
    const roll = Math.random();
    if (ctx.isCommitteeActive && week === 1) {
      count = roll < 0.35 ? 1 : 2;
    } else if (ctx.isCampaign || ctx.highTension || ctx.isInGovernment) {
      count = roll < 0.2 ? 1 : roll < 0.65 ? 2 : 3;
    } else {
      count = roll < 0.3 ? 1 : roll < 0.75 ? 2 : 3;
    }
  }
  const targetCount = clamp(count, 1, 3);

  const selected: CrisisEvent[] = [];
  const selectedIds = new Set<string>();

  for (let slot = 0; slot < targetCount; slot++) {
    const matchingAll = CRISIS_POOL.filter(
      (c) => !selectedIds.has(c.id) && matchesContext(c)
    );
    if (matchingAll.length === 0) break;

    const offCooldown = matchingAll.filter((c) => {
      const last = crisisCooldowns[c.id];
      return last === undefined || week - last >= CRISIS_COOLDOWN_WEEKS;
    });

    const pool = offCooldown.length > 0 ? offCooldown : matchingAll;
    const roleSpecific = pool.filter(
      (c) =>
        c.context === preferredRoleContext ||
        (ctx.isCampaign && c.context === 'campagna')
    );
    const traitSpecific = pool.filter(matchesPlayerProfile);

    let chosen: CrisisEvent;
    const preferRoleChance = slot === 0 ? 0.72 : ctx.isExtraParliamentary ? 0.65 : 0.45;
    if (slot === 1 && traitSpecific.length > 0 && Math.random() < 0.65) {
      chosen = traitSpecific[Math.floor(Math.random() * traitSpecific.length)];
    } else if (roleSpecific.length > 0 && Math.random() < preferRoleChance) {
      chosen = roleSpecific[Math.floor(Math.random() * roleSpecific.length)];
    } else if (traitSpecific.length > 0 && Math.random() < 0.45) {
      chosen = traitSpecific[Math.floor(Math.random() * traitSpecific.length)];
    } else if (offCooldown.length > 0) {
      chosen = pool[Math.floor(Math.random() * pool.length)];
    } else {
      const sorted = [...pool].sort(
        (a, b) => (crisisCooldowns[a.id] ?? -999) - (crisisCooldowns[b.id] ?? -999)
      );
      chosen = sorted[0];
    }

    selected.push(chosen);
    selectedIds.add(chosen.id);
  }

  if (selected.length === 0) {
    selected.push(CRISIS_POOL[0]);
  }

  return selected.map((event) => ({
    event,
    resolved: false,
  }));
}

function buildInitialMedia(
  mode: GameMode,
  playerParty: PartyState,
  week: number
): MediaItem[] {
  const dateLabel = formatGameDate(week).shortLabel;
  if (mode === 'government_crisis') {
    return [
      {
        id: uid('med'),
        week,
        dateLabel,
        type: 'stampa',
        source: 'Il Corriere Nazionale',
        headline: 'Crisi lampo a Palazzo Chigi: il Colle scioglie le Camere, voto tra 8 settimane',
        excerpt: `Spaccatura irreversibile sulla Manovra 2027. ${playerParty.name} convoca la sala regia per la campagna elettorale più breve della Repubblica.`,
        sentiment: 'neutro',
        partyColor: playerParty.color,
      },
      {
        id: uid('med'),
        week,
        dateLabel,
        type: 'social',
        source: 'Trend Politica X',
        handle: '@osservatorio_voto',
        headline: '#ElezioniAnticipate2027 in cima alle tendenze: sondaggi sul filo del rasoio',
        excerpt: `Con ${playerParty.nationalPoll.toFixed(1)}% di partenza, ${playerParty.leaderName} ha 56 giorni per spostare gli indecisi.`,
        sentiment: 'positivo',
        engagement: '48.2k interazioni',
      },
      {
        id: uid('med'),
        week,
        dateLabel,
        type: 'rivale',
        source: 'Dichiarazione Avversari',
        headline: 'I leader rivali aprono subito il fuoco incrociato',
        excerpt: '“Gli italiani non perdoneranno chi gioca con la stabilità del Paese: siamo pronti al confronto in TV.”',
        sentiment: 'negativo',
      },
    ];
  }

  if (mode === 'new_party') {
    return [
      {
        id: uid('med'),
        week,
        dateLabel,
        type: 'stampa',
        source: 'La Tribuna Politica',
        headline: `Nasce ${playerParty.name} (${playerParty.acronym}): la sfida di ${playerParty.leaderName}`,
        excerpt: `Un nuovo soggetto politico irrompe nello scenario di novembre 2026 puntando su un elettorato deluso dai poli tradizionali.`,
        sentiment: 'positivo',
        partyColor: playerParty.color,
      },
      {
        id: uid('med'),
        week,
        dateLabel,
        type: 'social',
        source: 'Rete Politica',
        handle: `@${playerParty.acronym.toLowerCase()}_ufficiale`,
        headline: `Diretta lancio ${playerParty.name}: oltre 12.000 spettatori collegati`,
        excerpt: `Primi segnali di curiosità nei sondaggi flash (${playerParty.nationalPoll.toFixed(1)}%). Gli analisti osservano la tenuta sul territorio.`,
        sentiment: 'positivo',
        engagement: '19.4k condivisioni',
      },
    ];
  }

  return [
    {
      id: uid('med'),
      week,
      dateLabel,
      type: 'stampa',
      source: 'Il Foglio Economico',
      headline: `Sondaggi Novembre 2026: ${playerParty.name} apre la settimana al ${playerParty.nationalPoll.toFixed(1)}%`,
      excerpt: `In vista della Manovra 2027 e dei dossier europei, ${playerParty.leaderName} riunisce i dirigenti nella War Room nazionale.`,
      sentiment: 'neutro',
      partyColor: playerParty.color,
    },
    {
      id: uid('med'),
      week,
      dateLabel,
      type: 'rivale',
      source: 'Retroscena Transatlantico',
      headline: 'Movimenti tra Centrodestra, Campo Largo e Terzo Polo',
      excerpt: 'Le segreterie nazionali studiano le mosse avversarie e l’apertura di nuove sedi regionali.',
      sentiment: 'neutro',
    },
  ];
}

/** Creates a brand new GameState from Setup Wizard */
export function initializeGame(params: {
  mode: GameMode;
  existingPartyId?: string;
  customLeaderName?: string;
  newPartyDraft?: NewPartyDraft;
}): GameState {
  const { mode, existingPartyId, customLeaderName, newPartyDraft } = params;

  let parties: PartyState[] = EXISTING_PARTIES_2026.map((p) => ({
    id: p.id,
    name: p.name,
    acronym: p.acronym,
    color: p.color,
    emblem: p.emblem,
    orientation: p.orientation,
    axis: { ...p.axis },
    leaderName: p.leaderName,
    isPlayer: false,
    isInGovernment: mode === 'government_crisis' ? false : p.isInGovernment,
    coalitionId: p.coalitionId,
    demographics: { ...p.demographics },
    regions: { ...p.regions },
    regionPolls: buildRegionPollsFromMacro(p.regions, p.regionOverrides),
    nationalPoll: p.history12[p.history12.length - 1],
    previousPoll: p.history12[p.history12.length - 2],
    relationWithPlayer: 0,
    coalitionStatus: 'avversario',
    description: p.description,
    internalTension: p.internalTension,
    startingBudget: p.startingBudget,
    budget: p.startingBudget,
    weeklyOverhead: p.weeklyOverhead,
    aiChapterCount: p.startingHq.length,
  }));

  parties.push({
    ...MINOR_PARTIES_BASELINE,
    demographics: { ...MINOR_PARTIES_BASELINE.demographics },
    regions: { ...MINOR_PARTIES_BASELINE.regions },
    regionPolls: { ...MINOR_PARTIES_BASELINE.regionPolls },
  });

  // Normalize baseline existing parties to exact 100.0% per demographic & region before inserting a custom party
  parties = normalizeAllPolls(parties);

  let playerPartyId = existingPartyId ?? 'fdi';
  let budget = 650000;
  let weeklyOverhead = 48000;
  let openHeadquarters: RegionId[] = [];
  let leader: LeaderProfile = {
    name: 'Giorgia Meloni',
    age: 49,
    style: 'carismatico',
    traits: ['oratore_tv', 'diplomazia_ue'],
  };
  let origin: GameState['origin'] = 'established';
  let coalitionName = 'Coalizione Nazionale';

  if (mode === 'new_party' && newPartyDraft) {
    const orient =
      ORIENTATIONS.find((o) => o.id === newPartyDraft.orientation) ?? ORIENTATIONS[0];
    origin = newPartyDraft.origin;
    const isCommittee = origin === 'committee';
    // Rigorously enforce: Comitato Promotore = 0.0%, Nuovo Partito già costituito = 1.0% (0.8%..1.2%)
    const basePoll = isCommittee ? 0.0 : round1(clamp(orient.establishedBasePoll, 0.8, 1.2));

    const demoAvgFactor =
      DEMOGRAPHICS.reduce((acc, d) => acc + orient.demoAffinity[d.id] * d.weight, 0) || 1;
    const regAvgFactor =
      ITALIAN_REGIONS.reduce(
        (acc, r) => acc + orient.regionAffinity[r.macroRegion] * r.populationWeight,
        0
      ) || 1;

    const newDemographics: Record<DemographicId, number> = {
      giovani: isCommittee ? 0 : round1((basePoll * orient.demoAffinity.giovani) / demoAvgFactor),
      lavoratori: isCommittee
        ? 0
        : round1((basePoll * orient.demoAffinity.lavoratori) / demoAvgFactor),
      imprese: isCommittee ? 0 : round1((basePoll * orient.demoAffinity.imprese) / demoAvgFactor),
      pensionati: isCommittee
        ? 0
        : round1((basePoll * orient.demoAffinity.pensionati) / demoAvgFactor),
    };

    const newRegionPolls = {} as Record<RegionId, number>;
    for (const reg of ITALIAN_REGIONS) {
      newRegionPolls[reg.id] = isCommittee
        ? 0
        : round1((basePoll * orient.regionAffinity[reg.macroRegion]) / regAvgFactor);
    }

    const newMacroRegions: Record<MacroRegionId, number> = {
      nord_ovest: 0,
      nord_est: 0,
      centro: 0,
      sud: 0,
      isole: 0,
    };
    if (!isCommittee) {
      for (const macro of MACRO_REGIONS) {
        const subRegions = ITALIAN_REGIONS.filter((r) => r.macroRegion === macro.id);
        const wSum = subRegions.reduce((acc, r) => acc + r.populationWeight, 0);
        const weighted = subRegions.reduce(
          (acc, r) => acc + newRegionPolls[r.id] * r.populationWeight,
          0
        );
        newMacroRegions[macro.id] = round1(weighted / Math.max(0.001, wSum));
      }
    }

    const safePartyName = sanitizePlainText(newPartyDraft.name, 36, 'Italia Futura');
    const safeAcronym = sanitizeAcronym(newPartyDraft.acronym, 'IF');
    const safeColor = sanitizeHexColor(newPartyDraft.color, '#06B6D4');
    const safeEmblemUrl = sanitizeCustomEmblemUrl(newPartyDraft.customEmblemUrl);
    const safeLeaderName = sanitizePlainText(newPartyDraft.leaderName, 36, 'Marco Ferri');

    const newParty: PartyState = {
      id: 'player_custom',
      name: safePartyName,
      acronym: safeAcronym,
      color: safeColor,
      emblem: newPartyDraft.emblem,
      customEmblemUrl: safeEmblemUrl,
      orientation: newPartyDraft.orientation,
      axis: { ...orient.axis },
      leaderName: safeLeaderName,
      isPlayer: true,
      isInGovernment: false,
      coalitionId: 'player_coalition',
      demographics: newDemographics,
      regions: newMacroRegions,
      regionPolls: newRegionPolls,
      nationalPoll: basePoll,
      previousPoll: isCommittee ? 0 : round1(Math.max(0, basePoll - 0.1)),
      relationWithPlayer: 100,
      coalitionStatus: 'alleato',
      description: `${orient.label} · ${orient.shortDesc}`,
      startingBudget: isCommittee ? 26000 : 50000,
      budget: isCommittee ? 26000 : 50000,
      weeklyOverhead: isCommittee ? 950 : 2400,
      aiChapterCount: isCommittee ? 0 : 1,
    };

    if (!isCommittee) {
      // Scale existing parties per-demographic and per-region by exact remaining share so every column stays 100.0%
      parties = parties.map((p) => {
        const scaledRegions = {} as Record<RegionId, number>;
        for (const r of ITALIAN_REGIONS) {
          const regFactor = (100 - newRegionPolls[r.id]) / 100;
          scaledRegions[r.id] = p.regionPolls[r.id] * regFactor;
        }
        return {
          ...p,
          demographics: {
            giovani: p.demographics.giovani * ((100 - newDemographics.giovani) / 100),
            lavoratori: p.demographics.lavoratori * ((100 - newDemographics.lavoratori) / 100),
            imprese: p.demographics.imprese * ((100 - newDemographics.imprese) / 100),
            pensionati: p.demographics.pensionati * ((100 - newDemographics.pensionati) / 100),
          },
          regionPolls: scaledRegions,
        };
      });
    }

    parties.unshift(newParty);
    playerPartyId = newParty.id;
    budget = isCommittee ? 26000 : 50000;
    weeklyOverhead = isCommittee ? 950 : 2400;
    openHeadquarters = isCommittee ? [] : ['lazio'];
    leader = {
      name: newParty.leaderName,
      age: clamp(Math.round(newPartyDraft.leaderAge || 42), 18, 90),
      style: newPartyDraft.leaderStyle,
      traits: newPartyDraft.traits,
    };
    coalitionName = `Alleanza ${newParty.acronym}`;
  } else {
    const preset =
      EXISTING_PARTIES_2026.find((p) => p.id === playerPartyId) ?? EXISTING_PARTIES_2026[0];
    playerPartyId = preset.id;
    budget = preset.startingBudget;
    weeklyOverhead = preset.weeklyOverhead;
    openHeadquarters = [...preset.startingHq];
    const resolvedLeaderName =
      customLeaderName && customLeaderName.trim().length > 0
        ? sanitizePlainText(customLeaderName, 44, preset.leaderName)
        : preset.leaderName;
    leader = {
      name: resolvedLeaderName,
      age: preset.leaderAge,
      style: preset.leaderStyle,
      traits: [...preset.leaderTraits] as LeaderProfile['traits'],
    };
    parties = parties.map((p) =>
      p.id === playerPartyId ? { ...p, isPlayer: true, leaderName: resolvedLeaderName } : p
    );
    coalitionName =
      preset.coalitionId === 'centrodestra'
        ? 'Coalizione di Centrodestra'
        : preset.coalitionId === 'centrosinistra'
          ? 'Campo Largo Progressista'
          : preset.coalitionId === 'centro'
            ? 'Polo Riformista di Centro'
            : `Polo ${preset.acronym}`;
  }

  parties = normalizeAllPolls(parties);

  if (mode !== 'new_party') {
    parties = parties.map((p) => {
      if (p.id === 'altri') {
        return {
          ...p,
          nationalPoll: MINOR_PARTIES_BASELINE.nationalPoll,
          previousPoll: MINOR_PARTIES_BASELINE.previousPoll,
        };
      }
      const preset = EXISTING_PARTIES_2026.find((x) => x.id === p.id);
      if (!preset) return p;
      const exactPoll = preset.history12[preset.history12.length - 1];
      const prevPoll = preset.history12[preset.history12.length - 2] ?? exactPoll;
      return {
        ...p,
        nationalPoll: exactPoll,
        previousPoll: prevPoll,
      };
    });
  }

  // Strict post-normalization invariant enforcement for new_party origins
  if (mode === 'new_party') {
    const isCommittee = origin === 'committee';
    if (isCommittee) {
      const zeroRegions = {} as Record<RegionId, number>;
      for (const r of ITALIAN_REGIONS) zeroRegions[r.id] = 0;
      parties = parties.map((p) =>
        p.id === playerPartyId
          ? {
              ...p,
              nationalPoll: 0,
              previousPoll: 0,
              demographics: { giovani: 0, lavoratori: 0, imprese: 0, pensionati: 0 },
              regions: { nord_ovest: 0, nord_est: 0, centro: 0, sud: 0, isole: 0 },
              regionPolls: zeroRegions,
            }
          : p
      );
    } else {
      const currentPlayer = parties.find((p) => p.id === playerPartyId)!;
      if (currentPlayer.nationalPoll < 0.8 || currentPlayer.nationalPoll > 1.2) {
        const targetNat = round1(clamp(currentPlayer.nationalPoll, 0.8, 1.2));
        const diff = round1(currentPlayer.nationalPoll - targetNat);
        const largestRival = [...parties]
          .filter((p) => p.id !== playerPartyId && p.id !== 'altri')
          .sort((a, b) => b.nationalPoll - a.nationalPoll)[0];
        parties = parties.map((p) => {
          if (p.id === playerPartyId) {
            return {
              ...p,
              nationalPoll: targetNat,
              previousPoll: round1(Math.max(0, targetNat - 0.1)),
            };
          }
          if (largestRival && p.id === largestRival.id) {
            return { ...p, nationalPoll: round1(Math.max(0.1, p.nationalPoll + diff)) };
          }
          return p;
        });
      }
    }
  }

  const playerParty = parties.find((p) => p.id === playerPartyId)!;

  parties = parties.map((p) => {
    if (p.id === playerPartyId) {
      return { ...p, relationWithPlayer: 100, coalitionStatus: 'alleato' as CoalitionStatus };
    }
    if (p.id === 'altri') {
      return { ...p, relationWithPlayer: 0, coalitionStatus: 'avversario' as CoalitionStatus };
    }
    const compat = computeIdeologicalCompatibility(playerParty, p);
    const sameCoalition =
      Boolean(playerParty.coalitionId) &&
      playerParty.coalitionId === p.coalitionId &&
      mode !== 'new_party';
    const instBonus = leader.style === 'istituzionale' && isProInstitutionalParty(p) ? 15 : 0;
    const baseRel = clamp(
      Math.round((compat - 50) * 1.3 + (sameCoalition ? 30 : 0) + instBonus),
      -85,
      88
    );
    const status: CoalitionStatus = sameCoalition
      ? 'alleato'
      : baseRel >= 25
        ? 'dialogo'
        : 'avversario';
    return { ...p, relationWithPlayer: baseRel, coalitionStatus: status };
  });

  // Build 12-point realistic 6-month historical poll chart (Giu–Nov 2026)
  const pollHistory: PollSnapshot[] = HISTORICAL_POLL_LABELS.map((label, idx) => {
    const snap: Record<string, number> = {};
    for (const p of parties) {
      const preset = EXISTING_PARTIES_2026.find((x) => x.id === p.id);
      if (preset) {
        const scale = mode === 'new_party' ? (100 - playerParty.nationalPoll) / 100 : 1;
        snap[p.id] =
          idx === HISTORICAL_POLL_LABELS.length - 1
            ? p.nationalPoll
            : round1(preset.history12[idx] * scale);
      } else if (p.id === playerPartyId && mode === 'new_party') {
        if (origin === 'committee') {
          snap[p.id] = 0;
        } else {
          const rampWeights = [0, 0, 0, 0, 0, 0.1, 0.2, 0.3, 0.5, 0.7, 0.9, 1.0];
          snap[p.id] =
            idx === HISTORICAL_POLL_LABELS.length - 1
              ? p.nationalPoll
              : round1(p.nationalPoll * rampWeights[idx]);
        }
      } else {
        snap[p.id] = p.nationalPoll;
      }
    }
    return {
      weekIndex: idx - (HISTORICAL_POLL_LABELS.length - 1),
      label,
      polls: snap,
    };
  });

  const executives = createInitialExecutives(playerParty.orientation, leader.style);
  const electionWeek = mode === 'government_crisis' ? 9 : 21;

  const committee =
    mode === 'new_party' && origin === 'committee'
      ? {
          active: true,
          weeksRemaining: 4,
          signatures: 0,
          targetSignatures: 30000,
          committeesOpened: 0,
          targetCommittees: 10,
          completed: false,
        }
      : {
          active: false,
          weeksRemaining: 0,
          signatures: 30000,
          targetSignatures: 30000,
          committeesOpened: 10,
          targetCommittees: 10,
          completed: true,
        };

  // Regola ferrea: i seggi iniziali sono SOLO quelli reali della XIX Legislatura (mai calcolati dai sondaggi!)
  const initialSeats = buildInitialLegislatureSeats(parties);
  const seatedPartyIds = new Set(
    initialSeats.filter((s) => s.camera + s.senato > 0).map((s) => s.partyId)
  );
  // Garantisce che nessun partito con 0 seggi risulti mai al Governo
  parties = parties.map((p) => ({
    ...p,
    isInGovernment:
      mode === 'government_crisis'
        ? false
        : seatedPartyIds.has(p.id) && INITIAL_GOVERNMENT_PARTY_IDS.has(p.id),
  }));
  const refreshedPlayerParty = parties.find((p) => p.id === playerPartyId)!;

  const playerInitialSeatRow = initialSeats.find((s) => s.partyId === playerPartyId);
  const playerInitialTotalSeats =
    (playerInitialSeatRow?.camera ?? 0) + (playerInitialSeatRow?.senato ?? 0);
  const isInitialExtraParliamentary = mode === 'new_party' || playerInitialTotalSeats === 0;

  const initialWeeklyCrises = pickWeeklyCrises(1, {}, {
    isInGovernment: !isInitialExtraParliamentary && refreshedPlayerParty.isInGovernment,
    isExtraParliamentary: isInitialExtraParliamentary,
    isCommitteeActive: committee.active,
    isCampaign: mode === 'government_crisis',
    orientation: refreshedPlayerParty.orientation,
    leaderStyle: leader.style,
    leaderTraits: leader.traits,
  });
  const firstCrisis = initialWeeklyCrises[0];
  const initialCooldowns: Record<string, number> = {};
  for (const c of initialWeeklyCrises) {
    initialCooldowns[c.event.id] = 1;
  }

  const isInitialCentrodestraGov =
    mode === 'existing_party' &&
    !isInitialExtraParliamentary &&
    refreshedPlayerParty.isInGovernment &&
    refreshedPlayerParty.coalitionId === 'centrodestra';
  const initialIsPrimeMinister = isInitialCentrodestraGov && playerPartyId === 'fdi';
  const initialMinistries: Partial<Record<MinistryId, string>> = isInitialCentrodestraGov
    ? {
        mef: 'lega',
        interno: 'fdi',
        esteri: 'fi',
        giustizia: 'fdi',
        infrastrutture: 'lega',
        salute: 'fi',
        istruzione: 'lega',
        ambiente: 'noi_moderati',
      }
    : {};
  const initialMinistryExecutives = isInitialCentrodestraGov
    ? buildAutoMinistryExecutives(initialMinistries, playerPartyId, executives)
    : {};
  const initialAllySatisfaction: Record<string, number> = {};
  if (isInitialCentrodestraGov) {
    const evalInit = evaluateCencelliSatisfaction(
      parties,
      playerPartyId,
      initialSeats,
      initialMinistries
    );
    for (const rep of evalInit.allyReports) {
      initialAllySatisfaction[rep.partyId] = rep.satisfaction;
    }
  }

  return {
    version: 3,
    saveId: uid('save'),
    savedAt: new Date().toISOString(),
    mode,
    origin,
    week: 1,
    electionWeek,
    playerPartyId,
    leader,
    budget,
    weeklyOverhead,
    legislatureSeats: initialSeats,
    parties,
    executives,
    pollHistory,
    currentCrisis: firstCrisis,
    weeklyCrises: initialWeeklyCrises,
    crisisCooldowns: initialCooldowns,
    usedCrisisIds: initialWeeklyCrises.map((c) => c.event.id),
    mediaFeed: buildInitialMedia(mode, playerParty, 1),
    actionLog: [],
    actionsTakenThisWeek: [],
    committee,
    coalitionName,
    election: null,
    governmentRole: initialIsPrimeMinister
      ? 'premier'
      : !isInitialExtraParliamentary && playerParty.isInGovernment
        ? 'governo'
        : 'opposizione',
    extraParliamentary: isInitialExtraParliamentary,
    schismOccurred: false,
    lowCohesionStreak: 0,
    schismCount: 0,
    totalBillsProposed: 0,
    openHeadquarters,
    stateIndicators: {
      spread: mode === 'government_crisis' ? 148 : 118,
      socialStability: mode === 'government_crisis' ? 62 : 72,
      euRelations: 68,
      democraticHealth: 84,
    },
    electoralLaw: 'rosatellum',
    enactedLawIds: [],
    lawVoteHistory: [],
    institutionalFlags: {
      premierato: false,
      mediaControl: false,
      judiciaryControl: false,
      strikeLimit: false,
      fullPowers: false,
    },
    regimeStatus: 'repubblica_parlamentare',
    isPrimeMinister: initialIsPrimeMinister,
    governmentMinistries: initialMinistries,
    governmentMinistryExecutives: initialMinistryExecutives,
    allySatisfaction: initialAllySatisfaction,
    lastBudgetWeek: 0,
    pendingBudgetLaw: false,
    budgetModifiers: null,
    leaderApproval: buildDefaultLeaderApproval(
      parties,
      playerPartyId,
      leader.style,
      leader.traits
    ),
    previousLeaderApproval: buildDefaultLeaderApproval(
      parties,
      playerPartyId,
      leader.style,
      leader.traits
    ),
    ballotSignatures: createInitialBallotSignatures({
      parties,
      playerPartyId,
      electoralLaw: 'rosatellum',
      extraParliamentary: isInitialExtraParliamentary,
      electionWeek,
      legislatureSeats: initialSeats,
    }),
    activeReferendum: null,
    referendumHistory: [],
    pendingConstitutionalReferendumLawIds: [],
    pendingBills: [],
    activeDecreeLaws: [],
    activeCommissions: [],
    commissionHistory: [],
    currentPresidentName: 'Sergio Mattarella',
    quirinaleTermEndWeek: 36,
    quirinaleElection: null,
    fundraising: createInitialFundraisingState(playerParty.nationalPoll, openHeadquarters.length),
    activeScandal: null,
    lastScandalWeek: 0,
    regionalChapters: openHeadquarters.reduce((acc, regId) => {
      acc[regId] = {
        level: 1,
        openedAtWeek: 1,
        localMembers: 110,
      };
      return acc;
    }, {} as Partial<Record<RegionId, RegionalChapterState>>),
    weekStartPlayerPoll: playerParty.nationalPoll,
    weeklyTerritorialActivity: false,
  };
}

/**
 * Opens a new Circolo Territoriale (Level 1) or upgrades an existing chapter to Level 2 (Coordinamento Provinciale)
 * or Level 3 (Federazione Regionale) in the selected region.
 */
export function openOrUpgradeRegionalChapter(
  state: GameState,
  regionId: RegionId
): { nextState: GameState; feedback: string; error?: string } {
  const region = REGION_MAP_BY_ID[regionId];
  if (!region) {
    return { nextState: state, feedback: '', error: 'Regione non valida.' };
  }

  const currentLevel = getRegionChapterLevel(state, regionId);
  if (currentLevel >= 3) {
    return {
      nextState: state,
      feedback: '',
      error: `Hai già una Federazione Regionale di livello massimo (Liv. 3) in ${region.name}.`,
    };
  }

  const metrics = getRegionChapterMetrics(region, currentLevel);
  const nextLevel = metrics.nextLevel!;
  const nextTier = metrics.nextTier!;
  const traits = getActiveTraitProfile(state);
  const cost = getEffectiveChapterCost(state, metrics.openOrUpgradeCost);
  const nextMetrics = getRegionChapterMetrics(region, nextLevel);

  if (state.budget < cost) {
    return {
      nextState: state,
      feedback: '',
      error: `Fondi insufficienti: ${currentLevel === 0 ? 'aprire' : 'potenziare'} ${nextTier.label} a ${region.capital} costa €${cost.toLocaleString('it-IT')}.`,
    };
  }

  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const dateLabel = formatGameDate(state.week).shortLabel;

  // Inauguration / upgrade local consensus boost in that region (scaled by territorial traits)
  const localBoost = round1(
    (currentLevel === 0 ? 0.22 : currentLevel === 1 ? 0.18 : 0.22) * traits.territorialMult
  );
  const updatedParties = applyElectoralShift(
    state.parties,
    state.playerPartyId,
    {},
    undefined,
    { [regionId]: localBoost },
    { weekStartPoll: state.weekStartPlayerPoll ?? player.previousPoll }
  );

  const updatedCommittee = { ...state.committee };
  if (updatedCommittee.active) {
    updatedCommittee.committeesOpened += 1;
    updatedCommittee.signatures += Math.round(
      (currentLevel === 0 ? 2500 : 1800) * traits.signatureMult
    );
  }

  const chapters = getNormalizedRegionalChapters(state);
  const prevChapter = chapters[regionId];
  const immediateMembersGain = currentLevel === 0 ? 90 : currentLevel === 1 ? 140 : 210;
  chapters[regionId] = {
    level: nextLevel,
    openedAtWeek: prevChapter?.openedAtWeek ?? state.week,
    localMembers: (prevChapter?.localMembers ?? 0) + immediateMembersGain,
  };

  const nextOpenHqs = Array.from(
    new Set([...state.openHeadquarters, regionId])
  ) as RegionId[];

  const nextFundraising: FundraisingState = {
    ...state.fundraising,
    activeMembersCount: (state.fundraising?.activeMembersCount ?? 150) + immediateMembersGain,
  };

  const actionVerb = currentLevel === 0 ? 'Inaugurato' : 'Potenziato a';
  const feedback = `${actionVerb} ${nextTier.label} (${nextTier.shortLabel}) a ${region.capital} (${region.name}): +${nextMetrics.weeklyConsensusBoost.toFixed(2)}%/sett. radicamento locale, +${ immediateMembersGain} iscritti immediati e +${nextMetrics.ballotSigBonus.toLocaleString('it-IT')} firme/sett.`;

  const mediaItem: MediaItem = {
    id: uid('med'),
    week: state.week,
    dateLabel,
    type: 'stampa',
    source: 'Gazzetta Regionale',
    headline: `${player.name} ${currentLevel === 0 ? 'apre un nuovo' : 'potenzia a'} ${nextTier.label} a ${region.capital}`,
    excerpt: `Nuovo presidio in ${region.name}: cresce la rete di tesserati (+${immediateMembersGain}), volontari e banchetti sul territorio.`,
    sentiment: 'positivo',
    partyColor: player.color,
  };

  return {
    nextState: {
      ...state,
      budget: state.budget - cost,
      openHeadquarters: nextOpenHqs,
      regionalChapters: chapters,
      fundraising: nextFundraising,
      weeklyTerritorialActivity: true,
      parties: updatedParties,
      committee: updatedCommittee,
      mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
      actionLog: [
        {
          id: uid('act'),
          week: state.week,
          category: 'Territorio & Sezioni',
          title: `${nextTier.label} · ${region.capital} (${region.name})`,
          cost,
          summary: feedback,
        },
        ...state.actionLog,
      ].slice(0, 30),
    },
    feedback,
  };
}

/**
 * Downgrades or closes a regional chapter / HQ to save weekly and monthly upkeep.
 */
export function downgradeOrCloseRegionalChapter(
  state: GameState,
  regionId: RegionId,
  forceCloseAll = false
): { nextState: GameState; feedback: string; error?: string } {
  const region = REGION_MAP_BY_ID[regionId];
  const currentLevel = getRegionChapterLevel(state, regionId);
  if (!region || currentLevel <= 0) {
    return { nextState: state, feedback: '', error: 'Nessuna sezione attiva in questa regione.' };
  }

  const currentMetrics = getRegionChapterMetrics(region, currentLevel);
  const nextLevel: ChapterLevel = forceCloseAll ? 0 : ((currentLevel - 1) as ChapterLevel);
  const nextMetrics = getRegionChapterMetrics(region, nextLevel);
  const savedWeekly = currentMetrics.weeklyUpkeep - nextMetrics.weeklyUpkeep;

  const chapters = getNormalizedRegionalChapters(state);
  const prevLocalMembers = chapters[regionId]?.localMembers ?? 0;
  let lostMembers = 0;
  if (nextLevel === 0) {
    lostMembers = Math.round(prevLocalMembers * 0.5);
    delete chapters[regionId];
  } else {
    const keptLocalMembers = Math.max(40, Math.round(prevLocalMembers * 0.7));
    lostMembers = Math.max(0, prevLocalMembers - keptLocalMembers);
    chapters[regionId] = {
      level: nextLevel,
      openedAtWeek: chapters[regionId]?.openedAtWeek ?? state.week,
      localMembers: keptLocalMembers,
    };
  }

  const nextFundraising: FundraisingState = {
    ...state.fundraising,
    activeMembersCount: Math.max(
      50,
      (state.fundraising?.activeMembersCount ?? 150) - lostMembers
    ),
  };

  const nextOpenHqs =
    nextLevel === 0
      ? state.openHeadquarters.filter((id) => id !== regionId)
      : state.openHeadquarters;

  const feedback =
    nextLevel === 0
      ? `Sezione di ${region.capital} (${region.name}) chiusa: risparmiati €${savedWeekly.toLocaleString('it-IT')}/settimana (€${(savedWeekly * 4).toLocaleString('it-IT')}/mese).`
      : `Sezione di ${region.capital} ridimensionata a ${CHAPTER_TIERS[nextLevel].label}: risparmiati €${savedWeekly.toLocaleString('it-IT')}/settimana.`;

  return {
    nextState: {
      ...state,
      openHeadquarters: nextOpenHqs,
      regionalChapters: chapters,
      fundraising: nextFundraising,
    },
    feedback,
  };
}

/** Opens or upgrades a Regional Party Headquarters in the selected region's capital */
export function openRegionalHeadquarters(
  state: GameState,
  regionId: RegionId
): { nextState: GameState; feedback: string; error?: string } {
  return openOrUpgradeRegionalChapter(state, regionId);
}

/** Closes a Regional Party Headquarters to save weekly upkeep */
export function closeRegionalHeadquarters(
  state: GameState,
  regionId: RegionId
): { nextState: GameState; feedback: string; error?: string } {
  return downgradeOrCloseRegionalChapter(state, regionId, true);
}

export type CampaignActionPayload =
  | { type: 'talk_show'; tone: 'aggressivo' | 'istituzionale' | 'populista'; showName: string }
  | { type: 'social_campaign'; target: DemographicId }
  | { type: 'territorial_tour'; region: MacroRegionId }
  | { type: 'law_proposal'; topicId: string; topicLabel: string }
  | { type: 'fundraising'; format: 'cena' | 'crowdfunding' | 'gazebo' }
  | { type: 'party_talks'; targetPartyId: string; approach: 'dialogo' | 'dossier' | 'desistenza' }
  | { type: 'committee_drive' };

export function executeCampaignAction(
  state: GameState,
  payload: CampaignActionPayload
): { nextState: GameState; feedback: string; error?: string } {
  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const commExec = state.executives.find((e) => e.role === 'comunicazione');
  const viceExec = state.executives.find((e) => e.role === 'vice_segretario');
  const capoExec = state.executives.find((e) => e.role === 'capogruppo');

  const commMult = 0.85 + ((commExec?.competence ?? 70) / 100) * 0.35;
  const traits = getActiveTraitProfile(state);
  const hasTrait = (t: GameState['leader']['traits'][0]) => state.leader.traits.includes(t);
  const dateLabel = formatGameDate(state.week).shortLabel;

  // Limiti naturali realistici settimanali (niente più PA artificiosi!)
  const weeklyKey =
    payload.type === 'talk_show'
      ? 'camp_talk_show'
      : payload.type === 'social_campaign'
        ? 'camp_social'
        : payload.type === 'territorial_tour'
          ? 'camp_tour'
          : payload.type === 'law_proposal'
            ? 'camp_law'
            : payload.type === 'fundraising'
              ? 'camp_fundraising'
              : payload.type === 'party_talks'
                ? `camp_party_${payload.targetPartyId}`
                : 'camp_committee';

  if (payload.type === 'committee_drive') {
    const usedCommittee = state.actionsTakenThisWeek.filter((k) => k === 'camp_committee').length;
    if (usedCommittee >= 2) {
      return {
        nextState: state,
        feedback: '',
        error: 'I volontari hanno già svolto 2 mobilitazioni nazionali questa settimana. Avanza al turno successivo.',
      };
    }
  } else if (state.actionsTakenThisWeek.includes(weeklyKey)) {
    const labelMap: Record<CampaignActionPayload['type'], string> = {
      talk_show: 'Hai già partecipato a un Talk Show TV questa settimana.',
      social_campaign: 'Hai già lanciato una campagna social mirata questa settimana.',
      territorial_tour: 'Il leader ha già concluso il Tour Territoriale di questa settimana.',
      law_proposal: 'Hai già depositato una proposta programmatica questa settimana.',
      fundraising: 'Hai già tenuto un’iniziativa di raccolta fondi questa settimana.',
      party_talks: 'Hai già svolto un vertice bilaterale con questo partito questa settimana.',
      committee_drive: 'Mobilitazione già esaurita questa settimana.',
    };
    return {
      nextState: state,
      feedback: '',
      error: labelMap[payload.type],
    };
  }

  let cost = 0;
  let budgetGain = 0;
  let demoShift: Partial<Record<DemographicId, number>> = {};
  let regionShift: Partial<Record<MacroRegionId, number>> | undefined;
  let actionCategory = '';
  let actionTitle = '';
  let actionSummary = '';
  let mediaEntry: MediaItem | null = null;
  let updatedParties = state.parties;
  let updatedCommittee = { ...state.committee };
  let totalBillsProposed = state.totalBillsProposed;

  if (payload.type === 'talk_show') {
    cost = CAMPAIGN_ACTION_COSTS.talk_show;
    if (state.budget < cost) {
      return {
        nextState: state,
        feedback: '',
        error: `Fondi insufficienti per preparazione e ufficio stampa TV (€${cost.toLocaleString('it-IT')}).`,
      };
    }
    const mediaControlBonus = state.institutionalFlags.mediaControl ? 1.25 : 1.0;
    const tvBonus = traits.tvMult * commMult * mediaControlBonus;

    if (payload.tone === 'aggressivo') {
      demoShift = {
        giovani: 0.3 * tvBonus,
        lavoratori: 0.36 * tvBonus,
        imprese: 0.1 * tvBonus,
        pensionati: -0.25,
      };
      actionSummary = `Scontro acceso a ${payload.showName}: picco di share tra lavoratori e giovani, qualche riserva tra i moderati.`;
      mediaEntry = {
        id: uid('med'),
        week: state.week,
        dateLabel,
        type: 'stampa',
        source: NEWSPAPERS[state.week % NEWSPAPERS.length],
        headline: `${player.leaderName} infiamma ${payload.showName}: scontro totale in studio`,
        excerpt: 'Clip da record sui social nella notte, ma le altre segreterie alzano il muro.',
        sentiment: 'positivo',
        partyColor: player.color,
      };
    } else if (payload.tone === 'istituzionale') {
      const techLift = 1 + traits.tvTechBonus / 100;
      demoShift = {
        pensionati: 0.38 * tvBonus * techLift,
        imprese: 0.35 * tvBonus * techLift,
        lavoratori: 0.16 * tvBonus,
        giovani: 0.1 * tvBonus,
      };
      actionSummary = `Intervento misurato e autorevole a ${payload.showName}: cresce la fiducia tra pensionati e imprese.`;
      mediaEntry = {
        id: uid('med'),
        week: state.week,
        dateLabel,
        type: 'stampa',
        source: NEWSPAPERS[(state.week + 1) % NEWSPAPERS.length],
        headline: `Linea da statista per ${player.leaderName} a ${payload.showName}`,
        excerpt: 'I commentatori apprezzano il tono costruttivo e i numeri citati nel confronto.',
        sentiment: 'positivo',
        partyColor: player.color,
      };
    } else {
      demoShift = {
        lavoratori: 0.42 * tvBonus,
        giovani: 0.36 * tvBonus,
        pensionati: 0.16 * tvBonus,
        imprese: -0.35,
      };
      regionShift = { sud: 0.28 * tvBonus, isole: 0.25 * tvBonus };
      actionSummary = `Appello diretto al Paese a ${payload.showName}: forte presa popolare soprattutto al Sud.`;
      mediaEntry = {
        id: uid('med'),
        week: state.week,
        dateLabel,
        type: 'social',
        source: 'Viral TV Clip',
        handle: '@politica_live',
        headline: `Il monologo di ${player.leaderName} a ${payload.showName} supera 1,8M di views`,
        excerpt: 'Tono diretto contro gli apparati: grande entusiasmo nei commenti popolari.',
        sentiment: 'positivo',
        engagement: '64.5k interazioni',
      };
    }
    actionCategory = 'Talk Show TV';
    actionTitle = `${payload.showName} (tono ${payload.tone})`;
  } else if (payload.type === 'social_campaign') {
    const baseCost = CAMPAIGN_ACTION_COSTS.social_campaign;
    cost = Math.round(baseCost * traits.socialCostMult);
    if (state.budget < cost) {
      return {
        nextState: state,
        feedback: '',
        error: `Fondi insufficienti per la campagna social mirata (€${cost.toLocaleString('it-IT')}).`,
      };
    }
    const mediaControlBonus = state.institutionalFlags.mediaControl ? 1.25 : 1.0;
    const mult = traits.socialMult * commMult * mediaControlBonus;
    const demoLabel = DEMOGRAPHICS.find((d) => d.id === payload.target)?.label ?? payload.target;
    demoShift = {
      [payload.target]: 0.62 * mult,
    };
    actionCategory = 'Campagna Social';
    actionTitle = `Sponsorizzata target ${demoLabel}`;
    actionSummary = `Campagna micro-targettizzata attiva su Reels, YouTube e X rivolta a ${demoLabel}.`;
    mediaEntry = {
      id: uid('med'),
      week: state.week,
      dateLabel,
      type: 'social',
      source: 'Osservatorio Digitale',
      handle: `@${player.acronym.toLowerCase()}_media`,
      headline: `${player.name} domina l’advertising digitale verso ${demoLabel}`,
      excerpt: 'Tasso di conversione superiore alla media di coalizione negli ultimi 7 giorni.',
      sentiment: 'positivo',
      engagement: `${Math.round(28 * mult)}k condivisioni`,
    };
  } else if (payload.type === 'territorial_tour') {
    cost = CAMPAIGN_ACTION_COSTS.territorial_tour;
    if (state.budget < cost) {
      return {
        nextState: state,
        feedback: '',
        error: `Fondi insufficienti per il Tour Territoriale (€${cost.toLocaleString('it-IT')}).`,
      };
    }
    const mult =
      traits.territorialMult *
      (0.9 + ((viceExec?.competence ?? 70) / 100) * 0.22);
    const regInfo = MACRO_REGIONS.find((r) => r.id === payload.region)!;
    regionShift = { [payload.region]: 0.72 * mult };
    demoShift = { lavoratori: 0.16 * mult, pensionati: 0.16 * mult };
    actionCategory = 'Tour Territoriale';
    actionTitle = `Tappe in ${regInfo.label}`;
    actionSummary = `Piazze, incontri con sindaci e circoli in ${regInfo.label} (${regInfo.regionsList}).`;
    mediaEntry = {
      id: uid('med'),
      week: state.week,
      dateLabel,
      type: 'stampa',
      source: 'Gazzetta Locale',
      headline: `Piazza piena in ${regInfo.label} per il tour di ${player.leaderName}`,
      excerpt: `Forte radicamento sul territorio: l’obiettivo è strappare collegi uninominali in ${regInfo.label}.`,
      sentiment: 'positivo',
      partyColor: player.color,
    };
    if (updatedCommittee.active) {
      updatedCommittee.signatures += Math.round(4500 * mult * traits.signatureMult);
      updatedCommittee.committeesOpened += 2;
    }
  } else if (payload.type === 'law_proposal') {
    cost = CAMPAIGN_ACTION_COSTS.law_proposal;
    if (state.budget < cost) {
      return {
        nextState: state,
        feedback: '',
        error: `Fondi insufficienti per deposito e campagna proposta (€${cost.toLocaleString('it-IT')}).`,
      };
    }
    totalBillsProposed += 1;
    const topicEffects: Record<string, Partial<Record<DemographicId, number>>> = {
      salario_minimo: { lavoratori: 0.58, giovani: 0.42, imprese: -0.45 },
      flat_tax: { imprese: 0.65, lavoratori: -0.35, pensionati: 0.14 },
      sanita_pubblica: { pensionati: 0.58, lavoratori: 0.38, giovani: 0.2 },
      energia_pulita: { giovani: 0.55, imprese: 0.32, pensionati: 0.1 },
      sicurezza_citta: { pensionati: 0.52, imprese: 0.32, giovani: -0.25 },
      referendum_giustizia: { imprese: 0.3, giovani: 0.35, lavoratori: 0.22 },
    };
    demoShift = topicEffects[payload.topicId] ?? { lavoratori: 0.32, giovani: 0.32 };
    actionCategory = 'Proposta di Legge';
    actionTitle = payload.topicLabel;
    actionSummary = `Depositata e rilanciata alla stampa la proposta programmatica su "${payload.topicLabel}".`;
    mediaEntry = {
      id: uid('med'),
      week: state.week,
      dateLabel,
      type: 'stampa',
      source: NEWSPAPERS[(state.week + 2) % NEWSPAPERS.length],
      headline: `${player.name} lancia la proposta politica: "${payload.topicLabel}"`,
      excerpt: 'L’iniziativa entra subito nell’agenda politica della settimana costringendo i rivali a prendere posizione.',
      sentiment: 'positivo',
      partyColor: player.color,
    };
  } else if (payload.type === 'fundraising') {
    budgetGain = getFundraisingReward(state, payload.format);
    const hqTesseramentoBonus =
      payload.format === 'gazebo' ? state.openHeadquarters.length * 1400 : 0;
    budgetGain += hqTesseramentoBonus;

    if (payload.format === 'cena') {
      demoShift = { imprese: 0.12, lavoratori: -0.15 };
      actionTitle = 'Cena Finanziatori (L. 13/2014)';
      actionSummary = `Raccolti +€${budgetGain.toLocaleString('it-IT')} con donazioni tracciate entro il tetto di legge (€100k/donatore).`;
    } else if (payload.format === 'crowdfunding') {
      demoShift = { giovani: 0.18 };
      actionTitle = 'Crowdfunding & Campagna 2×1000';
      actionSummary = `Raccolti +€${budgetGain.toLocaleString('it-IT')} tramite micro-donazioni volontarie online.`;
    } else {
      demoShift = { lavoratori: 0.16, pensionati: 0.16 };
      actionTitle = 'Gazebo & Campagna Tesseramento';
      actionSummary = `Raccolti +€${budgetGain.toLocaleString('it-IT')} (incluso bonus sedi regionali) e nuovi tesserati.`;
      if (updatedCommittee.active) {
        updatedCommittee.signatures += Math.round(6500 * traits.signatureMult);
        updatedCommittee.committeesOpened += 2;
      }
    }
    actionCategory = 'Raccolta Fondi';
  } else if (payload.type === 'party_talks') {
    cost = CAMPAIGN_ACTION_COSTS.party_talks;
    if (state.budget < cost) {
      return {
        nextState: state,
        feedback: '',
        error: `Fondi insufficienti per la delegazione diplomatica (€${cost.toLocaleString('it-IT')}).`,
      };
    }
    const targetParty = state.parties.find((p) => p.id === payload.targetPartyId);
    if (!targetParty) {
      return { nextState: state, feedback: '', error: 'Partito destinatario non trovato.' };
    }
    const compat = computeIdeologicalCompatibility(player, targetParty);
    const capoBonus = Math.round(((capoExec?.competence ?? 70) - 60) / 5);
    const relGain = Math.max(
      2,
      Math.round(compat / 10 + 6 + traits.diplomacyGainBonus + capoBonus)
    );

    updatedParties = state.parties.map((p) => {
      if (p.id !== targetParty.id) return p;
      const nextRel = clamp(p.relationWithPlayer + relGain, -100, 100);
      let nextStatus = p.coalitionStatus;
      if (payload.approach === 'desistenza' && nextRel >= 35 && nextStatus !== 'alleato') {
        nextStatus = 'desistenza';
      } else if (nextRel >= 15 && nextStatus === 'avversario') {
        nextStatus = 'dialogo';
      }
      return { ...p, relationWithPlayer: nextRel, coalitionStatus: nextStatus };
    });

    actionCategory = 'Trattativa Partiti';
    actionTitle = `Vertice con ${targetParty.acronym} (${payload.approach})`;
    actionSummary = `Incontro riservato con ${targetParty.leaderName}: rapporto migliorato di +${relGain} punti.`;
    mediaEntry = {
      id: uid('med'),
      week: state.week,
      dateLabel,
      type: 'rivale',
      source: targetParty.name,
      headline: `Vertice politico tra ${player.acronym} e ${targetParty.acronym}`,
      excerpt: `${targetParty.leaderName}: “Con ${player.leaderName} c’è stato un confronto franco sui dossier prioritari.”`,
      sentiment: 'neutro',
      partyColor: targetParty.color,
    };
  } else if (payload.type === 'committee_drive') {
    cost = CAMPAIGN_ACTION_COSTS.committee_drive;
    if (state.budget < cost) {
      return {
        nextState: state,
        feedback: '',
        error: `Fondi insufficienti per i banchetti raccolta firme (€${cost.toLocaleString('it-IT')}).`,
      };
    }
    const gainSig = Math.round(
      (9000 + Math.round((viceExec?.competence ?? 70) * 45)) * traits.signatureMult
    );
    updatedCommittee.signatures += gainSig;
    updatedCommittee.committeesOpened += 3;
    demoShift = { giovani: 0.16, lavoratori: 0.12 };
    actionCategory = 'Comitato Promotore';
    actionTitle = 'Mobilitazione Nazionale Raccolta Firme';
    actionSummary = `Raccolte +${gainSig.toLocaleString('it-IT')} firme autenticate e aperti 3 nuovi comitati provinciali.`;
  }

  if (Object.keys(demoShift).length > 0 || regionShift) {
    updatedParties = applyElectoralShift(
      updatedParties,
      state.playerPartyId,
      demoShift,
      regionShift,
      undefined,
      { weekStartPoll: state.weekStartPlayerPoll ?? player.previousPoll }
    );
  }

  // Impatto delle azioni settimanali sul gradimento personale del Leader
  let nextLeaderApproval = { ...(state.leaderApproval ?? {}) };
  if (payload.type === 'talk_show') {
    const tvApprovalGain =
      (payload.tone === 'istituzionale' ? 3 : payload.tone === 'populista' ? 2 : 1) +
      (hasTrait('oratore_tv') || state.leader.style === 'carismatico' ? 1 : 0);
    nextLeaderApproval = adjustLeaderApproval(nextLeaderApproval, state.playerPartyId, tvApprovalGain);
  } else if (payload.type === 'social_campaign') {
    nextLeaderApproval = adjustLeaderApproval(
      nextLeaderApproval,
      state.playerPartyId,
      hasTrait('maestro_social') ? 2 : 1
    );
  } else if (payload.type === 'territorial_tour') {
    nextLeaderApproval = adjustLeaderApproval(nextLeaderApproval, state.playerPartyId, 2);
  } else if (payload.type === 'law_proposal') {
    nextLeaderApproval = adjustLeaderApproval(nextLeaderApproval, state.playerPartyId, 1);
  } else if (payload.type === 'party_talks' && payload.approach === 'dossier') {
    nextLeaderApproval = adjustLeaderApproval(nextLeaderApproval, payload.targetPartyId, -2);
  }

  const nextLog = [
    {
      id: uid('act'),
      week: state.week,
      category: actionCategory,
      title: actionTitle,
      cost,
      summary: actionSummary,
    },
    ...state.actionLog,
  ].slice(0, 30);

  const nextMedia = mediaEntry ? [mediaEntry, ...state.mediaFeed].slice(0, 40) : state.mediaFeed;

  const nextState: GameState = {
    ...state,
    budget: state.budget - cost + budgetGain,
    parties: updatedParties,
    committee: updatedCommittee,
    mediaFeed: nextMedia,
    actionLog: nextLog,
    actionsTakenThisWeek: [...state.actionsTakenThisWeek, weeklyKey],
    weeklyTerritorialActivity: Boolean(
      state.weeklyTerritorialActivity ||
        payload.type === 'territorial_tour' ||
        payload.type === 'committee_drive' ||
        (payload.type === 'fundraising' && payload.format === 'gazebo')
    ),
    totalBillsProposed,
    leaderApproval: nextLeaderApproval,
  };

  return { nextState, feedback: actionSummary };
}

/** Resolves one of the weekly political events, revealing its real numeric impact after the choice */
export function resolveWeeklyCrisis(
  state: GameState,
  option: CrisisOption,
  crisisId?: string
): { nextState: GameState; feedback: string } {
  const crisesList = getWeeklyCrisesList(state);
  const targetIndex = crisisId
    ? crisesList.findIndex((c) => c.event.id === crisisId)
    : crisesList.findIndex((c) => !c.resolved);

  const activeTarget = targetIndex >= 0 ? crisesList[targetIndex] : state.currentCrisis;
  if (!activeTarget || activeTarget.resolved) {
    return { nextState: state, feedback: 'Evento già gestito questa settimana.' };
  }

  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const prevPoll = player.nationalPoll;
  const dateLabel = formatGameDate(state.week).shortLabel;
  const traits = getActiveTraitProfile(state);
  const scandalShield =
    activeTarget.event.category === 'Scandalo'
      ? traits.scandalShieldMult * (state.institutionalFlags.judiciaryControl ? 0.5 : 1.0)
      : 1.0;

  const adjustedDemo: Partial<Record<DemographicId, number>> = {};
  for (const [k, v] of Object.entries(option.demoEffects)) {
    if (v === undefined) continue;
    const demoKey = k as DemographicId;
    if (v < 0) {
      adjustedDemo[demoKey] = round1(v * traits.crisisDamageMult * scandalShield);
    } else {
      const youthBoost =
        demoKey === 'giovani' && activeTarget.event.category === 'Istituzioni'
          ? traits.youthCrisisMult
          : 1.0;
      adjustedDemo[demoKey] = round1(v * 0.52 * youthBoost);
    }
  }

  let adjustedRegions: Partial<Record<MacroRegionId, number>> | undefined;
  if (option.regionEffects) {
    adjustedRegions = {};
    for (const [k, v] of Object.entries(option.regionEffects)) {
      if (v === undefined) continue;
      const regKey = k as MacroRegionId;
      adjustedRegions[regKey] = v > 0 ? round1(v * 0.55) : v;
    }
  }

  let updatedParties = applyElectoralShift(
    state.parties,
    state.playerPartyId,
    adjustedDemo,
    adjustedRegions,
    undefined,
    { weekStartPoll: state.weekStartPlayerPoll ?? player.previousPoll }
  );

  // Shift player's 4 ideological axes dynamically
  const nextPlayerAxis = applyAxisShift(player.axis, option.axisShift);
  updatedParties = updatedParties.map((p) =>
    p.id === state.playerPartyId ? { ...p, axis: nextPlayerAxis } : p
  );
  const shiftedPlayer = updatedParties.find((p) => p.id === state.playerPartyId)!;
  const actualPollDelta = round1(shiftedPlayer.nationalPoll - prevPoll);

  // Apply explicit relation effects + subtle ideological alignment drift with other parties
  updatedParties = updatedParties.map((p) => {
    if (p.id === state.playerPartyId || p.id === 'altri') return p;
    const prevCompat = computeIdeologicalCompatibility(player, p);
    const nextCompat = computeIdeologicalCompatibility(shiftedPlayer, p);
    let delta = Math.round((nextCompat - prevCompat) * 0.45);

    if (option.relationEffects) {
      if (option.relationEffects.sameSide && nextCompat >= 55) {
        delta += option.relationEffects.sameSide;
      }
      if (option.relationEffects.oppositeSide && nextCompat < 45) {
        delta += option.relationEffects.oppositeSide;
      }
      if (option.relationEffects.institutional && isProInstitutionalParty(p)) {
        delta += option.relationEffects.institutional;
      }
    }

    if (delta === 0) return p;
    return {
      ...p,
      relationWithPlayer: clamp(p.relationWithPlayer + delta, -100, 100),
    };
  });

  const nextStateIndicators = applyStateEffects(state.stateIndicators, option.stateEffects);
  const nextRegimeStatus = deriveRegimeStatus(
    state.institutionalFlags,
    nextStateIndicators.democraticHealth
  );

  const loyaltyDelta = option.loyaltyDelta ?? 0;
  const updatedExecutives = state.executives.map((ex) => ({
    ...ex,
    loyalty: clamp(ex.loyalty + loyaltyDelta, 10, 100),
  }));

  const rival = updatedParties
    .filter((p) => p.id !== state.playerPartyId && p.id !== 'altri')
    .sort((a, b) => a.relationWithPlayer - b.relationWithPlayer)[0];

  const pressItem: MediaItem = {
    id: uid('med'),
    week: state.week,
    dateLabel,
    type: 'stampa',
    source: NEWSPAPERS[state.week % NEWSPAPERS.length],
    headline: option.headlineResult,
    excerpt: `Decisione di ${player.name} sul dossier "${activeTarget.event.title}": scelta la linea ${option.stance}.`,
    sentiment: option.requiredTrait || actualPollDelta > 0 ? 'positivo' : actualPollDelta < 0 ? 'negativo' : 'neutro',
    partyColor: player.color,
  };

  const rivalItem: MediaItem = {
    id: uid('med'),
    week: state.week,
    dateLabel,
    type: 'rivale',
    source: rival ? `${rival.leaderName} (${rival.acronym})` : 'Avversari',
    headline: `Replica da ${rival?.name ?? 'i rivali'} sul dossier ${activeTarget.event.category}`,
    excerpt: `“${option.rivalReaction}”`,
    sentiment: 'negativo',
    partyColor: rival?.color,
  };

  // Variazione del gradimento personale del Leader in base alla gestione della crisi settimanale
  const avgDemoImpact =
    Object.values(adjustedDemo).reduce((acc, v) => acc + (v ?? 0), 0) /
    Math.max(1, Object.keys(adjustedDemo).length);
  const crisisApprovalDelta = Math.round(
    clamp(
      avgDemoImpact * 2.2 +
        (option.requiredTrait ? 2 : 0) +
        ((option.stateEffects?.socialStability ?? 0) >= 6 ? 1 : 0) -
        ((option.stateEffects?.socialStability ?? 0) <= -8 ? 1 : 0),
      -4,
      4
    )
  );
  const nextLeaderApproval = adjustLeaderApproval(
    state.leaderApproval,
    state.playerPartyId,
    crisisApprovalDelta
  );

  const adjustedBudgetDelta =
    option.budgetDelta > 0
      ? Math.round(option.budgetDelta * traits.fundraisingMult)
      : option.budgetDelta;
  const nextBudget = Math.max(0, state.budget + adjustedBudgetDelta);
  const actualBudgetDelta = nextBudget - state.budget;

  const appliedStateEffects: Partial<StateIndicators> = {};
  const spreadDiff = nextStateIndicators.spread - state.stateIndicators.spread;
  const stabDiff = nextStateIndicators.socialStability - state.stateIndicators.socialStability;
  const euDiff = nextStateIndicators.euRelations - state.stateIndicators.euRelations;
  const demDiff = nextStateIndicators.democraticHealth - state.stateIndicators.democraticHealth;
  if (spreadDiff !== 0) appliedStateEffects.spread = spreadDiff;
  if (stabDiff !== 0) appliedStateEffects.socialStability = stabDiff;
  if (euDiff !== 0) appliedStateEffects.euRelations = euDiff;
  if (demDiff !== 0) appliedStateEffects.democraticHealth = demDiff;

  const outcomeStats: CrisisOutcomeStats = {
    pollDelta: actualPollDelta,
    budgetDelta: actualBudgetDelta,
    loyaltyDelta,
    leaderApprovalDelta: crisisApprovalDelta,
    pressReaction: option.headlineResult,
    rivalReaction: option.rivalReaction,
    stateEffects: Object.keys(appliedStateEffects).length > 0 ? appliedStateEffects : option.stateEffects,
    demoEffects: adjustedDemo,
  };

  const resolvedItem: ActiveCrisis = {
    ...activeTarget,
    resolved: true,
    skipped: false,
    chosenOptionId: option.id,
    outcomeSummary: option.headlineResult,
    outcomeStats,
  };

  const nextWeeklyCrises = crisesList.map((c, idx) =>
    idx === targetIndex ? resolvedItem : c
  );
  const nextCurrentCrisis =
    nextWeeklyCrises.find((c) => !c.resolved) ?? resolvedItem;

  const nextState: GameState = {
    ...state,
    budget: nextBudget,
    parties: updatedParties,
    executives: updatedExecutives,
    stateIndicators: nextStateIndicators,
    regimeStatus: nextRegimeStatus,
    leaderApproval: nextLeaderApproval,
    currentCrisis: nextCurrentCrisis,
    weeklyCrises: nextWeeklyCrises,
    mediaFeed: [pressItem, rivalItem, ...state.mediaFeed].slice(0, 40),
  };

  const pollSign = actualPollDelta > 0 ? `+${actualPollDelta.toFixed(1)}%` : `${actualPollDelta.toFixed(1)}%`;
  return {
    nextState,
    feedback: `${option.headlineResult} (Consenso ${pollSign})`,
  };
}

/**
 * Allows the player to skip taking an official stance ("Salta / Nessuna dichiarazione").
 * Produces a neutral effect or a slight media visibility drop depending on the event's severity.
 */
export function skipWeeklyCrisis(
  state: GameState,
  crisisId?: string
): { nextState: GameState; feedback: string } {
  const crisesList = getWeeklyCrisesList(state);
  const targetIndex = crisisId
    ? crisesList.findIndex((c) => c.event.id === crisisId)
    : crisesList.findIndex((c) => !c.resolved);

  const activeTarget = targetIndex >= 0 ? crisesList[targetIndex] : state.currentCrisis;
  if (!activeTarget || activeTarget.resolved) {
    return { nextState: state, feedback: 'Evento già gestito questa settimana.' };
  }

  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const prevPoll = player.nationalPoll;
  const dateLabel = formatGameDate(state.week).shortLabel;
  const severity = activeTarget.event.severity;

  // Neutral for 'Media' or 0.0% committees, slight visibility dip for 'Alta' / 'Critica'
  const visibilityDip =
    prevPoll <= 0.1
      ? 0
      : severity === 'Critica'
        ? -0.2
        : severity === 'Alta'
          ? -0.1
          : 0;

  const demoShift: Partial<Record<DemographicId, number>> =
    visibilityDip !== 0
      ? {
          giovani: visibilityDip,
          lavoratori: visibilityDip,
          imprese: visibilityDip,
          pensionati: visibilityDip,
        }
      : {};

  const updatedParties =
    visibilityDip !== 0
      ? applyElectoralShift(state.parties, state.playerPartyId, demoShift)
      : state.parties;

  const shiftedPlayer = updatedParties.find((p) => p.id === state.playerPartyId)!;
  const actualPollDelta = round1(shiftedPlayer.nationalPoll - prevPoll);
  const approvalDelta = severity === 'Critica' ? -1 : 0;
  const nextLeaderApproval =
    approvalDelta !== 0
      ? adjustLeaderApproval(state.leaderApproval, state.playerPartyId, approvalDelta)
      : state.leaderApproval;

  const pressReaction =
    severity === 'Media'
      ? `Silenzio tattico di ${player.acronym} su "${activeTarget.event.title}": nessuna dichiarazione ufficiale.`
      : `${player.name} sceglie il no-comment su "${activeTarget.event.title}": lieve calo di visibilità sui media.`;

  const pressItem: MediaItem = {
    id: uid('med'),
    week: state.week,
    dateLabel,
    type: 'stampa',
    source: NEWSPAPERS[(state.week + 1) % NEWSPAPERS.length],
    headline: pressReaction,
    excerpt: `La segreteria di ${player.leaderName} evita di schierarsi sul dossier ${activeTarget.event.category}.`,
    sentiment: severity === 'Critica' ? 'negativo' : 'neutro',
    partyColor: player.color,
  };

  const outcomeStats: CrisisOutcomeStats = {
    pollDelta: actualPollDelta,
    budgetDelta: 0,
    loyaltyDelta: 0,
    leaderApprovalDelta: approvalDelta,
    pressReaction,
    demoEffects: demoShift,
  };

  const resolvedItem: ActiveCrisis = {
    ...activeTarget,
    resolved: true,
    skipped: true,
    chosenOptionId: 'skip_no_comment',
    outcomeSummary: pressReaction,
    outcomeStats,
  };

  const nextWeeklyCrises = crisesList.map((c, idx) =>
    idx === targetIndex ? resolvedItem : c
  );
  const nextCurrentCrisis =
    nextWeeklyCrises.find((c) => !c.resolved) ?? resolvedItem;

  const nextState: GameState = {
    ...state,
    parties: updatedParties,
    leaderApproval: nextLeaderApproval,
    currentCrisis: nextCurrentCrisis,
    weeklyCrises: nextWeeklyCrises,
    mediaFeed: [pressItem, ...state.mediaFeed].slice(0, 40),
  };

  return {
    nextState,
    feedback: pressReaction,
  };
}

export interface LawVoteForecast {
  cameraYes: number;
  cameraNo: number;
  senatoYes: number;
  senatoNo: number;
  requiredCamera: number;
  requiredSenato: number;
  willPass: boolean;
  quirinaleVetoChance: number;
  missingPrereqs: string[];
  supporters: string[];
  opponents: string[];
}

function partySupportsLaw(
  party: PartyState,
  player: PartyState,
  law: LawDefinition,
  regimeStatus: RegimeStatus,
  allySatisfaction?: Record<string, number>
): boolean {
  if (party.id === player.id) return true;
  if (regimeStatus === 'regime_autoritario') return true;

  const isAllied = Boolean(player.coalitionId) && party.coalitionId === player.coalitionId;
  const sat = isAllied ? allySatisfaction?.[party.id] : undefined;
  const coalitionBonus =
    !isAllied ? 0 : sat !== undefined && sat < 35 ? 6 : sat !== undefined && sat < 50 ? 22 : 36;

  // Calculate alignment with the law's target axes (0..100)
  const targetEntries = Object.entries(law.targetAxis) as [keyof PoliticalAxis, number][];
  let alignment = 50;
  if (targetEntries.length > 0) {
    let totalDiff = 0;
    for (const [k, targetVal] of targetEntries) {
      totalDiff += Math.abs(party.axis[k] - targetVal);
    }
    alignment = clamp(100 - (totalDiff / targetEntries.length) * 0.65, 0, 100);
  }

  // Strongly democratic parties strongly resist authoritarian constitutional changes
  if (law.id === 'law_pieni_poteri') {
    if (party.axis.institutions <= -45) return false;
    return isAllied && party.relationWithPlayer >= 55 && party.axis.institutions >= -25;
  }

  if (law.category === 'costituzionale' && (law.targetAxis.institutions ?? 0) >= 55) {
    if (party.axis.institutions <= -55 && !isAllied) return false;
    const score = alignment + Math.max(0, coalitionBonus - 2) + party.relationWithPlayer * 0.35;
    return score >= 76;
  }

  const score = alignment + coalitionBonus + party.relationWithPlayer * 0.35;
  return score >= 62;
}

/** Projects Camera & Senato roll-call vote and Quirinale veto risk for a bill */
export function forecastLawVote(state: GameState, law: LawDefinition): LawVoteForecast {
  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const seats = getCurrentParliamentSeats(state);
  const traits = getActiveTraitProfile(state);

  const requiredCamera = law.requiredMajority === 'qualificata' ? 267 : 201;
  const requiredSenato = law.requiredMajority === 'qualificata' ? 134 : 101;

  let cameraYes = 0;
  let senatoYes = 0;
  const supporters: string[] = [];
  const opponents: string[] = [];

  for (const p of state.parties) {
    if (p.id === 'altri') continue;
    const s = seats.find((x) => x.partyId === p.id) ?? { camera: 0, senato: 0 };
    if (s.camera === 0 && s.senato === 0 && p.id !== player.id) continue;
    if (partySupportsLaw(p, player, law, state.regimeStatus, state.allySatisfaction)) {
      cameraYes += s.camera;
      senatoYes += s.senato;
      supporters.push(p.acronym);
    } else {
      opponents.push(p.acronym);
    }
  }

  const missingPrereqs: string[] = [];
  if (law.id === 'law_pieni_poteri') {
    if (!state.institutionalFlags.mediaControl) {
      missingPrereqs.push('Controllo Rai/Media di Stato');
    }
    if (!state.institutionalFlags.judiciaryControl && !state.institutionalFlags.premierato) {
      missingPrereqs.push('Riforma Magistratura o Premierato Forte');
    }
  }

  let vetoChance = law.quirinaleRisk;
  if (state.regimeStatus === 'regime_autoritario') {
    vetoChance = 0;
  } else {
    if (state.institutionalFlags.premierato) vetoChance -= 14;
    if (state.institutionalFlags.judiciaryControl) vetoChance -= 18;
    if (state.institutionalFlags.mediaControl) vetoChance -= 10;
    if (state.stateIndicators.democraticHealth < 45) vetoChance -= 12;
    vetoChance += traits.quirinaleVetoMod;
    if (missingPrereqs.length > 0) vetoChance = Math.max(vetoChance, 86);
    vetoChance = Math.round(clamp(vetoChance, 0, 95));
  }

  const willPass =
    state.regimeStatus === 'regime_autoritario' ||
    (cameraYes >= requiredCamera && senatoYes >= requiredSenato);

  return {
    cameraYes: state.regimeStatus === 'regime_autoritario' ? 400 : cameraYes,
    cameraNo: state.regimeStatus === 'regime_autoritario' ? 0 : Math.max(0, 400 - cameraYes),
    senatoYes: state.regimeStatus === 'regime_autoritario' ? 200 : senatoYes,
    senatoNo: state.regimeStatus === 'regime_autoritario' ? 0 : Math.max(0, 200 - senatoYes),
    requiredCamera,
    requiredSenato,
    willPass,
    quirinaleVetoChance: vetoChance,
    missingPrereqs,
    supporters,
    opponents,
  };
}

/** Proposes and votes a real parliamentary bill or constitutional reform */
export function voteParliamentLaw(
  state: GameState,
  lawId: string,
  instrument: LegislativeInstrument = 'ddl',
  withConfidence = false
): { nextState: GameState; feedback: string; error?: string; triggeredCollapse?: boolean } {
  if (getPlayerParliamentSeats(state).isExtraParliamentary) {
    return {
      nextState: state,
      feedback: '',
      error:
        'Sezione bloccata: il tuo partito è attualmente extra-parlamentare (0 seggi). Supera la soglia del 3% alle elezioni per entrare in Parlamento e sbloccare leggi, mozioni e Governo.',
    };
  }

  const law = PARLIAMENT_LAWS.find((l) => l.id === lawId);
  if (!law) return { nextState: state, feedback: '', error: 'Provvedimento non trovato.' };

  if (state.actionsTakenThisWeek.includes('parl_vote_week')) {
    return {
      nextState: state,
      feedback: '',
      error: 'Il calendario d’Aula ha già previsto una votazione legislativa questa settimana. Avanza al turno successivo.',
    };
  }

  if (law.category !== 'elettorale' && state.enactedLawIds.includes(law.id)) {
    return {
      nextState: state,
      feedback: '',
      error: 'Questa legge è già stata approvata ed è in vigore.',
    };
  }

  if (law.electoralLawChange && state.electoralLaw === law.electoralLawChange) {
    return {
      nextState: state,
      feedback: '',
      error: 'Questa legge elettorale è già il sistema vigente.',
    };
  }

  const isInGov = state.isPrimeMinister || state.governmentRole !== 'opposizione';
  const effectiveInstrument: LegislativeInstrument =
    instrument === 'dl' &&
    isInGov &&
    law.category !== 'costituzionale' &&
    state.regimeStatus !== 'regime_autoritario'
      ? 'dl'
      : 'ddl';

  if (instrument === 'dl' && effectiveInstrument !== 'dl') {
    return {
      nextState: state,
      feedback: '',
      error:
        law.category === 'costituzionale'
          ? 'Un Decreto-Legge non può modificare la Costituzione: usa un DDL costituzionale.'
          : 'Solo il Governo in carica può emanare un Decreto-Legge d’urgenza.',
    };
  }

  if (
    effectiveInstrument === 'dl' &&
    (state.activeDecreeLaws ?? []).some(
      (d) => d.lawId === law.id && d.status === 'in_conversione'
    )
  ) {
    return {
      nextState: state,
      feedback: '',
      error: 'Esiste già un Decreto-Legge attivo in attesa di conversione per questo provvedimento.',
    };
  }

  if ((state.pendingBills ?? []).some((b) => b.lawId === law.id)) {
    return {
      nextState: state,
      feedback: '',
      error: 'Questo Disegno di Legge è già in corso di esame parlamentare (iter DDL attivo).',
    };
  }

  if (withConfidence && !isInGov) {
    return {
      nextState: state,
      feedback: '',
      error: 'Solo il Governo può porre la Questione di Fiducia in Parlamento.',
    };
  }

  const cost = law.budgetDelta < 0 ? Math.abs(law.budgetDelta) : 0;
  if (state.budget < cost) {
    return {
      nextState: state,
      feedback: '',
      error: `Fondi insufficienti per coprire l’iniziativa parlamentare (€${cost.toLocaleString('it-IT')}).`,
    };
  }

  const dateLabel = formatGameDate(state.week).shortLabel;
  const player = state.parties.find((p) => p.id === state.playerPartyId)!;

  // Decreto-Legge (Art. 77 Cost.): effetto immediato, 60 giorni (8 settimane) per la conversione in Aula
  if (effectiveInstrument === 'dl') {
    const partialDemo: Partial<Record<DemographicId, number>> = {};
    for (const [k, v] of Object.entries(law.demoEffects)) {
      if (typeof v === 'number') partialDemo[k as DemographicId] = round1(v * 0.6);
    }
    let updatedParties = applyElectoralShift(
      state.parties,
      player.id,
      partialDemo,
      law.regionEffects,
      undefined,
      { weekStartPoll: state.weekStartPlayerPoll ?? player.previousPoll }
    );
    const nextAxis = applyAxisShift(player.axis, law.axisShift);
    updatedParties = updatedParties.map((p) =>
      p.id === player.id ? { ...p, axis: nextAxis } : p
    );

    const nextFlags: InstitutionalFlags = { ...state.institutionalFlags };
    if (law.grantsFlag) {
      nextFlags[law.grantsFlag] = true;
    }

    const nextIndicators = applyStateEffects(state.stateIndicators, {
      ...law.stateEffects,
      democraticHealth: (law.stateEffects.democraticHealth ?? 0) - 2,
    });
    const nextElectoralLaw = law.electoralLawChange ?? state.electoralLaw;
    const nextEnactedIds = state.enactedLawIds.includes(law.id)
      ? state.enactedLawIds
      : [...state.enactedLawIds, law.id];

    const newDecree: ActiveDecreeLaw = {
      id: uid('dl'),
      lawId: law.id,
      title: law.title,
      enactedAtWeek: state.week,
      expiresAtWeek: state.week + 8,
      weeksRemaining: 8,
      confidenceUsed: false,
      status: 'in_conversione',
      previousElectoralLaw: law.electoralLawChange ? state.electoralLaw : undefined,
      grantedFlag: law.grantsFlag,
    };

    const nextAllySatisfaction = { ...(state.allySatisfaction ?? {}) };
    for (const allyId of Object.keys(nextAllySatisfaction)) {
      nextAllySatisfaction[allyId] = clamp(nextAllySatisfaction[allyId] - 2, 0, 100);
    }

    const mediaItem: MediaItem = {
      id: uid('med'),
      week: state.week,
      dateLabel,
      type: 'stampa',
      source: 'Gazzetta Ufficiale · CdM',
      headline: `DECRETO-LEGGE IMMEDIATO: il Governo approva "${law.title}" (60 giorni per la conversione)`,
      excerpt: `Il provvedimento entra subito in vigore per decreto (Art. 77 Cost.). Le Camere avranno 8 settimane (60 giorni) per convertirlo in legge prima della decadenza automatica.`,
      sentiment: 'neutro',
      partyColor: player.color,
    };

    return {
      nextState: {
        ...state,
        budget: Math.max(0, state.budget + law.budgetDelta),
        parties: updatedParties,
        stateIndicators: nextIndicators,
        electoralLaw: nextElectoralLaw,
        enactedLawIds: nextEnactedIds,
        institutionalFlags: nextFlags,
        regimeStatus: deriveRegimeStatus(nextFlags, nextIndicators.democraticHealth),
        allySatisfaction: nextAllySatisfaction,
        activeDecreeLaws: [newDecree, ...(state.activeDecreeLaws ?? [])].slice(0, 12),
        actionsTakenThisWeek: [...state.actionsTakenThisWeek, 'parl_vote_week'],
        mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
        totalBillsProposed: state.totalBillsProposed + 1,
      },
      feedback: `Decreto-Legge "${law.title}" subito in vigore! Hai 60 giorni (8 settimane) per convertirlo in Parlamento.`,
    };
  }

  // Disegno di Legge (DDL) ordinario del Governo: iter parlamentare più lungo (3 sett.) ma stabile, zero logoramento della coalizione
  if (
    effectiveInstrument === 'ddl' &&
    !withConfidence &&
    isInGov &&
    law.category !== 'costituzionale' &&
    state.regimeStatus !== 'regime_autoritario'
  ) {
    const newBill: PendingBill = {
      id: uid('ddl'),
      lawId: law.id,
      title: law.title,
      startedAtWeek: state.week,
      totalWeeks: 3,
      weeksRemaining: 3,
      stage: 'commissione',
      blockedByAmendments: false,
      hostileAmendmentsCount: 0,
      confidenceUsed: false,
    };

    const mediaItem: MediaItem = {
      id: uid('med'),
      week: state.week,
      dateLabel,
      type: 'stampa',
      source: 'Montecitorio · Iter Legislativo',
      headline: `DDL ORDINARIO: il Governo deposita "${law.title}" in Commissione (iter 3 settimane)`,
      excerpt: `Scelta la via parlamentare ordinaria (Art. 70 Cost.): tempi più lunghi rispetto al Decreto-Legge, ma zero logoramento sulla coalizione di maggioranza.`,
      sentiment: 'neutro',
      partyColor: player.color,
    };

    return {
      nextState: {
        ...state,
        budget: Math.max(0, state.budget + law.budgetDelta),
        pendingBills: [newBill, ...(state.pendingBills ?? [])].slice(0, 8),
        actionsTakenThisWeek: [...state.actionsTakenThisWeek, 'parl_vote_week'],
        mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
        totalBillsProposed: state.totalBillsProposed + 1,
      },
      feedback: `DDL "${law.title}" incardinato in Commissione (iter ordinario di 3 settimane, nessun logoramento della coalizione).`,
    };
  }

  const forecast = forecastLawVote(state, law);

  // Small realistic franc-tireurs swing (-4..+3) unless authoritarian regime
  // Questione di Fiducia compels coalition discipline (+20 Camera / +10 Senato) at the cost of coalition & opposition wear
  const confidenceCamBonus = withConfidence ? 20 : 0;
  const confidenceSenBonus = withConfidence ? 10 : 0;
  const camSwing =
    state.regimeStatus === 'regime_autoritario' ? 0 : Math.floor(Math.random() * 8) - 4;
  const senSwing =
    state.regimeStatus === 'regime_autoritario' ? 0 : Math.floor(Math.random() * 5) - 2;
  const finalCamYes =
    state.regimeStatus === 'regime_autoritario'
      ? 400
      : clamp(forecast.cameraYes + confidenceCamBonus + camSwing, 0, 400);
  const finalSenYes =
    state.regimeStatus === 'regime_autoritario'
      ? 200
      : clamp(forecast.senatoYes + confidenceSenBonus + senSwing, 0, 200);
  const passedChambers =
    state.regimeStatus === 'regime_autoritario' ||
    (finalCamYes >= forecast.requiredCamera && finalSenYes >= forecast.requiredSenato);

  // Wear from Questione di Fiducia: logora coesione maggioranza e alza la tensione con l'opposizione
  let nextAllySatisfaction = { ...(state.allySatisfaction ?? {}) };
  let nextExecutives = state.executives;
  let basePartiesForVote = state.parties;
  if (withConfidence) {
    for (const allyId of Object.keys(nextAllySatisfaction)) {
      nextAllySatisfaction[allyId] = clamp(nextAllySatisfaction[allyId] - 8, 0, 100);
    }
    nextExecutives = state.executives.map((ex) => ({
      ...ex,
      loyalty: clamp(ex.loyalty - 3, 5, 100),
    }));
    basePartiesForVote = state.parties.map((p) => {
      const isOpposition =
        p.id !== player.id &&
        p.id !== 'altri' &&
        (!player.coalitionId || p.coalitionId !== player.coalitionId);
      return isOpposition
        ? { ...p, relationWithPlayer: clamp(p.relationWithPlayer - 6, -100, 100) }
        : p;
    });
  }

  // Case 1: Rejected by Parliament
  if (!passedChambers) {
    const partialAxis = applyAxisShift(player.axis, {
      economic: Math.round((law.axisShift.economic ?? 0) * 0.4),
      society: Math.round((law.axisShift.society ?? 0) * 0.4),
      europe: Math.round((law.axisShift.europe ?? 0) * 0.4),
      institutions: Math.round((law.axisShift.institutions ?? 0) * 0.4),
    });
    let updatedParties = basePartiesForVote.map((p) =>
      p.id === player.id ? { ...p, axis: partialAxis } : p
    );

    // Se fallisce una Questione di Fiducia, il Governo CADE!
    if (withConfidence) {
      updatedParties = applyElectoralShift(updatedParties, player.id, {
        giovani: -0.7,
        lavoratori: -0.6,
        imprese: -0.8,
        pensionati: -0.6,
      }).map((p) => (p.id === player.id ? { ...p, isInGovernment: false } : p));

      const record: LawVoteRecord = {
        id: uid('vote'),
        lawId: law.id,
        title: law.title,
        week: state.week,
        dateLabel,
        cameraYes: finalCamYes,
        cameraNo: 400 - finalCamYes,
        senatoYes: finalSenYes,
        senatoNo: 200 - finalSenYes,
        outcome: 'respinta',
        instrument: 'ddl',
        confidenceUsed: true,
        summary: `GOVERNO BATTUTO SULLA FIDUCIA (${finalCamYes}/400 Camera · ${finalSenYes}/200 Senato)! Dimissioni al Quirinale e scioglimento delle Camere.`,
      };

      const mediaItem: MediaItem = {
        id: uid('med'),
        week: state.week,
        dateLabel,
        type: 'stampa',
        source: 'EDIZIONE STRAORDINARIA · ANSA',
        headline: `CRISI DI GOVERNO: l’esecutivo cade sulla Questione di Fiducia per "${law.title}"!`,
        excerpt: `Maggioranza battuta in Aula (${finalCamYes} Sì Camera, ${finalSenYes} Sì Senato). Il Presidente della Repubblica scioglie le Camere.`,
        sentiment: 'negativo',
        partyColor: '#F43F5E',
      };

      const fallenState: GameState = {
        ...state,
        budget: Math.max(0, state.budget - Math.round(cost * 0.5)),
        parties: updatedParties,
        executives: nextExecutives,
        governmentRole: 'opposizione',
        isPrimeMinister: false,
        governmentMinistries: {},
        governmentMinistryExecutives: {},
        allySatisfaction: {},
        actionsTakenThisWeek: [...state.actionsTakenThisWeek, 'parl_vote_week'],
        leaderApproval: adjustLeaderApproval(state.leaderApproval, player.id, -6),
        stateIndicators: applyStateEffects(state.stateIndicators, {
          spread: 28,
          socialStability: -10,
        }),
        lawVoteHistory: [record, ...state.lawVoteHistory].slice(0, 24),
        mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
        totalBillsProposed: state.totalBillsProposed + 1,
      };

      const collapsed = state.election ? fallenState : triggerElectionNight(fallenState);
      return {
        nextState: collapsed,
        feedback: record.summary,
        triggeredCollapse: true,
      };
    }

    const record: LawVoteRecord = {
      id: uid('vote'),
      lawId: law.id,
      title: law.title,
      week: state.week,
      dateLabel,
      cameraYes: finalCamYes,
      cameraNo: 400 - finalCamYes,
      senatoYes: finalSenYes,
      senatoNo: 200 - finalSenYes,
      outcome: 'respinta',
      instrument: 'ddl',
      confidenceUsed: false,
      summary: `Bocciata in Aula (${finalCamYes}/400 Camera · ${finalSenYes}/200 Senato). Servono più seggi o alleanze.`,
    };

    const mediaItem: MediaItem = {
      id: uid('med'),
      week: state.week,
      dateLabel,
      type: 'stampa',
      source: 'Cronaca di Palazzo',
      headline: `Aula boccia "${law.title}": maggioranza insufficiente (${finalCamYes} Sì alla Camera)`,
      excerpt: `L’iniziativa di ${player.name} si arena sul voto parlamentare. Il profilo politico del partito resta segnato dalla proposta.`,
      sentiment: 'negativo',
      partyColor: player.color,
    };

    return {
      nextState: {
        ...state,
        budget: Math.max(0, state.budget - Math.round(cost * 0.5)),
        parties: updatedParties,
        actionsTakenThisWeek: [...state.actionsTakenThisWeek, 'parl_vote_week'],
        lawVoteHistory: [record, ...state.lawVoteHistory].slice(0, 24),
        mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
        totalBillsProposed: state.totalBillsProposed + 1,
      },
      feedback: record.summary,
    };
  }

  // Case 2: Check Quirinale Presidential Veto
  const roll = Math.random() * 100;
  const hitVeto =
    state.regimeStatus !== 'regime_autoritario' &&
    forecast.quirinaleVetoChance > 0 &&
    roll < forecast.quirinaleVetoChance;

  if (hitVeto) {
    const isCoupAttempt = law.id === 'law_pieni_poteri';
    const spreadShock = isCoupAttempt ? 75 : 24;
    const stabShock = isCoupAttempt ? -26 : -10;
    const euShock = isCoupAttempt ? -25 : -8;

    let updatedParties = applyElectoralShift(state.parties, player.id, {
      giovani: isCoupAttempt ? -2.2 : -0.6,
      imprese: isCoupAttempt ? -2.0 : -0.5,
      pensionati: isCoupAttempt ? -1.4 : -0.4,
      lavoratori: isCoupAttempt ? -1.2 : -0.3,
    });
    const nextAxis = applyAxisShift(player.axis, law.axisShift);
    updatedParties = updatedParties.map((p) =>
      p.id === player.id ? { ...p, axis: nextAxis } : p
    );

    const nextIndicators = applyStateEffects(state.stateIndicators, {
      spread: spreadShock,
      socialStability: stabShock,
      euRelations: euShock,
      democraticHealth: isCoupAttempt ? -14 : -5,
    });

    const record: LawVoteRecord = {
      id: uid('vote'),
      lawId: law.id,
      title: law.title,
      week: state.week,
      dateLabel,
      cameraYes: finalCamYes,
      cameraNo: 400 - finalCamYes,
      senatoYes: finalSenYes,
      senatoNo: 200 - finalSenYes,
      outcome: 'veto_quirinale',
      instrument: 'ddl',
      confidenceUsed: withConfidence,
      summary: isCoupAttempt
        ? 'VETO DEL QUIRINALE! Il Capo dello Stato blocca i Pieni Poteri e scioglie d’urgenza le Camere.'
        : 'Rinvio del Presidente della Repubblica per rilievi costituzionali: spread in rialzo e tensioni di piazza.',
    };

    const mediaItem: MediaItem = {
      id: uid('med'),
      week: state.week,
      dateLabel,
      type: 'stampa',
      source: 'Il Corriere Nazionale',
      headline: isCoupAttempt
        ? 'ALTA TENSIONE AL QUIRINALE: bloccata la svolta sui Pieni Poteri, crisi istituzionale!'
        : `Il Quirinale rinvia alle Camere "${law.title}": stop costituzionale`,
      excerpt: record.summary,
      sentiment: 'negativo',
      partyColor: '#F43F5E',
    };

    let nextState: GameState = {
      ...state,
      budget: Math.max(0, state.budget - cost),
      parties: updatedParties,
      executives: nextExecutives,
      allySatisfaction: nextAllySatisfaction,
      actionsTakenThisWeek: [...state.actionsTakenThisWeek, 'parl_vote_week'],
      stateIndicators: nextIndicators,
      regimeStatus: deriveRegimeStatus(state.institutionalFlags, nextIndicators.democraticHealth),
      lawVoteHistory: [record, ...state.lawVoteHistory].slice(0, 24),
      mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
      totalBillsProposed: state.totalBillsProposed + 1,
    };

    // Premature coup attempt without control of media/judiciary collapses the government into snap elections
    if (isCoupAttempt && forecast.missingPrereqs.length > 0 && !state.election) {
      nextState = triggerElectionNight(nextState);
      return {
        nextState,
        feedback:
          'VETO DEL QUIRINALE! Tentativo di Pieni Poteri senza controllo di Media e Magistratura: Camere sciolte, si va subito alle urne!',
        triggeredCollapse: true,
      };
    }

    return { nextState, feedback: record.summary };
  }

  // Case 3: Law Approved & Promulgated!
  let updatedParties = applyElectoralShift(
    basePartiesForVote,
    player.id,
    law.demoEffects,
    law.regionEffects,
    undefined,
    { weekStartPoll: state.weekStartPlayerPoll ?? player.previousPoll }
  );
  const nextAxis = applyAxisShift(player.axis, law.axisShift);
  updatedParties = updatedParties.map((p) =>
    p.id === player.id ? { ...p, axis: nextAxis } : p
  );

  const nextFlags: InstitutionalFlags = { ...state.institutionalFlags };
  if (law.grantsFlag) {
    nextFlags[law.grantsFlag] = true;
  }

  const nextIndicators = applyStateEffects(state.stateIndicators, {
    ...law.stateEffects,
    socialStability: (law.stateEffects.socialStability ?? 0) - (withConfidence ? 4 : 0),
    democraticHealth: (law.stateEffects.democraticHealth ?? 0) - (withConfidence ? 3 : 0),
  });
  const nextRegimeStatus = deriveRegimeStatus(nextFlags, nextIndicators.democraticHealth);
  const nextElectoralLaw = law.electoralLawChange ?? state.electoralLaw;
  const nextEnactedIds = state.enactedLawIds.includes(law.id)
    ? state.enactedLawIds
    : [...state.enactedLawIds, law.id];

  // Art. 138 Cost.: se una riforma costituzionale passa senza la maggioranza dei 2/3 (267 Cam / 134 Sen),
  // abilita la richiesta di Referendum Confermativo Costituzionale (senza quorum).
  const passedUnderTwoThirds =
    law.category === 'costituzionale' &&
    law.id !== 'law_pieni_poteri' &&
    state.regimeStatus !== 'regime_autoritario' &&
    (finalCamYes < 267 || finalSenYes < 134);
  const nextPendingConstRefs =
    passedUnderTwoThirds &&
    !(state.pendingConstitutionalReferendumLawIds ?? []).includes(law.id)
      ? [...(state.pendingConstitutionalReferendumLawIds ?? []), law.id]
      : [...(state.pendingConstitutionalReferendumLawIds ?? [])];

  const record: LawVoteRecord = {
    id: uid('vote'),
    lawId: law.id,
    title: law.title,
    week: state.week,
    dateLabel,
    cameraYes: finalCamYes,
    cameraNo: 400 - finalCamYes,
    senatoYes: finalSenYes,
    senatoNo: 200 - finalSenYes,
    outcome: 'approvata',
    instrument: 'ddl',
    confidenceUsed: withConfidence,
    summary:
      law.id === 'law_pieni_poteri'
        ? 'REGIME AUTORITARIO INSTAURATO: Parlamento sospeso, decreti esecutivi diretti da Palazzo Chigi.'
        : withConfidence
          ? `Approvata con Questione di Fiducia (${finalCamYes} Camera / ${finalSenYes} Senato): testo blindato ma logoramento nella coalizione.`
          : passedUnderTwoThirds
            ? `Approvata sotto i 2/3 (${finalCamYes}/400 Camera · ${finalSenYes}/200 Senato): attivabile Referendum Confermativo Costituzionale (Art. 138 Cost., senza quorum).`
            : `Approvata (${finalCamYes} Camera / ${finalSenYes} Senato) e promulgata in Gazzetta Ufficiale.`,
  };

  const mediaItem: MediaItem = {
    id: uid('med'),
    week: state.week,
    dateLabel,
    type: 'stampa',
    source: 'Gazzetta Parlamentare',
    headline: withConfidence
      ? `FIDUCIA IN AULA: passa "${law.title}" tra le proteste delle opposizioni`
      : law.enactedHeadline,
    excerpt: record.summary,
    sentiment: law.id === 'law_pieni_poteri' ? 'negativo' : 'positivo',
    partyColor: player.color,
  };

  const nextState: GameState = {
    ...state,
    budget: Math.max(0, state.budget + law.budgetDelta),
    parties: updatedParties,
    executives: nextExecutives,
    allySatisfaction: nextAllySatisfaction,
    actionsTakenThisWeek: [...state.actionsTakenThisWeek, 'parl_vote_week'],
    stateIndicators: nextIndicators,
    electoralLaw: nextElectoralLaw,
    enactedLawIds: nextEnactedIds,
    institutionalFlags: nextFlags,
    regimeStatus: nextRegimeStatus,
    governmentRole: nextFlags.fullPowers ? 'premier' : state.governmentRole,
    electionWeek: nextFlags.fullPowers ? state.week + 999 : state.electionWeek,
    lawVoteHistory: [record, ...state.lawVoteHistory].slice(0, 24),
    mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
    totalBillsProposed: state.totalBillsProposed + 1,
    pendingConstitutionalReferendumLawIds: nextPendingConstRefs,
  };

  return {
    nextState,
    feedback: passedUnderTwoThirds
      ? `${law.enactedHeadline} Approvata senza 2/3: Referendum Confermativo Costituzionale (Art. 138) ora richiedibile!`
      : withConfidence
        ? `Fiducia approvata su "${law.title}" (${finalCamYes} Cam / ${finalSenYes} Sen)! Attenzione al logoramento degli alleati.`
        : law.enactedHeadline,
  };
}

/** Restores parliamentary democracy from an Authoritarian Regime and calls free elections in 8 weeks */
export function restoreConstitutionalOrder(state: GameState): {
  nextState: GameState;
  feedback: string;
} {
  const dateLabel = formatGameDate(state.week).shortLabel;
  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const nextFlags: InstitutionalFlags = {
    ...state.institutionalFlags,
    fullPowers: false,
  };
  const nextIndicators = applyStateEffects(state.stateIndicators, {
    spread: -45,
    democraticHealth: 36,
    euRelations: 22,
    socialStability: 16,
  });
  const nextAxis = applyAxisShift(player.axis, { institutions: -30, europe: 15 });
  const updatedParties = state.parties.map((p) =>
    p.id === player.id ? { ...p, axis: nextAxis } : p
  );

  const feedback =
    'Ordine costituzionale ripristinato: revocati i Pieni Poteri, libere elezioni fissate tra 8 settimane.';
  const mediaItem: MediaItem = {
    id: uid('med'),
    week: state.week,
    dateLabel,
    type: 'stampa',
    source: 'Il Corriere Nazionale',
    headline: 'Ritorno alla democrazia parlamentare: revocati i Pieni Poteri, spread in crollo',
    excerpt: feedback,
    sentiment: 'positivo',
    partyColor: '#10B981',
  };

  return {
    nextState: {
      ...state,
      parties: updatedParties,
      institutionalFlags: nextFlags,
      stateIndicators: nextIndicators,
      regimeStatus: deriveRegimeStatus(nextFlags, nextIndicators.democraticHealth),
      enactedLawIds: state.enactedLawIds.filter((id) => id !== 'law_pieni_poteri'),
      electionWeek: state.week + 8,
      mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
    },
    feedback,
  };
}

/** Executive management actions (gestiti tramite budget reale e limite naturale di 1 incarico/colloquio per dirigente a settimana) */
export function manageExecutive(
  state: GameState,
  execId: string,
  action: 'colloquio' | 'incarico' | 'sostituisci'
): { nextState: GameState; feedback: string; error?: string } {
  const idx = state.executives.findIndex((e) => e.id === execId);
  if (idx === -1) return { nextState: state, feedback: '', error: 'Dirigente non trovato.' };

  const exec = state.executives[idx];
  if (exec.actedThisWeek && action !== 'sostituisci') {
    return { nextState: state, feedback: '', error: 'Hai già gestito questo dirigente in questa settimana.' };
  }

  const traits = getActiveTraitProfile(state);
  let budgetCost = 0;
  let updatedExecs = [...state.executives];
  let feedback = '';

  if (action === 'colloquio') {
    const loyaltyGain = 11 + traits.colloquioBonus;
    updatedExecs[idx] = {
      ...exec,
      loyalty: clamp(exec.loyalty + loyaltyGain, 0, 100),
      actedThisWeek: true,
    };
    feedback = `Colloquio riservato con ${exec.name}: lealtà salita a ${updatedExecs[idx].loyalty}% (+${loyaltyGain}%).`;
    return {
      nextState: {
        ...state,
        executives: updatedExecs,
      },
      feedback,
    };
  }

  if (action === 'incarico') {
    budgetCost = EXECUTIVE_ACTION_COSTS.incarico;
    if (state.budget < budgetCost) {
      return {
        nextState: state,
        feedback: '',
        error: `Servono €${budgetCost.toLocaleString('it-IT')} per finanziare il dossier operativo.`,
      };
    }
    updatedExecs[idx] = {
      ...exec,
      competence: clamp(exec.competence + 5, 0, 100),
      loyalty: clamp(exec.loyalty + 6, 0, 100),
      actedThisWeek: true,
    };
    feedback = `Dossier affidato a ${exec.name}: competenza +5, lealtà +6 (€${budgetCost.toLocaleString('it-IT')}).`;
    return {
      nextState: {
        ...state,
        budget: state.budget - budgetCost,
        executives: updatedExecs,
      },
      feedback,
    };
  }

  budgetCost = EXECUTIVE_ACTION_COSTS.sostituisci;
  if (state.budget < budgetCost) {
    return {
      nextState: state,
      feedback: '',
      error: `Servono €${budgetCost.toLocaleString('it-IT')} per la transizione organizzativa.`,
    };
  }
  const pool = REPLACEMENT_CANDIDATES[exec.role] ?? REPLACEMENT_CANDIDATES.vice_segretario;
  const candidate = pool.find((c) => c.name !== exec.name) ?? pool[0];
  updatedExecs[idx] = {
    ...exec,
    name: candidate.name,
    faction: candidate.faction,
    specialization: candidate.specialization,
    competence: candidate.competence,
    loyalty: candidate.loyalty,
    ambition: candidate.ambition,
    trait: candidate.trait,
    lowLoyaltyWeeks: 0,
    actedThisWeek: true,
  };
  updatedExecs = updatedExecs.map((e, i) =>
    i === idx ? e : { ...e, loyalty: clamp(e.loyalty - 4, 15, 100) }
  );
  feedback = `${exec.roleLabel} sostituito: nominato ${candidate.name} (${candidate.faction} · spec. ${getSpecializationLabel(candidate.specialization)}).`;
  return {
    nextState: {
      ...state,
      budget: state.budget - budgetCost,
      executives: updatedExecs,
    },
    feedback,
  };
}

/** Coalition diplomacy actions (gestite tramite budget operativo e cadenza settimanale naturale, senza PA) */
export function negotiateCoalition(
  state: GameState,
  targetPartyId: string,
  action: 'proponi_alleanza' | 'patto_governo' | 'rompi_alleanza' | 'attacco'
): { nextState: GameState; feedback: string; error?: string } {
  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const target = state.parties.find((p) => p.id === targetPartyId);
  if (!target || target.id === 'altri') {
    return { nextState: state, feedback: '', error: 'Partito non valido.' };
  }

  const traits = getActiveTraitProfile(state);
  const compat = computeIdeologicalCompatibility(player, target);
  const dateLabel = formatGameDate(state.week).shortLabel;
  let updatedParties = [...state.parties];
  let feedback = '';
  let headline = '';

  const playerCoalitionKey = player.coalitionId ?? 'player_coalition';

  if (action === 'proponi_alleanza' || action === 'patto_governo') {
    const dealKey = `coal_deal_${target.id}`;
    if (state.actionsTakenThisWeek.includes(dealKey)) {
      return {
        nextState: state,
        feedback: '',
        error: `Hai già condotto una trattativa formale con ${target.acronym} questa settimana.`,
      };
    }
    const cost = COALITION_ACTION_COSTS[action];
    if (state.budget < cost) {
      return {
        nextState: state,
        feedback: '',
        error: `Servono €${cost.toLocaleString('it-IT')} per coprire delegazione e tavolo di trattativa.`,
      };
    }
    const threshold = action === 'proponi_alleanza' ? 32 : 45;
    const score =
      target.relationWithPlayer +
      (compat - 50) * 0.7 +
      traits.coalitionBonus;

    if (score >= threshold) {
      updatedParties = state.parties.map((p) => {
        if (p.id === player.id) {
          return { ...p, coalitionId: playerCoalitionKey };
        }
        if (p.id === target.id) {
          return {
            ...p,
            coalitionId: playerCoalitionKey,
            coalitionStatus: 'alleato' as CoalitionStatus,
            relationWithPlayer: clamp(p.relationWithPlayer + 15, -100, 100),
          };
        }
        return p;
      });
      feedback = `Accordo siglato! ${target.name} entra nella coalizione con ${player.name}.`;
      headline = `Patto siglato: ${player.acronym} e ${target.acronym} correranno insieme nei collegi uninominali`;
    } else {
      updatedParties = state.parties.map((p) =>
        p.id === target.id
          ? { ...p, relationWithPlayer: clamp(p.relationWithPlayer + 5 + Math.max(0, Math.round(traits.diplomacyGainBonus / 2)), -100, 100) }
          : p
      );
      feedback = `${target.leaderName} frena: servono relazioni più solide (rapporto attuale ${target.relationWithPlayer}, compatibilità ${compat}%).`;
      headline = `${target.acronym} prende tempo sull’offerta di alleanza di ${player.leaderName}`;
    }

    const mediaItem: MediaItem = {
      id: uid('med'),
      week: state.week,
      dateLabel,
      type: 'stampa',
      source: 'Cronaca di Palazzo',
      headline,
      excerpt: feedback,
      sentiment: score >= threshold ? 'positivo' : 'neutro',
      partyColor: target.color,
    };

    return {
      nextState: {
        ...state,
        budget: state.budget - cost,
        parties: updatedParties,
        actionsTakenThisWeek: [...state.actionsTakenThisWeek, dealKey],
        mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
      },
      feedback,
    };
  }

  if (action === 'rompi_alleanza') {
    updatedParties = state.parties.map((p) =>
      p.id === target.id
        ? {
            ...p,
            coalitionId: null,
            coalitionStatus: 'avversario' as CoalitionStatus,
            relationWithPlayer: clamp(p.relationWithPlayer - 35, -100, 100),
          }
        : p
    );
    feedback = `Alleanza interrotta con ${target.name}. I collegi verranno contesi separatamente.`;
    return {
      nextState: {
        ...state,
        parties: updatedParties,
        mediaFeed: [
          {
            id: uid('med'),
            week: state.week,
            dateLabel,
            type: 'stampa' as const,
            source: 'La Tribuna Politica',
            headline: `Strappo nella coalizione: ${player.acronym} rompe con ${target.acronym}`,
            excerpt: `${target.leaderName} parla di “decisione grave che ridisegna gli equilibri parlamentari”.`,
            sentiment: 'negativo' as const,
            partyColor: target.color,
          },
          ...state.mediaFeed,
        ].slice(0, 40),
      },
      feedback,
    };
  }

  if (state.actionsTakenThisWeek.includes('coal_attack_week')) {
    return {
      nextState: state,
      feedback: '',
      error: 'Hai già lanciato un’offensiva mediatica coordinata questa settimana.',
    };
  }
  const attackCost = COALITION_ACTION_COSTS.attacco;
  if (state.budget < attackCost) {
    return {
      nextState: state,
      feedback: '',
      error: `Servono €${attackCost.toLocaleString('it-IT')} per finanziare l’offensiva stampa e social.`,
    };
  }
  updatedParties = applyElectoralShift(state.parties, target.id, {
    giovani: -0.4,
    lavoratori: -0.5,
    imprese: -0.35,
    pensionati: -0.35,
  });
  updatedParties = updatedParties.map((p) =>
    p.id === target.id
      ? {
          ...p,
          relationWithPlayer: clamp(p.relationWithPlayer - 24, -100, 100),
          coalitionStatus: p.coalitionStatus === 'alleato' ? 'avversario' : p.coalitionStatus,
          coalitionId: p.coalitionId === player.coalitionId ? null : p.coalitionId,
        }
      : p
  );
  feedback = `Offensiva mediatica contro ${target.name}: erosione nei loro sondaggi, rottura nei rapporti.`;
  return {
    nextState: {
      ...state,
      budget: state.budget - attackCost,
      parties: updatedParties,
      actionsTakenThisWeek: [...state.actionsTakenThisWeek, 'coal_attack_week'],
      mediaFeed: [
        {
          id: uid('med'),
          week: state.week,
          dateLabel,
          type: 'rivale' as const,
          source: `${target.leaderName} (${target.acronym})`,
          headline: `Scontro frontale tra ${player.acronym} e ${target.acronym}`,
          excerpt: `“Gli attacchi di ${player.leaderName} sono frutto di disperazione elettorale.”`,
          sentiment: 'negativo' as const,
          partyColor: target.color,
        },
        ...state.mediaFeed,
      ].slice(0, 40),
    },
    feedback,
  };
}

/** Triggers Election Night (either at electionWeek or via Motion of No Confidence) */
export function triggerElectionNight(state: GameState): GameState {
  // Snapshot pre-election polls right before election-day swing for Phase 3 delta analysis
  const preElectionPolls: Record<string, number> = {};
  for (const p of state.parties) {
    preElectionPolls[p.id] = p.nationalPoll;
  }

  let finalParties: PartyState[] = state.parties.map((p) => ({
    ...p,
    demographics: { ...p.demographics },
    regions: { ...p.regions },
    regionPolls: { ...p.regionPolls },
    splinterDefectedSeats: undefined,
  }));

  for (const p of finalParties) {
    if (p.id === 'altri') continue;
    const swing = p.nationalPoll < 0.2 ? 0 : (Math.random() - 0.48) * 1.4;
    for (const d of DEMOGRAPHICS) {
      p.demographics[d.id] = clamp(p.demographics[d.id] + swing, 0, 62);
    }
    for (const r of ITALIAN_REGIONS) {
      p.regionPolls[r.id] = clamp(p.regionPolls[r.id] + swing * 0.9, 0, 65);
    }
  }
  finalParties = normalizeAllPolls(finalParties);

  // Verifica ammissione lista (raccolta firme obbligatoria per extra-parlamentari non apparentati)
  const syncedBallot = syncBallotSignatureExemption(state);
  const playerExcludedFromBallot =
    !syncedBallot.exempt &&
    (syncedBallot.excludedFromBallot ||
      syncedBallot.collectedSignatures < syncedBallot.targetSignatures);

  if (playerExcludedFromBallot) {
    finalParties = finalParties.map((p) => {
      if (p.id !== state.playerPartyId) return p;
      const zeroRegions = {} as Record<RegionId, number>;
      for (const r of ITALIAN_REGIONS) zeroRegions[r.id] = 0;
      return {
        ...p,
        demographics: { giovani: 0, lavoratori: 0, imprese: 0, pensionati: 0 },
        regions: { nord_ovest: 0, nord_est: 0, centro: 0, sud: 0, isole: 0 },
        regionPolls: zeroRegions,
        nationalPoll: 0,
      };
    });
    finalParties = normalizeAllPolls(finalParties);
  }

  const seats = calculateParliamentSeats(finalParties, state.electoralLaw, false);
  const player = finalParties.find((p) => p.id === state.playerPartyId)!;
  const playerSeat = seats.find((s) => s.partyId === player.id)!;

  const coalitionTotals = new Map<
    string,
    { name: string; camera: number; senato: number; leaderParty: PartyState; members: PartyState[] }
  >();

  for (const p of finalParties) {
    if (p.id === 'altri') continue;
    const s = seats.find((x) => x.partyId === p.id)!;
    const key = p.coalitionId ? `coal_${p.coalitionId}` : `solo_${p.id}`;
    const prev = coalitionTotals.get(key);
    const label =
      p.coalitionId === player.coalitionId && player.coalitionId
        ? state.coalitionName
        : p.coalitionId === 'centrodestra'
          ? 'Coalizione di Centrodestra'
          : p.coalitionId === 'centrosinistra'
            ? 'Campo Largo Progressista'
            : p.coalitionId === 'centro'
              ? 'Polo Riformista di Centro'
              : p.name;

    if (!prev) {
      coalitionTotals.set(key, {
        name: label,
        camera: s.camera,
        senato: s.senato,
        leaderParty: p,
        members: [p],
      });
    } else {
      prev.camera += s.camera;
      prev.senato += s.senato;
      prev.members.push(p);
      if (p.nationalPoll > prev.leaderParty.nationalPoll) {
        prev.leaderParty = p;
      }
    }
  }

  const rankedCoalitions = Array.from(coalitionTotals.values()).sort(
    (a, b) => b.camera - a.camera
  );
  const winner = rankedCoalitions[0];
  const playerCoalKey = player.coalitionId ? `coal_${player.coalitionId}` : `solo_${player.id}`;
  const playerCoal = coalitionTotals.get(playerCoalKey)!;

  const hasCameraMajority = playerCoal.camera >= 201;
  const hasFullMajority = playerCoal.camera >= 201 && playerCoal.senato >= 101;
  const isWinningBlock = winner === playerCoal;
  const isLargestInCoalition = playerCoal.leaderParty.id === player.id;

  let playerRole: ElectionResult['playerRole'] = 'opposizione';
  let outcomeTitle = '';
  let outcomeNarrative = '';

  if (playerExcludedFromBallot) {
    playerRole = 'fuori_parlamento';
    outcomeTitle = 'Lista Esclusa dal Voto — Firme Insufficienti';
    outcomeNarrative = `${player.name} ha raccolto ${syncedBallot.collectedSignatures.toLocaleString('it-IT')} firme su ${syncedBallot.targetSignatures.toLocaleString('it-IT')} alla chiusura delle liste (senza apparentamento con una forza parlamentare) e non è stato ammesso alle schede di questa tornata. Riorganizza i banchetti e la base territoriale per il prossimo turno elettorale.`;
  } else if (playerSeat.camera === 0 && playerSeat.senato === 0) {
    playerRole = 'fuori_parlamento';
    outcomeTitle = 'Sotto lo Sbarramento del 3% — Opposizione Extra-Parlamentare';
    outcomeNarrative = `${player.name} chiude al ${player.nationalPoll.toFixed(1)}% (0 seggi in Parlamento). Nessun Game Over: puoi continuare all’opposizione extra-parlamentare per ricostruire consenso e casse fino alle prossime elezioni, oppure sciogliere il partito.`;
  } else if (hasCameraMajority && isLargestInCoalition) {
    playerRole = 'premier';
    outcomeTitle = 'Incarico a Palazzo Chigi: Presidente del Consiglio';
    outcomeNarrative = hasFullMajority
      ? `Trionfo elettorale! Con ${playerCoal.camera} deputati e ${playerCoal.senato} senatori, il Quirinale conferisce a ${player.leaderName} l’incarico di formare il nuovo Governo.`
      : `Maggioranza alla Camera (${playerCoal.camera} deputati) e numeri serrati al Senato (${playerCoal.senato} senatori): il Quirinale convoca ${player.leaderName} per le consultazioni di Governo.`;
  } else if (hasCameraMajority && !isLargestInCoalition) {
    playerRole = 'partner_governo';
    outcomeTitle = 'Maggioranza di Governo: Vice-Premier e Ministeri Chiave';
    outcomeNarrative = `La tua coalizione conquista la maggioranza alla Camera (${playerCoal.camera} Camera / ${playerCoal.senato} Senato). ${player.name} è decisivo nel Consiglio dei Ministri.`;
  } else if (isWinningBlock && !hasCameraMajority) {
    playerRole = isLargestInCoalition ? 'premier' : 'partner_governo';
    outcomeTitle = 'Prima Coalizione: Consultazioni per Governo di Larghe Intese';
    outcomeNarrative = `${playerCoal.name} è la prima forza del Paese (${playerCoal.camera} deputati), ma serve un’intesa parlamentare al Quirinale per raggiungere quota 201.`;
  } else if (rankedCoalitions[1] === playerCoal && isLargestInCoalition) {
    playerRole = 'capo_opposizione';
    outcomeTitle = 'Capo dell’Opposizione Parlamentare';
    outcomeNarrative = `${winner.name} conquista il primato, ma ${player.name} guida il principale fronte d’opposizione con ${playerCoal.camera} seggi alla Camera.`;
  } else {
    playerRole = 'opposizione';
    outcomeTitle = 'Gruppo Parlamentare all’Opposizione';
    outcomeNarrative = `${player.name} entra in Parlamento con ${playerSeat.camera} deputati e ${playerSeat.senato} senatori, pronto a condizionare la legislatura.`;
  }

  const finalVotes: Record<string, number> = {};
  for (const p of finalParties) finalVotes[p.id] = p.nationalPoll;

  const regionalVotes = {} as Record<MacroRegionId, Record<string, number>>;
  for (const r of MACRO_REGIONS) {
    regionalVotes[r.id] = {};
    for (const p of finalParties) {
      regionalVotes[r.id][p.id] = p.regions[r.id];
    }
  }

  const election: ElectionResult = {
    conductedAtWeek: state.week,
    dateLabel: formatGameDate(state.week).fullLabel,
    stage: 0,
    finalVotes,
    regionalVotes,
    seats,
    playerCoalitionCamera: playerCoal.camera,
    playerCoalitionSenato: playerCoal.senato,
    winningCoalitionName: winner.name,
    winningCoalitionCamera: winner.camera,
    winningCoalitionSenato: winner.senato,
    playerRole,
    outcomeTitle,
    outcomeNarrative,
    turnout: round1(61.5 + Math.random() * 6.5),
    postElectionResolved: false,
    playerExcludedFromBallot,
    preElectionPolls,
  };

  return {
    ...state,
    parties: playerExcludedFromBallot ? state.parties : finalParties,
    ballotSignatures: syncedBallot,
    pendingBudgetLaw: false,
    quirinaleElection: null,
    election,
  };
}

export interface CencelliEvaluation {
  coalitionParties: PartyState[];
  allyReports: AllySatisfactionReport[];
  playerCameraSeats: number;
  playerSenatoSeats: number;
  playerAssignedMinistries: MinistryId[];
  playerAssignedWeight: number;
  totalCoalitionCamera: number;
  totalCoalitionSenato: number;
  confidentCamera: number;
  confidentSenato: number;
  canFormGovernment: boolean;
  blockingAllies: AllySatisfactionReport[];
}

/**
 * Valuta la Soddisfazione Coalizione secondo il Manuale Cencelli proporzionale ai seggi
 * per i 6 Ministeri Chiave (MEF, Interno, Giustizia, Esteri, Infrastrutture, Salute).
 */
export function evaluateCencelliSatisfaction(
  parties: PartyState[],
  playerPartyId: string,
  seats: SeatAllocation[],
  assignments: Partial<Record<MinistryId, string>>,
  persistedSatisfaction?: Record<string, number>
): CencelliEvaluation {
  const player = parties.find((p) => p.id === playerPartyId);
  if (!player) {
    return {
      coalitionParties: [],
      allyReports: [],
      playerCameraSeats: 0,
      playerSenatoSeats: 0,
      playerAssignedMinistries: [],
      playerAssignedWeight: 0,
      totalCoalitionCamera: 0,
      totalCoalitionSenato: 0,
      confidentCamera: 0,
      confidentSenato: 0,
      canFormGovernment: false,
      blockingAllies: [],
    };
  }

  const seatOf = (partyId: string) =>
    seats.find((s) => s.partyId === partyId) ?? { camera: 0, senato: 0 };

  // Include nei negoziati di Governo solo i partiti di coalizione realmente entrati in Parlamento
  const coalitionParties = parties.filter(
    (p) =>
      p.id !== 'altri' &&
      (p.id === player.id ||
        (Boolean(player.coalitionId) &&
          p.coalitionId === player.coalitionId &&
          seatOf(p.id).camera + seatOf(p.id).senato > 0))
  );

  const totalCoalitionCamera = coalitionParties.reduce(
    (acc, p) => acc + seatOf(p.id).camera,
    0
  );
  const totalCoalitionSenato = coalitionParties.reduce(
    (acc, p) => acc + seatOf(p.id).senato,
    0
  );

  const playerSeats = seatOf(player.id);
  const playerAssignedMinistries = KEY_MINISTRIES.filter(
    (m) => assignments[m.id] === player.id
  ).map((m) => m.id);
  const playerAssignedWeight = round1(
    playerAssignedMinistries.reduce((acc, id) => acc + getMinistryById(id).weight, 0)
  );

  const allyReports: AllySatisfactionReport[] = coalitionParties
    .filter((p) => p.id !== player.id)
    .map((ally) => {
      const s = seatOf(ally.id);
      const seatShare = totalCoalitionCamera > 0 ? s.camera / totalCoalitionCamera : 0;
      const seatSharePct = round1(seatShare * 100);
      const expectedWeight = round1(TOTAL_MINISTRY_WEIGHT * seatShare);
      const assignedMinistries = KEY_MINISTRIES.filter(
        (m) => assignments[m.id] === ally.id
      ).map((m) => m.id);
      const assignedWeight = round1(
        assignedMinistries.reduce((acc, id) => acc + getMinistryById(id).weight, 0)
      );

      let satisfaction: number;
      if (persistedSatisfaction && typeof persistedSatisfaction[ally.id] === 'number') {
        satisfaction = Math.round(clamp(persistedSatisfaction[ally.id], 5, 100));
      } else {
        const preferred = ORIENTATION_PREFERRED_MINISTRIES[ally.orientation] ?? [];
        const affinityBonus = Math.min(
          12,
          assignedMinistries.filter((id) => preferred.includes(id)).length * 6
        );
        const diplomacyMod = Math.round(clamp((ally.relationWithPlayer - 20) * 0.14, -10, 10));

        let baseScore: number;
        if (expectedWeight <= 0.45) {
          baseScore = assignedWeight > 0 ? 90 : 58;
        } else if (assignedWeight === 0) {
          baseScore = Math.round(clamp(30 - seatShare * 55, 8, 30));
        } else {
          const ratio = assignedWeight / expectedWeight;
          baseScore = Math.round(clamp(22 + ratio * 56, 15, 95));
        }

        satisfaction = Math.round(clamp(baseScore + affinityBonus + diplomacyMod, 5, 100));
      }

      const grantsConfidence = s.camera + s.senato === 0 || satisfaction >= 50;
      const status: AllySatisfactionReport['status'] =
        satisfaction >= 50 ? 'fiducia' : satisfaction >= 35 ? 'teso' : 'rottura';
      const statusLabel =
        status === 'fiducia'
          ? 'Concede la Fiducia'
          : status === 'teso'
            ? 'Trattativa Tesa'
            : 'Minaccia di Far Saltare l’Accordo';

      return {
        partyId: ally.id,
        partyName: ally.name,
        partyAcronym: ally.acronym,
        partyColor: ally.color,
        leaderName: ally.leaderName,
        cameraSeats: s.camera,
        senatoSeats: s.senato,
        seatSharePct,
        assignedMinistries,
        assignedWeight,
        expectedWeight,
        satisfaction,
        grantsConfidence,
        status,
        statusLabel,
      };
    })
    .sort((a, b) => b.cameraSeats - a.cameraSeats);

  const confidentCamera =
    playerSeats.camera +
    allyReports.filter((a) => a.grantsConfidence).reduce((acc, a) => acc + a.cameraSeats, 0);
  const confidentSenato =
    playerSeats.senato +
    allyReports.filter((a) => a.grantsConfidence).reduce((acc, a) => acc + a.senatoSeats, 0);

  const blockingAllies = allyReports.filter((a) => !a.grantsConfidence);
  const canFormGovernment = playerSeats.camera + playerSeats.senato > 0 && confidentCamera >= 201;

  return {
    coalitionParties,
    allyReports,
    playerCameraSeats: playerSeats.camera,
    playerSenatoSeats: playerSeats.senato,
    playerAssignedMinistries,
    playerAssignedWeight,
    totalCoalitionCamera,
    totalCoalitionSenato,
    confidentCamera,
    confidentSenato,
    canFormGovernment,
    blockingAllies,
  };
}

/** Genera una proposta automatica equilibrata secondo il Manuale Cencelli */
export function buildAutoCencelliAssignments(
  parties: PartyState[],
  playerPartyId: string,
  seats: SeatAllocation[]
): Record<MinistryId, string> {
  const player = parties.find((p) => p.id === playerPartyId)!;
  const seatRowOf = (partyId: string) =>
    seats.find((s) => s.partyId === partyId) ?? { camera: 0, senato: 0 };
  const seatOf = (partyId: string) => seatRowOf(partyId).camera;

  const coalitionParties = parties.filter(
    (p) =>
      p.id !== 'altri' &&
      (p.id === player.id ||
        (Boolean(player.coalitionId) &&
          p.coalitionId === player.coalitionId &&
          seatRowOf(p.id).camera + seatRowOf(p.id).senato > 0))
  );

  const assignments: Record<MinistryId, string> = {
    mef: player.id,
    interno: player.id,
    esteri: player.id,
    giustizia: player.id,
    infrastrutture: player.id,
    salute: player.id,
    istruzione: player.id,
    ambiente: player.id,
  };

  if (coalitionParties.length <= 1) return assignments;

  const totalCam = coalitionParties.reduce((acc, p) => acc + seatOf(p.id), 0);

  const allies = coalitionParties
    .filter((p) => p.id !== player.id)
    .sort((a, b) => seatOf(b.id) - seatOf(a.id));

  const remaining = new Set<MinistryId>(KEY_MINISTRIES.map((m) => m.id));
  // Il Presidente del Consiglio tende a tenere il MEF o l'Interno, ma lascia margine agli alleati di peso
  const currentWeight: Record<string, number> = {};
  for (const p of coalitionParties) currentWeight[p.id] = 0;

  // Assign each ministry to the party with the largest Cencelli deficit (favoring preferred ministries)
  const orderedMinistries = [...KEY_MINISTRIES].sort((a, b) => b.weight - a.weight);
  for (const ministry of orderedMinistries) {
    if (!remaining.has(ministry.id)) continue;
    let bestParty = player;
    let bestScore = -999;

    for (const party of coalitionParties) {
      const share = totalCam > 0 ? seatOf(party.id) / totalCam : 1 / coalitionParties.length;
      const targetW = TOTAL_MINISTRY_WEIGHT * share;
      const deficit = targetW - (currentWeight[party.id] ?? 0);
      const prefBonus = ORIENTATION_PREFERRED_MINISTRIES[party.orientation]?.includes(ministry.id)
        ? 0.45
        : 0;
      const pmMefBonus = party.id === player.id && ministry.id === 'mef' ? 0.4 : 0;
      const score = deficit + prefBonus + pmMefBonus;
      if (score > bestScore) {
        bestScore = score;
        bestParty = party;
      }
    }

    assignments[ministry.id] = bestParty.id;
    currentWeight[bestParty.id] = (currentWeight[bestParty.id] ?? 0) + ministry.weight;
    remaining.delete(ministry.id);
  }

  // Ensure every ally with >= 10 seats has at least one ministry if possible
  for (const ally of allies) {
    if (seatOf(ally.id) < 10) continue;
    if ((currentWeight[ally.id] ?? 0) > 0) continue;
    const playerMins = KEY_MINISTRIES.filter((m) => assignments[m.id] === player.id).sort(
      (a, b) => a.weight - b.weight
    );
    if (playerMins.length >= 2) {
      assignments[playerMins[0].id] = ally.id;
      currentWeight[ally.id] += playerMins[0].weight;
      currentWeight[player.id] -= playerMins[0].weight;
    }
  }

  return assignments;
}

/**
 * Reset unificato di inizio nuova legislatura: garantisce che timer elettorale, dossier,
 * atti parlamentari decaduti (disegni di legge, decreti, commissioni) e modali istituzionali
 * ripartano puliti senza soft-lock in tutti e 3 gli scenari post-voto.
 */
function buildNewLegislatureResetFields(
  state: GameState,
  updatedParties: PartyState[],
  committedSeats: SeatAllocation[],
  isExtraParl: boolean,
  isInGovernment: boolean
) {
  const player = updatedParties.find((p) => p.id === state.playerPartyId);
  const nextElectionWeek = state.week + 20;
  const nextBallotSignatures = createInitialBallotSignatures({
    parties: updatedParties,
    playerPartyId: state.playerPartyId,
    electoralLaw: state.electoralLaw,
    extraParliamentary: isExtraParl,
    legislatureSeats: committedSeats,
    electionWeek: nextElectionWeek,
    electionType: state.ballotSignatures?.electionType ?? 'politiche',
    targetRegionId: state.ballotSignatures?.targetRegionId ?? 'lazio',
  });

  // Dossier archiviato coerente col nuovo ruolo: impedisce soft-lock al cambio turno
  // e garantisce nuovi dossier contestuali alla settimana successiva.
  const picked = pickWeeklyCrises(
    state.week,
    state.crisisCooldowns ?? {},
    {
      isInGovernment,
      isExtraParliamentary: isExtraParl,
      isCommitteeActive: state.committee.active,
      isCampaign: false,
      orientation: player?.orientation,
      leaderStyle: state.leader.style,
      leaderTraits: state.leader.traits,
    },
    1
  );
  const fallbackEvent = picked[0]?.event ?? state.currentCrisis.event;
  const archivedPostElectionCrisis: ActiveCrisis = {
    event: fallbackEvent,
    resolved: true,
    skipped: true,
    outcomeSummary: isExtraParl
      ? 'Settimana elettorale archiviata: ciclo extra-parlamentare riavviato, nuovi dossier in arrivo al prossimo turno.'
      : isInGovernment
        ? 'Nuova legislatura e insediamento del Governo completati: i dossier operativi arriveranno dalla prossima settimana.'
        : 'Insediamento nei banchi dell’Opposizione parlamentare completato: nuovi dossier in arrivo al prossimo turno.',
  };

  // Evita che la Legge di Bilancio scatti a bruciapelo nella settimana 1 di un nuovo esecutivo
  const nextLastBudgetWeek =
    isInGovernment && (state.lastBudgetWeek === 0 || state.week - state.lastBudgetWeek >= 18)
      ? Math.max(1, state.week - 14)
      : state.lastBudgetWeek;

  return {
    legislatureSeats: committedSeats,
    electionWeek: nextElectionWeek,
    ballotSignatures: nextBallotSignatures,
    election: null,
    pendingBudgetLaw: false,
    lastBudgetWeek: nextLastBudgetWeek,
    budgetModifiers: isInGovernment ? state.budgetModifiers : null,
    quirinaleElection: null,
    activeDecreeLaws: [] as ActiveDecreeLaw[],
    pendingBills: [] as PendingBill[],
    activeCommissions: [] as InquiryCommission[],
    actionsTakenThisWeek: [] as string[],
    currentCrisis: archivedPostElectionCrisis,
    weeklyCrises: [archivedPostElectionCrisis],
  };
}

/** Conclude le Consultazioni al Quirinale e fa giurare il giocatore come Presidente del Consiglio */
export function formGovernmentFromConsultations(
  state: GameState,
  assignments: Partial<Record<MinistryId, string>>,
  execAssignments?: Partial<Record<MinistryId, string>>
): { nextState: GameState; feedback: string; error?: string } {
  if (!state.election) {
    return { nextState: state, feedback: '', error: 'Nessuna consultazione post-elettorale attiva.' };
  }

  const completeAssignments: Record<MinistryId, string> = {
    mef: assignments.mef ?? state.playerPartyId,
    interno: assignments.interno ?? state.playerPartyId,
    giustizia: assignments.giustizia ?? state.playerPartyId,
    esteri: assignments.esteri ?? state.playerPartyId,
    infrastrutture: assignments.infrastrutture ?? state.playerPartyId,
    salute: assignments.salute ?? state.playerPartyId,
    istruzione: assignments.istruzione ?? state.playerPartyId,
    ambiente: assignments.ambiente ?? state.playerPartyId,
  };

  const evaluation = evaluateCencelliSatisfaction(
    state.parties,
    state.playerPartyId,
    state.election.seats,
    completeAssignments
  );

  if (!evaluation.canFormGovernment) {
    const blockers = evaluation.blockingAllies.map((b) => b.partyAcronym).join(', ');
    return {
      nextState: state,
      feedback: '',
      error: `Maggioranza insufficiente alla Camera (${evaluation.confidentCamera}/201). ${
        blockers ? `${blockers} rifiuta la fiducia: assegna più ministeri secondo il Manuale Cencelli.` : ''
      }`,
    };
  }

  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const dateLabel = formatGameDate(state.week).shortLabel;
  const allySatisfaction: Record<string, number> = {};
  const confidentAllyIds = new Set<string>();

  for (const rep of evaluation.allyReports) {
    allySatisfaction[rep.partyId] = rep.satisfaction;
    if (rep.grantsConfidence) confidentAllyIds.add(rep.partyId);
  }

  const updatedParties = state.parties.map((p) => {
    if (p.id === player.id) {
      return { ...p, isInGovernment: true };
    }
    if (confidentAllyIds.has(p.id)) {
      return {
        ...p,
        isInGovernment: true,
        relationWithPlayer: clamp(p.relationWithPlayer + 8, -100, 100),
      };
    }
    return { ...p, isInGovernment: false };
  });

  // Risolvi i dirigenti del partito assegnati ai ministeri detenuti dal giocatore
  const autoExecs = buildAutoMinistryExecutives(
    completeAssignments,
    state.playerPartyId,
    state.executives
  );
  const validExecIds = new Set(state.executives.map((e) => e.id));
  const completeExecAssignments: Partial<Record<MinistryId, string>> = {};
  let affineCount = 0;
  const fuoriRuoloList: { ministryName: string; execName: string; execSpec: string }[] = [];

  for (const m of KEY_MINISTRIES) {
    if (completeAssignments[m.id] !== state.playerPartyId) continue;
    const requestedExecId = execAssignments?.[m.id];
    const finalExecId =
      requestedExecId && validExecIds.has(requestedExecId)
        ? requestedExecId
        : autoExecs[m.id];
    if (finalExecId) {
      completeExecAssignments[m.id] = finalExecId;
    }
    const execObj = state.executives.find((e) => e.id === finalExecId);
    const aff = evaluateExecutiveMinistryAffinity(execObj, m.id);
    if (aff.level === 'affine') affineCount += 1;
    if (aff.level === 'fuori_ruolo' && execObj) {
      fuoriRuoloList.push({
        ministryName: m.shortName,
        execName: execObj.name,
        execSpec: getSpecializationLabel(execObj.specialization),
      });
    }
  }

  const approvalBonus =
    fuoriRuoloList.length > 0
      ? Math.max(-4, 2 - fuoriRuoloList.length * 2)
      : 4 + Math.min(3, affineCount);

  const extraMedia: MediaItem[] = [];
  if (fuoriRuoloList.length > 0) {
    const first = fuoriRuoloList[0];
    extraMedia.push({
      id: uid('med'),
      week: state.week,
      dateLabel,
      type: 'stampa',
      source: 'Il Foglio Economico',
      headline: `Polemiche sulla squadra di Governo: ${first.execName} (${first.execSpec}) giudicato fuori ruolo a ${first.ministryName}`,
      excerpt: `Critiche da stampa e opposizioni per ${fuoriRuoloList.length} ${
        fuoriRuoloList.length === 1 ? 'nomina ministeriale non affine' : 'nomine ministeriali non affini'
      }: credibilità dell’esecutivo subito sotto esame.`,
      sentiment: 'negativo',
      partyColor: '#F43F5E',
    });
  } else if (affineCount >= 2) {
    extraMedia.push({
      id: uid('med'),
      week: state.week,
      dateLabel,
      type: 'stampa',
      source: 'Il Foglio Economico',
      headline: `Stampa e mercati promuovono la squadra di ${player.leaderName}: ${affineCount} ministri tecnici affini`,
      excerpt: `Apprezzata la coerenza tra competenze dei dirigenti di ${player.acronym} e dicasteri strategici assegnati.`,
      sentiment: 'positivo',
      partyColor: player.color,
    });
  }

  const mediaItem: MediaItem = {
    id: uid('med'),
    week: state.week,
    dateLabel,
    type: 'stampa',
    source: 'Il Corriere Nazionale',
    headline: `Giuramento al Quirinale: ${player.leaderName} è il nuovo Presidente del Consiglio`,
    excerpt: `Accordo chiuso sul Manuale Cencelli con ${evaluation.confidentCamera} deputati e ${evaluation.confidentSenato} senatori a sostegno del nuovo Consiglio dei Ministri.`,
    sentiment: 'positivo',
    partyColor: player.color,
  };

  const affinitySummary =
    fuoriRuoloList.length > 0
      ? ` Attenzione: ${fuoriRuoloList.length} ${
          fuoriRuoloList.length === 1 ? 'ministro fuori ruolo' : 'ministri fuori ruolo'
        } (critiche stampa e malus credibilità).`
      : affineCount > 0
        ? ` Squadra promossa dalla stampa (${affineCount} ${
            affineCount === 1 ? 'ministro affine' : 'ministri affini'
          }).`
        : '';

  const feedback = `Giuramento al Quirinale completato! ${player.leaderName} guida il Governo con ${evaluation.confidentCamera} deputati e ${evaluation.confidentSenato} senatori.${affinitySummary}`;

  const committedSeats = state.election.seats.map((s) => ({ ...s }));
  const legislatureReset = buildNewLegislatureResetFields(
    state,
    updatedParties,
    committedSeats,
    false,
    true
  );

  return {
    nextState: {
      ...state,
      ...legislatureReset,
      parties: updatedParties,
      isPrimeMinister: true,
      governmentRole: 'premier',
      extraParliamentary: false,
      governmentMinistries: completeAssignments,
      governmentMinistryExecutives: completeExecAssignments,
      allySatisfaction,
      leaderApproval: adjustLeaderApproval(state.leaderApproval, state.playerPartyId, approvalBonus),
      mediaFeed: [...extraMedia, mediaItem, ...state.mediaFeed].slice(0, 40),
      actionLog: [
        {
          id: uid('act'),
          week: state.week,
          category: 'Quirinale',
          title: 'Formazione Governo & Giuramento',
          cost: 0,
          summary: feedback,
        },
        ...state.actionLog,
      ].slice(0, 30),
    },
    feedback,
  };
}

/** Rinuncia all'incarico di governo al Quirinale e avvia la legislatura all'Opposizione */
export function declineGovernmentMandate(state: GameState): {
  nextState: GameState;
  feedback: string;
  targetTab: 'parlamento' | 'plancia';
} {
  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const dateLabel = formatGameDate(state.week).shortLabel;
  const committedSeats = state.election?.seats
    ? state.election.seats.map((s) => ({ ...s }))
    : getCurrentParliamentSeats(state);
  const playerSeatRow = committedSeats.find((s) => s.partyId === state.playerPartyId);
  const playerHasSeats = (playerSeatRow?.camera ?? 0) + (playerSeatRow?.senato ?? 0) > 0;
  const seatedIds = new Set(
    committedSeats.filter((s) => s.camera + s.senato > 0).map((s) => s.partyId)
  );

  // Individua il principale blocco alternativo per formare l'esecutivo in Aula
  const altBlocCamera = new Map<string, number>();
  for (const s of committedSeats) {
    if (s.partyId === 'altri' || s.partyId === player.id || s.camera + s.senato <= 0) continue;
    const key = s.coalitionId ?? `solo_${s.partyId}`;
    altBlocCamera.set(key, (altBlocCamera.get(key) ?? 0) + s.camera);
  }
  let altWinnerKey: string | null = null;
  let maxAltCamera = -1;
  for (const [k, cam] of altBlocCamera.entries()) {
    if (cam > maxAltCamera) {
      maxAltCamera = cam;
      altWinnerKey = k;
    }
  }

  const updatedParties = state.parties.map((p) => {
    if (p.id === player.id || !seatedIds.has(p.id)) {
      return { ...p, isInGovernment: false };
    }
    const pBlocKey = p.coalitionId ?? `solo_${p.id}`;
    return { ...p, isInGovernment: altWinnerKey !== null && pBlocKey === altWinnerKey };
  });

  const feedback = playerHasSeats
    ? `${player.leaderName} rimette il mandato al Quirinale: ${player.name} guiderà l’Opposizione parlamentare nella nuova legislatura.`
    : `${player.name} resta all’Opposizione Extra-Parlamentare (0 seggi) per la nuova legislatura.`;

  const legislatureReset = buildNewLegislatureResetFields(
    state,
    updatedParties,
    committedSeats,
    !playerHasSeats,
    false
  );

  return {
    nextState: {
      ...state,
      ...legislatureReset,
      parties: updatedParties,
      isPrimeMinister: false,
      governmentRole: 'opposizione',
      extraParliamentary: !playerHasSeats,
      governmentMinistries: {},
      governmentMinistryExecutives: {},
      allySatisfaction: {},
      mediaFeed: [
        {
          id: uid('med'),
          week: state.week,
          dateLabel,
          type: 'stampa' as const,
          source: 'La Tribuna Politica',
          headline: `Consultazioni saltate: ${player.name} sceglie i banchi dell’Opposizione`,
          excerpt: feedback,
          sentiment: 'neutro' as const,
          partyColor: player.color,
        },
        ...state.mediaFeed,
      ].slice(0, 40),
      actionLog: [
        {
          id: uid('act'),
          week: state.week,
          category: 'Quirinale',
          title: 'Rinuncia all’Incarico · Opposizione',
          cost: 0,
          summary: feedback,
        },
        ...state.actionLog,
      ].slice(0, 30),
    },
    feedback,
    targetTab: playerHasSeats ? 'parlamento' : 'plancia',
  };
}

/**
 * Conclude la Notte Elettorale gestendo in modo deterministico tutti e 3 gli scenari:
 * - Scenario A (Governo / Larghe Intese senza passaggio manuale Quirinale): inizializza ministeri Cencelli e dirigenti.
 * - Scenario B (Ingresso o permanenza in Parlamento all'Opposizione): aggiorna i seggi reali e sblocca Parlamento in modalità Opposizione.
 * - Scenario C (Sotto soglia / 0 seggi): mantiene lo status extra-parlamentare senza soft-lock e riavvia il ciclo settimanale.
 */
export function completePostElectionLegislature(state: GameState): {
  nextState: GameState;
  feedback: string;
  tone: 'success' | 'info';
  targetTab: 'parlamento' | 'plancia';
} {
  if (!state.election) {
    return {
      nextState: state,
      feedback: 'Nessuno spoglio elettorale attivo.',
      tone: 'info',
      targetTab: 'plancia',
    };
  }

  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const dateLabel = formatGameDate(state.week).shortLabel;
  const role = state.election.playerRole;
  const committedSeats = state.election.seats.map((s) => ({ ...s }));
  const seatsByParty = new Map<string, number>();
  for (const s of committedSeats) {
    seatsByParty.set(s.partyId, s.camera + s.senato);
  }

  const playerSeatRow = committedSeats.find((s) => s.partyId === state.playerPartyId) ?? {
    camera: 0,
    senato: 0,
  };
  const wonSeats = playerSeatRow.camera + playerSeatRow.senato;
  const isExtraParl = role === 'fuori_parlamento' || wonSeats === 0;
  const wasExtraParlBefore = getPlayerParliamentSeats(state).isExtraParliamentary;

  const nextGovRole: GameState['governmentRole'] =
    !isExtraParl && role === 'premier'
      ? 'premier'
      : !isExtraParl && role === 'partner_governo'
        ? 'governo'
        : 'opposizione';

  // Determina il blocco vincitore dai seggi reali assegnati alle elezioni
  const blocCameraMap = new Map<string, number>();
  for (const s of committedSeats) {
    if (s.partyId === 'altri' || s.camera + s.senato <= 0) continue;
    const blocKey = s.coalitionId ?? `solo_${s.partyId}`;
    blocCameraMap.set(blocKey, (blocCameraMap.get(blocKey) ?? 0) + s.camera);
  }
  let winningBlocKey: string | null = null;
  let maxBlocCamera = -1;
  for (const [k, cam] of blocCameraMap.entries()) {
    if (cam > maxBlocCamera) {
      maxBlocCamera = cam;
      winningBlocKey = k;
    }
  }

  const playerBlocKey = player.coalitionId ?? `solo_${player.id}`;
  const updatedParties = state.parties.map((p) => {
    const pSeats = seatsByParty.get(p.id) ?? 0;
    if (pSeats === 0) {
      return { ...p, isInGovernment: false };
    }
    if (p.id === state.playerPartyId) {
      return { ...p, isInGovernment: nextGovRole !== 'opposizione' };
    }
    const pBlocKey = p.coalitionId ?? `solo_${p.id}`;
    if (nextGovRole !== 'opposizione') {
      return { ...p, isInGovernment: pBlocKey === playerBlocKey };
    }
    return { ...p, isInGovernment: winningBlocKey !== null && pBlocKey === winningBlocKey };
  });

  // In Scenario A diretto (es. Larghe Intese < 201 o partner di maggioranza), costruisce squadra e Cencelli puliti
  let nextGovMinistries: Partial<Record<MinistryId, string>> = {};
  let nextGovExecs: Partial<Record<MinistryId, string>> = {};
  let nextAllySatisfaction: Record<string, number> = {};

  if (nextGovRole !== 'opposizione') {
    const autoAssignments = buildAutoCencelliAssignments(
      updatedParties,
      state.playerPartyId,
      committedSeats
    );
    const evalRes = evaluateCencelliSatisfaction(
      updatedParties,
      state.playerPartyId,
      committedSeats,
      autoAssignments
    );
    nextGovMinistries = autoAssignments;
    nextGovExecs = buildAutoMinistryExecutives(
      autoAssignments,
      state.playerPartyId,
      state.executives
    );
    for (const rep of evalRes.allyReports) {
      nextAllySatisfaction[rep.partyId] = rep.satisfaction;
    }
  }

  const legislatureReset = buildNewLegislatureResetFields(
    state,
    updatedParties,
    committedSeats,
    isExtraParl,
    nextGovRole !== 'opposizione'
  );

  let feedback: string;
  let mediaHeadline: string;
  let mediaSentiment: MediaItem['sentiment'] = 'neutro';
  let targetTab: 'parlamento' | 'plancia';

  if (isExtraParl) {
    feedback =
      'Opposizione Extra-Parlamentare attiva (0 seggi): ciclo settimanale riavviato, ricostruisci consenso, firme e sezioni fino alle prossime elezioni.';
    mediaHeadline = `Nuova Legislatura: ${player.name} riparte dall’Opposizione Extra-Parlamentare`;
    targetTab = 'plancia';
  } else if (nextGovRole === 'premier') {
    feedback = `Benvenuto a Palazzo Chigi, Presidente del Consiglio! Nuovo esecutivo insediato (${playerSeatRow.camera} Cam. / ${playerSeatRow.senato} Sen. per ${player.acronym}).`;
    mediaHeadline = `Palazzo Chigi: ${player.leaderName} avvia la nuova legislatura alla guida del Governo`;
    mediaSentiment = 'positivo';
    targetTab = 'parlamento';
  } else if (nextGovRole === 'governo') {
    feedback = `${player.name} entra nella maggioranza di Governo con ${playerSeatRow.camera} deputati e ${playerSeatRow.senato} senatori.`;
    mediaHeadline = `Nuova Maggioranza: ${player.name} protagonista nel Consiglio dei Ministri`;
    mediaSentiment = 'positivo';
    targetTab = 'parlamento';
  } else {
    feedback = wasExtraParlBefore
      ? `Ingresso storico in Parlamento! ${player.name} ottiene ${playerSeatRow.camera} deputati e ${playerSeatRow.senato} senatori: scheda Parlamento sbloccata in modalità Opposizione.`
      : `Nuova legislatura avviata all’Opposizione parlamentare (${playerSeatRow.camera} deputati e ${playerSeatRow.senato} senatori per ${player.acronym}).`;
    mediaHeadline = wasExtraParlBefore
      ? `Svolta in Aula: ${player.name} conquista ${wonSeats} seggi e apre il gruppo parlamentare`
      : `Nuova Legislatura: ${player.name} si insedia nei banchi dell’Opposizione`;
    mediaSentiment = wasExtraParlBefore ? 'positivo' : 'neutro';
    targetTab = 'parlamento';
  }

  return {
    nextState: {
      ...state,
      ...legislatureReset,
      parties: updatedParties,
      governmentRole: nextGovRole,
      extraParliamentary: isExtraParl,
      isPrimeMinister: nextGovRole === 'premier',
      governmentMinistries: nextGovMinistries,
      governmentMinistryExecutives: nextGovExecs,
      allySatisfaction: nextAllySatisfaction,
      mediaFeed: [
        {
          id: uid('med'),
          week: state.week,
          dateLabel,
          type: 'stampa' as const,
          source: 'Il Corriere Nazionale',
          headline: mediaHeadline,
          excerpt: feedback,
          sentiment: mediaSentiment,
          partyColor: player.color,
        },
        ...state.mediaFeed,
      ].slice(0, 40),
      actionLog: [
        {
          id: uid('act'),
          week: state.week,
          category: 'Elezioni',
          title: isExtraParl
            ? 'Avvio Ciclo Extra-Parlamentare'
            : nextGovRole !== 'opposizione'
              ? 'Insediamento Governo · Nuova Legislatura'
              : 'Insediamento Parlamento · Opposizione',
          cost: 0,
          summary: feedback,
        },
        ...state.actionLog,
      ].slice(0, 30),
    },
    feedback,
    tone: isExtraParl ? 'info' : 'success',
    targetTab,
  };
}

/** Esegue un Rimpasto di Governo (cambio partito titolare o sostituzione del dirigente titolare del dicastero) */
export function executeCabinetReshuffle(
  state: GameState,
  ministryId: MinistryId,
  newPartyId: string,
  newExecId?: string
): { nextState: GameState; feedback: string; error?: string } {
  if (getPlayerParliamentSeats(state).isExtraParliamentary) {
    return {
      nextState: state,
      feedback: '',
      error:
        'Sezione bloccata: il tuo partito è attualmente extra-parlamentare (0 seggi). Supera la soglia del 3% alle elezioni per entrare in Parlamento e sbloccare leggi, mozioni e Governo.',
    };
  }

  const prevHolderId = state.governmentMinistries[ministryId];
  const isExecutiveOnlySwap =
    Boolean(newExecId) &&
    newPartyId === state.playerPartyId &&
    prevHolderId === state.playerPartyId;

  if (!isExecutiveOnlySwap && !state.isPrimeMinister) {
    return {
      nextState: state,
      feedback: '',
      error: 'Solo il Presidente del Consiglio può cedere o riassegnare un ministero tra i partiti.',
    };
  }
  if (isExecutiveOnlySwap && !state.isPrimeMinister && state.governmentRole !== 'governo') {
    return {
      nextState: state,
      feedback: '',
      error: 'Devi far parte del Governo per nominare un ministro del tuo partito.',
    };
  }
  if (state.actionsTakenThisWeek.includes('parl_reshuffle_week')) {
    return {
      nextState: state,
      feedback: '',
      error: 'Hai già effettuato un Rimpasto ministeriale questa settimana. Avanza al turno successivo.',
    };
  }

  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const ministry = getMinistryById(ministryId);
  const dateLabel = formatGameDate(state.week).shortLabel;

  // Caso A: sostituzione del dirigente del partito del giocatore su un dicastero già suo
  if (isExecutiveOnlySwap && newExecId) {
    const targetExec = state.executives.find((e) => e.id === newExecId);
    if (!targetExec) {
      return { nextState: state, feedback: '', error: 'Dirigente selezionato non valido.' };
    }
    if (state.governmentMinistryExecutives?.[ministryId] === newExecId) {
      return {
        nextState: state,
        feedback: '',
        error: `${targetExec.name} guida già il Ministero ${ministry.shortName}.`,
      };
    }

    const affinity = evaluateExecutiveMinistryAffinity(targetExec, ministryId);
    const nextMinistryExecs: Partial<Record<MinistryId, string>> = {
      ...(state.governmentMinistryExecutives ?? {}),
      [ministryId]: targetExec.id,
    };

    const approvalDelta =
      affinity.level === 'affine' ? 2 : affinity.level === 'fuori_ruolo' ? -2 : 0;
    const mediaSentiment: MediaItem['sentiment'] =
      affinity.level === 'affine'
        ? 'positivo'
        : affinity.level === 'fuori_ruolo'
          ? 'negativo'
          : 'neutro';

    const headline =
      affinity.level === 'affine'
        ? `Rimpasto tecnico a ${ministry.shortName}: la nomina di ${targetExec.name} convince la stampa`
        : affinity.level === 'fuori_ruolo'
          ? `Bufera su ${ministry.shortName}: ${targetExec.name} (${getSpecializationLabel(targetExec.specialization)}) criticato come ministro fuori ruolo`
          : `Cambio al vertice di ${ministry.shortName}: subentra ${targetExec.name} (${player.acronym})`;

    const feedback = `Ministro ${ministry.shortName} aggiornato: ${targetExec.name} (${getSpecializationLabel(targetExec.specialization)}) — ${affinity.label}.`;

    const mediaItem: MediaItem = {
      id: uid('med'),
      week: state.week,
      dateLabel,
      type: 'stampa',
      source: 'Cronaca di Palazzo',
      headline,
      excerpt: affinity.effectSummary,
      sentiment: mediaSentiment,
      partyColor: affinity.level === 'fuori_ruolo' ? '#F43F5E' : player.color,
    };

    return {
      nextState: {
        ...state,
        governmentMinistryExecutives: nextMinistryExecs,
        actionsTakenThisWeek: [...state.actionsTakenThisWeek, 'parl_reshuffle_week'],
        leaderApproval:
          approvalDelta !== 0
            ? adjustLeaderApproval(state.leaderApproval, state.playerPartyId, approvalDelta)
            : state.leaderApproval,
        mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
        actionLog: [
          {
            id: uid('act'),
            week: state.week,
            category: 'Rimpasto',
            title: `${ministry.shortName} · ${targetExec.name}`,
            cost: 0,
            summary: feedback,
          },
          ...state.actionLog,
        ].slice(0, 30),
      },
      feedback,
    };
  }

  // Caso B: passaggio del dicastero a un altro partito della coalizione (solo Premier)
  const newHolder = state.parties.find((p) => p.id === newPartyId);
  if (
    !newHolder ||
    newHolder.id === 'altri' ||
    (newHolder.id !== player.id &&
      (!player.coalitionId || newHolder.coalitionId !== player.coalitionId))
  ) {
    return {
      nextState: state,
      feedback: '',
      error: 'Puoi assegnare il ministero solo a un partito della tua coalizione di governo.',
    };
  }

  if (prevHolderId === newPartyId) {
    return {
      nextState: state,
      feedback: '',
      error: `${newHolder.acronym} detiene già questo ministero.`,
    };
  }

  const nextMinistries: Partial<Record<MinistryId, string>> = {
    ...state.governmentMinistries,
    [ministryId]: newPartyId,
  };

  const nextMinistryExecs: Partial<Record<MinistryId, string>> = {
    ...(state.governmentMinistryExecutives ?? {}),
  };
  let assignedExecNote = '';
  let approvalDelta = 0;

  if (newPartyId === player.id) {
    const usedIds = new Set(
      Object.entries(nextMinistryExecs)
        .filter(([k]) => k !== ministryId)
        .map(([, v]) => v)
        .filter((v): v is string => Boolean(v))
    );
    const chosenExec =
      (newExecId ? state.executives.find((e) => e.id === newExecId) : undefined) ??
      pickBestExecutiveForMinistry(state.executives, ministryId, usedIds);
    if (chosenExec) {
      nextMinistryExecs[ministryId] = chosenExec.id;
      const aff = evaluateExecutiveMinistryAffinity(chosenExec, ministryId);
      assignedExecNote = ` Guidato da ${chosenExec.name} (${aff.label}).`;
      approvalDelta = aff.level === 'affine' ? 1 : aff.level === 'fuori_ruolo' ? -2 : 0;
    }
  } else {
    delete nextMinistryExecs[ministryId];
  }

  const seats = getCurrentParliamentSeats(state);
  const freshCencelli = evaluateCencelliSatisfaction(
    state.parties,
    state.playerPartyId,
    seats,
    nextMinistries
  );

  const nextAllySatisfaction: Record<string, number> = { ...state.allySatisfaction };
  const weightBoost = Math.round(ministry.weight * 9); // +14..+27

  for (const rep of freshCencelli.allyReports) {
    const prevSat = state.allySatisfaction[rep.partyId] ?? rep.satisfaction;
    if (rep.partyId === newPartyId) {
      nextAllySatisfaction[rep.partyId] = Math.round(
        clamp(Math.max(rep.satisfaction, prevSat + weightBoost), 10, 100)
      );
    } else if (rep.partyId === prevHolderId) {
      nextAllySatisfaction[rep.partyId] = Math.round(
        clamp(Math.min(rep.satisfaction, prevSat - Math.round(weightBoost * 0.7)), 5, 100)
      );
    } else {
      nextAllySatisfaction[rep.partyId] = prevSat;
    }
  }

  const seatedForGov = new Set(
    seats.filter((s) => s.camera + s.senato > 0).map((s) => s.partyId)
  );
  const updatedParties = state.parties.map((p) => {
    if (p.id === newPartyId && p.id !== player.id) {
      return {
        ...p,
        isInGovernment: seatedForGov.has(p.id),
        relationWithPlayer: clamp(p.relationWithPlayer + Math.round(ministry.weight * 5), -100, 100),
      };
    }
    if (p.id === prevHolderId && p.id !== player.id) {
      return {
        ...p,
        relationWithPlayer: clamp(p.relationWithPlayer - Math.round(ministry.weight * 4), -100, 100),
      };
    }
    return p;
  });

  const feedback =
    newPartyId === player.id
      ? `Rimpasto completato: ${player.acronym} riprende il dicastero ${ministry.shortName}.${assignedExecNote}`
      : `Rimpasto completato: ${ministry.shortName} ceduto a ${newHolder.name} (fiducia al ${nextAllySatisfaction[newPartyId] ?? 75}%).`;

  const mediaItem: MediaItem = {
    id: uid('med'),
    week: state.week,
    dateLabel,
    type: 'stampa',
    source: 'Cronaca di Palazzo',
    headline: `Rimpasto a Palazzo Chigi: il Ministero ${ministry.shortName} passa a ${newHolder.name}`,
    excerpt: `${player.leaderName} ridisegna gli equilibri del Consiglio dei Ministri per blindare la tenuta della maggioranza.${assignedExecNote}`,
    sentiment: approvalDelta < 0 ? 'negativo' : 'neutro',
    partyColor: newHolder.color,
  };

  return {
    nextState: {
      ...state,
      parties: updatedParties,
      governmentMinistries: nextMinistries,
      governmentMinistryExecutives: nextMinistryExecs,
      allySatisfaction: nextAllySatisfaction,
      actionsTakenThisWeek: [...state.actionsTakenThisWeek, 'parl_reshuffle_week'],
      leaderApproval:
        approvalDelta !== 0
          ? adjustLeaderApproval(state.leaderApproval, state.playerPartyId, approvalDelta)
          : state.leaderApproval,
      mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
      actionLog: [
        {
          id: uid('act'),
          week: state.week,
          category: 'Rimpasto',
          title: `${ministry.shortName} → ${newHolder.acronym}`,
          cost: 0,
          summary: feedback,
        },
        ...state.actionLog,
      ].slice(0, 30),
    },
    feedback,
  };
}

export const DEFAULT_BUDGET_ALLOCATION: BudgetAllocation = {
  fisco: 8,
  sanita: 8,
  giovani: 6,
  infrastrutture: 6,
  coperture: 10,
};

export interface BudgetImpactPreview {
  totalSpending: number;
  coperture: number;
  netDeficitBillions: number;
  deficitGdpPct: number;
  spreadDelta: number;
  projectedSpread: number;
  euRelationsDelta: number;
  projectedEuRelations: number;
  socialStabilityDelta: number;
  projectedSocialStability: number;
  demoEffects: Record<DemographicId, number>;
  regionEffects: Partial<Record<MacroRegionId, number>>;
  estimatedNationalPollDelta: number;
  cameraYes: number;
  cameraNo: number;
  senatoYes: number;
  senatoNo: number;
  willPass: boolean;
  supporters: string[];
  dissentingAllies: string[];
}

/** Stima in tempo reale l'impatto macroeconomico, politico e parlamentare della Manovra Finanziaria */
export function previewBudgetLaw(
  state: GameState,
  allocation: BudgetAllocation
): BudgetImpactPreview {
  const fisco = clamp(Math.round(allocation.fisco), 0, 15);
  const sanita = clamp(Math.round(allocation.sanita), 0, 15);
  const giovani = clamp(Math.round(allocation.giovani), 0, 15);
  const infrastrutture = clamp(Math.round(allocation.infrastrutture), 0, 15);
  const coperture = clamp(Math.round(allocation.coperture), 0, 20);

  const totalSpending = fisco + sanita + giovani + infrastrutture;
  const netDeficitBillions = totalSpending - coperture;
  const deficitGdpPct = round1(clamp(2.2 + netDeficitBillions * 0.085, 0.8, 6.5));

  const growthSignal = infrastrutture >= 8 ? -5 : infrastrutture >= 5 ? -2 : 0;
  const spreadDelta = Math.round(
    (deficitGdpPct > 3.0
      ? (deficitGdpPct - 3.0) * 32
      : -(3.0 - deficitGdpPct) * 18) + growthSignal
  );
  const projectedSpread = Math.round(clamp(state.stateIndicators.spread + spreadDelta, 65, 450));

  const euRelationsDelta = Math.round(
    deficitGdpPct <= 3.0
      ? 4 + (3.0 - deficitGdpPct) * 10
      : -(deficitGdpPct - 3.0) * 16
  );
  const projectedEuRelations = Math.round(
    clamp(state.stateIndicators.euRelations + euRelationsDelta, 0, 100)
  );

  const socialStabilityDelta = Math.round(
    sanita * 0.75 + giovani * 0.55 + infrastrutture * 0.3 - coperture * 0.9
  );
  const projectedSocialStability = Math.round(
    clamp(state.stateIndicators.socialStability + socialStabilityDelta, 0, 100)
  );

  const demoEffects: Record<DemographicId, number> = {
    imprese: round1(fisco * 0.22 + infrastrutture * 0.08 - coperture * 0.14),
    lavoratori: round1(fisco * 0.07 + sanita * 0.14 + giovani * 0.12 - coperture * 0.13),
    giovani: round1(giovani * 0.24 + infrastrutture * 0.05 - coperture * 0.09),
    pensionati: round1(sanita * 0.23 - coperture * 0.12),
  };

  const regionEffects: Partial<Record<MacroRegionId, number>> = {
    sud: round1(infrastrutture * 0.16 - coperture * 0.04),
    isole: round1(infrastrutture * 0.15 - coperture * 0.04),
  };

  const estimatedNationalPollDelta = round1(
    DEMOGRAPHICS.reduce((acc, d) => acc + (demoEffects[d.id] ?? 0) * d.weight, 0)
  );

  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const seats = getCurrentParliamentSeats(state);

  let cameraYes = 0;
  let senatoYes = 0;
  const supporters: string[] = [];
  const dissentingAllies: string[] = [];

  for (const p of state.parties) {
    if (p.id === 'altri') continue;
    const s = seats.find((x) => x.partyId === p.id) ?? { camera: 0, senato: 0 };
    if (s.camera === 0 && s.senato === 0 && p.id !== player.id) continue;

    if (p.id === player.id || state.regimeStatus === 'regime_autoritario') {
      cameraYes += s.camera;
      senatoYes += s.senato;
      supporters.push(p.acronym);
      continue;
    }

    const isAllied = Boolean(player.coalitionId) && p.coalitionId === player.coalitionId;
    if (isAllied) {
      const sat = state.allySatisfaction?.[p.id] ?? 65;
      // Calcolo gradimento della Manovra da parte dell'alleato di governo
      let policyScore = 0;
      if (p.axis.economic >= 25) {
        policyScore += fisco * 1.4 - coperture * 1.2;
      } else if (p.axis.economic <= -25) {
        policyScore += (sanita + giovani) * 0.9 - (fisco >= 12 ? 8 : 0);
      } else {
        policyScore += (fisco + sanita) * 0.6 - coperture * 0.6;
      }
      if (p.axis.europe >= 35 && deficitGdpPct > 4.2) {
        policyScore -= Math.round((deficitGdpPct - 4.2) * 18);
      }
      if (p.orientation === 'territorialista' && infrastrutture >= 7) {
        policyScore += 10;
      }

      const loyaltyScore = sat + p.relationWithPlayer * 0.25 + policyScore;
      if (loyaltyScore >= 46) {
        cameraYes += s.camera;
        senatoYes += s.senato;
        supporters.push(p.acronym);
      } else {
        dissentingAllies.push(p.acronym);
      }
    } else {
      // Opposizione vota generalmente contro la Manovra del Governo, salvo convergenze molto forti e rapporti ottimi
      const crossScore =
        p.relationWithPlayer +
        (deficitGdpPct <= 3.0 && p.axis.europe >= 45 ? 18 : 0) +
        (sanita >= 10 && p.axis.economic <= -20 ? 12 : 0);
      if (crossScore >= 72) {
        cameraYes += s.camera;
        senatoYes += s.senato;
        supporters.push(p.acronym);
      }
    }
  }

  const finalCamYes = state.regimeStatus === 'regime_autoritario' ? 400 : cameraYes;
  const finalSenYes = state.regimeStatus === 'regime_autoritario' ? 200 : senatoYes;
  const willPass =
    state.regimeStatus === 'regime_autoritario' || (finalCamYes >= 201 && finalSenYes >= 101);

  return {
    totalSpending,
    coperture,
    netDeficitBillions,
    deficitGdpPct,
    spreadDelta,
    projectedSpread,
    euRelationsDelta,
    projectedEuRelations,
    socialStabilityDelta,
    projectedSocialStability,
    demoEffects,
    regionEffects,
    estimatedNationalPollDelta,
    cameraYes: finalCamYes,
    cameraNo: Math.max(0, 400 - finalCamYes),
    senatoYes: finalSenYes,
    senatoNo: Math.max(0, 200 - finalSenYes),
    willPass,
    supporters,
    dissentingAllies,
  };
}

/** Porta al voto in Parlamento la Legge di Bilancio Annuale (Manovra Finanziaria) */
export function voteBudgetLaw(
  state: GameState,
  allocation: BudgetAllocation
): { nextState: GameState; feedback: string; passed: boolean; triggeredCrisis: boolean } {
  const preview = previewBudgetLaw(state, allocation);
  const dateInfo = formatGameDate(state.week);
  const budgetYear =
    dateInfo.monthName === 'Novembre' || dateInfo.monthName === 'Dicembre'
      ? dateInfo.year + 1
      : dateInfo.year;
  const budgetLabel = `Legge di Bilancio ${budgetYear}`;
  const player = state.parties.find((p) => p.id === state.playerPartyId)!;

  const camJitter =
    state.regimeStatus === 'regime_autoritario' ? 0 : Math.floor(Math.random() * 5) - 2;
  const senJitter =
    state.regimeStatus === 'regime_autoritario' ? 0 : Math.floor(Math.random() * 3) - 1;
  const finalCamYes =
    state.regimeStatus === 'regime_autoritario'
      ? 400
      : clamp(preview.cameraYes + camJitter, 0, 400);
  const finalSenYes =
    state.regimeStatus === 'regime_autoritario'
      ? 200
      : clamp(preview.senatoYes + senJitter, 0, 200);
  const passed =
    state.regimeStatus === 'regime_autoritario' || (finalCamYes >= 201 && finalSenYes >= 101);

  if (passed) {
    let updatedParties = applyElectoralShift(
      state.parties,
      player.id,
      preview.demoEffects,
      preview.regionEffects,
      undefined,
      { bypassInertia: true }
    );

    const econShift = Math.round(
      clamp((allocation.fisco - (allocation.sanita + allocation.giovani) * 0.5) * 0.8, -10, 10)
    );
    const euShift = preview.deficitGdpPct <= 3.0 ? 5 : preview.deficitGdpPct >= 4.2 ? -6 : 0;
    const nextAxis = applyAxisShift(player.axis, { economic: econShift, europe: euShift });
    updatedParties = updatedParties.map((p) =>
      p.id === player.id ? { ...p, axis: nextAxis } : p
    );

    const nextIndicators = applyStateEffects(state.stateIndicators, {
      spread: preview.spreadDelta,
      euRelations: preview.euRelationsDelta,
      socialStability: preview.socialStabilityDelta,
    });

    const budgetModifiers: BudgetModifiers = {
      label: budgetLabel,
      deficitGdpPct: preview.deficitGdpPct,
      netBillions: preview.netDeficitBillions,
      weeklySpreadDrift:
        preview.deficitGdpPct > 3.8 ? 2 : preview.deficitGdpPct <= 2.9 ? -1 : 0,
      weeklyStabilityDrift:
        preview.socialStabilityDelta >= 6 ? 1 : preview.socialStabilityDelta <= -6 ? -1 : 0,
      weeklyEuDrift: preview.deficitGdpPct > 4.0 ? -1 : preview.deficitGdpPct <= 3.0 ? 1 : 0,
      demoWeeklyBonus: {
        imprese: round1(clamp(preview.demoEffects.imprese * 0.08, -0.1, 0.14)),
        lavoratori: round1(clamp(preview.demoEffects.lavoratori * 0.08, -0.1, 0.14)),
        giovani: round1(clamp(preview.demoEffects.giovani * 0.08, -0.1, 0.14)),
        pensionati: round1(clamp(preview.demoEffects.pensionati * 0.08, -0.1, 0.14)),
      },
      activeUntilWeek: state.week + 24,
      allocation: { ...allocation },
    };

    const voteRecord: LawVoteRecord = {
      id: uid('vote'),
      lawId: `budget_${budgetYear}_${state.week}`,
      title: `${budgetLabel} (${preview.totalSpending} Mld € · Deficit ${preview.deficitGdpPct.toFixed(1)}%)`,
      week: state.week,
      dateLabel: dateInfo.shortLabel,
      cameraYes: finalCamYes,
      cameraNo: 400 - finalCamYes,
      senatoYes: finalSenYes,
      senatoNo: 200 - finalSenYes,
      outcome: 'approvata',
      summary: `Manovra approvata con fiducia (${finalCamYes} Camera / ${finalSenYes} Senato). Deficit/PIL ${preview.deficitGdpPct.toFixed(1)}%, Spread ${preview.spreadDelta >= 0 ? '+' : ''}${preview.spreadDelta} bps.`,
    };

    const mediaItem: MediaItem = {
      id: uid('med'),
      week: state.week,
      dateLabel: dateInfo.shortLabel,
      type: 'stampa',
      source: 'Il Foglio Economico',
      headline: `Via libera alla ${budgetLabel}: manovra da ${preview.totalSpending} miliardi, deficit al ${preview.deficitGdpPct.toFixed(1)}%`,
      excerpt: voteRecord.summary,
      sentiment: preview.spreadDelta > 25 ? 'neutro' : 'positivo',
      partyColor: player.color,
    };

    const feedback = `${budgetLabel} approvata (${finalCamYes} Sì alla Camera)! Effetti economici e di consenso applicati per il prossimo anno.`;

    return {
      nextState: {
        ...state,
        parties: updatedParties,
        stateIndicators: nextIndicators,
        regimeStatus: deriveRegimeStatus(state.institutionalFlags, nextIndicators.democraticHealth),
        lastBudgetWeek: state.week,
        pendingBudgetLaw: false,
        budgetModifiers,
        leaderApproval: adjustLeaderApproval(
          state.leaderApproval,
          state.playerPartyId,
          preview.estimatedNationalPollDelta >= 0 ? 2 : -2
        ),
        lawVoteHistory: [voteRecord, ...state.lawVoteHistory].slice(0, 24),
        mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
        actionLog: [
          {
            id: uid('act'),
            week: state.week,
            category: 'Bilancio',
            title: `${budgetLabel} approvata`,
            cost: 0,
            summary: feedback,
          },
          ...state.actionLog,
        ].slice(0, 30),
      },
      feedback,
      passed: true,
      triggeredCrisis: false,
    };
  }

  // MANOVRA BOCCIATA -> IL GOVERNO VA SOTTO ED ENTRA IN CRISI DI GOVERNO!
  let updatedParties = applyElectoralShift(
    state.parties,
    player.id,
    {
      giovani: -1.0,
      lavoratori: -1.1,
      imprese: -1.3,
      pensionati: -1.0,
    },
    undefined,
    undefined,
    { bypassInertia: true }
  );
  updatedParties = updatedParties.map((p) =>
    p.id === player.id ? { ...p, isInGovernment: false } : p
  );

  const nextAllySatisfaction: Record<string, number> = {};
  for (const [id, val] of Object.entries(state.allySatisfaction ?? {})) {
    nextAllySatisfaction[id] = Math.round(clamp(val - 18, 5, 100));
  }

  const nextIndicators = applyStateEffects(state.stateIndicators, {
    spread: 35,
    socialStability: -12,
    euRelations: -10,
  });

  const voteRecord: LawVoteRecord = {
    id: uid('vote'),
    lawId: `budget_fail_${budgetYear}_${state.week}`,
    title: `${budgetLabel} (Fiducia Respinta)`,
    week: state.week,
    dateLabel: dateInfo.shortLabel,
    cameraYes: finalCamYes,
    cameraNo: 400 - finalCamYes,
    senatoYes: finalSenYes,
    senatoNo: 200 - finalSenYes,
    outcome: 'respinta',
    summary: `Governo battuto sulla Manovra (${finalCamYes}/201 Camera · ${finalSenYes}/101 Senato). ${
      preview.dissentingAllies.length > 0
        ? `Fronda degli alleati: ${preview.dissentingAllies.join(', ')}.`
        : 'Maggioranza frantumata.'
    } Crisi di Governo e urne anticipate tra 4 settimane.`,
  };

  const mediaItem: MediaItem = {
    id: uid('med'),
    week: state.week,
    dateLabel: dateInfo.shortLabel,
    type: 'stampa',
    source: 'Il Corriere Nazionale',
    headline: `CRISI DI GOVERNO! Esecutivo battuto sulla ${budgetLabel}, spread +35 bps`,
    excerpt: voteRecord.summary,
    sentiment: 'negativo',
    partyColor: '#F43F5E',
  };

  const feedback = `GOVERNO BATTUTO SULLA MANOVRA (${finalCamYes}/201 Camera)! Si apre la Crisi di Governo: spread +35 bps ed elezioni anticipate tra 4 settimane.`;

  return {
    nextState: {
      ...state,
      parties: updatedParties,
      stateIndicators: nextIndicators,
      regimeStatus: deriveRegimeStatus(state.institutionalFlags, nextIndicators.democraticHealth),
      isPrimeMinister: false,
      governmentRole: 'opposizione',
      governmentMinistries: {},
      governmentMinistryExecutives: {},
      allySatisfaction: nextAllySatisfaction,
      lastBudgetWeek: state.week,
      pendingBudgetLaw: false,
      electionWeek: Math.min(state.electionWeek, state.week + 4),
      leaderApproval: adjustLeaderApproval(state.leaderApproval, state.playerPartyId, -6),
      lawVoteHistory: [voteRecord, ...state.lawVoteHistory].slice(0, 24),
      mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
      actionLog: [
        {
          id: uid('act'),
          week: state.week,
          category: 'Crisi Governo',
          title: `${budgetLabel} bocciata`,
          cost: 0,
          summary: feedback,
        },
        ...state.actionLog,
      ].slice(0, 30),
    },
    feedback,
    passed: false,
    triggeredCrisis: true,
  };
}

const AI_BILL_TOPICS_BY_ORIENTATION: Record<
  PartyState['orientation'],
  { title: string; demo: DemographicId }
> = {
  conservatore: { title: 'Decreto Sicurezza e Difesa Imprese', demo: 'imprese' },
  moderato: { title: 'Taglio Burocrazia e Sostegno Famiglie', demo: 'pensionati' },
  riformista: { title: 'Piano Produttività e Merito Scuola', demo: 'imprese' },
  tecnopragmatico: { title: 'Riforma Fiscale e Infrastrutture Digitali', demo: 'imprese' },
  progressista: { title: 'Legge su Salario Minimo e Transizione Verde', demo: 'giovani' },
  socialista: { title: 'Piano Straordinario Sanità e Lavoro Stabile', demo: 'lavoratori' },
  populista: { title: 'Reddito di Garanzia e Stop Caro Bollette', demo: 'lavoratori' },
  territorialista: { title: 'Autonomia Fiscale e Cantieri Regionali', demo: 'imprese' },
};

/**
 * Esegue autonomamente 2-3 mosse reali per i partiti avversari ad ogni avanzamento settimana
 * con stabilità realistica (oscillazioni ordinarie ±0,1%–±0,3%; shock marcati ±0,8%–±1,4% solo
 * in caso di scandali, crisi di coalizione o svolte straordinarie).
 */
function runAutonomousRivalAiMoves(params: {
  parties: PartyState[];
  playerPartyId: string;
  week: number;
  dateLabel: string;
  leaderApproval: Record<string, number>;
  allySatisfaction: Record<string, number>;
}): {
  parties: PartyState[];
  leaderApproval: Record<string, number>;
  allySatisfaction: Record<string, number>;
  mediaItems: MediaItem[];
  notifications: string[];
  shockedPartyIds: string[];
} {
  let parties = params.parties;
  let leaderApproval = { ...params.leaderApproval };
  const allySatisfaction = { ...params.allySatisfaction };
  const mediaItems: MediaItem[] = [];
  const notifications: string[] = [];
  const shockedPartyIds: string[] = [];

  const player = parties.find((p) => p.id === params.playerPartyId)!;
  const rivals = parties.filter((p) => p.id !== params.playerPartyId && p.id !== 'altri');
  if (rivals.length === 0) {
    return { parties, leaderApproval, allySatisfaction, mediaItems, notifications, shockedPartyIds };
  }

  // Seleziona 2 o 3 partiti avversari distinti (peso leggermente maggiore ai partiti più visibili)
  const moveCount = Math.min(rivals.length, params.week % 2 === 0 ? 3 : 2);
  const scoredRivals = [...rivals]
    .map((p) => ({
      party: p,
      sortScore: Math.random() * 18 + Math.sqrt(Math.max(1, p.nationalPoll)) * 2.2,
    }))
    .sort((a, b) => b.sortScore - a.sortScore)
    .slice(0, moveCount)
    .map((x) => x.party);

  const playerAllies = rivals.filter(
    (p) => Boolean(player.coalitionId) && p.coalitionId === player.coalitionId
  );

  for (let i = 0; i < scoredRivals.length; i++) {
    const actor = parties.find((p) => p.id === scoredRivals[i].id)!;
    const presetForActor = EXISTING_PARTIES_2026.find((ep) => ep.id === actor.id);
    const actorOverhead =
      actor.weeklyOverhead ??
      presetForActor?.weeklyOverhead ??
      Math.max(1800, Math.round(1500 + actor.nationalPoll * 2800));
    const actorBudget =
      typeof actor.budget === 'number' && Number.isFinite(actor.budget)
        ? actor.budget
        : (actor.startingBudget ?? presetForActor?.startingBudget ?? 50000);

    // Coerenza economica IA: se il partito avversario è a cassa bassa, frena le campagne costose e fa autofinanziamento
    if (actorBudget < Math.max(10000, Math.round(actorOverhead * 1.4))) {
      const aiRaised = Math.round(5200 + actor.nationalPoll * 750);
      parties = parties.map((p) =>
        p.id === actor.id
          ? {
              ...p,
              budget: clamp(actorBudget + aiRaised, MAX_AI_DEFICIT_FLOOR, 3500000),
            }
          : p
      );
      continue;
    }

    const isOpponentOfPlayer =
      !player.coalitionId || actor.coalitionId !== player.coalitionId;

    const actionPool: (
      | 'campagna_social'
      | 'tour_regionale'
      | 'attacco_rivale'
      | 'proposta_legge'
      | 'corte_alleato'
    )[] = ['campagna_social', 'tour_regionale', 'attacco_rivale', 'proposta_legge'];

    if (isOpponentOfPlayer && playerAllies.length > 0) {
      actionPool.push('corte_alleato');
    }

    const action = actionPool[Math.floor(Math.random() * actionPool.length)];
    const aiActionCost =
      action === 'campagna_social'
        ? CAMPAIGN_ACTION_COSTS.social_campaign
        : action === 'tour_regionale'
          ? CAMPAIGN_ACTION_COSTS.territorial_tour
          : action === 'proposta_legge'
            ? CAMPAIGN_ACTION_COSTS.law_proposal
            : action === 'corte_alleato'
              ? CAMPAIGN_ACTION_COSTS.party_talks
              : CAMPAIGN_ACTION_COSTS.talk_show;

    parties = parties.map((p) =>
      p.id === actor.id
        ? {
            ...p,
            budget: clamp(actorBudget - aiActionCost, MAX_AI_DEFICIT_FLOOR, 3500000),
          }
        : p
    );

    if (action === 'campagna_social') {
      const targetDemo: DemographicId =
        actor.axis.society > 25
          ? 'giovani'
          : actor.axis.economic > 25
            ? 'imprese'
            : actor.axis.economic < -25
              ? 'lavoratori'
              : 'pensionati';
      const demoLabel = DEMOGRAPHICS.find((d) => d.id === targetDemo)?.shortLabel ?? targetDemo;
      const boost = round1(0.18 + Math.random() * 0.16);
      parties = applyElectoralShift(parties, actor.id, { [targetDemo]: boost });
      leaderApproval = adjustLeaderApproval(leaderApproval, actor.id, 1);

      mediaItems.push({
        id: uid('med'),
        week: params.week,
        dateLabel: params.dateLabel,
        type: 'social',
        source: `Campagna ${actor.acronym}`,
        handle: `@${actor.acronym.toLowerCase()}_ufficiale`,
        headline: `${actor.leaderName} (${actor.acronym}) lancia offensiva social mirata su ${demoLabel}`,
        excerpt: `Spot sponsorizzati e dirette sui social consolidano la visibilità di ${actor.name} nel target ${demoLabel}.`,
        sentiment: 'neutro',
        engagement: `${Math.round(18 + actor.nationalPoll * 1.4)}k interazioni`,
        partyColor: actor.color,
      });
    } else if (action === 'tour_regionale') {
      const reg = MACRO_REGIONS[Math.floor(Math.random() * MACRO_REGIONS.length)];
      const boost = round1(0.2 + Math.random() * 0.18);
      parties = applyElectoralShift(parties, actor.id, {}, { [reg.id]: boost });
      leaderApproval = adjustLeaderApproval(leaderApproval, actor.id, 1);

      mediaItems.push({
        id: uid('med'),
        week: params.week,
        dateLabel: params.dateLabel,
        type: 'stampa',
        source: 'Gazzetta Regionale',
        headline: `Tour in ${reg.label} per ${actor.leaderName}: piazze e comizi di ${actor.acronym}`,
        excerpt: `${actor.name} presidia i collegi di ${reg.label} (${reg.regionsList}), consolidando il consenso locale.`,
        sentiment: 'neutro',
        partyColor: actor.color,
      });
    } else if (action === 'proposta_legge') {
      const bill = AI_BILL_TOPICS_BY_ORIENTATION[actor.orientation] ?? {
        title: 'Pacchetto Riforme Economiche',
        demo: 'lavoratori' as DemographicId,
      };
      const boost = round1(0.16 + Math.random() * 0.15);
      parties = applyElectoralShift(parties, actor.id, { [bill.demo]: boost });
      leaderApproval = adjustLeaderApproval(leaderApproval, actor.id, 1);

      mediaItems.push({
        id: uid('med'),
        week: params.week,
        dateLabel: params.dateLabel,
        type: 'stampa',
        source: NEWSPAPERS[(params.week + i) % NEWSPAPERS.length],
        headline: `${actor.name} deposita in Parlamento: “${bill.title}”`,
        excerpt: `${actor.leaderName} prova a dettare l’agenda politica settimanale rilanciando la proposta sui TG nazionali.`,
        sentiment: 'neutro',
        partyColor: actor.color,
      });
    } else if (action === 'corte_alleato' && playerAllies.length > 0) {
      const targetAlly = playerAllies[Math.floor(Math.random() * playerAllies.length)];
      const relDrop = 5 + Math.floor(Math.random() * 4);
      parties = parties.map((p) =>
        p.id === targetAlly.id
          ? { ...p, relationWithPlayer: clamp(p.relationWithPlayer - relDrop, -100, 100) }
          : p
      );
      if (typeof allySatisfaction[targetAlly.id] === 'number') {
        allySatisfaction[targetAlly.id] = Math.round(
          clamp(allySatisfaction[targetAlly.id] - 3, 5, 100)
        );
      }
      leaderApproval = adjustLeaderApproval(leaderApproval, actor.id, 1);

      mediaItems.push({
        id: uid('med'),
        week: params.week,
        dateLabel: params.dateLabel,
        type: 'rivale',
        source: 'Retroscena Transatlantico',
        headline: `${actor.leaderName} (${actor.acronym}) corteggia ${targetAlly.acronym}: manovre sulla tua coalizione`,
        excerpt: `Contatti riservati tra ${actor.name} e ${targetAlly.leaderName} per aprire un tavolo alternativo (-${relDrop} rapporti con ${targetAlly.acronym}).`,
        sentiment: 'negativo',
        partyColor: actor.color,
      });
      notifications.push(
        `Manovra avversaria: ${actor.acronym} corteggia il tuo alleato ${targetAlly.acronym} (-${relDrop} rapporti).`
      );
    } else {
      // attacco_rivale (oscillazione ordinaria contenuta)
      const potentialTargets = parties.filter(
        (p) =>
          p.id !== actor.id &&
          p.id !== 'altri' &&
          (!actor.coalitionId || p.coalitionId !== actor.coalitionId)
      );
      const target =
        potentialTargets.length > 0
          ? isOpponentOfPlayer && Math.random() < 0.4
            ? player
            : potentialTargets[Math.floor(Math.random() * potentialTargets.length)]
          : player;

      const hit = round1(0.14 + Math.random() * 0.12);
      parties = applyElectoralShift(parties, target.id, {
        lavoratori: -hit,
        giovani: -round1(hit * 0.8),
      });
      parties = applyElectoralShift(parties, actor.id, { lavoratori: round1(hit * 0.6) });
      leaderApproval = adjustLeaderApproval(leaderApproval, target.id, -1);
      leaderApproval = adjustLeaderApproval(leaderApproval, actor.id, Math.random() < 0.6 ? 1 : -1);

      mediaItems.push({
        id: uid('med'),
        week: params.week,
        dateLabel: params.dateLabel,
        type: 'rivale',
        source: `${actor.leaderName} (${actor.acronym})`,
        headline: `Attacco frontale di ${actor.leaderName} contro ${target.leaderName} (${target.acronym})`,
        excerpt:
          target.id === player.id
            ? `“La linea di ${player.name} sta danneggiando il Paese: siamo pronti a sfidarli su ogni dossier.”`
            : `Duro botta e risposta in TV tra ${actor.acronym} e ${target.acronym} che agita il dibattito della settimana.`,
        sentiment: target.id === player.id ? 'negativo' : 'neutro',
        partyColor: actor.color,
      });
    }
  }

  // Eventi straordinari AI (scandali o rotture interne): rari (~9% da sett. 4), unici responsabili di scosse ±0,8%–±1,4%
  const eligibleShockRivals = parties.filter(
    (p) => p.id !== params.playerPartyId && p.id !== 'altri' && p.nationalPoll >= 4.0
  );
  if (params.week >= 4 && eligibleShockRivals.length > 0 && Math.random() < 0.09) {
    const victim = eligibleShockRivals[Math.floor(Math.random() * eligibleShockRivals.length)];
    const shockDrop = -round1(0.85 + Math.random() * 0.55); // -0.85% .. -1.4%
    parties = applyElectoralShift(
      parties,
      victim.id,
      {
        giovani: shockDrop,
        lavoratori: shockDrop,
        imprese: shockDrop * 0.9,
        pensionati: shockDrop * 0.9,
      },
      undefined,
      undefined,
      { bypassInertia: true }
    );
    leaderApproval = adjustLeaderApproval(leaderApproval, victim.id, -4);
    shockedPartyIds.push(victim.id);
    // I voti persi confluiscono per affinità ideologica (vasi comunicanti) ai partiti contigui
    const headline =
      params.week % 2 === 0
        ? `BUFERA IN ${victim.acronym}: inchiesta su un dirigente nazionale frena ${victim.leaderName}`
        : `STRAPPO INTERNO IN ${victim.acronym}: lite fra correnti sul programma fa calare i consensi`;
    mediaItems.unshift({
      id: uid('med'),
      week: params.week,
      dateLabel: params.dateLabel,
      type: 'stampa',
      source: NEWSPAPERS[params.week % NEWSPAPERS.length],
      headline,
      excerpt: `Scossa nei sondaggi per ${victim.name}: i voti in uscita si spostano verso le forze ideologicamente più vicine e l’area dell’astensione.`,
      sentiment: 'neutro',
      partyColor: victim.color,
    });
    notifications.push(
      `Scossa sondaggi rivali: ${victim.name} (${victim.acronym}) travolto da uno scandalo interno — flussi in uscita verso l’area affine.`
    );
  }

  return { parties, leaderApproval, allySatisfaction, mediaItems, notifications, shockedPartyIds };
}

/**
 * Simula il bilancio settimanale di TUTTI i partiti IA secondo le stesse regole economiche del giocatore:
 * entrate da 2×1000, quote parlamentari reali, tesseramento e sezioni; uscite per struttura, sedi e campagne.
 * Evita sia soldi infiniti sia fallimenti a catena grazie a ridimensionamento/autofinanziamento automatico.
 */
function simulateWeeklyAiPartyFinances(params: {
  parties: PartyState[];
  playerPartyId: string;
  legislatureSeats?: SeatAllocation[];
  playerNextBudget: number;
}): PartyState[] {
  const sittingSeats = getCurrentParliamentSeats({
    legislatureSeats: params.legislatureSeats,
    parties: params.parties,
  });
  const seatCountByParty = new Map<string, number>();
  for (const s of sittingSeats) {
    seatCountByParty.set(s.partyId, s.camera + s.senato);
  }

  return params.parties.map((p) => {
    if (p.id === params.playerPartyId) {
      return { ...p, budget: params.playerNextBudget };
    }
    if (p.id === 'altri') return p;

    const preset = EXISTING_PARTIES_2026.find((ep) => ep.id === p.id);
    const poll = Math.max(0, p.nationalPoll);
    const electedSeats = seatCountByParty.get(p.id) ?? 0;
    let chapters = clamp(
      typeof p.aiChapterCount === 'number' && Number.isFinite(p.aiChapterCount)
        ? Math.round(p.aiChapterCount)
        : (preset?.startingHq.length ?? 1),
      0,
      20
    );

    const overhead =
      typeof p.weeklyOverhead === 'number' && Number.isFinite(p.weeklyOverhead)
        ? Math.max(1200, Math.round(p.weeklyOverhead))
        : (preset?.weeklyOverhead ?? Math.max(1800, Math.round(1400 + poll * 2800)));

    const currentBudget =
      typeof p.budget === 'number' && Number.isFinite(p.budget)
        ? p.budget
        : (p.startingBudget ?? preset?.startingBudget ?? 50000);

    const isAiExtraParl = electedSeats === 0;
    const chapterIncomeScale = getChapterIncomeScaleForSeats(electedSeats);
    const twoPerThousand = isAiExtraParl
      ? poll < 0.8
        ? 0
        : Math.round(Math.min(1350, 180 + poll * 175))
      : Math.round(
          (600 + poll * 1400) * Math.min(1, 0.4 + electedSeats / 40) + electedSeats * 65
        );
    const parliamentaryContributions = electedSeats * 450;
    const estMembers = Math.max(450, Math.round(poll * 3200 + chapters * 850));
    const membershipAndHq = isAiExtraParl
      ? Math.round(1550 + Math.min(poll, 12) * 195 + Math.min(1400, estMembers * 0.06)) +
        Math.round(chapters * 1650 * chapterIncomeScale)
      : Math.round(900 + poll * 360 + (estMembers * 1.15) / 10) +
        Math.round(chapters * 1650 * chapterIncomeScale);
    const hqUpkeep = chapters * 800;

    // Adattamento strutturale realistico: se un partito perde seggi/consenso taglia gradualmente i costi fissi
    const effectiveAiOverhead = isAiExtraParl ? Math.min(overhead, 2800) : overhead;
    const targetOverhead = isAiExtraParl
      ? Math.max(1200, Math.min(2800, Math.round(1450 + poll * 180)))
      : Math.max(
          1500,
          Math.round(twoPerThousand * 0.6 + parliamentaryContributions * 0.72 + 1200)
        );
    const adjustedOverhead = Math.round(effectiveAiOverhead * 0.92 + targetOverhead * 0.08);

    let nextAiBudget =
      currentBudget +
      (twoPerThousand + parliamentaryContributions + membershipAndHq) -
      (adjustedOverhead + hqUpkeep);

    // Protezione anti-fallimento a catena: se la cassa scende troppo, il partito IA organizza autofinanziamento e riduce sedi extra
    if (nextAiBudget < Math.max(6000, adjustedOverhead)) {
      nextAiBudget += Math.round(4800 + poll * 600);
      if (nextAiBudget < 0 && chapters > 1) {
        chapters -= 1;
        nextAiBudget += 4500;
      }
    } else if (
      nextAiBudget > Math.max(95000, adjustedOverhead * 5) &&
      chapters < 20 &&
      Math.random() < 0.14
    ) {
      // Espansione territoriale realistica quando il partito IA ha riserve solide
      nextAiBudget -= 12000;
      chapters += 1;
    }

    return {
      ...p,
      budget: Math.round(clamp(nextAiBudget, MAX_AI_DEFICIT_FLOOR, 3500000)),
      weeklyOverhead: adjustedOverhead,
      aiChapterCount: chapters,
    };
  });
}

/** Advances the game by 1 week */
export function advanceWeek(state: GameState): { nextState: GameState; notifications: string[] } {
  const pendingCrises = getPendingCrisesCount(state);
  if (pendingCrises > 0) {
    return {
      nextState: state,
      notifications: [
        `Restano ${pendingCrises} dossier settimanali in attesa: scegli una linea o premi "Salta / Nessuna dichiarazione" nella scheda Crisi & Media.`,
      ],
    };
  }

  const notifications: string[] = [];
  const nextWeek = state.week + 1;
  const dateInfo = formatGameDate(nextWeek);

  const previousLeaderApproval: Record<string, number> = {
    ...buildDefaultLeaderApproval(
      state.parties,
      state.playerPartyId,
      state.leader.style,
      state.leader.traits
    ),
    ...(state.leaderApproval ?? {}),
  };
  let nextLeaderApproval: Record<string, number> = { ...previousLeaderApproval };

  let updatedParties = state.parties.map((p) => ({
    ...p,
    previousPoll: p.nationalPoll,
  }));

  const playerWeekStartPoll =
    state.weekStartPlayerPoll ??
    state.parties.find((p) => p.id === state.playerPartyId)?.nationalPoll ??
    0;

  const traits = getActiveTraitProfile(state);
  let nextLegislatureSeats: SeatAllocation[] = getCurrentParliamentSeats(state).map((s) => ({
    ...s,
  }));

  // Aggiorna Sezioni/Circoli Regionali (Livelli 1..3): radicamento locale + crescita iscritti settimanale
  const nextChapters = getNormalizedRegionalChapters(state);
  const hqRegionBoosts: Partial<Record<RegionId, number>> = {};
  let activeChaptersCount = 0;
  let totalWeeklyChapterNewMembers = 0;
  for (const reg of ITALIAN_REGIONS) {
    const ch = nextChapters[reg.id];
    const level = ch && ch.level >= 1 && ch.level <= 3 ? ch.level : 0;
    if (level <= 0) continue;
    activeChaptersCount += 1;
    const metrics = getRegionChapterMetrics(reg, level);
    hqRegionBoosts[reg.id] =
      Math.round(metrics.weeklyConsensusBoost * 0.65 * traits.territorialMult * 1000) / 1000;
    const newMembersWithTrait = Math.max(
      1,
      Math.round(metrics.weeklyNewMembers * traits.membershipMult)
    );
    nextChapters[reg.id] = {
      level,
      openedAtWeek: ch?.openedAtWeek ?? state.week,
      localMembers: (ch?.localMembers ?? 85) + newMembersWithTrait,
    };
    totalWeeklyChapterNewMembers += newMembersWithTrait;
  }
  const nextFundraising: FundraisingState = {
    ...state.fundraising,
    activeMembersCount:
      (state.fundraising?.activeMembersCount ?? 150) + totalWeeklyChapterNewMembers,
  };

  if (Object.keys(hqRegionBoosts).length > 0) {
    updatedParties = applyElectoralShift(
      updatedParties,
      state.playerPartyId,
      {},
      undefined,
      hqRegionBoosts,
      { weekStartPoll: playerWeekStartPoll }
    );
  }

  // Attrito naturale per micro-partiti (< 3,5%) che non svolgono attività territoriale né presidiano sezioni
  const playerBeforeAttrition = updatedParties.find((p) => p.id === state.playerPartyId)!;
  if (
    !state.committee.active &&
    playerBeforeAttrition.nationalPoll >= 0.2 &&
    playerBeforeAttrition.nationalPoll < 3.5 &&
    !state.weeklyTerritorialActivity &&
    activeChaptersCount === 0
  ) {
    const attrition = playerBeforeAttrition.nationalPoll < 1.5 ? -0.1 : -0.14;
    updatedParties = applyElectoralShift(
      updatedParties,
      state.playerPartyId,
      {
        giovani: attrition,
        lavoratori: attrition,
        imprese: attrition,
        pensionati: attrition,
      },
      undefined,
      undefined,
      { weekStartPoll: playerWeekStartPoll }
    );
    notifications.push(
      'Bassa presenza territoriale: senza sezioni aperte o iniziative sul territorio il consenso subisce un lieve attrito naturale.'
    );
  }

  // Mosse autonome settimanali di 2-3 partiti avversari (IA)
  const aiResult = runAutonomousRivalAiMoves({
    parties: updatedParties,
    playerPartyId: state.playerPartyId,
    week: nextWeek,
    dateLabel: dateInfo.shortLabel,
    leaderApproval: nextLeaderApproval,
    allySatisfaction: state.allySatisfaction ?? {},
  });
  updatedParties = aiResult.parties;
  nextLeaderApproval = aiResult.leaderApproval;
  const aiAllySatisfaction = aiResult.allySatisfaction;
  const aiMediaItems = aiResult.mediaItems;
  const aiShockedPartyIds = new Set(aiResult.shockedPartyIds);
  notifications.push(...aiResult.notifications);

  // Applica eventuali effetti annuali della Legge di Bilancio approvata
  const activeBudgetMod =
    state.budgetModifiers && nextWeek <= state.budgetModifiers.activeUntilWeek
      ? state.budgetModifiers
      : null;

  // Logoramento di Governo vs Rendita di Opposizione (per tutti i partiti, giocatore e IA)
  const spreadStress =
    state.stateIndicators.spread >= 210
      ? 2.2
      : state.stateIndicators.spread >= 165
        ? 1.3
        : state.stateIndicators.spread >= 135
          ? 0.55
          : state.stateIndicators.spread <= 105
            ? -0.4
            : 0;
  const stabilityStress =
    state.stateIndicators.socialStability < 45
      ? 1.9
      : state.stateIndicators.socialStability < 62
        ? 0.9
        : state.stateIndicators.socialStability >= 76
          ? -0.35
          : 0;
  const euStress =
    state.stateIndicators.euRelations < 45
      ? 1.1
      : state.stateIndicators.euRelations < 58
        ? 0.45
        : state.stateIndicators.euRelations >= 75
          ? -0.2
          : 0;
  const budgetUnpopularStress =
    activeBudgetMod &&
    (activeBudgetMod.weeklyStabilityDrift < 0 || activeBudgetMod.weeklySpreadDrift >= 2)
      ? 0.65
      : 0;

  const totalGovStress = clamp(
    0.35 + spreadStress + stabilityStress + euStress + budgetUnpopularStress,
    -0.5,
    4.0
  );

  for (const p of updatedParties) {
    if (p.id === 'altri') continue;
    if (p.id === state.playerPartyId && state.committee.active && p.nationalPoll < 0.1) continue;
    if (p.isInGovernment) {
      // Chi governa si logora gradualmente se economia/spread/stabilità peggiorano
      const govWear =
        totalGovStress > 0
          ? -round1(clamp(0.04 + totalGovStress * 0.045, 0.04, 0.22))
          : 0.04;
      if (Math.abs(govWear) >= 0.04) {
        updatedParties = applyElectoralShift(
          updatedParties,
          p.id,
          {
            lavoratori: govWear,
            pensionati: govWear * 0.9,
            imprese: govWear * (spreadStress > 0.5 ? 1.15 : 0.8),
            giovani: govWear * 0.85,
          },
          undefined,
          undefined,
          p.id === state.playerPartyId ? { weekStartPoll: playerWeekStartPoll } : undefined
        );
      }
    } else if (p.nationalPoll >= 0.3) {
      // Rendita di Opposizione coerente: crescita lenta e costante proporzionale al logoramento dell'esecutivo
      const approvalBoost = ((nextLeaderApproval[p.id] ?? 32) - 32) * 0.001;
      const oppDividend = round1(
        clamp(0.015 + Math.max(0, totalGovStress) * 0.014 + approvalBoost, 0.01, 0.07)
      );
      if (oppDividend >= 0.02) {
        updatedParties = applyElectoralShift(
          updatedParties,
          p.id,
          {
            lavoratori: oppDividend,
            giovani: oppDividend * 0.9,
            pensionati: oppDividend * 0.7,
            imprese: oppDividend * 0.65,
          },
          undefined,
          undefined,
          p.id === state.playerPartyId ? { weekStartPoll: playerWeekStartPoll } : undefined
        );
      }
    }
  }

  // Effetto Gradimento Leader sulla crescita di ogni partito + lieve drift naturale contenuto
  for (const p of updatedParties) {
    if (p.id === 'altri') continue;
    // Un Comitato Promotore ancora allo 0.0% cresce solo tramite azioni dirette e raccolta firme
    if (p.id === state.playerPartyId && state.committee.active && p.nationalPoll < 0.1) continue;
    const approval = nextLeaderApproval[p.id] ?? 30;
    const leaderPull = round1(clamp((approval - 36) * 0.004, -0.1, 0.09));
    if (Math.abs(leaderPull) >= 0.03) {
      updatedParties = applyElectoralShift(
        updatedParties,
        p.id,
        {
          giovani: leaderPull,
          lavoratori: leaderPull,
          imprese: leaderPull,
          pensionati: leaderPull,
        },
        undefined,
        undefined,
        p.id === state.playerPartyId ? { weekStartPoll: playerWeekStartPoll } : undefined
      );
    }
    if (p.id !== state.playerPartyId) {
      const smallDrift = (Math.random() - 0.5) * 0.18;
      const demoKey = DEMOGRAPHICS[Math.floor(Math.random() * DEMOGRAPHICS.length)].id;
      updatedParties = applyElectoralShift(updatedParties, p.id, { [demoKey]: smallDrift });
    }
  }

  // Dynamic 4-axis ideological alignment pull on demographics (only once party has poll presence)
  const playerPreDrift = updatedParties.find((p) => p.id === state.playerPartyId)!;
  if (playerPreDrift.nationalPoll >= 0.2) {
    const axisDemoDrift: Partial<Record<DemographicId, number>> = {
      imprese: round1((playerPreDrift.axis.economic / 100) * 0.06),
      lavoratori: round1((-playerPreDrift.axis.economic / 100) * 0.055),
      giovani: round1(
        (playerPreDrift.axis.society / 100) * 0.06 -
          Math.max(0, playerPreDrift.axis.institutions) * 0.0018
      ),
      pensionati: round1((-playerPreDrift.axis.society / 100) * 0.05),
    };
    updatedParties = applyElectoralShift(
      updatedParties,
      state.playerPartyId,
      axisDemoDrift,
      undefined,
      undefined,
      { weekStartPoll: playerWeekStartPoll }
    );
  }

  if (activeBudgetMod && activeBudgetMod.demoWeeklyBonus) {
    updatedParties = applyElectoralShift(
      updatedParties,
      state.playerPartyId,
      activeBudgetMod.demoWeeklyBonus,
      undefined,
      undefined,
      { weekStartPoll: playerWeekStartPoll }
    );
  }

  // State indicators natural drift & macroeconomic consequences (con impatto tratti attivi ogni 2 settimane)
  const traitIndicatorTick = nextWeek % 2 === 0;
  let nextIndicators: StateIndicators = {
    spread: Math.round(
      clamp(
        state.stateIndicators.spread +
          (state.stateIndicators.spread > 135 ? -3 : state.stateIndicators.spread < 105 ? 2 : 0) +
          (state.regimeStatus === 'regime_autoritario' ? 5 : 0) +
          (activeBudgetMod?.weeklySpreadDrift ?? 0) +
          (traitIndicatorTick ? traits.weeklySpreadDrift : 0),
        65,
        450
      )
    ),
    socialStability: Math.round(
      clamp(
        state.stateIndicators.socialStability +
          (state.stateIndicators.socialStability < 65 ? 2 : 0) -
          (state.regimeStatus === 'regime_autoritario' ? 3 : 0) +
          (activeBudgetMod?.weeklyStabilityDrift ?? 0),
        0,
        100
      )
    ),
    euRelations: Math.round(
      clamp(
        state.stateIndicators.euRelations +
          (playerPreDrift.axis.europe > 40 ? 1 : playerPreDrift.axis.europe < -40 ? -1 : 0) +
          (activeBudgetMod?.weeklyEuDrift ?? 0) +
          (traitIndicatorTick ? traits.weeklyEuDrift : 0),
        0,
        100
      )
    ),
    democraticHealth: Math.round(
      clamp(
        state.stateIndicators.democraticHealth +
          (state.institutionalFlags.fullPowers ? -2 : playerPreDrift.axis.institutions < -30 ? 1 : 0) +
          (traitIndicatorTick ? traits.weeklyDemDrift : 0),
        0,
        100
      )
    ),
  };

  let statePenaltyBudget = 0;
  let newMedia: MediaItem[] = [];

  if (nextIndicators.spread >= 240) {
    const spreadFine = Math.min(20000, Math.max(4000, Math.round(state.weeklyOverhead * 0.35)));
    statePenaltyBudget += spreadFine;
    updatedParties = applyElectoralShift(updatedParties, state.playerPartyId, {
      imprese: -0.5,
      pensionati: -0.3,
    });
    notifications.push(
      `Allarme Spread a ${nextIndicators.spread} punti: crollo donazioni (-€${spreadFine.toLocaleString('it-IT')} e calo tra imprese).`
    );
  }

  if (nextIndicators.socialStability < 35) {
    const protestDrag =
      state.institutionalFlags.strikeLimit || state.institutionalFlags.mediaControl ? -0.3 : -0.65;
    updatedParties = applyElectoralShift(updatedParties, state.playerPartyId, {
      lavoratori: protestDrag,
      giovani: protestDrag,
    });
    notifications.push(
      'Tensione di piazza e scioperi diffusi: stabilità sociale critica frena il consenso.'
    );
    newMedia.push({
      id: uid('med'),
      week: nextWeek,
      dateLabel: dateInfo.shortLabel,
      type: 'social',
      source: 'Cronaca Piazze',
      handle: '@piazze_italia',
      headline: 'Cortei e blocchi in 14 città italiane: clima sociale rovente',
      excerpt: `Stabilità sociale scesa al ${nextIndicators.socialStability}%. Opposizioni e sindacati alzano il livello dello scontro.`,
      sentiment: 'negativo',
      engagement: '92.1k interazioni',
    });
  }

  if (nextIndicators.euRelations < 35) {
    const euFine = Math.min(20000, Math.max(4000, Math.round(state.weeklyOverhead * 0.35)));
    statePenaltyBudget += euFine;
    nextIndicators = applyStateEffects(nextIndicators, { spread: 8 });
    notifications.push(
      `Scontro con Bruxelles: tensione sui fondi PNRR (-€${euFine.toLocaleString('it-IT')}, spread +8).`
    );
  }

  const nextRegimeStatus = deriveRegimeStatus(
    state.institutionalFlags,
    nextIndicators.democraticHealth
  );

  // Bilancio settimanale realistico del partito (L. 13/2014: 2×1000, quote parlamentari, tesseramento)
  const playerNow = updatedParties.find((p) => p.id === state.playerPartyId)!;
  const finances = calculateWeeklyPartyFinances(
    { ...state, regionalChapters: nextChapters, fundraising: nextFundraising },
    updatedParties
  );
  const weeklyIncome = finances.totalIncome;
  const weeklyCost = finances.totalExpenses + statePenaltyBudget;
  const rawNextBudget = state.budget + weeklyIncome - weeklyCost;
  let nextBudget = Math.max(MAX_PLAYER_DEFICIT_FLOOR, Math.round(rawNextBudget));

  if (nextBudget <= 0) {
    updatedParties = applyElectoralShift(updatedParties, state.playerPartyId, {
      imprese: -0.25,
      pensionati: -0.2,
    });
    notifications.push(
      'Deficit di cassa: avvia l’Autofinanziamento Volontari (€0) o il Crowdfunding (€0) per tornare in attivo senza blocchi.'
    );
  } else if (
    nextBudget < Math.max(10000, weeklyCost * 2) &&
    state.budget >= Math.max(10000, weeklyCost * 2)
  ) {
    notifications.push(
      'Allerta cassa bassa: programma una raccolta fondi a €0 (Colletta Volontari, Tesseramento o Crowdfunding).'
    );
  }

  // Coerenza bilancio settimanale per TUTTI i partiti IA (stesse regole economiche del giocatore)
  updatedParties = simulateWeeklyAiPartyFinances({
    parties: updatedParties,
    playerPartyId: state.playerPartyId,
    legislatureSeats: state.legislatureSeats,
    playerNextBudget: nextBudget,
  });

  let schismOccurred = state.schismOccurred;
  let nextSchismCount = state.schismCount ?? (state.schismOccurred ? 1 : 0);
  let nextLowCohesionStreak = state.lowCohesionStreak ?? 0;
  let schismTriggeredThisWeek = false;
  let spawnedSplinterId: string | null = null;
  const nextMinistryExecs: Partial<Record<MinistryId, string>> = {
    ...(state.governmentMinistryExecutives ?? {}),
  };

  let updatedExecs: ExecutiveMember[] = state.executives.map((ex) => {
    const ambitionDrag = ex.ambition > 72 ? -2 : -1;
    const pollBonus = playerNow.nationalPoll >= playerNow.previousPoll ? 1 : -2;
    const traitCohesionBonus = ex.loyalty < 85 ? traits.cohesionWeeklyBonus : 0;
    const nextLoyalty = clamp(ex.loyalty + ambitionDrag + pollBonus + traitCohesionBonus, 8, 100);
    const nextLowLoyaltyWeeks = nextLoyalty <= 30 ? (ex.lowLoyaltyWeeks ?? 0) + 1 : 0;
    return {
      ...ex,
      loyalty: nextLoyalty,
      lowLoyaltyWeeks: nextLowLoyaltyWeeks,
      actedThisWeek: false,
    };
  });

  // Valutazione settimanale dell'affinità Dirigenti <-> Ministeri detenuti dal giocatore al Governo
  const preSchismSeatStatus = getPlayerParliamentSeats({
    ...state,
    parties: updatedParties,
  });
  const isPlayerInGovActive =
    !state.extraParliamentary &&
    !preSchismSeatStatus.isExtraParliamentary &&
    (state.isPrimeMinister || state.governmentRole !== 'opposizione');

  if (isPlayerInGovActive && Object.keys(state.governmentMinistries ?? {}).length > 0) {
    let affineWeeklyCount = 0;
    let bestAffineSample: { ministryName: string; execName: string } | null = null;
    const outOfRoleSamples: { ministryName: string; execName: string; execSpec: string }[] = [];

    for (const m of KEY_MINISTRIES) {
      if (state.governmentMinistries[m.id] !== state.playerPartyId) continue;
      let execId = nextMinistryExecs[m.id];
      let exec = updatedExecs.find((e) => e.id === execId);
      if (!exec) {
        exec = pickBestExecutiveForMinistry(updatedExecs, m.id);
        if (exec) nextMinistryExecs[m.id] = exec.id;
      }
      const aff = evaluateExecutiveMinistryAffinity(exec, m.id);
      const compScale = exec ? clamp(exec.competence / 75, 0.8, 1.25) : 1;

      if (aff.level === 'affine' && exec) {
        affineWeeklyCount += 1;
        if (!bestAffineSample) {
          bestAffineSample = { ministryName: m.shortName, execName: exec.name };
        }
        switch (m.id) {
          case 'mef':
            nextIndicators = applyStateEffects(nextIndicators, { spread: -2 });
            updatedParties = applyElectoralShift(updatedParties, state.playerPartyId, {
              imprese: round1(0.08 * compScale),
            });
            break;
          case 'interno':
            nextIndicators = applyStateEffects(nextIndicators, { socialStability: 1 });
            updatedParties = applyElectoralShift(updatedParties, state.playerPartyId, {
              pensionati: round1(0.06 * compScale),
            });
            break;
          case 'esteri':
            nextIndicators = applyStateEffects(nextIndicators, { euRelations: 1 });
            break;
          case 'giustizia':
            nextIndicators = applyStateEffects(nextIndicators, { democraticHealth: 1 });
            break;
          case 'infrastrutture':
            updatedParties = applyElectoralShift(updatedParties, state.playerPartyId, {
              imprese: round1(0.07 * compScale),
              lavoratori: round1(0.06 * compScale),
            });
            break;
          case 'salute':
            nextIndicators = applyStateEffects(nextIndicators, { socialStability: 1 });
            updatedParties = applyElectoralShift(updatedParties, state.playerPartyId, {
              pensionati: round1(0.08 * compScale),
            });
            break;
          case 'istruzione':
            updatedParties = applyElectoralShift(updatedParties, state.playerPartyId, {
              giovani: round1(0.1 * compScale),
            });
            break;
          case 'ambiente':
            nextIndicators = applyStateEffects(nextIndicators, { euRelations: 1 });
            updatedParties = applyElectoralShift(updatedParties, state.playerPartyId, {
              giovani: round1(0.07 * compScale),
            });
            break;
        }
      } else if (aff.level === 'fuori_ruolo' && exec) {
        outOfRoleSamples.push({
          ministryName: m.shortName,
          execName: exec.name,
          execSpec: getSpecializationLabel(exec.specialization),
        });
        switch (m.id) {
          case 'mef':
            nextIndicators = applyStateEffects(nextIndicators, { spread: 3 });
            updatedParties = applyElectoralShift(updatedParties, state.playerPartyId, {
              imprese: -0.1,
            });
            break;
          case 'interno':
            nextIndicators = applyStateEffects(nextIndicators, { socialStability: -2 });
            break;
          case 'esteri':
            nextIndicators = applyStateEffects(nextIndicators, { euRelations: -2 });
            break;
          case 'giustizia':
            nextIndicators = applyStateEffects(nextIndicators, { democraticHealth: -2 });
            break;
          case 'infrastrutture':
            updatedParties = applyElectoralShift(updatedParties, state.playerPartyId, {
              imprese: -0.09,
              lavoratori: -0.08,
            });
            break;
          case 'salute':
            nextIndicators = applyStateEffects(nextIndicators, { socialStability: -1 });
            updatedParties = applyElectoralShift(updatedParties, state.playerPartyId, {
              pensionati: -0.1,
            });
            break;
          case 'istruzione':
            updatedParties = applyElectoralShift(updatedParties, state.playerPartyId, {
              giovani: -0.1,
            });
            break;
          case 'ambiente':
            nextIndicators = applyStateEffects(nextIndicators, { euRelations: -1 });
            updatedParties = applyElectoralShift(updatedParties, state.playerPartyId, {
              giovani: -0.08,
            });
            break;
        }
      }
    }

    if (outOfRoleSamples.length > 0) {
      const credPenalty = Math.min(3, outOfRoleSamples.length);
      nextLeaderApproval = adjustLeaderApproval(
        nextLeaderApproval,
        state.playerPartyId,
        -credPenalty
      );
      const firstBad = outOfRoleSamples[0];
      notifications.push(
        `Ministro fuori ruolo a ${firstBad.ministryName}: ${firstBad.execName} (${firstBad.execSpec}) penalizza credibilità (-${credPenalty}) e risultati del dicastero.`
      );
      if (nextWeek % 2 === 0 || outOfRoleSamples.length >= 2) {
        newMedia.push({
          id: uid('med'),
          week: nextWeek,
          dateLabel: dateInfo.shortLabel,
          type: 'stampa',
          source: 'Il Foglio Economico',
          headline: `Dossier bloccati a ${firstBad.ministryName}: ${firstBad.execName} nel mirino della stampa`,
          excerpt: `Profilo ${firstBad.execSpec} giudicato inadeguato per ${firstBad.ministryName}: peggiorano i risultati del dicastero e cala la credibilità del Governo.`,
          sentiment: 'negativo',
          partyColor: '#F43F5E',
        });
      }
    } else if (affineWeeklyCount >= 2 && nextWeek % 4 === 0 && bestAffineSample) {
      nextLeaderApproval = adjustLeaderApproval(nextLeaderApproval, state.playerPartyId, 1);
      newMedia.push({
        id: uid('med'),
        week: nextWeek,
        dateLabel: dateInfo.shortLabel,
        type: 'stampa',
        source: 'Il Corriere Nazionale',
        headline: `Efficienza al Governo: bene ${bestAffineSample.execName} a ${bestAffineSample.ministryName}`,
        excerpt: `I ${affineWeeklyCount} ministeri guidati da dirigenti affini di ${playerNow.acronym} garantiscono buona stampa e risultati concreti sui dossier chiave.`,
        sentiment: 'positivo',
        partyColor: playerNow.color,
      });
    }
  }

  // Scissioni interne coerenti: possibili SOLO con consenso >= 4.0% e coesione critica per 3 settimane consecutive
  const partyCohesionNow = calculatePartyCohesion(updatedExecs);
  const cohesionCriticalNow = isPartyCohesionCritical(updatedExecs);
  const playerBeforeSchism = updatedParties.find((p) => p.id === state.playerPartyId)!;

  if (playerBeforeSchism.nationalPoll >= SCHISM_MIN_POLL && cohesionCriticalNow) {
    nextLowCohesionStreak += 1;
    const rebelExec = [...updatedExecs].sort((a, b) =>
      a.loyalty !== b.loyalty ? a.loyalty - b.loyalty : b.ambition - a.ambition
    )[0];

    if (nextLowCohesionStreak >= SCHISM_REQUIRED_WEEKS && rebelExec) {
      schismOccurred = true;
      schismTriggeredThisWeek = true;
      nextSchismCount += 1;
      nextLowCohesionStreak = 0;

      // Quota realistica sottratta al partito del giocatore (consenso, cassa/iscritti ed eventuali parlamentari)
      const rawRatio = clamp(
        0.2 + ((rebelExec.ambition - 50) / 220) + ((rebelExec.competence - 65) / 350),
        0.18,
        0.32
      );
      const maxPollTransfer = Math.min(4.5, Math.max(1.2, playerBeforeSchism.nationalPoll - 1.5));
      const effectiveRatio = clamp(
        maxPollTransfer / Math.max(4.0, playerBeforeSchism.nationalPoll),
        0.14,
        rawRatio
      );

      const currentSeats = nextLegislatureSeats;
      const playerSeatRow = currentSeats.find((s) => s.partyId === state.playerPartyId);
      const hasParliamentaryGroup =
        !state.extraParliamentary &&
        Boolean(playerSeatRow && playerSeatRow.camera + playerSeatRow.senato > 0);

      const defectedCamera =
        hasParliamentaryGroup && playerSeatRow && playerSeatRow.camera > 1
          ? Math.max(
              1,
              Math.min(playerSeatRow.camera - 1, Math.round(playerSeatRow.camera * effectiveRatio))
            )
          : 0;
      const defectedSenato =
        hasParliamentaryGroup && playerSeatRow && playerSeatRow.senato > 1
          ? Math.max(
              1,
              Math.min(playerSeatRow.senato - 1, Math.round(playerSeatRow.senato * effectiveRatio))
            )
          : 0;

      const { splinter, updatedPlayer, actualLostPoll } = buildSplinterParty(
        playerBeforeSchism,
        rebelExec,
        updatedParties,
        effectiveRatio,
        hasParliamentaryGroup ? { camera: defectedCamera, senato: defectedSenato } : undefined
      );

      spawnedSplinterId = splinter.id;

      // Scissione parlamentare reale: trasferisci i seggi dei fuoriusciti nella legislatura in corso
      if (hasParliamentaryGroup && (defectedCamera > 0 || defectedSenato > 0)) {
        nextLegislatureSeats = nextLegislatureSeats.map((s) =>
          s.partyId === state.playerPartyId
            ? {
                ...s,
                camera: Math.max(0, s.camera - defectedCamera),
                senato: Math.max(0, s.senato - defectedSenato),
              }
            : s
        );
        nextLegislatureSeats.push({
          partyId: splinter.id,
          camera: defectedCamera,
          senato: defectedSenato,
          coalitionId: null,
        });
      } else {
        nextLegislatureSeats.push({
          partyId: splinter.id,
          camera: 0,
          senato: 0,
          coalitionId: null,
        });
      }

      // Inserisci il nuovo mini-partito prima di 'altri' e rinormalizza i sondaggi al 100%
      const withUpdatedPlayer = updatedParties.map((p) =>
        p.id === state.playerPartyId ? updatedPlayer : p
      );
      const altriIdx = withUpdatedPlayer.findIndex((p) => p.id === 'altri');
      if (altriIdx >= 0) {
        withUpdatedPlayer.splice(altriIdx, 0, splinter);
      } else {
        withUpdatedPlayer.push(splinter);
      }
      updatedParties = normalizeAllPolls(withUpdatedPlayer);

      const schismLoss = Math.min(60000, Math.max(8000, Math.round(nextBudget * 0.22)));
      nextBudget = Math.max(0, nextBudget - schismLoss);
      const defectingMembers = Math.max(
        450,
        Math.round(playerBeforeSchism.nationalPoll * 1250 * effectiveRatio)
      );

      // Inizializza gradimento leader per il nuovo partito scissionista
      const splinterInitApproval = clamp(
        Math.round(32 + (rebelExec.competence - 60) * 0.3),
        24,
        52
      );
      nextLeaderApproval = {
        ...nextLeaderApproval,
        [splinter.id]: splinterInitApproval,
      };
      previousLeaderApproval[splinter.id] = splinterInitApproval;

      // Sostituisci il dirigente scissionista e riassesta parzialmente la segreteria rimasta
      const pool = REPLACEMENT_CANDIDATES[rebelExec.role] ?? REPLACEMENT_CANDIDATES.vice_segretario;
      const replacement = pool.find((c) => c.name !== rebelExec.name) ?? pool[0];
      updatedExecs = updatedExecs.map((e) =>
        e.id === rebelExec.id
          ? {
              ...e,
              name: replacement.name,
              faction: replacement.faction,
              specialization: replacement.specialization,
              competence: replacement.competence,
              loyalty: replacement.loyalty,
              ambition: replacement.ambition,
              trait: replacement.trait,
              lowLoyaltyWeeks: 0,
            }
          : {
              ...e,
              loyalty: clamp(e.loyalty + 8, 25, 100),
              lowLoyaltyWeeks: 0,
            }
      );

      const seatNotice =
        defectedCamera + defectedSenato > 0
          ? `, ${defectedCamera} dep. e ${defectedSenato} sen.`
          : '';
      const finalSplinter = updatedParties.find((p) => p.id === splinter.id) ?? splinter;

      notifications.push(
        `SCISSIONE INTERNA! ${rebelExec.name} (${rebelExec.faction}) fonda "${finalSplinter.name}" (${finalSplinter.acronym}): sottratti -${actualLostPoll.toFixed(1)}% consenso, ~${defectingMembers.toLocaleString('it-IT')} iscritti, -€${schismLoss.toLocaleString('it-IT')}${seatNotice}.`
      );
      newMedia.push({
        id: uid('med'),
        week: nextWeek,
        dateLabel: dateInfo.shortLabel,
        type: 'stampa',
        source: 'Il Corriere Nazionale',
        headline: `SCISSIONE IN ${playerBeforeSchism.acronym}! ${rebelExec.name} fonda ${finalSplinter.name} (${finalSplinter.acronym})`,
        excerpt: `Dopo settimane di coesione critica, l’ala "${rebelExec.faction}" lascia ${playerBeforeSchism.name} portando via ${finalSplinter.nationalPoll.toFixed(1)}% nei sondaggi${
          defectedCamera + defectedSenato > 0
            ? ` e ${defectedCamera + defectedSenato} parlamentari`
            : ''
        }.`,
        sentiment: 'negativo',
        partyColor: finalSplinter.color,
      });
      newMedia.push({
        id: uid('med'),
        week: nextWeek,
        dateLabel: dateInfo.shortLabel,
        type: 'rivale',
        source: `${finalSplinter.name} (${finalSplinter.acronym})`,
        handle: `@${finalSplinter.acronym.toLowerCase()}_italia`,
        headline: `${rebelExec.name}: «Con ${finalSplinter.name} diamo casa a chi non si riconosce più in ${playerBeforeSchism.leaderName}»`,
        excerpt: finalSplinter.description,
        sentiment: 'negativo',
        engagement: '34.8k interazioni',
        partyColor: finalSplinter.color,
      });
    } else if (rebelExec) {
      notifications.push(
        `Allarme coesione interna (${partyCohesionNow}% · settimana ${nextLowCohesionStreak}/${SCHISM_REQUIRED_WEEKS}): ${rebelExec.name} (${rebelExec.faction}) minaccia una scissione!`
      );
      if (nextLowCohesionStreak === SCHISM_REQUIRED_WEEKS - 1) {
        newMedia.push({
          id: uid('med'),
          week: nextWeek,
          dateLabel: dateInfo.shortLabel,
          type: 'stampa',
          source: 'Cronaca di Palazzo',
          headline: `Alta tensione in ${playerBeforeSchism.name}: l’ala "${rebelExec.faction}" pronta allo strappo`,
          excerpt: `Coesione della segreteria ferma al ${partyCohesionNow}% da ${nextLowCohesionStreak} settimane consecutive. ${rebelExec.name} prepara il simbolo scissionista se non arriverà un chiarimento.`,
          sentiment: 'negativo',
          partyColor: playerBeforeSchism.color,
        });
      }
    }
  } else {
    nextLowCohesionStreak = 0;
  }

  let updatedCommittee = { ...state.committee };
  let nextWeeklyOverhead = state.weeklyOverhead;
  let committeeCompletedThisWeek = false;
  if (updatedCommittee.active) {
    updatedCommittee.weeksRemaining = Math.max(0, updatedCommittee.weeksRemaining - 1);
    if (
      updatedCommittee.signatures >= updatedCommittee.targetSignatures &&
      updatedCommittee.committeesOpened >= updatedCommittee.targetCommittees
    ) {
      updatedCommittee.active = false;
      updatedCommittee.completed = true;
      committeeCompletedThisWeek = true;
      nextWeeklyOverhead = Math.max(state.weeklyOverhead, 2400);
      updatedParties = applyElectoralShift(updatedParties, state.playerPartyId, {
        giovani: 0.65,
        lavoratori: 0.55,
        imprese: 0.45,
        pensionati: 0.4,
      });
      nextBudget += 35000;
      notifications.push(
        'Comitato Promotore completato! Partito iscritto al Registro Nazionale: +0,5% consenso, +€35.000 e accesso al 2×1000 IRPEF!'
      );
      newMedia.push({
        id: uid('med'),
        week: nextWeek,
        dateLabel: dateInfo.shortLabel,
        type: 'stampa',
        source: 'La Tribuna Politica',
        headline: `Obiettivo centrato: ${playerNow.name} deposita simbolo e statuto nazionale`,
        excerpt: 'Superata la soglia delle 30.000 firme: il movimento accede al Registro Nazionale e al 2×1000.',
        sentiment: 'positivo',
        partyColor: playerNow.color,
      });
    } else if (updatedCommittee.weeksRemaining === 0) {
      updatedCommittee.active = false;
      updatedCommittee.completed = false;
      nextWeeklyOverhead = Math.max(state.weeklyOverhead, 2000);
      notifications.push(
        'Scadute le 4 settimane del Comitato Promotore: avvio comunque in salita con risorse ridotte.'
      );
    }
  }

  // Guardrail Stabilità AI: in settimane ordinarie i partiti AI oscillano entro ±0,3% (±0,2% sotto il 3,5%),
  // salvo shock eccezionali (scandali AI, scissioni, crisi di governo o elezioni).
  if (!schismTriggeredThisWeek && nextWeek < state.electionWeek) {
    let clampedAnyAi = false;
    const adjusted = updatedParties.map((p) => {
      if (p.id === state.playerPartyId || p.id === 'altri' || aiShockedPartyIds.has(p.id)) {
        return p;
      }
      const maxSwing = p.previousPoll < 3.5 ? 0.2 : 0.3;
      const diff = round1(p.nationalPoll - p.previousPoll);
      if (Math.abs(diff) <= maxSwing) return p;

      clampedAnyAi = true;
      const targetPoll = round1(
        clamp(p.nationalPoll, Math.max(0, p.previousPoll - maxSwing), p.previousPoll + maxSwing)
      );
      const rawScale = p.nationalPoll > 0.05 ? targetPoll / p.nationalPoll : 1;
      const scale = Number.isFinite(rawScale) && rawScale >= 0 ? rawScale : 1;
      const nextDemos = { ...p.demographics };
      for (const d of DEMOGRAPHICS) {
        const prevD = Number.isFinite(p.demographics[d.id]) ? p.demographics[d.id] : 0;
        nextDemos[d.id] = Math.max(0, prevD * scale);
      }
      const nextRegs = { ...p.regionPolls };
      for (const r of ITALIAN_REGIONS) {
        const prevR = Number.isFinite(p.regionPolls[r.id]) ? p.regionPolls[r.id] : 0;
        nextRegs[r.id] = Math.max(0, prevR * scale);
      }
      return {
        ...p,
        demographics: nextDemos,
        regionPolls: nextRegs,
        nationalPoll: targetPoll,
      };
    });
    if (clampedAnyAi) {
      updatedParties = normalizeAllPolls(adjusted);
    }
  }

  // Guardrail ferreo Weekly Cap Giocatore (valido anche sui salvataggi caricati): zero arrotondamenti in eccesso
  if (!schismTriggeredThisWeek && !committeeCompletedThisWeek && nextWeek < state.electionWeek) {
    const hardCap = getWeeklyMaxPollGrowthCap(playerWeekStartPoll);
    const maxAllowed = Math.floor((playerWeekStartPoll + hardCap) * 10 + 1e-6) / 10;
    for (let pass = 0; pass < 2; pass += 1) {
      const playerEndWeek = updatedParties.find((p) => p.id === state.playerPartyId);
      if (!playerEndWeek || playerEndWeek.nationalPoll <= maxAllowed + 1e-6) break;
      const safetyScale = pass === 0 ? 1 : 0.99;
      const scale =
        playerEndWeek.nationalPoll > 0.05
          ? (maxAllowed / playerEndWeek.nationalPoll) * safetyScale
          : 1;
      updatedParties = normalizeAllPolls(
        updatedParties.map((p) => {
          if (p.id !== state.playerPartyId) return p;
          const nextDemos = { ...p.demographics };
          for (const d of DEMOGRAPHICS) {
            nextDemos[d.id] = Math.max(0, p.demographics[d.id] * scale);
          }
          const nextRegs = { ...p.regionPolls };
          for (const r of ITALIAN_REGIONS) {
            nextRegs[r.id] = Math.max(0, p.regionPolls[r.id] * scale);
          }
          return {
            ...p,
            demographics: nextDemos,
            regionPolls: nextRegs,
            nationalPoll: maxAllowed,
          };
        })
      );
    }
  }

  const snapPolls: Record<string, number> = {};
  for (const p of updatedParties) snapPolls[p.id] = p.nationalPoll;
  const basePollHistory = spawnedSplinterId
    ? state.pollHistory.map((h) => ({
        ...h,
        polls: { ...h.polls, [spawnedSplinterId!]: 0 },
      }))
    : state.pollHistory;
  const pollHistory: PollSnapshot[] = [
    ...basePollHistory,
    {
      weekIndex: nextWeek,
      label: dateInfo.shortLabel,
      polls: snapPolls,
    },
  ].slice(-20);

  const isCampaign =
    nextRegimeStatus !== 'regime_autoritario' && state.electionWeek - nextWeek <= 8;
  const seatStatusNow = getPlayerParliamentSeats({
    ...state,
    parties: updatedParties,
    legislatureSeats: nextLegislatureSeats,
  });
  const isExtraParliamentaryNow = Boolean(
    state.extraParliamentary || seatStatusNow.isExtraParliamentary
  );
  const isInGovNow = !isExtraParliamentaryNow && state.governmentRole !== 'opposizione';
  const highTensionNow =
    nextIndicators.spread >= 180 ||
    nextIndicators.socialStability < 50 ||
    nextIndicators.euRelations < 45;
  const playerForCrises = updatedParties.find((p) => p.id === state.playerPartyId);

  const nextWeeklyCrises = pickWeeklyCrises(nextWeek, state.crisisCooldowns, {
    isInGovernment: isInGovNow,
    isExtraParliamentary: isExtraParliamentaryNow,
    isCommitteeActive: updatedCommittee.active,
    isCampaign,
    highTension: highTensionNow,
    orientation: playerForCrises?.orientation,
    leaderStyle: state.leader.style,
    leaderTraits: state.leader.traits,
  });
  const nextCrisis = nextWeeklyCrises[0];
  const nextCrisisCooldowns = { ...state.crisisCooldowns };
  for (const c of nextWeeklyCrises) {
    nextCrisisCooldowns[c.event.id] = nextWeek;
  }
  const usedCrisisIds = [
    ...state.usedCrisisIds,
    ...nextWeeklyCrises.map((c) => c.event.id),
  ].slice(-60);

  const latestPlayer = updatedParties.find((p) => p.id === state.playerPartyId)!;
  const delta = round1(latestPlayer.nationalPoll - latestPlayer.previousPoll);
  newMedia.push({
    id: uid('med'),
    week: nextWeek,
    dateLabel: dateInfo.shortLabel,
    type: 'stampa',
    source: NEWSPAPERS[nextWeek % NEWSPAPERS.length],
    headline: `Sondaggio settimanale: ${latestPlayer.acronym} al ${latestPlayer.nationalPoll.toFixed(1)}% (${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%)`,
    excerpt: `In apertura di ${dateInfo.fullLabel} (${nextWeeklyCrises.length} dossier sul tavolo): ${nextCrisis.event.title}.`,
    sentiment: delta > 0 ? 'positivo' : delta < 0 ? 'negativo' : 'neutro',
    partyColor: latestPlayer.color,
  });

  // Aggiorna tenuta della maggioranza e soddisfazione alleati se il giocatore è Presidente del Consiglio
  let nextAllySatisfaction: Record<string, number> = { ...aiAllySatisfaction };
  if (state.isPrimeMinister && Object.keys(state.governmentMinistries).length > 0) {
    const liveSeats = nextLegislatureSeats;
    const cencelliNow = evaluateCencelliSatisfaction(
      updatedParties,
      state.playerPartyId,
      liveSeats,
      state.governmentMinistries
    );
    const pollDrop = latestPlayer.nationalPoll < latestPlayer.previousPoll;
    const spreadTension = nextIndicators.spread >= 200;

    for (const rep of cencelliNow.allyReports) {
      const currentVal = aiAllySatisfaction[rep.partyId] ?? rep.satisfaction;
      // Gradual drift toward Cencelli equilibrium + political wear
      const cencelliPull = rep.satisfaction > currentVal ? 1 : rep.satisfaction < currentVal ? -2 : 0;
      const wear = (pollDrop ? -2 : 0) + (spreadTension ? -2 : 0) + (rep.assignedWeight === 0 ? -3 : -1);
      const nextVal = Math.round(clamp(currentVal + cencelliPull + wear, 8, 100));
      nextAllySatisfaction[rep.partyId] = nextVal;

      if (nextVal < 35 && currentVal >= 35) {
        notifications.push(
          `Crisi di fiducia con ${rep.partyAcronym} (${nextVal}%): valuta un Rimpasto in Parlamento & Governo!`
        );
      }
    }
  }

  // Aggiornamento settimanale gradimento leader legato a scissioni, trend sondaggi e lieve oscillazione
  if (schismTriggeredThisWeek) {
    nextLeaderApproval = adjustLeaderApproval(nextLeaderApproval, state.playerPartyId, -6);
  }
  for (const p of updatedParties) {
    if (p.id === 'altri') continue;
    const pollDiff = p.nationalPoll - p.previousPoll;
    const trendShift = pollDiff >= 0.4 ? 1 : pollDiff <= -0.4 ? -1 : 0;
    const microNoise = p.id === state.playerPartyId ? 0 : Math.floor(Math.random() * 3) - 1;
    if (trendShift + microNoise !== 0) {
      nextLeaderApproval = adjustLeaderApproval(nextLeaderApproval, p.id, trendShift + microNoise);
    }
  }

  // Aggiornamento settimanale Raccolta Firme Liste Elettorali (partiti extra-parlamentari / nuovi)
  let nextBallotSignatures = syncBallotSignatureExemption({
    ...state,
    parties: updatedParties,
    legislatureSeats: nextLegislatureSeats,
    executives: updatedExecs,
    committee: updatedCommittee,
  });
  nextBallotSignatures = {
    ...nextBallotSignatures,
    deadlineWeek: Math.max(nextWeek, state.electionWeek - 1),
    banchettiThisWeek: 0,
  };
  if (!nextBallotSignatures.exempt && !nextBallotSignatures.excludedFromBallot) {
    const weeklySigGain = calculateWeeklySignatureGain({
      ...state,
      parties: updatedParties,
      executives: updatedExecs,
      committee: updatedCommittee,
      regionalChapters: nextChapters,
    });
    const prevSigs = nextBallotSignatures.collectedSignatures;
    const nextSigs = Math.min(nextBallotSignatures.targetSignatures, prevSigs + weeklySigGain);
    nextBallotSignatures.collectedSignatures = nextSigs;

    if (
      prevSigs < nextBallotSignatures.targetSignatures &&
      nextSigs >= nextBallotSignatures.targetSignatures
    ) {
      notifications.push(
        `Liste elettorali depositate! Raggiunte tutte le ${nextBallotSignatures.targetSignatures.toLocaleString('it-IT')} firme richieste per correre alle urne.`
      );
      newMedia.push({
        id: uid('med'),
        week: nextWeek,
        dateLabel: dateInfo.shortLabel,
        type: 'stampa',
        source: 'Gazzetta Elettorale',
        headline: `${latestPlayer.name} completa la raccolta firme: lista ammessa ufficialmente al voto!`,
        excerpt: `Superata quota ${nextBallotSignatures.targetSignatures.toLocaleString('it-IT')} sottoscrizioni certificate presso le Corti d’Appello.`,
        sentiment: 'positivo',
        partyColor: latestPlayer.color,
      });
    } else if (
      nextRegimeStatus !== 'regime_autoritario' &&
      nextWeek >= state.electionWeek - 1 &&
      nextSigs < nextBallotSignatures.targetSignatures
    ) {
      nextBallotSignatures.excludedFromBallot = true;
      notifications.push(
        `CHIUSURA LISTE: raccolte solo ${nextSigs.toLocaleString('it-IT')}/${nextBallotSignatures.targetSignatures.toLocaleString('it-IT')} firme — ${latestPlayer.name} escluso dalle schede di questa tornata!`
      );
      newMedia.push({
        id: uid('med'),
        week: nextWeek,
        dateLabel: dateInfo.shortLabel,
        type: 'stampa',
        source: 'Il Corriere Nazionale',
        headline: `ESCLUSIONE DALLE SCHEDE: ${latestPlayer.name} non raggiunge le firme entro la chiusura liste`,
        excerpt: `Fermato a ${nextSigs.toLocaleString('it-IT')} firme su ${nextBallotSignatures.targetSignatures.toLocaleString('it-IT')} senza apparentamento parlamentare: il partito resta fuori dalla competizione elettorale.`,
        sentiment: 'negativo',
        partyColor: '#F43F5E',
      });
    }
  }

  // Aggiornamento settimanale Referendum Abrogativi (Art. 75 Cost.) e Costituzionali (Art. 138 Cost.)
  let nextActiveReferendum: ActiveReferendum | null = state.activeReferendum
    ? { ...state.activeReferendum, banchettiThisWeek: 0 }
    : null;
  let nextReferendumHistory: ActiveReferendum[] = [...(state.referendumHistory ?? [])];
  let nextEnactedLawIds = [...state.enactedLawIds];
  let nextInstitutionalFlags: InstitutionalFlags = { ...state.institutionalFlags };
  let nextElectoralLaw = state.electoralLaw;
  let nextPendingConstRefs = [...(state.pendingConstitutionalReferendumLawIds ?? [])];

  if (nextActiveReferendum && nextActiveReferendum.phase === 'raccolta_firme') {
    const refGain = calculateWeeklyReferendumSignatureGain(
      {
        ...state,
        parties: updatedParties,
        openHeadquarters: state.openHeadquarters,
        regionalChapters: nextChapters,
      },
      nextActiveReferendum
    );
    const updatedSigs = Math.min(
      nextActiveReferendum.targetSignatures,
      nextActiveReferendum.signatures + refGain
    );
    nextActiveReferendum = {
      ...nextActiveReferendum,
      signatures: updatedSigs,
    };

    if (updatedSigs >= nextActiveReferendum.targetSignatures) {
      const voteWeek = nextWeek + 4;
      nextActiveReferendum = {
        ...nextActiveReferendum,
        phase: 'campagna',
        voteWeek,
      };
      notifications.push(
        `Corte di Cassazione valida le 500.000 firme: "${nextActiveReferendum.shortTitle}" ammesso al voto tra 4 settimane!`
      );
      newMedia.push({
        id: uid('med'),
        week: nextWeek,
        dateLabel: dateInfo.shortLabel,
        type: 'stampa',
        source: 'Gazzetta Costituzionale',
        headline: `REFERENDUM AMMESSO: raggiunte 500.000 firme per "${nextActiveReferendum.title}"`,
        excerpt: `Via libera della Cassazione: si vota nella Settimana ${voteWeek}. Per la validità dell’abrogativo (Art. 75 Cost.) servirà il quorum del 50% + 1.`,
        sentiment: 'positivo',
        partyColor: latestPlayer.color,
      });
    } else if (nextWeek > nextActiveReferendum.signatureDeadlineWeek) {
      const failedRef: ActiveReferendum = {
        ...nextActiveReferendum,
        phase: 'concluso',
        result: {
          turnout: 0,
          quorumReached: false,
          yesPct: 0,
          noPct: 0,
          approved: false,
          playerWon: false,
          headline: `Raccolta firme fallita per "${nextActiveReferendum.shortTitle}" (${updatedSigs.toLocaleString('it-IT')}/500.000)`,
          narrative: `Scaduto il termine costituzionale senza raggiungere le 500.000 sottoscrizioni richieste dall’Art. 75 Cost.: il quesito decade prima del voto.`,
          pollDelta: nextActiveReferendum.promotedByPlayer ? -0.3 : 0,
        },
      };
      if (nextActiveReferendum.promotedByPlayer) {
        updatedParties = applyElectoralShift(updatedParties, state.playerPartyId, {
          giovani: -0.3,
          lavoratori: -0.2,
        });
      }
      nextActiveReferendum = failedRef;
      nextReferendumHistory = [failedRef, ...nextReferendumHistory].slice(0, 12);
      notifications.push(failedRef.result!.headline);
      newMedia.push({
        id: uid('med'),
        week: nextWeek,
        dateLabel: dateInfo.shortLabel,
        type: 'stampa',
        source: 'Cronaca di Palazzo',
        headline: failedRef.result!.headline,
        excerpt: failedRef.result!.narrative,
        sentiment: 'negativo',
        partyColor: '#F43F5E',
      });
    }
  } else if (
    nextActiveReferendum &&
    nextActiveReferendum.phase === 'campagna' &&
    nextWeek >= nextActiveReferendum.voteWeek
  ) {
    const resolved = resolveReferendumVote(
      {
        ...state,
        parties: updatedParties,
        stateIndicators: nextIndicators,
        enactedLawIds: nextEnactedLawIds,
        institutionalFlags: nextInstitutionalFlags,
        electoralLaw: nextElectoralLaw,
      },
      nextActiveReferendum
    );
    updatedParties = resolved.parties;
    nextIndicators = resolved.stateIndicators;
    nextEnactedLawIds = resolved.enactedLawIds;
    nextInstitutionalFlags = resolved.institutionalFlags;
    nextElectoralLaw = resolved.electoralLaw;
    nextLeaderApproval = adjustLeaderApproval(
      nextLeaderApproval,
      state.playerPartyId,
      resolved.leaderApprovalDelta
    );
    nextActiveReferendum = resolved.concludedReferendum;
    nextReferendumHistory = [resolved.concludedReferendum, ...nextReferendumHistory].slice(0, 12);
    if (resolved.concludedReferendum.lawTargetId) {
      nextPendingConstRefs = nextPendingConstRefs.filter(
        (id) => id !== resolved.concludedReferendum.lawTargetId
      );
    }
    notifications.push(resolved.concludedReferendum.result!.headline);
    newMedia.push({
      id: uid('med'),
      week: nextWeek,
      dateLabel: dateInfo.shortLabel,
      type: 'stampa',
      source: 'Speciale Referendum · Viminale',
      headline: resolved.concludedReferendum.result!.headline,
      excerpt: resolved.concludedReferendum.result!.narrative,
      sentiment: resolved.concludedReferendum.result!.playerWon ? 'positivo' : 'negativo',
      partyColor: resolved.concludedReferendum.result!.playerWon ? '#10B981' : '#F43F5E',
    });
  }

  let nextLawVoteHistory = [...state.lawVoteHistory];

  // Progressione Disegni di Legge (DDL) ordinari in iter parlamentare
  const nextPendingBills: PendingBill[] = [];
  for (const bill of state.pendingBills ?? []) {
    const law = PARLIAMENT_LAWS.find((l) => l.id === bill.lawId);
    if (!law) continue;

    // Possibile ostruzionismo / emendamenti ostili dell'opposizione in fase Camera (solo se non ancora bloccato)
    const oppStrength = updatedParties
      .filter(
        (p) =>
          p.id !== state.playerPartyId &&
          p.id !== 'altri' &&
          (!latestPlayer.coalitionId || p.coalitionId !== latestPlayer.coalitionId)
      )
      .reduce((acc, p) => acc + p.nationalPoll, 0);

    if (
      !bill.blockedByAmendments &&
      bill.weeksRemaining === 2 &&
      Math.random() < (oppStrength >= 45 ? 0.55 : 0.32)
    ) {
      const amendCount = 35 + Math.floor(Math.random() * 95);
      nextPendingBills.push({
        ...bill,
        stage: 'camera',
        blockedByAmendments: true,
        hostileAmendmentsCount: amendCount,
        weeksRemaining: 2, // Ostruzionismo aggiunge +1 settimana se non si pone la fiducia
      });
      notifications.push(
        `Ostruzionismo sul DDL "${bill.title}": ${amendCount} emendamenti ostili rallentano l’Aula. Attendi o poni la Questione di Fiducia!`
      );
      newMedia.push({
        id: uid('med'),
        week: nextWeek,
        dateLabel: dateInfo.shortLabel,
        type: 'stampa',
        source: 'Montecitorio · Ostruzionismo',
        headline: `EMENDAMENTI OSTILI SUL DDL "${bill.title}": opposizione rallenta il voto (${amendCount} emendamenti)`,
        excerpt: `L’iter ordinario subisce un rallentamento in Aula. Il Governo può attendere lo smaltimento senza logorare gli alleati oppure blindare il testo con la Questione di Fiducia.`,
        sentiment: 'neutro',
        partyColor: '#F59E0B',
      });
      continue;
    }

    const rem = Math.max(0, bill.weeksRemaining - 1);
    if (rem <= 0) {
      // Voto finale conclusivo del DDL ordinario (senza logoramento coalizione)
      const billForecast = forecastLawVote(
        {
          ...state,
          parties: updatedParties,
          electoralLaw: nextElectoralLaw,
          institutionalFlags: nextInstitutionalFlags,
          stateIndicators: nextIndicators,
        },
        law
      );
      const camYes = clamp(billForecast.cameraYes + Math.floor(Math.random() * 7) - 3, 0, 400);
      const senYes = clamp(billForecast.senatoYes + Math.floor(Math.random() * 5) - 2, 0, 200);
      const passed =
        camYes >= billForecast.requiredCamera && senYes >= billForecast.requiredSenato;

      if (passed) {
        updatedParties = applyElectoralShift(
          updatedParties,
          state.playerPartyId,
          law.demoEffects,
          law.regionEffects
        );
        const pNow = updatedParties.find((p) => p.id === state.playerPartyId)!;
        const shiftedAxis = applyAxisShift(pNow.axis, law.axisShift);
        updatedParties = updatedParties.map((p) =>
          p.id === state.playerPartyId ? { ...p, axis: shiftedAxis } : p
        );
        if (law.grantsFlag) {
          nextInstitutionalFlags[law.grantsFlag] = true;
        }
        if (law.electoralLawChange) {
          nextElectoralLaw = law.electoralLawChange;
        }
        if (!nextEnactedLawIds.includes(law.id)) {
          nextEnactedLawIds = [...nextEnactedLawIds, law.id];
        }
        nextIndicators = applyStateEffects(nextIndicators, {
          ...law.stateEffects,
          democraticHealth: (law.stateEffects.democraticHealth ?? 0) + 1,
        });
        const record: LawVoteRecord = {
          id: uid('vote'),
          lawId: law.id,
          title: `DDL Ordinario: ${law.title}`,
          week: nextWeek,
          dateLabel: dateInfo.shortLabel,
          cameraYes: camYes,
          cameraNo: 400 - camYes,
          senatoYes: senYes,
          senatoNo: 200 - senYes,
          outcome: 'approvata',
          instrument: 'ddl',
          confidenceUsed: false,
          summary: `Iter ordinario concluso con successo (${camYes} Camera / ${senYes} Senato): legge promulgata senza logoramento di maggioranza.`,
        };
        nextLawVoteHistory = [record, ...nextLawVoteHistory].slice(0, 24);
        notifications.push(`DDL approvato definitivamente: "${law.title}" è legge dello Stato!`);
        newMedia.push({
          id: uid('med'),
          week: nextWeek,
          dateLabel: dateInfo.shortLabel,
          type: 'stampa',
          source: 'Gazzetta Ufficiale · Parlamento',
          headline: law.enactedHeadline,
          excerpt: record.summary,
          sentiment: 'positivo',
          partyColor: latestPlayer.color,
        });
      } else {
        const record: LawVoteRecord = {
          id: uid('vote'),
          lawId: law.id,
          title: `DDL Ordinario: ${law.title}`,
          week: nextWeek,
          dateLabel: dateInfo.shortLabel,
          cameraYes: camYes,
          cameraNo: 400 - camYes,
          senatoYes: senYes,
          senatoNo: 200 - senYes,
          outcome: 'respinta',
          instrument: 'ddl',
          confidenceUsed: false,
          summary: `DDL respinto al voto finale (${camYes} Camera / ${senYes} Senato) senza caduta del Governo.`,
        };
        nextLawVoteHistory = [record, ...nextLawVoteHistory].slice(0, 24);
        notifications.push(`DDL "${law.title}" respinto al voto finale in Parlamento.`);
        newMedia.push({
          id: uid('med'),
          week: nextWeek,
          dateLabel: dateInfo.shortLabel,
          type: 'stampa',
          source: 'Cronaca di Palazzo',
          headline: `STOP IN AULA: respinto il DDL "${law.title}" (${camYes} Sì alla Camera)`,
          excerpt: record.summary,
          sentiment: 'negativo',
          partyColor: '#F43F5E',
        });
      }
    } else {
      nextPendingBills.push({
        ...bill,
        weeksRemaining: rem,
        stage: rem >= 3 ? 'commissione' : rem === 2 ? 'camera' : 'senato',
        blockedByAmendments: rem === 1 ? false : bill.blockedByAmendments,
      });
    }
  }

  // Progressione Decreti-Legge (Art. 77 Cost. — finestra 60 giorni / 8 settimane)
  const nextActiveDecrees: ActiveDecreeLaw[] = [];
  for (const dec of state.activeDecreeLaws ?? []) {
    if (dec.status !== 'in_conversione') {
      nextActiveDecrees.push(dec);
      continue;
    }
    const rem = Math.max(0, dec.weeksRemaining - 1);
    if (rem <= 0) {
      // Decadenza automatica del Decreto-Legge non convertito entro 60 giorni
      nextEnactedLawIds = nextEnactedLawIds.filter((id) => id !== dec.lawId);
      if (dec.previousElectoralLaw) {
        nextElectoralLaw = dec.previousElectoralLaw;
      }
      if (dec.grantedFlag) {
        nextInstitutionalFlags[dec.grantedFlag] = false;
      }
      updatedParties = applyElectoralShift(updatedParties, state.playerPartyId, {
        giovani: -0.5,
        lavoratori: -0.6,
        imprese: -0.6,
        pensionati: -0.5,
      });
      nextLeaderApproval = adjustLeaderApproval(nextLeaderApproval, state.playerPartyId, -4);
      nextActiveDecrees.push({ ...dec, weeksRemaining: 0, status: 'decaduto' });
      notifications.push(
        `DECADENZA DL: "${dec.title}" non convertito entro 60 giorni — effetti annullati e calo di credibilità.`
      );
      newMedia.push({
        id: uid('med'),
        week: nextWeek,
        dateLabel: dateInfo.shortLabel,
        type: 'stampa',
        source: 'Gazzetta Ufficiale · Montecitorio',
        headline: `DECRETO-LEGGE DECADUTO: scaduti i 60 giorni per "${dec.title}"`,
        excerpt: `Il Parlamento non ha convertito il decreto in legge entro i termini costituzionali (Art. 77 Cost.): la norma decade con effetto retroattivo.`,
        sentiment: 'negativo',
        partyColor: '#F43F5E',
      });
    } else {
      nextActiveDecrees.push({ ...dec, weeksRemaining: rem });
      if (rem === 2) {
        notifications.push(
          `Urgenza Parlamento: il DL "${dec.title}" decade tra 2 settimane (15 giorni). Convertilo in Aula!`
        );
      }
    }
  }

  // Progressione Commissioni Parlamentari d'Inchiesta
  const nextActiveCommissions: InquiryCommission[] = [];
  let nextCommissionHistory: InquiryCommission[] = [...(state.commissionHistory ?? [])];
  for (const comm of state.activeCommissions ?? []) {
    if (comm.status !== 'attiva') continue;
    const rem = Math.max(0, comm.weeksRemaining - 1);
    if (rem <= 0) {
      const topic = INQUIRY_COMMISSION_TOPICS.find((t) => t.id === comm.topicId);
      const isPlayerGov = state.isPrimeMinister || state.governmentRole !== 'opposizione';
      const playerGain = comm.promotedByPlayer ? (isPlayerGov ? 0.4 : 0.7) : -0.5;
      updatedParties = applyElectoralShift(updatedParties, state.playerPartyId, {
        giovani: playerGain,
        lavoratori: playerGain,
        imprese: playerGain * 0.7,
        pensionati: playerGain * 0.8,
      });
      nextLeaderApproval = adjustLeaderApproval(
        nextLeaderApproval,
        state.playerPartyId,
        playerGain > 0 ? 2 : -3
      );
      if (!comm.promotedByPlayer) {
        nextIndicators = applyStateEffects(nextIndicators, { socialStability: -3 });
      }
      const reportHeadline = comm.promotedByPlayer
        ? topic?.reportHeadline ?? `Relazione finale Commissione "${comm.title}": bufera in Aula`
        : `Rapporto Commissione d’Inchiesta (${comm.sponsorPartyName ?? 'Opposizione'}): duro atto d’accusa contro l’Esecutivo`;
      const reportSummary = comm.promotedByPlayer
        ? topic?.reportSummary ??
          `La Commissione Parlamentare conclude i lavori dopo ${comm.durationWeeks} settimane di audizioni, accendendo lo scontro mediatico nazionale.`
        : `La Commissione istituita dall’opposizione deposita un rapporto critico su ${comm.targetArea}: forte pressione mediatica e calo di consenso per la maggioranza.`;
      const concluded: InquiryCommission = {
        ...comm,
        weeksRemaining: 0,
        status: 'conclusa',
        reportHeadline,
        reportSummary,
        pollImpact: round1(playerGain),
      };
      nextCommissionHistory = [concluded, ...nextCommissionHistory].slice(0, 12);
      notifications.push(`Commissione d’Inchiesta conclusa: ${reportHeadline}`);
      newMedia.push({
        id: uid('med'),
        week: nextWeek,
        dateLabel: dateInfo.shortLabel,
        type: 'stampa',
        source: comm.promotedByPlayer
          ? 'Commissione Bicamerale · Senato'
          : `Commissione d’Inchiesta · ${comm.sponsorPartyName ?? 'Opposizione'}`,
        headline: reportHeadline,
        excerpt: reportSummary,
        sentiment: playerGain >= 0 ? 'positivo' : 'negativo',
        partyColor: playerGain >= 0 ? '#10B981' : '#F43F5E',
      });
    } else {
      nextActiveCommissions.push({ ...comm, weeksRemaining: rem });
    }
  }

  // Eventuale iniziativa di Commissione d'Inchiesta da parte dell'Opposizione quando il giocatore è al Governo
  const isPlayerGovNow =
    !state.extraParliamentary && (state.isPrimeMinister || state.governmentRole !== 'opposizione');
  if (
    isPlayerGovNow &&
    nextRegimeStatus !== 'regime_autoritario' &&
    nextActiveCommissions.length < 2 &&
    !nextActiveCommissions.some((c) => !c.promotedByPlayer) &&
    nextWeek >= 5
  ) {
    const oppositionParties = updatedParties
      .filter(
        (p) =>
          p.id !== state.playerPartyId &&
          p.id !== 'altri' &&
          p.nationalPoll >= 3.0 &&
          (!latestPlayer.coalitionId || p.coalitionId !== latestPlayer.coalitionId)
      )
      .sort((a, b) => b.nationalPoll - a.nationalPoll);
    const triggerChance = state.activeScandal
      ? 0.42
      : nextIndicators.spread >= 200 || nextIndicators.socialStability < 55
        ? 0.22
        : 0.09;
    if (oppositionParties.length > 0 && Math.random() < triggerChance) {
      const topOpp = oppositionParties[0];
      const preferredTopicId = state.activeScandal
        ? 'comm_scandali_appalti'
        : nextIndicators.spread >= 200
          ? 'comm_pnrr_opere'
          : 'comm_conflitto_interessi';
      const candidateTopic =
        INQUIRY_COMMISSION_TOPICS.find(
          (t) => t.id === preferredTopicId && !nextActiveCommissions.some((c) => c.topicId === t.id)
        ) ??
        INQUIRY_COMMISSION_TOPICS.find(
          (t) => !nextActiveCommissions.some((c) => c.topicId === t.id)
        );
      if (candidateTopic) {
        const oppComm: InquiryCommission = {
          id: uid('comm_opp'),
          topicId: candidateTopic.id,
          title: candidateTopic.title,
          targetArea: candidateTopic.targetArea,
          startedAtWeek: nextWeek,
          durationWeeks: candidateTopic.durationWeeks,
          weeksRemaining: candidateTopic.durationWeeks,
          promotedByPlayer: false,
          sponsorPartyName: topOpp.acronym,
          mediaPressure: state.activeScandal ? 85 : 68,
          status: 'attiva',
        };
        nextActiveCommissions.push(oppComm);
        notifications.push(
          `L’opposizione (${topOpp.acronym}) istituisce una Commissione d’Inchiesta: "${candidateTopic.title}"!`
        );
        newMedia.push({
          id: uid('med'),
          week: nextWeek,
          dateLabel: dateInfo.shortLabel,
          type: 'rivale',
          source: `${topOpp.name} (${topOpp.acronym}) · Parlamento`,
          headline: `OPPOSIZIONE ALL’ATTACCO: ${topOpp.acronym} apre la ${candidateTopic.title}`,
          excerpt: `Audizioni parlamentari per ${candidateTopic.durationWeeks} settimane: il rapporto finale metterà sotto forte pressione mediatica la maggioranza.`,
          sentiment: 'negativo',
          partyColor: topOpp.color,
        });
      }
    }
  }

  // Eventuale scandalo/indagine giudiziaria mirata su un dirigente/ministro (cooldown 10 settimane)
  let nextActiveScandal: ExecutiveScandal | null = state.activeScandal ?? null;
  let nextLastScandalWeek = state.lastScandalWeek ?? 0;

  // Se uno scandalo attivo viene lasciato irrisolto, continua a logorare consenso e media ogni settimana
  if (nextActiveScandal) {
    updatedParties = applyElectoralShift(
      updatedParties,
      state.playerPartyId,
      { giovani: -0.25, lavoratori: -0.2, imprese: -0.15, pensionati: -0.2 },
      undefined,
      undefined,
      { bypassInertia: true }
    );
    nextLeaderApproval = adjustLeaderApproval(nextLeaderApproval, state.playerPartyId, -2);
    notifications.push(
      `Caso ${nextActiveScandal.execName} ancora irrisolto: la pressione mediatica erode consenso. Decidi nella scheda Partito!`
    );
  }

  const playerPollNow =
    updatedParties.find((p) => p.id === state.playerPartyId)?.nationalPoll ?? 0;
  if (
    !nextActiveScandal &&
    nextWeek >= 6 &&
    nextWeek - nextLastScandalWeek >= 10 &&
    playerPollNow >= 2.5 &&
    updatedExecs.length > 0 &&
    Math.random() < 0.2
  ) {
    nextActiveScandal = buildTargetedExecutiveScandal(
      nextWeek,
      updatedExecs,
      nextMinistryExecs
    );
    nextLastScandalWeek = nextWeek;
    notifications.push(
      `SCANDALO IN DIRIGENZA: avviso di garanzia per ${nextActiveScandal.execName}! Gestiscilo nella scheda Partito.`
    );
    newMedia.push({
      id: uid('med'),
      week: nextWeek,
      dateLabel: dateInfo.shortLabel,
      type: 'stampa',
      source: 'Cronaca Giudiziaria',
      headline: `${nextActiveScandal.title} (${nextActiveScandal.execName})`,
      excerpt: nextActiveScandal.summary,
      sentiment: 'negativo',
      partyColor: '#F43F5E',
    });
  }

  const finalRegimeStatus = deriveRegimeStatus(
    nextInstitutionalFlags,
    nextIndicators.democraticHealth
  );

  let nextState: GameState = {
    ...state,
    week: nextWeek,
    budget: nextBudget,
    weeklyOverhead: nextWeeklyOverhead,
    parties: updatedParties,
    legislatureSeats: nextLegislatureSeats,
    executives: updatedExecs,
    pollHistory,
    currentCrisis: nextCrisis,
    weeklyCrises: nextWeeklyCrises,
    crisisCooldowns: nextCrisisCooldowns,
    usedCrisisIds,
    mediaFeed: [...newMedia, ...aiMediaItems, ...state.mediaFeed].slice(0, 40),
    actionsTakenThisWeek: [],
    committee: updatedCommittee,
    schismOccurred,
    lowCohesionStreak: nextLowCohesionStreak,
    schismCount: nextSchismCount,
    stateIndicators: nextIndicators,
    enactedLawIds: nextEnactedLawIds,
    lawVoteHistory: nextLawVoteHistory.slice(0, 24),
    institutionalFlags: nextInstitutionalFlags,
    electoralLaw: nextElectoralLaw,
    regimeStatus: finalRegimeStatus,
    governmentMinistryExecutives: nextMinistryExecs,
    allySatisfaction: nextAllySatisfaction,
    leaderApproval: nextLeaderApproval,
    previousLeaderApproval,
    ballotSignatures: nextBallotSignatures,
    activeReferendum: nextActiveReferendum,
    referendumHistory: nextReferendumHistory,
    pendingConstitutionalReferendumLawIds: nextPendingConstRefs,
    pendingBills: nextPendingBills.slice(0, 8),
    activeDecreeLaws: [...nextActiveDecrees]
      .sort((a, b) => (a.status === 'in_conversione' ? 0 : 1) - (b.status === 'in_conversione' ? 0 : 1))
      .slice(0, 12),
    activeCommissions: nextActiveCommissions,
    commissionHistory: nextCommissionHistory,
    activeScandal: nextActiveScandal,
    lastScandalWeek: nextLastScandalWeek,
    regionalChapters: nextChapters,
    fundraising: nextFundraising,
    weekStartPlayerPoll:
      updatedParties.find((p) => p.id === state.playerPartyId)?.nationalPoll ??
      latestPlayer.nationalPoll,
    weeklyTerritorialActivity: false,
  };

  if (
    finalRegimeStatus !== 'regime_autoritario' &&
    nextWeek >= state.electionWeek &&
    !state.election
  ) {
    nextState = triggerElectionNight(nextState);
    notifications.push('Urne chiuse! Inizia la Notte Elettorale in diretta dalla War Room.');
  } else {
    // Scadenza Settennato Quirinale -> Convocazione Parlamento in Seduta Comune (658 Grandi Elettori)
    const isPlayerParl = !getPlayerParliamentSeats(nextState).isExtraParliamentary;
    const termEndWeek = state.quirinaleTermEndWeek ?? 36;
    if (
      finalRegimeStatus !== 'regime_autoritario' &&
      !nextState.quirinaleElection &&
      !nextState.election &&
      nextWeek >= termEndWeek
    ) {
      if (isPlayerParl) {
        nextState = startQuirinaleElection(nextState);
        notifications.push(
          `SCADENZA QUIRINALE: Parlamento convocato in Seduta Comune (658 Grandi Elettori) per eleggere il Presidente della Repubblica!`
        );
      } else {
        // Se il giocatore è extra-parlamentare, il Parlamento elegge comunque il Capo dello Stato per il nuovo settennato
        const bgWinner = DEFAULT_QUIRINALE_CANDIDATES[nextWeek % 3];
        const bgMedia: MediaItem = {
          id: uid('med'),
          week: nextWeek,
          dateLabel: dateInfo.shortLabel,
          type: 'stampa',
          source: 'Quirinale · Seduta Comune',
          headline: `NUOVO SETTENNATO: il Parlamento elegge ${bgWinner.name} Presidente della Repubblica`,
          excerpt: `Senza seggi in Aula il tuo partito non ha partecipato alla Seduta Comune. Il prossimo ciclo settennale scadrà tra 7 anni.`,
          sentiment: 'neutro',
          partyColor: '#F59E0B',
        };
        nextState = {
          ...nextState,
          currentPresidentName: bgWinner.name,
          quirinaleTermEndWeek: nextWeek + 336,
          mediaFeed: [bgMedia, ...nextState.mediaFeed].slice(0, 40),
        };
        notifications.push(
          `Quirinale: eletto ${bgWinner.name} per il nuovo settennato (non hai seggi in Seduta Comune).`
        );
      }
    }

    // Apri automaticamente la Legge di Bilancio se sei al Governo (ogni 24 settimane o a Novembre/Dicembre)
    const isInGovernment =
      isPlayerParl &&
      (state.isPrimeMinister || state.governmentRole !== 'opposizione');
    const isAutumnBudgetSeason =
      dateInfo.monthName === 'Novembre' || dateInfo.monthName === 'Dicembre';
    const weeksSinceBudget = nextWeek - state.lastBudgetWeek;
    const dueByCycle = state.lastBudgetWeek > 0 && weeksSinceBudget >= 24;
    const dueBySeason =
      isAutumnBudgetSeason &&
      (state.lastBudgetWeek === 0 ? nextWeek >= 5 : weeksSinceBudget >= 20);
    const dueInitialAfter24 = state.lastBudgetWeek === 0 && nextWeek >= 24;

    if (
      isInGovernment &&
      !nextState.election &&
      !nextState.quirinaleElection?.active &&
      (dueByCycle || dueBySeason || dueInitialAfter24)
    ) {
      nextState = {
        ...nextState,
        pendingBudgetLaw: true,
      };
      notifications.push(
        `Sessione di Bilancio (${dateInfo.monthName} ${dateInfo.year}): approva la Manovra Finanziaria annuale in Parlamento.`
      );
    }
  }

  return { nextState, notifications };
}

export interface TvDuelImpactPreview {
  verdict: 'vittoria_netta' | 'vittoria' | 'pareggio' | 'sconfitta' | 'sconfitta_netta';
  verdictLabel: string;
  playerApprovalDelta: number;
  opponentApprovalDelta: number;
  playerPollDelta: number;
  opponentPollDelta: number;
  relationDelta: number;
}

/** Computes exact Leader Approval and National Consensus impact from final TV audience share */
export function computeTvDuelImpactPreview(finalPlayerShare: number): TvDuelImpactPreview {
  if (finalPlayerShare >= 58) {
    return {
      verdict: 'vittoria_netta',
      verdictLabel: 'Vittoria Netta in Diretta TV',
      playerApprovalDelta: 5,
      opponentApprovalDelta: -4,
      playerPollDelta: 0.45,
      opponentPollDelta: -0.45,
      relationDelta: -7,
    };
  }
  if (finalPlayerShare >= 52) {
    return {
      verdict: 'vittoria',
      verdictLabel: 'Vittoria di Misura',
      playerApprovalDelta: 3,
      opponentApprovalDelta: -2,
      playerPollDelta: 0.22,
      opponentPollDelta: -0.25,
      relationDelta: -4,
    };
  }
  if (finalPlayerShare >= 48) {
    return {
      verdict: 'pareggio',
      verdictLabel: 'Confronto Equilibrato',
      playerApprovalDelta: 1,
      opponentApprovalDelta: 1,
      playerPollDelta: 0.08,
      opponentPollDelta: 0.08,
      relationDelta: -2,
    };
  }
  if (finalPlayerShare >= 42) {
    return {
      verdict: 'sconfitta',
      verdictLabel: 'Duello Perso ai Punti',
      playerApprovalDelta: -3,
      opponentApprovalDelta: 3,
      playerPollDelta: -0.3,
      opponentPollDelta: 0.3,
      relationDelta: -5,
    };
  }
  return {
    verdict: 'sconfitta_netta',
    verdictLabel: 'Sconfitta Netta in Prima Serata',
    playerApprovalDelta: -5,
    opponentApprovalDelta: 4,
    playerPollDelta: -0.65,
    opponentPollDelta: 0.5,
    relationDelta: -8,
  };
}

/** Applies the outcome of a 3-round 1v1 TV Duel to GameState (1 duello/settimana, updates leader approval, polls, and publishes front-page headline) */
export function applyTvDuelResult(
  state: GameState,
  payload: TvDuelResultPayload
): { nextState: GameState; feedback: string; error?: string } {
  if (state.actionsTakenThisWeek.includes('tv_duel_week')) {
    return {
      nextState: state,
      feedback: '',
      error: 'Hai già disputato un Duello TV in prima serata questa settimana.',
    };
  }

  const player = state.parties.find((p) => p.id === state.playerPartyId);
  const opponent = state.parties.find((p) => p.id === payload.opponentPartyId);
  if (!player || !opponent) {
    return {
      nextState: state,
      feedback: '',
      error: 'Avversario del duello TV non trovato.',
    };
  }

  const traits = getActiveTraitProfile(state);
  const baseImpact = computeTvDuelImpactPreview(payload.finalPlayerShare);
  const adjustedPlayerDelta =
    baseImpact.playerPollDelta > 0
      ? round1(baseImpact.playerPollDelta * traits.tvMult)
      : baseImpact.playerPollDelta;
  const impact: TvDuelImpactPreview = {
    ...baseImpact,
    playerPollDelta: adjustedPlayerDelta,
  };
  const dateLabel = formatGameDate(state.week).shortLabel;
  const topicsStr = payload.topicLabels.slice(0, 2).join(' e ');

  // Apply national consensus shifts via demographic distribution (obeys visibility & Weekly Cap)
  let updatedParties = applyElectoralShift(
    state.parties,
    player.id,
    {
      giovani: impact.playerPollDelta,
      lavoratori: impact.playerPollDelta,
      imprese: impact.playerPollDelta * 0.9,
      pensionati: impact.playerPollDelta * 1.05,
    },
    undefined,
    undefined,
    { weekStartPoll: state.weekStartPlayerPoll ?? player.previousPoll }
  );

  if (impact.opponentPollDelta !== 0) {
    updatedParties = applyElectoralShift(updatedParties, opponent.id, {
      giovani: impact.opponentPollDelta,
      lavoratori: impact.opponentPollDelta,
      imprese: impact.opponentPollDelta * 0.9,
      pensionati: impact.opponentPollDelta * 1.05,
    });
  }

  // Update bilateral relationship after televised clash
  updatedParties = updatedParties.map((p) => {
    if (p.id !== opponent.id) return p;
    return {
      ...p,
      relationWithPlayer: clamp(p.relationWithPlayer + impact.relationDelta, -100, 100),
    };
  });

  // Update Leader Approval ratings
  let nextLeaderApproval = adjustLeaderApproval(
    state.leaderApproval,
    player.id,
    impact.playerApprovalDelta
  );
  nextLeaderApproval = adjustLeaderApproval(
    nextLeaderApproval,
    opponent.id,
    impact.opponentApprovalDelta
  );

  // Craft front-page headline for Media Feed
  const headline =
    impact.verdict === 'vittoria_netta'
      ? `PRIMA PAGINA · Duello TV a ${payload.showName}: ${player.leaderName} domina ${opponent.leaderName} (${payload.finalPlayerShare}% a ${payload.finalOpponentShare}%)`
      : impact.verdict === 'vittoria'
        ? `PRIMA PAGINA · Sfida TV su ${topicsStr}: ${player.leaderName} supera ${opponent.leaderName} (${payload.finalPlayerShare}% vs ${payload.finalOpponentShare}%)`
        : impact.verdict === 'pareggio'
          ? `PRIMA PAGINA · Pari e patta a ${payload.showName}: scintille tra ${player.leaderName} e ${opponent.leaderName} (${payload.finalPlayerShare}%–${payload.finalOpponentShare}%)`
          : impact.verdict === 'sconfitta'
            ? `PRIMA PAGINA · ${opponent.leaderName} la spunta in TV su ${player.leaderName} (${payload.finalOpponentShare}% a ${payload.finalPlayerShare}%)`
            : `PRIMA PAGINA · Serata nera per ${player.leaderName}: ${opponent.leaderName} trionfa a ${payload.showName} (${payload.finalOpponentShare}% a ${payload.finalPlayerShare}%)`;

  const sentiment: MediaItem['sentiment'] =
    impact.verdict === 'vittoria_netta' || impact.verdict === 'vittoria'
      ? 'positivo'
      : impact.verdict === 'pareggio'
        ? 'neutro'
        : 'negativo';

  const mediaItem: MediaItem = {
    id: uid('med'),
    week: state.week,
    dateLabel,
    type: 'stampa',
    source: NEWSPAPERS[state.week % NEWSPAPERS.length],
    headline,
    excerpt: `${payload.bestMomentSummary} Gradimento ${player.leaderName}: ${impact.playerApprovalDelta >= 0 ? '+' : ''}${impact.playerApprovalDelta}% · Consenso ${player.acronym}: ${impact.playerPollDelta >= 0 ? '+' : ''}${impact.playerPollDelta.toFixed(1)}%.`,
    sentiment,
    partyColor: player.color,
  };

  const feedback = `${impact.verdictLabel} (${payload.finalPlayerShare}% vs ${payload.finalOpponentShare}% contro ${opponent.leaderName}): Gradimento Leader ${impact.playerApprovalDelta >= 0 ? '+' : ''}${impact.playerApprovalDelta}%, Consenso ${impact.playerPollDelta >= 0 ? '+' : ''}${impact.playerPollDelta.toFixed(1)}%.`;

  return {
    nextState: {
      ...state,
      parties: updatedParties,
      leaderApproval: nextLeaderApproval,
      actionsTakenThisWeek: [...state.actionsTakenThisWeek, 'tv_duel_week', `tv_duel_${opponent.id}`],
      mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
      actionLog: [
        {
          id: uid('act'),
          week: state.week,
          category: 'Duello TV 1v1',
          title: `Sfida TV vs ${opponent.leaderName} (${opponent.acronym})`,
          cost: 0,
          summary: feedback,
        },
        ...state.actionLog,
      ].slice(0, 30),
    },
    feedback,
  };
}

// ============================================================================
// RACCOLTA FIRME PER LISTE ELETTORALI (Politiche / Europee / Regionali)
// ============================================================================

export const BALLOT_SIGNATURE_TARGETS: Record<BallotElectionType, number> = {
  politiche: 60000,
  europee: 150000,
  regionali: 22000,
};

export const BANCHETTO_SIGNATURE_COST = 2500;
export const MAX_BANCHETTI_PER_WEEK = 2;

export function getBallotTargetForType(
  electionType: BallotElectionType,
  targetRegionId?: RegionId
): number {
  if (electionType === 'politiche') return BALLOT_SIGNATURE_TARGETS.politiche;
  if (electionType === 'europee') return BALLOT_SIGNATURE_TARGETS.europee;
  const reg = targetRegionId ? REGION_MAP_BY_ID[targetRegionId] : REGION_MAP_BY_ID.lazio;
  const weight = reg?.populationWeight ?? 0.095;
  // Soglia proporzionale agli elettori della regione (tra 10.000 e 40.000 firme)
  return Math.round(clamp(weight * 235000, 10000, 40000) / 500) * 500;
}

export function evaluateBallotExemption(params: {
  parties: PartyState[];
  playerPartyId: string;
  electoralLaw: ElectoralLawId;
  extraParliamentary?: boolean;
  legislatureSeats?: SeatAllocation[];
}): { exempt: boolean; reason?: string } {
  const player = params.parties.find((p) => p.id === params.playerPartyId);
  if (!player) return { exempt: false };

  const liveSeats = getCurrentParliamentSeats({
    legislatureSeats: params.legislatureSeats,
    parties: params.parties,
  });
  const playerSeat = liveSeats.find((s) => s.partyId === player.id);
  const playerTotalSeats = (playerSeat?.camera ?? 0) + (playerSeat?.senato ?? 0);

  if (!params.extraParliamentary && playerTotalSeats > 0) {
    return {
      exempt: true,
      reason: `Partito già presente in Parlamento (${playerTotalSeats} seggi): esente dalla raccolta firme`,
    };
  }

  // Esenzione per apparentamento / coalizione con almeno una forza già in Parlamento
  if (player.coalitionId) {
    const parliamentaryAlly = params.parties.find((p) => {
      if (p.id === player.id || p.id === 'altri') return false;
      if (p.coalitionId !== player.coalitionId) return false;
      const allySeat = liveSeats.find((s) => s.partyId === p.id);
      return (allySeat?.camera ?? 0) + (allySeat?.senato ?? 0) > 0;
    });
    if (parliamentaryAlly) {
      return {
        exempt: true,
        reason: `Apparentamento con ${parliamentaryAlly.name} (${parliamentaryAlly.acronym}, in Parlamento): esente da raccolta firme`,
      };
    }
  }

  return { exempt: false };
}

export function createInitialBallotSignatures(params: {
  parties: PartyState[];
  playerPartyId: string;
  electoralLaw: ElectoralLawId;
  extraParliamentary?: boolean;
  legislatureSeats?: SeatAllocation[];
  electionWeek: number;
  electionType?: BallotElectionType;
  targetRegionId?: RegionId;
}): BallotSignatureCampaign {
  const electionType = params.electionType ?? 'politiche';
  const targetRegionId = params.targetRegionId ?? 'lazio';
  const exemption = evaluateBallotExemption(params);
  const targetSignatures = getBallotTargetForType(electionType, targetRegionId);

  return {
    electionType,
    targetSignatures,
    collectedSignatures: exemption.exempt ? targetSignatures : 0,
    deadlineWeek: Math.max(1, params.electionWeek - 1),
    exempt: exemption.exempt,
    exemptReason: exemption.reason,
    banchettiThisWeek: 0,
    totalBanchetti: 0,
    excludedFromBallot: false,
    targetRegionId,
  };
}

export function syncBallotSignatureExemption(state: GameState): BallotSignatureCampaign {
  const base =
    state.ballotSignatures ??
    createInitialBallotSignatures({
      parties: state.parties,
      playerPartyId: state.playerPartyId,
      electoralLaw: state.electoralLaw,
      extraParliamentary: state.extraParliamentary,
      legislatureSeats: state.legislatureSeats,
      electionWeek: state.electionWeek,
    });

  const exemption = evaluateBallotExemption({
    parties: state.parties,
    playerPartyId: state.playerPartyId,
    electoralLaw: state.electoralLaw,
    extraParliamentary: state.extraParliamentary,
    legislatureSeats: state.legislatureSeats,
  });

  return {
    ...base,
    deadlineWeek: Math.max(state.week, state.electionWeek - 1),
    exempt: exemption.exempt,
    exemptReason: exemption.reason,
    excludedFromBallot: exemption.exempt ? false : base.excludedFromBallot,
  };
}

/** Calcola le firme raccolte settimanalmente in modo organico dagli iscritti attivi e dalle sezioni/circoli regionali */
export function calculateWeeklySignatureGain(
  state: Pick<
    GameState,
    'parties' | 'playerPartyId' | 'openHeadquarters' | 'regionalChapters' | 'executives' | 'committee'
  > & { leader?: GameState['leader'] }
): number {
  const player = state.parties.find((p) => p.id === state.playerPartyId);
  if (!player) return 1500;
  const activeMembersFactor = Math.round(player.nationalPoll * 1200);
  let chapterBonus = 0;
  for (const reg of ITALIAN_REGIONS) {
    const level = getRegionChapterLevel(state, reg.id);
    if (level > 0) {
      chapterBonus += getRegionChapterMetrics(reg, level).ballotSigBonus;
    }
  }
  const avgComp =
    state.executives.length > 0
      ? state.executives.reduce((acc, e) => acc + e.competence, 0) / state.executives.length
      : 65;
  const orgBonus = Math.round((avgComp - 50) * 35);
  const committeeBonus = state.committee.completed ? 650 : 0;
  const sigMult = state.leader
    ? getActiveTraitProfile({
        parties: state.parties,
        playerPartyId: state.playerPartyId,
        leader: state.leader,
      }).signatureMult
    : 1;
  return Math.max(
    1400,
    Math.round((1750 + activeMembersFactor + chapterBonus + orgBonus + committeeBonus) * sigMult)
  );
}

/** Stima delle firme raccolte da un banchetto in piazza (+ bonus in base al livello di sezione regionale e tratti attivi) */
export function previewBanchettoSignatureGain(
  state: GameState,
  regionId?: RegionId
): { signaturesGain: number; regionalBonus: number; cost: number; regionLabel: string } {
  const player = state.parties.find((p) => p.id === state.playerPartyId);
  const traits = getActiveTraitProfile(state);
  const targetRegion: RegionId =
    regionId ??
    state.ballotSignatures?.targetRegionId ??
    state.openHeadquarters[0] ??
    'lazio';
  const regionMeta = REGION_MAP_BY_ID[targetRegion] ?? REGION_MAP_BY_ID.lazio;
  const chapterLevel = getRegionChapterLevel(state, targetRegion);
  const regionalPoll = player?.regionPolls?.[targetRegion] ?? player?.nationalPoll ?? 1.0;

  let totalLevels = 0;
  for (const reg of ITALIAN_REGIONS) {
    totalLevels += getRegionChapterLevel(state, reg.id);
  }

  const baseSigs = Math.round(4200 * traits.signatureMult);
  const hqRegionalBonus = chapterLevel === 3 ? 5200 : chapterLevel === 2 ? 3600 : chapterLevel === 1 ? 2400 : 0;
  const pollRegionalBonus = Math.round(regionalPoll * 650);
  const networkBonus = Math.min(5500, totalLevels * 450);
  const regionalBonus = Math.round((hqRegionalBonus + pollRegionalBonus + networkBonus) * traits.signatureMult);

  return {
    signaturesGain: baseSigs + regionalBonus,
    regionalBonus,
    cost: BANCHETTO_SIGNATURE_COST,
    regionLabel: regionMeta.name,
  };
}

export function setBallotCampaignType(
  state: GameState,
  electionType: BallotElectionType,
  targetRegionId?: RegionId
): GameState {
  const synced = syncBallotSignatureExemption(state);
  const nextRegion = targetRegionId ?? synced.targetRegionId ?? 'lazio';
  const nextTarget = getBallotTargetForType(electionType, nextRegion);
  return {
    ...state,
    ballotSignatures: {
      ...synced,
      electionType,
      targetRegionId: nextRegion,
      targetSignatures: nextTarget,
      collectedSignatures: synced.exempt
        ? nextTarget
        : Math.min(nextTarget, synced.collectedSignatures),
      excludedFromBallot:
        !synced.exempt &&
        state.week >= state.electionWeek - 1 &&
        synced.collectedSignatures < nextTarget,
    },
  };
}

export function organizeSignatureBanchetto(
  state: GameState,
  regionId?: RegionId
): { nextState: GameState; feedback: string; error?: string } {
  const synced = syncBallotSignatureExemption(state);
  if (synced.exempt) {
    return {
      nextState: state,
      feedback: '',
      error: 'Il tuo partito è già esente dalla raccolta firme per le liste elettorali.',
    };
  }
  if (synced.excludedFromBallot) {
    return {
      nextState: state,
      feedback: '',
      error: 'Termine di chiusura liste già scaduto per questa tornata elettorale.',
    };
  }
  if (synced.collectedSignatures >= synced.targetSignatures) {
    return {
      nextState: state,
      feedback: '',
      error: 'Hai già raggiunto il 100% delle firme necessarie per depositare la lista.',
    };
  }
  if (synced.banchettiThisWeek >= MAX_BANCHETTI_PER_WEEK) {
    return {
      nextState: state,
      feedback: '',
      error: `Hai già organizzato ${MAX_BANCHETTI_PER_WEEK} banchetti di raccolta firme questa settimana.`,
    };
  }

  const preview = previewBanchettoSignatureGain(state, regionId);
  if (state.budget < preview.cost) {
    return {
      nextState: state,
      feedback: '',
      error: `Cassa insufficiente: servono €${preview.cost.toLocaleString('it-IT')} per allestire i banchetti in piazza.`,
    };
  }

  const targetRegion: RegionId =
    regionId ?? synced.targetRegionId ?? state.openHeadquarters[0] ?? 'lazio';
  const nextCollected = Math.min(
    synced.targetSignatures,
    synced.collectedSignatures + preview.signaturesGain
  );
  const reached100 = nextCollected >= synced.targetSignatures;
  const dateLabel = formatGameDate(state.week).shortLabel;
  const player = state.parties.find((p) => p.id === state.playerPartyId)!;

  // Piccolo effetto visibilità territoriale (+0,1% nella regione)
  const updatedParties = applyElectoralShift(
    state.parties,
    state.playerPartyId,
    {},
    undefined,
    { [targetRegion]: 0.1 },
    { weekStartPoll: state.weekStartPlayerPoll ?? player.previousPoll }
  );

  const feedback = reached100
    ? `Banchetto in ${preview.regionLabel} (+${preview.signaturesGain.toLocaleString('it-IT')} firme): SOGLIA 100% RAGGIUNTA! Lista pronta al deposito.`
    : `Banchetto in ${preview.regionLabel}: +${preview.signaturesGain.toLocaleString('it-IT')} firme certificate (bonus territoriale +${preview.regionalBonus.toLocaleString('it-IT')}).`;

  const mediaItem: MediaItem | null = reached100
    ? {
        id: uid('med'),
        week: state.week,
        dateLabel,
        type: 'social',
        source: `Comitato ${player.acronym}`,
        handle: `@${player.acronym.toLowerCase()}_ufficiale`,
        headline: `Obiettivo firme centrato! ${player.name} pronto sulle schede elettorali`,
        excerpt: `Raggiunte ${nextCollected.toLocaleString('it-IT')} firme autenticate con i banchetti in piazza.`,
        sentiment: 'positivo',
        engagement: '18.4k interazioni',
        partyColor: player.color,
      }
    : null;

  return {
    nextState: {
      ...state,
      budget: state.budget - preview.cost,
      parties: updatedParties,
      weeklyTerritorialActivity: true,
      ballotSignatures: {
        ...synced,
        collectedSignatures: nextCollected,
        banchettiThisWeek: synced.banchettiThisWeek + 1,
        totalBanchetti: synced.totalBanchetti + 1,
      },
      mediaFeed: mediaItem ? [mediaItem, ...state.mediaFeed].slice(0, 40) : state.mediaFeed,
      actionLog: [
        {
          id: uid('act'),
          week: state.week,
          category: 'Raccolta Firme',
          title: `Banchetti in ${preview.regionLabel}`,
          cost: preview.cost,
          summary: feedback,
        },
        ...state.actionLog,
      ].slice(0, 30),
    },
    feedback,
  };
}

// ============================================================================
// REFERENDUM ABROGATIVI (Art. 75 Cost.) E COSTITUZIONALI (Art. 138 Cost.)
// ============================================================================

export const REFERENDUM_SIGNATURE_TARGET = 500000;
export const REFERENDUM_SIGNATURE_WEEKS = 8;
export const REFERENDUM_LAUNCH_COST = 10000;
export const REFERENDUM_GAZEBO_COST = 4500;
export const REFERENDUM_CAMPAIGN_COSTS = {
  locale: 8000,
  nazionale: 22000,
} as const;

function computePartyReferendumAlignment(
  party: PartyState,
  targetAxis: Partial<PoliticalAxis>
): number {
  const keys = Object.keys(targetAxis) as (keyof PoliticalAxis)[];
  if (keys.length === 0) return 0;
  let score = 0;
  for (const k of keys) {
    const target = targetAxis[k] ?? 0;
    const partyVal = party.axis[k];
    const diff = Math.abs(partyVal - target);
    // +100 se perfettamente allineato, -100 se diametralmente opposto
    score += 100 - diff;
  }
  return score / keys.length;
}

function buildPartyReferendumStances(
  parties: PartyState[],
  playerPartyId: string,
  template: ReferendumTemplate,
  playerStance: ReferendumStance | null
): Record<string, ReferendumStance> {
  const stances: Record<string, ReferendumStance> = {};
  for (const p of parties) {
    if (p.id === 'altri') continue;
    if (p.id === playerPartyId && playerStance) {
      stances[p.id] = playerStance;
      continue;
    }
    const align = computePartyReferendumAlignment(p, template.yesTargetAxis);
    if (align >= 14) {
      stances[p.id] = 'si';
    } else if (template.kind === 'abrogativo' && align <= -18) {
      // Negli abrogativi (Art. 75), molti contrari puntano all'astensione per far fallire il quorum!
      stances[p.id] = align <= -32 ? 'astensione' : 'no';
    } else {
      stances[p.id] = 'no';
    }
  }
  return stances;
}

function projectReferendumMetrics(
  parties: PartyState[],
  stances: Record<string, ReferendumStance>,
  kind: 'abrogativo' | 'costituzionale',
  playerCampaignBoost: number,
  playerStance: ReferendumStance | null
): { projectedTurnout: number; projectedYesPct: number } {
  let yesWeight = 0;
  let noWeight = 0;
  let abstentionWeight = 0;

  for (const p of parties) {
    if (p.id === 'altri') continue;
    const st = stances[p.id] ?? 'no';
    if (st === 'si') yesWeight += p.nationalPoll;
    else if (st === 'astensione') abstentionWeight += p.nationalPoll;
    else noWeight += p.nationalPoll;
  }

  // Affluenza base: Art. 75 soffre la strategia dell'astensione; Art. 138 mobilita maggiormente
  const baseTurnout =
    kind === 'abrogativo'
      ? 42 + yesWeight * 0.36 + noWeight * 0.24 - abstentionWeight * 0.22
      : 54 + (yesWeight + noWeight) * 0.14;

  const turnoutPush =
    playerStance === 'astensione'
      ? -playerCampaignBoost * 1.15
      : playerStance === 'si'
        ? playerCampaignBoost * 0.9
        : playerCampaignBoost * 0.45;

  const projectedTurnout = round1(clamp(baseTurnout + turnoutPush, 22, 81));

  // Negli abrogativi chi va alle urne tende a votare più SÌ (perché molti contrari si astengono)
  const voterYesShare =
    kind === 'abrogativo'
      ? yesWeight * 1.18
      : yesWeight;
  const voterNoShare =
    kind === 'abrogativo'
      ? noWeight * 0.9 + abstentionWeight * 0.18
      : noWeight + abstentionWeight * 0.5;
  const totalVoters = Math.max(1, voterYesShare + voterNoShare);

  const yesPush =
    playerStance === 'si'
      ? playerCampaignBoost * 1.05
      : playerStance === 'no'
        ? -playerCampaignBoost * 1.05
        : 0;

  const projectedYesPct = round1(clamp((voterYesShare / totalVoters) * 100 + yesPush, 18, 86));

  return { projectedTurnout, projectedYesPct };
}

function findReferendumTemplateById(
  templateId: string,
  lawTargetId?: string
): ReferendumTemplate | null {
  const baseline = BASELINE_ABROGATIVE_REFERENDUMS.find((t) => t.id === templateId);
  if (baseline) return baseline;
  if (lawTargetId) {
    const law = PARLIAMENT_LAWS.find((l) => l.id === lawTargetId);
    if (law) {
      return templateId.startsWith('ref_cost_')
        ? buildConstitutionalReferendumTemplate(law)
        : buildAbrogativeTemplateForEnactedLaw(law);
    }
  }
  const fromLawPrefix = PARLIAMENT_LAWS.find(
    (l) => `ref_abrog_${l.id}` === templateId || `ref_cost_${l.id}` === templateId
  );
  if (fromLawPrefix) {
    return templateId.startsWith('ref_cost_')
      ? buildConstitutionalReferendumTemplate(fromLawPrefix)
      : buildAbrogativeTemplateForEnactedLaw(fromLawPrefix);
  }
  return null;
}

export function calculateWeeklyReferendumSignatureGain(
  state: Pick<GameState, 'parties' | 'playerPartyId' | 'openHeadquarters' | 'regionalChapters'>,
  ref: ActiveReferendum
): number {
  let alignedPoll = 0;
  for (const p of state.parties) {
    if (p.id === 'altri') continue;
    if (ref.partyStances[p.id] === 'si') {
      alignedPoll += p.nationalPoll;
    }
  }
  let chapterBonus = 0;
  for (const reg of ITALIAN_REGIONS) {
    const level = getRegionChapterLevel(state, reg.id);
    if (level > 0) {
      chapterBonus += getRegionChapterMetrics(reg, level).referendumSigBonus;
    }
  }
  return Math.round(clamp(28000 + alignedPoll * 2400 + chapterBonus, 32000, 165000));
}

export function promoteAbrogativeReferendum(
  state: GameState,
  templateId: string
): { nextState: GameState; feedback: string; error?: string } {
  if (state.activeReferendum && state.activeReferendum.phase !== 'concluso') {
    return {
      nextState: state,
      feedback: '',
      error: 'C’è già un referendum attivo in corso: concludilo prima di promuoverne un altro.',
    };
  }
  if (state.budget < REFERENDUM_LAUNCH_COST) {
    return {
      nextState: state,
      feedback: '',
      error: `Fondi insufficienti: servono €${REFERENDUM_LAUNCH_COST.toLocaleString('it-IT')} per costituire il Comitato Referendario.`,
    };
  }

  const concludedIds = new Set((state.referendumHistory ?? []).map((r) => r.templateId));
  const available = getAvailableAbrogativeTemplates(state.enactedLawIds, concludedIds);
  const template = available.find((t) => t.id === templateId);
  if (!template) {
    return {
      nextState: state,
      feedback: '',
      error: 'Quesito referendario non disponibile o già votato in questa legislatura.',
    };
  }

  const stances = buildPartyReferendumStances(state.parties, state.playerPartyId, template, 'si');
  const projection = projectReferendumMetrics(state.parties, stances, 'abrogativo', 0, 'si');
  const dateLabel = formatGameDate(state.week).shortLabel;
  const player = state.parties.find((p) => p.id === state.playerPartyId)!;

  const activeReferendum: ActiveReferendum = {
    id: uid('ref'),
    templateId: template.id,
    title: template.title,
    shortTitle: template.shortTitle,
    lawTargetId: template.lawTargetId,
    lawTargetLabel: template.lawTargetLabel,
    summary: template.summary,
    kind: 'abrogativo',
    phase: 'raccolta_firme',
    startedAtWeek: state.week,
    signatures: 35000, // Firma iniziale dei promotori e raccolta online SPID
    targetSignatures: REFERENDUM_SIGNATURE_TARGET,
    signatureDeadlineWeek: state.week + REFERENDUM_SIGNATURE_WEEKS,
    voteWeek: state.week + REFERENDUM_SIGNATURE_WEEKS + 4,
    requiresQuorum: true,
    playerStance: 'si',
    campaignBudgetSpent: REFERENDUM_LAUNCH_COST,
    playerCampaignBoost: 1.0,
    banchettiThisWeek: 0,
    partyStances: stances,
    projectedTurnout: projection.projectedTurnout,
    projectedYesPct: projection.projectedYesPct,
    promotedByPlayer: true,
  };

  const mediaItem: MediaItem = {
    id: uid('med'),
    week: state.week,
    dateLabel,
    type: 'stampa',
    source: 'Gazzetta Costituzionale',
    headline: `${player.name} deposita in Cassazione il Referendum Abrogativo: "${template.shortTitle}"`,
    excerpt: `Al via la corsa alle 500.000 firme (scadenza entro ${REFERENDUM_SIGNATURE_WEEKS} settimane, Art. 75 Cost.). Richiesto quorum del 50% + 1 al voto.`,
    sentiment: 'positivo',
    partyColor: player.color,
  };

  return {
    nextState: {
      ...state,
      budget: state.budget - REFERENDUM_LAUNCH_COST,
      activeReferendum,
      mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
      actionLog: [
        {
          id: uid('act'),
          week: state.week,
          category: 'Referendum Art. 75',
          title: template.shortTitle,
          cost: REFERENDUM_LAUNCH_COST,
          summary: `Depositato quesito abrogativo in Cassazione (target 500.000 firme entro ${REFERENDUM_SIGNATURE_WEEKS} sett.).`,
        },
        ...state.actionLog,
      ].slice(0, 30),
    },
    feedback: `Referendum Abrogativo "${template.shortTitle}" depositato! Raccogli 500.000 firme entro ${REFERENDUM_SIGNATURE_WEEKS} settimane.`,
  };
}

export function triggerConstitutionalReferendum(
  state: GameState,
  lawId: string
): { nextState: GameState; feedback: string; error?: string } {
  if (state.activeReferendum && state.activeReferendum.phase !== 'concluso') {
    return {
      nextState: state,
      feedback: '',
      error: 'Concludi il referendum attualmente attivo prima di avviarne un altro.',
    };
  }
  if (!(state.pendingConstitutionalReferendumLawIds ?? []).includes(lawId)) {
    return {
      nextState: state,
      feedback: '',
      error: 'Nessuna riforma costituzionale approvata sotto i 2/3 idonea a questo referendum.',
    };
  }
  const law = PARLIAMENT_LAWS.find((l) => l.id === lawId);
  if (!law) {
    return { nextState: state, feedback: '', error: 'Riforma costituzionale non trovata.' };
  }

  const template = buildConstitutionalReferendumTemplate(law);
  // Se il giocatore è al Governo probabilmente sostiene il SÌ, altrimenti il NO
  const defaultStance: ReferendumStance =
    state.governmentRole === 'opposizione' ? 'no' : 'si';
  const stances = buildPartyReferendumStances(
    state.parties,
    state.playerPartyId,
    template,
    defaultStance
  );
  const projection = projectReferendumMetrics(
    state.parties,
    stances,
    'costituzionale',
    0,
    defaultStance
  );
  const dateLabel = formatGameDate(state.week).shortLabel;
  const player = state.parties.find((p) => p.id === state.playerPartyId)!;

  const activeReferendum: ActiveReferendum = {
    id: uid('ref_cost'),
    templateId: template.id,
    title: template.title,
    shortTitle: template.shortTitle,
    lawTargetId: law.id,
    lawTargetLabel: law.title,
    summary: template.summary,
    kind: 'costituzionale',
    phase: 'campagna',
    startedAtWeek: state.week,
    signatures: 0,
    targetSignatures: 0,
    signatureDeadlineWeek: state.week,
    voteWeek: state.week + 4,
    requiresQuorum: false,
    playerStance: defaultStance,
    campaignBudgetSpent: 0,
    playerCampaignBoost: 0,
    banchettiThisWeek: 0,
    partyStances: stances,
    projectedTurnout: projection.projectedTurnout,
    projectedYesPct: projection.projectedYesPct,
    promotedByPlayer: true,
  };

  const mediaItem: MediaItem = {
    id: uid('med'),
    week: state.week,
    dateLabel,
    type: 'stampa',
    source: 'Il Corriere Nazionale',
    headline: `REFERENDUM COSTITUZIONALE (Art. 138): si vota su "${law.title}" tra 4 settimane!`,
    excerpt: `Approvata senza maggioranza dei 2/3, la riforma passa al verdetto diretto dei cittadini. Nessun quorum di affluenza: decide la maggioranza dei voti validi.`,
    sentiment: 'neutro',
    partyColor: player.color,
  };

  return {
    nextState: {
      ...state,
      activeReferendum,
      pendingConstitutionalReferendumLawIds: (
        state.pendingConstitutionalReferendumLawIds ?? []
      ).filter((id) => id !== lawId),
      mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
    },
    feedback: `Indetto Referendum Confermativo Costituzionale (Art. 138, senza quorum) su "${law.title}": voto tra 4 settimane!`,
  };
}

export function boostReferendumSignatures(
  state: GameState
): { nextState: GameState; feedback: string; error?: string } {
  const ref = state.activeReferendum;
  if (!ref || ref.phase !== 'raccolta_firme') {
    return {
      nextState: state,
      feedback: '',
      error: 'Nessuna raccolta firme referendaria in corso.',
    };
  }
  if (ref.banchettiThisWeek >= 2) {
    return {
      nextState: state,
      feedback: '',
      error: 'Hai già organizzato 2 giornate di gazebo referendari questa settimana.',
    };
  }
  if (state.budget < REFERENDUM_GAZEBO_COST) {
    return {
      nextState: state,
      feedback: '',
      error: `Fondi insufficienti: servono €${REFERENDUM_GAZEBO_COST.toLocaleString('it-IT')} per i gazebo referendari.`,
    };
  }

  let chapterRefBoost = 0;
  for (const reg of ITALIAN_REGIONS) {
    const level = getRegionChapterLevel(state, reg.id);
    if (level > 0) {
      chapterRefBoost += getRegionChapterMetrics(reg, level).referendumSigBonus;
    }
  }
  const gain = 58000 + chapterRefBoost;
  const nextSigs = Math.min(ref.targetSignatures, ref.signatures + gain);
  const reached = nextSigs >= ref.targetSignatures;
  const updatedRef: ActiveReferendum = reached
    ? {
        ...ref,
        signatures: nextSigs,
        phase: 'campagna',
        voteWeek: state.week + 4,
        banchettiThisWeek: ref.banchettiThisWeek + 1,
        campaignBudgetSpent: ref.campaignBudgetSpent + REFERENDUM_GAZEBO_COST,
      }
    : {
        ...ref,
        signatures: nextSigs,
        banchettiThisWeek: ref.banchettiThisWeek + 1,
        campaignBudgetSpent: ref.campaignBudgetSpent + REFERENDUM_GAZEBO_COST,
      };

  const feedback = reached
    ? `500.000 FIRME RAGGIUNTE! La Cassazione ammette "${ref.shortTitle}": voto fissato tra 4 settimane!`
    : `Gazebo referendari mobilitati: +${gain.toLocaleString('it-IT')} firme certificate (${nextSigs.toLocaleString('it-IT')}/500.000).`;

  return {
    nextState: {
      ...state,
      budget: state.budget - REFERENDUM_GAZEBO_COST,
      weeklyTerritorialActivity: true,
      activeReferendum: updatedRef,
    },
    feedback,
  };
}

export function setReferendumStance(
  state: GameState,
  stance: ReferendumStance
): { nextState: GameState; feedback: string; error?: string } {
  const ref = state.activeReferendum;
  if (!ref || ref.phase === 'concluso') {
    return { nextState: state, feedback: '', error: 'Nessun referendum attivo.' };
  }
  if (stance === 'astensione' && !ref.requiresQuorum) {
    return {
      nextState: state,
      feedback: '',
      error: 'Il Referendum Costituzionale (Art. 138) non prevede quorum: puoi schierarti solo per SÌ o NO.',
    };
  }

  const nextStances: Record<string, ReferendumStance> = {
    ...ref.partyStances,
    [state.playerPartyId]: stance,
  };
  const proj = projectReferendumMetrics(
    state.parties,
    nextStances,
    ref.kind,
    ref.playerCampaignBoost,
    stance
  );

  const stanceLabel =
    stance === 'si'
      ? 'SÌ'
      : stance === 'no'
        ? 'NO'
        : 'ASTENSIONE (strategia anti-quorum)';

  return {
    nextState: {
      ...state,
      activeReferendum: {
        ...ref,
        playerStance: stance,
        partyStances: nextStances,
        projectedTurnout: proj.projectedTurnout,
        projectedYesPct: proj.projectedYesPct,
      },
    },
    feedback: `Linea ufficiale del partito sul referendum: ${stanceLabel}.`,
  };
}

export function fundReferendumCampaign(
  state: GameState,
  tier: 'locale' | 'nazionale'
): { nextState: GameState; feedback: string; error?: string } {
  const ref = state.activeReferendum;
  if (!ref || ref.phase !== 'campagna') {
    return {
      nextState: state,
      feedback: '',
      error: 'La campagna referendaria si attiva dopo la validazione del quesito.',
    };
  }
  if (!ref.playerStance) {
    return {
      nextState: state,
      feedback: '',
      error: 'Scegli prima la linea ufficiale del partito (SÌ, NO o Astensione).',
    };
  }
  if (state.actionsTakenThisWeek.includes('ref_camp_week')) {
    return {
      nextState: state,
      feedback: '',
      error: 'Hai già finanziato un’iniziativa di campagna referendaria questa settimana.',
    };
  }
  const cost = REFERENDUM_CAMPAIGN_COSTS[tier];
  if (state.budget < cost) {
    return {
      nextState: state,
      feedback: '',
      error: `Fondi insufficienti (€${cost.toLocaleString('it-IT')}).`,
    };
  }

  const boostDelta = tier === 'nazionale' ? 5.2 : 2.5;
  const nextBoost = Math.min(18, ref.playerCampaignBoost + boostDelta);
  const proj = projectReferendumMetrics(
    state.parties,
    ref.partyStances,
    ref.kind,
    nextBoost,
    ref.playerStance
  );

  const playerForRef = state.parties.find((p) => p.id === state.playerPartyId);
  const updatedParties = applyElectoralShift(
    state.parties,
    state.playerPartyId,
    {
      giovani: tier === 'nazionale' ? 0.25 : 0.1,
      lavoratori: tier === 'nazionale' ? 0.2 : 0.1,
    },
    undefined,
    undefined,
    { weekStartPoll: state.weekStartPlayerPoll ?? playerForRef?.previousPoll }
  );

  const stanceLabel =
    ref.playerStance === 'si'
      ? 'il SÌ'
      : ref.playerStance === 'no'
        ? 'il NO'
        : 'l’Astensione (quorum)';

  return {
    nextState: {
      ...state,
      budget: state.budget - cost,
      parties: updatedParties,
      actionsTakenThisWeek: [...state.actionsTakenThisWeek, 'ref_camp_week'],
      activeReferendum: {
        ...ref,
        campaignBudgetSpent: ref.campaignBudgetSpent + cost,
        playerCampaignBoost: nextBoost,
        projectedTurnout: proj.projectedTurnout,
        projectedYesPct: proj.projectedYesPct,
      },
      actionLog: [
        {
          id: uid('act'),
          week: state.week,
          category: 'Campagna Referendaria',
          title: `${tier === 'nazionale' ? 'Spot TV & Piazze Nazionali' : 'Volantinaggio & Comitati'} per ${stanceLabel}`,
          cost,
          summary: `Proiezioni aggiornate: Affluenza ${proj.projectedTurnout.toFixed(1)}% · SÌ ${proj.projectedYesPct.toFixed(1)}%.`,
        },
        ...state.actionLog,
      ].slice(0, 30),
    },
    feedback: `Campagna referendaria ${tier} per ${stanceLabel} avviata! Proiezioni: Affluenza ${proj.projectedTurnout.toFixed(1)}% · SÌ ${proj.projectedYesPct.toFixed(1)}%.`,
  };
}

export function dismissConcludedReferendum(state: GameState): GameState {
  if (!state.activeReferendum || state.activeReferendum.phase !== 'concluso') {
    return state;
  }
  return {
    ...state,
    activeReferendum: null,
  };
}

function resolveReferendumVote(
  state: Pick<
    GameState,
    | 'parties'
    | 'playerPartyId'
    | 'stateIndicators'
    | 'enactedLawIds'
    | 'institutionalFlags'
    | 'electoralLaw'
  >,
  ref: ActiveReferendum
): {
  concludedReferendum: ActiveReferendum;
  parties: PartyState[];
  stateIndicators: StateIndicators;
  enactedLawIds: string[];
  institutionalFlags: InstitutionalFlags;
  electoralLaw: ElectoralLawId;
  leaderApprovalDelta: number;
} {
  const turnoutSwing = (Math.random() - 0.48) * 6.5;
  const yesSwing = (Math.random() - 0.5) * 7.5;
  const finalTurnout = round1(clamp(ref.projectedTurnout + turnoutSwing, 20, 84));
  const finalYesPct = round1(clamp(ref.projectedYesPct + yesSwing, 15, 88));
  const finalNoPct = round1(100 - finalYesPct);

  const quorumReached = ref.requiresQuorum ? finalTurnout > 50.0 : true;
  const approved = quorumReached && finalYesPct > 50.0;

  let playerWon = false;
  if (ref.playerStance === 'si') {
    playerWon = approved;
  } else if (ref.playerStance === 'no') {
    playerWon = !approved;
  } else if (ref.playerStance === 'astensione') {
    playerWon = !quorumReached;
  }

  const template = findReferendumTemplateById(ref.templateId, ref.lawTargetId);
  let nextParties = state.parties;
  let nextIndicators = { ...state.stateIndicators };
  let nextEnactedLawIds = [...state.enactedLawIds];
  let nextFlags = { ...state.institutionalFlags };
  let nextElectoralLaw = state.electoralLaw;

  if (ref.kind === 'abrogativo') {
    if (approved && template) {
      if (template.yesEffects.stateEffects) {
        nextIndicators = applyStateEffects(nextIndicators, template.yesEffects.stateEffects);
      }
      if (template.yesEffects.repealsLawId) {
        nextEnactedLawIds = nextEnactedLawIds.filter((id) => id !== template.yesEffects.repealsLawId);
      }
      if (template.yesEffects.revertsFlag) {
        nextFlags[template.yesEffects.revertsFlag] = false;
      }
      if (template.yesEffects.electoralLawFallback) {
        nextElectoralLaw = template.yesEffects.electoralLawFallback;
      }
    } else if (!approved && template?.noEffects.stateEffects) {
      nextIndicators = applyStateEffects(nextIndicators, template.noEffects.stateEffects);
    }
  } else {
    // Referendum Confermativo Costituzionale (Art. 138, senza quorum)
    if (!approved && ref.lawTargetId) {
      // Vince il NO: riforma costituzionale bocciata e annullata!
      const law = PARLIAMENT_LAWS.find((l) => l.id === ref.lawTargetId);
      nextEnactedLawIds = nextEnactedLawIds.filter((id) => id !== ref.lawTargetId);
      if (law?.grantsFlag) {
        nextFlags[law.grantsFlag] = false;
      }
      if (template?.noEffects.stateEffects) {
        nextIndicators = applyStateEffects(nextIndicators, template.noEffects.stateEffects);
      }
    } else if (approved && template?.yesEffects.stateEffects) {
      nextIndicators = applyStateEffects(nextIndicators, template.yesEffects.stateEffects);
    }
  }

  const pollDelta = ref.playerStance ? (playerWon ? 0.8 : -0.6) : 0;
  const leaderApprovalDelta = ref.playerStance ? (playerWon ? 3 : -2) : 0;
  if (pollDelta !== 0) {
    nextParties = applyElectoralShift(nextParties, state.playerPartyId, {
      giovani: pollDelta,
      lavoratori: pollDelta,
      imprese: pollDelta * 0.7,
      pensionati: pollDelta * 0.7,
    });
  }

  const headline =
    ref.kind === 'abrogativo' && !quorumReached
      ? `REFERENDUM SENZA QUORUM (${finalTurnout.toFixed(1)}%): "${ref.shortTitle}" non raggiunge il 50%+1`
      : approved
        ? template?.yesEffects.headline ?? `REFERENDUM APPROVATO: Vince il SÌ (${finalYesPct.toFixed(1)}%)`
        : template?.noEffects.headline ?? `REFERENDUM RESPINTO: Vince il NO (${finalNoPct.toFixed(1)}%)`;

  const narrative =
    ref.kind === 'abrogativo'
      ? `Affluenza definitiva: ${finalTurnout.toFixed(1)}% (${quorumReached ? 'Quorum 50%+1 RAGGIUNTO' : 'Quorum NON raggiunto'}). Scrutinio: SÌ ${finalYesPct.toFixed(1)}% — NO ${finalNoPct.toFixed(1)}%. ${
          ref.playerStance
            ? playerWon
              ? `Vittoria politica per la tua linea (${ref.playerStance.toUpperCase()}): +${pollDelta.toFixed(1)}% consenso.`
              : `Sconfitta per la tua linea (${ref.playerStance.toUpperCase()}): ${pollDelta.toFixed(1)}% consenso.`
            : 'Il partito non si era schierato ufficialmente.'
        }`
      : `Consultazione Costituzionale (Art. 138, nessun quorum) · Affluenza ${finalTurnout.toFixed(1)}% · SÌ ${finalYesPct.toFixed(1)}% — NO ${finalNoPct.toFixed(1)}%. ${
          approved
            ? 'La riforma costituzionale viene confermata definitivamente.'
            : 'I cittadini bocciano la riforma costituzionale, che viene annullata.'
        }`;

  const concludedReferendum: ActiveReferendum = {
    ...ref,
    phase: 'concluso',
    projectedTurnout: finalTurnout,
    projectedYesPct: finalYesPct,
    result: {
      turnout: finalTurnout,
      quorumReached,
      yesPct: finalYesPct,
      noPct: finalNoPct,
      approved,
      playerWon,
      headline,
      narrative,
      pollDelta,
    },
  };

  return {
    concludedReferendum,
    parties: nextParties,
    stateIndicators: nextIndicators,
    enactedLawIds: nextEnactedLawIds,
    institutionalFlags: nextFlags,
    electoralLaw: nextElectoralLaw,
    leaderApprovalDelta,
  };
}

// ============================================================================
// DECRETI-LEGGE (60 GG), QUESTIONE DI FIDUCIA & COMMISSIONI D'INCHIESTA
// ============================================================================

export interface InquiryCommissionTopic {
  id: string;
  title: string;
  targetArea: string;
  description: string;
  durationWeeks: number;
  reportHeadline: string;
  reportSummary: string;
}

export const INQUIRY_COMMISSION_TOPICS: InquiryCommissionTopic[] = [
  {
    id: 'comm_sanita_appalti',
    title: 'Commissione d’Inchiesta su Sanità & Appalti Regionali',
    targetArea: 'Sanità & PNRR',
    description:
      'Indaga su liste d’attesa, appalti ospedalieri e gettonisti nelle ASL di tutta Italia.',
    durationWeeks: 5,
    reportHeadline:
      'Relazione Commissione Sanità: denunciati ritardi negli appalti e carenze di personale nelle ASL',
    reportSummary:
      'Le audizioni accendono i riflettori nazionali sulla gestione sanitaria. Grande eco nei talk show e pressione sul Ministero della Salute.',
  },
  {
    id: 'comm_pnrr_opere',
    title: 'Commissione Bicamerale su Fondi PNRR e Grandi Opere',
    targetArea: 'Economia & Infrastrutture',
    description:
      'Verifica lo stato di avanzamento dei cantieri PNRR e i ritardi di spesa dei ministeri.',
    durationWeeks: 5,
    reportHeadline:
      'Dossier Commissione PNRR: ritardi su 38% dei bandi locali, scontro tra maggioranza e opposizioni',
    reportSummary:
      'La relazione finale mette sotto pressione la governance dei fondi europei, riaprendo il confronto con Bruxelles e i governatori.',
  },
  {
    id: 'comm_sicurezza_frontiere',
    title: 'Commissione d’Inchiesta su Sicurezza Urbana e Gestione Frontiere',
    targetArea: 'Interni & Sicurezza',
    description:
      'Audizioni su centri di accoglienza, organici delle forze dell’ordine e sicurezza nelle stazioni.',
    durationWeeks: 4,
    reportHeadline:
      'Commissione Sicurezza: rapporto duro su organici scoperti e costi dei centri di trattenimento',
    reportSummary:
      'Il rapporto parlamentare domina le prime pagine dei quotidiani e sposta l’agenda politica verso il tema sicurezza.',
  },
  {
    id: 'comm_conflitto_interessi',
    title: 'Commissione su Conflitto d’Interessi, Media e Finanziamento Politico',
    targetArea: 'Istituzioni & Media',
    description:
      'Esamina indipendenza dell’informazione pubblica, fondazioni politiche e lobbying parlamentare.',
    durationWeeks: 5,
    reportHeadline:
      'Relazione Conflitto d’Interessi: richieste nuove regole di trasparenza su media e fondazioni',
    reportSummary:
      'L’inchiesta parlamentare suscita forte dibattito sull’etica pubblica e premia chi sostiene la trasparenza istituzionale.',
  },
  {
    id: 'comm_banche_risparmio',
    title: 'Commissione d’Inchiesta su Banche, Extraprofitti e Risparmiatori',
    targetArea: 'Finanza & Tutela Famiglie',
    description:
      'Analizza margini bancari, tassi sui mutui e vigilanza sul credito alle PMI.',
    durationWeeks: 4,
    reportHeadline:
      'Commissione Banche: focus su mutui alle famiglie e stretta creditizia per le piccole imprese',
    reportSummary:
      'Le audizioni dei vertici bancari e delle associazioni consumatori generano forte attenzione tra famiglie e imprese.',
  },
  {
    id: 'comm_scandali_appalti',
    title: 'Commissione d’Inchiesta su Scandali Ministeriali e Appalti',
    targetArea: 'Trasparenza & Esecutivo',
    description:
      'Indaga su affidamenti diretti, consulenze pubbliche e presunti conflitti di interesse nei dicasteri.',
    durationWeeks: 4,
    reportHeadline:
      'Relazione Scandali & Appalti: dure contestazioni sulla gestione di nomine e consulenze pubbliche',
    reportSummary:
      'Le audizioni trasmesse in diretta accendono la pressione mediatica sul Governo e dividono il Parlamento.',
  },
];

/** Converte in legge un Decreto-Legge attivo prima della scadenza dei 60 giorni (con o senza Questione di Fiducia) */
export function convertDecreeLaw(
  state: GameState,
  decreeId: string,
  withConfidence: boolean
): { nextState: GameState; feedback: string; error?: string; triggeredCollapse?: boolean } {
  if (getPlayerParliamentSeats(state).isExtraParliamentary) {
    return { nextState: state, feedback: '', error: 'Partito extra-parlamentare: accesso bloccato.' };
  }
  if (state.actionsTakenThisWeek.includes('parl_vote_week')) {
    return {
      nextState: state,
      feedback: '',
      error: 'Hai già calendarizzato una votazione parlamentare questa settimana.',
    };
  }
  const decree = (state.activeDecreeLaws ?? []).find(
    (d) => d.id === decreeId && d.status === 'in_conversione'
  );
  if (!decree) {
    return { nextState: state, feedback: '', error: 'Decreto-Legge non trovato o già concluso.' };
  }
  const law = PARLIAMENT_LAWS.find((l) => l.id === decree.lawId);
  if (!law) {
    return { nextState: state, feedback: '', error: 'Norma collegata non trovata.' };
  }
  const isInGov = state.isPrimeMinister || state.governmentRole !== 'opposizione';
  if (withConfidence && !isInGov) {
    return {
      nextState: state,
      feedback: '',
      error: 'Solo il Governo può porre la Questione di Fiducia sulla conversione.',
    };
  }

  const forecast = forecastLawVote(state, law);
  const dateLabel = formatGameDate(state.week).shortLabel;
  const player = state.parties.find((p) => p.id === state.playerPartyId)!;

  const confCamBonus = withConfidence ? 22 : 0;
  const confSenBonus = withConfidence ? 11 : 0;
  const camSwing = Math.floor(Math.random() * 7) - 3;
  const senSwing = Math.floor(Math.random() * 5) - 2;
  const finalCamYes = clamp(forecast.cameraYes + confCamBonus + camSwing, 0, 400);
  const finalSenYes = clamp(forecast.senatoYes + confSenBonus + senSwing, 0, 200);
  const converted =
    finalCamYes >= forecast.requiredCamera && finalSenYes >= forecast.requiredSenato;

  const nextAllySatisfaction = { ...(state.allySatisfaction ?? {}) };
  let nextExecutives = state.executives;
  let basePartiesForConfidence = state.parties;
  if (withConfidence) {
    for (const allyId of Object.keys(nextAllySatisfaction)) {
      nextAllySatisfaction[allyId] = clamp(nextAllySatisfaction[allyId] - 7, 0, 100);
    }
    nextExecutives = state.executives.map((ex) => ({
      ...ex,
      loyalty: clamp(ex.loyalty - 3, 5, 100),
    }));
    // Alza la tensione con le opposizioni parlamentari
    basePartiesForConfidence = state.parties.map((p) => {
      if (
        p.id !== player.id &&
        p.id !== 'altri' &&
        (!player.coalitionId || p.coalitionId !== player.coalitionId)
      ) {
        return { ...p, relationWithPlayer: clamp(p.relationWithPlayer - 6, -100, 100) };
      }
      return p;
    });
  }

  if (converted) {
    const remainingDemo: Partial<Record<DemographicId, number>> = {};
    for (const [k, v] of Object.entries(law.demoEffects)) {
      if (typeof v === 'number') remainingDemo[k as DemographicId] = round1(v * 0.45);
    }
    const updatedParties = applyElectoralShift(
      basePartiesForConfidence,
      player.id,
      remainingDemo,
      undefined,
      undefined,
      { weekStartPoll: state.weekStartPlayerPoll ?? player.previousPoll }
    );
    const nextDecrees = (state.activeDecreeLaws ?? [])
      .map((d) =>
        d.id === decree.id
          ? { ...d, status: 'convertito' as const, confidenceUsed: withConfidence }
          : d
      )
      .sort((a, b) => (a.status === 'in_conversione' ? 0 : 1) - (b.status === 'in_conversione' ? 0 : 1));
    const nextIndicators = applyStateEffects(state.stateIndicators, {
      socialStability: withConfidence ? -3 : 2,
      democraticHealth: withConfidence ? -3 : 1,
    });
    const record: LawVoteRecord = {
      id: uid('vote'),
      lawId: law.id,
      title: `Conversione DL: ${law.title}`,
      week: state.week,
      dateLabel,
      cameraYes: finalCamYes,
      cameraNo: 400 - finalCamYes,
      senatoYes: finalSenYes,
      senatoNo: 200 - finalSenYes,
      outcome: 'approvata',
      instrument: 'dl',
      confidenceUsed: withConfidence,
      summary: withConfidence
        ? `DL convertito in legge con Questione di Fiducia (${finalCamYes} Cam / ${finalSenYes} Sen).`
        : `DL convertito in legge ordinaria (${finalCamYes} Cam / ${finalSenYes} Sen) entro i 60 giorni.`,
    };
    const mediaItem: MediaItem = {
      id: uid('med'),
      week: state.week,
      dateLabel,
      type: 'stampa',
      source: 'Gazzetta Parlamentare',
      headline: withConfidence
        ? `FIDUCIA SULLA CONVERSIONE: il DL "${law.title}" è legge definitiva`
        : `Parlamento converte in legge il DL "${law.title}"`,
      excerpt: record.summary,
      sentiment: 'positivo',
      partyColor: player.color,
    };

    return {
      nextState: {
        ...state,
        parties: updatedParties,
        executives: nextExecutives,
        allySatisfaction: nextAllySatisfaction,
        stateIndicators: nextIndicators,
        regimeStatus: deriveRegimeStatus(state.institutionalFlags, nextIndicators.democraticHealth),
        activeDecreeLaws: nextDecrees,
        actionsTakenThisWeek: [...state.actionsTakenThisWeek, 'parl_vote_week'],
        lawVoteHistory: [record, ...state.lawVoteHistory].slice(0, 24),
        mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
      },
      feedback: record.summary,
    };
  }

  // Conversione respinta!
  if (withConfidence) {
    // Se cade sulla Questione di Fiducia -> DL decade e il Governo cade!
    const nextEnactedIds = state.enactedLawIds.filter((id) => id !== decree.lawId);
    const nextFlags = { ...state.institutionalFlags };
    if (decree.grantedFlag) nextFlags[decree.grantedFlag] = false;
    const nextElectoralLaw = decree.previousElectoralLaw ?? state.electoralLaw;
    const nextDecrees = (state.activeDecreeLaws ?? [])
      .map((d) =>
        d.id === decree.id ? { ...d, status: 'decaduto' as const, confidenceUsed: true } : d
      )
      .sort((a, b) => (a.status === 'in_conversione' ? 0 : 1) - (b.status === 'in_conversione' ? 0 : 1));
    const updatedParties = applyElectoralShift(basePartiesForConfidence, player.id, {
      giovani: -0.7,
      lavoratori: -0.7,
      imprese: -0.8,
      pensionati: -0.6,
    }).map((p) => (p.id === player.id ? { ...p, isInGovernment: false } : p));

    const collapseIndicators = applyStateEffects(state.stateIndicators, {
      spread: 26,
      socialStability: -10,
    });

    const record: LawVoteRecord = {
      id: uid('vote'),
      lawId: law.id,
      title: `Conversione DL (Fiducia): ${law.title}`,
      week: state.week,
      dateLabel,
      cameraYes: finalCamYes,
      cameraNo: 400 - finalCamYes,
      senatoYes: finalSenYes,
      senatoNo: 200 - finalSenYes,
      outcome: 'respinta',
      instrument: 'dl',
      confidenceUsed: true,
      summary: `GOVERNO SFIDUCIATO SULLA CONVERSIONE DEL DL (${finalCamYes} Cam / ${finalSenYes} Sen): decreto decaduto e Camere sciolte!`,
    };
    const mediaItem: MediaItem = {
      id: uid('med'),
      week: state.week,
      dateLabel,
      type: 'stampa',
      source: 'EDIZIONE STRAORDINARIA · ANSA',
      headline: `CADE IL GOVERNO: battuto sulla fiducia per la conversione di "${law.title}"!`,
      excerpt: record.summary,
      sentiment: 'negativo',
      partyColor: '#F43F5E',
    };

    const fallenState: GameState = {
      ...state,
      parties: updatedParties,
      actionsTakenThisWeek: [...state.actionsTakenThisWeek, 'parl_vote_week'],
      executives: nextExecutives,
      enactedLawIds: nextEnactedIds,
      institutionalFlags: nextFlags,
      electoralLaw: nextElectoralLaw,
      governmentRole: 'opposizione',
      isPrimeMinister: false,
      governmentMinistries: {},
      governmentMinistryExecutives: {},
      allySatisfaction: {},
      leaderApproval: adjustLeaderApproval(state.leaderApproval, player.id, -6),
      stateIndicators: collapseIndicators,
      regimeStatus: deriveRegimeStatus(nextFlags, collapseIndicators.democraticHealth),
      activeDecreeLaws: nextDecrees,
      lawVoteHistory: [record, ...state.lawVoteHistory].slice(0, 24),
      mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
    };
    return {
      nextState: state.election ? fallenState : triggerElectionNight(fallenState),
      feedback: record.summary,
      triggeredCollapse: true,
    };
  }

  // Senza fiducia: il voto slitta, servono più voti o porre la fiducia
  const record: LawVoteRecord = {
    id: uid('vote'),
    lawId: law.id,
    title: `Conversione DL: ${law.title}`,
    week: state.week,
    dateLabel,
    cameraYes: finalCamYes,
    cameraNo: 400 - finalCamYes,
    senatoYes: finalSenYes,
    senatoNo: 200 - finalSenYes,
    outcome: 'respinta',
    instrument: 'dl',
    confidenceUsed: false,
    summary: `Conversione rinviata in Commissione (${finalCamYes} Cam / ${finalSenYes} Sen). Valuta alleanze o Questione di Fiducia prima della scadenza.`,
  };

  return {
    nextState: {
      ...state,
      actionsTakenThisWeek: [...state.actionsTakenThisWeek, 'parl_vote_week'],
      lawVoteHistory: [record, ...state.lawVoteHistory].slice(0, 24),
    },
    feedback: record.summary,
  };
}

/** Pone la Questione di Fiducia su un DDL ordinario in iter (o bloccato da emendamenti ostili) per blindare e accelerare l'approvazione */
export function votePendingBillWithConfidence(
  state: GameState,
  billId: string
): { nextState: GameState; feedback: string; error?: string; triggeredCollapse?: boolean } {
  if (getPlayerParliamentSeats(state).isExtraParliamentary) {
    return { nextState: state, feedback: '', error: 'Partito extra-parlamentare: accesso bloccato.' };
  }
  const isInGov = state.isPrimeMinister || state.governmentRole !== 'opposizione';
  if (!isInGov) {
    return {
      nextState: state,
      feedback: '',
      error: 'Solo il Governo in carica può porre la Questione di Fiducia su un DDL.',
    };
  }
  if (state.actionsTakenThisWeek.includes('parl_vote_week')) {
    return {
      nextState: state,
      feedback: '',
      error: 'Hai già calendarizzato una votazione in Aula questa settimana.',
    };
  }
  const bill = (state.pendingBills ?? []).find((b) => b.id === billId);
  if (!bill) {
    return { nextState: state, feedback: '', error: 'DDL non trovato in calendario parlamentare.' };
  }
  const law = PARLIAMENT_LAWS.find((l) => l.id === bill.lawId);
  if (!law) {
    return { nextState: state, feedback: '', error: 'Norma collegata non trovata.' };
  }

  const forecast = forecastLawVote(state, law);
  const dateLabel = formatGameDate(state.week).shortLabel;
  const player = state.parties.find((p) => p.id === state.playerPartyId)!;

  const camSwing = Math.floor(Math.random() * 7) - 3;
  const senSwing = Math.floor(Math.random() * 5) - 2;
  const finalCamYes = clamp(forecast.cameraYes + 22 + camSwing, 0, 400);
  const finalSenYes = clamp(forecast.senatoYes + 11 + senSwing, 0, 200);
  const approved =
    finalCamYes >= forecast.requiredCamera && finalSenYes >= forecast.requiredSenato;

  const nextPendingBills = (state.pendingBills ?? []).filter((b) => b.id !== bill.id);
  const nextAllySatisfaction = { ...(state.allySatisfaction ?? {}) };
  for (const allyId of Object.keys(nextAllySatisfaction)) {
    nextAllySatisfaction[allyId] = clamp(nextAllySatisfaction[allyId] - 8, 0, 100);
  }
  const nextExecutives = state.executives.map((ex) => ({
    ...ex,
    loyalty: clamp(ex.loyalty - 3, 5, 100),
  }));
  const tenseParties = state.parties.map((p) => {
    if (
      p.id !== player.id &&
      p.id !== 'altri' &&
      (!player.coalitionId || p.coalitionId !== player.coalitionId)
    ) {
      return { ...p, relationWithPlayer: clamp(p.relationWithPlayer - 6, -100, 100) };
    }
    return p;
  });

  if (approved) {
    const nextAxis = applyAxisShift(player.axis, law.axisShift);
    const shiftedParties = applyElectoralShift(
      tenseParties.map((p) => (p.id === player.id ? { ...p, axis: nextAxis } : p)),
      player.id,
      law.demoEffects,
      law.regionEffects,
      undefined,
      { weekStartPoll: state.weekStartPlayerPoll ?? player.previousPoll }
    );
    const nextFlags = { ...state.institutionalFlags };
    if (law.grantsFlag) nextFlags[law.grantsFlag] = true;
    const nextIndicators = applyStateEffects(state.stateIndicators, {
      ...law.stateEffects,
      socialStability: (law.stateEffects.socialStability ?? 0) - 3,
      democraticHealth: (law.stateEffects.democraticHealth ?? 0) - 4,
    });
    const nextElectoralLaw = law.electoralLawChange ?? state.electoralLaw;
    const nextEnactedIds = state.enactedLawIds.includes(law.id)
      ? state.enactedLawIds
      : [...state.enactedLawIds, law.id];

    const record: LawVoteRecord = {
      id: uid('vote'),
      lawId: law.id,
      title: `DDL (Fiducia): ${law.title}`,
      week: state.week,
      dateLabel,
      cameraYes: finalCamYes,
      cameraNo: 400 - finalCamYes,
      senatoYes: finalSenYes,
      senatoNo: 200 - finalSenYes,
      outcome: 'approvata',
      instrument: 'ddl',
      confidenceUsed: true,
      summary: `Testo blindato con Questione di Fiducia (${finalCamYes} Cam / ${finalSenYes} Sen): azzerati ${bill.hostileAmendmentsCount} emendamenti ostili, ma logora la coalizione (-8 alleati) e alza la tensione con le opposizioni.`,
    };
    const mediaItem: MediaItem = {
      id: uid('med'),
      week: state.week,
      dateLabel,
      type: 'stampa',
      source: 'Gazzetta Parlamentare',
      headline: `FIDUCIA SUL DDL: "${law.title}" approvato d’imperio, ira delle opposizioni`,
      excerpt: record.summary,
      sentiment: 'neutro',
      partyColor: player.color,
    };

    return {
      nextState: {
        ...state,
        budget: Math.max(0, state.budget + (law.budgetDelta > 0 ? law.budgetDelta : 0)),
        actionsTakenThisWeek: [...state.actionsTakenThisWeek, 'parl_vote_week'],
        parties: shiftedParties,
        executives: nextExecutives,
        allySatisfaction: nextAllySatisfaction,
        pendingBills: nextPendingBills,
        enactedLawIds: nextEnactedIds,
        electoralLaw: nextElectoralLaw,
        institutionalFlags: nextFlags,
        stateIndicators: nextIndicators,
        regimeStatus: deriveRegimeStatus(nextFlags, nextIndicators.democraticHealth),
        lawVoteHistory: [record, ...state.lawVoteHistory].slice(0, 24),
        mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
      },
      feedback: record.summary,
    };
  }

  // Voto di Fiducia respinto -> il Governo cade!
  const updatedParties = applyElectoralShift(tenseParties, player.id, {
    giovani: -0.7,
    lavoratori: -0.7,
    imprese: -0.8,
    pensionati: -0.6,
  }).map((p) => (p.id === player.id ? { ...p, isInGovernment: false } : p));

  const record: LawVoteRecord = {
    id: uid('vote'),
    lawId: law.id,
    title: `DDL (Fiducia Respinta): ${law.title}`,
    week: state.week,
    dateLabel,
    cameraYes: finalCamYes,
    cameraNo: 400 - finalCamYes,
    senatoYes: finalSenYes,
    senatoNo: 200 - finalSenYes,
    outcome: 'respinta',
    instrument: 'ddl',
    confidenceUsed: true,
    summary: `GOVERNO BATTUTO SULLA QUESTIONE DI FIDUCIA (${finalCamYes} Cam / ${finalSenYes} Sen): l’Esecutivo cade e si torna alle urne!`,
  };
  const mediaItem: MediaItem = {
    id: uid('med'),
    week: state.week,
    dateLabel,
    type: 'stampa',
    source: 'EDIZIONE STRAORDINARIA · ANSA',
    headline: `CADE IL GOVERNO: sfiduciato in Aula sul DDL "${law.title}"!`,
    excerpt: record.summary,
    sentiment: 'negativo',
    partyColor: '#F43F5E',
  };

  const collapseIndicators = applyStateEffects(state.stateIndicators, {
    spread: 24,
    socialStability: -9,
  });
  const fallenState: GameState = {
    ...state,
    parties: updatedParties,
    actionsTakenThisWeek: [...state.actionsTakenThisWeek, 'parl_vote_week'],
    executives: nextExecutives,
    pendingBills: nextPendingBills,
    governmentRole: 'opposizione',
    isPrimeMinister: false,
    governmentMinistries: {},
    governmentMinistryExecutives: {},
    allySatisfaction: {},
    leaderApproval: adjustLeaderApproval(state.leaderApproval, player.id, -6),
    stateIndicators: collapseIndicators,
    regimeStatus: deriveRegimeStatus(state.institutionalFlags, collapseIndicators.democraticHealth),
    lawVoteHistory: [record, ...state.lawVoteHistory].slice(0, 24),
    mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
  };

  return {
    nextState: state.election ? fallenState : triggerElectionNight(fallenState),
    feedback: record.summary,
    triggeredCollapse: true,
  };
}

/** Avvia una Commissione Parlamentare d'Inchiesta */
export function launchInquiryCommission(
  state: GameState,
  topicId: string
): { nextState: GameState; feedback: string; error?: string } {
  if (getPlayerParliamentSeats(state).isExtraParliamentary) {
    return {
      nextState: state,
      feedback: '',
      error: 'Solo i partiti presenti in Parlamento possono istituire una Commissione d’Inchiesta.',
    };
  }
  if (state.actionsTakenThisWeek.includes('parl_inquiry_week')) {
    return {
      nextState: state,
      feedback: '',
      error: 'Hai già istituito una Commissione d’Inchiesta questa settimana.',
    };
  }
  const activeList = state.activeCommissions ?? [];
  if (activeList.length >= 2) {
    return {
      nextState: state,
      feedback: '',
      error: 'Sono già attive 2 Commissioni d’Inchiesta contemporaneamente.',
    };
  }
  const topic = INQUIRY_COMMISSION_TOPICS.find((t) => t.id === topicId);
  if (!topic) {
    return { nextState: state, feedback: '', error: 'Tema di inchiesta non valido.' };
  }
  if (activeList.some((c) => c.topicId === topic.id)) {
    return {
      nextState: state,
      feedback: '',
      error: 'Questa Commissione d’Inchiesta è già operativa in Parlamento.',
    };
  }
  const cost = INQUIRY_COMMISSION_COST;
  if (state.budget < cost) {
    return {
      nextState: state,
      feedback: '',
      error: `Servono €${cost.toLocaleString('it-IT')} per dossier legali e comunicazione della Commissione.`,
    };
  }

  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const dateLabel = formatGameDate(state.week).shortLabel;
  const newComm: InquiryCommission = {
    id: uid('comm'),
    topicId: topic.id,
    title: topic.title,
    targetArea: topic.targetArea,
    startedAtWeek: state.week,
    durationWeeks: topic.durationWeeks,
    weeksRemaining: topic.durationWeeks,
    promotedByPlayer: true,
    sponsorPartyName: player.acronym,
    mediaPressure: 65,
    status: 'attiva',
  };

  const mediaItem: MediaItem = {
    id: uid('med'),
    week: state.week,
    dateLabel,
    type: 'stampa',
    source: 'Montecitorio · Commissioni',
    headline: `${player.acronym} avvia la ${topic.title}`,
    excerpt: `${topic.description} La relazione conclusiva è attesa tra ${topic.durationWeeks} settimane.`,
    sentiment: 'positivo',
    partyColor: player.color,
  };

  return {
    nextState: {
      ...state,
      budget: state.budget - cost,
      activeCommissions: [newComm, ...activeList],
      actionsTakenThisWeek: [...state.actionsTakenThisWeek, 'parl_inquiry_week'],
      mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
    },
    feedback: `Avviata "${topic.title}": relazione finale attesa tra ${topic.durationWeeks} settimane.`,
  };
}

// ============================================================================
// QUIRINALE & ELEZIONE DEL PRESIDENTE DELLA REPUBBLICA (658 GRANDI ELETTORI)
// ============================================================================

export const QUIRINALE_TOTAL_ELECTORS = 658; // 400 Camera + 200 Senato + 58 Delegati Regionali
export const QUIRINALE_TWO_THIRDS_THRESHOLD = 439; // 2/3 nei primi 3 scrutini
export const QUIRINALE_ABSOLUTE_THRESHOLD = 330; // 50% + 1 dal 4° scrutinio

export const DEFAULT_QUIRINALE_CANDIDATES: QuirinaleCandidate[] = [
  {
    id: 'q_cartabia',
    name: 'Marta Cartabia',
    roleLabel: 'Ex Presidente Corte Costituzionale',
    area: 'istituzionale',
    bio: 'Profilo di altissima garanzia costituzionale, capace di raccogliere convergenze trasversali dal 4° scrutinio.',
    axis: { economic: 10, society: 20, europe: 75, institutions: -88 },
    institutionalPrestige: 92,
  },
  {
    id: 'q_draghi',
    name: 'Mario Draghi',
    roleLabel: 'Ex Presidente BCE ed Ex Premier',
    area: 'centro',
    bio: 'Massima credibilità sui mercati e a Bruxelles; apprezzato dal centro riformista e moderato, inviso ai sovranisti.',
    axis: { economic: 58, society: 25, europe: 95, institutions: -78 },
    institutionalPrestige: 95,
  },
  {
    id: 'q_casini',
    name: 'Pier Ferdinando Casini',
    roleLabel: 'Ex Presidente della Camera',
    area: 'istituzionale',
    bio: 'Mediatore parlamentare di lungo corso, gradito sia ai moderati di centrodestra sia ai riformisti.',
    axis: { economic: 22, society: -10, europe: 70, institutions: -82 },
    institutionalPrestige: 84,
  },
  {
    id: 'q_tremonti',
    name: 'Giulio Tremonti',
    roleLabel: 'Ex Ministro dell’Economia',
    area: 'centrodestra',
    bio: 'Candidato d’area centrodestra, sensibile a sovranità fiscale e interesse nazionale.',
    axis: { economic: 35, society: -45, europe: -35, institutions: -30 },
    institutionalPrestige: 74,
  },
  {
    id: 'q_franceschini',
    name: 'Dario Franceschini',
    roleLabel: 'Ex Ministro ed Esponente PD',
    area: 'centrosinistra',
    bio: 'Figura di mediazione del Campo Largo, forte sostegno nell’area progressista e centrosinistra.',
    axis: { economic: -35, society: 55, europe: 78, institutions: -76 },
    institutionalPrestige: 76,
  },
  {
    id: 'q_pera',
    name: 'Marcello Pera',
    roleLabel: 'Ex Presidente del Senato',
    area: 'sovranista',
    bio: 'Profilo conservatore identitario, sostenuto dalle forze sovraniste e dalla destra parlamentare.',
    axis: { economic: 48, society: -74, europe: -60, institutions: -18 },
    institutionalPrestige: 70,
  },
];

/** Calcola i Grandi Elettori per ciascun partito (Camera 400 + Senato 200 + 58 Delegati Regionali = 658) */
export function calculateQuirinaleElectorsByParty(
  parties: PartyState[],
  _electoralLaw: ElectoralLawId,
  legislatureSeats?: SeatAllocation[]
): Record<string, number> {
  const seats = getCurrentParliamentSeats({ legislatureSeats, parties });
  const electors: Record<string, number> = {};
  for (const s of seats) {
    electors[s.partyId] = (electors[s.partyId] ?? 0) + s.camera + s.senato;
  }

  // 58 Delegati Regionali (3 per ciascuna delle 19 regioni + 1 per la Valle d'Aosta = 58)
  const activeParties = parties.filter((p) => p.id !== 'altri');
  for (const reg of ITALIAN_REGIONS) {
    const regCount = reg.id === 'valle_daosta' ? 1 : 3;
    const ranked = [...activeParties].sort(
      (a, b) => (b.regionPolls?.[reg.id] ?? b.nationalPoll) - (a.regionPolls?.[reg.id] ?? a.nationalPoll)
    );
    if (ranked.length === 0) continue;
    if (regCount === 1) {
      electors[ranked[0].id] = (electors[ranked[0].id] ?? 0) + 1;
    } else {
      // 2 alla maggioranza regionale (primo partito) + 1 all'opposizione regionale (secondo partito)
      electors[ranked[0].id] = (electors[ranked[0].id] ?? 0) + 2;
      const second = ranked[1] ?? ranked[0];
      electors[second.id] = (electors[second.id] ?? 0) + 1;
    }
  }

  return electors;
}

export function startQuirinaleElection(state: GameState): GameState {
  if (state.quirinaleElection?.active) return state;
  const dateLabel = formatGameDate(state.week).shortLabel;
  const electionState: QuirinaleElectionState = {
    active: true,
    triggeredAtWeek: state.week,
    ballotNumber: 1,
    totalElectors: QUIRINALE_TOTAL_ELECTORS,
    requiredMajority: QUIRINALE_TWO_THIRDS_THRESHOLD,
    candidates: DEFAULT_QUIRINALE_CANDIDATES.map((c) => ({ ...c, axis: { ...c.axis } })),
    negotiatedPartyIds: [],
    negotiatedCandidateMap: {},
    playerSupportedCandidateId: DEFAULT_QUIRINALE_CANDIDATES[0].id,
    ballotHistory: [],
  };
  const mediaItem: MediaItem = {
    id: uid('med'),
    week: state.week,
    dateLabel,
    type: 'stampa',
    source: 'Quirinale · Seduta Comune',
    headline:
      'CORSIA AL COLLE: Parlamento convocato in Seduta Comune (658 Grandi Elettori) per il nuovo Capo dello Stato',
    excerpt:
      'Nei primi 3 scrutini serve la maggioranza dei 2/3 (439 voti); dal 4° scrutinio basta la maggioranza assoluta (330 voti).',
    sentiment: 'neutro',
    partyColor: '#F59E0B',
  };
  return {
    ...state,
    quirinaleElection: electionState,
    mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
  };
}

export function proposeCustomQuirinaleCandidate(
  state: GameState,
  candidateName: string,
  area: QuirinaleCandidate['area']
): { nextState: GameState; feedback: string; error?: string } {
  const qe = state.quirinaleElection;
  if (!qe || !qe.active || qe.electedCandidate) {
    return { nextState: state, feedback: '', error: 'Nessuna elezione del Quirinale attiva.' };
  }
  const cleanName = sanitizePlainText(candidateName, 44, '');
  if (cleanName.length < 4) {
    return {
      nextState: state,
      feedback: '',
      error: 'Inserisci nome e cognome validi (almeno 4 caratteri).',
    };
  }
  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const newCand: QuirinaleCandidate = {
    id: uid('qcand'),
    name: cleanName,
    roleLabel: `Candidatura proposta da ${player.acronym}`,
    area,
    bio: `Personalità proposta da ${player.name} per guidare il Quirinale nel prossimo settennato.`,
    axis: { ...player.axis },
    institutionalPrestige: area === 'istituzionale' ? 80 : 68,
    proposedByPlayer: true,
  };
  return {
    nextState: {
      ...state,
      quirinaleElection: {
        ...qe,
        candidates: [newCand, ...qe.candidates],
        playerSupportedCandidateId: newCand.id,
      },
    },
    feedback: `Candidatura di ${cleanName} depositata per la Seduta Comune.`,
  };
}

export function negotiateQuirinaleSupport(
  state: GameState,
  targetPartyId: string,
  candidateId: string
): { nextState: GameState; feedback: string; error?: string } {
  const qe = state.quirinaleElection;
  if (!qe || !qe.active || qe.electedCandidate) {
    return { nextState: state, feedback: '', error: 'Nessuna votazione Quirinale in corso.' };
  }
  const candidate = qe.candidates.find((c) => c.id === candidateId);
  const targetParty = state.parties.find((p) => p.id === targetPartyId);
  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  if (!candidate || !targetParty || targetParty.id === player.id) {
    return { nextState: state, feedback: '', error: 'Partito o candidato non valido.' };
  }
  if (qe.negotiatedPartyIds.includes(targetPartyId)) {
    return {
      nextState: state,
      feedback: '',
      error: `Hai già concluso l’intesa al Quirinale con ${targetParty.acronym}.`,
    };
  }
  const cost = 10000;
  if (state.budget < cost) {
    return {
      nextState: state,
      feedback: '',
      error: `Servono €${cost.toLocaleString('it-IT')} per gestire i vertici riservati di trattativa.`,
    };
  }

  const dist =
    Math.abs(targetParty.axis.economic - candidate.axis.economic) +
    Math.abs(targetParty.axis.society - candidate.axis.society) +
    Math.abs(targetParty.axis.europe - candidate.axis.europe);
  const affinity = clamp(100 - Math.round(dist / 5.5), 5, 100);
  const isAlly =
    Boolean(player.coalitionId) && targetParty.coalitionId === player.coalitionId;
  const acceptanceScore =
    affinity +
    (isAlly ? 22 : 0) +
    Math.round(targetParty.relationWithPlayer * 0.3) +
    (candidate.area === 'istituzionale' ? 16 : 0) +
    (qe.ballotNumber >= 4 ? 12 : 0);

  if (acceptanceScore < 62) {
    return {
      nextState: {
        ...state,
        budget: state.budget - Math.round(cost * 0.5),
      },
      feedback: `${targetParty.name} rifiuta l’accordo su ${candidate.name}: distanza politica troppo elevata (prova un profilo più istituzionale o un altro partito).`,
    };
  }

  const updatedParties = state.parties.map((p) =>
    p.id === targetPartyId
      ? { ...p, relationWithPlayer: clamp(p.relationWithPlayer + 6, -100, 100) }
      : p
  );

  return {
    nextState: {
      ...state,
      budget: state.budget - cost,
      parties: updatedParties,
      quirinaleElection: {
        ...qe,
        negotiatedPartyIds: [...qe.negotiatedPartyIds, targetPartyId],
        negotiatedCandidateMap: {
          ...qe.negotiatedCandidateMap,
          [targetPartyId]: candidateId,
        },
        playerSupportedCandidateId: candidateId,
      },
    },
    feedback: `Intesa raggiunta! I Grandi Elettori di ${targetParty.name} (${targetParty.acronym}) convergeranno su ${candidate.name} (+6 rapporti).`,
  };
}

export function runQuirinaleBallot(
  state: GameState,
  supportedCandidateId: string
): { nextState: GameState; feedback: string; error?: string } {
  const qe = state.quirinaleElection;
  if (!qe || !qe.active || qe.electedCandidate) {
    return { nextState: state, feedback: '', error: 'Nessuna votazione Quirinale in corso.' };
  }
  const chosenCand = qe.candidates.find((c) => c.id === supportedCandidateId);
  if (!chosenCand) {
    return { nextState: state, feedback: '', error: 'Seleziona un candidato prima della chiama.' };
  }

  const electorsByParty = calculateQuirinaleElectorsByParty(
    state.parties,
    state.electoralLaw,
    state.legislatureSeats
  );
  const tallies: Record<string, number> = {};
  for (const c of qe.candidates) tallies[c.id] = 0;
  let blankVotes = 0;

  const ballot = qe.ballotNumber;
  const required = ballot <= 3 ? QUIRINALE_TWO_THIRDS_THRESHOLD : QUIRINALE_ABSOLUTE_THRESHOLD;
  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const institutionalCompromise =
    qe.candidates.find((c) => c.id === 'q_cartabia') ??
    qe.candidates.find((c) => c.area === 'istituzionale') ??
    qe.candidates[0];

  for (const p of state.parties) {
    const count = electorsByParty[p.id] ?? 0;
    if (count <= 0) continue;

    if (p.id === player.id) {
      // Piccola quota di franchi tiratori interni se la coesione è bassa
      const cohesion = calculatePartyCohesion(state.executives);
      const sniperRate = cohesion < 50 ? 0.14 : cohesion < 68 ? 0.05 : 0.02;
      const snipers = Math.round(count * sniperRate);
      tallies[chosenCand.id] += Math.max(0, count - snipers);
      blankVotes += snipers;
      continue;
    }

    // Dal 10° scrutinio in poi scatta la convergenza d'emergenza per evitare uno stallo infinito
    if (ballot >= 10) {
      const emergencyTarget =
        chosenCand.area === 'istituzionale' &&
        (qe.negotiatedPartyIds.includes(p.id) || p.relationWithPlayer >= 10)
          ? chosenCand.id
          : institutionalCompromise.id;
      tallies[emergencyTarget] += count;
      continue;
    }

    // Se negoziato col giocatore, rispetta l'intesa (salvo ~6% franchi tiratori)
    const negotiatedCandId = qe.negotiatedCandidateMap[p.id];
    if (negotiatedCandId && tallies[negotiatedCandId] !== undefined) {
      const snipers = Math.round(count * 0.06);
      tallies[negotiatedCandId] += Math.max(0, count - snipers);
      blankVotes += snipers;
      continue;
    }

    // Nei primi 2 scrutini molti partiti votano scheda bianca tattica per sondare i numeri
    if (ballot <= 2 && Math.random() < 0.35) {
      blankVotes += count;
      continue;
    }

    // Dal 5° scrutinio in poi cresce la convergenza trasversale (fino al 96% dall'8° scrutinio)
    const convergenceChance = ballot >= 8 ? 0.96 : Math.min(0.85, (ballot - 4) * 0.25);
    if (ballot >= 5 && Math.random() < convergenceChance) {
      const winnerBias =
        chosenCand.area === 'istituzionale' && p.relationWithPlayer >= 0
          ? chosenCand.id
          : institutionalCompromise.id;
      tallies[winnerBias] += count;
      continue;
    }

    // Altrimenti ogni partito vota il candidato ideologicamente più vicino
    let bestCand = qe.candidates[0];
    let bestScore = -999;
    for (const c of qe.candidates) {
      const dist =
        Math.abs(p.axis.economic - c.axis.economic) +
        Math.abs(p.axis.society - c.axis.society) +
        Math.abs(p.axis.europe - c.axis.europe);
      const score =
        100 -
        dist / 5 +
        c.institutionalPrestige * (ballot >= 4 ? 0.35 : 0.15) +
        (Boolean(player.coalitionId) && p.coalitionId === player.coalitionId && c.id === chosenCand.id
          ? 24
          : 0);
      if (score > bestScore) {
        bestScore = score;
        bestCand = c;
      }
    }
    const snipers = Math.round(count * 0.05);
    tallies[bestCand.id] += Math.max(0, count - snipers);
    blankVotes += snipers;
  }

  // Trova il più votato
  const ranked = Object.entries(tallies).sort((a, b) => b[1] - a[1]);
  const [topId, topVotes] = ranked[0] ?? ['', 0];
  const winner = topVotes >= required ? qe.candidates.find((c) => c.id === topId) : undefined;
  const dateLabel = formatGameDate(state.week).shortLabel;

  const ballotResult: QuirinaleBallotResult = {
    ballotNumber: ballot,
    requiredMajority: required,
    tallies,
    blankVotes,
    winnerId: winner?.id,
    summary: winner
      ? `${winner.name} eletto Presidente della Repubblica al ${ballot}° scrutinio con ${topVotes}/${QUIRINALE_TOTAL_ELECTORS} voti (soglia ${required})!`
      : `Fumata nera al ${ballot}° scrutinio (soglia ${required}): in testa ${
          qe.candidates.find((c) => c.id === topId)?.name ?? 'Nessuno'
        } con ${topVotes} voti · ${blankVotes} schede bianche.`,
  };

  if (winner) {
    const playerBackedWinner = winner.id === chosenCand.id;
    const isBroadInstitutional = winner.area === 'istituzionale' || winner.area === 'centro';
    const externalNegotiatedIds = qe.negotiatedPartyIds.filter((pid) => {
      const p = state.parties.find((party) => party.id === pid);
      if (!p) return false;
      return !player.coalitionId || p.coalitionId !== player.coalitionId;
    });
    const usedCrossPartyDeal = externalNegotiatedIds.length > 0;

    const nextIndicators = applyStateEffects(state.stateIndicators, {
      democraticHealth:
        (isBroadInstitutional ? 6 : -2) + (playerBackedWinner && usedCrossPartyDeal ? 3 : 0),
      spread: winner.id === 'q_draghi' ? -18 : isBroadInstitutional ? -6 : 8,
      socialStability: playerBackedWinner ? (usedCrossPartyDeal ? 5 : 2) : -3,
    });
    const nextAllySatisfaction = { ...(state.allySatisfaction ?? {}) };
    for (const allyId of Object.keys(nextAllySatisfaction)) {
      nextAllySatisfaction[allyId] = clamp(
        nextAllySatisfaction[allyId] +
          (playerBackedWinner ? (usedCrossPartyDeal ? 4 : 6) : -8),
        0,
        100
      );
    }
    const nextParties = state.parties.map((p) => {
      if (p.id === player.id || p.id === 'altri') return p;
      const isCoalitionAlly = Boolean(player.coalitionId && p.coalitionId === player.coalitionId);
      if (playerBackedWinner) {
        if (usedCrossPartyDeal && externalNegotiatedIds.includes(p.id)) {
          return { ...p, relationWithPlayer: clamp(p.relationWithPlayer + 4, -100, 100) };
        }
        if (!usedCrossPartyDeal && !isCoalitionAlly) {
          return { ...p, relationWithPlayer: clamp(p.relationWithPlayer - 5, -100, 100) };
        }
      }
      return p;
    });
    const nextLeaderApproval = adjustLeaderApproval(
      state.leaderApproval,
      player.id,
      playerBackedWinner ? 4 : -4
    );

    const outcomeSummary = playerBackedWinner
      ? usedCrossPartyDeal
        ? `Accordo Trasversale riuscito: ${winner.name} sale al Quirinale con l’intesa istituzionale costruita da ${player.acronym} (+3 tenuta democratica, +4 rapporti con i gruppi firmatari).`
        : `Vittoria alla conta: ${winner.name} viene eletto Capo dello Stato a colpi di maggioranza con ${player.acronym} (+6 coesione alleati, ma -5 rapporti con le opposizioni).`
      : `Sconfitta alla conta sul Colle: ${winner.name} è il nuovo Presidente della Repubblica senza il voto decisivo di ${player.acronym} (-8 soddisfazione alleati, -4 gradimento leader).`;

    const mediaItem: MediaItem = {
      id: uid('med'),
      week: state.week,
      dateLabel,
      type: 'stampa',
      source: 'Quirinale · Edizione Straordinaria',
      headline: `HABEMUS PRAESIDEM: ${winner.name} eletto Capo dello Stato al ${ballot}° scrutinio (${topVotes} voti)`,
      excerpt: outcomeSummary,
      sentiment: playerBackedWinner ? 'positivo' : 'neutro',
      partyColor: playerBackedWinner ? '#10B981' : '#F59E0B',
    };

    return {
      nextState: {
        ...state,
        parties: nextParties,
        currentPresidentName: winner.name,
        quirinaleTermEndWeek: state.week + 336, // Prossimo settennato (7 anni * 48 settimane)
        stateIndicators: nextIndicators,
        allySatisfaction: nextAllySatisfaction,
        leaderApproval: nextLeaderApproval,
        quirinaleElection: {
          ...qe,
          playerSupportedCandidateId: chosenCand.id,
          ballotHistory: [ballotResult, ...qe.ballotHistory],
          electedCandidate: winner,
          outcomeSummary,
        },
        mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
      },
      feedback: ballotResult.summary,
    };
  }

  const nextBallot = ballot + 1;
  const nextRequired =
    nextBallot <= 3 ? QUIRINALE_TWO_THIRDS_THRESHOLD : QUIRINALE_ABSOLUTE_THRESHOLD;

  return {
    nextState: {
      ...state,
      quirinaleElection: {
        ...qe,
        ballotNumber: nextBallot,
        requiredMajority: nextRequired,
        playerSupportedCandidateId: chosenCand.id,
        ballotHistory: [ballotResult, ...qe.ballotHistory],
      },
    },
    feedback: ballotResult.summary,
  };
}

export function closeQuirinaleElection(state: GameState): GameState {
  if (!state.quirinaleElection?.electedCandidate) return state;
  return {
    ...state,
    quirinaleElection: null,
  };
}

// ============================================================================
// TESSERAMENTO ANNUALE, RACCOLTA FONDI TRASPARENTE (2x1000) & SCANDALI MIRATI
// ============================================================================

export function createInitialFundraisingState(
  nationalPoll: number,
  openHqCount: number
): FundraisingState {
  const baseMembers = Math.max(
    450,
    Math.round(nationalPoll * 3200 + openHqCount * 850)
  );
  return {
    lastMembershipCampaignWeek: 0,
    activeMembersCount: baseMembers,
    twoPerThousandLastClaimWeek: 0,
    lastFundraisingEventWeek: 0,
    totalRaisedCampaigns: 0,
    transparentLedger: [],
  };
}

export const MEMBERSHIP_CAMPAIGN_COOLDOWN_WEEKS = 12;
export const TWO_PER_THOUSAND_COOLDOWN_WEEKS = 16;
export const FUNDRAISER_EVENT_COOLDOWN_WEEKS = 4;

/** Stima trasparente della Campagna di Tesseramento annuale (nuovi iscritti e gettito) */
export function estimateMembershipCampaign(state: GameState): { newMembers: number; amount: number } {
  const player = state.parties.find((p) => p.id === state.playerPartyId);
  const nationalPoll = player?.nationalPoll ?? 1;
  const traits = getActiveTraitProfile(state);
  const newMembers = Math.round(
    (650 + nationalPoll * 480 + state.openHeadquarters.length * 360) * traits.membershipMult
  );
  const amount = Math.round((14000 + newMembers * 6.8) * traits.fundraisingMult);
  return { newMembers, amount };
}

/** Stima trasparente della quota 2×1000 IRPEF basata sul peso elettorale e parlamentare del partito */
export function estimateTwoPerThousandQuota(state: GameState): {
  amount: number;
  eligible: boolean;
  seatCount: number;
} {
  const player = state.parties.find((p) => p.id === state.playerPartyId);
  const nationalPoll = player?.nationalPoll ?? 0;
  const seatInfo = getPlayerParliamentSeats(state);
  const eligible = !seatInfo.isExtraParliamentary || nationalPoll >= 1.0;
  const amount = seatInfo.isExtraParliamentary
    ? Math.round(3200 + Math.min(nationalPoll, 12) * 1850)
    : Math.round(14000 + nationalPoll * 4800 + seatInfo.total * 380);
  return { amount, eligible, seatCount: seatInfo.total };
}

/** Stima trasparente del gettito di un evento di autofinanziamento o crowdfunding */
export function estimateFundraiserRevenue(state: GameState, kind: 'donazioni' | 'cena'): number {
  const player = state.parties.find((p) => p.id === state.playerPartyId);
  const nationalPoll = player?.nationalPoll ?? 1;
  const giovani = player?.demographics.giovani ?? 1;
  const imprese = player?.demographics.imprese ?? 1;
  const traits = getActiveTraitProfile(state);
  const seatInfo = getPlayerParliamentSeats(state);
  const statusScale = seatInfo.isExtraParliamentary ? 0.55 : seatInfo.total < 25 ? 0.8 : 1.0;
  const socialBonus =
    kind === 'donazioni' && state.leader.traits.includes('maestro_social') ? 1.15 : 1;
  return kind === 'donazioni'
    ? Math.round(
        (10500 + nationalPoll * 1700 + giovani * 680) *
          statusScale *
          traits.fundraisingMult *
          socialBonus
      )
    : Math.round(
        (15500 + nationalPoll * 2100 + imprese * 1050) * statusScale * traits.fundraisingMult
      );
}

export function launchAnnualMembershipCampaign(
  state: GameState
): { nextState: GameState; feedback: string; error?: string } {
  const f = state.fundraising ?? createInitialFundraisingState(
    state.parties.find((p) => p.id === state.playerPartyId)?.nationalPoll ?? 1,
    state.openHeadquarters.length
  );
  const weeksElapsed = state.week - f.lastMembershipCampaignWeek;
  if (f.lastMembershipCampaignWeek > 0 && weeksElapsed < MEMBERSHIP_CAMPAIGN_COOLDOWN_WEEKS) {
    return {
      nextState: state,
      feedback: '',
      error: `Campagna di Tesseramento già svolta di recente: disponibile tra ${MEMBERSHIP_CAMPAIGN_COOLDOWN_WEEKS - weeksElapsed} settimane.`,
    };
  }

  const { newMembers, amount } = estimateMembershipCampaign(state);
  const dateLabel = formatGameDate(state.week).shortLabel;

  const entry = {
    id: uid('fund'),
    week: state.week,
    dateLabel,
    source: `Campagna Tesseramento (+${newMembers.toLocaleString('it-IT')} iscritti)`,
    amount,
  };

  return {
    nextState: {
      ...state,
      budget: state.budget + amount,
      executives: state.executives.map((ex) => ({
        ...ex,
        loyalty: clamp(ex.loyalty + 4, 5, 100),
      })),
      fundraising: {
        ...f,
        lastMembershipCampaignWeek: state.week,
        activeMembersCount: f.activeMembersCount + newMembers,
        totalRaisedCampaigns: f.totalRaisedCampaigns + amount,
        transparentLedger: [entry, ...f.transparentLedger].slice(0, 15),
      },
    },
    feedback: `Tesseramento riuscito: +${newMembers.toLocaleString('it-IT')} nuovi iscritti, +€${amount.toLocaleString('it-IT')} in cassa e +4 lealtà dirigenza.`,
  };
}

export function claimTwoPerThousandFunds(
  state: GameState
): { nextState: GameState; feedback: string; error?: string } {
  const f = state.fundraising ?? createInitialFundraisingState(
    state.parties.find((p) => p.id === state.playerPartyId)?.nationalPoll ?? 1,
    state.openHeadquarters.length
  );
  const weeksElapsed = state.week - f.twoPerThousandLastClaimWeek;
  if (f.twoPerThousandLastClaimWeek > 0 && weeksElapsed < TWO_PER_THOUSAND_COOLDOWN_WEEKS) {
    return {
      nextState: state,
      feedback: '',
      error: `Ripartizione 2×1000 IRPEF già incassata: prossima tranche tra ${TWO_PER_THOUSAND_COOLDOWN_WEEKS - weeksElapsed} settimane.`,
    };
  }
  const quota = estimateTwoPerThousandQuota(state);
  if (!quota.eligible) {
    return {
      nextState: state,
      feedback: '',
      error: 'Per accedere al riparto 2×1000 IRPEF serve almeno l’1,0% di radicamento o un seggio in Parlamento.',
    };
  }

  const amount = quota.amount;
  const dateLabel = formatGameDate(state.week).shortLabel;
  const entry = {
    id: uid('fund'),
    week: state.week,
    dateLabel,
    source: 'Riparto Trasparente 2×1000 IRPEF (Agenzia Entrate)',
    amount,
  };

  return {
    nextState: {
      ...state,
      budget: state.budget + amount,
      fundraising: {
        ...f,
        twoPerThousandLastClaimWeek: state.week,
        totalRaisedCampaigns: f.totalRaisedCampaigns + amount,
        transparentLedger: [entry, ...f.transparentLedger].slice(0, 15),
      },
    },
    feedback: `Incassata la quota certificata 2×1000 IRPEF: +€${amount.toLocaleString('it-IT')} a bilancio trasparente.`,
  };
}

export function hostTransparentFundraiser(
  state: GameState,
  kind: 'donazioni' | 'cena'
): { nextState: GameState; feedback: string; error?: string } {
  const f = state.fundraising ?? createInitialFundraisingState(
    state.parties.find((p) => p.id === state.playerPartyId)?.nationalPoll ?? 1,
    state.openHeadquarters.length
  );
  const weeksElapsed = state.week - f.lastFundraisingEventWeek;
  if (f.lastFundraisingEventWeek > 0 && weeksElapsed < FUNDRAISER_EVENT_COOLDOWN_WEEKS) {
    return {
      nextState: state,
      feedback: '',
      error: `Hai già tenuto un evento di raccolta fondi: attendi ${FUNDRAISER_EVENT_COOLDOWN_WEEKS - weeksElapsed} settimane.`,
    };
  }

  const amount = estimateFundraiserRevenue(state, kind);
  const dateLabel = formatGameDate(state.week).shortLabel;
  const label =
    kind === 'donazioni'
      ? 'Crowdfunding & Micro-donazioni Trasparenti'
      : 'Cena di Finanziamento & Sostenitori (Rendiconto Pubblico)';
  const entry = {
    id: uid('fund'),
    week: state.week,
    dateLabel,
    source: label,
    amount,
  };

  return {
    nextState: {
      ...state,
      budget: state.budget + amount,
      fundraising: {
        ...f,
        lastFundraisingEventWeek: state.week,
        totalRaisedCampaigns: f.totalRaisedCampaigns + amount,
        transparentLedger: [entry, ...f.transparentLedger].slice(0, 15),
      },
    },
    feedback: `${label}: raccolti +€${amount.toLocaleString('it-IT')} con rendicontazione trasparente.`,
  };
}

/** Stima della Colletta Volontari a costo zero (€0), sempre disponibile 1 volta/settimana contro ogni soft-lock */
export function estimateEmergencyVolunteerFundraiser(state: GameState): number {
  const player = state.parties.find((p) => p.id === state.playerPartyId);
  const poll = Math.max(0, player?.nationalPoll ?? 0);
  const traits = getActiveTraitProfile(state);
  const raw = Math.min(
    14000,
    Math.round(3200 + poll * 340 + state.openHeadquarters.length * 450)
  );
  return Math.max(3000, Math.round(raw * traits.fundraisingMult));
}

/**
 * Autofinanziamento Volontari a costo zero (€0): sempre eseguibile anche con cassa a €0 o in deficit,
 * 1 volta a settimana, indipendente dai cooldown degli altri eventi di raccolta fondi.
 */
export function runEmergencyVolunteerFundraiser(
  state: GameState
): { nextState: GameState; feedback: string; error?: string } {
  if (state.actionsTakenThisWeek.includes(EMERGENCY_FUNDRAISER_ACTION_KEY)) {
    return {
      nextState: state,
      feedback: '',
      error: 'I volontari hanno già concluso la colletta settimanale di autofinanziamento. Riprova la prossima settimana.',
    };
  }

  const f =
    state.fundraising ??
    createInitialFundraisingState(
      state.parties.find((p) => p.id === state.playerPartyId)?.nationalPoll ?? 1,
      state.openHeadquarters.length
    );

  const amount = estimateEmergencyVolunteerFundraiser(state);
  const dateLabel = formatGameDate(state.week).shortLabel;
  const entry = {
    id: uid('fund'),
    week: state.week,
    dateLabel,
    source: 'Colletta Volontari & Autofinanziamento di Base (€0)',
    amount,
  };

  return {
    nextState: {
      ...state,
      budget: state.budget + amount,
      actionsTakenThisWeek: [...state.actionsTakenThisWeek, EMERGENCY_FUNDRAISER_ACTION_KEY],
      fundraising: {
        ...f,
        totalRaisedCampaigns: f.totalRaisedCampaigns + amount,
        transparentLedger: [entry, ...f.transparentLedger].slice(0, 15),
      },
      actionLog: [
        {
          id: uid('act'),
          week: state.week,
          category: 'Autofinanziamento',
          title: 'Colletta Volontari (€0)',
          cost: 0,
          summary: `Raccolti +€${amount.toLocaleString('it-IT')} tramite autofinanziamento di base senza spese di cassa.`,
        },
        ...state.actionLog,
      ].slice(0, 30),
    },
    feedback: `Colletta Volontari (€0): raccolti +€${amount.toLocaleString('it-IT')} in cassa senza alcun costo operativo.`,
  };
}

function buildTargetedExecutiveScandal(
  week: number,
  executives: ExecutiveMember[],
  ministryExecs: Partial<Record<MinistryId, string>>
): ExecutiveScandal {
  const exec = executives[Math.floor(Math.random() * executives.length)];
  const heldMinistryEntry = Object.entries(ministryExecs).find(
    ([, assignedId]) => assignedId === exec.id
  );
  const ministryId = heldMinistryEntry ? (heldMinistryEntry[0] as MinistryId) : undefined;
  const ministry = ministryId ? getMinistryById(ministryId) : undefined;

  const templates = [
    {
      title: 'Indagine della Procura su consulenze e appalti pubblici',
      summary: `${exec.name} (${ministry ? `Ministro ${ministry.shortName}` : exec.roleLabel}) risulta iscritto nel registro degli indagati per presunto traffico di influenze e affidamenti diretti. I media chiedono una tua scelta immediata.`,
      severity: 'Critica' as const,
    },
    {
      title: 'Esposto della Corte dei Conti su rimborsi e fondazione collegata',
      summary: `Un’inchiesta giornalistica e un fascicolo contabile coinvolgono ${exec.name} (${ministry ? `Ministro ${ministry.shortName}` : exec.roleLabel}) per spese non rendicontate. Le opposizioni invocano le dimissioni.`,
      severity: 'Alta' as const,
    },
    {
      title: 'Intercettazioni su nomine e pressioni in enti partecipati',
      summary: `Pubblicati stralci di conversazioni che coinvolgono ${exec.name} (${ministry ? `Ministro ${ministry.shortName}` : exec.roleLabel}) in trattative su nomine pubbliche. Alta pressione nei talk show serali.`,
      severity: 'Critica' as const,
    },
  ];
  const tpl = templates[week % templates.length];

  return {
    id: uid('scand'),
    execId: exec.id,
    execName: exec.name,
    execRoleLabel: ministry ? `Ministro ${ministry.shortName}` : exec.roleLabel,
    ministryId,
    title: tpl.title,
    summary: tpl.summary,
    severity: tpl.severity,
    week,
  };
}

/** Risolve uno scandalo giudiziario mirato su un dirigente o ministro: Difendi a oltranza vs Chiedi dimissioni/sospensione */
export function resolveExecutiveScandal(
  state: GameState,
  decision: 'difendi' | 'dimissioni'
): { nextState: GameState; feedback: string; error?: string } {
  const scandal = state.activeScandal;
  if (!scandal) {
    return { nextState: state, feedback: '', error: 'Nessuna indagine attiva sui dirigenti.' };
  }
  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const dateLabel = formatGameDate(state.week).shortLabel;
  const traits = getActiveTraitProfile(state);
  const shieldFactor =
    traits.scandalShieldMult * (state.institutionalFlags.judiciaryControl ? 0.5 : 1);

  if (decision === 'difendi') {
    const drop = round1((scandal.severity === 'Critica' ? -0.9 : -0.6) * shieldFactor);
    const updatedParties = applyElectoralShift(
      state.parties,
      player.id,
      {
        giovani: drop,
        lavoratori: drop * 0.9,
        imprese: drop * 0.7,
        pensionati: drop * 0.8,
      },
      undefined,
      undefined,
      { bypassInertia: true }
    );
    const updatedExecs = state.executives.map((ex) => ({
      ...ex,
      loyalty: clamp(ex.loyalty + (ex.id === scandal.execId ? 12 : 6), 5, 100),
    }));
    const mediaItem: MediaItem = {
      id: uid('med'),
      week: state.week,
      dateLabel,
      type: 'stampa',
      source: 'Prima Pagina · Politica',
      headline: `${state.leader.name} fa quadrato su ${scandal.execName}: "Garantismo, nessuna dimissione"`,
      excerpt: `La scelta di difendere a oltranza compatta la dirigenza interna (+6 lealtà), ma alimenta gli attacchi mediatici e pesa sulla credibilità pubblica.`,
      sentiment: 'negativo',
      partyColor: '#F43F5E',
    };

    return {
      nextState: {
        ...state,
        parties: updatedParties,
        executives: updatedExecs,
        leaderApproval: adjustLeaderApproval(state.leaderApproval, player.id, -4),
        stateIndicators: applyStateEffects(state.stateIndicators, {
          democraticHealth: -3,
          socialStability: -3,
        }),
        activeScandal: null,
        mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
      },
      feedback: `Hai difeso a oltranza ${scandal.execName}: coesione interna rafforzata (+6 lealtà), ma calo di credibilità e attacchi mediatici.`,
    };
  }

  // decision === 'dimissioni': salva la reputazione pubblica, penalizza la coesione interna e sostituisce dirigente/libera ministero
  const targetExec = state.executives.find((e) => e.id === scandal.execId);
  let updatedExecs = state.executives.map((ex) => ({
    ...ex,
    loyalty: clamp(ex.loyalty - 6, 5, 100),
  }));
  const nextMinistryExecs = { ...(state.governmentMinistryExecutives ?? {}) };

  if (targetExec) {
    const pool = REPLACEMENT_CANDIDATES[targetExec.role] ?? [];
    const replacement =
      pool.find((c) => c.name !== targetExec.name) ?? {
        name: 'Dott. Marco Ruggieri',
        faction: 'Ala Garantista & Tecnica',
        specialization: targetExec.specialization,
        competence: 78,
        loyalty: 82,
        ambition: 45,
        trait: 'Profilo Tecnico (+Trasparenza)',
      };
    const newExec: ExecutiveMember = {
      id: uid('exec'),
      role: targetExec.role,
      roleLabel: targetExec.roleLabel,
      name: replacement.name,
      faction: replacement.faction,
      specialization: replacement.specialization,
      competence: replacement.competence,
      loyalty: replacement.loyalty,
      ambition: replacement.ambition,
      trait: replacement.trait,
      lowLoyaltyWeeks: 0,
    };
    updatedExecs = updatedExecs.map((ex) => (ex.id === targetExec.id ? newExec : ex));
    // Libera/aggiorna il ministero precedentemente ricoperto dal dirigente dimesso
    for (const [mId, assignedId] of Object.entries(nextMinistryExecs)) {
      if (assignedId === targetExec.id) {
        delete nextMinistryExecs[mId as MinistryId];
      }
    }
  }

  const updatedParties = applyElectoralShift(
    state.parties,
    player.id,
    {
      giovani: 0.4,
      lavoratori: 0.3,
      imprese: 0.2,
      pensionati: 0.3,
    },
    undefined,
    undefined,
    { bypassInertia: true }
  );

  const mediaItem: MediaItem = {
    id: uid('med'),
    week: state.week,
    dateLabel,
    type: 'stampa',
    source: 'Gazzetta Parlamentare',
    headline: `LINEA DEL RIGORE: ${scandal.execName} si dimette su richiesta di ${state.leader.name}`,
    excerpt: `L’autosospensione salva la reputazione pubblica del partito (+3 gradimento), ma apre malumori interni in Segreteria.${
      scandal.ministryId ? ' La casella ministeriale è ora libera per una nuova nomina in Parlamento.' : ''
    }`,
    sentiment: 'positivo',
    partyColor: '#10B981',
  };

  return {
    nextState: {
      ...state,
      parties: updatedParties,
      executives: updatedExecs,
      governmentMinistryExecutives: nextMinistryExecs,
      leaderApproval: adjustLeaderApproval(state.leaderApproval, player.id, 3),
      stateIndicators: applyStateEffects(state.stateIndicators, {
        democraticHealth: 3,
        socialStability: 2,
      }),
      activeScandal: null,
      mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
    },
    feedback: `Dimissioni ottenute per ${scandal.execName}: reputazione pubblica salva (+3 gradimento), -6 lealtà interna.${
      scandal.ministryId ? ' Assegna il nuovo Ministro dalla scheda Parlamento.' : ''
    }`,
  };
}




export type GameMode = 'new_party' | 'existing_party' | 'government_crisis';

export type SetupOrigin = 'committee' | 'established';

export type OrientationId =
  | 'riformista'
  | 'conservatore'
  | 'progressista'
  | 'populista'
  | 'socialista'
  | 'moderato'
  | 'territorialista'
  | 'tecnopragmatico';

export type LeadershipStyle =
  | 'carismatico'
  | 'istituzionale'
  | 'tribuno'
  | 'stratega';

export type LeaderTraitId =
  | 'oratore_tv'
  | 'economista'
  | 'sindacalista'
  | 'maestro_social'
  | 'ex_magistrato'
  | 'diplomazia_ue'
  | 'fundraiser'
  | 'volto_nuovo';

export type EmblemId =
  | 'stella'
  | 'scudo'
  | 'ulivo'
  | 'bilancia'
  | 'torre'
  | 'aquila'
  | 'ruota'
  | 'bussola'
  | 'sole'
  | 'arco';

export type MacroRegionId = 'nord_ovest' | 'nord_est' | 'centro' | 'sud' | 'isole';

export type RegionId =
  | 'valle_daosta'
  | 'piemonte'
  | 'liguria'
  | 'lombardia'
  | 'trentino_aa'
  | 'veneto'
  | 'friuli_vg'
  | 'emilia_romagna'
  | 'toscana'
  | 'umbria'
  | 'marche'
  | 'lazio'
  | 'abruzzo'
  | 'molise'
  | 'campania'
  | 'puglia'
  | 'basilicata'
  | 'calabria'
  | 'sicilia'
  | 'sardegna';

export type DemographicId = 'giovani' | 'lavoratori' | 'imprese' | 'pensionati';

export type TabId =
  | 'plancia'
  | 'campagna'
  | 'crisi'
  | 'parlamento'
  | 'partito'
  | 'territorio'
  | 'elezioni'
  | 'guida';

export type ChapterLevel = 0 | 1 | 2 | 3;

export interface RegionalChapterState {
  level: ChapterLevel;
  openedAtWeek: number;
  localMembers: number;
}

export type CoalitionStatus = 'avversario' | 'dialogo' | 'desistenza' | 'alleato';

export type ExecutiveRole =
  | 'vice_segretario'
  | 'economia'
  | 'comunicazione'
  | 'capogruppo'
  | 'enti_locali'
  | 'esteri_riforme';

export type ExecutiveSpecialization =
  | 'economia'
  | 'interni'
  | 'esteri'
  | 'giustizia'
  | 'sanita'
  | 'istruzione'
  | 'infrastrutture'
  | 'ambiente';

export type MinistryAffinityLevel = 'affine' | 'parziale' | 'fuori_ruolo';

export type ElectoralLawId =
  | 'rosatellum'
  | 'proporzionale'
  | 'maggioritario'
  | 'premio_maggioranza';

export type RegimeStatus =
  | 'repubblica_parlamentare'
  | 'democrazia_illiberale'
  | 'regime_autoritario';

export type CrisisContext =
  | 'any'
  | 'governo'
  | 'opposizione'
  | 'extraparlamentare'
  | 'campagna';

export type MinistryId =
  | 'mef'
  | 'interno'
  | 'giustizia'
  | 'esteri'
  | 'infrastrutture'
  | 'salute'
  | 'istruzione'
  | 'ambiente';

export interface MinistryDefinition {
  id: MinistryId;
  name: string;
  shortName: string;
  weight: number;
  requiredSpecialization: ExecutiveSpecialization;
  secondarySpecializations: ExecutiveSpecialization[];
  portfolioDesc: string;
  bonusSummary: string;
}

export interface AllySatisfactionReport {
  partyId: string;
  partyName: string;
  partyAcronym: string;
  partyColor: string;
  leaderName: string;
  cameraSeats: number;
  senatoSeats: number;
  seatSharePct: number;
  assignedMinistries: MinistryId[];
  assignedWeight: number;
  expectedWeight: number;
  satisfaction: number;
  grantsConfidence: boolean;
  status: 'fiducia' | 'teso' | 'rottura';
  statusLabel: string;
}

export interface BudgetAllocation {
  /** 0..15 Mld € — Fisco & Taglio Tasse */
  fisco: number;
  /** 0..15 Mld € — Sanità & Welfare */
  sanita: number;
  /** 0..15 Mld € — Giovani & Lavoro */
  giovani: number;
  /** 0..15 Mld € — Infrastrutture & Sud */
  infrastrutture: number;
  /** 0..20 Mld € — Coperture / Tagli / Tasse Extra */
  coperture: number;
}

export interface BudgetModifiers {
  label: string;
  deficitGdpPct: number;
  netBillions: number;
  weeklySpreadDrift: number;
  weeklyStabilityDrift: number;
  weeklyEuDrift: number;
  demoWeeklyBonus: Partial<Record<DemographicId, number>>;
  activeUntilWeek: number;
  allocation: BudgetAllocation;
}

/** 4 Dynamic Ideological Axes (-100 to +100) */
export interface PoliticalAxis {
  /** -100 (Statalista) to +100 (Liberista) */
  economic: number;
  /** -100 (Conservatore) to +100 (Progressista) */
  society: number;
  /** -100 (Sovranista) to +100 (Federalista UE) */
  europe: number;
  /** -100 (Democratico Costituzionale) to +100 (Autoritario) */
  institutions: number;
}

export interface StateIndicators {
  /** BTP-Bund spread in basis points (e.g. 90..450) */
  spread: number;
  /** 0..100 Social stability (low = protests/strikes) */
  socialStability: number;
  /** 0..100 EU relations (low = infringement/PNRR freeze) */
  euRelations: number;
  /** 0..100 Democratic / Quirinale resilience */
  democraticHealth: number;
}

export interface LawDefinition {
  id: string;
  category: 'economica' | 'elettorale' | 'costituzionale';
  title: string;
  shortDesc: string;
  requiredMajority: 'semplice' | 'assoluta' | 'qualificata';
  budgetDelta: number;
  /** Target ideological alignment for AI party voting decisions */
  targetAxis: Partial<PoliticalAxis>;
  /** How proposing/enacting shifts the player party's 4 axes */
  axisShift: Partial<PoliticalAxis>;
  demoEffects: Partial<Record<DemographicId, number>>;
  regionEffects?: Partial<Record<MacroRegionId, number>>;
  stateEffects: Partial<StateIndicators>;
  electoralLawChange?: ElectoralLawId;
  grantsFlag?: 'premierato' | 'mediaControl' | 'judiciaryControl' | 'strikeLimit' | 'fullPowers';
  /** Risk level of Quirinale presidential veto (0..100 base) */
  quirinaleRisk: number;
  requiresFlags?: ('premierato' | 'mediaControl' | 'judiciaryControl' | 'strikeLimit')[];
  enactedHeadline: string;
}

export type LegislativeInstrument = 'ddl' | 'dl';

export interface ActiveDecreeLaw {
  id: string;
  lawId: string;
  title: string;
  enactedAtWeek: number;
  expiresAtWeek: number;
  weeksRemaining: number;
  confidenceUsed: boolean;
  status: 'in_conversione' | 'convertito' | 'decaduto';
  previousElectoralLaw?: ElectoralLawId;
  grantedFlag?: keyof InstitutionalFlags;
}

export interface PendingBill {
  id: string;
  lawId: string;
  title: string;
  startedAtWeek: number;
  totalWeeks: number;
  weeksRemaining: number;
  stage: 'commissione' | 'camera' | 'senato';
  blockedByAmendments: boolean;
  hostileAmendmentsCount: number;
  confidenceUsed: boolean;
}

export interface InquiryCommission {
  id: string;
  topicId: string;
  title: string;
  targetArea: string;
  startedAtWeek: number;
  durationWeeks: number;
  weeksRemaining: number;
  promotedByPlayer: boolean;
  sponsorPartyName?: string;
  mediaPressure?: number;
  status: 'attiva' | 'conclusa';
  reportHeadline?: string;
  reportSummary?: string;
  pollImpact?: number;
}

export interface QuirinaleCandidate {
  id: string;
  name: string;
  roleLabel: string;
  area: 'istituzionale' | 'centrodestra' | 'centrosinistra' | 'centro' | 'sovranista';
  bio: string;
  axis: PoliticalAxis;
  institutionalPrestige: number;
  proposedByPlayer?: boolean;
}

export interface QuirinaleBallotResult {
  ballotNumber: number;
  requiredMajority: number;
  tallies: Record<string, number>;
  blankVotes: number;
  winnerId?: string;
  summary: string;
}

export interface QuirinaleElectionState {
  active: boolean;
  triggeredAtWeek: number;
  ballotNumber: number;
  totalElectors: number;
  requiredMajority: number;
  candidates: QuirinaleCandidate[];
  negotiatedPartyIds: string[];
  negotiatedCandidateMap: Record<string, string>;
  playerSupportedCandidateId: string | null;
  ballotHistory: QuirinaleBallotResult[];
  electedCandidate?: QuirinaleCandidate;
  outcomeSummary?: string;
}

export interface FundraisingLedgerEntry {
  id: string;
  week: number;
  dateLabel: string;
  source: string;
  amount: number;
}

export interface FundraisingState {
  lastMembershipCampaignWeek: number;
  activeMembersCount: number;
  twoPerThousandLastClaimWeek: number;
  lastFundraisingEventWeek: number;
  totalRaisedCampaigns: number;
  transparentLedger: FundraisingLedgerEntry[];
}

export interface ExecutiveScandal {
  id: string;
  execId: string;
  execName: string;
  execRoleLabel: string;
  ministryId?: MinistryId;
  title: string;
  summary: string;
  severity: 'Alta' | 'Critica';
  week: number;
}

export interface LawVoteRecord {
  id: string;
  lawId: string;
  title: string;
  week: number;
  dateLabel: string;
  cameraYes: number;
  cameraNo: number;
  senatoYes: number;
  senatoNo: number;
  outcome: 'approvata' | 'respinta' | 'veto_quirinale';
  instrument?: LegislativeInstrument;
  confidenceUsed?: boolean;
  summary: string;
}

export interface LeaderProfile {
  name: string;
  age: number;
  style: LeadershipStyle;
  traits: [LeaderTraitId, LeaderTraitId];
}

export interface PartyState {
  id: string;
  name: string;
  acronym: string;
  color: string;
  emblem: EmblemId;
  customEmblemUrl?: string;
  orientation: OrientationId;
  axis: PoliticalAxis;
  leaderName: string;
  isPlayer: boolean;
  isInGovernment: boolean;
  coalitionId: string | null;
  demographics: Record<DemographicId, number>;
  regions: Record<MacroRegionId, number>;
  regionPolls: Record<RegionId, number>;
  nationalPoll: number;
  previousPoll: number;
  relationWithPlayer: number;
  coalitionStatus: CoalitionStatus;
  description: string;
  internalTension?: string;
  startingBudget?: number;
  /** Live treasury balance (tracked for AI parties too; mirrors GameState.budget for player) */
  budget?: number;
  /** Fixed weekly structural overhead for AI parties */
  weeklyOverhead?: number;
  /** Active regional chapters count simulated for AI parties */
  aiChapterCount?: number;
  /** True if spawned dynamically from an internal party schism */
  isSplinterParty?: boolean;
  /** Parent party ID from which this splinter broke away */
  splinterFromPartyId?: string;
  /** Sitting parliamentary seats defected during the current legislature (cleared at next election) */
  splinterDefectedSeats?: { camera: number; senato: number };
}

export interface ExecutiveMember {
  id: string;
  role: ExecutiveRole;
  roleLabel: string;
  name: string;
  faction: string;
  specialization: ExecutiveSpecialization;
  competence: number;
  loyalty: number;
  ambition: number;
  trait: string;
  actedThisWeek?: boolean;
  /** Consecutive weeks this executive has remained in critical loyalty territory */
  lowLoyaltyWeeks?: number;
}

export interface PollSnapshot {
  weekIndex: number;
  label: string;
  polls: Record<string, number>;
}

export interface MediaItem {
  id: string;
  week: number;
  dateLabel: string;
  type: 'stampa' | 'social' | 'rivale';
  source: string;
  handle?: string;
  headline: string;
  excerpt: string;
  sentiment: 'positivo' | 'neutro' | 'negativo';
  engagement?: string;
  partyColor?: string;
}

export interface CrisisOption {
  id: string;
  label: string;
  stance: string;
  description: string;
  proText?: string;
  conText?: string;
  requiredTrait?: LeaderTraitId;
  requiredStyle?: LeadershipStyle;
  requiredOrientation?: OrientationId;
  budgetDelta: number;
  demoEffects: Partial<Record<DemographicId, number>>;
  regionEffects?: Partial<Record<MacroRegionId, number>>;
  axisShift?: Partial<PoliticalAxis>;
  stateEffects?: Partial<StateIndicators>;
  relationEffects?: {
    sameSide?: number;
    oppositeSide?: number;
    institutional?: number;
  };
  loyaltyDelta?: number;
  headlineResult: string;
  rivalReaction: string;
}

export interface CrisisEvent {
  id: string;
  category:
    | 'Economia'
    | 'Lavoro'
    | 'Unione Europea'
    | 'Scandalo'
    | 'Territorio'
    | 'Istituzioni'
    | 'Società'
    | 'Esteri';
  severity: 'Alta' | 'Critica' | 'Media';
  context?: CrisisContext;
  /** Preferentially weighted when the player matches one of these party orientations */
  preferredOrientations?: OrientationId[];
  /** Preferentially weighted when the player matches one of these leadership styles */
  preferredStyles?: LeadershipStyle[];
  /** Preferentially weighted when the player holds one of these leader traits */
  preferredTraits?: LeaderTraitId[];
  title: string;
  summary: string;
  options: CrisisOption[];
}

export interface CrisisOutcomeStats {
  pollDelta: number;
  budgetDelta: number;
  loyaltyDelta: number;
  leaderApprovalDelta: number;
  pressReaction: string;
  rivalReaction?: string;
  stateEffects?: Partial<StateIndicators>;
  demoEffects?: Partial<Record<DemographicId, number>>;
}

export interface ActiveCrisis {
  event: CrisisEvent;
  resolved: boolean;
  skipped?: boolean;
  chosenOptionId?: string;
  outcomeSummary?: string;
  outcomeStats?: CrisisOutcomeStats;
}

export interface WeeklyActionLog {
  id: string;
  week: number;
  category: string;
  title: string;
  cost: number;
  summary: string;
}

export interface CommitteeState {
  active: boolean;
  weeksRemaining: number;
  signatures: number;
  targetSignatures: number;
  committeesOpened: number;
  targetCommittees: number;
  completed: boolean;
}

export interface SeatAllocation {
  partyId: string;
  camera: number;
  senato: number;
  coalitionId: string | null;
}

export interface ElectionResult {
  conductedAtWeek: number;
  dateLabel: string;
  stage: 0 | 1 | 2 | 3;
  finalVotes: Record<string, number>;
  regionalVotes: Record<MacroRegionId, Record<string, number>>;
  seats: SeatAllocation[];
  playerCoalitionCamera: number;
  playerCoalitionSenato: number;
  winningCoalitionName: string;
  winningCoalitionCamera: number;
  winningCoalitionSenato: number;
  playerRole: 'premier' | 'partner_governo' | 'capo_opposizione' | 'opposizione' | 'fuori_parlamento';
  outcomeTitle: string;
  outcomeNarrative: string;
  turnout: number;
  postElectionResolved: boolean;
  /** True when the player's party missed the 100% ballot signature threshold before list closure */
  playerExcludedFromBallot?: boolean;
}

export type BallotElectionType = 'politiche' | 'europee' | 'regionali';

export interface BallotSignatureCampaign {
  electionType: BallotElectionType;
  targetSignatures: number;
  collectedSignatures: number;
  deadlineWeek: number;
  exempt: boolean;
  exemptReason?: string;
  banchettiThisWeek: number;
  totalBanchetti: number;
  excludedFromBallot: boolean;
  targetRegionId?: RegionId;
}

export type ReferendumKind = 'abrogativo' | 'costituzionale';
export type ReferendumStance = 'si' | 'no' | 'astensione';
export type ReferendumPhase = 'raccolta_firme' | 'campagna' | 'concluso';

export interface ReferendumTemplate {
  id: string;
  title: string;
  shortTitle: string;
  lawTargetId?: string;
  lawTargetLabel: string;
  summary: string;
  kind: ReferendumKind;
  yesTargetAxis: Partial<PoliticalAxis>;
  yesEffects: {
    stateEffects?: Partial<StateIndicators>;
    demoEffects?: Partial<Record<DemographicId, number>>;
    repealsLawId?: string;
    revertsFlag?: keyof InstitutionalFlags;
    electoralLawFallback?: ElectoralLawId;
    headline: string;
  };
  noEffects: {
    stateEffects?: Partial<StateIndicators>;
    headline: string;
  };
}

export interface ReferendumOutcome {
  turnout: number;
  quorumReached: boolean;
  yesPct: number;
  noPct: number;
  approved: boolean;
  playerWon: boolean;
  headline: string;
  narrative: string;
  pollDelta: number;
}

export interface ActiveReferendum {
  id: string;
  templateId: string;
  title: string;
  shortTitle: string;
  lawTargetId?: string;
  lawTargetLabel: string;
  summary: string;
  kind: ReferendumKind;
  phase: ReferendumPhase;
  startedAtWeek: number;
  signatures: number;
  targetSignatures: number;
  signatureDeadlineWeek: number;
  voteWeek: number;
  requiresQuorum: boolean;
  playerStance: ReferendumStance | null;
  campaignBudgetSpent: number;
  playerCampaignBoost: number;
  banchettiThisWeek: number;
  partyStances: Record<string, ReferendumStance>;
  projectedTurnout: number;
  projectedYesPct: number;
  promotedByPlayer: boolean;
  result?: ReferendumOutcome;
}

export interface InstitutionalFlags {
  premierato: boolean;
  mediaControl: boolean;
  judiciaryControl: boolean;
  strikeLimit: boolean;
  fullPowers: boolean;
}

export interface GameState {
  version: number;
  schemaVersion?: number;
  saveId: string;
  savedAt: string;
  mode: GameMode;
  origin: SetupOrigin;
  week: number;
  electionWeek: number;
  playerPartyId: string;
  leader: LeaderProfile;
  budget: number;
  weeklyOverhead: number;
  /** Real sitting seats of the current Legislature (Camera 400 / Senato 200). Changes ONLY via elections or parliamentary schisms. */
  legislatureSeats?: SeatAllocation[];
  parties: PartyState[];
  executives: ExecutiveMember[];
  pollHistory: PollSnapshot[];
  currentCrisis: ActiveCrisis;
  /** 1 to 3 contextual events generated each week based on real party status */
  weeklyCrises: ActiveCrisis[];
  /** Cooldown map: crisisId -> last week number triggered (minimum 25-week cooldown) */
  crisisCooldowns: Record<string, number>;
  usedCrisisIds: string[];
  mediaFeed: MediaItem[];
  actionLog: WeeklyActionLog[];
  actionsTakenThisWeek: string[];
  committee: CommitteeState;
  coalitionName: string;
  election: ElectionResult | null;
  governmentRole: 'governo' | 'opposizione' | 'premier';
  /** True when the party currently holds 0 seats in Parliament (extra-parliamentary opposition or unrepresented new party) */
  extraParliamentary?: boolean;
  schismOccurred: boolean;
  /** Consecutive weeks with internal party cohesion below the critical threshold (with poll >= 4%) */
  lowCohesionStreak: number;
  /** Total number of internal schisms suffered by the player's party */
  schismCount?: number;
  totalBillsProposed: number;
  openHeadquarters: RegionId[];
  /** State health & macroeconomic indicators */
  stateIndicators: StateIndicators;
  /** Active electoral system affecting seat allocation */
  electoralLaw: ElectoralLawId;
  /** Enacted law IDs */
  enactedLawIds: string[];
  /** Roll-call voting history in Parliament */
  lawVoteHistory: LawVoteRecord[];
  /** Constitutional & power-consolidation flags */
  institutionalFlags: InstitutionalFlags;
  /** Current constitutional status of the Italian Republic */
  regimeStatus: RegimeStatus;
  /** True when the player has sworn in at the Quirinale as Presidente del Consiglio */
  isPrimeMinister: boolean;
  /** Active assignment of the key ministries (Manuale Cencelli) -> partyId */
  governmentMinistries: Partial<Record<MinistryId, string>>;
  /** Specific player executive (execId) assigned to each ministry held by the player's party */
  governmentMinistryExecutives: Partial<Record<MinistryId, string>>;
  /** Live coalition satisfaction score (0..100) per ally partyId */
  allySatisfaction: Record<string, number>;
  /** Last week in which an Annual Budget Law (Manovra Finanziaria) was voted */
  lastBudgetWeek: number;
  /** Blocking modal flag: true until the current Annual Budget Law is voted */
  pendingBudgetLaw: boolean;
  /** Active macroeconomic & consensus modifiers from the last approved Budget Law */
  budgetModifiers: BudgetModifiers | null;
  /** Personal leader approval rating (0..100) keyed by partyId */
  leaderApproval: Record<string, number>;
  /** Previous week's leader approval rating for weekly trend delta */
  previousLeaderApproval: Record<string, number>;
  /** Electoral ballot signature collection progress for extra-parliamentary / new parties */
  ballotSignatures: BallotSignatureCampaign;
  /** Currently active Art. 75 (abrogative) or Art. 138 (constitutional) referendum */
  activeReferendum: ActiveReferendum | null;
  /** Concluded referendums archive */
  referendumHistory: ActiveReferendum[];
  /** Constitutional laws passed without 2/3 majority eligible for Art. 138 confirmatory referendum */
  pendingConstitutionalReferendumLawIds: string[];
  /** Ordinary DDL bills currently advancing through parliamentary committees & chambers */
  pendingBills?: PendingBill[];
  /** Active Decree-Laws (60-day / 8-9 week conversion window) */
  activeDecreeLaws: ActiveDecreeLaw[];
  /** Active Parliamentary Inquiry Commissions */
  activeCommissions: InquiryCommission[];
  /** Concluded Inquiry Commissions archive */
  commissionHistory: InquiryCommission[];
  /** Current President of the Republic name */
  currentPresidentName: string;
  /** Week when the current 7-year Presidential mandate expires */
  quirinaleTermEndWeek: number;
  /** Active Seduta Comune (658 Grandi Elettori) Presidential election modal state */
  quirinaleElection: QuirinaleElectionState | null;
  /** Transparent Fundraising, Annual Membership & 2x1000 state */
  fundraising: FundraisingState;
  /** Active judicial investigation / scandal targeting a specific party executive or minister */
  activeScandal: ExecutiveScandal | null;
  /** Last week a targeted executive scandal occurred (cooldown control) */
  lastScandalWeek: number;
  /** Regional party branches / circoli across all 20 Italian regions (levels 1..3) */
  regionalChapters?: Partial<Record<RegionId, RegionalChapterState>>;
  /** Player party's national poll at the beginning of the current week (for realistic Weekly Cap tracking) */
  weekStartPlayerPoll?: number;
  /** True if the player has performed territorial or campaign activity during the current week */
  weeklyTerritorialActivity?: boolean;
}

export interface SaveSlotSummary {
  slotIndex: 1 | 2 | 3;
  empty: boolean;
  savedAt?: string;
  partyName?: string;
  partyAcronym?: string;
  partyColor?: string;
  partyEmblem?: EmblemId;
  customEmblemUrl?: string;
  leaderName?: string;
  budget?: number;
  nationalPoll?: number;
  week?: number;
  dateLabel?: string;
  mode?: GameMode;
  schemaVersion?: number;
}

export interface NewPartyDraft {
  name: string;
  acronym: string;
  color: string;
  emblem: EmblemId;
  customEmblemUrl?: string;
  orientation: OrientationId;
  origin: SetupOrigin;
  leaderName: string;
  leaderAge: number;
  leaderStyle: LeadershipStyle;
  traits: [LeaderTraitId, LeaderTraitId];
}

export type TvDuelTopicId =
  | 'economia'
  | 'sanita'
  | 'immigrazione'
  | 'europa'
  | 'lavoro'
  | 'giustizia';

export type TvDuelApproachId =
  | 'dati_tecnici'
  | 'affondo_populista'
  | 'attacco_avversario';

export interface TvDuelResultPayload {
  opponentPartyId: string;
  showName: string;
  topics: TvDuelTopicId[];
  topicLabels: string[];
  finalPlayerShare: number;
  finalOpponentShare: number;
  roundsWon: number;
  roundsLost: number;
  roundsTied: number;
  bestMomentSummary: string;
}


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

export type LegislativeStage = 'commissione' | 'camera' | 'senato' | 'promulgazione';

export type GroupVoteStance = 'favorevole' | 'contrario' | 'astenuto' | 'indeciso';

export type PlayerBillVoteStance = 'favorevole' | 'contrario' | 'astenuto';

export type ParliamentarySubjectId =
  | 'fisco_economia'
  | 'lavoro_welfare'
  | 'sanita_istruzione'
  | 'giustizia_sicurezza'
  | 'ambiente_energia'
  | 'diritti_civili'
  | 'riforme_istituzionali'
  | 'politica_estera_ue';

export type BillNegotiationDealType = 'compromesso' | 'scambio_voti' | 'mediazione';

export interface BillNegotiationRecord {
  id: string;
  partyId: string;
  partyAcronym: string;
  dealType: BillNegotiationDealType;
  targetStance: 'favorevole' | 'astenuto';
  success: boolean;
  week: number;
  summary: string;
}

export interface ParliamentaryVotePact {
  id: string;
  partyId: string;
  partyAcronym: string;
  fromBillId: string;
  fromBillTitle: string;
  createdAtWeek: number;
  expiresAtWeek: number;
  fulfilled: boolean;
}

export interface ParliamentaryGroupStance {
  partyId: string;
  acronym: string;
  name: string;
  color: string;
  cameraSeats: number;
  senatoSeats: number;
  stance: GroupVoteStance;
}

export interface FrancTireursIncident {
  id: string;
  week: number;
  dateLabel: string;
  billTitle: string;
  defectionsCamera: number;
  defectionsSenato: number;
  wentUnder: boolean;
  resolved: boolean;
  summary: string;
}

export interface ParliamentaryActionRecord {
  id: string;
  week: number;
  dateLabel: string;
  kind:
    | 'question_time'
    | 'mozione'
    | 'emendamento'
    | 'ostruzionismo'
    | 'piazza'
    | 'vertice'
    | 'trattativa'
    | 'voto_libero'
    | 'proposta_ddl';
  title: string;
  outcome: 'successo' | 'misto' | 'respinto';
  summary: string;
}

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
  stage?: LegislativeStage;
  navettaCount?: number;
  hostileAmendmentsCount?: number;
  blockedByAmendments?: boolean;
  amendmentConsensusShift?: number;
  promotedByPlayer?: boolean;
  sponsorPartyId?: string;
  sponsorAcronym?: string;
  playerVoteStance?: PlayerBillVoteStance;
  playerStanceCohesionApplied?: boolean;
  playerFloorAction?:
    | 'emendamento_accolto'
    | 'emendamento_respinto'
    | 'ostruzionismo'
    | 'piazza_pro'
    | 'piazza_contro';
}

export interface PendingBill {
  id: string;
  lawId: string;
  title: string;
  startedAtWeek: number;
  totalWeeks: number;
  weeksRemaining: number;
  stage: LegislativeStage;
  blockedByAmendments: boolean;
  hostileAmendmentsCount: number;
  confidenceUsed: boolean;
  promotedByPlayer?: boolean;
  sponsorPartyId?: string;
  sponsorAcronym?: string;
  navettaCount?: number;
  lastNavettaNote?: string;
  amendmentConsensusShift?: number;
  playerFloorAction?:
    | 'emendamento_accolto'
    | 'emendamento_respinto'
    | 'ostruzionismo'
    | 'piazza_pro'
    | 'piazza_contro';
  secretBallotRisk?: number;
  /** Custom player-authored DDL payload when proposed via "Proponi un DDL" */
  customLaw?: LawDefinition;
  /** Parliamentary subject domain for custom DDLs */
  subjectId?: ParliamentarySubjectId;
  /** Explicit free vote stance chosen by the player's party on this bill */
  playerVoteStance?: PlayerBillVoteStance;
  /** Tracks whether cross-vote internal cohesion adjustment was already applied for this bill */
  playerStanceCohesionApplied?: boolean;
  /** Party stances shifted via parliamentary negotiations (partyId -> favorevole | astenuto) */
  negotiatedStances?: Record<string, GroupVoteStance>;
  /** Party IDs already negotiated with on this bill */
  negotiatedPartyIds?: string[];
  /** Log of negotiation attempts on this bill */
  negotiationLog?: BillNegotiationRecord[];
  /** Number of compromise amendments applied during negotiations */
  compromiseCount?: number;
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
  secretBallot?: boolean;
  francTireursCamera?: number;
  francTireursSenato?: number;
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
  /** Se true, compare solo nelle ultime settimane prima delle Elezioni Politiche o Europee */
  onlyDuringCampaign?: boolean;
  /** Soglia minima di Spread BTP-Bund richiesta per far comparire il dossier */
  minSpread?: number;
  /** Soglia massima di Stabilità Sociale richiesta per far comparire il dossier */
  maxSocialStability?: number;
  /** Soglia minima di consenso nazionale del partito richiesta */
  minPoll?: number;
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
  /** Pre-election poll snapshot captured just before election day for Phase 3 delta analysis */
  preElectionPolls?: Record<string, number>;
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

export type EuropeanConstituencyId = MacroRegionId;

export type EuParliamentGroupId =
  | 'epp'
  | 'sd'
  | 'ecr'
  | 'pfe'
  | 'renew'
  | 'greens_efa'
  | 'the_left'
  | 'esn'
  | 'ni';

export type EuHeadCandidateArchetypeId = 'esperto_ue' | 'volto_tv' | 'radicato_locale';

export type EuLeaderCandidacyMode = 'none' | 'single' | 'all_five';

export type EuCampaignTopicId =
  | 'patto_stabilita'
  | 'green_deal'
  | 'immigrazione'
  | 'agricoltura'
  | 'difesa_comune';

export interface EuSignatureCampaign {
  active: boolean;
  targetSignatures: number;
  collectedSignatures: number;
  byConstituency: Record<EuropeanConstituencyId, number>;
  deadlineWeek: number;
  exempt: boolean;
  exemptReason?: string;
  excludedFromBallot: boolean;
  excludedStance?: 'astensione' | 'sostegno' | null;
  excludedSupportedPartyId?: string | null;
  campaignsThisWeek: number;
}

export interface EuElectoralCartel {
  id: string;
  name: string;
  memberPartyIds: string[];
  formedAtWeek: number;
  grantsSignatureExemption: boolean;
}

export interface EuCampaignState {
  headCandidates: Record<EuropeanConstituencyId, EuHeadCandidateArchetypeId>;
  leaderCandidacyMode: EuLeaderCandidacyMode;
  leaderCandidacyConstituency: EuropeanConstituencyId | null;
  constituencyBoosts: Record<EuropeanConstituencyId, number>;
  topicCampaignsRun: EuCampaignTopicId[];
  abroadStudentsEventDone: boolean;
  actionsThisWeek: number;
}

export interface EuSeatAllocation {
  partyId: string;
  totalSeats: number;
  byConstituency: Record<EuropeanConstituencyId, number>;
  cartelId?: string | null;
}

export type EuCommissionVoteStance = 'favorevole' | 'contrario' | 'astenuto';

export type EuCommissionerProfileId = 'tecnico' | 'fedelissimo' | 'compromesso';

export type EuCommissionerPortfolioTier = 'peso' | 'medio' | 'minore';

export type EuDirectiveTopicId =
  | 'patto_stabilita'
  | 'case_green'
  | 'dazi_agricoltura'
  | 'difesa_comune'
  | 'immigrazione';

export type EuPostElectionStep = 'group' | 'commission' | 'commissioner' | 'summary';

export interface EuCommissionerHearingOutcome {
  profileId: EuCommissionerProfileId;
  candidateName: string;
  passed: boolean;
  rejectedFirstAttempt: boolean;
  portfolioName: string;
  portfolioTier: EuCommissionerPortfolioTier;
  summary: string;
}

export interface EuPostElectionFlowState {
  active: boolean;
  electionYear: number;
  step: EuPostElectionStep;
  playerEuSeats: number;
  canNominateCommissioner: boolean;
  chosenGroupId: EuParliamentGroupId | null;
  groupReactionSummary?: string;
  commissionVote: EuCommissionVoteStance | null;
  commissionReactionSummary?: string;
  commissionerRejectedOnce: boolean;
  commissionerOutcome: EuCommissionerHearingOutcome | null;
}

export interface ActiveEuDirective {
  id: string;
  templateId: string;
  topic: EuDirectiveTopicId;
  title: string;
  subtitle: string;
  summary: string;
  weekIssued: number;
  dateLabel: string;
  groupLine: EuCommissionVoteStance;
  resolved: boolean;
  playerVote?: EuCommissionVoteStance;
  outcomeSummary?: string;
  pollDelta?: number;
  spreadDelta?: number;
  euRelationsDelta?: number;
  groupRelationsDelta?: number;
}

/** Stato Commissione UE e Commissario italiano (Parte 2) */
export interface EuCommissionState {
  termYear: number;
  presidentName: string;
  italianCommissionerName: string;
  italianCommissionerPartyId: string | null;
  italianCommissionerPortfolio?: string;
  italianCommissionerTier?: EuCommissionerPortfolioTier;
  italianCommissionerProfile?: EuCommissionerProfileId;
  playerVote: EuCommissionVoteStance | null;
  inEuropeanMajority?: boolean;
}

export interface EuropeanElectionResult {
  conductedAtWeek: number;
  dateLabel: string;
  year: number;
  /** 0 = Fase 1 (Ore 23:00 Affluenza & Exit Poll), 1 = Fase 2 (Spoglio Progressivo), 2 = Fase 3 (Definitivi, 76 Seggi & Mid-Term) */
  stage: 0 | 1 | 2;
  nationalTurnout: number;
  constituencyTurnout: Record<EuropeanConstituencyId, number>;
  finalVotes: Record<string, number>;
  constituencyVotes: Record<EuropeanConstituencyId, Record<string, number>>;
  preElectionPolls: Record<string, number>;
  seats: EuSeatAllocation[];
  cartelUsed: EuElectoralCartel | null;
  cartelCombinedPct: number;
  cartelPassedThreshold: boolean;
  playerExcludedFromBallot: boolean;
  playerFinalPct: number;
  playerWonSeats: number;
  playerPrevEuSeats: number;
  svpMinoritySeatAwarded: boolean;
  leaderCandidacyMode: EuLeaderCandidacyMode;
  leaderCandidacyConstituency: EuropeanConstituencyId | null;
  leaderDecisionRequired: boolean;
  leaderDecision: 'bruxelles' | 'resta_italia' | null;
  midTermSummary: string;
  midTermGovDeltaPct: number;
  midTermImpactTone: 'rafforzato' | 'stabile' | 'logorato';
  postElectionResolved: boolean;
}

export interface EuropeanElectionHistoryEntry {
  year: number;
  dateLabel: string;
  turnout: number;
  playerPct: number;
  playerSeats: number;
  winnerAcronym: string;
  winnerPct: number;
  cartelName?: string | null;
}

export interface EuropeanUnionState {
  nextElectionWeek: number;
  /** Eurodeputati attualmente in carica per partito (totale 76). Indipendente dai seggi nazionali di Camera e Senato. */
  euSeats: Record<string, number>;
  /** Ripartizione per circoscrizione degli eurodeputati in carica */
  euSeatsByConstituency: Record<string, Record<EuropeanConstituencyId, number>>;
  /** Gruppo parlamentare europeo di appartenenza */
  partyEuGroups: Record<string, EuParliamentGroupId>;
  /** Rapporti interni con il proprio Gruppo Parlamentare Europeo (0..100) */
  groupRelations?: number;
  /** Stato Commissione UE e Commissario italiano */
  commission: EuCommissionState;
  /** Raccolta 150.000 firme per lista europea extra-parlamentare */
  signatureCampaign: EuSignatureCampaign;
  /** Cartello elettorale / lista di scopo per superare lo sbarramento del 4% */
  cartel: EuElectoralCartel | null;
  /** Strategia e azioni delle ultime 8 settimane di campagna europea */
  campaign: EuCampaignState;
  /** Notte Elettorale Europea attiva (null fuori dal giorno del voto) */
  activeElection: EuropeanElectionResult | null;
  /** Flusso post-elezioni europee: Gruppo UE → Fiducia Commissione → Commissario Italiano */
  postElectionFlow?: EuPostElectionFlowState | null;
  /** Direttiva / Dossier da Bruxelles in votazione a Strasburgo */
  activeDirective?: ActiveEuDirective | null;
  /** Storico delle Direttive Europee votate */
  directiveHistory?: ActiveEuDirective[];
  /** Ultima settimana in cui è stata generata una Direttiva Europea */
  lastDirectiveWeek?: number;
  /** Archivio storico delle tornate europee disputate */
  electionHistory: EuropeanElectionHistoryEntry[];
}

export type PartyInvestmentActionId =
  | 'tv_campaign'
  | 'think_tank'
  | 'national_congress'
  | 'spin_doctor'
  | 'private_poll';

export interface PrivatePollIssueInsight {
  topic: string;
  saliencePct: number;
  voterMood: string;
  recommendation: string;
}

export interface PrivatePollRivalIntel {
  partyId: string;
  acronym: string;
  name: string;
  color: string;
  nationalPoll: number;
  predictedMove: string;
  vulnerability: string;
}

export interface PrivatePollReport {
  generatedAtWeek: number;
  dateLabel: string;
  topIssues: PrivatePollIssueInsight[];
  weakestDemographicLabel: string;
  weakestDemographicPct: number;
  opportunityRegionLabel: string;
  rivalMoves: PrivatePollRivalIntel[];
  executiveSummary: string;
}

export interface PartyInvestmentsState {
  /** Settimane residue della Campagna TV Nazionale / Spot Prime Time (0..4) */
  tvCampaignWeeksRemaining: number;
  /** Fondazione & Think Tank di Partito attiva (investimento strutturale permanente) */
  hasThinkTank: boolean;
  /** Settimana di fondazione del Think Tank */
  thinkTankFoundedWeek?: number;
  /** Ultima settimana in cui è stato tenuto il Congresso / Festa Nazionale */
  lastCongressWeek: number;
  /** Numero di Congressi / Feste Nazionali celebrati */
  congressCount: number;
  /** Livello Spin Doctor & Staff Comunicazione (0 = assente, 1..3 potenziabile) */
  spinDoctorLevel: 0 | 1 | 2 | 3;
  /** Ultima settimana in cui è stato commissionato un Sondaggio Privato Strategico */
  lastPrivatePollWeek: number;
  /** Ultimo report riservato del Sondaggio Privato Strategico */
  latestPrivatePoll?: PrivatePollReport | null;
}

export type LiveBillVoteTactic = 'appello' | 'emendamento_finale' | 'linea_dura';
export type LiveBillVoteOutcome = 'approvato' | 'respinto' | 'navetta';
export type LiveBillAlignmentLevel = 'consigliato' | 'compatibile' | 'trasversale';

export interface LiveBillVotePartyStance {
  partyId: string;
  acronym: string;
  name: string;
  color: string;
  seats: number;
  stance: 'favorevole' | 'contrario' | 'astenuto';
}

export interface LiveBillVoteResult {
  chamber: 'camera' | 'senato';
  totalChamberSeats: number;
  requiredSeats: number;
  favorevoli: number;
  contrari: number;
  astenuti: number;
  secretBallotTriggered: boolean;
  francTireursDefections: number;
  outcome: LiveBillVoteOutcome;
  tacticUsed: LiveBillVoteTactic;
  headline: string;
  summary: string;
  pollDeltaNote: string;
  partyBreakdown: LiveBillVotePartyStance[];
}

export interface LiveBillVoteEvent {
  billId: string;
  lawId: string;
  title: string;
  shortDesc: string;
  chamber: 'camera' | 'senato';
  week: number;
  dateLabel: string;
  requiredMajority: 'semplice' | 'assoluta' | 'qualificata';
  requiredSeats: number;
  totalChamberSeats: number;
  navettaCount: number;
  secretBallotRisk: number;
  chamberTension: number;
  alignmentLevel: LiveBillAlignmentLevel;
  expectedFavorevoli: number;
  expectedContrari: number;
  expectedAstenuti: number;
  partyPreview: LiveBillVotePartyStance[];
  resolvedResult?: LiveBillVoteResult | null;
}

export interface PreElectionCoalitionOffer {
  coalitionId: string;
  coalitionName: string;
  memberPartyIds: string[];
  memberAcronyms: string[];
  combinedPoll: number;
  compatibility: number;
  isDirectOffer: boolean;
  pitch: string;
}

export interface PreElectionCandidatePartner {
  partyId: string;
  acronym: string;
  name: string;
  color: string;
  nationalPoll: number;
  compatibility: number;
  relation: number;
  acceptChancePct: number;
}

export interface PreElectionCoalitionDilemma {
  electionWeek: number;
  triggeredAtWeek: number;
  weeksRemaining: number;
  offers: PreElectionCoalitionOffer[];
  candidatePartners: PreElectionCandidatePartner[];
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
  /** Cooldown map: crisisId -> last week number triggered (minimum 24-week cooldown) */
  crisisCooldowns: Record<string, number>;
  usedCrisisIds: string[];
  /** Memoria storica ordinata degli ultimi dossier usciti (sistema anti-ripetizione 24 settimane) */
  recentDossierIds?: string[];
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
  /** Live parliamentary chamber tension (0..100). Raises secret ballot & franchi tiratori risk */
  chamberTension?: number;
  /** Last week a Question Time / Interrogazione was executed */
  lastQuestionTimeWeek?: number;
  /** Last week a Mozione / Ordine del Giorno (OdG) was voted in Aula */
  lastMotionWeek?: number;
  /** Most recent Franchi Tiratori incident requiring coalition recompacting if unresolved */
  lastFrancTireursEvent?: FrancTireursIncident | null;
  /** Recent parliamentary actions archive (Question Time, Mozioni, Emendamenti, Ostruzionismo, Piazza, Trattative) */
  parliamentaryActionHistory?: ParliamentaryActionRecord[];
  /** Active parliamentary vote-exchange pacts ("Scambio di Voti / Patto d'Aula") */
  parliamentaryVotePacts?: ParliamentaryVotePact[];
  /** Next European Parliament election week (5-year cycle, first: June 2029 = week 126) */
  europeanElectionWeek?: number;
  /** Full European Elections & EU Parliament state (Part 1 active + Part 2 fields ready) */
  european?: EuropeanUnionState;
  /** Grandi Investimenti & Struttura Nazionale di Partito (mid/late game) */
  partyInvestments?: PartyInvestmentsState;
  /** Votazione in diretta in Aula (Camera o Senato) di un DDL promosso dal giocatore */
  activeLiveBillVote?: LiveBillVoteEvent | null;
  /** Bivio guidato pre-elettorale sulle coalizioni (8 settimane prima delle Politiche) */
  pendingPreElectionDilemma?: PreElectionCoalitionDilemma | null;
  /** Settimana elettorale per cui il giocatore ha già risolto il bivio coalizioni */
  preElectionStrategyResolvedForWeek?: number;
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


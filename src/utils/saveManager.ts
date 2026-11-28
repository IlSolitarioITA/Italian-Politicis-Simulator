import {
  ActiveCrisis,
  ActiveDecreeLaw,
  ActiveEuDirective,
  ActiveReferendum,
  BallotElectionType,
  BallotSignatureCampaign,
  BudgetModifiers,
  ChapterLevel,
  CommitteeState,
  ElectoralLawId,
  EuCampaignState,
  EuCampaignTopicId,
  EuCommissionState,
  EuCommissionVoteStance,
  EuCommissionerHearingOutcome,
  EuCommissionerPortfolioTier,
  EuCommissionerProfileId,
  EuDirectiveTopicId,
  EuElectoralCartel,
  EuHeadCandidateArchetypeId,
  EuLeaderCandidacyMode,
  EuParliamentGroupId,
  EuPostElectionFlowState,
  EuPostElectionStep,
  EuSignatureCampaign,
  EuropeanConstituencyId,
  EuropeanElectionHistoryEntry,
  EuropeanElectionResult,
  EuropeanUnionState,
  ExecutiveMember,
  ExecutiveScandal,
  ExecutiveSpecialization,
  FrancTireursIncident,
  FundraisingState,
  GameState,
  InquiryCommission,
  InstitutionalFlags,
  LeaderProfile,
  LegislativeStage,
  MinistryId,
  ParliamentaryActionRecord,
  PartyState,
  PendingBill,
  QuirinaleElectionState,
  ReferendumStance,
  RegimeStatus,
  RegionalChapterState,
  RegionId,
  SaveSlotSummary,
  SeatAllocation,
  StateIndicators,
} from '../types/game';
import {
  EU_CAMPAIGN_TOPICS,
  EU_HEAD_CANDIDATE_ARCHETYPES,
  EU_PARLIAMENT_GROUPS,
  EU_SIGNATURE_TARGET,
  EUROPEAN_CONSTITUENCIES,
  buildInitialEuropeanState,
  createDefaultEuCampaignState,
  createDefaultEuSignatureCampaign,
  createZeroConstituencyRecord,
  getNextEuropeanElectionWeek,
  inferPartyEuGroup,
} from '../data/european';
import {
  buildDefaultLeaderApproval,
  EXISTING_PARTIES_2026,
  formatGameDate,
  inferExecutiveSpecialization,
  INITIAL_GOVERNMENT_PARTY_IDS,
} from '../data/presets';
import {
  ALL_EXECUTIVE_SPECIALIZATIONS,
  buildAutoMinistryExecutives,
} from '../data/ministries';
import { REGION_MAP_BY_ID } from '../data/italyRegions';
import { CRISIS_POOL } from '../data/crises';
import {
  buildInitialGovernmentPendingBill,
  buildInitialLegislatureSeats,
  buildRegionPollsFromMacro,
  createInitialBallotSignatures,
  createInitialFundraisingState,
  getBallotTargetForType,
  MAX_AI_DEFICIT_FLOOR,
  MAX_PLAYER_DEFICIT_FLOOR,
  normalizeAllPolls,
  syncBallotSignatureExemption,
} from '../engine/simulation';
import {
  MAX_SAVE_FILE_BYTES,
  generateSessionUuid,
  hasDangerousUrlScheme,
  safeJsonParse,
  sanitizeAcronym,
  sanitizeCustomEmblemUrl,
  sanitizeHexColor,
  sanitizePlainText,
  validateJsonFileBeforeRead,
} from './sanitizer';

export { MAX_SAVE_FILE_BYTES, validateJsonFileBeforeRead };

/** Prefisso namespaced per isolamento completo della sessione sul browser/dispositivo */
export const SESSION_STORAGE_PREFIX = 'ips_session_v1_';
const SESSION_ID_KEY = `${SESSION_STORAGE_PREFIX}id`;

/** Chiave legacy v1 mantenuta solo per migrazione trasparente one-time */
export const SAVES_STORAGE_KEY = 'palazzo_chigi_saves_v1';

/** Versione schema salvataggi corrente per migrazione sicura */
export const CURRENT_SCHEMA_VERSION = 21;

const LEGACY_SLOT_PREFIX = 'palazzo_chigi_war_room_slot_';
const LEGACY_ACTIVE_SLOT_KEY = 'palazzo_chigi_war_room_active_slot';

const SAFE_SESSION_ID_RE = /^[a-zA-Z0-9-]{8,64}$/;

/**
 * Restituisce (o genera al primo avvio) l'UUID univoco della sessione locale sul dispositivo.
 * Isola i salvataggi sotto chiavi namespaced `ips_session_v1_<uuid>_*` senza stato globale condiviso.
 */
export function getSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_ID_KEY);
    if (existing && SAFE_SESSION_ID_RE.test(existing)) {
      return existing;
    }
    const created = generateSessionUuid();
    localStorage.setItem(SESSION_ID_KEY, created);
    return created;
  } catch {
    return 'local-fallback-session';
  }
}

export function getSessionSavesStorageKey(): string {
  return `${SESSION_STORAGE_PREFIX}${getSessionId()}_saves`;
}

export function getSessionActiveSlotStorageKey(): string {
  return `${SESSION_STORAGE_PREFIX}${getSessionId()}_active_slot`;
}

export type SaveSlotIndex = 1 | 2 | 3;

export interface SaveSlotRecord {
  schemaVersion: number;
  slotIndex: SaveSlotIndex;
  updatedAt: string;
  state: GameState;
}

interface SavesContainer {
  schemaVersion: number;
  activeSlot: SaveSlotIndex;
  slots: Record<SaveSlotIndex, SaveSlotRecord | null>;
}

const DEFAULT_STATE_INDICATORS: StateIndicators = {
  spread: 118,
  socialStability: 72,
  euRelations: 68,
  democraticHealth: 84,
};

const DEFAULT_INSTITUTIONAL_FLAGS: InstitutionalFlags = {
  premierato: false,
  mediaControl: false,
  judiciaryControl: false,
  strikeLimit: false,
  fullPowers: false,
};

const DEFAULT_COMMITTEE: CommitteeState = {
  active: false,
  weeksRemaining: 0,
  signatures: 30000,
  targetSignatures: 30000,
  committeesOpened: 10,
  targetCommittees: 10,
  completed: true,
};

function createEmptyContainer(): SavesContainer {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    activeSlot: 1,
    slots: {
      1: null,
      2: null,
      3: null,
    },
  };
}

/** Whitelist esplicita dei campi di primo livello ammessi in GameState */
const ALLOWED_GAMESTATE_KEYS = new Set<string>([
  'version',
  'schemaVersion',
  'saveId',
  'savedAt',
  'mode',
  'origin',
  'week',
  'electionWeek',
  'europeanElectionWeek',
  'playerPartyId',
  'leader',
  'budget',
  'weeklyOverhead',
  'legislatureSeats',
  'parties',
  'executives',
  'pollHistory',
  'currentCrisis',
  'weeklyCrises',
  'crisisCooldowns',
  'usedCrisisIds',
  'mediaFeed',
  'actionLog',
  'actionsTakenThisWeek',
  'committee',
  'coalitionName',
  'election',
  'governmentRole',
  'extraParliamentary',
  'schismOccurred',
  'lowCohesionStreak',
  'schismCount',
  'totalBillsProposed',
  'openHeadquarters',
  'stateIndicators',
  'electoralLaw',
  'enactedLawIds',
  'lawVoteHistory',
  'institutionalFlags',
  'regimeStatus',
  'isPrimeMinister',
  'governmentMinistries',
  'governmentMinistryExecutives',
  'allySatisfaction',
  'lastBudgetWeek',
  'pendingBudgetLaw',
  'budgetModifiers',
  'leaderApproval',
  'previousLeaderApproval',
  'ballotSignatures',
  'activeReferendum',
  'referendumHistory',
  'pendingConstitutionalReferendumLawIds',
  'pendingBills',
  'activeDecreeLaws',
  'activeCommissions',
  'commissionHistory',
  'currentPresidentName',
  'quirinaleTermEndWeek',
  'quirinaleElection',
  'fundraising',
  'activeScandal',
  'lastScandalWeek',
  'regionalChapters',
  'weekStartPlayerPoll',
  'weeklyTerritorialActivity',
  'chamberTension',
  'lastQuestionTimeWeek',
  'lastMotionWeek',
  'lastFrancTireursEvent',
  'parliamentaryActionHistory',
  'european',
]);

const URL_LIKE_KEY_RE = /(?:url|href|src|emblem|avatar|icon|image|link)/i;

function isPlainRecord(val: unknown): val is Record<string, unknown> {
  return Boolean(val) && typeof val === 'object' && !Array.isArray(val);
}

function isFiniteNumber(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val);
}

/**
 * Estrae esclusivamente i campi consentiti dalla whitelist di GameState,
 * scartando qualsiasi proprietà sconosciuta o iniettata nel JSON.
 */
function pickWhitelistedGameState(rawObj: Record<string, unknown>): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const key of Object.keys(rawObj)) {
    if (!Object.prototype.hasOwnProperty.call(rawObj, key)) continue;
    if (!ALLOWED_GAMESTATE_KEYS.has(key)) continue;
    Object.defineProperty(picked, key, {
      value: rawObj[key],
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }
  return picked;
}

/**
 * Scansiona ricorsivamente l'oggetto importato per bloccare:
 * - qualsiasi valore numerico non finito (NaN / Infinity / -Infinity)
 * - qualsiasi campo URL/immagine o stringa che inizi con javascript:, vbscript:, data:text/html o data:image/svg
 */
function inspectImportedSafety(
  value: unknown,
  keyName = '',
  depth = 0
): { ok: true } | { ok: false; error: string } {
  if (depth > 14) {
    return { ok: false, error: 'Struttura del salvataggio eccessivamente annidata.' };
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return {
        ok: false,
        error: 'Il salvataggio contiene valori numerici non validi (NaN o Infinity).',
      };
    }
    return { ok: true };
  }
  if (typeof value === 'string') {
    if (hasDangerousUrlScheme(value)) {
      return {
        ok: false,
        error:
          'Contenuto non sicuro rilevato nel file (schema URL non consentito come javascript: o data:text/html).',
      };
    }
    if (URL_LIKE_KEY_RE.test(keyName) && keyName !== 'emblem' && value.trim().length > 0) {
      if (!sanitizeCustomEmblemUrl(value)) {
        return {
          ok: false,
          error:
            'Campo immagine/URL non valido o non sicuro rilevato nel file di salvataggio.',
        };
      }
    }
    return { ok: true };
  }
  if (value === null || typeof value !== 'object') {
    return { ok: true };
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const check = inspectImportedSafety(value[i], keyName, depth + 1);
      if (!check.ok) return check;
    }
    return { ok: true };
  }
  const rec = value as Record<string, unknown>;
  for (const k of Object.keys(rec)) {
    if (!Object.prototype.hasOwnProperty.call(rec, k)) continue;
    const check = inspectImportedSafety(rec[k], k, depth + 1);
    if (!check.ok) return check;
  }
  return { ok: true };
}

export function validateGameState(
  data: unknown,
  options?: { strictImport?: boolean }
): data is GameState {
  if (!isPlainRecord(data)) return false;
  const candidate = data as Partial<GameState>;
  const strict = Boolean(options?.strictImport);

  if (!Array.isArray(candidate.parties) || candidate.parties.length < 2 || candidate.parties.length > 60) {
    return false;
  }

  const partyIds = new Set<string>();
  const hasValidParties = candidate.parties.every((p) => {
    if (!isPlainRecord(p)) return false;
    if (typeof p.id !== 'string' || p.id.length === 0 || p.id.length > 64) return false;
    if (typeof p.name !== 'string' || p.name.length === 0 || p.name.length > 120) return false;
    if (!isFiniteNumber(p.nationalPoll) || p.nationalPoll < 0 || p.nationalPoll > 100) return false;
    if (strict) {
      if (p.acronym !== undefined && (typeof p.acronym !== 'string' || p.acronym.length > 24)) {
        return false;
      }
      if (p.previousPoll !== undefined && !isFiniteNumber(p.previousPoll)) return false;
      if (p.relationWithPlayer !== undefined && !isFiniteNumber(p.relationWithPlayer)) return false;
      if (p.budget !== undefined && !isFiniteNumber(p.budget)) return false;
      if (p.weeklyOverhead !== undefined && !isFiniteNumber(p.weeklyOverhead)) return false;
      if (p.customEmblemUrl !== undefined && typeof p.customEmblemUrl !== 'string') return false;
      if (p.axis !== undefined && !isPlainRecord(p.axis)) return false;
    }
    partyIds.add(p.id);
    return true;
  });

  if (!hasValidParties) return false;

  if (
    !isFiniteNumber(candidate.week) ||
    candidate.week < 1 ||
    candidate.week > 5000 ||
    typeof candidate.playerPartyId !== 'string' ||
    candidate.playerPartyId.length === 0 ||
    candidate.playerPartyId.length > 64 ||
    !Array.isArray(candidate.executives) ||
    candidate.executives.length > 30 ||
    !Array.isArray(candidate.pollHistory) ||
    candidate.pollHistory.length > 500 ||
    !isPlainRecord(candidate.leader)
  ) {
    return false;
  }

  if (strict) {
    if (!partyIds.has(candidate.playerPartyId)) return false;
    if (!isFiniteNumber(candidate.budget)) return false;
    if (
      candidate.electionWeek !== undefined &&
      (!isFiniteNumber(candidate.electionWeek) ||
        candidate.electionWeek < 1 ||
        candidate.electionWeek > 6000)
    ) {
      return false;
    }
    if (
      candidate.europeanElectionWeek !== undefined &&
      (!isFiniteNumber(candidate.europeanElectionWeek) ||
        candidate.europeanElectionWeek < 1 ||
        candidate.europeanElectionWeek > 6000)
    ) {
      return false;
    }
    if (candidate.weeklyOverhead !== undefined && (!isFiniteNumber(candidate.weeklyOverhead) || candidate.weeklyOverhead < 0)) {
      return false;
    }
    const leaderObj = candidate.leader as Partial<LeaderProfile>;
    if (typeof leaderObj.name !== 'string' || leaderObj.name.trim().length === 0 || leaderObj.name.length > 120) {
      return false;
    }
    if (leaderObj.age !== undefined && (!isFiniteNumber(leaderObj.age) || leaderObj.age < 1 || leaderObj.age > 130)) {
      return false;
    }
    if (
      leaderObj.traits !== undefined &&
      (!Array.isArray(leaderObj.traits) || !leaderObj.traits.every((t) => typeof t === 'string'))
    ) {
      return false;
    }
    const validExecutives = candidate.executives.every(
      (ex) =>
        isPlainRecord(ex) &&
        typeof ex.name === 'string' &&
        (ex.competence === undefined || isFiniteNumber(ex.competence)) &&
        (ex.loyalty === undefined || isFiniteNumber(ex.loyalty)) &&
        (ex.ambition === undefined || isFiniteNumber(ex.ambition))
    );
    if (!validExecutives) return false;

    const optionalArrays: unknown[] = [
      candidate.mediaFeed,
      candidate.actionLog,
      candidate.actionsTakenThisWeek,
      candidate.usedCrisisIds,
      candidate.openHeadquarters,
      candidate.enactedLawIds,
      candidate.lawVoteHistory,
      candidate.activeDecreeLaws,
      candidate.pendingBills,
      candidate.activeCommissions,
      candidate.commissionHistory,
      candidate.referendumHistory,
      candidate.weeklyCrises,
      candidate.legislatureSeats,
      candidate.parliamentaryActionHistory,
    ];
    if (optionalArrays.some((arr) => arr !== undefined && !Array.isArray(arr))) {
      return false;
    }

    const optionalRecords: unknown[] = [
      candidate.committee,
      candidate.stateIndicators,
      candidate.institutionalFlags,
      candidate.fundraising,
      candidate.ballotSignatures,
      candidate.regionalChapters,
      candidate.european,
    ];
    if (optionalRecords.some((rec) => rec !== undefined && rec !== null && !isPlainRecord(rec))) {
      return false;
    }
  } else if (
    candidate.budget !== undefined &&
    candidate.budget !== null &&
    typeof candidate.budget !== 'number'
  ) {
    return false;
  }

  return true;
}

/**
 * Migrazione sicura anti-perdita dati con deep-merge rispetto ai default della versione corrente.
 * Garantisce compatibilità completa quando l'app o l'APK viene aggiornata con nuove funzionalità.
 */
export function migrateSaveState(rawInput: GameState, savedSchemaVersion?: number): GameState {
  const raw = rawInput as GameState & { schemaVersion?: number };
  const safeWeek = typeof raw.week === 'number' && raw.week >= 1 ? raw.week : 1;

  const safeNonNeg = (val: unknown, fallback: number): number =>
    typeof val === 'number' && Number.isFinite(val) && val >= 0 ? val : fallback;

  const seenPartyIds = new Set<string>();
  const rawPartiesArr = Array.isArray(raw.parties) ? raw.parties : [];
  const rawDeduplicatedParties = rawPartiesArr.filter((p) => {
    if (!p || typeof p.id !== 'string' || seenPartyIds.has(p.id)) return false;
    seenPartyIds.add(p.id);
    return true;
  });

  let hadInvalidNumericPoll = false;
  let parties: PartyState[] = rawDeduplicatedParties.map((p) => {
    const legacyAxis = (p.axis ?? {}) as unknown as {
      economic?: number;
      society?: number;
      europe?: number;
      institutions?: number;
      institutional?: number;
    };

    const migratedAxis =
      typeof legacyAxis.society === 'number' &&
      typeof legacyAxis.europe === 'number' &&
      typeof legacyAxis.institutions === 'number'
        ? {
            economic: Number.isFinite(legacyAxis.economic) ? legacyAxis.economic! : 0,
            society: Number.isFinite(legacyAxis.society) ? legacyAxis.society : 0,
            europe: Number.isFinite(legacyAxis.europe) ? legacyAxis.europe : 0,
            institutions: Number.isFinite(legacyAxis.institutions) ? legacyAxis.institutions : -55,
          }
        : {
            economic: Number.isFinite(legacyAxis.economic) ? legacyAxis.economic! : 0,
            society: Math.round(-(Number.isFinite(legacyAxis.economic) ? legacyAxis.economic! : 0) * 0.4),
            europe: Number.isFinite(legacyAxis.institutional) ? legacyAxis.institutional! : 20,
            institutions: -55,
          };

    const safeNatPoll = safeNonNeg(p.nationalPoll, 5);
    if (typeof p.nationalPoll !== 'number' || !Number.isFinite(p.nationalPoll) || p.nationalPoll < 0) {
      hadInvalidNumericPoll = true;
    }

    const safeRegions = {
      nord_ovest: safeNonNeg(p.regions?.nord_ovest, safeNatPoll),
      nord_est: safeNonNeg(p.regions?.nord_est, safeNatPoll),
      centro: safeNonNeg(p.regions?.centro, safeNatPoll),
      sud: safeNonNeg(p.regions?.sud, safeNatPoll),
      isole: safeNonNeg(p.regions?.isole, safeNatPoll),
    };

    const baseRegionPolls = buildRegionPollsFromMacro(safeRegions);
    const mergedRegionPolls = { ...baseRegionPolls };
    if (p.regionPolls && typeof p.regionPolls === 'object') {
      for (const [rk, rv] of Object.entries(p.regionPolls)) {
        if (rk in mergedRegionPolls) {
          if (typeof rv === 'number' && Number.isFinite(rv) && rv >= 0) {
            mergedRegionPolls[rk as RegionId] = rv;
          } else {
            hadInvalidNumericPoll = true;
          }
        }
      }
    }

    const safeDemographics = {
      giovani: safeNonNeg(p.demographics?.giovani, safeNatPoll),
      lavoratori: safeNonNeg(p.demographics?.lavoratori, safeNatPoll),
      imprese: safeNonNeg(p.demographics?.imprese, safeNatPoll),
      pensionati: safeNonNeg(p.demographics?.pensionati, safeNatPoll),
    };
    if (
      !Number.isFinite(p.demographics?.giovani) ||
      !Number.isFinite(p.demographics?.lavoratori) ||
      !Number.isFinite(p.demographics?.imprese) ||
      !Number.isFinite(p.demographics?.pensionati)
    ) {
      hadInvalidNumericPoll = true;
    }

    return {
      ...p,
      name: sanitizePlainText(p.name, 48, 'Partito'),
      acronym: sanitizeAcronym(p.acronym, 'PT'),
      color: sanitizeHexColor(p.color, '#06B6D4'),
      customEmblemUrl: sanitizeCustomEmblemUrl(p.customEmblemUrl),
      leaderName: sanitizePlainText(p.leaderName, 44, 'Leader'),
      description: sanitizePlainText(p.description, 220, ''),
      axis: migratedAxis,
      nationalPoll: safeNatPoll,
      regions: safeRegions,
      regionPolls: mergedRegionPolls,
      demographics: safeDemographics,
      previousPoll: safeNonNeg(p.previousPoll, safeNatPoll),
      relationWithPlayer:
        typeof p.relationWithPlayer === 'number' && Number.isFinite(p.relationWithPlayer)
          ? p.relationWithPlayer
          : 0,
      coalitionStatus: p.coalitionStatus ?? 'avversario',
    };
  });

  // Garanzia retrocompatibile: se la somma nazionale è fuori tolleranza o conteneva NaN/negativi, rinormalizza al 100,0%
  const savedPollSum = parties.reduce((acc, p) => acc + (Number.isFinite(p.nationalPoll) ? p.nationalPoll : 0), 0);
  if (hadInvalidNumericPoll || Math.abs(savedPollSum - 100) > 0.2) {
    parties = normalizeAllPolls(parties);
  }
  const validPartyIds = new Set(parties.map((p) => p.id));
  const safePlayerPartyId = validPartyIds.has(raw.playerPartyId)
    ? raw.playerPartyId
    : parties.find((p) => p.isPlayer)?.id ?? parties[0]?.id ?? 'fdi';

  // Assicura che ogni snapshot di pollHistory contenga chiavi valide per tutti i partiti attivi
  const migratedPollHistory = (Array.isArray(raw.pollHistory) ? raw.pollHistory : []).map((snap) => {
    const safePolls: Record<string, number> = { ...(snap?.polls ?? {}) };
    for (const p of parties) {
      if (typeof safePolls[p.id] !== 'number' || !Number.isFinite(safePolls[p.id])) {
        safePolls[p.id] = p.isSplinterParty ? 0 : p.nationalPoll;
      }
    }
    return {
      ...snap,
      polls: safePolls,
    };
  });

  const fallbackCrisis: ActiveCrisis =
    raw.currentCrisis && raw.currentCrisis.event
      ? {
          ...raw.currentCrisis,
          resolved: Boolean(raw.currentCrisis.resolved),
          skipped: Boolean(raw.currentCrisis.skipped),
        }
      : {
          event: CRISIS_POOL[0],
          resolved: false,
        };

  const migratedWeeklyCrises: ActiveCrisis[] =
    Array.isArray(raw.weeklyCrises) && raw.weeklyCrises.length > 0
      ? raw.weeklyCrises
          .filter((c) => Boolean(c && c.event))
          .map((c) => ({
            ...c,
            resolved: Boolean(c.resolved),
            skipped: Boolean(c.skipped),
          }))
      : [fallbackCrisis];

  const safeWeeklyCrises =
    migratedWeeklyCrises.length > 0 ? migratedWeeklyCrises : [fallbackCrisis];
  const safeCurrentCrisis =
    safeWeeklyCrises.find((c) => !c.resolved) ?? safeWeeklyCrises[0];

  const crisisCooldowns: Record<string, number> =
    raw.crisisCooldowns && typeof raw.crisisCooldowns === 'object'
      ? { ...raw.crisisCooldowns }
      : {};
  for (const c of safeWeeklyCrises) {
    if (c.event?.id && crisisCooldowns[c.event.id] === undefined) {
      crisisCooldowns[c.event.id] = safeWeek;
    }
  }

  const safeIndicator = (val: unknown, fallback: number, min: number, max: number): number =>
    typeof val === 'number' && Number.isFinite(val)
      ? Math.max(min, Math.min(max, Math.round(val)))
      : fallback;

  const mergedStateIndicators: StateIndicators = {
    spread: safeIndicator(raw.stateIndicators?.spread, DEFAULT_STATE_INDICATORS.spread, 65, 450),
    socialStability: safeIndicator(
      raw.stateIndicators?.socialStability,
      DEFAULT_STATE_INDICATORS.socialStability,
      0,
      100
    ),
    euRelations: safeIndicator(
      raw.stateIndicators?.euRelations,
      DEFAULT_STATE_INDICATORS.euRelations,
      0,
      100
    ),
    democraticHealth: safeIndicator(
      raw.stateIndicators?.democraticHealth,
      DEFAULT_STATE_INDICATORS.democraticHealth,
      0,
      100
    ),
  };

  const mergedInstitutionalFlags: InstitutionalFlags = {
    premierato: Boolean(raw.institutionalFlags?.premierato),
    mediaControl: Boolean(raw.institutionalFlags?.mediaControl),
    judiciaryControl: Boolean(raw.institutionalFlags?.judiciaryControl),
    strikeLimit: Boolean(raw.institutionalFlags?.strikeLimit),
    fullPowers: Boolean(raw.institutionalFlags?.fullPowers),
  };

  const mergedCommittee: CommitteeState = {
    active: Boolean(raw.committee?.active ?? DEFAULT_COMMITTEE.active),
    weeksRemaining: safeIndicator(
      raw.committee?.weeksRemaining,
      DEFAULT_COMMITTEE.weeksRemaining,
      0,
      52
    ),
    signatures: safeIndicator(
      raw.committee?.signatures,
      DEFAULT_COMMITTEE.signatures,
      0,
      500000
    ),
    targetSignatures: safeIndicator(
      raw.committee?.targetSignatures,
      DEFAULT_COMMITTEE.targetSignatures,
      1000,
      500000
    ),
    committeesOpened: safeIndicator(
      raw.committee?.committeesOpened,
      DEFAULT_COMMITTEE.committeesOpened,
      0,
      200
    ),
    targetCommittees: safeIndicator(
      raw.committee?.targetCommittees,
      DEFAULT_COMMITTEE.targetCommittees,
      1,
      200
    ),
    completed: Boolean(raw.committee?.completed ?? DEFAULT_COMMITTEE.completed),
  };

  const mergedLeader: LeaderProfile = {
    name: sanitizePlainText(raw.leader?.name, 44, 'Leader'),
    age:
      typeof raw.leader?.age === 'number' && Number.isFinite(raw.leader.age)
        ? Math.max(18, Math.min(90, Math.round(raw.leader.age)))
        : 45,
    style: raw.leader?.style ?? 'istituzionale',
    traits:
      Array.isArray(raw.leader?.traits) && raw.leader.traits.length === 2
        ? [raw.leader.traits[0], raw.leader.traits[1]]
        : ['oratore_tv', 'economista'],
  };

  const validElectoralLaws: ElectoralLawId[] = [
    'rosatellum',
    'proporzionale',
    'maggioritario',
    'premio_maggioranza',
  ];
  const electoralLaw: ElectoralLawId = validElectoralLaws.includes(raw.electoralLaw)
    ? raw.electoralLaw
    : 'rosatellum';

  const validRegimes: RegimeStatus[] = [
    'repubblica_parlamentare',
    'democrazia_illiberale',
    'regime_autoritario',
  ];
  const regimeStatus: RegimeStatus = validRegimes.includes(raw.regimeStatus)
    ? raw.regimeStatus
    : mergedInstitutionalFlags.fullPowers
      ? 'regime_autoritario'
      : mergedStateIndicators.democraticHealth < 45
        ? 'democrazia_illiberale'
        : 'repubblica_parlamentare';

  const effectiveSchema = Math.max(
    CURRENT_SCHEMA_VERSION,
    savedSchemaVersion ?? 0,
    raw.schemaVersion ?? 0
  );

  const validSpecs = new Set<ExecutiveSpecialization>(ALL_EXECUTIVE_SPECIALIZATIONS);
  const migratedExecutives: ExecutiveMember[] = (raw.executives ?? []).slice(0, 30).map((ex, idx) => {
    const rawSpec = (ex as Partial<ExecutiveMember>).specialization;
    const specialization: ExecutiveSpecialization =
      rawSpec && validSpecs.has(rawSpec)
        ? rawSpec
        : inferExecutiveSpecialization(ex.role, ex.faction);
    return {
      ...ex,
      id: sanitizePlainText(ex.id, 48, `exec_${idx}`),
      roleLabel: sanitizePlainText(ex.roleLabel, 64, 'Dirigente'),
      name: sanitizePlainText(ex.name, 48, 'Dirigente'),
      faction: sanitizePlainText(ex.faction, 48, 'Area Nazionale'),
      trait: sanitizePlainText(ex.trait, 80, 'Esperienza amministrativa'),
      competence: safeIndicator(ex.competence, 70, 10, 100),
      loyalty: safeIndicator(ex.loyalty, 70, 0, 100),
      ambition: safeIndicator(ex.ambition, 50, 0, 100),
      actedThisWeek: Boolean(ex.actedThisWeek),
      specialization,
      lowLoyaltyWeeks:
        typeof ex.lowLoyaltyWeeks === 'number' && Number.isFinite(ex.lowLoyaltyWeeks)
          ? Math.max(0, Math.min(200, Math.round(ex.lowLoyaltyWeeks)))
          : 0,
    };
  });

  const validMinistryIds: MinistryId[] = [
    'mef',
    'interno',
    'giustizia',
    'esteri',
    'infrastrutture',
    'salute',
    'istruzione',
    'ambiente',
  ];
  const mergedMinistries: Partial<Record<MinistryId, string>> = {};
  if (raw.governmentMinistries && typeof raw.governmentMinistries === 'object') {
    for (const mId of validMinistryIds) {
      const holder = raw.governmentMinistries[mId];
      if (typeof holder === 'string' && holder.length > 0 && validPartyIds.has(holder)) {
        mergedMinistries[mId] = holder;
      }
    }
  }

  // Migra abbinamenti dirigenti <-> ministeri detenuti dal giocatore
  const validExecIds = new Set(migratedExecutives.map((e) => e.id));
  const autoMinistryExecs = buildAutoMinistryExecutives(
    mergedMinistries,
    safePlayerPartyId,
    migratedExecutives
  );
  const mergedMinistryExecs: Partial<Record<MinistryId, string>> = {};
  for (const mId of validMinistryIds) {
    if (mergedMinistries[mId] !== safePlayerPartyId) continue;
    const savedExecId = raw.governmentMinistryExecutives?.[mId];
    if (typeof savedExecId === 'string' && validExecIds.has(savedExecId)) {
      mergedMinistryExecs[mId] = savedExecId;
    } else if (autoMinistryExecs[mId]) {
      mergedMinistryExecs[mId] = autoMinistryExecs[mId];
    }
  }

  const lowCohesionStreak =
    typeof raw.lowCohesionStreak === 'number' && Number.isFinite(raw.lowCohesionStreak)
      ? Math.max(0, Math.round(raw.lowCohesionStreak))
      : 0;
  const schismCount =
    typeof raw.schismCount === 'number' && Number.isFinite(raw.schismCount)
      ? Math.max(0, Math.round(raw.schismCount))
      : raw.schismOccurred
        ? 1
        : 0;

  const mergedAllySatisfaction: Record<string, number> = {};
  if (raw.allySatisfaction && typeof raw.allySatisfaction === 'object') {
    for (const [partyId, val] of Object.entries(raw.allySatisfaction)) {
      if (validPartyIds.has(partyId) && typeof val === 'number' && Number.isFinite(val)) {
        mergedAllySatisfaction[partyId] = Math.max(0, Math.min(100, Math.round(val)));
      }
    }
  }

  const isPrimeMinister =
    typeof raw.isPrimeMinister === 'boolean'
      ? raw.isPrimeMinister
      : (raw.governmentRole ?? 'opposizione') === 'premier';

  const lastBudgetWeek =
    typeof raw.lastBudgetWeek === 'number' && Number.isFinite(raw.lastBudgetWeek)
      ? Math.max(0, Math.round(raw.lastBudgetWeek))
      : 0;

  const pendingBudgetLaw = Boolean(raw.pendingBudgetLaw);

  const rawMod = raw.budgetModifiers as Partial<BudgetModifiers> | null | undefined;
  const budgetModifiers: BudgetModifiers | null =
    rawMod && typeof rawMod === 'object' && typeof rawMod.deficitGdpPct === 'number'
      ? {
          label: rawMod.label ?? 'Manovra Finanziaria',
          deficitGdpPct: rawMod.deficitGdpPct,
          netBillions: typeof rawMod.netBillions === 'number' ? rawMod.netBillions : 15,
          weeklySpreadDrift:
            typeof rawMod.weeklySpreadDrift === 'number' ? rawMod.weeklySpreadDrift : 0,
          weeklyStabilityDrift:
            typeof rawMod.weeklyStabilityDrift === 'number' ? rawMod.weeklyStabilityDrift : 0,
          weeklyEuDrift: typeof rawMod.weeklyEuDrift === 'number' ? rawMod.weeklyEuDrift : 0,
          demoWeeklyBonus:
            rawMod.demoWeeklyBonus && typeof rawMod.demoWeeklyBonus === 'object'
              ? { ...rawMod.demoWeeklyBonus }
              : {},
          activeUntilWeek:
            typeof rawMod.activeUntilWeek === 'number' ? rawMod.activeUntilWeek : safeWeek + 24,
          allocation: {
            fisco: rawMod.allocation?.fisco ?? 8,
            sanita: rawMod.allocation?.sanita ?? 8,
            giovani: rawMod.allocation?.giovani ?? 6,
            infrastrutture: rawMod.allocation?.infrastrutture ?? 6,
            coperture: rawMod.allocation?.coperture ?? 10,
          },
        }
      : null;

  const defaultApproval = buildDefaultLeaderApproval(
    parties,
    safePlayerPartyId,
    mergedLeader.style,
    mergedLeader.traits
  );
  const mergedLeaderApproval: Record<string, number> = { ...defaultApproval };
  if (raw.leaderApproval && typeof raw.leaderApproval === 'object') {
    for (const [partyId, val] of Object.entries(raw.leaderApproval)) {
      if (typeof val === 'number' && Number.isFinite(val)) {
        mergedLeaderApproval[partyId] = Math.max(5, Math.min(95, Math.round(val)));
      }
    }
  }
  const mergedPreviousLeaderApproval: Record<string, number> = { ...mergedLeaderApproval };
  if (raw.previousLeaderApproval && typeof raw.previousLeaderApproval === 'object') {
    for (const [partyId, val] of Object.entries(raw.previousLeaderApproval)) {
      if (typeof val === 'number' && Number.isFinite(val)) {
        mergedPreviousLeaderApproval[partyId] = Math.max(5, Math.min(95, Math.round(val)));
      }
    }
  }

  const safeElectionWeek =
    typeof raw.electionWeek === 'number' && Number.isFinite(raw.electionWeek)
      ? Math.max(safeWeek, Math.round(raw.electionWeek))
      : safeWeek + 20;

  // Schema v16/v21 — Regola ferrea sui seggi parlamentari:
  // Usa legislatureSeats salvati se validi, altrimenti seggi dell'ultima elezione o XIX Legislatura reale.
  // Migrazione v21: se il salvataggio precedente (schema < 21) conserva ancora i vecchi seggi iniziali
  // della XIX Legislatura (prima di qualsiasi nuova elezione politica o scissione parlamentare),
  // riallinea automaticamente Camera (400) e Senato (200) ai dati reali di novembre 2026 (incluso Futuro Nazionale 9/0).
  const priorSchemaVersion = Math.max(savedSchemaVersion ?? 0, raw.schemaVersion ?? 0);
  const rawSeatSource =
    Array.isArray(raw.legislatureSeats) && raw.legislatureSeats.length > 0
      ? raw.legislatureSeats
      : Array.isArray(raw.election?.seats) && raw.election.seats.length > 0
        ? raw.election.seats
        : null;

  const legacySeatMatch = (() => {
    if (priorSchemaVersion >= 21 || !rawSeatSource || raw.election) return false;
    if ((raw.schismCount ?? 0) > 0) return false;
    const findSeat = (id: string) => rawSeatSource.find((s) => s && s.partyId === id);
    const fdiS = findSeat('fdi');
    const legaS = findSeat('lega');
    const fiS = findSeat('fi');
    const pdS = findSeat('pd');
    const fnS = findSeat('fn');
    const fnHasZero = !fnS || ((fnS.camera ?? 0) + (fnS.senato ?? 0)) === 0;
    const anchorMatches =
      (fdiS?.camera === 119 && fdiS?.senato === 66 ? 1 : 0) +
      (legaS?.camera === 66 && legaS?.senato === 29 ? 1 : 0) +
      (fiS?.camera === 45 && fiS?.senato === 18 ? 1 : 0) +
      (pdS?.camera === 69 && pdS?.senato === 38 ? 1 : 0);
    return fnHasZero && anchorMatches >= 3;
  })();

  let migratedLegislatureSeats: SeatAllocation[];
  if (rawSeatSource && !legacySeatMatch) {
    const byId = new Map<string, SeatAllocation>();
    for (const s of rawSeatSource) {
      if (!s || typeof s.partyId !== 'string' || !validPartyIds.has(s.partyId)) continue;
      byId.set(s.partyId, {
        partyId: s.partyId,
        camera:
          typeof s.camera === 'number' && Number.isFinite(s.camera)
            ? Math.max(0, Math.round(s.camera))
            : 0,
        senato:
          typeof s.senato === 'number' && Number.isFinite(s.senato)
            ? Math.max(0, Math.round(s.senato))
            : 0,
        coalitionId: s.coalitionId ?? null,
      });
    }
    migratedLegislatureSeats = parties.map((p) => {
      const existing = byId.get(p.id);
      return (
        existing ?? {
          partyId: p.id,
          camera: 0,
          senato: 0,
          coalitionId: p.coalitionId,
        }
      );
    });
  } else {
    migratedLegislatureSeats = buildInitialLegislatureSeats(parties);
  }

  // Sanatoria automatica status parlamentare & governo su TUTTI i partiti:
  // Un partito con 0 seggi in Parlamento NON può MAI risultare al Governo o in Parlamento.
  const seatCountByParty = new Map<string, number>();
  for (const s of migratedLegislatureSeats) {
    seatCountByParty.set(s.partyId, s.camera + s.senato);
  }
  const playerTotalSittingSeats = seatCountByParty.get(safePlayerPartyId) ?? 0;
  const safeExtraParl = playerTotalSittingSeats === 0;
  const safeGovernmentRole: GameState['governmentRole'] = safeExtraParl
    ? 'opposizione'
    : (raw.governmentRole ?? 'opposizione');
  const safeIsPrimeMinister = safeExtraParl ? false : isPrimeMinister;
  const sanitizedMinistries: Partial<Record<MinistryId, string>> = safeExtraParl
    ? {}
    : mergedMinistries;
  const sanitizedMinistryExecs: Partial<Record<MinistryId, string>> = safeExtraParl
    ? {}
    : mergedMinistryExecs;
  const sanitizedAllySatisfaction: Record<string, number> = safeExtraParl
    ? {}
    : mergedAllySatisfaction;

  parties = parties.map((p) => {
    const seatsNow = seatCountByParty.get(p.id) ?? 0;
    if (seatsNow === 0) {
      return { ...p, isInGovernment: false };
    }
    if (p.id === safePlayerPartyId) {
      return {
        ...p,
        isInGovernment: safeIsPrimeMinister || safeGovernmentRole !== 'opposizione',
      };
    }
    if (legacySeatMatch && p.id !== 'altri') {
      return {
        ...p,
        isInGovernment: INITIAL_GOVERNMENT_PARTY_IDS.has(p.id),
      };
    }
    return p;
  });

  const defaultBallot = createInitialBallotSignatures({
    parties,
    playerPartyId: safePlayerPartyId,
    electoralLaw,
    extraParliamentary: safeExtraParl,
    legislatureSeats: migratedLegislatureSeats,
    electionWeek: safeElectionWeek,
  });

  const rawBallot = raw.ballotSignatures as Partial<BallotSignatureCampaign> | undefined;
  const validBallotTypes: BallotElectionType[] = ['politiche', 'europee', 'regionali'];
  const safeBallotType: BallotElectionType =
    rawBallot?.electionType && validBallotTypes.includes(rawBallot.electionType)
      ? rawBallot.electionType
      : defaultBallot.electionType;
  const safeBallotRegion: RegionId = rawBallot?.targetRegionId ?? defaultBallot.targetRegionId ?? 'lazio';
  const safeBallotTarget =
    typeof rawBallot?.targetSignatures === 'number' &&
    Number.isFinite(rawBallot.targetSignatures) &&
    rawBallot.targetSignatures > 0
      ? Math.round(rawBallot.targetSignatures)
      : getBallotTargetForType(safeBallotType, safeBallotRegion);

  const migratedBallotSignatures: BallotSignatureCampaign = {
    ...defaultBallot,
    electionType: safeBallotType,
    targetRegionId: safeBallotRegion,
    targetSignatures: safeBallotTarget,
    collectedSignatures:
      typeof rawBallot?.collectedSignatures === 'number' &&
      Number.isFinite(rawBallot.collectedSignatures)
        ? Math.max(0, Math.min(safeBallotTarget, Math.round(rawBallot.collectedSignatures)))
        : defaultBallot.collectedSignatures,
    deadlineWeek: Math.max(safeWeek, safeElectionWeek - 1),
    banchettiThisWeek:
      typeof rawBallot?.banchettiThisWeek === 'number' && Number.isFinite(rawBallot.banchettiThisWeek)
        ? Math.max(0, Math.min(2, Math.round(rawBallot.banchettiThisWeek)))
        : 0,
    totalBanchetti:
      typeof rawBallot?.totalBanchetti === 'number' && Number.isFinite(rawBallot.totalBanchetti)
        ? Math.max(0, Math.round(rawBallot.totalBanchetti))
        : 0,
    excludedFromBallot: Boolean(rawBallot?.excludedFromBallot),
  };

  const sanitizeReferendum = (ref: unknown): ActiveReferendum | null => {
    if (!ref || typeof ref !== 'object') return null;
    const r = ref as Partial<ActiveReferendum>;
    if (typeof r.id !== 'string' || typeof r.templateId !== 'string') return null;
    const validKind = r.kind === 'costituzionale' ? 'costituzionale' : 'abrogativo';
    const validPhase =
      r.phase === 'raccolta_firme' || r.phase === 'campagna' || r.phase === 'concluso'
        ? r.phase
        : 'concluso';
    const validStance = (s: unknown): ReferendumStance | null =>
      s === 'si' || s === 'no' || s === 'astensione' ? s : null;
    const safePartyStances: Record<string, ReferendumStance> = {};
    if (r.partyStances && typeof r.partyStances === 'object') {
      for (const [pid, st] of Object.entries(r.partyStances)) {
        const parsedSt = validStance(st);
        if (validPartyIds.has(pid) && parsedSt) {
          safePartyStances[pid] = parsedSt;
        }
      }
    }
    return {
      id: sanitizePlainText(r.id, 48, 'ref_migrated'),
      templateId: sanitizePlainText(r.templateId, 64, 'ref_unknown'),
      title: sanitizePlainText(r.title, 120, 'Referendum Nazionale'),
      shortTitle: sanitizePlainText(r.shortTitle, 52, 'Referendum'),
      lawTargetId: typeof r.lawTargetId === 'string' ? sanitizePlainText(r.lawTargetId, 64) : undefined,
      lawTargetLabel: sanitizePlainText(r.lawTargetLabel, 120, 'Normativa Vigente'),
      summary: sanitizePlainText(r.summary, 360, ''),
      kind: validKind,
      phase: validPhase,
      startedAtWeek: typeof r.startedAtWeek === 'number' && Number.isFinite(r.startedAtWeek) ? r.startedAtWeek : safeWeek,
      signatures: typeof r.signatures === 'number' && Number.isFinite(r.signatures) ? Math.max(0, Math.round(r.signatures)) : 0,
      targetSignatures:
        typeof r.targetSignatures === 'number' && Number.isFinite(r.targetSignatures)
          ? Math.max(0, Math.round(r.targetSignatures))
          : validKind === 'abrogativo'
            ? 500000
            : 0,
      signatureDeadlineWeek:
        typeof r.signatureDeadlineWeek === 'number' && Number.isFinite(r.signatureDeadlineWeek)
          ? r.signatureDeadlineWeek
          : safeWeek + 8,
      voteWeek: typeof r.voteWeek === 'number' && Number.isFinite(r.voteWeek) ? r.voteWeek : safeWeek + 4,
      requiresQuorum: typeof r.requiresQuorum === 'boolean' ? r.requiresQuorum : validKind === 'abrogativo',
      playerStance: validStance(r.playerStance),
      campaignBudgetSpent:
        typeof r.campaignBudgetSpent === 'number' && Number.isFinite(r.campaignBudgetSpent)
          ? Math.max(0, Math.round(r.campaignBudgetSpent))
          : 0,
      playerCampaignBoost:
        typeof r.playerCampaignBoost === 'number' && Number.isFinite(r.playerCampaignBoost)
          ? Math.max(0, Math.min(20, r.playerCampaignBoost))
          : 0,
      banchettiThisWeek:
        typeof r.banchettiThisWeek === 'number' && Number.isFinite(r.banchettiThisWeek)
          ? Math.max(0, Math.min(2, Math.round(r.banchettiThisWeek)))
          : 0,
      partyStances: safePartyStances,
      projectedTurnout:
        typeof r.projectedTurnout === 'number' && Number.isFinite(r.projectedTurnout)
          ? Math.max(0, Math.min(100, r.projectedTurnout))
          : 50,
      projectedYesPct:
        typeof r.projectedYesPct === 'number' && Number.isFinite(r.projectedYesPct)
          ? Math.max(0, Math.min(100, r.projectedYesPct))
          : 50,
      promotedByPlayer: Boolean(r.promotedByPlayer),
      result: r.result && typeof r.result === 'object'
        ? {
            turnout: Number.isFinite(r.result.turnout) ? r.result.turnout : 0,
            quorumReached: Boolean(r.result.quorumReached),
            yesPct: Number.isFinite(r.result.yesPct) ? r.result.yesPct : 0,
            noPct: Number.isFinite(r.result.noPct) ? r.result.noPct : 0,
            approved: Boolean(r.result.approved),
            playerWon: Boolean(r.result.playerWon),
            headline: sanitizePlainText(r.result.headline, 160, 'Esito Referendum'),
            narrative: sanitizePlainText(r.result.narrative, 380, ''),
            pollDelta: Number.isFinite(r.result.pollDelta) ? r.result.pollDelta : 0,
          }
        : undefined,
    };
  };

  const migratedActiveReferendum = sanitizeReferendum(raw.activeReferendum);
  const migratedReferendumHistory = (Array.isArray(raw.referendumHistory) ? raw.referendumHistory : [])
    .map((item) => sanitizeReferendum(item))
    .filter((item): item is ActiveReferendum => Boolean(item))
    .slice(0, 12);

  const migratedPendingConstRefs = (
    Array.isArray(raw.pendingConstitutionalReferendumLawIds)
      ? raw.pendingConstitutionalReferendumLawIds
      : []
  )
    .filter((id): id is string => typeof id === 'string' && id.length > 0 && id.length <= 64)
    .map((id) => sanitizePlainText(id, 64));

  const migratedLawVoteHistory = (Array.isArray(raw.lawVoteHistory) ? raw.lawVoteHistory : [])
    .slice(0, 24)
    .map((rec) => ({
      ...rec,
      title: sanitizePlainText(rec?.title, 120, 'Provvedimento'),
      summary: sanitizePlainText(rec?.summary, 280, ''),
    }));

  const migratedMediaFeed = (Array.isArray(raw.mediaFeed) ? raw.mediaFeed : [])
    .filter((item) => isPlainRecord(item))
    .slice(0, 40)
    .map((item, idx) => ({
      ...item,
      id: sanitizePlainText(item.id, 48, `med_${idx}`),
      week: isFiniteNumber(item.week) ? Math.max(1, Math.round(item.week)) : safeWeek,
      dateLabel: sanitizePlainText(item.dateLabel, 32, formatGameDate(safeWeek).shortLabel),
      source: sanitizePlainText(item.source, 64, 'Stampa Nazionale'),
      handle: item.handle ? sanitizePlainText(item.handle, 40, '') : undefined,
      headline: sanitizePlainText(item.headline, 180, 'Notizia politica'),
      excerpt: sanitizePlainText(item.excerpt, 360, ''),
      engagement: item.engagement ? sanitizePlainText(item.engagement, 40, '') : undefined,
      partyColor: item.partyColor ? sanitizeHexColor(item.partyColor, '#06B6D4') : undefined,
    }));

  const migratedActionLog = (Array.isArray(raw.actionLog) ? raw.actionLog : [])
    .filter((item) => isPlainRecord(item))
    .slice(0, 30)
    .map((item, idx) => ({
      ...item,
      id: sanitizePlainText(item.id, 48, `act_${idx}`),
      week: isFiniteNumber(item.week) ? Math.max(1, Math.round(item.week)) : safeWeek,
      cost: isFiniteNumber(item.cost) ? Math.max(0, Math.round(item.cost)) : 0,
      category: sanitizePlainText(item.category, 48, 'Azione'),
      title: sanitizePlainText(item.title, 100, 'Iniziativa'),
      summary: sanitizePlainText(item.summary, 280, ''),
    }));

  const validLegislativeStage = (s: unknown, fallback: LegislativeStage): LegislativeStage =>
    s === 'commissione' || s === 'camera' || s === 'senato' || s === 'promulgazione' ? s : fallback;
  const validFloorAction = (
    a: unknown
  ): PendingBill['playerFloorAction'] =>
    a === 'emendamento_accolto' ||
    a === 'emendamento_respinto' ||
    a === 'ostruzionismo' ||
    a === 'piazza_pro' ||
    a === 'piazza_contro'
      ? a
      : undefined;

  const migratedActiveDecrees: ActiveDecreeLaw[] = (
    Array.isArray(raw.activeDecreeLaws) ? raw.activeDecreeLaws : []
  )
    .filter((d) => Boolean(d && typeof d.id === 'string' && typeof d.lawId === 'string'))
    .slice(0, 12)
    .map((d) => {
      const rem =
        typeof d.weeksRemaining === 'number' && Number.isFinite(d.weeksRemaining)
          ? Math.max(0, Math.round(d.weeksRemaining))
          : 0;
      const status =
        d.status === 'convertito' || d.status === 'decaduto'
          ? d.status
          : 'in_conversione';
      const defaultStage: LegislativeStage =
        status === 'convertito'
          ? 'promulgazione'
          : rem >= 6
            ? 'commissione'
            : rem >= 4
              ? 'camera'
              : 'senato';
      return {
        ...d,
        title: sanitizePlainText(d.title, 120, 'Decreto-Legge'),
        weeksRemaining: rem,
        status,
        confidenceUsed: Boolean(d.confidenceUsed),
        stage: validLegislativeStage(d.stage, defaultStage),
        navettaCount:
          typeof d.navettaCount === 'number' && Number.isFinite(d.navettaCount)
            ? Math.max(0, Math.min(5, Math.round(d.navettaCount)))
            : 0,
        hostileAmendmentsCount:
          typeof d.hostileAmendmentsCount === 'number' && Number.isFinite(d.hostileAmendmentsCount)
            ? Math.max(0, Math.round(d.hostileAmendmentsCount))
            : 0,
        blockedByAmendments: Boolean(d.blockedByAmendments),
        amendmentConsensusShift:
          typeof d.amendmentConsensusShift === 'number' && Number.isFinite(d.amendmentConsensusShift)
            ? Math.max(-25, Math.min(25, Math.round(d.amendmentConsensusShift)))
            : 0,
        promotedByPlayer: typeof d.promotedByPlayer === 'boolean' ? d.promotedByPlayer : true,
        sponsorAcronym: d.sponsorAcronym ? sanitizePlainText(d.sponsorAcronym, 16) : undefined,
        playerFloorAction: validFloorAction(d.playerFloorAction),
      };
    });

  let migratedPendingBills: PendingBill[] = (
    Array.isArray(raw.pendingBills) ? raw.pendingBills : []
  )
    .filter((b) => Boolean(b && typeof b.id === 'string' && typeof b.lawId === 'string'))
    .slice(0, 12)
    .map((b) => {
      const totalWeeks =
        typeof b.totalWeeks === 'number' && Number.isFinite(b.totalWeeks)
          ? Math.max(1, Math.min(12, Math.round(b.totalWeeks)))
          : 4;
      const weeksRemaining =
        typeof b.weeksRemaining === 'number' && Number.isFinite(b.weeksRemaining)
          ? Math.max(0, Math.min(totalWeeks + 4, Math.round(b.weeksRemaining)))
          : 2;
      const fallbackStage: LegislativeStage =
        weeksRemaining >= 4
          ? 'commissione'
          : weeksRemaining === 3
            ? 'camera'
            : weeksRemaining === 2
              ? 'senato'
              : 'promulgazione';
      const safeStage = validLegislativeStage(b.stage, fallbackStage);
      return {
        id: sanitizePlainText(b.id, 48, 'bill_migrated'),
        lawId: sanitizePlainText(b.lawId, 64, 'law_generic'),
        title: sanitizePlainText(b.title, 120, 'Disegno di Legge'),
        startedAtWeek:
          typeof b.startedAtWeek === 'number' && Number.isFinite(b.startedAtWeek)
            ? Math.max(1, Math.round(b.startedAtWeek))
            : safeWeek,
        totalWeeks,
        weeksRemaining,
        stage: safeStage,
        blockedByAmendments: Boolean(b.blockedByAmendments),
        hostileAmendmentsCount:
          typeof b.hostileAmendmentsCount === 'number' &&
          Number.isFinite(b.hostileAmendmentsCount)
            ? Math.max(0, Math.round(b.hostileAmendmentsCount))
            : 0,
        confidenceUsed: Boolean(b.confidenceUsed),
        promotedByPlayer: typeof b.promotedByPlayer === 'boolean' ? b.promotedByPlayer : true,
        sponsorPartyId:
          typeof b.sponsorPartyId === 'string' && validPartyIds.has(b.sponsorPartyId)
            ? b.sponsorPartyId
            : undefined,
        sponsorAcronym: b.sponsorAcronym ? sanitizePlainText(b.sponsorAcronym, 16) : undefined,
        navettaCount:
          typeof b.navettaCount === 'number' && Number.isFinite(b.navettaCount)
            ? Math.max(0, Math.min(5, Math.round(b.navettaCount)))
            : 0,
        lastNavettaNote: b.lastNavettaNote ? sanitizePlainText(b.lastNavettaNote, 240) : undefined,
        amendmentConsensusShift:
          typeof b.amendmentConsensusShift === 'number' && Number.isFinite(b.amendmentConsensusShift)
            ? Math.max(-25, Math.min(25, Math.round(b.amendmentConsensusShift)))
            : 0,
        playerFloorAction: validFloorAction(b.playerFloorAction),
        secretBallotRisk:
          typeof b.secretBallotRisk === 'number' && Number.isFinite(b.secretBallotRisk)
            ? Math.max(0, Math.min(95, Math.round(b.secretBallotRisk)))
            : undefined,
      };
    });

  if (migratedPendingBills.length === 0 && regimeStatus !== 'regime_autoritario') {
    const safeEnactedIds = Array.isArray(raw.enactedLawIds) ? raw.enactedLawIds : [];
    migratedPendingBills = buildInitialGovernmentPendingBill(
      parties,
      safePlayerPartyId,
      safeEnactedIds,
      safeWeek
    );
  }

  const safeChamberTension =
    typeof raw.chamberTension === 'number' && Number.isFinite(raw.chamberTension)
      ? Math.max(0, Math.min(100, Math.round(raw.chamberTension)))
      : 28;
  const safeLastQuestionTimeWeek =
    typeof raw.lastQuestionTimeWeek === 'number' && Number.isFinite(raw.lastQuestionTimeWeek)
      ? Math.round(raw.lastQuestionTimeWeek)
      : -10;
  const safeLastMotionWeek =
    typeof raw.lastMotionWeek === 'number' && Number.isFinite(raw.lastMotionWeek)
      ? Math.round(raw.lastMotionWeek)
      : -10;
  const rawFt = raw.lastFrancTireursEvent as Partial<FrancTireursIncident> | null | undefined;
  const migratedLastFrancTireursEvent: FrancTireursIncident | null =
    rawFt && typeof rawFt === 'object' && typeof rawFt.billTitle === 'string'
      ? {
          id: sanitizePlainText(rawFt.id, 48, 'ft_migrated'),
          week: isFiniteNumber(rawFt.week) ? Math.max(1, Math.round(rawFt.week)) : safeWeek,
          dateLabel: sanitizePlainText(rawFt.dateLabel, 32, formatGameDate(safeWeek).shortLabel),
          billTitle: sanitizePlainText(rawFt.billTitle, 120, 'Provvedimento'),
          defectionsCamera: isFiniteNumber(rawFt.defectionsCamera)
            ? Math.max(0, Math.round(rawFt.defectionsCamera))
            : 0,
          defectionsSenato: isFiniteNumber(rawFt.defectionsSenato)
            ? Math.max(0, Math.round(rawFt.defectionsSenato))
            : 0,
          wentUnder: Boolean(rawFt.wentUnder),
          resolved: Boolean(rawFt.resolved),
          summary: sanitizePlainText(rawFt.summary, 280, ''),
        }
      : null;

  const migratedParliamentaryActionHistory: ParliamentaryActionRecord[] = (
    Array.isArray(raw.parliamentaryActionHistory) ? raw.parliamentaryActionHistory : []
  )
    .filter((item) => isPlainRecord(item))
    .slice(0, 20)
    .map((item, idx) => {
      const kind: ParliamentaryActionRecord['kind'] =
        item.kind === 'question_time' ||
        item.kind === 'mozione' ||
        item.kind === 'emendamento' ||
        item.kind === 'ostruzionismo' ||
        item.kind === 'piazza' ||
        item.kind === 'vertice'
          ? item.kind
          : 'emendamento';
      const outcome: ParliamentaryActionRecord['outcome'] =
        item.outcome === 'successo' || item.outcome === 'misto' || item.outcome === 'respinto'
          ? item.outcome
          : 'misto';
      return {
        id: sanitizePlainText(item.id, 48, `pact_${idx}`),
        week: isFiniteNumber(item.week) ? Math.max(1, Math.round(item.week)) : safeWeek,
        dateLabel: sanitizePlainText(item.dateLabel, 32, formatGameDate(safeWeek).shortLabel),
        kind,
        title: sanitizePlainText(item.title, 120, 'Attività d’Aula'),
        outcome,
        summary: sanitizePlainText(item.summary, 300, ''),
      };
    });

  const sanitizeCommission = (c: unknown): InquiryCommission | null => {
    if (!c || typeof c !== 'object') return null;
    const item = c as Partial<InquiryCommission>;
    if (typeof item.id !== 'string' || typeof item.topicId !== 'string') return null;
    return {
      id: sanitizePlainText(item.id, 48, 'comm_migrated'),
      topicId: sanitizePlainText(item.topicId, 64, 'comm_generic'),
      title: sanitizePlainText(item.title, 140, 'Commissione d’Inchiesta'),
      targetArea: sanitizePlainText(item.targetArea, 64, 'Parlamento'),
      startedAtWeek:
        typeof item.startedAtWeek === 'number' && Number.isFinite(item.startedAtWeek)
          ? item.startedAtWeek
          : safeWeek,
      durationWeeks:
        typeof item.durationWeeks === 'number' && Number.isFinite(item.durationWeeks)
          ? Math.max(1, Math.round(item.durationWeeks))
          : 5,
      weeksRemaining:
        typeof item.weeksRemaining === 'number' && Number.isFinite(item.weeksRemaining)
          ? Math.max(0, Math.round(item.weeksRemaining))
          : 0,
      promotedByPlayer: Boolean(item.promotedByPlayer),
      sponsorPartyName: item.sponsorPartyName
        ? sanitizePlainText(item.sponsorPartyName, 48)
        : undefined,
      mediaPressure:
        typeof item.mediaPressure === 'number' && Number.isFinite(item.mediaPressure)
          ? Math.max(0, Math.min(100, Math.round(item.mediaPressure)))
          : undefined,
      status: item.status === 'conclusa' ? 'conclusa' : 'attiva',
      reportHeadline: item.reportHeadline
        ? sanitizePlainText(item.reportHeadline, 180)
        : undefined,
      reportSummary: item.reportSummary
        ? sanitizePlainText(item.reportSummary, 360)
        : undefined,
      pollImpact:
        typeof item.pollImpact === 'number' && Number.isFinite(item.pollImpact)
          ? item.pollImpact
          : undefined,
    };
  };

  const migratedActiveCommissions = (
    Array.isArray(raw.activeCommissions) ? raw.activeCommissions : []
  )
    .map(sanitizeCommission)
    .filter((c): c is InquiryCommission => Boolean(c))
    .slice(0, 6);

  const migratedCommissionHistory = (
    Array.isArray(raw.commissionHistory) ? raw.commissionHistory : []
  )
    .map(sanitizeCommission)
    .filter((c): c is InquiryCommission => Boolean(c))
    .slice(0, 12);

  const safePresidentName = sanitizePlainText(
    raw.currentPresidentName,
    60,
    'Sergio Mattarella'
  );
  const safeQuirinaleTermEndWeek =
    typeof raw.quirinaleTermEndWeek === 'number' && Number.isFinite(raw.quirinaleTermEndWeek)
      ? Math.max(safeWeek + 1, Math.round(raw.quirinaleTermEndWeek))
      : Math.max(safeWeek + 12, 36);

  const migratedQuirinaleElection: QuirinaleElectionState | null =
    raw.quirinaleElection && typeof raw.quirinaleElection === 'object' && raw.quirinaleElection.active
      ? {
          ...raw.quirinaleElection,
          candidates: Array.isArray(raw.quirinaleElection.candidates)
            ? raw.quirinaleElection.candidates.map((c) => ({
                ...c,
                name: sanitizePlainText(c.name, 48, 'Candidato'),
                roleLabel: sanitizePlainText(c.roleLabel, 80, 'Profilo Istituzionale'),
                bio: sanitizePlainText(c.bio, 240, ''),
              }))
            : [],
          negotiatedPartyIds: Array.isArray(raw.quirinaleElection.negotiatedPartyIds)
            ? raw.quirinaleElection.negotiatedPartyIds.filter((id) => validPartyIds.has(id))
            : [],
          negotiatedCandidateMap:
            raw.quirinaleElection.negotiatedCandidateMap &&
            typeof raw.quirinaleElection.negotiatedCandidateMap === 'object'
              ? { ...raw.quirinaleElection.negotiatedCandidateMap }
              : {},
          ballotHistory: Array.isArray(raw.quirinaleElection.ballotHistory)
            ? raw.quirinaleElection.ballotHistory
            : [],
        }
      : null;

  const playerPollForFund =
    parties.find((p) => p.id === safePlayerPartyId)?.nationalPoll ?? 1;
  const defaultFundraising = createInitialFundraisingState(
    playerPollForFund,
    Array.isArray(raw.openHeadquarters) ? raw.openHeadquarters.length : 0
  );
  const rawFund = raw.fundraising as Partial<FundraisingState> | undefined;
  const migratedFundraising: FundraisingState = {
    lastMembershipCampaignWeek:
      typeof rawFund?.lastMembershipCampaignWeek === 'number' &&
      Number.isFinite(rawFund.lastMembershipCampaignWeek)
        ? Math.max(0, Math.round(rawFund.lastMembershipCampaignWeek))
        : 0,
    activeMembersCount:
      typeof rawFund?.activeMembersCount === 'number' &&
      Number.isFinite(rawFund.activeMembersCount)
        ? Math.max(0, Math.round(rawFund.activeMembersCount))
        : defaultFundraising.activeMembersCount,
    twoPerThousandLastClaimWeek:
      typeof rawFund?.twoPerThousandLastClaimWeek === 'number' &&
      Number.isFinite(rawFund.twoPerThousandLastClaimWeek)
        ? Math.max(0, Math.round(rawFund.twoPerThousandLastClaimWeek))
        : 0,
    lastFundraisingEventWeek:
      typeof rawFund?.lastFundraisingEventWeek === 'number' &&
      Number.isFinite(rawFund.lastFundraisingEventWeek)
        ? Math.max(0, Math.round(rawFund.lastFundraisingEventWeek))
        : 0,
    totalRaisedCampaigns:
      typeof rawFund?.totalRaisedCampaigns === 'number' &&
      Number.isFinite(rawFund.totalRaisedCampaigns)
        ? Math.max(0, Math.round(rawFund.totalRaisedCampaigns))
        : 0,
    transparentLedger: Array.isArray(rawFund?.transparentLedger)
      ? rawFund.transparentLedger.slice(0, 15).map((entry) => ({
          id: sanitizePlainText(entry?.id, 48, 'fund_entry'),
          week:
            typeof entry?.week === 'number' && Number.isFinite(entry.week)
              ? entry.week
              : safeWeek,
          dateLabel: sanitizePlainText(entry?.dateLabel, 32, formatGameDate(safeWeek).shortLabel),
          source: sanitizePlainText(entry?.source, 120, 'Contributo trasparente'),
          amount:
            typeof entry?.amount === 'number' && Number.isFinite(entry.amount)
              ? Math.round(entry.amount)
              : 0,
        }))
      : [],
  };

  const rawScandal = raw.activeScandal as Partial<ExecutiveScandal> | null | undefined;
  const migratedActiveScandal: ExecutiveScandal | null =
    rawScandal &&
    typeof rawScandal === 'object' &&
    typeof rawScandal.execId === 'string' &&
    validExecIds.has(rawScandal.execId)
      ? {
          id: sanitizePlainText(rawScandal.id, 48, 'scand_migrated'),
          execId: rawScandal.execId,
          execName: sanitizePlainText(rawScandal.execName, 60, 'Dirigente'),
          execRoleLabel: sanitizePlainText(rawScandal.execRoleLabel, 64, 'Dirigente'),
          ministryId: rawScandal.ministryId,
          title: sanitizePlainText(rawScandal.title, 140, 'Indagine giudiziaria'),
          summary: sanitizePlainText(rawScandal.summary, 360, ''),
          severity: rawScandal.severity === 'Alta' ? 'Alta' : 'Critica',
          week:
            typeof rawScandal.week === 'number' && Number.isFinite(rawScandal.week)
              ? rawScandal.week
              : safeWeek,
        }
      : null;

  const safeLastScandalWeek =
    typeof raw.lastScandalWeek === 'number' && Number.isFinite(raw.lastScandalWeek)
      ? Math.max(0, Math.round(raw.lastScandalWeek))
      : 0;

  // Schema v14: Migrazione & sincronizzazione Sezioni/Circoli regionali (regionalChapters <-> openHeadquarters)
  const validOpenHqs: RegionId[] = Array.isArray(raw.openHeadquarters)
    ? Array.from(
        new Set(
          raw.openHeadquarters.filter(
            (id): id is RegionId => typeof id === 'string' && id in REGION_MAP_BY_ID
          )
        )
      )
    : [];

  const migratedRegionalChapters: Partial<Record<RegionId, RegionalChapterState>> = {};
  if (raw.regionalChapters && typeof raw.regionalChapters === 'object') {
    for (const [regKey, rawCh] of Object.entries(raw.regionalChapters)) {
      if (!(regKey in REGION_MAP_BY_ID) || !rawCh || typeof rawCh !== 'object') continue;
      const rawLevel = Number(rawCh.level);
      const safeLevel: ChapterLevel =
        rawLevel === 3 ? 3 : rawLevel === 2 ? 2 : rawLevel === 1 ? 1 : 0;
      if (safeLevel === 0) continue;
      const safeOpenedWeek =
        typeof rawCh.openedAtWeek === 'number' && Number.isFinite(rawCh.openedAtWeek)
          ? Math.max(1, Math.min(safeWeek, Math.round(rawCh.openedAtWeek)))
          : 1;
      const safeLocalMembers =
        typeof rawCh.localMembers === 'number' && Number.isFinite(rawCh.localMembers)
          ? Math.max(20, Math.round(rawCh.localMembers))
          : safeLevel === 3
            ? 420
            : safeLevel === 2
              ? 230
              : 110;
      migratedRegionalChapters[regKey as RegionId] = {
        level: safeLevel,
        openedAtWeek: safeOpenedWeek,
        localMembers: safeLocalMembers,
      };
    }
  }
  for (const hqReg of validOpenHqs) {
    if (!migratedRegionalChapters[hqReg]) {
      migratedRegionalChapters[hqReg] = {
        level: 1,
        openedAtWeek: 1,
        localMembers: 110,
      };
    }
  }
  const syncedOpenHeadquarters = Object.keys(migratedRegionalChapters) as RegionId[];

  const migratedPlayerParty = parties.find((p) => p.id === safePlayerPartyId);
  const safeWeekStartPlayerPoll =
    typeof raw.weekStartPlayerPoll === 'number' && Number.isFinite(raw.weekStartPlayerPoll)
      ? Math.max(0.1, Math.min(85, Math.round(raw.weekStartPlayerPoll * 100) / 100))
      : (migratedPlayerParty?.previousPoll ?? migratedPlayerParty?.nationalPoll ?? 1);
  const safeWeeklyTerritorialActivity = Boolean(raw.weeklyTerritorialActivity);

  // Ricalibra le spese fisse settimanali sui salvataggi precedenti allo schema v16 e sanifica sempre la cassa (no NaN / no negativi estremi)
  const matchingPreset = EXISTING_PARTIES_2026.find((p) => p.id === safePlayerPartyId);
  const fallbackPlayerBudget =
    matchingPreset?.startingBudget ?? (mergedCommittee.active ? 26000 : 50000);
  const safeBudget =
    typeof raw.budget === 'number' && Number.isFinite(raw.budget)
      ? Math.max(MAX_PLAYER_DEFICIT_FLOOR, Math.min(50000000, Math.round(raw.budget)))
      : fallbackPlayerBudget;

  const rawOverhead =
    typeof raw.weeklyOverhead === 'number' && Number.isFinite(raw.weeklyOverhead)
      ? Math.max(800, Math.min(250000, Math.round(raw.weeklyOverhead)))
      : matchingPreset?.weeklyOverhead ?? (mergedCommittee.active ? 950 : 2400);
  let safeWeeklyOverhead = rawOverhead;
  if (priorSchemaVersion < 16) {
    if (matchingPreset) {
      safeWeeklyOverhead = Math.min(rawOverhead, matchingPreset.weeklyOverhead);
    } else if (mergedCommittee.active) {
      safeWeeklyOverhead = Math.min(rawOverhead, 950);
    } else if (rawOverhead >= 4500) {
      safeWeeklyOverhead = 2400;
    }
  }

  // Sanifica le casse e i parametri economici di tutti i partiti (inclusi partiti IA) senza alterare i salvataggi validi
  parties = parties.map((p) => {
    const presetForParty = EXISTING_PARTIES_2026.find((ep) => ep.id === p.id);
    if (p.id === safePlayerPartyId) {
      return {
        ...p,
        budget: safeBudget,
        weeklyOverhead: safeWeeklyOverhead,
        aiChapterCount: syncedOpenHeadquarters.length,
      };
    }
    const defaultPartyBudget =
      presetForParty?.startingBudget ??
      (typeof p.startingBudget === 'number' && Number.isFinite(p.startingBudget)
        ? Math.max(26000, Math.round(p.startingBudget))
        : Math.max(30000, Math.round(p.nationalPoll * 25000)));
    const safePartyBudget =
      typeof p.budget === 'number' && Number.isFinite(p.budget)
        ? Math.max(MAX_AI_DEFICIT_FLOOR, Math.min(3500000, Math.round(p.budget)))
        : defaultPartyBudget;
    const safePartyOverhead =
      typeof p.weeklyOverhead === 'number' && Number.isFinite(p.weeklyOverhead)
        ? Math.max(800, Math.min(250000, Math.round(p.weeklyOverhead)))
        : (presetForParty?.weeklyOverhead ?? Math.max(1600, Math.round(1400 + p.nationalPoll * 2800)));
    const safeAiChapters =
      typeof p.aiChapterCount === 'number' && Number.isFinite(p.aiChapterCount)
        ? Math.max(0, Math.min(20, Math.round(p.aiChapterCount)))
        : (presetForParty?.startingHq.length ?? 1);
    return {
      ...p,
      budget: safePartyBudget,
      weeklyOverhead: safePartyOverhead,
      aiChapterCount: safeAiChapters,
    };
  });

  // Schema v19: Migrazione & retrocompatibilità Elezioni Europee (Blocco C4-A1)
  const defaultEuropean = buildInitialEuropeanState({
    parties,
    playerPartyId: safePlayerPartyId,
    currentWeek: safeWeek,
    legislatureSeats: migratedLegislatureSeats,
  });
  const rawEu = isPlainRecord(raw.european) ? (raw.european as Partial<EuropeanUnionState>) : null;
  const validConstituencyIds = new Set<EuropeanConstituencyId>(
    EUROPEAN_CONSTITUENCIES.map((c) => c.id)
  );
  const validEuGroupIds = new Set<EuParliamentGroupId>(
    Object.keys(EU_PARLIAMENT_GROUPS) as EuParliamentGroupId[]
  );
  const validArchetypes = new Set<EuHeadCandidateArchetypeId>(
    EU_HEAD_CANDIDATE_ARCHETYPES.map((a) => a.id)
  );
  const validTopics = new Set<EuCampaignTopicId>(EU_CAMPAIGN_TOPICS.map((t) => t.id));

  const safeEuNextElectionWeek = (() => {
    const candidateWeek =
      typeof rawEu?.nextElectionWeek === 'number' && Number.isFinite(rawEu.nextElectionWeek)
        ? Math.round(rawEu.nextElectionWeek)
        : typeof raw.europeanElectionWeek === 'number' && Number.isFinite(raw.europeanElectionWeek)
          ? Math.round(raw.europeanElectionWeek)
          : defaultEuropean.nextElectionWeek;
    if (candidateWeek < safeWeek && !rawEu?.activeElection) {
      return getNextEuropeanElectionWeek(safeWeek);
    }
    return Math.max(1, candidateWeek);
  })();

  const migratedEuSeats: Record<string, number> = { ...defaultEuropean.euSeats };
  if (rawEu && isPlainRecord(rawEu.euSeats)) {
    const hasAnyPositive = Object.values(rawEu.euSeats).some(
      (v) => typeof v === 'number' && Number.isFinite(v) && v > 0
    );
    if (hasAnyPositive) {
      for (const p of parties) {
        if (p.id === 'altri') continue;
        const val = rawEu.euSeats[p.id];
        migratedEuSeats[p.id] =
          typeof val === 'number' && Number.isFinite(val)
            ? Math.max(0, Math.min(76, Math.round(val)))
            : 0;
      }
    }
  }

  const migratedEuSeatsByConstituency: Record<string, Record<EuropeanConstituencyId, number>> = {
    ...defaultEuropean.euSeatsByConstituency,
  };
  if (rawEu && isPlainRecord(rawEu.euSeatsByConstituency)) {
    for (const p of parties) {
      if (p.id === 'altri') continue;
      const rawMap = rawEu.euSeatsByConstituency[p.id];
      if (!isPlainRecord(rawMap)) continue;
      const sanitizedMap = createZeroConstituencyRecord();
      for (const c of EUROPEAN_CONSTITUENCIES) {
        const v = rawMap[c.id];
        sanitizedMap[c.id] =
          typeof v === 'number' && Number.isFinite(v)
            ? Math.max(0, Math.min(c.seats, Math.round(v)))
            : 0;
      }
      migratedEuSeatsByConstituency[p.id] = sanitizedMap;
    }
  }

  const migratedPartyEuGroups: Record<string, EuParliamentGroupId> = {};
  for (const p of parties) {
    if (p.id === 'altri') continue;
    const rawGroup =
      rawEu && isPlainRecord(rawEu.partyEuGroups) ? rawEu.partyEuGroups[p.id] : undefined;
    migratedPartyEuGroups[p.id] =
      typeof rawGroup === 'string' && validEuGroupIds.has(rawGroup as EuParliamentGroupId)
        ? (rawGroup as EuParliamentGroupId)
        : defaultEuropean.partyEuGroups[p.id] ?? inferPartyEuGroup(p);
  }

  const getNatSeatsForParty = (pid: string): number => {
    const row = migratedLegislatureSeats.find((s) => s.partyId === pid);
    return (row?.camera ?? 0) + (row?.senato ?? 0);
  };

  const rawCartel =
    rawEu && isPlainRecord(rawEu.cartel) ? (rawEu.cartel as Partial<EuElectoralCartel>) : null;
  const migratedCartel: EuElectoralCartel | null =
    rawCartel && Array.isArray(rawCartel.memberPartyIds)
      ? (() => {
          const members = Array.from(
            new Set(
              rawCartel.memberPartyIds.filter(
                (id): id is string => typeof id === 'string' && validPartyIds.has(id)
              )
            )
          ).slice(0, 3);
          if (!members.includes(safePlayerPartyId) || members.length < 2) return null;
          const grantsExemption = members.some(
            (mid) => getNatSeatsForParty(mid) > 0 || (migratedEuSeats[mid] ?? 0) > 0
          );
          return {
            id: sanitizePlainText(rawCartel.id, 48, `cartel_${safeWeek}`),
            name: sanitizePlainText(rawCartel.name, 56, 'Cartello Europeo'),
            memberPartyIds: members,
            formedAtWeek:
              typeof rawCartel.formedAtWeek === 'number' && Number.isFinite(rawCartel.formedAtWeek)
                ? Math.max(1, Math.round(rawCartel.formedAtWeek))
                : safeWeek,
            grantsSignatureExemption: grantsExemption || Boolean(rawCartel.grantsSignatureExemption),
          };
        })()
      : null;

  const playerNatSeatsTotal = getNatSeatsForParty(safePlayerPartyId);
  const playerEuSeatsTotal = migratedEuSeats[safePlayerPartyId] ?? 0;
  const cartelGrantsExemption = Boolean(migratedCartel?.grantsSignatureExemption);

  const defaultSig = createDefaultEuSignatureCampaign({
    currentWeek: safeWeek,
    euElectionWeek: safeEuNextElectionWeek,
    playerNationalSeats: playerNatSeatsTotal,
    playerEuSeats: playerEuSeatsTotal,
    cartelGrantsExemption,
  });
  const rawSig =
    rawEu && isPlainRecord(rawEu.signatureCampaign)
      ? (rawEu.signatureCampaign as Partial<EuSignatureCampaign>)
      : null;
  const migratedByConst = createZeroConstituencyRecord();
  if (rawSig && isPlainRecord(rawSig.byConstituency)) {
    for (const c of EUROPEAN_CONSTITUENCIES) {
      const val = rawSig.byConstituency[c.id];
      migratedByConst[c.id] =
        typeof val === 'number' && Number.isFinite(val) ? Math.max(0, Math.round(val)) : 0;
    }
  }
  const migratedTotalSigs =
    typeof rawSig?.collectedSignatures === 'number' && Number.isFinite(rawSig.collectedSignatures)
      ? Math.max(0, Math.min(EU_SIGNATURE_TARGET * 2, Math.round(rawSig.collectedSignatures)))
      : Object.values(migratedByConst).reduce((s, v) => s + v, 0);

  const migratedEuSignatureCampaign: EuSignatureCampaign = {
    active: defaultSig.active,
    targetSignatures: EU_SIGNATURE_TARGET,
    collectedSignatures: defaultSig.exempt ? EU_SIGNATURE_TARGET : migratedTotalSigs,
    byConstituency: defaultSig.exempt ? defaultSig.byConstituency : migratedByConst,
    deadlineWeek: defaultSig.deadlineWeek,
    exempt: defaultSig.exempt,
    exemptReason: defaultSig.exemptReason,
    excludedFromBallot: defaultSig.exempt ? false : Boolean(rawSig?.excludedFromBallot),
    excludedStance:
      rawSig?.excludedStance === 'astensione' || rawSig?.excludedStance === 'sostegno'
        ? rawSig.excludedStance
        : null,
    excludedSupportedPartyId:
      typeof rawSig?.excludedSupportedPartyId === 'string' &&
      validPartyIds.has(rawSig.excludedSupportedPartyId)
        ? rawSig.excludedSupportedPartyId
        : null,
    campaignsThisWeek:
      typeof rawSig?.campaignsThisWeek === 'number' && Number.isFinite(rawSig.campaignsThisWeek)
        ? Math.max(0, Math.min(5, Math.round(rawSig.campaignsThisWeek)))
        : 0,
  };

  const defaultCamp = createDefaultEuCampaignState();
  const rawCamp =
    rawEu && isPlainRecord(rawEu.campaign) ? (rawEu.campaign as Partial<EuCampaignState>) : null;
  const migratedHeadCandidates = { ...defaultCamp.headCandidates };
  if (rawCamp && isPlainRecord(rawCamp.headCandidates)) {
    for (const c of EUROPEAN_CONSTITUENCIES) {
      const arch = rawCamp.headCandidates[c.id];
      if (typeof arch === 'string' && validArchetypes.has(arch as EuHeadCandidateArchetypeId)) {
        migratedHeadCandidates[c.id] = arch as EuHeadCandidateArchetypeId;
      }
    }
  }
  const migratedConstituencyBoosts = createZeroConstituencyRecord();
  if (rawCamp && isPlainRecord(rawCamp.constituencyBoosts)) {
    for (const c of EUROPEAN_CONSTITUENCIES) {
      const v = rawCamp.constituencyBoosts[c.id];
      migratedConstituencyBoosts[c.id] =
        typeof v === 'number' && Number.isFinite(v) ? Math.max(-5, Math.min(8, v)) : 0;
    }
  }
  const rawLeaderMode = rawCamp?.leaderCandidacyMode;
  const safeLeaderCandidacyMode: EuLeaderCandidacyMode =
    rawLeaderMode === 'single' || rawLeaderMode === 'all_five' ? rawLeaderMode : 'none';
  const safeLeaderConstituency: EuropeanConstituencyId | null =
    typeof rawCamp?.leaderCandidacyConstituency === 'string' &&
    validConstituencyIds.has(rawCamp.leaderCandidacyConstituency as EuropeanConstituencyId)
      ? (rawCamp.leaderCandidacyConstituency as EuropeanConstituencyId)
      : safeLeaderCandidacyMode === 'single'
        ? 'nord_ovest'
        : null;

  const migratedEuCampaign: EuCampaignState = {
    headCandidates: migratedHeadCandidates,
    leaderCandidacyMode: safeLeaderCandidacyMode,
    leaderCandidacyConstituency: safeLeaderConstituency,
    constituencyBoosts: migratedConstituencyBoosts,
    topicCampaignsRun: Array.isArray(rawCamp?.topicCampaignsRun)
      ? rawCamp.topicCampaignsRun.filter(
          (id): id is EuCampaignTopicId =>
            typeof id === 'string' && validTopics.has(id as EuCampaignTopicId)
        )
      : [],
    abroadStudentsEventDone: Boolean(rawCamp?.abroadStudentsEventDone),
    actionsThisWeek:
      typeof rawCamp?.actionsThisWeek === 'number' && Number.isFinite(rawCamp.actionsThisWeek)
        ? Math.max(0, Math.min(10, Math.round(rawCamp.actionsThisWeek)))
        : 0,
  };

  const rawComm =
    rawEu && isPlainRecord(rawEu.commission)
      ? (rawEu.commission as Partial<EuCommissionState>)
      : null;
  const parseVoteStance = (v: unknown): EuCommissionVoteStance | null =>
    v === 'favorevole' || v === 'contrario' || v === 'astenuto' ? v : null;
  const parsePortfolioTier = (v: unknown): EuCommissionerPortfolioTier =>
    v === 'peso' || v === 'medio' || v === 'minore' ? v : 'medio';
  const parseCommissionerProfile = (v: unknown): EuCommissionerProfileId | undefined =>
    v === 'tecnico' || v === 'fedelissimo' || v === 'compromesso' ? v : undefined;

  const migratedEuCommission: EuCommissionState = {
    termYear:
      typeof rawComm?.termYear === 'number' && Number.isFinite(rawComm.termYear)
        ? Math.max(2024, Math.min(2100, Math.round(rawComm.termYear)))
        : defaultEuropean.commission.termYear,
    presidentName: sanitizePlainText(
      rawComm?.presidentName,
      64,
      defaultEuropean.commission.presidentName
    ),
    italianCommissionerName: sanitizePlainText(
      rawComm?.italianCommissionerName,
      64,
      defaultEuropean.commission.italianCommissionerName
    ),
    italianCommissionerPartyId:
      typeof rawComm?.italianCommissionerPartyId === 'string' &&
      validPartyIds.has(rawComm.italianCommissionerPartyId)
        ? rawComm.italianCommissionerPartyId
        : defaultEuropean.commission.italianCommissionerPartyId,
    italianCommissionerPortfolio: sanitizePlainText(
      rawComm?.italianCommissionerPortfolio,
      80,
      defaultEuropean.commission.italianCommissionerPortfolio ?? 'Coesione e Riforme'
    ),
    italianCommissionerTier: parsePortfolioTier(
      rawComm?.italianCommissionerTier ?? defaultEuropean.commission.italianCommissionerTier
    ),
    italianCommissionerProfile: parseCommissionerProfile(rawComm?.italianCommissionerProfile),
    playerVote: parseVoteStance(rawComm?.playerVote),
    inEuropeanMajority:
      typeof rawComm?.inEuropeanMajority === 'boolean'
        ? rawComm.inEuropeanMajority
        : parseVoteStance(rawComm?.playerVote) === 'favorevole',
  };

  // Schema v20: Migrazione & sanitizzazione campi Parte 2 (Gruppi UE, Post-Election Flow, Direttive)
  const migratedGroupRelations =
    typeof rawEu?.groupRelations === 'number' && Number.isFinite(rawEu.groupRelations)
      ? Math.max(10, Math.min(100, Math.round(rawEu.groupRelations)))
      : defaultEuropean.groupRelations;

  const validPostSteps = new Set<EuPostElectionStep>([
    'group',
    'commission',
    'commissioner',
    'summary',
  ]);
  const rawPostFlow =
    rawEu && isPlainRecord(rawEu.postElectionFlow)
      ? (rawEu.postElectionFlow as Partial<EuPostElectionFlowState>)
      : null;
  const sanitizeHearingOutcome = (rawOut: unknown): EuCommissionerHearingOutcome | null => {
    if (!isPlainRecord(rawOut)) return null;
    const o = rawOut as Partial<EuCommissionerHearingOutcome>;
    const profileId = parseCommissionerProfile(o.profileId) ?? 'tecnico';
    return {
      profileId,
      candidateName: sanitizePlainText(o.candidateName, 64, 'Commissario Designato'),
      passed: Boolean(o.passed),
      rejectedFirstAttempt: Boolean(o.rejectedFirstAttempt),
      portfolioName: sanitizePlainText(o.portfolioName, 80, 'Coesione e Riforme'),
      portfolioTier: parsePortfolioTier(o.portfolioTier),
      summary: sanitizePlainText(o.summary, 360, ''),
    };
  };
  const migratedPostElectionFlow: EuPostElectionFlowState | null =
    rawPostFlow && Boolean(rawPostFlow.active)
      ? {
          active: true,
          electionYear:
            typeof rawPostFlow.electionYear === 'number' && Number.isFinite(rawPostFlow.electionYear)
              ? Math.max(2024, Math.min(2100, Math.round(rawPostFlow.electionYear)))
              : migratedEuCommission.termYear,
          step:
            typeof rawPostFlow.step === 'string' &&
            validPostSteps.has(rawPostFlow.step as EuPostElectionStep)
              ? (rawPostFlow.step as EuPostElectionStep)
              : 'summary',
          playerEuSeats:
            typeof rawPostFlow.playerEuSeats === 'number' && Number.isFinite(rawPostFlow.playerEuSeats)
              ? Math.max(0, Math.min(76, Math.round(rawPostFlow.playerEuSeats)))
              : playerEuSeatsTotal,
          canNominateCommissioner: Boolean(rawPostFlow.canNominateCommissioner),
          chosenGroupId:
            typeof rawPostFlow.chosenGroupId === 'string' &&
            validEuGroupIds.has(rawPostFlow.chosenGroupId as EuParliamentGroupId)
              ? (rawPostFlow.chosenGroupId as EuParliamentGroupId)
              : null,
          groupReactionSummary:
            typeof rawPostFlow.groupReactionSummary === 'string'
              ? sanitizePlainText(rawPostFlow.groupReactionSummary, 360, '')
              : undefined,
          commissionVote: parseVoteStance(rawPostFlow.commissionVote),
          commissionReactionSummary:
            typeof rawPostFlow.commissionReactionSummary === 'string'
              ? sanitizePlainText(rawPostFlow.commissionReactionSummary, 360, '')
              : undefined,
          commissionerRejectedOnce: Boolean(rawPostFlow.commissionerRejectedOnce),
          commissionerOutcome: sanitizeHearingOutcome(rawPostFlow.commissionerOutcome),
        }
      : null;

  const validDirectiveTopics = new Set<EuDirectiveTopicId>([
    'patto_stabilita',
    'case_green',
    'dazi_agricoltura',
    'difesa_comune',
    'immigrazione',
  ]);
  const sanitizeEuDirective = (rawDir: unknown): ActiveEuDirective | null => {
    if (!isPlainRecord(rawDir)) return null;
    const d = rawDir as Partial<ActiveEuDirective>;
    if (typeof d.id !== 'string' || typeof d.title !== 'string') return null;
    const topic: EuDirectiveTopicId =
      typeof d.topic === 'string' && validDirectiveTopics.has(d.topic as EuDirectiveTopicId)
        ? (d.topic as EuDirectiveTopicId)
        : 'patto_stabilita';
    return {
      id: sanitizePlainText(d.id, 48, 'eu_dir_migrated'),
      templateId: sanitizePlainText(d.templateId, 64, 'dir_generic'),
      topic,
      title: sanitizePlainText(d.title, 120, 'Direttiva Europea'),
      subtitle: sanitizePlainText(d.subtitle, 100, 'Parlamento Europeo'),
      summary: sanitizePlainText(d.summary, 400, ''),
      weekIssued:
        typeof d.weekIssued === 'number' && Number.isFinite(d.weekIssued)
          ? Math.max(1, Math.round(d.weekIssued))
          : safeWeek,
      dateLabel: sanitizePlainText(d.dateLabel, 32, formatGameDate(safeWeek).shortLabel),
      groupLine: parseVoteStance(d.groupLine) ?? 'favorevole',
      resolved: Boolean(d.resolved),
      playerVote: parseVoteStance(d.playerVote) ?? undefined,
      outcomeSummary:
        typeof d.outcomeSummary === 'string'
          ? sanitizePlainText(d.outcomeSummary, 380, '')
          : undefined,
      pollDelta:
        typeof d.pollDelta === 'number' && Number.isFinite(d.pollDelta) ? d.pollDelta : undefined,
      spreadDelta:
        typeof d.spreadDelta === 'number' && Number.isFinite(d.spreadDelta)
          ? Math.round(d.spreadDelta)
          : undefined,
      euRelationsDelta:
        typeof d.euRelationsDelta === 'number' && Number.isFinite(d.euRelationsDelta)
          ? Math.round(d.euRelationsDelta)
          : undefined,
      groupRelationsDelta:
        typeof d.groupRelationsDelta === 'number' && Number.isFinite(d.groupRelationsDelta)
          ? Math.round(d.groupRelationsDelta)
          : undefined,
    };
  };

  const migratedActiveDirective = sanitizeEuDirective(rawEu?.activeDirective);
  const migratedDirectiveHistory: ActiveEuDirective[] = (
    Array.isArray(rawEu?.directiveHistory) ? rawEu.directiveHistory : []
  )
    .map((item) => sanitizeEuDirective(item))
    .filter((item): item is ActiveEuDirective => Boolean(item))
    .slice(0, 12);

  const migratedLastDirectiveWeek =
    typeof rawEu?.lastDirectiveWeek === 'number' && Number.isFinite(rawEu.lastDirectiveWeek)
      ? Math.max(0, Math.round(rawEu.lastDirectiveWeek))
      : 0;

  const migratedEuActiveElection: EuropeanElectionResult | null =
    rawEu && isPlainRecord(rawEu.activeElection)
      ? (rawEu.activeElection as unknown as EuropeanElectionResult)
      : null;

  const migratedEuHistory: EuropeanElectionHistoryEntry[] = Array.isArray(rawEu?.electionHistory)
    ? rawEu.electionHistory.slice(0, 10)
    : [];

  const migratedEuropeanState: EuropeanUnionState = {
    nextElectionWeek: safeEuNextElectionWeek,
    euSeats: migratedEuSeats,
    euSeatsByConstituency: migratedEuSeatsByConstituency,
    partyEuGroups: migratedPartyEuGroups,
    groupRelations: migratedGroupRelations,
    commission: migratedEuCommission,
    postElectionFlow: migratedPostElectionFlow,
    activeDirective: migratedActiveDirective,
    directiveHistory: migratedDirectiveHistory,
    lastDirectiveWeek: migratedLastDirectiveWeek,
    signatureCampaign: migratedEuSignatureCampaign,
    cartel: migratedCartel,
    campaign: migratedEuCampaign,
    activeElection: migratedEuActiveElection,
    electionHistory: migratedEuHistory,
  };

  // Applica whitelist rigorosa dei campi GameState (rimuove proprietà sconosciute e campi PA legacy)
  const cleanRaw = pickWhitelistedGameState(raw as unknown as Record<string, unknown>) as Partial<GameState>;

  const baseState: GameState = {
    ...(cleanRaw as GameState),
    version: Math.max(3, isFiniteNumber(raw.version) ? Math.round(raw.version) : 3),
    schemaVersion: effectiveSchema,
    saveId: sanitizePlainText(raw.saveId, 64, `save_${Date.now().toString(36)}`),
    savedAt: sanitizePlainText(raw.savedAt, 48, new Date().toISOString()),
    week: safeWeek,
    electionWeek: safeElectionWeek,
    europeanElectionWeek: safeEuNextElectionWeek,
    playerPartyId: safePlayerPartyId,
    leader: mergedLeader,
    budget: safeBudget,
    weeklyOverhead: safeWeeklyOverhead,
    parties,
    legislatureSeats: migratedLegislatureSeats,
    executives: migratedExecutives,
    pollHistory: migratedPollHistory,
    currentCrisis: safeCurrentCrisis,
    weeklyCrises: safeWeeklyCrises,
    crisisCooldowns,
    usedCrisisIds: Array.isArray(raw.usedCrisisIds) ? raw.usedCrisisIds : [],
    mediaFeed: migratedMediaFeed,
    actionLog: migratedActionLog,
    actionsTakenThisWeek: Array.isArray(raw.actionsTakenThisWeek)
      ? raw.actionsTakenThisWeek
      : [],
    committee: mergedCommittee,
    coalitionName: sanitizePlainText(raw.coalitionName, 56, 'Coalizione Nazionale'),
    election: raw.election ?? null,
    governmentRole: safeGovernmentRole,
    extraParliamentary: safeExtraParl,
    schismOccurred: Boolean(raw.schismOccurred),
    lowCohesionStreak,
    schismCount,
    totalBillsProposed:
      typeof raw.totalBillsProposed === 'number' ? raw.totalBillsProposed : 0,
    openHeadquarters: syncedOpenHeadquarters,
    regionalChapters: migratedRegionalChapters,
    weekStartPlayerPoll: safeWeekStartPlayerPoll,
    weeklyTerritorialActivity: safeWeeklyTerritorialActivity,
    stateIndicators: mergedStateIndicators,
    electoralLaw,
    enactedLawIds: Array.isArray(raw.enactedLawIds) ? raw.enactedLawIds : [],
    lawVoteHistory: migratedLawVoteHistory,
    institutionalFlags: mergedInstitutionalFlags,
    regimeStatus,
    isPrimeMinister: safeIsPrimeMinister,
    governmentMinistries: sanitizedMinistries,
    governmentMinistryExecutives: sanitizedMinistryExecs,
    allySatisfaction: sanitizedAllySatisfaction,
    lastBudgetWeek,
    pendingBudgetLaw,
    budgetModifiers,
    leaderApproval: mergedLeaderApproval,
    previousLeaderApproval: mergedPreviousLeaderApproval,
    ballotSignatures: migratedBallotSignatures,
    activeReferendum: migratedActiveReferendum,
    referendumHistory: migratedReferendumHistory,
    pendingConstitutionalReferendumLawIds: migratedPendingConstRefs,
    activeDecreeLaws: migratedActiveDecrees,
    pendingBills: migratedPendingBills,
    activeCommissions: migratedActiveCommissions,
    commissionHistory: migratedCommissionHistory,
    chamberTension: safeChamberTension,
    lastQuestionTimeWeek: safeLastQuestionTimeWeek,
    lastMotionWeek: safeLastMotionWeek,
    lastFrancTireursEvent: migratedLastFrancTireursEvent,
    parliamentaryActionHistory: migratedParliamentaryActionHistory,
    currentPresidentName: safePresidentName,
    quirinaleTermEndWeek: safeQuirinaleTermEndWeek,
    quirinaleElection: migratedQuirinaleElection,
    fundraising: migratedFundraising,
    activeScandal: migratedActiveScandal,
    lastScandalWeek: safeLastScandalWeek,
    european: migratedEuropeanState,
  };

  return {
    ...baseState,
    ballotSignatures: syncBallotSignatureExemption(baseState),
  };
}

/** Migra eventuali salvataggi legacy (palazzo_chigi_saves_v1 e slot_1..3) nella sessione isolata ips_session_v1_* */
function importLegacyStorageIfPresent(container: SavesContainer): boolean {
  let migratedAny = false;
  try {
    // 1. Migrazione trasparente da contenitore precedente palazzo_chigi_saves_v1
    const prevGlobalRaw = localStorage.getItem(SAVES_STORAGE_KEY);
    if (prevGlobalRaw) {
      const parsedRes = safeJsonParse<Partial<SavesContainer>>(prevGlobalRaw);
      if (parsedRes.ok && parsedRes.value && typeof parsedRes.value === 'object') {
        const parsed = parsedRes.value;
        if (parsed.activeSlot === 1 || parsed.activeSlot === 2 || parsed.activeSlot === 3) {
          container.activeSlot = parsed.activeSlot;
        }
        if (parsed.slots && typeof parsed.slots === 'object') {
          ([1, 2, 3] as SaveSlotIndex[]).forEach((slot) => {
            if (container.slots[slot]) return;
            const rec =
              (parsed.slots as Record<string, SaveSlotRecord | null>)[String(slot)] ??
              (parsed.slots as Record<number, SaveSlotRecord | null>)[slot] ??
              null;
            if (rec && rec.state && validateGameState(rec.state)) {
              const migrated = migrateSaveState(rec.state, rec.schemaVersion);
              container.slots[slot] = {
                schemaVersion: CURRENT_SCHEMA_VERSION,
                slotIndex: slot,
                updatedAt: rec.updatedAt || migrated.savedAt || new Date().toISOString(),
                state: migrated,
              };
              migratedAny = true;
            }
          });
        }
      }
    }

    // 2. Migrazione da slot legacy individuali
    const legacyActive = localStorage.getItem(LEGACY_ACTIVE_SLOT_KEY);
    if (legacyActive === '1' || legacyActive === '2' || legacyActive === '3') {
      container.activeSlot = Number(legacyActive) as SaveSlotIndex;
    }

    ([1, 2, 3] as SaveSlotIndex[]).forEach((slot) => {
      if (container.slots[slot]) return;
      const raw = localStorage.getItem(`${LEGACY_SLOT_PREFIX}${slot}`);
      if (!raw) return;
      const parsedRes = safeJsonParse<unknown>(raw);
      if (parsedRes.ok && validateGameState(parsedRes.value)) {
        const migrated = migrateSaveState(parsedRes.value);
        container.slots[slot] = {
          schemaVersion: CURRENT_SCHEMA_VERSION,
          slotIndex: slot,
          updatedAt: migrated.savedAt || new Date().toISOString(),
          state: migrated,
        };
        migratedAny = true;
      }
    });
  } catch {
    // localStorage non disponibile
  }
  return migratedAny;
}

function readSavesContainer(): SavesContainer {
  try {
    const sessionKey = getSessionSavesStorageKey();
    const raw = localStorage.getItem(sessionKey);
    if (!raw) {
      const fresh = createEmptyContainer();
      if (importLegacyStorageIfPresent(fresh)) {
        writeSavesContainer(fresh);
      }
      return fresh;
    }

    const parsedRes = safeJsonParse<Partial<SavesContainer>>(raw);
    if (!parsedRes.ok || !parsedRes.value || typeof parsedRes.value !== 'object') {
      return createEmptyContainer();
    }
    const parsed = parsedRes.value;
    const container = createEmptyContainer();

    const storedActive = localStorage.getItem(getSessionActiveSlotStorageKey());
    if (storedActive === '1' || storedActive === '2' || storedActive === '3') {
      container.activeSlot = Number(storedActive) as SaveSlotIndex;
    } else if (parsed.activeSlot === 1 || parsed.activeSlot === 2 || parsed.activeSlot === 3) {
      container.activeSlot = parsed.activeSlot;
    }

    if (parsed.slots && typeof parsed.slots === 'object') {
      ([1, 2, 3] as SaveSlotIndex[]).forEach((slot) => {
        const rec =
          (parsed.slots as Record<string, SaveSlotRecord | null>)[String(slot)] ??
          (parsed.slots as Record<number, SaveSlotRecord | null>)[slot] ??
          null;
        if (rec && rec.state && validateGameState(rec.state)) {
          container.slots[slot] = {
            schemaVersion: rec.schemaVersion ?? CURRENT_SCHEMA_VERSION,
            slotIndex: slot,
            updatedAt: rec.updatedAt ?? rec.state.savedAt ?? new Date().toISOString(),
            state: rec.state,
          };
        }
      });
    }

    return container;
  } catch {
    return createEmptyContainer();
  }
}

function writeSavesContainer(container: SavesContainer): boolean {
  try {
    const sessionKey = getSessionSavesStorageKey();
    const serialized = JSON.stringify({
      ...container,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    });
    localStorage.setItem(sessionKey, serialized);
    localStorage.setItem(getSessionActiveSlotStorageKey(), String(container.activeSlot));
    return true;
  } catch {
    return false;
  }
}

export function getActiveSlotIndex(): SaveSlotIndex {
  return readSavesContainer().activeSlot;
}

export function setActiveSlotIndex(slot: SaveSlotIndex): void {
  const container = readSavesContainer();
  container.activeSlot = slot;
  writeSavesContainer(container);
}

export function saveGameToSlot(slot: SaveSlotIndex, state: GameState): boolean {
  const container = readSavesContainer();
  const now = new Date().toISOString();
  const stampedState: GameState = {
    ...state,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    savedAt: now,
  };
  container.activeSlot = slot;
  container.slots[slot] = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    slotIndex: slot,
    updatedAt: now,
    state: stampedState,
  };
  return writeSavesContainer(container);
}

export function loadGameFromSlot(slot: SaveSlotIndex): GameState | null {
  const container = readSavesContainer();
  const record = container.slots[slot];
  if (!record || !validateGameState(record.state)) return null;

  const migrated = migrateSaveState(record.state, record.schemaVersion);
  container.activeSlot = slot;
  if ((record.schemaVersion ?? 0) < CURRENT_SCHEMA_VERSION) {
    container.slots[slot] = {
      ...record,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      state: migrated,
    };
  }
  writeSavesContainer(container);
  return migrated;
}

export function deleteSaveSlot(slot: SaveSlotIndex): void {
  const container = readSavesContainer();
  container.slots[slot] = null;
  writeSavesContainer(container);
  // Rimuove anche eventuale chiave legacy per evitare re-import involontario
  try {
    localStorage.removeItem(`${LEGACY_SLOT_PREFIX}${slot}`);
  } catch {
    // ignore
  }
}

/**
 * Elimina in modo definitivo tutti i dati locali memorizzati da Italian Politics Simulator
 * (tutti gli slot di salvataggio, sessioni namespaced, chiavi legacy, preferenze audio e banner).
 */
export function clearAllLocalAppData(): number {
  let removedCount = 0;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (
        key.startsWith(SESSION_STORAGE_PREFIX) ||
        key.startsWith('palazzo_chigi_') ||
        key === SAVES_STORAGE_KEY ||
        key === LEGACY_ACTIVE_SLOT_KEY ||
        key.startsWith(LEGACY_SLOT_PREFIX)
      ) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
      removedCount += 1;
    }
  } catch {
    // localStorage non disponibile
  }
  return removedCount;
}

export function listSaveSlots(): SaveSlotSummary[] {
  const container = readSavesContainer();
  const indices: SaveSlotIndex[] = [1, 2, 3];

  return indices.map((slotIndex) => {
    const rec = container.slots[slotIndex];
    if (!rec || !validateGameState(rec.state)) {
      return { slotIndex, empty: true };
    }
    const state = rec.state;
    const player = state.parties.find((p) => p.id === state.playerPartyId);
    return {
      slotIndex,
      empty: false,
      savedAt: rec.updatedAt || state.savedAt,
      partyName: player?.name ?? 'Partito',
      partyAcronym: player?.acronym ?? 'PT',
      partyColor: player?.color ?? '#06B6D4',
      partyEmblem: player?.emblem ?? 'stella',
      customEmblemUrl: player?.customEmblemUrl,
      leaderName: state.leader?.name ?? player?.leaderName ?? 'Leader',
      budget: state.budget,
      nationalPoll: player?.nationalPoll ?? 0,
      week: state.week,
      dateLabel: formatGameDate(state.week).shortLabel,
      mode: state.mode,
      schemaVersion: rec.schemaVersion ?? state.schemaVersion ?? CURRENT_SCHEMA_VERSION,
    };
  });
}

export function exportGameToJson(state: GameState): void {
  const player = state.parties.find((p) => p.id === state.playerPartyId);
  const slug = (player?.acronym ?? 'partito').toLowerCase().replace(/[^a-z0-9]/g, '');
  const filename = `ips-${slug}-sett${state.week}.json`;
  const payload = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    state: migrateSaveState(state),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportSlotToJson(slot: SaveSlotIndex): boolean {
  const container = readSavesContainer();
  const record = container.slots[slot];
  if (!record || !validateGameState(record.state)) return false;
  exportGameToJson(migrateSaveState(record.state, record.schemaVersion));
  return true;
}

export function parseImportedGameJson(text: string): { state?: GameState; error?: string } {
  const parsedRes = safeJsonParse<
    Record<string, unknown>
  >(text, MAX_SAVE_FILE_BYTES);

  if (!parsedRes.ok) {
    return { error: parsedRes.error };
  }

  const parsed = parsedRes.value;
  if (!isPlainRecord(parsed)) {
    return {
      error:
        'Il file JSON non corrisponde a un salvataggio valido di Italian Politics Simulator.',
    };
  }

  // Supporta sia il wrapper { schemaVersion, state } sia il formato diretto legacy GameState
  const hasStateWrapper = Object.prototype.hasOwnProperty.call(parsed, 'state');
  const rawCandidate = hasStateWrapper ? parsed.state : parsed;
  if (!isPlainRecord(rawCandidate)) {
    return {
      error:
        'Struttura interna del salvataggio non valida o corrotta.',
    };
  }

  const savedSchema =
    Object.prototype.hasOwnProperty.call(parsed, 'schemaVersion') &&
    isFiniteNumber(parsed.schemaVersion)
      ? parsed.schemaVersion
      : undefined;

  // 1. Whitelist esplicita dei campi principali di GameState (scarta chiavi arbitrarie)
  const whitelistedCandidate = pickWhitelistedGameState(rawCandidate);

  // 2. Controllo ricorsivo anti-URL malevoli (javascript:, data:text/html, vbscript:) e blocco NaN/Infinity
  const safetyCheck = inspectImportedSafety(whitelistedCandidate);
  if (!safetyCheck.ok) {
    return { error: safetyCheck.error };
  }

  // 3. Validazione rigorosa di tipi, array, numeri finiti e struttura attesa
  if (!validateGameState(whitelistedCandidate, { strictImport: true })) {
    return {
      error:
        'Il file JSON non corrisponde a un salvataggio valido o contiene campi corrotti/incompatibili.',
    };
  }

  // 4. Migrazione e sanitizzazione completa obbligatoria prima di restituire lo stato
  try {
    const migrated = migrateSaveState(whitelistedCandidate as unknown as GameState, savedSchema);
    if (!validateGameState(migrated, { strictImport: true })) {
      return {
        error: 'Il salvataggio importato non ha superato la verifica finale di integrità.',
      };
    }
    return { state: migrated };
  } catch {
    return {
      error: 'Impossibile importare il salvataggio: struttura interna incompatibile o danneggiata.',
    };
  }
}

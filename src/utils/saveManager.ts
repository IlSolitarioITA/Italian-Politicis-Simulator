import {
  ActiveCrisis,
  ActiveDecreeLaw,
  ActiveReferendum,
  BallotElectionType,
  BallotSignatureCampaign,
  BudgetModifiers,
  ChapterLevel,
  CommitteeState,
  ElectoralLawId,
  ExecutiveMember,
  ExecutiveScandal,
  ExecutiveSpecialization,
  FundraisingState,
  GameState,
  InquiryCommission,
  InstitutionalFlags,
  LeaderProfile,
  MinistryId,
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
  buildDefaultLeaderApproval,
  EXISTING_PARTIES_2026,
  formatGameDate,
  inferExecutiveSpecialization,
} from '../data/presets';
import {
  ALL_EXECUTIVE_SPECIALIZATIONS,
  buildAutoMinistryExecutives,
} from '../data/ministries';
import { REGION_MAP_BY_ID } from '../data/italyRegions';
import { CRISIS_POOL } from '../data/crises';
import {
  buildInitialLegislatureSeats,
  buildRegionPollsFromMacro,
  createInitialBallotSignatures,
  createInitialFundraisingState,
  getBallotTargetForType,
  normalizeAllPolls,
  syncBallotSignatureExemption,
} from '../engine/simulation';
import {
  generateSessionUuid,
  safeJsonParse,
  sanitizeAcronym,
  sanitizeCustomEmblemUrl,
  sanitizeHexColor,
  sanitizePlainText,
} from './sanitizer';

/** Prefisso namespaced per isolamento completo della sessione sul browser/dispositivo */
export const SESSION_STORAGE_PREFIX = 'ips_session_v1_';
const SESSION_ID_KEY = `${SESSION_STORAGE_PREFIX}id`;

/** Chiave legacy v1 mantenuta solo per migrazione trasparente one-time */
export const SAVES_STORAGE_KEY = 'palazzo_chigi_saves_v1';

/** Versione schema salvataggi corrente per migrazione sicura */
export const CURRENT_SCHEMA_VERSION = 16;

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

export function validateGameState(data: unknown): data is GameState {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const candidate = data as Partial<GameState>;
  const hasValidParties =
    Array.isArray(candidate.parties) &&
    candidate.parties.length >= 2 &&
    candidate.parties.length <= 60 &&
    candidate.parties.every(
      (p) =>
        Boolean(p) &&
        typeof p === 'object' &&
        typeof p.id === 'string' &&
        p.id.length > 0 &&
        p.id.length <= 64 &&
        typeof p.name === 'string' &&
        typeof p.nationalPoll === 'number' &&
        Number.isFinite(p.nationalPoll)
    );

  return (
    typeof candidate.week === 'number' &&
    Number.isFinite(candidate.week) &&
    candidate.week >= 1 &&
    candidate.week <= 5000 &&
    typeof candidate.playerPartyId === 'string' &&
    candidate.playerPartyId.length > 0 &&
    candidate.playerPartyId.length <= 64 &&
    hasValidParties &&
    Array.isArray(candidate.executives) &&
    candidate.executives.length <= 30 &&
    Array.isArray(candidate.pollHistory) &&
    typeof candidate.budget === 'number' &&
    Number.isFinite(candidate.budget) &&
    Boolean(candidate.leader && typeof candidate.leader === 'object')
  );
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

  const mergedStateIndicators: StateIndicators = {
    ...DEFAULT_STATE_INDICATORS,
    ...(raw.stateIndicators ?? {}),
  };

  const mergedInstitutionalFlags: InstitutionalFlags = {
    ...DEFAULT_INSTITUTIONAL_FLAGS,
    ...(raw.institutionalFlags ?? {}),
  };

  const mergedCommittee: CommitteeState = {
    ...DEFAULT_COMMITTEE,
    ...(raw.committee ?? {}),
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
  const migratedExecutives: ExecutiveMember[] = (raw.executives ?? []).map((ex) => {
    const rawSpec = (ex as Partial<ExecutiveMember>).specialization;
    const specialization: ExecutiveSpecialization =
      rawSpec && validSpecs.has(rawSpec)
        ? rawSpec
        : inferExecutiveSpecialization(ex.role, ex.faction);
    return {
      ...ex,
      specialization,
      lowLoyaltyWeeks:
        typeof ex.lowLoyaltyWeeks === 'number' && Number.isFinite(ex.lowLoyaltyWeeks)
          ? Math.max(0, Math.round(ex.lowLoyaltyWeeks))
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

  // Schema v16 — Regola ferrea sui seggi parlamentari:
  // Usa legislatureSeats salvati se validi, altrimenti seggi dell'ultima elezione o XIX Legislatura reale.
  const priorSchemaVersion = Math.max(savedSchemaVersion ?? 0, raw.schemaVersion ?? 0);
  const rawSeatSource =
    Array.isArray(raw.legislatureSeats) && raw.legislatureSeats.length > 0
      ? raw.legislatureSeats
      : Array.isArray(raw.election?.seats) && raw.election.seats.length > 0
        ? raw.election.seats
        : null;

  let migratedLegislatureSeats: SeatAllocation[];
  if (rawSeatSource) {
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
    .slice(0, 40)
    .map((item) => ({
      ...item,
      source: sanitizePlainText(item?.source, 64, 'Stampa Nazionale'),
      headline: sanitizePlainText(item?.headline, 180, 'Notizia politica'),
      excerpt: sanitizePlainText(item?.excerpt, 360, ''),
      partyColor: item?.partyColor ? sanitizeHexColor(item.partyColor, '#06B6D4') : undefined,
    }));

  const migratedActionLog = (Array.isArray(raw.actionLog) ? raw.actionLog : [])
    .slice(0, 30)
    .map((item) => ({
      ...item,
      category: sanitizePlainText(item?.category, 48, 'Azione'),
      title: sanitizePlainText(item?.title, 100, 'Iniziativa'),
      summary: sanitizePlainText(item?.summary, 280, ''),
    }));

  const migratedActiveDecrees: ActiveDecreeLaw[] = (
    Array.isArray(raw.activeDecreeLaws) ? raw.activeDecreeLaws : []
  )
    .filter((d) => Boolean(d && typeof d.id === 'string' && typeof d.lawId === 'string'))
    .slice(0, 12)
    .map((d) => ({
      ...d,
      title: sanitizePlainText(d.title, 120, 'Decreto-Legge'),
      weeksRemaining:
        typeof d.weeksRemaining === 'number' && Number.isFinite(d.weeksRemaining)
          ? Math.max(0, Math.round(d.weeksRemaining))
          : 0,
      status:
        d.status === 'convertito' || d.status === 'decaduto'
          ? d.status
          : 'in_conversione',
      confidenceUsed: Boolean(d.confidenceUsed),
    }));

  const migratedPendingBills: PendingBill[] = (
    Array.isArray(raw.pendingBills) ? raw.pendingBills : []
  )
    .filter((b) => Boolean(b && typeof b.id === 'string' && typeof b.lawId === 'string'))
    .slice(0, 12)
    .map((b) => {
      const safeStage: PendingBill['stage'] =
        b.stage === 'camera' || b.stage === 'senato' ? b.stage : 'commissione';
      const totalWeeks =
        typeof b.totalWeeks === 'number' && Number.isFinite(b.totalWeeks)
          ? Math.max(1, Math.min(12, Math.round(b.totalWeeks)))
          : 3;
      const weeksRemaining =
        typeof b.weeksRemaining === 'number' && Number.isFinite(b.weeksRemaining)
          ? Math.max(0, Math.min(totalWeeks + 4, Math.round(b.weeksRemaining)))
          : 1;
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

  // Ricalibra le spese fisse settimanali sui salvataggi precedenti allo schema v16 per evitare blocchi di cassa
  const matchingPreset = EXISTING_PARTIES_2026.find((p) => p.id === safePlayerPartyId);
  const rawOverhead =
    typeof raw.weeklyOverhead === 'number' && Number.isFinite(raw.weeklyOverhead)
      ? Math.max(800, Math.round(raw.weeklyOverhead))
      : matchingPreset?.weeklyOverhead ?? (mergedCommittee.active ? 1200 : 2400);
  let safeWeeklyOverhead = rawOverhead;
  if (priorSchemaVersion < 16) {
    if (matchingPreset) {
      safeWeeklyOverhead = Math.min(rawOverhead, matchingPreset.weeklyOverhead);
    } else if (mergedCommittee.active) {
      safeWeeklyOverhead = Math.min(rawOverhead, 1200);
    } else if (rawOverhead >= 4500) {
      safeWeeklyOverhead = 2400;
    }
  }

  // Rimozione pulita dei campi PA obsoleti (politicalCapital / maxPoliticalCapital) dai salvataggi legacy
  const {
    politicalCapital: _legacyPoliticalCapital,
    maxPoliticalCapital: _legacyMaxPoliticalCapital,
    ...cleanRaw
  } = raw as GameState & {
    schemaVersion?: number;
    politicalCapital?: number;
    maxPoliticalCapital?: number;
  };
  void _legacyPoliticalCapital;
  void _legacyMaxPoliticalCapital;

  const baseState: GameState = {
    ...cleanRaw,
    version: Math.max(3, raw.version ?? 3),
    schemaVersion: effectiveSchema,
    week: safeWeek,
    electionWeek: safeElectionWeek,
    playerPartyId: safePlayerPartyId,
    leader: mergedLeader,
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
    currentPresidentName: safePresidentName,
    quirinaleTermEndWeek: safeQuirinaleTermEndWeek,
    quirinaleElection: migratedQuirinaleElection,
    fundraising: migratedFundraising,
    activeScandal: migratedActiveScandal,
    lastScandalWeek: safeLastScandalWeek,
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
    GameState | { schemaVersion?: number; state?: GameState }
  >(text);

  if (!parsedRes.ok) {
    return { error: parsedRes.error };
  }

  const parsed = parsedRes.value;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      error:
        'Il file JSON non corrisponde a un salvataggio valido di Italian Politics Simulator.',
    };
  }

  // Supporta sia il wrapper { schemaVersion, state } sia il formato diretto legacy GameState
  const candidateState =
    'state' in parsed && parsed.state && typeof parsed.state === 'object'
      ? parsed.state
      : parsed;
  const savedSchema =
    'schemaVersion' in parsed && typeof (parsed as { schemaVersion?: unknown }).schemaVersion === 'number'
      ? (parsed as { schemaVersion: number }).schemaVersion
      : undefined;

  if (!validateGameState(candidateState)) {
    return {
      error:
        'Il file JSON non corrisponde a un salvataggio valido o contiene dati corrotti.',
    };
  }

  try {
    return { state: migrateSaveState(candidateState, savedSchema) };
  } catch {
    return {
      error: 'Impossibile migrare il salvataggio: struttura interna incompatibile o danneggiata.',
    };
  }
}

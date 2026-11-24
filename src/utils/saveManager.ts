import {
  ActiveCrisis,
  ActiveReferendum,
  BallotElectionType,
  BallotSignatureCampaign,
  BudgetModifiers,
  CommitteeState,
  ElectoralLawId,
  ExecutiveMember,
  ExecutiveSpecialization,
  GameState,
  InstitutionalFlags,
  LeaderProfile,
  MinistryId,
  PartyState,
  ReferendumStance,
  RegimeStatus,
  RegionId,
  SaveSlotSummary,
  StateIndicators,
} from '../types/game';
import {
  buildDefaultLeaderApproval,
  formatGameDate,
  inferExecutiveSpecialization,
} from '../data/presets';
import {
  ALL_EXECUTIVE_SPECIALIZATIONS,
  buildAutoMinistryExecutives,
} from '../data/ministries';
import { CRISIS_POOL } from '../data/crises';
import {
  buildRegionPollsFromMacro,
  createInitialBallotSignatures,
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
export const CURRENT_SCHEMA_VERSION = 12;

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

  const seenPartyIds = new Set<string>();
  const rawDeduplicatedParties = raw.parties.filter((p) => {
    if (!p || typeof p.id !== 'string' || seenPartyIds.has(p.id)) return false;
    seenPartyIds.add(p.id);
    return true;
  });

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
            economic: legacyAxis.economic ?? 0,
            society: legacyAxis.society,
            europe: legacyAxis.europe,
            institutions: legacyAxis.institutions,
          }
        : {
            economic: legacyAxis.economic ?? 0,
            society: Math.round(-(legacyAxis.economic ?? 0) * 0.4),
            europe: legacyAxis.institutional ?? 20,
            institutions: -55,
          };

    const safeRegions = {
      nord_ovest: p.regions?.nord_ovest ?? p.nationalPoll ?? 5,
      nord_est: p.regions?.nord_est ?? p.nationalPoll ?? 5,
      centro: p.regions?.centro ?? p.nationalPoll ?? 5,
      sud: p.regions?.sud ?? p.nationalPoll ?? 5,
      isole: p.regions?.isole ?? p.nationalPoll ?? 5,
    };

    return {
      ...p,
      name: sanitizePlainText(p.name, 48, 'Partito'),
      acronym: sanitizeAcronym(p.acronym, 'PT'),
      color: sanitizeHexColor(p.color, '#06B6D4'),
      customEmblemUrl: sanitizeCustomEmblemUrl(p.customEmblemUrl),
      leaderName: sanitizePlainText(p.leaderName, 44, 'Leader'),
      description: sanitizePlainText(p.description, 220, ''),
      axis: migratedAxis,
      regions: safeRegions,
      regionPolls:
        p.regionPolls && Object.keys(p.regionPolls).length >= 20
          ? { ...p.regionPolls }
          : {
              ...buildRegionPollsFromMacro(safeRegions),
              ...(p.regionPolls ?? {}),
            },
      demographics: {
        giovani: p.demographics?.giovani ?? p.nationalPoll ?? 5,
        lavoratori: p.demographics?.lavoratori ?? p.nationalPoll ?? 5,
        imprese: p.demographics?.imprese ?? p.nationalPoll ?? 5,
        pensionati: p.demographics?.pensionati ?? p.nationalPoll ?? 5,
      },
      previousPoll: typeof p.previousPoll === 'number' ? p.previousPoll : p.nationalPoll,
      relationWithPlayer:
        typeof p.relationWithPlayer === 'number' ? p.relationWithPlayer : 0,
      coalitionStatus: p.coalitionStatus ?? 'avversario',
    };
  });

  // Garanzia retrocompatibile: se la somma nazionale del salvataggio è fuori tolleranza, rinormalizza al 100,0%
  const savedPollSum = parties.reduce((acc, p) => acc + (Number.isFinite(p.nationalPoll) ? p.nationalPoll : 0), 0);
  if (Math.abs(savedPollSum - 100) > 0.6) {
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
        ? Math.max(25, Math.min(88, Math.round(raw.leader.age)))
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

  const safeExtraParl =
    typeof raw.extraParliamentary === 'boolean'
      ? raw.extraParliamentary
      : raw.mode === 'new_party' &&
        (parties.find((p) => p.id === safePlayerPartyId)?.nationalPoll ?? 0) < 3.0;

  const defaultBallot = createInitialBallotSignatures({
    parties,
    playerPartyId: safePlayerPartyId,
    electoralLaw,
    extraParliamentary: safeExtraParl,
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

  const baseState: GameState = {
    ...raw,
    version: Math.max(3, raw.version ?? 3),
    schemaVersion: effectiveSchema,
    week: safeWeek,
    electionWeek: safeElectionWeek,
    playerPartyId: safePlayerPartyId,
    leader: mergedLeader,
    weeklyOverhead: typeof raw.weeklyOverhead === 'number' ? raw.weeklyOverhead : 40000,
    politicalCapital: typeof raw.politicalCapital === 'number' ? raw.politicalCapital : 3,
    maxPoliticalCapital:
      typeof raw.maxPoliticalCapital === 'number' ? raw.maxPoliticalCapital : 3,
    parties,
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
    governmentRole: raw.governmentRole ?? 'opposizione',
    extraParliamentary: safeExtraParl,
    schismOccurred: Boolean(raw.schismOccurred),
    lowCohesionStreak,
    schismCount,
    totalBillsProposed:
      typeof raw.totalBillsProposed === 'number' ? raw.totalBillsProposed : 0,
    openHeadquarters: Array.isArray(raw.openHeadquarters) ? raw.openHeadquarters : [],
    stateIndicators: mergedStateIndicators,
    electoralLaw,
    enactedLawIds: Array.isArray(raw.enactedLawIds) ? raw.enactedLawIds : [],
    lawVoteHistory: migratedLawVoteHistory,
    institutionalFlags: mergedInstitutionalFlags,
    regimeStatus,
    isPrimeMinister,
    governmentMinistries: mergedMinistries,
    governmentMinistryExecutives: mergedMinistryExecs,
    allySatisfaction: mergedAllySatisfaction,
    lastBudgetWeek,
    pendingBudgetLaw,
    budgetModifiers,
    leaderApproval: mergedLeaderApproval,
    previousLeaderApproval: mergedPreviousLeaderApproval,
    ballotSignatures: migratedBallotSignatures,
    activeReferendum: migratedActiveReferendum,
    referendumHistory: migratedReferendumHistory,
    pendingConstitutionalReferendumLawIds: migratedPendingConstRefs,
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

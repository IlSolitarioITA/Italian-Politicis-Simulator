import {
  BudgetModifiers,
  CommitteeState,
  ElectoralLawId,
  GameState,
  InstitutionalFlags,
  LeaderProfile,
  MinistryId,
  PartyState,
  RegimeStatus,
  SaveSlotSummary,
  StateIndicators,
} from '../types/game';
import { buildDefaultLeaderApproval, formatGameDate } from '../data/presets';
import { buildRegionPollsFromMacro } from '../engine/simulation';

/** Chiave fissa localStorage — mai resettata dagli aggiornamenti app/APK */
export const SAVES_STORAGE_KEY = 'palazzo_chigi_saves_v1';

/** Versione schema salvataggi corrente per migrazione sicura */
export const CURRENT_SCHEMA_VERSION = 7;

const LEGACY_SLOT_PREFIX = 'palazzo_chigi_war_room_slot_';
const LEGACY_ACTIVE_SLOT_KEY = 'palazzo_chigi_war_room_active_slot';

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
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Partial<GameState>;
  return (
    typeof candidate.week === 'number' &&
    typeof candidate.playerPartyId === 'string' &&
    Array.isArray(candidate.parties) &&
    candidate.parties.length >= 2 &&
    Array.isArray(candidate.executives) &&
    Array.isArray(candidate.pollHistory) &&
    typeof candidate.budget === 'number' &&
    Boolean(candidate.leader)
  );
}

/**
 * Migrazione sicura anti-perdita dati con deep-merge rispetto ai default della versione corrente.
 * Garantisce compatibilità completa quando l'app o l'APK viene aggiornata con nuove funzionalità.
 */
export function migrateSaveState(rawInput: GameState, savedSchemaVersion?: number): GameState {
  const raw = rawInput as GameState & { schemaVersion?: number };
  const safeWeek = typeof raw.week === 'number' && raw.week >= 1 ? raw.week : 1;

  const parties: PartyState[] = raw.parties.map((p) => {
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

  const crisisCooldowns: Record<string, number> =
    raw.crisisCooldowns && typeof raw.crisisCooldowns === 'object'
      ? { ...raw.crisisCooldowns }
      : {};
  if (raw.currentCrisis?.event?.id && crisisCooldowns[raw.currentCrisis.event.id] === undefined) {
    crisisCooldowns[raw.currentCrisis.event.id] = safeWeek;
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
    name: raw.leader?.name ?? 'Leader',
    age: typeof raw.leader?.age === 'number' ? raw.leader.age : 45,
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

  const validMinistryIds: MinistryId[] = [
    'mef',
    'interno',
    'giustizia',
    'esteri',
    'infrastrutture',
    'salute',
  ];
  const mergedMinistries: Partial<Record<MinistryId, string>> = {};
  if (raw.governmentMinistries && typeof raw.governmentMinistries === 'object') {
    for (const mId of validMinistryIds) {
      const holder = raw.governmentMinistries[mId];
      if (typeof holder === 'string' && holder.length > 0) {
        mergedMinistries[mId] = holder;
      }
    }
  }

  const mergedAllySatisfaction: Record<string, number> = {};
  if (raw.allySatisfaction && typeof raw.allySatisfaction === 'object') {
    for (const [partyId, val] of Object.entries(raw.allySatisfaction)) {
      if (typeof val === 'number' && Number.isFinite(val)) {
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
    raw.playerPartyId,
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

  return {
    ...raw,
    version: Math.max(3, raw.version ?? 3),
    schemaVersion: effectiveSchema,
    week: safeWeek,
    electionWeek: typeof raw.electionWeek === 'number' ? raw.electionWeek : safeWeek + 20,
    leader: mergedLeader,
    weeklyOverhead: typeof raw.weeklyOverhead === 'number' ? raw.weeklyOverhead : 40000,
    politicalCapital: typeof raw.politicalCapital === 'number' ? raw.politicalCapital : 3,
    maxPoliticalCapital:
      typeof raw.maxPoliticalCapital === 'number' ? raw.maxPoliticalCapital : 3,
    parties,
    crisisCooldowns,
    usedCrisisIds: Array.isArray(raw.usedCrisisIds) ? raw.usedCrisisIds : [],
    mediaFeed: Array.isArray(raw.mediaFeed) ? raw.mediaFeed : [],
    actionLog: Array.isArray(raw.actionLog) ? raw.actionLog : [],
    actionsTakenThisWeek: Array.isArray(raw.actionsTakenThisWeek)
      ? raw.actionsTakenThisWeek
      : [],
    committee: mergedCommittee,
    coalitionName: raw.coalitionName ?? 'Coalizione Nazionale',
    election: raw.election ?? null,
    governmentRole: raw.governmentRole ?? 'opposizione',
    extraParliamentary:
      typeof raw.extraParliamentary === 'boolean'
        ? raw.extraParliamentary
        : raw.mode === 'new_party' &&
          (parties.find((p) => p.id === raw.playerPartyId)?.nationalPoll ?? 0) < 3.0,
    schismOccurred: Boolean(raw.schismOccurred),
    totalBillsProposed:
      typeof raw.totalBillsProposed === 'number' ? raw.totalBillsProposed : 0,
    openHeadquarters: Array.isArray(raw.openHeadquarters) ? raw.openHeadquarters : [],
    stateIndicators: mergedStateIndicators,
    electoralLaw,
    enactedLawIds: Array.isArray(raw.enactedLawIds) ? raw.enactedLawIds : [],
    lawVoteHistory: Array.isArray(raw.lawVoteHistory) ? raw.lawVoteHistory : [],
    institutionalFlags: mergedInstitutionalFlags,
    regimeStatus,
    isPrimeMinister,
    governmentMinistries: mergedMinistries,
    allySatisfaction: mergedAllySatisfaction,
    lastBudgetWeek,
    pendingBudgetLaw,
    budgetModifiers,
    leaderApproval: mergedLeaderApproval,
    previousLeaderApproval: mergedPreviousLeaderApproval,
  };
}

/** Migra eventuali salvataggi legacy (palazzo_chigi_war_room_slot_1..3) nel nuovo contenitore unificato */
function importLegacyStorageIfPresent(container: SavesContainer): boolean {
  let migratedAny = false;
  try {
    const legacyActive = localStorage.getItem(LEGACY_ACTIVE_SLOT_KEY);
    if (legacyActive === '1' || legacyActive === '2' || legacyActive === '3') {
      container.activeSlot = Number(legacyActive) as SaveSlotIndex;
    }

    ([1, 2, 3] as SaveSlotIndex[]).forEach((slot) => {
      if (container.slots[slot]) return;
      const raw = localStorage.getItem(`${LEGACY_SLOT_PREFIX}${slot}`);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (validateGameState(parsed)) {
          const migrated = migrateSaveState(parsed);
          container.slots[slot] = {
            schemaVersion: CURRENT_SCHEMA_VERSION,
            slotIndex: slot,
            updatedAt: migrated.savedAt || new Date().toISOString(),
            state: migrated,
          };
          migratedAny = true;
        }
      } catch {
        // Ignora eventuali record corrotti senza toccare gli altri slot
      }
    });
  } catch {
    // localStorage non disponibile
  }
  return migratedAny;
}

function readSavesContainer(): SavesContainer {
  try {
    const raw = localStorage.getItem(SAVES_STORAGE_KEY);
    if (!raw) {
      const fresh = createEmptyContainer();
      if (importLegacyStorageIfPresent(fresh)) {
        writeSavesContainer(fresh);
      }
      return fresh;
    }

    const parsed = JSON.parse(raw) as Partial<SavesContainer>;
    const container = createEmptyContainer();

    if (parsed.activeSlot === 1 || parsed.activeSlot === 2 || parsed.activeSlot === 3) {
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
    const serialized = JSON.stringify({
      ...container,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    });
    localStorage.setItem(SAVES_STORAGE_KEY, serialized);
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
  try {
    const parsed = JSON.parse(text) as
      | GameState
      | { schemaVersion?: number; state?: GameState };

    // Supporta sia il nuovo wrapper { schemaVersion, state } sia il formato diretto legacy GameState
    const candidateState =
      parsed && typeof parsed === 'object' && 'state' in parsed && parsed.state
        ? parsed.state
        : parsed;
    const savedSchema =
      parsed && typeof parsed === 'object' && 'schemaVersion' in parsed
        ? (parsed as { schemaVersion?: number }).schemaVersion
        : undefined;

    if (!validateGameState(candidateState)) {
      return {
        error:
          'Il file JSON non corrisponde a un salvataggio valido di Italian Politics Simulator.',
      };
    }

    return { state: migrateSaveState(candidateState, savedSchema) };
  } catch {
    return { error: 'Impossibile leggere il file JSON: formato corrotto o non valido.' };
  }
}

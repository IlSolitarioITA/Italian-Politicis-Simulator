import {
  ActiveCrisis,
  AllySatisfactionReport,
  BudgetAllocation,
  BudgetModifiers,
  CoalitionStatus,
  CrisisOption,
  DemographicId,
  ElectionResult,
  ElectoralLawId,
  ExecutiveMember,
  GameMode,
  GameState,
  InstitutionalFlags,
  LawDefinition,
  LawVoteRecord,
  LeaderProfile,
  MacroRegionId,
  MediaItem,
  MinistryId,
  NewPartyDraft,
  PartyState,
  PoliticalAxis,
  PollSnapshot,
  RegimeStatus,
  RegionId,
  SeatAllocation,
  StateIndicators,
  TvDuelResultPayload,
} from '../types/game';
import {
  DEMOGRAPHICS,
  EXISTING_PARTIES_2026,
  HISTORICAL_POLL_LABELS,
  MACRO_REGIONS,
  MINOR_PARTIES_BASELINE,
  ORIENTATIONS,
  REPLACEMENT_CANDIDATES,
  buildDefaultLeaderApproval,
  createInitialExecutives,
  formatGameDate,
} from '../data/presets';
import { ITALIAN_REGIONS, REGION_MAP_BY_ID } from '../data/italyRegions';
import { CRISIS_POOL } from '../data/crises';
import { PARLIAMENT_LAWS } from '../data/laws';
import {
  KEY_MINISTRIES,
  ORIENTATION_PREFERRED_MINISTRIES,
  TOTAL_MINISTRY_WEIGHT,
  getMinistryById,
} from '../data/ministries';

const NEWSPAPERS = [
  'Il Corriere Nazionale',
  'La Tribuna Politica',
  'Il Foglio Economico',
  'Cronaca di Palazzo',
  'L’Osservatore Italiano',
];

export const CAMPAIGN_ACTION_COSTS = {
  talk_show: 3500,
  social_campaign: 8000,
  territorial_tour: 15000,
  law_proposal: 6000,
  party_talks: 2000,
  committee_drive: 3500,
} as const;

export const FUNDRAISING_BASE_REVENUE: Record<'cena' | 'crowdfunding' | 'gazebo', number> = {
  cena: 12000,
  crowdfunding: 7500,
  gazebo: 4500,
};

/**
 * Ricavo realistico raccolta fondi conforme alla L. 13/2014 (tetto €100.000/anno per donatore,
 * zero finanziamento pubblico diretto). Scala col radicamento/consenso del partito.
 */
export function getFundraisingReward(
  state: GameState,
  format: 'cena' | 'crowdfunding' | 'gazebo'
): number {
  const player = state.parties.find((p) => p.id === state.playerPartyId);
  const poll = Math.max(0, player?.nationalPoll ?? 0);
  const raw =
    format === 'cena'
      ? Math.min(38000, Math.round(FUNDRAISING_BASE_REVENUE.cena + poll * 750))
      : format === 'crowdfunding'
        ? Math.min(24000, Math.round(FUNDRAISING_BASE_REVENUE.crowdfunding + poll * 450))
        : Math.min(18000, Math.round(FUNDRAISING_BASE_REVENUE.gazebo + poll * 250));
  const hasFundraiser = state.leader.traits.includes('fundraiser');
  return hasFundraiser ? Math.round(raw * 1.3) : raw;
}

export interface WeeklyPartyFinances {
  /** Quota settimanale stimata 2×1000 IRPEF (solo partiti iscritti al Registro Nazionale) */
  twoPerThousand: number;
  /** Quote versate dai parlamentari eletti (€450/sett. per deputato/senatore) */
  parliamentaryContributions: number;
  /** Tesseramento nazionale e circoli regionali attivi */
  membershipAndHq: number;
  totalIncome: number;
  baseOverhead: number;
  hqUpkeep: number;
  totalExpenses: number;
  netBalance: number;
  electedSeats: number;
}

/**
 * Calcola il bilancio settimanale realistico del partito secondo il sistema italiano (L. 13/2014):
 * - Zero finanziamento pubblico diretto (abolito nel 2014)
 * - 2×1000 IRPEF solo dopo iscrizione al Registro Partiti (non in fase Comitato Promotore)
 * - Contributi mensili dei parlamentari eletti (Camera + Senato)
 * - Tesseramento ordinario e circoli regionali
 */
export function calculateWeeklyPartyFinances(
  state: GameState,
  partiesOverride?: PartyState[]
): WeeklyPartyFinances {
  const parties = partiesOverride ?? state.parties;
  const player = parties.find((p) => p.id === state.playerPartyId);
  const poll = Math.max(0, player?.nationalPoll ?? 0);

  const seats = calculateParliamentSeats(parties, state.electoralLaw);
  const playerSeatRow = seats.find((s) => s.partyId === state.playerPartyId);
  const electedSeats = (playerSeatRow?.camera ?? 0) + (playerSeatRow?.senato ?? 0);

  let hqUpkeep = 0;
  let hqMembership = 0;
  for (const regId of state.openHeadquarters) {
    const meta = REGION_MAP_BY_ID[regId];
    if (!meta) continue;
    hqUpkeep += meta.hqWeeklyUpkeep;
    hqMembership += meta.hqMembershipIncome;
  }

  const twoPerThousand = state.committee.active ? 0 : Math.round(poll * 1450);
  const parliamentaryContributions = electedSeats * 450;
  const membershipAndHq = (poll > 0 ? Math.round(poll * 350) : 0) + hqMembership;
  const totalIncome = twoPerThousand + parliamentaryContributions + membershipAndHq;

  const econExec = state.executives.find((e) => e.role === 'economia');
  const overheadDiscount = (econExec?.competence ?? 70) >= 80 ? 0.9 : 1.0;
  const baseOverhead = Math.round(state.weeklyOverhead * overheadDiscount);
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

/** Re-normalizes all parties across every demographic & all 20 regions so totals = 100%, derives macro-regions & nationalPoll */
export function normalizeAllPolls(parties: PartyState[]): PartyState[] {
  const cloned = parties.map((p) => ({
    ...p,
    demographics: { ...p.demographics },
    regions: { ...p.regions },
    regionPolls: p.regionPolls
      ? { ...p.regionPolls }
      : buildRegionPollsFromMacro(p.regions),
  }));

  // 1. Normalize each demographic to sum to 100 (supports exact 0.0% for brand-new committees)
  for (const demo of DEMOGRAPHICS) {
    let total = 0;
    for (const p of cloned) {
      const floor = p.id === 'altri' ? 0.2 : 0;
      p.demographics[demo.id] = Math.max(floor, p.demographics[demo.id]);
      total += p.demographics[demo.id];
    }
    if (total > 0) {
      for (const p of cloned) {
        p.demographics[demo.id] = round1((p.demographics[demo.id] / total) * 100);
      }
    }
  }

  // 2. Normalize each of the 20 Italian regions to sum to 100
  for (const reg of ITALIAN_REGIONS) {
    let total = 0;
    for (const p of cloned) {
      const floor = p.id === 'altri' ? 0.2 : 0;
      p.regionPolls[reg.id] = Math.max(floor, p.regionPolls[reg.id] ?? 0);
      total += p.regionPolls[reg.id];
    }
    if (total > 0) {
      for (const p of cloned) {
        p.regionPolls[reg.id] = round1((p.regionPolls[reg.id] / total) * 100);
      }
    }
  }

  // 3. Recompute 5 macro-regions as population-weighted average of their constituent 20 regions
  for (const macro of MACRO_REGIONS) {
    const subRegions = ITALIAN_REGIONS.filter((r) => r.macroRegion === macro.id);
    const weightSum = subRegions.reduce((acc, r) => acc + r.populationWeight, 0);
    for (const p of cloned) {
      const weighted = subRegions.reduce(
        (acc, r) => acc + p.regionPolls[r.id] * r.populationWeight,
        0
      );
      p.regions[macro.id] = round1(weighted / Math.max(0.001, weightSum));
    }
  }

  // 4. Compute national poll as 50% demographic-weighted + 50% 20-region-weighted, normalized to 100.0
  let sumNat = 0;
  for (const p of cloned) {
    const demoAvg = DEMOGRAPHICS.reduce(
      (acc, d) => acc + p.demographics[d.id] * d.weight,
      0
    );
    const regAvg = ITALIAN_REGIONS.reduce(
      (acc, r) => acc + p.regionPolls[r.id] * r.populationWeight,
      0
    );
    const floor = p.id === 'altri' ? 0.2 : 0;
    p.nationalPoll = Math.max(floor, demoAvg * 0.5 + regAvg * 0.5);
    sumNat += p.nationalPoll;
  }

  let running = 0;
  for (let i = 0; i < cloned.length; i++) {
    if (i === cloned.length - 1) {
      cloned[i].nationalPoll = round1(Math.max(0, 100 - running));
    } else if (sumNat > 0) {
      const normalized = round1((cloned[i].nationalPoll / sumNat) * 100);
      cloned[i].nationalPoll = normalized;
      running += normalized;
    } else {
      cloned[i].nationalPoll = 0;
    }
  }

  return cloned;
}

/** Shifts a party's support in demographics, macro-regions, and/or specific 20 regions while pulling proportionally from rivals */
export function applyElectoralShift(
  parties: PartyState[],
  targetPartyId: string,
  demoShift: Partial<Record<DemographicId, number>>,
  macroRegionShift?: Partial<Record<MacroRegionId, number>>,
  specificRegionShift?: Partial<Record<RegionId, number>>
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

  // Demographic shifts (0.0% floor for genuine grassroots start)
  for (const [demoKey, rawDelta] of Object.entries(demoShift)) {
    const d = demoKey as DemographicId;
    if (!rawDelta) continue;
    const prevVal = target.demographics[d];
    const nextVal = clamp(prevVal + rawDelta, 0, 62);
    const actualDelta = nextVal - prevVal;
    target.demographics[d] = nextVal;

    const othersSum = others.reduce((acc, o) => acc + o.demographics[d], 0);
    if (othersSum > 0) {
      for (const o of others) {
        const share = o.demographics[d] / othersSum;
        const floor = o.id === 'altri' ? 0.2 : 0;
        o.demographics[d] = clamp(o.demographics[d] - actualDelta * share, floor, 62);
      }
    }
  }

  const avgDemoDelta =
    Object.values(demoShift).reduce((a, b) => a + (b ?? 0), 0) /
    Math.max(1, Object.keys(demoShift).length);

  // 20-Region shifts
  for (const reg of ITALIAN_REGIONS) {
    const explicitSingle = specificRegionShift?.[reg.id];
    const explicitMacro = macroRegionShift?.[reg.macroRegion];
    const delta =
      explicitSingle !== undefined
        ? explicitSingle
        : explicitMacro !== undefined
          ? explicitMacro
          : avgDemoDelta * 0.65;

    if (Math.abs(delta) < 0.01) continue;
    const prevVal = target.regionPolls[reg.id];
    const nextVal = clamp(prevVal + delta, 0, 65);
    const actualDelta = nextVal - prevVal;
    target.regionPolls[reg.id] = nextVal;

    const othersSum = others.reduce((acc, o) => acc + o.regionPolls[reg.id], 0);
    if (othersSum > 0) {
      for (const o of others) {
        const share = o.regionPolls[reg.id] / othersSum;
        const floor = o.id === 'altri' ? 0.2 : 0;
        o.regionPolls[reg.id] = clamp(o.regionPolls[reg.id] - actualDelta * share, floor, 65);
      }
    }
  }

  return normalizeAllPolls(updated);
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
  electoralLaw: ElectoralLawId = 'rosatellum'
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
      // Liste < 1,0% nazionale non possono trascinare né vincere collegi uninominali
      if (p.nationalPoll < 1.0 && p.regions[regionId] < 1.5) continue;
      const key = p.coalitionId ? `coal_${p.coalitionId}` : `solo_${p.id}`;
      const existing = blocks.get(key) ?? { key, score: 0, members: [] };
      existing.score += p.regions[regionId];
      existing.members.push(p);
      blocks.set(key, existing);
    }
    return Array.from(blocks.values())
      .filter((b) => b.score >= 3.0 && b.members.length > 0)
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

      // Nei collegi uninominali della coalizione ricevono candidature solo partiti >= 1,0% nazionale
      const validCandidates = block.members.filter((m) => m.nationalPoll >= 1.0);
      const memberPool = validCandidates.length > 0 ? validCandidates : block.members;
      const memberTotal = memberPool.reduce((acc, m) => acc + Math.max(0.1, m.regions[regionId]), 0);
      let memberAssigned = 0;
      const sortedMembers = [...memberPool].sort(
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

  return parties.map((p) => ({
    partyId: p.id,
    camera: cameraSeats[p.id] ?? 0,
    senato: senatoSeats[p.id] ?? 0,
    coalitionId: p.coalitionId,
  }));
}

const CRISIS_COOLDOWN_WEEKS = 25;

/** Picks a non-repetitive contextual crisis with strict >= 25-week memory cooldown */
function pickNextCrisis(
  week: number,
  crisisCooldowns: Record<string, number>,
  ctx: { isInGovernment: boolean; isCampaign: boolean }
): ActiveCrisis {
  const matchesContext = (context: string | undefined) => {
    if (!context || context === 'any') return true;
    if (context === 'governo') return ctx.isInGovernment;
    if (context === 'opposizione') return !ctx.isInGovernment;
    if (context === 'campagna') return ctx.isCampaign;
    return true;
  };

  const offCooldown = CRISIS_POOL.filter((c) => {
    const last = crisisCooldowns[c.id];
    return last === undefined || week - last >= CRISIS_COOLDOWN_WEEKS;
  });

  const contextualOffCooldown = offCooldown.filter((c) => matchesContext(c.context));
  const specificContextual = contextualOffCooldown.filter(
    (c) => c.context && c.context !== 'any'
  );

  let chosen = CRISIS_POOL[0];
  if (specificContextual.length > 0 && Math.random() < 0.38) {
    chosen = specificContextual[Math.floor(Math.random() * specificContextual.length)];
  } else if (contextualOffCooldown.length > 0) {
    chosen = contextualOffCooldown[Math.floor(Math.random() * contextualOffCooldown.length)];
  } else {
    // Fallback if every event has been triggered within 25 weeks: pick oldest matching event
    const matching = CRISIS_POOL.filter((c) => matchesContext(c.context));
    const sorted = [...(matching.length > 0 ? matching : CRISIS_POOL)].sort(
      (a, b) => (crisisCooldowns[a.id] ?? -999) - (crisisCooldowns[b.id] ?? -999)
    );
    chosen = sorted[0];
  }

  return {
    event: chosen,
    resolved: false,
  };
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
  newPartyDraft?: NewPartyDraft;
}): GameState {
  const { mode, existingPartyId, newPartyDraft } = params;

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
  }));

  parties.push({
    ...MINOR_PARTIES_BASELINE,
    demographics: { ...MINOR_PARTIES_BASELINE.demographics },
    regions: { ...MINOR_PARTIES_BASELINE.regions },
    regionPolls: { ...MINOR_PARTIES_BASELINE.regionPolls },
  });

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
    const basePoll = isCommittee ? 0.0 : orient.establishedBasePoll;

    const newMacroRegions: Record<MacroRegionId, number> = {
      nord_ovest: isCommittee ? 0 : basePoll * orient.regionAffinity.nord_ovest,
      nord_est: isCommittee ? 0 : basePoll * orient.regionAffinity.nord_est,
      centro: isCommittee ? 0 : basePoll * orient.regionAffinity.centro,
      sud: isCommittee ? 0 : basePoll * orient.regionAffinity.sud,
      isole: isCommittee ? 0 : basePoll * orient.regionAffinity.isole,
    };

    const newParty: PartyState = {
      id: 'player_custom',
      name: newPartyDraft.name.trim() || 'Italia Futura',
      acronym: (newPartyDraft.acronym.trim() || 'IF').toUpperCase().slice(0, 5),
      color: newPartyDraft.color,
      emblem: newPartyDraft.emblem,
      customEmblemUrl: newPartyDraft.customEmblemUrl,
      orientation: newPartyDraft.orientation,
      axis: { ...orient.axis },
      leaderName: newPartyDraft.leaderName.trim() || 'Marco Ferri',
      isPlayer: true,
      isInGovernment: false,
      coalitionId: 'player_coalition',
      demographics: {
        giovani: isCommittee ? 0 : basePoll * orient.demoAffinity.giovani,
        lavoratori: isCommittee ? 0 : basePoll * orient.demoAffinity.lavoratori,
        imprese: isCommittee ? 0 : basePoll * orient.demoAffinity.imprese,
        pensionati: isCommittee ? 0 : basePoll * orient.demoAffinity.pensionati,
      },
      regions: newMacroRegions,
      regionPolls: buildRegionPollsFromMacro(newMacroRegions),
      nationalPoll: basePoll,
      previousPoll: isCommittee ? 0 : Math.max(0, round1(basePoll - 0.2)),
      relationWithPlayer: 100,
      coalitionStatus: 'alleato',
      description: `${orient.label} · ${orient.shortDesc}`,
    };

    const factor = (100 - basePoll) / 100;
    parties = parties.map((p) => {
      const scaledRegions = {} as Record<RegionId, number>;
      for (const r of ITALIAN_REGIONS) {
        scaledRegions[r.id] = p.regionPolls[r.id] * factor;
      }
      return {
        ...p,
        demographics: {
          giovani: p.demographics.giovani * factor,
          lavoratori: p.demographics.lavoratori * factor,
          imprese: p.demographics.imprese * factor,
          pensionati: p.demographics.pensionati * factor,
        },
        regions: {
          nord_ovest: p.regions.nord_ovest * factor,
          nord_est: p.regions.nord_est * factor,
          centro: p.regions.centro * factor,
          sud: p.regions.sud * factor,
          isole: p.regions.isole * factor,
        },
        regionPolls: scaledRegions,
      };
    });

    parties.unshift(newParty);
    playerPartyId = newParty.id;
    budget = isCommittee ? 15000 : orient.startingBudget;
    weeklyOverhead = isCommittee ? 2500 : 8500;
    openHeadquarters = isCommittee ? [] : ['lazio'];
    leader = {
      name: newParty.leaderName,
      age: newPartyDraft.leaderAge,
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
    leader = {
      name: preset.leaderName,
      age: preset.leaderAge,
      style: preset.leaderStyle,
      traits: [...preset.leaderTraits] as LeaderProfile['traits'],
    };
    parties = parties.map((p) =>
      p.id === playerPartyId ? { ...p, isPlayer: true } : p
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
          const ramp = [
            0,
            0,
            0,
            0,
            0,
            0.1,
            0.3,
            0.5,
            0.8,
            1.1,
            round1(p.nationalPoll * 0.8),
            p.nationalPoll,
          ];
          snap[p.id] = ramp[idx];
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
  const firstCrisis = pickNextCrisis(1, {}, {
    isInGovernment: playerParty.isInGovernment,
    isCampaign: mode === 'government_crisis',
  });

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

  const isInitialCentrodestraGov =
    mode === 'existing_party' && playerParty.isInGovernment && playerParty.coalitionId === 'centrodestra';
  const initialIsPrimeMinister = isInitialCentrodestraGov && playerPartyId === 'fdi';
  const initialMinistries: Partial<Record<MinistryId, string>> = isInitialCentrodestraGov
    ? {
        mef: 'lega',
        interno: 'fdi',
        esteri: 'fi',
        giustizia: 'fdi',
        infrastrutture: 'lega',
        salute: 'fi',
      }
    : {};
  const initialSeats = calculateParliamentSeats(parties, 'rosatellum');
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
    politicalCapital: 3,
    maxPoliticalCapital: 3,
    parties,
    executives,
    pollHistory,
    currentCrisis: firstCrisis,
    crisisCooldowns: { [firstCrisis.event.id]: 1 },
    usedCrisisIds: [firstCrisis.event.id],
    mediaFeed: buildInitialMedia(mode, playerParty, 1),
    actionLog: [],
    actionsTakenThisWeek: [],
    committee,
    coalitionName,
    election: null,
    governmentRole: initialIsPrimeMinister
      ? 'premier'
      : playerParty.isInGovernment
        ? 'governo'
        : 'opposizione',
    schismOccurred: false,
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
  };
}

/** Opens a Regional Party Headquarters in the selected region's capital */
export function openRegionalHeadquarters(
  state: GameState,
  regionId: RegionId
): { nextState: GameState; feedback: string; error?: string } {
  const region = REGION_MAP_BY_ID[regionId];
  if (!region) {
    return { nextState: state, feedback: '', error: 'Regione non valida.' };
  }
  if (state.openHeadquarters.includes(regionId)) {
    return {
      nextState: state,
      feedback: '',
      error: `Hai già una Sede Regionale attiva a ${region.capital}.`,
    };
  }
  if (state.budget < region.hqCost) {
    return {
      nextState: state,
      feedback: '',
      error: `Fondi insufficienti: aprire la sede a ${region.capital} costa €${region.hqCost.toLocaleString('it-IT')}.`,
    };
  }

  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const dateLabel = formatGameDate(state.week).shortLabel;

  // Opening an HQ gives an immediate +0.5% local inauguration boost in that region
  const updatedParties = applyElectoralShift(
    state.parties,
    state.playerPartyId,
    {},
    undefined,
    { [regionId]: 0.5 }
  );

  const updatedCommittee = { ...state.committee };
  if (updatedCommittee.active) {
    updatedCommittee.committeesOpened += 1;
    updatedCommittee.signatures += 2500;
  }

  const feedback = `Sede Regionale inaugurata a ${region.capital} (${region.name}): +${region.hqWeeklyGrowth.toFixed(1)}%/sett. consenso locale e +€${region.hqMembershipIncome.toLocaleString('it-IT')}/sett. tesseramento.`;

  const mediaItem: MediaItem = {
    id: uid('med'),
    week: state.week,
    dateLabel,
    type: 'stampa',
    source: 'Gazzetta Regionale',
    headline: `${player.name} inaugura la nuova Sede Regionale a ${region.capital}`,
    excerpt: `Taglio del nastro in ${region.name} per radicare circoli, volontari e campagna territoriale.`,
    sentiment: 'positivo',
    partyColor: player.color,
  };

  return {
    nextState: {
      ...state,
      budget: state.budget - region.hqCost,
      openHeadquarters: [...state.openHeadquarters, regionId],
      parties: updatedParties,
      committee: updatedCommittee,
      mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
      actionLog: [
        {
          id: uid('act'),
          week: state.week,
          category: 'Sede Regionale',
          title: `Apertura sede ${region.capital} (${region.name})`,
          cost: region.hqCost,
          summary: feedback,
        },
        ...state.actionLog,
      ].slice(0, 30),
    },
    feedback,
  };
}

/** Closes a Regional Party Headquarters to save weekly upkeep */
export function closeRegionalHeadquarters(
  state: GameState,
  regionId: RegionId
): { nextState: GameState; feedback: string; error?: string } {
  const region = REGION_MAP_BY_ID[regionId];
  if (!region || !state.openHeadquarters.includes(regionId)) {
    return { nextState: state, feedback: '', error: 'Nessuna sede attiva in questa regione.' };
  }

  return {
    nextState: {
      ...state,
      openHeadquarters: state.openHeadquarters.filter((id) => id !== regionId),
    },
    feedback: `Sede di ${region.capital} chiusa: risparmiati €${region.hqWeeklyUpkeep.toLocaleString('it-IT')}/settimana.`,
  };
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
  if (state.politicalCapital <= 0) {
    return {
      nextState: state,
      feedback: '',
      error: 'Capitale Politico esaurito per questa settimana. Avanza al turno successivo.',
    };
  }

  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const commExec = state.executives.find((e) => e.role === 'comunicazione');
  const viceExec = state.executives.find((e) => e.role === 'vice_segretario');
  const capoExec = state.executives.find((e) => e.role === 'capogruppo');

  const commMult = 0.85 + ((commExec?.competence ?? 70) / 100) * 0.35;
  const hasTrait = (t: GameState['leader']['traits'][0]) => state.leader.traits.includes(t);
  const dateLabel = formatGameDate(state.week).shortLabel;

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
    const mediaControlBonus = state.institutionalFlags.mediaControl ? 1.3 : 1.0;
    const tvBonus =
      (state.leader.style === 'carismatico' ? 1.25 : 1) *
      (hasTrait('oratore_tv') ? 1.25 : 1) *
      commMult *
      mediaControlBonus;

    if (payload.tone === 'aggressivo') {
      demoShift = {
        giovani: 0.7 * tvBonus,
        lavoratori: 0.8 * tvBonus,
        imprese: 0.2 * tvBonus,
        pensionati: -0.3,
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
      demoShift = {
        pensionati: 0.9 * tvBonus,
        imprese: 0.85 * tvBonus,
        lavoratori: 0.35 * tvBonus,
        giovani: 0.2 * tvBonus,
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
        lavoratori: 1.0 * tvBonus,
        giovani: 0.8 * tvBonus,
        pensionati: 0.4 * tvBonus,
        imprese: -0.45,
      };
      regionShift = { sud: 0.7 * tvBonus, isole: 0.6 * tvBonus };
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
    cost = hasTrait('maestro_social') ? Math.round(baseCost * 0.8) : baseCost;
    if (state.budget < cost) {
      return {
        nextState: state,
        feedback: '',
        error: `Fondi insufficienti per la campagna social mirata (€${cost.toLocaleString('it-IT')}).`,
      };
    }
    const mediaControlBonus = state.institutionalFlags.mediaControl ? 1.3 : 1.0;
    const mult = (hasTrait('maestro_social') ? 1.35 : 1.0) * commMult * mediaControlBonus;
    const demoLabel = DEMOGRAPHICS.find((d) => d.id === payload.target)?.label ?? payload.target;
    demoShift = {
      [payload.target]: 1.45 * mult,
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
      (state.leader.style === 'tribuno' ? 1.25 : 1) *
      (0.9 + ((viceExec?.competence ?? 70) / 100) * 0.25);
    const regInfo = MACRO_REGIONS.find((r) => r.id === payload.region)!;
    regionShift = { [payload.region]: 1.75 * mult };
    demoShift = { lavoratori: 0.4 * mult, pensionati: 0.4 * mult };
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
      updatedCommittee.signatures += Math.round(4500 * mult);
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
      salario_minimo: { lavoratori: 1.4, giovani: 1.0, imprese: -0.6 },
      flat_tax: { imprese: 1.6, lavoratori: -0.4, pensionati: 0.3 },
      sanita_pubblica: { pensionati: 1.4, lavoratori: 0.9, giovani: 0.4 },
      energia_pulita: { giovani: 1.3, imprese: 0.8, pensionati: 0.2 },
      sicurezza_citta: { pensionati: 1.2, imprese: 0.8, giovani: -0.3 },
      referendum_giustizia: { imprese: 0.7, giovani: 0.8, lavoratori: 0.5 },
    };
    demoShift = topicEffects[payload.topicId] ?? { lavoratori: 0.7, giovani: 0.7 };
    actionCategory = 'Proposta di Legge';
    actionTitle = payload.topicLabel;
    actionSummary = `Depositata in Parlamento e rilanciata alla stampa la proposta su "${payload.topicLabel}".`;
    mediaEntry = {
      id: uid('med'),
      week: state.week,
      dateLabel,
      type: 'stampa',
      source: NEWSPAPERS[(state.week + 2) % NEWSPAPERS.length],
      headline: `${player.name} deposita il disegno di legge: "${payload.topicLabel}"`,
      excerpt: 'L’iniziativa entra subito nell’agenda politica della settimana costringendo i rivali a prendere posizione.',
      sentiment: 'positivo',
      partyColor: player.color,
    };
  } else if (payload.type === 'fundraising') {
    budgetGain = getFundraisingReward(state, payload.format);
    const hqTesseramentoBonus =
      payload.format === 'gazebo' ? state.openHeadquarters.length * 1200 : 0;
    budgetGain += hqTesseramentoBonus;

    if (payload.format === 'cena') {
      demoShift = { imprese: 0.3, lavoratori: -0.2 };
      actionTitle = 'Cena Finanziatori (L. 13/2014)';
      actionSummary = `Raccolti +€${budgetGain.toLocaleString('it-IT')} con donazioni tracciate entro il tetto di legge (€100k/donatore).`;
    } else if (payload.format === 'crowdfunding') {
      demoShift = { giovani: 0.45 };
      actionTitle = 'Crowdfunding & Campagna 2×1000';
      actionSummary = `Raccolti +€${budgetGain.toLocaleString('it-IT')} tramite micro-donazioni volontarie online.`;
    } else {
      demoShift = { lavoratori: 0.35, pensionati: 0.35 };
      actionTitle = 'Gazebo & Campagna Tesseramento';
      actionSummary = `Raccolti +€${budgetGain.toLocaleString('it-IT')} (incluso bonus sedi regionali) e nuovi tesserati.`;
      if (updatedCommittee.active) {
        updatedCommittee.signatures += 6500;
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
    const stratBonus = state.leader.style === 'stratega' ? 6 : 0;
    const capoBonus = Math.round(((capoExec?.competence ?? 70) - 60) / 5);
    const relGain = Math.round(compat / 10 + 6 + stratBonus + capoBonus);

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
      headline: `Vertice a Montecitorio tra ${player.acronym} e ${targetParty.acronym}`,
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
    const gainSig = 9000 + Math.round((viceExec?.competence ?? 70) * 45);
    updatedCommittee.signatures += gainSig;
    updatedCommittee.committeesOpened += 3;
    demoShift = { giovani: 0.35, lavoratori: 0.3 };
    actionCategory = 'Comitato Promotore';
    actionTitle = 'Mobilitazione Nazionale Raccolta Firme';
    actionSummary = `Raccolte +${gainSig.toLocaleString('it-IT')} firme autenticate e aperti 3 nuovi comitati provinciali.`;
  }

  if (Object.keys(demoShift).length > 0 || regionShift) {
    updatedParties = applyElectoralShift(updatedParties, state.playerPartyId, demoShift, regionShift);
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
    politicalCapital: state.politicalCapital - 1,
    parties: updatedParties,
    committee: updatedCommittee,
    mediaFeed: nextMedia,
    actionLog: nextLog,
    actionsTakenThisWeek: [...state.actionsTakenThisWeek, `${actionCategory}: ${actionTitle}`],
    totalBillsProposed,
    leaderApproval: nextLeaderApproval,
  };

  return { nextState, feedback: actionSummary };
}

/** Resolves the weekly political crisis, dynamically evolving the party's 4 ideological axes & state indicators */
export function resolveWeeklyCrisis(
  state: GameState,
  option: CrisisOption
): { nextState: GameState; feedback: string } {
  if (state.currentCrisis.resolved) {
    return { nextState: state, feedback: 'Crisi già risolta questa settimana.' };
  }

  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const dateLabel = formatGameDate(state.week).shortLabel;
  const instMod = state.leader.style === 'istituzionale' ? 0.85 : 1.0;
  const scandalShield =
    state.institutionalFlags.judiciaryControl &&
    state.currentCrisis.event.category === 'Scandalo'
      ? 0.5
      : 1.0;

  const adjustedDemo: Partial<Record<DemographicId, number>> = {};
  for (const [k, v] of Object.entries(option.demoEffects)) {
    if (v === undefined) continue;
    adjustedDemo[k as DemographicId] = v < 0 ? v * instMod * scandalShield : v;
  }

  let updatedParties = applyElectoralShift(
    state.parties,
    state.playerPartyId,
    adjustedDemo,
    option.regionEffects
  );

  // Shift player's 4 ideological axes dynamically
  const nextPlayerAxis = applyAxisShift(player.axis, option.axisShift);
  updatedParties = updatedParties.map((p) =>
    p.id === state.playerPartyId ? { ...p, axis: nextPlayerAxis } : p
  );
  const shiftedPlayer = updatedParties.find((p) => p.id === state.playerPartyId)!;

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

  const updatedExecutives = state.executives.map((ex) => ({
    ...ex,
    loyalty: clamp(ex.loyalty + (option.loyaltyDelta ?? 0), 10, 100),
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
    excerpt: `Decisione di ${player.name} sul dossier "${state.currentCrisis.event.title}": scelta la linea ${option.stance}.`,
    sentiment: option.requiredTrait ? 'positivo' : 'neutro',
    partyColor: player.color,
  };

  const rivalItem: MediaItem = {
    id: uid('med'),
    week: state.week,
    dateLabel,
    type: 'rivale',
    source: rival ? `${rival.leaderName} (${rival.acronym})` : 'Opposizione',
    headline: `Reazione dura da ${rival?.name ?? 'i rivali'} sulla crisi della settimana`,
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

  const nextState: GameState = {
    ...state,
    budget: Math.max(0, state.budget + option.budgetDelta),
    parties: updatedParties,
    executives: updatedExecutives,
    stateIndicators: nextStateIndicators,
    regimeStatus: nextRegimeStatus,
    leaderApproval: nextLeaderApproval,
    currentCrisis: {
      ...state.currentCrisis,
      resolved: true,
      chosenOptionId: option.id,
      outcomeSummary: option.headlineResult,
    },
    mediaFeed: [pressItem, rivalItem, ...state.mediaFeed].slice(0, 40),
  };

  return { nextState, feedback: option.headlineResult };
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
  const seats = calculateParliamentSeats(state.parties, state.electoralLaw);

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
  lawId: string
): { nextState: GameState; feedback: string; error?: string; triggeredCollapse?: boolean } {
  const law = PARLIAMENT_LAWS.find((l) => l.id === lawId);
  if (!law) return { nextState: state, feedback: '', error: 'Provvedimento non trovato.' };

  if (state.politicalCapital <= 0) {
    return {
      nextState: state,
      feedback: '',
      error: 'Serve 1 punto di Capitale Politico (PA) per calendarizzare e votare la legge.',
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

  const cost = law.budgetDelta < 0 ? Math.abs(law.budgetDelta) : 0;
  if (state.budget < cost) {
    return {
      nextState: state,
      feedback: '',
      error: `Fondi insufficienti per coprire l’iniziativa parlamentare (€${cost.toLocaleString('it-IT')}).`,
    };
  }

  const forecast = forecastLawVote(state, law);
  const dateLabel = formatGameDate(state.week).shortLabel;
  const player = state.parties.find((p) => p.id === state.playerPartyId)!;

  // Small realistic franc-tireurs swing (-4..+3) unless authoritarian regime
  const camSwing =
    state.regimeStatus === 'regime_autoritario' ? 0 : Math.floor(Math.random() * 8) - 4;
  const senSwing =
    state.regimeStatus === 'regime_autoritario' ? 0 : Math.floor(Math.random() * 5) - 2;
  const finalCamYes =
    state.regimeStatus === 'regime_autoritario'
      ? 400
      : clamp(forecast.cameraYes + camSwing, 0, 400);
  const finalSenYes =
    state.regimeStatus === 'regime_autoritario'
      ? 200
      : clamp(forecast.senatoYes + senSwing, 0, 200);
  const passedChambers =
    state.regimeStatus === 'regime_autoritario' ||
    (finalCamYes >= forecast.requiredCamera && finalSenYes >= forecast.requiredSenato);

  // Case 1: Rejected by Parliament
  if (!passedChambers) {
    const partialAxis = applyAxisShift(player.axis, {
      economic: Math.round((law.axisShift.economic ?? 0) * 0.4),
      society: Math.round((law.axisShift.society ?? 0) * 0.4),
      europe: Math.round((law.axisShift.europe ?? 0) * 0.4),
      institutions: Math.round((law.axisShift.institutions ?? 0) * 0.4),
    });
    const updatedParties = state.parties.map((p) =>
      p.id === player.id ? { ...p, axis: partialAxis } : p
    );

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
        politicalCapital: state.politicalCapital - 1,
        budget: Math.max(0, state.budget - Math.round(cost * 0.5)),
        parties: updatedParties,
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
      politicalCapital: state.politicalCapital - 1,
      budget: Math.max(0, state.budget - cost),
      parties: updatedParties,
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
    state.parties,
    player.id,
    law.demoEffects,
    law.regionEffects
  );
  const nextAxis = applyAxisShift(player.axis, law.axisShift);
  updatedParties = updatedParties.map((p) =>
    p.id === player.id ? { ...p, axis: nextAxis } : p
  );

  const nextFlags: InstitutionalFlags = { ...state.institutionalFlags };
  if (law.grantsFlag) {
    nextFlags[law.grantsFlag] = true;
  }

  const nextIndicators = applyStateEffects(state.stateIndicators, law.stateEffects);
  const nextRegimeStatus = deriveRegimeStatus(nextFlags, nextIndicators.democraticHealth);
  const nextElectoralLaw = law.electoralLawChange ?? state.electoralLaw;
  const nextEnactedIds = state.enactedLawIds.includes(law.id)
    ? state.enactedLawIds
    : [...state.enactedLawIds, law.id];

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
    summary:
      law.id === 'law_pieni_poteri'
        ? 'REGIME AUTORITARIO INSTAURATO: Parlamento sospeso, decreti esecutivi diretti da Palazzo Chigi.'
        : `Approvata (${finalCamYes} Camera / ${finalSenYes} Senato) e promulgata in Gazzetta Ufficiale.`,
  };

  const mediaItem: MediaItem = {
    id: uid('med'),
    week: state.week,
    dateLabel,
    type: 'stampa',
    source: 'Gazzetta Parlamentare',
    headline: law.enactedHeadline,
    excerpt: record.summary,
    sentiment: law.id === 'law_pieni_poteri' ? 'negativo' : 'positivo',
    partyColor: player.color,
  };

  const nextState: GameState = {
    ...state,
    politicalCapital: state.politicalCapital - 1,
    budget: Math.max(0, state.budget + law.budgetDelta),
    parties: updatedParties,
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
  };

  return { nextState, feedback: law.enactedHeadline };
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

/** Executive management actions */
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

  let budgetCost = 0;
  let updatedExecs = [...state.executives];
  let feedback = '';

  if (action === 'colloquio') {
    if (state.politicalCapital <= 0) {
      return {
        nextState: state,
        feedback: '',
        error: 'Serve 1 punto di Capitale Politico per un colloquio riservato.',
      };
    }
    const loyaltyGain = state.leader.style === 'stratega' ? 16 : 12;
    updatedExecs[idx] = {
      ...exec,
      loyalty: clamp(exec.loyalty + loyaltyGain, 0, 100),
      actedThisWeek: true,
    };
    feedback = `Colloquio riservato con ${exec.name}: lealtà salita a ${updatedExecs[idx].loyalty}%.`;
    return {
      nextState: {
        ...state,
        politicalCapital: state.politicalCapital - 1,
        executives: updatedExecs,
      },
      feedback,
    };
  }

  if (action === 'incarico') {
    budgetCost = 20000;
    if (state.budget < budgetCost) {
      return { nextState: state, feedback: '', error: 'Servono €20.000 per finanziare il dossier operativo.' };
    }
    updatedExecs[idx] = {
      ...exec,
      competence: clamp(exec.competence + 5, 0, 100),
      loyalty: clamp(exec.loyalty + 6, 0, 100),
      actedThisWeek: true,
    };
    feedback = `Dossier affidato a ${exec.name}: competenza +5, lealtà +6.`;
    return {
      nextState: {
        ...state,
        budget: state.budget - budgetCost,
        executives: updatedExecs,
      },
      feedback,
    };
  }

  budgetCost = 35000;
  if (state.budget < budgetCost) {
    return { nextState: state, feedback: '', error: 'Servono €35.000 per la transizione organizzativa.' };
  }
  const pool = REPLACEMENT_CANDIDATES[exec.role];
  const candidate = pool.find((c) => c.name !== exec.name) ?? pool[0];
  updatedExecs[idx] = {
    ...exec,
    name: candidate.name,
    faction: candidate.faction,
    competence: candidate.competence,
    loyalty: candidate.loyalty,
    ambition: candidate.ambition,
    trait: candidate.trait,
    actedThisWeek: true,
  };
  updatedExecs = updatedExecs.map((e, i) =>
    i === idx ? e : { ...e, loyalty: clamp(e.loyalty - 4, 15, 100) }
  );
  feedback = `${exec.roleLabel} sostituito: nominato ${candidate.name} (${candidate.faction}).`;
  return {
    nextState: {
      ...state,
      budget: state.budget - budgetCost,
      executives: updatedExecs,
    },
    feedback,
  };
}

/** Coalition diplomacy actions */
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

  const compat = computeIdeologicalCompatibility(player, target);
  const dateLabel = formatGameDate(state.week).shortLabel;
  let updatedParties = [...state.parties];
  let feedback = '';
  let headline = '';

  const playerCoalitionKey = player.coalitionId ?? 'player_coalition';

  if (action === 'proponi_alleanza' || action === 'patto_governo') {
    if (state.politicalCapital <= 0) {
      return {
        nextState: state,
        feedback: '',
        error: 'Serve 1 punto di Capitale Politico per negoziare l’alleanza.',
      };
    }
    const threshold = action === 'proponi_alleanza' ? 32 : 45;
    const score =
      target.relationWithPlayer +
      (compat - 50) * 0.7 +
      (state.leader.style === 'stratega' ? 10 : 0);

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
          ? { ...p, relationWithPlayer: clamp(p.relationWithPlayer + 5, -100, 100) }
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
        politicalCapital: state.politicalCapital - 1,
        parties: updatedParties,
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

  if (state.politicalCapital <= 0) {
    return {
      nextState: state,
      feedback: '',
      error: 'Serve 1 punto di Capitale Politico per un attacco coordinato.',
    };
  }
  updatedParties = applyElectoralShift(state.parties, target.id, {
    giovani: -0.5,
    lavoratori: -0.6,
    imprese: -0.4,
    pensionati: -0.4,
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
      politicalCapital: state.politicalCapital - 1,
      parties: updatedParties,
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
  let finalParties = state.parties.map((p) => ({
    ...p,
    demographics: { ...p.demographics },
    regions: { ...p.regions },
    regionPolls: { ...p.regionPolls },
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

  const seats = calculateParliamentSeats(finalParties, state.electoralLaw);
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

  const hasMajority = playerCoal.camera >= 201 && playerCoal.senato >= 101;
  const isWinningBlock = winner === playerCoal;
  const isLargestInCoalition = playerCoal.leaderParty.id === player.id;

  let playerRole: ElectionResult['playerRole'] = 'opposizione';
  let outcomeTitle = '';
  let outcomeNarrative = '';

  if (playerSeat.camera === 0 && playerSeat.senato === 0) {
    playerRole = 'fuori_parlamento';
    outcomeTitle = 'Sotto lo sbarramento del 3%';
    outcomeNarrative = `${player.name} si ferma al ${player.nationalPoll.toFixed(1)}% e resta fuori dalle Camere. Serve ricostruire il radicamento territoriale.`;
  } else if (hasMajority && isLargestInCoalition) {
    playerRole = 'premier';
    outcomeTitle = 'Incarico a Palazzo Chigi: Presidente del Consiglio';
    outcomeNarrative = `Trionfo elettorale! Con ${playerCoal.camera} deputati e ${playerCoal.senato} senatori, il Quirinale conferisce a ${player.leaderName} l’incarico di formare il nuovo Governo.`;
  } else if (hasMajority && !isLargestInCoalition) {
    playerRole = 'partner_governo';
    outcomeTitle = 'Maggioranza di Governo: Vice-Premier e Ministeri Chiave';
    outcomeNarrative = `La tua coalizione conquista la maggioranza assoluta (${playerCoal.camera} Camera / ${playerCoal.senato} Senato). ${player.name} è decisivo nel Consiglio dei Ministri.`;
  } else if (isWinningBlock && !hasMajority) {
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
  };

  return {
    ...state,
    parties: finalParties,
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
  const player = parties.find((p) => p.id === playerPartyId)!;
  const coalitionParties = parties.filter(
    (p) =>
      p.id !== 'altri' &&
      (p.id === player.id || (Boolean(player.coalitionId) && p.coalitionId === player.coalitionId))
  );

  const seatOf = (partyId: string) =>
    seats.find((s) => s.partyId === partyId) ?? { camera: 0, senato: 0 };

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

      const grantsConfidence = satisfaction >= 50;
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
  const canFormGovernment = confidentCamera >= 201;

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
  const coalitionParties = parties.filter(
    (p) =>
      p.id !== 'altri' &&
      (p.id === player.id || (Boolean(player.coalitionId) && p.coalitionId === player.coalitionId))
  );

  const assignments: Record<MinistryId, string> = {
    mef: player.id,
    interno: player.id,
    esteri: player.id,
    giustizia: player.id,
    infrastrutture: player.id,
    salute: player.id,
  };

  if (coalitionParties.length <= 1) return assignments;

  const seatOf = (partyId: string) =>
    seats.find((s) => s.partyId === partyId)?.camera ?? 0;
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

/** Conclude le Consultazioni al Quirinale e fa giurare il giocatore come Presidente del Consiglio */
export function formGovernmentFromConsultations(
  state: GameState,
  assignments: Partial<Record<MinistryId, string>>
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

  const feedback = `Giuramento al Quirinale completato! ${player.leaderName} guida il Governo con ${evaluation.confidentCamera} deputati e ${evaluation.confidentSenato} senatori.`;

  return {
    nextState: {
      ...state,
      parties: updatedParties,
      isPrimeMinister: true,
      governmentRole: 'premier',
      governmentMinistries: completeAssignments,
      allySatisfaction,
      leaderApproval: adjustLeaderApproval(state.leaderApproval, state.playerPartyId, 4),
      electionWeek: state.week + 20,
      election: null,
      mediaFeed: [mediaItem, ...state.mediaFeed].slice(0, 40),
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
} {
  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const dateLabel = formatGameDate(state.week).shortLabel;

  const updatedParties = state.parties.map((p) =>
    p.id === player.id ? { ...p, isInGovernment: false } : p
  );

  const feedback = `${player.leaderName} rimette il mandato al Quirinale: ${player.name} guiderà l’Opposizione nella nuova legislatura.`;

  return {
    nextState: {
      ...state,
      parties: updatedParties,
      isPrimeMinister: false,
      governmentRole: 'opposizione',
      governmentMinistries: {},
      allySatisfaction: {},
      electionWeek: state.week + 20,
      election: null,
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
    },
    feedback,
  };
}

/** Esegue un Rimpasto di Governo cedendo un ministero a un altro partito della coalizione */
export function executeCabinetReshuffle(
  state: GameState,
  ministryId: MinistryId,
  newPartyId: string
): { nextState: GameState; feedback: string; error?: string } {
  if (!state.isPrimeMinister) {
    return {
      nextState: state,
      feedback: '',
      error: 'Solo il Presidente del Consiglio può effettuare un Rimpasto di Governo.',
    };
  }
  if (state.politicalCapital <= 0) {
    return {
      nextState: state,
      feedback: '',
      error: 'Serve 1 punto di Capitale Politico (PA) per gestire il Rimpasto.',
    };
  }

  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
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

  const prevHolderId = state.governmentMinistries[ministryId];
  if (prevHolderId === newPartyId) {
    return {
      nextState: state,
      feedback: '',
      error: `${newHolder.acronym} detiene già questo ministero.`,
    };
  }

  const ministry = getMinistryById(ministryId);
  const nextMinistries: Partial<Record<MinistryId, string>> = {
    ...state.governmentMinistries,
    [ministryId]: newPartyId,
  };

  const seats = calculateParliamentSeats(state.parties, state.electoralLaw);
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

  const updatedParties = state.parties.map((p) => {
    if (p.id === newPartyId && p.id !== player.id) {
      return {
        ...p,
        isInGovernment: true,
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

  const dateLabel = formatGameDate(state.week).shortLabel;
  const feedback =
    newPartyId === player.id
      ? `Rimpasto completato: ${player.acronym} riprende il dicastero ${ministry.shortName}.`
      : `Rimpasto completato: ${ministry.shortName} ceduto a ${newHolder.name} (fiducia al ${nextAllySatisfaction[newPartyId] ?? 75}%).`;

  const mediaItem: MediaItem = {
    id: uid('med'),
    week: state.week,
    dateLabel,
    type: 'stampa',
    source: 'Cronaca di Palazzo',
    headline: `Rimpasto a Palazzo Chigi: il Ministero ${ministry.shortName} passa a ${newHolder.name}`,
    excerpt: `${player.leaderName} ridisegna gli equilibri del Consiglio dei Ministri per blindare la tenuta della maggioranza.`,
    sentiment: 'neutro',
    partyColor: newHolder.color,
  };

  return {
    nextState: {
      ...state,
      politicalCapital: state.politicalCapital - 1,
      parties: updatedParties,
      governmentMinistries: nextMinistries,
      allySatisfaction: nextAllySatisfaction,
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
  const seats = calculateParliamentSeats(state.parties, state.electoralLaw);

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
      preview.regionEffects
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
  let updatedParties = applyElectoralShift(state.parties, player.id, {
    giovani: -1.0,
    lavoratori: -1.1,
    imprese: -1.3,
    pensionati: -1.0,
  });
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
 * (campagna social, tour regionale, attacco a un rivale, proposta di legge o tentativo di avvicinare un alleato).
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
} {
  let parties = params.parties;
  let leaderApproval = { ...params.leaderApproval };
  const allySatisfaction = { ...params.allySatisfaction };
  const mediaItems: MediaItem[] = [];
  const notifications: string[] = [];

  const player = parties.find((p) => p.id === params.playerPartyId)!;
  const rivals = parties.filter((p) => p.id !== params.playerPartyId && p.id !== 'altri');
  if (rivals.length === 0) {
    return { parties, leaderApproval, allySatisfaction, mediaItems, notifications };
  }

  // Seleziona 2 o 3 partiti avversari distinti (peso leggermente maggiore ai partiti più visibili)
  const moveCount = Math.min(rivals.length, params.week % 2 === 0 ? 3 : 2);
  const scoredRivals = [...rivals]
    .map((p) => ({ party: p, sortScore: Math.random() * 18 + Math.sqrt(Math.max(1, p.nationalPoll)) * 2.2 }))
    .sort((a, b) => b.sortScore - a.sortScore)
    .slice(0, moveCount)
    .map((x) => x.party);

  const playerAllies = rivals.filter(
    (p) => Boolean(player.coalitionId) && p.coalitionId === player.coalitionId
  );

  for (let i = 0; i < scoredRivals.length; i++) {
    const actor = parties.find((p) => p.id === scoredRivals[i].id)!;
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
      const boost = round1(0.45 + Math.random() * 0.4);
      parties = applyElectoralShift(parties, actor.id, { [targetDemo]: boost });
      leaderApproval = adjustLeaderApproval(leaderApproval, actor.id, 2);

      mediaItems.push({
        id: uid('med'),
        week: params.week,
        dateLabel: params.dateLabel,
        type: 'social',
        source: `Campagna ${actor.acronym}`,
        handle: `@${actor.acronym.toLowerCase()}_ufficiale`,
        headline: `${actor.leaderName} (${actor.acronym}) lancia offensiva social mirata su ${demoLabel}`,
        excerpt: `Spot sponsorizzati e dirette virali spingono ${actor.name} (+${boost.toFixed(1)}% nel target) e rafforzano il gradimento del leader.`,
        sentiment: 'neutro',
        engagement: `${Math.round(18 + actor.nationalPoll * 1.4)}k interazioni`,
        partyColor: actor.color,
      });
    } else if (action === 'tour_regionale') {
      const reg = MACRO_REGIONS[Math.floor(Math.random() * MACRO_REGIONS.length)];
      const boost = round1(0.55 + Math.random() * 0.45);
      parties = applyElectoralShift(parties, actor.id, {}, { [reg.id]: boost });
      leaderApproval = adjustLeaderApproval(leaderApproval, actor.id, 1);

      mediaItems.push({
        id: uid('med'),
        week: params.week,
        dateLabel: params.dateLabel,
        type: 'stampa',
        source: 'Gazzetta Regionale',
        headline: `Tour in ${reg.label} per ${actor.leaderName}: piazze e comizi di ${actor.acronym}`,
        excerpt: `${actor.name} presidia i collegi di ${reg.label} (${reg.regionsList}), guadagnando terreno sul territorio.`,
        sentiment: 'neutro',
        partyColor: actor.color,
      });
    } else if (action === 'proposta_legge') {
      const bill = AI_BILL_TOPICS_BY_ORIENTATION[actor.orientation] ?? {
        title: 'Pacchetto Riforme Economiche',
        demo: 'lavoratori' as DemographicId,
      };
      const boost = round1(0.4 + Math.random() * 0.35);
      parties = applyElectoralShift(parties, actor.id, { [bill.demo]: boost });
      leaderApproval = adjustLeaderApproval(leaderApproval, actor.id, 2);

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
        allySatisfaction[targetAlly.id] = Math.round(clamp(allySatisfaction[targetAlly.id] - 3, 5, 100));
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
      // attacco_rivale
      const potentialTargets = parties.filter(
        (p) =>
          p.id !== actor.id &&
          p.id !== 'altri' &&
          (!actor.coalitionId || p.coalitionId !== actor.coalitionId)
      );
      const target =
        potentialTargets.length > 0
          ? isOpponentOfPlayer && Math.random() < 0.45
            ? player
            : potentialTargets[Math.floor(Math.random() * potentialTargets.length)]
          : player;

      const hit = round1(0.3 + Math.random() * 0.25);
      parties = applyElectoralShift(parties, target.id, {
        lavoratori: -hit,
        giovani: -round1(hit * 0.8),
      });
      parties = applyElectoralShift(parties, actor.id, { lavoratori: round1(hit * 0.65) });
      leaderApproval = adjustLeaderApproval(leaderApproval, target.id, -1);
      leaderApproval = adjustLeaderApproval(leaderApproval, actor.id, Math.random() < 0.65 ? 1 : -1);

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
            : `Duro botta e risposta in TV tra ${actor.acronym} e ${target.acronym} che agita i sondaggi della settimana.`,
        sentiment: target.id === player.id ? 'negativo' : 'neutro',
        partyColor: actor.color,
      });
    }
  }

  return { parties, leaderApproval, allySatisfaction, mediaItems, notifications };
}

/** Advances the game by 1 week */
export function advanceWeek(state: GameState): { nextState: GameState; notifications: string[] } {
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

  if (!state.currentCrisis.resolved) {
    updatedParties = applyElectoralShift(updatedParties, state.playerPartyId, {
      giovani: -0.5,
      lavoratori: -0.6,
      imprese: -0.5,
      pensionati: -0.5,
    });
    nextLeaderApproval = adjustLeaderApproval(nextLeaderApproval, state.playerPartyId, -3);
    notifications.push('Crisi della settimana ignorata: -0.5% di consenso e -3% gradimento leader.');
  }

  // Apply weekly consensus growth from open Regional Headquarters (+0.25% to +0.4% per HQ region)
  if (state.openHeadquarters.length > 0) {
    const hqRegionBoosts: Partial<Record<RegionId, number>> = {};
    for (const regId of state.openHeadquarters) {
      const meta = REGION_MAP_BY_ID[regId];
      if (!meta) continue;
      hqRegionBoosts[regId] = meta.hqWeeklyGrowth;
    }
    updatedParties = applyElectoralShift(
      updatedParties,
      state.playerPartyId,
      {},
      undefined,
      hqRegionBoosts
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
  notifications.push(...aiResult.notifications);

  // Effetto Gradimento Leader sulla crescita di ogni partito + lieve drift naturale
  for (const p of updatedParties) {
    if (p.id === 'altri') continue;
    // Un Comitato Promotore ancora allo 0.0% cresce solo tramite azioni dirette e raccolta firme
    if (p.id === state.playerPartyId && state.committee.active && p.nationalPoll < 0.1) continue;
    const approval = nextLeaderApproval[p.id] ?? 30;
    const leaderPull = round1(clamp((approval - 32) * 0.011, -0.22, 0.32));
    if (Math.abs(leaderPull) >= 0.04) {
      updatedParties = applyElectoralShift(updatedParties, p.id, {
        giovani: leaderPull,
        lavoratori: leaderPull,
        imprese: leaderPull,
        pensionati: leaderPull,
      });
    }
    if (p.id !== state.playerPartyId) {
      const smallDrift = (Math.random() - 0.5) * 0.35;
      const demoKey = DEMOGRAPHICS[Math.floor(Math.random() * DEMOGRAPHICS.length)].id;
      updatedParties = applyElectoralShift(updatedParties, p.id, { [demoKey]: smallDrift });
    }
  }

  // Dynamic 4-axis ideological alignment pull on demographics (only once party has poll presence)
  const playerPreDrift = updatedParties.find((p) => p.id === state.playerPartyId)!;
  if (playerPreDrift.nationalPoll >= 0.2) {
    const axisDemoDrift: Partial<Record<DemographicId, number>> = {
      imprese: round1((playerPreDrift.axis.economic / 100) * 0.14),
      lavoratori: round1((-playerPreDrift.axis.economic / 100) * 0.12),
      giovani: round1(
        (playerPreDrift.axis.society / 100) * 0.14 -
          Math.max(0, playerPreDrift.axis.institutions) * 0.002
      ),
      pensionati: round1((-playerPreDrift.axis.society / 100) * 0.1),
    };
    updatedParties = applyElectoralShift(updatedParties, state.playerPartyId, axisDemoDrift);
  }

  // Applica eventuali effetti annuali della Legge di Bilancio approvata
  const activeBudgetMod =
    state.budgetModifiers && nextWeek <= state.budgetModifiers.activeUntilWeek
      ? state.budgetModifiers
      : null;
  if (activeBudgetMod && activeBudgetMod.demoWeeklyBonus) {
    updatedParties = applyElectoralShift(
      updatedParties,
      state.playerPartyId,
      activeBudgetMod.demoWeeklyBonus
    );
  }

  // State indicators natural drift & macroeconomic consequences
  let nextIndicators: StateIndicators = {
    spread: Math.round(
      clamp(
        state.stateIndicators.spread +
          (state.stateIndicators.spread > 135 ? -3 : state.stateIndicators.spread < 105 ? 2 : 0) +
          (state.regimeStatus === 'regime_autoritario' ? 5 : 0) +
          (activeBudgetMod?.weeklySpreadDrift ?? 0),
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
          (activeBudgetMod?.weeklyEuDrift ?? 0),
        0,
        100
      )
    ),
    democraticHealth: Math.round(
      clamp(
        state.stateIndicators.democraticHealth +
          (state.institutionalFlags.fullPowers ? -2 : playerPreDrift.axis.institutions < -30 ? 1 : 0),
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
  const finances = calculateWeeklyPartyFinances(state, updatedParties);
  const weeklyIncome = finances.totalIncome;
  const weeklyCost = finances.totalExpenses + statePenaltyBudget;
  let nextBudget = state.budget + weeklyIncome - weeklyCost;

  if (nextBudget < 0) {
    nextBudget = 0;
    updatedParties = applyElectoralShift(updatedParties, state.playerPartyId, {
      imprese: -0.4,
      pensionati: -0.3,
    });
    notifications.push('Cassa esaurita: mancanza di fondi frena la visibilità del partito.');
  }

  let schismOccurred = state.schismOccurred;
  let updatedExecs: ExecutiveMember[] = state.executives.map((ex) => {
    const ambitionDrag = ex.ambition > 72 ? -2 : -1;
    const pollBonus = playerNow.nationalPoll >= playerNow.previousPoll ? 1 : -2;
    return {
      ...ex,
      loyalty: clamp(ex.loyalty + ambitionDrag + pollBonus, 8, 100),
      actedThisWeek: false,
    };
  });

  const rebelExec = updatedExecs.find((e) => e.loyalty <= 24);
  if (rebelExec) {
    schismOccurred = true;
    updatedParties = applyElectoralShift(updatedParties, state.playerPartyId, {
      giovani: -0.9,
      lavoratori: -1.1,
      imprese: -0.8,
      pensionati: -0.8,
    });
    const schismLoss = Math.min(55000, Math.max(8000, Math.round(nextBudget * 0.2)));
    nextBudget = Math.max(0, nextBudget - schismLoss);
    const replacement = REPLACEMENT_CANDIDATES[rebelExec.role][0];
    updatedExecs = updatedExecs.map((e) =>
      e.id === rebelExec.id
        ? {
            ...e,
            name: replacement.name,
            faction: replacement.faction,
            competence: replacement.competence,
            loyalty: replacement.loyalty,
            ambition: replacement.ambition,
            trait: replacement.trait,
          }
        : e
    );
    notifications.push(
      `SCISSIONE INTERNA! ${rebelExec.name} (${rebelExec.roleLabel}) lascia il partito: -1.0% consenso e -€${schismLoss.toLocaleString('it-IT')}.`
    );
    newMedia.push({
      id: uid('med'),
      week: nextWeek,
      dateLabel: dateInfo.shortLabel,
      type: 'stampa',
      source: 'Il Corriere Nazionale',
      headline: `Terremoto in ${playerNow.name}: scissione guidata da ${rebelExec.name}`,
      excerpt: `L’ex ${rebelExec.roleLabel} sbatte la porta accusando ${playerNow.leaderName} di gestione verticistica.`,
      sentiment: 'negativo',
      partyColor: playerNow.color,
    });
  }

  let updatedCommittee = { ...state.committee };
  let nextWeeklyOverhead = state.weeklyOverhead;
  if (updatedCommittee.active) {
    updatedCommittee.weeksRemaining = Math.max(0, updatedCommittee.weeksRemaining - 1);
    if (
      updatedCommittee.signatures >= updatedCommittee.targetSignatures &&
      updatedCommittee.committeesOpened >= updatedCommittee.targetCommittees
    ) {
      updatedCommittee.active = false;
      updatedCommittee.completed = true;
      nextWeeklyOverhead = Math.max(state.weeklyOverhead, 6500);
      updatedParties = applyElectoralShift(updatedParties, state.playerPartyId, {
        giovani: 1.1,
        lavoratori: 0.9,
        imprese: 0.7,
        pensionati: 0.6,
      });
      nextBudget += 45000;
      notifications.push(
        'Comitato Promotore completato! Partito iscritto al Registro Nazionale: +0,9% consenso, +€45.000 e accesso al 2×1000 IRPEF!'
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
      nextWeeklyOverhead = Math.max(state.weeklyOverhead, 5500);
      notifications.push(
        'Scadute le 4 settimane del Comitato Promotore: avvio comunque in salita con risorse ridotte.'
      );
    }
  }

  const snapPolls: Record<string, number> = {};
  for (const p of updatedParties) snapPolls[p.id] = p.nationalPoll;
  const pollHistory: PollSnapshot[] = [
    ...state.pollHistory,
    {
      weekIndex: nextWeek,
      label: dateInfo.shortLabel,
      polls: snapPolls,
    },
  ].slice(-20);

  const isCampaign =
    nextRegimeStatus !== 'regime_autoritario' && state.electionWeek - nextWeek <= 8;
  const nextCrisis = pickNextCrisis(nextWeek, state.crisisCooldowns, {
    isInGovernment: state.governmentRole !== 'opposizione',
    isCampaign,
  });
  const nextCrisisCooldowns = {
    ...state.crisisCooldowns,
    [nextCrisis.event.id]: nextWeek,
  };
  const usedCrisisIds = [...state.usedCrisisIds, nextCrisis.event.id].slice(-40);

  const latestPlayer = updatedParties.find((p) => p.id === state.playerPartyId)!;
  const delta = round1(latestPlayer.nationalPoll - latestPlayer.previousPoll);
  newMedia.push({
    id: uid('med'),
    week: nextWeek,
    dateLabel: dateInfo.shortLabel,
    type: 'stampa',
    source: NEWSPAPERS[nextWeek % NEWSPAPERS.length],
    headline: `Sondaggio settimanale: ${latestPlayer.acronym} al ${latestPlayer.nationalPoll.toFixed(1)}% (${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%)`,
    excerpt: `In apertura di ${dateInfo.fullLabel} esplode il dossier: ${nextCrisis.event.title}.`,
    sentiment: delta > 0 ? 'positivo' : delta < 0 ? 'negativo' : 'neutro',
    partyColor: latestPlayer.color,
  });

  // Aggiorna tenuta della maggioranza e soddisfazione alleati se il giocatore è Presidente del Consiglio
  let nextAllySatisfaction: Record<string, number> = { ...aiAllySatisfaction };
  if (state.isPrimeMinister && Object.keys(state.governmentMinistries).length > 0) {
    const liveSeats = calculateParliamentSeats(updatedParties, state.electoralLaw);
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
  if (rebelExec) {
    nextLeaderApproval = adjustLeaderApproval(nextLeaderApproval, state.playerPartyId, -5);
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

  let nextState: GameState = {
    ...state,
    week: nextWeek,
    budget: nextBudget,
    weeklyOverhead: nextWeeklyOverhead,
    politicalCapital: state.maxPoliticalCapital,
    parties: updatedParties,
    executives: updatedExecs,
    pollHistory,
    currentCrisis: nextCrisis,
    crisisCooldowns: nextCrisisCooldowns,
    usedCrisisIds,
    mediaFeed: [...newMedia, ...aiMediaItems, ...state.mediaFeed].slice(0, 40),
    actionsTakenThisWeek: [],
    committee: updatedCommittee,
    schismOccurred,
    stateIndicators: nextIndicators,
    regimeStatus: nextRegimeStatus,
    allySatisfaction: nextAllySatisfaction,
    leaderApproval: nextLeaderApproval,
    previousLeaderApproval,
  };

  if (
    nextRegimeStatus !== 'regime_autoritario' &&
    nextWeek >= state.electionWeek &&
    !state.election
  ) {
    nextState = triggerElectionNight(nextState);
    notifications.push('Urne chiuse! Inizia la Notte Elettorale in diretta dalla War Room.');
  } else {
    // Apri automaticamente la Legge di Bilancio se sei al Governo (ogni 24 settimane o a Novembre/Dicembre)
    const isInGovernment = state.isPrimeMinister || state.governmentRole !== 'opposizione';
    const isAutumnBudgetSeason =
      dateInfo.monthName === 'Novembre' || dateInfo.monthName === 'Dicembre';
    const weeksSinceBudget = nextWeek - state.lastBudgetWeek;
    const dueByCycle = state.lastBudgetWeek > 0 && weeksSinceBudget >= 24;
    const dueBySeason =
      isAutumnBudgetSeason &&
      (state.lastBudgetWeek === 0 ? nextWeek >= 5 : weeksSinceBudget >= 20);
    const dueInitialAfter24 = state.lastBudgetWeek === 0 && nextWeek >= 24;

    if (isInGovernment && !nextState.election && (dueByCycle || dueBySeason || dueInitialAfter24)) {
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
      playerApprovalDelta: 6,
      opponentApprovalDelta: -4,
      playerPollDelta: 1.1,
      opponentPollDelta: -0.6,
      relationDelta: -7,
    };
  }
  if (finalPlayerShare >= 52) {
    return {
      verdict: 'vittoria',
      verdictLabel: 'Vittoria di Misura',
      playerApprovalDelta: 3,
      opponentApprovalDelta: -2,
      playerPollDelta: 0.5,
      opponentPollDelta: -0.3,
      relationDelta: -4,
    };
  }
  if (finalPlayerShare >= 48) {
    return {
      verdict: 'pareggio',
      verdictLabel: 'Confronto Equilibrato',
      playerApprovalDelta: 1,
      opponentApprovalDelta: 1,
      playerPollDelta: 0.2,
      opponentPollDelta: 0.1,
      relationDelta: -2,
    };
  }
  if (finalPlayerShare >= 42) {
    return {
      verdict: 'sconfitta',
      verdictLabel: 'Duello Perso ai Punti',
      playerApprovalDelta: -3,
      opponentApprovalDelta: 3,
      playerPollDelta: -0.4,
      opponentPollDelta: 0.4,
      relationDelta: -5,
    };
  }
  return {
    verdict: 'sconfitta_netta',
    verdictLabel: 'Sconfitta Netta in Prima Serata',
    playerApprovalDelta: -6,
    opponentApprovalDelta: 5,
    playerPollDelta: -0.9,
    opponentPollDelta: 0.7,
    relationDelta: -8,
  };
}

/** Applies the outcome of a 3-round 1v1 TV Duel to GameState (consumes 1 PA, updates leader approval, polls, and publishes front-page headline) */
export function applyTvDuelResult(
  state: GameState,
  payload: TvDuelResultPayload
): { nextState: GameState; feedback: string; error?: string } {
  if (state.politicalCapital <= 0) {
    return {
      nextState: state,
      feedback: '',
      error: 'Nessun Punto Azione rimasto questa settimana.',
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

  const impact = computeTvDuelImpactPreview(payload.finalPlayerShare);
  const dateLabel = formatGameDate(state.week).shortLabel;
  const topicsStr = payload.topicLabels.slice(0, 2).join(' e ');

  // Apply national consensus shifts via demographic distribution
  let updatedParties = applyElectoralShift(state.parties, player.id, {
    giovani: impact.playerPollDelta,
    lavoratori: impact.playerPollDelta,
    imprese: impact.playerPollDelta * 0.9,
    pensionati: impact.playerPollDelta * 1.05,
  });

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
      politicalCapital: Math.max(0, state.politicalCapital - 1),
      parties: updatedParties,
      leaderApproval: nextLeaderApproval,
      actionsTakenThisWeek: [...state.actionsTakenThisWeek, `tv_duel_${opponent.id}`],
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


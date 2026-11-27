import {
  DemographicId,
  EuCampaignState,
  EuCampaignTopicId,
  EuCommissionState,
  EuCommissionVoteStance,
  EuCommissionerPortfolioTier,
  EuCommissionerProfileId,
  EuDirectiveTopicId,
  EuHeadCandidateArchetypeId,
  EuLeaderCandidacyMode,
  EuParliamentGroupId,
  EuSignatureCampaign,
  EuropeanConstituencyId,
  EuropeanUnionState,
  GameState,
  PartyState,
  PoliticalAxis,
  RegionId,
  SeatAllocation,
} from '../types/game';

/**
 * Calendario Elezioni Europee (cadenza reale quinquennale):
 * Week 1 = S1 Novembre 2026 (4 settimane/mese, 48 settimane/anno).
 * Week 126 = S2 Giugno 2029 (prima tornata europea in gioco).
 * Ogni 5 anni = +240 settimane (S2 Giugno 2034 = 366, S2 Giugno 2039 = 606, ...).
 */
export const FIRST_EUROPEAN_ELECTION_WEEK = 126;
export const EUROPEAN_ELECTION_CYCLE_WEEKS = 240;

/** Totale seggi italiani al Parlamento Europeo (legislatura 2024–2029 e successive) */
export const EU_TOTAL_SEATS = 76;

/** Soglia di sbarramento nazionale ufficiale per le Elezioni Europee in Italia */
export const EU_THRESHOLD_PCT = 4.0;

/** Firme richieste per presentare una lista autonoma alle Europee se non esenti */
export const EU_SIGNATURE_TARGET = 150000;

/** Finestra temporale (settimane prima del voto) per raccolta firme & cartelli */
export const EU_SIGNATURE_WINDOW_WEEKS = 16;

/** Finestra temporale (settimane prima del voto) per la Campagna Elettorale Europea attiva */
export const EU_CAMPAIGN_WINDOW_WEEKS = 8;

/** Costi reali di bilancio (sistema a budget reale senza Punti Azione) */
export const EU_SIGNATURE_DRIVE_COST = 4500;
export const EU_CARTEL_NEGOTIATION_COST = 5000;
export const EU_CONSTITUENCY_RALLY_COST = 8500;
export const EU_ABROAD_STUDENTS_EVENT_COST = 9500;

export interface EuropeanConstituencyMeta {
  id: EuropeanConstituencyId;
  name: string;
  shortName: string;
  seats: number;
  regions: RegionId[];
  regionsLabel: string;
  electorateWeight: number;
  /** Fattore geografico realistico di affluenza europea rispetto alla media nazionale */
  turnoutOffset: number;
}

/**
 * Le 5 Circoscrizioni Elettorali Ufficiali italiane (Eligendo — DPR 10 aprile 2024):
 * Totale: 20 + 15 + 15 + 18 + 8 = 76 seggi.
 */
export const EUROPEAN_CONSTITUENCIES: EuropeanConstituencyMeta[] = [
  {
    id: 'nord_ovest',
    name: 'I — Nord-Ovest',
    shortName: 'Nord-Ovest',
    seats: 20,
    regions: ['piemonte', 'valle_daosta', 'liguria', 'lombardia'],
    regionsLabel: 'Piemonte, Valle d’Aosta, Liguria, Lombardia',
    electorateWeight: 0.269,
    turnoutOffset: 4.4,
  },
  {
    id: 'nord_est',
    name: 'II — Nord-Est',
    shortName: 'Nord-Est',
    seats: 15,
    regions: ['veneto', 'trentino_aa', 'friuli_vg', 'emilia_romagna'],
    regionsLabel: 'Veneto, Trentino-Alto Adige, Friuli-Venezia Giulia, Emilia-Romagna',
    electorateWeight: 0.195,
    turnoutOffset: 3.6,
  },
  {
    id: 'centro',
    name: 'III — Centro',
    shortName: 'Centro',
    seats: 15,
    regions: ['toscana', 'umbria', 'marche', 'lazio'],
    regionsLabel: 'Toscana, Umbria, Marche, Lazio',
    electorateWeight: 0.199,
    turnoutOffset: 1.8,
  },
  {
    id: 'sud',
    name: 'IV — Sud',
    shortName: 'Sud',
    seats: 18,
    regions: ['abruzzo', 'molise', 'campania', 'puglia', 'basilicata', 'calabria'],
    regionsLabel: 'Abruzzo, Molise, Campania, Puglia, Basilicata, Calabria',
    electorateWeight: 0.228,
    turnoutOffset: -4.8,
  },
  {
    id: 'isole',
    name: 'V — Isole',
    shortName: 'Isole',
    seats: 8,
    regions: ['sicilia', 'sardegna'],
    regionsLabel: 'Sicilia, Sardegna',
    electorateWeight: 0.109,
    turnoutOffset: -7.2,
  },
];

export const EUROPEAN_CONSTITUENCY_BY_ID: Record<
  EuropeanConstituencyId,
  EuropeanConstituencyMeta
> = EUROPEAN_CONSTITUENCIES.reduce((acc, c) => {
  acc[c.id] = c;
  return acc;
}, {} as Record<EuropeanConstituencyId, EuropeanConstituencyMeta>);

export interface EuParliamentGroupMeta {
  id: EuParliamentGroupId;
  acronym: string;
  name: string;
  color: string;
  description: string;
  ideologyTag: string;
  inMajorityCore: boolean;
  brusselsWeight: 'Altissimo' | 'Alto' | 'Medio' | 'Opposizione' | 'Marginale';
  euCredibilityBase: number;
  targetAxis: { economic: number; society: number; europe: number };
}

export const EU_PARLIAMENT_GROUPS: Record<EuParliamentGroupId, EuParliamentGroupMeta> = {
  epp: {
    id: 'epp',
    acronym: 'PPE',
    name: 'Partito Popolare Europeo',
    color: '#3B82F6',
    description: 'Famiglia cristiano-democratica e moderata, pilastro della maggioranza a Strasburgo.',
    ideologyTag: 'Centro-destra europeista',
    inMajorityCore: true,
    brusselsWeight: 'Altissimo',
    euCredibilityBase: 6,
    targetAxis: { economic: 25, society: -10, europe: 55 },
  },
  sd: {
    id: 'sd',
    acronym: 'S&D',
    name: 'Socialisti & Democratici',
    color: '#EF4444',
    description: 'Centro-sinistra europeo, welfare, coesione sociale e diritti del lavoro.',
    ideologyTag: 'Centro-sinistra europeista',
    inMajorityCore: true,
    brusselsWeight: 'Altissimo',
    euCredibilityBase: 5,
    targetAxis: { economic: -35, society: 40, europe: 50 },
  },
  pfe: {
    id: 'pfe',
    acronym: 'PfE',
    name: 'Patrioti per l’Europa',
    color: '#0EA5E9',
    description: 'Destra sovranista e identitaria, critica del Green Deal e dei vincoli di Bruxelles.',
    ideologyTag: 'Destra sovranista',
    inMajorityCore: false,
    brusselsWeight: 'Opposizione',
    euCredibilityBase: -4,
    targetAxis: { economic: 15, society: -65, europe: -55 },
  },
  ecr: {
    id: 'ecr',
    acronym: 'ECR',
    name: 'Conservatori e Riformisti Europei',
    color: '#1D4ED8',
    description: 'Destra conservatrice, sovranità nazionale, atlantismo e difesa delle filiere.',
    ideologyTag: 'Conservatori riformisti',
    inMajorityCore: false,
    brusselsWeight: 'Medio',
    euCredibilityBase: 1,
    targetAxis: { economic: 35, society: -45, europe: -10 },
  },
  renew: {
    id: 'renew',
    acronym: 'Renew',
    name: 'Renew Europe',
    color: '#F59E0B',
    description: 'Liberali, riformisti e federalisti per il mercato unico e gli Stati Uniti d’Europa.',
    ideologyTag: 'Liberali & Federalisti',
    inMajorityCore: true,
    brusselsWeight: 'Alto',
    euCredibilityBase: 5,
    targetAxis: { economic: 45, society: 35, europe: 75 },
  },
  greens_efa: {
    id: 'greens_efa',
    acronym: 'Verdi/ALE',
    name: 'Verdi / Alleanza Libera Europea',
    color: '#22C55E',
    description: 'Ecologismo, clima, diritti civili e transizione energetica accelerata.',
    ideologyTag: 'Ecologisti & Diritti',
    inMajorityCore: true,
    brusselsWeight: 'Medio',
    euCredibilityBase: 2,
    targetAxis: { economic: -35, society: 70, europe: 45 },
  },
  the_left: {
    id: 'the_left',
    acronym: 'The Left',
    name: 'La Sinistra al Parlamento Europeo',
    color: '#DC2626',
    description: 'Sinistra sociale, pacifismo, opposizione all’austerità e difesa dei redditi bassi.',
    ideologyTag: 'Sinistra radicale & sociale',
    inMajorityCore: false,
    brusselsWeight: 'Opposizione',
    euCredibilityBase: -2,
    targetAxis: { economic: -70, society: 55, europe: -15 },
  },
  esn: {
    id: 'esn',
    acronym: 'ESN',
    name: 'Europa delle Nazioni Sovrane',
    color: '#475569',
    description: 'Destra radicale euroscettica per il recupero integrale delle competenze nazionali.',
    ideologyTag: 'Euroscettici radicali',
    inMajorityCore: false,
    brusselsWeight: 'Marginale',
    euCredibilityBase: -6,
    targetAxis: { economic: 10, society: -85, europe: -85 },
  },
  ni: {
    id: 'ni',
    acronym: 'NI',
    name: 'Non Iscritti',
    color: '#94A3B8',
    description: 'Eurodeputati indipendenti fuori dai gruppi parlamentari strutturati.',
    ideologyTag: 'Indipendenti / Fuori gruppo',
    inMajorityCore: false,
    brusselsWeight: 'Marginale',
    euCredibilityBase: -3,
    targetAxis: { economic: 0, society: 0, europe: -20 },
  },
};

export const EU_PARLIAMENT_GROUP_ORDER: EuParliamentGroupId[] = [
  'epp',
  'sd',
  'pfe',
  'ecr',
  'renew',
  'greens_efa',
  'the_left',
  'esn',
  'ni',
];

/**
 * Eurodeputati italiani realistici in carica (legislatura europea 2024–2029, totale 76 seggi):
 * FdI 24, PD 21, FI 8, M5S 8, Lega 7, AVS 6, FN 1, SVP 1 = 76.
 */
export const DEFAULT_INITIAL_EU_SEATS_2024: Record<string, number> = {
  fdi: 24,
  pd: 21,
  fi: 8,
  m5s: 8,
  lega: 7,
  avs: 6,
  fn: 1,
  svp: 1,
};

export const DEFAULT_INITIAL_EU_SEATS_BY_CONSTITUENCY: Record<
  string,
  Record<EuropeanConstituencyId, number>
> = {
  fdi: { nord_ovest: 7, nord_est: 5, centro: 5, sud: 5, isole: 2 },
  pd: { nord_ovest: 5, nord_est: 4, centro: 5, sud: 5, isole: 2 },
  fi: { nord_ovest: 2, nord_est: 1, centro: 1, sud: 2, isole: 2 },
  m5s: { nord_ovest: 1, nord_est: 1, centro: 1, sud: 4, isole: 1 },
  lega: { nord_ovest: 3, nord_est: 2, centro: 1, sud: 1, isole: 0 },
  avs: { nord_ovest: 2, nord_est: 1, centro: 1, sud: 1, isole: 1 },
  fn: { nord_ovest: 0, nord_est: 0, centro: 1, sud: 0, isole: 0 },
  svp: { nord_ovest: 0, nord_est: 1, centro: 0, sud: 0, isole: 0 },
};

export const DEFAULT_PARTY_EU_GROUPS: Record<string, EuParliamentGroupId> = {
  fdi: 'ecr',
  pd: 'sd',
  fi: 'epp',
  noi_moderati: 'epp',
  svp: 'epp',
  alternativa_popolare: 'epp',
  dc: 'epp',
  m5s: 'the_left',
  prc: 'the_left',
  potere_al_popolo: 'the_left',
  pci: 'the_left',
  ptd: 'ni',
  lega: 'pfe',
  fn: 'esn',
  indipendenza: 'esn',
  liberta_italexit: 'esn',
  dsp: 'ni',
  avs: 'greens_efa',
  possibile: 'greens_efa',
  az: 'renew',
  iv: 'renew',
  piu_europa: 'renew',
  orizzonti_liberali: 'renew',
  psi: 'sd',
  sud_chiama_nord: 'ni',
};

export function inferPartyEuGroup(party: Pick<PartyState, 'id' | 'orientation' | 'axis'>): EuParliamentGroupId {
  if (DEFAULT_PARTY_EU_GROUPS[party.id]) {
    return DEFAULT_PARTY_EU_GROUPS[party.id];
  }
  const { economic, society, europe } = party.axis;
  if (europe >= 55 && economic >= 15) return 'renew';
  if (party.orientation === 'moderato' || (europe >= 35 && society <= 10 && economic >= 10)) return 'epp';
  if (party.orientation === 'progressista' && society >= 55) return 'greens_efa';
  if (party.orientation === 'socialista' || (economic <= -25 && europe >= 10)) return 'sd';
  if (economic <= -35 && europe < 10) return 'the_left';
  if (europe <= -45) return 'esn';
  if (europe <= -15 && society <= -20) return 'pfe';
  if (party.orientation === 'conservatore' || society <= -25) return 'ecr';
  return 'ni';
}

export interface EuHeadCandidateArchetypeMeta {
  id: EuHeadCandidateArchetypeId;
  label: string;
  shortLabel: string;
  description: string;
  pros: string;
  cons: string;
  voteBonusPct: number;
  turnoutRetentionBonus: number;
  euCredibilityDelta: number;
}

export const EU_HEAD_CANDIDATE_ARCHETYPES: EuHeadCandidateArchetypeMeta[] = [
  {
    id: 'esperto_ue',
    label: 'Esperto UE / Tecnico',
    shortLabel: 'Esperto UE',
    description: 'Ex commissario, diplomatico o docente di diritto europeo dal profilo autorevole.',
    pros: '+Credibilità istituzionale e rapporti UE · +0,35% voto qualificato',
    cons: 'Minore presa emotiva nei talk show e piazze popolari',
    voteBonusPct: 0.35,
    turnoutRetentionBonus: 0.02,
    euCredibilityDelta: 2,
  },
  {
    id: 'volto_tv',
    label: 'Volto TV / Mediatico',
    shortLabel: 'Volto TV',
    description: 'Giornalista, opinionista o personalità celebre per sfondare in prima serata.',
    pros: 'Massimo traino mediatico (+0,70% nella circoscrizione)',
    cons: 'Rischio astensione della base tradizionale e lieve attrito istituzionale (-1 UE)',
    voteBonusPct: 0.7,
    turnoutRetentionBonus: -0.02,
    euCredibilityDelta: -1,
  },
  {
    id: 'radicato_locale',
    label: 'Radicato Locale / Sindaco',
    shortLabel: 'Radicato Locale',
    description: 'Amministratore di lunga esperienza capace di portare alle urne le preferenze sul territorio.',
    pros: 'Alta tenuta con affluenza europea bassa (+6% tenuta seggi) · +0,45% voto locale',
    cons: 'Impatto nazionale più contenuto fuori dalla circoscrizione',
    voteBonusPct: 0.45,
    turnoutRetentionBonus: 0.06,
    euCredibilityDelta: 0,
  },
];

export interface EuLeaderCandidacyOptionMeta {
  id: EuLeaderCandidacyMode;
  label: string;
  shortLabel: string;
  pullSummary: string;
  riskSummary: string;
}

export const EU_LEADER_CANDIDACY_OPTIONS: EuLeaderCandidacyOptionMeta[] = [
  {
    id: 'none',
    label: 'Non candidare il Leader',
    shortLabel: 'Nessuna candidatura',
    pullSummary: 'Nessun effetto traino extra sulla scheda, lista affidata ai soli capilista.',
    riskSummary: 'Zero polemiche post-voto e massima coerenza istituzionale.',
  },
  {
    id: 'single',
    label: 'Candidatura in 1 Circoscrizione',
    shortLabel: '1 Circoscrizione',
    pullSummary: 'Forte effetto traino mirato (+1,1% nella circoscrizione scelta).',
    riskSummary: 'Critiche moderate (-2 gradimento) se dopo il voto rinunci al seggio per restare in Italia.',
  },
  {
    id: 'all_five',
    label: 'Candidatura in tutte e 5 le Circoscrizioni',
    shortLabel: 'Tutte e 5 le Circoscrizioni',
    pullSummary: 'Massimo effetto traino nazionale (+0,85% in ciascuna delle 5 circoscrizioni).',
    riskSummary: 'Forte tempesta mediatica ("candidatura finta", -5 gradimento e -0,4% consenso) se poi resti in Italia.',
  },
];

export interface EuCampaignTopicMeta {
  id: EuCampaignTopicId;
  title: string;
  shortTitle: string;
  cost: number;
  summary: string;
  targetDemo: DemographicId;
  targetAxis: Partial<PoliticalAxis>;
  euRelationsDelta: number;
  headline: string;
}

export const EU_CAMPAIGN_TOPICS: EuCampaignTopicMeta[] = [
  {
    id: 'patto_stabilita',
    title: 'Economia & Patto di Stabilità UE',
    shortTitle: 'Patto Stabilità',
    cost: 14000,
    summary: 'Campagna su debito comune, flessibilità fiscale, investimenti PNRR e competitività industriale.',
    targetDemo: 'imprese',
    targetAxis: { economic: 25, europe: 30 },
    euRelationsDelta: 2,
    headline: 'Campagna UE su conti pubblici e investimenti: sfida aperta sul Patto di Stabilità',
  },
  {
    id: 'green_deal',
    title: 'Green Deal, Auto Elettriche & Case Green',
    shortTitle: 'Green Deal',
    cost: 13500,
    summary: 'Offensiva mediatica sulla transizione ecologica europea: accelerazione climatica o pragmatismo produttivo.',
    targetDemo: 'giovani',
    targetAxis: { society: 30, europe: 20 },
    euRelationsDelta: 1,
    headline: 'Scontro europeo sul Green Deal: la campagna polarizza giovani e categorie produttive',
  },
  {
    id: 'immigrazione',
    title: 'Immigrazione, Frontiere & Patto Asilo UE',
    shortTitle: 'Immigrazione UE',
    cost: 15000,
    summary: 'Focus su Frontex, ridistribuzione obbligatoria nei 27 Stati e accordi nel Mediterraneo.',
    targetDemo: 'pensionati',
    targetAxis: { society: -40, europe: -20 },
    euRelationsDelta: -1,
    headline: 'Dossier Frontiere al centro delle Europee: pressing sull’Unione per una svolta comune',
  },
  {
    id: 'agricoltura',
    title: 'Agricoltura, PAC & Difesa del Made in Italy',
    shortTitle: 'Agricoltura & PAC',
    cost: 12000,
    summary: 'Tutela degli agricoltori, fondi PAC, etichettatura d’origine e filiere agroalimentari regionali.',
    targetDemo: 'lavoratori',
    targetAxis: { economic: -10, europe: -10 },
    euRelationsDelta: 0,
    headline: 'Difesa della PAC e delle filiere italiane: forte eco nelle regioni agricole',
  },
  {
    id: 'difesa_comune',
    title: 'Difesa Comune Europea & Sicurezza Strategica',
    shortTitle: 'Difesa Comune',
    cost: 15500,
    summary: 'Posizionamento su autonomia strategica UE, industria della difesa, NATO e pace nel Mediterraneo.',
    targetDemo: 'imprese',
    targetAxis: { europe: 55, institutions: -30 },
    euRelationsDelta: 3,
    headline: 'Sicurezza e Difesa Comune: il dibattito geopolitico accende la corsa verso Strasburgo',
  },
];

/** Calcola la prossima settimana utile delle Elezioni Europee (Giugno 2029, poi ogni 5 anni = +240 sett.) */
export function getNextEuropeanElectionWeek(currentWeek: number): number {
  let target = FIRST_EUROPEAN_ELECTION_WEEK;
  while (target <= currentWeek) {
    target += EUROPEAN_ELECTION_CYCLE_WEEKS;
  }
  return target;
}

export function createZeroConstituencyRecord(): Record<EuropeanConstituencyId, number> {
  return {
    nord_ovest: 0,
    nord_est: 0,
    centro: 0,
    sud: 0,
    isole: 0,
  };
}

export function createDefaultEuCampaignState(): EuCampaignState {
  return {
    headCandidates: {
      nord_ovest: 'radicato_locale',
      nord_est: 'radicato_locale',
      centro: 'esperto_ue',
      sud: 'radicato_locale',
      isole: 'radicato_locale',
    },
    leaderCandidacyMode: 'none',
    leaderCandidacyConstituency: null,
    constituencyBoosts: createZeroConstituencyRecord(),
    topicCampaignsRun: [],
    abroadStudentsEventDone: false,
    actionsThisWeek: 0,
  };
}

export function createDefaultEuSignatureCampaign(params: {
  currentWeek: number;
  euElectionWeek: number;
  playerNationalSeats: number;
  playerEuSeats: number;
  cartelGrantsExemption?: boolean;
}): EuSignatureCampaign {
  const { currentWeek, euElectionWeek, playerNationalSeats, playerEuSeats, cartelGrantsExemption } =
    params;
  const exempt = playerNationalSeats > 0 || playerEuSeats > 0 || Boolean(cartelGrantsExemption);
  const exemptReason =
    playerNationalSeats > 0
      ? 'Esente: partito già rappresentato in Parlamento nazionale (Camera/Senato).'
      : playerEuSeats > 0
        ? `Esente: partito già rappresentato al Parlamento Europeo (${playerEuSeats} eurodeputat${playerEuSeats === 1 ? 'o' : 'i'}).`
        : cartelGrantsExemption
          ? 'Esente grazie al Cartello Elettorale con una forza già presente in Parlamento.'
          : undefined;
  const weeksLeft = euElectionWeek - currentWeek;
  return {
    active: weeksLeft <= EU_SIGNATURE_WINDOW_WEEKS && weeksLeft > 0,
    targetSignatures: EU_SIGNATURE_TARGET,
    collectedSignatures: exempt ? EU_SIGNATURE_TARGET : 0,
    byConstituency: createZeroConstituencyRecord(),
    deadlineWeek: Math.max(currentWeek + 1, euElectionWeek - 1),
    exempt,
    exemptReason,
    excludedFromBallot: false,
    excludedStance: null,
    excludedSupportedPartyId: null,
    campaignsThisWeek: 0,
  };
}

export function buildInitialEuropeanState(params: {
  parties: PartyState[];
  playerPartyId: string;
  currentWeek: number;
  legislatureSeats?: SeatAllocation[];
}): EuropeanUnionState {
  const { parties, playerPartyId, currentWeek, legislatureSeats } = params;
  const nextElectionWeek = getNextEuropeanElectionWeek(currentWeek);

  const euSeats: Record<string, number> = {};
  const euSeatsByConstituency: Record<string, Record<EuropeanConstituencyId, number>> = {};
  const partyEuGroups: Record<string, EuParliamentGroupId> = {};

  for (const p of parties) {
    if (p.id === 'altri') continue;
    const baseSeats = DEFAULT_INITIAL_EU_SEATS_2024[p.id] ?? 0;
    euSeats[p.id] = baseSeats;
    euSeatsByConstituency[p.id] = DEFAULT_INITIAL_EU_SEATS_BY_CONSTITUENCY[p.id]
      ? { ...DEFAULT_INITIAL_EU_SEATS_BY_CONSTITUENCY[p.id] }
      : createZeroConstituencyRecord();
    partyEuGroups[p.id] = inferPartyEuGroup(p);
  }

  const playerSeatRow = legislatureSeats?.find((s) => s.partyId === playerPartyId);
  const playerNatSeats = (playerSeatRow?.camera ?? 0) + (playerSeatRow?.senato ?? 0);
  const playerEuSeats = euSeats[playerPartyId] ?? 0;

  const commission: EuCommissionState = {
    termYear: 2024,
    presidentName: 'Ursula von der Leyen',
    italianCommissionerName: 'Raffaele Fitto',
    italianCommissionerPartyId: 'fdi',
    italianCommissionerPortfolio: 'Coesione e Riforme (Vicepresidenza Esecutiva)',
    italianCommissionerTier: 'peso',
    italianCommissionerProfile: 'fedelissimo',
    playerVote: null,
    inEuropeanMajority: ['epp', 'sd', 'renew', 'greens_efa'].includes(
      partyEuGroups[playerPartyId] ?? 'ni'
    ),
  };

  return {
    nextElectionWeek,
    euSeats,
    euSeatsByConstituency,
    partyEuGroups,
    groupRelations: 65,
    commission,
    signatureCampaign: createDefaultEuSignatureCampaign({
      currentWeek,
      euElectionWeek: nextElectionWeek,
      playerNationalSeats: playerNatSeats,
      playerEuSeats,
    }),
    cartel: null,
    campaign: createDefaultEuCampaignState(),
    activeElection: null,
    postElectionFlow: null,
    activeDirective: null,
    directiveHistory: [],
    lastDirectiveWeek: 0,
    electionHistory: [],
  };
}

// =============================================================================
// PARTE 2: GRUPPI UE, COMMISSIONE, COMMISSARIO ITALIANO & DIRETTIVE DA BRUXELLES
// =============================================================================

export interface EuGroupCompatibilityResult {
  score: number;
  label: 'Naturale' | 'Compatibile' | 'Forzata' | 'Incompatibile';
  euRelationsDelta: number;
  basePollDelta: number;
  loyaltyDelta: number;
  baseReaction: string;
}

export function computeEuGroupCompatibility(
  party: Pick<PartyState, 'id' | 'orientation' | 'axis'>,
  groupId: EuParliamentGroupId
): EuGroupCompatibilityResult {
  const grp = EU_PARLIAMENT_GROUPS[groupId];
  const naturalGroup = inferPartyEuGroup(party);

  if (groupId === 'ni') {
    return {
      score: 52,
      label: 'Compatibile',
      euRelationsDelta: -3,
      basePollDelta: 0.0,
      loyaltyDelta: -1,
      baseReaction: 'Autonomia totale a Strasburgo, ma scarso peso nelle commissioni e zero relatori chiave.',
    };
  }

  const econDist = Math.abs(party.axis.economic - grp.targetAxis.economic);
  const socDist = Math.abs(party.axis.society - grp.targetAxis.society);
  const eurDist = Math.abs(party.axis.europe - grp.targetAxis.europe);
  const weightedDist = econDist * 0.3 + socDist * 0.35 + eurDist * 0.35;
  let score = Math.round(Math.max(5, Math.min(99, 100 - weightedDist * 0.62)));
  if (groupId === naturalGroup) {
    score = Math.max(score, 84);
  }

  if (score >= 76) {
    return {
      score,
      label: 'Naturale',
      euRelationsDelta: grp.euCredibilityBase,
      basePollDelta: 0.25,
      loyaltyDelta: 4,
      baseReaction: 'Adesione pienamente coerente con la tua identità: entusiasma la base e compatta i dirigenti.',
    };
  }
  if (score >= 54) {
    return {
      score,
      label: 'Compatibile',
      euRelationsDelta: grp.euCredibilityBase,
      basePollDelta: 0.05,
      loyaltyDelta: 1,
      baseReaction: 'Scelta pragmatica: la base accetta il compromesso in cambio del peso nel Gruppo.',
    };
  }
  if (score >= 34) {
    return {
      score,
      label: 'Forzata',
      euRelationsDelta: Math.round(grp.euCredibilityBase * 0.5),
      basePollDelta: -0.35,
      loyaltyDelta: -5,
      baseReaction: 'Forte attrito ideologico: parte dell’elettorato e dei quadri accusa il partito di trasformismo.',
    };
  }
  return {
    score,
    label: 'Incompatibile',
    euRelationsDelta: Math.min(-2, grp.euCredibilityBase - 3),
    basePollDelta: -0.7,
    loyaltyDelta: -10,
    baseReaction: 'Cortocircuito politico: la base insorge contro un’alleanza europea vista come tradimento identitario.',
  };
}

export interface EuCommissionerProfileMeta {
  id: EuCommissionerProfileId;
  label: string;
  shortLabel: string;
  defaultCandidateName: string;
  summary: string;
  pros: string;
  cons: string;
  basePassChance: number;
  targetTier: EuCommissionerPortfolioTier;
}

export const EU_COMMISSIONER_PROFILES: EuCommissionerProfileMeta[] = [
  {
    id: 'tecnico',
    label: 'Tecnico / Diplomatico Autorevole',
    shortLabel: 'Tecnico / Diplomatico',
    defaultCandidateName: 'Amb. Lorenzo Visconti',
    summary:
      'Profilo super partes con lunga carriera tra Banca d’Italia, Farnesina e istituzioni comunitarie.',
    pros: 'Audizione quasi certa a Strasburgo · Portafoglio di Peso (Economia, Industria o Coesione) · Spread più basso e ottimi rapporti UE',
    cons: 'Lieve malcontento dell’ala più politica e partitica (-3 lealtà dirigenti)',
    basePassChance: 94,
    targetTier: 'peso',
  },
  {
    id: 'fedelissimo',
    label: 'Fedelissimo / Politico di Peso',
    shortLabel: 'Fedelissimo di Partito',
    defaultCandidateName: 'On. Matteo Rinaldi',
    summary:
      'Esponente di primo piano della segreteria nazionale, uomo di fiducia assoluta del Leader.',
    pros: 'Compatta fortemente il partito (+6 lealtà interna) e garantisce linea diretta politica con Palazzo Chigi',
    cons: 'Audizione durissima al Parlamento Europeo: rischio bocciatura (dovrai indicare un 2° nome) o declassamento a portafoglio minore',
    basePassChance: 54,
    targetTier: 'peso',
  },
  {
    id: 'compromesso',
    label: 'Candidato di Compromesso di Coalizione',
    shortLabel: 'Compromesso Coalizione',
    defaultCandidateName: 'Sen. Elena Marchetti',
    summary:
      'Figura di equilibrio concordata con tutti gli alleati di Governo e gradita ai gruppi moderati europei.',
    pros: 'Placa gli alleati di Governo (+6 soddisfazione coalizione) · Audizione lineare · Portafoglio Medio (Trasporti, Energia o Agricoltura)',
    cons: 'Minor ritorno di immagine personale per il tuo partito rispetto a un fedelissimo o a un super-tecnico',
    basePassChance: 88,
    targetTier: 'medio',
  },
];

export const EU_COMMISSIONER_PORTFOLIOS: Record<EuCommissionerPortfolioTier, string[]> = {
  peso: [
    'Economia, Bilancio e Mercato Unico',
    'Industria, Competitività e PNRR',
    'Coesione, Riforme e Fondi Strutturali',
  ],
  medio: [
    'Trasporti, Infrastrutture e Corridoi UE',
    'Energia, Clima e Reti Strategiche',
    'Agricoltura, PAC e Sovranità Alimentare',
  ],
  minore: [
    'Pesca, Affari Marittimi e Turismo',
    'Cultura, Multilinguismo e Gioventù',
    'Ricerca Applicata e Cooperazione Regionale',
  ],
};

const EU_COMMISSION_PRESIDENTS = [
  'Manfred Weber',
  'Roberta Metsola',
  'Kyriakos Mitsotakis',
  'António Costa',
  'Ursula von der Leyen',
];

export function pickCommissionPresidentName(year: number): string {
  const idx = Math.abs(Math.floor((year - 2029) / 5)) % EU_COMMISSION_PRESIDENTS.length;
  return EU_COMMISSION_PRESIDENTS[idx] ?? 'Roberta Metsola';
}

export interface EuDirectiveTemplate {
  id: string;
  topic: EuDirectiveTopicId;
  title: string;
  subtitle: string;
  summary: string;
  /** Orientamento tipico dei gruppi della maggioranza UE ('epp','sd','renew','greens_efa') */
  majorityLine: EuCommissionVoteStance;
  /** Orientamento tipico dei gruppi sovranisti/conservatori ('ecr','pfe','esn') */
  sovereignistLine: EuCommissionVoteStance;
  /** Orientamento tipico di 'the_left' */
  leftLine: EuCommissionVoteStance;
  proYes: string;
  conYes: string;
  proNo: string;
  conNo: string;
  yesDemo: Partial<Record<DemographicId, number>>;
  noDemo: Partial<Record<DemographicId, number>>;
  yesSpread: number;
  noSpread: number;
  yesEuRelations: number;
  noEuRelations: number;
}

export const EU_DIRECTIVES_POOL: EuDirectiveTemplate[] = [
  {
    id: 'eu_dir_patto_stabilita_1',
    topic: 'patto_stabilita',
    title: 'Riforma del Patto di Stabilità & Percorso di Rientro del Debito',
    subtitle: 'Dossier Economico · Strasburgo / Ecofin',
    summary:
      'Il Parlamento Europeo vota i vincoli quadriennali di riduzione del deficit per i Paesi ad alto debito, con clausole di salvaguardia per gli investimenti verdi e digitali.',
    majorityLine: 'favorevole',
    sovereignistLine: 'contrario',
    leftLine: 'contrario',
    proYes: 'Calma i mercati finanziari, abbassa lo Spread BTP e rafforza la credibilità a Bruxelles.',
    conYes: 'Accusato di austerità dall’elettorato più sociale e dai lavoratori.',
    proNo: 'Forte difesa della spesa nazionale: premia lavoratori, pensionati e base anti-austerità.',
    conNo: 'Tensione con la Commissione Europea e rialzo immediato dello Spread.',
    yesDemo: { imprese: 0.45, lavoratori: -0.35, pensionati: -0.25, giovani: 0.1 },
    noDemo: { imprese: -0.3, lavoratori: 0.45, pensionati: 0.35, giovani: 0.05 },
    yesSpread: -8,
    noSpread: 11,
    yesEuRelations: 5,
    noEuRelations: -6,
  },
  {
    id: 'eu_dir_case_green_1',
    topic: 'case_green',
    title: 'Direttiva Case Green & Riqualificazione Energetica Obbligatoria',
    subtitle: 'Dossier Transizione Ecologica · Green Deal',
    summary:
      'Nuove scadenze europee per ridurre i consumi degli edifici residenziali entro il 2035 con incentivi comuni ma obblighi stringenti sui patrimoni immobiliari.',
    majorityLine: 'favorevole',
    sovereignistLine: 'contrario',
    leftLine: 'favorevole',
    proYes: 'Consenso tra giovani ed elettorato ambientalista, ottima accoglienza a Bruxelles.',
    conYes: 'Proteste di proprietari di casa, pensionati e piccole imprese edili.',
    proNo: 'Forte spinta tra proprietari, imprese e pensionati contrari a costi obbligatori.',
    conNo: 'Frizioni con la maggioranza europea e calo tra i giovani ambientalisti.',
    yesDemo: { giovani: 0.55, imprese: -0.35, pensionati: -0.4, lavoratori: -0.1 },
    noDemo: { giovani: -0.35, imprese: 0.4, pensionati: 0.45, lavoratori: 0.15 },
    yesSpread: -3,
    noSpread: 4,
    yesEuRelations: 4,
    noEuRelations: -4,
  },
  {
    id: 'eu_dir_dazi_agricoltura_1',
    topic: 'dazi_agricoltura',
    title: 'Revisione PAC, Dazi Agroalimentari & Accordo Commerciale Mercosur',
    subtitle: 'Dossier Agricoltura & Commercio Estero',
    summary:
      'Bruxelles propone l’apertura commerciale con il Sud America in cambio di compensazioni per l’industria europea, scatenando le proteste dei trattori e delle filiere italiane.',
    majorityLine: 'favorevole',
    sovereignistLine: 'contrario',
    leftLine: 'contrario',
    proYes: 'Favorisce l’export industriale e il mercato unico, apprezzato da Bruxelles.',
    conYes: 'Rivolta degli agricoltori e forte calo nelle regioni rurali e del Sud.',
    proNo: 'Grande consenso tra agricoltori, lavoratori e difensori del Made in Italy.',
    conNo: 'Rallentamento dei dossier commerciali e irritazione dei partner del Nord Europa.',
    yesDemo: { imprese: 0.4, lavoratori: -0.35, pensionati: -0.15, giovani: 0.15 },
    noDemo: { imprese: -0.15, lavoratori: 0.5, pensionati: 0.25, giovani: -0.05 },
    yesSpread: -4,
    noSpread: 5,
    yesEuRelations: 4,
    noEuRelations: -4,
  },
  {
    id: 'eu_dir_difesa_comune_1',
    topic: 'difesa_comune',
    title: 'Fondo Europeo per la Difesa Comune & Eurobond Strategici',
    subtitle: 'Dossier Geopolitica & Sicurezza UE',
    summary:
      'Proposta di debito comune europeo per finanziare l’industria della difesa, la cybersicurezza e una forza di pronto intervento coordinata con la NATO.',
    majorityLine: 'favorevole',
    sovereignistLine: 'contrario',
    leftLine: 'contrario',
    proYes: 'Ottima accoglienza su mercati e istituzioni UE, spinta per l’industria strategica.',
    conYes: 'Critiche dall’elettorato pacifista e dalle forze sovraniste contrarie al debito comune.',
    proNo: 'Premia il voto pacifista o identitario a seconda del profilo del partito.',
    conNo: 'Isolamento nei vertici europei su sicurezza e autonomia strategica.',
    yesDemo: { imprese: 0.45, giovani: -0.15, lavoratori: 0.05, pensionati: 0.1 },
    noDemo: { imprese: -0.25, giovani: 0.3, lavoratori: 0.15, pensionati: 0.05 },
    yesSpread: -6,
    noSpread: 6,
    yesEuRelations: 6,
    noEuRelations: -5,
  },
  {
    id: 'eu_dir_immigrazione_1',
    topic: 'immigrazione',
    title: 'Attuazione Patto Asilo & Meccanismo di Solidarietà alle Frontiere',
    subtitle: 'Dossier Immigrazione & Frontex',
    summary:
      'Voto a Strasburgo sulle procedure accelerate di frontiera, i rimpatri coordinati da Frontex e i contributi obbligatori degli Stati che rifiutano i ricollocamenti.',
    majorityLine: 'favorevole',
    sovereignistLine: 'contrario',
    leftLine: 'contrario',
    proYes: 'Approccio istituzionale europeo: migliora i rapporti con Bruxelles e rassicura i moderati.',
    conYes: 'Criticato da destra come troppo debole e da sinistra come troppo restrittivo.',
    proNo: 'Messaggio netto che mobilita la base identitaria o garantista del tuo partito.',
    conNo: 'Tensioni diplomatiche sui fondi europei per la gestione delle frontiere.',
    yesDemo: { imprese: 0.2, pensionati: 0.15, lavoratori: 0.1, giovani: -0.1 },
    noDemo: { imprese: -0.1, pensionati: 0.25, lavoratori: 0.2, giovani: 0.1 },
    yesSpread: -2,
    noSpread: 4,
    yesEuRelations: 5,
    noEuRelations: -5,
  },
  {
    id: 'eu_dir_patto_stabilita_2',
    topic: 'patto_stabilita',
    title: 'Fondi PNRR Post-2026 & Fondo Sovrano Europeo per la Competitività',
    subtitle: 'Dossier Finanza Pubblica & Investimenti UE',
    summary:
      'Nuovo strumento europeo per prolungare gli investimenti in infrastrutture e innovazione, vincolato però a riforme strutturali e rispetto dei target di bilancio.',
    majorityLine: 'favorevole',
    sovereignistLine: 'astenuto',
    leftLine: 'favorevole',
    proYes: 'Abbassa lo Spread e garantisce ossigeno per imprese e investimenti italiani.',
    conYes: 'Vincoli europei più stringenti sulle riforme interne contestati dagli euroscettici.',
    proNo: 'Rivendicazione di autonomia fiscale nazionale verso gli elettori critici di Bruxelles.',
    conNo: 'Rischio riduzione delle risorse europee destinate all’Italia e tensione sui BTP.',
    yesDemo: { imprese: 0.5, giovani: 0.25, lavoratori: 0.15, pensionati: -0.05 },
    noDemo: { imprese: -0.35, giovani: -0.2, lavoratori: 0.15, pensionati: 0.15 },
    yesSpread: -9,
    noSpread: 9,
    yesEuRelations: 6,
    noEuRelations: -6,
  },
  {
    id: 'eu_dir_case_green_2',
    topic: 'case_green',
    title: 'Revisione Stop Motori Termici 2035 & Clausola Neutralità Tecnologica',
    subtitle: 'Dossier Industria Automotive & Clima',
    summary:
      'Il Parlamento Europeo vota se confermare integralmente lo stop ai motori benzina/diesel nel 2035 oppure aprire ai biocarburanti e agli e-fuel per tutelare la filiera auto.',
    majorityLine: 'favorevole',
    sovereignistLine: 'contrario',
    leftLine: 'favorevole',
    proYes: 'Conferma la rotta climatica UE: premiato da giovani e ambientalisti.',
    conYes: 'Allarme nella filiera automotive italiana e tra operai e imprese del Nord.',
    proNo: 'Difesa dell’industria manifatturiera e dei lavoratori dell’indotto auto.',
    conNo: 'Attrito con la Commissione e calo tra l’elettorato ecologista urbano.',
    yesDemo: { giovani: 0.5, imprese: -0.4, lavoratori: -0.3, pensionati: -0.1 },
    noDemo: { giovani: -0.3, imprese: 0.45, lavoratori: 0.4, pensionati: 0.15 },
    yesSpread: -2,
    noSpread: 3,
    yesEuRelations: 4,
    noEuRelations: -4,
  },
  {
    id: 'eu_dir_dazi_agricoltura_2',
    topic: 'dazi_agricoltura',
    title: 'Dazi Europei sull’Import Extra-UE & Etichettatura Nutrizionale Unica',
    subtitle: 'Dossier Mercato Unico & Filiere Alimentari',
    summary:
      'Pacchetto misto che introduce dazi protettivi sull’import asiatico ma spinge per un’etichettatura a semaforo criticata dai produttori DOP italiani.',
    majorityLine: 'favorevole',
    sovereignistLine: 'contrario',
    leftLine: 'astenuto',
    proYes: 'Tutela la manifattura europea e consolida l’intesa con la Commissione.',
    conYes: 'Forte opposizione dei consorzi DOP e del settore agroalimentare italiano.',
    proNo: 'Applausi dal mondo agricolo e difesa decisa delle eccellenze italiane.',
    conNo: 'Minore incisività sul dossier dazi industriali e attrito col PPE/Renew.',
    yesDemo: { imprese: 0.25, lavoratori: -0.15, pensionati: -0.2, giovani: 0.15 },
    noDemo: { imprese: 0.1, lavoratori: 0.35, pensionati: 0.25, giovani: -0.1 },
    yesSpread: -2,
    noSpread: 2,
    yesEuRelations: 3,
    noEuRelations: -3,
  },
];

export function getDirectiveGroupLine(
  template: EuDirectiveTemplate,
  groupId: EuParliamentGroupId
): EuCommissionVoteStance {
  if (groupId === 'epp' || groupId === 'sd' || groupId === 'renew' || groupId === 'greens_efa') {
    return template.majorityLine;
  }
  if (groupId === 'the_left') {
    return template.leftLine;
  }
  if (groupId === 'ecr' || groupId === 'pfe' || groupId === 'esn') {
    return template.sovereignistLine;
  }
  return 'astenuto';
}

export interface EuBudgetReliefInfo {
  spreadReliefBps: number;
  euPenaltyScale: number;
  infringementRiskLabel: 'Basso' | 'Moderato' | 'Alto';
  summary: string;
}

/**
 * Calcola il margine di flessibilità con Bruxelles sulla Legge di Bilancio:
 * rapporti positivi con la Commissione + Commissario italiano di peso riducono Spread e pressione UE.
 */
export function getEuBudgetRelief(state: GameState): EuBudgetReliefInfo {
  const eu = state.european;
  if (!eu) {
    return {
      spreadReliefBps: 0,
      euPenaltyScale: 1,
      infringementRiskLabel: 'Moderato',
      summary: 'Nessun bonus/malus europeo particolare sulla Manovra.',
    };
  }
  const comm = eu.commission;
  const inMaj = Boolean(comm.inEuropeanMajority);
  const votedAgainst = comm.playerVote === 'contrario';
  const tier = comm.italianCommissionerTier ?? 'medio';
  const euRel = state.stateIndicators.euRelations;

  let spreadReliefBps = 0;
  let euPenaltyScale = 1.0;

  if (inMaj) {
    spreadReliefBps += 6;
    euPenaltyScale -= 0.15;
  } else if (votedAgainst) {
    spreadReliefBps -= 8;
    euPenaltyScale += 0.18;
  }

  if (tier === 'peso') {
    spreadReliefBps += 6;
    euPenaltyScale -= 0.14;
  } else if (tier === 'medio') {
    spreadReliefBps += 2;
    euPenaltyScale -= 0.05;
  } else {
    spreadReliefBps -= 2;
  }

  if (euRel >= 70) {
    spreadReliefBps += 3;
    euPenaltyScale -= 0.06;
  } else if (euRel < 40) {
    spreadReliefBps -= 5;
    euPenaltyScale += 0.12;
  }

  const clampedScale = Math.max(0.65, Math.min(1.35, Math.round(euPenaltyScale * 100) / 100));
  const infringementRiskLabel: 'Basso' | 'Moderato' | 'Alto' =
    spreadReliefBps >= 8 ? 'Basso' : spreadReliefBps <= -5 ? 'Alto' : 'Moderato';

  const summary =
    spreadReliefBps >= 8
      ? `Scudo Bruxelles attivo (-${spreadReliefBps} bps sullo Spread · rischio infrazione Basso grazie a maggioranza UE e Commissario di peso).`
      : spreadReliefBps > 0
        ? `Dialogo costruttivo con Bruxelles (-${spreadReliefBps} bps sullo Spread · pressione UE attenuata).`
        : spreadReliefBps < 0
          ? `Frizione con la Commissione Europea (+${Math.abs(spreadReliefBps)} bps sullo Spread · alto rischio procedura d’infrazione).`
          : 'Posizione neutra a Bruxelles sulla Legge di Bilancio.';

  return {
    spreadReliefBps,
    euPenaltyScale: clampedScale,
    infringementRiskLabel,
    summary,
  };
}

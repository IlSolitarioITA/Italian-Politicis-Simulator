import {
  DemographicId,
  EmblemId,
  ExecutiveMember,
  ExecutiveRole,
  ExecutiveSpecialization,
  LeaderTraitId,
  LeadershipStyle,
  MacroRegionId,
  OrientationId,
  PartyState,
  PoliticalAxis,
  RegionId,
} from '../types/game';
import { ITALIAN_REGIONS } from './italyRegions';

export const DEMOGRAPHICS: {
  id: DemographicId;
  label: string;
  shortLabel: string;
  weight: number;
  description: string;
}[] = [
  {
    id: 'giovani',
    label: 'Giovani (18–34)',
    shortLabel: 'Giovani',
    weight: 0.19,
    description: 'Studenti, neolaureati, precari e lavoratori digitali.',
  },
  {
    id: 'lavoratori',
    label: 'Lavoratori Dipendenti',
    shortLabel: 'Lavoratori',
    weight: 0.33,
    description: 'Impiegati, operai, pubblico impiego e ceto medio salariale.',
  },
  {
    id: 'imprese',
    label: 'Partite IVA e Imprese',
    shortLabel: 'Imprese / P.IVA',
    weight: 0.2,
    description: 'PMI, professionisti, commercianti e autonomi.',
  },
  {
    id: 'pensionati',
    label: 'Pensionati e Over 65',
    shortLabel: 'Pensionati',
    weight: 0.28,
    description: 'Elettorato ad alta affluenza sensibile a sanità e potere d’acquisto.',
  },
];

export const MACRO_REGIONS: {
  id: MacroRegionId;
  label: string;
  weight: number;
  regionsList: string;
  cameraColleges: number;
  senatoColleges: number;
}[] = [
  {
    id: 'nord_ovest',
    label: 'Nord-Ovest',
    weight: 0.27,
    regionsList: 'Lombardia, Piemonte, Liguria, Valle d’Aosta',
    cameraColleges: 39,
    senatoColleges: 20,
  },
  {
    id: 'nord_est',
    label: 'Nord-Est',
    weight: 0.2,
    regionsList: 'Veneto, Emilia-Romagna, Friuli-VG, Trentino-AA',
    cameraColleges: 30,
    senatoColleges: 15,
  },
  {
    id: 'centro',
    label: 'Centro',
    weight: 0.2,
    regionsList: 'Lazio, Toscana, Marche, Umbria',
    cameraColleges: 30,
    senatoColleges: 15,
  },
  {
    id: 'sud',
    label: 'Sud',
    weight: 0.22,
    regionsList: 'Campania, Puglia, Calabria, Abruzzo, Basilicata, Molise',
    cameraColleges: 33,
    senatoColleges: 16,
  },
  {
    id: 'isole',
    label: 'Isole',
    weight: 0.11,
    regionsList: 'Sicilia, Sardegna',
    cameraColleges: 16,
    senatoColleges: 8,
  },
];

export interface OrientationDefinition {
  id: OrientationId;
  label: string;
  shortDesc: string;
  axis: PoliticalAxis;
  startingBudget: number;
  establishedBasePoll: number;
  committeeBasePoll: number;
  demoAffinity: Record<DemographicId, number>;
  regionAffinity: Record<MacroRegionId, number>;
  effectSummary: string;
}

export const ORIENTATIONS: OrientationDefinition[] = [
  {
    id: 'riformista',
    label: 'Riformista',
    shortDesc: 'Liberalismo sociale, europeismo convinto, merito e competitività.',
    axis: { economic: 35, society: 45, europe: 82, institutions: -65 },
    startingBudget: 45000,
    establishedBasePoll: 1.0,
    committeeBasePoll: 0.0,
    demoAffinity: { giovani: 1.15, lavoratori: 0.9, imprese: 1.45, pensionati: 0.75 },
    regionAffinity: { nord_ovest: 1.35, nord_est: 1.15, centro: 1.1, sud: 0.65, isole: 0.65 },
    effectSummary: '+Imprese e Nord-Ovest · Buona raccolta donazioni · Credibilità UE',
  },
  {
    id: 'conservatore',
    label: 'Conservatore',
    shortDesc: 'Identità nazionale, sicurezza, sostegno a famiglie e piccole imprese.',
    axis: { economic: 55, society: -55, europe: -15, institutions: -25 },
    startingBudget: 45000,
    establishedBasePoll: 1.0,
    committeeBasePoll: 0.0,
    demoAffinity: { giovani: 0.85, lavoratori: 0.95, imprese: 1.35, pensionati: 1.1 },
    regionAffinity: { nord_ovest: 1.1, nord_est: 1.25, centro: 1.0, sud: 0.9, isole: 0.95 },
    effectSummary: '+Imprese e Pensionati · Forte al Nord-Est · Base stabile',
  },
  {
    id: 'progressista',
    label: 'Progressista / Ambientalista',
    shortDesc: 'Transizione ecologica, diritti civili, università e mobilità verde.',
    axis: { economic: -55, society: 85, europe: 50, institutions: -72 },
    startingBudget: 45000,
    establishedBasePoll: 1.0,
    committeeBasePoll: 0.0,
    demoAffinity: { giovani: 1.65, lavoratori: 1.05, imprese: 0.55, pensionati: 0.8 },
    regionAffinity: { nord_ovest: 1.15, nord_est: 1.1, centro: 1.3, sud: 0.7, isole: 0.75 },
    effectSummary: '++Giovani e Centro urbano · Struttura snella · Alta mobilitazione social',
  },
  {
    id: 'populista',
    label: 'Populista / Anti-sistema',
    shortDesc: 'Rottura con gli apparati, democrazia diretta e protezione sociale.',
    axis: { economic: -35, society: 10, europe: -55, institutions: -20 },
    startingBudget: 45000,
    establishedBasePoll: 1.0,
    committeeBasePoll: 0.0,
    demoAffinity: { giovani: 1.2, lavoratori: 1.3, imprese: 0.8, pensionati: 0.8 },
    regionAffinity: { nord_ovest: 0.7, nord_est: 0.75, centro: 0.95, sud: 1.45, isole: 1.4 },
    effectSummary: '+Sud, Isole e Lavoratori · Costi bassi · Media ad alto impatto',
  },
  {
    id: 'socialista',
    label: 'Socialista / Lavoro',
    shortDesc: 'Salario minimo, tutela sindacale, sanità pubblica e fisco progressivo.',
    axis: { economic: -72, society: 62, europe: 40, institutions: -70 },
    startingBudget: 45000,
    establishedBasePoll: 1.0,
    committeeBasePoll: 0.0,
    demoAffinity: { giovani: 1.05, lavoratori: 1.5, imprese: 0.45, pensionati: 1.15 },
    regionAffinity: { nord_ovest: 0.95, nord_est: 1.05, centro: 1.35, sud: 0.95, isole: 0.8 },
    effectSummary: '++Lavoratori e Pensionati · Radicamento Centro · Dialogo sindacale',
  },
  {
    id: 'moderato',
    label: 'Moderato / Popolare',
    shortDesc: 'Tradizione cattolico-democratica, stabilità dei conti e dialogo istituzionale.',
    axis: { economic: 32, society: -15, europe: 72, institutions: -75 },
    startingBudget: 45000,
    establishedBasePoll: 1.0,
    committeeBasePoll: 0.0,
    demoAffinity: { giovani: 0.7, lavoratori: 0.95, imprese: 1.2, pensionati: 1.35 },
    regionAffinity: { nord_ovest: 1.1, nord_est: 1.05, centro: 0.95, sud: 1.0, isole: 1.1 },
    effectSummary: '+Pensionati e Imprese · Facile fare coalizioni · Cassa solida',
  },
  {
    id: 'territorialista',
    label: 'Territorialista / Sud',
    shortDesc: 'Infrastrutture del Mezzogiorno, coesione territoriale e rilancio produttivo.',
    axis: { economic: -25, society: -10, europe: -20, institutions: -40 },
    startingBudget: 45000,
    establishedBasePoll: 1.0,
    committeeBasePoll: 0.0,
    demoAffinity: { giovani: 1.15, lavoratori: 1.25, imprese: 0.95, pensionati: 0.85 },
    regionAffinity: { nord_ovest: 0.45, nord_est: 0.45, centro: 0.85, sud: 1.95, isole: 1.75 },
    effectSummary: '+++Sud e Isole · Forte peso nei collegi meridionali · Struttura locale',
  },
  {
    id: 'tecnopragmatico',
    label: 'Tecno-Pragmatico',
    shortDesc: 'Intelligenza artificiale, energia pulita, sburocratizzazione e finanza pubblica.',
    axis: { economic: 48, society: 40, europe: 88, institutions: -55 },
    startingBudget: 45000,
    establishedBasePoll: 1.0,
    committeeBasePoll: 0.0,
    demoAffinity: { giovani: 1.35, lavoratori: 0.85, imprese: 1.5, pensionati: 0.6 },
    regionAffinity: { nord_ovest: 1.45, nord_est: 1.25, centro: 1.05, sud: 0.55, isole: 0.55 },
    effectSummary: '+Imprese, Giovani e Nord · Raccolta fondi tech · Alta credibilità UE',
  },
];

export const LEADERSHIP_STYLES: {
  id: LeadershipStyle;
  label: string;
  bonus: string;
}[] = [
  {
    id: 'carismatico',
    label: 'Carismatico Mediatico',
    bonus: '+25% efficacia nei Talk Show TV e nei comizi nazionali.',
  },
  {
    id: 'istituzionale',
    label: 'Statista Istituzionale',
    bonus: '+15 relazioni di base con i partiti moderati e minore penalità nelle crisi.',
  },
  {
    id: 'tribuno',
    label: 'Tribuno di Piazza',
    bonus: '+25% consenso da Tour sul Territorio e campagne anti-establishment.',
  },
  {
    id: 'stratega',
    label: 'Stratega di Palazzo',
    bonus: '+15% lealtà iniziale dei dirigenti e trattative di coalizione più efficaci.',
  },
];

export const LEADER_TRAITS: {
  id: LeaderTraitId;
  label: string;
  category: string;
  effect: string;
}[] = [
  {
    id: 'oratore_tv',
    label: 'Oratore Televisivo',
    category: 'Media',
    effect: 'Sblocca repliche ad alto impatto nei dibattiti TV e nelle crisi mediatiche.',
  },
  {
    id: 'economista',
    label: 'Economista di Scuola',
    category: 'Finanza',
    effect: 'Sblocca opzioni tecniche su Legge di Bilancio, fisco, UE e caro energia.',
  },
  {
    id: 'sindacalista',
    label: 'Radicamento Sindacale',
    category: 'Lavoro',
    effect: 'Sblocca mediazioni dirette su scioperi, salari e vertenze industriali.',
  },
  {
    id: 'maestro_social',
    label: 'Maestro dei Social',
    category: 'Digitale',
    effect: 'Riduce i costi delle campagne digitali del 20% e sblocca mosse virali.',
  },
  {
    id: 'ex_magistrato',
    label: 'Ex Magistrato',
    category: 'Giustizia',
    effect: 'Immunità parziale agli scandali e opzioni uniche su legalità e giustizia.',
  },
  {
    id: 'diplomazia_ue',
    label: 'Diplomazia Europea',
    category: 'Esteri',
    effect: 'Sblocca canali riservati con Bruxelles su Patto di Stabilità e dazi.',
  },
  {
    id: 'fundraiser',
    label: 'Cacciatore di Fondi',
    category: 'Cassa',
    effect: '+30% ricavi da raccolta fondi, cene finanziatori e crowdfunding.',
  },
  {
    id: 'volto_nuovo',
    label: 'Volto Nuovo',
    category: 'Consenso',
    effect: '+20% crescita iniziale tra Giovani e astensionisti nelle crisi istituzionali.',
  },
];

export const EMBLEM_OPTIONS: { id: EmblemId; label: string }[] = [
  { id: 'stella', label: 'Stella Civica' },
  { id: 'scudo', label: 'Scudo Repubblicano' },
  { id: 'ulivo', label: 'Ramo d’Ulivo' },
  { id: 'bilancia', label: 'Bilancia Giustizia' },
  { id: 'torre', label: 'Torre Civica' },
  { id: 'aquila', label: 'Aquila Tricolore' },
  { id: 'ruota', label: 'Ruota del Lavoro' },
  { id: 'bussola', label: 'Bussola Riformista' },
  { id: 'sole', label: 'Sole del Futuro' },
  { id: 'arco', label: 'Arco Costituzionale' },
];

export const PARTY_COLOR_PALETTE = [
  '#06B6D4', // Ciano
  '#1D4ED8', // Blu Istituzionale
  '#E11D48', // Cremisi
  '#F59E0B', // Oro
  '#10B981', // Smeraldo
  '#8B5CF6', // Viola
  '#EA580C', // Arancio
  '#EC4899', // Magenta
  '#14B8A6', // Ottanio
  '#84CC16', // Lime
];

export const HISTORICAL_POLL_LABELS = [
  'Giu S1',
  'Giu S3',
  'Lug S1',
  'Lug S3',
  'Ago S1',
  'Ago S3',
  'Set S1',
  'Set S3',
  'Ott S1',
  'Ott S3',
  'Nov S1',
  'Nov S3',
];

export interface ExistingPartyPreset {
  id: string;
  name: string;
  acronym: string;
  coalitionLabel: string;
  color: string;
  emblem: EmblemId;
  orientation: OrientationId;
  axis: PoliticalAxis;
  leaderName: string;
  leaderAge: number;
  leaderStyle: LeadershipStyle;
  leaderTraits: [LeaderTraitId, LeaderTraitId];
  isInGovernment: boolean;
  coalitionId: string | null;
  startingBudget: number;
  weeklyOverhead: number;
  startingHq: RegionId[];
  internalTension: string;
  description: string;
  demographics: Record<DemographicId, number>;
  regions: Record<MacroRegionId, number>;
  /** 20-region specific multipliers relative to macro-region baseline */
  regionOverrides?: Partial<Record<RegionId, number>>;
  /** 12 bi-weekly historical poll points (Giu–Nov 2026) with authentic oscillations */
  history12: number[];
}

const RAW_EXISTING_PARTIES_2026: ExistingPartyPreset[] = [
  {
    id: 'fdi',
    name: 'Fratelli d’Italia',
    acronym: 'FdI',
    coalitionLabel: 'Centrodestra (Governo)',
    color: '#1D4ED8',
    emblem: 'aquila',
    orientation: 'conservatore',
    axis: { economic: 54, society: -65, europe: -15, institutions: -18 },
    leaderName: 'Giorgia Meloni',
    leaderAge: 49,
    leaderStyle: 'carismatico',
    leaderTraits: ['oratore_tv', 'diplomazia_ue'],
    isInGovernment: true,
    coalitionId: 'centrodestra',
    startingBudget: 950000,
    weeklyOverhead: 82000,
    startingHq: ['lazio', 'lombardia'],
    internalTension: 'Media · Equilibri su Manovra 2027 e rapporti con Bruxelles',
    description:
      'Primo partito italiano e perno della maggioranza di governo. Leadership solida, forte radicamento al Nord e nel Lazio, esposto al logoramento da Palazzo Chigi.',
    demographics: { giovani: 19.6, lavoratori: 26.8, imprese: 36.2, pensionati: 30.8 },
    regions: { nord_ovest: 29.2, nord_est: 29.8, centro: 28.4, sud: 24.6, isole: 25.2 },
    regionOverrides: {
      lombardia: 30.2,
      piemonte: 29.5,
      veneto: 33.4,
      friuli_vg: 32.0,
      trentino_aa: 23.6,
      emilia_romagna: 23.8,
      toscana: 24.2,
      umbria: 26.6,
      marche: 31.2,
      lazio: 31.8,
      abruzzo: 32.2,
      molise: 28.8,
      campania: 21.0,
      puglia: 26.8,
      basilicata: 26.2,
      calabria: 23.4,
      sicilia: 25.6,
      sardegna: 24.2,
    },
    history12: [27.4, 27.6, 27.8, 27.5, 27.7, 28.1, 27.9, 27.6, 28.0, 28.2, 27.9, 28.0],
  },
  {
    id: 'pd',
    name: 'Partito Democratico',
    acronym: 'PD',
    coalitionLabel: 'Centrosinistra (Opposizione)',
    color: '#E11D48',
    emblem: 'ulivo',
    orientation: 'socialista',
    axis: { economic: -52, society: 72, europe: 75, institutions: -78 },
    leaderName: 'Elly Schlein',
    leaderAge: 41,
    leaderStyle: 'stratega',
    leaderTraits: ['sindacalista', 'diplomazia_ue'],
    isInGovernment: false,
    coalitionId: 'centrosinistra',
    startingBudget: 820000,
    weeklyOverhead: 68000,
    startingHq: ['emilia_romagna', 'lazio'],
    internalTension: 'Alta · Equilibrio fra ala riformista e linea sociale',
    description:
      'Principale forza d’opposizione con roccaforti storiche in Emilia-Romagna, Toscana e Umbria. Sfida chiave: rendere competitivo il Campo Largo nei collegi del Sud e del Nord.',
    demographics: { giovani: 18.2, lavoratori: 22.8, imprese: 10.6, pensionati: 24.8 },
    regions: { nord_ovest: 20.8, nord_est: 22.2, centro: 26.6, sud: 15.8, isole: 14.5 },
    regionOverrides: {
      valle_daosta: 21.6,
      piemonte: 21.2,
      liguria: 23.8,
      lombardia: 20.0,
      trentino_aa: 18.0,
      veneto: 17.2,
      friuli_vg: 19.2,
      emilia_romagna: 31.2,
      toscana: 30.2,
      umbria: 26.8,
      marche: 23.6,
      lazio: 21.6,
      abruzzo: 19.4,
      molise: 17.2,
      campania: 16.4,
      puglia: 18.8,
      basilicata: 18.2,
      calabria: 14.8,
      sicilia: 13.4,
      sardegna: 21.2,
    },
    history12: [20.1, 20.5, 20.9, 20.7, 20.4, 20.8, 21.1, 20.9, 20.5, 20.8, 20.7, 20.6],
  },
  {
    id: 'm5s',
    name: 'Movimento 5 Stelle',
    acronym: 'M5S',
    coalitionLabel: 'Opposizione (Campo Largo)',
    color: '#F59E0B',
    emblem: 'stella',
    orientation: 'populista',
    axis: { economic: -48, society: 35, europe: -28, institutions: -45 },
    leaderName: 'Giuseppe Conte',
    leaderAge: 62,
    leaderStyle: 'carismatico',
    leaderTraits: ['oratore_tv', 'ex_magistrato'],
    isInGovernment: false,
    coalitionId: 'centrosinistra',
    startingBudget: 460000,
    weeklyOverhead: 38000,
    startingHq: ['campania'],
    internalTension: 'Media · Dibattito sull’autonomia rispetto al PD',
    description:
      'Forza radicata nel Mezzogiorno, prima in Campania e fortissima in Sicilia, Puglia e Calabria. Agenda centrata su welfare, salari e politica estera critica.',
    demographics: { giovani: 15.8, lavoratori: 15.2, imprese: 6.2, pensionati: 9.8 },
    regions: { nord_ovest: 7.4, nord_est: 6.6, centro: 11.4, sud: 22.8, isole: 19.6 },
    regionOverrides: {
      lombardia: 6.8,
      piemonte: 8.0,
      liguria: 11.2,
      trentino_aa: 5.2,
      veneto: 5.4,
      emilia_romagna: 8.6,
      toscana: 8.4,
      lazio: 12.6,
      abruzzo: 14.2,
      molise: 19.2,
      campania: 26.8,
      puglia: 21.2,
      basilicata: 21.8,
      calabria: 22.6,
      sicilia: 20.4,
      sardegna: 20.2,
    },
    history12: [11.9, 12.1, 12.0, 12.2, 12.4, 12.1, 12.3, 12.0, 12.2, 12.4, 12.3, 12.5],
  },
  {
    id: 'fi',
    name: 'Forza Italia',
    acronym: 'FI',
    coalitionLabel: 'Centrodestra (Governo)',
    color: '#38BDF8',
    emblem: 'scudo',
    orientation: 'moderato',
    axis: { economic: 52, society: -12, europe: 78, institutions: -72 },
    leaderName: 'Antonio Tajani',
    leaderAge: 73,
    leaderStyle: 'istituzionale',
    leaderTraits: ['diplomazia_ue', 'fundraiser'],
    isInGovernment: true,
    coalitionId: 'centrodestra',
    startingBudget: 620000,
    weeklyOverhead: 34000,
    startingHq: ['lombardia'],
    internalTension: 'Bassa · Competizione al centro per i voti moderati',
    description:
      'Anima liberale, popolare ed europeista del Centrodestra di governo. Forte in Sicilia, Calabria, Lombardia e tra imprese e ceto moderato.',
    demographics: { giovani: 4.2, lavoratori: 5.4, imprese: 9.8, pensionati: 9.0 },
    regions: { nord_ovest: 7.0, nord_est: 5.8, centro: 5.9, sud: 8.8, isole: 9.6 },
    regionOverrides: {
      lombardia: 7.5,
      piemonte: 7.0,
      trentino_aa: 4.6,
      veneto: 5.7,
      emilia_romagna: 4.9,
      lazio: 6.5,
      campania: 8.2,
      puglia: 7.8,
      calabria: 12.6,
      sicilia: 11.4,
      sardegna: 6.4,
    },
    history12: [7.6, 7.5, 7.4, 7.3, 7.4, 7.5, 7.3, 7.2, 7.3, 7.2, 7.2, 7.1],
  },
  {
    id: 'avs',
    name: 'Alleanza Verdi e Sinistra',
    acronym: 'AVS',
    coalitionLabel: 'Centrosinistra (Opposizione)',
    color: '#10B981',
    emblem: 'sole',
    orientation: 'progressista',
    axis: { economic: -80, society: 88, europe: 45, institutions: -74 },
    leaderName: 'Nicola Fratoianni',
    leaderAge: 54,
    leaderStyle: 'tribuno',
    leaderTraits: ['maestro_social', 'volto_nuovo'],
    isInGovernment: false,
    coalitionId: 'centrosinistra',
    startingBudget: 290000,
    weeklyOverhead: 22000,
    startingHq: ['toscana'],
    internalTension: 'Bassa · Forte spinta tra giovani e città universitarie',
    description:
      'Coalizione ecologista e di sinistra in consolidamento nei centri urbani e tra gli under 35. Agenda chiara su transizione climatica, diritti civili e lavoro.',
    demographics: { giovani: 14.2, lavoratori: 6.1, imprese: 2.1, pensionati: 3.7 },
    regions: { nord_ovest: 6.7, nord_est: 6.4, centro: 7.8, sud: 4.7, isole: 4.5 },
    regionOverrides: {
      lombardia: 6.9,
      piemonte: 7.2,
      liguria: 7.4,
      trentino_aa: 6.2,
      emilia_romagna: 8.0,
      toscana: 9.2,
      lazio: 7.5,
      campania: 5.3,
      sardegna: 6.6,
    },
    history12: [5.6, 5.8, 5.9, 5.8, 6.0, 6.1, 6.2, 6.1, 6.0, 6.2, 6.2, 6.3],
  },
  {
    id: 'fn',
    name: 'Futuro Nazionale',
    acronym: 'FN',
    coalitionLabel: 'Destra Nazionalista · Sovranista',
    color: '#3B82F6',
    emblem: 'aquila',
    orientation: 'conservatore',
    axis: { economic: 35, society: -88, europe: -84, institutions: 20 },
    leaderName: 'Roberto Vannacci',
    leaderAge: 58,
    leaderStyle: 'tribuno',
    leaderTraits: ['oratore_tv', 'maestro_social'],
    isInGovernment: false,
    coalitionId: null,
    startingBudget: 360000,
    weeklyOverhead: 24000,
    startingHq: ['toscana', 'veneto'],
    internalTension: 'Media · Competizione diretta a destra con Lega e Fratelli d’Italia',
    description:
      'Nuova formazione della destra nazionalista e sovranista guidata da Roberto Vannacci. Forte presa tra elettori identitari, sicurezza, confini e ceti produttivi del Centro-Nord.',
    demographics: { giovani: 4.8, lavoratori: 6.8, imprese: 7.2, pensionati: 5.4 },
    regions: { nord_ovest: 6.6, nord_est: 7.4, centro: 6.4, sud: 4.8, isole: 4.6 },
    regionOverrides: {
      lombardia: 7.0,
      piemonte: 6.4,
      veneto: 8.4,
      friuli_vg: 8.0,
      toscana: 7.2,
      lazio: 6.6,
      marche: 6.8,
      abruzzo: 6.2,
      campania: 4.2,
      sicilia: 4.8,
    },
    history12: [3.2, 3.6, 4.0, 4.3, 4.6, 4.9, 5.1, 5.3, 5.5, 5.7, 5.9, 6.0],
  },
  {
    id: 'lega',
    name: 'Lega',
    acronym: 'LEGA',
    coalitionLabel: 'Centrodestra (Governo)',
    color: '#16A34A',
    emblem: 'torre',
    orientation: 'conservatore',
    axis: { economic: 58, society: -72, europe: -68, institutions: -10 },
    leaderName: 'Matteo Salvini',
    leaderAge: 53,
    leaderStyle: 'tribuno',
    leaderTraits: ['maestro_social', 'oratore_tv'],
    isInGovernment: true,
    coalitionId: 'centrodestra',
    startingBudget: 510000,
    weeklyOverhead: 34000,
    startingHq: ['veneto'],
    internalTension: 'Alta · Pressione a destra da Futuro Nazionale e richieste dei governatori del Nord',
    description:
      'Forza radicata nel Nord produttivo, in particolare Veneto, Lombardia e Friuli-VG. Priorità su autonomia differenziata, infrastrutture, flat tax e sicurezza.',
    demographics: { giovani: 4.2, lavoratori: 6.0, imprese: 9.4, pensionati: 4.4 },
    regions: { nord_ovest: 8.2, nord_est: 9.4, centro: 3.9, sud: 3.1, isole: 3.2 },
    regionOverrides: {
      valle_daosta: 9.2,
      lombardia: 9.6,
      piemonte: 7.2,
      liguria: 6.4,
      trentino_aa: 8.8,
      veneto: 13.0,
      friuli_vg: 10.6,
      emilia_romagna: 5.8,
      toscana: 4.4,
      lazio: 3.6,
      campania: 2.3,
      puglia: 2.8,
      calabria: 3.8,
      sicilia: 3.4,
      sardegna: 3.4,
    },
    history12: [7.6, 7.4, 7.1, 6.9, 6.8, 6.6, 6.4, 6.3, 6.2, 6.1, 6.0, 5.9],
  },
  {
    id: 'az',
    name: 'Azione',
    acronym: 'AZ',
    coalitionLabel: 'Centro (Terzo Polo)',
    color: '#06B6D4',
    emblem: 'bussola',
    orientation: 'riformista',
    axis: { economic: 42, society: 42, europe: 90, institutions: -76 },
    leaderName: 'Carlo Calenda',
    leaderAge: 53,
    leaderStyle: 'istituzionale',
    leaderTraits: ['economista', 'diplomazia_ue'],
    isInGovernment: false,
    coalitionId: 'centro',
    startingBudget: 340000,
    weeklyOverhead: 18000,
    startingHq: ['lombardia'],
    internalTension: 'Media · Sfida per consolidare il Polo Riformista sopra il 4%',
    description:
      'Partito liberal-riformista concentrato su politica industriale, energia nucleare, sanità efficiente e competenza tecnica. Forte nei grandi capoluoghi del Nord e a Roma.',
    demographics: { giovani: 5.1, lavoratori: 2.5, imprese: 6.9, pensionati: 2.0 },
    regions: { nord_ovest: 4.8, nord_est: 3.8, centro: 3.9, sud: 2.3, isole: 2.0 },
    regionOverrides: {
      lombardia: 5.4,
      piemonte: 4.8,
      emilia_romagna: 4.2,
      lazio: 4.6,
      campania: 2.5,
      sicilia: 2.0,
    },
    history12: [3.4, 3.3, 3.2, 3.3, 3.4, 3.2, 3.1, 3.2, 3.3, 3.3, 3.2, 3.2],
  },
  {
    id: 'iv',
    name: 'Italia Viva',
    acronym: 'IV',
    coalitionLabel: 'Centro (Terzo Polo)',
    color: '#EC4899',
    emblem: 'arco',
    orientation: 'riformista',
    axis: { economic: 48, society: 35, europe: 82, institutions: -65 },
    leaderName: 'Matteo Renzi',
    leaderAge: 51,
    leaderStyle: 'stratega',
    leaderTraits: ['oratore_tv', 'fundraiser'],
    isInGovernment: false,
    coalitionId: 'centro',
    startingBudget: 240000,
    weeklyOverhead: 12000,
    startingHq: ['toscana'],
    internalTension: 'Alta · Sotto la soglia del 3%: decisiva la strategia di coalizione',
    description:
      'Forza riformista e centrista con forte capacità di manovra parlamentare e radicamento storico in Toscana. Obiettivo prioritario: superare lo sbarramento del 3% o federare il centro.',
    demographics: { giovani: 2.5, lavoratori: 1.9, imprese: 3.7, pensionati: 2.1 },
    regions: { nord_ovest: 2.3, nord_est: 2.1, centro: 3.3, sud: 2.2, isole: 2.0 },
    regionOverrides: {
      toscana: 5.4,
      lombardia: 2.6,
      lazio: 2.6,
      campania: 2.8,
      sicilia: 2.1,
    },
    history12: [2.1, 2.2, 2.3, 2.2, 2.1, 2.3, 2.4, 2.3, 2.2, 2.2, 2.3, 2.3],
  },
  {
    id: 'piu_europa',
    name: '+Europa',
    acronym: '+Eu',
    coalitionLabel: 'Centrosinistra · Federalisti UE',
    color: '#EAB308',
    emblem: 'stella',
    orientation: 'riformista',
    axis: { economic: 40, society: 86, europe: 96, institutions: -84 },
    leaderName: 'Riccardo Magi',
    leaderAge: 50,
    leaderStyle: 'istituzionale',
    leaderTraits: ['diplomazia_ue', 'oratore_tv'],
    isInGovernment: false,
    coalitionId: 'centrosinistra',
    startingBudget: 120000,
    weeklyOverhead: 8500,
    startingHq: ['lombardia'],
    internalTension: 'Media · Scommessa su diritti civili e Stati Uniti d’Europa',
    description:
      'Partito liberal-europeista e radicale, radicato nei centri urbani, tra giovani e professionisti. Punta al sorpasso della soglia del 3% con battaglie su diritti, mercato e integrazione UE.',
    demographics: { giovani: 2.4, lavoratori: 1.0, imprese: 1.6, pensionati: 0.7 },
    regions: { nord_ovest: 1.7, nord_est: 1.5, centro: 1.6, sud: 0.8, isole: 0.7 },
    regionOverrides: {
      lombardia: 2.1,
      piemonte: 1.8,
      emilia_romagna: 1.7,
      toscana: 1.8,
      lazio: 1.9,
      campania: 0.8,
    },
    history12: [1.5, 1.5, 1.4, 1.5, 1.4, 1.4, 1.3, 1.3, 1.4, 1.3, 1.3, 1.3],
  },
  {
    id: 'noi_moderati',
    name: 'Noi Moderati',
    acronym: 'NM',
    coalitionLabel: 'Centrodestra (Alleato)',
    color: '#0284C7',
    emblem: 'scudo',
    orientation: 'moderato',
    axis: { economic: 46, society: -28, europe: 72, institutions: -70 },
    leaderName: 'Maurizio Lupi',
    leaderAge: 67,
    leaderStyle: 'istituzionale',
    leaderTraits: ['diplomazia_ue', 'fundraiser'],
    isInGovernment: false,
    coalitionId: 'centrodestra',
    startingBudget: 115000,
    weeklyOverhead: 8000,
    startingHq: ['lombardia'],
    internalTension: 'Bassa · Ricerca di visibilità autonoma nel Centrodestra',
    description:
      'Quarta gamba centrista e cattolico-popolare del Centrodestra. Forte tra amministratori locali, ceto medio moderato e associazioni di categoria.',
    demographics: { giovani: 0.6, lavoratori: 0.9, imprese: 1.6, pensionati: 1.5 },
    regions: { nord_ovest: 1.1, nord_est: 0.9, centro: 0.9, sud: 1.4, isole: 1.3 },
    regionOverrides: {
      lombardia: 1.4,
      liguria: 2.0,
      campania: 1.5,
      calabria: 1.7,
      sicilia: 1.6,
    },
    history12: [1.0, 1.0, 1.1, 1.1, 1.0, 1.2, 1.1, 1.0, 1.1, 1.2, 1.1, 1.1],
  },
  {
    id: 'sud_chiama_nord',
    name: 'Sud chiama Nord',
    acronym: 'ScN',
    coalitionLabel: 'Autonomisti · Meridionalisti',
    color: '#F97316',
    emblem: 'sole',
    orientation: 'territorialista',
    axis: { economic: -15, society: -12, europe: -25, institutions: -30 },
    leaderName: 'Cateno De Luca',
    leaderAge: 54,
    leaderStyle: 'tribuno',
    leaderTraits: ['oratore_tv', 'maestro_social'],
    isInGovernment: false,
    coalitionId: null,
    startingBudget: 95000,
    weeklyOverhead: 7500,
    startingHq: ['sicilia'],
    internalTension: 'Media · Sfida per espandersi fuori dalla Sicilia nel resto del Sud',
    description:
      'Movimento meridionalista e autonomista guidato dal sindaco-tribuno Cateno De Luca. Radicatissimo in Sicilia e in crescita nei collegi meridionali.',
    demographics: { giovani: 1.0, lavoratori: 1.2, imprese: 1.0, pensionati: 0.8 },
    regions: { nord_ovest: 0.2, nord_est: 0.2, centro: 0.3, sud: 1.6, isole: 5.4 },
    regionOverrides: {
      sicilia: 6.9,
      sardegna: 0.6,
      calabria: 2.3,
      campania: 1.7,
      puglia: 1.3,
    },
    history12: [0.9, 1.0, 1.0, 0.9, 1.0, 1.1, 1.1, 1.0, 1.0, 0.9, 1.0, 1.0],
  },
  {
    id: 'dsp',
    name: 'Democrazia Sovrana Popolare',
    acronym: 'DSP',
    coalitionLabel: 'Sovranisti · Rosso-Bruno',
    color: '#B91C1C',
    emblem: 'ruota',
    orientation: 'populista',
    axis: { economic: -75, society: -45, europe: -92, institutions: -15 },
    leaderName: 'Marco Rizzo',
    leaderAge: 67,
    leaderStyle: 'tribuno',
    leaderTraits: ['oratore_tv', 'sindacalista'],
    isInGovernment: false,
    coalitionId: null,
    startingBudget: 65000,
    weeklyOverhead: 5800,
    startingHq: ['piemonte'],
    internalTension: 'Media · Competizione nell’area sovranista-sociale e anti-sistema',
    description:
      'Formazione rosso-bruna e sovranista-sociale che unisce uscita dai vincoli UE, neutralità geopolitica, difesa del lavoro industriale e sovranità nazionale.',
    demographics: { giovani: 0.5, lavoratori: 0.8, imprese: 0.4, pensionati: 0.6 },
    regions: { nord_ovest: 0.7, nord_est: 0.6, centro: 0.7, sud: 0.5, isole: 0.4 },
    regionOverrides: {
      piemonte: 0.9,
      toscana: 0.8,
      umbria: 0.9,
      emilia_romagna: 0.7,
      lombardia: 0.7,
    },
    history12: [0.6, 0.6, 0.6, 0.7, 0.6, 0.6, 0.6, 0.6, 0.7, 0.6, 0.6, 0.6],
  },
  {
    id: 'prc',
    name: 'Partito della Rifondazione Comunista',
    acronym: 'PRC',
    coalitionLabel: 'Sinistra Radicale',
    color: '#FB7185',
    emblem: 'ruota',
    orientation: 'socialista',
    axis: { economic: -90, society: 82, europe: -42, institutions: -68 },
    leaderName: 'Maurizio Acerbo',
    leaderAge: 61,
    leaderStyle: 'tribuno',
    leaderTraits: ['sindacalista', 'oratore_tv'],
    isInGovernment: false,
    coalitionId: null,
    startingBudget: 54000,
    weeklyOverhead: 5000,
    startingHq: ['emilia_romagna'],
    internalTension: 'Media · Dibattito sull’unità della sinistra radicale e pacifista',
    description:
      'Storico partito della sinistra radicale e anticapitalista italiana. Radicato tra lavoratori, sindacalisti e circoli territoriali in Emilia-Romagna, Toscana, Abruzzo e Lazio.',
    demographics: { giovani: 0.5, lavoratori: 0.7, imprese: 0.1, pensionati: 0.6 },
    regions: { nord_ovest: 0.4, nord_est: 0.6, centro: 0.7, sud: 0.4, isole: 0.3 },
    regionOverrides: {
      emilia_romagna: 0.8,
      toscana: 0.8,
      umbria: 0.8,
      abruzzo: 0.7,
      lazio: 0.6,
      liguria: 0.6,
    },
    history12: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.6, 0.5, 0.5, 0.5, 0.5, 0.5],
  },
  {
    id: 'ptd',
    name: 'Pace Terra Dignità',
    acronym: 'PTD',
    coalitionLabel: 'Pacifisti · Sinistra Alternativa',
    color: '#8B5CF6',
    emblem: 'ulivo',
    orientation: 'progressista',
    axis: { economic: -68, society: 66, europe: -48, institutions: -62 },
    leaderName: 'Michele Santoro',
    leaderAge: 75,
    leaderStyle: 'carismatico',
    leaderTraits: ['oratore_tv', 'volto_nuovo'],
    isInGovernment: false,
    coalitionId: null,
    startingBudget: 62000,
    weeklyOverhead: 5500,
    startingHq: ['lazio'],
    internalTension: 'Media · Sfida per trasformare il consenso mediatico pacifista in radicamento locale',
    description:
      'Lista pacifista e di sinistra alternativa fondata da Michele Santoro contro l’economia di guerra, il riarmo e le disuguaglianze sociali. Forte visibilità nei talk show e nei centri urbani.',
    demographics: { giovani: 0.6, lavoratori: 0.6, imprese: 0.2, pensionati: 0.6 },
    regions: { nord_ovest: 0.5, nord_est: 0.5, centro: 0.7, sud: 0.5, isole: 0.4 },
    regionOverrides: {
      lazio: 0.8,
      toscana: 0.7,
      emilia_romagna: 0.7,
      campania: 0.6,
      piemonte: 0.6,
    },
    history12: [0.5, 0.5, 0.6, 0.5, 0.5, 0.5, 0.6, 0.5, 0.5, 0.5, 0.5, 0.5],
  },
  {
    id: 'potere_al_popolo',
    name: 'Potere al Popolo',
    acronym: 'PaP',
    coalitionLabel: 'Sinistra Anticapitalista',
    color: '#9F1239',
    emblem: 'stella',
    orientation: 'socialista',
    axis: { economic: -92, society: 90, europe: -45, institutions: -65 },
    leaderName: 'Marta Collot',
    leaderAge: 33,
    leaderStyle: 'tribuno',
    leaderTraits: ['sindacalista', 'volto_nuovo'],
    isInGovernment: false,
    coalitionId: null,
    startingBudget: 48000,
    weeklyOverhead: 4800,
    startingHq: ['campania'],
    internalTension: 'Bassa · Forte attivismo di base ma risorse mediatiche limitate',
    description:
      'Movimento di sinistra anticapitalista e popolare radicato nei collettivi studenteschi, nel sindacalismo di base e nei quartieri popolari di Napoli, Bologna e Roma.',
    demographics: { giovani: 0.8, lavoratori: 0.5, imprese: 0.1, pensionati: 0.2 },
    regions: { nord_ovest: 0.3, nord_est: 0.4, centro: 0.5, sud: 0.5, isole: 0.3 },
    regionOverrides: {
      campania: 0.8,
      emilia_romagna: 0.6,
      toscana: 0.7,
      lazio: 0.5,
    },
    history12: [0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4],
  },
  {
    id: 'alternativa_popolare',
    name: 'Alternativa Popolare',
    acronym: 'AP',
    coalitionLabel: 'Centro-Destra Populista',
    color: '#D97706',
    emblem: 'torre',
    orientation: 'populista',
    axis: { economic: 58, society: -44, europe: -22, institutions: -16 },
    leaderName: 'Stefano Bandecchi',
    leaderAge: 65,
    leaderStyle: 'tribuno',
    leaderTraits: ['fundraiser', 'maestro_social'],
    isInGovernment: false,
    coalitionId: null,
    startingBudget: 110000,
    weeklyOverhead: 6200,
    startingHq: ['umbria'],
    internalTension: 'Media · Espansione dall’Umbria verso le regioni del Centro-Sud',
    description:
      'Forza di centro-destra populista e imprenditoriale guidata dal sindaco di Terni Stefano Bandecchi. Forte presenza social, roccaforte in Umbria e programma liberista e securitario.',
    demographics: { giovani: 0.4, lavoratori: 0.4, imprese: 0.6, pensionati: 0.3 },
    regions: { nord_ovest: 0.3, nord_est: 0.3, centro: 0.8, sud: 0.4, isole: 0.3 },
    regionOverrides: {
      umbria: 3.4,
      lazio: 0.7,
      toscana: 0.6,
      marche: 0.6,
      campania: 0.5,
    },
    history12: [0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4],
  },
  {
    id: 'svp',
    name: 'Südtiroler Volkspartei',
    acronym: 'SVP',
    coalitionLabel: 'Autonomisti · Sudtirolo',
    color: '#CBD5E1',
    emblem: 'stella',
    orientation: 'territorialista',
    axis: { economic: 30, society: -18, europe: 82, institutions: -76 },
    leaderName: 'Dieter Steger',
    leaderAge: 62,
    leaderStyle: 'istituzionale',
    leaderTraits: ['diplomazia_ue', 'fundraiser'],
    isInGovernment: false,
    coalitionId: null,
    startingBudget: 90000,
    weeklyOverhead: 5500,
    startingHq: ['trentino_aa'],
    internalTension: 'Bassa · Egemonia storica in Alto Adige, dialoga con ogni maggioranza sull’Autonomia',
    description:
      'Partito autonomista di raccolta della minoranza sudtirolese. Raccoglie circa lo 0,4% nazionale ma supera il 25% in Trentino-Alto Adige, risultando decisivo nei collegi uninominali alpini.',
    demographics: { giovani: 0.3, lavoratori: 0.4, imprese: 0.5, pensionati: 0.4 },
    regions: { nord_ovest: 0.0, nord_est: 2.1, centro: 0.0, sud: 0.0, isole: 0.0 },
    regionOverrides: {
      valle_daosta: 0.0,
      piemonte: 0.0,
      liguria: 0.0,
      lombardia: 0.0,
      trentino_aa: 25.5,
      veneto: 0.0,
      friuli_vg: 0.0,
      emilia_romagna: 0.0,
      toscana: 0.0,
      umbria: 0.0,
      marche: 0.0,
      lazio: 0.0,
      abruzzo: 0.0,
      molise: 0.0,
      campania: 0.0,
      puglia: 0.0,
      basilicata: 0.0,
      calabria: 0.0,
      sicilia: 0.0,
      sardegna: 0.0,
    },
    history12: [0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4],
  },
  {
    id: 'orizzonti_liberali',
    name: 'Partito Liberaldemocratico / Orizzonti Liberali',
    acronym: 'ORI',
    coalitionLabel: 'Centro Liberale',
    color: '#22D3EE',
    emblem: 'bilancia',
    orientation: 'riformista',
    axis: { economic: 74, society: 54, europe: 88, institutions: -78 },
    leaderName: 'Luigi Marattin',
    leaderAge: 47,
    leaderStyle: 'istituzionale',
    leaderTraits: ['economista', 'diplomazia_ue'],
    isInGovernment: false,
    coalitionId: 'centro',
    startingBudget: 56000,
    weeklyOverhead: 4800,
    startingHq: ['emilia_romagna'],
    internalTension: 'Bassa · Cerca federazione unitaria dell’area liberaldemocratica',
    description:
      'Movimento liberaldemocratico fondato da Luigi Marattin per unire riformisti e liberali su rigore dei conti, concorrenza, merito e integrazione europea.',
    demographics: { giovani: 0.4, lavoratori: 0.2, imprese: 0.6, pensionati: 0.2 },
    regions: { nord_ovest: 0.4, nord_est: 0.4, centro: 0.4, sud: 0.2, isole: 0.2 },
    regionOverrides: {
      emilia_romagna: 0.6,
      lombardia: 0.5,
      piemonte: 0.4,
      lazio: 0.4,
      toscana: 0.4,
    },
    history12: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
  },
  {
    id: 'liberta_italexit',
    name: 'Libertà / Italexit',
    acronym: 'LIB',
    coalitionLabel: 'Euroscettici · Anti-Sistema',
    color: '#6366F1',
    emblem: 'aquila',
    orientation: 'populista',
    axis: { economic: -25, society: -50, europe: -95, institutions: -22 },
    leaderName: 'Gianluigi Paragone',
    leaderAge: 55,
    leaderStyle: 'carismatico',
    leaderTraits: ['oratore_tv', 'maestro_social'],
    isInGovernment: false,
    coalitionId: null,
    startingBudget: 54000,
    weeklyOverhead: 5000,
    startingHq: ['lombardia'],
    internalTension: 'Alta · Frammentazione tra sigle euroscettiche e anti-sistema',
    description:
      'Cartello euroscettico e anti-sistema focalizzato sull’uscita dai vincoli di Bruxelles, difesa delle piccole partite IVA e forte presenza nei talk show e sul web.',
    demographics: { giovani: 0.2, lavoratori: 0.4, imprese: 0.4, pensionati: 0.2 },
    regions: { nord_ovest: 0.4, nord_est: 0.4, centro: 0.3, sud: 0.3, isole: 0.2 },
    regionOverrides: {
      lombardia: 0.5,
      veneto: 0.4,
      friuli_vg: 0.5,
      lazio: 0.4,
    },
    history12: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
  },
  {
    id: 'pci',
    name: 'Partito Comunista Italiano',
    acronym: 'PCI',
    coalitionLabel: 'Sinistra Comunista',
    color: '#DC2626',
    emblem: 'ruota',
    orientation: 'socialista',
    axis: { economic: -95, society: 55, europe: -65, institutions: -55 },
    leaderName: 'Mauro Alboresi',
    leaderAge: 71,
    leaderStyle: 'istituzionale',
    leaderTraits: ['sindacalista', 'economista'],
    isInGovernment: false,
    coalitionId: null,
    startingBudget: 42000,
    weeklyOverhead: 4500,
    startingHq: ['emilia_romagna'],
    internalTension: 'Bassa · Base militante fedele ma elettorato concentrato nel Centro-Nord',
    description:
      'Formazione comunista tradizionale che richiama la storia del movimento operaio italiano. Presente soprattutto in Emilia-Romagna, Toscana, Umbria e nei distretti industriali.',
    demographics: { giovani: 0.2, lavoratori: 0.4, imprese: 0.1, pensionati: 0.4 },
    regions: { nord_ovest: 0.3, nord_est: 0.4, centro: 0.4, sud: 0.2, isole: 0.2 },
    regionOverrides: {
      emilia_romagna: 0.6,
      toscana: 0.6,
      umbria: 0.6,
      liguria: 0.4,
    },
    history12: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
  },
  {
    id: 'dc',
    name: 'Democrazia Cristiana',
    acronym: 'DC',
    coalitionLabel: 'Centro Democristiano',
    color: '#93C5FD',
    emblem: 'scudo',
    orientation: 'moderato',
    axis: { economic: 22, society: -48, europe: 68, institutions: -72 },
    leaderName: 'Totò Cuffaro',
    leaderAge: 68,
    leaderStyle: 'stratega',
    leaderTraits: ['fundraiser', 'oratore_tv'],
    isInGovernment: false,
    coalitionId: null,
    startingBudget: 55000,
    weeklyOverhead: 5000,
    startingHq: ['sicilia'],
    internalTension: 'Media · Radicata nel Mezzogiorno, cerca alleanze nazionali',
    description:
      'Rinascente formazione centrista e cattolico-democratica ispirata allo Scudo Crociato. Forte presenza negli enti locali di Sicilia, Calabria e Campania.',
    demographics: { giovani: 0.1, lavoratori: 0.2, imprese: 0.2, pensionati: 0.4 },
    regions: { nord_ovest: 0.1, nord_est: 0.1, centro: 0.1, sud: 0.4, isole: 1.0 },
    regionOverrides: {
      sicilia: 1.4,
      sardegna: 0.2,
      calabria: 0.5,
      campania: 0.4,
      puglia: 0.3,
    },
    history12: [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2],
  },
  {
    id: 'indipendenza',
    name: 'Movimento Indipendenza',
    acronym: 'IND',
    coalitionLabel: 'Destra Sociale Sovranista',
    color: '#4F46E5',
    emblem: 'aquila',
    orientation: 'conservatore',
    axis: { economic: -35, society: -84, europe: -92, institutions: 18 },
    leaderName: 'Gianni Alemanno',
    leaderAge: 68,
    leaderStyle: 'tribuno',
    leaderTraits: ['oratore_tv', 'sindacalista'],
    isInGovernment: false,
    coalitionId: null,
    startingBudget: 46000,
    weeklyOverhead: 4500,
    startingHq: ['lazio'],
    internalTension: 'Media · Competizione a destra con Futuro Nazionale e FdI',
    description:
      'Movimento della destra sociale sovranista guidato da Gianni Alemanno, critico verso l’atlantismo e i vincoli UE, con attenzione a sovranità monetaria, sicurezza e lavoro.',
    demographics: { giovani: 0.2, lavoratori: 0.2, imprese: 0.2, pensionati: 0.2 },
    regions: { nord_ovest: 0.2, nord_est: 0.2, centro: 0.3, sud: 0.2, isole: 0.2 },
    regionOverrides: {
      lazio: 0.4,
      veneto: 0.3,
      lombardia: 0.2,
      puglia: 0.2,
      sicilia: 0.2,
    },
    history12: [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2],
  },
  {
    id: 'possibile',
    name: 'Possibile',
    acronym: 'POS',
    coalitionLabel: 'Sinistra Ecologista',
    color: '#14B8A6',
    emblem: 'sole',
    orientation: 'progressista',
    axis: { economic: -72, society: 92, europe: 68, institutions: -82 },
    leaderName: 'Francesca Frediani',
    leaderAge: 49,
    leaderStyle: 'istituzionale',
    leaderTraits: ['volto_nuovo', 'maestro_social'],
    isInGovernment: false,
    coalitionId: 'centrosinistra',
    startingBudget: 38000,
    weeklyOverhead: 3800,
    startingHq: ['piemonte'],
    internalTension: 'Bassa · Battaglie su giustizia climatica, diritti civili e beni comuni',
    description:
      'Partito ecologista e progressista attento a clima, diritti civili, trasporti sostenibili e partecipazione dal basso. Forte soprattutto tra giovani e città universitarie del Nord.',
    demographics: { giovani: 0.4, lavoratori: 0.2, imprese: 0.1, pensionati: 0.1 },
    regions: { nord_ovest: 0.3, nord_est: 0.2, centro: 0.2, sud: 0.1, isole: 0.1 },
    regionOverrides: {
      piemonte: 0.4,
      lombardia: 0.3,
      emilia_romagna: 0.3,
      toscana: 0.3,
      lazio: 0.2,
    },
    history12: [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2],
  },
  {
    id: 'psi',
    name: 'Partito Socialista Italiano',
    acronym: 'PSI',
    coalitionLabel: 'Centrosinistra Riformista',
    color: '#F472B6',
    emblem: 'ulivo',
    orientation: 'socialista',
    axis: { economic: -32, society: 62, europe: 78, institutions: -80 },
    leaderName: 'Enzo Maraio',
    leaderAge: 48,
    leaderStyle: 'istituzionale',
    leaderTraits: ['diplomazia_ue', 'sindacalista'],
    isInGovernment: false,
    coalitionId: 'centrosinistra',
    startingBudget: 44000,
    weeklyOverhead: 4200,
    startingHq: ['campania'],
    internalTension: 'Bassa · Presidio riformista e laico nel Campo Largo',
    description:
      'Erede della tradizione socialista riformista e garantista italiana. Presente negli enti locali di Campania, Umbria, Toscana e Lazio, punta a rafforzare l’ala riformista del centrosinistra.',
    demographics: { giovani: 0.1, lavoratori: 0.3, imprese: 0.1, pensionati: 0.3 },
    regions: { nord_ovest: 0.1, nord_est: 0.2, centro: 0.3, sud: 0.3, isole: 0.1 },
    regionOverrides: {
      campania: 0.5,
      umbria: 0.4,
      toscana: 0.3,
      lazio: 0.3,
      calabria: 0.3,
    },
    history12: [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2],
  },
];

export const MINOR_PARTIES_BASELINE: PartyState = {
  id: 'altri',
  name: 'Liste Autonomiste e Civiche',
  acronym: 'ALT',
  color: '#64748B',
  emblem: 'arco',
  orientation: 'moderato',
  axis: { economic: 0, society: 0, europe: 0, institutions: -50 },
  leaderName: 'Union Valdôtaine / Liste Locali',
  isPlayer: false,
  isInGovernment: false,
  coalitionId: null,
  demographics: { giovani: 0.2, lavoratori: 0.2, imprese: 0.2, pensionati: 0.2 },
  regions: { nord_ovest: 0.2, nord_est: 0.2, centro: 0.2, sud: 0.2, isole: 0.2 },
  regionPolls: ITALIAN_REGIONS.reduce((acc, r) => {
    acc[r.id] =
      r.id === 'valle_daosta'
        ? 8.0
        : r.id === 'trentino_aa'
          ? 0.8
          : r.id === 'sardegna'
            ? 0.6
            : 0.2;
    return acc;
  }, {} as Record<RegionId, number>),
  nationalPoll: 0.2,
  previousPoll: 0.2,
  relationWithPlayer: 0,
  coalitionStatus: 'avversario',
  description:
    'Liste autonomiste locali (Union Valdôtaine in Valle d’Aosta, liste civiche sarde) e micro-liste comunali.',
};

/** Normalizza automaticamente un vettore di percentuali affinché la somma sia esattamente targetSum (es. 100.0%) */
function normalizeVectorToTarget(values: number[], targetSum: number): number[] {
  const targetTenths = Math.round(targetSum * 10);
  const sum = values.reduce((acc, v) => acc + Math.max(0, v), 0);
  if (sum <= 0 || values.length === 0) return values;

  const exact = values.map((v) => (Math.max(0, v) / sum) * targetTenths);
  const floors = exact.map((e) => Math.floor(e));
  let remainder = targetTenths - floors.reduce((a, b) => a + b, 0);

  const order = exact
    .map((e, idx) => ({ idx, frac: e - floors[idx] }))
    .sort((a, b) => b.frac - a.frac);

  for (let i = 0; i < remainder && i < order.length; i += 1) {
    floors[order[i].idx] += 1;
  }
  return floors.map((t) => Math.round(t) / 10);
}

/**
 * Normalizza automaticamente le percentuali iniziali di tutti i partiti in EXISTING_PARTIES_2026
 * rispetto al residuo di MINOR_PARTIES_BASELINE affinché la somma nazionale (e ogni fascia/storia) sia esattamente 100,0%.
 */
function normalizeExistingPartyPresets(
  rawPresets: ExistingPartyPreset[],
  baseline: PartyState
): ExistingPartyPreset[] {
  const cloned = rawPresets.map((p) => ({
    ...p,
    demographics: { ...p.demographics },
    regions: { ...p.regions },
    regionOverrides: p.regionOverrides ? { ...p.regionOverrides } : undefined,
    history12: [...p.history12],
  }));

  // 1. Normalizza ciascuno dei 12 punti storici affinché (sum + baseline.nationalPoll) === 100.0%
  const historyLen = cloned[0]?.history12.length ?? 12;
  const histTarget = Math.max(0, 100 - baseline.nationalPoll);
  for (let hIdx = 0; hIdx < historyLen; hIdx += 1) {
    const norm = normalizeVectorToTarget(
      cloned.map((p) => p.history12[hIdx] ?? 0.2),
      histTarget
    );
    cloned.forEach((p, idx) => {
      p.history12[hIdx] = norm[idx];
    });
  }

  // 2. Scala le fasce demografiche e regionali di ogni partito affinché la media pesata
  // coincida con il sondaggio nazionale reale di Novembre 2026 (history12[last])
  const demoKeys: DemographicId[] = ['giovani', 'lavoratori', 'imprese', 'pensionati'];
  const macroKeys: MacroRegionId[] = ['nord_ovest', 'nord_est', 'centro', 'sud', 'isole'];
  const demoWeights = DEMOGRAPHICS.reduce(
    (acc, d) => {
      acc[d.id] = d.weight;
      return acc;
    },
    {} as Record<DemographicId, number>
  );

  for (const p of cloned) {
    const targetNat = p.history12[historyLen - 1] ?? 0.2;
    const currentDemoAvg = demoKeys.reduce(
      (acc, d) => acc + p.demographics[d] * demoWeights[d],
      0
    );
    if (currentDemoAvg > 0) {
      const ratio = targetNat / currentDemoAvg;
      for (const d of demoKeys) {
        p.demographics[d] = Math.round(p.demographics[d] * ratio * 100) / 100;
      }
    }

    const currentRegAvg = ITALIAN_REGIONS.reduce((acc, r) => {
      const val = p.regionOverrides?.[r.id] ?? p.regions[r.macroRegion];
      return acc + val * r.populationWeight;
    }, 0);
    if (currentRegAvg > 0) {
      const ratio = targetNat / currentRegAvg;
      for (const m of macroKeys) {
        p.regions[m] = Math.round(p.regions[m] * ratio * 100) / 100;
      }
      if (p.regionOverrides) {
        for (const rId of Object.keys(p.regionOverrides) as RegionId[]) {
          const v = p.regionOverrides[rId];
          if (typeof v === 'number') {
            p.regionOverrides[rId] = Math.round(v * ratio * 100) / 100;
          }
        }
      }
    }
  }

  // 3. Normalizza ciascuna fascia demografica a (100.0 - baseline.demographics[d])
  for (const d of demoKeys) {
    const target = Math.max(0, 100 - baseline.demographics[d]);
    const norm = normalizeVectorToTarget(
      cloned.map((p) => p.demographics[d]),
      target
    );
    cloned.forEach((p, idx) => {
      p.demographics[d] = norm[idx];
    });
  }

  return cloned;
}

export const EXISTING_PARTIES_2026: ExistingPartyPreset[] = normalizeExistingPartyPresets(
  RAW_EXISTING_PARTIES_2026,
  MINOR_PARTIES_BASELINE
);

export const EXECUTIVE_ROLE_LABELS: Record<ExecutiveRole, string> = {
  vice_segretario: 'Vice-Segretario',
  economia: 'Responsabile Economia',
  comunicazione: 'Responsabile Comunicazione',
  capogruppo: 'Capogruppo Parlamentare',
  enti_locali: 'Resp. Territorio & Welfare',
  esteri_riforme: 'Resp. Esteri & Riforme',
};

export function inferExecutiveSpecialization(
  role: ExecutiveRole,
  faction = ''
): ExecutiveSpecialization {
  const f = faction.toLowerCase();
  if (f.includes('clima') || f.includes('ecolog') || f.includes('circolar') || f.includes('verde')) {
    return 'ambiente';
  }
  if (f.includes('sanit') || f.includes('welfare') || f.includes('social') || f.includes('salute')) {
    return 'sanita';
  }
  if (f.includes('scuola') || f.includes('universit') || f.includes('giovani') || f.includes('merito')) {
    return 'istruzione';
  }
  if (f.includes('infrastrutt') || f.includes('sud') || f.includes('sviluppo') || f.includes('mezzogiorno') || f.includes('amministrator')) {
    return 'infrastrutture';
  }
  if (f.includes('europ') || f.includes('ester') || f.includes('diplom') || f.includes('agenda')) {
    return 'esteri';
  }
  if (f.includes('diritt') || f.includes('giustiz') || f.includes('legalit') || f.includes('istituz')) {
    return 'giustizia';
  }
  if (f.includes('patria') || f.includes('sicurezz') || f.includes('territor') || f.includes('nord')) {
    return 'interni';
  }
  switch (role) {
    case 'economia':
      return 'economia';
    case 'vice_segretario':
      return 'interni';
    case 'comunicazione':
      return 'istruzione';
    case 'capogruppo':
      return 'giustizia';
    case 'enti_locali':
      return 'sanita';
    case 'esteri_riforme':
      return 'esteri';
    default:
      return 'economia';
  }
}

export function createInitialExecutives(
  orientation: OrientationId,
  leaderStyle: LeadershipStyle
): ExecutiveMember[] {
  const loyaltyBonus = leaderStyle === 'stratega' ? 12 : 0;

  const factionMap: Record<OrientationId, [string, string, string, string, string, string]> = {
    riformista: [
      'Ala Liberale',
      'Tecnici del Tesoro',
      'Generazione Digitale',
      'Riformisti Senato',
      'Welfare & Territori',
      'Agenda Europea',
    ],
    conservatore: [
      'Tradizione & Patria',
      'Impresa Italia',
      'Nuova Destra Media',
      'Garantisti & Legge',
      'Territori & Opere',
      'Diplomazia Atlantica',
    ],
    progressista: [
      'Diritti & Città',
      'Economia Circolare',
      'Scuola & Giovani',
      'Rete Clima',
      'Sanità Pubblica',
      'Europa Federale',
    ],
    populista: [
      'Piattaforma Base',
      'Welfare Civico',
      'Rete Attivisti',
      'Legalità & Giustizia',
      'Territori & Infrastrutture',
      'Transizione Verde',
    ],
    socialista: [
      'Area Lavoro',
      'Sinistra Riformista',
      'Scuola & Ricerca',
      'Garanzie Costituzionali',
      'Sanità & Sindaci',
      'Transizione Ecologica',
    ],
    moderato: [
      'Popolari Europei',
      'Ceto Produttivo',
      'Area Cattolica & Scuola',
      'Garantismo Istituzionale',
      'Amministratori & Sanità',
      'Diplomazia UE',
    ],
    territorialista: [
      'Mezzogiorno Attivo',
      'Sviluppo Sud',
      'Rete Civica Isole',
      'Autonomia & Giustizia',
      'Grandi Opere & Porti',
      'Energia & Ambiente',
    ],
    tecnopragmatico: [
      'Hub Innovazione',
      'Finanza & Mercati',
      'Università & AI Lab',
      'Riforma Giustizia',
      'Reti & Infrastrutture',
      'Agenda Europea',
    ],
  };

  // 6 distinct specializations tailored to each political orientation
  const specMap: Record<
    OrientationId,
    [
      ExecutiveSpecialization,
      ExecutiveSpecialization,
      ExecutiveSpecialization,
      ExecutiveSpecialization,
      ExecutiveSpecialization,
      ExecutiveSpecialization,
    ]
  > = {
    riformista: ['interni', 'economia', 'istruzione', 'giustizia', 'sanita', 'esteri'],
    conservatore: ['interni', 'economia', 'istruzione', 'giustizia', 'infrastrutture', 'esteri'],
    progressista: ['interni', 'economia', 'istruzione', 'ambiente', 'sanita', 'esteri'],
    populista: ['interni', 'economia', 'sanita', 'giustizia', 'infrastrutture', 'ambiente'],
    socialista: ['interni', 'economia', 'istruzione', 'giustizia', 'sanita', 'ambiente'],
    moderato: ['interni', 'economia', 'istruzione', 'giustizia', 'sanita', 'esteri'],
    territorialista: ['interni', 'economia', 'sanita', 'giustizia', 'infrastrutture', 'ambiente'],
    tecnopragmatico: ['esteri', 'economia', 'istruzione', 'giustizia', 'infrastrutture', 'ambiente'],
  };

  const factions = factionMap[orientation];
  const specs = specMap[orientation];

  return [
    {
      id: 'exec_vice',
      role: 'vice_segretario',
      roleLabel: EXECUTIVE_ROLE_LABELS.vice_segretario,
      name: 'Alessandro Rinaldi',
      faction: factions[0],
      specialization: specs[0],
      competence: 74,
      loyalty: Math.min(95, 68 + loyaltyBonus),
      ambition: 76,
      trait: 'Organizzatore di Circoli (+Tesseramento)',
      lowLoyaltyWeeks: 0,
    },
    {
      id: 'exec_econ',
      role: 'economia',
      roleLabel: EXECUTIVE_ROLE_LABELS.economia,
      name: 'Dott.ssa Laura Pellegrini',
      faction: factions[1],
      specialization: specs[1],
      competence: 81,
      loyalty: Math.min(95, 74 + loyaltyBonus),
      ambition: 54,
      trait: 'Ex Consulente MEF (-10% costi fissi)',
      lowLoyaltyWeeks: 0,
    },
    {
      id: 'exec_comm',
      role: 'comunicazione',
      roleLabel: EXECUTIVE_ROLE_LABELS.comunicazione,
      name: 'Davide Moretti',
      faction: factions[2],
      specialization: specs[2],
      competence: 77,
      loyalty: Math.min(95, 72 + loyaltyBonus),
      ambition: 62,
      trait: 'Spin Doctor TV & Social (+Impatto campagne)',
      lowLoyaltyWeeks: 0,
    },
    {
      id: 'exec_capo',
      role: 'capogruppo',
      roleLabel: EXECUTIVE_ROLE_LABELS.capogruppo,
      name: 'On. Roberto Cattaneo',
      faction: factions[3],
      specialization: specs[3],
      competence: 73,
      loyalty: Math.min(95, 63 + loyaltyBonus),
      ambition: 80,
      trait: 'Mediatore d’Aula (+Relazioni coalizione)',
      lowLoyaltyWeeks: 0,
    },
    {
      id: 'exec_terr',
      role: 'enti_locali',
      roleLabel: EXECUTIVE_ROLE_LABELS.enti_locali,
      name: 'Dott.ssa Chiara Bellini',
      faction: factions[4],
      specialization: specs[4],
      competence: 78,
      loyalty: Math.min(95, 71 + loyaltyBonus),
      ambition: 58,
      trait: 'Ex Assessore Regionale (+Radicamento locale)',
      lowLoyaltyWeeks: 0,
    },
    {
      id: 'exec_est',
      role: 'esteri_riforme',
      roleLabel: EXECUTIVE_ROLE_LABELS.esteri_riforme,
      name: 'Amb. Marco Valenti',
      faction: factions[5],
      specialization: specs[5],
      competence: 80,
      loyalty: Math.min(95, 70 + loyaltyBonus),
      ambition: 60,
      trait: 'Sherpa Europeo (+Credibilità dossier UE)',
      lowLoyaltyWeeks: 0,
    },
  ];
}

export const REPLACEMENT_CANDIDATES: Record<
  ExecutiveRole,
  {
    name: string;
    faction: string;
    specialization: ExecutiveSpecialization;
    competence: number;
    loyalty: number;
    ambition: number;
    trait: string;
  }[]
> = {
  vice_segretario: [
    {
      name: 'Francesca De Luca',
      faction: 'Fedelissimi del Leader',
      specialization: 'interni',
      competence: 75,
      loyalty: 88,
      ambition: 48,
      trait: 'Fedeltà Assoluta (-Rischio scissione)',
    },
    {
      name: 'Stefano Lombardi',
      faction: 'Rete Amministratori',
      specialization: 'infrastrutture',
      competence: 84,
      loyalty: 70,
      ambition: 72,
      trait: 'Ex Sindaco (+Tour Territoriale)',
    },
  ],
  economia: [
    {
      name: 'Prof. Enrico Galli',
      faction: 'Accademia Indipendente',
      specialization: 'economia',
      competence: 89,
      loyalty: 78,
      ambition: 40,
      trait: 'Rigore Fiscale (+Consenso Imprese)',
    },
    {
      name: 'Silvia Ferraro',
      faction: 'Area Sociale',
      specialization: 'sanita',
      competence: 78,
      loyalty: 84,
      ambition: 50,
      trait: 'Welfare Sostenibile (+Lavoratori)',
    },
  ],
  comunicazione: [
    {
      name: 'Marta Greco',
      faction: 'Media & Scuola',
      specialization: 'istruzione',
      competence: 85,
      loyalty: 80,
      ambition: 55,
      trait: 'Regia Virale (+Campagne Social)',
    },
    {
      name: 'Luca Barbieri',
      faction: 'Stampa Parlamentare',
      specialization: 'ambiente',
      competence: 79,
      loyalty: 82,
      ambition: 45,
      trait: 'Gestione Crisi (-Danni scandali)',
    },
  ],
  capogruppo: [
    {
      name: 'Sen. Paola Fontana',
      faction: 'Ala Istituzionale',
      specialization: 'giustizia',
      competence: 83,
      loyalty: 85,
      ambition: 44,
      trait: 'Diplomazia Parlamentare (+Coalizioni)',
    },
    {
      name: 'On. Giorgio Serra',
      faction: 'Giovani Deputati',
      specialization: 'interni',
      competence: 76,
      loyalty: 79,
      ambition: 64,
      trait: 'Ostruzionismo d’Aula (+Visibilità TV)',
    },
  ],
  enti_locali: [
    {
      name: 'Dott. Andrea Conti',
      faction: 'Sanità & Regioni',
      specialization: 'sanita',
      competence: 84,
      loyalty: 82,
      ambition: 48,
      trait: 'Manager Sanitario (+Efficienza SSN)',
    },
    {
      name: 'Ing. Matteo Ferri',
      faction: 'Cantieri & Logistica',
      specialization: 'infrastrutture',
      competence: 86,
      loyalty: 79,
      ambition: 56,
      trait: 'Commissario Grandi Opere (+Territori)',
    },
  ],
  esteri_riforme: [
    {
      name: 'Amb. Giulia Marchetti',
      faction: 'Diplomazia Europea',
      specialization: 'esteri',
      competence: 87,
      loyalty: 83,
      ambition: 46,
      trait: 'Negoziatrice Bruxelles (+Rapporti UE)',
    },
    {
      name: 'Prof.ssa Elena Rizzo',
      faction: 'Transizione Verde',
      specialization: 'ambiente',
      competence: 85,
      loyalty: 81,
      ambition: 52,
      trait: 'Esperta Clima & Energia (+Giovani)',
    },
  ],
};

export const ITALIAN_MONTHS = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre',
];

/** Week 1 = Settimana 1, Novembre 2026 */
export function formatGameDate(week: number): {
  weekOfMonth: number;
  monthName: string;
  year: number;
  shortLabel: string;
  fullLabel: string;
} {
  const zeroBased = Math.max(0, week - 1);
  const weekOfMonth = (zeroBased % 4) + 1;
  const totalMonthsFromNov2026 = Math.floor(zeroBased / 4);
  const monthIndex = (10 + totalMonthsFromNov2026) % 12; // 10 = Novembre
  const year = 2026 + Math.floor((10 + totalMonthsFromNov2026) / 12);
  const monthName = ITALIAN_MONTHS[monthIndex];
  const shortMonth = monthName.slice(0, 3);
  return {
    weekOfMonth,
    monthName,
    year,
    shortLabel: `S${weekOfMonth} ${shortMonth} ${year}`,
    fullLabel: `Settimana ${weekOfMonth} · ${monthName} ${year}`,
  };
}

/** Gradimento personale realistico (0–100%) dei leader italiani a Novembre 2026 */
export const DEFAULT_LEADER_APPROVAL: Record<string, number> = {
  fdi: 44, // Giorgia Meloni
  fi: 36, // Antonio Tajani
  pd: 34, // Elly Schlein
  m5s: 33, // Giuseppe Conte
  fn: 31, // Roberto Vannacci
  lega: 27, // Matteo Salvini
  avs: 26, // Nicola Fratoianni
  az: 24, // Carlo Calenda
  sud_chiama_nord: 23, // Cateno De Luca
  piu_europa: 22, // Riccardo Magi
  noi_moderati: 21, // Maurizio Lupi
  ptd: 21, // Michele Santoro
  svp: 20, // Dieter Steger
  iv: 19, // Matteo Renzi
  orizzonti_liberali: 19, // Luigi Marattin
  dsp: 18, // Marco Rizzo
  alternativa_popolare: 18, // Stefano Bandecchi
  prc: 17, // Maurizio Acerbo
  liberta_italexit: 17, // Gianluigi Paragone
  potere_al_popolo: 16, // Marta Collot
  psi: 16, // Enzo Maraio
  possibile: 16, // Francesca Frediani
  dc: 15, // Totò Cuffaro
  indipendenza: 15, // Gianni Alemanno
  pci: 14, // Mauro Alboresi
  player_custom: 24,
};

export function buildDefaultLeaderApproval(
  parties: PartyState[],
  playerPartyId: string,
  leaderStyle?: LeadershipStyle,
  traits?: LeaderTraitId[]
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const p of parties) {
    if (p.id === 'altri') continue;
    let base =
      DEFAULT_LEADER_APPROVAL[p.id] ??
      Math.max(12, Math.min(52, Math.round(14 + p.nationalPoll * 0.9)));
    if (p.id === playerPartyId && p.id === 'player_custom') {
      base = p.nationalPoll < 0.1 ? 14 : 24;
      if (leaderStyle === 'carismatico') base += 3;
      if (traits?.includes('volto_nuovo')) base += 3;
      if (traits?.includes('oratore_tv')) base += 2;
    }
    result[p.id] = Math.max(5, Math.min(95, Math.round(base)));
  }
  return result;
}


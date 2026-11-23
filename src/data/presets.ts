import {
  DemographicId,
  EmblemId,
  ExecutiveMember,
  ExecutiveRole,
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
    cameraColleges: 40,
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
    senatoColleges: 17,
  },
  {
    id: 'isole',
    label: 'Isole',
    weight: 0.11,
    regionsList: 'Sicilia, Sardegna',
    cameraColleges: 17,
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
    startingBudget: 620000,
    establishedBasePoll: 4.8,
    committeeBasePoll: 1.9,
    demoAffinity: { giovani: 1.15, lavoratori: 0.9, imprese: 1.45, pensionati: 0.75 },
    regionAffinity: { nord_ovest: 1.35, nord_est: 1.15, centro: 1.1, sud: 0.65, isole: 0.65 },
    effectSummary: '+Imprese e Nord-Ovest · Budget alto · Forte credibilità UE',
  },
  {
    id: 'conservatore',
    label: 'Conservatore',
    shortDesc: 'Identità nazionale, sicurezza, sostegno a famiglie e piccole imprese.',
    axis: { economic: 55, society: -55, europe: -15, institutions: -25 },
    startingBudget: 540000,
    establishedBasePoll: 5.4,
    committeeBasePoll: 2.1,
    demoAffinity: { giovani: 0.85, lavoratori: 0.95, imprese: 1.35, pensionati: 1.1 },
    regionAffinity: { nord_ovest: 1.1, nord_est: 1.25, centro: 1.0, sud: 0.9, isole: 0.95 },
    effectSummary: '+Imprese e Pensionati · Forte al Nord-Est · Base stabile',
  },
  {
    id: 'progressista',
    label: 'Progressista / Ambientalista',
    shortDesc: 'Transizione ecologica, diritti civili, università e mobilità verde.',
    axis: { economic: -55, society: 85, europe: 50, institutions: -72 },
    startingBudget: 360000,
    establishedBasePoll: 4.5,
    committeeBasePoll: 2.0,
    demoAffinity: { giovani: 1.65, lavoratori: 1.05, imprese: 0.55, pensionati: 0.8 },
    regionAffinity: { nord_ovest: 1.15, nord_est: 1.1, centro: 1.3, sud: 0.7, isole: 0.75 },
    effectSummary: '++Giovani e Centro urbano · Budget snello · Alta mobilitazione social',
  },
  {
    id: 'populista',
    label: 'Populista / Anti-sistema',
    shortDesc: 'Rottura con gli apparati, democrazia diretta e protezione sociale.',
    axis: { economic: -35, society: 10, europe: -55, institutions: -20 },
    startingBudget: 310000,
    establishedBasePoll: 5.1,
    committeeBasePoll: 2.3,
    demoAffinity: { giovani: 1.2, lavoratori: 1.3, imprese: 0.8, pensionati: 0.8 },
    regionAffinity: { nord_ovest: 0.7, nord_est: 0.75, centro: 0.95, sud: 1.45, isole: 1.4 },
    effectSummary: '+Sud, Isole e Lavoratori · Costi bassi · Media ad alto impatto',
  },
  {
    id: 'socialista',
    label: 'Socialista / Lavoro',
    shortDesc: 'Salario minimo, tutela sindacale, sanità pubblica e fisco progressivo.',
    axis: { economic: -72, society: 62, europe: 40, institutions: -70 },
    startingBudget: 410000,
    establishedBasePoll: 4.7,
    committeeBasePoll: 1.8,
    demoAffinity: { giovani: 1.05, lavoratori: 1.5, imprese: 0.45, pensionati: 1.15 },
    regionAffinity: { nord_ovest: 0.95, nord_est: 1.05, centro: 1.35, sud: 0.95, isole: 0.8 },
    effectSummary: '++Lavoratori e Pensionati · Radicamento Centro · Dialogo sindacale',
  },
  {
    id: 'moderato',
    label: 'Moderato / Popolare',
    shortDesc: 'Tradizione cattolico-democratica, stabilità dei conti e dialogo istituzionale.',
    axis: { economic: 32, society: -15, europe: 72, institutions: -75 },
    startingBudget: 590000,
    establishedBasePoll: 4.9,
    committeeBasePoll: 1.9,
    demoAffinity: { giovani: 0.7, lavoratori: 0.95, imprese: 1.2, pensionati: 1.35 },
    regionAffinity: { nord_ovest: 1.1, nord_est: 1.05, centro: 0.95, sud: 1.0, isole: 1.1 },
    effectSummary: '+Pensionati e Imprese · Facile fare coalizioni · Budget solido',
  },
  {
    id: 'territorialista',
    label: 'Territorialista / Sud',
    shortDesc: 'Infrastrutture del Mezzogiorno, coesione territoriale e rilancio produttivo.',
    axis: { economic: -25, society: -10, europe: -20, institutions: -40 },
    startingBudget: 350000,
    establishedBasePoll: 4.6,
    committeeBasePoll: 2.2,
    demoAffinity: { giovani: 1.15, lavoratori: 1.25, imprese: 0.95, pensionati: 0.85 },
    regionAffinity: { nord_ovest: 0.45, nord_est: 0.45, centro: 0.85, sud: 1.95, isole: 1.75 },
    effectSummary: '+++Sud e Isole · Forte peso nei collegi meridionali · Budget medio',
  },
  {
    id: 'tecnopragmatico',
    label: 'Tecno-Pragmatico',
    shortDesc: 'Intelligenza artificiale, energia pulita, sburocratizzazione e finanza pubblica.',
    axis: { economic: 48, society: 40, europe: 88, institutions: -55 },
    startingBudget: 660000,
    establishedBasePoll: 4.4,
    committeeBasePoll: 1.8,
    demoAffinity: { giovani: 1.35, lavoratori: 0.85, imprese: 1.5, pensionati: 0.6 },
    regionAffinity: { nord_ovest: 1.45, nord_est: 1.25, centro: 1.05, sud: 0.55, isole: 0.55 },
    effectSummary: '+Imprese, Giovani e Nord · Budget massimo · Sblocca dossier tech',
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

export const EXISTING_PARTIES_2026: ExistingPartyPreset[] = [
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
    startingBudget: 1200000,
    weeklyOverhead: 76000,
    startingHq: ['lazio', 'lombardia'],
    internalTension: 'Media · Equilibri su Manovra 2027 e rapporti con Bruxelles',
    description:
      'Primo partito italiano e perno della maggioranza di governo. Leadership solida, forte radicamento al Nord e nel Lazio, esposto al logoramento da Palazzo Chigi.',
    demographics: { giovani: 20.5, lavoratori: 27.6, imprese: 37.8, pensionati: 31.8 },
    regions: { nord_ovest: 30.8, nord_est: 31.2, centro: 29.8, sud: 25.5, isole: 27.2 },
    regionOverrides: {
      lombardia: 31.8,
      piemonte: 31.4,
      veneto: 35.6,
      friuli_vg: 34.2,
      trentino_aa: 29.4,
      emilia_romagna: 24.8,
      toscana: 25.4,
      umbria: 28.6,
      marche: 32.8,
      lazio: 33.4,
      abruzzo: 33.8,
      molise: 30.5,
      campania: 21.8,
      puglia: 28.2,
      basilicata: 27.4,
      calabria: 24.6,
      sicilia: 27.8,
      sardegna: 25.4,
    },
    history12: [28.4, 28.9, 29.3, 28.7, 29.1, 29.8, 29.2, 28.8, 29.5, 29.9, 29.1, 29.4],
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
    startingBudget: 980000,
    weeklyOverhead: 70000,
    startingHq: ['emilia_romagna', 'lazio'],
    internalTension: 'Alta · Equilibrio fra ala riformista e linea sociale',
    description:
      'Principale forza d’opposizione con roccaforti storiche in Emilia-Romagna, Toscana e Umbria. Sfida chiave: rendere competitivo il Campo Largo nei collegi del Sud e del Nord.',
    demographics: { giovani: 20.8, lavoratori: 25.2, imprese: 11.8, pensionati: 27.6 },
    regions: { nord_ovest: 23.2, nord_est: 24.8, centro: 29.6, sud: 17.5, isole: 16.4 },
    regionOverrides: {
      valle_daosta: 24.5,
      piemonte: 23.8,
      liguria: 26.8,
      lombardia: 22.4,
      trentino_aa: 23.6,
      veneto: 19.2,
      friuli_vg: 21.5,
      emilia_romagna: 34.8,
      toscana: 33.6,
      umbria: 30.2,
      marche: 26.4,
      lazio: 24.2,
      abruzzo: 21.8,
      molise: 19.2,
      campania: 18.4,
      puglia: 21.2,
      basilicata: 20.4,
      calabria: 16.8,
      sicilia: 15.2,
      sardegna: 23.6,
    },
    history12: [21.6, 22.2, 22.8, 22.4, 21.9, 22.3, 23.1, 22.7, 22.2, 22.9, 22.4, 22.6],
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
    startingBudget: 540000,
    weeklyOverhead: 44000,
    startingHq: ['campania'],
    internalTension: 'Media · Dibattito sull’autonomia rispetto al PD',
    description:
      'Forza radicata nel Mezzogiorno, prima in Campania e fortissima in Sicilia, Puglia e Calabria. Agenda centrata su welfare, salari e politica estera critica.',
    demographics: { giovani: 16.2, lavoratori: 15.6, imprese: 6.4, pensionati: 9.8 },
    regions: { nord_ovest: 7.4, nord_est: 6.5, centro: 11.4, sud: 23.2, isole: 20.4 },
    regionOverrides: {
      lombardia: 6.8,
      piemonte: 8.2,
      liguria: 11.4,
      veneto: 5.4,
      emilia_romagna: 8.8,
      toscana: 8.6,
      lazio: 12.8,
      abruzzo: 14.4,
      molise: 19.6,
      campania: 27.6,
      puglia: 21.8,
      basilicata: 22.4,
      calabria: 23.4,
      sicilia: 21.8,
      sardegna: 20.6,
    },
    history12: [13.5, 13.1, 12.6, 12.9, 13.2, 12.7, 12.1, 11.8, 12.3, 12.7, 12.2, 12.4],
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
    startingBudget: 890000,
    weeklyOverhead: 54000,
    startingHq: ['lombardia'],
    internalTension: 'Bassa · Competizione al centro per i voti moderati',
    description:
      'Anima liberale, popolare ed europeista del Centrodestra di governo. Forte in Sicilia, Calabria, Lombardia e tra imprese e ceto moderato.',
    demographics: { giovani: 5.4, lavoratori: 7.1, imprese: 12.8, pensionati: 11.9 },
    regions: { nord_ovest: 9.2, nord_est: 7.4, centro: 7.6, sud: 11.4, isole: 12.8 },
    regionOverrides: {
      lombardia: 9.8,
      piemonte: 9.2,
      veneto: 7.4,
      emilia_romagna: 6.4,
      lazio: 8.6,
      campania: 10.6,
      puglia: 10.2,
      calabria: 16.4,
      sicilia: 15.8,
      sardegna: 8.4,
    },
    history12: [8.6, 8.8, 9.1, 8.9, 9.2, 9.5, 9.3, 9.0, 9.1, 9.4, 9.6, 9.3],
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
    startingBudget: 660000,
    weeklyOverhead: 52000,
    startingHq: ['veneto'],
    internalTension: 'Alta · I governatori del Nord chiedono centralità territoriale',
    description:
      'Forza radicata nel Nord produttivo, in particolare Veneto, Lombardia e Friuli-VG. Priorità su autonomia differenziata, infrastrutture, flat tax e sicurezza.',
    demographics: { giovani: 6.1, lavoratori: 8.5, imprese: 13.4, pensionati: 6.1 },
    regions: { nord_ovest: 11.8, nord_est: 13.4, centro: 5.6, sud: 4.5, isole: 4.8 },
    regionOverrides: {
      valle_daosta: 13.5,
      lombardia: 13.8,
      piemonte: 10.4,
      liguria: 9.4,
      trentino_aa: 14.6,
      veneto: 18.4,
      friuli_vg: 15.2,
      emilia_romagna: 8.4,
      toscana: 6.2,
      lazio: 5.2,
      campania: 3.4,
      puglia: 4.2,
      calabria: 5.8,
      sicilia: 5.2,
      sardegna: 5.0,
    },
    history12: [8.9, 8.6, 8.2, 8.5, 8.8, 8.3, 8.1, 8.4, 8.7, 8.2, 8.5, 8.4],
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
    startingBudget: 360000,
    weeklyOverhead: 31000,
    startingHq: ['toscana'],
    internalTension: 'Bassa · Forte spinta tra giovani e città universitarie',
    description:
      'Coalizione ecologista e di sinistra in consolidamento nei centri urbani e tra gli under 35. Agenda chiara su transizione climatica, diritti civili e lavoro.',
    demographics: { giovani: 14.8, lavoratori: 6.3, imprese: 2.1, pensionati: 3.8 },
    regions: { nord_ovest: 6.8, nord_est: 6.5, centro: 8.0, sud: 4.8, isole: 4.6 },
    regionOverrides: {
      lombardia: 7.0,
      piemonte: 7.4,
      liguria: 7.6,
      emilia_romagna: 8.2,
      toscana: 9.4,
      lazio: 7.8,
      campania: 5.4,
      sardegna: 6.8,
    },
    history12: [5.7, 5.9, 6.2, 6.0, 5.8, 6.1, 6.5, 6.4, 6.1, 6.2, 6.5, 6.3],
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
    startingBudget: 510000,
    weeklyOverhead: 38000,
    startingHq: ['lombardia'],
    internalTension: 'Media · Sfida per consolidare il Polo Riformista sopra il 4%',
    description:
      'Partito liberal-riformista concentrato su politica industriale, energia nucleare, sanità efficiente e competenza tecnica. Forte nei grandi capoluoghi del Nord e a Roma.',
    demographics: { giovani: 6.4, lavoratori: 3.1, imprese: 8.8, pensionati: 2.5 },
    regions: { nord_ovest: 6.2, nord_est: 4.8, centro: 4.9, sud: 2.9, isole: 2.6 },
    regionOverrides: {
      lombardia: 6.8,
      piemonte: 6.0,
      emilia_romagna: 5.2,
      lazio: 5.8,
      campania: 3.2,
      sicilia: 2.5,
    },
    history12: [4.9, 4.7, 4.4, 4.6, 4.8, 4.5, 4.2, 4.4, 4.7, 4.9, 4.5, 4.6],
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
    startingBudget: 440000,
    weeklyOverhead: 33000,
    startingHq: ['toscana'],
    internalTension: 'Alta · Vicina alla soglia del 3%: decisiva la strategia di coalizione',
    description:
      'Forza riformista e centrista con forte capacità di manovra parlamentare e radicamento storico in Toscana. Obiettivo prioritario: superare lo sbarramento del 3% o federare il centro.',
    demographics: { giovani: 3.1, lavoratori: 2.1, imprese: 4.4, pensionati: 2.4 },
    regions: { nord_ovest: 2.8, nord_est: 2.4, centro: 3.9, sud: 2.6, isole: 2.2 },
    regionOverrides: {
      toscana: 6.4,
      lombardia: 3.2,
      lazio: 3.1,
      campania: 3.4,
      sicilia: 2.4,
    },
    history12: [2.5, 2.7, 2.9, 2.6, 2.4, 2.7, 3.0, 2.9, 2.7, 2.6, 2.9, 2.8],
  },
];

export const MINOR_PARTIES_BASELINE: PartyState = {
  id: 'altri',
  name: 'Liste Civiche e Minori',
  acronym: 'ALT',
  color: '#64748B',
  emblem: 'arco',
  orientation: 'moderato',
  axis: { economic: 0, society: 0, europe: 0, institutions: -50 },
  leaderName: 'Movimenti Locali',
  isPlayer: false,
  isInGovernment: false,
  coalitionId: null,
  demographics: { giovani: 6.7, lavoratori: 4.5, imprese: 2.5, pensionati: 4.1 },
  regions: { nord_ovest: 1.8, nord_est: 3.0, centro: 1.8, sud: 7.7, isole: 9.0 },
  regionPolls: ITALIAN_REGIONS.reduce((acc, r) => {
    acc[r.id] = r.id === 'trentino_aa' || r.id === 'valle_daosta' ? 14.0 : r.macroRegion === 'isole' ? 6.5 : 3.6;
    return acc;
  }, {} as Record<RegionId, number>),
  nationalPoll: 4.2,
  previousPoll: 4.2,
  relationWithPlayer: 0,
  coalitionStatus: 'avversario',
  description: 'Liste autonomiste locali (SVP, UV, Sud chiama Nord), sigle extraparlamentari e civiche.',
};

export const EXECUTIVE_ROLE_LABELS: Record<ExecutiveRole, string> = {
  vice_segretario: 'Vice-Segretario',
  economia: 'Responsabile Economia',
  comunicazione: 'Responsabile Comunicazione',
  capogruppo: 'Capogruppo Parlamentare',
};

export function createInitialExecutives(
  orientation: OrientationId,
  leaderStyle: LeadershipStyle
): ExecutiveMember[] {
  const loyaltyBonus = leaderStyle === 'stratega' ? 12 : 0;

  const factionMap: Record<OrientationId, [string, string, string, string]> = {
    riformista: ['Ala Liberale', 'Tecnici del Tesoro', 'Generazione Digitale', 'Riformisti Senato'],
    conservatore: ['Tradizione & Patria', 'Impresa Italia', 'Nuova Destra Media', 'Territori del Nord'],
    progressista: ['Rete Clima', 'Economia Circolare', 'Collettivo Social', 'Diritti & Città'],
    populista: ['Piattaforma Base', 'Welfare Civico', 'Rete Attivisti', 'Gruppo Territoriale'],
    socialista: ['Area Lavoro', 'Sinistra Riformista', 'Giovani Democratici', 'Sindaci Progressisti'],
    moderato: ['Popolari Europei', 'Ceto Produttivo', 'Area Cattolica', 'Amministratori Locali'],
    territorialista: ['Mezzogiorno Attivo', 'Sviluppo Sud', 'Rete Civica Isole', 'Sindaci del Sud'],
    tecnopragmatico: ['Hub Innovazione', 'Finanza & Mercati', 'Data & AI Lab', 'Agenda Europea'],
  };

  const factions = factionMap[orientation];

  return [
    {
      id: 'exec_vice',
      role: 'vice_segretario',
      roleLabel: EXECUTIVE_ROLE_LABELS.vice_segretario,
      name: 'Alessandro Rinaldi',
      faction: factions[0],
      competence: 74,
      loyalty: Math.min(95, 68 + loyaltyBonus),
      ambition: 76,
      trait: 'Organizzatore di Circoli (+Tesseramento)',
    },
    {
      id: 'exec_econ',
      role: 'economia',
      roleLabel: EXECUTIVE_ROLE_LABELS.economia,
      name: 'Dott.ssa Laura Pellegrini',
      faction: factions[1],
      competence: 81,
      loyalty: Math.min(95, 74 + loyaltyBonus),
      ambition: 54,
      trait: 'Ex Consulente MEF (-10% costi fissi)',
    },
    {
      id: 'exec_comm',
      role: 'comunicazione',
      roleLabel: EXECUTIVE_ROLE_LABELS.comunicazione,
      name: 'Davide Moretti',
      faction: factions[2],
      competence: 77,
      loyalty: Math.min(95, 72 + loyaltyBonus),
      ambition: 62,
      trait: 'Spin Doctor TV & Social (+Impatto campagne)',
    },
    {
      id: 'exec_capo',
      role: 'capogruppo',
      roleLabel: EXECUTIVE_ROLE_LABELS.capogruppo,
      name: 'On. Roberto Cattaneo',
      faction: factions[3],
      competence: 71,
      loyalty: Math.min(95, 63 + loyaltyBonus),
      ambition: 80,
      trait: 'Mediatore d’Aula (+Relazioni coalizione)',
    },
  ];
}

export const REPLACEMENT_CANDIDATES: Record<
  ExecutiveRole,
  { name: string; faction: string; competence: number; loyalty: number; ambition: number; trait: string }[]
> = {
  vice_segretario: [
    {
      name: 'Francesca De Luca',
      faction: 'Fedelissimi del Leader',
      competence: 72,
      loyalty: 88,
      ambition: 48,
      trait: 'Fedeltà Assoluta (-Rischio scissione)',
    },
    {
      name: 'Stefano Lombardi',
      faction: 'Rete Amministratori',
      competence: 84,
      loyalty: 66,
      ambition: 72,
      trait: 'Ex Sindaco (+Tour Territoriale)',
    },
  ],
  economia: [
    {
      name: 'Prof. Enrico Galli',
      faction: 'Accademia Indipendente',
      competence: 89,
      loyalty: 78,
      ambition: 40,
      trait: 'Rigore Fiscale (+Consenso Imprese)',
    },
    {
      name: 'Silvia Ferraro',
      faction: 'Area Sociale',
      competence: 76,
      loyalty: 84,
      ambition: 50,
      trait: 'Welfare Sostenibile (+Lavoratori)',
    },
  ],
  comunicazione: [
    {
      name: 'Marta Greco',
      faction: 'Media & Digitale',
      competence: 85,
      loyalty: 80,
      ambition: 55,
      trait: 'Regia Virale (+Campagne Social)',
    },
    {
      name: 'Luca Barbieri',
      faction: 'Stampa Parlamentare',
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
      competence: 83,
      loyalty: 85,
      ambition: 44,
      trait: 'Diplomazia Parlamentare (+Coalizioni)',
    },
    {
      name: 'On. Giorgio Serra',
      faction: 'Giovani Deputati',
      competence: 75,
      loyalty: 79,
      ambition: 64,
      trait: 'Ostruzionismo d’Aula (+Visibilità TV)',
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
  lega: 28, // Matteo Salvini
  avs: 26, // Nicola Fratoianni
  az: 24, // Carlo Calenda
  iv: 19, // Matteo Renzi
  player_custom: 32,
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
      Math.max(16, Math.min(52, Math.round(18 + p.nationalPoll * 0.9)));
    if (p.id === playerPartyId && p.id === 'player_custom') {
      if (leaderStyle === 'carismatico') base += 3;
      if (traits?.includes('volto_nuovo')) base += 3;
      if (traits?.includes('oratore_tv')) base += 2;
    }
    result[p.id] = Math.max(5, Math.min(95, Math.round(base)));
  }
  return result;
}


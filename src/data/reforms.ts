import {
  DemographicId,
  LawDefinition,
  MacroRegionId,
  ParliamentarySubjectId,
  PoliticalAxis,
  StateIndicators,
} from '../types/game';
import { sanitizePlainText } from '../utils/sanitizer';

export interface ReformOptionTemplate {
  id: string;
  label: string;
  orientationTag: string;
  defaultTitle: string;
  shortDesc: string;
  category: 'economica' | 'elettorale' | 'costituzionale';
  requiredMajority: 'semplice' | 'assoluta';
  budgetDelta: number;
  targetAxis: Partial<PoliticalAxis>;
  axisShift: Partial<PoliticalAxis>;
  demoEffects: Partial<Record<DemographicId, number>>;
  regionEffects?: Partial<Record<MacroRegionId, number>>;
  stateEffects: Partial<StateIndicators>;
  quirinaleRisk: number;
  enactedHeadline: string;
}

export interface ParliamentarySubjectDefinition {
  id: ParliamentarySubjectId;
  label: string;
  shortLabel: string;
  commissionLabel: string;
  description: string;
  options: ReformOptionTemplate[];
}

export const PARLIAMENTARY_SUBJECTS: ParliamentarySubjectDefinition[] = [
  {
    id: 'fisco_economia',
    label: 'Fisco & Economia',
    shortLabel: 'Fisco',
    commissionLabel: 'Commissione Bilancio & Finanze',
    description:
      'Aliquote fiscali, sostegno alle imprese, debito pubblico e tassazione dei grandi patrimoni.',
    options: [
      {
        id: 'fisco_cuneo_pmi',
        label: 'Taglio IRAP e Cuneo PMI',
        orientationTag: 'Liberale / Pro-Imprese',
        defaultTitle: 'DDL Semplificazione Fiscale e Taglio Cuneo per le PMI',
        shortDesc:
          'Riduce la pressione fiscale su partite IVA e piccole imprese con copertura su tagli alla spesa improduttiva.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -5500,
        targetAxis: { economic: 48, europe: 10 },
        axisShift: { economic: 5 },
        demoEffects: { imprese: 1.8, lavoratori: 0.4, pensionati: -0.3 },
        regionEffects: { nord_ovest: 0.7, nord_est: 0.8 },
        stateEffects: { spread: 6, socialStability: 1, euRelations: -1 },
        quirinaleRisk: 8,
        enactedHeadline:
          'Approvato il DDL sul taglio del cuneo per le PMI: plauso delle categorie produttive.',
      },
      {
        id: 'fisco_equita_progressiva',
        label: 'Riforma Progressiva & Extraprofitti',
        orientationTag: 'Progressista / Redistributivo',
        defaultTitle: 'DDL Equità Fiscale e Contributo sui Grandi Patrimoni',
        shortDesc:
          'Introduce un prelievo mirato su grandi rendite finanziarie ed extraprofitti per abbassare l’IRPEF ai redditi medi.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -4500,
        targetAxis: { economic: -52, society: 20 },
        axisShift: { economic: -6, society: 2 },
        demoEffects: { lavoratori: 1.9, giovani: 1.0, pensionati: 0.7, imprese: -1.9 },
        regionEffects: { sud: 0.6, centro: 0.5 },
        stateEffects: { spread: 4, socialStability: 3, euRelations: 1 },
        quirinaleRisk: 10,
        enactedHeadline:
          'Passa in Parlamento il DDL Equità Fiscale: scende l’IRPEF per i redditi medio-bassi.',
      },
      {
        id: 'fisco_patto_stabilita_crescita',
        label: 'Piano Industria 5.0 & Conti in Ordine',
        orientationTag: 'Moderato / Pragmatico',
        defaultTitle: 'DDL Credito d’Imposta Industria 5.0 e Rientro del Debito',
        shortDesc:
          'Incentivi selettivi per digitalizzazione e produttività vincolati al rispetto dei saldi di finanza pubblica.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -4000,
        targetAxis: { economic: 15, europe: 40 },
        axisShift: { economic: 2, europe: 3 },
        demoEffects: { imprese: 1.2, lavoratori: 0.7, giovani: 0.8 },
        regionEffects: { nord_ovest: 0.5, centro: 0.4 },
        stateEffects: { spread: -7, socialStability: 1, euRelations: 5 },
        quirinaleRisk: 4,
        enactedHeadline:
          'Via libera al DDL Industria 5.0: i mercati premiano la disciplina di bilancio.',
      },
    ],
  },
  {
    id: 'lavoro_welfare',
    label: 'Lavoro & Welfare',
    shortLabel: 'Lavoro',
    commissionLabel: 'Commissione Lavoro & Previdenza',
    description:
      'Contratti, salari, pensioni, sostegno alla natalità e contrasto alla precarietà.',
    options: [
      {
        id: 'lavoro_salario_contratti',
        label: 'Soglia Salariale & Stop Precarietà',
        orientationTag: 'Sociale / Lavoristi',
        defaultTitle: 'DDL Tutela dei Salari e Limiti ai Contratti a Termine',
        shortDesc:
          'Fissa una soglia minima contrattuale rafforzata e incentiva la trasformazione dei contratti precari in stabili.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -5000,
        targetAxis: { economic: -55, society: 25 },
        axisShift: { economic: -5, society: 2 },
        demoEffects: { lavoratori: 2.1, giovani: 1.7, imprese: -1.6 },
        regionEffects: { sud: 0.7, isole: 0.5 },
        stateEffects: { spread: 7, socialStability: 5 },
        quirinaleRisk: 7,
        enactedHeadline:
          'Approvato il DDL Tutela dei Salari: soddisfazione dei sindacati e dei giovani lavoratori.',
      },
      {
        id: 'lavoro_flessibilita_merito',
        label: 'Detassazione Premi & Flessibilità',
        orientationTag: 'Mercato / Produttività',
        defaultTitle: 'DDL Premi di Produttività e Flessibilità Aziendale',
        shortDesc:
          'Detassa al 5% i premi aziendali e semplifica la contrattazione di secondo livello per premiare il merito.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -4500,
        targetAxis: { economic: 42, society: -5 },
        axisShift: { economic: 4 },
        demoEffects: { imprese: 1.6, lavoratori: 0.9, giovani: 0.4 },
        regionEffects: { nord_est: 0.7, nord_ovest: 0.6 },
        stateEffects: { spread: -2, socialStability: 2 },
        quirinaleRisk: 5,
        enactedHeadline:
          'Diventa legge il DDL sui premi di produttività: spinta alla contrattazione aziendale.',
      },
      {
        id: 'lavoro_famiglia_pensioni',
        label: 'Piano Natalità & Pensioni Minime',
        orientationTag: 'Famiglia / Protezione',
        defaultTitle: 'DDL Assegno Natalità Potenziato e Rivalutazione Pensioni',
        shortDesc:
          'Aumenta gli sgravi per le famiglie con figli e garantisce l’indicizzazione piena delle pensioni medio-basse.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -5500,
        targetAxis: { economic: -10, society: -30 },
        axisShift: { economic: -2, society: -3 },
        demoEffects: { pensionati: 1.9, lavoratori: 1.1, giovani: 0.6 },
        regionEffects: { sud: 0.5, nord_est: 0.4 },
        stateEffects: { spread: 9, socialStability: 4, euRelations: -2 },
        quirinaleRisk: 8,
        enactedHeadline:
          'Approvato il DDL Famiglia e Pensioni: nuove risorse per natalità e assegni minimi.',
      },
    ],
  },
  {
    id: 'sanita_istruzione',
    label: 'Sanità & Istruzione',
    shortLabel: 'Sanità & Scuola',
    commissionLabel: 'Commissione Affari Sociali & Cultura',
    description:
      'Liste d’attesa SSN, assunzioni medici e docenti, università e libertà di scelta educativa.',
    options: [
      {
        id: 'sanita_piano_ssn',
        label: 'Piano Straordinario SSN & Liste d’Attesa',
        orientationTag: 'Sanità Pubblica / Trasversale',
        defaultTitle: 'DDL Rifinanziamento SSN e Abbattimento Liste d’Attesa',
        shortDesc:
          'Sblocca le assunzioni di medici e infermieri negli ospedali pubblici e finanzia le prestazioni serali e festive.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -6000,
        targetAxis: { economic: -32, society: 15 },
        axisShift: { economic: -3 },
        demoEffects: { pensionati: 2.0, lavoratori: 1.4, giovani: 0.7 },
        regionEffects: { sud: 0.8, isole: 0.7, centro: 0.4 },
        stateEffects: { spread: 8, socialStability: 6 },
        quirinaleRisk: 4,
        enactedHeadline:
          'Via libera al Piano Straordinario per la Sanità Pubblica: nuove assunzioni nel SSN.',
      },
      {
        id: 'scuola_ricerca_giovani',
        label: 'Piano Scuola, Università & Ricerca',
        orientationTag: 'Innovazione / Futuro',
        defaultTitle: 'DDL Investimenti su Scuola Pubblica, Borse di Studio e Ricerca',
        shortDesc:
          'Potenzia gli stipendi dei docenti, amplia le borse universitarie e incentiva il rientro dei ricercatori.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -5000,
        targetAxis: { economic: -20, society: 40, europe: 30 },
        axisShift: { society: 4, europe: 2 },
        demoEffects: { giovani: 2.2, lavoratori: 1.0, imprese: 0.5 },
        regionEffects: { centro: 0.5, nord_ovest: 0.5 },
        stateEffects: { spread: 3, socialStability: 3, euRelations: 3 },
        quirinaleRisk: 4,
        enactedHeadline:
          'Approvato il DDL Scuola e Ricerca: più risorse a università e giovani docenti.',
      },
      {
        id: 'sanita_convenzionata_merito',
        label: 'Partenariato Sanitario & Scuole Paritarie',
        orientationTag: 'Sussidiarietà / Centrodestra',
        defaultTitle: 'DDL Sussidiarietà Sanitaria e Buono Scelta Educativa',
        shortDesc:
          'Integra cliniche accreditate per smaltire le liste d’attesa e introduce detrazioni per le scuole paritarie.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -4500,
        targetAxis: { economic: 35, society: -35 },
        axisShift: { economic: 4, society: -3 },
        demoEffects: { imprese: 1.3, pensionati: 0.9, lavoratori: 0.3 },
        regionEffects: { nord_ovest: 0.7, nord_est: 0.6 },
        stateEffects: { spread: 2, socialStability: 1 },
        quirinaleRisk: 7,
        enactedHeadline:
          'Approvato il DDL Sussidiarietà: potenziata la rete sanitaria convenzionata e i buoni scuola.',
      },
    ],
  },
  {
    id: 'giustizia_sicurezza',
    label: 'Giustizia & Sicurezza',
    shortLabel: 'Giustizia',
    commissionLabel: 'Commissione Giustizia & Affari Interni',
    description:
      'Sicurezza urbana, certezza della pena, riforma dei processi e garanzie dei cittadini.',
    options: [
      {
        id: 'sicurezza_decreto_urbano',
        label: 'Piano Sicurezza Urbana & Forze dell’Ordine',
        orientationTag: 'Ordine / Sicurezza',
        defaultTitle: 'DDL Sicurezza Urbana, Certezza della Pena e Organici Forze dell’Ordine',
        shortDesc:
          'Aumenta le pattuglie nelle periferie, inasprisce le pene per i reati predatori e tutela gli agenti in servizio.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -4500,
        targetAxis: { society: -58, institutions: 18 },
        axisShift: { society: -5, institutions: 3 },
        demoEffects: { pensionati: 1.8, imprese: 1.2, lavoratori: 0.7, giovani: -0.9 },
        regionEffects: { nord_ovest: 0.6, nord_est: 0.7 },
        stateEffects: { socialStability: 3, democraticHealth: -2 },
        quirinaleRisk: 16,
        enactedHeadline:
          'Approvato il DDL Sicurezza Urbana: più agenti sul territorio e stretta sui reati predatori.',
      },
      {
        id: 'giustizia_garantista_rapida',
        label: 'Giustizia Rapida & Garantismo Processuale',
        orientationTag: 'Garantista / Liberale',
        defaultTitle: 'DDL Tempi Certi dei Processi e Garanzie della Difesa',
        shortDesc:
          'Digitalizza i tribunali, riduce la durata dei processi civili e penali e limita l’abuso della custodia cautelare.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -4000,
        targetAxis: { economic: 25, society: 5, institutions: -15 },
        axisShift: { economic: 2, institutions: -2 },
        demoEffects: { imprese: 1.5, lavoratori: 0.7, giovani: 0.7 },
        stateEffects: { spread: -4, euRelations: 4, democraticHealth: 3 },
        quirinaleRisk: 8,
        enactedHeadline:
          'Via libera alla riforma garantista della giustizia: tempi certi nei tribunali.',
      },
      {
        id: 'giustizia_anticorruzione_carceri',
        label: 'Anticorruzione & Riforma Carceraria',
        orientationTag: 'Legalità / Diritti',
        defaultTitle: 'DDL Trasparenza Appalti, Anticorruzione e Umanizzazione Carceri',
        shortDesc:
          'Rafforza i controlli sugli appalti pubblici e investe sul recupero sociale e il sovraffollamento penitenziario.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -4000,
        targetAxis: { society: 48, institutions: -30, europe: 20 },
        axisShift: { society: 4, institutions: -4 },
        demoEffects: { giovani: 1.6, lavoratori: 1.0, pensionati: 0.4 },
        stateEffects: { socialStability: 2, euRelations: 3, democraticHealth: 5 },
        quirinaleRisk: 5,
        enactedHeadline:
          'Approvato il DDL Trasparenza e Carceri: norme più severe sugli appalti e piani di recupero.',
      },
    ],
  },
  {
    id: 'ambiente_energia',
    label: 'Ambiente & Energia',
    shortLabel: 'Energia',
    commissionLabel: 'Commissione Ambiente & Transizione',
    description:
      'Rinnovabili, nucleare di nuova generazione, bollette energetiche e tutela idrogeologica.',
    options: [
      {
        id: 'energia_rinnovabili_green',
        label: 'Transizione Verde & Comunità Energetiche',
        orientationTag: 'Ecologista / Rinnovabili',
        defaultTitle: 'DDL Accelerazione Rinnovabili e Stop Sussidi Fossili',
        shortDesc:
          'Semplifica gli impianti solari ed eolici, finanzia comunità energetiche locali e potenzia il trasporto pubblico.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -5000,
        targetAxis: { society: 55, europe: 45, economic: -15 },
        axisShift: { society: 4, europe: 3 },
        demoEffects: { giovani: 2.3, lavoratori: 0.6, imprese: -0.7 },
        regionEffects: { sud: 0.6, isole: 0.7 },
        stateEffects: { spread: 2, socialStability: 2, euRelations: 7 },
        quirinaleRisk: 5,
        enactedHeadline:
          'Approvato il DDL Rinnovabili: Italia più vicina agli obiettivi climatici europei.',
      },
      {
        id: 'energia_nucleare_sicurezza',
        label: 'Nucleare Pulito & Indipendenza Energetica',
        orientationTag: 'Pragmatico / Industriale',
        defaultTitle: 'DDL Quadro per il Nucleare di Nuova Generazione e Reti Energetiche',
        shortDesc:
          'Avvia il quadro normativo per piccoli reattori modulari sicuri e rafforza gli accordi di approvvigionamento nazionale.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -5500,
        targetAxis: { economic: 35, society: -20, europe: 10 },
        axisShift: { economic: 4, society: -2 },
        demoEffects: { imprese: 2.0, giovani: 0.6, lavoratori: 0.3, pensionati: -0.4 },
        regionEffects: { nord_ovest: 0.7, nord_est: 0.6 },
        stateEffects: { spread: -4, socialStability: -2, euRelations: 2 },
        quirinaleRisk: 10,
        enactedHeadline:
          'Via libera al DDL sul Nucleare di nuova generazione: dibattito acceso nel Paese.',
      },
      {
        id: 'ambiente_bollette_dissesto',
        label: 'Difesa Suolo & Taglio Bollette Famiglie',
        orientationTag: 'Territorio / Trasversale',
        defaultTitle: 'DDL Piano Nazionale Contro il Dissesto Idrogeologico e Caro-Bollette',
        shortDesc:
          'Finanzia la messa in sicurezza di fiumi e infrastrutture fragili e abbatte gli oneri di sistema sulle bollette.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -5000,
        targetAxis: { economic: -15, society: 5, europe: 15 },
        axisShift: { economic: -1, society: 1 },
        demoEffects: { pensionati: 1.4, lavoratori: 1.2, imprese: 0.8, giovani: 0.7 },
        regionEffects: { centro: 0.7, sud: 0.7, nord_est: 0.5 },
        stateEffects: { spread: 5, socialStability: 5, euRelations: 2 },
        quirinaleRisk: 4,
        enactedHeadline:
          'Approvato il Piano contro il dissesto idrogeologico e il caro-bollette: voto ampio in Aula.',
      },
    ],
  },
  {
    id: 'diritti_civili',
    label: 'Diritti Civili',
    shortLabel: 'Diritti',
    commissionLabel: 'Commissione Affari Costituzionali & Diritti',
    description:
      'Cittadinanza, fine vita, parità di genere, tutela della famiglia e libertà individuali.',
    options: [
      {
        id: 'diritti_ius_scholae_civili',
        label: 'Ius Scholae & Nuovi Diritti Civili',
        orientationTag: 'Progressista / Libertà Civili',
        defaultTitle: 'DDL Cittadinanza Scolastica e Tutela delle Libertà Civili',
        shortDesc:
          'Introduce la cittadinanza dopo un ciclo scolastico completo in Italia e rafforza la normativa antidiscriminazione.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -3000,
        targetAxis: { society: 68, europe: 35 },
        axisShift: { society: 6, europe: 2 },
        demoEffects: { giovani: 2.3, lavoratori: 0.6, pensionati: -1.1 },
        regionEffects: { centro: 0.6, nord_ovest: 0.4 },
        stateEffects: { socialStability: -2, euRelations: 5, democraticHealth: 4 },
        quirinaleRisk: 8,
        enactedHeadline:
          'Svolta sui diritti civili: il Parlamento approva la riforma della cittadinanza scolastica.',
      },
      {
        id: 'diritti_fine_vita_laico',
        label: 'Legge sul Fine Vita & Parità Salariale',
        orientationTag: 'Riformista / Diritti Individuali',
        defaultTitle: 'DDL Disposizioni sul Fine Vita e Piena Parità Salariale',
        shortDesc:
          'Recepisce i richiami della Corte Costituzionale sul fine vita medicalmente assistito e introduce sanzioni sul divario salariale.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -3000,
        targetAxis: { society: 52, institutions: -15 },
        axisShift: { society: 4, institutions: -2 },
        demoEffects: { giovani: 1.9, lavoratori: 1.1, pensionati: -0.4 },
        stateEffects: { socialStability: 1, democraticHealth: 4, euRelations: 3 },
        quirinaleRisk: 6,
        enactedHeadline:
          'Approvato il DDL su Fine Vita e Parità Salariale: voto trasversale tra i banchi dell’Aula.',
      },
      {
        id: 'diritti_identita_famiglia',
        label: 'Tutela Famiglia Tradizionale & Identità',
        orientationTag: 'Conservatore / Identitario',
        defaultTitle: 'DDL Tutela della Famiglia Naturale e Sicurezza dei Confini',
        shortDesc:
          'Rafforza le tutele giuridiche della famiglia tradizionale, irrigidisce i criteri di cittadinanza e potenzia i rimpatri.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -3500,
        targetAxis: { society: -65, europe: -35 },
        axisShift: { society: -6, europe: -3 },
        demoEffects: { pensionati: 1.6, lavoratori: 0.9, imprese: 0.6, giovani: -1.7 },
        regionEffects: { nord_est: 0.7, nord_ovest: 0.5 },
        stateEffects: { socialStability: -2, euRelations: -6, democraticHealth: -2 },
        quirinaleRisk: 20,
        enactedHeadline:
          'Passa il DDL Famiglia e Confini: festa della destra, dure critiche delle opposizioni.',
      },
    ],
  },
  {
    id: 'riforme_istituzionali',
    label: 'Riforme Istituzionali',
    shortLabel: 'Istituzioni',
    commissionLabel: 'Commissione Affari Costituzionali',
    description:
      'Governabilità, autonomie regionali, trasparenza dei partiti e qualità del Parlamento.',
    options: [
      {
        id: 'istituzioni_sfiducia_costruttiva',
        label: 'Sfiducia Costruttiva & Stabilità',
        orientationTag: 'Istituzionale / Riformista',
        defaultTitle: 'DDL Riforma dei Regolamenti e Sfiducia Costruttiva',
        shortDesc:
          'Riduce l’abuso dei decreti d’urgenza e introduce il meccanismo tedesco della sfiducia costruttiva per stabilizzare i governi.',
        category: 'costituzionale',
        requiredMajority: 'assoluta',
        budgetDelta: -4000,
        targetAxis: { institutions: -15, europe: 30 },
        axisShift: { institutions: -3, europe: 2 },
        demoEffects: { imprese: 1.2, lavoratori: 0.8, giovani: 0.8 },
        stateEffects: { spread: -8, socialStability: 3, democraticHealth: 5, euRelations: 4 },
        quirinaleRisk: 10,
        enactedHeadline:
          'Approvata la sfiducia costruttiva: riforma applaudita dagli osservatori istituzionali.',
      },
      {
        id: 'istituzioni_autonomia_territori',
        label: 'Decentramento & Autonomie Locali',
        orientationTag: 'Autonomista / Territoriale',
        defaultTitle: 'DDL Federalismo Fiscale e Poteri alle Regioni Virtuose',
        shortDesc:
          'Trasferisce competenze amministrative e risorse alle Regioni con bilanci in ordine e definisce i livelli essenziali (LEP).',
        category: 'costituzionale',
        requiredMajority: 'assoluta',
        budgetDelta: -4500,
        targetAxis: { economic: 35, society: -30, institutions: 10 },
        axisShift: { economic: 3, society: -3 },
        demoEffects: { imprese: 1.6, lavoratori: 0.3, pensionati: -0.4 },
        regionEffects: { nord_est: 1.8, nord_ovest: 1.4, sud: -1.5, isole: -1.0 },
        stateEffects: { socialStability: -4, democraticHealth: -2 },
        quirinaleRisk: 22,
        enactedHeadline:
          'Via libera al DDL sul Federalismo Fiscale: entusiasmo al Nord, proteste dei governatori del Sud.',
      },
      {
        id: 'istituzioni_trasparenza_partiti',
        label: 'Legge sui Partiti & Stop Trasformismo',
        orientationTag: 'Trasparenza / Anticasta',
        defaultTitle: 'DDL Democrazia Interna dei Partiti e Limite ai Cambi di Gruppo',
        shortDesc:
          'Attua l’Articolo 49 della Costituzione con bilanci certificati, primarie trasparenti e disincentivi ai cambi di casacca.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -3500,
        targetAxis: { institutions: -40, society: 20 },
        axisShift: { institutions: -4, society: 2 },
        demoEffects: { giovani: 1.8, lavoratori: 1.1, pensionati: 0.8 },
        stateEffects: { socialStability: 4, democraticHealth: 6 },
        quirinaleRisk: 5,
        enactedHeadline:
          'Approvata la legge sulla trasparenza dei partiti: stretta sul trasformismo parlamentare.',
      },
    ],
  },
  {
    id: 'politica_estera_ue',
    label: 'Politica Estera & UE',
    shortLabel: 'Estera & UE',
    commissionLabel: 'Commissione Esteri & Politiche Europee',
    description:
      'Integrazione europea, difesa comune, sovranità commerciale e cooperazione nel Mediterraneo.',
    options: [
      {
        id: 'ue_difesa_integrazione',
        label: 'Integrazione Europea & Difesa Comune',
        orientationTag: 'Europeista / Atlantico',
        defaultTitle: 'DDL Cooperazione Difesa Europea e Debito Comune UE',
        shortDesc:
          'Impegna l’Italia a promuovere appalti congiunti europei, difesa integrata e strumenti finanziari comuni a Bruxelles.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -4500,
        targetAxis: { europe: 68, economic: 15 },
        axisShift: { europe: 6 },
        demoEffects: { imprese: 1.3, giovani: 1.2, lavoratori: 0.5, pensionati: -0.4 },
        stateEffects: { spread: -10, euRelations: 10, socialStability: -1 },
        quirinaleRisk: 5,
        enactedHeadline:
          'Approvato il DDL sull’Integrazione e Difesa Europea: crolla lo spread, plauso da Bruxelles.',
      },
      {
        id: 'ue_tutela_made_in_italy',
        label: 'Clausola Nazionale & Difesa Made in Italy',
        orientationTag: 'Sovranista / Protezionista',
        defaultTitle: 'DDL Tutela del Made in Italy e Clausole di Reciprocità Commerciale',
        shortDesc:
          'Introduce preferenze nazionali sugli appalti strategici, dazi compensativi e deroga ai vincoli UE sulle filiere agricole.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -4500,
        targetAxis: { europe: -62, society: -35 },
        axisShift: { europe: -6, society: -2 },
        demoEffects: { imprese: 1.2, lavoratori: 1.2, pensionati: 0.9, giovani: -0.8 },
        regionEffects: { nord_est: 0.7, sud: 0.6 },
        stateEffects: { spread: 12, euRelations: -10, socialStability: 2 },
        quirinaleRisk: 18,
        enactedHeadline:
          'Passa il DDL sul Made in Italy: entusiasmo delle filiere nazionali, tensione con Bruxelles.',
      },
      {
        id: 'esteri_piano_mediterraneo',
        label: 'Cooperazione Mediterraneo & Hub Energetico',
        orientationTag: 'Pragmatico / Mediterraneo',
        defaultTitle: 'DDL Partenariato Strategico Mediterraneo e Diplomazia Economica',
        shortDesc:
          'Lancia investimenti infrastrutturali ed energetici condivisi con i Paesi del Nord Africa per stabilizzare il Mediterraneo.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -5000,
        targetAxis: { europe: 10, economic: 10, society: -10 },
        axisShift: { europe: 2 },
        demoEffects: { imprese: 1.4, lavoratori: 0.8, pensionati: 0.7 },
        regionEffects: { sud: 0.9, isole: 1.1 },
        stateEffects: { spread: -3, euRelations: 5, socialStability: 2 },
        quirinaleRisk: 4,
        enactedHeadline:
          'Approvato il Partenariato Mediterraneo: l’Italia punta al ruolo di hub energetico europeo.',
      },
    ],
  },
];

export function getParliamentarySubject(
  subjectId: ParliamentarySubjectId
): ParliamentarySubjectDefinition | undefined {
  return PARLIAMENTARY_SUBJECTS.find((s) => s.id === subjectId);
}

export function getReformOption(
  subjectId: ParliamentarySubjectId,
  optionId: string
): ReformOptionTemplate | undefined {
  const subject = getParliamentarySubject(subjectId);
  return subject?.options.find((o) => o.id === optionId);
}

export function buildCustomLawFromReform(
  subjectId: ParliamentarySubjectId,
  optionId: string,
  customTitle?: string,
  uniqueSuffix?: string
): LawDefinition | null {
  const opt = getReformOption(subjectId, optionId);
  if (!opt) return null;

  const cleanTitle = sanitizePlainText(customTitle ?? '', 96, opt.defaultTitle);
  const idSuffix = uniqueSuffix ?? `${Date.now().toString(36)}`;

  return {
    id: `custom_ddl_${subjectId}_${opt.id}_${idSuffix}`,
    category: opt.category,
    title: cleanTitle,
    shortDesc: opt.shortDesc,
    requiredMajority: opt.requiredMajority,
    budgetDelta: opt.budgetDelta,
    targetAxis: { ...opt.targetAxis },
    axisShift: { ...opt.axisShift },
    demoEffects: { ...opt.demoEffects },
    regionEffects: opt.regionEffects ? { ...opt.regionEffects } : undefined,
    stateEffects: { ...opt.stateEffects },
    quirinaleRisk: opt.quirinaleRisk,
    enactedHeadline:
      cleanTitle !== opt.defaultTitle
        ? `Approvato in Parlamento il "${cleanTitle}": entra in vigore il provvedimento.`
        : opt.enactedHeadline,
  };
}

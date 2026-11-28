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

export type ReformAlignmentLevel = 'consigliato' | 'compatibile' | 'trasversale';

export interface ReformAlignmentResult {
  score: number;
  level: ReformAlignmentLevel;
  badgeLabel: string;
  pollHint: string;
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
      {
        id: 'fisco_flat_tax_pace_fiscale',
        label: 'Flat Tax Estesa & Pace Fiscale',
        orientationTag: 'Centrodestra / Sovranista',
        defaultTitle: 'DDL Estensione Flat Tax al 15% e Rottamazione Cartelle',
        shortDesc:
          'Allarga la tassa piatta a partite IVA fino a 100.000 euro e apre una pace fiscale pluriennale con l’Agenzia delle Entrate.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -6200,
        targetAxis: { economic: 64, society: -35, europe: -25 },
        axisShift: { economic: 6, society: -2 },
        demoEffects: { imprese: 2.2, lavoratori: 0.6, pensionati: 0.2, giovani: -0.5 },
        regionEffects: { nord_est: 0.9, nord_ovest: 0.7, sud: 0.3 },
        stateEffects: { spread: 11, socialStability: 2, euRelations: -6 },
        quirinaleRisk: 14,
        enactedHeadline:
          'Via libera alla Flat Tax estesa e alla pace fiscale: esultano autonomi e centrodestra.',
      },
      {
        id: 'fisco_tassa_web_evasione',
        label: 'Lotta all’Evasione & Web Tax Big Tech',
        orientationTag: 'Sinistra / Giustizia Fiscale',
        defaultTitle: 'DDL Contrasto all’Evasione Fiscale e Imposta sui Giganti Digitali',
        shortDesc:
          'Potenzia i controlli incrociati anti-evasione e tassa i ricavi italiani delle multinazionali digitali per finanziare i servizi.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -3200,
        targetAxis: { economic: -42, society: 30, europe: 20 },
        axisShift: { economic: -4, europe: 2 },
        demoEffects: { lavoratori: 1.6, giovani: 1.2, pensionati: 0.9, imprese: -1.1 },
        regionEffects: { centro: 0.6, nord_ovest: 0.4 },
        stateEffects: { spread: -5, socialStability: 3, euRelations: 3 },
        quirinaleRisk: 6,
        enactedHeadline:
          'Approvato il DDL Anti-Evasione e Web Tax: recuperate nuove risorse per il bilancio pubblico.',
      },
      {
        id: 'fisco_zona_franca_mezzogiorno',
        label: 'ZES Unica & Sgravi Industriali Sud',
        orientationTag: 'Sviluppo / Territoriale',
        defaultTitle: 'DDL Zona Economica Speciale Potenziata e Crediti per il Sud',
        shortDesc:
          'Azzera gli oneri contributivi per 3 anni a chi apre stabilimenti e assume giovani nel Mezzogiorno e nelle Isole.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -5200,
        targetAxis: { economic: -15, society: -5, europe: 5 },
        axisShift: { economic: -2 },
        demoEffects: { lavoratori: 1.3, imprese: 1.1, giovani: 1.0 },
        regionEffects: { sud: 1.8, isole: 1.5, nord_est: -0.4 },
        stateEffects: { spread: 4, socialStability: 4, euRelations: 1 },
        quirinaleRisk: 5,
        enactedHeadline:
          'Approvata la ZES potenziata per il Mezzogiorno: forte consenso nelle regioni del Sud.',
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
      {
        id: 'lavoro_settimana_corta_smart',
        label: 'Settimana Corta & Smart Working',
        orientationTag: 'Ecologista / Innovazione Sociale',
        defaultTitle: 'DDL Sperimentazione Settimana Lavorativa di 4 Giorni e Lavoro Agile',
        shortDesc:
          'Introduce sgravi per le aziende che riducono l’orario a parità di salario e rafforza il diritto allo smart working.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -4200,
        targetAxis: { economic: -35, society: 55, europe: 30 },
        axisShift: { economic: -3, society: 4 },
        demoEffects: { giovani: 2.2, lavoratori: 1.5, imprese: -1.2 },
        regionEffects: { nord_ovest: 0.6, centro: 0.6 },
        stateEffects: { spread: 3, socialStability: 4, euRelations: 2 },
        quirinaleRisk: 5,
        enactedHeadline:
          'Approvata la sperimentazione sulla settimana corta: entusiasmo tra giovani e grandi città.',
      },
      {
        id: 'lavoro_quota_pensioni_usuranti',
        label: 'Superamento Fornero & Lavori Usuranti',
        orientationTag: 'Popolare / Sovranista',
        defaultTitle: 'DDL Flessibilità Pensionistica e Uscita Anticipata Lavori Gravosi',
        shortDesc:
          'Amplia l’uscita anticipata con 41 anni di contributi per lavori usuranti, operai edili, infermieri e artigiani.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -6500,
        targetAxis: { economic: -20, society: -45, europe: -35 },
        axisShift: { economic: -2, society: -3, europe: -2 },
        demoEffects: { pensionati: 2.3, lavoratori: 1.4, giovani: -0.9, imprese: -0.4 },
        regionEffects: { nord_est: 0.7, sud: 0.7 },
        stateEffects: { spread: 13, socialStability: 5, euRelations: -6 },
        quirinaleRisk: 11,
        enactedHeadline:
          'Passa la riforma sulle pensioni anticipate: grande consenso tra lavoratori senior, tensioni a Bruxelles.',
      },
      {
        id: 'lavoro_apprendistato_its_giovani',
        label: 'Garanzia Giovani, ITS & Primo Impiego',
        orientationTag: 'Riformista / Liberale',
        defaultTitle: 'DDL Decontribuzione Under 30 e Riforma degli Istituti Tecnici Superiori',
        shortDesc:
          'Taglia i contributi per chi assume under 30 a tempo indeterminato e integra formazione tecnica e imprese.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -4300,
        targetAxis: { economic: 28, society: 15, europe: 35 },
        axisShift: { economic: 2, europe: 2 },
        demoEffects: { giovani: 1.9, imprese: 1.4, lavoratori: 0.7 },
        regionEffects: { nord_ovest: 0.5, nord_est: 0.6, sud: 0.5 },
        stateEffects: { spread: -3, socialStability: 3, euRelations: 4 },
        quirinaleRisk: 4,
        enactedHeadline:
          'Via libera al Piano Giovani e ITS: decontribuzione mirata per rilanciare l’occupazione under 30.',
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
      {
        id: 'sanita_salute_mentale_territorio',
        label: 'Psicologo di Base & Case di Comunità',
        orientationTag: 'Progressista / Salute Territoriale',
        defaultTitle: 'DDL Psicologo di Base Gratuito e Presidi Sanitari Territoriali',
        shortDesc:
          'Istituisce lo psicologo di base nel SSN, finanzia i consultori e potenzia la medicina di prossimità nei quartieri.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -4200,
        targetAxis: { economic: -40, society: 52, europe: 20 },
        axisShift: { economic: -3, society: 4 },
        demoEffects: { giovani: 2.3, lavoratori: 1.1, pensionati: 0.7 },
        regionEffects: { centro: 0.6, sud: 0.6 },
        stateEffects: { spread: 3, socialStability: 5, democraticHealth: 2 },
        quirinaleRisk: 4,
        enactedHeadline:
          'Diventa legge lo Psicologo di Base nel SSN: grande risposta tra giovani e famiglie.',
      },
      {
        id: 'scuola_merito_disciplina_tecnici',
        label: 'Scuola del Merito, Condotta & Licei Tecnologici',
        orientationTag: 'Conservatore / Merito',
        defaultTitle: 'DDL Valorizzazione del Merito Scolastico, Voto in Condotta e Filiera Tecnica',
        shortDesc:
          'Rafforza il peso del voto in condotta, introduce percorsi d’eccellenza e premia i docenti per merito e risultati.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -3600,
        targetAxis: { economic: 22, society: -48 },
        axisShift: { society: -4, economic: 2 },
        demoEffects: { pensionati: 1.4, imprese: 1.2, lavoratori: 0.7, giovani: -1.0 },
        regionEffects: { nord_est: 0.6, nord_ovest: 0.5 },
        stateEffects: { spread: -1, socialStability: 1 },
        quirinaleRisk: 6,
        enactedHeadline:
          'Approvato il DDL Merito e Condotta nella Scuola: dibattito acceso tra famiglie e studenti.',
      },
      {
        id: 'sanita_telemedicina_digitalizzazione',
        label: 'Fascicolo Digitale, AI Medica & Telemedicina',
        orientationTag: 'Liberale / Modernizzatore',
        defaultTitle: 'DDL Sanità Digitale, Telemedicina e Gestione Efficiente ASL',
        shortDesc:
          'Digitalizza referti e prenotazioni uniche nazionali, introduce la telemedicina per cronici e taglia gli sprechi nelle ASL.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -3800,
        targetAxis: { economic: 32, society: 18, europe: 42 },
        axisShift: { economic: 3, europe: 3 },
        demoEffects: { imprese: 1.3, pensionati: 1.2, giovani: 1.1, lavoratori: 0.6 },
        regionEffects: { nord_ovest: 0.6, centro: 0.5 },
        stateEffects: { spread: -5, socialStability: 3, euRelations: 4 },
        quirinaleRisk: 4,
        enactedHeadline:
          'Via libera alla Sanità Digitale e Telemedicina: cure più rapide e meno burocrazia nelle ASL.',
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
      {
        id: 'giustizia_separazione_carriere',
        label: 'Separazione Carriere & Responsabilità Giudici',
        orientationTag: 'Centrodestra / Garantista',
        defaultTitle: 'DDL Separazione delle Carriere dei Magistrati e Riforma del CSM',
        shortDesc:
          'Distingue nettamente i percorsi di giudici e pubblici ministeri con due Consigli superiori separati.',
        category: 'costituzionale',
        requiredMajority: 'assoluta',
        budgetDelta: -3200,
        targetAxis: { economic: 40, society: -20, institutions: 25 },
        axisShift: { economic: 2, institutions: 4 },
        demoEffects: { imprese: 1.8, pensionati: 0.8, lavoratori: 0.2, giovani: -0.5 },
        regionEffects: { nord_ovest: 0.6, nord_est: 0.5 },
        stateEffects: { socialStability: -2, democraticHealth: -2, spread: -2 },
        quirinaleRisk: 18,
        enactedHeadline:
          'Approvata la Separazione delle Carriere: svolta storica, dura reazione della magistratura.',
      },
      {
        id: 'sicurezza_antimafia_beni_confiscati',
        label: 'Piano Antimafia & Riuso Beni Confiscati',
        orientationTag: 'Legalità / Trasversale',
        defaultTitle: 'DDL Potenziamento Direzione Antimafia e Riuso Sociale Beni Confiscati',
        shortDesc:
          'Accelera la confisca dei patrimoni mafiosi e li destina a scuole, presidi civici e startup sociali nei territori a rischio.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -3800,
        targetAxis: { economic: -25, society: 25, institutions: -20 },
        axisShift: { society: 2, institutions: -2 },
        demoEffects: { lavoratori: 1.3, giovani: 1.3, pensionati: 1.0, imprese: 0.4 },
        regionEffects: { sud: 1.4, isole: 1.3, centro: 0.4 },
        stateEffects: { socialStability: 5, democraticHealth: 6, euRelations: 2 },
        quirinaleRisk: 3,
        enactedHeadline:
          'Via libera unanime al Piano Antimafia: più strumenti contro i clan e nuovi presidi civici al Sud.',
      },
      {
        id: 'sicurezza_confini_espulsioni',
        label: 'Stretta Confini, CPR & Rimpatri Rapidi',
        orientationTag: 'Sovranista / Tolleranza Zero',
        defaultTitle: 'DDL Presidio delle Frontiere, Espulsioni Rapide e Blocco Sbarchi Irregolari',
        shortDesc:
          'Potenzia i centri per i rimpatri, stringe gli accordi con i Paesi terzi e introduce procedure accelerate di espulsione.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -4800,
        targetAxis: { society: -72, europe: -48, institutions: 28 },
        axisShift: { society: -6, europe: -4, institutions: 3 },
        demoEffects: { pensionati: 1.9, lavoratori: 1.1, imprese: 0.6, giovani: -1.8 },
        regionEffects: { nord_est: 0.9, nord_ovest: 0.7, isole: 0.6 },
        stateEffects: { socialStability: -2, euRelations: -8, democraticHealth: -4 },
        quirinaleRisk: 22,
        enactedHeadline:
          'Passa il DDL Confini e Rimpatri: plaude l’area sovranista, forti attriti con Bruxelles.',
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
      {
        id: 'energia_stop_case_green_auto',
        label: 'Difesa Auto & Stop Vincoli Green Deal',
        orientationTag: 'Sovranista / Difesa Filiere',
        defaultTitle: 'DDL Neutralità Tecnologica Automotive e Moratoria Direttiva Case Green',
        shortDesc:
          'Sospende gli obblighi di ristrutturazione energetica imposti da Bruxelles e difende la filiera motoristica e agricola.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -3600,
        targetAxis: { economic: 25, society: -48, europe: -60 },
        axisShift: { society: -3, europe: -5 },
        demoEffects: { imprese: 1.7, pensionati: 1.3, lavoratori: 1.0, giovani: -1.5 },
        regionEffects: { nord_ovest: 0.8, nord_est: 0.8 },
        stateEffects: { spread: 8, socialStability: 2, euRelations: -9 },
        quirinaleRisk: 14,
        enactedHeadline:
          'Passa il DDL Neutralità Tecnologica: plaude il settore auto, forte scontro con la Commissione UE.',
      },
      {
        id: 'ambiente_trasporto_pubblico_treni',
        label: 'Piano Ferrovie, Metro & Mobilità Sostenibile',
        orientationTag: 'Sinistra / Ecologista',
        defaultTitle: 'DDL Abbonamento Unico Trasporti e Potenziamento Ferrovie Regionali',
        shortDesc:
          'Introduce un abbonamento nazionale agevolato per treni regionali e bus urbani e dirotta i fondi dalle autostrade alle rotaie.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -5400,
        targetAxis: { economic: -45, society: 48, europe: 35 },
        axisShift: { economic: -3, society: 3, europe: 2 },
        demoEffects: { giovani: 2.2, lavoratori: 1.5, pensionati: 0.7, imprese: -0.6 },
        regionEffects: { sud: 0.8, centro: 0.7, nord_ovest: 0.5 },
        stateEffects: { spread: 4, socialStability: 5, euRelations: 5 },
        quirinaleRisk: 4,
        enactedHeadline:
          'Approvato il Piano Trasporti Pubblici: abbonamenti più leggeri per pendolari e studenti.',
      },
      {
        id: 'energia_idrogeno_rigassificatori',
        label: 'Rigassificatori, Reti & Idrogeno Industriale',
        orientationTag: 'Moderato / Liberale',
        defaultTitle: 'DDL Infrastrutture Energetiche Strategiche e Filiera Idrogeno Verde',
        shortDesc:
          'Sblocca rigassificatori, dorsali elettriche e investimenti privati nell’idrogeno per abbattere i costi energetici delle fabbriche.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -4600,
        targetAxis: { economic: 40, society: -5, europe: 32 },
        axisShift: { economic: 3, europe: 2 },
        demoEffects: { imprese: 1.9, lavoratori: 0.8, giovani: 0.5 },
        regionEffects: { nord_ovest: 0.6, nord_est: 0.6, isole: 0.5 },
        stateEffects: { spread: -5, socialStability: 1, euRelations: 4 },
        quirinaleRisk: 6,
        enactedHeadline:
          'Via libera al Piano Infrastrutture Energetiche: più sicurezza per le imprese e le reti.',
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
      {
        id: 'diritti_congedo_paritario_asili',
        label: 'Congedo Paritario & Asili Nido Gratuiti',
        orientationTag: 'Trasversale / Famiglie Giovani',
        defaultTitle: 'DDL Congedo di Paternità Paritario e Piano Nazionale Asili Nido',
        shortDesc:
          'Equipara il congedo di paternità e finanzia nuovi asili nido pubblici gratuiti per sostenere occupazione femminile e natalità.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -4800,
        targetAxis: { economic: -22, society: 30, europe: 25 },
        axisShift: { society: 2, economic: -2 },
        demoEffects: { giovani: 2.0, lavoratori: 1.6, pensionati: 0.4, imprese: -0.3 },
        regionEffects: { sud: 0.7, centro: 0.6, nord_ovest: 0.5 },
        stateEffects: { spread: 3, socialStability: 5, euRelations: 4 },
        quirinaleRisk: 3,
        enactedHeadline:
          'Approvato il Piano Asili Nido e Congedo Paritario: ampia convergenza in Parlamento.',
      },
      {
        id: 'diritti_liberta_digitale_stampa',
        label: 'Libertà di Stampa, Privacy & Diritti Digitali',
        orientationTag: 'Liberale / Garantista',
        defaultTitle: 'DDL Stop Querele Bavaglio, Privacy Digitale e Pluralismo dell’Informazione',
        shortDesc:
          'Protegge i giornalisti dalle liti temerarie, garantisce trasparenza sugli algoritmi e rafforza la libertà d’espressione online.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -2600,
        targetAxis: { economic: 15, society: 38, institutions: -35, europe: 30 },
        axisShift: { society: 3, institutions: -3 },
        demoEffects: { giovani: 1.8, imprese: 0.8, lavoratori: 0.7 },
        stateEffects: { democraticHealth: 7, euRelations: 4, socialStability: 2 },
        quirinaleRisk: 4,
        enactedHeadline:
          'Diventa legge lo stop alle querele bavaglio: l’Italia sale nelle classifiche sulla libertà di stampa.',
      },
      {
        id: 'diritti_radici_cultura_lingua',
        label: 'Tutela Lingua, Patrimonio & Radici Culturali',
        orientationTag: 'Moderato / Tradizione',
        defaultTitle: 'DDL Valorizzazione del Patrimonio Culturale, Borghi e Identità Nazionale',
        shortDesc:
          'Finanzia il recupero dei borghi storici, incentiva la produzione culturale italiana e tutela lingua e tradizioni locali.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -3600,
        targetAxis: { economic: 5, society: -38, europe: -5 },
        axisShift: { society: -3 },
        demoEffects: { pensionati: 1.6, lavoratori: 0.8, imprese: 0.7, giovani: 0.2 },
        regionEffects: { centro: 0.8, sud: 0.6, nord_est: 0.5 },
        stateEffects: { socialStability: 3, euRelations: 0 },
        quirinaleRisk: 4,
        enactedHeadline:
          'Approvato il DDL Patrimonio e Borghi Storici: nuove risorse per cultura e identità locali.',
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
      {
        id: 'istituzioni_elezione_diretta_premier',
        label: 'Elezione Diretta & Rafforzamento Esecutivo',
        orientationTag: 'Centrodestra / Presidenzialista',
        defaultTitle: 'DDL Riforma del Governo con Mandato Diretto e Poteri di Coordinamento',
        shortDesc:
          'Rafforza la stabilità del Presidente del Consiglio legando la legislatura al mandato espresso direttamente dagli elettori.',
        category: 'costituzionale',
        requiredMajority: 'assoluta',
        budgetDelta: -3800,
        targetAxis: { society: -35, institutions: 58, europe: -15 },
        axisShift: { institutions: 6, society: -2 },
        demoEffects: { pensionati: 1.4, imprese: 1.3, lavoratori: 0.4, giovani: -1.1 },
        regionEffects: { nord_est: 0.6, nord_ovest: 0.5 },
        stateEffects: { spread: -3, socialStability: -3, democraticHealth: -5 },
        quirinaleRisk: 26,
        enactedHeadline:
          'Passa la riforma dell’Esecutivo forte: esulta la maggioranza, alta tensione istituzionale.',
      },
      {
        id: 'istituzioni_democrazia_diretta_referendum',
        label: 'Referendum Propositivo & Voto Fuorisede',
        orientationTag: 'Progressista / Partecipativo',
        defaultTitle: 'DDL Referendum Propositivo, Riduzione Quorum e Voto per Studenti Fuorisede',
        shortDesc:
          'Rende permanente il voto ai fuorisede, abbassa il quorum referendario e introduce leggi d’iniziativa popolare vincolanti.',
        category: 'costituzionale',
        requiredMajority: 'assoluta',
        budgetDelta: -3200,
        targetAxis: { economic: -25, society: 52, institutions: -55 },
        axisShift: { society: 3, institutions: -5 },
        demoEffects: { giovani: 2.5, lavoratori: 1.0, pensionati: 0.2 },
        regionEffects: { sud: 0.8, isole: 0.7, centro: 0.5 },
        stateEffects: { socialStability: 4, democraticHealth: 8, euRelations: 2 },
        quirinaleRisk: 7,
        enactedHeadline:
          'Approvata la legge sul voto ai fuorisede e i referendum partecipativi: festa tra gli studenti.',
      },
      {
        id: 'istituzioni_sburocratizzazione_pa',
        label: 'Taglio Burocrazia, Comuni & PA Digitale',
        orientationTag: 'Liberale / Efficienza',
        defaultTitle: 'DDL Semplificazione Amministrativa, Silenzio-Assenso e Sportello Unico',
        shortDesc:
          'Taglia tempi e autorizzazioni per cittadini e imprese, digitalizza gli atti comunali e introduce il silenzio-assenso rapido.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -3400,
        targetAxis: { economic: 42, institutions: -10, europe: 30 },
        axisShift: { economic: 3, europe: 2 },
        demoEffects: { imprese: 2.0, lavoratori: 0.9, giovani: 0.9, pensionati: 0.4 },
        regionEffects: { nord_ovest: 0.6, nord_est: 0.6, centro: 0.5 },
        stateEffects: { spread: -6, socialStability: 3, euRelations: 5, democraticHealth: 2 },
        quirinaleRisk: 3,
        enactedHeadline:
          'Via libera alla Semplificazione della PA: meno moduli e tempi dimezzati per imprese e cittadini.',
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
      {
        id: 'esteri_diplomazia_pace_cooperazione',
        label: 'Diplomazia di Pace & Stop Spese Militari',
        orientationTag: 'Pacifista / Sinistra',
        defaultTitle: 'DDL Iniziativa Diplomatica di Pace, Cooperazione e Riduzione Riarmo',
        shortDesc:
          'Riorienta gli stanziamenti dalla corsa al riarmo alla cooperazione internazionale, ai corridoi umanitari e alla diplomazia UE.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -3400,
        targetAxis: { economic: -45, society: 55, europe: -5 },
        axisShift: { society: 4, economic: -2 },
        demoEffects: { giovani: 2.0, lavoratori: 1.1, pensionati: 0.5, imprese: -1.1 },
        regionEffects: { centro: 0.6, sud: 0.5 },
        stateEffects: { spread: 4, socialStability: 3, euRelations: -3, democraticHealth: 3 },
        quirinaleRisk: 7,
        enactedHeadline:
          'Approvato il DDL Diplomazia e Cooperazione: forte mobilitazione dell’area pacifista.',
      },
      {
        id: 'ue_eurobond_sociali_pnrr',
        label: 'Europa Sociale, Eurobond & Nuovo PNRR',
        orientationTag: 'Europeista / Progressista',
        defaultTitle: 'DDL Mandato per un Fondo Europeo Permanente per Lavoro, Sanità e Clima',
        shortDesc:
          'Impegna l’Italia a negoziare a Bruxelles un nuovo piano di investimenti comuni UE su sanità, scuola e transizione giusta.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -3900,
        targetAxis: { economic: -38, society: 40, europe: 62 },
        axisShift: { economic: -2, europe: 5 },
        demoEffects: { giovani: 1.8, lavoratori: 1.4, pensionati: 0.6, imprese: 0.4 },
        regionEffects: { sud: 0.9, isole: 0.8, centro: 0.5 },
        stateEffects: { spread: -8, euRelations: 9, socialStability: 3 },
        quirinaleRisk: 4,
        enactedHeadline:
          'Via libera al mandato per l’Europa Sociale e gli Eurobond: apprezzamento nei mercati e a Bruxelles.',
      },
      {
        id: 'esteri_export_cyber_nato',
        label: 'Alleanza Atlantica, Cyber-Difesa & Export',
        orientationTag: 'Atlantico / Industriale',
        defaultTitle: 'DDL Scudo Cyber Nazionale, Filiere Aerospazio e Sostegno all’Export',
        shortDesc:
          'Potenzia la sicurezza informatica strategica, sostiene l’export tecnologico italiano e consolida gli impegni NATO.',
        category: 'economica',
        requiredMajority: 'semplice',
        budgetDelta: -5200,
        targetAxis: { economic: 44, society: -20, europe: 36 },
        axisShift: { economic: 3, europe: 3 },
        demoEffects: { imprese: 2.0, lavoratori: 0.7, pensionati: 0.5, giovani: 0.3 },
        regionEffects: { nord_ovest: 0.8, nord_est: 0.7 },
        stateEffects: { spread: -6, euRelations: 6, socialStability: 1 },
        quirinaleRisk: 5,
        enactedHeadline:
          'Approvato il DDL Cyber-Difesa ed Export: spinta all’industria ad alta tecnologia italiana.',
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

/**
 * Valuta la coerenza ideologica tra la linea del partito del giocatore e una proposta di DDL.
 * Restituisce un punteggio 0..100 e la fascia di coerenza ('consigliato' | 'compatibile' | 'trasversale').
 */
export function evaluateReformLineAlignment(
  partyAxis: PoliticalAxis,
  option: ReformOptionTemplate
): ReformAlignmentResult {
  const targetEntries = Object.entries(option.targetAxis).filter(
    ([, val]) => typeof val === 'number' && Number.isFinite(val)
  ) as Array<[keyof PoliticalAxis, number]>;

  if (targetEntries.length === 0) {
    return {
      score: 70,
      level: 'compatibile',
      badgeLabel: 'Compatibile',
      pollHint: 'Impatto equilibrato sui sondaggi senza scossoni per la tua base.',
    };
  }

  let totalDistance = 0;
  for (const [axisKey, targetVal] of targetEntries) {
    const partyVal = partyAxis[axisKey] ?? 0;
    // Distanza normalizzata 0..200 -> peso massimo 100
    totalDistance += Math.abs(partyVal - targetVal);
  }
  const avgDist = totalDistance / targetEntries.length;
  // avgDist = 0 => 100; avgDist = 100 => 40; avgDist >= 165 => 0
  const score = Math.max(0, Math.min(100, Math.round(100 - avgDist * 0.62)));

  if (score >= 66) {
    return {
      score,
      level: 'consigliato',
      badgeLabel: 'Consigliato per la tua linea',
      pollHint: 'Coerente con la tua identità: mobilita la base e premia i sondaggi.',
    };
  }
  if (score >= 44) {
    return {
      score,
      level: 'compatibile',
      badgeLabel: 'Compatibile',
      pollHint: 'Proposta pragmatica: accolta positivamente senza dividere il partito.',
    };
  }
  return {
    score,
    level: 'trasversale',
    badgeLabel: 'Mossa trasversale',
    pollHint: 'In contrasto con la tua linea: può spiazzare la base ma attrarre voti esterni.',
  };
}

/**
 * Seleziona le 2–3 proposte più coerenti con la linea ideologica del partito per una data materia.
 */
export function getRecommendedOptionIds(
  partyAxis: PoliticalAxis,
  subject: ParliamentarySubjectDefinition
): Set<string> {
  const ranked = subject.options
    .map((opt) => ({
      id: opt.id,
      score: evaluateReformLineAlignment(partyAxis, opt).score,
    }))
    .sort((a, b) => b.score - a.score);

  const selected = new Set<string>();
  for (let i = 0; i < ranked.length; i += 1) {
    const item = ranked[i];
    if (i < 2) {
      selected.add(item.id);
    } else if (i === 2 && item.score >= 64) {
      selected.add(item.id);
    }
  }
  return selected;
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

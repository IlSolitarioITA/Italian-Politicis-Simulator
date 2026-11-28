import { CrisisEvent, CrisisOption, DemographicId } from '../types/game';
import { EXTRA_CRISES } from './crisesExtra';
import { EXPANDED_DOSSIERS } from './events';

const DEMO_LABELS: Record<DemographicId, string> = {
  giovani: 'Giovani e Studenti',
  lavoratori: 'Lavoratori e Sindacati',
  imprese: 'Imprese e Partite IVA',
  pensionati: 'Pensionati e Famiglie',
};

const MACRO_REGION_LABELS: Record<string, string> = {
  nord_ovest: 'Nord-Ovest',
  nord_est: 'Nord-Est',
  centro: 'Centro Italia',
  sud: 'Mezzogiorno',
  isole: 'Isole',
};

export interface CrisisOptionTradeoff {
  proText: string;
  conText: string;
}

/**
 * Restituisce il trade-off qualitativo esplicito (Pro & Contro) di ogni opzione di crisi/dossier
 * senza alcuno spoiler numerico prima del clic del giocatore.
 */
export function getCrisisOptionTradeoff(opt: CrisisOption): CrisisOptionTradeoff {
  if (opt.proText && opt.conText) {
    return { proText: opt.proText, conText: opt.conText };
  }

  const pros: string[] = [];
  const cons: string[] = [];

  const demoEntries = Object.entries(opt.demoEffects ?? {}) as [DemographicId, number][];
  const posDemos = demoEntries
    .filter(([, v]) => (v ?? 0) >= 0.35)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => DEMO_LABELS[k]);
  const negDemos = demoEntries
    .filter(([, v]) => (v ?? 0) <= -0.2)
    .sort((a, b) => a[1] - b[1])
    .map(([k]) => DEMO_LABELS[k]);

  const regEntries = Object.entries(opt.regionEffects ?? {}) as [string, number][];
  const posRegs = regEntries
    .filter(([, v]) => (v ?? 0) >= 0.5)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => MACRO_REGION_LABELS[k] ?? k);
  const negRegs = regEntries
    .filter(([, v]) => (v ?? 0) <= -0.5)
    .sort((a, b) => a[1] - b[1])
    .map(([k]) => MACRO_REGION_LABELS[k] ?? k);

  if (posDemos.length > 0) {
    pros.push(`Rilancia il consenso tra ${posDemos.slice(0, 2).join(' e ')}`);
  }
  if (posRegs.length > 0) {
    pros.push(`Rafforza il radicamento elettorale in ${posRegs.slice(0, 2).join(' e ')}`);
  }

  const se = opt.stateEffects ?? {};
  if ((se.spread ?? 0) < 0) {
    pros.push('Protegge lo Spread BTP-Bund e rassicura mercati e investitori');
  } else if ((se.spread ?? 0) > 0) {
    cons.push('Aumenta la pressione sulla spesa pubblica e fa salire lo Spread');
  }

  if ((se.socialStability ?? 0) > 0) {
    pros.push('Disinnesca le tensioni di piazza e rafforza la tenuta sociale');
  } else if ((se.socialStability ?? 0) < 0) {
    cons.push('Alza la conflittualità sociale con rischio di scioperi e proteste');
  }

  if ((se.euRelations ?? 0) > 0) {
    pros.push('Consolida la credibilità a Bruxelles e il dialogo sui dossier UE');
  } else if ((se.euRelations ?? 0) < 0) {
    cons.push('Apre un attrito diplomatico con la Commissione Europea');
  }

  if ((se.democraticHealth ?? 0) > 0) {
    pros.push('Rafforza il profilo istituzionale e le garanzie costituzionali');
  } else if ((se.democraticHealth ?? 0) < 0) {
    cons.push('Suscita rilievi istituzionali dal Quirinale e dalle opposizioni');
  }

  if (opt.budgetDelta > 0) {
    pros.push('Attrae nuovi contributi e donazioni per la cassa del partito');
  } else if (opt.budgetDelta < 0) {
    cons.push('Richiede un esborso diretto dalle casse del partito');
  }

  if ((opt.loyaltyDelta ?? 0) >= 3) {
    pros.push('Compatta la segreteria e rafforza la lealtà dei dirigenti');
  } else if ((opt.loyaltyDelta ?? 0) < 0) {
    cons.push('Genera malumori interni e attriti tra le correnti della dirigenza');
  }

  if (negDemos.length > 0) {
    cons.push(`Raffredda il sostegno tra ${negDemos.slice(0, 2).join(' e ')}`);
  }
  if (negRegs.length > 0) {
    cons.push(`Suscita malcontento elettorale in ${negRegs.slice(0, 2).join(' e ')}`);
  }

  const rel = opt.relationEffects ?? {};
  if ((rel.institutional ?? 0) < 0 || (rel.oppositeSide ?? 0) <= -6) {
    cons.push('Irrigidisce i rapporti parlamentari ed espone a duri attacchi mediatici');
  } else if ((rel.institutional ?? 0) >= 6 || (rel.sameSide ?? 0) >= 6) {
    pros.push('Favorisce la convergenza politica con alleati e forze parlamentari');
  }

  if (pros.length === 0) {
    pros.push('Mantiene una linea prudente di equilibrio politico e visibilità mediatica');
  }
  if (cons.length === 0) {
    if (opt.requiredTrait) {
      cons.push('Espone la leadership alla verifica dei fatti e alla controffensiva dei rivali');
    } else {
      cons.push('Raffredda le ali più militanti e lascia spazio agli attacchi sulle coperture');
    }
  }

  return {
    proText: opt.proText ?? pros.slice(0, 2).join('; ') + '.',
    conText: opt.conText ?? cons.slice(0, 2).join('; ') + '.',
  };
}

export const CORE_CRISES: CrisisEvent[] = [
  {
    id: 'caro_energia_2026',
    category: 'Economia',
    severity: 'Critica',
    context: 'any',
    title: 'Impennata del Caro Energia: bollette +24% prima dell’inverno',
    summary:
      'Le tensioni sulle rotte del gas fanno schizzare il PUN elettrico. Famiglie e distretti industriali chiedono un intervento immediato entro 72 ore.',
    options: [
      {
        id: 'scudo_bollette',
        label: 'Decreto Scudo Bollette finanziato con extraprofitti',
        stance: 'Statalista / Sociale',
        description: 'Tassa sugli extraprofitti energetici per azzerare gli oneri di sistema a famiglie e pensionati.',
        proText: 'Rilancia subito il consenso tra famiglie, lavoratori e pensionati, calmando le tensioni sociali.',
        conText: 'Aumenta la pressione su conti pubblici e Spread, raffreddando il mondo produttivo e le imprese.',
        budgetDelta: -20000,
        demoEffects: { lavoratori: 1.4, pensionati: 1.5, imprese: -0.9, giovani: 0.5 },
        axisShift: { economic: -10, society: 4 },
        stateEffects: { socialStability: 7, spread: 10 },
        relationEffects: { sameSide: 6, oppositeSide: -8 },
        loyaltyDelta: 2,
        headlineResult: 'Scontro duro sul decreto bollette: applausi dai sindacati, allarme dalle utility.',
        rivalReaction: 'Una misura punitiva che spaventa gli investitori e fa fuggire i capitali.',
      },
      {
        id: 'credito_imposta_pmi',
        label: 'Credito d’imposta immediato per PMI e manifattura',
        stance: 'Liberista / Imprese',
        description: 'Sostegno selettivo alle aziende energivore del Nord e taglio accise industriali.',
        proText: 'Conquista imprese e distretti manifatturieri del Nord, attirando contributi per il partito.',
        conText: 'Appesantisce i conti pubblici sullo Spread e delude lavoratori, famiglie e Mezzogiorno.',
        budgetDelta: 30000,
        demoEffects: { imprese: 1.9, lavoratori: -0.4, pensionati: -0.3, giovani: -0.2 },
        regionEffects: { nord_ovest: 1.0, nord_est: 1.1, sud: -0.4 },
        axisShift: { economic: 10 },
        stateEffects: { spread: 6, socialStability: -3 },
        relationEffects: { institutional: 6 },
        loyaltyDelta: 1,
        headlineResult: 'Apprezzamento delle categorie produttive per il pacchetto energia pro-imprese.',
        rivalReaction: 'Si aiutano i grandi gruppi dimenticando chi fatica ad arrivare a fine mese.',
      },
      {
        id: 'piano_nucleare_rinnovabili',
        label: 'Mix rinnovabili + nucleare di nuova generazione',
        stance: 'Europeista / Pragmatico',
        description: 'Meno sussidi a pioggia, subito semplificazioni per impianti energetici nazionali.',
        proText: 'Protegge Spread e credibilità a Bruxelles, raccogliendo apprezzamento tra giovani e imprese.',
        conText: 'Raffredda la base più sensibile ai rincari immediati, in particolare pensionati e famiglie.',
        budgetDelta: 10000,
        demoEffects: { giovani: 0.9, imprese: 1.2, lavoratori: 0.2, pensionati: -0.5 },
        axisShift: { economic: 6, europe: 8 },
        stateEffects: { euRelations: 6, spread: -5 },
        relationEffects: { institutional: 10 },
        loyaltyDelta: 0,
        headlineResult: 'Proposta energetica di lungo respiro: bene i mercati, freddezza immediata nelle piazze.',
        rivalReaction: 'Promesse futuristiche mentre le famiglie ricevono le bollette di novembre.',
      },
      {
        id: 'trait_economista_energy',
        label: 'Disaccoppiamento prezzo gas-elettricità con asta UE (Economista)',
        stance: 'Opzione Unica Leader',
        description: 'Riforma tecnica a costo zero per la finanza pubblica sul prezzo all’ingrosso.',
        proText: 'Soluzione tecnica autorevole che raffredda lo Spread, rafforza il dialogo UE e convince le fasce sociali.',
        conText: 'Richiede forte spesa politica verso gli oppositori sovranisti e tempi di negoziato che attirano critiche mediatiche.',
        requiredTrait: 'economista',
        budgetDelta: 15000,
        demoEffects: { imprese: 1.5, lavoratori: 1.1, pensionati: 0.8, giovani: 0.7 },
        axisShift: { europe: 6 },
        stateEffects: { spread: -10, euRelations: 8, socialStability: 5 },
        relationEffects: { institutional: 10, oppositeSide: -8 },
        loyaltyDelta: 4,
        headlineResult: 'Colpo da maestro tecnico sul caro energia: la proposta conquista economisti e famiglie.',
        rivalReaction: 'Lo schema tecnico ha un fondamento, ma servirà il via libera di Bruxelles.',
      },
    ],
  },
  {
    id: 'sciopero_trasporti',
    category: 'Lavoro',
    severity: 'Alta',
    context: 'any',
    title: 'Sciopero generale dei trasporti: Paese fermo per 48 ore',
    summary:
      'Treni, metropolitane e trasporto aereo paralizzati per il rinnovo contrattuale e la sicurezza del personale. Pendolari esasperati nelle metropoli.',
    options: [
      {
        id: 'precettazione',
        label: 'Precettazione immediata e stretta sul diritto di sciopero',
        stance: 'Autoritario / Ordine',
        description: 'Difesa dei pendolari e delle attività commerciali contro i blocchi del venerdì.',
        budgetDelta: 15000,
        demoEffects: { imprese: 1.5, pensionati: 1.1, lavoratori: -1.4, giovani: -0.4 },
        regionEffects: { nord_ovest: 0.9, nord_est: 0.8 },
        axisShift: { institutions: 12, society: -8, economic: 6 },
        stateEffects: { socialStability: -9, democraticHealth: -6 },
        relationEffects: { oppositeSide: -10 },
        loyaltyDelta: 1,
        headlineResult: 'Pugno duro sui trasporti: spaccato il Paese tra pendolari e piazze sindacali.',
        rivalReaction: 'Un attacco frontale ai diritti costituzionali dei lavoratori.',
      },
      {
        id: 'sostegno_sciopero',
        label: 'Sostegno pieno ai lavoratori e fondo extra trasporto pubblico',
        stance: 'Statalista / Sindacale',
        description: 'Schierarsi apertamente con gli scioperanti chiedendo adeguamenti salariali.',
        budgetDelta: -15000,
        demoEffects: { lavoratori: 1.8, giovani: 0.9, imprese: -1.2, pensionati: -0.2 },
        regionEffects: { centro: 0.8, sud: 0.6 },
        axisShift: { economic: -10, society: 8, institutions: -6 },
        stateEffects: { socialStability: 5, spread: 8 },
        relationEffects: { sameSide: 8 },
        loyaltyDelta: 3,
        headlineResult: 'Pieno appoggio allo sciopero: cresce la mobilitazione tra lavoratori e pendolari.',
        rivalReaction: 'Tenere in ostaggio milioni di cittadini per un pugno di voti è irresponsabile.',
      },
      {
        id: 'tavolo_mediazione',
        label: 'Tavolo di conciliazione con fasce garantite estese',
        stance: 'Democratico / Istituzionale',
        description: 'Aumenti legati alla produttività e tutela della mobilità essenziale.',
        budgetDelta: 0,
        demoEffects: { lavoratori: 0.5, pensionati: 0.6, imprese: 0.4, giovani: 0.2 },
        axisShift: { institutions: -4 },
        stateEffects: { socialStability: 6, democraticHealth: 3 },
        relationEffects: { institutional: 7 },
        loyaltyDelta: 1,
        headlineResult: 'Approccio responsabile sui trasporti: apprezzamento moderato dei commentatori.',
        rivalReaction: 'Parole concilianti senza il coraggio di dire da che parte si sta davvero.',
      },
      {
        id: 'trait_sindacalista_trasporti',
        label: 'Mediazione diretta con le sigle per revocare il blocco (Sindacalista)',
        stance: 'Opzione Unica Leader',
        description: 'Sfrutta i canali sindacali per firmare un accordo-ponte e sbloccare i treni.',
        requiredTrait: 'sindacalista',
        budgetDelta: 10000,
        demoEffects: { lavoratori: 2.0, imprese: 1.0, pensionati: 0.8, giovani: 0.5 },
        axisShift: { economic: -4, institutions: -6 },
        stateEffects: { socialStability: 14, democraticHealth: 4 },
        relationEffects: { institutional: 8, sameSide: 10 },
        loyaltyDelta: 7,
        headlineResult: 'Clamorosa mediazione sui trasporti: revocato lo sciopero grazie all’intesa lampo.',
        rivalReaction: 'Un’operazione mediatica riuscita, ma i nodi del settore restano sul tavolo.',
      },
    ],
  },
  {
    id: 'manovra_bilancio_2027',
    category: 'Economia',
    severity: 'Critica',
    context: 'governo',
    title: 'Manovra di Bilancio 2027: mancano 11 miliardi di coperture',
    summary:
      'La Ragioneria Generale segnala uno scostamento rispetto agli impegni. Battaglia in Parlamento su cuneo fiscale, sanità e tagli ai ministeri.',
    options: [
      {
        id: 'taglio_cuneo_deficit',
        label: 'Confermare il taglio del cuneo fiscale anche in deficit',
        stance: 'Sovranista / Espansiva',
        description: 'Priorità alle buste paga sotto i 35.000 euro sfidando i vincoli di bilancio UE.',
        proText: 'Rilancia nettamente il consenso tra lavoratori e giovani, rafforzando la coesione sociale interna.',
        conText: 'Fa salire debito pubblico e Spread BTP-Bund, aprendo un duro scontro con Bruxelles e mercati.',
        budgetDelta: -10000,
        demoEffects: { lavoratori: 1.9, giovani: 0.9, imprese: 0.2, pensionati: 0.3 },
        axisShift: { economic: -6, europe: -12 },
        stateEffects: { spread: 24, euRelations: -10, socialStability: 6 },
        relationEffects: { institutional: -9 },
        loyaltyDelta: 3,
        headlineResult: 'Sfida sui conti pubblici pur di salvare le buste paga: spread in tensione.',
        rivalReaction: 'Giocare con lo spread fa pagare ai cittadini miliardi di interessi.',
      },
      {
        id: 'spending_review',
        label: 'Spending review severa e difesa del rigore dei conti',
        stance: 'Liberista / Federalista',
        description: 'Taglio di bonus inefficaci e rassicurazione immediata a mercati e Bruxelles.',
        proText: 'Protegge lo Spread, migliora la credibilità europea e conquista imprese e risparmiatori.',
        conText: 'Raffredda la base tra lavoratori e giovani, alzando tensioni sindacali e malumori interni.',
        budgetDelta: 35000,
        demoEffects: { imprese: 1.5, pensionati: 0.7, lavoratori: -0.7, giovani: -0.5 },
        axisShift: { economic: 12, europe: 10 },
        stateEffects: { spread: -18, euRelations: 10, socialStability: -6 },
        relationEffects: { institutional: 11 },
        loyaltyDelta: -1,
        headlineResult: 'Linea del rigore apprezzata da Bruxelles e mercati, malumori nei sindacati.',
        rivalReaction: 'La solita austerità che taglia servizi ai territori.',
      },
      {
        id: 'patrimoniale_sanita',
        label: 'Contributo sui grandi patrimoni per salvare la Sanità',
        stance: 'Statalista / Progressista',
        description: 'Prelievo oltre i 5 milioni di euro per finanziare 6 miliardi al SSN.',
        proText: 'Forte spinta tra pensionati, lavoratori e giovani, migliorando la stabilità sociale e le coperture.',
        conText: 'Scontro frontale con imprese e investitori, calo di donazioni al partito e forte polarizzazione.',
        budgetDelta: -20000,
        demoEffects: { pensionati: 1.6, lavoratori: 1.4, giovani: 1.0, imprese: -2.1 },
        axisShift: { economic: -14, society: 6 },
        stateEffects: { spread: -6, socialStability: 7 },
        relationEffects: { oppositeSide: -12, sameSide: 7 },
        loyaltyDelta: 2,
        headlineResult: 'Torna il dibattito sulla patrimoniale per la sanità: paese polarizzato.',
        rivalReaction: 'Mettere le mani nelle tasche dei risparmiatori è fallimentare.',
      },
      {
        id: 'trait_diplomazia_manovra',
        label: 'Scorporo investimenti digitali in accordo con la Commissione UE (Diplomazia UE)',
        stance: 'Opzione Unica Leader',
        description: 'Negoziato riservato a Bruxelles che libera 7 miliardi senza nuove tasse.',
        proText: 'Riduce lo Spread e rafforza il peso diplomatico italiano a Bruxelles con consenso trasversale.',
        conText: 'Vincola la spesa a rigide clausole europee, irritando l’ala sovranista e le correnti più intransigenti.',
        requiredTrait: 'diplomazia_ue',
        budgetDelta: 20000,
        demoEffects: { imprese: 1.2, lavoratori: 1.1, pensionati: 0.9, giovani: 0.9 },
        axisShift: { europe: 12 },
        stateEffects: { spread: -14, euRelations: 12, socialStability: 4 },
        relationEffects: { institutional: 12, oppositeSide: -8 },
        loyaltyDelta: -2,
        headlineResult: 'Flessibilità ottenuta a Bruxelles: la manovra trova respiro senza nuove tasse.',
        rivalReaction: 'Vedremo se le clausole chieste dall’Europa non saranno troppo salate.',
      },
    ],
  },
  {
    id: 'scandalo_esponente',
    category: 'Scandalo',
    severity: 'Critica',
    context: 'any',
    title: 'Inchiesta appalti: indagato un dirigente regionale del tuo partito',
    summary:
      'Un quotidiano pubblica intercettazioni su presunte consulenze gonfiate in una partecipata regionale. Le TV chiedono una presa di posizione immediata.',
    options: [
      {
        id: 'espulsione_immediata',
        label: 'Espulsione immediata e costituzione come parte civile',
        stance: 'Democratico / Legalità',
        description: 'Taglio netto per proteggere il simbolo, anche a costo di malumori nelle correnti.',
        budgetDelta: -15000,
        demoEffects: { giovani: 0.9, lavoratori: 0.7, pensionati: 0.4, imprese: -0.2 },
        axisShift: { institutions: -8 },
        stateEffects: { democraticHealth: 5 },
        relationEffects: { institutional: 5 },
        loyaltyDelta: -8,
        headlineResult: 'Linea durissima sull’inchiesta: il leader espelle il dirigente e rivendica pulizia.',
        rivalReaction: 'Scelta obbligata, ma resta la responsabilità di chi lo aveva promosso.',
      },
      {
        id: 'garantismo_cauto',
        label: 'Garantismo: sospensione cautelativa in attesa del giudizio',
        stance: 'Garantista',
        description: 'Rispetto per la magistratura ma rifiuto della gogna mediatica prima delle sentenze.',
        budgetDelta: 0,
        demoEffects: { imprese: 0.5, pensionati: 0.2, giovani: -0.9, lavoratori: -0.7 },
        axisShift: { economic: 4, institutions: 3 },
        stateEffects: { democraticHealth: -2 },
        relationEffects: { institutional: 3 },
        loyaltyDelta: 4,
        headlineResult: 'Approccio garantista sul caso appalti: regge il partito, cala il gradimento social.',
        rivalReaction: 'Il solito doppiopesismo: severi con gli avversari, morbidi in casa propria.',
      },
      {
        id: 'attacco_stampa',
        label: 'Contrattacco: denunciare toghe politicizzate e media ostili',
        stance: 'Autoritario / Scontro',
        description: 'Spostare il fuoco contro magistratura e stampa per compattare la base.',
        budgetDelta: -10000,
        demoEffects: { giovani: -1.1, imprese: -0.8, lavoratori: -0.3, pensionati: 0.1 },
        axisShift: { institutions: 14, europe: -6 },
        stateEffects: { democraticHealth: -9, euRelations: -6 },
        relationEffects: { institutional: -10, oppositeSide: -12 },
        loyaltyDelta: 5,
        headlineResult: 'Scontro frontale con stampa e procure: i moderati prendono le distanze.',
        rivalReaction: 'Attaccare giudici e cronisti invece di chiarire è un segnale di nervosismo.',
      },
      {
        id: 'trait_magistrato_scandalo',
        label: 'Audit indipendente su tutti gli appalti e codice etico (Ex Magistrato)',
        stance: 'Opzione Unica Leader',
        description: 'Trasforma la crisi in una campagna nazionale per la legalità inattaccabile.',
        requiredTrait: 'ex_magistrato',
        budgetDelta: -5000,
        demoEffects: { giovani: 1.4, lavoratori: 1.1, pensionati: 1.0, imprese: 0.5 },
        axisShift: { institutions: -10 },
        stateEffects: { democraticHealth: 8, socialStability: 4 },
        relationEffects: { institutional: 9 },
        loyaltyDelta: 2,
        headlineResult: 'Ribaltato il caso giudiziario: il protocollo trasparenza raccoglie consensi trasversali.',
        rivalReaction: 'Mossa abile per coprire la falla interna, ma i fatti andranno accertati.',
      },
    ],
  },
  {
    id: 'crisi_migratoria_mediterraneo',
    category: 'Esteri',
    severity: 'Critica',
    context: 'any',
    title: 'Emergenza Migratoria: picco di sbarchi a Lampedusa e tensioni con l’UE',
    summary:
      'In dieci giorni approdano oltre 9.000 migranti. I sindaci chiedono redistribuzione immediata, mentre Francia e Austria rafforzano i controlli ai confini.',
    options: [
      {
        id: 'blocco_centri_esterni',
        label: 'Linea dura: centri di rimpatrio rapidi e blocco navale concordato',
        stance: 'Conservatore / Sovranista',
        description: 'Pugno fermo sui confini e accordi bilaterali con i Paesi nordafricani.',
        budgetDelta: -10000,
        demoEffects: { pensionati: 1.7, imprese: 1.1, lavoratori: 0.9, giovani: -1.3 },
        regionEffects: { nord_est: 1.1, nord_ovest: 0.8, isole: 1.2 },
        axisShift: { society: -14, europe: -10, institutions: 8 },
        stateEffects: { euRelations: -9, democraticHealth: -4, socialStability: 3 },
        relationEffects: { oppositeSide: -9 },
        loyaltyDelta: 2,
        headlineResult: 'Pugno duro sui confini: cresce il consenso in Sicilia e al Nord, scontro con le ONG.',
        rivalReaction: 'Ricette propagandistiche che violano i trattati internazionali senza fermare i flussi.',
      },
      {
        id: 'corridoi_umanitari_lavoro',
        label: 'Canali legali d’ingresso per lavoro e riforma del Trattato di Dublino',
        stance: 'Progressista / Federalista',
        description: 'Quote d’ingresso legate alle richieste delle imprese e accoglienza diffusa nei comuni.',
        budgetDelta: -15000,
        demoEffects: { giovani: 1.5, imprese: 0.8, lavoratori: -0.6, pensionati: -1.1 },
        regionEffects: { centro: 0.8, nord_ovest: 0.4, isole: -0.7 },
        axisShift: { society: 14, europe: 12, institutions: -6 },
        stateEffects: { euRelations: 10, democraticHealth: 5, socialStability: -3 },
        relationEffects: { institutional: 8, sameSide: 6 },
        loyaltyDelta: 1,
        headlineResult: 'Apertura sui corridoi legali per il lavoro: bene Bruxelles e giovani, polemiche a destra.',
        rivalReaction: 'Così si spalancano le porte incentivando nuove partenze incontrollate.',
      },
      {
        id: 'piano_africa_frontex',
        label: 'Missione europea Frontex rafforzata e cooperazione energetica africana',
        stance: 'Pragmatico / Istituzionale',
        description: 'Chiedere più fondi europei per la sorveglianza congiunta e investimenti in Nord Africa.',
        budgetDelta: 5000,
        demoEffects: { imprese: 0.8, pensionati: 0.6, lavoratori: 0.4, giovani: 0.3 },
        axisShift: { europe: 6 },
        stateEffects: { euRelations: 6, socialStability: 3 },
        relationEffects: { institutional: 7 },
        loyaltyDelta: 2,
        headlineResult: 'Proposta equilibrata su Frontex e cooperazione: consenso trasversale moderato.',
        rivalReaction: 'L’Europa promette solidarietà da dieci anni ma lascia l’Italia sola.',
      },
    ],
  },
  {
    id: 'scandalo_rimborsi_deputato',
    category: 'Scandalo',
    severity: 'Alta',
    context: 'opposizione',
    title: 'Caso Rimborsi d’Oro: un tuo deputato compra beni di lusso con i fondi gruppo',
    summary:
      'Una trasmissione d’inchiesta mostra ricevute di cene stellate e viaggi privati pagati col rimborso parlamentare. Sui social esplode l’indignazione anti-casta.',
    options: [
      {
        id: 'restituzione_dimissioni',
        label: 'Chiedere dimissioni immediate e taglio del 20% dei rimborsi del gruppo',
        stance: 'Trasparenza Radicale',
        description: 'Risposta esemplare per spegnere la polemica anti-casta sul nascere.',
        budgetDelta: -30000,
        demoEffects: { giovani: 1.2, lavoratori: 1.0, pensionati: 0.7, imprese: 0.3 },
        axisShift: { institutions: -6 },
        stateEffects: { socialStability: 5, democraticHealth: 4 },
        loyaltyDelta: -6,
        headlineResult: 'Linea esemplare sui rimborsi: il partito taglia le spese e recupera credibilità.',
        rivalReaction: 'Si corre ai ripari solo dopo essere stati beccati dalle telecamere.',
      },
      {
        id: 'sanzione_interna',
        label: 'Multa interna ai probiviri e restituzione delle somme contestate',
        stance: 'Moderata',
        description: 'Gestione discreta per non perdere un seggio prezioso in aula.',
        budgetDelta: -5000,
        demoEffects: { giovani: -0.8, lavoratori: -0.7, pensionati: -0.4, imprese: -0.2 },
        axisShift: { institutions: 4 },
        stateEffects: { socialStability: -4 },
        loyaltyDelta: 3,
        headlineResult: 'Sanzione soft sul caso rimborsi: l’elettorato reagisce con scetticismo.',
        rivalReaction: 'Solita autodifesa della casta parlamentare.',
      },
      {
        id: 'trait_social_rimborsi',
        label: 'Pubblicare online ogni scontrino del partito in tempo reale (Maestro Social)',
        stance: 'Opzione Unica Leader',
        description: 'Operazione trasparenza open-data che trasforma lo scandalo in un boomerang per i rivali.',
        requiredTrait: 'maestro_social',
        budgetDelta: -10000,
        demoEffects: { giovani: 1.9, lavoratori: 1.1, imprese: 0.7, pensionati: 0.5 },
        axisShift: { institutions: -8, society: 4 },
        stateEffects: { democraticHealth: 6, socialStability: 4 },
        loyaltyDelta: 2,
        headlineResult: 'Portale Open-Spese virale: sfida aperta agli altri partiti sulla trasparenza.',
        rivalReaction: 'Una trovata di marketing per far dimenticare gli sprechi dei loro parlamentari.',
      },
    ],
  },
  {
    id: 'tensione_spread_bruxelles',
    category: 'Unione Europea',
    severity: 'Critica',
    context: 'governo',
    title: 'Spread BTP-Bund in fiamme: report critico da Francoforte e rating sotto esame',
    summary:
      'I mercati reagiscono male alle incertezze sui conti pubblici italiani. Lo spread balza di 35 punti in una sola seduta e le banche italiane cedono in Borsa.',
    options: [
      {
        id: 'manovra_correttiva',
        label: 'Annunciare subito un piano credibile di riduzione del debito',
        stance: 'Federalista / Rigore',
        description: 'Messaggio chiaro a BCE e agenzie di rating per raffreddare i rendimenti BTP.',
        budgetDelta: 20000,
        demoEffects: { imprese: 1.3, pensionati: 0.6, lavoratori: -0.9, giovani: -0.5 },
        axisShift: { economic: 10, europe: 12 },
        stateEffects: { spread: -32, euRelations: 12, socialStability: -6 },
        relationEffects: { institutional: 10 },
        loyaltyDelta: 0,
        headlineResult: 'Lo spread rientra dopo le garanzie sui conti, ma i sindacati temono nuovi tagli.',
        rivalReaction: 'Si inchinano ai diktat finanziari sulla pelle dei servizi pubblici.',
      },
      {
        id: 'attacco_speculatori',
        label: 'Denunciare manovre speculative contro la sovranità italiana',
        stance: 'Sovranista / Autoritario',
        description: 'Scontro verbale diretto con agenzie di rating e falchi europei.',
        budgetDelta: -15000,
        demoEffects: { lavoratori: 0.8, pensionati: 0.4, imprese: -1.6, giovani: -0.6 },
        axisShift: { europe: -16, institutions: 8 },
        stateEffects: { spread: 34, euRelations: -15, socialStability: -4 },
        relationEffects: { institutional: -12 },
        loyaltyDelta: 3,
        headlineResult: 'Scontro frontale con i mercati: Piazza Affari in rosso profondo.',
        rivalReaction: 'Dichiarazioni irresponsabili che costano miliardi di interessi allo Stato.',
      },
      {
        id: 'btp_valore_famiglie',
        label: 'Emettere un grande BTP Italia riservato ai risparmiatori nazionali',
        stance: 'Patriottico / Pragmatico',
        description: 'Spostare il debito pubblico nelle mani delle famiglie italiane con tassazione agevolata.',
        budgetDelta: 10000,
        demoEffects: { pensionati: 1.2, imprese: 0.9, lavoratori: 0.6, giovani: 0.2 },
        axisShift: { economic: 3, europe: -3 },
        stateEffects: { spread: -14, socialStability: 4 },
        relationEffects: { institutional: 5 },
        loyaltyDelta: 3,
        headlineResult: 'Boom di sottoscrizioni per il nuovo BTP Famiglie: lo spread si stabilizza.',
        rivalReaction: 'Una boccata d’ossigeno temporanea che non riduce lo stock del debito.',
      },
    ],
  },
  {
    id: 'riforma_giustizia_carriere',
    category: 'Istituzioni',
    severity: 'Alta',
    context: 'any',
    title: 'Referendum sulla Giustizia: scontro sulla separazione delle carriere',
    summary:
      'L’Associazione Nazionale Magistrati proclama lo stato di agitazione contro la riforma costituzionale della giustizia. Dibattito infuocato in TV.',
    options: [
      {
        id: 'si_separazione',
        label: 'Sostegno pieno alla separazione delle carriere e responsabilità civile',
        stance: 'Liberale / Garantista',
        description: 'Avanti con la riforma per giudici terzi e processi più rapidi.',
        budgetDelta: 20000,
        demoEffects: { imprese: 1.6, pensionati: 0.6, lavoratori: -0.2, giovani: -0.4 },
        axisShift: { economic: 8, institutions: 8 },
        stateEffects: { democraticHealth: -4, socialStability: -3 },
        relationEffects: { oppositeSide: -7 },
        loyaltyDelta: 2,
        headlineResult: 'Sì netto alla separazione delle carriere: plauso degli avvocati, protesta ANM.',
        rivalReaction: 'L’obiettivo vero è mettere i pubblici ministeri sotto il controllo della politica.',
      },
      {
        id: 'difesa_autonomia_pm',
        label: 'Difendere l’indipendenza costituzionale della Magistratura',
        stance: 'Democratico / Costituzionale',
        description: 'No alla riforma punitiva: assumere 10.000 cancellieri per velocizzare i processi.',
        budgetDelta: -10000,
        demoEffects: { giovani: 1.1, lavoratori: 1.0, pensionati: 0.5, imprese: -0.9 },
        axisShift: { institutions: -12, society: 6 },
        stateEffects: { democraticHealth: 9, euRelations: 5 },
        relationEffects: { sameSide: 7 },
        loyaltyDelta: 2,
        headlineResult: 'Difesa dell’autonomia delle toghe: applausi in piazza e apprezzamento UE.',
        rivalReaction: 'Difendere lo status quo significa lasciare i processi bloccati per dieci anni.',
      },
      {
        id: 'giustizia_digitale',
        label: 'Mediazione tecnica: tribunali digitali e depenalizzazione reati minori',
        stance: 'Riformista',
        description: 'Puntare sull’efficienza dei tribunali evitando la guerra di religione con l’ANM.',
        budgetDelta: 5000,
        demoEffects: { imprese: 0.9, giovani: 0.8, lavoratori: 0.4, pensionati: 0.3 },
        axisShift: { economic: 4, institutions: -4 },
        stateEffects: { democraticHealth: 4, spread: -4 },
        relationEffects: { institutional: 8 },
        loyaltyDelta: 1,
        headlineResult: 'Proposta di compromesso sulla giustizia digitale: apprezzamento trasversale.',
        rivalReaction: 'Bene la digitalizzazione, ma sul nodo costituzionale non si può restare vaghi.',
      },
    ],
  },
  {
    id: 'crisi_sanita_pronto_soccorso',
    category: 'Istituzioni',
    severity: 'Critica',
    context: 'any',
    title: 'Emergenza Pronto Soccorso e liste d’attesa oltre 14 mesi',
    summary:
      'Reparti saturi e fuga di medici verso l’estero. Il tema della sanità pubblica diventa la prima priorità nei sondaggi nazionali.',
    options: [
      {
        id: 'piano_assunzioni_ssn',
        label: 'Piano da 30.000 assunzioni e stop ai medici gettonisti',
        stance: 'Statalista / Welfare',
        description: 'Investimento massiccio nella sanità pubblica territoriale e negli stipendi dei medici.',
        budgetDelta: -20000,
        demoEffects: { pensionati: 2.0, lavoratori: 1.5, giovani: 0.8, imprese: -0.6 },
        regionEffects: { sud: 1.0, isole: 0.9, centro: 0.6 },
        axisShift: { economic: -12, society: 6 },
        stateEffects: { socialStability: 10, spread: 12 },
        relationEffects: { sameSide: 6 },
        loyaltyDelta: 3,
        headlineResult: 'Offensiva sulla sanità pubblica: boom di consensi tra anziani e famiglie.',
        rivalReaction: 'Bellissimi annunci senza indicare dove trovare i miliardi.',
      },
      {
        id: 'convenzioni_privato',
        label: 'Voucher regionali per visite in strutture private convenzionate',
        stance: 'Liberista / Rapido',
        description: 'Abbattere le liste d’attesa entro 15 giorni integrando il sistema privato.',
        budgetDelta: 25000,
        demoEffects: { imprese: 1.3, pensionati: 0.9, lavoratori: -0.6, giovani: -0.3 },
        regionEffects: { nord_ovest: 1.0, nord_est: 0.8 },
        axisShift: { economic: 12 },
        stateEffects: { spread: -4, socialStability: -3 },
        relationEffects: { institutional: 4 },
        loyaltyDelta: 0,
        headlineResult: 'Svolta pubblico-privato sulle liste d’attesa: favorevole il Nord, protesta la sinistra.',
        rivalReaction: 'Così si smantella la sanità universale regalando risorse ai gruppi privati.',
      },
      {
        id: 'digitalizzazione_sanita',
        label: 'CUP unico nazionale con AI predittiva e telemedicina',
        stance: 'Tecno-Pragmatico',
        description: 'Eliminare sprechi e sovrapposizioni tra ASL con una piattaforma unica.',
        budgetDelta: 5000,
        demoEffects: { giovani: 1.2, imprese: 0.9, pensionati: 0.5, lavoratori: 0.4 },
        axisShift: { economic: 4, europe: 4 },
        stateEffects: { socialStability: 4 },
        relationEffects: { institutional: 7 },
        loyaltyDelta: 1,
        headlineResult: 'Ricetta digitale per il SSN: convincono gli under 40, scetticismo sui tempi.',
        rivalReaction: 'Gli algoritmi non sostituiscono i medici che mancano nei reparti.',
      },
    ],
  },
  {
    id: 'riforma_fiscale_flattax',
    category: 'Economia',
    severity: 'Alta',
    context: 'any',
    title: 'Battaglia sul Fisco: Flat Tax estesa o progressività IRPEF?',
    summary:
      'In Commissione Finanze arriva la delega fiscale 2027. Autonomi e artigiani chiedono la soglia a 100.000€, i dipendenti denunciano disparità.',
    options: [
      {
        id: 'estendi_flattax',
        label: 'Flat Tax al 15% fino a 100.000 euro e rottamazione cartelle',
        stance: 'Liberista',
        description: 'Segnale netto al mondo delle Partite IVA e riduzione della pressione burocratica.',
        budgetDelta: 40000,
        demoEffects: { imprese: 2.3, lavoratori: -1.1, pensionati: -0.4, giovani: 0.2 },
        regionEffects: { nord_ovest: 0.8, nord_est: 1.0 },
        axisShift: { economic: 14 },
        stateEffects: { spread: 14, euRelations: -6 },
        relationEffects: { oppositeSide: -7 },
        loyaltyDelta: 2,
        headlineResult: 'Fisco: entusiasmo tra le Partite IVA, dura reazione di sindacati e impiegati.',
        rivalReaction: 'Un premio all’evasione che scarica il peso dello Stato sui dipendenti.',
      },
      {
        id: 'detassazione_salari',
        label: 'Taglio IRPEF sul ceto medio dipendente e stretta anti-evasione',
        stance: 'Statalista / Equità',
        description: 'Incrocio automatico banche dati fiscali per alleggerire le buste paga.',
        budgetDelta: -15000,
        demoEffects: { lavoratori: 1.9, pensionati: 0.9, giovani: 0.6, imprese: -1.3 },
        regionEffects: { centro: 0.7, sud: 0.6 },
        axisShift: { economic: -12 },
        stateEffects: { spread: -8, socialStability: 6 },
        relationEffects: { sameSide: 6 },
        loyaltyDelta: 2,
        headlineResult: 'Proposta pro-buste paga e stretta sull’evasione: plaudono dipendenti e pensionati.',
        rivalReaction: 'Torna lo Stato di polizia fiscale contro chi produce ricchezza.',
      },
      {
        id: 'quoziente_familiare',
        label: 'Quoziente familiare per i nuclei con figli a carico',
        stance: 'Moderato / Famiglia',
        description: 'Detrazioni crescenti in base al numero dei figli per rilanciare la natalità.',
        budgetDelta: 5000,
        demoEffects: { lavoratori: 0.9, imprese: 0.8, giovani: 0.7, pensionati: 0.3 },
        axisShift: { society: -4 },
        stateEffects: { socialStability: 5, spread: 5 },
        relationEffects: { institutional: 6 },
        loyaltyDelta: 2,
        headlineResult: 'Consenso trasversale sul quoziente familiare, apprezzato dal mondo moderato.',
        rivalReaction: 'Principio condivisibile, ma servono asili nido oltre alle detrazioni.',
      },
      {
        id: 'trait_fundraiser_fisco',
        label: 'Patto fiscale con distretti industriali e fondi pensione (Fundraiser)',
        stance: 'Opzione Unica Leader',
        description: 'Incentivi mirati a chi reinveste gli utili in salari e innovazione.',
        requiredTrait: 'fundraiser',
        budgetDelta: 65000,
        demoEffects: { imprese: 1.7, lavoratori: 0.9, giovani: 0.6, pensionati: 0.4 },
        axisShift: { economic: 6 },
        stateEffects: { spread: -6, socialStability: 4 },
        relationEffects: { institutional: 8 },
        loyaltyDelta: 4,
        headlineResult: 'Grande consenso produttivo: il patto sugli utili convince imprese e sindacati.',
        rivalReaction: 'Operazione ben architettata, ma vedremo i numeri reali.',
      },
    ],
  },
  {
    id: 'caro_affitti_giovani',
    category: 'Società',
    severity: 'Media',
    context: 'any',
    title: 'Caro affitti nelle città universitarie: tende in piazza negli atenei',
    summary:
      'A Milano, Bologna, Roma e Firenze una stanza supera i 720 euro. Gli studenti occupano le piazze chiedendo limiti agli affitti brevi turistici.',
    options: [
      {
        id: 'stretta_affitti_brevi',
        label: 'Tetto agli affitti brevi turistici e fondo affitto under 35',
        stance: 'Progressista / Statalista',
        description: 'Limiti comunali alle piattaforme turistiche e recupero di edifici pubblici.',
        budgetDelta: -15000,
        demoEffects: { giovani: 2.3, lavoratori: 0.8, imprese: -1.0, pensionati: -0.5 },
        regionEffects: { centro: 0.9, nord_ovest: 0.6 },
        axisShift: { economic: -10, society: 10 },
        stateEffects: { socialStability: 6 },
        relationEffects: { sameSide: 5 },
        loyaltyDelta: 2,
        headlineResult: 'Stretta sugli affitti brevi: boom tra gli studenti, insorgono i proprietari.',
        rivalReaction: 'Colpire la proprietà privata non creerà un solo alloggio in più.',
      },
      {
        id: 'cedolare_zero_studenti',
        label: 'Cedolare secca ridotta al 5% per chi affitta a studenti',
        stance: 'Liberista',
        description: 'Premiare fiscalmente i proprietari invece di introdurre divieti.',
        budgetDelta: 15000,
        demoEffects: { imprese: 1.1, pensionati: 0.9, giovani: 0.7, lavoratori: 0.4 },
        axisShift: { economic: 8 },
        stateEffects: { socialStability: 3 },
        relationEffects: { institutional: 7 },
        loyaltyDelta: 1,
        headlineResult: 'Proposta fiscale sugli affitti concordati: bene proprietari e moderati.',
        rivalReaction: 'Misure tiepide che non fermano la speculazione turistica.',
      },
      {
        id: 'trait_social_affitti',
        label: 'Campagna virale negli atenei con proposta popolare (Maestro Social)',
        stance: 'Opzione Unica Leader',
        description: 'Trasforma la protesta in una raccolta firme digitale da 300.000 adesioni.',
        requiredTrait: 'maestro_social',
        budgetDelta: 10000,
        demoEffects: { giovani: 2.8, lavoratori: 0.9, pensionati: 0.2, imprese: -0.2 },
        axisShift: { society: 8 },
        stateEffects: { socialStability: 5 },
        relationEffects: { oppositeSide: -4 },
        loyaltyDelta: 5,
        headlineResult: 'Ondata social sugli affitti: oltre 3 milioni di visualizzazioni in un weekend.',
        rivalReaction: 'Slogan perfetti per i reel, ma i comuni aspettano risorse concrete.',
      },
    ],
  },
  {
    id: 'autonomia_differenziata',
    category: 'Territorio',
    severity: 'Alta',
    context: 'any',
    title: 'Scontro sull’Autonomia Differenziata: governatori in rivolta',
    summary:
      'Veneto e Lombardia premono per le intese immediate su scuola e sanità; i sindaci del Mezzogiorno minacciano ricorsi alla Corte Costituzionale.',
    options: [
      {
        id: 'si_autonomia',
        label: 'Accelerare sull’Autonomia: più risorse dove si produce il gettito',
        stance: 'Federalista Nord / Liberista',
        description: 'Pieno appoggio alle regioni settentrionali per responsabilizzare la spesa.',
        budgetDelta: 20000,
        demoEffects: { imprese: 1.3, lavoratori: 0.2, pensionati: 0.2, giovani: -0.3 },
        regionEffects: { nord_ovest: 1.8, nord_est: 2.2, sud: -2.0, isole: -1.6 },
        axisShift: { economic: 8, society: -4 },
        stateEffects: { socialStability: -6 },
        relationEffects: { oppositeSide: -9 },
        loyaltyDelta: 0,
        headlineResult: 'Sì netto all’Autonomia: balzo al Nord, dura contestazione nel Mezzogiorno.',
        rivalReaction: 'Si spacca l’unità nazionale creando cittadini di serie A e B.',
      },
      {
        id: 'stop_autonomia_lep',
        label: 'Moratoria totale finché non sono finanziati i LEP al Sud',
        stance: 'Coesione Nazionale',
        description: 'Difesa dell’unità di scuola e sanità su tutto il territorio italiano.',
        budgetDelta: -10000,
        demoEffects: { lavoratori: 0.9, giovani: 0.8, pensionati: 0.7, imprese: -0.5 },
        regionEffects: { sud: 2.1, isole: 1.8, centro: 0.5, nord_est: -1.4, nord_ovest: -0.9 },
        axisShift: { economic: -8, society: 4 },
        stateEffects: { socialStability: 4 },
        relationEffects: { sameSide: 6 },
        loyaltyDelta: 2,
        headlineResult: 'Stop all’Autonomia senza LEP: grande eco al Sud, irritazione al Nord.',
        rivalReaction: 'Difendere il centralismo romano ha bloccato il Paese per cinquant’anni.',
      },
      {
        id: 'federalismo_solidale',
        label: 'Riforma bipartisan con fondo perequativo legato all’efficienza',
        stance: 'Istituzionale',
        description: 'Autonomia condizionata a standard oggettivi uguali in tutte le 20 regioni.',
        budgetDelta: 5000,
        demoEffects: { imprese: 0.6, pensionati: 0.5, lavoratori: 0.4, giovani: 0.4 },
        regionEffects: { nord_ovest: 0.4, centro: 0.5, sud: 0.4 },
        axisShift: { institutions: -4 },
        stateEffects: { democraticHealth: 4, socialStability: 4 },
        relationEffects: { institutional: 9 },
        loyaltyDelta: 2,
        headlineResult: 'Proposta di federalismo solidale: apprezzamento dai costituzionalisti.',
        rivalReaction: 'Compromesso che rischia di non accontentare né Nord né Sud.',
      },
    ],
  },
  {
    id: 'dazi_usa_export',
    category: 'Esteri',
    severity: 'Alta',
    context: 'any',
    title: 'Guerra commerciale: nuovi dazi USA del 15% sul Made in Italy',
    summary:
      'Washington colpisce agroalimentare, moda e meccanica europea. I distretti del Nord-Est e del Centro chiedono protezione immediata.',
    options: [
      {
        id: 'risposta_comune_ue',
        label: 'Risposta compatta UE con controdazi sui colossi digitali USA',
        stance: 'Federalista UE',
        description: 'Fronte unico europeo con Parigi e Berlino per colpire i servizi Big Tech.',
        budgetDelta: 15000,
        demoEffects: { imprese: 1.2, lavoratori: 0.9, giovani: 0.7, pensionati: 0.4 },
        regionEffects: { nord_est: 0.9, nord_ovest: 0.7, centro: 0.6 },
        axisShift: { europe: 12 },
        stateEffects: { euRelations: 10 },
        relationEffects: { institutional: 9 },
        loyaltyDelta: 2,
        headlineResult: 'Linea ferma con l’UE contro i dazi: sostegno dalle filiere manifatturiere.',
        rivalReaction: 'Una guerra commerciale totale danneggerebbe l’export italiano.',
      },
      {
        id: 'canale_bilaterale',
        label: 'Missione bilaterale a Washington per esenzioni italiane',
        stance: 'Sovranista / Bilaterale',
        description: 'Trattativa diretta con la Casa Bianca puntando sul rapporto speciale.',
        budgetDelta: 20000,
        demoEffects: { imprese: 1.5, pensionati: 0.7, lavoratori: 0.3, giovani: -0.2 },
        regionEffects: { nord_est: 1.1, sud: 0.5 },
        axisShift: { europe: -10, economic: 6 },
        stateEffects: { euRelations: -8, spread: -3 },
        relationEffects: { institutional: -4 },
        loyaltyDelta: 1,
        headlineResult: 'Diplomazia diretta verso Washington: bene i consorzi export, fredda Bruxelles.',
        rivalReaction: 'Andare in ordine sparso indebolisce l’Europa senza garanzie reali.',
      },
      {
        id: 'fondo_export_mercati',
        label: 'Fondo SACE da 2 miliardi per aprire mercati in Asia e Sudamerica',
        stance: 'Pragmatico',
        description: 'Diversificare le esportazioni italiane per ridurre la dipendenza da un solo mercato.',
        budgetDelta: 10000,
        demoEffects: { imprese: 1.1, giovani: 0.6, lavoratori: 0.5, pensionati: 0.2 },
        axisShift: { economic: 4, europe: 4 },
        stateEffects: { euRelations: 4 },
        relationEffects: { institutional: 6 },
        loyaltyDelta: 2,
        headlineResult: 'Piano diversificazione export: reazione positiva delle camere di commercio.',
        rivalReaction: 'Strategia utile nel medio periodo, ma le aziende hanno ordinativi bloccati oggi.',
      },
    ],
  },
  {
    id: 'riforma_pensioni',
    category: 'Lavoro',
    severity: 'Alta',
    context: 'any',
    title: 'Nodo Pensioni: scade la finestra flessibile, scontro su Quota 41',
    summary:
      'L’INPS certifica il calo demografico. I sindacati chiedono uscite flessibili a 62 anni; i giovani temono per la sostenibilità futura.',
    options: [
      {
        id: 'quota_41_tutti',
        label: 'Sì a Quota 41 e aumento delle pensioni minime a 750€',
        stance: 'Statalista / Pro-Anziani',
        description: 'Superare la legge Fornero con un grande stanziamento pubblico.',
        budgetDelta: -20000,
        demoEffects: { pensionati: 2.4, lavoratori: 1.1, giovani: -1.3, imprese: -0.7 },
        axisShift: { economic: -10, europe: -8 },
        stateEffects: { spread: 22, euRelations: -8, socialStability: 6 },
        relationEffects: { institutional: -7 },
        loyaltyDelta: 3,
        headlineResult: 'Svolta sulle pensioni: entusiasmo tra gli over 60, protesta la generazione Z.',
        rivalReaction: 'Promessa insostenibile che scarica 15 miliardi di debito sui giovani.',
      },
      {
        id: 'pensione_garanzia_giovani',
        label: 'Pensione di garanzia per giovani precari e fondi complementari',
        stance: 'Liberista / Generazionale',
        description: 'Flessibilità solo per usuranti, risorse mirate sui contributi under 35.',
        budgetDelta: 10000,
        demoEffects: { giovani: 2.1, imprese: 0.9, lavoratori: 0.5, pensionati: -1.1 },
        axisShift: { economic: 8, society: 6, europe: 6 },
        stateEffects: { spread: -10, euRelations: 7 },
        relationEffects: { institutional: 9 },
        loyaltyDelta: 1,
        headlineResult: 'Scelta di equità generazionale: applausi tra gli under 35, freddo il fronte anziani.',
        rivalReaction: 'Chi lavora da quarant’anni in fabbrica non può aspettare i settant’anni.',
      },
      {
        id: 'usuranti_e_staffetta',
        label: 'Staffetta generazionale incentivata e tutela usuranti',
        stance: 'Equilibrata',
        description: 'Part-time incentivato negli ultimi 3 anni in cambio dell’assunzione di un giovane.',
        budgetDelta: 0,
        demoEffects: { lavoratori: 1.0, pensionati: 0.8, giovani: 0.9, imprese: 0.5 },
        stateEffects: { socialStability: 6 },
        relationEffects: { institutional: 6, sameSide: 4 },
        loyaltyDelta: 2,
        headlineResult: 'Consenso diffuso sulla staffetta generazionale: bene sindacati e imprese.',
        rivalReaction: 'Misura già provata in passato con numeri troppo piccoli.',
      },
    ],
  },
  {
    id: 'ai_automazione_lavoro',
    category: 'Lavoro',
    severity: 'Media',
    context: 'any',
    title: 'Ondata AI nei servizi: 18.000 esuberi annunciati in banche e TLC',
    summary:
      'Grandi gruppi presentano piani di automazione con l’intelligenza artificiale. Scontro fra difesa dell’occupazione e corsa alla competitività.',
    options: [
      {
        id: 'fondo_riqualificazione',
        label: 'Obbligo di riqualificazione pagata dalle aziende e fondo AI',
        stance: 'Transizione Giusta',
        description: 'Nessun licenziamento algoritmico senza 12 mesi di formazione certificata.',
        budgetDelta: 0,
        demoEffects: { lavoratori: 1.6, giovani: 1.1, imprese: -0.4, pensionati: 0.3 },
        axisShift: { economic: -6, society: 6 },
        stateEffects: { socialStability: 8 },
        relationEffects: { institutional: 6, sameSide: 5 },
        loyaltyDelta: 2,
        headlineResult: 'Carta sul lavoro nell’era AI: equilibrio apprezzato da lavoratori e opinione pubblica.',
        rivalReaction: 'Compromesso burocratico che rallenta le imprese.',
      },
      {
        id: 'hub_ai_detassato',
        label: 'Zone franche per data center e startup AI con fisco agevolato',
        stance: 'Liberista / Tech',
        description: 'Attrarre investimenti globali per creare nuova occupazione qualificata.',
        budgetDelta: 35000,
        demoEffects: { imprese: 1.7, giovani: 1.2, lavoratori: -0.9, pensionati: -0.4 },
        regionEffects: { nord_ovest: 1.1, nord_est: 0.7 },
        axisShift: { economic: 12, europe: 6 },
        stateEffects: { spread: -6, socialStability: -5 },
        relationEffects: { institutional: 8 },
        loyaltyDelta: 1,
        headlineResult: 'Svolta tech pro-startup: entusiasmo nel distretto di Milano, protesta sindacale.',
        rivalReaction: 'Tappeti rossi alle Big Tech mentre migliaia di impiegati perdono il posto.',
      },
      {
        id: 'riduzione_orario_ai',
        label: 'Settimana lavorativa di 36 ore a parità di salario grazie all’AI',
        stance: 'Progressista / Statalista',
        description: 'Ridistribuire i guadagni di produttività riducendo l’orario di lavoro.',
        budgetDelta: -15000,
        demoEffects: { giovani: 2.0, lavoratori: 1.8, imprese: -1.8, pensionati: 0.1 },
        axisShift: { economic: -14, society: 12 },
        stateEffects: { socialStability: 7, spread: 8 },
        relationEffects: { oppositeSide: -10, sameSide: 8 },
        loyaltyDelta: 3,
        headlineResult: 'La proposta sulle 36 ore infiamma il dibattito: boom tra lavoratori e under 35.',
        rivalReaction: 'Ricetta fuori dal mondo che metterebbe fuori mercato le PMI.',
      },
    ],
  },
  {
    id: 'sicurezza_urbana',
    category: 'Istituzioni',
    severity: 'Alta',
    context: 'any',
    title: 'Allarme sicurezza nelle stazioni e periferie delle grandi città',
    summary:
      'Episodi di microcriminalità vicino agli snodi ferroviari dominano i telegiornali. I sindaci chiedono più agenti e presidi fissi.',
    options: [
      {
        id: 'decreto_sicurezza_duro',
        label: 'Nuovo Decreto Sicurezza: zone rosse e 8.000 nuovi agenti',
        stance: 'Conservatore / Legge e Ordine',
        description: 'Pene più severe e presidi militari-polizia permanenti nelle stazioni.',
        budgetDelta: 10000,
        demoEffects: { pensionati: 1.9, imprese: 1.2, lavoratori: 0.6, giovani: -0.9 },
        regionEffects: { nord_ovest: 0.9, nord_est: 0.9, centro: 0.4 },
        axisShift: { society: -12, institutions: 10 },
        stateEffects: { socialStability: 4, democraticHealth: -5 },
        relationEffects: { oppositeSide: -7 },
        loyaltyDelta: 2,
        headlineResult: 'Stretta sulla sicurezza urbana: forte risposta di anziani e commercianti.',
        rivalReaction: 'Più reati sulla carta non aumentano la sicurezza senza prevenzione.',
      },
      {
        id: 'rigenerazione_periferie',
        label: 'Piano Periferie: centri civici, scuole aperte e polizia di prossimità',
        stance: 'Progressista / Prevenzione',
        description: 'Unire presenza dello Stato a riqualificazione sociale e presidi educativi.',
        budgetDelta: -15000,
        demoEffects: { giovani: 1.4, lavoratori: 0.9, pensionati: 0.2, imprese: 0.1 },
        regionEffects: { centro: 0.7, sud: 0.7 },
        axisShift: { society: 10, institutions: -6 },
        stateEffects: { socialStability: 6, democraticHealth: 4 },
        relationEffects: { sameSide: 6, institutional: 5 },
        loyaltyDelta: 2,
        headlineResult: 'Proposta sulla rigenerazione urbana: apprezzata dai sindaci progressisti.',
        rivalReaction: 'Belle intenzioni sociologiche, ma i cittadini chiedono subito ordine.',
      },
      {
        id: 'trait_volto_nuovo_sicurezza',
        label: 'Patto civico nei quartieri con fondi diretti ai Comuni (Volto Nuovo)',
        stance: 'Opzione Unica Leader',
        description: 'Supera lo scontro destra-sinistra con un piano pragmatico concordato coi sindaci.',
        requiredTrait: 'volto_nuovo',
        budgetDelta: 5000,
        demoEffects: { pensionati: 1.3, imprese: 1.0, giovani: 1.1, lavoratori: 1.0 },
        axisShift: { institutions: -4 },
        stateEffects: { socialStability: 9, democraticHealth: 4 },
        relationEffects: { institutional: 9 },
        loyaltyDelta: 4,
        headlineResult: 'Approccio post-ideologico sulla sicurezza: il patto coi sindaci convince tutte le fasce.',
        rivalReaction: 'Contenitore generico che prova a tenere insieme posizioni incompatibili.',
      },
    ],
  },
  {
    id: 'difesa_europea_spesa',
    category: 'Esteri',
    severity: 'Alta',
    context: 'any',
    title: 'Vertice NATO-UE: richiesta di portare la difesa al 2,5% del PIL',
    summary:
      'Gli alleati occidentali chiedono un incremento immediato degli stanziamenti militari. Il tema divide sia maggioranza sia opposizione.',
    options: [
      {
        id: 'si_difesa_comune',
        label: 'Sì all’esercito comune europeo finanziato con Eurobond UE',
        stance: 'Federalista UE',
        description: 'Sostenere la difesa europea comune evitando tagli ai capitoli sociali.',
        budgetDelta: 20000,
        demoEffects: { imprese: 1.2, pensionati: 0.5, giovani: 0.4, lavoratori: -0.3 },
        axisShift: { europe: 14, economic: 4 },
        stateEffects: { euRelations: 11, spread: -4 },
        relationEffects: { institutional: 11 },
        loyaltyDelta: 1,
        headlineResult: 'Posizione netta sulla difesa comune europea: applausi nelle capitali partner.',
        rivalReaction: 'Nuove spese militari mentre scuole e ospedali aspettano fondi.',
      },
      {
        id: 'no_riarmo_pace',
        label: 'No netto al riarmo: priorità assoluta a pace e sanità',
        stance: 'Pacifista / Sovranista',
        description: 'Rifiuto dell’aumento spese militari e proposta di conferenza diplomatica.',
        budgetDelta: -10000,
        demoEffects: { giovani: 1.5, lavoratori: 1.2, pensionati: 0.4, imprese: -1.1 },
        regionEffects: { sud: 0.8, centro: 0.6 },
        axisShift: { economic: -8, europe: -10, society: 8 },
        stateEffects: { euRelations: -9, socialStability: 6 },
        relationEffects: { institutional: -8, sameSide: 5 },
        loyaltyDelta: 2,
        headlineResult: 'Mobilitazione pacifista: cresce il consenso tra i giovani e l’elettorato critico.',
        rivalReaction: 'Linea ingenua che lascia l’Italia scoperta e isolata.',
      },
      {
        id: 'cyber_e_industria',
        label: 'Investire su cybersicurezza e filiera aerospaziale italiana',
        stance: 'Industriale / Pragmatico',
        description: 'Trasformare il vincolo internazionale in ricadute tecnologiche nazionali.',
        budgetDelta: 25000,
        demoEffects: { imprese: 1.4, lavoratori: 0.7, giovani: 0.6, pensionati: 0.3 },
        regionEffects: { nord_ovest: 0.8, centro: 0.5 },
        axisShift: { economic: 6, europe: 4 },
        stateEffects: { euRelations: 6 },
        relationEffects: { institutional: 7 },
        loyaltyDelta: 2,
        headlineResult: 'Svolta sulla cybersicurezza industriale: intesa trasversale tra tecnici e imprese.',
        rivalReaction: 'Un modo elegante per mascherare comunque l’aumento della spesa militare.',
      },
    ],
  },
  {
    id: 'transizione_auto_industria',
    category: 'Economia',
    severity: 'Alta',
    context: 'any',
    title: 'Crisi Automotive: cassa integrazione negli stabilimenti italiani',
    summary:
      'Calano le immatricolazioni e la componentistica lancia l’allarme occupazionale. Scontro acceso sullo stop ai motori termici del 2035.',
    options: [
      {
        id: 'rivedere_stop_2035',
        label: 'Chiedere revisione stop 2035 e via libera a biocarburanti',
        stance: 'Conservatore / Filiera Tradizionale',
        description: 'Neutralità tecnologica per difendere gli stabilimenti e l’indotto italiano.',
        budgetDelta: 20000,
        demoEffects: { imprese: 1.6, lavoratori: 1.2, pensionati: 0.8, giovani: -1.0 },
        regionEffects: { nord_ovest: 1.3, nord_est: 0.9, sud: 0.6 },
        axisShift: { society: -8, europe: -8, economic: 6 },
        stateEffects: { euRelations: -6, socialStability: 4 },
        relationEffects: { oppositeSide: -6 },
        loyaltyDelta: 2,
        headlineResult: 'Battaglia per la neutralità tecnologica: plauso dell’indotto auto, critiche verdi.',
        rivalReaction: 'Rallentare la transizione consegna il mercato mondiale dell’auto alla Cina.',
      },
      {
        id: 'ecobonus_gigafactory',
        label: 'Incentivi solo a chi produce auto elettriche e batterie in Italia',
        stance: 'Progressista / Industriale',
        description: 'Vincolare i sussidi pubblici a garanzie occupazionali negli impianti italiani.',
        budgetDelta: -15000,
        demoEffects: { giovani: 1.3, lavoratori: 1.4, imprese: 0.4, pensionati: 0.2 },
        regionEffects: { nord_ovest: 0.9, sud: 0.9 },
        axisShift: { economic: -8, society: 10, europe: 6 },
        stateEffects: { euRelations: 6, socialStability: 5 },
        relationEffects: { sameSide: 6, institutional: 5 },
        loyaltyDelta: 2,
        headlineResult: 'Condizionalità sociale sugli incentivi auto: bene metalmeccanici ed ecologisti.',
        rivalReaction: 'Le imprese si convincono abbassando l’energia, non con nuovi vincoli.',
      },
      {
        id: 'tavolo_crisi_nazionale',
        label: 'Accordo con regioni e sindacati per ammortizzatori sociali',
        stance: 'Istituzionale',
        description: 'Tutelare i redditi in cassa integrazione mentre si tratta coi costruttori.',
        budgetDelta: -5000,
        demoEffects: { lavoratori: 0.9, pensionati: 0.5, imprese: 0.3, giovani: 0.3 },
        stateEffects: { socialStability: 5 },
        relationEffects: { institutional: 7 },
        loyaltyDelta: 1,
        headlineResult: 'Ammortizzatori assicurati per l’automotive: scelta prudente ma poco incisiva.',
        rivalReaction: 'Misure tampone che non affrontano il nodo industriale.',
      },
    ],
  },
  {
    id: 'siccita_sud_infrastrutture',
    category: 'Territorio',
    severity: 'Media',
    context: 'any',
    title: 'Emergenza idrica nel Mezzogiorno: invasi ai minimi storici',
    summary:
      'In Sicilia, Puglia e Basilicata le perdite di rete superano il 45%. Agricoltori in marcia e scontro sull’uso dei fondi PNRR residui.',
    options: [
      {
        id: 'piano_invasi_reti',
        label: 'Commissario straordinario per 3 miliardi su reti idriche e dissalatori',
        stance: 'Emergenza & Territorio',
        description: 'Dirottare fondi in ritardo verso dighe, condotte e sostegno agli agricoltori.',
        budgetDelta: -10000,
        demoEffects: { lavoratori: 0.8, imprese: 0.9, pensionati: 0.7, giovani: 0.7 },
        regionEffects: { sud: 2.0, isole: 2.4, nord_ovest: -0.4 },
        axisShift: { economic: -4 },
        stateEffects: { socialStability: 7 },
        relationEffects: { institutional: 5 },
        loyaltyDelta: 2,
        headlineResult: 'Piano idrico straordinario: forte risposta positiva da Sicilia e Mezzogiorno.',
        rivalReaction: 'Bene intervenire ora, ma i fondi europei sono fermi da tre anni.',
      },
      {
        id: 'grandi_opere_sud',
        label: 'Difendere grandi opere, porti logistici e capitali privati al Sud',
        stance: 'Liberista / Infrastrutture',
        description: 'Priorità a collegamenti veloci e infrastrutture strategiche per attrarre investimenti.',
        budgetDelta: 25000,
        demoEffects: { imprese: 1.4, lavoratori: 0.5, giovani: 0.3, pensionati: 0.2 },
        regionEffects: { sud: 0.8, isole: 0.6, nord_ovest: 0.5 },
        axisShift: { economic: 8 },
        stateEffects: { spread: 4 },
        relationEffects: { institutional: 4 },
        loyaltyDelta: 1,
        headlineResult: 'Confermata la linea sulle grandi opere: plauso costruttori, dubbi ecologisti.',
        rivalReaction: 'Si finanziano cattedrali nel deserto mentre manca l’acqua nei campi.',
      },
      {
        id: 'trait_oratore_tv_sud',
        label: 'Speciale TV in prima serata dai bacini in secca (Oratore TV)',
        stance: 'Opzione Unica Leader',
        description: 'Reportage diretto contro gli sprechi che domina il dibattito serale.',
        requiredTrait: 'oratore_tv',
        budgetDelta: 5000,
        demoEffects: { lavoratori: 1.2, pensionati: 1.1, giovani: 1.0, imprese: 0.8 },
        regionEffects: { sud: 1.8, isole: 2.0, centro: 0.6 },
        stateEffects: { socialStability: 5 },
        loyaltyDelta: 4,
        headlineResult: 'Picco di ascolti in prima serata: il reportage dall’emergenza idrica domina i media.',
        rivalReaction: 'Spettacolarizzare i problemi del Sud davanti alle telecamere non riempie gli invasi.',
      },
    ],
  },
  {
    id: 'dibattito_ue_patto',
    category: 'Unione Europea',
    severity: 'Alta',
    context: 'governo',
    title: 'Procedura UE per deficit eccessivo: ultimatum dall’Ecofin',
    summary:
      'Bruxelles chiede un piano di rientro vincolante sul debito pubblico italiano entro la primavera, pena la sospensione di una tranche di fondi.',
    options: [
      {
        id: 'asse_europeista',
        label: 'Pieno rispetto dei parametri e proposta di Eurobond comuni',
        stance: 'Federalista UE',
        description: 'Rafforzare la credibilità internazionale per trattare da partner affidabile.',
        budgetDelta: 20000,
        demoEffects: { imprese: 1.3, giovani: 1.1, pensionati: 0.4, lavoratori: -0.3 },
        regionEffects: { nord_ovest: 0.8, centro: 0.6 },
        axisShift: { europe: 14, economic: 6 },
        stateEffects: { euRelations: 13, spread: -16 },
        relationEffects: { institutional: 12 },
        loyaltyDelta: 1,
        headlineResult: 'Svolta europeista sul Patto di Stabilità: borse positive, critica l’area sovranista.',
        rivalReaction: 'Ancora una volta si accetta ogni diktat da Bruxelles.',
      },
      {
        id: 'veto_sovranista',
        label: 'Minacciare il veto italiano sul bilancio UE contro l’austerità',
        stance: 'Sovranista',
        description: 'Braccio di ferro in Consiglio Europeo finché non cambiano le regole fiscali.',
        budgetDelta: -10000,
        demoEffects: { lavoratori: 1.0, pensionati: 0.6, imprese: -0.8, giovani: -0.4 },
        regionEffects: { sud: 0.7, nord_est: 0.6 },
        axisShift: { europe: -16, institutions: 6 },
        stateEffects: { euRelations: -15, spread: 24 },
        relationEffects: { institutional: -12, oppositeSide: -8 },
        loyaltyDelta: 2,
        headlineResult: 'Braccio di ferro con Bruxelles: sale lo spread, applaude la base identitaria.',
        rivalReaction: 'Isolare l’Italia in Europa significa perdere miliardi di fondi strutturali.',
      },
      {
        id: 'riforma_pragmatica_ue',
        label: 'Fronte mediterraneo con Francia e Spagna per una clausola industria',
        stance: 'Pragmatico',
        description: 'Costruire un’alleanza diplomatica per ammorbidire i parametri senza strappi.',
        budgetDelta: 10000,
        demoEffects: { imprese: 0.8, lavoratori: 0.6, giovani: 0.5, pensionati: 0.5 },
        axisShift: { europe: 5 },
        stateEffects: { euRelations: 6, spread: -6 },
        relationEffects: { institutional: 6, sameSide: 4 },
        loyaltyDelta: 2,
        headlineResult: 'Asse mediterraneo in UE: approccio giudicato realistico dalle cancellerie.',
        rivalReaction: 'Strategia di buon senso, purché non resti solo sulla carta.',
      },
    ],
  },
  {
    id: 'indagine_appalti_dirigente',
    category: 'Scandalo',
    severity: 'Critica',
    context: 'governo',
    title: 'Avviso di garanzia su appalti pubblici: sotto inchiesta un esponente di vertice',
    summary:
      'La Procura notifica un’indagine per turbativa d’asta e finanziamento illecito a un membro chiave della squadra di governo. Le opposizioni chiedono dimissioni immediate.',
    options: [
      {
        id: 'difesa_oltranza_garantismo',
        label: 'Difendi a oltranza: garantismo fino a sentenza definitiva, nessuna dimissione',
        stance: 'Difesa Quadrata / Garantista',
        description:
          'Fai quadrato attorno al tuo dirigente denunciando un attacco politico-mediatico. Compatti la squadra interna ma esponi il partito alla pressione dei media.',
        budgetDelta: -10000,
        demoEffects: { giovani: -1.1, lavoratori: -0.9, imprese: -0.5, pensionati: -0.7 },
        axisShift: { institutions: 6 },
        stateEffects: { democraticHealth: -4, socialStability: -5 },
        relationEffects: { institutional: -8, sameSide: 4 },
        loyaltyDelta: 9,
        headlineResult: 'Linea dura garantista: il partito fa quadrato, ma i giornali incalzano sull’etica pubblica.',
        rivalReaction: 'Difendere l’indifendibile certifica la distanza del Palazzo dai cittadini.',
      },
      {
        id: 'chiedi_dimissioni_immediate',
        label: 'Chiedi subito dimissioni o autosospensione per tutelare le istituzioni',
        stance: 'Questione Morale / Rigore',
        description:
          'Impone un passo indietro immediato per salvare la credibilità pubblica del partito e aprire la strada a una sostituzione rapida, accettando malumori interni.',
        budgetDelta: 0,
        demoEffects: { giovani: 0.9, lavoratori: 0.7, imprese: 0.4, pensionati: 0.6 },
        axisShift: { institutions: -5 },
        stateEffects: { democraticHealth: 4, socialStability: 4 },
        relationEffects: { institutional: 9 },
        loyaltyDelta: -10,
        headlineResult: 'Passo indietro immediato: stampa e opinione pubblica premiano la fermezza etica, tensioni in Segreteria.',
        rivalReaction: 'Dimissioni inevitabili, ma resta da chiarire il sistema politico dietro l’inchiesta.',
      },
      {
        id: 'trait_magistrato_audit',
        label: 'Sospensione cautelare e audit indipendente trasparente (Ex Magistrato)',
        stance: 'Opzione Unica Leader',
        description:
          'Congela gli incarichi operativi aprendo una verifica interna trasparente che disinnesca lo scontro mediatico senza spaccare la dirigenza.',
        requiredTrait: 'ex_magistrato',
        budgetDelta: -5000,
        demoEffects: { giovani: 1.2, lavoratori: 0.9, imprese: 0.7, pensionati: 0.9 },
        axisShift: { institutions: -6 },
        stateEffects: { democraticHealth: 6, socialStability: 5 },
        relationEffects: { institutional: 11 },
        loyaltyDelta: -2,
        headlineResult: 'Gestione chirurgica dello scandalo: l’audit indipendente disinnesca la crisi mediatica.',
        rivalReaction: 'Mossa abile sul piano comunicativo, ma attendiamo gli atti dei magistrati.',
      },
    ],
  },
  {
    id: 'inchiesta_rimborsi_gruppo',
    category: 'Scandalo',
    severity: 'Alta',
    context: 'opposizione',
    title: 'Inchiesta su rimborsi e spese del gruppo dirigente: bufera nei talk show',
    summary:
      'Un’inchiesta giornalistica seguita da un fascicolo della Corte dei Conti contesta spese di rappresentanza di un dirigente nazionale del tuo partito.',
    options: [
      {
        id: 'difendi_dirigente_opposizione',
        label: 'Difendi il dirigente: attacco strumentale per colpire l’opposizione',
        stance: 'Difesa Politica',
        description:
          'Respingi le accuse come campagna ostile e confermi piena fiducia al dirigente in carica.',
        budgetDelta: -5000,
        demoEffects: { giovani: -0.9, lavoratori: -0.8, imprese: -0.4, pensionati: -0.6 },
        relationEffects: { institutional: -6 },
        loyaltyDelta: 8,
        headlineResult: 'Scudo sul dirigente indagato: la base resta fedele ma cresce l’imbarazzo nei sondaggi.',
        rivalReaction: 'Predicano moralità in Aula e poi coprono gli sprechi in casa propria.',
      },
      {
        id: 'sospendi_dirigente_trasparenza',
        label: 'Sospendi l’esponente e pubblica online ogni voce di bilancio del partito',
        stance: 'Trasparenza Totale',
        description:
          'Pretendi dimissioni immediate dall’incarico e rendi trasparenti tutti i rendiconti del partito.',
        budgetDelta: -5000,
        demoEffects: { giovani: 0.8, lavoratori: 0.6, imprese: 0.5, pensionati: 0.5 },
        stateEffects: { democraticHealth: 3 },
        relationEffects: { institutional: 7 },
        loyaltyDelta: -8,
        headlineResult: 'Operazione trasparenza e autosospensione: reputazione salva, attriti nella dirigenza.',
        rivalReaction: 'Gesto dovuto, ora restituiscano fino all’ultimo euro.',
      },
    ],
  },
  {
    id: 'indagine_ministro_conflitto',
    category: 'Scandalo',
    severity: 'Critica',
    context: 'governo',
    title: 'Inchiesta giudiziaria su un Ministro: sospetto conflitto d’interessi su un appalto PNRR',
    summary:
      'La Procura di Roma acquisisce atti al Ministero su consulenze affidate a una società riconducibile a familiari del Ministro. Le opposizioni minacciano una Commissione d’Inchiesta e i talk show chiedono un passo indietro.',
    options: [
      {
        id: 'difendi_ministro_oltranza',
        label: 'Difendi il Ministro a oltranza: piena fiducia fino a sentenza definitiva',
        stance: 'Garantismo / Quadrato Interno',
        description:
          'Confermi la fiducia politica al Ministro evitando rimpasti forzati. Proteggi gli equilibri della maggioranza ma esponi l’esecutivo al fuoco mediatico.',
        proText: 'Mantiene alta la coesione interna della segreteria e compatta i dirigenti attorno alla leadership.',
        conText: 'Rischia un forte calo di credibilità pubblica, attacchi continui dei media e attriti istituzionali.',
        budgetDelta: -10000,
        demoEffects: { giovani: -1.1, lavoratori: -1.0, imprese: -0.6, pensionati: -0.8 },
        axisShift: { institutions: 7 },
        stateEffects: { democraticHealth: -4, socialStability: -5, euRelations: -4 },
        relationEffects: { institutional: -8, sameSide: 5 },
        loyaltyDelta: 9,
        headlineResult: 'Il Governo fa quadrato sul Ministro indagato: dirigenza compatta, ma bufera mediatica.',
        rivalReaction: 'Tenere un Ministro sotto inchiesta al proprio posto umilia le istituzioni.',
      },
      {
        id: 'dimissioni_ministro_subito',
        label: 'Chiedi le dimissioni del Ministro e libera subito la casella per un rimpasto',
        stance: 'Questione Morale / Rigore Istituzionale',
        description:
          'Pretendi le dimissioni immediate per salvare la credibilità pubblica del Governo e riassegnare il dicastero, accettando forti tensioni interne.',
        proText: 'Salva la reputazione pubblica del partito e del Governo, rassicurando cittadini, stampa e Bruxelles.',
        conText: 'Riduce nettamente la coesione interna e crea malumori nella corrente del Ministro rimosso.',
        budgetDelta: 0,
        demoEffects: { giovani: 0.9, lavoratori: 0.8, imprese: 0.5, pensionati: 0.7 },
        axisShift: { institutions: -6 },
        stateEffects: { democraticHealth: 5, socialStability: 4, euRelations: 4 },
        relationEffects: { institutional: 9 },
        loyaltyDelta: -10,
        headlineResult: 'Dimissioni lampo del Ministro indagato: stampa favorevole al rigore, tensione interna al partito.',
        rivalReaction: 'Hanno ceduto solo davanti all’evidenza, ma il caos nel Consiglio dei Ministri resta.',
      },
      {
        id: 'trait_magistrato_commissaria_appalto',
        label: 'Sospensione dalle deleghe PNRR e trasmissione volontaria degli atti ad ANAC (Ex Magistrato)',
        stance: 'Opzione Unica Leader',
        description:
          'Congeli le deleghe contestate affidando subito il dossier all’Autorità Anticorruzione senza aprire una crisi di governo.',
        proText: 'Tutela credibilità pubblica e rapporti UE contenendo il contraccolpo interno in segreteria.',
        conText: 'Richiede costi di audit legale ed espone comunque a rilievi dell’opposizione parlamentare.',
        requiredTrait: 'ex_magistrato',
        budgetDelta: -8000,
        demoEffects: { giovani: 1.1, lavoratori: 0.9, imprese: 0.8, pensionati: 0.7 },
        axisShift: { institutions: -7 },
        stateEffects: { democraticHealth: 6, euRelations: 5 },
        relationEffects: { institutional: 10, oppositeSide: -6 },
        loyaltyDelta: -2,
        headlineResult: 'Mossa d’anticipo sul caso PNRR: deleghe congelate e atti ad ANAC spiazzano i critici.',
        rivalReaction: 'Soluzione tampone che evita le dimissioni vere, ma vigileremo in Aula.',
      },
    ],
  },
  {
    id: 'scandalo_finanziamento_tesoriere',
    category: 'Scandalo',
    severity: 'Alta',
    context: 'any',
    title: 'Indagine su donazioni opache: sotto la lente un dirigente della tesoreria di partito',
    summary:
      'La Guardia di Finanza chiede chiarimenti su un ciclo di cene di autofinanziamento e contributi non registrati entro i termini della Legge 13/2014. Il caso finisce in apertura dei TG.',
    options: [
      {
        id: 'difendi_tesoriere_linea_dura',
        label: 'Difendi il dirigente a oltranza: "Solo errori formali, attacco a orologeria"',
        stance: 'Difesa Quadrata',
        description:
          'Confermi il tesoriere al suo posto minimizzando le contestazioni contabili e accusando i media di accanimento.',
        proText: 'Mantiene compatta la struttura interna del partito ed evita uno scontro tra correnti.',
        conText: 'Danneggia pesantemente credibilità, raccolta fondi trasparente e consenso tra giovani e ceto medio.',
        budgetDelta: -12000,
        demoEffects: { giovani: -1.0, lavoratori: -0.8, imprese: -0.7, pensionati: -0.6 },
        axisShift: { institutions: 5 },
        stateEffects: { democraticHealth: -4, socialStability: -3 },
        relationEffects: { institutional: -7, sameSide: 4 },
        loyaltyDelta: 8,
        headlineResult: 'Scudo della segreteria sul tesoriere: base dirigente unita, ma crollo di fiducia sulla stampa.',
        rivalReaction: 'Chiamano errori formali i fondi opachi mentre chiedono il 2×1000 ai cittadini.',
      },
      {
        id: 'sospendi_tesoriere_bilancio_aperto',
        label: 'Chiedi dimissioni/sospensione immediata e nomina un nuovo responsabile con bilancio certificato',
        stance: 'Trasparenza & Ricambio',
        description:
          'Rimuovi il dirigente dall’incarico, apri i registri dei donatori e avvii una verifica esterna sul 2×1000 e sul tesseramento.',
        proText: 'Salva la reputazione pubblica e rafforza la credibilità della raccolta fondi trasparente.',
        conText: 'Riduce la coesione interna in Segreteria e richiede spese legali per la certificazione dei conti.',
        budgetDelta: -8000,
        demoEffects: { giovani: 0.9, lavoratori: 0.7, imprese: 0.6, pensionati: 0.5 },
        axisShift: { institutions: -5 },
        stateEffects: { democraticHealth: 4, socialStability: 3 },
        relationEffects: { institutional: 8 },
        loyaltyDelta: -8,
        headlineResult: 'Tolleranza zero sulla tesoreria: dimissioni immediate e bilancio aperto salvano l’immagine.',
        rivalReaction: 'Ripuliscono la facciata dopo l’arrivo della Finanza, ma i dubbi restano.',
      },
    ],
  },
  {
    id: 'crisis_trait_media_prime_time',
    category: 'Società',
    severity: 'Media',
    context: 'any',
    preferredTraits: ['oratore_tv', 'maestro_social', 'volto_nuovo'],
    preferredStyles: ['carismatico', 'tribuno'],
    title: 'Inchiesta TV di prima serata sui programmi politici: sfida in diretta sul tuo profilo pubblico',
    summary:
      'Una celebre trasmissione serale dedica uno speciale alla tenuta concreta del tuo movimento e mette sotto esame coerenza, linguaggio e proposte. La stampa attende una risposta netta entro la sera.',
    options: [
      {
        id: 'prime_time_oratore',
        label: 'Entra in studio a reti unificate e ribalta l’inquadramento con una replica televisiva serrata',
        stance: 'Controffensiva TV',
        description:
          'Accetti il faccia a faccia in prima serata trasformando l’inchiesta in una vetrina diretta verso il pubblico televisivo.',
        proText: 'Massimo impatto su pubblico generalista e pensionati, rafforza l’autorevolezza del leader.',
        conText: 'Suscita reazioni polemiche degli avversari e richiede spese di produzione media.',
        requiredTrait: 'oratore_tv',
        budgetDelta: -3000,
        demoEffects: { pensionati: 0.75, lavoratori: 0.55, imprese: 0.4 },
        relationEffects: { oppositeSide: -6, sameSide: 4 },
        loyaltyDelta: 5,
        headlineResult: 'Show in prima serata: il leader domina la diretta TV e ribalta l’inchiesta a proprio favore.',
        rivalReaction: 'Ha trasformato un approfondimento giornalistico in un comizio personale.',
      },
      {
        id: 'prime_time_social',
        label: 'Lancia un contro-dossier virale in tempo reale sui social con fact-checking aperto',
        stance: 'Fact-Checking Digitale',
        description:
          'Rispondi punto per punto con clip brevi, dati verificabili e diretta streaming parallela per intercettare il pubblico giovane.',
        proText: 'Forte spinta tra giovani e urbani con costi contenuti.',
        conText: 'Raffredda il rapporto con i media tradizionali e i commentatori istituzionali.',
        requiredTrait: 'maestro_social',
        budgetDelta: -2000,
        demoEffects: { giovani: 0.9, lavoratori: 0.35 },
        relationEffects: { institutional: -4, oppositeSide: -5 },
        loyaltyDelta: 3,
        headlineResult: 'Contro-diretta virale: milioni di visualizzazioni oscurano il dibattito televisivo.',
        rivalReaction: 'Parlano solo alla propria bolla digitale evitando le domande vere in studio.',
      },
      {
        id: 'prime_time_istituzionale',
        label: 'Pubblica una nota documentata e pacata invitando la redazione a un tavolo di merito',
        stance: 'Risposta Istituzionale',
        description:
          'Eviti lo scontro di pancia e replichi con una relazione tecnica verificabile, rassicurando alleati e osservatori.',
        proText: 'Rafforza la credibilità istituzionale e il dialogo con potenziali alleati.',
        conText: 'Impatto mediatico più lento e lieve impazienza tra i militanti più combattivi.',
        budgetDelta: -1500,
        demoEffects: { pensionati: 0.35, imprese: 0.35, giovani: -0.15 },
        relationEffects: { institutional: 6, sameSide: 4 },
        loyaltyDelta: -1,
        headlineResult: 'Linea sobria dopo l’inchiesta TV: apprezzamento negli ambienti istituzionali, toni bassi sui social.',
        rivalReaction: 'Una replica burocratica per non rispondere nel merito delle critiche.',
      },
    ],
  },
  {
    id: 'crisis_trait_tesoreria_crescita',
    category: 'Economia',
    severity: 'Media',
    context: 'any',
    preferredTraits: ['fundraiser', 'economista'],
    preferredOrientations: ['riformista', 'tecnopragmatico', 'moderato'],
    title: 'Forum economico-finanziario: imprenditori e fondazioni civiche chiedono garanzie sul tuo programma',
    summary:
      'Associazioni di categoria, PMI e fondazioni civiche organizzano un confronto sul programma economico e sulla sostenibilità dei conti pubblici. La linea scelta incide su donazioni trasparenti e reputazione.',
    options: [
      {
        id: 'forum_fundraiser',
        label: 'Organizza un patto di sottoscrizione trasparente con piccole imprese e sostenitori civici',
        stance: 'Raccolta Trasparente',
        description:
          'Presenti un rendiconto certificato e apri una sottoscrizione pubblica conforme alla Legge 13/2014.',
        proText: 'Porta risorse fresche in cassa e rafforza la fiducia del mondo produttivo.',
        conText: 'Attira critiche dalle forze anti-sistema che accusano vicinanza alle categorie economiche.',
        requiredTrait: 'fundraiser',
        budgetDelta: 14000,
        demoEffects: { imprese: 0.6, lavoratori: -0.2 },
        relationEffects: { institutional: 5, oppositeSide: -6 },
        loyaltyDelta: 2,
        headlineResult: 'Sottoscrizione trasparente di successo al Forum economico: cassa rafforzata e registro pubblico.',
        rivalReaction: 'Si fanno finanziare dai salotti economici mentre dimenticano i salari.',
      },
      {
        id: 'forum_economista',
        label: 'Presenta un piano pluriennale con coperture certificate su debito, crescita e produttività',
        stance: 'Credibilità Tecnica',
        description:
          'Esponi numeri dettagliati su deficit, tagli agli sprechi e incentivi produttivi convincendo analisti e mercati.',
        proText: 'Migliora Spread, rapporti con l’UE e gradimento tra imprese e ceto medio.',
        conText: 'Poco caloroso verso le richieste assistenziali, raffredda la piazza.',
        requiredTrait: 'economista',
        budgetDelta: 4000,
        demoEffects: { imprese: 0.65, giovani: 0.3, lavoratori: -0.25 },
        stateEffects: { spread: -7, euRelations: 4 },
        relationEffects: { institutional: 7 },
        loyaltyDelta: 1,
        headlineResult: 'Applausi tecnici al Forum economico: piano con coperture solide premiato da analisti e mercati.',
        rivalReaction: 'Le solite ricette da tecnocrati scollegate dalla vita quotidiana delle famiglie.',
      },
      {
        id: 'forum_mediazione_sociale',
        label: 'Proponi un patto bilanciato tra produttività delle PMI e tutela del potere d’acquisto',
        stance: 'Patto Produttivo',
        description:
          'Tieni insieme semplificazione fiscale per le aziende e incentivi ai contratti stabili.',
        proText: 'Mantiene equilibrio tra lavoratori e imprese con una piccola raccolta trasparente.',
        conText: 'Nessuna categoria ottiene tutto ciò che chiede e l’impatto nei media resta moderato.',
        budgetDelta: 3500,
        demoEffects: { imprese: 0.3, lavoratori: 0.35, giovani: 0.15 },
        stateEffects: { socialStability: 2 },
        relationEffects: { sameSide: 3, institutional: 3 },
        loyaltyDelta: -1,
        headlineResult: 'Sintesi moderata al Forum economico: dialogo aperto tra imprese e sindacati.',
        rivalReaction: 'Un compromesso tiepido che scontenta tutti senza indicare una vera rotta.',
      },
    ],
  },
  {
    id: 'crisis_trait_vertenza_territorio',
    category: 'Lavoro',
    severity: 'Alta',
    context: 'any',
    preferredTraits: ['sindacalista'],
    preferredOrientations: ['socialista', 'territorialista', 'progressista', 'populista'],
    preferredStyles: ['tribuno'],
    title: 'Crisi di filiera e presidi territoriali: comitati locali e sindacati invocano una presa di posizione',
    summary:
      'Una ristrutturazione industriale colpisce fornitori locali e lavoratori in diverse province. I circoli territoriali chiedono un’iniziativa immediata accanto alle comunità coinvolte.',
    options: [
      {
        id: 'vertenza_sindacalista',
        label: 'Apri un tavolo diretto con RSU, lavoratori e consorzio industriale per salvaguardare i posti',
        stance: 'Mediazione Sindacale',
        description:
          'Metti in campo la tua rete sindacale per costruire un protocollo di riconversione e cassa integrazione mirata.',
        proText: 'Forte radicamento tra lavoratori e sindacati, alta coesione nei circoli locali.',
        conText: 'Costo organizzativo per il presidio e freddezza tra gli ambienti più liberisti.',
        requiredTrait: 'sindacalista',
        budgetDelta: -4500,
        demoEffects: { lavoratori: 0.85, pensionati: 0.35, imprese: -0.3 },
        stateEffects: { socialStability: 5 },
        relationEffects: { sameSide: 6, oppositeSide: -5 },
        loyaltyDelta: 6,
        headlineResult: 'Protocollo di mediazione sulla crisi industriale: applausi dai delegati RSU e dai territori.',
        rivalReaction: 'Promettono salvataggi assistenziali senza fare i conti con la competitività.',
      },
      {
        id: 'vertenza_territoriale',
        label: 'Mobilitazione di piazza nei distretti colpiti con i sindaci e i comitati regionali',
        stance: 'Difesa del Territorio',
        description:
          'Porti la segreteria in strada al fianco degli amministratori locali chiedendo fondi dedicati alle aree di crisi.',
        proText: 'Spinta su lavoratori, Mezzogiorno e consenso nei collegi territoriali.',
        conText: 'Alza la tensione con i grandi gruppi industriali e richiede spese logistiche.',
        budgetDelta: -5500,
        demoEffects: { lavoratori: 0.65, giovani: 0.3, imprese: -0.35 },
        regionEffects: { sud: 0.6, isole: 0.4, centro: 0.2 },
        stateEffects: { socialStability: -2 },
        relationEffects: { sameSide: 4, institutional: -4 },
        loyaltyDelta: 4,
        headlineResult: 'Piazze piene nei distretti in crisi: il movimento si intesta la battaglia dei territori.',
        rivalReaction: 'Soffiano sul disagio locale senza offrire una sola soluzione industriale.',
      },
      {
        id: 'vertenza_riconversione',
        label: 'Proponi un fondo di riqualificazione digitale e incentivi alle nuove imprese del territorio',
        stance: 'Riconversione Innovativa',
        description:
          'Punti su formazione, bandi innovativi e attrazione di nuovi investimenti privati nella filiera.',
        proText: 'Apprezzato da imprese, giovani e osservatori economici.',
        conText: 'I lavoratori in presidio giudicano la risposta troppo lenta nel breve periodo.',
        budgetDelta: -3000,
        demoEffects: { imprese: 0.55, giovani: 0.45, lavoratori: -0.35 },
        stateEffects: { euRelations: 2, spread: -3 },
        relationEffects: { institutional: 5 },
        loyaltyDelta: -2,
        headlineResult: 'Piano di riqualificazione per la filiera in crisi: sì delle imprese, scettici i presidi operai.',
        rivalReaction: 'Parlano di corsi di formazione mentre le famiglie rischiano lo stipendio domani.',
      },
    ],
  },
  {
    id: 'crisis_trait_dossier_bruxelles',
    category: 'Unione Europea',
    severity: 'Alta',
    context: 'any',
    preferredTraits: ['diplomazia_ue', 'economista'],
    preferredOrientations: ['riformista', 'moderato', 'tecnopragmatico', 'conservatore'],
    preferredStyles: ['istituzionale', 'stratega'],
    title: 'Negoziato a Bruxelles sui fondi strategici e le regole di bilancio: Italia sotto osservazione',
    summary:
      'La Commissione Europea apre un confronto serrato sulle scadenze degli investimenti pubblici e sui vincoli del Patto di Stabilità. La posizione del tuo partito pesa su alleati, mercati e opinione pubblica.',
    options: [
      {
        id: 'bruxelles_diplomazia',
        label: 'Attiva i canali riservati a Bruxelles per negoziare flessibilità sugli investimenti produttivi',
        stance: 'Diplomazia Europea',
        description:
          'Costruisci un asse con i partner europei moderati per strappare deroghe mirate senza rotture traumatiche.',
        proText: 'Forte guadagno su relazioni UE, Spread e credibilità istituzionale verso alleati e mercati.',
        conText: 'Qualche malumore nell’ala più identitaria e spese per missioni diplomatiche.',
        requiredTrait: 'diplomazia_ue',
        budgetDelta: -3500,
        demoEffects: { imprese: 0.6, pensionati: 0.35, giovani: 0.35 },
        stateEffects: { euRelations: 8, spread: -9, democraticHealth: 2 },
        relationEffects: { institutional: 8, sameSide: 4 },
        loyaltyDelta: 2,
        headlineResult: 'Sponda europea ottenuta a Bruxelles: mercati distesi e plauso alla linea diplomatica.',
        rivalReaction: 'Si accontentano di qualche briciola di flessibilità pur di non disturbare Bruxelles.',
      },
      {
        id: 'bruxelles_braccio_ferro',
        label: 'Rivendica la sovranità di bilancio italiana e contesta pubblicamente i vincoli europei',
        stance: 'Linea Sovrana',
        description:
          'Chiedi una sospensione immediata dei parametri fiscali minacciando il veto sulle prossime direttive.',
        proText: 'Consenso immediato nell’elettorato euroscettico e forte coesione dell’ala identitaria.',
        conText: 'Peggiora Spread, relazioni con l’UE e irrigidisce i partiti moderati.',
        budgetDelta: -2000,
        demoEffects: { lavoratori: 0.55, pensionati: 0.4, imprese: -0.45, giovani: -0.3 },
        stateEffects: { spread: 14, euRelations: -9 },
        relationEffects: { institutional: -8, sameSide: 5, oppositeSide: -6 },
        loyaltyDelta: 5,
        headlineResult: 'Scontro frontale con Bruxelles: applausi dalla base identitaria, tensione sullo Spread.',
        rivalReaction: 'Giocano con i risparmi degli italiani pur di raccogliere qualche titolo sui giornali.',
      },
      {
        id: 'bruxelles_pragmatico',
        label: 'Chiedi una rimodulazione trasparente delle priorità di spesa restando nel perimetro UE',
        stance: 'Pragmatismo Europeo',
        description:
          'Difendi la puntualità sui conti chiedendo di concentrare i fondi su sanità, energia e infrastrutture.',
        proText: 'Mantiene stabili Spread e rapporti istituzionali con moderato gradimento trasversale.',
        conText: 'Poco incisivo nella battaglia mediatica settimanale.',
        budgetDelta: -2000,
        demoEffects: { imprese: 0.3, pensionati: 0.25, lavoratori: 0.15 },
        stateEffects: { euRelations: 4, spread: -4 },
        relationEffects: { institutional: 5 },
        loyaltyDelta: -1,
        headlineResult: 'Linea pragmatica sui fondi UE: stabilità apprezzata a Roma e Bruxelles.',
        rivalReaction: 'Nessun coraggio di difendere gli interessi nazionali né di riformare davvero la spesa.',
      },
    ],
  },
  {
    id: 'crisis_trait_legalita_istituzioni',
    category: 'Istituzioni',
    severity: 'Alta',
    context: 'any',
    preferredTraits: ['ex_magistrato', 'volto_nuovo'],
    preferredOrientations: ['progressista', 'populista', 'moderato', 'conservatore'],
    preferredStyles: ['istituzionale', 'stratega'],
    title: 'Dossier appalti pubblici e trasparenza amministrativa: scontro tra garantisti e rigoristi',
    summary:
      'Un rapporto indipendente segnala ritardi e opacità nella gestione di grandi appalti locali in diverse regioni (senza coinvolgere il tuo partito). Si accende il dibattito nazionale su controlli, giustizia e semplificazione.',
    options: [
      {
        id: 'appalti_ex_magistrato',
        label: 'Proponi un codice anticorruzione con tracciabilità digitale e controlli preventivi certi',
        stance: 'Rigore & Garanzia',
        description:
          'Sfrutti la tua autorevolezza giuridica per presentare norme tecnicamente inattaccabili che uniscono legalità e rapidità.',
        proText: 'Forte spinta su salute democratica, credibilità istituzionale e consenso trasversale.',
        conText: 'Irritazione di alcune lobby burocratiche e piccoli costi di consulenza legislativa.',
        requiredTrait: 'ex_magistrato',
        budgetDelta: -3000,
        demoEffects: { giovani: 0.65, lavoratori: 0.55, pensionati: 0.45, imprese: 0.2 },
        stateEffects: { democraticHealth: 7, socialStability: 3 },
        relationEffects: { institutional: 8, oppositeSide: -5 },
        loyaltyDelta: 4,
        headlineResult: 'Proposta anti-opacità accolta con rispetto bipartisan: legalità e tempi certi sugli appalti.',
        rivalReaction: 'Tornano alla cultura del sospetto perenne che blocca i cantieri.',
      },
      {
        id: 'appalti_volto_nuovo',
        label: 'Lancia una campagna civica "Palazzi di Vetro" per aprire online ogni contratto pubblico',
        stance: 'Rinnovamento Civico',
        description:
          'Ti presenti come rottura credibile rispetto alle vecchie pratiche di spartizione, mobilitando giovani e astensionisti.',
        proText: 'Forte crescita tra giovani e nuovi elettori, alta visibilità nei media indipendenti.',
        conText: 'Freddezza dei partiti tradizionali che temono la competizione civica.',
        requiredTrait: 'volto_nuovo',
        budgetDelta: -2500,
        demoEffects: { giovani: 0.9, lavoratori: 0.45, pensionati: 0.2 },
        stateEffects: { democraticHealth: 5 },
        relationEffects: { institutional: -3, oppositeSide: -6 },
        loyaltyDelta: 5,
        headlineResult: 'Campagna "Palazzi di Vetro": forte eco tra i giovani e i delusi della politica tradizionale.',
        rivalReaction: 'Slogan populisti sulla trasparenza senza conoscere la macchina amministrativa.',
      },
      {
        id: 'appalti_semplificazione',
        label: 'Chiedi snellimento delle procedure e responsabilità diretta dei dirigenti senza bloccare i cantieri',
        stance: 'Efficienza & Semplificazione',
        description:
          'Metti al centro la velocità delle opere pubbliche riducendo i passaggi burocratici ridondanti.',
        proText: 'Apprezzato dalle imprese e dalle associazioni dei costruttori.',
        conText: 'Critiche da chi chiede controlli più severi contro le infiltrazioni.',
        budgetDelta: -1500,
        demoEffects: { imprese: 0.65, giovani: -0.25, lavoratori: -0.15 },
        stateEffects: { democraticHealth: -2, spread: -3 },
        relationEffects: { institutional: 3 },
        loyaltyDelta: 1,
        headlineResult: 'Priorità ai cantieri veloci: consenso tra le imprese, polemiche sul fronte dei controlli.',
        rivalReaction: 'Deregulation irresponsabile proprio mentre crescono i rischi sugli appalti.',
      },
    ],
  },
  {
    id: 'crisis_trait_congresso_alleanze',
    category: 'Istituzioni',
    severity: 'Media',
    context: 'any',
    preferredStyles: ['stratega', 'carismatico'],
    preferredOrientations: ['moderato', 'conservatore', 'socialista', 'territorialista'],
    title: 'Tensioni in direzione nazionale: le correnti chiedono chiarimenti su alleanze e linea politica',
    summary:
      'A seguito degli ultimi sondaggi, due aree interne del partito (invenzione di gioco) sollevano dubbi sulla strategia di coalizione e sulla gestione delle risorse territoriali. Serve una sintesi autorevole.',
    options: [
      {
        id: 'direzione_sintesi_strategica',
        label: 'Convoca una direzione unitaria, ridistribuisci deleghe e fissa un patto chiaro sulle alleanze',
        stance: 'Regia Politica',
        description:
          'Gestisci il confronto con metodo, ascolti i territori e chiudi il documento politico con ampia convergenza.',
        proText: 'Rafforza coesione interna, lealtà dei dirigenti e affidabilità agli occhi degli alleati.',
        conText: 'Richiede spese organizzative per l’assemblea e un tono meno aggressivo in TV.',
        budgetDelta: -4000,
        demoEffects: { pensionati: 0.3, lavoratori: 0.25, giovani: -0.1 },
        relationEffects: { sameSide: 7, institutional: 5 },
        loyaltyDelta: 9,
        headlineResult: 'Direzione nazionale compatta: il leader ricuce le correnti e blinda la linea sulle alleanze.',
        rivalReaction: 'Un compromesso di palazzo che rimanda le vere divisioni interne.',
      },
      {
        id: 'direzione_rilancio_identitario',
        label: 'Rilancia la linea del leader davanti ai militanti chiedendo disciplina e mobilitazione',
        stance: 'Leadership Forte',
        description:
          'Tagli corto sui distinguo interni e punti sulla forza della base militante per imporre la tua agenda.',
        proText: 'Immagine di decisione nei media e slancio tra i sostenitori più convinti.',
        conText: 'Logora la lealtà dell’ala critica in segreteria e irrigidisce i partner di dialogo.',
        budgetDelta: -2000,
        demoEffects: { lavoratori: 0.35, giovani: 0.3, imprese: -0.15 },
        relationEffects: { sameSide: -4, oppositeSide: -5 },
        loyaltyDelta: -6,
        headlineResult: 'Prova di forza del segretario: base galvanizzata, ma malumori tra i dirigenti.',
        rivalReaction: 'Gestione padronale del partito: chi dissente viene messo all’angolo.',
      },
    ],
  },
];

/**
 * Garantisce che ogni singola opzione di dossier nel gioco abbia un trade-off politico reale
 * (sia benefici sia costi/rischi applicati effettivamente dal motore di gioco), evitando opzioni "gratis".
 */
function ensureBalancedCrisisOption(opt: CrisisOption): CrisisOption {
  const hasNegDemo = Object.values(opt.demoEffects ?? {}).some((v) => (v ?? 0) < 0);
  const hasNegReg = Object.values(opt.regionEffects ?? {}).some((v) => (v ?? 0) < 0);
  const hasNegState =
    (opt.stateEffects?.spread ?? 0) > 0 ||
    (opt.stateEffects?.socialStability ?? 0) < 0 ||
    (opt.stateEffects?.euRelations ?? 0) < 0 ||
    (opt.stateEffects?.democraticHealth ?? 0) < 0;
  const hasNegBudget = (opt.budgetDelta ?? 0) < 0;
  const hasNegLoyalty = (opt.loyaltyDelta ?? 0) < 0;
  const hasNegRel =
    (opt.relationEffects?.oppositeSide ?? 0) < 0 ||
    (opt.relationEffects?.institutional ?? 0) < 0 ||
    (opt.relationEffects?.sameSide ?? 0) < 0;

  if (hasNegDemo || hasNegReg || hasNegState || hasNegBudget || hasNegLoyalty || hasNegRel) {
    return opt;
  }

  const stanceLower = `${opt.stance} ${opt.label}`.toLowerCase();
  const nextDemo = { ...opt.demoEffects };
  const nextState = { ...(opt.stateEffects ?? {}) };
  const nextRel = { ...(opt.relationEffects ?? {}) };
  let nextBudget = opt.budgetDelta;
  let nextLoyalty = opt.loyaltyDelta ?? 0;

  if (opt.requiredTrait) {
    // Le mosse speciali da leader portano esposizione mediatica e attrito con gli avversari o impegno di cassa
    nextRel.oppositeSide = (nextRel.oppositeSide ?? 0) - 7;
    if (nextBudget <= 5000) {
      nextBudget -= 6000;
    } else {
      nextLoyalty = Math.min(nextLoyalty, -1);
    }
  } else if (
    stanceLower.includes('liberist') ||
    stanceLower.includes('mercat') ||
    stanceLower.includes('impres')
  ) {
    nextDemo.lavoratori = Math.min(nextDemo.lavoratori ?? 0, -0.35);
    nextState.socialStability = (nextState.socialStability ?? 0) - 2;
  } else if (
    stanceLower.includes('statalist') ||
    stanceLower.includes('social') ||
    stanceLower.includes('welfare')
  ) {
    nextState.spread = (nextState.spread ?? 0) + 6;
    nextDemo.imprese = Math.min(nextDemo.imprese ?? 0, -0.35);
  } else if (stanceLower.includes('federal') || stanceLower.includes('ue')) {
    nextRel.oppositeSide = (nextRel.oppositeSide ?? 0) - 7;
    nextDemo.pensionati = Math.min(nextDemo.pensionati ?? 0, -0.25);
  } else {
    // Opzioni pragmatiche / istituzionali / compromesso: raffreddano l'ala militante e hanno un piccolo costo organizzativo
    nextLoyalty = Math.min(nextLoyalty - 2, -1);
    nextRel.oppositeSide = (nextRel.oppositeSide ?? 0) - 5;
    if (nextBudget >= 0) {
      nextBudget = Math.max(-5000, nextBudget - 5000);
    }
  }

  return {
    ...opt,
    budgetDelta: nextBudget,
    demoEffects: nextDemo,
    stateEffects: Object.keys(nextState).length > 0 ? nextState : opt.stateEffects,
    relationEffects: Object.keys(nextRel).length > 0 ? nextRel : opt.relationEffects,
    loyaltyDelta: nextLoyalty,
  };
}

export const CRISIS_POOL: CrisisEvent[] = [
  ...CORE_CRISES,
  ...EXTRA_CRISES,
  ...EXPANDED_DOSSIERS,
].map((event) => ({
  ...event,
  options: event.options.map(ensureBalancedCrisisOption),
}));

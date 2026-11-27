import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Coins,
  Compass,
  Landmark,
  Lightbulb,
  MapPin,
  PlayCircle,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Vote,
  X,
} from 'lucide-react';
import { LegalTabId } from './LegalModal';

type GuideCategoryId =
  | 'come_si_gioca'
  | 'primi_passi'
  | 'territorio'
  | 'elezioni'
  | 'parlamento_quirinale'
  | 'economia_finanze'
  | 'dirigenti_crisi'
  | 'glossario';

interface GuideStepItem {
  label?: string;
  text: string;
}

interface GuideStepBlock {
  heading: string;
  badge?: string;
  listType: 'ordered' | 'unordered';
  items: GuideStepItem[];
  tip?: string;
}

interface GuideEntry {
  id: string;
  category: GuideCategoryId;
  title: string;
  subtitle: string;
  articleRef?: string;
  keywords: string[];
  realWorldRule?: string;
  simulatorRule?: string;
  practicalBlocks?: GuideStepBlock[];
}

interface TabGuideProps {
  /** Optional back handler when opened directly from the Main Menu screen */
  onBack?: () => void;
  /** Optional handler to open the Privacy, Legal & Data Sources modal */
  onOpenLegal?: (tab?: LegalTabId) => void;
}

const CATEGORIES: {
  id: GuideCategoryId;
  label: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  badgeClass: string;
  featured?: boolean;
}[] = [
  {
    id: 'come_si_gioca',
    label: 'Come si Gioca — Guida Pratica Passo-Passo',
    description:
      'Ciclo settimanale, prime mosse in base alla partenza, guida alle schede, risorse e percorso verso Palazzo Chigi.',
    icon: <PlayCircle className="w-4 h-4 text-sky-400 shrink-0" />,
    accent: 'text-sky-300',
    badgeClass: 'border-sky-500/45 bg-sky-500/12 text-sky-200',
    featured: true,
  },
  {
    id: 'primi_passi',
    label: 'Primi Passi & Status del Partito',
    description: 'Fondazione, soglia parlamentare, firme per le liste e apparentamenti.',
    icon: <Compass className="w-4 h-4 text-cyan-400 shrink-0" />,
    accent: 'text-cyan-300',
    badgeClass: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200',
  },
  {
    id: 'territorio',
    label: 'Territorio & Radicamento',
    description: 'Sezioni, circoli locali, costi di gestione, iscritti e consenso regionale.',
    icon: <MapPin className="w-4 h-4 text-teal-400 shrink-0" />,
    accent: 'text-teal-300',
    badgeClass: 'border-teal-500/40 bg-teal-500/10 text-teal-200',
  },
  {
    id: 'elezioni',
    label: 'Sistema Elettorale & Voto',
    description: 'Rosatellum, Politiche, Europee a 5 circoscrizioni (76 seggi) e Regionali.',
    icon: <Vote className="w-4 h-4 text-amber-400 shrink-0" />,
    accent: 'text-amber-300',
    badgeClass: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  },
  {
    id: 'parlamento_quirinale',
    label: 'Parlamento, Governo & Quirinale',
    description: 'DDL, Decreto-Legge, Fiducia, Commissioni, Manovra e Presidente della Repubblica.',
    icon: <Landmark className="w-4 h-4 text-emerald-400 shrink-0" />,
    accent: 'text-emerald-300',
    badgeClass: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  },
  {
    id: 'economia_finanze',
    label: 'Economia Statale & Finanze del Partito',
    description: 'PIL, Debito Pubblico, Spread, Inflazione, Cassa di Partito, Tesseramento e 2×1000.',
    icon: <Coins className="w-4 h-4 text-yellow-400 shrink-0" />,
    accent: 'text-yellow-300',
    badgeClass: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-200',
  },
  {
    id: 'dirigenti_crisi',
    label: 'Dirigenti, Dossier, Crisi & Referendum',
    description: 'Affinità ministeriali, scissioni, scandali, dossier con Pro/Contro, TV e Referendum.',
    icon: <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />,
    accent: 'text-rose-300',
    badgeClass: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
  },
  {
    id: 'glossario',
    label: 'Glossario Politico & Istituzionale',
    description: 'Definizioni rapide di sigle, istituti costituzionali e termini ricorrenti del simulatore.',
    icon: <BookMarked className="w-4 h-4 text-indigo-400 shrink-0" />,
    accent: 'text-indigo-300',
    badgeClass: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200',
  },
];

const GUIDE_ENTRIES: GuideEntry[] = [
  // =========================================================================
  // 0. COME SI GIOCA — GUIDA PRATICA PASSO-PASSO
  // =========================================================================
  {
    id: 'come_ciclo_settimanale',
    category: 'come_si_gioca',
    title: 'Il Ciclo Settimanale (Come andare avanti)',
    subtitle:
      'Turni settimanali, gestione basata su Budget Reale e cadenze operative, sblocco del pulsante Avanza e aggiornamenti di fine turno',
    articleRef: 'Passo 1 · Ciclo di Turno',
    keywords: [
      'come si gioca',
      'ciclo settimanale',
      'turno',
      'avanza',
      'avanza settimana',
      'bloccato',
      'budget',
      'risorse',
      'cadenza',
      'dirigenti',
      'dossier obbligatori',
      'eventi obbligatori',
      'crisi e media',
      'cambio settimana',
      'sondaggi',
      'entrate',
      'uscite',
      'cassa',
      'raccolta firme',
      'leggi',
    ],
    practicalBlocks: [
      {
        heading: 'Sequenza consigliata per ogni turno settimanale',
        badge: '4 Passaggi',
        listType: 'ordered',
        items: [
          {
            label: 'Leggi la barra superiore (HUD):',
            text: 'controlla Data, Cassa Partito, Bilancio settimanale stimato (entrate meno uscite fisse), Consenso nazionale con variazione settimanale e il conto alla rovescia verso le Elezioni (o verso la scadenza del Comitato Promotore).',
          },
          {
            label: 'Pianifica le mosse usando Budget Reale e risorse organizzative:',
            text: 'ogni iniziativa dipende dalla tua Cassa in Euro e da limiti operativi naturali e realistici (1 iniziativa per canale di Campagna a settimana, 1 Duello TV a settimana, 1 colloquio o incarico a settimana per ciascun dirigente, 1 votazione d’Aula a settimana, 1 rimpasto a settimana).',
          },
          {
            label: 'Gestisci i Dossier obbligatori in Crisi & Media:',
            text: 'ogni settimana arrivano da 1 a 3 Dossier / Eventi contestuali (inclusi dossier specifici legati all’identità del tuo partito e ai tratti del leader). Se il pulsante "Avanza" appare disabilitato con il badge arancione/rosso dei Dossier, apri subito la scheda Crisi & Media e scegli una linea politica (oppure clicca "Salta / Nessuna dichiarazione") per ciascun evento in sospeso. Lo stesso blocco protettivo vale durante una Notte Elettorale, la Legge di Bilancio o l’Elezione del Quirinale.',
          },
          {
            label: 'Clicca "Avanza Settimana":',
            text: 'una volta risolti tutti i Dossier obbligatori e pianificate le iniziative della settimana, il pulsante diventa attivo e fa avanzare la legislatura.',
          },
        ],
      },
      {
        heading: 'Cosa succede automaticamente al cambio di settimana',
        badge: 'Aggiornamento Turno',
        listType: 'unordered',
        items: [
          {
            label: 'Aggiornamento sondaggi e mappa (crescita graduale realistica):',
            text: 'vengono ricalcolati i consensi nazionali e regionali in base alle campagne, ai circoli attivi sul territorio, ai Tratti del partito/leader e alle scelte nei Dossier, nel rispetto di un Weekly Cap rigoroso (max +0,1%/settimana per partiti piccoli e medi sotto il 9%, max +0,2% sopra il 9%) così che scalare i sondaggi richieda una legislatura di lavoro costante.',
          },
          {
            label: 'Entrate e uscite di Cassa:',
            text: 'entrano il tesseramento organico, i circoli locali, la quota settimanale 2×1000 e i contributi degli eventuali parlamentari eletti (+€450/sett. per seggio), mentre vengono scalate le spese fisse proporzionate alla struttura, il mantenimento delle sezioni e le eventuali penalità dovute a Spread critico.',
          },
          {
            label: 'Avanzamento leggi, commissioni e raccolta firme:',
            text: 'scorrono i timer di conversione dei Decreti-Legge (finestra di 8 settimane), progrediscono i DDL ordinari, le Commissioni d’Inchiesta e i Referendum in corso, e si aggiorna il calendario della raccolta firme e del Comitato Promotore.',
          },
          {
            label: 'Nuovo calendario settimanale:',
            text: 'si rinnovano la disponibilità di dirigenti, canali di campagna e calendario d’Aula, e in Crisi & Media compaiono i nuovi Dossier della settimana.',
          },
        ],
        tip: 'Se clicchi direttamente sul badge arancione "Dossier" accanto al tasto Avanza nella barra in alto, verrai portato subito agli eventi ancora da risolvere.',
      },
    ],
  },
  {
    id: 'come_prime_settimane',
    category: 'come_si_gioca',
    title: 'Cosa fare nelle prime settimane (In base alla tua partenza)',
    subtitle:
      'Strategia pratica di apertura per Comitato Promotore / micro-partito, Opposizione parlamentare e Governo',
    articleRef: 'Passo 2 · Strategia Iniziale',
    keywords: [
      'prime settimane',
      'inizio',
      'partenza',
      '0%',
      'comitato promotore',
      'micro-partito',
      'micro partito',
      'sotto 2%',
      'opposizione',
      'parlamento',
      'governo',
      'spread',
      'debito pubblico',
      'sezioni',
      'firme',
      'apparentamento',
      'dibattiti tv',
      'emendamenti',
      'proposte',
      'riforme',
      'coalizione',
    ],
    practicalBlocks: [
      {
        heading: 'Se parti da 0% (Comitato Promotore) o micro-partito (< 2%)',
        badge: 'Extra-Parlamentare',
        listType: 'ordered',
        items: [
          {
            label: 'Apri le prime sezioni sul Territorio:',
            text: 'vai nella scheda Territorio (o clicca le regioni sulla mappa in Plancia) e inaugura le prime sedi/circoli nelle regioni più strategiche per la tua area, senza prosciugare subito la Cassa.',
          },
          {
            label: 'Costruisci base di iscritti e accumula fondi:',
            text: 'nella scheda Partito avvia la Campagna di Tesseramento Annuale e organizza Crowdfunding o Cene Sostenitori per finanziare l’espansione e coprire i costi fissi settimanali.',
          },
          {
            label: 'Raccogli le firme per le liste (o tratta un apparentamento):',
            text: 'organizza banchetti settimanali (molto più efficaci dove hai già aperto sezioni) per completare la fase costituente del Comitato (30.000 firme) e poi le firme richieste per accedere alle schede elettorali (60.000 Politiche / 150.000 Europee). In alternativa, tratta un apparentamento / alleanza con un partito già presente in Parlamento per ottenere l’esenzione.',
          },
        ],
      },
      {
        heading: 'Se parti da partito già in Parlamento (Opposizione)',
        badge: 'Opposizione',
        listType: 'ordered',
        items: [
          {
            label: 'Gestisci con coerenza i Dossier settimanali:',
            text: 'rispondi ai temi caldi in Crisi & Media scegliendo una linea riconoscibile che consolidi la tua base e intercetti gli elettori delusi dalla maggioranza.',
          },
          {
            label: 'Sfrutta Campagna, Dibattiti TV e Tratti Attivi:',
            text: 'investi il budget in iniziative mediatiche mirate (1 per canale a settimana) e sfida i leader avversari nei Duelli TV 1 vs 1 valorizzando l’Identità del partito e i Tratti del tuo leader per scalare i sondaggi con costanza.',
          },
          {
            label: 'Lavora in Parlamento e prepara le alleanze:',
            text: 'usa proposte, battaglie d’Aula, Commissioni d’Inchiesta e Referendum per mettere sotto pressione l’esecutivo, mentre nella scheda Partito costruisci convergenze e coalizioni in vista del voto.',
          },
        ],
      },
      {
        heading: 'Se sei al Governo',
        badge: 'Palazzo Chigi',
        listType: 'ordered',
        items: [
          {
            label: 'Tieni sotto controllo Spread, Debito Pubblico e UE:',
            text: 'monitora ogni settimana il cruscotto in Parlamento e Governo: mantieni lo Spread sotto i 240 bps, evita deficit fuori controllo nella Legge di Bilancio e conserva i Rapporti UE sopra il 35%.',
          },
          {
            label: 'Difendi la coesione della maggioranza:',
            text: 'controlla la soddisfazione degli alleati (mai sotto il 35%) e l’affinità dei Ministri; intervieni con un Rimpasto (1 a settimana) se un ministro è fuori ruolo o travolto da uno scandalo.',
          },
          {
            label: 'Approva le riforme senza far cadere la coalizione:',
            text: 'alterna DDL Ordinari e Decreti-Legge (ricordando di convertire i DL entro 8 settimane prima che decadano) e ricorri alla Questione di Fiducia con parsimonia per non logorare alleati e tenuta democratica.',
          },
        ],
      },
    ],
  },
  {
    id: 'come_guida_schede',
    category: 'come_si_gioca',
    title: 'Guida alle Schede dell’Interfaccia',
    subtitle:
      'Cosa si fa in ciascuna voce del menu principale: Plancia, Campagna, Territorio, Crisi & Media, Partito, Parlamento/Governo, Sondaggi & Mappa',
    articleRef: 'Passo 3 · Interfaccia',
    keywords: [
      'schede',
      'menu',
      'interfaccia',
      'plancia',
      'campagna',
      'territorio',
      'crisi e media',
      'partito',
      'parlamento',
      'governo',
      'sondaggi',
      'mappa',
      'elezioni',
      'spoglio',
      'dove trovare',
    ],
    practicalBlocks: [
      {
        heading: 'Mappa rapida delle schede del menu',
        badge: 'Panoramica Menu',
        listType: 'unordered',
        items: [
          {
            label: 'Plancia (Plancia e Sondaggi):',
            text: 'è la tua sala operativa generale. Mostra il trend del consenso, i sondaggi nazionali, i seggi reali della legislatura in carica (che cambiano solo con le elezioni o scissioni parlamentari) e la Mappa d’Italia interattiva delle 20 Regioni.',
          },
          {
            label: 'Campagna (Azioni e Campagna):',
            text: 'è il luogo in cui investi budget reale in iniziative mediatiche, comizi, tour sulle 5 macro-aree (Nord-Ovest, Nord-Est, Centro, Sud, Isole), raccolta fondi e Duelli TV 1 vs 1 contro i leader rivali (1 iniziativa per canale a settimana).',
          },
          {
            label: 'Territorio (Territorio & Sezioni):',
            text: 'gestione capillare delle 20 Regioni italiane: apri, potenzia o chiudi sezioni, circoli locali e sedi regionali con costi ribilanciati e sostenibili, monitorando iscritti, consenso regionale, bonus raccolta firme e bilancio netto territoriale.',
          },
          {
            label: 'Crisi & Media (Dossier, Crisi e Media):',
            text: 'qui risolvi (o salti) i Dossier obbligatori settimanali valutando Pro e Contro (comprese le opzioni e gli eventi legati ai tuoi Tratti), leggi le reazioni di Stampa, Social e Rivali e segui i Referendum popolari.',
          },
          {
            label: 'Partito (Partito, Dirigenti e Coalizioni):',
            text: 'mostra i tuoi Tratti Attivi (Identità di Partito, Stile e Personalità del Leader con effetti reali), la squadra dirigenziale (Competenza, Lealtà, Ambizione, 1 colloquio/incarico a settimana per dirigente e gestione scandali), la Coesione interna, le Finanze (Tesseramento, 2×1000, raccolte fondi), la Raccolta Firme per le liste e le Trattative di Coalizione o Apparentamento.',
          },
          {
            label: 'Parlamento / Governo (Parlamento e Governo):',
            text: 'gestisci l’attività di Camera e Senato (sbloccata solo se hai conquistato seggi alle elezioni; i Referendum Art. 75 restano accessibili anche da extra-parlamentare con 0 seggi): DDL, Decreti-Legge, Questione di Fiducia, Legge di Bilancio, Commissioni d’Inchiesta, Ministri e Rimpasti, indicatori macroeconomici ed Elezione del Quirinale.',
          },
          {
            label: 'Sondaggi & Mappa / Elezioni e Spoglio:',
            text: 'i sondaggi dettagliati e la mappa regionale sono sempre consultabili nella Plancia; nella scheda Elezioni e Spoglio vedi le proiezioni pre-voto e vivi la maratona della Notte Elettorale (Exit Poll, Proiezioni, Risultati Definitivi e assegnazione effettiva dei Seggi) e le successive Consultazioni al Quirinale.',
          },
        ],
      },
    ],
  },
  {
    id: 'come_risorse_sopravvivenza',
    category: 'come_si_gioca',
    title: 'Gestione Risorse & Sopravvivenza Politica',
    subtitle:
      'Come non restare senza Cassa, prevenire le scissioni interne e leggere correttamente i Pro e Contro dei Dossier',
    articleRef: 'Passo 4 · Gestione & Sopravvivenza',
    keywords: [
      'risorse',
      'sopravvivenza',
      'cassa',
      'senza soldi',
      'bancarotta',
      'tesseramento',
      'donazioni',
      '2x1000',
      '2×1000',
      'costi sezioni',
      'scissione',
      'scissioni',
      'coesione',
      'pro e contro',
      'dossier',
      'salta',
      'trappole',
    ],
    practicalBlocks: [
      {
        heading: 'Come non restare senza Cassa',
        badge: 'Sostenibilità Finanziaria',
        listType: 'unordered',
        items: [
          {
            label: 'Controlla i costi fissi delle sezioni:',
            text: 'i costi di apertura e mantenimento dei circoli sono proporzionati alle dimensioni regionali e sostenuti dalle quote degli iscritti locali; espanditi comunque in modo ordinato e, se la Cassa scende in rosso, ridimensiona o chiudi temporaneamente le sedi meno produttive dalla scheda Territorio.',
          },
          {
            label: 'Attiva tutte le entrate legali del partito:',
            text: 'nella scheda Partito avvia la Campagna di Tesseramento Annuale (aumenta iscritti e gettito ricorrente), organizza Crowdfunding o Cene Sostenitori e incassa il 2×1000 IRPEF appena disponibile.',
          },
          {
            label: 'Sfrutta i contributi dei parlamentari:',
            text: 'una volta entrato in Parlamento tramite le elezioni, ogni deputato o senatore eletto porta +€450 a settimana in Cassa, creando una rendita strutturale proporzionata ai tuoi gruppi parlamentari.',
          },
        ],
      },
      {
        heading: 'Come evitare Scissioni Interne mantenendo alta la Coesione',
        badge: 'Unità del Partito',
        listType: 'unordered',
        items: [
          {
            label: 'Conosci la soglia di pericolo:',
            text: 'una scissione può scattare quando raggiungi almeno il 4,0% nazionale e la Coesione resta critica (< 40%, oppure < 52% con un dirigente ribelle) per 3 settimane consecutive.',
          },
          {
            label: 'Intervieni subito sui dirigenti scontenti:',
            text: 'quando compare l’avviso sulla scheda Partito, usa "Colloquio" (gratuito, 1/sett. per dirigente) o "Affida Dossier" (€6.000) sui dirigenti con Lealtà bassa per disinnescare la rivolta prima che nasca un partito scissionista (oppure sostituisci il dirigente per €12.000).',
          },
          {
            label: 'Evita forzature continue:',
            text: 'abusi ripetuti della Questione di Fiducia, scandali gestiti male o scelte incoerenti nei Dossier abbassano la lealtà della squadra dirigente.',
          },
        ],
      },
      {
        heading: 'Come interpretare i Pro e Contro dei Dossier senza farsi ingannare',
        badge: 'Lettura Dossier',
        listType: 'unordered',
        items: [
          {
            label: 'Valuta il contesto, non solo il consenso immediato:',
            text: 'i Dossier mostrano Pro e Contro strategici senza spoiler numerici. Una scelta che promette grande eco mediatica può però pesare su Spread, Rapporti UE, Cassa o soddisfazione degli alleati.',
          },
          {
            label: 'Proteggi il tuo punto debole del momento:',
            text: 'se sei a corto di Cassa evita opzioni costose; se sei al Governo con una maggioranza risicata evita strappi che irritano i partner di coalizione; se sei sotto il 3% privilegia visibilità e radicamento.',
          },
          {
            label: 'Usa "Salta / Nessuna dichiarazione" quando serve:',
            text: 'se tutte le opzioni comportano rischi inaccettabili per la tua situazione attuale, passare la mano limita i danni collaterali e sblocca comunque l’avanzamento della settimana.',
          },
        ],
      },
    ],
  },
  {
    id: 'come_percorso_palazzo_chigi',
    category: 'come_si_gioca',
    title: 'Obiettivi e Percorso verso Palazzo Chigi',
    subtitle:
      'Dalle soglie elettorali alle trattative di coalizione, fino alle consultazioni al Quirinale e alla fiducia delle Camere',
    articleRef: 'Passo 5 · Road to Palazzo Chigi',
    keywords: [
      'obiettivi',
      'percorso',
      'palazzo chigi',
      'vincere',
      'soglie elettorali',
      '3%',
      '4%',
      '10%',
      'coalizioni',
      'trattare',
      'consultazioni',
      'quirinale',
      'fiducia',
      'camere',
      'maggioranza',
      '201',
      '101',
      'cencelli',
      'premier',
    ],
    practicalBlocks: [
      {
        heading: 'I 5 traguardi per conquistare e guidare il Governo',
        badge: 'Roadmap Completa',
        listType: 'ordered',
        items: [
          {
            label: 'Accedi alla scheda e supera le soglie elettorali:',
            text: 'completa la raccolta firme (o stipula un apparentamento con una forza parlamentare) prima della chiusura liste. Alle Elezioni Politiche punta a superare il 3% nazionale (soglia di lista del Rosatellum) per entrare in Parlamento, e tieni d’occhio il 4% per le Europee.',
          },
          {
            label: 'Tratta e consolida la tua coalizione:',
            text: 'col sistema misto Rosatellum, il 37% dei seggi si assegna nei collegi uninominali dove vince la coalizione più forte. Nella scheda Partito negozia alleanze con forze compatibili per superare agevolmente il 10% di coalizione e sommare i voti nei collegi.',
          },
          {
            label: 'Conquista la maggioranza nella Notte Elettorale:',
            text: 'nelle ultime settimane prima del voto concentra budget, campagne mirate e Duelli TV sulle macro-aree decisive per superare quota 201 Deputati alla Camera e 101 Senatori al Senato insieme ai tuoi alleati. Ricorda la regola ferrea: i seggi cambiano solo alle elezioni (o per scissione parlamentare reale), mai semplicemente superando il 3% nei sondaggi settimanali.',
          },
          {
            label: 'Affronta le Consultazioni al Quirinale:',
            text: 'dopo la vittoria elettorale, nella schermata delle Consultazioni ripartisci gli 8 Ministeri Chiave tra il tuo partito e gli alleati rispettando gli equilibri del Manuale Cencelli (per mantenere alta la soddisfazione della coalizione) e assegna i tuoi dirigenti ai dicasteri affini alla loro specializzazione.',
          },
          {
            label: 'Ottieni la Fiducia delle Camere e governa la Legislatura:',
            text: 'formato il Consiglio dei Ministri e ottenuta la fiducia di Camera e Senato, guidi Palazzo Chigi: approva la Manovra di Bilancio, porta in Aula riforme economiche o istituzionali, gestisci le crisi internazionali ed esercita il tuo peso fino all’Elezione del Presidente della Repubblica e al voto successivo.',
          },
        ],
        tip: 'Anche se non raggiungi subito la maggioranza al primo turno elettorale, entrare in Parlamento da forza di Opposizione ti sblocca quote parlamentari in Cassa, esenzione dalle firme e tutti gli strumenti d’Aula per preparare la vittoria nella legislatura successiva.',
      },
    ],
  },

  // =========================================================================
  // 1. PRIMI PASSI & STATUS DEL PARTITO
  // =========================================================================
  {
    id: 'comitato_promotore',
    category: 'primi_passi',
    title: 'Comitato Promotore (0%) vs Nuovo Partito già costituito (1%)',
    subtitle: 'Due percorsi di avvio per fondare una forza politica da zero',
    articleRef: 'Art. 49 Cost.',
    keywords: [
      'comitato',
      'promotore',
      'nuovo partito',
      '0%',
      '1%',
      'fondazione',
      'inizio',
      'wizard',
      'statuto',
    ],
    realWorldRule:
      'In Italia fondare un nuovo partito politico richiede la costituzione di un comitato promotore, la redazione di uno statuto democratico con atto notarile, la registrazione del simbolo e la creazione di una rete territoriale minima prima di poter accedere alle schede elettorali e al riparto del 2×1000.',
    simulatorRule:
      'Nel Wizard iniziale puoi scegliere "Comitato Promotore" (parti dallo 0,0% nei sondaggi con €18.000 in cassa e devi completare la fase costituente raccogliendo 30.000 firme e aprendo comitati territoriali entro 4 settimane) oppure "Nuovo Partito già costituito" (parti attorno all’1,0% con €48.000 e struttura già registrata). In entrambi i casi avvii la partita fuori dal Parlamento con 0 seggi e resti extra-parlamentare fino alle elezioni.',
  },
  {
    id: 'status_extraparlamentare',
    category: 'primi_passi',
    title: 'Partito Extra-Parlamentare (0 Seggi) & Regola Ferrea dei Seggi',
    subtitle: 'I seggi e il Governo cambiano esclusivamente dopo un’elezione politica (o scissione reale)',
    articleRef: 'Camera & Senato',
    keywords: [
      'extraparlamentare',
      'extra-parlamentare',
      '0 seggi',
      'seggi reali',
      'regola ferrea',
      'blocchi',
      'bloccato',
      'soglia',
      '3%',
      'opposizione',
      'governo',
    ],
    realWorldRule:
      'In una Repubblica parlamentare i sondaggi d’opinione non assegnano alcun seggio: la composizione di Camera e Senato resta invariata per l’intera legislatura (salvo passaggi di gruppo o scissioni parlamentari) e cambia solo quando i cittadini votano alle Elezioni Politiche. Solo i partiti con eletti possono formare il Governo o votare leggi.',
    simulatorRule:
      'All’avvio siedono al Governo solo i partiti della reale maggioranza (FdI, Lega, FI, Noi Moderati) e all’Opposizione parlamentare le forze realmente elette (PD, M5S, AVS, Azione, IV, +Europa, Sud chiama Nord, SVP). Tutti i partiti extra-parlamentari e i nuovi partiti partono con 0 seggi: superare il 3% nei sondaggi settimanali NON assegna mai seggi e NON fa entrare al Governo. Per sbloccare l’Aula devi conquistare seggi alle Elezioni Politiche (nel frattempo puoi usare Referendum Art. 75, Territorio, Campagna e Raccolta Firme).',
  },
  {
    id: 'raccolta_firme_apparentamenti',
    category: 'primi_passi',
    title: 'Raccolta Firme (60.000 Politiche / 150.000 Europee) & Apparentamenti',
    subtitle: 'Obbligo di sottoscrizioni autenticate ed esenzioni parlamentari',
    articleRef: 'Deposito Liste',
    keywords: [
      'raccolta firme',
      'firme',
      'liste',
      '60000',
      '60.000',
      '150000',
      '150.000',
      'politiche',
      'europee',
      'regionali',
      'banchetti',
      'apparentamento',
      'apparentamenti',
      'esenzione',
      'escluso',
    ],
    realWorldRule:
      'Le forze politiche senza un gruppo parlamentare costituito devono raccogliere firme autenticate in ogni circoscrizione per presentare le proprie liste: circa 60.000 firme per le Elezioni Politiche, 150.000 firme per le Elezioni Europee e quote proporzionate alla popolazione per le Elezioni Regionali. L’obbligo decade solo in caso di esenzione parlamentare o apparentamento tecnico/politico con un soggetto già esente.',
    simulatorRule:
      'Nella scheda Partito monitori la barra di avanzamento delle firme e selezioni l’obiettivo (Politiche 60.000, Europee 150.000 o Regionali). Puoi organizzare fino a 2 banchetti a settimana (€2.500 ciascuno), molto più redditizi nelle regioni dove possiedi sedi attive. Se arrivi alla chiusura delle liste sotto il 100% vieni escluso dalla scheda elettorale, a meno che tu non stipuli un’alleanza/apparentamento con un partito già presente in Parlamento.',
  },

  // =========================================================================
  // 2. TERRITORIO & RADICAMENTO
  // =========================================================================
  {
    id: 'sezioni_circoli_apertura',
    category: 'territorio',
    title: 'Apertura e Potenziamento di Sezioni, Circoli Locali e Sedi Regionali',
    subtitle: 'Costruire una presenza fisica sulle 20 Regioni italiane',
    articleRef: 'Mappa 20 Regioni',
    keywords: [
      'territorio',
      'radicamento',
      'sezioni',
      'circoli',
      'sedi',
      'regionali',
      'mappa',
      'potenziamento',
      'apertura',
      'capoluogo',
    ],
    realWorldRule:
      'I partiti strutturati si radicano sul territorio attraverso circoli cittadini, sezioni di quartiere e federazioni regionali nei capoluoghi. Una rete territoriale capillare consente di presidiare i collegi uninominali, organizzare eventi locali, formare amministratori e mantenere un contatto costante con gli elettori.',
    simulatorRule:
      'Dalla scheda dedicata Territorio (o cliccando una regione sulla mappa ISTAT della Plancia) puoi aprire e potenziare fino a 3 livelli di struttura in ciascuna delle 20 regioni: Liv. 1 Circolo Cittadino, Liv. 2 Sezione Provinciale e Liv. 3 Federazione Regionale. Ogni apertura o potenziamento fornisce subito un impulso locale, nuovi iscritti immediati, crescita settimanale dei tesserati e un bonus diretto alla raccolta firme per liste elettorali e referendum.',
  },
  {
    id: 'costi_mantenimento_territorio',
    category: 'territorio',
    title: 'Costi di Mantenimento della Rete Territoriale & Bilancio',
    subtitle: 'Equilibrio tra espansione sul territorio e sostenibilità finanziaria',
    articleRef: 'Spese Fisse',
    keywords: [
      'costi',
      'mantenimento',
      'spese fisse',
      'affitto',
      'sedi',
      'chiudere',
      'ridimensiona',
      'bilancio',
      'overhead',
      'territorio',
    ],
    realWorldRule:
      'Tenere aperte sedi fisiche e circoli comporta costi fissi ricorrenti per affitti, utenze, segreteria, materiale organizzativo e iniziative locali. Un’espansione troppo rapida senza adeguate entrate da tesseramento o contributi espone il partito al dissesto finanziario.',
    simulatorRule:
      'Ogni livello territoriale (Liv. 1 Circolo, Liv. 2 Sezione, Liv. 3 Federazione) ha costi di apertura e mantenimento proporzionati alla regione e resi sostenibili anche per i partiti piccoli grazie alle quote ricorrenti dei tesserati locali. Tratti come "Territorialista", "Socialista" o "Radicamento Territoriale" scontano ulteriormente apertura e gestione. Se la cassa scende in zona critica puoi ridimensionare di un livello o chiudere una sede dalla scheda Territorio per tagliare subito i costi fissi.',
  },
  {
    id: 'iscritti_firme_consenso_regionale',
    category: 'territorio',
    title: 'Crescita Iscritti, Bonus Raccolta Firme & Consensi Regionali',
    subtitle: 'Come i circoli moltiplicano tesserati, banchetti e seggi locali',
    articleRef: 'Effetto Moltiplicatore',
    keywords: [
      'iscritti',
      'tesserati',
      'volontari',
      'bonus',
      'firme',
      'banchetti',
      'consenso regionale',
      'regioni',
      'crescita',
    ],
    realWorldRule:
      'Dove un partito dispone di sezioni e militanti attivi, il tesseramento cresce organicamente, i banchetti raccolgono molte più firme autenticate in minor tempo e il consenso locale resiste meglio alle oscillazioni nazionali.',
    simulatorRule:
      'Ogni sede/circolo attivo genera crescita settimanale organica del consenso nella propria regione, incrementa il numero di iscritti e il gettito settimanale del tesseramento, e applica un bonus diretto all’efficacia dei banchetti di raccolta firme (sia per le liste elettorali sia per i Referendum). Un forte radicamento regionale aumenta inoltre la tua quota nei collegi uninominali e tra i 58 Delegati Regionali per il Quirinale.',
  },

  // =========================================================================
  // 3. SISTEMA ELETTORALE & VOTO
  // =========================================================================
  {
    id: 'rosatellum',
    category: 'elezioni',
    title: 'Rosatellum (Uninominale + Proporzionale, Soglie 3% Lista e 10% Coalizione)',
    subtitle: 'Il sistema elettorale misto vigente per Camera e Senato',
    articleRef: 'Legge 165/2017',
    keywords: [
      'rosatellum',
      'uninominale',
      'proporzionale',
      'sbarramento',
      'soglie',
      '3%',
      '10%',
      'coalizione',
      'lista',
      'riforma elettorale',
    ],
    realWorldRule:
      'Il Rosatellum è un sistema elettorale misto che assegna circa il 37% dei seggi con metodo maggioritario in collegi uninominali (vince chi prende anche un solo voto in più, favorendo le coalizioni) e il restante 63% con metodo proporzionale in collegi plurinominali. Le soglie di sbarramento nazionali sono del 3% per la singola lista e del 10% per la coalizione (con almeno una lista al 3%; le liste tra 1% e 3% in coalizione trasferiscono i voti agli alleati).',
    simulatorRule:
      'La simulazione calcola in tempo reale i seggi di Camera e Senato applicando il Rosatellum su base regionale e nazionale, premiando le alleanze nei collegi uninominali. Una volta al Governo puoi votare in Parlamento una riforma della legge elettorale per passare a Proporzionale Puro, Maggioritario o Premio di Maggioranza, modificando strutturalmente i futuri equilibri d’Aula.',
  },
  {
    id: 'elezioni_politiche',
    category: 'elezioni',
    title: 'Elezioni Politiche & Maratona Notte Elettorale',
    subtitle: '400 Deputati (maggioranza 201), 200 Senatori (maggioranza 101) e spoglio in 3 fasi',
    articleRef: 'Camera & Senato',
    keywords: [
      'politiche',
      'notte elettorale',
      'exit poll',
      'proiezioni',
      'spoglio',
      '400',
      '200',
      '201',
      '101',
      'seggi',
      'maggioranza',
    ],
    realWorldRule:
      'Le Elezioni Politiche rinnovano i 400 seggi della Camera dei Deputati (maggioranza assoluta a 201) e i 200 seggi elettivi del Senato della Repubblica (maggioranza a 101). Alla chiusura delle urne alle ore 23:00 si susseguono gli exit poll, le prime proiezioni su sezioni reali e lo scrutinio definitivo.',
    simulatorRule:
      'Alla settimana del voto (o in seguito a caduta del Governo / scioglimento anticipato delle Camere) si apre la Notte Elettorale in 3 fasi: Fase 1 (Ore 23:00 · Chiusura Urne, affluenza nazionale e forchette Exit Poll con margine d’errore), Fase 2 (Scrutinio progressivo delle 61.417 sezioni del Viminale dal 25% al 100% con controlli pausa/velocità, Radar Soglia 3% e Testa a Testa principali), Fase 3 (Risultati definitivi, assegnazione seggi a Camera e Senato, confronto con i sondaggi pre-voto e Prima Pagina della stampa). Se la tua coalizione conquista la maggioranza accedi alle Consultazioni al Quirinale; se resti sotto la soglia o sei escluso per firme insufficienti finisci in Opposizione Extra-Parlamentare.',
  },
  {
    id: 'elezioni_europee',
    category: 'elezioni',
    title: 'Elezioni Europee: 5 Circoscrizioni, 76 Seggi, Soglia 4%, 150.000 Firme & Cartelli',
    subtitle: 'Proporzionale puro su scala continentale, sbarramento nazionale e alleanze di scopo',
    articleRef: '76 Eurodeputati · 4%',
    keywords: [
      'europee',
      'elezioni europee',
      '5 circoscrizioni',
      'circoscrizioni',
      'proporzionale puro',
      '4%',
      'soglia 4%',
      '76 seggi',
      '76',
      '150000',
      '150.000',
      'firme europee',
      'cartelli',
      'cartello elettorale',
      'liste di scopo',
      'nord-ovest',
      'nord-est',
      'centro',
      'sud',
      'isole',
      'mid-term',
    ],
    realWorldRule:
      'Ogni 5 anni l’Italia elegge 76 membri del Parlamento Europeo con sistema proporzionale puro (senza premi di maggioranza né collegi uninominali) e una soglia di sbarramento nazionale del 4%. Il Paese è diviso in 5 circoscrizioni ufficiali: Nord-Ovest (20 seggi), Nord-Est (15), Centro (15), Sud (18) e Isole (8). Le liste prive di gruppi parlamentari nazionali o europei devono raccogliere 150.000 firme distribuite nelle 5 circoscrizioni; i piccoli partiti spesso formano liste di scopo/cartelli comuni per superare il 4%.',
    simulatorRule:
      'Nella scheda Elezioni → sub-scheda "Elezioni Europee" trovi il countdown dedicato (prima scadenza Giugno 2029, poi ogni 5 anni). I partiti già presenti in Parlamento o con almeno 1 eurodeputato sono esenti dalle firme; gli extra-parlamentari devono raccogliere 150.000 firme a partire da 16 settimane prima del voto tramite sezioni e campagne locali a budget reale, oppure negoziare un Cartello Elettorale Europeo con 1–2 partiti affini per sommare i voti contro la soglia del 4%. Alla chiusura delle urne si apre una Notte Elettorale Europea dedicata in 3 fasi che assegna i 76 seggi e agisce come test politico di medio termine (mid-term) sul Governo italiano, senza mai alterare i seggi nazionali di Camera e Senato.',
  },
  {
    id: 'europee_preferenze_capilista',
    category: 'elezioni',
    title: 'Europee: Preferenze (Alternanza di Genere), Capilista, Dilemma Leader & Fuorisede',
    subtitle: 'Come funzionano le candidature nelle 5 circoscrizioni nella realtà e nel simulatore',
    articleRef: 'Legge Elettorale UE',
    keywords: [
      'preferenze',
      '3 preferenze',
      'alternanza di genere',
      'capilista',
      'capolista',
      'candidatura leader',
      'dilemma leader',
      'fuorisede',
      'studenti fuorisede',
      'italiani all estero',
      'campagna europea',
      'bruxelles',
    ],
    realWorldRule:
      'Sulla scheda delle Europee italiane l’elettore può esprimere fino a 3 preferenze per candidati della stessa lista, rispettando obbligatoriamente l’alternanza di genere (pena l’annullamento della seconda o terza preferenza). È prassi diffusa che i leader nazionali si candidino come capilista in una o in tutte le 5 circoscrizioni per trainare la lista, dovendo poi scegliere dopo il voto se accettare il seggio a Strasburgo (incompatibile con il ruolo di Ministro o parlamentare nazionale) o rinunciare a favore del primo dei non eletti. Partecipano inoltre gli italiani residenti in UE e, con modalità sperimentali, gli studenti fuorisede.',
    simulatorRule:
      'Nel simulatore la scelta delle preferenze e dei nomi forti è resa in modo strategico tramite la selezione del profilo del Capolista per ciascuna delle 5 circoscrizioni (Esperto UE, Volto TV/Media, Radicato Locale), le campagne tematiche europee, l’evento dedicato a studenti fuorisede e italiani all’estero e il "Dilemma della Candidatura del Leader" (nessuna candidatura, 1 circoscrizione o tutte e 5): se ti candidi ed entri all’Europarlamento, a fine spoglio scegli se partire per Bruxelles o restare in Italia gestendo l’impatto su credibilità e consenso.',
  },
  {
    id: 'europee_gruppi_commissione',
    category: 'elezioni',
    title: 'Strasburgo & Bruxelles: Gruppi Parlamentari UE, Commissione, Commissario & Direttive',
    subtitle: 'Il peso politico ed economico del partito nell’Unione Europea durante il quinquennio',
    articleRef: 'Parlamento & Commissione UE',
    keywords: [
      'gruppi europei',
      'gruppi parlamentari europei',
      'ppe',
      's&d',
      'sd',
      'pfe',
      'patrioti',
      'ecr',
      'renew',
      'verdi',
      'the left',
      'esn',
      'non iscritti',
      'commissione europea',
      'fiducia commissione',
      'commissario italiano',
      'audizione',
      'direttive',
      'case green',
      'patto di stabilita',
      'spread',
    ],
    realWorldRule:
      'Al Parlamento Europeo gli eletti non siedono per nazionalità ma in Gruppi Politici transnazionali: PPE (Popolari), S&D (Socialisti e Democratici), PfE (Patrioti per l’Europa), ECR (Conservatori e Riformisti), Renew Europe (Liberali), Verdi/ALE, The Left (Sinistra), ESN (Europa delle Nazioni Sovrane) e Non Iscritti. Il Parlamento vota la fiducia al Presidente della Commissione Europea ed esamina in audizione i Commissari designati da ciascun Governo nazionale, potendo bocciarli prima del via libera finale. Le Direttive approvate a Bruxelles incidono poi direttamente su economia, ambiente, agricoltura, difesa e conti pubblici nazionali.',
    simulatorRule:
      'Se conquisti almeno 1 eurodeputato, al termine della Notte Elettorale Europea scegli il tuo Gruppo UE (con compatibilità ideologica e peso a Bruxelles) e voti la fiducia al Presidente della Commissione (Favorevole, Contrario o Astenuto). Se sei nella maggioranza di Governo in Italia, nomini anche il Commissario Europeo italiano (Tecnico/Diplomatico, Fedelissimo politico o Compromesso di coalizione) affrontando l’audizione a Strasburgo con rischio bocciatura. Nel quinquennio gli eurodeputati portano +€320/sett. per seggio e visibilità mediatica, voti periodicamente i Dossier/Direttive da Bruxelles (in Crisi & Media o in Elezioni → Presenza UE) e un buon posizionamento a Bruxelles con un Commissario di peso riduce lo Spread e alleggerisce il vincolo sulla Legge di Bilancio.',
  },
  {
    id: 'elezioni_regionali',
    category: 'elezioni',
    title: 'Elezioni Regionali & Impatto sui 58 Delegati del Quirinale',
    subtitle: 'Governance locale, radicamento e peso nelle istituzioni nazionali',
    articleRef: '20 Regioni · 58 Delegati',
    keywords: [
      'regionali',
      'elezioni regionali',
      'governatori',
      'presidenti di regione',
      'consiglio regionale',
      'delegati regionali',
      '58 delegati',
      'territorio',
    ],
    realWorldRule:
      'Le Elezioni Regionali eleggono direttamente il Presidente della Giunta Regionale e il Consiglio Regionale, generalmente con premio di maggioranza alla coalizione vincente. I Consigli Regionali designano inoltre i 58 Delegati Regionali (3 per ciascuna regione, 1 per la Valle d’Aosta) che votano in Seduta Comune per il Presidente della Repubblica.',
    simulatorRule:
      'Il simulatore traccia i consensi distinti per ognuna delle 20 Regioni italiane e consente di impostare campagne firme mirate alle Regionali (con soglia proporzionata alla regione scelta). Dominare le regioni chiave ti avvantaggia sia nei collegi uninominali delle Politiche sia nella ripartizione dei 58 Delegati Regionali durante l’Elezione del Capo dello Stato.',
  },

  // =========================================================================
  // 4. PARLAMENTO, GOVERNO & QUIRINALE
  // =========================================================================
  {
    id: 'ddl_vs_dl',
    category: 'parlamento_quirinale',
    title: 'Iter DDL Ordinario vs Decreto-Legge (Art. 77 Cost. · 60 giorni)',
    subtitle: 'Legislazione ordinaria contro urgenza esecutiva e rischio decadenza',
    articleRef: 'Artt. 70–77 Cost.',
    keywords: [
      'ddl',
      'disegno di legge',
      'decreto legge',
      'decreto-legge',
      'dl',
      '60 giorni',
      'conversione',
      'decadenza',
      'art 77',
      'iter legislativo',
    ],
    realWorldRule:
      'Il Disegno di Legge (DDL) ordinario diventa legge solo dopo l’esame in Commissione e l’approvazione nello stesso testo da parte di Camera e Senato, con tempi più distesi e confronto sugli emendamenti. Il Decreto-Legge (Art. 77 Cost.) è invece adottato dal Governo in casi straordinari di necessità e urgenza: entra in vigore immediatamente ma perde efficacia sin dall’inizio (decadenza retroattiva) se il Parlamento non lo converte in legge entro 60 giorni.',
    simulatorRule:
      'Quando sei al Governo, su ogni norma economica o elettorale puoi scegliere tra DDL Ordinario (iter stabile di 3 settimane: Commissione → Camera → Senato, zero logoramento della coalizione ma esposto a emendamenti ostili dell’opposizione) e Decreto-Legge: il DL entra subito in vigore con effetti immediati parziali e apre un countdown di 8 settimane (~60 giorni) per la conversione in Aula. Se il timer scade senza conversione, il decreto decade automaticamente revocando la misura e penalizzando credibilità e consenso.',
  },
  {
    id: 'questione_fiducia',
    category: 'parlamento_quirinale',
    title: 'Questione di Fiducia',
    subtitle: 'Blindare un provvedimento compattando la maggioranza, mettendo in gioco la vita del Governo',
    articleRef: 'Art. 94 Cost.',
    keywords: [
      'fiducia',
      'questione di fiducia',
      'sfiducia',
      'maggioranza',
      'caduta governo',
      'emendamenti',
      'emendamenti ostili',
      'ostruzionismo',
      'voto',
    ],
    realWorldRule:
      'Ponendo la Questione di Fiducia su un DDL o sulla conversione di un Decreto-Legge, l’Esecutivo fa decadere gli emendamenti ostruzionistici, accelera l’iter e richiama all’ordine i parlamentari della propria maggioranza. Tuttavia, se anche una sola Camera vota contro, il Governo è giuridicamente obbligato alle dimissioni.',
    simulatorRule:
      'In Parlamento puoi porre la Questione di Fiducia sui DDL bloccati in iter (azzerando gli emendamenti ostili) oppure sulla conversione dei Decreti-Legge in scadenza: ottieni un consistente bonus di voti favorevoli in Camera e Senato, al prezzo di logorare la soddisfazione degli alleati (-7/-8%), la coesione interna (-3), la tenuta democratica e i rapporti con le opposizioni (-6). Se nonostante la fiducia il voto fallisce, il Governo cade istantaneamente e si aprono elezioni anticipate.',
  },
  {
    id: 'commissioni_inchiesta',
    category: 'parlamento_quirinale',
    title: 'Commissioni Parlamentari d’Inchiesta',
    subtitle: 'Poteri istruttori, audizioni pubbliche, iniziativa d’opposizione e pressione mediatica',
    articleRef: 'Art. 82 Cost.',
    keywords: [
      'commissioni',
      'commissione',
      'inchiesta',
      'bicamerale',
      'art 82',
      'relazione',
      'rapporto finale',
      'audizioni',
      'opposizione',
      'pressione mediatica',
      'parlamento',
    ],
    realWorldRule:
      'Ai sensi dell’Articolo 82 della Costituzione, ciascuna Camera (o entrambe con legge bicamerale) può disporre inchieste su materie di pubblico interesse con gli stessi poteri e limiti dell’autorità giudiziaria, concludendo i lavori con un rapporto parlamentare ad alto impatto politico e mediatico.',
    simulatorRule:
      'Nella sotto-scheda "Commissioni d’Inchiesta" del Parlamento puoi istituire fino a 2 commissioni contemporanee (€12.000, 1 avvio/sett.) su temi sensibili (Sanità, PNRR, Sicurezza, Conflitto d’Interessi, Banche, Scandali & Appalti). Inoltre, quando sei al Governo, anche le Opposizioni possono promuovere Commissioni d’Inchiesta contro l’Esecutivo su scandali o criticità: dopo 4–5 settimane il rapporto finale sposta consenso e pressione mediatica.',
  },
  {
    id: 'manovra_finanziaria',
    category: 'parlamento_quirinale',
    title: 'Legge di Bilancio Annuale (Manovra Finanziaria)',
    subtitle: 'Allocazione dei miliardi tra Fisco, Sanità, Giovani, Infrastrutture e Coperture',
    articleRef: 'Art. 81 Cost.',
    keywords: [
      'manovra',
      'manovra finanziaria',
      'legge di bilancio',
      'bilancio',
      'deficit',
      'coperture',
      'fisco',
      'sanita',
      'giovani',
      'infrastrutture',
      'esercizio provvisorio',
    ],
    realWorldRule:
      'Ogni autunno il Governo presenta e il Parlamento approva entro il 31 dicembre la Legge di Bilancio annuale, stabilendo entrate, spese pubbliche e saldo di Deficit/PIL nel rispetto delle regole europee; in caso di mancata approvazione scatta l’esercizio provvisorio e cresce la tensione sui mercati.',
    simulatorRule:
      'Periodicamente scatta la Sessione di Bilancio bloccante quando sei al Governo: devi distribuire le risorse tra 4 capitoli (Fisco & Tasse, Sanità & Welfare, Giovani & Lavoro, Infrastrutture & Sud) e decidere le Coperture. Un deficit elevato fa impennare lo Spread BTP–Bund e deteriora i Rapporti UE; coperture e tagli troppo severi colpiscono Stabilità Sociale e consenso delle fasce coinvolte.',
  },
  {
    id: 'consultazioni_quirinale',
    category: 'parlamento_quirinale',
    title: 'Consultazioni al Quirinale, Manuale Cencelli & Rimpasto di Governo',
    subtitle: 'Formazione del Consiglio dei Ministri ed equilibri di coalizione',
    articleRef: 'Artt. 92–94 Cost.',
    keywords: [
      'consultazioni',
      'quirinale',
      'cencelli',
      'manuale cencelli',
      'ministri',
      'ministeri',
      'rimpasto',
      'premier',
      'coalizione',
      'governo',
    ],
    realWorldRule:
      'Dopo le elezioni o una crisi di governo, il Presidente della Repubblica svolge le consultazioni con i gruppi parlamentari e conferisce l’incarico di formare il Governo. I ministeri vengono storicamente ripartiti tra i partiti della maggioranza in proporzione al peso parlamentare (il cosiddetto "Manuale Cencelli"), con possibili rimpasti durante la legislatura.',
    simulatorRule:
      'Quando vinci le elezioni accedi alle Consultazioni al Quirinale per ripartire gli 8 Ministeri Chiave tra il tuo partito e gli alleati, assegnando i tuoi dirigenti ai dicasteri che trattieni. Durante la legislatura monitora la soddisfazione degli alleati: se scende sotto il 35% rischi la rottura della maggioranza; usa il Rimpasto (1 a settimana) nella scheda Parlamento per riassegnare un ministero o sostituire un ministro in difficoltà.',
  },
  {
    id: 'elezione_pdr',
    category: 'parlamento_quirinale',
    title: 'Elezione del Presidente della Repubblica (Ciclo Settennale)',
    subtitle: '658 Grandi Elettori · 2/3 nei primi 3 scrutini (439) · 50%+1 dal 4° (330)',
    articleRef: 'Artt. 83–85 Cost.',
    keywords: [
      'presidente della repubblica',
      'quirinale',
      'settennato',
      'ciclo settennale',
      '658',
      'grandi elettori',
      '2/3',
      '439',
      '50%+1',
      '330',
      'scrutinio',
      'scrutini',
      'seduta comune',
    ],
    realWorldRule:
      'Il Presidente della Repubblica resta in carica 7 anni ed è eletto dal Parlamento in Seduta Comune integrato da 58 delegati regionali (400 deputati + 200 senatori + 58 delegati = 658 Grandi Elettori). Nei primi 3 scrutini occorre la maggioranza qualificata dei 2/3 dell’assemblea (439 voti); dal 4° scrutinio è sufficiente la maggioranza assoluta del 50%+1 (330 voti).',
    simulatorRule:
      'Al termine del ciclo settennale (visibile nel contatore in Parlamento) si convoca la Seduta Comune: puoi sostenere candidati reali/istituzionali o proporne uno tuo, negoziare accordi trasversali con altri gruppi (€10.000) oppure andare "alla conta" e votare scrutinio dopo scrutinio. Un accordo trasversale rafforza tenuta democratica e rapporti parlamentari; vincere alla conta compatta gli alleati ma irrigidisce le opposizioni, mentre una sconfitta logora fortemente la maggioranza.',
  },
  {
    id: 'bicameralismo_navetta',
    category: 'parlamento_quirinale',
    title: 'Bicameralismo Paritario, Iter Visivo & Navetta Parlamentare',
    subtitle: 'Commissione → Voto Camera → Voto Senato → Promulgazione Quirinale',
    articleRef: 'Artt. 70–74 Cost.',
    keywords: [
      'bicameralismo',
      'bicameralismo paritario',
      'navetta',
      'navetta parlamentare',
      'iter',
      'iter legislativo',
      'commissione',
      'voto camera',
      'voto senato',
      'promulgazione',
      'gruppi parlamentari',
      'favorevoli',
      'contrari',
      'astenuti',
      'indecisi',
    ],
    realWorldRule:
      'Nel bicameralismo perfetto italiano ogni legge deve essere approvata nello stesso identico testo sia dalla Camera dei Deputati sia dal Senato della Repubblica. Se la seconda Camera approva anche un solo emendamento, il provvedimento torna indietro alla prima Camera (la cosiddetta "navetta parlamentare"), allungando i tempi fino alla promulgazione del Capo dello Stato (che può comunque rinviare il testo alle Camere ai sensi dell’art. 74 Cost.).',
    simulatorRule:
      'Ogni DDL, Decreto-Legge e Legge di Bilancio mostra una barra visiva a 4 tappe (Commissione → Voto Camera → Voto Senato → Promulgazione Quirinale) insieme allo schieramento dei Gruppi Parlamentari (Favorevoli, Indecisi, Astenuti, Contrari). Se al Senato passa un emendamento o il Quirinale rileva criticità, scatta la Navetta Parlamentare: il testo rientra alla Camera, l’iter si allunga e sale la Tensione d’Aula.',
  },
  {
    id: 'emendamenti_ostruzionismo',
    category: 'parlamento_quirinale',
    title: 'Emendamenti, Ostruzionismo & Osservatore Esterno (0 Seggi)',
    subtitle: 'Come incidere sui testi in Aula o mobilitare la piazza da fuori Parlamento',
    articleRef: 'Regolamenti Camera e Senato',
    keywords: [
      'emendamento',
      'emendamenti',
      'emendamento costruttivo',
      'ostruzionismo',
      'ostruzionismo parlamentare',
      'filibustering',
      'osservatore esterno',
      '0 seggi',
      'extra parlamentare',
      'mobilitazione',
      'piazza',
      'presidio',
    ],
    realWorldRule:
      'Durante l’esame di un disegno di legge o di un decreto, i gruppi parlamentari possono presentare emendamenti costruttivi per migliorare o modificare il testo oppure ricorrere all’ostruzionismo (migliaia di emendamenti, interventi fiume e verifiche del numero legale) per rallentare la maggioranza e accendere i riflettori mediatici. I movimenti senza seggi non hanno voce in Aula, ma possono organizzare presidi e manifestazioni di piazza.',
    simulatorRule:
      'Se hai seggi in Parlamento puoi agire direttamente sui provvedimenti in discussione (1 intervento per testo): l’Emendamento Costruttivo migliora il profilo istituzionale e può modificare il testo (anche innescando la Navetta), mentre l’Ostruzionismo rallenta l’iter (+1 settimana), carica la base elettorale ma alza la Tensione d’Aula. Se sei Extra-Parlamentare (0 seggi), l’accesso ai voti e agli atti d’Aula resta bloccato, ma nella modalità Osservatore Esterno puoi comunque seguire le leggi in discussione e lanciare una Presa di Posizione / Mobilitazione di Piazza (a favore o contro, 1 a settimana).',
  },
  {
    id: 'question_time_mozioni',
    category: 'parlamento_quirinale',
    title: 'Question Time, Interrogazioni, Mozioni & Ordini del Giorno (OdG)',
    subtitle: 'L’azione politica settimanale in Aula per Governo e Opposizione',
    articleRef: 'Sindacato Ispettivo · Reg. Camere',
    keywords: [
      'question time',
      'interrogazioni',
      'interrogazione parlamentare',
      'mozioni',
      'mozione',
      'ordini del giorno',
      'odg',
      'ministro',
      'diretta tv',
      'rai parlamento',
      'opposizione',
    ],
    realWorldRule:
      'Il Question Time è il botta e risposta in diretta TV tra parlamentari e Ministri su temi caldi dell’attualità. Le Mozioni e gli Ordini del Giorno (OdG) sono atti di indirizzo che impegnano il Governo o costringono tutti i gruppi parlamentari a prendere pubblicamente posizione su questioni politicamente divisive.',
    simulatorRule:
      'Nella sotto-scheda "Question Time & Mozioni" puoi svolgere due azioni periodiche (una ogni 2 settimane ciascuna): con il Question Time incalzi un Ministro su un dossier sensibile (se sei all’Opposizione) oppure rivendichi i risultati di un dicastero dell’Esecutivo (se sei al Governo) guadagnando visibilità mediatica e gradimento; con Mozioni e OdG porti in Aula un tema divisivo per mettere pressione alla maggioranza o costringere i rivali a scoprirsi davanti agli elettori.',
  },
  {
    id: 'voto_segreto_franchi_tiratori',
    category: 'parlamento_quirinale',
    title: 'Tensione d’Aula, Voto Segreto & Franchi Tiratori',
    subtitle: 'Defezioni anonime sui testi sensibili e Vertice di Maggioranza',
    articleRef: 'Art. 49 Reg. Camera · Art. 113 Reg. Senato',
    keywords: [
      'franchi tiratori',
      'voto segreto',
      'tensione d aula',
      'tensione',
      'sotto in aula',
      'defezioni',
      'vertice di maggioranza',
      'ricompattare',
      'coalizione',
      'questione di fiducia',
    ],
    realWorldRule:
      'In Parlamento alcuni voti su diritti, ordinamento costituzionale, legge elettorale o nomine possono svolgersi a scrutinio segreto. Nel segreto dell’urna possono emergere i "franchi tiratori": parlamentari della stessa maggioranza che votano in dissenso dal proprio partito facendo andare "sotto" il Governo in Aula, con forte impatto mediatico e politico.',
    simulatorRule:
      'Ogni provvedimento sensibile mostra in anticipo il livello di rischio Franchi Tiratori, legato alla Tensione d’Aula e alla soddisfazione degli alleati di coalizione. Se i franchi tiratori fanno andare sotto il Governo, la legge si arena e scoppia un caso mediatico: per ricompattare la coalizione puoi convocare un Vertice di Maggioranza (€6.000) in Parlamento oppure ricorrere alla Questione di Fiducia sui DDL ordinari (che impone il voto palese ma logora il clima istituzionale).',
  },

  // =========================================================================
  // 5. ECONOMIA STATALE & FINANZE DEL PARTITO
  // =========================================================================
  {
    id: 'pil_debito_inflazione',
    category: 'economia_finanze',
    title: 'PIL, Debito Pubblico & Inflazione',
    subtitle: 'Le tre grandi variabili macroeconomiche del Paese',
    articleRef: 'Macroeconomia Italia',
    keywords: [
      'pil',
      'debito',
      'debito pubblico',
      'inflazione',
      'deficit',
      'economia',
      'crescita',
      'potere d acquisto',
      'patto di stabilita',
    ],
    realWorldRule:
      'Il PIL (Prodotto Interno Lordo) misura la ricchezza prodotta in un anno; il Debito Pubblico rappresenta lo stock complessivo dei titoli di Stato emessi (in Italia rapportato al PIL sotto stretto monitoraggio europeo); l’Inflazione misura la crescita generalizzata dei prezzi che erode il potere d’acquisto di salari e pensioni.',
    simulatorRule:
      'Nel simulatore PIL, Debito Pubblico e Inflazione guidano le scelte della Legge di Bilancio (rapporto Deficit/PIL), i dossier economici settimanali e i duelli televisivi. Investimenti in infrastrutture, lavoro e riduzione del cuneo stimolano crescita e consenso di lavoratori e imprese, ma se finanziati in deficit eccessivo appesantiscono il Debito Pubblico, innescano pressioni inflattive e spingono al rialzo lo Spread BTP–Bund.',
  },
  {
    id: 'spread_indicatori_stato',
    category: 'economia_finanze',
    title: 'Spread BTP–Bund, Rapporti UE, Stabilità Sociale & Tenuta Democratica',
    subtitle: 'I 4 indicatori vitali dello Stato italiano da tenere sotto controllo',
    articleRef: 'Cruscotto di Stato',
    keywords: [
      'spread',
      'btp',
      'bund',
      'ue',
      'rapporti ue',
      'pnrr',
      'stabilita sociale',
      'tenuta democratica',
      'veto',
      'scioperi',
    ],
    realWorldRule:
      'Lo Spread BTP–Bund è il differenziale di rendimento tra i titoli decennali italiani e tedeschi (espresso in punti base) e sintetizza la fiducia dei mercati nel debito italiano. Parallelamente, rapporti tesi con Bruxelles minacciano i fondi PNRR, le tensioni sociali alimentano scioperi e forzature istituzionali attivano i contrappesi costituzionali del Quirinale.',
    simulatorRule:
      'Uno Spread ≥240 bps genera penalità finanziarie settimanali (-€25.000/sett.) ed erode il consenso; Rapporti UE sotto il 35% congelano i benefici del PNRR e provocano crisi diplomatiche; Stabilità Sociale sotto il 35% innesca proteste e scioperi; Tenuta Democratica bassa aumenta la probabilità di Veto del Quirinale sulle riforme più estreme.',
  },
  {
    id: 'cassa_tesseramento_2x1000',
    category: 'economia_finanze',
    title: 'Cassa di Partito, Tesseramento Annuale & 2×1000 IRPEF',
    subtitle: 'Finanziamento trasparente della politica dopo la Legge 13/2014',
    articleRef: 'Legge 13/2014',
    keywords: [
      'cassa',
      'cassa di partito',
      'finanze',
      'budget',
      'tesseramento',
      'tesseramento annuale',
      '2x1000',
      '2×1000',
      'irpef',
      'donazioni',
      'crowdfunding',
      'parlamentari',
    ],
    realWorldRule:
      'Dal 2014 in Italia è abolito il finanziamento pubblico diretto ai partiti: le forze politiche si finanziano tramite tesseramento degli iscritti, contributi volontari dei propri parlamentari, donazioni private tracciabili con registro trasparente e il riparto del 2×1000 dell’IRPEF scelto dai contribuenti in dichiarazione dei redditi.',
    simulatorRule:
      'Ogni settimana la Cassa di Partito registra entrate organiche da tesseramento, circoli locali, 2×1000 e quote dei parlamentari eletti (+€450/sett. per ciascun seggio reale), al netto delle spese fisse proporzionate alla dimensione del partito. Nella scheda Partito trovi le stime live trasparenti per la Campagna di Tesseramento Annuale (nuovi iscritti, cassa e +4 lealtà interna), il riparto certificato 2×1000 IRPEF e gli eventi di autofinanziamento (Crowdfunding e Cene Sostenitori) influenzati anche dai tuoi Tratti attivi.',
  },

  // =========================================================================
  // 6. DIRIGENTI, DOSSIER, CRISI & REFERENDUM
  // =========================================================================
  {
    id: 'dirigenti_specializzazioni',
    category: 'dirigenti_crisi',
    title: 'Specializzazioni dei Dirigenti & Affinità Ministeri',
    subtitle: '8 competenze tecniche chiave e bonus/malus al Consiglio dei Ministri',
    articleRef: 'Squadra di Governo',
    keywords: [
      'dirigenti',
      'specializzazioni',
      'specializzazione',
      'affinita',
      'ministeri',
      'fuori ruolo',
      'competenza',
      'economia',
      'interni',
      'esteri',
      'giustizia',
      'sanita',
      'istruzione',
      'infrastrutture',
      'ambiente',
    ],
    realWorldRule:
      'Affidare i dicasteri a profili con esperienza coerente (Economia, Interni, Esteri, Giustizia, Sanità, Istruzione, Infrastrutture, Ambiente) aumenta la credibilità dell’Esecutivo presso mercati, istituzioni UE e cittadini, mentre nomine "fuori ruolo" generano inefficienze e polemiche.',
    simulatorRule:
      'Ogni dirigente del tuo partito possiede una specializzazione specifica e indicatori di Competenza, Lealtà e Ambizione. Assegnare un dirigente a un Ministero pienamente affine genera bonus settimanali di efficienza e consenso; un dirigente assegnato fuori ruolo produce malus di credibilità e stabilità finché non procedi a un Rimpasto.',
  },
  {
    id: 'coesione_scissioni',
    category: 'dirigenti_crisi',
    title: 'Coesione Interna & Scissioni di Partito',
    subtitle: 'Correnti in rivolta, soglia critica del 4% e nascita di un partito scissionista',
    articleRef: 'Soglia 4% · 3 Settimane',
    keywords: [
      'coesione',
      'scissione',
      'scissioni',
      'correnti',
      'lealta',
      '4%',
      'frattura',
      'colloquio',
      'dissenso',
    ],
    realWorldRule:
      'Quando la linea della segreteria entra in rotta di collisione con le correnti interne, un partito strutturato può subire una scissione parlamentare ed elettorale, perdendo deputati, senatori, dirigenti locali e una quota del proprio elettorato.',
    simulatorRule:
      'Una scissione può verificarsi solo quando il tuo partito raggiunge almeno il 4,0% nazionale e la coesione interna resta in zona critica (<40% oppure <52% con un dirigente ribelle) per 3 settimane consecutive. Il nuovo soggetto scissionista sottrae consenso, iscritti e seggi parlamentari reali. Previeni la rottura nella scheda Partito con "Colloquio" (gratuito, 1/sett. per dirigente) o "Affida Dossier" (€6.000).',
  },
  {
    id: 'scandali_indagini',
    category: 'dirigenti_crisi',
    title: 'Scandali Giudiziari & Indagini su Dirigenti o Ministri',
    subtitle: 'Il bivio tra linea garantista ("Difendi") e passo indietro ("Dimissioni")',
    articleRef: 'Etica & Giustizia',
    keywords: [
      'scandali',
      'scandalo',
      'indagini',
      'indagine',
      'procura',
      'avviso di garanzia',
      'dimissioni',
      'difendi',
      'garantismo',
      'giustizia',
    ],
    realWorldRule:
      'Un’inchiesta della magistratura o uno scandalo mediatico su un esponente di primo piano pone ogni segretario davanti a una scelta delicata: fare quadrato invocando il garantismo oppure chiedere dimissioni/autosospensione per proteggere la reputazione del partito e del Governo.',
    simulatorRule:
      'Quando esplode un’indagine mirata nella scheda Partito (o in un dossier settimanale), lasciarla irrisolta logora ogni settimana consenso e gradimento sotto i riflettori mediatici. Puoi scegliere tra "Difendere a oltranza" (preserva la lealtà della squadra ma danneggia consenso, gradimento del leader e credibilità pubblica) oppure "Chiedere dimissioni / sospensione" (salva l’immagine pubblica ma riduce la coesione interna e libera la casella dirigenziale o ministeriale da riassegnare in Parlamento).',
  },
  {
    id: 'dossier_pro_contro',
    category: 'dirigenti_crisi',
    title: 'Dossier Settimanali con Pro e Contro & Rassegna Media',
    subtitle: '1–3 crisi contestuali ogni settimana: valutare i trade-off prima di decidere',
    articleRef: 'Crisi & Media',
    keywords: [
      'dossier',
      'pro e contro',
      'pro',
      'contro',
      'eventi',
      'crisi',
      'media',
      'stampa',
      'social',
      'rivali',
      'scelte',
      'trade-off',
    ],
    realWorldRule:
      'Ogni decisione politica reale presenta pro e contro inevitabili: una misura che entusiasma una fascia sociale o una regione può irritare i mercati, l’Unione Europea, gli alleati o gli altri elettori, e la reazione completa di stampa, social e avversari emerge solo dopo l’annuncio.',
    simulatorRule:
      'Ogni settimana ricevi da 1 a 3 Dossier coerenti col tuo reale status (Extra-parlamentare, Opposizione o Governo). Ogni opzione descrive chiaramente linea politica e possibili Pro e Contro strategici senza spoiler numerici anticipati: subito dopo la scelta (oppure "Salta / Nessuna dichiarazione") il sistema rivela l’impatto reale su sondaggi, cassa, lealtà, indicatori di Stato e reazioni su Stampa, Social e Partiti Rivali.',
  },
  {
    id: 'dibattiti_tv',
    category: 'dirigenti_crisi',
    title: 'Dibattiti Televisivi 1 vs 1 (Duello TV in 3 Round)',
    subtitle: 'Sfide in prima serata tra dati tecnici, affondi e tratti del leader',
    articleRef: 'Prima Serata TV',
    keywords: [
      'dibattiti',
      'dibattito',
      'dibattiti tv',
      'tv',
      'duello',
      'duello tv',
      'talk show',
      '3 round',
      'tratti',
      'oratore',
    ],
    realWorldRule:
      'I faccia a faccia televisivi in prima serata possono spostare milioni di elettori indecisi: contano preparazione tecnica, tempismo dialettico, capacità di reggere gli attacchi personali e coerenza con il proprio profilo pubblico.',
    simulatorRule:
      'Nella scheda Campagna (1 confronto a settimana) puoi sfidare il leader di un partito rivale in un Duello TV interattivo di 3 round su temi caldi (Economia, Sanità, Immigrazione, Europa, Lavoro, Giustizia). Scegli per ogni round l’approccio tattico (Dati Tecnici, Affondo Populista o Attacco all’Avversario) valorizzando l’Identità del partito, lo Stile e i Tratti del tuo leader: vincere il confronto fa crescere sondaggi e gradimento personale.',
  },
  {
    id: 'tratti_partito_leader',
    category: 'dirigenti_crisi',
    title: 'Impatto Reale dei Tratti di Partito & Personalità del Leader',
    subtitle: 'Come Identità del partito, Stile di leadership e 2 Tratti modificano gameplay ed eventi',
    articleRef: 'Scheda Partito · Tratti Attivi',
    keywords: [
      'tratti',
      'tratto',
      'personalita',
      'personalità',
      'leader',
      'identita',
      'orientamento',
      'stile',
      'carismatico',
      'istituzionale',
      'tribuno',
      'stratega',
      'oratore tv',
      'economista',
      'diplomazia ue',
      'radicamento territoriale',
      'maestro social',
      'sindacalista',
      'ex magistrato',
      'volto nuovo',
    ],
    realWorldRule:
      'L’identità culturale di un partito e il profilo biografico del suo leader determinano credibilità verso mercati e UE, capacità di mobilitare piazza o social, tenuta della segreteria, costi organizzativi e facilità di costruire coalizioni.',
    simulatorRule:
      'Ogni tratto scelto in creazione (Identità del partito, Stile del leader e i 2 Tratti della personalità) applica modificatori concreti e visibili su Duelli TV, campagne social, costi/gestione sezioni, raccolta fondi e tesseramento, coesione interna, rischio veto del Quirinale e trattative di coalizione, oltre ad attivare Dossier e opzioni esclusive in Crisi & Media. Puoi consultare in ogni momento il riepilogo completo nel riquadro "Tratti Attivi" della scheda Partito.',
  },
  {
    id: 'referendum_abrogativi_costituzionali',
    category: 'dirigenti_crisi',
    title: 'Referendum Abrogativi (500.000 Firme + Quorum) & Costituzionali (Senza Quorum)',
    subtitle: 'Gli strumenti costituzionali di democrazia diretta in Italia',
    articleRef: 'Artt. 75 & 138 Cost.',
    keywords: [
      'referendum',
      'abrogativo',
      'abrogativi',
      'costituzionale',
      'costituzionali',
      '500000',
      '500.000',
      'quorum',
      'senza quorum',
      'astensione',
      'art 75',
      'art 138',
      'democrazia diretta',
    ],
    realWorldRule:
      'Il Referendum Abrogativo (Art. 75 Cost.) permette di cancellare in tutto o in parte una legge ordinaria raccogliendo 500.000 firme di elettori (o 5 Consigli Regionali), ma è valido solo se si raggiunge il Quorum del 50%+1 degli aventi diritto al voto. Il Referendum Costituzionale Confermativo (Art. 138 Cost.) si attiva sulle riforme costituzionali approvate senza i 2/3 del Parlamento e NON prevede alcun quorum: vince chi prende più voti validi.',
    simulatorRule:
      'Disponibile sia in Crisi & Media sia in Parlamento (anche da partito extra-parlamentare per l’Art. 75): puoi promuovere un Referendum Abrogativo (€10.000) raccogliendo 500.000 firme con i gazebo (€4.500), attivare un Referendum Costituzionale contro riforme approvate a maggioranza semplice, schierarti su Sì, No oppure Astensione (strategia anti-quorum valida solo sull’Abrogativo) e finanziare la campagna referendaria locale o nazionale (1 investimento a settimana).',
  },

  // =========================================================================
  // 7. GLOSSARIO POLITICO & ISTITUZIONALE
  // =========================================================================
  {
    id: 'glossario_budget_cadenza',
    category: 'glossario',
    title: 'Budget Reale & Cadenze Operative',
    subtitle: 'Gestione realistica tramite Cassa in Euro, disponibilità dei dirigenti e limiti settimanali',
    articleRef: 'Glossario Gameplay',
    keywords: ['budget', 'cassa', 'cadenza', 'risorse', 'dirigenti', 'turno', 'settimana', 'azioni', 'glossario'],
    realWorldRule:
      'Nella politica reale un partito non spende gettoni astratti: le sue scelte sono vincolate dal bilancio di cassa, dai tempi del calendario parlamentare e mediatico e dal numero di dirigenti e militanti disponibili sul territorio.',
    simulatorRule:
      'Le iniziative si pagano con il budget reale in Euro e rispettano limiti operativi naturali: 1 iniziativa per canale di Campagna a settimana, 1 Duello TV a settimana, 1 azione a settimana per dirigente, 1 votazione d’Aula e 1 rimpasto a settimana, più cooldown realistici per tesseramento e raccolte fondi.',
  },
  {
    id: 'glossario_seggi_legislatura',
    category: 'glossario',
    title: 'Seggi Reali di Legislatura vs Sondaggi',
    subtitle: 'Perché superare il 3% nei sondaggi non assegna seggi in Parlamento',
    articleRef: 'Glossario Istituzioni',
    keywords: ['seggi', 'legislatura', 'sondaggi', '3%', 'extraparlamentare', 'governo', 'elezioni', 'glossario'],
    realWorldRule:
      'I seggi a Camera (400) e Senato (200) sono determinati dal voto popolare alle Elezioni Politiche e rimangono fissi per la legislatura, salvo scissioni o cambi di gruppo parlamentare.',
    simulatorRule:
      'Nel simulatore l’emiciclo e i voti d’Aula riflettono sempre i seggi reali della legislatura in carica. I sondaggi settimanali mostrano la tendenza elettorale e le proiezioni in Sala Elezioni, ma non assegnano mai seggi né accesso al Governo fino alla Notte Elettorale.',
  },
  {
    id: 'glossario_tratti_identita',
    category: 'glossario',
    title: 'Tratti del Leader & Identità di Partito',
    subtitle: 'Profilo strategico che influenza TV, finanze, sezioni, coalizioni ed eventi',
    articleRef: 'Glossario Gameplay',
    keywords: ['tratti', 'identita', 'personalita', 'stile', 'leader', 'bonus', 'malus', 'glossario'],
    realWorldRule:
      'Ogni forza politica e il suo segretario hanno punti di forza e fragilità strutturali riconosciuti da elettori, media, alleati e istituzioni.',
    simulatorRule:
      'Identità del partito, Stile di leadership e i 2 Tratti del leader applicano modificatori permanenti su Duelli TV, coesione, costi delle sezioni, tesseramento, rapporti UE/Quirinale e coalizioni, e sbloccano Dossier e scelte dedicate in Crisi & Media.',
  },
  {
    id: 'glossario_apparentamento',
    category: 'glossario',
    title: 'Apparentamento Elettorale',
    subtitle: 'Collegamento tecnico o politico tra liste per l’accesso alla scheda e ai collegi',
    articleRef: 'Glossario Elettorale',
    keywords: ['apparentamento', 'collegamento', 'esenzione', 'firme', 'coalizione', 'glossario'],
    realWorldRule:
      'Accordo formale con cui una lista o un nuovo movimento si collega a una coalizione o a una forza parlamentare già rappresentata, beneficiando della convergenza nei collegi e delle esenzioni previste dalla legge elettorale.',
    simulatorRule:
      'Stringendo un’alleanza con un partito già presente in Parlamento nella scheda Partito & Coalizioni puoi ottenere l’esenzione dalla raccolta firme per le liste ed evitare l’esclusione dalla scheda elettorale.',
  },
  {
    id: 'glossario_cencelli',
    category: 'glossario',
    title: 'Manuale Cencelli',
    subtitle: 'Criterio proporzionale di ripartizione dei Ministeri tra gli alleati di Governo',
    articleRef: 'Glossario Governo',
    keywords: ['cencelli', 'manuale cencelli', 'ministeri', 'peso', 'soddisfazione', 'glossario'],
    realWorldRule:
      'Espressione del giornalismo politico italiano che indica il metodo matematico con cui incarichi ministeriali e sottosegretariati vengono distribuiti in proporzione ai voti e ai seggi portati da ciascun partito della coalizione.',
    simulatorRule:
      'Durante le Consultazioni al Quirinale ogni Ministero ha un peso politico preciso: assegnare a un alleato un peso inferiore alla sua quota parlamentare abbassa la sua soddisfazione e aumenta il rischio di crisi di governo.',
  },
  {
    id: 'glossario_quorum',
    category: 'glossario',
    title: 'Quorum Strutturale (50% + 1)',
    subtitle: 'Soglia minima di affluenza necessaria per validare un Referendum Abrogativo',
    articleRef: 'Art. 75 Cost.',
    keywords: ['quorum', '50%+1', 'affluenza', 'astensione', 'referendum', 'glossario'],
    realWorldRule:
      'Previsto esclusivamente per il Referendum Abrogativo (Art. 75 Cost.): se alle urne si reca meno della metà più uno degli aventi diritto, la consultazione è nulla indipendentemente dalla percentuale di Sì. Non si applica ai Referendum Costituzionali (Art. 138 Cost.).',
    simulatorRule:
      'Sui Referendum Abrogativi puoi scegliere la posizione "Astensione" per abbassare l’affluenza stimata e far fallire il quorum; sui Referendum Costituzionali l’astensione non invalida il voto e contano solo i voti espressi tra Sì e No.',
  },
  {
    id: 'glossario_ddl_dl',
    category: 'glossario',
    title: 'Decreto-Legge (DL) vs Disegno di Legge (DDL)',
    subtitle: 'Urgenza immediata con scadenza a 60 giorni contro iter parlamentare ordinario stabile',
    articleRef: 'Artt. 70 & 77 Cost.',
    keywords: [
      'ddl',
      'dl',
      'decreto legge',
      'decreto-legge',
      'disegno di legge',
      '60 giorni',
      'conversione',
      'decadenza',
      'iter parlamentare',
      'glossario',
    ],
    realWorldRule:
      'Il DDL è la proposta di legge ordinaria che segue il percorso completo in Commissione, Camera e Senato senza scadenze rigide. Il Decreto-Legge (Art. 77 Cost.) è un atto d’urgenza del Governo immediatamente efficace, ma decade retroattivamente se non convertito in legge dal Parlamento entro 60 giorni.',
    simulatorRule:
      'Al Governo scegli per ogni norma se procedere con DDL Ordinario (iter stabile di 3 settimane senza logoramento della coalizione) o Decreto-Legge (effetto immediato e countdown di 8 settimane/60 giorni per la conversione in Aula, pena decadenza e calo di credibilità).',
  },
  {
    id: 'glossario_questione_fiducia',
    category: 'glossario',
    title: 'Questione di Fiducia',
    subtitle: 'Strumento governativo per blindare un testo legando il voto alla sopravvivenza dell’Esecutivo',
    articleRef: 'Art. 94 Cost.',
    keywords: [
      'questione di fiducia',
      'fiducia',
      'emendamenti',
      'ostruzionismo',
      'caduta governo',
      'maggioranza',
      'glossario',
    ],
    realWorldRule:
      'Il Governo può subordinare la propria permanenza in carica all’approvazione di un DDL o di un Decreto-Legge: la fiducia azzera tutti gli emendamenti ostili e compatta la maggioranza, ma un voto contrario comporta l’obbligo immediato di dimissioni dell’Esecutivo.',
    simulatorRule:
      'Attivabile su DDL in iter bloccati da emendamenti ostili o su DL in scadenza: aumenta nettamente i voti favorevoli ma riduce la soddisfazione degli alleati, la coesione interna e i rapporti con le opposizioni; se il voto fallisce, il Governo cade subito.',
  },
  {
    id: 'glossario_commissione_inchiesta',
    category: 'glossario',
    title: 'Commissione d’Inchiesta Parlamentare',
    subtitle: 'Organo parlamentare con poteri istruttori su temi sensibili, appalti o scandali',
    articleRef: 'Art. 82 Cost.',
    keywords: [
      'commissione d inchiesta',
      'commissione inchiesta',
      'commissioni',
      'inchiesta',
      'art 82',
      'rapporto finale',
      'audizioni',
      'opposizione',
      'glossario',
    ],
    realWorldRule:
      'Istituita ai sensi dell’Articolo 82 della Costituzione, indaga su materie di pubblico interesse con gli stessi poteri della magistratura e chiude i lavori con una relazione finale capace di orientare il dibattito pubblico e parlamentare.',
    simulatorRule:
      'Può essere promossa dal giocatore (€12.000, max 2 attive, 1 avvio/sett.) oppure dall’Opposizione contro un Governo in carica: dopo 4–5 settimane pubblica un rapporto finale che sposta sondaggi, pressione mediatica e gradimento.',
  },
  {
    id: 'glossario_seduta_comune',
    category: 'glossario',
    title: 'Elezione del Presidente della Repubblica (Scrutini 2/3 e 50%+1)',
    subtitle: 'Parlamento in Seduta Comune con 658 Grandi Elettori ogni 7 anni',
    articleRef: 'Art. 83 Cost.',
    keywords: [
      'presidente della repubblica',
      'elezione presidente',
      'seduta comune',
      '658',
      'grandi elettori',
      'delegati',
      'quirinale',
      'settennato',
      'scrutini',
      '2/3',
      '439',
      '50%+1',
      '330',
      'accordo trasversale',
      'alla conta',
      'glossario',
    ],
    realWorldRule:
      'Alla scadenza del mandato settennale il Parlamento in Seduta Comune (400 Deputati + 200 Senatori + 58 Delegati Regionali = 658 Grandi Elettori) elegge il Capo dello Stato: nei primi 3 scrutini serve la maggioranza qualificata dei 2/3 (439 voti), dal 4° scrutinio basta la maggioranza assoluta del 50%+1 (330 voti).',
    simulatorRule:
      'Alla scadenza del settennato si apre la Seduta Comune: sostieni o proponi un candidato, tratta accordi trasversali con altri gruppi (€10.000) o vai alla conta e vota scrutinio dopo scrutinio, gestendo l’impatto dell’esito su maggioranza, opposizioni e tenuta democratica.',
  },
  {
    id: 'glossario_tesseramento_2x1000',
    category: 'glossario',
    title: 'Tesseramento Annuale & 2×1000 IRPEF',
    subtitle: 'Raccolta fondi trasparente, iscritti attivi e autofinanziamento dei partiti',
    articleRef: 'Legge 13/2014',
    keywords: [
      'tesseramento',
      '2x1000',
      '2×1000',
      'irpef',
      'raccolta fondi',
      'autofinanziamento',
      'crowdfunding',
      'donazioni',
      'bilancio trasparente',
      'glossario',
    ],
    realWorldRule:
      'Con la Legge 13/2014 i partiti italiani si sostengono attraverso le tessere annuali degli iscritti, la quota volontaria del 2×1000 IRPEF indicata dai contribuenti e donazioni o eventi di autofinanziamento soggetti a obblighi di rendicontazione trasparente.',
    simulatorRule:
      'Nella scheda Partito puoi avviare la Campagna di Tesseramento (nuovi iscritti, cassa e +4 lealtà), incassare periodicamente la quota 2×1000 proporzionata a sondaggi e seggi e organizzare Crowdfunding o Cene Sostenitori con stime live e registro pubblico.',
  },
  {
    id: 'glossario_scandali_indagini',
    category: 'glossario',
    title: 'Gestione Scandali & Indagini Giudiziarie',
    subtitle: 'Scelta politica tra difesa garantista a oltranza e dimissioni/sospensione',
    articleRef: 'Etica & Governance',
    keywords: [
      'scandali',
      'scandalo',
      'indagini',
      'indagine',
      'procura',
      'difendi',
      'dimissioni',
      'sospensione',
      'ministro',
      'dirigente',
      'glossario',
    ],
    realWorldRule:
      'Quando un ministro o un dirigente di partito viene coinvolto in un’indagine della magistratura o in uno scandalo pubblico, la leadership deve scegliere tra difenderlo a oltranza per proteggere gli equilibri interni o chiederne dimissioni/autosospensione per arginare il danno d’immagine.',
    simulatorRule:
      'Gli eventi dedicati nella scheda Partito (e nei Dossier) ti pongono davanti al bivio: "Difendi a oltranza" preserva la coesione interna ma espone a forte calo di credibilità e attacchi mediatici; "Chiedi dimissioni/sospensione" salva la reputazione pubblica ma riduce la coesione interna e libera la poltrona o il Ministero da riassegnare.',
  },
  {
    id: 'glossario_spread_pnrr',
    category: 'glossario',
    title: 'Spread BTP–Bund (bps) & PNRR',
    subtitle: 'Termometro della fiducia finanziaria e fondi europei di investimento',
    articleRef: 'Glossario Economia',
    keywords: ['spread', 'bps', 'btp', 'bund', 'pnrr', 'bruxelles', 'mercati', 'glossario'],
    realWorldRule:
      'Un punto base (1 bps) equivale allo 0,01% di differenziale di tasso tra i titoli decennali italiani (BTP) e quelli tedeschi (Bund). Il PNRR è il Piano Nazionale di Ripresa e Resilienza legato a riforme e target concordati con la Commissione Europea.',
    simulatorRule:
      'Tieni lo Spread sotto i 240 bps e i Rapporti UE sopra il 35% evitando manovre in deficit fuori controllo o scontri frontali con Bruxelles, così da non subire drenaggi di cassa e perdite di consenso.',
  },
  {
    id: 'glossario_esercizio_provvisorio',
    category: 'glossario',
    title: 'Esercizio Provvisorio & Rimpasto di Governo',
    subtitle: 'Due meccanismi chiave della gestione parlamentare ed esecutiva',
    articleRef: 'Glossario Istituzioni',
    keywords: [
      'esercizio provvisorio',
      'rimpasto',
      'bilancio',
      'crisi di governo',
      'ministri',
      'glossario',
    ],
    realWorldRule:
      'L’Esercizio Provvisorio (Art. 81 Cost.) limita la spesa pubblica a un dodicesimo mensile se il bilancio non è approvato entro l’anno. Il Rimpasto è la sostituzione o redistribuzione di uno o più ministri senza aprire una crisi formale di governo.',
    simulatorRule:
      'Approvare la Manovra in Parlamento evita il collasso di fiducia e mercati; il Rimpasto (1 a settimana nella scheda Parlamento) ti permette invece di risolvere ministri fuori ruolo, sostituire indagati o placare un alleato scontento.',
  },
  {
    id: 'glossario_gruppi_europei',
    category: 'glossario',
    title: 'Gruppi Parlamentari Europei (PPE, S&D, PfE, ECR, Renew, Verdi/ALE, The Left, ESN)',
    subtitle: 'Le famiglie politiche transnazionali in cui si organizzano gli eurodeputati a Strasburgo',
    articleRef: 'Glossario Europa',
    keywords: [
      'gruppi europei',
      'ppe',
      's&d',
      'pfe',
      'ecr',
      'renew',
      'verdi',
      'the left',
      'esn',
      'non iscritti',
      'strasburgo',
      'eurodeputati',
      'glossario',
    ],
    realWorldRule:
      'A Strasburgo gli eurodeputati si riuniscono per affinità politica e non per Stato membro. I gruppi principali determinano la presidenza delle commissioni, i tempi di parola e la maggioranza che sostiene la Commissione Europea, mentre i Non Iscritti restano ai margini decisionali.',
    simulatorRule:
      'Dopo le Elezioni Europee scegli a quale Gruppo UE aderire tra le 9 opzioni ufficiali: un gruppo coerente con la tua identità rafforza la base, mentre i gruppi centrali offrono maggiore peso a Bruxelles e relazioni più distese con la Commissione.',
  },
  {
    id: 'glossario_commissione_commissario',
    category: 'glossario',
    title: 'Commissione Europea, Voto di Fiducia & Commissario Italiano',
    subtitle: 'L’esecutivo dell’Unione Europea e il portafoglio assegnato all’Italia',
    articleRef: 'Glossario Europa',
    keywords: [
      'commissione europea',
      'commissario italiano',
      'audizione',
      'portafoglio',
      'fiducia commissione',
      'bruxelles',
      'glossario',
    ],
    realWorldRule:
      'La Commissione Europea propone le direttive UE, vigila sui conti pubblici e gestisce i fondi europei. Il suo Presidente ottiene la fiducia dal Parlamento Europeo e ogni Stato membro designa un Commissario sottoposto a rigorosa audizione parlamentare.',
    simulatorRule:
      'Con almeno 1 eurodeputato voti la fiducia alla Commissione (Favorevole, Contrario o Astenuto). Se governi in Italia nomini anche il Commissario italiano: un profilo autorevole e una maggioranza europea alleata riducono lo Spread e ampliano il margine fiscale nella Legge di Bilancio.',
  },
  {
    id: 'glossario_direttive_bruxelles',
    category: 'glossario',
    title: 'Direttive Europee, Cartelli Elettorali & Alternanza di Genere',
    subtitle: 'Norme UE vincolanti, soglia del 4% e meccanismi del voto europeo italiano',
    articleRef: 'Glossario Europa',
    keywords: [
      'direttive europee',
      'dossier bruxelles',
      'cartello elettorale',
      'sbarramento 4%',
      'alternanza di genere',
      'preferenze',
      'glossario',
    ],
    realWorldRule:
      'Le Direttive UE fissano obiettivi comuni (su bilancio, energia, agricoltura, difesa e migrazioni) che gli Stati devono recepire. Alle Europee italiane vige lo sbarramento nazionale del 4% e fino a 3 preferenze con obbligo di alternanza di genere.',
    simulatorRule:
      'Nel quinquennio europeo ricevi periodicamente Dossier da Bruxelles su cui i tuoi eurodeputati votano (seguendo o sfidando la linea del Gruppo UE). Prima del voto, i partiti sotto il 4% possono stringere un Cartello Elettorale per unire le forze e accedere ai 76 seggi.',
  },
];

export const TabGuide: React.FC<TabGuideProps> = ({ onBack, onOpenLegal }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GuideCategoryId | 'all'>('all');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    come_ciclo_settimanale: true,
    come_prime_settimane: true,
    comitato_promotore: true,
    sezioni_circoli_apertura: true,
    rosatellum: true,
    ddl_vs_dl: true,
  });

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredEntries = useMemo(() => {
    return GUIDE_ENTRIES.filter((entry) => {
      if (selectedCategory !== 'all' && entry.category !== selectedCategory) {
        return false;
      }
      if (!normalizedQuery) return true;
      const cat = CATEGORIES.find((c) => c.id === entry.category);
      const practicalText = (entry.practicalBlocks ?? [])
        .flatMap((block) => [
          block.heading,
          block.badge ?? '',
          block.tip ?? '',
          ...block.items.flatMap((item) => [item.label ?? '', item.text]),
        ])
        .join(' ');
      const haystack = [
        entry.title,
        entry.subtitle,
        entry.articleRef ?? '',
        cat?.label ?? '',
        cat?.description ?? '',
        entry.realWorldRule ?? '',
        entry.simulatorRule ?? '',
        practicalText,
        ...entry.keywords,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [selectedCategory, normalizedQuery]);

  // Auto-expand every matching card whenever the search query changes
  useEffect(() => {
    if (!normalizedQuery) return;
    setOpenIds((prev) => {
      const next = { ...prev };
      for (const entry of filteredEntries) {
        next[entry.id] = true;
      }
      return next;
    });
  }, [normalizedQuery, filteredEntries]);

  const toggleEntry = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    setOpenIds((prev) => {
      const next = { ...prev };
      for (const entry of filteredEntries) {
        next[entry.id] = true;
      }
      return next;
    });
  };

  const collapseAll = () => {
    setOpenIds((prev) => {
      const next = { ...prev };
      for (const entry of filteredEntries) {
        next[entry.id] = false;
      }
      return next;
    });
  };

  const groupedByCategory = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      category: cat,
      items: filteredEntries.filter((e) => e.category === cat.id),
    })).filter((group) => group.items.length > 0);
  }, [filteredEntries]);

  const tutorialMatchesCount = useMemo(
    () => filteredEntries.filter((e) => e.category !== 'glossario').length,
    [filteredEntries]
  );
  const glossaryMatchesCount = useMemo(
    () => filteredEntries.filter((e) => e.category === 'glossario').length,
    [filteredEntries]
  );

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden war-scroll p-3 sm:p-5 lg:p-6 bg-[#090D16]">
      <div className="max-w-5xl mx-auto space-y-5 pb-6">
        {/* Section Header + Introduction + Controls */}
        <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 sm:p-6 space-y-4 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2 min-w-0">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium text-cyan-300 hover:text-cyan-200 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                  <span>Torna al Menu Principale</span>
                </button>
              )}
              <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-normal">
                  Manuale Istituzionale, Tutorial &amp; Glossario
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-50 leading-snug whitespace-normal">
                Guida, Tutorial &amp; Glossario
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl whitespace-normal">
                Benvenuto nella guida ufficiale di{' '}
                <span className="text-slate-100 font-semibold">Italian Politics Simulator</span>.
                Qui trovi tutte le meccaniche del gioco organizzate per argomento e affiancate alle
                regole reali dell’ordinamento costituzionale, elettorale ed economico italiano:
                dalla fondazione del partito fino a Palazzo Chigi e al Quirinale.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {onOpenLegal && (
                <button
                  type="button"
                  onClick={() => onOpenLegal('privacy')}
                  className="px-3 py-2 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-emerald-500/45 text-xs font-medium text-emerald-300 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Privacy, Note Legali &amp; Dati</span>
                </button>
              )}
              <button
                type="button"
                onClick={expandAll}
                className="px-3 py-2 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-xs font-medium text-cyan-300 cursor-pointer transition-colors"
              >
                Espandi tutto
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-3 py-2 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 cursor-pointer transition-colors"
              >
                Comprimi tutto
              </button>
            </div>
          </div>

          {/* Live Internal Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca nella guida pratica, tutorial e glossario (es. Budget, Tratti, Seggi, Avanza, Dossier, Palazzo Chigi, Rosatellum, Circoli, Decreto-Legge, Spread, 2×1000, Scissione...)"
              aria-label="Cerca nella guida, tutorial e glossario"
              className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#090D16] border border-slate-700/90 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Pulisci ricerca"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100 cursor-pointer p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Category Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer text-left whitespace-normal ${
                selectedCategory === 'all'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-100'
                  : 'bg-[#090D16] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              Tutte le categorie{' '}
              <span className="font-mono tabular-nums opacity-80">({GUIDE_ENTRIES.length})</span>
            </button>

            {CATEGORIES.map((cat) => {
              const count = GUIDE_ENTRIES.filter((e) => e.category === cat.id).length;
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 text-left whitespace-normal ${
                    active
                      ? 'bg-slate-800 border-cyan-400/80 text-slate-50'
                      : 'bg-[#090D16] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {cat.icon}
                  <span className="whitespace-normal">
                    {cat.label}{' '}
                    <span className="font-mono tabular-nums opacity-75">({count})</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Live Search Feedback Banner */}
        {normalizedQuery && (
          <div className="px-3.5 py-2.5 rounded-lg bg-[#111827] border border-cyan-500/30 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
            <div className="whitespace-normal leading-relaxed">
              Risultati per{' '}
              <strong className="text-slate-100">&ldquo;{searchQuery.trim()}&rdquo;</strong>:{' '}
              <strong className="text-cyan-300 tabular-nums">{filteredEntries.length}</strong>{' '}
              {filteredEntries.length === 1 ? 'voce trovata' : 'voci trovate'} (
              <span className="tabular-nums">{tutorialMatchesCount}</span> nel tutorial,{' '}
              <span className="tabular-nums">{glossaryMatchesCount}</span> nel glossario) — schede
              corrispondenti espanse automaticamente.
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-xs font-medium text-cyan-300 hover:text-cyan-200 underline underline-offset-2 cursor-pointer shrink-0"
            >
              Reimposta filtri
            </button>
          </div>
        )}

        {/* Accordion Sections Grouped by Category */}
        {groupedByCategory.length === 0 ? (
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-8 text-center space-y-2.5">
            <Scale className="w-7 h-7 text-slate-500 mx-auto" />
            <div className="text-sm font-semibold text-slate-200 whitespace-normal">
              Nessuna voce trovata per &ldquo;{searchQuery.trim()}&rdquo;
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed whitespace-normal">
              Prova con un altro termine come &ldquo;Rosatellum&rdquo;, &ldquo;Circoli&rdquo;,
              &ldquo;76 seggi&rdquo;, &ldquo;Quirinale&rdquo;, &ldquo;Decreto-Legge&rdquo;,
              &ldquo;PIL&rdquo;, &ldquo;2×1000&rdquo; o &ldquo;Quorum&rdquo;.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-xs font-medium text-cyan-300 cursor-pointer transition-colors"
              >
                Mostra tutte le voci
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByCategory.map(({ category, items }) => (
              <section
                key={category.id}
                className={
                  category.featured
                    ? 'space-y-3 rounded-2xl bg-sky-950/20 border border-sky-500/30 p-3.5 sm:p-4'
                    : 'space-y-3'
                }
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 px-1 pb-2 border-b border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    {category.icon}
                    <h2
                      className={`text-sm sm:text-base font-bold leading-snug whitespace-normal break-words ${category.accent}`}
                    >
                      {category.label}
                    </h2>
                    <span className="text-xs font-mono tabular-nums text-slate-400 shrink-0">
                      ({items.length})
                    </span>
                    {category.featured && (
                      <span className="px-2 py-0.5 rounded border border-sky-400/45 bg-sky-500/15 text-[10px] font-mono uppercase tracking-wider text-sky-200 whitespace-normal">
                        Inizia Qui
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300/90 whitespace-normal break-words leading-snug">
                    {category.description}
                  </p>
                </div>

                <div className="space-y-2.5">
                  {items.map((entry) => {
                    const isOpen = Boolean(openIds[entry.id]);
                    return (
                      <article
                        key={entry.id}
                        className={`rounded-xl border transition-colors ${
                          isOpen
                            ? category.featured
                              ? 'bg-[#111827] border-sky-500/45 shadow-md'
                              : 'bg-[#111827] border-slate-700/90 shadow-md'
                            : 'bg-[#111827]/80 border-slate-800/90 hover:border-slate-700'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleEntry(entry.id)}
                          aria-expanded={isOpen}
                          className="w-full px-4 py-3.5 text-left flex items-start justify-between gap-3 cursor-pointer"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                              <h3 className="text-sm sm:text-[15px] font-bold text-slate-100 whitespace-normal leading-snug break-words">
                                {entry.title}
                              </h3>
                              {entry.articleRef && (
                                <span
                                  className={`px-2 py-0.5 rounded border text-[10px] font-mono uppercase tracking-wide whitespace-normal ${category.badgeClass}`}
                                >
                                  {entry.articleRef}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 whitespace-normal leading-relaxed break-words">
                              {entry.subtitle}
                            </p>
                          </div>
                          <span className="text-slate-400 shrink-0 mt-0.5 p-1 rounded-md bg-[#090D16]/70 border border-slate-800">
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4 text-cyan-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </span>
                        </button>

                        {isOpen && entry.practicalBlocks && entry.practicalBlocks.length > 0 && (
                          <div className="px-4 pb-4 pt-3 space-y-3 border-t border-slate-800/80">
                            {entry.practicalBlocks.map((block, blockIndex) => (
                              <div
                                key={`${entry.id}-block-${blockIndex}`}
                                className="p-3.5 sm:p-4 rounded-lg bg-[#090D16] border border-sky-500/25 space-y-2.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <h4 className="text-xs sm:text-[13px] font-bold text-sky-300 leading-snug whitespace-normal break-words">
                                    {block.heading}
                                  </h4>
                                  {block.badge && (
                                    <span className="px-2 py-0.5 rounded border border-sky-500/35 bg-sky-500/10 text-[10px] font-mono uppercase tracking-wide text-sky-200 whitespace-normal">
                                      {block.badge}
                                    </span>
                                  )}
                                </div>

                                {block.listType === 'ordered' ? (
                                  <ol className="space-y-2">
                                    {block.items.map((item, itemIdx) => (
                                      <li
                                        key={`${entry.id}-b${blockIndex}-o${itemIdx}`}
                                        className="flex items-start gap-2.5 text-xs sm:text-[13px] text-slate-200 leading-relaxed"
                                      >
                                        <span className="mt-0.5 w-5 h-5 rounded-md bg-sky-500/15 border border-sky-500/40 text-sky-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 tabular-nums">
                                          {itemIdx + 1}
                                        </span>
                                        <span className="min-w-0 flex-1 whitespace-normal break-words">
                                          {item.label && (
                                            <strong className="text-slate-50 font-semibold">
                                              {item.label}{' '}
                                            </strong>
                                          )}
                                          {item.text}
                                        </span>
                                      </li>
                                    ))}
                                  </ol>
                                ) : (
                                  <ul className="space-y-2">
                                    {block.items.map((item, itemIdx) => (
                                      <li
                                        key={`${entry.id}-b${blockIndex}-u${itemIdx}`}
                                        className="flex items-start gap-2.5 text-xs sm:text-[13px] text-slate-200 leading-relaxed"
                                      >
                                        <span
                                          aria-hidden="true"
                                          className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"
                                        />
                                        <span className="min-w-0 flex-1 whitespace-normal break-words">
                                          {item.label && (
                                            <strong className="text-slate-50 font-semibold">
                                              {item.label}{' '}
                                            </strong>
                                          )}
                                          {item.text}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                )}

                                {block.tip && (
                                  <div className="pt-2 mt-1 border-t border-slate-800/80 flex items-start gap-2 text-xs text-amber-200/95 leading-relaxed">
                                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                    <span className="min-w-0 flex-1 whitespace-normal break-words">
                                      <strong className="text-amber-300 font-semibold">
                                        Consiglio pratico:{' '}
                                      </strong>
                                      {block.tip}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {isOpen &&
                          (!entry.practicalBlocks || entry.practicalBlocks.length === 0) && (
                            <div className="px-4 pb-4 pt-3 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-800/80">
                              <div className="p-3.5 rounded-lg bg-[#090D16] border border-amber-500/25 space-y-2">
                                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold whitespace-normal">
                                  <Landmark className="w-3.5 h-3.5 shrink-0" />
                                  <span>Nella Realtà · Ordinamento Italiano</span>
                                </div>
                                <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed whitespace-normal break-words">
                                  {entry.realWorldRule}
                                </p>
                              </div>

                              <div className="p-3.5 rounded-lg bg-[#090D16] border border-cyan-500/30 space-y-2">
                                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold whitespace-normal">
                                  <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                                  <span>Nel Simulatore · Impatto sul Gameplay</span>
                                </div>
                                <p className="text-xs sm:text-[13px] text-slate-200 leading-relaxed whitespace-normal break-words">
                                  {entry.simulatorRule}
                                </p>
                              </div>
                            </div>
                          )}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Privacy, Disclaimer & Open Data Footer Card */}
        {onOpenLegal && (
          <footer className="p-4 rounded-xl bg-[#111827] border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-start gap-2.5 min-w-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 min-w-0">
                <div className="font-semibold text-slate-200">
                  Privacy (GDPR), Disclaimer Politico &amp; Fonti Dati
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed whitespace-normal">
                  Simulatore indipendente, apartitico e 100% locale. Consulta l’informativa completa, le licenze ISTAT / Eligendo o gestisci la cancellazione dei dati locali.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenLegal('privacy')}
                className="px-3 py-1.5 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 font-medium cursor-pointer transition-colors"
              >
                Privacy &amp; GDPR
              </button>
              <button
                type="button"
                onClick={() => onOpenLegal('disclaimer')}
                className="px-3 py-1.5 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium cursor-pointer transition-colors"
              >
                Disclaimer
              </button>
              <button
                type="button"
                onClick={() => onOpenLegal('fonti')}
                className="px-3 py-1.5 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-cyan-300 font-medium cursor-pointer transition-colors"
              >
                Fonti &amp; Licenze
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};

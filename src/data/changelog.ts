import { APP_VERSION } from '../config/appConfig';

export type ChangelogTag = 'Nuove Funzioni' | 'Bilanciamento' | 'Bug Risolti';

export interface ChangelogItem {
  tag: ChangelogTag;
  title: string;
  detail: string;
}

export interface ChangelogRelease {
  version: string;
  date: string;
  headline: string;
  summary: string;
  items: ChangelogItem[];
}

/**
 * Chiave localStorage con prefisso `palazzo_chigi_` così da essere ripulita automaticamente
 * anche da `clearAllLocalAppData()` nella schermata Privacy & Dati.
 */
export const CHANGELOG_SEEN_STORAGE_KEY = 'palazzo_chigi_changelog_seen_version';

export const CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    version: APP_VERSION,
    date: 'Novembre 2026',
    headline: 'Riallineamento Seggi XIX Legislatura & Partiti in Parlamento',
    summary:
      'Aggiornata la composizione iniziale di Camera (400) e Senato (200) ai dati reali della XIX Legislatura, incluso l’ingresso di Futuro Nazionale tra i partiti parlamentari, il riepilogo completo dei Gruppi in Aula e la corretta gestione del Gruppo Misto / Non Iscritti.',
    items: [
      {
        tag: 'Bug Risolti',
        title: 'Futuro Nazionale e Partiti Monocamerali Visibili in Parlamento',
        detail:
          'Corretto il problema che escludeva Futuro Nazionale (9 deputati, 0 senatori, 1 eurodeputato nel gruppo ESN) e rendeva poco visibili i partiti presenti in una sola Camera (+Europa, Sud chiama Nord). Qualsiasi partito con almeno 1 seggio tra Camera e Senato ha ora pieno accesso alla scheda Parlamento e compare nell’emiciclo e nelle liste parlamentari.',
      },
      {
        tag: 'Bilanciamento',
        title: 'Seggi Reali XIX Legislatura (Camera 400 · Senato 200) & Gruppo Misto',
        detail:
          'Allineati tutti i seggi iniziali di Maggioranza (FdI 116/63, Lega 54/30, Forza Italia 50/18, Noi Moderati 8/8), Opposizione Parlamentare (PD 68/35, M5S 48/25, Azione 10/2, AVS 9/3, Futuro Nazionale 9/0, Italia Viva 7/8, SVP 4/7, +Europa 3/0, Sud chiama Nord 3/0) e Gruppo Misto / Non Iscritti (11/1). I salvataggi esistenti prima delle nuove elezioni si aggiornano automaticamente.',
      },
    ],
  },
  {
    version: '1.2.0',
    date: 'Novembre 2026',
    headline: 'Elezioni Europee Complete, Strasburgo & Politica a Bruxelles',
    summary:
      'Arrivano le Elezioni Europee quinquennali con le 5 circoscrizioni ufficiali italiane, raccolta 150.000 firme, cartelli elettorali per superare il 4%, Notte Elettorale dedicata e piena vita istituzionale a Strasburgo e Bruxelles: Gruppi Parlamentari UE, voto di fiducia alla Commissione Europea, nomina del Commissario italiano e dossier periodici da Bruxelles.',
    items: [
      {
        tag: 'Nuove Funzioni',
        title: '5 Circoscrizioni Ufficiali, 76 Seggi, Soglia 4% & Cartelli Elettorali',
        detail:
          'Ogni 5 anni (a partire da Giugno 2029) si vota per eleggere i 76 eurodeputati italiani in Nord-Ovest, Nord-Est, Centro, Sud e Isole con sistema proporzionale puro e sbarramento nazionale al 4%. I partiti fuori dal Parlamento devono raccogliere 150.000 firme o unirsi in un Cartello Elettorale Europeo con 1–2 alleati affini per sommare i consensi ed entrare in lista.',
      },
      {
        tag: 'Nuove Funzioni',
        title: 'Campagna Europea, Capilista, Dilemma Leader & Notte Elettorale UE',
        detail:
          'Scegli i profili dei Capilista in ogni circoscrizione, decidi se candidare il Leader in una o tutte le 5 circoscrizioni (affrontando poi il bivio reale tra partire per Bruxelles o restare in Italia), mobilita studenti fuorisede e italiani all’estero e segui lo spoglio europeo in 3 fasi con effetti diretti sul Governo nazionale come voto di medio termine.',
      },
      {
        tag: 'Nuove Funzioni',
        title: 'Gruppi Parlamentari Europei, Voto Commissione UE & Commissario Italiano',
        detail:
          'Con almeno 1 eurodeputato puoi aderire a uno dei Gruppi ufficiali di Strasburgo (PPE, S&D, PfE, ECR, Renew Europe, Verdi/ALE, The Left, ESN o Non Iscritti) e votare la fiducia al Presidente della Commissione Europea. Se sei al Governo in Italia, nomini anche il Commissario Europeo italiano affrontando l’audizione al Parlamento Europeo per conquistare un portafoglio di peso.',
      },
      {
        tag: 'Nuove Funzioni',
        title: 'Dossier da Bruxelles, Contributi Eurodeputati & Margine sulla Manovra',
        detail:
          'Per tutto il quinquennio gli eurodeputati portano visibilità mediatica e contributi reali alla cassa del partito (+€320/sett. per seggio). Inoltre voti periodicamente le grandi Direttive Europee (Patto di Stabilità, Case Green, Dazi e Agricoltura, Difesa Comune, Immigrazione), mentre buoni rapporti con la Commissione e un Commissario italiano autorevole allentano la pressione su Spread e Legge di Bilancio.',
      },
      {
        tag: 'Bilanciamento',
        title: 'Guida Politica & Glossario Europeo Aggiornati + Salvataggi Compatibili',
        detail:
          'La Guida e il Glossario includono ora tutte le regole reali e di simulazione sulle Elezioni Europee, preferenze con alternanza di genere, Gruppi UE, Commissione e Direttive. Tutte le partite già salvate si aggiornano automaticamente senza perdere alcun progresso.',
      },
    ],
  },
  {
    version: '1.1.0',
    date: 'Novembre 2026',
    headline: 'Parlamento Vivo: Bicameralismo, Navetta, Question Time & Franchi Tiratori',
    summary:
      'La scheda Parlamento diventa molto più profonda e interattiva: segui ogni legge tra Commissione, Camera, Senato e Quirinale, intervieni con emendamenti, ostruzionismo, Question Time e mozioni, gestisci il rischio franchi tiratori al voto segreto e partecipa anche da fuori Parlamento con la mobilitazione di piazza.',
    items: [
      {
        tag: 'Nuove Funzioni',
        title: 'Iter Legislativo Visivo & Navetta Parlamentare (Camera ↔ Senato)',
        detail:
          'Ogni DDL, Decreto-Legge e Legge di Bilancio mostra ora il percorso passo-passo (Commissione → Voto Camera → Voto Senato → Promulgazione Quirinale) e l’orientamento reale dei Gruppi Parlamentari (Favorevoli, Indecisi, Astenuti, Contrari). Se un emendamento passa nella seconda Camera o il Quirinale rinvia il testo, scatta la Navetta parlamentare che allunga i tempi e alza la tensione politica.',
      },
      {
        tag: 'Nuove Funzioni',
        title: 'Emendamenti Costruttivi, Ostruzionismo, Question Time & Mozioni/OdG',
        detail:
          'I partiti in Parlamento possono presentare emendamenti costruttivi o fare ostruzionismo sui provvedimenti in Aula, sfidare i Ministri (o rivendicare i risultati del Governo) nel Question Time in diretta TV e presentare Mozioni e Ordini del Giorno su temi divisivi per mettere alla prova maggioranza e rivali.',
      },
      {
        tag: 'Nuove Funzioni',
        title: 'Tensione d’Aula, Voto Segreto & Franchi Tiratori',
        detail:
          'Sui provvedimenti sensibili o quando la coalizione è divisa, il voto segreto può far emergere i franchi tiratori e mandare "sotto" il Governo in Aula, scatenando una tempesta mediatica che richiede un Vertice di Maggioranza per ricompattare gli alleati.',
      },
      {
        tag: 'Nuove Funzioni',
        title: 'Modalità Osservatore Esterno per Partiti Extra-Parlamentari (0 Seggi)',
        detail:
          'Chi non ha seggi resta escluso da voti e atti d’Aula, ma può ora consultare in tempo reale i provvedimenti in discussione in Parlamento e lanciare una Presa di Posizione o Mobilitazione di Piazza a favore o contro una legge, oltre ai Referendum.',
      },
      {
        tag: 'Bilanciamento',
        title: 'Guida Politica Aggiornata & Piena Compatibilità dei Salvataggi',
        detail:
          'La Guida include ora sezioni dedicate a Bicameralismo e Navetta, Emendamenti e Ostruzionismo, Question Time, Mozioni e Franchi Tiratori. Tutti i salvataggi esistenti vengono aggiornati automaticamente senza perdere i progressi.',
      },
    ],
  },
  {
    version: '1.0.1',
    date: 'Novembre 2026',
    headline: 'Bilanciamento Entrate Extra-Parlamentari, Stabilità Post-Voto & Safe-Area Mobile',
    summary:
      'Finanze settimanali più realistiche per partiti con 0 seggi e piccole forze politiche, flusso Notte Elettorale → Quirinale → Nuova Legislatura blindato contro ogni soft-lock e piena compatibilità safe-area su iOS e Android.',
    items: [
      {
        tag: 'Bilanciamento',
        title: 'Ribilanciamento Entrate Settimanali per Partiti Extra-Parlamentari e Piccoli',
        detail:
          'Ridotte le entrate irrealistiche per partiti con 0 seggi: 2×1000 IRPEF, contributi parlamentari e resa dei circoli regionali sono ora legati alla presenza reale in Parlamento, agli iscritti e alle sezioni attive. Il nuovo bilancio si applica automaticamente anche ai salvataggi esistenti.',
      },
      {
        tag: 'Bug Risolti',
        title: 'Stabilizzazione Flusso Post-Elezioni, Quirinale e Nuova Legislatura',
        detail:
          'Blindata la transizione al termine delle 3 fasi della Notte Elettorale in tutti gli scenari (maggioranza al Quirinale, ingresso in Parlamento all’Opposizione, sotto soglia a 0 seggi) con reset completo di timer legislatura, dossier settimanali, atti decaduti e squadra di Governo senza soft-lock.',
      },
      {
        tag: 'Nuove Funzioni',
        title: 'Safe-Area Mobile iOS/Android & Scroll Fluido delle Modali',
        detail:
          'Aggiornate tutte le modali (Changelog, Privacy/Note Legali, Salvataggi, Legge di Bilancio, Quirinale, Duello TV) e la Notte Elettorale con altezza massima 90dvh, scroll interno fluido e margini inferiori env(safe-area-inset-bottom) per evitare sovrapposizioni con le barre di navigazione di iPhone e Android.',
      },
    ],
  },
  {
    version: '1.0.0',
    date: 'Novembre 2026',
    headline: 'Notte Elettorale Immersiva, Bilanciamento Consenso & Fix Dossier',
    summary:
      'Elezioni ridisegnate in 3 fasi con Exit Poll, scrutinio progressivo e rassegna stampa finale; ulteriore freno realistico alla crescita dei sondaggi e navigazione fluida dei dossier settimanali.',
    items: [
      {
        tag: 'Nuove Funzioni',
        title: 'Nuova Notte Elettorale in 3 Fasi',
        detail:
          'Fase 1 (Ore 23:00 · Chiusura Urne & Exit Poll con forchette e affluenza nazionale), Fase 2 (Scrutinio progressivo delle 61.417 sezioni dal 25% al 100% con controlli velocità, Radar Soglia 3% e Testa a Testa), Fase 3 (Risultati definitivi, variazione seggi/sondaggi e Prima Pagina della stampa prima delle Consultazioni al Quirinale).',
      },
      {
        tag: 'Nuove Funzioni',
        title: 'Sezione "Novità & Aggiornamenti" (Changelog)',
        detail:
          'Archivio completo delle modifiche per versione accessibile dal Menu Principale, dal Wizard iniziale e cliccando sul numero di versione, con memoria locale dell’ultima versione letta.',
      },
      {
        tag: 'Bilanciamento',
        title: 'Ulteriore Freno alla Crescita del Consenso (anche su salvataggi esistenti)',
        detail:
          'Ridotti i guadagni base di campagne, dossier, Duelli TV e drift passivi, insieme a un Weekly Cap ancora più rigoroso per partiti piccoli e medi: passare dall’1–2% al 9% richiede ora una legislatura intera di lavoro costante.',
      },
      {
        tag: 'Bug Risolti',
        title: 'Fix Navigazione Coda Dossier Settimanali',
        detail:
          'Cliccando "Avanti / Prossimo Dossier" dopo aver gestito un evento settimanale si passa ora direttamente al dossier successivo in coda senza rimandare alla Rassegna Stampa finché tutti i dossier della settimana non sono stati risolti.',
      },
    ],
  },
  {
    version: '0.9.5',
    date: 'Ottobre 2026',
    headline: 'Regola Ferrea Parlamentare, Emiciclo & Sicurezza Salvataggi',
    summary:
      'Piena coerenza costituzionale tra sondaggi e seggi in carica, distinzione netta delle proiezioni emiciclo e hardening completo dell’importazione JSON.',
    items: [
      {
        tag: 'Nuove Funzioni',
        title: 'Regola Ferrea dello Status Parlamentare',
        detail:
          'I seggi effettivi di Camera (400) e Senato (200) riflettono la legislatura in carica e cambiano solo con le Elezioni Politiche o con scissioni parlamentari reali. Superare il 3% nei sondaggi settimanali non assegna più seggi automatici né sblocca il Parlamento.',
      },
      {
        tag: 'Bug Risolti',
        title: 'Fix Proiezioni Emiciclo vs Parlamento Attuale',
        detail:
          'Separazione chiara tra "Parlamento Attuale (in carica)" e "Proiezione Sondaggi (se si votasse oggi)" nelle schede Plancia ed Elezioni, eliminando sovrapposizioni fuorvianti.',
      },
      {
        tag: 'Nuove Funzioni',
        title: 'Sicurezza Importazione JSON & Sanitizzazione',
        detail:
          'Validazione rigorosa della struttura dei salvataggi importati, whitelist dei campi di GameState, controllo anti-URL malevoli, limiti dimensione file e protezione da valori corrotti o NaN.',
      },
      {
        tag: 'Nuove Funzioni',
        title: 'Informativa Privacy (GDPR), Disclaimer & Fonti Dati',
        detail:
          'Modale dedicata per la trasparenza sui dati locali (100% client-side, zero cookie di tracciamento), fonti ISTAT/Eligendo e pulsante di cancellazione completa dei dati locali.',
      },
    ],
  },
  {
    version: '0.9.0',
    date: 'Settembre 2026',
    headline: 'Rimozione Punti Azione (PA), Economia Ribilanciata & Territorio',
    summary:
      'Superati i Punti Azione artificiali in favore di budget reale e cadenze settimanali naturali; ridisegnati costi delle sezioni regionali e strumenti di sopravvivenza finanziaria.',
    items: [
      {
        tag: 'Bilanciamento',
        title: 'Rimozione definitiva dei Punti Azione (PA)',
        detail:
          'Le azioni settimanali non consumano più PA astratti ma si basano sulla Cassa reale del partito e su cadenze operative realistiche (1 iniziativa per canale di campagna, 1 Duello TV, 1 colloquio/incarico per dirigente a settimana).',
      },
      {
        tag: 'Bilanciamento',
        title: 'Economia di Partito Ribilanciata (L. 13/2014)',
        detail:
          'Entrate fondate su 2×1000 IRPEF, contributi dei parlamentari eletti (+€450/sett. per seggio), tesseramento e raccolta fondi trasparente. Introdotte opzioni a costo zero (Colletta Volontari e Crowdfunding) e salvaguardia anti-blocco in caso di deficit.',
      },
      {
        tag: 'Nuove Funzioni',
        title: 'Rete Territoriale a 3 Livelli sulle 20 Regioni',
        detail:
          'Possibilità di aprire, potenziare, ridimensionare o chiudere Circoli Cittadini (Liv. 1), Sezioni Provinciali (Liv. 2) e Federazioni Regionali (Liv. 3) con bonus su iscritti, consenso locale e raccolta firme.',
      },
      {
        tag: 'Bilanciamento',
        title: 'Identità di Partito e Tratti del Leader con Effetti Reali',
        detail:
          'Ogni orientamento, stile di leadership e tratto personale applica modificatori concreti su TV, social, costi delle sezioni, raccolta fondi, negoziati di coalizione e dossier dedicati.',
      },
    ],
  },
  {
    version: '0.8.0',
    date: 'Agosto 2026',
    headline: 'Istituzioni della Repubblica: Quirinale, Referendum & Duelli TV',
    summary:
      'Introdotti i grandi snodi istituzionali italiani e i confronti diretti in prima serata per un’esperienza completa di gestione della legislatura.',
    items: [
      {
        tag: 'Nuove Funzioni',
        title: 'Elezione del Presidente della Repubblica (Quirinale)',
        detail:
          'Seduta Comune con 658 Grandi Elettori (400 Deputati, 200 Senatori, 58 Delegati Regionali), quorum dei 2/3 nei primi tre scrutini e maggioranza assoluta dal quarto, con trattative bilaterali e candidature personalizzate.',
      },
      {
        tag: 'Nuove Funzioni',
        title: 'Referendum Abrogativi (Art. 75) e Costituzionali (Art. 138)',
        detail:
          'Promozione quesiti, raccolta 500.000 firme, presa di posizione Sì/No/Astensione, quorum del 50%+1 per gli abrogativi e campagna referendaria nazionale.',
      },
      {
        tag: 'Nuove Funzioni',
        title: 'Duelli TV 1 vs 1 in Prima Serata & Scissioni Interne',
        detail:
          'Mini-gioco a 3 round contro i leader avversari con impatto su consenso e gradimento personale, e sistema dinamico di coesione interna con rischio scissione se i dirigenti restano scontenti per 3 settimane.',
      },
    ],
  },
];

export const LATEST_CHANGELOG_VERSION = CHANGELOG_RELEASES[0]?.version ?? APP_VERSION;

export function getLastSeenChangelogVersion(): string | null {
  try {
    return localStorage.getItem(CHANGELOG_SEEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function hasUnreadChangelog(): boolean {
  return getLastSeenChangelogVersion() !== LATEST_CHANGELOG_VERSION;
}

export function markChangelogAsRead(): void {
  try {
    localStorage.setItem(CHANGELOG_SEEN_STORAGE_KEY, LATEST_CHANGELOG_VERSION);
  } catch {
    // localStorage non disponibile
  }
}

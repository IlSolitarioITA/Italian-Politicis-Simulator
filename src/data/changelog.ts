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

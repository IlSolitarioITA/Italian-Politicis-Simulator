import React, { useEffect, useState } from 'react';
import { APP_VERSION } from '../config/appConfig';
import {
  AlertTriangle,
  Database,
  ExternalLink,
  FileText,
  Scale,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';

export type LegalTabId = 'privacy' | 'disclaimer' | 'fonti';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTabId;
  onClose: () => void;
  onClearAllLocalData: () => void;
  onOpenChangelog?: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialTab = 'privacy',
  onClose,
  onClearAllLocalData,
  onOpenChangelog,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTabId>(initialTab);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setConfirmClear(false);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const staticPrivacyUrl = `${import.meta.env.BASE_URL}privacy.html`;

  const tabs: { id: LegalTabId; label: string; icon: React.ReactNode }[] = [
    {
      id: 'privacy',
      label: 'Privacy & Dati (GDPR)',
      icon: <ShieldCheck className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'disclaimer',
      label: 'Disclaimer Politico',
      icon: <Scale className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'fonti',
      label: 'Fonti Dati & Licenze',
      icon: <Database className="w-4 h-4 shrink-0" />,
    },
  ];

  const handleConfirmDelete = () => {
    setConfirmClear(false);
    onClearAllLocalData();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center safe-area-modal-backdrop sm:p-5 overflow-hidden"
    >
      <div className="w-full max-w-3xl max-h-[90dvh] bg-[#111827] border border-slate-700/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <header className="px-4 sm:px-6 py-4 bg-[#0D1322] border-b border-slate-800 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono uppercase tracking-wider text-cyan-400">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Informativa, Trasparenza &amp; Conformità ·</span>
              {onOpenChangelog ? (
                <button
                  type="button"
                  onClick={onOpenChangelog}
                  title="Apri Novità & Aggiornamenti"
                  className="text-amber-300 hover:text-amber-200 underline underline-offset-2 cursor-pointer"
                >
                  v{APP_VERSION}
                </button>
              ) : (
                <span>v{APP_VERSION}</span>
              )}
            </div>
            <h2
              id="legal-modal-title"
              className="text-base sm:text-lg font-bold text-slate-50 leading-snug"
            >
              Privacy, Note Legali &amp; Dati
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi finestra note legali"
            className="p-2 rounded-lg bg-[#111827] hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* 3 Clear Section Tabs */}
        <div
          role="tablist"
          aria-label="Sezioni informative"
          className="px-4 sm:px-6 pt-3 pb-2 bg-[#0B101D] border-b border-slate-800/90 flex flex-wrap gap-2 shrink-0"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setActiveTab(tab.id);
                  setConfirmClear(false);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer whitespace-normal text-left ${
                  active
                    ? 'bg-cyan-500/15 border-cyan-400/70 text-cyan-200'
                    : 'bg-[#111827] hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto war-scroll px-4 sm:px-6 py-5 space-y-4 text-xs sm:text-[13px] text-slate-300 leading-relaxed">
          {activeTab === 'privacy' && (
            <>
              <section className="p-4 rounded-xl bg-[#090D16] border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Architettura 100% Locale — Zero Raccolta di Dati Personali</span>
                </div>
                <p>
                  <strong className="text-slate-100">Italian Politics Simulator</strong> funziona{' '}
                  <strong className="text-slate-100">interamente in locale</strong> sul browser o
                  sul dispositivo dell’utente (Web, PWA e app Android). L’applicazione non richiede
                  registrazione, account, indirizzo email o credenziali e{' '}
                  <strong className="text-slate-100">
                    non raccoglie, non trasmette e non conserva dati personali su server esterni
                  </strong>
                  .
                </p>
              </section>

              <section className="p-4 rounded-xl bg-[#090D16] border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-slate-100">
                  1. Archiviazione Tecnica Locale (localStorage)
                </h3>
                <p>
                  Ai sensi del Regolamento (UE) 2016/679 (<strong>GDPR</strong>) e della normativa
                  ePrivacy, l’applicazione utilizza esclusivamente lo spazio di archiviazione locale
                  del dispositivo (<code className="font-mono text-cyan-300">localStorage</code>)
                  per finalità strettamente tecniche e necessarie al funzionamento del gioco:
                </p>
                <ul className="space-y-1.5 list-disc pl-5 text-slate-300">
                  <li>
                    Salvataggio automatico delle campagne di gioco nei 3 slot indipendenti (inclusi
                    nomi di fantasia del partito/leader e stemmi eventualmente caricati in locale).
                  </li>
                  <li>
                    Preferenze tecniche dell’interfaccia (stato audio muto/attivo e chiusura dei
                    banner informativi di installazione).
                  </li>
                  <li>
                    Esportazione e importazione volontaria dei salvataggi in formato{' '}
                    <code className="font-mono text-cyan-300">.json</code>: tali file restano
                    esclusivamente sotto il controllo diretto dell’utente.
                  </li>
                </ul>
              </section>

              <section className="p-4 rounded-xl bg-[#090D16] border border-slate-800 space-y-2.5">
                <h3 className="text-sm font-bold text-slate-100">
                  2. Assenza di Cookie di Tracciamento e Profilazione
                </h3>
                <p>
                  Questa applicazione <strong className="text-slate-100">non utilizza cookie</strong>{' '}
                  di profilazione, cookie pubblicitari, pixel di tracciamento né SDK di analytics o
                  telemetria comportamentale di terze parti. Nessun dato sulle partite o sulle
                  scelte politiche simulate viene mai profilato o condiviso con terzi.
                </p>
                <p className="text-slate-400 text-xs">
                  Nota tecnica: la verifica opzionale di eventuali nuovi aggiornamenti dell’app
                  consulta unicamente metadati pubblici di rilascio, senza inviare identificativi
                  personali o dati di gioco.
                </p>
              </section>

              <section className="p-4 rounded-xl bg-[#090D16] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-slate-100">
                    Versione Web Statica dell’Informativa Privacy
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Documento pubblico autonomo (utile anche per consultazione esterna e Store).
                  </div>
                </div>
                <a
                  href={staticPrivacyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg bg-[#111827] hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shrink-0"
                >
                  <span>Apri privacy.html</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </section>

              {/* GDPR Art. 17 Local Data Erasure Control */}
              <section className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm font-bold text-rose-200">
                      Elimina tutti i dati locali (Art. 17 GDPR)
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Puoi cancellare in qualsiasi momento e in modo definitivo tutti i salvataggi
                      (Slot 1, 2 e 3), le preferenze audio e le chiavi tecniche memorizzate da
                      Italian Politics Simulator in questo browser/dispositivo. L’operazione è
                      irreversibile (esporta prima eventuali file JSON di backup).
                    </p>
                  </div>
                </div>

                {!confirmClear ? (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="px-4 py-2.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/35 border border-rose-500/55 text-rose-200 text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span>Elimina tutti i dati locali</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-lg bg-[#090D16] border border-rose-500/60 space-y-2.5">
                    <p className="text-xs font-semibold text-rose-200">
                      Confermi di voler eliminare definitivamente tutti i 3 slot di salvataggio e le
                      impostazioni locali dell’app? Questa azione non può essere annullata.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmDelete}
                        className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Sì, elimina definitivamente tutto</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClear(false)}
                        className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors"
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}

          {activeTab === 'disclaimer' && (
            <>
              <section className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                  <Scale className="w-4 h-4 shrink-0" />
                  <span>Simulatore Indipendente, Apartitico e a Scopo Ludico/Educativo</span>
                </div>
                <p>
                  <strong className="text-slate-100">Italian Politics Simulator</strong> è
                  un’opera software indipendente, apartitica e priva di qualsiasi finalità di
                  propaganda politica o elettorale. È sviluppata esclusivamente a scopo{' '}
                  <strong className="text-slate-100">
                    ludico, strategico e di divulgazione civica
                  </strong>{' '}
                  per illustrare i meccanismi costituzionali, parlamentari, elettorali e di bilancio
                  della Repubblica Italiana.
                </p>
              </section>

              <section className="p-4 rounded-xl bg-[#090D16] border border-slate-800 space-y-2.5">
                <h3 className="text-sm font-bold text-slate-100">
                  1. Clausola di Non-Affiliazione Istituzionale e Politica
                </h3>
                <p>
                  Questo simulatore <strong className="text-slate-100">non è affiliato</strong>,
                  sponsorizzato, approvato né collegato in alcun modo ad alcun partito politico,
                  movimento, coalizione, comitato elettorale, leader o esponente pubblico, né a
                  istituzioni della Repubblica Italiana o dell’Unione Europea (tra cui Parlamento,
                  Presidenza della Repubblica, Presidenza del Consiglio dei Ministri, Ministero
                  dell’Interno, ISTAT o Corte Costituzionale).
                </p>
              </section>

              <section className="p-4 rounded-xl bg-[#090D16] border border-slate-800 space-y-2.5">
                <h3 className="text-sm font-bold text-slate-100">
                  2. Natura Fittizia e Algoritmica di Eventi, Scandali ed Esiti
                </h3>
                <p>
                  Tutti i dossier settimanali, le crisi politiche ed economiche, gli scandali, le
                  inchieste parlamentari, i dibattiti televisivi, le scissioni, gli andamenti dei
                  sondaggi, i risultati elettorali e i referendum generati durante il gioco sono{' '}
                  <strong className="text-slate-100">
                    interamente fittizi, procedurali e calcolati tramite algoritmi matematici
                  </strong>
                  .
                </p>
                <p>
                  Tali scenari simulati non rappresentano fatti reali, accuse, giudizi di valore,
                  orientamenti editoriali né previsioni elettorali reali. I nomi di partiti, cariche
                  o figure pubbliche eventualmente presenti negli scenari di partenza sono utilizzati
                  esclusivamente per realismo narrativo e contesto educativo, nel pieno rispetto del
                  diritto di satira, critica e simulazione civica.
                </p>
              </section>

              <section className="p-4 rounded-xl bg-[#090D16] border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-slate-100">
                  3. Limitazione di Responsabilità
                </h3>
                <p className="text-slate-400">
                  Il software è fornito “così com’è” (<em>as-is</em>) per puro intrattenimento e
                  studio delle dinamiche istituzionali. Le formule di riparto seggi, bilanci e
                  sondaggi costituiscono una semplificazione modellistica a fini di gioco e non
                  sostituiscono fonti giuridiche o statistiche ufficiali.
                </p>
              </section>
            </>
          )}

          {activeTab === 'fonti' && (
            <>
              <section className="p-4 rounded-xl bg-[#090D16] border border-cyan-500/30 space-y-2.5">
                <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm">
                  <Database className="w-4 h-4 shrink-0" />
                  <span>Attribuzione Dati Pubblici Open Data</span>
                </div>
                <p>
                  Il simulatore integra riferimenti geografici, demografici ed elettorali ispirati a
                  dataset pubblici aperti rilasciati dalle amministrazioni italiane:
                </p>
              </section>

              <section className="p-4 rounded-xl bg-[#090D16] border border-slate-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-100">
                    ISTAT — Confini Amministrativi e Dati Demografici
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/35 text-[10px] font-mono text-cyan-300">
                    CC BY 4.0
                  </span>
                </div>
                <p>
                  I confini territoriali delle 20 Regioni italiane utilizzati per la mappa
                  interattiva SVG e i pesi demografici regionali derivano dalle basi territoriali e
                  dai dati aperti pubblicati dall’
                  <strong className="text-slate-100">
                    Istituto Nazionale di Statistica (ISTAT)
                  </strong>
                  , rilasciati con licenza{' '}
                  <strong className="text-slate-100">
                    Creative Commons Attribuzione 4.0 Internazionale (CC BY 4.0)
                  </strong>
                  .
                </p>
                <p className="text-[11px] text-slate-400">
                  Le geometrie sono state semplificate e adattate graficamente per la resa
                  interattiva nel simulatore. ISTAT non è responsabile delle elaborazioni né degli
                  esiti simulati.
                </p>
              </section>

              <section className="p-4 rounded-xl bg-[#090D16] border border-slate-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-100">
                    Ministero dell’Interno — Eligendo (Dati Elettorali Open Data)
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/35 text-[10px] font-mono text-amber-300">
                    Open Data / IODL 2.0
                  </span>
                </div>
                <p>
                  I riferimenti alla struttura elettorale italiana (riparto dei 400 seggi alla
                  Camera, 200 al Senato, 76 al Parlamento Europeo, soglie di sbarramento e macro-aree
                  territoriali) fanno riferimento ai dati elettorali aperti e alla documentazione
                  pubblica del portale{' '}
                  <strong className="text-slate-100">
                    Eligendo — Ministero dell’Interno (Dipartimento per gli Affari Interni e
                    Territoriali)
                  </strong>
                  .
                </p>
                <p className="text-[11px] text-slate-400">
                  Tutti i sondaggi di partenza e le proiezioni successive nel gioco sono elaborazioni
                  simulazioni indipendenti a scopo ludico e non costituiscono dati ufficiali del
                  Ministero dell’Interno.
                </p>
              </section>

              <section className="p-4 rounded-xl bg-[#090D16] border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Riferimenti Normativi &amp; Componenti Open Source
                </h3>
                <ul className="space-y-1.5 list-disc pl-5 text-slate-300">
                  <li>
                    <strong className="text-slate-100">Fonti Costituzionali e Legislative:</strong>{' '}
                    Costituzione della Repubblica Italiana (Artt. 70, 75, 77, 81, 82, 83, 92, 94,
                    138), Legge 3 novembre 2017 n. 165 (<em>Rosatellum</em>), Legge 21 febbraio 2014
                    n. 13 (finanziamento trasparente e 2×1000).
                  </li>
                  <li>
                    <strong className="text-slate-100">Librerie Open Source:</strong> React,
                    Tailwind CSS, Lucide Icons (licenza ISC/MIT).
                  </li>
                </ul>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="px-4 sm:px-6 pt-3 safe-area-modal-footer bg-[#0D1322] border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] text-slate-400">
            Italian Politics Simulator · Progetto indipendente &amp; 100% locale
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-xs cursor-pointer transition-colors"
          >
            Chiudi
          </button>
        </footer>
      </div>
    </div>
  );
};

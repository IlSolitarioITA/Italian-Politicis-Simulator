import React, { useRef, useState } from 'react';
import { APP_VERSION } from '../config/appConfig';
import { GameState, SaveSlotSummary } from '../types/game';
import {
  SaveSlotIndex,
  exportSlotToJson,
  parseImportedGameJson,
} from '../utils/saveManager';
import { PartyEmblem } from './PartyEmblem';
import {
  ArrowLeft,
  Download,
  Landmark,
  Play,
  PlusCircle,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';

interface SavedGamesViewProps {
  slots: SaveSlotSummary[];
  activeSlot: SaveSlotIndex;
  hasActiveSessionInMemory: boolean;
  onResumeSlot: (slot: SaveSlotIndex) => void;
  onCreateInSlot: (slot: SaveSlotIndex) => void;
  onDeleteSlot: (slot: SaveSlotIndex) => void;
  onImportIntoSlot: (slot: SaveSlotIndex, imported: GameState) => void;
  onReturnToActiveGame?: () => void;
}

function formatSavedTimestamp(iso?: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('it-IT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export const SavedGamesView: React.FC<SavedGamesViewProps> = ({
  slots,
  activeSlot,
  hasActiveSessionInMemory,
  onResumeSlot,
  onCreateInSlot,
  onDeleteSlot,
  onImportIntoSlot,
  onReturnToActiveGame,
}) => {
  const [confirmDeleteSlot, setConfirmDeleteSlot] = useState<SaveSlotIndex | null>(null);
  const [importTargetSlot, setImportTargetSlot] = useState<SaveSlotIndex>(activeSlot);
  const [feedback, setFeedback] = useState<{ text: string; tone: 'success' | 'error' } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const triggerImportForSlot = (slot: SaveSlotIndex) => {
    setImportTargetSlot(slot);
    fileInputRef.current?.click();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const res = parseImportedGameJson(reader.result);
        if (res.state) {
          setFeedback(null);
          onImportIntoSlot(importTargetSlot, res.state);
        } else {
          setFeedback({
            text: res.error ?? 'File JSON non valido.',
            tone: 'error',
          });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const occupiedCount = slots.filter((s) => !s.empty).length;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden war-scroll bg-[#090D16] text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="px-4 lg:px-6 py-3 lg:py-0 lg:h-16 border-b border-slate-800/80 bg-[#0D1322] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-md bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <Landmark className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-sm sm:text-base lg:text-lg font-bold tracking-tight text-slate-50 truncate">
              PALAZZO CHIGI // WAR ROOM
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              v{APP_VERSION} · Italia Novembre 2026 · 3 Sessioni Indipendenti
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportJson}
            className="hidden"
          />
          {hasActiveSessionInMemory && onReturnToActiveGame && (
            <button
              type="button"
              onClick={onReturnToActiveGame}
              className="px-3 py-1.5 sm:py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span>Torna alla Partita Attiva</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              const firstEmpty = slots.find((s) => s.empty)?.slotIndex ?? activeSlot;
              triggerImportForSlot(firstEmpty);
            }}
            className="px-3 py-1.5 sm:py-2 rounded-lg bg-[#111827] hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Importa JSON</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-cyan-400">Archivio Locale Multi-Sessione</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 mt-1">
              Le Mie Partite
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Gestisci fino a 3 campagne politiche indipendenti salvate automaticamente in locale. Puoi passare liberamente da uno slot all’altro senza perdere alcun progresso.
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-400 shrink-0">
            Slot occupati:{' '}
            <span className="text-slate-100 font-semibold">{occupiedCount}/3</span>
          </div>
        </div>

        {feedback && (
          <div
            className={`px-4 py-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
              feedback.tone === 'error'
                ? 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="underline shrink-0 cursor-pointer"
            >
              Chiudi
            </button>
          </div>
        )}

        {/* 3 Independent Slot Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {slots.map((slot) => {
            const isCurrentActive = !slot.empty && slot.slotIndex === activeSlot;
            const confirmingDelete = confirmDeleteSlot === slot.slotIndex;

            if (slot.empty) {
              return (
                <section
                  key={slot.slotIndex}
                  className="bg-[#111827]/70 border border-dashed border-slate-700/90 rounded-xl p-5 flex flex-col justify-between min-h-[280px] gap-5"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>SLOT {slot.slotIndex}</span>
                      <span>Disponibile</span>
                    </div>
                    <h2 className="text-base font-bold text-slate-200 mt-2">
                      Sessione Libera
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Fonda un nuovo partito da zero, guida uno degli 8 partiti italiani reali 2026 oppure affronta la crisi di governo lampo.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => onCreateInSlot(slot.slotIndex)}
                      className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <PlusCircle className="w-4 h-4 shrink-0" />
                      <span>Nuova Partita in questo Slot</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => triggerImportForSlot(slot.slotIndex)}
                      className="w-full py-2 px-3 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Importa JSON nello Slot {slot.slotIndex}</span>
                    </button>
                  </div>
                </section>
              );
            }

            return (
              <section
                key={slot.slotIndex}
                className={`bg-[#111827] border rounded-xl p-5 flex flex-col justify-between min-h-[280px] gap-4 transition-colors ${
                  isCurrentActive ? 'border-cyan-500/75' : 'border-slate-800/90'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Slot Top Meta */}
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                    <span className="text-slate-400">
                      SLOT {slot.slotIndex}
                      {isCurrentActive && (
                        <span className="text-cyan-400 font-semibold"> · Ultimo attivo</span>
                      )}
                    </span>
                    <span className="text-slate-500 truncate">
                      {formatSavedTimestamp(slot.savedAt)}
                    </span>
                  </div>

                  {/* Party Identity */}
                  <div className="flex items-center gap-3 min-w-0">
                    <PartyEmblem
                      emblem={slot.partyEmblem ?? 'stella'}
                      color={slot.partyColor ?? '#06B6D4'}
                      customUrl={slot.customEmblemUrl}
                      size={44}
                    />
                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-slate-50 truncate">
                        {slot.partyName}{' '}
                        <span className="text-xs font-mono font-normal text-slate-400">
                          ({slot.partyAcronym})
                        </span>
                      </h2>
                      <div className="text-xs text-slate-400 truncate mt-0.5">
                        Leader: <span className="text-slate-200">{slot.leaderName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Key Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                    <div className="p-2 rounded-lg bg-[#090D16] border border-slate-800/80">
                      <div className="text-[10px] text-slate-400">Consenso</div>
                      <div
                        style={{ color: slot.partyColor ?? '#22D3EE' }}
                        className="font-mono text-sm font-bold tabular-nums mt-0.5"
                      >
                        {(slot.nationalPoll ?? 0).toFixed(1)}%
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-[#090D16] border border-slate-800/80">
                      <div className="text-[10px] text-slate-400">Cassa</div>
                      <div className="font-mono text-xs font-semibold tabular-nums text-amber-400 mt-1 truncate">
                        €{(slot.budget ?? 0).toLocaleString('it-IT')}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-[#090D16] border border-slate-800/80">
                      <div className="text-[10px] text-slate-400">Data</div>
                      <div className="font-mono text-[11px] font-semibold tabular-nums text-slate-200 mt-1 truncate">
                        {slot.dateLabel}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => onResumeSlot(slot.slotIndex)}
                    className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                    <span>Riprendi</span>
                  </button>

                  {confirmingDelete ? (
                    <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/45 space-y-2">
                      <div className="text-[11px] text-rose-200 text-center">
                        Eliminare definitivamente lo Slot {slot.slotIndex}?
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteSlot(slot.slotIndex);
                            setConfirmDeleteSlot(null);
                            setFeedback({
                              text: `Slot ${slot.slotIndex} eliminato.`,
                              tone: 'success',
                            });
                          }}
                          className="py-1.5 px-2.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold cursor-pointer"
                        >
                          Conferma Elimina
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteSlot(null)}
                          className="py-1.5 px-2.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium cursor-pointer"
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const ok = exportSlotToJson(slot.slotIndex);
                          if (ok) {
                            setFeedback({
                              text: `Slot ${slot.slotIndex} esportato in formato .json.`,
                              tone: 'success',
                            });
                          }
                        }}
                        className="py-2 px-2.5 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700/80 text-[11px] font-medium text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Esporta JSON</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmDeleteSlot(slot.slotIndex)}
                        className="py-2 px-2.5 rounded-lg bg-[#090D16] hover:bg-rose-950/50 border border-slate-800 hover:border-rose-500/45 text-[11px] font-medium text-slate-300 hover:text-rose-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Elimina</span>
                      </button>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        {/* Persistence Security Note */}
        <footer className="p-4 rounded-xl bg-[#111827]/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Persistenza 100% locale con migrazione automatica dello schema: le partite salvate restano protette anche dopo gli aggiornamenti dell’app.
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-500 shrink-0">
            Archivio: palazzo_chigi_saves_v1
          </span>
        </footer>
      </main>
    </div>
  );
};

import React, { useRef, useState } from 'react';
import { APP_VERSION } from '../config/appConfig';
import { GameState, SaveSlotSummary } from '../types/game';
import {
  SaveSlotIndex,
  exportGameToJson,
  exportSlotToJson,
  parseImportedGameJson,
  validateJsonFileBeforeRead,
} from '../utils/saveManager';
import { Download, History, LayoutGrid, Save, Trash2, Upload, X } from 'lucide-react';

interface SaveLoadModalProps {
  state: GameState;
  activeSlot: SaveSlotIndex;
  slots: SaveSlotSummary[];
  onClose: () => void;
  onSaveToSlot: (slot: SaveSlotIndex) => void;
  onLoadFromSlot: (slot: SaveSlotIndex) => void;
  onDeleteSlot: (slot: SaveSlotIndex) => void;
  onImportGame: (imported: GameState) => void;
  onReturnToMenu: () => void;
  onOpenChangelog?: () => void;
  hasUnreadChangelog?: boolean;
}

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
  state,
  activeSlot,
  slots,
  onClose,
  onSaveToSlot,
  onLoadFromSlot,
  onDeleteSlot,
  onImportGame,
  onReturnToMenu,
  onOpenChangelog,
  hasUnreadChangelog = false,
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SaveSlotIndex | null>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preCheck = validateJsonFileBeforeRead(file);
    if (!preCheck.ok) {
      setStatusMsg(null);
      setErrorMsg(preCheck.error);
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => {
      setStatusMsg(null);
      setErrorMsg('Impossibile leggere il file selezionato. Il salvataggio attuale non è stato modificato.');
    };
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setStatusMsg(null);
        setErrorMsg('Contenuto del file non leggibile come testo JSON.');
        return;
      }
      const res = parseImportedGameJson(reader.result);
      if (res.state) {
        setErrorMsg(null);
        onImportGame(res.state);
        onClose();
      } else {
        setStatusMsg(null);
        setErrorMsg(res.error ?? 'File di salvataggio non valido o corrotto.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center safe-area-modal-backdrop sm:p-4 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Gestione Salvataggi"
    >
      <div className="w-full max-w-xl bg-[#111827] border border-slate-700/90 rounded-xl overflow-hidden shadow-2xl max-h-[90dvh] flex flex-col">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-50">
              Gestione Salvataggi (3 Slot) e Archivio JSON
            </h2>
            <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Salvataggio automatico continuo attivo sullo Slot {activeSlot}</span>
              {onOpenChangelog && (
                <>
                  <span aria-hidden="true" className="text-slate-600">
                    ·
                  </span>
                  <button
                    type="button"
                    onClick={onOpenChangelog}
                    className="inline-flex items-center gap-1 font-mono text-amber-300 hover:text-amber-200 underline underline-offset-2 cursor-pointer"
                  >
                    <History className="w-3 h-3 shrink-0" />
                    <span>v{APP_VERSION} · Novità</span>
                    {hasUnreadChangelog && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            aria-label="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto war-scroll safe-area-scroll-bottom">
          {statusMsg && (
            <div className="px-3.5 py-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300">
              {statusMsg}
            </div>
          )}
          {errorMsg && (
            <div className="px-3.5 py-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* 3 LocalStorage Slots */}
          <div className="space-y-2.5">
            {slots.map((slot) => (
              <div
                key={slot.slotIndex}
                className={`p-3.5 rounded-lg border space-y-2.5 ${
                  activeSlot === slot.slotIndex
                    ? 'bg-[#090D16] border-cyan-500/50'
                    : 'bg-[#090D16]/70 border-slate-800'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
                      <span>Slot {slot.slotIndex}</span>
                      {activeSlot === slot.slotIndex && (
                        <span className="text-[11px] font-mono text-cyan-400">· Attivo</span>
                      )}
                    </div>
                    {slot.empty ? (
                      <div className="text-xs text-slate-500 mt-0.5">Slot vuoto</div>
                    ) : (
                      <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="text-slate-200 font-medium">{slot.partyName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums text-cyan-400">
                          {(slot.nationalPoll ?? 0).toFixed(1)}%
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{slot.dateLabel}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onSaveToSlot(slot.slotIndex);
                        setStatusMsg(`Partita salvata nello Slot ${slot.slotIndex}.`);
                      }}
                      className="px-2.5 py-1.5 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-xs font-medium text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Salva
                    </button>
                    {!slot.empty && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onLoadFromSlot(slot.slotIndex);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
                        >
                          Riprendi
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (exportSlotToJson(slot.slotIndex)) {
                              setStatusMsg(`Slot ${slot.slotIndex} esportato in .json.`);
                            }
                          }}
                          className="p-1.5 rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-800 cursor-pointer"
                          aria-label={`Esporta JSON slot ${slot.slotIndex}`}
                          title="Esporta JSON"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(slot.slotIndex)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                          aria-label={`Elimina slot ${slot.slotIndex}`}
                          title="Elimina slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {confirmDelete === slot.slotIndex && (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                    <span className="text-rose-300">
                      Confermi l’eliminazione dello Slot {slot.slotIndex}?
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteSlot(slot.slotIndex);
                          setConfirmDelete(null);
                          setStatusMsg(`Slot ${slot.slotIndex} svuotato.`);
                        }}
                        className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer"
                      >
                        Elimina
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(null)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* JSON Export / Import + Return to Le Mie Partite */}
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImport}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => {
                  exportGameToJson(state);
                  setStatusMsg('File .json esportato correttamente.');
                }}
                className="px-3 py-2 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-100 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                Esporta (.json)
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="px-3 py-2 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-100 flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                Importa (.json)
              </button>
            </div>

            <button
              type="button"
              onClick={onReturnToMenu}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-cyan-300 flex items-center gap-1.5 cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Le Mie Partite
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

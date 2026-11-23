import React, { useRef, useState } from 'react';
import {
  EMBLEM_OPTIONS,
  EXISTING_PARTIES_2026,
  LEADER_TRAITS,
  LEADERSHIP_STYLES,
  ORIENTATIONS,
  PARTY_COLOR_PALETTE,
} from '../data/presets';
import {
  GameMode,
  GameState,
  LeaderTraitId,
  NewPartyDraft,
  SaveSlotSummary,
} from '../types/game';
import { PartyEmblem } from './PartyEmblem';
import { SaveSlotIndex, parseImportedGameJson } from '../utils/saveManager';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  FolderOpen,
  Landmark,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react';

interface SetupWizardProps {
  targetSlot: SaveSlotIndex;
  saveSlots: SaveSlotSummary[];
  onStartNewGame: (params: {
    mode: GameMode;
    existingPartyId?: string;
    newPartyDraft?: NewPartyDraft;
  }) => void;
  onLoadSlot: (slot: SaveSlotIndex) => void;
  onImportGame: (state: GameState) => void;
  onBackToSavedGames: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({
  targetSlot,
  saveSlots,
  onStartNewGame,
  onLoadSlot,
  onImportGame,
  onBackToSavedGames,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('existing_party');
  const [selectedExistingId, setSelectedExistingId] = useState<string>('fdi');
  const [crisisPartyId, setCrisisPartyId] = useState<string>('pd');
  const [importError, setImportError] = useState<string | null>(null);
  const [showSavesDrawer, setShowSavesDrawer] = useState(false);

  const emblemFileRef = useRef<HTMLInputElement | null>(null);
  const jsonFileRef = useRef<HTMLInputElement | null>(null);

  const [draft, setDraft] = useState<NewPartyDraft>({
    name: 'Nuova Repubblica',
    acronym: 'NR',
    color: '#06B6D4',
    emblem: 'stella',
    orientation: 'riformista',
    origin: 'established',
    leaderName: 'Andrea Valeri',
    leaderAge: 43,
    leaderStyle: 'carismatico',
    traits: ['oratore_tv', 'economista'],
  });

  const hasSavedGames = saveSlots.some((s) => !s.empty);

  const handleToggleTrait = (traitId: LeaderTraitId) => {
    setDraft((prev) => {
      if (prev.traits.includes(traitId)) {
        return prev;
      }
      return {
        ...prev,
        traits: [prev.traits[1], traitId],
      };
    });
  };

  const handleUploadEmblem = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_200_000) {
      setImportError('L’immagine del simbolo deve pesare meno di 1,2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDraft((prev) => ({ ...prev, customEmblemUrl: reader.result as string }));
        setImportError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const res = parseImportedGameJson(reader.result);
        if (res.state) {
          setImportError(null);
          onImportGame(res.state);
        } else {
          setImportError(res.error ?? 'Errore durante l’importazione.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const selectedOrientation =
    ORIENTATIONS.find((o) => o.id === draft.orientation) ?? ORIENTATIONS[0];
  const selectedExistingPreset =
    EXISTING_PARTIES_2026.find((p) => p.id === selectedExistingId) ?? EXISTING_PARTIES_2026[0];
  const selectedCrisisPreset =
    EXISTING_PARTIES_2026.find((p) => p.id === crisisPartyId) ?? EXISTING_PARTIES_2026[1];

  const handleLaunch = () => {
    if (selectedMode === 'new_party') {
      onStartNewGame({ mode: 'new_party', newPartyDraft: draft });
    } else if (selectedMode === 'existing_party') {
      onStartNewGame({ mode: 'existing_party', existingPartyId: selectedExistingId });
    } else {
      onStartNewGame({ mode: 'government_crisis', existingPartyId: crisisPartyId });
    }
  };

  return (
    <div className="flex-1 min-h-0 w-full overflow-x-hidden lg:overflow-hidden bg-[#090D16] text-slate-100 flex flex-col">
      {/* Responsive Top Bar */}
      <header className="px-4 lg:px-6 py-3 lg:py-0 lg:h-16 border-b border-slate-800/80 bg-[#0D1322] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBackToSavedGames}
            className="px-2.5 py-1.5 rounded-lg bg-[#111827] hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Le Mie Partite</span>
          </button>
          <div className="w-8 h-8 rounded-md bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <Landmark className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="font-display text-sm sm:text-base font-bold tracking-tight text-slate-50 truncate block">
              <span className="sm:hidden">IPS · Simulator</span>
              <span className="hidden sm:inline">Italian Politics Simulator</span>
            </span>
            <span className="text-[11px] font-mono text-cyan-400 block">
              Nuova Partita · Slot {targetSlot}
            </span>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-3 text-xs text-slate-400 whitespace-nowrap">
          <span>Italia · Novembre 2026</span>
          <span aria-hidden="true">·</span>
          <span>Simulatore Politico Reale a 20 Regioni</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            ref={jsonFileRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportJsonFile}
            className="hidden"
          />
          {hasSavedGames && (
            <button
              type="button"
              onClick={() => setShowSavesDrawer((v) => !v)}
              className="px-3 py-1.5 sm:py-2 text-xs font-medium text-slate-200 bg-[#111827] hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Carica</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => jsonFileRef.current?.click()}
            className="px-3 py-1.5 sm:py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#111827] hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Importa JSON</span>
          </button>
        </div>
      </header>

      {/* Optional Saved Games Bar */}
      {showSavesDrawer && (
        <div className="px-4 lg:px-6 py-3 bg-[#111827] border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs font-medium text-slate-300">
            Seleziona uno slot salvato in memoria locale:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {saveSlots.map((slot) => (
              <button
                key={slot.slotIndex}
                type="button"
                disabled={slot.empty}
                onClick={() => onLoadSlot(slot.slotIndex)}
                className={`px-3 py-2 rounded-lg border text-left transition-colors text-xs ${
                  slot.empty
                    ? 'border-slate-800/80 bg-[#090D16]/50 text-slate-600 cursor-not-allowed'
                    : 'border-slate-700 bg-[#090D16] hover:border-cyan-500/60 text-slate-200 cursor-pointer'
                }`}
              >
                <div className="font-semibold flex items-center justify-between gap-2">
                  <span>Slot {slot.slotIndex}</span>
                  {!slot.empty && (
                    <span className="font-mono tabular-nums text-cyan-400">
                      {slot.nationalPoll?.toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {slot.empty ? 'Vuoto' : `${slot.partyName} · ${slot.dateLabel}`}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {importError && (
        <div className="px-4 lg:px-6 py-2.5 bg-rose-950/50 border-b border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3 shrink-0">
          <span>{importError}</span>
          <button
            type="button"
            onClick={() => setImportError(null)}
            className="text-rose-300 hover:text-white underline cursor-pointer shrink-0"
          >
            Chiudi
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row lg:overflow-hidden">
        {/* Left Rail: 3 Playable Modes */}
        <aside className="w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-[#0B101D] p-4 sm:p-5 flex flex-col gap-4 shrink-0 lg:overflow-y-auto war-scroll">
          <div>
            <p className="text-xs font-medium text-cyan-400">Configurazione Partita</p>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-50 mt-1 leading-tight">
              Scegli lo scenario politico
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Quadro politico italiano reale di novembre 2026: sondaggi, sedi regionali, crisi settimanali e notte elettorale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedMode('existing_party')}
              className={`p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
                selectedMode === 'existing_party'
                  ? 'bg-[#111827] border-amber-500/70 shadow-sm'
                  : 'bg-[#090D16]/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display font-semibold text-sm text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Guida un Partito Reale</span>
                </span>
                <span className="text-[11px] font-mono text-amber-400 shrink-0">8 partiti</span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                FdI, PD, M5S, Forza Italia, Lega, AVS, Azione o Italia Viva con leader, sondaggi e coalizioni reali 2026.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode('new_party')}
              className={`p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
                selectedMode === 'new_party'
                  ? 'bg-[#111827] border-cyan-500/70 shadow-sm'
                  : 'bg-[#090D16]/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display font-semibold text-sm text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Fonda un Nuovo Partito</span>
                </span>
                <span className="text-[11px] font-mono text-cyan-400 shrink-0">Da zero</span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Crea simbolo, orientamento, profilo del leader e 2 tratti unici. Comitato Promotore (4 sett.) o già costituito.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode('government_crisis')}
              className={`p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
                selectedMode === 'government_crisis'
                  ? 'bg-[#111827] border-rose-500/70 shadow-sm'
                  : 'bg-[#090D16]/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display font-semibold text-sm text-slate-100 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Scenario Crisi di Governo</span>
                </span>
                <span className="text-[11px] font-mono text-rose-400 shrink-0">8 sett.</span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Il governo cade sulla Manovra 2027. Camere sciolte: 8 settimane di campagna lampo verso il voto anticipato.
              </p>
            </button>
          </div>

          <div className="lg:mt-auto pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleLaunch}
              className="w-full py-3 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Entra nella War Room</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Right Detail Panel */}
        <main className="flex-1 min-h-0 lg:overflow-y-auto war-scroll p-4 sm:p-6">
          {selectedMode === 'new_party' && (
            <div className="max-w-5xl mx-auto space-y-5">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <section className="xl:col-span-7 bg-[#111827] border border-slate-800/90 rounded-xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-slate-100">
                      Identità e Simbolo del Partito
                    </h2>
                    <div className="flex items-center gap-2 shrink-0">
                      <PartyEmblem
                        emblem={draft.emblem}
                        color={draft.color}
                        customUrl={draft.customEmblemUrl}
                        size={36}
                      />
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-100 leading-tight max-w-[120px] truncate">
                          {draft.name || 'Nuovo Partito'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {draft.acronym || 'NP'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-slate-400 mb-1.5">
                        Nome del Partito
                      </label>
                      <input
                        type="text"
                        maxLength={32}
                        value={draft.name}
                        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-[#090D16] border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                        placeholder="Es. Nuova Repubblica"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Sigla (max 5)</label>
                      <input
                        type="text"
                        maxLength={5}
                        value={draft.acronym}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, acronym: e.target.value.toUpperCase() }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[#090D16] border border-slate-700/80 text-sm font-mono uppercase text-slate-100 focus:outline-none focus:border-cyan-500"
                        placeholder="NR"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-2">Colore Ufficiale</label>
                    <div className="flex flex-wrap items-center gap-2">
                      {PARTY_COLOR_PALETTE.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setDraft((d) => ({ ...d, color: hex }))}
                          style={{ backgroundColor: hex }}
                          aria-label={`Colore ${hex}`}
                          className={`w-7 h-7 rounded-md transition-transform cursor-pointer ${
                            draft.color === hex
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-[#111827] scale-105'
                              : 'opacity-80 hover:opacity-100'
                          }`}
                        />
                      ))}
                      <input
                        type="color"
                        value={draft.color}
                        onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
                        title="Scegli colore personalizzato"
                        className="w-7 h-7 rounded-md bg-transparent border border-slate-700 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <label className="text-xs text-slate-400">
                        Simbolo Vettoriale o Immagine
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          ref={emblemFileRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          onChange={handleUploadEmblem}
                          className="hidden"
                        />
                        {draft.customEmblemUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setDraft((d) => ({ ...d, customEmblemUrl: undefined }))
                            }
                            className="text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer"
                          >
                            Rimuovi
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => emblemFileRef.current?.click()}
                          className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          Carica immagine
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                      {EMBLEM_OPTIONS.map((item) => {
                        const active = !draft.customEmblemUrl && draft.emblem === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            title={item.label}
                            onClick={() =>
                              setDraft((d) => ({
                                ...d,
                                emblem: item.id,
                                customEmblemUrl: undefined,
                              }))
                            }
                            className={`p-1.5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                              active
                                ? 'bg-slate-800 border-cyan-500'
                                : 'bg-[#090D16] border-slate-800 hover:border-slate-600'
                            }`}
                          >
                            <PartyEmblem emblem={item.id} color={draft.color} size={26} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>

                <section className="xl:col-span-5 bg-[#111827] border border-slate-800/90 rounded-xl p-4 sm:p-5 space-y-4">
                  <h2 className="text-base font-semibold text-slate-100">
                    Modalità di Partenza e Leader
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, origin: 'established' }))}
                      className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                        draft.origin === 'established'
                          ? 'bg-cyan-500/10 border-cyan-500/70'
                          : 'bg-[#090D16] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-semibold text-slate-100">
                        Nuovo Partito già costituito
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Extra-parlamentare · {selectedOrientation.establishedBasePoll.toFixed(1)}% · €
                        {selectedOrientation.startingBudget.toLocaleString('it-IT')}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, origin: 'committee' }))}
                      className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                        draft.origin === 'committee'
                          ? 'bg-amber-500/10 border-amber-500/70'
                          : 'bg-[#090D16] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-semibold text-slate-100">
                        Comitato Promotore
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Parte dallo 0,0% · €15.000 · 30.000 firme
                      </div>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs text-slate-400 mb-1.5">
                        Nome del Leader
                      </label>
                      <input
                        type="text"
                        maxLength={32}
                        value={draft.leaderName}
                        onChange={(e) => setDraft((d) => ({ ...d, leaderName: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-[#090D16] border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Età</label>
                      <input
                        type="number"
                        min={26}
                        max={78}
                        value={draft.leaderAge}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            leaderAge: Math.max(26, Math.min(78, Number(e.target.value) || 40)),
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[#090D16] border border-slate-700/80 text-sm font-mono tabular-nums text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">
                      Stile di Leadership
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {LEADERSHIP_STYLES.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setDraft((d) => ({ ...d, leaderStyle: st.id }))}
                          className={`px-3 py-2 rounded-lg border text-left transition-colors cursor-pointer ${
                            draft.leaderStyle === st.id
                              ? 'bg-slate-800 border-cyan-500/70 text-slate-100'
                              : 'bg-[#090D16] border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="text-xs font-semibold">{st.label}</div>
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-cyan-300/90 mt-2">
                      {LEADERSHIP_STYLES.find((s) => s.id === draft.leaderStyle)?.bonus}
                    </p>
                  </div>
                </section>
              </div>

              <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 sm:p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                  <h2 className="text-base font-semibold text-slate-100">
                    Orientamento Politico (8 Aree)
                  </h2>
                  <span className="text-xs font-mono tabular-nums text-amber-400">
                    Budget avvio: €
                    {(draft.origin === 'committee'
                      ? 15000
                      : selectedOrientation.startingBudget
                    ).toLocaleString('it-IT')}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5">
                  {ORIENTATIONS.map((o) => {
                    const active = draft.orientation === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, orientation: o.id }))}
                        className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                          active
                            ? 'bg-cyan-500/10 border-cyan-500/70'
                            : 'bg-[#090D16] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-semibold text-slate-100">{o.label}</div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">{o.shortDesc}</p>
                        <div className="text-[11px] text-cyan-400/90 mt-2 font-medium">
                          {o.effectSummary}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 sm:p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                  <h2 className="text-base font-semibold text-slate-100">
                    Seleziona 2 Tratti del Leader
                  </h2>
                  <span className="text-xs text-slate-400">
                    Attivi:{' '}
                    <span className="text-amber-400 font-medium">
                      {draft.traits
                        .map((id) => LEADER_TRAITS.find((t) => t.id === id)?.label)
                        .join(' · ')}
                    </span>
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5">
                  {LEADER_TRAITS.map((tr) => {
                    const selected = draft.traits.includes(tr.id);
                    return (
                      <button
                        key={tr.id}
                        type="button"
                        onClick={() => handleToggleTrait(tr.id)}
                        className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                          selected
                            ? 'bg-amber-500/10 border-amber-500/70'
                            : 'bg-[#090D16] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-100">{tr.label}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {tr.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
                          {tr.effect}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {selectedMode === 'existing_party' && (
            <div className="max-w-5xl mx-auto space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-50">
                  Arco Parlamentare Italiano · Novembre 2026
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Scegli uno degli 8 partiti italiani reali con leader, sondaggi, casse e coalizioni di novembre 2026.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {EXISTING_PARTIES_2026.map((p) => {
                  const active = selectedExistingId === p.id;
                  const latestPoll = p.history12[p.history12.length - 1];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedExistingId(p.id)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        active
                          ? 'bg-[#111827] border-amber-500/80 shadow-sm'
                          : 'bg-[#111827]/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <PartyEmblem emblem={p.emblem} color={p.color} size={34} />
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-slate-100 truncate">
                                {p.name} ({p.acronym})
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {p.leaderName} · {p.coalitionLabel}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div
                              style={{ color: p.color }}
                              className="text-lg font-mono font-bold tabular-nums"
                            >
                              {latestPoll.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                          {p.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Cassa iniziale</span>
                          <span className="font-mono tabular-nums text-slate-200">
                            €{p.startingBudget.toLocaleString('it-IT')}
                          </span>
                        </div>
                        <div className="text-amber-400/90 truncate">{p.internalTension}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <PartyEmblem
                    emblem={selectedExistingPreset.emblem}
                    color={selectedExistingPreset.color}
                    size={42}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-100 truncate">
                      {selectedExistingPreset.name} ({selectedExistingPreset.acronym})
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Leader: {selectedExistingPreset.leaderName} · Tratti:{' '}
                      {selectedExistingPreset.leaderTraits
                        .map((id) => LEADER_TRAITS.find((t) => t.id === id)?.label)
                        .join(' & ')}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLaunch}
                  className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs transition-colors cursor-pointer shrink-0"
                >
                  Assumi la Segreteria
                </button>
              </div>
            </div>
          )}

          {selectedMode === 'government_crisis' && (
            <div className="max-w-5xl mx-auto space-y-5">
              <div className="bg-[#111827] border border-rose-500/40 rounded-xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-rose-400">
                      Edizione Straordinaria · Novembre 2026
                    </p>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-50 mt-1">
                      Crisi di Governo: 8 Settimane alle Elezioni Anticipate
                    </h2>
                  </div>
                  <div className="sm:text-right font-mono tabular-nums shrink-0">
                    <div className="text-xs text-slate-400">Finestra elettorale</div>
                    <div className="text-xl font-bold text-rose-400">8 Settimane</div>
                  </div>
                </div>
                <p className="text-sm text-slate-300 mt-3 leading-relaxed max-w-3xl">
                  Un voto a sorpresa sul maxi-emendamento della Manovra 2027 manda sotto l’esecutivo. Il Presidente della Repubblica scioglie le Camere e fissa il voto lampo per fine gennaio 2027. Scegli quale partito guidare nella corsa finale verso Palazzo Chigi.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {EXISTING_PARTIES_2026.map((p) => {
                  const active = crisisPartyId === p.id;
                  const latestPoll = p.history12[p.history12.length - 1];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setCrisisPartyId(p.id)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-[#111827] border-rose-500/80'
                          : 'bg-[#111827]/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <PartyEmblem emblem={p.emblem} color={p.color} size={34} />
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-100 truncate">
                              {p.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {p.leaderName} · {p.acronym}
                            </div>
                          </div>
                        </div>
                        <span
                          style={{ color: p.color }}
                          className="text-lg font-mono font-bold tabular-nums shrink-0"
                        >
                          {latestPoll.toFixed(1)}%
                        </span>
                      </div>
                      <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Budget guerra elettorale</span>
                        <span className="font-mono tabular-nums text-slate-200">
                          €{p.startingBudget.toLocaleString('it-IT')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-300">
                  Pronto allo sprint elettorale con{' '}
                  <strong className="text-white">{selectedCrisisPreset.name}</strong> (
                  {selectedCrisisPreset.history12[
                    selectedCrisisPreset.history12.length - 1
                  ].toFixed(1)}
                  %). Obiettivo: 201 seggi Camera e 101 Senato entro la Settimana 9.
                </div>
                <button
                  type="button"
                  onClick={handleLaunch}
                  className="px-5 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-display font-bold text-xs transition-colors cursor-pointer shrink-0"
                >
                  Avvia Campagna Lampo (8 Sett.)
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

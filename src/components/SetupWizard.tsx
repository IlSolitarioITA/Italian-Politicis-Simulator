import React, { useRef, useState } from 'react';
import {
  EMBLEM_OPTIONS,
  EXISTING_PARTIES_2026,
  INITIAL_GOVERNMENT_PARTY_IDS,
  LEADER_TRAITS,
  LEADERSHIP_STYLES,
  ORIENTATIONS,
  PARTY_COLOR_PALETTE,
  REAL_INITIAL_LEGISLATURE_SEATS,
} from '../data/presets';
import {
  GameMode,
  GameState,
  LeaderTraitId,
  NewPartyDraft,
  SaveSlotSummary,
} from '../types/game';
import { PartyEmblem } from './PartyEmblem';
import { LeaderAvatar } from './LeaderAvatar';
import {
  SaveSlotIndex,
  parseImportedGameJson,
  validateJsonFileBeforeRead,
} from '../utils/saveManager';
import {
  sanitizeAcronym,
  sanitizeCustomEmblemUrl,
  sanitizeHexColor,
  sanitizePlainText,
} from '../utils/sanitizer';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  FolderOpen,
  Landmark,
  RotateCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react';
import { LegalTabId } from './LegalModal';

interface SetupWizardProps {
  targetSlot: SaveSlotIndex;
  saveSlots: SaveSlotSummary[];
  onStartNewGame: (params: {
    mode: GameMode;
    existingPartyId?: string;
    customLeaderName?: string;
    newPartyDraft?: NewPartyDraft;
  }) => void;
  onLoadSlot: (slot: SaveSlotIndex) => void;
  onImportGame: (state: GameState) => void;
  onBackToSavedGames: () => void;
  onOpenLegal?: (tab?: LegalTabId) => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({
  targetSlot,
  saveSlots,
  onStartNewGame,
  onLoadSlot,
  onImportGame,
  onBackToSavedGames,
  onOpenLegal,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('existing_party');
  const [selectedExistingId, setSelectedExistingId] = useState<string>('fdi');
  const [existingLeaderName, setExistingLeaderName] = useState<string>(
    () => EXISTING_PARTIES_2026.find((p) => p.id === 'fdi')?.leaderName ?? 'Giorgia Meloni'
  );
  const [crisisPartyId, setCrisisPartyId] = useState<string>('pd');
  const [crisisLeaderName, setCrisisLeaderName] = useState<string>(
    () => EXISTING_PARTIES_2026.find((p) => p.id === 'pd')?.leaderName ?? 'Elly Schlein'
  );
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
  const [leaderAgeInput, setLeaderAgeInput] = useState<string>('43');

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
    if (!/^image\/(png|jpeg|jpg|webp|gif)$/i.test(file.type)) {
      setImportError('Formato simbolo non supportato: carica solo immagini PNG, JPG, WEBP o GIF.');
      e.target.value = '';
      return;
    }
    if (file.size > 1_200_000) {
      setImportError('L’immagine del simbolo deve pesare meno di 1,2 MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const safeUrl = sanitizeCustomEmblemUrl(reader.result);
        if (!safeUrl) {
          setImportError('Immagine non valida o non sicura.');
          return;
        }
        setDraft((prev) => ({ ...prev, customEmblemUrl: safeUrl }));
        setImportError(null);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preCheck = validateJsonFileBeforeRead(file);
    if (!preCheck.ok) {
      setImportError(preCheck.error);
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => {
      setImportError('Impossibile leggere il file selezionato.');
    };
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setImportError('Contenuto del file non leggibile come testo JSON.');
        return;
      }
      const res = parseImportedGameJson(reader.result);
      if (res.state) {
        setImportError(null);
        onImportGame(res.state);
      } else {
        setImportError(res.error ?? 'Errore durante l’importazione del salvataggio.');
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

  const handleSelectExistingParty = (partyId: string) => {
    setSelectedExistingId(partyId);
    const preset = EXISTING_PARTIES_2026.find((p) => p.id === partyId);
    if (preset) {
      setExistingLeaderName(preset.leaderName);
    }
  };

  const handleSelectCrisisParty = (partyId: string) => {
    setCrisisPartyId(partyId);
    const preset = EXISTING_PARTIES_2026.find((p) => p.id === partyId);
    if (preset) {
      setCrisisLeaderName(preset.leaderName);
    }
  };

  const handleLaunch = () => {
    if (selectedMode === 'new_party') {
      const parsedAge = Number(leaderAgeInput.trim());
      const safeAge =
        leaderAgeInput.trim() === '' || !Number.isFinite(parsedAge)
          ? Math.max(18, Math.min(90, Math.round(draft.leaderAge || 43)))
          : Math.max(18, Math.min(90, Math.round(parsedAge)));
      const sanitizedDraft: NewPartyDraft = {
        ...draft,
        name: sanitizePlainText(draft.name, 36, 'Nuova Repubblica'),
        acronym: sanitizeAcronym(draft.acronym, 'NR'),
        color: sanitizeHexColor(draft.color, '#06B6D4'),
        customEmblemUrl: sanitizeCustomEmblemUrl(draft.customEmblemUrl),
        leaderName: sanitizePlainText(draft.leaderName, 36, 'Andrea Valeri'),
        leaderAge: safeAge,
      };
      onStartNewGame({ mode: 'new_party', newPartyDraft: sanitizedDraft });
    } else if (selectedMode === 'existing_party') {
      const cleanLeader = sanitizePlainText(
        existingLeaderName,
        36,
        selectedExistingPreset.leaderName
      );
      onStartNewGame({
        mode: 'existing_party',
        existingPartyId: selectedExistingId,
        customLeaderName: cleanLeader,
      });
    } else {
      const cleanLeader = sanitizePlainText(
        crisisLeaderName,
        36,
        selectedCrisisPreset.leaderName
      );
      onStartNewGame({
        mode: 'government_crisis',
        existingPartyId: crisisPartyId,
        customLeaderName: cleanLeader,
      });
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
                <span className="text-[11px] font-mono text-amber-400 shrink-0">
                  {EXISTING_PARTIES_2026.length} partiti
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Dai grandi poli (FdI, PD, M5S, FI, AVS, Futuro Nazionale, Lega, Azione, IV) ai partiti minori reali (+Europa, Noi Moderati, Sud chiama Nord e altri).
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
        <main className="flex-1 min-h-0 lg:overflow-y-auto war-scroll p-4 sm:p-6 space-y-5">
          {/* Montecitorio Institutional Cover Hero */}
          <section
            className="max-w-5xl mx-auto relative overflow-hidden rounded-2xl border border-slate-800/90 p-5 sm:p-6 shadow-xl"
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(9,13,22,0.88) 0%, rgba(13,19,34,0.70) 55%, rgba(9,13,22,0.92) 100%), url("${import.meta.env.BASE_URL}hero-parliament.jpg")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="space-y-1">
                <div className="text-[11px] font-mono uppercase tracking-wider text-amber-300">
                  Palazzo Montecitorio · Legislatura Novembre 2026
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-50 leading-snug drop-shadow-sm">
                  {selectedMode === 'existing_party'
                    ? 'Arco Parlamentare Italiano · Sondaggi Reali Novembre 2026'
                    : selectedMode === 'new_party'
                      ? 'Fonda il Tuo Nuovo Movimento Politico'
                      : 'Crisi di Governo Lampo · 8 Settimane alle Urne'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed max-w-3xl">
                  {selectedMode === 'existing_party'
                    ? `Scegli uno dei ${EXISTING_PARTIES_2026.length} partiti reali italiani (incluso Futuro Nazionale di Roberto Vannacci e tutte le forze minori) e personalizza il nome del Leader / Segretario.`
                    : selectedMode === 'new_party'
                      ? 'Disegna identità, orientamento su 4 assi, profilo del leader e guida la scalata dalle piazze fino al Parlamento.'
                      : 'Governo battuto sulla Manovra 2027: guida un partito reale nella campagna elettorale lampo verso Palazzo Chigi.'}
                </p>
              </div>
            </div>
          </section>

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
                        <div className="text-xs font-bold text-slate-100 leading-tight max-w-[170px] whitespace-normal break-words">
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
                          accept="image/png,image/jpeg,image/webp,image/gif"
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
                        Extra-parlamentare (0 seggi) · {selectedOrientation.establishedBasePoll.toFixed(1)}% · €48.000
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
                        Parte dallo 0,0% (0 seggi) · €18.000 · 30.000 firme
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
                      <label className="block text-xs text-slate-400 mb-1.5">Età (18-90)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={3}
                        value={leaderAgeInput}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 3);
                          setLeaderAgeInput(digitsOnly);
                          if (digitsOnly !== '') {
                            const parsed = Number(digitsOnly);
                            if (Number.isFinite(parsed)) {
                              setDraft((d) => ({ ...d, leaderAge: parsed }));
                            }
                          }
                        }}
                        onBlur={() => {
                          const trimmed = leaderAgeInput.trim();
                          const parsed = Number(trimmed);
                          const clamped =
                            trimmed === '' || !Number.isFinite(parsed)
                              ? 43
                              : Math.max(18, Math.min(90, Math.round(parsed)));
                          setLeaderAgeInput(String(clamped));
                          setDraft((d) => ({ ...d, leaderAge: clamped }));
                        }}
                        placeholder="18-90"
                        aria-label="Età del leader tra 18 e 90 anni"
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
                    Budget avvio: €{(draft.origin === 'committee' ? 26000 : 50000).toLocaleString('it-IT')}
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {EXISTING_PARTIES_2026.map((p) => {
                  const active = selectedExistingId === p.id;
                  const latestPoll = p.history12[p.history12.length - 1];
                  const initialSeats = REAL_INITIAL_LEGISLATURE_SEATS[p.id] ?? {
                    camera: 0,
                    senato: 0,
                  };
                  const totalSeats = initialSeats.camera + initialSeats.senato;
                  const isGov = INITIAL_GOVERNMENT_PARTY_IDS.has(p.id) && totalSeats > 0;
                  const statusLabel = isGov
                    ? `Governo · ${totalSeats} seggi`
                    : totalSeats > 0
                      ? `Opposizione Parl. · ${totalSeats} seggi`
                      : 'Extra-Parlamentare · 0 seggi';
                  const statusTone = isGov
                    ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
                    : totalSeats > 0
                      ? 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10'
                      : 'text-amber-300 border-amber-500/40 bg-amber-500/10';
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectExistingParty(p.id)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        active
                          ? 'bg-[#111827] border-amber-500/80 shadow-sm'
                          : 'bg-[#111827]/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <div className="flex items-center -space-x-2 shrink-0 mt-0.5">
                              <PartyEmblem emblem={p.emblem} color={p.color} size={34} />
                              <LeaderAvatar
                                name={p.leaderName}
                                color={p.color}
                                size={28}
                                partyAcronym={p.acronym}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold text-slate-100 whitespace-normal leading-snug">
                                {p.name} ({p.acronym})
                              </div>
                              <div className="text-[11px] text-slate-400 whitespace-normal leading-snug mt-0.5">
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
                        <div className="mt-2">
                          <span
                            className={`inline-block px-2 py-0.5 rounded border text-[10px] font-mono ${statusTone}`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2.5 leading-relaxed whitespace-normal">
                          {p.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span>Cassa iniziale</span>
                          <span className="font-mono tabular-nums text-slate-200">
                            €{p.startingBudget.toLocaleString('it-IT')}
                          </span>
                        </div>
                        <div className="text-amber-400/90 whitespace-normal leading-snug">
                          {p.internalTension}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex items-center -space-x-2 shrink-0 mt-0.5">
                      <PartyEmblem
                        emblem={selectedExistingPreset.emblem}
                        color={selectedExistingPreset.color}
                        size={42}
                      />
                      <LeaderAvatar
                        name={existingLeaderName || selectedExistingPreset.leaderName}
                        color={selectedExistingPreset.color}
                        size={36}
                        partyAcronym={selectedExistingPreset.acronym}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-100 whitespace-normal leading-snug">
                        {selectedExistingPreset.name} ({selectedExistingPreset.acronym})
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 whitespace-normal leading-snug">
                        Leader: <strong className="text-slate-200">{existingLeaderName || selectedExistingPreset.leaderName}</strong> · Tratti:{' '}
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

                {/* Personalizzazione Nome Leader / Segretario */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor="existing-leader-name-input"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Nome del Leader / Segretario (personalizzabile)
                    </label>
                    <input
                      id="existing-leader-name-input"
                      type="text"
                      maxLength={36}
                      value={existingLeaderName}
                      onChange={(e) => setExistingLeaderName(e.target.value)}
                      placeholder={selectedExistingPreset.leaderName}
                      className="w-full px-3 py-2 rounded-lg bg-[#090D16] border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  {existingLeaderName !== selectedExistingPreset.leaderName && (
                    <button
                      type="button"
                      onClick={() => setExistingLeaderName(selectedExistingPreset.leaderName)}
                      className="px-3 py-2 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Ripristina originale</span>
                    </button>
                  )}
                </div>
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
                      onClick={() => handleSelectCrisisParty(p.id)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        active
                          ? 'bg-[#111827] border-rose-500/80'
                          : 'bg-[#111827]/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className="flex items-center -space-x-2 shrink-0 mt-0.5">
                            <PartyEmblem emblem={p.emblem} color={p.color} size={34} />
                            <LeaderAvatar
                              name={p.leaderName}
                              color={p.color}
                              size={28}
                              partyAcronym={p.acronym}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-slate-100 whitespace-normal leading-snug">
                              {p.name} ({p.acronym})
                            </div>
                            <div className="text-[11px] text-slate-400 whitespace-normal leading-snug mt-0.5">
                              {p.leaderName} · {p.coalitionLabel}
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
                      <div className="mt-3 pt-2.5 border-t border-slate-800/70 text-[11px] text-slate-400 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span>Budget guerra elettorale</span>
                          <span className="font-mono tabular-nums text-slate-200">
                            €{p.startingBudget.toLocaleString('it-IT')}
                          </span>
                        </div>
                        <div className="text-amber-400/90 whitespace-normal leading-snug">
                          {p.internalTension}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex items-center -space-x-2 shrink-0 mt-0.5">
                      <PartyEmblem
                        emblem={selectedCrisisPreset.emblem}
                        color={selectedCrisisPreset.color}
                        size={40}
                      />
                      <LeaderAvatar
                        name={crisisLeaderName || selectedCrisisPreset.leaderName}
                        color={selectedCrisisPreset.color}
                        size={34}
                        partyAcronym={selectedCrisisPreset.acronym}
                      />
                    </div>
                    <div className="text-xs text-slate-300 leading-relaxed whitespace-normal">
                      Pronto allo sprint elettorale con{' '}
                      <strong className="text-white">{selectedCrisisPreset.name}</strong> (
                      {selectedCrisisPreset.history12[
                        selectedCrisisPreset.history12.length - 1
                      ].toFixed(1)}
                      %) guidato da{' '}
                      <strong className="text-rose-300">
                        {crisisLeaderName || selectedCrisisPreset.leaderName}
                      </strong>
                      . Obiettivo: 201 seggi Camera e 101 Senato entro la Settimana 9.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLaunch}
                    className="px-5 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-display font-bold text-xs transition-colors cursor-pointer shrink-0"
                  >
                    Avvia Campagna Lampo (8 Sett.)
                  </button>
                </div>

                {/* Personalizzazione Nome Leader / Segretario anche in Crisi di Governo */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor="crisis-leader-name-input"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Nome del Leader / Segretario (personalizzabile)
                    </label>
                    <input
                      id="crisis-leader-name-input"
                      type="text"
                      maxLength={36}
                      value={crisisLeaderName}
                      onChange={(e) => setCrisisLeaderName(e.target.value)}
                      placeholder={selectedCrisisPreset.leaderName}
                      className="w-full px-3 py-2 rounded-lg bg-[#090D16] border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                  {crisisLeaderName !== selectedCrisisPreset.leaderName && (
                    <button
                      type="button"
                      onClick={() => setCrisisLeaderName(selectedCrisisPreset.leaderName)}
                      className="px-3 py-2 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Ripristina originale</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer Privacy, Disclaimer & Fonti Dati */}
          {onOpenLegal && (
            <footer className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="whitespace-normal leading-snug">
                  Simulatore indipendente, apartitico e 100% locale (zero cookie di tracciamento, salvataggi in{' '}
                  <code className="font-mono text-slate-300">localStorage</code>).
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenLegal('privacy')}
                  className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 underline underline-offset-2 cursor-pointer"
                >
                  <Scale className="w-3 h-3 shrink-0" />
                  <span>Privacy, Note Legali &amp; Dati</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenLegal('disclaimer')}
                  className="text-slate-300 hover:text-white underline underline-offset-2 cursor-pointer"
                >
                  Disclaimer Politico
                </button>
                <button
                  type="button"
                  onClick={() => onOpenLegal('fonti')}
                  className="text-slate-300 hover:text-white underline underline-offset-2 cursor-pointer"
                >
                  Fonti Dati &amp; Licenze
                </button>
              </div>
            </footer>
          )}
        </main>
      </div>
    </div>
  );
};

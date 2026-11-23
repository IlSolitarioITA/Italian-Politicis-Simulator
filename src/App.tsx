import React, { useEffect, useState } from 'react';
import {
  CampaignActionPayload,
  advanceWeek,
  applyTvDuelResult,
  closeRegionalHeadquarters,
  declineGovernmentMandate,
  executeCabinetReshuffle,
  executeCampaignAction,
  formGovernmentFromConsultations,
  initializeGame,
  manageExecutive,
  negotiateCoalition,
  openRegionalHeadquarters,
  resolveWeeklyCrisis,
  restoreConstitutionalOrder,
  triggerElectionNight,
  voteBudgetLaw,
  voteParliamentLaw,
} from './engine/simulation';
import {
  BudgetAllocation,
  CrisisOption,
  GameMode,
  GameState,
  MinistryId,
  NewPartyDraft,
  RegionId,
  SaveSlotSummary,
  TabId,
  TvDuelResultPayload,
} from './types/game';
import {
  SaveSlotIndex,
  deleteSaveSlot,
  getActiveSlotIndex,
  listSaveSlots,
  loadGameFromSlot,
  saveGameToSlot,
  setActiveSlotIndex,
} from './utils/saveManager';
import { useGameUpdateChecker } from './hooks/useGameUpdateChecker';
import {
  isAudioMuted,
  playBreakingNewsJingle,
  playTactileClick,
  toggleAudioMuted,
} from './utils/soundEngine';
import { GameUpdateBanner } from './components/GameUpdateBanner';
import { SavedGamesView } from './components/SavedGamesView';
import { SetupWizard } from './components/SetupWizard';
import { TopHudBar } from './components/TopHudBar';
import { SaveLoadModal } from './components/SaveLoadModal';
import { BudgetLawModal } from './components/BudgetLawModal';
import { TvDuelModal } from './components/TvDuelModal';
import { TabDashboard } from './components/TabDashboard';
import { TabCampaign } from './components/TabCampaign';
import { TabCrisesMedia } from './components/TabCrisesMedia';
import { TabParliament } from './components/TabParliament';
import { TabPartyCoalitions } from './components/TabPartyCoalitions';
import { TabElections } from './components/TabElections';
import {
  AlertCircle,
  BarChart3,
  Landmark,
  Megaphone,
  Newspaper,
  Scale,
  Users,
  X,
} from 'lucide-react';

interface ToastMessage {
  id: number;
  text: string;
  tone: 'info' | 'success' | 'error';
}

type AppScreen = 'saved_games' | 'setup' | 'playing';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('saved_games');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('plancia');
  const [activeSlot, setActiveSlot] = useState<SaveSlotIndex>(() => getActiveSlotIndex());
  const [setupTargetSlot, setSetupTargetSlot] = useState<SaveSlotIndex>(() => getActiveSlotIndex());
  const [saveSlots, setSaveSlots] = useState<SaveSlotSummary[]>(() => listSaveSlots());
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [tvDuelOpponentId, setTvDuelOpponentId] = useState<string | null>(null);
  const [audioMuted, setAudioMuted] = useState<boolean>(() => isAudioMuted());
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const handleToggleAudio = () => {
    const nextMuted = toggleAudioMuted();
    setAudioMuted(nextMuted);
  };

  const {
    updateInfo,
    dismissed: updateDismissed,
    dismissUpdate,
    triggerDownload,
    isDownloading,
    downloadFeedback,
  } = useGameUpdateChecker();

  const showToast = (text: string, tone: 'info' | 'success' | 'error' = 'info') => {
    setToast({ id: Date.now(), text, tone });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Salvataggio automatico continuo sullo slot attivo ad ogni mutazione di stato
  useEffect(() => {
    if (!gameState) return;
    saveGameToSlot(activeSlot, gameState);
    setSaveSlots(listSaveSlots());
  }, [gameState, activeSlot]);

  const handleOpenCreateInSlot = (slot: SaveSlotIndex) => {
    setSetupTargetSlot(slot);
    setScreen('setup');
  };

  const handleStartNewGame = (params: {
    mode: GameMode;
    existingPartyId?: string;
    newPartyDraft?: NewPartyDraft;
  }) => {
    const fresh = initializeGame(params);
    saveGameToSlot(setupTargetSlot, fresh);
    setActiveSlotIndex(setupTargetSlot);
    setActiveSlot(setupTargetSlot);
    setGameState(fresh);
    setSaveSlots(listSaveSlots());
    setActiveTab('plancia');
    setScreen('playing');
    showToast(
      `War Room operativa nello Slot ${setupTargetSlot}. Ogni mossa viene salvata automaticamente.`,
      'success'
    );
  };

  const handleLoadSlot = (slot: SaveSlotIndex) => {
    const loaded = loadGameFromSlot(slot);
    if (loaded) {
      setActiveSlot(slot);
      setGameState(loaded);
      setSaveSlots(listSaveSlots());
      setActiveTab(
        loaded.election && !loaded.election.postElectionResolved ? 'elezioni' : 'plancia'
      );
      setScreen('playing');
      showToast(`Partita ripresa dallo Slot ${slot}.`, 'success');
    } else {
      showToast(`Impossibile caricare lo Slot ${slot}.`, 'error');
    }
  };

  const handleSaveToSlot = (slot: SaveSlotIndex) => {
    if (!gameState) return;
    saveGameToSlot(slot, gameState);
    setActiveSlot(slot);
    setSaveSlots(listSaveSlots());
  };

  const handleDeleteSlot = (slot: SaveSlotIndex) => {
    deleteSaveSlot(slot);
    if (slot === activeSlot) {
      setGameState(null);
      if (screen === 'playing') {
        setScreen('saved_games');
      }
    }
    setSaveSlots(listSaveSlots());
  };

  const handleImportIntoSlot = (slot: SaveSlotIndex, imported: GameState) => {
    saveGameToSlot(slot, imported);
    setActiveSlotIndex(slot);
    setActiveSlot(slot);
    setGameState(imported);
    setSaveSlots(listSaveSlots());
    setActiveTab(
      imported.election && !imported.election.postElectionResolved ? 'elezioni' : 'plancia'
    );
    setScreen('playing');
    showToast(`Partita importata con successo nello Slot ${slot}.`, 'success');
  };

  const handleReturnToSavedGames = () => {
    if (gameState) {
      saveGameToSlot(activeSlot, gameState);
      setSaveSlots(listSaveSlots());
    }
    setSaveModalOpen(false);
    setScreen('saved_games');
  };

  const handleOpenHq = (regionId: RegionId) => {
    if (!gameState) return;
    const res = openRegionalHeadquarters(gameState, regionId);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleCloseHq = (regionId: RegionId) => {
    if (!gameState) return;
    const res = closeRegionalHeadquarters(gameState, regionId);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    setGameState(res.nextState);
    showToast(res.feedback, 'info');
  };

  const handleExecuteAction = (payload: CampaignActionPayload) => {
    if (!gameState) return;
    const res = executeCampaignAction(gameState, payload);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleStartTvDuel = (opponentPartyId: string) => {
    if (!gameState) return;
    if (gameState.politicalCapital <= 0) {
      showToast('Nessun Punto Azione rimasto questa settimana.', 'error');
      return;
    }
    playTactileClick();
    setTvDuelOpponentId(opponentPartyId);
  };

  const handleCompleteTvDuel = (result: TvDuelResultPayload) => {
    if (!gameState) return;
    const res = applyTvDuelResult(gameState, result);
    setTvDuelOpponentId(null);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    setGameState(res.nextState);
    showToast(res.feedback, result.finalPlayerShare >= 50 ? 'success' : 'error');
  };

  const handleResolveCrisis = (option: CrisisOption) => {
    if (!gameState) return;
    const res = resolveWeeklyCrisis(gameState, option);
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleVoteLaw = (lawId: string) => {
    if (!gameState) return;
    const res = voteParliamentLaw(gameState, lawId);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    setGameState(res.nextState);
    if (res.triggeredCollapse) {
      playBreakingNewsJingle();
      setActiveTab('elezioni');
      showToast(res.feedback, 'error');
    } else {
      playTactileClick();
      showToast(
        res.feedback,
        res.feedback.includes('Bocciata') || res.feedback.includes('VETO')
          ? 'error'
          : 'success'
      );
    }
  };

  const handleRestoreDemocracy = () => {
    if (!gameState) return;
    const res = restoreConstitutionalOrder(gameState);
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleReshuffleMinistry = (ministryId: MinistryId, newPartyId: string) => {
    if (!gameState) return;
    const res = executeCabinetReshuffle(gameState, ministryId, newPartyId);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleManageExecutive = (
    execId: string,
    action: 'colloquio' | 'incarico' | 'sostituisci'
  ) => {
    if (!gameState) return;
    const res = manageExecutive(gameState, execId, action);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleNegotiateCoalition = (
    partyId: string,
    action: 'proponi_alleanza' | 'patto_governo' | 'rompi_alleanza' | 'attacco'
  ) => {
    if (!gameState) return;
    const res = negotiateCoalition(gameState, partyId, action);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    setGameState(res.nextState);
    showToast(res.feedback, 'info');
  };

  const handleAdvanceWeek = () => {
    if (!gameState) return;
    if (gameState.pendingBudgetLaw) {
      showToast('Approva prima la Legge di Bilancio in Parlamento per avanzare di settimana.', 'error');
      return;
    }
    const { nextState, notifications } = advanceWeek(gameState);
    setGameState(nextState);
    if (nextState.election && !nextState.election.postElectionResolved) {
      setActiveTab('elezioni');
    }
    const hasBreakingNews =
      nextState.pendingBudgetLaw ||
      nextState.currentCrisis.event.severity === 'Critica' ||
      notifications.some(
        (n) =>
          n.includes('SCISSIONE') ||
          n.includes('Crisi') ||
          n.includes('Sessione di Bilancio')
      );
    if (hasBreakingNews && !nextState.election) {
      playBreakingNewsJingle();
    } else if (!nextState.election) {
      playTactileClick();
    }
    if (notifications.length > 0) {
      showToast(notifications[0], notifications[0].includes('SCISSIONE') ? 'error' : 'info');
    } else {
      showToast(`Settimana ${nextState.week} avviata: nuova crisi disponibile in Dossier.`, 'info');
    }
  };

  const handleVoteBudgetLaw = (allocation: BudgetAllocation) => {
    if (!gameState) return;
    const res = voteBudgetLaw(gameState, allocation);
    if (!res.passed) {
      playBreakingNewsJingle();
    } else {
      playTactileClick();
    }
    setGameState(res.nextState);
    showToast(res.feedback, res.passed ? 'success' : 'error');
  };

  const handleTriggerEarlyElection = () => {
    if (!gameState) return;
    const updated = triggerElectionNight(gameState);
    setGameState(updated);
    setActiveTab('elezioni');
    showToast('Camere sciolte: inizia la Notte Elettorale in diretta!', 'info');
  };

  const handleAdvanceElectionStage = (finalJump = false) => {
    if (!gameState || !gameState.election) return;
    // 3-phase Election Marathon: 0 (Ore 23:00 Exit Poll) -> 1 (Ore 00:30 Prime Proiezioni) -> 3 (Definitivo & Seggi)
    const currentStage = gameState.election.stage;
    const nextStage: 0 | 1 | 2 | 3 = finalJump
      ? 3
      : currentStage === 0
        ? 1
        : 3;
    setGameState({
      ...gameState,
      election: {
        ...gameState.election,
        stage: nextStage,
      },
    });
  };

  const handleCompletePostElection = () => {
    if (!gameState || !gameState.election) return;
    const role = gameState.election.playerRole;
    const nextGovRole =
      role === 'premier' ? 'premier' : role === 'partner_governo' ? 'governo' : 'opposizione';
    const nextParties = gameState.parties.map((p) => {
      if (p.id === gameState.playerPartyId) {
        return { ...p, isInGovernment: nextGovRole !== 'opposizione' };
      }
      return p;
    });
    setGameState({
      ...gameState,
      parties: nextParties,
      governmentRole: nextGovRole,
      isPrimeMinister: nextGovRole === 'premier',
      governmentMinistries: nextGovRole === 'opposizione' ? {} : gameState.governmentMinistries,
      allySatisfaction: nextGovRole === 'opposizione' ? {} : gameState.allySatisfaction,
      electionWeek: gameState.week + 20,
      election: null,
    });
    setActiveTab('plancia');
    showToast(
      nextGovRole === 'premier'
        ? 'Benvenuto a Palazzo Chigi, Presidente del Consiglio! Inizia la nuova legislatura.'
        : 'Nuova legislatura avviata nella War Room.',
      'success'
    );
  };

  const handleFormGovernment = (assignments: Partial<Record<MinistryId, string>>) => {
    if (!gameState) return;
    const res = formGovernmentFromConsultations(gameState, assignments);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    setGameState(res.nextState);
    setActiveTab('parlamento');
    showToast(res.feedback, 'success');
  };

  const handleDeclineMandate = () => {
    if (!gameState) return;
    const res = declineGovernmentMandate(gameState);
    setGameState(res.nextState);
    setActiveTab('plancia');
    showToast(res.feedback, 'info');
  };

  const updateBannerElement = (
    <GameUpdateBanner
      updateInfo={updateInfo}
      dismissed={updateDismissed}
      isDownloading={isDownloading}
      downloadFeedback={downloadFeedback}
      onDownload={() => void triggerDownload()}
      onDismiss={dismissUpdate}
    />
  );

  // Schermata Home / "Le Mie Partite" (3 Slot Indipendenti)
  if (screen === 'saved_games' || (screen === 'playing' && !gameState)) {
    return (
      <div className="h-screen w-full max-w-full overflow-hidden overflow-x-hidden bg-[#090D16] text-slate-100 flex flex-col">
        {updateBannerElement}
        <SavedGamesView
          slots={saveSlots}
          activeSlot={activeSlot}
          hasActiveSessionInMemory={Boolean(gameState)}
          onResumeSlot={handleLoadSlot}
          onCreateInSlot={handleOpenCreateInSlot}
          onDeleteSlot={handleDeleteSlot}
          onImportIntoSlot={handleImportIntoSlot}
          onReturnToActiveGame={gameState ? () => setScreen('playing') : undefined}
        />
      </div>
    );
  }

  // Wizard Creazione Nuova Partita (targetizzato su uno slot specifico)
  if (screen === 'setup') {
    return (
      <div className="min-h-screen lg:h-screen w-full max-w-full overflow-x-hidden lg:overflow-hidden bg-[#090D16] text-slate-100 flex flex-col">
        {updateBannerElement}
        <SetupWizard
          targetSlot={setupTargetSlot}
          saveSlots={saveSlots}
          onStartNewGame={handleStartNewGame}
          onLoadSlot={handleLoadSlot}
          onImportGame={(imported) => handleImportIntoSlot(setupTargetSlot, imported)}
          onBackToSavedGames={() => {
            setSaveSlots(listSaveSlots());
            setScreen('saved_games');
          }}
        />
      </div>
    );
  }

  // Active War Room
  const activeGame = gameState!;
  const tabs: {
    id: TabId;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    alert?: boolean;
  }[] = [
    {
      id: 'plancia',
      label: 'Plancia e Sondaggi',
      shortLabel: 'Plancia',
      icon: <BarChart3 className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'campagna',
      label: 'Azioni e Campagna',
      shortLabel: 'Campagna',
      icon: <Megaphone className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'crisi',
      label: 'Dossier, Crisi e Media',
      shortLabel: 'Crisi & Media',
      icon: <Newspaper className="w-4 h-4 shrink-0" />,
      alert: !activeGame.currentCrisis.resolved,
    },
    {
      id: 'parlamento',
      label: 'Parlamento e Governo',
      shortLabel: 'Parlamento',
      icon: <Scale className="w-4 h-4 shrink-0" />,
      alert:
        activeGame.stateIndicators.spread >= 240 ||
        activeGame.stateIndicators.socialStability < 35 ||
        activeGame.regimeStatus === 'regime_autoritario' ||
        (activeGame.isPrimeMinister &&
          Object.values(activeGame.allySatisfaction ?? {}).some((v) => v < 35)),
    },
    {
      id: 'partito',
      label: 'Partito, Dirigenti e Coalizioni',
      shortLabel: 'Partito',
      icon: <Users className="w-4 h-4 shrink-0" />,
      alert: activeGame.executives.some((e) => e.loyalty <= 35),
    },
    {
      id: 'elezioni',
      label: 'Elezioni e Spoglio',
      shortLabel: 'Elezioni',
      icon: <Landmark className="w-4 h-4 shrink-0" />,
      alert: Boolean(activeGame.election),
    },
  ];

  return (
    <div className="h-screen w-full max-w-full overflow-hidden overflow-x-hidden bg-[#090D16] text-slate-100 flex flex-col">
      {updateBannerElement}

      {/* Fixed Top HUD Bar */}
      <TopHudBar
        state={activeGame}
        activeSlot={activeSlot}
        audioMuted={audioMuted}
        onToggleAudio={handleToggleAudio}
        onAdvanceWeek={handleAdvanceWeek}
        onOpenMenu={handleReturnToSavedGames}
        onOpenSaveModal={() => {
          setSaveSlots(listSaveSlots());
          setSaveModalOpen(true);
        }}
      />

      {/* Horizontally Scrollable Navigation Tabs Bar */}
      <nav
        aria-label="Sezioni War Room"
        className="px-3 lg:px-6 bg-[#0B101D] border-b border-slate-800/90 flex items-center gap-1 overflow-x-auto whitespace-nowrap no-scrollbar shrink-0"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                playTactileClick();
                setActiveTab(tab.id);
              }}
              className={`relative px-3 sm:px-3.5 py-2.5 sm:py-3 text-xs font-medium flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                active
                  ? 'text-cyan-300 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
              }`}
            >
              {tab.icon}
              <span className="hidden md:inline">{tab.label}</span>
              <span className="md:hidden">{tab.shortLabel}</span>
              {tab.alert && (
                <AlertCircle
                  aria-label="Richiede attenzione"
                  className="w-3.5 h-3.5 text-rose-400 shrink-0"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Main Viewport Content */}
      <main className="flex-1 min-h-0 overflow-hidden overflow-x-hidden relative">
        {activeTab === 'plancia' && (
          <TabDashboard
            state={activeGame}
            onOpenHq={handleOpenHq}
            onCloseHq={handleCloseHq}
          />
        )}
        {activeTab === 'campagna' && (
          <TabCampaign
            state={activeGame}
            onExecuteAction={handleExecuteAction}
            onStartTvDuel={handleStartTvDuel}
          />
        )}
        {activeTab === 'crisi' && (
          <TabCrisesMedia state={activeGame} onResolveCrisis={handleResolveCrisis} />
        )}
        {activeTab === 'parlamento' && (
          <TabParliament
            state={activeGame}
            onVoteLaw={handleVoteLaw}
            onReshuffleMinistry={handleReshuffleMinistry}
            onRestoreDemocracy={handleRestoreDemocracy}
          />
        )}
        {activeTab === 'partito' && (
          <TabPartyCoalitions
            state={activeGame}
            onManageExecutive={handleManageExecutive}
            onNegotiateCoalition={handleNegotiateCoalition}
          />
        )}
        {activeTab === 'elezioni' && (
          <TabElections
            state={activeGame}
            onTriggerEarlyElection={handleTriggerEarlyElection}
            onAdvanceElectionStage={handleAdvanceElectionStage}
            onCompletePostElection={handleCompletePostElection}
            onFormGovernment={handleFormGovernment}
            onDeclineMandate={handleDeclineMandate}
            onStartFreshGame={() => {
              setSaveSlots(listSaveSlots());
              setScreen('saved_games');
            }}
          />
        )}

        {/* Crisp Action Feedback Toast */}
        {toast && (
          <div className="fixed bottom-3 right-3 left-3 sm:left-auto sm:bottom-4 sm:right-4 z-40 sm:max-w-md">
            <div
              className={`px-4 py-3 rounded-lg border shadow-xl text-xs flex items-start justify-between gap-3 ${
                toast.tone === 'error'
                  ? 'bg-rose-950/95 border-rose-500/60 text-rose-100'
                  : toast.tone === 'success'
                    ? 'bg-[#111827]/95 border-cyan-500/60 text-slate-100'
                    : 'bg-[#111827]/95 border-slate-700 text-slate-200'
              }`}
            >
              <span className="leading-relaxed">{toast.text}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-slate-400 hover:text-white shrink-0 cursor-pointer"
                aria-label="Chiudi notifica"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modale Bloccante Legge di Bilancio Annuale (Manovra Finanziaria) */}
      {activeGame.pendingBudgetLaw && !activeGame.election && (
        <BudgetLawModal
          state={activeGame}
          onVoteBudgetLaw={handleVoteBudgetLaw}
        />
      )}

      {/* Modale Mini-Gioco Duello TV 1 contro 1 (3 Round) */}
      {tvDuelOpponentId && !activeGame.pendingBudgetLaw && !activeGame.election && (
        <TvDuelModal
          state={activeGame}
          opponentPartyId={tvDuelOpponentId}
          onCancel={() => setTvDuelOpponentId(null)}
          onCompleteDuel={handleCompleteTvDuel}
        />
      )}

      {/* Save / Load / JSON Modal */}
      {saveModalOpen && (
        <SaveLoadModal
          state={activeGame}
          activeSlot={activeSlot}
          slots={saveSlots}
          onClose={() => setSaveModalOpen(false)}
          onSaveToSlot={handleSaveToSlot}
          onLoadFromSlot={handleLoadSlot}
          onDeleteSlot={handleDeleteSlot}
          onImportGame={(imported) => handleImportIntoSlot(activeSlot, imported)}
          onReturnToMenu={handleReturnToSavedGames}
        />
      )}
    </div>
  );
}

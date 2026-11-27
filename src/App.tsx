import React, { useEffect, useState } from 'react';
import {
  CampaignActionPayload,
  SCHISM_MIN_POLL,
  advanceWeek,
  applyTvDuelResult,
  boostReferendumSignatures,
  claimTwoPerThousandFunds,
  closeQuirinaleElection,
  closeRegionalHeadquarters,
  completePostElectionLegislature,
  convertDecreeLaw,
  declineGovernmentMandate,
  dismissConcludedReferendum,
  downgradeOrCloseRegionalChapter,
  executeCabinetReshuffle,
  executeCampaignAction,
  formGovernmentFromConsultations,
  fundReferendumCampaign,
  getPendingCrisesCount,
  getPlayerParliamentSeats,
  getWeeklyCrisesList,
  hostTransparentFundraiser,
  initializeGame,
  isPartyCohesionCritical,
  launchAnnualMembershipCampaign,
  launchInquiryCommission,
  manageExecutive,
  negotiateCoalition,
  negotiateQuirinaleSupport,
  openOrUpgradeRegionalChapter,
  organizeSignatureBanchetto,
  promoteAbrogativeReferendum,
  proposeCustomQuirinaleCandidate,
  resolveExecutiveScandal,
  resolveWeeklyCrisis,
  restoreConstitutionalOrder,
  runEmergencyVolunteerFundraiser,
  runQuirinaleBallot,
  setBallotCampaignType,
  setReferendumStance,
  skipWeeklyCrisis,
  triggerConstitutionalReferendum,
  triggerElectionNight,
  executeQuestionTime,
  interveneOnPendingBill,
  launchStreetMobilizationOnBill,
  proposeParliamentaryMotion,
  recompactMajoritySummit,
  voteBudgetLaw,
  voteParliamentLaw,
  votePendingBillWithConfidence,
  advanceEuropeanElectionStage,
  chooseEuParliamentGroup,
  closeEuPostElectionFlow,
  completeEuropeanElection,
  dissolveEuCartel,
  negotiateEuCartel,
  nominateItalianEuCommissioner,
  resolveEuropeanLeaderDecision,
  runEuAbroadStudentsInitiative,
  runEuConstituencyRally,
  runEuSignatureDrive,
  runEuTopicCampaign,
  setEuExcludedStance,
  setEuHeadCandidate,
  setEuLeaderCandidacy,
  voteEuCommissionConfidence,
  voteEuDirective,
} from './engine/simulation';
import {
  BallotElectionType,
  BudgetAllocation,
  CrisisOption,
  EuCampaignTopicId,
  EuCommissionVoteStance,
  EuCommissionerProfileId,
  EuHeadCandidateArchetypeId,
  EuLeaderCandidacyMode,
  EuParliamentGroupId,
  EuropeanConstituencyId,
  GameMode,
  GameState,
  LegislativeInstrument,
  MinistryId,
  NewPartyDraft,
  QuirinaleCandidate,
  ReferendumStance,
  RegionId,
  SaveSlotSummary,
  TabId,
  TvDuelResultPayload,
} from './types/game';
import { EU_SIGNATURE_WINDOW_WEEKS, getNextEuropeanElectionWeek } from './data/european';
import {
  SaveSlotIndex,
  clearAllLocalAppData,
  deleteSaveSlot,
  getActiveSlotIndex,
  getSessionId,
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
import { QuirinaleElectionModal } from './components/QuirinaleElectionModal';
import { TvDuelModal } from './components/TvDuelModal';
import { EuropeanPostElectionModal } from './components/EuropeanPostElectionModal';
import { TabDashboard } from './components/TabDashboard';
import { TabCampaign } from './components/TabCampaign';
import { TabCrisesMedia } from './components/TabCrisesMedia';
import { TabParliament } from './components/TabParliament';
import { TabPartyCoalitions } from './components/TabPartyCoalitions';
import { TabTerritory } from './components/TabTerritory';
import { TabElections } from './components/TabElections';
import { TabGuide } from './components/TabGuide';
import { LegalModal, LegalTabId } from './components/LegalModal';
import { ChangelogModal } from './components/ChangelogModal';
import { hasUnreadChangelog, markChangelogAsRead } from './data/changelog';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Landmark,
  Lock,
  MapPin,
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

type AppScreen = 'saved_games' | 'setup' | 'playing' | 'guide';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('saved_games');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('plancia');
  const [activeSlot, setActiveSlot] = useState<SaveSlotIndex>(() => getActiveSlotIndex());
  const [setupTargetSlot, setSetupTargetSlot] = useState<SaveSlotIndex>(() => getActiveSlotIndex());
  const [saveSlots, setSaveSlots] = useState<SaveSlotSummary[]>(() => listSaveSlots());
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTabId>('privacy');
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [unreadChangelog, setUnreadChangelog] = useState<boolean>(() => hasUnreadChangelog());
  const [tvDuelOpponentId, setTvDuelOpponentId] = useState<string | null>(null);
  const [quirinaleMinimized, setQuirinaleMinimized] = useState(false);
  const [audioMuted, setAudioMuted] = useState<boolean>(() => isAudioMuted());
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Ripristina automaticamente la modale Quirinale quando parte una nuova elezione presidenziale
  useEffect(() => {
    if (gameState?.quirinaleElection?.active) {
      setQuirinaleMinimized(false);
    }
  }, [gameState?.quirinaleElection?.triggeredAtWeek, gameState?.quirinaleElection?.active]);

  // Assicura l'inizializzazione del namespace di sessione isolato per browser/dispositivo
  useEffect(() => {
    getSessionId();
  }, []);

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
    customLeaderName?: string;
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
      const hasLiveElection =
        Boolean(loaded.election && !loaded.election.postElectionResolved) ||
        Boolean(
          loaded.european?.activeElection && !loaded.european.activeElection.postElectionResolved
        );
      setActiveTab(hasLiveElection ? 'elezioni' : 'plancia');
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
    const hasLiveElection =
      Boolean(imported.election && !imported.election.postElectionResolved) ||
      Boolean(
        imported.european?.activeElection && !imported.european.activeElection.postElectionResolved
      );
    setActiveTab(hasLiveElection ? 'elezioni' : 'plancia');
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

  const handleOpenLegal = (tab: LegalTabId = 'privacy') => {
    playTactileClick();
    setLegalModalTab(tab);
    setLegalModalOpen(true);
  };

  const handleOpenChangelog = () => {
    playTactileClick();
    markChangelogAsRead();
    setUnreadChangelog(false);
    setLegalModalOpen(false);
    setSaveModalOpen(false);
    setChangelogOpen(true);
  };

  const handleClearAllLocalData = () => {
    clearAllLocalAppData();
    setGameState(null);
    setActiveSlot(1);
    setSetupTargetSlot(1);
    setSaveModalOpen(false);
    setTvDuelOpponentId(null);
    setQuirinaleMinimized(false);
    setLegalModalOpen(false);
    setChangelogOpen(false);
    setUnreadChangelog(hasUnreadChangelog());
    setAudioMuted(isAudioMuted());
    setSaveSlots(listSaveSlots());
    setScreen('saved_games');
    showToast(
      'Tutti i dati locali (salvataggi, sessione e preferenze) sono stati eliminati dal dispositivo.',
      'success'
    );
  };

  const handleOpenHq = (regionId: RegionId) => {
    if (!gameState) return;
    const res = openOrUpgradeRegionalChapter(gameState, regionId);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleDowngradeChapter = (regionId: RegionId) => {
    if (!gameState) return;
    const res = downgradeOrCloseRegionalChapter(gameState, regionId, false);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'info');
  };

  const handleCloseHq = (regionId: RegionId) => {
    if (!gameState) return;
    const res = closeRegionalHeadquarters(gameState, regionId);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
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
    if (gameState.actionsTakenThisWeek.includes('tv_duel_week')) {
      showToast('Hai già disputato un Duello TV in prima serata questa settimana.', 'error');
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

  const handleResolveCrisis = (option: CrisisOption, crisisId?: string) => {
    if (!gameState) return;
    const res = resolveWeeklyCrisis(gameState, option, crisisId);
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleSkipCrisis = (crisisId?: string) => {
    if (!gameState) return;
    const res = skipWeeklyCrisis(gameState, crisisId);
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'info');
  };

  const handleVoteLaw = (
    lawId: string,
    instrument: LegislativeInstrument = 'ddl',
    withConfidence = false
  ) => {
    if (!gameState) return;
    const res = voteParliamentLaw(gameState, lawId, instrument, withConfidence);
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

  const handleConvertDecree = (decreeId: string, withConfidence: boolean) => {
    if (!gameState) return;
    const res = convertDecreeLaw(gameState, decreeId, withConfidence);
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
      showToast(res.feedback, res.feedback.includes('rinviata') ? 'info' : 'success');
    }
  };

  const handleConfidencePendingBill = (billId: string) => {
    if (!gameState) return;
    const res = votePendingBillWithConfidence(gameState, billId);
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
      showToast(res.feedback, 'success');
    }
  };

  const handleLaunchCommission = (topicId: string) => {
    if (!gameState) return;
    const res = launchInquiryCommission(gameState, topicId);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleProposeQuirinaleCandidate = (
    name: string,
    area: QuirinaleCandidate['area']
  ) => {
    if (!gameState) return;
    const res = proposeCustomQuirinaleCandidate(gameState, name, area);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleNegotiateQuirinale = (partyId: string, candidateId: string) => {
    if (!gameState) return;
    const res = negotiateQuirinaleSupport(gameState, partyId, candidateId);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, res.feedback.includes('rifiuta') ? 'error' : 'success');
  };

  const handleRunQuirinaleBallot = (candidateId: string) => {
    if (!gameState) return;
    const res = runQuirinaleBallot(gameState, candidateId);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    if (res.nextState.quirinaleElection?.electedCandidate) {
      playBreakingNewsJingle();
    } else {
      playTactileClick();
    }
    setGameState(res.nextState);
    showToast(res.feedback, res.nextState.quirinaleElection?.electedCandidate ? 'success' : 'info');
  };

  const handleCloseQuirinaleElection = () => {
    if (!gameState) return;
    playTactileClick();
    setGameState(closeQuirinaleElection(gameState));
  };

  const handleLaunchMembership = () => {
    if (!gameState) return;
    const res = launchAnnualMembershipCampaign(gameState);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleClaimTwoPerThousand = () => {
    if (!gameState) return;
    const res = claimTwoPerThousandFunds(gameState);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleHostFundraiser = (kind: 'donazioni' | 'cena') => {
    if (!gameState) return;
    const res = hostTransparentFundraiser(gameState, kind);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleEmergencyFundraiser = () => {
    if (!gameState) return;
    const res = runEmergencyVolunteerFundraiser(gameState);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleResolveScandal = (decision: 'difendi' | 'dimissioni') => {
    if (!gameState) return;
    const res = resolveExecutiveScandal(gameState, decision);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, decision === 'dimissioni' ? 'info' : 'error');
  };

  const handleRestoreDemocracy = () => {
    if (!gameState) return;
    const res = restoreConstitutionalOrder(gameState);
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleInterveneBill = (
    targetId: string,
    targetKind: 'ddl' | 'dl',
    action: 'emendamento' | 'ostruzionismo'
  ) => {
    if (!gameState) return;
    const res = interveneOnPendingBill(gameState, targetId, targetKind, action);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, action === 'emendamento' ? 'success' : 'info');
  };

  const handleQuestionTime = (ministryId: MinistryId, topicId: string) => {
    if (!gameState) return;
    const res = executeQuestionTime(gameState, ministryId, topicId);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleProposeMotion = (motionId: string) => {
    if (!gameState) return;
    const res = proposeParliamentaryMotion(gameState, motionId);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'info');
  };

  const handleRecompactMajority = () => {
    if (!gameState) return;
    const res = recompactMajoritySummit(gameState);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleStreetMobilization = (
    targetId: string,
    targetKind: 'ddl' | 'dl',
    stance: 'pro' | 'contro'
  ) => {
    if (!gameState) return;
    const res = launchStreetMobilizationOnBill(gameState, targetId, targetKind, stance);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleReshuffleMinistry = (
    ministryId: MinistryId,
    newPartyId: string,
    newExecId?: string
  ) => {
    if (!gameState) return;
    const res = executeCabinetReshuffle(gameState, ministryId, newPartyId, newExecId);
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

  const handleChangeBallotType = (electionType: BallotElectionType, regionId?: RegionId) => {
    if (!gameState) return;
    playTactileClick();
    setGameState(setBallotCampaignType(gameState, electionType, regionId));
  };

  const handleOrganizeBanchetto = (regionId?: RegionId) => {
    if (!gameState) return;
    const res = organizeSignatureBanchetto(gameState, regionId);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handlePromoteAbrogative = (templateId: string) => {
    if (!gameState) return;
    const res = promoteAbrogativeReferendum(gameState, templateId);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleTriggerConstitutional = (lawId: string) => {
    if (!gameState) return;
    const res = triggerConstitutionalReferendum(gameState, lawId);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playBreakingNewsJingle();
    setGameState(res.nextState);
    showToast(res.feedback, 'info');
  };

  const handleBoostRefSignatures = () => {
    if (!gameState) return;
    const res = boostReferendumSignatures(gameState);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleSetRefStance = (stance: ReferendumStance) => {
    if (!gameState) return;
    const res = setReferendumStance(gameState, stance);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'info');
  };

  const handleFundRefCampaign = (tier: 'locale' | 'nazionale') => {
    if (!gameState) return;
    const res = fundReferendumCampaign(gameState, tier);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleDismissConcludedRef = () => {
    if (!gameState) return;
    playTactileClick();
    setGameState(dismissConcludedReferendum(gameState));
  };

  const handleAdvanceWeek = () => {
    if (!gameState) return;
    if (
      gameState.european?.activeElection &&
      !gameState.european.activeElection.postElectionResolved
    ) {
      setActiveTab('elezioni');
      showToast(
        'Completa prima la Notte delle Elezioni Europee in corso per avanzare di settimana.',
        'error'
      );
      return;
    }
    if (gameState.european?.postElectionFlow?.active) {
      showToast(
        'Completa prima l’insediamento a Strasburgo (Gruppo UE, Commissione e Commissario italiano) per avanzare di settimana.',
        'error'
      );
      return;
    }
    if (gameState.pendingBudgetLaw) {
      showToast('Approva prima la Legge di Bilancio in Parlamento per avanzare di settimana.', 'error');
      return;
    }
    if (gameState.quirinaleElection?.active) {
      setQuirinaleMinimized(false);
      showToast('Completa prima la Seduta Comune per l’Elezione del Presidente della Repubblica.', 'error');
      return;
    }
    const pendingCrises = getPendingCrisesCount(gameState);
    if (pendingCrises > 0) {
      setActiveTab('crisi');
      showToast(
        `Rispondi o premi "Salta / Nessuna dichiarazione" sui ${pendingCrises} eventi settimanali in Dossier & Crisi prima di avanzare.`,
        'error'
      );
      return;
    }
    const { nextState, notifications } = advanceWeek(gameState);
    setGameState(nextState);
    const triggeredEuElection = Boolean(
      nextState.european?.activeElection &&
        !nextState.european.activeElection.postElectionResolved
    );
    if (
      (nextState.election && !nextState.election.postElectionResolved) ||
      triggeredEuElection
    ) {
      setActiveTab('elezioni');
    }
    const hasBreakingNews =
      nextState.pendingBudgetLaw ||
      triggeredEuElection ||
      getWeeklyCrisesList(nextState).some((c) => c.event.severity === 'Critica') ||
      notifications.some(
        (n) =>
          n.includes('SCISSIONE') ||
          n.includes('Crisi') ||
          n.includes('Sessione di Bilancio') ||
          n.includes('Elezioni Europee')
      );
    if (hasBreakingNews && !nextState.election) {
      playBreakingNewsJingle();
    } else if (!nextState.election && !triggeredEuElection) {
      playTactileClick();
    }
    if (notifications.length > 0) {
      showToast(notifications[0], notifications[0].includes('SCISSIONE') ? 'error' : 'info');
    } else {
      const nextCount = getWeeklyCrisesList(nextState).length;
      showToast(
        `Settimana ${nextState.week} avviata: ${nextCount} ${nextCount === 1 ? 'nuovo dossier disponibile' : 'nuovi dossier disponibili'} in Crisi & Media.`,
        'info'
      );
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
    const playerSeats = getPlayerParliamentSeats(gameState);
    if (
      gameState.extraParliamentary ||
      playerSeats.isExtraParliamentary ||
      playerSeats.total <= 0
    ) {
      showToast(
        'Mozione di sfiducia riservata ai partiti presenti in Parlamento.',
        'error'
      );
      return;
    }
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
    const res = completePostElectionLegislature(gameState);
    setGameState(res.nextState);
    setActiveTab(res.targetTab);
    showToast(res.feedback, res.tone);
  };

  const handleDissolveParty = () => {
    deleteSaveSlot(activeSlot);
    setGameState(null);
    setSaveSlots(listSaveSlots());
    setSetupTargetSlot(activeSlot);
    setScreen('setup');
    showToast('Partito sciolto: slot corrente resettato per una nuova fondazione.', 'info');
  };

  const handleFormGovernment = (
    assignments: Partial<Record<MinistryId, string>>,
    execAssignments?: Partial<Record<MinistryId, string>>
  ) => {
    if (!gameState) return;
    const res = formGovernmentFromConsultations(gameState, assignments, execAssignments);
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
    setActiveTab(res.targetTab);
    showToast(res.feedback, 'info');
  };

  // --- Elezioni Europee (Parte 1) ---
  const handleEuSignatureDrive = (constituencyId: EuropeanConstituencyId) => {
    if (!gameState) return;
    const res = runEuSignatureDrive(gameState, constituencyId);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleEuExcludedStance = (
    stance: 'astensione' | 'sostegno',
    supportedPartyId?: string
  ) => {
    if (!gameState) return;
    const res = setEuExcludedStance(gameState, stance, supportedPartyId);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'info');
  };

  const handleNegotiateEuCartel = (partnerPartyId: string, customCartelName?: string) => {
    if (!gameState) return;
    const res = negotiateEuCartel(gameState, partnerPartyId, customCartelName);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleDissolveEuCartel = () => {
    if (!gameState) return;
    const res = dissolveEuCartel(gameState);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'info');
  };

  const handleSetEuHeadCandidate = (
    constituencyId: EuropeanConstituencyId,
    archetype: EuHeadCandidateArchetypeId
  ) => {
    if (!gameState) return;
    const res = setEuHeadCandidate(gameState, constituencyId, archetype);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleSetEuLeaderCandidacy = (
    mode: EuLeaderCandidacyMode,
    constituencyId?: EuropeanConstituencyId
  ) => {
    if (!gameState) return;
    const res = setEuLeaderCandidacy(gameState, mode, constituencyId);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'info');
  };

  const handleRunEuRally = (constituencyId: EuropeanConstituencyId) => {
    if (!gameState) return;
    const res = runEuConstituencyRally(gameState, constituencyId);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleRunEuTopicCampaign = (topicId: EuCampaignTopicId) => {
    if (!gameState) return;
    const res = runEuTopicCampaign(gameState, topicId);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleRunEuAbroadEvent = () => {
    if (!gameState) return;
    const res = runEuAbroadStudentsInitiative(gameState);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleAdvanceEuElectionStage = (finalJump = false) => {
    if (!gameState) return;
    playTactileClick();
    setGameState(advanceEuropeanElectionStage(gameState, finalJump));
  };

  const handleResolveEuLeaderDecision = (decision: 'bruxelles' | 'resta_italia') => {
    if (!gameState) return;
    const res = resolveEuropeanLeaderDecision(gameState, decision);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, decision === 'bruxelles' ? 'success' : 'info');
  };

  const handleCompleteEuElection = () => {
    if (!gameState) return;
    const res = completeEuropeanElection(gameState);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    if (res.nextState.european?.postElectionFlow?.active) {
      playBreakingNewsJingle();
    } else {
      playTactileClick();
    }
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  // --- Elezioni Europee (Parte 2: Gruppi UE, Commissione, Commissario & Direttive) ---
  const handleChooseEuGroup = (groupId: EuParliamentGroupId) => {
    if (!gameState) return;
    const res = chooseEuParliamentGroup(gameState, groupId);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
  };

  const handleVoteEuCommission = (vote: EuCommissionVoteStance) => {
    if (!gameState) return;
    const res = voteEuCommissionConfidence(gameState, vote);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, vote === 'contrario' ? 'info' : 'success');
  };

  const handleNominateEuCommissioner = (
    profileId: EuCommissionerProfileId,
    customName?: string
  ) => {
    if (!gameState) return;
    const res = nominateItalianEuCommissioner(gameState, profileId, customName);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    const rejected = Boolean(
      res.nextState.european?.postElectionFlow?.commissionerRejectedOnce &&
        res.nextState.european?.postElectionFlow?.step === 'commissioner'
    );
    if (rejected) {
      playBreakingNewsJingle();
    } else {
      playTactileClick();
    }
    setGameState(res.nextState);
    showToast(res.feedback, rejected ? 'error' : 'success');
  };

  const handleCloseEuPostElectionFlow = () => {
    if (!gameState) return;
    playTactileClick();
    const res = closeEuPostElectionFlow(gameState);
    setGameState(res.nextState);
    setActiveTab('elezioni');
    showToast(
      res.feedback ||
        'Insediamento a Strasburgo completato! Consulta il pannello "Presenza UE" in Elezioni e i Dossier da Bruxelles.',
      'success'
    );
  };

  const handleVoteEuDirective = (vote: EuCommissionVoteStance) => {
    if (!gameState) return;
    const res = voteEuDirective(gameState, vote);
    if (res.error) {
      showToast(res.error, 'error');
      return;
    }
    playTactileClick();
    setGameState(res.nextState);
    showToast(res.feedback, 'success');
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

  const legalModalElement = (
    <LegalModal
      isOpen={legalModalOpen}
      initialTab={legalModalTab}
      onClose={() => setLegalModalOpen(false)}
      onClearAllLocalData={handleClearAllLocalData}
      onOpenChangelog={handleOpenChangelog}
    />
  );

  const changelogModalElement = (
    <ChangelogModal
      isOpen={changelogOpen}
      onClose={() => setChangelogOpen(false)}
    />
  );

  const toastElement = toast ? (
    <div className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] right-3 left-3 sm:left-auto sm:bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:right-4 z-40 sm:max-w-md">
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
  ) : null;

  // Sezione dedicata Guida, Tutorial & Glossario dal Menu Principale
  if (screen === 'guide') {
    return (
      <div className="h-[100dvh] w-full max-w-full overflow-hidden overflow-x-hidden bg-[#090D16] text-slate-100 flex flex-col">
        {updateBannerElement}
        <div className="flex-1 min-h-0 overflow-hidden">
          <TabGuide
            onBack={() => setScreen('saved_games')}
            onOpenLegal={handleOpenLegal}
          />
        </div>
        {toastElement}
        {legalModalElement}
        {changelogModalElement}
      </div>
    );
  }

  // Schermata Home / "Le Mie Partite" (3 Slot Indipendenti)
  if (screen === 'saved_games' || (screen === 'playing' && !gameState)) {
    return (
      <div className="h-[100dvh] w-full max-w-full overflow-hidden overflow-x-hidden bg-[#090D16] text-slate-100 flex flex-col">
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
          onOpenGuide={() => {
            playTactileClick();
            setScreen('guide');
          }}
          onOpenLegal={handleOpenLegal}
          onOpenChangelog={handleOpenChangelog}
          hasUnreadChangelog={unreadChangelog}
        />
        {toastElement}
        {legalModalElement}
        {changelogModalElement}
      </div>
    );
  }

  // Wizard Creazione Nuova Partita (targetizzato su uno slot specifico)
  if (screen === 'setup') {
    return (
      <div className="min-h-[100dvh] lg:h-[100dvh] w-full max-w-full overflow-x-hidden lg:overflow-hidden bg-[#090D16] text-slate-100 flex flex-col">
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
          onOpenLegal={handleOpenLegal}
          onOpenChangelog={handleOpenChangelog}
          hasUnreadChangelog={unreadChangelog}
        />
        {toastElement}
        {legalModalElement}
        {changelogModalElement}
      </div>
    );
  }

  // Active War Room
  const activeGame = gameState!;
  const isParliamentLocked = getPlayerParliamentSeats(activeGame).isExtraParliamentary;
  const pendingCrisesCount = getPendingCrisesCount(activeGame);
  const tabs: {
    id: TabId;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    alert?: boolean;
    badgeCount?: number;
    locked?: boolean;
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
      id: 'territorio',
      label: 'Territorio & Sezioni',
      shortLabel: 'Territorio',
      icon: <MapPin className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'crisi',
      label: 'Dossier, Crisi e Media',
      shortLabel: 'Crisi & Media',
      icon: <Newspaper className="w-4 h-4 shrink-0" />,
      alert:
        pendingCrisesCount > 0 ||
        Boolean(
          activeGame.european?.activeDirective &&
            !activeGame.european.activeDirective.resolved &&
            (activeGame.european.euSeats[activeGame.playerPartyId] ?? 0) > 0
        ),
      badgeCount: pendingCrisesCount > 0 ? pendingCrisesCount : undefined,
    },
    {
      id: 'parlamento',
      label: 'Parlamento e Governo',
      shortLabel: 'Parlamento',
      icon: isParliamentLocked ? (
        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      ) : (
        <Scale className="w-4 h-4 shrink-0" />
      ),
      locked: isParliamentLocked,
      alert:
        !isParliamentLocked &&
        (activeGame.stateIndicators.spread >= 240 ||
          activeGame.stateIndicators.socialStability < 35 ||
          activeGame.regimeStatus === 'regime_autoritario' ||
          Boolean(activeGame.quirinaleElection?.active) ||
          (activeGame.activeDecreeLaws ?? []).some(
            (d) => d.status === 'in_conversione' && d.weeksRemaining <= 2
          ) ||
          (activeGame.pendingBills ?? []).some((b) => b.blockedByAmendments) ||
          Boolean(
            activeGame.lastFrancTireursEvent &&
              activeGame.lastFrancTireursEvent.wentUnder &&
              !activeGame.lastFrancTireursEvent.resolved
          ) ||
          (activeGame.isPrimeMinister &&
            Object.values(activeGame.allySatisfaction ?? {}).some((v) => v < 35))),
    },
    {
      id: 'partito',
      label: 'Partito, Dirigenti e Coalizioni',
      shortLabel: 'Partito',
      icon: <Users className="w-4 h-4 shrink-0" />,
      alert:
        Boolean(activeGame.activeScandal) ||
        ((activeGame.parties.find((p) => p.id === activeGame.playerPartyId)?.nationalPoll ?? 0) >=
          SCHISM_MIN_POLL &&
          ((activeGame.lowCohesionStreak ?? 0) > 0 ||
            isPartyCohesionCritical(activeGame.executives))),
    },
    {
      id: 'elezioni',
      label: 'Elezioni e Spoglio',
      shortLabel: 'Elezioni',
      icon: <Landmark className="w-4 h-4 shrink-0" />,
      alert:
        Boolean(activeGame.election) ||
        Boolean(activeGame.european?.postElectionFlow?.active) ||
        Boolean(
          activeGame.european?.activeElection &&
            !activeGame.european.activeElection.postElectionResolved
        ) ||
        (() => {
          const euWeek =
            activeGame.european?.nextElectionWeek ??
            activeGame.europeanElectionWeek ??
            getNextEuropeanElectionWeek(activeGame.week);
          const weeksToEu = Math.max(0, euWeek - activeGame.week);
          const sig = activeGame.european?.signatureCampaign;
          return (
            weeksToEu <= EU_SIGNATURE_WINDOW_WEEKS &&
            Boolean(
              sig &&
                !sig.exempt &&
                !sig.excludedFromBallot &&
                sig.collectedSignatures < sig.targetSignatures
            )
          );
        })(),
    },
    {
      id: 'guida',
      label: 'Guida, Tutorial & Glossario',
      shortLabel: 'Guida',
      icon: <BookOpen className="w-4 h-4 shrink-0" />,
    },
  ];

  return (
    <div className="h-[100dvh] w-full max-w-full overflow-hidden overflow-x-hidden bg-[#090D16] text-slate-100 flex flex-col">
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
        onOpenCrisesTab={() => {
          playTactileClick();
          setActiveTab('crisi');
        }}
        onOpenFinancesTab={() => {
          playTactileClick();
          setActiveTab('partito');
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
              title={
                tab.locked
                  ? 'Sezione bloccata: partito extra-parlamentare (0 seggi). Supera il 3% alle elezioni.'
                  : undefined
              }
              onClick={() => {
                playTactileClick();
                setActiveTab(tab.id);
              }}
              className={`relative px-3 sm:px-3.5 py-2.5 sm:py-3 text-xs font-medium flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                active
                  ? tab.locked
                    ? 'text-amber-300 border-b-2 border-amber-400'
                    : 'text-cyan-300 border-b-2 border-cyan-400'
                  : tab.locked
                    ? 'text-slate-500 hover:text-amber-300 border-b-2 border-transparent'
                    : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
              }`}
            >
              {tab.icon}
              <span className="hidden md:inline">{tab.label}</span>
              <span className="md:hidden">{tab.shortLabel}</span>
              {tab.locked && (
                <span className="text-[10px] font-mono text-amber-400/90 hidden sm:inline">
                  (0 seggi)
                </span>
              )}
              {typeof tab.badgeCount === 'number' && tab.badgeCount > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 font-mono text-[10px] font-bold">
                  {tab.badgeCount}
                </span>
              ) : (
                tab.alert && (
                  <AlertCircle
                    aria-label="Richiede attenzione"
                    className="w-3.5 h-3.5 text-rose-400 shrink-0"
                  />
                )
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
            onDowngradeChapter={handleDowngradeChapter}
          />
        )}
        {activeTab === 'campagna' && (
          <TabCampaign
            state={activeGame}
            onExecuteAction={handleExecuteAction}
            onStartTvDuel={handleStartTvDuel}
            onEmergencyFundraiser={handleEmergencyFundraiser}
          />
        )}
        {activeTab === 'territorio' && (
          <TabTerritory
            state={activeGame}
            onOpenOrUpgradeChapter={handleOpenHq}
            onDowngradeChapter={handleDowngradeChapter}
            onCloseChapter={handleCloseHq}
            onOrganizeBanchetto={handleOrganizeBanchetto}
          />
        )}
        {activeTab === 'crisi' && (
          <TabCrisesMedia
            state={activeGame}
            onResolveCrisis={handleResolveCrisis}
            onSkipCrisis={handleSkipCrisis}
            onPromoteAbrogative={handlePromoteAbrogative}
            onTriggerConstitutional={handleTriggerConstitutional}
            onBoostRefSignatures={handleBoostRefSignatures}
            onSetRefStance={handleSetRefStance}
            onFundRefCampaign={handleFundRefCampaign}
            onDismissConcludedRef={handleDismissConcludedRef}
            onVoteEuDirective={handleVoteEuDirective}
          />
        )}
        {activeTab === 'parlamento' && (
          <TabParliament
            state={activeGame}
            onVoteLaw={handleVoteLaw}
            onConvertDecree={handleConvertDecree}
            onConfidencePendingBill={handleConfidencePendingBill}
            onInterveneBill={handleInterveneBill}
            onQuestionTime={handleQuestionTime}
            onProposeMotion={handleProposeMotion}
            onRecompactMajority={handleRecompactMajority}
            onStreetMobilization={handleStreetMobilization}
            onLaunchCommission={handleLaunchCommission}
            onOpenQuirinale={() => {
              playTactileClick();
              setQuirinaleMinimized(false);
            }}
            onReshuffleMinistry={handleReshuffleMinistry}
            onRestoreDemocracy={handleRestoreDemocracy}
            onNavigateTab={(tab) => {
              playTactileClick();
              setActiveTab(tab);
            }}
            onPromoteAbrogative={handlePromoteAbrogative}
            onTriggerConstitutional={handleTriggerConstitutional}
            onBoostRefSignatures={handleBoostRefSignatures}
            onSetRefStance={handleSetRefStance}
            onFundRefCampaign={handleFundRefCampaign}
            onDismissConcludedRef={handleDismissConcludedRef}
          />
        )}
        {activeTab === 'partito' && (
          <TabPartyCoalitions
            state={activeGame}
            onManageExecutive={handleManageExecutive}
            onNegotiateCoalition={handleNegotiateCoalition}
            onChangeBallotType={handleChangeBallotType}
            onOrganizeBanchetto={handleOrganizeBanchetto}
            onLaunchMembership={handleLaunchMembership}
            onClaimTwoPerThousand={handleClaimTwoPerThousand}
            onHostFundraiser={handleHostFundraiser}
            onEmergencyFundraiser={handleEmergencyFundraiser}
            onResolveScandal={handleResolveScandal}
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
            onDissolveParty={handleDissolveParty}
            onStartFreshGame={() => {
              setSaveSlots(listSaveSlots());
              setScreen('saved_games');
            }}
            onEuSignatureDrive={handleEuSignatureDrive}
            onEuExcludedStance={handleEuExcludedStance}
            onNegotiateEuCartel={handleNegotiateEuCartel}
            onDissolveEuCartel={handleDissolveEuCartel}
            onSetEuHeadCandidate={handleSetEuHeadCandidate}
            onSetEuLeaderCandidacy={handleSetEuLeaderCandidacy}
            onRunEuRally={handleRunEuRally}
            onRunEuTopicCampaign={handleRunEuTopicCampaign}
            onRunEuAbroadEvent={handleRunEuAbroadEvent}
            onAdvanceEuElectionStage={handleAdvanceEuElectionStage}
            onResolveEuLeaderDecision={handleResolveEuLeaderDecision}
            onCompleteEuElection={handleCompleteEuElection}
            onVoteEuDirective={handleVoteEuDirective}
          />
        )}
        {activeTab === 'guida' && <TabGuide onOpenLegal={handleOpenLegal} />}

        {/* Crisp Action Feedback Toast */}
        {toastElement}
      </main>

      {/* Modale Post-Voto Europeo (Gruppo Parlamentare UE, Fiducia Commissione & Commissario Italiano) */}
      {activeGame.european?.postElectionFlow?.active &&
        !activeGame.election &&
        !activeGame.european?.activeElection && (
          <EuropeanPostElectionModal
            state={activeGame}
            onChooseGroup={handleChooseEuGroup}
            onVoteCommission={handleVoteEuCommission}
            onNominateCommissioner={handleNominateEuCommissioner}
            onCloseFlow={handleCloseEuPostElectionFlow}
          />
        )}

      {/* Modale Bloccante Legge di Bilancio Annuale (Manovra Finanziaria) */}
      {activeGame.pendingBudgetLaw &&
        !activeGame.election &&
        !activeGame.european?.activeElection &&
        !activeGame.european?.postElectionFlow?.active && (
          <BudgetLawModal
            state={activeGame}
            onVoteBudgetLaw={handleVoteBudgetLaw}
          />
        )}

      {/* Modale Bloccante Elezione Presidente della Repubblica (Quirinale · 658 Grandi Elettori) */}
      {activeGame.quirinaleElection?.active &&
        !quirinaleMinimized &&
        !activeGame.pendingBudgetLaw &&
        !activeGame.election &&
        !activeGame.european?.activeElection &&
        !activeGame.european?.postElectionFlow?.active && (
          <QuirinaleElectionModal
            state={activeGame}
            onProposeCandidate={handleProposeQuirinaleCandidate}
            onNegotiateSupport={handleNegotiateQuirinale}
            onRunBallot={handleRunQuirinaleBallot}
            onCloseElection={handleCloseQuirinaleElection}
            onMinimize={() => setQuirinaleMinimized(true)}
          />
        )}

      {/* Modale Mini-Gioco Duello TV 1 contro 1 (3 Round) */}
      {tvDuelOpponentId &&
        !activeGame.pendingBudgetLaw &&
        !activeGame.quirinaleElection?.active &&
        !activeGame.election &&
        !activeGame.european?.activeElection &&
        !activeGame.european?.postElectionFlow?.active && (
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
          onOpenChangelog={handleOpenChangelog}
          hasUnreadChangelog={unreadChangelog}
        />
      )}
      {/* Privacy, Note Legali & Fonti Dati Modal */}
      {legalModalElement}
      {/* Novità & Aggiornamenti (Changelog) Modal */}
      {changelogModalElement}
    </div>
  );
}

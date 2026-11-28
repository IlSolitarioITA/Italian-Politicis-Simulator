import React, { useMemo, useState } from 'react';
import {
  EU_ABROAD_STUDENTS_EVENT_COST,
  EU_CAMPAIGN_TOPICS,
  EU_CAMPAIGN_WINDOW_WEEKS,
  EU_CARTEL_NEGOTIATION_COST,
  EU_CONSTITUENCY_RALLY_COST,
  EU_HEAD_CANDIDATE_ARCHETYPES,
  EU_LEADER_CANDIDACY_OPTIONS,
  EU_PARLIAMENT_GROUPS,
  EU_SIGNATURE_DRIVE_COST,
  EU_SIGNATURE_TARGET,
  EU_SIGNATURE_WINDOW_WEEKS,
  EU_THRESHOLD_PCT,
  EU_TOTAL_SEATS,
  EUROPEAN_CONSTITUENCIES,
  getEuBudgetRelief,
} from '../data/european';
import { formatGameDate } from '../data/presets';
import {
  calculateParliamentSeats,
  ensureEuropeanState,
  estimateEuropeanVoteSnapshot,
  getCurrentParliamentSeats,
  getEligibleEuCartelPartners,
  getPlayerParliamentSeats,
  syncBallotSignatureExemption,
  syncEuSignatureExemption,
} from '../engine/simulation';
import {
  EuCampaignTopicId,
  EuCommissionVoteStance,
  EuHeadCandidateArchetypeId,
  EuLeaderCandidacyMode,
  EuropeanConstituencyId,
  GameState,
  MinistryId,
} from '../types/game';
import { playTactileClick } from '../utils/soundEngine';
import { ElectionNightView } from './ElectionNightView';
import { EuropeanElectionNightView } from './EuropeanElectionNightView';
import { HemicycleSvg } from './HemicycleSvg';
import { PartyEmblem } from './PartyEmblem';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  FileSignature,
  Flame,
  Globe,
  Handshake,
  Landmark,
  Lock,
  MapPin,
  Megaphone,
  Plane,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';

interface TabElectionsProps {
  state: GameState;
  onTriggerEarlyElection: () => void;
  onAdvanceElectionStage: (finalJump?: boolean) => void;
  onCompletePostElection: () => void;
  onFormGovernment: (
    assignments: Partial<Record<MinistryId, string>>,
    execAssignments?: Partial<Record<MinistryId, string>>
  ) => void;
  onDeclineMandate: () => void;
  onDissolveParty: () => void;
  onStartFreshGame: () => void;
  // Elezioni Europee (Blocco C4-A1)
  onEuSignatureDrive: (constituencyId: EuropeanConstituencyId) => void;
  onEuExcludedStance: (stance: 'astensione' | 'sostegno', supportedPartyId?: string) => void;
  onNegotiateEuCartel: (partnerPartyId: string, customCartelName?: string) => void;
  onDissolveEuCartel: () => void;
  onSetEuHeadCandidate: (
    constituencyId: EuropeanConstituencyId,
    archetype: EuHeadCandidateArchetypeId
  ) => void;
  onSetEuLeaderCandidacy: (
    mode: EuLeaderCandidacyMode,
    constituencyId?: EuropeanConstituencyId
  ) => void;
  onRunEuRally: (constituencyId: EuropeanConstituencyId) => void;
  onRunEuTopicCampaign: (topicId: EuCampaignTopicId) => void;
  onRunEuAbroadEvent: () => void;
  onAdvanceEuElectionStage: (finalJump?: boolean) => void;
  onResolveEuLeaderDecision: (decision: 'bruxelles' | 'resta_italia') => void;
  onCompleteEuElection: () => void;
  onVoteEuDirective?: (vote: EuCommissionVoteStance) => void;
}

export const TabElections: React.FC<TabElectionsProps> = ({
  state,
  onTriggerEarlyElection,
  onAdvanceElectionStage,
  onCompletePostElection,
  onFormGovernment,
  onDeclineMandate,
  onDissolveParty,
  onStartFreshGame,
  onEuSignatureDrive,
  onEuExcludedStance,
  onNegotiateEuCartel,
  onDissolveEuCartel,
  onSetEuHeadCandidate,
  onSetEuLeaderCandidacy,
  onRunEuRally,
  onRunEuTopicCampaign,
  onRunEuAbroadEvent,
  onAdvanceEuElectionStage,
  onResolveEuLeaderDecision,
  onCompleteEuElection,
  onVoteEuDirective,
}) => {
  const eu = useMemo(() => ensureEuropeanState(state), [state]);
  const weeksToEu = Math.max(0, eu.nextElectionWeek - state.week);
  const euDateInfo = formatGameDate(eu.nextElectionWeek);
  const euCampaignWindowOpen = weeksToEu <= EU_CAMPAIGN_WINDOW_WEEKS && weeksToEu > 0;
  const euSigWindowOpen = weeksToEu <= EU_SIGNATURE_WINDOW_WEEKS && weeksToEu > 0;

  const [subTab, setSubTab] = useState<'politiche' | 'europee'>(() =>
    euSigWindowOpen ? 'europee' : 'politiche'
  );
  const [hemicycleView, setHemicycleView] = useState<'current' | 'projection'>('current');
  const [sigDriveConst, setSigDriveConst] = useState<EuropeanConstituencyId>('nord_ovest');
  const [rallyConst, setRallyConst] = useState<EuropeanConstituencyId>('nord_ovest');
  const [customCartelName, setCustomCartelName] = useState('');
  const [endorsePartyId, setEndorsePartyId] = useState<string>('');

  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const projectedSeats = useMemo(
    () => calculateParliamentSeats(state.parties, state.electoralLaw),
    [state.parties, state.electoralLaw]
  );
  const currentParliamentSeats = useMemo(() => {
    const seats = getCurrentParliamentSeats(state);
    if (!state.extraParliamentary) return seats;
    return seats.map((s) =>
      s.partyId === state.playerPartyId ? { ...s, camera: 0, senato: 0 } : s
    );
  }, [state]);
  const playerParliamentSeats = useMemo(() => getPlayerParliamentSeats(state), [state]);
  const isPlayerExtraParliamentary = Boolean(
    state.extraParliamentary ||
      playerParliamentSeats.isExtraParliamentary ||
      playerParliamentSeats.total === 0
  );

  const euSig = useMemo(() => syncEuSignatureExemption(state), [state]);
  const euSnapshot = useMemo(() => estimateEuropeanVoteSnapshot(state, false), [state]);
  const eligibleCartelPartners = useMemo(() => getEligibleEuCartelPartners(state), [state]);

  const coalitionMembers = state.parties.filter(
    (p) =>
      p.id !== 'altri' &&
      (p.id === player.id ||
        (Boolean(player.coalitionId) && p.coalitionId === player.coalitionId))
  );
  const hasAllies = coalitionMembers.some((m) => m.id !== player.id);
  const playerBlocLabel = hasAllies ? state.coalitionName : player.name;

  // 1. LIVE NATIONAL ELECTION NIGHT VIEW
  if (state.election) {
    return (
      <ElectionNightView
        state={state}
        onAdvanceElectionStage={onAdvanceElectionStage}
        onCompletePostElection={onCompletePostElection}
        onFormGovernment={onFormGovernment}
        onDeclineMandate={onDeclineMandate}
        onDissolveParty={onDissolveParty}
        onStartFreshGame={onStartFreshGame}
      />
    );
  }

  // 2. LIVE EUROPEAN ELECTION NIGHT VIEW (3-Phase Broadcast)
  if (eu.activeElection && !eu.activeElection.postElectionResolved) {
    return (
      <EuropeanElectionNightView
        state={{ ...state, european: eu }}
        onAdvanceStage={onAdvanceEuElectionStage}
        onResolveLeaderDecision={onResolveEuLeaderDecision}
        onCompleteElection={onCompleteEuElection}
      />
    );
  }

  // 3. PRE-ELECTION VIEW (Politiche + Elezioni Europee)
  const weeksRemaining = Math.max(0, state.electionWeek - state.week);
  const coalCamera = coalitionMembers.reduce(
    (acc, m) => acc + (projectedSeats.find((s) => s.partyId === m.id)?.camera ?? 0),
    0
  );
  const coalSenato = coalitionMembers.reduce(
    (acc, m) => acc + (projectedSeats.find((s) => s.partyId === m.id)?.senato ?? 0),
    0
  );
  const coalPoll = coalitionMembers.reduce((acc, m) => acc + m.nationalPoll, 0);

  const playerEuEstVote = euSnapshot.partyNationalVotes[player.id] ?? player.nationalPoll;
  const playerEuProjSeats =
    euSnapshot.seatProjection.seats.find((s) => s.partyId === player.id)?.totalSeats ?? 0;
  const playerSittingEuSeats = eu.euSeats[player.id] ?? 0;
  const sigPct = Math.min(
    100,
    Math.round((euSig.collectedSignatures / Math.max(1, euSig.targetSignatures)) * 100)
  );
  const euNeedsAttention =
    euCampaignWindowOpen || (euSigWindowOpen && !euSig.exempt && !euSig.excludedFromBallot && sigPct < 100);

  const sittingEuDelegation = state.parties
    .filter((p) => p.id !== 'altri' && (eu.euSeats[p.id] ?? 0) > 0)
    .sort((a, b) => (eu.euSeats[b.id] ?? 0) - (eu.euSeats[a.id] ?? 0));

  const endorsableParties = state.parties
    .filter((p) => p.id !== 'altri' && p.id !== player.id)
    .sort((a, b) => b.relationWithPlayer - a.relationWithPlayer);

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden war-scroll p-3 sm:p-4 lg:p-5">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Dual Countdown & Section Switcher (Politiche ↔ Europee) */}
        <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="inline-flex p-1 rounded-lg bg-[#090D16] border border-slate-800 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => {
                playTactileClick();
                setSubTab('politiche');
              }}
              className={`flex-1 lg:flex-initial px-3.5 py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                subTab === 'politiche'
                  ? 'bg-slate-800 text-slate-50 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Landmark className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Elezioni Politiche</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playTactileClick();
                setSubTab('europee');
              }}
              className={`flex-1 lg:flex-initial px-3.5 py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                subTab === 'europee'
                  ? 'bg-blue-600/25 text-blue-100 border border-blue-500/55'
                  : 'text-slate-400 hover:text-blue-200 border border-transparent'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Elezioni Europee (76 Seggi)</span>
              {euNeedsAttention && (
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center sm:gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-[#090D16] border border-slate-800 text-xs font-mono tabular-nums">
              <div className="text-[10px] text-slate-400 font-sans">Politiche Nazionali</div>
              <div className="font-bold text-amber-400">
                tra {weeksRemaining} {weeksRemaining === 1 ? 'sett.' : 'sett.'}
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#090D16] border border-blue-500/35 text-xs font-mono tabular-nums">
              <div className="text-[10px] text-blue-300 font-sans">
                Europee · {euDateInfo.monthName} {euDateInfo.year}
              </div>
              <div className="font-bold text-blue-200">
                tra {weeksToEu} {weeksToEu === 1 ? 'sett.' : 'sett.'}
              </div>
            </div>
          </div>
        </section>

        {subTab === 'politiche' ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <section className="xl:col-span-7 bg-[#111827] border border-slate-800/90 rounded-xl p-4 sm:p-5 space-y-5 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <p className="text-xs font-medium text-cyan-400">Sala Controllo Elettorale</p>
                  <h2 className="text-2xl font-bold text-slate-50 mt-1">
                    Verso le Elezioni Politiche
                  </h2>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className="text-xs text-slate-400">Scadenza elettorale</div>
                  <div className="text-xl font-bold text-amber-400">
                    {weeksRemaining} {weeksRemaining === 1 ? 'settimana' : 'settimane'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg bg-[#090D16] border border-slate-800">
                  <div className="text-xs text-slate-400">Consenso {playerBlocLabel}</div>
                  <div className="font-mono text-xl font-bold tabular-nums text-cyan-300 mt-1">
                    {coalPoll.toFixed(1)}%
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-[#090D16] border border-slate-800">
                  <div className="text-xs text-slate-400">Proiezione Camera</div>
                  <div
                    className={`font-mono text-xl font-bold tabular-nums mt-1 ${
                      coalCamera >= 201 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {coalCamera} <span className="text-xs text-slate-500">/ 201</span>
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-[#090D16] border border-slate-800">
                  <div className="text-xs text-slate-400">Proiezione Senato</div>
                  <div
                    className={`font-mono text-xl font-bold tabular-nums mt-1 ${
                      coalSenato >= 101 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {coalSenato} <span className="text-xs text-slate-500">/ 101</span>
                  </div>
                </div>
              </div>

              {/* Stato Raccolta Firme Liste Politiche per Partiti Extra-Parlamentari */}
              {(() => {
                const ballot = syncBallotSignatureExemption(state);
                if (ballot.exempt) return null;
                const pct = Math.min(
                  100,
                  Math.round(
                    (ballot.collectedSignatures / Math.max(1, ballot.targetSignatures)) * 100
                  )
                );
                const ready = pct >= 100 && !ballot.excludedFromBallot;
                return (
                  <div
                    className={`p-3.5 rounded-xl border space-y-2 ${
                      ballot.excludedFromBallot
                        ? 'bg-rose-950/30 border-rose-500/50'
                        : ready
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : 'bg-amber-950/20 border-amber-500/45'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                        {ballot.excludedFromBallot ? (
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        ) : (
                          <FileSignature className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span>
                          Ammissione Lista ({ballot.electionType}) · Chiusura Sett.{' '}
                          {ballot.deadlineWeek}
                        </span>
                      </span>
                      <span className="font-mono font-bold tabular-nums text-slate-100">
                        {ballot.collectedSignatures.toLocaleString('it-IT')} /{' '}
                        {ballot.targetSignatures.toLocaleString('it-IT')} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#090D16] border border-slate-800 overflow-hidden">
                      <div
                        className={`h-full ${
                          ballot.excludedFromBallot
                            ? 'bg-rose-500'
                            : ready
                              ? 'bg-emerald-400'
                              : 'bg-amber-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      {ballot.excludedFromBallot
                        ? 'Lista esclusa dalla scheda: firme insufficienti entro la chiusura. Apparentati con un partito in Parlamento nella scheda Partito per rientrare.'
                        : ready
                          ? 'Soglia firme completata al 100%: il tuo simbolo sarà presente sulle schede elettorali.'
                          : 'Attenzione: se apri le urne o arrivi alla chiusura liste sotto il 100% senza apparentamento, la tua lista verrà esclusa dal voto. Organizza banchetti nella scheda Partito.'}
                    </p>
                  </div>
                );
              })()}

              <div
                className={`p-4 rounded-xl bg-[#090D16] border space-y-3 ${
                  isPlayerExtraParliamentary ? 'border-slate-800' : 'border-rose-500/35'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isPlayerExtraParliamentary ? (
                    <Lock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  ) : (
                    <Flame className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">
                      Mozione di Sfiducia e Scioglimento Anticipato
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {isPlayerExtraParliamentary
                        ? 'Solo i partiti con rappresentanza parlamentare possono presentare o votare una mozione di sfiducia in Aula. Con 0 seggi in Camera e Senato dovrai attendere la scadenza elettorale.'
                        : 'Se ritieni di avere già il picco nei sondaggi e i numeri pronti per superare quota 201 deputati e 101 senatori, puoi forzare la crisi parlamentare e aprire immediatamente la Notte Elettorale.'}
                    </p>
                  </div>
                </div>
                {isPlayerExtraParliamentary ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      Riservato ai partiti presenti in Parlamento (seggi attuali: 0).
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={onTriggerEarlyElection}
                      className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-display font-bold text-xs transition-colors cursor-pointer"
                    >
                      Vota la Sfiducia · Apri Subito le Urne
                    </button>
                  </div>
                )}
              </div>
            </section>

            <section className="xl:col-span-5 bg-[#111827] border border-slate-800/90 rounded-xl p-4 sm:p-5 flex flex-col gap-3 min-w-0">
              <div
                role="tablist"
                aria-label="Modalità visualizzazione emiciclo"
                className="grid grid-cols-2 gap-1 p-1 bg-[#090D16] border border-slate-800 rounded-lg"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={hemicycleView === 'current'}
                  onClick={() => {
                    playTactileClick();
                    setHemicycleView('current');
                  }}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold leading-tight text-center transition-colors cursor-pointer ${
                    hemicycleView === 'current'
                      ? 'bg-slate-800 text-slate-50 border border-slate-700/80'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  Parlamento Attuale (in carica)
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={hemicycleView === 'projection'}
                  onClick={() => {
                    playTactileClick();
                    setHemicycleView('projection');
                  }}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold leading-tight text-center transition-colors cursor-pointer ${
                    hemicycleView === 'projection'
                      ? 'bg-amber-500/15 text-amber-200 border border-amber-500/45'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  Proiezione Sondaggi (se si votasse oggi)
                </button>
              </div>

              <div className="flex-1 min-h-0">
                <HemicycleSvg
                  parties={state.parties}
                  seats={
                    hemicycleView === 'current' ? currentParliamentSeats : projectedSeats
                  }
                  playerPartyId={state.playerPartyId}
                  isProjection={hemicycleView === 'projection'}
                  title={
                    hemicycleView === 'projection'
                      ? 'Proiezione Emiciclo (se si votasse oggi)'
                      : 'Parlamento Attuale (in carica)'
                  }
                  subtitle={
                    hemicycleView === 'projection'
                      ? 'Stima basata sui sondaggi attuali; i seggi reali cambiano solo dopo il voto'
                      : 'Seggi reali attualmente detenuti nella Legislatura in carica'
                  }
                />
              </div>

              {/* Elenco completo dei partiti con almeno 1 seggio tra Camera e Senato + Gruppo Misto */}
              {(() => {
                const activeSeats =
                  hemicycleView === 'current' ? currentParliamentSeats : projectedSeats;
                const byId = new Map<string, { camera: number; senato: number }>();
                for (const s of activeSeats) {
                  byId.set(s.partyId, { camera: s.camera, senato: s.senato });
                }
                const seatedRows = state.parties
                  .filter((p) => p.id !== 'altri')
                  .map((p) => {
                    const s = byId.get(p.id) ?? { camera: 0, senato: 0 };
                    return {
                      id: p.id,
                      name: p.name,
                      acronym: p.acronym,
                      color: p.color,
                      isInGovernment: p.isInGovernment,
                      isPlayer: p.id === state.playerPartyId,
                      camera: s.camera,
                      senato: s.senato,
                      total: s.camera + s.senato,
                    };
                  })
                  .filter((r) => r.total > 0)
                  .sort((a, b) => b.total - a.total || b.camera - a.camera);

                const namedCam = seatedRows.reduce((acc, r) => acc + r.camera, 0);
                const namedSen = seatedRows.reduce((acc, r) => acc + r.senato, 0);
                const explicitAltri = byId.get('altri') ?? { camera: 0, senato: 0 };
                const mistoCam = namedCam > 0 ? Math.max(0, 400 - namedCam) : explicitAltri.camera;
                const mistoSen = namedSen > 0 ? Math.max(0, 200 - namedSen) : explicitAltri.senato;

                return (
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-200">
                        {hemicycleView === 'projection'
                          ? 'Partiti in Parlamento (Proiezione)'
                          : 'Gruppi Parlamentari in Carica'}
                      </span>
                      <span className="font-mono tabular-nums text-slate-400">
                        {namedCam + mistoCam} Cam · {namedSen + mistoSen} Sen
                      </span>
                    </div>
                    <div className="max-h-44 overflow-y-auto war-scroll pr-1 space-y-1">
                      {seatedRows.map((row) => (
                        <div
                          key={row.id}
                          className={`flex items-center justify-between gap-2 px-2 py-1 rounded-md text-[11px] ${
                            row.isPlayer
                              ? 'bg-cyan-950/35 border border-cyan-500/40'
                              : 'bg-[#090D16] border border-slate-800/70'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              style={{ backgroundColor: row.color }}
                              className="w-2 h-2 rounded-xs shrink-0"
                            />
                            <span
                              className={`truncate ${
                                row.isPlayer ? 'text-cyan-200 font-semibold' : 'text-slate-200'
                              }`}
                            >
                              {row.name}
                            </span>
                            {hemicycleView === 'current' && (
                              <span
                                className={`text-[9px] font-mono shrink-0 ${
                                  row.isInGovernment ? 'text-emerald-400' : 'text-slate-500'
                                }`}
                              >
                                {row.isInGovernment ? 'Gov' : 'Opp'}
                              </span>
                            )}
                          </div>
                          <div className="font-mono tabular-nums shrink-0 text-[10px]">
                            <span className={row.camera > 0 ? 'text-slate-100' : 'text-slate-600'}>
                              {row.camera}C
                            </span>
                            <span className="text-slate-600"> / </span>
                            <span className={row.senato > 0 ? 'text-slate-100' : 'text-slate-600'}>
                              {row.senato}S
                            </span>
                          </div>
                        </div>
                      ))}
                      {mistoCam + mistoSen > 0 && (
                        <div className="flex items-center justify-between gap-2 px-2 py-1 rounded-md text-[11px] bg-[#090D16] border border-slate-800/60">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              style={{ backgroundColor: '#64748B' }}
                              className="w-2 h-2 rounded-xs shrink-0"
                            />
                            <span className="truncate text-slate-400">
                              Gruppo Misto / Non Iscritti
                            </span>
                          </div>
                          <div className="font-mono tabular-nums shrink-0 text-[10px] text-slate-300">
                            {mistoCam}C / {mistoSen}S
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </section>
          </div>
        ) : (
          /* ================================================================
           * SOTTO-SEZIONE DEDICATA: ELEZIONI EUROPEE (BLOCCO C4-A1)
           * ================================================================ */
          <div className="space-y-4">
            {/* KPI Europei */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#111827] border border-blue-500/35">
                <div className="text-[11px] text-blue-300">Prossime Elezioni Europee</div>
                <div className="font-mono text-lg font-bold text-slate-50 mt-1">
                  {euDateInfo.monthName} {euDateInfo.year}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
                  Cadenza quinquennale · tra {weeksToEu} settimane
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800">
                <div className="text-[11px] text-slate-400">Stima Voto Europeo ({player.acronym})</div>
                <div className="font-mono text-lg font-bold tabular-nums text-cyan-300 mt-1">
                  {euSig.excludedFromBallot ? 'Esclusa' : `${playerEuEstVote.toFixed(1)}%`}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Affluenza stimata {euSnapshot.nationalTurnout.toFixed(1)}% · Soglia {EU_THRESHOLD_PCT.toFixed(0)}%
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800">
                <div className="text-[11px] text-slate-400">Eurodeputati ({player.acronym})</div>
                <div className="font-mono text-lg font-bold tabular-nums text-emerald-300 mt-1">
                  {playerSittingEuSeats} in carica ·{' '}
                  <span className="text-amber-300">{playerEuProjSeats} stim.</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Su {EU_TOTAL_SEATS} seggi italiani (Camera/Senato separati)
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800">
                <div className="text-[11px] text-slate-400">Stato Lista / Cartello</div>
                <div className="text-sm font-bold mt-1 flex items-center gap-1.5">
                  {euSig.excludedFromBallot ? (
                    <span className="text-rose-400">Esclusa dalle schede</span>
                  ) : euSig.exempt ? (
                    <span className="text-emerald-400">Ammessa (Esente firme)</span>
                  ) : sigPct >= 100 ? (
                    <span className="text-emerald-400">Ammessa (150k firme OK)</span>
                  ) : (
                    <span className="text-amber-300">Firme {sigPct}% / 150.000</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {eu.cartel
                    ? `Cartello: ${eu.cartel.name} (${euSnapshot.seatProjection.cartelCombinedPct.toFixed(1)}%)`
                    : 'Lista autonoma'}
                </div>
              </div>
            </section>

            {/* Panoramica delle 5 Circoscrizioni Ufficiali (Eligendo — 76 seggi) */}
            <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Le 5 Circoscrizioni Ufficiali Italiane (Eligendo · 76 Seggi)</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Proporzionale puro su base nazionale (sbarramento 4%) con ripartizione dei 76 seggi nelle 5 circoscrizioni tramite quozienti naturali e più alti resti.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded bg-blue-500/15 border border-blue-500/40 text-blue-200 font-mono text-[11px] font-bold">
                  Totale: {EU_TOTAL_SEATS} seggi
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2.5">
                {EUROPEAN_CONSTITUENCIES.map((c) => {
                  const estPct = euSnapshot.constituencyVotes[c.id]?.[player.id] ?? 0;
                  const estTurn = euSnapshot.constituencyTurnout[c.id] ?? 49;
                  const archId = eu.campaign.headCandidates[c.id];
                  const arch =
                    EU_HEAD_CANDIDATE_ARCHETYPES.find((a) => a.id === archId) ??
                    EU_HEAD_CANDIDATE_ARCHETYPES[2];
                  const boost = eu.campaign.constituencyBoosts[c.id] ?? 0;
                  const leaderHere =
                    eu.campaign.leaderCandidacyMode === 'all_five' ||
                    (eu.campaign.leaderCandidacyMode === 'single' &&
                      eu.campaign.leaderCandidacyConstituency === c.id);

                  return (
                    <div
                      key={c.id}
                      className="p-3 rounded-lg bg-[#090D16] border border-slate-800 space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-100">{c.shortName}</span>
                          <span className="font-mono text-[11px] font-bold text-amber-300">
                            {c.seats} seggi
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">{c.regionsLabel}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between font-mono">
                          <span className="text-slate-400">Stima {player.acronym}:</span>
                          <span className="font-bold text-cyan-300">
                            {euSig.excludedFromBallot ? '—' : `${estPct.toFixed(1)}%`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between font-mono text-[10px]">
                          <span className="text-slate-500">Affluenza UE:</span>
                          <span className="text-slate-300">{estTurn.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] pt-1">
                          <span className="text-blue-300 font-medium truncate">
                            {arch.shortLabel}
                          </span>
                          {boost > 0 && (
                            <span className="font-mono text-emerald-400">+{boost.toFixed(1)}%</span>
                          )}
                        </div>
                        {leaderHere && (
                          <div className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-200 font-semibold text-center">
                            Leader Capolista
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Grid 2 colonne: Firme 150.000 & Cartelli 4% */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              {/* Raccolta 150.000 Firme / Esenzione */}
              <section className="xl:col-span-6 bg-[#111827] border border-slate-800/90 rounded-xl p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Ammissione Lista &amp; Raccolta 150.000 Firme</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    Finestra: ultime {EU_SIGNATURE_WINDOW_WEEKS} sett.
                  </span>
                </div>

                {euSig.exempt ? (
                  <div className="p-3.5 rounded-lg bg-emerald-950/25 border border-emerald-500/45 flex items-start gap-2.5 text-xs text-emerald-200">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-emerald-100">Lista Automaticamente Esente</div>
                      <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                        {euSig.exemptReason ??
                          'I partiti già rappresentati in Parlamento nazionale o al Parlamento Europeo non devono raccogliere le 150.000 firme.'}
                      </p>
                    </div>
                  </div>
                ) : euSig.excludedFromBallot ? (
                  <div className="p-3.5 rounded-lg bg-rose-950/30 border border-rose-500/50 space-y-3">
                    <div className="flex items-start gap-2 text-xs text-rose-200">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-rose-100">
                          Lista Esclusa dalle Schede Europee
                        </div>
                        <p className="text-[11px] text-rose-200/90 mt-0.5">
                          Raccolte {euSig.collectedSignatures.toLocaleString('it-IT')} firme su{' '}
                          {EU_SIGNATURE_TARGET.toLocaleString('it-IT')} entro la chiusura liste. Puoi comunque dare un’indicazione di voto alla tua base:
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => onEuExcludedStance('astensione')}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                          euSig.excludedStance === 'astensione'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                            : 'bg-[#090D16] hover:bg-slate-800 border-slate-700 text-slate-200'
                        }`}
                      >
                        Invita all’Astensione Polemica
                      </button>
                      <div className="flex items-center gap-1.5 flex-1">
                        <select
                          value={endorsePartyId || endorsableParties[0]?.id || ''}
                          onChange={(e) => setEndorsePartyId(e.target.value)}
                          className="flex-1 px-2.5 py-2 rounded-lg bg-[#090D16] border border-slate-700 text-xs text-slate-100"
                        >
                          {endorsableParties.slice(0, 10).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.acronym})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            onEuExcludedStance(
                              'sostegno',
                              endorsePartyId || endorsableParties[0]?.id
                            )
                          }
                          className="px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-bold cursor-pointer shrink-0"
                        >
                          Sostieni Lista
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-[#090D16] border border-amber-500/35 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">
                          Firme Autenticate (Partito Extra-Parlamentare)
                        </span>
                        <span className="font-mono font-bold text-amber-300 tabular-nums">
                          {euSig.collectedSignatures.toLocaleString('it-IT')} /{' '}
                          {EU_SIGNATURE_TARGET.toLocaleString('it-IT')} ({sigPct}%)
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-900 overflow-hidden">
                        <div
                          className={`h-full ${sigPct >= 100 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                          style={{ width: `${sigPct}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-5 gap-1.5 pt-1">
                        {EUROPEAN_CONSTITUENCIES.map((c) => (
                          <div
                            key={c.id}
                            className="text-center p-1.5 rounded bg-[#111827] border border-slate-800"
                          >
                            <div className="text-[9px] text-slate-400 truncate">{c.shortName}</div>
                            <div className="font-mono text-[10px] font-bold text-slate-200 tabular-nums">
                              {(euSig.byConstituency[c.id] ?? 0).toLocaleString('it-IT')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {euSigWindowOpen ? (
                      sigPct >= 100 ? (
                        <div className="p-2.5 rounded-lg bg-emerald-950/25 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Soglia 150.000 firme raggiunta! Lista ufficialmente ammessa alle Europee.</span>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <select
                            value={sigDriveConst}
                            onChange={(e) =>
                              setSigDriveConst(e.target.value as EuropeanConstituencyId)
                            }
                            className="flex-1 px-3 py-2 rounded-lg bg-[#090D16] border border-slate-700 text-xs text-slate-100"
                          >
                            {EUROPEAN_CONSTITUENCIES.map((c) => (
                              <option key={c.id} value={c.id}>
                                Circoscrizione {c.shortName}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={euSig.campaignsThisWeek >= 2}
                            onClick={() => onEuSignatureDrive(sigDriveConst)}
                            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                              euSig.campaignsThisWeek >= 2
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                            }`}
                          >
                            <FileSignature className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Banchetti Firme (€{EU_SIGNATURE_DRIVE_COST.toLocaleString('it-IT')} ·{' '}
                              {2 - euSig.campaignsThisWeek}/2 sett.)
                            </span>
                          </button>
                        </div>
                      )
                    ) : (
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        La raccolta delle 150.000 firme si attiverà automaticamente a{' '}
                        <strong className="text-slate-200">16 settimane</strong> dal voto (Sett.{' '}
                        {Math.max(1, eu.nextElectionWeek - EU_SIGNATURE_WINDOW_WEEKS)}). Nel frattempo apri sezioni nel Territorio per velocizzare la raccolta passiva oppure negozia un Cartello con un partito già parlamentare.
                      </p>
                    )}
                  </div>
                )}
              </section>

              {/* Cartelli Elettorali / Liste di Scopo per Soglia 4% */}
              <section className="xl:col-span-6 bg-[#111827] border border-slate-800/90 rounded-xl p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Handshake className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Cartello Elettorale / Lista di Scopo (Soglia 4%)</span>
                  </h3>
                  <span className="text-[10px] font-mono text-blue-300">
                    €{EU_CARTEL_NEGOTIATION_COST.toLocaleString('it-IT')} · Max 2 alleati
                  </span>
                </div>

                {eu.cartel && (
                  <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-500/45 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-blue-100">{eu.cartel.name}</div>
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          Membri:{' '}
                          {eu.cartel.memberPartyIds
                            .map((id) => state.parties.find((p) => p.id === id)?.acronym ?? id)
                            .join(' + ')}
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-xs font-bold text-amber-300">
                          Stima: {euSnapshot.seatProjection.cartelCombinedPct.toFixed(1)}%
                        </div>
                        <div className="text-[10px] text-emerald-300">
                          {euSnapshot.seatProjection.cartelCombinedPct >= EU_THRESHOLD_PCT
                            ? 'Sopra soglia 4%'
                            : 'Serve altro consenso'}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-blue-500/20">
                      <span className="text-[10px] text-blue-200">
                        {eu.cartel.grantsSignatureExemption
                          ? 'Esenzione firme condivisa attiva · Seggi divisi proporzionalmente'
                          : 'I seggi vinti dal cartello saranno ripartiti proporzionalmente'}
                      </span>
                      {weeksToEu > 1 && (
                        <button
                          type="button"
                          onClick={onDissolveEuCartel}
                          className="text-[11px] text-rose-300 hover:text-rose-200 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Sciogli Cartello</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {(!eu.cartel || eu.cartel.memberPartyIds.length < 3) && weeksToEu > 1 && (
                  <div className="space-y-2.5">
                    {!eu.cartel && (
                      <input
                        type="text"
                        maxLength={50}
                        value={customCartelName}
                        onChange={(e) => setCustomCartelName(e.target.value)}
                        placeholder="Nome opzionale della Lista Comune (es. Stati Uniti d’Europa)..."
                        className="w-full px-3 py-1.5 rounded-lg bg-[#090D16] border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-400"
                      />
                    )}

                    <div className="space-y-1.5 max-h-52 overflow-y-auto war-scroll pr-1">
                      {eligibleCartelPartners.slice(0, 6).map((cand) => (
                        <div
                          key={cand.partyId}
                          className="p-2.5 rounded-lg bg-[#090D16] border border-slate-800 flex flex-wrap items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: cand.color }}
                              />
                              <span className="font-semibold text-slate-100 truncate">
                                {cand.name} ({cand.acronym})
                              </span>
                              <span className="font-mono text-[11px] text-cyan-300 shrink-0">
                                {cand.nationalPoll.toFixed(1)}%
                              </span>
                              {cand.hasSeatsForExemption && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 shrink-0">
                                  Esenzione Firme
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {cand.reasonTag} · Affinità {cand.ideologicalAffinity}% · Esito{' '}
                              <strong className="text-slate-200">{cand.acceptanceChance}%</strong>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              onNegotiateEuCartel(cand.partyId, customCartelName.trim() || undefined)
                            }
                            className="px-2.5 py-1.5 rounded-md bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/50 text-blue-100 text-[11px] font-semibold cursor-pointer shrink-0 transition-colors"
                          >
                            Proponi (€5k)
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Campagna Elettorale Europea: Capilista, Candidatura Leader & Azioni (Ultime 8 settimane) */}
            <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 sm:p-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Strategia Capilista, Dilemma Leader &amp; Campagna Europea</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Configura i Capilista delle 5 Circoscrizioni e la candidatura del Leader in qualsiasi momento; le azioni di campagna si sbloccano nelle ultime {EU_CAMPAIGN_WINDOW_WEEKS} settimane.
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded font-mono text-[10px] font-bold border ${
                    euCampaignWindowOpen
                      ? 'bg-emerald-500/15 border-emerald-500/45 text-emerald-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  {euCampaignWindowOpen
                    ? `CAMPAGNA ATTIVA · ${2 - eu.campaign.actionsThisWeek}/2 azioni sett.`
                    : `Campagna attiva tra ${Math.max(0, weeksToEu - EU_CAMPAIGN_WINDOW_WEEKS)} sett.`}
                </span>
              </div>

              {/* 1. Scelta dei Capilista per ciascuna delle 5 Circoscrizioni */}
              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>1. Scelta dei Capilista per Circoscrizione</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {EUROPEAN_CONSTITUENCIES.map((c) => {
                    const currentArch = eu.campaign.headCandidates[c.id];
                    return (
                      <div
                        key={c.id}
                        className="p-3 rounded-lg bg-[#090D16] border border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-100">{c.name}</span>
                          <span className="font-mono text-[10px] text-amber-300">
                            {c.seats} seggi
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          {EU_HEAD_CANDIDATE_ARCHETYPES.map((arch) => {
                            const selected = currentArch === arch.id;
                            return (
                              <button
                                key={arch.id}
                                type="button"
                                title={`${arch.label}: ${arch.pros} | ${arch.cons}`}
                                onClick={() => onSetEuHeadCandidate(c.id, arch.id)}
                                className={`px-1.5 py-1.5 rounded text-[10px] font-semibold text-center cursor-pointer transition-colors border ${
                                  selected
                                    ? 'bg-blue-500/25 border-blue-400/70 text-blue-100'
                                    : 'bg-[#111827] border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {arch.shortLabel}
                              </button>
                            );
                          })}
                        </div>
                        {(() => {
                          const meta = EU_HEAD_CANDIDATE_ARCHETYPES.find(
                            (a) => a.id === currentArch
                          );
                          return meta ? (
                            <p className="text-[10px] text-slate-400 leading-snug">{meta.pros}</p>
                          ) : null;
                        })()}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Dilemma Candidatura del Leader */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>2. Dilemma “Candidatura del Leader” ({state.leader.name})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {EU_LEADER_CANDIDACY_OPTIONS.map((opt) => {
                    const active = eu.campaign.leaderCandidacyMode === opt.id;
                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-lg border space-y-2 transition-colors ${
                          active
                            ? opt.id === 'all_five'
                              ? 'bg-amber-950/25 border-amber-500/60'
                              : 'bg-blue-950/30 border-blue-400/60'
                            : 'bg-[#090D16] border-slate-800'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            onSetEuLeaderCandidacy(
                              opt.id,
                              opt.id === 'single'
                                ? eu.campaign.leaderCandidacyConstituency ?? 'nord_ovest'
                                : undefined
                            )
                          }
                          className="w-full text-left cursor-pointer space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-100">{opt.label}</span>
                            {active && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-cyan-200/90 leading-snug">
                            {opt.pullSummary}
                          </p>
                          <p className="text-[10px] text-slate-400 leading-snug">
                            {opt.riskSummary}
                          </p>
                        </button>

                        {opt.id === 'single' && active && (
                          <select
                            value={eu.campaign.leaderCandidacyConstituency ?? 'nord_ovest'}
                            onChange={(e) =>
                              onSetEuLeaderCandidacy(
                                'single',
                                e.target.value as EuropeanConstituencyId
                              )
                            }
                            className="w-full px-2.5 py-1.5 rounded bg-[#111827] border border-blue-500/40 text-[11px] text-slate-100"
                          >
                            {EUROPEAN_CONSTITUENCIES.map((c) => (
                              <option key={c.id} value={c.id}>
                                Capolista in {c.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Azioni di Campagna Europea (ultime 8 settimane, budget reale) */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>3. Azioni di Campagna Europea (Budget Reale · Ultime 8 Settimane)</span>
                </div>

                {/* Comizio mirato circoscrizionale + Evento speciale Fuorisede / Estero */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-lg bg-[#090D16] border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-100">
                        Comizio Mirato di Circoscrizione
                      </span>
                      <span className="font-mono text-amber-300 font-bold">
                        €{EU_CONSTITUENCY_RALLY_COST.toLocaleString('it-IT')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Concentra piazze e media locali su una delle 5 circoscrizioni per alzare il voto europeo sul territorio.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={rallyConst}
                        onChange={(e) => setRallyConst(e.target.value as EuropeanConstituencyId)}
                        className="flex-1 px-2.5 py-2 rounded-lg bg-[#111827] border border-slate-700 text-xs text-slate-100"
                      >
                        {EUROPEAN_CONSTITUENCIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.seats} seggi)
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={
                          !euCampaignWindowOpen ||
                          euSig.excludedFromBallot ||
                          eu.campaign.actionsThisWeek >= 2
                        }
                        onClick={() => onRunEuRally(rallyConst)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                          !euCampaignWindowOpen ||
                          euSig.excludedFromBallot ||
                          eu.campaign.actionsThisWeek >= 2
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer'
                        }`}
                      >
                        Organizza Comizio
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#090D16] border border-blue-500/35 space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-blue-100 flex items-center gap-1.5">
                          <Plane className="w-3.5 h-3.5 text-blue-400" />
                          <span>Voto Fuorisede &amp; Italiani all’Estero</span>
                        </span>
                        <span className="font-mono text-amber-300 font-bold">
                          €{EU_ABROAD_STUDENTS_EVENT_COST.toLocaleString('it-IT')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Iniziativa speciale nei poli universitari e nei consolati europei: alza l’affluenza, conquista i giovani e rafforza tutte e 5 le circoscrizioni (1 per tornata).
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={
                        !euCampaignWindowOpen ||
                        euSig.excludedFromBallot ||
                        eu.campaign.abroadStudentsEventDone ||
                        eu.campaign.actionsThisWeek >= 2
                      }
                      onClick={onRunEuAbroadEvent}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
                        eu.campaign.abroadStudentsEventDone
                          ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 cursor-default'
                          : !euCampaignWindowOpen ||
                              euSig.excludedFromBallot ||
                              eu.campaign.actionsThisWeek >= 2
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-400 text-slate-950 cursor-pointer'
                      }`}
                    >
                      {eu.campaign.abroadStudentsEventDone
                        ? 'Iniziativa Fuorisede & Estero Completata'
                        : 'Lancia Mobilitazione Fuorisede & Italiani all’Estero'}
                    </button>
                  </div>
                </div>

                {/* 5 Campagne Tematiche UE */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2.5">
                  {EU_CAMPAIGN_TOPICS.map((topic) => {
                    const alreadyDone = eu.campaign.topicCampaignsRun.includes(topic.id);
                    const disabled =
                      !euCampaignWindowOpen ||
                      euSig.excludedFromBallot ||
                      alreadyDone ||
                      eu.campaign.actionsThisWeek >= 2;
                    return (
                      <div
                        key={topic.id}
                        className={`p-3 rounded-lg border flex flex-col justify-between gap-2.5 ${
                          alreadyDone
                            ? 'bg-emerald-950/15 border-emerald-500/35'
                            : 'bg-[#090D16] border-slate-800'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-slate-100 leading-snug">
                            {topic.shortTitle}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-snug">{topic.summary}</p>
                        </div>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => onRunEuTopicCampaign(topic.id)}
                          className={`w-full py-1.5 px-2 rounded text-[11px] font-bold transition-colors ${
                            alreadyDone
                              ? 'bg-emerald-500/15 text-emerald-300 cursor-default'
                              : disabled
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-slate-800 hover:bg-blue-500 hover:text-slate-950 text-blue-200 border border-blue-500/40 cursor-pointer'
                          }`}
                        >
                          {alreadyDone
                            ? 'Campagna Lanciata'
                            : `Lancia (€${(topic.cost / 1000).toFixed(1)}k)`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Pannello "Bruxelles" · Presenza UE, Commissione, Commissario & Direttive */}
            {(() => {
              const playerEuSeats = eu.euSeats[player.id] ?? 0;
              const playerEuGroupId = eu.partyEuGroups[player.id] ?? 'ni';
              const playerEuGroup = EU_PARLIAMENT_GROUPS[playerEuGroupId];
              const euBudgetRelief = getEuBudgetRelief(state);
              const activeDir = eu.activeDirective ?? null;
              const dirHistory = eu.directiveHistory ?? [];
              const commVoteLabel =
                eu.commission.playerVote === 'favorevole'
                  ? 'Favorevole (Maggioranza UE)'
                  : eu.commission.playerVote === 'contrario'
                    ? 'Contrario (Opposizione UE)'
                    : eu.commission.playerVote === 'astenuto'
                      ? 'Astensione'
                      : eu.commission.inEuropeanMajority
                        ? 'Area Maggioranza Europea'
                        : 'Fuori Maggioranza Europea';
              const commTierLabel =
                eu.commission.italianCommissionerTier === 'peso'
                  ? 'Portafoglio di Peso'
                  : eu.commission.italianCommissionerTier === 'minore'
                    ? 'Portafoglio Minore'
                    : 'Portafoglio Medio';

              return (
                <section className="bg-gradient-to-br from-[#0D1631] via-[#111827] to-[#0D1322] border border-blue-500/40 rounded-xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-blue-500/25">
                    <div>
                      <h2 className="text-sm font-bold text-slate-50 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>Riepilogo Bruxelles · Presenza al Parlamento Europeo &amp; Commissione</span>
                      </h2>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Eurodeputati in carica, Gruppo Parlamentare UE, linea sulla Commissione Europea e peso del Commissario italiano.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-[#090D16] border border-blue-500/40 font-mono text-[11px] text-amber-300 font-bold">
                      {playerEuSeats} / 76 Eurodeputati · +€{(playerEuSeats * 320).toLocaleString('it-IT')}/sett.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800 space-y-1">
                      <div className="text-[10px] font-mono uppercase text-slate-400">
                        Eurodeputati {player.acronym}
                      </div>
                      <div className="font-mono text-lg font-bold text-amber-300 tabular-nums">
                        {playerEuSeats}{' '}
                        <span className="text-xs font-normal text-slate-400">su 76 italiani</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {playerEuSeats > 0
                          ? `Contributo UE: +€${(playerEuSeats * 320).toLocaleString('it-IT')}/sett. + visibilità`
                          : '0 eurodeputati: supera il 4% alle prossime Europee'}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800 space-y-1">
                      <div className="text-[10px] font-mono uppercase text-slate-400">
                        Gruppo Europeo
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: playerEuGroup.color }}
                        />
                        <span className="font-display font-bold text-sm text-slate-50">
                          {playerEuGroup.acronym}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 truncate">{playerEuGroup.name}</div>
                      <div className="text-[10px] font-mono text-cyan-300">
                        Rapporti Gruppo: {eu.groupRelations ?? 65}/100 · Peso: {playerEuGroup.brusselsWeight}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800 space-y-1">
                      <div className="text-[10px] font-mono uppercase text-slate-400">
                        Commissione Europea ({eu.commission.termYear})
                      </div>
                      <div className="font-semibold text-xs text-slate-100">
                        Pres. {eu.commission.presidentName}
                      </div>
                      <div
                        className={`text-[11px] font-semibold ${
                          eu.commission.playerVote === 'favorevole' || eu.commission.inEuropeanMajority
                            ? 'text-emerald-300'
                            : eu.commission.playerVote === 'contrario'
                              ? 'text-rose-300'
                              : 'text-amber-300'
                        }`}
                      >
                        {commVoteLabel}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Rapporti UE: {state.stateIndicators.euRelations}/100
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800 space-y-1">
                      <div className="text-[10px] font-mono uppercase text-slate-400">
                        Commissario Italiano
                      </div>
                      <div className="font-semibold text-xs text-slate-100">
                        {eu.commission.italianCommissionerName}
                      </div>
                      <div className="text-[11px] text-cyan-300 leading-snug">
                        {eu.commission.italianCommissionerPortfolio ?? 'Coesione e Riforme'}
                      </div>
                      <div className="text-[10px] text-amber-300 font-mono">
                        {commTierLabel} · Rischio Infrazione: {euBudgetRelief.infringementRiskLabel}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-blue-950/25 border border-blue-500/30 text-[11px] text-blue-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-300 shrink-0" />
                    <span>
                      <strong>Impatto sulla Legge di Bilancio:</strong> {euBudgetRelief.summary}
                    </span>
                  </div>

                  {/* Direttiva Europea attiva votabile anche da qui */}
                  {activeDir && playerEuSeats > 0 && (
                    <div className="p-3.5 rounded-xl bg-[#090D16] border border-amber-500/40 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-[10px] font-mono uppercase text-amber-300">
                            Dossier da Bruxelles in Plenaria · Linea {playerEuGroup.acronym}:{' '}
                            {activeDir.groupLine.toUpperCase()}
                          </div>
                          <div className="text-xs font-bold text-slate-100 mt-0.5">
                            {activeDir.title}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {activeDir.dateLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{activeDir.summary}</p>
                      {activeDir.resolved ? (
                        <div className="text-[11px] text-emerald-300 font-medium">
                          {activeDir.outcomeSummary}
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => onVoteEuDirective?.('favorevole')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-200 text-xs font-bold cursor-pointer"
                          >
                            Favorevole
                          </button>
                          <button
                            type="button"
                            onClick={() => onVoteEuDirective?.('contrario')}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-200 text-xs font-bold cursor-pointer"
                          >
                            Contrario
                          </button>
                          <button
                            type="button"
                            onClick={() => onVoteEuDirective?.('astenuto')}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/45 text-amber-200 text-xs font-bold cursor-pointer"
                          >
                            Astensione
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {dirHistory.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-mono uppercase text-slate-400">
                        Ultime Direttive Europee Votate ({dirHistory.length})
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {dirHistory.slice(0, 4).map((d) => (
                          <div
                            key={d.id}
                            className="p-2.5 rounded-lg bg-[#090D16] border border-slate-800 text-[11px] flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-200 truncate">{d.title}</div>
                              <div className="text-[10px] text-slate-400">
                                {d.dateLabel} · Spread{' '}
                                {(d.spreadDelta ?? 0) >= 0 ? `+${d.spreadDelta ?? 0}` : d.spreadDelta} bps
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase shrink-0 ${
                                d.playerVote === 'favorevole'
                                  ? 'bg-emerald-500/15 text-emerald-300'
                                  : d.playerVote === 'contrario'
                                    ? 'bg-rose-500/15 text-rose-300'
                                    : 'bg-amber-500/15 text-amber-300'
                              }`}
                            >
                              {d.playerVote}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              );
            })()}

            {/* Deputazione Italiana in Carica a Strasburgo (76 seggi) + Archivio */}
            <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              <div className="xl:col-span-7 bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Deputazione Italiana Attuale al Parlamento Europeo (76 Seggi)</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Indipendente da Camera/Senato
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sittingEuDelegation.map((p) => {
                    const grpId = eu.partyEuGroups[p.id] ?? 'ni';
                    const grp = EU_PARLIAMENT_GROUPS[grpId];
                    return (
                      <div
                        key={p.id}
                        className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs ${
                          p.id === player.id
                            ? 'bg-cyan-950/25 border-cyan-500/50'
                            : 'bg-[#090D16] border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <PartyEmblem
                            emblem={p.emblem}
                            color={p.color}
                            customUrl={p.customEmblemUrl}
                            size={18}
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-100 truncate">{p.name}</div>
                            <div className="text-[10px] text-slate-400">
                              Gruppo UE:{' '}
                              <span style={{ color: grp.color }} className="font-semibold">
                                {grp.acronym}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="font-mono text-sm font-bold text-amber-300 shrink-0">
                          {eu.euSeats[p.id]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="xl:col-span-5 bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-100 pb-2 border-b border-slate-800">
                  Archivio Tornate Europee
                </h3>
                {eu.electionHistory.length === 0 ? (
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Nessuna tornata europea ancora disputata in questa partita. La prima scadenza quinquennale è fissata a{' '}
                    <strong className="text-slate-200">
                      {euDateInfo.monthName} {euDateInfo.year}
                    </strong>
                    .
                  </p>
                ) : (
                  <div className="space-y-2">
                    {eu.electionHistory.map((h, i) => (
                      <div
                        key={`${h.year}_${i}`}
                        className="p-2.5 rounded-lg bg-[#090D16] border border-slate-800 text-xs flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-semibold text-slate-100">
                            Europee {h.year} ({h.dateLabel})
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Affluenza {h.turnout.toFixed(1)}% · 1° {h.winnerAcronym} (
                            {h.winnerPct.toFixed(1)}%)
                            {h.cartelName ? ` · Cartello ${h.cartelName}` : ''}
                          </div>
                        </div>
                        <div className="text-right font-mono shrink-0">
                          <div className="font-bold text-cyan-300">{h.playerPct.toFixed(1)}%</div>
                          <div className="text-[10px] text-amber-300">{h.playerSeats} seggi</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

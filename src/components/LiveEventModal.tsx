import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Compass,
  Crown,
  Flame,
  Gavel,
  Handshake,
  Landmark,
  Megaphone,
  Radio,
  Shield,
  Sparkles,
  Users,
  XCircle,
} from 'lucide-react';
import {
  GameState,
  LiveBillVoteEvent,
  LiveBillVoteTactic,
  PreElectionCoalitionDilemma,
} from '../types/game';

interface LiveEventModalProps {
  state: GameState;
  liveBillVote: LiveBillVoteEvent | null;
  preElectionDilemma: PreElectionCoalitionDilemma | null;
  onResolveLiveBillVote: (tactic: LiveBillVoteTactic) => void;
  onDismissLiveBillVote: () => void;
  onResolvePreElectionChoice: (
    payload:
      | { mode: 'join_existing'; coalitionId: string }
      | { mode: 'create_new'; coalitionName: string; invitedPartyIds: string[] }
      | { mode: 'run_solo' }
  ) => void;
}

export const LiveEventModal: React.FC<LiveEventModalProps> = ({
  state,
  liveBillVote,
  preElectionDilemma,
  onResolveLiveBillVote,
  onDismissLiveBillVote,
  onResolvePreElectionChoice,
}) => {
  const player = useMemo(
    () => state.parties.find((p) => p.id === state.playerPartyId) ?? state.parties[0],
    [state.parties, state.playerPartyId]
  );

  // Stato progressivo scrutinio Live DDL
  const [tallyProgress, setTallyProgress] = useState(0);
  const resolved = liveBillVote?.resolvedResult ?? null;

  useEffect(() => {
    if (!resolved) {
      setTallyProgress(0);
      return;
    }
    setTallyProgress(0);
    const totalDurationMs = 1500;
    const start = performance.now();
    let frameId = 0;

    const step = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(1, elapsed / totalDurationMs);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - pct, 3);
      setTallyProgress(eased);
      if (pct < 1) {
        frameId = requestAnimationFrame(step);
      }
    };
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [resolved, liveBillVote?.billId]);

  // Stato form Bivio Coalizioni Pre-Elezioni
  const [strategyTab, setStrategyTab] = useState<'join_existing' | 'create_new' | 'run_solo'>(
    'join_existing'
  );
  const [customCoalitionName, setCustomCoalitionName] = useState(
    `Alleanza per l’Italia (${player?.acronym ?? 'Polo'})`
  );
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);

  useEffect(() => {
    if (!preElectionDilemma) return;
    const hasOffers = preElectionDilemma.offers.length > 0;
    setStrategyTab(hasOffers ? 'join_existing' : 'create_new');
    setCustomCoalitionName(`Alleanza ${player?.name ?? 'Nazionale'}`);
    // Pre-seleziona fino a 2 partner con probabilità >= 55%
    const preSelected = preElectionDilemma.candidatePartners
      .filter((c) => c.acceptChancePct >= 55)
      .slice(0, 2)
      .map((c) => c.partyId);
    setSelectedPartners(preSelected);
  }, [preElectionDilemma?.triggeredAtWeek, preElectionDilemma?.electionWeek, player?.name]);

  if (!liveBillVote && !preElectionDilemma) return null;

  // ============================================================================
  // MODALITÀ A: VOTAZIONE IN DIRETTA IN AULA ("OGGI SI VOTA IN AULA")
  // ============================================================================
  if (liveBillVote) {
    const isCamera = liveBillVote.chamber === 'camera';
    const chamberTitle = isCamera ? 'Camera dei Deputati' : 'Senato della Repubblica';
    const chamberPlace = isCamera ? 'Montecitorio' : 'Palazzo Madama';

    const displayFav = resolved
      ? Math.round(resolved.favorevoli * tallyProgress)
      : liveBillVote.expectedFavorevoli;
    const displayCon = resolved
      ? Math.round(resolved.contrari * tallyProgress)
      : liveBillVote.expectedContrari;
    const displayAst = resolved
      ? Math.round(resolved.astenuti * tallyProgress)
      : liveBillVote.expectedAstenuti;
    const tallyComplete = Boolean(resolved && tallyProgress >= 0.999);

    const alignmentBadge =
      liveBillVote.alignmentLevel === 'consigliato'
        ? {
            text: 'In linea con il tuo partito',
            cls: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
          }
        : liveBillVote.alignmentLevel === 'trasversale'
          ? {
              text: 'Proposta trasversale',
              cls: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
            }
          : {
              text: 'Linea pragmatica',
              cls: 'bg-sky-500/15 border-sky-500/40 text-sky-300',
            };

    const favPct = Math.round((displayFav / Math.max(1, liveBillVote.totalChamberSeats)) * 100);
    const conPct = Math.round((displayCon / Math.max(1, liveBillVote.totalChamberSeats)) * 100);
    const astPct = Math.max(0, 100 - favPct - conPct);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-5">
        <div className="w-full max-w-3xl max-h-[90dvh] overflow-y-auto rounded-2xl border border-slate-700/80 bg-slate-900 text-slate-100 shadow-2xl pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {/* Header Diretta Aula */}
          <div className="border-b border-slate-800 bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="inline-flex items-center gap-2 rounded-md border border-rose-500/40 bg-rose-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-300">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                Oggi si vota in Aula · Diretta {chamberPlace}
              </div>
              <span className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold ${alignmentBadge.cls}`}>
                {alignmentBadge.text}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-amber-400 shrink-0" />
              <span>{liveBillVote.title}</span>
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 leading-relaxed">
              {liveBillVote.shortDesc}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              <span className="rounded bg-slate-800/90 px-2 py-0.5 font-semibold text-slate-200">
                {chamberTitle} ({liveBillVote.totalChamberSeats} seggi)
              </span>
              <span className="rounded bg-slate-800/90 px-2 py-0.5">
                Maggioranza:{' '}
                <strong className="text-slate-200">
                  {liveBillVote.requiredMajority === 'assoluta' ? 'Assoluta' : 'Semplice'} (soglia{' '}
                  {resolved ? resolved.requiredSeats : liveBillVote.requiredSeats})
                </strong>
              </span>
              {liveBillVote.navettaCount > 0 && (
                <span className="rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-amber-300 font-semibold">
                  Navetta #{liveBillVote.navettaCount}
                </span>
              )}
              <span className="rounded bg-slate-800/90 px-2 py-0.5">
                Rischio voto segreto / franchi tiratori:{' '}
                <strong
                  className={
                    liveBillVote.secretBallotRisk >= 45
                      ? 'text-rose-400'
                      : liveBillVote.secretBallotRisk >= 22
                        ? 'text-amber-300'
                        : 'text-emerald-400'
                  }
                >
                  {liveBillVote.secretBallotRisk}%
                </strong>
              </span>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Tabellone elettronico d'Aula */}
            <div className="rounded-xl border border-slate-700/80 bg-slate-950/80 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Gavel className="w-3.5 h-3.5 text-amber-400" />
                  {resolved
                    ? tallyComplete
                      ? 'Scrutinio Elettronico Definitivo'
                      : 'Scrutinio Elettronico in Corso...'
                    : 'Proiezione Schieramenti Prima della Chiama'}
                </div>
                {resolved && !tallyComplete && (
                  <button
                    type="button"
                    onClick={() => setTallyProgress(1)}
                    className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 underline cursor-pointer"
                  >
                    Mostra subito il risultato
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3 text-center">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                    Favorevoli
                  </div>
                  <div className="mt-1 text-2xl sm:text-3xl font-black tabular-nums text-emerald-400">
                    {displayFav}
                  </div>
                </div>
                <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-3 text-center">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-rose-300">
                    Contrari
                  </div>
                  <div className="mt-1 text-2xl sm:text-3xl font-black tabular-nums text-rose-400">
                    {displayCon}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-600/50 bg-slate-800/50 p-3 text-center">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                    Astenuti
                  </div>
                  <div className="mt-1 text-2xl sm:text-3xl font-black tabular-nums text-slate-200">
                    {displayAst}
                  </div>
                </div>
              </div>

              {/* Barra proporzionale dei voti */}
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800 flex">
                <div
                  className="bg-emerald-500 transition-all duration-150"
                  style={{ width: `${favPct}%` }}
                />
                <div
                  className="bg-slate-500 transition-all duration-150"
                  style={{ width: `${astPct}%` }}
                />
                <div
                  className="bg-rose-500 transition-all duration-150"
                  style={{ width: `${conPct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Soglia approvazione: {resolved ? resolved.requiredSeats : liveBillVote.requiredSeats} voti</span>
                <span>Tensione d’Aula: {liveBillVote.chamberTension}/100</span>
              </div>
            </div>

            {/* Schieramento dei gruppi parlamentari */}
            {!resolved && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Orientamento dei Gruppi in {isCamera ? 'Camera' : 'Senato'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {(['favorevole', 'astenuto', 'contrario'] as const).map((stanceKey) => {
                    const groups = liveBillVote.partyPreview.filter((p) => p.stance === stanceKey);
                    const label =
                      stanceKey === 'favorevole'
                        ? 'Favorevoli'
                        : stanceKey === 'astenuto'
                          ? 'Astenuti / Indecisi'
                          : 'Contrari';
                    const headColor =
                      stanceKey === 'favorevole'
                        ? 'text-emerald-300 border-emerald-500/30 bg-emerald-950/20'
                        : stanceKey === 'astenuto'
                          ? 'text-amber-300 border-amber-500/30 bg-amber-950/20'
                          : 'text-rose-300 border-rose-500/30 bg-rose-950/20';

                    return (
                      <div key={stanceKey} className={`rounded-xl border p-2.5 ${headColor}`}>
                        <div className="font-bold text-[11px] uppercase mb-1.5">{label}</div>
                        {groups.length === 0 ? (
                          <div className="text-[11px] text-slate-500 italic">Nessun gruppo</div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {groups.map((g) => (
                              <span
                                key={g.partyId}
                                className="inline-flex items-center gap-1 rounded bg-slate-900/90 border border-slate-700/70 px-1.5 py-0.5 text-[11px] text-slate-200"
                              >
                                <span
                                  className="h-2 w-2 rounded-full shrink-0"
                                  style={{ backgroundColor: g.color }}
                                />
                                <strong>{g.acronym}</strong>
                                <span className="text-slate-400">{g.seats}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Scelta tattica pre-voto oppure Risultato Finale */}
            {!resolved ? (
              <div className="space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Scegli la tua ultima mossa prima dell’apertura del voto
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => onResolveLiveBillVote('appello')}
                    className="group text-left rounded-xl border border-sky-500/40 bg-sky-950/30 hover:bg-sky-900/40 hover:border-sky-400 p-3.5 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-sky-200 mb-1">
                      <Megaphone className="w-4 h-4 text-sky-400 shrink-0" />
                      Ultimo appello in Aula
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Prendi la parola in dichiarazione di voto per mobilitare gli indecisi e dimezzare il rischio di franchi tiratori.
                    </p>
                    <div className="mt-2.5 text-[11px] font-semibold text-sky-300">
                      +Voti indecisi · -55% franchi tiratori
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onResolveLiveBillVote('emendamento_finale')}
                    className="group text-left rounded-xl border border-amber-500/40 bg-amber-950/25 hover:bg-amber-900/35 hover:border-amber-400 p-3.5 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-amber-200 mb-1">
                      <Handshake className="w-4 h-4 text-amber-400 shrink-0" />
                      Accetta emendamento finale
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Apri a una modifica dell’ultimo minuto per conquistare i moderati e abbassare la tensione.
                      {!isCamera && ' Al Senato può far scattare la Navetta alla Camera.'}
                    </p>
                    <div className="mt-2.5 text-[11px] font-semibold text-amber-300">
                      Forte spinta voti · -Tensione d’Aula
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onResolveLiveBillVote('linea_dura')}
                    className="group text-left rounded-xl border border-emerald-500/40 bg-emerald-950/25 hover:bg-emerald-900/35 hover:border-emerald-400 p-3.5 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-200 mb-1">
                      <Flame className="w-4 h-4 text-emerald-400 shrink-0" />
                      Voto diretto senza sconti
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Vai subito alla conta senza cambiare una virgola del testo: se passa, la tua base premia la fermezza.
                    </p>
                    <div className="mt-2.5 text-[11px] font-semibold text-emerald-300">
                      Identità intatta · Max bonus sondaggi
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {tallyComplete && (
                  <>
                    <div
                      className={`rounded-xl border p-4 ${
                        resolved.outcome === 'approvato'
                          ? 'border-emerald-500/50 bg-emerald-950/35'
                          : resolved.outcome === 'navetta'
                            ? 'border-amber-500/50 bg-amber-950/35'
                            : 'border-rose-500/50 bg-rose-950/35'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {resolved.outcome === 'approvato' ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                        ) : resolved.outcome === 'navetta' ? (
                          <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-1">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                            {resolved.outcome === 'approvato'
                              ? 'Esito Ufficiale · Approvato'
                              : resolved.outcome === 'navetta'
                                ? 'Esito Ufficiale · Navetta Parlamentare'
                                : 'Esito Ufficiale · Respinto'}
                          </div>
                          <h3 className="text-base sm:text-lg font-black text-white">
                            {resolved.headline}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                            {resolved.summary}
                          </p>
                          <p className="text-xs font-semibold text-sky-300 pt-1">
                            {resolved.pollDeltaNote}
                          </p>
                        </div>
                      </div>
                    </div>

                    {resolved.secretBallotTriggered && resolved.francTireursDefections > 0 && (
                      <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-200 flex items-center gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>
                          <strong>Voto Segreto & Franchi Tiratori:</strong> rilevati{' '}
                          <strong>{resolved.francTireursDefections}</strong> voti mancanti rispetto agli accordi d’Aula!
                        </span>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={onDismissLiveBillVote}
                        className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2.5 text-sm shadow-lg transition-colors cursor-pointer"
                      >
                        Torna alla War Room
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MODALITÀ B: BIVIO GUIDATO PRE-ELEZIONI (COALIZIONI O CORSA SOLITARIA)
  // ============================================================================
  if (!preElectionDilemma) return null;

  const togglePartner = (partyId: string) => {
    setSelectedPartners((prev) =>
      prev.includes(partyId) ? prev.filter((id) => id !== partyId) : [...prev, partyId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-5">
      <div className="w-full max-w-3xl max-h-[90dvh] overflow-y-auto rounded-2xl border border-indigo-500/40 bg-slate-900 text-slate-100 shadow-2xl pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {/* Header Bivio Pre-Elezioni */}
        <div className="border-b border-slate-800 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
              <Compass className="w-3.5 h-3.5" />
              Mancano {preElectionDilemma.weeksRemaining} settimane alle Elezioni Politiche
            </span>
            <span className="rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
              {player?.acronym}: {player?.nationalPoll.toFixed(1)}% ·{' '}
              {player?.coalitionId ? `Oggi in: ${state.coalitionName}` : 'Attualmente autonomo'}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white">
            Strategia Elettorale: Coalizioni o Corsa Solitaria?
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Le liste elettorali stanno per chiudersi. Scegli come schierare{' '}
            <strong className="text-white">{player?.name}</strong> nella corsa verso Palazzo Chigi:
            puoi unirti a un polo già esistente, fondare la tua coalizione invitando partiti affini oppure correre da solo.
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* 3 Tab di scelta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setStrategyTab('join_existing')}
              className={`rounded-xl border px-3 py-2.5 text-left transition-all cursor-pointer ${
                strategyTab === 'join_existing'
                  ? 'border-indigo-400 bg-indigo-500/20 text-white'
                  : 'border-slate-700/80 bg-slate-800/50 text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold">
                <Handshake className="w-4 h-4 text-indigo-400 shrink-0" />
                1. Entra in una Coalizione
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">
                Schieramenti esistenti & offerte AI
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStrategyTab('create_new')}
              className={`rounded-xl border px-3 py-2.5 text-left transition-all cursor-pointer ${
                strategyTab === 'create_new'
                  ? 'border-emerald-400 bg-emerald-500/20 text-white'
                  : 'border-slate-700/80 bg-slate-800/50 text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold">
                <Crown className="w-4 h-4 text-emerald-400 shrink-0" />
                2. Crea la tua Coalizione
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">
                Dai un nome e invita partiti affini
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStrategyTab('run_solo')}
              className={`rounded-xl border px-3 py-2.5 text-left transition-all cursor-pointer ${
                strategyTab === 'run_solo'
                  ? 'border-amber-400 bg-amber-500/20 text-white'
                  : 'border-slate-700/80 bg-slate-800/50 text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold">
                <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                3. Corri da solo
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">
                Piena autonomia, zero compromessi
              </div>
            </button>
          </div>

          {/* Contenuto Tab 1: Entra in una Coalizione esistente */}
          {strategyTab === 'join_existing' && (
            <div className="space-y-3">
              {preElectionDilemma.offers.length === 0 ? (
                <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 text-xs text-slate-300">
                  Nessuna coalizione AI già formata disponibile al momento. Puoi fondare il tuo polo oppure correre da solo.
                </div>
              ) : (
                preElectionDilemma.offers.map((offer) => {
                  const isCurrent = player?.coalitionId === offer.coalitionId;
                  return (
                    <div
                      key={offer.coalitionId}
                      className={`rounded-xl border p-4 transition-colors ${
                        offer.isDirectOffer
                          ? 'border-emerald-500/40 bg-emerald-950/20'
                          : 'border-slate-700/80 bg-slate-800/45'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-white">{offer.coalitionName}</h3>
                          {offer.isDirectOffer && (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                              <Sparkles className="w-3 h-3" />
                              Offerta Ufficiale
                            </span>
                          )}
                          {isCurrent && (
                            <span className="rounded bg-sky-500/20 border border-sky-500/40 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                              Attuale
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="rounded bg-slate-900 px-2 py-0.5 font-semibold text-slate-200">
                            Polo: {offer.combinedPoll.toFixed(1)}%
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 font-bold ${
                              offer.compatibility >= 60
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : offer.compatibility >= 45
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            Affinità {offer.compatibility}%
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400 mb-1.5">
                        Partiti nello schieramento:{' '}
                        <strong className="text-slate-200">{offer.memberAcronyms.join(' · ')}</strong>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mb-3">{offer.pitch}</p>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            onResolvePreElectionChoice({
                              mode: 'join_existing',
                              coalitionId: offer.coalitionId,
                            })
                          }
                          className="rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-4 py-2 text-xs transition-colors cursor-pointer"
                        >
                          {isCurrent
                            ? `Conferma corsa in ${offer.coalitionName}`
                            : `Entra in ${offer.coalitionName}`}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Contenuto Tab 2: Crea la tua Coalizione */}
          {strategyTab === 'create_new' && (
            <div className="space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
                  Nome della tua Coalizione
                </label>
                <input
                  type="text"
                  maxLength={48}
                  value={customCoalitionName}
                  onChange={(e) => setCustomCoalitionName(e.target.value)}
                  placeholder="Es. Patto per il Futuro, Alleanza Civica..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    Invita partiti affini nel tuo polo
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Selezionati: <strong className="text-white">{selectedPartners.length}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {preElectionDilemma.candidatePartners.map((cand) => {
                    const checked = selectedPartners.includes(cand.partyId);
                    return (
                      <button
                        key={cand.partyId}
                        type="button"
                        onClick={() => togglePartner(cand.partyId)}
                        className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-all cursor-pointer ${
                          checked
                            ? 'border-emerald-400 bg-emerald-500/20 text-white'
                            : 'border-slate-700/80 bg-slate-900/70 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: cand.color }}
                            />
                            <span>{cand.acronym}</span>
                            <span className="text-slate-400 font-normal truncate">
                              · {cand.nationalPoll.toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Affinità {cand.compatibility}% · Relazione{' '}
                            {cand.relation >= 0 ? `+${cand.relation}` : cand.relation}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            cand.acceptChancePct >= 65
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : cand.acceptChancePct >= 40
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          Sì ~{cand.acceptChancePct}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() =>
                    onResolvePreElectionChoice({
                      mode: 'create_new',
                      coalitionName: customCoalitionName.trim() || `Alleanza ${player?.acronym ?? 'Italia'}`,
                      invitedPartyIds: selectedPartners,
                    })
                  }
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Fonda Coalizione e Invia Inviti
                </button>
              </div>
            </div>
          )}

          {/* Contenuto Tab 3: Corri da solo */}
          {strategyTab === 'run_solo' && (
            <div className="space-y-4 rounded-xl border border-amber-500/35 bg-amber-950/15 p-4">
              <div className="space-y-2 text-xs sm:text-sm text-slate-200 leading-relaxed">
                <p>
                  Scegliendo la <strong>Corsa Solitaria</strong>, <strong className="text-white">{player?.name}</strong> si presenta agli elettori senza alleanze pre-elettorali né compromessi programmatici.
                </p>
                <ul className="space-y-1 text-xs text-slate-300 list-disc pl-5">
                  <li>
                    <strong className="text-emerald-300">Identità pura:</strong> +5 coesione dei dirigenti, +1% gradimento leader e spinta immediata sulla base fedele.
                  </li>
                  <li>
                    <strong className="text-sky-300">Mani libere dopo il voto:</strong> nessun vincolo con altri partiti al tavolo del Quirinale.
                  </li>
                  <li>
                    <strong className="text-amber-300">Sfida elettorale:</strong> nei collegi uninominali affronterai da solo le grandi coalizioni e dovrai superare la soglia di sbarramento con le tue sole forze.
                  </li>
                </ul>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onResolvePreElectionChoice({ mode: 'run_solo' })}
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2.5 text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Conferma Corsa Solitaria
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

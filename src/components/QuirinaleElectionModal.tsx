import React, { useEffect, useMemo, useState } from 'react';
import {
  QUIRINALE_ABSOLUTE_THRESHOLD,
  QUIRINALE_TOTAL_ELECTORS,
  QUIRINALE_TWO_THIRDS_THRESHOLD,
  calculateQuirinaleElectorsByParty,
} from '../engine/simulation';
import { GameState, QuirinaleCandidate } from '../types/game';
import { PartyEmblem } from './PartyEmblem';
import { LeaderAvatar } from './LeaderAvatar';
import {
  Award,
  CheckCircle2,
  Handshake,
  Landmark,
  Minimize2,
  Plus,
  ScrollText,
  Sparkles,
  Users,
  Vote,
} from 'lucide-react';

interface QuirinaleElectionModalProps {
  state: GameState;
  onProposeCandidate: (name: string, area: QuirinaleCandidate['area']) => void;
  onNegotiateSupport: (partyId: string, candidateId: string) => void;
  onRunBallot: (candidateId: string) => void;
  onCloseElection: () => void;
  onMinimize?: () => void;
}

const AREA_LABELS: Record<QuirinaleCandidate['area'], { label: string; cls: string }> = {
  istituzionale: { label: 'Garanzia Istituzionale', cls: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/35' },
  centro: { label: 'Area Centro / Tecnico', cls: 'text-cyan-300 border-cyan-500/40 bg-cyan-950/35' },
  centrodestra: { label: 'Area Centrodestra', cls: 'text-amber-300 border-amber-500/40 bg-amber-950/35' },
  centrosinistra: { label: 'Area Centrosinistra', cls: 'text-rose-300 border-rose-500/40 bg-rose-950/35' },
  sovranista: { label: 'Area Sovranista', cls: 'text-orange-300 border-orange-500/40 bg-orange-950/35' },
};

export const QuirinaleElectionModal: React.FC<QuirinaleElectionModalProps> = ({
  state,
  onProposeCandidate,
  onNegotiateSupport,
  onRunBallot,
  onCloseElection,
  onMinimize,
}) => {
  const qe = state.quirinaleElection;
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    () => qe?.playerSupportedCandidateId ?? qe?.candidates[0]?.id ?? ''
  );
  const [showProposeForm, setShowProposeForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customArea, setCustomArea] = useState<QuirinaleCandidate['area']>('istituzionale');

  useEffect(() => {
    if (qe?.playerSupportedCandidateId) {
      setSelectedCandidateId(qe.playerSupportedCandidateId);
    }
  }, [qe?.playerSupportedCandidateId]);

  const electorsByParty = useMemo(
    () =>
      calculateQuirinaleElectorsByParty(
        state.parties,
        state.electoralLaw,
        state.legislatureSeats
      ),
    [state.parties, state.electoralLaw, state.legislatureSeats]
  );

  if (!qe || !qe.active) return null;

  const activeCandidateId =
    qe.candidates.some((c) => c.id === selectedCandidateId)
      ? selectedCandidateId
      : qe.playerSupportedCandidateId ?? qe.candidates[0]?.id ?? '';

  const selectedCandidate = qe.candidates.find((c) => c.id === activeCandidateId) ?? qe.candidates[0];
  const playerParty = state.parties.find((p) => p.id === state.playerPartyId)!;
  const playerElectors = electorsByParty[playerParty.id] ?? 0;

  const parliamentaryParties = state.parties
    .filter((p) => p.id !== state.playerPartyId && p.id !== 'altri' && (electorsByParty[p.id] ?? 0) > 0)
    .sort((a, b) => (electorsByParty[b.id] ?? 0) - (electorsByParty[a.id] ?? 0));

  const latestBallot = qe.ballotHistory[0];
  const isTwoThirdsPhase = qe.ballotNumber <= 3;
  const currentThreshold = isTwoThirdsPhase
    ? QUIRINALE_TWO_THIRDS_THRESHOLD
    : QUIRINALE_ABSOLUTE_THRESHOLD;

  const coalitionAllyElectors = state.parties
    .filter(
      (p) =>
        p.id !== playerParty.id &&
        p.id !== 'altri' &&
        Boolean(playerParty.coalitionId) &&
        p.coalitionId === playerParty.coalitionId &&
        !qe.negotiatedPartyIds.includes(p.id)
    )
    .reduce((acc, p) => acc + (electorsByParty[p.id] ?? 0), 0);

  const negotiatedForSelectedElectors = Object.entries(qe.negotiatedCandidateMap)
    .filter(([, candId]) => candId === activeCandidateId)
    .reduce((acc, [partyId]) => acc + (electorsByParty[partyId] ?? 0), 0);

  const hasCrossPartyDeal = qe.negotiatedPartyIds.some((pid) => {
    const p = state.parties.find((party) => party.id === pid);
    return Boolean(p && (!playerParty.coalitionId || p.coalitionId !== playerParty.coalitionId));
  });

  const projectedBlocElectors =
    playerElectors + negotiatedForSelectedElectors + Math.round(coalitionAllyElectors * 0.8);
  const projectedPct = Math.min(100, Math.round((projectedBlocElectors / QUIRINALE_TOTAL_ELECTORS) * 100));
  const thresholdMarkerPct = Math.round((currentThreshold / QUIRINALE_TOTAL_ELECTORS) * 100);

  const handleSubmitCustomCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (customName.trim().length < 4) return;
    onProposeCandidate(customName.trim(), customArea);
    setCustomName('');
    setShowProposeForm(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Elezione del Presidente della Repubblica"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center safe-area-modal-backdrop sm:p-5 overflow-hidden"
    >
      <div className="w-full max-w-5xl max-h-[90dvh] bg-[#0D1322] border border-amber-500/45 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Institutional Header */}
        <header className="px-4 sm:px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-[#111827] via-[#0D1322] to-[#111827] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/45 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Landmark className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
                Parlamento in Seduta Comune · Art. 83 Cost.
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-50 leading-snug">
                Elezione del Presidente della Repubblica (Quirinale)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                {QUIRINALE_TOTAL_ELECTORS} Grandi Elettori (400 Camera + 200 Senato + 58 Delegati Regionali) ·{' '}
                I tuoi Grandi Elettori:{' '}
                <strong className="font-mono text-cyan-300">{playerElectors}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="px-3 py-2 rounded-xl bg-[#090D16] border border-slate-800 text-right">
              <div className="text-[10px] text-slate-400">
                {qe.electedCandidate ? 'Esito Finale' : `Scrutinio #${qe.ballotNumber}`}
              </div>
              <div className="font-mono text-sm font-bold tabular-nums text-amber-300">
                {qe.electedCandidate
                  ? 'Eletto'
                  : isTwoThirdsPhase
                    ? `Soglia 2/3 (${QUIRINALE_TWO_THIRDS_THRESHOLD})`
                    : `Soglia 50%+1 (${QUIRINALE_ABSOLUTE_THRESHOLD})`}
              </div>
            </div>
            {onMinimize && !qe.electedCandidate && (
              <button
                type="button"
                onClick={onMinimize}
                title="Riduci temporaneamente per consultare la War Room (riapribile da Parlamento)"
                className="p-2 rounded-xl bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-slate-100 cursor-pointer transition-colors"
                aria-label="Riduci modale Quirinale"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto war-scroll p-4 sm:p-6 space-y-5">
          {/* Elected Outcome Banner */}
          {qe.electedCandidate && (
            <section className="p-4 sm:p-5 rounded-xl bg-emerald-950/35 border border-emerald-500/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <LeaderAvatar
                    name={qe.electedCandidate.name}
                    color="#10B981"
                    size={48}
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 shrink-0" />
                      <span>Habemus Praesidem · Nuovo Settennato</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-50 leading-snug">
                      {qe.electedCandidate.name}
                    </h3>
                    <div className="text-xs text-emerald-200/90">
                      {qe.electedCandidate.roleLabel}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onCloseElection}
                  className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Concludi Seduta Comune</span>
                </button>
              </div>
              {qe.outcomeSummary && (
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed border-t border-emerald-500/25 pt-3">
                  {qe.outcomeSummary}
                </p>
              )}
            </section>
          )}

          {/* Latest Ballot Tally Bars */}
          {latestBallot && (
            <section className="p-4 rounded-xl bg-[#111827] border border-slate-800/90 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                  <ScrollText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    Risultato {latestBallot.ballotNumber}° Scrutinio (quorum {latestBallot.requiredMajority} voti)
                  </span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                  Schede bianche/dispersi: {latestBallot.blankVotes}
                </span>
              </div>
              <p className="text-xs text-amber-200/95 leading-snug">{latestBallot.summary}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {qe.candidates
                  .map((c) => ({ cand: c, votes: latestBallot.tallies[c.id] ?? 0 }))
                  .filter((x) => x.votes > 0)
                  .sort((a, b) => b.votes - a.votes)
                  .map(({ cand, votes }) => {
                    const pct = Math.min(100, Math.round((votes / QUIRINALE_TOTAL_ELECTORS) * 100));
                    const reached = votes >= latestBallot.requiredMajority;
                    return (
                      <div
                        key={cand.id}
                        className="p-2.5 rounded-lg bg-[#090D16] border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-slate-100">{cand.name}</span>
                          <span
                            className={`font-mono font-bold tabular-nums ${
                              reached ? 'text-emerald-400' : 'text-cyan-300'
                            }`}
                          >
                            {votes} voti
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              reached ? 'bg-emerald-400' : 'bg-cyan-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          )}

          {/* Candidate Selection & Custom Proposal */}
          {!qe.electedCandidate && (
            <>
              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">
                      1. Scegli la Candidatura da Sostenere al {qe.ballotNumber}° Scrutinio
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Nei primi 3 scrutini occorrono i 2/3 ({QUIRINALE_TWO_THIRDS_THRESHOLD} voti); dal 4° scrutinio basta la maggioranza assoluta ({QUIRINALE_ABSOLUTE_THRESHOLD}).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowProposeForm((v) => !v)}
                    className="px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-slate-800 border border-slate-700 text-xs font-medium text-cyan-300 flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>Proponi Candidatura</span>
                  </button>
                </div>

                {showProposeForm && (
                  <form
                    onSubmit={handleSubmitCustomCandidate}
                    className="p-3.5 rounded-xl bg-[#111827] border border-cyan-500/45 flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Nome e Cognome del Candidato al Colle
                      </label>
                      <input
                        type="text"
                        maxLength={44}
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Es. Giuliano Amato, Emma Bonino..."
                        className="w-full px-3 py-2 rounded-lg bg-[#090D16] border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div className="sm:w-52">
                      <label className="block text-[11px] text-slate-400 mb-1">Profilo Politico</label>
                      <select
                        value={customArea}
                        onChange={(e) => setCustomArea(e.target.value as QuirinaleCandidate['area'])}
                        className="w-full px-3 py-2 rounded-lg bg-[#090D16] border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                      >
                        <option value="istituzionale">Garanzia Istituzionale</option>
                        <option value="centro">Area Centro / Tecnico</option>
                        <option value="centrodestra">Area Centrodestra</option>
                        <option value="centrosinistra">Area Centrosinistra</option>
                        <option value="sovranista">Area Sovranista</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={customName.trim().length < 4}
                      className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0 ${
                        customName.trim().length < 4
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>Deposita Nome</span>
                    </button>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {qe.candidates.map((cand) => {
                    const selected = cand.id === activeCandidateId;
                    const areaInfo = AREA_LABELS[cand.area];
                    const lastVotes = latestBallot?.tallies[cand.id];
                    const negotiatedCount = Object.entries(qe.negotiatedCandidateMap).filter(
                      ([, cId]) => cId === cand.id
                    ).length;

                    return (
                      <button
                        key={cand.id}
                        type="button"
                        onClick={() => setSelectedCandidateId(cand.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                          selected
                            ? 'bg-[#111827] border-amber-400 shadow-sm'
                            : 'bg-[#090D16]/85 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start gap-2.5">
                            <LeaderAvatar
                              name={cand.name}
                              color={selected ? '#F59E0B' : '#06B6D4'}
                              size={36}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold text-slate-100 leading-snug">
                                {cand.name}
                              </div>
                              <div className="text-[11px] text-slate-400 leading-snug">
                                {cand.roleLabel}
                              </div>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{cand.bio}</p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                          <span className={`px-2 py-0.5 rounded border font-medium ${areaInfo.cls}`}>
                            {areaInfo.label}
                          </span>
                          <span className="font-mono text-slate-400">
                            Prestigio {cand.institutionalPrestige}/100
                            {typeof lastVotes === 'number' && lastVotes > 0 ? ` · ${lastVotes}v` : ''}
                            {negotiatedCount > 0 ? ` · ${negotiatedCount} intese` : ''}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Cross-Party Negotiation Strip */}
              <section className="p-4 rounded-xl bg-[#111827] border border-slate-800/90 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      <Handshake className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>
                        2. Trattative Trasversali su {selectedCandidate?.name ?? 'Candidato'} (€10.000)
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Cassa disponibile:{' '}
                      <span className="font-mono text-amber-300 font-semibold">
                        €{state.budget.toLocaleString('it-IT')}
                      </span>{' '}
                      · Convinci altri gruppi parlamentari a far convergere i loro Grandi Elettori.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {parliamentaryParties.slice(0, 9).map((party) => {
                    const electors = electorsByParty[party.id] ?? 0;
                    const alreadyNegotiated = qe.negotiatedPartyIds.includes(party.id);
                    const agreedCandId = qe.negotiatedCandidateMap[party.id];
                    const agreedCandName = qe.candidates.find((c) => c.id === agreedCandId)?.name;

                    return (
                      <div
                        key={party.id}
                        className="p-2.5 rounded-lg bg-[#090D16] border border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <PartyEmblem
                            emblem={party.emblem}
                            color={party.color}
                            customUrl={party.customEmblemUrl}
                            size={24}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-100 leading-tight">
                              {party.acronym}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              <Users className="w-2.5 h-2.5 inline mr-1" />
                              {electors} elettori
                            </div>
                          </div>
                        </div>

                        {alreadyNegotiated ? (
                          <span className="text-[10px] font-semibold text-emerald-400 text-right leading-tight">
                            Intesa su {agreedCandName?.split(' ').slice(-1)[0] ?? 'OK'}
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={!selectedCandidate || state.budget < 10000}
                            onClick={() =>
                              selectedCandidate && onNegotiateSupport(party.id, selectedCandidate.id)
                            }
                            className={`px-2.5 py-1.5 rounded-md text-[10px] font-semibold border transition-colors shrink-0 ${
                              !selectedCandidate || state.budget < 10000
                                ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/45 text-cyan-200 cursor-pointer'
                            }`}
                          >
                            Tratta (€10k)
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Proiezione Voti & Strategia (Accordo Trasversale vs Alla Conta) */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-slate-300 font-medium">
                        Bacino stimato su {selectedCandidate?.name}:
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded border font-mono text-[10px] font-semibold ${
                          hasCrossPartyDeal
                            ? 'text-emerald-300 border-emerald-500/40 bg-emerald-950/30'
                            : 'text-amber-300 border-amber-500/40 bg-amber-950/30'
                        }`}
                      >
                        {hasCrossPartyDeal ? 'Strategia: Accordo Trasversale' : 'Strategia: Alla Conta'}
                      </span>
                    </div>
                    <span className="font-mono font-bold tabular-nums text-cyan-300">
                      ~{projectedBlocElectors} / {currentThreshold} richiesti
                    </span>
                  </div>
                  <div className="relative h-2 w-full rounded-full bg-[#090D16] border border-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        projectedBlocElectors >= currentThreshold ? 'bg-emerald-400' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${projectedPct}%` }}
                    />
                    <div
                      title={`Quorum richiesto: ${currentThreshold}`}
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400"
                      style={{ left: `${thresholdMarkerPct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 leading-snug">
                    {hasCrossPartyDeal
                      ? 'Un’elezione costruita con intese trasversali rafforza la tenuta democratica e i rapporti parlamentari.'
                      : 'Andare alla conta senza accordi esterni compatta gli alleati in caso di vittoria, ma irrigidisce le opposizioni (e logora la maggioranza in caso di sconfitta).'}
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Previous Ballots Log */}
          {qe.ballotHistory.length > 1 && (
            <section className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800/90 space-y-2">
              <div className="text-[11px] font-semibold text-slate-300">
                Cronologia Scrutini Precedenti
              </div>
              <div className="space-y-1.5 text-[11px] text-slate-400">
                {qe.ballotHistory.slice(1).map((b) => (
                  <div
                    key={b.ballotNumber}
                    className="flex flex-wrap items-center justify-between gap-2 py-1 border-b border-slate-800/70 last:border-b-0"
                  >
                    <span>{b.summary}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sticky Footer Action */}
        {!qe.electedCandidate && (
          <footer className="px-4 sm:px-6 pt-3.5 safe-area-modal-footer border-t border-slate-800 bg-[#090D16] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-300">
              Candidato sostenuto dal tuo gruppo:{' '}
              <strong className="text-amber-300">{selectedCandidate?.name ?? 'Nessuno'}</strong>{' '}
              <span className="text-slate-500">
                ({playerElectors} Grandi Elettori + {qe.negotiatedPartyIds.length} intese)
              </span>
            </div>
            <button
              type="button"
              disabled={!selectedCandidate}
              onClick={() => selectedCandidate && onRunBallot(selectedCandidate.id)}
              className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0"
            >
              <Vote className="w-4 h-4 shrink-0" />
              <span>Avvia Chiama · Scrutinio #{qe.ballotNumber}</span>
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};

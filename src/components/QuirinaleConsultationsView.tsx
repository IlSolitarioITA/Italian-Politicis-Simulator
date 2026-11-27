import React, { useEffect, useMemo, useState } from 'react';
import {
  KEY_MINISTRIES,
  TOTAL_MINISTRY_WEIGHT,
  buildAutoMinistryExecutives,
  evaluateExecutiveMinistryAffinity,
  getSpecializationLabel,
  pickBestExecutiveForMinistry,
} from '../data/ministries';
import {
  buildAutoCencelliAssignments,
  evaluateCencelliSatisfaction,
} from '../engine/simulation';
import { GameState, MinistryId } from '../types/game';
import { PartyEmblem } from './PartyEmblem';
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  CheckCircle2,
  Landmark,
  Scale,
  SlidersHorizontal,
  UserCheck,
  XCircle,
} from 'lucide-react';

interface QuirinaleConsultationsViewProps {
  state: GameState;
  onFormGovernment: (
    assignments: Partial<Record<MinistryId, string>>,
    execAssignments?: Partial<Record<MinistryId, string>>
  ) => void;
  onDeclineMandate: () => void;
  onReviewResults: () => void;
}

export const QuirinaleConsultationsView: React.FC<QuirinaleConsultationsViewProps> = ({
  state,
  onFormGovernment,
  onDeclineMandate,
  onReviewResults,
}) => {
  const election = state.election;
  const player = state.parties.find((p) => p.id === state.playerPartyId);
  const playerId = player?.id ?? state.playerPartyId;

  const buildInitialAssignments = (pid: string): Record<MinistryId, string> => ({
    mef: pid,
    interno: pid,
    giustizia: pid,
    esteri: pid,
    infrastrutture: pid,
    salute: pid,
    istruzione: pid,
    ambiente: pid,
  });

  // Avvia la trattativa con tutti gli 8 ministeri assegnati al partito del giocatore così
  // l'utente vede subito il peso degli alleati e negozia attivamente secondo il Manuale Cencelli
  const [assignments, setAssignments] = useState<Record<MinistryId, string>>(() =>
    buildInitialAssignments(playerId)
  );

  const [execAssignments, setExecAssignments] = useState<Partial<Record<MinistryId, string>>>(() =>
    buildAutoMinistryExecutives(
      buildInitialAssignments(playerId),
      playerId,
      state.executives
    )
  );

  const electionWeekKey = election?.conductedAtWeek ?? 0;
  useEffect(() => {
    const initial = buildInitialAssignments(playerId);
    setAssignments(initial);
    setExecAssignments(buildAutoMinistryExecutives(initial, playerId, state.executives));
  }, [electionWeekKey, playerId, state.executives]);

  const evaluation = useMemo(
    () =>
      evaluateCencelliSatisfaction(
        state.parties,
        state.playerPartyId,
        election?.seats ?? [],
        assignments
      ),
    [state.parties, state.playerPartyId, election?.seats, assignments]
  );

  const cabinetAffinitySummary = useMemo(() => {
    let affine = 0;
    let parziale = 0;
    let fuoriRuolo = 0;
    for (const m of KEY_MINISTRIES) {
      if (assignments[m.id] !== playerId) continue;
      const exec = state.executives.find((e) => e.id === execAssignments[m.id]);
      const aff = evaluateExecutiveMinistryAffinity(exec, m.id);
      if (aff.level === 'affine') affine += 1;
      else if (aff.level === 'parziale') parziale += 1;
      else fuoriRuolo += 1;
    }
    return { affine, parziale, fuoriRuolo };
  }, [assignments, execAssignments, playerId, state.executives]);

  if (!election || !player) {
    return null;
  }

  const playerTotalSeats = evaluation.playerCameraSeats + evaluation.playerSenatoSeats;
  if (playerTotalSeats <= 0) {
    return (
      <div className="h-full max-h-[100dvh] overflow-y-auto overflow-x-hidden war-scroll safe-area-scroll-bottom p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-[#111827] border border-slate-700 rounded-xl p-5 space-y-4 text-center">
          <h2 className="text-base font-bold text-slate-50">
            Consultazioni riservate ai gruppi parlamentari
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Il tuo partito non ha ottenuto seggi in questa tornata elettorale e non può partecipare alla formazione dell’esecutivo al Quirinale.
          </p>
          <button
            type="button"
            onClick={onReviewResults}
            className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-xs cursor-pointer transition-colors"
          >
            Torna ai Risultati Elettorali
          </button>
        </div>
      </div>
    );
  }

  const handleAssign = (ministryId: MinistryId, partyId: string) => {
    setAssignments((prev) => ({ ...prev, [ministryId]: partyId }));
    if (partyId === player.id) {
      setExecAssignments((prev) => {
        if (prev[ministryId]) return prev;
        const used = new Set(Object.values(prev).filter((v): v is string => Boolean(v)));
        const best = pickBestExecutiveForMinistry(state.executives, ministryId, used);
        return best ? { ...prev, [ministryId]: best.id } : prev;
      });
    }
  };

  const handleAssignExec = (ministryId: MinistryId, execId: string) => {
    setExecAssignments((prev) => ({ ...prev, [ministryId]: execId }));
  };

  const handleAutoCencelli = () => {
    const balanced = buildAutoCencelliAssignments(
      state.parties,
      state.playerPartyId,
      election.seats
    );
    setAssignments(balanced);
    setExecAssignments(buildAutoMinistryExecutives(balanced, player.id, state.executives));
  };

  const seatOf = (partyId: string) =>
    election.seats.find((s) => s.partyId === partyId) ?? { camera: 0, senato: 0 };

  return (
    <div className="h-full max-h-[100dvh] overflow-y-auto overflow-x-hidden war-scroll safe-area-scroll-bottom p-3 sm:p-4 lg:p-5">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header Consultazioni al Quirinale */}
        <section className="bg-[#111827] border border-amber-500/45 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-amber-400 font-medium">
                <Landmark className="w-4 h-4 shrink-0" />
                <span>Consultazioni al Quirinale</span>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <span className="text-slate-400 font-mono">{election.dateLabel}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-50 leading-tight">
                Formazione del Governo, Manuale Cencelli e Squadra Ministri
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                La coalizione <strong className="text-slate-100">{state.coalitionName}</strong> dispone di{' '}
                <strong className="font-mono tabular-nums text-emerald-400">
                  {evaluation.totalCoalitionCamera} seggi alla Camera
                </strong>{' '}
                e{' '}
                <strong className="font-mono tabular-nums text-emerald-400">
                  {evaluation.totalCoalitionSenato} al Senato
                </strong>
                . Ripartisci gli 8 Ministeri Chiave con gli alleati e scegli i dirigenti più affini per i dicasteri del tuo partito.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onReviewResults}
                className="px-3 py-2 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                <span>Rivedi Scrutinio</span>
              </button>
              {evaluation.allyReports.length > 0 && (
                <button
                  type="button"
                  onClick={handleAutoCencelli}
                  className="px-3 py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/45 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                  <span>Proposta Cencelli</span>
                </button>
              )}
            </div>
          </div>

          {/* Barra Sintesi Fiducia Parlamentare */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/90">
            <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800">
              <div className="text-[11px] text-slate-400">Voti di Fiducia alla Camera</div>
              <div
                className={`font-mono text-lg font-bold tabular-nums mt-0.5 ${
                  evaluation.canFormGovernment ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {evaluation.confidentCamera}{' '}
                <span className="text-xs font-normal text-slate-500">/ 201 richiesti</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800">
              <div className="text-[11px] text-slate-400">Voti di Fiducia al Senato</div>
              <div
                className={`font-mono text-lg font-bold tabular-nums mt-0.5 ${
                  evaluation.confidentSenato >= 101 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {evaluation.confidentSenato}{' '}
                <span className="text-xs font-normal text-slate-500">/ 101 maggioranza</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800">
              <div className="text-[11px] text-slate-400">Esito Trattativa al Colle</div>
              <div
                className={`text-sm font-semibold mt-1 flex items-center gap-1.5 ${
                  evaluation.canFormGovernment ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {evaluation.canFormGovernment ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Maggioranza Pronta al Giuramento</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Accordo Bloccato dagli Alleati</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Corpo principale: Sinistra 7 col (8 Ministeri) | Destra 5 col (Soddisfazione Alleati + Affinità Squadra) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* Tavolo di Spartizione 8 Ministeri Chiave */}
          <section className="xl:col-span-7 bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-3 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Spartizione degli 8 Ministeri Chiave</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Assegna ogni dicastero a un partito (peso totale Cencelli:{' '}
                  <span className="font-mono tabular-nums text-slate-300">
                    {TOTAL_MINISTRY_WEIGHT.toFixed(1)}
                  </span>
                  ) e abbina un dirigente affine sui tuoi ministeri.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {KEY_MINISTRIES.map((ministry) => {
                const assignedId = assignments[ministry.id];
                const holder = state.parties.find((p) => p.id === assignedId);
                const isPlayerHeld = assignedId === player.id;
                const assignedExecId = execAssignments[ministry.id] ?? '';
                const assignedExec = state.executives.find((e) => e.id === assignedExecId);
                const affinity = isPlayerHeld
                  ? evaluateExecutiveMinistryAffinity(assignedExec, ministry.id)
                  : null;

                return (
                  <div
                    key={ministry.id}
                    className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800/90 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-100 leading-snug">
                          {ministry.name}
                        </h4>
                        <span className="text-[11px] font-mono tabular-nums text-amber-400 shrink-0">
                          Peso {ministry.weight.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {ministry.portfolioDesc}
                      </p>
                      <div className="text-[10px] text-cyan-400/90">
                        Specializzazione richiesta:{' '}
                        <span className="font-semibold text-cyan-300">
                          {getSpecializationLabel(ministry.requiredSpecialization)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800/70">
                      <div className="text-[10px] text-slate-500">
                        Assegnato a:{' '}
                        <span className="text-slate-200 font-medium">
                          {holder ? `${holder.name} (${holder.acronym})` : '—'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {evaluation.coalitionParties.map((party) => {
                          const isSelected = assignedId === party.id;
                          return (
                            <button
                              key={party.id}
                              type="button"
                              onClick={() => handleAssign(ministry.id, party.id)}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-cyan-500/20 border-cyan-400 text-slate-50'
                                  : 'bg-[#111827] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                              }`}
                            >
                              <PartyEmblem
                                emblem={party.emblem}
                                color={party.color}
                                customUrl={party.customEmblemUrl}
                                size={16}
                              />
                              <span>{party.acronym}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Scelta del Dirigente & Calcolo Affinità per i Ministeri del Giocatore */}
                      {isPlayerHeld && (
                        <div className="pt-2 border-t border-slate-800/70 space-y-1.5">
                          <div className="flex items-center justify-between gap-2 text-[10px]">
                            <span className="text-slate-400 flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span>Ministro designato ({player.acronym})</span>
                            </span>
                            {affinity && (
                              <span
                                className={`font-semibold ${
                                  affinity.level === 'affine'
                                    ? 'text-emerald-400'
                                    : affinity.level === 'parziale'
                                      ? 'text-amber-300'
                                      : 'text-rose-400'
                                }`}
                              >
                                {affinity.label}
                              </span>
                            )}
                          </div>

                          <select
                            value={assignedExecId}
                            onChange={(e) => handleAssignExec(ministry.id, e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#111827] border border-slate-700 text-[11px] text-slate-100 focus:outline-none focus:border-cyan-400 cursor-pointer"
                          >
                            {state.executives.map((ex) => {
                              const exAff = evaluateExecutiveMinistryAffinity(ex, ministry.id);
                              return (
                                <option key={ex.id} value={ex.id}>
                                  {ex.name} · {getSpecializationLabel(ex.specialization)} ({exAff.shortBadge})
                                </option>
                              );
                            })}
                          </select>

                          {affinity && (
                            <p
                              className={`text-[10px] leading-snug ${
                                affinity.level === 'affine'
                                  ? 'text-emerald-300/90'
                                  : affinity.level === 'parziale'
                                    ? 'text-slate-400'
                                    : 'text-rose-300'
                              }`}
                            >
                              {affinity.effectSummary}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Pannello Soddisfazione Coalizione & Qualità Squadra */}
          <aside className="xl:col-span-5 bg-[#111827] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between gap-4 min-w-0">
            <div className="space-y-3">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-slate-100">
                  Soddisfazione Coalizione & Affinità Squadra
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Ogni alleato richiede almeno <span className="font-mono text-slate-200">50%</span> di soddisfazione. I tuoi ministri affini danno bonus efficienza e buona stampa.
                </p>
              </div>

              {/* Riepilogo Partito del Giocatore (Premier incaricato) */}
              <div className="p-3 rounded-lg bg-[#090D16] border border-cyan-500/40 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <PartyEmblem
                      emblem={player.emblem}
                      color={player.color}
                      customUrl={player.customEmblemUrl}
                      size={24}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-cyan-300 whitespace-normal leading-snug break-words">
                        {player.name} ({player.acronym})
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Premier incaricato · {player.leaderName}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[11px] tabular-nums shrink-0">
                    <div className="text-slate-100 font-semibold">
                      {seatOf(player.id).camera} Cam. / {seatOf(player.id).senato} Sen.
                    </div>
                    <div className="text-[10px] text-cyan-400">
                      {evaluation.playerAssignedMinistries.length} min. (peso{' '}
                      {evaluation.playerAssignedWeight.toFixed(1)})
                    </div>
                  </div>
                </div>

                {/* Riepilogo Affinità Ministri Giocatore */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
                  <div className="p-1.5 rounded bg-[#111827] border border-emerald-500/30">
                    <div className="text-[10px] text-slate-400">Affini</div>
                    <div className="font-mono text-xs font-bold text-emerald-400 tabular-nums">
                      {cabinetAffinitySummary.affine}
                    </div>
                  </div>
                  <div className="p-1.5 rounded bg-[#111827] border border-amber-500/30">
                    <div className="text-[10px] text-slate-400">Parziali</div>
                    <div className="font-mono text-xs font-bold text-amber-300 tabular-nums">
                      {cabinetAffinitySummary.parziale}
                    </div>
                  </div>
                  <div className="p-1.5 rounded bg-[#111827] border border-rose-500/30">
                    <div className="text-[10px] text-slate-400">Fuori ruolo</div>
                    <div className="font-mono text-xs font-bold text-rose-400 tabular-nums">
                      {cabinetAffinitySummary.fuoriRuolo}
                    </div>
                  </div>
                </div>

                {cabinetAffinitySummary.fuoriRuolo > 0 && (
                  <div className="text-[10px] text-rose-300 leading-snug">
                    Attenzione: {cabinetAffinitySummary.fuoriRuolo}{' '}
                    {cabinetAffinitySummary.fuoriRuolo === 1
                      ? 'dicastero ha un dirigente fuori ruolo'
                      : 'dicasteri hanno dirigenti fuori ruolo'}
                    . Rischio critiche stampa, malus credibilità e risultati peggiori.
                  </div>
                )}
              </div>

              {/* Barre Soddisfazione Alleati */}
              {evaluation.allyReports.length === 0 ? (
                <div className="p-4 rounded-lg bg-[#090D16] border border-emerald-500/35 text-xs text-slate-300 leading-relaxed">
                  <div className="font-semibold text-emerald-400 mb-1">
                    Maggioranza Autonoma Monocolore
                  </div>
                  Il tuo partito supera da solo quota 201 deputati alla Camera: tutti gli 8 Ministeri Chiave restano nelle tue mani. Abbina con cura i dirigenti alle rispettive specializzazioni.
                </div>
              ) : (
                <div className="space-y-3">
                  {evaluation.allyReports.map((ally) => {
                    const allyParty = state.parties.find((p) => p.id === ally.partyId);
                    const barColor =
                      ally.status === 'fiducia'
                        ? 'bg-emerald-500'
                        : ally.status === 'teso'
                          ? 'bg-amber-500'
                          : 'bg-rose-500';
                    const textColor =
                      ally.status === 'fiducia'
                        ? 'text-emerald-400'
                        : ally.status === 'teso'
                          ? 'text-amber-400'
                          : 'text-rose-400';

                    return (
                      <div
                        key={ally.partyId}
                        className="p-3.5 rounded-lg bg-[#090D16] border border-slate-800/90 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {allyParty && (
                              <PartyEmblem
                                emblem={allyParty.emblem}
                                color={allyParty.color}
                                customUrl={allyParty.customEmblemUrl}
                                size={24}
                              />
                            )}
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-100 whitespace-normal leading-snug break-words">
                                {ally.partyName} ({ally.partyAcronym})
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                                {ally.cameraSeats} Cam. · {ally.senatoSeats} Sen. ·{' '}
                                {ally.seatSharePct.toFixed(1)}% coalizione
                              </div>
                            </div>
                          </div>

                          <div className={`font-mono text-sm font-bold tabular-nums shrink-0 ${textColor}`}>
                            {ally.satisfaction}%
                          </div>
                        </div>

                        {/* Progress bar Soddisfazione */}
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-200 ${barColor}`}
                            style={{ width: `${ally.satisfaction}%` }}
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                          <span className={`font-semibold flex items-center gap-1 ${textColor}`}>
                            {ally.status === 'fiducia' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            ) : ally.status === 'teso' ? (
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span>{ally.statusLabel}</span>
                          </span>
                          <span className="font-mono text-[10px] tabular-nums text-slate-400">
                            Peso {ally.assignedWeight.toFixed(1)} / atteso {ally.expectedWeight.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Azioni Finali al Quirinale */}
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              {!evaluation.canFormGovernment && (
                <div className="p-3 rounded-lg bg-rose-950/35 border border-rose-500/45 text-[11px] text-rose-200 leading-relaxed">
                  Senza la fiducia di{' '}
                  <strong>
                    {evaluation.blockingAllies.map((b) => b.partyAcronym).join(', ')}
                  </strong>{' '}
                  ti fermi a{' '}
                  <strong className="font-mono tabular-nums">
                    {evaluation.confidentCamera}/201
                  </strong>{' '}
                  seggi alla Camera. Cedi uno o più ministeri chiave per chiudere l’accordo.
                </div>
              )}

              <button
                type="button"
                disabled={!evaluation.canFormGovernment}
                onClick={() => onFormGovernment(assignments, execAssignments)}
                className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                  evaluation.canFormGovernment
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                    : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Award className="w-4 h-4 shrink-0" />
                <span>Giura al Quirinale · Diventa Presidente del Consiglio</span>
              </button>

              <button
                type="button"
                onClick={onDeclineMandate}
                className="w-full py-2 px-3 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-[11px] font-medium text-slate-300 transition-colors cursor-pointer"
              >
                Rinuncia all’Incarico e vai all’Opposizione
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

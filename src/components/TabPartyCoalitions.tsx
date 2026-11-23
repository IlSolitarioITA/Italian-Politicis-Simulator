import React, { useMemo } from 'react';
import { LEADER_TRAITS, LEADERSHIP_STYLES } from '../data/presets';
import {
  calculateParliamentSeats,
  calculateWeeklyPartyFinances,
  computeIdeologicalCompatibility,
} from '../engine/simulation';
import { GameState } from '../types/game';
import { PartyEmblem } from './PartyEmblem';
import {
  AlertTriangle,
  Briefcase,
  Handshake,
  MessageSquare,
  RefreshCw,
  Shield,
  Swords,
  UserX,
} from 'lucide-react';

interface TabPartyCoalitionsProps {
  state: GameState;
  onManageExecutive: (
    execId: string,
    action: 'colloquio' | 'incarico' | 'sostituisci'
  ) => void;
  onNegotiateCoalition: (
    partyId: string,
    action: 'proponi_alleanza' | 'patto_governo' | 'rompi_alleanza' | 'attacco'
  ) => void;
}

export const TabPartyCoalitions: React.FC<TabPartyCoalitionsProps> = ({
  state,
  onManageExecutive,
  onNegotiateCoalition,
}) => {
  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const seats = useMemo(
    () => calculateParliamentSeats(state.parties, state.electoralLaw),
    [state.parties, state.electoralLaw]
  );
  const weeklyFinances = useMemo(() => calculateWeeklyPartyFinances(state), [state]);

  const coalitionMembers = useMemo(() => {
    return state.parties.filter(
      (p) =>
        p.id !== 'altri' &&
        (p.id === player.id ||
          (player.coalitionId && p.coalitionId === player.coalitionId))
    );
  }, [state.parties, player]);

  const coalitionStats = useMemo(() => {
    const poll = coalitionMembers.reduce((acc, m) => acc + m.nationalPoll, 0);
    const camera = coalitionMembers.reduce(
      (acc, m) => acc + (seats.find((s) => s.partyId === m.id)?.camera ?? 0),
      0
    );
    const senato = coalitionMembers.reduce(
      (acc, m) => acc + (seats.find((s) => s.partyId === m.id)?.senato ?? 0),
      0
    );
    return { poll, camera, senato };
  }, [coalitionMembers, seats]);

  const otherParties = useMemo(() => {
    return state.parties
      .filter((p) => p.id !== state.playerPartyId && p.id !== 'altri')
      .sort(
        (a, b) =>
          computeIdeologicalCompatibility(player, b) -
          computeIdeologicalCompatibility(player, a)
      );
  }, [state.parties, state.playerPartyId, player]);

  const getSchismRisk = (loyalty: number, ambition: number) => {
    if (loyalty <= 35) return { label: 'Critico', cls: 'text-rose-400' };
    if (loyalty <= 52 || (loyalty <= 60 && ambition >= 75))
      return { label: 'Alto', cls: 'text-amber-400' };
    if (loyalty <= 72) return { label: 'Medio', cls: 'text-cyan-400' };
    return { label: 'Basso', cls: 'text-emerald-400' };
  };

  const leaderStyleObj = LEADERSHIP_STYLES.find((s) => s.id === state.leader.style);

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden war-scroll p-3 sm:p-4 lg:p-5">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left (6 cols): Leader Profile + 4 Key Executives */}
        <div className="xl:col-span-6 space-y-4 min-w-0">
          {/* Leader Summary Card */}
          <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <PartyEmblem
                  emblem={player.emblem}
                  color={player.color}
                  customUrl={player.customEmblemUrl}
                  size={44}
                />
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-50 truncate">
                    {state.leader.name}{' '}
                    <span className="text-xs font-mono font-normal text-slate-400">
                      ({state.leader.age} anni)
                    </span>
                  </h2>
                  <div className="text-xs text-slate-400">
                    Stile: <span className="text-cyan-300">{leaderStyleObj?.label}</span> · Tratti:{' '}
                    <span className="text-amber-300">
                      {state.leader.traits
                        .map((id) => LEADER_TRAITS.find((t) => t.id === id)?.label)
                        .join(' / ')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="sm:text-right text-xs shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/70">
                <div className="text-slate-400">Saldo netto settimanale</div>
                <div
                  className={`font-mono tabular-nums font-semibold ${
                    weeklyFinances.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {weeklyFinances.netBalance >= 0 ? '+' : '-'}€
                  {Math.abs(weeklyFinances.netBalance).toLocaleString('it-IT')}/sett.
                </div>
              </div>
            </div>

            {/* Bilancio Realistico Partito (L. 13/2014 — Zero finanziamento pubblico diretto) */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-[#090D16] border border-slate-800/80">
                <div className="text-slate-400 truncate">Tesseramento</div>
                <div className="font-mono tabular-nums text-cyan-300 font-semibold mt-0.5">
                  +€{weeklyFinances.membershipAndHq.toLocaleString('it-IT')}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-[#090D16] border border-slate-800/80">
                <div className="text-slate-400 truncate">2×1000 IRPEF</div>
                <div className="font-mono tabular-nums text-emerald-400 font-semibold mt-0.5">
                  +€{weeklyFinances.twoPerThousand.toLocaleString('it-IT')}
                </div>
              </div>
              <div
                className="p-2 rounded-lg bg-[#090D16] border border-slate-800/80"
                title="+€400/settimana per ogni deputato o senatore eletto (€0 se 0 parlamentari)"
              >
                <div className="text-slate-400 truncate">
                  Parlamentari ({weeklyFinances.electedSeats})
                </div>
                <div className="font-mono tabular-nums text-emerald-400 font-semibold mt-0.5">
                  +€{weeklyFinances.parliamentaryContributions.toLocaleString('it-IT')}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-[#090D16] border border-slate-800/80">
                <div className="text-slate-400 truncate">Spese Struttura</div>
                <div className="font-mono tabular-nums text-amber-400 font-semibold mt-0.5">
                  -€{weeklyFinances.totalExpenses.toLocaleString('it-IT')}
                </div>
              </div>
            </div>
          </section>

          {/* 4 Dynamic Ideological Axes Card */}
          <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-3">
            <div className="flex items-baseline justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-100">
                  Identità Ideologica Dinamica (4 Assi)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Si evolve con ogni scelta su crisi e leggi, influenzando elettorato e alleanze.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {(
                [
                  {
                    key: 'economic' as const,
                    title: 'Economia',
                    left: 'Statalista',
                    right: 'Liberista',
                    color: 'bg-cyan-400',
                  },
                  {
                    key: 'society' as const,
                    title: 'Diritti e Società',
                    left: 'Conservatore',
                    right: 'Progressista',
                    color: 'bg-emerald-400',
                  },
                  {
                    key: 'europe' as const,
                    title: 'Europa',
                    left: 'Sovranista',
                    right: 'Federalista UE',
                    color: 'bg-amber-400',
                  },
                  {
                    key: 'institutions' as const,
                    title: 'Istituzioni',
                    left: 'Democratico',
                    right: 'Autoritario',
                    color: 'bg-rose-400',
                  },
                ]
              ).map((ax) => {
                const val = player.axis[ax.key];
                const pct = Math.max(0, Math.min(100, (val + 100) / 2));
                const stanceLabel =
                  Math.abs(val) < 15
                    ? 'Equilibrato'
                    : val < 0
                      ? ax.left
                      : ax.right;
                return (
                  <div key={ax.key} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-200">{ax.title}</span>
                      <span className="font-mono tabular-nums text-slate-300">
                        {stanceLabel} ({val > 0 ? `+${val}` : val})
                      </span>
                    </div>
                    <div className="relative h-2 bg-[#090D16] border border-slate-800 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-600/80"
                        aria-hidden="true"
                      />
                      <div
                        style={{
                          left: val >= 0 ? '50%' : `${pct}%`,
                          width: `${Math.abs(val) / 2}%`,
                        }}
                        className={`absolute top-0 bottom-0 ${ax.color}`}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>{ax.left}</span>
                      <span>{ax.right}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 4 Key Executives */}
          <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-3">
            <div className="flex items-baseline justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-100">
                  Segreteria Nazionale (4 Dirigenti Chiave)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Se la lealtà scende sotto il 25%, il dirigente può guidare una scissione interna.
                </p>
              </div>
              <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
            </div>

            <div className="space-y-3">
              {state.executives.map((exec) => {
                const risk = getSchismRisk(exec.loyalty, exec.ambition);
                return (
                  <div
                    key={exec.id}
                    className="p-3.5 rounded-lg bg-[#090D16] border border-slate-800/90 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium text-cyan-400">
                          {exec.roleLabel} · {exec.faction}
                        </div>
                        <div className="text-sm font-semibold text-slate-100 mt-0.5 truncate">
                          {exec.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{exec.trait}</div>
                      </div>

                      <div className="sm:text-right text-[11px] flex sm:block items-center justify-between gap-2 shrink-0">
                        <div className="text-slate-400">Rischio Scissione</div>
                        <div
                          className={`font-semibold flex items-center sm:justify-end gap-1 ${risk.cls}`}
                        >
                          {risk.label === 'Critico' && <AlertTriangle className="w-3 h-3" />}
                          <span>{risk.label}</span>
                        </div>
                      </div>
                    </div>

                    {/* Competence & Loyalty Bars */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-400">Competenza</span>
                          <span className="font-mono tabular-nums text-slate-200">
                            {exec.competence}/100
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${exec.competence}%` }}
                            className="h-full bg-cyan-400"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-400">Lealtà</span>
                          <span
                            className={`font-mono tabular-nums ${
                              exec.loyalty <= 35
                                ? 'text-rose-400'
                                : exec.loyalty <= 55
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                            }`}
                          >
                            {exec.loyalty}/100
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${exec.loyalty}%` }}
                            className={`h-full ${
                              exec.loyalty <= 35
                                ? 'bg-rose-500'
                                : exec.loyalty <= 55
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-400'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Management Controls — Responsive wrap with zero clipping */}
                    <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={exec.actedThisWeek || state.politicalCapital <= 0}
                        onClick={() => onManageExecutive(exec.id, 'colloquio')}
                        className={`px-2.5 py-2 sm:py-1.5 rounded-md text-[11px] font-medium flex items-center justify-center gap-1.5 border transition-colors ${
                          exec.actedThisWeek || state.politicalCapital <= 0
                            ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 cursor-pointer'
                        }`}
                      >
                        <MessageSquare className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>Colloquio (1 PA)</span>
                      </button>

                      <button
                        type="button"
                        disabled={exec.actedThisWeek || state.budget < 20000}
                        onClick={() => onManageExecutive(exec.id, 'incarico')}
                        className={`px-2.5 py-2 sm:py-1.5 rounded-md text-[11px] font-medium flex items-center justify-center gap-1.5 border transition-colors ${
                          exec.actedThisWeek || state.budget < 20000
                            ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 cursor-pointer'
                        }`}
                      >
                        <Briefcase className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>Affida Dossier (€20k)</span>
                      </button>

                      <button
                        type="button"
                        disabled={state.budget < 35000}
                        onClick={() => onManageExecutive(exec.id, 'sostituisci')}
                        className={`px-2.5 py-2 sm:py-1.5 rounded-md text-[11px] font-medium flex items-center justify-center gap-1.5 border transition-colors sm:ml-auto ${
                          state.budget < 35000
                            ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                            : 'bg-rose-950/30 hover:bg-rose-950/60 border-rose-500/40 text-rose-300 cursor-pointer'
                        }`}
                      >
                        <RefreshCw className="w-3 h-3 shrink-0" />
                        <span>Sostituisci (€35k)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right (6 cols): Coalition Panel & Inter-Party Negotiations */}
        <div className="xl:col-span-6 space-y-4 min-w-0">
          {/* Active Coalition Summary */}
          <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-cyan-400 font-medium">La Tua Coalizione Attuale</div>
                <h3 className="text-base font-bold text-slate-50 mt-0.5 truncate">
                  {state.coalitionName}
                </h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  Partiti aderenti:{' '}
                  <span className="text-slate-200">
                    {coalitionMembers.map((m) => m.acronym).join(' · ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-slate-800 text-center sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/70 shrink-0">
                <div className="px-2 sm:px-3">
                  <div className="text-[10px] text-slate-400">Sondaggio</div>
                  <div className="font-mono text-sm font-bold tabular-nums text-cyan-300">
                    {coalitionStats.poll.toFixed(1)}%
                  </div>
                </div>
                <div className="px-2 sm:px-3">
                  <div className="text-[10px] text-slate-400">Camera</div>
                  <div
                    className={`font-mono text-sm font-bold tabular-nums ${
                      coalitionStats.camera >= 201 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {coalitionStats.camera}/201
                  </div>
                </div>
                <div className="pl-2 sm:pl-3">
                  <div className="text-[10px] text-slate-400">Senato</div>
                  <div
                    className={`font-mono text-sm font-bold tabular-nums ${
                      coalitionStats.senato >= 101 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {coalitionStats.senato}/101
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Diplomatic Table */}
          <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-3">
            <div className="pb-2 border-b border-slate-800 flex items-baseline justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-100">
                  Diplomazia Parlamentare e Alleanze
                </h3>
                <p className="text-[11px] text-slate-400">
                  Le alleanze sommano i voti nei collegi uninominali dell’Emiciclo e alla Notte Elettorale.
                </p>
              </div>
              <Handshake className="w-4 h-4 text-amber-400 shrink-0" />
            </div>

            <div className="space-y-2.5">
              {otherParties.map((p) => {
                const compat = computeIdeologicalCompatibility(player, p);
                const isAllied =
                  Boolean(player.coalitionId) && p.coalitionId === player.coalitionId;
                const statusText = isAllied
                  ? 'Alleato di Coalizione'
                  : p.coalitionStatus === 'desistenza'
                    ? 'Patto di Desistenza'
                    : p.coalitionStatus === 'dialogo'
                      ? 'Canale Aperto'
                      : 'Avversario';
                const statusColor = isAllied
                  ? 'text-emerald-400'
                  : p.coalitionStatus === 'desistenza'
                    ? 'text-cyan-400'
                    : p.coalitionStatus === 'dialogo'
                      ? 'text-amber-400'
                      : 'text-slate-400';

                return (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-lg bg-[#090D16] border border-slate-800/90 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <PartyEmblem emblem={p.emblem} color={p.color} size={30} />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                            <span className="truncate">{p.name}</span>
                            <span className="font-mono text-slate-400 shrink-0">
                              ({p.acronym})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {p.leaderName} ·{' '}
                            <span className="font-mono tabular-nums text-slate-200">
                              {p.nationalPoll.toFixed(1)}%
                            </span>{' '}
                            · <span className={statusColor}>{statusText}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 text-[11px] font-mono tabular-nums pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 shrink-0">
                        <div>
                          <span className="text-[10px] font-sans text-slate-500 sm:block">
                            Compatibilità{' '}
                          </span>
                          <span className="text-cyan-300 font-semibold">{compat}%</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-sans text-slate-500 sm:block">
                            Rapporto{' '}
                          </span>
                          <span
                            className={
                              p.relationWithPlayer >= 25
                                ? 'text-emerald-400 font-semibold'
                                : p.relationWithPlayer <= -20
                                  ? 'text-rose-400 font-semibold'
                                  : 'text-slate-300 font-semibold'
                            }
                          >
                            {p.relationWithPlayer > 0
                              ? `+${p.relationWithPlayer}`
                              : p.relationWithPlayer}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons always contained inside viewport */}
                    <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2">
                      {!isAllied ? (
                        <>
                          <button
                            type="button"
                            disabled={state.politicalCapital <= 0}
                            onClick={() =>
                              onNegotiateCoalition(p.id, 'proponi_alleanza')
                            }
                            className={`px-3 py-2 sm:py-1.5 rounded-md text-[11px] font-medium border text-center transition-colors ${
                              state.politicalCapital <= 0
                                ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300 cursor-pointer'
                            }`}
                          >
                            Proponi Alleanza (1 PA)
                          </button>
                          <button
                            type="button"
                            disabled={state.politicalCapital <= 0}
                            onClick={() => onNegotiateCoalition(p.id, 'patto_governo')}
                            className={`px-3 py-2 sm:py-1.5 rounded-md text-[11px] font-medium border text-center transition-colors ${
                              state.politicalCapital <= 0
                                ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/40 text-cyan-300 cursor-pointer'
                            }`}
                          >
                            Patto di Governo (1 PA)
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onNegotiateCoalition(p.id, 'rompi_alleanza')}
                          className="px-3 py-2 sm:py-1.5 rounded-md text-[11px] font-medium border bg-rose-950/30 hover:bg-rose-950/60 border-rose-500/40 text-rose-300 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <UserX className="w-3 h-3 shrink-0" />
                          <span>Rompi Alleanza</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={state.politicalCapital <= 0}
                        onClick={() => onNegotiateCoalition(p.id, 'attacco')}
                        className={`px-3 py-2 sm:py-1.5 rounded-md text-[11px] font-medium border flex items-center justify-center gap-1.5 sm:ml-auto transition-colors ${
                          state.politicalCapital <= 0
                            ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                            : 'bg-slate-900 hover:bg-rose-950/40 border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 cursor-pointer'
                        }`}
                      >
                        <Swords className="w-3 h-3 shrink-0" />
                        <span>Attacco Frontale (1 PA)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

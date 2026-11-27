import React, { useState } from 'react';
import {
  EU_COMMISSIONER_PROFILES,
  EU_PARLIAMENT_GROUPS,
  EU_PARLIAMENT_GROUP_ORDER,
  computeEuGroupCompatibility,
  getEuBudgetRelief,
} from '../data/european';
import {
  EuCommissionVoteStance,
  EuCommissionerProfileId,
  EuParliamentGroupId,
  GameState,
} from '../types/game';
import { PartyEmblem } from './PartyEmblem';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Globe,
  Landmark,
  Scale,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  UserCheck,
  Users,
} from 'lucide-react';

interface EuropeanPostElectionModalProps {
  state: GameState;
  onChooseGroup: (groupId: EuParliamentGroupId) => void;
  onVoteCommission: (vote: EuCommissionVoteStance) => void;
  onNominateCommissioner: (profileId: EuCommissionerProfileId, customName?: string) => void;
  onCloseFlow: () => void;
}

export const EuropeanPostElectionModal: React.FC<EuropeanPostElectionModalProps> = ({
  state,
  onChooseGroup,
  onVoteCommission,
  onNominateCommissioner,
  onCloseFlow,
}) => {
  const eu = state.european;
  const flow = eu?.postElectionFlow;
  const [customCommissionerName, setCustomCommissionerName] = useState('');

  if (!eu || !flow || !flow.active) return null;

  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const isInNationalGov = flow.canNominateCommissioner;
  const isEuroskeptic = player.axis.europe < -10;
  const budgetRelief = getEuBudgetRelief(state);

  const steps: { id: 'group' | 'commission' | 'commissioner' | 'summary'; label: string }[] = [
    ...(flow.playerEuSeats > 0
      ? [
          { id: 'group' as const, label: '1. Gruppo UE' },
          { id: 'commission' as const, label: '2. Commissione' },
        ]
      : []),
    ...(isInNationalGov
      ? [
          {
            id: 'commissioner' as const,
            label: flow.playerEuSeats > 0 ? '3. Commissario' : '1. Commissario',
          },
        ]
      : []),
    { id: 'summary' as const, label: 'Riepilogo' },
  ];

  const currentStepIdx = steps.findIndex((s) => s.id === flow.step);
  const chosenGroupId = flow.chosenGroupId ?? eu.partyEuGroups[player.id] ?? 'ni';
  const chosenGroupMeta = EU_PARLIAMENT_GROUPS[chosenGroupId];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Insediamento Parlamento Europeo e Commissione UE"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4"
    >
      <div className="w-full max-w-4xl max-h-[90dvh] bg-[#0D1322] border border-blue-500/45 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-4 sm:px-6 py-4 bg-gradient-to-r from-[#0B142E] via-[#101C3F] to-[#0D1322] border-b border-blue-500/30 shrink-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <PartyEmblem
                emblem={player.emblem}
                color={player.color}
                customUrl={player.customEmblemUrl}
                size={36}
              />
              <div className="min-w-0">
                <div className="text-[11px] font-mono uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Strasburgo &amp; Bruxelles · Legislatura Europea {flow.electionYear}</span>
                </div>
                <h2 className="font-display text-base sm:text-lg font-bold text-slate-50 leading-snug">
                  {flow.step === 'group' && 'Adesione ai Gruppi Parlamentari Europei'}
                  {flow.step === 'commission' &&
                    `Voto di Fiducia alla Commissione ${eu.commission.presidentName}`}
                  {flow.step === 'commissioner' && 'Nomina del Commissario Europeo Italiano'}
                  {flow.step === 'summary' && 'Assetto Italiano a Bruxelles Confermato'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-[#090D16] border border-amber-500/40 text-amber-300 font-bold">
                {flow.playerEuSeats} Eurodeputat{flow.playerEuSeats === 1 ? 'o' : 'i'}
              </span>
              {isInNationalGov && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-semibold">
                  Al Governo in Italia
                </span>
              )}
            </div>
          </div>

          {/* Stepper */}
          <div className="flex flex-wrap items-center gap-1.5">
            {steps.map((s, idx) => {
              const done = idx < currentStepIdx;
              const current = idx === currentStepIdx;
              return (
                <div
                  key={s.id}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border flex items-center gap-1.5 ${
                    current
                      ? 'bg-blue-500/20 border-blue-400 text-blue-100'
                      : done
                        ? 'bg-emerald-500/12 border-emerald-500/40 text-emerald-300'
                        : 'bg-[#090D16]/70 border-slate-800 text-slate-500'
                  }`}
                >
                  {done && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                  <span>{s.label}</span>
                </div>
              );
            })}
          </div>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto war-scroll p-4 sm:p-6 space-y-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {/* STEP 1: GRUPPI PARLAMENTARI EUROPEI */}
          {flow.step === 'group' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 text-xs text-slate-300 leading-relaxed">
                Con <strong className="text-amber-300">{flow.playerEuSeats} eurodeputati</strong>{' '}
                eletti a Strasburgo, scegli a quale famiglia politica europea aderire. I partiti AI
                si sono già posizionati nel proprio gruppo naturale. Una scelta coerente compatta la
                base; i grandi gruppi della maggioranza UE garantiscono più peso su dossier e fondi.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {EU_PARLIAMENT_GROUP_ORDER.map((gid) => {
                  const grp = EU_PARLIAMENT_GROUPS[gid];
                  const compat = computeEuGroupCompatibility(player, gid);
                  const badgeStyle =
                    compat.label === 'Naturale'
                      ? 'bg-emerald-500/15 border-emerald-500/45 text-emerald-300'
                      : compat.label === 'Compatibile'
                        ? 'bg-cyan-500/15 border-cyan-500/45 text-cyan-200'
                        : compat.label === 'Forzata'
                          ? 'bg-amber-500/15 border-amber-500/45 text-amber-300'
                          : 'bg-rose-500/15 border-rose-500/45 text-rose-300';

                  return (
                    <button
                      key={gid}
                      type="button"
                      onClick={() => onChooseGroup(gid)}
                      className="p-3.5 rounded-xl bg-[#111827] hover:bg-[#162035] border border-slate-800 hover:border-blue-400/70 text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: grp.color }}
                            />
                            <span className="font-display font-bold text-sm text-slate-50 truncate">
                              {grp.acronym}
                            </span>
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded border text-[10px] font-mono font-semibold shrink-0 ${badgeStyle}`}
                          >
                            {compat.label} · {compat.score}%
                          </span>
                        </div>

                        <div className="text-[11px] font-semibold text-slate-200 leading-snug">
                          {grp.name}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {grp.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[10px]">
                        <div className="flex items-center justify-between text-slate-300">
                          <span>Peso a Bruxelles:</span>
                          <strong className="text-amber-300">{grp.brusselsWeight}</strong>
                        </div>
                        <p className="text-slate-400 leading-snug">{compat.baseReaction}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: VOTO DI FIDUCIA ALLA COMMISSIONE EUROPEA */}
          {flow.step === 'commission' && (
            <div className="space-y-4">
              {flow.groupReactionSummary && (
                <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/35 text-xs text-blue-100 flex items-start gap-2">
                  <Users className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
                  <span>{flow.groupReactionSummary}</span>
                </div>
              )}

              <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 shrink-0" />
                    Plenaria di Strasburgo · Fiducia al Presidente della Commissione
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Gruppo attivo:{' '}
                    <strong style={{ color: chosenGroupMeta.color }}>
                      {chosenGroupMeta.acronym}
                    </strong>
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  La plenaria del Parlamento Europeo vota l’elezione di{' '}
                  <strong className="text-slate-100">{eu.commission.presidentName}</strong> alla
                  guida della Commissione Europea per il prossimo quinquennio. La tua linea di voto
                  definisce l’ingresso nella maggioranza europea, la stabilità dello Spread e il
                  margine di trattativa sulla Legge di Bilancio.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* FAVOREVOLE */}
                <button
                  type="button"
                  onClick={() => onVoteCommission('favorevole')}
                  className="p-4 rounded-xl bg-[#111827] hover:bg-emerald-950/25 border border-emerald-500/40 hover:border-emerald-400 text-left flex flex-col justify-between gap-3 transition-all cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-300 font-display font-bold text-sm">
                      <ThumbsUp className="w-4 h-4 shrink-0" />
                      <span>Vota a Favore</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Entri nella maggioranza europea a sostegno della Commissione{' '}
                      {eu.commission.presidentName}.
                    </p>
                  </div>
                  <div className="space-y-1.5 text-[11px] pt-2 border-t border-slate-800">
                    <div className="text-emerald-300">
                      <strong>Pro:</strong> Ottimi rapporti con Bruxelles, Spread più stabile (-9
                      bps), scudo sui fondi UE e sulla Legge di Bilancio.
                    </div>
                    <div className="text-rose-300">
                      <strong>Contro:</strong>{' '}
                      {isEuroskeptic
                        ? 'Rischio calo di consenso e malumori nella tua base più critica verso l’UE.'
                        : 'Espone agli attacchi delle forze sovraniste in Italia.'}
                    </div>
                  </div>
                </button>

                {/* CONTRARIO */}
                <button
                  type="button"
                  onClick={() => onVoteCommission('contrario')}
                  className="p-4 rounded-xl bg-[#111827] hover:bg-rose-950/25 border border-rose-500/40 hover:border-rose-400 text-left flex flex-col justify-between gap-3 transition-all cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-rose-300 font-display font-bold text-sm">
                      <ThumbsDown className="w-4 h-4 shrink-0" />
                      <span>Vota Contro</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Linea dura di opposizione alla nuova Commissione e all’asse centrale di
                      Bruxelles.
                    </p>
                  </div>
                  <div className="space-y-1.5 text-[11px] pt-2 border-t border-slate-800">
                    <div className="text-emerald-300">
                      <strong>Pro:</strong> Forte spinta di consenso tra gli elettori euroscettici e
                      grande compattezza della base.
                    </div>
                    <div className="text-rose-300">
                      <strong>Contro:</strong>{' '}
                      {isInNationalGov
                        ? 'Isolamento istituzionale e forte pressione su Spread (+14 bps) e Manovra per il tuo Governo!'
                        : 'Isolamento istituzionale e minor peso nelle commissioni di Strasburgo.'}
                    </div>
                  </div>
                </button>

                {/* ASTENSIONE */}
                <button
                  type="button"
                  onClick={() => onVoteCommission('astenuto')}
                  className="p-4 rounded-xl bg-[#111827] hover:bg-amber-950/25 border border-amber-500/40 hover:border-amber-400 text-left flex flex-col justify-between gap-3 transition-all cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 font-display font-bold text-sm">
                      <Scale className="w-4 h-4 shrink-0" />
                      <span>Astensione</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Posizione intermedia di attesa: nessun appoggio esplicito ma nemmeno rottura
                      frontale.
                    </p>
                  </div>
                  <div className="space-y-1.5 text-[11px] pt-2 border-t border-slate-800">
                    <div className="text-emerald-300">
                      <strong>Pro:</strong> Evita spaccature interne tra correnti europeiste e
                      critiche del partito.
                    </div>
                    <div className="text-rose-300">
                      <strong>Contro:</strong> Letta dai media come indecisione (-2 gradimento) e
                      ti lascia fuori dalla cabina di regia europea.
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: NOMINA COMMISSARIO EUROPEO ITALIANO (SOLO SE AL GOVERNO) */}
          {flow.step === 'commissioner' && isInNationalGov && (
            <div className="space-y-4">
              {flow.commissionReactionSummary && (
                <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/35 text-xs text-blue-100 flex items-start gap-2">
                  <Landmark className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
                  <span>{flow.commissionReactionSummary}</span>
                </div>
              )}

              {flow.commissionerRejectedOnce && flow.commissionerOutcome && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/60 text-xs text-rose-100 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-rose-200">
                      Audizione Bocciata al Parlamento Europeo!
                    </div>
                    <p className="leading-relaxed">{flow.commissionerOutcome.summary}</p>
                    <p className="text-rose-200/90 font-medium">
                      Scegli ora un secondo profilo più spendibile per garantire un buon portafoglio
                      all’Italia.
                    </p>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 shrink-0" />
                    <span>Prerogativa di Governo · Designazione Commissario Europeo Italiano</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Rapporti UE attuali: {state.stateIndicators.euRelations}/100
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Come forza della maggioranza di Governo in Italia, indichi il nome del{' '}
                  <strong className="text-slate-100">Commissario Europeo italiano</strong>. Il
                  candidato dovrà superare l’audizione davanti alle commissioni del Parlamento
                  Europeo per ottenere un portafoglio di peso.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <label
                    htmlFor="eu-comm-name"
                    className="text-[11px] font-semibold text-slate-300 shrink-0"
                  >
                    Nome personalizzato (opzionale):
                  </label>
                  <input
                    id="eu-comm-name"
                    type="text"
                    maxLength={48}
                    value={customCommissionerName}
                    onChange={(e) => setCustomCommissionerName(e.target.value)}
                    placeholder="Lascia vuoto per il nome consigliato dal profilo..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#090D16] border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {EU_COMMISSIONER_PROFILES.map((prof) => {
                  const estChance = Math.max(
                    22,
                    Math.min(
                      98,
                      prof.basePassChance +
                        (eu.commission.inEuropeanMajority
                          ? 12
                          : eu.commission.playerVote === 'contrario'
                            ? -18
                            : 0) +
                        (state.stateIndicators.euRelations >= 70
                          ? 7
                          : state.stateIndicators.euRelations < 40
                            ? -12
                            : 0) +
                        (flow.commissionerRejectedOnce ? 18 : 0)
                    )
                  );
                  return (
                    <button
                      key={prof.id}
                      type="button"
                      onClick={() =>
                        onNominateCommissioner(prof.id, customCommissionerName.trim() || undefined)
                      }
                      className="p-4 rounded-xl bg-[#111827] hover:bg-[#172136] border border-slate-800 hover:border-blue-400/70 text-left flex flex-col justify-between gap-3 transition-all cursor-pointer"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display font-bold text-sm text-slate-50">
                            {prof.shortLabel}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                              estChance >= 80
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                : estChance >= 60
                                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                            }`}
                          >
                            Audizione ~{estChance}%
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-cyan-300">
                          Nome base: {prof.defaultCandidateName}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{prof.summary}</p>
                      </div>

                      <div className="space-y-1.5 text-[11px] pt-2 border-t border-slate-800">
                        <div className="text-emerald-300">
                          <strong>Pro:</strong> {prof.pros}
                        </div>
                        <div className="text-rose-300">
                          <strong>Contro:</strong> {prof.cons}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: RIEPILOGO FINALE */}
          {flow.step === 'summary' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/25 border border-emerald-500/45 flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-base text-emerald-200">
                    Nuova Legislatura Europea {flow.electionYear} Operativa
                  </h3>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    Il posizionamento di <strong>{player.name}</strong> a Bruxelles e Strasburgo è
                    definito per il prossimo quinquennio. Durante la legislatura verrai chiamato a
                    votare periodiche Direttive Europee che influenzeranno consenso, Spread e
                    rapporti con il tuo Gruppo UE.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono uppercase text-slate-400">
                    Gruppo Parlamentare UE
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: chosenGroupMeta.color }}
                    />
                    <span className="font-display font-bold text-sm text-slate-50">
                      {chosenGroupMeta.acronym}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">{chosenGroupMeta.name}</div>
                  <div className="text-[11px] font-mono text-amber-300 pt-1">
                    {flow.playerEuSeats} eurodeputati (+€
                    {(flow.playerEuSeats * 320).toLocaleString('it-IT')}/sett.)
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono uppercase text-slate-400">
                    Commissione {eu.commission.presidentName}
                  </div>
                  <div className="font-display font-bold text-sm text-slate-50">
                    {eu.commission.playerVote === 'favorevole'
                      ? 'Maggioranza Europea (Favorevole)'
                      : eu.commission.playerVote === 'contrario'
                        ? 'Opposizione Europea (Contrario)'
                        : eu.commission.playerVote === 'astenuto'
                          ? 'Astensione'
                          : 'Osservatore Esterno'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Rapporti UE: <strong>{state.stateIndicators.euRelations}/100</strong> · Spread{' '}
                    <strong>{state.stateIndicators.spread} bps</strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono uppercase text-slate-400">
                    Commissario Europeo Italiano
                  </div>
                  <div className="font-display font-bold text-sm text-slate-50">
                    {eu.commission.italianCommissionerName}
                  </div>
                  <div className="text-[11px] text-cyan-300">
                    {eu.commission.italianCommissionerPortfolio ?? 'Portafoglio Ordinario'}
                  </div>
                  <div className="text-[10px] text-slate-400 pt-0.5">
                    Peso:{' '}
                    <strong className="uppercase text-amber-300">
                      {eu.commission.italianCommissionerTier ?? 'medio'}
                    </strong>
                  </div>
                </div>
              </div>

              {flow.commissionerOutcome && (
                <div className="p-3 rounded-xl bg-[#111827] border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                  <Award className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{flow.commissionerOutcome.summary}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-blue-950/25 border border-blue-500/35 text-xs text-blue-100 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
                <span>
                  <strong>Effetto sulla Legge di Bilancio:</strong> {budgetRelief.summary}
                </span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onCloseFlow}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Conferma &amp; Torna alla War Room
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

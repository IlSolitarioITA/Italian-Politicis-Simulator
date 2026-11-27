import React, { useEffect, useRef, useState } from 'react';
import { getCrisisOptionTradeoff } from '../data/crises';
import {
  DEMOGRAPHICS,
  LEADERSHIP_STYLES,
  LEADER_TRAITS,
  ORIENTATIONS,
} from '../data/presets';
import {
  getPendingCrisesCount,
  getPlayerParliamentSeats,
  getWeeklyCrisesList,
} from '../engine/simulation';
import {
  ActiveCrisis,
  CrisisOption,
  DemographicId,
  EuCommissionVoteStance,
  GameState,
  ReferendumStance,
} from '../types/game';
import { EU_DIRECTIVES_POOL, EU_PARLIAMENT_GROUPS } from '../data/european';
import { ReferendumPanel } from './ReferendumPanel';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Globe,
  Lock,
  MessageSquareOff,
  Newspaper,
  Scale,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Vote,
} from 'lucide-react';

interface TabCrisesMediaProps {
  state: GameState;
  onResolveCrisis: (option: CrisisOption, crisisId: string) => void;
  onSkipCrisis: (crisisId: string) => void;
  onPromoteAbrogative?: (templateId: string) => void;
  onTriggerConstitutional?: (lawId: string) => void;
  onBoostRefSignatures?: () => void;
  onSetRefStance?: (stance: ReferendumStance) => void;
  onFundRefCampaign?: (tier: 'locale' | 'nazionale') => void;
  onDismissConcludedRef?: () => void;
  onVoteEuDirective?: (vote: EuCommissionVoteStance) => void;
}

export const TabCrisesMedia: React.FC<TabCrisesMediaProps> = ({
  state,
  onResolveCrisis,
  onSkipCrisis,
  onPromoteAbrogative,
  onTriggerConstitutional,
  onBoostRefSignatures,
  onSetRefStance,
  onFundRefCampaign,
  onDismissConcludedRef,
  onVoteEuDirective,
}) => {
  const [subView, setSubView] = useState<'dossier' | 'referendum'>('dossier');
  const [feedFilter, setFeedFilter] = useState<'tutti' | 'stampa' | 'social' | 'rivale'>('tutti');
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const dossierCardRef = useRef<HTMLElement | null>(null);
  const pressFeedRef = useRef<HTMLElement | null>(null);
  const activeEuDirective = state.european?.activeDirective ?? null;
  const playerEuSeats = state.european?.euSeats?.[state.playerPartyId] ?? 0;
  const playerEuGroupId = state.european?.partyEuGroups?.[state.playerPartyId] ?? 'ni';
  const playerEuGroup = EU_PARLIAMENT_GROUPS[playerEuGroupId];
  const activeEuDirectiveTemplate = activeEuDirective
    ? EU_DIRECTIVES_POOL.find((t) => t.id === activeEuDirective.templateId)
    : undefined;
  const hasRefAlert =
    Boolean(state.activeReferendum) ||
    (state.pendingConstitutionalReferendumLawIds ?? []).length > 0;

  const weeklyCrises = getWeeklyCrisesList(state);
  const pendingCount = getPendingCrisesCount(state);
  const [selectedCrisisId, setSelectedCrisisId] = useState<string>(
    () =>
      weeklyCrises.find((c) => !c.resolved)?.event.id ??
      weeklyCrises[0]?.event.id ??
      state.currentCrisis.event.id
  );

  const scrollToDossierTop = () => {
    window.requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        dossierCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  // Reset cleanly to the first pending dossier whenever the week advances or selected ID is stale
  useEffect(() => {
    const exists = weeklyCrises.some((c) => c.event.id === selectedCrisisId);
    if (!exists) {
      const firstPending = weeklyCrises.find((c) => !c.resolved) ?? weeklyCrises[0];
      if (firstPending) {
        setSelectedCrisisId(firstPending.event.id);
        scrollToDossierTop();
      }
    }
  }, [state.week, weeklyCrises, selectedCrisisId]);

  const activeIndex = Math.max(
    0,
    weeklyCrises.findIndex((c) => c.event.id === selectedCrisisId)
  );
  const activeCrisis: ActiveCrisis =
    weeklyCrises[activeIndex] ?? weeklyCrises[0] ?? state.currentCrisis;

  // Next unresolved dossier strictly in queue order (after current index first, then wrap around)
  const nextPendingCrisis: ActiveCrisis | null = (() => {
    for (let offset = 1; offset < weeklyCrises.length; offset += 1) {
      const candidate = weeklyCrises[(activeIndex + offset) % weeklyCrises.length];
      if (candidate && !candidate.resolved) return candidate;
    }
    const fallback = weeklyCrises.find(
      (c) => !c.resolved && c.event.id !== activeCrisis.event.id
    );
    return fallback ?? null;
  })();

  const handleSelectDossier = (crisisId: string) => {
    setSubView('dossier');
    setSelectedCrisisId(crisisId);
    scrollToDossierTop();
  };

  const handleGoToNextDossier = () => {
    if (!nextPendingCrisis) return;
    setSubView('dossier');
    setSelectedCrisisId(nextPendingCrisis.event.id);
    scrollToDossierTop();
  };

  const handleGoToPressFeed = () => {
    pressFeedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleChooseOption = (option: CrisisOption, crisisId: string) => {
    onResolveCrisis(option, crisisId);
    scrollToDossierTop();
  };

  const handleSkipCurrent = (crisisId: string) => {
    onSkipCrisis(crisisId);
    scrollToDossierTop();
  };

  const { event, resolved, skipped, chosenOptionId, outcomeSummary, outcomeStats } = activeCrisis;

  const seatInfo = getPlayerParliamentSeats(state);
  const playerParty = state.parties.find((p) => p.id === state.playerPartyId);
  const isExtraParl = Boolean(state.extraParliamentary || seatInfo.isExtraParliamentary);
  const partyStatusBadge = isExtraParl
    ? 'Status: Extra-parlamentare (0 seggi)'
    : state.governmentRole === 'premier'
      ? 'Status: Presidente del Consiglio (Al Governo)'
      : state.governmentRole === 'governo'
        ? 'Status: Maggioranza di Governo'
        : 'Status: Opposizione Parlamentare';

  const matchedTraitLabels = (() => {
    const labels: string[] = [];
    if (event.preferredTraits) {
      for (const tid of event.preferredTraits) {
        if (state.leader.traits.includes(tid)) {
          const meta = LEADER_TRAITS.find((t) => t.id === tid);
          if (meta) labels.push(meta.label);
        }
      }
    }
    if (event.preferredStyles?.includes(state.leader.style)) {
      const styleMeta = LEADERSHIP_STYLES.find((s) => s.id === state.leader.style);
      if (styleMeta) labels.push(`Stile ${styleMeta.label}`);
    }
    if (playerParty && event.preferredOrientations?.includes(playerParty.orientation)) {
      const orientMeta = ORIENTATIONS.find((o) => o.id === playerParty.orientation);
      if (orientMeta) labels.push(`Identità ${orientMeta.label}`);
    }
    return labels;
  })();

  const filteredFeed =
    feedFilter === 'tutti'
      ? state.mediaFeed
      : state.mediaFeed.filter((m) => m.type === feedFilter);

  const severityColor =
    event.severity === 'Critica'
      ? 'text-rose-400'
      : event.severity === 'Alta'
        ? 'text-amber-400'
        : 'text-cyan-400';

  const contextLabel =
    event.context === 'extraparlamentare'
      ? 'Attività Extra-Parlamentare'
      : event.context === 'governo'
        ? 'Dossier di Governo'
        : event.context === 'opposizione'
          ? 'Iniziativa Opposizione'
          : event.context === 'campagna'
            ? 'Campagna Elettorale'
            : 'Agenda Nazionale';

  const formatSignedNumber = (val: number, suffix = ''): string => {
    if (val > 0) return `+${val}${suffix}`;
    if (val < 0) return `${val}${suffix}`;
    return `0${suffix}`;
  };

  const formatSignedEuro = (val: number): string => {
    if (val > 0) return `+€${val.toLocaleString('it-IT')}`;
    if (val < 0) return `-€${Math.abs(val).toLocaleString('it-IT')}`;
    return '€0';
  };

  const stateEffectChips = (() => {
    const se = outcomeStats?.stateEffects;
    if (!se) return [];
    const items: { label: string; value: string; positive: boolean }[] = [];
    if (typeof se.spread === 'number' && se.spread !== 0) {
      items.push({
        label: 'Spread BTP',
        value: `${se.spread > 0 ? '+' : ''}${se.spread} pt`,
        positive: se.spread < 0,
      });
    }
    if (typeof se.socialStability === 'number' && se.socialStability !== 0) {
      items.push({
        label: 'Tenuta Sociale',
        value: formatSignedNumber(se.socialStability),
        positive: se.socialStability > 0,
      });
    }
    if (typeof se.euRelations === 'number' && se.euRelations !== 0) {
      items.push({
        label: 'Rapporti UE',
        value: formatSignedNumber(se.euRelations),
        positive: se.euRelations > 0,
      });
    }
    if (typeof se.democraticHealth === 'number' && se.democraticHealth !== 0) {
      items.push({
        label: 'Tenuta Dem.',
        value: formatSignedNumber(se.democraticHealth),
        positive: se.democraticHealth > 0,
      });
    }
    return items;
  })();

  const demoEffectChips = (() => {
    const de = outcomeStats?.demoEffects;
    if (!de) return [];
    return (Object.entries(de) as [DemographicId, number][])
      .filter(([, v]) => typeof v === 'number' && v !== 0)
      .map(([id, v]) => {
        const meta = DEMOGRAPHICS.find((d) => d.id === id);
        return {
          id,
          label: meta?.shortLabel ?? id,
          value: v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1),
          positive: v > 0,
        };
      });
  })();

  return (
    <div
      ref={scrollContainerRef}
      className="h-full overflow-y-auto overflow-x-hidden war-scroll p-3 sm:p-4 lg:p-5 space-y-4"
    >
      {/* Sub-view switcher: Dossier & Crisi | Referendum (Art. 75 / 138) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center p-1 bg-[#111827] border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setSubView('dossier')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              subView === 'dossier'
                ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5 shrink-0" />
            <span>Dossier &amp; Media</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubView('referendum')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              subView === 'referendum'
                ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Vote className="w-3.5 h-3.5 shrink-0" />
            <span>Referendum (Art. 75 / 138)</span>
            {hasRefAlert && (
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {subView === 'referendum' ? (
        <ReferendumPanel
          state={state}
          onPromoteAbrogative={(id) => onPromoteAbrogative?.(id)}
          onTriggerConstitutional={(lawId) => onTriggerConstitutional?.(lawId)}
          onBoostSignatures={() => onBoostRefSignatures?.()}
          onSetStance={(stance) => onSetRefStance?.(stance)}
          onFundCampaign={(tier) => onFundRefCampaign?.(tier)}
          onDismissConcluded={() => onDismissConcludedRef?.()}
        />
      ) : (
      <div className="space-y-4">
        {/* Dossier Periodico da Bruxelles (Votazione al Parlamento Europeo) */}
        {activeEuDirective && playerEuSeats > 0 && (
          <section className="bg-gradient-to-r from-[#0D1631] via-[#111827] to-[#0D1322] border border-blue-500/45 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-blue-500/25">
              <div className="space-y-0.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-blue-300">
                  <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>DOSSIER DA BRUXELLES · {activeEuDirective.subtitle}</span>
                  <span>·</span>
                  <span>
                    Linea Gruppo{' '}
                    <strong style={{ color: playerEuGroup.color }}>{playerEuGroup.acronym}</strong>:{' '}
                    <strong className="uppercase text-amber-300">
                      {activeEuDirective.groupLine}
                    </strong>
                  </span>
                </div>
                <h3 className="font-display font-bold text-sm sm:text-base text-slate-50 leading-snug">
                  {activeEuDirective.title}
                </h3>
              </div>
              <span
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold shrink-0 border ${
                  activeEuDirective.resolved
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-500/15 border-amber-500/45 text-amber-300'
                }`}
              >
                {activeEuDirective.resolved
                  ? `Votato: ${activeEuDirective.playerVote}`
                  : `${playerEuSeats} Eurodeputati chiamati al voto`}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{activeEuDirective.summary}</p>

            {activeEuDirective.resolved ? (
              <div className="p-3 rounded-lg bg-emerald-950/25 border border-emerald-500/35 text-xs text-emerald-100 leading-relaxed">
                <strong>Esito a Strasburgo:</strong> {activeEuDirective.outcomeSummary}
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeEuDirectiveTemplate && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-[#090D16] border border-emerald-500/25 space-y-0.5">
                      <div className="font-bold text-emerald-300">Se voti Favorevole:</div>
                      <div className="text-slate-300">
                        <span className="text-emerald-300">Pro:</span> {activeEuDirectiveTemplate.proYes}
                      </div>
                      <div className="text-slate-400">
                        <span className="text-rose-300">Contro:</span> {activeEuDirectiveTemplate.conYes}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#090D16] border border-rose-500/25 space-y-0.5">
                      <div className="font-bold text-rose-300">Se voti Contrario:</div>
                      <div className="text-slate-300">
                        <span className="text-emerald-300">Pro:</span> {activeEuDirectiveTemplate.proNo}
                      </div>
                      <div className="text-slate-400">
                        <span className="text-rose-300">Contro:</span> {activeEuDirectiveTemplate.conNo}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onVoteEuDirective?.('favorevole')}
                    className="px-3.5 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 shrink-0" />
                    <span>Vota Favorevole</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onVoteEuDirective?.('contrario')}
                    className="px-3.5 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <ThumbsDown className="w-3.5 h-3.5 shrink-0" />
                    <span>Vota Contrario</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onVoteEuDirective?.('astenuto')}
                    className="px-3.5 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/45 text-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Scale className="w-3.5 h-3.5 shrink-0" />
                    <span>Astensione</span>
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left (7 cols): Weekly Contextual Multi-Event Dossiers (1-3 per week) */}
        <section
          ref={dossierCardRef}
          className="xl:col-span-7 bg-[#111827] border border-slate-800/90 rounded-xl p-4 sm:p-5 flex flex-col gap-4 min-w-0"
        >
          {/* Top Multi-Event Bar & Party Political Status */}
          <div className="flex flex-col gap-3 pb-3 border-b border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-100">
                  Dossier Settimana {state.week} ({weeklyCrises.length}{' '}
                  {weeklyCrises.length === 1 ? 'evento attivo' : 'eventi attivi'})
                </span>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span className="text-cyan-300 font-mono text-[11px]">{partyStatusBadge}</span>
              </div>

              {pendingCount > 0 ? (
                <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  {pendingCount}{' '}
                  {pendingCount === 1
                    ? 'evento richiede risposta'
                    : 'eventi richiedono risposta'}
                </span>
              ) : (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Tutti i dossier settimanali gestiti
                </span>
              )}
            </div>

            {/* Event Switcher Tabs (1..3 events) */}
            {weeklyCrises.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {weeklyCrises.map((item, idx) => {
                  const isSelected = item.event.id === activeCrisis.event.id;
                  return (
                    <button
                      key={item.event.id}
                      type="button"
                      onClick={() => handleSelectDossier(item.event.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-1 min-w-0 ${
                        isSelected
                          ? 'bg-cyan-500/12 border-cyan-400 text-slate-50'
                          : item.resolved
                            ? 'bg-[#090D16]/70 border-slate-800 text-slate-400 hover:border-slate-700'
                            : 'bg-[#090D16] border-amber-500/40 text-slate-200 hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 text-[11px]">
                        <span className="font-mono font-semibold text-cyan-400">
                          Dossier #{idx + 1}
                        </span>
                        {item.resolved ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            {item.skipped ? 'Saltato' : 'Scelto'}
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            In attesa
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-medium whitespace-normal leading-snug">
                        {item.event.title}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Event Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400">
                <span className="font-medium text-slate-200">{event.category}</span>
                <span aria-hidden="true">·</span>
                <span className="text-cyan-400">{contextLabel}</span>
                <span aria-hidden="true">·</span>
                <span className={`font-semibold ${severityColor}`}>
                  Priorità {event.severity}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-50 mt-1.5 leading-snug">
                {event.title}
              </h2>
            </div>

            <div className="text-xs font-medium shrink-0">
              {resolved ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {skipped ? 'Nessuna dichiarazione' : 'Dossier gestito'}
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Scelta obbligatoria
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">{event.summary}</p>

          {matchedTraitLabels.length > 0 && (
            <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/35 text-[11px] text-amber-200 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                <strong>Dossier legato al tuo profilo:</strong> {matchedTraitLabels.join(' · ')}
              </span>
            </div>
          )}

          {/* Post-Choice Outcome Panel — Numeric impacts revealed ONLY AFTER choosing or skipping */}
          {resolved && (outcomeStats || outcomeSummary) && (
            <div className="p-4 rounded-xl bg-emerald-950/25 border border-emerald-500/45 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Esito della Decisione Politica · Effetti Applicati
                </span>
                {skipped && (
                  <span className="text-[11px] font-mono text-slate-300">
                    Linea: Nessuna dichiarazione ufficiale
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-100 leading-relaxed">
                {outcomeStats?.pressReaction ?? outcomeSummary}
              </p>

              {outcomeStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                  <div className="p-2 rounded-lg bg-[#090D16]/90 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Consenso Naz.</div>
                    <div
                      className={`font-mono text-xs font-bold tabular-nums ${
                        outcomeStats.pollDelta > 0
                          ? 'text-emerald-400'
                          : outcomeStats.pollDelta < 0
                            ? 'text-rose-400'
                            : 'text-slate-200'
                      }`}
                    >
                      {outcomeStats.pollDelta > 0
                        ? `+${outcomeStats.pollDelta.toFixed(2)}%`
                        : `${outcomeStats.pollDelta.toFixed(2)}%`}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-[#090D16]/90 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Cassa Partito</div>
                    <div
                      className={`font-mono text-xs font-bold tabular-nums ${
                        outcomeStats.budgetDelta > 0
                          ? 'text-emerald-400'
                          : outcomeStats.budgetDelta < 0
                            ? 'text-rose-400'
                            : 'text-slate-200'
                      }`}
                    >
                      {formatSignedEuro(outcomeStats.budgetDelta)}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-[#090D16]/90 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Coesione Dirigenti</div>
                    <div
                      className={`font-mono text-xs font-bold tabular-nums ${
                        outcomeStats.loyaltyDelta > 0
                          ? 'text-emerald-400'
                          : outcomeStats.loyaltyDelta < 0
                            ? 'text-rose-400'
                            : 'text-slate-200'
                      }`}
                    >
                      {formatSignedNumber(outcomeStats.loyaltyDelta)}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-[#090D16]/90 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Gradimento Leader</div>
                    <div
                      className={`font-mono text-xs font-bold tabular-nums ${
                        outcomeStats.leaderApprovalDelta > 0
                          ? 'text-emerald-400'
                          : outcomeStats.leaderApprovalDelta < 0
                            ? 'text-rose-400'
                            : 'text-slate-200'
                      }`}
                    >
                      {formatSignedNumber(outcomeStats.leaderApprovalDelta, '%')}
                    </div>
                  </div>
                </div>
              )}

              {/* Macroeconomic / Institutional & Demographic real breakdown */}
              {(stateEffectChips.length > 0 || demoEffectChips.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-emerald-500/20">
                  {stateEffectChips.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Indicatori di Stato &amp; Mercati
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {stateEffectChips.map((chip) => (
                          <span
                            key={chip.label}
                            className={`px-2 py-0.5 rounded bg-[#090D16] border font-mono text-[11px] tabular-nums ${
                              chip.positive
                                ? 'border-emerald-500/35 text-emerald-300'
                                : 'border-rose-500/40 text-rose-300'
                            }`}
                          >
                            {chip.label}: {chip.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {demoEffectChips.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Impatto Elettorato (Base &amp; Fasce)
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {demoEffectChips.map((chip) => (
                          <span
                            key={chip.id}
                            className={`px-2 py-0.5 rounded bg-[#090D16] border font-mono text-[11px] tabular-nums ${
                              chip.positive
                                ? 'border-emerald-500/35 text-emerald-300'
                                : 'border-rose-500/40 text-rose-300'
                            }`}
                          >
                            {chip.label} {chip.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {outcomeStats?.rivalReaction && (
                <div className="text-[11px] text-slate-300 pt-1.5 border-t border-emerald-500/20">
                  <strong className="text-rose-300">Reazione avversari:</strong> “
                  {outcomeStats.rivalReaction}”
                </div>
              )}

              {/* Direct Next-Dossier / Completion CTA inside Outcome Panel */}
              <div className="pt-2.5 border-t border-emerald-500/25 flex flex-wrap items-center justify-between gap-2">
                {nextPendingCrisis ? (
                  <>
                    <span className="text-[11px] text-amber-200 font-medium">
                      Restano ancora {pendingCount}{' '}
                      {pendingCount === 1 ? 'dossier da gestire' : 'dossier da gestire'} questa settimana.
                    </span>
                    <button
                      type="button"
                      onClick={handleGoToNextDossier}
                      className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Avanti · Prossimo Dossier</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] text-emerald-300 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Tutti i dossier della settimana {state.week} completati: puoi avanzare o leggere la rassegna.
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={handleGoToPressFeed}
                      className="px-3.5 py-2 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Newspaper className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Rassegna Stampa</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Zero-Spoiler Political Options List with Explicit Qualitative Pro & Contro */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-300">
                Linee Politiche e Trade-off Strategici
              </span>
              {!resolved && (
                <span className="text-[11px] text-slate-400">
                  Valutazione qualitativa Pro/Contro · Nessuno spoiler numerico prima della scelta
                </span>
              )}
            </div>

            {event.options.map((opt) => {
              const requiresSpecial = Boolean(
                opt.requiredTrait || opt.requiredStyle || opt.requiredOrientation
              );
              const hasTrait =
                !opt.requiredTrait || state.leader.traits.includes(opt.requiredTrait);
              const hasStyle =
                !opt.requiredStyle || state.leader.style === opt.requiredStyle;
              const hasOrientation =
                !opt.requiredOrientation ||
                playerParty?.orientation === opt.requiredOrientation;
              const meetsRequirement = hasTrait && hasStyle && hasOrientation;

              const missingReqLabels: string[] = [];
              if (opt.requiredTrait && !hasTrait) {
                missingReqLabels.push(
                  LEADER_TRAITS.find((t) => t.id === opt.requiredTrait)?.label ?? opt.requiredTrait
                );
              }
              if (opt.requiredStyle && !hasStyle) {
                missingReqLabels.push(
                  `Stile ${LEADERSHIP_STYLES.find((s) => s.id === opt.requiredStyle)?.label ?? opt.requiredStyle}`
                );
              }
              if (opt.requiredOrientation && !hasOrientation) {
                missingReqLabels.push(
                  `Partito ${ORIENTATIONS.find((o) => o.id === opt.requiredOrientation)?.label ?? opt.requiredOrientation}`
                );
              }

              const isChosen = chosenOptionId === opt.id;
              const disabled = resolved || !meetsRequirement;
              const tradeoff = getCrisisOptionTradeoff(opt);

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleChooseOption(opt, event.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    isChosen
                      ? 'bg-cyan-500/12 border-cyan-500/80'
                      : !meetsRequirement
                        ? 'bg-[#090D16]/40 border-slate-800/70 opacity-60 cursor-not-allowed'
                        : resolved
                          ? 'bg-[#090D16]/50 border-slate-800/60 opacity-50 cursor-not-allowed'
                          : requiresSpecial
                            ? 'bg-amber-500/8 border-amber-500/50 hover:border-amber-400 cursor-pointer'
                            : 'bg-[#090D16] border-slate-800 hover:border-cyan-500/60 cursor-pointer'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      {requiresSpecial &&
                        (meetsRequirement ? (
                          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        ))}
                      {opt.label}
                    </span>
                    <span
                      className={`text-[11px] font-mono ${
                        requiresSpecial ? 'text-amber-400' : 'text-slate-400'
                      }`}
                    >
                      {requiresSpecial && !meetsRequirement
                        ? `Richiede: ${missingReqLabels.join(' + ')}`
                        : opt.stance}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {opt.description}
                  </p>

                  {/* Qualitative Pro / Contro Trade-off Grid (Zero numeric spoilers) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-800/80">
                    <div className="p-2 rounded-lg bg-emerald-950/25 border border-emerald-500/25 space-y-0.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 shrink-0" />
                        <span>Pro</span>
                      </div>
                      <p className="text-[11px] text-emerald-100/90 leading-snug">
                        {tradeoff.proText}
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-rose-950/25 border border-rose-500/25 space-y-0.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>Contro</span>
                      </div>
                      <p className="text-[11px] text-rose-100/90 leading-snug">
                        {tradeoff.conText}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Secondary Mandatory Escape Hatch: "Salta / Nessuna dichiarazione" */}
            <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                disabled={resolved}
                onClick={() => handleSkipCurrent(event.id)}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-colors ${
                  skipped
                    ? 'bg-slate-800/80 border-cyan-500/60 text-cyan-200'
                    : resolved
                      ? 'bg-[#090D16]/40 border-slate-800/60 text-slate-500 cursor-not-allowed'
                      : 'bg-[#090D16] hover:bg-slate-800/70 border-slate-700/90 text-slate-300 cursor-pointer'
                }`}
              >
                <MessageSquareOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Salta / Nessuna dichiarazione</span>
              </button>

              {resolved && nextPendingCrisis ? (
                <button
                  type="button"
                  onClick={handleGoToNextDossier}
                  className="px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Prossimo Dossier ({pendingCount} in attesa)</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              ) : resolved && pendingCount === 0 ? (
                <button
                  type="button"
                  onClick={handleGoToPressFeed}
                  className="px-3.5 py-2 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Newspaper className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Vai alla Rassegna Stampa</span>
                </button>
              ) : null}
            </div>
          </div>
        </section>

        {/* Right (5 cols): Live Media, Social & Rival Reactions Feed */}
        <aside
          ref={pressFeedRef}
          className="xl:col-span-5 bg-[#111827] border border-slate-800/90 rounded-xl p-4 flex flex-col"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-cyan-400" />
              Rassegna Stampa e Feed Live
            </h3>

            <div className="flex items-center p-0.5 bg-[#090D16] border border-slate-800 rounded-lg">
              {(
                [
                  { id: 'tutti', label: 'Tutti' },
                  { id: 'stampa', label: 'Stampa' },
                  { id: 'social', label: 'Social' },
                  { id: 'rivale', label: 'Rivali' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFeedFilter(tab.id)}
                  className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                    feedFilter === tab.id
                      ? 'bg-slate-800 text-slate-50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 space-y-2.5 overflow-y-auto war-scroll max-h-[560px] pr-1">
            {filteredFeed.map((item) => {
              const typeLabel =
                item.type === 'stampa'
                  ? 'Quotidiano'
                  : item.type === 'social'
                    ? 'Social Trend'
                    : 'Dichiarazione Rivale';
              const sentimentLabel =
                item.sentiment === 'positivo'
                  ? 'Favorevole'
                  : item.sentiment === 'negativo'
                    ? 'Critico'
                    : 'Neutro';
              const sentimentClass =
                item.sentiment === 'positivo'
                  ? 'text-emerald-400'
                  : item.sentiment === 'negativo'
                    ? 'text-rose-400'
                    : 'text-slate-400';

              return (
                <article
                  key={item.id}
                  className="p-3.5 rounded-lg bg-[#090D16] border border-slate-800/80 space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[11px] text-slate-400">
                    <span className="whitespace-normal leading-snug">
                      <strong className="text-slate-200 font-medium">{item.source}</strong>
                      <span aria-hidden="true"> · </span>
                      <span>{typeLabel}</span>
                    </span>
                    <span className="font-mono shrink-0">{item.dateLabel}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-100 leading-snug">
                    {item.headline}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{item.excerpt}</p>
                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className={`font-medium ${sentimentClass}`}>{sentimentLabel}</span>
                    {item.engagement && (
                      <span className="font-mono text-cyan-400">{item.engagement}</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </aside>
      </div>
      </div>
      )}
    </div>
  );
};

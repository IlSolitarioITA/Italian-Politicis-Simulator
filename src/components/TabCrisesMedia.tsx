import React, { useState } from 'react';
import { LEADER_TRAITS } from '../data/presets';
import { CrisisOption, GameState } from '../types/game';
import { AlertCircle, CheckCircle2, Lock, Newspaper, Sparkles } from 'lucide-react';

interface TabCrisesMediaProps {
  state: GameState;
  onResolveCrisis: (option: CrisisOption) => void;
}

export const TabCrisesMedia: React.FC<TabCrisesMediaProps> = ({
  state,
  onResolveCrisis,
}) => {
  const [feedFilter, setFeedFilter] = useState<'tutti' | 'stampa' | 'social' | 'rivale'>('tutti');

  const { event, resolved, chosenOptionId, outcomeSummary } = state.currentCrisis;
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

  const formatDemoHint = (opt: CrisisOption): string => {
    const labels: Record<string, string> = {
      giovani: 'Giovani',
      lavoratori: 'Lavoratori',
      imprese: 'Imprese',
      pensionati: 'Pensionati',
    };
    const parts: string[] = [];
    for (const [k, v] of Object.entries(opt.demoEffects)) {
      if (!v) continue;
      parts.push(`${v > 0 ? '+' : ''}${labels[k]}`);
    }
    if (opt.budgetDelta !== 0) {
      parts.push(
        `${opt.budgetDelta > 0 ? '+' : '-'}€${Math.abs(opt.budgetDelta).toLocaleString('it-IT')}`
      );
    }
    return parts.join(' · ');
  };

  const formatAxisHint = (opt: CrisisOption): string => {
    const parts: string[] = [];
    if (opt.axisShift) {
      const axisNames: Record<string, [string, string]> = {
        economic: ['Statalista', 'Liberista'],
        society: ['Conservatore', 'Progressista'],
        europe: ['Sovranista', 'Federalista'],
        institutions: ['Democratico', 'Autoritario'],
      };
      for (const [k, v] of Object.entries(opt.axisShift)) {
        if (!v) continue;
        const pair = axisNames[k];
        parts.push(`${v > 0 ? pair[1] : pair[0]} ${v > 0 ? '+' : ''}${v}`);
      }
    }
    if (opt.stateEffects?.spread) {
      parts.push(
        `Spread ${opt.stateEffects.spread > 0 ? '+' : ''}${opt.stateEffects.spread}`
      );
    }
    if (opt.stateEffects?.socialStability) {
      parts.push(
        `Stabilità ${opt.stateEffects.socialStability > 0 ? '+' : ''}${opt.stateEffects.socialStability}%`
      );
    }
    if (opt.stateEffects?.euRelations) {
      parts.push(
        `UE ${opt.stateEffects.euRelations > 0 ? '+' : ''}${opt.stateEffects.euRelations}%`
      );
    }
    if (opt.stateEffects?.democraticHealth) {
      parts.push(
        `Democrazia ${opt.stateEffects.democraticHealth > 0 ? '+' : ''}${opt.stateEffects.democraticHealth}%`
      );
    }
    return parts.join(' · ');
  };

  const contextLabel =
    event.context === 'governo'
      ? 'Dossier di Governo'
      : event.context === 'opposizione'
        ? 'Iniziativa Opposizione'
        : event.context === 'campagna'
          ? 'Campagna Elettorale'
          : 'Agenda Nazionale';

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden war-scroll p-3 sm:p-4 lg:p-5">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left (7 cols): Weekly Dossier / Political Crisis */}
        <section className="xl:col-span-7 bg-[#111827] border border-slate-800/90 rounded-xl p-4 sm:p-5 flex flex-col gap-4 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400">
                <span className="font-medium text-slate-200">{event.category}</span>
                <span aria-hidden="true">·</span>
                <span className="text-cyan-400">{contextLabel}</span>
                <span aria-hidden="true">·</span>
                <span className={`font-semibold ${severityColor}`}>
                  Priorità {event.severity}
                </span>
                <span aria-hidden="true">·</span>
                <span>Settimana {state.week}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-50 mt-1.5 leading-snug">
                {event.title}
              </h2>
            </div>

            <div className="text-xs font-medium shrink-0">
              {resolved ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Dossier gestito
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Risposta richiesta
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">{event.summary}</p>

          {resolved && outcomeSummary && (
            <div className="p-3.5 rounded-lg bg-emerald-950/35 border border-emerald-500/40 text-xs text-emerald-200 leading-relaxed">
              <strong className="text-emerald-300">Esito registrato:</strong> {outcomeSummary}
            </div>
          )}

          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-slate-300">
              Opzioni Politiche Disponibili
            </div>
            {event.options.map((opt) => {
              const requiresTrait = Boolean(opt.requiredTrait);
              const hasTrait =
                !opt.requiredTrait || state.leader.traits.includes(opt.requiredTrait);
              const traitMeta = opt.requiredTrait
                ? LEADER_TRAITS.find((t) => t.id === opt.requiredTrait)
                : null;
              const isChosen = chosenOptionId === opt.id;
              const disabled = resolved || !hasTrait;

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onResolveCrisis(opt)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    isChosen
                      ? 'bg-cyan-500/12 border-cyan-500/80'
                      : !hasTrait
                        ? 'bg-[#090D16]/40 border-slate-800/70 opacity-60 cursor-not-allowed'
                        : resolved
                          ? 'bg-[#090D16]/50 border-slate-800/60 opacity-50 cursor-not-allowed'
                          : requiresTrait
                            ? 'bg-amber-500/8 border-amber-500/50 hover:border-amber-400 cursor-pointer'
                            : 'bg-[#090D16] border-slate-800 hover:border-cyan-500/60 cursor-pointer'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      {requiresTrait &&
                        (hasTrait ? (
                          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        ))}
                      {opt.label}
                    </span>
                    <span
                      className={`text-[11px] font-mono ${
                        requiresTrait ? 'text-amber-400' : 'text-slate-400'
                      }`}
                    >
                      {requiresTrait && !hasTrait
                        ? `Richiede tratto: ${traitMeta?.label}`
                        : opt.stance}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {opt.description}
                  </p>
                  <div className="text-[11px] font-mono text-cyan-400/90 mt-2">
                    Impatto: {formatDemoHint(opt)}
                  </div>
                  {formatAxisHint(opt) && (
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      Identità e Stato: {formatAxisHint(opt)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Right (5 cols): Live Media, Social & Rival Reactions Feed */}
        <aside className="xl:col-span-5 bg-[#111827] border border-slate-800/90 rounded-xl p-4 flex flex-col">
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
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span className="truncate">
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
  );
};

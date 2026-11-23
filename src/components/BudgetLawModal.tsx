import React, { useMemo, useState } from 'react';
import { DEMOGRAPHICS, formatGameDate } from '../data/presets';
import {
  DEFAULT_BUDGET_ALLOCATION,
  previewBudgetLaw,
} from '../engine/simulation';
import { BudgetAllocation, GameState } from '../types/game';
import {
  AlertTriangle,
  CheckCircle2,
  Gavel,
  Globe,
  Landmark,
  TrendingUp,
  Users,
} from 'lucide-react';

interface BudgetLawModalProps {
  state: GameState;
  onVoteBudgetLaw: (allocation: BudgetAllocation) => void;
}

interface SliderConfig {
  key: keyof BudgetAllocation;
  label: string;
  targetNote: string;
  min: number;
  max: number;
  isRevenue?: boolean;
}

const SLIDERS: SliderConfig[] = [
  {
    key: 'fisco',
    label: 'Fisco & Taglio Tasse',
    targetNote: 'Favorisce Imprese/P.IVA e ceto medio produttivo',
    min: 0,
    max: 15,
  },
  {
    key: 'sanita',
    label: 'Sanità & Welfare',
    targetNote: 'Favorisce Pensionati, famiglie e lavoratori dipendenti',
    min: 0,
    max: 15,
  },
  {
    key: 'giovani',
    label: 'Giovani & Lavoro',
    targetNote: 'Favorisce Under 35, scuola, formazione e occupazione',
    min: 0,
    max: 15,
  },
  {
    key: 'infrastrutture',
    label: 'Infrastrutture & Sud',
    targetNote: 'Aumenta consenso nel Mezzogiorno e sostiene la crescita PIL',
    min: 0,
    max: 15,
  },
  {
    key: 'coperture',
    label: 'Coperture / Tagli / Tasse Extra',
    targetNote: 'Riduce Deficit/PIL e Spread, ma pesa sul consenso popolare',
    min: 0,
    max: 20,
    isRevenue: true,
  },
];

const BUDGET_PRESETS: { id: string; label: string; allocation: BudgetAllocation }[] = [
  {
    id: 'equilibrata',
    label: 'Equilibrata (~30 Mld)',
    allocation: { fisco: 8, sanita: 8, giovani: 7, infrastrutture: 7, coperture: 18 },
  },
  {
    id: 'espansiva',
    label: 'Espansiva (Pro-Consenso)',
    allocation: { fisco: 11, sanita: 10, giovani: 8, infrastrutture: 8, coperture: 8 },
  },
  {
    id: 'rigorosa',
    label: 'Rigorosa UE (Pro-Spread)',
    allocation: { fisco: 6, sanita: 7, giovani: 5, infrastrutture: 6, coperture: 16 },
  },
];

export const BudgetLawModal: React.FC<BudgetLawModalProps> = ({
  state,
  onVoteBudgetLaw,
}) => {
  const [allocation, setAllocation] = useState<BudgetAllocation>({
    ...DEFAULT_BUDGET_ALLOCATION,
  });

  const dateInfo = formatGameDate(state.week);
  const budgetYear =
    dateInfo.monthName === 'Novembre' || dateInfo.monthName === 'Dicembre'
      ? dateInfo.year + 1
      : dateInfo.year;

  const preview = useMemo(
    () => previewBudgetLaw(state, allocation),
    [state, allocation]
  );

  const handleSliderChange = (key: keyof BudgetAllocation, value: number) => {
    setAllocation((prev) => ({ ...prev, [key]: value }));
  };

  const deficitCls =
    preview.deficitGdpPct > 4.0
      ? 'text-rose-400'
      : preview.deficitGdpPct > 3.0
        ? 'text-amber-400'
        : 'text-emerald-400';

  const spreadCls =
    preview.projectedSpread >= 220
      ? 'text-rose-400'
      : preview.projectedSpread >= 155
        ? 'text-amber-400'
        : 'text-emerald-400';

  const euCls =
    preview.projectedEuRelations < 40
      ? 'text-rose-400'
      : preview.projectedEuRelations < 62
        ? 'text-amber-400'
        : 'text-cyan-300';

  const pollCls =
    preview.estimatedNationalPollDelta > 0.1
      ? 'text-emerald-400'
      : preview.estimatedNationalPollDelta < -0.1
        ? 'text-rose-400'
        : 'text-slate-200';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="budget-law-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-hidden"
    >
      <div className="w-full max-w-5xl max-h-[94vh] overflow-y-auto overflow-x-hidden war-scroll bg-[#111827] border border-amber-500/50 rounded-xl shadow-2xl p-4 sm:p-5 space-y-4">
        {/* Header bloccante Manovra Finanziaria */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-amber-400 font-medium">
              <Landmark className="w-4 h-4 shrink-0" />
              <span>Sessione di Bilancio Obbligatoria</span>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <span className="font-mono text-slate-400">{dateInfo.fullLabel}</span>
            </div>
            <h2
              id="budget-law-title"
              className="text-lg sm:text-2xl font-bold text-slate-50 leading-tight"
            >
              Legge di Bilancio {budgetYear} — Manovra Finanziaria
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Imposta i 5 capitoli di spesa e copertura (cornice consigliata ~30 Mld €). La sessione resta aperta finché il Parlamento non vota la fiducia sulla Manovra.
            </p>
          </div>

          {/* Preset rapidi */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {BUDGET_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setAllocation({ ...preset.allocation })}
                className="px-2.5 py-1.5 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-[11px] font-medium text-slate-200 cursor-pointer transition-colors whitespace-nowrap"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </header>

        {/* Contenuto a 2 colonne: 5 Slider | Impatto Macro & Voto Aula */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Colonna Sinistra (7 col): 5 Slider */}
          <section className="lg:col-span-7 space-y-3 min-w-0">
            {/* Riepilogo Cornice Finanziaria */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-lg bg-[#090D16] border border-slate-800 text-xs font-mono tabular-nums">
              <div>
                <div className="text-[10px] font-sans text-slate-400">Spesa Lorda</div>
                <div
                  className={`text-base font-bold mt-0.5 ${
                    preview.totalSpending > 34 ? 'text-amber-400' : 'text-slate-100'
                  }`}
                >
                  {preview.totalSpending} Mld €
                </div>
              </div>
              <div>
                <div className="text-[10px] font-sans text-slate-400">Coperture / Entrate</div>
                <div className="text-base font-bold text-cyan-300 mt-0.5">
                  -{preview.coperture} Mld €
                </div>
              </div>
              <div>
                <div className="text-[10px] font-sans text-slate-400">Saldo Netto Deficit</div>
                <div
                  className={`text-base font-bold mt-0.5 ${
                    preview.netDeficitBillions > 22
                      ? 'text-rose-400'
                      : preview.netDeficitBillions > 12
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                  }`}
                >
                  {preview.netDeficitBillions >= 0 ? '+' : ''}
                  {preview.netDeficitBillions} Mld €
                </div>
              </div>
            </div>

            {/* 5 Slider Interattivi */}
            <div className="space-y-2.5">
              {SLIDERS.map((s) => {
                const val = allocation[s.key];
                return (
                  <div
                    key={s.key}
                    className={`p-3 rounded-lg bg-[#090D16] border ${
                      s.isRevenue ? 'border-cyan-500/35' : 'border-slate-800/90'
                    } space-y-1.5`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor={`slider-${s.key}`}
                        className="text-xs font-semibold text-slate-100"
                      >
                        {s.label}
                      </label>
                      <span
                        className={`font-mono text-sm font-bold tabular-nums shrink-0 ${
                          s.isRevenue ? 'text-cyan-300' : 'text-amber-400'
                        }`}
                      >
                        {s.isRevenue ? `-${val}` : `${val}`} Mld €
                      </span>
                    </div>
                    <input
                      id={`slider-${s.key}`}
                      type="range"
                      min={s.min}
                      max={s.max}
                      step={1}
                      value={val}
                      onChange={(e) => handleSliderChange(s.key, Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                    <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
                      <span>{s.targetNote}</span>
                      <span className="font-mono tabular-nums text-slate-500 shrink-0">
                        {s.min}–{s.max} Mld
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Colonna Destra (5 col): Impatto Stimato in Tempo Reale & Voto Parlamento */}
          <aside className="lg:col-span-5 flex flex-col justify-between gap-3 min-w-0">
            <div className="space-y-3">
              {/* 4 KPI Macro & Consenso */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800">
                  <div className="text-[11px] text-slate-400">Deficit / PIL</div>
                  <div className={`font-mono text-lg font-bold tabular-nums mt-0.5 ${deficitCls}`}>
                    {preview.deficitGdpPct.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {preview.deficitGdpPct <= 3.0 ? 'Entro patto UE (≤3%)' : 'Oltre soglia UE 3,0%'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Spread BTP–Bund</span>
                    <TrendingUp className={`w-3.5 h-3.5 ${spreadCls}`} />
                  </div>
                  <div className={`font-mono text-lg font-bold tabular-nums mt-0.5 ${spreadCls}`}>
                    {preview.projectedSpread}{' '}
                    <span className="text-[11px] font-normal">
                      ({preview.spreadDelta >= 0 ? '+' : ''}
                      {preview.spreadDelta})
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">Attuale: {state.stateIndicators.spread} bps</div>
                </div>

                <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Rapporti UE</span>
                    <Globe className={`w-3.5 h-3.5 ${euCls}`} />
                  </div>
                  <div className={`font-mono text-lg font-bold tabular-nums mt-0.5 ${euCls}`}>
                    {preview.projectedEuRelations}%{' '}
                    <span className="text-[11px] font-normal">
                      ({preview.euRelationsDelta >= 0 ? '+' : ''}
                      {preview.euRelationsDelta})
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Stabilità: {preview.projectedSocialStability}% (
                    {preview.socialStabilityDelta >= 0 ? '+' : ''}
                    {preview.socialStabilityDelta})
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Consenso Stimato</span>
                    <Users className={`w-3.5 h-3.5 ${pollCls}`} />
                  </div>
                  <div className={`font-mono text-lg font-bold tabular-nums mt-0.5 ${pollCls}`}>
                    {preview.estimatedNationalPollDelta >= 0 ? '+' : ''}
                    {preview.estimatedNationalPollDelta.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500">Impatto immediato sondaggi</div>
                </div>
              </div>

              {/* Impatto per Categoria Sociale */}
              <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-200">
                  Impatto Consenso per Categoria
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                  {DEMOGRAPHICS.map((d) => {
                    const val = preview.demoEffects[d.id] ?? 0;
                    return (
                      <div key={d.id} className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 truncate">{d.shortLabel}</span>
                        <span
                          className={`font-mono font-semibold tabular-nums ${
                            val > 0.05
                              ? 'text-emerald-400'
                              : val < -0.05
                                ? 'text-rose-400'
                                : 'text-slate-400'
                          }`}
                        >
                          {val >= 0 ? '+' : ''}
                          {val.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stima Voto Parlamento */}
              <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Stima Voto in Parlamento</span>
                  <span
                    className={`font-semibold flex items-center gap-1 text-[11px] ${
                      preview.willPass ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {preview.willPass ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Maggioranza regge</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Rischio caduta Governo</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="space-y-1 font-mono text-[11px] tabular-nums">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Camera (soglia 201)</span>
                    <span className={preview.cameraYes >= 201 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {preview.cameraYes} Sì / {preview.cameraNo} No
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Senato (soglia 101)</span>
                    <span className={preview.senatoYes >= 101 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {preview.senatoYes} Sì / {preview.senatoNo} No
                    </span>
                  </div>
                </div>

                {preview.dissentingAllies.length > 0 && (
                  <div className="p-2 rounded-md bg-rose-950/35 border border-rose-500/40 text-[11px] text-rose-200 leading-relaxed">
                    Fronda alleati: <strong>{preview.dissentingAllies.join(', ')}</strong> non gradisce questa impostazione (o ha fiducia bassa). Modifica gli slider per recuperare i loro voti o rischierai di andare sotto!
                  </div>
                )}
              </div>
            </div>

            {/* Bottone Voto Parlamento */}
            <button
              type="button"
              onClick={() => onVoteBudgetLaw(allocation)}
              className={`w-full py-3 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                preview.willPass
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              <Gavel className="w-4 h-4 shrink-0" />
              <span>
                {preview.willPass
                  ? 'Porta la Manovra al Voto in Parlamento'
                  : 'Forza il Voto in Aula · Alto Rischio Crisi di Governo'}
              </span>
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
};

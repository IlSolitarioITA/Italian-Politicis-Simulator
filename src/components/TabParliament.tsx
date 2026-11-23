import React, { useMemo, useState } from 'react';
import { PARLIAMENT_LAWS } from '../data/laws';
import { KEY_MINISTRIES } from '../data/ministries';
import {
  calculateParliamentSeats,
  evaluateCencelliSatisfaction,
  forecastLawVote,
} from '../engine/simulation';
import { ElectoralLawId, GameState, LawDefinition, MinistryId } from '../types/game';
import { PartyEmblem } from './PartyEmblem';
import {
  AlertTriangle,
  ArrowLeftRight,
  Award,
  CheckCircle2,
  Gavel,
  Globe,
  Landmark,
  RotateCcw,
  Scale,
  ShieldAlert,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';

interface TabParliamentProps {
  state: GameState;
  onVoteLaw: (lawId: string) => void;
  onReshuffleMinistry: (ministryId: MinistryId, newPartyId: string) => void;
  onRestoreDemocracy: () => void;
}

const ELECTORAL_LAW_LABELS: Record<ElectoralLawId, string> = {
  rosatellum: 'Rosatellum (62,5% Prop. / 37,5% Collegi)',
  proporzionale: 'Proporzionale Puro (Soglia 3%)',
  maggioritario: 'Maggioritario Uninominale (65% Collegi)',
  premio_maggioranza: 'Premio di Maggioranza (55% se ≥38%)',
};

const REGIME_LABELS = {
  repubblica_parlamentare: {
    label: 'Repubblica Parlamentare',
    cls: 'text-emerald-400',
    desc: 'Equilibrio costituzionale attivo tra Camere, Governo e Quirinale.',
  },
  democrazia_illiberale: {
    label: 'Democrazia Illiberale',
    cls: 'text-amber-400',
    desc: 'Forte concentrazione dell’esecutivo: tensioni con Bruxelles, piazze e Quirinale.',
  },
  regime_autoritario: {
    label: 'Regime Autoritario (Pieni Poteri)',
    cls: 'text-rose-400',
    desc: 'Parlamento sospeso, decreti esecutivi immediati, elezioni congelate. Rischio spread e piazze.',
  },
};

export const TabParliament: React.FC<TabParliamentProps> = ({
  state,
  onVoteLaw,
  onReshuffleMinistry,
  onRestoreDemocracy,
}) => {
  const [category, setCategory] = useState<'economica' | 'elettorale' | 'costituzionale'>(
    'economica'
  );
  const [reshuffleMinistryId, setReshuffleMinistryId] = useState<MinistryId | null>(null);

  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const seats = useMemo(
    () => calculateParliamentSeats(state.parties, state.electoralLaw),
    [state.parties, state.electoralLaw]
  );

  const coalitionSeats = useMemo(() => {
    const members = state.parties.filter(
      (p) =>
        p.id !== 'altri' &&
        (p.id === player.id || (player.coalitionId && p.coalitionId === player.coalitionId))
    );
    const camera = members.reduce(
      (acc, m) => acc + (seats.find((s) => s.partyId === m.id)?.camera ?? 0),
      0
    );
    const senato = members.reduce(
      (acc, m) => acc + (seats.find((s) => s.partyId === m.id)?.senato ?? 0),
      0
    );
    return { camera, senato, count: members.length };
  }, [state.parties, player, seats]);

  const hasActiveCabinet = Object.keys(state.governmentMinistries ?? {}).length > 0;
  const cabinetEvaluation = useMemo(
    () =>
      evaluateCencelliSatisfaction(
        state.parties,
        state.playerPartyId,
        seats,
        state.governmentMinistries ?? {},
        Object.keys(state.allySatisfaction ?? {}).length > 0
          ? state.allySatisfaction
          : undefined
      ),
    [state.parties, state.playerPartyId, seats, state.governmentMinistries, state.allySatisfaction]
  );

  const filteredLaws = useMemo(
    () => PARLIAMENT_LAWS.filter((l) => l.category === category),
    [category]
  );

  const { spread, socialStability, euRelations, democraticHealth } = state.stateIndicators;
  const regimeInfo = REGIME_LABELS[state.regimeStatus];

  const formatAxisShifts = (law: LawDefinition): string => {
    const map: Record<string, [string, string]> = {
      economic: ['Statalista', 'Liberista'],
      society: ['Conservatore', 'Progressista'],
      europe: ['Sovranista', 'Federalista'],
      institutions: ['Democratico', 'Autoritario'],
    };
    const parts: string[] = [];
    for (const [k, v] of Object.entries(law.axisShift)) {
      if (!v) continue;
      const pair = map[k];
      parts.push(`${v > 0 ? pair[1] : pair[0]} ${v > 0 ? '+' : ''}${v}`);
    }
    return parts.join(' · ');
  };

  const formatStateDeltas = (law: LawDefinition): string => {
    const parts: string[] = [];
    if (law.stateEffects.spread) {
      parts.push(
        `Spread ${law.stateEffects.spread > 0 ? '+' : ''}${law.stateEffects.spread} bps`
      );
    }
    if (law.stateEffects.socialStability) {
      parts.push(
        `Stabilità ${law.stateEffects.socialStability > 0 ? '+' : ''}${law.stateEffects.socialStability}%`
      );
    }
    if (law.stateEffects.euRelations) {
      parts.push(
        `UE ${law.stateEffects.euRelations > 0 ? '+' : ''}${law.stateEffects.euRelations}%`
      );
    }
    if (law.stateEffects.democraticHealth) {
      parts.push(
        `Democrazia ${law.stateEffects.democraticHealth > 0 ? '+' : ''}${law.stateEffects.democraticHealth}%`
      );
    }
    return parts.join(' · ');
  };

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden war-scroll p-3 sm:p-4 lg:p-5 space-y-4">
      {/* Top 4 State Indicators Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Spread BTP–Bund</span>
            <TrendingUp
              className={`w-3.5 h-3.5 ${
                spread >= 240 ? 'text-rose-400' : spread >= 160 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            />
          </div>
          <div
            className={`font-mono text-xl font-bold tabular-nums mt-1 ${
              spread >= 240 ? 'text-rose-400' : spread >= 160 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {spread} <span className="text-xs font-normal text-slate-500">bps</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {spread >= 240
              ? 'Critico: drenaggio -€25k/sett.'
              : spread >= 160
                ? 'Tensione sui mercati'
                : 'Mercati tranquilli'}
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Stabilità Sociale</span>
            <Users
              className={`w-3.5 h-3.5 ${
                socialStability < 35
                  ? 'text-rose-400'
                  : socialStability < 60
                    ? 'text-amber-400'
                    : 'text-emerald-400'
              }`}
            />
          </div>
          <div
            className={`font-mono text-xl font-bold tabular-nums mt-1 ${
              socialStability < 35
                ? 'text-rose-400'
                : socialStability < 60
                  ? 'text-amber-400'
                  : 'text-emerald-400'
            }`}
          >
            {socialStability}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {socialStability < 35
              ? 'Piazze in rivolta e scioperi'
              : socialStability < 60
                ? 'Malcontento diffuso'
                : 'Clima sociale ordinato'}
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Rapporti UE / PNRR</span>
            <Globe
              className={`w-3.5 h-3.5 ${
                euRelations < 35
                  ? 'text-rose-400'
                  : euRelations < 60
                    ? 'text-amber-400'
                    : 'text-cyan-400'
              }`}
            />
          </div>
          <div
            className={`font-mono text-xl font-bold tabular-nums mt-1 ${
              euRelations < 35
                ? 'text-rose-400'
                : euRelations < 60
                  ? 'text-amber-400'
                  : 'text-cyan-300'
            }`}
          >
            {euRelations}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {euRelations < 35
              ? 'Sanzioni / PNRR bloccato'
              : euRelations < 60
                ? 'Attriti con Bruxelles'
                : 'Fondi PNRR regolari'}
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800/90 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Tenuta Democratica</span>
            <Scale
              className={`w-3.5 h-3.5 ${
                democraticHealth < 45
                  ? 'text-rose-400'
                  : democraticHealth < 68
                    ? 'text-amber-400'
                    : 'text-emerald-400'
              }`}
            />
          </div>
          <div
            className={`font-mono text-xl font-bold tabular-nums mt-1 ${
              democraticHealth < 45
                ? 'text-rose-400'
                : democraticHealth < 68
                  ? 'text-amber-400'
                  : 'text-emerald-400'
            }`}
          >
            {democraticHealth}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {democraticHealth < 45
              ? 'Allarme Quirinale / Consulta'
              : democraticHealth < 68
                ? 'Contrappesi sotto pressione'
                : 'Istituzioni solide'}
          </div>
        </div>
      </section>

      {/* Constitutional & Regime Status Bar */}
      <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="text-slate-400">Assetto dello Stato:</span>
            <strong className={`font-semibold ${regimeInfo.cls}`}>{regimeInfo.label}</strong>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-400">
              Sistema Elettorale:{' '}
              <span className="text-slate-200 font-medium">
                {ELECTORAL_LAW_LABELS[state.electoralLaw]}
              </span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400">{regimeInfo.desc}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="text-xs font-mono tabular-nums bg-[#090D16] border border-slate-800 rounded-lg px-3 py-1.5">
            <span className="text-slate-400">Coalizione: </span>
            <span
              className={
                coalitionSeats.camera >= 201 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'
              }
            >
              {coalitionSeats.camera}/201 Cam.
            </span>
            <span className="text-slate-600"> · </span>
            <span
              className={
                coalitionSeats.senato >= 101 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'
              }
            >
              {coalitionSeats.senato}/101 Sen.
            </span>
          </div>

          {state.regimeStatus === 'regime_autoritario' && (
            <button
              type="button"
              onClick={onRestoreDemocracy}
              className="px-3 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Ripristina Democrazia</span>
            </button>
          )}
        </div>
      </section>

      {/* Consiglio dei Ministri Attivo & Rimpasto */}
      {(state.isPrimeMinister || hasActiveCabinet) && (
        <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Consiglio dei Ministri Attivo</span>
                </h2>
                <span className="text-slate-600 text-xs" aria-hidden="true">
                  ·
                </span>
                <span className="text-xs font-medium text-amber-300">
                  {state.isPrimeMinister
                    ? `Presidente del Consiglio: ${state.leader.name}`
                    : 'Governo in carica'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {state.isPrimeMinister
                  ? 'Monitora la fiducia degli alleati e usa il Rimpasto (1 PA) per cedere un ministero a un alleato in crisi.'
                  : 'Composizione attuale dei 6 Ministeri Chiave della maggioranza.'}
              </p>
            </div>
          </div>

          {/* Griglia 6 Ministeri Chiave */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {KEY_MINISTRIES.map((ministry) => {
              const holderId = state.governmentMinistries[ministry.id];
              const holder = state.parties.find((p) => p.id === holderId);
              const isReshuffling = reshuffleMinistryId === ministry.id;
              const canReshuffle =
                state.isPrimeMinister && cabinetEvaluation.coalitionParties.length > 1;

              return (
                <div
                  key={ministry.id}
                  className="p-3 rounded-lg bg-[#090D16] border border-slate-800/90 flex flex-col justify-between gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 truncate">
                        {ministry.shortName}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                        Peso Cencelli {ministry.weight.toFixed(1)}
                      </div>
                    </div>

                    {canReshuffle && (
                      <button
                        type="button"
                        onClick={() =>
                          setReshuffleMinistryId(isReshuffling ? null : ministry.id)
                        }
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 border transition-colors shrink-0 cursor-pointer ${
                          isReshuffling
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-[#111827] hover:bg-slate-800 border-slate-700 text-slate-200'
                        }`}
                      >
                        <ArrowLeftRight className="w-3 h-3 shrink-0" />
                        <span>Rimpasto</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {holder ? (
                      <>
                        <PartyEmblem
                          emblem={holder.emblem}
                          color={holder.color}
                          customUrl={holder.customEmblemUrl}
                          size={22}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-200 truncate">
                            {holder.name} ({holder.acronym})
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            Quota {holder.leaderName}
                          </div>
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500">Non assegnato</span>
                    )}
                  </div>

                  {/* Selettore inline Rimpasto */}
                  {isReshuffling && canReshuffle && (
                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                      <div className="text-[10px] text-amber-300 font-medium">
                        Cedi {ministry.shortName} a (costo 1 PA):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cabinetEvaluation.coalitionParties
                          .filter((cp) => cp.id !== holderId)
                          .map((cp) => (
                            <button
                              key={cp.id}
                              type="button"
                              disabled={state.politicalCapital <= 0}
                              onClick={() => {
                                onReshuffleMinistry(ministry.id, cp.id);
                                setReshuffleMinistryId(null);
                              }}
                              className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 border transition-colors ${
                                state.politicalCapital > 0
                                  ? 'bg-[#111827] hover:bg-cyan-500/20 border-slate-700 hover:border-cyan-400 text-slate-100 cursor-pointer'
                                  : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                              }`}
                            >
                              <PartyEmblem
                                emblem={cp.emblem}
                                color={cp.color}
                                customUrl={cp.customEmblemUrl}
                                size={14}
                              />
                              <span>{cp.acronym}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stabilità e Soddisfazione Alleati di Coalizione */}
          {cabinetEvaluation.allyReports.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="text-xs font-semibold text-slate-200">
                Tenuta della Maggioranza · Soddisfazione Alleati
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {cabinetEvaluation.allyReports.map((ally) => {
                  const barCls =
                    ally.satisfaction >= 50
                      ? 'bg-emerald-500'
                      : ally.satisfaction >= 35
                        ? 'bg-amber-500'
                        : 'bg-rose-500';
                  const txtCls =
                    ally.satisfaction >= 50
                      ? 'text-emerald-400'
                      : ally.satisfaction >= 35
                        ? 'text-amber-400'
                        : 'text-rose-400';

                  return (
                    <div
                      key={ally.partyId}
                      className="p-2.5 rounded-lg bg-[#090D16] border border-slate-800/80 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-200 truncate">
                          {ally.partyName} ({ally.partyAcronym})
                        </span>
                        <span className={`font-mono font-bold tabular-nums shrink-0 ${txtCls}`}>
                          {ally.satisfaction}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-200 ${barCls}`}
                          style={{ width: `${ally.satisfaction}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-1 text-[10px]">
                        <span className={txtCls}>
                          {ally.satisfaction < 35
                            ? 'Crisi di fiducia · Serve Rimpasto'
                            : ally.satisfaction < 50
                              ? 'Malumori nella coalizione'
                              : 'Fiducia stabile'}
                        </span>
                        <span className="font-mono tabular-nums text-slate-500">
                          {ally.cameraSeats} Cam. · {ally.assignedMinistries.length} min.
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Main Split: Left 8 cols (Bills & Reforms) | Right 4 cols (Roll-Call Log & Institutional Levers) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <section className="xl:col-span-8 bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Iniziativa Legislativa e Riforme dello Stato</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                I voti dipendono dai seggi reali in Camera e Senato, dagli alleati e dall’affinità ideologica degli altri partiti.
              </p>
            </div>

            <div className="flex items-center p-0.5 bg-[#090D16] border border-slate-800 rounded-lg overflow-x-auto no-scrollbar shrink-0">
              {(
                [
                  { id: 'economica', label: 'Economiche' },
                  { id: 'elettorale', label: 'Legge Elettorale' },
                  { id: 'costituzionale', label: 'Costituzionali & Potere' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategory(tab.id)}
                  className={`px-2.5 py-1.5 text-[11px] font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                    category === tab.id
                      ? tab.id === 'costituzionale'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-slate-800 text-slate-50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredLaws.map((law) => {
              const forecast = forecastLawVote(state, law);
              const isEnacted =
                law.category === 'elettorale'
                  ? state.electoralLaw === law.electoralLawChange
                  : state.enactedLawIds.includes(law.id);
              const cost = law.budgetDelta < 0 ? Math.abs(law.budgetDelta) : 0;
              const cannotAfford = cost > state.budget;
              const isCoup = law.id === 'law_pieni_poteri';
              const disabled = isEnacted || state.politicalCapital <= 0 || cannotAfford;

              return (
                <article
                  key={law.id}
                  className={`p-3.5 rounded-xl bg-[#090D16] border flex flex-col justify-between gap-3 ${
                    isEnacted
                      ? 'border-emerald-500/45'
                      : isCoup
                        ? 'border-rose-500/50'
                        : 'border-slate-800/90'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs font-bold text-slate-100 leading-snug">
                        {law.title}
                      </h3>
                      {isEnacted ? (
                        <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          In vigore
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {law.budgetDelta < 0
                            ? `-€${Math.abs(law.budgetDelta).toLocaleString('it-IT')}`
                            : law.budgetDelta > 0
                              ? `+€${law.budgetDelta.toLocaleString('it-IT')}`
                              : '€0'}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">{law.shortDesc}</p>

                    {/* Live Chamber Vote Projection */}
                    {!isEnacted && (
                      <div className="p-2.5 rounded-lg bg-[#111827] border border-slate-800/80 space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between font-mono tabular-nums">
                          <span className="text-slate-400">Stima Camera</span>
                          <span
                            className={
                              forecast.cameraYes >= forecast.requiredCamera
                                ? 'text-emerald-400 font-semibold'
                                : 'text-rose-400 font-semibold'
                            }
                          >
                            {forecast.cameraYes} Sì / {forecast.cameraNo} No (soglia{' '}
                            {forecast.requiredCamera})
                          </span>
                        </div>
                        <div className="flex items-center justify-between font-mono tabular-nums">
                          <span className="text-slate-400">Stima Senato</span>
                          <span
                            className={
                              forecast.senatoYes >= forecast.requiredSenato
                                ? 'text-emerald-400 font-semibold'
                                : 'text-rose-400 font-semibold'
                            }
                          >
                            {forecast.senatoYes} Sì / {forecast.senatoNo} No (soglia{' '}
                            {forecast.requiredSenato})
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-slate-800/70 text-[10px]">
                          <span className="text-slate-400 truncate">
                            Favorevoli:{' '}
                            <span className="text-slate-200">
                              {forecast.supporters.join(', ') || 'Nessuno'}
                            </span>
                          </span>
                          <span
                            className={`font-mono ${
                              forecast.quirinaleVetoChance >= 45
                                ? 'text-rose-400'
                                : forecast.quirinaleVetoChance >= 20
                                  ? 'text-amber-400'
                                  : 'text-slate-400'
                            }`}
                          >
                            Rischio Veto Colle: {forecast.quirinaleVetoChance}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Missing prerequisites warning for Authoritarian Full Powers */}
                    {!isEnacted && forecast.missingPrereqs.length > 0 && (
                      <div className="p-2 rounded-lg bg-rose-950/35 border border-rose-500/40 text-[10px] text-rose-200 flex items-start gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>
                          Senza <strong>{forecast.missingPrereqs.join(' + ')}</strong> il
                          Quirinale bloccherà l’atto sciogliendo subito le Camere.
                        </span>
                      </div>
                    )}

                    {/* Axis & State Effects */}
                    <div className="space-y-0.5 text-[10px] font-mono">
                      {formatAxisShifts(law) && (
                        <div className="text-cyan-400/90">Assi: {formatAxisShifts(law)}</div>
                      )}
                      {formatStateDeltas(law) && (
                        <div className="text-slate-400">Stato: {formatStateDeltas(law)}</div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onVoteLaw(law.id)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                      isEnacted
                        ? 'bg-emerald-950/30 border-emerald-500/35 text-emerald-400 cursor-default'
                        : disabled
                          ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                          : isCoup
                            ? 'bg-rose-600 hover:bg-rose-500 border-rose-500 text-white cursor-pointer'
                            : forecast.willPass
                              ? 'bg-cyan-500 hover:bg-cyan-400 border-cyan-400 text-slate-950 cursor-pointer'
                              : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 cursor-pointer'
                    }`}
                  >
                    <Gavel className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {isEnacted
                        ? 'Provvedimento in Vigore'
                        : state.regimeStatus === 'regime_autoritario'
                          ? 'Emana per Decreto (1 PA)'
                          : forecast.willPass
                            ? 'Vota in Aula · Passa (1 PA)'
                            : 'Vota in Aula · Minoranza (1 PA)'}
                    </span>
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        {/* Right 4 cols: Institutional Power Levers + Parliamentary Vote Registry */}
        <aside className="xl:col-span-4 space-y-4 min-w-0">
          {/* Active Power Levers */}
          <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-2.5">
            <h3 className="text-sm font-semibold text-slate-100 pb-2 border-b border-slate-800">
              Leve Istituzionali Attive
            </h3>
            <div className="space-y-2 text-xs">
              {(
                [
                  {
                    key: 'premierato',
                    label: 'Premierato Forte',
                    effect: '-14% rischio veto Colle',
                  },
                  {
                    key: 'mediaControl',
                    label: 'Controllo Rai / Media',
                    effect: '+30% impatto TV & Social',
                  },
                  {
                    key: 'judiciaryControl',
                    label: 'Magistratura sotto Esecutivo',
                    effect: '-50% danni da scandali',
                  },
                  {
                    key: 'strikeLimit',
                    label: 'Limitazione Scioperi',
                    effect: 'Contiene erosione piazze',
                  },
                  {
                    key: 'fullPowers',
                    label: 'Pieni Poteri (Regime)',
                    effect: 'Decreti diretti, voto sospeso',
                  },
                ] as const
              ).map((item) => {
                const active = state.institutionalFlags[item.key];
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-800/60 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <div className={active ? 'text-slate-100 font-medium' : 'text-slate-500'}>
                        {item.label}
                      </div>
                      <div className="text-[10px] text-slate-500">{item.effect}</div>
                    </div>
                    <span
                      className={`font-mono text-[11px] shrink-0 ${
                        active ? 'text-rose-400 font-semibold' : 'text-slate-600'
                      }`}
                    >
                      {active ? 'ATTIVA' : 'No'}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Roll-Call Voting History */}
          <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 flex flex-col">
            <h3 className="text-sm font-semibold text-slate-100 pb-2 border-b border-slate-800">
              Registro Votazioni d’Aula
            </h3>

            {state.lawVoteHistory.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Nessuna votazione registrata in questa legislatura. Presenta la prima legge o riforma.
              </p>
            ) : (
              <div className="mt-3 space-y-2.5 max-h-[420px] overflow-y-auto war-scroll pr-1">
                {state.lawVoteHistory.map((rec) => {
                  const icon =
                    rec.outcome === 'approvata' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : rec.outcome === 'veto_quirinale' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    );
                  const label =
                    rec.outcome === 'approvata'
                      ? 'Approvata'
                      : rec.outcome === 'veto_quirinale'
                        ? 'Veto Quirinale'
                        : 'Respinta';
                  const cls =
                    rec.outcome === 'approvata'
                      ? 'text-emerald-400'
                      : rec.outcome === 'veto_quirinale'
                        ? 'text-amber-400'
                        : 'text-rose-400';

                  return (
                    <div
                      key={rec.id}
                      className="p-3 rounded-lg bg-[#090D16] border border-slate-800/80 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2 text-[10px]">
                        <span className={`font-semibold flex items-center gap-1 ${cls}`}>
                          {icon}
                          {label}
                        </span>
                        <span className="font-mono text-slate-500">{rec.dateLabel}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-100 leading-snug">
                        {rec.title}
                      </div>
                      <div className="font-mono text-[10px] tabular-nums text-slate-400">
                        Camera {rec.cameraYes}–{rec.cameraNo} · Senato {rec.senatoYes}–{rec.senatoNo}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{rec.summary}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
};

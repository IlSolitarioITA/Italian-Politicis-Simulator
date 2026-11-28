import React, { useMemo, useState } from 'react';
import { PARLIAMENT_LAWS } from '../data/laws';
import {
  KEY_MINISTRIES,
  evaluateExecutiveMinistryAffinity,
  getSpecializationLabel,
} from '../data/ministries';
import {
  INQUIRY_COMMISSION_COST,
  INQUIRY_COMMISSION_TOPICS,
  LawVoteForecast,
  MOTION_COOLDOWN_WEEKS,
  PARLIAMENTARY_MOTIONS,
  QUESTION_TIME_COOLDOWN_WEEKS,
  QUESTION_TIME_TOPICS,
  RECOMPACT_SUMMIT_COST,
  evaluateCencelliSatisfaction,
  forecastLawVote,
  getCurrentParliamentSeats,
  getPlayerParliamentSeats,
} from '../engine/simulation';
import {
  ElectoralLawId,
  GameState,
  LawDefinition,
  LegislativeInstrument,
  LegislativeStage,
  MinistryId,
  ReferendumStance,
  TabId,
} from '../types/game';
import { PartyEmblem } from './PartyEmblem';
import { ReferendumPanel } from './ReferendumPanel';
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Eye,
  FileEdit,
  FileSearch,
  Flame,
  Gavel,
  Globe,
  Hand,
  Landmark,
  Lock,
  Megaphone,
  MessageSquare,
  Mic,
  Repeat,
  RotateCcw,
  Scale,
  ScrollText,
  ShieldAlert,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';

interface TabParliamentProps {
  state: GameState;
  onVoteLaw: (
    lawId: string,
    instrument?: LegislativeInstrument,
    withConfidence?: boolean
  ) => void;
  onConvertDecree?: (decreeId: string, withConfidence: boolean) => void;
  onConfidencePendingBill?: (billId: string) => void;
  onInterveneBill?: (
    targetId: string,
    targetKind: 'ddl' | 'dl',
    action: 'emendamento' | 'ostruzionismo'
  ) => void;
  onQuestionTime?: (ministryId: MinistryId, topicId: string) => void;
  onProposeMotion?: (motionId: string) => void;
  onRecompactMajority?: () => void;
  onStreetMobilization?: (
    targetId: string,
    targetKind: 'ddl' | 'dl',
    stance: 'pro' | 'contro'
  ) => void;
  onLaunchCommission?: (topicId: string) => void;
  onOpenQuirinale?: () => void;
  onReshuffleMinistry: (
    ministryId: MinistryId,
    newPartyId: string,
    newExecId?: string
  ) => void;
  onRestoreDemocracy: () => void;
  onNavigateTab?: (tab: TabId) => void;
  onPromoteAbrogative?: (templateId: string) => void;
  onTriggerConstitutional?: (lawId: string) => void;
  onBoostRefSignatures?: () => void;
  onSetRefStance?: (stance: ReferendumStance) => void;
  onFundRefCampaign?: (tier: 'locale' | 'nazionale') => void;
  onDismissConcludedRef?: () => void;
}

const ELECTORAL_LAW_LABELS: Record<ElectoralLawId, string> = {
  rosatellum: 'Rosatellum · L. 165/2017 (63% Prop. / 37% Collegi · 3% / 10%)',
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

const LEGISLATIVE_STAGES: { id: LegislativeStage; label: string; shortLabel: string }[] = [
  { id: 'commissione', label: 'Commissione', shortLabel: 'Comm.' },
  { id: 'camera', label: 'Voto Camera', shortLabel: 'Camera' },
  { id: 'senato', label: 'Voto Senato', shortLabel: 'Senato' },
  { id: 'promulgazione', label: 'Promulgazione Quirinale', shortLabel: 'Quirinale' },
];

const LegislativeIterBar: React.FC<{
  stage: LegislativeStage;
  navettaCount?: number;
  navettaNote?: string;
  completedAll?: boolean;
}> = ({ stage, navettaCount = 0, navettaNote, completedAll = false }) => {
  const activeIdx = LEGISLATIVE_STAGES.findIndex((s) => s.id === stage);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-1.5">
        {LEGISLATIVE_STAGES.map((step, idx) => {
          const isDone = completedAll || idx < activeIdx;
          const isCurrent = !completedAll && idx === activeIdx;
          return (
            <div key={step.id} className="space-y-1 min-w-0">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  isDone
                    ? 'bg-emerald-400'
                    : isCurrent
                      ? 'bg-cyan-400'
                      : 'bg-slate-800'
                }`}
              />
              <div
                className={`text-[10px] leading-tight truncate ${
                  isDone
                    ? 'text-emerald-300 font-medium'
                    : isCurrent
                      ? 'text-cyan-200 font-semibold'
                      : 'text-slate-500'
                }`}
                title={step.label}
              >
                <span className="hidden sm:inline">{idx + 1}. {step.label}</span>
                <span className="sm:hidden">{idx + 1}. {step.shortLabel}</span>
              </div>
            </div>
          );
        })}
      </div>

      {navettaCount > 0 && (
        <div className="px-2.5 py-1.5 rounded-md bg-amber-950/30 border border-amber-500/40 text-[10px] text-amber-200 flex items-start gap-1.5">
          <Repeat className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <strong className="font-semibold text-amber-300">
              Navetta parlamentare (Camera ↔ Senato · #{navettaCount})
            </strong>
            {navettaNote ? <span className="text-amber-100/90"> · {navettaNote}</span> : null}
          </div>
        </div>
      )}
    </div>
  );
};

const ParliamentaryGroupsBreakdown: React.FC<{
  forecast: LawVoteForecast;
  compact?: boolean;
}> = ({ forecast, compact = false }) => {
  const { favorevoli, contrari, astenuti, indecisi } = forecast.groupBreakdown;
  const rows = [
    {
      key: 'fav',
      label: 'Favorevoli',
      groups: favorevoli,
      seatsCam: forecast.cameraYes,
      cls: 'text-emerald-300',
      borderCls: 'border-emerald-500/25 bg-emerald-950/15',
    },
    {
      key: 'ind',
      label: 'Indecisi',
      groups: indecisi,
      seatsCam: forecast.cameraUndecided,
      cls: 'text-amber-300',
      borderCls: 'border-amber-500/25 bg-amber-950/15',
    },
    {
      key: 'ast',
      label: 'Astenuti',
      groups: astenuti,
      seatsCam: forecast.cameraAbstain,
      cls: 'text-slate-300',
      borderCls: 'border-slate-700/70 bg-slate-900/50',
    },
    {
      key: 'con',
      label: 'Contrari',
      groups: contrari,
      seatsCam: forecast.cameraNo,
      cls: 'text-rose-300',
      borderCls: 'border-rose-500/25 bg-rose-950/15',
    },
  ];

  return (
    <div className="space-y-2">
      <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'} gap-1.5`}>
        {rows.map((row) => (
          <div
            key={row.key}
            className={`px-2 py-1.5 rounded-md border ${row.borderCls} min-w-0 space-y-1`}
          >
            <div className="flex items-center justify-between gap-1 text-[10px]">
              <span className={`font-semibold ${row.cls}`}>{row.label}</span>
              <span className="font-mono tabular-nums text-slate-300">{row.seatsCam}</span>
            </div>
            <div className="flex flex-wrap gap-1 min-h-[14px]">
              {row.groups.length > 0 ? (
                row.groups.map((g) => (
                  <span
                    key={g.partyId}
                    className="inline-flex items-center gap-1 text-[10px] text-slate-200 font-mono"
                    title={`${g.name}: ${g.cameraSeats} Camera · ${g.senatoSeats} Senato`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: g.color }}
                    />
                    <span>{g.acronym}</span>
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-slate-600">—</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {forecast.secretBallotEligible && forecast.secretBallotRisk >= 14 && (
        <div className="flex flex-wrap items-center justify-between gap-1.5 px-2 py-1 rounded-md bg-rose-950/25 border border-rose-500/35 text-[10px]">
          <span className="text-rose-200 flex items-center gap-1 font-medium">
            <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />
            <span>Rischio Voto Segreto / Franchi Tiratori:</span>
            <strong className="font-mono text-rose-300">{forecast.secretBallotRisk}%</strong>
          </span>
          <span className="font-mono tabular-nums text-slate-400">
            ~{forecast.estimatedFrancTireursCamera} Cam / ~{forecast.estimatedFrancTireursSenato} Sen
          </span>
        </div>
      )}
    </div>
  );
};

const ParliamentCompositionCard: React.FC<{
  state: GameState;
  seats: ReturnType<typeof getCurrentParliamentSeats>;
}> = ({ state, seats }) => {
  const { govParties, oppParties, mistoSeats, totals } = useMemo(() => {
    const byId = new Map<string, { camera: number; senato: number }>();
    for (const s of seats) {
      byId.set(s.partyId, { camera: s.camera, senato: s.senato });
    }

    const seatedNamed = state.parties
      .filter((p) => p.id !== 'altri')
      .map((p) => {
        const s = byId.get(p.id) ?? { camera: 0, senato: 0 };
        return {
          party: p,
          camera: s.camera,
          senato: s.senato,
          total: s.camera + s.senato,
        };
      })
      .filter((row) => row.total > 0)
      .sort((a, b) => b.total - a.total || b.camera - a.camera);

    const gov = seatedNamed.filter((r) => r.party.isInGovernment);
    const opp = seatedNamed.filter((r) => !r.party.isInGovernment);

    const namedCam = seatedNamed.reduce((acc, r) => acc + r.camera, 0);
    const namedSen = seatedNamed.reduce((acc, r) => acc + r.senato, 0);
    const explicitAltri = byId.get('altri') ?? { camera: 0, senato: 0 };
    const mistoCam = namedCam > 0 ? Math.max(0, 400 - namedCam) : explicitAltri.camera;
    const mistoSen = namedSen > 0 ? Math.max(0, 200 - namedSen) : explicitAltri.senato;

    return {
      govParties: gov,
      oppParties: opp,
      mistoSeats: { camera: mistoCam, senato: mistoSen, total: mistoCam + mistoSen },
      totals: {
        govCam: gov.reduce((acc, r) => acc + r.camera, 0),
        govSen: gov.reduce((acc, r) => acc + r.senato, 0),
        oppCam: opp.reduce((acc, r) => acc + r.camera, 0),
        oppSen: opp.reduce((acc, r) => acc + r.senato, 0),
        allCam: namedCam + mistoCam,
        allSen: namedSen + mistoSen,
        groupsCount: seatedNamed.length + (mistoCam + mistoSen > 0 ? 1 : 0),
      },
    };
  }, [state.parties, seats]);

  return (
    <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Gruppi Parlamentari in Carica ({totals.groupsCount})</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Tutti i partiti con almeno 1 seggio tra Camera e Senato, inclusi i gruppi monocamerali e il Gruppo Misto.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums bg-[#090D16] border border-slate-800 rounded-lg px-2.5 py-1.5 shrink-0">
          <span className="text-slate-400">Camera</span>
          <strong className="text-slate-100">{totals.allCam}</strong>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">Senato</span>
          <strong className="text-slate-100">{totals.allSen}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Maggioranza di Governo */}
        <div className="rounded-lg bg-[#090D16] border border-emerald-500/25 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-emerald-300">
              Maggioranza di Governo ({govParties.length})
            </span>
            <span className="font-mono tabular-nums text-[11px] text-emerald-200">
              {totals.govCam} Cam · {totals.govSen} Sen
            </span>
          </div>
          <div className="space-y-1.5">
            {govParties.length === 0 ? (
              <div className="text-[11px] text-slate-500">Nessun partito al Governo</div>
            ) : (
              govParties.map(({ party, camera, senato }) => {
                const isPlayer = party.id === state.playerPartyId;
                return (
                  <div
                    key={party.id}
                    className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-md border text-xs ${
                      isPlayer
                        ? 'bg-cyan-950/30 border-cyan-500/45'
                        : 'bg-slate-900/50 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <PartyEmblem
                        emblem={party.emblem}
                        color={party.color}
                        customUrl={party.customEmblemUrl}
                        size={18}
                      />
                      <span
                        className={`truncate font-medium ${
                          isPlayer ? 'text-cyan-200' : 'text-slate-200'
                        }`}
                      >
                        {party.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {party.acronym}
                      </span>
                      {isPlayer && (
                        <span className="text-[10px] font-semibold text-cyan-300 shrink-0">
                          Tu
                        </span>
                      )}
                    </div>
                    <div className="font-mono tabular-nums text-[11px] shrink-0 text-slate-200">
                      <span>{camera}</span>
                      <span className="text-slate-500"> Cam · </span>
                      <span>{senato}</span>
                      <span className="text-slate-500"> Sen</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Opposizione Parlamentare & Gruppo Misto */}
        <div className="rounded-lg bg-[#090D16] border border-slate-800 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-amber-300">
              Opposizione Parlamentare ({oppParties.length})
            </span>
            <span className="font-mono tabular-nums text-[11px] text-slate-300">
              {totals.oppCam} Cam · {totals.oppSen} Sen
            </span>
          </div>
          <div className="space-y-1.5">
            {oppParties.map(({ party, camera, senato }) => {
              const isPlayer = party.id === state.playerPartyId;
              return (
                <div
                  key={party.id}
                  className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-md border text-xs ${
                    isPlayer
                      ? 'bg-cyan-950/30 border-cyan-500/45'
                      : 'bg-slate-900/50 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <PartyEmblem
                      emblem={party.emblem}
                      color={party.color}
                      customUrl={party.customEmblemUrl}
                      size={18}
                    />
                    <span
                      className={`truncate font-medium ${
                        isPlayer ? 'text-cyan-200' : 'text-slate-200'
                      }`}
                    >
                      {party.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {party.acronym}
                    </span>
                    {isPlayer && (
                      <span className="text-[10px] font-semibold text-cyan-300 shrink-0">
                        Tu
                      </span>
                    )}
                  </div>
                  <div className="font-mono tabular-nums text-[11px] shrink-0 text-slate-200">
                    <span className={camera > 0 ? 'text-slate-100' : 'text-slate-500'}>
                      {camera}
                    </span>
                    <span className="text-slate-500"> Cam · </span>
                    <span className={senato > 0 ? 'text-slate-100' : 'text-slate-500'}>
                      {senato}
                    </span>
                    <span className="text-slate-500"> Sen</span>
                  </div>
                </div>
              );
            })}

            {mistoSeats.total > 0 && (
              <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md border border-slate-800/70 bg-slate-900/35 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-xs shrink-0"
                    style={{ backgroundColor: '#64748B' }}
                  />
                  <span className="truncate font-medium text-slate-300">
                    Gruppo Misto / Non Iscritti
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">MISTO</span>
                </div>
                <div className="font-mono tabular-nums text-[11px] shrink-0 text-slate-300">
                  <span>{mistoSeats.camera}</span>
                  <span className="text-slate-500"> Cam · </span>
                  <span>{mistoSeats.senato}</span>
                  <span className="text-slate-500"> Sen</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export const TabParliament: React.FC<TabParliamentProps> = ({
  state,
  onVoteLaw,
  onConvertDecree,
  onConfidencePendingBill,
  onInterveneBill,
  onQuestionTime,
  onProposeMotion,
  onRecompactMajority,
  onStreetMobilization,
  onLaunchCommission,
  onOpenQuirinale,
  onReshuffleMinistry,
  onRestoreDemocracy,
  onNavigateTab,
  onPromoteAbrogative,
  onTriggerConstitutional,
  onBoostRefSignatures,
  onSetRefStance,
  onFundRefCampaign,
  onDismissConcludedRef,
}) => {
  const [category, setCategory] = useState<
    'economica' | 'elettorale' | 'costituzionale' | 'azione_aula' | 'commissioni' | 'referendum'
  >('economica');
  const [lawInstrumentMap, setLawInstrumentMap] = useState<Record<string, LegislativeInstrument>>(
    {}
  );
  const [reshuffleMinistryId, setReshuffleMinistryId] = useState<MinistryId | null>(null);
  const [qtTopicId, setQtTopicId] = useState<string>(QUESTION_TIME_TOPICS[0].id);
  const [qtMinistryId, setQtMinistryId] = useState<MinistryId>(QUESTION_TIME_TOPICS[0].ministryId);

  const hasRefAlert =
    Boolean(state.activeReferendum) ||
    (state.pendingConstitutionalReferendumLawIds ?? []).length > 0;
  const isInGovernment = state.isPrimeMinister || state.governmentRole !== 'opposizione';
  const activeDecrees = (state.activeDecreeLaws ?? []).filter(
    (d) => d.status === 'in_conversione'
  );
  const weeksToQuirinale = Math.max(0, (state.quirinaleTermEndWeek ?? 36) - state.week);
  const chamberTension = state.chamberTension ?? 28;
  const qtCooldownLeft = Math.max(
    0,
    QUESTION_TIME_COOLDOWN_WEEKS - (state.week - (state.lastQuestionTimeWeek ?? -10))
  );
  const motionCooldownLeft = Math.max(
    0,
    MOTION_COOLDOWN_WEEKS - (state.week - (state.lastMotionWeek ?? -10))
  );

  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const playerSeats = useMemo(() => getPlayerParliamentSeats(state), [state]);
  const seats = useMemo(() => getCurrentParliamentSeats(state), [state]);
  const voteDone = state.actionsTakenThisWeek.includes('parl_vote_week');
  const floorActionDone = state.actionsTakenThisWeek.includes('parl_floor_action');
  const streetActionDone = state.actionsTakenThisWeek.includes('parl_street_mobilization');
  const summitDone = state.actionsTakenThisWeek.includes('parl_recompact_summit');
  const reshuffleDone = state.actionsTakenThisWeek.includes('parl_reshuffle_week');
  const inquiryDone = state.actionsTakenThisWeek.includes('parl_inquiry_week');

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

  if (playerSeats.isExtraParliamentary) {
    const weeksToElection = Math.max(0, state.electionWeek - state.week);
    const thresholdProgress = Math.min(100, Math.max(0, (player.nationalPoll / 3.0) * 100));

    return (
      <div className="h-full overflow-y-auto overflow-x-hidden war-scroll p-4 sm:p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="w-full max-w-2xl mx-auto bg-[#111827] border border-amber-500/40 rounded-2xl p-6 sm:p-7 text-center space-y-5 shadow-xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-wider text-amber-400">
                Parlamento &amp; Governo · Accesso Bloccato
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-50">
                Partito Extra-Parlamentare (0 Seggi)
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                I seggi parlamentari e l’accesso al Governo cambiano <strong>esclusivamente</strong>{' '}
                dopo un’elezione politica (o una scissione parlamentare reale): superare il 3% nei
                sondaggi non assegna seggi in automatico. Puoi comunque promuovere{' '}
                <strong>Referendum Abrogativi (Art. 75 Cost.)</strong> qui sotto o raccogliere le
                firme per le liste nella scheda Partito.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-left">
              <div className="p-3 rounded-xl bg-[#090D16] border border-slate-800">
                <div className="text-[11px] text-slate-400">Consenso Attuale</div>
                <div className="font-mono text-lg font-bold tabular-nums text-cyan-300 mt-0.5">
                  {player.nationalPoll.toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500">Obiettivo: ≥ 3,0%</div>
              </div>
              <div className="p-3 rounded-xl bg-[#090D16] border border-slate-800">
                <div className="text-[11px] text-slate-400">Seggi in Aula</div>
                <div className="font-mono text-lg font-bold tabular-nums text-rose-400 mt-0.5">
                  0
                </div>
                <div className="text-[10px] text-slate-500">0 Cam. · 0 Sen.</div>
              </div>
              <div className="p-3 rounded-xl bg-[#090D16] border border-slate-800">
                <div className="text-[11px] text-slate-400">Prossimo Voto</div>
                <div className="font-mono text-lg font-bold tabular-nums text-amber-400 mt-0.5">
                  {weeksToElection}s
                </div>
                <div className="text-[10px] text-slate-500">
                  {state.committee.active ? 'Fase Comitato' : 'Elezioni Politiche'}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Avanzamento verso la soglia di sbarramento (3,0%)</span>
                <span className="font-mono tabular-nums text-slate-200">
                  {player.nationalPoll.toFixed(1)}% / 3,0%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#090D16] border border-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    player.nationalPoll >= 3.0 ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                  style={{ width: `${thresholdProgress}%` }}
                />
              </div>
            </div>

            {onNavigateTab && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab('partito')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>Raccolta Firme Liste</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('campagna')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>Azioni e Campagna</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('elezioni')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Landmark className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sala Elezioni</span>
                </button>
              </div>
            )}
          </div>

          <ParliamentCompositionCard state={state} seats={seats} />

          {/* Modalità Osservatore Esterno (0 Seggi): Leggi in discussione + Mobilitazione di Piazza */}
          <section className="bg-[#111827] border border-cyan-500/35 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Osservatore Esterno · Lavori Parlamentari in Corso</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Con 0 seggi non puoi votare, emendare o sfiduciare in Aula, ma puoi monitorare le leggi in discussione e lanciare una{' '}
                  <strong className="text-slate-200">Presa di Posizione / Mobilitazione di Piazza</strong> (1/sett., €0).
                </p>
              </div>
              <div className="text-[11px] font-mono tabular-nums text-slate-300 bg-[#090D16] border border-slate-800 rounded-lg px-2.5 py-1.5 shrink-0">
                Tensione d’Aula:{' '}
                <strong
                  className={
                    chamberTension >= 65
                      ? 'text-rose-400'
                      : chamberTension >= 40
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                  }
                >
                  {chamberTension}%
                </strong>
              </div>
            </div>

            {(state.pendingBills ?? []).length === 0 && activeDecrees.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Nessun DDL o Decreto-Legge attualmente calendarizzato in Aula questa settimana. Avanza di turno per seguire i nuovi lavori.
              </p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {(state.pendingBills ?? []).map((bill) => {
                  const law = PARLIAMENT_LAWS.find((l) => l.id === bill.lawId);
                  const forecast = law
                    ? forecastLawVote(state, law, {
                        amendmentShift: bill.amendmentConsensusShift ?? 0,
                      })
                    : null;
                  return (
                    <div
                      key={bill.id}
                      className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800/90 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-100 leading-snug">
                            DDL · {bill.title}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Promotore: <strong className="text-slate-200">{bill.sponsorAcronym ?? 'Maggioranza'}</strong> ·{' '}
                            {bill.weeksRemaining}{' '}
                            {bill.weeksRemaining === 1 ? 'settimana' : 'settimane'} al passaggio successivo
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-300 shrink-0">
                          In Aula
                        </span>
                      </div>

                      <LegislativeIterBar
                        stage={bill.stage}
                        navettaCount={bill.navettaCount}
                        navettaNote={bill.lastNavettaNote}
                      />

                      {forecast && <ParliamentaryGroupsBreakdown forecast={forecast} compact />}

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          disabled={streetActionDone}
                          onClick={() => onStreetMobilization?.(bill.id, 'ddl', 'pro')}
                          className={`py-2 px-2.5 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                            streetActionDone
                              ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                              : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/45 text-emerald-200 cursor-pointer'
                          }`}
                        >
                          <Megaphone className="w-3.5 h-3.5 shrink-0" />
                          <span>Presidio a Favore</span>
                        </button>
                        <button
                          type="button"
                          disabled={streetActionDone}
                          onClick={() => onStreetMobilization?.(bill.id, 'ddl', 'contro')}
                          className={`py-2 px-2.5 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                            streetActionDone
                              ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                              : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/45 text-rose-200 cursor-pointer'
                          }`}
                        >
                          <Hand className="w-3.5 h-3.5 shrink-0" />
                          <span>Piazza Contro</span>
                        </button>
                      </div>
                      {bill.playerFloorAction === 'piazza_pro' && (
                        <div className="text-[10px] text-emerald-300">
                          Presidio civico a favore già lanciato questa settimana.
                        </div>
                      )}
                      {bill.playerFloorAction === 'piazza_contro' && (
                        <div className="text-[10px] text-rose-300">
                          Mobilitazione di piazza contro questo DDL già lanciata questa settimana.
                        </div>
                      )}
                    </div>
                  );
                })}

                {activeDecrees.map((decree) => {
                  const law = PARLIAMENT_LAWS.find((l) => l.id === decree.lawId);
                  const forecast = law
                    ? forecastLawVote(state, law, {
                        amendmentShift: decree.amendmentConsensusShift ?? 0,
                      })
                    : null;
                  return (
                    <div
                      key={decree.id}
                      className="p-3.5 rounded-xl bg-[#090D16] border border-amber-500/35 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-100 leading-snug">
                            DL · {decree.title}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Decreto-Legge in conversione · Scade tra {decree.weeksRemaining} sett.
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-amber-300 shrink-0">
                          60 gg
                        </span>
                      </div>

                      <LegislativeIterBar
                        stage={decree.stage ?? 'camera'}
                        navettaCount={decree.navettaCount}
                      />

                      {forecast && <ParliamentaryGroupsBreakdown forecast={forecast} compact />}

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          disabled={streetActionDone}
                          onClick={() => onStreetMobilization?.(decree.id, 'dl', 'pro')}
                          className={`py-2 px-2.5 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                            streetActionDone
                              ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                              : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/45 text-emerald-200 cursor-pointer'
                          }`}
                        >
                          <Megaphone className="w-3.5 h-3.5 shrink-0" />
                          <span>Presidio a Favore</span>
                        </button>
                        <button
                          type="button"
                          disabled={streetActionDone}
                          onClick={() => onStreetMobilization?.(decree.id, 'dl', 'contro')}
                          className={`py-2 px-2.5 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                            streetActionDone
                              ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                              : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/45 text-rose-200 cursor-pointer'
                          }`}
                        >
                          <Hand className="w-3.5 h-3.5 shrink-0" />
                          <span>Piazza Contro</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <ReferendumPanel
            state={state}
            onPromoteAbrogative={(id) => onPromoteAbrogative?.(id)}
            onTriggerConstitutional={(lawId) => onTriggerConstitutional?.(lawId)}
            onBoostSignatures={() => onBoostRefSignatures?.()}
            onSetStance={(stance) => onSetRefStance?.(stance)}
            onFundCampaign={(tier) => onFundRefCampaign?.(tier)}
            onDismissConcluded={() => onDismissConcludedRef?.()}
          />
        </div>
      </div>
    );
  }

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
              ? 'Critico: drenaggio cassa e consenso'
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

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="text-xs font-mono tabular-nums bg-[#090D16] border border-slate-800 rounded-lg px-3 py-1.5">
            <span className="text-slate-400">Tensione d’Aula: </span>
            <span
              className={
                chamberTension >= 65
                  ? 'text-rose-400 font-bold'
                  : chamberTension >= 40
                    ? 'text-amber-400 font-bold'
                    : 'text-emerald-400 font-bold'
              }
            >
              {chamberTension}%
            </span>
          </div>

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

      {/* Composizione Parlamento & Gruppi Parlamentari in Carica */}
      <ParliamentCompositionCard state={state} seats={seats} />

      {/* Allarme Tensione d'Aula, Voto Segreto & Franchi Tiratori */}
      {(() => {
        const ft = state.lastFrancTireursEvent;
        const showUnresolvedFt = Boolean(ft && ft.wentUnder && !ft.resolved);
        const showRecentFt = Boolean(ft && state.week - ft.week <= 2);
        const lowAllySat = Object.values(state.allySatisfaction ?? {}).some((v) => v < 52);
        const showGovTensionAlert = isInGovernment && (chamberTension >= 48 || lowAllySat);
        if (!showUnresolvedFt && !showRecentFt && !showGovTensionAlert) return null;

        return (
          <section
            className={`rounded-xl p-4 border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
              showUnresolvedFt
                ? 'bg-rose-950/25 border-rose-500/55'
                : 'bg-amber-950/20 border-amber-500/45'
            }`}
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <ShieldAlert
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  showUnresolvedFt ? 'text-rose-400' : 'text-amber-400'
                }`}
              />
              <div className="min-w-0 space-y-1">
                <div className="text-xs font-bold text-slate-100 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span>
                    {showUnresolvedFt
                      ? 'GOVERNO SOTTO AL VOTO SEGRETO · FRANCHI TIRATORI IN AULA'
                      : showRecentFt && ft
                        ? `Allarme Franchi Tiratori (${ft.dateLabel})`
                        : 'Alta Tensione d’Aula · Rischio Franchi Tiratori al Voto Segreto'}
                  </span>
                  <span className="font-mono text-[11px] text-amber-300">
                    Tensione {chamberTension}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {ft && (showUnresolvedFt || showRecentFt)
                    ? ft.summary
                    : 'Con la tensione elevata o malumori tra gli alleati, i voti segreti su leggi sensibili possono generare defezioni anonime. Convoca un Vertice di Maggioranza per ricompattare i gruppi oppure blinda i testi con la Fiducia.'}
                </p>
              </div>
            </div>

            {isInGovernment && onRecompactMajority && (
              <button
                type="button"
                disabled={summitDone || state.budget < RECOMPACT_SUMMIT_COST}
                onClick={onRecompactMajority}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 shrink-0 transition-colors ${
                  summitDone || state.budget < RECOMPACT_SUMMIT_COST
                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    : showUnresolvedFt
                      ? 'bg-rose-500 hover:bg-rose-400 border-rose-400 text-slate-950 cursor-pointer'
                      : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/50 text-amber-200 cursor-pointer'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {summitDone
                    ? 'Vertice già tenuto (1/sett.)'
                    : `Vertice di Maggioranza (€${RECOMPACT_SUMMIT_COST.toLocaleString('it-IT')})`}
                </span>
              </button>
            )}
          </section>
        );
      })()}

      {/* Quirinale & Presidente della Repubblica (Ciclo Settennale) */}
      <section className="bg-[#111827] border border-slate-800/90 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Landmark className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-100 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>Quirinale · Presidente della Repubblica:</span>
              <span className="text-amber-300">{state.currentPresidentName || 'Sergio Mattarella'}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {state.quirinaleElection?.active
                ? `Seduta Comune convocata (Scrutinio #${state.quirinaleElection.ballotNumber}) · 658 Grandi Elettori`
                : `Scadenza mandato settennale tra ${weeksToQuirinale} settimane (Sett. ${state.quirinaleTermEndWeek ?? 36}) · 658 Grandi Elettori`}
            </div>
          </div>
        </div>
        {state.quirinaleElection?.active && onOpenQuirinale && (
          <button
            type="button"
            onClick={onOpenQuirinale}
            className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors"
          >
            <Landmark className="w-3.5 h-3.5 shrink-0" />
            <span>Apri Seduta Comune</span>
          </button>
        )}
      </section>

      {/* Iter Legislativo Visivo & Bicameralismo Paritario (DDL · Decreti-Legge · Legge di Bilancio) */}
      <section className="bg-[#111827] border border-cyan-500/35 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Iter Legislativo &amp; Bicameralismo Paritario (Camera ↔ Senato)</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Ogni provvedimento attraversa <strong>Commissione → Voto Camera → Voto Senato → Promulgazione Quirinale</strong>. Un emendamento al Senato può attivare la <strong>Navetta parlamentare</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-300 shrink-0">
            <span>{(state.pendingBills ?? []).length} DDL</span>
            <span className="text-slate-600">·</span>
            <span className="text-amber-300">{activeDecrees.length} DL</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300">
              {floorActionDone ? 'Azione Aula esaurita (1/sett.)' : 'Azione Aula pronta'}
            </span>
          </div>
        </div>

        {/* Legge di Bilancio (Manovra Annuale) — Iter Visivo */}
        {(isInGovernment || state.pendingBudgetLaw || (state.lastBudgetWeek ?? 0) > 0) && (() => {
          const weeksSinceBudget = state.week - (state.lastBudgetWeek ?? 0);
          const weeksToNextBudget = Math.max(0, 52 - weeksSinceBudget);
          const budgetStage: LegislativeStage = state.pendingBudgetLaw
            ? 'camera'
            : (state.lastBudgetWeek ?? 0) > 0
              ? 'promulgazione'
              : 'commissione';
          const budgetDone = !state.pendingBudgetLaw && (state.lastBudgetWeek ?? 0) > 0;
          return (
            <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800/90 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Legge di Bilancio (Manovra Annuale dello Stato)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {state.pendingBudgetLaw
                      ? 'Sessione di Bilancio aperta in Parlamento: approvazione richiesta dal Consiglio dei Ministri.'
                      : budgetDone
                        ? `Manovra promulgata (Sett. ${state.lastBudgetWeek}) · Prossima sessione di bilancio tra ${weeksToNextBudget} sett.`
                        : `In preparazione tecnica presso il MEF · Prossima sessione di bilancio tra ${weeksToNextBudget} sett.`}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border shrink-0 ${
                    state.pendingBudgetLaw
                      ? 'text-amber-300 border-amber-500/50 bg-amber-950/35'
                      : budgetDone
                        ? 'text-emerald-300 border-emerald-500/40 bg-emerald-950/30'
                        : 'text-slate-300 border-slate-700 bg-slate-900'
                  }`}
                >
                  {state.pendingBudgetLaw
                    ? 'IN SESSIONE'
                    : budgetDone
                      ? 'PROMULGATA'
                      : 'ISTRUTTORIA'}
                </span>
              </div>
              <LegislativeIterBar stage={budgetStage} completedAll={budgetDone} />
            </div>
          );
        })()}

        {/* DDL Ordinari in Discussione */}
        {(state.pendingBills ?? []).length === 0 ? (
          <div className="p-4 rounded-lg bg-[#090D16] border border-slate-800/80 text-center text-xs text-slate-400">
            Nessun Disegno di Legge attualmente in calendario. Presentane uno nella sezione sottostante o avanza di turno.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {(state.pendingBills ?? []).map((bill) => {
              const law = PARLIAMENT_LAWS.find((l) => l.id === bill.lawId);
              const forecast = law
                ? forecastLawVote(state, law, {
                    amendmentShift: bill.amendmentConsensusShift ?? 0,
                  })
                : null;
              const isAtQuirinale = bill.stage === 'promulgazione';
              const isPlayerSponsor = bill.promotedByPlayer !== false;

              return (
                <div
                  key={bill.id}
                  className={`p-3.5 rounded-xl bg-[#090D16] border space-y-3 ${
                    bill.blockedByAmendments
                      ? 'border-amber-500/60'
                      : isAtQuirinale
                        ? 'border-emerald-500/45'
                        : 'border-cyan-500/35'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 leading-snug">
                        DDL · {bill.title}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        Promotore: {bill.sponsorAcronym ?? (isPlayerSponsor ? player.acronym : 'Maggioranza')} ·{' '}
                        {isAtQuirinale
                          ? 'In firma al Quirinale (1 sett.)'
                          : `${bill.weeksRemaining} sett. al traguardo`}
                        {(bill.amendmentConsensusShift ?? 0) !== 0 && (
                          <span
                            className={
                              (bill.amendmentConsensusShift ?? 0) > 0
                                ? ' text-emerald-400'
                                : ' text-rose-400'
                            }
                          >
                            {' '}
                            · Emend. {(bill.amendmentConsensusShift ?? 0) > 0 ? '+' : ''}
                            {bill.amendmentConsensusShift}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-semibold shrink-0 px-2 py-0.5 rounded border ${
                        isAtQuirinale
                          ? 'text-emerald-300 border-emerald-500/45 bg-emerald-950/30'
                          : bill.blockedByAmendments
                            ? 'text-amber-300 border-amber-500/50 bg-amber-950/35'
                            : 'text-cyan-300 border-cyan-500/40 bg-cyan-950/30'
                      }`}
                    >
                      {isAtQuirinale
                        ? 'AL COLLE'
                        : bill.blockedByAmendments
                          ? `OSTRUZ. (${bill.hostileAmendmentsCount})`
                          : 'IN ITER'}
                    </span>
                  </div>

                  {/* Barra 4-step Commissione -> Camera -> Senato -> Promulgazione Quirinale + Navetta */}
                  <LegislativeIterBar
                    stage={bill.stage}
                    navettaCount={bill.navettaCount}
                    navettaNote={bill.lastNavettaNote}
                  />

                  {/* Orientamento Gruppi Parlamentari (Favorevoli / Indecisi / Astenuti / Contrari) + Franchi Tiratori */}
                  {forecast && <ParliamentaryGroupsBreakdown forecast={forecast} compact />}

                  {/* Azioni Parlamentari Attive sul DDL: Emendamento Costruttivo & Ostruzionismo */}
                  {!isAtQuirinale && onInterveneBill && (
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button
                        type="button"
                        disabled={floorActionDone}
                        onClick={() => onInterveneBill(bill.id, 'ddl', 'emendamento')}
                        title="Prova a modificare il testo in Aula: può essere accolto o respinto, migliora il profilo istituzionale e sposta voti favorevoli."
                        className={`py-1.5 px-2.5 rounded-md text-[11px] font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                          floorActionDone
                            ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                            : 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/45 text-cyan-200 cursor-pointer'
                        }`}
                      >
                        <FileEdit className="w-3 h-3 shrink-0" />
                        <span>Emendamento</span>
                      </button>

                      <button
                        type="button"
                        disabled={floorActionDone}
                        onClick={() => onInterveneBill(bill.id, 'ddl', 'ostruzionismo')}
                        title="Deposita decine di emendamenti ostruzionistici per rallentare l’iter, mobilitare la base elettorale e alzare lo scontro in Aula."
                        className={`py-1.5 px-2.5 rounded-md text-[11px] font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                          floorActionDone
                            ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                            : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/45 text-rose-200 cursor-pointer'
                        }`}
                      >
                        <Hand className="w-3 h-3 shrink-0" />
                        <span>Ostruzionismo</span>
                      </button>
                    </div>
                  )}

                  {bill.playerFloorAction && (
                    <div className="text-[10px] font-mono text-cyan-300/90">
                      {bill.playerFloorAction === 'emendamento_accolto' &&
                        'Ultimo atto: Emendamento costruttivo accolto in Aula.'}
                      {bill.playerFloorAction === 'emendamento_respinto' &&
                        'Ultimo atto: Emendamento respinto, profilo istituzionale apprezzato.'}
                      {bill.playerFloorAction === 'ostruzionismo' &&
                        'Ultimo atto: Ostruzionismo attivo — iter rallentato.'}
                    </div>
                  )}

                  {isInGovernment && !isAtQuirinale && onConfidencePendingBill && (
                    <button
                      type="button"
                      disabled={voteDone}
                      onClick={() => onConfidencePendingBill(bill.id)}
                      title="Blinda il testo a voto palese azzerando emendamenti ostili e rischio Franchi Tiratori, ma logora gli alleati e fa cadere il Governo se respinta."
                      className={`w-full py-1.5 px-2.5 rounded-md text-[11px] font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                        voteDone
                          ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                          : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/50 text-amber-200 cursor-pointer'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>
                        {voteDone
                          ? 'Voto d’Aula già svolto questa settimana'
                          : 'Poni Fiducia (Voto Palese · Azzerati Franchi Tiratori)'}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Decreti-Legge Attivi (Art. 77 Cost. · 60 giorni / 8 settimane) */}
      {(state.activeDecreeLaws ?? []).length > 0 && (
        <section className="bg-[#111827] border border-amber-500/45 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Decreti-Legge (Art. 77 Cost. · Conversione entro 60 giorni)</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                I Decreti-Legge entrano in vigore subito ma decadono retroattivamente se non convertiti da entrambe le Camere entro 8 settimane.
              </p>
            </div>
            <span className="text-[11px] font-mono text-amber-300 shrink-0">
              {activeDecrees.length} in conversione
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {[...(state.activeDecreeLaws ?? [])]
              .sort((a, b) => {
                const aActive = a.status === 'in_conversione' ? 0 : 1;
                const bActive = b.status === 'in_conversione' ? 0 : 1;
                return aActive - bActive;
              })
              .slice(0, 6)
              .map((decree) => {
                const approxDays = Math.max(0, Math.round(decree.weeksRemaining * 7.5));
                const urgent = decree.status === 'in_conversione' && decree.weeksRemaining <= 2;
                const law = PARLIAMENT_LAWS.find((l) => l.id === decree.lawId);
                const forecast =
                  decree.status === 'in_conversione' && law
                    ? forecastLawVote(state, law, {
                        amendmentShift: decree.amendmentConsensusShift ?? 0,
                      })
                    : null;
                const decStage: LegislativeStage =
                  decree.status === 'convertito'
                    ? 'promulgazione'
                    : decree.stage ??
                      (decree.weeksRemaining >= 6
                        ? 'commissione'
                        : decree.weeksRemaining >= 4
                          ? 'camera'
                          : 'senato');

                return (
                  <div
                    key={decree.id}
                    className={`p-3.5 rounded-xl bg-[#090D16] border space-y-3 ${
                      decree.status === 'decaduto'
                        ? 'border-rose-500/45'
                        : decree.status === 'convertito'
                          ? 'border-emerald-500/40'
                          : urgent
                            ? 'border-rose-500/60'
                            : 'border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-100 leading-snug">
                          DL · {decree.title}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {decree.status === 'in_conversione'
                            ? `Scade tra ${decree.weeksRemaining} sett. (~${approxDays} giorni)`
                            : decree.status === 'convertito'
                              ? `Convertito in legge${decree.confidenceUsed ? ' con Fiducia' : ''}`
                              : 'Decaduto dopo 60 giorni: effetti revocati'}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-semibold shrink-0 px-2 py-0.5 rounded border ${
                          decree.status === 'convertito'
                            ? 'text-emerald-300 border-emerald-500/40 bg-emerald-950/30'
                            : decree.status === 'decaduto'
                              ? 'text-rose-300 border-rose-500/40 bg-rose-950/30'
                              : urgent
                                ? 'text-rose-300 border-rose-500/50 bg-rose-950/40'
                                : 'text-amber-300 border-amber-500/40 bg-amber-950/30'
                        }`}
                      >
                        {decree.status === 'in_conversione'
                          ? urgent
                            ? 'URGENTE'
                            : 'IN AULA'
                          : decree.status === 'convertito'
                            ? 'LEGGE'
                            : 'DECADUTO'}
                      </span>
                    </div>

                    {decree.status !== 'decaduto' && (
                      <LegislativeIterBar
                        stage={decStage}
                        navettaCount={decree.navettaCount}
                        completedAll={decree.status === 'convertito'}
                      />
                    )}

                    {forecast && <ParliamentaryGroupsBreakdown forecast={forecast} compact />}

                    {decree.status === 'in_conversione' && onInterveneBill && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={floorActionDone}
                          onClick={() => onInterveneBill(decree.id, 'dl', 'emendamento')}
                          className={`py-1.5 px-2.5 rounded-md text-[11px] font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                            floorActionDone
                              ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                              : 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/45 text-cyan-200 cursor-pointer'
                          }`}
                        >
                          <FileEdit className="w-3 h-3 shrink-0" />
                          <span>Emendamento</span>
                        </button>
                        <button
                          type="button"
                          disabled={floorActionDone}
                          onClick={() => onInterveneBill(decree.id, 'dl', 'ostruzionismo')}
                          className={`py-1.5 px-2.5 rounded-md text-[11px] font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                            floorActionDone
                              ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                              : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/45 text-rose-200 cursor-pointer'
                          }`}
                        >
                          <Hand className="w-3 h-3 shrink-0" />
                          <span>Ostruzionismo</span>
                        </button>
                      </div>
                    )}

                    {decree.status === 'in_conversione' && onConvertDecree && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                        <button
                          type="button"
                          disabled={voteDone}
                          onClick={() => onConvertDecree(decree.id, false)}
                          className={`py-1.5 px-2.5 rounded-md text-[11px] font-semibold border transition-colors ${
                            voteDone
                              ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                              : 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/45 text-cyan-200 cursor-pointer'
                          }`}
                        >
                          {voteDone ? 'Voto già svolto (1/sett.)' : 'Converti in Legge (1/sett.)'}
                        </button>
                        {isInGovernment && (
                          <button
                            type="button"
                            disabled={voteDone}
                            onClick={() => onConvertDecree(decree.id, true)}
                            title="Aumenta i voti della maggioranza e disinnesca il voto segreto, ma se bocciata fa cadere il Governo."
                            className={`py-1.5 px-2.5 rounded-md text-[11px] font-semibold border flex items-center justify-center gap-1 transition-colors ${
                              voteDone
                                ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/50 text-amber-200 cursor-pointer'
                            }`}
                          >
                            <Flame className="w-3 h-3 shrink-0" />
                            <span>
                              {voteDone ? 'Voto già svolto' : 'Converti con Fiducia (1/sett.)'}
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </section>
      )}

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
                  ? 'Monitora l’affinità dei tuoi ministri e la fiducia degli alleati: usa Rimpasto (1/sett.) per cambiare dirigente o cedere un dicastero.'
                  : 'Composizione attuale degli 8 Ministeri Chiave della maggioranza e affinità dei tuoi dirigenti al Governo.'}
              </p>
            </div>
          </div>

          {/* Griglia 8 Ministeri Chiave */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {KEY_MINISTRIES.map((ministry) => {
              const holderId = state.governmentMinistries[ministry.id];
              const holder = state.parties.find((p) => p.id === holderId);
              const isPlayerHeld = holderId === state.playerPartyId;
              const assignedExecId = state.governmentMinistryExecutives?.[ministry.id];
              const assignedExec = isPlayerHeld
                ? state.executives.find((e) => e.id === assignedExecId)
                : undefined;
              const affinity = isPlayerHeld
                ? evaluateExecutiveMinistryAffinity(assignedExec, ministry.id)
                : null;
              const isReshuffling = reshuffleMinistryId === ministry.id;
              const canPartyReshuffle =
                state.isPrimeMinister && cabinetEvaluation.coalitionParties.length > 1;
              const isVacantPlayerMinistry = isPlayerHeld && !assignedExec;
              const canExecSwap =
                isPlayerHeld &&
                (state.isPrimeMinister || state.governmentRole === 'governo') &&
                (state.executives.length > 1 || (isVacantPlayerMinistry && state.executives.length > 0));
              const canOpenReshuffle = canPartyReshuffle || canExecSwap;

              return (
                <div
                  key={ministry.id}
                  className={`p-3 rounded-lg bg-[#090D16] border flex flex-col justify-between gap-2.5 ${
                    isVacantPlayerMinistry
                      ? 'border-amber-500/65'
                      : affinity?.level === 'fuori_ruolo'
                        ? 'border-rose-500/50'
                        : affinity?.level === 'affine'
                          ? 'border-emerald-500/35'
                          : 'border-slate-800/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 whitespace-normal leading-snug break-words">
                        {ministry.shortName}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                        Peso {ministry.weight.toFixed(1)} · Spec.{' '}
                        {getSpecializationLabel(ministry.requiredSpecialization)}
                      </div>
                    </div>

                    {canOpenReshuffle && (
                      <button
                        type="button"
                        onClick={() =>
                          setReshuffleMinistryId(isReshuffling ? null : ministry.id)
                        }
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 border transition-colors shrink-0 cursor-pointer ${
                          isReshuffling || isVacantPlayerMinistry
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-[#111827] hover:bg-slate-800 border-slate-700 text-slate-200'
                        }`}
                      >
                        <ArrowLeftRight className="w-3 h-3 shrink-0" />
                        <span>
                          {isVacantPlayerMinistry
                            ? 'Assegna'
                            : canPartyReshuffle
                              ? 'Rimpasto'
                              : 'Ministro'}
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
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
                            <div className="text-xs font-semibold text-slate-200 whitespace-normal leading-snug break-words">
                              {holder.name} ({holder.acronym})
                            </div>
                            <div
                              className={`text-[10px] whitespace-normal leading-snug break-words ${
                                isVacantPlayerMinistry
                                  ? 'text-amber-300 font-semibold'
                                  : 'text-slate-400'
                              }`}
                            >
                              {isPlayerHeld && assignedExec
                                ? `${assignedExec.name} · ${getSpecializationLabel(assignedExec.specialization)}`
                                : isVacantPlayerMinistry
                                  ? 'Casella vacante (dimissioni) · Assegna Ministro'
                                  : `Quota ${holder.leaderName}`}
                            </div>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-slate-500">Non assegnato</span>
                      )}
                    </div>

                    {isPlayerHeld && affinity && (
                      <div
                        className={`p-2 rounded-md border text-[10px] leading-snug space-y-0.5 ${
                          affinity.level === 'affine'
                            ? 'bg-emerald-950/25 border-emerald-500/35 text-emerald-200'
                            : affinity.level === 'parziale'
                              ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                              : 'bg-rose-950/30 border-rose-500/45 text-rose-200'
                        }`}
                      >
                        <div className="font-semibold flex items-center justify-between gap-1">
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3 shrink-0" />
                            <span>{affinity.label}</span>
                          </span>
                          <span className="font-mono">
                            {affinity.level === 'affine'
                              ? 'Bonus efficienza'
                              : affinity.level === 'fuori_ruolo'
                                ? 'Malus credibilità'
                                : 'Ordinario'}
                          </span>
                        </div>
                        <div className="text-[10px] opacity-85">{affinity.effectSummary}</div>
                      </div>
                    )}
                  </div>

                  {/* Selettore inline Rimpasto (Cambio Ministro del partito e/o Cambio Partito coalizione) */}
                  {isReshuffling && canOpenReshuffle && (
                    <div className="pt-2 border-t border-slate-800 space-y-2.5">
                      {canExecSwap && (
                        <div className="space-y-1.5">
                          <div className="text-[10px] text-cyan-300 font-medium">
                            {reshuffleDone
                              ? 'Rimpasto già eseguito questa settimana'
                              : `Cambia dirigente su ${ministry.shortName} (1/sett.):`}
                          </div>
                          <div className="space-y-1">
                            {state.executives
                              .filter((ex) => ex.id !== assignedExecId)
                              .map((ex) => {
                                const exAff = evaluateExecutiveMinistryAffinity(ex, ministry.id);
                                const affColor =
                                  exAff.level === 'affine'
                                    ? 'text-emerald-400'
                                    : exAff.level === 'parziale'
                                      ? 'text-amber-300'
                                      : 'text-rose-400';
                                return (
                                  <button
                                    key={ex.id}
                                    type="button"
                                    disabled={reshuffleDone}
                                    onClick={() => {
                                      onReshuffleMinistry(ministry.id, state.playerPartyId, ex.id);
                                      setReshuffleMinistryId(null);
                                    }}
                                    className={`w-full px-2 py-1.5 rounded-md text-left text-[10px] border flex items-center justify-between gap-2 transition-colors ${
                                      !reshuffleDone
                                        ? 'bg-[#111827] hover:bg-slate-800 border-slate-700 hover:border-cyan-400 text-slate-100 cursor-pointer'
                                        : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                                    }`}
                                  >
                                    <span className="truncate">
                                      <strong className="font-semibold">{ex.name}</strong> ·{' '}
                                      {getSpecializationLabel(ex.specialization)}
                                    </span>
                                    <span className={`font-semibold shrink-0 ${affColor}`}>
                                      {exAff.shortBadge}
                                    </span>
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {canPartyReshuffle && (
                        <div className="space-y-1.5">
                          <div className="text-[10px] text-amber-300 font-medium">
                            {reshuffleDone
                              ? 'Rimpasto già eseguito questa settimana'
                              : `Cedi ${ministry.shortName} a partito coalizione (1/sett.):`}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {cabinetEvaluation.coalitionParties
                              .filter((cp) => cp.id !== holderId)
                              .map((cp) => (
                                <button
                                  key={cp.id}
                                  type="button"
                                  disabled={reshuffleDone}
                                  onClick={() => {
                                    onReshuffleMinistry(ministry.id, cp.id);
                                    setReshuffleMinistryId(null);
                                  }}
                                  className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 border transition-colors ${
                                    !reshuffleDone
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
                        <span className="font-semibold text-slate-200 whitespace-normal leading-snug break-words">
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
                  { id: 'azione_aula', label: 'Question Time & Mozioni' },
                  { id: 'commissioni', label: 'Commissioni d’Inchiesta' },
                  { id: 'referendum', label: 'Referendum Art. 75/138' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategory(tab.id)}
                  className={`px-2.5 py-1.5 text-[11px] font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                    category === tab.id
                      ? tab.id === 'costituzionale'
                        ? 'bg-rose-500/20 text-rose-300'
                        : tab.id === 'azione_aula'
                          ? 'bg-emerald-500/20 text-emerald-200'
                          : tab.id === 'commissioni'
                            ? 'bg-amber-500/20 text-amber-200'
                            : tab.id === 'referendum'
                              ? 'bg-cyan-500/20 text-cyan-200'
                              : 'bg-slate-800 text-slate-50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.id === 'commissioni' && (state.activeCommissions ?? []).length > 0 && (
                    <span className="font-mono text-[10px] text-amber-300">
                      ({(state.activeCommissions ?? []).length})
                    </span>
                  )}
                  {tab.id === 'referendum' && hasRefAlert && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {category === 'referendum' ? (
            <ReferendumPanel
              state={state}
              onPromoteAbrogative={(id) => onPromoteAbrogative?.(id)}
              onTriggerConstitutional={(lawId) => onTriggerConstitutional?.(lawId)}
              onBoostSignatures={() => onBoostRefSignatures?.()}
              onSetStance={(stance) => onSetRefStance?.(stance)}
              onFundCampaign={(tier) => onFundRefCampaign?.(tier)}
              onDismissConcluded={() => onDismissConcludedRef?.()}
            />
          ) : category === 'azione_aula' ? (
            <div className="space-y-5">
              {/* Question Time & Interrogazioni Parlamentari */}
              <div className="p-4 rounded-xl bg-[#090D16] border border-emerald-500/35 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <Mic className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Question Time &amp; Interrogazioni Parlamentari (
                        {isInGovernment ? 'Rivendicazione Esecutivo' : 'Attacco Opposizione'})
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isInGovernment
                        ? 'In diretta TV su Rai Parlamento, rivendica i risultati del Governo su un dicastero chiave per rafforzare gradimento e visibilità.'
                        : 'Incalza un Ministro del Governo in diretta TV su un tema caldo per strappare titoli stampa, gradimento e consenso.'}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300 shrink-0">
                    {qtCooldownLeft > 0
                      ? `Disponibile tra ${qtCooldownLeft} sett.`
                      : 'Pronto (ogni 2 sett.)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-300 block">
                      1. Tema dell’Interrogazione
                    </label>
                    <select
                      value={qtTopicId}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        setQtTopicId(nextId);
                        const found = QUESTION_TIME_TOPICS.find((t) => t.id === nextId);
                        if (found) setQtMinistryId(found.ministryId);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-400"
                    >
                      {QUESTION_TIME_TOPICS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-300 block">
                      2. Ministero Interpellato
                    </label>
                    <select
                      value={qtMinistryId}
                      onChange={(e) => setQtMinistryId(e.target.value as MinistryId)}
                      className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-400"
                    >
                      {KEY_MINISTRIES.map((m) => {
                        const holderId = state.governmentMinistries[m.id];
                        const holder = state.parties.find((p) => p.id === holderId);
                        return (
                          <option key={m.id} value={m.id}>
                            {m.shortName} {holder ? `(${holder.acronym})` : '(Governo)'}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {(() => {
                  const selectedTopic =
                    QUESTION_TIME_TOPICS.find((t) => t.id === qtTopicId) ??
                    QUESTION_TIME_TOPICS[0];
                  return (
                    <div className="p-2.5 rounded-lg bg-[#111827] border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                      <strong className="text-emerald-300">Linea d’intervento:</strong>{' '}
                      {isInGovernment
                        ? selectedTopic.governmentAngle
                        : selectedTopic.oppositionAngle}
                    </div>
                  );
                })()}

                <button
                  type="button"
                  disabled={qtCooldownLeft > 0}
                  onClick={() => onQuestionTime?.(qtMinistryId, qtTopicId)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                    qtCooldownLeft > 0
                      ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-400 border-emerald-400 text-slate-950 cursor-pointer'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {qtCooldownLeft > 0
                      ? `Question Time in pausa (${qtCooldownLeft} sett.)`
                      : isInGovernment
                        ? 'Rivendica i Risultati dell’Esecutivo in Diretta TV'
                        : 'Incalza il Ministro al Question Time (Diretta TV)'}
                  </span>
                </button>
              </div>

              {/* Mozioni & Ordini del Giorno (OdG) */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Mozioni &amp; Ordini del Giorno (OdG)</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Atti di indirizzo su temi altamente divisivi: mettono in difficoltà la maggioranza o costringono i rivali a scoprirsi al voto palese.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300 shrink-0">
                    {motionCooldownLeft > 0
                      ? `Disponibile tra ${motionCooldownLeft} sett.`
                      : 'Pronto (ogni 2 sett.)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PARLIAMENTARY_MOTIONS.map((motion) => (
                    <article
                      key={motion.id}
                      className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800/90 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-100 leading-snug">
                            {motion.title}
                          </h4>
                          <span className="text-[10px] font-mono uppercase text-cyan-300 shrink-0">
                            {motion.kind === 'mozione' ? 'Mozione' : 'OdG'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {motion.description}
                        </p>
                        <div className="text-[10px] font-mono text-amber-300/90">
                          Tensione d’Aula +{motion.tensionDelta}% · Voto palese sui gruppi
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={motionCooldownLeft > 0}
                        onClick={() => onProposeMotion?.(motion.id)}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                          motionCooldownLeft > 0
                            ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                            : 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/45 text-cyan-200 cursor-pointer'
                        }`}
                      >
                        <Gavel className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {motionCooldownLeft > 0
                            ? `Attendi ${motionCooldownLeft} sett.`
                            : `Porta ${motion.kind === 'mozione' ? 'Mozione' : 'OdG'} al Voto`}
                        </span>
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          ) : category === 'commissioni' ? (
            <div className="space-y-4">
              {/* Active Commissions */}
              {(state.activeCommissions ?? []).length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <FileSearch className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Commissioni d’Inchiesta Attive ({(state.activeCommissions ?? []).length}/2)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(state.activeCommissions ?? []).map((comm) => {
                      const donePct = Math.min(
                        100,
                        Math.round(
                          ((comm.durationWeeks - comm.weeksRemaining) /
                            Math.max(1, comm.durationWeeks)) *
                            100
                        )
                      );
                      return (
                        <div
                          key={comm.id}
                          className={`p-3.5 rounded-xl bg-[#090D16] border space-y-2 ${
                            comm.promotedByPlayer ? 'border-amber-500/40' : 'border-rose-500/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 min-w-0">
                              <span
                                className={`inline-block text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${
                                  comm.promotedByPlayer
                                    ? 'text-cyan-300 border-cyan-500/40 bg-cyan-950/30'
                                    : 'text-rose-300 border-rose-500/45 bg-rose-950/35'
                                }`}
                              >
                                {comm.promotedByPlayer
                                  ? `Promossa da ${comm.sponsorPartyName || player.acronym}`
                                  : `Iniziativa Opposizione · ${comm.sponsorPartyName || 'Opposizioni'}`}
                              </span>
                              <div className="text-xs font-bold text-slate-100 leading-snug">
                                {comm.title}
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-amber-300 shrink-0">
                              -{comm.weeksRemaining} sett.
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-1">
                            <span>Area: {comm.targetArea} · Audizioni in corso</span>
                            {typeof comm.mediaPressure === 'number' && (
                              <span className="font-mono text-[10px] text-amber-300">
                                Pressione media {comm.mediaPressure}%
                              </span>
                            )}
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                comm.promotedByPlayer ? 'bg-amber-400' : 'bg-rose-400'
                              }`}
                              style={{ width: `${Math.max(12, donePct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Available Inquiry Commission Topics */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-200">
                    Istituisci Commissione Parlamentare d’Inchiesta (Art. 82 Cost.)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Costo: €{INQUIRY_COMMISSION_COST.toLocaleString('it-IT')} · Max 2 attive (1/sett.)
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {INQUIRY_COMMISSION_TOPICS.map((topic) => {
                    const alreadyActive = (state.activeCommissions ?? []).some(
                      (c) => c.topicId === topic.id
                    );
                    const maxReached = (state.activeCommissions ?? []).length >= 2;
                    const disabled =
                      alreadyActive ||
                      maxReached ||
                      inquiryDone ||
                      state.budget < INQUIRY_COMMISSION_COST;

                    return (
                      <article
                        key={topic.id}
                        className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800/90 flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-xs font-bold text-slate-100 leading-snug">
                              {topic.title}
                            </h3>
                            <span className="text-[10px] font-mono text-cyan-300 shrink-0">
                              {topic.durationWeeks} sett.
                            </span>
                          </div>
                          <div className="text-[10px] font-medium text-amber-300">
                            {topic.targetArea}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {topic.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => onLaunchCommission?.(topic.id)}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                            alreadyActive
                              ? 'bg-amber-950/30 border-amber-500/35 text-amber-300 cursor-default'
                              : disabled
                                ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/45 text-cyan-200 cursor-pointer'
                          }`}
                        >
                          <FileSearch className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {alreadyActive
                              ? 'Commissione già attiva'
                              : inquiryDone
                                ? 'Iniziativa già avviata questa settimana'
                                : `Istituisci Commissione (€${INQUIRY_COMMISSION_COST.toLocaleString('it-IT')})`}
                          </span>
                        </button>
                      </article>
                    );
                  })}
                </div>
              </div>

              {/* Concluded Reports Archive */}
              {(state.commissionHistory ?? []).length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <ScrollText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Archivio Relazioni Conclusive</span>
                  </div>
                  <div className="space-y-2">
                    {(state.commissionHistory ?? []).slice(0, 6).map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-lg bg-[#090D16] border border-slate-800 space-y-1"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-slate-100">
                            {c.reportHeadline || c.title}
                          </span>
                          {typeof c.pollImpact === 'number' && (
                            <span
                              className={`font-mono text-[11px] shrink-0 ${
                                c.pollImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {c.pollImpact >= 0 ? '+' : ''}
                              {c.pollImpact.toFixed(1)}% consenso
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {c.promotedByPlayer
                            ? `Promossa da ${c.sponsorPartyName || player.acronym}`
                            : `Promossa da Opposizione (${c.sponsorPartyName || 'Opposizioni'})`}
                        </div>
                        {c.reportSummary && (
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {c.reportSummary}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredLaws.map((law) => {
              const forecast = forecastLawVote(state, law);
              const isEnacted =
                law.category === 'elettorale'
                  ? state.electoralLaw === law.electoralLawChange
                  : state.enactedLawIds.includes(law.id);
              const isPendingBill = (state.pendingBills ?? []).some((b) => b.lawId === law.id);
              const cost = law.budgetDelta < 0 ? Math.abs(law.budgetDelta) : 0;
              const cannotAfford = cost > state.budget;
              const isCoup = law.id === 'law_pieni_poteri';
              const disabled = isEnacted || isPendingBill || voteDone || cannotAfford;

              return (
                <article
                  key={law.id}
                  className={`p-3.5 rounded-xl bg-[#090D16] border flex flex-col justify-between gap-3 ${
                    isEnacted
                      ? 'border-emerald-500/45'
                      : isPendingBill
                        ? 'border-cyan-500/45'
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
                      ) : isPendingBill ? (
                        <span className="text-[11px] font-mono text-cyan-300 flex items-center gap-1 shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                          In iter DDL
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

                    {/* Live Chamber Vote Projection & Parliamentary Groups Breakdown */}
                    {!isEnacted && (
                      <div className="p-2.5 rounded-lg bg-[#111827] border border-slate-800/80 space-y-2 text-[11px]">
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

                        <ParliamentaryGroupsBreakdown forecast={forecast} compact />

                        <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/70 text-[10px]">
                          <span className="text-slate-400">Veto Quirinale (Art. 74)</span>
                          <span
                            className={`font-mono ${
                              forecast.quirinaleVetoChance >= 45
                                ? 'text-rose-400'
                                : forecast.quirinaleVetoChance >= 20
                                  ? 'text-amber-400'
                                  : 'text-slate-400'
                            }`}
                          >
                            Rischio {forecast.quirinaleVetoChance}%
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

                  {/* Instrument Selector (DDL vs Decreto-Legge 60gg) & Confidence Vote when in Government */}
                  {!isEnacted &&
                    !isPendingBill &&
                    isInGovernment &&
                    state.regimeStatus !== 'regime_autoritario' &&
                    law.category !== 'costituzionale' && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#111827] border border-slate-800 text-[10px]">
                          {(
                            [
                              { id: 'ddl', label: 'DDL Ordinario (4 sett.)' },
                              { id: 'dl', label: 'Decreto-Legge (60 gg)' },
                            ] as const
                          ).map((opt) => {
                            const selectedInst = lawInstrumentMap[law.id] ?? 'ddl';
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() =>
                                  setLawInstrumentMap((prev) => ({ ...prev, [law.id]: opt.id }))
                                }
                                className={`flex-1 py-1 px-2 rounded-md font-medium transition-colors cursor-pointer ${
                                  selectedInst === opt.id
                                    ? opt.id === 'dl'
                                      ? 'bg-amber-500/20 text-amber-300'
                                      : 'bg-slate-800 text-slate-100'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400 leading-snug px-0.5">
                          {(lawInstrumentMap[law.id] ?? 'ddl') === 'dl'
                            ? 'Entra subito in vigore, ma scade in 60 giorni (8 sett.) se non convertito.'
                            : 'Iter bicamerale completo (Commissione → Camera → Senato → Quirinale, 4 sett.), zero logoramento coalizione.'}
                        </div>
                      </div>
                    )}

                  {(() => {
                    const selectedInstrument: LegislativeInstrument =
                      isInGovernment && law.category !== 'costituzionale'
                        ? lawInstrumentMap[law.id] ?? 'ddl'
                        : 'ddl';
                    const canPutConfidence =
                      !isEnacted &&
                      !isPendingBill &&
                      isInGovernment &&
                      state.regimeStatus !== 'regime_autoritario' &&
                      selectedInstrument === 'ddl' &&
                      law.category !== 'costituzionale';

                    return (
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => onVoteLaw(law.id, selectedInstrument, false)}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                            isEnacted
                              ? 'bg-emerald-950/30 border-emerald-500/35 text-emerald-400 cursor-default'
                              : isPendingBill
                                ? 'bg-cyan-950/30 border-cyan-500/35 text-cyan-300 cursor-default'
                                : disabled
                                  ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                                  : isCoup
                                    ? 'bg-rose-600 hover:bg-rose-500 border-rose-500 text-white cursor-pointer'
                                    : selectedInstrument === 'dl'
                                      ? 'bg-amber-500 hover:bg-amber-400 border-amber-400 text-slate-950 cursor-pointer'
                                      : forecast.willPass
                                        ? 'bg-cyan-500 hover:bg-cyan-400 border-cyan-400 text-slate-950 cursor-pointer'
                                        : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 cursor-pointer'
                          }`}
                        >
                          <Gavel className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {isEnacted
                              ? 'Provvedimento in Vigore'
                              : isPendingBill
                                ? 'DDL già in Iter Parlamentare'
                                : voteDone
                                  ? 'Voto d’Aula già svolto (1/sett.)'
                                  : state.regimeStatus === 'regime_autoritario'
                                    ? 'Emana per Decreto (1/sett.)'
                                    : selectedInstrument === 'dl'
                                      ? 'Emana Decreto-Legge · 60 gg (1/sett.)'
                                      : isInGovernment && law.category !== 'costituzionale'
                                        ? 'Avvia Iter DDL Ordinario (1/sett.)'
                                        : forecast.willPass
                                          ? 'Vota DDL in Aula · Passa (1/sett.)'
                                          : 'Vota DDL in Aula · Minoranza (1/sett.)'}
                          </span>
                        </button>

                        {canPutConfidence && (
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onVoteLaw(law.id, 'ddl', true)}
                            title="Blinda la maggioranza (+voti) saltando gli emendamenti ostili, ma logora gli alleati, alza la tensione con le opposizioni e fa cadere il Governo se respinta."
                            className={`w-full py-1.5 px-3 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                              disabled
                                ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-amber-950/30 hover:bg-amber-950/55 border-amber-500/45 text-amber-200 cursor-pointer'
                            }`}
                          >
                            <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>
                              {voteDone
                                ? 'Voto d’Aula già svolto questa settimana'
                                : 'Vota con Questione di Fiducia (1/sett. · rischio caduta)'}
                            </span>
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </article>
              );
            })}
          </div>
          )}
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

          {/* Attività d'Aula Recente (Question Time, Mozioni, Emendamenti, Vertici) */}
          {(state.parliamentaryActionHistory ?? []).length > 0 && (
            <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-2.5">
              <h3 className="text-sm font-semibold text-slate-100 pb-2 border-b border-slate-800">
                Cronaca Attività d’Aula
              </h3>
              <div className="space-y-2 max-h-[260px] overflow-y-auto war-scroll pr-1">
                {(state.parliamentaryActionHistory ?? []).slice(0, 8).map((act) => {
                  const outcomeCls =
                    act.outcome === 'successo'
                      ? 'text-emerald-400'
                      : act.outcome === 'respinto'
                        ? 'text-rose-400'
                        : 'text-amber-300';
                  const kindLabel: Record<typeof act.kind, string> = {
                    question_time: 'Question Time',
                    mozione: 'Mozione / OdG',
                    emendamento: 'Emendamento',
                    ostruzionismo: 'Ostruzionismo',
                    piazza: 'Piazza',
                    vertice: 'Vertice',
                  };
                  return (
                    <div
                      key={act.id}
                      className="p-2.5 rounded-lg bg-[#090D16] border border-slate-800/80 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2 text-[10px]">
                        <span className={`font-semibold ${outcomeCls}`}>
                          {kindLabel[act.kind]}
                        </span>
                        <span className="font-mono text-slate-500">{act.dateLabel}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-100 leading-snug">
                        {act.title}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{act.summary}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

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
                      {rec.secretBallot && (
                        <div className="text-[10px] font-mono text-rose-300">
                          Voto Segreto · Franchi Tiratori (-{rec.francTireursCamera ?? 0} Cam / -
                          {rec.francTireursSenato ?? 0} Sen)
                        </div>
                      )}
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

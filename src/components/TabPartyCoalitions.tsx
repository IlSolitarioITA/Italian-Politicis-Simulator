import React, { useMemo, useState } from 'react';
import { getSpecializationLabel } from '../data/ministries';
import { LEADER_TRAITS, LEADERSHIP_STYLES } from '../data/presets';
import { ITALIAN_REGIONS } from '../data/italyRegions';
import {
  BANCHETTO_SIGNATURE_COST,
  COALITION_ACTION_COSTS,
  CONGRESS_COOLDOWN_WEEKS,
  EXECUTIVE_ACTION_COSTS,
  FUNDRAISER_EVENT_COOLDOWN_WEEKS,
  MAX_BANCHETTI_PER_WEEK,
  MEMBERSHIP_CAMPAIGN_COOLDOWN_WEEKS,
  PARTY_INVESTMENT_COSTS,
  PRIVATE_POLL_COOLDOWN_WEEKS,
  SCHISM_MIN_POLL,
  SCHISM_REQUIRED_WEEKS,
  SPIN_DOCTOR_WEEKLY_UPKEEP,
  THINK_TANK_WEEKLY_UPKEEP,
  TV_CAMPAIGN_DURATION_WEEKS,
  TWO_PER_THOUSAND_COOLDOWN_WEEKS,
  calculatePartyCohesion,
  calculateWeeklyPartyFinances,
  calculateWeeklySignatureGain,
  computeIdeologicalCompatibility,
  estimateEmergencyVolunteerFundraiser,
  estimateFundraiserRevenue,
  estimateMembershipCampaign,
  estimateTwoPerThousandQuota,
  getActiveTraitProfile,
  getBudgetHealthStatus,
  getCurrentParliamentSeats,
  getPartyInvestments,
  getSpinDoctorNextUpgradeCost,
  isPartyCohesionCritical,
  previewBanchettoSignatureGain,
  syncBallotSignatureExemption,
} from '../engine/simulation';
import {
  BallotElectionType,
  GameState,
  PartyInvestmentActionId,
  RegionId,
} from '../types/game';
import { PartyEmblem } from './PartyEmblem';
import { LeaderAvatar } from './LeaderAvatar';
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Coins,
  FileSignature,
  Flag,
  Gavel,
  Handshake,
  Landmark,
  Megaphone,
  MessageSquare,
  Receipt,
  RefreshCw,
  Shield,
  Sparkles,
  Swords,
  Tv,
  UserX,
  Users,
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
  onChangeBallotType?: (electionType: BallotElectionType, regionId?: RegionId) => void;
  onOrganizeBanchetto?: (regionId?: RegionId) => void;
  onLaunchMembership?: () => void;
  onClaimTwoPerThousand?: () => void;
  onHostFundraiser?: (kind: 'donazioni' | 'cena') => void;
  onEmergencyFundraiser?: () => void;
  onResolveScandal?: (decision: 'difendi' | 'dimissioni') => void;
  onExecutePartyInvestment?: (actionId: PartyInvestmentActionId) => void;
}

export const TabPartyCoalitions: React.FC<TabPartyCoalitionsProps> = ({
  state,
  onManageExecutive,
  onNegotiateCoalition,
  onChangeBallotType,
  onOrganizeBanchetto,
  onLaunchMembership,
  onClaimTwoPerThousand,
  onHostFundraiser,
  onEmergencyFundraiser,
  onResolveScandal,
  onExecutePartyInvestment,
}) => {
  const player = state.parties.find((p) => p.id === state.playerPartyId)!;
  const ballot = useMemo(() => syncBallotSignatureExemption(state), [state]);
  const [selectedBanchettoRegion, setSelectedBanchettoRegion] = useState<RegionId>(
    () => ballot.targetRegionId ?? state.openHeadquarters[0] ?? 'lazio'
  );
  const weeklySigGain = useMemo(() => calculateWeeklySignatureGain(state), [state]);
  const banchettoPreview = useMemo(
    () => previewBanchettoSignatureGain(state, selectedBanchettoRegion),
    [state, selectedBanchettoRegion]
  );
  const seats = useMemo(() => getCurrentParliamentSeats(state), [state]);
  const traitProfile = useMemo(() => getActiveTraitProfile(state), [state]);
  const weeklyFinances = useMemo(() => calculateWeeklyPartyFinances(state), [state]);
  const budgetHealth = useMemo(() => getBudgetHealthStatus(state), [state]);
  const emergencyFundEst = useMemo(() => estimateEmergencyVolunteerFundraiser(state), [state]);
  const partyInv = useMemo(() => getPartyInvestments(state), [state]);
  const nextSpinDoctorCost = getSpinDoctorNextUpgradeCost(partyInv.spinDoctorLevel);
  const congressCooldownLeft = Math.max(
    0,
    CONGRESS_COOLDOWN_WEEKS - (state.week - partyInv.lastCongressWeek)
  );
  const privatePollCooldownLeft = Math.max(
    0,
    PRIVATE_POLL_COOLDOWN_WEEKS - (state.week - partyInv.lastPrivatePollWeek)
  );

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
        {/* Left (6 cols): Scandal Alert + Leader Profile + Transparent Fundraising + Executives */}
        <div className="xl:col-span-6 space-y-4 min-w-0">
          {/* Active Executive / Minister Judicial Scandal Alert */}
          {state.activeScandal && onResolveScandal && (
            <section className="bg-rose-950/35 border border-rose-500/60 rounded-xl p-4 space-y-3 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-300 shrink-0 mt-0.5">
                  <Gavel className="w-4 h-4" />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-rose-300">
                    Allerta Indagine · {state.activeScandal.severity} · {state.activeScandal.execRoleLabel}
                  </div>
                  <h3 className="text-sm font-bold text-slate-50 leading-snug">
                    {state.activeScandal.title}
                  </h3>
                  <p className="text-xs text-rose-100/90 leading-relaxed">
                    {state.activeScandal.summary}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => onResolveScandal('difendi')}
                  className="p-2.5 rounded-lg bg-[#090D16] hover:bg-slate-900 border border-amber-500/50 text-left cursor-pointer transition-colors space-y-1"
                >
                  <div className="text-xs font-semibold text-amber-200">
                    Difendi a oltranza (Linea garantista)
                  </div>
                  <div className="text-[10px] text-slate-400 leading-snug">
                    Mantiene coesione interna (+lealtà dirigenza), ma rischia forte calo di credibilità e attacchi media.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onResolveScandal('dimissioni')}
                  className="p-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 border border-rose-400 text-left cursor-pointer transition-colors space-y-1"
                >
                  <div className="text-xs font-semibold text-white">
                    Chiedi dimissioni / sospensione
                  </div>
                  <div className="text-[10px] text-rose-100/90 leading-snug">
                    Salva la reputazione pubblica, ma riduce la coesione interna e libera la casella da riassegnare.
                  </div>
                </button>
              </div>
            </section>
          )}

          {/* Leader Summary Card */}
          <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center -space-x-2 shrink-0">
                  <PartyEmblem
                    emblem={player.emblem}
                    color={player.color}
                    customUrl={player.customEmblemUrl}
                    size={42}
                  />
                  <LeaderAvatar
                    name={state.leader.name}
                    color={player.color}
                    partyAcronym={player.acronym}
                    size={38}
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-50 leading-snug">
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
                title="+€250/settimana per ogni deputato o senatore eletto (€0 se 0 parlamentari)"
              >
                <div className="text-slate-400 truncate">
                  Parlamentari ({weeklyFinances.electedSeats})
                </div>
                <div className="font-mono tabular-nums text-emerald-400 font-semibold mt-0.5">
                  +€{weeklyFinances.parliamentaryContributions.toLocaleString('it-IT')}
                </div>
              </div>
              <div
                className="p-2 rounded-lg bg-[#090D16] border border-slate-800/80"
                title={`Sede nazionale €${weeklyFinances.baseOverhead.toLocaleString('it-IT')} + Circoli €${weeklyFinances.hqUpkeep.toLocaleString('it-IT')}${
                  weeklyFinances.investmentStaffUpkeep > 0
                    ? ` + Staff/Fondazione €${weeklyFinances.investmentStaffUpkeep.toLocaleString('it-IT')}`
                    : ''
                }`}
              >
                <div className="text-slate-400 truncate">Spese Struttura</div>
                <div className="font-mono tabular-nums text-amber-400 font-semibold mt-0.5">
                  -€{weeklyFinances.totalExpenses.toLocaleString('it-IT')}
                </div>
                {weeklyFinances.investmentStaffUpkeep > 0 && (
                  <div className="text-[9px] text-slate-500 font-mono truncate">
                    incl. €{weeklyFinances.investmentStaffUpkeep.toLocaleString('it-IT')} staff
                  </div>
                )}
              </div>
            </div>

            {budgetHealth.level !== 'ok' && (
              <div
                className={`mt-3 p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                  budgetHealth.level === 'deficit'
                    ? 'bg-rose-950/35 border-rose-500/50 text-rose-100'
                    : 'bg-amber-950/30 border-amber-500/45 text-amber-100'
                }`}
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="text-xs font-semibold flex items-center gap-1.5">
                    <AlertTriangle
                      className={`w-3.5 h-3.5 shrink-0 ${
                        budgetHealth.level === 'deficit' ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    />
                    <span>{budgetHealth.headline}</span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-snug">{budgetHealth.guidance}</p>
                </div>
                {onEmergencyFundraiser && (
                  <button
                    type="button"
                    disabled={!budgetHealth.canRunEmergencyFundraiser}
                    onClick={onEmergencyFundraiser}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                      !budgetHealth.canRunEmergencyFundraiser
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer'
                    }`}
                  >
                    {budgetHealth.canRunEmergencyFundraiser
                      ? `Colletta Volontari €0 (+€${emergencyFundEst.toLocaleString('it-IT')})`
                      : 'Colletta svolta (1/sett.)'}
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Tratti Attivi: Identità del Partito, Stile & Personalità del Leader */}
          <section className="bg-[#111827] border border-cyan-500/35 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Tratti Attivi · Identità Partito &amp; Personalità Leader</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Modificatori concreti attivi su dibattiti TV, raccolta fondi, coesione interna, radicamento territoriale e credibilità istituzionale.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {traitProfile.items.map((item, idx) => (
                <div
                  key={`${item.source}-${idx}`}
                  className="p-3 rounded-lg bg-[#090D16] border border-slate-800/90 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-100 leading-snug">
                      {item.title}
                    </span>
                    <span
                      className={`text-[10px] font-mono shrink-0 ${
                        item.source === 'partito'
                          ? 'text-cyan-300'
                          : item.source === 'stile'
                            ? 'text-emerald-300'
                            : 'text-amber-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <ul className="space-y-0.5 text-[11px] text-slate-300 leading-snug">
                    {item.effects.map((eff, eIdx) => (
                      <li key={eIdx} className="flex items-start gap-1.5">
                        <span className="text-cyan-400 shrink-0">·</span>
                        <span>{eff}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Tesseramento Annuale & Raccolta Fondi Trasparente (2x1000) */}
          {state.fundraising && (
            <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-3">
              {(() => {
                const f = state.fundraising;
                const membershipWait =
                  f.lastMembershipCampaignWeek > 0
                    ? Math.max(
                        0,
                        MEMBERSHIP_CAMPAIGN_COOLDOWN_WEEKS -
                          (state.week - f.lastMembershipCampaignWeek)
                      )
                    : 0;
                const twoPerThousandWait =
                  f.twoPerThousandLastClaimWeek > 0
                    ? Math.max(
                        0,
                        TWO_PER_THOUSAND_COOLDOWN_WEEKS -
                          (state.week - f.twoPerThousandLastClaimWeek)
                      )
                    : 0;
                const eventWait =
                  f.lastFundraisingEventWeek > 0
                    ? Math.max(
                        0,
                        FUNDRAISER_EVENT_COOLDOWN_WEEKS -
                          (state.week - f.lastFundraisingEventWeek)
                      )
                    : 0;
                const membershipEst = estimateMembershipCampaign(state);
                const twoPerThousandEst = estimateTwoPerThousandQuota(state);
                const donazioniEst = estimateFundraiserRevenue(state, 'donazioni');
                const cenaEst = estimateFundraiserRevenue(state, 'cena');

                return (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                          <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Tesseramento Annuale &amp; Finanziamento Trasparente</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          Raccolta fondi certificata (L. 13/2014): tessere, 2×1000 IRPEF, crowdfunding e cene sostenitori con rendiconto pubblico.
                        </p>
                      </div>
                      <div className="text-right text-[11px] font-mono shrink-0">
                        <div className="text-slate-400 flex items-center justify-end gap-1">
                          <Users className="w-3 h-3 text-cyan-400" />
                          <span>Iscritti attivi</span>
                        </div>
                        <div className="text-cyan-300 font-bold tabular-nums">
                          {f.activeMembersCount.toLocaleString('it-IT')}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={membershipWait > 0}
                        onClick={() => onLaunchMembership?.()}
                        className={`p-2.5 rounded-lg border text-left transition-colors ${
                          membershipWait > 0
                            ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-[#090D16] hover:bg-slate-800/80 border-cyan-500/40 text-slate-100 cursor-pointer'
                        }`}
                      >
                        <div className="text-xs font-semibold flex items-center justify-between gap-1">
                          <span>Campagna Tesseramento</span>
                          <span className="font-mono text-[10px] text-cyan-300">
                            {membershipWait > 0 ? `Tra ${membershipWait}s` : 'Disponibile'}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-emerald-400 mt-0.5 tabular-nums">
                          Stima: +{membershipEst.newMembers.toLocaleString('it-IT')} iscritti · +€
                          {membershipEst.amount.toLocaleString('it-IT')}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Rafforza la base territoriale e +4 lealtà interna.
                        </div>
                      </button>

                      <button
                        type="button"
                        disabled={twoPerThousandWait > 0 || !twoPerThousandEst.eligible}
                        onClick={() => onClaimTwoPerThousand?.()}
                        className={`p-2.5 rounded-lg border text-left transition-colors ${
                          twoPerThousandWait > 0 || !twoPerThousandEst.eligible
                            ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-[#090D16] hover:bg-slate-800/80 border-emerald-500/40 text-slate-100 cursor-pointer'
                        }`}
                      >
                        <div className="text-xs font-semibold flex items-center justify-between gap-1">
                          <span>Incassa 2×1000 IRPEF</span>
                          <span className="font-mono text-[10px] text-emerald-300">
                            {twoPerThousandWait > 0 ? `Tra ${twoPerThousandWait}s` : 'Disponibile'}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-emerald-400 mt-0.5 tabular-nums">
                          {twoPerThousandEst.eligible
                            ? `Quota stimata: +€${twoPerThousandEst.amount.toLocaleString('it-IT')}`
                            : 'Richiede ≥1,0% o 1 seggio parlamentare'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Riparto Agenzia Entrate su peso elettorale e {twoPerThousandEst.seatCount} seggi.
                        </div>
                      </button>

                      <button
                        type="button"
                        disabled={eventWait > 0}
                        onClick={() => onHostFundraiser?.('donazioni')}
                        className={`p-2.5 rounded-lg border text-left transition-colors ${
                          eventWait > 0
                            ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-[#090D16] hover:bg-slate-800/80 border-slate-700 text-slate-100 cursor-pointer'
                        }`}
                      >
                        <div className="text-xs font-semibold flex items-center justify-between gap-1">
                          <span>Crowdfunding Donazioni</span>
                          <span className="font-mono text-[10px] text-amber-300">
                            {eventWait > 0 ? `Tra ${eventWait}s` : 'Ogni 4 sett.'}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-emerald-400 mt-0.5 tabular-nums">
                          Stima trasparente: +€{donazioniEst.toLocaleString('it-IT')}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Micro-donazioni volontarie (bonus Giovani &amp; Social).
                        </div>
                      </button>

                      <button
                        type="button"
                        disabled={eventWait > 0}
                        onClick={() => onHostFundraiser?.('cena')}
                        className={`p-2.5 rounded-lg border text-left transition-colors ${
                          eventWait > 0
                            ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-[#090D16] hover:bg-slate-800/80 border-slate-700 text-slate-100 cursor-pointer'
                        }`}
                      >
                        <div className="text-xs font-semibold flex items-center justify-between gap-1">
                          <span>Cena Sostenitori</span>
                          <span className="font-mono text-[10px] text-amber-300">
                            {eventWait > 0 ? `Tra ${eventWait}s` : 'Ogni 4 sett.'}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-emerald-400 mt-0.5 tabular-nums">
                          Stima trasparente: +€{cenaEst.toLocaleString('it-IT')}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Evento di autofinanziamento (bonus Imprese &amp; Fundraiser).
                        </div>
                      </button>

                      {onEmergencyFundraiser && (
                        <button
                          type="button"
                          disabled={!budgetHealth.canRunEmergencyFundraiser}
                          onClick={onEmergencyFundraiser}
                          className={`sm:col-span-2 p-2.5 rounded-lg border text-left transition-colors ${
                            !budgetHealth.canRunEmergencyFundraiser
                              ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-[#090D16] hover:bg-slate-800/80 border-emerald-500/40 text-slate-100 cursor-pointer'
                          }`}
                        >
                          <div className="text-xs font-semibold flex items-center justify-between gap-2">
                            <span>Colletta Volontari &amp; Autofinanziamento di Base (€0)</span>
                            <span className="font-mono text-[10px] text-emerald-300 shrink-0">
                              {budgetHealth.canRunEmergencyFundraiser ? 'Sempre €0 · 1/sett.' : 'Svolta questa sett.'}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-emerald-400 mt-0.5 tabular-nums">
                            Garantito: +€{emergencyFundEst.toLocaleString('it-IT')} · Disponibile anche con cassa a €0 o in deficit
                          </div>
                        </button>
                      )}
                    </div>

                    {f.transparentLedger.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                        <div className="text-[11px] font-medium text-slate-300 flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5">
                            <Receipt className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Registro Bilancio Trasparente</span>
                          </span>
                          <span className="font-mono text-emerald-400 tabular-nums">
                            Tot. +€{f.totalRaisedCampaigns.toLocaleString('it-IT')}
                          </span>
                        </div>
                        <div className="max-h-28 overflow-y-auto war-scroll space-y-1 pr-1">
                          {f.transparentLedger.slice(0, 6).map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-2 text-[11px] py-1 border-b border-slate-800/60 last:border-b-0"
                            >
                              <span className="text-slate-300 leading-snug">
                                <span className="font-mono text-slate-500 mr-1.5">
                                  {item.dateLabel}
                                </span>
                                {item.source}
                              </span>
                              <span className="font-mono font-semibold text-emerald-400 tabular-nums shrink-0">
                                +€{item.amount.toLocaleString('it-IT')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </section>
          )}

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

          {/* Key Executives & Cohesion */}
          <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-3">
            {(() => {
              const partyCohesion = calculatePartyCohesion(state.executives);
              const cohesionCritical = isPartyCohesionCritical(state.executives);
              const eligibleForSchism = player.nationalPoll >= SCHISM_MIN_POLL;
              const streak = state.lowCohesionStreak ?? 0;
              return (
                <div className="space-y-2 pb-2.5 border-b border-slate-800">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-100">
                        Segreteria Nazionale ({state.executives.length} Dirigenti)
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Ogni dirigente ha una specializzazione ministeriale. Una scissione scatta solo oltre il{' '}
                        <span className="font-mono text-slate-200">{SCHISM_MIN_POLL.toFixed(1)}%</span> di consenso dopo{' '}
                        <span className="font-mono text-slate-200">{SCHISM_REQUIRED_WEEKS} settimane</span> di coesione critica.
                      </p>
                    </div>
                    <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-[#090D16] border border-slate-800/80 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Coesione interna:</span>
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          cohesionCritical
                            ? 'text-rose-400'
                            : partyCohesion < 55
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                        }`}
                      >
                        {partyCohesion}%
                      </span>
                    </div>
                    {streak > 0 && eligibleForSchism ? (
                      <span className="text-rose-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          Allerta scissione: {streak}/{SCHISM_REQUIRED_WEEKS} sett.
                        </span>
                      </span>
                    ) : !eligibleForSchism ? (
                      <span className="text-slate-500">
                        Sotto il {SCHISM_MIN_POLL.toFixed(0)}%: rischio scissione inattivo
                      </span>
                    ) : (
                      <span className="text-emerald-400/90">Partito compatto</span>
                    )}
                  </div>
                </div>
              );
            })()}

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
                        <div className="text-sm font-semibold text-slate-100 mt-0.5 whitespace-normal leading-snug break-words">
                          {exec.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] mt-0.5">
                          <span className="text-amber-300 font-medium">
                            Specializzazione: {getSpecializationLabel(exec.specialization)}
                          </span>
                          <span className="text-slate-600" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-slate-400">{exec.trait}</span>
                        </div>
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
                        disabled={exec.actedThisWeek}
                        onClick={() => onManageExecutive(exec.id, 'colloquio')}
                        className={`px-2.5 py-2 sm:py-1.5 rounded-md text-[11px] font-medium flex items-center justify-center gap-1.5 border transition-colors ${
                          exec.actedThisWeek
                            ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 cursor-pointer'
                        }`}
                      >
                        <MessageSquare className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>{exec.actedThisWeek ? 'Incarico svolto' : 'Colloquio (€0 · 1/sett.)'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={exec.actedThisWeek || state.budget < EXECUTIVE_ACTION_COSTS.incarico}
                        onClick={() => onManageExecutive(exec.id, 'incarico')}
                        className={`px-2.5 py-2 sm:py-1.5 rounded-md text-[11px] font-medium flex items-center justify-center gap-1.5 border transition-colors ${
                          exec.actedThisWeek || state.budget < EXECUTIVE_ACTION_COSTS.incarico
                            ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 cursor-pointer'
                        }`}
                      >
                        <Briefcase className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>
                          Affida Dossier (€{EXECUTIVE_ACTION_COSTS.incarico.toLocaleString('it-IT')})
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={state.budget < EXECUTIVE_ACTION_COSTS.sostituisci}
                        onClick={() => onManageExecutive(exec.id, 'sostituisci')}
                        className={`px-2.5 py-2 sm:py-1.5 rounded-md text-[11px] font-medium flex items-center justify-center gap-1.5 border transition-colors sm:ml-auto ${
                          state.budget < EXECUTIVE_ACTION_COSTS.sostituisci
                            ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                            : 'bg-rose-950/30 hover:bg-rose-950/60 border-rose-500/40 text-rose-300 cursor-pointer'
                        }`}
                      >
                        <RefreshCw className="w-3 h-3 shrink-0" />
                        <span>
                          Sostituisci (€{EXECUTIVE_ACTION_COSTS.sostituisci.toLocaleString('it-IT')})
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right (6 cols): Raccolta Firme Liste + Coalition Panel & Inter-Party Negotiations */}
        <div className="xl:col-span-6 space-y-4 min-w-0">
          {/* Raccolta Firme per Liste Elettorali */}
          <section
            className={`bg-[#111827] border rounded-xl p-4 space-y-3 ${
              ballot.excludedFromBallot
                ? 'border-rose-500/60'
                : !ballot.exempt && ballot.collectedSignatures < ballot.targetSignatures
                  ? 'border-amber-500/50'
                  : 'border-slate-800/90'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <FileSignature className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Raccolta Firme per Liste Elettorali</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  I partiti extra-parlamentari devono raccogliere le firme autenticate prima della
                  chiusura liste (o apparentarsi con un partito già in Parlamento).
                </p>
              </div>
              {ballot.exempt ? (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Esente</span>
                </span>
              ) : ballot.excludedFromBallot ? (
                <span className="text-[11px] font-mono text-rose-400 flex items-center gap-1 shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Escluso dal Voto</span>
                </span>
              ) : ballot.collectedSignatures >= ballot.targetSignatures ? (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Lista Ammessa (100%)</span>
                </span>
              ) : (
                <span className="text-[11px] font-mono text-amber-300 shrink-0">
                  Scadenza: Sett. {ballot.deadlineWeek}
                </span>
              )}
            </div>

            {ballot.exempt ? (
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/35 text-xs text-emerald-200 leading-relaxed">
                {ballot.exemptReason ??
                  'Partito già presente in Parlamento o apparentato: lista ammessa di diritto senza raccolta firme.'}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Election Type Switcher */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        { id: 'politiche', label: 'Politiche (60.000)' },
                        { id: 'europee', label: 'Europee (150.000)' },
                        { id: 'regionali', label: 'Regionali' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChangeBallotType?.(opt.id, selectedBanchettoRegion)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                          ballot.electionType === opt.id
                            ? 'bg-cyan-500/15 border-cyan-400 text-cyan-200'
                            : 'bg-[#090D16] border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                    Organico: +{weeklySigGain.toLocaleString('it-IT')}/sett.
                  </span>
                </div>

                {/* Progress Bar */}
                {(() => {
                  const pct = Math.min(
                    100,
                    Math.round((ballot.collectedSignatures / Math.max(1, ballot.targetSignatures)) * 100)
                  );
                  return (
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                        <span className="text-slate-300">
                          Firme autenticate ({ballot.electionType})
                        </span>
                        <span className="font-mono font-bold tabular-nums text-slate-100">
                          {ballot.collectedSignatures.toLocaleString('it-IT')} /{' '}
                          {ballot.targetSignatures.toLocaleString('it-IT')} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-[#090D16] border border-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            ballot.excludedFromBallot
                              ? 'bg-rose-500'
                              : pct >= 100
                                ? 'bg-emerald-400'
                                : 'bg-amber-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {ballot.excludedFromBallot ? (
                  <div className="p-3 rounded-lg bg-rose-950/35 border border-rose-500/45 text-xs text-rose-200 leading-relaxed">
                    Termine di chiusura liste scaduto senza raggiungere il 100% delle firme: il
                    partito è escluso dalla scheda elettorale per questa tornata (puoi ancora
                    apparentarti con un partito già in Parlamento per rientrare in corsa).
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-[11px] text-slate-300 flex items-center gap-2 min-w-0">
                        <span className="shrink-0">Piazza regionale:</span>
                        <select
                          value={selectedBanchettoRegion}
                          onChange={(e) => {
                            const reg = e.target.value as RegionId;
                            setSelectedBanchettoRegion(reg);
                            if (ballot.electionType === 'regionali') {
                              onChangeBallotType?.('regionali', reg);
                            }
                          }}
                          className="bg-[#111827] border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 min-w-[140px]"
                        >
                          {ITALIAN_REGIONS.map((reg) => {
                            const hasHq = state.openHeadquarters.includes(reg.id);
                            return (
                              <option key={reg.id} value={reg.id}>
                                {reg.name} {hasHq ? '(Sede attiva)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </label>

                      <div className="text-[11px] font-mono text-emerald-400">
                        Stima: +{banchettoPreview.signaturesGain.toLocaleString('it-IT')} firme
                        <span className="text-slate-400">
                          {' '}
                          (bonus reg. +{banchettoPreview.regionalBonus.toLocaleString('it-IT')})
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={
                        ballot.collectedSignatures >= ballot.targetSignatures ||
                        ballot.banchettiThisWeek >= MAX_BANCHETTI_PER_WEEK ||
                        state.budget < BANCHETTO_SIGNATURE_COST
                      }
                      onClick={() => onOrganizeBanchetto?.(selectedBanchettoRegion)}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-colors ${
                        ballot.collectedSignatures >= ballot.targetSignatures ||
                        ballot.banchettiThisWeek >= MAX_BANCHETTI_PER_WEEK ||
                        state.budget < BANCHETTO_SIGNATURE_COST
                          ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-amber-500 hover:bg-amber-400 border-amber-400 text-slate-950 cursor-pointer'
                      }`}
                    >
                      <FileSignature className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Organizza Banchetto in {banchettoPreview.regionLabel} (€
                        {BANCHETTO_SIGNATURE_COST.toLocaleString('it-IT')} ·{' '}
                        {ballot.banchettiThisWeek}/{MAX_BANCHETTI_PER_WEEK} sett.)
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Grandi Investimenti & Struttura Nazionale (Mid/Late Game) */}
          {onExecutePartyInvestment && (
            <section className="bg-[#111827] border border-cyan-500/35 rounded-xl p-4 space-y-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Grandi Investimenti &amp; Struttura Nazionale</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Impiega la cassa accumulata in media nazionali, centro studi, congressi, staff
                    comunicazione e intelligence elettorale riservata.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400">Cassa disponibile</div>
                  <div className="font-mono text-xs font-bold tabular-nums text-emerald-400">
                    €{state.budget.toLocaleString('it-IT')}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                {/* 1. Campagna TV Nazionale / Spot Prime Time */}
                <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Tv className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-xs font-semibold text-slate-100">
                        Campagna TV Nazionale / Spot Prime Time
                      </span>
                      {partyInv.tvCampaignWeeksRemaining > 0 ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/40 text-cyan-300">
                          In onda · {partyInv.tvCampaignWeeksRemaining} sett. rimaste
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400">
                          Durata {TV_CAMPAIGN_DURATION_WEEKS} sett.
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Forte spinta di visibilità mediatica ogni settimana, +2% gradimento leader e
                      scudo anti-logoramento nei sondaggi (-45% erosione di governo).
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={
                      partyInv.tvCampaignWeeksRemaining > 0 ||
                      state.budget < PARTY_INVESTMENT_COSTS.tv_campaign
                    }
                    onClick={() => onExecutePartyInvestment('tv_campaign')}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold font-mono whitespace-nowrap shrink-0 border transition-colors ${
                      partyInv.tvCampaignWeeksRemaining > 0 ||
                      state.budget < PARTY_INVESTMENT_COSTS.tv_campaign
                        ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-cyan-500 hover:bg-cyan-400 border-cyan-400 text-slate-950 cursor-pointer'
                    }`}
                  >
                    {partyInv.tvCampaignWeeksRemaining > 0
                      ? 'Campagna Attiva'
                      : `€${PARTY_INVESTMENT_COSTS.tv_campaign.toLocaleString('it-IT')}`}
                  </button>
                </div>

                {/* 2. Fondazione & Think Tank di Partito */}
                <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Landmark className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-xs font-semibold text-slate-100">
                        Fondazione &amp; Think Tank di Partito
                      </span>
                      {partyInv.hasThinkTank ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
                          Operativa · €{THINK_TANK_WEEKLY_UPKEEP.toLocaleString('it-IT')}/sett.
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-amber-300/90">
                          Strutturale permanente
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Aumenta stabilmente la credibilità istituzionale (spread, UE, democrazia),
                      +10% probabilità successo trattative d’Aula e -25% impatto degli scandali.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={
                      partyInv.hasThinkTank ||
                      state.budget < PARTY_INVESTMENT_COSTS.think_tank
                    }
                    onClick={() => onExecutePartyInvestment('think_tank')}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold font-mono whitespace-nowrap shrink-0 border transition-colors ${
                      partyInv.hasThinkTank
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 cursor-default'
                        : state.budget < PARTY_INVESTMENT_COSTS.think_tank
                          ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-400 border-emerald-400 text-slate-950 cursor-pointer'
                    }`}
                  >
                    {partyInv.hasThinkTank
                      ? 'Attiva ✓'
                      : `€${PARTY_INVESTMENT_COSTS.think_tank.toLocaleString('it-IT')}`}
                  </button>
                </div>

                {/* 3. Festa Nazionale / Congresso di Partito */}
                <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Flag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-xs font-semibold text-slate-100">
                        Festa Nazionale / Congresso di Partito
                      </span>
                      {congressCooldownLeft > 0 ? (
                        <span className="text-[10px] font-mono text-amber-300">
                          Prossimo tra {congressCooldownLeft} sett.
                        </span>
                      ) : partyInv.congressCount > 0 ? (
                        <span className="text-[10px] font-mono text-slate-400">
                          {partyInv.congressCount} celebrati
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Grande kermesse nazionale: ricompatta tutte le correnti (+14% lealtà e azzera
                      rischio scissione), forte rilancio tesseramento, +3% gradimento e spinta consenso.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={
                      congressCooldownLeft > 0 ||
                      state.budget < PARTY_INVESTMENT_COSTS.national_congress
                    }
                    onClick={() => onExecutePartyInvestment('national_congress')}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold font-mono whitespace-nowrap shrink-0 border transition-colors ${
                      congressCooldownLeft > 0 ||
                      state.budget < PARTY_INVESTMENT_COSTS.national_congress
                        ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-400 border-amber-400 text-slate-950 cursor-pointer'
                    }`}
                  >
                    {congressCooldownLeft > 0
                      ? `Attendi ${congressCooldownLeft}s`
                      : `€${PARTY_INVESTMENT_COSTS.national_congress.toLocaleString('it-IT')}`}
                  </button>
                </div>

                {/* 4. Spin Doctor & Staff Comunicazione */}
                <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Megaphone className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      <span className="text-xs font-semibold text-slate-100">
                        Spin Doctor &amp; Staff Comunicazione
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                          partyInv.spinDoctorLevel > 0
                            ? 'bg-violet-500/15 border-violet-500/40 text-violet-300'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        Liv. {partyInv.spinDoctorLevel}/3
                        {partyInv.spinDoctorLevel > 0
                          ? ` · €${SPIN_DOCTOR_WEEKLY_UPKEEP[partyInv.spinDoctorLevel].toLocaleString('it-IT')}/sett.`
                          : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Potenziabile fino a Liv. 3: migliora i Duelli TV (+5%/liv.), i Dossier
                      dirigenti (+2 comp./+1 lealtà per liv.) e le campagne Social &amp; Talk Show (+10%/liv.).
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={
                      nextSpinDoctorCost === null || state.budget < nextSpinDoctorCost
                    }
                    onClick={() => onExecutePartyInvestment('spin_doctor')}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold font-mono whitespace-nowrap shrink-0 border transition-colors ${
                      nextSpinDoctorCost === null
                        ? 'bg-violet-950/30 border-violet-500/40 text-violet-300 cursor-default'
                        : state.budget < nextSpinDoctorCost
                          ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-violet-500 hover:bg-violet-400 border-violet-400 text-slate-950 cursor-pointer'
                    }`}
                  >
                    {nextSpinDoctorCost === null
                      ? 'Liv. Max ✓'
                      : `${partyInv.spinDoctorLevel === 0 ? 'Assumi' : `Liv. ${partyInv.spinDoctorLevel + 1}`} · €${nextSpinDoctorCost.toLocaleString('it-IT')}`}
                  </button>
                </div>

                {/* 5. Sondaggio Privato Strategico */}
                <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="text-xs font-semibold text-slate-100">
                        Sondaggio Privato Strategico
                      </span>
                      {privatePollCooldownLeft > 0 && (
                        <span className="text-[10px] font-mono text-amber-300">
                          Aggiornabile tra {privatePollCooldownLeft} sett.
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Commissiona un’indagine riservata sui temi più sentiti dagli elettori, le
                      fasce deboli da recuperare e le mosse imminenti dei partiti rivali.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={
                      privatePollCooldownLeft > 0 ||
                      state.budget < PARTY_INVESTMENT_COSTS.private_poll
                    }
                    onClick={() => onExecutePartyInvestment('private_poll')}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold font-mono whitespace-nowrap shrink-0 border transition-colors ${
                      privatePollCooldownLeft > 0 ||
                      state.budget < PARTY_INVESTMENT_COSTS.private_poll
                        ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-sky-500 hover:bg-sky-400 border-sky-400 text-slate-950 cursor-pointer'
                    }`}
                  >
                    {privatePollCooldownLeft > 0
                      ? `Tra ${privatePollCooldownLeft}s`
                      : `€${PARTY_INVESTMENT_COSTS.private_poll.toLocaleString('it-IT')}`}
                  </button>
                </div>
              </div>

              {/* Dossier Riservato Sondaggio Privato Strategico */}
              {partyInv.latestPrivatePoll && (
                <div className="p-3.5 rounded-lg bg-slate-950/90 border border-sky-500/40 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
                      <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                      <span>Dossier Riservato · Sondaggio Privato Strategico</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      Sett. {partyInv.latestPrivatePoll.generatedAtWeek} ·{' '}
                      {partyInv.latestPrivatePoll.dateLabel}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-200 leading-relaxed">
                    {partyInv.latestPrivatePoll.executiveSummary}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-[#090D16] border border-slate-800">
                      <div className="text-[10px] text-slate-400">Target con più margine</div>
                      <div className="font-semibold text-amber-300 mt-0.5">
                        {partyInv.latestPrivatePoll.weakestDemographicLabel} (
                        {partyInv.latestPrivatePoll.weakestDemographicPct.toFixed(1)}%)
                      </div>
                    </div>
                    <div className="p-2 rounded bg-[#090D16] border border-slate-800">
                      <div className="text-[10px] text-slate-400">Regione prioritaria</div>
                      <div className="font-semibold text-emerald-300 mt-0.5">
                        {partyInv.latestPrivatePoll.opportunityRegionLabel}
                      </div>
                    </div>
                  </div>

                  {/* Top 3 Temi Elettori */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      Temi più sentiti dagli elettori
                    </div>
                    {partyInv.latestPrivatePoll.topIssues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded bg-[#090D16] border border-slate-800/80 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-semibold text-slate-100">{issue.topic}</span>
                          <span className="font-mono font-bold text-sky-300 tabular-nums shrink-0">
                            {issue.saliencePct}% priorità
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
                          <div
                            className="h-full bg-sky-400"
                            style={{ width: `${Math.min(100, issue.saliencePct)}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 leading-snug">
                          {issue.voterMood}{' '}
                          <span className="text-cyan-300">{issue.recommendation}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Intelligence Partiti Rivali */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      Mosse imminenti &amp; vulnerabilità dei rivali
                    </div>
                    {partyInv.latestPrivatePoll.rivalMoves.map((rv) => (
                      <div
                        key={rv.partyId}
                        className="p-2 rounded bg-[#090D16] border border-slate-800/80 space-y-1 text-[11px]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: rv.color }}
                            />
                            <span className="font-semibold text-slate-100 truncate">
                              {rv.name} ({rv.acronym})
                            </span>
                          </div>
                          <span className="font-mono text-slate-300 tabular-nums shrink-0">
                            {rv.nationalPoll.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-300 leading-snug">
                          <span className="text-amber-300 font-semibold">Mossa prevista:</span>{' '}
                          {rv.predictedMove}
                        </div>
                        <div className="text-[10px] text-slate-400 leading-snug">
                          <span className="text-emerald-300 font-semibold">Punto debole:</span>{' '}
                          {rv.vulnerability}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Active Coalition Summary */}
          <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-cyan-400 font-medium">La Tua Coalizione Attuale</div>
                <h3 className="text-base font-bold text-slate-50 mt-0.5 whitespace-normal leading-snug break-words">
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
                        <PartyEmblem
                          emblem={p.emblem}
                          color={p.color}
                          customUrl={p.customEmblemUrl}
                          size={30}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5 flex-wrap leading-snug">
                            <span className="whitespace-normal break-words">{p.name}</span>
                            <span className="font-mono text-slate-400 shrink-0">
                              ({p.acronym})
                            </span>
                            {p.isSplinterParty && (
                              <span className="text-[10px] font-semibold text-rose-400 shrink-0">
                                · Scissione
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 whitespace-normal leading-snug break-words">
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
                    {(() => {
                      const dealDone = state.actionsTakenThisWeek.includes(`coal_deal_${p.id}`);
                      const attackDone = state.actionsTakenThisWeek.includes('coal_attack_week');
                      const dealDisabled =
                        dealDone || state.budget < COALITION_ACTION_COSTS.proponi_alleanza;
                      const attackDisabled =
                        attackDone || state.budget < COALITION_ACTION_COSTS.attacco;
                      return (
                        <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2">
                          {!isAllied ? (
                            <>
                              <button
                                type="button"
                                disabled={dealDisabled}
                                onClick={() =>
                                  onNegotiateCoalition(p.id, 'proponi_alleanza')
                                }
                                className={`px-3 py-2 sm:py-1.5 rounded-md text-[11px] font-medium border text-center transition-colors ${
                                  dealDisabled
                                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300 cursor-pointer'
                                }`}
                              >
                                {dealDone
                                  ? 'Trattativa svolta'
                                  : `Proponi Alleanza (€${COALITION_ACTION_COSTS.proponi_alleanza.toLocaleString('it-IT')})`}
                              </button>
                              <button
                                type="button"
                                disabled={dealDisabled}
                                onClick={() => onNegotiateCoalition(p.id, 'patto_governo')}
                                className={`px-3 py-2 sm:py-1.5 rounded-md text-[11px] font-medium border text-center transition-colors ${
                                  dealDisabled
                                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                                    : 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/40 text-cyan-300 cursor-pointer'
                                }`}
                              >
                                {dealDone
                                  ? 'Trattativa svolta'
                                  : `Patto di Governo (€${COALITION_ACTION_COSTS.patto_governo.toLocaleString('it-IT')})`}
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
                            disabled={attackDisabled}
                            onClick={() => onNegotiateCoalition(p.id, 'attacco')}
                            className={`px-3 py-2 sm:py-1.5 rounded-md text-[11px] font-medium border flex items-center justify-center gap-1.5 sm:ml-auto transition-colors ${
                              attackDisabled
                                ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-slate-900 hover:bg-rose-950/40 border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 cursor-pointer'
                            }`}
                          >
                            <Swords className="w-3 h-3 shrink-0" />
                            <span>
                              {attackDone
                                ? 'Attacco già lanciato'
                                : `Attacco Frontale (€${COALITION_ACTION_COSTS.attacco.toLocaleString('it-IT')})`}
                            </span>
                          </button>
                        </div>
                      );
                    })()}
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

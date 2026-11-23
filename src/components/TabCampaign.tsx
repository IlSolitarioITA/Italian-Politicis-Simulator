import React, { useState } from 'react';
import { DEMOGRAPHICS, MACRO_REGIONS } from '../data/presets';
import {
  CAMPAIGN_ACTION_COSTS,
  CampaignActionPayload,
  getFundraisingReward,
} from '../engine/simulation';
import { DemographicId, GameState, MacroRegionId } from '../types/game';
import {
  Coins,
  FileSignature,
  Handshake,
  MapPin,
  Megaphone,
  ScrollText,
  Swords,
  Tv,
} from 'lucide-react';

interface TabCampaignProps {
  state: GameState;
  onExecuteAction: (payload: CampaignActionPayload) => void;
  onStartTvDuel: (opponentPartyId: string) => void;
}

const TV_SHOWS = [
  'Prima Serata Politica',
  'Arena Sette',
  'Speciale Montecitorio',
  'Confronto Diretto',
];

const BILL_TOPICS = [
  { id: 'salario_minimo', label: 'Salario Minimo Legale a 10€/ora', hint: '+Lavoratori, +Giovani · -Imprese' },
  { id: 'flat_tax', label: 'Estensione Flat Tax Partite IVA', hint: '++Imprese · -Lavoratori' },
  { id: 'sanita_pubblica', label: 'Piano Emergenza Liste d’Attesa SSN', hint: '++Pensionati, +Lavoratori' },
  { id: 'energia_pulita', label: 'Decreto Nucleare & Rinnovabili 2035', hint: '+Giovani, +Imprese' },
  { id: 'sicurezza_citta', label: 'Patto Nazionale Sicurezza Stazioni', hint: '+Pensionati, +Imprese' },
  { id: 'referendum_giustizia', label: 'Referendum Riforma Giustizia Rapida', hint: '+Imprese, +Giovani' },
];

export const TabCampaign: React.FC<TabCampaignProps> = ({
  state,
  onExecuteAction,
  onStartTvDuel,
}) => {
  const [tvTone, setTvTone] = useState<'aggressivo' | 'istituzionale' | 'populista'>('istituzionale');
  const [tvShow, setTvShow] = useState<string>(TV_SHOWS[0]);
  const [socialTarget, setSocialTarget] = useState<DemographicId>('giovani');
  const [tourRegion, setTourRegion] = useState<MacroRegionId>('nord_ovest');
  const [billTopicId, setBillTopicId] = useState<string>(BILL_TOPICS[0].id);
  const [fundFormat, setFundFormat] = useState<'cena' | 'crowdfunding' | 'gazebo'>('cena');

  const otherParties = state.parties.filter(
    (p) => p.id !== state.playerPartyId && p.id !== 'altri'
  );
  const [talkPartyId, setTalkPartyId] = useState<string>(otherParties[0]?.id ?? '');
  const [duelPartyId, setDuelPartyId] = useState<string>(otherParties[0]?.id ?? '');
  const [talkApproach, setTalkApproach] = useState<'dialogo' | 'dossier' | 'desistenza'>('dialogo');

  const hasSocialDiscount = state.leader.traits.includes('maestro_social');
  const socialCost = hasSocialDiscount
    ? Math.round(CAMPAIGN_ACTION_COSTS.social_campaign * 0.8)
    : CAMPAIGN_ACTION_COSTS.social_campaign;
  const noAp = state.politicalCapital <= 0;

  const selectedBill = BILL_TOPICS.find((b) => b.id === billTopicId) ?? BILL_TOPICS[0];

  const getOptionFundRevenue = (format: 'cena' | 'crowdfunding' | 'gazebo') =>
    getFundraisingReward(state, format) +
    (format === 'gazebo' ? state.openHeadquarters.length * 1200 : 0);

  const effectiveFundRevenue = getOptionFundRevenue(fundFormat);
  const hasFundBonus =
    state.leader.traits.includes('fundraiser') ||
    (fundFormat === 'gazebo' && state.openHeadquarters.length > 0);

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden war-scroll p-3 sm:p-4 lg:p-5">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Main Action Deck (8 cols) */}
        <div className="xl:col-span-8 space-y-4 min-w-0">
          {/* Committee Promoter Special Challenge Bar (if active) */}
          {state.committee.active && (
            <section className="bg-[#111827] border border-amber-500/50 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-amber-400">
                    Sfida Comitato Promotore · {state.committee.weeksRemaining} settimane rimaste
                  </div>
                  <h2 className="text-base font-bold text-slate-50 mt-0.5">
                    Raccogli 30.000 firme e apri 10 comitati per fondare il partito
                  </h2>
                </div>
                <button
                  type="button"
                  disabled={noAp}
                  onClick={() => onExecuteAction({ type: 'committee_drive' })}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shrink-0 ${
                    noAp
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                  }`}
                >
                  <FileSignature className="w-4 h-4" />
                  Banchetti Firme (€{CAMPAIGN_ACTION_COSTS.committee_drive.toLocaleString('it-IT')} · 1 PA)
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Firme autenticate</span>
                    <span className="font-mono tabular-nums text-amber-300">
                      {state.committee.signatures.toLocaleString('it-IT')} /{' '}
                      {state.committee.targetSignatures.toLocaleString('it-IT')}
                    </span>
                  </div>
                  <div className="h-2 bg-[#090D16] rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          (state.committee.signatures / state.committee.targetSignatures) * 100
                        )}%`,
                      }}
                      className="h-full bg-amber-400 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Comitati provinciali</span>
                    <span className="font-mono tabular-nums text-cyan-300">
                      {state.committee.committeesOpened} / {state.committee.targetCommittees}
                    </span>
                  </div>
                  <div className="h-2 bg-[#090D16] rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          (state.committee.committeesOpened / state.committee.targetCommittees) * 100
                        )}%`,
                      }}
                      className="h-full bg-cyan-400 transition-all"
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Duello TV 1 contro 1 · Mini-Gioco a 3 Round */}
          <section className="bg-[#111827] border border-rose-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
            <div className="space-y-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Swords className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="truncate">Duello TV 1 contro 1 · Prima Serata</span>
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Sfida un leader avversario in 3 round live su temi caldi: Dati Tecnici, Affondo Populista o Attacco diretto.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
              <select
                value={duelPartyId}
                onChange={(e) => setDuelPartyId(e.target.value)}
                aria-label="Scegli leader avversario per Duello TV"
                className="px-2.5 py-2 rounded-lg bg-[#090D16] border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-rose-500 min-w-0 sm:w-52"
              >
                {otherParties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.leaderName} ({p.acronym}) · {state.leaderApproval[p.id] ?? 32}%
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={noAp || !duelPartyId}
                onClick={() => onStartTvDuel(duelPartyId)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  noAp || !duelPartyId
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/60 text-rose-200 cursor-pointer'
                }`}
              >
                <Tv className="w-3.5 h-3.5 shrink-0" />
                <span>Sfida in Duello TV 1v1 (1 PA)</span>
              </button>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Talk Show TV */}
            <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between gap-3 min-w-0">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      <Tv className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="truncate">Ospitata in Talk Show TV</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Scegli la trasmissione e il registro comunicativo del leader.
                    </p>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-amber-400 shrink-0">
                    €{CAMPAIGN_ACTION_COSTS.talk_show.toLocaleString('it-IT')}
                  </span>
                </div>

                <select
                  value={tvShow}
                  onChange={(e) => setTvShow(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#090D16] border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {TV_SHOWS.map((show) => (
                    <option key={show} value={show}>
                      {show}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'aggressivo', label: 'Aggressivo' },
                      { id: 'istituzionale', label: 'Istituzionale' },
                      { id: 'populista', label: 'Populista' },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTvTone(t.id)}
                      className={`py-1.5 px-1.5 rounded-md text-[11px] sm:text-xs font-medium border transition-colors truncate cursor-pointer ${
                        tvTone === t.id
                          ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-300'
                          : 'bg-[#090D16] border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={noAp}
                onClick={() =>
                  onExecuteAction({ type: 'talk_show', tone: tvTone, showName: tvShow })
                }
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  noAp
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/50 text-cyan-200 cursor-pointer'
                }`}
              >
                Conferma Ospitata TV (1 PA)
              </button>
            </section>

            {/* 2. Campagna Social Mirata */}
            <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between gap-3 min-w-0">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="truncate">Campagna Social Mirata</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Micro-targeting pubblicitario su una fascia elettorale specifica.
                    </p>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-amber-400 shrink-0">
                    €{socialCost.toLocaleString('it-IT')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {DEMOGRAPHICS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSocialTarget(d.id)}
                      className={`py-2 px-2.5 rounded-md text-xs font-medium border text-left transition-colors truncate cursor-pointer ${
                        socialTarget === d.id
                          ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-300'
                          : 'bg-[#090D16] border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {d.shortLabel}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={noAp}
                onClick={() =>
                  onExecuteAction({ type: 'social_campaign', target: socialTarget })
                }
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  noAp
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/50 text-cyan-200 cursor-pointer'
                }`}
              >
                Lancia Sponsorizzata (1 PA)
              </button>
            </section>

            {/* 3. Tour sul Territorio */}
            <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between gap-3 min-w-0">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate">Tour sul Territorio</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Comizi e incontri nei collegi uninominali di una macro-regione.
                    </p>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-amber-400 shrink-0">
                    €{CAMPAIGN_ACTION_COSTS.territorial_tour.toLocaleString('it-IT')}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {MACRO_REGIONS.map((reg) => (
                    <button
                      key={reg.id}
                      type="button"
                      onClick={() => setTourRegion(reg.id)}
                      className={`py-2 px-1 rounded-md text-[11px] font-medium border text-center transition-colors truncate cursor-pointer ${
                        tourRegion === reg.id
                          ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300'
                          : 'bg-[#090D16] border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {reg.label.replace('Nord-', 'N-')}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400">
                  Area: {MACRO_REGIONS.find((r) => r.id === tourRegion)?.regionsList}
                </p>
              </div>

              <button
                type="button"
                disabled={noAp}
                onClick={() =>
                  onExecuteAction({ type: 'territorial_tour', region: tourRegion })
                }
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  noAp
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/50 text-emerald-200 cursor-pointer'
                }`}
              >
                Organizza Tour Regionale (1 PA)
              </button>
            </section>

            {/* 4. Proposta di Legge / Referendum */}
            <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between gap-3 min-w-0">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      <ScrollText className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="truncate">Proposta di Legge / Referendum</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Detta l’agenda politica settimanale con un provvedimento bandiera.
                    </p>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-amber-400 shrink-0">
                    €{CAMPAIGN_ACTION_COSTS.law_proposal.toLocaleString('it-IT')}
                  </span>
                </div>

                <select
                  value={billTopicId}
                  onChange={(e) => setBillTopicId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#090D16] border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {BILL_TOPICS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-amber-300/90">Impatto atteso: {selectedBill.hint}</p>
              </div>

              <button
                type="button"
                disabled={noAp}
                onClick={() =>
                  onExecuteAction({
                    type: 'law_proposal',
                    topicId: selectedBill.id,
                    topicLabel: selectedBill.label,
                  })
                }
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  noAp
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/50 text-amber-200 cursor-pointer'
                }`}
              >
                Deposita Proposta (1 PA)
              </button>
            </section>

            {/* 5. Raccolta Fondi & Tesseramento */}
            <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between gap-3 min-w-0">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="truncate">Raccolta Fondi e Tesseramento</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Donazioni volontarie tracciate (L. 13/2014, tetto €100k/donatore) e tesseramento.
                    </p>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-emerald-400 font-semibold shrink-0 whitespace-nowrap">
                    Ricavo +€{effectiveFundRevenue.toLocaleString('it-IT')}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'cena', label: 'Cena Imprese', amount: getOptionFundRevenue('cena') },
                      {
                        id: 'crowdfunding',
                        label: 'Crowdfunding',
                        amount: getOptionFundRevenue('crowdfunding'),
                      },
                      {
                        id: 'gazebo',
                        label: 'Gazebo Iscritti',
                        amount: getOptionFundRevenue('gazebo'),
                      },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFundFormat(f.id)}
                      className={`py-2 px-1.5 rounded-md text-center border transition-colors cursor-pointer ${
                        fundFormat === f.id
                          ? 'bg-amber-500/15 border-amber-500/60 text-amber-300'
                          : 'bg-[#090D16] border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-[11px] font-medium truncate">{f.label}</div>
                      <div className="text-[10px] font-mono tabular-nums text-emerald-400 mt-0.5">
                        +€{f.amount.toLocaleString('it-IT')}
                      </div>
                    </button>
                  ))}
                </div>

                {hasFundBonus && (
                  <p className="text-[11px] text-emerald-400/90 font-mono tabular-nums">
                    Include bonus attivo (Tratto Fundraiser / Sedi Regionali)
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={noAp}
                onClick={() => onExecuteAction({ type: 'fundraising', format: fundFormat })}
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  noAp
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                }`}
              >
                Avvia Raccolta Fondi (+€{effectiveFundRevenue.toLocaleString('it-IT')} · 1 PA)
              </button>
            </section>

            {/* 6. Trattativa con altri Partiti */}
            <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between gap-3 min-w-0">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      <Handshake className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="truncate">Trattativa con altri Partiti</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Migliora i rapporti diplomatici per preparare alleanze o patti d’aula.
                    </p>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-amber-400 shrink-0">
                    €{CAMPAIGN_ACTION_COSTS.party_talks.toLocaleString('it-IT')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={talkPartyId}
                    onChange={(e) => setTalkPartyId(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-[#090D16] border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {otherParties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.acronym})
                      </option>
                    ))}
                  </select>
                  <select
                    value={talkApproach}
                    onChange={(e) =>
                      setTalkApproach(e.target.value as 'dialogo' | 'dossier' | 'desistenza')
                    }
                    className="w-full px-2.5 py-2 rounded-lg bg-[#090D16] border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="dialogo">Vertice Bilaterale</option>
                    <option value="dossier">Dossier Congiunto</option>
                    <option value="desistenza">Patto di Desistenza</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                disabled={noAp || !talkPartyId}
                onClick={() =>
                  onExecuteAction({
                    type: 'party_talks',
                    targetPartyId: talkPartyId,
                    approach: talkApproach,
                  })
                }
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  noAp
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/50 text-cyan-200 cursor-pointer'
                }`}
              >
                Apri Tavolo Diplomatico (1 PA)
              </button>
            </section>
          </div>
        </div>

        {/* Right Sidebar (4 cols): Weekly Operations Log */}
        <aside className="xl:col-span-4 bg-[#111827] border border-slate-800/90 rounded-xl p-4 flex flex-col min-w-0">
          <div className="pb-3 border-b border-slate-800 flex items-baseline justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Diario Operativo Campagna
              </h3>
              <p className="text-[11px] text-slate-400">
                Azioni rimanenti questa settimana:{' '}
                <span className="font-mono text-cyan-400 font-semibold">
                  {state.politicalCapital}/{state.maxPoliticalCapital}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-2.5 flex-1 overflow-y-auto war-scroll max-h-[540px] pr-1">
            {state.actionLog.length === 0 ? (
              <div className="p-4 rounded-lg bg-[#090D16] border border-slate-800/80 text-xs text-slate-400 leading-relaxed">
                Nessuna azione eseguita ancora. Scegli fino a 3 mosse strategiche per questo turno prima di avanzare settimana.
              </div>
            ) : (
              state.actionLog.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 rounded-lg bg-[#090D16] border border-slate-800/80 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span className="font-medium text-cyan-400 truncate">
                      Sett. {entry.week} · {entry.category}
                    </span>
                    {entry.cost > 0 && (
                      <span className="font-mono tabular-nums text-amber-400 shrink-0">
                        -€{entry.cost.toLocaleString('it-IT')}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-slate-100">{entry.title}</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{entry.summary}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

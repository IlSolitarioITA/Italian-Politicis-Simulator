import React, { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { GameState, RegionId } from '../types/game';
import { calculateParliamentSeats } from '../engine/simulation';
import { HemicycleSvg } from './HemicycleSvg';
import { ItalyRegionsMap } from './ItalyRegionsMap';
import { PartyEmblem } from './PartyEmblem';

interface TabDashboardProps {
  state: GameState;
  onOpenHq: (regionId: RegionId) => void;
  onCloseHq: (regionId: RegionId) => void;
}

export const TabDashboard: React.FC<TabDashboardProps> = ({
  state,
  onOpenHq,
  onCloseHq,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<RegionId>('lombardia');
  const [chartFilter, setChartFilter] = useState<'top5' | 'tutti'>('top5');

  const seats = useMemo(
    () => calculateParliamentSeats(state.parties, state.electoralLaw),
    [state.parties, state.electoralLaw]
  );

  const rankedParties = useMemo(() => {
    return [...state.parties]
      .filter((p) => p.id !== 'altri')
      .sort((a, b) => b.nationalPoll - a.nationalPoll);
  }, [state.parties]);

  const chartedParties = useMemo(() => {
    if (chartFilter === 'tutti') return rankedParties;
    const top4 = rankedParties.slice(0, 4);
    const player = state.parties.find((p) => p.id === state.playerPartyId);
    if (player && !top4.some((p) => p.id === player.id)) {
      return [...top4, player];
    }
    return rankedParties.slice(0, 5);
  }, [rankedParties, chartFilter, state.parties, state.playerPartyId]);

  const chartData = useMemo(() => {
    return state.pollHistory.map((snap) => ({
      name: snap.label,
      ...snap.polls,
    }));
  }, [state.pollHistory]);

  const seatMap = useMemo(() => {
    const m = new Map<string, { camera: number; senato: number }>();
    for (const s of seats) m.set(s.partyId, { camera: s.camera, senato: s.senato });
    return m;
  }, [seats]);

  const rankedLeaders = useMemo(() => {
    return state.parties
      .filter((p) => p.id !== 'altri')
      .map((p) => {
        const approval = state.leaderApproval?.[p.id] ?? 30;
        const prev = state.previousLeaderApproval?.[p.id] ?? approval;
        return {
          party: p,
          leaderName: p.id === state.playerPartyId ? state.leader.name : p.leaderName,
          approval,
          delta: approval - prev,
        };
      })
      .sort((a, b) => b.approval - a.approval);
  }, [state.parties, state.leaderApproval, state.previousLeaderApproval, state.playerPartyId, state.leader.name]);

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden war-scroll p-3 sm:p-4 lg:p-5">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Top Left (7 cols): Recharts 6-Month Poll Trend */}
        <section className="xl:col-span-7 bg-[#111827] border border-slate-800/90 rounded-xl p-4 flex flex-col min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-100">
                Andamento Sondaggi Nazionali (Giu–Nov 2026)
              </h2>
              <p className="text-[11px] text-slate-400">
                Serie storica realistica con oscillazioni quindicinali e settimanali
              </p>
            </div>
            <div className="flex items-center p-0.5 bg-[#090D16] border border-slate-800 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => setChartFilter('top5')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                  chartFilter === 'top5'
                    ? 'bg-slate-800 text-slate-50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Principali
              </button>
              <button
                type="button"
                onClick={() => setChartFilter('tutti')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                  chartFilter === 'tutti'
                    ? 'bg-slate-800 text-slate-50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tutti i Partiti
              </button>
            </div>
          </div>

          <div className="h-[245px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 10, left: -18, bottom: 2 }}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 10 }}
                  axisLine={{ stroke: '#1E293B' }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090D16',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F1F5F9',
                  }}
                  formatter={(value: unknown, name: unknown) => {
                    const party = state.parties.find((p) => p.id === String(name));
                    const num = typeof value === 'number' ? value : Number(value);
                    return [
                      `${num.toFixed(1)}%`,
                      party ? `${party.name} (${party.acronym})` : String(name),
                    ];
                  }}
                />
                {chartedParties.map((p) => (
                  <Line
                    key={p.id}
                    type="monotone"
                    dataKey={p.id}
                    stroke={p.color}
                    strokeWidth={p.id === state.playerPartyId ? 2.8 : 1.7}
                    dot={p.id === state.playerPartyId ? { r: 2.5, fill: p.color } : false}
                    activeDot={{ r: 4.5 }}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {chartedParties.map((p) => (
              <div key={p.id} className="flex items-center gap-1.5 text-[11px]">
                <span
                  style={{ backgroundColor: p.color }}
                  className="w-2.5 h-1.5 rounded-xs shrink-0"
                />
                <span
                  className={
                    p.id === state.playerPartyId
                      ? 'text-cyan-300 font-semibold'
                      : 'text-slate-300'
                  }
                >
                  {p.acronym}
                </span>
                <span className="font-mono tabular-nums text-slate-400">
                  {p.nationalPoll.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Top Right (5 cols): SVG Parliamentary Hemicycle */}
        <section className="xl:col-span-5 bg-[#111827] border border-slate-800/90 rounded-xl p-4 min-w-0">
          <HemicycleSvg
            parties={state.parties}
            seats={seats}
            playerPartyId={state.playerPartyId}
            compact
          />
        </section>

        {/* Bottom Left (5 cols): National Leaderboard Table */}
        <section className="xl:col-span-5 bg-[#111827] border border-slate-800/90 rounded-xl p-4 flex flex-col min-w-0">
          <div className="flex items-baseline justify-between mb-3 gap-2">
            <h3 className="text-sm font-semibold text-slate-100">
              Classifica Partiti e Seggi
            </h3>
            <span className="text-[11px] text-slate-400 shrink-0">
              Soglie: 3% lista · 10% coal.
            </span>
          </div>

          <div className="overflow-x-auto max-h-[430px] overflow-y-auto war-scroll pr-1">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                  <th className="text-left font-medium py-2 pr-2">Partito</th>
                  <th className="text-right font-medium py-2 px-1.5">Voti</th>
                  <th className="text-right font-medium py-2 px-1.5">Var.</th>
                  <th className="text-right font-medium py-2 px-1.5">Cam.</th>
                  <th className="text-right font-medium py-2 pl-1.5">Sen.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rankedParties.map((p) => {
                  const delta = Math.round((p.nationalPoll - p.previousPoll) * 10) / 10;
                  const s = seatMap.get(p.id) ?? { camera: 0, senato: 0 };
                  const isPlayer = p.id === state.playerPartyId;
                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${
                        isPlayer ? 'bg-cyan-500/8' : 'hover:bg-slate-800/30'
                      }`}
                    >
                      <td className="py-2 pr-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <PartyEmblem
                            emblem={p.emblem}
                            color={p.color}
                            customUrl={p.customEmblemUrl}
                            size={22}
                          />
                          <div className="min-w-0">
                            <div
                              className={`truncate font-medium max-w-[130px] sm:max-w-[190px] ${
                                isPlayer ? 'text-cyan-300 font-semibold' : 'text-slate-200'
                              }`}
                            >
                              {p.name}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {p.leaderName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-1.5 text-right font-mono tabular-nums font-semibold text-slate-100">
                        {p.nationalPoll.toFixed(1)}%
                      </td>
                      <td
                        className={`py-2 px-1.5 text-right font-mono tabular-nums ${
                          delta > 0
                            ? 'text-emerald-400'
                            : delta < 0
                              ? 'text-rose-400'
                              : 'text-slate-500'
                        }`}
                      >
                        {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
                      </td>
                      <td className="py-2 px-1.5 text-right font-mono tabular-nums text-slate-200">
                        {s.camera}
                      </td>
                      <td className="py-2 pl-1.5 text-right font-mono tabular-nums text-slate-400">
                        {s.senato}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Bottom Right (7 cols): Realistic 20-Region Italy Map & HQ Management */}
        <section className="xl:col-span-7 bg-[#111827] border border-slate-800/90 rounded-xl p-4 min-w-0">
          <ItalyRegionsMap
            parties={state.parties}
            playerPartyId={state.playerPartyId}
            budget={state.budget}
            openHeadquarters={state.openHeadquarters}
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
            onOpenHq={onOpenHq}
            onCloseHq={onCloseHq}
          />
        </section>

        {/* Compact Full-Width Row (12 cols): Classifica Gradimento Leader (0–100%) */}
        <section className="xl:col-span-12 bg-[#111827] border border-slate-800/90 rounded-xl p-4 min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <h3 className="text-sm font-semibold text-slate-100">
              Classifica Gradimento Leader (0–100%)
            </h3>
            <span className="text-[11px] text-slate-400">
              Varia con crisi, ospitate TV e mosse settimanali · Traina la crescita del partito
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {rankedLeaders.map((item, idx) => {
              const isPlayer = item.party.id === state.playerPartyId;
              return (
                <div
                  key={item.party.id}
                  className={`p-2.5 rounded-lg bg-[#090D16] border space-y-1.5 min-w-0 ${
                    isPlayer ? 'border-cyan-500/55' : 'border-slate-800/90'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] text-slate-500 tabular-nums shrink-0">
                        #{idx + 1}
                      </span>
                      <PartyEmblem
                        emblem={item.party.emblem}
                        color={item.party.color}
                        customUrl={item.party.customEmblemUrl}
                        size={20}
                      />
                      <div className="min-w-0">
                        <div
                          className={`text-xs truncate ${
                            isPlayer ? 'font-bold text-cyan-300' : 'font-semibold text-slate-200'
                          }`}
                        >
                          {item.leaderName}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {item.party.acronym}
                          {isPlayer ? ' · Tu' : ''}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono tabular-nums shrink-0">
                      <div className="text-xs font-bold text-slate-100">{item.approval}%</div>
                      <div
                        className={`text-[10px] ${
                          item.delta > 0
                            ? 'text-emerald-400'
                            : item.delta < 0
                              ? 'text-rose-400'
                              : 'text-slate-500'
                        }`}
                      >
                        {item.delta > 0 ? `+${item.delta}` : item.delta < 0 ? `${item.delta}` : '0'}
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full transition-all duration-200"
                      style={{
                        width: `${item.approval}%`,
                        backgroundColor: item.party.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

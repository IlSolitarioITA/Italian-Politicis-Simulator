import React, { useMemo } from 'react';
import { PARLIAMENT_LAWS } from '../data/laws';
import { getAvailableAbrogativeTemplates } from '../data/referendums';
import {
  REFERENDUM_CAMPAIGN_COSTS,
  REFERENDUM_GAZEBO_COST,
  REFERENDUM_LAUNCH_COST,
  calculateWeeklyReferendumSignatureGain,
} from '../engine/simulation';
import { GameState, ReferendumStance } from '../types/game';
import {
  AlertTriangle,
  CheckCircle2,
  FileSignature,
  Gavel,
  Megaphone,
  Scale,
  Vote,
  XCircle,
} from 'lucide-react';

export interface ReferendumPanelProps {
  state: GameState;
  onPromoteAbrogative: (templateId: string) => void;
  onTriggerConstitutional: (lawId: string) => void;
  onBoostSignatures: () => void;
  onSetStance: (stance: ReferendumStance) => void;
  onFundCampaign: (tier: 'locale' | 'nazionale') => void;
  onDismissConcluded: () => void;
}

export const ReferendumPanel: React.FC<ReferendumPanelProps> = ({
  state,
  onPromoteAbrogative,
  onTriggerConstitutional,
  onBoostSignatures,
  onSetStance,
  onFundCampaign,
  onDismissConcluded,
}) => {
  const activeRef = state.activeReferendum;
  const hasRunningRef = Boolean(activeRef && activeRef.phase !== 'concluso');

  const concludedIds = useMemo(
    () => new Set((state.referendumHistory ?? []).map((r) => r.templateId)),
    [state.referendumHistory]
  );

  const availableAbrogatives = useMemo(
    () => getAvailableAbrogativeTemplates(state.enactedLawIds, concludedIds),
    [state.enactedLawIds, concludedIds]
  );

  const pendingConstitutionalLaws = useMemo(() => {
    const ids = state.pendingConstitutionalReferendumLawIds ?? [];
    return PARLIAMENT_LAWS.filter((law) => ids.includes(law.id));
  }, [state.pendingConstitutionalReferendumLawIds]);

  const weeklyOrganicRefSigs = useMemo(() => {
    if (!activeRef || activeRef.phase !== 'raccolta_firme') return 0;
    return calculateWeeklyReferendumSignatureGain(state, activeRef);
  }, [state, activeRef]);

  const stanceBreakdown = useMemo(() => {
    if (!activeRef) return { si: [] as string[], no: [] as string[], astensione: [] as string[] };
    const si: string[] = [];
    const no: string[] = [];
    const astensione: string[] = [];
    for (const p of state.parties) {
      if (p.id === 'altri') continue;
      const st = activeRef.partyStances[p.id];
      if (st === 'si') si.push(p.acronym);
      else if (st === 'astensione') astensione.push(p.acronym);
      else if (st === 'no') no.push(p.acronym);
    }
    return { si, no, astensione };
  }, [activeRef, state.parties]);

  return (
    <div className="space-y-4">
      {/* Active Referendum Card */}
      {activeRef && (
        <section
          className={`rounded-xl border p-4 sm:p-5 space-y-4 ${
            activeRef.phase === 'concluso'
              ? activeRef.result?.playerWon
                ? 'bg-emerald-950/20 border-emerald-500/50'
                : 'bg-[#111827] border-amber-500/50'
              : activeRef.kind === 'costituzionale'
                ? 'bg-[#111827] border-rose-500/55'
                : 'bg-[#111827] border-cyan-500/55'
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                <span
                  className={`px-2 py-0.5 rounded font-semibold ${
                    activeRef.kind === 'costituzionale'
                      ? 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
                      : 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300'
                  }`}
                >
                  {activeRef.kind === 'costituzionale'
                    ? 'Art. 138 Cost. · Confermativo Costituzionale'
                    : 'Art. 75 Cost. · Referendum Abrogativo'}
                </span>
                <span className="text-slate-400">
                  {activeRef.requiresQuorum
                    ? 'Quorum richiesto: 50% + 1'
                    : 'Nessun quorum di affluenza'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-50 leading-snug">
                {activeRef.title}
              </h3>
              <div className="text-xs text-slate-400">
                Oggetto: <span className="text-slate-200">{activeRef.lawTargetLabel}</span>
              </div>
            </div>

            <div className="text-right font-mono text-xs shrink-0">
              {activeRef.phase === 'raccolta_firme' ? (
                <div>
                  <div className="text-[10px] text-slate-400">Scadenza firme</div>
                  <div className="text-amber-300 font-bold tabular-nums">
                    Sett. {activeRef.signatureDeadlineWeek} (
                    {Math.max(0, activeRef.signatureDeadlineWeek - state.week)} sett.)
                  </div>
                </div>
              ) : activeRef.phase === 'campagna' ? (
                <div>
                  <div className="text-[10px] text-slate-400">Data del Voto</div>
                  <div className="text-cyan-300 font-bold tabular-nums">
                    Sett. {activeRef.voteWeek} ({Math.max(0, activeRef.voteWeek - state.week)} sett.)
                  </div>
                </div>
              ) : (
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 font-semibold">
                  Consultazione Conclusa
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{activeRef.summary}</p>

          {/* Phase 1: Raccolta 500.000 firme (Art. 75) */}
          {activeRef.phase === 'raccolta_firme' && (
            <div className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                  <FileSignature className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Raccolta Firme in Cassazione (Obiettivo 500.000)</span>
                </span>
                <span className="font-mono font-bold tabular-nums text-cyan-300">
                  {activeRef.signatures.toLocaleString('it-IT')} /{' '}
                  {activeRef.targetSignatures.toLocaleString('it-IT')} (
                  {Math.min(
                    100,
                    Math.round((activeRef.signatures / Math.max(1, activeRef.targetSignatures)) * 100)
                  )}
                  %)
                </span>
              </div>

              <div className="h-2.5 w-full rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      (activeRef.signatures / Math.max(1, activeRef.targetSignatures)) * 100
                    )}%`,
                  }}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                <div className="text-[11px] text-slate-400 leading-snug">
                  Flusso organico (SPID + partiti favorevoli + sedi):{' '}
                  <span className="font-mono text-emerald-400 font-semibold">
                    +{weeklyOrganicRefSigs.toLocaleString('it-IT')}/sett.
                  </span>
                </div>

                <button
                  type="button"
                  disabled={
                    activeRef.banchettiThisWeek >= 2 || state.budget < REFERENDUM_GAZEBO_COST
                  }
                  onClick={onBoostSignatures}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors shrink-0 ${
                    activeRef.banchettiThisWeek >= 2 || state.budget < REFERENDUM_GAZEBO_COST
                      ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-cyan-500 hover:bg-cyan-400 border-cyan-400 text-slate-950 cursor-pointer'
                  }`}
                >
                  <FileSignature className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Gazebo Referendario (€{REFERENDUM_GAZEBO_COST.toLocaleString('it-IT')} ·{' '}
                    {activeRef.banchettiThisWeek}/2)
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Phase 2: Campagna Referendaria & Schieramento */}
          {activeRef.phase === 'campagna' && (
            <div className="space-y-3.5">
              {/* Live Projections */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800">
                  <div className="text-[11px] text-slate-400">
                    Affluenza Stimata {activeRef.requiresQuorum ? '(Quorum >50%)' : '(No Quorum)'}
                  </div>
                  <div
                    className={`font-mono text-lg font-bold tabular-nums mt-0.5 ${
                      !activeRef.requiresQuorum
                        ? 'text-cyan-300'
                        : activeRef.projectedTurnout > 50
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                    }`}
                  >
                    {activeRef.projectedTurnout.toFixed(1)}%
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800">
                  <div className="text-[11px] text-slate-400">Proiezione SÌ</div>
                  <div className="font-mono text-lg font-bold tabular-nums text-emerald-400 mt-0.5">
                    {activeRef.projectedYesPct.toFixed(1)}%
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800">
                  <div className="text-[11px] text-slate-400">Proiezione NO</div>
                  <div className="font-mono text-lg font-bold tabular-nums text-rose-400 mt-0.5">
                    {(100 - activeRef.projectedYesPct).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Stance Picker */}
              <div className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-100">
                    Posizione Ufficiale del Partito
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Scegli la linea elettorale prima del voto
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onSetStance('si')}
                    className={`px-3 py-2.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                      activeRef.playerStance === 'si'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                        : 'bg-[#111827] hover:bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    Schierati per il SÌ
                  </button>

                  <button
                    type="button"
                    onClick={() => onSetStance('no')}
                    className={`px-3 py-2.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                      activeRef.playerStance === 'no'
                        ? 'bg-rose-500/20 border-rose-400 text-rose-200'
                        : 'bg-[#111827] hover:bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    Schierati per il NO
                  </button>

                  {activeRef.requiresQuorum ? (
                    <button
                      type="button"
                      onClick={() => onSetStance('astensione')}
                      className={`px-3 py-2.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                        activeRef.playerStance === 'astensione'
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                          : 'bg-[#111827] hover:bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      Astensione (Affossa Quorum)
                    </button>
                  ) : (
                    <div className="px-3 py-2.5 rounded-lg border border-slate-800 bg-slate-950/60 text-[11px] text-slate-500 flex items-center justify-center text-center">
                      Art. 138: nessun quorum (astensione inefficace)
                    </div>
                  )}
                </div>

                {/* Party Fronts Summary */}
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] leading-snug">
                  <div>
                    <span className="text-emerald-400 font-semibold">Fronte SÌ: </span>
                    <span className="text-slate-300">
                      {stanceBreakdown.si.join(', ') || 'Nessuno'}
                    </span>
                  </div>
                  <div>
                    <span className="text-rose-400 font-semibold">Fronte NO: </span>
                    <span className="text-slate-300">
                      {stanceBreakdown.no.join(', ') || 'Nessuno'}
                    </span>
                  </div>
                  {activeRef.requiresQuorum && (
                    <div>
                      <span className="text-amber-400 font-semibold">Astensione: </span>
                      <span className="text-slate-300">
                        {stanceBreakdown.astensione.join(', ') || 'Nessuno'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Campaign Investments */}
              {(() => {
                const refCampDone = state.actionsTakenThisWeek.includes('ref_camp_week');
                const localeDisabled =
                  !activeRef.playerStance ||
                  refCampDone ||
                  state.budget < REFERENDUM_CAMPAIGN_COSTS.locale;
                const nazionaleDisabled =
                  !activeRef.playerStance ||
                  refCampDone ||
                  state.budget < REFERENDUM_CAMPAIGN_COSTS.nazionale;
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={localeDisabled}
                      onClick={() => onFundCampaign('locale')}
                      className={`p-3 rounded-lg border text-left transition-colors flex items-center justify-between gap-2 ${
                        localeDisabled
                          ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-[#090D16] hover:bg-slate-800 border-slate-700 hover:border-cyan-400 text-slate-100 cursor-pointer'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold flex items-center gap-1.5">
                          <Megaphone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>Comitati &amp; Volantinaggio</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {refCampDone
                            ? 'Campagna già finanziata questa settimana'
                            : 'Spinge la tua linea nei territori (1/sett.)'}
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-amber-400 shrink-0">
                        €{REFERENDUM_CAMPAIGN_COSTS.locale.toLocaleString('it-IT')}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={nazionaleDisabled}
                      onClick={() => onFundCampaign('nazionale')}
                      className={`p-3 rounded-lg border text-left transition-colors flex items-center justify-between gap-2 ${
                        nazionaleDisabled
                          ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-[#090D16] hover:bg-slate-800 border-cyan-500/50 hover:border-cyan-400 text-slate-100 cursor-pointer'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold flex items-center gap-1.5">
                          <Vote className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Campagna TV &amp; Piazze Nazionali</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {refCampDone
                            ? 'Campagna già finanziata questa settimana'
                            : 'Forte impatto su affluenza e voto (1/sett.)'}
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-amber-400 shrink-0">
                        €{REFERENDUM_CAMPAIGN_COSTS.nazionale.toLocaleString('it-IT')}
                      </span>
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Phase 3: Esito Concluso */}
          {activeRef.phase === 'concluso' && activeRef.result && (
            <div className="p-4 rounded-xl bg-[#090D16] border border-slate-700/90 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-50">
                  {activeRef.result.approved ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{activeRef.result.headline}</span>
                </div>
                <button
                  type="button"
                  onClick={onDismissConcluded}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer shrink-0"
                >
                  Archivia Esito
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {activeRef.result.narrative}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono tabular-nums">
                <div className="p-2 rounded-lg bg-[#111827] border border-slate-800">
                  <div className="text-[10px] font-sans text-slate-400">Affluenza</div>
                  <div className="font-bold text-slate-100">
                    {activeRef.result.turnout.toFixed(1)}%
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-[#111827] border border-slate-800">
                  <div className="text-[10px] font-sans text-slate-400">Quorum</div>
                  <div
                    className={`font-bold ${
                      !activeRef.requiresQuorum
                        ? 'text-cyan-300'
                        : activeRef.result.quorumReached
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                    }`}
                  >
                    {!activeRef.requiresQuorum
                      ? 'Non richiesto'
                      : activeRef.result.quorumReached
                        ? 'Raggiunto'
                        : 'Fallito'}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-[#111827] border border-slate-800">
                  <div className="text-[10px] font-sans text-slate-400">SÌ</div>
                  <div className="font-bold text-emerald-400">
                    {activeRef.result.yesPct.toFixed(1)}%
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-[#111827] border border-slate-800">
                  <div className="text-[10px] font-sans text-slate-400">NO</div>
                  <div className="font-bold text-rose-400">
                    {activeRef.result.noPct.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Pending Constitutional Referendums (Art. 138 Cost., approved under 2/3) */}
      {pendingConstitutionalLaws.length > 0 && (
        <section className="bg-[#111827] border border-rose-500/45 rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                <Scale className="w-4 h-4 shrink-0" />
                <span>Riforme Costituzionali Sotto i 2/3 — Referendum Confermativo (Art. 138)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Le riforme costituzionali approvate senza maggioranza qualificata dei 2/3 possono
                essere sottoposte a referendum confermativo popolare senza quorum.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingConstitutionalLaws.map((law) => (
              <div
                key={law.id}
                className="p-3.5 rounded-xl bg-[#090D16] border border-rose-500/35 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-100 leading-snug">{law.title}</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{law.shortDesc}</p>
                </div>
                <button
                  type="button"
                  disabled={hasRunningRef}
                  onClick={() => onTriggerConstitutional(law.id)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                    hasRunningRef
                      ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-rose-600 hover:bg-rose-500 border-rose-500 text-white cursor-pointer'
                  }`}
                >
                  <Gavel className="w-3.5 h-3.5 shrink-0" />
                  <span>Indici Referendum Art. 138 (Senza Quorum)</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Promote Abrogative Referendum (Art. 75 Cost.) */}
      <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Vote className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Promuovi Referendum Abrogativo (Art. 75 Cost.)</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Accessibile a tutti i partiti (anche extra-parlamentari): deposita il quesito (€
              {REFERENDUM_LAUNCH_COST.toLocaleString('it-IT')}), raccogli 500.000 firme entro 8
              settimane e supera il quorum del 50% + 1.
            </p>
          </div>
          {hasRunningRef && (
            <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Un referendum è già in corso</span>
            </span>
          )}
        </div>

        {availableAbrogatives.length === 0 ? (
          <div className="p-4 rounded-lg bg-[#090D16] border border-slate-800 text-xs text-slate-400">
            Tutti i quesiti abrogativi disponibili sono già stati sottoposti al voto in questa
            legislatura.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableAbrogatives.map((tpl) => {
              const disabled = hasRunningRef || state.budget < REFERENDUM_LAUNCH_COST;
              return (
                <article
                  key={tpl.id}
                  className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800/90 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono text-cyan-400">
                      Art. 75 Cost. · {tpl.lawTargetLabel}
                    </div>
                    <h4 className="text-xs font-bold text-slate-100 leading-snug">{tpl.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{tpl.summary}</p>
                  </div>

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onPromoteAbrogative(tpl.id)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                      disabled
                        ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/50 text-cyan-200 cursor-pointer'
                    }`}
                  >
                    <FileSignature className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Deposita Quesito (€{REFERENDUM_LAUNCH_COST.toLocaleString('it-IT')})
                    </span>
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Historical Referendum Log */}
      {(state.referendumHistory ?? []).length > 0 && (
        <section className="bg-[#111827] border border-slate-800/90 rounded-xl p-4 space-y-2.5">
          <h3 className="text-sm font-semibold text-slate-100 pb-2 border-b border-slate-800">
            Archivio Referendum della Legislatura
          </h3>
          <div className="space-y-2">
            {(state.referendumHistory ?? []).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-[#090D16] border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-slate-100 leading-snug">{item.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {item.kind === 'costituzionale' ? 'Art. 138 Cost.' : 'Art. 75 Cost.'} ·{' '}
                    {item.result
                      ? `Affluenza ${item.result.turnout.toFixed(1)}% · SÌ ${item.result.yesPct.toFixed(1)}% / NO ${item.result.noPct.toFixed(1)}%`
                      : 'Raccolta firme non completata entro la scadenza'}
                  </div>
                </div>
                <span
                  className={`font-mono text-[11px] font-bold shrink-0 ${
                    item.result?.approved ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {item.result
                    ? item.result.approved
                      ? 'APPROVATO'
                      : item.requiresQuorum && !item.result.quorumReached
                        ? 'NO QUORUM'
                        : 'RESPINTO'
                    : 'DECADUTO'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

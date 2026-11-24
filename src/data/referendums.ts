import { LawDefinition, ReferendumTemplate } from '../types/game';
import { PARLIAMENT_LAWS } from './laws';

/**
 * Catalogo dei Referendum Abrogativi (Art. 75 Cost.) su leggi vigenti dell'ordinamento italiano.
 * Richiedono 500.000 firme certificate entro 8 settimane e il raggiungimento del quorum del 50% + 1.
 */
export const BASELINE_ABROGATIVE_REFERENDUMS: ReferendumTemplate[] = [
  {
    id: 'ref_autonomia_differenziata',
    title: 'Abrogazione Autonomia Differenziata delle Regioni',
    shortTitle: 'Stop Autonomia Differenziata',
    lawTargetLabel: 'Legge n. 86/2024 (Autonomia Differenziata)',
    summary:
      'Quesito abrogativo totale della legge sul regionalismo differenziato per difendere l’unità nazionale dei servizi pubblici, scuola e sanità tra Nord e Mezzogiorno.',
    kind: 'abrogativo',
    yesTargetAxis: { economic: -45, society: 35, europe: 20 },
    yesEffects: {
      stateEffects: { socialStability: 6, democraticHealth: 4 },
      demoEffects: { lavoratori: 0.9, giovani: 0.7, pensionati: 0.5 },
      headline:
        'REFERENDUM APPROVATO: Quorum superato e vittoria del SÌ — abrogata l’Autonomia Differenziata!',
    },
    noEffects: {
      stateEffects: { socialStability: -2 },
      headline:
        'Referendum Autonomia respinto: resta in vigore il regionalismo differenziato.',
    },
  },
  {
    id: 'ref_jobs_act_art18',
    title: 'Ripristino Tutela Reale Licenziamenti (Abrogazione Jobs Act)',
    shortTitle: 'Abrogazione Jobs Act',
    lawTargetLabel: 'D.Lgs. 23/2015 (Contratto a Tutele Crescenti)',
    summary:
      'Quesito abrogativo per eliminare la disciplina dei licenziamenti introdotta dal Jobs Act e rafforzare il reintegro sul posto di lavoro nelle imprese sopra i 15 dipendenti.',
    kind: 'abrogativo',
    yesTargetAxis: { economic: -65, society: 40 },
    yesEffects: {
      stateEffects: { socialStability: 8, spread: 6 },
      demoEffects: { lavoratori: 1.4, giovani: 0.8, imprese: -0.9 },
      headline:
        'REFERENDUM LAVORO: Quorum raggiunto e SÌ maggioritario — cancellato il Jobs Act!',
    },
    noEffects: {
      stateEffects: { spread: -4 },
      headline:
        'Referendum sul Lavoro senza abrogazione: confermato l’assetto del Jobs Act.',
    },
  },
  {
    id: 'ref_cittadinanza_5_anni',
    title: 'Riduzione a 5 Anni per la Cittadinanza Italiana',
    shortTitle: 'Cittadinanza 5 Anni',
    lawTargetLabel: 'Legge n. 91/1992 (Norme sulla Cittadinanza)',
    summary:
      'Quesito abrogativo parziale per dimezzare da 10 a 5 anni il periodo di residenza legale necessario agli stranieri extra-UE per richiedere la cittadinanza italiana.',
    kind: 'abrogativo',
    yesTargetAxis: { society: 75, europe: 55 },
    yesEffects: {
      stateEffects: { euRelations: 6, socialStability: 3 },
      demoEffects: { giovani: 1.1, lavoratori: 0.4, pensionati: -0.5 },
      headline:
        'REFERENDUM CITTADINANZA: Quorum superato e vittoria del SÌ — soglia ridotta a 5 anni!',
    },
    noEffects: {
      stateEffects: { socialStability: -1 },
      headline:
        'Referendum Cittadinanza non passa: confermati i 10 anni di residenza legale.',
    },
  },
  {
    id: 'ref_legge_fornero',
    title: 'Abrogazione Vincoli Pensionistici (Legge Fornero)',
    shortTitle: 'Superamento Fornero',
    lawTargetLabel: 'Legge n. 214/2011 (Riforma Previdenziale)',
    summary:
      'Quesito abrogativo per smantellare i meccanismi automatici di innalzamento dell’età pensionabile e aprire uscite anticipate flessibili per i lavoratori.',
    kind: 'abrogativo',
    yesTargetAxis: { economic: -40, europe: -45 },
    yesEffects: {
      stateEffects: { spread: 18, euRelations: -9, socialStability: 9 },
      demoEffects: { pensionati: 1.4, lavoratori: 1.1, imprese: -0.6 },
      headline:
        'REFERENDUM PENSIONI: Vittoria del SÌ con quorum — stop agli automatismi Fornero, tensione sui mercati!',
    },
    noEffects: {
      stateEffects: { spread: -5, euRelations: 4 },
      headline:
        'Referendum Pensioni respinto: conti previdenziali invariati, mercati stabili.',
    },
  },
  {
    id: 'ref_rosatellum_collegi',
    title: 'Abrogazione Parziale Rosatellum (Stop Listini Bloccati)',
    shortTitle: 'Stop Listini Bloccati',
    lawTargetLabel: 'Legge n. 165/2017 (Sistema Elettorale)',
    summary:
      'Quesito abrogativo sulle norme dei listini plurinominali bloccati per restituire ai cittadini la scelta diretta dei parlamentari tramite sistema proporzionale puro.',
    kind: 'abrogativo',
    yesTargetAxis: { institutions: -55, society: 20 },
    yesEffects: {
      stateEffects: { democraticHealth: 10, socialStability: 5 },
      demoEffects: { giovani: 0.8, lavoratori: 0.5 },
      electoralLawFallback: 'proporzionale',
      headline:
        'REFERENDUM ELETTORALE: SÌ con quorum — aboliti i listini bloccati, passaggio al Proporzionale!',
    },
    noEffects: {
      stateEffects: { democraticHealth: -2 },
      headline:
        'Referendum Elettorale non superato: confermata la legge elettorale vigente.',
    },
  },
];

/**
 * Costruisce un quesito di Referendum Abrogativo (Art. 75 Cost.) dinamico su una legge ordinaria
 * approvata durante la legislatura corrente.
 */
export function buildAbrogativeTemplateForEnactedLaw(
  law: LawDefinition
): ReferendumTemplate {
  const invertedTargetAxis: ReferendumTemplate['yesTargetAxis'] = {};
  if (typeof law.targetAxis.economic === 'number') {
    invertedTargetAxis.economic = -law.targetAxis.economic;
  }
  if (typeof law.targetAxis.society === 'number') {
    invertedTargetAxis.society = -law.targetAxis.society;
  }
  if (typeof law.targetAxis.europe === 'number') {
    invertedTargetAxis.europe = -law.targetAxis.europe;
  }
  if (typeof law.targetAxis.institutions === 'number') {
    invertedTargetAxis.institutions = -law.targetAxis.institutions;
  }

  return {
    id: `ref_abrog_${law.id}`,
    title: `Abrogazione "${law.title}"`,
    shortTitle: `Abroga ${law.title.slice(0, 26)}`,
    lawTargetId: law.id,
    lawTargetLabel: law.title,
    summary: `Referendum abrogativo (Art. 75 Cost.) per cancellare la legge approvata dal Parlamento: "${law.title}". Richiede 500.000 firme e quorum del 50% + 1.`,
    kind: 'abrogativo',
    yesTargetAxis: invertedTargetAxis,
    yesEffects: {
      repealsLawId: law.id,
      revertsFlag: law.grantsFlag,
      electoralLawFallback: law.electoralLawChange ? 'rosatellum' : undefined,
      stateEffects: {
        spread: law.stateEffects.spread ? Math.round(-law.stateEffects.spread * 0.5) : 0,
        socialStability: 5,
        democraticHealth: law.stateEffects.democraticHealth
          ? Math.round(-law.stateEffects.democraticHealth * 0.5)
          : 3,
      },
      headline: `REFERENDUM ABROGATIVO APPROVATO: Quorum superato — abrogata "${law.title}"!`,
    },
    noEffects: {
      stateEffects: { socialStability: -1 },
      headline: `Referendum su "${law.title}" respinto o senza quorum: la legge resta pienamente in vigore.`,
    },
  };
}

/**
 * Costruisce un Referendum Confermativo Costituzionale (Art. 138 Cost., SENZA QUORUM)
 * su una riforma costituzionale approvata senza la maggioranza qualificata dei 2/3.
 */
export function buildConstitutionalReferendumTemplate(
  law: LawDefinition
): ReferendumTemplate {
  return {
    id: `ref_cost_${law.id}`,
    title: `Referendum Costituzionale (Art. 138): ${law.title}`,
    shortTitle: `Conf. Cost. · ${law.title.slice(0, 22)}`,
    lawTargetId: law.id,
    lawTargetLabel: law.title,
    summary: `Consultazione confermativa ex Art. 138 Cost. (nessun quorum di affluenza): i cittadini votano SÌ per confermare la riforma "${law.title}" approvata sotto i 2/3, oppure NO per bocciarla definitivamente.`,
    kind: 'costituzionale',
    yesTargetAxis: { ...law.targetAxis },
    yesEffects: {
      stateEffects: { socialStability: 3 },
      headline: `REFERENDUM COSTITUZIONALE: Vince il SÌ — confermata definitivamente "${law.title}"!`,
    },
    noEffects: {
      stateEffects: {
        democraticHealth: 14,
        euRelations: 8,
        socialStability: 6,
        spread: -10,
      },
      headline: `REFERENDUM COSTITUZIONALE: Vince il NO — bocciata e annullata "${law.title}"!`,
    },
  };
}

/**
 * Restituisce tutti i quesiti abrogativi (Art. 75 Cost.) attualmente promuovibili:
 * include le leggi vigenti di base + le leggi ordinarie/elettorali approvate in legislatura.
 */
export function getAvailableAbrogativeTemplates(
  enactedLawIds: string[],
  concludedTemplateIds: Set<string>
): ReferendumTemplate[] {
  const dynamicFromEnacted = PARLIAMENT_LAWS.filter(
    (law) =>
      enactedLawIds.includes(law.id) &&
      law.category !== 'costituzionale' &&
      law.id !== 'law_pieni_poteri'
  ).map((law) => buildAbrogativeTemplateForEnactedLaw(law));

  return [...dynamicFromEnacted, ...BASELINE_ABROGATIVE_REFERENDUMS].filter(
    (tpl) => !concludedTemplateIds.has(tpl.id)
  );
}

import {
  ExecutiveMember,
  ExecutiveSpecialization,
  MinistryAffinityLevel,
  MinistryDefinition,
  MinistryId,
  OrientationId,
} from '../types/game';

export interface ExecutiveSpecializationMeta {
  id: ExecutiveSpecialization;
  label: string;
  shortLabel: string;
  primaryMinistryId: MinistryId;
  description: string;
}

export const EXECUTIVE_SPECIALIZATION_META: Record<
  ExecutiveSpecialization,
  ExecutiveSpecializationMeta
> = {
  economia: {
    id: 'economia',
    label: 'Economia',
    shortLabel: 'Economia',
    primaryMinistryId: 'mef',
    description: 'Finanza pubblica, bilancio dello Stato, fisco e rapporti con i mercati.',
  },
  interni: {
    id: 'interni',
    label: 'Interni / Sicurezza',
    shortLabel: 'Interni/Sicurezza',
    primaryMinistryId: 'interno',
    description: 'Ordine pubblico, sicurezza urbana, enti locali e gestione migratoria.',
  },
  esteri: {
    id: 'esteri',
    label: 'Esteri',
    shortLabel: 'Esteri',
    primaryMinistryId: 'esteri',
    description: 'Diplomazia europea, negoziati UE/PNRR, alleanze atlantiche e commercio.',
  },
  giustizia: {
    id: 'giustizia',
    label: 'Giustizia',
    shortLabel: 'Giustizia',
    primaryMinistryId: 'giustizia',
    description: 'Ordinamento giudiziario, riforme processuali, legalità e garanzie.',
  },
  sanita: {
    id: 'sanita',
    label: 'Sanità',
    shortLabel: 'Sanità',
    primaryMinistryId: 'salute',
    description: 'Servizio Sanitario Nazionale, liste d’attesa, welfare e politiche sociali.',
  },
  istruzione: {
    id: 'istruzione',
    label: 'Istruzione',
    shortLabel: 'Istruzione',
    primaryMinistryId: 'istruzione',
    description: 'Scuola pubblica, università, ricerca scientifica e politiche giovanili.',
  },
  infrastrutture: {
    id: 'infrastrutture',
    label: 'Infrastrutture',
    shortLabel: 'Infrastrutture',
    primaryMinistryId: 'infrastrutture',
    description: 'Grandi opere, reti ferroviarie, porti, logistica e trasporti regionali.',
  },
  ambiente: {
    id: 'ambiente',
    label: 'Ambiente',
    shortLabel: 'Ambiente',
    primaryMinistryId: 'ambiente',
    description: 'Transizione energetica, rinnovabili, tutela del territorio e clima.',
  },
};

export const ALL_EXECUTIVE_SPECIALIZATIONS: ExecutiveSpecialization[] = [
  'economia',
  'interni',
  'esteri',
  'giustizia',
  'sanita',
  'istruzione',
  'infrastrutture',
  'ambiente',
];

/** Gli 8 Ministeri Chiave del Consiglio dei Ministri (Manuale Cencelli + Affinità Dirigenti) */
export const KEY_MINISTRIES: MinistryDefinition[] = [
  {
    id: 'mef',
    name: 'Economia e Finanze (MEF)',
    shortName: 'Economia MEF',
    weight: 3.0,
    requiredSpecialization: 'economia',
    secondarySpecializations: ['infrastrutture', 'esteri'],
    portfolioDesc: 'Legge di bilancio, fisco, debito pubblico e rapporti con i mercati.',
    bonusSummary: 'Peso Cencelli 3.0 · Dicastero chiave per Spread e fisco',
  },
  {
    id: 'interno',
    name: 'Interno (Viminale)',
    shortName: 'Interno',
    weight: 2.5,
    requiredSpecialization: 'interni',
    secondarySpecializations: ['giustizia'],
    portfolioDesc: 'Ordine pubblico, sicurezza urbana, prefetture e flussi migratori.',
    bonusSummary: 'Peso Cencelli 2.5 · Gestione sicurezza e stabilità sociale',
  },
  {
    id: 'esteri',
    name: 'Affari Esteri (Farnesina)',
    shortName: 'Esteri',
    weight: 2.0,
    requiredSpecialization: 'esteri',
    secondarySpecializations: ['economia', 'ambiente'],
    portfolioDesc: 'Diplomazia europea, dossier PNRR, NATO e commercio internazionale.',
    bonusSummary: 'Peso Cencelli 2.0 · Rilevante per Rapporti UE',
  },
  {
    id: 'giustizia',
    name: 'Giustizia (Via Arenula)',
    shortName: 'Giustizia',
    weight: 2.0,
    requiredSpecialization: 'giustizia',
    secondarySpecializations: ['interni'],
    portfolioDesc: 'Riforma dei processi, ordinamento giudiziario e carceri.',
    bonusSummary: 'Peso Cencelli 2.0 · Equilibrio istituzionale e riforme',
  },
  {
    id: 'infrastrutture',
    name: 'Infrastrutture e Trasporti',
    shortName: 'Infrastrutture',
    weight: 1.5,
    requiredSpecialization: 'infrastrutture',
    secondarySpecializations: ['economia', 'ambiente'],
    portfolioDesc: 'Grandi opere, alta velocità, porti, ponti e mobilità regionale.',
    bonusSummary: 'Peso Cencelli 1.5 · Forte ricaduta territoriale',
  },
  {
    id: 'salute',
    name: 'Salute e Welfare',
    shortName: 'Salute',
    weight: 1.5,
    requiredSpecialization: 'sanita',
    secondarySpecializations: ['istruzione', 'ambiente'],
    portfolioDesc: 'Servizio Sanitario Nazionale, liste d’attesa e politiche sociali.',
    bonusSummary: 'Peso Cencelli 1.5 · Centrale per pensionati e famiglie',
  },
  {
    id: 'istruzione',
    name: 'Istruzione e Merito',
    shortName: 'Istruzione',
    weight: 1.0,
    requiredSpecialization: 'istruzione',
    secondarySpecializations: ['sanita'],
    portfolioDesc: 'Scuola pubblica, reclutamento docenti, università e formazione giovani.',
    bonusSummary: 'Peso Cencelli 1.0 · Impulso su giovani e capitale umano',
  },
  {
    id: 'ambiente',
    name: 'Ambiente e Sicurezza Energetica',
    shortName: 'Ambiente',
    weight: 1.0,
    requiredSpecialization: 'ambiente',
    secondarySpecializations: ['infrastrutture', 'esteri'],
    portfolioDesc: 'Transizione verde, bollette, rinnovabili, dossier Green Deal UE.',
    bonusSummary: 'Peso Cencelli 1.0 · Strategico per giovani e dossier UE',
  },
];

export const TOTAL_MINISTRY_WEIGHT = KEY_MINISTRIES.reduce((acc, m) => acc + m.weight, 0);

/** Preferenze politiche naturali per dicastero (bonus affinità nel negoziato Cencelli) */
export const ORIENTATION_PREFERRED_MINISTRIES: Record<OrientationId, MinistryId[]> = {
  conservatore: ['interno', 'giustizia', 'mef', 'istruzione'],
  moderato: ['esteri', 'giustizia', 'mef', 'istruzione'],
  riformista: ['mef', 'esteri', 'giustizia', 'istruzione'],
  tecnopragmatico: ['mef', 'esteri', 'infrastrutture', 'ambiente'],
  progressista: ['ambiente', 'salute', 'istruzione', 'esteri'],
  socialista: ['salute', 'istruzione', 'mef', 'infrastrutture'],
  populista: ['interno', 'salute', 'infrastrutture', 'ambiente'],
  territorialista: ['infrastrutture', 'interno', 'salute', 'ambiente'],
};

export function getMinistryById(id: MinistryId): MinistryDefinition {
  return KEY_MINISTRIES.find((m) => m.id === id) ?? KEY_MINISTRIES[0];
}

export function getSpecializationLabel(spec: ExecutiveSpecialization): string {
  return EXECUTIVE_SPECIALIZATION_META[spec]?.label ?? 'Economia';
}

export interface ExecutiveMinistryAffinity {
  level: MinistryAffinityLevel;
  label: string;
  shortBadge: string;
  efficiencyScore: number;
  effectSummary: string;
}

/** Valuta l'affinità tra la specializzazione del dirigente e il Ministero assegnato */
export function evaluateExecutiveMinistryAffinity(
  exec: ExecutiveMember | undefined,
  ministryId: MinistryId
): ExecutiveMinistryAffinity {
  const ministry = getMinistryById(ministryId);
  const reqLabel = getSpecializationLabel(ministry.requiredSpecialization);

  if (!exec) {
    return {
      level: 'fuori_ruolo',
      label: 'Nessun ministro indicato',
      shortBadge: 'Vacante',
      efficiencyScore: -2,
      effectSummary: `Serve un dirigente specializzato in ${reqLabel}: incarico ad interim penalizza credibilità ed efficienza.`,
    };
  }

  if (exec.specialization === ministry.requiredSpecialization) {
    return {
      level: 'affine',
      label: 'Profilo Affine',
      shortBadge: 'Affine',
      efficiencyScore: 2,
      effectSummary: `Specializzazione ${reqLabel} coerente: bonus efficienza del dicastero e stampa favorevole.`,
    };
  }

  if (ministry.secondarySpecializations.includes(exec.specialization)) {
    return {
      level: 'parziale',
      label: 'Affinità Parziale',
      shortBadge: 'Parziale',
      efficiencyScore: 0,
      effectSummary: `Competenze contigue (${getSpecializationLabel(exec.specialization)} su ${reqLabel}): gestione ordinaria senza bonus né critiche media.`,
    };
  }

  return {
    level: 'fuori_ruolo',
    label: 'Fuori Ruolo',
    shortBadge: 'Fuori ruolo',
    efficiencyScore: -2,
    effectSummary: `${getSpecializationLabel(exec.specialization)} al posto di ${reqLabel}: malus credibilità, critiche stampa e peggioramento risultati del dicastero.`,
  };
}

/** Seleziona il dirigente migliore disponibile per un dato Ministero */
export function pickBestExecutiveForMinistry(
  executives: ExecutiveMember[],
  ministryId: MinistryId,
  usedExecIds?: Set<string>
): ExecutiveMember | undefined {
  if (executives.length === 0) return undefined;
  const scored = executives.map((exec) => {
    const affinity = evaluateExecutiveMinistryAffinity(exec, ministryId);
    const alreadyUsedPenalty = usedExecIds?.has(exec.id) ? -1.5 : 0;
    const score =
      affinity.efficiencyScore * 10 + alreadyUsedPenalty * 10 + exec.competence * 0.08;
    return { exec, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.exec;
}

/** Genera l'abbinamento automatico migliore tra i ministeri del partito giocatore e i suoi dirigenti */
export function buildAutoMinistryExecutives(
  ministries: Partial<Record<MinistryId, string>>,
  playerPartyId: string,
  executives: ExecutiveMember[]
): Partial<Record<MinistryId, string>> {
  const result: Partial<Record<MinistryId, string>> = {};
  const used = new Set<string>();
  const playerMinistries = KEY_MINISTRIES.filter((m) => ministries[m.id] === playerPartyId).sort(
    (a, b) => b.weight - a.weight
  );

  for (const ministry of playerMinistries) {
    const best = pickBestExecutiveForMinistry(executives, ministry.id, used);
    if (best) {
      result[ministry.id] = best.id;
      used.add(best.id);
    }
  }
  return result;
}

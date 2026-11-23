import { MinistryDefinition, MinistryId, OrientationId } from '../types/game';

/** I 6 Ministeri Chiave del Consiglio dei Ministri (Manuale Cencelli) */
export const KEY_MINISTRIES: MinistryDefinition[] = [
  {
    id: 'mef',
    name: 'Economia e Finanze (MEF)',
    shortName: 'Economia MEF',
    weight: 3.0,
    portfolioDesc: 'Legge di bilancio, fisco, debito pubblico e rapporti con i mercati.',
    bonusSummary: 'Peso Cencelli 3.0 · Dicastero chiave per Spread e fisco',
  },
  {
    id: 'interno',
    name: 'Interno (Viminale)',
    shortName: 'Interno',
    weight: 2.5,
    portfolioDesc: 'Ordine pubblico, sicurezza urbana, prefetture e flussi migratori.',
    bonusSummary: 'Peso Cencelli 2.5 · Gestione sicurezza e stabilità sociale',
  },
  {
    id: 'esteri',
    name: 'Affari Esteri (Farnesina)',
    shortName: 'Esteri',
    weight: 2.0,
    portfolioDesc: 'Diplomazia europea, dossier PNRR, NATO e commercio internazionale.',
    bonusSummary: 'Peso Cencelli 2.0 · Rilevante per Rapporti UE',
  },
  {
    id: 'giustizia',
    name: 'Giustizia (Via Arenula)',
    shortName: 'Giustizia',
    weight: 2.0,
    portfolioDesc: 'Riforma dei processi, ordinamento giudiziario e carceri.',
    bonusSummary: 'Peso Cencelli 2.0 · Equilibrio istituzionale e riforme',
  },
  {
    id: 'infrastrutture',
    name: 'Infrastrutture e Trasporti',
    shortName: 'Infrastrutture',
    weight: 1.5,
    portfolioDesc: 'Grandi opere, alta velocità, porti, ponti e mobilità regionale.',
    bonusSummary: 'Peso Cencelli 1.5 · Forte ricaduta territoriale',
  },
  {
    id: 'salute',
    name: 'Salute e Welfare',
    shortName: 'Salute',
    weight: 1.5,
    portfolioDesc: 'Servizio Sanitario Nazionale, liste d’attesa e politiche sociali.',
    bonusSummary: 'Peso Cencelli 1.5 · Centrale per pensionati e famiglie',
  },
];

export const TOTAL_MINISTRY_WEIGHT = KEY_MINISTRIES.reduce((acc, m) => acc + m.weight, 0);

/** Preferenze politiche naturali per dicastero (bonus affinità nel negoziato Cencelli) */
export const ORIENTATION_PREFERRED_MINISTRIES: Record<OrientationId, MinistryId[]> = {
  conservatore: ['interno', 'giustizia', 'mef'],
  moderato: ['esteri', 'giustizia', 'mef'],
  riformista: ['mef', 'esteri', 'giustizia'],
  tecnopragmatico: ['mef', 'esteri', 'infrastrutture'],
  progressista: ['salute', 'esteri', 'giustizia'],
  socialista: ['salute', 'mef', 'infrastrutture'],
  populista: ['interno', 'salute', 'infrastrutture'],
  territorialista: ['infrastrutture', 'interno', 'salute'],
};

export function getMinistryById(id: MinistryId): MinistryDefinition {
  return KEY_MINISTRIES.find((m) => m.id === id) ?? KEY_MINISTRIES[0];
}

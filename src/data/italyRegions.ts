import { ChapterLevel, MacroRegionId, RegionId } from '../types/game';

export const ITALY_MAP_VIEWBOX = '0 0 540 640';

export interface ChapterTierInfo {
  level: ChapterLevel;
  label: string;
  shortLabel: string;
  description: string;
  costMultiplier: number; // relative to region.hqCost
  upkeepMultiplier: number; // relative to region.hqWeeklyUpkeep
  growthMultiplier: number; // relative to region.hqWeeklyGrowth
  membershipMultiplier: number; // relative to region.hqMembershipIncome
  weeklyNewMembers: number;
  ballotSigBonus: number;
  referendumSigBonus: number;
}

export const CHAPTER_TIERS: Record<ChapterLevel, ChapterTierInfo> = {
  0: {
    level: 0,
    label: 'Nessuna Sezione',
    shortLabel: 'Assente',
    description: 'Nessun presidio territoriale attivo nella regione.',
    costMultiplier: 0,
    upkeepMultiplier: 0,
    growthMultiplier: 0,
    membershipMultiplier: 0,
    weeklyNewMembers: 0,
    ballotSigBonus: 0,
    referendumSigBonus: 0,
  },
  1: {
    level: 1,
    label: 'Circolo Territoriale',
    shortLabel: 'Liv. 1 · Circolo',
    description: 'Presidio di base nel capoluogo con volontari, tesseramento locale e banchetti raccolta firme.',
    costMultiplier: 1.0,
    upkeepMultiplier: 1.0,
    growthMultiplier: 1.0,
    membershipMultiplier: 1.0,
    weeklyNewMembers: 22,
    ballotSigBonus: 850,
    referendumSigBonus: 4200,
  },
  2: {
    level: 2,
    label: 'Coordinamento Provinciale',
    shortLabel: 'Liv. 2 · Provinciale',
    description: 'Rete strutturata nei capoluoghi di provincia con segreteria organizzativa e coordinamento campagne.',
    costMultiplier: 1.35,
    upkeepMultiplier: 1.75,
    growthMultiplier: 1.65,
    membershipMultiplier: 1.85,
    weeklyNewMembers: 52,
    ballotSigBonus: 1750,
    referendumSigBonus: 8400,
  },
  3: {
    level: 3,
    label: 'Federazione Regionale',
    shortLabel: 'Liv. 3 · Federazione',
    description: 'Radicamento capillare in tutti i collegi regionali con scuola quadri, feste del partito e mobilitazione permanente.',
    costMultiplier: 1.8,
    upkeepMultiplier: 2.6,
    growthMultiplier: 2.35,
    membershipMultiplier: 2.8,
    weeklyNewMembers: 95,
    ballotSigBonus: 2800,
    referendumSigBonus: 13500,
  },
};

export interface ItalianRegionMeta {
  id: RegionId;
  name: string;
  capital: string;
  macroRegion: MacroRegionId;
  populationWeight: number;
  cameraSeats: number;
  senatoSeats: number;
  hqCost: number;
  hqWeeklyUpkeep: number;
  hqWeeklyGrowth: number;
  hqMembershipIncome: number;
  path: string;
  capitalX: number;
  capitalY: number;
  labelX: number;
  labelY: number;
}

/**
 * High-definition projected ISTAT regional borders for all 20 Italian regions (viewBox 0 0 540 640).
 * Derived directly from ISTAT / OpenPolis GeoJSON boundaries with cosine-latitude projection (cos 42°).
 */
export const ITALIAN_REGIONS: ItalianRegionMeta[] = [
  {
    id: 'valle_daosta',
    name: 'Valle d’Aosta',
    capital: 'Aosta',
    macroRegion: 'nord_ovest',
    populationWeight: 0.002,
    cameraSeats: 1,
    senatoSeats: 1,
    hqCost: 15000,
    hqWeeklyUpkeep: 700,
    hqWeeklyGrowth: 0.4,
    hqMembershipIncome: 950,
    path: 'M67.5,88.8L73.0,89.2L73.0,96.3L75.7,99.0L76.1,104.5L74.5,107.5L67.5,109.8L57.3,107.9L46.1,114.3L42.8,113.8L42.6,111.7L41.2,114.5L38.8,114.1L36.4,110.9L36.7,104.7L28.9,99.7L29.2,93.8L36.4,91.9L38.2,88.9L41.1,92.4L44.8,92.4L49.1,88.9L53.0,90.2L60.7,85.1L67.5,88.8Z',
    capitalX: 50,
    capitalY: 99.3,
    labelX: 51.9,
    labelY: 100,
  },
  {
    id: 'piemonte',
    name: 'Piemonte',
    capital: 'Torino',
    macroRegion: 'nord_ovest',
    populationWeight: 0.072,
    cameraSeats: 29,
    senatoSeats: 14,
    hqCost: 27500,
    hqWeeklyUpkeep: 1900,
    hqWeeklyGrowth: 0.3,
    hqMembershipIncome: 2600,
    path: 'M42.5,125.0L41.4,122.3L44.6,118.0L41.0,115.1L42.4,111.7L42.8,113.8L46.1,114.3L57.3,107.9L67.5,109.8L74.5,107.4L76.0,100.0L73.0,96.3L73.5,86.0L78.2,84.7L80.0,79.0L84.9,76.5L85.6,74.2L82.0,69.8L91.8,63.0L91.4,60.5L97.3,58.4L97.2,70.4L100.9,72.2L104.2,77.6L108.5,78.9L109.1,82.8L102.6,90.0L101.9,97.1L106.0,100.6L108.5,111.5L113.9,118.6L108.7,119.5L110.5,120.9L107.5,124.3L101.8,120.4L99.5,124.3L101.9,127.2L100.6,129.6L103.0,129.4L101.4,131.0L106.2,139.7L108.3,138.6L110.9,140.4L115.8,137.4L117.0,141.4L122.8,147.0L123.5,151.0L127.2,151.2L129.4,154.7L129.0,163.4L126.1,164.7L121.1,159.5L117.6,159.0L115.6,161.1L117.0,165.4L113.2,165.4L111.6,169.5L108.5,164.3L104.7,164.0L102.7,168.4L96.1,168.2L93.7,170.9L89.2,167.3L87.3,174.3L81.2,180.1L82.5,187.2L77.8,189.2L78.9,191.2L68.8,189.1L67.1,193.6L65.0,187.0L54.5,190.6L48.5,189.0L44.7,185.7L37.2,183.8L32.1,176.6L32.3,173.4L34.7,172.8L30.8,167.0L35.5,162.1L35.2,158.9L40.0,158.2L36.9,152.5L37.8,150.7L26.4,146.0L26.2,140.0L23.1,139.4L21.2,134.9L27.2,131.7L32.4,133.0L32.4,131.2L40.0,128.7L42.5,125.0Z',
    capitalX: 65.6,
    capitalY: 136.8,
    labelX: 79.5,
    labelY: 135,
  },
  {
    id: 'liguria',
    name: 'Liguria',
    capital: 'Genova',
    macroRegion: 'nord_ovest',
    populationWeight: 0.026,
    cameraSeats: 10,
    senatoSeats: 5,
    hqCost: 19500,
    hqWeeklyUpkeep: 1200,
    hqWeeklyGrowth: 0.35,
    hqMembershipIncome: 1650,
    path: 'M59.9,203.0L68.6,192.3L67.3,189.9L78.8,191.3L78.0,189.0L81.6,188.8L81.2,180.1L87.3,174.3L88.1,168.0L93.7,170.9L96.1,168.2L102.7,168.4L104.7,164.0L108.8,164.4L111.6,169.5L113.2,165.4L117.0,165.4L115.6,161.1L117.6,159.0L121.1,159.5L126.2,164.7L130.7,162.1L141.0,165.6L141.3,169.9L138.8,173.5L147.9,173.8L156.1,181.8L156.7,186.9L158.5,185.2L157.8,187.7L161.2,187.6L161.7,191.6L165.2,191.7L161.4,195.0L155.4,190.8L155.3,194.3L130.3,177.4L129.6,180.2L124.6,176.1L109.8,173.0L97.5,180.8L96.4,186.1L89.9,189.2L85.9,199.6L81.6,203.2L65.0,209.6L59.0,209.2L57.5,204.8L59.9,203.0Z',
    capitalX: 118.2,
    capitalY: 174.2,
    labelX: 112.1,
    labelY: 181.4,
  },
  {
    id: 'lombardia',
    name: 'Lombardia',
    capital: 'Milano',
    macroRegion: 'nord_ovest',
    populationWeight: 0.169,
    cameraSeats: 64,
    senatoSeats: 31,
    hqCost: 45000,
    hqWeeklyUpkeep: 2800,
    hqWeeklyGrowth: 0.25,
    hqMembershipIncome: 4000,
    path: 'M102.9,98.4L102.6,90.0L109.0,83.4L109.7,77.6L114.3,80.2L111.5,85.1L116.1,86.8L118.0,91.8L116.8,94.0L121.9,94.4L124.2,90.0L120.0,86.1L120.8,82.4L130.8,71.3L133.0,66.1L130.8,59.9L132.3,56.5L135.6,55.8L137.6,58.2L139.7,55.9L139.8,63.3L143.5,67.4L149.9,68.1L151.3,64.7L160.3,63.1L164.3,71.6L167.5,71.8L169.7,69.9L166.7,65.8L169.2,61.6L164.0,59.5L164.1,54.2L166.6,50.1L172.4,48.7L174.7,53.5L179.8,53.4L188.3,59.2L187.6,63.1L184.0,64.5L186.8,70.7L181.2,85.1L184.6,96.4L191.4,93.5L197.4,93.9L188.6,106.9L188.4,115.8L192.4,117.9L191.0,121.5L193.1,124.6L195.0,123.0L201.5,127.6L207.2,135.2L212.6,134.5L211.5,137.4L215.2,137.6L215.6,139.7L222.0,143.6L210.5,144.5L207.1,142.9L199.5,145.7L193.4,143.6L192.7,141.2L188.6,145.0L184.0,145.7L179.3,141.6L177.3,142.7L171.1,138.8L164.4,138.4L161.7,133.2L158.9,135.1L159.1,133.1L157.3,133.6L158.0,136.2L155.5,135.4L154.9,137.8L152.2,134.4L150.4,137.5L147.0,136.0L146.8,133.3L145.0,135.1L143.4,133.3L142.8,136.3L137.7,136.1L132.4,144.6L135.7,150.7L132.4,153.9L134.1,158.2L131.3,158.8L130.3,156.7L128.9,158.4L129.4,154.7L127.2,151.2L123.5,151.0L122.8,147.0L117.0,141.4L115.8,137.4L110.9,140.4L108.3,138.6L106.2,139.7L101.4,131.0L103.0,129.4L100.6,129.6L101.9,127.2L99.5,124.3L101.8,120.4L107.5,124.3L110.5,120.9L108.7,119.5L113.9,118.6L108.5,111.5L107.1,102.7L102.9,98.4Z',
    capitalX: 128.4,
    capitalY: 114.6,
    labelX: 150.5,
    labelY: 110.5,
  },
  {
    id: 'trentino_aa',
    name: 'Trentino-Alto Adige',
    capital: 'Trento',
    macroRegion: 'nord_est',
    populationWeight: 0.018,
    cameraSeats: 7,
    senatoSeats: 6,
    hqCost: 18000,
    hqWeeklyUpkeep: 1100,
    hqWeeklyGrowth: 0.35,
    hqMembershipIncome: 1500,
    path: 'M246.5,53.5L238.2,56.6L241.3,59.6L239.1,63.9L236.5,64.3L244.4,73.9L241.3,77.7L232.8,79.2L232.8,86.2L228.7,86.2L227.2,83.8L219.8,85.4L218.7,89.6L214.9,88.9L209.3,101.9L204.6,100.4L201.5,102.8L197.6,100.3L199.4,95.1L196.8,93.6L184.6,96.4L181.2,85.1L186.8,70.7L184.0,64.5L188.7,61.8L187.4,58.1L181.5,55.7L182.9,49.8L178.7,47.6L182.1,36.3L185.5,37.2L190.2,35.2L194.2,38.1L192.9,40.1L205.1,41.4L211.0,30.1L217.5,28.6L221.1,30.1L224.2,27.6L226.6,29.1L230.2,27.5L235.4,29.9L253.8,23.0L256.0,24.4L251.0,27.8L252.0,33.0L257.4,34.7L257.8,40.4L260.9,40.9L262.0,44.1L265.9,46.2L262.1,49.4L254.0,51.0L248.8,46.5L246.5,53.5Z',
    capitalX: 209.2,
    capitalY: 80.2,
    labelX: 221.3,
    labelY: 57.8,
  },
  {
    id: 'veneto',
    name: 'Veneto',
    capital: 'Venezia',
    macroRegion: 'nord_est',
    populationWeight: 0.082,
    cameraSeats: 32,
    senatoSeats: 16,
    hqCost: 29500,
    hqWeeklyUpkeep: 2100,
    hqWeeklyGrowth: 0.3,
    hqMembershipIncome: 2900,
    path: 'M188.9,110.6L188.7,106.4L197.4,93.9L199.4,95.1L197.6,100.3L201.5,102.8L204.6,100.4L209.4,101.9L214.9,88.9L218.7,89.6L219.8,85.4L225.5,83.8L232.4,86.4L232.8,79.2L241.4,77.7L244.4,73.3L236.5,64.3L239.1,63.9L241.3,59.6L238.0,57.2L245.9,54.5L248.8,46.5L254.0,51.0L262.1,49.4L265.9,46.2L276.6,48.8L271.9,53.9L273.7,58.1L268.1,58.3L259.4,69.1L266.7,76.0L262.6,82.1L263.8,87.4L267.1,88.8L269.3,94.3L271.3,93.6L273.9,96.2L278.6,92.7L279.8,94.6L286.2,93.1L288.1,99.9L292.1,104.6L284.1,106.2L261.0,118.5L258.4,126.9L259.9,135.7L269.2,142.7L262.6,152.4L258.3,148.6L257.7,144.0L252.0,144.8L247.9,142.0L237.8,142.0L230.0,147.0L226.4,144.3L222.0,144.7L215.2,137.6L211.5,137.4L212.6,134.5L207.2,135.2L201.5,127.6L195.0,123.0L192.8,124.3L191.0,120.8L192.3,117.4L188.4,115.8L188.9,110.6Z',
    capitalX: 259.2,
    capitalY: 115.9,
    labelX: 239.1,
    labelY: 99.8,
  },
  {
    id: 'friuli_vg',
    name: 'Friuli-Venezia Giulia',
    capital: 'Trieste',
    macroRegion: 'nord_est',
    populationWeight: 0.02,
    cameraSeats: 8,
    senatoSeats: 4,
    hqCost: 18000,
    hqWeeklyUpkeep: 1100,
    hqWeeklyGrowth: 0.35,
    hqMembershipIncome: 1450,
    path: 'M309.4,62.9L303.5,67.7L305.0,72.5L315.6,74.8L307.7,84.1L310.4,86.4L314.6,85.4L311.8,93.3L321.1,98.9L326.2,105.1L323.3,107.8L318.0,107.3L321.5,106.6L319.3,102.4L310.1,95.4L310.9,100.0L305.9,102.5L298.1,100.2L294.1,101.3L292.0,104.5L288.1,99.9L286.2,93.1L279.8,94.6L278.6,92.7L273.9,96.2L271.3,93.6L269.3,94.3L267.1,88.8L263.8,87.4L262.6,82.1L266.7,76.0L259.4,69.1L268.1,58.3L273.7,58.1L272.0,53.5L277.4,48.1L297.5,53.3L303.4,51.9L317.6,55.0L316.6,59.7L312.8,59.7L309.4,62.9Z',
    capitalX: 320.3,
    capitalY: 104.2,
    labelX: 296,
    labelY: 83,
  },
  {
    id: 'emilia_romagna',
    name: 'Emilia-Romagna',
    capital: 'Bologna',
    macroRegion: 'nord_est',
    populationWeight: 0.075,
    cameraSeats: 29,
    senatoSeats: 14,
    hqCost: 28000,
    hqWeeklyUpkeep: 2000,
    hqWeeklyGrowth: 0.3,
    hqMembershipIncome: 2800,
    path: 'M134.4,155.7L132.4,153.9L135.7,150.7L132.4,144.6L137.7,136.1L142.8,136.3L143.4,133.3L145.0,135.1L146.8,133.3L147.0,136.0L150.4,137.5L152.2,134.4L154.9,137.8L155.5,135.4L158.0,136.2L157.3,133.6L159.1,133.1L158.9,135.1L161.7,133.2L166.2,139.4L171.1,138.8L186.0,145.9L192.7,141.2L193.4,143.6L199.5,145.7L204.0,143.3L210.5,144.5L217.6,142.9L226.4,144.3L229.9,147.0L237.9,142.0L247.9,142.0L252.0,144.8L257.5,143.9L258.3,148.6L262.6,152.4L259.4,152.6L262.1,152.6L257.9,149.8L256.0,157.0L260.9,181.8L267.5,191.1L277.3,198.8L276.6,204.3L272.1,207.1L270.6,203.5L266.6,203.8L267.2,197.5L262.9,199.5L263.0,202.5L265.3,203.2L257.8,210.3L254.1,212.1L252.8,210.5L245.4,210.4L233.8,203.9L231.1,197.5L235.5,190.0L228.6,190.7L229.9,188.1L225.7,188.2L221.7,183.6L215.9,188.2L212.3,188.5L214.4,191.6L206.2,191.9L204.4,189.2L200.4,193.5L193.8,188.3L189.2,188.0L187.1,190.5L182.6,184.5L175.1,181.0L172.9,181.9L168.3,177.1L162.7,175.1L161.0,170.9L154.8,170.8L152.3,175.1L148.7,176.5L145.6,172.4L138.8,173.5L141.3,169.9L141.0,165.6L137.4,163.2L136.4,164.6L128.9,162.4L128.9,158.4L130.3,156.7L131.3,158.8L134.1,158.2L134.4,155.7Z',
    capitalX: 218.5,
    capitalY: 169.2,
    labelX: 196.2,
    labelY: 166.7,
  },
  {
    id: 'toscana',
    name: 'Toscana',
    capital: 'Firenze',
    macroRegion: 'centro',
    populationWeight: 0.062,
    cameraSeats: 24,
    senatoSeats: 12,
    hqCost: 26000,
    hqWeeklyUpkeep: 1800,
    hqWeeklyGrowth: 0.3,
    hqMembershipIncome: 2500,
    path: 'M158.0,187.8L159.5,186.0L156.7,186.9L156.1,181.8L149.2,176.4L155.3,170.6L161.1,170.9L162.7,175.1L168.3,177.1L172.9,181.9L175.1,181.0L182.6,184.5L187.1,190.5L189.1,188.0L193.7,188.3L200.1,193.5L204.4,189.2L206.2,191.9L214.5,191.5L212.3,188.5L215.9,188.2L221.7,183.6L225.7,188.2L229.9,188.1L228.6,190.7L235.6,190.2L231.1,197.5L234.7,204.7L248.9,211.6L257.8,210.3L261.4,213.2L259.8,215.4L258.8,212.2L258.2,214.8L253.7,217.2L254.9,218.9L249.8,224.5L251.9,226.8L247.0,229.9L251.2,233.2L251.5,236.8L255.3,236.7L249.8,240.0L247.8,239.2L246.9,242.8L242.8,244.9L242.8,249.1L245.2,250.4L244.2,260.6L235.6,264.4L238.4,267.6L236.7,269.9L238.0,272.8L228.3,277.7L230.0,285.0L224.6,284.9L222.9,288.3L214.3,286.0L210.5,289.3L207.8,285.5L211.4,284.6L211.6,279.3L202.1,268.1L192.9,264.5L194.7,258.4L189.3,255.9L183.1,257.1L184.3,239.8L174.5,222.5L175.7,220.4L174.6,221.8L172.3,204.2L163.1,194.5L165.1,191.4L162.0,191.8L161.2,187.6L158.0,187.8Z M173.4,267.7L168.2,268.4L166.7,265.2L172.4,265.3L173.3,262.9L176.9,264.7L179.6,260.5L180.5,265.9L178.4,266.9L180.4,269.5L176.7,266.6L173.4,267.7Z',
    capitalX: 214.8,
    capitalY: 210,
    labelX: 210.8,
    labelY: 221.3,
  },
  {
    id: 'umbria',
    name: 'Umbria',
    capital: 'Perugia',
    macroRegion: 'centro',
    populationWeight: 0.015,
    cameraSeats: 6,
    senatoSeats: 3,
    hqCost: 17500,
    hqWeeklyUpkeep: 1000,
    hqWeeklyGrowth: 0.35,
    hqMembershipIncome: 1350,
    path: 'M294.4,272.8L282.8,275.3L283.3,277.9L275.7,281.4L277.0,283.1L274.1,284.7L271.9,283.2L271.3,286.9L268.0,289.1L267.3,286.9L263.3,285.6L263.6,281.9L258.0,281.8L254.5,272.4L247.2,273.4L243.5,271.1L245.1,266.6L241.4,262.1L244.2,260.6L245.2,250.5L243.3,250.2L242.3,246.1L246.9,242.8L247.4,239.5L255.3,236.7L251.5,236.8L251.2,233.2L247.0,229.9L251.9,226.8L249.9,223.9L252.4,223.5L254.5,219.2L261.4,218.9L259.9,223.8L266.2,223.6L271.9,229.9L278.2,227.6L277.2,231.3L282.1,241.5L280.8,245.5L283.5,248.0L283.4,255.3L286.8,257.5L286.8,260.6L290.1,257.8L294.2,262.6L298.2,261.8L298.0,266.4L295.9,266.7L294.4,272.8Z',
    capitalX: 262.3,
    capitalY: 247.1,
    labelX: 267.1,
    labelY: 255.7,
  },
  {
    id: 'marche',
    name: 'Marche',
    capital: 'Ancona',
    macroRegion: 'centro',
    populationWeight: 0.025,
    cameraSeats: 10,
    senatoSeats: 5,
    hqCost: 19000,
    hqWeeklyUpkeep: 1200,
    hqWeeklyGrowth: 0.35,
    hqMembershipIncome: 1650,
    path: 'M266.9,224.1L259.9,223.8L261.5,218.9L256.8,220.1L253.9,217.7L258.8,212.2L259.2,215.2L261.5,213.4L257.9,208.7L262.2,207.3L262.7,204.2L265.6,202.8L268.6,204.6L270.6,203.5L272.1,207.1L274.2,206.9L276.6,204.3L277.4,198.7L283.9,201.4L299.7,215.1L306.8,218.9L309.0,217.8L313.9,222.3L326.1,259.2L317.3,261.8L315.5,264.2L310.1,263.6L308.4,268.1L304.2,270.9L299.7,267.9L295.6,268.3L298.8,264.1L297.6,260.8L294.6,262.7L290.0,257.8L286.8,260.6L286.8,257.5L283.4,255.3L283.5,248.0L280.8,245.5L282.1,241.5L277.2,231.3L278.2,227.6L271.9,229.9L266.9,224.1Z',
    capitalX: 309.5,
    capitalY: 218.6,
    labelX: 283,
    labelY: 232.4,
  },
  {
    id: 'lazio',
    name: 'Lazio',
    capital: 'Roma',
    macroRegion: 'centro',
    populationWeight: 0.097,
    cameraSeats: 36,
    senatoSeats: 18,
    hqCost: 32000,
    hqWeeklyUpkeep: 2500,
    hqWeeklyGrowth: 0.25,
    hqMembershipIncome: 3500,
    path: 'M238.0,264.2L241.9,262.8L245.1,266.6L242.9,270.0L247.2,273.4L254.5,272.4L258.0,281.8L263.6,281.9L263.3,285.6L267.3,286.9L268.0,289.1L271.3,286.9L271.9,283.2L274.1,284.7L277.0,283.1L275.7,281.4L283.3,277.9L283.2,275.1L293.9,273.2L295.7,268.3L301.1,268.9L304.9,273.4L304.3,276.3L295.8,276.5L295.2,282.6L292.6,284.6L295.9,287.7L294.2,289.5L303.7,299.4L298.2,302.4L291.4,299.6L288.9,306.8L303.0,313.8L303.6,319.9L305.2,318.9L311.7,323.4L314.9,320.2L318.3,320.9L319.9,323.7L326.2,325.5L330.8,336.4L323.8,342.4L324.9,349.3L319.7,353.3L313.6,351.3L311.8,354.4L299.9,349.2L290.2,353.3L283.6,343.8L271.8,340.7L264.3,329.9L255.2,324.0L251.8,314.3L242.4,307.4L239.0,307.9L231.9,294.4L222.9,288.3L224.6,284.9L230.0,285.0L228.3,277.7L237.8,273.3L236.7,269.9L238.4,267.6L235.3,265.4L236.3,263.4L238.0,264.2Z',
    capitalX: 266.7,
    capitalY: 315,
    labelX: 276.8,
    labelY: 297.8,
  },
  {
    id: 'abruzzo',
    name: 'Abruzzo',
    capital: 'L’Aquila',
    macroRegion: 'sud',
    populationWeight: 0.022,
    cameraSeats: 9,
    senatoSeats: 4,
    hqCost: 18500,
    hqWeeklyUpkeep: 1100,
    hqWeeklyGrowth: 0.35,
    hqMembershipIncome: 1500,
    path: 'M327.1,327.1L325.1,324.5L319.9,323.7L318.3,320.9L314.9,320.2L311.7,323.4L305.2,318.9L303.6,319.9L303.1,313.9L290.1,308.7L288.6,305.4L291.4,299.6L298.2,302.4L303.7,299.4L294.2,289.5L295.9,287.7L292.6,284.6L295.2,282.6L295.8,276.5L303.7,276.9L304.9,273.6L302.8,270.4L308.4,268.1L310.1,263.6L315.5,264.2L317.3,261.8L325.8,259.2L334.2,277.9L347.2,289.6L350.9,295.4L359.4,299.6L362.4,307.7L350.1,323.0L348.1,318.5L341.5,314.6L335.8,319.3L337.7,323.7L327.1,327.1Z',
    capitalX: 304.5,
    capitalY: 289.9,
    labelX: 317.3,
    labelY: 299,
  },
  {
    id: 'molise',
    name: 'Molise',
    capital: 'Campobasso',
    macroRegion: 'sud',
    populationWeight: 0.005,
    cameraSeats: 2,
    senatoSeats: 2,
    hqCost: 15500,
    hqWeeklyUpkeep: 750,
    hqWeeklyGrowth: 0.4,
    hqMembershipIncome: 1050,
    path: 'M347.1,341.4L334.7,337.3L332.9,340.7L334.4,344.0L331.4,343.8L328.5,338.1L330.8,336.4L330.1,331.7L327.1,327.1L337.7,323.7L335.8,319.3L341.5,314.6L348.1,318.5L350.1,323.0L362.2,305.6L377.2,313.6L375.6,322.8L378.2,325.9L372.5,330.8L368.7,331.0L368.8,336.2L371.7,338.5L365.7,341.9L362.4,340.4L354.8,345.4L347.1,341.4Z',
    capitalX: 357,
    capitalY: 334.4,
    labelX: 350.6,
    labelY: 331.3,
  },
  {
    id: 'campania',
    name: 'Campania',
    capital: 'Napoli',
    macroRegion: 'sud',
    populationWeight: 0.095,
    cameraSeats: 38,
    senatoSeats: 18,
    hqCost: 31500,
    hqWeeklyUpkeep: 2400,
    hqWeeklyGrowth: 0.25,
    hqMembershipIncome: 3300,
    path: 'M333.2,340.0L334.7,337.3L336.5,338.9L339.7,337.9L354.8,345.4L362.4,340.4L365.7,341.9L371.7,338.5L375.6,341.7L374.4,347.2L383.1,352.2L380.2,357.5L383.2,360.4L388.0,359.9L394.4,362.9L393.5,371.1L390.7,373.3L386.2,372.5L387.2,375.1L385.4,375.2L387.3,376.5L387.4,381.4L392.5,384.8L390.2,387.9L394.0,390.2L394.0,394.7L405.2,406.8L398.7,417.7L399.7,419.1L393.3,418.1L389.0,422.7L382.8,420.9L382.8,418.0L377.0,412.5L372.9,412.5L367.7,408.4L371.4,400.3L362.7,384.8L351.7,388.0L349.9,386.8L343.2,390.1L343.8,386.9L349.6,383.0L348.4,379.8L340.9,374.7L337.6,377.5L334.0,375.4L333.3,378.4L331.2,377.6L330.3,369.9L319.7,353.3L325.0,349.1L323.9,342.3L328.6,339.8L331.4,343.8L334.3,344.1L333.2,340.0Z',
    capitalX: 340.8,
    capitalY: 374.2,
    labelX: 364.2,
    labelY: 373.8,
  },
  {
    id: 'puglia',
    name: 'Puglia',
    capital: 'Bari',
    macroRegion: 'sud',
    populationWeight: 0.066,
    cameraSeats: 27,
    senatoSeats: 13,
    hqCost: 26500,
    hqWeeklyUpkeep: 1850,
    hqWeeklyGrowth: 0.3,
    hqMembershipIncome: 2550,
    path: 'M375.5,343.9L375.5,341.4L368.9,336.3L368.7,331.0L372.5,330.8L378.2,325.9L375.6,322.8L377.2,313.7L388.7,315.2L413.9,312.4L419.1,314.4L421.2,322.1L409.2,331.1L411.0,339.3L437.7,354.2L458.9,362.3L475.1,375.5L494.2,383.5L495.9,384.8L493.9,386.1L497.5,386.0L500.3,392.6L514.7,405.7L518.4,414.4L513.9,423.5L513.3,432.4L511.4,433.9L499.0,426.2L495.8,419.2L497.3,416.0L491.1,406.2L476.3,405.6L463.7,399.2L465.5,396.2L459.8,392.9L454.6,394.4L449.3,399.6L443.4,395.1L443.6,382.0L441.0,380.0L436.4,379.5L435.8,381.3L434.2,379.2L430.0,382.3L421.7,370.5L418.3,371.6L412.3,368.2L414.9,363.9L407.8,358.0L404.5,360.9L395.9,360.3L394.1,362.7L388.0,359.9L383.2,360.4L380.1,357.1L383.1,352.2L374.4,347.2L375.5,343.9Z',
    capitalX: 449.7,
    capitalY: 359.3,
    labelX: 435.4,
    labelY: 370.5,
  },
  {
    id: 'basilicata',
    name: 'Basilicata',
    capital: 'Potenza',
    macroRegion: 'sud',
    populationWeight: 0.009,
    cameraSeats: 4,
    senatoSeats: 3,
    hqCost: 16500,
    hqWeeklyUpkeep: 850,
    hqWeeklyGrowth: 0.4,
    hqMembershipIncome: 1150,
    path: 'M390.9,386.5L392.5,384.8L387.4,381.4L386.2,372.5L390.7,373.3L393.5,371.1L394.9,360.9L403.6,361.2L407.8,358.0L414.9,363.9L412.3,368.2L418.3,371.6L421.7,370.5L430.0,382.3L434.2,379.2L435.8,381.3L437.7,379.2L443.6,382.0L443.4,395.1L449.5,399.8L440.2,415.5L430.9,414.1L428.0,427.8L424.4,425.8L422.2,428.0L419.9,426.7L415.3,428.1L414.5,422.5L406.9,421.8L403.0,426.5L398.4,419.8L405.2,406.8L394.0,394.7L394.0,390.2L390.2,387.9L390.9,386.5Z',
    capitalX: 405.1,
    capitalY: 386.1,
    labelX: 413,
    labelY: 392.9,
  },
  {
    id: 'calabria',
    name: 'Calabria',
    capital: 'Catanzaro',
    macroRegion: 'sud',
    populationWeight: 0.031,
    cameraSeats: 13,
    senatoSeats: 6,
    hqCost: 20000,
    hqWeeklyUpkeep: 1300,
    hqWeeklyGrowth: 0.35,
    hqMembershipIncome: 1750,
    path: 'M412.2,452.1L405.6,440.2L403.8,424.3L406.9,421.8L414.1,422.4L415.3,428.1L419.9,426.7L422.2,428.0L424.4,425.8L427.9,427.9L430.9,414.1L439.5,414.8L439.5,424.5L433.7,433.6L434.9,440.8L439.1,443.4L445.5,443.5L461.6,455.8L459.6,472.4L463.7,476.8L459.0,484.5L453.0,481.9L439.0,488.6L435.6,494.6L436.9,511.1L426.6,518.5L420.2,527.1L415.9,538.9L403.4,539.4L398.1,534.4L397.9,522.2L404.6,518.9L409.4,509.7L410.4,503.9L406.4,498.4L412.7,494.0L419.1,494.2L422.4,487.5L422.3,482.7L417.4,476.8L412.2,452.1Z',
    capitalX: 437.8,
    capitalY: 483.5,
    labelX: 424.9,
    labelY: 470.2,
  },
  {
    id: 'sicilia',
    name: 'Sicilia',
    capital: 'Palermo',
    macroRegion: 'isole',
    populationWeight: 0.082,
    cameraSeats: 32,
    senatoSeats: 16,
    hqCost: 29500,
    hqWeeklyUpkeep: 2100,
    hqWeeklyGrowth: 0.3,
    hqMembershipIncome: 2900,
    path: 'M283.9,533.3L291.0,529.8L290.0,527.0L292.2,524.0L295.8,525.2L300.9,522.1L303.8,528.6L310.3,528.4L311.4,532.5L318.9,536.4L330.6,532.4L341.7,534.3L351.4,532.4L356.2,530.6L360.9,525.4L367.9,523.9L375.5,527.9L380.3,524.3L380.8,519.5L383.7,523.1L394.1,517.8L398.7,519.6L395.8,520.9L392.1,530.5L380.4,548.4L378.8,558.6L375.0,563.9L375.6,573.2L382.1,577.4L381.1,579.8L379.2,577.7L379.2,580.0L381.3,584.5L383.8,585.0L383.0,588.8L385.5,590.6L382.6,590.9L376.1,599.4L376.9,609.8L374.8,610.8L367.0,606.2L358.9,606.9L350.2,603.0L340.4,587.7L332.9,584.8L325.2,585.5L319.2,582.6L311.0,574.9L306.5,574.3L299.1,569.0L294.9,563.3L288.6,563.1L285.5,558.8L273.7,559.1L271.2,554.8L265.9,551.7L263.7,545.9L266.3,541.8L266.6,533.8L275.6,528.6L276.6,524.0L283.9,533.3Z M244.0,600.0L248.0,602.4L247.1,605.9L242.9,602.2L244.0,600.0Z',
    capitalX: 302.9,
    capitalY: 528.2,
    labelX: 337.2,
    labelY: 554.9,
  },
  {
    id: 'sardegna',
    name: 'Sardegna',
    capital: 'Cagliari',
    macroRegion: 'isole',
    populationWeight: 0.027,
    cameraSeats: 11,
    senatoSeats: 5,
    hqCost: 19500,
    hqWeeklyUpkeep: 1250,
    hqWeeklyGrowth: 0.35,
    hqMembershipIncome: 1700,
    path: 'M94.0,394.2L91.0,388.8L87.1,390.1L86.8,387.3L85.5,390.6L84.9,389.2L87.2,383.9L84.2,381.0L87.8,373.2L87.1,367.4L91.8,374.6L102.1,375.4L107.9,370.7L111.8,370.1L121.0,358.9L127.5,356.4L126.5,352.0L129.9,351.3L131.9,354.9L132.5,353.5L138.2,355.9L138.9,360.0L142.7,357.3L144.3,359.7L141.6,365.4L143.9,363.7L143.7,365.7L148.3,366.0L146.0,365.7L144.5,369.9L141.5,370.7L147.4,370.4L146.3,372.1L150.9,374.7L148.6,378.0L155.1,392.4L152.4,400.2L146.6,408.0L147.9,414.1L151.2,417.8L145.5,458.6L147.0,461.6L142.4,473.1L132.9,466.4L123.4,467.2L120.8,471.5L122.7,473.6L121.6,478.4L114.4,485.4L108.8,482.0L105.4,486.0L102.3,475.9L98.2,475.3L96.0,481.0L93.3,474.2L94.1,472.0L98.2,475.2L99.1,473.7L94.1,466.3L96.9,462.1L94.3,457.4L98.3,444.7L97.2,435.8L99.7,438.2L102.5,429.8L99.2,427.2L96.9,430.1L95.3,427.6L96.0,421.2L94.4,420.1L99.3,417.3L98.9,406.7L94.7,403.1L94.0,394.2Z',
    capitalX: 125.6,
    capitalY: 465.8,
    labelX: 116.2,
    labelY: 410.9,
  }
];

export const REGION_MAP_BY_ID: Record<RegionId, ItalianRegionMeta> =
  ITALIAN_REGIONS.reduce((acc, r) => {
    acc[r.id] = r;
    return acc;
  }, {} as Record<RegionId, ItalianRegionMeta>);

/** Calculates exact cost, weekly upkeep, monthly upkeep, weekly local consensus boost, and membership income for a region at a given chapter tier */
export function getRegionChapterMetrics(region: ItalianRegionMeta, level: ChapterLevel) {
  const tier = CHAPTER_TIERS[level] ?? CHAPTER_TIERS[0];
  const nextLevel = (level < 3 ? level + 1 : null) as ChapterLevel | null;
  const nextTier = nextLevel ? CHAPTER_TIERS[nextLevel] : null;

  const openOrUpgradeCost = nextTier
    ? Math.round((region.hqCost * nextTier.costMultiplier) / 500) * 500
    : 0;
  const weeklyUpkeep = Math.round((region.hqWeeklyUpkeep * tier.upkeepMultiplier) / 50) * 50;
  const monthlyUpkeep = weeklyUpkeep * 4;
  const weeklyMembershipIncome =
    Math.round((region.hqMembershipIncome * tier.membershipMultiplier) / 50) * 50;
  const weeklyNetBalance = weeklyMembershipIncome - weeklyUpkeep;
  const weeklyConsensusBoost = Number((region.hqWeeklyGrowth * tier.growthMultiplier).toFixed(2));
  const weeklyNewMembers = Math.round(
    tier.weeklyNewMembers * (0.75 + region.populationWeight * 4.5)
  );

  return {
    tier,
    nextTier,
    nextLevel,
    openOrUpgradeCost,
    weeklyUpkeep,
    monthlyUpkeep,
    weeklyMembershipIncome,
    weeklyNetBalance,
    weeklyConsensusBoost,
    weeklyNewMembers,
    ballotSigBonus: tier.ballotSigBonus,
    referendumSigBonus: tier.referendumSigBonus,
  };
}

import { CrisisEvent } from '../types/game';

/**
 * 34 nuovi dossier realistici sulla politica italiana contemporanea
 * (Economia & Lavoro, Sanità & Scuola, Territorio & Infrastrutture, Istituzioni, Media, Campagna & Esteri)
 * con filtri contestuali dinamici (governo, opposizione, extraparlamentare, campagna, spread alto).
 */
export const EXPANDED_DOSSIERS: CrisisEvent[] = [
  // ============================================================================
  // ECONOMIA & LAVORO (9 dossier)
  // ============================================================================
  {
    id: 'ev_caro_affitti_studenti',
    category: 'Società',
    severity: 'Alta',
    context: 'any',
    title: 'Caro affitti: studenti in tenda davanti agli atenei di Milano, Roma e Bologna',
    summary:
      'Una stanza singola supera i 700 euro al mese nelle città universitarie. Rettorati, sindaci e associazioni studentesche chiedono misure immediate sugli affitti brevi e sugli studentati.',
    options: [
      {
        id: 'tetto_affitti_brevi',
        label: 'Stretta sugli affitti brevi turistici e fondi per studentati pubblici',
        stance: 'Sociale / Studenti',
        description:
          'Limitare le locazioni turistiche nei centri storici e finanziare 50.000 nuovi posti letto pubblici.',
        budgetDelta: -8000,
        demoEffects: { giovani: 2.1, lavoratori: 0.9, imprese: -1.1, pensionati: -0.4 },
        regionEffects: { centro: 0.7, nord_ovest: 0.6 },
        axisShift: { economic: -6, society: 4 },
        stateEffects: { spread: 5, socialStability: 4 },
        loyaltyDelta: 2,
        headlineResult:
          'Applausi dalle tende universitarie per la stretta sugli affitti brevi; protestano i piccoli proprietari.',
        rivalReaction: 'Un attacco ideologico alla proprietà privata che blocca il mercato immobiliare.',
      },
      {
        id: 'cedolare_agevolata_proprietari',
        label: 'Cedolare secca ridotta al 10% per chi affitta a studenti a canone concordato',
        stance: 'Liberale / Incentivi',
        description:
          'Premiare fiscalmente i proprietari che stipulano contratti calmierati senza imporre divieti.',
        budgetDelta: -5000,
        demoEffects: { imprese: 1.2, giovani: 0.9, pensionati: 0.8, lavoratori: 0.3 },
        regionEffects: { nord_ovest: 0.5, nord_est: 0.6 },
        axisShift: { economic: 5 },
        stateEffects: { spread: 2, socialStability: 2 },
        loyaltyDelta: 1,
        headlineResult:
          'Soluzione fiscale sugli affitti: apprezzamento dei proprietari, studenti divisi sull’efficacia.',
        rivalReaction: 'Sgravi timidi che non risolvono l’emergenza delle stanze a prezzi proibitivi.',
      },
      {
        id: 'bonus_affitto_merito',
        label: 'Voucher affitto diretto per studenti fuori sede ISEE basso con merito',
        stance: 'Pragmatico / Famiglie',
        description:
          'Sostegno diretto alle famiglie del Sud che mantengono figli negli atenei del Centro-Nord.',
        budgetDelta: -6000,
        demoEffects: { giovani: 1.4, lavoratori: 0.8, pensionati: 0.5, imprese: -0.2 },
        regionEffects: { sud: 1.0, isole: 0.9 },
        axisShift: { economic: -2 },
        stateEffects: { spread: 4, socialStability: 3 },
        loyaltyDelta: 1,
        headlineResult:
          'Via al voucher fuori sede: sollievo per le famiglie del Mezzogiorno, critiche sul costo strutturale.',
        rivalReaction: 'I bonus a pioggia rischiano solo di far salire ancora i canoni di mercato.',
      },
    ],
  },
  {
    id: 'ev_crisi_automotive_stella',
    category: 'Lavoro',
    severity: 'Critica',
    context: 'any',
    title: 'Crisi automotive: crolla la produzione negli stabilimenti italiani, indotto a rischio',
    summary:
      'Tra Mirafiori, Melfi e Pomigliano scatta nuova cassa integrazione. I sindacati metalmeccanici e migliaia di PMI della componentistica chiedono un piano industriale urgente.',
    options: [
      {
        id: 'tavolo_vincoli_occupazione',
        label: 'Incentivi auto solo vincolati alla produzione e ai livelli occupazionali in Italia',
        stance: 'Sovranità Industriale',
        description:
          'Legare ogni euro pubblico al mantenimento degli stabilimenti italiani e convocare i vertici del gruppo.',
        budgetDelta: -9000,
        demoEffects: { lavoratori: 2.0, imprese: 0.9, pensionati: 0.6, giovani: 0.3 },
        regionEffects: { nord_ovest: 1.2, sud: 1.1 },
        axisShift: { economic: -5, europe: -3 },
        stateEffects: { spread: 5, socialStability: 5, euRelations: -3 },
        loyaltyDelta: 3,
        headlineResult:
          'Linea dura sull’automotive: sindacati e operai di Torino e Melfi applaudono i vincoli produttivi.',
        rivalReaction: 'Attenzione a non far scappare gli investitori esteri con clausole rigide.',
      },
      {
        id: 'stop_multe_ue_green_auto',
        label: 'Chiedere a Bruxelles la revisione dello stop ai motori endotermici al 2035',
        stance: 'Difesa Filiere / Anti-Vincoli',
        description:
          'Spingere per la neutralità tecnologica e i biocarburanti per salvare l’indotto meccanico.',
        budgetDelta: -4000,
        demoEffects: { imprese: 1.9, lavoratori: 1.1, pensionati: 0.7, giovani: -1.3 },
        regionEffects: { nord_est: 0.8, nord_ovest: 0.9 },
        axisShift: { economic: 4, europe: -7, society: -4 },
        stateEffects: { euRelations: -7, socialStability: 2 },
        loyaltyDelta: 2,
        headlineResult:
          'Scontro con Bruxelles sull’auto 2035: plaude la filiera meccanica, critiche dagli ambientalisti.',
        rivalReaction: 'Rallentare la transizione regalerà il mercato dell’auto elettrica alla Cina.',
      },
      {
        id: 'fondo_riqualificazione_elettrico',
        label: 'Patto europeo per gigafactory, batterie e riqualificazione dei lavoratori',
        stance: 'Europeista / Transizione',
        description:
          'Attrarre nuovi costruttori elettrici con investimenti su formazione e infrastrutture di ricarica.',
        budgetDelta: -7000,
        demoEffects: { giovani: 1.5, imprese: 0.8, lavoratori: 0.4, pensionati: -0.4 },
        regionEffects: { nord_ovest: 0.6, centro: 0.5 },
        axisShift: { europe: 6, society: 5 },
        stateEffects: { euRelations: 6, spread: -3 },
        loyaltyDelta: 0,
        headlineResult:
          'Scommessa sulla transizione elettrica: apprezzamento UE, ma i sindacati temono i tempi lunghi.',
        rivalReaction: 'Belle parole sul futuro mentre le fabbriche svuotano i reparti oggi.',
      },
    ],
  },
  {
    id: 'ev_sciopero_trasporti_venerdi',
    category: 'Lavoro',
    severity: 'Alta',
    context: 'governo',
    title: 'Venerdì nero nei trasporti: sciopero nazionale di treni, metro e bus',
    summary:
      'I sindacati dei trasporti incrociano le braccia per 24 ore su salari e sicurezza a bordo. Milioni di pendolari restano bloccati e le associazioni dei consumatori protestano.',
    options: [
      {
        id: 'precettazione_ridotta',
        label: 'Ridurre lo sciopero a 4 ore con ordinanza di precettazione',
        stance: 'Ordine / Pendolari',
        description:
          'Garantire la mobilità nelle fasce di punta sfidando lo scontro frontale con le sigle sindacali.',
        budgetDelta: -3000,
        demoEffects: { imprese: 1.6, pensionati: 1.0, lavoratori: -1.6, giovani: -0.5 },
        axisShift: { economic: 6, institutions: 6, society: -4 },
        stateEffects: { socialStability: -6, spread: -2 },
        loyaltyDelta: 2,
        headlineResult:
          'Scatta la precettazione sui trasporti: sollievo per pendolari e imprese, ira dei sindacati.',
        rivalReaction: 'Si comprime il diritto costituzionale di sciopero invece di rinnovare i contratti.',
      },
      {
        id: 'tavolo_rinnovo_contratto',
        label: 'Aprire un tavolo d’urgenza al Ministero con fondi per sicurezza e rinnovi',
        stance: 'Dialogo / Mediazione',
        description:
          'Disinnescare lo scontro impegnandosi sul rinnovo del contratto autoferrotranvieri.',
        budgetDelta: -8500,
        demoEffects: { lavoratori: 1.5, giovani: 0.6, pensionati: 0.5, imprese: -0.6 },
        axisShift: { economic: -4, institutions: -3 },
        stateEffects: { socialStability: 6, spread: 5 },
        loyaltyDelta: 1,
        headlineResult:
          'Intesa lampo sui trasporti: tensione in calo, ma il Tesoro avverte sui conti pubblici.',
        rivalReaction: 'Una resa costosa che incoraggia nuove agitazioni in altri comparti.',
      },
      {
        id: 'riforma_fasce_garanzia',
        label: 'Proporre una legge bipartisan per rafforzare le fasce di garanzia e i rimborsi',
        stance: 'Istituzionale / Equilibrio',
        description:
          'Tutelare il diritto di sciopero introducendo rimborsi automatici e regole certe per i pendolari.',
        budgetDelta: -4000,
        demoEffects: { imprese: 0.7, lavoratori: 0.3, pensionati: 0.7, giovani: 0.4 },
        axisShift: { institutions: -2 },
        stateEffects: { socialStability: 2, democraticHealth: 2 },
        loyaltyDelta: 0,
        headlineResult:
          'Linea equilibrata sulle fasce di garanzia: apprezzata dai consumatori, tiepidi i sindacati.',
        rivalReaction: 'Soluzione interlocutoria che non risolve né i salari né i disagi.',
      },
    ],
  },
  {
    id: 'ev_concessioni_balneari_bolkestein',
    category: 'Unione Europea',
    severity: 'Alta',
    context: 'governo',
    title: 'Concessioni balneari: ultimatum di Bruxelles sulle gare e protesta delle spiagge',
    summary:
      'La Commissione Europea minaccia sanzioni milionarie sull’applicazione della direttiva Bolkestein. I gestori degli stabilimenti minacciano la chiusura degli ombrelloni.',
    options: [
      {
        id: 'gare_trasparenti_indennizzi',
        label: 'Avviare le gare pubbliche con indennizzi equi per i gestori uscenti',
        stance: 'Europeista / Concorrenza',
        description:
          'Chiudere la procedura d’infrazione UE garantendo spiagge libere e tutele agli investimenti fatti.',
        budgetDelta: -5000,
        demoEffects: { giovani: 1.4, lavoratori: 0.8, imprese: -1.3, pensionati: 0.2 },
        axisShift: { europe: 7, economic: 3 },
        stateEffects: { euRelations: 9, spread: -5, socialStability: -2 },
        loyaltyDelta: -1,
        headlineResult:
          'Accordo con Bruxelles sulle gare balneari: stop alle multe UE, ma ribollono le categorie costiere.',
        rivalReaction: 'Hanno svenduto alle multinazionali migliaia di imprese familiari italiane.',
      },
      {
        id: 'difesa_proroga_mappatura',
        label: 'Difendere i balneari italiani con mappatura delle coste e proroga tecnica',
        stance: 'Protezionista / Categorie',
        description:
          'Sostenere che la risorsa spiaggia non è scarsa e sfidare la procedura d’infrazione europea.',
        budgetDelta: -4000,
        demoEffects: { imprese: 1.5, pensionati: 0.4, giovani: -1.1, lavoratori: -0.6 },
        regionEffects: { nord_est: 0.6, centro: 0.6, sud: 0.5 },
        axisShift: { europe: -8, society: -2 },
        stateEffects: { euRelations: -9, spread: 6 },
        loyaltyDelta: 2,
        headlineResult:
          'Muro contro muro con Bruxelles sui balneari: entusiasmo degli stabilimenti, rischio sanzioni UE.',
        rivalReaction: 'L’ennesimo rinvio illegittimo che costerà caro ai contribuenti italiani.',
      },
      {
        id: 'quota_spiagge_libere_comuni',
        label: 'Delega ai Comuni con obbligo di 40% di spiagge libere e premialità locali',
        stance: 'Territoriale / Compromesso',
        description:
          'Affidare bandi rapidi ai sindaci tutelando le imprese locali e allargando gli arenili gratuiti.',
        budgetDelta: -4500,
        demoEffects: { giovani: 0.9, lavoratori: 0.9, imprese: 0.2, pensionati: 0.5 },
        axisShift: { europe: 2 },
        stateEffects: { euRelations: 4, socialStability: 3 },
        loyaltyDelta: 1,
        headlineResult:
          'Compromesso sui bandi comunali e spiagge libere: soluzione accolta con favore dai cittadini.',
        rivalReaction: 'Scaricare tutto sui sindaci creerà caos tra un Comune e l’altro.',
      },
    ],
  },
  {
    id: 'ev_taglio_cuneo_rinnovo',
    category: 'Economia',
    severity: 'Critica',
    context: 'governo',
    title: 'Coperture in bilico per il taglio del cuneo fiscale: allarme buste paga',
    summary:
      'Senza 10 miliardi di nuove risorse strutturali, milioni di dipendenti rischiano di perdere fino a 100 euro netti al mese in busta paga dal prossimo anno.',
    options: [
      {
        id: 'conferma_taglio_spese_ministeri',
        label: 'Rendere strutturale il taglio del cuneo tagliando spese e bonus inefficienti',
        stance: 'Pragmatico / Rigore',
        description:
          'Salvare le buste paga senza aumentare il deficit tramite una spending review decisa.',
        budgetDelta: -5000,
        demoEffects: { lavoratori: 1.7, imprese: 0.9, pensionati: -0.3, giovani: 0.6 },
        axisShift: { economic: 4, europe: 4 },
        stateEffects: { spread: -7, socialStability: 4, euRelations: 5 },
        loyaltyDelta: 1,
        headlineResult:
          'Taglio del cuneo reso strutturale con coperture solide: mercati e dipendenti tirano un sospiro di sollievo.',
        rivalReaction: 'I tagli lineari colpiranno i servizi essenziali di Comuni e ministeri.',
      },
      {
        id: 'copertura_extraprofitti_banche',
        label: 'Finanziare le buste paga con un contributo di solidarietà su banche e assicurazioni',
        stance: 'Redistributivo / Popolare',
        description:
          'Chiedere un contributo straordinario agli istituti di credito per sostenere salari medio-bassi.',
        budgetDelta: 0,
        demoEffects: { lavoratori: 2.0, pensionati: 1.0, giovani: 0.8, imprese: -1.7 },
        axisShift: { economic: -7 },
        stateEffects: { spread: 9, socialStability: 5, euRelations: -3 },
        loyaltyDelta: 2,
        headlineResult:
          'Contributo sulle banche per salvare il cuneo: consenso popolare alto, scivolone in Borsa.',
        rivalReaction: 'Tassare il credito significa rendere più cari i mutui per le famiglie.',
      },
      {
        id: 'deficit_temporaneo_crescita',
        label: 'Prorogare il taglio in deficit chiedendo flessibilità a Bruxelles',
        stance: 'Espansivo / Rischio',
        description:
          'Evitare nuove tasse o tagli scommettendo sulla crescita del PIL, ma esponendosi ai mercati.',
        budgetDelta: -3000,
        demoEffects: { lavoratori: 1.3, imprese: 0.6, pensionati: 0.6, giovani: 0.2 },
        axisShift: { economic: -2, europe: -5 },
        stateEffects: { spread: 14, euRelations: -6, socialStability: 2 },
        loyaltyDelta: 2,
        headlineResult:
          'Cuneo prorogato in deficit: tensioni sullo Spread e richiamo immediato dalla Commissione UE.',
        rivalReaction: 'Un altro anno di debito scaricato sulle spalle delle nuove generazioni.',
      },
    ],
  },
  {
    id: 'ev_inflazione_carrello_spesa',
    category: 'Economia',
    severity: 'Alta',
    context: 'any',
    title: 'Stangata sul carrello della spesa: alimentari +18% in due anni',
    summary:
      'I dati ISTAT certificano una forte erosione del potere d’acquisto su pane, pasta, olio e beni di prima necessità. Famiglie e pensionati chiedono interventi concreti.',
    options: [
      {
        id: 'taglio_iva_beni_primari',
        label: 'Azzerare l’IVA su pane, latte, pasta e prodotti per l’infanzia',
        stance: 'Sociale / Famiglie',
        description:
          'Intervento fiscale diretto sui beni essenziali per dare respiro immediato a tutte le famiglie.',
        budgetDelta: -9000,
        demoEffects: { pensionati: 1.9, lavoratori: 1.6, giovani: 0.8, imprese: -0.3 },
        regionEffects: { sud: 0.8, isole: 0.7 },
        axisShift: { economic: -5 },
        stateEffects: { spread: 8, socialStability: 5 },
        loyaltyDelta: 2,
        headlineResult:
          'Proposta shock sull’IVA a zero per i beni primari: forte sostegno tra famiglie e pensionati.',
        rivalReaction: 'Misura da miliardi senza coperture certe che rischia di favorire la grande distribuzione.',
      },
      {
        id: 'patto_antitrust_filiera',
        label: 'Potenziare l’Antitrust contro le speculazioni lungo la filiera agroalimentare',
        stance: 'Regolatore / Controlli',
        description:
          'Sanzionare i rincari ingiustificati tra campo e scaffale e pubblicare i prezzi medi trasparenti.',
        budgetDelta: -3500,
        demoEffects: { lavoratori: 1.1, pensionati: 1.0, imprese: 0.3, giovani: 0.5 },
        axisShift: { economic: -1, institutions: -2 },
        stateEffects: { spread: -2, socialStability: 3 },
        loyaltyDelta: 1,
        headlineResult:
          'Stretta Antitrust sul carrello della spesa: plauso dei consumatori e degli agricoltori.',
        rivalReaction: 'I controlli non bastano se non si abbassano i costi energetici delle aziende.',
      },
      {
        id: 'carta_spesa_mirata_isee',
        label: 'Carta spesa mirata solo per redditi bassi e riduzione accise carburanti',
        stance: 'Pragmatico / Mirato',
        description:
          'Concentrare le risorse sulle fasce davvero vulnerabili e tagliare i costi logistici su gomma.',
        budgetDelta: -6000,
        demoEffects: { imprese: 1.1, pensionati: 1.0, lavoratori: 0.7, giovani: 0.2 },
        axisShift: { economic: 3 },
        stateEffects: { spread: 2, socialStability: 2 },
        loyaltyDelta: 1,
        headlineResult:
          'Sostegno mirato su ISEE e trasporti: scelta prudente sui conti, criticata dal ceto medio.',
        rivalReaction: 'Il ceto medio schiacciato dall’inflazione resta ancora una volta escluso.',
      },
    ],
  },
  {
    id: 'ev_fuga_cervelli_ricercatori',
    category: 'Lavoro',
    severity: 'Media',
    context: 'any',
    title: 'Fuga dei cervelli: record di 100.000 giovani laureati emigrati all’estero',
    summary:
      'Stipendi d’ingresso fermi e carriere lente spingono ingegneri, medici e ricercatori verso Germania, Svizzera e Regno Unito. Il Paese perde capitale umano decisivo.',
    options: [
      {
        id: 'piano_rientro_fiscale_ricerca',
        label: 'Rientro cervelli rafforzato e sgravi fiscali per under 35 ad alta qualifica',
        stance: 'Innovazione / Meritocrazia',
        description:
          'Detassare il reddito per 5 anni ai giovani ricercatori e tecnici che rientrano o restano in Italia.',
        budgetDelta: -6500,
        demoEffects: { giovani: 2.2, imprese: 1.2, lavoratori: 0.4, pensionati: -0.4 },
        regionEffects: { nord_ovest: 0.6, centro: 0.5 },
        axisShift: { economic: 4, europe: 4 },
        stateEffects: { spread: 2, euRelations: 4 },
        loyaltyDelta: 2,
        headlineResult:
          'Piano Rientro Cervelli: grande entusiasmo tra studenti e startup tecnologiche.',
        rivalReaction: 'Sconti fiscali per pochi mentre il resto dei lavoratori paga tasse piene.',
      },
      {
        id: 'stipendi_universita_dottorati',
        label: 'Aumentare borse di dottorato, ricercatori e laboratori pubblici nazionali',
        stance: 'Pubblico / Conoscenza',
        description:
          'Investire direttamente su atenei, CNR e stabilizzazione dei ricercatori precari.',
        budgetDelta: -7500,
        demoEffects: { giovani: 2.0, lavoratori: 1.0, imprese: 0.3, pensionati: 0.2 },
        regionEffects: { sud: 0.7, centro: 0.6 },
        axisShift: { economic: -5, society: 4 },
        stateEffects: { spread: 5, socialStability: 3 },
        loyaltyDelta: 2,
        headlineResult:
          'Rilancio della ricerca pubblica: plauso dei rettori e dei sindacati universitari.',
        rivalReaction: 'Servono più aziende innovative e stipendi privati competitivi, non solo concorsi.',
      },
      {
        id: 'hub_startup_sburocratizzazione',
        label: 'Eliminare la burocrazia per startup e fondi di venture capital italiani',
        stance: 'Liberale / Impresa',
        description:
          'Semplificare l’avvio di imprese hi-tech e defiscalizzare gli investimenti privati in innovazione.',
        budgetDelta: -4000,
        demoEffects: { imprese: 1.7, giovani: 1.1, lavoratori: -0.2, pensionati: -0.3 },
        regionEffects: { nord_ovest: 0.8, nord_est: 0.6 },
        axisShift: { economic: 7, europe: 3 },
        stateEffects: { spread: -3, euRelations: 3 },
        loyaltyDelta: 1,
        headlineResult:
          'Pacchetto pro-startup e venture capital: plaudono gli investitori, freddi i sindacati.',
        rivalReaction: 'Senza tutele salariali di base i giovani continueranno a partire.',
      },
    ],
  },
  {
    id: 'ev_spread_asta_btp_tensione',
    category: 'Economia',
    severity: 'Critica',
    context: 'governo',
    minSpread: 145,
    title: 'Tensione sui mercati: lo Spread BTP-Bund corre, asta dei titoli sotto pressione',
    summary:
      'Gli investitori internazionali chiedono rendimenti più alti sul debito italiano. Le agenzie di rating osservano da vicino la tenuta dei conti pubblici.',
    options: [
      {
        id: 'segnale_rigore_conti',
        label: 'Annunciare un decreto di correzione dei conti e dialogo stretto con la BCE',
        stance: 'Rigore / Credibilità',
        description:
          'Congelare le spese non urgenti per raffreddare immediatamente i rendimenti dei BTP.',
        budgetDelta: 0,
        demoEffects: { imprese: 1.1, pensionati: -0.7, lavoratori: -0.9, giovani: -0.3 },
        axisShift: { economic: 6, europe: 6 },
        stateEffects: { spread: -18, euRelations: 8, socialStability: -4 },
        loyaltyDelta: -2,
        headlineResult:
          'Lo Spread cala di colpo dopo il segnale di rigore del Governo; protestano le categorie colpite dai tagli.',
        rivalReaction: 'Ecco il ritorno dell’austerità sulla pelle delle famiglie.',
      },
      {
        id: 'btp_valore_risparmiatori',
        label: 'Lanciare una grande emissione BTP Italia riservata ai risparmiatori nazionali',
        stance: 'Patriottismo Economico',
        description:
          'Coinvolgere il risparmio privato italiano per ridurre la dipendenza dai fondi speculativi esteri.',
        budgetDelta: -6000,
        demoEffects: { pensionati: 1.5, imprese: 0.8, lavoratori: 0.7, giovani: 0.2 },
        axisShift: { economic: 1, europe: -2 },
        stateEffects: { spread: -8, socialStability: 3 },
        loyaltyDelta: 2,
        headlineResult:
          'Boom di sottoscrizioni per il BTP Valore: il risparmio delle famiglie fa da scudo allo Spread.',
        rivalReaction: 'Soluzione tampone che non riduce lo stock del debito pubblico.',
      },
      {
        id: 'sfida_speculazione_rating',
        label: 'Denunciare pubblicamente la speculazione finanziaria e rivendicare la spesa sociale',
        stance: 'Sovranista / Scontro',
        description:
          'Respingere i diktat delle agenzie di rating per non cedere sugli impegni elettorali.',
        budgetDelta: -4000,
        demoEffects: { lavoratori: 1.0, pensionati: 0.5, imprese: -1.6, giovani: -0.7 },
        axisShift: { economic: -5, europe: -9 },
        stateEffects: { spread: 16, euRelations: -9, socialStability: -2 },
        loyaltyDelta: 3,
        headlineResult:
          'Scontro frontale con i mercati: la base applaude la fermezza, ma lo Spread balza ancora.',
        rivalReaction: 'Irresponsabilità pura: ogni punto di Spread costa miliardi di interessi in più.',
      },
    ],
  },
  {
    id: 'ev_crisi_pmi_credito_banche',
    category: 'Economia',
    severity: 'Media',
    context: 'opposizione',
    title: 'Stretta sul credito bancario: PMI e artigiani denunciano tassi proibitivi',
    summary:
      'Le associazioni degli artigiani e del commercio lanciano l’allarme: i prestiti alle piccole imprese calano del 7% e i margini si assottigliano.',
    options: [
      {
        id: 'proposta_garanzia_pubblica_pmi',
        label: 'Presentare un piano di opposizione per rifinanziare il Fondo di Garanzia PMI',
        stance: 'Pro-Imprese / Costruttivo',
        description:
          'Incalzare il Governo con proposte concrete per sbloccare liquidità a tasso agevolato.',
        budgetDelta: -4500,
        demoEffects: { imprese: 1.8, lavoratori: 0.5, pensionati: 0.2 },
        regionEffects: { nord_est: 0.8, nord_ovest: 0.7 },
        axisShift: { economic: 4 },
        stateEffects: { spread: 1, socialStability: 2 },
        loyaltyDelta: 2,
        headlineResult:
          'L’opposizione conquista l’attenzione delle categorie produttive con il piano credito PMI.',
        rivalReaction: 'Proposte facili da scrivere quando non si devono quadrare i bilanci dello Stato.',
      },
      {
        id: 'attacco_extra_profitti_banche',
        label: 'Chiedere una commissione d’inchiesta sui margini record delle banche italiane',
        stance: 'Popolare / Battagliero',
        description:
          'Denunciare il divario tra i tassi sui mutui e gli interessi quasi zero sui conti correnti.',
        budgetDelta: -3000,
        demoEffects: { lavoratori: 1.4, pensionati: 1.2, giovani: 0.7, imprese: -0.5 },
        axisShift: { economic: -6 },
        stateEffects: { socialStability: 1, spread: 3 },
        loyaltyDelta: 2,
        headlineResult:
          'Affondo sulle banche: consenso trasversale tra risparmiatori e famiglie con mutuo.',
        rivalReaction: 'Populismo anti-bancario che spaventa i mercati finanziari.',
      },
      {
        id: 'unione_mercati_capitali_ue',
        label: 'Spiegare la necessità dell’Unione dei Mercati dei Capitali europea per le PMI',
        stance: 'Europeista / Riformista',
        description:
          'Ridurre la dipendenza dal credito bancario aprendo l’accesso ai capitali europei.',
        budgetDelta: -2500,
        demoEffects: { imprese: 1.0, giovani: 0.7, lavoratori: 0.1 },
        axisShift: { economic: 5, europe: 6 },
        stateEffects: { euRelations: 5, spread: -3 },
        loyaltyDelta: 0,
        headlineResult:
          'Profilo europeo sui mercati dei capitali: apprezzato dagli economisti, meno caldo in piazza.',
        rivalReaction: 'Ricetta tecnica lontana dalle urgenze quotidiane degli artigiani.',
      },
    ],
  },

  // ============================================================================
  // SANITÀ, SCUOLA & SOCIALE (8 dossier)
  // ============================================================================
  {
    id: 'ev_pronto_soccorso_collasso',
    category: 'Società',
    severity: 'Critica',
    context: 'any',
    title: 'Pronto soccorso al collasso: attese fino a 18 ore e medici gettonisti alle stelle',
    summary:
      'Le immagini di barelle nei corridoi degli ospedali fanno il giro dei telegiornali. I medici d’urgenza denunciano turni massacranti e aggressioni nei reparti.',
    options: [
      {
        id: 'piano_assunzioni_stop_gettonisti',
        label: 'Sbloccare subito il tetto alle assunzioni nel SSN e abolire i medici gettonisti',
        stance: 'Sanità Pubblica',
        description:
          'Aumentare l’indennità di pronto soccorso e assumere stabilmente medici e infermieri.',
        budgetDelta: -9500,
        demoEffects: { pensionati: 2.1, lavoratori: 1.6, giovani: 0.9, imprese: -0.4 },
        regionEffects: { sud: 0.9, isole: 0.8, centro: 0.5 },
        axisShift: { economic: -5 },
        stateEffects: { spread: 7, socialStability: 6 },
        loyaltyDelta: 2,
        headlineResult:
          'Piano choc per i pronto soccorso: plauso dei medici ospedalieri e dei comitati dei pazienti.',
        rivalReaction: 'Servono miliardi veri in manovra, non solo annunci sull’onda della cronaca.',
      },
      {
        id: 'integrazione_cliniche_accreditate',
        label: 'Coinvolgere cliniche convenzionate e telemedicina per smaltire i codici bianchi',
        stance: 'Sussidiarietà / Rapido',
        description:
          'Alleggerire gli ospedali affidando prestazioni diagnostiche e codici minori al privato accreditato.',
        budgetDelta: -5500,
        demoEffects: { imprese: 1.5, pensionati: 0.9, lavoratori: 0.1, giovani: 0.2 },
        regionEffects: { nord_ovest: 0.7, nord_est: 0.7 },
        axisShift: { economic: 6 },
        stateEffects: { spread: 1, socialStability: 2 },
        loyaltyDelta: 1,
        headlineResult:
          'Apertura alla sanità convenzionata: ok dalle imprese sanitarie, polemiche dei sindacati medici.',
        rivalReaction: 'Così si smantella la sanità pubblica a vantaggio dei grandi gruppi privati.',
      },
      {
        id: 'presidi_polizia_case_salute',
        label: 'Posti fissi di polizia nei pronto soccorso e apertura H24 delle guardie mediche',
        stance: 'Sicurezza / Territorio',
        description:
          'Proteggere il personale sanitario dalle aggressioni e filtrare gli accessi impropri sul territorio.',
        budgetDelta: -6000,
        demoEffects: { pensionati: 1.3, lavoratori: 1.1, imprese: 0.5, giovani: 0.4 },
        axisShift: { society: -3 },
        stateEffects: { socialStability: 4, spread: 3 },
        loyaltyDelta: 2,
        headlineResult:
          'Sicurezza negli ospedali e guardie mediche H24: misura pragmatica ben accolta dal personale.',
        rivalReaction: 'Utile per la sicurezza, ma non risolve la carenza strutturale di personale.',
      },
    ],
  },
  {
    id: 'ev_carenza_medici_base',
    category: 'Territorio',
    severity: 'Alta',
    context: 'any',
    title: 'Deserti sanitari: oltre 4 milioni di cittadini senza medico di base nei piccoli comuni',
    summary:
      'Tra pensionamenti di massa e borse di specializzazione insufficienti, intere aree interne e montane restano senza ambulatorio di medicina generale.',
    options: [
      {
        id: 'incentivi_aree_interne_medici',
        label: 'Indennità di disagiata sede e alloggi comunali per medici nelle aree interne',
        stance: 'Coesione Territoriale',
        description:
          'Rendere attrattivi i piccoli comuni con stipendi maggiorati e ambulatori digitali attrezzati.',
        budgetDelta: -6500,
        demoEffects: { pensionati: 1.8, lavoratori: 1.0, giovani: 0.5 },
        regionEffects: { sud: 0.9, isole: 0.9, centro: 0.6 },
        axisShift: { economic: -3 },
        stateEffects: { socialStability: 5, spread: 4 },
        loyaltyDelta: 2,
        headlineResult:
          'Piano contro i deserti sanitari: esultano i sindaci dei piccoli comuni e le associazioni anziani.',
        rivalReaction: 'Bene gli incentivi locali, ma il problema nasce dalla programmazione nazionale.',
      },
      {
        id: 'superamento_numero_chiuso_medicina',
        label: 'Abolire il numero chiuso a Medicina per raddoppiare i laureati futuri',
        stance: 'Popolare / Accesso Libero',
        description:
          'Aprire le facoltà di Medicina con selezione alla fine del primo semestre.',
        budgetDelta: -5000,
        demoEffects: { giovani: 1.9, pensionati: 0.9, lavoratori: 0.8, imprese: -0.2 },
        axisShift: { society: 2, economic: -2 },
        stateEffects: { socialStability: 3, spread: 3 },
        loyaltyDelta: 1,
        headlineResult:
          'Svolta sul numero chiuso a Medicina: entusiasmo tra gli studenti, perplessità tra i rettori.',
        rivalReaction: 'Senza più borse di specializzazione si creerà solo un nuovo imbuto formativo.',
      },
      {
        id: 'farmacie_servizi_telemedicina',
        label: 'Potenziare la farmacia dei servizi, infermieri di famiglia e ricette digitali',
        stance: 'Modernizzatore / Efficiente',
        description:
          'Sfruttare la rete capillare delle farmacie e la telemedicina per monitorare i pazienti cronici.',
        budgetDelta: -4000,
        demoEffects: { imprese: 1.2, pensionati: 1.1, giovani: 0.6, lavoratori: 0.4 },
        axisShift: { economic: 4, europe: 2 },
        stateEffects: { spread: -2, socialStability: 3 },
        loyaltyDelta: 1,
        headlineResult:
          'Via alla farmacia dei servizi e telemedicina: risposta rapida apprezzata nelle regioni del Nord.',
        rivalReaction: 'Le farmacie non possono sostituire il rapporto diretto con il medico di famiglia.',
      },
    ],
  },
  {
    id: 'ev_riforma_maturita_universita',
    category: 'Società',
    severity: 'Media',
    context: 'any',
    title: 'Scontro su Scuola e Università: voto in condotta, maturità e rincaro rette',
    summary:
      'Cortei studenteschi attraversano le principali città contro la stretta disciplinare nelle scuole superiori e i tagli al diritto allo studio universitario.',
    options: [
      {
        id: 'diritto_studio_no_tax_area',
        label: 'Ampliare la no-tax area universitaria e i libri scolastici gratuiti',
        stance: 'Progressista / Scuola Pubblica',
        description:
          'Abbattere i costi per le famiglie e investire su laboratori, tempo pieno e psicologi scolastici.',
        budgetDelta: -7000,
        demoEffects: { giovani: 2.1, lavoratori: 1.1, pensionati: 0.3, imprese: -0.5 },
        axisShift: { economic: -4, society: 5 },
        stateEffects: { spread: 4, socialStability: 4 },
        loyaltyDelta: 2,
        headlineResult:
          'Rilancio del diritto allo studio: studenti e docenti apprezzano l’ampliamento della no-tax area.',
        rivalReaction: 'Più spesa senza alcun criterio di merito né valutazione dei risultati.',
      },
      {
        id: 'merito_disciplina_filiera_tecnica',
        label: 'Difendere autorevolezza dei docenti, voto in condotta e filiera tecnico-professionale',
        stance: 'Conservatore / Merito',
        description:
          'Rafforzare la disciplina in classe e legare gli istituti tecnici direttamente alle esigenze aziendali.',
        budgetDelta: -3500,
        demoEffects: { imprese: 1.4, pensionati: 1.2, lavoratori: 0.5, giovani: -1.2 },
        axisShift: { society: -5, economic: 4 },
        stateEffects: { socialStability: -1, spread: -1 },
        loyaltyDelta: 2,
        headlineResult:
          'Linea dura sul merito e sulla condotta: consenso tra genitori e imprese, proteste nei licei.',
        rivalReaction: 'Una scuola punitiva e classista che guarda al passato.',
      },
      {
        id: 'borse_stem_orientamento',
        label: 'Piano bipartisan per competenze digitali, borse STEM e aggiornamento docenti',
        stance: 'Riformista / Innovazione',
        description:
          'Concentrare le risorse sulle materie scientifiche, sull’inglese e sull’orientamento universitario.',
        budgetDelta: -5000,
        demoEffects: { giovani: 1.3, imprese: 1.2, lavoratori: 0.6 },
        axisShift: { europe: 4, economic: 2 },
        stateEffects: { euRelations: 4, spread: -1, socialStability: 2 },
        loyaltyDelta: 1,
        headlineResult:
          'Focus su competenze STEM e lingue: proposta ben accolta da università e mondo produttivo.',
        rivalReaction: 'Bene l’innovazione, ma gli edifici scolastici continuano a cadere a pezzi.',
      },
    ],
  },
  {
    id: 'ev_inverno_demografico_nidi',
    category: 'Società',
    severity: 'Alta',
    context: 'any',
    title: 'Inverno demografico: nascite ai minimi dall’Unità d’Italia, mancano asili nido',
    summary:
      'Il rapporto ISTAT certifica un nuovo crollo della natalità. Due famiglie su tre rinunciano al secondo figlio per costi abitativi, precarietà e carenza di asili nido.',
    options: [
      {
        id: 'nidi_gratuiti_congedo_paritario',
        label: 'Piano nazionale asili nido gratuiti e congedo di paternità paritario',
        stance: 'Welfare Moderno / Parità',
        description:
          'Sostenere l’occupazione femminile e i giovani genitori con servizi pubblici diffusi.',
        budgetDelta: -8500,
        demoEffects: { giovani: 2.0, lavoratori: 1.6, pensionati: 0.4, imprese: -0.5 },
        regionEffects: { sud: 0.9, centro: 0.6 },
        axisShift: { economic: -4, society: 5 },
        stateEffects: { spread: 6, socialStability: 5, euRelations: 3 },
        loyaltyDelta: 2,
        headlineResult:
          'Svolta sugli asili nido gratuiti: entusiasmo tra le giovani coppie e le associazioni familiari.',
        rivalReaction: 'Progetto ambizioso, ma i Comuni non hanno risorse per gestire i nuovi nidi.',
      },
      {
        id: 'quoziente_familiare_detrazioni',
        label: 'Quoziente familiare fiscale e detrazioni crescenti dal secondo figlio in poi',
        stance: 'Famiglia / Fisco',
        description:
          'Ridurre l’IRPEF in base al numero dei componenti del nucleo familiare.',
        budgetDelta: -7000,
        demoEffects: { pensionati: 1.1, lavoratori: 1.2, imprese: 1.0, giovani: 0.9 },
        regionEffects: { nord_est: 0.7, nord_ovest: 0.6 },
        axisShift: { economic: 3, society: -4 },
        stateEffects: { spread: 5, socialStability: 3 },
        loyaltyDelta: 2,
        headlineResult:
          'Via al quoziente familiare: forte approvazione nel ceto medio e tra le famiglie numerose.',
        rivalReaction: 'Le detrazioni non aiutano chi è precario o ha redditi incapienti.',
      },
      {
        id: 'stabilita_lavoro_mutui_giovani',
        label: 'Garanzia pubblica mutui prima casa under 36 e stop ai contratti precari',
        stance: 'Lavoro & Casa / Giovani',
        description:
          'Colpire le cause strutturali della denatalità offrendo casa e stabilità lavorativa ai giovani.',
        budgetDelta: -6500,
        demoEffects: { giovani: 2.1, lavoratori: 1.3, imprese: -0.6 },
        axisShift: { economic: -3, society: 2 },
        stateEffects: { spread: 4, socialStability: 4 },
        loyaltyDelta: 1,
        headlineResult:
          'Pacchetto casa e lavoro stabile per under 36: risposta molto positiva tra i trentenni.',
        rivalReaction: 'Senza taglio delle tasse sulle imprese la stabilità dei contratti resta sulla carta.',
      },
    ],
  },
  {
    id: 'ev_sicurezza_stazioni_ferroviarie',
    category: 'Società',
    severity: 'Alta',
    context: 'any',
    title: 'Emergenza sicurezza nelle stazioni e nei quartieri periferici delle grandi città',
    summary:
      'Episodi ripetuti di rapine e degrado attorno alle principali stazioni ferroviarie accendono il dibattito pubblico. Pendolari e commercianti chiedono interventi immediati.',
    options: [
      {
        id: 'zone_rosse_pattuglie_esercito',
        label: 'Istituire "zone rosse" con pattuglie rafforzate, dash-cam e pene più severe',
        stance: 'Ordine / Tolleranza Zero',
        description:
          'Raddoppiare la presenza delle forze dell’ordine nelle stazioni e velocizzare gli arresti in flagranza.',
        budgetDelta: -5500,
        demoEffects: { pensionati: 1.9, imprese: 1.4, lavoratori: 0.8, giovani: -1.0 },
        regionEffects: { nord_ovest: 0.8, nord_est: 0.7 },
        axisShift: { society: -6, institutions: 4 },
        stateEffects: { socialStability: 3, democraticHealth: -2 },
        loyaltyDelta: 2,
        headlineResult:
          'Stretta sicurezza nelle stazioni: apprezzamento di pendolari e commercianti, dubbi dei garantisti.',
        rivalReaction: 'Militarizzare le città senza prevenzione sociale sposta solo il problema altrove.',
      },
      {
        id: 'rigenerazione_urbana_presidi',
        label: 'Piano di illuminazione, vigili di quartiere e rigenerazione sociale delle periferie',
        stance: 'Prevenzione / Comunità',
        description:
          'Affiancare al controllo del territorio il recupero di spazi abbandonati e centri giovanili.',
        budgetDelta: -6500,
        demoEffects: { giovani: 1.4, lavoratori: 1.0, pensionati: 0.5, imprese: 0.1 },
        regionEffects: { centro: 0.6, sud: 0.6 },
        axisShift: { society: 5, institutions: -3 },
        stateEffects: { socialStability: 4, democraticHealth: 3 },
        loyaltyDelta: 1,
        headlineResult:
          'Proposta di rigenerazione urbana nelle periferie: consenso tra giovani e sindaci progressisti.',
        rivalReaction: 'Buonismo che lascia i cittadini in balia delle baby gang oggi.',
      },
      {
        id: 'assunzioni_polizia_telecamere',
        label: 'Assunzioni straordinarie di polizia locale e sorveglianza intelligente integrata',
        stance: 'Pragmatico / Sicurezza',
        description:
          'Investire su organici di polizia e coordinamento con prefetti e sindaci senza strappi normativi.',
        budgetDelta: -5000,
        demoEffects: { pensionati: 1.2, imprese: 1.0, lavoratori: 0.8, giovani: 0.1 },
        axisShift: { society: -2 },
        stateEffects: { socialStability: 4, spread: 2 },
        loyaltyDelta: 1,
        headlineResult:
          'Piano organici polizia locale e prefetture: equilibrio apprezzato dai sindaci di ogni colore.',
        rivalReaction: 'Servono anche norme più dure sulla certezza della pena.',
      },
    ],
  },
  {
    id: 'ev_sovraffollamento_carceri',
    category: 'Istituzioni',
    severity: 'Alta',
    context: 'governo',
    title: 'Emergenza carceri: sovraffollamento al 130% e richiamo del Capo dello Stato',
    summary:
      'Gli istituti penitenziari esplodono tra carenza di agenti penitenziari e condizioni critiche dei detenuti. Il Quirinale e la Corte Europea sollecitano misure urgenti.',
    options: [
      {
        id: 'misure_alternative_recupero',
        label: 'Ampliare pene alternative per reati minori e investire in lavoro in carcere',
        stance: 'Garantista / Diritti',
        description:
          'Alleggerire subito il sovraffollamento seguendo i principi dell’art. 27 della Costituzione.',
        budgetDelta: -5000,
        demoEffects: { giovani: 1.3, lavoratori: 0.4, pensionati: -1.0, imprese: -0.2 },
        axisShift: { society: 6, institutions: -5 },
        stateEffects: { democraticHealth: 7, euRelations: 5, socialStability: 1 },
        loyaltyDelta: -1,
        headlineResult:
          'Svolta sulle pene alternative: plauso del Quirinale e di Strasburgo, dura protesta della destra.',
        rivalReaction: 'Un indulto mascherato che svuota la certezza della pena.',
      },
      {
        id: 'piano_edilizia_agenti',
        label: 'Costruire nuovi padiglioni penitenziari e assumere 3.000 agenti di polizia penitenziaria',
        stance: 'Certezza della Pena',
        description:
          'Risolvere il sovraffollamento aumentando i posti disponibili senza sconti di pena.',
        budgetDelta: -8500,
        demoEffects: { pensionati: 1.5, imprese: 0.9, lavoratori: 0.6, giovani: -0.6 },
        axisShift: { society: -5, institutions: 3 },
        stateEffects: { spread: 5, socialStability: 2, democraticHealth: -1 },
        loyaltyDelta: 2,
        headlineResult:
          'Piano edilizia carceraria e nuovi agenti: soddisfazione dei sindacati di polizia penitenziaria.',
        rivalReaction: 'Ci vorranno anni per costruire nuovi istituti mentre l’emergenza è oggi.',
      },
      {
        id: 'comunita_recupero_tossicodipendenti',
        label: 'Trasferire detenuti tossicodipendenti in comunità terapeutiche e velocizzare i processi',
        stance: 'Riformista / Pragmatico',
        description:
          'Liberare posti in carcere con percorsi di recupero mirati e riforma della custodia cautelare.',
        budgetDelta: -5500,
        demoEffects: { pensionati: 0.8, giovani: 0.9, lavoratori: 0.7, imprese: 0.4 },
        axisShift: { society: 2, institutions: -2 },
        stateEffects: { democraticHealth: 4, socialStability: 3 },
        loyaltyDelta: 1,
        headlineResult:
          'Mediazione su comunità di recupero e custodia cautelare: consenso trasversale in Parlamento.',
        rivalReaction: 'Buon compromesso, ma resta l’urgenza degli organici negli istituti.',
      },
    ],
  },
  {
    id: 'ev_sciopero_scuola_precari',
    category: 'Lavoro',
    severity: 'Media',
    context: 'opposizione',
    title: 'Scuola in agitazione: 200.000 cattedre scoperte e corteo dei docenti precari',
    summary:
      'All’avvio dell’anno scolastico mancano insegnanti di sostegno e di ruolo. I sindacati della scuola chiedono sostegno alle opposizioni in Parlamento.',
    options: [
      {
        id: 'emendamento_stabilizzazione_docenti',
        label: 'Presentare un emendamento per stabilizzare i precari e aumentare gli stipendi docenti',
        stance: 'Scuola Pubblica / Sindacati',
        description:
          'Portare la battaglia dei docenti in Aula e in piazza per adeguare gli stipendi alla media UE.',
        budgetDelta: -4500,
        demoEffects: { lavoratori: 1.6, giovani: 1.2, pensionati: 0.4, imprese: -0.3 },
        axisShift: { economic: -4, society: 3 },
        stateEffects: { socialStability: 3, spread: 2 },
        loyaltyDelta: 2,
        headlineResult:
          'Iniziativa parlamentare per i docenti precari: grande consenso nel mondo della scuola.',
        rivalReaction: 'Promesse facili dall’opposizione che costerebbero miliardi ogni anno.',
      },
      {
        id: 'proposta_carriera_merito_scuola',
        label: 'Proporre una riforma del reclutamento per merito e autonomia ai presidi',
        stance: 'Riformista / Merito',
        description:
          'Superare le graduatorie rigide con concorsi annuali veloci e premi legati ai risultati didattici.',
        budgetDelta: -3000,
        demoEffects: { imprese: 1.1, giovani: 0.9, lavoratori: -0.2 },
        axisShift: { economic: 4, europe: 2 },
        stateEffects: { socialStability: 1 },
        loyaltyDelta: 0,
        headlineResult:
          'Proposta riformista sul reclutamento scolastico: apprezzata dai presidi, criticata dai sindacati.',
        rivalReaction: 'Una ricetta manageriale che ignora il precariato storico dei docenti.',
      },
      {
        id: 'presidio_sostegno_disabilita',
        label: 'Concentrare la campagna sull’emergenza insegnanti di sostegno per studenti con disabilità',
        stance: 'Trasversale / Inclusione',
        description:
          'Unire famiglie e associazioni su un tema che mette in difficoltà la maggioranza.',
        budgetDelta: -4000,
        demoEffects: { lavoratori: 1.2, pensionati: 0.9, giovani: 1.0 },
        axisShift: { society: 3 },
        stateEffects: { socialStability: 4, democraticHealth: 2 },
        loyaltyDelta: 2,
        headlineResult:
          'Campagna sugli insegnanti di sostegno: forte eco mediatica e applausi dalle famiglie.',
        rivalReaction: 'Sfruttano un tema delicato per fare propaganda contro il Ministero.',
      },
    ],
  },
  {
    id: 'ev_mobilitazione_comitati_sanita',
    category: 'Territorio',
    severity: 'Media',
    context: 'extraparlamentare',
    title: 'Comitati civici in mobilitazione contro la chiusura dei piccoli ospedali di provincia',
    summary:
      'In diverse province i cittadini scendono in piazza per difendere punti nascita e pronto soccorso locali. È un’occasione d’oro per radicarti sul territorio.',
    options: [
      {
        id: 'fiaccolata_comitati_territorio',
        label: 'Scendere in piazza con i comitati e raccogliere firme per una petizione regionale',
        stance: 'Popolare / Radicamento',
        description:
          'Mettere bandiere e volontari al fianco dei cittadini per conquistare visibilità e nuovi iscritti.',
        budgetDelta: -3500,
        demoEffects: { pensionati: 1.5, lavoratori: 1.1, giovani: 0.6 },
        regionEffects: { sud: 0.8, centro: 0.7 },
        axisShift: { economic: -3 },
        stateEffects: { socialStability: 2 },
        loyaltyDelta: 3,
        headlineResult:
          'Grande partecipazione alle fiaccolate per gli ospedali: cresce il radicamento del tuo movimento.',
        rivalReaction: 'Soffiano sul fuoco della protesta senza avere alcuna responsabilità di governo.',
      },
      {
        id: 'dossier_tecnico_sprechi_asl',
        label: 'Pubblicare un dossier sugli sprechi delle ASL e chiedere più efficienza manageriale',
        stance: 'Competenza / Riformista',
        description:
          'Dimostrare con i numeri come salvare gli ospedali tagliando consulenze e nomine politiche.',
        budgetDelta: -2500,
        demoEffects: { imprese: 1.1, giovani: 0.9, pensionati: 0.6 },
        axisShift: { economic: 3, institutions: -3 },
        stateEffects: { democraticHealth: 2 },
        loyaltyDelta: 1,
        headlineResult:
          'Il dossier sugli sprechi sanitari conquista spazio sui quotidiani locali e sui social.',
        rivalReaction: 'Analisi da convegno che scalda poco le piazze.',
      },
      {
        id: 'sportello_cittadini_liste_attesa',
        label: 'Aprire sportelli volontari gratuiti per assistere i cittadini nei ricorsi sulle liste d’attesa',
        stance: 'Servizio Civico / Concreto',
        description:
          'Aiutare concretamente anziani e famiglie a ottenere visite nei tempi di legge.',
        budgetDelta: -4500,
        demoEffects: { pensionati: 1.8, lavoratori: 0.9, giovani: 0.4 },
        axisShift: { society: 1 },
        stateEffects: { socialStability: 3 },
        loyaltyDelta: 2,
        headlineResult:
          'Boom di richieste agli sportelli gratuiti sulle liste d’attesa: passaparola fortissimo nei quartieri.',
        rivalReaction: 'Operazione ben congegnata, ma priva di una vera proposta strutturale.',
      },
    ],
  },

  // ============================================================================
  // TERRITORIO, AMBIENTE & INFRASTRUTTURE (8 dossier)
  // ============================================================================
  {
    id: 'ev_siccita_sud_invasi',
    category: 'Territorio',
    severity: 'Critica',
    context: 'any',
    title: 'Emergenza siccità al Sud e nelle Isole: invasi vuoti e razionamento idrico',
    summary:
      'Sicilia, Sardegna, Puglia e Basilicata affrontano una crisi idrica drammatica: perdite di rete oltre il 40%, raccolti bruciati e alberghi con autobotti.',
    options: [
      {
        id: 'piano_dissalatori_invasi',
        label: 'Commissario straordinario per nuovi invasi, dissalatori e riparazione acquedotti',
        stance: 'Infrastrutture / Concreto',
        description:
          'Stanziare fondi rapidi per rifare le reti colabrodo e garantire acqua ad agricoltura e turismo.',
        budgetDelta: -8000,
        demoEffects: { imprese: 1.2, lavoratori: 1.1, pensionati: 1.0, giovani: 0.6 },
        regionEffects: { isole: 1.7, sud: 1.5 },
        axisShift: { economic: 1 },
        stateEffects: { spread: 5, socialStability: 5 },
        loyaltyDelta: 2,
        headlineResult:
          'Piano straordinario acqua al Sud: plauso di sindaci, agricoltori e operatori turistici.',
        rivalReaction: 'Ennesimo commissario straordinario mentre i fondi europei restano fermi.',
      },
      {
        id: 'transizione_climatica_risparmio_idrico',
        label: 'Legge nazionale sull’adattamento climatico, riuso acque reflue e stop consumo suolo',
        stance: 'Ecologista / Clima',
        description:
          'Affrontare la radice climatica della siccità con irrigazione di precisione e rigenerazione fluviale.',
        budgetDelta: -6000,
        demoEffects: { giovani: 2.0, lavoratori: 0.6, imprese: -0.6 },
        regionEffects: { isole: 0.9, sud: 0.8, centro: 0.5 },
        axisShift: { society: 6, europe: 5 },
        stateEffects: { euRelations: 6, socialStability: 3 },
        loyaltyDelta: 1,
        headlineResult:
          'Svolta sull’adattamento climatico: entusiasmo dei giovani e degli ambientalisti.',
        rivalReaction: 'Mentre parlate di clima i campi muoiono di sete oggi.',
      },
      {
        id: 'ristori_agricoltori_tariffe',
        label: 'Ristori immediati per gli agricoltori colpiti e blocco bollette idriche nelle zone rosse',
        stance: 'Emergenza / Ristori',
        description:
          'Intervento diretto sulle aziende agricole e sulle famiglie costrette al razionamento.',
        budgetDelta: -7000,
        demoEffects: { imprese: 1.1, pensionati: 1.1, lavoratori: 0.9 },
        regionEffects: { isole: 1.4, sud: 1.2 },
        axisShift: { economic: -2 },
        stateEffects: { spread: 6, socialStability: 4 },
        loyaltyDelta: 2,
        headlineResult:
          'Ristori rapidi contro la siccità: sollievo nelle campagne del Mezzogiorno.',
        rivalReaction: 'Senza investimenti sulle reti tra dodici mesi saremo punto e a capo.',
      },
    ],
  },
  {
    id: 'ev_alluvione_dissesto_nord_centro',
    category: 'Territorio',
    severity: 'Critica',
    context: 'any',
    title: 'Alluvione lampo e frane: torna l’incubo del dissesto idrogeologico',
    summary:
      'Piogge estreme mandano sott’acqua interi quartieri e distretti industriali tra Nord e Centro. Esplode la polemica sui mancati interventi di messa in sicurezza dei fiumi.',
    options: [
      {
        id: 'piano_prevenzione_fiumi_casse',
        label: 'Piano pluriennale di manutenzione fiumi, casse di espansione e stop nuove cementificazioni',
        stance: 'Prevenzione / Territorio',
        description:
          'Spostare risorse dalle grandi opere rinviabili alla sicurezza quotidiana di torrenti e argini.',
        budgetDelta: -8500,
        demoEffects: { giovani: 1.7, lavoratori: 1.2, pensionati: 1.1, imprese: 0.3 },
        regionEffects: { nord_est: 1.2, centro: 1.2, nord_ovest: 0.8 },
        axisShift: { society: 4, economic: -2 },
        stateEffects: { spread: 5, socialStability: 6 },
        loyaltyDelta: 2,
        headlineResult:
          'Piano nazionale contro il dissesto: forte consenso nei territori alluvionati.',
        rivalReaction: 'Bene la prevenzione, ma i rimborsi alle aziende colpite devono arrivare subito.',
      },
      {
        id: 'risarcimenti_100_imprese_famiglie',
        label: 'Rimborsi al 100% senza burocrazia e sospensione fiscale per le zone alluvionate',
        stance: 'Pronto Intervento / Imprese',
        description:
          'Garantire liquidità immediata a fabbriche, negozi e famiglie che hanno perso tutto.',
        budgetDelta: -9000,
        demoEffects: { imprese: 1.8, lavoratori: 1.1, pensionati: 1.0 },
        regionEffects: { nord_est: 1.4, centro: 1.0 },
        axisShift: { economic: 1 },
        stateEffects: { spread: 7, socialStability: 5 },
        loyaltyDelta: 2,
        headlineResult:
          'Decreto ristori al 100%: gratitudine dei sindaci e dei distretti produttivi colpiti.',
        rivalReaction: 'Le coperture sono a debito e mancano misure per evitare la prossima alluvione.',
      },
      {
        id: 'assicurazione_catastrofale_fondo_ue',
        label: 'Attivare il Fondo di Solidarietà UE e un sistema misto di polizze catastrofali agevolate',
        stance: 'Europeista / Assicurativo',
        description:
          'Coinvolgere Bruxelles e il sistema assicurativo per proteggere il bilancio pubblico.',
        budgetDelta: -3500,
        demoEffects: { imprese: 0.8, giovani: 0.5, pensionati: -0.4, lavoratori: -0.3 },
        axisShift: { economic: 5, europe: 5 },
        stateEffects: { spread: -4, euRelations: 6, socialStability: -1 },
        loyaltyDelta: 0,
        headlineResult:
          'Richiesta fondi UE e polizze catastrofali: mercati tranquilli, ma i cittadini chiedono aiuti diretti.',
        rivalReaction: 'Scaricano sulle famiglie il costo delle assicurazioni contro le alluvioni.',
      },
    ],
  },
  {
    id: 'ev_ponte_stretto_espropri',
    category: 'Territorio',
    severity: 'Alta',
    context: 'any',
    title: 'Ponte sullo Stretto di Messina: scontro su espropri, costi e priorità ferroviarie',
    summary:
      'L’avvio delle procedure di esproprio accende proteste sulle due sponde dello Stretto. Il Paese si spacca tra chi vede un’opera storica e chi chiede prima ferrovie e strade.',
    options: [
      {
        id: 'avanti_ponte_opera_strategica',
        label: 'Difendere con forza il Ponte come volano di lavoro e rilancio del Mezzogiorno',
        stance: 'Grandi Opere / Sviluppo',
        description:
          'Rivendicare la grande opera ingegneristica e indennizzi generosi per gli espropriati.',
        budgetDelta: -6000,
        demoEffects: { imprese: 1.7, lavoratori: 0.6, giovani: -0.9, pensionati: 0.4 },
        regionEffects: { isole: 1.0, sud: 0.8, nord_est: 0.4 },
        axisShift: { economic: 5, society: -3 },
        stateEffects: { spread: 6, socialStability: -2 },
        loyaltyDelta: 2,
        headlineResult:
          'Sì convinto al Ponte sullo Stretto: entusiasmo del settore costruzioni, proteste dei comitati No Ponte.',
        rivalReaction: 'Una cattedrale nel deserto da 13 miliardi mentre i treni in Sicilia vanno a binario unico.',
      },
      {
        id: 'stop_ponte_ferrovie_sud',
        label: 'Fermare il Ponte e dirottare tutti i 13 miliardi su ferrovie, strade e acqua al Sud',
        stance: 'Ambientalista / Infrastrutture Locali',
        description:
          'Puntare sull’Alta Velocità Salerno-Reggio Calabria e sul raddoppio ferroviario siciliano.',
        budgetDelta: -4500,
        demoEffects: { giovani: 1.7, lavoratori: 1.0, imprese: -0.9, pensionati: 0.3 },
        regionEffects: { sud: 1.1, isole: 0.9, centro: 0.5 },
        axisShift: { economic: -4, society: 5 },
        stateEffects: { spread: -3, socialStability: 3 },
        loyaltyDelta: 2,
        headlineResult:
          'No al Ponte e sì a treni e strade al Sud: forte sostegno tra giovani e comitati locali.',
        rivalReaction: 'La solita cultura del No che condanna il Mezzogiorno all’isolamento.',
      },
      {
        id: 'verifica_costi_benefici_indipendente',
        label: 'Subordinare i cantieri a una rigorosa analisi costi-benefici e al cofinanziamento UE',
        stance: 'Pragmatico / Conti',
        description:
          'Evitare scontri ideologici legando l’opera alla sostenibilità finanziaria e ambientale.',
        budgetDelta: -3000,
        demoEffects: { imprese: 0.5, giovani: 0.6, pensionati: 0.5 },
        axisShift: { europe: 4, economic: 2 },
        stateEffects: { spread: -4, euRelations: 4 },
        loyaltyDelta: 0,
        headlineResult:
          'Richiesta di analisi costi-benefici sul Ponte: linea prudente gradita ai mercati e all’UE.',
        rivalReaction: 'Un modo elegante per non decidere né sì né no.',
      },
    ],
  },
  {
    id: 'ev_nucleare_nuova_generazione',
    category: 'Economia',
    severity: 'Media',
    context: 'any',
    title: 'Ritorno al nucleare? Dibattito infuocato sui piccoli reattori modulari (SMR)',
    summary:
      'Le imprese energivore denunciano bollette elettriche doppie rispetto a Francia e Spagna e spingono per il nucleare di nuova generazione. Comitati locali e ambientalisti insorgono.',
    options: [
      {
        id: 'si_nucleare_pulito_industria',
        label: 'Sostenere il nucleare di nuova generazione per abbattere le bollette industriali',
        stance: 'Industriale / Pragmatico',
        description:
          'Avviare la ricerca sui piccoli reattori modulari sicuri in sinergia con Francia ed Europa.',
        budgetDelta: -5500,
        demoEffects: { imprese: 2.0, giovani: 0.7, lavoratori: 0.4, pensionati: -0.6 },
        regionEffects: { nord_ovest: 0.8, nord_est: 0.7 },
        axisShift: { economic: 5, society: -2, europe: 3 },
        stateEffects: { spread: -4, socialStability: -3, euRelations: 4 },
        loyaltyDelta: 1,
        headlineResult:
          'Apertura al nucleare pulito: applausi di Confindustria, ma i territori temono i siti.',
        rivalReaction: 'Gli italiani hanno già votato due volte contro il nucleare nei referendum.',
      },
      {
        id: 'cento_per_cento_rinnovabili_accumuli',
        label: 'No al nucleare: puntare al 100% su solare, eolico offshore e grandi batterie di accumulo',
        stance: 'Ecologista / Rinnovabili',
        description:
          'Sbloccare le autorizzazioni per le rinnovabili che costano meno e sono pronte in pochi anni.',
        budgetDelta: -5000,
        demoEffects: { giovani: 2.0, lavoratori: 0.6, pensionati: 0.5, imprese: -0.7 },
        regionEffects: { sud: 0.7, isole: 0.8 },
        axisShift: { society: 6, europe: 4, economic: -3 },
        stateEffects: { euRelations: 5, socialStability: 3 },
        loyaltyDelta: 2,
        headlineResult:
          'Scommessa totale sulle rinnovabili: forte sostegno dei giovani e delle regioni del Sud.',
        rivalReaction: 'Senza energia continua le fabbriche energivore chiuderanno.',
      },
      {
        id: 'mix_energetico_referendum_consultivo',
        label: 'Sostenere un mix rinnovabili + ricerca sulla fusione, coinvolgendo i cittadini',
        stance: 'Equilibrato / Scienza',
        description:
          'Investire subito su rinnovabili e reti elettriche lasciando aperta la ricerca scientifica sul nucleare.',
        budgetDelta: -4000,
        demoEffects: { imprese: 0.8, giovani: 0.8, lavoratori: 0.5, pensionati: 0.3 },
        axisShift: { europe: 2 },
        stateEffects: { spread: -1, socialStability: 2 },
        loyaltyDelta: 1,
        headlineResult:
          'Linea equilibrata sul mix energetico: consenso trasversale senza spaccare i territori.',
        rivalReaction: 'Troppa cautela su una scelta energetica che richiede coraggio.',
      },
    ],
  },
  {
    id: 'ev_protesta_trattori_agricoltori',
    category: 'Territorio',
    severity: 'Alta',
    context: 'any',
    title: 'I trattori bloccano le tangenziali: agricoltori contro costi, gasolio e norme UE',
    summary:
      'Centinaia di trattori presidiano gli svincoli autostradali in tutta Italia. Gli agricoltori chiedono prezzi equi, taglio IRPEF agricola e stop ai vincoli ambientali troppo rigidi.',
    options: [
      {
        id: 'sostegno_agricoltori_stop_vincoli',
        label: 'Sgravi su IRPEF e gasolio agricolo, battaglia a Bruxelles contro i vincoli Green Deal',
        stance: 'Difesa Agricoltura / Territorio',
        description:
          'Schierarsi apertamente con i trattori proteggendo redditi agricoli e filiere Made in Italy.',
        budgetDelta: -6500,
        demoEffects: { imprese: 1.7, lavoratori: 0.9, pensionati: 0.8, giovani: -1.1 },
        regionEffects: { nord_est: 1.1, sud: 1.0, centro: 0.7 },
        axisShift: { europe: -6, society: -4 },
        stateEffects: { spread: 5, socialStability: 4, euRelations: -6 },
        loyaltyDelta: 2,
        headlineResult:
          'Accordo con i trattori: sgravi fiscali in campagna, tensioni con la Commissione Europea.',
        rivalReaction: 'Si smonta la tutela ambientale per inseguire il consenso di breve periodo.',
      },
      {
        id: 'prezzo_equo_filiera_gdo',
        label: 'Legge contro il sottocosto della grande distribuzione e incentivi agricoltura sostenibile',
        stance: 'Giustizia Filiera / Ecologista',
        description:
          'Tutelare i piccoli agricoltori dai margini della GDO accompagnandoli nella transizione verde.',
        budgetDelta: -5500,
        demoEffects: { giovani: 1.2, lavoratori: 1.1, imprese: 0.4, pensionati: 0.5 },
        regionEffects: { sud: 0.8, centro: 0.7 },
        axisShift: { economic: -4, society: 3, europe: 2 },
        stateEffects: { socialStability: 4, euRelations: 3 },
        loyaltyDelta: 1,
        headlineResult:
          'Stretta sul sottocosto agroalimentare: apprezzata da piccoli produttori e consumatori.',
        rivalReaction: 'Le norme anti-mercato sulla GDO rischiano di far salire i prezzi ai supermercati.',
      },
      {
        id: 'innovazione_agritech_made_in_italy',
        label: 'Fondo Agritech per irrigazione smart, export DOP e assicurazioni contro la grandine',
        stance: 'Modernizzatore / Export',
        description:
          'Sostenere la competitività delle aziende agricole moderne con tecnologia e tutela export.',
        budgetDelta: -5000,
        demoEffects: { imprese: 1.3, giovani: 0.7, lavoratori: 0.5 },
        regionEffects: { nord_est: 0.8, nord_ovest: 0.6 },
        axisShift: { economic: 3, europe: 3 },
        stateEffects: { spread: -1, euRelations: 4, socialStability: 2 },
        loyaltyDelta: 1,
        headlineResult:
          'Piano Agritech ed export DOP: gradito alle grandi cooperative agricole e a Bruxelles.',
        rivalReaction: 'I piccoli coltivatori chiedono sollievo fiscale subito, non solo bandi tech.',
      },
    ],
  },
  {
    id: 'ev_overtourism_citta_arte',
    category: 'Territorio',
    severity: 'Media',
    context: 'any',
    title: 'Overtourism fuori controllo: Venezia, Firenze e Roma svuotate dai residenti',
    summary:
      'I centri storici diventano vetrine per turisti mordi-e-fuggi mentre botteghe artigiane e famiglie vengono espulse. Sindaci e albergatori chiedono regole nazionali.',
    options: [
      {
        id: 'numero_chiuso_ticket_residenti',
        label: 'Poteri ai sindaci per ticket d’ingresso, limiti ai B&B e fondi alle botteghe storiche',
        stance: 'Tutela Centri Storici',
        description:
          'Difendere la vivibilità dei residenti regolamentando flussi turistici e locazioni brevi.',
        budgetDelta: -4500,
        demoEffects: { giovani: 1.4, lavoratori: 1.0, pensionati: 0.9, imprese: -0.9 },
        regionEffects: { centro: 1.0, nord_est: 0.9 },
        axisShift: { economic: -3, society: 4 },
        stateEffects: { socialStability: 4 },
        loyaltyDelta: 2,
        headlineResult:
          'Stretta sull’overtourism nei centri storici: esultano i comitati residenti, irritati i gestori B&B.',
        rivalReaction: 'Frenare il turismo significa colpire una delle poche locomotive del PIL italiano.',
      },
      {
        id: 'destagionalizzazione_borghi_interni',
        label: 'Nessun divieto: incentivi fiscali per dirottare il turismo verso borghi e aree interne',
        stance: 'Liberale / Valorizzazione',
        description:
          'Promuovere l’Italia minore con collegamenti rapidi senza penalizzare le città d’arte.',
        budgetDelta: -5000,
        demoEffects: { imprese: 1.5, lavoratori: 0.6, pensionati: 0.5, giovani: 0.4 },
        regionEffects: { sud: 0.9, centro: 0.7, isole: 0.7 },
        axisShift: { economic: 4 },
        stateEffects: { spread: -2, socialStability: 2 },
        loyaltyDelta: 1,
        headlineResult:
          'Campagna borghi e destagionalizzazione: plauso degli albergatori e dei piccoli comuni.',
        rivalReaction: 'Senza limiti ai B&B i residenti continueranno a lasciare i centri storici.',
      },
      {
        id: 'tassa_soggiorno_trasporti_pulizia',
        label: 'Aumentare la tassa di soggiorno per finanziare metro, pulizia e case popolari',
        stance: 'Pragmatico / Municipale',
        description:
          'Far contribuire i visitatori al costo dei servizi urbani usati dai residenti.',
        budgetDelta: 4000,
        demoEffects: { lavoratori: 0.9, pensionati: 0.8, giovani: 0.6, imprese: -0.6 },
        regionEffects: { centro: 0.7, nord_ovest: 0.5 },
        axisShift: { economic: -1 },
        stateEffects: { spread: -2, socialStability: 2 },
        loyaltyDelta: 1,
        headlineResult:
          'Tassa di soggiorno mirata ai servizi locali: sollievo per i bilanci comunali.',
        rivalReaction: 'L’ennesimo balzello sul turismo che riduce la competitività dell’Italia.',
      },
    ],
  },
  {
    id: 'ev_cantieri_alta_velocita_ritardi',
    category: 'Territorio',
    severity: 'Media',
    context: 'opposizione',
    title: 'Rete ferroviaria nel caos: ritardi cronici su Alta Velocità e treni regionali',
    summary:
      'Guasti elettrici e cantieri sovrapposti mandano in tilt la dorsale Milano-Roma-Napoli per giorni. Migliaia di pendolari e viaggiatori sfogano la rabbia sui social.',
    options: [
      {
        id: 'interrogazione_dimissioni_trasporti',
        label: 'Attacco duro in Aula: chiedere le dimissioni del Ministro dei Trasporti e rimborsi totali',
        stance: 'Opposizione Dura / Media',
        description:
          'Cavalcare l’esasperazione dei pendolari con una campagna mediatica martellante.',
        budgetDelta: -3000,
        demoEffects: { lavoratori: 1.5, giovani: 1.2, imprese: 0.6 },
        axisShift: { institutions: -2 },
        stateEffects: { socialStability: -2 },
        relationEffects: { oppositeSide: -8 },
        loyaltyDelta: 2,
        headlineResult:
          'Offensiva sui ritardi dei treni: i pendolari applaudono, il Governo finisce sulla difensiva.',
        rivalReaction: 'Sciacallaggio sui cantieri del PNRR che servono proprio a modernizzare la rete.',
      },
      {
        id: 'piano_alternativo_treni_pendolari',
        label: 'Presentare un piano di riforma ferroviaria: più fondi ai treni regionali e manutenzione',
        stance: 'Costruttivo / Proposta',
        description:
          'Mostrare una classe dirigente pronta a governare con dati su scambi, scartamenti e flotta.',
        budgetDelta: -4000,
        demoEffects: { lavoratori: 1.1, imprese: 0.9, giovani: 0.8, pensionati: 0.4 },
        axisShift: { economic: -1, europe: 2 },
        stateEffects: { socialStability: 2, democraticHealth: 2 },
        loyaltyDelta: 1,
        headlineResult:
          'Piano trasporti dell’opposizione: apprezzamento dei comitati pendolari e degli esperti.',
        rivalReaction: 'Ricette facili da scrivere quando non si devono coordinare 1.200 cantieri aperti.',
      },
      {
        id: 'apertura_concorrenza_ferroviaria',
        label: 'Chiedere piena liberalizzazione delle tratte regionali per premiare gli operatori puntuali',
        stance: 'Liberale / Concorrenza',
        description:
          'Mettere a gara le linee in ritardo cronico per migliorare qualità e puntualità.',
        budgetDelta: -2500,
        demoEffects: { imprese: 1.4, giovani: 0.8, lavoratori: -0.7 },
        axisShift: { economic: 6, europe: 4 },
        stateEffects: { spread: -2, euRelations: 3 },
        loyaltyDelta: 0,
        headlineResult:
          'Proposta di gare sulle tratte ferroviarie: entusiasmo dei liberali, no secco dei sindacati.',
        rivalReaction: 'Privatizzare i treni regionali farebbe chiudere le linee meno redditizie.',
      },
    ],
  },
  {
    id: 'ev_banchetti_territorio_periferie',
    category: 'Territorio',
    severity: 'Media',
    context: 'extraparlamentare',
    title: 'Caro-bollette nei mercati rionali: opportunità di mobilitazione popolare dal basso',
    summary:
      'Nei quartieri popolari cresce il malcontento verso i grandi partiti parlamentari. I tuoi militanti propongono un weekend nazionale di banchetti e assemblee di quartiere.',
    options: [
      {
        id: 'weekend_banchetti_nazionale',
        label: 'Mobilitare tutti i volontari in 100 piazze con petizione popolare contro il caro-vita',
        stance: 'Militante / Piazza',
        description:
          'Massimizzare il contatto diretto con i cittadini e raccogliere migliaia di contatti e adesioni.',
        budgetDelta: -3500,
        demoEffects: { lavoratori: 1.5, pensionati: 1.1, giovani: 1.0 },
        axisShift: { economic: -2 },
        stateEffects: { socialStability: 1 },
        loyaltyDelta: 4,
        headlineResult:
          'Successo dei banchetti in 100 piazze: forte crescita di visibilità e nuovi tesserati.',
        rivalReaction: 'Campagna di protesta semplicistica senza copertura finanziaria.',
      },
      {
        id: 'dirette_social_mercati',
        label: 'Lanciare una campagna video virale intervistando famiglie e commercianti nei mercati',
        stance: 'Digitale / Virale',
        description:
          'Usare reel e dirette streaming per bucare il muro mediatico televisivo a basso costo.',
        budgetDelta: -2000,
        demoEffects: { giovani: 1.7, imprese: 0.8, lavoratori: 0.6 },
        axisShift: { society: 1 },
        stateEffects: { socialStability: 1 },
        loyaltyDelta: 2,
        headlineResult:
          'I video dai mercati rionali diventano virali: milioni di visualizzazioni tra gli under 35.',
        rivalReaction: 'Politica da TikTok che banalizza problemi complessi.',
      },
      {
        id: 'alleanza_comitati_consumatori',
        label: 'Creare un tavolo civico con associazioni dei consumatori e piccoli bottegai',
        stance: 'Civico / Istituzionale',
        description:
          'Costruire credibilità concreta lavorando con realtà radicate sul territorio.',
        budgetDelta: -2500,
        demoEffects: { imprese: 1.1, pensionati: 0.9, lavoratori: 0.8 },
        axisShift: { institutions: -2 },
        stateEffects: { socialStability: 2, democraticHealth: 2 },
        loyaltyDelta: 2,
        headlineResult:
          'Patto con associazioni dei consumatori: profilo serio e radicato premiato nei quartieri.',
        rivalReaction: 'Iniziativa locale che fatica a imporsi nel dibattito nazionale.',
      },
    ],
  },

  // ============================================================================
  // ISTITUZIONI, MEDIA, CAMPAGNA & ESTERI (9 dossier)
  // ============================================================================
  {
    id: 'ev_tensioni_magistratura_politica',
    category: 'Istituzioni',
    severity: 'Critica',
    context: 'governo',
    title: 'Alta tensione tra Magistratura e Governo: sentenze bloccano i decreti sui confini',
    summary:
      'Alcuni tribunali disapplicano un provvedimento chiave dell’Esecutivo rinviandolo alla Corte di Giustizia UE. La maggioranza parla di invasione di campo, le toghe difendono la legge.',
    options: [
      {
        id: 'attacco_toghe_riforma_subito',
        label: 'Rivendicare il primato del mandato elettorale e accelerare la riforma della giustizia',
        stance: 'Scontro / Esecutivo Forte',
        description:
          'Mobilitare l’elettorato contro le "sentenze politiche" e blindare il decreto con norma primaria.',
        budgetDelta: -5000,
        demoEffects: { pensionati: 1.3, imprese: 1.0, lavoratori: 0.6, giovani: -1.4 },
        axisShift: { institutions: 9, society: -5, europe: -5 },
        stateEffects: { democraticHealth: -9, euRelations: -6, socialStability: -5 },
        relationEffects: { institutional: -10 },
        loyaltyDelta: 3,
        headlineResult:
          'Scontro frontale tra Governo e Magistratura: la base applaude, forte allarme istituzionale.',
        rivalReaction: 'Un attacco senza precedenti all’indipendenza della magistratura e alla Costituzione.',
      },
      {
        id: 'distensione_quirinale_csm',
        label: 'Abbassare i toni, rispettare le sentenze e aprire un tavolo tecnico con CSM e UE',
        stance: 'Istituzionale / Garanzie',
        description:
          'Evitare lo scontro tra poteri dello Stato e correggere il testo per renderlo inattaccabile.',
        budgetDelta: -2000,
        demoEffects: { giovani: 1.1, imprese: 0.7, lavoratori: 0.4, pensionati: -0.4 },
        axisShift: { institutions: -6, europe: 5 },
        stateEffects: { democraticHealth: 8, euRelations: 6, spread: -5, socialStability: 4 },
        relationEffects: { institutional: 9 },
        loyaltyDelta: -2,
        headlineResult:
          'Tregua tra Palazzo Chigi e toghe: plauso dal Quirinale e da Bruxelles, delusi i falchi.',
        rivalReaction: 'Finalmente il Governo ammette di aver scritto decreti inapplicabili.',
      },
      {
        id: 'ricorso_corte_europea_norme',
        label: 'Affidare la difesa all’Avvocatura dello Stato e promuovere nuove regole comuni a Bruxelles',
        stance: 'Pragmatico / Diplomatico',
        description:
          'Difendere la linea del Governo nelle sedi legali ed europee senza delegittimare i giudici.',
        budgetDelta: -3500,
        demoEffects: { imprese: 0.8, pensionati: 0.7, lavoratori: 0.5, giovani: 0.2 },
        axisShift: { europe: 2 },
        stateEffects: { democraticHealth: 2, euRelations: 2, spread: -2 },
        loyaltyDelta: 1,
        headlineResult:
          'Linea giuridica ordinata: il Governo difende il provvedimento nelle sedi UE evitando lo strappo.',
        rivalReaction: 'Tattica dilatoria per guadagnare tempo senza risolvere il nodo giuridico.',
      },
    ],
  },
  {
    id: 'ev_nomine_rai_servizio_pubblico',
    category: 'Istituzioni',
    severity: 'Alta',
    context: 'any',
    title: 'Bufera sulle nomine RAI: sciopero dei giornalisti e scontro sul servizio pubblico',
    summary:
      'Il rinnovo dei vertici di Viale Mazzini e dei telegiornali scatena proteste della redazione e accuse di lottizzazione politica. L’Europa ricorda il Media Freedom Act.',
    options: [
      {
        id: 'riforma_governance_indipendente_rai',
        label: 'Proporre una legge di riforma RAI che tolga le nomine ai partiti secondo le regole UE',
        stance: 'Indipendenza / Pluralismo',
        description:
          'Istituire una fondazione autonoma sul modello BBC per garantire informazione libera.',
        budgetDelta: -4000,
        demoEffects: { giovani: 1.7, lavoratori: 0.8, imprese: 0.5, pensionati: 0.3 },
        axisShift: { institutions: -7, europe: 5 },
        stateEffects: { democraticHealth: 8, euRelations: 6, socialStability: 2 },
        loyaltyDelta: -1,
        headlineResult:
          'Svolta sul servizio pubblico: plauso di giornalisti e osservatori europei per la riforma RAI.',
        rivalReaction: 'Tutti predicano la RAI fuori dai partiti finché non tocca a loro governare.',
      },
      {
        id: 'equilibrio_rappresentanza_parlamentare',
        label: 'Difendere il ruolo della Commissione di Vigilanza e un pluralismo proporzionale',
        stance: 'Pragmatico / Equilibrio',
        description:
          'Assicurare spazi equilibrati a maggioranza e opposizione mantenendo il controllo parlamentare.',
        budgetDelta: -2000,
        demoEffects: { pensionati: 0.8, lavoratori: 0.5, imprese: 0.4, giovani: -0.4 },
        axisShift: { institutions: 1 },
        stateEffects: { socialStability: 1 },
        loyaltyDelta: 2,
        headlineResult:
          'Accordo sugli spazi in Vigilanza RAI: tregua tra i gruppi, fredda l’opinione pubblica giovane.',
        rivalReaction: 'Il solito manuale Cencelli applicato anche ai telegiornali.',
      },
      {
        id: 'riduzione_canone_privatizzazione_canali',
        label: 'Tagliare il canone RAI in bolletta e cedere sul mercato i canali non di servizio pubblico',
        stance: 'Liberale / Taglio Canone',
        description:
          'Ridurre i costi per le famiglie tenendo pubblica solo una rete dedicata a cultura e news.',
        budgetDelta: -3000,
        demoEffects: { imprese: 1.6, pensionati: 0.9, giovani: 0.7, lavoratori: -0.9 },
        axisShift: { economic: 7 },
        stateEffects: { spread: -2, socialStability: -2 },
        loyaltyDelta: 1,
        headlineResult:
          'Proposta shock sul taglio del canone RAI: popolarissima tra contribuenti, furia dei sindacati TV.',
        rivalReaction: 'Così si regala tutto il mercato televisivo ai grandi gruppi privati.',
      },
    ],
  },
  {
    id: 'ev_autonomia_differenziata_regioni',
    category: 'Istituzioni',
    severity: 'Critica',
    context: 'any',
    title: 'Autonomia differenziata: l’Italia si spacca tra governatori del Nord e del Sud',
    summary:
      'Le richieste di nuove competenze regionali su scuola, sanità ed energia riaprono la questione meridionale. I presidenti di Regione chiedono una posizione chiara.',
    options: [
      {
        id: 'si_autonomia_efficienza_regioni',
        label: 'Sostenere l’autonomia per premiare le Regioni virtuose e responsabilizzare la spesa',
        stance: 'Autonomista / Nord',
        description:
          'Avvicinare le decisioni ai cittadini e ridurre gli sprechi centralistici.',
        budgetDelta: -4000,
        demoEffects: { imprese: 1.7, lavoratori: 0.3, pensionati: 0.2, giovani: -0.5 },
        regionEffects: { nord_est: 1.8, nord_ovest: 1.5, sud: -1.6, isole: -1.2 },
        axisShift: { economic: 5, society: -3 },
        stateEffects: { socialStability: -5, spread: -2 },
        loyaltyDelta: 2,
        headlineResult:
          'Sì all’autonomia regionale: entusiasmo in Veneto e Lombardia, durissima reazione nel Mezzogiorno.',
        rivalReaction: 'Una riforma che spacca l’unità nazionale e crea cittadini di serie A e serie B.',
      },
      {
        id: 'difesa_unita_nazionale_lep_prima',
        label: 'Stop all’autonomia senza prima finanziare integralmente i LEP su scuola e sanità al Sud',
        stance: 'Unitario / Mezzogiorno',
        description:
          'Garantire uguali diritti da Bolzano a Palermo prima di trasferire qualsiasi competenza.',
        budgetDelta: -5000,
        demoEffects: { lavoratori: 1.3, giovani: 1.1, pensionati: 0.9, imprese: -0.5 },
        regionEffects: { sud: 1.7, isole: 1.4, centro: 0.6, nord_est: -1.0 },
        axisShift: { economic: -4, society: 3 },
        stateEffects: { socialStability: 3, democraticHealth: 4, spread: 4 },
        loyaltyDelta: 2,
        headlineResult:
          'Difesa dell’unità nazionale e dei LEP: grande consenso nel Sud e al Centro, critiche al Nord.',
        rivalReaction: 'Difendono il centralismo burocratico che blocca le regioni produttive.',
      },
      {
        id: 'federalismo_solidale_riforma_comuni',
        label: 'Proporre un decentramento equilibrato che dia più poteri a Comuni e Città Metropolitane',
        stance: 'Istituzionale / Sindaci',
        description:
          'Superare la guerra tra Regioni rafforzando direttamente i sindaci con un fondo perequativo certo.',
        budgetDelta: -3500,
        demoEffects: { imprese: 0.7, lavoratori: 0.7, giovani: 0.8, pensionati: 0.5 },
        regionEffects: { centro: 0.7, nord_ovest: 0.5, sud: 0.5 },
        axisShift: { institutions: -3 },
        stateEffects: { socialStability: 4, democraticHealth: 3 },
        loyaltyDelta: 1,
        headlineResult:
          'Apertura ai sindaci e al federalismo solidale: mediazione apprezzata dall’ANCI.',
        rivalReaction: 'Formula diplomatica che non scioglie il nodo delle competenze regionali.',
      },
    ],
  },
  {
    id: 'ev_cyberattacco_pa_ai',
    category: 'Istituzioni',
    severity: 'Alta',
    context: 'governo',
    title: 'Cyberattacco blocca portali sanitari e municipali: allarme sicurezza digitale e AI',
    summary:
      'Un attacco ransomware paralizza le prenotazioni ospedaliere in tre Regioni e mette a rischio banche dati pubbliche. L’Agenzia Cyber chiede investimenti immediati.',
    options: [
      {
        id: 'scudo_cyber_cloud_sovrano',
        label: 'Potenziare l’Agenzia Cyber, cloud sovrano europeo e assunzioni di ingegneri nella PA',
        stance: 'Sicurezza Digitale / UE',
        description:
          'Mettere in sicurezza sanità e infrastrutture critiche integrandosi nello scudo digitale europeo.',
        budgetDelta: -7500,
        demoEffects: { imprese: 1.5, giovani: 1.4, lavoratori: 0.6, pensionati: 0.5 },
        axisShift: { europe: 5, economic: 2 },
        stateEffects: { euRelations: 6, spread: 2, socialStability: 4 },
        loyaltyDelta: 2,
        headlineResult:
          'Scudo cyber e cloud europeo: risposta rapida elogiata da esperti e partner internazionali.',
        rivalReaction: 'Intervento doveroso ma tardivo dopo anni di sistemi informatici trascurati.',
      },
      {
        id: 'regole_strette_ai_lavoro',
        label: 'Aprire il cantiere di una legge nazionale su AI, tutela privacy e protezione posti di lavoro',
        stance: 'Garanzie / Lavoro',
        description:
          'Affiancare alla sicurezza informatica limiti rigorosi all’automazione selvaggia negli uffici.',
        budgetDelta: -5000,
        demoEffects: { lavoratori: 1.4, giovani: 1.1, pensionati: 0.6, imprese: -0.7 },
        axisShift: { economic: -3, society: 4 },
        stateEffects: { democraticHealth: 4, socialStability: 3 },
        loyaltyDelta: 1,
        headlineResult:
          'Carta italiana su AI e lavoro: apprezzata dai sindacati, cautela del settore tech.',
        rivalReaction: 'Troppe regole rischiano di frenare le aziende italiane sull’intelligenza artificiale.',
      },
      {
        id: 'partnership_privati_cyber',
        label: 'Coinvolgere subito i grandi campioni tecnologici privati per ripristinare i servizi',
        stance: 'Liberale / Rapido',
        description:
          'Affidare in tempi record la messa in sicurezza a consorzi privati ad alta specializzazione.',
        budgetDelta: -5500,
        demoEffects: { imprese: 1.7, pensionati: 0.7, lavoratori: 0.2, giovani: 0.4 },
        axisShift: { economic: 6 },
        stateEffects: { spread: -2, socialStability: 3 },
        loyaltyDelta: 1,
        headlineResult:
          'Servizi ripristinati in 48 ore grazie ai consorzi tech; critiche sui dati affidati ai privati.',
        rivalReaction: 'I dati sanitari dei cittadini non devono dipendere da colossi privati.',
      },
    ],
  },
  {
    id: 'ev_missioni_internazionali_difesa',
    category: 'Esteri',
    severity: 'Alta',
    context: 'any',
    title: 'Crisi nel Mar Rosso e soglia NATO al 2%: scontro sulle spese per la Difesa',
    summary:
      'Gli attacchi alle rotte commerciali minacciano i porti italiani e gli alleati NATO chiedono di aumentare il bilancio della Difesa. Parlamento e opinione pubblica sono divisi.',
    options: [
      {
        id: 'difesa_comune_ue_rottec',
        label: 'Sostenere la missione navale europea e la Difesa Comune UE per ottimizzare la spesa',
        stance: 'Europeista / Atlantico',
        description:
          'Proteggere l’export italiano nel Mar Rosso integrando gli appalti militari a livello europeo.',
        budgetDelta: -6000,
        demoEffects: { imprese: 1.5, giovani: 0.7, lavoratori: 0.4, pensionati: 0.2 },
        axisShift: { europe: 7, economic: 2 },
        stateEffects: { euRelations: 8, spread: -5, socialStability: 1 },
        loyaltyDelta: 1,
        headlineResult:
          'Linea euro-atlantica nel Mar Rosso: mercati e cancellerie europee plaudono all’Italia.',
        rivalReaction: 'Aumentare le spese militari mentre mancano soldi per ospedali e scuole è sbagliato.',
      },
      {
        id: 'no_riarmo_diplomazia_welfare',
        label: 'No all’aumento delle spese militari: priorità a diplomazia, pace e spesa sociale',
        stance: 'Pacifista / Sociale',
        description:
          'Rifiutare la corsa al riarmo e destinare ogni risorsa aggiuntiva a sanità, salari e cooperazione.',
        budgetDelta: -2500,
        demoEffects: { giovani: 1.8, lavoratori: 1.2, pensionati: 0.7, imprese: -1.2 },
        axisShift: { economic: -5, society: 6, europe: -4 },
        stateEffects: { euRelations: -6, spread: 4, socialStability: 4 },
        loyaltyDelta: 2,
        headlineResult:
          'Stop al riarmo: forte mobilitazione pacifista e sociale, tensioni con gli alleati NATO.',
        rivalReaction: 'Senza difendere le rotte marittime affondano i porti di Trieste e Genova.',
      },
      {
        id: 'tutela_porti_industria_difesa',
        label: 'Raggiungere gli impegni NATO valorizzando la cantieristica e l’aerospazio italiani',
        stance: 'Nazionale / Industriale',
        description:
          'Trasformare la spesa per sicurezza e marina militare in commesse per l’industria nazionale.',
        budgetDelta: -6500,
        demoEffects: { imprese: 1.8, lavoratori: 0.9, pensionati: 0.5, giovani: -0.7 },
        regionEffects: { nord_ovest: 0.8, nord_est: 0.7, sud: 0.6 },
        axisShift: { economic: 4, society: -3, europe: 1 },
        stateEffects: { euRelations: 4, spread: 1, socialStability: 1 },
        loyaltyDelta: 2,
        headlineResult:
          'Piano difesa e cantieristica nazionale: soddisfazione nei poli industriali, critiche pacifiste.',
        rivalReaction: 'Un’economia di guerra mascherata da politica industriale.',
      },
    ],
  },
  {
    id: 'ev_vertice_ue_pnrr_riforme',
    category: 'Unione Europea',
    severity: 'Critica',
    context: 'governo',
    title: 'Vertice cruciale a Bruxelles: trattativa sulla proroga PNRR e sul nuovo Patto di Stabilità',
    summary:
      'L’Italia negozia la traiettoria di riduzione del debito per i prossimi sette anni e chiede più tempo per completare i grandi progetti PNRR su reti, scuole e ospedali.',
    options: [
      {
        id: 'patto_riforme_proroga_concordata',
        label: 'Negoziare con la Commissione un piano credibile di riforme in cambio di flessibilità PNRR',
        stance: 'Diplomatico / Credibile',
        description:
          'Costruire un’intesa con Francia e Spagna per ottenere 12 mesi in più senza scontro frontale.',
        budgetDelta: -4000,
        demoEffects: { imprese: 1.3, lavoratori: 0.8, giovani: 0.8, pensionati: 0.5 },
        axisShift: { europe: 6 },
        stateEffects: { euRelations: 9, spread: -10, socialStability: 3 },
        loyaltyDelta: 1,
        headlineResult:
          'Successo diplomatico a Bruxelles: via libera alla flessibilità sul PNRR e Spread in netta discesa.',
        rivalReaction: 'Accordo al ribasso che impone vincoli durissimi alle prossime manovre.',
      },
      {
        id: 'braccio_ferro_scorporo_investimenti',
        label: 'Braccio di ferro a Bruxelles: chiedere lo scorporo totale degli investimenti dal Patto',
        stance: 'Fermo / Sovranità Fiscale',
        description:
          'Minacciare il veto su altri dossier UE se non vengono esclusi sanità e investimenti dai vincoli.',
        budgetDelta: -5000,
        demoEffects: { lavoratori: 1.2, pensionati: 0.9, imprese: -0.6, giovani: -0.3 },
        axisShift: { europe: -7, economic: -3 },
        stateEffects: { euRelations: -8, spread: 11, socialStability: 2 },
        loyaltyDelta: 3,
        headlineResult:
          'Pugno duro a Bruxelles sul Patto di Stabilità: la base applaude, ma i mercati si innervosiscono.',
        rivalReaction: 'Isolare l’Italia in Europa farà solo aumentare gli interessi sul nostro debito.',
      },
      {
        id: 'alleanza_eurobond_competitivita',
        label: 'Rilanciare la proposta di nuovo debito comune europeo per competitività e transizione',
        stance: 'Federalista / Riformatore',
        description:
          'Spingere sul rapporto sulla competitività UE per nuovi investimenti comuni continentali.',
        budgetDelta: -3500,
        demoEffects: { imprese: 1.4, giovani: 1.3, lavoratori: 0.6 },
        axisShift: { europe: 8, economic: 1 },
        stateEffects: { euRelations: 7, spread: -7 },
        loyaltyDelta: 1,
        headlineResult:
          'L’Italia guida il fronte pro-Eurobond a Bruxelles: ottima accoglienza su mercati e stampa estera.',
        rivalReaction: 'I Paesi frugali del Nord non diranno mai sì: serve concretezza oggi.',
      },
    ],
  },
  {
    id: 'ev_dibattito_opposizione_piazza_unitaria',
    category: 'Istituzioni',
    severity: 'Alta',
    context: 'opposizione',
    title: 'Appello dal Paese reale: una grande piazza unitaria contro carovita e tagli ai servizi?',
    summary:
      'Sindacati, associazioni civiche e altri partiti d’opposizione ti chiedono se aderire a una grande manifestazione nazionale a Roma o lanciare un’iniziativa autonoma.',
    options: [
      {
        id: 'piazza_unitaria_alleanze',
        label: 'Aderire con forza alla piazza unitaria per costruire l’alternativa di governo',
        stance: 'Unitario / Coalizione',
        description:
          'Mostrare compattezza agli elettori scontenti del Governo e rafforzare il dialogo con i possibili alleati.',
        budgetDelta: -5000,
        demoEffects: { lavoratori: 1.5, giovani: 1.2, pensionati: 0.7 },
        axisShift: { economic: -2 },
        stateEffects: { socialStability: 2 },
        relationEffects: { sameSide: 9, oppositeSide: -5 },
        loyaltyDelta: 2,
        headlineResult:
          'Piazza gremita a Roma: l’opposizione ritrova slancio unitario e rilancia la sfida al Governo.',
        rivalReaction: 'Un’accozzaglia tenuta insieme solo dal no, senza un programma comune.',
      },
      {
        id: 'iniziativa_autonoma_identita',
        label: 'Organizzare una tua convention programmatica autonoma per marcare la tua identità',
        stance: 'Autonomo / Identitario',
        description:
          'Evitare di confonderti nel mucchio e presentare una piattaforma chiara con la tua leadership.',
        budgetDelta: -6000,
        demoEffects: { imprese: 1.1, giovani: 1.0, lavoratori: 0.5 },
        axisShift: { institutions: -1 },
        stateEffects: { socialStability: 1 },
        relationEffects: { sameSide: -5 },
        loyaltyDelta: 3,
        headlineResult:
          'Convention autonoma di grande impatto mediatico: identità chiarissima, ma attriti con gli altri partiti.',
        rivalReaction: 'Preferiscono coltivare il proprio orticello invece di fare squadra.',
      },
      {
        id: 'contro_manovra_parlamento',
        label: 'Presentare in Parlamento una contro-manovra dettagliata con coperture certificate',
        stance: 'Istituzionale / Competenza',
        description:
          'Sfida sul terreno dei numeri e della serietà di bilancio per convincere gli elettori moderati.',
        budgetDelta: -3500,
        demoEffects: { imprese: 1.2, pensionati: 0.9, lavoratori: 0.6 },
        axisShift: { europe: 3 },
        stateEffects: { spread: -3, democraticHealth: 3 },
        relationEffects: { institutional: 6 },
        loyaltyDelta: 1,
        headlineResult:
          'Contro-manovra d’opposizione lodata dagli economisti: cresce la credibilità di governo.',
        rivalReaction: 'Un documento tecnico che non scalda il cuore degli elettori.',
      },
    ],
  },
  {
    id: 'ev_campagna_faccia_a_faccia_tv',
    category: 'Società',
    severity: 'Critica',
    context: 'campagna',
    onlyDuringCampaign: true,
    title: 'Sprint elettorale in prima serata: sfida sulle coperture dei programmi e delle promesse fiscali',
    summary:
      'A poche settimane dal voto i talk show serali incalzano i leader sulla fattibilità delle promesse elettorali. Gli elettori indecisi rappresentano ancora il 25% del Paese.',
    options: [
      {
        id: 'contratto_elettori_concretezza',
        label: 'Firmare un "Patto con gli Elettori" su 5 punti chiari con coperture nero su bianco',
        stance: 'Credibilità / Moderati',
        description:
          'Conquistare il voto degli indecisi puntando su concretezza, serietà e realismo economico.',
        budgetDelta: -5500,
        demoEffects: { imprese: 1.5, pensionati: 1.1, lavoratori: 0.8, giovani: 0.7 },
        axisShift: { europe: 2 },
        stateEffects: { spread: -4, democraticHealth: 3 },
        loyaltyDelta: 2,
        headlineResult:
          'Il Patto con gli Elettori convince gli indecisi: forte balzo di credibilità nel rush finale.',
        rivalReaction: 'Un elenco di promesse già sentite in ogni campagna elettorale.',
      },
      {
        id: 'proposta_shock_fisco_salari',
        label: 'Lanciare una grande proposta bandiera ad alto impatto emotivo su tasse o salari',
        stance: 'Mobilitazione / Offensiva',
        description:
          'Dominare le prime pagine e i social nell’ultima parte della campagna per scaldare la base.',
        budgetDelta: -7000,
        demoEffects: { lavoratori: 1.7, giovani: 1.3, pensionati: 0.9, imprese: -0.6 },
        axisShift: { economic: -3 },
        stateEffects: { spread: 5, socialStability: 2 },
        loyaltyDelta: 3,
        headlineResult:
          'Proposta bandiera al centro del dibattito TV: la base si accende, gli avversari inseguono.',
        rivalReaction: 'Demagogia pre-elettorale irrealizzabile il giorno dopo il voto.',
      },
      {
        id: 'tour_ascolto_piazze_mercati',
        label: 'Snobbare i salotti TV e chiudere la campagna con un tour popolare in 20 province',
        stance: 'Territorio / Popolare',
        description:
          'Parlare direttamente a famiglie, operai e artigiani lontano dalle polemiche da studio.',
        budgetDelta: -6000,
        demoEffects: { pensionati: 1.3, lavoratori: 1.3, imprese: 0.7, giovani: 0.5 },
        regionEffects: { sud: 0.7, nord_est: 0.7, centro: 0.6 },
        axisShift: { society: -1 },
        stateEffects: { socialStability: 3 },
        loyaltyDelta: 3,
        headlineResult:
          'Tour popolare nelle province: piazze piene e forte spinta territoriale verso le urne.',
        rivalReaction: 'Fuggono dal confronto televisivo perché non sanno rispondere sui numeri.',
      },
    ],
  },
  {
    id: 'ev_campagna_astensionismo_giovani',
    category: 'Società',
    severity: 'Alta',
    context: 'campagna',
    onlyDuringCampaign: true,
    title: 'Allarme astensionismo: i sondaggi indicano che quasi metà degli under 30 diserterà le urne',
    summary:
      'Sfiduciati dalla politica tradizionale e bloccati fuori sede, milioni di giovani rischiano di non andare a votare. Mobilitarli può ribaltare l’esito elettorale.',
    options: [
      {
        id: 'manifesto_under30_voto_fuorisede',
        label: 'Lanciare un Manifesto Giovani su casa, lavoro, clima e diritto di voto ai fuorisede',
        stance: 'Generazione Futuro',
        description:
          'Mettere candidati under 35 in posizioni eleggibili e parlare direttamente ai loro bisogni.',
        budgetDelta: -5000,
        demoEffects: { giovani: 2.4, lavoratori: 0.7, pensionati: -0.3 },
        axisShift: { society: 4, institutions: -3 },
        stateEffects: { democraticHealth: 5, socialStability: 3 },
        loyaltyDelta: 2,
        headlineResult:
          'Boom di partecipazione tra gli under 30: il Manifesto Giovani riaccende l’entusiasmo al voto.',
        rivalReaction: 'Si ricordano dei giovani soltanto a un mese dalle elezioni.',
      },
      {
        id: 'campagna_digitale_podcast_creator',
        label: 'Investire in podcast, dirette streaming e Q&A trasparenti con creator indipendenti',
        stance: 'Digitale / Diretto',
        description:
          'Abbandonare il politichese e rispondere senza filtri alle domande reali della Generazione Z.',
        budgetDelta: -4500,
        demoEffects: { giovani: 1.9, imprese: 0.6, lavoratori: 0.4 },
        axisShift: { society: 2 },
        stateEffects: { democraticHealth: 2 },
        loyaltyDelta: 1,
        headlineResult:
          'Maratona podcast e dirette streaming: ottimi riscontri tra studenti e giovani professionisti.',
        rivalReaction: 'Una strategia di marketing che sostituisce i contenuti con gli influencer.',
      },
      {
        id: 'appello_civico_famiglie_stabilità',
        label: 'Puntare sul voto utile di famiglie, lavoratori e pensionati chiedendo stabilità',
        stance: 'Voto Utile / Stabile',
        description:
          'Consolidare lo zoccolo duro degli elettori che vanno sempre alle urne.',
        budgetDelta: -3000,
        demoEffects: { pensionati: 1.6, imprese: 0.9, lavoratori: 0.8, giovani: -0.6 },
        axisShift: { society: -2 },
        stateEffects: { socialStability: 2 },
        loyaltyDelta: 2,
        headlineResult:
          'Appello al voto utile: cresce la mobilitazione di pensionati e famiglie, freddi gli under 30.',
        rivalReaction: 'Rassegnarsi all’astensione dei giovani è una sconfitta per la democrazia.',
      },
    ],
  },
];

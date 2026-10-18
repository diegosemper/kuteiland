// Alle teksten die de speler ziet. Kort, droog, een beetje zwart.

export const TEXT = {
  intro: [
    'Je wordt wakker.',
    'Onder je: niets. Heel veel niets.',
    'Een boom. Half dood. Jij ook, zo te zien.',
  ],
  introHint: 'Loop naar de boom. Druk op HAK.',
  welcomeBack: 'Je bent er weer. Het eiland ook. Nog wel.',

  firstWood: 'Wrakhout. Het begin van een imperium. Of van een kampvuur.',
  tenWood: 'Tien stuks hout en nergens om het te laten.',

  edge: [
    'De leegte kijkt terug.',
    'Nee.',
    'Daar beneden is niks. Ook geen bodem.',
    'Eén stap verder en je bent een anekdote.',
  ],

  chestTitle: 'KIST',
  chestSubtitle: 'Wat hier ligt, overleeft jou.',
  chestCarried: 'BIJ JE',
  chestStored: 'IN DE KIST',
  chestStore: 'OPBERGEN',
  chestTake: 'PAKKEN',
  chestStoreAll: 'ALLES OPBERGEN',
  chestNothingCarried: 'Je zakken zijn leeg.',
  chestEmpty: 'Leeg. Zoals je toekomst.',

  noPath: 'Daar kom je niet bij. Nog niet.',

  noPickaxe: [
    'Met je blote handen? Moedig. Dom, maar moedig.',
    'Steen tegen knokkels. Raad eens wie wint.',
    'Een houweel zou helpen. Die maak je bij de werkbank.',
  ],

  // bouwen
  build: 'BOUW',
  buildDone: 'KLAAR',
  buildNothing: 'Niks om te bouwen. Maak eerst iets bij de werkbank.',
  buildHint: 'Tik op een oplichtende plek.',
  buildNoSpot: 'Daar niet.',

  // craften
  craftTitle: 'WERKBANK',
  craftSubtitle: 'Hout, puin en goede moed.',
  craftMake: 'MAAK',
  craftOwned: 'IN BEZIT',
  handTitle: 'MAKEN',
  moreAtBench: 'Meer recepten bij een werkbank.',
  toolsTitle: 'GEREEDSCHAP',

  // doelen
  objectiveLabel: 'DOEL',
  objectives: {
    hout: 'Hak wrakhout van de boom',
    werkbank: 'Maak een werkbank in je RUGZAK',
    werkbank_zetten: 'Zet de werkbank neer met BOUW',
    houweel: 'Maak een houten houweel bij de werkbank',
    blok: 'Maak een vlonder en maak het eiland groter',
    generator: 'Maak een steengenerator en zet hem neer',
    puin: 'Delf puin uit de steengenerator',
    steen: 'Maak stenen gereedschap',
    vang: 'Tik drijvend wrak aan voor het wegzweeft',
    wapen: 'Maak een wapen bij de werkbank',
    lamp: 'Maak een lantaarn en zet hem neer',
    overleef: 'Overleef de nacht',
    kristal: 'Verzamel leegtekristallen van nachtwezens',
    toren: 'Bouw een wachttoren',
    anker: 'Bouw een anker tegen het afbrokkelen',
    herstel: 'Herstel een barst voor hij valt',
    anker2: 'Versterk een anker',
    brug: 'Maak een brug en bouw richting een ander eiland',
    asveld: 'Bereik het Asveld',
    kristalklip: 'Bereik de Kristalklip',
    sterrenstof: 'Delf sterrenstof op de Kristalklip',
    zwavelklif: 'Bouw bruggen naar de tweede ring en bereik het Zwavelklif',
    bewaker: 'Roep een bewaker op bij zijn altaar en versla hem',
    harnas: 'Maak een harnas bij de werkbank',
    aambeeld: 'Maak een aambeeld en versterk iets naar +1',
    machine: 'Bouw je eerste machine (ontgrendel via collecties)',
    zegels: 'Verzamel de vier zegels van de bewakers',
    kern: 'Bouw een sterrenbrug naar de Kern',
    diepte5: 'Bereik diepte 5 in de poort bij de Kern',
    diepte20: 'Bereik diepte 20',
    hoeder: 'Wek de Kern en versla wat eruit komt',
    cyclus: 'Begin een nieuwe cyclus bij de Kern',
    nacht3: 'Overleef drie nachten',
    hakken3: 'Haal level 3 in Hakken',
    collectie: 'Haal Wrakhout-collectie II (zie SKILLS, tab COLLECTIES)',
    roest: 'Vang roest uit de leegte',
    roestgereedschap: 'Maak roestig gereedschap',
    groter: 'Maak het eiland groter',
    skill5: 'Haal level 5 in een skill',
  },
  objectiveDone: {
    hout: 'Genoeg om iets mee te doen. Bijna.',
    werkbank: 'Een werkbank. Je eerste meubel in het niets.',
    werkbank_zetten: 'Hij staat. Scheef, maar hij staat.',
    houweel: 'Een houweel. Nu nog iets om op te slaan.',
    blok: 'Het eiland is groter. Een beetje. Het begint ergens op te lijken.',
    generator: 'Leegte erin, steen eruit. Vraag niet hoe.',
    puin: 'Puin. De wereld in kleine stukjes. Handig.',
    steen: 'Stenen gereedschap. De vooruitgang is niet te stoppen.',
    vang: 'Andermans afval. Nu van jou.',
    wapen: 'Een wapen. Je voelt je meteen een stuk minder hulpeloos. Een stuk.',
    lamp: 'Licht. Ze haten het. Jij gaat het nodig hebben.',
    overleef: 'Je leeft nog. Dat was niet de bedoeling van de nacht.',
    kristal: 'Leegtekristallen. Ze zoemen zachtjes. Negeer dat.',
    toren: 'Een toren die voor je vecht. Eindelijk iemand die helpt.',
    anker: 'Vastgeschroefd aan het niets. Het werkt. Vraag niet hoe.',
    herstel: 'Gelijmd met puin en koppigheid.',
    anker2: 'Dieper verankerd. Het eiland blijft. Jij ook.',
    brug: 'Een brug. Over het niets heen. Kijk niet naar beneden.',
    asveld: 'Een nieuw stuk wereld. Het ziet er net zo vrolijk uit als het oude.',
    kristalklip: 'Hier groeit de leegte als kristal. Mooi. Verontrustend.',
    sterrenstof: 'Sterrenstof. Het enige hier dat nog glanst zonder te dreigen.',
    zwavelklif: 'De tweede ring. Het wordt hier niet gezelliger.',
    bewaker: 'Een bewaker minder. Hij had het waarschijnlijk verdiend.',
    harnas: 'Een harnas. Nu doet het nog steeds pijn, maar minder.',
    aambeeld: 'Plus één. De wereld is nog steeds kapot, maar jouw spullen niet.',
    machine: 'Een machine die voor je werkt. Eindelijk iemand.',
    zegels: 'Vier zegels. Het hart ligt open.',
    kern: 'Je staat op de Kern. Het hart klopt onder je voeten.',
    diepte5: 'Diepte 5. Het wordt alleen maar dieper.',
    diepte20: 'Diepte 20. Er is geen bodem. Dat wist je toch al.',
    hoeder: 'Het is stil. Voor het eerst sinds lang echt stil.',
    cyclus: 'Opnieuw. Maar nu weet je het.',
    nacht3: 'Drie nachten. De leegte begint je te kennen.',
    hakken3: 'Je bijl en jij beginnen elkaar te begrijpen.',
    collectie: 'Elke stapel telt. Dat blijft zo, tot in het absurde.',
    roest: 'Roest. Ooit was dit iets belangrijks.',
    roestgereedschap: 'Roestig, maar scherp. Net als jij.',
    groter: 'Een echt eiland. Jammer dat het straks donker wordt.',
    skill5: 'Level 5. Je wordt ergens goed in. Niemand die het ziet.',
  },
  objectivesDone: 'Meer volgt. Net als de nacht.',

  // drijvend wrak
  driftFar: 'Te ver. Loop naar de rand.',
  driftGone: 'Weg. De leegte geeft, de leegte neemt.',
  driftFirst: 'Er drijft iets langs. Tik het aan.',

  // dag en nacht
  dayLabel: 'DAG',
  nightLabel: 'Nacht',
  nightLabelCaps: 'NACHT',
  duskFirst: 'De zon zakt. Iets in de leegte wordt wakker. Maak een wapen en een lantaarn.',
  dusk: [
    'Het wordt donker. Je weet wat er komt.',
    'De zon geeft het op. Doe jij dat niet.',
    'Schemer. Ze ruiken je al.',
  ],
  nightFirst: 'Nacht. Ze klimmen omhoog. Blijf in het licht.',
  night: ['Ze komen.', 'Meer dan gisteren.', 'Ze hebben je gemist.', 'Hou je vast.'],
  dawn: [
    'Licht. Ze trekken zich terug. Voorlopig.',
    'Je hebt het overleefd. Niemand die applaudisseert.',
    'Dag. De leegte doet alsof er niks gebeurd is.',
  ],
  nightCleared: 'Stil. Voor nu.',
  structureLost: ['Een muur minder.', 'Kapot. Ze leren snel.', 'Weg. Bouw het opnieuw.'],
  wallTouch: 'Puin, opgestapeld met hoop.',
  lampLit: 'Het licht houdt ze op afstand. Een beetje.',
  lampDay: 'Overdag doet hij niks. Net als jij.',
  towerTouch: 'Hij let op. Beter dan jij.',

  // afbrokkelen en ankers
  crumbleFirst: 'De rand scheurt. Het eiland wil terug naar beneden. Herstel het, of bouw een anker.',
  crumbleStart: ['Weer een barst. Ergens aan de rand.', 'Het eiland kraakt.', 'Daar scheurt iets. Kijk uit je doppen.'],
  crumbleHealed: 'Het anker houdt hem vast.',
  crumbleFell: ['Weg. De leegte nam een hapje.', 'Een stukje minder eiland.', 'Gevallen. Niemand hoorde het landen.'],
  objectFell: 'Het viel mee naar beneden. Je ving nog net je',
  playerShoved: 'De grond verdween onder je voeten. Net op tijd gesprongen.',
  repaired: 'hersteld',
  repairCant: 'Herstellen kost 1 puin of 2 wrakhout. Je hebt geen van beide.',
  anchorTitle: 'ANKER',
  anchorSubtitle: 'Wat binnen bereik ligt, blijft liggen.',
  anchorLevel: 'Niveau',
  anchorRange: 'Bereik',
  anchorTiles: 'tegels',
  anchorCovers: 'Vastgehouden',
  anchorNext: 'Versterken kost',
  anchorUpgrade: 'VERSTERK',
  anchorMax: 'Sterker wordt hij niet. Bouw er een bij.',
  anchorUpgraded: 'Het anker zakt dieper. De grond zucht.',

  // verhaal: vijf fragmenten
  notes: {
    1: {
      title: 'Ingekrast in een steen',
      text: 'Dag één. De grond is weg. Iedereen is weg.\n\nIk heb een boom. Ik praat tegen de boom. '
        + 'De boom zegt niks terug, wat eerlijk gezegd een verbetering is ten opzichte van mijn collega\'s.\n\n'
        + 'Er hangt een licht in de verte. Het knippert alsof het iets wil zeggen. Ik denk dat het boos is.',
    },
    2: {
      title: 'Een verbrande werkorder',
      text: 'PROJECT KERN — BOORFASE 7\nDoel: 40% meer energie voor de bovensteden.\n\n'
        + 'Opmerking van de ploegbaas: de grond trilt bij elke boorslag. De geologen zeggen dat dat normaal is. '
        + 'De geologen wonen niet hier.\n\nOndertekend: [de handtekening is weggebrand].',
    },
    3: {
      title: 'Gekrast in kristal',
      text: 'De kristallen zijn geen steen. Het is gestolde leegte, uit het hart gelekt toen we het openboorden.\n\n'
        + 'Wie ze te lang aanraakt, verandert. Eerst de ogen. Dan de rest.\n\n'
        + 'Ze kruipen \'s nachts omhoog. Ze zoeken het licht. Ik denk dat ze naar huis willen. Ik denk dat ze ons waren.',
    },
    4: {
      title: 'Plaquette bij de ingang',
      text: 'HIER RUST DE KERN\nHet hart dat de wereld bij elkaar hield.\n\n'
        + 'Wij hebben het wakker gemaakt. Het was niet blij.\n\n'
        + 'Wie dit leest: raak het niet aan. Of doe het wel. Erger dan nu kan het toch niet.',
    },
    6: {
      title: 'Een zwavelgele logboekpagina',
      text: 'Ploegbaas Verhoef hier. De boorkop is weer gesmolten. Wij smelten hem bij.\n\n'
        + 'Iemand heeft hem in zwavel gedoopt zodat hij niet meer slijt. Hij slijt nu niet meer. Hij eet.\n\n'
        + 'Als je dit leest en er staat iets groots en geels naast je: dat was ik.',
    },
    7: {
      title: 'Krabbels op een paddenstoel',
      text: 'De sporen kwamen mee met de boorvloeistof. Eerst groeiden ze op de machines. Toen op ons.\n\n'
        + 'Mijn armen voelen zacht. Mijn gedachten ook. Het is niet onaangenaam.\n\n'
        + 'Ze noemen haar de moeder nu. Ik noem haar Ineke. Zo heette ze toen ze nog koffie haalde.',
    },
    8: {
      title: 'Ingevroren in het ijs',
      text: 'Koelsysteem van boorfase 7: onvoldoende. Dat stond in het rapport. Ik heb het rapport ondertekend.\n\n'
        + 'We hebben de leegte stilgezet met kou. Het werkte drie weken. Toen werkte het andersom.\n\n'
        + 'Ik heb het nooit meer warm gehad. De koning ook niet.',
    },
    9: {
      title: 'Wat de kloof terugzegt',
      text: 'Hier is het gat waar de boor doorheen ging. Alles wat erin viel, roept nog.\n\n'
        + 'Je hoort je eigen naam. Je hoort je eigen stem die het bevel geeft. "Doorgaan."\n\n'
        + 'De echo is de enige die nog luistert naar wat je toen zei.',
    },
    5: {
      title: 'Wat de Kern je laat zien',
      text: 'De Hoeder valt. Het hart wordt even stil, en dan zie je het.\n\n'
        + 'De Kern was een anker. Het grootste. Alle grond hing eraan vast, zoals jouw eiland aan je roestige staken. '
        + 'Iemand besloot dat een anker ook een batterij kon zijn. Iemand tekende de order voor boorfase 7.\n\n'
        + 'Je kijkt naar de weggebrande handtekening en je weet ineens van wie hij is.\n\n'
        + 'Hij is van jou.\n\n'
        + 'De wereld brak omdat jij meer licht wilde. De leegte heeft je niet opgegeten. Ze heeft je teruggestuurd, om het te zien.',
    },
  },
  nodeNeedsTool: {
    wrak: 'dit lukt alleen met een houweel.',
    kristalader: 'hier heb je minstens een stenen houweel voor nodig.',
    sterrenader: 'te hard. Alleen een roestig houweel krijgt hier iets los.',
    zwavelader: 'zwavel breekt alleen voor een roestig houweel.',
    paddenstoel: 'die steel is taaier dan hij eruitziet. Roestig houweel nodig.',
    ijsader: 'zo koud dat alleen een kristallen houweel erdoor komt.',
    zielenader: 'de zielen laten niet los voor minder dan een kristallen houweel.',
  },
  bossStart: 'Het hart scheurt open. Iets stapt eruit. Het is niet blij je te zien.',
  kernSealed: 'Het hart zit dicht. Vier zegels, één per bewaker op de verre eilanden. Je hebt er',
  sealGained: 'Een zegel valt van het hart. Zegels:',
  guardianFirst: 'Hij bewaakt een van de zegels.',
  guardianAgain: 'Hij is terug. Hij heeft er spijt van dat hij er was. Jij straks ook.',
  heartDrop: 'Een leegtehart. Het klopt nog. Zeldzaam en walgelijk.',
  portalClosed: 'De poort is dicht zolang het hart bewaakt wordt.',
  depthStart: 'Je stapt de poort door. De Diepte ruikt je.',
  depthLabel: 'Diepte',
  depthCleared: 'Golf verslagen. De volgende komt eraan.',
  depthDied: 'De Diepte heeft je uitgespuugd.',
  depthStopped: 'Je trekt je terug.',
  depthReached: 'Bereikt: diepte',
  depthBest: 'Je beste:',
  cycleRule: 'Regel van deze cyclus:',

  // machines en aambeeld
  machineLevel: 'NIVEAU',
  machineSubtitle: 'Werkt zolang jij er bent. Net als jij.',
  machineMakes: 'Maakt',
  machineRate: 'Snelheid',
  perMinute: 'per minuut',
  machineStored: 'Opgeslagen',
  machineUpgradeCost: 'Verbeteren kost',
  machineMax: 'Sneller wordt hij niet.',
  machineCollect: 'OPHALEN',
  machineUpgrade: 'VERBETER',
  machineUpgraded: 'is nu niveau',
  anvilTitle: 'AAMBEELD',
  anvilSubtitle: 'Slaan tot het beter wordt. Werkt ook bij gereedschap.',
  anvilNoGear: 'Nog niks om te versterken.',
  anvilMax: 'Sterker kan niet. Dit is het.',
  gearUpgraded: 'Sterker. Zwaarder. Beter.',
  bossPhase2: 'De Hoeder brult. Het licht in zijn borst wordt fel. Nu wordt het menens.',
  bossName: 'DE HOEDER VAN DE KERN',
  storyClose: 'VERDER',

  // kaart
  mapButton: 'KAART',
  mapTitle: 'KAART',
  mapSubtitle: 'Wat er nog over is van de wereld.',
  mapUnknown: '???',
  mapYou: 'jij',
  mapHint: 'Bruggen maak je bij de werkbank. Het laatste stuk naar de Kern vraagt een sterrenbrug.',

  // prestige
  prestigeTitle: 'NIEUWE CYCLUS',
  prestigeSubtitle: 'Begin opnieuw op een kaal eilandje. Neem één ding mee dat blijft.',
  prestigeCycle: 'Cyclus',
  prestigeGo: 'BEGIN OPNIEUW',
  prestigePick: 'Kies wat je meeneemt:',
  prestigeHave: 'Al verzameld:',
  cycleLabel: 'C',

  // geluid
  soundMusic: 'MUZIEK',
  soundSfx: 'GELUID',
  on: 'AAN',
  off: 'UIT',

  // doodgaan
  deathTitle: 'Je bent gevallen.',
  deathLost: 'Achtergelaten:',
  deathNothing: 'Je had niks om te verliezen. Ook een strategie.',
  deathOldLost: 'Wat er nog van de vorige keer lag, is nu van de leegte.',
  deathReturn: 'Ophalen kan als het weer dag is.',
  graveNight: 'De leegte houdt het nog even vast. Kom terug als het licht is.',
  graveBack: 'Terug:',

  // voortgang: skills en collecties
  progressTitle: 'VOORTGANG',
  tabSkills: 'SKILLS',
  tabCollections: 'COLLECTIES',
  milestone: 'MIJLPAAL',
  milestoneAt: 'Mijlpaal op level',
  collectionWord: 'Collectie',
  collectionKills: 'Nachtwezens',
  collectionNext: 'Volgende',
  collectionRecipe: 'Recept',
  collectionUnlocked: 'Nieuw recept',
  collectionDone: 'Voltooid. Respect, of zorgwekkend.',

  // skills
  skillsButton: 'SKILLS',
  skillsTitle: 'SKILLS',
  skillsSubtitle: 'Wat je vaak doet, ga je beter doen. Zelfs hier.',
  skillLevel: 'Level',
  skillMax: 'MAX',
  skillNext: 'Volgende',
  skillFightLater: 'Komt als het donker wordt.',
  skillUp: {
    hakken: ['Je hakt al bijna als iemand die weet wat hij doet.', 'De boom heeft respect voor je. Of angst.', 'Spaanders vliegen. Jij niet.'],
    delven: ['Steen geeft zich sneller over.', 'Je knokkels zijn eelt geworden. Handig.', 'Puin is ook een carrière.'],
    bouwen: ['Je bouwsels staan iets rechter.', 'Minder hout weg, meer eiland erbij.', 'Architect van niks. Maar wel een goede.'],
    vechten: ['Je slaat harder. De leegte merkt het.'],
  },
  doubleDrop: 'dubbel!',

  // minigames
  mgBest: 'Beste:',
  treeName: 'De halfdode boom',
  mgTapToStart: 'TIK OM TE BEGINNEN',
  mgTapAnywhere: 'tik waar je wil',
  mgDone: 'KLAAR',
  mgScore: 'SCORE',
  mgRecord: 'NIEUW RECORD!',
  mgNothing: 'Niks. Helemaal niks. Knap eigenlijk.',
  mgAgain: 'NOG EEN KEER',
  mgBack: 'TERUG',
  mgNightFalls: 'DE NACHT VALT',
  mgCombo: 'COMBO',
  mgMiss: 'MIS',
  mgHits: 'raak',
  mgPerfects: 'perfect',
  mgBestCombo: 'beste combo',
  mgPerfect: ['PERFECT', 'PRACHTIG', 'RAAK', 'MOOI ZO', 'KNAL'],
  mgNoNight: 'Het is nacht. Eerst overleven, dan pas hakken.',
  mgNoFight: 'Niet nu. Er wil iets je dood hebben.',
  mgNightWaits: 'De nacht wachtte netjes tot je klaar was. Hij is er nu.',
  mgHakkenHow: 'Een pijl schiet heen en weer.\nTik als hij in het groen staat.\nGoud = perfect, dubbele punten.\n\n'
    + 'Raak achter elkaar = combo:\nmeer hout, maar een snellere pijl.\nDrie keer mis en de boom wint.',
  mgHakkenTime: 'Tijd op. De boom staat er nog. Jij ook, net.',
  mgHakkenLives: [
    'Drie keer mis. De boom heeft gewonnen. Voor nu.',
    'Drie keer naast. De boom voelt zich gesterkt.',
    'Je hakte vooral lucht. Lucht levert niks op.',
  ],
  mgProefHow: 'Deze minigame wordt nog gebouwd.\nTot die tijd: tik alles wat oplicht\nvoordat het weer dooft.',
  mgProefEnd: 'Tijd op. De echte versie wordt erger. Beloofd.',
  freeBlock: '+1 gratis',

  bagTitle: 'RUGZAK',
  bagEmpty: 'Leeg. Zelfs je zakken zijn eenzaam.',
  close: 'SLUIT',
  reset: 'WIS VOORTGANG',
  resetConfirm: 'ZEKER? TIK NOG EENS',
};

export function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

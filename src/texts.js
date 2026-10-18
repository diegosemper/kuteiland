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
    nacht3: 'Overleef drie nachten',
    hakken3: 'Haal level 3 in Hakken',
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
    nacht3: 'Drie nachten. De leegte begint je te kennen.',
    hakken3: 'Je bijl en jij beginnen elkaar te begrijpen.',
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

  // doodgaan
  deathTitle: 'Je bent gevallen.',
  deathLost: 'Achtergelaten:',
  deathNothing: 'Je had niks om te verliezen. Ook een strategie.',
  deathOldLost: 'Wat er nog van de vorige keer lag, is nu van de leegte.',
  deathReturn: 'Ophalen kan als het weer dag is.',
  graveNight: 'De leegte houdt het nog even vast. Kom terug als het licht is.',
  graveBack: 'Terug:',

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

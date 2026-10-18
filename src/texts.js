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

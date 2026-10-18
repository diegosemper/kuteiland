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

  bagTitle: 'RUGZAK',
  bagEmpty: 'Leeg. Zelfs je zakken zijn eenzaam.',
  bagCraftHint: 'Craften vraagt een werkbank. Die heb je niet.',
  close: 'SLUIT',
  reset: 'WIS VOORTGANG',
  resetConfirm: 'ZEKER? TIK NOG EENS',
};

export function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Wat De Stem zegt. Iets in de leegte onder je eiland praat tegen je: droog, gemeen, af en toe bijna lief.
// {deaths}, {day}, {n}, {name} worden ingevuld. Het verhaal (story) komt stukje voor stukje, één keer.

export const VOICE = {
  name: 'DE STEM',

  // ---------- reacties ----------
  died: [
    'Oei. Dat zag er pijnlijk uit. Van hieruit in elk geval.',
    'Je ligt. Ik lig ook. Al heel lang. Je went eraan.',
    'Weet je wat het verschil is tussen jou en de wezens? Zij hadden een plan.',
    'Dood. Maar tijdelijk. Zoals alles hier, behalve ik.',
    'Je spullen liggen nog daar. Net als jij, net.',
  ],
  diedMany: [
    'Dat is {deaths} keer dood. Ik tel mee. Iemand moet het doen.',
    'Nummer {deaths}. Je bent er goed in aan het worden. In doodgaan.',
    '{deaths} keer. Ik heb een lijstje. Jij staat op alle plekken.',
  ],
  respawn: [
    'Daar ben je weer. Niemand heeft je gemist. Ik een beetje.',
    'Terug. Met dezelfde ideeën als net. Spannend.',
  ],
  craftTool: [
    'Een nieuw stuk gereedschap. Kijk jou eens, met je {name}.',
    '{name}. Je bent er trots op. Ik zie het. Het is een beetje zielig.',
    'Mooi, {name}. De vorige gaat in de leegte. Ik bewaar ze allemaal.',
  ],
  placeSource: [
    'Weer iets dat aan mij trekt. Je bent niet de eerste. Wel de vasthoudendste.',
    'Nog een bron. Je eiland begint te kraken van ambitie.',
    'Hij werkt. Hij zuigt aan de leegte. Aan mij dus. Ik zeg het maar even.',
  ],
  discovery: [
    'Oh, dat had je zelf ontdekt. Ik zou het je nooit verteld hebben.',
    '{name}. Je wordt nieuwsgierig. Dat eindigt hier altijd hetzelfde.',
    'Een ontdekking. Schrijf het op. Of niet. Ik onthoud het wel.',
  ],
  skillUp: [
    'Je wordt beter. In iets. Gefeliciteerd. Ik klap. Je hoort het niet.',
    'Level omhoog. Het eiland is onder de indruk. Ik niet. Nog niet.',
  ],
  nightStart: [
    'Het wordt donker. Ik heb wat vrienden uitgenodigd.',
    'Nacht {n}. Ze komen. Ze komen altijd.',
    'Doe de lampen maar aan. Niet dat het helpt. Een beetje misschien.',
  ],
  siegeWon: [
    'Je hebt het gehaald. Ik doe alsof het me niks kan schelen.',
    'Ze zijn weg. Ik stuur er morgen meer. Niet persoonlijk bedoeld.',
    'Nacht {n} overleefd. Je wordt koppig. Ik waardeer koppig.',
  ],
  bossStart: [
    'Ah. Jullie kennen elkaar nog niet. Wees aardig. Of niet, maakt mij niet uit.',
    'Die is groot, hè. Ik heb hem gemaakt van dingen die ik niet meer nodig had.',
  ],
  bossDown: [
    'Hij is neer. Ik had hem graag. Een beetje.',
    'Mooi gedaan. Ik zeg dat niet vaak. Ik zeg dit eigenlijk nooit.',
  ],
  idle: [
    'Je staat stil. Ik ook. Al eeuwen. Het wordt niet leuker.',
    'Hallo? Ben je er nog? Of ben je ook leegte geworden?',
    'Niks doen is ook een keuze. De slechtste, maar toch.',
    'Ik hoor je denken. Het klinkt als een lege ketel.',
  ],
  repaired: [
    'Opgelapt. Hij houdt het tot de volgende keer. Precies tot de volgende keer.',
    'Je repareert dingen. Dat is schattig. Alles gaat toch weer stuk.',
  ],
  collection: [
    'Je verzamelt. Ik ook. Eilanden, voornamelijk.',
    'Weer een stapel. Je bent een hamsteraar. Een ijverige.',
  ],

  // ---------- minigames (op het resultaatscherm) ----------
  mg: {
    record: [
      'Een record. Ik zal het in mijn geheugen bewaren. Tussen de rest.',
      'Beter dan ooit. Ik ben bijna onder de indruk. Bijna.',
      'Nieuw record. Nu weet je wat je de volgende keer niet gaat halen.',
    ],
    nothing: [
      'Niks. Helemaal niks. Dat is ook een soort talent.',
      'Leeg. Net als ik. Welkom.',
    ],
    bad: [
      'Was dat het? Oké. Ik doe alsof ik het niet zag.',
      'Je kunt het beter. Statistisch gezien. Nauwelijks.',
      'Hm. Volgende keer met je ogen open misschien.',
    ],
    good: [
      'Niet slecht. Niet goed ook. Gewoon niet slecht.',
      'Kijk eens aan. Je kunt iets.',
      'Netjes. Ik voel me bijna leeggeroofd.',
    ],
    hakken: ['De boom groeit terug. Hij vergeeft je niet. Hij vergeet het wel.', 'Hout. Je bouwt er straks iets mee dat ik opeet.'],
    delven: ['Je graaft in mij. Doe voorzichtig. Of niet. Ik heb meer lagen.', 'Dieper is beter. Totdat het dat niet meer is.'],
    grijphaak: ['Mijn afval is jouw schat. Ik oordeel niet. Hardop.', 'Visje gevangen? Nee. Roest. Feest.'],
    afdalingLost: ['Je viel in mij en ik hield alles. Dank je.', 'Gulzig. Ik waardeer gulzig. Ik eet er van.', 'Alles kwijt. Het ligt hier nu. Bij mij. Gezellig.'],
    afdalingSafe: ['Je ging terug. Lafaard. Slimme lafaard.', 'Veilig boven. Volgende keer dieper. Dat zeggen ze allemaal.'],
    koken: ['Het ruikt naar rotte eieren. Dat ben ik niet. Deze keer.', 'Zwavel. Ik heb het in mijn adem.'],
    sterrenvangst: ['Mijn sterren. Je vangt ze alsof ze van jou zijn.', 'Ze vielen naar jou. Vroeger vielen ze naar mij.'],
    arena: ['Mijn kinderen. Een paar minder nu. Ik heb er genoeg.', 'Zielen. Zuinig mee zijn. Ze zijn niet terug te brengen.'],
  },

  // ---------- het verhaal ----------
  story: {
    hallo: 'Hallo. Nee, niet omkijken. Ik ben niet achter je. Ik ben onder je.',
    werkbank: 'Een werkbank. Het begint altijd met een werkbank. Daarna een boor. Daarna mij.',
    eersteNacht: 'Je leeft nog. Ik had gewed van niet. Tegen mezelf. Ik verloor.',
    magneet: 'Je trekt aan me. Met een magneet. Dat is... best persoonlijk.',
    boor: 'Je boort in mij. Ik zeg niks. Ik noteer het. Ik ben goed in noteren.',
    ontdekking: 'Weet je wat zij deden, de vorigen? Ze boorden ook. Ze wilden weten wat eronder zat. Ik zat eronder.',
    ketel: 'Ze noemden het boorfase zeven. Ik noemde het kietelen. Toen werd het minder grappig.',
    antenne: 'De sterren waren van mij, weet je. Voordat jullie kwamen boren. Ze vielen naar boven.',
    altaar: 'Die bewakers? Mijn kinderen. Zo voelt het. Zo ruiken ze ook. Doe rustig aan. Nee hoor, sla maar.',
    zegels: 'Vier zegels. Je komt dichterbij. Ik ook. Dat is wat dichterbij betekent.',
    hoeder: 'Je hebt hem verslagen. Hij was het slot. Ik ben de deur. Kom maar.',
    cyclus: 'Daar ben je weer. Alles is anders. Jij niet. Dat vind ik het fijne aan jou.',
    tiendeDag: 'Dag tien. Je bent hier langer dan de vorigen. Die hielden het bij zes. Ik vertel niet hoe.',
  },
};

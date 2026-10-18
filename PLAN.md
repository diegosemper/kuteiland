# Kuteiland: bouwplan

Dit is het complete plan voor het spel. Bouw het **fase voor fase**. Begin pas aan een nieuwe fase als de vorige werkt en getest is op een telefoon.

---

## 1. Het spel in het kort

Kuteiland is een mobiel webspel in de stijl van Minecraft Skyblock, maar met een eigen twist. De wereld is verwoest. De speler wordt wakker op een armoedig, zwevend eilandje boven een eindeloze leegte: één halfdode boom, een paar blokken aarde en een kist. Door te verzamelen, bouwen, vechten en ontdekken groeit het eiland en wordt de speler sterker.

**Doelgroep:** volwassen speler (20+). Niet kinderachtig.

**Kernregel:** geen wachttimers. De speler wordt sterker door actief te spelen, niet door te wachten. Bouwen en craften gaat direct of duurt hooguit een paar seconden. Een speelsessie van 3 uur moet constant iets te doen bieden.

---

## 2. Techniek

- **Taal:** JavaScript (geen TypeScript nodig)
- **Engine:** Phaser 3
- **Weergave:** isometrisch (schuin van bovenaf), 2D tiles die er 3D uitzien. De leegte onder het eiland moet zichtbaar zijn
- **Platform:** mobiele browser, staand scherm (portrait)
- **Installeerbaar:** als PWA (manifest + service worker), zodat de speler het op het beginscherm kan zetten
- **Hosting:** GitHub Pages. Geen server, geen backend
- **Opslaan:** automatisch in localStorage, elke 10 seconden en bij afsluiten
- **Prestaties:** moet soepel draaien op een gemiddelde telefoon (60 fps streven)

---

## 3. Stijl en sfeer

- Donker en sober kleurenpalet: diep paars en zwart voor de leegte, gedempte bruin- en grijstinten voor het eiland, gloeiende accenten voor kristallen
- Geen felle kleuren, geen schattige figuurtjes, geen mascottes
- Teksten kort en droog, met een vleugje zwarte humor. Geen "Goed gedaan! 🎉"
- Rustige, mysterieuze achtergrondmuziek overdag, spannender 's nachts
- Visuele assets: begin met simpele zelfgemaakte vormen of gratis pixel art. Mooie graphics komen later

---

## 4. Besturing

- **Joystick linksonder** om te lopen
- **Actieknop rechtsonder**: hakken, delven of aanvallen, afhankelijk van wat voor de speler staat
- **Bouwknop**: opent bouwmodus, waarin de speler een blok kiest en op een plek tikt om het te plaatsen
- **Inventaris- en craftknop** bovenin

---

## 5. Grondstoffen

| Grondstof | Hoe je het krijgt | Waarvoor |
|---|---|---|
| Wrakhout | Hakken van de boom, takken die langs zweven aantikken | Basisbouw, gereedschap |
| Puin | Delven uit een zelfgebouwde steengenerator | Blokken, muren |
| Roest | Wrakstukken die door de lucht drijven aantikken voordat ze wegzweven | Wapens, machines, ankers |
| Leegtekristal | Gedropt door nachtwezens | De beste upgrades |
| Sterrenstof | Alleen op verre eilanden | Eindspel, prestige |

---

## 6. Skills (personage wordt sterker)

Zoals in Hypixel Skyblock. Elke skill stijgt door hem te gebruiken:

- **Hakken**: sneller hout, meer opbrengst
- **Delven**: sneller puin, kans op dubbele opbrengst
- **Vechten**: meer schade, meer levens
- **Bouwen**: goedkopere blokken, sterkere ankers

Elk level geeft een kleine, duidelijk zichtbare bonus. De eerste levels gaan snel, latere levels langzamer.

---

## 7. Dag en nacht

- Dag duurt 5 minuten, nacht 2 minuten
- **Overdag:** rustig verzamelen en bouwen
- **'s Nachts:** wezens kruipen vanuit de leegte omhoog en vallen gebouwen en de speler aan
- Elke nacht worden de wezens iets sterker
- Verdediging: zelf vechten, plus muren, lampen en torens die automatisch helpen
- Nachtwezens droppen leegtekristallen
- Aanvallen gebeuren alleen als het spel open is. Offline gebeurt er niks ergs

---

## 8. Doodgaan

- De speler verliest **de helft** van wat hij bij zich draagt
- Alles in **de kist** is altijd veilig
- De verloren spullen blijven liggen op de plek van overlijden. Ophalen na de volgende nacht geeft ze terug. Sterft de speler opnieuw voordat ze opgehaald zijn, dan zijn ze definitief weg

---

## 9. Het unieke kenmerk: afbrokkelen

- De randen van het eiland brokkelen langzaam af en vallen de leegte in
- Blokken binnen bereik van een **anker** blijven stabiel
- Ankers kosten roest en kunnen geüpgraded worden voor een groter bereik
- Visueel: barsten verschijnen eerst, het blok trilt, en valt dan naar beneden. De speler moet dit zien aankomen en kunnen redden
- Afbrokkelen gaat langzaam genoeg om niet frustrerend te zijn, maar snel genoeg om de speler bezig te houden

---

## 10. Verhaal en einddoel

- In de verte gloeit **de Kern**, het hart van de oude wereld
- Met bruggen kan de speler naar nieuwe zwevende eilanden met nieuwe grondstoffen en sterkere vijanden
- Elk veroverd eiland brengt de speler dichter bij de Kern
- Bij de Kern wacht een eindbaas. Na de overwinning ontdekt de speler waarom de wereld brak
- Korte, droge verhaalfragmenten worden gevonden op eilanden (bijvoorbeeld briefjes of inscripties)

---

## 11. Prestige: nieuwe cyclus

- Na de eindbaas kan de speler opnieuw beginnen op een kaal eilandje
- In ruil krijgt hij een **blijvende bonus** naar keuze (bijvoorbeeld 20% sneller hakken of sterkere ankers)
- Elke cyclus gaat sneller en komt verder

---

## 12. De eerste minuut (cruciaal)

1. Speler wordt wakker, korte droge tekst verschijnt
2. Tikt op de boom, krijgt wrakhout
3. Maakt een werkbank
4. Maakt een houten houweel
5. Plaatst zijn eerste nieuwe blok. Het eiland is voor het eerst groter

Na één minuut moet de speler voelen: ik bouw iets op.

---

## 13. Bouwfases

Bouw in deze volgorde. Elke fase moet speelbaar zijn op de telefoon voordat de volgende begint.

**Fase 1: de basis**
Projectstructuur met Phaser, isometrisch eiland van een paar tiles, joystick en actieknop, lopen, boom hakken, wrakhout in inventaris, opslaan in localStorage, PWA-setup en publicatie op GitHub Pages.

**Fase 2: bouwen en craften**
Werkbank, gereedschap, blokken plaatsen in bouwmodus, steengenerator, puin, de kist, de eerste minuut zoals in sectie 12.

**Fase 3: skills en roest**
De vier skills met levels en bonussen, langs zwevende wrakstukken en takken die je moet aantikken.

**Fase 4: dag, nacht en vechten**
Dag-nachtritme, nachtwezens, vechten, muren, lampen, torens, leegtekristallen, doodgaan zoals in sectie 8.

**Fase 5: afbrokkelen**
Randen die afbrokkelen, ankers, barsten en vallende blokken.

**Fase 6: nieuwe eilanden en de Kern**
Bruggen, nieuwe eilanden, sterrenstof, verhaalfragmenten, eindbaas.

**Fase 7: prestige en afwerking**
Nieuwe cyclus met blijvende bonussen, geluid en muziek, betere graphics, balans.

---

## 14. Werkafspraken voor de AI in VS Code

- Werk alleen aan de fase die gevraagd wordt
- Houd de code opgedeeld in losse bestanden (bijvoorbeeld per systeem: speler, eiland, inventaris, nacht)
- Zet alle getallen voor balans (opbrengsten, prijzen, tijden) in één config-bestand, zodat ze makkelijk aan te passen zijn
- Leg na elke fase in een paar zinnen uit wat er gebouwd is en hoe het te testen is

STANAR UI Kit
(verzija 1.0 / 2026)

1. Osnove
1.1 Brand kontekst

STANAR je B2B alat za upravitelje zgrada, računovođe i predstavnike suvlasnika. Fokus: čitljivost, gustoća podataka, pouzdan izgled, minimalizam.
​

1.2 Design principi

Prioritet podacima (tablice, kartice, filteri).

Brzo skeniranje: jasna hijerarhija, KPI kartice, status boje.

Dosljednost: isti spacing, tipografija i states kroz sve ekrane.

2. Tipografija
2.1 Font familija

Primarni font: Inter / System UI (San Francisco na macOS, Segoe UI na Windows).

text
Font stack:
- system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
2.2 Veličine i stilovi

Osnovni body: 14 px.

Token	Veličina	Primjena
display	28–32 px	Naslov dashboarda / glavne stranice
h1	24 px	Naslov ekrana (npr. “Stanari”)
h2	18–20 px	Naslov carda/tablice (npr. “Popis stanara”)
h3	16 px	Sekundarni naslovi, sekcije u detalju
body	14 px	Glavni tekst, tablice, forme
caption	12–13 px	Meta info, label ispod ikone, pomoćni tekst
Weight:

Naslovi: 600–700

Body: 400–500

Tablica header: 600

2.3 Line-height i širina teksta

Body tekst: 1.4–1.6 line-height.

Naslovi: 1.1–1.3.

Maks širina paragrafa: ~70 znakova.

3. Boje
3.1 Neutrali

Primjeri (prilagoditi brendu, ali zadržati kontrast):

Background: #F5F5F7

Surface / card: #FFFFFF

Border: rgba(15, 23, 42, 0.08)

Text primary: #0F172A

Text secondary: #6B7280

3.2 Brand & semantic

Primary: brend plava/zelena (npr. #2563EB ili #0F766E) – za CTA, linkove, aktivne elemente.

Success (uredno plaća): #16A34A

Destructive (dužnici, negativan saldo): #DC2626

Warning (skoro dospijeće, kasnije): #F97316

Kontrast:

Tekst vs background ≥ 4.5:1.

Tekst na buttonu (primary) također ≥ 4.5:1.

4. Spacing i layout
4.1 Spacing skala (8‑pt grid)

text
4, 8, 12, 16, 20, 24, 32, 40, 48 px
Primjena:

Page padding (desktop): 24 px (Tailwind px-6).

Razmak između sekcija na stranici: 24–32 px (space-y-6 / space-y-8).

Card padding: 16–24 px (p-4 standard, p-6 za složenije cardove).

Label–input: 4–6 px.

Input–input (vertikalno): 12–16 px.

Razmak između cardova u gridu: 16–24 px (gap-4 / gap-6).

4.2 Layout patterni

Desktop: max širina contenta 1200–1360 px, centrirano.
​

12‑column grid s 24 px gutterima.

Lijevi sidebar (navigation) + unutarnji page layout:

page title blok

stats kartice

filter / toolbar

tablica / sadržaj

5. Komponente – tipične vrijednosti
5.1 Buttons

Visina: 36–40 px.

Padding: 8 px vert, 12–16 px horiz.

Border radius: 6–8 px.

Font: 14 px, semibold.

States:

Hover: malo tamnija nijansa (±10% luminozitet).

Active: dodatno potamniti + lagani inset shadow.

Disabled: smanjan kontrast i cursor-not-allowed.

5.2 Inputi i forme

Visina inputa: 40–44 px.

Padding: 8–10 px horizontalno.

Label: 12–13 px, regular/medium, 4–6 px iznad.

Pomoćni tekst: 12 px, sekundarna boja, 4 px ispod inputa.

Grupiranje:

Jednostavni layout: 1–2 kolone na desktopu.

Razmak između grupa: 24–32 px.

6. Tablice (data tables)
6.1 Osnovni stil

Font: 13–14 px.

Header row:

visina ~40 px

semibold font

pozadina: vrlo svijetli neutral (npr. #F9FAFB).

Row height:

Normal: 44 px

Compact: 32–36 px (density switch).

Padding ćelija:

horizontalno: 12 px

vertikalno: 8–10 px.

Poravnanje:

Tekst: lijevo.

Brojke (npr. površina, rata, saldo): desno.

6.2 Toolbar i funkcije

Preporučeni toolbar iznad tablice:

Lijevo:

Naslov (npr. “Popis stanara”)

Kratki opis (“Pretraga, filteri i izvoz”)

Ispod naslova:

Search input (uvijek vidljiv)

“Active filter” badgeovi

Desno:

Filter button (otvara sheet)

Density toggle (Normal / Compact)

Columns (show/hide kolone – kasnije)

Export (CSV / PDF)

Summary tekst:

“Prikazuje se X od Y stanara (filtrirano)” ispod toolbara.

6.3 Sortiranje i statusi

Sortiranje po ključnim kolonama: Stanar, Grad, Mjesečna rata, Saldo, Status.

Header klik ciklus: none → asc → desc → none.

Statusi u tablici:

status === 'overdue':

AlertCircle ikona + crveni tekst salda + opcionalni badge “Dužnik”.

status === 'paid':

zeleno označavanje ili badge “Plaća uredno”.

Colors:

Positive saldo (pretplata) – success.

Negativan saldo – destructive.

7. Filter UX
7.1 Pattern

Za listing ekrane (npr. Stanari, Dužnici, Uplatnice):

Search input inline iznad tablice.

Napredni filteri u Sheet (side panel).

Aktivni filteri -> badgeovi iznad tablice, svaki s X za brzo uklanjanje.

7.2 Prioritet filtera

U STANAR domenu, tipičan redoslijed:

Status plaćanja (Svi, Plaća uredno, Dužnici).

Način dostave (Svi, E‑mail, Pošta).

Grad (Svi gradovi, pa lista).

Interval / period (za dužnike i financijske kartice).
​

Quick filter chips:

“Dužnici”

“E‑mail dostava”

Česti gradovi (npr. “Vinkovci”).

8. Cards i dashboard
8.1 KPI kartice

Pattern za 4 KPI kartice na vrhu (kao u Tenants ekranu):

Card padding: 16 px (p-4).

Naslov: 12–13 px, sekundarna boja.

Vrijednost: 20–24 px, bold.

Specifične boje:

“Dužnici”: tekst i/ili border u destructive tonu.

“Uredno plaćaju”: success ton.

8.2 Informacijski cardovi

Naslov (H2): 18–20 px semibold.

Podnaslov / opis: 14 px, sekundarna boja.

Sadržaj: grid / tekst / tablica.

Razmak naslov–sadržaj: 8–12 px.

9. Stateovi: loading, empty, error
9.1 Loading

Tablice: skeleton rows (5–10 redaka) umjesto punish spinnera.

KPI kartice: “…” ili skeleton umjesto vrijednosti.

9.2 Empty

Poruka: jasna, 1 naslov + 1 rečenica.

CTA: jedan primarni gumb (npr. “Dodaj stanara”).

Ikona ili ilustracija vrlo minimalna.

9.3 Error

Card s AlertCircle ikonom, naslov “Greška pri učitavanju” i opis.

CTA: “Pokušaj ponovno” + link na support ako treba.

10. Interakcija i accessibility
10.1 Hit zone i veličine

Minimalna interaktivna zona: 40–44 px (gumbi, ikone, radio, checkbox).

Ikone: 16–20 px u tablicama, 20–24 px u cardovima.

10.2 Focus i tipkovnica

Svi interaktivni elementi imaju vidljiv focus outline (2 px, primarna boja ili visoko-kontrastna).

Keyboard shortcuts (preporučeno):

Ctrl/Cmd + K → fokus na globalni search.

Strelice gore/dolje u tablici → pomak fokusa po redovima (kasnije).

11. STANAR specifični patterni
11.1 Master–detail

Za entitete: Gradovi, Ulice, Ulazi, Stanari, Dužnici, Dobavljači, Opomene, Financijske kartice:
​

Lijevo: lista/tablica s filterima.

Desno: detalj u panelu (drawer / split view), umjesto hard navigacije na drugi ekran.

11.2 Financijska kartica stanara

Header blok (hero):

Ime i prezime, adresa, OIB, kvadratura, način slanja uplatnica, trenutni saldo.
​

CTA:

“Ispiši karticu”

“Kartica + uplatnica”

“Pošalji e‑mailom”

Ispod: tablica zaduženja i uplata s periodom, iznosom, opisom i saldom nakon stavke.





1. Layout, grid i dimenzije
Max širina contenta: 1200–1360 px, centrirano, page padding 24 px (16 px na malim ekranima).
​

Grid: 12 kolona na desktopu, gap 24 px između kolona.
​

Section spacing: 24–32 px između većih blokova (hero naslov, kartice, tablica).

Za tvoj Tenants ekran to znači:

space-y-6 kao page spacing je OK, ali standardiziraj:

page: 24 px (6 na Tailwind skali)

unutar cardova: 16–24 px paddinzi (p-4 ili p-6) kao default.

2. Tipografija (tokens)
Postavi osnovne tokens:

Font-family: Inter / system sans.

Base font: 14 px za UI (body tekst u tablicama, labelama).

Scale:

Page title: 24 px bold (text-2xl md:text-3xl, ali neka 24 bude minimum).

Section/ card title: 18–20 px semibold.

Table header: 12–13 px, semibold, uppercase ili tracking +2%.

Caption / meta: 12 px.

Line-height:

Body: 1.4–1.6.

Naslovi: 1.1–1.3.

3. Spacing sistem (8‑pt grid)
Definiraj spacing scale kao tokens i drži se toga:

Jedinica: 8 px → 4, 8, 12, 16, 20, 24, 32, 40, 48.

Primjena:

Unutar buttona: vert 8 px, horiz 12–16 px.

Razmak label–input: 4–6 px.

Razmak između fieldova: 12–16 px.

Razmak između filter bara i tablice: 16–20 px.

Padding cell u tablici: 12 px horizontalno, 8–10 px vertikalno.

Za konkretan kod:

Card za statistiku: className="p-4" (16 px) je OK za “dense”; za hero/complex cardove idi na p-6 (24 px).

Filter bar (flex sm:flex-row gap-3 mb-6) → gap-3 (12 px) i mb-6 (24 px) već prati 4/8 grid; standardiziraj da svugdje koristiš 12 i 24, ne 10/14/18 itd.
​

4. Tablice: density, sortiranje, summary
Preporuke iz enterprise data‑table UX‑a:

Row height:

Normal: 44 px (tvoj trenutni layout je blizu toga).

Compact: 32–36 px (dodatni toggle u toolbaru).

Akcije/toolbar iznad tablice:

Lijevo: search + aktivni filter chipovi.

Desno: “Density” icon toggle (Normal / Compact), “Columns” (za show/hide kolone), “Export CSV”.

Sortiranje:

Dodaj sort indikatore na TableHead za: Stanar, Grad, Mjesečna rata, Saldo, Status.

Klik na header mijenja smjer sort, drugi klik obrće, treći resetira.

Visual summary:

Već imaš četiri KPI kartice (Ukupno, Plaćaju, Dužnici, E‑mail), što je baš pattern koji se preporučuje kao “visual table summary”.

Dodaš ispod naslova još kratku rečenicu tipa: “Prikazuje se {tenants.length} od {totalCount} stanara (filtrirano)”.

5. Filter UX: prioritet + discoverability
Best‑practice za enterprise filtere:

Ponašanje koje već radiš je jako dobro:

Search uvijek vidljiv,

napredni filteri u Sheet‑u,

aktivni filteri kao badgeovi iznad tablice.

Sitna poboljšanja:

Dodaj “Najčešće filtere” kao quick chips odmah ispod searcha (npr. “Dužnici”, “E‑mail dostava”, “Grad Vinkovci”), koji samo prebacuju radio vrijednosti.

U filter sheetu: redoslijed po važnosti → Status, Način dostave, Grad (trenutno je Grad u sredini, što je ok, ali kod tvojeg domenskog problema je status i dostava skoro jednako bitna kao grad).

6. Boje i statusi
Da se ponaša kao world‑class B2B:

Semantic tokens:

success za uredne platiše,

destructive za dužnike,

warning za npr. “skoro dospijeće” ako to kasnije dodaš.

U tablici:

tenant.balanceNum < 0 → crveni tekst + možda mali badge “Dug”.

tenant.status === 'paid' → zeleni check ili mali badge “Plaća uredno”.

KPI kartice:

“Dužnici” karta može imati suptilni crveni border/background tint (npr. bg-destructive/5 text-destructive).

Dark mode:

Ako koristiš shadcn theme tokens, samo pazi da kontrast i semantic boje ostanu čitljive (crvena na tamnoj pozadini lagano posvijetliti i povećati saturaciju).

7. Interakcija i accessibility
Hit zone: već radiš min-w-[44px] min-h-[44px] za gumbe, što prati preporučene minimalne dodirne ciljeve.

Focus states:

pobrini se da Button, RadioGroupItem i Input imaju vidljiv focus outline (ne samo default browser plavu, već tokenizirani focus:ring).

Keyboard:

search: Cmd/Ctrl + K shortcut koji fokusira search input.

tablica: strelice gore/dolje selektiraju red (barem vizualno), Enter otvara detalj (kasnije možeš dodati).

8. Konkretniji “design spec” za Tenants
Možeš ovo pretvoriti u theme tokens (pseudo‑kod):

ts
const tokens = {
  font: {
    family: "system-ui",
    size: {
      xs: 12,
      sm: 13,
      base: 14,
      lg: 16,
      xl: 20,
      "2xl": 24,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
    },
  },
  spacing: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
  },
  table: {
    rowHeight: {
      normal: 44,
      compact: 34,
    },
    cellPaddingX: 12,
    cellPaddingY: 8,
  },
  layout: {
    pagePaddingX: 24,
    sectionGap: 24,
    cardPadding: 16,
  },
};
Onda Tenants ekran uskladiš:

Headline: text-2xl md:text-3xl font-bold (24–30 px).

KPI cards: className="p-4 md:p-5 space-y-1"; naslovi text-sm, vrijednosti text-2xl.

Table wrapper: rounded-md border bg-card + sticky header.




1. Table UX: jasnoća i akcije
Dodaj sortiranje po ključnim kolonama (Stanar, Grad, Saldo, Status), jer je to core očekivanje kod ovakvih tablica.

Razmisli o “density switchu” (Normal/Compact) umjesto hard‑kodiranog jednog densityja, pa samo smanji row height i padding.

U “Akcije” stupcu umjesto samo jednog FileText gumba možeš:

otvoriti context menu (3 dots) s: “Otvori karticu”, “Ispiši karticu + uplatnica”, “Pošalji email”.

Razmisli o “sticky” headeru tablice i sticky prvom stupcu (Stanar), jer kod puno kolona to jako pomaže orijentaciji.

2. Filteri: prioriteti i vidljivost
Imaš odličan pattern: filter sheet + “Active filters” chipovi iznad tablice; to je baš best‑practice (filteri nisu stalno na ekranu, ali primijenjeni filteri jesu vidljivi).

Poboljšanja:

Dodaj mali “broj rezultata” uz filtere (npr. “Filtrirano: 124 od 3 212”), to pomaže da filteri djeluju “življe”.
​

Pored search inputa ubaci i “Sortiraj po” (dropdown: Zadano, Najveći dug, Zadnja uplata, Grad A‑Z).

U filter sheetu prvo stavi najvažnije filtere (Status, Dug range) pa tek onda Grad i Način dostave; order filtera prema važnosti je preporuka u enterprise aplikacijama.

3. Vizualna hijerarhija i “state” signali
Status “overdue” je dobro naglašen AlertCircle ikonom, ali možeš dodati mali badge “Dužnik” desno od imena da bude dosljedno i u mobilnim karticama.

Saldo:

uvijek desno poravnanje brojeva (što već radiš),

koristi isti format (npr. “65,55 €” svuda, bez miješanja “€ / eur”).

Dodaj globalni “status bar” iznad tablice: “Ukupno stanara: X - Dužnika: Y - Ukupni dug: Z €”, to vrlo vole računovođe.

4. Empty, loading i error patterni
Loading state je jako dobar (skeleti u tablici i karticama); to je baš preporučen pattern za enterprise data prikaze.

Dodaj eksplicitan error state u slučaju faila API‑ja (Card s AlertCircle, poruka “Ne možemo učitati listu stanara” + “Pokušaj ponovno”).

5. Mobile: actionable kartice
Mobile layout ti je odličan (key info + grid od 2x2 metrika).

Dodaj jedan “primary” action na kartici: npr. cijeli card clickable → otvori bottom‑sheet s detaljima + akcijama (kartica, uplatnice, kontakt). To je pattern viđen u property/tenant SaaS rješenjima.
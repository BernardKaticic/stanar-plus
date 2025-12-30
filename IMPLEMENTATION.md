# STANAR - Sustav za upravljanje stambenim zgradama

Moderni, responzivni frontend sustav za upravljanje stambenim zgradama, pričuvom i financijskim karticama.

## 🎯 Značajke

### Implementirani moduli

1. **Nadzorna ploča (Dashboard)**
   - KPI kartice: zaduženo, uplaćeno, dugovanja, radni nalozi
   - Feed nedavnih aktivnosti
   - Brze akcije za svakodnevne zadatke
   - Pregled najnovijih dužnika

2. **Zgrade**
   - Hijerarhijska navigacija: Gradovi → Ulice → Ulazi → Stanovi
   - Pregled po gradovima s metrikama
   - Nedavno pregledane ulice
   - Brze akcije za dodavanje novih ulaza

3. **Stanari**
   - Potpuni popis stanara s filteriranjem
   - Detaljna kartica stanara s:
     - Osnovnim podacima (OIB, adresa, površina)
     - Strukturom troška (pričuva, čišćenje, kredit)
     - Financijskom karticom (zaduženja i uplate)
   - Export mogućnosti (CSV, PDF)

4. **Uplatnice**
   - Generiranje uplatnica po razinama (sve/grad/ulica/ulaz/stanar)
   - Odabir razdoblja (mjesec, kvartalno, godišnje)
   - Način slanja: E-mail, Print, R-1 računi
   - Povijest poslanih uplatnica

5. **Dužnici i opomene**
   - Filtriranje dužnika (iznos, mjeseci, status)
   - Batch selekcija za masovno slanje opomena
   - Arhiva poslanih opomena s datumima
   - Pregled ukupnog duga po dužnicima

6. **Stanje računa**
   - Trenutno stanje s donosom iz prethodne godine
   - Pregled transakcija (uplate i troškovi)
   - Rekapitulacija prometa s postokom naplate
   - Grafički prikaz strukture troškova

7. **Predstavnici suvlasnika**
   - Popis predstavnika po zgradama
   - Evidencija drugog dohotka (mjesečno/periodično)
   - IBAN i OIB podaci
   - Pregled ukupnih mjesečnih troškova

## 🎨 Dizajn sustav

### Boje (HSL)
- **Primary**: Teal/cyan (186°, 78%, 35%) - za glavne akcije
- **Success**: Green (142°, 76%, 36%) - za uspješne operacije
- **Destructive**: Red (0°, 84%, 60%) - za upozorenja i dugove
- **Warning**: Orange (38°, 92%, 50%) - za važne obavijesti
- **Info**: Blue (199°, 89%, 48%) - za informativne poruke

### Tipografija
- Font: System font stack (优化čitljivost)
- Osnovni size: 14-16px za optimalnu čitljivost 18-55 godina
- Heading hierarchy: H1 (3xl), H2 (2xl), H3 (xl)

### Komponente
- **Kartice**: `stat-card` utility klasa, border radius 8px
- **Tablice**: `data-table` s hover efektima i sticky headerima
- **Badge-ovi**: Success, warning, error, info varijante
- **Gumbi**: Primary, secondary, outline, ghost varijante

## 📱 Responzivnost

- **Desktop (≥768px)**: Lijevi sidebar s navigacijom
- **Mobitel (<768px)**: Donji tab bar s najvažnijim modulima
- Touch-friendly elementi (min 44x44px dodirna područja)
- Prilagođeni grid layouti za različite veličine ekrana

## 🚀 Korištenje

### Navigacija
- Desktop: Koristi lijevi sidebar za pristup svim modulima
- Mobitel: Koristi donji navigation bar za brz pristup
- Globalna pretraga: Ctrl+K (planirana implementacija)

### Glavni tokovi rada

#### Generiranje uplatnica
1. Idi na "Uplatnice"
2. Odaberi razinu zaduženja (sve/grad/ulica/ulaz/stanar)
3. Postavi razdoblje (mjesec/kvartalno/godina)
4. Odaberi način slanja (e-mail/print/R-1)
5. Generiraj i potvrdi prije slanja

#### Upravljanje dužnicima
1. Idi na "Dužnici"
2. Filtriraj po iznosu duga ili broju mjeseci
3. Selektiraj dužnike (pojedinačno ili grupno)
4. Generiraj opomene s uplatnicom
5. Pošalji e-mailom ili ispiši

#### Pregled financijske kartice stanara
1. Idi na "Stanari"
2. Klikni na željenog stanara
3. Tab "Financijska kartica" prikazuje zaduženja i uplate
4. Export PDF ili slanje e-mailom

## 🛠 Tehnologije

- **React 18** + **TypeScript** - Type-safe razvoj
- **Vite** - Brzo razvojno okruženje
- **Tailwind CSS** - Utility-first stilizacija
- **React Router** - Client-side routing
- **Shadcn/ui** - High-quality komponente
- **Lucide React** - Moderna ikonografija
- **React Query** - Data fetching (priprema za backend integraciju)

## 📊 Formatiranje

- **Valuta**: EUR s hrvatskim formatiranjem (65,55 €)
- **Decimalni separator**: Zarez (,)
- **Tisućni separator**: Točka (.)
- **Datumi**: d.m.yyyy. format (15.02.2025.)

## ♿ Pristupačnost

- WCAG 2.2 AA compliance cilj
- Semantički HTML
- ARIA labeliranje (za implementaciju)
- Keyboard navigacija (za implementaciju)
- Focus states na svim interaktivnim elementima
- Visoki kontrasti (min 4.5:1 za tekst)

## 📈 Performanse

- Code splitting po rutama
- Lazy loading komponenti (za implementaciju)
- Optimizirani asset loadinzi
- Lighthouse cilj: ≥90

## 🔜 Planirane značajke

- **E-računi i knjiženje**: Uvoz XML/QR, automatsko knjiženje
- **Dobavljači**: Pregled troškova po dobavljačima
- **Odluke i ugovori**: Katalog špranci s dinamičkim poljima
- **Portal stanara**: Read-only pregled za suvlasnike
- **Dnevnik zgrade**: Radni nalozi, planer događaja
- **Izvještaji**: PDF generiranje, grafički prikazi
- **Grafovi**: Tok novca, struktura troška, trendovi naplate

## 💡 Best Practices

- **Dizajn tokens**: Sve boje kroz CSS varijable
- **Component reusability**: Maksimalna ponovna upotrebljivost
- **Type safety**: Potpuna TypeScript pokrivenost
- **Accessibility first**: WCAG standardi u fokusu
- **Mobile first**: Responzivni dizajn od početka

## 🎯 UX Principi

- **Jasna hijerarhija**: Vizualni prioriteti jasno definirani
- **Potvrde za kritične akcije**: Masovna slanja imaju potvrdu
- **Empty states**: Svaki prazan ekran ima poziv na akciju
- **Loading states**: Skeleton loaderi i placeholderi
- **Error handling**: Jasne poruke i recovery opcije
- **Microinterakcije**: Hover states, transitions, feedback

## 📝 Napomene za razvoj

- Sve custom boje se definiraju u `src/index.css`
- Semantic tokens se koriste kroz `hsl(var(--token-name))`
- Komponente koriste `cn()` helper za conditional classes
- Table komponente imaju automatski hover effect
- Badge komponente imaju semantičke varijante

---

**STANAR** - Moderno, brzo, pristupačno rješenje za upravljanje stambenim zgradama. 🏢

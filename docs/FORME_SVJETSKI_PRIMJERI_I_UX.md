# Svjetski primjeri kompleksnih formi i što korisnici vole

Kratak pregled najboljih praksi i primjera koje ljudi navode kao odlične za korištenje.

---

## 1. Primjeri koje ljudi često spominju

### Typeform (jedno pitanje po ekranu)
- **Što ljudi kažu:** „Prijateljsko sučelje”, „lako za ispunjavanje”, „ne preplavljuje me”.
- **Zašto radi:** Smanjen kognitivni napor (jedno polje = jedna odluka), progresivno otkrivanje, osjećaj razgovora. Istraživanja pokazuju **~47% completion rate** (više nego dvostruko iznad prosjeka).
- **Kada koristiti:** Registracije, upitnici, lead forme, narudžbe. Najbolje do ~12–14 pitanja; preko toga completion opada.

### U.S. Web Design System (USWDS) / GOV.UK
- **Što ljudi kažu:** „Jasno”, „ne pogrešim lako”, „radi i na mobitelu”.
- **Zašto radi:** Progresivno otkrivanje, **trauma-informed** pristup (blage poruke, bez optuživanja), jasne upute, pristupačnost, mobilno prvo.
- **Praksa:** Grupiranje po koracima, jasni hintovi, validacijske poruke koje ne krive korisnika.

### Linear, Stripe, Notion
- **Što ljudi kažu:** „Brzo”, „bez nepotrebnih klikova”, „inline pomoć”.
- **Zašto radi:** Kratke forme, inline validacija na blur, pametni defaulti, conditional logic (prikaži samo relevantna polja), autosave gdje ima smisla.

### Smashing Magazine / NN Group (istraživanja)
- **Validacija:** Greške prikazati **nakon** što korisnik napusti polje (on blur), ne dok još tipka. Istraživanja: **7–10 sekundi brže** završetak forme kada se validacija pokazuje na blur.
- **Poruke:** Uz polje (ispod ili pored), jasno i bez optuživanja; za složena polja (npr. lozinka) i pozitivna povratna informacija (snaga lozinke, kvačica).

---

## 2. Što konzistentno hvale (best practices)

| Praksa | Zašto ljudi vole |
|--------|-------------------|
| **Manje polja** | Svako dodatno polje smanjuje completion. Primjer: Expedia – jedno polje više = veliki gubitak; Marketo – nepotrebna polja povećavaju cost-per-lead. |
| **Progress indikator** | „Vidim koliko mi još preostaje” – smanjuje anksioznost i povedava motivaciju (endowed progress effect). |
| **Grupiranje u sekcije** | Naslovi sekcija, razmak između grupa, label uz polje – manje preopterećenja, lakše skeniranje. |
| **Conditional logic** | Prikaži samo ona polja koja su relevantna – kraća forma, manje napuštanja. |
| **Labele iznad polja (top-left)** | Brže skeniranje i manje vizualnih fiksacija nego side-by-side. |
| **Jedan CTA po koraku** | Jasno „Što dalje” – primarna akcija (npr. Dalje / Spremi) istaknuta. |
| **Review korak prije slanja** | Mogućnost provjere unosa prije submita – posebno za osjetljive podatke. |

---

## 3. Validacija i poruke grešaka

- **Kada prikazivati:** Nakon napuštanja polja (on blur) za slobodni unos; za format (npr. lozinka) moguće i tijekom tipkanja, ali s odgodom da se izbjegnu lažne greške.
- **Gdje:** Uz problematično polje (ispod ili pored), ne samo u summary na vrhu.
- **Ton:** Blame-free („Unesite ispravan OIB” umjesto „OIB je kriv”).
- **Vizualno:** Boja + ikona (npr. crveni rub, ikona upozorenja), dosljedno na cijeloj stranici.

---

## 4. Kompleksne forme – struktura

- **Koraci:** Logički slijed (npr. Osnovno → Kontakt → Pregled).
- **Jedan koncept po koraku** gdje je moguće.
- **Od jednostavnog prema težem** – prvo opće, zatim detalji.
- **Mobilno:** Veliki dodirni targeti, manje polja po ekranu, progress na vrhu.

---

## 5. Što uvesti u Zgrada+ (prioritetno)

1. **Vizualna stanja polja** – error (crveni rub + poruka), eventualno success (zelena kvačica) za ključna polja.
2. **FormMessage uz polje** – već postoji; osigurati da je poruka jasna i blaga.
3. **Sekcije u dugim formama** – npr. „Podaci stana” / „Vlasnik” / „Kontakt” s malim naslovima i razmakom.
4. **Progress za multi-step** – ako se uvede višekoračni flow (npr. dodavanje stana u 2–3 koraka), progress bar ili step indikator.
5. **Conditional logic** – već djelomično (npr. ownerMode existing/new); nastaviti sakrivati nepotrebna polja.
6. **Label + hint** – gdje treba, kratak opis ispod labele (FormDescription) umjesto samo placeholdera.
7. **Jedan primarni CTA** – Spremi / Dalje istaknuto; Sekundarne akcije (Odustani) outline ili ghost.

Ovaj dokument može poslužiti kao referenca pri redizajnu formi u aplikaciji.

# Audit preglednosti UI – Enterprise fokus

**Cilj:** Aplikacija kao enterprise alat s naglaskom na **čitljivost**, **brzinu rada** i **pregled podataka**. Najvažnije informacije odmah vidljive pri otvaranju ekrana; odličan eye tracking i kontrast.

---

## 1. Načela (prema klijentu)

- **Citljivost** – Tekst i brojke lako čitljivi bez naprezanja.
- **Brzina rada** – Pregled i unos podataka što manje klikanja i traženja.
- **Eye tracking** – Pogled prirodno pada na ono što je najvažnije (F-pattern / Z-pattern).
- **Kontrast** – Najvažnije informacije vizualno istaknute (veličina, težina fonta, boja).

---

## 2. Stanje po ekranima

### 2.1 Nadzorna ploča (Dashboard)
| Aspekt | Stanje | Preporuka |
|--------|--------|-----------|
| Naslov stranice | ✅ text-2xl, jasno | Zadržati |
| KPI kartice | Label text-sm muted, vrijednost text-xl | **Vrijednost veća** (npr. text-2xl), **tabular-nums** za brojeve; "Aktivna dugovanja" kao ključni KPI – eventualno vizualno istaknuti (border/boja) |
| Redoslijed KPIs | Zaduženo, Naplaćeno, Dugovanja, Radni nalozi | **Dugovanja** kao najkritičnije – razmisliti o poziciji ili naglasku |
| Brze akcije | Linkovi s helper tekstom | Jasno kao primarne akcije (dovoljno veliki, kontrast) |
| Aktivnosti / grafovi | Kartice s naslovima | Naslovi sekcija dovoljno veliki (text-lg); vrijednosti u grafovima čitljive |

### 2.2 Zgrade (Buildings)
| Aspekt | Stanje | Preporuka |
|--------|--------|-----------|
| Breadcrumb / naslov | text-2xl za h1, opis ispod | ✅ Zadržati; opis max-w-xl za čitljivost |
| Kartice gradova/ulica | font-semibold, text-sm za stat | **Broj stanova/ulica** kao glavna brojka – malo veći font |
| Detalj zgrade | CardTitle text-xl, KPI u 3 stupca | KPI vrijednosti **text-2xl, tabular-nums**; "Dugovanja" crveno |
| Lista stanova | Tablica: Stan, Vlasnik, Dug, → | **Stupac Dug** – font-semibold, tabular-nums, destructive ako > 0; dovoljno padding za skeniranje |

### 2.3 Suvlasnici (Tenants)
| Aspekt | Stanje | Preporuka |
|--------|--------|-----------|
| Naslov + stat kartice | h1 text-2xl, 4 KPI kartice | KPI vrijednosti **tabular-nums**, "U dugu" destructive |
| Tablica | Suvlasnik, Stan, Grad, Mj. rata, Saldo, Dostava, Akcije | **Saldo** – font-semibold, boja (success/destructive), tabular-nums; **Mjesečna rata** – tabular-nums; primarna akcija "Dodaj suvlasnika" kao primary button |
| Pretraga / filter | Input + Filter gumb | Zadržati; jasna oznaka aktivnih filtera |

### 2.4 Dužnici (Debtors)
| Aspekt | Stanje | Preporuka |
|--------|--------|-----------|
| KPI + naslov | Isti pattern kao Suvlasnici | **Ukupan dug** i **Duguju > 3 mj.** vizualno naglašeni (destructive, eventualno veći font) |
| Tablica | Dužnik, Adresa, Iznos, Mjeseci, Opomene | **Iznos duga** – glavna brojka u redu: font-semibold, tabular-nums, destructive; **Mjeseci** – badge s kontrastom za > 3 |
| Primarna akcija | "Pošalji opomene" | Ostaje istaknuta; Export CSV sekundarno (outline) |

### 2.5 Kartica suvlasnika (PersonDetail)
| Aspekt | Stanje | Preporuka |
|--------|--------|-----------|
| Hero (ime + kontekst) | h1 ime, ispod opis "Kartica suvlasnika" | **Ime text-2xl**; odmah ispod ili u prvom bloku **Saldo** – veliki, obojen (success/destructive), da je prva stvar koju korisnik vidi |
| Lijeva kartica (podaci) | E-mail, Telefon, OIB, Način slanja | Label muted, vrijednost font-medium – **vrijednosti malo tamnije** (text-foreground) za brži sken |
| Financijska kartica (stan) | Saldo u headeru kartice | **Saldo** veći (npr. text-lg ili text-xl), tabular-nums |

### 2.6 Financijska kartica (FinancialCard)
| Aspekt | Stanje | Preporuka |
|--------|--------|-----------|
| Naslov + filter | h1, opis, odabir zgrade/datuma | Zadržati |
| KPI (Stanje, Donos, Zaduženo, Troškovi) | Kartice s text-xl/text-2xl | **Trenutno stanje** kao hero – najveći ili posebno istaknut; sve brojke tabular-nums |
| Tablica transakcija | Datum, Tip, Opis, Iznos, Stanje | **Iznos i Stanje** – font-semibold, tabular-nums; negativno stanje destructive |

### 2.7 Dijalozi (forme za unos)
| Aspekt | Stanje | Preporuka |
|--------|--------|-----------|
| Naslov dijaloga | CardTitle/DialogTitle | Jasno; eventualno text-lg |
| Label vs input | Label često text-sm | **Label** dovoljno kontrastan (ne previše blijed); **Input** border i focus ring jasni |
| Primarni gumb | Spremi / Dodaj | Uvijek **primary** varijanta; dobro vidljiv |
| Greške validacije | Crveno, ispod polja | Zadržati; dovoljno kontrast |

---

## 3. Globalne preporuke

### 3.1 Tipografija i kontrast
- **Brojke (iznosi, brojevi)** – `tabular-nums` svugdje za poravnanje; font-semibold ili font-bold za "ključne" vrijednosti (saldo, dug, ukupno).
- **Label vs vrijednost** – Label `text-muted-foreground` (ok); vrijednost **ne** biti muted – `text-foreground` i `font-medium` ili `font-semibold` da odmah upadne u oko.
- **Naslovi sekcija** – H2/H3 dovoljno veliki (text-lg / text-base font-semibold) da odvoje blokove.

### 3.2 Tablice
- **Zaglavlja** – Ostaju uppercase, text-xs, muted; dovoljno razmaka (py-2.5 ili py-3).
- **Ćelije s brojevima** – `tabular-nums`, `font-semibold` za iznose/saldo/dug; negativni iznosi `text-destructive`.
- **Redovi** – hover stanje jasno (npr. bg-muted/30); dovoljno padding (py-3) za brzo skeniranje.

### 3.3 KPI / stat kartice
- **Vrijednost** uvijek **veća** od labela (npr. label text-sm, vrijednost text-xl ili text-2xl).
- **tabular-nums** na svim brojevima.
- Kritične metrike (dug, kašnjenje) – **semantička boja** (destructive) i eventualno malo veći font.

### 3.4 Eye tracking (redoslijed na ekranu)
- **Gornji lijevi kut** – Naslov stranice + kratki kontekst (breadcrumb ili opis).
- **Prvi blok ispod** – Ključne brojke (KPI) ili jedan "hero" broj (npr. Ukupan dug, Saldo).
- **Glavna akcija** – "Dodaj", "Pošalji opomene" – gornji desni ili odmah ispod headera; primary button.
- **Sadržaj (tablica/lista)** – Jasni stupci; najvažniji stupac (npr. Iznos, Saldo) vizualno naglašen.

### 3.5 Brzina rada
- **Manje klikanja** – Kritične akcije (Dodaj, Export, Pošalji opomene) uvijek vidljive, ne skrivene u meniju.
- **Pretraga i filteri** – Na listama odmah vidljivi; aktivni filteri jasno označeni (badge).
- **Detalj stranice** – Ključna informacija (npr. saldo na PersonDetail) **iznad preloma** (above the fold).

---

## 4. Implementirane / predložene izmjene (kratki checklist)

- [x] Naslovi stranica: text-2xl font-semibold tracking-tight; opis max-w-xl, leading-relaxed.
- [x] KPI kartice: rounded-xl, tabular-nums na vrijednostima; stat kartice s text-xl font-semibold.
- [x] **Ključne brojke u tablicama:** stupci Iznos/Saldo/Dug – `.value-cell`, `.value-cell--negative` / `.value-cell--positive` (Suvlasnici, Dužnici, Zgrade stanovi, Financijska kartica, PersonDetail).
- [x] **PersonDetail:** Saldo u "hero" bloku (ime text-2xl + Saldo odmah ispod, text-xl, obojen); saldo u kartici Financijska kartica text-base.
- [x] **Dashboard:** KPI "Aktivna dugovanja" s naglaskom (border-l-4 border-destructive, bg-destructive/5, vrijednost text-destructive).
- [x] **Globalno:** CSS utility `.value-cell` (tabular-nums, font-semibold), `.value-cell--negative`, `.value-cell--positive`.
- [ ] **Dijalozi:** Provjera kontrasta labela i primarnog gumba (opcionalno u sljedećoj iteraciji).

---

*Audit napravljen s ciljem enterprise preglednosti, eye trackinga i kontrasta. Preporuke mogu se implementirati u fazama.*

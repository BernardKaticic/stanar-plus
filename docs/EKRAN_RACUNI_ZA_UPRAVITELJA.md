# Ekran „Računi” – što treba upravitelju (npr. 10 000+ zgrada)

Ekran **Računi** (prije „E-računi”) služi za vođenje računa, preuzimanje/uvoz računa, knjiženje plaćanja računa i knjiženje uplata pričuve. Cilj je da upravitelj ima jedan pregled i da se sve vidi u troškovima i na financijskoj kartici po zgradi.

---

## Što upravitelj treba na ovom ekranu

| Potreba | Opis | Status u aplikaciji |
|--------|------|----------------------|
| **1. Popis računa** | Svi računi (dobavljači, režije, usluge) – broj, dobavljač, datum, dospijeće, iznos, status (na čekanju / knjiženo / neprepoznato). | ✅ Postoji – tab „Računi”, tablica s filterom po statusu. |
| **2. Preuzimanje / uvoz računa** | Preuzimanje računa (Fina, eRačun, banka) ili uvoz datoteka (XML, PDF) s mapiranjem na dobavljača i zgradu. | ⚠️ Djelomično – uvoz XML/PDF i ručni unos postoje; stvarno preuzimanje s Fina/eRačun nema integracije. |
| **3. Knjiženje plaćanja računa** | Kad se račun plati: oznaka „Plaćeno” / „Knjiži plaćanje” (datum, iznos) → knjižni zapis (trošak npr. 6xxx, kredit banka). Plaćanje se vidi u troškovima. | ❌ Nedostaje – račun ima status i `payment_date`, ali nema knjiženja u ledger. |
| **4. Knjiženje uplata pričuve** | Uplata stanara (pričuva): odabir stana/osobe, iznos, datum → knjiženje (smanjenje obveze stana, povedanje banke). Uplata se vidi na financijskoj kartici i u saldu stana. | ❌ Nedostaje – nema API-ja ni modala „Uplata pričuve” za knjiženje. |
| **5. Vidljivo u troškovima** | Troškovi po zgradi/razdoblju/kategoriji iz glavne knjige, uključujući knjižena plaćanja računa i uplate pričuve. | ⚠️ Djelomično – financijska kartica i ledger postoje; izvještaj „Troškovi” po kontu/grupi treba proširiti. |
| **6. Grupe troškova** | Kategorije za knjiženje (npr. struja, voda, održavanje) da se troškovi mogu gledati po grupi. | ⚠️ Tab „Grupe troškova” postoji, sadržaj ovisi o backendu. |

---

## Tabovi na ekranu

- **Računi** – popis računa, pretraga, filter po statusu, akcije (uredi, označi plaćeno, brisanje). KPI: ukupno računa, knjiženo, na čekanju, neprepoznato, ukupan iznos.
- **Uvoz** – povuci-i-ispusti (XML/PDF), QR skeniranje, ručni unos; automatsko knjiženje (pravila, povezivanje s bankom).
- **Kreiraj račun** – vlastiti račun (npr. naknada upravitelja): broj, datum, primatelj (zgrada), opis, iznos, dospijeće.
- **Grupe troškova** – upravljanje grupama troškova za knjiženje; početno stanje (prijenos u novu godinu).

---

## Preporučeni redoslijed implementacije (iz KNJIGOVODSTVENI_DIO_ZAHTJEVI.md)

1. **Knjiženje uplata pričuve** – API + modal „Uplata pričuve”.
2. **Knjiženje plaćanja računa** – pri oznaci „Plaćeno” kreirati zapis u ledgeru, povezati račun s knjižnim zapisom.
3. **Izvještaj Troškovi** – po zgradi, razdoblju, kategoriji.
4. **Preuzimanje računa** – integracija Fina/eRačun ili bolji uvoz XML/PDF s mapiranjem.
5. **Pregled zaduženja** – po zgradi/mjesecu (već djelomično preko uplatnica i financijske kartice).

---

## Izvori

- `docs/KNJIGOVODSTVENI_DIO_ZAHTJEVI.md` – zahtjevi klijenta i tehničke napomene.
- Praksa upravitelja: automatsko knjiženje troškova, uvoz računa (XML/PDF), knjiženje uplata iz banke, transparentno vođenje pričuve; sustavi tipa AppFolio, Buildium, Rent Manager – računi, plaćanja, rezerve.

# Knjigovodstveni dio – zahtjevi klijenta i sljedeći koraci

Klijent je istaknuo da treba obratiti pozornost na sljedeće:

- **Zaduženja za pričuvu**
- **Preuzimanje računa**
- **Knjiženje plaćanja tih računa**
- **Knjiženje uplata pričuve**
- **Vidljivo u troškovima**

Cilj: da se u troškovima može vidjeti cijeli tok – zaduženja, računi, plaćanja računa, uplate pričuve.

---

## Što već postoji u aplikaciji

### 1. Zaduženja za pričuvu (djelomično)

- **Uplatnice (payment_request)** – generiranje uplatnica po zgradi/mjesecu kreira **zaduženja** u glavnoj knjizi:
  - `paymentSlipsController.js` (generate): za svaki stan unosi `ledger_entries` + `ledger_lines` (konto 4000 prihod, konto 3000 obveza po stanu).
- **Saldo po stanu** – iz ledgera (konto 3000) računaju se dug i pričuva; prikaz u Buildings (stan), PersonDetail, ApartmentDetailDialog, FinancialCard.
- **Što nedostaje:** Jasna stranica/ekran „Zaduženja” gdje se vidi što je zaduženo po razdoblju (već djelomično preko uplatnica i financijske kartice).

### 2. Preuzimanje računa (djelomično)

- **Backend:** tablica `invoices` (supplier_id, building_id, invoice_number, amount, status, payment_date…); API `invoicesController.js` – lista, create (ručni unos), update (status, paymentDate).
- **Frontend:** E-Računi – lista računa, uvoz (FileUpload, QR, ručni unos), grupe troškova; **nema** stvarnog preuzimanja s Fina / eRačun (nema integracije).
- **Što nedostaje:** Stvarno preuzimanje računa (API Fina, eRačun, ili bankovni izvod); povezivanje uploadanog PDF/XML s računom u bazi; automatsko popunjavanje polja iz datoteke.

### 3. Knjiženje plaćanja računa (nedostaje)

- **Trenutno:** Račun ima `status` i `payment_date`, ali **nema** knjiženja u ledger (nema troška u glavnoj knjizi).
- **Što treba:** Kad se označi „račun plaćen” ili unese datum plaćanja:
  - kreirati knjižni zapis: trošak (npr. 6xxx – trošak po grupi) / potraživanje prema dobavljaču ili direktno banka (5xxx) – kredit;
  - opcionalno povezati s `bank_transactions` (ako postoji uvoz izvoda);
- **Rezultat:** Plaćanje računa vidljivo u troškovima (izvještaj iz ledgera po kontu/grupi).

### 4. Knjiženje uplata pričuve (djelomično)

- **Trenutno:** Uplate pričuve (novac od stanara) **nisu** unosene u sustav putem posebnog ekrana. Generiranje uplatnica samo kreira zaduženja (obveze stanara).
- **Backend:** Ledger podržava uplatu: debit na konto 3000 (smanjenje obveze / povišenje stanja stana). Npr. `tenantsController.getById` čita transakcije iz ledger_lines (debit = plaćanje, credit = zaduženje).
- **Što nedostaje:**  
  - API: „Knjiži uplatu pričuve” – stan, iznos, datum, opcionalno referenca (uplatnica); unos u ledger (debit 3000, kredit npr. banka 5xxx).  
  - Frontend: ekran ili modal „Uplata pričuve” – odabir stana (ili osobe), iznos, datum – i knjiženje.  
Nakon toga uplata se vidi u financijskoj kartici i u saldu stana.

### 5. Vidljivo u troškovima

- **Trenutno:** Dashboard/izvještaji koriste podatke iz ledgera (naplata, pričuva po zgradi); „struktura troškova” na Dashboardu i sl. ovisi o tome što je u ledgeru.
- **Što treba:**  
  - Ako se knjiže plaćanje računa (točka 3) i uplata pričuve (točka 4), troškovi i prihodi će automatski biti u ledgeru.  
  - Potrebno je **izvještaj Troškovi** (po zgradi, razdoblju, kontu/grupi) koji čita iz ledger_lines / accounts i prikazuje troškove (i po želji prihode).  
  - Već postoji nešto slično u Dashboardu (struktura troškova, naplata); treba proširiti na sve konta troškova i osigurati da knjiženja računa i uplata ulaze u te brojke.

---

## Preporučeni redoslijed implementacije

| Korak | Što | Backend | Frontend |
|-------|-----|---------|----------|
| 1 | **Knjiženje uplata pričuve** | API POST knjiženje uplate (apartment_id, amount, date, memo); unos u ledger (npr. debit 3000, kredit 5xxx ili 1xxx). | Ekran ili modal „Uplata pričuve” (odabir stana/osobe, iznos, datum); poziv API-ja; osvježiti financijsku karticu/saldo. |
| 2 | **Knjiženje plaćanja računa** | Pri oznaci plaćanja računa (ili poseban endpoint): kreirati ledger_entries (trošak npr. 6xxx, kredit banka); povezati invoice s `booked_entry_id` ako postoji u shemi. | Na E-Računi: akcija „Označi kao plaćeno” / „Knjiži plaćanje” (datum, opcionalno iznos); nakon toga račun i iznos vidljivi u troškovima. |
| 3 | **Izvještaj Troškovi** | API: troškovi po zgradi/razdoblju iz ledger_lines (konta troškova 6xxx ili prema chart of accounts). | Stranica ili sekcija „Troškovi” – tablica/graf po razdoblju, zgradi, kategoriji; uključuje knjižena plaćanja računa. |
| 4 | **Preuzimanje računa** | Integracija s Fina/eRačun ili parsiranje uploadanog XML/PDF; spremanje u `invoices`; eventualno automatsko kreiranje draft knjiženja. | E-Računi: „Preuzmi račune” (ako postoji integracija) ili poboljšan uvoz (XML/PDF) s mapiranjem na dobavljača/zgradu. |
| 5 | **Zaduženja – pregled** | Može se osloniti na postojeći ledger i uplatnice; eventualno endpoint „zaduženja po razdoblju” za pregled. | Jednostavan ekran „Zaduženja” (po zgradi/mjesecu) – lista zaduženja iz payment_request_items ili iz ledgera. |

---

## Tehničke napomene

- **Ledger:** Koristi se `ledger_entries` + `ledger_lines`; konto **3000** = obveza stanara (pričuva), **4000** = prihod od zaduženja, **5xxx** = banka, **6xxx** = troškovi (prema chart of accounts).
- **Invoices:** Trenutna tablica `invoices` u produkciji može biti drugačija od `v2_full.sql` (npr. bez `booked_entry_id`). Pri implementaciji knjiženja plaćanja provjeriti stvarnu shemu i dodati poveznicu na ledger ako treba.
- **Bank transactions:** U v2 postoji `bank_transactions` i `matched_entry_id` – kasnije se može uvesti uvoz izvoda i sparivanje uplata s knjiženjima.

Ovaj dokument može poslužiti kao osnova za planiranje sprinta i razgovor s klijentom (što je prioritet prvo: uplate pričuve vs. plaćanja računa vs. preuzimanje računa).

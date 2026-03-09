# Dubinska analiza aplikacije Stanar Plus – što ne valja i prijedlozi poboljšanja

Dokument nastao pregledom frontenda (Vite, React, TypeScript, shadcn/ui), API sloja (`src/lib/api.ts`), konteksta autentifikacije, rutiranja, komponenti i backend strukture.

---

## 1. Što ne valja

### 1.1 Mrtav i duplicirani kod ✅ (rješeno)

- **Duplikat `ProtectedRoute`**  
  ~~Postoje dvije komponente~~ **Rješeno:** Obrisan je `src/components/ProtectedRoute.tsx`. Koristi se samo `src/components/auth/ProtectedRoute.tsx`.

- **Stranica `AccountStatement` nije u rutama**  
  **Rješeno:** Dodana ruta `/account-statement`, stavka „Stanje računa” u Sidebar (Financije) i MobileNav.

### 1.2 TypeScript – slaba tipizacija ✅ (djelomično rješeno)

- **`tsconfig.app.json`:**  
  **Rješeno:** Uključen je `noImplicitAny: true`. `strictNullChecks` je i dalje `false` (postepeno uključivanje).

- **Zajednički tipovi za API**  
  **Rješeno:** Dodan je `src/types/api.ts` (PaginatedResponse, DashboardStats, DashboardStatement, FinancialByBuilding, PaymentSlipHistoryItem, AuditLogItem itd.). U `src/lib/api.ts` zamijenjeni su mnogi `any` s tim tipovima ili s `unknown` gdje tip još nije definiran.

- **Preostalo:** I dalje ima eksplicitnih `any` u komponentama i hookovima; ESLint `no-explicit-any` ih prijavljuje. Preporuka: zamjenjivati ih postepeno.

### 1.3 API sloj

- **Nedosljedan base URL**  
  `API_BASE` je `import.meta.env.VITE_API_URL || 'http://localhost:3000/api'`. Ako `VITE_API_URL` u produkciji ne uključuje `/api`, pozivi mogu pucati. Treba jasno dokumentirati da `VITE_API_URL` mora završavati na `/api` ili da se pathovi u `api()` ne prefiksaju dvostruko.

- **Nema globalnog handlera za 403/503**  
  Greške se hvataju lokalno (npr. u komponentama s `toast`). Nema centralnog mjesta za npr. redirect na login pri 401 (osim refresh tokena) ili prikaz „Servis nedostupan” pri 5xx.

- **Financijski podaci na dashboard ruti**  
  `financialApi.getByBuilding` koristi `/dashboard/financial?...`. Funkcionalno je u redu, ali semantički je „financijska kartica” više resurs nego dashboard; eventualno prebaciti na `/financial` ili `/buildings/:id/financial` radi jasnoće API-ja.

### 1.4 Autentifikacija i sigurnost ✅ (djelomično)

- **Session u `localStorage`**  
  I dalje vrijedi: tokeni su u `localStorage`. Preporuka za budućnost: `httpOnly` cookie za refresh token (dugoročno).

- **Pristup odbijen – samo tekst**  
  **Rješeno:** Na ekranu „Pristup odbijen” dodan je gumb/link „Natrag na početnu” (React Router `Link` na `/`).

### 1.5 ESLint i kvaliteta koda ✅ (rješeno)

- **`@typescript-eslint/no-unused-vars`**  
  **Rješeno:** Pravilo je uključeno kao `["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }]`. Neiskorištene varijable/parametri sada se prijavljuju; parametri koji počinju s `_` se ignorišu. Lint i dalje prijavljuje mnogo `no-explicit-any` (iz recommended seta) – to se može čistiti postepeno.

### 1.6 Konzistentnost UI-a i UX-a ✅ (rješeno)

- **Loading indikatori**  
  **Rješeno:** U AuditLog je dodan skeleton redova tablice pri učitavanju (kao na Tenants, Debtors, WorkOrders).

- **Prazna stanja**  
  **Rješeno:** Na svim relevantnim mjestima korištena je komponenta `EmptyState`: PaymentSlips (Nema poslanih uplatnica), AuditLog (Nema zapisa), FinancialCard (Nema dobavljača, Nema transakcija), PersonDetail (Nema stanova), AccountStatement (Nema transakcija). Usklađen je izgled praznih stanja.

- **Buildings stranica – poseban layout**  
  Buildings koristi vlastiti layout (sidebar drvo, `page-hero`, bez `page`/`page-kpi` kao na Tenants/Debtors). To je prihvatljivo zbog specifičnosti, ali treba paziti da ostale „list” stranice (Suvlasnici, Dužnici, Uplatnice, Financijska kartica) i dalje prate zajednički pattern (što je u nedavnim izmjenama uglavnom usklađeno).

### 1.7 Pristupačnost (a11y)

- **Ograničena uporaba aria i role**  
  Nekoliko komponenti koristi `aria-*` ili `role=` (npr. dialozi, tablice, comboboxi). Nema sustavnog pregleda: fokus u modalu, skip linkovi, oznake za formularne greške, kontrast. Preporuka: postepeno dodavati aria atribute i testirati s čitačem zaslona.

### 1.8 Testiranje

- **Nema unit ili e2e testova**  
  U `package.json` nema skripti za testove (nema Vitest/Jest, Playwright/Cypress). Regresije se oslanjaju na ručno testiranje. Za kritične flowe (login, CRUD zgrade/stana, uplata pričuve) bilo bi korisno imati barem neke automatizirane testove.

### 1.9 Velike komponente

- **Buildings.tsx**  
  Preko 1500 linija – drvo gradova, ulazi, stanovi, dialozi, brisanje, mutacije. Teško je održavati i testirati.  
  **Prijedlog:** Podijeliti na manje komponente ili feature modul (npr. `BuildingsTree`, `BuildingDetail`, `BuildingHeader`, hook `useBuildingSelection`).

- **Tenants.tsx**  
  Oko 870 linija – slično, puno logike u jednoj datoteci. Moguće izdvojiti tablicu, filtere, mobilne kartice i dialoge u podkomponente/hookove.

### 1.10 Dokumentacija i okolina

- **`.env.example`**  
  Na rootu projekta nije pronađen `.env.example` (postoji samo `.env`). Novi developeri ne znaju koje varijable trebaju (`VITE_API_URL`, itd.). Preporuka: dodati `.env.example` s primjerima (bez tajni).

- **Backend u istom repozitoriju**  
  Backend ima svoj `package.json` i strukturu; frontend ga očito zove preko `VITE_API_URL`. Nije uvijek jasno je li backend „u istom repo-u” dio istog produkcijskog builda ili se deploya odvojeno. Kratka napomena u glavnom README-u pomogla bi.

---

## 2. Prijedlozi poboljšanja

### 2.1 Kratkoročno (brzi wins)

| Što | Akcija |
|-----|--------|
| Mrtvi kod | Obrisati `src/components/ProtectedRoute.tsx`. Odlučiti za `AccountStatement`: dodati rutu + link ili ukloniti stranicu. |
| Pristup odbijen | U `ProtectedRoute` dodati gumb/link „Natrag na početnu” koji vodi na `/`. |
| Env | Kreirati `.env.example` s `VITE_API_URL=http://localhost:3000/api` i kratkim opisom. |
| ESLint | Uključiti `@typescript-eslint/no-unused-vars` kao "warn"; očistiti očite neiskorištene varijable. |
| Toast | Sve i dalje koristiti `@/hooks/use-toast` (već je tako); možda u dokumentaciji napomenuti da je `components/ui/use-toast` samo re-export. |

### 2.2 Srednjoročno

| Što | Akcija |
|-----|--------|
| Tipizacija | Uvesti zajedničke tipove za API (Person, Building, Apartment, Debtor, itd.) u `src/types/api.ts` ili sl.; smanjiti `any` u `api.ts` i hookovima. |
| Strict mode | Uključiti `strictNullChecks: true` u tsconfig i postepeno popravljati greške po modulima. |
| Error handling | Dodati globalni error boundary za React i opcionalno centralni API error handler (npr. pri 403 prikazati poruku, pri 5xx toast „Servis privremeno nedostupan”). |
| Testovi | Dodati Vitest; napisati unit testove za `api.ts` (refresh token, parsiranje grešaka), za `formatCurrency` i sl. util funkcije, te 1–2 ključna hooka. |
| Buildings / Tenants | Refaktorirati Buildings (i slično Tenants) u manje komponente i custom hookove bez mijenjanja ponašanja. |

### 2.3 Dugoročno

| Što | Akcija |
|-----|--------|
| Session storage | Razmotriti prelazak na httpOnly cookie za refresh token i kratkotrajni access token u memoriji ili cookie, uz prilagodbu backend auth ruta. |
| E2E testovi | Uvesti Playwright ili Cypress; automatizirati login, otvaranje liste suvlasnika, jedan CRUD flow (npr. zgrada ili stan). |
| Pristupačnost | Proći ključne stranice s axe-core ili sl. alatom; popraviti kontrast, labele, fokus i aria atribute. |
| API verzioniranje | Ako se API mijenja, uvesti npr. `/api/v1/` i na frontendu koristiti taj prefix; olakšava kasnije promjene bez lomljenja postojećih klijenata. |
| Knjigovodstvo | Slijediti plan iz `docs/KNJIGOVODSTVENI_DIO_ZAHTJEVI.md` (knjiženje uplata pričuve, plaćanja računa, izvještaj troškova) – već ima dobar redoslijed. |

---

## 3. Sažetak

- **Glavni problemi:** mrtav/duplicirani kod (ProtectedRoute, AccountStatement), slaba TypeScript tipizacija (`any`, isključen strict mode), nedostatak testova, vrlo velike stranice (Buildings, Tenants), session u localStorage, nedosljedni loading/prazna stanja.
- **Brzi napredak:** ukloniti duplikate, dodati `.env.example`, poboljšati „Pristup odbijen” ekran, uključiti ESLint za unused vars.
- **Srednji rok:** jača tipizacija, globalni error handling, unit testovi, refaktor velikih stranica.
- **Dugi rok:** sigurniji session (cookie), E2E testovi, pristupačnost, API verzioniranje i realizacija knjigovodstvenih zahtjeva iz dokumentacije.

Ovaj dokument može poslužiti kao backlog za tehnički dug i kao osnova za razgovor s timom o prioritetima.

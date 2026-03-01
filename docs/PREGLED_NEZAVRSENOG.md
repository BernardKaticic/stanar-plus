# Pregled nezavršenog i potencijalnih problema

Pregled koda nakon uvođenja modela persons/suvlasnika s više stanova.

---

## Visoki prioritet

### 1. TenantDialog – više stanova bez emaila
**Datoteka:** `src/pages/Tenants.tsx` (cca. 688–696)

Pri dodavanju suvlasnika na više stanova, za stanove 2+ poziva se `tenantsApi.create` bez `person_id`. Backend pronalazi person po emailu. **Ako korisnik ne unese email**, za svaki stan se kreira novi person → duplicirani zapisi.

**Rješenje:** Nakon prvog `createTenant`, iz odgovora izvući `person_id` i za ostale stanove slati `person_id` u create.

---

### 2. TenantDetail ruta – mrtva ruta
**Datoteka:** `src/App.tsx:63`

Postoji ruta `/tenants/:id` → TenantDetail. Cijela navigacija ide na `/persons/:personId` (PersonDetail). Klik na suvlasnika otvara PersonDetail. Ruta TenantDetail se ne koristi.

**Rješenje:** Preusmjeriti `/tenants/:id` na `/persons/:personId` (ako se može dohvatiti person_id) ili ukloniti rutu.

---

### 3. MobileNav – Suvlasnici nije aktivno na PersonDetail
**Datoteka:** `src/components/layout/MobileNav.tsx`

"Suvlasnici" koristi `href="/tenants"`. Na `/persons/123` path ne počinje s `/tenants`, pa stavka nije aktivna. Sidebar to već rješava s `activePaths: ["/persons"]`.

**Rješenje:** U MobileNav dodati logiku da "Suvlasnici" bude aktivno i na `/persons/*`.

---

## Srednji prioritet

### 4. PersonDetail – osoba bez stanova
**Datoteka:** `src/pages/PersonDetail.tsx`

Ako `person.apartments` je prazan niz, `activeApt` je `undefined`. Blok `{activeApt && (` sakriva sadržaj desno, ali lijevi dio može ostati nelogičan (npr. prazna tablica "Stanovi suvlasnika").

**Rješenje:** Eksplicitno prikazati poruku "Nema stanova" i skriti/prilagoditi desni sadržaj kad nema apartmana.

---

### 5. TenantEditDialog – zauzeti stanovi
**Datoteka:** `src/components/tenants/TenantEditDialog.tsx`

U dropdownu se prikazuju svi stanovi, uključujući one koji već imaju suvlasnika. Dodjeljivanje tenanta na zauzet stan može dovesti do više tenant zapisa na isti stan.

**Rješenje:** Filtrirati na prazne stanove ili prikazati upozorenje pri odabiru zauzetog stana.

---

### 6. Debtors – nema linka na PersonDetail
**Datoteka:** `src/pages/Debtors.tsx`

Red dužnika ne vodi nigdje. Korisnik ne može brzo otvoriti karticu suvlasnika.

**Rješenje:** Dodati link na `/persons/:personId` ako debtors API vraća person_id ili tenant podatke s person_id.

---

### 7. Buildings – updateApartment greške
**Datoteka:** `src/pages/Buildings.tsx` (handleApartmentSave)

U petlji `buildingsApi.updateApartment` greške se ignoriraju s `catch { /* ignore */ }`.

**Rješenje:** Bar logirati ili prikazati toast za neuspjele update-ove.

---

### 8. ApartmentDialog – odabir postojećeg suvlasnika
**Datoteka:** `src/components/buildings/ApartmentDialog.tsx`

Koristi `tenantsApi.getAll()` – lista tenant zapisa. Osoba s više stanova pojavljuje se više puta (po jednom po stanu). Konceptualno bi trebalo birati **osobu** (person), ne tenant.

**Rješenje:** Prebaciti na `personsApi.getAll()` i u create tenant slati `person_id`.

---

## Nizak prioritet

### 9. useTenantsData hook
**Datoteka:** `src/hooks/useTenantsData.ts`

Ne koristi se. Tenants stranica koristi `usePersons`.

**Rješenje:** Ukloniti ako nije potreban ili koristiti gdje treba tenant-lista (npr. ApartmentDialog).

---

### 10. apartmentsController – tenant_id semantika
**Datoteka:** `backend/src/controllers/apartmentsController.js`

`tenant_id` u apartments API-ju zapravo sadrži `user_id`, ne `tenants.id`. Confusing imenovanje.

**Rješenje:** Promijeniti ime u `user_id` ili dodati komentar.

---

### 11. Select – keyboard focus / hover
**Datoteka:** `src/components/ui/select.tsx`

Korisnik je naveo da i dalje ne radi kako želi – prva stavka se i dalje hovera. Radix Select automatski stavlja fokus na prvu stavku; možda je potreban drugačiji pristup (npr. custom komponenta ili drugačiji CSS).

---

## Zaključak

| # | Stavka                                      | Prioritet |
|---|---------------------------------------------|-----------|
| 1 | TenantDialog – person_id za više stanova    | Visoki    |
| 2 | TenantDetail ruta – redirect ili ukloniti   | Visoki    |
| 3 | MobileNav – Suvlasnici aktivno na /persons  | Visoki    |
| 4 | PersonDetail – osoba bez stanova            | Srednji   |
| 5 | TenantEditDialog – prazni stanovi           | Srednji   |
| 6 | Debtors – link na PersonDetail              | Srednji   |
| 7 | Buildings – updateApartment error handling  | Srednji   |
| 8 | ApartmentDialog – persons umjesto tenants   | Srednji   |
| 9 | useTenantsData – ukloniti ili koristiti     | Nizak     |
| 10| apartments tenant_id imenovanje             | Nizak     |
| 11| Select hover/focus UX                       | Nizak     |

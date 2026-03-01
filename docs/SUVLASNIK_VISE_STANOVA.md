# Suvlasnik s više stanova – analiza problema

## Problem

**Scenario:** Jedna osoba (npr. Ivan Horvat) posjeduje 10 stanova:
- može biti u istoj zgradi (npr. stan 1, 2, 3 u ulici XYZ)
- može biti u različitim gradovima (Zagreb, Split, Rijeka...)

**Trenutni model:** 1 tenant = 1 stan (`tenants.apartment_id`). Za 10 stanova treba 10 zapisa u `tenants`:
- 10× isto ime, email, telefon
- 10× uređivanje kontakt podataka
- Konfuzno u popisima (isti čovjek 10 puta)
- Web pristup: jedan `user_id` po tenantu – kako jedan korisnik vidi sva 10 stanova?

---

## Što treba riješiti

### 1. **Identitet osobe**
- Jedan zapis za osobu (ime, email, telefon, način dostave)
- Osoba može imati N stanova (u jednoj ili više zgrada/gradova)

### 2. **Povezivanje stan–osoba**
- N:M (više-mnogo): jedan stan može imati više suvlasnika? (npr. bračni par)
- Ili 1:N: jedan “primarni” suvlasnik po stanu? (pojednostavljen model)
- Udio u vlasništvu (npr. 50/50) – potrebno?

### 3. **Financije**
- Transakcije su **po stanu** (to je ispravno – zaduženje/ rata se računaju po stanu)
- Ali: treba li **agregirani pregled**? “Ivan Horvat – ukupno saldo svih stanova”
- Pripremnica (uplatnica): jedna po stanu ili jedna konsolidirana? (obično jedna po stanu – različite zgrade, različiti periodi)

### 4. **Komunikacija i dokumenti**
- Način dostave (e-mail / pošta): **po osobi** (logično – ista preferencija za sve)
- Slanje: i dalje **po stanu** (jedan mail s 10 attachmenta? ili 10 mailova? – obično 10 mailova, svaki s jednom uplatnicom)

### 5. **Web pristup**
- Jedan korisnički račun (`user_id`) vidi **sve stanove** te osobe
- Dashboard: “Moji stanovi” – lista svih 10 s pojedinačnim saldom

### 6. **Organizacijski scope**
- Suvlasnik može imati stanove u zgradama koje upravlja **ista** organizacija
- Ili različite organizacije? (Ako upravljaš zgradu u Zagrebu i zgradu u Splitu – jesu li obje u istoj upraviteljskoj firmi?)

---

## Pristupi rješenju

### A) Uvesti tablicu `persons` (ili `contacts`)

```
persons
  id, name, email, phone, delivery_method, user_id, ...

tenant_apartments (junction)
  person_id, apartment_id, share_pct?, is_primary?, ...
```

- **Person** = identitet osobe, kontakt podaci
- **tenant_apartments** = veza osoba ↔ stan (N:M)
- Transakcije ostaju po `apartment_id`
- Saldo se računava po stanu, agregacija po osobi = suma stanova te osobe

**Prednosti:** Čista normalizacija, jedna izvor istine za kontakt  
**Nedostaci:** Veća migracija, mijenjanje većine upita

---

### B) Zadržati `tenants`, dodati `person_id` (grouping)

```
persons (novo)
  id, name, email, phone, delivery_method, user_id

tenants (izmijenjeno)
  id, person_id NULLABLE, apartment_id, ...
  -- person_id = NULL za stare zapise (1 tenant = 1 stan kao dosad)
  -- person_id = X za nove: više tenant zapisa može dijeliti isti person_id
```

- Stari zapisi: `person_id = NULL`, kontakt podaci ostaju u `tenants`
- Novi zapisi: kreiraš `person`, `tenants` se veže na `person_id`, kontakt se vuče iz `person`
- Migracija: opcionalno spajanje duplikata po emailu u `person`

**Prednosti:** Manje invazivno, backward compatible  
**Nedostaci:** Dvostruka logika (stari vs. novi model) tijekom tranzicije

---

### C) Promijeniti semantiku `tenants` → “osoba”, N:M s apartmanima

```
tenants (preimenovati konceptualno u “person/owner”)
  id, name, email, phone, delivery_method, user_id
  -- BEZ apartment_id

tenant_apartments (novo)
  tenant_id, apartment_id, ...
```

- `tenants` = osoba (suvlasnik)
- `tenant_apartments` = koje stanove ta osoba posjeduje
- Jedan tenant, više stanova

**Prednosti:** Jasna semantika  
**Nedostaci:** Velika promjena u API-ju i frontendu

---

## Otvorena pitanja

1. **Co-ownership:** Može li jedan stan imati 2+ suvlasnika (npr. bračni par)? Ako da → N:M je obavezan.
2. **Migracija postojećih podataka:** Kako tretirati trenutne tenant zapise? Automatsko spajanje po emailu? Ili ručno?
3. **Prioritet:** Što je hitnije – eliminacija duplikata u popisu, ili web pristup “svi moji stanovi”?
4. **Organizacije:** Jesu li svi stanovi jedne osobe uvijek unutar iste organizacije?

---

## Preporuka za sljedeći korak

1. **Definirati scope:** Co-ownership da/ne, organizacijski scope
2. **Odabrati pristup:** A (clean), B (postupno), ili C (full refactor)
3. **Planirati migraciju:** Kako prevesti postojeće tenant zapise u novi model
4. **Fazno uvoditi:** prvo backend model + migracija, zatim API, na kraju frontend

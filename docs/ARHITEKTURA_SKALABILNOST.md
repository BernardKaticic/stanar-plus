# Arhitektura za world-class skalabilnost

## Tvoja slika – sažetak

1. **Upravitelj 1 zgrade** ili **upravitelj cijele države** – ista aplikacija, ista logika
2. **Organizacija = upraviteljska firma** koja kupi aplikaciju – vidi samo svoje podatke
3. **Suvlasnik može biti**:
   - fizička osoba (ti kupiš 3 stana u zgradi ili po stan u svakom gradu)
   - pravna osoba (HZZ, fond, društvo) – oni su „suvlasnici“ stanova
4. **Izolacija po organizaciji** – upravitelj Vinkovci + Županja vidi samo zgrade/stanove svojih organizacija

---

## Trenutno stanje (što već radi)

```
organizations (upraviteljska firma)
    ↓
cities, streets, buildings (sve ima organization_id)
    ↓
apartments (kroz building)
    ↓
tenants (1 tenant = 1 apartment)
```

- **orgFilter** – kad korisnik ima `organization_id`, API vraća samo podatke iz zgrada te organizacije
- Tenants se filtriraju preko `apartment → building → organization_id`
- Jedna organizacija može imati zgrade u cijeloj državi – samo je pitanje količine podataka

**Što je jasno:** izolacija po organizaciji već postoji i radi. Upravitelj vidi samo svoje.

---

## Tri različite „organizacije“ u smislu riječi

| Pojam | Što je | Primjer |
|-------|--------|---------|
| **Organization (u bazi)** | Upraviteljska firma koja koristi aplikaciju | „Upravljanje Vinkovci d.o.o.“ |
| **Suvlasnik – fizička osoba** | Osoba koja posjeduje stanove | Ivan Horvat (3 stana) |
| **Suvlasnik – pravna osoba** | Institucija/fond koja posjeduje stanove | HZZ, Mirovinski fond, investicijski fond |

Organization u bazi **nije** HZZ. HZZ je **suvlasnik** (owner) stanova, kao što si ti suvlasnik ako kupiš stan. Upraviteljska firma koristi app da upravlja zgradama; HZZ samo prima uplatnice i plaća.

---

## Predloženi model: Person (suvlasnik) + veza na stanove

### Nova struktura

```
organizations (nepromijenjeno – upraviteljske firme)
    ↓
buildings → apartments (nepromijenjeno)

persons (NOVO – suvlasnici, fizičke ili pravne osobe)
    id, name, email, phone, oib, type, delivery_method, user_id, ...
    type: 'individual' | 'legal_entity'

person_apartments (NOVO – veza N:M)
    person_id, apartment_id, share_pct?, role?, ...
```

### Zašto ovako

| Zahtjev | Kako je riješeno |
|---------|------------------|
| Jedna osoba – više stanova | `person` ima više `person_apartments` veza |
| HZZ / fond kao suvlasnik | `person.type = 'legal_entity'` |
| Org izolacija | Apartman → building → organization; query uvijek ide kroz building |
| 1 zgradu ili cijela država | Isti model, samo više zgrada u organizaciji |
| Jedan user za sve stanove osobe | `person.user_id` – stanar vidi sve svoje stanove unutar zgrada te org |

---

## Org scope – kako filtriranje radi

**Person nema `organization_id`.**

Scope dolazi samo iz stanova:

- Upit: „Svi suvlasnici u mojoj organizaciji“
- Logika: `persons` koji imaju barem jedan `person_apartments` → `apartment` → `building` gdje je `building.organization_id = trenutna_org`
- Rezultat: vidiš samo osobe koje imaju stanove u tvojim zgradama

Ivan može imati stanove u zgradama Org A (Vinkovci) i Org B (Zagreb):

- Upravitelj Org A vidi Ivana samo preko stanova u Org A
- Upravitelj Org B vidi Ivana samo preko stanova u Org B
- Nema potrebe za cross-org logikom u ovom modelu

---

## Tipovi suvlasnika (person.type)

| type | Opis | Primjer |
|------|------|---------|
| `individual` | Fizička osoba | Ivan Horvat, Ana Marić |
| `legal_entity` | Pravna osoba | HZZ, Mirovinski fond, Fond za stanovanje |

Za `legal_entity` obično koristiš:

- `oib` (obavezno za pravne osobe)
- `address` (sjedište)
- `name` (naziv tvrtke/ustanove)
- `email`, `phone` (kontakt za dopisivanje)

---

## Skalabilnost: 1 zgradа vs cijela država

| Aspekt | 1 zgradа | Cijela država |
|--------|----------|----------------|
| Organizacija | 1 org, 1 building | 1 org, N buildings |
| Gradovi | 1 grad | Svi gradovi |
| Apartmani | Npr. 20 | Npr. 50 000 |
| Persons | Npr. 20 | Npr. 30 000 |
| Indeksi | building_id, organization_id | Isti + pagination, full-text search |
| Brzina | Trivijalno | Pagination, caching, read replicas |

Model ostaje isti; razlika je u volumenu i optimizaciji (indeksi, paginacija, caching). Za fazu 1–2 nije potrebna posebna arhitektura.

---

## Migracija s trenutnog modela

**Trenutno:** `tenants` (1 tenant = 1 apartment)

**Koraci:**

1. Kreirati `persons` i `person_apartments`
2. Za svaki postojeći tenant:
   - kreirati `person` (ime, email, phone, …)
   - kreirati `person_apartments` (person_id, apartment_id)
3. Zadržati `tenants` privremeno ili ga postupno zamijeniti novim upitima
4. API i frontend prebaciti na rad s `persons` + `person_apartments`

---

## Sažetak

| Pitanje | Odgovor |
|---------|---------|
| Org izolacija | Već postoji; sve se filtrira preko `building.organization_id` |
| 1 osoba – više stanova | `person` + `person_apartments` N:M |
| HZZ / fond | `person` s `type = 'legal_entity'` |
| Skalabilnost | Isti model za 1 zgradu i za cijelu državu |
| Person scope | Nema `organization_id`; scope dolazi iz stanova u zgradama organizacije |

Predloženi model pokriva sve opisane scenarije; ostaje odluka o redoslijedu uvođenja (prvo Person + veze, pa tek onda co-ownership ako zatreba).

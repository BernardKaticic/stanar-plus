# UI: Prikaz suvlasnika s više stanova

## Problem

Trenutno: 1 red = 1 suvlasnik = 1 stan.  
Novo: 1 suvlasnik (person) može imati 2+ stanova. Kako to prikazati na **popisu** i **kartici**?

---

## 1. Popis suvlasnika (Tenants list)

### Opcija A: Jedan red po osobi, sažetak

| Suvlasnik | Email | Stanovi | Ukupna rata | Saldo | Dostava |
|-----------|-------|---------|-------------|-------|---------|
| Ivan Horvat | ivan@... | 2 stana | 330 € | −45,00 € | E-mail |
| Ana Marić | ana@... | Stan 5, Ul. X | 120 € | 0,00 € | Pošta |

**Promjene:**
- Kolona „Adresa“ → „Stanovi“ (broj ili lista)
- Kolona „Površina“ → ukloniti ili prikazati zbroj
- „Mjesečna rata“ → zbroj svih stanova
- „Saldo“ → zbroj svih stanova

**Prednosti:** Jednostavno, jedan red po osobi  
**Nedostaci:** Kod 2+ stanova ne vidiš pojedinačne adrese na prvi pogled

---

### Opcija B: Jedan red po osobi, razvojni red (expand)

```
▼ Ivan Horvat     ivan@...    2 stana    330 €    −45 €    E-mail    [⋮]
   ├─ Ul. X 5, Stan 1    • 45 m²  • 150 €  • −20 €
   └─ Ul. Y 10, Stan 2   • 62 m²  • 180 €  • −25 €

▶ Ana Marić       ana@...     Stan 5    120 €     0 €     Pošta     [⋮]
```

- Klik na red otvara pod-redove sa stanovima
- Ili poseban ikona „razvij“ pored imena
- Za 1 stan – bez pod-redova ili odmah prikazan stan

**Prednosti:** Pregled po stanovima bez prelaska na drugu stranicu  
**Nedostaci:** Složenija implementacija, tablica može postati duga

---

### Opcija C: Badge „2 stana“ + tooltip/popover

| Suvlasnik | ... | Stanovi | ... |
|-----------|-----|---------|-----|
| Ivan Horvat [2] | ... | 2 stana (hover → Ul. X, Stan 1; Ul. Y, Stan 2) | ... |

- Uz ime badge „2“ ili „2 stana“
- Hover/tooltip s adresama stanova
- Klik i dalje vodi na karticu suvlasnika

**Prednosti:** Kratak prikaz, dodatne informacije na demand  
**Nedostaci:** Na mobitelu tooltip nije idealan

---

### Preporuka za popis

**Faza 1:** Opcija A – jedan red po osobi sa sažetkom:
- „Stanovi“ umjesto „Adresa“ – za 1 stan: „Ul. X 5, Stan 1“; za više: „2 stana“ ili „3 stana“
- Ukupna mjesečna rata (zbroj)
- Ukupno saldo (zbroj)
- Badge uz ime: „2 stana“ kad je više od 1

**Faza 2 (opcionalno):** Dodati expand (Opcija B) ako korisnici traže detalj u tablici.

---

## 2. Kartica suvlasnika (TenantDetail)

### Trenutna struktura

- Header: ime, adresa (1 stan)
- Lijeva kartica: kontakt, način slanja
- Struktura troška (1 stan)
- Financijska kartica: transakcije (1 stan)

### Nova struktura – osoba s više stanova

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Natrag    Ivan Horvat – Kartica suvlasnika                    │
└─────────────────────────────────────────────────────────────────┘

┌─ KONTAKT (1x za osobu) ─────────────────────────────────────────┐
│  Ivan Horvat                                                     │
│  ivan@email.com  •  091 123 4567  •  E-mail                      │
│  [Ispis kartice] [Pošalji e-mailom]                              │
└─────────────────────────────────────────────────────────────────┘

┌─ Pregled stanova ───────────────────────────────────────────────┐
│  Ukupno: 2 stana  |  Mjesečna rata: 330 €  |  Saldo: −45,00 €   │
└─────────────────────────────────────────────────────────────────┘

┌─ Stan 1: Ul. X 5, Stan 1 ────────────── [aktivni tab] ──────────┐
│  Površina: 45 m²  •  Mjesečna rata: 150 €  •  Saldo: −20,00 €   │
│  [Struktura troška] [Transakcije]                                │
└─────────────────────────────────────────────────────────────────┘

┌─ Stan 2: Ul. Y 10, Stan 2 ──────────────────────────────────────┐
│  Površina: 62 m²  •  Mjesečna rata: 180 €  •  Saldo: −25,00 €   │
│  [Struktura troška] [Transakcije]                                │
└─────────────────────────────────────────────────────────────────┘
```

### Prijedlog implementacije

**A) Tabovi po stanu**
- Tabovi: „Stan 1 – Ul. X 5“ | „Stan 2 – Ul. Y 10“
- Unutar taba: ista struktura kao sada (struktura troška, transakcije, uplatnice)

**B) Accordion / uklopi-sekcije**
- Svaki stan = zasebna sekcija (Collapsible)
- Zadano: prvi otvoren
- Unutra: struktura troška + transakcije

**C) Lista stanova + odabir**
- Lijevo: lista stanova (adresa, saldo)
- Desno: detalji odabranog stana
- Ili vertikalno na mobilu

### Preporuka za karticu

**Tabovi po stanu (A)** – najbliže trenutnom UX-u, jednostavno za razumjeti.

Za 1 stan: bez tabova, kao danas.  
Za 2+ stanova: tabovi „Stan 1 – [adresa]“ | „Stan 2 – [adresa]“ itd.

---

## 3. Mobilni prikaz (cards)

### Trenutno
- Jedna kartica po suvlasniku: ime, adresa, površina, rata, saldo, dostava

### Novo – jedna kartica po osobi

```
┌─────────────────────────────────────┐
│ Ivan Horvat              [2 stana]  │
│ ivan@email.com                      │
│ Ul. X 5, Stan 1 • Ul. Y 10, Stan 2  │  ← ili "2 stana" ako predugo
│                                     │
│ Površina    Mjesečna    Saldo       │
│ 107 m²      330 €      −45 €        │
│                                     │
│ Dostava: E-mail            [⋮]      │
└─────────────────────────────────────┘
```

- Za više stanova: kraće prikazati adrese ili samo „2 stana“ + ukupne brojke
- Klik vodi na karticu s tabovima po stanu

---

## 4. Sažetak promjena

| Mjesto | Promjena |
|--------|----------|
| **Popis (desktop)** | 1 red = 1 osoba; kolone: Stanovi (npr. „2 stana“), Ukupna rata, Ukupno saldo; badge uz ime ako > 1 stan |
| **Popis (mobil)** | 1 kartica = 1 osoba; ukupne brojke; kratak prikaz stanova |
| **Kartica** | Za 1 stan – kao sada; za 2+ stanova – tabovi po stanu, unutra struktura troška + transakcije |
| **URL** | Ostaje `/tenants/:personId` – person ID, ne tenant/apartment ID |

---

## 5. Backward compatibility

Dok postoji stari model (1 tenant = 1 apartment), moguće je:

- Prikazati popis kao dosad (1 red = 1 tenant)
- Kartica ostaje po tenantu (1 stan)
- Kad se uvede `persons`, prebaciti na novi prikaz (1 red = 1 person)

Ili fazno: API može vraćati i „flat“ (tenant po stanu) i „grouped“ (person s listom stanova) format, ovisno o feature flagu ili verziji API-ja.

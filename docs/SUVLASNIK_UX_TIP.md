# Suvlasnik: fizička vs pravna osoba – UX pristup

## Problem

- **U bazi** ima smisla razlikovati: `individual` (Ivan Horvat) vs `legal_entity` (HZZ, fond)
- **Na frontendu** ne želimo: radio „Fizička osoba“ / „Pravna osoba“ – zvuči administrativno i zbunjuje

---

## Pristup 1: Ne prikazuj tip uopće (preporučeno za start)

**Ideja:** Jedan oblik „Suvlasnik“ – polja: Ime/Naziv, Email, Telefon, OIB (opcionalno), Način dostave.

- Tip u bazi: zadano `individual`
- Za HZZ/fond: ista forma – upiše se „HZZ“ kao ime, OIB, adresa
- Korisnik ne bira nikakav tip

**Prednosti:** Jednostavno, bez žargona  
**Nedostaci:** Za pravne osobe možda fali polje (npr. pravna adresa) – može se dodati kasnije

---

## Pristup 2: Prekidač „Tvrtka / ustanova“ (tek kad zatreba)

- U formi mala opcija: ☐ Tvrtka ili ustanova (npr. fond, HZZ)
- Kad je označeno: pojave se dodatna polja (pravna adresa, OIB obavezno)
- Zadano: prazno = fizička osoba

**Prednosti:** Jasno za one koji imaju pravne osobe  
**Nedostaci:** Jedan dodatni korak; većina korisnika ga neće koristiti

---

## Pristup 3: Dva ulaza, isti popis

- Gumbi: „Dodaj osobu“ i „Dodaj tvrtku/ustanovu“
- Različite forme (osoba: ime, OIB opcionalno; tvrtka: naziv, OIB obavezno)
- Oboje završi na istom popisu suvlasnika

**Prednosti:** Jasna namjera pri unosu  
**Nedostaci:** Više UI-a, korisnik mora birati „što dodajem“

---

## Pristup 4: Zaključivanje po OIB-u

- Jedan oblik, OIB opcionalno
- Ako se unese OIB koji odgovara pravnoj osobi (npr. iz registra) → automatski `legal_entity`
- Inače → `individual`

**Prednosti:** Korisnik ne mora ništa birati  
**Nedostaci:** Potreban API za provjeru OIB-a, potencijalne greške

---

## Preporuka

**Za prvu verziju:** Pristup 1 – jedan oblik, bez prikaza tipa.

- U bazi: `type` se pamti (zadano `individual`), ali se ne pokazuje
- Za HZZ: unosi se kao „HZZ“ u Ime/Naziv + OIB + kontakt
- Kasnije, ako zatreba: dodati opciju „Tvrtka/ustanova“ (Pristup 2) bez velikog refaktora

U većini zgrada suvlasnici su fizičke osobe; pravne osobe su manjina. Nema potrebe ističati tip dok to ne donese jasnu korist.

# Prioriteti i procjena – komentari klijenta

Prema zahtjevima iz testiranja, predloženi redoslijed i gruba procjena opsega.

---

## 1. Uređivanje stana i promjena vlasnika (točka 4)

**Što:** Ispravka broja stana, promjena vlasnika, u financijskoj kartici prikaz po vlasniku i povijest „od kad tko plaća”.

**Zašto prvo:** Klijent je konkretno naišao na problem (nije mogao ispraviti stan 2); blokira daljnji rad. Povijest vlasništva je temelj za točno knjiženje.

**Procjena:** Srednje (2–4 dana)  
- Backend: `apartment_ownerships` s `valid_from`/`valid_to` već postoji; API za promjenu vlasnika (zatvaranje starog, novi red), eventualno endpoint za povijest po stanu.  
- Frontend: forma za uređivanje stana (broj, podaci), „Promjena vlasnika” (odabir osobe, datum), u financijskoj kartici filter/prikaz po osobi i po razdoblju vlasništva.

---

## 2. Suvlasništvo – više vlasnika po stanu (točka 5)

**Što:** Jedan stan može imati više vlasnika (npr. 5), s udjelima.

**Zašto drugo:** Model (`apartment_ownerships`) to već podržava. Treba samo ispravan prikaz i unos na frontendu.

**Procjena:** Manje–srednje (1–2 dana)  
- Provjera backend API-ja (lista vlasnika po stanu, udjeli).  
- Frontend: na kartici stana lista suvlasnika, dodavanje/uklanjanje, postavljanje udjela (npr. % ili razlomak).

---

## 3. Knjigovodstveni dio (točka 2)

**Što:** Zaduženja za pričuvu, preuzimanje/upload računa, knjiženje plaćanja računa, knjiženje uplata pričuve; sve vidljivo u „troškovima”.

**Zašto treće:** Veći modul; koristi se nakon što su vlasnici i povijest vlasništva uredni.

**Procjena:** Veliko (1–2 tjedna)  
- Backend: iskoristiti postojeći ledger (konta, `ledger_entries`, `ledger_lines`); API za zaduženja, račune, uplate, plaćanja; izvještaj „troškovi” iz ledgera.  
- Frontend: ekrani Zaduženja, Računi (lista + upload), Knjiženje plaćanja, Uplate pričuve, pregled Troškova po zgradi/stanu.

**Detaljni zahtjevi i mapiranje na postojeći kod:** v. **`docs/KNJIGOVODSTVENI_DIO_ZAHTJEVI.md`** (što već postoji, što nedostaje, preporučeni redoslijed implementacije).

---

## 4. Preglednost UI (točka 1)

**Što:** Značajno pregledniji izgled i raspored.

**Zašto četvrto:** Može se raditi paralelno ili u manjim iteracijama; ne blokira ostale funkcionalnosti.

**Procjena:** Ovisno o opsegu (par dana do tjedan)  
- Definicija s klijentom: koji ekrani, što „preglednije” znači (manje teksta, veći fontovi, jasniji naslovi, bolji razmaci, manje dugmad).  
- Zatim redom: Zgrade, Suvlasnici, Dužnici, Financijska kartica, ostalo.

---

## 5. Preuzimanje vlasničkog lista i OCR (točka 3)

**Što:** Upload vlasničkog lista, program iščita podatke vlasnika (ime, OIB, udio itd.).

**Zašto zadnje:** Zahtijeva vanjski OCR ili specifičan parser; ovisi o formatu dokumenta; manje hitno od ispravki i knjigovodstva.

**Procjena:** Srednje–veliko (3–5 dana + ovisno o OCR rješenju)  
- Odluka: vanjski OCR API (Google Vision, Azure Document Intelligence…) ili ručni unos s mogućnošću kasnijeg OCR-a.  
- Potrebno: primjer vlasničkog lista (PDF/slika) i dogovor što točno čitati.  
- Backend: endpoint za upload, poziv OCR-a, mapiranje polja na `persons` / `apartment_ownerships`.  
- Frontend: upload, pregled prepoznatih podataka, potvrda/ispravka prije snimanja.

---

## Sažetak redoslijeda

| Red | Točka | Sadržaj | Procjena |
|-----|--------|---------|----------|
| 1 | 4 | Uređivanje stana, promjena vlasnika, financijska kartica po vlasniku/povijest | 2–4 dana |
| 2 | 5 | Suvlasništvo (više vlasnika po stanu) – UI | 1–2 dana |
| 3 | 2 | Knjigovodstvo: zaduženja, računi, knjiženje, troškovi | 1–2 tjedna |
| 4 | 1 | Preglednost UI | par dana – tjedan |
| 5 | 3 | Vlasnički list – upload i čitanje podataka (OCR) | 3–5+ dana |

---

*Dokument za internu procjenu; moguće prilagoditi prioritete prema dogovoru s klijentom.*

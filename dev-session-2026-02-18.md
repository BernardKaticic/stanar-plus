## Sažetak sesije – 2026-02-18

- **Model dužnika i financije**
  - Implementiran “world-class” model dužnika: `transactions` kao izvor istine, `apartments.current_balance` kao cache, `reminder_archive` za opomene, uklonjena ovisnost o staroj tablici `debtors`.
  - Dodani eksplicitni **transakcijski blokovi** (`BEGIN/COMMIT/ROLLBACK`) u generiranju uplatnica kako bi se istovremeni INSERT-i u `payment_slips`, `payment_slip_items`, `transactions` i update salda stanova izvršavali atomarno.
  - `FinancialCard` sada poštuje odabrani **datum od/do**: backend `GET /dashboard/financial` prihvaća `from`/`to`, a frontend šalje ISO datume i refetcha podatke kada se promijene datumi.

- **Naknade po zgradi (pričuva, kredit, čišćenje, štednja, izvanredni, struja)**
  - Proširen `buildings` model:
    - Fiksno po stanu: `cleaning_fee`, `savings_fixed`, `extra_fixed`, `electricity_fixed`.
    - Po m²: `reserve_per_sqm`, `loan_fee`, `savings_per_sqm`.
  - `paymentSlipsController.generate` koristi novu formulu:
    - Fiksni dio = čišćenje + štednja (fiksno) + izvanredni + struja.
    - Dio po m² = (pričuva + kredit + štednja po m²) × kvadratura stana.
  - `citiesTreeController` vraća sve naknade kroz `b.fees`, što koriste `ApartmentDialog` i `ApartmentDetailDialog` za procjenu mjesečnog troška po stanu.
  - `BuildingDialog` proširen:
    - Nova polja za štednju (po stanu i €/m²), izvanredne poslove, struju.
    - Jasne oznake što je “po stanu”, a što je “€/m²”.

- **Usklađeni proračuni u frontendu**
  - `ApartmentDialog` i `ApartmentDetailDialog`:
    - Pričuva = `reserve_per_sqm × površina`.
    - Kredit = `loan_fee × površina`.
    - Fiksni dio = čišćenje + štednja (fiksno) + izvanredni + struja.
    - Ukupno mjesečno = fiksni dio + dio po m².
  - Sve novčane vrijednosti formatirane na **točno 2 decimale** (`minimumFractionDigits` + `maximumFractionDigits`).

- **UI/UX poboljšanja**
  - **Tipografija tablica**: smanjen font za “list” tablice (`Suvlasnici`, `Dužnici`, financijske tablice) – header `text-xs`, sadržaj većinom `text-xs` uz `text-sm` za primarne vrijednosti, da ekrani budu kompaktniji.
  - **Kalendari**: svi `DatePicker`/`Calendar` koriste hrvatski locale (`hr` iz `date-fns/locale`); prikaz datuma u formatu `d.M.yyyy.`.
  - Hover stanja, nazivi ekrana (“Suvlasnici” umjesto “Stanari”) i ikonice u tablicama usklađeni s ranijim dogovorima.

- **Novi ekran “Karta”**
  - Dodana ruta `/map` + navigacija u Sidebaru i MobileNavu.
  - Backend (`buildings` + `citiesTreeController`) proširen s poljima `latitude` i `longitude`.
  - Frontend `Map` koristi `react-leaflet` + OpenStreetMap:
    - Markeri za zgrade koje imaju unesene koordinate.
    - Popup prikazuje adresu (ulica + broj, grad) i broj stanova.
    - Ako nema koordinata, prikazuje se “Nema zgrada s koordinatama”.

- **Dashboard i izvještaji**
  - `Dashboard`:
    - `getStats` vraća `monthlyCollections` i `topBuildings`; grafovi pune podatke iz stvarnog API-ja.
    - Dodan `refetchInterval` za **live** osvježavanje svakih 5 minuta.
    - Dodan `isError` handling za sve dashboard hookove (stats, activities, debtors) s lijepim fallback UI-jem.
  - `AccountStatement` i `FinancialCard` koriste koncizne tablice i konzistentno formatiranje valutnih iznosa.

- **Opće čišćenje i kontrole**
  - Uklonjene preostale ikone iz tablica gdje su smetale (npr. “Suvlasnici”, “Predstavnici”).
  - Usklađeni tekstovi (“stanar” → “suvlasnik” gdje god je to bitno za poslovnu logiku).
  - Globalni linter prolazi bez grešaka za `src` i `backend`.
  - Nema preostalih `TODO`/`FIXME`/`@ts-ignore` oznaka – kod je u čistom stanju za daljnje feature-e i testiranje.


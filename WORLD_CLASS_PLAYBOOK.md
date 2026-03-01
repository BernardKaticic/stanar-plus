# World-class projekt – način rada i pravila

Playbook za vođenje projekta na razini koju smo koristili za Postavke (Skladište, Dokumenti): konzistentan UI, čista arhitektura, pristupačnost i održivost. Koristi ova pravila kao referencu za bilo koji sličan projekt.

---

## 1. Način rada (proces)

### 1.1 Spec i prijedlog prije koda
- **Prvo** napiši ili dobiti spec / prijedlog izmjena (npr. `*_prijedlog_izmjene.md`) s jasnom strukturom: file structure, komponente, primjer koda.
- **Pročitaj prijedlog** u cijelosti; identificiraj što se **mora uskladiti** s postojećim kodom (tipovi, imena komponenti, API-ji, konvencije).
- **Adaptiraj, ne kopiraj slijepo:** tipovi iz tvog codebasea (npr. `UnitOfMeasure` ne `Unit`), postojeći UI (EmptyState API, FormField `hint` vs `description`), želje korisnika (npr. „bez ikona”).

### 1.2 Jedan referentni ekran
- Odluči **jedan** ekran kao „izvor istine” (npr. Skladište ili Dokumenti).
- Svi slični ekrani (liste, kartice, forme, modali) **izgledaju i ponašaju se isto**: isti header kartice, isti gumb Dodaj, isti raspored gumba u formi, isti confirm modal.
- Napiši **kratki konvencije dokument** (npr. `UI_CONVENTIONS.md`) i **čitaj ga prije svake nove stranice** da ne gubiš kontekst.

### 1.3 Refaktor u komponente
- Stranica (page) **ne smije biti monolit**: max ~50–80 linija, samo sastav komponenti + minimalan state.
- Svaki logički blok (lista stavki, forma za jedan entitet, detail panel, sekcija postavki) → **zasebna komponenta** u `components/settings/<feature>/` ili slično.
- Ime komponente odgovara odgovornosti: `WarehouseManager`, `WarehouseForm`, `WarehouseList`, `WarehouseListItem`, `SeriesList`, `SeriesDetail`, `SeriesForm`, `DeleteSeriesDialog`.

---

## 2. UI konvencije (konzistentnost)

### 2.1 Kartice (Cards)
- **Card:** `className="border-border elevated-1 overflow-hidden p-0"`.
- **CardHeader:** `className="mb-0 rounded-none border-b border-primary-6/30 bg-primary-2 px-6 py-4"`.
- **CardContent:** `className="p-6"`.
- **Header sadržaj:** naslov (`CardTitle`) + opis (`<p className="mt-0.5 text-sm font-normal text-neutral-7">`). **Bez ikona** u headeru ako korisnik to ne želi; sve kartice iste težine (nema posebnih gradijenata samo na jednoj).

### 2.2 Gumb „Dodaj”
- **Uvijek primary** (default), nikad `variant="outline"` za glavnu akciju dodavanja.
- U headeru kartice, desno: `<Button type="button" className="gap-2" onClick={...}>Dodaj ...</Button>`.
- Kad je forma u Dialogu, gumb je uvijek vidljiv; kad je forma inline, gumb se prikaže samo kad forma nije otvorena.

### 2.3 Forme – akcijski gumbi
- **Poravnanje:** uvijek **desno**: `flex justify-end gap-2` (ili `border-t border-border pt-4` / `pt-6` iznad).
- **Redoslijed:** prvo Odustani (`variant="outline"`), zatim Spremi/Dodaj (primary).
- **Loading:** na submit gumbu prikaži spinner + „Spremanje…” kad je `form.formState.isSubmitting`; onemogući gumb.

### 2.4 Lista stavki (list items)
- **Isti layout na cijeloj stranici:** npr. jedan red, lijevo sadržaj (naziv, šifra/oznaka, badgeovi), desno akcije (Zadano, Uredi, Obriši).
- **Isti styling:** npr. `rounded-lg border border-neutral-4 bg-neutral-1 px-4 py-3`, hover shadow, akcije na hover (ili uvijek vidljive na mobilnoj).
- Ako jedan ekran ima „stavku s ikonom”, a drugi „stavku bez ikone” – **uskadi oba** (odluči jedan pattern i primijeni svuda).

### 2.5 Prazna stanja (empty state)
- Kad nema stavki, prikaži **EmptyState**: naslov, kratki opis, CTA gumb (npr. „Dodaj prvi …”).
- API komponente: npr. `icon`, `title`, `description`, `action: { label, onClick }`. Ako koristiš ikonu, može biti i neutralni krug ako korisnik ne želi ikone.

---

## 3. Modali i pristupačnost

### 3.1 Confirm (brisanje, neopozive akcije)
- **Uvijek AlertDialog** (Radix / shadcn), **nikad** custom `div` s overlayem.
- Razlog: focus trap, ESC zatvara, scroll lock, screen reader podrška.
- Struktura: `AlertDialog`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogCancel`, `AlertDialogAction`.
- Gumbi: Odustani (outline), Destruktivna akcija (destructive). `onOpenChange` proslijedi parentu da može zatvoriti state.

### 3.2 Forma u modalu (dodaj/uredi)
- **Dialog** (Radix) za add/edit formu: fokus na formu, zatvaranje ESC-om, bez guranja liste prema dolje.
- `open` / `onOpenChange` kontrolirani iz parenta; nakon uspješnog submita zatvori dialog i očisti state.

---

## 4. Forme i validacija

### 4.1 React Hook Form + Zod
- Jedna Zod shema po formi; `z.infer<typeof schema>` za tip.
- `useForm({ resolver: zodResolver(schema), defaultValues })`.
- Za brojčana polja koja mogu doći prazna s HTML-a: `z.coerce.number().int().min(0).max(9999)` da nema NaN/unknown.

### 4.2 Sync forme sa storeom / odabranim entitetom
- `useEffect` koji poziva `form.reset(...)` kad se promijeni odabrani entitet ili store (npr. `inventorySettings.valuationMethod`).
- **Dependency lista:** samo primitivne/stabilne vrijednosti (npr. `series.id`, `warehouse?.id`, `inventorySettings.valuationMethod`). **Ne** stavljati `form` ili `form.reset` u dependency – koristiti `// eslint-disable-next-line react-hooks/exhaustive-deps` s kratkim komentarom (npr. „sync form with store; reset is stable”).

### 4.3 watch() u JSX-u
- **Ne** pisati `form.watch("field")` više puta u JSX-u. Izvući u varijable prije `return`: `const value = form.watch("field");` pa u JSX koristiti `value`.

### 4.4 FormField
- Jedan prop za pomoćni tekst: npr. **`hint`** (ili `description` ako je to konvencija projekta). Budi konzistentan u cijelom projektu.

---

## 5. State i store

### 5.1 Globalni state (npr. Zustand)
- Lista entiteta (skladišta, jedinice, serije) i akcije: `add*`, `update*`, `remove*`, `setDefault*` živu u storeu.
- Stranica ili manager komponenta **čita** iz storea i **poziva** akcije; forme šalju podatke preko callbacka (npr. `onSubmit`, `onConfirm`).

### 5.2 Lokalni state na stranici
- Odabir (npr. `selectedSeriesId`), otvorenost dialoga (npr. `deleteDialogOpen`, `warehouseFormOpen`).
- Nakon brisanja: sljedeći odabir izračunaj iz **svježeg** storea (npr. `getState().documentSeries`) da ne koristiš zastarjeli state.

---

## 6. Struktura datoteka

```
app/(dashboard)/settings/<feature>/
  page.tsx                    # samo header + sastav komponenti (~30–80 linija)

components/settings/<feature>/
  <entity>-manager.tsx         # kartica + Dialog + AlertDialog + EmptyState/List
  <entity>-form.tsx           # forma (Zod + RHF)
  <entity>-list.tsx           # lista (map + list item)
  <entity>-list-item.tsx      # jedna stavka (akcije, badgeovi)
  <feature>-detail.tsx        # optional: detail panel (npr. series-detail)
  delete-<entity>-dialog.tsx  # AlertDialog za brisanje
```

- **UI komponente** (Button, Card, Dialog, AlertDialog, Input, Select, FormField, Textarea, Switch, Badge, EmptyState) u `components/ui/` ili `components/patterns/`.

---

## 7. Checklist za novu stranicu / refaktor

- [ ] Kartice: isti Card/CardHeader/CardContent styling kao na referentnom ekranu.
- [ ] Gumb Dodaj: primary, u headeru kartice desno.
- [ ] Forme: gumbi desno (Odustani, Spremi/Dodaj), loading state na submitu.
- [ ] Lista stavki: isti layout i stil kao na drugim listama (naziv, oznaka, badgeovi, akcije).
- [ ] Confirm brisanja: AlertDialog, ne custom div.
- [ ] Add/Edit: forma u Dialogu ako je to konvencija; inače inline na vrhu.
- [ ] Empty state: kad nema stavki, EmptyState s CTA.
- [ ] Nema ikona u headerima ako je odluka „bez ikona”; konzistentno na svim karticama.
- [ ] FormField: jedan prop za pomoć (hint/description), konzistentno.
- [ ] watch() izvučen u varijable; useEffect dependency liste bez cijelog `form` objekta.
- [ ] Stranica (page) kratka; logika u manager/detail/form komponentama.

---

## 8. Kako iskoristiti za drugi projekt

1. **Kopiraj ovaj playbook** u novi repo (npr. `docs/WORLD_CLASS_PLAYBOOK.md` ili u root).
2. **Prilagodi** nazive (npr. putanja `components/settings/<feature>` → tvoja struktura), te konvencije (npr. želiš li ikone u headerima – zapiši odluku).
3. **Definiraj jedan referentni ekran** na početku i napiši kratki `UI_CONVENTIONS.md` iz tog ekrana.
4. **Za svaki novi feature:** prvo kratki spec/prijedlog (što se gradi, koje komponente), pa implementacija prema playbooku i konvencijama.
5. **Code review** provjerava: konzistentnost s konvencijama, kratke stranice, AlertDialog za confirm, loading/empty state.

Ovaj dokument + `UI_CONVENTIONS.md` (prilagoden tvom projektu) drže kvalitetu i konzistentnost na „world-class” razini kroz cijeli projekt.

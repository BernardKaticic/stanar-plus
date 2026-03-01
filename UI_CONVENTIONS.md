# UI konvencije – Stanar Plus

Referenca za konzistentan izgled na svim ekranima (Stanari, Dužnici, Uplatnice, Nadzorna ploča, Zgrade, itd.). **Referentni ekran:** Stanari – svi list/detail ekrani prate isti uzorak kartica, gumba „Dodaj” i praznih stanja.

---

## Kartice (Cards) s listom + dodavanje

### Header kartice
- **Struktura:** `CardHeader` s `flex flex-row flex-wrap items-start justify-between gap-3` (ili `items-center` ako nema opisa).
- **Lijevo:** Naslov (`CardTitle`) + opcionalno opis (`<p className="mt-0.5 text-sm font-normal text-neutral-7">`).
- **Desno:** Gumb za dodavanje. Kad je forma u Dialogu, gumb je uvijek vidljiv; kad je forma inline na vrhu kartice, prikaži gumb samo kad forma nije otvorena (`{!formOpen && <Button>...</Button>}`).

### Gumb „Dodaj” u headeru
- **Stil:** primary gumb (default), **ne** `variant="outline"`.
- **Primjer:** `<Button type="button" className="gap-2" onClick={...}><Plus className="h-4 w-4" /> Dodaj ...</Button>`.
- Referenca: `settings/company/page.tsx` (Dodaj račun), `settings/inventory/page.tsx` (Dodaj skladište, Dodaj jedinicu mjere).

### Forma za dodavanje/uređivanje
- **Preporuka:** forma u **Dialogu** (modal) – bolji fokus, bez guranja liste, ESC zatvara. Primjer: `settings/inventory/page.tsx` (skladišta, jedinice mjere).
- Alternativa: forma na vrhu `CardContent` (kao na Dokumentima kada je master–detail u jednoj kartici).

---

## Gumbi u formama (akcije)

- **Poravnanje:** uvijek **desno** – `flex justify-end gap-2`.
- **Odvajanje od polja:** `border-t border-border pt-4` ili `pt-6` (kao na Dokumentima).
- **Redoslijed:** prvo „Odustani” (secondary), zatim primarna akcija („Spremi” / „Dodaj”).
  - Odustani: `variant="outline"`.
  - Spremi/Dodaj: default (primary), bez variant.

**Primjer:**
```tsx
<div className="flex justify-end gap-2 border-t border-border pt-4">
  <Button type="button" variant="outline" onClick={onCancel}>Odustani</Button>
  <Button type="submit" disabled={isSubmitting}>Spremi</Button>
</div>
```

Referenca: `settings/company/page.tsx` (bank form: `flex justify-end gap-2 pt-2`), `settings/documents/page.tsx` (`flex justify-end border-t border-border pt-6`), `settings/inventory/page.tsx`.

---

## Confirm modali (brisanje itd.)

- Koristiti **AlertDialog** (`@/components/ui/alert-dialog`): focus trap, ESC, scroll lock, pristupačnost. **Ne** custom `div` s overlayem.
- `AlertDialog`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogCancel`, `AlertDialogAction`.
- Gumbi: Odustani (`AlertDialogCancel` + `Button variant="outline"`), Obriši (`AlertDialogAction` + `Button variant="destructive"`).
- Primjer: `settings/inventory/page.tsx` (brisanje skladišta, brisanje JMB).

---

## Card styling (Stanar Plus)

- **Card** (`@/components/ui/card`): defaultni stil uključuje `border border-border shadow-elevated-1 overflow-hidden p-0`. Za kompaktne kartice (npr. statistike) dodaj `className="p-4"`.
- **CardHeader**: defaultno `flex items-center justify-between`, `border-b border-primary/30 bg-primary/5 px-6 py-4`. Lijevo: `CardTitle` + opcionalno `CardDescription`. Desno: primarna akcija (npr. „Dodaj stanara”).
- **CardContent**: defaultno `p-6`. Sadržaj liste, tablice ili forme.
- Referenca: `src/pages/Tenants.tsx`, `src/pages/Dashboard.tsx`.

---

## Ostalo

- **watch() u renderu:** izvući u varijable prije `return`, npr. `const value = form.watch("field");`, pa u JSX koristiti `value`.
- **useEffect dependency:** koristiti stabilne reference (npr. `form.reset`) u dependency listi, ne cijeli `form` objekt.
- **Brojčani input + Zod:** za polja koja mogu doći prazna s HTML-a koristiti `z.coerce.number().int().min(0).max(9999)` (ili slično) da se izbjegne NaN/unknown.

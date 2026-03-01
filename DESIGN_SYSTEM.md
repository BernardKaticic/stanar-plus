# Stanar Plus – Design system

## Paleta: poslovna (duboki teal + neutralne sive)

Cilj je **ozbiljan, čitljiv izgled za poslovnu app** – ne mekano/pastel, ne generički plavi.

- **Primary** = **duboki teal** `172 55% 32%` – tamniji, zasićeniji; gumbi, linkovi, sidebar, grafovi. **Nije plava, nije pastelan.**
- **Pozadine i neutrals** = **neutralna siva** (`220°` hue) – čisto, odlučno, bez toplog „kamena”. Background `95%` svjetline, borderi jasniji (`82%`).
- **Tekst** = tamna siva `220 18% 10%` – jak kontrast, profesionalna čitljivost.

### Pravila korištenja

1. **Primarna boja (teal)**  
   Koristiti za: primarne gumbe, aktivne linkove, ikone akcija, header kartice (pozadina `primary-light`), sidebar aktivno, prvu seriju u grafovima.  
   Ne koristiti za: velike blokove teksta, cijele pozadine stranice.

2. **Statusne boje**  
   - **Success** (zelena): plaćeno, pozitivno stanje, “uredno”.  
   - **Warning** (amber): na čekanju, rok blizu, pažnja.  
   - **Destructive** (crvena): dugovanje, brisanje, greška.  
   - **Info** (cyan-teal): informativni sadržaj, sekundarni graf.  
   Koristiti **samo** za značenje (stanje, status), ne za dekoraciju.

3. **Neutrals (muted, secondary, border)**  
   Za pozadine tablica, disabled stanja, granice, sekundarne gumbe.  
   Zadržati **toplu** paletu (hue ~28–42), ne prelaziti na čisto sive (210°).

4. **Grafovi**  
   `chart-1` = primary (teal), `chart-2` = amber, `chart-3` = success, `chart-4` = warning, `chart-5` = destructive.  
   Ostati na 1–2 boje po grafu gdje je moguće; više serija = koristiti redom iz palete.

5. **Kontrast i pristupačnost**  
   Tekst na pozadini uvijek dovoljan kontrast (foreground na background, primary-foreground na primary).  
   Muted tekst samo za sekundarne informacije.

Sve boje su u **HSL** i definirane u `src/index.css` (`:root` i `.dark`). Nijedna hardkodirana hex/rgb u komponentama – uvijek `hsl(var(--primary))` itd.

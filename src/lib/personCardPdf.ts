/**
 * Izvještaj o kartici suvlasnika – PDF
 * Zaglavlje: podaci suvlasnika
 * Za svaki stan: naknade + transakcije tekuće godine
 * Otvara se u novoj kartici, koristi Roboto font za hrvatske znakove (č, ć, ž, š, đ)
 */
import { jsPDF } from "jspdf";

const ROBOTO_URLS = [
  "https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Regular.ttf",
  "/fonts/Roboto-Regular.ttf", // lokalno u public/fonts/
];
const currentYear = new Date().getFullYear().toString();

async function loadRobotoFont(doc: jsPDF): Promise<boolean> {
  for (const url of ROBOTO_URLS) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);
      doc.addFileToVFS("Roboto-Regular.ttf", base64);
      doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
      doc.addFont("Roboto-Regular.ttf", "Roboto", "bold");
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

const formatDelivery = (dm: string | null | undefined) => {
  if (dm === "email") return "E-mail";
  if (dm === "pošta") return "Pošta";
  if (dm === "both") return "E-mail i pošta";
  return "Nije odabrano";
};

type AptForPdf = {
  apartmentNumber?: string;
  address?: string | null;
  city?: string | null;
  area?: string | null;
  size_m2?: string | null;
  monthlyRate?: string | null;
  balance?: string;
  balanceNum?: number;
  feeBreakdown?: {
    reservePerSqm?: number;
    loanPerSqm?: number;
    savingsPerSqm?: number;
    cleaningFee?: number;
    savingsFixed?: number;
    extraFixed?: number;
    electricityFixed?: number;
  } | null;
  transactions?: { type?: string; date?: string; amount?: string; description?: string; balance?: string; dateIso?: string }[];
};

type PersonForPdf = {
  name: string;
  email?: string | null;
  phone?: string | null;
  deliveryMethod?: string | null;
  apartments: AptForPdf[];
};

const BORDER = { r: 228, g: 228, b: 228 };
const HEADER_BG = { r: 248, g: 250, b: 252 };

function transactionsForCurrentYear(apt: AptForPdf) {
  const txs = apt.transactions ?? [];
  return txs.filter((tx) => {
    const d = (tx as { dateIso?: string }).dateIso ?? tx.date;
    if (!d) return false;
    const y = typeof d === "string" && d.length >= 4 ? d.slice(0, 4) : String(new Date(d).getFullYear());
    return y === currentYear;
  });
}

export async function generatePersonCardPdf(person: PersonForPdf): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const useRoboto = await loadRobotoFont(doc);
  const fontFamily = useRoboto ? "Roboto" : "helvetica";

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const pad = 6;
  let y = margin;

  const checkPageBreak = (need: number) => {
    if (y + need > pageH - margin - 15) {
      doc.addPage();
      y = margin;
    }
  };

  // ─── ZAGLAVLJE – Podaci suvlasnika ──────────────────────────
  doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  doc.setFillColor(HEADER_BG.r, HEADER_BG.g, HEADER_BG.b);
  doc.rect(margin, y, pageW - margin * 2, 38, "FD");
  doc.rect(margin, y, pageW - margin * 2, 38);

  doc.setFontSize(14);
  doc.setFont(fontFamily, "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Izvještaj o kartici suvlasnika", margin + pad, y + pad + 5);

  doc.setFontSize(10);
  doc.setFont(fontFamily, "normal");
  doc.text(person.name, margin + pad, y + pad + 14);
  doc.text(`E-mail: ${person.email || "–"}`, margin + pad, y + pad + 20);
  doc.text(`Telefon: ${person.phone || "–"}`, margin + pad + 70, y + pad + 20);
  doc.text(`Način dostave: ${formatDelivery(person.deliveryMethod)}`, margin + pad + 120, y + pad + 20);
  doc.text(`Datum izvještaja: ${new Date().toLocaleDateString("hr-HR")}`, margin + pad, y + pad + 28);

  y += 38 + 12;

  // ─── Za svaki stan redom ────────────────────────────────────
  person.apartments.forEach((apt, idx) => {
    checkPageBreak(80);

    const aptLabel = `Stan ${apt.apartmentNumber ?? idx + 1}`;
    const aptAddr = [apt.address, apt.city].filter(Boolean).join(", ") || "–";

    doc.setFontSize(12);
    doc.setFont(fontFamily, "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(`${aptLabel} – ${aptAddr}`, margin, y);
    y += 8;

    // Naknade ovog stana
    const fb = apt.feeBreakdown;
    if (fb) {
      doc.setFontSize(10);
      doc.setFont(fontFamily, "bold");
      doc.text("Naknade", margin, y);
      y += 5;
      doc.setFont(fontFamily, "normal");
      const perSqm = [
        { label: "Pričuva (€/m²)", v: fb.reservePerSqm ?? 0 },
        { label: "Kredit (€/m²)", v: fb.loanPerSqm ?? 0 },
        { label: "Štednja (€/m²)", v: fb.savingsPerSqm ?? 0 },
      ].filter((x) => x.v !== 0);
      const fixed = [
        { label: "Čišćenje", v: fb.cleaningFee ?? 0 },
        { label: "Štednja (fiksno)", v: fb.savingsFixed ?? 0 },
        { label: "Izvanredni", v: fb.extraFixed ?? 0 },
        { label: "Struja", v: fb.electricityFixed ?? 0 },
      ].filter((x) => x.v !== 0);
      perSqm.forEach(({ label, v }) => {
        doc.text(`  ${label}: ${v.toFixed(2)} €`, margin, y);
        y += 4;
      });
      fixed.forEach(({ label, v }) => {
        doc.text(`  ${label}: ${v.toFixed(2)} €`, margin, y);
        y += 4;
      });
      doc.setFont(fontFamily, "bold");
      doc.text(`  Mjesečna rata: ${apt.monthlyRate ?? "–"}`, margin, y);
      doc.setFont(fontFamily, "normal");
      y += 8;
    } else {
      doc.setFontSize(10);
      doc.text(`Mjesečna rata: ${apt.monthlyRate ?? "–"}  |  Saldo: ${apt.balance ?? "–"}`, margin, y);
      y += 8;
    }

    // Transakcije tekuće godine
    const txs = transactionsForCurrentYear(apt);
    doc.setFontSize(10);
    doc.setFont(fontFamily, "bold");
    doc.text(`Transakcije ${currentYear}. godine`, margin, y);
    y += 6;

    const tableW = pageW - margin * 2;
    const colW = [28, 25, 30, 70, 35];
    const rowH = 5;
    const headerH = 6;

    doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
    doc.setFillColor(HEADER_BG.r, HEADER_BG.g, HEADER_BG.b);
    doc.rect(margin, y, tableW, headerH, "FD");
    doc.rect(margin, y, tableW, headerH);
    doc.setFontSize(9);
    doc.setFont(fontFamily, "bold");
    doc.setTextColor(0, 0, 0);
    let cx = margin + 3;
    ["Vrsta", "Datum", "Iznos", "Opis", "Saldo"].forEach((h, i) => {
      doc.text(h, cx, y + 4);
      cx += colW[i];
    });
    y += headerH;

    doc.setFont(fontFamily, "normal");
    if (txs.length === 0) {
      doc.text("Nema transakcija u tekućoj godini", margin + 5, y + 4);
      y += 10;
    } else {
      txs.forEach((tx) => {
        checkPageBreak(rowH + 5);
        doc.line(margin, y, margin + tableW, y);
        cx = margin + 3;
        doc.text((tx.type ?? "–").slice(0, 12), cx, y + 3.5);
        cx += colW[0];
        doc.text((tx.date ?? "–").slice(0, 12), cx, y + 3.5);
        cx += colW[1];
        doc.text((tx.amount ?? "–").slice(0, 12), cx, y + 3.5);
        cx += colW[2];
        doc.text((tx.description ?? "–").slice(0, 35), cx, y + 3.5);
        cx += colW[3];
        const bal = tx.balance ?? "–";
        if (String(bal).startsWith("-")) doc.setTextColor(220, 38, 38);
        doc.text(bal.slice(0, 12), cx, y + 3.5);
        doc.setTextColor(0, 0, 0);
        y += rowH;
      });
      y += 4;
    }
    y += 14;
  });

  // ─── Footer ─────────────────────────────────────────────────
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Izdano: ${new Date().toLocaleDateString("hr-HR")} ${new Date().toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" })}`,
    margin,
    pageH - 8
  );

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

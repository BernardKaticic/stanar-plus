/**
 * Parser za hrvatske e-račune (UBL 2.1 / EN 16931)
 * Izvlači osnovne podatke iz XML datoteke
 */

export interface ParsedInvoice {
  invoiceNumber: string;
  supplierName: string;
  date: string; // YYYY-MM-DD
  dueDate: string | null;
  amount: number;
  currency?: string;
}

const getText = (el: Element | null): string =>
  el?.textContent?.trim() || "";

export async function parseXmlInvoice(file: File): Promise<ParsedInvoice | null> {
  const text = await file.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/xml");
  const root = doc.documentElement;

  if (!root) return null;

  const byLocal = (localName: string) =>
    root.querySelector(`[local-name()="${localName}"]`) ||
    root.getElementsByTagNameNS("*", localName)[0];

  const invoiceNumber =
    getText(byLocal("ID")) ||
    getText(byLocal("InvoiceNumber")) ||
    "";

  const issueDate = getText(byLocal("IssueDate")) || "";

  const dueDate =
    getText(byLocal("DueDate")) ||
    getText(byLocal("PaymentDueDate")) ||
    null;

  let amount = 0;
  const payable = byLocal("PayableAmount");
  const taxIncl = byLocal("TaxInclusiveAmount");
  const lineExt = byLocal("LineExtensionAmount");
  const legalMonetaryTotal = root.querySelector("[local-name()='LegalMonetaryTotal']");

  if (payable) amount = parseFloat(getText(payable)) || 0;
  if (amount === 0 && taxIncl) amount = parseFloat(getText(taxIncl)) || 0;
  if (amount === 0 && legalMonetaryTotal) {
    const ta = legalMonetaryTotal.querySelector("[local-name()='TaxInclusiveAmount']");
    if (ta) amount = parseFloat(getText(ta)) || 0;
  }
  if (amount === 0 && lineExt) amount = parseFloat(getText(lineExt)) || 0;

  let supplierName = "";
  const accountingSupplier = root.querySelector("[local-name()='AccountingSupplierParty']");
  if (accountingSupplier) {
    const party = accountingSupplier.querySelector("[local-name()='Party']");
    const nameEl = party?.querySelector("[local-name()='Name']");
    supplierName = getText(nameEl || null);
  }
  if (!supplierName) {
    const partyName = root.querySelector("[local-name()='AccountingSupplierParty'] [local-name()='PartyName'] [local-name()='Name']");
    if (partyName) supplierName = getText(partyName);
  }
  if (!supplierName) {
    const regName = root.querySelector("[local-name()='AccountingSupplierParty'] [local-name()='PartyLegalEntity'] [local-name()='RegistrationName']");
    if (regName) supplierName = getText(regName);
  }

  const currency =
    payable?.getAttribute("currencyID") ||
    taxIncl?.getAttribute("currencyID") ||
    "EUR";

  const dateFormatted = issueDate
    ? (issueDate.includes("-")
        ? issueDate.slice(0, 10)
        : issueDate.length >= 8
          ? `${issueDate.slice(0, 4)}-${issueDate.slice(4, 6)}-${issueDate.slice(6, 8)}`
          : "")
    : "";

  const dueDateFormatted = dueDate
    ? (dueDate.includes("-")
        ? dueDate.slice(0, 10)
        : dueDate.length >= 8
          ? `${dueDate.slice(0, 4)}-${dueDate.slice(4, 6)}-${dueDate.slice(6, 8)}`
          : null)
    : null;

  if (!invoiceNumber && !supplierName && amount === 0) return null;

  return {
    invoiceNumber: invoiceNumber || `XML-${Date.now()}`,
    supplierName: supplierName || "Nepoznat dobavljač",
    date: dateFormatted || new Date().toISOString().slice(0, 10),
    dueDate: dueDateFormatted,
    amount: Math.round(amount * 100) / 100,
    currency,
  };
}

/**
 * Dashboard: formatiranje i normalizacija podataka za prikaz.
 * Jedan izvor istine za formatCurrency/formatNumber i adaptere.
 */

export function formatCurrency(value?: number): string {
  if (typeof value !== "number") {
    return "0,00 €";
  }
  return value.toLocaleString("hr-HR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

export function formatNumber(value?: number): string {
  if (typeof value !== "number") {
    return "0";
  }
  return value.toLocaleString("hr-HR");
}

/** Skraćeni iznos za Y os (npr. "1,2k €") */
export function formatCurrencyShort(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toLocaleString("hr-HR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}k €`;
  }
  return formatCurrency(value);
}

export type Stats = {
  period?: "ytd" | "last12m";
  periodLabel?: string;
  totalCharged?: number;
  totalPaid?: number;
  collectionRate?: number;
  outstandingBalance?: number;
  upcomingCharges?: number;
  averageDaysOverdue?: number;
  openWorkOrders?: number;
  urgentWorkOrders?: number;
  cityCount?: number;
  buildingCount?: number;
  apartmentCount?: number;
  tenantCount?: number;
  occupiedUnitCount?: number;
  occupancyRate?: number;
  emptyUnits?: number;
  bankImportsPending?: number;
  invoicesDueThisWeek?: number;
  ageingBuckets?: {
    d0_30?: { count: number; amount: number };
    d31_60?: { count: number; amount: number };
    d61_90?: { count: number; amount: number };
    d90p?: { count: number; amount: number };
  };
  monthlyCollections?: { month: string; charged: number; paid: number }[];
  expenseBreakdown?: { key: string; label: string; value: number }[];
  topBuildings?: { building: string; amount: number }[];
};

export type StatCard = {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  drillTo?: string;
};

export function getStatCards(
  stats: Stats | undefined,
  statsLoading: boolean,
  statsError: boolean,
  formatCurrencyFn: (v?: number) => string,
  hasDebtors: boolean,
  periodLabel = "ove godine"
): StatCard[] {
  if (statsError) {
    return [
      { title: "Ukupno zaduženo ove godine", value: "—", change: "", changeType: "neutral" },
      { title: "Ukupno naplaćeno ove godine", value: "—", change: "", changeType: "neutral" },
      { title: "Aktivna dugovanja", value: "—", change: "", changeType: "neutral" },
      { title: "Otvoreni radni nalozi", value: "—", change: "", changeType: "neutral" },
    ];
  }
  return [
    {
      title: `Ukupno zaduženo (${periodLabel})`,
      value: statsLoading ? "..." : formatCurrencyFn(stats?.totalCharged),
      change: statsLoading ? "" : ((stats?.upcomingCharges ?? 0) > 0 ? `Planirano ovaj mjesec ${formatCurrencyFn(stats?.upcomingCharges)}` : ""),
      changeType: "neutral",
      drillTo: "/payment-slips",
    },
    {
      title: `Ukupno naplaćeno (${periodLabel})`,
      value: statsLoading ? "..." : formatCurrencyFn(stats?.totalPaid),
      change: statsLoading ? "" : `Stopa naplate ${(stats?.collectionRate ?? 0).toFixed(1)}%`,
      changeType: "neutral",
      drillTo: "/financial-card",
    },
    {
      title: "Aktivna dugovanja",
      value: statsLoading ? "..." : formatCurrencyFn(stats?.outstandingBalance),
      change: statsLoading ? "" : (hasDebtors && (stats?.averageDaysOverdue ?? 0) > 0 ? `Prosječno kašnjenje ${stats?.averageDaysOverdue} dana` : ""),
      changeType: "negative",
      drillTo: "/debtors",
    },
    {
      title: "Otvoreni radni nalozi",
      value: statsLoading ? "..." : `${stats?.openWorkOrders ?? 0}`,
      change: statsLoading ? "" : `Hitni ${stats?.urgentWorkOrders ?? 0}`,
      changeType: "neutral",
      drillTo: "/work-orders",
    },
  ];
}

export type CollectionDataItem = { month: string; zaduzeno: number; uplaceno: number };

function toShortMonthLabel(label: string): string {
  const trimmed = String(label || "").trim();
  if (!trimmed) return "";
  const [month, year] = trimmed.split(/\s+/);
  if (!month || !year) return trimmed;
  const map: Record<string, string> = {
    siječanj: "sij",
    veljača: "velj",
    ožujak: "ožu",
    travanj: "tra",
    svibanj: "svi",
    lipanj: "lip",
    srpanj: "srp",
    kolovoz: "kol",
    rujan: "ruj",
    listopad: "lis",
    studeni: "stu",
    prosinac: "pro",
  };
  const shortMonth = map[month.toLowerCase()] ?? month.slice(0, 3);
  return `${shortMonth} ${year}`;
}

export function getCollectionData(stats: Stats | undefined): CollectionDataItem[] {
  return (
    stats?.monthlyCollections?.map((m) => ({
      month: toShortMonthLabel(m.month),
      zaduzeno: m.charged,
      uplaceno: m.paid,
    })) ?? []
  );
}

export type ExpenseStructureItem = { legendKey: string; name: string; value: number; color: string };

const EXPENSE_COLOR_MAP: Record<string, string> = {
  odrzavanje: "hsl(var(--primary))",
  komunalije: "hsl(var(--info))",
  zajednicke_usluge: "hsl(var(--warning))",
  osiguranje: "hsl(var(--success))",
};

export function getExpenseStructure(stats: Stats | undefined): ExpenseStructureItem[] {
  return (
    stats?.expenseBreakdown?.map((e) => ({
      legendKey: e.key ?? "other",
      name: e.label ?? "Ostalo",
      value: Number(e.value) || 0,
      color: EXPENSE_COLOR_MAP[e.key] ?? "hsl(var(--muted-foreground))",
    })) ?? []
  );
}

export type CashFlowItem = { building: string; amount: number };

export function getCashFlowData(stats: Stats | undefined): CashFlowItem[] {
  return (
    stats?.topBuildings?.map((b) => ({
      building: b.building ?? "",
      amount: Number(b.amount) || 0,
    })) ?? []
  );
}

export type PortfolioItem = { label: string; value: number | string | undefined; helper?: string };

export function getPortfolioOverview(stats: Stats | undefined, formatNumberFn: (v?: number) => string): PortfolioItem[] {
  return [
    { label: "Gradovi", value: formatNumberFn(stats?.cityCount ?? 0) },
    { label: "Zgrade", value: formatNumberFn(stats?.buildingCount ?? 0) },
    { label: "Stanovi", value: formatNumberFn(stats?.apartmentCount ?? 0) },
  ];
}

export const EXPENSE_CHART_CONFIG = {
  odrzavanje: { label: "Održavanje", color: "hsl(var(--primary))" },
  komunalije: { label: "Komunalije", color: "hsl(var(--info))" },
  zajednicke_usluge: { label: "Zajedničke usluge", color: "hsl(var(--warning))" },
  osiguranje: { label: "Osiguranje", color: "hsl(var(--success))" },
  other: { label: "Ostalo", color: "hsl(var(--muted-foreground))" },
} as const;

export const COLLECTION_CHART_CONFIG = {
  zaduzeno: { label: "Zaduženo", color: "hsl(var(--primary))" },
  uplaceno: { label: "Uplaćeno", color: "hsl(var(--success))" },
} as const;

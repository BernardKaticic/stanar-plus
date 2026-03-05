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
  occupancyRate?: number;
  emptyUnits?: number;
  monthlyCollections?: { month: string; charged: number; paid: number }[];
  expenseBreakdown?: { key: string; label: string; value: number }[];
  topBuildings?: { building: string; amount: number }[];
};

export type StatCard = {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
};

export function getStatCards(
  stats: Stats | undefined,
  statsLoading: boolean,
  statsError: boolean,
  formatCurrencyFn: (v?: number) => string,
  hasDebtors: boolean
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
      title: "Ukupno zaduženo ove godine",
      value: statsLoading ? "..." : formatCurrencyFn(stats?.totalCharged),
      change: statsLoading ? "" : ((stats?.upcomingCharges ?? 0) > 0 ? `Planirano ovaj mjesec ${formatCurrencyFn(stats?.upcomingCharges)}` : ""),
      changeType: "neutral",
    },
    {
      title: "Ukupno naplaćeno ove godine",
      value: statsLoading ? "..." : formatCurrencyFn(stats?.totalPaid),
      change: statsLoading ? "" : `Stopa naplate ${(stats?.collectionRate ?? 0).toFixed(1)}%`,
      changeType: "neutral",
    },
    {
      title: "Aktivna dugovanja",
      value: statsLoading ? "..." : formatCurrencyFn(stats?.outstandingBalance),
      change: statsLoading ? "" : (hasDebtors && (stats?.averageDaysOverdue ?? 0) > 0 ? `Prosječno kašnjenje ${stats?.averageDaysOverdue} dana` : ""),
      changeType: "negative",
    },
    {
      title: "Otvoreni radni nalozi",
      value: statsLoading ? "..." : `${stats?.openWorkOrders ?? 0}`,
      change: statsLoading ? "" : `Hitni nalozi ${stats?.urgentWorkOrders ?? 0}`,
      changeType: "neutral",
    },
  ];
}

export type CollectionDataItem = { month: string; zaduzeno: number; uplaceno: number };

export function getCollectionData(stats: Stats | undefined): CollectionDataItem[] {
  return (
    stats?.monthlyCollections?.map((m) => ({
      month: m.month,
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
    { label: "Zgrade", value: stats?.buildingCount, helper: `Gradovi ${formatNumberFn(stats?.cityCount ?? 0)}` },
    { label: "Stanovi", value: stats?.apartmentCount, helper: `Stanara ${formatNumberFn(stats?.tenantCount ?? 0)}` },
    { label: "Popunjenost", value: stats?.occupancyRate ? `${stats.occupancyRate}%` : "0%", helper: `Praznih ${formatNumberFn(stats?.emptyUnits ?? 0)}` },
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

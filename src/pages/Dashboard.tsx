import type { CSSProperties } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { 
  AlertCircle, 
  Calendar,
  Activity,
  ArrowUpRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useDashboardStats, useDashboardActivities, useDashboardDebtors } from "@/hooks/useDashboardData";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid } from "recharts";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartLegend, 
  ChartLegendContent,
  type ChartConfig 
} from '@/components/ui/chart';

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activities, isLoading: activitiesLoading } = useDashboardActivities();
  const { data: debtors, isLoading: debtorsLoading } = useDashboardDebtors();

  const formatCurrency = (value?: number) => {
    if (typeof value !== "number") {
      return "0,00 €";
    }
    return value.toLocaleString("hr-HR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    });
  };

  const formatNumber = (value?: number) => {
    if (typeof value !== "number") {
      return "0";
    }
    return value.toLocaleString("hr-HR");
  };

  const statCards = [
    {
      title: "Ukupno zaduženo ove godine",
      value: statsLoading ? "..." : formatCurrency(stats?.totalCharged),
      change: statsLoading ? "" : `Planirano ovaj mjesec ${formatCurrency(stats?.upcomingCharges)}`,
      changeType: "neutral" as const,
      icon: null,
    },
    {
      title: "Ukupno naplaćeno ove godine",
      value: statsLoading ? "..." : formatCurrency(stats?.totalPaid),
      change: statsLoading ? "" : `Stopa naplate ${(stats?.collectionRate ?? 0).toFixed(1)}%`,
      changeType: "neutral" as const,
      icon: null,
    },
    {
      title: "Aktivna dugovanja",
      value: statsLoading ? "..." : formatCurrency(stats?.outstandingBalance),
      change: statsLoading ? "" : `Prosječno kašnjenje ${stats?.averageDaysOverdue ?? 0} dana`,
      changeType: "negative" as const,
      icon: null,
    },
    {
      title: "Otvoreni radni nalozi",
      value: statsLoading ? "..." : `${stats?.openWorkOrders ?? 0}`,
      change: statsLoading ? "" : `Hitni nalozi ${stats?.urgentWorkOrders ?? 0}`,
      changeType: "neutral" as const,
      icon: null,
    },
  ];

  const quickActions = [
    { 
      label: "Nova uplatnica", 
      helper: "Zaduži zgrade za odabrani period",
      to: "/payment-slips",
    },
    { 
      label: "Nova opomena", 
      helper: "Pošalji opomene dužnicima u kašnjenju",
      to: "/debtors",
    },
    { 
      label: "Uvoz izvatka", 
      helper: "Upari uplate s bankovnim izvatkom",
      to: "/account-statement",
    },
    { 
      label: "Novi radni nalog", 
      helper: "Evidentiraj servis ili intervenciju",
      to: "/work-orders",
    },
  ];

  const portfolioOverview = [
    {
      label: "Zgrade",
      value: stats?.buildingCount,
      helper: `Gradovi ${formatNumber(stats?.cityCount ?? 0)}`,
    },
    {
      label: "Stanovi",
      value: stats?.apartmentCount,
      helper: `Stanara ${formatNumber(stats?.tenantCount ?? 0)}`,
    },
    {
      label: "Popunjenost",
      value: stats?.occupancyRate ? `${stats.occupancyRate}%` : "0%",
      helper: `Praznih ${formatNumber(stats?.emptyUnits ?? 0)}`,
    },
  ];

  // Chart data - Naplata po mjesecima
  const collectionData = [
    { month: "Sij", zaduzeno: 45000, uplaceno: 42000 },
    { month: "Velj", zaduzeno: 45200, uplaceno: 43500 },
    { month: "Ožu", zaduzeno: 45500, uplaceno: 44200 },
    { month: "Tra", zaduzeno: 46000, uplaceno: 45100 },
    { month: "Svi", zaduzeno: 46200, uplaceno: 44800 },
    { month: "Lip", zaduzeno: 46400, uplaceno: 43900 },
  ];

  // Chart data - Struktura troška
  const expenseStructure = [
    { legendKey: "odrzavanje", name: "Održavanje", value: 18500, color: "hsl(var(--primary))" },
    { legendKey: "komunalije", name: "Komunalije", value: 13200, color: "hsl(var(--info))" },
    { legendKey: "zajednicke_usluge", name: "Zajedničke usluge", value: 9800, color: "hsl(var(--warning))" },
    { legendKey: "osiguranje", name: "Osiguranje", value: 5600, color: "hsl(var(--success))" },
  ];

  // Chart data - Tok novca po zgradama (top 5)
  const cashFlowData = [
    { building: "Starčevića 15", amount: 12500, previousMonth: 11800 },
    { building: "Ohridska 7", amount: 9800, previousMonth: 9600 },
    { building: "Strossmayera 22", amount: 8900, previousMonth: 8700 },
    { building: "Trg kralja 12", amount: 7600, previousMonth: 7850 },
    { building: "Starčevića 23A", amount: 6200, previousMonth: 6400 },
  ];

  const expenseChartConfig: ChartConfig = {
    odrzavanje: { label: "Održavanje", color: "hsl(var(--primary))" },
    komunalije: { label: "Komunalije", color: "hsl(var(--info))" },
    zajednicke_usluge: { label: "Zajedničke usluge", color: "hsl(var(--warning))" },
    osiguranje: { label: "Osiguranje", color: "hsl(var(--success))" },
  };

  const collectionLabels: Record<string, string> = {
    zaduzeno: "Zaduženo",
    uplaceno: "Uplaćeno",
  };

  const renderCollectionTooltipItem = (rawValue: number | string, dataKey?: string) => {
    const key = dataKey && collectionLabels[dataKey] ? dataKey : "zaduzeno";
    const label = collectionLabels[key];
    const numericValue = typeof rawValue === "number" ? rawValue : Number(rawValue);
    const safeValue = Number.isFinite(numericValue) ? numericValue : 0;

    return (
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: `var(--color-${key})` } as CSSProperties}
          />
          <span className="text-muted-foreground">{label}</span>
        </div>
        <span className="font-mono font-medium text-foreground">
          {formatCurrency(safeValue)}
        </span>
      </div>
    );
  };

  const expenseLabels = expenseStructure.reduce<Record<string, string>>((acc, item) => {
    acc[item.legendKey] = item.name;
    return acc;
  }, {});

  const renderExpenseTooltipItem = (rawValue: number | string, legendKey?: string) => {
    const fallbackKey = expenseStructure[0]?.legendKey ?? "";
    const key = legendKey && expenseLabels[legendKey] ? legendKey : fallbackKey;
    const label = expenseLabels[key] ?? "Kategorija";
    const numericValue = typeof rawValue === "number" ? rawValue : Number(rawValue);
    const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
    const indicatorStyle: CSSProperties =
      key !== "" ? { backgroundColor: `var(--color-${key})` } : { backgroundColor: "hsl(var(--border))" };

    return (
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm" style={indicatorStyle} />
          <span className="text-muted-foreground">{label}</span>
        </div>
        <span className="font-mono font-medium text-foreground">
          {formatCurrency(safeValue)}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Nadzorna ploča</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Pregled ključnih podataka i aktivnosti
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Posljednje ažuriranje: Danas, 14:32</span>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4 sm:space-y-6">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">Nedavne aktivnosti</h2>
            </div>
            <div className="space-y-4">
              {activitiesLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3 pb-4">
                      <Skeleton className="h-2 w-2 rounded-full mt-1" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </>
              ) : activities && activities.length > 0 ? (
                activities.slice(0, 6).map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 pb-4 border-b last:border-0">
                    <div
                      className={`mt-0.5 h-2 w-2 rounded-full ${
                        activity.status === "success"
                          ? "bg-success"
                          : activity.status === "warning"
                          ? "bg-warning"
                          : "bg-info"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={Activity}
                  title="Nema nedavnih aktivnosti"
                  description="Aktivnosti će se prikazati kada počnete koristiti sustav"
                />
              )}
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="space-y-6">
              <div className="flex items-center">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <div className="h-1 w-8 bg-gradient-to-r from-primary to-success rounded-full" />
                  Naplata po mjesecima
                </h3>
              </div>
              <ChartContainer 
                config={{
                  zaduzeno: {
                    label: "Zaduženo",
                    color: "hsl(var(--primary))",
                  },
                  uplaceno: {
                    label: "Uplaćeno",
                    color: "hsl(var(--success))",
                  },
                } satisfies ChartConfig}
                className="h-[320px] w-full"
              >
                <BarChart 
                  data={collectionData}
                  margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="zaduzeno" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="uplaceno" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={13}
                    fontWeight={500}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip 
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.15 }}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, name) => renderCollectionTooltipItem(value as number | string, name as string)}
                      />
                    }
                  />
                  <Bar 
                    dataKey="zaduzeno" 
                    fill="url(#zaduzeno)" 
                    radius={[8, 8, 0, 0]}
                    maxBarSize={60}
                    animationDuration={800}
                    animationBegin={0}
                  />
                  <Bar 
                    dataKey="uplaceno" 
                    fill="url(#uplaceno)" 
                    radius={[8, 8, 0, 0]}
                    maxBarSize={60}
                    animationDuration={800}
                    animationBegin={100}
                  />
                </BarChart>
              </ChartContainer>
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "hsl(var(--primary))" } as CSSProperties} />
                  <span>Zaduženo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "hsl(var(--success))" } as CSSProperties} />
                  <span>Uplaćeno</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent pointer-events-none" />
            <div className="relative space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <div className="h-1 w-8 bg-gradient-to-r from-primary via-info to-warning rounded-full" />
                  Struktura troškova
                </h3>
                <Badge variant="outline" className="bg-background/70 text-foreground border-border/60">
                  Top kategorije
                </Badge>
              </div>
              <ChartContainer config={expenseChartConfig} className="h-[320px] w-full">
                <PieChart>
                  <defs>
                    {expenseStructure.map((entry, index) => (
                      <filter key={`shadow-${index}`} id={`shadow-${entry.name}`} height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
                      </filter>
                    ))}
                  </defs>
                  <Pie
                    data={expenseStructure}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    animationDuration={1000}
                    animationBegin={0}
                    style={{ fontSize: '13px', fontWeight: 500 }}
                  >
                    {expenseStructure.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                <ChartTooltip 
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.15 }}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, name, item) =>
                        renderExpenseTooltipItem(
                          value as number | string,
                          (item?.payload as { legendKey?: string })?.legendKey ?? (name as string | undefined),
                        )
                      }
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent nameKey="legendKey" />} />
                </PieChart>
              </ChartContainer>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-info/5 to-transparent pointer-events-none" />
            <div className="relative space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <div className="h-1 w-8 bg-gradient-to-r from-primary to-primary/60 rounded-full" />
                  Top 5 zgrada po pričuvi
                </h3>
                <span className="text-xs text-muted-foreground sm:text-sm">Usporedba posljednjeg mjeseca</span>
              </div>
              <ChartContainer 
                config={{
                  amount: {
                    label: "Pričuva",
                    color: "hsl(var(--primary))",
                  },
                } satisfies ChartConfig}
                className="h-[280px] w-full"
              >
                <BarChart 
                  data={cashFlowData} 
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="amountGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
                  <XAxis 
                    type="number" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    dataKey="building" 
                    type="category" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    width={130}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip 
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }}
                    content={<ChartTooltipContent 
                      formatter={(value: number) => `${value.toLocaleString('hr-HR')} €`}
                    />}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="url(#amountGradient)" 
                    radius={[0, 8, 8, 0]}
                    maxBarSize={32}
                    animationDuration={800}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </Card>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Pregled portfelja</h3>
            {statsLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2 rounded-lg border p-3">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {portfolioOverview.map((item) => (
                  <div key={item.label} className="space-y-1.5 rounded-lg border p-3">
                    <p
                      className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate"
                      title={item.label}
                    >
                      {item.label}
                    </p>
                    <p className="text-lg font-semibold leading-tight">
                      {typeof item.value === "number" ? formatNumber(item.value) : item.value}
                    </p>
                    {item.helper && (
                      <p className="text-xs text-muted-foreground truncate" title={item.helper}>
                        {item.helper}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Brze akcije</h3>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="secondary"
                  className="w-full justify-between items-start min-h-[56px] py-3"
                  onClick={() => navigate(action.to)}
                >
                  <div className="text-left">
                    <p className="font-semibold leading-tight">{action.label}</p>
                    <p className="text-xs mt-1 text-muted-foreground">
                      {action.helper}
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold">Najnovija dugovanja</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Ukupno otvoreno {statsLoading ? "..." : formatCurrency(stats?.outstandingBalance)}
                </p>
              </div>
              {!statsLoading && (
                <Badge variant="destructive" className="whitespace-nowrap">
                  {stats?.averageDaysOverdue ?? 0} dana u prosjeku
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              {debtorsLoading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg border p-3 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                ))
              ) : debtors && debtors.length > 0 ? (
                debtors.slice(0, 5).map((debt) => (
                  <div key={debt.name} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold leading-tight">{debt.name}</p>
                        {debt.location && (
                          <p className="text-xs text-muted-foreground">{debt.location}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{debt.months}</p>
                      </div>
                      <span className="text-sm font-semibold text-destructive">{debt.amount}</span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={AlertCircle}
                  title="Nema dužnika"
                  description="Svi stanari su uredni s plaćanjem"
                  className="py-6"
                />
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4 min-h-[44px]"
              onClick={() => navigate("/debtors")}
            >
              Vidi sve dužnike
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

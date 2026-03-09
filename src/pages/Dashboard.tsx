import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useDashboardStats, useDashboardActivities, useDashboardDebtors } from "@/hooks/useDashboardData";
import { useNavigate, Link } from "react-router-dom";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  formatCurrency,
  formatNumber,
  formatCurrencyShort,
  getStatCards,
  getCollectionData,
  getExpenseStructure,
  getCashFlowData,
  getPortfolioOverview,
  EXPENSE_CHART_CONFIG,
  COLLECTION_CHART_CONFIG,
  type Stats,
} from "@/lib/dashboardAdapters";

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading, isFetching: statsFetching, isError: statsError, refetch: refetchStats } = useDashboardStats();
  const { data: activities, isLoading: activitiesLoading, isError: activitiesError } = useDashboardActivities();
  const { data: debtors, isLoading: debtorsLoading, isError: debtorsError } = useDashboardDebtors();

  const hasDebtorsFromList = Boolean(debtors && debtors.length > 0);
  const hasDebtorsFromStats = (stats?.outstandingBalance ?? 0) > 0;
  const hasDebtors = hasDebtorsFromList || (debtorsLoading ? hasDebtorsFromStats : hasDebtorsFromList);

  const statCards = getStatCards(stats as Stats | undefined, statsLoading, !!statsError, formatCurrency, hasDebtors);
  const collectionData = getCollectionData(stats as Stats | undefined);
  const expenseStructure = getExpenseStructure(stats as Stats | undefined);
  const cashFlowData = getCashFlowData(stats as Stats | undefined);
  const portfolioOverview = getPortfolioOverview(stats as Stats | undefined, formatNumber);

  const collectionLabels: Record<string, string> = {
    zaduzeno: COLLECTION_CHART_CONFIG.zaduzeno.label,
    uplaceno: COLLECTION_CHART_CONFIG.uplaceno.label,
  };

  const renderCollectionTooltipItem = (rawValue: number | string, dataKey?: string) => {
    const key = dataKey && collectionLabels[dataKey] ? dataKey : "zaduzeno";
    const label = collectionLabels[key];
    const numericValue = typeof rawValue === "number" ? rawValue : Number(rawValue);
    const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
    return (
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: `var(--color-${key})` } as CSSProperties} />
          <span className="text-muted-foreground">{label}</span>
        </div>
        <span className="font-mono font-medium text-foreground">{formatCurrency(safeValue)}</span>
      </div>
    );
  };

  const expenseLabels = expenseStructure.reduce<Record<string, string>>((acc, item) => {
    acc[item.legendKey] = item.name;
    return acc;
  }, {});

  const renderExpenseTooltipItem = (rawValue: number | string, legendKey?: string) => {
    const safeKey = legendKey != null && String(legendKey).trim() !== "" ? legendKey : "other";
    const label = expenseLabels[safeKey] ?? EXPENSE_CHART_CONFIG.other?.label ?? "Ostalo";
    const numericValue = typeof rawValue === "number" ? rawValue : Number(rawValue);
    const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
    const colorVar = Object.prototype.hasOwnProperty.call(EXPENSE_CHART_CONFIG, safeKey)
      ? `var(--color-${safeKey})`
      : "hsl(var(--border))";
    return (
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colorVar } as CSSProperties} />
          <span className="text-muted-foreground">{label}</span>
        </div>
        <span className="font-mono font-medium text-foreground">{formatCurrency(safeValue)}</span>
      </div>
    );
  };

  const quickActions = [
    { 
      label: "Nova uplatnica", 
      helper: "Zaduži zgrade za odabrani period",
      to: "/payment-slips",
    },
    { 
      label: "Dužnici", 
      helper: "Pregled i opomene dužnicima",
      to: "/debtors",
    },
    { 
      label: "Novi radni nalog", 
      helper: "Evidentiraj servis ili intervenciju",
      to: "/work-orders",
    },
    { 
      label: "Zgrade", 
      helper: "Dodaj grad, ulicu, zgradu",
      to: "/buildings",
    },
  ];

  return (
    <div className="page animate-fade-in">
      <header className="page-header">
        <div className="flex items-center gap-2">
          <h1 className="page-title">Nadzorna ploča</h1>
          {statsFetching && !statsLoading && (
            <span className="inline-flex h-2 w-2 rounded-full bg-primary/60 animate-pulse" aria-hidden />
          )}
        </div>
      </header>

      {statsError && (
        <EmptyState
          title="Neuspješno učitavanje statistike"
          action={{
            label: "Pokušaj ponovno",
            onClick: () => refetchStats(),
          }}
          className="py-6"
        />
      )}
      <div className="page-kpi">
        {statCards.map((stat, idx) => {
          const isCritical = stat.title === "Aktivna dugovanja";
          return (
            <div
              key={stat.title}
              className={`page-kpi-card animate-fade-in-up ${isCritical ? "border-l-4 border-l-destructive bg-destructive/5" : ""}`}
              style={{ animationDelay: `${Math.min(idx * 50, 150)}ms` }}
            >
              <p className="page-kpi-label">{stat.title}</p>
              {statsLoading ? (
                <Skeleton className="h-7 w-20 mt-2" />
              ) : (
                <p className={`page-kpi-value ${isCritical ? "text-destructive" : ""}`}>{stat.value}</p>
              )}
              {!statsError && stat.change && !statsLoading && (
                <p className={`mt-1 text-xs font-medium ${
                  (stat.changeType as string) === "positive" ? "text-success" :
                  stat.changeType === "negative" ? "text-destructive" : "text-muted-foreground"
                }`}>
                  {stat.change}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4 sm:space-y-6">
          <Card className="transition-all duration-200 hover:shadow-sm rounded-md">
            <CardHeader>
              <CardTitle className="text-lg">Nedavne aktivnosti</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="space-y-4">
              {activitiesError ? (
                <EmptyState title="Greška u učitavanju" className="py-8" />
              ) : activitiesLoading ? (
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
                  <div key={i} className="flex items-start gap-3 pb-4 border-b last:border-0 animate-fade-in-up" style={{ animationDelay: `${Math.min(i * 40, 120)}ms` }}>
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
                <EmptyState title="Nema nedavnih aktivnosti" />
              )}
            </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-sm rounded-md">
            <CardHeader>
              <CardTitle className="text-lg">Naplata po mjesecima</CardTitle>
            </CardHeader>
            <CardContent>
            {statsError ? (
              <EmptyState title="Greška u učitavanju" className="py-12" />
            ) : collectionData.length === 0 ? (
              <EmptyState title="Nema podataka za graf" className="py-12" />
            ) : (
            <div className="space-y-6">
              <ChartContainer
                config={COLLECTION_CHART_CONFIG as ChartConfig}
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
                    tickFormatter={(value) => formatCurrencyShort(Number(value))}
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
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "var(--color-zaduzeno)" } as CSSProperties} />
                  <span>Zaduženo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "var(--color-uplaceno)" } as CSSProperties} />
                  <span>Uplaćeno</span>
                </div>
              </div>
            </div>
            )}
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-sm rounded-md">
            <CardHeader>
              <CardTitle className="text-lg">Struktura troškova</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {statsError ? (
                <EmptyState title="Greška u učitavanju" className="py-12" />
              ) : expenseStructure.length === 0 ? (
                <EmptyState title="Nema podataka" className="py-12" />
              ) : (
              <ChartContainer config={EXPENSE_CHART_CONFIG as ChartConfig} className="h-[320px] w-full">
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
              )}
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-sm rounded-md">
            <CardHeader>
              <CardTitle className="text-lg">Top 5 zgrada po pričuvi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {statsError ? (
              <EmptyState title="Greška u učitavanju" className="py-12" />
            ) : cashFlowData.length === 0 ? (
              <EmptyState title="Nema podataka" className="py-12" />
              ) : (
              <div className="min-w-0 w-full overflow-x-auto">
              <ChartContainer
                config={{ amount: { label: "Pričuva", color: "hsl(var(--primary))" } } as ChartConfig}
                className="h-[280px] w-full min-h-[280px]"
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
                    tickFormatter={(value) => formatCurrencyShort(Number(value))}
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
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.15 }}
                    content={<ChartTooltipContent formatter={(value: number) => formatCurrency(Number(value))} />}
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
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <Card className="transition-all duration-200 hover:shadow-sm rounded-md">
            <CardHeader>
              <CardTitle className="text-lg">Pregled portfelja</CardTitle>
            </CardHeader>
            <CardContent>
            {statsError ? (
              <EmptyState title="Greška u učitavanju" className="py-8" />
            ) : statsLoading ? (
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
                {portfolioOverview.map((item, idx) => (
                  <div key={item.label} className="space-y-1.5 rounded-lg border p-3 animate-fade-in-up transition-colors duration-150 hover:bg-muted/30" style={{ animationDelay: `${Math.min(idx * 40, 120)}ms` }}>
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
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-sm rounded-md">
            <CardHeader>
              <CardTitle className="text-lg">Brze akcije</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="space-y-2">
              {quickActions.map((action, idx) => (
                <Button
                  key={action.label}
                  variant="secondary"
                  className="w-full justify-between h-auto py-2.5 px-3 transition-colors duration-150 animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(idx * 50, 150)}ms` }}
                  onClick={() => navigate(action.to)}
                >
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight">{action.label}</p>
                    <p className="text-xs mt-0.5 text-muted-foreground truncate">
                      {action.helper}
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 ml-2" />
                </Button>
              ))}
            </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-sm rounded-md">
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-lg">Najnovija dugovanja</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ukupno otvoreno {statsLoading ? "..." : formatCurrency(stats?.outstandingBalance)}
                  </p>
                </div>
                {!statsLoading && hasDebtors && (stats?.averageDaysOverdue ?? 0) > 0 && (
                  <Badge variant="destructive" className="whitespace-nowrap shrink-0">
                    {stats?.averageDaysOverdue} dana u prosjeku
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
            <div className="space-y-3">
              {debtorsError ? (
                <EmptyState title="Greška u učitavanju" className="py-6" />
              ) : debtorsLoading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg border p-3 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                ))
              ) : debtors && debtors.length > 0 ? (
                debtors.slice(0, 5).map((debt, idx) => {
                  const stableKey = debt.id ?? `debt-${String(debt.name)}-${String(debt.location ?? "")}`;
                  const content = (
                    <>
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
                    </>
                  );
                  const wrapperClass = "block rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring animate-fade-in-up";
                  const style = { animationDelay: `${Math.min(idx * 40, 120)}ms` };
                  return debt.id ? (
                    <Link
                      key={stableKey}
                      to={`/persons/${debt.id}`}
                      state={{ from: "/" }}
                      className={wrapperClass}
                      style={style}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={stableKey} className={`rounded-lg border p-3 animate-fade-in-up`} style={style}>
                      {content}
                    </div>
                  );
                })
              ) : (
                <EmptyState title="Nema dužnika" className="py-6" />
              )}
            </div>
            {debtors && debtors.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => navigate("/debtors")}
              >
                Vidi sve dužnike
              </Button>
            )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

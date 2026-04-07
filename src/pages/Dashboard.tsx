import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardStats, useDashboardActivities, useDashboardDebtors } from "@/hooks/useDashboardData";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  formatCurrency,
  formatNumber,
  formatCurrencyShort,
  getStatCards,
  getCollectionData,
  getCashFlowData,
  getPortfolioOverview,
  COLLECTION_CHART_CONFIG,
  type Stats,
} from "@/lib/dashboardAdapters";

function toErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "Provjeri backend servis i osvježi stranicu.";
  const err = error as { body?: { message?: string }; message?: string; status?: number };
  if (err.body?.message) return err.body.message;
  if (err.message) return err.message;
  if (typeof err.status === "number") return `HTTP ${err.status}`;
  return "Provjeri backend servis i osvježi stranicu.";
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [period, setPeriod] = useState<"ytd" | "last12m">("ytd");
  const dashboardPrefsKey = useMemo(
    () => `dashboard:v2:${userRole || "anon"}`,
    [userRole]
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(dashboardPrefsKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { period?: "ytd" | "last12m" };
      if (parsed.period === "ytd" || parsed.period === "last12m") setPeriod(parsed.period);
    } catch {
      // ignore corrupted preference payload
    }
  }, [dashboardPrefsKey]);

  useEffect(() => {
    localStorage.setItem(
      dashboardPrefsKey,
      JSON.stringify({ period })
    );
  }, [dashboardPrefsKey, period]);
  const {
    data: stats,
    isLoading: statsLoading,
    isFetching: statsFetching,
    isError: statsError,
    error: statsErrorDetails,
    refetch: refetchStats,
  } = useDashboardStats(period);
  const { data: activities, isLoading: activitiesLoading, isError: activitiesError } = useDashboardActivities();
  const { data: debtors, isLoading: debtorsLoading, isError: debtorsError } = useDashboardDebtors();

  const hasDebtorsFromList = Boolean(debtors && debtors.length > 0);
  const hasDebtorsFromStats = (stats?.outstandingBalance ?? 0) > 0;
  const hasDebtors = hasDebtorsFromList || (debtorsLoading ? hasDebtorsFromStats : hasDebtorsFromList);

  const periodLabel = stats?.periodLabel || (period === "last12m" ? "zadnjih 12 mjeseci" : "ove godine");
  const statCards = getStatCards(stats as Stats | undefined, statsLoading, !!statsError, formatCurrency, hasDebtors, periodLabel);
  const collectionData = getCollectionData(stats as Stats | undefined);
  const cashFlowData = getCashFlowData(stats as Stats | undefined);
  const portfolioOverview = getPortfolioOverview(stats as Stats | undefined, formatNumber);
  const hasCollectionData = collectionData.length > 0;
  const hasTopBuildingsData = cashFlowData.some((item) => Number(item.amount || 0) > 0);
  const hasActivitiesData = Boolean(activities && activities.length > 0);

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

  const formatBuildingTick = (value: string) => {
    const text = String(value || "");
    const max = 18;
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
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
        <div className="flex w-full flex-col gap-3">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h1 className="page-title">Nadzorna ploča</h1>
              {statsFetching && !statsLoading && (
                <span className="inline-flex h-2 w-2 rounded-full bg-primary/60 animate-pulse" aria-hidden />
              )}
            </div>
            <div className="w-full sm:w-[260px]">
              <Select value={period} onValueChange={(value) => setPeriod(value as "ytd" | "last12m")}>
                <SelectTrigger aria-label="Odabir razdoblja izvještaja">
                  <SelectValue placeholder="Odaberi period" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="ytd">Tekuća godina (od 1.1.)</SelectItem>
                <SelectItem value="last12m">Posljednjih 12 mjeseci</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      {statsError && (
        <EmptyState
          title="Neuspješno učitavanje statistike"
          description={toErrorMessage(statsErrorDetails)}
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
              className={`page-kpi-card animate-fade-in-up rounded-lg border border-border/70 shadow-sm ${isCritical ? "border-l-4 border-l-destructive bg-destructive/5" : ""} ${stat.drillTo ? "cursor-pointer transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" : ""}`}
              style={{ animationDelay: `${Math.min(idx * 50, 150)}ms` }}
              onClick={() => {
                if (!statsLoading && stat.drillTo) navigate(stat.drillTo);
              }}
              role={stat.drillTo ? "button" : undefined}
              tabIndex={stat.drillTo ? 0 : undefined}
              onKeyDown={(e) => {
                if (!stat.drillTo || statsLoading) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(stat.drillTo);
                }
              }}
            >
              <p className="page-kpi-label text-[12px] md:text-[13px]">{stat.title}</p>
              {statsLoading ? (
                <Skeleton className="h-7 w-20 mt-2" />
              ) : (
                <p className={`page-kpi-value tracking-tight ${isCritical ? "text-destructive" : ""}`}>{stat.value}</p>
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
          <Card className="rounded-lg border border-border/70 shadow-sm transition-shadow duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Nedavne aktivnosti</CardTitle>
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
              ) : hasActivitiesData ? (
                activities.slice(0, 6).map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 pb-3 sm:pb-4 border-b last:border-0 animate-fade-in-up" style={{ animationDelay: `${Math.min(i * 40, 120)}ms` }}>
                    <div
                      className={`mt-0.5 h-2.5 w-2.5 rounded-full ring-2 ${
                        activity.status === "success"
                          ? "bg-success/90 ring-success/20"
                          : activity.status === "warning"
                          ? "bg-warning/90 ring-warning/25"
                          : "bg-info/90 ring-info/25"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-snug">{activity.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Trenutno nema novijih aktivnosti.
                </div>
              )}
            </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-border/70 shadow-sm transition-shadow duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Zaduženje i naplata po mjesecima</CardTitle>
            </CardHeader>
            <CardContent>
            {statsError ? (
              <EmptyState title="Greška u učitavanju" className="py-12" />
            ) : !hasCollectionData ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Nema dovoljno podataka za prikaz trenda naplate.
              </div>
            ) : (
            <div className="space-y-6">
              <ChartContainer
                config={COLLECTION_CHART_CONFIG as ChartConfig}
                className="h-[280px] sm:h-[320px] w-full"
              >
                <BarChart 
                  data={collectionData}
                  margin={{ top: 16, right: 8, left: 4, bottom: 12 }}
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
                    tickMargin={8}
                    minTickGap={20}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickMargin={8}
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
              <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] sm:text-xs text-muted-foreground">
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

          {hasTopBuildingsData && (
          <Card className="rounded-lg border border-border/70 shadow-sm transition-shadow duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Top 5 zgrada po pričuvi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {statsError ? (
              <EmptyState title="Greška u učitavanju" className="py-12" />
            ) : !hasTopBuildingsData ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Nema dovoljno podataka za usporedbu zgrada.
              </div>
              ) : (
              <div className="min-w-0 w-full overflow-x-auto">
              <ChartContainer
                config={{ amount: { label: "Pričuva", color: "hsl(var(--primary))" } } as ChartConfig}
                className="h-[240px] sm:h-[280px] w-full min-h-[240px] sm:min-h-[280px]"
              >
                <BarChart 
                  data={cashFlowData} 
                  layout="vertical"
                  margin={{ top: 8, right: 18, left: 4, bottom: 8 }}
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
                    tickMargin={8}
                    tickFormatter={(value) => formatCurrencyShort(Number(value))}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    dataKey="building" 
                    type="category" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickMargin={8}
                    width={130}
                    tickFormatter={formatBuildingTick}
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
          )}

        </div>

        <div className="space-y-4 sm:space-y-6">
          <Card className="rounded-lg border border-border/70 shadow-sm transition-shadow duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Pregled portfelja</CardTitle>
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
                  <div key={item.label} className="space-y-2 rounded-lg border border-border/70 p-3.5 animate-fade-in-up transition-colors duration-150 hover:bg-muted/30" style={{ animationDelay: `${Math.min(idx * 40, 120)}ms` }}>
                    <p
                      className="text-sm font-medium text-muted-foreground truncate"
                      title={item.label}
                    >
                      {item.label}
                    </p>
                    <p className="text-xl font-semibold leading-tight tracking-tight">
                      {typeof item.value === "number" ? formatNumber(item.value) : item.value}
                    </p>
                    {item.helper && (
                      <p className="text-sm text-muted-foreground truncate" title={item.helper}>
                        {item.helper}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-border/70 shadow-sm transition-shadow duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Brze akcije</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="space-y-2">
              {quickActions.map((action, idx) => (
                <Button
                  key={action.label}
                  variant="secondary"
                  className="w-full justify-between h-auto rounded-lg py-3 px-3.5 transition-colors duration-150 animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(idx * 50, 150)}ms` }}
                  onClick={() => navigate(action.to)}
                >
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight">{action.label}</p>
                    <p className="text-[11px] sm:text-xs mt-0.5 text-muted-foreground truncate">
                      {action.helper}
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 ml-2" />
                </Button>
              ))}
            </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-border/70 shadow-sm transition-shadow duration-200 hover:shadow-md">
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">Najnovija dugovanja</CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
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
                    <div key={i} className="rounded-lg border p-2.5 sm:p-3 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                ))
              ) : debtors && debtors.length > 0 ? (
                debtors.slice(0, 5).map((debt, idx) => {
                  const stableKey = `${debt.id ?? `debt-${String(debt.name)}-${String(debt.location ?? "")}`}-${idx}`;
                  const content = (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold leading-tight">{debt.name}</p>
                          {debt.location && (
                            <p className="text-xs text-muted-foreground">{debt.location}</p>
                          )}
                          <p className="text-sm text-muted-foreground">{debt.months}</p>
                        </div>
                        <span className="text-base font-semibold text-destructive">{debt.amount}</span>
                      </div>
                    </>
                  );
                  const wrapperClass = "block rounded-lg border p-2.5 sm:p-3 cursor-pointer hover:bg-muted/50 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring animate-fade-in-up";
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
                    <div key={stableKey} className={`rounded-lg border p-2.5 sm:p-3 animate-fade-in-up`} style={style}>
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

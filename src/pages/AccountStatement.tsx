import { Wallet, TrendingUp, TrendingDown, ArrowUpDown, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Area } from "recharts";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartLegend, 
  ChartLegendContent,
  type ChartConfig 
} from '@/components/ui/chart';

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";

const AccountStatement = () => {
  const { data: statement } = useQuery({
    queryKey: ["dashboard", "statement"],
    queryFn: () => dashboardApi.getStatement(),
  });

  const accountInfo = statement
    ? {
        currentBalance: statement.currentBalance,
        previousYearCarryover: statement.previousYearCarryover,
        totalCharged: statement.totalCharged,
        totalPaid: statement.totalPaid,
        totalExpenses: statement.totalExpenses,
      }
    : {
        currentBalance: "0,00 €",
        previousYearCarryover: "0,00 €",
        totalCharged: "0,00 €",
        totalPaid: "0,00 €",
        totalExpenses: "0,00 €",
      };

  const transactions = statement?.transactions ?? [];

  const balanceTrend: { month: string; stanje: number }[] = [];
  const expenseBreakdown: { name: string; value: number; color: string }[] = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Stanje računa</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Pregled financijskih transakcija i stanja
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button>
            Uvoz izvadka
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card className="p-4 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trenutno stanje</p>
              <p className="text-2xl font-bold text-primary">{accountInfo.currentBalance}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Donos</p>
          <p className="text-xl font-bold">{accountInfo.previousYearCarryover}</p>
          <p className="text-xs text-muted-foreground mt-1">iz 2024.</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Ukupno zaduženo</p>
          <p className="text-xl font-bold text-success">{accountInfo.totalCharged}</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Ukupni troškovi</p>
          <p className="text-xl font-bold text-destructive">{accountInfo.totalExpenses}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Nedavne transakcije</h2>
            <Button variant="outline" size="sm" className="min-h-[32px]">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Filtriraj
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-medium">Datum</TableHead>
                  <TableHead className="text-xs font-medium">Tip</TableHead>
                  <TableHead className="text-xs font-medium">Opis</TableHead>
                  <TableHead className="text-right text-xs font-medium">Iznos</TableHead>
                  <TableHead className="text-right text-xs font-medium">Stanje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <Wallet className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Nema transakcija za prikaz
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm">{transaction.date}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant={transaction.type === "uplata" ? "default" : "secondary"}>
                        {transaction.type === "uplata" ? "Uplata" : "Trošak"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{transaction.description}</TableCell>
                    <TableCell className={`text-right text-xs font-semibold ${
                      transaction.amount.startsWith('-') ? 'text-destructive' : 'text-success'
                    }`}>
                      {transaction.amount}
                    </TableCell>
                    <TableCell className="text-right text-xs font-medium">
                      {transaction.balance}
                    </TableCell>
                  </TableRow>
                ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-4 sm:p-6">
            <h3 className="text-base font-semibold mb-4">Rekapitulacija prometa</h3>
            <div className="space-y-4">
              {statement && (() => {
                const parseNum = (s: string) => parseFloat(String(s || '0').replace(/\./g, '').replace(',', '.')) || 0;
                const charged = parseNum(statement.totalCharged);
                const paid = parseNum(statement.totalPaid);
                const rate = charged > 0 ? Math.min(100, (paid / charged) * 100) : 0;
                const remaining = Math.max(0, charged - paid);
                const remainingStr = remaining.toLocaleString('hr-HR', { minimumFractionDigits: 2 }) + ' €';
                return (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Naplata</span>
                  <span className="font-semibold">{rate.toFixed(1)}%</span>
                </div>
                <Progress value={rate} className="h-2" />
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ukupno zaduženo:</span>
                  <span className="font-semibold">{accountInfo.totalCharged}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ukupno uplaćeno:</span>
                  <span className="font-semibold text-success">{accountInfo.totalPaid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preostalo:</span>
                  <span className="font-semibold text-warning">{remainingStr}</span>
                </div>
              </div>
                );
              })()}
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <h3 className="text-base font-semibold mb-4">Brze akcije</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                Dodaj ručnu transakciju
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Uvoz bankovnog izvadka
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Generiraj izvještaj
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Trend stanja računa - LineChart */}
        <Card className="p-4 sm:p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <div className="relative">
            <h3 className="text-base font-semibold mb-6 flex items-center gap-2">
              <div className="h-1 w-8 bg-gradient-to-r from-primary to-success rounded-full" />
              Trend stanja računa
            </h3>
            <ChartContainer 
              config={{
                stanje: {
                  label: "Stanje",
                  color: "hsl(var(--primary))",
                },
              } satisfies ChartConfig}
              className="h-[320px] w-full"
            >
              <LineChart 
                data={balanceTrend}
                margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="areaStanje" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
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
                  cursor={false}
                  content={<ChartTooltipContent 
                    formatter={(value: number) => `${value.toLocaleString('hr-HR')} €`}
                  />}
                />
                <Area
                  type="monotone"
                  dataKey="stanje"
                  stroke="none"
                  fill="url(#areaStanje)"
                  animationDuration={1000}
                />
                <Line 
                  type="monotone" 
                  dataKey="stanje" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ 
                    fill: 'hsl(var(--primary))', 
                    strokeWidth: 2, 
                    stroke: 'hsl(var(--background))',
                    r: 6 
                  }}
                  activeDot={{ 
                    r: 8, 
                    fill: 'hsl(var(--background))',
                    stroke: 'hsl(var(--primary))',
                    strokeWidth: 4
                  }}
                  animationDuration={1000}
                  animationBegin={200}
                />
              </LineChart>
            </ChartContainer>
            )}
          </div>
        </Card>

        {/* Struktura troškova - PieChart */}
        <Card className="p-4 sm:p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent pointer-events-none" />
          <div className="relative">
            <h3 className="text-base font-semibold mb-6 flex items-center gap-2">
              <div className="h-1 w-8 bg-gradient-to-r from-primary via-warning to-info rounded-full" />
              Struktura troškova
            </h3>
            {expenseBreakdown.length === 0 ? (
              <EmptyState title="Nema podataka za strukturu troškova" description="Struktura troškova će se prikazati kada budu evidentirani" className="py-12" />
            ) : (
            <ChartContainer 
              config={{
                Komunalije: {
                  label: "Komunalije",
                  color: "hsl(var(--primary))",
                },
                Održavanje: {
                  label: "Održavanje",
                  color: "hsl(var(--info))",
                },
                Zajedničke_usluge: {
                  label: "Zajedničke usluge",
                  color: "hsl(var(--warning))",
                },
                Ostalo: {
                  label: "Ostalo",
                  color: "hsl(var(--success))",
                },
              } satisfies ChartConfig}
              className="h-[320px] w-full"
            >
              <PieChart>
                <defs>
                  {expenseBreakdown.map((entry, index) => (
                    <filter key={`shadow-exp-${index}`} id={`shadow-exp-${entry.name}`} height="200%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
                    </filter>
                  ))}
                </defs>
                <Pie
                  data={expenseBreakdown}
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
                  {expenseBreakdown.map((entry, index) => (
                    <Cell 
                      key={`cell-exp-${index}`} 
                      fill={entry.color}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    formatter={(value: number) => `${value.toLocaleString('hr-HR')} €`}
                  />}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AccountStatement;

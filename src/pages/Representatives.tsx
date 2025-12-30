import { UserCog, Plus, Mail, Phone, Building2, Euro, Search, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Representatives = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading] = useState(false);

  const allRepresentatives = [
    {
      id: 1,
      name: "Alerić Mato",
      building: "A.Starčevića 15",
      email: "aleric.mato@example.com",
      phone: "+385 91 123 4567",
      oib: "12345678901",
      iban: "HR9242485293857229485",
      monthlyIncome: "150,00 €",
      status: "active",
    },
    {
      id: 2,
      name: "Babić Ana",
      building: "Ohridska 7",
      email: "babic.ana@example.com",
      phone: "+385 92 234 5678",
      oib: "23456789012",
      iban: "HR1542485293857229486",
      monthlyIncome: "120,00 €",
      status: "active",
    },
    {
      id: 3,
      name: "Galić Mato",
      building: "J.J.Strossmayera 22",
      email: "galic.mato@example.com",
      phone: "+385 98 345 6789",
      oib: "34567890123",
      iban: "HR7642485293857229487",
      monthlyIncome: "180,00 €",
      status: "active",
    },
  ];

  // Apply search filter
  const representatives = searchTerm
    ? allRepresentatives.filter(rep =>
        rep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rep.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rep.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allRepresentatives;

  const totalMonthly = representatives.reduce((sum, rep) => {
    return sum + parseFloat(rep.monthlyIncome.replace(/[^\d,]/g, '').replace(',', '.'));
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Predstavnici suvlasnika</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Upravljanje predstavnicima zgrada i drugim dohotkom
          </p>
        </div>
        <Button className="min-h-[44px]">
          <Plus className="mr-2 h-4 w-4" />
          Dodaj predstavnika
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Ukupno predstavnika</p>
          <p className="text-2xl font-bold mt-1">{representatives.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Aktivni</p>
          <p className="text-2xl font-bold mt-1 text-success">
            {representatives.filter(r => r.status === 'active').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Mjesečni troškovi predstavnika</p>
          <p className="text-2xl font-bold mt-1 text-primary">
            {totalMonthly.toFixed(2).replace('.', ',')} €
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Isplaćeno ovaj mjesec</p>
          <p className="text-2xl font-bold mt-1">{totalMonthly.toFixed(2).replace('.', ',')} €</p>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Pretraži predstavnike..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="hidden sm:flex min-h-[44px]">
            <FileText className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Predstavnik</TableHead>
                <TableHead>Zgrada</TableHead>
                <TableHead>OIB</TableHead>
                <TableHead>Kontakt</TableHead>
                <TableHead>IBAN</TableHead>
                <TableHead className="text-right">Mjesečni dohodak</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </>
              ) : representatives.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    <EmptyState
                      icon={UserCog}
                      title="Nema predstavnika"
                      description="Dodajte prvog predstavnika klikom na gumb iznad"
                      action={
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Dodaj predstavnika
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                representatives.map((rep) => (
                <TableRow key={rep.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <UserCog className="h-5 w-5 text-primary" />
                      </div>
                      {rep.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {rep.building}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{rep.oib}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {rep.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {rep.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{rep.iban}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {rep.monthlyIncome}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Aktivan</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="min-h-[44px]">Uredi</Button>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </Card>
              ))}
            </>
          ) : representatives.length === 0 ? (
            <EmptyState
              icon={UserCog}
              title="Nema predstavnika"
              description="Dodajte prvog predstavnika klikom na gumb iznad"
              action={
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Dodaj predstavnika
                </Button>
              }
            />
          ) : (
            representatives.map((rep) => (
              <Card key={rep.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <UserCog className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{rep.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3" />
                        {rep.building}
                      </p>
                      <Badge variant="default" className="mt-2">Aktivan</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t">
                    <div>
                      <p className="text-muted-foreground text-xs">Mjesečni dohodak</p>
                      <p className="font-semibold text-base text-primary">{rep.monthlyIncome}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">OIB</p>
                      <p className="font-mono text-xs">{rep.oib}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs mb-1">Kontakt</p>
                      <div className="flex items-center gap-1 mb-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs truncate">{rep.email}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs">{rep.phone}</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">IBAN</p>
                      <p className="font-mono text-xs break-all">{rep.iban}</p>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full min-h-[44px]">
                    Uredi
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="text-xl font-semibold mb-4">Drugi dohodak</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Evidencija dodatnih periodičnih isplata (upravitelji, održavanje, čišćenje...)
        </p>

        <div className="space-y-3">
          {[
            { 
              name: "Košir Josip", 
              service: "Održavanje lifta", 
              frequency: "Mjesečno",
              amount: "200,00 €",
              iban: "HR8542485293857229490"
            },
            { 
              name: "Služba čišćenja d.o.o.", 
              service: "Čišćenje zajedničkih prostora", 
              frequency: "Mjesečno",
              amount: "450,00 €",
              iban: "HR2342485293857229491"
            },
            { 
              name: "Revizor Marko", 
              service: "Revizija financija", 
              frequency: "Godišnje",
              amount: "1.200,00 €",
              iban: "HR4542485293857229492"
            },
            { 
              name: "Servis dizala d.o.o.", 
              service: "Servis i provjera dizala", 
              frequency: "Polugodišnje",
              amount: "800,00 €",
              iban: "HR6742485293857229493"
            },
          ].map((income, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Euro className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{income.name}</p>
                    <p className="text-sm text-muted-foreground">{income.service}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-sm text-right">
                  <p className="text-muted-foreground">IBAN</p>
                  <p className="font-mono text-xs">{income.iban}</p>
                </div>
                <div className="text-sm text-right min-w-[120px]">
                  <Badge variant="outline" className="mb-1">{income.frequency}</Badge>
                  <p className="font-semibold text-lg">{income.amount}</p>
                </div>
                <Button variant="ghost" size="sm" className="min-h-[44px]">Uredi</Button>
              </div>
            </div>
          ))}
          
          <Button variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Dodaj novi dohodak
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Representatives;

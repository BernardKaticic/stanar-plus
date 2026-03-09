import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ScrollText, 
  Plus, 
  FileText, 
  Download, 
  Eye,
  Search,
  Filter,
  Building2,
  Calendar
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Info } from "lucide-react";

const Decisions = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [decisionStatusFilter, setDecisionStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [contractStatusFilter, setContractStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [isLoading] = useState(false);

  const decisions: { id: number; number: string; title: string; date: string; building: string; status: string; type: string }[] = [];
  const contracts: { id: number; number: string; title: string; contractor: string; dateFrom: string; dateTo: string; building: string; amount: string; status: string; type: string }[] = [];

  const filteredDecisions = decisions.filter(
    (decision) => {
      const matchesSearch = decision.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        decision.number.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = decisionStatusFilter === 'all' || decision.status === decisionStatusFilter;
      return matchesSearch && matchesStatus;
    }
  );

  const filteredContracts = contracts.filter(
    (contract) => {
      const matchesSearch = contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.contractor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = contractStatusFilter === 'all' || contract.status === contractStatusFilter;
      return matchesSearch && matchesStatus;
    }
  );

  return (
    <div className="page">
      <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Odluke i ugovori – funkcionalnost će biti dostupna u sljedećoj fazi. Prikazani su demo podaci.
        </AlertDescription>
      </Alert>

      <header className="page-header">
        <h1 className="page-title">Odluke i ugovori</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="hidden sm:flex min-h-[32px]"
            onClick={() => toast({ title: "Uskoro", description: "Export CSV bit će dostupan u sljedećoj fazi." })}
          >
            <FileText className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button 
            className="min-h-[32px]"
            onClick={() => toast({ title: "Uskoro", description: "Dodavanje odluka i ugovora bit će dostupno u sljedećoj fazi." })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Dodaj novi
          </Button>
        </div>
      </header>

      {/* Pretraga */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pretraži po broju, naslovu ili izvođaču..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="min-h-[32px]">
            <Filter className="mr-2 h-4 w-4" />
            Filtri
          </Button>
        </div>
      </Card>

      {/* Tabovi: Odluke i Ugovori */}
      <Tabs defaultValue="decisions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="decisions">
            <ScrollText className="mr-2 h-4 w-4" />
            Odluke
          </TabsTrigger>
          <TabsTrigger value="contracts">
            <FileText className="mr-2 h-4 w-4" />
            Ugovori
          </TabsTrigger>
        </TabsList>

        {/* Tab: Odluke */}
        <TabsContent value="decisions">
          <Card>
            <CardHeader>
              <CardTitle>Odluke skupštine</CardTitle>
            </CardHeader>
            <CardContent>
            {/* Quick Status Filters */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={decisionStatusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="min-h-[32px]"
                onClick={() => setDecisionStatusFilter('all')}
              >
                Sve
              </Button>
              <Button
                variant={decisionStatusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                className="min-h-[32px]"
                onClick={() => setDecisionStatusFilter('active')}
              >
                Aktivne
              </Button>
              <Button
                variant={decisionStatusFilter === 'archived' ? 'default' : 'outline'}
                size="sm"
                className="min-h-[32px]"
                onClick={() => setDecisionStatusFilter('archived')}
              >
                Arhivirane
              </Button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Broj</TableHead>
                    <TableHead>Naslov</TableHead>
                    <TableHead>Zgrada</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <>
                      {[1, 2, 3].map((i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : filteredDecisions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0">
                        <EmptyState
                          icon={ScrollText}
                          title={searchTerm ? "Nema rezultata" : "Nema odluka"}
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDecisions.map((decision) => (
                    <TableRow key={decision.id}>
                      <TableCell className="font-medium">
                        {decision.number}
                      </TableCell>
                      <TableCell>{decision.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {decision.building}
                      </TableCell>
                      <TableCell>{decision.date}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            decision.status === "active" ? "default" : "secondary"
                          }
                        >
                          {decision.status === "active" ? "Aktivna" : "Arhivirana"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[32px]">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[32px]">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
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
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                    </Card>
                  ))}
                </>
              ) : filteredDecisions.length === 0 ? (
                <EmptyState
                  icon={ScrollText}
                  title={searchTerm ? "Nema rezultata" : "Nema odluka"}
                />
              ) : (
                filteredDecisions.map((decision) => (
                  <Card key={decision.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-muted-foreground">#{decision.number}</p>
                          <h3 className="font-semibold mt-0.5">{decision.title}</h3>
                        </div>
                        <Badge variant={decision.status === 'active' ? 'default' : 'secondary'}>
                          {decision.status === 'active' ? 'Aktivna' : 'Arhivirana'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{decision.building}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                        <Calendar className="h-4 w-4" />
                        <span>{decision.date}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 min-h-[32px]">
                          Pregled
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 min-h-[32px]">
                          PDF
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Ugovori */}
        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle>Ugovori</CardTitle>
            </CardHeader>
            <CardContent>
            {/* Quick Status Filters */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={contractStatusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="min-h-[32px]"
                onClick={() => setContractStatusFilter('all')}
              >
                Svi
              </Button>
              <Button
                variant={contractStatusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                className="min-h-[32px]"
                onClick={() => setContractStatusFilter('active')}
              >
                Aktivni
              </Button>
              <Button
                variant={contractStatusFilter === 'archived' ? 'default' : 'outline'}
                size="sm"
                className="min-h-[32px]"
                onClick={() => setContractStatusFilter('archived')}
              >
                Arhivirani
              </Button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Broj</TableHead>
                    <TableHead>Naslov</TableHead>
                    <TableHead>Izvođač</TableHead>
                    <TableHead>Zgrada</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Vrijednost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <>
                      {[1, 2, 3].map((i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : filteredContracts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="p-0">
                        <EmptyState icon={FileText} title="Nema ugovora" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        {contract.number}
                      </TableCell>
                      <TableCell>{contract.title}</TableCell>
                      <TableCell>{contract.contractor}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {contract.building}
                      </TableCell>
                      <TableCell className="text-sm">
                        {contract.dateFrom} - {contract.dateTo}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {contract.amount}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            contract.status === "active"
                              ? "default"
                              : contract.status === "completed"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {contract.status === "active"
                            ? "Aktivan"
                            : contract.status === "completed"
                            ? "Završen"
                            : "Neaktivan"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[32px]">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[32px]">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
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
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </>
              ) : filteredContracts.length === 0 ? (
                <EmptyState icon={FileText} title="Nema ugovora" />
              ) : (
                filteredContracts.map((contract) => (
                  <Card key={contract.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-muted-foreground">#{contract.number}</p>
                          <h3 className="font-semibold mt-0.5">{contract.title}</h3>
                        </div>
                        <Badge variant={contract.status === 'active' ? 'default' : contract.status === 'completed' ? 'secondary' : 'outline'}>
                          {contract.status === 'active' ? 'Aktivan' : contract.status === 'completed' ? 'Završen' : 'Neaktivan'}
                        </Badge>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium">{contract.contractor}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Building2 className="h-3 w-3" />
                          <span className="text-xs">{contract.building}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t">
                        <div>
                          <p className="text-muted-foreground text-xs">Period</p>
                          <p className="font-medium text-xs">{contract.dateFrom} - {contract.dateTo}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs">Vrijednost</p>
                          <p className="font-semibold text-primary">{contract.amount}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 min-h-[32px]">
                          Pregled
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 min-h-[32px]">
                          PDF
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Decisions;

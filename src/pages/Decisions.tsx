import { useState } from "react";
import { Card } from "@/components/ui/card";
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

const Decisions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [decisionStatusFilter, setDecisionStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [contractStatusFilter, setContractStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [isLoading] = useState(false);

  // Mock data - odluke
  const decisions = [
    {
      id: 1,
      number: "01/2025",
      title: "Odluka o godišnjem izvještaju",
      date: "15.01.2025.",
      building: "Split, Marmontova 12",
      status: "active",
      type: "decision",
    },
    {
      id: 2,
      number: "02/2025",
      title: "Odluka o izvedbi radova na fasadi",
      date: "20.01.2025.",
      building: "Split, Marmontova 12",
      status: "active",
      type: "decision",
    },
    {
      id: 3,
      number: "05/2024",
      title: "Odluka o nabavi vatrogasnih aparata",
      date: "10.12.2024.",
      building: "Split, Dioklecijanova 5",
      status: "archived",
      type: "decision",
    },
  ];

  // Mock data - ugovori
  const contracts = [
    {
      id: 1,
      number: "UG-01/2025",
      title: "Ugovor o održavanju lifta",
      contractor: "Lift Servis d.o.o.",
      dateFrom: "01.01.2025.",
      dateTo: "31.12.2025.",
      building: "Split, Marmontova 12",
      amount: "2.400,00 €",
      status: "active",
      type: "contract",
    },
    {
      id: 2,
      number: "UG-02/2025",
      title: "Ugovor o čišćenju zajedničkih prostorija",
      contractor: "Čistoća Plus d.o.o.",
      dateFrom: "01.01.2025.",
      dateTo: "31.12.2025.",
      building: "Split, Marmontova 12",
      amount: "3.600,00 €",
      status: "active",
      type: "contract",
    },
    {
      id: 3,
      number: "UG-15/2024",
      title: "Ugovor o sanaciji dimnjaka",
      contractor: "Dimnjačar Pro d.o.o.",
      dateFrom: "15.11.2024.",
      dateTo: "15.12.2024.",
      building: "Split, Dioklecijanova 5",
      amount: "1.850,00 €",
      status: "completed",
      type: "contract",
    },
  ];

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Odluke i ugovori</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Upravljanje odlukama skupštine i ugovorima
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="hidden sm:flex min-h-[44px]">
            <FileText className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="min-h-[44px]">
                <Plus className="mr-2 h-4 w-4" />
                Dodaj novi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Dodaj odluku ili ugovor</DialogTitle>
                <DialogDescription>
                  Unesite podatke o novoj odluci ili ugovoru
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Tip dokumenta</Label>
                  <Select defaultValue="decision">
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="decision">Odluka</SelectItem>
                      <SelectItem value="contract">Ugovor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="number">Broj</Label>
                  <Input id="number" placeholder="01/2025" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="title">Naslov</Label>
                  <Input id="title" placeholder="Naslov odluke/ugovora" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Opis</Label>
                  <Textarea
                    id="description"
                    placeholder="Detaljan opis..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Spremi</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
          <Button variant="outline" className="min-h-[44px]">
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
          <Card className="p-4 sm:p-6">
            <h2 className="text-xl font-semibold mb-4">Odluke skupštine</h2>
            
            {/* Quick Status Filters */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={decisionStatusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="min-h-[44px]"
                onClick={() => setDecisionStatusFilter('all')}
              >
                Sve
              </Button>
              <Button
                variant={decisionStatusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                className="min-h-[44px]"
                onClick={() => setDecisionStatusFilter('active')}
              >
                Aktivne
              </Button>
              <Button
                variant={decisionStatusFilter === 'archived' ? 'default' : 'outline'}
                size="sm"
                className="min-h-[44px]"
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
                          title="Nema odluka"
                          description={searchTerm ? "Nema odluka koje odgovaraju pretrazi" : "Nema odluka za prikaz"}
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
                          <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[44px]">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[44px]">
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
                  title="Nema odluka"
                  description={searchTerm ? "Nema odluka koje odgovaraju pretrazi" : "Nema odluka za prikaz"}
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
                        <Button variant="outline" size="sm" className="flex-1 min-h-[44px]">
                          Pregled
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 min-h-[44px]">
                          PDF
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Tab: Ugovori */}
        <TabsContent value="contracts">
          <Card className="p-4 sm:p-6">
            <h2 className="text-xl font-semibold mb-4">Ugovori</h2>
            
            {/* Quick Status Filters */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={contractStatusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="min-h-[44px]"
                onClick={() => setContractStatusFilter('all')}
              >
                Svi
              </Button>
              <Button
                variant={contractStatusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                className="min-h-[44px]"
                onClick={() => setContractStatusFilter('active')}
              >
                Aktivni
              </Button>
              <Button
                variant={contractStatusFilter === 'archived' ? 'default' : 'outline'}
                size="sm"
                className="min-h-[44px]"
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
                        <EmptyState
                          icon={FileText}
                          title="Nema ugovora"
                          description={searchTerm ? "Nema ugovora koji odgovaraju pretrazi" : "Nema ugovora za prikaz"}
                        />
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
                          <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[44px]">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[44px]">
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
                <EmptyState
                  icon={FileText}
                  title="Nema ugovora"
                  description={searchTerm ? "Nema ugovora koji odgovaraju pretrazi" : "Nema ugovora za prikaz"}
                />
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
                        <Button variant="outline" size="sm" className="flex-1 min-h-[44px]">
                          Pregled
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 min-h-[44px]">
                          PDF
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Decisions;

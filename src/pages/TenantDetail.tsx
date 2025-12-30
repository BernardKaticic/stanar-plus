import { User, Mail, Phone, FileText, Download, Send, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

// Mock tenant data
const MOCK_TENANT_DATA: any = {
  id: '1',
  apartment_number: '3',
  floor: 1,
  size_m2: 65,
  tenant: {
    id: '1',
    full_name: 'Mato Galić',
    email: 'gali.mato@gmail.com',
    phone: '+385 91 123 4567'
  },
  building: {
    name: null,
    number: '15',
    street: {
      name: 'Antuna Starčevića',
      city: { name: 'Vinkovci' }
    }
  }
};

const MOCK_PAYMENT_HISTORY = [
  { type: 'Plaćanje 10/2025', date: '15.10.2025.', amount: '65.55 €', description: 'Uplaćeno za 10/2025', balance: '0.00 €', isPaid: true },
  { type: 'Zaduženje 10/2025', date: '1.10.2025.', amount: '65.55 €', description: 'Zaduženje za 10/2025', balance: '-65.55 €', isPaid: false },
  { type: 'Plaćanje 9/2025', date: '14.09.2025.', amount: '65.55 €', description: 'Uplaćeno za 9/2025', balance: '0.00 €', isPaid: true },
  { type: 'Zaduženje 9/2025', date: '1.09.2025.', amount: '65.55 €', description: 'Zaduženje za 9/2025', balance: '-65.55 €', isPaid: false },
];

const TenantDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant-detail", id],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      return MOCK_TENANT_DATA;
    },
    enabled: !!id,
  });

  const { data: paymentHistory } = useQuery({
    queryKey: ["tenant-payments", id],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      return MOCK_PAYMENT_HISTORY;
    },
    enabled: !!tenant?.id,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Stanar nije pronađen</p>
      </div>
    );
  }

  const address = `${tenant.building.street.city.name}, ${tenant.building.street.name} ${tenant.building.number}, Stan ${tenant.apartment_number}`;
  const monthlyRate = tenant.size_m2 ? (Number(tenant.size_m2) * 0.90).toFixed(2) : "0.00";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{tenant.tenant?.full_name || "Nepoznat"}</h1>
          <p className="text-muted-foreground mt-1 text-sm">Kartica stanara</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Ispis kartice
          </Button>
          <Button>
            <Send className="mr-2 h-4 w-4" />
            Pošalji e-mailom
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{tenant.tenant?.full_name || "Nepoznat"}</h2>
              <p className="text-sm text-muted-foreground">{address}</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Adresa:</span>
              <span className="font-medium text-right">{address}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Kat:</span>
              <span className="font-medium">{tenant.floor}. kat</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Površina:</span>
              <span className="font-medium">{tenant.size_m2} m²</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">E-mail:</span>
              <span className="font-medium">{tenant.tenant?.email || "-"}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Telefon:</span>
              <span className="font-medium">{tenant.tenant?.phone || "-"}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Način slanja:</span>
              <Badge variant="outline">
                <Mail className="mr-1 h-3 w-3" />
                E-mail
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-semibold mb-4">Struktura troška</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Pričuva/m²</p>
              <p className="text-xl font-bold">0,20 €</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Čišćenje</p>
              <p className="text-xl font-bold">4,00 €</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Kredit/m²</p>
              <p className="text-xl font-bold">0,70 €</p>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Ukupno/m²</p>
              <p className="text-xl font-bold text-primary">0,90 €</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Mjesečna rata:</span>
              <span className="text-3xl font-bold text-primary">{monthlyRate} €</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <Tabs defaultValue="financial">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="financial">Financijska kartica</TabsTrigger>
            <TabsTrigger value="payments">Uplatnice</TabsTrigger>
            <TabsTrigger value="warnings">Opomene</TabsTrigger>
            <TabsTrigger value="documents">Dokumenti</TabsTrigger>
          </TabsList>

          <TabsContent value="financial" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Pregled zaduženja i uplata</h3>
                <p className="text-sm text-muted-foreground">
                  Period: 1.1.2025. - 31.3.2025.
                </p>
              </div>
              <Button variant="outline" size="sm" className="min-h-[44px]">
                Prilagodi period
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vrsta dokumenta</TableHead>
                    <TableHead>Datum zaduženja</TableHead>
                    <TableHead className="text-right">Iznos</TableHead>
                    <TableHead>Opis</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!paymentHistory || paymentHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nema podataka o plaćanjima
                      </TableCell>
                    </TableRow>
                  ) : (
                    paymentHistory.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          <Badge variant={item.isPaid ? "default" : "secondary"}>
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.date}</TableCell>
                        <TableCell className={`text-right font-semibold ${
                          item.isPaid ? "text-success" : "text-warning"
                        }`}>
                          {item.amount}
                        </TableCell>
                        <TableCell className="text-sm">{item.description}</TableCell>
                        <TableCell className={`text-right font-bold ${
                          item.balance.startsWith("-") ? "text-destructive" : "text-success"
                        }`}>
                          {item.balance}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Pošalji karticu e-mailom
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Povijest uplatnica</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ovdje će biti prikazane sve poslane uplatnice za ovog stanara
              </p>
              <Button>Generiraj novu uplatnicu</Button>
            </div>
          </TabsContent>

          <TabsContent value="warnings" className="mt-6">
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Povijest opomena</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Trenutno nema poslanih opomena za ovog stanara
              </p>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Dokumenti</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ugovori, odluke i ostali dokumenti vezani za stanara
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default TenantDetail;

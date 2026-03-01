import { Plus, Euro, Search, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
import { useRepresentatives } from "@/hooks/useRepresentativesData";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { otherIncomeApi, representativesApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { RepresentativeDialog } from "@/components/representatives/RepresentativeDialog";
import { OtherIncomeDialog } from "@/components/representatives/OtherIncomeDialog";
import { toast } from "sonner";

const Representatives = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [repDialogOpen, setRepDialogOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<any>(null);
  const [otherIncomeDialogOpen, setOtherIncomeDialogOpen] = useState(false);
  const [editingOtherIncome, setEditingOtherIncome] = useState<any>(null);
  const queryClient = useQueryClient();

  const createRep = useMutation({
    mutationFn: representativesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["representatives"] });
      toast.success("Predstavnik dodan");
    },
    onError: (e: any) => toast.error(e?.body?.message || "Greška"),
  });
  const updateRep = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => representativesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["representatives"] });
      toast.success("Predstavnik ažuriran");
    },
    onError: (e: any) => toast.error(e?.body?.message || "Greška"),
  });
  const deleteRep = useMutation({
    mutationFn: representativesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["representatives"] });
      toast.success("Predstavnik obrisan");
    },
    onError: (e: any) => toast.error(e?.body?.message || "Greška"),
  });

  const handleRepSave = (data: any) => {
    if (editingRep) {
      updateRep.mutate(
        { id: editingRep.id, data },
        { onSuccess: () => { setRepDialogOpen(false); setEditingRep(null); } }
      );
    } else {
      createRep.mutate(data, {
        onSuccess: () => { setRepDialogOpen(false); setEditingRep(null); },
      });
    }
  };

  const createOI = useMutation({
    mutationFn: otherIncomeApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["other-income"] }); toast.success("Dohodak dodan"); },
    onError: (e: any) => toast.error(e?.body?.message || "Greška"),
  });
  const updateOI = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => otherIncomeApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["other-income"] }); toast.success("Dohodak ažuriran"); },
    onError: (e: any) => toast.error(e?.body?.message || "Greška"),
  });
  const handleOtherIncomeSave = (data: any) => {
    if (editingOtherIncome) {
      updateOI.mutate(
        { id: editingOtherIncome.id, data },
        { onSuccess: () => { setOtherIncomeDialogOpen(false); setEditingOtherIncome(null); } }
      );
    } else {
      createOI.mutate(data, {
        onSuccess: () => { setOtherIncomeDialogOpen(false); setEditingOtherIncome(null); },
      });
    }
  };
  const { data: representatives = [], isLoading } = useRepresentatives(searchTerm || undefined);

  const totalMonthly = representatives.reduce((sum, rep) => {
    return sum + parseFloat(String(rep.monthlyIncome || "0").replace(/[^\d,]/g, "").replace(",", "."));
  }, 0);

  const { data: otherIncome = [] } = useQuery({
    queryKey: ["other-income"],
    queryFn: () => otherIncomeApi.getAll(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1>Predstavnici suvlasnika</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Upravljanje predstavnicima zgrada i drugim dohotkom
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Ukupno predstavnika</p>
          <p className="text-xl font-semibold mt-1">{representatives.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Mjesečni troškovi predstavnika</p>
          <p className="text-xl font-semibold mt-1 text-primary">
            {formatCurrency(totalMonthly)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Isplaćeno ovaj mjesec</p>
          <p className="text-xl font-semibold mt-1">{formatCurrency(totalMonthly)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div>
              <CardTitle>Popis predstavnika</CardTitle>
              <CardDescription>
                Pretraga i izvoz
              </CardDescription>
            </div>
            <div className="flex justify-end gap-2 w-full sm:w-auto shrink-0">
              <Button variant="outline" className="min-h-[32px] gap-2">
                <FileText className="h-4 w-4" />
                Export CSV
              </Button>
              {representatives.length > 0 && (
                <Button type="button" className="gap-2 min-h-[32px]" onClick={() => { setEditingRep(null); setRepDialogOpen(true); }}>
                  <Plus className="h-4 w-4" />
                  Dodaj predstavnika
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-medium">Predstavnik</TableHead>
                <TableHead className="text-xs font-medium">Zgrada</TableHead>
                <TableHead className="text-xs font-medium">OIB</TableHead>
                <TableHead className="text-xs font-medium">Kontakt</TableHead>
                <TableHead className="text-xs font-medium">IBAN</TableHead>
                <TableHead className="text-right text-xs font-medium">Mjesečni dohodak</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="text-right text-xs font-medium">Akcije</TableHead>
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
                <TableCell colSpan={8} className="p-8">
                  <EmptyState
                    title="Nema predstavnika"
                    description="Dodajte prvog predstavnika da biste započeli."
                    action={{
                      label: "Dodaj predstavnika",
                      onClick: () => { setEditingRep(null); setRepDialogOpen(true); },
                    }}
                  />
                </TableCell>
              </TableRow>
              ) : (
                representatives.map((rep) => (
                <TableRow key={rep.id}>
                  <TableCell className="font-medium text-sm">
                    {rep.name}
                  </TableCell>
                  <TableCell className="text-xs">
                    {rep.building}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{rep.oib}</TableCell>
                  <TableCell className="text-xs">
                    <div className="space-y-0.5">
                      <div>{rep.email}</div>
                      <div>{rep.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{rep.iban}</TableCell>
                  <TableCell className="text-right text-xs font-semibold">
                    {rep.monthlyIncome}
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="default">Aktivan</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="min-h-[32px]" onClick={() => { setEditingRep(rep); setRepDialogOpen(true); }}>Uredi</Button>
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
              title="Nema predstavnika"
              description="Dodajte prvog predstavnika da biste započeli."
              action={{
                label: "Dodaj predstavnika",
                onClick: () => { setEditingRep(null); setRepDialogOpen(true); },
              }}
            />
          ) : (
            representatives.map((rep) => (
              <Card key={rep.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{rep.name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
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
                      <p className="text-xs truncate mb-1">{rep.email}</p>
                      <p className="text-xs">{rep.phone}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">IBAN</p>
                      <p className="font-mono text-xs break-all">{rep.iban}</p>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full min-h-[32px]" onClick={() => { setEditingRep(rep); setRepDialogOpen(true); }}>
                    Uredi
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
        </CardContent>
      </Card>

      <RepresentativeDialog
        open={repDialogOpen}
        onOpenChange={(o) => { setRepDialogOpen(o); if (!o) setEditingRep(null); }}
        onSave={handleRepSave}
        editItem={editingRep}
        isPending={createRep.isPending || updateRep.isPending}
      />

      <Card>
        <CardHeader>
          <CardTitle>Drugi dohodak</CardTitle>
          <CardDescription>
            Evidencija dodatnih periodičnih isplata (upravitelji, održavanje, čišćenje...)
          </CardDescription>
        </CardHeader>
        <CardContent>
        <div className="space-y-3">
          {otherIncome.map((income: any) => (
            <div key={income.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
              <div className="flex-1 cursor-pointer" onClick={() => { setEditingOtherIncome(income); setOtherIncomeDialogOpen(true); }}>
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
                  <Badge variant="outline" className="mb-1">{income.frequencyLabel || income.frequency}</Badge>
                  <p className="font-semibold text-sm">{income.amount}</p>
                </div>
                <Button variant="ghost" size="sm" className="min-h-[32px]" onClick={() => { setEditingOtherIncome(income); setOtherIncomeDialogOpen(true); }}>Uredi</Button>
              </div>
            </div>
          ))}
          
          <Button variant="outline" className="w-full gap-2" onClick={() => { setEditingOtherIncome(null); setOtherIncomeDialogOpen(true); }}>
            <Plus className="h-4 w-4" />
            Dodaj novi dohodak
          </Button>

          <OtherIncomeDialog
            open={otherIncomeDialogOpen}
            onOpenChange={(o) => { setOtherIncomeDialogOpen(o); if (!o) setEditingOtherIncome(null); }}
            onSave={handleOtherIncomeSave}
            editItem={editingOtherIncome}
            isPending={createOI.isPending || updateOI.isPending}
          />
        </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Representatives;

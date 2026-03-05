import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, FileText, AlertCircle, ClipboardCheck, X, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { useWorkOrders, useCreateWorkOrder } from "@/hooks/useWorkOrdersData";
import { workOrdersApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { WorkOrderDialog } from "@/components/workorders/WorkOrderDialog";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

const WorkOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [workOrderDialogOpen, setWorkOrderDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'dateReported' | 'priority' | 'status' | 'id'>('dateReported');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, priorityFilter, pageSize]);

  const { data: workOrdersData, isLoading, isFetching } = useWorkOrders({
    page,
    pageSize,
    search: searchTerm,
    statusFilter,
    priorityFilter,
  });
  const { data: stats } = useQuery({
    queryKey: ["work-orders", "stats", searchTerm, statusFilter, priorityFilter],
    queryFn: () =>
      workOrdersApi.getStats({
        search: searchTerm,
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
      }),
  });
  const createWorkOrder = useCreateWorkOrder();

  const workOrdersRaw = workOrdersData?.data || [];
  const totalCount = workOrdersData?.totalCount || 0;

  const priorityOrder: Record<string, number> = { urgent: 0, high: 0, normal: 1, medium: 1, low: 2 };
  const statusOrder: Record<string, number> = { open: 0, "in-progress": 1, completed: 2 };
  const mul = sortDir === "asc" ? 1 : -1;
  const workOrders = [...workOrdersRaw].sort((a, b) => {
    if (sortBy === "id") return mul * (Number(a.id) - Number(b.id));
    if (sortBy === "title") return mul * (a.title || "").localeCompare(b.title || "", "hr");
    if (sortBy === "dateReported") {
      const da = a.dateReported || "";
      const db = b.dateReported || "";
      return mul * da.localeCompare(db);
    }
    if (sortBy === "priority") {
      const pa = priorityOrder[a.priority] ?? 1;
      const pb = priorityOrder[b.priority] ?? 1;
      return mul * (pa - pb);
    }
    if (sortBy === "status") {
      const sa = statusOrder[a.status] ?? 0;
      const sb = statusOrder[b.status] ?? 0;
      return mul * (sa - sb);
    }
    return 0;
  });

  const urgentCount = stats?.urgent ?? 0;
  const inProgressCount = stats?.inProgress ?? 0;
  const openCount = stats?.open ?? 0;
  const completedCount = stats?.completed ?? 0;

  const activeFiltersCount =
    (statusFilter !== "all" ? 1 : 0) + (priorityFilter !== "all" ? 1 : 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in-progress":
        return <Badge variant="warning">U tijeku</Badge>;
      case "open":
        return <Badge variant="secondary">Otvoren</Badge>;
      case "completed":
        return <Badge variant="success">Završen</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
      case "high":
        return <Badge variant="destructive">Hitno</Badge>;
      case "normal":
      case "medium":
        return <Badge variant="outline">Normalno</Badge>;
      case "low":
        return <Badge variant="secondary">Nisko</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };


  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1>Radni nalozi</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Upravljanje održavanjem i popravcima.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Hitni nalozi", value: urgentCount, className: "text-destructive" },
          { label: "U tijeku", value: inProgressCount, className: "" },
          { label: "Otvoreni", value: openCount, className: "" },
          { label: "Završeni", value: completedCount, className: "" },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 transition-all duration-200 hover:shadow-sm">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-12 mt-2" />
            ) : (
              <p className={`text-xl font-semibold mt-1 ${stat.className}`}>{stat.value}</p>
            )}
          </Card>
        ))}
      </div>

      <Card className="transition-opacity duration-200" style={{ opacity: isFetching && !isLoading ? 0.92 : 1 }}>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Popis radnih naloga</CardTitle>
                {isFetching && !isLoading && (
                  <span className="inline-flex h-2 w-2 rounded-full bg-primary/60 animate-pulse" aria-hidden />
                )}
              </div>
              <CardDescription>
                Pretraga, filteri i dodavanje naloga
              </CardDescription>
            </div>
            <div className="flex justify-end w-full sm:w-auto shrink-0">
              <Button
                type="button"
                className="gap-2 min-h-[28px] sm:min-h-[32px]"
                onClick={() => setWorkOrderDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Novi nalog
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pretraži po broju, opisu ili zgradi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 transition-colors duration-150 focus-visible:ring-2"
            />
          </div>
          <div className="flex gap-2">
            {activeFiltersCount > 0 && (
              <Button 
                variant="ghost" 
                size="icon"
                className="min-w-[44px] min-h-[32px]"
                onClick={() => {
                  setStatusFilter('all');
                  setPriorityFilter('all');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="space-y-3 mb-6">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={statusFilter === 'all' && priorityFilter === 'all' ? 'default' : 'outline'} 
              size="sm" 
              className="min-h-[32px]"
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
            >
              Svi
            </Button>
            
            <div className="h-6 w-px bg-border" />
            
            <Button
              variant={statusFilter === "open" ? "default" : "outline"}
              size="sm"
              className="min-h-[32px]"
              onClick={() => setStatusFilter((s) => (s === "open" ? "all" : "open"))}
            >
              Otvoreni
            </Button>
            <Button
              variant={statusFilter === "in-progress" ? "default" : "outline"}
              size="sm"
              className="min-h-[32px]"
              onClick={() => setStatusFilter((s) => (s === "in-progress" ? "all" : "in-progress"))}
            >
              U tijeku
            </Button>
            <Button
              variant={statusFilter === "completed" ? "default" : "outline"}
              size="sm"
              className="min-h-[32px]"
              onClick={() => setStatusFilter((s) => (s === "completed" ? "all" : "completed"))}
            >
              Završeni
            </Button>

            <div className="h-6 w-px bg-border" />

            <Button
              variant={priorityFilter === "urgent" || priorityFilter === "high" ? "default" : "outline"}
              size="sm"
              className="min-h-[32px]"
              onClick={() =>
                setPriorityFilter((p) => (p === "urgent" || p === "high" ? "all" : "urgent"))
              }
            >
              Hitno
            </Button>
            <Button
              variant={priorityFilter === "normal" ? "default" : "outline"}
              size="sm"
              className="min-h-[32px]"
              onClick={() => setPriorityFilter((p) => (p === "normal" ? "all" : "normal"))}
            >
              Normalno
            </Button>
            <Button
              variant={priorityFilter === "low" ? "default" : "outline"}
              size="sm"
              className="min-h-[32px]"
              onClick={() => setPriorityFilter((p) => (p === "low" ? "all" : "low"))}
            >
              Nisko
            </Button>
          </div>
          {activeFiltersCount > 0 && (
            <div className="text-sm text-muted-foreground">
              Prikazano {workOrders.length} od {totalCount} naloga
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-md border overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs font-medium hover:text-foreground"
                    onClick={() => {
                      if (sortBy === "id") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                      else { setSortBy("id"); setSortDir("desc"); }
                    }}
                  >
                    Broj naloga
                    {sortBy === "id" ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs font-medium hover:text-foreground"
                    onClick={() => {
                      if (sortBy === "title") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                      else { setSortBy("title"); setSortDir("asc"); }
                    }}
                  >
                    Opis
                    {sortBy === "title" ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                  </button>
                </TableHead>
                <TableHead>Zgrada / Lokacija</TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs font-medium hover:text-foreground"
                    onClick={() => {
                      if (sortBy === "dateReported") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                      else { setSortBy("dateReported"); setSortDir("desc"); }
                    }}
                  >
                    Datum prijave
                    {sortBy === "dateReported" ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs font-medium hover:text-foreground"
                    onClick={() => {
                      if (sortBy === "priority") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                      else { setSortBy("priority"); setSortDir("asc"); }
                    }}
                  >
                    Prioritet
                    {sortBy === "priority" ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs font-medium hover:text-foreground"
                    onClick={() => {
                      if (sortBy === "status") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                      else { setSortBy("status"); setSortDir("asc"); }
                    }}
                  >
                    Status
                    {sortBy === "status" ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                  </button>
                </TableHead>
                <TableHead>Dodijeljeno</TableHead>
                <TableHead className="text-right">Procjena</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </>
              ) : workOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="p-0">
                    <EmptyState
                      icon={ClipboardCheck}
                      title="Nema radnih naloga"
                      description="Dodajte prvi radni nalog da biste započeli."
                      action={
                        <Button onClick={() => setWorkOrderDialogOpen(true)} size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Novi nalog
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                workOrders.map((order, idx) => (
                  <TableRow
                    key={order.id}
                    className="hover:bg-muted/30 transition-colors duration-150 cursor-pointer animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(idx * 30, 120)}ms` }}
                    onClick={() => navigate(`/work-orders/${order.id}`)}
                  >
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.title}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.building}</p>
                        <p className="text-xs text-muted-foreground">{order.unit}</p>
                      </div>
                    </TableCell>
                    <TableCell>{order.dateReported}</TableCell>
                    <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-sm">{order.assignedTo}</TableCell>
                    <TableCell className="text-right font-medium">-</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="min-h-[32px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/work-orders/${order.id}`);
                        }}
                      >
                        Detalji
                      </Button>
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
                    <div className="flex items-start justify-between">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </div>
                </Card>
              ))}
            </>
          ) : workOrders.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Nema radnih naloga"
              description="Dodajte prvi radni nalog da biste započeli."
              action={
                <Button onClick={() => setWorkOrderDialogOpen(true)} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Novi nalog
                </Button>
              }
            />
          ) : (
            workOrders.map((order, idx) => (
              <Card
                key={order.id}
                className="p-4 hover:shadow-md transition-all duration-300 cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${Math.min(idx * 40, 200)}ms` }}
                onClick={() => navigate(`/work-orders/${order.id}`)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-muted-foreground">#{order.id}</p>
                      <h3 className="font-semibold mt-0.5">{order.title}</h3>
                    </div>
                    {getPriorityBadge(order.priority)}
                  </div>

                  <div>
                    <p className="font-medium text-sm">{order.building}</p>
                    <p className="text-xs text-muted-foreground">{order.unit}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t">
                    <div>
                      <p className="text-muted-foreground text-xs">Status</p>
                      {getStatusBadge(order.status)}
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Prijavljeno</p>
                      <p className="font-medium text-xs">{order.dateReported}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">Dodijeljeno</p>
                      <p className="font-medium text-xs">{order.assignedTo ?? "-"}</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full min-h-[32px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/work-orders/${order.id}`);
                    }}
                  >
                    Pregledaj detalje
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        <PaginationControls
          currentPage={page}
          totalPages={Math.ceil(totalCount / pageSize)}
          pageSize={pageSize}
          totalItems={totalCount}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
        </CardContent>
      </Card>

      <WorkOrderDialog
        open={workOrderDialogOpen}
        onOpenChange={setWorkOrderDialogOpen}
        onSave={(data) => {
          if (!data.title || !data.building_id || !data.created_by) return;
          createWorkOrder.mutate({
            title: data.title,
            description: data.description,
            building_id: data.building_id,
            apartment_id: data.apartment_id,
            priority: data.priority,
            created_by: data.created_by,
          }, {
            onSuccess: () => setWorkOrderDialogOpen(false),
          });
        }}
        userId={user?.id || ""}
        isPending={createWorkOrder.isPending}
      />
    </div>
  );
};

export default WorkOrders;

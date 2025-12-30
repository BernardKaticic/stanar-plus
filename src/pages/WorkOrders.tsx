import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
import { Search, Plus, FileText, AlertCircle, ClipboardCheck, X } from "lucide-react";
import { useWorkOrders, useCreateWorkOrder } from "@/hooks/useWorkOrdersData";
import { WorkOrderDialog } from "@/components/workorders/WorkOrderDialog";
import { useAuth } from "@/contexts/AuthContext";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

const WorkOrders = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [workOrderDialogOpen, setWorkOrderDialogOpen] = useState(false);
  
  const { data: workOrdersData, isLoading } = useWorkOrders({
    page,
    pageSize,
    search: searchTerm,
    statusFilter,
    priorityFilter,
  });
  const createWorkOrder = useCreateWorkOrder();

  const workOrders = workOrdersData?.data || [];
  const totalCount = workOrdersData?.totalCount || 0;

  const urgentCount = workOrders.filter((o) => o.priority === "high" || o.priority === "urgent").length;
  const inProgressCount = workOrders.filter((o) => o.status === "in-progress").length;
  const openCount = workOrders.filter((o) => o.status === "open").length;
  const completedCount = workOrders.filter((o) => o.status === "completed").length;

  const activeFiltersCount = 
    (statusFilter !== 'all' ? 1 : 0) + 
    (priorityFilter !== 'all' ? 1 : 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "high":
      case "urgent":
        return <Badge variant="destructive">Hitno</Badge>;
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
      case "high":
      case "urgent":
        return <Badge variant="destructive">Hitno</Badge>;
      case "medium":
      case "normal":
        return <Badge variant="outline">Normalno</Badge>;
      case "low":
        return <Badge variant="secondary">Nisko</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Radni nalozi</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Upravljanje održavanjem i popravcima
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Hitni nalozi"
          value={isLoading ? "..." : String(urgentCount)}
          changeType="negative"
        />
        <StatCard
          title="U tijeku"
          value={isLoading ? "..." : String(inProgressCount)}
          changeType="neutral"
        />
        <StatCard
          title="Otvoreni"
          value={isLoading ? "..." : String(openCount)}
          changeType="neutral"
        />
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pretraži po broju, opisu ili zgradi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {activeFiltersCount > 0 && (
              <Button 
                variant="ghost" 
                size="icon"
                className="min-w-[44px] min-h-[44px]"
                onClick={() => {
                  setStatusFilter('all');
                  setPriorityFilter('all');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button 
              onClick={() => setWorkOrderDialogOpen(true)} 
              className="flex-1 sm:flex-none min-h-[44px]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novi nalog
            </Button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="space-y-3 mb-6">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={statusFilter === 'all' && priorityFilter === 'all' ? 'default' : 'outline'} 
              size="sm" 
              className="min-h-[44px]"
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
            >
              Svi
            </Button>
            
            <div className="h-6 w-px bg-border" />
            
            <Button 
              variant={statusFilter === 'open' ? 'default' : 'outline'} 
              size="sm" 
              className="min-h-[44px]"
              onClick={() => setStatusFilter('open')}
            >
              Otvoreni
            </Button>
            <Button 
              variant={statusFilter === 'in-progress' ? 'default' : 'outline'} 
              size="sm" 
              className="min-h-[44px]"
              onClick={() => setStatusFilter('in-progress')}
            >
              U tijeku
            </Button>
            <Button 
              variant={statusFilter === 'completed' ? 'default' : 'outline'} 
              size="sm" 
              className="min-h-[44px]"
              onClick={() => setStatusFilter('completed')}
            >
              Završeni
            </Button>
            
            <div className="h-6 w-px bg-border" />
            
            <Button 
              variant={priorityFilter === 'urgent' ? 'default' : 'outline'} 
              size="sm" 
              className="min-h-[44px]"
              onClick={() => setPriorityFilter('urgent')}
            >
              Hitno
            </Button>
            <Button 
              variant={priorityFilter === 'normal' ? 'default' : 'outline'} 
              size="sm" 
              className="min-h-[44px]"
              onClick={() => setPriorityFilter('normal')}
            >
              Normalno
            </Button>
            <Button 
              variant={priorityFilter === 'low' ? 'default' : 'outline'} 
              size="sm" 
              className="min-h-[44px]"
              onClick={() => setPriorityFilter('low')}
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
        <div className="hidden md:block rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Broj naloga</TableHead>
                <TableHead>Opis</TableHead>
                <TableHead>Zgrada / Lokacija</TableHead>
                <TableHead>Datum prijave</TableHead>
                <TableHead>Prioritet</TableHead>
                <TableHead>Status</TableHead>
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
                      description="Dodajte prvi radni nalog klikom na gumb iznad"
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
                workOrders.map((order) => (
                  <TableRow key={order.id}>
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
                    <TableCell>
                      <Button variant="ghost" size="sm" className="min-h-[44px]">
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
              description="Dodajte prvi radni nalog klikom na gumb iznad"
              action={
                <Button onClick={() => setWorkOrderDialogOpen(true)} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Novi nalog
                </Button>
              }
            />
          ) : (
            workOrders.map((order) => (
              <Card key={order.id} className="p-4 hover:shadow-md transition-shadow">
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
                      <p className="font-medium text-xs">{order.assignedTo}</p>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full min-h-[44px]">
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
      />
    </div>
  );
};

export default WorkOrders;

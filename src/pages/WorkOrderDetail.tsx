import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Pencil } from "lucide-react";
import { workOrdersApi } from "@/lib/api";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { WorkOrderDialog } from "@/components/workorders/WorkOrderDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateWorkOrder } from "@/hooks/useWorkOrdersData";

function formatReportedDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  try {
    const d = typeof dateStr === "string" && dateStr.length === 10 ? parseISO(dateStr) : new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return format(d, "d.M.yyyy.");
  } catch {
    return dateStr ?? "—";
  }
}

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

const WorkOrderDetailContent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const updateWorkOrder = useUpdateWorkOrder();
  const { data: order, isLoading, error } = useQuery({
    queryKey: ["work-orders", id],
    queryFn: () => workOrdersApi.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/work-orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Natrag
        </Button>
        <p className="text-destructive">Nalog nije pronađen.</p>
      </div>
    );
  }

  const orderAny = order as { buildingId?: string; apartmentId?: string };
  const editItem = order ? {
    id: order.id,
    title: order.title,
    description: order.description ?? undefined,
    building_id: orderAny.buildingId ?? "",
    apartment_id: orderAny.apartmentId ?? undefined,
    priority: order.priority,
    status: order.status,
  } : null;

  return (
    <div className="page animate-fade-in">
      <header className="page-header flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/work-orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Natrag
        </Button>
        <Button size="sm" className="gap-2 min-h-[32px]" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" />
          Uredi
        </Button>
      </header>

      <Card className="transition-all duration-200 hover:shadow-sm rounded-md">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl">Nalog #{order.id}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{order.title}</p>
            </div>
            <div className="flex gap-2">
              {getPriorityBadge(order.priority)}
              {getStatusBadge(order.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Opis</p>
              <p className="mt-1">{order.description}</p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Zgrada / Lokacija</p>
              <p className="mt-1">{order.building ?? "—"}</p>
              {order.unit && <p className="text-sm text-muted-foreground">{order.unit}</p>}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Datum prijave</p>
              <p className="mt-1">{formatReportedDate(order.dateReported)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <WorkOrderDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editItem={editItem}
        onSave={(data) => {
          if ("id" in data && data.id) {
            updateWorkOrder.mutate(
              {
                id: data.id,
                data: {
                  title: data.title,
                  description: data.description,
                  building_id: data.building_id,
                  apartment_id: data.apartment_id || undefined,
                  priority: data.priority,
                  status: data.status,
                },
              },
              { onSuccess: () => setEditOpen(false) }
            );
          }
        }}
        userId={user?.id ?? ""}
        isPending={updateWorkOrder.isPending}
      />
    </div>
  );
};

const WorkOrderDetail = () => (
  <ProtectedRoute allowedRoles={["admin", "upravitelj"]}>
    <WorkOrderDetailContent />
  </ProtectedRoute>
);

export default WorkOrderDetail;

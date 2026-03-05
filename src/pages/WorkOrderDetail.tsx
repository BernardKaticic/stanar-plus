import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { workOrdersApi } from "@/lib/api";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/work-orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Natrag
        </Button>
      </div>

      <Card className="transition-all duration-200 hover:shadow-sm">
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
              <p className="mt-1">{order.building ?? "-"}</p>
              {order.unit && <p className="text-sm text-muted-foreground">{order.unit}</p>}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Datum prijave</p>
              <p className="mt-1">{order.dateReported ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dodijeljeno</p>
              <p className="mt-1">{order.assignedTo ?? "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const WorkOrderDetail = () => (
  <ProtectedRoute allowedRoles={["admin", "upravitelj"]}>
    <WorkOrderDetailContent />
  </ProtectedRoute>
);

export default WorkOrderDetail;

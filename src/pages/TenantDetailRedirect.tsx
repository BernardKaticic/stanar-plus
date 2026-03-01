import { useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { tenantsApi } from "@/lib/api";

/** Redirect /tenants/:id (tenant ID) → /persons/:personId (person ID) */
export const TenantDetailRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: tenant, isLoading, isError } = useQuery({
    queryKey: ["tenant-redirect", id],
    queryFn: () => tenantsApi.getById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (!id || isLoading) return;
    if (isError || !tenant) {
      navigate("/tenants", { replace: true });
      return;
    }
    const personId = tenant.person_id;
    if (personId) {
      navigate(`/persons/${personId}`, { replace: true, state: location.state });
    } else {
      navigate("/tenants", { replace: true });
    }
  }, [id, tenant, isLoading, isError, navigate]);

  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
};

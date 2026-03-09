import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apartmentsApi, usersApi } from '@/lib/api';

const AdminTenants = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['users', 'stanar'],
    queryFn: () => usersApi.getByRole('stanar'),
    enabled: userRole === 'admin' || userRole === 'upravitelj',
  });

  const { data: apartments = [], isLoading: loadingApartments } = useQuery({
    queryKey: ['apartments'],
    queryFn: () => apartmentsApi.getAll(),
    enabled: userRole === 'admin' || userRole === 'upravitelj',
  });

  const assignMutation = useMutation({
    mutationFn: ({ apartmentId, userId }: { apartmentId: string; userId: string | null }) =>
      apartmentsApi.assignTenant(apartmentId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments'] });
      toast.success('Stanar uspješno dodijeljen');
    },
    onError: () => toast.error('Greška pri dodjeljivanju'),
  });

  const loading = loadingProfiles || loadingApartments;

  const assignTenant = (apartmentId: string, userId: string | null) => {
    assignMutation.mutate({ apartmentId, userId });
  };

  if (userRole !== 'admin' && userRole !== 'upravitelj') {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Nemate pristup ovoj stranici</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Upravljanje stanarima</h1>
      </header>

      <div className="grid gap-4">
        {apartments.map((apartment) => {
          const building = apartment.buildings;
          const address = `${building.streets.cities.name}, ${building.streets.name} ${building.number}, Stan ${apartment.apartment_number}`;
          
          return (
            <Card key={apartment.id}>
              <CardHeader>
                <CardTitle>{address}</CardTitle>
                <CardDescription>
                  {apartment.tenant_id 
                    ? `Trenutni stanar: ${profiles.find(p => p.id === apartment.tenant_id)?.email || 'Nepoznat'}`
                    : 'Stan nije dodijeljen'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-center">
                  <Select
                    value={apartment.tenant_id || 'none'}
                    onValueChange={(value) => assignTenant(apartment.id, value === 'none' ? null : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Odaberi stanara" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nitko (oslobodi stan)</SelectItem>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name || profile.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {apartments.length === 0 && (
        <Card>
          <CardContent className="py-10">
            <EmptyState
              title="Nema dostupnih stanova"
              action={{ label: "Idi na Zgrade", onClick: () => navigate("/buildings") }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminTenants;

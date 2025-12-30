import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
}

interface Apartment {
  id: string;
  apartment_number: string;
  building_id: string;
  tenant_id: string | null;
  buildings: {
    name: string | null;
    number: string;
    streets: {
      name: string;
      cities: {
        name: string;
      };
    };
  };
}

// Mock data
const MOCK_PROFILES: Profile[] = [
  { id: '1', email: 'gali.mato@gmail.com', full_name: 'Mato Galić' },
  { id: '2', email: 'babic.ana@gmail.com', full_name: 'Ana Babić' },
  { id: '3', email: 'horvat.p@gmail.com', full_name: 'Petar Horvat' },
  { id: '4', email: 'kovac.ivana@gmail.com', full_name: 'Ivana Kovač' },
  { id: '5', email: 'marko.novak@gmail.com', full_name: 'Marko Novak' },
];

const MOCK_APARTMENTS: Apartment[] = [
  { id: '1', apartment_number: '1', building_id: '1', tenant_id: '1', buildings: { name: null, number: '15', streets: { name: 'Antuna Starčevića', cities: { name: 'Vinkovci' } } } },
  { id: '2', apartment_number: '2', building_id: '1', tenant_id: '2', buildings: { name: null, number: '15', streets: { name: 'Antuna Starčevića', cities: { name: 'Vinkovci' } } } },
  { id: '3', apartment_number: '3', building_id: '1', tenant_id: null, buildings: { name: null, number: '15', streets: { name: 'Antuna Starčevića', cities: { name: 'Vinkovci' } } } },
  { id: '4', apartment_number: '2', building_id: '2', tenant_id: '4', buildings: { name: null, number: '7', streets: { name: 'Ohridska', cities: { name: 'Vinkovci' } } } },
  { id: '5', apartment_number: '5', building_id: '3', tenant_id: '3', buildings: { name: null, number: '12', streets: { name: 'Marmontova', cities: { name: 'Split' } } } },
];

const AdminTenants = () => {
  const { userRole } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole === 'admin' || userRole === 'upravitelj') {
      fetchData();
    }
  }, [userRole]);

  const fetchData = async () => {
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setProfiles(MOCK_PROFILES);
    setApartments(MOCK_APARTMENTS);
    setLoading(false);
  };

  const assignTenant = async (apartmentId: string, tenantId: string | null) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Update local state
    setApartments(prev => 
      prev.map(apt => 
        apt.id === apartmentId 
          ? { ...apt, tenant_id: tenantId }
          : apt
      )
    );

    toast.success('Stanar uspješno dodijeljen');
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Upravljanje stanarima</h1>
        <p className="text-muted-foreground text-sm">Dodijelite stanove registriranim korisnicima</p>
      </div>

      <div className="grid gap-4">
        {apartments.map((apartment) => {
          const building = apartment.buildings;
          const address = `${building.streets.cities.name}, ${building.streets.name} ${building.number}, Stan ${apartment.apartment_number}`;
          
          return (
            <Card key={apartment.id}>
              <CardHeader>
                <CardTitle className="text-lg">{address}</CardTitle>
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
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              Nema dostupnih stanova. Prvo dodajte zgrade i stanove.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminTenants;

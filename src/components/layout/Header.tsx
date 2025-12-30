import { Search, Bell, User, LogOut, Building2, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const { user, userRole, signOut } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Mock data for search
  const mockTenants = [
    { id: '1', firstName: 'Mato', lastName: 'Galić', email: 'gali.mato@gmail.com', apartment: '15/3', building: 'A.Starčevića 15, Vinkovci' },
    { id: '2', firstName: 'Ana', lastName: 'Babić', email: 'babic.ana@gmail.com', apartment: '7/2', building: 'Ohridska 7, Vinkovci' },
    { id: '3', firstName: 'Petar', lastName: 'Horvat', email: 'horvat.p@gmail.com', apartment: '12/5', building: 'Marmontova 12, Split' },
    { id: '4', firstName: 'Ivana', lastName: 'Kovač', email: 'kovac.ivana@gmail.com', apartment: '3/1', building: 'Trg bana J. Jelačića 3, Split' },
    { id: '5', firstName: 'Marko', lastName: 'Novak', email: 'marko.novak@gmail.com', apartment: '25/4', building: 'Vukovarska 25, Vinkovci' },
    { id: '6', firstName: 'Lucija', lastName: 'Jurić', email: 'lucija.juric@gmail.com', apartment: '5/2', building: 'Dioklecijanova 5, Split' },
    { id: '7', firstName: 'Tomislav', lastName: 'Vuković', email: 'vukovic.t@gmail.com', apartment: '8/1', building: 'Matice hrvatske 8, Vinkovci' },
    { id: '8', firstName: 'Petra', lastName: 'Šimić', email: 'petra.simic@gmail.com', apartment: '11/3', building: 'Zvonimirova 11, Split' },
  ];

  // Search function
  useEffect(() => {
    const performSearch = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      try {
        const results: any[] = [];
        const term = searchTerm.toLowerCase();

        // Search tenants
        const tenantResults = mockTenants.filter(t =>
          t.firstName.toLowerCase().includes(term) ||
          t.lastName.toLowerCase().includes(term) ||
          t.email.toLowerCase().includes(term) ||
          t.apartment.includes(term) ||
          t.building.toLowerCase().includes(term)
        ).slice(0, 5);

        results.push(...tenantResults.map(t => ({
          type: 'tenant',
          id: t.id,
          title: `${t.firstName} ${t.lastName}`,
          subtitle: `${t.apartment} - ${t.building}`,
          icon: Users,
        })));

        // Search buildings (mock - replace with real data)
        const buildingMock = [
          { id: '1', name: 'A.Starčevića 15', city: 'Vinkovci', street: 'Antuna Starčevića' },
          { id: '2', name: 'Ohridska 7', city: 'Vinkovci', street: 'Ohridska' },
          { id: '3', name: 'Marmontova 12', city: 'Split', street: 'Marmontova' },
          { id: '4', name: 'Trg bana J. Jelačića 3', city: 'Split', street: 'Trg bana Josipa Jelačića' },
          { id: '5', name: 'Vukovarska 25', city: 'Vinkovci', street: 'Vukovarska' },
          { id: '6', name: 'Dioklecijanova 5', city: 'Split', street: 'Dioklecijanova' },
          { id: '7', name: 'Matice hrvatske 8', city: 'Vinkovci', street: 'Matice hrvatske' },
          { id: '8', name: 'Zvonimirova 11', city: 'Split', street: 'Zvonimirova' },
          { id: '9', name: 'Kralja Tomislava 22', city: 'Vinkovci', street: 'Kralja Tomislava' },
          { id: '10', name: 'Zrinsko-Frankopanska 4', city: 'Split', street: 'Zrinsko-Frankopanska' },
        ].filter(b => 
          b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.street.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 5);

        results.push(...buildingMock.map(b => ({
          type: 'building',
          id: b.id,
          title: b.name,
          subtitle: `${b.street}, ${b.city}`,
          icon: Building2,
        })));

        // Search cities
        const cityMock = [
          { id: 'vinkovci', name: 'Vinkovci', buildings: 45 },
          { id: 'split', name: 'Split', buildings: 38 },
          { id: 'vukovar', name: 'Vukovar', buildings: 12 },
          { id: 'osijek', name: 'Osijek', buildings: 8 },
          { id: 'zagreb', name: 'Zagreb', buildings: 5 },
        ].filter(c => 
          c.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 3);

        results.push(...cityMock.map(c => ({
          type: 'city',
          id: c.id,
          title: c.name,
          subtitle: `${c.buildings} zgrada`,
          icon: MapPin,
        })));

        // Search streets
        const streetMock = [
          { id: '1', name: 'Antuna Starčevića', city: 'Vinkovci', buildings: 3 },
          { id: '2', name: 'Ohridska', city: 'Vinkovci', buildings: 2 },
          { id: '3', name: 'Marmontova', city: 'Split', buildings: 5 },
          { id: '4', name: 'Dioklecijanova', city: 'Split', buildings: 4 },
          { id: '5', name: 'Vukovarska', city: 'Vinkovci', buildings: 6 },
          { id: '6', name: 'Matice hrvatske', city: 'Vinkovci', buildings: 2 },
        ].filter(s => 
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.city.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 3);

        results.push(...streetMock.map(s => ({
          type: 'street',
          id: s.id,
          title: s.name,
          subtitle: `${s.city} - ${s.buildings} zgrada`,
          icon: MapPin,
        })));

        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleResultClick = (result: any) => {
    setSearchOpen(false);
    setSearchTerm("");
    setSearchResults([]);
    
    if (result.type === 'tenant') {
      navigate(`/tenants`);
    } else if (result.type === 'building' || result.type === 'city' || result.type === 'street') {
      navigate('/buildings');
    }
  };

  // Reset search when dialog closes
  useEffect(() => {
    if (!searchOpen) {
      setSearchTerm("");
      setSearchResults([]);
    }
  }, [searchOpen]);

  const getRoleLabel = (userRole: string | null) => {
    switch (userRole) {
      case "admin":
        return "Administrator";
      case "upravitelj":
        return "Upravitelj";
      case "stanar":
        return "Stanar";
      default:
        return "";
    }
  };

  const getRoleVariant = (userRole: string | null): "default" | "secondary" | "destructive" | "outline" => {
    switch (userRole) {
      case "admin":
        return "destructive";
      case "upravitelj":
        return "default";
      case "stanar":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <>
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex h-16 items-center gap-2 sm:gap-4 px-4 md:px-6">
          {/* Search - Hidden on mobile, visible on desktop */}
          <div className="hidden md:block w-full max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pretraži stanare, zgrade, ulice... (Ctrl+K)"
                className="w-full pl-9"
                onClick={() => setSearchOpen(true)}
                readOnly
              />
            </div>
          </div>

          {/* Search button for mobile */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden min-w-[44px] min-h-[44px]"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-1 sm:gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative min-w-[44px] min-h-[44px]"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
            </Button>
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative min-w-[44px] min-h-[44px]"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.user_metadata?.full_name || user.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      {userRole && (
                        <Badge variant={getRoleVariant(userRole)} className="mt-2 w-fit">
                          {getRoleLabel(userRole)}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Odjavi se</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-2xl sm:max-w-[90vw] md:max-w-2xl p-0">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle>Pretraži</DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Upiši ime stanara, adresu ili grad..."
                className="w-full pl-9"
                autoFocus
              />
            </div>

            {/* Results */}
            {searching && (
              <div className="mt-4 text-sm text-muted-foreground text-center py-8">
                Pretraživanje...
              </div>
            )}

            {!searching && searchTerm.length >= 2 && searchResults.length === 0 && (
              <div className="mt-4 text-sm text-muted-foreground text-center py-8">
                Nema rezultata za "{searchTerm}"
              </div>
            )}

            {!searching && searchResults.length > 0 && (
              <ScrollArea className="mt-4 max-h-[400px]">
                <div className="space-y-1">
                  {searchResults.map((result, idx) => {
                    const Icon = result.icon;
                    return (
                      <button
                        key={`${result.type}-${result.id}-${idx}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left"
                      >
                        <div className="rounded-md bg-primary/10 p-2">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{result.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            {!searching && searchTerm.length < 2 && (
              <div className="mt-4 text-sm text-muted-foreground text-center py-8">
                Upišite najmanje 2 znaka za pretraživanje
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

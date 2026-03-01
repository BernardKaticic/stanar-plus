import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  User,
  LogOut,
  Building2,
  Users,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredSession } from "@/lib/api";
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

  // Search function - uses API
  useEffect(() => {
    const performSearch = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const results: any[] = [];
        const term = searchTerm.toLowerCase();

        // Search suvlasnici (persons) via API
        const personsRes = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/persons?search=${encodeURIComponent(searchTerm)}&pageSize=5`,
          {
            headers: {
              Authorization: `Bearer ${getStoredSession()?.accessToken ?? ""}`,
            },
          }
        );
        if (personsRes.ok) {
          const { data: persons } = await personsRes.json();
          results.push(
            ...(persons || []).slice(0, 5).map((p: any) => ({
              type: "person",
              id: p.id,
              title: p.name,
              subtitle: p.apartments?.[0]?.address || p.apartments?.[0]?.city || "",
              icon: Users,
            }))
          );
        }

        // Search buildings via locations API
        const locRes = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/cities/locations?level=building`,
          {
            headers: {
              Authorization: `Bearer ${getStoredSession()?.accessToken ?? ""}`,
            },
          }
        );
        if (locRes.ok) {
          const buildings: any[] = await locRes.json();
          const buildingResults = buildings
            .filter(
              (b: any) =>
                (b.name || "").toLowerCase().includes(term)
            )
            .slice(0, 5);
          results.push(
            ...buildingResults.map((b: any) => ({
              type: "building",
              id: b.id,
              title: b.name,
              subtitle: b.count || "",
              icon: Building2,
            }))
          );
        }

        // Search cities via locations API
        const cityRes = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/cities/locations?level=city`,
          {
            headers: {
              Authorization: `Bearer ${getStoredSession()?.accessToken ?? ""}`,
            },
          }
        );
        if (cityRes.ok) {
          const cities: any[] = await cityRes.json();
          const cityResults = cities
            .filter((c: any) => (c.name || "").toLowerCase().includes(term))
            .slice(0, 3);
          results.push(
            ...cityResults.map((c: any) => ({
              type: "city",
              id: c.id,
              title: c.name,
              subtitle: c.count || "",
              icon: MapPin,
            }))
          );
        }

        // Search streets via locations API
        const streetRes = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/cities/locations?level=street`,
          {
            headers: {
              Authorization: `Bearer ${getStoredSession()?.accessToken ?? ""}`,
            },
          }
        );
        if (streetRes.ok) {
          const streets: any[] = await streetRes.json();
          const streetResults = streets
            .filter((s: any) => (s.name || "").toLowerCase().includes(term))
            .slice(0, 3);
          results.push(
            ...streetResults.map((s: any) => ({
              type: "street",
              id: s.id,
              title: s.name,
              subtitle: s.count || "",
              icon: MapPin,
            }))
          );
        }

        setSearchResults(results);
      } catch {
        // Search failed silently - network or API error
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

    if (result.type === "person") {
      navigate(`/persons/${result.id}`);
    } else if (
      result.type === "building" ||
      result.type === "city" ||
      result.type === "street"
    ) {
      navigate("/buildings");
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

  const getRoleVariant = (
    userRole: string | null,
  ): "default" | "secondary" | "destructive" | "outline" => {
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
        <div className="flex h-11 items-center gap-2 sm:gap-3 px-3 md:px-5">
          {/* Search - Desktop */}
          <div className="hidden md:block w-full max-w-lg">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pretraži stanare, zgrade, ulice... (Ctrl+K)"
                className="w-full pl-9 cursor-pointer"
                onClick={() => setSearchOpen(true)}
                readOnly
              />
            </div>
          </div>

          {/* Search button - Mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden min-w-[32px] min-h-[32px]"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          {/* Right cluster */}
          <div className="flex items-center gap-2 pl-3 border-l">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-w-[32px] min-h-[32px]"
                >
                  <Bell className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Obavijesti</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-muted-foreground">
                  Trenutno nema novih obavijesti.
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative min-w-[32px] min-h-[32px]"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.user_metadata?.full_name || user?.full_name || user?.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      {userRole && (
                        <Badge
                          variant={getRoleVariant(userRole)}
                          className="mt-2 w-fit"
                        >
                          {getRoleLabel(userRole)}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={signOut}
                    className="cursor-pointer"
                  >
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
          <DialogHeader className="px-4 pt-3 pb-2">
            <DialogTitle>Pretraži</DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
              <div className="mt-4 text-sm text-muted-foreground text-center py-6">
                Pretraživanje...
              </div>
            )}

            {!searching && searchTerm.length >= 2 && searchResults.length === 0 && (
              <div className="mt-4 text-sm text-muted-foreground text-center py-6">
                Nema rezultata za "{searchTerm}"
              </div>
            )}

            {!searching && searchResults.length > 0 && (
              <ScrollArea className="mt-3 max-h-[380px]">
                <div className="space-y-1">
                  {searchResults.map((result, idx) => {
                    const Icon = result.icon;
                    return (
                      <button
                        key={`${result.type}-${result.id}-${idx}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground hover:[&_*]:text-accent-foreground transition-colors text-left"
                      >
                        <div className="rounded-md bg-primary/10 p-1.5">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {result.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {result.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            {!searching && searchTerm.length < 2 && (
              <div className="mt-4 text-sm text-muted-foreground text-center py-6">
                Upišite najmanje 2 znaka za pretraživanje
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

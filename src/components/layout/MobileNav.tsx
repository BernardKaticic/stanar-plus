import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  AlertCircle, 
  Menu,
  Receipt,
  ClipboardCheck,
  CreditCard,
  FileText,
  UserCog,
  ScrollText,
  UserCircle,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";

const mobileNavigation = [
  { name: "Početna", href: "/", icon: LayoutDashboard },
  { name: "Zgrade", href: "/buildings", icon: Building2 },
  { name: "Suvlasnici", href: "/tenants", icon: Users, activePaths: ["/persons"] },
  { name: "Dužnici", href: "/debtors", icon: AlertCircle },
];

const moreNavigation = [
  { name: "Predstavnici", href: "/representatives", icon: UserCircle },
  { name: "Dobavljači", href: "/suppliers", icon: Package },
  { name: "Upravljanje", href: "/admin/tenants", icon: UserCog, adminOnly: true },
  { name: "Uplatnice", href: "/payment-slips", icon: Receipt },
  { name: "Radni nalozi", href: "/work-orders", icon: ClipboardCheck },
  { name: "Financijska kartica", href: "/financial-card", icon: CreditCard },
  { name: "E-računi", href: "/e-invoices", icon: FileText },
  { name: "Odluke i ugovori", href: "/decisions", icon: ScrollText },
];

export const MobileNav = () => {
  const [moreOpen, setMoreOpen] = useState(false);
  const { userRole } = useAuth();
  const { pathname } = useLocation();

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background safe-bottom">
        <div className="grid grid-cols-5 gap-1">
          {mobileNavigation.map((item) => {
            const isActiveByPath = (item as { activePaths?: string[] }).activePaths?.some((p) =>
              pathname.startsWith(p)
            );
            return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center py-3 text-xs font-medium transition-colors min-h-[60px]",
                  isActive || isActiveByPath
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5 mb-1" />
              {item.name}
            </NavLink>
            );
          })}
          <Button
            variant="ghost"
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center py-3 text-xs font-medium min-h-[60px] h-auto rounded-none"
          >
            <Menu className="h-5 w-5 mb-1" />
            Više
          </Button>
        </div>
      </nav>

      {/* More Menu Sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Više opcija</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 space-y-1">
            {moreNavigation.map((item) => {
              if (item.adminOnly && userRole !== 'admin' && userRole !== 'upravitelj') {
                return null;
              }
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors min-h-[52px]",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground hover:[&_*]:text-accent-foreground"
                    )
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
};

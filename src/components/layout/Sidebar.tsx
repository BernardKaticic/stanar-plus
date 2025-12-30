import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Receipt, 
  AlertCircle,
  CreditCard,
  FileText, 
  UserCog, 
  ScrollText,
  ClipboardCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navigation = [
  { name: "Nadzorna ploča", href: "/", icon: LayoutDashboard },
  { name: "Zgrade", href: "/buildings", icon: Building2 },
  { name: "Stanari", href: "/tenants", icon: Users },
  { name: "Upravljanje", href: "/admin/tenants", icon: UserCog, adminOnly: true },
  { name: "Uplatnice", href: "/payment-slips", icon: Receipt },
  { name: "Dužnici", href: "/debtors", icon: AlertCircle },
  { name: "Radni nalozi", href: "/work-orders", icon: ClipboardCheck },
  { name: "Financijska kartica", href: "/financial-card", icon: CreditCard },
  { name: "E-računi", href: "/e-invoices", icon: FileText },
  { name: "Predstavnici", href: "/representatives", icon: UserCog },
  { name: "Odluke i ugovori", href: "/decisions", icon: ScrollText },
];

export const Sidebar = () => {
  const { userRole } = useAuth();
  
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-sidebar">
      <div className="flex h-16 items-center px-6">
        <Building2 className="h-8 w-8 text-primary" />
        <span className="ml-2 text-xl font-bold">STANAR</span>
      </div>
      
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          // Skip admin-only items if user is not admin or upravitelj
          if (item.adminOnly && userRole !== 'admin' && userRole !== 'upravitelj') {
            return null;
          }
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:translate-x-1"
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>
      
      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          <p className="font-medium">© 2025 STANAR</p>
          <p>Upravljanje zgradama</p>
        </div>
      </div>
    </aside>
  );
};

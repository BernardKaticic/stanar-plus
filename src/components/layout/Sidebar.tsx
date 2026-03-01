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
  ClipboardCheck,
  History,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const primaryNav = [
  { name: "Nadzorna ploča", href: "/", icon: LayoutDashboard },
  { name: "Zgrade", href: "/buildings", icon: Building2 },
  { name: "Karta", href: "/map", icon: MapPin },
  { name: "Suvlasnici", href: "/tenants", icon: Users },
  { name: "Dužnici", href: "/debtors", icon: AlertCircle },
  { name: "Radni nalozi", href: "/work-orders", icon: ClipboardCheck },
];

const financeNav = [
  { name: "Uplatnice", href: "/payment-slips", icon: Receipt },
  { name: "Financijska kartica", href: "/financial-card", icon: CreditCard },
  { name: "E-računi", href: "/e-invoices", icon: FileText },
];

const peopleNav = [
  { name: "Odluke i ugovori", href: "/decisions", icon: ScrollText },
  { name: "Upravljanje", href: "/admin/tenants", icon: UserCog, adminOnly: true },
  { name: "Audit log", href: "/audit-log", icon: History, adminOnly: true },
];

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const NavSection = ({
  label,
  items,
  userRole,
}: {
  label?: string;
  items: NavItem[];
  userRole: string | null | undefined;
}) => {
  const filtered = items.filter(
    (item) =>
      !item.adminOnly ||
      userRole === "admin" ||
      userRole === "upravitelj",
  );

  if (filtered.length === 0) return null;

  return (
    <div className="space-y-1">
      {label && (
        <p className="px-3 pt-3 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground/80 uppercase">
          {label}
        </p>
      )}
      {filtered.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          end={item.href === "/"}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60",
            )
          }
        >
          <item.icon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{item.name}</span>
        </NavLink>
      ))}
    </div>
  );
};

export const Sidebar = () => {
  const { userRole, user } = useAuth();

  return (
    <aside className="hidden md:flex md:w-56 md:flex-col border-r bg-sidebar">
      {/* Brand header – naziv aplikacije + organizacija */}
      <div className="flex flex-col px-3 py-3 gap-0.5">
        <div className="flex h-9 items-center">
          <Building2 className="h-4 w-4 text-primary shrink-0" />
          <span className="ml-2 text-[13px] font-semibold tracking-tight">STANAR</span>
        </div>
        {user?.organization_name && (
          <p className="text-[11px] text-muted-foreground truncate pl-6" title={user.organization_name}>
            {user.organization_name}
          </p>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-2">
        <NavSection label="Glavno" items={primaryNav} userRole={userRole} />
        <NavSection label="Financije" items={financeNav} userRole={userRole} />
        <NavSection label="Osobe i pravni" items={peopleNav} userRole={userRole} />
      </nav>

      <div className="border-t px-3 py-2.5">
        <p className="text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} STANAR
        </p>
        <p className="text-[11px] text-muted-foreground">Upravljanje zgradama</p>
      </div>
    </aside>
  );
};

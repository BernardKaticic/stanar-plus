import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  Receipt,
  AlertCircle,
  CreditCard,
  Wallet,
  FileText,
  UserCog,
  ScrollText,
  ClipboardCheck,
  History,
  UserCircle,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

/** Za testiranje: prikaži samo dovršene ekrane. Postavi VITE_MENU_READY_ONLY=false za puni meni. */
const showOnlyReadyScreens = import.meta.env.VITE_MENU_READY_ONLY !== "false";

const primaryNav = [
  { name: "Nadzorna ploča", href: "/", icon: LayoutDashboard },
  { name: "Zgrade", href: "/buildings", icon: Building2 },
  { name: "Suvlasnici", href: "/tenants", icon: Users, activePaths: ["/persons"] },
  { name: "Dužnici", href: "/debtors", icon: AlertCircle },
  { name: "Radni nalozi", href: "/work-orders", icon: ClipboardCheck },
];

const financeNav = [
  { name: "Uplatnice", href: "/payment-slips", icon: Receipt },
  { name: "Financijska kartica", href: "/financial-card", icon: CreditCard },
  // { name: "Stanje računa", href: "/account-statement", icon: Wallet }, // sakriveno zasad
  { name: "Računi", href: "/e-invoices", icon: FileText },
  { name: "Dobavljači", href: "/suppliers", icon: Package },
];

const peopleNav = [
  { name: "Predstavnici", href: "/representatives", icon: UserCircle },
  { name: "Odluke i ugovori", href: "/decisions", icon: ScrollText },
  { name: "Upravljanje", href: "/admin/tenants", icon: UserCog, adminOnly: true },
  { name: "Audit log", href: "/audit-log", icon: History, adminOnly: true },
];

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  /** Dodatni pathovi koji aktiviraju ovu stavku (npr. /persons za Suvlasnici) */
  activePaths?: string[];
};

const NavSection = ({
  label,
  items,
  userRole,
  pathname,
}: {
  label?: string;
  items: NavItem[];
  userRole: string | null | undefined;
  pathname: string;
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
      {filtered.map((item) => {
        const isActiveByPath = item.activePaths?.some((p) => pathname.startsWith(p));
        return (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === "/"}
            className={({ isActive }) => {
              const active = isActive || isActiveByPath;
              return cn(
                "flex items-center gap-2 rounded-r-md py-2 pl-3 pr-3 text-[13px] font-medium transition-colors border-l-2 -ml-px",
                active
                  ? "border-l-primary bg-primary/5 text-foreground"
                  : "border-l-transparent text-sidebar-foreground hover:bg-muted/50",
              );
            }}
          >
            <item.icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{item.name}</span>
          </NavLink>
        );
      })}
    </div>
  );
};

export const Sidebar = () => {
  const { userRole, user } = useAuth();
  const { pathname } = useLocation();

  return (
    <aside className="hidden md:flex md:w-56 md:flex-col border-r bg-sidebar">
      {/* Brand header – naziv aplikacije + organizacija */}
      <div className="flex flex-col gap-0.5 border-b border-border/60 px-3 py-4">
        <div className="flex h-9 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" strokeWidth={2} />
          </div>
          <span className="text-[13px] font-semibold tracking-tight text-foreground">Zgrada+</span>
        </div>
        {user?.organization_name && (
          <p className="text-[11px] text-muted-foreground truncate pl-10" title={user.organization_name}>
            {user.organization_name}
          </p>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-2">
        <NavSection label="Osnovno" items={primaryNav} userRole={userRole} pathname={pathname} />
        {!showOnlyReadyScreens && (
          <>
            <NavSection label="Financije" items={financeNav} userRole={userRole} pathname={pathname} />
            <NavSection label="Ostalo" items={peopleNav} userRole={userRole} pathname={pathname} />
          </>
        )}
      </nav>

      <div className="border-t px-3 py-2.5">
        <p className="text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Zgrada+
        </p>
        <p className="text-[11px] text-muted-foreground">Upravljanje zgradama</p>
      </div>
    </aside>
  );
};

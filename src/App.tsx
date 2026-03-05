import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import Dashboard from "./pages/Dashboard";
import Buildings from "./pages/Buildings";
import Tenants from "./pages/Tenants";
import { TenantDetailRedirect } from "./pages/TenantDetailRedirect";
import PersonDetail from "./pages/PersonDetail";
import AdminTenants from "./pages/AdminTenants";
import Debtors from "./pages/Debtors";
import PaymentSlips from "./pages/PaymentSlips";
import WorkOrders from "./pages/WorkOrders";
import WorkOrderDetail from "./pages/WorkOrderDetail";
import FinancialCard from "./pages/FinancialCard";
import Representatives from "./pages/Representatives";
import Suppliers from "./pages/Suppliers";
import AuditLog from "./pages/AuditLog";
import EInvoices from "./pages/EInvoices";
import Decisions from "./pages/Decisions";
import MapPage from "./pages/Map";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000, // 30s
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div className="flex h-screen w-full overflow-hidden">
                    <Sidebar />
                    <div className="flex flex-1 flex-col overflow-hidden">
                      <Header />
                      <main className="flex-1 overflow-y-auto bg-muted/20 px-4 py-5 pb-[calc(5rem+env(safe-area-inset-bottom))] md:px-6 md:py-6 md:pb-6">
                        <div className="mx-auto w-full max-w-6xl">
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/buildings" element={<Buildings />} />
                          <Route path="/tenants" element={<Tenants />} />
                          <Route path="/tenants/:id" element={<TenantDetailRedirect />} />
                          <Route path="/persons/:id" element={<PersonDetail />} />
                          <Route 
                            path="/admin/tenants" 
                            element={
                              <ProtectedRoute allowedRoles={["admin", "upravitelj"]}>
                                <AdminTenants />
                              </ProtectedRoute>
                            } 
                          />
                          <Route path="/payment-slips" element={<PaymentSlips />} />
                          <Route path="/debtors" element={<Debtors />} />
                          <Route path="/work-orders" element={<WorkOrders />} />
                          <Route path="/work-orders/:id" element={<WorkOrderDetail />} />
                          <Route path="/financial-card" element={<FinancialCard />} />
                          <Route path="/map" element={<MapPage />} />
                          <Route path="/e-invoices" element={<EInvoices />} />
                          <Route path="/representatives" element={<Representatives />} />
                          <Route path="/suppliers" element={<Suppliers />} />
                          <Route path="/audit-log" element={<ProtectedRoute allowedRoles={["admin"]}><AuditLog /></ProtectedRoute>} />
                          <Route path="/decisions" element={<Decisions />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                        </div>
                      </main>
                      <MobileNav />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

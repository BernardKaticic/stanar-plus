/**
 * Zajednički tipovi za API odgovore – smanjenje any i bolja tipizacija.
 */

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
}

export interface DashboardStats {
  period?: 'ytd' | 'last12m';
  periodLabel?: string;
  totalCharged?: number;
  totalPaid?: number;
  collectionRate?: number;
  debtorsOver50?: number;
  openWorkOrders?: number;
  urgentWorkOrders?: number;
  outstandingBalance?: number;
  averageDaysOverdue?: number;
  upcomingCharges?: number;
  bankImportsPending?: number;
  invoicesDueThisWeek?: number;
  inspectionsThisWeek?: number;
  buildingCount?: number;
  cityCount?: number;
  apartmentCount?: number;
  tenantCount?: number;
  occupiedUnitCount?: number;
  occupancyRate?: number;
  emptyUnits?: number;
  ageingBuckets?: {
    d0_30?: { count: number; amount: number };
    d31_60?: { count: number; amount: number };
    d61_90?: { count: number; amount: number };
    d90p?: { count: number; amount: number };
  };
  monthlyCollections?: Array<{ month: string; charged: number; paid: number }>;
  topBuildings?: Array<{ building: string; amount: number }>;
  expenseBreakdown?: Array<{ key: string; label: string; value: number }>;
  [key: string]: unknown;
}

export interface DashboardActivity {
  type?: string;
  text?: string;
  time?: string | null;
  status?: 'success' | 'warning' | 'info';
  [key: string]: unknown;
}

export interface DashboardDebtor {
  id: string;
  name?: string;
  amount?: string;
  amountNum?: number;
  months?: number;
  location?: string;
  [key: string]: unknown;
}

export interface DashboardStatement {
  currentBalance?: string;
  previousYearCarryover?: string;
  totalCharged?: string;
  totalPaid?: string;
  totalExpenses?: string;
  transactions?: Array<{ date: string; type: string; description: string; amount: string; balance: string }>;
  [key: string]: unknown;
}

export interface FinancialByBuilding {
  currentBalance?: string;
  totalCharged?: string;
  totalPaid?: string;
  totalChargedAll?: string;
  totalPaidAll?: string;
  chargeEntryCount?: number;
  paymentEntryCount?: number;
  previousYearCarryover?: string;
  totalExpenses?: string;
  transactions?: Array<{ date: string; type: string; description: string; amount: string; balance: string }>;
  [key: string]: unknown;
}

export interface PaymentSlipHistoryItem {
  id?: string;
  period?: string;
  periodMonth?: string;
  date?: string;
  count?: number;
  amount?: number;
  email?: number;
  print?: number;
  [key: string]: unknown;
}

export interface AuditLogItem {
  id: string;
  tableName?: string;
  recordId?: string;
  action?: string;
  createdAt?: string;
  newValues?: Record<string, unknown>;
  oldValues?: Record<string, unknown>;
  [key: string]: unknown;
}

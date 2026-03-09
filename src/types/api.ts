/**
 * Zajednički tipovi za API odgovore – smanjenje any i bolja tipizacija.
 */

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
}

export interface DashboardStats {
  totalBuildings?: number;
  totalApartments?: number;
  totalTenants?: number;
  outstandingBalance?: number;
  averageDaysOverdue?: number;
  [key: string]: unknown;
}

export interface DashboardActivity {
  id?: string;
  type?: string;
  description?: string;
  createdAt?: string;
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

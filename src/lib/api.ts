/**
 * API klijent za Stanar Plus backend
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface ApiError {
  error: string;
  message: string;
  details?: Array< { field: string; message: string } >;
}

function getStoredTokens() {
  try {
    const data = localStorage.getItem('stanar_session');
    if (!data) return null;
    const parsed = JSON.parse(data);
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
    };
  } catch {
    return null;
  }
}

function setStoredTokens(
  accessToken: string,
  refreshToken: string,
  user: any,
  role: string,
  organizationName?: string | null
) {
  const u = user ? { ...user, organization_name: organizationName ?? user.organization_name } : user;
  localStorage.setItem(
    'stanar_session',
    JSON.stringify({
      accessToken,
      refreshToken,
      user: u,
      role,
      organizationName: organizationName ?? u?.organization_name,
    })
  );
}

function clearStoredTokens() {
  localStorage.removeItem('stanar_session');
}

export function getStoredSession() {
  try {
    const data = localStorage.getItem('stanar_session');
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearSession() {
  clearStoredTokens();
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const tokens = getStoredTokens();
    if (!tokens?.refreshToken) return false;
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });
      if (!res.ok) {
        clearStoredTokens();
        return false;
      }
      const data = await res.json();
      const session = getStoredSession();
      setStoredTokens(
        data.accessToken,
        data.refreshToken,
        data.user || session?.user,
        data.role || session?.role,
        data.organization_name
      );
      return true;
    } catch {
      clearStoredTokens();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const tokens = getStoredTokens();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (tokens?.accessToken) {
    headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && tokens?.refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newTokens = getStoredTokens();
      headers.Authorization = `Bearer ${newTokens!.accessToken}`;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    }
  }

  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(res.ok ? 'Invalid response' : text || res.statusText);
  }

  if (!res.ok) {
    const err = new Error(json?.message || res.statusText) as Error & {
      status?: number;
      body?: ApiError;
    };
    err.status = res.status;
    err.body = json;
    throw err;
  }

  return json as T;
}

export async function authLogin(email: string, password: string) {
  const data = await api<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string; user_metadata: { full_name: string } };
    role: string;
    organization_id?: string | null;
    organization_name?: string | null;
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return data;
}

export async function authRegister(
  email: string,
  password: string,
  fullName: string
) {
  const data = await api<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string; user_metadata: { full_name: string } };
    role: string;
    organization_id?: string | null;
    organization_name?: string | null;
  }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, fullName }),
  });
  return data;
}

export async function authLogout() {
  const session = getStoredSession();
  try {
    if (session?.refreshToken) {
      await api('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
    }
  } finally {
    clearStoredTokens();
  }
}

export async function authMe() {
  const data = await api<{
    user: { id: string; email: string; user_metadata: { full_name: string } };
    role: string;
  }>('/auth/me');
  return data;
}

export const buildingsApi = {
  getTree: () => api<any[]>('/cities/tree'),
  getCities: () => api<any[]>('/cities'),
  createCity: (data: { name: string }) => api('/cities', { method: 'POST', body: JSON.stringify(data) }),
  updateCity: (id: string, data: { name: string }) => api(`/cities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCity: (id: string) => api(`/cities/${id}`, { method: 'DELETE' }),
  createStreet: (data: { cityId: string; name: string }) => api('/streets', { method: 'POST', body: JSON.stringify(data) }),
  updateStreet: (id: string, data: { name: string }) => api(`/streets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStreet: (id: string) => api(`/streets/${id}`, { method: 'DELETE' }),
  createBuilding: (data: any) => api('/buildings', { method: 'POST', body: JSON.stringify(data) }),
  updateBuilding: (id: string, data: any) => api(`/buildings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBuilding: (id: string) => api(`/buildings/${id}`, { method: 'DELETE' }),
  createApartment: (data: {
    building_id: string;
    number: string;
    floor?: string | null;
    area_m2?: number;
    area?: number;
    notes?: string | null;
  }) =>
    api('/apartments', {
      method: 'POST',
      body: JSON.stringify({
        building_id: data.building_id,
        number: data.number,
        floor: data.floor ?? null,
        area_m2: data.area_m2 ?? data.area ?? 0,
        notes: data.notes ?? null,
      }),
    }),
  updateApartment: (id: string, data: { number?: string; floor?: string | null; area_m2?: number; area?: number; notes?: string | null }) =>
    api(`/apartments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        number: data.number,
        floor: data.floor ?? null,
        area_m2: data.area_m2 ?? data.area,
        notes: data.notes ?? null,
      }),
    }),
  deleteApartment: (id: string) => api(`/apartments/${id}`, { method: 'DELETE' }),
};

export const personsApi = {
  getAll: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: 'all' | 'paid' | 'overdue' | 'pending';
    deliveryMethod?: 'all' | 'email' | 'pošta';
    city?: string;
  }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set('page', String(params.page));
    if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
    if (params?.search) sp.set('search', params.search || '');
    if (params?.status && params.status !== 'all') sp.set('status', params.status);
    if (params?.deliveryMethod && params.deliveryMethod !== 'all') sp.set('deliveryMethod', params.deliveryMethod);
    if (params?.city) sp.set('city', params.city);
    return api<{ data: Person[]; totalCount: number }>('/persons?' + sp.toString());
  },
  getById: (id: string) => api<PersonDetail>('/persons/' + id),
};

export type Person = {
  id: string;
  name: string;
  email?: string | null;
  oib?: string | null;
  phone?: string | null;
  deliveryMethod?: string | null;
  apartments: PersonApartment[];
  apartmentsCount: number;
  totalBalance: string;
  totalBalanceNum: number;
  totalMonthlyRate: string;
  status: string;
};

export type PersonApartment = {
  tenantId: string;
  apartmentId: string | null;
  address: string | null;
  city: string | null;
  area: string | null;
  monthlyRate: string | null;
  balance: string;
  balanceNum: number;
  status: string;
};

export type PersonDetail = Person & {
  totalApartments: number;
  apartments: (PersonApartment & {
    apartmentNumber?: string;
    floor?: number;
    size_m2?: string;
    monthlyRateNum?: number;
    feeBreakdown?: any;
    building?: any;
    transactions?: any[];
  })[];
};

export const tenantsApi = {
  getAll: (params?: { page?: number; pageSize?: number; search?: string }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set('page', String(params.page));
    if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
    if (params?.search) sp.set('search', params.search || '');
    return api<{ data: any[]; totalCount: number }>('/tenants?' + sp.toString());
  },
  getById: (id: string) => api<any>('/tenants/' + id),
  create: (data: {
    apartment_id: string;
    name: string;
    oib?: string | null;
    email?: string;
    phone?: string;
    user_id?: string;
    delivery_method?: 'email' | 'pošta' | 'both' | null;
    person_id?: string | number;
  }) => api('/tenants', { method: 'POST', body: JSON.stringify(data) }),
  update: (
    id: string,
    data: {
      name?: string;
      oib?: string | null;
      email?: string;
      phone?: string;
      apartment_id?: string | null;
      delivery_method?: 'email' | 'pošta' | 'both' | null;
    }
  ) =>
    api(`/tenants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => api(`/tenants/${id}`, { method: 'DELETE' }),
};

export const debtorsApi = {
  getAll: (params?: { page?: number; pageSize?: number; search?: string }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set('page', String(params.page));
    if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
    if (params?.search) sp.set('search', params.search || '');
    return api<{ data: any[]; totalCount: number }>('/debtors?' + sp.toString());
  },
  getStats: () => api<{ totalCount: number; totalDebt: number; remindersThisMonth: number; over3Months: number }>('/debtors/stats'),
  getReminders: (params?: { limit?: number; offset?: number }) => {
    const sp = new URLSearchParams();
    if (params?.limit) sp.set('limit', String(params.limit));
    if (params?.offset) sp.set('offset', String(params.offset));
    return api<{ data: any[]; totalCount: number }>('/debtors/reminders' + (sp.toString() ? '?' + sp.toString() : ''));
  },
  sendReminder: (tenantId: string) =>
    api<{ message: string }>(`/debtors/${tenantId}/send-reminder`, { method: 'POST' }),
  sendReminderByPerson: (personId: string) =>
    api<{ message: string }>(`/debtors/person/${personId}/send-reminder`, { method: 'POST' }),
};

export const workOrdersApi = {
  getAll: (params?: { page?: number; pageSize?: number; search?: string; status?: string; priority?: string }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set('page', String(params.page));
    if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
    if (params?.search) sp.set('search', params.search || '');
    if (params?.status) sp.set('status', params.status);
    if (params?.priority) sp.set('priority', params.priority);
    return api<{ data: any[]; totalCount: number }>('/work-orders?' + sp.toString());
  },
  getStats: (params?: { search?: string; status?: string; priority?: string }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.set('search', params.search || '');
    if (params?.status) sp.set('status', params.status);
    if (params?.priority) sp.set('priority', params.priority);
    return api<{ total: number; open: number; inProgress: number; completed: number; urgent: number }>(
      '/work-orders/stats' + (sp.toString() ? '?' + sp.toString() : '')
    );
  },
  getById: (id: string) => api<any>(`/work-orders/${id}`),
  create: (data: any) => api('/work-orders', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => api(`/work-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const dashboardApi = {
  getStats: () => api<any>('/dashboard/stats'),
  getActivities: () => api<any[]>('/dashboard/activities'),
  getDebtors: () => api<any[]>('/dashboard/debtors'),
  getStatement: () => api<any>('/dashboard/statement'),
};

export const paymentSlipsApi = {
  getAll: (params?: { page?: number; pageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set('page', String(params.page));
    if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
    return api<{ data: any[]; totalCount: number }>('/payment-slips?' + sp.toString());
  },
  generate: (data: {
    chargeLevel: string;
    locationId: string;
    periodType: 'current' | 'single' | 'range';
    singleMonth?: string;
    periodFrom?: string;
    periodTo?: string;
    sendEmail: boolean;
    sendPrint: boolean;
  }) =>
    api<{ created: number; slips: { id: number; period: string; count: number; amount: number }[]; message: string }>(
      '/payment-slips/generate',
      { method: 'POST', body: JSON.stringify(data) }
    ),
};

export const otherIncomeApi = {
  getAll: () => api<any[]>('/other-income'),
  create: (data: any) => api('/other-income', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => api(`/other-income/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => api(`/other-income/${id}`, { method: 'DELETE' }),
};

export const representativesApi = {
  getAll: (params?: { search?: string }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.set('search', params.search);
    return api<any[]>('/representatives?' + sp.toString());
  },
  create: (data: any) => api('/representatives', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => api(`/representatives/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => api(`/representatives/${id}`, { method: 'DELETE' }),
};

export const suppliersApi = {
  getAll: (params?: { search?: string; category?: string }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.set('search', params.search || '');
    if (params?.category) sp.set('category', params.category);
    return api<any[]>('/suppliers?' + sp.toString());
  },
  create: (data: any) => api('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => api(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => api(`/suppliers/${id}`, { method: 'DELETE' }),
};

export const invoicesApi = {
  getAll: (params?: { status?: string; search?: string }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status || '');
    if (params?.search) sp.set('search', params.search || '');
    return api<any[]>('/invoices?' + sp.toString());
  },
  create: (data: any) => api('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => api(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => api(`/invoices/${id}`, { method: 'DELETE' }),
};

export const locationsApi = {
  getByLevel: (level: 'city' | 'street' | 'building' | 'owner') =>
    api<any[]>('/cities/locations?level=' + level),
};

export const apartmentsApi = {
  getAll: () => api<any[]>('/apartments'),
  assignTenant: (apartmentId: string, userId: string | null) =>
    api(`/apartments/${apartmentId}/assign-tenant`, { method: 'PUT', body: JSON.stringify({ userId }) }),
};

export const usersApi = {
  getByRole: (role: string) => api<any[]>('/users?role=' + role),
  createStanar: (data: { email: string; full_name: string }) =>
    api<{ id: string; email: string; tempPassword: string | null; existing: boolean }>(
      '/users/create-stanar',
      { method: 'POST', body: JSON.stringify(data) }
    ),
};

export const auditLogApi = {
  getAll: (params?: { page?: number; pageSize?: number; table?: string }) => {
    const sp = new URLSearchParams();
    if (params?.page) sp.set('page', String(params.page));
    if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
    if (params?.table) sp.set('table', params.table);
    return api<{ data: any[]; totalCount: number }>('/audit-log?' + sp.toString());
  },
};

export const financialApi = {
  getByBuilding: (buildingId: string, from?: string, to?: string) => {
    const sp = new URLSearchParams();
    sp.set('buildingId', buildingId);
    if (from) sp.set('from', from);
    if (to) sp.set('to', to);
    return api<any>('/dashboard/financial?' + sp.toString());
  },
};

export { setStoredTokens };

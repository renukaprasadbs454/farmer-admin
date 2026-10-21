const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9443/api/v1';

let authToken: string | null = localStorage.getItem('fm_admin_token');

export function setAuthToken(token: string) {
  authToken = token;
  if (token) {
    localStorage.setItem('fm_admin_token', token);
  } else {
    localStorage.removeItem('fm_admin_token');
  }
}

export function getAuthToken() {
  return authToken || localStorage.getItem('fm_admin_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const currentToken = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (response.status === 401 || response.status === 403) {
    // Token expired or invalid
    setAuthToken('');
  }

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

// Admin Login helper
export async function loginAdminApi(adminId: string, password: string) {
  const loginRes: any = await request('/auth/admin-login', {
    method: 'POST',
    body: JSON.stringify({ adminId: adminId.trim(), password }),
  });

  if (loginRes.data?.token) {
    setAuthToken(loginRes.data.token);
    return loginRes.data;
  }
  return loginRes;
}

export async function autoLoginAdmin() {
  const existingToken = getAuthToken();
  if (existingToken) {
    return { token: existingToken };
  }
  return null;
}

// Admin User Creation (SUPER_ADMIN only)
export async function createAdminUserApi(payload: {
  phoneNumber: string;
  fullName: string;
  adminRole: 'FRANCHISE_ADMIN' | 'MODERATOR';
  regionId?: string;
}) {
  return request<any>('/auth/admin-users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Regions API
export async function fetchRegions() {
  return request<any>('/regions');
}

export async function createRegionApi(payload: {
  name: string;
  state: string;
  district: string;
  pincodes?: string[];
  franchiseOwnerName?: string;
  franchiseContact?: string;
  commissionPercentage?: number;
}) {
  return request<any>('/regions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Users API by Segment (Farmers, Sellers, Servicemen, Labours, Admins)
export async function fetchUsersBySegment(role?: string, approvalStatus?: string, regionId?: string, includeInactive?: boolean) {
  const params = new URLSearchParams();
  if (role) params.append('role', role);
  if (approvalStatus) params.append('approvalStatus', approvalStatus);
  if (regionId) params.append('regionId', regionId);
  if (includeInactive) params.append('includeInactive', 'true');

  return request<any>(`/users?${params.toString()}`);
}

export async function updateUserProfileApi(profileId: string, payload: Record<string, any>) {
  return request<any>(`/users/${profileId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteUserProfileApi(profileId: string) {
  return request<any>(`/users/${profileId}`, {
    method: 'DELETE',
  });
}

export async function restoreUserProfileApi(profileId: string) {
  return request<any>(`/users/${profileId}/restore`, {
    method: 'PATCH',
  });
}

export async function approveUserStatus(profileId: string, approvalStatus: 'APPROVED' | 'REJECTED' | 'SUSPENDED') {
  return request<any>(`/users/${profileId}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ approvalStatus }),
  });
}

// Products API
export async function fetchProducts(regionId?: string, isApproved?: boolean) {
  const params = new URLSearchParams();
  if (regionId) params.append('regionId', regionId);
  if (isApproved !== undefined) params.append('isApproved', String(isApproved));

  return request<any>(`/products?${params.toString()}`);
}

export async function approveProductStatus(productId: string, isApproved: boolean) {
  return request<any>(`/products/${productId}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ isApproved }),
  });
}

export async function updateProductApi(productId: string, payload: Record<string, any>) {
  return request<any>(`/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteProductApi(productId: string) {
  return request<any>(`/products/${productId}`, {
    method: 'DELETE',
  });
}

export async function fetchOrders(regionId?: string, status?: string) {
  const params = new URLSearchParams();
  if (regionId) params.append('regionId', regionId);
  if (status && status !== 'ALL') params.append('status', status);

  return request<any>(`/orders?${params.toString()}`);
}

export async function updateOrderStatusApi(orderId: string, payload: { orderStatus?: string; paymentStatus?: string }) {
  return request<any>(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

// Labour & Services API
export async function fetchLabourJobs(regionId?: string, status?: string) {
  const params = new URLSearchParams();
  if (regionId) params.append('regionId', regionId);
  if (status) params.append('status', status);

  return request<any>(`/services/jobs?${params.toString()}`);
}

export async function assignLabourToJobApi(jobId: string, labourProfileId: string) {
  return request<any>(`/services/jobs/${jobId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ labourProfileId }),
  });
}

// Payments & Franchise Ledger API
export async function fetchPayments(regionId?: string) {
  const params = new URLSearchParams();
  if (regionId) params.append('regionId', regionId);

  return request<any>(`/payments?${params.toString()}`);
}

// Available Catalog Services (Vehicles & Labour)
export async function fetchAvailableServices(category?: string) {
  const params = new URLSearchParams();
  if (category) params.append('category', category);

  return request<any>(`/services/available?${params.toString()}`);
}

export async function createAvailableServiceApi(payload: {
  title: string;
  category: 'VEHICLE' | 'LABOUR';
  description?: string;
  iconName?: string;
}) {
  return request<any>('/services/available', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAvailableServiceApi(
  id: string,
  payload: {
    title?: string;
    category?: 'VEHICLE' | 'LABOUR';
    description?: string;
    iconName?: string;
  }
) {
  return request<any>(`/services/available/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteAvailableServiceApi(id: string) {
  return request<any>(`/services/available/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchPartnerServiceOfferings(params: {
  regionId?: string;
  category?: 'LABOUR' | 'VEHICLE' | 'ALL';
  approvalStatus?: string;
  includeInactive?: boolean;
} = {}) {
  const searchParams = new URLSearchParams();
  if (params.regionId) searchParams.append('regionId', params.regionId);
  if (params.category && params.category !== 'ALL') searchParams.append('category', params.category);
  if (params.approvalStatus && params.approvalStatus !== 'ALL') searchParams.append('approvalStatus', params.approvalStatus);
  if (params.includeInactive) searchParams.append('includeInactive', 'true');

  return request<any>(`/services/offerings?${searchParams.toString()}`);
}

export async function approvePartnerServiceOfferingApi(id: string, approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED') {
  return request<any>(`/services/offerings/${id}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ approvalStatus }),
  });
}

export async function updatePartnerServiceOfferingApi(id: string, payload: Record<string, any>) {
  return request<any>(`/services/offerings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deletePartnerServiceOfferingApi(id: string) {
  return request<any>(`/services/offerings/${id}`, {
    method: 'DELETE',
  });
}

// ── Farmer Chat & Help Desk Endpoints ──
export async function fetchAdminConversationsApi(status?: string, search?: string) {
  const params = new URLSearchParams();
  if (status && status !== 'ALL') params.append('status', status);
  if (search) params.append('search', search);
  return request<any>(`/chat/admin/conversations?${params.toString()}`);
}

export async function fetchAdminConversationDetailsApi(id: string) {
  return request<any>(`/chat/admin/conversations/${id}`);
}

export async function replyAdminConversationApi(id: string, text: string, mediaUrl?: string) {
  return request<any>(`/chat/admin/conversations/${id}/reply`, {
    method: 'POST',
    body: JSON.stringify({ text, mediaUrl }),
  });
}

// ── Agri Finance & Assets: Loans API ──
export async function fetchLoanOffers(loanType?: string, isActive?: boolean) {
  const params = new URLSearchParams();
  if (loanType && loanType !== 'ALL') params.append('loanType', loanType);
  if (isActive !== undefined) params.append('isActive', String(isActive));
  return request<any>(`/loans/offers?${params.toString()}`);
}

export async function createLoanOfferApi(payload: Record<string, any>) {
  return request<any>('/loans/offers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateLoanOfferApi(id: string, payload: Record<string, any>) {
  return request<any>(`/loans/offers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteLoanOfferApi(id: string) {
  return request<any>(`/loans/offers/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchLoanApplications(status?: string, loanType?: string, search?: string) {
  const params = new URLSearchParams();
  if (status && status !== 'ALL') params.append('status', status);
  if (loanType && loanType !== 'ALL') params.append('loanType', loanType);
  if (search) params.append('search', search);
  return request<any>(`/loans/applications?${params.toString()}`);
}

export async function updateLoanApplicationStatusApi(id: string, payload: { status: string; approvedAmount?: number; adminRemarks?: string }) {
  return request<any>(`/loans/applications/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

// ── Agri Finance & Assets: Crop Insurance API ──
export async function fetchInsuranceOffers(insuranceType?: string, isActive?: boolean) {
  const params = new URLSearchParams();
  if (insuranceType && insuranceType !== 'ALL') params.append('insuranceType', insuranceType);
  if (isActive !== undefined) params.append('isActive', String(isActive));
  return request<any>(`/insurance/offers?${params.toString()}`);
}

export async function createInsuranceOfferApi(payload: Record<string, any>) {
  return request<any>('/insurance/offers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateInsuranceOfferApi(id: string, payload: Record<string, any>) {
  return request<any>(`/insurance/offers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteInsuranceOfferApi(id: string) {
  return request<any>(`/insurance/offers/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchInsuranceApplications(status?: string, cropSeason?: string, search?: string) {
  const params = new URLSearchParams();
  if (status && status !== 'ALL') params.append('status', status);
  if (cropSeason && cropSeason !== 'ALL') params.append('cropSeason', cropSeason);
  if (search) params.append('search', search);
  return request<any>(`/insurance/applications?${params.toString()}`);
}

export async function updateInsuranceApplicationStatusApi(id: string, payload: { status: string; policyNumber?: string; adminRemarks?: string; claimStatus?: string }) {
  return request<any>(`/insurance/applications/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

// ── Agri Finance & Assets: Crop Stock Market (Invest) API ──
export async function fetchCropCommodities(category?: string, search?: string) {
  const params = new URLSearchParams();
  if (category && category !== 'ALL') params.append('category', category);
  if (search) params.append('search', search);
  return request<any>(`/invest/crops?${params.toString()}`);
}

export async function createCropCommodityApi(payload: Record<string, any>) {
  return request<any>('/invest/crops', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCropPriceApi(id: string, newPrice: number, remarks?: string) {
  return request<any>(`/invest/crops/${id}/price`, {
    method: 'PATCH',
    body: JSON.stringify({ newPrice, remarks }),
  });
}

export async function updateCropCommodityApi(id: string, payload: Record<string, any>) {
  return request<any>(`/invest/crops/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteCropCommodityApi(id: string) {
  return request<any>(`/invest/crops/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchInvestAdminOverviewApi() {
  return request<any>('/invest/admin/overview');
}

// ── Agri Finance & Assets: Warehouse Management API ──
export async function fetchWarehouseListings(warehouseType?: string, district?: string, search?: string) {
  const params = new URLSearchParams();
  if (warehouseType && warehouseType !== 'ALL') params.append('warehouseType', warehouseType);
  if (district) params.append('district', district);
  if (search) params.append('search', search);
  return request<any>(`/warehouses/listings?${params.toString()}`);
}

export async function createWarehouseListingApi(payload: Record<string, any>) {
  return request<any>('/warehouses/listings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateWarehouseListingApi(id: string, payload: Record<string, any>) {
  return request<any>(`/warehouses/listings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteWarehouseListingApi(id: string) {
  return request<any>(`/warehouses/listings/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchWarehouseBookings(status?: string, warehouseId?: string, search?: string) {
  const params = new URLSearchParams();
  if (status && status !== 'ALL') params.append('status', status);
  if (warehouseId && warehouseId !== 'ALL') params.append('warehouseId', warehouseId);
  if (search) params.append('search', search);
  return request<any>(`/warehouses/bookings?${params.toString()}`);
}

export async function assignWarehouseBookingApi(id: string, payload: { status: string; assignedBayNumber?: string; adminRemarks?: string }) {
  return request<any>(`/warehouses/bookings/${id}/assign`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}


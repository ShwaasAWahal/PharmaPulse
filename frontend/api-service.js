// ============================================
// API SERVICE - AUTHENTICATED API CALLS
// ============================================

class APIService {
    constructor(baseURL = 'http://localhost:5000/api') {
        this.baseURL = baseURL;
    }

    getHeaders(additionalHeaders = {}) {
        const headers = { 'Content-Type': 'application/json', ...additionalHeaders };
        const accessToken = jwtManager.getAccessToken();
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const method = options.method || 'GET';
        const body = options.body ? JSON.stringify(options.body) : undefined;

        try {
            let response = await fetch(url, {
                method,
                headers: this.getHeaders(options.headers || {}),
                body
            });

            if (response.status === 401) {
                const refreshed = await jwtManager.refreshAccessToken();
                if (refreshed) {
                    response = await fetch(url, {
                        method,
                        headers: this.getHeaders(options.headers || {}),
                        body
                    });
                } else {
                    window.location.href = 'login.html';
                    return;
                }
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error [${method} ${endpoint}]:`, error);
            throw error;
        }
    }

    // ── AUTH ──────────────────────────────────────────────────────

    async login(email, password) {
        return await this.request('/auth/login', { method: 'POST', body: { email, password } });
    }

    async getCurrentUser() {
        return await this.request('/auth/me');
    }

    async updateMe(data) {
        return await this.request('/auth/me', { method: 'PUT', body: data });
    }

    async changePassword(oldPassword, newPassword) {
        return await this.request('/auth/me/password', {
            method: 'PUT',
            body: { old_password: oldPassword, new_password: newPassword }
        });
    }

    async getAllUsers(page = 1, perPage = 20, branchId = null) {
        let q = `?page=${page}&per_page=${perPage}`;
        if (branchId) q += `&branch_id=${branchId}`;
        return await this.request(`/auth/users${q}`);
    }

    async registerUser(fullName, email, password, role, branchId = null) {
        return await this.request('/auth/register', {
            method: 'POST',
            body: { full_name: fullName, email, password, role, branch_id: branchId }
        });
    }

    async updateUser(userId, data) {
        return await this.request(`/auth/users/${userId}`, { method: 'PUT', body: data });
    }

    async deactivateUser(userId) {
        return await this.request(`/auth/users/${userId}`, { method: 'DELETE' });
    }

    logout() {
        jwtManager.clearTokens();
        return Promise.resolve({ success: true });
    }

    // ── MEDICINES ─────────────────────────────────────────────────

    async listMedicines(page = 1, perPage = 20, search = '', category = '', supplierId = null) {
        let q = `?page=${page}&per_page=${perPage}`;
        if (search)     q += `&q=${encodeURIComponent(search)}`;
        if (category)   q += `&category=${encodeURIComponent(category)}`;
        if (supplierId) q += `&supplier_id=${supplierId}`;
        return await this.request(`/medicines${q}`);
    }

    async getMedicine(medicineId, includeInventory = false) {
        return await this.request(`/medicines/${medicineId}?include_inventory=${includeInventory}`);
    }

    async addMedicine(data) {
        return await this.request('/medicines', { method: 'POST', body: data });
    }

    async updateMedicine(medicineId, data) {
        return await this.request(`/medicines/${medicineId}`, { method: 'PUT', body: data });
    }

    async deactivateMedicine(medicineId) {
        return await this.request(`/medicines/${medicineId}`, { method: 'DELETE' });
    }

    async scanBarcode(barcode, branchId = 1) {
        return await this.request('/medicines/barcode/scan', {
            method: 'POST',
            body: { barcode, branch_id: branchId }
        });
    }

    // ── INVENTORY ─────────────────────────────────────────────────

    async listInventory(page = 1, perPage = 20, branchId = null, medicineId = null, includeExpired = true, lowStockOnly = false) {
        let q = `?page=${page}&per_page=${perPage}&include_expired=${includeExpired}&low_stock_only=${lowStockOnly}`;
        if (branchId)   q += `&branch_id=${branchId}`;
        if (medicineId) q += `&medicine_id=${medicineId}`;
        return await this.request(`/inventory${q}`);
    }

    async addInventory(data) {
        return await this.request('/inventory', { method: 'POST', body: data });
    }

    async updateInventory(inventoryId, data) {
        return await this.request(`/inventory/${inventoryId}`, { method: 'PUT', body: data });
    }

    async getStockSummary(branchId = null) {
        let q = branchId ? `?branch_id=${branchId}` : '';
        return await this.request(`/inventory/stock-summary${q}`);
    }

    // ── BILLING ───────────────────────────────────────────────────

    async createBill(billData) {
        return await this.request('/billing/bills', { method: 'POST', body: billData });
    }

    async listBills(page = 1, perPage = 20, branchId = null, fromDate = null, toDate = null) {
        let q = `?page=${page}&per_page=${perPage}`;
        if (branchId) q += `&branch_id=${branchId}`;
        if (fromDate) q += `&from_date=${fromDate}`;
        if (toDate)   q += `&to_date=${toDate}`;
        return await this.request(`/billing/bills${q}`);
    }

    async getBill(saleId) {
        return await this.request(`/billing/bills/${saleId}`);
    }

    async getInvoiceJSON(saleId) {
        return await this.request(`/billing/bills/${saleId}/invoice`);
    }

    // ── ANALYTICS ─────────────────────────────────────────────────

    async getDashboardSummary(branchId = null) {
        let q = branchId ? `?branch_id=${branchId}` : '';
        return await this.request(`/analytics/summary${q}`);
    }

    async getTopMedicines(days = 30, limit = 10, branchId = null) {
        let q = `?days=${days}&limit=${limit}`;
        if (branchId) q += `&branch_id=${branchId}`;
        return await this.request(`/analytics/top-medicines${q}`);
    }

    async getMonthlyRevenue(months = 12, branchId = null) {
        let q = `?months=${months}`;
        if (branchId) q += `&branch_id=${branchId}`;
        return await this.request(`/analytics/monthly-revenue${q}`);
    }

    async getExpiryAnalytics(daysThreshold = 30, branchId = null) {
        let q = `?days_threshold=${daysThreshold}`;
        if (branchId) q += `&branch_id=${branchId}`;
        return await this.request(`/analytics/expiry${q}`);
    }

    async getExpiredStock(branchId = null) {
        let q = branchId ? `?branch_id=${branchId}` : '';
        return await this.request(`/analytics/expired-stock${q}`);
    }

    async getSupplierPerformance() {
        return await this.request('/analytics/supplier-performance');
    }

    // ── ML ────────────────────────────────────────────────────────

    async predictDemand(medicineId, branchId, horizonDays = 30) {
        return await this.request('/ml/predict-demand', {
            method: 'POST',
            body: { medicine_id: medicineId, branch_id: branchId, horizon_days: horizonDays }
        });
    }

    async recommendGeneric(brandMedicineName) {
        return await this.request('/ml/recommend-generic', {
            method: 'POST',
            body: { brand_medicine_name: brandMedicineName }
        });
    }

    async recommendTogether(medicineName) {
        return await this.request('/ml/recommend-together', {
            method: 'POST',
            body: { medicine_name: medicineName }
        });
    }
}

const apiService = new APIService();

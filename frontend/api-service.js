// ============================================
// API SERVICE - AUTHENTICATED API CALLS
// ============================================

class APIService {
    constructor(baseURL = 'http://localhost:5000/api') {
        this.baseURL = baseURL;
    }

    /**
     * Get authorization headers with JWT token
     */
    getHeaders(additionalHeaders = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...additionalHeaders
        };

        const accessToken = jwtManager.getAccessToken();
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        return headers;
    }

    /**
     * Make API request with automatic token refresh
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const method = options.method || 'GET';
        const body = options.body ? JSON.stringify(options.body) : undefined;
        const additionalHeaders = options.headers || {};

        try {
            let response = await fetch(url, {
                method,
                headers: this.getHeaders(additionalHeaders),
                body
            });

            // If token expired, try to refresh and retry
            if (response.status === 401) {
                const refreshed = await jwtManager.refreshAccessToken();
                if (refreshed) {
                    response = await fetch(url, {
                        method,
                        headers: this.getHeaders(additionalHeaders),
                        body
                    });
                }
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error [${method} ${endpoint}]:`, error);
            throw error;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // AUTH ENDPOINTS
    // ─────────────────────────────────────────────────────────────

    /**
     * Login with email and password
     */
    async login(email, password) {
        return await this.request('/auth/login', {
            method: 'POST',
            body: { email, password }
        });
    }

    /**
     * Refresh access token
     */
    async refreshToken() {
        const refreshToken = jwtManager.getRefreshToken();
        return await this.request('/auth/refresh', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${refreshToken}`
            }
        });
    }

    /**
     * Get current user profile
     */
    async getCurrentUser() {
        return await this.request('/auth/me', {
            method: 'GET'
        });
    }

    /**
     * Get user by ID (admin only)
     */
    async getUserById(userId) {
        return await this.request(`/auth/users/${userId}`, {
            method: 'GET'
        });
    }

    /**
     * List all users (admin only, with pagination)
     */
    async getAllUsers(page = 1, perPage = 20, branchId = null) {
        let query = `?page=${page}&per_page=${perPage}`;
        if (branchId) {
            query += `&branch_id=${branchId}`;
        }
        return await this.request(`/auth/users${query}`, {
            method: 'GET'
        });
    }

    /**
     * Change password
     */
    async changePassword(oldPassword, newPassword) {
        return await this.request('/auth/me/password', {
            method: 'PUT',
            body: {
                old_password: oldPassword,
                new_password: newPassword
            }
        });
    }

    /**
     * Update user (admin only)
     */
    async updateUser(userId, data) {
        return await this.request(`/auth/users/${userId}`, {
            method: 'PUT',
            body: data
        });
    }

    /**
     * Deactivate user (admin only)
     */
    async deactivateUser(userId) {
        return await this.request(`/auth/users/${userId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Register new user (admin only)
     */
    async registerUser(fullName, email, password, role, branchId = null) {
        return await this.request('/auth/register', {
            method: 'POST',
            body: {
                full_name: fullName,
                email,
                password,
                role,
                branch_id: branchId
            }
        });
    }

    /**
     * Logout (clear tokens locally)
     */
    logout() {
        jwtManager.clearTokens();
        return Promise.resolve({ success: true, message: "Logged out successfully" });
    }

    // ─────────────────────────────────────────────────────────────
    // MEDICINES ENDPOINTS
    // ─────────────────────────────────────────────────────────────

    /**
     * List all medicines with search and pagination
     */
    async listMedicines(page = 1, perPage = 20, search = '', category = '', supplierId = null) {
        let query = `?page=${page}&per_page=${perPage}`;
        if (search) query += `&q=${encodeURIComponent(search)}`;
        if (category) query += `&category=${encodeURIComponent(category)}`;
        if (supplierId) query += `&supplier_id=${supplierId}`;
        return await this.request(`/medicines${query}`, {
            method: 'GET'
        });
    }

    /**
     * Get a specific medicine by ID
     */
    async getMedicine(medicineId, includeInventory = false) {
        let query = `?include_inventory=${includeInventory.toString()}`;
        return await this.request(`/medicines/${medicineId}${query}`, {
            method: 'GET'
        });
    }

    /**
     * Add a new medicine (admin/pharmacist only)
     */
    async addMedicine(medicineData) {
        return await this.request('/medicines', {
            method: 'POST',
            body: medicineData
        });
    }

    /**
     * Update medicine (admin/pharmacist only)
     */
    async updateMedicine(medicineId, medicineData) {
        return await this.request(`/medicines/${medicineId}`, {
            method: 'PUT',
            body: medicineData
        });
    }

    /**
     * Deactivate medicine (admin/pharmacist only)
     */
    async deactivateMedicine(medicineId) {
        return await this.request(`/medicines/${medicineId}`, {
            method: 'DELETE'
        });
    }

    // ─────────────────────────────────────────────────────────────
    // INVENTORY ENDPOINTS
    // ─────────────────────────────────────────────────────────────

    /**
     * List inventory with filters and pagination
     */
    async listInventory(page = 1, perPage = 20, branchId = null, medicineId = null, includeExpired = true, lowStockOnly = false) {
        let query = `?page=${page}&per_page=${perPage}&include_expired=${includeExpired}&low_stock_only=${lowStockOnly}`;
        if (branchId) query += `&branch_id=${branchId}`;
        if (medicineId) query += `&medicine_id=${medicineId}`;
        return await this.request(`/inventory${query}`, {
            method: 'GET'
        });
    }

    /**
     * Get specific inventory item
     */
    async getInventoryItem(inventoryId) {
        return await this.request(`/inventory/${inventoryId}`, {
            method: 'GET'
        });
    }

    /**
     * Add inventory batch
     */
    async addInventory(inventoryData) {
        return await this.request('/inventory', {
            method: 'POST',
            body: inventoryData
        });
    }

    /**
     * Update inventory item
     */
    async updateInventory(inventoryId, inventoryData) {
        return await this.request(`/inventory/${inventoryId}`, {
            method: 'PUT',
            body: inventoryData
        });
    }

    // ─────────────────────────────────────────────────────────────
    // BILLING/ORDERS ENDPOINTS
    // ─────────────────────────────────────────────────────────────

    /**
     * Create a new bill/order
     */
    async createBill(billData) {
        return await this.request('/billing/bills', {
            method: 'POST',
            body: billData
        });
    }

    /**
     * List bills with pagination and filters
     */
    async listBills(page = 1, perPage = 20, branchId = null, fromDate = null, toDate = null) {
        let query = `?page=${page}&per_page=${perPage}`;
        if (branchId) query += `&branch_id=${branchId}`;
        if (fromDate) query += `&from_date=${fromDate}`;
        if (toDate) query += `&to_date=${toDate}`;
        return await this.request(`/billing/bills${query}`, {
            method: 'GET'
        });
    }

    /**
     * Get a specific bill
     */
    async getBill(saleId) {
        return await this.request(`/billing/bills/${saleId}`, {
            method: 'GET'
        });
    }

    /**
     * Get invoice JSON for a bill
     */
    async getInvoiceJSON(saleId) {
        return await this.request(`/billing/bills/${saleId}/invoice`, {
            method: 'GET'
        });
    }

    // ─────────────────────────────────────────────────────────────
    // ANALYTICS ENDPOINTS
    // ─────────────────────────────────────────────────────────────

    /**
     * Get sales analytics
     */
    async getSalesAnalytics(period = 'monthly', fromDate = null, toDate = null) {
        let query = `?period=${period}`;
        if (fromDate) query += `&from_date=${fromDate}`;
        if (toDate) query += `&to_date=${toDate}`;
        return await this.request(`/analytics/sales${query}`, {
            method: 'GET'
        });
    }

    /**
     * Get inventory analytics
     */
    async getInventoryAnalytics() {
        return await this.request('/analytics/inventory', {
            method: 'GET'
        });
    }

    /**
     * Get expiry analytics
     */
    async getExpiryAnalytics(daysThreshold = 30) {
        return await this.request(`/analytics/expiry?days_threshold=${daysThreshold}`, {
            method: 'GET'
        });
    }
}

// Create global instance
const apiService = new APIService();

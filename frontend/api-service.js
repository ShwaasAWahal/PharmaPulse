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
}

// Create global instance
const apiService = new APIService();

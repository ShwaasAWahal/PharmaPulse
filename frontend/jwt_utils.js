// ============================================
// JWT UTILITIES - TOKEN MANAGEMENT
// ============================================

class JWTManager {
    constructor() {
        this.accessTokenKey = 'access_token';
        this.refreshTokenKey = 'refresh_token';
        this.userDataKey = 'user_data';
    }

    /**
     * Store tokens in localStorage
     */
    storeTokens(accessToken, refreshToken, userData = null) {
        localStorage.setItem(this.accessTokenKey, accessToken);
        localStorage.setItem(this.refreshTokenKey, refreshToken);
        if (userData) {
            localStorage.setItem(this.userDataKey, JSON.stringify(userData));
        }
    }

    /**
     * Get access token
     */
    getAccessToken() {
        return localStorage.getItem(this.accessTokenKey);
    }

    /**
     * Get refresh token
     */
    getRefreshToken() {
        return localStorage.getItem(this.refreshTokenKey);
    }

    /**
     * Get stored user data
     */
    getUserData() {
        const userData = localStorage.getItem(this.userDataKey);
        return userData ? JSON.parse(userData) : null;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.getAccessToken() !== null;
    }

    /**
     * Get authorization header
     */
    getAuthHeader() {
        const token = this.getAccessToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Clear all tokens and user data
     */
    clearTokens() {
        localStorage.removeItem(this.accessTokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        localStorage.removeItem(this.userDataKey);
    }

    /**
     * Decode JWT token (without verification - for client-side only)
     */
    decodeToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            
            const decoded = JSON.parse(atob(parts[1]));
            return decoded;
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    /**
     * Check if token is expired
     */
    isTokenExpired(token) {
        const decoded = this.decodeToken(token);
        if (!decoded || !decoded.exp) return true;
        
        const currentTime = Math.floor(Date.now() / 1000);
        return decoded.exp < currentTime;
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            console.error('No refresh token available');
            return false;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${refreshToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            if (data.success && data.access_token) {
                // Update access token and refresh token if provided
                const newRefreshToken = data.refresh_token || refreshToken;
                this.storeTokens(data.access_token, newRefreshToken);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error refreshing token:', error);
            this.clearTokens();
            window.location.href = 'login.html'; // Redirect to login if refresh fails
            return false;
        }
    }
}

// Create global instance
const jwtManager = new JWTManager();

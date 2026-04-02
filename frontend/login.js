// ============================================
// PHARMA PULSE - LOGIN PAGE FUNCTIONALITY
// ============================================

class LoginForm {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.emailError = document.getElementById('emailError');
        this.passwordError = document.getElementById('passwordError');

        this.init();
    }

    init() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Real-time validation
        this.emailInput.addEventListener('blur', () => this.validateEmail());
        this.passwordInput.addEventListener('blur', () => this.validatePassword());

        // Clear errors on focus
        this.emailInput.addEventListener('focus', () => this.clearError('email'));
        this.passwordInput.addEventListener('focus', () => this.clearError('password'));
    }

    /**
     * Validate Email Field
     */
    validateEmail() {
        const value = this.emailInput.value.trim();

        // Check if empty
        if (!value) {
            this.showError('email', 'Please enter your email address');
            return false;
        }

        // Check valid email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            this.showError('email', 'Please enter a valid email address');
            return false;
        }

        this.clearError('email');
        return true;
    }

    /**
     * Validate Password Field
     */
    validatePassword() {
        const value = this.passwordInput.value.trim();

        // Check if empty
        if (!value) {
            this.showError('password', 'Please enter your password');
            return false;
        }

        // Check minimum length
        if (value.length < 6) {
            this.showError('password', 'Password must be at least 6 characters');
            return false;
        }

        this.clearError('password');
        return true;
    }

   
    /**
     * Show Error Message
     */
    showError(field, message) {
        const errorElement = document.getElementById(`${field}Error`);
        const input = field === 'email' ? this.emailInput : this.passwordInput;

        errorElement.textContent = message;
        errorElement.classList.add('show');
        input.style.borderColor = '#E53E3E';
        input.style.backgroundColor = 'rgba(245, 53, 61, 0.02)';
    }

    /**
     * Clear Error Message
     */
    clearError(field) {
        const errorElement = document.getElementById(`${field}Error`);
        const input = field === 'email' ? this.emailInput : this.passwordInput;

        errorElement.textContent = '';
        errorElement.classList.remove('show');
        input.style.borderColor = '';
        input.style.backgroundColor = '';
    }

    /**
     * Handle Form Submission
     */
    handleSubmit(e) {
        e.preventDefault();

        // Validate both fields
        const isEmailValid = this.validateEmail();
        const isPasswordValid = this.validatePassword();

        if (isEmailValid && isPasswordValid) {
            this.submitForm();
        }
    }

    /**
     * Submit Form
     */
    submitForm() {
        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value.trim();

        // Show loading state
        const loginBtn = document.querySelector('.btn-login');
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<span class="btn-text">Logging in...</span>';
        loginBtn.disabled = true;

        this.loginUser(email, password);
    }

    async loginUser(email , password) {
        try{
            const data = await apiService.login(email, password);
            
            if (!data.success) {
                throw new Error(data.message || "Login failed");
            }

            console.log("Login Successful:", data.message);

            // Store JWT tokens and user data
            jwtManager.storeTokens(
                data.access_token,
                data.refresh_token,
                {
                    id: data.user.id,
                    email: data.user.email,
                    full_name: data.user.full_name,
                    role: data.user.role,
                    branch_id: data.user.branch_id,
                    is_active: data.user.is_active,
                    timestamp: new Date().toISOString()
                }
            );

            // Show success message
            this.showSuccessMessage(email);

            // Redirect to index.html
            window.location.href = 'index.html';

        }
        catch (error){
            console.error("Error during login:", error.message);
            this.showLoginError(error.message);
        }
    }

    /**
     * Show Error Message for Login Failure
     */
    showLoginError(errorMessage) {
        const formContainer = document.querySelector('.form-container');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'success-notification';
        errorDiv.innerHTML = `
            <div class="success-content">
                <span class="error-icon">✕</span>
                <h3>Login Failed</h3>
                <p>${errorMessage}</p>
            </div>
        `;

        formContainer.appendChild(errorDiv);

        // Add animation
        setTimeout(() => {
            errorDiv.classList.add('show');
        }, 10);

        // Remove after 5 seconds
        setTimeout(() => {
            errorDiv.classList.remove('show');
            setTimeout(() => {
                errorDiv.remove();
                this.resetForm();
            }, 300);
        }, 3000);

        // Reset button state
        // const loginBtn = document.querySelector('.btn-login');
        // loginBtn.innerHTML = '<span class="btn-text">LogIn</span>';
        // loginBtn.disabled = false;
    }

    /**
     * Show Success Message
     */
    showSuccessMessage(email) {
        const formContainer = document.querySelector('.form-container');
        const successDiv = document.createElement('div');
        successDiv.className = 'success-notification';
        successDiv.innerHTML = `
            <div class="success-content">
                <span class="success-icon">✓</span>
                <h3>Welcome, ${email}!</h3>
                <p>You have been logged in successfully.</p>
            </div>
        `;

        formContainer.appendChild(successDiv);

        // Add animation
        setTimeout(() => {
            successDiv.classList.add('show');
        }, 10);

        // Remove after 3 seconds and reset form
        setTimeout(() => {
            successDiv.classList.remove('show');
            setTimeout(() => {
                successDiv.remove();
                this.resetForm();
            }, 300);
        }, 3000);
    }

    /**
     * Reset Form
     */
    resetForm() {
        this.form.reset();
        this.clearError('email');
        this.clearError('password');
    }

    /**
     * Logout User
     */
    static logout() {
        jwtManager.clearTokens();
        window.location.href = 'login.html';
    }
}

// ============================================
// INITIALIZE APP
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    new LoginForm();

    // Handle Create Account button
    const createAccountBtn = document.querySelector('.btn-signup');
    createAccountBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Redirect to signup page');
        // Redirect to signup page
        // window.location.href = '/signup';
        alert('Redirecting to Sign Up Page...');
    });

    // Handle Forgot Details link
    const forgotLink = document.querySelector('.footer-link:first-of-type');
    forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Redirect to forgot details page');
        alert('Redirecting to Account Recovery...');
    });

    // Handle Need Help link
    const helpLink = document.querySelector('.footer-link:last-of-type');
    helpLink.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Redirect to help page');
        alert('Opening Help Center...');
    });

    // Add subtle parallax effect on mouse move (optional)
    document.addEventListener('mousemove', (e) => {
        const leftSection = document.querySelector('.left-section');
        if (leftSection) {
            const x = (e.clientX / window.innerWidth) * 10;
            const y = (e.clientY / window.innerHeight) * 10;
            leftSection.style.backgroundPosition = `${x}px ${y}px`;
        }
    });
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Validate Indian Phone Number
 */
function isValidIndianPhone(phone) {
    const pattern = /^[6-9][0-9]{9}$/;
    return pattern.test(phone);
}

/**
 * Format phone number with country code
 */
function formatPhoneWithCode(phone) {
    return '+91' + phone;
}

/**
 * Check if all form fields are valid
 */
function isFormValid() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    return email.length >= 3;
}
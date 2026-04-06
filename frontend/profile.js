// ============================================
// PROFILE PAGE FUNCTIONALITY - BACKEND INTEGRATED
// ============================================

// Global user profile data
let currentUserProfile = null;

// Initialize profile page
document.addEventListener('DOMContentLoaded', async () => {
    // Load user profile from backend
    await loadUserProfile();
    initializeProfileUI();
});

/**
 * Load user profile from backend API
 */
async function loadUserProfile() {
    try {
        const response = await apiService.getCurrentUser();
        
        if (response.success && response.user) {
            currentUserProfile = response.user;
            displayUserProfile();
            return true;
        } else {
            console.warn('Failed to load user profile:', response);
            showNotification('Could not load profile information', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        showNotification('Error: ' + error.message, 'error');
        // NOTE: Ensure backend is running on http://localhost:5000
        return false;
    }
}

/**
 * Display user profile in UI
 */
function displayUserProfile() {
    if (!currentUserProfile) return;

    // Update sidebar
    const profileName = document.getElementById('profileName');
    const profilePhone = document.getElementById('profilePhone');
    if (profileName) profileName.textContent = currentUserProfile.full_name || 'User';
    if (profilePhone) profilePhone.textContent = currentUserProfile.phone || '+91 XXXXXXXXXX';

    // Update personal info display
    const displayName = document.getElementById('displayName');
    const displayPhone = document.getElementById('displayPhone');
    const displayEmail = document.getElementById('displayEmail');
    const displayDob = document.getElementById('displayDob');

    if (displayName) displayName.textContent = currentUserProfile.full_name || 'N/A';
    if (displayPhone) displayPhone.textContent = currentUserProfile.phone || 'N/A';
    if (displayEmail) displayEmail.textContent = currentUserProfile.email || 'N/A';
    if (displayDob) displayDob.textContent = currentUserProfile.date_of_birth || 'N/A';

    // Populate form fields
    populateProfileForm();
}

/**
 * Populate profile form with current data
 */
function populateProfileForm() {
    if (!currentUserProfile) return;

    const fullNameInput = document.getElementById('fullName');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    const dobInput = document.getElementById('dob');

    if (fullNameInput) fullNameInput.value = currentUserProfile.full_name || '';
    if (phoneInput) phoneInput.value = currentUserProfile.phone || '';
    if (emailInput) emailInput.value = currentUserProfile.email || '';
    if (dobInput) dobInput.value = currentUserProfile.date_of_birth || '';
}

/**
 * Initialize profile page UI
 */
function initializeProfileUI() {
    // Profile Navigation
    const profileNavLinks = document.querySelectorAll('.profile-nav-link');
    const profileSections = document.querySelectorAll('.profile-section');

    profileNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionName = link.dataset.section;
            
            // Remove active class from all links
            profileNavLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Hide all sections
            profileSections.forEach(section => section.classList.remove('active'));
            
            // Show selected section
            const section = document.getElementById(`${sectionName}-section`);
            if (section) {
                section.classList.add('active');
            }
        });
    });

    // Personal Information Management
    const editPersonalBtn = document.getElementById('editPersonalBtn');
    const personalDisplay = document.getElementById('personalDisplay');
    const personalForm = document.getElementById('personalForm');
    const cancelPersonalBtn = document.getElementById('cancelPersonalBtn');

    if (editPersonalBtn) {
        editPersonalBtn.addEventListener('click', () => {
            personalDisplay.style.display = 'none';
            personalForm.style.display = 'block';
            populateProfileForm();
        });
    }

    if (cancelPersonalBtn) {
        cancelPersonalBtn.addEventListener('click', () => {
            personalDisplay.style.display = 'block';
            personalForm.style.display = 'none';
        });
    }

    // Personal Form Submission
    personalForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        savePersonalInfo();
    });

    // Password Management
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const passwordModal = document.getElementById('passwordModal');
    const passwordForm = document.getElementById('passwordForm');
    const closeModals = document.querySelectorAll('.close-modal');

    if (changePasswordBtn && passwordModal) {
        changePasswordBtn.addEventListener('click', () => {
            if (passwordForm) passwordForm.reset();
            passwordModal.classList.add('active');
        });
    }

    closeModals.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) modal.classList.remove('active');
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });

    // Password Form Submission
    passwordForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        changePassword();
    });

    // Addresses Section
    const addressesNavLink = document.querySelector('[data-section="addresses"]');
    if (addressesNavLink) {
        addressesNavLink.addEventListener('click', () => {
            displayAddresses();
        });
    }
}

/**
 * Save personal information to backend
 */
async function savePersonalInfo() {
    try {
        const fullName = document.getElementById('fullName')?.value?.trim() || '';
        const phone = document.getElementById('phone')?.value?.trim() || '';
        const email = document.getElementById('email')?.value?.trim() || '';
        const dob = document.getElementById('dob')?.value || '';

        if (!fullName) {
            showNotification('Full name is required', 'error');
            return;
        }

        // Prepare update data
        const updateData = {
            full_name: fullName,
            phone: phone,
            email: email
        };
        
        if (dob) {
            updateData.date_of_birth = dob;
        }

        // NOTE: Backend may not have a dedicated update endpoint yet
        // You may need to implement PUT /auth/me or PATCH /auth/users/:id
        const response = await apiService.request('/auth/me', {
            method: 'PUT',
            body: updateData
        });

        if (response.success) {
            currentUserProfile = { ...currentUserProfile, ...updateData };
            displayUserProfile();
            document.getElementById('personalDisplay').style.display = 'block';
            document.getElementById('personalForm').style.display = 'none';
            showNotification('Profile updated successfully!', 'success');
        } else {
            showNotification(response.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error saving personal info:', error);
        showNotification('Note: Backend may not support profile updates. ' + error.message, 'error');
        // MANUAL ACTION: Implement PUT /auth/me endpoint in backend if not already present
    }
}

/**
 * Change password
 */
async function changePassword() {
    try {
        const currentPassword = document.getElementById('currentPassword')?.value || '';
        const newPassword = document.getElementById('newPassword')?.value || '';
        const confirmPassword = document.getElementById('confirmPassword')?.value || '';

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            showNotification('All password fields are required', 'error');
            return;
        }

        if (newPassword.length < 8) {
            showNotification('New password must be at least 8 characters', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showNotification('New passwords do not match', 'error');
            return;
        }

        if (currentPassword === newPassword) {
            showNotification('New password must be different from current password', 'error');
            return;
        }

        const response = await apiService.changePassword(currentPassword, newPassword);

        if (response.success) {
            const passwordModal = document.getElementById('passwordModal');
            if (passwordModal) passwordModal.classList.remove('active');
            
            const passwordForm = document.getElementById('passwordForm');
            if (passwordForm) passwordForm.reset();
            
            showNotification('Password updated successfully!', 'success');
        } else {
            showNotification(response.message || 'Failed to update password', 'error');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

/**
 * Display addresses
 * NOTE: This requires backend support for addresses - currently not implemented
 */
function displayAddresses() {
    const addressesList = document.getElementById('addressesList');
    if (!addressesList) return;

    // MANUAL ACTION REQUIRED: Backend needs to implement:
    // GET /auth/users/{id}/addresses - to fetch user addresses
    // POST /auth/users/{id}/addresses - to add new address
    // PUT /auth/users/{id}/addresses/{addressId} - to update address
    // DELETE /auth/users/{id}/addresses/{addressId} - to delete address

    addressesList.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: var(--text-gray);">
            <p>📍 Address management is not yet configured.</p>
            <p style="font-size: 0.9rem; margin-top: 1rem;">Backend needs to implement address endpoints:</p>
            <ul style="text-align: left; display: inline-block; margin-top: 1rem; font-size: 0.85rem;">
                <li>GET /auth/users/{id}/addresses</li>
                <li>POST /auth/users/{id}/addresses</li>
                <li>PUT /auth/users/{id}/addresses/{addressId}</li>
                <li>DELETE /auth/users/{id}/addresses/{addressId}</li>
            </ul>
        </div>
    `;
}

/**
 * Show notification message
 */
        }
    });
}

window.editAddress = function(addressId) {
    alert(`Edit address ${addressId}`);
};

window.deleteAddress = function(addressId) {
    if (confirm('Are you sure you want to delete this address?')) {
        showNotification('Address deleted successfully!');
        displayAddresses();
    }
};

// Notification Helper
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const bgColor = type === 'error' ? '#E53E3E' : 'var(--primary-color)';
    const icon = type === 'error' ? '✕' : '✓';
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 15px rgba(0,0,0,0.1);
        z-index: 999;
        animation: slide-in 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;
    notification.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fade-out 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Already handled by loadUserProfile and initializeProfileUI in the main section above
    // But we'll keep this for any additional setup that might be needed
});

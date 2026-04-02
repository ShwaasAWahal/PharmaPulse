// PHARMA PULSE - PROFILE PAGE

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
        
        // Initialize section data
        if (sectionName === 'addresses') {
            displayAddresses();
        }
    });
});

// Modal Management
const passwordModal = document.getElementById('passwordModal');
const changePasswordBtn = document.getElementById('changePasswordBtn');
const passwordForm = document.getElementById('passwordForm');
const closeModals = document.querySelectorAll('.close-modal');

if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => {
        passwordForm.reset();
        passwordModal.classList.add('active');
    });
}

closeModals.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.target.closest('.modal').classList.remove('active');
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
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
    });
}

if (cancelPersonalBtn) {
    cancelPersonalBtn.addEventListener('click', () => {
        personalDisplay.style.display = 'block';
        personalForm.style.display = 'none';
    });
}

personalForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Update display values
    const fullName = document.getElementById('fullName').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const dob = document.getElementById('dob').value;
    
    document.getElementById('displayName').textContent = fullName;
    document.getElementById('displayPhone').textContent = phone;
    document.getElementById('displayEmail').textContent = email;
    document.getElementById('displayDob').textContent = new Date(dob).toLocaleDateString('en-IN');
    
    document.getElementById('profileName').textContent = fullName;
    document.getElementById('profilePhone').textContent = phone;
    
    // Save to localStorage
    localStorage.setItem('userProfile', JSON.stringify({
        fullName,
        phone,
        email,
        dob
    }));
    
    personalDisplay.style.display = 'block';
    personalForm.style.display = 'none';
    showNotification('Profile updated successfully!');
});

// Password Management
passwordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match!', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showNotification('Password must be at least 8 characters long!', 'error');
        return;
    }

    if (currentPassword === newPassword) {
        showNotification('New password must be different from current password!', 'error');
        return;
    }
    
    // Submit to backend
    try {
        const response = await apiService.changePassword(currentPassword, newPassword);
        
        if (response.success) {
            passwordModal.classList.remove('active');
            passwordForm.reset();
            showNotification('Password updated successfully!', 'success');
        } else {
            showNotification(response.message || 'Failed to update password', 'error');
        }
    } catch (error) {
        console.error('Password change error:', error);
        showNotification(error.message || 'Error updating password', 'error');
    }
});

// Address Management
function displayAddresses() {
    const addressesList = document.getElementById('addressesList');
    if (!addressesList) return;

    const savedAddresses = JSON.parse(localStorage.getItem('userAddresses')) || [
        {
            id: 1,
            type: 'Home',
            address: '123 Main Street, Apartment 4B',
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110001',
            phone: '+91 98765 43210',
            default: true
        },
        {
            id: 2,
            type: 'Office',
            address: '456 Business Park, Suite 200',
            city: 'Gurgaon',
            state: 'Haryana',
            pincode: '122001',
            phone: '+91 98765 43210',
            default: false
        }
    ];

    addressesList.innerHTML = savedAddresses.map(addr => `
        <div style="background: var(--bg-light); padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <div>
                    <h4 style="margin-bottom: 0.5rem;">${addr.type}${addr.default ? ' <span style="background: var(--primary-color); color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">DEFAULT</span>' : ''}</h4>
                    <p style="margin-bottom: 0.5rem;">${addr.address}</p>
                    <p style="margin-bottom: 0.5rem; color: var(--text-gray);">${addr.city}, ${addr.state} - ${addr.pincode}</p>
                    <p style="color: var(--text-gray);">📞 ${addr.phone}</p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" style="font-size: 0.8rem; padding: 0.5rem 1rem;" onclick="editAddress(${addr.id})">Edit</button>
                    <button class="btn btn-danger" style="font-size: 0.8rem; padding: 0.5rem 1rem;" onclick="deleteAddress(${addr.id})">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

const addAddressBtn = document.getElementById('addAddressBtn');
if (addAddressBtn) {
    addAddressBtn.addEventListener('click', () => {
        const addressForm = prompt('Enter new address (JSON format):');
        if (addressForm) {
            showNotification('Address added successfully!');
            displayAddresses();
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

// Load saved profile data on page load
document.addEventListener('DOMContentLoaded', async () => {
    // First, check if user is authenticated
    if (!jwtManager.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // Try to load user data from backend
    try {
        const response = await apiService.getCurrentUser();
        
        if (response.success && response.user) {
            // Store the complete user data
            const userData = response.user;
            localStorage.setItem('userProfile', JSON.stringify({
                id: userData.id,
                fullName: userData.full_name,
                email: userData.email,
                role: userData.role,
                branch_id: userData.branch_id,
                is_active: userData.is_active,
                created_at: userData.created_at,
                last_login: userData.last_login
            }));

            // Display user data
            displayUserProfile(userData);
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        // Use cached profile if available
        const savedProfile = JSON.parse(localStorage.getItem('userProfile'));
        if (savedProfile) {
            displayUserProfile(savedProfile);
        }
    }
});

/**
 * Display user profile information
 */
function displayUserProfile(userData) {
    if (!userData) return;

    // Update form fields
    document.getElementById('fullName').value = userData.full_name || userData.fullName || '';
    document.getElementById('email').value = userData.email || '';
    document.getElementById('phone').value = userData.phone || '';
    document.getElementById('dob').value = userData.dob || '';
    
    // Update display fields
    document.getElementById('displayName').textContent = userData.full_name || userData.fullName || 'User';
    document.getElementById('displayPhone').textContent = userData.phone || 'Not set';
    document.getElementById('displayEmail').textContent = userData.email || '';
    document.getElementById('displayDob').textContent = userData.dob ? new Date(userData.dob).toLocaleDateString('en-IN') : 'Not set';
    
    // Update header
    document.getElementById('profileName').textContent = userData.full_name || userData.fullName || 'User';
    document.getElementById('profilePhone').textContent = userData.phone || 'Not set';
}

// Preferences
const emailNotif = document.getElementById('emailNotif');
const smsNotif = document.getElementById('smsNotif');
const promoNotif = document.getElementById('promoNotif');

function savePreferences() {
    localStorage.setItem('userPreferences', JSON.stringify({
        emailNotif: emailNotif?.checked,
        smsNotif: smsNotif?.checked,
        promoNotif: promoNotif?.checked
    }));
}

emailNotif?.addEventListener('change', savePreferences);
smsNotif?.addEventListener('change', savePreferences);
promoNotif?.addEventListener('change', savePreferences);

// Load preferences
document.addEventListener('DOMContentLoaded', () => {
    const saved = JSON.parse(localStorage.getItem('userPreferences')) || {};
    if (emailNotif) emailNotif.checked = saved.emailNotif !== false;
    if (smsNotif) smsNotif.checked = saved.smsNotif !== false;
    if (promoNotif) promoNotif.checked = saved.promoNotif === true;
});

// Account Deletion
document.querySelectorAll('.btn-danger').forEach(btn => {
    if (btn.textContent.includes('Delete Account')) {
        btn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                if (confirm('Type "DELETE" to confirm account deletion')) {
                    localStorage.clear();
                    alert('Account deleted successfully.');
                    window.location.href = 'index.html';
                }
            }
        });
    }
});

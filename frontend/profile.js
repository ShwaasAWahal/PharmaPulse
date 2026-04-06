// ============================================
// PHARMA PULSE - PROFILE PAGE
// ============================================

let currentUserProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadUserProfile();
    initializeProfileUI();
});

async function loadUserProfile() {
    try {
        const resp = await apiService.getCurrentUser();
        if (resp.success && resp.user) {
            currentUserProfile = resp.user;
            displayUserProfile();
        } else {
            showNotification('Could not load profile.', 'error');
        }
    } catch (e) {
        showNotification('Error loading profile: ' + e.message, 'error');
    }
}

function displayUserProfile() {
    if (!currentUserProfile) return;
    const u = currentUserProfile;

    // Sidebar
    const profileName  = document.getElementById('profileName');
    const profilePhone = document.getElementById('profilePhone');
    if (profileName)  profileName.textContent  = u.full_name || 'User';
    if (profilePhone) profilePhone.textContent = u.email    || '';

    // Display fields
    const displayName  = document.getElementById('displayName');
    const displayPhone = document.getElementById('displayPhone');
    const displayEmail = document.getElementById('displayEmail');
    const displayDob   = document.getElementById('displayDob');
    if (displayName)  displayName.textContent  = u.full_name || 'N/A';
    if (displayPhone) displayPhone.textContent = u.branch_name || 'N/A';
    if (displayEmail) displayEmail.textContent = u.email    || 'N/A';
    if (displayDob)   displayDob.textContent   = u.role     || 'N/A';

    populateProfileForm();
}

function populateProfileForm() {
    if (!currentUserProfile) return;
    const fullNameInput = document.getElementById('fullName');
    const emailInput    = document.getElementById('email');
    if (fullNameInput) fullNameInput.value = currentUserProfile.full_name || '';
    if (emailInput)    emailInput.value    = currentUserProfile.email     || '';
}

function initializeProfileUI() {
    // Section navigation
    document.querySelectorAll('.profile-nav-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const section = link.dataset.section;
            document.querySelectorAll('.profile-nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            document.querySelectorAll('.profile-section').forEach(s => s.classList.remove('active'));
            document.getElementById(`${section}-section`)?.classList.add('active');
        });
    });

    // Edit personal info
    const editBtn       = document.getElementById('editPersonalBtn');
    const personalDisp  = document.getElementById('personalDisplay');
    const personalForm  = document.getElementById('personalForm');
    const cancelBtn     = document.getElementById('cancelPersonalBtn');

    editBtn?.addEventListener('click', () => {
        if (personalDisp) personalDisp.style.display = 'none';
        if (personalForm) personalForm.style.display = 'block';
        populateProfileForm();
    });
    cancelBtn?.addEventListener('click', () => {
        if (personalDisp) personalDisp.style.display = 'block';
        if (personalForm) personalForm.style.display = 'none';
    });
    personalForm?.addEventListener('submit', e => { e.preventDefault(); savePersonalInfo(); });

    // Password modal
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const passwordModal     = document.getElementById('passwordModal');
    const passwordForm      = document.getElementById('passwordForm');

    changePasswordBtn?.addEventListener('click', () => {
        passwordForm?.reset();
        passwordModal?.classList.add('active');
    });
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', e => e.target.closest('.modal')?.classList.remove('active'));
    });
    window.addEventListener('click', e => {
        if (e.target.classList.contains('modal')) e.target.classList.remove('active');
    });
    passwordForm?.addEventListener('submit', e => { e.preventDefault(); changePassword(); });
}

async function savePersonalInfo() {
    const fullName = document.getElementById('fullName')?.value?.trim();
    if (!fullName) { showNotification('Full name is required.', 'error'); return; }

    try {
        const resp = await apiService.updateMe({ full_name: fullName });
        if (resp.success) {
            currentUserProfile = { ...currentUserProfile, full_name: fullName };
            displayUserProfile();
            document.getElementById('personalDisplay').style.display = 'block';
            document.getElementById('personalForm').style.display = 'none';
            showNotification('Profile updated!', 'success');
        } else {
            showNotification(resp.message || 'Update failed.', 'error');
        }
    } catch (e) {
        showNotification('Error: ' + e.message, 'error');
    }
}

async function changePassword() {
    const currentPw  = document.getElementById('currentPassword')?.value || '';
    const newPw      = document.getElementById('newPassword')?.value      || '';
    const confirmPw  = document.getElementById('confirmPassword')?.value  || '';

    if (!currentPw || !newPw || !confirmPw) {
        showNotification('All fields are required.', 'error'); return;
    }
    if (newPw.length < 8) {
        showNotification('New password must be at least 8 characters.', 'error'); return;
    }
    if (newPw !== confirmPw) {
        showNotification('Passwords do not match.', 'error'); return;
    }

    try {
        const resp = await apiService.changePassword(currentPw, newPw);
        if (resp.success) {
            document.getElementById('passwordModal')?.classList.remove('active');
            document.getElementById('passwordForm')?.reset();
            showNotification('Password changed successfully!', 'success');
        } else {
            showNotification(resp.message || 'Change failed.', 'error');
        }
    } catch (e) {
        showNotification('Error: ' + e.message, 'error');
    }
}

function showNotification(message, type = 'success') {
    const el = document.createElement('div');
    const bg = type === 'error' ? '#E53E3E' : 'var(--primary-color, #2B6CB0)';
    el.style.cssText = `position:fixed;top:100px;right:20px;background:${bg};color:white;
        padding:1rem 1.5rem;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.15);
        z-index:9999;display:flex;align-items:center;gap:.5rem;font-weight:500`;
    el.innerHTML = `<span>${type === 'error' ? '✕' : '✓'}</span><span>${message}</span>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

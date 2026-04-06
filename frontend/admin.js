// ============================================
// PHARMA PULSE - ADMIN DASHBOARD
// ============================================

// ── Sidebar navigation ────────────────────────────────────────────────────────

document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', async (e) => {
        e.preventDefault();
        const section = link.dataset.section;

        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(`${section}-section`);
        if (target) target.classList.add('active');

        if (section === 'inventory')  displayInventory(document.getElementById('showExpiredToggle')?.checked || false);
        if (section === 'expiry')     displayExpiryTracking();
        if (section === 'orders')     displayOrdersManagement();
        if (section === 'analytics')  displayAnalytics();
        if (section === 'users')      displayUsers();
    });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(amount) {
    return '₹' + Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function showNotification(message, type = 'success') {
    const el = document.createElement('div');
    const bg = type === 'error' ? '#e53e3e' : type === 'success' ? '#48bb78' : '#4299e1';
    el.style.cssText = `position:fixed;top:80px;right:20px;background:${bg};color:white;
        padding:1rem 1.5rem;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.15);
        z-index:9999;max-width:320px;font-weight:500`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
}

function getExpiryBadge(expiryDateStr) {
    if (!expiryDateStr) return { cls: 'status-ok', text: 'N/A' };

    const today = new Date();
    today.setHours(0 , 0 , 0 , 0);

    const expiry = new Date(expiryDateStr);
    expiry.setHours(0 , 0 , 0 , 0);
    
    const days = Math.ceil((expiry - today) / 86400000);
    if (days < 0)   return { cls: 'status-expired', text: 'EXPIRED' };
    if (days <= 30) return { cls: 'status-expiring', text: `EXPIRING IN ${days}D` };
    return { cls: 'status-ok', text: 'VALID' };
}

// ── Inventory ─────────────────────────────────────────────────────────────────

async function displayInventory(includeExpired = false) {
    const tbody          = document.getElementById('inventoryTable');
    const totalMed       = document.getElementById('totalMedicines');
    const lowStockEl     = document.getElementById('lowStock');
    const outOfStockEl   = document.getElementById('outOfStock');
    const expiringSoonEl = document.getElementById('expiringSoon');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem">Loading inventory...</td></tr>';

    try {
        // Load dashboard summary for KPIs
        const summary = await apiService.getDashboardSummary();
        if (summary.success) {
            if (totalMed)       totalMed.textContent       = summary.total_medicines        || 0;
            if (lowStockEl)     lowStockEl.textContent     = summary.low_stock_count        || 0;
            if (outOfStockEl)   outOfStockEl.textContent   = summary.expired_count          || 0;
            if (expiringSoonEl) expiringSoonEl.textContent = summary.expiring_soon_count    || 0;
        }

        // Load inventory — exclude expired by default so table isn't swamped
        const resp = await apiService.listInventory(1, 100, null, null, includeExpired, false);
        const inventory = resp.inventory || resp.items || [];

        if (inventory.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#888">No inventory records found.</td></tr>';
            return;
        }

        tbody.innerHTML = inventory.map(item => {
            const badge = getExpiryBadge(item.expiry_date);
            return `
            <tr>
                <td><strong>${item.medicine_name || 'N/A'}</strong><br>
                    <small style="color:#888">${item.generic_name || ''}</small></td>
                <td>${item.branch_name || 'N/A'}</td>
                <td>${item.batch_number || 'N/A'}</td>
                <td><strong>${item.quantity}</strong></td>
                <td>${formatCurrency(item.selling_price || 0)}</td>
                <td>${formatDate(item.expiry_date)}</td>
                <td><span class="status-badge ${badge.cls}">${badge.text}</span></td>
                <td>
                    <button class="btn btn-secondary" style="font-size:.8rem;padding:.3rem .7rem"
                        onclick="openAdjustModal(${item.id}, '${(item.medicine_name||'').replace(/'/g,"\\'")}', ${item.quantity})">
                        Adjust
                    </button>
                </td>
            </tr>`;
        }).join('');

    } catch (e) {
        console.error('Inventory error:', e);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#e53e3e">⚠️ Error loading inventory. Is the backend running?</td></tr>';
    }
}

// ── Add medicine modal ────────────────────────────────────────────────────────

const medicineModal = document.getElementById('medicineModal');
const addMedicineBtn = document.getElementById('addMedicineBtn');
const medicineForm = document.getElementById('medicineForm');

addMedicineBtn?.addEventListener('click', () => {
    medicineForm?.reset();
    if (medicineModal) medicineModal.classList.add('active');
});

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', e => e.target.closest('.modal')?.classList.remove('active'));
});
window.addEventListener('click', e => {
    if (e.target.classList.contains('modal')) e.target.classList.remove('active');
});

medicineForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        name:           document.getElementById('medicineName')?.value?.trim(),
        generic_name:   document.getElementById('genericName')?.value?.trim() || null,
        brand:          document.getElementById('company')?.value?.trim() || null,
        category:       document.getElementById('category')?.value?.trim() || null,
        purchase_price: parseFloat(document.getElementById('purchasePrice')?.value || 0),
        selling_price:  parseFloat(document.getElementById('sellingPrice')?.value || 0),
    };

    if (!data.name || !data.purchase_price || !data.selling_price) {
        showNotification('Please fill all required fields.', 'error');
        return;
    }

    try {
        const resp = await apiService.addMedicine(data);
        if (resp.success) {
            showNotification('Medicine added successfully!', 'success');
            medicineModal?.classList.remove('active');
            medicineForm.reset();
            displayInventory();
        } else {
            showNotification(resp.message || 'Failed to add medicine.', 'error');
        }
    } catch (err) {
        showNotification('Error: ' + err.message, 'error');
    }
});

// ── Stock adjustment modal ────────────────────────────────────────────────────

function openAdjustModal(inventoryId, medicineName, currentQty) {
    const delta = prompt(`Adjust stock for "${medicineName}"\nCurrent: ${currentQty}\n\nEnter delta (e.g. +50 or -10):`);
    if (delta === null) return;
    const parsed = parseInt(delta);
    if (isNaN(parsed)) { showNotification('Invalid number.', 'error'); return; }

    apiService.request(`/inventory/${inventoryId}/adjust`, {
        method: 'POST',
        body: { delta: parsed, reason: 'Manual adjustment via admin panel' }
    }).then(resp => {
        if (resp.success) {
            showNotification(`Stock updated. New qty: ${resp.inventory.quantity}`, 'success');
            displayInventory();
        } else {
            showNotification(resp.message || 'Adjustment failed.', 'error');
        }
    }).catch(e => showNotification('Error: ' + e.message, 'error'));
}

// ── Expiry tracking ───────────────────────────────────────────────────────────

async function displayExpiryTracking() {
    const timeline   = document.getElementById('expiryTimeline');
    const expiryRange = document.getElementById('expiryRange');
    if (!timeline) return;

    async function updateTimeline() {
        timeline.innerHTML = '<p style="text-align:center;padding:2rem">Loading...</p>';
        try {
            const days = parseInt(expiryRange?.value || 30);
            const resp = await apiService.getExpiryAnalytics(days);

            const items = resp.expiring_items || [];
            if (items.length === 0) {
                timeline.innerHTML = '<p style="text-align:center;padding:2rem;color:#888">No medicines expiring in this range. ✅</p>';
                return;
            }

            const today = new Date();
            timeline.innerHTML = items.map(item => {
                const expiry = new Date(item.expiry_date);
                const daysLeft = Math.ceil((expiry - today) / 86400000);
                const riskClass = daysLeft < 0 ? 'critical' : daysLeft <= 15 ? 'critical' : 'warning';

                return `
                <div class="expiry-card ${riskClass}">
                    <div class="expiry-header">
                        <div>
                            <h4>${item.medicine_name || 'Unknown'}</h4>
                            <p style="font-size:.9rem;color:#666">${item.branch_name || ''} | Batch: ${item.batch_number || 'N/A'} | Qty: ${item.quantity}</p>
                        </div>
                        <div>
                            <div class="expiry-date">${formatDate(item.expiry_date)}</div>
                            <div class="days-left">${daysLeft < 0 ? 'EXPIRED' : daysLeft + ' days left'}</div>
                        </div>
                    </div>
                </div>`;
            }).join('');
        } catch (e) {
            timeline.innerHTML = '<p style="text-align:center;padding:2rem;color:#e53e3e">⚠️ Error loading expiry data.</p>';
        }
    }

    expiryRange?.addEventListener('change', updateTimeline);
    await updateTimeline();
}

// ── Orders management ─────────────────────────────────────────────────────────

async function displayOrdersManagement() {
    const tbody      = document.getElementById('ordersTable');
    const statusSel  = document.getElementById('orderStatus');
    if (!tbody) return;

    async function updateOrders() {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem">Loading orders...</td></tr>';
        try {
            const resp = await apiService.listBills(1, 100);
            let bills  = resp.bills || resp.items || [];

            const selected = statusSel?.value || '';
            if (selected) bills = bills.filter(b => b.payment_status === selected);

            if (bills.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#888">No orders found.</td></tr>';
                return;
            }

            tbody.innerHTML = bills.map(bill => `
                <tr>
                    <td><strong>${bill.invoice_number || `#${bill.id}`}</strong></td>
                    <td>${bill.customer_name || 'Walk-in'}</td>
                    <td>${(bill.items || []).length} item(s)</td>
                    <td><strong>${formatCurrency(bill.total_amount)}</strong></td>
                    <td><span class="order-status ${bill.payment_status || 'paid'}">${(bill.payment_status || 'paid').toUpperCase()}</span></td>
                    <td>${formatDate(bill.created_at)}</td>
                    <td>
                        <button class="btn btn-secondary" style="font-size:.8rem;padding:.3rem .7rem"
                            onclick="viewInvoice(${bill.id})">Invoice</button>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#e53e3e">⚠️ Error loading orders.</td></tr>';
        }
    }

    statusSel?.addEventListener('change', updateOrders);
    await updateOrders();
}

async function viewInvoice(saleId) {
    try {
        const resp = await apiService.getInvoiceJSON(saleId);
        if (resp.success) {
            const inv = resp.invoice;
            alert(
                `Invoice: ${inv.invoice_number}\n` +
                `Date: ${inv.date}\n` +
                `Customer: ${inv.customer?.name || 'N/A'}\n` +
                `Items: ${inv.items?.length || 0}\n` +
                `Total: ₹${inv.total_amount}`
            );
        }
    } catch (e) {
        showNotification('Could not load invoice.', 'error');
    }
}

// ── Analytics ─────────────────────────────────────────────────────────────────

async function displayAnalytics() {
    const companySalesEl  = document.getElementById('companySalesChart');
    const topSellersEl    = document.getElementById('topSellersChart');
    if (!companySalesEl || !topSellersEl) return;

    companySalesEl.innerHTML = '<p style="color:#888;padding:1rem">Loading...</p>';
    topSellersEl.innerHTML   = '<p style="color:#888;padding:1rem">Loading...</p>';

    try {
        // ── Monthly revenue ────────────────────────────────────────────────────
        const revenueResp = await apiService.getMonthlyRevenue(6);
        if (revenueResp.success && revenueResp.revenue_data?.length) {
            const maxRevenue = Math.max(...revenueResp.revenue_data.map(r => r.revenue));
            companySalesEl.innerHTML = `
                <div style="display:flex;flex-direction:column;gap:.5rem;width:100%">
                    <p style="font-weight:600;margin-bottom:.5rem;color:#4a5568">Monthly Revenue (last 6 months)</p>
                    ${revenueResp.revenue_data.map(r => {
                        const pct = maxRevenue > 0 ? (r.revenue / maxRevenue * 100) : 0;
                        return `
                        <div style="display:flex;align-items:center;gap:1rem">
                            <span style="width:80px;font-size:.85rem;color:#718096">${r.month}</span>
                            <div style="flex:1;background:#e2e8f0;border-radius:4px;height:24px;overflow:hidden">
                                <div style="width:${pct}%;background:var(--primary-color,#2B6CB0);height:100%;border-radius:4px;
                                    display:flex;align-items:center;padding-left:.5rem;color:white;font-size:.8rem;min-width:2px">
                                    ${pct > 15 ? '₹' + r.revenue.toLocaleString('en-IN') : ''}
                                </div>
                            </div>
                            <span style="font-size:.85rem;color:#4a5568;width:80px;text-align:right">₹${r.revenue.toLocaleString('en-IN')}</span>
                        </div>`;
                    }).join('')}
                </div>`;
        } else {
            companySalesEl.innerHTML = '<p style="color:#888;padding:1rem">No revenue data available yet. Start creating bills!</p>';
        }

        // ── Top medicines ──────────────────────────────────────────────────────
        const topResp = await apiService.getTopMedicines(30, 5);
        if (topResp.success && topResp.top_medicines?.length) {
            const maxUnits = Math.max(...topResp.top_medicines.map(m => m.total_units_sold));
            topSellersEl.innerHTML = `
                <div style="display:flex;flex-direction:column;gap:.75rem;width:100%">
                    <p style="font-weight:600;margin-bottom:.5rem;color:#4a5568">Top 5 Best Sellers (last 30 days)</p>
                    ${topResp.top_medicines.map((m, i) => {
                        const pct = maxUnits > 0 ? (m.total_units_sold / maxUnits * 100) : 0;
                        const colours = ['#2B6CB0','#2C7A7B','#276749','#744210','#702459'];
                        return `
                        <div>
                            <div style="display:flex;justify-content:space-between;margin-bottom:.25rem">
                                <span style="font-size:.85rem;font-weight:600">${i+1}. ${m.name}</span>
                                <span style="font-size:.8rem;color:#718096">${m.total_units_sold} units</span>
                            </div>
                            <div style="background:#e2e8f0;border-radius:4px;height:12px;overflow:hidden">
                                <div style="width:${pct}%;background:${colours[i]};height:100%;border-radius:4px"></div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>`;
        } else {
            topSellersEl.innerHTML = '<p style="color:#888;padding:1rem">No sales data yet. Create some bills to see top sellers!</p>';
        }

    } catch (e) {
        console.error('Analytics error:', e);
        companySalesEl.innerHTML = '<p style="color:#e53e3e;padding:1rem">⚠️ Analytics unavailable.</p>';
        topSellersEl.innerHTML   = '<p style="color:#e53e3e;padding:1rem">⚠️ Top sellers unavailable.</p>';
    }
}

// ── User Management ───────────────────────────────────────────────────────────

const userModal    = document.getElementById('userModal');
const addUserBtn   = document.getElementById('addUserBtn');
const userForm     = document.getElementById('userForm');

addUserBtn?.addEventListener('click', () => {
    // Reset to "add" mode
    document.getElementById('userModalTitle').textContent = 'Add New User';
    document.getElementById('editUserId').value = '';
    document.getElementById('passwordGroup').style.display = 'block';
    document.getElementById('userPassword').required = true;
    userForm?.reset();
    userModal?.classList.add('active');
});

userForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const editId   = document.getElementById('editUserId').value;
    const fullName = document.getElementById('userFullName').value.trim();
    const email    = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;
    const role     = document.getElementById('userRole').value;
    const branchId = parseInt(document.getElementById('userBranchId').value) || null;

    if (!fullName || !email || !role) {
        showNotification('Please fill all required fields.', 'error');
        return;
    }

    try {
        let resp;

        if (editId) {
            // ── Edit mode: update role/branch only ────────────────────────────
            resp = await apiService.updateUser(editId, {
                full_name: fullName,
                role:      role,
                branch_id: branchId,
            });
        } else {
            // ── Add mode: register new user ───────────────────────────────────
            if (!password || password.length < 8) {
                showNotification('Password must be at least 8 characters.', 'error');
                return;
            }
            resp = await apiService.registerUser(fullName, email, password, role, branchId);
        }

        if (resp.success) {
            showNotification(editId ? 'User updated!' : 'User created!', 'success');
            userModal?.classList.remove('active');
            userForm.reset();
            displayUsers();
        } else {
            showNotification(resp.message || 'Operation failed.', 'error');
        }
    } catch (err) {
        showNotification('Error: ' + err.message, 'error');
    }
});

async function displayUsers() {
    const tbody = document.getElementById('usersTable');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem">Loading users...</td></tr>';

    try {
        const resp = await apiService.getAllUsers(1, 100);
        const users = resp.users || [];

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#888">No users found.</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td><strong>${user.full_name || 'N/A'}</strong></td>
                <td>${user.email}</td>
                <td>
                    <span style="
                        background:${user.role === 'admin' ? '#553C9A' : '#2B6CB0'};
                        color:white;padding:.2rem .6rem;border-radius:999px;font-size:.8rem;font-weight:600">
                        ${user.role.toUpperCase()}
                    </span>
                </td>
                <td>${user.branch_name || `Branch ${user.branch_id}` || '—'}</td>
                <td>
                    <span style="
                        background:${user.is_active ? '#276749' : '#742a2a'};
                        color:white;padding:.2rem .6rem;border-radius:999px;font-size:.8rem">
                        ${user.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td style="font-size:.85rem;color:#718096">
                    ${user.last_login ? formatDate(user.last_login) : 'Never'}
                </td>
                <td style="display:flex;gap:.4rem;flex-wrap:wrap">
                    <button class="btn btn-secondary"
                        style="font-size:.8rem;padding:.3rem .7rem"
                        onclick="openEditUser(${user.id}, '${user.full_name}', '${user.email}', '${user.role}', ${user.branch_id || 1})">
                        Edit
                    </button>
                    ${user.is_active
                        ? `<button class="btn" style="font-size:.8rem;padding:.3rem .7rem;background:#E53E3E;color:white;border:none;border-radius:6px;cursor:pointer"
                            onclick="deactivateUser(${user.id}, '${user.full_name}')">
                            Deactivate
                          </button>`
                        : `<button class="btn btn-secondary"
                            style="font-size:.8rem;padding:.3rem .7rem;opacity:.6"
                            disabled>Inactive</button>`
                    }
                </td>
            </tr>
        `).join('');

    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#e53e3e">⚠️ Error loading users.</td></tr>';
    }
}

function openEditUser(id, fullName, email, role, branchId) {
    document.getElementById('userModalTitle').textContent = 'Edit User';
    document.getElementById('editUserId').value  = id;
    document.getElementById('userFullName').value = fullName;
    document.getElementById('userEmail').value    = email;
    document.getElementById('userRole').value     = role;
    document.getElementById('userBranchId').value = branchId || 1;

    // Hide password field when editing
    document.getElementById('passwordGroup').style.display = 'none';
    document.getElementById('userPassword').required = false;

    userModal?.classList.add('active');
}

async function deactivateUser(userId, userName) {
    if (!confirm(`Deactivate "${userName}"? They will no longer be able to log in.`)) return;
    try {
        const resp = await apiService.deactivateUser(userId);
        if (resp.success) {
            showNotification(`${userName} has been deactivated.`, 'success');
            displayUsers();
        } else {
            showNotification(resp.message || 'Failed to deactivate user.', 'error');
        }
    } catch (e) {
        showNotification('Error: ' + e.message, 'error');
    }
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    displayInventory(false);
});

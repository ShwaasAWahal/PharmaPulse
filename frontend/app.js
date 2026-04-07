// ============================================
// PHARMA PULSE - MAIN APPLICATION
// ============================================

// ── Auth guard ────────────────────────────────────────────────────────────────
(function () {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const protectedPages = ['index.html', 'cart.html', 'orders.html', 'profile.html', 'admin.html', ''];
    if (protectedPages.includes(currentPage)) {
        if (typeof jwtManager !== 'undefined' && !jwtManager.isAuthenticated()) {
            window.location.href = 'login.html';
            throw new Error('Not authenticated');
        }
    }
})();

// ── Helpers ───────────────────────────────────────────────────────────────────

function logout() {
    jwtManager.clearTokens();
    window.location.href = 'login.html';
}

function formatCurrency(amount) {
    return '₹' + Number(amount || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2, maximumFractionDigits: 2
    });
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

function getStockStatus(stock) {
    if (Number(stock) === 0) return { status: 'out-of-stock', text: 'Out of Stock' };
    if (stock <= 10) return { status: 'low-stock', text: 'Low Stock' };
    return { status: 'in-stock', text: 'In Stock' };
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const bg = type === 'error' ? '#E53E3E' : type === 'warning' ? '#DD6B20' : 'var(--primary-color, #2B6CB0)';
    notification.style.cssText = `
        position:fixed;top:100px;right:20px;background:${bg};color:white;
        padding:1rem 1.5rem;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.2);
        z-index:9999;max-width:320px;font-weight:500;`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3500);
}

// ── Navbar user info ──────────────────────────────────────────────────────────

async function updateNavbarWithUserInfo() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;
    try {
        const response = await apiService.getCurrentUser();
        if (response.success && response.user) {
            const user = response.user;
            const existing = navLinks.querySelector('.user-info-section');
            if (existing) existing.remove();
            navLinks.insertAdjacentHTML('beforeend', `
                <div class="user-info-section">
                    <span class="user-label">👤 ${user.full_name || user.email}</span>
                    <button class="logout-btn" onclick="logout()">🚪 Logout</button>
                </div>
            `);
        }
    } catch (e) {
        console.error('Navbar update failed:', e);
    }
}

// ── Cart ──────────────────────────────────────────────────────────────────────

class Cart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('pharmapulse_cart')) || [];
        this.updateBadge();
    }

    addItem(medicine, quantity) {
        const existing = this.items.find(i => i.id === medicine.id);
        if (existing) {
            existing.quantity += quantity;
        } else {
            this.items.push({ ...medicine, quantity });
        }
        this.save();
        this.updateBadge();
    }

    removeItem(id) {
        this.items = this.items.filter(i => i.id !== id);
        this.save();
        this.updateBadge();
    }

    updateQuantity(id, qty) {
        const item = this.items.find(i => i.id === id);
        if (item) {
            item.quantity = Math.max(0, qty);
            if (item.quantity === 0) this.removeItem(id);
            else this.save();
        }
        this.updateBadge();
    }

    getSubtotal() { return this.items.reduce((t, i) => t + i.price * i.quantity, 0); }
    getTax()      { return Math.round(this.getSubtotal() * 0.05 * 100) / 100; }
    getTotal()    { return this.getSubtotal() + this.getTax(); }

    save() { localStorage.setItem('pharmapulse_cart', JSON.stringify(this.items)); }

    clear() { this.items = []; this.save(); this.updateBadge(); }

    updateBadge() {
        const badge = document.getElementById('cartBadge');
        if (badge) badge.textContent = this.items.reduce((t, i) => t + i.quantity, 0);
    }
}

const cart = new Cart();

// ── Medicine card ─────────────────────────────────────────────────────────────

function createMedicineCard(medicine) {
    const id       = medicine.id;
    const name     = medicine.name || 'Unknown Medicine';
    const brand    = medicine.brand || medicine.supplier_name || 'Unknown Brand';
    const price    = medicine.selling_price || medicine.mrp || 0;
    const category = medicine.category || 'General';
    const form     = medicine.form || '';

    // Emoji by form
    const emojiMap = { Tablet: '💊', Capsule: '💊', Syrup: '🧴', Injection: '💉',
                       'Cream/Ointment': '🫙', Drops: '💧', Inhaler: '🫁' };
    const emoji = emojiMap[form] || '💊';

    // Stock — already merged in from inventory stockMap
    let stock = medicine.stock ?? medicine.quantity ?? 0;
    if (medicine.inventory && medicine.inventory.length > 0) {
        stock = medicine.inventory.reduce((t, inv) => t + Number(inv.quantity || 0), 0);
    }

    const stockStatus  = getStockStatus(stock);
    const isOutOfStock = stockStatus.status === 'out-of-stock';

    const card = document.createElement('div');
    card.className = 'medicine-card';
    card.setAttribute('data-medicine-id', id);
    card.innerHTML = `
        <div class="medicine-image">
            ${emoji}
            <span class="stock-badge ${stockStatus.status}">${stockStatus.text}</span>
        </div>
        <div class="medicine-content">
            <h3 class="medicine-name">${name}</h3>
            <p class="medicine-company">${brand}</p>
            <div class="medicine-details">
                <div class="medicine-detail"><span>🏷️ ${category}</span></div>
                <div class="medicine-detail"><span>📦 ${form || 'Unit'}</span></div>
            </div>
            <div class="medicine-price">${formatCurrency(price)}</div>
            <div class="medicine-actions">
                <div class="btn-quantity">
                    <button class="btn-qty-btn" onclick="decreaseQty(${id})" ${isOutOfStock ? 'disabled' : ''}>−</button>
                    <input type="number" class="btn-qty-input" id="qty-${id}" value="1" min="1" readonly ${isOutOfStock ? 'disabled' : ''}>
                    <button class="btn-qty-btn" onclick="increaseQty(${id})" ${isOutOfStock ? 'disabled' : ''}>+</button>
                </div>
                <button class="btn btn-add-cart" onclick="addToCart(${id})" ${isOutOfStock ? 'disabled' : ''}>
                    ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </button>
            </div>
        </div>
    `;
    return card;
}

// ── Cart helpers ──────────────────────────────────────────────────────────────

window.currentMedicines = [];

function addToCart(medicineId) {
    const medicine = window.currentMedicines.find(m => m.id === medicineId);
    if (!medicine) { showNotification('Medicine not found', 'error'); return; }
    const qtyInput = document.getElementById(`qty-${medicineId}`);
    const quantity = parseInt(qtyInput?.value) || 1;
    cart.addItem({
        id: medicine.id,
        name: medicine.name,
        brand: medicine.brand || '',
        price: medicine.selling_price || medicine.mrp || 0,
        inventory_id: medicine.inventory?.[0]?.id || null,
    }, quantity);
    if (qtyInput) qtyInput.value = '1';
    showNotification('✓ Added to cart!');
}

function increaseQty(id) {
    const input = document.getElementById(`qty-${id}`);
    if (input) input.value = parseInt(input.value) + 1;
}

function decreaseQty(id) {
    const input = document.getElementById(`qty-${id}`);
    if (input && parseInt(input.value) > 1) input.value = parseInt(input.value) - 1;
}

// ── Medicines page ────────────────────────────────────────────────────────────

async function initMedicinesPage() {
    const grid           = document.getElementById('medicinesGrid');
    const searchInput    = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const companyFilter  = document.getElementById('companyFilter');
    if (!grid) return;

    let currentSearch   = '';
    let currentCategory = '';
    let currentPage     = 1;

    async function fetchAndDisplay() {
        grid.innerHTML = '<p style="text-align:center;padding:2rem;grid-column:1/-1">Loading medicines...</p>';
        try {
            const userData = jwtManager.getUserData();
            const branchId = userData?.branch_id || 1;

            // Fetch medicines and stock summary in parallel
            // stock-summary gives total non-expired qty per medicine — much more accurate
            const [medResp, stockResp] = await Promise.all([
                apiService.listMedicines(currentPage, 20, currentSearch, currentCategory),
                apiService.getStockSummary(branchId)
            ]);

            if (medResp.success && medResp.medicines) {
                const stockMap = stockResp?.stock_map || {};

                const medicines = medResp.medicines.map(m => ({
                    ...m,
                    stock: stockMap[m.id] || 0
                }));

                window.currentMedicines = medicines;
                grid.innerHTML = '';
                if (medicines.length === 0) {
                    grid.innerHTML = '<p style="text-align:center;padding:2rem;grid-column:1/-1;color:#888">No medicines found.</p>';
                } else {
                    medicines.forEach(m => grid.appendChild(createMedicineCard(m)));
                }
            } else {
                grid.innerHTML = '<p style="text-align:center;padding:2rem;grid-column:1/-1;color:#e53e3e">⚠️ Could not load medicines. Is the backend running?</p>';
            }
        } catch (e) {
            console.error(e);
            grid.innerHTML = `<div style="text-align:center;padding:2rem;grid-column:1/-1;color:#e53e3e">
                <p>⚠️ Cannot reach backend at <code>http://localhost:5000</code></p>
                <p style="font-size:.9rem;margin-top:.5rem">Run: <code>cd backend && python app.py</code></p>
            </div>`;
        }
    }

    let debounceTimer;
    searchInput?.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentSearch = searchInput.value.trim();
            currentPage = 1;
            fetchAndDisplay();
        }, 400);
    });
    categoryFilter?.addEventListener('change', () => {
        currentCategory = categoryFilter.value;
        currentPage = 1;
        fetchAndDisplay();
    });

    await fetchAndDisplay();
}

// ── Cart page ─────────────────────────────────────────────────────────────────

function initCartPage() {
    const cartItemsEl = document.getElementById('cartItems');
    const emptyCartEl = document.getElementById('emptyCart');
    const subtotalEl  = document.getElementById('subtotal');
    const taxEl       = document.getElementById('tax');
    const totalEl     = document.getElementById('total');
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (!cartItemsEl) return;

    function displayCart() {
        if (cart.items.length === 0) {
            cartItemsEl.style.display = 'none';
            if (emptyCartEl) emptyCartEl.style.display = 'block';
        } else {
            cartItemsEl.style.display = 'block';
            if (emptyCartEl) emptyCartEl.style.display = 'none';
            cartItemsEl.innerHTML = '';
            cart.items.forEach(item => {
                const el = document.createElement('div');
                el.className = 'cart-item';
                el.innerHTML = `
                    <div class="cart-item-image">💊</div>
                    <div class="cart-item-details">
                        <h3>${item.name}</h3>
                        <p>${item.brand || ''}</p>
                        <p>${formatCurrency(item.price)} × ${item.quantity} = <strong>${formatCurrency(item.price * item.quantity)}</strong></p>
                        <div class="btn-quantity" style="max-width:150px">
                            <button class="btn-qty-btn" onclick="updateQty(${item.id}, ${item.quantity - 1})">−</button>
                            <input type="number" class="btn-qty-input" value="${item.quantity}" readonly>
                            <button class="btn-qty-btn" onclick="updateQty(${item.id}, ${item.quantity + 1})">+</button>
                        </div>
                    </div>
                    <div class="cart-item-remove" onclick="removeFromCart(${item.id})" style="cursor:pointer">🗑️</div>
                `;
                cartItemsEl.appendChild(el);
            });
        }
        if (subtotalEl) subtotalEl.textContent = formatCurrency(cart.getSubtotal());
        if (taxEl)      taxEl.textContent      = formatCurrency(cart.getTax());
        if (totalEl)    totalEl.textContent    = formatCurrency(cart.getTotal());
    }

    window.updateQty       = (id, qty) => { cart.updateQuantity(id, qty); displayCart(); };
    window.removeFromCart  = (id)      => { cart.removeItem(id);          displayCart(); };

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
            if (cart.items.length === 0) return;

            const userData = jwtManager.getUserData();
            const branchId = userData?.branch_id || 1;

            checkoutBtn.disabled = true;
            checkoutBtn.textContent = 'Processing...';

            try {
                const billData = {
                    branch_id: branchId,
                    customer_name: userData?.full_name || 'Walk-in Customer',
                    payment_method: 'cash',
                    amount_paid: cart.getTotal(),
                    items: cart.items.map(item => ({
                        medicine_id: item.id,
                        inventory_id: item.inventory_id || null,
                        quantity: item.quantity,
                        unit_price: item.price,
                        tax_percent: 5,
                    }))
                };

                const resp = await apiService.createBill(billData);
                if (resp.success) {
                    showNotification(`✓ Order placed! Invoice: ${resp.invoice.invoice_number}`);
                    cart.clear();
                    displayCart();
                    setTimeout(() => window.location.href = 'orders.html', 1500);
                } else {
                    showNotification(resp.message || 'Checkout failed', 'error');
                }
            } catch (e) {
                showNotification('Checkout error: ' + e.message, 'error');
            } finally {
                checkoutBtn.disabled = false;
                checkoutBtn.textContent = 'Proceed to Checkout';
            }
        });
    }

    displayCart();
}

// ── Orders page ───────────────────────────────────────────────────────────────

async function initOrdersPage() {
    const container    = document.getElementById('ordersContainer');
    const emptyOrders  = document.getElementById('emptyOrders');
    const statusFilter = document.getElementById('statusFilter');
    if (!container) return;

    let allOrders = [];

    async function fetchOrders() {
        const userData = jwtManager.getUserData();
        const currentUserName = userData?.full_name;

        container.innerHTML = '<p style="text-align:center;padding:2rem">Loading orders...</p>';
        try {
            const resp = await apiService.listBills(1, 100);
            if (resp.success && (resp.bills || resp.items)) {
                
                const rawOrders = resp.bills || resp.items || [];

                const filteredOrders = rawOrders.filter(bill => {
                    return bill.customer_name === currentUserName;
                });
                
                // allOrders = (resp.bills || resp.items).map(bill => ({

                allOrders = filteredOrders.map(bill => ({

                    id:            `INV-${bill.id}`,
                    invoiceNumber: bill.invoice_number || `#${bill.id}`,
                    items:         bill.items || [],
                    totalAmount:   bill.total_amount || 0,
                    status:        bill.payment_status || 'paid',
                    date:          bill.created_at || new Date().toISOString(),
                    customer:      bill.customer_name || 'Walk-in',
                }));



                displayOrders();
            } else {
                container.innerHTML = '';
                if (emptyOrders) emptyOrders.style.display = 'block';
            }
        } catch (e) {
            container.innerHTML = '<p style="text-align:center;padding:2rem;color:#e53e3e">⚠️ Could not load orders from backend.</p>';
        }
    }

    function displayOrders() {
        const selected = statusFilter?.value || '';
        const filtered = selected ? allOrders.filter(o => o.status === selected) : allOrders;
        container.innerHTML = '';

        if (filtered.length === 0) {
            if (emptyOrders) emptyOrders.style.display = 'block';
            return;
        }
        if (emptyOrders) emptyOrders.style.display = 'none';

        filtered.forEach(order => {
            const itemsHTML = (order.items || []).map(item =>
                `<div class="order-item">
                    <span class="order-item-name">${item.medicine_name || item.name || 'Item'}</span>
                    <span class="order-item-qty">Qty: ${item.quantity || 0}</span>
                    <span class="order-item-price">${formatCurrency((item.unit_price || 0) * (item.quantity || 0))}</span>
                </div>`
            ).join('');

            const card = document.createElement('div');
            card.className = 'order-card';
            card.innerHTML = `
                <div class="order-header">
                    <div>
                        <div class="order-id">${order.invoiceNumber}</div>
                        <p style="font-size:.9rem;color:#888">Placed on ${formatDate(order.date)}</p>
                    </div>
                    <span class="order-status ${order.status}">${order.status.toUpperCase()}</span>
                </div>
                <div class="order-items">${itemsHTML || '<p style="color:#888;padding:.5rem 0">No item details</p>'}</div>
                <div style="text-align:right;padding:1rem 0;border-top:1px solid #e2e8f0;font-weight:700">
                    Total: ${formatCurrency(order.totalAmount)}
                </div>
            `;
            container.appendChild(card);
        });
    }

    statusFilter?.addEventListener('change', displayOrders);
    await fetchOrders();
}

// ── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    await updateNavbarWithUserInfo();
    const page = window.location.pathname.split('/').pop() || 'index.html';
    if (page === 'index.html' || page === '')  initMedicinesPage();
    if (page === 'cart.html')                  initCartPage();
    if (page === 'orders.html')                initOrdersPage();
});

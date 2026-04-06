// PHARMA PULSE - MAIN APPLICATION

// ============================================
// IMMEDIATE AUTHENTICATION CHECK
// ============================================
// This runs immediately when the script loads, before DOM is ready
// Ensures users are redirected to login ASAP if not authenticated

(function() {
    // Get the current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // List of pages that require authentication
    const protectedPages = ['index.html', 'cart.html', 'orders.html', 'profile.html', 'admin.html', ''];
    
    // List of pages that don't require authentication
    const publicPages = ['login.html'];
    
    // If it's a protected page and user is not authenticated, redirect immediately
    if (protectedPages.includes(currentPage) && !publicPages.includes(currentPage)) {
        if (typeof jwtManager !== 'undefined' && !jwtManager.isAuthenticated()) {
            // Redirect to login immediately
            window.location.href = 'login.html';
            // Stop further execution
            throw new Error('User not authenticated - redirecting to login');
        }
    }
})();

// ============================================
// AUTHENTICATION UTILITIES
// ============================================


/**
 * Logout user and redirect to login page
 */
function logout() {
    if (apiService) {
        apiService.logout();
    } else {
        jwtManager.clearTokens();
    }
    window.location.href = 'login.html';
}

/**
 * Get current user info
 */
function getCurrentUserInfo() {
    const userData = jwtManager.getUserData();
    return userData || null;
}

/**
 * Update navbar with user information
 */
async function updateNavbarWithUserInfo() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    try {
        // Get user data from backend
        const response = await apiService.getCurrentUser();
        
        if (response.success && response.user) {
            const user = response.user;
            
            // Create simple user info with logout button
            let userMenuHTML = `
                <div class="user-info-section">
                    <span class="user-label">👤 ${user.full_name || user.email}</span>
                    <button class="logout-btn" onclick="logout()">🚪 Logout</button>
                </div>
            `;
            
            // Remove existing user menu if any
            const existingUserMenu = navLinks.querySelector('.user-info-section');
            if (existingUserMenu) {
                existingUserMenu.remove();
            }
            
            // Add new user menu
            navLinks.insertAdjacentHTML('beforeend', userMenuHTML);
        }
    } catch (error) {
        console.error('Error updating navbar:', error);
    }
}

// Medicine Database

const medicinesDatabase = [
    {
        id: 1,
        name: "Paracetamol 500mg",
        company: "Cipla",
        category: "pain-relief",
        emoji: "💊",
        price: 45,
        stock: 150,
        batch: "BATCH001",
        expiryDate: "2026-12-15",
        description: "Effective pain relief and fever reducer"
    },
    {
        id: 2,
        name: "Ibuprofen 400mg",
        company: "Glaxo SmithKline",
        category: "pain-relief",
        emoji: "💊",
        price: 65,
        stock: 0,
        batch: "BATCH002",
        expiryDate: "2025-08-20",
        description: "Anti-inflammatory pain reliever"
    },
    {
        id: 3,
        name: "Amoxicillin 500mg",
        company: "Lupin",
        category: "antibiotics",
        emoji: "🔬",
        price: 120,
        stock: 75,
        batch: "BATCH003",
        expiryDate: "2026-06-30",
        description: "Broad-spectrum antibiotic"
    },
    {
        id: 4,
        name: "Cough Syrup",
        company: "Sun Pharma",
        category: "cough-cold",
        emoji: "🧴",
        price: 85,
        stock: 200,
        batch: "BATCH004",
        expiryDate: "2025-11-10",
        description: "Effective cough suppressant"
    },
    {
        id: 5,
        name: "Vitamin C 1000mg",
        company: "Divi's Labs",
        category: "vitamins",
        emoji: "💪",
        price: 150,
        stock: 300,
        batch: "BATCH005",
        expiryDate: "2027-03-20",
        description: "Immune system booster"
    },
    {
        id: 6,
        name: "Ranitidine 150mg",
        company: "Cipla",
        category: "digestive",
        emoji: "🫁",
        price: 55,
        stock: 10,
        batch: "BATCH006",
        expiryDate: "2025-09-15",
        description: "Acid reflux and heartburn relief"
    },
    {
        id: 7,
        name: "Cetirizine 10mg",
        company: "Lupin",
        category: "cough-cold",
        emoji: "🤧",
        price: 35,
        stock: 250,
        batch: "BATCH007",
        expiryDate: "2026-07-22",
        description: "Antihistamine for allergies"
    },
    {
        id: 8,
        name: "Omeprazole 20mg",
        company: "Glaxo SmithKline",
        category: "digestive",
        emoji: "🫁",
        price: 95,
        stock: 120,
        batch: "BATCH008",
        expiryDate: "2026-05-30",
        description: "Gastric protection medication"
    },
    {
        id: 9,
        name: "B-Complex Vitamins",
        company: "Sun Pharma",
        category: "vitamins",
        emoji: "💪",
        price: 110,
        stock: 180,
        batch: "BATCH009",
        expiryDate: "2027-01-15",
        description: "Energy and metabolism support"
    },
    {
        id: 10,
        name: "Azithromycin 500mg",
        company: "Divi's Labs",
        category: "antibiotics",
        emoji: "🔬",
        price: 140,
        stock: 60,
        batch: "BATCH010",
        expiryDate: "2026-04-10",
        description: "Macrolide antibiotic"
    },
    {
        id: 11,
        name: "Metformin 500mg",
        company: "Cipla",
        category: "other",
        emoji: "💊",
        price: 75,
        stock: 220,
        batch: "BATCH011",
        expiryDate: "2026-08-25",
        description: "Diabetes management medication"
    },
    {
        id: 12,
        name: "Aspirin 75mg",
        company: "Lupin",
        category: "pain-relief",
        emoji: "💊",
        price: 40,
        stock: 5,
        batch: "BATCH012",
        expiryDate: "2025-07-20",
        description: "Antiplatelet medication"
    }
];

// Mock Order Data
const orderDatabase = [
    {
        id: "ORD001",
        items: [
            { name: "Paracetamol 500mg", qty: 2, price: 45 },
            { name: "Vitamin C 1000mg", qty: 1, price: 150 }
        ],
        totalAmount: 240,
        status: "delivered",
        date: "2026-03-15",
        timeline: [
            { step: "Order Placed", date: "2026-03-15", completed: true },
            { step: "Processing", date: "2026-03-15", completed: true },
            { step: "Shipped", date: "2026-03-17", completed: true },
            { step: "Delivered", date: "2026-03-20", completed: true }
        ]
    },
    {
        id: "ORD002",
        items: [
            { name: "Amoxicillin 500mg", qty: 1, price: 120 }
        ],
        totalAmount: 120,
        status: "shipped",
        date: "2026-03-22",
        timeline: [
            { step: "Order Placed", date: "2026-03-22", completed: true },
            { step: "Processing", date: "2026-03-22", completed: true },
            { step: "Shipped", date: "2026-03-24", completed: true },
            { step: "Delivered", date: "2026-03-27", completed: false }
        ]
    }
];

// Cart Management
class Cart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cart')) || [];
        this.updateBadge();
    }

    addItem(medicine, quantity) {
        const existingItem = this.items.find(item => item.id === medicine.id);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                ...medicine,
                quantity: quantity
            });
        }
        this.save();
        this.updateBadge();
    }

    removeItem(medicineId) {
        this.items = this.items.filter(item => item.id !== medicineId);
        this.save();
        this.updateBadge();
    }

    updateQuantity(medicineId, quantity) {
        const item = this.items.find(item => item.id === medicineId);
        if (item) {
            item.quantity = Math.max(0, quantity);
            if (item.quantity === 0) {
                this.removeItem(medicineId);
            } else {
                this.save();
            }
        }
        this.updateBadge();
    }

    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getTax() {
        return Math.round(this.getTotal() * 0.05 * 100) / 100;
    }

    getFinalTotal() {
        return this.getTotal() + this.getTax();
    }

    save() {
        localStorage.setItem('cart', JSON.stringify(this.items));
    }

    updateBadge() {
        const badge = document.getElementById('cartBadge');
        if (badge) {
            badge.textContent = this.items.length;
        }
    }

    clear() {
        this.items = [];
        this.save();
        this.updateBadge();
    }
}

// Initialize Cart
const cart = new Cart();

// Helper Functions
function getStockStatus(stock) {
    if (stock === 0) return { status: 'out-of-stock', text: 'Out of Stock' };
    if (stock <= 10) return { status: 'low-stock', text: 'Low Stock' };
    return { status: 'in-stock', text: 'In Stock' };
}

function getExpiryStatus(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { status: 'expired', text: 'EXPIRED', daysLeft };
    if (daysLeft <= 30) return { status: 'expiring-soon', text: 'EXPIRING SOON', daysLeft };
    return { status: 'ok', text: 'Valid', daysLeft };
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatCurrency(amount) {
    return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Medicine Card Rendering
function createMedicineCard(medicine) {
    // Handle both API format and mock data format
    const medicineId = medicine.id;
    const name = medicine.name || 'Unknown Medicine';
    const company = medicine.brand || medicine.company || 'Unknown Brand';
    const price = medicine.selling_price || medicine.price || 0;
    const stock = medicine.stock || 0; // NOTE: API may use inventory system, stock might need to be fetched separately
    const category = medicine.category || 'other';
    const emoji = medicine.emoji || '💊';
    const batch = medicine.batch || medicine.batch_number || 'N/A';
    const expiryDate = medicine.expiryDate || medicine.expiry_date || new Date().toISOString().split('T')[0];
    
    const stockStatus = getStockStatus(stock);
    const isOutOfStock = stockStatus.status === 'out-of-stock';
    
    const card = document.createElement('div');
    card.className = 'medicine-card';
    card.innerHTML = `
        <div class="medicine-image">
            ${emoji}
            <span class="stock-badge ${stockStatus.status}">${stockStatus.text}</span>
        </div>
        <div class="medicine-content">
            <h3 class="medicine-name">${name}</h3>
            <p class="medicine-company">${company}</p>
            <div class="medicine-details">
                <div class="medicine-detail">
                    <span>📦 Batch: ${batch}</span>
                </div>
                <div class="medicine-detail">
                    <span>📅 ${formatDate(expiryDate)}</span>
                </div>
            </div>
            <div class="medicine-price">${formatCurrency(price)}</div>
            <div class="medicine-actions">
                <div class="btn-quantity">
                    <button class="btn-qty-btn" id="dec-${medicineId}" onclick="decreaseQty(${medicineId})" ${isOutOfStock ? 'disabled' : ''}>−</button>
                    <input type="number" class="btn-qty-input" id="qty-${medicineId}" value="1" min="1" max="${stock}" readonly ${isOutOfStock ? 'disabled' : ''}>
                    <button class="btn-qty-btn" id="inc-${medicineId}" onclick="increaseQty(${medicineId}, ${stock})" ${isOutOfStock ? 'disabled' : ''}>+</button>
                </div>
                <button class="btn btn-add-cart" id="btn-${medicineId}" onclick="addToCart(${medicineId})" ${isOutOfStock ? 'disabled' : ''}>
                    ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </button>
            </div>
        </div>
    `;
    return card;
}

// Cart Functions
function addToCart(medicineId) {
    // Search in allMedicines (from API) first, then fallback to mock database
    let medicine = null;
    
    // Get all medicines from page (if we've loaded them)
    const grid = document.getElementById('medicinesGrid');
    if (grid) {
        // Try to get from nearby data if available
        const medicineCards = grid.querySelectorAll('[data-medicine-id]');
        const card = Array.from(medicineCards).find(c => parseInt(c.getAttribute('data-medicine-id')) === medicineId);
        if (card && window.currentMedicines) {
            medicine = window.currentMedicines.find(m => m.id === medicineId);
        }
    }
    
    // Fallback to mock database
    if (!medicine && medicinesDatabase) {
        medicine = medicinesDatabase.find(m => m.id === medicineId);
    }
    
    if (!medicine) {
        console.warn(`Medicine with ID ${medicineId} not found`);
        showNotification('Medicine not found!');
        return;
    }
    
    const qtyInput = document.getElementById(`qty-${medicineId}`);
    const quantity = parseInt(qtyInput?.value) || 1;
    
    if (quantity > 0) {
        // Normalize the medicine object for cart storage
        const cartItem = {
            id: medicine.id,
            name: medicine.name || 'Unknown Medicine',
            brand: medicine.brand || medicine.company || 'Unknown Brand',
            company: medicine.company || medicine.brand || 'Unknown Brand',
            price: medicine.selling_price || medicine.price || 0,
            emoji: medicine.emoji || '💊',
            stock: medicine.stock || 0
        };
        
        cart.addItem(cartItem, quantity);
        if (qtyInput) qtyInput.value = '1';
        showNotification('✓ Added to cart!');
    }
}

function increaseQty(medicineId, maxStock) {
    const input = document.getElementById(`qty-${medicineId}`);
    const current = parseInt(input.value) || 1;
    if (current < maxStock) {
        input.value = current + 1;
    }
}

function decreaseQty(medicineId) {
    const input = document.getElementById(`qty-${medicineId}`);
    const current = parseInt(input.value) || 1;
    if (current > 1) {
        input.value = current - 1;
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--primary-color);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 999;
        animation: slide-in 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fade-out 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Page-Specific Initialization
async function initMedicinesPage() {
    const grid = document.getElementById('medicinesGrid');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const companyFilter = document.getElementById('companyFilter');

    if (!grid) return;

    // Store medicines fetched from API
    let allMedicines = [];
    let isLoading = false;

    // Function to fetch medicines from backend API
    async function fetchMedicinesFromAPI(search = '', category = '', page = 1) {
        try {
            isLoading = true;
            grid.innerHTML = '<p style="text-align: center; padding: 2rem;">Loading medicines...</p>';
            
            const response = await apiService.listMedicines(page, 20, search, category);
            
            if (response.success && response.medicines) {
                allMedicines = response.medicines;
                filterAndDisplay();
            } else {
                grid.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-gray);">No medicines found or error loading data</p>';
                console.warn('API Response:', response);
            }
        } catch (error) {
            console.error('Error fetching medicines:', error);
            // MANUAL ACTION: Make sure backend is running on http://localhost:5000
            grid.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-red);">
                    <p>⚠️ Error loading medicines from backend</p>
                    <p style="font-size: 0.9rem; color: var(--text-gray);">Please check if the backend server is running on http://localhost:5000</p>
                    <p style="font-size: 0.85rem; color: var(--text-gray);">Backend Command: <code>cd backend && python app.py</code></p>
                </div>
            `;
            // Fallback to local database if available
            if (medicinesDatabase && medicinesDatabase.length > 0) {
                console.log('Falling back to local medicines database...');
                allMedicines = medicinesDatabase;
                filterAndDisplay();
            }
        } finally {
            isLoading = false;
        }
    }

    function filterAndDisplay() {
        const searchTerm = searchInput?.value?.toLowerCase() || '';
        const selectedCategory = categoryFilter?.value || '';
        const selectedCompany = companyFilter?.value || '';

        // Filter from API medicines or fallback to local database
        const medicinesToFilter = allMedicines.length > 0 ? allMedicines : medicinesDatabase;
        
        const filtered = medicinesToFilter.filter(medicine => {
            const name = (medicine.name || '').toLowerCase();
            const company = (medicine.brand || medicine.company || '').toLowerCase();
            const category = (medicine.category || '').toLowerCase();
            
            const matchesSearch = name.includes(searchTerm) || company.includes(searchTerm);
            const matchesCategory = !selectedCategory || category.includes(selectedCategory);
            const matchesCompany = !selectedCompany || company.includes(selectedCompany);

            return matchesSearch && matchesCategory && matchesCompany;
        });

        grid.innerHTML = '';
        if (filtered.length === 0) {
            grid.innerHTML = '<p style="text-align: center; padding: 2rem; grid-column: 1/-1;">No medicines found matching your criteria.</p>';
        } else {
            filtered.forEach(medicine => {
                const medicineCard = createMedicineCard(medicine);
                grid.appendChild(medicineCard);
            });
        }
    }

    // Event listeners for filtering
    searchInput?.addEventListener('input', () => {
        if (!isLoading) filterAndDisplay();
    });
    categoryFilter?.addEventListener('change', () => {
        if (!isLoading) filterAndDisplay();
    });
    companyFilter?.addEventListener('change', () => {
        if (!isLoading) filterAndDisplay();
    });

    // Initial fetch from API
    await fetchMedicinesFromAPI();
}

function initCartPage() {
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const subtotalEl = document.getElementById('subtotal');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (!cartItemsContainer) return;

    function displayCart() {
        if (cart.items.length === 0) {
            cartItemsContainer.style.display = 'none';
            emptyCart.style.display = 'block';
        } else {
            cartItemsContainer.style.display = 'block';
            emptyCart.style.display = 'none';
            
            cartItemsContainer.innerHTML = '';
            cart.items.forEach(item => {
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <div class="cart-item-image">${item.emoji}</div>
                    <div class="cart-item-details">
                        <h3>${item.name}</h3>
                        <p>${item.company}</p>
                        <p>${formatCurrency(item.price)} × ${item.quantity} = <strong>${formatCurrency(item.price * item.quantity)}</strong></p>
                        <div class="btn-quantity" style="max-width: 150px;">
                            <button class="btn-qty-btn" onclick="updateQty(${item.id}, ${item.quantity - 1})">−</button>
                            <input type="number" class="btn-qty-input" value="${item.quantity}" readonly>
                            <button class="btn-qty-btn" onclick="updateQty(${item.id}, ${item.quantity + 1})">+</button>
                        </div>
                    </div>
                    <div class="cart-item-remove" onclick="removeFromCart(${item.id})">🗑️</div>
                `;
                cartItemsContainer.appendChild(cartItem);
            });
        }

        // Update summary
        subtotalEl.textContent = formatCurrency(cart.getTotal());
        taxEl.textContent = formatCurrency(cart.getTax());
        totalEl.textContent = formatCurrency(cart.getFinalTotal());
    }

    window.updateQty = function(medicineId, newQty) {
        cart.updateQuantity(medicineId, newQty);
        displayCart();
    };

    window.removeFromCart = function(medicineId) {
        cart.removeItem(medicineId);
        displayCart();
    };

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.items.length > 0) {
                alert('Order placed successfully! Total: ' + formatCurrency(cart.getFinalTotal()));
                cart.clear();
                displayCart();
                window.location.href = 'orders.html';
            }
        });
    }

    displayCart();
}

function initOrdersPage() {
    const ordersContainer = document.getElementById('ordersContainer');
    const emptyOrders = document.getElementById('emptyOrders');
    const statusFilter = document.getElementById('statusFilter');

    if (!ordersContainer) return;

    let allOrders = [];

    // Fetch orders from backend API
    async function fetchOrdersFromAPI() {
        try {
            ordersContainer.innerHTML = '<p style="text-align: center; padding: 2rem;">Loading orders...</p>';
            
            const response = await apiService.listBills(1, 100); // Fetch up to 100 recent orders
            
            if (response.success && response.bills) {
                // Transform API response to match UI expectations
                allOrders = response.bills.map(bill => ({
                    id: 'ORD' + bill.id,
                    items: bill.items || [],
                    totalAmount: bill.total_amount || bill.grand_total || 0,
                    status: bill.status || 'processing',
                    date: bill.created_at || new Date().toISOString().split('T')[0],
                    invoiceNumber: bill.invoice_number || '',
                    // MANUAL NOTE: Add timeline data from your backend if available
                    // or set default timeline based on status
                    timeline: getTimelineFromStatus(bill.status || 'processing', bill.created_at)
                }));
                displayOrders();
            } else {
                ordersContainer.innerHTML = '';
                emptyOrders.style.display = 'block';
                console.warn('API Response:', response);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            ordersContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-red);">
                    <p>⚠️ Error loading orders from backend</p>
                    <p style="font-size: 0.9rem; color: var(--text-gray);">Please ensure backend is running on http://localhost:5000</p>
                </div>
            `;
            // Fallback to local database
            if (orderDatabase && orderDatabase.length > 0) {
                console.log('Falling back to local orders database...');
                allOrders = orderDatabase;
                displayOrders();
            }
        }
    }

    function displayOrders() {
        const selectedStatus = statusFilter?.value || '';
        const filtered = selectedStatus 
            ? allOrders.filter(order => order.status === selectedStatus)
            : allOrders;

        ordersContainer.innerHTML = '';
        
        if (filtered.length === 0) {
            emptyOrders.style.display = 'block';
            return;
        }

        emptyOrders.style.display = 'none';

        filtered.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';
            
            const timelineHTML = (order.timeline || []).map(step => `
                <div class="timeline-step">
                    <div class="timeline-dot ${step.completed ? 'active' : ''}"></div>
                    <div class="timeline-content">
                        <div class="timeline-label">${step.step}</div>
                        <div class="timeline-date">${formatDate(step.date)}</div>
                    </div>
                </div>
            `).join('');

            const itemsHTML = (order.items || []).map(item => `
                <div class="order-item">
                    <span class="order-item-name">${item.medicine ? item.medicine.name : (item.name || 'Item')}</span>
                    <span class="order-item-qty">Qty: ${item.quantity || item.qty || 0}</span>
                    <span class="order-item-price">${formatCurrency((item.unit_price || item.price || 0) * (item.quantity || item.qty || 0))}</span>
                </div>
            `).join('');

            orderCard.innerHTML = `
                <div class="order-header">
                    <div>
                        <div class="order-id">Order #${order.id}</div>
                        <p style="font-size: 0.9rem; color: var(--text-gray);">Placed on ${formatDate(order.date)}</p>
                    </div>
                    <span class="order-status ${order.status}">${order.status.toUpperCase()}</span>
                </div>
                <div class="order-items">
                    ${itemsHTML}
                </div>
                <div style="text-align: right; padding: var(--spacing-lg) 0; border-top: 1px solid var(--border-color); font-weight: 700;">
                    Total: ${formatCurrency(order.totalAmount)}
                </div>
                <div class="order-timeline">
                    ${timelineHTML}
                </div>
            `;
            ordersContainer.appendChild(orderCard);
        });
    }

    statusFilter?.addEventListener('change', displayOrders);
    
    // Fetch orders from API
    fetchOrdersFromAPI();
}

// Helper function to create timeline based on order status
function getTimelineFromStatus(status, createdDate) {
    const baseDate = new Date(createdDate);
    const timeline = [];

    const statuses = ['Order Placed', 'Processing', 'Shipped', 'Delivered'];
    const statusMap = {
        'pending': ['Order Placed', 'Processing'],
        'processing': ['Order Placed', 'Processing'],
        'shipped': ['Order Placed', 'Processing', 'Shipped'],
        'delivered': ['Order Placed', 'Processing', 'Shipped', 'Delivered'],
        'cancelled': ['Order Placed', 'Cancelled']
    };

    const completedSteps = statusMap[status] || ['Order Placed'];
    
    completedSteps.forEach((step, idx) => {
        const stepDate = new Date(baseDate);
        stepDate.setDate(stepDate.getDate() + (idx * 2)); // Add 2 days per step for demo
        timeline.push({
            step: step,
            date: stepDate.toISOString().split('T')[0],
            completed: true
        });
    });

    // Add remaining steps as incomplete
    if (status !== 'delivered' && status !== 'cancelled') {
        statuses.forEach((step, idx) => {
            if (!completedSteps.includes(step)) {
                const stepDate = new Date(baseDate);
                stepDate.setDate(stepDate.getDate() + (completedSteps.length + idx) * 2);
                timeline.push({
                    step: step,
                    date: stepDate.toISOString().split('T')[0],
                    completed: false
                });
            }
        });
    }

    return timeline;
}

// Initialize the page based on current location
document.addEventListener('DOMContentLoaded', async () => {
    // Note: Authentication check is done immediately when script loads (see top of file)
    // If user is not authenticated, they're redirected before this event fires
    
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Update navbar with user info (now running on authenticated pages only)
    await updateNavbarWithUserInfo();
    
    // Initialize page-specific functionality
    switch (currentPage) {
        case 'index.html':
        case '':
            initMedicinesPage();
            break;
        case 'cart.html':
            initCartPage();
            break;
        case 'orders.html':
            initOrdersPage();
            break;
    }
});

// Export for admin page
window.medicinesDatabase = medicinesDatabase;
window.orderDatabase = orderDatabase;

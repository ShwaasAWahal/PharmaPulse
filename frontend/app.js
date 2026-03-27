// PHARMA PULSE - MAIN APPLICATION

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
    const stockStatus = getStockStatus(medicine.stock);
    const isOutOfStock = stockStatus.status === 'out-of-stock';
    
    const card = document.createElement('div');
    card.className = 'medicine-card';
    card.innerHTML = `
        <div class="medicine-image">
            ${medicine.emoji}
            <span class="stock-badge ${stockStatus.status}">${stockStatus.text}</span>
        </div>
        <div class="medicine-content">
            <h3 class="medicine-name">${medicine.name}</h3>
            <p class="medicine-company">${medicine.company}</p>
            <div class="medicine-details">
                <div class="medicine-detail">
                    <span>📦 Batch: ${medicine.batch}</span>
                </div>
                <div class="medicine-detail">
                    <span>📅 ${formatDate(medicine.expiryDate)}</span>
                </div>
            </div>
            <div class="medicine-price">${formatCurrency(medicine.price)}</div>
            <div class="medicine-actions">
                <div class="btn-quantity">
                    <button class="btn-qty-btn" id="dec-${medicine.id}" onclick="decreaseQty(${medicine.id})" ${isOutOfStock ? 'disabled' : ''}>−</button>
                    <input type="number" class="btn-qty-input" id="qty-${medicine.id}" value="1" min="1" max="${medicine.stock}" readonly ${isOutOfStock ? 'disabled' : ''}>
                    <button class="btn-qty-btn" id="inc-${medicine.id}" onclick="increaseQty(${medicine.id}, ${medicine.stock})" ${isOutOfStock ? 'disabled' : ''}>+</button>
                </div>
                <button class="btn btn-add-cart" id="btn-${medicine.id}" onclick="addToCart(${medicine.id})" ${isOutOfStock ? 'disabled' : ''}>
                    ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </button>
            </div>
        </div>
    `;
    return card;
}

// Cart Functions
function addToCart(medicineId) {
    const medicine = medicinesDatabase.find(m => m.id === medicineId);
    const qtyInput = document.getElementById(`qty-${medicineId}`);
    const quantity = parseInt(qtyInput.value) || 1;
    
    if (medicine && quantity > 0) {
        cart.addItem(medicine, quantity);
        qtyInput.value = '1';
        showNotification('Added to cart!');
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
function initMedicinesPage() {
    const grid = document.getElementById('medicinesGrid');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const companyFilter = document.getElementById('companyFilter');

    if (!grid) return;

    function filterAndDisplay() {
        const searchTerm = searchInput?.value?.toLowerCase() || '';
        const selectedCategory = categoryFilter?.value || '';
        const selectedCompany = companyFilter?.value || '';

        const filtered = medicinesDatabase.filter(medicine => {
            const matchesSearch = medicine.name.toLowerCase().includes(searchTerm) ||
                                 medicine.company.toLowerCase().includes(searchTerm);
            const matchesCategory = !selectedCategory || medicine.category === selectedCategory;
            const matchesCompany = !selectedCompany || medicine.company.toLowerCase() === selectedCompany;

            return matchesSearch && matchesCategory && matchesCompany;
        });

        grid.innerHTML = '';
        filtered.forEach(medicine => {
            grid.appendChild(createMedicineCard(medicine));
        });
    }

    // Event listeners for filtering
    searchInput?.addEventListener('input', filterAndDisplay);
    categoryFilter?.addEventListener('change', filterAndDisplay);
    companyFilter?.addEventListener('change', filterAndDisplay);

    // Initial display
    filterAndDisplay();
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

    function displayOrders() {
        const selectedStatus = statusFilter?.value || '';
        const filtered = selectedStatus 
            ? orderDatabase.filter(order => order.status === selectedStatus)
            : orderDatabase;

        ordersContainer.innerHTML = '';
        
        if (filtered.length === 0) {
            emptyOrders.style.display = 'block';
            return;
        }

        emptyOrders.style.display = 'none';

        filtered.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';
            
            const timelineHTML = order.timeline.map(step => `
                <div class="timeline-step">
                    <div class="timeline-dot ${step.completed ? 'active' : ''}"></div>
                    <div class="timeline-content">
                        <div class="timeline-label">${step.step}</div>
                        <div class="timeline-date">${formatDate(step.date)}</div>
                    </div>
                </div>
            `).join('');

            const itemsHTML = order.items.map(item => `
                <div class="order-item">
                    <span class="order-item-name">${item.name}</span>
                    <span class="order-item-qty">Qty: ${item.qty}</span>
                    <span class="order-item-price">${formatCurrency(item.price * item.qty)}</span>
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
    displayOrders();
}

// Initialize the page based on current location
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
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

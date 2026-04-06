// PHARMA PULSE - ADMIN DASHBOARD - BACKEND INTEGRATED

// Sidebar Navigation
const sidebarLinks = document.querySelectorAll('.sidebar-link');
const adminSections = document.querySelectorAll('.admin-section');

sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionName = link.dataset.section;
        
        // Remove active class from all links
        sidebarLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Hide all sections
        adminSections.forEach(section => section.classList.remove('active'));
        
        // Show selected section
        const section = document.getElementById(`${sectionName}-section`);
        if (section) {
            section.classList.add('active');
        }
        
        // Initialize data for the section
        if (sectionName === 'inventory') {
            displayInventory();
        } else if (sectionName === 'expiry') {
            displayExpiryTracking();
        } else if (sectionName === 'orders') {
            displayOrdersManagement();
        } else if (sectionName === 'analytics') {
            displayAnalytics();
        }
    });
});

// Modal Management
const medicineModal = document.getElementById('medicineModal');
const addMedicineBtn = document.getElementById('addMedicineBtn');
const medicineForm = document.getElementById('medicineForm');
const closeModals = document.querySelectorAll('.close-modal');

if (addMedicineBtn) {
    addMedicineBtn.addEventListener('click', () => {
        if (medicineForm) medicineForm.reset();
        if (medicineModal) medicineModal.classList.add('active');
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

// Inventory Management
function getExpiryStatus(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
        return { status: 'expired', badge: 'status-expired', text: 'EXPIRED' };
    }
    if (daysLeft <= 30) {
        return { status: 'expiring', badge: 'status-expiring', text: `EXPIRING IN ${daysLeft}D` };
    }
    return { status: 'ok', badge: 'status-ok', text: 'VALID' };
}

function getStockStatus(stock) {
    if (stock === 0) return { status: 'out-of-stock', badge: 'status-out-of-stock', text: 'OUT OF STOCK' };
    if (stock <= 10) return { status: 'low', badge: 'status-expiring', text: 'LOW STOCK' };
    return { status: 'ok', badge: 'status-ok', text: 'IN STOCK' };
}

async function displayInventory() {
    const table = document.getElementById('inventoryTable');
    const totalMedicines = document.getElementById('totalMedicines');
    const lowStock = document.getElementById('lowStock');
    const outOfStock = document.getElementById('outOfStock');
    const expiringSoon = document.getElementById('expiringSoon');

    if (!table) return;

    try {
        // Fetch inventory from backend API
        const response = await apiService.listInventory(1, 100);
        
        if (!response.success || !response.inventory) {
            console.warn('Failed to fetch inventory:', response);
            table.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-red);">Error loading inventory. Backend may not be running.</td></tr>';
            return;
        }

        const inventory = response.inventory || [];
        let lowStockCount = 0;
        let outOfStockCount = 0;
        let expiringCount = 0;
        let totalCount = 0;

        table.innerHTML = inventory.map(item => {
            const medicine = item.medicine || {};
            const stock = item.quantity || 0;
            const expiryDate = item.expiry_date || item.expiryDate || new Date().toISOString().split('T')[0];
            
            const stockStatus = getStockStatus(stock);
            const expiryStatus = getExpiryStatus(expiryDate);
            
            // Update counters
            if (stockStatus.status === 'low') lowStockCount++;
            if (stockStatus.status === 'out-of-stock') outOfStockCount++;
            if (expiryStatus.status !== 'ok') expiringCount++;
            totalCount++;

            return `
                <tr>
                    <td><strong>${medicine.name || 'N/A'}</strong></td>
                    <td>${medicine.brand || 'N/A'}</td>
                    <td>${item.batch_number || 'N/A'}</td>
                    <td>${stock}</td>
                    <td>₹${(item.selling_price || 0).toFixed(2)}</td>
                    <td>${formatDate(expiryDate)}</td>
                    <td>
                        <span class="status-badge ${expiryStatus.badge}">${expiryStatus.text}</span>
                    </td>
                    <td>
                        <button class="btn btn-secondary" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;" onclick="editInventoryItem(${item.id})">Edit</button>
                    </td>
                </tr>
            `;
        }).join('');

        // Update stats
        if (totalMedicines) totalMedicines.textContent = totalCount;
        if (lowStock) lowStock.textContent = lowStockCount;
        if (outOfStock) outOfStock.textContent = outOfStockCount;
        if (expiringSoon) expiringSoon.textContent = expiringCount;

    } catch (error) {
        console.error('Error fetching inventory:', error);
        table.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-red);">⚠️ Error loading inventory from backend</td></tr>';
        // MANUAL ACTION: Ensure backend is running on http://localhost:5000
    }
}

function editInventoryItem(inventoryId) {
    // NOTE: Implement editing functionality based on API response
    alert(`Edit inventory item ${inventoryId} - Feature coming soon`);
}

medicineForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('medicineName')?.value;
    const company = document.getElementById('company')?.value;
    const purchasePrice = parseFloat(document.getElementById('purchasePrice')?.value || 0);
    const sellingPrice = parseFloat(document.getElementById('sellingPrice')?.value || 0);
    const category = document.getElementById('category')?.value;
    const genericName = document.getElementById('genericName')?.value;

    if (!name || !sellingPrice || !purchasePrice) {
        showNotification('Please fill in required fields', 'error');
        return;
    }

    try {
        // NOTE: Backend may need to implement POST /medicines endpoint
        const response = await apiService.addMedicine({
            name: name,
            brand: company,
            purchase_price: purchasePrice,
            selling_price: sellingPrice,
            category: category,
            generic_name: genericName
        });

        if (response.success) {
            showNotification('Medicine added successfully!', 'success');
            if (medicineModal) medicineModal.classList.remove('active');
            medicineForm.reset();
            displayInventory();
        } else {
            showNotification(response.message || 'Failed to add medicine', 'error');
        }
    } catch (error) {
        console.error('Error adding medicine:', error);
        showNotification('Note: Backend may not support adding medicines yet. ' + error.message, 'error');
        // MANUAL ACTION: Ensure backend implements POST /medicines endpoint
    }
});

// Expiry Date Tracking
async function displayExpiryTracking() {
    const timeline = document.getElementById('expiryTimeline');
    const expiryRange = document.getElementById('expiryRange');

    if (!timeline) return;

    async function updateTimeline() {
        try {
            const range = parseInt(expiryRange?.value || 30);
            const response = await apiService.getExpiryAnalytics(range);
            
            if (response.success && response.expiring_items) {
                const sorted = response.expiring_items;
                const today = new Date();

                timeline.innerHTML = sorted.map(item => {
                    const medicine = item.medicine || {};
                    const expiryDate = item.expiry_date || new Date().toISOString().split('T')[0];
                    const expiry = new Date(expiryDate);
                    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
                    let riskClass = 'normal';
                    
                    if (daysLeft < 0) riskClass = 'critical';
                    else if (daysLeft <= 15) riskClass = 'critical';
                    else if (daysLeft <= 30) riskClass = 'warning';

                    return `
                        <div class="expiry-card ${riskClass}">
                            <div class="expiry-header">
                                <div>
                                    <h4>${medicine.name || 'Unknown'}</h4>
                                    <p style="font-size: 0.9rem; color: var(--text-gray);">${medicine.brand || 'N/A'} | Batch: ${item.batch_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <div class="expiry-date">${formatDate(expiryDate)}</div>
                                    <div class="days-left">${daysLeft < 0 ? 'EXPIRED' : daysLeft + ' days left'}</div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

                if (sorted.length === 0) {
                    timeline.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-gray);">No medicines in this range</p>';
                }
            } else {
                // Fallback to local database
                throw new Error('API not available');
            }
        } catch (error) {
            console.error('Error fetching expiry data:', error);
            // MANUAL ACTION: Check if backend implements GET /analytics/expiry endpoint
            timeline.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-red);">⚠️ Error loading expiry data from backend</p>';
        }
    }

    expiryRange?.addEventListener('change', updateTimeline);
    await updateTimeline();
}

// Orders Management
async function displayOrdersManagement() {
    const table = document.getElementById('ordersTable');
    const orderStatus = document.getElementById('orderStatus');

    if (!table) return;

    async function updateOrders() {
        try {
            const selectedStatus = orderStatus?.value || '';
            const response = await apiService.listBills(1, 100);

            if (response.success && response.bills) {
                const bills = response.bills;
                let filtered = bills;

                if (selectedStatus) {
                    filtered = bills.filter(bill => bill.status === selectedStatus);
                }

                table.innerHTML = filtered.map(bill => {
                    const itemsText = (bill.items || []).map(item => item.medicine ? item.medicine.name : 'Item').join(', ');
                    const statusClass = `order-status ${bill.status}`;
                    
                    return `
                        <tr>
                            <td><strong>ORD${bill.id}</strong></td>
                            <td>${bill.customer_name || 'Walk-in Customer'}</td>
                            <td>${itemsText || 'No items'}</td>
                            <td>₹${(bill.grand_total || 0).toFixed(2)}</td>
                            <td><span class="${statusClass}">${(bill.status || 'pending').toUpperCase()}</span></td>
                            <td>${formatDate(bill.created_at || new Date().toISOString().split('T')[0])}</td>
                            <td>
                                <button class="btn btn-secondary" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;" onclick="alert('Order status update not available')">View</button>
                            </td>
                        </tr>
                    `;
                }).join('');

                if (filtered.length === 0) {
                    table.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-gray);">No orders found</td></tr>';
                }
            } else {
                throw new Error('Failed to fetch bills');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            table.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-red);">⚠️ Error loading bills from backend</td></tr>';
        }
    }

    orderStatus?.addEventListener('change', updateOrders);
    await updateOrders();
}

// Analytics
async function displayAnalytics() {
    const companySalesChart = document.getElementById('companySalesChart');
    const topSellersChart = document.getElementById('topSellersChart');

    if (!companySalesChart || !topSellersChart) return;

    try {
        // Fetch analytics from backend
        const response = await apiService.getSalesAnalytics('monthly');

        if (response.success) {
            // NOTE: Format analytics data based on backend response
            // For now, show placeholder with backend note
            companySalesChart.innerHTML = '<p style="color: var(--text-gray);">📊 Analytics data loading from backend...</p>';
            topSellersChart.innerHTML = '<p style="color: var(--text-gray);">📊 Top sellers data loading from backend...</p>';
        } else {
            throw new Error('Analytics not available');
        }
    } catch (error) {
        console.error('Error fetching analytics:', error);
        companySalesChart.innerHTML = '<p style="color: var(--text-red);">⚠️ Analytics unavailable from backend</p>';
        topSellersChart.innerHTML = '<p style="color: var(--text-red);">⚠️ Top sellers unavailable from backend</p>';
        // MANUAL ACTION: Ensure backend implements GET /analytics/sales and related endpoints
    }
}

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
    displayInventory();
});

// Helper to show notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'error' ? '#e53e3e' : type === 'success' ? '#48bb78' : '#4299e1';
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 999;
        max-width: 300px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

    topSellersChart.innerHTML = topSellersHTML;

// Format Date Helper
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    displayInventory();
});

// PHARMA PULSE - ADMIN DASHBOARD

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
        medicineForm.reset();
        medicineModal.classList.add('active');
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

function displayInventory() {
    const table = document.getElementById('inventoryTable');
    const totalMedicines = document.getElementById('totalMedicines');
    const lowStock = document.getElementById('lowStock');
    const outOfStock = document.getElementById('outOfStock');
    const expiringSoon = document.getElementById('expiringSoon');

    if (!table) return;

    let lowStockCount = 0;
    let outOfStockCount = 0;
    let expiringCount = 0;

    table.innerHTML = medicinesDatabase.map(medicine => {
        const stockStatus = getStockStatus(medicine.stock);
        const expiryStatus = getExpiryStatus(medicine.expiryDate);
        
        // Update counters
        if (stockStatus.status === 'low') lowStockCount++;
        if (stockStatus.status === 'out-of-stock') outOfStockCount++;
        if (expiryStatus.status !== 'ok') expiringCount++;

        return `
            <tr>
                <td><strong>${medicine.name}</strong></td>
                <td>${medicine.company}</td>
                <td>${medicine.batch}</td>
                <td>${medicine.stock}</td>
                <td>₹${medicine.price.toFixed(2)}</td>
                <td>${formatDate(medicine.expiryDate)}</td>
                <td>
                    <span class="status-badge ${expiryStatus.badge}">${expiryStatus.text}</span>
                </td>
                <td>
                    <button class="btn btn-secondary" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;" onclick="editMedicine(${medicine.id})">Edit</button>
                </td>
            </tr>
        `;
    }).join('');

    // Update stats
    if (totalMedicines) totalMedicines.textContent = medicinesDatabase.length;
    if (lowStock) lowStock.textContent = lowStockCount;
    if (outOfStock) outOfStock.textContent = outOfStockCount;
    if (expiringSoon) expiringSoon.textContent = expiringCount;
}

function editMedicine(medicineId) {
    const medicine = medicinesDatabase.find(m => m.id === medicineId);
    if (!medicine) return;

    // Populate form
    document.getElementById('medicineName').value = medicine.name;
    document.getElementById('company').value = medicine.company;
    document.getElementById('batch').value = medicine.batch;
    document.getElementById('stock').value = medicine.stock;
    document.getElementById('price').value = medicine.price;
    document.getElementById('expiryDate').value = medicine.expiryDate;

    medicineModal.classList.add('active');
}

medicineForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('medicineName').value;
    const company = document.getElementById('company').value;
    const batch = document.getElementById('batch').value;
    const stock = parseInt(document.getElementById('stock').value);
    const price = parseFloat(document.getElementById('price').value);
    const expiryDate = document.getElementById('expiryDate').value;

    // In a real app, this would update the database
    alert(`Medicine "${name}" has been saved!`);
    medicineModal.classList.remove('active');
    displayInventory();
});

// Expiry Date Tracking
function displayExpiryTracking() {
    const timeline = document.getElementById('expiryTimeline');
    const expiryRange = document.getElementById('expiryRange');

    if (!timeline) return;

    function updateTimeline() {
        const range = parseInt(expiryRange?.value || 30);
        const today = new Date();
        
        // Sort medicines by expiry date
        const sorted = [...medicinesDatabase]
            .filter(medicine => {
                const expiry = new Date(medicine.expiryDate);
                const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
                return range === 0 || daysLeft <= range;
            })
            .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

        timeline.innerHTML = sorted.map(medicine => {
            const expiry = new Date(medicine.expiryDate);
            const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
            let riskClass = 'normal';
            
            if (daysLeft < 0) riskClass = 'critical';
            else if (daysLeft <= 15) riskClass = 'critical';
            else if (daysLeft <= 30) riskClass = 'warning';

            return `
                <div class="expiry-card ${riskClass}">
                    <div class="expiry-header">
                        <div>
                            <h4>${medicine.name}</h4>
                            <p style="font-size: 0.9rem; color: var(--text-gray);">${medicine.company} | Batch: ${medicine.batch}</p>
                        </div>
                        <div>
                            <div class="expiry-date">${formatDate(medicine.expiryDate)}</div>
                            <div class="days-left">${daysLeft < 0 ? 'EXPIRED' : daysLeft + ' days left'}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (sorted.length === 0) {
            timeline.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-gray);">No medicines in this range</p>';
        }
    }

    expiryRange?.addEventListener('change', updateTimeline);
    updateTimeline();
}

// Orders Management
function displayOrdersManagement() {
    const table = document.getElementById('ordersTable');
    const orderStatus = document.getElementById('orderStatus');

    if (!table) return;

    function updateOrders() {
        const selectedStatus = orderStatus?.value || '';
        const filtered = selectedStatus 
            ? orderDatabase.filter(order => order.status === selectedStatus)
            : orderDatabase;

        table.innerHTML = filtered.map(order => {
            const itemsText = order.items.map(item => item.name).join(', ');
            const statusClass = `order-status ${order.status}`;
            
            return `
                <tr>
                    <td><strong>${order.id}</strong></td>
                    <td>Customer Name</td>
                    <td>${itemsText}</td>
                    <td>₹${order.totalAmount.toFixed(2)}</td>
                    <td><span class="${statusClass}">${order.status.toUpperCase()}</span></td>
                    <td>${formatDate(order.date)}</td>
                    <td>
                        <button class="btn btn-secondary" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;" onclick="alert('Update order status')">Update</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    orderStatus?.addEventListener('change', updateOrders);
    updateOrders();
}

// Analytics
function displayAnalytics() {
    const companySalesChart = document.getElementById('companySalesChart');
    const topSellersChart = document.getElementById('topSellersChart');

    if (!companySalesChart || !topSellersChart) return;

    // Sales by Company
    const companySales = {};
    medicinesDatabase.forEach(medicine => {
        companySales[medicine.company] = (companySales[medicine.company] || 0) + medicine.stock;
    });

    const companySalesHTML = Object.entries(companySales)
        .map(([company, sales]) => {
            const barWidth = (sales / Math.max(...Object.values(companySales))) * 100;
            return `
                <div style="margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <strong>${company}</strong>
                        <span style="color: var(--text-gray);">${sales} units</span>
                    </div>
                    <div style="background: var(--border-color); height: 24px; border-radius: 4px; overflow: hidden;">
                        <div style="background: var(--primary-color); height: 100%; width: ${barWidth}%; transition: width 0.3s;"></div>
                    </div>
                </div>
            `;
        })
        .join('');

    companySalesChart.innerHTML = companySalesHTML;

    // Top 5 Best Sellers
    const topSellers = [...medicinesDatabase]
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 5);

    const topSellersHTML = topSellers
        .map((medicine, index) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid var(--border-color);">
                <div>
                    <div style="font-weight: 600;">#${index + 1} ${medicine.name}</div>
                    <div style="font-size: 0.9rem; color: var(--text-gray);">${medicine.company}</div>
                </div>
                <div style="font-weight: 700; color: var(--primary-color); font-size: 1.2rem;">${medicine.stock}</div>
            </div>
        `)
        .join('');

    topSellersChart.innerHTML = topSellersHTML;
}

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

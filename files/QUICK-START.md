# 🚀 Pharma Pulse - Quick Start Guide

## 📂 Files Overview

| File | Purpose | Status |
|------|---------|--------|
| `index.html` | Shop page with medicine listing | ✅ Complete |
| `cart.html` | Shopping cart with checkout | ✅ Complete |
| `orders.html` | Order history & tracking | ✅ Complete |
| `admin.html` | Admin inventory dashboard | ✅ Complete |
| `profile.html` | User profile management | ✅ Complete |
| `styles.css` | All CSS styling | ✅ Complete |
| `app.js` | Main app logic | ✅ Complete |
| `admin.js` | Admin functionality | ✅ Complete |
| `profile.js` | Profile functionality | ✅ Complete |

## 🎯 Quick Navigation

### Customer Journey
```
index.html → Search/Filter → Add to Cart → cart.html → Checkout → orders.html
```

### Admin Workflow
```
admin.html → Dashboard → Inventory/Expiry/Orders → Track/Update
```

### Profile Management
```
profile.html → Edit Info → Addresses → Preferences → Security
```

## 💚 Features Checklist

### ✅ Shop Page (index.html)
- [x] 12 pre-loaded medicines
- [x] Search by name/company
- [x] Filter by category
- [x] Filter by company
- [x] Stock status badges
- [x] Expiry date display
- [x] Quantity selector
- [x] Add to cart button
- [x] Responsive grid layout
- [x] Cart badge counter

### ✅ Shopping Cart (cart.html)
- [x] Display all cart items
- [x] Item images with emojis
- [x] Quantity controls
- [x] Remove button
- [x] Subtotal calculation
- [x] Tax calculation (5%)
- [x] Final total
- [x] Checkout button
- [x] Continue shopping button
- [x] Empty cart message

### ✅ Order Tracking (orders.html)
- [x] Display all orders
- [x] Filter by status
- [x] Order ID display
- [x] Order date
- [x] Order items list
- [x] Total amount
- [x] Status badges
- [x] Timeline view
- [x] Delivery tracking steps
- [x] Empty state message

### ✅ Admin Dashboard (admin.html)
- [x] Sidebar navigation
- [x] Inventory section with table
- [x] Stock statistics
- [x] Medicine edit modal
- [x] Expiry tracking with color coding
- [x] Days until expiry display
- [x] Orders management table
- [x] Status filter
- [x] Analytics dashboard
- [x] Sales by company chart
- [x] Top 5 sellers list

### ✅ User Profile (profile.html)
- [x] Personal information display/edit
- [x] Address management
- [x] Delivery address list
- [x] Add new address button
- [x] Notification preferences
- [x] Password change modal
- [x] Security settings
- [x] Delete account option
- [x] Preference toggles
- [x] Save functionality

### ✅ Styling (styles.css)
- [x] CSS variables for theming
- [x] Responsive design (3 breakpoints)
- [x] Dark color scheme option ready
- [x] Animations and transitions
- [x] Mobile-first approach
- [x] Accessibility features
- [x] Consistent spacing system
- [x] Professional typography
- [x] Status badges with colors
- [x] Shadow system

## 📊 Sample Data Included

### Medicines (12 items)
- Paracetamol 500mg - In Stock (150 units)
- Ibuprofen 400mg - Out of Stock
- Amoxicillin 500mg - In Stock (75 units)
- Cough Syrup - In Stock (200 units)
- Vitamin C 1000mg - In Stock (300 units)
- Ranitidine 150mg - Low Stock (10 units)
- Cetirizine 10mg - In Stock (250 units)
- Omeprazole 20mg - In Stock (120 units)
- B-Complex Vitamins - In Stock (180 units)
- Azithromycin 500mg - In Stock (60 units)
- Metformin 500mg - In Stock (220 units)
- Aspirin 75mg - Low Stock (5 units)

### Companies
- Cipla
- Glaxo SmithKline
- Lupin
- Sun Pharma
- Divi's Labs

### Categories
- Pain Relief
- Antibiotics
- Cough & Cold
- Vitamins & Supplements
- Digestive Health

### Sample Orders (2 items)
- ORD001 - Delivered - 3 items - ₹240
- ORD002 - Shipped - 1 item - ₹120

## 🎨 Color Scheme

| Color | Hex Code | Usage |
|-------|----------|-------|
| Primary Red | #E63946 | Buttons, links, highlights |
| Dark Red | #C1121F | Hover states, darker elements |
| Success Green | #22C55E | In-stock, delivered status |
| Warning Yellow | #F59E0B | Low stock, expiring soon |
| Danger Red | #EF4444 | Out of stock, expired |
| Text Dark | #1A1A1A | Main text |
| Text Gray | #6C757D | Secondary text |
| Light Gray | #F8F9FA | Backgrounds |
| White | #FFFFFF | Cards, containers |

## 🔧 JavaScript Classes & Objects

### Cart Class
```javascript
const cart = new Cart();
cart.addItem(medicine, quantity);
cart.removeItem(medicineId);
cart.updateQuantity(medicineId, newQty);
cart.getTotal();
cart.getTax();
cart.getFinalTotal();
cart.clear();
```

### Data Objects
```javascript
medicine = {
    id, name, company, category, emoji, 
    price, stock, batch, expiryDate
}

order = {
    id, items[], totalAmount, status, 
    date, timeline[]
}
```

## 📱 Responsive Breakpoints

```css
/* Desktop (default) */
@media (min-width: 1200px) { }

/* Tablet */
@media (max-width: 768px) { }

/* Mobile */
@media (max-width: 480px) { }
```

## 🔄 Data Flow

### Shopping Flow
1. User views medicines on index.html
2. Selects quantity and clicks "Add to Cart"
3. Cart data saved to localStorage
4. Cart badge updates
5. User navigates to cart.html
6. Items displayed with calculations
7. Clicks "Checkout" to complete purchase
8. Redirected to orders.html

### Admin Flow
1. Admin opens admin.html
2. Sidebar shows available sections
3. Click section to view data
4. Add/edit medicines via modal
5. Data updates in real-time
6. Export ready for analytics

## 💾 LocalStorage Keys

```javascript
localStorage.getItem('cart')              // Cart items
localStorage.getItem('userProfile')       // User info
localStorage.getItem('userAddresses')     // Delivery addresses
localStorage.getItem('userPreferences')   // Notification settings
localStorage.getItem('userPassword')      // Password (for demo)
```

## 🎯 Key Functions to Know

### Shopping
```javascript
addToCart(medicineId)
increaseQty(medicineId, maxStock)
decreaseQty(medicineId)
cart.updateQuantity(medicineId, quantity)
```

### Display
```javascript
formatCurrency(amount)           // Returns "₹150.00"
formatDate(dateStr)              // Returns "15 Mar 2026"
getStockStatus(stock)            // Returns status object
getExpiryStatus(expiryDate)      // Returns expiry object
```

### Admin
```javascript
displayInventory()
displayExpiryTracking()
displayOrdersManagement()
displayAnalytics()
editMedicine(medicineId)
```

## 🚀 How to Customize

### Change Brand Color
Edit in `styles.css`:
```css
--primary-color: #E63946;      /* Change this to your color */
```

### Add New Medicine
Edit in `app.js`:
```javascript
medicinesDatabase.push({
    id: 13,
    name: "New Medicine",
    company: "Company Name",
    category: "category",
    emoji: "💊",
    price: 100,
    stock: 50,
    batch: "BATCH013",
    expiryDate: "2026-12-31",
    description: "Description here"
});
```

### Add New Category
1. Add option in `index.html` select
2. Add to filter logic in `app.js`

### Change Tax Rate
Edit in `app.js`:
```javascript
getTax() {
    return Math.round(this.getTotal() * 0.05 * 100) / 100; // Change 0.05 to your rate
}
```

## 📋 Testing Checklist

- [ ] View medicines on shop page
- [ ] Search for medicine by name
- [ ] Filter by category
- [ ] Filter by company
- [ ] Add medicine to cart
- [ ] View cart with items
- [ ] Increase/decrease quantity
- [ ] Remove item from cart
- [ ] Complete checkout
- [ ] View order history
- [ ] Filter orders by status
- [ ] Access admin dashboard
- [ ] View inventory table
- [ ] Check expiry tracking
- [ ] View orders in admin
- [ ] See analytics
- [ ] Update profile information
- [ ] Add delivery address
- [ ] Change notification preferences
- [ ] Test on mobile device

## 🎓 Learning Resources Included

The code includes:
- Comments explaining key sections
- Consistent naming conventions
- Modular function structure
- Clean HTML semantics
- Accessible ARIA labels
- Mobile-first CSS
- LocalStorage best practices
- Error handling patterns

## 🆘 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Cart not saving | Clear localStorage, try incognito mode |
| Styles not showing | Verify styles.css in same folder |
| JavaScript errors | Check browser console, ensure all .js files present |
| Mobile layout broken | Check viewport meta tag, clear cache |
| Can't add to cart | Check if stock > 0, verify medicine ID |

## 📈 Performance Tips

- All data is stored locally (no server delay)
- CSS uses variables for easy theming
- JavaScript is vanilla (no framework overhead)
- Images use emojis (no image loading)
- Minify CSS/JS for production
- Use gzip compression

## 🎉 You're All Set!

Everything is ready to use. Just open `index.html` in your browser and start shopping!

**Key URLs:**
- 🛍️ Shop: `index.html`
- 🛒 Cart: `cart.html`
- 📦 Orders: `orders.html`
- 👨‍💼 Admin: `admin.html`
- 👤 Profile: `profile.html`

---

**Built with ❤️ for healthcare**

# Pharma Pulse - Medicine E-Commerce Platform

A complete, modern healthcare medicine marketplace with customer shopping, cart management, order tracking, and advanced admin inventory dashboard.

## 🎯 Project Overview

Pharma Pulse is a full-featured medicine e-commerce platform built with **HTML5, CSS3, and Vanilla JavaScript**. It includes:

- **Customer Features**: Browse medicines, add to cart, checkout, order history tracking
- **Admin Dashboard**: Inventory management, expiry date tracking, stock status monitoring
- **User Profile**: Account management, delivery addresses, notification preferences
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

## 📁 Project Structure

```
pharma-pulse/
├── index.html           # Main shop/home page
├── cart.html            # Shopping cart page
├── orders.html          # Order history and tracking
├── admin.html           # Admin dashboard
├── profile.html         # User profile management
├── styles.css           # All styling with CSS variables
├── app.js               # Main functionality (shop, cart, orders)
├── admin.js             # Admin dashboard functionality
├── profile.js           # Profile page functionality
└── README.md            # This file
```

## 🚀 Features

### Customer Features

1. **Browse Medicines**
   - 12+ medicines with real data
   - Filter by category and company
   - Search functionality
   - Stock status indicators (In Stock, Low Stock, Out of Stock)
   - Expiry date display

2. **Shopping Cart**
   - Add/remove items
   - Adjust quantities
   - Real-time cart badge
   - Tax calculation (5%)
   - Checkout functionality

3. **Order History**
   - View past orders
   - Filter by status (Delivered, Processing, Shipped)
   - Track order timeline
   - View order details

4. **User Profile**
   - Edit personal information
   - Manage delivery addresses
   - Notification preferences
   - Password management
   - Account security

### Admin Features

1. **Inventory Management**
   - View all medicines with stock levels
   - Track expiry dates
   - Add/edit medicines
   - Real-time stock status
   - Stats dashboard (total, low stock, out of stock, expiring)

2. **Expiry Date Tracking**
   - Filter by expiry range (7, 30, 90 days)
   - Color-coded alerts (Critical, Warning, Valid)
   - Days until expiry display
   - Batch tracking

3. **Orders Management**
   - View all customer orders
   - Filter by status
   - Update order status
   - Track customer details

4. **Analytics**
   - Sales by company
   - Top 5 best-selling medicines
   - Visual charts and statistics

## 🎨 Design Features

- **Brand Colors**: Red (#E63946) and white with professional gradients
- **Typography**: Georgia serif for headers, system fonts for body
- **Animations**: Smooth page transitions, hover effects, loading states
- **Responsive**: Fully mobile-optimized with breakpoints at 768px and 480px
- **Accessibility**: Proper contrast, readable fonts, semantic HTML

## 📊 Sample Data

The platform comes with 12 pre-loaded medicines:

| Medicine | Company | Category | Price | Stock | Expiry |
|----------|---------|----------|-------|-------|--------|
| Paracetamol 500mg | Cipla | Pain Relief | ₹45 | 150 | 2026-12-15 |
| Ibuprofen 400mg | GSK | Pain Relief | ₹65 | 0 | 2025-08-20 |
| Amoxicillin 500mg | Lupin | Antibiotics | ₹120 | 75 | 2026-06-30 |
| Cough Syrup | Sun Pharma | Cough & Cold | ₹85 | 200 | 2025-11-10 |
| Vitamin C 1000mg | Divi's Labs | Vitamins | ₹150 | 300 | 2027-03-20 |
| And 7 more... | | | | | |

Sample orders are also included for testing the order history feature.

## 🔧 Installation & Setup

### Basic Setup
1. Download all files to a folder
2. Open `index.html` in a web browser
3. No server or installation required!

### File Requirements
Make sure all these files are in the same directory:
- All `.html` files
- `styles.css`
- `app.js`, `admin.js`, `profile.js`

## 💻 How to Use

### For Customers

1. **Shopping**
   - Go to `index.html`
   - Browse medicines or use search/filters
   - Click quantity buttons (−/+) to set amount
   - Click "Add to Cart"
   - Cart badge updates automatically

2. **Checkout**
   - Go to `cart.html`
   - Review items and prices
   - See tax calculation
   - Click "Proceed to Checkout"

3. **Track Orders**
   - Go to `orders.html`
   - View order history
   - Filter by status
   - See delivery timeline

4. **Manage Profile**
   - Go to `profile.html`
   - Update personal information
   - Manage delivery addresses
   - Set notification preferences

### For Admins

1. **Check Inventory**
   - Go to `admin.html`
   - Click "Inventory" in sidebar
   - See stock levels and expiry dates
   - Click "Edit" to update medicine details

2. **Track Expiry Dates**
   - Click "Expiry Tracking"
   - Select time range (7/30/90 days)
   - See color-coded alerts:
     - 🔴 Red: Expired or expiring within 15 days
     - 🟡 Yellow: Expiring within 30 days
     - 🟢 Green: Valid stock

3. **Manage Orders**
   - Click "Orders Management"
   - View all customer orders
   - Filter by status
   - Update order progress

4. **View Analytics**
   - Click "Analytics"
   - See sales by company
   - Find top-selling medicines

## 🎓 JavaScript Data Management

### Medicine Database
```javascript
medicinesDatabase = [
  {
    id: 1,
    name: "Medicine Name",
    company: "Company Name",
    category: "category",
    price: 100,
    stock: 50,
    batch: "BATCH001",
    expiryDate: "2026-12-15"
  },
  // ... more medicines
]
```

### Cart Management
```javascript
const cart = new Cart();
cart.addItem(medicine, quantity);
cart.removeItem(medicineId);
cart.getTotal();      // Returns subtotal
cart.getTax();        // Calculates 5% tax
cart.getFinalTotal(); // Returns total with tax
```

### Local Storage
Data is saved automatically to browser localStorage:
- `cart` - Shopping cart items
- `userProfile` - User account details
- `userAddresses` - Delivery addresses
- `userPreferences` - Notification settings

## 🎯 Key Functions

### app.js Functions
```javascript
addToCart(medicineId)           // Add medicine to cart
increaseQty(medicineId, maxStock) // Increase quantity
decreaseQty(medicineId)         // Decrease quantity
initMedicinesPage()             // Initialize shop page
initCartPage()                  // Initialize cart page
initOrdersPage()                // Initialize orders page
```

### admin.js Functions
```javascript
displayInventory()              // Show all medicines
displayExpiryTracking()         // Show expiry alerts
displayOrdersManagement()       // Show orders
displayAnalytics()              // Show stats
getExpiryStatus(date)          // Calculate expiry status
getStockStatus(stock)          // Calculate stock status
```

### profile.js Functions
```javascript
displayAddresses()              // Show user addresses
savePreferences()              // Save notification settings
editAddress(id)                // Modify address
deleteAddress(id)              // Remove address
```

## 🎨 CSS Variables (Customization)

Edit `styles.css` to change colors:

```css
:root {
    --primary-color: #E63946;   /* Main brand color */
    --success: #22C55E;         /* Success/in-stock color */
    --warning: #F59E0B;         /* Warning/low-stock color */
    --danger: #EF4444;          /* Danger/expired color */
    --text-dark: #1A1A1A;       /* Main text color */
    --bg-light: #F8F9FA;        /* Light background */
}
```

## 📱 Responsive Breakpoints

- **Desktop**: 1200px max container width
- **Tablet**: 768px breakpoint (2-column to 1-column layouts)
- **Mobile**: 480px breakpoint (further optimizations)

## 🔒 Security Notes

⚠️ **Important**: This is a frontend-only demo. In production:
- Implement backend API for data storage
- Use secure authentication
- Add password hashing
- Implement SSL/TLS encryption
- Validate all inputs server-side
- Never expose sensitive data in localStorage

## 🐛 Troubleshooting

### Cart not updating
- Check browser console for errors
- Clear localStorage: `localStorage.clear()`
- Refresh the page

### Styles not loading
- Ensure `styles.css` is in the same directory
- Check file name spelling (case-sensitive)
- Clear browser cache

### Data not saving
- Enable localStorage in browser settings
- Check browser console for errors
- Try a different browser

## 📈 Future Enhancement Ideas

1. Add product images/API integration
2. Implement user authentication
3. Add payment gateway integration
4. Email notifications for orders
5. SMS alerts for low stock
6. Customer reviews and ratings
7. Prescription upload feature
8. Pharmacy locator
9. Medicine alternatives suggestion
10. Sales reports and analytics

## 👥 User Types

### Regular Customer
- Full access to shop, cart, orders
- Profile management
- Order history tracking

### Admin User
- Full inventory management
- Expiry tracking
- Order management
- Analytics dashboard

## 📞 Support Features

The platform includes:
- Contact links in footer
- Terms of Service link
- Privacy Policy link
- Help desk buttons
- FAQ sections (ready to expand)

## 🚀 Deployment Options

### Option 1: Static Hosting (Recommended)
- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront

### Option 2: Traditional Hosting
- Apache/Nginx
- cPanel hosting
- Shared hosting

### Option 3: Local Testing
- Run in any modern browser
- Use live-server extension in VS Code
- No dependencies needed

## 📝 License

This project is open source and available for educational and commercial use.

## 🎉 Ready to Go!

Your Pharma Pulse platform is ready to use! 

Start with:
1. Open `index.html` in your browser
2. Browse the medicines
3. Add items to cart
4. Explore the `admin.html` dashboard
5. Check out the profile management in `profile.html`

**Happy coding! 💊💻**

---

**Version**: 1.0  
**Last Updated**: March 2026  
**Built with**: HTML5, CSS3, Vanilla JavaScript

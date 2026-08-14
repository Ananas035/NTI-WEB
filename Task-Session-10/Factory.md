# 🏭 FactoryHub - Factory Management System

## 📝 Project Description
A bilingual (Arabic and English) factory management web application designed to streamline internal operations. It solves the problem of disorganized manual tracking by providing a centralized digital platform for inventory tracking, customer account ledgers, payments, and check history. Target users include factory administrators, inventory managers, and accountants who need to manage day-to-day operations and financial records efficiently.

---

## 👥 User Roles & Permissions

| Role | Permissions | Available Actions |
| :--- | :--- | :--- |
| **Admin (Factory Manager)** | Full system access | Manage all user accounts, view comprehensive financial reports, oversee all inventory changes, and modify system settings. |
| **Accountant / Sales Rep** | Financial and customer data access | Manage customer account ledgers, record payments, update check history, and upload scanned financial documents. |
| **Inventory Manager** | Stock and product management access | Add new materials/products, update stock levels, and upload product images. |

---

## ✨ Main Features

### 🔐 Authentication Features
- [x] Secure Login / Logout
- [x] Password Reset

### 🛡️ Authorization Features
- [x] Admin Dashboard with master controls
- [x] Protected routes based on user role
- [x] Bilingual UI toggle (Arabic/English) preserving state across sessions

### 🔄 CRUD Operations

**1. Customer Ledgers**
* **Create:** Add new customer profiles and initial balances.
* **Read:** View customer transaction history and current debts.
* **Update:** Modify customer contact info or log new payments.
* **Delete:** Archive inactive customer accounts.

**2. Inventory Tracking**
* **Create:** Add new factory products or raw materials.
* **Read:** View current stock levels.
* **Update:** Adjust quantities after production or sales.
* **Delete:** Remove discontinued items.

**3. Check History**
* **Create:** Log incoming or outgoing checks.
* **Read:** View upcoming check due dates.
* **Update:** Change check status (e.g., Pending, Cleared, Bounced).

---

## 📁 Image/File Upload Features

**Product Images**
* **Allowed Types:** JPG, PNG, WEBP
* **Maximum Size:** 5 MB
* **Uploaded By:** Admin, Inventory Manager

**Scanned Checks / Invoices**
* **Allowed Types:** PDF, JPG, PNG
* **Maximum Size:** 10 MB
* **Uploaded By:** Admin, Accountant

---

## 🎨 UI Design Screens

**Main Pages Designed:**
1. **Login Page:** Secure entry point with language selection.
2. **Admin Dashboard:** Overview statistics (total stock, pending checks, recent payments).
3. **Inventory List Page:** Table view of all products with search, filter, and "Add Product" button.
4. **Customer Ledger Details:** Individual card views showing customer info, payment history, and current balance.
5. **Check History Page:** Timeline or table layout of financial checks with status indicators.
6. **Add/Edit Forms:** Modals or dedicated pages for data entry with file upload drag-and-drop zones.

### 🔗 UI Design Link
[FactoryHub - Factory Management Dashboard (Figma)](https://www.figma.com/make/txjjOzzxwuPextyIAKfxRV/Factory-Management-Dashboard?t=pnkJmgzm2eQetza5-1)
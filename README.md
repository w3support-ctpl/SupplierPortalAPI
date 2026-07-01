# Supplier ASN Portal

A lightweight web application bridging suppliers to **SAP S/4HANA Cloud** for logistics, procurement, and onboarding automation.

![Supplier Portal Preview](file:///c:/Users/CAZ-MUM-VISHALP/Downloads/advance%20shipping%20noti%20portal/app/images/portal_dashboard.png)

---

## Core Features

1. **Supplier Onboarding:** A 7-step wizard (User registration, Company profile, OTP email verification, Product catalog upload, Operating areas selection, Bank details, and Compliance document upload).
2. **Purchase Orders:** View and filter active POs retrieved directly from SAP S/4HANA.
3. **Advance Shipping Notifications (ASN):** Create and post Inbound Deliveries directly into SAP.
4. **Logistics & Invoices:** Track Goods Receipts (GR), shipping details, and invoice/payment processing statuses.
5. **RFQs & Bids:** View incoming Requests for Quotations (RFQs) and submit supplier bids.
6. **Analytics Reports:** Reports on PO history, delivery schedules, quality performance, and payments.

---

## Tech Stack

* **Backend:** Node.js, Express, Sequelize (MySQL ORM), Nodemailer (OTP emails)
* **Frontend:** EJS (templates), Bootstrap 5, jQuery, DataTables
* **Database:** Local MySQL (`master` database) for tracking onboarding state
* **Integration:** SAP S/4HANA Cloud (OData v4 APIs)

---

## Directory Structure

* `app.js` & `app/routes.js`: Main server configurations, SAP API proxy, and page routes.
* `dbConnection.js` & `getDataConnection.js`: Local MySQL database handlers.
* `app/server/views/`: UI templates grouped by feature (ASN, Orders, Invoices, etc.).
* `app/public/`: Client-side scripts (`js/`) and stylesheets (`styles/`).
* `uploads/` & `fileUploads/`: Local directories for catalog images and compliance certificates.

---

## Getting Started

### 1. Setup Environment (`.env`)
Create a `.env` file at the root:
```ini
PORT=5001
EMAIL_USER=spadmin@example.com
EMAIL_PASS=YourEmailPassword

DB_HOST=localhost
DB_PORT=3306
DB_NAME=master
DB_USER=root
DB_PASS=YourMySQLPassword
```

### 2. Install & Run
```bash
# Install dependencies
npm install

# Start the application
npm start
```
Go to `http://localhost:5001` in your browser.

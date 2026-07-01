# Supplier ASN Portal - User Manual

This manual details how to navigate the portal, complete your onboarding registration, and perform daily tasks (viewing purchase orders, generating advance shipping notifications, tracking invoices, and checking reports).

---

## 1. Access & Login

1. Open your browser and navigate to **http://localhost:5001**.
2. Click on the Login link to go to the login page:
   * **Direct URL:** `http://localhost:5001/loginPageRender`
3. Enter your login credentials:
   * **Username:** `CTPLABAP`
   * **Password:** `Testing`
4. Click **Login**.

![Login Screen](file:///c:/Users/CAZ-MUM-VISHALP/Downloads/advance%20shipping%20noti%20portal/app/images/login_page.png)

---

## 2. Supplier Onboarding Wizard

If you are a new supplier, complete the **7-Step Onboarding Wizard** to register your company and verify your profile.

![Onboarding Wizard](file:///c:/Users/CAZ-MUM-VISHALP/Downloads/advance%20shipping%20noti%20portal/app/images/onboarding_page.png)

### Steps to Onboard:
1. **Create User ID:** Set up your primary admin account credentials. Click **Save** then **Next**.
2. **Register Company:** Input your company profile and address details. Click **Save** then **Next**.
3. **Verify Email:** Send the OTP, enter the received code, and click **Verify** to validate your email. Click **Save** then **Next**.
4. **Register Products:** Manually register your catalog items (with ID, Category, pricing, and image) or download the Excel template to do a bulk upload.
5. **Areas of Operation:** Specify countries, states, delivery modes, capacity, and logistics partners. Click **Save** then **Next**.
6. **Payment Preferences:** Add your bank credentials (Bank name, Account Number, IFSC, and SWIFT codes). Click **Save** then **Next**.
7. **Compliance Documentation:** Upload required certificates (GSTIN, PAN, TAN, ISO/GMP certificates) along with expiry dates. Click **Save** then **Next**.
8. **Registration Status:** Review your checklist progress. When all items are complete, click **Submit for Review**.

---

## 3. Main Dashboard

Upon successful login, you are redirected to the homepage showing quick access links to all portal modules.

![Main Dashboard](file:///c:/Users/CAZ-MUM-VISHALP/Downloads/advance%20shipping%20noti%20portal/app/images/home_page.png)

---

## 4. Daily Operations

### 4.1 Managing Purchase Orders
Go to **My Orders** to search, filter, and drill down into the details of your active Purchase Orders from SAP.

![Purchase Orders](file:///c:/Users/CAZ-MUM-VISHALP/Downloads/advance%20shipping%20noti%20portal/app/images/my_orders.png)

### 4.2 Creating an Advance Shipping Notification (ASN)
When dispatching goods, create an ASN to notify the buyer and update SAP:
1. Navigate to **ASN**.
2. Input the target **PO Number** and load items.
3. Input the **Committed Quantity** and **Actual Delivery Date** for the shipped items.
4. Click **Post**. On success, the portal registers the shipment in SAP S/4HANA and returns an **Inbound Delivery Document Number**.

![ASN Creation](file:///c:/Users/CAZ-MUM-VISHALP/Downloads/advance%20shipping%20noti%20portal/app/images/asn_page.png)

### 4.3 Invoices & Payments
Go to **My Invoices** to view a summary of billing documents, track approval status, and audit outstanding balances.

![Invoices List](file:///c:/Users/CAZ-MUM-VISHALP/Downloads/advance%20shipping%20noti%20portal/app/images/my_invoice.png)

### 4.4 Analytical Reports
Access **My Reports** to view PO Status summaries, shipment histories, payment logs, and quality inspection lot updates.

![Reports Panel](file:///c:/Users/CAZ-MUM-VISHALP/Downloads/advance%20shipping%20noti%20portal/app/images/my_reports.png)

---

## 5. Product Catalogue Module

The **Product Catalogue Module** coordinates material availability and procurement terms between corporate procurement admins and suppliers.

### 5.1 Structure & Roles

1. **Organization Catalogue (Layer 1):** The procurement team administers the central registry of approved master materials (originating from SAP Material Master, manual creations, or bulk uploads).
2. **Supplier Catalogue (Layer 2):** Suppliers map their internal item codes, ex-works prices, MOQs, lead times, shapes, packaging, and datasheets to organization SKUs. They can also propose entirely new materials to be added.

### 5.2 Supplier Workflow (Layer 2)

#### 5.2.1 Product Mapping
1. Go to **Product Catalogue** ➔ **Available Products**.
2. Search or filter the organizational master SKU list.
3. Click **Map Product** for the target item to open the mapping drawer.
4. Input details: Supplier Part Code, Unit Price, Currency, MOQ, Delivery Lead Time, Shape, Packaging details, and upload the technical PDF datasheet. Click **Submit Proposal**.

#### 5.2.2 Propose New Products
1. Go to **Product Catalogue** ➔ **Propose New Product**.
2. For items not found in the organization's catalogue, enter:
   - Product Name, Category, Description, Specifications, and targeted Unit Price.
   - Upload product photos and technical datasheets.
3. Click **Submit Proposal** to trigger internal review.

#### 5.2.3 Status Tracking
- Navigate to **Product Catalogue** ➔ **My Mappings & Status** to view all registered products.
- Monitor both **Product Approval Status** (Vetting) and **Price Approval Status** (Commercial terms) separately.

### 5.3 Administration Workflow (Layer 1)

Corporate administrators access pages to audit, review, and manage catalog data:

#### 5.3.1 Product Master (SKU Management)
- Navigate to **Administration** ➔ **Product Master** to view and edit central catalog items.
- Perform manual additions (**Add Master SKU**), modify active items, and click **Export Excel** to save the directory.

#### 5.3.2 Catalogue Approvals
- Navigate to **Administration** ➔ **Catalogue Approvals** to manage incoming supplier requests across three tabs:
  1. **Product Mappings:** Vets supplier capability and technical suitability.
  2. **Price Approvals:** Reviews commercial competitiveness, MOQs, and lead times.
  3. **Supplier Proposals:** Reviews custom material proposals. Approving a proposal automatically inserts the new SKU into the organizational `ProductMaster` and creates the corresponding supplier mapping.

#### 5.3.3 Contract Management
- Go to **Administration** ➔ **Contract Management** to bind pricing terms to formal agreements.
- Select a supplier and material mapping. Specify validity dates, agreed pricing, contract number, and target quantities or values.
- Creating a contract establishes vendor info records (PIR) and source list settings in SAP.

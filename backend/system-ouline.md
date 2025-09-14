
# **Employee Management System (HRIS) – Updated System Outline**

## **1. System Overview**

This is a private intranet application designed for internal use within a company or organization.
It centralizes employee records, leave management, payroll, benefits tracking, and audit logs.
Built with **Node.js + Express** and **MySQL 8** for secure, efficient backend operations.

---

## **2. User Roles**

### **Admin**

* Manage all employees (CRUD)
* Manage employee user accounts
* Approve/Reject documents submitted by employees
* Approve/Reject leave requests
* Process terminal leave benefits (TLB)
* Manage payroll, compensation, and benefits
* Manage training records and service history
* View audit logs of employee activities

### **Employee**

* Log in with account created by admin
* View personal information and employment records
* Edit basic personal data (address, contact number, email)
* Edit user account (username & password)
* Submit additional documents for approval
* Apply for leave (VL, SL, FL, SPL, Maternity, Paternity)
* View leave balances and leave history

---

## **3. Modules & Features**

### **3.1 Employee Records / Profiles**

* **Database Stores:**

  * Personal Information (Firstname, Middlename, Lastname, Sex, Birthday, Birthplace, Contact Info, Address, Email)
  * Employment Details (Appointment Date, Plantilla Position, Plantilla Number, Salary Grade, Current Salary)
  * Government IDs (TIN, GSIS, Pag-IBIG, PhilHealth)
  * Education and Eligibility
* **Document Management:**

  * Admin uploads key documents (Appointment Papers, PSA Birth Certificate, TOR/CAV, SALN, PDS, ITR, Reprimand Letters, Service Records, ID copies)
  * Employees can submit additional documents → require admin approval before being marked as official

---

### **3.2 Terminal Leave Benefits (TLB)**

* **System Automatically Tracks:**

  * Total leave credits earned
  * Highest salary during employment
  * Employment history (hiring date, promotions, step increments, resignation/retirement date)
* **Automated TLB Computation:**

  ```
  TLB = Total Leave Credits × Highest Monthly Salary × Constant Factor
  ```
* Admin can generate TLB reports and process employee terminal leave claims.

---

### **3.3 Leave Management**

* **Leave Accrual:**

  * 1.25 VL + 1.25 SL credited monthly → 15 days total per year
* **Leave Application:**

  * Employees submit leave requests
  * Admin can approve or reject
  * Approved leave auto-deducted from balance
* **Leave Monetization:**

  * Yearly monetization request option
  * Up to 29 days → no clearance needed
  * 30+ days → clearance required before processing

---

### **3.4 Compensation & Benefits**

* Records for:

  * Performance-Based Bonus (PBB)
  * Mid-Year Bonus (13th Month Pay)
  * Year-End Bonus (14th Month Pay)
  * GSIS Contributions & Employee Compensation
  * Allowances (RATA, Clothing, Medical, Hazard, Subsistence & Laundry)
  * Loyalty Awards (₱10,000 for first 10 years, ₱5,000 for every 5 years after)

---

### **3.5 Payroll Management**

* Generate salary payroll for employees
* Compute deductions (GSIS, Pag-IBIG, PhilHealth, Tax)
* Store payroll history
* Generate payroll reports

---

### **3.6 Learning & Development**

* Track employee training records:

  * Training title
  * Date attended
  * Number of trainings attended
* Generate training reports for compliance and HRD monitoring

---

### **3.7 Service Records**

* Store and update:

  * Inclusive employment dates
  * Positions and salary history
  * LWOP periods
  * Reason for separation (resignation, retirement, termination)
  * Date of separation
  * Remarks / additional notes

---

### **3.8 Audit Logs**

* Track all critical actions:

  * Employee profile updates
  * Document submissions & approvals
  * Leave applications & decisions
  * Payroll changes
* Logs are visible only to admins for accountability

---

## **4. Technical Requirements**

* **Backend:** Node.js + Express
* **Database:** MySQL 8 (normalized schema with foreign keys)
* **Authentication:** Secure session-based login (bcrypt password hashing)
* **File Storage:** Local server file system (with folder per employee), database stores file paths
* **Security:** Role-based access control (RBAC) for admin/employee
* **Deployment:** Runs on company intranet (accessible only within local network)


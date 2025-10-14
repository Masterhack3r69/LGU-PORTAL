# Employee Management System - System Flowchart

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER ACCESS LAYER                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐              ┌──────────────────┐           │
│  │  Admin Users     │              │ Employee Users   │           │
│  │  (Full Access)   │              │ (Limited Access) │           │
│  └────────┬─────────┘              └────────┬─────────┘           │
│           │                                  │                      │
│           └──────────────┬───────────────────┘                      │
│                          │                                          │
│                          ▼                                          │
│              ┌───────────────────────┐                             │
│              │  Authentication Layer │                             │
│              │  - Login/Logout       │                             │
│              │  - Session Management │                             │
│              │  - Role Detection     │                             │
│              └───────────┬───────────┘                             │
└──────────────────────────┼──────────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────────┐
│                          ▼                                          │
│              ┌───────────────────────┐                             │
│              │  Authorization Layer  │                             │
│              │  - Role-Based Access  │                             │
│              │  - Permission Check   │                             │
│              │  - Route Protection   │                             │
│              └───────────┬───────────┘                             │
│                          │                                          │
│                          ▼                                          │
│         ┌────────────────────────────────────┐                     │
│         │     APPLICATION ROUTING LAYER      │                     │
│         ├────────────────┬───────────────────┤                     │
│         │  Admin Routes  │  Employee Routes  │                     │
│         └────────┬───────┴────────┬──────────┘                     │
│                  │                │                                 │
└──────────────────┼────────────────┼─────────────────────────────────┘
                   │                │
┌──────────────────┼────────────────┼─────────────────────────────────┐
│                  ▼                ▼                                 │
│    ┌─────────────────────────────────────────────────┐            │
│    │         BACKEND API LAYER (Node.js/Express)     │            │
│    ├─────────────────────────────────────────────────┤            │
│    │                                                  │            │
│    │  ┌──────────────┐  ┌──────────────┐           │            │
│    │  │ Controllers  │  │  Middleware  │           │            │
│    │  │ - Employee   │  │  - Auth      │           │            │
│    │  │ - Leave      │  │  - Validation│           │            │
│    │  │ - Payroll    │  │  - Audit     │           │            │
│    │  │ - Benefits   │  │  - Error     │           │            │
│    │  │ - Training   │  │  - Logging   │           │            │
│    │  └──────┬───────┘  └──────────────┘           │            │
│    │         │                                       │            │
│    │         ▼                                       │            │
│    │  ┌──────────────┐                              │            │
│    │  │   Models     │                              │            │
│    │  │ - Employee   │                              │            │
│    │  │ - Leave      │                              │            │
│    │  │ - Payroll    │                              │            │
│    │  │ - Benefits   │                              │            │
│    │  │ - Training   │                              │            │
│    │  └──────┬───────┘                              │            │
│    │         │                                       │            │
│    └─────────┼───────────────────────────────────────┘            │
│              │                                                     │
│              ▼                                                     │
│    ┌─────────────────────────────────────────────────┐            │
│    │         DATABASE LAYER (MySQL 8.0)              │            │
│    ├─────────────────────────────────────────────────┤            │
│    │  - users                  - payroll_periods     │            │
│    │  - employees              - payroll_items       │            │
│    │  - leave_applications     - comp_benefit_records│            │
│    │  - leave_balances         - training_programs   │            │
│    │  - employee_documents     - training_records    │            │
│    │  - audit_logs             - system_logs         │            │
│    └─────────────────────────────────────────────────┘            │
└───────────────────────────────────────────────────────────────────┘
```

## 2. Authentication & Authorization Flow

```
START
  │
  ▼
┌─────────────────┐
│  User Access    │
│  Login Page     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Enter Credentials       │
│ - Username              │
│ - Password              │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ POST /api/auth/login    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Validate Credentials    │
│ - Check username exists │
│ - Verify password hash  │
└────────┬────────────────┘
         │
    ┌────┴────┐
    │ Valid?  │
    └────┬────┘
         │
    ┌────┴────┐
    │   NO    │───────────┐
    └─────────┘           │
         │                │
    ┌────┴────┐           │
    │   YES   │           │
    └────┬────┘           │
         │                │
         ▼                ▼
┌─────────────────┐  ┌──────────────┐
│ Create Session  │  │ Return Error │
│ - Generate ID   │  │ 401 Invalid  │
│ - Store user    │  │ Credentials  │
│ - Set role      │  └──────┬───────┘
└────────┬────────┘         │
         │                  │
         ▼                  │
┌─────────────────┐         │
│ Detect Role     │         │
│ - Admin         │         │
│ - Employee      │         │
└────────┬────────┘         │
         │                  │
    ┌────┴────┐             │
    │  Admin? │             │
    └────┬────┘             │
         │                  │
    ┌────┴────┐             │
    │   YES   │             │
    └────┬────┘             │
         │                  │
         ▼                  │
┌─────────────────┐         │
│ Redirect to     │         │
│ Admin Dashboard │         │
│ - Full Access   │         │
│ - All Modules   │         │
└─────────────────┘         │
         │                  │
    ┌────┴────┐             │
    │   NO    │             │
    └────┬────┘             │
         │                  │
         ▼                  │
┌─────────────────┐         │
│ Redirect to     │         │
│ Employee Portal │         │
│ - Limited Access│         │
│ - Self-Service  │         │
└─────────────────┘         │
         │                  │
         └──────────┬───────┘
                    │
                    ▼
              ┌──────────┐
              │   END    │
              └──────────┘
```

## 3. Employee Management Workflow (Admin)

```
START (Admin Dashboard)
  │
  ▼
┌──────────────────────┐
│ Employee Management  │
│ Module Selection     │
└──────────┬───────────┘
           │
      ┌────┴────┐
      │ Action? │
      └────┬────┘
           │
    ┌──────┴──────┬──────────┬──────────┐
    │             │          │          │
    ▼             ▼          ▼          ▼
┌────────┐  ┌─────────┐ ┌────────┐ ┌────────┐
│ Create │  │  View   │ │ Update │ │ Delete │
│Employee│  │  List   │ │Employee│ │Employee│
└───┬────┘  └────┬────┘ └───┬────┘ └───┬────┘
    │            │           │          │
    ▼            ▼           ▼          ▼
┌────────────────────────────────────────────┐
│         CREATE EMPLOYEE FLOW               │
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────┐                 │
│  │ Fill Employee Form   │                 │
│  │ - Personal Info      │                 │
│  │ - Employment Details │                 │
│  │ - Compensation       │                 │
│  └──────────┬───────────┘                 │
│             │                              │
│             ▼                              │
│  ┌──────────────────────┐                 │
│  │ Validate Form Data   │                 │
│  │ - Required fields    │                 │
│  │ - Email format       │                 │
│  │ - Unique emp number  │                 │
│  └──────────┬───────────┘                 │
│             │                              │
│        ┌────┴────┐                        │
│        │ Valid?  │                        │
│        └────┬────┘                        │
│             │                              │
│        ┌────┴────┐                        │
│        │   NO    │──────┐                 │
│        └─────────┘      │                 │
│             │           │                 │
│        ┌────┴────┐      │                 │
│        │   YES   │      │                 │
│        └────┬────┘      │                 │
│             │           │                 │
│             ▼           ▼                 │
│  ┌──────────────┐  ┌────────────┐        │
│  │ POST /api/   │  │ Show Error │        │
│  │ employees    │  │ Messages   │        │
│  └──────┬───────┘  └────────────┘        │
│         │                                 │
│         ▼                                 │
│  ┌──────────────────────┐                │
│  │ Create in Database   │                │
│  │ - Insert employee    │                │
│  │ - Initialize balances│                │
│  │ - Create user account│                │
│  └──────────┬───────────┘                │
│             │                             │
│             ▼                             │
│  ┌──────────────────────┐                │
│  │ Upload Documents     │                │
│  │ - Profile photo      │                │
│  │ - Required docs      │                │
│  └──────────┬───────────┘                │
│             │                             │
│             ▼                             │
│  ┌──────────────────────┐                │
│  │ Log Audit Trail      │                │
│  │ - Action: CREATE     │                │
│  │ - User: Admin        │                │
│  │ - Timestamp          │                │
│  └──────────┬───────────┘                │
│             │                             │
│             ▼                             │
│  ┌──────────────────────┐                │
│  │ Success Response     │                │
│  │ - Employee created   │                │
│  │ - Redirect to list   │                │
│  └──────────────────────┘                │
│                                           │
└───────────────────────────────────────────┘
           │
           ▼
      ┌─────────┐
      │   END   │
      └─────────┘
```

## 4. Leave Management Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    LEAVE MANAGEMENT SYSTEM                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐              ┌──────────────────┐       │
│  │ EMPLOYEE SIDE    │              │   ADMIN SIDE     │       │
│  └────────┬─────────┘              └────────┬─────────┘       │
│           │                                  │                  │
│           ▼                                  │                  │
│  ┌──────────────────┐                       │                  │
│  │ Check Leave      │                       │                  │
│  │ Balance          │                       │                  │
│  │ GET /api/leave/  │                       │                  │
│  │ my-balance       │                       │                  │
│  └────────┬─────────┘                       │                  │
│           │                                  │                  │
│           ▼                                  │                  │
│  ┌──────────────────┐                       │                  │
│  │ Fill Leave       │                       │                  │
│  │ Application Form │                       │                  │
│  │ - Leave type     │                       │                  │
│  │ - Start date     │                       │                  │
│  │ - End date       │                       │                  │
│  │ - Reason         │                       │                  │
│  └────────┬─────────┘                       │                  │
│           │                                  │                  │
│           ▼                                  │                  │
│  ┌──────────────────┐                       │                  │
│  │ Validate Request │                       │                  │
│  │ - Date range     │                       │                  │
│  │ - Balance check  │                       │                  │
│  │ - Overlaps       │                       │                  │
│  └────────┬─────────┘                       │                  │
│           │                                  │                  │
│      ┌────┴────┐                            │                  │
│      │ Valid?  │                            │                  │
│      └────┬────┘                            │                  │
│           │                                  │                  │
│      ┌────┴────┐                            │                  │
│      │   YES   │                            │                  │
│      └────┬────┘                            │                  │
│           │                                  │                  │
│           ▼                                  │                  │
│  ┌──────────────────┐                       │                  │
│  │ POST /api/leave/ │                       │                  │
│  │ applications     │                       │                  │
│  └────────┬─────────┘                       │                  │
│           │                                  │                  │
│           ▼                                  │                  │
│  ┌──────────────────┐                       │                  │
│  │ Create Record    │                       │                  │
│  │ Status: Pending  │                       │                  │
│  └────────┬─────────┘                       │                  │
│           │                                  │                  │
│           ▼                                  ▼                  │
│  ┌──────────────────┐          ┌──────────────────┐           │
│  │ Notification     │          │ View Pending     │           │
│  │ - Application    │          │ Applications     │           │
│  │   submitted      │          │ GET /api/leave/  │           │
│  └──────────────────┘          │ applications     │           │
│           │                    └────────┬─────────┘           │
│           │                             │                      │
│           │                             ▼                      │
│           │                    ┌──────────────────┐           │
│           │                    │ Review Details   │           │
│           │                    │ - Employee info  │           │
│           │                    │ - Leave balance  │           │
│           │                    │ - Date range     │           │
│           │                    │ - Reason         │           │
│           │                    └────────┬─────────┘           │
│           │                             │                      │
│           │                        ┌────┴────┐                │
│           │                        │Decision?│                │
│           │                        └────┬────┘                │
│           │                             │                      │
│           │                    ┌────────┴────────┐            │
│           │                    │                 │            │
│           │                    ▼                 ▼            │
│           │          ┌──────────────┐  ┌──────────────┐      │
│           │          │   APPROVE    │  │   REJECT     │      │
│           │          └──────┬───────┘  └──────┬───────┘      │
│           │                 │                 │               │
│           │                 ▼                 ▼               │
│           │          ┌──────────────┐  ┌──────────────┐      │
│           │          │ PUT /api/    │  │ PUT /api/    │      │
│           │          │ leave/:id/   │  │ leave/:id/   │      │
│           │          │ approve      │  │ reject       │      │
│           │          └──────┬───────┘  └──────┬───────┘      │
│           │                 │                 │               │
│           │                 ▼                 ▼               │
│           │          ┌──────────────┐  ┌──────────────┐      │
│           │          │ Update Status│  │ Update Status│      │
│           │          │ Deduct Balance│ │ Add Reason   │      │
│           │          └──────┬───────┘  └──────┬───────┘      │
│           │                 │                 │               │
│           │                 └────────┬────────┘               │
│           │                          │                        │
│           ▼                          ▼                        │
│  ┌──────────────────┐      ┌──────────────────┐             │
│  │ Notification     │      │ Log Audit Trail  │             │
│  │ - Approved/      │      │ - Action         │             │
│  │   Rejected       │      │ - Admin user     │             │
│  │ - Updated balance│      │ - Timestamp      │             │
│  └──────────────────┘      └──────────────────┘             │
│           │                          │                        │
│           └──────────┬───────────────┘                        │
│                      │                                        │
└──────────────────────┼────────────────────────────────────────┘
                       │
                       ▼
                  ┌─────────┐
                  │   END   │
                  └─────────┘
```

## 5. Payroll Processing Workflow (Admin Only)

```
START (Admin - Payroll Module)
  │
  ▼
┌──────────────────────────┐
│ Create Payroll Period    │
│ - Name                   │
│ - Start/End dates        │
│ - Pay date               │
│ POST /api/payroll/periods│
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Select Employees         │
│ - Filter by department   │
│ - Filter by status       │
│ - Select individuals     │
│ GET /api/payroll/employees│
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Configure Processing     │
│ - Working days           │
│ - Allowances             │
│ - Deductions             │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ POST /api/payroll/process│
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│      PAYROLL CALCULATION ENGINE          │
├──────────────────────────────────────────┤
│                                          │
│  FOR EACH SELECTED EMPLOYEE:            │
│                                          │
│  ┌────────────────────────┐             │
│  │ Get Employee Data      │             │
│  │ - Basic salary         │             │
│  │ - Daily/hourly rate    │             │
│  │ - Employment type      │             │
│  └──────────┬─────────────┘             │
│             │                            │
│             ▼                            │
│  ┌────────────────────────┐             │
│  │ Calculate Basic Pay    │             │
│  │ = daily_rate × days    │             │
│  │   OR hourly_rate × hrs │             │
│  └──────────┬─────────────┘             │
│             │                            │
│             ▼                            │
│  ┌────────────────────────┐             │
│  │ Get Allowances         │             │
│  │ - Standard types       │             │
│  │ - Employee overrides   │             │
│  │ - Calculate amounts    │             │
│  └──────────┬─────────────┘             │
│             │                            │
│             ▼                            │
│  ┌────────────────────────┐             │
│  │ Calculate Gross Pay    │             │
│  │ = basic_pay +          │             │
│  │   overtime +           │             │
│  │   allowances           │             │
│  └──────────┬─────────────┘             │
│             │                            │
│             ▼                            │
│  ┌────────────────────────┐             │
│  │ Get Deductions         │             │
│  │ - SSS, PhilHealth      │             │
│  │ - Pag-IBIG, Tax        │             │
│  │ - Employee overrides   │             │
│  └──────────┬─────────────┘             │
│             │                            │
│             ▼                            │
│  ┌────────────────────────┐             │
│  │ Calculate Net Pay      │             │
│  │ = gross_pay -          │             │
│  │   total_deductions     │             │
│  └──────────┬─────────────┘             │
│             │                            │
│             ▼                            │
│  ┌────────────────────────┐             │
│  │ Create Payroll Item    │             │
│  │ - Store all details    │             │
│  │ - Status: Calculated   │             │
│  └──────────┬─────────────┘             │
│             │                            │
└─────────────┼────────────────────────────┘
              │
              ▼
┌──────────────────────────┐
│ Review Payroll Items     │
│ GET /api/payroll/items/  │
│ :periodId                │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Manual Adjustments?      │
└──────────┬───────────────┘
           │
      ┌────┴────┐
      │   YES   │
      └────┬────┘
           │
           ▼
┌──────────────────────────┐
│ Update Payroll Items     │
│ PUT /api/payroll/items/:id│
│ - Adjust amounts         │
│ - Add notes              │
└──────────┬───────────────┘
           │
      ┌────┴────┐
      │   NO    │
      └────┬────┘
           │
           ▼
┌──────────────────────────┐
│ Finalize Payroll Period  │
│ POST /api/payroll/       │
│ finalize/:periodId       │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Update Period Status     │
│ - Status: Finalized      │
│ - Lock all items         │
│ - Generate payslips      │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Log Audit Trail          │
│ - Action: FINALIZE       │
│ - Period details         │
│ - Total amounts          │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Employees Can View       │
│ GET /api/payroll/        │
│ my-payslips              │
└──────────────────────────┘
           │
           ▼
      ┌─────────┐
      │   END   │
      └─────────┘
```

## 6. Benefits Processing Workflow

```
START (Admin - Benefits Module)
  │
  ▼
┌──────────────────────────┐
│ Select Benefit Type      │
│ - Terminal Leave         │
│ - Leave Monetization     │
│ - PBB (Performance)      │
│ - 13th/14th Month        │
│ - GSIS                   │
│ - Loyalty Award          │
└──────────┬───────────────┘
           │
      ┌────┴────┐
      │ Process │
      │  Type?  │
      └────┬────┘
           │
    ┌──────┴──────┬──────────┐
    │             │          │
    ▼             ▼          ▼
┌────────┐  ┌─────────┐ ┌────────┐
│ Single │  │  Bulk   │ │Monetize│
└───┬────┘  └────┬────┘ └───┬────┘
    │            │           │
    ▼            ▼           ▼
┌─────────────────────────────────────────┐
│      SINGLE PROCESSING FLOW             │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────┐              │
│  │ Select Employee      │              │
│  └──────────┬───────────┘              │
│             │                           │
│             ▼                           │
│  ┌──────────────────────┐              │
│  │ Check Eligibility    │              │
│  │ GET /api/compensation│              │
│  │ /eligibility/:empId  │              │
│  └──────────┬───────────┘              │
│             │                           │
│        ┌────┴────┐                     │
│        │Eligible?│                     │
│        └────┬────┘                     │
│             │                           │
│        ┌────┴────┐                     │
│        │   NO    │──────┐              │
│        └─────────┘      │              │
│             │           │              │
│        ┌────┴────┐      │              │
│        │   YES   │      │              │
│        └────┬────┘      │              │
│             │           │              │
│             ▼           ▼              │
│  ┌──────────────┐  ┌────────────┐     │
│  │ Enter Details│  │ Show Error │     │
│  │ - Base amount│  │ Not eligible│    │
│  │ - Period     │  └────────────┘     │
│  │ - Notes      │                     │
│  └──────┬───────┘                     │
│         │                              │
│         ▼                              │
│  ┌──────────────────────┐             │
│  │ Calculate Amount     │             │
│  │ - Apply formulas     │             │
│  │ - Tax calculations   │             │
│  │ - Deductions         │             │
│  └──────────┬───────────┘             │
│             │                          │
│             ▼                          │
│  ┌──────────────────────┐             │
│  │ POST /api/           │             │
│  │ compensation/process │             │
│  └──────────┬───────────┘             │
│             │                          │
│             ▼                          │
│  ┌──────────────────────┐             │
│  │ Create Record        │             │
│  │ - Status: Pending    │             │
│  │ - Store calculation  │             │
│  └──────────┬───────────┘             │
│             │                          │
└─────────────┼──────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│      BULK PROCESSING FLOW               │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────┐              │
│  │ Select Multiple      │              │
│  │ Employees            │              │
│  │ - Filter by dept     │              │
│  │ - Filter by status   │              │
│  └──────────┬───────────┘              │
│             │                           │
│             ▼                           │
│  ┌──────────────────────┐              │
│  │ Set Common Parameters│              │
│  │ - Benefit type       │              │
│  │ - Processing date    │              │
│  │ - Period covered     │              │
│  └──────────┬───────────┘              │
│             │                           │
│             ▼                           │
│  ┌──────────────────────┐              │
│  │ FOR EACH EMPLOYEE:   │              │
│  │ - Check eligibility  │              │
│  │ - Calculate amount   │              │
│  │ - Create record      │              │
│  └──────────┬───────────┘              │
│             │                           │
│             ▼                           │
│  ┌──────────────────────┐              │
│  │ POST /api/           │              │
│  │ compensation/process │              │
│  │ (bulk mode)          │              │
│  └──────────┬───────────┘              │
│             │                           │
└─────────────┼──────────────────────────┘
              │
              ▼
┌──────────────────────────┐
│ Review Records           │
│ GET /api/compensation/   │
│ records                  │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Approve Records          │
│ PUT /api/compensation/   │
│ records/:id              │
│ - Status: Approved       │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Process Payment          │
│ - Update payment date    │
│ - Add reference number   │
│ - Status: Paid           │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Log Audit Trail          │
└──────────┬───────────────┘
           │
           ▼
      ┌─────────┐
      │   END   │
      └─────────┘
```

## 7. Training Management Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                  TRAINING MANAGEMENT SYSTEM                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐              ┌──────────────────┐       │
│  │   ADMIN SIDE     │              │  EMPLOYEE SIDE   │       │
│  └────────┬─────────┘              └────────┬─────────┘       │
│           │                                  │                  │
│           ▼                                  │                  │
│  ┌──────────────────┐                       │                  │
│  │ Create Training  │                       │                  │
│  │ Program          │                       │                  │
│  │ - Title          │                       │                  │
│  │ - Description    │                       │                  │
│  │ - Duration       │                       │                  │
│  │ - Start/End date │                       │                  │
│  │ - Max participants│                      │                  │
│  │ POST /api/       │                       │                  │
│  │ training/programs│                       │                  │
│  └────────┬─────────┘                       │                  │
│           │                                  │                  │
│           ▼                                  ▼                  │
│  ┌──────────────────┐          ┌──────────────────┐           │
│  │ Program Active   │          │ View Available   │           │
│  │ Status: Active   │          │ Programs         │           │
│  └────────┬─────────┘          │ GET /api/training│           │
│           │                    │ /my-programs     │           │
│           │                    └────────┬─────────┘           │
│           │                             │                      │
│           │                             ▼                      │
│           │                    ┌──────────────────┐           │
│           │                    │ Select Program   │           │
│           │                    │ - View details   │           │
│           │                    │ - Check schedule │           │
│           │                    └────────┬─────────┘           │
│           │                             │                      │
│           │                             ▼                      │
│           │                    ┌──────────────────┐           │
│           │                    │ Request Enrollment│          │
│           │                    │ POST /api/training│          │
│           │                    │ /request-enrollment│         │
│           │                    └────────┬─────────┘           │
│           │                             │                      │
│           ▼                             ▼                      │
│  ┌──────────────────┐          ┌──────────────────┐           │
│  │ View Enrollment  │          │ Enrollment Status│           │
│  │ Requests         │          │ - Pending        │           │
│  │ GET /api/training│          └──────────────────┘           │
│  │ /enrollments     │                   │                      │
│  └────────┬─────────┘                   │                      │
│           │                             │                      │
│           ▼                             │                      │
│  ┌──────────────────┐                   │                      │
│  │ Approve/Enroll   │                   │                      │
│  │ Employee         │                   │                      │
│  │ POST /api/       │                   │                      │
│  │ training/enroll  │                   │                      │
│  └────────┬─────────┘                   │                      │
│           │                             │                      │
│           ▼                             ▼                      │
│  ┌──────────────────┐          ┌──────────────────┐           │
│  │ Create Training  │          │ Notification     │           │
│  │ Record           │          │ - Enrolled       │           │
│  │ - Status: Enrolled│         │ - Training details│          │
│  └────────┬─────────┘          └──────────────────┘           │
│           │                             │                      │
│           │                             │                      │
│           │    [Training Period]        │                      │
│           │                             │                      │
│           │                             ▼                      │
│           │                    ┌──────────────────┐           │
│           │                    │ Attend Training  │           │
│           │                    │ - In Progress    │           │
│           │                    └──────────────────┘           │
│           │                             │                      │
│           ▼                             │                      │
│  ┌──────────────────┐                   │                      │
│  │ Mark Completion  │                   │                      │
│  │ PUT /api/training│                   │                      │
│  │ /records/:id     │                   │                      │
│  │ - Status: Complete│                  │                      │
│  │ - Score (if any) │                   │                      │
│  │ - Issue certificate│                 │                      │
│  └────────┬─────────┘                   │                      │
│           │                             │                      │
│           ▼                             ▼                      │
│  ┌──────────────────┐          ┌──────────────────┐           │
│  │ Generate         │          │ View Training    │           │
│  │ Certificate      │          │ History          │           │
│  │ - Store path     │          │ GET /api/training│           │
│  │ - Update record  │          │ /my-records      │           │
│  └────────┬─────────┘          └──────────────────┘           │
│           │                             │                      │
│           └──────────┬──────────────────┘                      │
│                      │                                         │
└──────────────────────┼─────────────────────────────────────────┘
                       │
                       ▼
                  ┌─────────┐
                  │   END   │
                  └─────────┘
```

## 8. Document Management Workflow

```
START
  │
  ▼
┌──────────────────────────┐
│ Document Upload Request  │
└──────────┬───────────────┘
           │
      ┌────┴────┐
      │  User?  │
      └────┬────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌────────┐  ┌──────────┐
│ Admin  │  │ Employee │
└───┬────┘  └────┬─────┘
    │            │
    └─────┬──────┘
          │
          ▼
┌──────────────────────────┐
│ Select Document Type     │
│ - ID Documents           │
│ - Certificates           │
│ - Contracts              │
│ - Medical Records        │
│ - Performance Reviews    │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Select File              │
│ - Max 5MB                │
│ - Allowed: PDF, JPG,     │
│   PNG, DOC, DOCX         │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Validate File            │
│ - Check size             │
│ - Check type             │
│ - Scan for malware       │
└──────────┬───────────────┘
           │
      ┌────┴────┐
      │ Valid?  │
      └────┬────┘
           │
      ┌────┴────┐
      │   NO    │──────┐
      └─────────┘      │
           │           │
      ┌────┴────┐      │
      │   YES   │      │
      └────┬────┘      │
           │           │
           ▼           ▼
┌──────────────┐  ┌────────────┐
│ POST /api/   │  │ Show Error │
│ documents/   │  │ Invalid    │
│ upload       │  │ file       │
└──────┬───────┘  └────────────┘
       │
       ▼
┌──────────────────────────┐
│ Store File               │
│ - Generate unique name   │
│ - Save to uploads/       │
│ - Create DB record       │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Set Status               │
│ - Admin upload: Approved │
│ - Employee: Pending      │
└──────────┬───────────────┘
           │
      ┌────┴────┐
      │Employee │
      │ Upload? │
      └────┬────┘
           │
      ┌────┴────┐
      │   YES   │
      └────┬────┘
           │
           ▼
┌──────────────────────────┐
│ Admin Review Required    │
│ GET /api/documents/      │
│ pending                  │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Admin Reviews Document   │
│ - View file              │
│ - Check authenticity     │
│ - Verify information     │
└──────────┬───────────────┘
           │
      ┌────┴────┐
      │Decision?│
      └────┬────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌────────┐  ┌──────────┐
│APPROVE │  │  REJECT  │
└───┬────┘  └────┬─────┘
    │            │
    ▼            ▼
┌────────────┐  ┌──────────────┐
│ PUT /api/  │  │ PUT /api/    │
│ documents/ │  │ documents/   │
│ :id/approve│  │ :id/reject   │
└─────┬──────┘  └──────┬───────┘
      │                │
      ▼                ▼
┌────────────┐  ┌──────────────┐
│ Update     │  │ Update Status│
│ Status:    │  │ Add rejection│
│ Approved   │  │ reason       │
└─────┬──────┘  └──────┬───────┘
      │                │
      └────────┬───────┘
               │
               ▼
┌──────────────────────────┐
│ Notify Employee          │
│ - Document status        │
│ - Action required        │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Log Audit Trail          │
└──────────┬───────────────┘
           │
           ▼
      ┌─────────┐
      │   END   │
      └─────────┘
```

## 9. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    REQUEST/RESPONSE FLOW                        │
└─────────────────────────────────────────────────────────────────┘

Frontend (React)
     │
     │ 1. User Action (Click, Submit, etc.)
     │
     ▼
┌─────────────────┐
│ React Component │
│ - State update  │
│ - Form handling │
└────────┬────────┘
         │
         │ 2. API Call via React Query
         │
         ▼
┌─────────────────┐
│  API Service    │
│  - axios/fetch  │
│  - Base URL     │
│  - Headers      │
└────────┬────────┘
         │
         │ 3. HTTP Request (GET/POST/PUT/DELETE)
         │    Headers: { Authorization, Content-Type }
         │
         ▼
# Employee Management System - Technical Background Diagram

## Simple System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                            USERS / CLIENTS                              │
│                     (Admin Users & Employee Users)                      │
│                                                                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ HTTP/HTTPS Requests
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│                                                                         │
│                          WEB BROWSER                                    │
│                    (Chrome, Firefox, Edge, etc.)                        │
│                                                                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ Renders UI
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│                                                                         │
│                          FRONTEND LAYER                                 │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  React 19.1.1 + TypeScript 5.8.3                                │  │
│  │  Vite 7.1.2 (Build Tool)                                        │  │
│  │  React Router DOM 7.9.1 (Routing)                               │  │
│  │  TanStack React Query 5.87.4 (State Management)                 │  │
│  │  Tailwind CSS 4.1.13 (Styling)                                  │  │
│  │  shadcn/ui + Radix UI (Components)                              │  │
│  │  Axios 1.12.1 (HTTP Client)                                     │  │
│  │  React Hook Form + Zod (Forms & Validation)                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Port: 5173 (Development) / 10.0.0.73:5173 (Intranet)                 │
│                                                                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ REST API Calls (JSON)
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│                                                                         │
│                          BACKEND LAYER                                  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Node.js >= 16.0.0                                              │  │
│  │  Express.js 4.18.2 (Web Framework)                              │  │
│  │  express-session 1.17.3 (Authentication)                        │  │
│  │  bcryptjs 2.4.3 (Password Hashing)                              │  │
│  │  Helmet 7.1.0 (Security Headers)                                │  │
│  │  CORS 2.8.5 (Cross-Origin Resource Sharing)                     │  │
│  │  express-validator 7.0.1 (Input Validation)                     │  │
│  │  Multer 1.4.5 (File Upload)                                     │  │
│  │  PDFKit 0.17.2 (PDF Generation)                                 │  │
│  │  XLSX 0.18.5 (Excel Processing)                                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Port: 3000 (Development) / 10.0.0.73:3000 (Intranet)                 │
│                                                                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │  
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│                                                                         │
│                          DATABASE LAYER                                 │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  MySQL 8.0                                                      │  │
│  │  mysql2 3.6.5 (Node.js Driver)                                  │  │
│  │  Connection Pooling                                             │  │
│  │  ACID Transactions                                              │  │
│  │  Foreign Key Constraints                                        │  │
│  │  Indexes for Performance                                        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Database: lgu_portal                                                  │
│  Tables: users, employees, leave_applications, payroll_periods,        │
│          payroll_items, comp_benefit_records, training_programs,       │
│          training_records, employee_documents, audit_logs, etc.        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          REQUEST FLOW                                   │
└─────────────────────────────────────────────────────────────────────────┘

User Action (Click/Submit)
    │
    ▼
Browser (React Component)
    │
    ▼
React Router (Route Handling)
    │
    ▼
Axios HTTP Client (API Call)
    │
    ▼ HTTP Request (JSON)
    │
Backend Express Server (Port 3000)
    │
    ├─► CORS Middleware (Allow Origins)
    │
    ├─► Security Middleware (Helmet)
    │
    ├─► Session Middleware (Authentication Check)
    │
    ├─► Role Check Middleware (Authorization)
    │
    ├─► Validation Middleware (Input Validation)
    │
    ▼
Controller (Business Logic)
    │
    ▼
Model (Database Queries)
    │
    ▼ SQL Query
    │
MySQL Database (Data Storage)
    │
    ▼ Query Result
    │
Model (Process Data)
    │
    ▼
Controller (Format Response)
    │
    ▼ HTTP Response (JSON)
    │
Axios (Receive Response)
    │
    ▼
React Query (Cache & State Update)
    │
    ▼
React Component (Re-render UI)
    │
    ▼
Browser (Display Updated Data)
    │
    ▼
User (See Result)
```

## Core System Modules

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SYSTEM MODULES                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. AUTHENTICATION & USER MANAGEMENT                                   │
│     ├─ Login/Logout                                                    │
│     ├─ Session Management                                              │
│     ├─ Role-Based Access Control (Admin/Employee)                      │
│     └─ Password Security (bcrypt hashing)                              │
│                                                                         │
│  2. EMPLOYEE MANAGEMENT                                                │
│     ├─ Employee CRUD Operations                                        │
│     ├─ Profile Management                                              │
│     ├─ Document Upload & Management                                    │
│     └─ Employment Status Tracking                                      │
│                                                                         │
│  3. LEAVE MANAGEMENT                                                   │
│     ├─ Leave Application Submission                                    │
│     ├─ Leave Approval/Rejection Workflow                               │
│     ├─ Leave Balance Tracking                                          │
│     └─ Leave Accrual Processing                                        │
│                                                                         │
│  4. PAYROLL MANAGEMENT                                                 │
│     ├─ Payroll Period Management                                       │
│     ├─ Salary Calculation Engine                                       │
│     ├─ Allowances & Deductions                                         │
│     ├─ Payslip Generation                                              │
│     └─ Employee Overrides                                              │
│                                                                         │
│  5. COMPENSATION & BENEFITS                                            │
│     ├─ Terminal Leave Processing                                       │
│     ├─ Leave Monetization                                              │
│     ├─ 13th/14th Month Pay                                             │
│     ├─ Performance-Based Bonus (PBB)                                   │
│     ├─ GSIS Benefits                                                   │
│     └─ Loyalty Awards                                                  │
│                                                                         │
│  6. TRAINING MANAGEMENT                                                │
│     ├─ Training Program Management                                     │
│     ├─ Employee Enrollment                                             │
│     ├─ Training Records & Certificates                                 │
│     └─ Training History Tracking                                       │
│                                                                         │
│  7. REPORTS & ANALYTICS                                                │
│     ├─ Dashboard Statistics                                            │
│     ├─ Employee Reports                                                │
│     ├─ Leave Analytics                                                 │
│     ├─ Payroll Reports                                                 │
│     └─ Export to PDF/Excel                                             │
│                                                                         │
│  8. SYSTEM ADMINISTRATION                                              │
│     ├─ Audit Logs                                                      │
│     ├─ Database Backup & Restore                                       │
│     ├─ Excel Import/Export                                             │
│     └─ System Health Monitoring                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              PAYROLL MANAGEMENT SYSTEM                           │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  payroll_periods                                                 │  │
│  │  ├── id (PK)                                                     │  │
│  │  ├── name, start_date, end_date, pay_date                       │  │
│  │  ├── status (Draft/Processing/Finalized/Paid)                   │  │
│  │  ├── total_employees                                             │  │
│  │  ├── total_gross_pay, total_deductions, total_net_pay           │  │
│  │  ├── processed_by (FK → users.id), processed_at                 │  │
│  │  ├── finalized_by (FK → users.id), finalized_at                 │  │
│  │  └── created_at, updated_at                                      │  │
│  │                                                                   │  │
│  │  payroll_items                                                   │  │
│  │  ├── id (PK)                                                     │  │
│  │  ├── payroll_period_id (FK → payroll_periods.id)                │  │
│  │  ├── employee_id (FK → employees.id)                            │  │
│  │  ├── basic_salary, daily_rate, hourly_rate                      │  │
│  │  ├── days_worked, hours_worked                                  │  │
│  │  ├── basic_pay, overtime_pay, holiday_pay                       │  │
│  │  ├── night_differential                                          │  │
│  │  ├── allowances (JSON), total_allowances                        │  │
│  │  ├── deductions (JSON), total_deductions                        │  │
│  │  ├── gross_pay, net_pay                                         │  │
│  │  ├── status (Draft/Calculated/Approved/Paid)                    │  │
│  │  ├── notes                                                       │  │
│  │  ├── UNIQUE(payroll_period_id, employee_id)                     │  │
│  │  └── created_at, updated_at                                      │  │
│  │                                                                   │  │
│  │  allowance_types                                                 │  │
│  │  ├── id (PK)                                                     │  │
│  │  ├── name, description                                           │  │
│  │  ├── is_taxable, is_active                                       │  │
│  │  ├── default_amount                                              │  │
│  │  ├── calculation_type (Fixed/Percentage/Formula)                │  │
│  │  └── created_at, updated_at                                      │  │
│  │                                                                   │  │
│  │  deduction_types                                                 │  │
│  │  ├── id (PK)                                                     │  │
│  │  ├── name, description                                           │  │
│  │  ├── is_mandatory, is_active                                     │  │
│  │  ├── default_amount                                              │  │
│  │  ├── calculation_type (Fixed/Percentage/Formula)                │  │
│  │  └── created_at, updated_at                                      │  │
│  │                                                                   │  │
│  │  employee_payroll_overrides                                      │  │
│  │  ├── id (PK)                                                     │  │
│  │  ├── employee_id (FK → employees.id)                            │  │
│  │  ├── override_type (Allowance/Deduction)                        │  │
│  │  ├── type_id (FK → allowance_types/deduction_types)             │  │
│  │  ├── amount                                                      │  │
│  │  ├── is_active                                                   │  │
│  │  ├── effective_date, end_date                                   │  │
│  │  ├── notes                                                       │  │
│  │  └── created_at, updated_at                                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              COMPENSATION & BENEFITS SYSTEM                      │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  comp_benefit_records                                            │  │
│  │  ├── id (PK)                                                     │  │
│  │  ├── employee_id (FK → employees.id)                             │  │
│  │  ├── benefit_type (Terminal Leave/Leave Monetization/            │  │
│  │  │                   PBB/13th Month/14th Month/GSIS/             │  │
│  │  │                   Loyalty Award)                              │  │
│  │  ├── base_amount, calculation_details (JSON)                     │  │
│  │  ├── total_amount                                                │  │
│  │  ├── processing_date, period_covered                             │  │
│  │  ├── status (Pending/Approved/Paid/Cancelled)                    │  │
│  │  ├── processed_by (FK → users.id)                                │  │
│  │  ├── approved_by (FK → users.id), approved_at                    │  │
│  │  ├── payment_date, payment_method, reference_number              │  │
│  │  ├── notes, attachments (JSON)                                   │  │
│  │  └── created_at, updated_at                                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              TRAINING MANAGEMENT SYSTEM                          │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  training_programs                                               │  │
│  │  ├── id (PK)                                                     │  │
│  │  ├── title, description                                          │  │
│  │  ├── duration_hours, max_participants                            │  │
│  │  ├── instructor, location                                        │  │
│  │  ├── training_type (Internal/External/Online/Workshop/Seminar)   │  │
│  │  ├── status (Active/Inactive/Completed/Cancelled)                │  │
│  │  ├── start_date, end_date, registration_deadline                 │  │
│  │  ├── cost_per_participant                                        │  │
│  │  ├── requirements, objectives                                    │  │
│  │  └── created_at, updated_at                                      │  │
│  │                                                                  │  │
│  │  training_records                                                │  │
│  │  ├── id (PK)                                                     │  │
│  │  ├── employee_id (FK → employees.id)                             │  │
│  │  ├── training_program_id (FK → training_programs.id)             │  │
│  │  ├── enrollment_date, completion_date                            │  │
│  │  ├── status (Enrolled/In Progress/Completed/Dropped/Failed)      │  │
│  │  ├── score                                                       │  │
│  │  ├── certificate_issued, certificate_path                        │  │
│  │  ├── feedback, cost, notes                                       │  │
│  │  ├── UNIQUE(employee_id, training_program_id)                    │  │
│  │  └── created_at, updated_at                                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              AUDIT & LOGGING SYSTEM                              │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  audit_logs                                                      │  │
│  │  ├── id (PK)                                                     │  │
│  │  ├── user_id (FK → users.id)                                     │  │
│  │  ├── employee_id (FK → employees.id)                             │  │
│  │  ├── action (CREATE/UPDATE/DELETE/LOGIN/LOGOUT/etc.)             │  │
│  │  ├── table_name, record_id                                       │  │
│  │  ├── old_values (JSON), new_values (JSON)                        │  │
│  │  ├── ip_address, user_agent, session_id                          │  │
│  │  └── timestamp                                                   │  │
│  │                                                                  │  │
│  │  system_logs                                                     │  │
│  │  ├── id (PK)                                                     │  │
│  │  ├── level (INFO/WARNING/ERROR/DEBUG)                            │  │
│  │  ├── message                                                     │  │
│  │  ├── context (JSON)                                              │  │
│  │  ├── source (Controller/Service/Job/etc.)                        │  │
│  │  └── timestamp                                                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

## API Architecture & Endpoints

```
┌────────────────────────────────────────────────────────────────────────┐
│                    REST API ENDPOINT STRUCTURE                         │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  /api/auth                    [Authentication]                   │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  POST   /login                Login user                         │  │
│  │  POST   /logout               Logout user                        │  │
│  │  GET    /session              Get current session                │  │
│  │  GET    /user                 Get current user info              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  /api/employees               [Employee Management]              │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  GET    /                     List all employees (Admin)         │  │
│  │  POST   /                     Create employee (Admin)            │  │
│  │  GET    /:id                  Get employee details (Admin)       │  │
│  │  PUT    /:id                  Update employee (Admin)            │  │
│  │  DELETE /:id                  Soft delete employee (Admin)       │  │
│  │  GET    /profile              Get own profile (Employee)         │  │
│  │  PUT    /profile              Update own profile (Employee)      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  /api/leave                   [Leave Management]                 │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  GET    /applications         All leave applications (Admin)     │  │
│  │  PUT    /applications/:id/approve  Approve application (Admin)   │  │
│  │  PUT    /applications/:id/reject   Reject application (Admin)    │  │
│  │  GET    /balances             All employee balances (Admin)      │  │
│  │  POST   /balances/adjust      Manual balance adjustment (Admin)  │  │
│  │  GET    /my-applications      Own applications (Employee)        │  │
│  │  POST   /applications         Submit application (Employee)      │  │
│  │  GET    /my-balance           Own leave balance (Employee)       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  /api/payroll                 [Payroll Management - Admin Only]  │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  GET    /periods              Get payroll periods                │  │
│  │  POST   /periods              Create payroll period              │  │
│  │  PUT    /periods/:id          Update payroll period              │  │
│  │  DELETE /periods/:id          Delete payroll period              │  │
│  │  GET    /employees            Get employees for payroll          │  │
│  │  POST   /process              Process payroll                    │  │
│  │  GET    /items/:periodId      Get payroll items for period       │  │
│  │  PUT    /items/:id            Update payroll item                │  │
│  │  POST   /finalize/:periodId   Finalize payroll period            │  │
│  │  GET    /allowance-types      Get allowance types                │  │
│  │  POST   /allowance-types      Create allowance type              │  │
│  │  PUT    /allowance-types/:id  Update allowance type              │  │
│  │  DELETE /allowance-types/:id  Delete allowance type              │  │
│  │  GET    /deduction-types      Get deduction types                │  │
│  │  POST   /deduction-types      Create deduction type              │  │
│  │  PUT    /deduction-types/:id  Update deduction type              │  │
│  │  DELETE /deduction-types/:id  Delete deduction type              │  │
│  │  GET    /overrides/:employeeId  Get employee overrides           │  │
│  │  POST   /overrides            Create override                    │  │
│  │  PUT    /overrides/:id        Update override                    │  │
│  │  DELETE /overrides/:id        Delete override                    │  │
│  │  GET    /my-payslips          Employee's payslips (Employee)     │  │
│  │  GET    /payslip/:id          Specific payslip details (Employee)│  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  /api/compensation            [Compensation & Benefits]          │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  GET    /records              All benefit records (Admin)        │  │
│  │  POST   /process              Process benefits (Admin)           │  │
│  │  GET    /types                Available benefit types (Admin)    │  │
│  │  PUT    /records/:id          Update benefit record (Admin)      │  │
│  │  DELETE /records/:id          Delete benefit record (Admin)      │  │
│  │  POST   /monetization         Process leave monetization (Admin) │  │
│  │  GET    /eligibility/:employeeId  Check eligibility (Admin)      │  │
│  │  GET    /my-records           Employee's benefit records (Emp)   │  │
│  │  GET    /my-eligibility       Employee's eligibility (Employee)  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  /api/training                [Training Management]              │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  GET    /programs             All training programs (Admin)      │  │
│  │  POST   /programs             Create training program (Admin)    │  │
│  │  PUT    /programs/:id         Update training program (Admin)    │  │
│  │  DELETE /programs/:id         Delete training program (Admin)    │  │
│  │  GET    /records              All training records (Admin)       │  │
│  │  POST   /records              Create training record (Admin)     │  │
│  │  PUT    /records/:id          Update training record (Admin)     │  │
│  │  DELETE /records/:id          Delete training record (Admin)     │  │
│  │  GET    /enrollments          All enrollments (Admin)            │  │
│  │  POST   /enroll               Enroll employee (Admin)            │  │
│  │  GET    /my-programs          Available programs (Employee)      │  │
│  │  GET    /my-records           Employee's training history (Emp)  │  │
│  │  POST   /request-enrollment   Request enrollment (Employee)      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  /api/documents               [Document Management]              │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  GET    /types                Document types (Admin)             │  │
│  │  POST   /types                Create document type (Admin)       │  │
│  │  PUT    /types/:id            Update document type (Admin)       │  │
│  │  DELETE /types/:id            Delete document type (Admin)       │  │
│  │  GET    /pending              Pending document approvals (Admin) │  │
│  │  PUT    /:id/approve          Approve document (Admin)           │  │
│  │  PUT    /:id/reject           Reject document (Admin)            │  │
│  │  GET    /employee/:id         Employee documents (Both)          │  │
│  │  POST   /upload               Upload document (Both)             │  │
│  │  GET    /:id                  Get document (Both)                │  │
│  │  DELETE /:id                  Delete document (Both)             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  /api/reports                 [Reports & Analytics - Admin Only] │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  GET    /dashboard            Dashboard statistics               │  │
│  │  GET    /employees            Employee reports                   │  │
│  │  GET    /leave                Leave analytics                    │  │
│  │  GET    /payroll              Payroll reports                    │  │
│  │  GET    /benefits             Benefits reports                   │  │
│  │  GET    /training             Training reports                   │  │
│  │  GET    /audit                Audit reports                      │  │
│  │  POST   /export               Export reports (PDF/Excel)         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  /api/backup                  [Backup & System - Admin Only]     │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  GET    /list                 List available backups             │  │
│  │  POST   /create               Create database backup             │  │
│  │  POST   /restore              Restore from backup                │  │
│  │  DELETE /:filename            Delete backup file                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  /api/system                  [System Management - Admin Only]   │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  GET    /health               System health check                │  │
│  │  GET    /audit-logs           System audit logs                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

## Frontend Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND COMPONENT STRUCTURE                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    APPLICATION ROOT                              │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  App.tsx                                                         │  │
│  │  ├── AuthProvider (Context)                                      │  │
│  │  ├── QueryClientProvider (React Query)                          │  │
│  │  ├── ThemeProvider (Dark/Light Mode)                            │  │
│  │  └── Router                                                      │  │
│  │      ├── Public Routes                                           │  │
│  │      │   └── /login → LoginPage                                 │  │
│  │      ├── Protected Routes (Auth Required)                       │  │
│  │      │   ├── Admin Routes (Admin Role)                          │  │
│  │      │   │   ├── /admin/dashboard → AdminDashboard              │  │
│  │      │   │   ├── /admin/employees → EmployeeManagement          │  │
│  │      │   │   ├── /admin/leave → LeaveManagement                 │  │
│  │      │   │   ├── /admin/payroll → PayrollMent             │  │
│  │      │   │   ├── /admin/benefits → BenefitsManagement           │  │
│  │      │   │   ├── /admin/training → TrainingManagement           │  │
│  │      │   │   ├── /admin/reports → ReportsAnalytics              │  │
│  │      │   │   ├── /admin/audit → AuditLogs                       │  │
│  │      │   │   └── /admin/backup → BackupManagement               │  │
│  │      │   └── Employee Routes (Employee Role)                    │  │
│  │      │       ├── /employee/dashboard → EmployeeDashboard        │  │
│  │      │       ├── /employee/profile → ProfilePage                │  │
│  │      │       ├── /employee/leave → LeaveApplications            │  │
│  │      │       ├── /employee/payslips → PayslipViewer             │  │
│  │      │       ├── /employee/benefits → BenefitsInquiry           │  │
│  │      │       └── /employee/training → TrainingPortal            │  │
│  │      └── Shared Routes (Both Roles)                             │  │
│  │          ├── /profile → ProfilePage                             │  │
│  │          └── /settings → SettingsPage                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    ADMIN COMPONENTS                              │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  Employee Management                                             │  │
│  │  ├── EmployeeListPage                                            │  │
│  │  │   ├── DataTable (with sorting, filtering, pagination)        │  │
│  │  │   ├── EmployeeFilters                                         │  │
│  │  │   └── EmployeeActions (Create, Edit, Delete)                 │  │
│  │  ├── EmployeeCreatePage                                          │  │
│  │  │   ├── EmployeeForm (React Hook Form + Zod)                   │  │
│  │  │   ├── PersonalInfoSection                                     │  │
│  │  │   ├── EmploymentDetailsSection                                │  │
│  │  │   ├── CompensationSection                                     │  │
│  │  │   └── DocumentUploadSection                                   │  │
│  │  ├── EmployeeEditPage                                            │  │
│  │  │   └── EmployeeForm (pre-filled)                               │  │
│  │  └── DocumentManagementPage                                      │  │
│  │      ├── DocumentList                                            │  │
│  │      ├── DocumentUpload                                          │  │
│  │      └── DocumentApproval                                        │  │
│  │                                                                   │  │
│  │  Leave Management                                                │  │
│  │  ├── AdminLeaveManagement                                        │  │
│  │  │   ├── LeaveApplicationsTable                                 │  │
│  │  │   ├── LeaveFilters (Status, Date Range, Employee)            │  │
│  │  │   └── LeaveActions (Approve, Reject)                         │  │
│  │  ├── AdminLeaveApprovals                                         │  │
│  │  │   ├── PendingApplicationsList                                │  │
│  │  │   ├── ApplicationDetails                                      │  │
│  │  │   └── ApprovalDialog                                          │  │
│  │  ├── AdminLeaveBalances                                          │  │
│  │  │   ├── BalancesTable                                           │  │
│  │  │   ├── BalanceAdjustmentDialog                                │  │
│  │  │   └── AccrualProcessing                                       │  │
│  │  └── AdminLeaveTypes                                             │  │
│  │      ├── LeaveTypesTable                                         │  │
│  │      └── LeaveTypeForm                                           │  │
│  │                                                                   │  │
│  │  Payroll Management                                              │  │
│  │  ├── PayrollManagementPage                                       │  │
│  │  │   ├── PayrollPeriodSelector                                  │  │
│  │  │   ├── EmployeeSelectionProcessing                            │  │
│  │  │   ├── PayrollCalculationEngine                               │  │
│  │  │   └── PayrollItemsTable                                       │  │
│  │  ├── PayrollPeriodsPage                                          │  │
│  │  │   ├── PeriodsTable                                            │  │
│  │  │   ├── PeriodForm                                              │  │
│  │  │   └── PeriodActions (Process, Finalize)                      │  │
│  │  ├── PayrollReportsPage                                          │  │
│  │  │   ├── ReportFilters                                           │  │
│  │  │   ├── ReportCharts (Recharts)                                │  │
│  │  │   └── ExportOptions (PDF, Excel)                  │  │
│  │  ├── AllowanceTypesManagement                                    │  │
│  │  │   ├── AllowanceTypesTable                                    │  │
│  │  │   └── AllowanceTypeForm                                       │  │
│  │  ├── DeductionTypesManagement                                    │  │
│  │  │   ├── DeductionTypesTable                                    │  │
│  │  │   └── DeductionTypeForm                                       │  │
│  │  └── EmployeeOverridesManagement                                 │  │
│  │      ├── OverridesTable                                          │  │
│  │      └── OverrideForm                                            │  │
│  │                                                                   │  │
│  │  Benefits Management                                             │  │
│  │  ├── CompensationBenefitsPage                                    │  │
│  │  │   ├── BenefitTypeTabs                                         │  │
│  │  │   ├── BulkProcessingPanel                                     │  │
│  │  │   ├── SingleProcessingPanel                                   │  │
│  │  │   └── MonetizationPanel                                       │  │
│  │  ├── BenefitRecordsTable                                         │  │
│  │  │   ├── RecordsDataTable                                        │  │
│  │  │   ├── RecordFilters                                           │  │
│  │  │   └── RecordActions (Approve, Edit, Delete)                  │  │
│  │  └── BenefitRecordDialog                                         │  │
│  │      ├── RecordDetails                                           │  │
│  │      ├── CalculationBreakdown                                    │  │
│  │      └── ApprovalSection                                         │  │
│  │                                                                   │  │
│  │  Training Management                                             │  │
│  │  ├── AdminTrainingPrograms                                       │  │
│  │  │   ├── ProgramsTable                                           │  │
│  │  │   ├── ProgramForm                                             │  │
│  │  │   └── ProgramActions (Create, Edit, Delete)                  │  │
│  │  └── AdminTrainingRecords                                        │  │
│  │      ├── RecordsTable                                            │  │
│  │      ├── EnrollmentDialog                                        │  │
│  │      └── CertificateGeneration                                   │  │
│  │                                                                   │  │
│  │  System Administration                                           │  │
│  │  ├── AuditLogsPage                                               │  │
│  │  │   ├── AuditLogsTable                                          │  │
│  │  │   ├── LogFilters (User, Action, Date Range)                  │  │
│  │  │   └── LogDetails                                              │  │
│  │  ├── BackupManagement                                            │  │
│  │  │   ├── BackupsList                                             │  │
│  │  │   ├── CreateBackupButton                                      │  │
│  │  │   └── RestoreBackupDialog                                     │  │
│  │  ├── DocumentTypesManagement                                     │  │
│  │  │   ├── DocumentTypesTable                                      │  │
│  │  │   └── DocumentTypeForm                                        │  │
│  │  └── EmployeeImportPage                                          │  │
│  │      ├── ExcelImport (react-dropzone)                           │  │
│  │      ├── ImportPreview                                           │  │
│  │      └── ImportResults                                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    EMPLOYEE COMPONENTS                           │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  Profile Management                                              │  │
│  │  ├── ProfilePage                                                 │  │
│  │  │   ├── ProfileHeader (Avatar, Name, Position)                 │  │
│  │  │   ├── PersonalInformationCard                                │  │
│  │  │   ├── EmploymentDetailsCard                                  │  │
│  │  │   ├── EmergencyContactCard                                   │  │
│  │  │   └── ProfileEditDialog                                       │  │
│  │  └── ProfileSettings                                             │  │
│  │      ├── PasswordChange                                          │  │
│  │      ├── NotificationPreferences                                │  │
│  │      └── ThemeSettings                                           │  │
│  │                                                                   │  │
│  │  Leave Management                                                │  │
│  │  ├── EmployeeLeaveApplications                                   │  │
│  │  │   ├── ApplicationsList                                        │  │
│  │  │   ├── ApplicationStatusBadge                                 │  │
│  │  │   └── NewApplicationButton                                    │  │
│  │  ├── EmployeeLeaveBalance                                        │  │
│  │  │   ├── BalanceCards (by Leave Type)                           │  │
│  │  │   ├── BalanceChart                                            │  │
│  │  │   └── AccrualHistory                                          │  │
│  │  └── LeaveApplicationForm                                        │  │
│  │      ├── LeaveTypeSelector                                       │  │
│  │      ├── DateRangePicker (react-day-picker)                     │  │
│  │      ├── ReasonTextarea                                          │  │
│  │      └── SubmitButton                                            │  │
│  │                                                                   │  │
│  │  Payroll Access                                                  │  │
│  │  ├── PayslipViewer                                               │  │
│  │  │   ├── PayslipsList                                            │  │
│  │  │   ├── PayslipCard                                             │  │
│  │  │   │   ├── GrossPaySection                                     │  │
│  │  │   │   ├── AllowancesBreakdown                                │  │
│  │  │   │   ├── DeductionsBreakdown                                │  │
│  │  │   │   └── NetPaySection                                       │  │
│  │  │   └── DownloadPDFButton                                       │  │
│  │  └── PayrollHistory                                              │  │
│  │      ├── HistoryTable                                            │  │
│  │      ├── YearFilter                                              │  │
│  │      └── ExportButton                                            │  │
│  │                                                                   │  │
│  │  Benefits Inquiry                                                │  │
│  │  ├── BenefitRecordsTable                                         │  │
│  │  │   ├── RecordsDataTable                                        │  │
│  │  │   ├── BenefitTypeFilter                                       │  │
│  │  │   └── RecordDetails                                           │  │
│  │  └── EligibilityStatus                                           │  │
│  │      ├── EligibilityCards                                        │  │
│  │      └── RequirementsChecklist                                   │  │
│  │                                                                   │  │
│  │  Training Portal                                                 │  │
│  │  ├── EmployeeMyTrainingsPage                                     │  │
│  │  │   ├── EnrolledProgramsTab                                     │  │
│  │  │   ├── AvailableProgramsTab                                    │  │
│  │  │   └── CompletedProgramsTab                                    │  │
│  │  ├── AvailablePrograms                                           │  │
│  │  │   ├── ProgramCards                                            │  │
│  │  │   ├── ProgramDetails                                          │  │
│  │  │   └── EnrollmentButton                                        │  │
│  │  └── TrainingHistory                                             │  │
│  │      ├── HistoryTable                                            │  │
│  │      ├── CertificateDownload                                     │  │
│  │      └── FeedbackForm                                            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    SHARED UI COMPONENTS                          │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  shadcn/ui Components (Radix UI based)                          │  │
│  │  ├── Button, Input, Select, Checkbox, Switch                    │  │
│  │  ├── Dialog, AlertDialog, Popover, Tooltip                      │  │
│  │  ├── Card, Badge, Avatar, Separator                             │  │
│  │  ├── Table, DataTable, Pagination                               │  │
│  │  ├── Tabs, Collapsible, ScrollArea                              │  │
│  │  ├── Calendar, DatePicker (react-day-picker)                    │  │
│  │  ├── Progress, Loading Spinner                                  │  │
│  │  └── Toast (sonner)                                              │  │
│  │                                                                   │  │
│  │  Custom Components                                               │  │
│  │  ├── Layout                                                      │  │
│  │  │   ├── MainLayout (Sidebar + Header + Content)                │  │
│  │  │   ├── Sidebar (Navigation)                                    │  │
│  │  │   ├── Header (User Menu, Notifications)                      │  │
│  │  │   └── Footer                                                  │  │
│  │  ├── Navigation                                                  │  │
│  │  │   ├── AdminNavigation                                         │  │
│  │  │   └── EmployeeNavigation                                      │  │
│  │  ├── Forms                                                       │  │
│  │  │   ├── FormField (with validation)                            │  │
│  │  │   ├── FormError                                               │  │
│  │  │   └── FormSuccess                                             │  │
│  │  ├── Data Display                                                │  │
│  │  │   ├── StatCard                                                │  │
│  │  │   ├── InfoCard                                                │  │
│  │  │   ├── StatusBadge                                             │  │
│  │  │   └── EmptyState                                              │  │
│  │  ├── Feedback                                                    │  │
│  │  │   ├── LoadingSpinner                                          │  │
│  │  │   ├── ErrorMessage                                            │  │
│  │  │   ├── SuccessMessage                                          │  │
│  │  │   └── ConfirmDialog                                           │  │
│  │  └── Charts                                                      │  │
│  │      ├── BarChart (Recharts)                                     │  │
│  │      ├── LineChart (Recharts)                                    │  │
│  │      ├── PieChart (Recharts)                                     │  │
│  │      └── AreaChart (Recharts)                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Technologies Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      TECHNOLOGY SUMMARY                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  FRONTEND                                                               │
│  ├─ React 19.1.1 (UI Framework)                                        │
│  ├─ TypeScript 5.8.3 (Type Safety)                                     │
│  ├─ Vite 7.1.2 (Build Tool)                                            │
│  ├─ React Router DOM 7.9.1 (Routing)                                   │
│  ├─ TanStack React Query 5.87.4 (Server State)                         │
│  ├─ Tailwind CSS 4.1.13 (Styling)                                      │
│  ├─ shadcn/ui + Radix UI (Components)                                  │
│  ├─ React Hook Form + Zod (Forms)                                      │
│  ├─ Axios 1.12.1 (HTTP Client)                                         │
│  └─ Recharts 2.15.4 (Charts)                                           │
│                                                                         │
│  BACKEND                                                                │
│  ├─ Node.js >= 16.0.0 (Runtime)                                        │
│  ├─ Express.js 4.18.2 (Web Framework)                                  │
│  ├─ express-session 1.17.3 (Sessions)                                  │
│  ├─ bcryptjs 2.4.3 (Password Hashing)                                  │
│  ├─ Helmet 7.1.0 (Security)                                            │
│  ├─ CORS 2.8.5 (Cross-Origin)                                          │
│  ├─ express-validator 7.0.1 (Validation)                               │
│  ├─ Multer 1.4.5 (File Upload)                                         │
│  ├─ PDFKit 0.17.2 (PDF Generation)                                     │
│  ├─ XLSX 0.18.5 (Excel Processing)                                     │
│  └─ node-cron 4.2.1 (Scheduling)                                       │
│                                                                         │
│  DATABASE                                                               │
│  ├─ MySQL 8.0 (RDBMS)                                                  │
│  ├─ mysql2 3.6.5 (Node.js Driver)                                      │
│  ├─ Connection Pooling                                                 │
│  └─ ACID Transactions                                                  │
│                                                                         │
│  DEPLOYMENT                                                             │
│  ├─ Development: localhost:5173 (Frontend), localhost:3000 (Backend)   │
│  └─ Intranet: 10.0.0.73:5173 (Frontend), 10.0.0.73:3000 (Backend)     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Database Tables

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      MAIN DATABASE TABLES                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Authentication & Users                                                 │
│  ├─ users                    (User accounts & authentication)          │
│  └─ user_sessions            (Active sessions)                         │
│                                                                         │
│  Employee Management                                                    │
│  ├─ employees                (Employee records)                        │
│  ├─ employee_documents       (Uploaded documents)                      │
│  └─ document_types           (Document type configuration)             │
│                                                                         │
│  Leave Management                                                       │
│  ├─ leave_types              (Leave type configuration)                │
│  ├─ leave_balances           (Employee leave balances)                 │
│  └─ leave_applications       (Leave requests)                          │
│                                                                         │
│  Payroll Management                                                     │
│  ├─ payroll_periods          (Payroll periods)                         │
│  ├─ payroll_items            (Individual payslips)                     │
│  ├─ allowance_types          (Allowance configuration)                 │
│  ├─ deduction_types          (Deduction configuration)                 │
│  └─ employee_payroll_overrides (Employee-specific overrides)           │
│                                                                         │
│  Compensation & Benefits                                                │
│  └─ comp_benefit_records     (Benefit processing records)              │
│                                                                         │
│  Training Management                                                    │
│  ├─ training_programs        (Training programs)                       │
│  └─ training_records         (Employee training records)               │
│                                                                         │
│  System & Audit                                                         │
│  ├─ audit_logs               (User activity logs)                      │
│  └─ system_logs              (System event logs)                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

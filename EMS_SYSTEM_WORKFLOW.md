# Employee Management System (EMS) - System & Database Workflow

## Table of Contents
- [System Overview](#system-overview)
- [Architecture Diagram](#architecture-diagram)
- [Database Schema Workflow](#database-schema-workflow)
- [User Authentication Flow](#user-authentication-flow)
- [Core Module Workflows](#core-module-workflows)
- [Data Flow Diagrams](#data-flow-diagrams)
- [System Integration Points](#system-integration-points)
- [Background Job Processing](#background-job-processing)
- [Security & Audit Trail](#security--audit-trail)
- [Frontend-Backend Communication](#frontend-backend-communication)

## System Overview

The Employee Management System (EMS) is a comprehensive Human Resource Information System (HRIS) designed for managing employee records, leave management, payroll processing, training records, benefits administration, and terminal leave benefits calculation.

### Key Features
- **Employee Management**: Complete employee lifecycle management
- **Leave Management**: Automated leave accrual, applications, and approvals
- **Payroll System**: Salary management, allowances, and deductions
- **Training Management**: Training programs and employee training records
- **Document Management**: Employee document upload and approval workflow
- **Benefits Administration**: Compensation and benefits tracking
- **Terminal Leave Benefits**: Automated TLB calculation for separating employees
- **Audit Trail**: Comprehensive logging of all system activities

### Technology Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MySQL 8.0
- **Authentication**: Session-based with bcrypt
- **File Storage**: Local file system with Express-fileupload
- **Scheduled Jobs**: Node-cron for automated tasks

## Architecture Diagram

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React TypeScript App]
        B[Pages & Components]
        C[Services & API Client]
        D[Authentication Context]
    end

    subgraph "Middleware Layer"
        E[Authentication Middleware]
        F[Authorization Middleware]
        G[Audit Logger]
        H[Error Handler]
        I[File Upload Handler]
    end

    subgraph "Backend Layer"
        J[Express.js Server]
        K[Route Handlers]
        L[Controllers]
        M[Models]
        N[Database Utils]
    end

    subgraph "Database Layer"
        O[MySQL 8.0 Database]
        P[Core Tables]
        Q[Payroll Tables]
        R[Audit Tables]
    end

    subgraph "Background Jobs"
        S[Monthly Accrual Job]
        T[Report Generation]
        U[Data Cleanup]
    end

    A --> C
    C --> J
    J --> E
    E --> F
    F --> G
    G --> K
    K --> L
    L --> M
    M --> N
    N --> O
    
    S --> N
    T --> N
    U --> N

    O --> P
    O --> Q
    O --> R
```

## Database Schema Workflow

### Core Database Tables Structure

```mermaid
erDiagram
    users ||--o| employees : "has profile"
    employees ||--o{ employee_leave_balances : "has balances"
    employees ||--o{ leave_applications : "submits"
    employees ||--o{ employee_documents : "uploads"
    employees ||--o{ employee_trainings : "attends"
    employees ||--o{ terminal_leave_benefits : "claims"
    employees ||--o{ payroll_items : "receives pay"
    
    users {
        int id PK
        string username UK
        string email UK
        string password_hash
        enum role
        boolean is_active
        int failed_login_attempts
        timestamp locked_until
        timestamp last_login
        timestamp created_at
    }
    
    employees {
        int id PK
        int user_id FK
        string employee_number UK
        string first_name
        string middle_name
        string last_name
        enum sex
        date birth_date
        string email_address
        decimal current_monthly_salary
        decimal current_daily_rate
        enum employment_status
        timestamp deleted_at
    }
    
    leave_types {
        int id PK
        string name UK
        string code UK
        int max_days_per_year
        boolean is_monetizable
    }
    
    employee_leave_balances {
        int id PK
        int employee_id FK
        int leave_type_id FK
        year year
        decimal earned_days
        decimal used_days
        decimal current_balance
    }
    
    leave_applications {
        int id PK
        int employee_id FK
        int leave_type_id FK
        date start_date
        date end_date
        decimal days_requested
        enum status
        text reason
    }
    
    payroll_periods {
        int id PK
        int year
        int month
        int period_number
        date start_date
        date end_date
        enum status
    }
    
    payroll_items {
        int id PK
        int payroll_period_id FK
        int employee_id FK
        decimal basic_pay
        decimal total_allowances
        decimal total_deductions
        decimal net_pay
    }
```

### Table Relationships & Constraints

1. **One-to-One Relationships**
   - `users` ↔ `employees` (Optional: employees can exist without user accounts)

2. **One-to-Many Relationships**
   - `employees` → `employee_leave_balances`
   - `employees` → `leave_applications`
   - `employees` → `employee_documents`
   - `employees` → `employee_trainings`
   - `payroll_periods` → `payroll_items`

3. **Foreign Key Constraints**
   - All foreign keys include CASCADE DELETE for child records
   - Audit logs maintain referential integrity

## User Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth Middleware
    participant C as Controller
    participant D as Database
    
    U->>F: Enter credentials
    F->>A: POST /api/auth/login
    A->>C: Validate request
    C->>D: Check user credentials
    D-->>C: User data
    C->>C: Verify password (bcrypt)
    C->>D: Update login attempts
    C->>A: Create session
    A-->>F: Session cookie + user data
    F-->>U: Redirect to dashboard
    
    Note over A,C: Failed login increases attempts counter
    Note over A,C: Account locked after 5 failed attempts
```

### Session Management
- **Session Duration**: 8 hours
- **Security Features**: HTTPOnly cookies, SameSite protection
- **Account Lockout**: 5 failed attempts = 15-minute lockout
- **Role-based Access**: Admin vs Employee permissions

## Core Module Workflows

### 1. Employee Management Workflow

```mermaid
flowchart TD
    A[Employee Creation Request] --> B{Admin Access?}
    B -->|No| C[Access Denied]
    B -->|Yes| D[Validate Employee Data]
    D --> E{Validation Passed?}
    E -->|No| F[Return Validation Errors]
    E -->|Yes| G[Check Duplicate Employee Number]
    G --> H{Duplicate Found?}
    H -->|Yes| I[Return Duplicate Error]
    H -->|No| J[Calculate Salary Rates]
    J --> K[Insert Employee Record]
    K --> L[Create Leave Balances]
    L --> M[Log Audit Entry]
    M --> N[Return Success Response]
```

**Key Features:**
- Automatic salary rate calculation (22-day month rule)
- Soft delete implementation with restore capability
- Comprehensive validation with business rules
- Automatic leave balance initialization

### 2. Leave Management Workflow

```mermaid
flowchart TD
    A[Employee Leave Application] --> B[Validate Leave Request]
    B --> C{Valid Request?}
    C -->|No| D[Return Validation Error]
    C -->|Yes| E[Check Leave Balance]
    E --> F{Sufficient Balance?}
    F -->|No| G[Insufficient Balance Error]
    F -->|Yes| H[Create Leave Application]
    H --> I[Update Status to Pending]
    I --> J[Send Notification to Admin]
    
    K[Admin Reviews Application] --> L{Approve/Reject?}
    L -->|Approve| M[Update Status to Approved]
    L -->|Reject| N[Update Status to Rejected]
    M --> O[Deduct from Leave Balance]
    O --> P[Create Balance Adjustment]
    P --> Q[Log Audit Entry]
    
    subgraph "Monthly Accrual Process"
        R[Automated Monthly Job] --> S[Process All Active Employees]
        S --> T[Calculate Monthly Accrual]
        T --> U[Update Leave Balances]
        U --> V[Log Accrual Records]
    end
```

**Accrual Rules:**
- **Vacation Leave**: 1.25 days per month (15 days/year)
- **Sick Leave**: 1.25 days per month (15 days/year)
- **Automatic Processing**: 1st of each month at 2:00 AM

### 3. Payroll Processing Workflow

```mermaid
flowchart TD
    A[Create Payroll Period] --> B[Set Period Details]
    B --> C[Generate Employee Payroll Items]
    C --> D[Calculate Basic Pay]
    D --> E[Add Allowances]
    E --> F[Subtract Deductions]
    F --> G[Calculate Net Pay]
    G --> H[Review Payroll]
    H --> I{Approve Payroll?}
    I -->|No| J[Make Adjustments]
    I -->|Yes| K[Mark as Completed]
    K --> L[Generate Payroll Reports]
    J --> H
```

**Payroll Components:**
- **Basic Pay**: Monthly salary or daily rate × working days
- **Allowances**: Transportation, meal, housing allowances
- **Deductions**: SSS, PhilHealth, Pag-IBIG, tax, loans
- **Period Types**: 1st half (1-15th) and 2nd half (16th-end) of month

### 4. Training Management Workflow

```mermaid
flowchart TD
    A[Create Training Program] --> B[Set Program Details]
    B --> C[Enroll Employees]
    C --> D[Track Training Progress]
    D --> E[Mark Training Completion]
    E --> F[Issue Certificate]
    F --> G[Update Employee Training Records]
    G --> H[Generate Training Reports]
```

### 5. Terminal Leave Benefits (TLB) Workflow

```mermaid
flowchart TD
    A[Employee Separation] --> B[Calculate Total Leave Credits]
    B --> C[Get Highest Monthly Salary]
    C --> D[Apply Constant Factor]
    D --> E[Compute TLB Amount]
    E --> F[Create TLB Record]
    F --> G[Admin Review]
    G --> H{Approve?}
    H -->|Yes| I[Mark as Approved]
    H -->|No| J[Request Revision]
    I --> K[Process Payment]
    K --> L[Mark as Paid]
```

**TLB Calculation Formula:**
```
TLB Amount = Total Leave Credits × Highest Monthly Salary × Constant Factor (1.00)
```

## Data Flow Diagrams

### Employee CRUD Operations

```mermaid
sequenceDiagram
    participant F as Frontend
    participant R as Routes
    participant M as Middleware
    participant C as Controller
    participant E as Employee Model
    participant D as Database
    
    F->>R: POST /api/employees
    R->>M: Authentication Check
    M->>M: Verify Admin Role
    M->>C: employeeController.createEmployee
    C->>C: Validate Input Data
    C->>E: new Employee(data)
    E->>E: validate()
    E->>E: updateSalaryRates()
    E->>D: INSERT employee record
    D-->>E: Employee ID
    E->>D: Initialize leave balances
    E-->>C: Success response
    C-->>F: Employee created successfully
```

### Leave Application Process

```mermaid
sequenceDiagram
    participant E as Employee
    participant F as Frontend
    participant L as Leave Controller
    participant LB as Leave Balance Model
    participant D as Database
    
    E->>F: Submit leave application
    F->>L: POST /api/leaves/applications
    L->>LB: Check available balance
    LB->>D: Query leave_balances
    D-->>LB: Current balance
    LB-->>L: Balance validation
    L->>D: Insert leave_application
    L->>D: Log audit entry
    L-->>F: Application submitted
    F-->>E: Confirmation message
```

## System Integration Points

### 1. Authentication Integration
- Session-based authentication with Express sessions
- Role-based access control (Admin/Employee)
- Account lockout mechanism
- Password strength validation

### 2. File Upload Integration
- Document upload for employee records
- File type validation and size limits
- Secure file storage with organized directory structure
- Document approval workflow

### 3. Audit Trail Integration
- Automatic logging of all database modifications
- User action tracking with IP and timestamp
- Before/after value comparison for updates
- Comprehensive audit report generation

### 4. Email Integration (Planned)
- Leave application notifications
- Payroll distribution alerts
- Training program notifications
- System alerts and maintenance notices

## Background Job Processing

### Monthly Leave Accrual Job

```mermaid
flowchart TD
    A[Cron Job Trigger: 1st of Month] --> B[Get All Active Employees]
    B --> C[Check Existing Accrual Records]
    C --> D{Already Processed?}
    D -->|Yes| E[Skip Employee]
    D -->|No| F[Calculate Monthly Accrual]
    F --> G[Update Leave Balance]
    G --> H[Log Accrual Record]
    H --> I[Update Audit Trail]
    I --> J{More Employees?}
    J -->|Yes| B
    J -->|No| K[Generate Summary Report]
    K --> L[Send Completion Notification]
```

**Job Configuration:**
- **Schedule**: 1st of each month at 2:00 AM (Asia/Manila timezone)
- **Safety Features**: Idempotent processing, duplicate prevention
- **Monitoring**: Status tracking, error logging, processing history

## Security & Audit Trail

### Security Measures

1. **Authentication Security**
   - bcrypt password hashing (12 rounds)
   - Session-based authentication
   - Account lockout after failed attempts
   - Password strength validation

2. **Authorization Security**
   - Role-based access control
   - Resource-level permissions
   - Owner-based data access

3. **Data Security**
   - SQL injection prevention with parameterized queries
   - Input validation and sanitization
   - File upload security with type validation
   - Soft delete for data preservation

### Audit Trail System

```mermaid
flowchart TD
    A[User Action] --> B[Audit Middleware]
    B --> C[Capture Request Data]
    C --> D[Execute Original Action]
    D --> E[Capture Response Data]
    E --> F[Log to audit_logs Table]
    F --> G[Include User Context]
    G --> H[Store IP & User Agent]
```

**Audit Log Fields:**
- User ID and action performed
- Table name and record ID affected
- Before and after values (JSON)
- IP address and user agent
- Timestamp and session information

## Frontend-Backend Communication

### API Communication Pattern

```mermaid
sequenceDiagram
    participant C as React Component
    participant S as API Service
    participant I as Axios Interceptor
    participant B as Backend API
    
    C->>S: Service method call
    S->>I: HTTP request
    I->>I: Add authentication headers
    I->>B: Authenticated request
    B-->>I: Response with data
    I->>I: Handle errors globally
    I-->>S: Processed response
    S-->>C: Component data update
    
    Note over I: Automatic error handling
    Note over I: Session management
```

### State Management Flow

```mermaid
flowchart TD
    A[User Interaction] --> B[Component Event Handler]
    B --> C[API Service Call]
    C --> D[Backend Processing]
    D --> E[Database Operation]
    E --> F[Response Data]
    F --> G[Component State Update]
    G --> H[UI Re-render]
    H --> I[User Feedback]
```

### Frontend Routing Structure

```
/                          → Login Page
/dashboard                 → Main Dashboard
/employees                 → Employee List (Admin)
/employees/:id             → Employee Profile
/employees/:id/edit        → Employee Edit Form (Admin)
/leaves                    → Leave Management
/leaves/applications       → My Leave Applications
/leaves/admin              → Admin Leave Management
/training                  → Training Management
/training/programs         → Training Programs
/payroll                   → Payroll Management (Admin)
/benefits                  → Benefits Administration
/tlb                       → Terminal Leave Benefits
/profile                   → User Profile
/admin                     → Admin Panel
```

## Error Handling & Recovery

### Error Handling Strategy

1. **Frontend Error Handling**
   - Global error boundary for React components
   - API error interceptors with user-friendly messages
   - Form validation with real-time feedback
   - Loading states and error recovery options

2. **Backend Error Handling**
   - Global error handler middleware
   - Structured error responses
   - Database transaction rollback
   - Comprehensive error logging

3. **Database Error Recovery**
   - Connection pool management
   - Automatic reconnection handling
   - Transaction safety with rollback
   - Data validation before operations

### System Monitoring

- **Performance Monitoring**: Response time tracking
- **Error Monitoring**: Error rate and frequency analysis
- **Audit Monitoring**: Security event detection
- **Resource Monitoring**: Database performance metrics

## Deployment & Configuration

### Environment Configuration

```javascript
// Production Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=ems_user
DB_PASSWORD=secure_password
DB_NAME=employee_management_system
SESSION_SECRET=production_session_secret
NODE_ENV=production
PORT=3000
```

### Database Optimization

1. **Indexing Strategy**
   - Primary keys on all tables
   - Foreign key indexes for relationships
   - Composite indexes for frequent queries
   - Search indexes for text fields

2. **Performance Optimization**
   - Connection pooling (max 10 connections)
   - Query optimization with proper joins
   - Pagination for large result sets
   - Caching for frequently accessed data

---

## Summary

The Employee Management System (EMS) provides a comprehensive solution for human resource management with:

- **Robust Architecture**: Layered design with clear separation of concerns
- **Complete CRUD Operations**: Full employee lifecycle management
- **Automated Processes**: Leave accrual, payroll processing, and report generation
- **Security & Compliance**: Comprehensive audit trail and role-based access
- **Modern Frontend**: React-based responsive user interface
- **Scalable Backend**: Node.js with optimized database operations

The system is designed for reliability, maintainability, and scalability, making it suitable for organizations of various sizes requiring comprehensive employee management capabilities.
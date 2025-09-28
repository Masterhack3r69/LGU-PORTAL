# Employee Management System - Complete Workflow Documentation

## System Architecture Overview

The Employee Management System (EMS) is a full-stack web application with clear separation between backend API services and frontend React application, designed for role-based access control.

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTEM ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + TypeScript)     Backend (Node.js/Express)│
│  ├── Admin Dashboard              ├── Authentication API    │
│  ├── Employee Portal              ├── Employee API          │
│  ├── Shared Components            ├── Leave Management API  │
│  └── Role-based Routing           ├── Payroll API           │
│                                   ├── Benefits API          │
│                                   ├── Training API          │
│                                   ├── Documents API         │
│                                   └── Reports API           │
├─────────────────────────────────────────────────────────────┤
│                    DATABASE (MySQL)                         │
│  ├── User Management Tables                                 │
│  ├── Employee Data Tables                                   │
│  ├── Leave Management Tables                                │
│  ├── Payroll Tables                                         │
│  ├── Benefits Tables                                        │
│  ├── Training Tables                                        │
│  └── Audit & Logging Tables                                 │
└─────────────────────────────────────────────────────────────┘
```

## User Role Separation

### Admin Users
- **Full System Access**: Complete CRUD operations on all entities
- **Management Functions**: Employee lifecycle, payroll processing, benefits administration
- **System Administration**: User management, audit logs, system configuration
- **Reporting**: Comprehensive analytics and reporting capabilities

### Employee Users  
- **Self-Service Portal**: Personal information management, leave applications
- **View-Only Access**: Payslips, benefits records, training history
- **Limited Actions**: Profile updates, leave requests, training enrollment

## Core System Workflows

### 1. Authentication & Authorization Flow

```
User Login → Session Validation → Role Detection → Route Protection → Feature Access
```

**Admin Flow:**
1. Login with admin credentials
2. Session established with admin role
3. Access to admin dashboard and all management features
4. Full CRUD permissions across all modules

**Employee Flow:**
1. Login with employee credentials  
2. Session established with employee role
3. Access to employee portal with restricted features
4. Read-only access to personal data, limited write permissions

### 2. Employee Management Workflow

**Admin Operations:**
```
Employee Creation → Profile Management → Document Upload → Status Management → Termination
```

**Employee Operations:**
```
Profile View → Personal Info Updates → Document Submission → Status Inquiry
```

### 3. Leave Management Workflow

**Employee Process:**
```
Leave Application → Submission → Status Tracking → Balance Inquiry
```

**Admin Process:**
```
Application Review → Approval/Rejection → Balance Adjustment → Accrual Processing
```

### 4. Payroll Processing Workflow

**Admin-Only Process:**
```
Period Setup → Employee Selection → Calculation Processing → Adjustments → Finalization → Payslip Generation
```

**Employee Access:**
```
Payslip Viewing → Historical Records → Deduction Details
```

### 5. Benefits Administration Workflow

**Admin Process:**
```
Benefit Configuration → Employee Eligibility → Processing → Record Management → Reporting
```

**Employee Access:**
```
Benefit Inquiry → Record Viewing → Status Tracking
```

## Codebase Separation

### Backend Structure (`/backend`)

#### Core API Modules
```
├── controllers/
│   ├── authController.js          # Authentication & session management
│   ├── employeeController.js      # Employee CRUD operations
│   ├── leaveController.js         # Leave management
│   ├── payrollController.js       # Payroll processing
│   ├── compensationController.js  # Benefits administration
│   ├── trainingController.js      # Training management
│   ├── documentController.js      # Document handling
│   └── reportsController.js       # Analytics & reporting
```

#### Authentication & Authorization
```
├── middleware/
│   ├── auth.js                    # Session validation
│   ├── roleCheck.js               # Role-based access control
│   ├── audit.js                   # Activity logging
│   └── validation.js              # Input validation
```

#### Data Models
```
├── models/
│   ├── User.js                    # Authentication model
│   ├── Employee.js                # Employee data model
│   ├── Leave.js                   # Leave management model
│   ├── Payroll.js                 # Payroll processing model
│   ├── CompensationBenefit.js     # Benefits model
│   └── Training.js                # Training model
```

#### API Routes
```
├── routes/
│   ├── authRoutes.js              # /api/auth/*
│   ├── employeeRoutes.js          # /api/employees/*
│   ├── leaveRoutes.js             # /api/leave/*
│   ├── payrollRoutes.js           # /api/payroll/*
│   ├── compensationRoutes.js      # /api/compensation/*
│   ├── trainingRoutes.js          # /api/training/*
│   ├── documentRoutes.js          # /api/documents/*
│   └── reportsRoutes.js           # /api/reports/*
```

### Frontend Structure (`/frontend`)

#### Role-Based Page Structure
```
├── src/pages/
│   ├── LoginPage.tsx              # Authentication entry point
│   ├── admin/                     # Admin-only pages
│   │   ├── EmployeeImportPage.tsx
│   │   └── AuditLogsPage.tsx
│   ├── employees/                 # Employee management (Admin)
│   │   ├── EmployeeListPage.tsx
│   │   ├── EmployeeCreatePage.tsx
│   │   ├── EmployeeEditPage.tsx
│   │   └── DocumentManagementPage.tsx
│   ├── leaves/                    # Leave management
│   │   └── LeaveManagementPage.tsx
│   ├── payroll/                   # Payroll (Admin-only)
│   │   ├── PayrollManagementPage.tsx
│   │   ├── PayrollPeriodsPage.tsx
│   │   └── PayrollReportsPage.tsx
│   ├── benefits/                  # Benefits management
│   │   └── CompensationBenefitsPage.tsx
│   ├── training/                  # Training management
│   │   └── EmployeeMyTrainingsPage.tsx
│   ├── ProfilePage.tsx            # User profile (Both roles)
│   └── SettingsPage.tsx           # User settings (Both roles)
```

#### Component Separation by Role
```
├── src/components/
│   ├── admin/                     # Admin-only components
│   │   ├── AuditLogsManagement.tsx
│   │   ├── BackupManagement.tsx
│   │   ├── DocumentTypesManagement.tsx
│   │   ├── ExcelImport.tsx
│   │   └── ImportResults.tsx
│   ├── employees/                 # Employee management components
│   ├── leaves/                    # Leave management components
│   │   ├── AdminLeaveManagement.tsx      # Admin view
│   │   ├── AdminLeaveApprovals.tsx       # Admin approvals
│   │   ├── AdminLeaveBalances.tsx        # Admin balance management
│   │   ├── EmployeeLeaveApplications.tsx # Employee applications
│   │   └── EmployeeLeaveBalance.tsx      # Employee balance view
│   ├── payroll/                   # Payroll components (Admin-only)
│   │   ├── PayrollAdjustments.tsx
│   │   ├── EmployeeSelection.tsx
│   │   ├── EmployeeSelectionProcessing.tsx
│   │   ├── AllowanceTypesManagement.tsx
│   │   ├── DeductionTypesManagement.tsx
│   │   └── EmployeeOverridesManagement.tsx
│   ├── benefits/                  # Benefits components
│   │   ├── BulkProcessingPanel.tsx       # Admin bulk processing
│   │   ├── SingleProcessingPanel.tsx     # Admin single processing
│   │   ├── MonetizationPanel.tsx         # Admin monetization
│   │   ├── BenefitRecordDialog.tsx       # Record management
│   │   └── BenefitRecordsTable.tsx       # Records display
│   ├── training/                  # Training components
│   │   ├── AdminTrainingPrograms.tsx     # Admin program management
│   │   ├── AdminTrainingRecords.tsx      # Admin records management
│   │   ├── EmployeeTrainingManagement.tsx # Employee training view
│   │   └── TrainingForm.tsx              # Training form
│   ├── profile/                   # Profile components (Both roles)
│   │   └── ProfileSettings.tsx
│   └── ui/                        # Shared UI components
```

## Detailed Workflow Operations

### Admin Dashboard Operations

#### Employee Management
1. **Employee Creation**
   - Form validation and data entry
   - Document upload and verification
   - Initial setup of leave balances
   - User account creation (if applicable)

2. **Employee Lifecycle Management**
   - Status updates (Active, Inactive, Terminated)
   - Profile modifications and approvals
   - Document management and compliance
   - Historical record maintenance

#### Leave Management
1. **Leave Configuration**
   - Leave type setup and rules
   - Accrual policy configuration
   - Holiday calendar management
   - Approval workflow setup

2. **Leave Processing**
   - Application review and approval
   - Balance calculations and adjustments
   - Automated accrual processing
   - Leave analytics and reporting

#### Payroll Operations
1. **Payroll Setup**
   - Period configuration and scheduling
   - Employee selection and filtering
   - Allowance and deduction type management
   - Override and adjustment setup

2. **Payroll Processing**
   - Calculation engine execution
   - Manual adjustments and overrides
   - Working days adjustments
   - Final processing and payslip generation

#### Benefits Administration
1. **Benefit Configuration**
   - Benefit type setup and rules
   - Eligibility criteria configuration
   - Processing parameters setup
   - Approval workflow configuration

2. **Benefit Processing**
   - Individual and bulk processing
   - Monetization calculations
   - Record management and tracking
   - Compliance reporting

### Employee Portal Operations

#### Self-Service Functions
1. **Profile Management**
   - Personal information updates
   - Contact information maintenance
   - Emergency contact management
   - Profile photo upload

2. **Leave Management**
   - Leave application submission
   - Balance inquiry and tracking
   - Application status monitoring
   - Leave history review

3. **Payroll Access**
   - Payslip viewing and download
   - Historical payroll records
   - Deduction and allowance details
   - Tax information access

4. **Benefits Inquiry**
   - Benefit record viewing
   - Eligibility status checking
   - Processing history review
   - Document submission for claims

5. **Training Management**
   - Available training programs
   - Enrollment in training courses
   - Training history and certificates
   - Completion status tracking

## Data Flow Architecture

### Request Flow
```
Frontend Request → API Gateway → Authentication → Authorization → Controller → Model → Database
                                                                                    ↓
Frontend Response ← JSON Response ← Business Logic ← Data Processing ← Query Result
```

### Security Flow
```
User Login → Credential Validation → Session Creation → Role Assignment → Route Protection → Feature Access
```

### Audit Flow
```
User Action → Audit Middleware → Log Generation → Database Storage → Audit Trail → Compliance Reporting
```

## Integration Points

### Frontend-Backend Integration
- **API Services**: Centralized API client with role-based endpoints
- **Authentication**: Session-based authentication with role detection
- **Error Handling**: Consistent error response handling across all modules
- **State Management**: React Query for server state management

### Database Integration
- **Connection Pooling**: Optimized database connections
- **Transaction Management**: ACID compliance for critical operations
- **Audit Logging**: Comprehensive activity tracking
- **Data Integrity**: Foreign key constraints and validation

## Deployment Architecture

### Development Environment
- **Backend**: `npm run dev` (localhost:3000)
- **Frontend**: `npm run dev` (localhost:5173)
- **Database**: Local MySQL instance

### Intranet Deployment
- **Backend**: `npm run dev:intranet` (10.0.0.73:3000)
- **Frontend**: `npm run dev:intranet` (10.0.0.73:5173)
- **Database**: Network MySQL server

This comprehensive workflow ensures clear separation of concerns, role-based access control, and maintainable code architecture while providing a seamless user experience for both administrators and employees.
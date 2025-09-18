# Employee Management System (EMS) - System Workflow

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [User Roles and Permissions](#user-roles-and-permissions)
4. [Core Modules and Workflows](#core-modules-and-workflows)
   - [Authentication Flow](#authentication-flow)
   - [Employee Management](#employee-management)
   - [Leave Management](#leave-management)
   - [Terminal Leave Benefits (TLB)](#terminal-leave-benefits-tlb)
   - [Training Management](#training-management)
   - [Document Management](#document-management)
   - [Benefits Management](#benefits-management)
   - [Audit Logging](#audit-logging)
5. [Data Flow and Integration](#data-flow-and-integration)
6. [Security Measures](#security-measures)
7. [Technical Implementation](#technical-implementation)

## Overview

The Employee Management System (EMS) is a comprehensive Human Resource Information System (HRIS) built for internal company use. It centralizes employee records, leave management, payroll processing, benefits tracking, and comprehensive audit logging. The system is designed to streamline HR operations and provide a centralized platform for both employees and administrators.

## System Architecture

The system follows a layered architecture pattern:

```
┌─────────────────────────────────────────┐
│              Client Layer               │
│     (Web Browser / API Clients)        │
└─────────────────────────────────────────┘
                     │
┌─────────────────────────────────────────┐
│           Middleware Layer              │
│  • Authentication & Authorization       │
│  • Rate Limiting & Security            │
│  • Error Handling & Logging            │
│  • File Upload Processing              │
└─────────────────────────────────────────┘
                     │
┌─────────────────────────────────────────┐
│          Controller Layer               │
│  • Request/Response Handling           │
│  • Input Validation                    │
│  • Business Logic Coordination         │
└─────────────────────────────────────────┘
                     │
┌─────────────────────────────────────────┐
│            Model Layer                  │
│  • Data Models & Business Logic        │
│  • Database Operations                 │
│  • Data Validation                     │
└─────────────────────────────────────────┘
                     │
┌─────────────────────────────────────────┐
│           Database Layer                │
│     MySQL 8.0 with Connection Pool     │
└─────────────────────────────────────────┘
```

## User Roles and Permissions

### Admin
- Full access to all system features
- Employee CRUD operations
- Leave approval/rejection
- TLB calculation and management
- Training program management
- Document approval
- System reporting and analytics
- Audit log access

### Employee
- View and edit personal profile
- Apply for leave
- View leave balances
- Upload documents for approval
- View training records
- Access personal benefits information

## Core Modules and Workflows

### Authentication Flow

1. **Login Process**
   - User accesses login page
   - Credentials submitted via POST `/api/auth/login`
   - Backend validates credentials using bcrypt
   - Session created with user information
   - Redirect to dashboard based on role

2. **Session Management**
   - Session-based authentication with secure cookies
   - 8-hour session timeout
   - Automatic session renewal on activity
   - Rate limiting to prevent brute force attacks

3. **Authorization**
   - Role-based access control (RBAC)
   - Middleware checks user role for each request
   - Fine-grained permissions for specific actions

### Employee Management

#### Admin Workflow
1. **Employee Creation**
   - Admin navigates to Employee Management section
   - Clicks "Create New Employee"
   - Fills employee details form
   - System validates required fields
   - Employee record created in database
   - User account automatically generated

2. **Employee Updates**
   - Admin selects employee from list
   - Edits employee information
   - Changes validated and saved
   - Audit log entry created

3. **Employee Deletion**
   - Soft delete implementation
   - Employee marked as deleted but retained in system
   - Option to restore deleted employees

#### Employee Self-Service
1. **Profile Management**
   - Employee accesses profile page
   - Can update personal information
   - Contact details and address can be modified
   - Changes are validated and saved

### Leave Management

#### Leave Application Process
1. **Employee Workflow**
   - Navigate to Leave Management section
   - Select "Apply for Leave"
   - Choose leave type and dates
   - System validates leave balance and date conflicts
   - Application submitted for approval
   - Employee receives confirmation

2. **Admin Approval Workflow**
   - Admin accesses Leave Approvals section
   - Views pending leave applications
   - Reviews application details
   - Approves or rejects application
   - System updates leave balances automatically
   - Employee notified of decision

#### Leave Accrual System
1. **Monthly Accrual**
   - Automated job runs on first day of each month
   - 1.25 Vacation Leave + 1.25 Sick Leave credited
   - Accrual calculated based on employment status
   - Leave balances updated in database

2. **Leave Balance Management**
   - Real-time balance calculation
   - Automatic deduction on approval
   - Year-end carry-forward processing
   - Leave monetization options

### Terminal Leave Benefits (TLB)

#### TLB Calculation Process
1. **Data Collection**
   - System gathers employee service history
   - Calculates total leave credits earned
   - Identifies highest salary during employment
   - Compiles employment dates and status changes

2. **Computation**
   - Formula: TLB = Total Leave Credits × Highest Monthly Salary × Constant Factor
   - System performs automatic calculation
   - Results displayed for review

3. **Record Management**
   - Admin creates TLB record after computation
   - Record stored with all calculation details
   - Employee separation processed if applicable

#### Reporting
1. **TLB Summary Reports**
   - Generated for management review
   - Includes computation details and totals
   - Exportable in multiple formats

### Training Management

#### Admin Workflow
1. **Training Program Management**
   - Create and maintain training programs
   - Define program details and requirements
   - Track program usage and effectiveness

2. **Training Record Management**
   - Record employee training attendance
   - Maintain training history
   - Generate compliance reports

#### Employee Workflow
1. **Training Access**
   - View available training programs
   - Access training records
   - Download certificates

### Document Management

#### Document Upload Process
1. **Employee Upload**
   - Employee navigates to document section
   - Selects document type and uploads file
   - Document submitted for admin approval
   - System stores file and metadata

2. **Admin Review**
   - Admin reviews pending documents
   - Approves or rejects submissions
   - Approved documents become official records

### Benefits Management

#### Benefit Tracking
1. **Compensation Records**
   - Performance-Based Bonus (PBB) tracking
   - Mid-Year and Year-End Bonus records
   - GSIS Contributions monitoring
   - Allowance tracking (RATA, Clothing, Medical, etc.)

2. **Loyalty Awards**
   - Automatic calculation based on service years
   - ₱10,000 for first 10 years
   - ₱5,000 for every 5 years after

### Audit Logging

#### Comprehensive Tracking
1. **All Critical Actions Logged**
   - Employee profile updates
   - Document submissions and approvals
   - Leave applications and decisions
   - Payroll changes
   - TLB calculations and records

2. **Audit Trail Features**
   - Timestamped records
   - User identification
   - IP address tracking
   - Before/after value comparison

## Data Flow and Integration

### Database Schema Relationships
- One-to-One: User ↔ Employee
- One-to-Many: Employee → Leave Applications, Employee → Compensation Records
- Many-to-Many: Employee ↔ Training Programs (via junction table)

### API Integration Points
- RESTful endpoints for all modules
- Consistent response format across all APIs
- Pagination support for large datasets
- Search and filtering capabilities

## Security Measures

### Authentication Security
- bcrypt password hashing with 12 rounds
- Session-based authentication with secure cookies
- Rate limiting to prevent brute force attacks
- Account lockout after failed attempts

### Data Security
- SQL injection prevention through parameterized queries
- XSS protection through input sanitization
- CORS configuration for controlled access
- File upload validation and sanitization

### Network Security
- Helmet.js for security headers
- Compression for performance
- Request ID tracking for debugging
- Secure session configuration

## Technical Implementation

### Backend Stack
- Node.js with Express.js framework
- MySQL 8.0 database
- Express-session for session management
- Express-fileupload for file handling
- Express-validator for input validation

### Frontend Stack
- React with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Lucide React for icons
- Shadcn/ui components

### Development Practices
- Comprehensive error handling
- Standardized API response format
- Middleware for cross-cutting concerns
- Automated testing capabilities
- Environment-based configuration

### Performance Optimization
- Database connection pooling
- Query optimization
- Response compression
- Caching strategies (planned)
- Pagination for large datasets

### Deployment Considerations
- Intranet-only deployment
- Environment-specific configurations
- Health check endpoints
- Graceful shutdown procedures
- Logging and monitoring
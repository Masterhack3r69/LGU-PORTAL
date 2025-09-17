# Payroll and Compensation & Benefits System Workflow

## Overview

This document outlines the restructured Employee Management System (EMS) workflow that separates automated payroll processing from manual compensation & benefits selection. The system is designed to provide clear separation of concerns while maintaining data integrity and user-friendly interfaces.

## System Architecture

### Core Components
- **Automated Payroll System**: Handles salary calculations, leave deductions, and payroll generation
- **Manual Compensation & Benefits System**: Manages benefit selections, allowances, and compensation packages
- **Unified Authentication**: Role-based access control with admin and employee permissions
- **Database Integration**: MySQL backend with proper transaction handling

### Key Features
- Separation of automated vs manual processes
- Role-based access control (Admin/Employee)
- Real-time validation and error handling
- Comprehensive audit trail
- Rate limiting and security measures

## Workflow Diagrams

### 1. Automated Payroll Processing Workflow

```
[Admin Login] 
    ↓
[Select Pay Period] 
    ↓
[Generate Automated Payroll] 
    ↓
[System Calculates]:
    • Base Salary
    • Leave Deductions
    • Overtime (if applicable)
    ↓
[Review Generated Payroll]
    ↓
[Approve & Finalize]
    ↓
[Payroll Complete]
```

### 2. Manual Compensation & Benefits Selection Workflow

```
[Employee Login]
    ↓
[Access Benefits Portal]
    ↓
[View Available Benefits]:
    • Health Insurance
    • Dental Coverage
    • Life Insurance
    • Retirement Plans
    • Other Benefits
    ↓
[Make Selections via Checkbox Interface]
    ↓
[Submit Selections]
    ↓
[Admin Review & Approval]
    ↓
[Benefits Activated]
```

## API Endpoints

### Payroll System Endpoints

#### 1. Generate Automated Payroll
- **URL**: `POST /api/payroll/generate`
- **Authentication**: Admin Required
- **Purpose**: Automatically generate payroll for a specific period
- **Parameters**:
  ```json
  {
    "period_id": "number",
    "employee_ids": "array (optional)"
  }
  ```
- **Response**: Payroll generation status and details

#### 2. Get Payroll Computation
- **URL**: `GET /api/payroll/computation/:period_id`
- **Authentication**: Admin Required
- **Purpose**: Retrieve payroll calculations for review
- **Response**: Detailed payroll breakdown

#### 3. Approve Payroll Period
- **URL**: `POST /api/payroll/approve`
- **Authentication**: Admin Required
- **Purpose**: Finalize and approve payroll for payment
- **Parameters**:
  ```json
  {
    "period_id": "number"
  }
  ```

### Compensation & Benefits Endpoints

#### 1. Submit Benefit Selections
- **URL**: `POST /api/compensation-benefits/submit-selections`
- **Authentication**: Employee/Admin Required
- **Purpose**: Submit employee benefit choices
- **Parameters**:
  ```json
  {
    "employee_id": "number",
    "year": "number",
    "selections": [
      {
        "benefit_id": "number",
        "selected": "boolean"
      }
    ]
  }
  ```

#### 2. Get Available Benefits
- **URL**: `GET /api/compensation-benefits/benefits`
- **Authentication**: Authenticated User Required
- **Purpose**: Retrieve list of available benefits

#### 3. Get Employee Benefit History
- **URL**: `GET /api/compensation-benefits/employee/:employee_id/history`
- **Authentication**: Employee/Admin Required
- **Purpose**: View benefit selection history

## User Workflows

### Admin Workflow

#### Monthly Payroll Processing
1. **Login**: Access system with admin credentials
2. **Navigate to Payroll**: Go to Payroll System dashboard
3. **Select Period**: Choose the payroll period to process
4. **Generate Payroll**: Click "Generate Automated Payroll"
   - System automatically calculates salaries
   - Applies leave deductions
   - Processes overtime if applicable
5. **Review Results**: Examine generated payroll data
6. **Make Adjustments**: Modify any entries if needed
7. **Approve Payroll**: Finalize the payroll for payment
8. **Generate Reports**: Export payroll reports for accounting

#### Benefit Administration
1. **Access Benefits Portal**: Navigate to Compensation & Benefits
2. **Manage Benefit Plans**: Add/modify available benefits
3. **Review Employee Selections**: Monitor benefit choices
4. **Approve Selections**: Confirm employee benefit elections
5. **Generate Benefit Reports**: Export benefit enrollment data

### Employee Workflow

#### Annual Benefit Selection
1. **Login**: Access system with employee credentials
2. **Navigate to Benefits**: Go to Benefits Selection portal
3. **Review Options**: Examine available benefit plans
4. **Make Selections**: Use checkbox interface to choose benefits
   - Health Insurance options
   - Dental and vision coverage
   - Life insurance plans
   - Retirement contributions
   - Flexible spending accounts
5. **Review Summary**: Confirm selections before submission
6. **Submit Choices**: Finalize benefit elections
7. **Print Confirmation**: Save confirmation for records

#### Payroll Information Access
1. **View Pay Stubs**: Access current and historical pay information
2. **Review Deductions**: See breakdown of salary deductions
3. **Check Benefit Deductions**: Monitor benefit-related costs
4. **Download Documents**: Save payroll documents as needed

## Technical Implementation

### Database Schema

#### Key Tables
- `pay_periods`: Manages payroll periods and status
- `payroll_items`: Stores individual payroll calculations
- `employee_benefit_selections`: Records benefit choices
- `benefits`: Master list of available benefits
- `employees`: Employee master data

#### Data Flow
1. **Payroll Generation**: 
   - Queries employee data from `employees` table
   - Calculates salaries based on employment terms
   - Applies leave deductions from attendance records
   - Stores results in `payroll_items` table

2. **Benefit Selection**:
   - Employees select benefits via web interface
   - Selections stored in `employee_benefit_selections`
   - Admin approval updates selection status
   - Integration with payroll for benefit deductions

### Security Features

#### Authentication & Authorization
- Session-based authentication with secure tokens
- Role-based access control (Admin/Employee)
- Route protection middleware
- Input validation and sanitization

#### Rate Limiting
- API endpoint rate limiting to prevent abuse
- Configurable limits based on user role
- Graceful error handling for limit exceeded

#### Data Protection
- Encrypted password storage
- SQL injection prevention
- XSS protection
- CORS configuration for secure API access

## System Monitoring

### Performance Metrics
- API response times
- Database query performance
- User session management
- Error rate monitoring

### Audit Trail
- User action logging
- Payroll generation history
- Benefit selection changes
- Administrative actions

### Error Handling
- Comprehensive error logging
- User-friendly error messages
- Fallback mechanisms for system failures
- Automated error notifications

## Deployment Information

### Server Configuration
- **Environment**: Intranet deployment
- **Server IP**: 10.0.0.73:3000
- **Connection**: Ethernet-based internal network
- **Database**: MySQL backend
- **Frontend**: React-based user interface

### Access Information
- **Admin Account**: username: deckson, password: admin123
- **Employee Access**: Individual employee credentials
- **Network Access**: Internal company network only

## Testing & Validation

### Automated Testing
- Comprehensive API endpoint testing
- Database integrity validation
- User authentication testing
- Error scenario simulation

### Test Results
- **System Functionality**: 100% operational
- **API Endpoints**: All critical endpoints verified
- **Performance**: Optimized for rapid processing
- **Security**: Rate limiting and access controls active

### Continuous Monitoring
- Regular system health checks
- Performance baseline monitoring
- Security vulnerability scanning
- User feedback collection

## Support & Maintenance

### Regular Maintenance Tasks
- Database backup and optimization
- Security patch updates
- Performance monitoring and tuning
- User access review and cleanup

### Troubleshooting Guide
- Common error scenarios and solutions
- Database connection issues
- Authentication problems
- Performance degradation handling

### Contact Information
- **System Administrator**: [Admin Contact]
- **Technical Support**: [Support Contact]
- **Emergency Contact**: [Emergency Contact]


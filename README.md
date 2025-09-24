# Employee Management System (EMS)

A comprehensive Human Resource Information System (HRIS) designed for internal company use, featuring employee management, leave tracking, payroll processing, and benefits administration.

## 🚀 Quick Start

### Prerequisites
- Node.js (>=16.0.0)
- MySQL 8.0+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd employee-management-system
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend && npm install
   
   # Install frontend dependencies
   cd ../frontend && npm install
   ```

3. **Configure environment**
   ```bash
   # Copy environment files
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   
   # Edit configuration files with your settings
   ```

4. **Setup database**
   ```bash
   cd backend
   npm run setup    # Initialize database schema
   npm run seed     # Add sample data (optional)
   ```

5. **Start the application**
   ```bash
   # Start backend (from backend directory)
   npm run dev
   
   # Start frontend (from frontend directory)
   npm run dev
   ```

## 🏗️ Architecture

### Backend (Node.js/Express)
- **Framework**: Express.js 4.18.2
- **Database**: MySQL 8.0+ with connection pooling
- **Authentication**: Session-based with bcrypt
- **API**: RESTful endpoints with comprehensive validation

### Frontend (React/TypeScript)
- **Framework**: React 19.1.1 with TypeScript
- **Build Tool**: Vite 7.1.2 with SWC
- **UI Library**: Radix UI with shadcn/ui components
- **Styling**: Tailwind CSS 4.1.13
- **Type Safety**: Comprehensive TypeScript definitions for all modules
- **Benefits UI**: Specialized components for compensation and benefits management

## 📋 Features

### Core Modules
- **Employee Management**: Complete employee lifecycle management
- **Employee Import**: Excel/CSV bulk import with validation and user account creation
- **Leave Management**: Applications, approvals, balance tracking
- **Payroll Processing**: Salary calculations, deductions, payslips
- **Compensation & Benefits**: Terminal leave, bonuses, GSIS, loyalty awards
- **Document Management**: Upload, approval, compliance tracking
- **Training Management**: Programs, enrollment, certification
- **Audit & Compliance**: Comprehensive audit trails
- **Reporting & Analytics**: Statistics, trends, and insights

### User Roles
- **Admin**: Full system access and management capabilities
- **Employee**: Self-service access to personal information and requests

## 🧪 Testing

### Backend Testing

#### Unit Tests
```bash
# Run all unit tests
cd backend && npm test

# Run with coverage
npm run test:coverage

# Run specific module tests
npm test -- --grep "Compensation"
```

#### API Integration Tests
```bash
# Test Compensation & Benefits API endpoints
cd backend && node test-compensation-api.js

# Test Employee Import API functionality
cd backend && node test-import-api.js

# Expected output includes:
# ✅ Server health check
# ✅ Route registration verification
# ✅ Authentication middleware validation
# ✅ Model validation testing
# ✅ Service calculations verification
# ✅ Import functionality validation
# ✅ Column mapping verification
# ✅ File upload system testing
```

#### Full Workflow Testing
```bash
# Run comprehensive end-to-end workflow test
cd backend && node test-full-workflow.js

# Expected output includes:
# ✅ Test data setup (employees, users, leave balances)
# ✅ All benefit calculations (PBB, TLB, Monetization, etc.)
# ✅ Database operations (create, read, update)
# ✅ Statistics generation with proper property access
# ✅ Bulk processing operations
# ✅ Foreign key relationship validation
```

### Frontend Testing
```bash
cd frontend && npm test
```

## 🚀 Deployment

### Development Environment
```bash
# Backend (runs on port 3000)
cd backend && npm run dev

# Frontend (runs on port 5173)
cd frontend && npm run dev
```

### Intranet Deployment
```bash
# Backend (binds to 10.0.0.73:3000)
cd backend && npm run dev:intranet

# Frontend (binds to 10.0.0.73:5173)
cd frontend && npm run dev:intranet
```

### Production Build
```bash
# Build frontend
cd frontend && npm run build

# Start backend in production
cd backend && npm start
```

## 📁 Project Structure

```
employee-management-system/
├── backend/                    # Node.js/Express API server
│   ├── config/                # Database and app configuration
│   ├── controllers/           # Request/response handling
│   │   └── importController.js # Excel/CSV import functionality
│   ├── middleware/            # Authentication, validation, logging
│   ├── models/                # Data models and business logic
│   ├── routes/                # API endpoint definitions
│   │   └── importRoutes.js    # Import API endpoints
│   ├── services/              # Business logic services
│   ├── tests/                 # Unit test suites
│   ├── docs/                  # API documentation
│   ├── uploads/temp/          # Temporary file storage for imports
│   ├── test-compensation-api.js # API integration tests
│   └── server.js              # Main application entry point
├── frontend/                  # React/TypeScript client
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   └── admin/         # Admin-specific components
│   │   │       ├── ExcelImport.tsx    # Main import interface
│   │   │       ├── ImportPreview.tsx  # Import data preview
│   │   │       └── ImportResults.tsx  # Import results display
│   │   ├── pages/             # Route-level components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API service layer
│   │   │   └── importService.ts # Import API integration
│   │   └── types/             # TypeScript definitions
│   │       ├── compensation.ts # Compensation & Benefits types
│   │       └── import.ts      # Import functionality types
│   └── dist/                  # Build output
└── README.md                  # This file
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=employee_management_system

# Security
SESSION_SECRET=your-secure-session-secret
BCRYPT_ROUNDS=12

# Application
PORT=3000
NODE_ENV=development
```

#### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Employee Management System
```

## 📚 Documentation

- **API Documentation**: `backend/docs/`
- **Employee Import API**: `backend/docs/EMPLOYEE_IMPORT_API.md`
- **Compensation & Benefits API**: `backend/docs/COMPENSATION_BENEFITS_API.md`
- **Module Documentation**: `backend/docs/COMPENSATION_BENEFITS_MODULE.md`
- **Frontend Components**: `backend/docs/FRONTEND_COMPONENTS.md`
- **Test Documentation**: `backend/tests/README.md`

## 🛠️ Development

### Available Scripts

#### Backend
```bash
npm run dev              # Start with nodemon
npm run dev:intranet     # Start for intranet deployment
npm start                # Production start
npm run setup            # Initialize database
npm run seed             # Seed sample data
npm test                 # Run unit tests
npm run test:coverage    # Run tests with coverage

# Import functionality testing
curl -X GET http://localhost:3000/api/import/employees/template  # Download template
curl -X POST http://localhost:3000/api/import/employees/preview  # Preview import
curl -X POST http://localhost:3000/api/import/employees/execute  # Execute import
```

#### Frontend
```bash
npm run dev              # Start Vite dev server
npm run dev:intranet     # Start on intranet IP
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # ESLint validation
```

## 🔒 Security Features

- **Authentication**: Session-based with secure cookies
- **Authorization**: Role-based access control (Admin/Employee)
- **Password Security**: bcrypt hashing with 12 salt rounds
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive validation on all endpoints
- **SQL Injection Prevention**: Prepared statements and parameterized queries
- **File Upload Security**: Type validation and secure storage
- **Audit Logging**: Complete audit trail for compliance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- **Code Style**: Follow existing conventions with consistent formatting
- **Syntax Standards**: Use trailing commas, double quotes, and proper indentation (as applied in BulkProcessingPanel)
- **Formatting Consistency**: Apply uniform code formatting across all TypeScript/React components
- **Import Organization**: Use trailing commas in import statements for better maintainability
- **Testing**: Write comprehensive tests for all new features
- **Documentation**: Update relevant docs for API or architectural changes
- **Quality Assurance**: Ensure all tests pass before submitting PRs
- **Commit Messages**: Use clear, descriptive commit messages
- **Code Consistency**: Maintain readable and well-structured code across all files
- **Backward Compatibility**: Preserve existing functionality when making improvements

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For technical support or questions:
- Check the documentation in `backend/docs/`
- Review the test suites for usage examples
- Run the API integration tests to verify setup:
  ```bash
  cd backend && node test-import-api.js
  cd backend && node test-compensation-api.js
  cd backend && node test-full-workflow.js
  ```
- Contact the development team

### Quick Import Test
To verify the import system is working:
```bash
# Test import API functionality
cd backend && node test-import-api.js

# Expected output:
# ✅ Route registration verified
# ✅ Column mapping configuration updated
# ✅ Password strategies configured
# ✅ File upload system ready
# ✅ Dependencies available
# 📋 Import API Status: READY FOR USE
```

## 📥 Employee Import System

### Overview
The Employee Import System provides comprehensive Excel/CSV bulk import functionality for efficiently onboarding multiple employees with automated validation, user account creation, and leave balance initialization.

### Key Features
- **Excel/CSV Support**: Import from .xlsx, .xls, and .csv files
- **Intelligent Column Mapping**: Automatic detection and mapping of Excel columns to database fields
- **Data Validation**: Comprehensive validation with detailed error reporting
- **Preview Mode**: Validate and preview data before actual import
- **User Account Creation**: Automatic user account generation with configurable password strategies
- **Leave Balance Initialization**: Automatic setup of yearly leave balances
- **Duplicate Detection**: Prevents duplicate employee numbers and email addresses
- **Error Handling**: Skip invalid rows or halt on errors (configurable)
- **Audit Trail**: Complete logging of all import operations

### API Endpoints

#### Download Import Template
```bash
GET /api/import/employees/template
```
Downloads an Excel template with sample data and detailed instructions.

#### Preview Import
```bash
POST /api/import/employees/preview
Content-Type: multipart/form-data
Body: excel_file (file)
```
Validates and previews the import data without making changes.

#### Execute Import
```bash
POST /api/import/employees/execute
Content-Type: multipart/form-data
Body: 
  - excel_file (file)
  - password_strategy (string): employee_number|birth_date|random|custom_pattern
  - create_user_accounts (boolean): true|false
  - skip_invalid_rows (boolean): true|false
  - initialize_leave_balances (boolean): true|false
```

### Supported Fields

#### Required Fields
- `employee_number`: Unique employee identifier
- `first_name`: Employee's first name
- `last_name`: Employee's last name
- `sex`: Male/Female (or M/F)
- `birth_date`: Date in YYYY-MM-DD format or Excel date
- `appointment_date`: Date in YYYY-MM-DD format or Excel date

#### Optional Fields
- `middle_name`, `suffix`: Name components
- `birth_place`, `civil_status`: Personal information
- `contact_number`, `email_address`: Contact details
- `current_address`, `permanent_address`: Address information
- `tin`, `gsis_number`, `pagibig_number`, `philhealth_number`, `sss_number`: Government IDs
- `plantilla_position`, `plantilla_number`: Position details
- `salary_grade`, `step_increment`: Salary information
- `current_monthly_salary`, `current_daily_rate`: Compensation
- `employment_status`: Active, Resigned, Retired, Terminated

### Password Generation Strategies

1. **Employee Number**: Uses employee number as password
2. **Birth Date**: Uses birth date (DDMMYYYY) as password
3. **Random**: Generates secure random passwords
4. **Custom Pattern** (Default): Employee number + birth day/month (DDMM)

### Column Mapping Intelligence

The system automatically maps Excel columns to database fields using flexible matching:

```javascript
// Example mappings
'employee_number': ['employee_number', 'emp_no', 'employee no', 'empno']
'first_name': ['first_name', 'firstname', 'first name', 'fname']
'plantilla_number': ['plantilla_number', 'plantillanumber', 'plantilla number']
// ... and many more variations
```

### Usage Example

```bash
# 1. Download template
curl -X GET http://localhost:3000/api/import/employees/template \
  -H "Authorization: Bearer <admin-token>" \
  -o employee_template.xlsx

# 2. Preview import
curl -X POST http://localhost:3000/api/import/employees/preview \
  -H "Authorization: Bearer <admin-token>" \
  -F "excel_file=@employees.xlsx"

# 3. Execute import
curl -X POST http://localhost:3000/api/import/employees/execute \
  -H "Authorization: Bearer <admin-token>" \
  -F "excel_file=@employees.xlsx" \
  -F "password_strategy=custom_pattern" \
  -F "create_user_accounts=true" \
  -F "skip_invalid_rows=true" \
  -F "initialize_leave_balances=true"
```

### Response Format

```json
{
  "success": true,
  "data": {
    "total": 100,
    "successful": 95,
    "failed": 3,
    "skipped": 2,
    "createdEmployees": [...],
    "userAccounts": [...],
    "passwordReport": {
      "strategy_used": "custom_pattern",
      "total_accounts": 95,
      "accounts": [...],
      "instructions": "Password generation instructions",
      "security_recommendations": [...]
    },
    "summary": {
      "total_processed": 100,
      "successful_imports": 95,
      "failed_imports": 3,
      "skipped_rows": 2,
      "user_accounts_created": 95,
      "success_rate": "95.00%"
    }
  }
}
```

### Security Features
- **Admin-only Access**: All import operations require admin authentication
- **File Type Validation**: Only Excel and CSV files accepted
- **Data Sanitization**: All input data is validated and sanitized
- **Password Security**: Configurable password generation with security recommendations
- **Audit Logging**: Complete audit trail of all import operations

## 🔄 Recent Updates

### Employee Import System Enhancement (Latest)
- **Column Mapping Fix**: Fixed `plantilla_number` field mapping to include additional variations (`plantillanumber`, `plantilla number`)
- **Syntax Error Resolution**: Fixed incomplete column mapping definition that was causing import failures
- **Export Enhancement**: Added `COLUMN_MAPPING` to module exports for better testability
- **Test Coverage**: Added comprehensive `test-import-api.js` for validating import functionality
- **Frontend Components**: Enhanced React components for Excel import with proper TypeScript definitions
- **Type Safety**: Fixed TypeScript enum issues and improved type definitions for import functionality
- **UI Components**: Complete frontend implementation with drag-and-drop file upload, preview, and results display
- **Improved Field Recognition**: Enhanced automatic column detection for plantilla-related fields
- **Template Consistency**: Updated Excel template generation to match improved field mappings
- **Validation Enhancement**: Better handling of plantilla position and number fields during import validation

### Statistics API Enhancement
- **Improved Statistics Response**: Enhanced `/api/compensation-benefits/statistics` endpoint with total records and amounts
- **Better Data Structure**: Renamed response fields for clarity (`by_benefit_type`, `monthly_summary`, `top_employees`)
- **Total Calculations**: Added automatic calculation of total records and total amount across all benefits
- **Numeric Calculation Fix**: Added `parseFloat()` to ensure accurate total amount calculations in statistics
- **Top Employees Ranking**: Enhanced employee ranking with benefit count and total amounts
- **Frontend Type Updates**: Updated TypeScript interfaces to match new API response structure
- **Documentation Updates**: Comprehensive documentation updates across all relevant files

### MonetizationPanel Component
- **New Frontend Component**: Added comprehensive MonetizationPanel for leave monetization processing
- **Real-time Calculations**: Dynamic calculation of monetization amounts based on employee daily rates
- **Leave Balance Integration**: Displays and validates against available leave balances
- **Form Validation**: Comprehensive validation with user-friendly error messages
- **UI/UX Enhancement**: Professional interface with cards, alerts, and progress indicators
- **Type Safety**: Full TypeScript integration with proper type definitions

### Frontend TypeScript Integration
- **Type Definitions**: Added comprehensive TypeScript types for Compensation & Benefits module
- **Frontend Integration**: Complete type safety for React components and API integration
- **Type Coverage**: All benefit types, calculations, and API responses fully typed
- **Developer Experience**: Enhanced IntelliSense and compile-time validation

### Code Quality Improvements
- **Enhanced Code Formatting**: Applied consistent formatting standards across all test files and components
- **BulkProcessingPanel Formatting**: Standardized code style with double quotes, proper indentation, and trailing commas
- **BenefitStatisticsCards Enhancement**: Fixed TypeScript type issues and applied consistent formatting with double quotes
- **Optional Chaining Implementation**: Added safe property access (`?.`) to prevent runtime errors when accessing nested object properties
- **DocumentUpload Formatting**: Applied comprehensive code formatting improvements for consistency
- **Import Statement Fixes**: Resolved syntax errors in component import statements for proper compilation
- **Improved Syntax**: Added trailing commas and standardized quote usage for better maintainability
- **Code Consistency**: Unified indentation and formatting patterns throughout the codebase
- **Type Safety Improvements**: Resolved month comparison type issues in statistics components
- **Defensive Programming**: Enhanced null-safe property access patterns throughout React components
- **Maintained Functionality**: All improvements preserve existing functionality while enhancing readability
- **Component Documentation**: Updated frontend component documentation to reflect current code standards

### Testing Infrastructure
- **Comprehensive API Testing**: Full endpoint validation with `test-compensation-api.js`
- **Workflow Testing**: Complete system testing with `test-full-workflow.js` including statistics property fixes
- **Database Verification**: Automated setup validation with `verify-database.js`
- **Unit Test Coverage**: Extensive Jest test suites for all modules
- **Integration Testing**: End-to-end workflow validation with enhanced error handling
- **Statistics Validation**: Fixed property name consistency (`by_benefit_type`, `monthly_summary`, `top_employees`)
- **Debug Logging**: Enhanced test output with detailed statistics data for troubleshooting

### Compensation & Benefits Module
- **Complete Implementation**: All 8 benefit types fully supported
- **Bulk Processing**: Multi-employee operations with transaction safety
- **Advanced Calculations**: Automated formulas for all benefit types
- **Audit Compliance**: Complete transaction logging and user tracking
- **API Integration**: RESTful endpoints with comprehensive validation
- **Frontend Types**: Full TypeScript support for type-safe development
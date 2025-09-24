# Project Structure & Organization

## Root Directory Layout

```
employee-management-system/
├── backend/                 # Node.js/Express API server
├── frontend/               # React/TypeScript client application
├── node_modules/           # Root-level shared dependencies
├── package.json           # Root package configuration
└── *.md                   # Documentation files
```

## Backend Structure (`/backend`)

### Core Architecture
```
backend/
├── config/
│   └── database.js         # MySQL connection pool & utilities
├── controllers/            # Request/response handling
│   ├── employeeController.js
│   └── authController.js
├── middleware/             # Cross-cutting concerns
│   ├── auth.js            # Authentication & authorization
│   ├── audit.js           # Audit logging
│   └── errorHandler.js    # Global error handling
├── models/                 # Data models & business logic
│   ├── Employee.js        # Employee data model
│   └── CompensationBenefit.js # Compensation & benefits model
├── routes/                 # API endpoint definitions
│   ├── authRoutes.js      # Authentication endpoints
│   ├── employeeRoutes.js  # Employee CRUD operations
│   ├── leaveRoutes.js     # Leave management
│   ├── payrollRoutes.js   # Payroll processing
│   ├── compensationRoutes.js # Compensation & benefits management
│   ├── documentRoutes.js  # Document management
│   ├── trainingRoutes.js  # Training management
│   └── reportsRoutes.js   # Reporting & analytics
├── jobs/                   # Scheduled background jobs
├── scripts/                # Database setup & utilities
│   ├── setup.js           # Database initialization
│   ├── seed.js            # Sample data seeding
│   └── database_schema.sql # Complete schema
├── services/               # Business logic services
├── utils/                  # Helper functions & utilities
├── uploads/                # File storage
│   ├── employees/         # Employee documents
│   └── temp/              # Temporary files
├── logs/                   # Application logs
└── server.js              # Main application entry point
```

## Frontend Structure (`/frontend`)

### React Application Layout
```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   └── ui/           # shadcn/ui components
│   ├── pages/            # Route-level components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   ├── services/         # API service layer
│   └── types/            # TypeScript type definitions
├── public/               # Static assets
├── dist/                 # Build output
├── node_modules/         # Frontend dependencies
├── package.json          # Frontend package configuration
├── vite.config.ts        # Vite build configuration
├── tsconfig.json         # TypeScript configuration
├── components.json       # shadcn/ui configuration
└── index.html           # Entry HTML file
```

## Configuration Files

### Backend Configuration
- `.env` - Environment variables (database, security settings)
- `package.json` - Dependencies and npm scripts
- `server.js` - Express app configuration and middleware setup

### Frontend Configuration  
- `vite.config.ts` - Vite build tool configuration with path aliases
- `tsconfig.json` - TypeScript compiler settings
- `components.json` - shadcn/ui component library configuration
- `eslint.config.js` - Code linting rules

## API Route Organization

### RESTful Endpoint Structure
```
/api/auth/*              # Authentication (login, logout, session)
/api/employees/*         # Employee CRUD operations
/api/employees/:id/leave-balances  # Employee-specific resources
/api/leave/*             # Leave management
/api/payroll/*           # Payroll processing
/api/compensation/*      # Compensation & benefits management
/api/documents/*         # Document management
/api/training/*          # Training programs
/api/reports/*           # Analytics and reporting
```

## Database Schema Organization

### Core Tables
- `users` - Authentication and user accounts
- `employees` - Employee master data
- `leave_applications` - Leave requests and approvals
- `leave_balances` - Employee leave entitlements
- `payroll_periods` - Payroll processing cycles
- `payroll_items` - Individual employee payroll records
- `comp_benefit_records` - Compensation and benefits processing history
- `training_programs` - Training course definitions
- `training_records` - Employee training participation
- `audit_logs` - System activity tracking

## File Storage Organization

```
uploads/
├── employees/
│   ├── {employee_id}/
│   │   ├── profile_photos/
│   │   ├── documents/
│   │   └── certificates/
└── temp/                # Temporary upload processing
```

## Naming Conventions

### Backend (JavaScript)
- **Files**: camelCase (e.g., `employeeController.js`)
- **Functions**: camelCase (e.g., `getEmployeeById`)
- **Classes**: PascalCase (e.g., `Employee`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_LOGIN_ATTEMPTS`)
- **Database**: snake_case (e.g., `employee_number`, `created_at`)

### Frontend (TypeScript/React)
- **Components**: PascalCase (e.g., `EmployeeList.tsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useEmployeeData`)
- **Types/Interfaces**: PascalCase (e.g., `Employee`, `ApiResponse`)
- **Files**: kebab-case for pages, PascalCase for components

## Development Workflow

### Local Development Setup
1. **Backend**: `cd backend && npm run dev` (runs on port 3000)
2. **Frontend**: `cd frontend && npm run dev` (runs on port 5173)
3. **Database**: MySQL server running locally

### Intranet Deployment
1. **Backend**: `npm run dev:intranet` (binds to 10.0.0.73:3000)
2. **Frontend**: `npm run dev:intranet` (binds to 10.0.0.73:5173)

## Code Organization Principles

### Separation of Concerns
- **Controllers**: Handle HTTP requests, delegate to models
- **Models**: Contain business logic and data validation  
- **Middleware**: Cross-cutting concerns (auth, logging, validation)
- **Services**: Complex business operations
- **Utils**: Pure functions and helper utilities

### Error Handling Strategy
- Global error handler middleware catches all unhandled errors
- Consistent error response format across all endpoints
- Comprehensive audit logging for debugging and compliance
- Input validation at controller level using express-validator

### Security Architecture
- Role-based access control (Admin vs Employee)
- Session-based authentication with secure cookies
- Rate limiting on authentication endpoints
- Input sanitization and SQL injection prevention
- File upload validation and secure storage
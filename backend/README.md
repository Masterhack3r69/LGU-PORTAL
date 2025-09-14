# Employee Management System (HRIS)

A comprehensive Employee Management System designed for internal company use, built with Node.js, Express, and MySQL.

## Features

- **Employee Records Management** - Complete employee profiles and document management
- **Leave Management** - Leave applications, approvals, and balance tracking
- **Payroll Management** - Salary computation and payroll history
- **Terminal Leave Benefits (TLB)** - Automated TLB calculations and management
- **Compensation & Benefits** - Bonuses, allowances, and benefits tracking
- **Learning & Development** - Training records and certifications
- **Service Records** - Employment history and position tracking
- **Audit Logs** - Complete activity tracking for accountability

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MySQL 8
- **Authentication**: Session-based with bcrypt password hashing
- **File Storage**: Local file system with database path references
- **Security**: Role-based access control (RBAC)

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd EMS
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Database Setup**
   ```bash
   npm run setup
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## Project Structure

```
EMS/
├── config/           # Configuration files
├── controllers/      # Route controllers
├── middleware/       # Express middleware
├── models/          # Database models
├── routes/          # API routes
├── scripts/         # Setup and utility scripts
├── uploads/         # File storage
├── utils/           # Utility functions
└── server.js        # Main application entry
```

## User Roles

### Admin
- Manage all employee records
- Approve/reject documents and leave requests
- Process payroll and benefits
- View audit logs

### Employee
- View personal information
- Edit basic contact details
- Submit documents for approval
- Apply for leave

## API Documentation

The system provides RESTful APIs for all operations:

- `/api/auth` - Authentication endpoints
- `/api/employees` - Employee management
- `/api/leaves` - Leave management
- `/api/payroll` - Payroll operations
- `/api/documents` - Document management

## Security Features

- Secure session management
- Password encryption with bcrypt
- Role-based access control
- Request rate limiting
- File upload validation
- SQL injection prevention

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Database setup
npm run setup

# Seed sample data
npm run seed
```

## License

MIT License - Internal company use only.
# Employee Management System (EMS)

A comprehensive **Intranet-based** Human Resource Information System (HRIS) built with Node.js, Express, React, and MySQL. Designed specifically for internal company networks, this system provides complete employee lifecycle management, leave tracking, payroll processing, benefits administration, and comprehensive audit logging within a secure corporate environment.

## 🌐 Intranet Application Features

### Designed for Corporate Networks
- **Internal Network Deployment**: Optimized for company intranet environments
- **Secure Corporate Access**: No external internet exposure required
- **Local Network Performance**: Fast access within corporate infrastructure
- **Centralized HR Management**: Single source of truth for all employee data
- **Offline-Capable**: Works within isolated corporate networks

### Core Modules
- **Employee Management**: Complete CRUD operations, profile management, document handling
- **Leave Management**: Applications, approvals, balance tracking, automated accruals
- **Payroll Processing**: Salary calculations, deductions, allowances, payslip generation
- **Compensation & Benefits**: Terminal leave, monetization, bonuses, GSIS, loyalty awards
- **Training Management**: Program management, enrollment, completion tracking
- **Document Management**: Upload, approval workflow, compliance tracking
- **Audit & Compliance**: Comprehensive activity logging and reporting
- **User Management**: Role-based access control (Admin/Employee)

### Key Capabilities
- **Role-Based Access**: Separate interfaces for administrators and employees
- **Real-Time Processing**: Live payroll calculations and leave balance updates
- **Comprehensive Reporting**: Dashboard analytics and exportable reports
- **File Management**: Secure document upload and storage
- **Audit Trail**: Complete activity logging for compliance
- **Responsive Design**: Modern UI with mobile-friendly interface

## 🏗️ Architecture

### Technology Stack

#### Backend
- **Runtime**: Node.js 16+
- **Framework**: Express.js 4.18.2
- **Database**: MySQL 8.0+ with connection pooling
- **Authentication**: Session-based with bcrypt
- **Security**: Helmet, CORS, rate limiting
- **File Handling**: Multer, Express-fileupload
- **Validation**: Express-validator
- **Testing**: Jest, Supertest

#### Frontend
- **Framework**: React 19.1.1 with TypeScript
- **Build Tool**: Vite 7.1.2 with SWC
- **UI Library**: Radix UI with shadcn/ui components
- **Styling**: Tailwind CSS 4.1.13
- **State Management**: TanStack React Query 5.87.4
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router DOM 7.9.1
- **HTTP Client**: Axios 1.12.1
- **Testing**: Vitest, Testing Library, Playwright

#### Database
- **Primary**: MySQL 8.0+
- **Features**: Connection pooling, prepared statements, transactions
- **Optimization**: Strategic indexing, query optimization
- **Backup**: Automated backup system with retention policies

## 📋 Prerequisites

- **Node.js**: Version 16.0.0 or higher
- **MySQL**: Version 8.0 or higher
- **npm**: Node package manager
- **Git**: Version control system

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd employee-management-system
```

### 2. Database Setup
```bash
# Connect to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE employee_management_system;
CREATE USER 'ems_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON employee_management_system.* TO 'ems_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Initialize database
npm run setup

# Seed sample data (optional)
npm run seed

# Start development server
npm run dev
```

### 4. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 5. Access Application

#### Local Development
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api

#### Intranet Deployment
- **Frontend**: http://10.0.0.73:5173 (or your intranet IP)
- **Backend API**: http://10.0.0.73:3000/api
- **Default Admin**: username: `admin`, password: `admin123`

## 📖 Documentation

### Comprehensive Guides
- **[Intranet Setup Guide](docs/INTRANET_SETUP.md)**: Quick intranet deployment for corporate networks
- **[System Workflow](docs/SYSTEM_WORKFLOW.md)**: Complete system architecture and workflows
- **[Technical Specification](docs/TECHNICAL_SPECIFICATION.md)**: Detailed technical implementation
- **[API Documentation](docs/API_DOCUMENTATION.md)**: Complete API reference
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)**: Production deployment instructions
- **[Testing Guide](docs/TESTING_GUIDE.md)**: Testing strategies and implementation

### Quick References
- **Database Schema**: See `backend/scripts/database_schema.sql`
- **Environment Variables**: See `backend/.env.example`
- **API Endpoints**: See API_DOCUMENTATION.md
- **Component Library**: Built with shadcn/ui and Radix UI

## 🔧 Development

### Backend Development
```bash
cd backend

# Development with auto-reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Database operations
npm run setup      # Initialize schema
npm run seed       # Add sample data
npm run reset      # Reset database
```

### Frontend Development
```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run E2E tests
npx playwright test
```

### Available Scripts

#### Backend Scripts
```json
{
  "dev": "nodemon server.js",
  "start": "node server.js",
  "test": "jest",
  "test:coverage": "jest --coverage",
  "setup": "node scripts/setup.js",
  "seed": "node scripts/seed.js",
  "reset": "node scripts/reset-database.js"
}
```

#### Frontend Scripts
```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "test": "vitest",
  "test:coverage": "vitest --coverage",
  "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
}
```

## 🏢 Deployment Options

### 🌐 Intranet Deployment (Recommended)
**Perfect for corporate environments - runs entirely on your internal network**

```bash
# Quick intranet setup (replace with your server IP)
# Backend - Accessible from corporate network
cd backend && npm run start:intranet

# Frontend - Available to all network devices
cd frontend && npm run preview:intranet

# Access from any device on your corporate network:
# http://YOUR_SERVER_IP:5173 (from desktops, laptops, mobile devices)
# No internet required - works offline within your network!
```

**Benefits of Intranet Deployment:**
- ✅ **Complete Data Privacy**: All data stays within your corporate network
- ✅ **Lightning Fast**: Local network speeds, no internet latency
- ✅ **Always Available**: Works even when internet is down
- ✅ **Cost Effective**: No cloud hosting fees
- ✅ **IT Controlled**: Managed by your existing IT infrastructure
- ✅ **Multi-Device Access**: Desktops, laptops, tablets, phones on company WiFi

📖 **See [Intranet Setup Guide](docs/INTRANET_SETUP.md) for detailed instructions**

### 💻 Development Environment
```bash
# Backend (Terminal 1)
cd backend && npm run dev

# Frontend (Terminal 2)
cd frontend && npm run dev
```

### 🚀 Production Deployment
See [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) for comprehensive production setup including:
- PM2 process management
- Nginx reverse proxy configuration
- SSL/HTTPS setup
- Database optimization
- Security hardening

## 🧪 Testing

### Test Coverage
- **Backend**: Unit tests, integration tests, API tests
- **Frontend**: Component tests, hook tests, integration tests
- **E2E**: Full user journey testing with Playwright

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# E2E tests
cd frontend && npx playwright test

# All tests with coverage
npm run test:all
```

## 🔐 Security Features

### Authentication & Authorization
- Session-based authentication with secure cookies
- Role-based access control (Admin/Employee)
- Password hashing with bcrypt (12 salt rounds)
- Rate limiting on authentication endpoints
- Session timeout and management

### Data Security
- SQL injection prevention with prepared statements
- Input validation and sanitization
- File upload security with type and size validation
- CORS configuration for cross-origin requests
- Security headers with Helmet.js

### Audit & Compliance
- Comprehensive audit logging for all operations
- User activity tracking with IP and session info
- Data change history with old/new value tracking
- Compliance reporting and export capabilities

## 📊 System Modules

### Employee Management
- Complete employee lifecycle management
- Profile management with document uploads
- Employment status tracking and history
- Department and position management
- Emergency contact information

### Leave Management
- Multiple leave types with configurable rules
- Leave application workflow with approvals
- Automated leave balance calculations
- Monthly accrual processing
- Leave history and analytics

### Payroll Processing
- Flexible payroll period management
- Automated salary calculations
- Configurable allowances and deductions
- Employee-specific overrides
- Payslip generation and distribution

### Benefits Administration
- Terminal leave processing
- Leave monetization calculations
- Performance-based bonuses (PBB)
- 13th and 14th month pay processing
- GSIS and loyalty award management

### Training Management
- Training program creation and management
- Employee enrollment and tracking
- Completion certificates and records
- Training analytics and reporting

## 🔧 Configuration

### Environment Variables
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=ems_user
DB_PASSWORD=your_password
DB_NAME=employee_management_system

# Security Configuration
SESSION_SECRET=your-secure-session-secret
BCRYPT_ROUNDS=12

# Application Configuration
PORT=3000
NODE_ENV=development
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=900000

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

### Database Configuration
- Connection pooling with 10 max connections
- Query timeout of 60 seconds
- Prepared statements for all queries
- Automatic connection retry logic

## 📈 Performance

### Backend Optimization
- Database connection pooling
- Query optimization with strategic indexing
- Response caching for static data
- Pagination for large datasets
- Efficient file handling

### Frontend Optimization
- Code splitting with lazy loading
- React Query for server state management
- Memoized components for expensive renders
- Virtual scrolling for large lists
- Optimized bundle size with Vite

## 🐛 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check MySQL service
sudo systemctl status mysql

# Test connection
mysql -u ems_user -p employee_management_system
```

#### Port Conflicts
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### Permission Issues
```bash
# Fix file permissions
chmod 600 backend/.env
chmod -R 755 backend/uploads
```

### Health Checks
```bash
# Backend health
curl http://localhost:3000/api/health

# Database connectivity
curl http://localhost:3000/api/health/database
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Standards
- Follow ESLint configuration for code style
- Write comprehensive tests for new features
- Update documentation for API changes
- Use TypeScript for frontend development
- Follow RESTful API conventions

### Testing Requirements
- Unit tests for all new functions/components
- Integration tests for API endpoints
- E2E tests for critical user journeys
- Maintain minimum 80% code coverage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **shadcn/ui** for the beautiful component library
- **Radix UI** for accessible UI primitives
- **TanStack Query** for excellent server state management
- **Vite** for fast build tooling
- **Express.js** for the robust backend framework

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation files for detailed information
- Review the troubleshooting section for common problems

## 🗺️ Roadmap

### Upcoming Features
- [ ] Mobile application (React Native)
- [ ] Advanced reporting dashboard
- [ ] Integration with external HR systems
- [ ] Multi-language support
- [ ] Advanced workflow automation
- [ ] Real-time notifications
- [ ] Document versioning system
- [ ] Advanced analytics and insights

### Performance Improvements
- [ ] Database query optimization
- [ ] Caching layer implementation
- [ ] CDN integration for file storage
- [ ] Background job processing
- [ ] API rate limiting enhancements

---

**Employee Management System** - Streamlining HR operations with modern technology.

Built with ❤️ using Node.js, React, and MySQL.   
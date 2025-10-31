# LGU Portal - Human Resource Information System

A comprehensive web-based Human Resource Information System (HRIS) designed for Local Government Units (LGU) to manage employee records, leave applications, training programs, and administrative tasks.

## 🌟 Features

### Employee Management
- Complete employee profile management with personal information
- Employment history tracking (work experience, education, certifications)
- Document management and file uploads
- Employee status tracking (Active, Retired, Resigned, Terminated, AWOL)
- Advanced search and filtering capabilities
- Bulk employee import via Excel

### Leave Management
- Leave application submission and approval workflow
- Multiple leave types support (Vacation, Sick, Maternity, etc.)
- Leave balance tracking and monitoring
- Calendar view for leave schedules
- Print functionality for leave application forms
- Real-time leave balance calculations
- Leave history and analytics

### Training & Development
- Training program management
- Employee training enrollment
- Training completion tracking
- Certificate management
- Training analytics and reporting

### Dashboard & Analytics
- Role-based dashboards (Admin & Employee)
- Real-time statistics and metrics
- Activity tracking and audit logs
- Employment status breakdown
- Monthly activity reports
- Visual charts and graphs

### User Management
- Role-based access control (Admin & Employee)
- Secure authentication system
- User profile management
- Session management

### System Features
- Responsive design for mobile and desktop
- Dark mode support
- Real-time notifications
- Audit trail for all actions
- Data export capabilities
- Print-friendly layouts

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v7
- **UI Components**: Radix UI
- **Styling**: Tailwind CSS v4
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Date Handling**: date-fns
- **HTTP Client**: Axios
- **State Management**: TanStack Query

### Backend
- **Runtime**: Node.js (>=16.0.0)
- **Framework**: Express.js
- **Database**: MySQL 2
- **Authentication**: bcryptjs, express-session
- **File Upload**: Multer, express-fileupload
- **Validation**: express-validator
- **Security**: Helmet, CORS, express-rate-limit
- **PDF Generation**: PDFKit
- **Excel Processing**: xlsx
- **Task Scheduling**: node-cron

## 📋 Prerequisites

- Node.js (version 16.0.0 or higher)
- npm (version 8.0.0 or higher)
- MySQL database server
- Git

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd lgu-portal
```

### 2. Install Dependencies

#### Root Dependencies
```bash
npm install
```

#### Backend Dependencies
```bash
cd backend
npm install
```

#### Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE lgu_portal;
```

2. Configure database connection in `backend/.env`:
```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=lgu_portal
DB_PORT=3306
```

3. Run database migrations:
```bash
cd backend
npm run setup
```

### 4. Environment Configuration

#### Backend (.env)
Create a `.env` file in the `backend` directory:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lgu_portal
DB_PORT=3306

# Session Configuration
SESSION_SECRET=your_session_secret_key_here

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

#### Frontend (.env)
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:3000/api
```

## 🏃 Running the Application

### Development Mode

#### Start Backend Server
```bash
cd backend
npm run dev
```
The backend server will run on `http://localhost:3000`

#### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

### Production Mode

#### Build Frontend
```bash
cd frontend
npm run build
```

#### Start Backend in Production
```bash
cd backend
npm start
```

### Intranet Deployment

For intranet deployment with specific IP:

#### Backend
```bash
cd backend
npm run start:intranet
```

#### Frontend
```bash
cd frontend
npm run dev:intranet
# or for HTTPS
npm run dev:intranet:https
```

## 📁 Project Structure

```
lgu-portal/
├── backend/
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── scripts/         # Setup and utility scripts
│   ├── services/        # Business logic
│   ├── uploads/         # File uploads directory
│   ├── utils/           # Helper functions
│   └── server.js        # Entry point
├── frontend/
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # React contexts
│   │   ├── hooks/       # Custom hooks
│   │   ├── lib/         # Utilities
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── types/       # TypeScript types
│   │   └── App.tsx      # Main app component
│   └── index.html       # HTML template
└── README.md
```

## 🔐 Default Credentials

After running the setup script, you can login with:

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Employee Account:**
- Username: `employee`
- Password: `employee123`

⚠️ **Important**: Change these credentials immediately after first login in production.

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Employee Endpoints
- `GET /api/employees` - List all employees
- `GET /api/employees/:id` - Get employee details
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Leave Endpoints
- `GET /api/leaves` - List leave applications
- `GET /api/leaves/:id` - Get leave details
- `POST /api/leaves` - Create leave application
- `PUT /api/leaves/:id/approve` - Approve leave
- `PUT /api/leaves/:id/reject` - Reject leave
- `GET /api/leaves/balances/:employeeId` - Get leave balances

### Training Endpoints
- `GET /api/training/programs` - List training programs
- `POST /api/training/programs` - Create training program
- `GET /api/training/enrollments` - List enrollments
- `POST /api/training/enrollments` - Enroll employee

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
npm test
```

### Test CORS Configuration
```bash
cd backend
npm run test:cors
```

## 🔧 Troubleshooting

### Port Already in Use
```bash
cd backend
npm run kill:port
npm run restart
```

### Database Connection Issues
1. Verify MySQL is running
2. Check database credentials in `.env`
3. Ensure database exists
4. Check firewall settings

### CORS Issues
1. Verify `CORS_ORIGIN` in backend `.env`
2. Check frontend API URL configuration
3. Run CORS test: `npm run debug:cors`

## 📝 Scripts

### Backend Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run setup` - Initialize database
- `npm run seed` - Seed database with sample data
- `npm test` - Run tests
- `npm run kill:port` - Kill process on port 3000

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔒 Security Features

- Password hashing with bcryptjs
- Session-based authentication
- CSRF protection
- Rate limiting on API endpoints
- Helmet.js security headers
- Input validation and sanitization
- SQL injection prevention
- XSS protection

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📄 License

MIT License - see LICENSE file for details

## 👥 Authors

Student of Don Jose Ecleo Memorial College

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support and questions, please contact the development team.

## 🗺️ Roadmap

- [ ] Mobile application
- [ ] Email notifications
- [ ] Advanced reporting module
- [ ] Performance review system
- [ ] Attendance tracking
- [ ] Biometric integration
- [ ] Multi-language support
- [ ] API documentation with Swagger

## 📊 System Requirements

### Minimum Requirements
- CPU: Dual-core processor
- RAM: 4GB
- Storage: 10GB free space
- Network: Stable internet connection

### Recommended Requirements
- CPU: Quad-core processor
- RAM: 8GB or more
- Storage: 20GB free space
- Network: High-speed internet connection

## 🔄 Version History

### Version 1.0.0 (Current)
- Initial release
- Employee management system
- Leave management system
- Training management system
- Dashboard and analytics
- User authentication and authorization

---

**Note**: This system is designed specifically for Local Government Units and can be customized based on specific organizational requirements.

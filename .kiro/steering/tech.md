# Technology Stack & Build System

## Backend Stack

- **Runtime**: Node.js (>=16.0.0)
- **Framework**: Express.js 4.18.2
- **Database**: MySQL 8.0+ with connection pooling
- **Authentication**: Session-based with bcrypt password hashing
- **File Handling**: Express-fileupload and Multer
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting, Express-session

### Key Dependencies
- `mysql2` - Database driver with prepared statements
- `bcryptjs` - Password hashing (12 salt rounds)
- `express-session` - Session management
- `moment` - Date/time handling
- `pdfkit` - PDF generation for reports
- `node-cron` - Scheduled jobs (monthly accrual)
- `uuid` - Unique identifier generation

## Frontend Stack

- **Framework**: React 19.1.1 with TypeScript
- **Build Tool**: Vite 7.1.2 with SWC
- **UI Library**: Radix UI components with shadcn/ui
- **Styling**: Tailwind CSS 4.1.13
- **State Management**: TanStack React Query 5.87.4
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router DOM 7.9.1
- **HTTP Client**: Axios 1.12.1

### Key Frontend Dependencies
- `@radix-ui/*` - Accessible UI primitives
- `lucide-react` - Icon library
- `recharts` - Data visualization
- `date-fns` - Date utilities
- `sonner` - Toast notifications

## Development Environment

### Backend Commands
```bash
# Development
npm run dev              # Start with nodemon
npm run dev:intranet     # Start for intranet deployment

# Production
npm start                # Standard production start
npm run start:intranet   # Production with NODE_ENV=production

# Database
npm run setup            # Initialize database schema
npm run seed             # Seed with sample data

# Utilities
npm run kill:port        # Kill process on port 3000
npm run restart          # Kill port and restart dev
npm run health           # Check server health
npm run test:cors        # Test CORS configuration
```

### Frontend Commands
```bash
# Development
npm run dev              # Start Vite dev server
npm run dev:intranet     # Start on intranet IP (10.0.0.73:5173)

# Production
npm run build            # TypeScript compile + Vite build
npm run build:intranet   # Build for intranet deployment
npm run preview          # Preview production build
npm run preview:intranet # Preview on intranet IP (10.0.0.73:4173)

# Code Quality
npm run lint             # ESLint validation
```

## Database Configuration

- **Connection Pooling**: 10 connections max, 60s timeout
- **Prepared Statements**: Used for all queries with parameter binding
- **Indexing Strategy**: Optimized for employee search, status filtering, and pagination
- **Soft Deletes**: Implemented with `deleted_at` timestamp column

## Security Configuration

- **Password Policy**: 12 salt rounds, minimum complexity requirements
- **Session Security**: HTTP-only cookies, 8-hour expiration, strict SameSite
- **Rate Limiting**: 5 auth attempts per 15-minute window
- **CORS**: Configured for intranet deployment (10.0.0.73)
- **File Uploads**: Size limits, type validation, secure storage

## Environment Variables

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
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=900000
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

## Deployment Notes

- **Intranet Deployment**: Configured for IP 10.0.0.73
- **File Storage**: Local filesystem with organized directory structure
- **Logging**: Morgan for HTTP requests, custom audit logging
- **Process Management**: Designed for PM2 or similar process managers
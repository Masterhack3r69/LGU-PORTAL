# Employee Management System - Deployment Guide

## Prerequisites

### System Requirements
- **Operating System**: Windows 10/11, Linux (Ubuntu 18.04+), macOS 10.15+
- **Node.js**: Version 16.0.0 or higher
- **MySQL**: Version 8.0 or higher
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: Minimum 10GB free space

### Development Tools
- **Git**: For version control
- **npm**: Node package manager (comes with Node.js)
- **MySQL Workbench**: For database management (optional)
- **Postman**: For API testing (optional)

## Environment Setup

### 1. Database Setup

#### Install MySQL Server
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# Windows - Download from MySQL official website
# macOS with Homebrew
brew install mysql
```

#### Create Database and User
```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create database
CREATE DATABASE employee_management_system;

-- Create user for the application
CREATE USER 'ems_user'@'localhost' IDENTIFIED BY 'secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON employee_management_system.* TO 'ems_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### 2. Project Setup

#### Clone Repository
```bash
git clone <repository-url>
cd employee-management-system
```

#### Install Root Dependencies
```bash
npm install
```

#### Backend Setup
```bash
cd backend

# Install backend dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your configuration
# Use your preferred text editor
nano .env
```

#### Configure Backend Environment (.env)
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=ems_user
DB_PASSWORD=secure_password_here
DB_NAME=employee_management_system

# Security Configuration
SESSION_SECRET=your-super-secure-session-secret-key-here
BCRYPT_ROUNDS=12

# Application Configuration
PORT=3000
NODE_ENV=development

# Authentication Configuration
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=900000

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=./logs
```

#### Frontend Setup
```bash
cd ../frontend

# Install frontend dependencies
npm install
```

### 3. Database Initialization

#### Run Database Setup Script
```bash
cd backend

# Initialize database schema
npm run setup

# Seed with sample data (optional)
npm run seed
```

#### Manual Database Setup (Alternative)
```bash
# If setup script fails, run SQL manually
mysql -u ems_user -p employee_management_system < scripts/database_schema.sql
```

## Development Deployment

### 1. Start Backend Server
```bash
cd backend

# Development mode with auto-reload
npm run dev

# Check if server is running
curl http://localhost:3000/api/health
```

### 2. Start Frontend Development Server
```bash
cd frontend

# Start Vite development server
npm run dev

# Frontend will be available at http://localhost:5173
```

### 3. Verify Installation
1. Open browser to `http://localhost:5173`
2. Login with default admin credentials:
   - Username: `admin`
   - Password: `admin123`
3. Check all modules are accessible

## Production Deployment

### 1. Environment Configuration

#### Backend Production Environment
```bash
# backend/.env.production
NODE_ENV=production
PORT=3000
DB_HOST=your-production-db-host
DB_USER=your-production-db-user
DB_PASSWORD=your-production-db-password
SESSION_SECRET=your-production-session-secret
```

#### Frontend Production Build
```bash
cd frontend

# Build for production
npm run build

# Preview production build (optional)
npm run preview
```

### 2. Process Management with PM2

#### Install PM2
```bash
npm install -g pm2
```

#### Create PM2 Ecosystem File
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'ems-backend',
      script: './backend/server.js',
      cwd: './',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true
    }
  ]
};
```

#### Start with PM2
```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 3. Nginx Configuration (Recommended)

#### Install Nginx
```bash
# Ubuntu/Debian
sudo apt install nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### Configure Nginx
```nginx
# /etc/nginx/sites-available/employee-management-system
server {
    listen 80;
    server_name your-domain.com;

    # Frontend static files
    location / {
        root /path/to/employee-management-system/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # File uploads
    location /uploads/ {
        alias /path/to/employee-management-system/backend/uploads/;
        
        # Security for uploaded files
        location ~* \.(php|jsp|asp|sh|cgi)$ {
            deny all;
        }
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
```

#### Enable Site
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/employee-management-system /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Intranet Deployment

### 1. Network Configuration

#### Configure for Specific IP (10.0.0.73)
```bash
# Backend - Update package.json scripts
"dev:intranet": "cross-env NODE_ENV=development HOST=10.0.0.73 nodemon server.js",
"start:intranet": "cross-env NODE_ENV=production HOST=10.0.0.73 node server.js"

# Frontend - Update package.json scripts
"dev:intranet": "vite --host 10.0.0.73 --port 5173",
"preview:intranet": "vite preview --host 10.0.0.73 --port 4173"
```

#### Update Frontend API Configuration
```typescript
// frontend/src/services/api.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://10.0.0.73:3000/api'
  : 'http://localhost:3000/api';
```

### 2. Start Intranet Services
```bash
# Backend
cd backend
npm run dev:intranet

# Frontend (in another terminal)
cd frontend
npm run dev:intranet
```

## SSL/HTTPS Configuration

### 1. Obtain SSL Certificate

#### Using Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal setup
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Using Self-Signed Certificate (Development)
```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/ems-selfsigned.key \
  -out /etc/ssl/certs/ems-selfsigned.crt
```

### 2. Update Nginx for HTTPS
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Rest of configuration...
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## Database Backup and Maintenance

### 1. Automated Backup Script
```bash
#!/bin/bash
# backup-database.sh

DB_NAME="employee_management_system"
DB_USER="ems_user"
DB_PASS="your_password"
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/ems_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/ems_backup_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "ems_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: ems_backup_$DATE.sql.gz"
```

### 2. Setup Cron Job for Automated Backups
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup-database.sh >> /var/log/ems-backup.log 2>&1
```

## Monitoring and Logging

### 1. Application Monitoring
```bash
# Monitor PM2 processes
pm2 monit

# View logs
pm2 logs ems-backend

# Restart application
pm2 restart ems-backend
```

### 2. Log Rotation
```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/employee-management-system

# Configuration content:
/path/to/employee-management-system/backend/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload ems-backend
    endscript
}
```

## Security Hardening

### 1. Firewall Configuration
```bash
# Ubuntu UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp  # Only if direct access needed
```

### 2. Database Security
```sql
-- Remove anonymous users
DELETE FROM mysql.user WHERE User='';

-- Remove remote root access
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');

-- Remove test database
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';

-- Reload privileges
FLUSH PRIVILEGES;
```

### 3. File Permissions
```bash
# Set proper permissions
chmod 600 backend/.env
chmod 755 backend/uploads
chmod -R 644 frontend/dist/*
chmod 755 frontend/dist
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check MySQL service
sudo systemctl status mysql

# Test connection
mysql -u ems_user -p -h localhost employee_management_system

# Check firewall
sudo ufw status
```

#### 2. Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use npm script
npm run kill:port
```

#### 3. Permission Denied Errors
```bash
# Fix file permissions
sudo chown -R $USER:$USER /path/to/employee-management-system
chmod -R 755 /path/to/employee-management-system
```

#### 4. Frontend Build Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 16.0.0 or higher
```

### Health Check Endpoints
```bash
# Backend health check
curl http://localhost:3000/api/health

# Database connectivity check
curl http://localhost:3000/api/health/database

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "database": "connected"
}
```

## Performance Optimization

### 1. Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_employees_search ON employees(first_name, last_name, employee_number);
CREATE INDEX idx_leave_applications_status ON leave_applications(status, created_at);
CREATE INDEX idx_payroll_items_period ON payroll_items(payroll_period_id, employee_id);

-- Optimize MySQL configuration
# Add to /etc/mysql/mysql.conf.d/mysqld.cnf
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
query_cache_size = 64M
query_cache_type = 1
```

### 2. Application Optimization
```bash
# Enable gzip compression in Express
# Already configured in server.js

# Use PM2 cluster mode for multiple instances
pm2 start ecosystem.config.js --env production -i max
```

This deployment guide provides comprehensive instructions for setting up the Employee Management System in various environments, from development to production, with security considerations and troubleshooting guidance.
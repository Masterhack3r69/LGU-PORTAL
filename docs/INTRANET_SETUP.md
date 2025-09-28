# Employee Management System - Intranet Setup Guide

## 🌐 Intranet Application Overview

The Employee Management System is specifically designed as an **intranet web application** for corporate environments. This means it runs entirely within your company's internal network, providing secure, fast access to HR functions without requiring external internet connectivity.

## 🏢 Why Intranet Deployment?

### Security Benefits
- **Complete Data Privacy**: All employee data remains within your corporate network
- **No External Exposure**: Application is not accessible from the internet
- **Corporate Firewall Protection**: Protected by existing network security
- **Compliance Ready**: Meets strict corporate data protection requirements
- **No Cloud Dependencies**: Full control over your data and infrastructure

### Performance Benefits
- **Lightning Fast**: Local network speeds (no internet latency)
- **Always Available**: Works even when internet is down
- **Bandwidth Efficient**: No external data transfer
- **Scalable**: Handles multiple concurrent users on local network

### Cost Benefits
- **No Monthly Fees**: No cloud hosting or SaaS subscription costs
- **One-Time Setup**: Deploy once, use forever
- **Existing Infrastructure**: Uses your current network and servers
- **IT Control**: Managed by your existing IT team

## 🚀 Quick Intranet Setup

### Prerequisites
- Windows/Linux server on your corporate network
- Node.js 16+ installed on the server
- MySQL 8.0+ database server
- Network access to ports 3000 and 5173

### Step 1: Determine Your Server IP
Find your intranet server's IP address:

```bash
# Windows Command Prompt
ipconfig

# Linux/Mac Terminal
hostname -I
# or
ip addr show

# Look for internal IP like:
# 192.168.1.100
# 10.0.0.73
# 172.16.1.50
```

### Step 2: Clone and Setup
```bash
# On your intranet server
git clone <repository-url>
cd employee-management-system

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

### Step 3: Configure for Your Network
Replace `YOUR_SERVER_IP` with your actual server IP:

#### Backend Configuration
```bash
# backend/package.json - Add intranet scripts
"scripts": {
  "dev:intranet": "cross-env NODE_ENV=development HOST=YOUR_SERVER_IP nodemon server.js",
  "start:intranet": "cross-env NODE_ENV=production HOST=YOUR_SERVER_IP node server.js"
}
```

#### Frontend Configuration
```bash
# frontend/package.json - Add intranet scripts
"scripts": {
  "dev:intranet": "vite --host YOUR_SERVER_IP --port 5173",
  "build:intranet": "tsc && vite build",
  "preview:intranet": "vite preview --host YOUR_SERVER_IP --port 5173"
}
```

#### API Configuration
```typescript
// frontend/src/services/api.ts
const API_BASE_URL = 'http://YOUR_SERVER_IP:3000/api';
```

### Step 4: Database Setup
```bash
# Connect to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE employee_management_system;
CREATE USER 'ems_user'@'%' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON employee_management_system.* TO 'ems_user'@'%';
FLUSH PRIVILEGES;
EXIT;

# Initialize database
cd backend
mysql -u ems_user -p employee_management_system < scripts/database_schema.sql
```

### Step 5: Environment Configuration
```bash
# backend/.env
NODE_ENV=production
HOST=YOUR_SERVER_IP
PORT=3000

DB_HOST=YOUR_SERVER_IP
DB_PORT=3306
DB_USER=ems_user
DB_PASSWORD=your_secure_password
DB_NAME=employee_management_system

SESSION_SECRET=your-super-secure-session-secret
```

### Step 6: Start Services
```bash
# Terminal 1 - Backend
cd backend
npm run start:intranet

# Terminal 2 - Frontend
cd frontend
npm run build:intranet
npm run preview:intranet
```

### Step 7: Access from Network
Open any browser on any device connected to your corporate network:
```
http://YOUR_SERVER_IP:5173
```

Default login: `admin` / `admin123`

## 📱 Multi-Device Access

### Desktop Computers
- Windows PCs, Mac, Linux workstations
- Any modern web browser
- Full functionality available

### Mobile Devices
- Smartphones and tablets on company WiFi
- Responsive design adapts to screen size
- Touch-friendly interface

### Laptops
- Company laptops on corporate network
- Works with VPN when connected to company network
- Offline capability when server is local

## 🔧 Production Intranet Setup

### Using PM2 Process Manager
```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem file
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ems-backend',
    script: './backend/server.js',
    env_production: {
      NODE_ENV: 'production',
      HOST: 'YOUR_SERVER_IP',
      PORT: 3000
    }
  }]
};

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Serve Frontend with Nginx
```nginx
# /etc/nginx/sites-available/ems
server {
    listen 80;
    server_name YOUR_SERVER_IP;

    location / {
        root /path/to/employee-management-system/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://YOUR_SERVER_IP:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔒 Network Security Configuration

### Firewall Rules
```bash
# Windows Firewall
netsh advfirewall firewall add rule name="EMS Backend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="EMS Frontend" dir=in action=allow protocol=TCP localport=5173

# Linux UFW
sudo ufw allow 3000/tcp
sudo ufw allow 5173/tcp
sudo ufw allow 80/tcp  # if using Nginx
```

### Network Access Control
```bash
# Restrict access to specific IP ranges (optional)
# In your router/firewall, allow only:
# 192.168.1.0/24  (for 192.168.1.x network)
# 10.0.0.0/24     (for 10.0.0.x network)
# 172.16.0.0/16   (for 172.16.x.x network)
```

## 👥 User Management for Intranet

### Employee Access Setup
1. **Create User Accounts**: Use the admin interface to create employee accounts
2. **Distribute Credentials**: Provide login information to employees
3. **Network Instructions**: Share the intranet URL with staff

### IT Administrator Tasks
```bash
# Monitor application
pm2 status
pm2 logs

# Database maintenance
mysqldump -u ems_user -p employee_management_system > backup_$(date +%Y%m%d).sql

# Update application
git pull origin main
npm install
pm2 restart ems-backend
```

## 📊 Intranet Performance Optimization

### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_employees_search ON employees(first_name, last_name, employee_number);
CREATE INDEX idx_leave_applications_status ON leave_applications(status, created_at);

-- Optimize MySQL for intranet use
# /etc/mysql/mysql.conf.d/mysqld.cnf
[mysqld]
innodb_buffer_pool_size = 1G
query_cache_size = 64M
max_connections = 100
```

### Network Optimization
```bash
# Enable gzip compression in Nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

# Browser caching for static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🔧 Troubleshooting Intranet Issues

### Common Problems

#### "Cannot connect to server"
```bash
# Check if services are running
pm2 status
netstat -tulpn | grep :3000

# Verify firewall settings
sudo ufw status
```

#### "Slow loading from other computers"
```bash
# Test network connectivity
ping YOUR_SERVER_IP

# Check server resources
htop
df -h
```

#### "Database connection failed"
```bash
# Test database connectivity
mysql -h YOUR_SERVER_IP -u ems_user -p

# Check MySQL configuration
grep bind-address /etc/mysql/mysql.conf.d/mysqld.cnf
# Should be 0.0.0.0 or YOUR_SERVER_IP
```

## 📋 Employee Instructions Template

Share this with your employees:

---

**Employee Management System Access**

**URL**: http://YOUR_SERVER_IP:5173

**How to Access**:
1. Connect to company network (office WiFi or ethernet)
2. Open any web browser
3. Go to the URL above
4. Login with your provided credentials

**Available From**:
- Office desktop computers
- Company laptops
- Mobile phones (on company WiFi)
- Tablets (on company WiFi)

**Features Available**:
- View your profile and update contact information
- Submit leave applications
- Check leave balances
- View payslips
- Access training programs
- Upload required documents

**Support**: Contact IT department for technical issues

---

## 🎯 Best Practices for Intranet Deployment

### Security
- Use strong passwords for database and admin accounts
- Regularly update the application and dependencies
- Monitor access logs for unusual activity
- Backup database regularly

### Performance
- Monitor server resources (CPU, memory, disk)
- Optimize database queries and indexes
- Use SSD storage for better performance
- Consider load balancing for large organizations

### Maintenance
- Schedule regular backups
- Plan for system updates during off-hours
- Monitor application logs for errors
- Keep documentation updated

This intranet setup ensures your Employee Management System operates efficiently within your corporate network, providing secure, fast access to HR functions for all employees while maintaining complete control over your data and infrastructure.
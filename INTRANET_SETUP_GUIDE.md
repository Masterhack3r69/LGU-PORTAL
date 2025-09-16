# EMS Intranet Configuration Guide

## Overview
This guide explains how to configure the Employee Management System (EMS) to run on your intranet using IP address 10.0.0.1.

## Prerequisites

### 1. Network Adapter Configuration
Configure your network adapter to use IP address 10.0.0.1:

**Windows:**
1. Open Network and Sharing Center
2. Click on "Change adapter settings"
3. Right-click your network adapter → Properties
4. Select "Internet Protocol Version 4 (TCP/IPv4)" → Properties
5. Select "Use the following IP address":
   - IP address: `10.0.0.1`
   - Subnet mask: `255.255.255.0`
   - Default gateway: (leave blank for local-only)
   - DNS servers: (configure as needed)

### 2. Firewall Configuration
Ensure Windows Firewall allows traffic on ports 3000 and 5173:

```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "EMS Backend" -Direction Inbound -Port 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "EMS Frontend" -Direction Inbound -Port 5173 -Protocol TCP -Action Allow
```

### 3. Database Setup
Ensure MySQL/MariaDB is running and accessible. Update the `.env` file with your database credentials.

## Starting the Application

### Option 1: Using Batch Script
```bash
# Double-click or run from command prompt
start-intranet.bat
```

### Option 2: Using PowerShell Script
```powershell
# Run from PowerShell (may need execution policy adjustment)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\start-intranet.ps1
```

### Option 3: Manual Start
```bash
# Backend
cd backend
npm run start:intranet

# Frontend (in new terminal)
cd frontend
npm run dev:intranet
```

## Accessing the Application

- **Main Application**: http://10.0.0.1:5173
- **API Endpoints**: http://10.0.0.1:3000/api
- **Health Check**: http://10.0.0.1:3000/health

## Client Access Configuration

For other computers on the network to access the application:

1. Ensure they can reach IP 10.0.0.1
2. Configure their network to be on the same subnet (e.g., 10.0.0.x/24)
3. Access the application at: http://10.0.0.1:5173

## Security Considerations

1. **Network Isolation**: Ensure the intranet is properly isolated from external networks
2. **Access Control**: Configure user authentication properly
3. **Firewall Rules**: Only allow necessary ports (3000, 5173)
4. **Regular Updates**: Keep the application and dependencies updated

## Troubleshooting

### Common Issues:

1. **Cannot access 10.0.0.1**
   - Check network adapter configuration
   - Verify IP assignment with `ipconfig`
   - Test with `ping 10.0.0.1`

2. **Port already in use**
   - Check running processes: `netstat -ano | findstr :3000`
   - Kill conflicting processes or change ports

3. **Database connection failed**
   - Verify MySQL/MariaDB is running
   - Check database credentials in `.env`
   - Test connection: `mysql -u username -p database_name`

4. **CORS errors**
   - Verify CORS_ORIGINS in `.env` includes frontend URL
   - Check browser console for specific errors

## Production Deployment

For production deployment:

1. Build the frontend: `npm run build:intranet`
2. Use a process manager like PM2 for the backend
3. Configure reverse proxy (nginx/Apache) if needed
4. Set up SSL certificates for HTTPS
5. Configure proper backup strategies

## Monitoring

- Health endpoint: http://10.0.0.1:3000/health
- Application logs: Check backend console output
- Database monitoring: Monitor MySQL performance

## Support

For technical support, refer to:
- Backend documentation: `/backend/README.md`
- Frontend documentation: `/frontend/README.md`
- API documentation: `/backend/TLB_API_DOCUMENTATION.md`
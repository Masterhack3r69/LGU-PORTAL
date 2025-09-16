# EMS Intranet Deployment

## 🌐 Overview
Your Employee Management System (EMS) has been configured to run as an intranet application using IP address **10.0.0.1**.

## 🚀 Quick Start

### 1. Configure Network (First Time Only)
Set your network adapter to use IP: **10.0.0.1**
- See `QUICK_NETWORK_SETUP.md` for step-by-step instructions

### 2. Start the Application
**Easy way:** Double-click `start-intranet.bat`

**PowerShell way:** 
```powershell
.\start-intranet.ps1
```

### 3. Access the Application
Open your browser and go to: **http://10.0.0.1:5173**

## 📁 Configuration Files

| File | Purpose |
|------|---------|
| `backend\.env` | Backend server configuration |
| `frontend\.env` | Frontend application configuration |
| `start-intranet.bat` | Windows startup script |
| `start-intranet.ps1` | PowerShell startup script |

## 🔧 Key Configuration Changes

### Backend Server (`server.js`)
- Binds to IP address **10.0.0.1:3000**
- CORS configured for intranet access
- Production-ready security settings

### Frontend (`vite.config.ts`)
- Serves on **10.0.0.1:5173**
- API calls directed to backend at **10.0.0.1:3000**

### Environment Variables
- `VITE_API_BASE_URL=http://10.0.0.1:3000/api`
- `CORS_ORIGINS=http://10.0.0.1:5173,http://10.0.0.1:3000`

## 🖥️ Client Access

For other computers to access the EMS:

1. **Network Configuration:**
   - IP: 10.0.0.2, 10.0.0.3, etc.
   - Subnet: 255.255.255.0
   - Gateway: 10.0.0.1

2. **Access URL:** http://10.0.0.1:5173

## 🛠️ Available Commands

### Backend
```bash
npm run start:intranet    # Production mode
npm run dev:intranet      # Development mode
```

### Frontend
```bash
npm run dev:intranet      # Development server
npm run build:intranet    # Production build
npm run preview:intranet  # Preview built app
```

## 📊 Monitoring

- **Health Check:** http://10.0.0.1:3000/health
- **API Status:** http://10.0.0.1:3000/api
- **Console Logs:** Check terminal windows

## 🔒 Security Notes

- Application runs in production mode
- CORS restricted to intranet IPs
- Session security enabled
- File upload restrictions in place

## 📚 Documentation

| Document | Description |
|----------|-------------|
| `INTRANET_SETUP_GUIDE.md` | Detailed setup instructions |
| `QUICK_NETWORK_SETUP.md` | Quick network configuration |
| `backend/README.md` | Backend documentation |
| `frontend/README.md` | Frontend documentation |

## 🆘 Troubleshooting

### Common Issues

1. **Can't access 10.0.0.1**
   - Check network adapter configuration
   - Verify with `ping 10.0.0.1`

2. **Port conflicts**
   - Check: `netstat -ano | findstr :3000`
   - Kill processes or change ports

3. **Database connection**
   - Verify MySQL is running
   - Check credentials in `backend\.env`

4. **CORS errors**
   - Verify CORS_ORIGINS in `.env`
   - Clear browser cache

### Testing
Run `test-intranet-config.bat` to verify all configurations.

## 🎯 Next Steps

1. **Database Setup:** Configure your MySQL database
2. **User Accounts:** Set up initial user accounts
3. **Company Info:** Update company details in `.env`
4. **SSL/HTTPS:** Consider SSL certificates for production

---

**Need Help?** 
- Check the detailed guides in the documentation folder
- Review console logs for error messages
- Ensure all network configurations are correct
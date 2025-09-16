# Quick Network Setup for EMS Intranet

## Step 1: Configure Your Network Adapter

### Windows 10/11:
1. Press `Win + R`, type `ncpa.cpl`, press Enter
2. Right-click your network adapter → Properties
3. Select "Internet Protocol Version 4 (TCP/IPv4)" → Properties
4. Choose "Use the following IP address":
   ```
   IP address: 10.0.0.1
   Subnet mask: 255.255.255.0
   Default gateway: (leave empty)
   ```
5. Click OK

### Windows Firewall:
Open PowerShell as Administrator and run:
```powershell
New-NetFirewallRule -DisplayName "EMS Backend" -Direction Inbound -Port 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "EMS Frontend" -Direction Inbound -Port 5173 -Protocol TCP -Action Allow
```

## Step 2: Start the Application

### Method 1: Double-click
- `start-intranet.bat`

### Method 2: PowerShell
```powershell
.\start-intranet.ps1
```

### Method 3: Manual
```cmd
# Terminal 1 (Backend)
cd backend
npm run start:intranet

# Terminal 2 (Frontend) 
cd frontend
npm run dev:intranet
```

## Step 3: Access the Application

**Main URL:** http://10.0.0.1:5173

**Other URLs:**
- API: http://10.0.0.1:3000/api
- Health Check: http://10.0.0.1:3000/health

## For Other Computers on Network

To allow other computers to access:

1. **Configure their network:**
   - IP: 10.0.0.2, 10.0.0.3, etc.
   - Subnet: 255.255.255.0
   - Gateway: 10.0.0.1

2. **Access the application:**
   - URL: http://10.0.0.1:5173

## Troubleshooting

**Can't access 10.0.0.1?**
```cmd
ipconfig /all
ping 10.0.0.1
```

**Port conflicts?**
```cmd
netstat -ano | findstr :3000
netstat -ano | findstr :5173
```

**Database issues?**
- Check if MySQL/MariaDB is running
- Verify credentials in `backend\.env`

Need help? Check `INTRANET_SETUP_GUIDE.md` for detailed instructions.
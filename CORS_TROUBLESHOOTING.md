# CORS Troubleshooting Guide

## What is CORS and why does it happen?

CORS (Cross-Origin Resource Sharing) is a security feature implemented by web browsers to prevent malicious websites from making unauthorized requests to other domains. It occurs when:

- Frontend (http://10.0.0.73:5173) tries to access Backend (http://10.0.0.73:3000)
- Different ports/domains are considered "different origins"
- Browser blocks the request if proper CORS headers are not set

## Common CORS Error Messages

```
Access to XMLHttpRequest at 'http://10.0.0.73:3000/api/payroll/periods' 
from origin 'http://10.0.0.73:5173' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Quick Fix Checklist

### 1. Check if Backend Server is Running
```bash
cd backend
npm run dev
```

Expected output should show:
```
🚀 Employee Management System Server Started
🔌 Host: 10.0.0.73:3000
```

### 2. Verify CORS Configuration
Run the CORS test script:
```bash
cd backend
node scripts/test-cors.js
```

### 3. Check Environment Configuration

**Backend (.env):**
```env
NODE_ENV=production
CORS_ORIGINS=http://10.0.0.73:5173,http://10.0.0.73:3000,http://localhost:5173,http://localhost:3000
```

**Frontend (.env):**
```env
VITE_API_BASE_URL=http://10.0.0.73:3000/api
```

### 4. Kill Conflicting Processes
Sometimes old server instances cause issues:

```bash
# Find processes using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Restart server
cd backend && npm run dev
```

## Common Causes and Solutions

### 1. Server Not Running
**Problem:** Backend server is not started
**Solution:** Start backend with `npm run dev`

### 2. Port Conflicts
**Problem:** Multiple servers running on same port
**Solution:** Kill existing processes and restart

### 3. Incorrect CORS Origins
**Problem:** Backend doesn't allow frontend origin
**Solution:** Check `CORS_ORIGINS` in backend/.env

### 4. Environment Mismatch
**Problem:** Development vs production environment differences
**Solution:** Ensure both frontend and backend use consistent URLs

### 5. Cache Issues
**Problem:** Browser caching old CORS responses
**Solution:** Hard refresh browser (Ctrl+F5) or clear cache

## Prevention Strategies

### 1. Use Consistent URLs
Always use the same base URLs across all environments:
- Development: `http://localhost:3000`
- Intranet: `http://10.0.0.73:3000`

### 2. Environment Variables
Never hardcode URLs. Always use environment variables:

**Frontend:**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
```

**Backend:**
```javascript
const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'];
```

### 3. Development Scripts
Add these scripts to package.json for easier management:

```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "test-cors": "node scripts/test-cors.js",
    "kill-port": "npx kill-port 3000",
    "restart": "npm run kill-port && npm run dev"
  }
}
```

### 4. Docker Setup (Optional)
For consistent environments, consider using Docker:

```dockerfile
# Dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

### 5. Monitoring
Add request logging to identify CORS issues early:

```javascript
// In server.js
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.get('Origin')}`);
  next();
});
```

## Testing CORS Configuration

### Manual Testing with curl
```bash
# Test preflight request
curl -X OPTIONS "http://10.0.0.73:3000/api/payroll/periods" \
  -H "Origin: http://10.0.0.73:5173" \
  -H "Access-Control-Request-Method: GET" \
  -v

# Should return CORS headers:
# Access-Control-Allow-Origin: http://10.0.0.73:5173
# Access-Control-Allow-Credentials: true
```

### Browser Developer Tools
1. Open browser Dev Tools (F12)
2. Go to Network tab
3. Try the failing request
4. Check response headers for CORS headers

### Automated Testing
```bash
# Run CORS test script
cd backend
node scripts/test-cors.js
```

## Emergency Recovery Steps

If CORS issues persist after trying above solutions:

1. **Complete Server Restart:**
   ```bash
   taskkill /IM node.exe /F
   cd backend && npm run dev
   ```

2. **Clear All Browser Data:**
   - Clear browser cache and cookies
   - Try incognito/private mode
   - Test with different browser

3. **Reset Network Configuration:**
   ```bash
   ipconfig /flushdns
   netsh winsock reset
   ```

4. **Verify File Permissions:**
   Ensure backend server can read .env files and has network permissions

5. **Check Windows Firewall:**
   Temporarily disable Windows Firewall to test connectivity

## Contact Support

If issues persist after following this guide:
1. Run `node scripts/test-cors.js` and save output
2. Check server logs for error messages
3. Provide environment details (Windows version, Node.js version)
4. Include browser console errors
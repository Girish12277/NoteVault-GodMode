# 🚀 Quick Start: Deploy to Vercel

## Option 1: Automated Deployment (Recommended)

### Step 1: Install Vercel CLI
```powershell
npm install -g vercel
```

### Step 2: Login to Vercel
```powershell
vercel login
```

### Step 3: Run Complete Deployment Script
```powershell
cd c:\Users\LENOVO\Videos\notes
.\scripts\deploy-all.ps1
```

This script will:
- ✅ Deploy backend to Vercel
- ✅ Automatically update frontend configuration
- ✅ Deploy frontend to Vercel
- ✅ Provide you with deployment URLs

---

## Option 2: Manual Deployment

### Backend Deployment

```powershell
# 1. Navigate to backend
cd c:\Users\LENOVO\Videos\notes\Backend

# 2. Deploy
vercel --prod

# 3. Note the deployment URL (e.g., https://your-backend.vercel.app)
```

### Frontend Deployment

```powershell
# 1. Update frontend environment
cd c:\Users\LENOVO\Videos\notes\Frontend

# 2. Edit .env.production and set:
# VITE_API_URL=https://your-backend.vercel.app

# 3. Deploy
vercel --prod
```

---

## Option 3: Individual Scripts

### Deploy Backend Only
```powershell
.\scripts\deploy-backend.ps1
```

### Deploy Frontend Only
```powershell
.\scripts\deploy-frontend.ps1
```

---

## ⚠️ IMPORTANT: Environment Variables

After deploying the backend, you MUST add environment variables in Vercel Dashboard:

1. Go to: https://vercel.com/dashboard
2. Select your backend project
3. Go to: Settings → Environment Variables
4. Add ALL variables from `Backend/.env`:
   - DATABASE_URL
   - JWT_SECRET
   - CLOUDINARY_CLOUD_NAME
   - CLOUDINARY_API_KEY
   - CLOUDINARY_API_SECRET
   - RAZORPAY_KEY_ID
   - RAZORPAY_KEY_SECRET
   - REDIS_URL
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - TWILIO_PHONE_NUMBER
   - EMAIL_HOST
   - EMAIL_PORT
   - EMAIL_USER
   - EMAIL_PASSWORD
   - FRONTEND_URL (set to your deployed frontend URL)
   - GORSE_API_URL
   - GORSE_API_KEY

5. Redeploy backend after adding variables:
   ```powershell
   cd Backend
   vercel --prod --force
   ```

---

## 🧪 Testing Deployment

### Test Backend
```powershell
# Replace with your actual backend URL
curl https://your-backend.vercel.app/api/health
```

### Test Frontend
Open your browser and navigate to the frontend URL provided by Vercel.

---

## 📚 Full Documentation

For detailed information, troubleshooting, and advanced options, see:
- [Complete Deployment Guide](file:///c:/Users/LENOVO/.gemini/antigravity/brain/0ef7520f-818e-4b4b-8fee-9b8ed964e71b/vercel-deployment-guide.md)

---

## 🔧 Common Issues

### "vercel: command not found"
```powershell
npm install -g vercel
```

### Backend returns 500 errors
- Check environment variables are set in Vercel Dashboard
- Check deployment logs: `vercel logs <deployment-url>`

### Frontend can't connect to backend
- Verify `VITE_API_URL` in `.env.production`
- Check CORS settings on backend
- Ensure `FRONTEND_URL` is set in backend environment variables

---

## 📞 Need Help?

Check the full deployment guide for detailed troubleshooting steps and advanced configuration options.

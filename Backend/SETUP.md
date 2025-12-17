# StudyVault Backend Setup Guide

## 📋 Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 15+ ([Download](https://www.postgresql.org/download/))
- **Razorpay Account** (for payments) - [Sign up](https://razorpay.com/)
- **Cloudinary Account** (for file storage) - [Sign up](https://cloudinary.com/)

---

## 🚀 Quick Start (5 Steps)

### Step 1: Install PostgreSQL

#### Windows:
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer
3. Set a password for the `postgres` user (remember this!)
4. Keep default port `5432`
5. Ensure "PostgreSQL Server" is checked to start automatically

#### Mac:
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE studyvault;

# Exit
\q
```

### Step 3: Install Dependencies

```bash
cd Backend
npm install
```

### Step 4: Configure Environment

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your credentials
# Windows: notepad .env
# Mac/Linux: nano .env
```

**Required Configuration:**
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/studyvault?schema=public"
JWT_SECRET="your-super-secret-key-at-least-32-characters-long"
```

Replace `YOUR_PASSWORD` with the PostgreSQL password you set in Step 1.

### Step 5: Setup Database & Start Server

```bash
# Run migrations to create tables
npm run db:migrate

# Seed the database with test data
npm run db:seed

# Start the development server
npm run dev
```

✅ **Server should now be running on http://localhost:5000**

---

## 🧪 Test the Installation

Visit http://localhost:5000/health

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-12-08T...",
  "environment": "development"
}
```

---

## 🔑 Test Credentials

After running `npm run db:seed`, you can use these accounts:

| Role | Email | Password |
|------|-------|----------|
| Seller | seller@studyvault.com | Test@123 |
| Buyer | buyer@studyvault.com | Test@123 |
| Admin | admin@studyvault.com | Test@123 |

---

## 📦 Optional Features Setup

### Razorpay (Payment Gateway)

1. Sign up at https://razorpay.com/
2. Get API keys from Dashboard → Settings → API Keys
3. Add to `.env`:
   ```env
   RAZORPAY_KEY_ID="rzp_test_XXXXXXXXXX"
   RAZORPAY_KEY_SECRET="YOUR_SECRET_KEY"
   ```

### Cloudinary (File Storage)

1. Sign up at https://cloudinary.com/
2. Get credentials from Dashboard
3. Add to `.env`:
   ```env
   CLOUDINARY_CLOUD_NAME="your_cloud_name"
   CLOUDINARY_API_KEY="your_api_key"
   CLOUDINARY_API_SECRET="your_api_secret"
   ```

---

## 📝 Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm run start        # Start production server
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with test data
npm run db:reset     # Reset database (WARNING: deletes all data)
npm run db:studio    # Open Prisma Studio (database GUI)
```

---

## 🐛 Troubleshooting

### "P1001: Can't reach database server"

**Problem**: PostgreSQL is not running or connection details are wrong

**Solutions**:
1. Check if PostgreSQL is running:
   - Windows: Open Services, look for "postgresql"
   - Mac: `brew services list`
   - Linux: `sudo systemctl status postgresql`

2. Verify your `DATABASE_URL` in `.env`
3. Test connection: `psql -U postgres -d studyvault`

### "Missing required environment variables"

**Problem**: `.env` file not configured properly

**Solution**:
1. Ensure `.env` file exists in `Backend/` directory
2. Check that `DATABASE_URL` and `JWT_SECRET` are set
3. No quotes around values in `.env` file

### "Port 5000 already in use"

**Problem**: Another application is using port 5000

**Solution**:
Change the port in `.env`:
```env
PORT=5001
```

### Module not found errors

**Problem**: Dependencies not installed

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 API Documentation

### Authentication

**Register**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Get Current User**
```http
GET /api/auth/me
Authorization: Bearer YOUR_JWT_TOKEN
```

### Notes

**List Notes**
```http
GET /api/notes?page=1&limit=20&degree=BTech&semester=3
```

**Get Single Note**
```http
GET /api/notes/:id
```

**Create Note** (Seller only)
```http
POST /api/notes
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "Data Structures Notes",
  "description": "Complete DSA notes",
  "subject": "Computer Science",
  ...
}
```

### Categories
```http
GET /api/categories
```

### Universities
```http
GET /api/universities
GET /api/universities/:id
```

### Search
```http
GET /api/search?query=algorithm&degree=BTech&sortBy=rating
```

---

## 🔐 Security Notes

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Change JWT_SECRET** in production to a strong random string
3. **Use HTTPS** in production
4. **Keep dependencies updated**: `npm audit fix`

---

## 📞 Need Help?

- Check the main documentation in `/docs`
- Review the battle plan in the brain directory
- Check error logs in console output

---

## ✅ Success Checklist

- [ ] PostgreSQL installed and running
- [ ] Database created (`studyvault`)
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] Migrations run (`npm run db:migrate`)
- [ ] Database seeded (`npm run db:seed`)
- [ ] Server starts without errors (`npm run dev`)
- [ ] Health endpoint responds (`/health`)
- [ ] Can login with test credentials

**Once all boxes are checked, your backend is ready! 🎉**

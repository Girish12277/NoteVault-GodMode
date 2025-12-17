# StudyVault Backend API

Production-ready Node.js + Express + Prisma + PostgreSQL backend for StudyVault Notes Marketplace.

## ✨ Features

- 🔐 **Authentication**: JWT-based auth with bcrypt password hashing
- 👥 **Role-Based Access**: Buyer, Seller, and Admin roles
- 📝 **Notes Management**: Full CRUD with field validation
- 🔍 **PostgreSQL Full-Text Search**: Fast and efficient note search
- ⭐ **Review System**: Verified purchase reviews with transaction linking
- 💰 **Commission Calculation**: Automatic tier-based commission (10-15%)
- 🏛️ **Multi-University Support**: Indian universities and colleges
- 🌐 **Bilingual**: English and Hindi support
- 🔒 **Security**: Helmet, CORS, rate limiting, input validation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone and navigate**
   ```bash
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Secure random string (min 32 chars)
   - Other optional services (Cloudinary, Razorpay, SMTP)

4. **Create database**
   ```bash
   createdb studyvault_db
   ```

5. **Run migrations**
   ```bash
   npm run migrate
   npm run generate
   ```

6. **Seed database**
   ```bash
   npm run seed
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

Server runs on `http://localhost:5000`

## 📦 Project Structure

```
Backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding
├── src/
│   ├── config/
│   │   └── database.ts        # Prisma client
│   ├── controllers/           # Request handlers
│   │   ├── authController.ts
│   │   ├── categoryController.ts
│   │   ├── noteController.ts
│   │   ├── reviewController.ts
│   │   └── searchController.ts
│   ├── middleware/
│   │   └── auth.ts            # JWT + role verification
│   ├── routes/                # API endpoints
│   │   ├── authRoutes.ts
│   │   ├── categoryRoutes.ts
│   │   ├── noteRoutes.ts
│   │   ├── universityRoutes.ts
│   │   ├── searchRoutes.ts
│   │   ├── reviewRoutes.ts
│   │   └── additionalRoutes.ts
│   └── server.ts              # Express app
├── package.json
├── tsconfig.json
└── .env.example
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (auth required)

### Categories
- `GET /api/categories` - List all categories with note counts

### Universities
- `GET /api/universities` - List all active universities

### Notes
- `GET /api/notes` - List notes (with filters)
- `GET /api/notes/:id` - Get single note
- `POST /api/notes` - Create note (seller only)
- `PUT /api/notes/:id` - Update note (seller only)
- `DELETE /api/notes/:id` - Soft delete note (seller only)

### Search
- `GET /api/search` - Search notes with filters & sorting

### Reviews
- `GET /api/reviews/:noteId` - List note reviews
- `POST /api/reviews/:noteId` - Create review (purchased users only)

### Seller
- `GET /api/seller/dashboard` - Seller statistics

### Admin
- `GET /api/admin/dashboard` - Admin statistics

## 🧪 Test Credentials

After seeding, use these credentials:

- **Seller**: seller@studyvault.com / Test@123
- **Buyer**: buyer@studyvault.com / Test@123
- **Admin**: admin@studyvault.com / Test@123

## 📊 Database Models

- **User** - Authentication & profiles
- **Category** - Note categories (8 seeded)
- **University** - Educational institutions (3 seeded)
- **Note** - Digital notes with pricing
- **Review** - Purchase-verified reviews
- **Transaction** - Payment records
- **Purchase** - Watermarked file access
- **SellerWallet** - Earnings management

## 🛠️ Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run seed         # Seed database
npm run migrate      # Run migrations
npm run generate     # Generate Prisma client
npm run studio       # Open Prisma Studio
npm run db:push  # Push schema changes
npm run db:reset     # Reset database
```

## 🔒 Security Features

- ✅ JWT authentication with 7-day expiry
- ✅ bcrypt password hashing (10 rounds)
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Role-based access control
- ✅ Input validation
- ✅ Soft deletes for data safety

## 🌍 Environment Variables

See `.env.example` for all required variables:

- **Required**: DATABASE_URL, JWT_SECRET, PORT
- **Optional**: Cloudinary, Razorpay, SMTP for full features

## 📝 Commission Tiers

Automatic calculation based on page count:
- 1-50 pages: **15% commission**
- 51-150 pages: **12% commission**
- 151+ pages: **10% commission**

## 🚢 Production Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Set environment to production:
   ```bash
   export NODE_ENV=production
   ```

3. Run migrations:
   ```bash
   npm run migrate:deploy
   ```

4. Start server:
   ```bash
   npm start
   ```

## 📚 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **ORM**: Prisma 5.x
- **Authentication**: JWT + bcryptjs
- **Language**: TypeScript
- **Security**: Helmet, CORS

## 🐛 Troubleshooting

**Database connection fails**
- Check DATABASE_URL in .env
- Verify PostgreSQL is running
- Ensure database exists

**Seed script errors**
- Run `npm run generate` first
- Check all required fields are present
- Verify migrations are up to date

**JWT errors**
- Ensure JWT_SECRET is set (min 32 chars)
- Check token format in Authorization header

## 📄 License

MIT

## 👨‍💻 Author

StudyVault Team

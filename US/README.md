# US – Service Management & Customer Support Platform

A complete internal business management platform for coordinating home appliance repair technicians with customers.

---

## Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Database Setup](#database-setup)
6. [Admin Account Setup](#admin-account-setup)
7. [Running the Application](#running-the-application)
8. [User Roles](#user-roles)
9. [Key Features](#key-features)
10. [Project Structure](#project-structure)
11. [API Documentation](#api-documentation)
12. [Security Notes](#security-notes)
13. [Data Backup](#data-backup)

---

## Overview

**US** helps your company's Admin and Support Team:
- Register and manage customer calls.
- Maintain a verified technician database.
- Instantly find nearby technicians based on service requirements and customer location.
- Assign technicians and monitor all service requests from one platform.

---

## Tech Stack

| Layer      | Technology                                           |
|------------|------------------------------------------------------|
| Frontend   | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui  |
| Backend    | Node.js, Express.js, JWT Auth                        |
| Database   | MySQL 8+                                             |
| ORM/Driver | mysql2                                               |
| File Store | Local private disk (multer)                          |

---

## Prerequisites

- **Node.js** v18 or higher → https://nodejs.org
- **MySQL** 8.0 or higher → https://dev.mysql.com/downloads/
- **npm** (comes with Node.js)
- A terminal (PowerShell, Command Prompt, or bash)

---

## Installation

### 1. Clone or download the project

```bash
# If using git:
git clone <your-repo-url>
cd US
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Backend Environment

```bash
# Copy the example env file
copy .env.example .env
```

Edit `.env` and fill in your values:

```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=us_platform
JWT_SECRET=generate-a-random-64-char-string-here
JWT_EXPIRES_IN=8h
COOKIE_SECRET=another-random-secret
UPLOAD_PATH=./uploads
MAX_FILE_SIZE_MB=10
FRONTEND_URL=http://localhost:5173
```

> **Generate a secure JWT secret:**
> ```
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 4. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 5. Configure Frontend Environment

```bash
copy .env.example .env
```

The default `.env` contents:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

## Database Setup

### 1. Create the database and tables

Make sure MySQL is running, then from the `backend` directory:

```bash
cd backend
npm run migrate
```

This runs `migrations/001_create_tables.sql` which creates the `us_platform` database and all tables.

### 2. (Optional) Load sample data

```bash
npm run seed
```

This inserts:
- 5 service categories
- 3 support staff accounts
- 10 technicians in Pune
- 5 sample customers and calls

> **Sample support staff credentials (after seeding):**
> - Email: `support1@us.local` / Password: `Support@123`
> - Email: `support2@us.local` / Password: `Support@123`

---

## Admin Account Setup

The admin account must be set up via the API **after** migrations run:

```bash
# With the backend running, call:
curl -X POST http://localhost:5000/api/v1/auth/setup-admin \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Admin\",\"email\":\"admin@yourcompany.com\",\"password\":\"YourSecurePassword123!\"}"
```

Or use Postman / any REST client:
- **URL**: `POST http://localhost:5000/api/v1/auth/setup-admin`
- **Body (JSON)**:
  ```json
  {
    "name": "Admin",
    "email": "admin@yourcompany.com",
    "password": "YourSecurePassword123!"
  }
  ```

> This endpoint only works **once** — it fails if an admin account already exists.

---

## Running the Application

### Start the Backend

```bash
cd backend
npm run dev
```
Backend runs at: `http://localhost:5000`

### Start the Frontend

```bash
cd frontend
npm run dev
```
Frontend runs at: `http://localhost:5173`

Open your browser and go to: **http://localhost:5173**

---

## User Roles

### Admin
- Full platform access
- Manage support staff accounts
- View and verify technician documents
- Access all reports and analytics
- View all customer and technician data
- System settings

### Support Team
- Register customer calls
- Search and find technicians
- Assign technicians to requests
- Update service request status
- View their own performance reports
- **Cannot** access Admin settings, employee management, or sensitive documents

---

## Key Features

### 📞 Customer Call Management
- Unique Call ID auto-generated (US-CALL-YYYYMMDD-XXXX)
- Duplicate mobile detection
- Complete customer history
- Multi-step call registration workflow

### 🔧 Technician Management
- Full profile with skills, service areas, documents
- Consent-based document collection
- Secure document storage (not publicly accessible)
- Verification workflow

### 📍 Smart Nearest Technician Finder
- Matches by service category + area + PIN code
- Haversine distance formula when GPS coordinates available
- Fallback to area/city/PIN matching without GPS
- Shows top 5 ranked results with match type badge

### 📊 Analytics & Reports
- Interactive charts (calls over time, category breakdown, area demand)
- Employee performance tracking
- Export to Excel/CSV
- Admin vs Support role-specific dashboards

### 🔒 Security
- JWT in httpOnly cookies
- bcrypt password hashing
- Role-based access control (backend enforced)
- Private document storage
- Activity audit logs
- Rate limiting
- SQL injection prevention (parameterized queries)
- Input validation

---

## Project Structure

```
US/
├── backend/
│   ├── src/
│   │   ├── app.js                  # Express app entry
│   │   ├── config/                 # DB, multer config
│   │   ├── controllers/            # Route handlers
│   │   ├── middleware/             # Auth, RBAC, validation
│   │   ├── models/                 # DB query functions
│   │   ├── routes/                 # Express routers
│   │   └── utils/                  # Helpers
│   ├── migrations/                 # SQL schema files
│   ├── seeds/                      # Sample data
│   ├── uploads/                    # Private document storage
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/                    # Axios API modules
    │   ├── components/
    │   │   ├── ui/                 # shadcn/ui components
    │   │   ├── layout/             # Sidebar, TopNav, Layout
    │   │   └── shared/             # Reusable components
    │   ├── pages/                  # All application pages
    │   ├── store/                  # Auth context
    │   ├── types/                  # TypeScript interfaces
    │   └── lib/                    # Utilities
    ├── .env.example
    └── package.json
```

---

## API Documentation

Base URL: `http://localhost:5000/api/v1`

All protected routes require authentication (JWT cookie).

| Method | Path                              | Role           | Description                  |
|--------|-----------------------------------|----------------|------------------------------|
| POST   | /auth/login                       | Public         | Login                        |
| POST   | /auth/logout                      | Auth           | Logout                       |
| GET    | /auth/me                          | Auth           | Get current user             |
| POST   | /auth/setup-admin                 | Public (once)  | Create first admin           |
| GET    | /customers                        | Auth           | List customers               |
| POST   | /customers                        | Auth           | Create customer              |
| GET    | /customers/:id                    | Auth           | Customer details             |
| GET    | /calls                            | Auth           | List calls                   |
| POST   | /calls                            | Auth           | Create call                  |
| GET    | /technicians                      | Auth           | List technicians             |
| POST   | /technicians                      | Admin          | Add technician               |
| GET    | /technicians/find                 | Auth           | Find nearest technicians     |
| POST   | /documents/:techId                | Admin          | Upload document              |
| GET    | /documents/:techId                | Auth           | List documents (metadata)    |
| GET    | /documents/download/:docId        | Admin          | Download document            |
| GET    | /service-requests                 | Auth           | List service requests        |
| PUT    | /service-requests/:id/status      | Auth           | Update request status        |
| POST   | /service-requests/:id/assign      | Auth           | Assign technician            |
| GET    | /analytics/dashboard              | Auth           | Dashboard stats              |
| GET    | /analytics/export                 | Admin          | Export report                |
| GET    | /activity                         | Admin          | Activity logs                |
| GET    | /notifications                    | Auth           | User notifications           |

---

## Security Notes

1. **Never commit your `.env` file** — it contains secrets.
2. **Document uploads** are stored in `backend/uploads/` which is NOT served as static files.
3. **Aadhaar documents** are only accessible by Admin users and every access is logged.
4. **Passwords** are hashed with bcrypt (cost factor 12).
5. **JWT tokens** expire after 8 hours by default.
6. **Rate limiting**: 100 requests per 15 minutes globally, 5 per 15 minutes on auth endpoints.

---

## Data Backup

### MySQL Backup

```bash
# Backup
mysqldump -u root -p us_platform > backup_YYYYMMDD.sql

# Restore
mysql -u root -p us_platform < backup_YYYYMMDD.sql
```

### Document Backup

Copy the `backend/uploads/` directory to your backup location.

---

## Troubleshooting

**MySQL connection error**: Check DB_HOST, DB_USER, DB_PASSWORD in `.env`.

**Port already in use**: Change PORT in backend `.env` or kill the process using that port.

**CORS errors**: Ensure FRONTEND_URL in backend `.env` matches your frontend URL exactly.

**File upload errors**: Ensure `backend/uploads/documents/` directory exists and is writable.

---

*Built with ❤️ for US Service Management Platform*


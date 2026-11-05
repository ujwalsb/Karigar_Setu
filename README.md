# Karigar_Setu

**Karigar Setu** is an end-to-end appliance repair, technician dispatch, and service management platform designed for home service operations.

---

## 🚀 Key Features

- **Call Logging & Booking**: Multi-step call intake for customer requirements, appliance categories, urgency levels, and automated scheduling.
- **Intelligent Technician Dispatch**: Filter and assign verified technicians by location, skill set, experience, and real-time availability status.
- **WhatsApp Messaging & Templates**: Fully customizable WhatsApp dispatch notifications and work completion report links with interactive variable tags.
- **Technician Monetization & Billing**:
  - **Commission-Based Plan**: Automatic commission accrual (% or flat ₹) upon job completion with outstanding dues and collection tracking.
  - **Monthly Subscription Plan**: Validity tracking, duration reminders, and renewal management (+30, +60, +90 days).
  - **Financial Ledgers**: Comprehensive chronological transaction statement of dues, collections, and subscriptions.
- **Work Report & Photo Verification**: Public link for technicians to submit final billing, parts replaced, and machine repair proof photo.
- **Role-Based Access Control**:
  - **Administrator**: Full platform access, settings, analytics, logs, user management, and technician billing.
  - **Support Staff**: Call registration, customer management, technician assignment, and status updates.
- **Staff Management**: Add, update, toggle active status, and soft-delete support agents and administrators.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Shadcn UI components.
- **Backend**: Node.js, Express.js, MySQL 8.x, JWT Authentication, Multer file upload.
- **Database**: MySQL (`us_platform`).

---

## 📦 Project Structure

```
Karigar_Setu/
├── US/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/          # Database, Multer, App configs
│   │   │   ├── controllers/     # Route logic (calls, technicians, plans, users, etc.)
│   │   │   ├── middleware/      # Auth, RBAC, Validation
│   │   │   ├── models/          # SQL queries & DB models
│   │   │   └── routes/          # Express API route endpoints
│   │   ├── migrations/          # Schema migrations
│   │   ├── seeds/               # Initial seed data
│   │   └── package.json
│   │
│   └── frontend/
│       ├── src/
│       │   ├── api/             # Axios API client modules
│       │   ├── components/      # UI components & modals
│       │   ├── pages/           # Admin & staff application views
│       │   ├── store/           # Auth and settings state stores
│       │   └── types/           # TypeScript interfaces & types
│       ├── index.html
│       ├── vite.config.ts
│       └── package.json
└── README.md
```

---

## ⚙️ Getting Started

### 1. Database Setup
Ensure MySQL is running and create the database:
```sql
CREATE DATABASE us_platform;
```
Import migrations from `US/backend/migrations/` and optional seeds from `US/backend/seeds/`.

### 2. Backend Setup
```bash
cd US/backend
npm install
cp .env.example .env
# Configure DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, PORT
npm start
```

### 3. Frontend Setup
```bash
cd US/frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📄 License
ISC


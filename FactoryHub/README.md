# FactoryHub

A full-stack garment factory management system. FactoryHub helps a clothing factory manage its daily operations in one place: products, inventory, invoices, payments, checks, customer accounts and returns, with user authentication and role-based access.

Repository: https://github.com/Ananas035/NTI-WEB/tree/main/FactoryHub

## Features

- **Authentication and roles** - Signup and login with JWT authentication (7-day tokens) and bcryptjs password hashing. Both signup and login are completed through a one-time email verification code (OTP): a usable JWT is issued only after the code is verified. Role-based access control: admin-only actions are protected by middleware (for example, only admins can create, update or delete products).
- **Password reset** - Forgot-password flow by email: request a reset code, verify it, then set a new password. Unauthenticated by design, with single-use reset authorization.
- **Rate limiting** - Auth routes (signup, login and all OTP/reset endpoints) are rate limited with express-rate-limit to reduce abuse.
- **Factory profile** - Factory identity settings (name, contact details, logo) with logo image upload; readable by authenticated users, writable by admins only.
- **Products** - Create, list, update and delete products, with lookup by model code and product image upload (Multer).
- **Inventory** - Track inventory transactions for factory stock.
- **Invoices** - Create invoices and retrieve them by invoice number.
- **Payments and checks** - Record payments and checks, including marking a check as collected.
- **Customer accounts** - Manage customers, their account transactions and per-customer account statements (period reports).
- **Returns** - Handle product returns.
- **Dashboard** - Frontend dashboard tying the modules together.
- **Bilingual interface** - Frontend language switcher with a translation pipe (Arabic/English), including the verification, reset and settings screens.
- **Automated tests** - Backend test scripts covering the OTP flow, password reset, factory profile and account statement.

## Tech stack

**Backend** (in `FactoryHub/Backend`)

- Node.js, Express 5
- MongoDB with Mongoose
- JWT (jsonwebtoken) and bcryptjs for authentication
- Nodemailer for verification and reset emails
- express-rate-limit for auth rate limiting
- Multer for image uploads
- CORS, dotenv, nodemon (dev)

**Frontend** (in `FactoryHub/factory-frontend`)

- Angular 21 with TypeScript
- Tailwind CSS
- RxJS
- Route guard (auth guard) and HTTP auth interceptor
- Vitest and Prettier (dev)

## Project structure

```
FactoryHub/
  Backend/
    config/        Database connection
    controllers/   Request handlers per module
    middleware/    Auth, role, rate-limit and upload middleware
    models/        Mongoose models (User, OtpChallenge, PasswordReset, FactoryProfile, Product, Customer, Invoice, Payment, Check, Return, InventoryTransaction, AccountTransaction)
    routes/        Express routers per module
    scripts/       Migration script for legacy user accounts
    services/      OTP and email (Nodemailer) services
    tests/         Backend test scripts (OTP, password reset, factory profile, account statement)
    uploads/       Uploaded product and logo images (served statically)
    server.js      Entry point
  factory-frontend/
    src/app/
      components/  Header, sidebar
      guards/      Auth guard
      interceptors/ Auth interceptor
      pages/       Dashboard, products, invoices, returns, accounts, inventory, login, signup, verify-otp, forgot-password, verify-reset-otp, reset-password, factory-settings
      services/    API, auth, language and factory-profile services
      pipes/       Translate pipe
```

## Getting started

### Prerequisites

- Node.js and npm
- A MongoDB connection string
- An SMTP account for verification and reset emails

### Backend

```bash
cd FactoryHub/Backend
npm install
```

Create a `.env` file in `FactoryHub/Backend`:

```
MONGODB_URI=<your MongoDB connection string>
DB_NAME=<your database name>
JWT_SECRET=<your JWT secret>
PORT=5000   # optional, defaults to 5000

# Email delivery for OTP and password reset codes
SMTP_HOST=<your SMTP host>
SMTP_PORT=587
SMTP_SECURE=false   # true for implicit TLS (usually port 465)
SMTP_USER=<your SMTP username>
SMTP_PASS=<your SMTP password>
SMTP_FROM=<sender address, e.g. FactoryHub <no-reply@example.com>>
```

The server checks the SMTP configuration at startup and warns if it is incomplete; the API still boots, but OTP emails cannot be sent until SMTP is configured.

Run the server:

```bash
npm start      # production
npm run dev    # with nodemon
```

The API runs on `http://localhost:5000` and serves uploaded images under `/uploads`.

### Backend tests

```bash
npm test              # all backend test scripts
npm run test:otp      # email OTP flow
npm run test:reset    # password reset flow
npm run test:factory  # factory profile
npm run test:statement  # account statement
```

### Frontend

```bash
cd FactoryHub/factory-frontend
npm install
npm start
```

The Angular app runs on `http://localhost:4200` (the backend CORS origin is configured for it).

## API overview

Only the unauthenticated flow endpoints are public: `signup`, `login`, `verify-email-otp`, `resend-email-otp`, `forgot-password`, `verify-reset-otp`, `resend-reset-otp` and `reset-password`. Every other route requires a valid JWT (`Authorization` header), including `GET /api/auth/profile`. Admin-only routes also require the `ADMIN` role, including `GET /api/auth/admin`. Signup, login and all OTP/reset endpoints are rate limited.

| Route | Description |
| --- | --- |
| `POST /api/auth/signup` | Create a user account; starts email verification (no token issued yet) |
| `POST /api/auth/login` | Verify credentials; starts email verification (no token issued yet) |
| `POST /api/auth/verify-email-otp` | Complete signup or login; issues the JWT |
| `POST /api/auth/resend-email-otp` | Re-send the email verification code |
| `POST /api/auth/forgot-password` | Request a password reset code by email |
| `POST /api/auth/verify-reset-otp` | Verify the reset code and get a single-use reset authorization |
| `POST /api/auth/resend-reset-otp` | Re-send the password reset code |
| `POST /api/auth/reset-password` | Set a new password using the reset authorization |
| `GET /api/auth/profile` | Current user profile |
| `GET /api/auth/admin` | Admin-only check |
| `GET/PUT /api/factory-profile` | Factory identity settings (update is admin-only) |
| `POST /api/factory-profile/logo` | Upload or replace the factory logo (admin-only) |
| `GET/POST /api/products` | List or create products (create is admin-only, supports image upload) |
| `GET/PATCH/DELETE /api/products/code/:modelCode` | Read, update or delete a product by model code (update/delete admin-only) |
| `GET/POST /api/invoices`, `GET /api/invoices/:invoiceNumber` | Invoices |
| `GET/POST /api/customers`, `GET/PATCH/DELETE /api/customers/:id` | Customers (delete is admin-only) |
| `GET/POST /api/inventory`, `POST /api/inventory/restock/:modelCode`, `GET /api/inventory/model/:modelCode` | Inventory (create and restock are admin-only) |
| `GET /api/accounts/customer/:customerId` | Customer account transactions |
| `GET /api/accounts/customer/:customerId/statement` | Customer account statement (period report) |
| `POST /api/payments` | Record a payment |
| `GET/POST /api/checks`, `GET /api/checks/:checkNumber`, `PATCH /api/checks/:checkNumber/collect` | Checks, including marking a check as collected |
| `GET/POST /api/returns`, `GET /api/returns/:returnNumber` | Returns |

---


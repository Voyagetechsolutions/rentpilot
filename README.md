# Nook

**Nook** is a modern property management platform built with Next.js, designed to help landlords manage their rental properties efficiently.

## Features

### Core Features
- **Property & Unit Management** - Organize properties and units with detailed information
- **Tenant Management** - Track tenant information, invite tenants via email
- **Lease Management** - Create and manage leases with escalation rates, renewal tracking
- **Rent Collection** - Track rent charges, payments, and outstanding balances
- **Online Payments** - Paystack integration for tenant payments
- **Maintenance Requests** - Tenants can submit and track maintenance tickets
- **Document Storage** - Upload and organize property documents

### Phase 2 Features (New)
- **Inspection System** - Move-in/out/periodic inspections with room-by-room checklists
- **Deposit Management** - Track deposits with SA Prime Rate interest calculation
- **Notifications** - In-app notifications for rent due, lease expiry, maintenance updates
- **Lease Enhancements** - Escalation rates, pets/parking options, renewal workflow
- **Utilities Billing** - Meter readings and usage-based charges
- **Tenant Screening** - Credit checks, affordability ratios, risk scoring

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (via Neon)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Payments**: Paystack
- **Styling**: Tailwind CSS

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (copy `.env.example` to `.env`)

4. Push database schema:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. Seed the database (creates admin user):
   ```bash
   npm run seed
   ```

6. Run the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

## Default Admin Credentials

- **Email**: admin@nookpms.com
- **Password**: Admin@123

⚠️ Change the password after first login!

## Deployment

Deploy on [Vercel](https://vercel.com) for the best Next.js experience.

## License

MIT

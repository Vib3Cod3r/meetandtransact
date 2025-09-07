# Production Deployment Guide

## Database Setup

### Option 1: Fresh Production Database (Recommended)

1. **Delete existing database** (if any):
   ```bash
   rm server/data/database.sqlite
   ```

2. **Run production setup**:
   ```bash
   npm run setup-production
   ```

3. **Verify schema**:
   ```bash
   npm run verify-schema
   ```

### Option 2: Migrate Existing Database

If you have an existing database that needs updating:

1. **Run migration**:
   ```bash
   npm run migrate
   ```

2. **Verify schema**:
   ```bash
   npm run verify-schema
   ```

## Environment Configuration

1. **Copy environment template**:
   ```bash
   cp env.example .env
   ```

2. **Configure production settings** in `.env`:
   ```env
   # Required for production
   SERVICE_HOST=https://yourdomain.com
   
   # Email configuration (required for verification emails)
   SMTP_HOST=your-smtp-host
   SMTP_PORT=587
   SMTP_USER=your-email@domain.com
   SMTP_PASS=your-email-password
   
   # Optional: Set admin password
   ADMIN_PASSWORD=your-secure-password
   ```

## Database Schema

The production database includes these tables:

- **appointments**: Stores appointment slots with status tracking
- **users**: User information including key serial numbers
- **bookings**: Links users to appointments
- **admin_users**: Admin authentication
- **email_verifications**: Email verification codes
- **appointment_history**: Audit trail of all appointment actions

## Key Features

- ✅ Email verification required for bookings
- ✅ Single active appointment per user
- ✅ Key management system
- ✅ Appointment history tracking
- ✅ Timezone handling (UK time)
- ✅ Rate limiting for verification emails
- ✅ Admin dashboard with full management

## Security Notes

- Change default admin password after first login
- Use strong SMTP credentials
- Set SERVICE_HOST to your actual domain
- Consider using HTTPS in production

## Troubleshooting

If you get "no such column" errors:

1. **Check if migration is needed**:
   ```bash
   npm run verify-schema
   ```

2. **Run migration if needed**:
   ```bash
   npm run migrate
   ```

3. **Or start fresh**:
   ```bash
   rm server/data/database.sqlite
   npm run setup-production
   ```

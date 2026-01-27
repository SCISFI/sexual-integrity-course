# Sexual Integrity Curriculum - 16-Week Program Application

## Overview

A comprehensive 16-week Sexual Integrity curriculum program web application designed for therapists and clients. The application features role-based access (Admin, Therapist, Client), weekly lessons combining CBT (weeks 1-8) and ACT (weeks 9-16) content, time-based week unlocking, daily self-monitoring tools, and integrated Stripe payment processing.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **January 2026 (Latest - Content & Features)**:
  - **Homework Tracking System**:
    - Trackable checklists for weekly homework assignments
    - Auto-save with 500ms debounce to reduce API calls
    - Database persistence via `homework_completions` table
    - Therapist visibility in client progress view
    - API: GET/PUT /api/progress/homework/:week
  - **Crisis Resources Component**:
    - Persistent button on all week pages
    - Emergency contacts: 988 Lifeline, Crisis Text Line, 911
    - Recovery support links: SAA, Celebrate Recovery, S-Anon
  - **Enhanced Curriculum Content**:
    - Week 6: Trauma-informed content (ACEs, CSBD connection, referral guidance)
    - Week 8: Partner/relationship support (disclosure, trust rebuilding, betrayal trauma)
    - Week 10: Technology safety (accountability software, device management)
    - Week 11: Valued Living Assessment (VLQ-inspired) with 10 life domains
    - Week 16: Post-program relapse guidance and ongoing support resources

- **January 2026 (UI/Testing)**:
  - **Masculine Professional Color Scheme**: Deep navy blues, cyan accents, charcoal tones
    - Light mode: Navy primary (215 50% 23%), cyan accent (199 89% 48%)
    - Dark mode: Matching professional dark theme
    - Sidebar: Dark navy background with light text
  - **Enhanced Login Page**: Split-screen layout with mountain hero image
    - Motivational messaging: "Your journey to freedom begins here"
    - Feature badges: Evidence-based, Professional support, Confidential
    - Responsive: Hero hidden on mobile, form adapts
  - **Tester Accounts Created**:
    - Therapist: therapist.tester@example.com (password: testpass123)
    - Client: client.tester@example.com (password: testpass123)
    - Client is assigned to therapist for testing workflows

- **January 2026 (Features)**:
  - Therapist licensing requirements: Added licenseState, licenseNumber, licenseAttestation fields
  - Client registration now requires selecting a therapist (auto-selects if only one available)
  - Admin panel enhancements:
    - Client search functionality
    - Unassigned clients badge indicator
    - Therapist reassignment in edit dialog
    - Revenue by Therapist tab for kickback calculations
    - Input validation on client update and therapist departure endpoints
  - Therapist dashboard: Added client search functionality
  - Therapist departure handling: API endpoint to reassign all clients when therapist leaves (with role validation)
  - Revenue tracking: Payments now capture assigned therapist ID for kickback calculations
  - Secure payment confirmation: Week payments are verified with Stripe before recording
    - Checkout session ID passed from Stripe redirect
    - Server verifies specific session with Stripe API (payment_status, userId, weekNumber)
    - Idempotency enforced via stripePaymentId storage
    - Therapist ID captured from Stripe metadata for accurate revenue tracking

- **January 2026 (Prior)**:
  - Role-based registration (Therapist/Client separation)
  - Stripe integration for subscriptions and per-week payments
  - Admin panel with user management, fee waivers, and therapist-client assignments
  - Therapist dashboard with client progress monitoring, feedback system with tabs for progress/check-ins/reflections/feedback
  - Time-based week unlocking (7-day intervals from client start date)
  - AI-powered encouragement and technique reminders (uses Replit AI Integrations - no API key needed, charges billed to credits)
  - Therapist feedback system for clients (general, week-specific, or check-in feedback)
  - Complete password management system:
    - User self-service password reset via email (Gmail integration)
    - Admin-managed password resets for any user
    - Change password feature for logged-in users (all roles)

## System Architecture

### User Roles

1. **Admin**: Full system access, user management, fee waivers, therapist-client assignments
2. **Therapist**: View assigned clients, monitor progress, subscription-based access ($49/month)
3. **Client**: Access curriculum weeks, complete lessons, per-week payments ($14.99/week)

### Frontend Architecture
- **Framework**: React 18 with Vite as the build tool
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state, React Context for auth state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Form Handling**: React Hook Form with Zod validation

Key Pages:
- `/login` - User login
- `/register/therapist` - Therapist registration
- `/register/client` - Client registration (requires therapist access code)
- `/forgot-password` - Request password reset email
- `/reset-password?token=X` - Reset password with token
- `/change-password` - Change password for logged-in users
- `/dashboard` - Client curriculum dashboard
- `/week/:weekNumber` - Individual week lesson content
- `/therapist-home` - Therapist dashboard with client list
- `/therapist/clients/:clientId` - Individual client progress view
- `/admin` - Admin panel for user and system management

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js with Local Strategy
- **Session Storage**: PostgreSQL-backed via connect-pg-simple
- **Payments**: Stripe integration via stripe-replit-sync

Server Modules:
- `server/index.ts` - Entry point, middleware, Stripe initialization
- `server/routes.ts` - API route definitions
- `server/auth.ts` - Passport configuration
- `server/storage.ts` - Data access layer
- `server/stripeClient.ts` - Stripe client and sync setup
- `server/stripeService.ts` - Stripe operations (checkout sessions)
- `server/webhookHandlers.ts` - Stripe webhook processing
- `server/aiService.ts` - AI-powered encouragement and technique reminders
- `server/emailService.ts` - Email service for password reset notifications (Gmail integration)

### Database Schema

Core Tables:
- `users`: id, email, password, name, role, startDate, therapistId, accessCode, allFeesWaived, stripeCustomerId, stripeSubscriptionId
- `week_completions`: id, userId, weekNumber, completedAt
- `daily_checkins`: id, userId, dateKey, morningChecks, haltChecks, urgeLevel, moodLevel, eveningChecks, journalEntry
- `week_reflections`: id, userId, weekNumber, q1-q4, updatedAt
- `therapist_clients`: therapistId, clientId, createdAt
- `therapist_feedback`: id, therapistId, clientId, weekNumber, feedbackType, content, createdAt
- `week_fee_waivers`: id, clientId, weekNumber, adminId, createdAt
- `password_reset_tokens`: id, userId, token, expiresAt, used, createdAt (1-hour expiration, single-use)
- `homework_completions`: id, userId, weekNumber, completedItems (JSON array of indices), updatedAt (unique on userId/weekNumber)

Stripe Schema (managed by stripe-replit-sync):
- `stripe.products`, `stripe.prices`, `stripe.customers`, `stripe.subscriptions`, etc.

### Stripe Integration

Products:
- **Therapist Monthly Subscription**: $49/month recurring
- **Weekly Lesson Access**: $14.99 one-time payment per week

Fee Waivers:
- Admin can set `allFeesWaived` flag on user for complete fee bypass
- Admin can grant per-week waivers via `week_fee_waivers` table

API Endpoints:
- `GET /api/stripe/config` - Get price IDs for frontend
- `POST /api/payments/checkout/subscription` - Create therapist subscription checkout
- `POST /api/payments/checkout/week` - Create client week payment checkout
- `POST /api/stripe/webhook` - Stripe webhook handler (registered before express.json)

### AI Encouragement

The AI encouragement system uses Replit AI Integrations (OpenAI-compatible API) without requiring a separate API key. Charges are billed to Replit credits.

Features:
- **Encouragement messages**: Personalized motivational messages based on current week and user progress
- **Technique reminders**: Brief explanations of CBT/ACT techniques for the current week
- **Strict boundaries**: AI is limited to encouragement only - will not engage with crisis situations, provide medical advice, or discuss specific behaviors

API Endpoints:
- `GET /api/ai/encouragement?week=N` - Get AI encouragement for specified week
- `GET /api/ai/technique?week=N&technique=name` - Get technique reminder

Components:
- `client/src/components/AIEncouragement.tsx` - Displays encouragement and technique reminders on week pages

### Week Unlocking Logic

- Week 1 is always available once client has a start date
- Subsequent weeks unlock 7 days after the previous week's unlock date
- Formula: `unlockDate = startDate + ((weekNumber - 1) * 7 days)`
- Fee payment required before accessing paid content (unless waived)

## Environment Variables

Required:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session signing secret

Managed by Replit Connectors:
- Stripe API keys (via stripe-replit-sync)

## Development

- Run: `npm run dev` (starts Express + Vite)
- Database Push: `npm run db:push`
- Seed Stripe Products: `npx tsx scripts/seed-stripe-products.ts`

## Key Technical Notes

1. Stripe webhook route must be registered BEFORE express.json() middleware
2. The stripe-replit-sync package handles automatic data sync from Stripe
3. All week access checks should verify both time-unlock AND payment status
4. Therapists must have active subscription to manage clients

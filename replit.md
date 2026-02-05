# Sexual Integrity Curriculum - 16-Week Program Application

## Overview

A comprehensive 16-week web application designed to deliver a Sexual Integrity curriculum, integrating CBT (weeks 1-8) and ACT (weeks 9-16) principles. It supports role-based access for Admins, Therapists, and Clients, features time-based content unlocking, daily self-monitoring tools, and integrated payment processing. The application aims to provide a structured, supportive environment for clients while enabling therapists to monitor progress and manage their caseload effectively.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application is built with a React frontend (Vite, Wouter, TanStack React Query, Tailwind CSS, shadcn/ui, React Hook Form with Zod) and an Express.js backend (TypeScript, Passport.js for authentication, PostgreSQL for session storage).

### User Roles

1.  **Admin**: Full system access, user management, fee waivers, therapist-client assignments.
2.  **Therapist**: Access to assigned client progress, feedback system, subscription-based.
3.  **Client**: Access to curriculum weeks, complete lessons, daily check-ins, homework, per-week payments.

### Frontend Architecture

-   **Framework**: React 18 with Vite.
-   **Routing**: Wouter.
-   **State Management**: TanStack React Query for server state, React Context for authentication.
-   **Styling**: Tailwind CSS with shadcn/ui.
-   **Form Handling**: React Hook Form with Zod validation.
-   **Key Pages**: Login, registration (Therapist/Client), password management, client dashboard, individual week lessons, therapist dashboard, admin panel.
-   **UI/UX**: Masculine professional color scheme (deep navy blues, cyan accents, charcoal tones) with responsive design and enhanced login page featuring a split-screen layout and motivational messaging.
-   **Client Onboarding**: A 4-step walkthrough for new clients explaining program structure, daily check-ins, week unlocking, and support resources.

### Backend Architecture

-   **Framework**: Express.js with TypeScript.
-   **Authentication**: Passport.js Local Strategy.
-   **Session Storage**: PostgreSQL-backed via `connect-pg-simple`.
-   **Payments**: Stripe integration via `stripe-replit-sync`.
-   **Email Service**: Gmail integration for password reset notifications.
-   **AI Service**: Replit AI Integrations for personalized encouragement and technique reminders.

### Database Schema

Core tables include `users` (id, email, password, role, subscription status, etc.), `week_completions`, `daily_checkins`, `week_reflections`, `homework_completions`, `therapist_clients`, `therapist_feedback`, `week_fee_waivers`, and `password_reset_tokens`. Stripe-related data is managed by `stripe-replit-sync`.

### Feature Specifications

-   **Curriculum Delivery**: 16-week program with CBT (weeks 1-8) and ACT (weeks 9-16) content.
-   **Week Unlocking Logic**: Weeks unlock sequentially, 7 days after the previous week's unlock date, with payment required for paid content unless waived.
-   **Daily Check-ins**: A unified daily check-in system covering recovery, wellness, relationships, values, integrity, HALT-BS check (Hungry, Angry, Lonely, Tired, Bored, Stressed), mood/urge levels, and optional journal entries.
-   **Homework Tracking**: Trackable checklists for weekly assignments with therapist visibility.
-   **Reflection Forms**: Auto-saving functionality for client reflections.
-   **Crisis Resources**: Persistent component with emergency contacts and recovery support links.
-   **Account Management**: Clients can deactivate accounts, therapists can cancel subscriptions.
-   **Admin & Therapist Tools**: Admin can manage users, waive fees, delete clients, and track revenue. Therapists can view client progress (homework, reflections, check-ins, feedback), provide feedback, and search clients.
-   **AI Encouragement**: Personalized motivational messages and technique reminders using Replit AI Integrations, adhering to strict boundaries (no crisis intervention or medical advice).

## External Dependencies

-   **Stripe**: For subscription management (Therapists: $49/month) and per-week payments (Clients: $14.99/week). Utilizes `stripe-replit-sync` for integration and webhooks.
-   **PostgreSQL**: Primary database for user data, curriculum progress, and session storage.
-   **Replit AI Integrations**: Used for AI-powered encouragement and technique reminders without requiring separate API keys.
-   **Gmail**: Integrated for sending password reset emails and week completion notifications to therapists.

## Recent Changes (February 2026)

-   **AI-Powered Feedback Generation**: Therapists can generate AI draft feedback using Gemini that references client reflections, journal entries, and check-in data. The draft is editable before sending.
-   **Client Feedback Notifications**: Clients receive email notifications when their therapist provides feedback.
-   **Mandatory Therapist Review System**: When clients complete weeks, their assigned therapist is notified via email. Therapists must review client progress through the Pending Reviews section on their dashboard. Admin can track overdue reviews (>48 hours) in a dedicated tab.
-   **User Manual**: Downloadable PDF manual accessible via /user-manual route, linked from client dashboard Support Resources section.
-   **HALT-BS Extended Check-in**: Daily check-in now tracks 6 vulnerability states (Hungry, Angry, Lonely, Tired, Bored, Stressed) instead of the original 4.
-   **Week Page Design**: Professional visual styling with gradient hero sections, numbered topic badges, and progress indicators.
# The Integrity Protocol - 16-Week Program Application

## Overview

A 16-week web application delivering a Sexual Integrity curriculum, integrating CBT (weeks 1-8) and ACT (weeks 9-16) principles. It supports role-based access for Admins, Mentors, and Clients, features time-based content unlocking, daily self-monitoring tools, and integrated payment processing. The application aims to provide a structured, supportive environment for clients while enabling mentors to monitor progress and manage their caseload effectively. It is positioned as an educational and personal growth resource, not a substitute for professional mental health treatment.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application uses a React frontend (Vite, Wouter, TanStack React Query, Tailwind CSS, shadcn/ui, React Hook Form with Zod) and an Express.js backend (TypeScript, Passport.js, PostgreSQL). It employs a "Mentor" terminology for user-facing elements while retaining "therapist" in the internal database for backward compatibility. "Not therapy" disclaimers are prominently displayed.

### UI/UX Decisions

-   **Color Scheme**: Masculine professional (deep navy blues, cyan accents, charcoal tones).
-   **Design**: Responsive design with enhanced login, split-screen layout, motivational messaging, and professional visual styling for week pages with gradient hero sections, numbered topic badges, and progress indicators.
-   **Client Onboarding**: A 4-step walkthrough for new clients.
-   **Navigation**: Profile dropdown menu for account management across all dashboards.
-   **Accessibility**: Text-to-Speech integration on lesson pages.

### Technical Implementations

-   **Frontend**: React 18 with Vite, Wouter for routing, TanStack React Query for server state, React Context for authentication, Tailwind CSS with shadcn/ui for styling, React Hook Form with Zod for forms.
-   **Backend**: Express.js with TypeScript, Passport.js for authentication, PostgreSQL for session storage.
-   **Database Schema**: Core tables include `users`, `week_completions`, `daily_checkins`, `week_reflections`, `homework_completions`, `therapist_clients`, `therapist_feedback`, `week_fee_waivers`, and `password_reset_tokens`.
-   **Authentication**: Passport.js Local Strategy.
-   **Email Service**: Gmail integration for notifications (password reset, week completion, feedback).
-   **AI Service**: Replit AI Integrations for personalized encouragement and feedback generation.
-   **Notifications**: Browser push notification system with service worker and VAPID key authentication for daily check-in reminders and mentor feedback alerts.

### Feature Specifications

-   **Curriculum Delivery**: 16-week program with sequential unlocking (7 days after previous week's unlock, with payment/waiver).
-   **User Roles**: Admin (full access), Mentor (client progress, feedback), Client (curriculum, daily check-ins, homework, payments).
-   **Daily Check-ins**: Unified system covering recovery, wellness, relationships, values, integrity, HALT-BS, mood/urge levels, and journal entries.
-   **Homework & Reflections**: Trackable homework checklists, auto-saving reflection forms, and differentiated reflection questions for specific weeks.
-   **Mentor Tools**: View client progress, provide feedback on weeks, check-ins, and autopsies; generate AI draft feedback, track overdue reviews, and manage clients.
-   **Admin Tools**: User management, fee waivers, client deletion, revenue tracking, and editing of any feedback.
-   **AI-Powered Features**: Personalized encouragement, technique reminders, and draft feedback generation (including relapse autopsy analysis and trend analysis) with anti-hallucination instructions.
-   **Client Account Management**: Account deactivation, subscription cancellation, crisis resources, and user manual access.
-   **Analytics**: Client-specific analytics page for mentors/admins with trend analysis for check-in data.
-   **Feedback System**: Clients receive email notifications for mentor feedback, mentors can provide per-check-in feedback, and items are auto-marked reviewed upon feedback submission.

## External Dependencies

-   **Stripe**: For subscription management and per-week payments, integrated via `stripe-replit-sync`.
-   **PostgreSQL**: Primary database for all application data and session storage.
-   **Replit AI Integrations**: Used for AI-powered encouragement, personalized reminders, and AI draft feedback generation.
-   **Gmail**: Utilized for sending various email notifications (password resets, completion alerts, feedback alerts).
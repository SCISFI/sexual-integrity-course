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
-   **Database Schema**: Core tables include `users`, `week_completions`, `daily_checkins`, `week_reflections`, `homework_completions`, `therapist_clients`, `therapist_feedback` (extended with `status`, `sent_at`, `subject`), `week_fee_waivers`, `password_reset_tokens`, and `dismissed_guidance_suggestions`.
-   **Authentication**: Passport.js Local Strategy.
-   **Email Service**: Gmail integration for notifications (password reset, week completion, feedback).
-   **AI Service**: Replit AI Integrations for personalized encouragement and feedback generation. Gemini client is a module-level singleton via `getAiClient()` in `server/aiService.ts` — used by all 6 AI endpoints in `routes.ts`.
-   **Notifications**: Browser push notification system with service worker and VAPID key authentication for daily check-in reminders and mentor feedback alerts.
-   **Daily Check-in Date**: Uses local wall-clock date (`getLocalDateKey()`) not UTC, so users in US timezones get the correct date after 8pm.
-   **Canonical Routes**: `/therapist` is the single canonical mentor dashboard URL. `/daily-checkin` is the single canonical check-in URL. Dead routes (`/checkin`, `/therapist-home`, `/protected`) have been removed.

### Feature Specifications

-   **Curriculum Delivery**: 16-week program with sequential unlocking (7 days after previous week's unlock, with payment/waiver).
-   **User Roles**: Admin (full access), Mentor (client progress, feedback), Client (curriculum, daily check-ins, homework, payments).
-   **Daily Check-ins**: Unified system covering recovery, wellness, relationships, values, integrity, HALT-BS, mood/urge levels, and journal entries.
-   **Homework & Reflections**: Trackable homework checklists, auto-saving reflection forms, and differentiated reflection questions for specific weeks.
-   **Mentor Tools**: View client progress, send messages to clients, track overdue reviews, manage clients. **Guidance tab** on each client's detail page surfaces rule-based, prioritized suggestions (urgent / follow-up / curriculum / recognition). Each suggestion has a "Write Message" button that opens an inline compose panel with an AI-generated draft — mentor reviews and edits before saving as a draft or sending. Draft messages persist and surface in a draft inbox on the Guidance tab. Non-urgent suggestions can be dismissed with "Mark Addressed". Relevant endpoints: `/api/therapist/clients/:clientId/suggestions`, `/api/therapist/clients/:clientId/generate-guidance-message`, `/api/therapist/clients/:clientId/messages/drafts`, `/api/therapist/clients/:clientId/dismiss-suggestion`, `/api/therapist/clients/:clientId/feedback` (POST/PUT). **Required messages**: Week completions and Relapse Autopsies require a mentor message before being marked reviewed — "Send Message" button on each item opens a Sheet panel with AI draft; sending also fires the review endpoint. **General unsolicited message**: "New Message" button on the client header card opens the same Sheet compose panel with a blank form (feedbackType='general').
-   **Admin Tools**: User management (create/edit/delete mentors and clients), fee waivers, client deletion, revenue tracking, editing of any feedback. Admins can edit mentor name, email, and password via the Mentors tab Edit button (PATCH `/api/admin/therapists/:id` accepts `name`, `email`, `newPassword`).
-   **AI-Powered Features**: Personalized encouragement, technique reminders, and draft feedback generation (including relapse autopsy analysis and trend analysis) with anti-hallucination instructions.
-   **Client Account Management**: Account deactivation, subscription cancellation, crisis resources, and user manual access.
-   **Analytics**: Client-specific analytics page for mentors/admins with trend analysis for check-in data.
-   **Mentor Message System**: Terminology: "Message" (not "feedback") in all mentor/client UI. `therapist_feedback` table stores messages with status (draft/sent), sentAt, and subject fields. Guidance-tab-originated messages use `feedbackType='guidance'` and trigger the branded `sendMentorMessage()` email (full body in email, navy/slate design). Clients only see `status='sent'` messages. `dismissed_guidance_suggestions` table allows mentors to dismiss non-urgent suggestions per client. Draft messages persist and are surfaced in the Guidance tab draft inbox.

## External Dependencies

-   **Stripe**: For subscription management and per-week payments, integrated via `stripe-replit-sync`.
-   **PostgreSQL**: Primary database for all application data and session storage.
-   **Replit AI Integrations**: Used for AI-powered encouragement, personalized reminders, and AI draft feedback generation.
-   **Gmail**: Utilized for sending various email notifications (password resets, completion alerts, feedback alerts).
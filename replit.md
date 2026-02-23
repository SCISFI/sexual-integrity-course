# The Integrity Protocol - 16-Week Program Application

## Overview

A comprehensive 16-week web application designed to deliver a Sexual Integrity curriculum, integrating CBT (weeks 1-8) and ACT (weeks 9-16) principles. It supports role-based access for Admins, Mentors, and Clients, features time-based content unlocking, daily self-monitoring tools, and integrated payment processing. The application aims to provide a structured, supportive environment for clients while enabling mentors to monitor progress and manage their caseload effectively.

## Important Terminology Note

All user-facing text uses "Mentor" instead of "Therapist" to avoid implying professional licensure. The internal database schema retains `therapist` naming (e.g., `therapist_clients`, `therapist_feedback`, user role `"therapist"`) for backward compatibility. When adding new user-facing features, always use "Mentor" in the UI, emails, and documentation. References to external professional therapists (e.g., "seek a licensed therapist") remain as "therapist" in curriculum content since they refer to actual licensed professionals.

A "not therapy" disclaimer appears on all key entry points: login, registration pages, onboarding modal, and home page footer. The standard disclaimer text is: "This program is an educational and personal growth resource. It is not therapy, counseling, or a substitute for professional mental health treatment."

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application is built with a React frontend (Vite, Wouter, TanStack React Query, Tailwind CSS, shadcn/ui, React Hook Form with Zod) and an Express.js backend (TypeScript, Passport.js for authentication, PostgreSQL for session storage).

### User Roles

1.  **Admin**: Full system access, user management, fee waivers, mentor-client assignments.
2.  **Mentor** (DB role: `therapist`): Access to assigned client progress, feedback system, subscription-based.
3.  **Client**: Access to curriculum weeks, complete lessons, daily check-ins, homework, per-week payments.

### Frontend Architecture

-   **Framework**: React 18 with Vite.
-   **Routing**: Wouter.
-   **State Management**: TanStack React Query for server state, React Context for authentication.
-   **Styling**: Tailwind CSS with shadcn/ui.
-   **Form Handling**: React Hook Form with Zod validation.
-   **Key Pages**: Login, registration (Mentor/Client), password management, client dashboard, individual week lessons, mentor dashboard, admin panel.
-   **UI/UX**: Masculine professional color scheme (deep navy blues, cyan accents, charcoal tones) with responsive design and enhanced login page featuring a split-screen layout and motivational messaging.
-   **Client Onboarding**: A 4-step walkthrough for new clients explaining program structure, daily check-ins, week unlocking, and support resources. Includes "not therapy" disclaimer.

### Backend Architecture

-   **Framework**: Express.js with TypeScript.
-   **Authentication**: Passport.js Local Strategy.
-   **Session Storage**: PostgreSQL-backed via `connect-pg-simple`.
-   **Payments**: Stripe integration via `stripe-replit-sync`.
-   **Email Service**: Gmail integration for password reset notifications, week completion notifications, and feedback notifications. All emails include login page links and "not therapy" disclaimers.
-   **AI Service**: Replit AI Integrations for personalized encouragement and technique reminders.

### Database Schema

Core tables include `users` (id, email, password, role, subscription status, etc.), `week_completions`, `daily_checkins`, `week_reflections`, `homework_completions`, `therapist_clients`, `therapist_feedback`, `week_fee_waivers`, and `password_reset_tokens`. Stripe-related data is managed by `stripe-replit-sync`. Note: DB tables/columns use `therapist` naming internally while the UI shows "Mentor."

### Feature Specifications

-   **Curriculum Delivery**: 16-week program with CBT (weeks 1-8) and ACT (weeks 9-16) content.
-   **Week Unlocking Logic**: Weeks unlock sequentially, 7 days after the previous week's unlock date, with payment required for paid content unless waived.
-   **Daily Check-ins**: A unified daily check-in system covering recovery, wellness, relationships, values, integrity, HALT-BS check (Hungry, Angry, Lonely, Tired, Bored, Stressed), mood/urge levels, and optional journal entries.
-   **Homework Tracking**: Trackable checklists for weekly assignments with mentor visibility.
-   **Reflection Forms**: Auto-saving functionality for client reflections.
-   **Crisis Resources**: Persistent component with emergency contacts and recovery support links.
-   **Account Management**: Clients can deactivate accounts, mentors can cancel subscriptions.
-   **Admin & Mentor Tools**: Admin can manage users, waive fees, delete clients, and track revenue. Mentors can view client progress (homework, reflections, check-ins, feedback), provide feedback, and search clients.
-   **AI Encouragement**: Personalized motivational messages and technique reminders using Replit AI Integrations, adhering to strict boundaries (no crisis intervention or medical advice).

## External Dependencies

-   **Stripe**: For subscription management (Mentors: $49/month) and per-week payments (Clients: $14.99/week). Utilizes `stripe-replit-sync` for integration and webhooks.
-   **PostgreSQL**: Primary database for user data, curriculum progress, and session storage.
-   **Replit AI Integrations**: Used for AI-powered encouragement and technique reminders without requiring separate API keys.
-   **Gmail**: Integrated for sending password reset emails, week completion notifications to mentors, and feedback notifications to clients.

## Recent Changes (February 2026)

-   **Mentor Terminology**: All user-facing "Therapist" references renamed to "Mentor" across frontend, backend messages, email templates, and curriculum content. Internal DB schema unchanged.
-   **Not Therapy Disclaimers**: Added to login page, all registration pages, onboarding modal, and home page footer.
-   **Email Login Links**: All email templates (password reset, password changed, week completion, feedback notification) now include direct login page links and "not therapy" disclaimers.
-   **AI-Powered Feedback Generation**: Mentors can generate AI draft feedback using Gemini that references client reflections, journal entries, and check-in data. The draft is editable before sending.
-   **Client Feedback Notifications**: Clients receive email notifications when their mentor provides feedback.
-   **Mandatory Mentor Review System**: When clients complete weeks, their assigned mentor is notified via email. Mentors must review client progress through the Pending Reviews section on their dashboard. Admin can track overdue reviews (>48 hours) in a dedicated tab.
-   **User Manual**: Downloadable PDF manual accessible via /user-manual route, linked from client dashboard Support Resources section.
-   **HALT-BS Extended Check-in**: Daily check-in now tracks 6 vulnerability states (Hungry, Angry, Lonely, Tired, Bored, Stressed) instead of the original 4.
-   **Week Page Design**: Professional visual styling with gradient hero sections, numbered topic badges, and progress indicators.
-   **Exercise Answer Persistence**: All exercise fields (text inputs, textareas, selects, radio buttons) now auto-save to database via `exercise_answers` table with JSON storage, using debounced 1-second saves and save-on-unmount.
-   **Client Feedback Viewing**: Clients can view mentor feedback directly on their dashboard with badges indicating feedback type and formatted timestamps.
-   **Daily Check-in Tooltips**: All 8 daily check-in items have hover tooltips explaining what each item means and why it matters for recovery.
-   **Mentor Journal Prompt Visibility**: Mentors and admins can now see the daily journal prompt that was shown to clients alongside their journal entries. Uses deterministic day-of-year calculation via `getPromptForDate()`.
-   **Profile Dropdown Navigation**: All dashboards (client, mentor, admin) now use a profile dropdown menu instead of scattered icon buttons. Cancel account/subscription moved deeper into dropdown. Menu shows user name and email.
-   **Web Push Notifications**: Browser push notification system with service worker (`client/public/sw.js`), VAPID key authentication, and per-user notification preferences. Features: daily check-in reminders with customizable time (UTC), mentor feedback alerts, opt-in/opt-out support. Scheduler runs every minute checking for due reminders. Tables: `push_subscriptions`, `notification_preferences`.
-   **Text-to-Speech**: Browser-based Speech Synthesis API integration on lesson pages (`TextToSpeech.tsx`) with play/pause/stop controls. No external service required.
-   **Urge Surfing Crisis Resources**: Updated from suicide hotline references to recovery-appropriate resources (mentor, accountability partner, meetings).
-   **Enhanced AI Feedback**: AI draft feedback now cross-references homework completions, exercise answers, and reflection depth to flag minimal effort or incomplete work.
-   **Per-Check-in Mentor Feedback**: Mentors can give feedback on individual daily check-ins via `checkinDateKey` field in `therapist_feedback` table. UI shows feedback inline in the check-ins tab.
-   **Differentiated Reflection Questions**: Weeks 2, 5, 6, 7, 8 have unique reflection prompts (trigger patterns, shame exploration, future self vision, boundary assertiveness, advice to Day 1 self).
-   **Feedback Type Consistency**: All feedback types standardized to `"week"`, `"checkin"`, `"general"`, and `"autopsy"` across admin, mentor, and client interfaces.
-   **Relapse Autopsy Mentor Review**: Mentors can view, review, and provide feedback on client relapse autopsies. Schema adds `reviewedByTherapist` and `reviewedAt` columns. Dedicated "Autopsies" tab on mentor client page with full detail expansion, Mark Reviewed action, and AI-generated feedback with trend analysis (recurring triggers, frequency patterns, escalation detection). Urgency indicators: animated badge on tab, alert banner on client page, and alert pill on mentor dashboard client list.
-   **Trend-Aware AI Feedback**: All AI feedback generators (week, check-in, autopsy) use pre-computed trend analysis via `server/trendAnalysis.ts` with research-based rules: minimum 5 entries required for trend detection, MCID threshold of 2.0 points on 0-10 scale, all-same value detection, streak counting, first-half vs second-half comparison. Anti-hallucination instructions prevent AI from contradicting pre-computed statistics. Input is always sorted by dateKey ascending internally.
-   **Client Analytics for Mentors/Admins**: Analytics page (`/analytics/:clientId`) is viewable by mentors and admins for their assigned/any clients. Routes: GET `/api/therapist/clients/:clientId/checkin-stats`, GET `/api/therapist/clients/:clientId/completions`, and admin equivalents. Navigation links from mentor and admin client detail pages.
-   **Admin Feedback Editing**: Admins can edit any feedback comment via PUT /api/admin/feedback/:id. Edited comments show "Edited by Admin" indicator with timestamp across admin, mentor, and client views. Schema adds `edited_at` and `edited_by` columns to `therapist_feedback`.
-   **Auto-Mark Reviewed on Feedback**: When a mentor submits feedback on a check-in, reflection, or exercise, the item is automatically marked as reviewed in `mentor_item_reviews`. No separate "Mark Reviewed" step needed after providing feedback.
-   **Unreviewed Item Counts on Mentor Dashboard**: Mentor dashboard now shows per-client amber badges with counts of unreviewed check-ins, reflections, and exercises (via GET /api/therapist/unreviewed-items). Batch-optimized queries avoid N+1 performance issues.

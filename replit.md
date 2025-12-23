# AuthStarter - Next.js Authentication Application

## Overview

This is a full-stack authentication starter application built with React (Vite) on the frontend and Express.js on the backend. The application provides user registration, login, session management, and protected routes. It uses PostgreSQL for data persistence with Drizzle ORM and implements session-based authentication with Passport.js.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with Vite as the build tool
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state, React Context for auth state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **Form Handling**: React Hook Form with Zod validation
- **Design System**: Material Design 3 inspired with light/dark theme support

The frontend follows a pages-based structure under `client/src/pages/` with reusable components in `client/src/components/`. The UI components are built on Radix UI primitives with custom styling.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js with Local Strategy (email/password)
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **Password Hashing**: bcrypt
- **API Design**: RESTful endpoints under `/api/auth/*`

The server follows a modular structure:
- `server/index.ts` - Application entry point and middleware setup
- `server/routes.ts` - API route definitions
- `server/auth.ts` - Passport configuration and authentication logic
- `server/storage.ts` - Data access layer using repository pattern
- `server/db.ts` - Database connection setup

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between frontend and backend)
- **Migrations**: Managed via drizzle-kit (`npm run db:push`)

Database schema includes:
- `users` table: id (UUID), email, password (hashed), name, createdAt
- `sessions` table: Managed by connect-pg-simple for session persistence

### Shared Code
The `shared/` directory contains code used by both frontend and backend:
- Database schema definitions
- Zod validation schemas for forms
- TypeScript type exports

### Build System
- Development: Vite dev server with HMR proxied through Express
- Production: Vite builds static assets, esbuild bundles server code
- Output: `dist/` directory with `public/` for static files and `index.cjs` for server

## External Dependencies

### Database
- **PostgreSQL**: Required for user data and session storage
- **Connection**: Via `DATABASE_URL` environment variable

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `passport` / `passport-local`: Authentication framework
- `express-session` / `connect-pg-simple`: Session management
- `bcrypt`: Password hashing
- `@tanstack/react-query`: Server state management
- `zod`: Runtime validation
- Radix UI primitives: Accessible component foundations

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session signing (defaults to development value)

### Replit-Specific Integrations
- `@replit/vite-plugin-runtime-error-modal`: Error overlay in development
- `@replit/vite-plugin-cartographer`: Development tooling
- `@replit/vite-plugin-dev-banner`: Development environment indicator
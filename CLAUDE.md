# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on port 8080
npm run build        # Production build
npm run lint         # Run ESLint
npm run test         # Run unit tests (Vitest)
npm run test:watch   # Run tests in watch mode
npx playwright test  # Run E2E tests
```

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite + SWC, React Router v6
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI primitives), Framer Motion
- **Data fetching**: TanStack React Query (caching + mutations)
- **Backend**: Supabase (PostgreSQL + Auth + RLS + Edge Functions)
- **Forms**: React Hook Form + Zod validation
- **Rich text**: TipTap editor
- **Charts**: Recharts

## Architecture

### SPA Structure

The app is a single-page application with 7 main views controlled by `useNavigation()`:
`command_center`, `employees`, `org_chart`, `statistics`, `academy`, `settings`, `admin_scale`

Entry: `src/main.tsx` → `src/App.tsx` → `src/pages/Index.tsx` (main router/layout).

### Data Layer Pattern

Custom hooks in `src/hooks/` wrap TanStack React Query to interact with Supabase:
```
Component → useXxx() hook → React Query → supabase client → PostgreSQL
```

Key hooks: `useAuth`, `useEmployees`, `useDepartments`, `useStatistics`, `useNavigation`.

### Supabase Integration

- Client: `src/integrations/supabase/client.ts`
- Generated types: `src/integrations/supabase/types.ts`
- All tables use Row-Level Security (RLS). Use `has_role()` security definer function in policies.
- Database migrations: `supabase/migrations/` (16 files, numbered chronologically)

### Path Alias

Use `@/` for imports from `src/`: e.g., `import { Button } from "@/components/ui/button"`

### Role System

Roles: `admin`, `moderator`, `user`, `supervisor`, `author` — stored in `user_roles` table.
First user to sign up is automatically assigned `admin` role (via trigger).

### Key Domain Modules

- **Employees** (`src/components/employees/`): Personnel, reports, birthdays, onboarding, documents, candidates — 6 sub-tabs
- **Academy** (`src/components/academy/`): Courses → Sections → Modules → Steps hierarchy; also Programs, Glossary, course versioning
- **Statistics** (`src/components/statistics/`): KPI tracking with conditions (danger/normal/power), time-series values
- **OrgChart** (`src/components/orgchart/`): Department hierarchy visualization

### UI Conventions

- All UI primitives come from `src/components/ui/` (shadcn/ui)
- Toast notifications via `sonner` (use `toast.success()`, `toast.error()`)
- CSS variables for theme colors (e.g., `--primary`, `--sidebar-*`) defined in `src/index.css`
- Dark mode via class-based Tailwind (`dark:`)
- Fonts: Space Grotesk (headings), Inter (body)

### Type Definitions

Core domain types: `src/types/index.ts`
Database row types: `src/integrations/supabase/types.ts` (auto-generated — do not edit manually)

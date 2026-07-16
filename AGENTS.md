# 🤖 AI AGENT OPERATIONAL MANUAL (AGENTS.md)
## PMO Monitoring & Governance Application

This document is an absolute standard operating procedure (SOP) manual that must be followed by every AI Agent, Copilot, or Developer Assistant (including GPT-4, Claude, v0, Cursor, and Cline) when modifying or writing new code in this project.

---

## 1. DIRECTORY GOLDEN RULE (FLAT DIRECTORY CONSTRAINT)

This project uses a **Flat Folder** architecture directly at the root level for ease of context tracking by the AI.

- **STRICTLY PROHIBITED TO CREATE OR USE A `src/` FOLDER**.
- All new files must be placed consistently in the following root directory structure:

```text
/app              # Page routes & Layouts (Next.js App Router)
/components       # Reusable UI Components (Tailwind CSS, shadcn/ui style)
/services         # Business logic layer & Supabase data access
  └── governance/ # Specific logic for variance calculation & warning engine
/lib              # Third-party helpers & client/server initializers (Supabase Client)
/hooks            # Custom React hooks (auth, data-fetching, etc.)
/types            # TypeScript interfaces & type definitions
```

## 2. GOVERNANCE & SECURITY RULES (GOVERNANCE GUARDRAILS)

### A. Strict Read-Only Monitoring Dashboard
- The Governance Stream area (project health, variance charts, indicator tables) must be purely visual/informative for users with the `project_team` and `project_manager` roles.
- NEVER render interactive elements for data manipulation (such as `<input>`, `<select>`, `<textarea>`, edit buttons, or submit buttons) in the monitoring dashboard area for non-PMO users.
- Sensitive governance action buttons (like Resolve Warning) MUST be wrapped using a `<RoleGuard>` component and can only be displayed if the system validates the user has the `pmo` role.

### B. Logic-Driven Status Only
- UI components in `/components/` serve purely to render finalized data.
- All mathematical calculations, percentage deviation calculations for delays, cost overruns, and color status threshold logic (green, yellow, red) must be placed isolated within `/services/governance/comparator.ts`.

### C. Row Level Security (RLS) Compliance
- Whenever writing data manipulation logic (CRUD), you must assume that the tables are protected by the following RLS policies:
  - Governance Tables: Read (SELECT) is open to authenticated users, Write/Modify (INSERT/UPDATE/DELETE) can only be done by the `pmo` role.
  - Operational Tables: Project team members can only update the progress of their own tasks within the registered project.

## 3. CODE & TYPESCRIPT WRITING STANDARDS

- **Strictly No `any`**: All function parameters, states, and data responses from Supabase must have explicit data types or interfaces defined in `/types/index.ts`.
- **Client vs Server Components**: Use React Server Components (RSC) by default for initial data fetching at the page level (`/app`). Use `'use client'` sparingly only for interactive leaf components.
- **UI/UX Design**: Follow a warm color palette (warm tones), soft cream/neutral background, wide rounded corners for card panels (`rounded-3xl` or `rounded-[2rem]`), and subtle shadows (`shadow-xl`).
- **Form UI/UX (Placeholders)**: Always ensure placeholders in forms (inputs, selects, textareas, dates) are clearly visible and have high contrast. Use dynamic styling for `<select>` so that empty/placeholder states are visually distinct (e.g., `!value ? 'text-slate-500 font-medium' : 'text-slate-900 font-semibold'`), and add `placeholder:text-slate-400` or `placeholder:text-slate-500` to all text/number inputs.

## 4. AGENT WORKFLOW BEFORE WRITING CODE

Before you (AI Agent) provide code line recommendations or create new files, perform these steps sequentially:

- **Step 1**: Read the `PROJECT_CONTEXT.md` file to understand the feature context and run checks in `TODO_LIST.md` to see the current task position.
- **Step 2**: Conduct an internal "Governance Readiness" audit to ensure there are no loopholes in write access privileges leaking to non-PMO users in the code you are about to create.
- **Step 3**: Write code modularly, isolated between UI (`/components`) and Business Logic (`/services`), and ensure the Next.js build is safe from TypeScript compilation errors.

Use this document together with `PROJECT_CONTEXT.md` as your primary compass in building the PMO Monitoring & Governance system.
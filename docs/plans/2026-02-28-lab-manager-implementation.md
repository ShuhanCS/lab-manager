# Lab Manager — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an open-source lab management tool (inventory, equipment, budgets) with Next.js 15 + Supabase, deployable on Vercel.

**Architecture:** Next.js 15 App Router frontend with Supabase backend (Postgres + Auth + Realtime + Storage). Multi-tenant via RLS — each lab is isolated. Zustand for client state. TanStack Table for inventory views. Responsive web, mobile-friendly.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, Supabase, Zustand, TanStack Table, Zod, Recharts, PapaParse

**Design Doc:** `docs/plans/2026-02-28-lab-manager-design.md`

---

## Phase 1: Project Scaffold + Supabase Setup

### Task 1: Initialize Next.js project

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `.env.local`, `.env.example`, `.gitignore`

**Step 1: Create the Next.js app**

Run:
```bash
cd C:\Users\Shuha\projects\lab-manager
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --yes
```

Expected: Project scaffolded with Next.js 15, TypeScript, Tailwind, App Router, src/ directory.

**Step 2: Verify it runs**

Run:
```bash
npm run dev
```

Expected: Dev server starts at http://localhost:3000. Kill it after confirming.

**Step 3: Clean up default files**

- Replace `src/app/page.tsx` with a simple "Lab Manager" heading
- Remove default Next.js boilerplate CSS from `src/app/globals.css` (keep Tailwind directives only)

**Step 4: Set up environment variables**

Create `.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Create `.env.local` with actual Supabase credentials (after Task 2).

**Step 5: Add .gitignore entries**

Ensure `.gitignore` includes:
```
.env.local
.env*.local
node_modules/
.next/
```

**Step 6: Commit**

```bash
git add -A
git commit -m "scaffold: Next.js 15 + Tailwind CSS v4 project"
```

---

### Task 2: Create Supabase project + schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

**Step 1: Create Supabase project**

Go to https://supabase.com/dashboard and create a new project named "lab-manager". Copy the URL and anon key into `.env.local`.

Alternatively, if Supabase CLI is installed:
```bash
npx supabase init
```

**Step 2: Write the migration**

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Labs
create table labs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  institution text,
  settings jsonb default '{}',
  created_at timestamptz default now()
);

-- Lab members (join table: user <-> lab)
create table members (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lab_id uuid not null references labs(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')) default 'member',
  joined_at timestamptz default now(),
  unique(user_id, lab_id)
);

-- Locations (hierarchical)
create table locations (
  id uuid primary key default uuid_generate_v4(),
  lab_id uuid not null references labs(id) on delete cascade,
  parent_id uuid references locations(id) on delete set null,
  name text not null,
  type text not null check (type in ('room', 'bench', 'freezer', 'shelf', 'cabinet', 'other')) default 'other',
  created_at timestamptz default now()
);

-- Inventory items
create table inventory_items (
  id uuid primary key default uuid_generate_v4(),
  lab_id uuid not null references labs(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  name text not null,
  description text,
  type text not null check (type in ('equipment', 'reagent', 'consumable', 'chemical')),
  quantity numeric not null default 0,
  unit text not null default 'unit',
  min_threshold numeric default 0,
  location_id uuid references locations(id) on delete set null,
  catalog_number text,
  lot_number text,
  manufacturer text,
  supplier text,
  expiration_date date,
  conductscience_product_id text,
  barcode text,
  status text not null check (status in ('in_stock', 'low_stock', 'out_of_stock', 'expired')) default 'in_stock',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Equipment (extends inventory items where type=equipment)
create table equipment (
  id uuid primary key default uuid_generate_v4(),
  inventory_item_id uuid not null references inventory_items(id) on delete cascade,
  serial_number text,
  model_number text,
  purchase_date date,
  purchase_price numeric,
  warranty_expires date,
  calibration_interval_days integer,
  last_calibrated date,
  status text not null check (status in ('active', 'maintenance', 'decommissioned')) default 'active',
  created_at timestamptz default now()
);

-- Maintenance logs
create table maintenance_logs (
  id uuid primary key default uuid_generate_v4(),
  equipment_id uuid not null references equipment(id) on delete cascade,
  performed_by uuid not null references auth.users(id),
  date date not null default current_date,
  type text not null check (type in ('calibration', 'repair', 'inspection', 'cleaning')),
  description text,
  cost numeric,
  next_due date,
  created_at timestamptz default now()
);

-- Grants / budgets
create table grants (
  id uuid primary key default uuid_generate_v4(),
  lab_id uuid not null references labs(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  name text not null,
  funder text,
  grant_number text,
  total_amount numeric not null,
  start_date date,
  end_date date,
  categories jsonb default '[]',
  created_at timestamptz default now()
);

-- Transactions (purchases linked to grants)
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  grant_id uuid not null references grants(id) on delete cascade,
  inventory_item_id uuid references inventory_items(id) on delete set null,
  amount numeric not null,
  date date not null default current_date,
  description text,
  category text,
  receipt_url text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now()
);

-- Activity log
create table activity_log (
  id uuid primary key default uuid_generate_v4(),
  lab_id uuid not null references labs(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb default '{}',
  created_at timestamptz default now()
);

-- Indexes
create index idx_members_user_id on members(user_id);
create index idx_members_lab_id on members(lab_id);
create index idx_inventory_items_lab_id on inventory_items(lab_id);
create index idx_inventory_items_status on inventory_items(status);
create index idx_equipment_inventory_item_id on equipment(inventory_item_id);
create index idx_maintenance_logs_equipment_id on maintenance_logs(equipment_id);
create index idx_grants_lab_id on grants(lab_id);
create index idx_transactions_grant_id on transactions(grant_id);
create index idx_activity_log_lab_id on activity_log(lab_id);
create index idx_activity_log_created_at on activity_log(created_at desc);

-- Auto-update updated_at on inventory_items
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger inventory_items_updated_at
  before update on inventory_items
  for each row execute function update_updated_at();
```

**Step 3: Apply the migration**

Run via Supabase dashboard SQL editor, or:
```bash
npx supabase db push
```

**Step 4: Commit**

```bash
git add supabase/
git commit -m "db: initial schema — labs, inventory, equipment, grants, activity log"
```

---

### Task 3: Row Level Security (RLS) policies

**Files:**
- Create: `supabase/migrations/002_rls_policies.sql`

**Step 1: Write RLS policies**

```sql
-- Enable RLS on all tables
alter table labs enable row level security;
alter table members enable row level security;
alter table locations enable row level security;
alter table inventory_items enable row level security;
alter table equipment enable row level security;
alter table maintenance_logs enable row level security;
alter table grants enable row level security;
alter table transactions enable row level security;
alter table activity_log enable row level security;

-- Helper function: get user's lab IDs
create or replace function user_lab_ids()
returns setof uuid as $$
  select lab_id from members where user_id = auth.uid()
$$ language sql security definer stable;

-- Helper function: get user's role in a specific lab
create or replace function user_role_in_lab(p_lab_id uuid)
returns text as $$
  select role from members where user_id = auth.uid() and lab_id = p_lab_id
$$ language sql security definer stable;

-- Labs: users can see labs they belong to
create policy "Users can view their labs"
  on labs for select using (id in (select user_lab_ids()));

-- Labs: any authenticated user can create a lab
create policy "Authenticated users can create labs"
  on labs for insert with check (auth.uid() is not null);

-- Labs: only owners can update their lab
create policy "Owners can update their lab"
  on labs for update using (user_role_in_lab(id) = 'owner');

-- Labs: only owners can delete their lab
create policy "Owners can delete their lab"
  on labs for delete using (user_role_in_lab(id) = 'owner');

-- Members: users can see members of their labs
create policy "Users can view lab members"
  on members for select using (lab_id in (select user_lab_ids()));

-- Members: owners and admins can insert members
create policy "Owners and admins can add members"
  on members for insert with check (
    user_role_in_lab(lab_id) in ('owner', 'admin')
  );

-- Members: owners and admins can remove members (not owners)
create policy "Owners and admins can remove members"
  on members for delete using (
    user_role_in_lab(lab_id) in ('owner', 'admin')
    and role != 'owner'
  );

-- Locations: lab members can view
create policy "Lab members can view locations"
  on locations for select using (lab_id in (select user_lab_ids()));

-- Locations: admins and owners can manage locations
create policy "Admins can manage locations"
  on locations for insert with check (
    user_role_in_lab(lab_id) in ('owner', 'admin')
  );
create policy "Admins can update locations"
  on locations for update using (
    user_role_in_lab(lab_id) in ('owner', 'admin')
  );
create policy "Admins can delete locations"
  on locations for delete using (
    user_role_in_lab(lab_id) in ('owner', 'admin')
  );

-- Inventory items: all lab members can view and add
create policy "Lab members can view inventory"
  on inventory_items for select using (lab_id in (select user_lab_ids()));

create policy "Lab members can add inventory"
  on inventory_items for insert with check (lab_id in (select user_lab_ids()));

create policy "Lab members can update inventory"
  on inventory_items for update using (lab_id in (select user_lab_ids()));

-- Inventory items: only admins/owners can delete
create policy "Admins can delete inventory"
  on inventory_items for delete using (
    user_role_in_lab(lab_id) in ('owner', 'admin')
  );

-- Equipment: follows same pattern via inventory_item join
create policy "Lab members can view equipment"
  on equipment for select using (
    inventory_item_id in (
      select id from inventory_items where lab_id in (select user_lab_ids())
    )
  );

create policy "Lab members can add equipment"
  on equipment for insert with check (
    inventory_item_id in (
      select id from inventory_items where lab_id in (select user_lab_ids())
    )
  );

create policy "Lab members can update equipment"
  on equipment for update using (
    inventory_item_id in (
      select id from inventory_items where lab_id in (select user_lab_ids())
    )
  );

-- Maintenance logs: follows equipment access
create policy "Lab members can view maintenance logs"
  on maintenance_logs for select using (
    equipment_id in (
      select e.id from equipment e
      join inventory_items i on e.inventory_item_id = i.id
      where i.lab_id in (select user_lab_ids())
    )
  );

create policy "Lab members can add maintenance logs"
  on maintenance_logs for insert with check (
    equipment_id in (
      select e.id from equipment e
      join inventory_items i on e.inventory_item_id = i.id
      where i.lab_id in (select user_lab_ids())
    )
  );

-- Grants: lab members can view, admins/owners can manage
create policy "Lab members can view grants"
  on grants for select using (lab_id in (select user_lab_ids()));

create policy "Admins can manage grants"
  on grants for insert with check (
    user_role_in_lab(lab_id) in ('owner', 'admin')
  );

create policy "Admins can update grants"
  on grants for update using (
    user_role_in_lab(lab_id) in ('owner', 'admin')
  );

-- Transactions: lab members can view and add
create policy "Lab members can view transactions"
  on transactions for select using (
    grant_id in (
      select id from grants where lab_id in (select user_lab_ids())
    )
  );

create policy "Lab members can add transactions"
  on transactions for insert with check (
    grant_id in (
      select id from grants where lab_id in (select user_lab_ids())
    )
  );

-- Activity log: lab members can view, system inserts
create policy "Lab members can view activity"
  on activity_log for select using (lab_id in (select user_lab_ids()));

create policy "Lab members can insert activity"
  on activity_log for insert with check (lab_id in (select user_lab_ids()));
```

**Step 2: Apply migration**

Run via Supabase dashboard or CLI.

**Step 3: Commit**

```bash
git add supabase/migrations/002_rls_policies.sql
git commit -m "db: RLS policies — multi-tenant lab isolation"
```

---

## Phase 2: Auth + Lab Setup

### Task 4: Supabase client + auth utilities

**Files:**
- Create: `src/lib/supabase/client.ts` (browser client)
- Create: `src/lib/supabase/server.ts` (server client)
- Create: `src/lib/supabase/middleware.ts` (session refresh)
- Create: `src/middleware.ts` (Next.js middleware)
- Create: `src/lib/supabase/types.ts` (generated DB types)

**Step 1: Install Supabase packages**

```bash
cd C:\Users\Shuha\projects\lab-manager
npm install @supabase/supabase-js @supabase/ssr
```

**Step 2: Generate TypeScript types from Supabase schema**

```bash
npx supabase gen types typescript --project-id <your-project-id> > src/lib/supabase/types.ts
```

Or write them manually based on the schema if CLI isn't set up.

**Step 3: Create browser client**

`src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 4: Create server client**

`src/lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* Server Component — ignore */ }
        },
      },
    }
  )
}
```

**Step 5: Create middleware for session refresh**

`src/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login (except auth pages)
  if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/signup') && request.nextUrl.pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
```

**Step 6: Commit**

```bash
git add src/lib/supabase/ src/middleware.ts package.json package-lock.json
git commit -m "feat: Supabase client (browser + server) + auth middleware"
```

---

### Task 5: Auth pages (login, signup, magic link)

**Files:**
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/signup/page.tsx`
- Create: `src/app/(auth)/auth/callback/route.ts`
- Create: `src/components/common/auth-form.tsx`

**Step 1: Install form dependencies**

```bash
npm install zod react-hook-form @hookform/resolvers
```

**Step 2: Create shared auth form component**

`src/components/common/auth-form.tsx` — reusable form with email/password fields, Google OAuth button, magic link toggle. Uses Zod for validation.

Fields:
- Email (required, valid email)
- Password (required for signup, min 8 chars; optional for magic link)
- Mode toggle: password vs magic link
- Google OAuth button
- Submit button

**Step 3: Create login page**

`src/app/(auth)/login/page.tsx` — uses auth-form in login mode. Calls `supabase.auth.signInWithPassword()` or `supabase.auth.signInWithOtp()` for magic link. Redirects to `/` on success.

**Step 4: Create signup page**

`src/app/(auth)/signup/page.tsx` — uses auth-form in signup mode. Calls `supabase.auth.signUp()`. Shows confirmation message if email confirmation is enabled.

**Step 5: Create auth callback handler**

`src/app/(auth)/auth/callback/route.ts` — handles OAuth and magic link redirects. Exchanges code for session, redirects to dashboard.

```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  if (code) {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(origin)
}
```

**Step 6: Test manually**

- Go to `/signup`, create account
- Check Supabase dashboard for new user
- Go to `/login`, sign in
- Verify redirect to home page

**Step 7: Commit**

```bash
git add src/app/\(auth\)/ src/components/common/auth-form.tsx package.json package-lock.json
git commit -m "feat: auth pages — login, signup, magic link, OAuth callback"
```

---

### Task 6: Lab creation + onboarding

**Files:**
- Create: `src/app/(dashboard)/new-lab/page.tsx`
- Create: `src/lib/supabase/labs.ts` (lab CRUD helpers)
- Create: `src/app/(dashboard)/layout.tsx` (dashboard shell)

**Step 1: Create lab helpers**

`src/lib/supabase/labs.ts`:
```typescript
export async function createLab(supabase, { name, institution }) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const { data: lab, error } = await supabase
    .from('labs').insert({ name, slug, institution }).select().single()
  if (error) throw error

  // Add creator as owner
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('members').insert({
    user_id: user.id, lab_id: lab.id, role: 'owner'
  })

  return lab
}

export async function getUserLabs(supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data } = await supabase
    .from('members')
    .select('lab:labs(*), role')
    .eq('user_id', user.id)
  return data
}
```

**Step 2: Create new-lab page**

Simple form: Lab name, Institution (optional). On submit → creates lab → redirects to `/[lab-slug]/inventory`.

**Step 3: Create dashboard layout**

`src/app/(dashboard)/layout.tsx` — authenticated shell with:
- Sidebar: lab name, nav links (Inventory, Equipment, Budgets, Settings)
- Lab switcher dropdown (if user is in multiple labs)
- User menu (profile, logout)
- If user has no labs → redirect to `/new-lab`

**Step 4: Test manually**

- Sign in → see "Create your lab" page
- Create a lab → land on dashboard
- Check Supabase: lab created, member row with role=owner

**Step 5: Commit**

```bash
git add src/app/\(dashboard\)/ src/lib/supabase/labs.ts
git commit -m "feat: lab creation, onboarding flow, dashboard shell with sidebar"
```

---

## Phase 3: Inventory Module

### Task 7: Inventory data layer

**Files:**
- Create: `src/lib/supabase/inventory.ts`
- Create: `src/stores/inventory-store.ts`
- Test: `src/lib/supabase/__tests__/inventory.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/supabase/__tests__/inventory.test.ts
import { describe, it, expect } from 'vitest'
import { validateInventoryItem } from '../inventory'

describe('inventory validation', () => {
  it('rejects items without a name', () => {
    const result = validateInventoryItem({ name: '', type: 'consumable', quantity: 1, unit: 'box' })
    expect(result.success).toBe(false)
  })

  it('accepts valid items', () => {
    const result = validateInventoryItem({ name: 'Pipette Tips', type: 'consumable', quantity: 5, unit: 'box' })
    expect(result.success).toBe(true)
  })

  it('rejects negative quantity', () => {
    const result = validateInventoryItem({ name: 'Gloves', type: 'consumable', quantity: -1, unit: 'box' })
    expect(result.success).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/supabase/__tests__/inventory.test.ts
```
Expected: FAIL — `validateInventoryItem` not defined.

**Step 3: Write inventory helpers**

`src/lib/supabase/inventory.ts`:
- `inventoryItemSchema` — Zod schema for validation
- `validateInventoryItem(data)` — validates input
- `getInventoryItems(supabase, labId, filters?)` — fetch with optional filters (type, status, location, search)
- `createInventoryItem(supabase, labId, data)` — insert + log activity
- `updateInventoryItem(supabase, itemId, data)` — update + log activity
- `updateQuantity(supabase, itemId, delta)` — increment/decrement + auto-update status based on min_threshold
- `deleteInventoryItem(supabase, itemId)` — delete + log activity

**Step 4: Run tests**

```bash
npx vitest run src/lib/supabase/__tests__/inventory.test.ts
```
Expected: PASS

**Step 5: Create Zustand store**

`src/stores/inventory-store.ts`:
```typescript
import { create } from 'zustand'

interface InventoryStore {
  items: InventoryItem[]
  filters: { type?: string; status?: string; search?: string; locationId?: string }
  setItems: (items: InventoryItem[]) => void
  setFilter: (key: string, value: string | undefined) => void
  clearFilters: () => void
}
```

**Step 6: Commit**

```bash
git add src/lib/supabase/inventory.ts src/stores/inventory-store.ts src/lib/supabase/__tests__/
git commit -m "feat: inventory data layer — CRUD, validation, Zustand store"
```

---

### Task 8: Inventory table UI

**Files:**
- Create: `src/app/(dashboard)/[lab-slug]/inventory/page.tsx`
- Create: `src/components/inventory/inventory-table.tsx`
- Create: `src/components/inventory/inventory-filters.tsx`
- Create: `src/components/inventory/status-badge.tsx`

**Step 1: Install TanStack Table**

```bash
npm install @tanstack/react-table
```

**Step 2: Create status badge**

`src/components/inventory/status-badge.tsx` — colored badge for in_stock (green), low_stock (yellow), out_of_stock (red), expired (gray).

**Step 3: Create inventory table**

`src/components/inventory/inventory-table.tsx` — uses TanStack Table with columns:
- Name (sortable)
- Type (filterable badge)
- Quantity + Unit (with +/- buttons inline)
- Location (from joined locations table)
- Status (badge)
- Expiration (date, highlighted if within 30 days)
- Actions (edit, delete)

Sortable, paginated (25 per page). Searchable via top search bar.

**Step 4: Create filters bar**

`src/components/inventory/inventory-filters.tsx`:
- Search input (debounced, searches name/description/catalog_number)
- Type dropdown: all / equipment / reagent / consumable / chemical
- Status dropdown: all / in_stock / low_stock / out_of_stock / expired
- Location dropdown (populated from lab locations)

**Step 5: Create inventory page**

`src/app/(dashboard)/[lab-slug]/inventory/page.tsx` — Server Component that fetches initial data, renders filters + table.

**Step 6: Test manually**

- Navigate to `/[lab-slug]/inventory`
- See empty state with "Add your first item" prompt
- Filters render and are interactive

**Step 7: Commit**

```bash
git add src/app/\(dashboard\)/\[lab-slug\]/inventory/ src/components/inventory/ package.json package-lock.json
git commit -m "feat: inventory table with TanStack Table, filters, status badges"
```

---

### Task 9: Add/edit inventory item form

**Files:**
- Create: `src/components/inventory/item-form.tsx`
- Create: `src/components/inventory/item-form-modal.tsx`
- Create: `src/app/(dashboard)/[lab-slug]/inventory/[item-id]/page.tsx`

**Step 1: Create item form**

`src/components/inventory/item-form.tsx` — Zod-validated form with fields:
- Name (required)
- Description (optional, textarea)
- Type (select: equipment / reagent / consumable / chemical)
- Quantity + Unit
- Min threshold (number — "Alert when below this quantity")
- Location (select from lab locations)
- Catalog number, lot number, manufacturer, supplier (all optional text)
- Expiration date (optional date picker)
- Barcode (optional)

If type=equipment, show additional fields (links to Task 12 — equipment module).

**Step 2: Create modal wrapper**

`src/components/inventory/item-form-modal.tsx` — slide-over or modal that wraps the form. "Add Item" button in inventory page opens it.

**Step 3: Create item detail page**

`src/app/(dashboard)/[lab-slug]/inventory/[item-id]/page.tsx` — full detail view with edit form, activity history for this item, quantity adjustment buttons.

**Step 4: Wire up to inventory page**

- "Add Item" button opens the modal
- Row click navigates to detail page
- Edit button on detail page enables form editing
- Save calls `createInventoryItem` or `updateInventoryItem`
- Activity log entry created automatically

**Step 5: Test manually**

- Click "Add Item" → fill form → save → item appears in table
- Click item → see detail page → edit → save
- Check Supabase: row created, activity_log entry created

**Step 6: Commit**

```bash
git add src/components/inventory/item-form.tsx src/components/inventory/item-form-modal.tsx src/app/\(dashboard\)/\[lab-slug\]/inventory/
git commit -m "feat: add/edit inventory item — form, modal, detail page"
```

---

### Task 10: Quantity tracking + low-stock alerts

**Files:**
- Modify: `src/components/inventory/inventory-table.tsx` (add +/- buttons)
- Create: `src/components/inventory/quantity-adjuster.tsx`
- Create: `src/hooks/use-realtime-inventory.ts`

**Step 1: Create quantity adjuster component**

`src/components/inventory/quantity-adjuster.tsx`:
- Displays current quantity + unit
- +/- buttons that call `updateQuantity(supabase, itemId, +1/-1)`
- On update, auto-checks: if quantity <= min_threshold → set status to `low_stock`
- If quantity == 0 → set status to `out_of_stock`
- If quantity > min_threshold and status was low_stock → set back to `in_stock`

**Step 2: Add inline quantity adjustment to table**

Wire the quantity-adjuster into the inventory table's Quantity column.

**Step 3: Set up Supabase Realtime**

`src/hooks/use-realtime-inventory.ts`:
```typescript
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeInventory(labId: string, onUpdate: () => void) {
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`inventory-${labId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'inventory_items',
        filter: `lab_id=eq.${labId}`
      }, onUpdate)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [labId, onUpdate])
}
```

When another lab member updates inventory, the table refreshes in real time.

**Step 4: Low-stock banner on dashboard**

Items with status `low_stock` or `out_of_stock` appear as alerts on the dashboard (Task 15).

**Step 5: Test manually**

- Open inventory in two browser tabs (same lab)
- Adjust quantity in one tab → see update in other tab
- Reduce below threshold → status badge changes to yellow

**Step 6: Commit**

```bash
git add src/components/inventory/quantity-adjuster.tsx src/hooks/use-realtime-inventory.ts src/components/inventory/inventory-table.tsx
git commit -m "feat: quantity tracking with +/- buttons, realtime updates, auto low-stock status"
```

---

### Task 11: CSV bulk import

**Files:**
- Create: `src/components/inventory/csv-import.tsx`
- Create: `src/lib/csv/parse-inventory.ts`
- Test: `src/lib/csv/__tests__/parse-inventory.test.ts`

**Step 1: Install PapaParse**

```bash
npm install papaparse
npm install -D @types/papaparse
```

**Step 2: Write failing test**

```typescript
// src/lib/csv/__tests__/parse-inventory.test.ts
import { describe, it, expect } from 'vitest'
import { parseInventoryCsv } from '../parse-inventory'

describe('CSV parsing', () => {
  it('parses valid CSV rows', () => {
    const csv = 'Name,Type,Quantity,Unit\nPipette Tips,consumable,5,box'
    const result = parseInventoryCsv(csv)
    expect(result.valid).toHaveLength(1)
    expect(result.valid[0].name).toBe('Pipette Tips')
    expect(result.errors).toHaveLength(0)
  })

  it('captures rows with missing required fields', () => {
    const csv = 'Name,Type,Quantity,Unit\n,consumable,5,box'
    const result = parseInventoryCsv(csv)
    expect(result.valid).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
  })

  it('handles flexible column headers', () => {
    const csv = 'Item Name,Category,Qty,Units\nGloves,consumable,10,box'
    const result = parseInventoryCsv(csv)
    expect(result.valid).toHaveLength(1)
  })
})
```

**Step 3: Run tests — expect fail**

```bash
npx vitest run src/lib/csv/__tests__/parse-inventory.test.ts
```

**Step 4: Implement CSV parser**

`src/lib/csv/parse-inventory.ts`:
- Uses PapaParse to parse CSV string
- Flexible column mapping (accepts "Name", "Item Name", "Product Name", etc.)
- Validates each row against inventory item schema
- Returns `{ valid: InventoryItem[], errors: { row: number, message: string }[] }`

**Step 5: Run tests — expect pass**

```bash
npx vitest run src/lib/csv/__tests__/parse-inventory.test.ts
```

**Step 6: Create CSV import UI**

`src/components/inventory/csv-import.tsx`:
- Drag-and-drop file upload area (or click to browse)
- Parse CSV on drop → show preview table with valid rows (green) and error rows (red)
- "Import N items" button → bulk insert via Supabase
- Progress bar for large imports
- Download template CSV button

**Step 7: Commit**

```bash
git add src/lib/csv/ src/components/inventory/csv-import.tsx package.json package-lock.json
git commit -m "feat: CSV bulk import with validation, preview, flexible column mapping"
```

---

## Phase 4: Equipment Module

### Task 12: Equipment register

**Files:**
- Create: `src/app/(dashboard)/[lab-slug]/equipment/page.tsx`
- Create: `src/components/equipment/equipment-card.tsx`
- Create: `src/components/equipment/equipment-grid.tsx`
- Create: `src/components/equipment/equipment-form.tsx`
- Create: `src/lib/supabase/equipment.ts`

**Step 1: Create equipment data helpers**

`src/lib/supabase/equipment.ts`:
- `getEquipment(supabase, labId)` — fetch all equipment with joined inventory item data
- `createEquipment(supabase, data)` — creates inventory_item (type=equipment) + equipment row in one transaction
- `updateEquipment(supabase, equipmentId, data)` — update equipment fields
- `getUpcomingCalibrations(supabase, labId, days)` — equipment due for calibration within N days

**Step 2: Create equipment card**

`src/components/equipment/equipment-card.tsx`:
- Shows: name, model, serial number, status badge
- Calibration status: "Due in 5 days" (yellow) or "Overdue" (red) or "OK" (green)
- Warranty: "Expires March 2027" or "Expired" (red)
- Click → opens detail/edit view

**Step 3: Create equipment grid page**

`src/app/(dashboard)/[lab-slug]/equipment/page.tsx`:
- Card grid layout (not table — equipment is visual)
- Filter by status: all / active / maintenance / decommissioned
- "Add Equipment" button → opens form modal

**Step 4: Create equipment form**

Extends the inventory item form with equipment-specific fields:
- Serial number, model number
- Purchase date, purchase price
- Warranty expiration
- Calibration interval (days) + last calibrated date

**Step 5: Test manually**

- Add equipment via form → card appears in grid
- Status badges show correctly
- Calibration dates calculate properly

**Step 6: Commit**

```bash
git add src/app/\(dashboard\)/\[lab-slug\]/equipment/ src/components/equipment/ src/lib/supabase/equipment.ts
git commit -m "feat: equipment register — card grid, status badges, calibration tracking"
```

---

### Task 13: Maintenance log + document attachments

**Files:**
- Create: `src/components/equipment/maintenance-log.tsx`
- Create: `src/components/equipment/maintenance-form.tsx`
- Create: `src/components/equipment/document-upload.tsx`
- Create: `src/lib/supabase/storage.ts`

**Step 1: Create storage helpers**

`src/lib/supabase/storage.ts`:
- `uploadDocument(supabase, file, path)` — upload to `equipment-docs` bucket
- `getDocumentUrl(supabase, path)` — get signed URL
- `deleteDocument(supabase, path)` — remove file

**Step 2: Create Supabase storage bucket**

In Supabase dashboard or migration: create `equipment-docs` bucket with RLS (only lab members can access their lab's docs).

**Step 3: Create maintenance log component**

`src/components/equipment/maintenance-log.tsx`:
- Timeline view of maintenance entries for an equipment item
- Each entry shows: date, type badge (calibration/repair/inspection/cleaning), who, description, cost
- "Add Maintenance Log" button opens form

**Step 4: Create maintenance form**

`src/components/equipment/maintenance-form.tsx`:
- Date (default today), type (select), description (textarea), cost (optional number), next due (optional date)
- Submit → inserts into maintenance_logs, updates equipment.last_calibrated if type=calibration

**Step 5: Create document upload**

`src/components/equipment/document-upload.tsx`:
- Drag-and-drop for PDF/images (manuals, SOPs, calibration certificates)
- Files stored in Supabase Storage under `equipment-docs/{lab_id}/{equipment_id}/`
- List of attached documents with download links

**Step 6: Commit**

```bash
git add src/components/equipment/maintenance-log.tsx src/components/equipment/maintenance-form.tsx src/components/equipment/document-upload.tsx src/lib/supabase/storage.ts
git commit -m "feat: maintenance log timeline, document attachments via Supabase Storage"
```

---

## Phase 5: Budget Module

### Task 14: Grants + transactions

**Files:**
- Create: `src/app/(dashboard)/[lab-slug]/budgets/page.tsx`
- Create: `src/components/budget/grant-card.tsx`
- Create: `src/components/budget/grant-form.tsx`
- Create: `src/components/budget/transaction-table.tsx`
- Create: `src/components/budget/transaction-form.tsx`
- Create: `src/components/budget/budget-charts.tsx`
- Create: `src/lib/supabase/grants.ts`

**Step 1: Install Recharts**

```bash
npm install recharts
```

**Step 2: Create grant data helpers**

`src/lib/supabase/grants.ts`:
- `getGrants(supabase, labId)` — fetch all grants with computed remaining amounts
- `createGrant(supabase, labId, data)` — insert grant
- `getTransactions(supabase, grantId)` — fetch transactions for a grant
- `addTransaction(supabase, grantId, data)` — insert transaction + log activity
- `getGrantSummary(supabase, grantId)` — total spent, remaining, per-category breakdown

**Step 3: Create grant card**

`src/components/budget/grant-card.tsx`:
- Grant name, funder, date range
- Progress bar: spent / total (color changes: green <70%, yellow 70-90%, red >90%)
- Remaining amount in bold
- Click → opens grant detail

**Step 4: Create grants page**

`src/app/(dashboard)/[lab-slug]/budgets/page.tsx`:
- List of grant cards
- "Add Grant" button → form modal
- Click grant → shows transactions + charts

**Step 5: Create grant form**

`src/components/budget/grant-form.tsx`:
- Name, funder, grant number, total amount, start date, end date
- Categories: dynamic list — add/remove categories with allocated amounts
- Validation: category allocations must not exceed total

**Step 6: Create transaction table + form**

`src/components/budget/transaction-table.tsx`:
- Table of transactions for a grant: date, description, category, amount, linked item
- Sortable by date

`src/components/budget/transaction-form.tsx`:
- Amount, date, description, category (select from grant's categories)
- Optional: link to inventory item (select from lab inventory)
- Optional: upload receipt

**Step 7: Create budget charts**

`src/components/budget/budget-charts.tsx`:
- Pie chart: spending by category
- Bar chart: monthly burn rate
- Simple, clean — Recharts with Tailwind colors

**Step 8: CSV export**

Add "Export CSV" button to transaction table — uses PapaParse to generate CSV download.

**Step 9: Commit**

```bash
git add src/app/\(dashboard\)/\[lab-slug\]/budgets/ src/components/budget/ src/lib/supabase/grants.ts package.json package-lock.json
git commit -m "feat: budget module — grants, transactions, charts, CSV export"
```

---

## Phase 6: Dashboard + Polish

### Task 15: Dashboard home screen

**Files:**
- Create: `src/app/(dashboard)/[lab-slug]/page.tsx`
- Create: `src/components/dashboard/alerts-banner.tsx`
- Create: `src/components/dashboard/stats-cards.tsx`
- Create: `src/components/dashboard/activity-feed.tsx`
- Create: `src/components/dashboard/quick-actions.tsx`

**Step 1: Create stats cards**

`src/components/dashboard/stats-cards.tsx`:
- Total inventory items count
- Items low on stock (count, red if >0)
- Equipment due for calibration (count, yellow if >0)
- Active grants with remaining budget summary

**Step 2: Create alerts banner**

`src/components/dashboard/alerts-banner.tsx`:
- Low stock items (name + current quantity + "Reorder" link)
- Overdue calibrations (equipment name + days overdue)
- Expiring items (within 30 days)
- Collapsible — shows count when collapsed, details when expanded

**Step 3: Create activity feed**

`src/components/dashboard/activity-feed.tsx`:
- Recent 20 activity log entries
- "Alice added 5 boxes of Pipette Tips" / "Bob calibrated the Analytical Balance"
- Relative timestamps ("2 hours ago")
- Links to the relevant item/equipment

**Step 4: Create quick actions**

`src/components/dashboard/quick-actions.tsx`:
- "Add Item" → opens inventory form modal
- "Log Maintenance" → opens maintenance form
- "Record Purchase" → opens transaction form
- Big, tappable buttons (mobile-friendly)

**Step 5: Assemble dashboard page**

`src/app/(dashboard)/[lab-slug]/page.tsx`:
- Alerts banner (top, if any alerts exist)
- Stats cards row
- Two-column layout: activity feed (left), quick actions (right)
- Mobile: stacks vertically

**Step 6: Commit**

```bash
git add src/app/\(dashboard\)/\[lab-slug\]/page.tsx src/components/dashboard/
git commit -m "feat: dashboard — alerts, stats, activity feed, quick actions"
```

---

### Task 16: Lab settings + member management

**Files:**
- Create: `src/app/(dashboard)/[lab-slug]/settings/page.tsx`
- Create: `src/components/settings/members-list.tsx`
- Create: `src/components/settings/invite-form.tsx`
- Create: `src/components/settings/lab-settings-form.tsx`
- Create: `src/components/settings/locations-manager.tsx`

**Step 1: Create members list**

`src/components/settings/members-list.tsx`:
- Table: name, email, role, joined date
- Owner/Admin can change roles (dropdown) or remove members
- Can't remove or demote the owner

**Step 2: Create invite form**

`src/components/settings/invite-form.tsx`:
- Email input + role select (admin/member)
- Generate invite link (shareable URL with token)
- Or send email invite (via Supabase Edge Function / Next.js API route using Resend)

**Step 3: Create locations manager**

`src/components/settings/locations-manager.tsx`:
- Tree view of locations (Room → Bench → Shelf)
- Add/edit/delete locations
- Drag to reparent (optional — can be v2)

**Step 4: Create lab settings form**

`src/components/settings/lab-settings-form.tsx`:
- Lab name, institution
- Timezone
- Notification preferences (email alerts for low stock, calibration due)

**Step 5: Assemble settings page**

Tabs: General | Members | Locations

**Step 6: Commit**

```bash
git add src/app/\(dashboard\)/\[lab-slug\]/settings/ src/components/settings/
git commit -m "feat: lab settings — members, invites, locations, preferences"
```

---

## Phase 7: ConductScience Integration

### Task 17: Product linking + reorder

**Files:**
- Create: `src/lib/conductscience/search.ts`
- Create: `src/components/inventory/product-linker.tsx`
- Create: `src/components/inventory/reorder-button.tsx`

**Step 1: Create ConductScience search client**

`src/lib/conductscience/search.ts`:
- `searchProducts(query, limit?)` — calls ConductScience search API (CS Search / WooCommerce API)
- Returns: product name, SKU, price, URL, image
- Uses WooCommerce REST API: `GET https://conductscience.com/wp-json/wc/v3/products?search=query&per_page=5`
- Read-only, uses consumer key/secret from env vars

**Step 2: Create product linker**

`src/components/inventory/product-linker.tsx`:
- Search input that queries ConductScience catalog
- Dropdown shows matching products with images
- Select a product → sets `conductscience_product_id` on the inventory item
- Auto-fills catalog number and manufacturer from CS product data
- "Unlink" button to remove the connection
- This is optional — clearly labeled, non-intrusive

**Step 3: Create reorder button**

`src/components/inventory/reorder-button.tsx`:
- Only shows on items with a `conductscience_product_id`
- Prominent when item is low_stock or out_of_stock, subtle when in_stock
- Click → opens conductscience.com product page in new tab
- Text: "Reorder" (not "Buy from ConductScience" — keep it natural)

**Step 4: Wire into inventory item form and detail page**

- Item form: add product-linker as optional section at bottom
- Item detail: show reorder button when linked
- Low-stock alert: include reorder link when item is linked

**Step 5: Commit**

```bash
git add src/lib/conductscience/ src/components/inventory/product-linker.tsx src/components/inventory/reorder-button.tsx
git commit -m "feat: ConductScience product linking + reorder button"
```

---

## Phase 8: Deployment + Open Source

### Task 18: Vercel deployment + GitHub setup

**Files:**
- Create: `README.md` (open source README)
- Create: `LICENSE` (MIT)
- Create: `.github/workflows/ci.yml`
- Modify: `CLAUDE.md` (update with deploy info)

**Step 1: Create GitHub repo**

```bash
cd C:\Users\Shuha\projects\lab-manager
gh repo create ShuhanCS/lab-manager --public --source=. --description "Open-source lab management software — inventory, equipment, budgets" --push
```

**Step 2: Deploy to Vercel**

```bash
npx vercel --prod
```

Or connect GitHub repo to Vercel for auto-deploy.

**Step 3: Set environment variables in Vercel**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WOO_CONSUMER_KEY` (read-only, for product search)
- `WOO_CONSUMER_SECRET`

**Step 4: Write open-source README**

Cover: what it is, screenshot, features, quick start (local dev), self-hosting guide, contributing, license.

**Step 5: Add MIT license**

**Step 6: Add CI workflow**

`.github/workflows/ci.yml`:
- On push to main: lint, type check, run tests, build
- On PR: same checks

**Step 7: Commit + push**

```bash
git add README.md LICENSE .github/ CLAUDE.md
git commit -m "feat: open source setup — README, MIT license, CI workflow, Vercel deploy"
git push origin main
```

---

## Phase 9: Verification + Launch

### Task 19: End-to-end verification

**Manual testing checklist:**

- [ ] Sign up with email → create lab → land on dashboard
- [ ] Add inventory items manually (one of each type)
- [ ] Adjust quantities with +/- → verify status auto-updates
- [ ] Bulk import via CSV (use a 10-row test file)
- [ ] Add equipment with calibration schedule → verify reminder shows
- [ ] Log maintenance entry → appears in timeline
- [ ] Upload a document to equipment → download works
- [ ] Create a grant with categories → add transactions → charts render
- [ ] Export transactions to CSV → opens correctly in Excel
- [ ] Link an inventory item to ConductScience product → reorder button appears
- [ ] Invite a second user → they join the lab → see same inventory
- [ ] Test at 375px (mobile), 768px (tablet), 1440px (desktop)
- [ ] Open two browser tabs → update in one → other refreshes (realtime)
- [ ] All these work on the deployed Vercel URL, not just localhost

---

## Progress Tracker

- [ ] **Phase 1**: Project Scaffold + Supabase (Tasks 1-3)
- [ ] **Phase 2**: Auth + Lab Setup (Tasks 4-6)
- [ ] **Phase 3**: Inventory Module (Tasks 7-11)
- [ ] **Phase 4**: Equipment Module (Tasks 12-13)
- [ ] **Phase 5**: Budget Module (Task 14)
- [ ] **Phase 6**: Dashboard + Polish (Tasks 15-16)
- [ ] **Phase 7**: ConductScience Integration (Task 17)
- [ ] **Phase 8**: Deployment + Open Source (Task 18)
- [ ] **Phase 9**: Verification + Launch (Task 19)

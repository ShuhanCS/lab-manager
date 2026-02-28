# Lab Manager — Design Document

**Date**: 2026-02-28
**Status**: Approved
**Author**: Shuhan He + Claude

## Vision

Open-source lab management software that ConductScience hosts for free. Scientists get a genuinely useful tool to run their lab — inventory, equipment, budgets. ConductScience benefits from brand awareness, trust in the scientific community, and natural purchasing integration when labs need supplies.

**Not a marketplace.** Not a vendor portal. A free, open-source tool that happens to be built by a scientific equipment company.

### Strategic Context

- **Quartzy** proved this model works (free lab management → purchasing channel). They raised $47M, got acquired by Bio-Techne, and their tools stagnated. The lane is open.
- **ConductScience advantages**: ConductGraph (120K papers, 32K equipment, scientific knowledge graph), Product Forge (AI-enriched catalog at scale), CS Search (Meilisearch), existing supplier network.
- **The loop**: Scientist uses free tool daily → low-stock alert → one-click reorder from ConductScience → purchase tracked in the same tool → repeat.

## Architecture

### Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS v4 |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| Deploy (frontend) | Vercel |
| Deploy (backend) | Supabase hosted (self-hostable for open source users) |
| State | Zustand |
| Open Source | Yes — MIT or Apache 2.0 |

### Why Supabase

- Auth (email/password, Google OAuth, magic link) out of the box
- Row Level Security for multi-tenant isolation (each lab is isolated)
- Realtime subscriptions (inventory updates appear instantly for all lab members)
- Storage for document attachments (manuals, SOPs, calibration certificates)
- Free tier is generous enough for small labs
- Supabase itself is open source — scientists can self-host the entire stack

### Deployment

- **Hosted version**: ConductScience runs it for free. Vercel frontend + Supabase backend.
- **Self-hosted**: Scientists can clone the repo and run it themselves. Docker Compose with Supabase self-hosted + Next.js.

## Data Model

### Core Entities

```
Lab
├── id, name, slug, created_at
├── institution (optional — "MIT", "Stanford Medicine")
└── settings (timezone, notification prefs)

Member (join table: user ↔ lab)
├── user_id, lab_id
├── role: owner | admin | member
└── joined_at

Location (hierarchical)
├── id, lab_id, parent_id (nullable)
├── name (e.g., "Room 302", "Freezer B", "Shelf 3")
└── type: room | bench | freezer | shelf | cabinet | other

Inventory Item
├── id, lab_id, created_by
├── name, description
├── type: equipment | reagent | consumable | chemical
├── quantity, unit (e.g., 5 boxes, 2.5 L, 1 unit)
├── min_threshold (triggers low-stock alert when quantity <= this)
├── location_id (FK → Location)
├── catalog_number, lot_number, manufacturer, supplier
├── expiration_date (nullable — for reagents/chemicals)
├── conductscience_product_id (nullable — links to CS catalog for reorder)
├── barcode (nullable — for scanning)
├── status: in_stock | low_stock | out_of_stock | expired
└── created_at, updated_at

Equipment (extends inventory items where type=equipment)
├── id, inventory_item_id
├── serial_number, model_number
├── purchase_date, purchase_price
├── warranty_expires (nullable)
├── calibration_interval_days (nullable — e.g., 90 days)
├── last_calibrated (nullable)
├── next_calibration_due (computed)
├── status: active | maintenance | decommissioned
└── documents[] (via Supabase Storage — manuals, SOPs, certs)

Maintenance Log (per equipment)
├── id, equipment_id, performed_by
├── date, type: calibration | repair | inspection | cleaning
├── description, cost (nullable)
└── next_due (nullable)

Grant / Budget
├── id, lab_id, created_by
├── name (e.g., "NIH R01 AG-12345")
├── funder, grant_number
├── total_amount, remaining_amount (computed)
├── start_date, end_date
└── categories[] (supplies, equipment, travel, personnel — with allocated amounts)

Transaction (purchase linked to a grant)
├── id, grant_id, inventory_item_id (nullable)
├── amount, date, description
├── category (must match one of the grant's categories)
├── receipt_url (nullable — Supabase Storage)
└── created_by

Activity Log
├── id, lab_id, user_id
├── action: item_added | item_updated | quantity_changed | maintenance_logged | ...
├── entity_type, entity_id
├── details (JSON — what changed)
└── created_at
```

### Key Relationships

- Every inventory item can optionally link to a ConductScience product via `conductscience_product_id` — enables one-click reorder
- Transactions link purchases to grants, so PIs know exactly how much of each grant is spent on what
- Equipment has its own maintenance history separate from inventory quantity tracking
- Locations are hierarchical: Room → Bench → Shelf (via `parent_id`)
- Activity log captures all mutations for audit trail

## User Roles & Auth

| Role | Permissions |
|------|------------|
| **Owner** | Everything. Create lab, manage members, delete lab. One per lab. (Usually the PI) |
| **Admin** | Manage inventory, equipment, budgets. Invite/remove members. (Lab manager, senior postdoc) |
| **Member** | Add/edit inventory items, log equipment use, view budgets. Cannot delete items or manage members. (Grad students, postdocs) |

### Auth Methods (via Supabase Auth)

1. **Email/password** — primary (not all scientists have institutional Google accounts)
2. **Google OAuth** — optional convenience
3. **Magic link** — passwordless email login (scientists forget passwords constantly)

### Multi-Lab Support

One user can belong to multiple labs (e.g., a postdoc collaborating across two labs). Lab switcher in the UI. Each lab is fully isolated via Supabase RLS — no data leakage between labs.

### Invites

Owner or Admin generates an invite link or sends an email invite. New user signs up and lands directly in the lab. No approval queue — if you have the link, you're in (like Slack/Notion).

## Core Features (MVP)

### 1. Inventory Management

- **Table view** of all items — searchable, filterable by type, location, status
- **Add items**: manual form, or scan barcode/QR with phone camera (via browser API)
- **Quantity tracking**: +/- buttons for quick updates (grad student grabs a box of pipette tips, taps minus)
- **Low-stock alerts**: when quantity drops below `min_threshold`, notification to admins + banner in dashboard
- **Bulk CSV import**: scientists migrating from their spreadsheet. This is critical for adoption — must be dead simple.
- **Activity log**: who took what, when (audit trail)
- **Expiration tracking**: highlight items expiring soon

### 2. Equipment Register

- **Card view** of all equipment with status badges (active / due for calibration / maintenance needed)
- **Calibration reminders**: "Balance #3 is due for calibration in 5 days" — in-app notification + optional email
- **Maintenance log**: date, what was done, cost, who did it
- **Warranty tracker**: "Centrifuge warranty expires March 2027"
- **Document attachments**: manuals, SOPs, calibration certificates (via Supabase Storage)
- **Status lifecycle**: active → maintenance → active, or active → decommissioned

### 3. Budget Tracker

- **Add grants** with total amount, date range, spending categories
- **Log purchases** against grants — manual entry or link to inventory items when they're added
- **Dashboard**: burn rate, remaining balance, spending by category (simple bar/pie charts)
- **Per-category tracking**: "I budgeted $20K for supplies on this R01, I've spent $14K"
- **Export to CSV**: PIs need this for grant progress reports

### 4. Dashboard (Home Screen)

- **At-a-glance cards**: items low on stock, upcoming calibrations, budget summaries
- **Recent activity feed**: who did what across the lab
- **Quick actions**: add item, log maintenance, record purchase
- **Alerts banner**: anything that needs attention now

## ConductScience Integration

This is NOT the centerpiece. It's a natural feature — like how Figma links to Unsplash for stock photos. It's there when you need it, invisible when you don't.

### How It Works

1. **Product linking**: When adding an inventory item, user can optionally search the ConductScience catalog (via CS Search API / WooCommerce API) and link it. This populates catalog number, manufacturer, and enables reorder.
2. **Reorder button**: For linked items, a "Reorder from ConductScience" button appears when stock is low. Opens conductscience.com product page (or headless equivalent) with the item pre-selected.
3. **Non-linked items**: Work perfectly fine. No ConductScience branding on items from other suppliers. The tool is useful regardless.
4. **Smart suggestions**: When a user adds an item by name (e.g., "peristaltic pump"), the app can suggest matching ConductScience products to link. Optional, dismissable, not pushy.

### What We Don't Do

- No lock-in. Scientists can use this tool without ever buying from ConductScience.
- No data selling. Lab inventory data is private. Period.
- No ads. No upselling banners. No dark patterns.
- The open-source license means anyone can fork and remove ConductScience integration entirely.

## What's NOT in MVP

These are v2+ features, after labs are actively using the tool:

- Ordering/procurement workflows (approval chains, PO generation)
- Integration with institutional procurement systems (PunchOut catalogs)
- Barcode label printing
- Advanced analytics beyond basic budget charts
- Protocol/method library (link protocols to required equipment)
- Shared equipment booking/scheduling
- Mobile native app (responsive web first)
- API for third-party integrations

## Technical Notes

### Supabase Schema

- One Supabase project for the hosted version
- RLS policies isolate labs: every query filters by `lab_id` matching the user's lab memberships
- Realtime subscriptions on `inventory_items` and `activity_log` tables for live updates
- Edge Functions for: low-stock alert emails, calibration reminder emails, invite emails

### Frontend Structure

```
src/
  app/
    (auth)/         # Login, signup, magic link
    (dashboard)/    # Authenticated app shell
      [lab-slug]/   # Lab context
        inventory/  # Inventory table + item detail
        equipment/  # Equipment register
        budgets/    # Grant/budget tracker
        settings/   # Lab settings, members, invites
    api/            # Next.js API routes (webhooks, etc.)
  components/
    inventory/      # Inventory-specific components
    equipment/      # Equipment-specific components
    budget/         # Budget-specific components
    common/         # Shared UI (tables, modals, forms, badges)
  lib/
    supabase/       # Supabase client, types, helpers
    conductscience/ # CS Search / WooCommerce API client (for product linking)
  stores/           # Zustand stores
  hooks/            # React hooks
```

### Key Libraries

- `@supabase/supabase-js` + `@supabase/ssr` — Supabase client
- `zustand` — state management
- `@tanstack/react-table` — inventory table (sorting, filtering, pagination)
- `zod` — form validation
- `recharts` or `nivo` — budget charts
- `papaparse` — CSV import/export
- `html5-qrcode` — barcode/QR scanning via browser camera API

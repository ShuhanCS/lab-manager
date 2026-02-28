# Lab Manager

## Overview
Open-source lab management software. ConductScience hosts it for free.
Scientists track inventory, equipment, and budgets. Purchasing integration with ConductScience is natural, not the centerpiece.

## GitHub
- **Repo**: https://github.com/ShuhanCS/lab-manager (public)
- **License**: MIT
- **CI**: GitHub Actions (lint, test, build) on push/PR to main

## Stack
- **Frontend**: Next.js 16, React 19, Tailwind CSS v4, Zustand
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Deploy**: Vercel (frontend, not yet deployed) + Supabase (backend)

## Design Doc
`docs/plans/2026-02-28-lab-manager-design.md`

## Commands
```bash
npm run dev         # Start dev server
npm run build       # Production build
npm run test        # Run tests (vitest watch)
npm run test:run    # Run tests once
npm run lint        # ESLint
```

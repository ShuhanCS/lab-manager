# Lab Manager

**Open-source lab management for scientists**

<!-- Screenshot coming soon -->

Lab Manager helps research teams track inventory, manage equipment, and monitor budgets in one place. Built for scientists who need a simple, self-hostable tool without vendor lock-in.

## Features

- **Inventory tracking** -- items, quantities, locations, expiry dates, low-stock alerts
- **Equipment register** -- calibration schedules, maintenance logs, status tracking
- **Budget tracking** -- grants, transactions, spending charts, CSV export
- **Multi-user** -- invite lab members with role-based access
- **CSV import** -- bulk import existing inventory and equipment data
- **Real-time updates** -- changes sync instantly across all users via Supabase Realtime
- **Document attachments** -- attach manuals, certificates, and SOPs to equipment

## Quick Start

```bash
git clone https://github.com/ShuhanCS/lab-manager.git
cd lab-manager
npm install
cp .env.example .env.local
# Fill in your Supabase credentials (see .env.example)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Self-Hosting

1. Clone this repo
2. Create a [Supabase](https://supabase.com) project (free tier works)
3. Run the SQL migrations in `supabase/migrations/` against your project
4. Set your Supabase URL and anon key in `.env.local`
5. Deploy to [Vercel](https://vercel.com), [Netlify](https://netlify.com), or any Node.js host

## Tech Stack

- **Framework**: Next.js 16, React 19
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **State**: Zustand
- **Tables**: TanStack Table
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **Testing**: Vitest + Testing Library

## Contributing

Contributions welcome! Please [open an issue](https://github.com/ShuhanCS/lab-manager/issues) first to discuss what you'd like to change.

## License

[MIT](LICENSE)

---

Built by [ConductScience](https://conductscience.com)

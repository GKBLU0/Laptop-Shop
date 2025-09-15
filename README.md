Zanzibar Laptop Shop

What this is
- A complete laptop store management system: inventory, sales, customers, repairs, installments, backups, and admin tools.

Key features
- Inventory management with undo/redo
- Sales and cart with optional installment plans
- Customer management and basic stats
- Repairs tracking with statuses
- Advanced area: notifications, warranty alerts, repairs/instalments managers, audit log, backups, approvals
- Real-time persistence to MySQL, plus JSON snapshots and local cache

How data is saved
- MySQL (primary), data/db.json (snapshot), browser localStorage (fast load)

Quick start (MySQL)

1. Create a MySQL database and user
2. Copy .env.example to .env and set DATABASE_URL, e.g.

```
DATABASE_URL="mysql://user:password@localhost:3306/laptop_store"
```

3. Push schema and generate client

```
npm run prisma:generate
npm run prisma:push
```

Optional: open Prisma Studio

```
npm run prisma:studio
```

Tips
- Set NEXT_PUBLIC_SITE_URL for branded links instead of localhost
- Reset demo users: `npm run db:seed:users`




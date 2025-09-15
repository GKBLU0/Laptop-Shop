ZANZIBAR LAPTOP SHOP
Simple Project Guide and Feature Highlights

WHAT THIS IS 💡
- A complete laptop store system to help you manage:
  - Inventory (laptops)
  - Sales and cart
  - Customers
  - Repairs
  - Installment plans
  - Admin tasks (users, backups, logs)

HOW IT SAVES YOUR DATA 💾
- MySQL database (main source of truth)
- Also keeps a JSON backup (data/db.json)
- Also caches in your browser (localStorage) for faster loads

MAIN SCREENS 🖥️
- Dashboard: key numbers, low stock alerts
- Inventory: add/edit/delete laptops (with undo/redo)
- Sales/Cart: checkout, creates sales and optional installments
- Customers: manage customer info and history
- Repairs: track repair requests and status
- Reports: basic placeholders to expand later
- Advanced: notifications, warranty alerts, repairs manager, installments manager, audit log, backups, approvals

BACKUPS & ROLLBACKS 🔄
- Create backups from the app
- Download current data
- Upload a backup to instantly restore (updates MySQL + JSON)

LOGIN & ROLES 🔐
- Three roles: admin, manager, worker
- Each role sees and can do different things (admin has full control)

NICE TOUCHES ✨
- Press-and-hold eye icon to view passwords briefly
- Case-insensitive username login and space-trimming
- Helpful alerts and toasts
- Simple tables and cards for clean reading

WHAT’S UNDER THE HOOD 🛠️
- Next.js 15 + React
- shadcn/ui components + Tailwind CSS
- Prisma ORM + MySQL
- API routes for data/backup operations

WHERE TO CHANGE THINGS 🔧
- Users seeding: scripts/seed-users.js
- Database schema: prisma/schema.prisma
- Core data logic: lib/database.ts
- Pages & components: app/* and components/*

COMMON TASKS ✅
- Set database connection: .env → DATABASE_URL
- Generate Prisma client: npm run prisma:generate
- Push schema: npm run prisma:push
- View DB in a UI: npm run prisma:studio
- Reset demo users: npm run db:seed:users

SECURITY NOTE 🔒
- Passwords are plain text for demo simplicity.
- For production: use hashing (bcrypt/argon2) and server-side auth.

KNOWN LIMITS 🧪
- Email sending is mocked
- Some reports are just starters
- Undo/redo history is client-side


Setup MySQL

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
 




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



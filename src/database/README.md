# Database

El esquema ejecutable vive en `prisma/schema.prisma`, usando Prisma y SQLite local para desarrollo.

Comandos principales:

```bash
npm run prisma:generate
npm run db:push
npm run db:seed
```

La variable `DATABASE_URL` debe copiarse desde `.env.example` hacia `.env`.

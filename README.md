# MangaTracker Monorepo (Next.js + Express + Prisma + Turborepo)

## Quick start

```bash
pnpm install

# Backend: generate client & run initial migration (local/dev)
pnpm --filter @manga/backend prisma generate
pnpm --filter @manga/backend prisma migrate dev --name init

# Dev both apps
pnpm dev
# frontend: http://localhost:3000  backend: http://localhost:4000
```

See `/docs` in your project for requirements/specs if you copy them over from ChatGPT.

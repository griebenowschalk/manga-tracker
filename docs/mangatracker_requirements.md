# MangaTracker Monorepo: Requirements & Build Plan (Express + JWT + Prisma + PWA)

## 📄 Project Summary

**MangaTracker** is an installable PWA to search, favorite, and read manga. Primary source: **MangaDex API**. Secondary source: **WeebCentral scraper** (server-side only). A **custom Express backend** handles auth (JWT + bcrypt), user profiles, favorites, and reading progress. The app is organized as a **Turborepo monorepo**, deployed to **Railway** with **PostgreSQL** and **Prisma**.

---

## 🏗️ High‑Level Architecture

- **apps/frontend** — Next.js (App Router), PWA shell/UI. Talks only to backend.
- **apps/backend** — **Express** REST API: auth, favorites, progress, source adapters (MangaDex + scraper), normalization layer, caching, rate limiting.
- **packages/shared** — TS types, zod schemas, small utilities shared FE/BE.
- **Database** — **PostgreSQL on Railway** via **Prisma**.
- **Cache (optional)** — in‑memory LRU; upgrade to Redis later if needed.

---

## 📊 Tech Stack & Rationale

| Layer      | Choice                              | Why                                             |
| ---------- | ----------------------------------- | ----------------------------------------------- |
| Monorepo   | **Turborepo**                       | Parallel builds, caching, shared packages       |
| Frontend   | **Next.js 14+**                     | App Router, SSR/ISR, PWA friendly               |
| UI         | Tailwind + Headless UI              | Fast, accessible, minimal JS                    |
| Backend    | **Express**                         | Familiar, minimal, broad ecosystem              |
| Auth       | **JWT (access + refresh) + bcrypt** | Cost‑efficient, backend‑only, no vendor lock‑in |
| ORM        | **Prisma**                          | Type‑safe DB client + migrations + great DX     |
| DB         | **PostgreSQL (Railway)**            | Reliable, constraints, easy analytics           |
| Validation | **zod**                             | End‑to‑end typed contracts                      |
| Scraper    | **Axios + Cheerio**                 | Lightweight HTML parsing                        |
| Caching    | **lru-cache**                       | Simple, low‑cost performance boost              |
| PWA        | **next-pwa**                        | Installable, offline shell                      |

---

## 🗄️ Database Schema (Prisma / PostgreSQL)

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  displayName   String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  preferences   Json?    // { defaultSearchSource: 'MANGADEX' | 'WEBCENTRAL' }
  favorites     Favorite[]
  progress      ReadProgress[]
  refreshTokens RefreshToken[]
}

enum Source { MANGADEX WEBCENTRAL }

model Favorite {
  id        String   @id @default(cuid())
  userId    String
  source    Source
  sourceId  String
  title     String
  coverUrl  String?
  addedAt   DateTime @default(now())
  User      User     @relation(fields: [userId], references: [id])
  @@index([userId, source, sourceId], name: "favorite_lookup")
}

model ReadProgress {
  id            String   @id @default(cuid())
  userId        String
  source        Source
  mangaSourceId String
  chapterId     String
  chapterNum    Float?
  lastPage      Int?
  updatedAt     DateTime @updatedAt
  User          User     @relation(fields: [userId], references: [id])
  @@index([userId, source, mangaSourceId])
}

model RefreshToken {
  id        String   @id        // jti
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  revoked   Boolean  @default(false)
  createdAt DateTime @default(now())
  @@index([userId])
}
```

---

## 🔐 Auth Strategy (Express + JWT + bcrypt)

- **Password hashing**: `bcrypt` with 12+ rounds.
- **Tokens**: short‑lived **access JWT** (10–30 min) + **rotating refresh token** (7–30 days) stored in DB (`RefreshToken`).
- **Cookies**: set **HTTP‑only, Secure**, `SameSite=Lax` cookies `mt_access`, `mt_refresh`. FE/BE on separate domains → enable CORS with `credentials: true` and set cookie domain.
- **Endpoints**: `POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`.
- **Middleware**: `requireAuth` verifies `mt_access`; on 401, FE calls `/auth/refresh` once.
- **Secrets**: `AUTH_SECRET` (HS256) stored in Railway env.

> Works great with Next.js: fetch with `credentials: 'include'`; protect routes via `middleware.ts` checking `mt_access` cookie; server components can read cookies to call backend.

---

## 🔌 Backend API (normalized across sources)

**Base:** `/api`

**Auth**

- `POST /auth/signup` — create user, set cookies
- `POST /auth/login` — verify, set cookies
- `POST /auth/refresh` — rotate refresh, issue new access
- `POST /auth/logout` — revoke refresh, clear cookies
- `GET /auth/me` — current user profile

**Profile & Preferences**

- `GET /profile` — favorites, recent progress, preferences
- `PATCH /profile/preferences` — `{ defaultSearchSource }`

**Favorites**

- `GET /favorites`
- `POST /favorites` — `{ source, sourceId, title, coverUrl }`
- `DELETE /favorites/:source/:sourceId`

**Progress**

- `GET /progress/:source/:mangaId`
- `PUT /progress` — `{ source, mangaSourceId, chapterId, chapterNum?, lastPage? }`

**Search / Content (normalized)**

- `GET /search?q=...&source=MANGADEX|WEBCENTRAL`
- `GET /manga/:source/:id/chapters`
- `GET /chapter/:source/:chapterId/pages`

Validation via **zod** in `packages/shared`. Rate limiting on auth & scraper routes.

---

## 🕷️ WeebCentral Scraper (server‑side only)

- **Axios + Cheerio**, set UA, modest concurrency, backoff on errors.
- **Cache**: `lru-cache` per search and series/chapter page (TTL 5–15 min) to cut bandwidth and be polite.
- **Hotlinking**: if blocked, expose a small **image proxy** endpoint with short TTL; never persist external images.
- **Robots/ToS**: follow site policies; scraping intended for personal/educational use; keep load minimal.

---

## 🔎 Source Toggle & Fallback

- UI control: `MangaDex | WeebCentral` (persist choice in `User.preferences`).
- Backend always returns a **normalized shape** so UI is source‑agnostic.
- Optional fallback: if active source fails, suggest switching sources rather than auto‑scraping.

---

## 🎨 Frontend (Next.js + PWA)

- **Pages**
  - `/` — search + source toggle + results
  - `/dashboard` — favorites + continue reading
  - `/manga/:source/:id` — details + chapter list + resume button
  - `/read/:source/:chapterId` — vertical reader (lazy image load, pinch‑zoom via `react-photo-view`), debounce progress updates
  - `/login`, `/signup`, `/profile`
- **PWA**: `next-pwa`, offline shell for UI + app chrome; avoid long‑term caching of external images; optional ephemeral cache for current chapter.
- **Manifest**

```json
{
  "name": "MangaTracker",
  "short_name": "MangaTracker",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#111827",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 📦 Monorepo Layout & Tooling

```
/mangatracker
├─ apps/
│  ├─ frontend/           # Next.js (App Router)
│  └─ backend/            # Express API
├─ packages/
│  └─ shared/             # types, zod schemas, utils
├─ turbo.json
├─ package.json           # workspaces, scripts
└─ pnpm-lock.yaml         # use pnpm for speed & lower costs
```

**Root scripts**

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "start": "turbo run start",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "db:migrate": "pnpm --filter @manga/backend prisma migrate deploy"
  }
}
```

**turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "dev": { "cache": false, "persistent": true },
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
    "start": { "cache": false },
    "lint": {},
    "typecheck": {}
  }
}
```

---

## 🧪 Local Dev & Env

- **Backend env**: `DATABASE_URL`, `AUTH_SECRET`, `NODE_ENV`.
- **Frontend env**: `NEXT_PUBLIC_API_URL`.
- **Dev ports**: FE `3000`, BE `4000` (CORS `credentials: true`).
- **Prisma Studio**: `pnpm prisma studio` for quick DB inspection.

---

## 🚀 Deployment (Railway)

1. Create Railway project; add **PostgreSQL** plugin.
2. Add two services from monorepo: **apps/backend** and **apps/frontend**.
3. Backend env: `DATABASE_URL`, `AUTH_SECRET` set in Railway.
4. Run `pnpm prisma migrate deploy` (deploy hook or one‑off exec).
5. Frontend env: `NEXT_PUBLIC_API_URL` → backend’s public URL.
6. Assign domains; enable HTTPS; verify cookies over TLS.

**Cost tips**: tiny instance sizes, auto‑sleep if acceptable, Postgres single shared instance, keep scraper cache in memory to avoid extra services.

---

## 🧭 Step‑by‑Step Course Plan

**Module 1 — Monorepo Bootstrap**

- Init Turborepo + workspaces; set up TS/ESLint/Prettier; Tailwind in FE.

**Module 2 — DB & Prisma**

- Add schema above; `prisma migrate dev`; seed a test user.

**Module 3 — Auth (Express + JWT)**

- Implement `/auth/signup`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`.
- Set HTTP‑only cookies; add `requireAuth` middleware; add zod validation.

**Module 4 — Source Adapters**

- `services/mangadex.ts` (search/chapters/pages via public API).
- `services/weebcentral.ts` (scraper with cache + politeness).
- Normalize outputs.

**Module 5 — Favorites & Progress**

- Implement routes + FE integration (Dashboard + Resume).

**Module 6 — Search UI & Toggle**

- Home search with `q`; source toggle persisted in user prefs.

**Module 7 — Reader**

- Vertical image reader with lazy load; debounce progress saves.

**Module 8 — PWA**

- `next-pwa` + manifest + basic offline; Lighthouse pass.

**Module 9 — Deploy**

- Railway deploy, env wiring, smoke tests.

---

## 💡 Best‑Practice Tips (High‑Value, Low‑Cost)

- **JWT rotation**: rotate refresh tokens on every refresh; store/revoke in DB.
- **Cookie security**: `httpOnly`, `secure`, strict paths; avoid localStorage for tokens.
- **Rate limiting**: apply to `/auth/*` and scraper endpoints; simple token bucket is fine.
- **Caching strategy**: cache normalized lists (search, chapters) 5–15 min; don’t cache user‑specific data.
- **Image handling**: prefer direct source URLs; if proxying, short TTL and streaming, no disk writes.
- **Zod everywhere**: validate inputs/outputs at the API boundary; share schemas in `packages/shared`.
- **Indexes**: `(userId, source, sourceId)` and `(userId, source, mangaSourceId)` already included; keep them.
- **Observability**: minimal request logs (pino) with request IDs; log cache hit/miss counters.
- **Accessibility**: keyboard navigation in reader; large tap targets; color‑contrast safe themes.
- **Performance**: use Next.js `Image` for covers; lazy load lists; request‑abort on route change.

---

## ✅ Definition of Done

- Installable PWA, HTTPS, Lighthouse PWA score ≥ 90.
- Express API with JWT auth (access + refresh), secure cookies, Prisma backed.
- Search for **both** sources, user‑selectable; normalized results.
- Favorites & progress persisted; dashboard shows continue reading.
- Reader loads fast, tracks last page, and resumes correctly.
- Deployed on Railway with Postgres, environment variables configured.

---

## 🧪 Testing Stack & Strategy

- **Runner:** **Jest** for the entire monorepo (frontend + backend) for a unified test toolchain.
- **Transformer:** **@swc/jest** for fast TypeScript compilation.
- **Frontend testing:** **@testing-library/react** + **@testing-library/user-event** for UI; **MSW** (Mock Service Worker) to stub backend calls.
- **Backend testing:** Unit tests for pure functions; integration tests for Express routes using **supertest**.
- **Database in tests:** Prefer **testcontainers** for ephemeral Postgres; alternatively use a temporary test DB with `prisma migrate deploy` in setup.
- **Coverage goals:** ≥60% statements/branches initially; increase over time.
- **Scripts:**
  - Root: `pnpm test` (runs all packages)
  - Backend: `pnpm -F @manga/backend test`
  - Frontend: `pnpm -F @manga/frontend test`
- **Suggested layout:**

```
apps/
  backend/
    __tests__/auth.test.ts
    __tests__/search.test.ts
    jest.config.ts
  frontend/
    __tests__/search.spec.tsx
    __tests__/reader.spec.tsx
    jest.config.ts
packages/
  shared/
    jest.base.ts
```

- **Notes:**
  - Validate inputs/outputs with zod in tests at API boundaries.
  - FE tests use MSW to avoid live network; BE integration tests may hit real services or stubs.
  - Seed minimal fixtures for favorites/progress flows.

---

## 📘 Read Progress Return Contract (API & UI)

To ensure the UI can always resume reading from the last position—even if the manga is not a favorite—the backend MUST return the user's latest `ReadProgress` when fetching manga details.

### Endpoint (new)

**GET `/api/manga/:source/:id`**

- Returns combined **manga overview**, **chapter list**, and **optional readProgress**.

**Response (normalized)**

```json
{
  "manga": {
    "id": "string",
    "source": "MANGADEX|WEBCENTRAL",
    "title": "string",
    "coverUrl": "string|null"
  },
  "chapters": [
    {
      "chapterId": "string",
      "chapterNum": 12.0,
      "title": "string|null",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "readProgress": {
    "source": "MANGADEX|WEBCENTRAL",
    "mangaSourceId": "string",
    "chapterId": "string",
    "chapterNum": 12.0,
    "lastPage": 7,
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

Notes:

- `readProgress` MAY be `null` if the user has never read this manga.
- `chapterNum` MAY be `null` if unavailable from the source.
- The existing endpoint `GET /api/manga/:source/:id/chapters` remains for lists-only use; the new overview endpoint is preferred for the details page.

### UI Requirements

- On `/manga/:source/:id`, if `readProgress` exists:
  - Show **“Resume from Chapter {chapterNum}”** (fallback to chapterId if no number).
  - Highlight the last-read chapter in the list.
- On `/read/:source/:chapterId`, when opened via “Resume”, auto-scroll to `lastPage` if applicable.

### Acceptance Criteria

- Calling `GET /api/manga/:source/:id` as an authenticated user returns `readProgress` when present in DB.
- Removing a favorite **does not** delete `ReadProgress`.
- Reading a chapter updates `ReadProgress` and subsequent calls to the overview endpoint reflect the new position.

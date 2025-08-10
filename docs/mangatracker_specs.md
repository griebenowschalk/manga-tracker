# MangaTracker Backend & Frontend Specifications

Create a full‑stack manga reader application in a **Turborepo monorepo** with a **Next.js** PWA frontend and an **Express** backend. Data comes from **MangaDex API** and a server‑side **WeebCentral scraper**. The backend manages **auth with JWT + bcrypt**, user profiles, favorites, and reading progress. Deploy both services and a managed **PostgreSQL** database on **Railway**.

---

## Manga Sources

- **MangaDex (primary)**
  - Search manga by title
  - Get manga details and cover
  - List chapters
  - Retrieve at‑home server + page image URLs
- **WeebCentral (secondary)** via scraper (server‑side only)
  - Search by title
  - Fetch series details and chapter list
  - Fetch page image URLs (with polite scraping and caching)
- **Normalized responses** across sources so the frontend is source‑agnostic.

---

## Users & Authentication

- **Auth method**: JWT + HTTP‑only cookies
  - `mt_access` (access token) expires in **15 minutes**
  - `mt_refresh` (refresh token) expires in **7 days**
  - **Rotating refresh tokens** stored in DB; rotate on every refresh; revoke old
- **Registration/Login**
  - Register with email+password (bcrypt hashed, 12+ rounds)
  - On login/signup, set both cookies; return basic profile
- **Logout**
  - Revoke refresh token in DB; clear cookies
- **Get current user**
  - Read from access token; 401 if invalid/expired
- **Password reset** (optional stretch)
  - Email token with 10‑minute TTL; update password

---

## Profiles & Preferences

- Store per‑user preferences
  - `defaultSearchSource`: `MANGADEX | WEBCENTRAL`
- Dashboard shows
  - Favorites list
  - Continue Reading list (latest ReadProgress per manga)
  - Recent releases (from active source) for favorited manga (best‑effort)

---

## Favorites

- Add/Remove a manga to favorites
  - Store `{ source, sourceId, title, coverUrl }`
- List favorites with pagination and basic search/filter by title
- Prevent duplicates per `(userId, source, sourceId)`

---

## Reading Progress

- Save progress per user & manga
  - `{ source, mangaSourceId, chapterId, chapterNum?, lastPage? }`
- Retrieve last progress for a manga to resume reading
- Update progress on reader scroll (debounced) and on chapter complete

---

## Search & Content (Normalized API)

- **Search**
  - Query param `q` and `source=MANGADEX|WEBCENTRAL`
  - Return minimal cards: `{ id, source, title, coverUrl, latestChapter? }`
- **Manga chapters**
  - `GET /manga/:source/:id/chapters` → normalized chapter list: `{ chapterId, chapterNum?, title?, createdAt? }`
- **Chapter pages**
  - `GET /chapter/:source/:chapterId/pages` → ordered image URLs
  - If hotlinking fails, stream through a short‑TTL image proxy

---

## Reader

- Lightweight vertical reader that:
  - Lazy‑loads images
  - Supports zoom (pinch/scroll) and keyboard navigation
  - Saves `lastPage` every 5–10 seconds and on unload
  - Next/Previous chapter controls

---

## Security

- Hash passwords with **bcrypt** (>=12 rounds)
- Use **HTTP‑only, Secure** cookies; `SameSite=Lax`
- **Helmet** for security headers
- **CORS** enabled for frontend domain with `credentials: true`
- **Rate limit**: 100 requests / 10 minutes per IP on auth & scraper routes
- **Input validation** with **zod** on all endpoints
- Avoid persisting third‑party images; only proxy when necessary

---

## Documentation

- Postman collection (or Hoppscotch) for all endpoints
- Generate HTML docs (e.g., Postman docgen) and serve at `/` on backend (optional)
- README with quick‑start scripts and environment variable table

---

## Deployment (Railway)

- Push monorepo to GitHub
- Railway project: add **PostgreSQL** plugin
- Add services from monorepo:
  - **backend** (Express): `pnpm build && node dist/server.js`
  - **frontend** (Next.js): `pnpm build && pnpm start`
- Env vars:
  - Backend: `DATABASE_URL`, `AUTH_SECRET`, `NODE_ENV`
  - Frontend: `NEXT_PUBLIC_API_URL`
- Run `pnpm prisma migrate deploy` on backend service
- Assign domains; enable HTTPS

---

## Code & Project Conventions

- **Monorepo** with Turborepo
  - Workspaces: `apps/frontend`, `apps/backend`, `packages/shared`
  - Shared TS types & zod schemas in `packages/shared`
- **NPM scripts** (root)
  - `dev`, `build`, `start`, `lint`, `typecheck`, `db:migrate`
- **Controllers/Services** pattern on backend with documented routes
- **Error handling** middleware and unified API error shape
- **Auth middleware**: `requireAuth` for protected routes
- **Database seeder** (optional) for local dev accounts

---

## Database (PostgreSQL + Prisma)

- **Models**
  - `User`: email (unique), passwordHash, displayName?, preferences (JSON)
  - `Favorite`: (userId, source, sourceId) unique‑indexed, title, coverUrl?
  - `ReadProgress`: (userId, source, mangaSourceId), chapterId, chapterNum?, lastPage?
  - `RefreshToken`: id (jti), userId, revoked, createdAt
- **Indexes**
  - `favorite_lookup` on `(userId, source, sourceId)`
  - progress index on `(userId, source, mangaSourceId)`
- **Migrations** via Prisma; inspect with Prisma Studio

---

## Backend Endpoints (Express)

- **Auth**
  - `POST /api/auth/signup`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
  - `GET  /api/auth/me`
- **Profile & Preferences**
  - `GET  /api/profile`
  - `PATCH /api/profile/preferences`
- **Favorites**
  - `GET    /api/favorites`
  - `POST   /api/favorites`
  - `DELETE /api/favorites/:source/:sourceId`
- **Progress**
  - `GET  /api/progress/:source/:mangaId`
  - `PUT  /api/progress`
- **Content**
  - `GET /api/search?q=...&source=MANGADEX|WEBCENTRAL`
  - `GET /api/manga/:source/:id/chapters`
  - `GET /api/chapter/:source/:chapterId/pages`

---

## Scraper (WeebCentral)

- Implement with **Axios + Cheerio**
- Set user‑agent, throttle requests, exponential backoff on 429/5xx
- Cache search/series/chapter HTML for 5–15 minutes (LRU)
- Normalize outputs to the same shape as MangaDex adapters
- Optional **image proxy** with short TTL; stream only; no disk persistence

---

## Frontend (Next.js PWA)

- Pages
  - `/` search + **source toggle** (persist user pref)
  - `/dashboard` favorites + continue reading
  - `/manga/:source/:id` details + chapter list + resume button
  - `/read/:source/:chapterId` vertical reader (lazy images, zoom, next/prev)
  - `/login`, `/signup`, `/profile`
- **PWA**
  - `next-pwa` with offline shell
  - `manifest.json` and icons
  - Do not permanently cache external images; ephemeral cache for current chapter only

---

## Performance & UX

- Use Next.js `Image` for covers and thumbnails
- Abort in‑flight fetches on route changes
- Debounce progress updates (every 5–10s)
- Optimistic favorite toggling
- Keyboard shortcuts (←/→ for page/chapter nav)

---

## Acceptance Criteria

- Installable PWA on desktop and Android
- Auth with secure cookies; refresh rotation works; logout revokes
- Search works from both sources with toggle; normalized responses
- Favorites CRUD persists and syncs UI
- Reading progress saves & resumes (chapter + last page)
- Reader renders smoothly and supports zoom + next/prev
- Deployed on Railway with Postgres; env configured; HTTPS

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

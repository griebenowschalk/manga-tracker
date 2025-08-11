# 📚 MangaTracker Monorepo

A full-stack manga tracking application built with **Next.js**, **Express**, **Prisma**, and managed with **Turborepo**.

---

## 🚀 Quick Start

### 1️⃣ Prerequisites
- **Node.js** >= 18
- **pnpm** >= 8  
  Install with:
  ```bash
  npm install -g pnpm
  ```
- A running **PostgreSQL** or **MySQL** instance (check `prisma/schema.prisma` for database type)

---

### 2️⃣ Clone & Install
```bash
git clone https://github.com/griebenowschalk/manga-tracker.git
cd manga-tracker
pnpm install
```

---

### 3️⃣ Environment Variables
Create a `.env` file in the **root** and in the **backend** folder using the template below:

```env
# Root-level .env
DATABASE_URL=postgresql://user:password@localhost:5432/mangadb
JWT_SECRET=your_secret_key
NEXT_PUBLIC_API_URL=http://localhost:4000
```

For more details, see `.env.example`.

---

### 4️⃣ Backend Setup
```bash
# Generate Prisma client
pnpm --filter @manga/backend prisma generate

# Run initial DB migration
pnpm --filter @manga/backend prisma migrate dev --name init
```

---

### 5️⃣ Start Development
```bash
pnpm dev
```
- Frontend: **http://localhost:3000**
- Backend: **http://localhost:4000**

---

## 📦 Available Scripts
| Command | Description |
|---------|-------------|
| `pnpm dev` | Run frontend & backend in dev mode |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run tests |

---

## 📡 API Documentation
Full API reference is available at [`/docs/API.md`](./docs/API.md).

---

## 🤝 Contributing
PRs welcome! Please:
1. Create a feature branch
2. Commit changes
3. Open a Pull Request with a clear description

FROM node:18-alpine

WORKDIR /app

# Copy the entire monorepo
COPY . .

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies from the root
RUN pnpm install --frozen-lockfile

# Build the backend
RUN pnpm build:backend

# Set working directory to backend
WORKDIR /app/apps/backend

EXPOSE 3000

CMD ["pnpm", "start:backend"]

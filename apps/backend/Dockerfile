FROM node:18-alpine

WORKDIR /app

# Copy the entire monorepo
COPY . .

# Install pnpm globally
RUN npm install -g pnpm

# Install root dependencies (dev tools like turbo, eslint)
RUN cd /app && echo "Y" | pnpm install --prod=false

# Install shared package dependencies
RUN cd /app/packages/shared && echo "Y" | pnpm install --prod=false

# Install backend dependencies
RUN cd /app/apps/backend && echo "Y" | pnpm install --prod=false

# Build the shared package first
RUN cd /app && pnpm --filter=@manga/shared build

# Build the backend
RUN cd /app && pnpm build:backend

# Set working directory to backend
WORKDIR /app/apps/backend

EXPOSE 3000

CMD ["pnpm", "start:backend"]

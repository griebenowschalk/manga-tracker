## Spin Up Local Postgress

```
# Create container

docker run --name manga-postgres \
 -e POSTGRES_PASSWORD=password \
 -e POSTGRES_USER=postgres \
 -e POSTGRES_DB=manga_tracker \
 -p 5433:5432 \
 -d postgres:15

# Stop and remove container

docker stop manga-postgres
docker rm manga-postgres

# Generate database

pnpm run prisma:generate

# Migrate database

pnpm run prisma:migrate

# Reset database

pnpm run prisma:reset

# View database

pnpm run prisma:studio
```

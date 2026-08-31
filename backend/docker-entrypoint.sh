#!/bin/sh
set -e

mkdir -p /data

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Seeding totems..."
npx tsx prisma/seed.ts

echo "Starting API..."
exec node dist/main.js

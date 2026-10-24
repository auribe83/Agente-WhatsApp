#!/bin/sh
set -e

# Si el comando es "web", ejecutamos migraciones y seed si corresponde
if [ "$1" = "web" ]; then
  echo "[Docker Entrypoint] Ejecutando sincronización de base de datos..."
  npx prisma db push --skip-generate

  if [ "$SEED_DEMO" = "true" ]; then
    echo "[Docker Entrypoint] Verificando y sembrando datos de demostración..."
    npx tsx prisma/seed.ts || echo "Seed omitido o ya ejecutado"
  fi

  echo "[Docker Entrypoint] Arrancando servidor web Next.js Standalone..."
  exec node server.js
fi

# Si el comando es "worker", ejecutamos el worker de fondo
if [ "$1" = "worker" ]; then
  echo "[Docker Entrypoint] Arrancando proceso Worker (WhatsApp + Cron)..."
  exec npx tsx scripts/worker.ts
fi

# Si se pasa cualquier otro comando, lo ejecutamos directamente
exec "$@"

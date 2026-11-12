#!/bin/sh
# Applies pending migrations, seeds an empty database (no-op otherwise), then starts the API.
set -e
node dist/db/migrate.js
if [ "${SEED_ON_START:-true}" = "true" ]; then
  node dist/db/seed.js
fi
exec node dist/server.js

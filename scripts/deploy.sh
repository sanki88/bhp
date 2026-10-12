#!/usr/bin/env bash
set -euo pipefail
umask 077
cd "$(dirname "$0")/.."
docker compose version >/dev/null
test -f .env && test -f secrets/db_password || { echo 'Run setup-env.mjs first (see README).'; exit 1; }
# Copies made under umask 077 may remove access required by container users.
# The containing secrets directory stays private on the host.
chmod 700 secrets
chmod 444 secrets/db_password secrets/postgres_password
chmod 644 docker/init-db.sh
chmod 600 .env
export APP_VERSION="${APP_VERSION:-$(date -u +%Y%m%dT%H%M%SZ)}"
[[ "$APP_VERSION" =~ ^[a-zA-Z0-9._-]+$ ]] || { echo 'Invalid APP_VERSION'; exit 1; }
docker compose build --pull app
docker compose up -d --wait db
# A one-time import; subsequent releases never overwrite database content.
docker compose run --rm -T -v "$PWD/legacy:/import:ro" app node scripts/import-data.mjs /import/data /import/public
docker compose up -d --wait --wait-timeout 180 app
# Recreate nginx so its startup DNS lookup always points to the new application container.
docker compose up -d --no-deps --force-recreate --wait --wait-timeout 120 proxy
sed "s/^APP_VERSION=.*/APP_VERSION=$APP_VERSION/" .env > .env.next
mv .env.next .env
docker compose ps

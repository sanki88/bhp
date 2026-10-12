#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
umask 077
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
destination="$PWD/backups/$stamp"
mkdir -p "$destination"
# Brief maintenance window guarantees that DB and video files describe the same point in time.
docker compose stop proxy app
trap 'docker compose up -d --wait app proxy' EXIT
docker compose exec -T db pg_dump -U bhp -d bhp -Fc > "$destination/database.dump"
docker compose run --rm -T --no-deps --entrypoint tar app -C /app/data -czf - media > "$destination/media.tar.gz"
cp .env "$destination/config.env"
cp -r secrets "$destination/secrets"
echo "Backup: $destination (contains personal data and credentials; store securely off this server)."

#!/usr/bin/env bash
set -euo pipefail
umask 077
cd "$(dirname "$0")/.."
test "$(id -u)" = 0 || { echo 'Run as root to install the certificate renewal timer.'; exit 1; }
public_ip="${1:-185.193.113.216}"
python3 - "$public_ip" <<'PY'
import ipaddress, sys
assert ipaddress.IPv4Address(sys.argv[1]).is_global, 'Expected a public IPv4 address'
PY
test -f .env
docker compose config --quiet
tls_directory=/opt/bhp/tls
certbot_image=certbot/certbot@sha256:f70ad0adbb7e117f0fe42a63c553f28ea451edabc0148757b6efcd9735acaa20
previous="$PWD/backups/public-ip-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$previous" "$tls_directory/letsencrypt" "$tls_directory/webroot"
cp .env "$previous/config.env"
chmod 755 "$tls_directory/webroot"
bootstrap_started=0
config_changed=0
rollback() {
    status=$?
    if (( bootstrap_started )); then docker rm -f bhp-acme-bootstrap >/dev/null 2>&1 || true; fi
    if (( status != 0 && config_changed )); then
        cp "$previous/config.env" .env
        docker compose up -d --no-build --wait app || true
        docker compose up -d --no-deps --force-recreate --wait proxy || true
        echo 'Previous application configuration restored.' >&2
    fi
    exit "$status"
}
trap rollback EXIT
if [[ ! -f "$tls_directory/letsencrypt/live/bhp-ip/fullchain.pem" ]]; then
    docker run -d --name bhp-acme-bootstrap --restart=no \
        -p 0.0.0.0:80:80 \
        -v "$PWD/docker/nginx-acme.conf:/etc/nginx/conf.d/default.conf:ro" \
        -v "$tls_directory/webroot:/var/www/certbot:ro" nginx:stable-alpine >/dev/null
    bootstrap_started=1
    certbot_args=(certonly --non-interactive --agree-tos --register-unsafely-without-email
        --preferred-profile shortlived --webroot --webroot-path /var/www/certbot
        --cert-name bhp-ip --ip-address "$public_ip")
    docker run --rm -v "$tls_directory/letsencrypt:/etc/letsencrypt" \
        -v "$tls_directory/webroot:/var/www/certbot" "$certbot_image" "${certbot_args[@]}" --dry-run
    docker run --rm -v "$tls_directory/letsencrypt:/etc/letsencrypt" \
        -v "$tls_directory/webroot:/var/www/certbot" "$certbot_image" "${certbot_args[@]}"
    docker rm -f bhp-acme-bootstrap >/dev/null
    bootstrap_started=0
fi
python3 - "$public_ip" "$tls_directory" <<'PY'
from pathlib import Path
import sys
p = Path('.env')
updates = {
    'COMPOSE_FILE': 'compose.yml:compose.public.yml',
    'APP_ORIGIN': 'https://' + sys.argv[1],
    'PUBLIC_HOST': sys.argv[1],
    'BIND_ADDRESS': '0.0.0.0', 'HTTP_PORT': '80', 'HTTPS_PORT': '443',
    'COOKIE_SECURE': 'true', 'TLS_STATE_DIR': sys.argv[2],
}
lines = []
for line in p.read_text().splitlines():
    key = line.split('=', 1)[0]
    if key in updates:
        lines.append(key + '=' + updates.pop(key))
    else:
        lines.append(line)
lines.extend(key + '=' + value for key, value in updates.items())
temporary = Path('.env.public-next')
temporary.write_text('\n'.join(lines) + '\n')
temporary.chmod(0o600)
temporary.replace(p)
PY
config_changed=1
docker compose config --quiet
docker compose up -d --no-build --wait --wait-timeout 180 app
docker compose up -d --no-deps --force-recreate --wait --wait-timeout 120 proxy
docker compose exec -T proxy nginx -t
curl --fail --silent "https://$public_ip/api/health"
printf '\n'
bash scripts/renew-certificates.sh --dry-run
python3 - "$PWD" <<'PY'
from pathlib import Path
import sys
directory=sys.argv[1]
assert '\n' not in directory and ' ' not in directory
Path('/etc/systemd/system/bhp-certbot-renew.service').write_text(f'''[Unit]
Description=Renew BHP HTTPS certificate and reload nginx
Wants=network-online.target
After=network-online.target docker.service
Requires=docker.service

[Service]
Type=oneshot
WorkingDirectory={directory}
ExecStart=/bin/bash {directory}/scripts/renew-certificates.sh
''')
Path('/etc/systemd/system/bhp-certbot-renew.timer').write_text('''[Unit]
Description=Check BHP certificate renewal every six hours

[Timer]
OnCalendar=*-*-* 00,06,12,18:00:00
RandomizedDelaySec=15m
Persistent=true

[Install]
WantedBy=timers.target
''')
PY
chmod 644 /etc/systemd/system/bhp-certbot-renew.service /etc/systemd/system/bhp-certbot-renew.timer
systemctl daemon-reload
systemctl enable --now bhp-certbot-renew.timer
systemctl start bhp-certbot-renew.service
systemctl list-timers bhp-certbot-renew.timer --no-pager
config_changed=0
echo "Public application ready: https://$public_ip"

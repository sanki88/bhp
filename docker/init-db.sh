#!/bin/sh
set -eu
app_password="$(cat /run/secrets/db_password)"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres --set=app_password="$app_password" <<'SQL'
CREATE ROLE bhp LOGIN PASSWORD :'app_password' NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE DATABASE bhp OWNER bhp;
SQL

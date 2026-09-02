#!/bin/sh
set -eu

APP_DIR="${APP_DIR:-/var/www/html}"
DATA_DIR="${DATA_DIR:-/data}"
ENV_FILE="$APP_DIR/.env"

cd "$APP_DIR"

mkdir -p "$DATA_DIR"
chmod 775 "$DATA_DIR" 2>/dev/null || true

upsert_env() {
    _file=$1
    _key=$2
    _val=$3
    _tmp="${_file}.tmp.$$"
    if [ -f "$_file" ] && grep -q "^${_key}=" "$_file"; then
        grep -v "^${_key}=" "$_file" > "$_tmp"
        echo "${_key}=${_val}" >> "$_tmp"
        mv "$_tmp" "$_file"
    else
        echo "${_key}=${_val}" >> "$_file"
    fi
}

if [ -f "$DATA_DIR/.env_config" ]; then
    cp "$DATA_DIR/.env_config" "$ENV_FILE"
else
    APP_KEY="base64:$(openssl rand -base64 32)"
    _app_url="${APP_URL:-http://localhost}"

    cat > "$ENV_FILE" << EOF
APP_NAME=Savvy
APP_ENV=production
APP_DEBUG=false
APP_URL=$_app_url

APP_KEY=$APP_KEY

LOG_CHANNEL=stderr

DB_CONNECTION=sqlite
DB_DATABASE=$DATA_DIR/database.sqlite

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

DB_QUEUE_CONNECTION=sqlite_queue
DB_QUEUE_DATABASE=$DATA_DIR/queue.sqlite
DB_CACHE_CONNECTION=sqlite_cache
DB_CACHE_LOCK_CONNECTION=sqlite_cache
DB_CACHE_DATABASE=$DATA_DIR/cache.sqlite
SESSION_CONNECTION=sqlite_sessions
DB_SESSIONS_DATABASE=$DATA_DIR/sessions.sqlite

BACKUP_PATH=$DATA_DIR/backups
UPLOAD_ROOT=$DATA_DIR/uploads
SEED_DEMO=${SEED_DEMO:-false}
EOF

    if [ -n "${TZ:-}" ]; then
        echo "TZ=$TZ" >> "$ENV_FILE"
    fi

    for f in database queue cache sessions; do
        touch "$DATA_DIR/$f.sqlite"
        chmod 664 "$DATA_DIR/$f.sqlite"
    done

    mkdir -p "$DATA_DIR/backups"
    chmod 775 "$DATA_DIR/backups"

    mkdir -p "$DATA_DIR/uploads"
    chmod 775 "$DATA_DIR/uploads"

    php artisan migrate --force --seed

    cp "$ENV_FILE" "$DATA_DIR/.env_config"
fi

[ -f "$DATA_DIR/database.sqlite" ] && chmod 664 "$DATA_DIR/database.sqlite"
[ ! -d "$DATA_DIR/backups" ] && mkdir -p "$DATA_DIR/backups" && chmod 775 "$DATA_DIR/backups"
[ ! -d "$DATA_DIR/uploads" ] && mkdir -p "$DATA_DIR/uploads" && chmod 775 "$DATA_DIR/uploads"

if ! grep -q '^UPLOAD_ROOT=' "$ENV_FILE"; then
    echo "UPLOAD_ROOT=$DATA_DIR/uploads" >> "$ENV_FILE"
    grep -q '^UPLOAD_ROOT=' "$DATA_DIR/.env_config" 2>/dev/null || echo "UPLOAD_ROOT=$DATA_DIR/uploads" >> "$DATA_DIR/.env_config"
fi

for f in queue cache sessions; do
    [ -f "$DATA_DIR/$f.sqlite" ] || { touch "$DATA_DIR/$f.sqlite"; chmod 664 "$DATA_DIR/$f.sqlite"; }
done

if ! grep -q '^DB_QUEUE_CONNECTION=' "$ENV_FILE"; then
    cat >> "$ENV_FILE" << EOF
DB_QUEUE_CONNECTION=sqlite_queue
DB_QUEUE_DATABASE=$DATA_DIR/queue.sqlite
DB_CACHE_CONNECTION=sqlite_cache
DB_CACHE_LOCK_CONNECTION=sqlite_cache
DB_CACHE_DATABASE=$DATA_DIR/cache.sqlite
SESSION_CONNECTION=sqlite_sessions
DB_SESSIONS_DATABASE=$DATA_DIR/sessions.sqlite
EOF
    cp "$ENV_FILE" "$DATA_DIR/.env_config"
fi

if [ -n "${APP_URL:-}" ]; then
    upsert_env "$ENV_FILE" APP_URL "$APP_URL"
    upsert_env "$DATA_DIR/.env_config" APP_URL "$APP_URL"
fi

if [ -n "${TZ:-}" ]; then
    upsert_env "$ENV_FILE" TZ "$TZ"
    upsert_env "$DATA_DIR/.env_config" TZ "$TZ"
fi

if [ -f "$APP_DIR/VERSION" ]; then
    _version=$(tr -d '[:space:]' < "$APP_DIR/VERSION")
    if [ -n "$_version" ]; then
        upsert_env "$ENV_FILE" APP_VERSION "$_version"
        upsert_env "$DATA_DIR/.env_config" APP_VERSION "$_version"
    fi
fi

php artisan migrate --force
php artisan app:ensure-shards

php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

php artisan currencies:update --no-interaction || true

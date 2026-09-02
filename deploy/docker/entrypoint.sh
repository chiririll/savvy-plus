#!/bin/sh
set -eu

export APP_DIR="${APP_DIR:-/var/www/html}"
export DATA_DIR="${DATA_DIR:-/data}"

"$APP_DIR/scripts/bootstrap.sh"

exec /usr/bin/supervisord -c /etc/supervisord.conf

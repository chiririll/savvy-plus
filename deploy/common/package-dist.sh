#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_DIR="${OUT_DIR:-$ROOT/dist}"
VERSION="${APP_VERSION:-$(git -C "$ROOT" rev-parse --short HEAD)}"

if [[ ! -d "$ROOT/vendor" ]]; then
    echo "vendor/ is missing. Run: composer install --no-dev --optimize-autoloader" >&2
    exit 1
fi

if [[ ! -d "$ROOT/public/build" ]]; then
    echo "public/build is missing. Run: npm ci && npm run build" >&2
    exit 1
fi

STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT

copy_tree() {
    local src="$1"
    local dest="$2"
    mkdir -p "$(dirname "$dest")"
    cp -a "$src" "$dest"
}

for path in \
    app \
    bootstrap \
    config \
    database \
    public \
    resources \
    routes \
    storage \
    vendor \
    artisan \
    composer.json
do
    if [[ ! -e "$ROOT/$path" ]]; then
        echo "missing required path: $path" >&2
        exit 1
    fi
    copy_tree "$ROOT/$path" "$STAGE/$path"
done

copy_tree "$ROOT/deploy/common/bootstrap.sh" "$STAGE/scripts/bootstrap.sh"

printf '%s\n' "$VERSION" > "$STAGE/VERSION"
chmod +x "$STAGE/artisan" "$STAGE/scripts/bootstrap.sh"

# Runtime caches and logs stay empty in the archive.
find "$STAGE/bootstrap/cache" -type f ! -name '.gitignore' -delete 2>/dev/null || true
find "$STAGE/storage" -type f ! -name '.gitignore' -delete 2>/dev/null || true

mkdir -p "$OUT_DIR"
TARBALL="$OUT_DIR/savvy.tar.gz"
tar -C "$STAGE" -czf "$TARBALL" .

echo "Wrote $TARBALL (VERSION=$VERSION)"

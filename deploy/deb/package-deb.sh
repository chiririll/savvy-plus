#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_DIR="${OUT_DIR:-$ROOT/dist}"
TARBALL="${TARBALL:-$OUT_DIR/savvy.tar.gz}"
VERSION="${APP_VERSION:-}"

if [[ ! -f "$TARBALL" ]]; then
    echo "missing $TARBALL — run deploy/common/package-dist.sh first" >&2
    exit 1
fi

if ! command -v nfpm >/dev/null 2>&1; then
    echo "nfpm is not installed. See https://nfpm.goreleaser.com" >&2
    exit 1
fi

if [[ -z "$VERSION" ]]; then
    VERSION="$(tar -xOf "$TARBALL" VERSION 2>/dev/null | tr -d '[:space:]' || true)"
fi

if [[ -z "$VERSION" ]]; then
    echo "APP_VERSION is required (or the tarball must contain VERSION)" >&2
    exit 1
fi

mkdir -p "$ROOT/dist"
STAGE="$ROOT/dist/deb-root"
rm -rf "$STAGE"
mkdir -p "$STAGE"
trap 'rm -rf "$STAGE"' EXIT
tar -C "$STAGE" -xzf "$TARBALL"
rm -rf "$STAGE/deploy"

mkdir -p "$OUT_DIR"
OUT_DIR="$(cd "$OUT_DIR" && pwd)"
if command -v cygpath >/dev/null 2>&1; then
    OUT_DIR="$(cygpath -m "$OUT_DIR")"
fi

export APP_VERSION="$VERSION"
(
    cd "$ROOT/deploy/deb"
    nfpm package --config nfpm.yaml --packager deb --target "$OUT_DIR"
)

# Stable name for GitHub latest/download/savvy.deb
deb="$(ls -1t "$OUT_DIR"/savvy_*.deb | head -n1)"
cp -f "$deb" "$OUT_DIR/savvy.deb"

echo "Wrote $deb and $OUT_DIR/savvy.deb (VERSION=$VERSION)"

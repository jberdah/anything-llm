#!/usr/bin/env bash
set -e

# Préfixe si défini (exemple "/anythingllm")
BASE="${BASE_URL:-}"

# On retire les slashs de fin s’il y en a plusieurs
BASE=$(echo "$BASE" | sed 's:/*$::')

# Port par défaut
PORT="${SERVER_PORT:-3001}"

URL="http://127.0.0.1:${PORT}${BASE}/api/ping"

# essaie 3 fois avant d’échouer
if ! curl --fail --silent --show-error --retry 3 --retry-delay 1 "$URL" >/dev/null; then
  echo "Health check failed at $URL"
  exit 1
else
  echo "Health check ok at $URL"
  exit 0
fi

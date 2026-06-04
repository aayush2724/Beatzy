#!/usr/bin/env bash
# Sync ml-service/ to a Hugging Face Space (Docker SDK).
# Usage:
#   export HF_SPACE_REPO=your-username/beatzy-ml
#   ./scripts/sync-ml-to-hf.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="${HF_SPACE_REPO:?Set HF_SPACE_REPO e.g. aayush-27/beatzy-ml}"

if ! command -v huggingface-cli &>/dev/null; then
  echo "Install: pip install huggingface_hub"
  exit 1
fi

echo "→ Pushing ml-service to Space: $REPO"
cd "$ROOT/ml-service"
huggingface-cli upload "$REPO" . . --repo-type space

echo "→ After deploy, verify: curl -s https://<space>.hf.space/health | jq .storage"

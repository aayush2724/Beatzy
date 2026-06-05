#!/usr/bin/env bash
# Sync ml-service/ to a Hugging Face Space (Docker SDK).
# Usage:
#   export HF_SPACE_REPO=your-username/beatzy-ml
#   ./scripts/sync-ml-to-hf.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="${HF_SPACE_REPO:?Set HF_SPACE_REPO e.g. aayush-27/beatzy-ml}"

# Try to find 'hf' or 'huggingface-cli'
if command -v hf &>/dev/null; then
  CLI="hf"
  UPLOAD_CMD="hf upload"
  TYPE_FLAG="--type"
elif command -v huggingface-cli &>/dev/null; then
  CLI="huggingface-cli"
  UPLOAD_CMD="huggingface-cli upload"
  TYPE_FLAG="--repo-type"
elif [ -f "/home/aayush27/Documents/Projects/Chord-Detector/ml-service/venv/bin/hf" ]; then
  CLI="/home/aayush27/Documents/Projects/Chord-Detector/ml-service/venv/bin/hf"
  UPLOAD_CMD="$CLI upload"
  TYPE_FLAG="--type"
else
  echo "Install Hugging Face CLI: pip install huggingface_hub"
  exit 1
fi

echo "→ Pushing ml-service to Space: $REPO using $CLI"
cd "$ROOT/ml-service"

# Build extra arguments (e.g. --token if HF_TOKEN is defined)
TOKEN_ARG=""
if [ -n "${HF_TOKEN:-}" ]; then
  TOKEN_ARG="--token $HF_TOKEN"
fi

$UPLOAD_CMD "$REPO" . . $TYPE_FLAG space $TOKEN_ARG

echo "→ After deploy, verify: curl -s https://<space>.hf.space/health | jq .storage"

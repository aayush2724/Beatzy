#!/usr/bin/env bash
# Sync ml-service/ to an EXISTING Hugging Face Space (Docker SDK).
# Usage:
#   HF_SPACE_REPO=aayush-27/beatzy-ml ./scripts/sync-ml-to-hf.sh
#   DRY_RUN=1 HF_SPACE_REPO=aayush-27/beatzy-ml ./scripts/sync-ml-to-hf.sh   # show the plan only
# Auth: `hf auth login` once, or export HF_TOKEN.
#
# What gets deployed is exactly what git tracks under ml-service/ — .gitignore
# already keeps out .env, venv/, caches and __pycache__. Remote files outside
# that set (stale uploads, a leaked .env, a copied venv) are deleted in the same
# commit, so the Space mirrors a commit instead of accumulating junk.
#
# Why not `hf upload`: it calls create_repo(space_sdk="gradio", exist_ok=True)
# before every upload. On a free account the Hub answers that with 402 Payment
# Required — even when the Space already exists — and exist_ok only tolerates
# 409, so the CLI aborts before uploading anything. HfApi.create_commit updates
# the existing Space directly and never tries to create one.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="${HF_SPACE_REPO:?Set HF_SPACE_REPO e.g. aayush-27/beatzy-ml}"

# Find a Python that has huggingface_hub: python3, else the interpreter behind `hf`.
HF_PY=""
if command -v hf >/dev/null 2>&1; then
  HF_PY="$(head -1 "$(command -v hf)" | sed 's/^#!//')"
fi
PY=""
for candidate in python3 "$HF_PY"; do
  if [ -n "$candidate" ] && $candidate -c "import huggingface_hub" >/dev/null 2>&1; then
    PY="$candidate"
    break
  fi
done
if [ -z "$PY" ]; then
  echo "huggingface_hub not found. Install it (pip install --user huggingface_hub), then run: hf auth login"
  exit 1
fi

cd "$ROOT"

if [ -n "$(git status --porcelain -- ml-service)" ] && [ "${ALLOW_DIRTY:-0}" != "1" ]; then
  echo "ml-service/ has uncommitted changes — commit them first so the Space matches a commit."
  echo "(Set ALLOW_DIRTY=1 to deploy the working tree anyway.)"
  git status --short -- ml-service
  exit 1
fi

COMMIT="$(git rev-parse --short HEAD)"
echo "→ Syncing ml-service @ ${COMMIT} to Space: ${REPO}${DRY_RUN:+ (dry run)}"

cd ml-service
git ls-files -z | REPO="$REPO" COMMIT="$COMMIT" DRY_RUN="${DRY_RUN:-}" $PY -c '
import os, sys
from huggingface_hub import HfApi, CommitOperationAdd, CommitOperationDelete

repo, commit = os.environ["REPO"], os.environ["COMMIT"]
dry_run = bool(os.environ.get("DRY_RUN"))
tracked = [p for p in sys.stdin.read().split("\0") if p]

# Never ship secrets, even if one somehow ends up tracked.
blocked = [p for p in tracked if os.path.basename(p) == ".env"]
if blocked:
    sys.exit(f"Refusing to deploy: {blocked} is tracked by git")

api = HfApi()
info = api.space_info(repo)  # errors if the Space does not exist; never creates one
if info.sdk != "docker":
    sys.exit(f"{repo} is sdk={info.sdk!r}, expected docker")

remote = set(api.list_repo_files(repo, repo_type="space"))
# .gitattributes is the Hub-managed LFS config, not part of ml-service
stale = sorted(p for p in remote - set(tracked) if p != ".gitattributes")

print(f"  upload: {len(tracked)} tracked files")
print(f"  delete: {len(stale)} remote files not tracked by git")
for top in sorted({p.split("/")[0] for p in stale}):
    n = sum(1 for p in stale if p == top or p.startswith(top + "/"))
    print(f"    - {top} ({n})")

if dry_run:
    print("Dry run — nothing changed.")
    sys.exit(0)

ops = [CommitOperationAdd(path_in_repo=p, path_or_fileobj=p) for p in tracked]
ops += [CommitOperationDelete(path_in_repo=p) for p in stale]
result = api.create_commit(
    repo_id=repo,
    repo_type="space",
    operations=ops,
    commit_message=f"Sync ml-service from {commit}",
)
print(f"  committed: {result.commit_url}")
'

if [ -z "${DRY_RUN:-}" ]; then
  SPACE_HOST="$(echo "$REPO" | tr '/' '-' | tr '[:upper:]' '[:lower:]').hf.space"
  echo "→ The Space rebuilds now (a few minutes). Verify: curl -s https://${SPACE_HOST}/health | jq ."
fi

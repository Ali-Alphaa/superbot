#!/bin/sh
# Pulls the original project's (upstream) changes into this fork, builds, tests,
# and restarts botd only if everything passes. Safe to run on a timer.
#
# UPDATE_MODE=merge (default): merge into BRANCH, and roll back if the build or tests fail.
# UPDATE_MODE=pr: push a sync branch and open a pull request to review first.
# Env: REPO_DIR (default: the folder above this script), BRANCH (main), SERVICE (botd),
#      UPSTREAM_URL (the original repo), UPDATE_MODE.
set -eu

REPO_DIR=${REPO_DIR:-$(cd "$(dirname "$0")/.." && pwd)}
BRANCH=${BRANCH:-main}
SERVICE=${SERVICE:-botd}
UPDATE_MODE=${UPDATE_MODE:-merge}
UPSTREAM_URL=${UPSTREAM_URL:-https://github.com/davidondrej/superbot.git}
cd "$REPO_DIR"

log() { echo "[auto-update] $(date '+%Y-%m-%d %H:%M:%S') $*"; }

# Never touch a dirty tree: a merge or rollback could destroy local work.
if ! git diff --quiet || ! git diff --cached --quiet; then
  log "working tree has uncommitted changes; skipping"
  exit 0
fi

git remote get-url upstream >/dev/null 2>&1 || git remote add upstream "$UPSTREAM_URL"
git fetch -q upstream
git fetch -q origin

BEHIND=$(git rev-list --count "HEAD..upstream/$BRANCH")
if [ "$BEHIND" -eq 0 ]; then
  log "already up to date with upstream/$BRANCH"
  exit 0
fi
log "$BEHIND new upstream commit(s) on $BRANCH"

git checkout -q "$BRANCH"
before=$(git rev-parse HEAD)

if [ "$UPDATE_MODE" = "pr" ]; then
  stamp=$(date +%Y%m%d-%H%M%S)
  git checkout -q -B "sync/upstream-$stamp"
fi

if ! git merge --no-edit -q "upstream/$BRANCH"; then
  log "merge conflict; aborting and leaving $BRANCH unchanged"
  git merge --abort
  git checkout -q "$BRANCH"
  exit 1
fi

# Gate: the update must build and pass tests.
if ! (cargo build --release && cargo test --release); then
  log "build or tests failed"
  if [ "$UPDATE_MODE" = "pr" ]; then
    git checkout -q "$BRANCH"
    git branch -D "sync/upstream-$stamp" >/dev/null 2>&1 || true
  else
    git reset -q --hard "$before"
    log "rolled back to $before"
  fi
  exit 1
fi

if [ "$UPDATE_MODE" = "pr" ]; then
  git push -q -u origin "sync/upstream-$stamp"
  gh pr create --base "$BRANCH" --head "sync/upstream-$stamp" \
    --title "Sync upstream changes ($BEHIND commits)" \
    --body "Automatic sync. Build and tests passed. Review the diff, then merge."
  git checkout -q "$BRANCH"
  log "pull request opened; nothing restarted until you merge it"
  exit 0
fi

git push -q origin "$BRANCH"
log "updated $BRANCH to $(git rev-parse --short HEAD)"

if command -v systemctl >/dev/null 2>&1 && systemctl --user cat "$SERVICE" >/dev/null 2>&1; then
  systemctl --user restart "$SERVICE"
  log "restarted $SERVICE"
else
  log "no user service named $SERVICE; restart botd by hand"
fi

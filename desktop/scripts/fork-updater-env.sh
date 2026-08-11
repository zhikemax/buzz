#!/usr/bin/env bash
# Default Tauri updater env for zhikemax/buzz fork release builds.
# Usage (do not commit secrets):
#   source desktop/scripts/fork-updater-env.sh
#   export BUZZ_UPDATER_PUBLIC_KEY='...'
#   export TAURI_SIGNING_PRIVATE_KEY='...'
#   # then run build-release-config.mjs + tauri build

FORK_GITHUB_REPO="${FORK_GITHUB_REPO:-zhikemax/buzz}"
export BUZZ_UPDATER_ENDPOINT="${BUZZ_UPDATER_ENDPOINT:-https://github.com/${FORK_GITHUB_REPO}/releases/download/buzz-desktop-latest/latest.json}"
echo "BUZZ_UPDATER_ENDPOINT=$BUZZ_UPDATER_ENDPOINT"

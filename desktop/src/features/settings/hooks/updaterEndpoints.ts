/**
 * GitHub release / Tauri updater endpoints for this personal fork.
 *
 * Official block/buzz packages must NOT be used — different signing key and
 * no fork-local mods (zh-CN, AimaxHug, etc.). Bake `BUZZ_UPDATER_ENDPOINT`
 * to {@link UPDATER_LATEST_JSON_URL} when producing release installs.
 */
export const FORK_GITHUB_REPO = "zhikemax/buzz";

export const GITHUB_RELEASES_URL =
  `https://github.com/${FORK_GITHUB_REPO}/releases/latest` as const;

/** Rolling Tauri updater manifest (uploaded last on each non-prerelease). */
export const UPDATER_LATEST_JSON_URL =
  `https://github.com/${FORK_GITHUB_REPO}/releases/download/buzz-desktop-latest/latest.json` as const;

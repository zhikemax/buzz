# Local mods — file map & recipes

## i18n

- `desktop/src/shared/i18n/LocaleProvider.tsx` — wraps app; language preference
- `desktop/src/shared/i18n/locale.ts`, `dateLocale.ts`
- `desktop/src/shared/i18n/messages/en.ts` — source of `MessageKey`
- `desktop/src/shared/i18n/messages/zh-CN.ts` — must mirror every key
- Wired areas: settings, sidebar, home inbox, agents, relative time, onboarding
  chrome, mobile pairing, appearance (incl. link preview)

When upstream adds English in a component already localized: replace literal
with `t("…")` and add both catalogs. When upstream adds a brand-new screen:
localize in the same merge if the surrounding shell is already using `useT`.

## Local closed-loop community create

- `desktop/src/features/communities/ui/LocalCommunityCreateForm.tsx` — create
  against local Docker relay (default host/port for this machine)
- `WelcomeSetup.tsx` — create branch renders `LocalCommunityCreateForm`
- `AddCommunityDialog.tsx` — same for add-community create

`HostedCommunityOnboarding.tsx` may still exist for official/hosted flows.
Do not force welcome create back to hosted during merge.

## Managed-agent localhost Host

Symptom: agent gets 👀 ack but no reply / 404 when community is on
`localhost` and code rewrites loopback to `127.0.0.1`.

Fix: pass **caller** relay URL into child `BUZZ_RELAY_URL` and probes;
use canonical URL only for pair identity.

Related badge bug: spawn snapshot must stamp **canonical**
`runtime_key.relay_url`, not connect spelling — otherwise prospective
(`127.0.0.1`) vs stamp (`localhost`) forever shows「需要重启 / Relay url».

Files historically touched:

- `desktop/src-tauri/src/managed_agents/runtime.rs`
- `desktop/src-tauri/src/managed_agents/restore.rs`
- `desktop/src-tauri/src/managed_agents/runtime_commands.rs`

## Windows local build

- `desktop/src-tauri/Cargo.toml` — optional feature `mesh-llm = []` (empty) to
  skip git mesh-llm deps that break this environment
- `crates/buzz-voice/Cargo.toml` — sherpa-onnx shared features as needed
- Large `desktop/src-tauri/Cargo.lock` churn — expected when toggling these

Re-apply after upstream bumps these files. Do not open upstream PRs that
disable mesh-llm unless asked.

## AimaxHug default LLM provider

- UI id `aimaxhug` first in provider pickers; credentials = `OPENAI_COMPAT_API_KEY`
- Default for fresh global config (no file yet) and empty frontend placeholders
- Spawn/readiness/discovery rewrite via `desktop/src-tauri/src/managed_agents/aimaxhug.rs`
  → OpenAI transport, `OPENAI_COMPAT_BASE_URL=https://api.aimaxhug.cloud/v1`
- Key guide CTA → `https://api.aimaxhug.cloud`
- **Codex / Claude Code / catalog CLIs**: Agent Defaults uses the same
  provider + API key + model fields as Buzz Agent. AimaxHug key unlocks spawn
  via gateway env inject:
  - Claude → `ANTHROPIC_API_KEY` + `ANTHROPIC_BASE_URL`
  - Codex → managed `CODEX_HOME` (`%AppData%/Buzz/codex-aimaxhug`) with
    `model_providers.aimaxhug` + `wire_api=responses` (Codex ignores fake
    `CODEX_CONFIG` env). Claude-named models remap to `gpt-5` for Codex.
  - Other presets → generic OpenAI + Anthropic env pair
  Optional vendor login lives on Agent Defaults **登录授权** tab.
  When Configuration API key is set: login tab says config is ready /
  login is optional. When both are set, spawn prefers vendor login.
  Logged-in state offers **取消授权** (`disconnect_acp_runtime`) to fall
  back to the Configuration key.
  Doctor rows: no 「需要登录」 / ···; CLI guide under each row.
  Readiness: gateway key **or** vendor login.
## Dev keyring scoped migration

Symptom (Windows): restart managed agent fails with
`has no private key available — the OS keyring may be unreachable` when
launching with `BUZZ_DEV_KEYRING_SERVICE=buzz-desktop-dev.main` (or other
`buzz-desktop-dev.<scope>`).

Cause: agent nsecs live under `buzz-desktop-dev` / `buzz-desktop` credential
blobs; old migration only ran for exact `"buzz-desktop-dev"`, so scoped
services stayed empty (and an early migration marker blocked recovery).

Fix: `desktop/src-tauri/src/managed_agents/storage.rs` —
`migrate_agent_keys_to_dev_service` for any `buzz-desktop-dev*` service;
scoped copies from default-dev then prod; re-copy if marker exists but an
agent key is still missing.

## Desktop auto-update (fork)

UI already exists (sidebar card + Settings → Software Updates). Official
`block/buzz` updater channel must **not** be used on this fork.

- Endpoints: `desktop/src/features/settings/hooks/updaterEndpoints.ts`
  → `zhikemax/buzz` releases / `buzz-desktop-latest/latest.json`
- CI: `.github/workflows/release-desktop-fork.yml` (Windows + macOS arm64/x64;
  repo gate `zhikemax/buzz`). macOS Build sidecars must include
  `-p buzz-backend-kubernetes` (Windows omits it; `bundle-sidecars.sh`
  only requires that binary on non-Windows).
- Docs: `desktop/docs/FORK_AUTO_UPDATE.md`
- Local bake helper: `source desktop/scripts/fork-updater-env.sh` then set
  `BUZZ_UPDATER_PUBLIC_KEY` + `TAURI_SIGNING_PRIVATE_KEY`

**Secrets (GitHub Actions, never commit):**

| Secret | Role |
|--------|------|
| `BUZZ_UPDATER_PUBLIC_KEY` | Baked into release binary |
| `TAURI_SIGNING_PRIVATE_KEY` | Signs updater artifacts |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Optional |

Generate: `cargo tauri signer generate -w ~/.tauri/buzz-fork.key`

Users must install **one** release build that was baked with these secrets;
`just dev` / unsigned debug builds show “auto-update unavailable”.
macOS first install is Apple-unsigned (Gatekeeper: right-click → Open).

## Never commit

- `desktop/tauri.dev.local.json`
- Local secrets / `.env` with keys / Tauri signing private keys
- Accidental Hermit `bin/` PATH workarounds as permanent project changes

## Post-merge checklist extras

After resolving TS merge conflicts involving personas/catalog:

- Nested chooser/detail components need local `useT()` — parent `personaCatalogCopy`
  is not in scope
- `editPersonaDialogState(persona, t)` / `duplicatePersonaDialogState(persona, t)`
  — always pass `t`
- Run `pnpm exec tsc --noEmit -p tsconfig.json` in `desktop/`

## Remotes

- `origin` → `https://github.com/zhikemax/buzz.git` (push here)
- `upstream` → `https://github.com/block/buzz.git` (fetch/merge `upstream/main`)

## Desktop version = official

Keep `desktop/package.json`, `desktop/src-tauri/tauri.conf.json`, and
`desktop/src-tauri/Cargo.toml` (+ lock) **identical** to `upstream/main`.
Do **not** bump ahead (e.g. fork-only `0.5.10` while official is `0.5.9`) —
users will misread the fork as a different product line.

Fork release tags stay `desktop-vX.Y.Z` matching that same official version.
If a prior fork tag already pointed at older code, move/rebuild that tag
only when intentionally re-shipping the synced tree under the same version.

## Sync anti-patterns (see SKILL.md)

- GitHub **Sync fork** alone does **not** update `feat/zh-CN-i18n`.
- Real project update = `git fetch upstream main` + `git merge upstream/main`
  on `feat/zh-CN-i18n`, then parity + `tsc`, then `git push origin HEAD`.
- Never push to `upstream` unless the user explicitly asks.
- Never bump desktop version past official just to mint a new release tag.

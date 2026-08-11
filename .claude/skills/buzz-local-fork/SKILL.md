---
name: buzz-local-fork
description: >-
  Maintains this Buzz fork's local mods (zh-CN i18n, local Docker closed-loop
  community create, managed-agent localhost Host fix, Windows build tweaks) and
  syncs them onto official block/buzz main without losing either side. Use when
  the user mentions 同步官方, 官方同步, 版本升级, sync upstream/main, 汉化,
  zh-CN i18n, 本地闭环, LocalCommunityCreateForm, localhost Host, mesh-llm
  Windows build, Sync fork, 源仓库更新, fork 同步, 如何同步官方, or updating
  the feat/zh-CN-i18n branch after upstream moves.
---

# Buzz local fork — sync + preserve mods

This checkout is **not** stock Buzz. Keep both: upstream features **and** local
behavior. Never "resolve conflicts by taking theirs" blindly.

## Topology (do not confuse remotes)

```text
block/buzz (upstream)          ← official source; FETCH / MERGE only
        │
        │  git fetch upstream main
        │  git merge upstream/main   (on feat/zh-CN-i18n)
        ▼
local: feat/zh-CN-i18n         ← working branch (i18n + fork mods)
        │
        │  git push origin HEAD
        ▼
zhikemax/buzz (origin)         ← personal GitHub fork; default PUSH target
```

| Remote | URL | Role |
|--------|-----|------|
| `upstream` | `https://github.com/block/buzz.git` | Official — **fetch/merge `main` only** |
| `origin` | `https://github.com/zhikemax/buzz.git` | Personal fork — **default push** |
| `gitee` | *(optional; ask user for URL)* | Never invent; never treat as `origin` |

Default working branch: **`feat/zh-CN-i18n`**. Commits need DCO: `git commit -s`.

## Critical: what does NOT sync the project

| Action | Effect | Enough to update this project? |
|--------|--------|--------------------------------|
| GitHub UI **Sync fork** | Updates fork default branch (often `origin/main`) toward `upstream/main` | **No** — does **not** merge into `feat/zh-CN-i18n` |
| `git fetch origin` only | Refreshes fork remotes | **No** — does not pull official commits |
| `git pull` with no upstream | May only track `origin` | **No** unless that branch already contains upstream |
| `git merge upstream/main` on `feat/zh-CN-i18n` | Brings official into the working branch | **Yes** — this is the real sync |
| `git push origin HEAD` | Publishes the fused branch to the fork | Required after a successful local merge |

**Rule:** Official updates become *this project* only after they are merged (or
rebased) into **`feat/zh-CN-i18n`**. Syncing the fork on GitHub alone is not
enough. Prefer `merge upstream/main` over relying on Sync-fork + `merge
origin/main` (the latter is optional bookkeeping).

## Sync workflow (do this)

When the user says 同步官方 / sync upstream / 源仓库更新 / 版本升级, run:

```text
Progress:
- [ ] 1. On feat/zh-CN-i18n; commit or stash WIP (never lose Host / i18n mid-merge)
- [ ] 2. Confirm remotes: upstream=block/buzz, origin=zhikemax/buzz
- [ ] 3. git fetch upstream main
- [ ] 4. git merge upstream/main   (preferred; rebase only if user asks)
- [ ] 5. Resolve conflicts with rules below — never blind "take theirs"
- [ ] 6. i18n key parity en ↔ zh-CN (1:1, no duplicate keys)
- [ ] 7. desktop tsc --noEmit
- [ ] 8. Merge commit with -s (DCO); leave tauri.dev.local.json untracked
- [ ] 9. git push origin HEAD     (GitHub fork — not upstream, not gitee)
```

PowerShell-friendly commands:

```powershell
git fetch upstream main
git merge upstream/main
# after conflicts fixed:
cd desktop; pnpm exec tsc --noEmit -p tsconfig.json
git commit -s   # complete merge if needed; do not --no-verify
git push -u origin HEAD
```

Activate Hermit before hooks/toolchain: `. ./bin/activate-hermit` (or repo
equivalent). Do not rewrite hook PATH.

### Optional: also refresh fork `main`

Only if the user wants `origin/main` aligned with official (does **not** replace
step 4 above):

```powershell
git fetch upstream main
git push origin upstream/main:main   # only when user explicitly wants fork main updated
```

Or use GitHub **Sync fork**, then still merge into `feat/zh-CN-i18n`.

## Local mods inventory

| Mod | Keep? | Upstream PR? | Key paths |
|-----|-------|--------------|-----------|
| zh-CN desktop i18n | Yes | Yes (i18n-only) | `desktop/src/shared/i18n/` (`en.ts`, `zh-CN.ts`, `LocaleProvider`) |
| Local closed-loop create (not Builderlab hosted) | Yes | **No** (personal) | `LocalCommunityCreateForm.tsx`; create path in `WelcomeSetup.tsx`, `AddCommunityDialog.tsx` |
| Managed-agent `BUZZ_RELAY_URL` Host spelling | Yes | Yes | `desktop/src-tauri/src/managed_agents/runtime.rs` (+ restore / runtime_commands) |
| Windows mesh-llm off / sherpa shared | Yes locally | **No** | `desktop/src-tauri/Cargo.toml` (`mesh-llm = []`), `crates/buzz-voice/Cargo.toml` |
| AimaxHug default LLM provider | Yes locally | **No** | `aimaxhug.rs`, agent UI provider catalog |
| Fork desktop auto-update | Yes locally | **No** | `updaterEndpoints.ts`, `release-desktop-fork.yml`, `desktop/docs/FORK_AUTO_UPDATE.md` |
| Dev Tauri override | Local only | **Never commit** | `desktop/tauri.dev.local.json` |

Details and conflict recipes: [local-mods.md](local-mods.md).

## Conflict resolution rules

1. **Upstream structure wins for new features** — keep new UI/logic from
   `upstream/main`, then re-wire user-visible strings through `useT()` / `t("key")`.
2. **Create-community path stays local** — welcome / add-community **create**
   continues to use `LocalCommunityCreateForm`, not `HostedCommunityOnboarding`.
   Hosted code may remain in tree for join/other flows; do not delete it just to
   "clean up".
3. **Agent Host spelling** — child `BUZZ_RELAY_URL` / probe must use the
   **caller-supplied** URL. Pair identity may canonicalize loopback to
   `127.0.0.1`; do **not** force that spelling into the child env (Docker
   communities are often Host-bound to `localhost`).
4. **i18n helpers that take `t`** — after upstream changes signatures (e.g.
   `editPersonaDialogState(persona, t)`), update all call sites; nested
   components need their own `useT()` + `getPersonaCatalogCopy(t)`.
5. **Windows Cargo tweaks** — if `Cargo.toml` conflicts, re-apply local
   `mesh-llm = []` / sherpa shared after taking upstream dependency bumps.

## i18n parity (required after sync)

- Keys in `en.ts` and `zh-CN.ts` must match 1:1 (`MessageKey` comes from `en`).
- New upstream English UI → add key to **both** catalogs in the same change.
- Pattern: `const t = useT();` then `t("namespace.key", { name })`.
- Prefer rem Tailwind tokens for text; never new `text-[Npx]`.

On Windows PowerShell, prefer a temp parity script (inline `node -e` regex often
breaks). Write `tmp-i18n-parity.mjs` at repo root, run `node tmp-i18n-parity.mjs`,
delete it. Exit non-zero if missing/extra/duplicate keys.

## Local runtime notes (do not "fix" to official defaults)

- Compose relay often on **`ws://localhost:13000`** (not 3000) on this machine.
- Community Host must be **`localhost`**, not `127.0.0.1`, when the Docker
  community is bound that way.
- Global agent config (Windows): `%APPDATA%\xyz.block.buzz.app.dev\agents\`.
- Avoid Hermit shims from `buzz/bin` accidentally shadowing real `node`/`pnpm`
  when debugging desktop builds.

## PR hygiene

| Ship upstream | Keep fork-only |
|---------------|----------------|
| i18n catalogs + `t()` wiring | LocalCommunityCreateForm create path |
| managed-agent localhost Host fix | `mesh-llm = []` / Windows Cargo hacks |
| | `tauri.dev.local.json` |

Prefer splitting PRs; never include local closed-loop or Windows Cargo disable
in an i18n PR without explicit user request.

### Push wording (avoid wrong remote)

| User says | Action |
|-----------|--------|
| 推送 / 推仓库 / 推送仓库 / push / 推到 fork | `git push -u origin HEAD` → **GitHub** `zhikemax/buzz` |
| 推送 GitHub / 推 origin | same → `origin` |
| 推送 Gitee / 推 gitee | Only if remote `gitee` exists; else **ask for URL first**. Never push Gitee to `origin`. |
| 推官方 / push upstream | **Refuse** unless user explicitly wants to push to `block/buzz` (they usually do not) |

Ambiguous「推送仓库」= **GitHub origin**, not Gitee, not upstream.

## More local changes later

1. Stay on `feat/zh-CN-i18n` (or cut `feat/...` from it for a focused PR).
2. Before big work: `git fetch upstream main && git merge upstream/main` (this skill).
3. Classify the change:
   - **Upstream-worthy** (i18n keys, Host fix, real bugs) → clean commit, push
     `origin`, open PR `zhikemax/buzz` → `block/buzz`.
   - **Fork-only** (LocalCommunityCreateForm, Windows `mesh-llm = []`,
     `tauri.dev.local.json`) → commit on the fork branch; do **not** put in an
     upstream PR unless the user asks.
4. After any UI string change: update **both** `en.ts` and `zh-CN.ts`, then
   `cd desktop && pnpm exec tsc --noEmit`.
5. Say in chat:「同步官方」or「按 buzz-local-fork 做 xxx」so the agent reloads
   these rules.

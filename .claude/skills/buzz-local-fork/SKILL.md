---
name: buzz-local-fork
description: >-
  Maintains this Buzz fork's local mods (zh-CN i18n, local Docker closed-loop
  community create, managed-agent localhost Host fix, Windows build tweaks) and
  syncs them onto official block/buzz main without losing either side. Use when
  the user mentions 同步官方, 官方同步, 版本升级, sync upstream/main, 汉化,
  zh-CN i18n, 本地闭环, LocalCommunityCreateForm, localhost Host, mesh-llm
  Windows build, or updating the feat/zh-CN-i18n branch after upstream moves.
---

# Buzz local fork — sync + preserve mods

This checkout is **not** stock Buzz. Keep both: upstream features **and** local
behavior. Never "resolve conflicts by taking theirs" blindly.

## Local mods inventory

| Mod | Keep? | Upstream PR? | Key paths |
|-----|-------|--------------|-----------|
| zh-CN desktop i18n | Yes | Yes (i18n-only) | `desktop/src/shared/i18n/` (`en.ts`, `zh-CN.ts`, `LocaleProvider`) |
| Local closed-loop create (not Builderlab hosted) | Yes | **No** (personal) | `LocalCommunityCreateForm.tsx`; create path in `WelcomeSetup.tsx`, `AddCommunityDialog.tsx` |
| Managed-agent `BUZZ_RELAY_URL` Host spelling | Yes | Yes | `desktop/src-tauri/src/managed_agents/runtime.rs` (+ restore / runtime_commands) |
| Windows mesh-llm off / sherpa shared | Yes locally | **No** | `desktop/src-tauri/Cargo.toml` (`mesh-llm = []`), `crates/buzz-voice/Cargo.toml` |
| Dev Tauri override | Local only | **Never commit** | `desktop/tauri.dev.local.json` |

Details and conflict recipes: [local-mods.md](local-mods.md).

## Sync workflow (do this)

```text
Progress:
- [ ] 1. Commit or stash WIP (never lose localhost Host / i18n mid-merge)
- [ ] 2. git fetch upstream main
- [ ] 3. Merge (preferred) or rebase onto upstream/main on feat/zh-CN-i18n
- [ ] 4. Resolve conflicts with rules below
- [ ] 5. i18n key parity en ↔ zh-CN
- [ ] 6. desktop tsc --noEmit
- [ ] 7. Merge commit with -s (DCO); leave tauri.dev.local.json untracked
- [ ] 8. git push origin HEAD
```

Commands (PowerShell-friendly):

```bash
git fetch upstream main
git merge upstream/main
# after conflicts fixed:
cd desktop && pnpm exec tsc --noEmit -p tsconfig.json
git commit -s   # complete merge; do not --no-verify
git push origin HEAD
```

Activate Hermit before hooks/toolchain: `. ./bin/activate-hermit` (or repo
equivalent). Do not rewrite hook PATH.

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

Quick parity check:

```bash
node --input-type=module -e "
import { readFileSync } from 'node:fs';
const ex = (p) => [...readFileSync(p,'utf8').matchAll(/\"([^\"]+)\":/g)].map(m => m[1]);
const en = new Set(ex('desktop/src/shared/i18n/messages/en.ts'));
const zh = new Set(ex('desktop/src/shared/i18n/messages/zh-CN.ts'));
console.log([...en].filter(k => !zh.has(k)));
console.log([...zh].filter(k => !en.has(k)));
"
```

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

## Remotes (this fork)

| Remote | URL | Role |
|--------|-----|------|
| `origin` | `https://github.com/zhikemax/buzz.git` | Personal fork — push feature branches here |
| `upstream` | `https://github.com/block/buzz.git` | Official — fetch/merge `upstream/main` only |

```bash
git fetch upstream main
git merge upstream/main
# push your branch to the fork:
git push -u origin HEAD
```

## Branch

Default working branch: `feat/zh-CN-i18n`. Commits need DCO: `git commit -s`.

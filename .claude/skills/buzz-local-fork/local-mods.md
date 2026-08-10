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

Fix idea: pass **caller** relay URL into child `BUZZ_RELAY_URL` and probes;
use canonical URL only for pair identity if needed.

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

## Never commit

- `desktop/tauri.dev.local.json`
- Local secrets / `.env` with keys
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

## Sync anti-patterns (see SKILL.md)

- GitHub **Sync fork** alone does **not** update `feat/zh-CN-i18n`.
- Real project update = `git fetch upstream main` + `git merge upstream/main`
  on `feat/zh-CN-i18n`, then parity + `tsc`, then `git push origin HEAD`.
- Never push to `upstream` unless the user explicitly asks.

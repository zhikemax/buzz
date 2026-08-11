# Fork desktop auto-update (zhikemax/buzz)

Official `block/buzz` release.yml only runs on `github.repository == 'block/buzz'`.
This workflow builds a **Windows x86_64** NSIS installer with Tauri updater
artifacts, publishes `desktop-v*`, and refreshes rolling `buzz-desktop-latest/latest.json`.

## Secrets (repo Settings → Secrets → Actions)

| Secret | Purpose |
|--------|---------|
| `BUZZ_UPDATER_PUBLIC_KEY` | Tauri updater pubkey baked into the binary |
| `TAURI_SIGNING_PRIVATE_KEY` | Signs `.exe.sig` / updater artifacts |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Optional key password |

Generate once (never commit):

```bash
cargo tauri signer generate -w ~/.tauri/buzz-fork.key
# pubkey → BUZZ_UPDATER_PUBLIC_KEY
# private key file contents → TAURI_SIGNING_PRIVATE_KEY
```

## Trigger

```bash
git tag desktop-v0.0.1
git push origin desktop-v0.0.1
```

First run: create an empty GitHub Release named `buzz-desktop-latest` (no assets
required) so `gh release upload buzz-desktop-latest latest.json` succeeds.

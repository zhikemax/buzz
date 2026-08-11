# Fork desktop auto-update (zhikemax/buzz)

Official `block/buzz` release.yml only runs on `github.repository == 'block/buzz'`.
This workflow builds **Windows x86_64** + **macOS Apple Silicon & Intel** installers
with Tauri updater artifacts, publishes `desktop-v*`, and refreshes rolling
`buzz-desktop-latest/latest.json`.

macOS builds are **not** Apple Developer–signed/notarized (fork has no Block
signing secrets). First install may need right-click → Open. In-app updates still
verify Tauri updater `.sig` files.

## Secrets (repo Settings → Secrets → Actions)

| Secret | Purpose |
|--------|---------|
| `BUZZ_UPDATER_PUBLIC_KEY` | Tauri updater pubkey baked into the binary |
| `TAURI_SIGNING_PRIVATE_KEY` | Signs `.exe.sig` / `.app.tar.gz.sig` |
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

Watch **Release Desktop (fork)** on Actions. `latest.json` platforms:

- `windows-x86_64`
- `darwin-aarch64`
- `darwin-x86_64`

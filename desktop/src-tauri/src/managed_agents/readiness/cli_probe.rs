use std::path::Path;

use crate::managed_agents::runtime::build_augmented_path;

/// Build the augmented PATH for CLI probes and other native child processes
/// (auth commands, `buzz-acp models` discovery), including nvm's default
/// Node.js bin directory so `#!/usr/bin/env node` shims (e.g. codex-acp)
/// resolve.
pub(crate) fn augmented_path() -> Option<String> {
    let home = dirs::home_dir();
    let nvm_bin = home
        .as_deref()
        .and_then(crate::managed_agents::find_nvm_default_bin);
    build_augmented_path(
        home,
        std::env::current_exe()
            .ok()
            .and_then(|exe| exe.parent().map(std::path::Path::to_path_buf)),
        crate::managed_agents::login_shell_path(),
        nvm_bin,
    )
}

/// Outcome of a CLI login-status probe.
#[derive(Debug, PartialEq, Eq)]
pub(crate) enum ProbeOutcome {
    /// Official vendor OAuth (Claude.ai subscription / ChatGPT login).
    /// This is what Agent Defaults「登录授权」means by "signed in".
    VendorLoggedIn,
    /// CLI has usable API-key / settings credentials (exit 0) but not vendor
    /// OAuth — ready to run, yet the Login tab must not claim「已登录」.
    ApiCredentialReady,
    /// The CLI exited non-zero without a config-parse signal — treat as
    /// "not authenticated."
    LoggedOut,
    /// The CLI exited non-zero and its stderr contains a config-parse error
    /// (e.g. from `~/.codex/config.toml`). The user needs to fix their
    /// config, not re-run login.
    ConfigInvalid {
        /// A trimmed excerpt of the stderr message to surface in the nudge.
        stderr_excerpt: String,
    },
}

impl ProbeOutcome {
    /// Map to catalog `AuthStatus` for the Login tab / Doctor.
    /// Only vendor OAuth counts as `LoggedIn`.
    pub(crate) fn to_auth_status(self) -> crate::managed_agents::AuthStatus {
        use crate::managed_agents::AuthStatus;
        match self {
            Self::VendorLoggedIn => AuthStatus::LoggedIn,
            Self::ApiCredentialReady | Self::LoggedOut => AuthStatus::LoggedOut,
            Self::ConfigInvalid { stderr_excerpt } => AuthStatus::ConfigInvalid {
                diagnostic: stderr_excerpt,
            },
        }
    }
}

/// Signals emitted to stderr by codex (and related CLI tools) when they
/// fail to parse their config file. We check these to distinguish a
/// config-parse failure from a genuine "not authenticated" exit.
///
/// The real codex error reads:
///   `Error loading configuration: .../.codex/config.toml:... unknown variant ...`
/// So we require BOTH "error loading configuration" AND "unknown variant" to be
/// present, avoiding false positives from unrelated errors that mention only
/// one term.
const CONFIG_PARSE_SIGNALS: &[&str] = &["error loading configuration", "unknown variant"];

/// Run the probe at the resolved absolute path so the GUI-PATH gap is
/// bypassed. Injects the same augmented PATH used for launched agents so
/// script shims with `/usr/bin/env <interpreter>` shebangs can find runtimes
/// such as node/python when the app was launched with a bare GUI PATH.
pub(crate) fn login_probe(
    binary_path: &Path,
    probe_args: &[&str],
    augmented_path: Option<&str>,
) -> ProbeOutcome {
    let mut command = std::process::Command::new(binary_path);
    command.args(&probe_args[1..]);
    if let Some(path) = augmented_path {
        command.env("PATH", path);
    }
    crate::util::configure_no_window(&mut command);

    match command.output() {
        Ok(o) => classify_vendor_auth_probe(
            probe_args.first().copied().unwrap_or(""),
            &o.stdout,
            &o.stderr,
            o.status.success(),
        ),
        Err(_) => ProbeOutcome::LoggedOut,
    }
}

/// Classify collected probe output into a `ProbeOutcome`.
///
/// Shared between `login_probe` (which has the full `Output`) and the
/// process-level timeout path in `probe_auth_status` (which drains stdout /
/// stderr on background threads).
pub(crate) fn classify_probe_output(stderr_bytes: &[u8], exit_success: bool) -> ProbeOutcome {
    // Legacy callers without stdout — treat success as API-credential ready
    // (not vendor OAuth) so Login tab does not falsely claim「已登录」.
    classify_vendor_auth_probe("", &[], stderr_bytes, exit_success)
}

/// Classify Claude / Codex (and generic) auth-status output.
///
/// Claude: parse `claude auth status` JSON; only `authMethod == "claude.ai"`
/// is vendor OAuth. Settings/`ANTHROPIC_API_KEY` also report `loggedIn: true`
/// and must surface as [`ProbeOutcome::ApiCredentialReady`].
///
/// Codex: `"Logged in using ChatGPT"` → vendor; `"Logged in using an API key"`
/// → API credential.
pub(crate) fn classify_vendor_auth_probe(
    cli_name: &str,
    stdout_bytes: &[u8],
    stderr_bytes: &[u8],
    exit_success: bool,
) -> ProbeOutcome {
    if !exit_success {
        let stderr = String::from_utf8_lossy(stderr_bytes);
        let stderr_lower = stderr.to_lowercase();
        if CONFIG_PARSE_SIGNALS
            .iter()
            .all(|sig| stderr_lower.contains(sig))
        {
            let excerpt = stderr.trim().lines().next().unwrap_or("").to_string();
            return ProbeOutcome::ConfigInvalid {
                stderr_excerpt: excerpt,
            };
        }
        return ProbeOutcome::LoggedOut;
    }

    let stdout = String::from_utf8_lossy(stdout_bytes);
    let stderr = String::from_utf8_lossy(stderr_bytes);
    let combined = format!("{stdout}\n{stderr}");
    let cli = cli_name
        .rsplit(['/', '\\'])
        .next()
        .unwrap_or(cli_name)
        .trim_end_matches(".exe")
        .trim_end_matches(".cmd")
        .trim_end_matches(".bat")
        .to_ascii_lowercase();

    if cli == "claude" {
        return classify_claude_auth_status(&stdout);
    }
    if cli == "codex" {
        return classify_codex_login_status(&combined);
    }

    // Unknown CLI with exit 0 — keep prior "ready" semantics without claiming
    // vendor OAuth in the Login tab.
    ProbeOutcome::ApiCredentialReady
}

fn classify_claude_auth_status(stdout: &str) -> ProbeOutcome {
    let trimmed = stdout.trim();
    let Ok(value) = serde_json::from_str::<serde_json::Value>(trimmed) else {
        // Older CLIs / text mode: exit 0 without JSON — treat as credentials
        // present, not necessarily Claude.ai OAuth.
        return if trimmed.is_empty() {
            ProbeOutcome::ApiCredentialReady
        } else if trimmed.to_ascii_lowercase().contains("not logged in") {
            ProbeOutcome::LoggedOut
        } else {
            ProbeOutcome::ApiCredentialReady
        };
    };
    let logged_in = value
        .get("loggedIn")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    if !logged_in {
        return ProbeOutcome::LoggedOut;
    }
    let auth_method = value
        .get("authMethod")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .trim()
        .to_ascii_lowercase();
    // Official subscription /claude.ai OAuth only. `oauth_token` + settings
    // `ANTHROPIC_API_KEY` (third-party gateways) must not light「已登录」.
    if auth_method == "claude.ai" {
        ProbeOutcome::VendorLoggedIn
    } else {
        ProbeOutcome::ApiCredentialReady
    }
}

fn classify_codex_login_status(combined: &str) -> ProbeOutcome {
    let lower = combined.to_ascii_lowercase();
    if lower.contains("not logged in") {
        return ProbeOutcome::LoggedOut;
    }
    if lower.contains("logged in using chatgpt") {
        return ProbeOutcome::VendorLoggedIn;
    }
    if lower.contains("logged in using an api key")
        || lower.contains("logged in using amazon bedrock")
        || lower.contains("logged in using personal access token")
        || lower.contains("logged in using access token")
    {
        return ProbeOutcome::ApiCredentialReady;
    }
    // Exit 0 with unrecognized text — credentials exist, not ChatGPT OAuth.
    ProbeOutcome::ApiCredentialReady
}

#[cfg(test)]
mod tests {
    use super::{classify_vendor_auth_probe, ProbeOutcome, CONFIG_PARSE_SIGNALS};

    #[test]
    fn claude_settings_api_key_is_not_vendor_login() {
        let json = r#"{
          "loggedIn": true,
          "authMethod": "oauth_token",
          "apiProvider": "firstParty",
          "apiKeySource": "ANTHROPIC_API_KEY"
        }"#;
        assert_eq!(
            classify_vendor_auth_probe("claude", json.as_bytes(), b"", true),
            ProbeOutcome::ApiCredentialReady
        );
        assert_eq!(
            classify_vendor_auth_probe("claude", json.as_bytes(), b"", true).to_auth_status(),
            crate::managed_agents::AuthStatus::LoggedOut
        );
    }

    #[test]
    fn claude_ai_oauth_is_vendor_login() {
        let json = r#"{
          "loggedIn": true,
          "authMethod": "claude.ai",
          "subscriptionType": "pro",
          "email": "user@example.com"
        }"#;
        assert_eq!(
            classify_vendor_auth_probe("claude", json.as_bytes(), b"", true),
            ProbeOutcome::VendorLoggedIn
        );
    }

    #[test]
    fn claude_logged_out_json() {
        let json = r#"{"loggedIn":false,"authMethod":"none"}"#;
        assert_eq!(
            classify_vendor_auth_probe("claude", json.as_bytes(), b"", true),
            ProbeOutcome::LoggedOut
        );
    }

    #[test]
    fn codex_api_key_is_not_vendor_login() {
        assert_eq!(
            classify_vendor_auth_probe(
                "codex",
                b"",
                b"Logged in using an API key - sk-teamo***b5354\n",
                true
            ),
            ProbeOutcome::ApiCredentialReady
        );
    }

    #[test]
    fn codex_chatgpt_is_vendor_login() {
        assert_eq!(
            classify_vendor_auth_probe("codex", b"", b"Logged in using ChatGPT\n", true),
            ProbeOutcome::VendorLoggedIn
        );
    }

    #[cfg(unix)]
    #[test]
    fn login_probe_uses_augmented_path_for_env_shebang_interpreter() {
        use std::fs;
        use std::os::unix::fs::PermissionsExt;

        let temp = tempfile::tempdir().expect("temp dir");
        let script_dir = temp.path().join("script-bin");
        let interpreter_dir = temp.path().join("interpreter-bin");
        let empty_path_dir = temp.path().join("empty-bin");
        fs::create_dir_all(&script_dir).expect("script dir");
        fs::create_dir_all(&interpreter_dir).expect("interpreter dir");
        fs::create_dir_all(&empty_path_dir).expect("empty path dir");

        let interpreter_path = interpreter_dir.join("node");
        let marker_path = temp.path().join("fake-node-ran");
        fs::write(
            &interpreter_path,
            format!(
                "#!/bin/sh\necho '{{\"loggedIn\":true,\"authMethod\":\"claude.ai\"}}'\ntouch {}\n",
                marker_path.display()
            ),
        )
        .expect("write interpreter");
        let mut perms = fs::metadata(&interpreter_path)
            .expect("meta")
            .permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&interpreter_path, perms).expect("chmod");

        let script_path = script_dir.join("claude");
        fs::write(&script_path, "#!/usr/bin/env node\n").expect("write script");
        let mut perms = fs::metadata(&script_path).expect("meta").permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&script_path, perms).expect("chmod");

        let augmented = format!(
            "{}:{}",
            interpreter_dir.display(),
            empty_path_dir.display()
        );
        let outcome = super::login_probe(
            &script_path,
            &["claude", "auth", "status"],
            Some(&augmented),
        );
        assert_eq!(outcome, ProbeOutcome::VendorLoggedIn);
        assert!(marker_path.exists(), "env shebang must find interpreter");
    }

    #[cfg(unix)]
    #[test]
    fn login_probe_config_invalid_on_stderr_signal() {
        use std::fs;
        use std::os::unix::fs::PermissionsExt;

        let temp = tempfile::tempdir().expect("temp dir");
        let script = temp.path().join("codex");
        let body = format!(
            "#!/bin/sh\necho 'Error loading configuration: x unknown variant `foo`' 1>&2\nexit 1\n"
        );
        assert!(
            CONFIG_PARSE_SIGNALS
                .iter()
                .all(|sig| body.to_lowercase().contains(sig))
        );
        fs::write(&script, body).expect("write");
        let mut perms = fs::metadata(&script).expect("meta").permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&script, perms).expect("chmod");

        let outcome = super::login_probe(&script, &["codex", "login", "status"], None);
        assert!(
            matches!(outcome, ProbeOutcome::ConfigInvalid { .. }),
            "got {outcome:?}"
        );
        if let ProbeOutcome::ConfigInvalid { stderr_excerpt } = outcome {
            assert!(stderr_excerpt.to_lowercase().contains("error loading"));
        }
    }

    #[cfg(unix)]
    #[test]
    fn login_probe_logged_out_on_nonzero_without_config_signal() {
        use std::fs;
        use std::os::unix::fs::PermissionsExt;

        let temp = tempfile::tempdir().expect("temp dir");
        let script = temp.path().join("codex");
        fs::write(&script, "#!/bin/sh\necho nope 1>&2\nexit 1\n").expect("write");
        let mut perms = fs::metadata(&script).expect("meta").permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&script, perms).expect("chmod");

        let outcome = super::login_probe(&script, &["codex", "login", "status"], None);
        assert_eq!(outcome, ProbeOutcome::LoggedOut);
    }
}

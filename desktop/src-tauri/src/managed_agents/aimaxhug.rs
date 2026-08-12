//! AimaxHug OpenAI-compatible provider preset.
//!
//! UI id `aimaxhug` sits alongside OpenAI / Anthropic. At spawn/readiness we
//! rewrite it to buzz-agent's OpenAI transport with the AimaxHug base URL.
//!
//! For Codex / Claude Code and other ACP harnesses (Amp, Cursor, OpenCode, …)
//! that normally want vendor site login, a non-empty `OPENAI_COMPAT_API_KEY`
//! is treated as an AimaxHug gateway credential: we inject the env/config those
//! CLIs need so agents can run without official site login. Doctor still offers
//! Connect Account for users who prefer vendor login. buzz-agent / goose keep
//! using the provider picker path (`apply_aimaxhug_env`).
//!
//! Codex note: current Codex CLIs only support `wire_api = "responses"` and do
//! **not** read a `CODEX_CONFIG` env blob. We therefore write a managed
//! `CODEX_HOME/config.toml` and point `CODEX_HOME` at it. Claude-named models
//! are remapped to an OpenAI-compatible default because AimaxHug rejects them
//! on `/v1/responses`.

use std::collections::BTreeMap;
use std::path::PathBuf;

pub const AIMAXHUG_PROVIDER_ID: &str = "aimaxhug";
/// OpenAI-compatible API root (includes `/v1`, matching `api.openai.com/v1`).
/// Host root for keys/docs is [`AIMAXHUG_KEYS_URL`].
pub const AIMAXHUG_API_BASE_URL: &str = "https://api.aimaxhug.cloud/v1";
/// Anthropic-style clients append `/v1/messages` themselves — use the host root.
pub const AIMAXHUG_ANTHROPIC_BASE_URL: &str = "https://api.aimaxhug.cloud";
/// Console / key signup landing page shown in the desktop UI.
pub const AIMAXHUG_KEYS_URL: &str = "https://api.aimaxhug.cloud";
/// Fallback when Agent Defaults pick a Claude model but the runtime is Codex
/// (Responses API only).
const CODEX_AIMAXHUG_DEFAULT_MODEL: &str = "gpt-5";

const OPENAI_COMPAT_API_KEY: &str = "OPENAI_COMPAT_API_KEY";

/// Translate the AimaxHug provider into buzz-agent's OpenAI-compatible transport.
pub fn apply_aimaxhug_env(env: &mut BTreeMap<String, String>, provider: Option<&str>) {
    let is_aimaxhug = provider
        .map(str::trim)
        .is_some_and(|value| value.eq_ignore_ascii_case(AIMAXHUG_PROVIDER_ID));
    if !is_aimaxhug {
        return;
    }
    env.insert("BUZZ_AGENT_PROVIDER".to_string(), "openai".to_string());
    env.insert(
        "OPENAI_COMPAT_BASE_URL".to_string(),
        AIMAXHUG_API_BASE_URL.to_string(),
    );
    // AimaxHug is not api.openai.com — force Chat Completions under `auto`.
    env.insert("OPENAI_COMPAT_API".to_string(), "chat".to_string());
}

/// True when the effective env carries an AimaxHug (OpenAI-compat) API key.
///
/// Codex/Claude agents inherit global Agent Defaults env, so a key saved for
/// AimaxHug on buzz-agent also unlocks the gateway path for those harnesses.
pub fn has_aimaxhug_gateway_key(env: &BTreeMap<String, String>) -> bool {
    env.get(OPENAI_COMPAT_API_KEY)
        .map(|value| !value.trim().is_empty())
        .unwrap_or(false)
}

/// Wire spawn env to AimaxHug when a gateway key is present.
///
/// Codex/Claude get harness-specific overlays; other ACP runtimes get a
/// generic OpenAI-compat + Anthropic env pair. No-ops for buzz-agent / goose.
///
/// When the vendor CLI is already logged in, gateway inject is skipped so
/// official login wins over the Configuration-tab API key. After the user
/// revokes login, the next spawn injects the key again.
pub fn apply_aimaxhug_gateway_for_runtime(
    env: &mut BTreeMap<String, String>,
    runtime_id: Option<&str>,
) {
    let Some(runtime_id) = runtime_id.map(str::trim).filter(|id| !id.is_empty()) else {
        return;
    };
    if !has_aimaxhug_gateway_key(env) {
        return;
    }
    if vendor_login_preferred(runtime_id) {
        return;
    }
    let Some(api_key) = env
        .get(OPENAI_COMPAT_API_KEY)
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
    else {
        return;
    };

    // Ensure buzz-agent-style base URL is set even when this runtime does not
    // carry BUZZ_AGENT_PROVIDER=aimaxhug (Codex/Claude skip provider selection).
    env.entry("OPENAI_COMPAT_BASE_URL".to_string())
        .or_insert_with(|| AIMAXHUG_API_BASE_URL.to_string());

    match runtime_id {
        "codex" => apply_aimaxhug_codex_env(env, &api_key),
        "claude" => apply_aimaxhug_claude_env(env, &api_key),
        // buzz-agent / goose already go through apply_aimaxhug_env via provider.
        "buzz-agent" | "goose" => {}
        // Amp, Cursor, OpenCode, Hermes, Kimi, … — many ACP CLIs honor the
        // OpenAI-compat and/or Anthropic env pair without vendor site login.
        _ => apply_aimaxhug_generic_acp_env(env, &api_key),
    }
}

/// Prefer Claude/Codex vendor login over AimaxHug gateway when both are set.
fn vendor_login_preferred(runtime_id: &str) -> bool {
    if !matches!(runtime_id, "claude" | "codex") {
        return false;
    }
    use crate::managed_agents::readiness::cli_probe;
    use crate::managed_agents::{
        cache_runtime_auth_status, cached_runtime_auth_status, known_acp_runtime_exact,
        resolve_command, AuthStatus,
    };

    if matches!(
        cached_runtime_auth_status(runtime_id),
        Some(AuthStatus::LoggedIn)
    ) {
        return true;
    }
    if matches!(
        cached_runtime_auth_status(runtime_id),
        Some(AuthStatus::LoggedOut | AuthStatus::NotApplicable)
    ) {
        return false;
    }

    let Some(runtime) = known_acp_runtime_exact(runtime_id) else {
        return false;
    };
    let Some(probe_args) = runtime.auth_probe_args else {
        return false;
    };
    let Some(binary) = resolve_command(probe_args[0]) else {
        return false;
    };
    let outcome = cli_probe::login_probe(
        &binary,
        probe_args,
        cli_probe::augmented_path().as_deref(),
    );
    let status = outcome.to_auth_status();
    cache_runtime_auth_status(runtime_id, status.clone());
    matches!(status, AuthStatus::LoggedIn)
}

fn apply_aimaxhug_generic_acp_env(env: &mut BTreeMap<String, String>, api_key: &str) {
    env.entry("OPENAI_API_KEY".to_string())
        .or_insert_with(|| api_key.to_string());
    env.insert(
        "OPENAI_BASE_URL".to_string(),
        AIMAXHUG_API_BASE_URL.to_string(),
    );
    env.entry("ANTHROPIC_API_KEY".to_string())
        .or_insert_with(|| api_key.to_string());
    env.insert(
        "ANTHROPIC_BASE_URL".to_string(),
        AIMAXHUG_ANTHROPIC_BASE_URL.to_string(),
    );
}

fn apply_aimaxhug_codex_env(env: &mut BTreeMap<String, String>, api_key: &str) {
    // Codex reads OPENAI_API_KEY for API-key auth; keep the Buzz/AimaxHug key name too.
    env.entry("OPENAI_API_KEY".to_string())
        .or_insert_with(|| api_key.to_string());
    env.insert(
        "OPENAI_BASE_URL".to_string(),
        AIMAXHUG_API_BASE_URL.to_string(),
    );

    let model = codex_model_for_aimaxhug(env);
    if let Some(home) = ensure_codex_aimaxhug_home(&model) {
        env.insert("CODEX_HOME".to_string(), home.display().to_string());
    }
}

fn apply_aimaxhug_claude_env(env: &mut BTreeMap<String, String>, api_key: &str) {
    env.entry("ANTHROPIC_API_KEY".to_string())
        .or_insert_with(|| api_key.to_string());
    env.insert(
        "ANTHROPIC_BASE_URL".to_string(),
        AIMAXHUG_ANTHROPIC_BASE_URL.to_string(),
    );
    if let Some(model) = env
        .get("BUZZ_AGENT_MODEL")
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
    {
        env.entry("ANTHROPIC_MODEL".to_string()).or_insert(model);
    }
}

fn codex_model_for_aimaxhug(env: &BTreeMap<String, String>) -> String {
    let raw = env
        .get("BUZZ_AGENT_MODEL")
        .or_else(|| env.get("CODEX_MODEL"))
        .map(|value| value.trim())
        .filter(|value| !value.is_empty())
        .unwrap_or(CODEX_AIMAXHUG_DEFAULT_MODEL);
    let lower = raw.to_ascii_lowercase();
    // Codex Responses API + AimaxHug rejects Anthropic model ids.
    if lower.contains("claude") || lower.starts_with("anthropic") {
        return CODEX_AIMAXHUG_DEFAULT_MODEL.to_string();
    }
    raw.to_string()
}

fn codex_aimaxhug_home_dir() -> Option<PathBuf> {
    dirs::data_dir().map(|dir| dir.join("Buzz").join("codex-aimaxhug"))
}

fn ensure_codex_aimaxhug_home(model: &str) -> Option<PathBuf> {
    let home = codex_aimaxhug_home_dir()?;
    std::fs::create_dir_all(&home).ok()?;
    let config_path = home.join("config.toml");
    let toml = format!(
        "model = \"{model}\"\n\
         model_provider = \"aimaxhug\"\n\
         \n\
         [model_providers.aimaxhug]\n\
         name = \"AimaxHug\"\n\
         base_url = \"{base}\"\n\
         env_key = \"OPENAI_API_KEY\"\n\
         requires_openai_auth = false\n\
         wire_api = \"responses\"\n",
        model = model.replace('"', ""),
        base = AIMAXHUG_API_BASE_URL,
    );
    std::fs::write(&config_path, toml).ok()?;
    Some(home)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::managed_agents::{
        cache_runtime_auth_status, clear_runtime_auth_status_cache, AuthStatus,
    };

    fn mark_vendor_logged_out(runtime_id: &str) {
        clear_runtime_auth_status_cache(Some(runtime_id));
        cache_runtime_auth_status(runtime_id, AuthStatus::LoggedOut);
    }

    #[test]
    fn rewrites_aimaxhug_to_openai_compat() {
        let mut env = BTreeMap::new();
        env.insert(OPENAI_COMPAT_API_KEY.to_string(), "sk-test".to_string());
        apply_aimaxhug_env(&mut env, Some("aimaxhug"));
        assert_eq!(
            env.get("BUZZ_AGENT_PROVIDER").map(String::as_str),
            Some("openai")
        );
        assert_eq!(
            env.get("OPENAI_COMPAT_BASE_URL").map(String::as_str),
            Some(AIMAXHUG_API_BASE_URL)
        );
        assert_eq!(
            env.get("OPENAI_COMPAT_API").map(String::as_str),
            Some("chat")
        );
        assert_eq!(
            env.get(OPENAI_COMPAT_API_KEY).map(String::as_str),
            Some("sk-test")
        );
    }

    #[test]
    fn ignores_other_providers() {
        let mut env = BTreeMap::new();
        apply_aimaxhug_env(&mut env, Some("anthropic"));
        assert!(env.is_empty());
    }

    #[test]
    fn codex_gateway_sets_codex_home_not_fake_env_blob() {
        mark_vendor_logged_out("codex");
        let mut env = BTreeMap::new();
        env.insert(OPENAI_COMPAT_API_KEY.to_string(), "sk-aimax".to_string());
        env.insert("BUZZ_AGENT_MODEL".to_string(), "gpt-5".to_string());
        apply_aimaxhug_gateway_for_runtime(&mut env, Some("codex"));
        assert_eq!(
            env.get("OPENAI_API_KEY").map(String::as_str),
            Some("sk-aimax")
        );
        assert_eq!(
            env.get("OPENAI_BASE_URL").map(String::as_str),
            Some(AIMAXHUG_API_BASE_URL)
        );
        let home = env.get("CODEX_HOME").expect("CODEX_HOME");
        let config = std::fs::read_to_string(PathBuf::from(home).join("config.toml"))
            .expect("config.toml");
        assert!(config.contains("model_provider = \"aimaxhug\""));
        assert!(config.contains("wire_api = \"responses\""));
        assert!(config.contains("model = \"gpt-5\""));
        assert!(!env.contains_key("CODEX_CONFIG"));
    }

    #[test]
    fn codex_gateway_remaps_claude_model_for_responses_api() {
        mark_vendor_logged_out("codex");
        let mut env = BTreeMap::new();
        env.insert(OPENAI_COMPAT_API_KEY.to_string(), "sk-aimax".to_string());
        env.insert(
            "BUZZ_AGENT_MODEL".to_string(),
            "claude-sonnet-5".to_string(),
        );
        apply_aimaxhug_gateway_for_runtime(&mut env, Some("codex"));
        let home = env.get("CODEX_HOME").expect("CODEX_HOME");
        let config = std::fs::read_to_string(PathBuf::from(home).join("config.toml"))
            .expect("config.toml");
        assert!(config.contains(&format!("model = \"{CODEX_AIMAXHUG_DEFAULT_MODEL}\"")));
        assert!(!config.contains("claude-sonnet-5"));
    }

    #[test]
    fn claude_gateway_sets_anthropic_base() {
        mark_vendor_logged_out("claude");
        let mut env = BTreeMap::new();
        env.insert(OPENAI_COMPAT_API_KEY.to_string(), "sk-aimax".to_string());
        apply_aimaxhug_gateway_for_runtime(&mut env, Some("claude"));
        assert_eq!(
            env.get("ANTHROPIC_API_KEY").map(String::as_str),
            Some("sk-aimax")
        );
        assert_eq!(
            env.get("ANTHROPIC_BASE_URL").map(String::as_str),
            Some(AIMAXHUG_ANTHROPIC_BASE_URL)
        );
    }

    #[test]
    fn gateway_skips_claude_when_vendor_login_cached() {
        clear_runtime_auth_status_cache(Some("claude"));
        cache_runtime_auth_status("claude", AuthStatus::LoggedIn);
        let mut env = BTreeMap::new();
        env.insert(OPENAI_COMPAT_API_KEY.to_string(), "sk-aimax".to_string());
        apply_aimaxhug_gateway_for_runtime(&mut env, Some("claude"));
        assert!(
            !env.contains_key("ANTHROPIC_API_KEY"),
            "vendor login must win over gateway key"
        );
        clear_runtime_auth_status_cache(Some("claude"));
    }

    #[test]
    fn generic_acp_gateway_sets_openai_and_anthropic() {
        let mut env = BTreeMap::new();
        env.insert(OPENAI_COMPAT_API_KEY.to_string(), "sk-aimax".to_string());
        apply_aimaxhug_gateway_for_runtime(&mut env, Some("amp"));
        assert_eq!(
            env.get("OPENAI_API_KEY").map(String::as_str),
            Some("sk-aimax")
        );
        assert_eq!(
            env.get("OPENAI_BASE_URL").map(String::as_str),
            Some(AIMAXHUG_API_BASE_URL)
        );
        assert_eq!(
            env.get("ANTHROPIC_API_KEY").map(String::as_str),
            Some("sk-aimax")
        );
        assert_eq!(
            env.get("ANTHROPIC_BASE_URL").map(String::as_str),
            Some(AIMAXHUG_ANTHROPIC_BASE_URL)
        );
    }

    #[test]
    fn gateway_skips_buzz_agent_and_goose() {
        let mut env = BTreeMap::new();
        env.insert(OPENAI_COMPAT_API_KEY.to_string(), "sk-aimax".to_string());
        apply_aimaxhug_gateway_for_runtime(&mut env, Some("buzz-agent"));
        assert!(env.get("OPENAI_API_KEY").is_none());
        apply_aimaxhug_gateway_for_runtime(&mut env, Some("goose"));
        assert!(env.get("OPENAI_API_KEY").is_none());
    }

    #[test]
    fn gateway_noop_without_key() {
        let mut env = BTreeMap::new();
        apply_aimaxhug_gateway_for_runtime(&mut env, Some("amp"));
        assert!(env.is_empty());
    }
}

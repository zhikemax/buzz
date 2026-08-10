//! AimaxHug OpenAI-compatible provider preset.
//!
//! UI id `aimaxhug` sits alongside OpenAI / Anthropic. At spawn/readiness we
//! rewrite it to buzz-agent's OpenAI transport with the AimaxHug base URL.

pub const AIMAXHUG_PROVIDER_ID: &str = "aimaxhug";
/// OpenAI-compatible API root (includes `/v1`, matching `api.openai.com/v1`).
/// Host root for keys/docs is [`AIMAXHUG_KEYS_URL`].
pub const AIMAXHUG_API_BASE_URL: &str = "https://api.aimaxhug.cloud/v1";
/// Console / key signup landing page shown in the desktop UI.
pub const AIMAXHUG_KEYS_URL: &str = "https://api.aimaxhug.cloud";

/// Translate the AimaxHug provider into buzz-agent's OpenAI-compatible transport.
pub fn apply_aimaxhug_env(
    env: &mut std::collections::BTreeMap<String, String>,
    provider: Option<&str>,
) {
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::BTreeMap;

    #[test]
    fn rewrites_aimaxhug_to_openai_compat() {
        let mut env = BTreeMap::new();
        env.insert("OPENAI_COMPAT_API_KEY".to_string(), "sk-test".to_string());
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
            env.get("OPENAI_COMPAT_API_KEY").map(String::as_str),
            Some("sk-test")
        );
    }

    #[test]
    fn ignores_other_providers() {
        let mut env = BTreeMap::new();
        apply_aimaxhug_env(&mut env, Some("anthropic"));
        assert!(env.is_empty());
    }
}

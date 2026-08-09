/**
 * Curated one-line descriptions for harness catalog entries.
 *
 * Content policy (agreed in the BYOH UX thread): exactly ONE neutral,
 * vendor-sourced category sentence per entry — what kind of tool it is —
 * with provenance cited inline. No feature inventories, no marketing
 * superlatives, no volatile model/provider claims. Operational setup copy
 * (status, hints) stays generated from runtime state, never hand-authored
 * here. Research: ~/.buzz/RESEARCH/BYOH_CATALOG_IA.md.
 */

import type { MessageKey } from "@/shared/i18n";

const HARNESS_DESCRIPTION_KEYS: Record<string, MessageKey> = {
  // Built-in runtimes.
  "buzz-agent": "settings.agents.harnessDesc.buzzAgent",
  // Source: https://code.claude.com/docs/en/overview — "Claude Code is an
  // agentic coding tool" that lives in the terminal.
  claude: "settings.agents.harnessDesc.claude",
  // Source: https://developers.openai.com/codex — "Codex is OpenAI's coding
  // agent".
  codex: "settings.agents.harnessDesc.codex",
  // Source: https://block.github.io/goose/ — "an open source, extensible AI
  // agent".
  goose: "settings.agents.harnessDesc.goose",

  // Bundled presets — sources per RESEARCH/BYOH_CATALOG_IA.md.
  // Source: https://cursor.com/docs/cli/acp
  cursor: "settings.agents.harnessDesc.cursor",
  // Source: https://github.com/can1357/oh-my-pi
  omp: "settings.agents.harnessDesc.omp",
  // Source: https://build.x.ai (docs unavailable during research; kept
  // deliberately conservative).
  grok: "settings.agents.harnessDesc.grok",
  // Source: https://github.com/anomalyco/opencode
  opencode: "settings.agents.harnessDesc.opencode",
  // Sources: https://github.com/MoonshotAI/kimi-cli,
  // https://moonshotai.github.io/kimi-cli/en/
  kimi: "settings.agents.harnessDesc.kimi",
  // Sources: https://ampcode.com, https://ampcode.com/manual
  amp: "settings.agents.harnessDesc.amp",
  // Sources: https://github.com/NousResearch/hermes-agent,
  // https://hermes-agent.nousresearch.com/docs/
  hermes: "settings.agents.harnessDesc.hermes",
  // Sources: https://github.com/openclaw/openclaw,
  // https://docs.openclaw.ai/start/getting-started
  openclaw: "settings.agents.harnessDesc.openclaw",
};

/**
 * One neutral sentence key describing the harness, or null for entries we
 * don't curate (customs, unknown ids). Callers must render nothing rather
 * than invent copy.
 */
export function harnessDescription(id: string): MessageKey | null {
  return HARNESS_DESCRIPTION_KEYS[id.trim().toLowerCase()] ?? null;
}

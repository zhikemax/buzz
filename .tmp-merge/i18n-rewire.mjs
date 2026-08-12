/**
 * Take upstream/main version of a file, then wrap user-visible English strings
 * with t("key") using en.ts MessageKey catalog. Also merges known HEAD t() usage.
 *
 * Usage:
 *   node .tmp-merge/i18n-rewire.mjs PATH
 * Writes PATH in place (expects conflicted working tree file).
 */
import fs from "node:fs";
import { execSync } from "node:child_process";

const file = process.argv[2];
if (!file) {
  console.error("usage: node i18n-rewire.mjs PATH");
  process.exit(2);
}

const enSrc = fs.readFileSync("desktop/src/shared/i18n/messages/en.ts", "utf8");
/** @type {Map<string, string>} english -> key */
const enToKey = new Map();
/** @type {Map<string, string>} key -> english */
const keyToEn = new Map();
{
  const re = /"([^"]+)":\s*"((?:\\.|[^"\\])*)"/g;
  let m;
  while ((m = re.exec(enSrc))) {
    const key = m[1];
    const val = m[2]
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
    keyToEn.set(key, val);
    // Prefer longer / more specific keys later — first wins unless longer
    const prev = enToKey.get(val);
    if (!prev || key.length > prev.length) {
      enToKey.set(val, key);
    }
  }
}

function gitShow(rev, path) {
  try {
    return execSync(`git show ${rev}:${path}`, {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch {
    return null;
  }
}

const upstream = gitShow("upstream/main", file);
const head = gitShow("HEAD", file);
if (!upstream) {
  console.error(`no upstream version: ${file}`);
  process.exit(1);
}

// Collect explicit HEAD mappings: English-ish patterns replaced by t("key")
/** @type {Map<string, { key: string, args: string }>} */
const headMap = new Map();
if (head) {
  // title={t("k")} paired won't give english; use keyToEn
  const tRe = /\bt\((["'])([^"']+)\1(\s*,\s*\{[^}]*\})?\)/g;
  let m;
  while ((m = tRe.exec(head))) {
    const key = m[2];
    const args = m[3] || "";
    const en = keyToEn.get(key);
    if (en) headMap.set(en, { key, args });
  }
}

let out = upstream;

// Normalize weird encoding from Windows git show (— as â€")
out = out.replace(/\u00e2\u0080\u0094/g, "—");
out = out.replace(/â€”/g, "—");
out = out.replace(/â€™/g, "'");
out = out.replace(/â€œ|â€/g, '"');

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Sort english strings longest-first to avoid partial replacements
const entries = [...headMap.entries()].sort((a, b) => b[0].length - a[0].length);

for (const [english, { key, args }] of entries) {
  if (!english || english.length < 2) continue;
  // Skip keys that need interpolation when english contains {placeholders}
  if (english.includes("{") && !args) {
    // still try plain if upstream inlined differently
  }

  const tExpr = `t("${key}"${args})`;

  // 1) JSX attribute: attr="english"
  const attrRe = new RegExp(
    `(\\b(?:title|description|placeholder|label|alt|aria-label|aria-labelledby|name))=(")${escapeRegExp(english)}(")`,
    "g",
  );
  out = out.replace(attrRe, `$1={${tExpr}}`);

  // 2) JSX text node: >english<  (allow surrounding whitespace)
  const textRe = new RegExp(
    `(>)(\\s*)${escapeRegExp(english)}(\\s*)(<)`,
    "g",
  );
  out = out.replace(textRe, `$1$2{${tExpr}}$3$4`);

  // 3) Template in aria-label={`Theme style, ${...}`} — skip
  // 4) String in arrays: label: "english"
  const propRe = new RegExp(
    `(\\b(?:label|description|title|placeholder|message|hint|text)\\s*:\\s*)("${escapeRegExp(english)}")`,
    "g",
  );
  out = out.replace(propRe, `$1${tExpr}`);
}

// Special: interpolated strings like `Update available — v{status.version}`
// HEAD used t("settings.updates.manualAvailable", { version: status.version })
out = out.replace(
  />Update available [—\-]?\s*v\{status\.version\}</g,
  `>{t("settings.updates.manualAvailable", { version: status.version })}<`,
);
out = out.replace(
  /Update failed: \{status\.message\}/g,
  `{t("settings.updates.failed", { message: status.message })}`,
);

// Ensure useT import
if (/\bt\(["']/.test(out)) {
  if (!/from ["']@\/shared\/i18n["']/.test(out)) {
    out = `import { useT } from "@/shared/i18n";\n` + out;
  } else {
    out = out.replace(
      /import\s+\{([^}]*)\}\s+from\s+["']@\/shared\/i18n["']\s*;?/,
      (full, inner) => {
        if (/\buseT\b/.test(inner)) return full;
        const parts = inner
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        parts.unshift("useT");
        return `import { ${parts.join(", ")} } from "@/shared/i18n";`;
      },
    );
  }

  // Insert const t = useT() into each export function that references t(
  // Only top-level export functions for simplicity
  if (!/const t = useT\(/.test(out)) {
    out = out.replace(
      /(export function \w+\s*\([^)]*\)\s*\{\n)/,
      `$1  const t = useT();\n`,
    );
  }
}

// Prefer upstream subcopy classes already present.
fs.writeFileSync(file, out);
console.log(`rewired: ${file}`);

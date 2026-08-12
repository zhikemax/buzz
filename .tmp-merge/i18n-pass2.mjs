/**
 * Pass 2: replace multiline English leftovers using whitespace-normalized match
 * against HEAD keys + en.ts values.
 */
import fs from "node:fs";
import { execSync } from "node:child_process";

const files = process.argv.slice(2);
const enSrc = fs.readFileSync("desktop/src/shared/i18n/messages/en.ts", "utf8");
const keyToEn = new Map();
for (const m of enSrc.matchAll(/"([^"]+)":\s*"((?:\\.|[^"\\])*)"/g)) {
  const val = m[2]
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
  keyToEn.set(m[1], val);
}

function norm(s) {
  return s.replace(/\s+/g, " ").trim();
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

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

for (const file of files) {
  const head = gitShow("HEAD", file);
  if (!head) {
    console.log(`no head: ${file}`);
    continue;
  }
  const keys = [
    ...new Set([...head.matchAll(/\bt\(["']([^"']+)["']/g)].map((m) => m[1])),
  ];
  let src = fs.readFileSync(file, "utf8");
  let changed = 0;

  const pairs = keys
    .map((k) => ({ k, en: keyToEn.get(k) }))
    .filter((p) => p.en && !p.en.includes("{"))
    .sort((a, b) => b.en.length - a.en.length);

  for (const { k, en } of pairs) {
    const n = norm(en);
    const tExpr = `{t("${k}")}`;

    // Exact attr match
    const attrRe = new RegExp(
      `(\\b(?:title|description|placeholder|label|alt|aria-label)=)("${escapeRegExp(en)}")`,
      "g",
    );
    const beforeAttr = src;
    src = src.replace(attrRe, `$1${tExpr}`);
    if (src !== beforeAttr) changed++;

    // Flexible text nodes between > and < (no nested tags / braces)
    src = src.replace(/>([^<{}]+)</g, (full, text) => {
      if (norm(text) === n) {
        changed++;
        return `>${tExpr}<`;
      }
      return full;
    });

    // description={ <> english </> } pattern in SettingsSectionHeader
    // handled below separately if needed
  }

  // Ensure const t = useT() when t( is used (handles multiline function params)
  if (/\bt\(["']/.test(src) && !/const t = useT\(/.test(src)) {
    src = src.replace(
      /(export function \w+[\s\S]*?\{\n)/,
      (full) => {
        if (full.includes("const t = useT(")) return full;
        return `${full}  const t = useT();\n`;
      },
    );
    changed++;
  }

  fs.writeFileSync(file, src);
  console.log(`pass2 changed≈${changed}: ${file}`);
}

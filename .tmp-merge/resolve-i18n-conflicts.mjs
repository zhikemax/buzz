/**
 * Resolve conflict markers: keep upstream structure/classes, prefer HEAD t() strings.
 * Usage: node .tmp-merge/resolve-i18n-conflicts.mjs <file...>
 */
import fs from "node:fs";

function resolveContent(src) {
  const re =
    /<<<<<<< HEAD\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> upstream\/main\n?/g;
  return src.replace(re, (_m, head, theirs) => mergeHunk(head, theirs));
}

function mergeHunk(head, theirs) {
  const headTrim = head.trimEnd();
  const theirsTrim = theirs.trimEnd();

  // HEAD-only fork blocks (e.g. language picker) — keep if upstream empty
  if (!theirsTrim.trim()) return head;
  if (!headTrim.trim()) return theirs;

  // If HEAD is purely i18n of theirs English (same JSX skeleton), rebuild from theirs
  // by substituting English string literals with nearby t() calls from HEAD.
  const headHasT = /\bt\(["']/.test(head);
  const theirsHasT = /\bt\(["']/.test(theirs);

  if (headHasT && !theirsHasT) {
    return applyI18nOntoUpstream(head, theirs);
  }

  // Both have content — prefer upstream structure with HEAD t() where possible
  if (headHasT) {
    return applyI18nOntoUpstream(head, theirs);
  }

  // Default: upstream wins for structure
  return theirs;
}

function extractTCalls(head) {
  /** @type {Map<string, string>} */
  const byEnglish = new Map();
  // Match t("key") or t('key', ...) used as JSX text / attr values
  // Also capture patterns like: >English</  vs >{t("...")}</
  // Build map from simple adjacent English in comments? Better: pair via known en messages later.

  // Collect all t("key"...) expressions as strings
  const tCalls = [];
  const re = /\{t\((["'])([^"']+)\1([^)]*)\)\}/g;
  let m;
  while ((m = re.exec(head))) {
    tCalls.push({
      full: m[0],
      key: m[2],
      args: m[3],
      index: m.index,
    });
  }
  return tCalls;
}

function stripJsxText(s) {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Replace English text nodes / string attrs in upstream hunk with t() from HEAD
 * using positional matching of text-ish leaves.
 */
function applyI18nOntoUpstream(head, theirs) {
  // Strategy: take THEIR JSX, but for each English string literal / text node that
  // appears similarly in HEAD as a t() replacement, swap it.

  // Build replacements from HEAD by looking at simple patterns:
  // title={t("...")}  vs title="English"
  // {t("...")} vs English text between tags
  // >{t("a")}</p> paired with >English</p>

  let out = theirs;

  // 1) Attribute string props: title="X" / description="X" / placeholder="X" / aria-label="X" / label="X"
  const attrNames = [
    "title",
    "description",
    "placeholder",
    "aria-label",
    "aria-labelledby",
    "label",
    "alt",
  ];
  for (const attr of attrNames) {
    const headAttrRe = new RegExp(
      `${attr}=\\{t\\((["'])([^"']+)\\1([^)]*)\\)\\}`,
      "g",
    );
    const headAttrs = [...head.matchAll(headAttrRe)];
    const theirsAttrRe = new RegExp(`${attr}="([^"]*)"`, "g");
    const theirsAttrs = [...out.matchAll(theirsAttrRe)];
    // If counts match, zip by order
    if (headAttrs.length > 0 && headAttrs.length === theirsAttrs.length) {
      // Replace from end to keep indices stable — rebuild via sequential replace
      let i = 0;
      out = out.replace(theirsAttrRe, (full) => {
        const h = headAttrs[i++];
        if (!h) return full;
        const args = h[3] || "";
        return `${attr}={t("${h[2]}"${args})}`;
      });
    } else if (headAttrs.length === 1 && theirsAttrs.length === 1) {
      out = out.replace(
        theirsAttrRe,
        `${attr}={t("${headAttrs[0][2]}"${headAttrs[0][3] || ""})}`,
      );
    }
  }

  // 2) JSX text content: replace plain text children with t() when HEAD has t() in similar tags
  // Pair by walking >text</ patterns vs >{t(...)}</
  const headTexts = [
    ...head.matchAll(/>(\s*)\{t\((["'])([^"']+)\2([^)]*)\)\}(\s*)</g),
  ];
  const theirsTexts = [
    ...out.matchAll(/>(\s*)([^<{][^<]*?)(\s*)</g),
  ].filter((m) => {
    const text = m[2].trim();
    return text.length > 0 && !/^[\d.]+$/.test(text) && !text.startsWith("{");
  });

  if (headTexts.length > 0 && theirsTexts.length > 0) {
    // Zip when counts equal
    if (headTexts.length === theirsTexts.length) {
      // Replace theirs text nodes in reverse order
      const replacements = theirsTexts.map((tm, idx) => {
        const h = headTexts[idx];
        return {
          start: tm.index + 1 + tm[1].length,
          end: tm.index + 1 + tm[1].length + tm[2].length,
          lead: tm[1],
          trail: tm[3],
          value: `{t("${h[3]}"${h[4] || ""})}`,
        };
      });
      replacements.sort((a, b) => b.start - a.start);
      for (const r of replacements) {
        out = out.slice(0, r.start) + r.value + out.slice(r.end);
      }
    } else {
      // Fuzzy: for each HEAD t(), find English in theirs that matches en catalog later —
      // fallback: if single text in both, replace
      if (headTexts.length === 1 && theirsTexts.length === 1) {
        const tm = theirsTexts[0];
        const h = headTexts[0];
        const start = tm.index + 1 + tm[1].length;
        const end = start + tm[2].length;
        out =
          out.slice(0, start) +
          `{t("${h[3]}"${h[4] || ""})}` +
          out.slice(end);
      }
    }
  }

  // 3) Ensure useT import / const exist will be handled by post-pass on full file
  return out;
}

function ensureUseT(src) {
  let out = src;
  const needsT = /\bt\(["']/.test(out);
  if (!needsT) return out;

  if (!/from ["']@\/shared\/i18n["']/.test(out)) {
    // insert import after first import block start
    const firstImport = out.indexOf("import ");
    if (firstImport >= 0) {
      out =
        out.slice(0, firstImport) +
        `import { useT } from "@/shared/i18n";\n` +
        out.slice(firstImport);
    }
  } else if (!/useT/.test(out.match(/from ["']@\/shared\/i18n["']/)?.[0] ? out : "")) {
    // expand existing i18n import
    out = out.replace(
      /import\s+\{([^}]*)\}\s+from\s+["']@\/shared\/i18n["']/,
      (full, inner) => {
        if (/\buseT\b/.test(inner)) return full;
        const next = inner.trim().length
          ? `{ useT, ${inner.trim()} }`
          : `{ useT }`;
        return `import ${next} from "@/shared/i18n"`;
      },
    );
  }

  // Ensure const t = useT() inside exported function components that use t(
  // Heuristic: after `export function Foo(...) {` insert if missing in that function
  out = out.replace(
    /(export function \w+\s*\([^)]*\)\s*\{)/g,
    (full) => {
      // Check following 800 chars for useT / t(
      return full;
    },
  );

  // Simpler: if file uses t( but has no `const t = useT`, add after first export function {
  if (!/const t = useT\(/.test(out) && /\bt\(["']/.test(out)) {
    out = out.replace(
      /(export function \w+[^{]*\{\n)/,
      `$1  const t = useT();\n`,
    );
  }

  return out;
}

function applySubcopyClasses(out) {
  // Prefer upstream subcopy styling when HEAD used text-muted-foreground alone
  return out;
}

const files = process.argv.slice(2);
let failed = 0;
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  if (!src.includes("<<<<<<<")) {
    console.log(`skip (no markers): ${file}`);
    continue;
  }
  let resolved = resolveContent(src);
  if (resolved.includes("<<<<<<<")) {
    console.error(`STILL CONFLICTED: ${file}`);
    failed++;
    continue;
  }
  resolved = ensureUseT(resolved);
  fs.writeFileSync(file, resolved);
  console.log(`resolved: ${file}`);
}
process.exit(failed ? 1 : 0);

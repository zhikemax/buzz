import fs from "node:fs";

const en = fs.readFileSync("desktop/src/shared/i18n/messages/en.ts", "utf8");
const zh = fs.readFileSync("desktop/src/shared/i18n/messages/zh-CN.ts", "utf8");

function keys(src) {
  const m = [...src.matchAll(/^\s*"([^"]+)":/gm)].map((x) => x[1]);
  const set = new Set();
  const dups = [];
  for (const k of m) {
    if (set.has(k)) dups.push(k);
    set.add(k);
  }
  return { set, dups };
}

const a = keys(en);
const b = keys(zh);
const missingInZh = [...a.set].filter((k) => !b.set.has(k)).sort();
const missingInEn = [...b.set].filter((k) => !a.set.has(k)).sort();
console.log("en", a.set.size, "zh", b.set.size);
console.log("missingInZh", missingInZh.length, missingInZh.slice(0, 40));
console.log("missingInEn", missingInEn.length, missingInEn.slice(0, 40));
console.log("dupEn", a.dups);
console.log("dupZh", b.dups);
process.exit(missingInZh.length || missingInEn.length || a.dups.length || b.dups.length ? 1 : 0);

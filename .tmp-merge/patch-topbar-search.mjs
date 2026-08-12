/**
 * Fix TopbarSearch: upstream structure + HEAD TranslateFn i18n wiring.
 */
import fs from "node:fs";
import { execSync } from "node:child_process";

const path = "desktop/src/features/search/ui/TopbarSearch.tsx";
let src = execSync(`git show upstream/main:${path}`, {
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
});

src = src.replace(
  'import { Search } from "lucide-react";',
  `import { Search } from "lucide-react";\nimport { useT, type TranslateFn } from "@/shared/i18n";`,
);

// Helpers
src = src.replace(
  `function truncateResultText(content: string, maxLength = 96) {
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return "No message body.";
  }`,
  `function truncateResultText(
  content: string,
  t: TranslateFn,
  maxLength = 96,
) {
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return t("search.noMessageBody");
  }`,
);

src = src.replace(
  `function formatRelativeTime(unixSeconds: number) {
  const diff = Math.floor(Date.now() / 1_000) - unixSeconds;

  if (diff < 60) {
    return "just now";
  }

  if (diff < 60 * 60) {
    return \`\${Math.floor(diff / 60)}m ago\`;
  }

  if (diff < 60 * 60 * 24) {
    return \`\${Math.floor(diff / (60 * 60))}h ago\`;
  }

  if (diff < 60 * 60 * 24 * 7) {
    return \`\${Math.floor(diff / (60 * 60 * 24))}d ago\`;
  }`,
  `function formatRelativeTime(unixSeconds: number, t: TranslateFn) {
  const diff = Math.floor(Date.now() / 1_000) - unixSeconds;

  if (diff < 60) {
    return t("search.justNow");
  }

  if (diff < 60 * 60) {
    return t("search.minutesAgo", { count: Math.floor(diff / 60) });
  }

  if (diff < 60 * 60 * 24) {
    return t("search.hoursAgo", { count: Math.floor(diff / (60 * 60)) });
  }

  if (diff < 60 * 60 * 24 * 7) {
    return t("search.daysAgo", { count: Math.floor(diff / (60 * 60 * 24)) });
  }`,
);

src = src.replace(
  `function getChannelSuggestionMeta(channel: Channel) {
  const activityTime = getChannelActivityTime(channel);

  if (activityTime > 0) {
    return formatRelativeTime(Math.floor(activityTime / 1_000));
  }`,
  `function getChannelSuggestionMeta(channel: Channel, t: TranslateFn) {
  const activityTime = getChannelActivityTime(channel);

  if (activityTime > 0) {
    return formatRelativeTime(Math.floor(activityTime / 1_000), t);
  }`,
);

src = src.replace(
  `function getSearchHitContextLabel(
  hit: SearchHit,
  channelLookup: ReadonlyMap<string, Channel>,
  channelLabels?: Record<string, string>,
): SearchHitContextLabel {
  const channel = hit.channelId ? channelLookup.get(hit.channelId) : null;
  const channelName = getSearchHitChannelName(
    hit,
    channelLookup,
    channelLabels,
  );

  if (channel?.channelType === "dm") {
    return {
      channelLabel: null,
      text: "Direct message",
    };
  }

  const isThread = hit.kind === 45003 || Boolean(hit.threadRootId);

  return {
    channelLabel: channelName,
    text: channelName
      ? \`\${isThread ? "Thread" : "Message"} in\`
      : isThread
        ? "Thread"
        : "Message",
  };
}`,
  `function getSearchHitContextLabel(
  hit: SearchHit,
  channelLookup: ReadonlyMap<string, Channel>,
  t: TranslateFn,
  channelLabels?: Record<string, string>,
): SearchHitContextLabel {
  const channel = hit.channelId ? channelLookup.get(hit.channelId) : null;
  const channelName = getSearchHitChannelName(
    hit,
    channelLookup,
    channelLabels,
  );

  if (channel?.channelType === "dm") {
    return {
      channelLabel: null,
      text: t("search.directMessage"),
    };
  }

  const isThread = hit.kind === 45003 || Boolean(hit.threadRootId);

  return {
    channelLabel: channelName,
    text: channelName
      ? isThread
        ? t("search.threadIn")
        : t("search.messageIn")
      : isThread
        ? t("search.thread")
        : t("search.message"),
  };
}`,
);

src = src.replace(
  `function getSectionTitle(sectionKey: SearchResultSectionKey) {
  switch (sectionKey) {
    case "channels":
      return "Channels";
    case "direct-messages":
      return "Direct messages";
    case "people":
      return "People";
    case "agents":
      return "Agents";
    case "messages":
      return "Most relevant";
    case "actions":
      return "Actions";
  }
}`,
  `function getSectionTitle(
  sectionKey: SearchResultSectionKey,
  t: TranslateFn,
) {
  switch (sectionKey) {
    case "channels":
      return t("search.section.channels");
    case "direct-messages":
      return t("search.section.directMessages");
    case "people":
      return t("search.section.people");
    case "agents":
      return t("search.section.agents");
    case "messages":
      return t("search.section.mostRelevant");
    case "actions":
      return t("search.section.actions");
  }
}`,
);

// Component body - add const t near start of TopbarSearch
if (!src.includes("const t = useT();")) {
  src = src.replace(
    /export function TopbarSearch\([^)]*\) \{\n/,
    (m) => `${m}  const t = useT();\n`,
  );
}

// Common call-site rewires (order matters for uniqueness)
const replacements = [
  [
    'title: "Browse channels",',
    'title: t("search.action.browseChannels"),',
  ],
  [
    'title: "Create a channel",',
    'title: t("search.action.createChannel"),',
  ],
  [
    'title: "Create an agent",',
    'title: t("search.action.createAgent"),',
  ],
  [
    "<p>No recent activity yet.</p>",
    '<p>{t("search.noRecentActivity")}</p>',
  ],
  ['aria-label="Recent activity"', 'aria-label={t("search.recentActivity")}'],
  [
    ">Recent activity<",
    '>{t("search.recentActivity")}<',
  ],
  [">Actions<", '>{t("search.section.actions")}<'],
  [
    /No matches for <span className="font-medium text-foreground">\{trimmedQuery\}<\/span>\./,
    `{t("search.noMatches", { query: trimmedQuery })}`,
  ],
];

// More flexible no-matches
src = src.replace(
  /No matches for[\s\S]*?\{trimmedQuery\}[\s\S]*?\./,
  `{t("search.noMatches", { query: trimmedQuery })}`,
);

for (const [from, to] of replacements) {
  if (typeof from === "string") {
    if (!src.includes(from) && from.includes("title:")) {
      // try alternate upstream wording
      continue;
    }
    src = src.split(from).join(to);
  } else {
    src = src.replace(from, to);
  }
}

// Call sites that need t passed
src = src.replace(
  /getChannelSuggestionMeta\(([^)]+)\)/g,
  "getChannelSuggestionMeta($1, t)",
);
src = src.replace(
  /formatRelativeTime\(([^,)]+)\)/g,
  "formatRelativeTime($1, t)",
);
src = src.replace(
  /truncateResultText\(([^,)]+)\)/g,
  "truncateResultText($1, t)",
);
src = src.replace(
  /truncateResultText\(([^,]+),\s*([^)]+)\)/g,
  (full, a, b) => {
    if (String(b).includes("t")) return full;
    return `truncateResultText(${a}, t, ${b})`;
  },
);

// getSearchHitContextLabel(hit, channelLookup, channelLabels) -> add t
src = src.replace(
  /getSearchHitContextLabel\(\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/g,
  "getSearchHitContextLabel($1, $2, t, $3)",
);
src = src.replace(
  /getSearchHitContextLabel\(\s*([^,]+),\s*([^)]+)\)/g,
  (full, a, b) => {
    if (String(b).includes("t")) return full;
    return `getSearchHitContextLabel(${a}, ${b}, t)`;
  },
);

src = src.replace(
  /getSectionTitle\(([^)]+)\)/g,
  (full, arg) => {
    if (String(arg).includes("t")) return full;
    return `getSectionTitle(${arg}, t)`;
  },
);

// Search everything labels
src = src.replaceAll('"Search everything"', 't("search.everything")');
// Careful - might break if used as object key; check
src = src.replace(
  /title=\{t\("search\.everything"\)\}/g,
  'title={t("search.everything")}',
);
src = src.replace(
  /aria-label=\{t\("search\.everything"\)\}/g,
  'aria-label={t("search.everything")}',
);
// If we created title={t(...)}  without braces wrongly:
src = src.replace(
  /title=t\("search\.everything"\)/g,
  'title={t("search.everything")}',
);
src = src.replace(
  /aria-label=t\("search\.everything"\)/g,
  'aria-label={t("search.everything")}',
);

fs.writeFileSync(path, src);
console.log("TopbarSearch patched");

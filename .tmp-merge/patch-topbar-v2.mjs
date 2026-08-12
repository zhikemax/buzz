import fs from "node:fs";

const path = "desktop/src/features/search/ui/TopbarSearch.tsx";
let s = fs.readFileSync(path, "utf8");

if (!s.includes("@/shared/i18n")) {
  s = s.replace(
    'import { Search } from "lucide-react";',
    `import { Search } from "lucide-react";\nimport { useT, type TranslateFn } from "@/shared/i18n";`,
  );
}

// --- helpers ---
s = s.replace(
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

s = s.replace(
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

s = s.replace(
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

s = s.replace(
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

s = s.replace(
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

// groupSearchResults uses getSectionTitle - need to pass t through.
// Upstream: title: getSectionTitle(sectionKey),
// Change groupSearchResults to accept t.
s = s.replace(
  `function groupSearchResults(results: SearchResult[]): SearchResultSection[] {`,
  `function groupSearchResults(
  results: SearchResult[],
  t: TranslateFn,
): SearchResultSection[] {`,
);
s = s.replace(
  `title: getSectionTitle(sectionKey),`,
  `title: getSectionTitle(sectionKey, t),`,
);

// TopbarSearch component
s = s.replace(
  `}: TopbarSearchProps) {
  const [isOpen, setIsOpen] = React.useState(false);`,
  `}: TopbarSearchProps) {
  const t = useT();
  const searchEverythingLabel = t("search.everything");
  const [isOpen, setIsOpen] = React.useState(false);`,
);

s = s.replace(
  `title: "Browse channels",`,
  `title: t("search.action.browseChannels"),`,
);
s = s.replace(
  `title: "Create a new channel",`,
  `title: t("search.action.createChannel"),`,
);
s = s.replace(
  `title: "Create a new agent",`,
  `title: t("search.action.createAgent"),`,
);

s = s.replace(
  `<p>No recent activity yet.</p>`,
  `<p>{t("search.noRecentActivity")}</p>`,
);
s = s.replace(
  `aria-label="Recent activity"`,
  `aria-label={t("search.recentActivity")}`,
);
s = s.replace(
  `                      Recent activity
`,
  `                      {t("search.recentActivity")}
`,
);
s = s.replace(
  `<div className={SEARCH_SECTION_TITLE_CLASS}>Actions</div>`,
  `<div className={SEARCH_SECTION_TITLE_CLASS}>{t("search.section.actions")}</div>`,
);

// no matches - read exact upstream snippet
s = s.replace(
  /No matches for <span className="font-medium text-foreground">\{trimmedQuery\}<\/span>\./g,
  `{t("search.noMatches", { query: trimmedQuery })}`,
);

s = s.replaceAll(`aria-label="Search everything"`, `aria-label={searchEverythingLabel}`);
s = s.replaceAll(`title="Search everything"`, `title={searchEverythingLabel}`);
s = s.replaceAll(`{query || "Search everything"}`, `{query || searchEverythingLabel}`);
s = s.replace(
  `{scopeLabel ? \`Search in \${scopeLabel}\` : "Search everything"}`,
  `{scopeLabel ? t("search.searchIn", { name: scopeLabel }) : searchEverythingLabel}`,
);

// Call sites inside component - careful unique patterns from upstream
// getSuggestedSearchResults stays; meta uses getChannelSuggestionMeta(channel) in map
s = s.replace(
  /getChannelSuggestionMeta\(([a-zA-Z0-9_.]+)\)/g,
  "getChannelSuggestionMeta($1, t)",
);
s = s.replace(
  /formatRelativeTime\(([a-zA-Z0-9_.]+)\)/g,
  "formatRelativeTime($1, t)",
);
s = s.replace(
  /truncateResultText\(([a-zA-Z0-9_.]+)\)/g,
  "truncateResultText($1, t)",
);
s = s.replace(
  /getSearchHitContextLabel\(\s*([^,\n]+),\s*([^,\n]+),\s*([^)\n]+)\)/g,
  "getSearchHitContextLabel($1, $2, t, $3)",
);
s = s.replace(
  /groupSearchResults\(([a-zA-Z0-9_.]+)\)/g,
  "groupSearchResults($1, t)",
);

fs.writeFileSync(path, s);
console.log("ok");

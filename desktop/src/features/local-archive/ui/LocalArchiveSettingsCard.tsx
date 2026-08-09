import { Archive, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
  createSaveSubscription,
  deleteSaveSubscription,
  listSaveSubscriptions,
  mergeSaveSubscriptionKinds,
  removeSaveSubscriptionKind,
  type SaveSubscription,
  type ScopeType,
} from "@/shared/api/tauriArchive";
import {
  KIND_AGENT_OBSERVER_FRAME,
  KIND_AGENT_TURN_METRIC,
} from "@/shared/constants/kinds";
import { useChannelsQuery } from "@/features/channels/hooks";
import { useIdentityQuery } from "@/shared/api/hooks";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Switch } from "@/shared/ui/switch";
import {
  SettingsOptionGroup,
  SettingsOptionRow,
} from "@/features/settings/ui/SettingsOptionGroup";
import { SettingsSectionHeader } from "@/features/settings/ui/SettingsSectionHeader";
import { observerArchiveDefaultEnabled } from "@/shared/api/tauriArchive";
import { useT, type MessageKey, type TranslateFn } from "@/shared/i18n";
import { setExplicitAgentMetricArchiveChoice } from "../agentMetricArchivePreference";

import {
  buildSubscriptionRequest,
  isGroupFullyChecked,
  isGroupIndeterminate,
  KIND_GROUPS,
  parseCustomKinds,
  toggleGroup,
  toggleKind,
} from "./localArchiveKinds";

// ── Label maps (English KIND_GROUPS labels → MessageKey) ──────────────────────

const GROUP_LABEL_KEYS: Record<string, MessageKey> = {
  "Messages & posts": "settings.archive.group.messages",
  "Reactions, edits & deletions": "settings.archive.group.reactions",
  "Huddle events": "settings.archive.group.huddle",
  "System messages": "settings.archive.group.system",
};

const KIND_LABEL_KEYS: Record<string, MessageKey> = {
  "Message diffs (kind 40008)": "settings.archive.kind.messageDiffs",
  "Huddle started": "settings.archive.kind.huddleStarted",
  "Participant joined": "settings.archive.kind.participantJoined",
  "Participant left": "settings.archive.kind.participantLeft",
  "Huddle ended": "settings.archive.kind.huddleEnded",
  "System messages (kind 40099)": "settings.archive.kind.systemMessages",
  "Event deletions (kind 5)": "settings.archive.kind.deletions",
  "Reactions (kind 7)": "settings.archive.kind.reactions",
  "Stream messages (kind 9)": "settings.archive.kind.streamMessages",
  "Buzz-native deletions (kind 9005)": "settings.archive.kind.buzzDeletions",
  "Stream messages v2 (kind 40002)": "settings.archive.kind.streamMessagesV2",
  "Message edits (kind 40003)": "settings.archive.kind.messageEdits",
  "Forum posts (kind 45001)": "settings.archive.kind.forumPosts",
  "Forum comments (kind 45003)": "settings.archive.kind.forumComments",
};

function translateGroupLabel(label: string, t: TranslateFn): string {
  const key = GROUP_LABEL_KEYS[label];
  return key ? t(key) : label;
}

function translateKindLabel(
  label: string,
  kind: number,
  t: TranslateFn,
): string {
  const key = KIND_LABEL_KEYS[label];
  if (key) return t(key);
  const parsed = /^Kind (\d+)$/.exec(label);
  if (parsed) {
    return t("settings.archive.kind.generic", { kind: parsed[1] });
  }
  if (Number.isFinite(kind)) {
    return t("settings.archive.kind.generic", { kind });
  }
  return label;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scopeLabel(
  sub: SaveSubscription,
  channelNameById: Map<string, string>,
  t: TranslateFn,
): string {
  if (sub.scopeType === "channel_h") {
    return channelNameById.get(sub.scopeValue) ?? sub.scopeValue;
  }
  if (sub.scopeType === "owner_p") {
    if (sub.kinds.includes(KIND_AGENT_TURN_METRIC)) {
      return t("settings.archive.scope.metrics");
    }
    return t("settings.archive.scope.frames");
  }
  return sub.scopeValue;
}

function kindSummary(kinds: number[], t: TranslateFn): string {
  if (kinds.length === 0) return t("settings.archive.noKinds");
  if (kinds.length <= 4) return kinds.join(", ");
  const prefix = kinds.slice(0, 3).join(", ");
  return t("settings.archive.kindsMore", {
    prefix,
    count: kinds.length - 3,
  });
}

// ── Observer-feed archive section ─────────────────────────────────────────────

type ObserverSectionProps = {
  enabled: boolean;
  policy: boolean | undefined;
  toggling: boolean;
  onToggle: (checked: boolean) => void;
};

function ObserverArchiveSection({
  enabled,
  policy,
  toggling,
  onToggle,
}: ObserverSectionProps) {
  const t = useT();
  const toggleDisabled = toggling || policy === undefined || policy === true;
  return (
    <div className="space-y-3" data-testid="local-archive-observer-section">
      <h2 className="text-lg font-semibold tracking-tight">
        {t("settings.archive.observerTitle")}
      </h2>
      <SettingsOptionGroup>
        <SettingsOptionRow>
          <div className="min-w-0 flex-1">
            <label
              className="text-sm font-medium"
              htmlFor="local-archive-observer-toggle"
            >
              {t("settings.archive.observerToggle")}
            </label>
            <p className="text-sm font-normal text-muted-foreground">
              {policy === true
                ? t("settings.archive.observerHintAlwaysOn", {
                    kind: KIND_AGENT_OBSERVER_FRAME,
                  })
                : t("settings.archive.observerHint", {
                    kind: KIND_AGENT_OBSERVER_FRAME,
                  })}
            </p>
          </div>
          <Switch
            checked={enabled}
            data-testid="local-archive-observer-toggle"
            disabled={toggleDisabled}
            id="local-archive-observer-toggle"
            onCheckedChange={onToggle}
          />
        </SettingsOptionRow>
      </SettingsOptionGroup>
    </div>
  );
}

// ── Agent-turn-metric archive section ────────────────────────────────────────

type AgentMetricSectionProps = {
  enabled: boolean;
  toggling: boolean;
  onToggle: (checked: boolean) => void;
};

function AgentMetricArchiveSection({
  enabled,
  toggling,
  onToggle,
}: AgentMetricSectionProps) {
  const t = useT();
  return (
    <div className="space-y-3" data-testid="local-archive-agent-metric-section">
      <h2 className="text-lg font-semibold tracking-tight">
        {t("settings.archive.metricTitle")}
      </h2>
      <SettingsOptionGroup>
        <SettingsOptionRow>
          <div className="min-w-0 flex-1">
            <label
              className="text-sm font-medium"
              htmlFor="local-archive-agent-metric-toggle"
            >
              {t("settings.archive.metricToggle")}
            </label>
            <p className="text-sm font-normal text-muted-foreground">
              {t("settings.archive.metricHint", {
                kind: KIND_AGENT_TURN_METRIC,
              })}
            </p>
          </div>
          <Switch
            checked={enabled}
            data-testid="local-archive-agent-metric-toggle"
            disabled={toggling}
            id="local-archive-agent-metric-toggle"
            onCheckedChange={onToggle}
          />
        </SettingsOptionRow>
      </SettingsOptionGroup>
    </div>
  );
}

// ── Add-subscription form ─────────────────────────────────────────────────────

type KindChecklistProps = {
  checkedKinds: ReadonlySet<number>;
  onChange: (next: Set<number>) => void;
};

function KindChecklist({ checkedKinds, onChange }: KindChecklistProps) {
  const t = useT();
  return (
    <div className="space-y-4">
      {KIND_GROUPS.map((group) => {
        const fullyChecked = isGroupFullyChecked(group, checkedKinds);
        const indeterminate = isGroupIndeterminate(group, checkedKinds);
        const groupLabel = translateGroupLabel(group.label, t);
        return (
          <div key={group.label}>
            {/* Group header */}
            <div className="mb-1.5 flex items-center gap-2">
              <Checkbox
                checked={indeterminate ? "indeterminate" : fullyChecked}
                data-testid={`local-archive-group-${group.label}`}
                id={`local-archive-group-${group.label}`}
                onCheckedChange={() =>
                  onChange(toggleGroup(group, checkedKinds))
                }
              />
              <label
                className="cursor-pointer text-sm font-medium"
                htmlFor={`local-archive-group-${group.label}`}
              >
                {groupLabel}
              </label>
            </div>
            {/* Individual kind checkboxes */}
            <div className="ml-6 space-y-1.5">
              {group.items.map(({ kind, label }) => (
                <div key={kind} className="flex items-center gap-2">
                  <Checkbox
                    checked={checkedKinds.has(kind)}
                    data-testid={`local-archive-kind-${kind}`}
                    id={`local-archive-kind-${kind}`}
                    onCheckedChange={() =>
                      onChange(toggleKind(kind, checkedKinds))
                    }
                  />
                  <label
                    className="cursor-pointer text-sm text-muted-foreground"
                    htmlFor={`local-archive-kind-${kind}`}
                  >
                    {translateKindLabel(label, kind, t)}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Custom kinds input ────────────────────────────────────────────────────────

type CustomKindsInputProps = {
  value: string;
  onChange: (raw: string) => void;
};

function CustomKindsInput({ value, onChange }: CustomKindsInputProps) {
  const t = useT();
  const { invalid } = parseCustomKinds(value);
  const hasInvalid = invalid.length > 0;
  return (
    <div>
      <label
        className="mb-1.5 block text-sm font-medium"
        htmlFor="local-archive-custom-kinds"
      >
        {t("settings.archive.customKinds")}
      </label>
      <input
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        data-testid="local-archive-custom-kinds"
        id="local-archive-custom-kinds"
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. 30023 1337"
        type="text"
        value={value}
      />
      <p className="mt-1 text-xs text-muted-foreground">
        {t("settings.archive.customKindsHint")}
      </p>
      {hasInvalid && (
        <p
          className="mt-1 text-xs text-destructive"
          data-testid="local-archive-custom-kinds-error"
        >
          {t("settings.archive.invalidTokens")}
          {invalid.map((token, i) => (
            <React.Fragment key={token}>
              {i > 0 && ", "}
              <code className="font-mono">{token}</code>
            </React.Fragment>
          ))}
        </p>
      )}
    </div>
  );
}

// ── Add-subscription form (Steps 1 + 2) ──────────────────────────────────────

type AddFormProps = {
  channels: Array<{ id: string; name: string }>;
  onSaved: () => void;
  onCancel: () => void;
};

function AddSubscriptionForm({ channels, onSaved, onCancel }: AddFormProps) {
  const t = useT();
  const [selectedChannelId, setSelectedChannelId] = React.useState("");
  const [checkedKinds, setCheckedKinds] = React.useState<Set<number>>(
    new Set(),
  );
  const [customKindsRaw, setCustomKindsRaw] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);

  const { valid: customKinds } = parseCustomKinds(customKindsRaw);
  const request = buildSubscriptionRequest(
    "channel_h",
    selectedChannelId,
    checkedKinds,
    customKinds,
  );
  const canAdd = request !== null;

  const handleAdd = React.useCallback(async () => {
    if (request === null) return;

    setIsAdding(true);
    try {
      await createSaveSubscription(
        request.scopeType,
        request.scopeValue,
        request.kinds,
      );
      onSaved();
      toast.success(t("settings.archive.created"));
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("settings.archive.createFailed"),
      );
    } finally {
      setIsAdding(false);
    }
  }, [request, onSaved, t]);

  const handleCancel = () => {
    setSelectedChannelId("");
    setCheckedKinds(new Set());
    setCustomKindsRaw("");
    onCancel();
  };

  return (
    <SettingsOptionGroup>
      <div className="space-y-5 px-4 py-4">
        {/* Channel picker */}
        <div>
          <label
            className="mb-1.5 block text-sm font-medium"
            htmlFor="local-archive-channel-select"
          >
            {t("settings.archive.channel")}
          </label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-testid="local-archive-channel-select"
            id="local-archive-channel-select"
            onChange={(e) => setSelectedChannelId(e.target.value)}
            value={selectedChannelId}
          >
            <option value="">{t("settings.archive.selectChannel")}</option>
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.name}
              </option>
            ))}
          </select>
        </div>

        {/* Event types (per-kind checklist) */}
        <div>
          <p className="mb-3 text-sm font-medium">
            {t("settings.archive.eventTypes")}
          </p>
          <KindChecklist
            checkedKinds={checkedKinds}
            onChange={setCheckedKinds}
          />
        </div>

        {/* Advanced: custom kinds */}
        <CustomKindsInput onChange={setCustomKindsRaw} value={customKindsRaw} />

        <div className="flex justify-end gap-2">
          <Button
            disabled={isAdding}
            onClick={handleCancel}
            type="button"
            variant="outline"
          >
            {t("common.cancel")}
          </Button>
          <Button
            data-testid="local-archive-confirm-add"
            disabled={isAdding || !canAdd}
            onClick={() => void handleAdd()}
            type="button"
          >
            {isAdding ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </div>
    </SettingsOptionGroup>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function LocalArchiveSettingsCard() {
  const t = useT();
  const identityQuery = useIdentityQuery();
  const channelsQuery = useChannelsQuery();
  const [subs, setSubs] = React.useState<SaveSubscription[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [deletingKey, setDeletingKey] = React.useState<string | null>(null);
  const [isAddingOpen, setIsAddingOpen] = React.useState(false);
  const [observerToggling, setObserverToggling] = React.useState(false);
  const [metricToggling, setMetricToggling] = React.useState(false);
  const [observerPolicy, setObserverPolicy] = React.useState<
    boolean | undefined
  >(undefined);

  React.useEffect(() => {
    observerArchiveDefaultEnabled()
      .then((on) => setObserverPolicy(on))
      .catch(() => {
        // Fail closed: leave as undefined so toggle stays disabled.
      });
  }, []);

  const pubkey = identityQuery.data?.pubkey ?? "";

  const channelNameById = React.useMemo<Map<string, string>>(() => {
    const map = new Map<string, string>();
    for (const ch of channelsQuery.data ?? []) {
      map.set(ch.id, ch.name);
    }
    return map;
  }, [channelsQuery.data]);

  const joinedChannels = React.useMemo(
    () => (channelsQuery.data ?? []).filter((ch) => ch.isMember),
    [channelsQuery.data],
  );

  const reload = React.useCallback(async () => {
    try {
      const rows = await listSaveSubscriptions();
      setSubs(rows);
    } catch (err) {
      console.warn("[LocalArchiveSettingsCard] list failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const handleDelete = React.useCallback(
    async (scopeType: ScopeType, scopeValue: string) => {
      const key = `${scopeType}:${scopeValue}`;
      setDeletingKey(key);
      try {
        await deleteSaveSubscription(scopeType, scopeValue);
        await reload();
        toast.success(t("settings.archive.removed"));
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : t("settings.archive.removeFailed"),
        );
      } finally {
        setDeletingKey(null);
      }
    },
    [reload, t],
  );

  const observerEnabled = subs.some(
    (s) =>
      s.scopeType === "owner_p" && s.kinds.includes(KIND_AGENT_OBSERVER_FRAME),
  );
  const metricEnabled = subs.some(
    (s) =>
      s.scopeType === "owner_p" && s.kinds.includes(KIND_AGENT_TURN_METRIC),
  );

  const handleObserverToggle = React.useCallback(
    async (checked: boolean) => {
      if (!pubkey) return;
      if (!checked && observerPolicy !== false) return;
      setObserverToggling(true);
      try {
        if (checked) {
          await mergeSaveSubscriptionKinds(KIND_AGENT_OBSERVER_FRAME);
        } else {
          await removeSaveSubscriptionKind(KIND_AGENT_OBSERVER_FRAME);
        }
        toast.success(
          checked
            ? t("settings.archive.observerEnabled")
            : t("settings.archive.observerDisabled"),
        );
        await reload();
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : t("settings.archive.observerUpdateFailed"),
        );
      } finally {
        setObserverToggling(false);
      }
    },
    [pubkey, observerPolicy, reload, t],
  );

  const handleMetricToggle = React.useCallback(
    async (checked: boolean) => {
      if (!pubkey) return;
      setMetricToggling(true);
      try {
        if (checked) {
          await mergeSaveSubscriptionKinds(KIND_AGENT_TURN_METRIC);
        } else {
          await removeSaveSubscriptionKind(KIND_AGENT_TURN_METRIC);
        }
        setExplicitAgentMetricArchiveChoice(pubkey, checked);
        toast.success(
          checked
            ? t("settings.archive.metricEnabled")
            : t("settings.archive.metricDisabled"),
        );
        await reload();
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : t("settings.archive.metricUpdateFailed"),
        );
      } finally {
        setMetricToggling(false);
      }
    },
    [pubkey, reload, t],
  );

  // Non-owner_p subscriptions shown in the active-subscriptions list.
  // observer (24200) and metric (44200) owner_p subs each have their own
  // dedicated section above.
  const channelSubs = subs.filter((s) => s.scopeType !== "owner_p");

  return (
    <section className="min-w-0" data-testid="settings-local-archive">
      <SettingsSectionHeader
        title={t("settings.archive.title")}
        description={t("settings.archive.description")}
      />

      <div className="space-y-6">
        {/* Observer-feed archive — dedicated first-class section */}
        <ObserverArchiveSection
          enabled={observerEnabled}
          onToggle={(checked) => void handleObserverToggle(checked)}
          policy={observerPolicy}
          toggling={observerToggling}
        />

        {/* Agent-turn-metric archive — dedicated first-class section */}
        <AgentMetricArchiveSection
          enabled={metricEnabled}
          onToggle={(checked) => void handleMetricToggle(checked)}
          toggling={metricToggling}
        />

        {/* Channel subscriptions */}
        <div className="space-y-3" data-testid="local-archive-subscriptions">
          <h2 className="text-lg font-semibold tracking-tight">
            {channelSubs.length > 0
              ? t("settings.archive.channelSubsCount", {
                  count: channelSubs.length,
                })
              : t("settings.archive.channelSubs")}
          </h2>
          {isLoading ? (
            <SettingsOptionGroup>
              <div className="px-4 py-3 text-sm font-normal text-muted-foreground">
                {t("settings.archive.loading")}
              </div>
            </SettingsOptionGroup>
          ) : channelSubs.length === 0 ? (
            <SettingsOptionGroup>
              <div className="px-4 py-3 text-sm font-normal text-muted-foreground">
                {t("settings.archive.noChannelSubs")}
              </div>
            </SettingsOptionGroup>
          ) : (
            <SettingsOptionGroup>
              {channelSubs.map((sub) => {
                const key = `${sub.scopeType}:${sub.scopeValue}`;
                const name = scopeLabel(sub, channelNameById, t);
                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 px-4 py-3"
                    data-testid={`local-archive-sub-${key}`}
                  >
                    <Archive className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("settings.archive.subKinds", {
                          scope: sub.scopeType,
                          kinds: kindSummary(sub.kinds, t),
                        })}
                      </p>
                    </div>
                    <Button
                      aria-label={t("settings.archive.removeSubAria", {
                        name,
                      })}
                      disabled={deletingKey === key}
                      onClick={() =>
                        void handleDelete(sub.scopeType, sub.scopeValue)
                      }
                      size="icon"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </SettingsOptionGroup>
          )}
        </div>

        {/* Add channel subscription */}
        <div className="space-y-3" data-testid="local-archive-add">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("settings.archive.addChannelSub")}
          </h2>
          {isAddingOpen ? (
            <AddSubscriptionForm
              channels={joinedChannels}
              onCancel={() => setIsAddingOpen(false)}
              onSaved={() => {
                setIsAddingOpen(false);
                void reload();
              }}
            />
          ) : (
            <SettingsOptionGroup>
              <SettingsOptionRow>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {t("settings.archive.subscribeTitle")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("settings.archive.subscribeHint")}
                  </p>
                </div>
                <Button
                  data-testid="local-archive-open-add"
                  onClick={() => setIsAddingOpen(true)}
                  size="sm"
                  variant="outline"
                >
                  {t("settings.archive.add")}
                </Button>
              </SettingsOptionRow>
            </SettingsOptionGroup>
          )}
        </div>
      </div>
    </section>
  );
}

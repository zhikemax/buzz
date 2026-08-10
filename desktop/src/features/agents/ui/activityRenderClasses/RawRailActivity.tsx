import { ChevronDown } from "lucide-react";

import { useT } from "@/shared/i18n";
import {
  ActivityRow,
  ActivityRowContent,
  ActivityRowLabel,
} from "./ActivityRow";
import { ToolActivity } from "./ToolActivity";
import { formatTranscriptTimestampTitle } from "../agentSessionUtils";
import { localizeTranscriptActivityTitle } from "../agentSessionTranscriptPresentation";
import {
  localizePromptSectionTitle,
  PromptSectionList,
} from "../PromptSectionAccordion";
import type { ActivityRenderClassItemProps } from "./types";

export function RawRailActivity(props: ActivityRenderClassItemProps) {
  const t = useT();
  if (props.item.type === "tool") {
    return <ToolActivity {...props} />;
  }
  if (props.item.type !== "metadata") {
    return null;
  }

  const sectionCount = props.item.sections.length;
  const sectionSuffix =
    sectionCount === 1
      ? t("agents.sectionCountOne")
      : t("agents.sectionCountMany", { count: sectionCount });
  const isRawPayload = props.item.acpSource === "raw_json_rpc";
  const verb = localizeTranscriptActivityTitle(props.item.title, t);

  return (
    <ActivityRow
      testId="transcript-metadata-item"
      title={formatTranscriptTimestampTitle(props.item.timestamp)}
    >
      <ActivityRowLabel
        object={sectionSuffix}
        openToneScope="tool"
        verb={verb}
      />
      <ActivityRowContent className="flex flex-col gap-3 py-2">
        {isRawPayload ? (
          props.item.sections.map((section) => (
            <details
              className="group/section"
              key={`${section.title}:${section.body.slice(0, 48)}`}
            >
              <summary className="inline-flex max-w-full cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-muted-foreground/60 group-open/section:text-foreground">
                <span className="truncate">
                  {localizePromptSectionTitle(section.title, t)}
                </span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform group-open/section:rotate-180 group-open/section:text-foreground" />
              </summary>
              <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap wrap-break-word rounded-md bg-muted/50 px-3 py-2 font-mono text-xs leading-5 text-muted-foreground">
                {section.body.trim() || t("agents.noMetadata")}
              </pre>
            </details>
          ))
        ) : (
          <PromptSectionList sections={props.item.sections} />
        )}
      </ActivityRowContent>
    </ActivityRow>
  );
}

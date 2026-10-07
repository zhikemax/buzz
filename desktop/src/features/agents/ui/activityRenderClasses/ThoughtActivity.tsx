import { useT } from "@/shared/i18n";
import { Markdown } from "@/shared/ui/markdown";
import {
  ActivityRow,
  ActivityRowContent,
  ActivityRowLabel,
} from "./ActivityRow";
import { ToolActivity } from "./ToolActivity";
import { formatTranscriptTimestampTitle } from "../agentSessionUtils";
import { localizeTranscriptActivityTitle } from "../agentSessionTranscriptPresentation";
import type { ActivityRenderClassItemProps } from "./types";

export function ThoughtActivity(props: ActivityRenderClassItemProps) {
  const t = useT();
  if (props.item.type === "tool") {
    return <ToolActivity {...props} />;
  }
  if (props.item.type !== "thought") {
    return null;
  }

  const text = props.item.text.trim();
  const label = (
    <ActivityRowLabel openToneScope="tool" verb={props.item.title} />
  );
  const title = formatTranscriptTimestampTitle(props.item.timestamp);

  // Some models return thinking sealed (signature only, no readable text).
  // Keep the row so it is clear the model did think, but nothing expands.
  if (!text) {
    return (
      <ActivityRow testId="transcript-thought-item" title={title}>
        {label}
        <span className="text-xs text-muted-foreground/70">
          No readable reasoning tokens
        </span>
      </ActivityRow>
    );
  }

  return (
    <ActivityRow testId="transcript-thought-item" title={title}>
      <ActivityRowLabel
        openToneScope="tool"
        verb={localizeTranscriptActivityTitle(props.item.title, t)}
      />
      <ActivityRowContent className="pt-1 pb-1.5 text-sm leading-5 text-muted-foreground">
        <Markdown className="leading-5" content={text} />
      </ActivityRowContent>
    </ActivityRow>
  );
}

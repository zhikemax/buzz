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

  return (
    <ActivityRow
      testId="transcript-thought-item"
      title={formatTranscriptTimestampTitle(props.item.timestamp)}
    >
      <ActivityRowLabel
        openToneScope="tool"
        verb={localizeTranscriptActivityTitle(props.item.title, t)}
      />
      <ActivityRowContent className="pt-1 pb-1.5 text-sm leading-5 text-muted-foreground">
        <Markdown
          className="leading-5"
          content={props.item.text.trim() || " "}
        />
      </ActivityRowContent>
    </ActivityRow>
  );
}

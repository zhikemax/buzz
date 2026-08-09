import { RecoveryScreen } from "./RecoveryScreen";
import { translate } from "@/shared/i18n";

export function RelaunchRequiredScreen() {
  return (
    <RecoveryScreen
      testId="relaunch-required"
      title={translate("onboard.recoveryRelaunchTitle")}
      body={translate("onboard.recoveryRelaunchBody")}
    />
  );
}

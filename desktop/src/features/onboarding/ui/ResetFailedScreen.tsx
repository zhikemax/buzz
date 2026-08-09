import { RecoveryScreen } from "./RecoveryScreen";
import { translate } from "@/shared/i18n";

export function ResetFailedScreen() {
  return (
    <RecoveryScreen
      testId="reset-failed"
      title={translate("onboard.recoveryResetFailedTitle")}
      body={translate("onboard.recoveryResetFailedBody")}
    />
  );
}

import { useT } from "@/shared/i18n";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useUpdaterContext } from "./hooks/UpdaterProvider";
import { Button } from "@/shared/ui/button";
import {
  SettingsOptionGroup,
  SettingsOptionRow,
} from "./ui/SettingsOptionGroup";
import { SettingsSectionHeader } from "./ui/SettingsSectionHeader";
export function UpdateChecker() {
  const t = useT();
  const { status, checkForUpdate, installAndRelaunch } = useUpdaterContext();

  return (
    <section className="min-w-0" data-testid="settings-updates">
      <SettingsSectionHeader
        title={t("settings.updates.title")}
        description={t("settings.updates.description")}
      />

      <SettingsOptionGroup title={t("settings.updates.status")}>
        {status.state === "idle" && (
          <SettingsOptionRow>
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("settings.updates.status")}</p>
              <p
                className="text-sm font-normal text-muted-foreground/70"
                data-settings-subcopy
              >
                {t("settings.updates.checkHint")}
              </p>
            </div>
            <Button size="sm" onClick={checkForUpdate}>
              {t("settings.updates.check")}
            </Button>
          </SettingsOptionRow>
        )}

        {status.state === "checking" && (
          <SettingsOptionRow>
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("settings.updates.status")}</p>
              <p
                className="text-sm font-normal text-muted-foreground/70"
                data-settings-subcopy
              >
                {t("settings.updates.checking")}
              </p>
            </div>
          </SettingsOptionRow>
        )}

        {status.state === "up-to-date" && (
          <SettingsOptionRow>
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("settings.updates.status")}</p>
              <p
                className="text-sm font-normal text-muted-foreground/70"
                data-settings-subcopy
              >
                {t("settings.updates.upToDate")}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={checkForUpdate}>
              {t("settings.updates.checkAgain")}
            </Button>
          </SettingsOptionRow>
        )}

        {status.state === "unavailable" && (
          <SettingsOptionRow>
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("settings.updates.status")}</p>
              <p
                className="text-sm font-normal text-muted-foreground/70"
                data-settings-subcopy
              >{t("settings.updates.unavailable")}</p>
            </div>
            <Button variant="outline" size="sm" onClick={checkForUpdate}>
              {t("settings.updates.checkAgain")}
            </Button>
          </SettingsOptionRow>
        )}

        {status.state === "manual-required" && (
          <SettingsOptionRow>
            <div className="min-w-0">
              <p className="text-sm font-medium">
                Update available — v{status.version}
              </p>
              <p
                className="text-sm font-normal text-muted-foreground/70"
                data-settings-subcopy
              >
                In-app updates aren't supported on this Linux package. Download
                the new version from GitHub.{" "}
                <span>{t("settings.updates.appImageHint")}</span>
              </p>
            </div>
            <Button size="sm" onClick={() => void openUrl(status.releaseUrl)}>
              {t("settings.updates.download")}
            </Button>
          </SettingsOptionRow>
        )}

        {status.state === "available" && (
          <SettingsOptionRow>
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("settings.updates.status")}</p>
              <p
                className="text-sm font-normal text-muted-foreground/70"
                data-settings-subcopy
              >
                {t("settings.updates.preparing")}
              </p>
            </div>
          </SettingsOptionRow>
        )}

        {status.state === "downloading" && (
          <SettingsOptionRow>
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("settings.updates.status")}</p>
              <p
                className="text-sm font-normal text-muted-foreground/70"
                data-settings-subcopy
              >
                {t("settings.updates.downloading")}
              </p>
            </div>
          </SettingsOptionRow>
        )}

        {status.state === "installing" && (
          <SettingsOptionRow>
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("settings.updates.status")}</p>
              <p
                className="text-sm font-normal text-muted-foreground/70"
                data-settings-subcopy
              >
                {t("settings.updates.installing")}
              </p>
            </div>
          </SettingsOptionRow>
        )}

        {status.state === "ready" && (
          <SettingsOptionRow>
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("settings.updates.status")}</p>
              <p
                className="text-sm font-normal text-muted-foreground/70"
                data-settings-subcopy
              >
                {t("settings.updates.readyHint")}
              </p>
            </div>
            <Button size="sm" onClick={installAndRelaunch}>
              {t("settings.updates.updateNow")}
            </Button>
          </SettingsOptionRow>
        )}

        {status.state === "error" && (
          <SettingsOptionRow>
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("settings.updates.status")}</p>
              <p className="text-sm font-normal text-destructive">
                {t("settings.updates.failed", { message: status.message })}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={checkForUpdate}>
              {t("common.retry")}
            </Button>
          </SettingsOptionRow>
        )}
      </SettingsOptionGroup>
    </section>
  );
}

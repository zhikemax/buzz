import { motion, useReducedMotion } from "motion/react";
import * as React from "react";

import { Button } from "@/shared/ui/button";
import {
  ONBOARDING_SECURITY_PRIMARY_CTA_CLASS,
  ONBOARDING_SECONDARY_CTA_CLASS,
} from "./OnboardingChrome";
import { OnboardingFooter } from "./OnboardingFooter";
import {
  type OnboardingTransitionDirection,
  OnboardingSlideTransition,
} from "./OnboardingSlideTransition";
import { useT } from "@/shared/i18n";
import {
  type EncryptedBackupSession,
  EncryptedBackupCreator,
} from "./EncryptedBackupCreator";

type DownloadKeyStepProps = {
  direction: OnboardingTransitionDirection;
  /** Backup state owned by the parent flow across the creation and test views. */
  session: EncryptedBackupSession;
  onBack: () => void;
};

/**
 * Password-backup security subview within the identity-key onboarding step.
 * The raw key never enters this component: Rust builds the NIP-49 payload
 * locally and the native save dialog produces the user-owned file.
 */
export function DownloadKeyStep({
  direction,
  session,
  onBack,
}: DownloadKeyStepProps) {
  const t = useT();
  const reduceMotion = useReducedMotion() ?? false;
  // Once the encrypted payload is saved, the creator advances to its guided
  // backup test while this surface keeps its own navigation.
  const hasCreated = session.created;
  const hasVerifiedBackup = session.verified;
  const hasSelectedBackup = session.test.stage === "password";
  const [primaryActionSlot, setPrimaryActionSlot] =
    React.useState<HTMLElement | null>(null);

  return (
    <OnboardingSlideTransition
      className="flex min-h-0 w-full flex-col items-center"
      data-testid="onboarding-page-download"
      direction={direction}
      transitionKey={`download-${direction}`}
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full max-w-[500px] shrink-0 flex-col text-center"
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        key={
          hasVerifiedBackup
            ? "success-heading"
            : hasCreated
              ? "test-heading"
              : "password-heading"
        }
        transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }}
      >
        {/* Plain string concat: cn()'s tailwind-merge misreads the custom
            text-title size token as conflicting with text-foreground. */}
        <h1 className="text-title font-normal text-foreground">
          {hasVerifiedBackup
            ? t("onboard.backupVerified")
            : hasSelectedBackup
              ? t("onboard.thatsBackupFile")
              : hasCreated
                ? t("onboard.testBackup")
                : t("onboard.backupWithPassword")}
        </h1>
        <p className="mt-5 text-sm leading-6 text-foreground/80">
          {hasVerifiedBackup
            ? t("onboard.backupVerifiedHint")
            : hasSelectedBackup
              ? t("onboard.backupSelectedHint")
              : hasCreated
                ? t("onboard.backupCreatedHint")
                : t("onboard.backupPasswordHint")}
        </p>
      </motion.div>

      <div className="flex w-full max-w-[1040px] flex-1 flex-col justify-center py-10">
        <div className="w-full">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            key={hasCreated ? "test-panel" : "password-panel"}
            transition={{
              delay: reduceMotion ? 0 : 0.12,
              duration: reduceMotion ? 0 : 0.4,
              ease: "easeOut",
            }}
          >
            <div
              className="mx-auto w-full max-w-140 px-6 py-5"
              data-testid="backup-password-panel"
            >
              <EncryptedBackupCreator
                createButtonClassName={ONBOARDING_SECURITY_PRIMARY_CTA_CLASS}
                createButtonPortal={primaryActionSlot}
                session={session}
                variant="spotlight"
                verifyButtonPortal={primaryActionSlot}
              />
            </div>
          </motion.div>
        </div>
      </div>

      <OnboardingFooter>
        <div
          className="flex justify-center"
          data-testid={
            hasCreated ? "onboarding-verify-slot" : "onboarding-create-slot"
          }
          ref={setPrimaryActionSlot}
        />
        <Button
          className={
            hasVerifiedBackup
              ? ONBOARDING_SECURITY_PRIMARY_CTA_CLASS
              : ONBOARDING_SECONDARY_CTA_CLASS
          }
          data-testid="onboarding-back"
          onClick={onBack}
          type="button"
          variant="ghost"
        >
          {hasVerifiedBackup
            ? t("common.finish")
            : hasCreated
              ? t("common.skip")
              : t("common.back")}
        </Button>
      </OnboardingFooter>
    </OnboardingSlideTransition>
  );
}

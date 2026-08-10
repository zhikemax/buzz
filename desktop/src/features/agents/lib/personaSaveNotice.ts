import type { PersonaSharePublicationResult } from "@/shared/api/tauriPersonas";
import type { TranslateFn } from "@/shared/i18n";

/**
 * The confirmation shown after a persona edit is saved.
 *
 * `publicationStatus` is null when the edit did not promise publication, so
 * the copy stays silent about the catalog. When it did, the copy must
 * distinguish a relay-accepted publish from a queued one — a "published"
 * message for an edit still sitting in the outbox is the promise the
 * "Save and publish" button was making falsely.
 */
export function personaSaveNotice(
  displayName: string,
  publicationStatus: PersonaSharePublicationResult["publicationStatus"] | null,
  t: TranslateFn,
): string {
  switch (publicationStatus) {
    case "published":
      return t("agents.updatedAndPublished", { name: displayName });
    case "queued":
      return t("agents.updatedPublishQueued", { name: displayName });
    default:
      return t("agents.updatedNamed", { name: displayName });
  }
}

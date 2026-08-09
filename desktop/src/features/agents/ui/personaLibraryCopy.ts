import type { TranslateFn } from "@/shared/i18n";

export function getPersonaCatalogCopy(t: TranslateFn) {
  return {
    title: t("agents.catalogTitle"),
    description: t("agents.catalogHint"),
    dialogTitle: t("agents.catalogTitle"),
    dialogDescription: t("agents.catalogHint"),
    emptyTitle: t("agents.catalogAllSetTitle"),
    emptyDescription: t("agents.catalogAllSetDescription"),
    emptyCatalogDescription: t("agents.catalogEmptyHint"),
    emptyCatalogTitle: t("agents.catalogEmpty"),
    detailsAction: t("agents.viewDetails"),
    selectAction: t("agents.choose"),
    deselectAction: t("agents.deselect"),
    selectedState: t("agents.catalogSelectedState"),
    availableState: t("agents.catalogAvailableState"),
    detailSelectedTitle: t("agents.catalogDetailSelectedTitle"),
    detailSelectedDescription: t("agents.catalogDetailSelectedDescription"),
    detailAvailableTitle: t("agents.catalogDetailAvailableTitle"),
    detailAvailableDescription: t("agents.catalogDetailAvailableDescription"),
    useAction: t("agents.addAgent"),
    addedAction: t("agents.addedToMyAgents"),
    teamEmptyState: t("agents.catalogTeamEmptyState"),
  } as const;
}

export function getPersonaCatalogSelectionActionCopy(
  t: TranslateFn,
  isActive: boolean,
) {
  const copy = getPersonaCatalogCopy(t);
  return isActive ? copy.deselectAction : copy.selectAction;
}

export function getPersonaCatalogSelectionAriaLabel(
  t: TranslateFn,
  displayName: string,
  isActive: boolean,
) {
  return `${isActive ? t("agents.deselect") : t("agents.choose")} ${displayName} in My Agents`;
}

export function getPersonaCatalogDetailSelectionCopy(
  t: TranslateFn,
  isActive: boolean,
) {
  const copy = getPersonaCatalogCopy(t);
  return isActive
    ? {
        title: copy.detailSelectedTitle,
        description: copy.detailSelectedDescription,
      }
    : {
        title: copy.detailAvailableTitle,
        description: copy.detailAvailableDescription,
      };
}

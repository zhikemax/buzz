import type { TranslateFn } from "@/shared/i18n";

export function getPersonaLibraryCopy(t: TranslateFn) {
  return {
    title: t("agents.myAgents"),
    description:
      "The agents you have chosen for this app. Use them to create teams and launch agents.",
    chooseFromCatalog: t("agents.chooseFromCatalog"),
    createNew: t("agents.newAgent"),
    import: t("agents.importSnapshot"),
    emptyTitle: t("agents.noAgentsYet"),
    emptyDescription: t("agents.emptyHint"),
    emptyImportHint:
      "Or drop an .agent.json or .agent.png snapshot here to import.",
  } as const;
}

export function getPersonaCatalogCopy(t: TranslateFn) {
  return {
    title: t("agents.catalogTitle"),
    description: t("agents.catalogHint"),
    dialogTitle: t("agents.catalogTitle"),
    dialogDescription: t("agents.catalogHint"),
    emptyTitle: "You're all set",
    emptyDescription: "Everything in Agent Catalog is already in My Agents.",
    emptyCatalogDescription: "Shared agents will appear here.",
    emptyCatalogTitle: t("agents.catalogEmpty"),
    detailsAction: t("agents.viewDetails"),
    selectAction: t("agents.choose"),
    deselectAction: t("agents.deselect"),
    selectedState: "Selected",
    availableState: "Available",
    detailSelectedTitle: "Selected for My Agents",
    detailSelectedDescription:
      "Turn this off to remove the agent from teams and agent creation in this app.",
    detailAvailableTitle: "Available in Agent Catalog",
    detailAvailableDescription:
      "Turn this on to make the agent available for teams and agent creation.",
    useAction: t("agents.addAgent"),
    addedAction: t("agents.addedToMyAgents"),
    teamEmptyState:
      "No agents in My Agents yet. Create one or choose one from Agent Catalog first.",
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

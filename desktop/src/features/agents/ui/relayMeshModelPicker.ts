import type { TranslateFn } from "@/shared/i18n";
import {
  AUTO_MODEL_DROPDOWN_VALUE,
  buildTemplateModelDropdownOptions,
  CUSTOM_MODEL_DROPDOWN_VALUE,
  getModelSelectValue,
  hasPersonaModelOption,
  type PersonaDropdownOption,
  type PersonaModelOption,
} from "./agentConfigOptions";

function withSharedComputeAutoOption(
  options: readonly PersonaModelOption[],
  t: TranslateFn,
): readonly PersonaModelOption[] {
  const modelOptions = options.filter((option) => option.id.trim() !== "");
  return [
    { id: "", label: t("agents.autoCollective") },
    ...modelOptions,
  ];
}

export function relayMeshModelPickerState({
  discoveredOptions,
  fallbackOptions,
  knownOptions,
  isCustomEditing,
  model,
  modelFieldVisible = true,
  provider,
  t,
}: {
  discoveredOptions: readonly PersonaModelOption[] | null;
  fallbackOptions: readonly PersonaModelOption[];
  knownOptions?: readonly PersonaModelOption[];
  isCustomEditing: boolean;
  model: string;
  modelFieldVisible?: boolean;
  provider: string;
  t: TranslateFn;
}) {
  const isRelayMesh = provider.trim() === "relay-mesh";
  const trimmedModel = model.trim();
  const options = isRelayMesh
    ? withSharedComputeAutoOption(discoveredOptions ?? [], t)
    : (discoveredOptions ?? fallbackOptions);
  const isKnownModel = hasPersonaModelOption(knownOptions ?? options, model);
  const isCustom = !isRelayMesh && !isKnownModel;
  const selectValue = isRelayMesh
    ? trimmedModel === "auto" || !isKnownModel
      ? AUTO_MODEL_DROPDOWN_VALUE
      : trimmedModel || AUTO_MODEL_DROPDOWN_VALUE
    : getModelSelectValue({
        isCustomModelEditing: isCustomEditing,
        isModelCustom: isCustom,
        model,
      });
  return {
    isCustom,
    isRelayMesh,
    options,
    selectValue,
    showCustomInput:
      !isRelayMesh && modelFieldVisible && (isCustomEditing || isCustom),
  };
}

export function modelDropdownOptions({
  options,
  loading,
  loadingValue,
  allowCustom,
  globalModel,
  globalModelLabel,
  t,
}: {
  options: readonly PersonaModelOption[];
  loading: boolean;
  loadingValue: string;
  allowCustom: boolean;
  globalModel?: string;
  globalModelLabel?: string;
  t: TranslateFn;
}): PersonaDropdownOption[] {
  const modelOptions =
    globalModel === undefined
      ? options.map((option) => ({
          label: option.label,
          value: option.id || AUTO_MODEL_DROPDOWN_VALUE,
        }))
      : buildTemplateModelDropdownOptions(
          options,
          globalModel,
          globalModelLabel,
        );
  return [
    ...modelOptions,
    ...(loading
      ? [
          {
            disabled: true,
            label: t("agents.loadingModels"),
            value: loadingValue,
          },
        ]
      : []),
    ...(allowCustom
      ? [
          {
            label: t("agents.customModelEllipsis"),
            value: CUSTOM_MODEL_DROPDOWN_VALUE,
          },
        ]
      : []),
  ];
}

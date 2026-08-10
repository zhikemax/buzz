import { LayoutGrid, List } from "lucide-react";
import * as React from "react";

import type {
  ProjectsFilter,
  ProjectsViewMode,
} from "@/features/projects/lib/projectsViewHelpers";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

const SELECTED_MENU_ITEM_CLASSES =
  "font-semibold text-foreground after:opacity-100 hover:text-foreground";

const MASK_BOTH =
  "[mask-image:linear-gradient(to_right,transparent,black_1.5rem,black_calc(100%-1.5rem),transparent)]";
const MASK_LEFT =
  "[mask-image:linear-gradient(to_right,transparent,black_1.5rem)]";
const MASK_RIGHT =
  "[mask-image:linear-gradient(to_left,transparent,black_1.5rem)]";

type ProjectsToolbarProps = {
  filter: ProjectsFilter;
  onFilterChange: (filter: ProjectsFilter) => void;
};

export function ProjectsViewModeToggle({
  viewMode,
  onViewModeChange,
}: {
  viewMode: ProjectsViewMode;
  onViewModeChange: (viewMode: ProjectsViewMode) => void;
}) {
  const t = useT();

  return (
    <fieldset className="flex items-center rounded-lg bg-muted/30 p-0.5">
      <legend className="sr-only">{t("projects.layout.legend")}</legend>
      <Button
        aria-label={t("projects.layout.grid")}
        aria-pressed={viewMode === "grid"}
        className="h-7 w-7 px-0"
        onClick={() => onViewModeChange("grid")}
        size="xs"
        type="button"
        variant={viewMode === "grid" ? "secondary" : "ghost"}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </Button>
      <Button
        aria-label={t("projects.layout.list")}
        aria-pressed={viewMode === "list"}
        className="h-7 w-7 px-0"
        onClick={() => onViewModeChange("list")}
        size="xs"
        type="button"
        variant={viewMode === "list" ? "secondary" : "ghost"}
      >
        <List className="h-3.5 w-3.5" />
      </Button>
    </fieldset>
  );
}

function useHorizontalOverflow(ref: React.RefObject<HTMLElement | null>) {
  const [overflow, setOverflow] = React.useState({
    left: false,
    right: false,
  });

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = () => {
      const maxScrollLeft = element.scrollWidth - element.clientWidth;
      setOverflow((previous) => {
        const next = {
          left: element.scrollLeft > 1,
          right: element.scrollLeft < maxScrollLeft - 1,
        };
        return previous.left === next.left && previous.right === next.right
          ? previous
          : next;
      });
    };

    update();
    element.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      element.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [ref]);

  return overflow;
}

export function ProjectsToolbar({
  filter,
  onFilterChange,
}: ProjectsToolbarProps) {
  const t = useT();
  const scrollRef = React.useRef<HTMLFieldSetElement>(null);
  const overflow = useHorizontalOverflow(scrollRef);

  React.useEffect(() => {
    scrollRef.current
      ?.querySelector<HTMLElement>(`[data-testid="projects-section-${filter}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [filter]);

  const filterOptions: Array<{
    label: string;
    value: ProjectsFilter;
  }> = [
    { label: t("projects.tab.activity"), value: "all" },
    { label: t("nav.projects"), value: "projects" },
    { label: t("projects.tab.repositories"), value: "repositories" },
    { label: t("projects.tab.pullRequests"), value: "prs" },
    { label: t("projects.tab.issues"), value: "issues" },
  ];

  return (
    <div
      className="pointer-events-auto flex h-full min-w-0 items-center"
      data-tauri-drag-region
    >
      <div className="flex h-full min-w-0 flex-1 items-center gap-0.5 overflow-hidden">
        <fieldset
          className={cn(
            "flex h-full min-w-0 flex-1 flex-nowrap items-stretch gap-1 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden",
            overflow.left && overflow.right
              ? MASK_BOTH
              : overflow.left
                ? MASK_LEFT
                : overflow.right
                  ? MASK_RIGHT
                  : undefined,
          )}
          ref={scrollRef}
        >
          <legend className="sr-only">{t("projects.layout.ownerFilter")}</legend>
          {filterOptions.map((option) => (
            <Button
              aria-label={option.label}
              aria-pressed={filter === option.value}
              className={cn(
                "relative h-full shrink-0 gap-1.5 rounded-none px-2.5 text-base leading-5 tracking-tight text-muted-foreground after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:bg-current after:opacity-0 after:transition-opacity after:content-[''] hover:bg-transparent hover:text-foreground hover:after:opacity-100",
                option.value === "all" && "pl-0 after:left-0",
                filter === option.value && SELECTED_MENU_ITEM_CLASSES,
              )}
              data-testid={`projects-section-${option.value}`}
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              type="button"
              variant="ghost"
            >
              <span className="grid">
                <span
                  aria-hidden="true"
                  className="invisible col-start-1 row-start-1 font-semibold"
                >
                  {option.label}
                </span>
                <span className="col-start-1 row-start-1">{option.label}</span>
              </span>
            </Button>
          ))}
        </fieldset>
      </div>
    </div>
  );
}

import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type EmptyStateAction =
  | React.ReactNode
  | { label: string; onClick: () => void };

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => {
  const isCtaAction =
    action !== null &&
    typeof action === "object" &&
    !React.isValidElement(action) &&
    "label" in action &&
    "onClick" in action &&
    typeof (action as { onClick: unknown }).onClick === "function";
  const actionNode = action && (isCtaAction ? (
    <Button onClick={(action as { onClick: () => void }).onClick} size="sm" className="gap-2">
      {(action as { label: string }).label}
    </Button>
  ) : (
    action
  ));

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      {Icon && (
        <Icon className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/50 mb-4" />
      )}
      <h3 className="text-base sm:text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          {description}
        </p>
      )}
      {actionNode && <div className="mt-2">{actionNode}</div>}
    </div>
  );
};


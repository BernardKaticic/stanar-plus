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
        "flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4",
        className
      )}
    >
      {Icon && (
        <div className="mb-5 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary/10 text-primary/80">
          <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-base sm:text-lg font-semibold tracking-tight text-foreground mb-2 max-w-sm">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {actionNode && <div className="mt-1">{actionNode}</div>}
    </div>
  );
};


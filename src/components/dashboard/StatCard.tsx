import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon | null;
  trend?: "up" | "down";
}

export const StatCard = ({ title, value, change, changeType = "neutral", icon: Icon, trend }: StatCardProps) => {
  return (
    <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold break-words">{value}</p>
          {change && (
            <p className={cn(
              "mt-2 text-sm font-medium",
              changeType === "positive" && "text-success",
              changeType === "negative" && "text-destructive",
              changeType === "neutral" && "text-muted-foreground"
            )}>
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "rounded-lg p-3 shrink-0",
            changeType === "positive" && "bg-success/10 text-success",
            changeType === "negative" && "bg-destructive/10 text-destructive",
            changeType === "neutral" && "bg-primary/10 text-primary"
          )}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </Card>
  );
};

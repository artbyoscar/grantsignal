import * as React from "react";
import { Check, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

type ConfidenceLevel = "high" | "medium" | "low";
type ConfidenceSize = "sm" | "md" | "lg";

interface ConfidenceBadgeProps {
  /**
   * Confidence score from 0-100
   */
  score: number;
  /**
   * Size variant
   * @default "md"
   */
  size?: ConfidenceSize;
  /**
   * Show "View Sources" button
   */
  showSourcesButton?: boolean;
  /**
   * Callback when "View Sources" is clicked
   */
  onViewSources?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const getConfidenceLevel = (score: number): ConfidenceLevel => {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  return "low";
};

const confidenceConfig = {
  high: {
    label: "High Confidence",
    bgColor: "bg-[#10B98120]",
    textColor: "text-[#10B981]",
    borderColor: "border-[#10B981]",
    icon: Check,
    tooltip: "High confidence (≥80%). Content generated from multiple relevant sources.",
  },
  medium: {
    label: "Medium Confidence",
    bgColor: "bg-[#F59E0B20]",
    textColor: "text-[#F59E0B]",
    borderColor: "border-[#F59E0B]",
    icon: AlertTriangle,
    tooltip: "Medium confidence (60-79%). Verify accuracy before use.",
  },
  low: {
    label: "Low Confidence",
    bgColor: "bg-[#EF444420]",
    textColor: "text-[#EF4444]",
    borderColor: "border-[#EF4444]",
    icon: XCircle,
    tooltip: "Low confidence (<60%). Cannot confidently generate content. Review sources manually.",
  },
};

const sizeConfig = {
  sm: {
    container: "px-2 py-0.5 gap-1 text-xs",
    icon: "h-3 w-3",
    button: "h-6 text-xs px-2",
  },
  md: {
    container: "px-3 py-1.5 gap-1.5 text-sm",
    icon: "h-4 w-4",
    button: "h-8 text-sm px-3",
  },
  lg: {
    container: "px-4 py-2 gap-2 text-base",
    icon: "h-5 w-5",
    button: "h-9 text-sm px-4",
  },
};

export function ConfidenceBadge({
  score,
  size = "md",
  showSourcesButton = false,
  onViewSources,
  className,
}: ConfidenceBadgeProps) {
  const level = getConfidenceLevel(score);
  const config = confidenceConfig[level];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <div
        className={cn(
          "inline-flex items-center gap-2",
          showSourcesButton && "flex-wrap",
          className
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "inline-flex items-center rounded-full border font-medium",
                config.bgColor,
                config.textColor,
                config.borderColor,
                sizeStyles.container
              )}
            >
              <Icon className={cn("shrink-0", sizeStyles.icon)} />
              <span className="font-semibold">{score}%</span>
              {size !== "sm" && (
                <span className="hidden sm:inline">
                  {level === "high" && "Confidence"}
                  {level === "medium" && "Confidence"}
                  {level === "low" && "Confidence"}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold mb-1">{config.label}</p>
            <p className="text-sm text-muted-foreground">{config.tooltip}</p>
          </TooltipContent>
        </Tooltip>

        {showSourcesButton && onViewSources && (
          <Button
            variant="outline"
            size={size === "lg" ? "default" : "sm"}
            onClick={onViewSources}
            className={cn(
              "shrink-0",
              config.textColor,
              config.borderColor,
              "hover:bg-opacity-10",
              sizeStyles.button
            )}
          >
            View Sources
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * Standalone confidence indicator without badge styling
 * Useful for inline text or compact displays
 */
export function ConfidenceIndicator({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const level = getConfidenceLevel(score);
  const config = confidenceConfig[level];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium",
        config.textColor,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{score}%</span>
    </span>
  );
}

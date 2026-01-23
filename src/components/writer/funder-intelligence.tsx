import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

interface FunderIntelProps {
  funderId: string;
  funderName: string;
  funderType: string;
  focusAreas: string[];
  avgGrantSize: number | null;
  grantSizeRange: {
    min: number | null;
    max: number | null;
    median: number | null;
  } | null;
  totalGiving: number | null;
  geographicFocus: string[] | null;
  applicationProcess: string | null;
  isLoading?: boolean;
}

export function FunderIntelligence({
  funderId,
  funderName,
  funderType,
  focusAreas,
  avgGrantSize,
  grantSizeRange,
  totalGiving,
  geographicFocus,
  applicationProcess,
  isLoading,
}: FunderIntelProps) {
  const formatCurrency = (amount: number): string => {
    if (amount >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(1)}M`;
    }
    if (amount >= 1_000) {
      return `$${(amount / 1_000).toFixed(0)}k`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const formatFunderType = (type: string): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-200">
            Funder Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  // Check if we have any data
  const hasData = focusAreas.length > 0 || avgGrantSize || totalGiving || geographicFocus;

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-200">
            Funder Intelligence
          </CardTitle>
          <Link
            href={`/funders/${funderId}`}
            className="text-blue-400 hover:text-blue-300 transition-colors"
            title="View full funder profile"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
        <p className="text-sm text-slate-400">About {funderName}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Funder Type */}
        <div>
          <span className="text-slate-400 text-sm">Type: </span>
          <span className="text-slate-200 text-sm font-medium">
            {formatFunderType(funderType)}
          </span>
        </div>

        {/* Grant Size Range */}
        {avgGrantSize || grantSizeRange ? (
          <div>
            <span className="text-slate-400 text-sm">Grant Size: </span>
            <span className="text-slate-200 text-sm">
              {grantSizeRange?.min && grantSizeRange?.max
                ? `${formatCurrency(grantSizeRange.min)} - ${formatCurrency(grantSizeRange.max)}`
                : avgGrantSize
                ? `Avg: ${formatCurrency(avgGrantSize)}`
                : 'Not available'}
            </span>
          </div>
        ) : (
          <div>
            <span className="text-slate-400 text-sm">Grant Size: </span>
            <span className="text-slate-500 text-sm italic">No data available</span>
          </div>
        )}

        {/* Total Giving */}
        {totalGiving && (
          <div>
            <span className="text-slate-400 text-sm">Total Giving: </span>
            <span className="text-slate-200 text-sm">{formatCurrency(totalGiving)}</span>
          </div>
        )}

        {/* Focus Areas */}
        {focusAreas.length > 0 ? (
          <div>
            <span className="text-slate-400 text-sm">Focus Areas: </span>
            <span className="text-slate-200 text-sm">{focusAreas.join(", ")}</span>
          </div>
        ) : (
          <div>
            <span className="text-slate-400 text-sm">Focus Areas: </span>
            <span className="text-slate-500 text-sm italic">No data available</span>
          </div>
        )}

        {/* Geographic Focus */}
        {geographicFocus && geographicFocus.length > 0 && (
          <div>
            <span className="text-slate-400 text-sm">Geographic Focus: </span>
            <span className="text-slate-200 text-sm">{geographicFocus.join(", ")}</span>
          </div>
        )}

        {/* Application Process */}
        {applicationProcess && (
          <div>
            <span className="text-slate-400 text-sm">Application: </span>
            <span className="text-slate-200 text-sm line-clamp-2">{applicationProcess}</span>
          </div>
        )}

        {/* Data completeness indicator */}
        {!hasData && (
          <div className="pt-2 border-t border-slate-700">
            <p className="text-xs text-slate-500 italic">
              Limited funder data available. Add funder details to improve AI suggestions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

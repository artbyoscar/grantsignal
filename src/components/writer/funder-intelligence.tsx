import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FunderIntelProps {
  funderName: string;
  focus: string[];
  avgGrantSize: number;
  keyPriorities: string[];
}

export function FunderIntelligence({
  funderName,
  focus,
  avgGrantSize,
  keyPriorities,
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

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-200">
          Funder Intelligence
        </CardTitle>
        <p className="text-sm text-slate-400">Quick Facts</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <span className="text-slate-400 text-sm">Funder Focus: </span>
          <span className="text-slate-200 text-sm">{focus.join(", ")}</span>
        </div>
        <div>
          <span className="text-slate-400 text-sm">Avg. Grant Size: </span>
          <span className="text-slate-200 text-sm">
            {formatCurrency(avgGrantSize)}
          </span>
        </div>
        <div>
          <span className="text-slate-400 text-sm">Key Priorities: </span>
          <span className="text-slate-200 text-sm">
            {keyPriorities.join(", ")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

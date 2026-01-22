import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RFPSection {
  id: string;
  name: string;
  wordLimit: number;
  currentWords: number;
  isComplete: boolean;
  isActive: boolean;
}

interface RFPRequirementsProps {
  sections: RFPSection[];
  onSectionClick: (sectionId: string) => void;
}

export function RFPRequirements({ sections, onSectionClick }: RFPRequirementsProps) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-100">
          RFP Requirements
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-700">
          {sections.map((section) => {
            const isOverLimit = section.currentWords > section.wordLimit;
            const wordCountColor = isOverLimit ? "text-red-400" : "text-emerald-400";

            return (
              <div
                key={section.id}
                onClick={() => onSectionClick(section.id)}
                className={`
                  flex items-center gap-4 px-6 py-4 cursor-pointer
                  transition-colors hover:bg-slate-700/30
                  ${section.isActive ? "bg-slate-700/50" : ""}
                `}
              >
                {/* Checkbox */}
                <div
                  className={`
                    flex items-center justify-center w-5 h-5 rounded border
                    ${
                      section.isComplete
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-slate-600 bg-slate-900"
                    }
                  `}
                >
                  {section.isComplete && (
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  )}
                </div>

                {/* Section Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {section.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {section.wordLimit.toLocaleString()} words
                  </p>
                </div>

                {/* Word Count Progress */}
                <div className="text-right">
                  <p className={`text-sm font-semibold ${wordCountColor}`}>
                    {section.currentWords.toLocaleString()}
                    <span className="text-slate-500">/</span>
                    {section.wordLimit.toLocaleString()}
                  </p>
                  <div className="mt-1 w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isOverLimit ? "bg-red-500" : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min((section.currentWords / section.wordLimit) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

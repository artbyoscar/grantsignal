"use client";

interface OutlineSection {
  id: string;
  number: number;
  title: string;
  completionPercent: number;
  isActive: boolean;
}

interface SectionOutlineProps {
  sections: OutlineSection[];
  onSectionClick: (sectionId: string) => void;
}

export function SectionOutline({ sections, onSectionClick }: SectionOutlineProps) {
  const getCompletionColor = (percent: number): string => {
    if (percent === 100) return "text-emerald-400";
    if (percent >= 50) return "text-blue-400";
    if (percent >= 25) return "text-amber-400";
    return "text-slate-500";
  };

  return (
    <div className="space-y-1">
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => onSectionClick(section.id)}
          className={`
            w-full text-left text-sm px-3 py-2 rounded-md
            transition-colors hover:bg-slate-800/50
            ${
              section.isActive
                ? "font-medium text-slate-100 border-l-2 border-blue-500 bg-slate-800/30"
                : "text-slate-400"
            }
          `}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="flex-1">
              {section.number}. {section.title}
            </span>
            <span className={`text-xs ${getCompletionColor(section.completionPercent)}`}>
              ({section.completionPercent}%)
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

interface WordCountProps {
  current: number;
  limit: number;
  showProgress?: boolean;
}

/**
 * Counts the number of words in a given text string
 * @param text - The text to count words in
 * @returns The number of words
 */
export function countWords(text: string): number {
  return text
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Displays word count with visual indicators
 * Color-coded based on progress:
 * - Under 80%: slate (neutral)
 * - 80-100%: emerald (on track)
 * - Over 100%: red (over limit)
 */
export function WordCount({ current, limit, showProgress = false }: WordCountProps) {
  const percentage = (current / limit) * 100;
  const progressWidth = Math.min(percentage, 100);

  // Determine color based on percentage
  const getColorClass = () => {
    if (percentage > 100) return "text-red-400";
    if (percentage >= 80) return "text-emerald-400";
    return "text-slate-400";
  };

  const getProgressColorClass = () => {
    return percentage > 100 ? "bg-red-500" : "bg-emerald-500";
  };

  // Format numbers with comma separators
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className="flex flex-col gap-1">
      <div className={`text-sm font-medium ${getColorClass()}`}>
        {formatNumber(current)} / {formatNumber(limit)} words
      </div>

      {showProgress && (
        <div className="h-1 rounded-full bg-slate-700 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getProgressColorClass()}`}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      )}
    </div>
  );
}

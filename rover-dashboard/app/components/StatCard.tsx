interface StatCardProps {
  label: string;
  value: string;
  subtitle: string;
  subtitleColor?: "success" | "warning" | "default";
}

export default function StatCard({
  label,
  value,
  subtitle,
  subtitleColor = "default",
}: StatCardProps) {
  const subtitleColorClass =
    subtitleColor === "success"
      ? "text-[var(--color-success)]"
      : subtitleColor === "warning"
      ? "text-[var(--color-warning)]"
      : "text-[var(--color-foreground)]";

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-md p-5 flex flex-col gap-2 h-[120px] shadow-sm">
      <div className="text-xs font-medium text-[var(--color-muted-foreground)]">
        {label}
      </div>
      <div className="text-4xl font-bold text-[var(--color-foreground)]">
        {value}
      </div>
      <div className={`text-xs ${subtitleColorClass}`}>{subtitle}</div>
    </div>
  );
}

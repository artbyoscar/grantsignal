interface Rover {
  name: string;
  type: string;
  dailyRate: string;
  features: string;
  status: "Available" | "Reserved";
}

const rovers: Rover[] = [
  {
    name: "Curiosity Plus",
    type: "Heavy Duty",
    dailyRate: "$450/day",
    features: "Sample collection, drill, 6 cameras",
    status: "Available",
  },
  {
    name: "Scout Mini",
    type: "Lightweight",
    dailyRate: "$180/day",
    features: "Fast recon, 2 cameras, terrain mapping",
    status: "Available",
  },
  {
    name: "Perseverance X",
    type: "Research",
    dailyRate: "$580/day",
    features: "Advanced lab, spectrometer, oxygen gen",
    status: "Reserved",
  },
  {
    name: "Spirit 2.0",
    type: "All-Terrain",
    dailyRate: "$320/day",
    features: "Rock analysis, panoramic camera",
    status: "Available",
  },
  {
    name: "Opportunity Max",
    type: "Endurance",
    dailyRate: "$395/day",
    features: "Extended battery, solar panels, GPS",
    status: "Available",
  },
];

export default function RoversTable() {
  return (
    <div className="border border-[var(--color-border)] rounded-md overflow-hidden">
      <table className="w-full">
        <thead className="bg-[var(--color-muted)] border-b border-[var(--color-border)]">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-foreground)] w-[200px]">
              Rover Name
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-foreground)] w-[120px]">
              Type
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-foreground)] w-[140px]">
              Daily Rate
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-foreground)]">
              Features
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-foreground)] w-[140px]">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-[var(--color-card)]">
          {rovers.map((rover, index) => (
            <tr
              key={index}
              className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-muted)]/30 transition-colors"
            >
              <td className="px-4 py-3 text-sm font-medium text-[var(--color-foreground)]">
                {rover.name}
              </td>
              <td className="px-4 py-3 text-sm text-[var(--color-foreground)]">
                {rover.type}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-[var(--color-foreground)]">
                {rover.dailyRate}
              </td>
              <td className="px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                {rover.features}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    rover.status === "Available"
                      ? "bg-[var(--color-success)]/20 text-[var(--color-success)]"
                      : "bg-[var(--color-warning)]/20 text-[var(--color-warning)]"
                  }`}
                >
                  {rover.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

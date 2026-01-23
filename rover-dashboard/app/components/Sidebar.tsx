"use client";

interface SidebarItemProps {
  icon: string;
  label: string;
  active?: boolean;
}

function SidebarItem({ icon, label, active = false }: SidebarItemProps) {
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 rounded-full cursor-pointer transition-colors ${
        active
          ? "bg-[var(--color-sidebar-accent)] text-[var(--color-sidebar-accent-foreground)]"
          : "text-[var(--color-sidebar-foreground)] hover:bg-[var(--color-sidebar-accent)]/50"
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-base">{label}</span>
    </div>
  );
}

function SidebarSectionTitle({ title }: { title: string }) {
  return (
    <div className="px-4 py-2 text-sm text-[var(--color-sidebar-foreground)]">
      {title}
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-60 h-screen bg-[var(--color-sidebar)] border-r border-[var(--color-sidebar-border)] flex flex-col">
      {/* Header */}
      <div className="h-22 flex items-center justify-center px-8 py-6 border-b border-[var(--color-sidebar-border)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[var(--color-primary)] rounded" />
          <span className="text-lg font-bold text-[var(--color-primary)]">
            LUNARIS
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        <SidebarSectionTitle title="Fleet Management" />
        <SidebarItem icon="📊" label="Dashboard" active />
        <SidebarItem icon="🚗" label="Available Rovers" />
        <SidebarItem icon="🧭" label="Active Missions" />
        <SidebarItem icon="🔧" label="Maintenance" />

        <div className="py-4">
          <SidebarSectionTitle title="Management" />
        </div>

        <SidebarItem icon="📈" label="Analytics" />
        <SidebarItem icon="📅" label="Bookings" />
        <SidebarItem icon="⚙️" label="Settings" />
      </nav>

      {/* Footer */}
      <div className="px-8 py-6 border-t border-[var(--color-sidebar-border)]">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="text-base text-[var(--color-sidebar-accent-foreground)]">
              Joe Doe
            </div>
            <div className="text-base text-[var(--color-sidebar-foreground)]">
              joe@acmecorp.com
            </div>
          </div>
          <span className="text-2xl text-[var(--color-sidebar-foreground)]">
            ▼
          </span>
        </div>
      </div>
    </aside>
  );
}

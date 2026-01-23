import Sidebar from "./components/Sidebar";
import StatCard from "./components/StatCard";
import RoversTable from "./components/RoversTable";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[var(--color-foreground)] mb-2">
            Rover Fleet Management
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Monitor and manage your Mars rover fleet
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Rovers"
            value="24"
            subtitle="+2 this month"
            subtitleColor="success"
          />
          <StatCard
            label="Active Missions"
            value="18"
            subtitle="75% utilization"
            subtitleColor="default"
          />
          <StatCard
            label="Available Now"
            value="6"
            subtitle="Ready to deploy"
            subtitleColor="success"
          />
          <StatCard
            label="Maintenance"
            value="3"
            subtitle="Scheduled repairs"
            subtitleColor="warning"
          />
        </div>

        {/* Table Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            Available Rovers for Rent
          </h2>
          <RoversTable />
        </div>
      </main>
    </div>
  );
}

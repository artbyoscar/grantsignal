# Rover Fleet Management Dashboard

A modern, dark-themed dashboard for managing Mars rover fleets built with Next.js, TypeScript, and Tailwind CSS v4.

## Features

- **Dark Mode UI** - Sleek dark theme with custom color palette
- **Sidebar Navigation** - Organized navigation for fleet management and general management
- **Statistics Overview** - Real-time stats for total rovers, active missions, availability, and maintenance
- **Rovers Table** - Comprehensive listing of available rovers with specs and pricing
- **Responsive Design** - Mobile-friendly layout that adapts to all screen sizes

## Tech Stack

- **Next.js 16** - React framework with App Router
- **React 19** - Latest React with Server Components
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first CSS framework with custom theme
- **pnpm** - Fast, disk space efficient package manager

## Getting Started

### Installation

```bash
cd rover-dashboard
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Build

```bash
pnpm build
```

### Production

```bash
pnpm start
```

## Project Structure

```
rover-dashboard/
├── app/
│   ├── components/
│   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   ├── StatCard.tsx      # Statistics card component
│   │   └── RoversTable.tsx   # Rovers data table
│   ├── globals.css           # Global styles and theme
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Dashboard page
├── package.json
├── tsconfig.json
├── next.config.ts
└── postcss.config.mjs
```

## Theme Customization

The color theme is defined in [globals.css](app/globals.css) using CSS custom properties. You can customize the colors by modifying the `@theme` section:

- `--color-background` - Main background color
- `--color-foreground` - Primary text color
- `--color-card` - Card background color
- `--color-primary` - Primary brand color
- `--color-success` - Success state color
- `--color-warning` - Warning state color
- And more...

## Design Replication

This dashboard replicates the "Step 3 Frame" design from the Pencil welcome file, featuring:
- Sidebar with LUNARIS branding
- Fleet Management navigation section (Dashboard, Available Rovers, Active Missions, Maintenance)
- Management section (Analytics, Bookings, Settings)
- 4 stat cards showing key metrics
- Data table with 5 rovers available for rent

## License

MIT

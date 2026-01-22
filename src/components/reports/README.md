# Reports Components

This directory contains chart and report components for the Reports page, built with Recharts.

## Components

### Chart Components

#### WinRateChart
Displays win rate trends over time as a line chart.
```tsx
<WinRateChart data={[
  { month: 'Jan', winRate: 45 },
  { month: 'Feb', winRate: 52 },
  // ...
]} />
```

#### FundingByProgramChart
Shows funding distribution across program areas as a donut chart.
```tsx
<FundingByProgramChart data={[
  { name: 'Education', value: 500000, count: 12 },
  { name: 'Healthcare', value: 750000, count: 8 },
  // ...
]} />
```

#### PipelineByStageChart
Displays pipeline value distribution by stage as a bar chart.
```tsx
<PipelineByStageChart data={[
  { stage: 'Discovery', value: 250000, count: 15 },
  { stage: 'Applied', value: 500000, count: 10 },
  // ...
]} />
```

#### TopFundersChart
Shows top funders by total funding as a horizontal bar chart.
```tsx
<TopFundersChart data={[
  { name: 'Foundation A', value: 1000000, count: 5 },
  { name: 'Foundation B', value: 750000, count: 8 },
  // ...
]} />
```

#### YoYComparisonChart
Compares current year vs previous year as a grouped bar chart.
```tsx
<YoYComparisonChart
  data={[
    { category: 'Q1', currentYear: 500000, previousYear: 450000 },
    { category: 'Q2', currentYear: 600000, previousYear: 550000 },
    // ...
  ]}
  currentYearLabel="2024"
  previousYearLabel="2023"
/>
```

### UI Components

#### ReportTypeCard
Card component for different report types with generate button.
```tsx
<ReportTypeCard
  title="Annual Report"
  description="Comprehensive annual funding summary"
  icon="file"
  lastGenerated={new Date('2024-01-15')}
  onGenerate={() => console.log('Generating report...')}
  isGenerating={false}
/>
```

## Design Tokens

All components use consistent design tokens matching the GrantSignal design system:

- Background: `bg-slate-800`
- Border: `border-slate-700`
- Text: `text-white`, `text-slate-400`, `text-slate-300`
- Hover: `hover:bg-slate-700/50`, `hover:border-slate-600`
- Primary color: `blue-500` / `blue-600`
- Success color: `emerald-400`
- Warning color: `rose-400`

## Color Palette

Charts use a consistent 10-color palette:
- Blue (#3b82f6)
- Purple (#a855f7)
- Emerald (#10b981)
- Amber (#f59e0b)
- Cyan (#06b6d4)
- Pink (#ec4899)
- Indigo (#6366f1)
- Rose (#f43f5e)
- Teal (#14b8a6)
- Orange (#f97316)

## Dependencies

- `recharts`: Chart library for React
- All components are client components (`'use client'`)
- Responsive design using `ResponsiveContainer`

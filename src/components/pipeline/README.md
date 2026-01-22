# Pipeline Components

Comprehensive pipeline management components for GrantSignal with Kanban board, list, and calendar views.

## Features

### ✅ Implemented

1. **Funder Logos** - Display funder logos on grant cards
2. **Progress Bars** - Show completion percentage for grants in Writing stage
3. **Avatar Assignments** - Display team member avatars on assigned grants
4. **Total Pipeline Value** - Header showing total value across all grants
5. **Filter Bar** - Filter by Funder, Program Area, Assignee, Deadline, Sort
6. **View Toggle** - Switch between Kanban, List, and Calendar views
7. **Column Collapse/Expand** - +/- buttons to collapse columns
8. **Drag and Drop** - Move grants between stages with visual feedback
9. **Priority Flags** - Flag high-priority grants
10. **Fit Scores** - Display AI-calculated fit scores on cards
11. **Deadline Tracking** - Color-coded deadline warnings

## Components

### PipelineKanban

Main kanban board component with drag-and-drop functionality.

```tsx
import { PipelineKanban } from '@/components/pipeline'

<PipelineKanban
  grants={grants}
  defaultView="kanban"
/>
```

**Props:**
- `grants: Grant[]` - Array of grant objects
- `defaultView?: 'kanban' | 'list' | 'calendar'` - Initial view mode (default: 'kanban')

### PipelineHeader

Header component displaying total pipeline value and view toggle.

```tsx
import { PipelineHeader } from '@/components/pipeline'

<PipelineHeader
  totalValue={1200000}
  grantCount={15}
  viewMode="kanban"
  onViewModeChange={(mode) => setViewMode(mode)}
/>
```

### PipelineFilters

Filter bar with dropdowns for various filter options.

```tsx
import { PipelineFilters } from '@/components/pipeline'

<PipelineFilters
  filters={filters}
  onFiltersChange={setFilters}
  grants={grants}
/>
```

### KanbanColumn

Individual column in the kanban board with collapse functionality.

```tsx
import { KanbanColumn } from '@/components/pipeline'

<KanbanColumn
  id={GrantStatus.WRITING}
  label="Writing"
  color="blue"
  description="Drafting proposal"
  count={5}
  isCollapsed={false}
  onToggleCollapse={() => {}}
>
  {/* Card components */}
</KanbanColumn>
```

### DraggableGrantCard & GrantCard

Grant cards with full feature set including logos, progress, and avatars.

```tsx
import { DraggableGrantCard, GrantCard } from '@/components/pipeline'

<DraggableGrantCard
  grant={grant}
  color="blue"
  progress={75}
  logoUrl="https://example.com/logo.png"
  isFlagged={false}
/>
```

## Design Tokens

### Colors

Status colors matched to grant stages:

- **Slate** (Prospect): `bg-slate-500`, `text-slate-400`
- **Purple** (Researching): `bg-purple-500`, `text-purple-400`
- **Blue** (Writing): `bg-blue-500`, `text-blue-400`
- **Amber** (Review): `bg-amber-500`, `text-amber-400`
- **Cyan** (Submitted): `bg-cyan-500`, `text-cyan-400`
- **Orange** (Pending): `bg-orange-500`, `text-orange-400`
- **Green** (Awarded): `bg-green-500`, `text-green-400`
- **Red** (Declined): `bg-red-500`, `text-red-400`

### Spacing & Sizing

- Card width: `320px` (w-80)
- Card padding: `16px` (p-4)
- Gap between columns: `16px` (gap-4)
- Border radius: `8px` (rounded-lg)
- Avatar size: `24px` (w-6 h-6)
- Logo size: `24px` (w-6 h-6)

### Typography

- Card title: `text-sm font-medium text-white`
- Amount: `text-lg font-semibold text-white`
- Labels: `text-xs text-slate-400`
- Deadline: Color-coded based on urgency

### Progress Bar

- Height: `4px` (h-1)
- Background: `bg-slate-700`
- Fill: Gradient `from-blue-500 to-blue-400`
- Transition: `duration-300`

## Usage Examples

### Basic Kanban View

```tsx
'use client'

import { PipelineKanban } from '@/components/pipeline'
import { api } from '@/lib/trpc/client'

export default function PipelinePage() {
  const { data: grants } = api.grants.list.useQuery()

  if (!grants) return <div>Loading...</div>

  return (
    <div className="h-screen">
      <PipelineKanban grants={grants} />
    </div>
  )
}
```

### With Custom Filters

```tsx
'use client'

import { useState } from 'react'
import { PipelineKanban } from '@/components/pipeline'
import type { FilterState } from '@/components/pipeline'

export default function PipelinePage() {
  const { data: grants } = api.grants.list.useQuery()
  const [filters, setFilters] = useState<FilterState>({
    funder: 'all',
    programArea: 'all',
    assignee: 'all',
    deadline: 'week',
    sortBy: 'deadline',
  })

  return (
    <PipelineKanban
      grants={grants || []}
    />
  )
}
```

## Roadmap

### Upcoming Features

- [ ] **List View** - Table view with sortable columns
- [ ] **Calendar View** - Calendar visualization of deadlines
- [ ] **Bulk Actions** - Select multiple grants for batch operations
- [ ] **Export** - Export filtered grants to CSV/Excel
- [ ] **Search** - Full-text search across grants
- [ ] **Custom Columns** - User-defined kanban columns
- [ ] **Swimlanes** - Group by program area or assignee
- [ ] **Card Templates** - Customizable card layouts
- [ ] **Quick Filters** - Saved filter presets
- [ ] **Timeline View** - Gantt chart for project planning

## Architecture

### State Management

- Local state for UI (view mode, collapsed columns)
- tRPC mutations for data updates
- Optimistic updates for better UX

### Drag and Drop

Built with `@dnd-kit/core` for:
- Touch support
- Keyboard accessibility
- Smooth animations
- Collision detection

### Performance

- Memoized calculations for filters
- Virtual scrolling for large lists (planned)
- Lazy loading of card images
- Debounced filter updates

## Accessibility

- Keyboard navigation support
- ARIA labels on interactive elements
- Screen reader friendly
- Focus management for modals
- Color contrast compliance (WCAG AA)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

# Fit Score Display Component

A comprehensive component for displaying opportunity fit scores with three variants optimized for different contexts.

## Component Location

[src/components/discovery/fit-score-card.tsx](./fit-score-card.tsx)

## Features

- **Three display variants**: mini (cards), compact (lists), and full (detail pages)
- **Color-coded scores**: Visual feedback with green (85+), blue (70-84), amber (50-69), red (<50)
- **Interactive tooltips**: Hover breakdowns for mini variant
- **Score recalculation**: Real-time refresh capability
- **Expandable sections**: Detailed reusable content information
- **Loading states**: Skeleton animations during calculation
- **Responsive design**: Adapts to different screen sizes

## Usage

### Import

```typescript
import { FitScoreCard } from '@/components/discovery'
```

### Props

```typescript
interface FitScoreCardProps {
  opportunityId: string              // Unique identifier for the opportunity
  variant?: 'full' | 'compact' | 'mini'  // Display variant (default: 'full')
  initialData?: FitScoreData        // Optional pre-loaded data
  onRecalculate?: () => void        // Callback when score is recalculated
}
```

### Data Structure

```typescript
interface FitScoreData {
  overallScore: number                    // 0-100
  missionScore: number                    // 0-100
  capacityScore: number                   // 0-100
  geographicScore?: number                // 0-100 (optional)
  historicalScore: number                 // 0-100
  reusableContentPercentage: number       // 0-100
  estimatedHours: number                  // Time estimate
  strengths: string[]                     // List of strengths
  concerns: string[]                      // List of concerns
  recommendations: string[]               // AI-generated tips
  reusableContentDetails?: Array<{        // Optional content breakdown
    sectionName: string
    hasContent: boolean
    suggestedSources: Array<{
      documentId: string
      documentName: string
      relevance: number                   // 0-1
    }>
  }>
}
```

## Variants

### 1. Mini Variant (Grid Cards)

Perfect for opportunity grids and card layouts.

**Usage:**
```tsx
<FitScoreCard
  opportunityId="opp_123"
  variant="mini"
  initialData={scoreData}
/>
```

**Features:**
- Circular progress indicator (64x64px)
- Score displayed in center
- Color-coded based on thresholds
- Detailed tooltip on hover showing:
  - Mission Alignment score
  - Capacity Match score
  - Geographic Fit score
  - Funder History score
  - Reusable Content percentage

**Best for:**
- Opportunity cards in grid view
- Dashboard widgets
- Quick visual scanning

---

### 2. Compact Variant (List Rows)

Optimized for table rows and list views.

**Usage:**
```tsx
<FitScoreCard
  opportunityId="opp_123"
  variant="compact"
  initialData={scoreData}
/>
```

**Features:**
- Overall score badge
- Estimated hours with clock icon
- Reusable content percentage
- "View Details" link

**Displays:**
```
[85 Fit] ⏱ 16h 📄 68% reusable   View Details →
```

**Best for:**
- Table rows
- List views
- Compact sidebars

---

### 3. Full Variant (Detail Pages)

Comprehensive view with all details and interactions.

**Usage:**
```tsx
<FitScoreCard
  opportunityId="opp_123"
  variant="full"
  initialData={scoreData}
  onRecalculate={() => console.log('Score recalculated')}
/>
```

**Features:**

#### Overall Score Circle
- Large 160x160px circular progress
- Animated on load
- Color-coded display

#### Score Breakdown Table
| Component | Score | Status |
|-----------|-------|--------|
| Mission Alignment | 85 | ✅ Excellent |
| Capacity Match | 72 | ⚠️ Good |
| Geographic Fit | 90 | ✅ Excellent |
| Funder History | 45 | ⚠️ Weak |
| Reusable Content | 68% | ⚠️ Good |

#### Reusable Content Details (Expandable)
- Section-by-section breakdown
- Content availability status
- Suggested source documents with relevance scores
- Clickable document links

#### Time Estimate Card
```
⏱ Estimated completion: 16 hours
Based on 68% reusable content from your document library
```

#### Recommendations Section
- AI-generated actionable tips
- Bulleted list format
- Tailored to opportunity specifics

#### Refresh Button
- "Refresh Score" with icon
- Loading state during calculation
- Updates all sections on completion

**Best for:**
- Opportunity detail pages
- Full-screen modals
- Comprehensive analysis views

## Color Coding

| Score Range | Color | Class | Status |
|-------------|-------|-------|--------|
| 85-100 | Green | `text-emerald-500` | Excellent |
| 70-84 | Blue | `text-blue-500` | Good |
| 50-69 | Amber | `text-amber-500` | Moderate |
| 0-49 | Red | `text-red-500` | Weak |

## Examples

### Example 1: Opportunity Grid Card

```tsx
import { FitScoreCard } from '@/components/discovery'

export function OpportunityCard({ opportunity }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h3>{opportunity.title}</h3>
      <p>{opportunity.funder}</p>

      <div className="mt-4">
        <FitScoreCard
          opportunityId={opportunity.id}
          variant="mini"
          initialData={opportunity.fitScore}
        />
      </div>
    </div>
  )
}
```

### Example 2: Opportunity List Row

```tsx
import { FitScoreCard } from '@/components/discovery'

export function OpportunityRow({ opportunity }) {
  return (
    <tr className="border-b border-slate-700">
      <td>{opportunity.title}</td>
      <td>{opportunity.deadline}</td>
      <td>
        <FitScoreCard
          opportunityId={opportunity.id}
          variant="compact"
          initialData={opportunity.fitScore}
        />
      </td>
    </tr>
  )
}
```

### Example 3: Opportunity Detail Page

```tsx
import { FitScoreCard } from '@/components/discovery'
import { useState } from 'react'

export function OpportunityDetailPage({ opportunityId }) {
  const [lastRecalculated, setLastRecalculated] = useState<Date>()

  return (
    <div className="max-w-4xl mx-auto">
      <h1>Opportunity Details</h1>

      <div className="mt-6">
        <FitScoreCard
          opportunityId={opportunityId}
          variant="full"
          onRecalculate={() => setLastRecalculated(new Date())}
        />
      </div>

      {lastRecalculated && (
        <p className="text-xs text-slate-500 mt-2">
          Last updated: {lastRecalculated.toLocaleString()}
        </p>
      )}
    </div>
  )
}
```

### Example 4: With Dynamic Data Loading

```tsx
import { FitScoreCard } from '@/components/discovery'
import { api } from '@/lib/trpc/client'

export function OpportunityWithScore({ opportunityId }) {
  // TODO: Once getFitScore query is implemented
  // const { data: scoreData } = api.discovery.getFitScore.useQuery({
  //   opportunityId
  // })

  return (
    <FitScoreCard
      opportunityId={opportunityId}
      variant="full"
      // initialData={scoreData} // Uncomment when query is ready
    />
  )
}
```

## Implementation Notes

### API Integration

The component currently uses `api.discovery.calculateFitScore.useMutation()` for recalculation.

**TODO:** Create a query endpoint for fetching scores:

```typescript
// In src/server/routers/discovery.ts
export const discoveryRouter = createTRPCRouter({
  // ... existing endpoints

  getFitScore: publicProcedure
    .input(z.object({ opportunityId: z.string() }))
    .query(async ({ input }) => {
      // Fetch and return fit score data for opportunity
      return await db.fitScore.findUnique({
        where: { opportunityId: input.opportunityId }
      })
    }),
})
```

Once implemented, uncomment the query usage in the component:

```typescript
// In fit-score-card.tsx
const { data, isLoading, refetch } = api.discovery.getFitScore.useQuery({
  opportunityId
})
```

### Styling

The component follows the existing dark theme pattern:
- Background: `bg-slate-800`, `bg-slate-900/50`
- Borders: `border-slate-700`
- Text: `text-white`, `text-slate-300`, `text-slate-400`
- Accents: Score-based colors (emerald, blue, amber, red)

### Performance

- Uses CSS transitions for smooth animations
- Lazy loading of expanded sections
- Skeleton states prevent layout shift
- Memoized color calculations

### Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly tooltips
- Color is not the only indicator (icons + text labels)

## Dependencies

- `@/components/ui/tooltip` - Hover tooltips
- `@/components/ui/badge` - Score badges
- `@/components/ui/card` - Card container
- `@/components/ui/button` - Action buttons
- `lucide-react` - Icons
- `@/lib/trpc/client` - API integration
- `@/lib/utils` - Utility functions (cn)

## Future Enhancements

- [ ] Add export to PDF functionality
- [ ] Include historical score tracking chart
- [ ] Add comparison with similar opportunities
- [ ] Include confidence intervals for scores
- [ ] Add drill-down analytics for each score component
- [ ] Support custom scoring weights
- [ ] Add A/B testing for score thresholds

## Related Components

- [Confidence Indicator](../writing/confidence-indicator.tsx) - Similar score display pattern
- [Stat Card](../dashboard/stat-card.tsx) - Dashboard metric display
- [Peer Intelligence Widget](../funders/peer-intelligence-widget.tsx) - Multi-metric layout

## Support

For questions or issues with this component, please refer to:
- [Component source](./fit-score-card.tsx)
- [Discovery router](../../server/routers/discovery.ts)
- [Design system documentation](../ui/README.md)

# GrantSignal UI Specification Document
## Design System Reference for Claude Code

**Version:** 1.0  
**Date:** January 2026  
**Source:** 41 Gemini-generated mockups  
**Purpose:** Definitive reference for frontend implementation and UI refinement

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Global Design Tokens](#global-design-tokens)
3. [Typography Scale](#typography-scale)
4. [Color System](#color-system)
5. [Spacing System](#spacing-system)
6. [Component Specifications](#component-specifications)
7. [Page-by-Page Specifications](#page-by-page-specifications)
8. [Interaction Patterns](#interaction-patterns)
9. [Responsive Breakpoints](#responsive-breakpoints)
10. [Implementation Checklist](#implementation-checklist)

---

## Design Philosophy

### Core Principles

1. **Information Density**: Bloomberg Terminal aesthetic. Pack more data into less space without sacrificing readability. Nonprofit development directors need to see their entire portfolio at a glance.

2. **Compact Components**: Elements should be noticeably smaller than typical SaaS defaults. Think "professional trading terminal" not "consumer app."

3. **Dark Mode First**: Deep navy backgrounds (slate-900/950) with electric blue accents. Light text on dark surfaces.

4. **Purposeful Whitespace**: Tight internal padding, generous separation between logical groups. Space should guide the eye, not fill emptiness.

5. **Data Forward**: Numbers, metrics, and status indicators take visual priority. Labels and descriptions recede.

### What to Avoid

- Oversized cards with excessive padding
- Giant headlines that waste vertical space
- Single-purpose screens (combine related data)
- Touch-target sizing on desktop (this is a power-user tool)
- Excessive border-radius (keep it professional)

---

## Global Design Tokens

### Tailwind Configuration Overrides

```javascript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      fontSize: {
        'xs': ['11px', '14px'],
        'sm': ['12px', '16px'],
        'base': ['13px', '18px'],
        'lg': ['14px', '20px'],
        'xl': ['16px', '22px'],
        '2xl': ['18px', '24px'],
        '3xl': ['22px', '28px'],
        '4xl': ['28px', '34px'],
      },
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '12px',
      }
    }
  }
}
```

---

## Typography Scale

### Font Family
- **Primary**: Inter (fallback: system-ui, sans-serif)
- **Monospace**: JetBrains Mono (for code, IDs, numbers in tables)

### Hierarchy

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Page Title | 22px | 600 | 28px | Main page headers only |
| Section Header | 16px | 600 | 22px | Card titles, panel headers |
| Subsection | 14px | 600 | 20px | Widget titles, group labels |
| Body | 13px | 400 | 18px | Default text, descriptions |
| Body Small | 12px | 400 | 16px | Secondary info, metadata |
| Caption | 11px | 400 | 14px | Timestamps, hints, labels |
| Micro | 10px | 500 | 12px | Badges, status indicators |

### Text Colors (Dark Mode)

| Role | Color | Tailwind Class |
|------|-------|----------------|
| Primary | #F8FAFC | text-slate-50 |
| Secondary | #94A3B8 | text-slate-400 |
| Tertiary | #64748B | text-slate-500 |
| Muted | #475569 | text-slate-600 |
| Link | #3B82F6 | text-blue-500 |
| Link Hover | #60A5FA | text-blue-400 |

---

## Color System

### Background Layers

| Layer | Color | Tailwind | Usage |
|-------|-------|----------|-------|
| Base | #0F172A | bg-slate-900 | Page background |
| Elevated | #1E293B | bg-slate-800 | Cards, panels |
| Surface | #334155 | bg-slate-700 | Inputs, hover states |
| Overlay | #1E293B/95 | bg-slate-800/95 | Modals, dropdowns |

### Accent Colors

| Purpose | Color | Tailwind | Usage |
|---------|-------|----------|-------|
| Primary Action | #3B82F6 | bg-blue-500 | Primary buttons, active states |
| Primary Hover | #2563EB | bg-blue-600 | Button hover |
| Success | #10B981 | text-emerald-500 | Awarded, completed, positive |
| Warning | #F59E0B | text-amber-500 | Pending, deadlines approaching |
| Danger | #EF4444 | text-red-500 | Declined, overdue, errors |
| Info | #06B6D4 | text-cyan-500 | Submitted, in progress |

### Pipeline Stage Colors

| Stage | Background | Text | Border |
|-------|------------|------|--------|
| Prospect | slate-700 | slate-300 | slate-600 |
| Researching | purple-900/50 | purple-300 | purple-700 |
| Writing | blue-900/50 | blue-300 | blue-700 |
| Review | amber-900/50 | amber-300 | amber-700 |
| Submitted | cyan-900/50 | cyan-300 | cyan-700 |
| Pending | orange-900/50 | orange-300 | orange-700 |
| Awarded | emerald-900/50 | emerald-300 | emerald-700 |
| Declined | red-900/50 | red-300 | red-700 |

---

## Spacing System

### Component Internal Padding

| Component | Padding | Tailwind |
|-----------|---------|----------|
| Card | 12px | p-3 |
| Card Compact | 8px | p-2 |
| Button Large | 8px 16px | px-4 py-2 |
| Button Default | 6px 12px | px-3 py-1.5 |
| Button Small | 4px 8px | px-2 py-1 |
| Input | 6px 10px | px-2.5 py-1.5 |
| Table Cell | 8px 12px | px-3 py-2 |
| Badge | 2px 6px | px-1.5 py-0.5 |

### Layout Gaps

| Context | Gap | Tailwind |
|---------|-----|----------|
| Page sections | 24px | gap-6 |
| Cards in grid | 16px | gap-4 |
| Items in card | 12px | gap-3 |
| Form fields | 12px | gap-3 |
| Inline items | 8px | gap-2 |
| Tight groups | 4px | gap-1 |

---

## Component Specifications

### Sidebar Navigation

```
Width: 200px expanded, 56px collapsed
Background: slate-900
Border-right: 1px slate-800

Nav Item:
- Height: 36px
- Padding: 8px 12px
- Border-radius: 6px
- Icon: 18px, slate-400
- Text: 13px, slate-300
- Active: bg-blue-600/20, text-blue-400, icon blue-400
- Hover: bg-slate-800

Logo Section:
- Height: 48px
- Padding: 12px
- Logo mark: 24px
- Text: 16px semibold

User Section (bottom):
- Height: 56px
- Avatar: 32px
- Name: 13px semibold
- Role badge: 10px
```

### Stat Cards (Dashboard)

```
Layout: 4 columns, equal width
Height: 80px (not 120px)
Padding: 12px
Border-radius: 8px
Background: slate-800
Border: 1px slate-700

Label: 11px, slate-400, uppercase tracking-wide
Value: 28px, semibold, slate-50
Trend: 11px, with arrow icon 12px
Sparkline: 48px wide, 24px tall, right-aligned
```

### Pipeline Kanban Cards

```
Width: 260px (column 280px with padding)
Padding: 10px
Border-radius: 6px
Background: slate-800
Border-left: 3px (stage color)

Funder Logo: 32px, border-radius 4px
Funder Name: 12px semibold, slate-200
Grant Title: 13px, slate-300, max 2 lines, truncate
Amount: 14px semibold, slate-100
Deadline Badge: 10px, pill shape
Progress Bar: 4px height, full width
Assignee Avatar: 24px, bottom-right
```

### Pipeline Column Headers

```
Background: transparent
Padding: 8px 0
Margin-bottom: 8px

Stage Name: 13px semibold
Count Badge: 10px, bg-slate-700, min-width 20px
Collapse/Expand: 16px icon
Add Button: 16px icon, appears on hover
```

### Data Tables

```
Header Row:
- Background: slate-800
- Height: 36px
- Text: 11px, uppercase, tracking-wide, slate-400
- Padding: 8px 12px
- Border-bottom: 1px slate-700

Body Row:
- Height: 44px
- Text: 13px
- Padding: 8px 12px
- Border-bottom: 1px slate-800
- Hover: bg-slate-800/50

Status Badges in Tables:
- Height: 20px
- Padding: 2px 8px
- Font: 10px semibold
- Border-radius: 10px (pill)
```

### Buttons

```
Primary:
- Background: blue-500
- Hover: blue-600
- Text: white, 13px semibold
- Height: 32px (default), 28px (small), 36px (large)
- Border-radius: 6px
- Shadow: none

Secondary:
- Background: slate-700
- Hover: slate-600
- Border: 1px slate-600
- Text: slate-200

Ghost:
- Background: transparent
- Hover: slate-800
- Text: slate-300

Danger:
- Background: red-600
- Hover: red-700
- Text: white
```

### Form Inputs

```
Height: 32px
Padding: 6px 10px
Background: slate-800
Border: 1px slate-700
Border-radius: 6px
Text: 13px, slate-100
Placeholder: slate-500

Focus:
- Border: blue-500
- Ring: 2px blue-500/20

Label:
- Size: 12px
- Color: slate-400
- Margin-bottom: 4px
```

### Badges & Status Pills

```
Default Badge:
- Height: 18px
- Padding: 2px 6px
- Font: 10px semibold
- Border-radius: 4px

Status Pill:
- Height: 20px
- Padding: 2px 8px
- Font: 10px semibold
- Border-radius: 10px (full)

Count Badge:
- Min-width: 18px
- Height: 18px
- Border-radius: 9px
- Font: 10px semibold
- Center aligned
```

### Modals & Dialogs

```
Overlay: slate-900/80, backdrop-blur-sm
Container: 
- Background: slate-800
- Border: 1px slate-700
- Border-radius: 12px
- Shadow: xl
- Max-width: 480px (small), 640px (medium), 800px (large)

Header:
- Padding: 16px
- Border-bottom: 1px slate-700
- Title: 16px semibold
- Close button: 32px, top-right

Body:
- Padding: 16px

Footer:
- Padding: 12px 16px
- Border-top: 1px slate-700
- Buttons right-aligned, gap-2
```

### Tooltips

```
Background: slate-700
Border: 1px slate-600
Border-radius: 6px
Padding: 6px 10px
Text: 12px, slate-200
Max-width: 240px
Shadow: lg
Arrow: 6px
```

### Dropdown Menus

```
Background: slate-800
Border: 1px slate-700
Border-radius: 8px
Shadow: xl
Padding: 4px
Min-width: 180px

Menu Item:
- Height: 32px
- Padding: 6px 10px
- Text: 13px
- Border-radius: 4px
- Hover: bg-slate-700

Separator:
- Height: 1px
- Background: slate-700
- Margin: 4px 0
```

### Charts & Visualizations

```
Line Charts:
- Stroke width: 2px
- Point radius: 3px
- Grid: slate-700, dashed
- Axis labels: 10px, slate-500

Bar Charts:
- Border-radius: 4px top
- Gap: 4px
- Hover: 10% lighter

Pie/Donut Charts:
- Stroke width: 0
- Inner radius (donut): 60%
- Legend: right side, 11px

Sparklines:
- Height: 24px
- Stroke: 1.5px
- No axes, no labels
- Area fill: 10% opacity
```

### Fit Score Circles

```
Size: 48px (compact), 64px (standard), 80px (large)
Stroke width: 4px
Track color: slate-700
Progress color: Based on score
  - 80-100: emerald-500
  - 60-79: blue-500
  - 40-59: amber-500
  - 0-39: red-500
Center text: Score number, 16px semibold
Label below: "Fit" or "/100", 10px slate-400
```

---

## Page-by-Page Specifications

### Dashboard

**Layout**: 
- Main content: 3-column grid for stats, 2-column for widgets
- Right sidebar: 280px fixed width for AI Digest + Quick Actions

**Components**:

1. **Stats Row** (4 cards)
   - Active Grants: count + trend
   - Pending Decisions: count
   - YTD Awarded: currency + trend
   - Win Rate: percentage + trend
   - Each with mini sparkline

2. **Urgent Actions Panel**
   - Red/amber left border based on urgency
   - Max 5 visible items
   - Each item: icon + description + days/action button
   - "Learn Grant Links" expandable

3. **Pipeline Summary**
   - Horizontal stacked bar
   - Color-coded segments
   - Legend below: stage name + count
   - Click segment to filter pipeline

4. **Recent Activity Feed**
   - Avatar (24px) + action text + timestamp
   - Max 5-6 visible
   - Relative timestamps ("2 hours ago")

5. **AI Daily Digest** (sidebar)
   - Blue left border accent
   - Bullet points with insight summaries
   - "Learn more" expandable

6. **Quick Actions** (sidebar)
   - 4 action buttons, stacked vertically
   - Icon + label format
   - Full width within sidebar

### Pipeline (Kanban)

**Layout**: 
- Toolbar: fixed top, 48px height
- Board: horizontal scroll, full height minus toolbar

**Toolbar**:
- View toggle: Kanban | List | Calendar (segmented control)
- Filters: Funder, Program Area, Assignee, Deadline (dropdowns)
- Sort dropdown
- Total Pipeline Value display (right side)
- Add Grant button (primary, right side)

**Columns**:
- 280px width each
- 12px gap between columns
- Header: stage name, count, collapse/add icons
- Scrollable card area
- Drop zone highlight on drag

**Cards**: See component spec above

**Drag Behavior**:
- Lift: scale(1.02), shadow-xl, rotate(2deg)
- Placeholder: dashed border, slate-700 bg
- Drop zone: column header highlights

### Grant Detail

**Layout**: 
- Header section: breadcrumb + title + actions
- Tab navigation below header
- Two-column content: main (65%) + sidebar (35%)

**Header**:
- Breadcrumb: Pipeline > Funder Name
- Title: Grant name + status badge (editable)
- Meta: Requested amount + Deadline
- Actions: Edit, Open Writer, Archive

**Tabs**: Overview | Application | Documents | Compliance | Notes & Activity

**Overview Tab - Main Column**:
1. Grant Summary timeline (horizontal progress)
2. Team Assignments (avatar + name + role pills)
3. Related Documents (file icons + names + actions)
4. Activity Log (timeline format)

**Overview Tab - Sidebar**:
1. Days Until Deadline (large number)
2. Fit Score (circular gauge + breakdown)
3. Similar Past Applications (links)
4. Funder Contact info
5. AI Suggestions panel

### AI Writer

**Layout**: Three-panel, resizable

**Left Panel (280px)**:
- RFP Requirements section
  - Parsed sections with checkboxes
  - Word count progress for each
- Memory Assist section
  - Search input
  - Source cards with relevance scores
  - Insert buttons
- Funder Intelligence section
  - Quick facts list

**Center Panel (flexible)**:
- Rich text editor toolbar
  - Font controls: B, I, U, S
  - Heading levels: H1, H2, H3
  - Lists, links, images
  - AI actions: Generate, Improve, Expand, Shorten
- Editor area with blue highlight for AI-generated text
- AI toolbar at bottom
  - Input: "Ask Claude anything..."
  - Quick actions: Suggest Improvements, Check Tone, Find Statistics
  - Streaming indicator

**Right Panel (240px)**:
- Section Outline
  - Numbered sections with completion %
  - Click to navigate
- Word count total

### Documents Library

**Layout**: Three-panel

**Left Panel (220px)**:
- Folder tree
  - Proposals, Reports, Budgets, etc.
  - Expandable with counts
- Document Type filter tabs

**Center Panel (flexible)**:
- Search bar with semantic/keyword toggle
- Filter chips: Document Type, Date Range, Program, Funder
- Card grid (3 columns)
  - File type icon
  - Filename (truncated)
  - Type badge
  - Upload date
  - Tag pills
  - Processing status indicator
  - Hover: action menu

**Right Panel (300px, conditional)**:
- Document preview
- Copy Selection / Open in New Tab buttons
- Page navigation
- Thumbnail strip

**Upload Zone**:
- Dashed border
- Icon + "Drop files here to upload"
- Supported formats text

### Calendar

**Layout**: 
- Toolbar: View toggle + Month navigation + Filters
- Main: Calendar grid
- Sidebar: Upcoming Deadlines (280px)

**Month View**:
- 7-column grid
- Day cells: number top-left, events stacked
- Event pills: color by type, truncated text
- "+3 more" overflow indicator
- Hover popover with full details

**Event Popover**:
- Grant name
- Funder
- Details text
- Status badge
- Action links

**Sidebar - Upcoming Deadlines**:
- Next 14 days
- List items: name + days badge (color-coded)
- Create new event button
- Export to iCal button

### Reports & Analytics

**Layout**: Dashboard grid

**Top Row**:
- Date range selector (right aligned)
- Quick filters: Last 30 Days, Last 90 Days, Year to Date, Last Year, Custom

**Charts Row 1** (2 columns):
1. Win Rate Over Time
   - Line chart
   - Current value callout
2. Funding by Program Area
   - Donut chart
   - Legend with percentages

**Charts Row 2** (3 columns):
1. Pipeline Value by Stage
   - Horizontal funnel/stacked bar
   - Total at bottom
2. Top Funders
   - Horizontal bar chart
   - Funder name + amount
3. Year-over-Year Comparison
   - Grouped bar chart
   - Legend: Last Year vs Current Year

**Report Types Section**:
- 5 cards in row
- Icon + Title + Description + Generate button
- Types: Executive Summary, Pipeline Report, Historical Analysis, Funder Report, Compliance Report

**Footer**:
- Export options: PDF, Excel, PowerPoint (icon buttons)

### Compliance Guardian

**Layout**: Three-column

**Left Column (45%)**:
- Commitment Registry table
- Columns: Description, Grant Name, Funder, Due Date, Status
- Filters inline in header
- Pagination

**Center Column (30%)**:
- Conflict Detection panel
- Severity-coded items (High/Medium/Low)
- Each: Title + Description + Source links
- Action buttons: Side-by-side Comparison, Resolve

**Right Column (25%)**:
- Audit Trail
- Search input
- Timeline items: timestamp + avatar + action
- Grouped by date

**Resolution Modal**:
- Side-by-side comparison
- Highlighted differences
- Radio selection
- Resolution notes textarea
- Risk assessment callout
- Confirm/Cancel buttons

### Team Management

**Layout**: 
- Member cards grid (top)
- Analytics panels (bottom, 2 columns)

**Member Cards**:
- 4 per row
- Avatar (48px) + Name + Email
- Role badge
- Last active
- Assigned grants count
- Action menu (three dots)

**Invite Modal**:
- Email input
- Role dropdown
- Personal message textarea
- Send Invite button

**Workload Distribution**:
- Horizontal bar chart
- Name + bar + count

**Recent Activity by Member**:
- List with avatar + action

**Role Permissions Matrix**:
- Table: Capability vs Role
- Checkmarks/X marks

**Pending Invites**:
- List with email + sent date
- Resend/Cancel actions

### Settings Pages

**Layout**: Sidebar navigation (200px) + Content area

**Settings Nav Items**:
- Organization
- Integrations
- Notifications
- Billing

**Organization Settings**:
- Logo upload (circular preview)
- Text fields: Name, EIN, Website, Address
- Mission statement textarea
- Fiscal year dropdown
- Programs list with Edit/Delete
- Default templates dropdown
- Save Changes button (sticky bottom)

**Integrations**:
- Grouped sections: Cloud Storage, CRM, Calendar, Grant Portals
- Integration cards: Logo + Name + Status badge + Description + Connect/Disconnect button
- API Access section: Key (masked), Regenerate button, Usage chart
- Webhook Configuration: URL input, Event checkboxes, Save button

**Notifications**:
- Two columns: Email + In-App/Push
- Toggle switches for each type
- Deadline Alert Threshold slider
- Daily Digest time picker
- Frequency radio group
- Quiet Hours toggle + time pickers
- Test Notification button

**Billing**:
- Current Plan card with features
- Usage This Month (progress bars)
- Payment Method card
- Invoice History table
- Upgrade banner

### Authentication Pages

**Sign In**:
- Centered card (400px max)
- Logo + "Sign in to your account"
- Email input
- Password input with toggle visibility
- Remember me checkbox + Forgot password link
- Sign In button (primary, full width)
- Divider: "Or continue with"
- Social buttons: Google, Microsoft
- SSO Login link
- Create account link
- Security badge at bottom

**Sign Up**:
- Similar layout
- Additional fields: Full Name, Organization Name, Confirm Password
- Password strength indicator
- Terms checkbox
- Trial info callout (left side on larger screens)

**Password Reset**:
- Three states: Request, Email Sent, Create New
- Minimal inputs
- Back to sign in links

### Onboarding Flow

**Welcome Screen**:
- Centered content
- Logo large
- "Welcome to GrantSignal" heading
- Personalized greeting
- Value prop text
- Illustration
- Progress dots (1 of 6)
- Get Started button + Skip link

**Connect Documents** (Step 3):
- Cloud provider cards (4 across)
- "Most popular" badge on Google Drive
- Connected state: folder browser
- Import preview panel: count, progress bar, current file

### Empty States

**Pipeline Empty**:
- Illustration (kanban outline)
- "Your pipeline is empty"
- Subtext
- Two CTAs: Add First Grant (primary), Browse Opportunities (secondary)
- Tip text

**General Pattern**:
- Relevant illustration
- Clear headline
- Helpful subtext
- Primary action
- Secondary action (optional)

### Error Pages

**404**:
- Large "404" text (semi-transparent)
- "Page not found" heading
- Description
- Search input
- Quick links row
- Go to Dashboard button
- Report issue link

---

## Interaction Patterns

### Drag and Drop (Pipeline)

```
onDragStart:
- Scale card to 1.02
- Add shadow-xl
- Slight rotation (2deg)
- Reduce opacity of original position

onDragOver:
- Highlight valid drop zones
- Show insertion indicator
- Animate other cards to make space

onDrop:
- Optimistic UI update (instant)
- API call in background
- Show undo toast (5 seconds)
- On error: revert + error toast
```

### Optimistic Updates

```
1. Update UI immediately
2. Fire API request
3. On success: no visible change
4. On error: 
   - Revert UI state
   - Show error toast with retry option
```

### Loading States

```
Skeleton Patterns:
- Cards: rounded rectangles matching card dimensions
- Tables: row skeletons with varying widths
- Text: line skeletons at 60%, 80%, 40% widths
- Charts: chart container with pulsing background

Animation:
- Pulse animation: opacity 50% to 100%
- Duration: 1.5s
- Ease: ease-in-out
```

### Toast Notifications

```
Position: bottom-right
Width: 360px
Duration: 5000ms (auto-dismiss)
Types:
- Success: emerald left border
- Error: red left border
- Warning: amber left border
- Info: blue left border

Structure:
- Icon (20px)
- Title (13px semibold)
- Message (12px)
- Action button (optional)
- Dismiss X
```

### Command Palette (Cmd+K)

```
Trigger: Cmd+K or Ctrl+K
Width: 560px
Max-height: 400px

Sections:
1. Recent (3 items)
2. Navigation (with shortcuts)
3. Actions (with shortcuts)

Item:
- Icon + Label + Shortcut badge
- Arrow keys to navigate
- Enter to select

Search:
- Fuzzy matching
- Highlight matches
- Filter as you type
```

---

## Responsive Breakpoints

| Breakpoint | Width | Adaptations |
|------------|-------|-------------|
| sm | 640px | Mobile: stack columns, bottom nav, hide sidebar |
| md | 768px | Tablet: collapsible sidebar (56px), 2-column grids |
| lg | 1024px | Desktop: full sidebar, 3-column grids |
| xl | 1280px | Large desktop: expanded panels, 4-column grids |
| 2xl | 1536px | Extra large: maximum content width 1400px |

### Mobile Navigation

- Bottom tab bar (fixed)
- 5 primary items: Dashboard, Pipeline, Calendar, Documents, More
- "More" opens drawer with full navigation
- Hamburger menu for secondary access

---

## Implementation Checklist

### Global CSS Changes

```css
/* globals.css additions */

:root {
  --font-size-base: 13px;
  --spacing-unit: 4px;
  --card-padding: 12px;
  --button-height: 32px;
  --input-height: 32px;
  --sidebar-width: 200px;
  --sidebar-collapsed: 56px;
}

/* Tighten default component spacing */
.card {
  @apply p-3;
}

.btn {
  @apply h-8 px-3 py-1.5 text-[13px];
}

.btn-sm {
  @apply h-7 px-2 py-1 text-xs;
}

.input {
  @apply h-8 px-2.5 py-1.5 text-[13px];
}

/* Table density */
.table th {
  @apply h-9 px-3 py-2 text-[11px] uppercase tracking-wide;
}

.table td {
  @apply h-11 px-3 py-2 text-[13px];
}
```

### Component Priority Fixes

1. **Sidebar** - Reduce nav item height to 36px
2. **Stat Cards** - Reduce height to 80px, tighten padding
3. **Pipeline Cards** - Reduce to 260px width, 10px padding
4. **Tables** - Implement compact row heights
5. **Buttons** - Standardize to 32px height
6. **Badges** - Reduce to 18-20px height
7. **Modals** - Tighten header/footer padding
8. **Forms** - Reduce input heights to 32px

### Page-Specific Fixes

1. **Dashboard**
   - Implement 4-column stat row
   - Add sparklines to stat cards
   - Fix urgent actions panel styling
   - Add AI Daily Digest sidebar

2. **Pipeline**
   - Fix drag-drop collision detection
   - Reduce card dimensions
   - Add progress bars to Writing stage cards
   - Implement proper drop zone highlighting

3. **Reports**
   - Fix "Declined" badge sizing (should match others)
   - Implement proper chart sizing
   - Add funnel visualization for pipeline
   - Fix YoY comparison chart

4. **Documents**
   - Add delete action to document cards
   - Fix pending status (processing pipeline)
   - Implement folder tree navigation
   - Add document preview panel

---

## File Structure Reference

```
src/
├── styles/
│   ├── globals.css          # Design tokens, base styles
│   └── components.css       # Component-specific overrides
├── components/
│   ├── ui/                  # shadcn/ui customized
│   │   ├── button.tsx       # Height: 32px default
│   │   ├── card.tsx         # Padding: 12px
│   │   ├── input.tsx        # Height: 32px
│   │   ├── badge.tsx        # Height: 18px
│   │   └── ...
│   ├── layout/
│   │   ├── sidebar.tsx      # 200px width
│   │   ├── header.tsx       # 48px height
│   │   └── shell.tsx
│   ├── dashboard/
│   │   ├── stat-card.tsx    # 80px height
│   │   ├── urgent-actions.tsx
│   │   ├── pipeline-summary.tsx
│   │   └── activity-feed.tsx
│   ├── pipeline/
│   │   ├── kanban-board.tsx
│   │   ├── kanban-column.tsx
│   │   ├── pipeline-card.tsx # 260px width
│   │   └── card-drag-overlay.tsx
│   └── ...
```

---

## Notes for Claude Code

1. **Start with design tokens**: Update tailwind.config.ts and globals.css first. This cascades to all components.

2. **Use exact pixel values**: The mockups show specific dimensions. Match them precisely.

3. **Test at 1440px width**: This is the primary design target. Ensure nothing breaks.

4. **Dark mode only for MVP**: Do not implement light mode switching yet.

5. **Prioritize feel over features**: A tight, professional UI with fewer features beats a bloated UI with everything.

6. **Reference mockup numbers**: When implementing, cross-reference the mockup number (1-41) for visual verification.

---

*End of Specification Document*

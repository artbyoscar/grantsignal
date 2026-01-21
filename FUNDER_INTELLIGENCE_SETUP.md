# Funder Intelligence with ProPublica 990 Integration

This document describes the new Funder Intelligence feature that provides deep insights into foundation funders using ProPublica's 990 API.

## Features Implemented

### 1. ProPublica 990 Sync Service
**Location:** [src/server/services/discovery/propublica.ts](src/server/services/discovery/propublica.ts)

- Fetches funder data from ProPublica Nonprofit Explorer API
- Parses 990 filings to extract financial data
- Calculates grant size statistics from past grantees
- Parses NTEE codes to categorize funders by program area

Key functions:
- `fetchFunder990(ein: string)` - Get organization and filing data
- `fetchFunderFilings(ein: string)` - Get Schedule I grantee data (placeholder for future PDF parsing)
- `calculateGrantSizeStats(grantees)` - Compute min/max/median/average grant sizes
- `parseNTEECode(nteeCode)` - Convert NTEE codes to readable categories

### 2. Enhanced Database Schema
**Location:** [prisma/schema.prisma](prisma/schema.prisma)

Added fields to Funder model:
- `mission` - Foundation mission statement
- `city`, `state` - Geographic location
- `nteeCode` - National Taxonomy of Exempt Entities classification
- `programAreas` - JSON array of focus areas
- `geographicFocus` - JSON array of geographic preferences
- `applicationProcess` - Application instructions
- `applicationDeadline` - Deadline information
- `contactInfo` - JSON with email, phone, address
- `historicalData` - JSON with 5-year giving trends

### 3. Inngest Background Job
**Location:** [src/inngest/functions/sync-funder-990.ts](src/inngest/functions/sync-funder-990.ts)

Automated workflow that:
1. Fetches 990 data from ProPublica API
2. Retrieves Schedule I past grantee data
3. Calculates grant size statistics
4. Parses NTEE codes
5. Updates funder record in database
6. Stores past grantees for peer intelligence

Triggered by event: `funder/sync-990`

### 4. Funder API Router
**Location:** [src/server/routers/funders.ts](src/server/routers/funders.ts)

tRPC procedures:
- `getById` - Get full funder profile with related data
- `search` - Search funders by name, EIN, or location
- `list` - Paginated funder listing with filters
- `create` - Create new funder and trigger 990 sync
- `update` - Update funder information
- `sync990` - Manually trigger 990 data refresh
- `getPeerIntelligence` - Get organizations similar to yours that received grants
- `getGivingHistory` - Get 5-year giving trends and historical filings

### 5. Funder Profile Page
**Location:** [src/app/(dashboard)/opportunities/funders/[id]/page.tsx](src/app/(dashboard)/opportunities/funders/[id]/page.tsx)

Comprehensive funder profile with 5 tabs:

#### Overview Tab
- Mission statement
- Program areas and geographic focus
- Key financial metrics (assets, giving, median grant)
- **Peer Intelligence Widget** showing similar organizations that received grants

#### Giving History Tab
- 5-year giving trend visualization
- Detailed 990 filings table with links to PDFs
- Historical assets, revenue, and giving data

#### Past Grantees Tab
- Searchable table of all Schedule I recipients
- Filter by year
- Shows recipient name, EIN, amount, purpose
- Helps identify peer organizations

#### Application Info Tab
- Application process details
- Deadlines and timelines
- Contact information (email, phone, address)

#### Your History Tab
- Your organization's grant applications to this funder
- Shows status, amounts, programs
- Historical relationship tracking

### 6. Reusable Peer Intelligence Widget
**Location:** [src/components/funders/peer-intelligence-widget.tsx](src/components/funders/peer-intelligence-widget.tsx)

Two components:
- `PeerIntelligenceWidget` - Full widget with metrics and top recipients
- `PeerIntelligenceCard` - Compact card version for sidebars

Shows:
- Average grant size
- Total grants tracked
- Years of data available
- Success patterns (multi-year relationships, repeat grantees)
- Top 5 recipient organizations with grant details

## Setup Instructions

### 1. Run Database Migration

The schema has been updated. Generate and apply the migration:

```bash
npx prisma migrate dev --name add_funder_intelligence
```

This will:
- Add new fields to the Funder model
- Preserve existing data
- Generate TypeScript types

### 2. Environment Variables

No new environment variables needed. The ProPublica API is public and doesn't require authentication.

### 3. Start Development Server

```bash
npm run dev
```

The Inngest dev server will automatically register the new `sync-funder-990` function.

## Usage Examples

### Creating a Funder with 990 Sync

```typescript
// In your component
const createFunderMutation = trpc.funders.create.useMutation()

await createFunderMutation.mutateAsync({
  name: 'Example Foundation',
  ein: '12-3456789',
  type: 'PRIVATE_FOUNDATION',
  website: 'https://example.org',
  sync990: true, // Automatically triggers ProPublica sync
})
```

### Manual 990 Sync

```typescript
const syncMutation = trpc.funders.sync990.useMutation()

await syncMutation.mutateAsync({ funderId: 'clxxx...' })
```

### Using Peer Intelligence Widget

```typescript
import { PeerIntelligenceWidget } from '@/components/funders/peer-intelligence-widget'

// In your component
const { data: peerIntel } = trpc.funders.getPeerIntelligence.useQuery({ funderId })

<PeerIntelligenceWidget
  funderId={funderId}
  funderName="Example Foundation"
  peerData={peerIntel}
  maxPeers={5}
  showTitle={true}
/>
```

### Compact Card Version

```typescript
import { PeerIntelligenceCard } from '@/components/funders/peer-intelligence-widget'

<PeerIntelligenceCard
  funderId={funderId}
  funderName="Example Foundation"
  averageGrant={50000}
  totalGrants={120}
/>
```

## ProPublica API Details

### Base URL
`https://projects.propublica.org/nonprofits/api/v2/`

### Endpoints Used
- `/organizations/{ein}.json` - Get organization and filings data
- Schedule I data requires PDF parsing (not yet implemented)

### Rate Limiting
ProPublica doesn't publish official rate limits, but:
- Be respectful with requests
- Cache data using `lastSyncedAt` field
- Sync manually or on a schedule, not on every page load

### Data Quality Notes
- Not all organizations have 990 data
- Schedule I (grantee data) requires PDF parsing
- Data is typically 1-2 years behind current year
- Some foundations file as part of larger entities

## Future Enhancements

### Short Term
1. **PDF Parsing for Schedule I** - Extract past grantee data from 990 PDFs
2. **Candid/GuideStar Integration** - Access more comprehensive foundation data
3. **Automated Sync Schedules** - Quarterly refresh of foundation data
4. **Smart Matching** - AI-powered matching of your mission to funder priorities

### Long Term
1. **Grant Success Prediction** - ML model to predict funding likelihood
2. **Relationship Tracking** - Timeline of interactions with funders
3. **Portfolio Analysis** - Analyze a funder's complete giving portfolio
4. **Network Visualization** - Graph of foundation-grantee relationships

## Troubleshooting

### 990 Sync Fails
- Verify the EIN is correct (9 digits, format: 12-3456789)
- Check ProPublica API is accessible
- Review Inngest logs for detailed error messages

### No Past Grantees Data
This is expected - Schedule I data requires PDF parsing which is not yet implemented. Past grantees can be manually entered or will be added when PDF parsing is built.

### Missing Financial Data
Some organizations:
- Don't file 990s (e.g., government agencies)
- File as part of larger organizations
- Have filings that haven't been processed by ProPublica yet

## API Reference

### tRPC Endpoints

#### `funders.getById`
```typescript
Input: { funderId: string }
Output: Funder with pastGrantees[], opportunities[], grants[]
```

#### `funders.getPeerIntelligence`
```typescript
Input: { funderId: string }
Output: {
  peers: Array<{
    recipientName: string
    totalReceived: number
    grantCount: number
    latestYear: number
    purposes: string[]
  }>
  averageGrant: number
  totalGrants: number
  years: number[]
}
```

#### `funders.getGivingHistory`
```typescript
Input: { funderId: string }
Output: {
  currentAssets: Decimal
  currentGiving: Decimal
  filings: Array<{
    year: number
    totalRevenue: number
    totalAssets: number
    totalGiving: number
    pdfUrl: string
  }>
}
```

## Testing Checklist

- [ ] Create a new funder with EIN
- [ ] Verify 990 sync job runs successfully
- [ ] Check funder profile page loads all tabs
- [ ] Test search functionality
- [ ] Verify peer intelligence widget displays correctly
- [ ] Test manual 990 sync button
- [ ] Check giving history charts render properly
- [ ] Verify past grantees table (if data available)

## Contributing

When enhancing this feature:
1. Update this documentation
2. Add tests for new API endpoints
3. Consider rate limiting and caching
4. Maintain backward compatibility with existing funder data

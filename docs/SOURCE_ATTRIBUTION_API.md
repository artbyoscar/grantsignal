# Source Attribution & Confidence Scoring API

Complete implementation of tRPC procedures for source attribution and confidence scoring across GrantSignal.

## Overview

This implementation provides a comprehensive audit trail for all AI-generated content with full source attribution, confidence scoring, and compliance tracking.

## Database Schema

### AIGeneration Model

New `AIGeneration` table in Prisma schema for storing complete audit trail:

```prisma
model AIGeneration {
  id              String   @id @default(cuid())
  organizationId  String
  grantId         String?
  userId          String   // Clerk user ID
  sectionId       String?  // Section identifier (e.g., "project_description")

  // Generation inputs
  prompt          String   @db.Text
  writingMode     String   // "memory_assist", "ai_draft", "human_first"

  // Generation outputs
  content         String   @db.Text
  confidence      Int      // 0-100 confidence score
  sources         Json     // Array of { documentId, documentName, text, score, chunkIndex }

  // Metadata
  model           String   // e.g., "claude-sonnet-4-5-20250929"
  tokensUsed      Int?
  generatedAt     DateTime @default(now())

  // Relations
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  grant           Grant?       @relation(fields: [grantId], references: [id], onDelete: SetNull)

  @@index([organizationId])
  @@index([grantId])
  @@index([userId])
  @@index([generatedAt])
}
```

## API Procedures

### 1. AI Router (`ai.*`)

#### `ai.generateWithSources`

Generate content with full source attribution and automatic audit logging.

**Input:**
```typescript
{
  prompt: string           // Min 10 characters
  grantId?: string         // Optional grant ID
  sectionId?: string       // Optional section identifier
  writingMode?: 'memory_assist' | 'ai_draft' | 'human_first' // Default: memory_assist
}
```

**Output:**
```typescript
{
  shouldGenerate: boolean  // False if confidence < 60%
  content: string | null   // Generated content or null if below threshold
  confidence: number       // 0-100 confidence score
  sources: Array<{
    documentId: string
    documentName: string
    text: string           // Preview (500 chars)
    score: number          // 0-100 relevance score
    chunkIndex?: number
  }>
  generatedAt: Date
  auditId: string | null   // ID for audit trail lookup
  message: string
}
```

**Features:**
- Queries RAG system for top 10 relevant sources (min score 0.7)
- Calculates confidence using V3 Trust Architecture formula:
  - Context quantity: up to 40 points (10 contexts = full 40)
  - Average relevance: up to 60 points (1.0 score = full 60)
- **Enforces 60% confidence threshold** - returns sources only if below threshold
- Automatically logs to audit trail via `AIGeneration` table
- Returns audit ID for future reference

**Example:**
```typescript
const result = await trpc.ai.generateWithSources.mutate({
  prompt: "Write a compelling project description highlighting our impact on underserved communities",
  grantId: "grant_123",
  sectionId: "project_description",
  writingMode: "ai_draft"
})

if (result.shouldGenerate) {
  console.log("Content:", result.content)
  console.log("Confidence:", result.confidence, "%")
  console.log("Sources used:", result.sources.length)
  console.log("Audit ID:", result.auditId)
} else {
  console.log("Confidence too low, review these sources:", result.sources)
}
```

#### `ai.getSourcesForContent`

Retrieve source attribution details for previously generated content.

**Input (provide one of):**
```typescript
{
  contentId?: string       // Audit ID from generation
  generatedAt?: Date       // Timestamp of generation
  grantId?: string         // Grant ID + sectionId for latest
  sectionId?: string
}
```

**Output:**
```typescript
{
  sources: Array<{
    id: string
    documentId: string
    documentName: string
    documentType: string     // PROPOSAL, REPORT, etc.
    relevanceScore: number   // 0-100
    excerpt: string
    chunkIndex?: number
    grantId?: string
    funderName?: string
  }>
  generatedAt: Date
  confidence: number
  prompt: string
  writingMode: string
  model: string
}
```

**Example:**
```typescript
// By audit ID
const sources = await trpc.ai.getSourcesForContent.query({
  contentId: "audit_xyz789"
})

// By grant + section (gets latest)
const sources = await trpc.ai.getSourcesForContent.query({
  grantId: "grant_123",
  sectionId: "project_description"
})
```

#### `ai.generate` (legacy)

Legacy endpoint without audit trail. **Deprecated** - use `generateWithSources` instead.

---

### 2. Audit Router (`audit.*`)

#### `audit.logGeneration`

Manually log an AI generation event (automatically called by `generateWithSources`).

**Input:**
```typescript
{
  grantId?: string
  prompt: string
  content: string
  confidence: number        // 0-100
  sources: Array<{
    documentId: string
    documentName: string
    text: string
    score: number
    chunkIndex?: number
  }>
  writingMode: string
  sectionId?: string
  model?: string           // Default: claude-sonnet-4-5-20250929
  tokensUsed?: number
}
```

**Output:**
```typescript
{
  auditId: string
  generatedAt: Date
  message: string
}
```

**Example:**
```typescript
const audit = await trpc.audit.logGeneration.mutate({
  grantId: "grant_123",
  sectionId: "budget_narrative",
  prompt: "Create budget narrative...",
  content: "Our proposed budget...",
  confidence: 85,
  sources: [...],
  writingMode: "ai_draft",
  tokensUsed: 2500
})
```

#### `audit.getGenerationHistory`

Get generation history for a specific grant.

**Input:**
```typescript
{
  grantId: string
  sectionId?: string        // Optional filter by section
  limit?: number           // 1-100, default 50
  cursor?: string          // For pagination
}
```

**Output:**
```typescript
{
  generations: Array<{
    id: string
    userId: string
    sectionId?: string
    prompt: string
    content: string
    confidence: number
    sources: Json
    writingMode: string
    model: string
    tokensUsed?: number
    generatedAt: Date
  }>
  nextCursor?: string      // For pagination
}
```

**Example:**
```typescript
const history = await trpc.audit.getGenerationHistory.query({
  grantId: "grant_123",
  sectionId: "project_description",
  limit: 20
})

console.log(`Found ${history.generations.length} generations`)
if (history.nextCursor) {
  // Fetch next page...
}
```

#### `audit.getOrganizationHistory`

Get all AI generations for an organization (compliance reporting).

**Input:**
```typescript
{
  startDate?: Date
  endDate?: Date
  minConfidence?: number    // 0-100
  limit?: number           // 1-100, default 50
  cursor?: string
}
```

**Output:**
```typescript
{
  generations: Array<{
    id: string
    grantId?: string
    userId: string
    sectionId?: string
    confidence: number
    writingMode: string
    model: string
    tokensUsed?: number
    generatedAt: Date
    grant?: {
      id: string
      status: string
      funder?: {
        id: string
        name: string
      }
    }
  }>
  nextCursor?: string
}
```

**Example:**
```typescript
const orgHistory = await trpc.audit.getOrganizationHistory.query({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  minConfidence: 60
})
```

#### `audit.getUsageAnalytics`

Get analytics summary for AI usage patterns.

**Input:**
```typescript
{
  startDate?: Date
  endDate?: Date
}
```

**Output:**
```typescript
{
  totalGenerations: number
  totalTokens: number
  averageConfidence: number  // 0-100
  confidenceDistribution: {
    high: number             // >= 80%
    medium: number           // 60-79%
    low: number              // < 60%
  }
  modeDistribution: {
    [mode: string]: number   // Count by writing mode
  }
  averageSources: number     // Average sources per generation
}
```

**Example:**
```typescript
const analytics = await trpc.audit.getUsageAnalytics.query({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31')
})

console.log(`Total generations: ${analytics.totalGenerations}`)
console.log(`Average confidence: ${analytics.averageConfidence}%`)
console.log(`High confidence: ${analytics.confidenceDistribution.high}`)
```

---

## V3 Trust Architecture Implementation

### Confidence Calculation

```typescript
// Context quantity: up to 40 points (10 contexts = full 40)
const contextQuantityScore = Math.min((contextsFound / 10) * 40, 40)

// Average relevance: up to 60 points (1.0 score = full 60)
const relevanceScore = averageScore * 60

// Total confidence: 0-100
const confidence = Math.round(contextQuantityScore + relevanceScore)
```

### Confidence Levels

- **High** (≥80%): Generate with full confidence
- **Medium** (60-79%): Generate with moderate confidence
- **Low** (<60%): **DO NOT GENERATE** - return sources only

### Enforcement

The 60% confidence threshold is enforced at the API level:

```typescript
if (confidence < 60) {
  return {
    shouldGenerate: false,
    content: null,
    confidence,
    sources,
    message: `Cannot confidently generate content (confidence: ${confidence}%). Here are relevant sources for manual review.`
  }
}
```

---

## Usage Examples

### Complete Workflow

```typescript
// 1. Generate content with sources
const result = await trpc.ai.generateWithSources.mutate({
  prompt: "Write project description",
  grantId: "grant_123",
  sectionId: "project_description",
  writingMode: "ai_draft"
})

if (!result.shouldGenerate) {
  // Confidence too low - show sources to user for manual writing
  displaySources(result.sources)
  return
}

// 2. Content generated successfully - save it
await saveGrantContent(result.content)

// 3. Later, retrieve sources for attribution panel
const sourceDetails = await trpc.ai.getSourcesForContent.query({
  contentId: result.auditId
})

displayAttributionPanel(sourceDetails.sources)

// 4. View generation history for audit
const history = await trpc.audit.getGenerationHistory.query({
  grantId: "grant_123"
})

displayAuditLog(history.generations)

// 5. Get organization-wide analytics
const analytics = await trpc.audit.getUsageAnalytics.query({
  startDate: new Date('2024-01-01')
})

displayAnalytics(analytics)
```

---

## Integration Points

### Frontend Integration

```typescript
// In your React components
import { trpc } from '@/lib/trpc'

function GrantWriter({ grantId, sectionId }) {
  const generateMutation = trpc.ai.generateWithSources.useMutation()
  const sourcesQuery = trpc.ai.getSourcesForContent.useQuery(
    { grantId, sectionId },
    { enabled: false }
  )

  const handleGenerate = async (prompt: string) => {
    const result = await generateMutation.mutateAsync({
      prompt,
      grantId,
      sectionId,
      writingMode: 'ai_draft'
    })

    if (result.shouldGenerate) {
      setContent(result.content)
      setAuditId(result.auditId)
    } else {
      showSourcesDialog(result.sources)
    }
  }

  return (
    <div>
      <Editor onGenerate={handleGenerate} />
      {auditId && (
        <SourceAttributionPanel
          sources={sourcesQuery.data?.sources}
          confidence={sourcesQuery.data?.confidence}
        />
      )}
    </div>
  )
}
```

### Writing Studio Integration

The existing [writing.ts](src/server/routers/writing.ts) router already implements V3 Trust Architecture with the same confidence threshold. You can:

1. **Migrate to new API**: Update `writing.generateDraft` to use `ai.generateWithSources` internally
2. **Use both**: Keep `writing.generateDraft` for Writing Studio, use `ai.generateWithSources` elsewhere
3. **Consolidate**: Move all generation logic to `ai.generateWithSources` and update Writing Studio

---

## Security & Access Control

All procedures use `orgProcedure` middleware which:
- Requires authenticated user (`ctx.auth.userId`)
- Enforces organization-scoped access (`ctx.organizationId`)
- Verifies grant access before operations
- Logs all operations with user ID for audit trail

---

## Performance Considerations

- **RAG Queries**: Top 10 contexts with 0.7 min score (configurable)
- **Pagination**: Cursor-based for all list operations
- **Indexes**: Added on `organizationId`, `grantId`, `userId`, `generatedAt`
- **JSON Storage**: Sources stored as JSON for flexibility
- **Token Tracking**: Optional `tokensUsed` field for cost monitoring

---

## Migration Notes

Database schema updated successfully using `prisma db push`:
- Added `AIGeneration` table
- Added relation to `Organization.aiGenerations`
- Added relation to `Grant.aiGenerations`
- All indexes created
- Prisma Client regenerated

No breaking changes to existing code.

---

## Next Steps

1. **Frontend Components**: Implement UI components for source attribution panel
2. **Analytics Dashboard**: Create visualization for usage analytics
3. **Compliance Reports**: Generate compliance reports using audit data
4. **Integration Testing**: Test full workflow with real grants
5. **Migration Path**: Update Writing Studio to use new API

---

## Support

For questions or issues:
- See [SOURCE_ATTRIBUTION_INTEGRATION.md](SOURCE_ATTRIBUTION_INTEGRATION.md) for UI integration
- Check existing routers for implementation examples
- Review Prisma schema for data model details

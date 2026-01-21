# GrantSignal

**The Organizational Memory Engine for Nonprofits**

Transform grant writing from 20 hours to 2 hours by capturing institutional knowledge and preventing compliance disasters.

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Screenshots](#screenshots)
- [Features](#features)
- [V3 Trust Architecture](#v3-trust-architecture)
- [Key Workflows](#key-workflows)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Development Commands](#development-commands)
- [Testing](#testing)
- [Roadmap](#roadmap)
- [License](#license)

---

## The Problem

Nonprofits face a perfect storm in 2026:

- **Federal funding disruptions** affecting 1 in 3 organizations
- **80 to 200 hours** required per federal grant application
- **75% of nonprofits** report critical staff vacancies
- **Institutional knowledge walks out the door** when staff leave

Every nonprofit has written dozens or hundreds of grant applications over the years. They contain outcome data, budget narratives, organizational descriptions, and proven language that secured funding. But this institutional knowledge lives in scattered files, departed employees' hard drives, and forgotten email threads.

**Each new application starts from scratch.**

---

## The Solution

GrantSignal is not another grant database or AI writing tool. It is the **organizational memory engine** that transforms how nonprofits manage their entire grant lifecycle.

By ingesting an organization's complete grant history, GrantSignal creates a living knowledge base that:

- **Learns your voice** through style fingerprinting and terminology mapping
- **Remembers every commitment** made to every funder
- **Assembles new proposals** from proven, successful content
- **Prevents compliance disasters** by detecting conflicts before submission

**The Moat:** Every grant written makes GrantSignal more valuable. The effective switching cost after 12 months is $10,000 to $50,000 when measured by hours to recreate the knowledge base plus institutional knowledge lost.

---

## Screenshots

> **Note:** Screenshots coming soon. The following sections document the UI.

### Dashboard
![Dashboard with Quick Stats and Pipeline Summary](public/screenshots/dashboard.png)
*Command center showing Active Grants, Pending Decisions, YTD Awarded, Win Rate, and urgent actions.*

### Pipeline Kanban
![Drag-and-drop Pipeline Board](public/screenshots/pipeline-kanban.png)
*8-stage workflow: Prospect → Researching → Writing → Review → Submitted → Pending → Awarded → Completed*

### AI Writing Studio
![Memory-assisted content generation](public/screenshots/writing-studio.png)
*Split-pane editor with RFP requirements, Memory Assist panel, and confidence-scored AI generation.*

### Compliance Guardian
![Conflict detection and resolution](public/screenshots/compliance-guardian.png)
*Commitment registry with Gantt timeline and side-by-side conflict resolution modal.*

### Voice Analysis
![Voice fingerprint radar chart](public/screenshots/voice-analysis.png)
*6-axis radar visualization: Formal/Casual, Direct/Indirect, Data-Driven/Narrative, and more.*

### Document Health Dashboard (NEW)
![Document Health Dashboard](public/screenshots/document-health.png)
*Parse confidence monitoring with issue tracking, review queue, and correction interface.*

---

## Features

### Killer Features

These four capabilities define GrantSignal's competitive moat:

| Feature | Description | Why It Matters |
|---------|-------------|----------------|
| **Organizational Memory Engine** | Your grant history becomes searchable, queryable institutional knowledge | Zero knowledge loss from staff turnover |
| **Compliance Guardian** | Detect metric mismatches and timeline conflicts across all active applications | Prevents grant clawbacks and audit failures |
| **AI Writing Studio** | RAG-powered drafting with mandatory source attribution | 60-70% time reduction with traceable content |
| **Voice Analysis** | Preserve your organization's authentic tone across all content | Funders never know AI was involved |

---

## V3 Trust Architecture

GrantSignal implements a comprehensive Trust Architecture that ensures AI outputs are always reliable, traceable, and safe for grant applications.

### Confidence Threshold System

| Score Range | UI Behavior | User Message | Actions Available |
|-------------|-------------|--------------|-------------------|
| **80-100% (High)** | Green indicator, content displayed normally | "High confidence - based on N relevant documents" | Accept, Edit, Regenerate, View Sources |
| **60-79% (Medium)** | Amber indicator, warning banner above content | "Medium confidence - verify accuracy before use" | Accept with Warning, Edit, Regenerate, View Sources |
| **0-59% (Low)** | Red indicator, content NOT generated | "Cannot confidently generate. Review sources manually." | View Sources Only, Manual Write |

### Trust Architecture Components

#### ConfidenceBadge
Reusable component displaying confidence scores with appropriate visual indicators:
- Three-tier color system (green/amber/red)
- Icon indicators (checkmark/alert/x-circle)
- Interactive tooltips explaining thresholds
- Optional "View Sources" button
- Available in sm/md/lg sizes

#### SourceAttributionPanel
Mandatory source attribution on ALL AI outputs:
- Collapsible source list with "View N Sources" toggle
- Document type badges (Proposal, Report, Agreement, Budget)
- Relevance bars with percentage scores
- Click-to-open document navigation
- "Copy with Attribution" functionality
- Timestamp with smart formatting

#### AIContentWrapper
Unified wrapper enforcing Trust Architecture rules:
- Automatically blocks content below 60% confidence
- Displays appropriate warning banners
- Provides consistent action buttons (Accept/Edit/Regenerate)
- Handles streaming state during generation
- Ensures source attribution is always visible

### Document Health Dashboard

Monitor document parsing quality across your organization:

**Route:** `/documents/health`

**Features:**
- Overall Health Score with circular progress indicator
- Document categorization by parse confidence
- Expandable issue lists with severity badges
- Side-by-side document review modal
- Editable extracted text and metadata
- Reprocess and delete actions

**Parse Confidence Calculation:**
| Component | Weight | Description |
|-----------|--------|-------------|
| Text Completeness | 40% | Percentage of text successfully extracted |
| Structure Preservation | 20% | Tables, headers, lists preserved |
| Date Extraction | 25% | Deadline and date accuracy |
| Entity Extraction | 15% | Names, amounts, organizations identified |

### Audit Trail System

Complete audit logging for compliance and transparency:

```typescript
// Every AI generation is logged with:
{
  id: string;
  organizationId: string;
  grantId: string;
  userId: string;
  prompt: string;
  content: string;
  confidence: number;
  sources: Source[];
  writingMode: 'memory_assist' | 'ai_draft' | 'human_first' | 'audit';
  model: string;
  tokensUsed: number;
  createdAt: Date;
}
```

**Audit Procedures:**
- `audit.logGeneration` - Log AI generations with full context
- `audit.getGenerationHistory` - Retrieve history for specific grant
- `audit.getOrganizationHistory` - Organization-wide compliance reporting
- `audit.getUsageAnalytics` - Analytics dashboard data

### Confidence Scoring Service

Centralized service calculating confidence across all AI operations:

```typescript
// Parse Confidence (document upload)
confidenceScoring.calculateParseConfidence(metadata)

// Retrieval Confidence (memory search)
confidenceScoring.calculateRetrievalConfidence(sources)

// Generation Confidence (AI output)
confidenceScoring.calculateGenerationConfidence(content, sources, query)

// Threshold checks
confidenceScoring.shouldAllowGeneration(retrievalConfidence) // ≥60%
confidenceScoring.getConfidenceLevel(score) // 'high' | 'medium' | 'low'
```

---

<details>
<summary><strong>View all 50+ features</strong></summary>

### Smart Discovery
- [x] RFP Parser with AI-powered requirement extraction
- [x] Deadline extraction with confidence scoring (Critical Path)
- [x] Fit scoring against organizational profile (0-100)
- [x] Reusable content analysis with section matching
- [x] Estimated completion time based on memory coverage
- [x] Federal API integration (Grants.gov)
- [x] 990-first peer intelligence via ProPublica

### Pipeline Management
- [x] Kanban board with 8 grant stages
- [x] Drag-and-drop with optimistic updates
- [x] Deadline badges with urgency color coding
- [x] Pipeline cards with funder, amount, deadline
- [x] Search and filtering (program, funder type, status)
- [x] Table view with sortable columns
- [x] Quick view slide-out panel

### Document Processing
- [x] Multi-format ingestion (DOCX, PDF, Google Docs)
- [x] Parsing fallback chain (Unstructured.io → pdf-parse → OCR → Claude Vision)
- [x] Confidence scoring on every document (0-100)
- [x] Human review queue for low-confidence extractions
- [x] Automatic entity extraction (programs, funders, metrics)
- [x] Automatic commitment extraction for Compliance Guardian
- [x] S3 storage with presigned URLs
- [x] Background processing via Inngest
- [x] **Document Health Dashboard with parse monitoring** (NEW)
- [x] **Side-by-side document review and correction** (NEW)

### RAG Integration
- [x] Pinecone vector database with organization namespaces
- [x] Semantic search across all documents
- [x] Hybrid retrieval (vector + keyword)
- [x] Confidence thresholds gating generation
- [x] Source attribution on all AI outputs
- [x] **Similarity threshold enforcement (≥0.7 cosine)** (NEW)
- [x] **Confidence-aware retrieval with scoring** (NEW)

### AI Writing Studio
- [x] Split-pane layout (RFP requirements + editor)
- [x] Memory Assist panel with relevance scoring
- [x] AI Draft mode with voice matching
- [x] Human First mode (suggestions only)
- [x] Audit Mode for compliance tracking
- [x] Streaming responses with source citations
- [x] Word/character counters per section
- [x] Voice consistency indicator
- [x] Apply Voice button for tone matching
- [x] **ConfidenceBadge on all search results** (NEW)
- [x] **AIContentWrapper with threshold enforcement** (NEW)
- [x] **Low-confidence content blocking** (NEW)
- [x] **Voice confidence comparison** (NEW)

### Trust Architecture (NEW)
- [x] Three-tier confidence system (high/medium/low)
- [x] ConfidenceBadge component with visual indicators
- [x] SourceAttributionPanel with mandatory attribution
- [x] AIContentWrapper enforcing thresholds
- [x] Document Health Dashboard
- [x] Confidence Scoring Service
- [x] Complete audit trail logging
- [x] Generation history retrieval
- [x] Usage analytics

### Compliance Guardian
- [x] Commitment extraction from documents with confidence scoring
- [x] Central commitment registry
- [x] Gantt-style timeline visualization
- [x] Cross-application conflict detection
- [x] Metric mismatch alerts
- [x] Timeline overlap warnings
- [x] Side-by-side conflict resolution modal
- [x] Resolution workflow (Update/Flag/Ignore)
- [x] CSV export for audits
- [x] Audit logging for all actions

### Funder Intelligence
- [x] ProPublica 990 API integration
- [x] Funder research modal with key stats
- [x] Funder profile pages
- [x] Giving history visualization
- [x] Past grantee analysis
- [x] Board composition data

### Voice Analysis
- [x] Voice profile extraction from documents
- [x] Style fingerprinting (sentence patterns, vocabulary)
- [x] Terminology mapping (preferred/avoided terms)
- [x] 6-axis radar chart visualization
- [x] Voice settings page with pattern toggles
- [x] Apply Voice function for content adaptation
- [x] Writing Studio integration

### Reports & Analytics
- [x] Executive Summary report
- [x] Pipeline Report with filtering
- [x] Win/Loss Analysis
- [x] Grants by Program breakdown
- [x] PDF export with branding

### Dashboard
- [x] Quick Stats row (Active, Pending, YTD, Win Rate)
- [x] Urgent Actions panel with deadline alerts
- [x] Pipeline Summary widget (stacked bar)
- [x] Recent Activity feed
- [x] Grants by Program chart

### Authentication & Security
- [x] Clerk authentication with MFA support
- [x] Multi-tenant data isolation
- [x] Row-level security on all tables
- [x] Separate Pinecone namespaces per org
- [x] S3 keys prefixed by organization

</details>

---

## Key Workflows

### 1. Compliance Guardian Workflow (Enterprise Feature)

This is the multi-million dollar feature that justifies premium pricing and sells to CFOs.

```
1. User uploads grant document (proposal, report, agreement)
2. System extracts commitments:
   - Deliverables with due dates
   - Outcome metrics with target values
   - Staffing commitments
   - Budget allocations
3. Commitments stored in central registry
4. When user writes new application:
   - System scans for conflicts with existing commitments
   - Detects metric mismatches (e.g., "500 youth" vs "600 youth")
   - Flags timeline overlaps
   - Shows side-by-side comparison
5. User resolves conflicts before submission
6. Audit trail logged for compliance review
```

**Value Delivered:** A single avoided audit finding is worth $100K+. Zero compliance incidents for active users.

### 2. AI Writing with Trust Architecture (NEW)

```
1. User uploads RFP or pastes URL
2. System parses requirements:
   - Extracts sections with word limits
   - Identifies deadline (CRITICAL)
   - Calculates fit score against org profile
3. User opens AI Writing Studio
4. System queries organizational memory for relevant content
5. Confidence scoring applied:
   - Retrieval confidence calculated from source quality
   - If retrieval confidence < 60%: BLOCK generation, show sources only
6. If confidence ≥ 60%, content generated:
   - Generation confidence calculated
   - ≥80%: Green indicator, content displayed normally
   - 60-79%: Amber warning, user prompted to verify
   - <60%: Content blocked, sources shown for manual review
7. All AI outputs wrapped in AIContentWrapper with:
   - Mandatory source attribution panel
   - Confidence badge
   - Action buttons (Accept/Edit/Regenerate)
8. Every generation logged to audit trail
```

**Value Delivered:** First draft in 2 hours instead of 20 hours, with traceable provenance and zero hallucinations.

### 3. Document Health Monitoring (NEW)

```
1. User uploads documents to knowledge base
2. System processes with confidence scoring:
   - Text extraction completeness (40%)
   - Structure preservation (20%)
   - Date extraction accuracy (25%)
   - Entity extraction success (15%)
3. Documents categorized:
   - ≥80%: Successfully Parsed (green)
   - 60-79%: Needs Review (amber)
   - <60%: Failed/Manual Required (red)
4. Document Health Dashboard shows:
   - Overall health score
   - Issue counts by severity
   - Specific problems per document
5. For amber/red documents:
   - Side-by-side review modal
   - Editable extracted text
   - Metadata correction
   - Save corrections to improve confidence
```

**Value Delivered:** Visibility into knowledge base quality, proactive issue resolution, continuous improvement.

### 4. Voice Analysis Workflow

```
1. System analyzes uploaded documents (proposals, reports)
2. Extracts voice profile:
   - Sentence length patterns
   - Vocabulary preferences
   - Tone classification (formal/casual, direct/indirect)
   - Preferred terminology mappings
3. Displays 6-axis radar chart visualization
4. User can toggle detected patterns on/off
5. When generating content:
   - System applies voice constraints
   - "Apply Voice" button rewrites to match profile
   - Confidence comparison shows improvement
6. Side-by-side comparison shows original vs. voice-matched
```

**Value Delivered:** Funders never detect AI involvement. Authentic organizational voice preserved.

### 5. Funder Intelligence Workflow

```
1. User searches for funder or clicks from opportunity
2. System fetches 990 data via ProPublica API:
   - Total assets and annual giving
   - Typical grant size range
   - Geographic focus
   - Program area priorities
3. Displays giving history visualization (5-year trend)
4. Shows past grantees with "Similar to You" badges
5. Peer intelligence: "Organization X received $500K for similar work"
```

### 6. Grant Pipeline Management

```
1. Grants flow through 8 stages:
   Prospect → Researching → Writing → Review → 
   Submitted → Pending → Awarded → Completed
2. Drag-and-drop updates status with optimistic UI
3. Each card shows funder, amount, deadline
4. Deadline badges color-coded by urgency:
   - Red: Overdue or due within 3 days
   - Amber: Due within 7 days
   - Blue: Due within 14 days
5. Click card for quick view slide-out
6. "Open in Writer" launches AI Writing Studio
```

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 15 (App Router) | Server Components, streaming, production-proven |
| Language | TypeScript 5.x (strict) | Type safety end-to-end |
| Styling | Tailwind CSS 4 + shadcn/ui | Utility-first, consistent design system |
| API | tRPC v11 | Type-safe RPC with excellent Next.js integration |
| Database | PostgreSQL (Neon) | Serverless, branching for dev, proven reliability |
| ORM | Prisma 6.x | Type-safe queries, migrations |
| Vector DB | Pinecone | Managed RAG infrastructure, production-grade |
| Auth | Clerk | Pre-built components, MFA, SSO |
| Storage | AWS S3 + CloudFront | Secure, scalable document storage |
| AI/LLM | Claude API (Anthropic) | Superior writing quality, 200K context |
| Embeddings | text-embedding-3-large | Best quality for RAG (3072 dimensions) |
| Doc Parsing | Unstructured.io + pdf-parse | Critical path: RFP extraction must be flawless |
| Background Jobs | Inngest | Serverless, durable document processing |
| Charts | Recharts | Data visualization for analytics |
| Drag-and-Drop | @dnd-kit | Accessible pipeline interactions |
| Testing | Vitest + React Testing Library | Fast unit and integration tests |
| Hosting | Vercel | Edge functions, excellent Next.js support |
| Monitoring | Sentry + Axiom | Error tracking + structured logging |

---

## Architecture

### V3 Trust Architecture

GrantSignal V3 implements a comprehensive trust system ensuring AI outputs are always reliable:

| Component | Purpose | Implementation |
|-----------|---------|----------------|
| **Confidence Scoring** | Calculate reliability of AI outputs | ConfidenceScoringService with weighted components |
| **Source Attribution** | Trace every claim to source documents | SourceAttributionPanel, mandatory on all AI outputs |
| **Threshold Enforcement** | Prevent low-confidence content | AIContentWrapper blocks <60% confidence |
| **Audit Trail** | Complete logging for compliance | AIGeneration model with full context |

### Risk Mitigations

| Risk | Problem | Solution |
|------|---------|----------|
| **Ingestion Friction** | Users upload messy scanned PDFs, system chokes | Progressive value delivery, confidence scoring, human review queue, Document Health Dashboard |
| **Integration Heaviness** | Word/Salesforce plugins require heavy maintenance | Clipboard-first approach before native integrations |
| **Trust/Hallucination** | One fabricated statistic could cost an organization their award | Mandatory source attribution, confidence thresholds, constrained RAG, audit mode |

### AI Safety (Trust Architecture)

| Confidence | Behavior | User Message |
|------------|----------|--------------|
| **≥80%** | Content generated normally | Green indicator: "High confidence, based on 4 relevant documents" |
| **60-79%** | Content shown with warning | Amber warning: "Verify accuracy before use" |
| **<60%** | Content NOT generated | "Cannot confidently adapt content. Here are relevant sources for manual review." |

**All AI outputs include mandatory source attribution. This is non-negotiable.**

### Data Isolation

- Row-level security with `organizationId` on all tables
- Separate Pinecone namespaces per organization
- S3 object keys prefixed by organization
- All queries include mandatory organization filter at ORM level

### Document Processing Pipeline

```
Upload → Virus Scan → S3 Storage → Parsing Fallback Chain → 
Confidence Scoring → Entity Extraction → Chunking → Embedding → 
Pinecone Upsert → Commitment Extraction → Knowledge Graph Update
```

**Parsing Fallback Chain:**
1. Unstructured.io (best quality)
2. pdf-parse (fast fallback)
3. Tesseract OCR (scanned docs)
4. Claude Vision API (complex layouts)
5. Human Review Queue (all engines failed)

---

## Installation

> **Note:** This is a proprietary application. The installation steps below are provided for documentation purposes and authorized development team members. Running this application requires access to configured services (Clerk, Neon, Pinecone, AWS S3, Anthropic API).

### Prerequisites

- Node.js 22.x LTS
- pnpm 9.x
- PostgreSQL (or Neon account)
- Pinecone account
- AWS account (for S3)
- Clerk account
- Anthropic API key
- OpenAI API key (for embeddings)

### Setup

```bash
# Clone repository
git clone https://github.com/artbyoscar/grantsignal.git
cd grantsignal

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Set up Pinecone
# Create an index named "grantsignal" in Pinecone console with:
# - Dimensions: 3072 (for text-embedding-3-large)
# - Metric: Cosine

# Push database schema
pnpm prisma db push

# Generate Prisma client
pnpm prisma generate

# Seed database (optional)
pnpm prisma db seed

# Start development server
pnpm dev
```

---

## Environment Variables

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Pinecone Vector DB
PINECONE_API_KEY=...
PINECONE_INDEX=grantsignal

# AI Services
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Document Parsing
UNSTRUCTURED_API_URL=https://api.unstructured.io
UNSTRUCTURED_API_KEY=...

# AWS Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-west-2
AWS_S3_BUCKET=grantsignal-documents

# Background Jobs
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

---

## Project Structure

```
grantsignal/
├── prisma/
│   ├── schema.prisma      # Database schema with V3 enhancements
│   └── seed.ts            # Seed data script
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (auth)/        # Authentication pages
│   │   ├── (dashboard)/   # Protected routes
│   │   │   ├── dashboard/
│   │   │   ├── opportunities/
│   │   │   ├── pipeline/
│   │   │   ├── documents/
│   │   │   │   └── health/    # Document Health Dashboard (NEW)
│   │   │   ├── compliance/
│   │   │   ├── reports/
│   │   │   ├── funders/
│   │   │   └── settings/
│   │   │       └── voice/
│   │   └── api/
│   │       ├── trpc/      # tRPC API handler
│   │       └── inngest/   # Background job handler
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   │   ├── confidence-badge.tsx      # NEW
│   │   │   └── source-attribution-panel.tsx  # NEW
│   │   ├── ai/            # AI-specific components (NEW)
│   │   │   └── ai-content-wrapper.tsx    # NEW
│   │   ├── layout/        # Shell, sidebar, header
│   │   ├── dashboard/     # Dashboard widgets
│   │   ├── pipeline/      # Kanban components
│   │   ├── writing/       # AI Writing Studio
│   │   ├── compliance/    # Compliance Guardian
│   │   ├── documents/     # Document components (NEW)
│   │   │   ├── document-health-stats.tsx
│   │   │   ├── document-health-table.tsx
│   │   │   └── document-review-modal.tsx
│   │   ├── funders/       # Funder Intelligence
│   │   └── voice/         # Voice Analysis
│   ├── server/
│   │   ├── routers/       # tRPC routers
│   │   │   ├── audit.ts   # Audit trail router (NEW)
│   │   │   └── ai.ts      # Enhanced with source attribution (NEW)
│   │   ├── context.ts     # Request context
│   │   └── services/      # Business logic
│   │       ├── ai/        # RAG, voice, embeddings
│   │       │   ├── confidence-scoring.ts  # NEW
│   │       │   └── rag.ts                 # Enhanced (NEW)
│   │       ├── documents/ # Parsing, processing
│   │       │   └── parser.ts              # Enhanced (NEW)
│   │       ├── compliance/# Commitment tracking
│   │       └── discovery/ # Fit scoring, 990 intel
│   ├── lib/
│   │   ├── trpc/          # tRPC client setup
│   │   ├── pinecone.ts    # Vector DB client
│   │   ├── s3.ts          # Storage utilities
│   │   └── utils.ts       # Utilities
│   ├── types/             # TypeScript definitions
│   │   ├── source.ts      # Source attribution types (NEW)
│   │   ├── confidence.ts  # Confidence scoring types (NEW)
│   │   └── document-health.ts  # Document health types (NEW)
│   └── test/              # Test suite (NEW)
│       ├── trust-architecture/
│       │   ├── confidence-scoring.test.ts
│       │   ├── source-attribution.test.ts
│       │   ├── rag-retrieval.test.ts
│       │   └── audit-trail.test.ts
│       ├── components/
│       │   ├── confidence-badge.test.tsx
│       │   ├── source-attribution-panel.test.tsx
│       │   └── ai-content-wrapper.test.tsx
│       ├── fixtures/
│       │   └── documents.ts
│       ├── mocks/
│       │   ├── pinecone.ts
│       │   └── anthropic.ts
│       ├── setup.ts
│       └── vitest.config.ts
├── docs/                  # Documentation (NEW)
│   ├── SOURCE_ATTRIBUTION_INTEGRATION.md
│   └── SOURCE_ATTRIBUTION_API.md
└── public/
    └── screenshots/       # UI screenshots
```

---

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run unit tests |
| `pnpm test:ui` | Run tests with Vitest UI |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm prisma studio` | Open Prisma Studio |
| `pnpm prisma db push` | Push schema changes |
| `pnpm prisma db seed` | Seed database |
| `pnpm inngest dev` | Run Inngest dev server |

---

## Testing

GrantSignal includes a comprehensive test suite validating the Trust Architecture:

### Test Categories

| Category | Files | Coverage |
|----------|-------|----------|
| Confidence Scoring | `confidence-scoring.test.ts` | Threshold enforcement, calculation accuracy |
| Source Attribution | `source-attribution.test.ts` | Mandatory attribution, metadata completeness |
| RAG Retrieval | `rag-retrieval.test.ts` | Similarity filtering, namespace isolation |
| Audit Trail | `audit-trail.test.ts` | Logging completeness, retrieval accuracy |
| UI Components | `*.test.tsx` | Rendering, interactions, accessibility |

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test confidence-scoring

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch

# Run with UI
pnpm test:ui
```

### Key Test Scenarios

- **High Confidence (≥80%)**: Content displays normally with green indicator
- **Medium Confidence (60-79%)**: Amber warning banner shown
- **Low Confidence (<60%)**: Content blocked, sources shown for manual review
- **RAG Threshold**: Only chunks with ≥0.7 cosine similarity used
- **Audit Trail**: All generations logged with timestamp, user, sources, confidence

---

## Roadmap

### Phase 1: Foundation ✅
- [x] Authentication and multi-tenancy
- [x] Dashboard with real-time data
- [x] Pipeline Kanban with drag-and-drop
- [x] Document upload and processing
- [x] RAG integration with semantic search
- [x] AI Writing Studio with Memory Assist

### Phase 2: Organization ✅
- [x] Pipeline Table View with tabs
- [x] Program-based filtering
- [x] Executive Summary Reports
- [x] CSV/PDF export functionality

### Phase 3: Compliance & Intelligence ✅
- [x] Compliance Guardian with commitment tracking
- [x] Conflict detection across applications
- [x] Funder Intelligence via 990 analysis
- [x] Voice Analysis and preservation

### Phase 4: Scale (In Progress - ~75% Complete)
- [x] **V3 Trust Architecture implementation**
- [x] **Confidence Scoring UI (ConfidenceBadge, SourceAttributionPanel)**
- [x] **AIContentWrapper with threshold enforcement**
- [x] **Document Health Dashboard**
- [x] **Writing Studio Trust integration**
- [x] **Audit trail system with tRPC procedures**
- [x] **Confidence Scoring Service**
- [x] **Comprehensive test suite (250+ tests)**
- [ ] Stress testing with real document corpus
- [ ] Production deployment to Vercel
- [ ] Team collaboration features
- [ ] Email notifications and digests
- [ ] API access for integrations
- [ ] Browser extension for clipboard formatting

---

## Contributing

This is a proprietary project. Contributions are limited to authorized team members.

---

## License

Copyright © 2026 GrantSignal. All rights reserved.

---

## Contact

- **Developer**: Oscar Nuñez
- **Repository**: [github.com/artbyoscar/grantsignal](https://github.com/artbyoscar/grantsignal)
- **Local Path**: `C:\Users\OscarNuñez\Desktop\grantsignal`
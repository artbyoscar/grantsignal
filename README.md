# GrantSignal

**The Organizational Memory Engine for Nonprofits**

GrantSignal transforms how nonprofits manage their entire grant lifecycle by creating a living knowledge base that learns your organization's voice, remembers every commitment made to every funder, and assembles new proposals from proven content.

![GrantSignal Status](https://img.shields.io/badge/Status-In%20Development-blue)
![Next.js 16](https://img.shields.io/badge/Next.js-16.1.4-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![License](https://img.shields.io/badge/License-Proprietary-red)

---

## The Problem

Nonprofits face a perfect storm in 2026:
- Federal funding disruptions affecting 1 in 3 organizations
- 80 to 200 hours required per federal grant application
- 75% of nonprofits reporting critical staff vacancies

The grant writing bottleneck is not a discovery problem or a writing problem in isolation. It is an **organizational memory problem**. Institutional knowledge lives in scattered files, departed employees' hard drives, and forgotten email threads. Each new application starts from scratch.

## The Solution

GrantSignal is not another grant database or AI writing tool. It is the organizational memory engine that:

- **Learns your voice** through document analysis and style fingerprinting
- **Remembers commitments** made to every funder with compliance tracking
- **Assembles proposals** from proven, successful content
- **Prevents disasters** by detecting conflicts before submission

---

## Features

### Core Platform

- [x] **Dashboard** - Command center with key metrics, urgent actions, pipeline summary, grants by program, and fit recommendations
- [x] **Pipeline Kanban** - Drag-and-drop grant workflow management across 8 stages
- [x] **Pipeline Table View** - Spreadsheet view with tabs (Active/Awarded/Declined/Completed), sorting, search, and CSV export
- [x] **Smart Discovery** - RFP parsing with AI-powered fit scoring against organizational profile
- [x] **Document Library** - Upload, process, and search organizational documents with health monitoring
- [x] **Document Processing** - Text extraction with confidence scoring and human review queue
- [x] **RAG Integration** - Semantic search across organizational memory via Pinecone
- [x] **AI Writing Studio** - Memory-assisted content generation with source attribution
- [x] **Reports & Analytics** - Executive summary, monthly summary, pipeline reports with PDF export
- [x] **User Onboarding** - 4-step guided setup with tour overlay
- [x] **Multi-tenant Architecture** - Organization-scoped data isolation
- [x] **Authentication** - Clerk integration with SSO support

### Compliance Guardian (NEW)

- [x] **Commitment Extraction** - Automatic extraction from award letters and agreements
- [x] **Commitment Registry** - Central registry of all promises to funders with status tracking
- [x] **Conflict Detection** - Scheduled daily scans for metric mismatches and timeline overlaps
- [x] **Conflict Resolution Modal** - Professional workflow with severity indicators and audit trail
- [x] **Compliance Dashboard** - Timeline visualization, at-risk commitments, conflict alerts
- [x] **Batch Extraction** - Process multiple grants/documents in sequence
- [x] **CSV Export** - Export commitments with all key fields
- [x] **Audit Logging** - Complete trail of all compliance actions

### Funder Intelligence (NEW)

- [x] **ProPublica 990 Integration** - Automatic sync of foundation data
- [x] **Research Funder Modal** - Search by name or EIN, auto-create with 990 sync
- [x] **Funder Profile Pages** - 5 comprehensive tabs (Overview, Giving History, Past Grantees, Application, Your History)
- [x] **Giving History Visualizations** - Trends, YoY growth rates, assets vs. giving comparison
- [x] **Peer Intelligence** - Shows similar organizations that received grants
- [x] **Key Metrics Cards** - Latest giving, average growth rate, 5-year totals, payout rates

### Voice Analysis (NEW)

- [x] **Voice Profile Extraction** - Analyzes documents for sentence patterns, vocabulary, tone
- [x] **Style Fingerprinting** - Formality, directness, optimism, data emphasis metrics
- [x] **Terminology Mapping** - Preferred terms and avoided terms detection
- [x] **Voice Settings Page** - Radar chart visualization with pattern toggles
- [x] **Apply Voice** - Rewrite content to match organizational voice
- [x] **Writing Studio Integration** - Voice consistency indicator and apply button

### Fit Scoring Engine

- [x] **5-Dimension Analysis** - Mission alignment, capacity match, geographic fit, funder history, reusable content
- [x] **AI-Powered Mission Scoring** - Claude analyzes mission compatibility
- [x] **RAG Content Discovery** - Identifies reusable content from organizational memory
- [x] **Time Estimation** - Calculates estimated hours based on content reusability
- [x] **Smart Caching** - 24-hour cache with automatic refresh
- [x] **Batch Processing** - Calculate fit scores for multiple opportunities in parallel

### Reports & Analytics

- [x] **Executive Summary Report** - One-page overview with key metrics, pipeline, wins, deadlines
- [x] **Monthly Summary Report** - Executive overview with program breakdown
- [x] **Pipeline Report** - All grants grouped by status with full details
- [x] **Win/Loss Analysis** - Success metrics by funder type and program area
- [x] **PDF Export** - Professional layout with GrantSignal branding
- [x] **Copy to Clipboard** - Quick sharing of report data

### Dashboard Widgets

- [x] **Quick Stats Row** - Active grants, pending decisions, YTD awarded, win rate
- [x] **Urgent Actions Panel** - Deadlines and compliance alerts
- [x] **Pipeline Summary** - Visual bar by stage with totals
- [x] **Grants by Program** - Visual breakdown with clickable segments
- [x] **Recent Activity Feed** - Document uploads, status changes, AI generations
- [x] **Fit Opportunities Widget** - Top 5 personalized recommendations
- [x] **Monthly Summary Widget** - Quick metrics with link to full report

### AI Writing Studio Features

- [x] **Memory Assist** - Search and insert content from past proposals
- [x] **AI Generation** - Draft, refine, and expand content with Claude
- [x] **V3 Trust Architecture** - Confidence thresholds prevent hallucinations
- [x] **Source Attribution** - Every AI output shows its sources
- [x] **Voice Consistency** - Indicator shows match with organizational voice
- [x] **Apply Voice Button** - Rewrite selected text to match voice profile
- [x] **Auto-save** - Content saved automatically with status indicators

### Document Processing Pipeline

- [x] **S3 Upload** - Presigned URLs for secure direct upload
- [x] **Multi-format Support** - PDF, DOCX, DOC, TXT
- [x] **Confidence Scoring** - Automatic quality assessment (0-100)
- [x] **Human Review Queue** - Low-confidence documents flagged for review
- [x] **Vectorization** - Automatic embedding and Pinecone indexing
- [x] **Document Health Dashboard** - Visual stats for processing status
- [x] **Automatic Commitment Extraction** - Award documents trigger extraction

### Pipeline Features

- [x] **Kanban View** - Drag-and-drop across 8 stages
- [x] **Table View** - Sortable columns with visual indicators
- [x] **Status Tabs** - Active, Awarded, Declined, Completed with counts
- [x] **Search** - Filter by grant title or funder name
- [x] **Program Filter** - Filter by program area
- [x] **Funder Type Filter** - Filter by funder type
- [x] **Checkbox Selection** - Select multiple grants for bulk operations
- [x] **CSV Export** - Export selected or all grants
- [x] **Fit Score Column** - Optional column with color-coded scores
- [x] **URL-persisted Filters** - Shareable filtered views

### Onboarding Flow

- [x] **Welcome Page** - Product value proposition with progress indicator
- [x] **Organization Setup** - Name, EIN, mission, program areas, geography
- [x] **Document Connection** - Cloud storage placeholders and drag-drop upload
- [x] **Processing Status** - Real-time progress dashboard
- [x] **Tour Overlay** - 4-step guided tour highlighting key features
- [x] **Onboarding Guard** - Automatic redirect for incomplete users

### Planned Features (Phase 4: Scale)

- [ ] **Team Collaboration** - Multi-user features, assignments, @mentions
- [ ] **Email Notifications** - Deadline reminders, weekly digest, compliance alerts
- [ ] **API Access** - Public API for integrations
- [ ] **Mobile Optimization** - Responsive improvements for mobile devices
- [ ] **Browser Extension** - Clipboard formatting for Word/Google Docs

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 16 (App Router) | Server components, streaming |
| Language | TypeScript 5.x (strict) | Type safety end-to-end |
| Styling | Tailwind CSS 4 + shadcn/ui | Utility-first design system |
| API | tRPC v11 | Type-safe RPC layer |
| Database | PostgreSQL (Neon) | Serverless, multi-tenant |
| ORM | Prisma 6.x | Type-safe queries |
| Vector DB | Pinecone | RAG infrastructure |
| Auth | Clerk | SSO, MFA, user management |
| Storage | AWS S3 + CloudFront | Document storage |
| AI/LLM | Claude API (Anthropic) | Content generation, analysis |
| Embeddings | OpenAI text-embedding-3-large | Document vectorization |
| Background Jobs | Inngest | Document processing, scheduled tasks |
| PDF Export | @react-pdf/renderer | Report generation |
| CSV Export | papaparse | Data export |

---

## Getting Started

### Prerequisites

- Node.js 22.x LTS
- pnpm 9.x
- PostgreSQL (or Neon account)
- Clerk account
- AWS account (for S3)
- OpenAI API key (for embeddings)
- Anthropic API key (for AI generation)
- Pinecone account (for vector search)

### Installation

```bash
# Clone the repository
git clone https://github.com/artbyoscar/grantsignal.git
cd grantsignal

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Push database schema
pnpm prisma db push

# Seed the database (optional, for development)
pnpm prisma db seed

# Start development server
pnpm dev

# In a separate terminal, start Inngest dev server
pnpm inngest dev
```

### Environment Variables

Create a `.env.local` file with the following:

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

# AWS Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-west-2
AWS_S3_BUCKET=grantsignal-documents

# Background Jobs (Inngest)
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

---

## Project Structure

```
grantsignal/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data script
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Protected routes
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── opportunities/ # Smart Discovery + Funder Intelligence
│   │   │   ├── pipeline/      # Grant pipeline (Kanban + Table)
│   │   │   ├── documents/     # Document library
│   │   │   ├── write/[grantId]/ # AI Writing Studio
│   │   │   ├── compliance/    # Compliance Guardian
│   │   │   ├── reports/       # Analytics & Reports
│   │   │   ├── onboarding/    # User onboarding flow
│   │   │   └── settings/      # Organization + Voice settings
│   │   └── api/
│   │       ├── trpc/          # tRPC API handler
│   │       └── inngest/       # Background job handler
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── layout/            # Shell, sidebar, header
│   │   ├── dashboard/         # Dashboard widgets
│   │   ├── pipeline/          # Kanban and table components
│   │   ├── discovery/         # FitScoreCard, opportunity cards
│   │   ├── documents/         # Document cards, upload
│   │   ├── writing/           # Writing Studio components
│   │   ├── reports/           # Report components + PDF
│   │   ├── compliance/        # Compliance components
│   │   ├── funders/           # Funder intelligence components
│   │   └── shared/            # MemorySearch, TourOverlay
│   ├── server/
│   │   ├── routers/           # tRPC routers
│   │   │   ├── grants.ts      # Grant CRUD and filtering
│   │   │   ├── documents.ts   # Document management
│   │   │   ├── discovery.ts   # Smart Discovery + Fit Scoring
│   │   │   ├── funders.ts     # Funder intelligence
│   │   │   ├── ai.ts          # AI writing procedures
│   │   │   ├── voice.ts       # Voice analysis
│   │   │   ├── reports.ts     # Report generation
│   │   │   ├── programs.ts    # Program management
│   │   │   ├── onboarding.ts  # Onboarding procedures
│   │   │   └── compliance.ts  # Compliance tracking
│   │   ├── services/          # Business logic
│   │   │   ├── ai/
│   │   │   │   ├── embeddings.ts
│   │   │   │   ├── rag.ts
│   │   │   │   ├── writer.ts
│   │   │   │   └── voice.ts
│   │   │   ├── discovery/
│   │   │   │   └── propublica.ts
│   │   │   ├── compliance/
│   │   │   │   ├── commitments.ts
│   │   │   │   └── conflicts.ts
│   │   │   └── documents/
│   │   │       ├── parser.ts
│   │   │       └── chunker.ts
│   │   └── context.ts         # Request context
│   ├── inngest/
│   │   ├── client.ts          # Inngest client
│   │   └── functions/         # Background jobs
│   │       ├── process-document.ts
│   │       └── detect-conflicts.ts
│   ├── lib/
│   │   ├── trpc/              # tRPC client setup
│   │   ├── pinecone.ts        # Pinecone client
│   │   ├── anthropic.ts       # Anthropic client
│   │   ├── fit-scoring.ts     # Fit scoring service
│   │   ├── export.ts          # CSV export utility
│   │   └── utils.ts           # Utilities
│   └── types/                 # TypeScript definitions
└── public/                    # Static assets
```

---

## Key Workflows

### Compliance Guardian

1. User uploads award letter or grant agreement
2. System automatically extracts commitments (deliverables, metrics, deadlines)
3. Commitments stored in registry with grant linkage
4. Daily scheduled job scans for conflicts across all commitments
5. Conflicts flagged with severity (Low/Medium/High/Critical)
6. User resolves via modal with required notes for audit trail
7. All actions logged for compliance reporting

### Funder Intelligence

1. User clicks "Research Funder" in Opportunities page
2. Search by foundation name or EIN
3. If found, view existing funder profile
4. If not found, enter EIN to auto-create with 990 sync
5. ProPublica API fetches: assets, giving, board composition
6. Giving History tab shows trends, growth rates, payout analysis
7. Past Grantees tab shows organizations that received grants

### Voice Analysis

1. System analyzes uploaded documents for writing patterns
2. Extracts: sentence length, vocabulary preferences, tone metrics
3. Voice profile stored with organization
4. Writing Studio shows voice consistency indicator
5. User can click "Apply Voice" to rewrite text matching their style
6. Settings page allows toggling detected patterns on/off

### Fit Scoring Analysis

1. User submits opportunity via URL or RFP upload
2. System parses RFP and extracts requirements
3. Fit scoring engine calculates 5 dimensions:
   - **Mission Alignment** (30%): Claude AI compares missions
   - **Capacity Match** (25%): Programs, budget, and workload analysis
   - **Geographic Fit** (15%): Service area vs funder focus
   - **Funder History** (15%): Previous awards and applications
   - **Reusable Content** (15%): RAG search for existing content
4. Results cached for 24 hours
5. Score displayed on opportunity cards, pipeline, and detail pages

### Document Upload & Processing

1. User uploads document via drag-and-drop
2. System generates presigned S3 URL
3. File uploads directly to S3
4. Inngest job triggered for processing:
   - Downloads from S3
   - Extracts text (PDF/DOCX/TXT)
   - Calculates confidence score
   - Chunks text for RAG
   - Generates embeddings
   - Stores in Pinecone
   - Extracts commitments (if award document)
5. Document marked as COMPLETED or NEEDS_REVIEW

### AI Writing with Memory

1. User opens Writing Studio for a grant
2. Enters prompt (e.g., "Write a project narrative about youth programs")
3. System queries organizational memory via RAG
4. If relevant content found (confidence ≥60%):
   - Claude generates content using context
   - Sources displayed with relevance scores
   - Voice consistency indicator shown
   - User can accept, edit, apply voice, or regenerate
5. If low confidence (<60%):
   - Sources shown for manual reference
   - No AI content generated (prevents hallucination)

### Grant Pipeline Management

1. Grants flow through 8 stages: Prospect → Researching → Writing → Review → Submitted → Pending → Awarded → Completed
2. Kanban view: Drag-and-drop updates status
3. Table view: Sort, filter, search, select, and export
4. Filter by: Status tabs, program, funder type, search
5. Each card shows funder, amount, deadline, fit score
6. Deadline badges color-coded by urgency

---

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm lint` | Run ESLint |
| `pnpm prisma studio` | Open Prisma Studio |
| `pnpm prisma db push` | Push schema changes |
| `pnpm prisma db seed` | Seed database |
| `pnpm inngest dev` | Run Inngest dev server |

---

## Architecture Principles

### V3 Risk Mitigations

1. **Ingestion Friction** - Progressive value delivery with confidence scoring
2. **Integration Heaviness** - Clipboard-first approach before native plugins
3. **Trust/Hallucination** - Mandatory source attribution, constrained RAG

### Data Isolation

- Row-level security with `organizationId` on all tables
- Separate Pinecone namespaces per organization
- S3 object keys prefixed by organization

### AI Safety (V3 Trust Architecture)

- **High Confidence (≥80%)**: Content shown normally with green indicator
- **Medium Confidence (60-79%)**: Amber warning, user should verify
- **Low Confidence (<60%)**: Content NOT generated, sources shown instead
- All AI outputs include source attribution
- Audit mode tracks all AI involvement for compliance

---

## Development Phases

### Phase 1: Foundation ✅ Complete
- [x] Authentication and multi-tenancy
- [x] Dashboard with real-time data
- [x] Pipeline Kanban with drag-and-drop
- [x] Document upload and processing
- [x] RAG integration with semantic search
- [x] AI Writing Studio with Memory Assist

### Phase 2: Organization ✅ Complete
- [x] Fit Scoring Engine with 5-dimension analysis
- [x] FitScoreCard component (mini, compact, full variants)
- [x] Dashboard Fit Opportunities widget
- [x] Pipeline Table View with tabs, sorting, search, export
- [x] Program-based filtering with Dashboard widget
- [x] Executive Summary Reports with PDF export
- [x] User onboarding flow with tour overlay

### Phase 3: Compliance & Intelligence ✅ Complete
- [x] Compliance Guardian with commitment tracking
- [x] Automatic commitment extraction from award documents
- [x] Conflict detection with scheduled daily scans
- [x] Conflict resolution modal with audit trail
- [x] Funder Intelligence via ProPublica 990 API
- [x] Research Funder modal with auto-create
- [x] Enhanced giving history visualizations
- [x] Voice Analysis and style fingerprinting
- [x] Voice Settings page with radar chart
- [x] Writing Studio voice integration

### Phase 4: Scale (In Progress)
- [ ] Team collaboration features
- [ ] Email notifications and digests
- [ ] API access for integrations
- [ ] Mobile-responsive optimizations
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
- **Repository**: github.com/artbyoscar/grantsignal
- **Local Path**: C:\Users\OscarNuñez\Desktop\grantsignal
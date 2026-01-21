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

### Core Platform (Implemented)

- [x] **Dashboard** - Command center with key metrics, urgent actions, pipeline summary, and fit recommendations
- [x] **Pipeline Kanban** - Drag-and-drop grant workflow management across 8 stages
- [x] **Pipeline Table View** - Spreadsheet view with tabs (Active/Awarded/Declined/Completed), sorting, and CSV export
- [x] **Smart Discovery** - RFP parsing with AI-powered fit scoring against organizational profile
- [x] **Document Library** - Upload, process, and search organizational documents with health monitoring
- [x] **Document Processing** - Text extraction with confidence scoring and human review queue
- [x] **RAG Integration** - Semantic search across organizational memory via Pinecone
- [x] **AI Writing Studio** - Memory-assisted content generation with source attribution
- [x] **Reports & Analytics** - Monthly summary reports with PDF export
- [x] **User Onboarding** - 4-step guided setup with tour overlay
- [x] **Multi-tenant Architecture** - Organization-scoped data isolation
- [x] **Authentication** - Clerk integration with SSO support

### Fit Scoring Engine (Implemented)

- [x] **5-Dimension Analysis** - Mission alignment, capacity match, geographic fit, funder history, reusable content
- [x] **AI-Powered Mission Scoring** - Claude 3.5 Sonnet analyzes mission compatibility
- [x] **RAG Content Discovery** - Identifies reusable content from organizational memory
- [x] **Time Estimation** - Calculates estimated hours based on content reusability
- [x] **Smart Caching** - 24-hour cache with automatic refresh
- [x] **Batch Processing** - Calculate fit scores for multiple opportunities in parallel

### FitScoreCard Component

- [x] **Mini Variant** - 64px circular progress for grid cards
- [x] **Compact Variant** - Inline badges for list rows
- [x] **Full Variant** - Detailed breakdown with recommendations for detail pages
- [x] **Color Coding** - Green (85+), Blue (70-84), Amber (50-69), Red (<50)
- [x] **Interactive Tooltips** - Hover to see score breakdown

### Dashboard Widgets

- [x] **Quick Stats Row** - Active grants, pending decisions, YTD awarded, win rate
- [x] **Urgent Actions Panel** - Deadlines and compliance alerts
- [x] **Pipeline Summary** - Visual bar by stage with totals
- [x] **Recent Activity Feed** - Document uploads, status changes, AI generations
- [x] **Fit Opportunities Widget** - Top 5 personalized recommendations
- [x] **Monthly Summary Widget** - Quick metrics with link to full report

### AI Writing Studio Features

- [x] **Memory Assist** - Search and insert content from past proposals
- [x] **AI Generation** - Draft, refine, and expand content with Claude
- [x] **V3 Trust Architecture** - Confidence thresholds prevent hallucinations
- [x] **Source Attribution** - Every AI output shows its sources
- [x] **Auto-save** - Content saved automatically with status indicators

### Document Processing Pipeline

- [x] **S3 Upload** - Presigned URLs for secure direct upload
- [x] **Multi-format Support** - PDF, DOCX, DOC, TXT
- [x] **Confidence Scoring** - Automatic quality assessment (0-100)
- [x] **Human Review Queue** - Low-confidence documents flagged for review
- [x] **Vectorization** - Automatic embedding and Pinecone indexing
- [x] **Document Health Dashboard** - Visual stats for processing status

### Pipeline Table View

- [x] **Status Tabs** - Active, Awarded, Declined, Completed
- [x] **Sortable Columns** - Sort by any column with visual indicators
- [x] **Checkbox Selection** - Select multiple grants for bulk operations
- [x] **CSV Export** - Export selected or all grants
- [x] **Fit Score Column** - Optional column with color-coded scores
- [x] **URL-persisted Filters** - Shareable filtered views

### Reports & Analytics

- [x] **Monthly Summary Report** - Executive overview with key metrics
- [x] **Pipeline Breakdown** - Counts and totals by status
- [x] **Upcoming Deadlines** - Sorted list with urgency indicators
- [x] **Program Breakdown** - Metrics grouped by program area
- [x] **PDF Export** - Print-optimized layout

### Onboarding Flow

- [x] **Welcome Page** - Product value proposition with progress indicator
- [x] **Organization Setup** - Name, EIN, mission, program areas, geography
- [x] **Document Connection** - Cloud storage placeholders and drag-drop upload
- [x] **Processing Status** - Real-time progress dashboard
- [x] **Tour Overlay** - 4-step guided tour highlighting key features
- [x] **Onboarding Guard** - Automatic redirect for incomplete users

### Planned Features

- [ ] **Compliance Guardian** - Commitment tracking and conflict detection
- [ ] **Voice Analysis** - Style fingerprinting and tone matching
- [ ] **Funder Intelligence** - 990 data analysis via ProPublica API
- [ ] **Clipboard Formatting** - One-click copy with rich text preservation
- [ ] **Team Collaboration** - Real-time editing and comments
- [ ] **Email Notifications** - Deadline reminders and digest emails

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
| AI/LLM | Claude API (Anthropic) | Content generation, mission analysis |
| Embeddings | OpenAI text-embedding-3-large | Document vectorization |
| Background Jobs | Inngest | Document processing |

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
│   │   │   ├── opportunities/ # Smart Discovery
│   │   │   ├── pipeline/      # Grant pipeline (Kanban + Table)
│   │   │   ├── documents/     # Document library
│   │   │   ├── write/[grantId]/ # AI Writing Studio
│   │   │   ├── compliance/    # Compliance Guardian
│   │   │   ├── reports/       # Analytics & Reports
│   │   │   ├── onboarding/    # User onboarding flow
│   │   │   └── settings/      # Organization settings
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
│   │   ├── reports/           # Report components
│   │   └── shared/            # MemorySearch, TourOverlay
│   ├── server/
│   │   ├── routers/           # tRPC routers
│   │   │   ├── grants.ts      # Grant CRUD and filtering
│   │   │   ├── documents.ts   # Document management
│   │   │   ├── discovery.ts   # Smart Discovery + Fit Scoring
│   │   │   ├── ai.ts          # AI writing procedures
│   │   │   ├── reports.ts     # Report generation
│   │   │   ├── programs.ts    # Program management
│   │   │   ├── onboarding.ts  # Onboarding procedures
│   │   │   └── compliance.ts  # Compliance tracking
│   │   ├── services/          # Business logic
│   │   │   ├── ai/
│   │   │   │   ├── embeddings.ts
│   │   │   │   ├── rag.ts
│   │   │   │   └── writer.ts
│   │   │   └── documents/
│   │   │       ├── parser.ts
│   │   │       └── chunker.ts
│   │   └── context.ts         # Request context
│   ├── inngest/
│   │   ├── client.ts          # Inngest client
│   │   └── functions/         # Background jobs
│   │       └── process-document.ts
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
5. Document marked as COMPLETED or NEEDS_REVIEW

### AI Writing with Memory

1. User opens Writing Studio for a grant
2. Enters prompt (e.g., "Write a project narrative about youth programs")
3. System queries organizational memory via RAG
4. If relevant content found (confidence ≥60%):
   - Claude generates content using context
   - Sources displayed with relevance scores
   - User can accept, edit, or regenerate
5. If low confidence (<60%):
   - Sources shown for manual reference
   - No AI content generated (prevents hallucination)

### Grant Pipeline Management

1. Grants flow through 8 stages: Prospect → Researching → Writing → Review → Submitted → Pending → Awarded → Completed
2. Kanban view: Drag-and-drop updates status
3. Table view: Sort, filter, select, and export
4. Each card shows funder, amount, deadline, fit score
5. Deadline badges color-coded by urgency

### User Onboarding

1. New user redirected to /onboarding
2. Step 1: Welcome with product overview
3. Step 2: Organization setup (name, mission, programs)
4. Step 3: Connect documents (upload or cloud storage)
5. Step 4: Processing status with progress tracking
6. Tour overlay highlights key features on first dashboard visit

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

### Phase 1: Foundation (Complete)
- [x] Authentication and multi-tenancy
- [x] Dashboard with real-time data
- [x] Pipeline Kanban with drag-and-drop
- [x] Document upload and processing
- [x] RAG integration with semantic search
- [x] AI Writing Studio with Memory Assist

### Phase 2: Intelligence (Complete)
- [x] Fit Scoring Engine with 5-dimension analysis
- [x] FitScoreCard component (mini, compact, full variants)
- [x] Dashboard Fit Opportunities widget
- [x] Pipeline integration (cards, table, detail pages)
- [x] Pipeline Table View with tabs, sorting, export
- [x] Reports page with Monthly Summary
- [x] User onboarding flow with tour overlay

### Phase 3: Compliance & Scale (In Progress)
- [ ] Compliance Guardian with commitment tracking
- [ ] Conflict detection across applications
- [ ] Voice Analysis and preservation
- [ ] Funder Intelligence via 990 analysis
- [ ] Team collaboration features
- [ ] Email notifications and digests

### Phase 4: Polish & Launch
- [ ] Mobile-responsive optimizations
- [ ] API access for integrations
- [ ] Advanced analytics and benchmarking
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
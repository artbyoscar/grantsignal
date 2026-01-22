# GrantSignal

**The Organizational Memory Engine for Nonprofits**

Transform grant writing from 20 hours to 2 hours by capturing institutional knowledge and preventing compliance disasters.

---

## Current Status

**Phase 4: Scale** — Production Deployed ✅

| Milestone | Status |
|-----------|--------|
| V3 Trust Architecture | ✅ Complete |
| Confidence Scoring UI | ✅ Complete |
| Document Health Dashboard | ✅ Complete |
| TypeScript Build (0 errors) | ✅ Complete |
| Vercel Deployment | ✅ Live |
| Post-Launch Polish | 🔄 In Progress |
| Team Collaboration | ⏳ Planned |
| Email Notifications | ⏳ Planned |

**Production URL:** [grantsignal.vercel.app](https://grantsignal.vercel.app)  
**Last Updated:** January 2026

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Features](#features)
- [V3 Trust Architecture](#v3-trust-architecture)
- [Intelligence Layer](#intelligence-layer)
- [Key Workflows](#key-workflows)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Development Commands](#development-commands)
- [Deployment](#deployment)
- [Post-Launch Roadmap](#post-launch-roadmap)
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

## Features

### Killer Features

| Feature | Description | Why It Matters |
|---------|-------------|----------------|
| **Organizational Memory Engine** | Your grant history becomes searchable, queryable institutional knowledge | Zero knowledge loss from staff turnover |
| **Compliance Guardian** | Detect metric mismatches and timeline conflicts across all active applications | Prevents grant clawbacks and audit failures |
| **AI Writing Studio** | RAG-powered drafting with mandatory source attribution | 60-70% time reduction with traceable content |
| **Voice Analysis** | Preserve your organization's authentic tone across all content | Funders never know AI was involved |

### Core Capabilities

**Smart Discovery**
- RFP Parser with AI-powered requirement extraction
- Deadline extraction with confidence scoring
- Fit scoring against organizational profile (0-100)
- Federal API integration (Grants.gov)
- 990-first peer intelligence via ProPublica

**Pipeline Management**
- Kanban board with 8 grant stages (Prospect → Researching → Writing → Review → Submitted → Pending → Awarded → Completed)
- Drag-and-drop with optimistic updates
- Table view with sortable columns
- Quick view slide-out panel
- Deadline badges with urgency color coding

**Document Processing**
- Multi-format ingestion (DOCX, PDF, Google Docs)
- Parsing fallback chain with confidence scoring
- Document Health Dashboard with parse monitoring
- Background processing via Inngest
- Automatic document type classification

**AI Writing Studio**
- Split-pane layout (RFP requirements + editor)
- Memory Assist panel with relevance scoring
- Confidence thresholds gating generation
- Source attribution on all AI outputs
- Voice consistency indicator

**Compliance Guardian**
- Track commitments made to funders
- Detect conflicts before they become compliance issues
- Example: "You promised Funder A you would serve 500 youth, but told Funder B you would serve 600 in the same period. We catch that before you submit."
- Side-by-side conflict resolution modal
- CSV export for audits

**Reports and Analytics**
- Executive Summary with key metrics
- Pipeline Report with funnel visualization
- Win/Loss Analysis by funder, program, amount
- Funder Report with success rates
- PDF export with branding

---

## V3 Trust Architecture

GrantSignal implements a comprehensive Trust Architecture ensuring AI outputs are always reliable, traceable, and safe.

### Confidence Threshold System

| Score Range | UI Behavior | User Message |
|-------------|-------------|--------------|
| **80-100% (High)** | Green indicator, content displayed normally | "High confidence - based on N relevant documents" |
| **60-79% (Medium)** | Amber indicator, warning banner | "Medium confidence - verify accuracy before use" |
| **0-59% (Low)** | Red indicator, content NOT generated | "Cannot confidently generate. Review sources manually." |

### Trust Components

- **ConfidenceBadge**: Visual indicator with three-tier color system
- **SourceAttributionPanel**: Mandatory source attribution on ALL AI outputs
- **AIContentWrapper**: Enforces confidence thresholds, blocks low-confidence content
- **Document Health Dashboard**: Monitor parsing quality across organization
- **Audit Trail**: Complete logging for compliance

**All AI outputs include mandatory source attribution. This is non-negotiable.**

---

## Intelligence Layer

### How Documents Power GrantSignal

```
Document Upload
      ↓
[1] Parse (Unstructured.io → pdf-parse → OCR → Claude Vision)
      ↓
[2] Extract Metadata (dates, amounts, entities, document type)
      ↓
[3] Chunk Text (semantic boundaries, ~500 tokens each)
      ↓
[4] Generate Embeddings (text-embedding-3-large, 3072 dimensions)
      ↓
[5] Store in Pinecone (namespaced by organization)
      ↓
[6] Extract Commitments (for Compliance Guardian)
      ↓
[7] Analyze Voice (for Voice Fingerprint)
```

### When Writing

```
[A] User enters prompt in AI Writer
[B] System embeds prompt → queries Pinecone
[C] Top-k relevant chunks retrieved (similarity ≥ 0.7)
[D] Chunks + prompt sent to Claude
[E] Response generated with source attribution
[F] Confidence score calculated
[G] If confidence ≥ 60%, content displayed
[H] Sources shown for verification
```

### Document Type Detection

Documents are automatically classified using a hybrid approach:

1. **Keyword Matching (fast):** Scan for terms like "proposal", "budget", "progress report", "LOI"
2. **AI Classification (accurate):** Claude analyzes first page for ambiguous documents
3. **User Override:** Dropdown on document card allows manual correction

**Supported Types:** Proposal, Report, Budget, LOI, Award Letter, Agreement, Annual Report, Strategic Plan, Evaluation, Other

### Parse Confidence Calculation

| Component | Weight | Description |
|-----------|--------|-------------|
| Text Completeness | 40% | Percentage of text successfully extracted |
| Structure Preservation | 20% | Tables, headers, lists preserved |
| Date Extraction | 25% | Deadline and date accuracy |
| Entity Extraction | 15% | Names, amounts, organizations identified |

---

## Key Workflows

### 1. Compliance Guardian Workflow

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

**Value Delivered:** A single avoided audit finding is worth $100K+.

### 2. AI Writing with Trust Architecture

```
1. User uploads RFP or pastes URL
2. System parses requirements:
   - Extracts sections with word limits
   - Identifies deadline (critical)
   - Calculates fit score against org profile
3. User opens AI Writing Studio
4. System queries organizational memory for relevant content
5. Confidence scoring applied:
   - Retrieval confidence < 60%: BLOCK generation, show sources only
6. If confidence ≥ 60%, content generated:
   - ≥80%: Green indicator, content displayed normally
   - 60-79%: Amber warning, user prompted to verify
   - <60%: Content blocked, sources shown for manual review
7. All AI outputs wrapped with mandatory source attribution
8. Every generation logged to audit trail
```

**Value Delivered:** First draft in 2 hours instead of 20 hours, with traceable provenance.

### 3. Voice Analysis Workflow

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
6. Side-by-side comparison shows original vs. voice-matched
```

**Value Delivered:** Funders never detect AI involvement.

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 16 (App Router) | Server Components, streaming, Turbopack |
| Language | TypeScript 5.x (strict) | Type safety end-to-end |
| Styling | Tailwind CSS 4 + shadcn/ui | Utility-first, consistent design system |
| API | tRPC v11 | Type-safe RPC with React Query |
| Database | PostgreSQL (Neon) | Serverless, branching, proven reliability |
| ORM | Prisma 6.x | Type-safe queries, migrations |
| Vector DB | Pinecone | Managed RAG infrastructure |
| Auth | Clerk | Pre-built components, MFA, SSO |
| Storage | AWS S3 | Secure document storage |
| AI/LLM | Claude API (Anthropic) | Superior writing quality, 200K context |
| Embeddings | text-embedding-3-large | Best quality for RAG (3072 dimensions) |
| Doc Parsing | Unstructured.io + pdf-parse | Multi-engine fallback chain |
| Background Jobs | Inngest | Serverless, durable processing |
| Hosting | Vercel | Edge functions, excellent Next.js support |

---

## Architecture

### Data Isolation

- Row-level security with `organizationId` on all tables
- Separate Pinecone namespaces per organization
- S3 object keys prefixed by organization
- All queries include mandatory organization filter

### Document Processing Pipeline

```
Upload → S3 Storage → Parsing Fallback Chain → Confidence Scoring → 
Entity Extraction → Chunking → Embedding → Pinecone Upsert → 
Commitment Extraction → Knowledge Graph Update
```

**Parsing Fallback Chain:**
1. Unstructured.io (best quality)
2. pdf-parse (fast fallback)
3. Tesseract OCR (scanned docs)
4. Claude Vision API (complex layouts)
5. Human Review Queue (all engines failed)

### Risk Mitigations

| Risk | Problem | Solution |
|------|---------|----------|
| **Ingestion Friction** | Users upload messy scanned PDFs | Progressive value delivery, confidence scoring, human review queue |
| **Integration Heaviness** | Word/Salesforce plugins require heavy maintenance | Clipboard-first approach before native integrations |
| **Trust/Hallucination** | One fabricated statistic could cost an organization their award | Mandatory source attribution, confidence thresholds, constrained RAG |

---

## Installation

### Prerequisites

- Node.js 22.x LTS
- pnpm 9.x or 10.x
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

# Push database schema
pnpm prisma db push

# Generate Prisma client
pnpm prisma generate

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

# Email (Optional)
RESEND_API_KEY=...
FROM_EMAIL=notifications@grantsignal.com
```

---

## Project Structure

```
grantsignal/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Protected routes
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── pipeline/      # Grant pipeline Kanban
│   │   │   ├── documents/     # Document management
│   │   │   ├── compliance/    # Compliance Guardian
│   │   │   ├── reports/       # Analytics and reports
│   │   │   ├── team/          # Team management
│   │   │   ├── opportunities/ # Smart Discovery
│   │   │   ├── write/         # AI Writing Studio
│   │   │   └── settings/      # Organization settings
│   │   └── api/
│   │       ├── trpc/          # tRPC handler
│   │       ├── inngest/       # Background jobs
│   │       └── v1/            # REST API
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── ai/                # Trust Architecture components
│   │   ├── dashboard/         # Dashboard widgets
│   │   ├── pipeline/          # Kanban components
│   │   ├── writing/           # AI Writing Studio
│   │   ├── compliance/        # Compliance Guardian
│   │   ├── documents/         # Document management
│   │   └── voice/             # Voice Analysis
│   ├── server/
│   │   ├── routers/           # tRPC routers
│   │   └── services/          # Business logic
│   │       ├── ai/            # RAG, embeddings, voice
│   │       ├── documents/     # Parsing, processing
│   │       └── compliance/    # Commitment tracking
│   ├── lib/                   # Utilities
│   │   ├── trpc/              # tRPC client setup
│   │   ├── pinecone.ts        # Vector DB client
│   │   └── s3.ts              # Storage utilities
│   ├── types/                 # TypeScript definitions
│   │   └── client-types.ts    # Client-safe shared types
│   └── inngest/               # Background job definitions
└── public/
```

---

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production (includes prisma generate) |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run unit tests |
| `pnpm prisma studio` | Open Prisma Studio |
| `pnpm prisma db push` | Push schema changes |

---

## Deployment

### Vercel Deployment

1. **Link project:**
   ```bash
   pnpm dlx vercel link
   ```

2. **Set environment variables** in Vercel dashboard (Settings → Environment Variables)
   - Ensure variables are set for **Production** environment
   - Link Team variables to Project if using shared variables

3. **Push database schema:**
   ```bash
   pnpm prisma db push
   ```

4. **Deploy:**
   ```bash
   pnpm dlx vercel --prod
   ```

### Build Requirements

- Prisma Client generated during build (`prisma generate && next build`)
- Client components cannot import from `@prisma/client` directly
- Use `src/types/client-types.ts` for shared types in client components
- Dashboard routes use `force-dynamic` to skip prerendering

### Inngest Configuration

After deployment, register the Inngest webhook:
1. Visit https://app.inngest.com
2. Add your production URL: `https://grantsignal.vercel.app/api/inngest`
3. Verify events are being received

---

## Post-Launch Roadmap

### Completed ✅
- V3 Trust Architecture
- Confidence Scoring UI
- Document Health Dashboard
- TypeScript strict mode
- Production deployment
- Team management
- Reports framework

### In Progress 🔄

**Week 1-2: Critical Fixes**
- Document upload progress indicators
- Opportunities file upload
- Settings page implementation
- Add Commitment button fix

**Week 3-4: UX Polish**
- Add Grant modal in Pipeline
- Writer link in sidebar navigation
- Document preview implementation
- Document type dropdown
- Onboarding tour visibility fix

### Planned ⏳

**Phase 5: Intelligence**
- Pipeline Report widget
- Win/Loss Analysis widget
- Funder Report widget
- Advanced voice matching

**Phase 6: Scale**
- Email notifications and digests
- Browser extension for clipboard
- Salesforce integration
- API access for partners

---

## Design System

### Color Palette
- **Background:** #0f172a (deep navy)
- **Card surfaces:** #1e293b (slate)
- **Primary accent:** #3b82f6 (electric blue)
- **Success:** #22c55e (green)
- **Warning:** #f59e0b (amber)
- **Error:** #ef4444 (red)
- **Text:** #f8fafc (white), #94a3b8 (muted)

### Design Philosophy
"Bloomberg Terminal for Nonprofits" — information density and professional aesthetics over consumer-grade simplicity. Power users spend hours daily in the application.

---

## License

Copyright 2026 GrantSignal. All rights reserved.

---

## Contact

- **Developer:** Oscar Nuñez
- **Repository:** [github.com/artbyoscar/grantsignal](https://github.com/artbyoscar/grantsignal)
- **Production:** [grantsignal.vercel.app](https://grantsignal.vercel.app)
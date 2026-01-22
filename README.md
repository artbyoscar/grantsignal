# GrantSignal

**The Organizational Memory Engine for Nonprofits**

Transform grant writing from 20 hours to 2 hours by capturing institutional knowledge and preventing compliance disasters.

---

## Current Status

**Phase 4: Scale** — Production Deployment In Progress

| Milestone | Status |
|-----------|--------|
| V3 Trust Architecture | ✅ Complete |
| Confidence Scoring UI | ✅ Complete |
| Document Health Dashboard | ✅ Complete |
| TypeScript Build (0 errors) | ✅ Complete |
| Vercel Deployment | 🔄 In Progress |
| Team Collaboration | ⏳ Planned |
| Email Notifications | ⏳ Planned |

**Last Updated:** January 2026

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
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
- [Deployment](#deployment)
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
- Kanban board with 8 grant stages
- Drag-and-drop with optimistic updates
- Table view with sortable columns
- Quick view slide-out panel

**Document Processing**
- Multi-format ingestion (DOCX, PDF, Google Docs)
- Parsing fallback chain with confidence scoring
- Document Health Dashboard with parse monitoring
- Background processing via Inngest

**AI Writing Studio**
- Split-pane layout (RFP requirements + editor)
- Memory Assist panel with relevance scoring
- Confidence thresholds gating generation
- Source attribution on all AI outputs

**Compliance Guardian**
- Commitment extraction from documents
- Cross-application conflict detection
- Side-by-side conflict resolution modal
- CSV export for audits

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
│   │   │   ├── dashboard/
│   │   │   ├── pipeline/
│   │   │   ├── documents/
│   │   │   ├── compliance/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   └── api/
│   │       ├── trpc/          # tRPC handler
│   │       └── inngest/       # Background jobs
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── ai/                # Trust Architecture components
│   │   ├── dashboard/         # Dashboard widgets
│   │   ├── pipeline/          # Kanban components
│   │   ├── writing/           # AI Writing Studio
│   │   └── compliance/        # Compliance Guardian
│   ├── server/
│   │   ├── routers/           # tRPC routers
│   │   └── services/          # Business logic
│   ├── lib/                   # Utilities
│   ├── types/                 # TypeScript definitions
│   │   └── client-types.ts    # Client-safe shared types
│   └── test/                  # Test suite
└── public/
```

---

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
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

3. **Push database schema:**
   ```bash
   pnpm prisma db push
   ```

4. **Deploy:**
   ```bash
   pnpm dlx vercel --prod
   ```

### Build Requirements

- Prisma Client must be generated during build
- Client components cannot import from `@prisma/client` directly
- Use `src/types/client-types.ts` for shared types in client components

---

## Roadmap

### Phase 1: Foundation ✅
- Authentication and multi-tenancy
- Dashboard with real-time data
- Pipeline Kanban with drag-and-drop
- Document upload and processing
- RAG integration with semantic search

### Phase 2: Organization ✅
- Pipeline Table View with tabs
- Program-based filtering
- Executive Summary Reports
- CSV/PDF export functionality

### Phase 3: Compliance & Intelligence ✅
- Compliance Guardian with commitment tracking
- Conflict detection across applications
- Funder Intelligence via 990 analysis
- Voice Analysis and preservation

### Phase 4: Scale (In Progress)
- [x] V3 Trust Architecture
- [x] Confidence Scoring UI
- [x] Document Health Dashboard
- [x] TypeScript strict mode compliance
- [x] Build optimization
- [ ] Production deployment to Vercel
- [ ] Team collaboration features
- [ ] Email notifications
- [ ] API access for integrations

---

## License

Copyright 2026 GrantSignal. All rights reserved.

---

## Contact

- **Developer**: Oscar Nuñez
- **Repository**: [github.com/artbyoscar/grantsignal](https://github.com/artbyoscar/grantsignal)
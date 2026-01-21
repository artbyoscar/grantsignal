# GrantSignal

**The Organizational Memory Engine for Nonprofits**

GrantSignal transforms how nonprofits manage their entire grant lifecycle by creating a living knowledge base that learns your organization's voice, remembers every commitment made to every funder, and assembles new proposals from proven content.

![GrantSignal Pipeline](https://img.shields.io/badge/Status-In%20Development-blue)
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

- [x] **Dashboard** - Command center with key metrics, urgent actions, and pipeline summary
- [x] **Pipeline Kanban** - Drag-and-drop grant workflow management across 8 stages
- [x] **Smart Discovery** - RFP parsing with fit scoring against organizational profile
- [x] **Document Library** - Upload, process, and search organizational documents
- [x] **Document Processing** - Text extraction with confidence scoring and human review queue
- [x] **RAG Integration** - Semantic search across organizational memory via Pinecone
- [x] **AI Writing Studio** - Memory-assisted content generation with source attribution
- [x] **Multi-tenant Architecture** - Organization-scoped data isolation
- [x] **Authentication** - Clerk integration with SSO support

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

### In Progress

- [ ] **Pipeline Table View** - Spreadsheet view with sorting and filtering
- [ ] **Program-based Filtering** - Organize grants by program area
- [ ] **Executive Reports** - Monthly summaries for leadership
- [ ] **Compliance Guardian** - Commitment tracking and conflict detection

### Planned

- [ ] **Voice Analysis** - Style fingerprinting and tone matching
- [ ] **Funder Intelligence** - 990 data analysis via ProPublica API
- [ ] **Clipboard Formatting** - One-click copy with rich text preservation
- [ ] **Export Functions** - CSV, PDF, and DOCX export

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
| AI/LLM | Claude API (Anthropic) | Content generation |
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
│   │   │   ├── pipeline/      # Grant pipeline (Kanban)
│   │   │   ├── documents/     # Document library
│   │   │   ├── write/[grantId]/ # AI Writing Studio
│   │   │   ├── compliance/    # Compliance Guardian
│   │   │   └── reports/       # Analytics & Reports
│   │   └── api/
│   │       ├── trpc/          # tRPC API handler
│   │       └── inngest/       # Background job handler
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── layout/            # Shell, sidebar, header
│   │   ├── dashboard/         # Dashboard widgets
│   │   ├── pipeline/          # Kanban components
│   │   ├── documents/         # Document components
│   │   ├── writing/           # Writing Studio components
│   │   └── shared/            # Shared components (MemorySearch)
│   ├── server/
│   │   ├── routers/           # tRPC routers
│   │   │   ├── grants.ts
│   │   │   ├── documents.ts
│   │   │   ├── discovery.ts
│   │   │   ├── ai.ts
│   │   │   └── compliance.ts
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
│   │   └── utils.ts           # Utilities
│   └── types/                 # TypeScript definitions
└── public/                    # Static assets
```

---

## Key Workflows

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
2. Drag-and-drop updates status
3. Each card shows funder, amount, deadline
4. Deadline badges color-coded by urgency
5. Click "Open in Writer" to draft content

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

## Roadmap

### Phase 1: Foundation (Complete)
- [x] Authentication and multi-tenancy
- [x] Dashboard with real-time data
- [x] Pipeline Kanban with drag-and-drop
- [x] Document upload and processing
- [x] RAG integration with semantic search
- [x] AI Writing Studio with Memory Assist

### Phase 2: Organization (In Progress)
- [ ] Pipeline Table View with tabs (Active/Awarded/Declined/Completed)
- [ ] Program-based filtering and organization
- [ ] Executive Summary Reports
- [ ] CSV/PDF export functionality

### Phase 3: Compliance & Intelligence
- [ ] Compliance Guardian with commitment tracking
- [ ] Conflict detection across applications
- [ ] Funder Intelligence via 990 analysis
- [ ] Voice Analysis and preservation

### Phase 4: Scale
- [ ] Team collaboration features
- [ ] Email notifications and digests
- [ ] API access for integrations
- [ ] Mobile-responsive optimizations

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
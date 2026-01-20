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

### Implemented (v0.1)

- [x] **Dashboard** - Command center with key metrics and urgent actions
- [x] **Pipeline Kanban** - Drag-and-drop grant workflow management
- [x] **Smart Discovery** - RFP parsing with fit scoring (mock implementation)
- [x] **Multi-tenant Architecture** - Organization-scoped data isolation
- [x] **Authentication** - Clerk integration with SSO support

### In Progress

- [ ] **Document Upload** - S3 integration with presigned URLs
- [ ] **Document Processing** - Text extraction with confidence scoring
- [ ] **RAG Integration** - Pinecone vector search for organizational memory
- [ ] **Compliance Guardian** - Commitment tracking and conflict detection

### Planned

- [ ] **AI Writing Studio** - Voice-preserving content generation
- [ ] **Voice Analysis** - Style fingerprinting and tone matching
- [ ] **Funder Intelligence** - 990 data analysis via ProPublica API
- [ ] **Clipboard Formatting** - One-click copy with rich text preservation

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
| Embeddings | text-embedding-3-large | Document vectorization |
| Background Jobs | Inngest | Document processing |

---

## Getting Started

### Prerequisites

- Node.js 22.x LTS
- pnpm 9.x
- PostgreSQL (or Neon account)
- Clerk account
- AWS account (for S3)

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
```

---

## Project Structure

```
grantsignal/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data script
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (auth)/        # Authentication pages
│   │   ├── (dashboard)/   # Protected routes
│   │   │   ├── dashboard/
│   │   │   ├── opportunities/
│   │   │   ├── pipeline/
│   │   │   ├── documents/
│   │   │   └── compliance/
│   │   └── api/
│   │       └── trpc/      # tRPC API handler
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   ├── layout/        # Shell, sidebar, header
│   │   ├── dashboard/     # Dashboard widgets
│   │   └── pipeline/      # Kanban components
│   ├── server/
│   │   ├── routers/       # tRPC routers
│   │   ├── context.ts     # Request context
│   │   └── services/      # Business logic
│   ├── lib/
│   │   ├── trpc/          # tRPC client setup
│   │   └── utils.ts       # Utilities
│   └── types/             # TypeScript definitions
└── public/                # Static assets
```

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

### AI Safety

- Confidence thresholds prevent low-quality generation
- Source attribution required on all AI outputs
- Audit mode tracks all AI involvement for compliance

---

## Contributing

This is a proprietary project. Contributions are limited to authorized team members.

---

## License

Copyright © 2026 GrantSignal. All rights reserved.

---

## Contact

- **Developer**: Oscar Nuñez
- **Email**: art.by.oscar.n@gmail.com
- **Repository**: github.com/artbyoscar/grantsignal
# CLAUDE.md - Standing Instructions for GrantSignal

## Permissions
- You have permission to read, write, and modify any files in this repository
- You have permission to run terminal commands including pnpm, git, and prisma
- You have permission to create new files and directories
- You have permission to run tests without asking

## Auto-Approve Actions
- File edits in src/, prisma/, docs/, and test directories
- Running pnpm commands (dev, build, test, lint)
- Running git commands (add, commit, status, diff)
- Running prisma commands (db push, generate, studio)
- Creating new components, tests, and documentation

## Development Context
- Framework: Next.js 15 with App Router
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS + shadcn/ui
- API: tRPC v11
- Database: PostgreSQL with Prisma
- Import alias: "@/" (not "~/")
- Package manager: pnpm

## When Fixing Errors
- Fix the error and continue without asking
- If multiple files need the same fix, apply to all
- Run tests after fixes to verify
- Commit working code with descriptive messages

## Code Standards
- Use "use client" only when necessary
- Prefer Server Components
- All AI outputs must have source attribution
- Confidence thresholds: ≥80% high, 60-79% medium, <60% low

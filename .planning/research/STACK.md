# Technology Stack

**Project:** FilmIntern
**Researched:** 2026-03-16
**Overall Confidence:** MEDIUM (versions from training data, not live registry -- verify with `npm view <pkg> version` before installing)

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | ^15.x | Full-stack framework (UI + API routes) | App Router is mature and stable. API routes handle file uploads and LLM calls server-side without a separate backend. Single deployment unit. For a personal tool, the simplicity of one codebase is decisive. | HIGH (choice), MEDIUM (version) |
| React | ^19.x | UI library | Ships with Next.js 15. Server Components reduce client bundle. Suspense handles streaming LLM responses naturally. | HIGH (choice), MEDIUM (version) |
| TypeScript | ^5.x | Type safety | Non-negotiable for a project with structured data models (project types, analysis schemas, document formats). Catches prompt/response shape errors at build time. | HIGH |

### UI

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | ^4.x | Styling | Fast iteration for a personal tool. No design system overhead. v4 uses CSS-first config. | HIGH (choice), MEDIUM (version) |
| shadcn/ui | latest (CLI-installed) | Component library | Not a dependency -- copies components into your codebase. File upload dropzones, cards for analysis results, tabs for project types all come pre-built. Customizable without fighting a library. | HIGH |
| Lucide React | ^0.4x | Icons | Default icon set for shadcn/ui. Consistent, tree-shakeable. | HIGH |

### File Handling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Native Web APIs (FormData + Route Handlers) | N/A | File upload endpoint | For a single-user tool, Next.js Route Handlers with FormData parsing are sufficient. No need for UploadThing or S3 -- files go to local disk or a simple blob store. Avoid external upload services for a personal tool. | HIGH |
| pdf-parse | ^1.1.x | PDF text extraction | Screenplays and scripts often come as PDFs. This library extracts text reliably. Lightweight, no native dependencies. | MEDIUM |
| mammoth | ^1.8.x | DOCX text extraction | Some transcripts arrive as Word docs. Mammoth extracts clean text without formatting noise. | MEDIUM |

### AI / LLM Integration

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @anthropic-ai/sdk | ^0.30+ | Anthropic Claude API client | Claude is the best model for long-form structured analysis (large context window, strong instruction following). The official SDK handles streaming, retries, and typing. Use Claude 3.5 Sonnet or Claude 4 Sonnet for the analysis -- good balance of quality and cost for a personal tool. | HIGH (choice), LOW (exact version -- SDK iterates fast) |
| Vercel AI SDK (`ai`) | ^4.x | Streaming UI integration | `useChat` and `streamText` handle the streaming response pipe from server to client cleanly. Framework-agnostic but has first-class Next.js support. Provides the Anthropic provider adapter so you get typed streaming with minimal glue code. | HIGH (choice), MEDIUM (version) |

### Data / Storage

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| SQLite via better-sqlite3 | ^11.x | Local database | Single-user personal tool does NOT need Postgres. SQLite is zero-config, file-based, fast for single-writer workloads. Stores project metadata, analysis history, uploaded file references. | HIGH |
| Drizzle ORM | ^0.35+ | Database access layer | Type-safe SQL, lightweight, no code generation step (unlike Prisma). SQLite driver is first-class. Migrations are straightforward. For a small schema (projects, uploads, analyses), Drizzle is the right weight class. | HIGH (choice), MEDIUM (version) |
| Local filesystem | N/A | File storage | Uploaded transcripts and scripts stored as files on disk. For a personal tool, S3 is overengineering. A `./uploads/` directory with UUID-named files is sufficient. | HIGH |

### Document Generation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React-PDF (@react-pdf/renderer) | ^4.x | PDF document generation | Generate downloadable analysis reports, treatments, and coverage documents as PDFs. Uses React components to define document layout -- familiar DX. | MEDIUM |
| docx (npm: docx) | ^9.x | DOCX generation | Some outputs (treatments, outlines) are better as editable Word docs. This library creates DOCX from JS objects without templates. | MEDIUM |
| Marked or remark | latest | Markdown processing | LLM outputs are typically markdown. Parse and render structured sections from markdown for display and document generation. | HIGH |

### Dev Tooling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| ESLint | ^9.x | Linting | Flat config format (eslint.config.js). Next.js ships eslint-config-next. | HIGH |
| Prettier | ^3.x | Code formatting | Consistency. No debates. | HIGH |
| Vitest | ^2.x | Testing | Fast, Vite-based, TypeScript-native. Better DX than Jest for modern projects. | HIGH (choice), MEDIUM (version) |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js | Remix/React Router v7 | Next.js has larger ecosystem, more examples for AI integrations, better Vercel AI SDK support. Remix is excellent but smaller community for this use case. |
| Framework | Next.js | SvelteKit | Svelte has great DX but smaller ecosystem for AI/LLM tooling. Claude SDK examples are React-heavy. |
| Database | SQLite | PostgreSQL | Postgres is overkill for single-user. Requires running a server or using a hosted service. SQLite is zero-ops. |
| Database | SQLite | Turso (libSQL) | Turso adds cloud sync which is unnecessary for a personal local tool. Adds a dependency and account. |
| ORM | Drizzle | Prisma | Prisma's code generation step is annoying, client is heavier, and SQLite support historically had quirks. Drizzle is leaner and more SQL-transparent. |
| File Upload | Native Route Handlers | UploadThing | UploadThing is great for SaaS with multiple users. For a personal tool, it adds an external service dependency and cost for no benefit. |
| File Upload | Native Route Handlers | tus (resumable uploads) | Screenplay PDFs and transcript files are small (KB to low MB). Resumable uploads solve a problem that doesn't exist here. |
| AI SDK | Vercel AI SDK | LangChain | LangChain adds massive abstraction for what is fundamentally "send prompt, get structured response." For direct API calls with streaming, the Vercel AI SDK is lighter and more predictable. LangChain's abstractions would obscure the prompt engineering that is the core value of this tool. |
| AI SDK | @anthropic-ai/sdk | OpenAI SDK | Claude's large context window (200K tokens) is critical for full-screenplay analysis. GPT-4 has smaller context. Anthropic SDK is purpose-built. Keep OpenAI as a fallback option but don't design around it. |
| Styling | Tailwind + shadcn | Material UI / Chakra UI | Component libraries add weight and opinionated styling. For a personal tool, shadcn gives you owned components you can freely modify. MUI's Java-like API is heavy for a lightweight tool. |
| PDF Generation | React-PDF | Puppeteer/Playwright | Headless browser PDF generation is resource-heavy and fragile. React-PDF generates PDFs directly from components without a browser. |
| Doc Generation | docx (npm) | officegen | officegen is unmaintained. docx is actively maintained and well-typed. |

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| **NextAuth / Auth.js** | No auth needed. Single-user personal tool. Adding auth adds complexity for zero benefit in v1. If you ever need it, add it later. |
| **Supabase / Firebase** | Cloud database services add latency, cost, and account management for a tool that works fine with local SQLite. |
| **Redis** | No caching layer needed. Single user, no session management, no rate limiting against yourself. |
| **Docker (for dev)** | Overengineering for a personal tool. `npm run dev` is sufficient. Consider Docker only if you want to self-host later. |
| **LangChain** | Adds layers of abstraction that obscure prompt engineering -- the core IP of this tool. Use the AI SDK directly. |
| **Zustand / Redux** | React Server Components + URL state + React Context cover all state needs. No client-side state management library needed. |
| **Tailwind UI (paid)** | shadcn/ui covers the same ground for free and is more customizable. |
| **Turborepo / Monorepo tooling** | One app. One codebase. Monorepo tooling solves multi-package problems you don't have. |

## Project Structure

```
filmintern/
  src/
    app/                    # Next.js App Router
      page.tsx              # Home / project type selection
      api/
        upload/route.ts     # File upload endpoint
        analyze/route.ts    # LLM analysis endpoint (streaming)
        generate/route.ts   # Document generation endpoint
      projects/
        [type]/page.tsx     # Project type-specific upload + results
    components/
      ui/                   # shadcn/ui components
      upload/               # File upload components
      analysis/             # Analysis display components
      documents/            # Document preview/download components
    lib/
      ai/                   # Prompt templates per project type
        prompts/            # Prompt engineering -- core IP
        providers.ts        # AI SDK provider config
      db/                   # Drizzle schema + queries
      files/                # File parsing (PDF, DOCX, plain text)
      documents/            # PDF/DOCX generation
    types/                  # TypeScript types (project types, analysis schemas)
  uploads/                  # Uploaded files (gitignored)
  data/                     # SQLite database file (gitignored)
  drizzle/                  # Migration files
```

## Installation

```bash
# Scaffold
npx create-next-app@latest filmintern --typescript --tailwind --eslint --app --src-dir

# UI components
npx shadcn@latest init
npx shadcn@latest add button card tabs textarea dropdown-menu dialog

# Database
npm install better-sqlite3 drizzle-orm
npm install -D drizzle-kit @types/better-sqlite3

# AI / LLM
npm install @anthropic-ai/sdk ai @ai-sdk/anthropic

# File parsing
npm install pdf-parse mammoth
npm install -D @types/pdf-parse

# Document generation
npm install @react-pdf/renderer docx

# Dev tools
npm install -D vitest @testing-library/react
```

## Environment Variables

```env
# .env.local (gitignored)
ANTHROPIC_API_KEY=sk-ant-...

# Optional: fallback model
# OPENAI_API_KEY=sk-...
```

## Key Architecture Decisions Driven by Stack

1. **Server-side LLM calls only.** API keys never reach the client. Route Handlers call the Anthropic API and stream responses back. The Vercel AI SDK's `streamText` + `useChat` pattern handles this cleanly.

2. **File parsing happens server-side.** Uploaded files are saved to disk, then parsed (PDF to text, DOCX to text) in the Route Handler before being sent to the LLM. The client never sees raw file contents.

3. **Prompt templates are code, not database entries.** The core value of this tool is the prompt engineering per project type. Store prompts as TypeScript files in `src/lib/ai/prompts/` so they get version control, type checking, and easy iteration.

4. **SQLite for persistence, filesystem for files.** Analysis results and metadata in SQLite. Uploaded files and generated documents on disk. Simple, debuggable, no external services.

5. **Streaming responses.** Film analysis on a full screenplay can take 30-60 seconds. Streaming shows output as it generates, making the wait tolerable. The Vercel AI SDK makes this trivial with Next.js.

## Version Verification Note

Versions listed are based on training data as of early 2025. Before installing, verify current stable versions:

```bash
npm view next version
npm view react version
npm view @anthropic-ai/sdk version
npm view ai version
npm view drizzle-orm version
npm view better-sqlite3 version
npm view tailwindcss version
```

Use `^` ranges in package.json to allow minor version updates.

## Sources

- Next.js documentation (nextjs.org/docs) -- App Router, Route Handlers, Server Components
- Vercel AI SDK documentation (sdk.vercel.ai) -- streaming, Anthropic provider
- Anthropic SDK (github.com/anthropics/anthropic-sdk-typescript) -- client usage
- Drizzle ORM documentation (orm.drizzle.team) -- SQLite driver, schema definition
- shadcn/ui documentation (ui.shadcn.com) -- component installation, theming

**Confidence note:** All technology choices are HIGH confidence based on established ecosystem patterns. Exact version numbers are MEDIUM confidence (training data, not live registry). Run the verification commands above before scaffolding.

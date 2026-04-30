# JEdith UI — Project Rules & Guidelines

> AI-powered theme-aware UI code & presentation generator.
> All user data lives in the browser (IndexedDB via Dexie.js). API routes are stateless — they proxy to Ollama and return results. No server-side database.

---

## Architecture Overview

```
Browser (Dexie/IndexedDB)  →  Stateless API Routes  →  Ollama (local or cloud)
       ↑ stores results                                      ↓ returns code/slides
```

- **Client persistence**: All palettes, chats, messages, code versions, and slide versions are stored in IndexedDB using Dexie.js (`src/lib/db-client.ts`).
- **Stateless API routes**: Every `/api/*` route receives all context in the request body, calls Ollama or a parser, and returns results. No database reads or writes on the server.
- **Ollama**: Supports both local (`http://localhost:11434`) and cloud endpoints with Bearer token auth. Configured via `OLLAMA_BASE_URL`, `OLLAMA_API_KEY`, and `OLLAMA_DEFAULT_MODEL` in `.env`.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, Turbopack) | 16.1.6 |
| Language | TypeScript | 5.5 |
| UI | React | 19.2 |
| Styling | Tailwind CSS | 3.4 |
| Icons | lucide-react | 0.400 |
| Client DB | Dexie.js (IndexedDB) | 4.4.2 |
| Validation | Zod | 3.23 |
| AI Runtime | Ollama (REST API) | local/cloud |
| Slide Engine | Marp Core + CLI | 4.0 |
| Data Fetching | SWR | 2.2 |
| Image Upload | react-dropzone | 14.2 |
| Fonts | System fonts only (no network) | — |
| Theme | Dark mode permanent (`<html class="dark">`) | — |

---

## Code Quality Standards

- Use **TypeScript** for all new files — no `.js` or `.jsx`.
- Follow existing code style and patterns in the file you're editing.
- Add proper type definitions — avoid `any` unless there's a documented reason.
- Include error handling for all API routes and async operations.
- Use meaningful variable and function names.
- **DRY — extract shared UI**: If the same UI or logic appears in more than one place, create a reusable component (or hook/utility). Do not duplicate code.
- **Remove unused code**: After completing a task, remove unused imports, variables, functions, and files. No dead code, no commented-out blocks.
- **File length limit (200 lines)**: Split files that exceed 200 lines into smaller components, helpers, or modules.

---

## File Organization

```
src/
├── app/                          # Next.js App Router pages + API routes
│   ├── api/                      # Stateless API routes (Ollama proxy, parsers)
│   ├── chat/                     # Code generation chat pages
│   ├── presentations/            # Marp slide generation pages
│   ├── palettes/                 # Palette CRUD pages
│   ├── swagger/                  # OpenAPI import page
│   └── page.tsx                  # Dashboard
├── components/
│   ├── chat/                     # Chat thread, message bubbles, preview
│   ├── generator/                # Model/framework/library selectors, prompt input
│   ├── layout/                   # Sidebar, Logo, OllamaStatus
│   ├── palette/                  # PaletteCard, PaletteEditor, ColorSwatch
│   └── ui/                       # Shared primitives (tabs, modals)
├── hooks/                        # useChat, usePalettes, useOllamaModels, usePreview
├── lib/
│   ├── ai/                       # Code & slide generation pipelines, prompts, library configs
│   ├── marp/                     # Marp preview, export, theme injection
│   ├── parsers/                  # CSS parser, Swagger parser
│   ├── post-process/             # Code extraction, validation, theme compliance
│   ├── preview/                  # HTML preview builder, CDN manager, framework wrappers
│   ├── skill/                    # Claude skill ZIP generator, templates
│   ├── db-client.ts              # Dexie.js IndexedDB schema + helpers
│   ├── ollama.ts                 # Ollama REST API client
│   └── utils.ts                  # cn(), timeAgo(), generateChatName(), etc.
└── types/index.ts                # All shared types and enums
```

### Conventions

- **Components**: `src/components/[category]/ComponentName.tsx`
- **Hooks**: `src/hooks/useHookName.ts`
- **Utilities**: `src/lib/module-name.ts` or `src/lib/[domain]/file.ts`
- **Types**: All shared types live in `src/types/index.ts`. Add new types there, grouped by domain (Ollama, Palette, Chat, Generation, Preview, Marp, Swagger, Skill).
- **API routes**: `src/app/api/[feature]/route.ts` — always stateless, always Zod-validated.

---

## IndexedDB / Dexie Schema

All CRUD operations happen client-side via hooks. Never read from or write to a server database.

| Table | Key Fields | Hook |
|-------|-----------|------|
| `palettes` | id, name, source, colors[], timestamps | `usePalettes()` |
| `chats` | id, name, type, framework, libraries[], modelName, paletteId | `useChats(type?)`, `useChatThread(id)` |
| `messages` | id, role, content, imageBase64?, chatId | `useChatMessages(chatId)` |
| `codeVersions` | id, code, language, version, modelName, messageId, chatId | Enriched in `useChatMessages` |
| `slideVersions` | id, markdown, slideCount, version, modelName, messageId, chatId | Enriched in `useChatMessages` |
| `swaggerSpecs` | id, name, specJson, endpoints[] | Direct Dexie queries |

### Rules

- Use `db` from `@/lib/db-client` for all database operations.
- Use `generateId()` and `nowISO()` from `@/lib/db-client` — never generate IDs manually.
- Cascade deletes in transactions (e.g. deleting a palette also deletes its chats, messages, and versions).
- Colors are embedded in the palette document (not a separate table).

---

## API Route Standards

All API routes are **stateless** — they accept full context in the request body and return results without touching any database.

### Pattern

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Schema = z.object({ /* ... */ });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const result = await doWork(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
```

### Rules

- Always validate with Zod before processing.
- Never import `db` or Dexie in API routes — they run on the server, IndexedDB is browser-only.
- Return structured JSON errors with meaningful messages.
- For binary responses (ZIP, PPTX), use `new NextResponse(buffer as any, { headers })`.

---

## Ollama Integration

- **Client module**: `src/lib/ollama.ts` — all Ollama calls go through `chat()`, `chatStream()`, `analyzeImage()`, or `listModels()`.
- **Auth**: `buildHeaders()` injects `Authorization: Bearer <key>` when `OLLAMA_API_KEY` is set.
- **Default model**: `OLLAMA_DEFAULT_MODEL` env var (currently `gemma4:31b-cloud`).
- **Model classification**: Models are auto-tagged with badges: `recommended`, `vision`, `code`, `large`.
- **Vision models**: Detected by family (`gemma4`, `llava`, etc.) — used for screenshot-to-palette extraction and image-to-code generation.

---

## Brand Colors & Design

### JEdith Palette — Earthy Forest Theme

| Token | Hex | Source Scale | Usage |
|-------|-----|-------------|-------|
| `jedith-forest` | `#344620` | black-forest-800 | Primary — headers, buttons, nav, sidebar |
| `jedith-sage` | `#eaeedd` | olive-leaf-100 | Secondary — subtle backgrounds, badges |
| `jedith-copper` | `#d57a2a` | copperwood-500 | Accent — CTAs, highlights, active states |
| `jedith-forest-light` | `#4e6a2f` | black-forest-700 | Hover state for forest elements |
| `jedith-forest-dark` | `#1a2310` | black-forest-900 | Deeper forest for gradients |
| `jedith-forest-deeper` | `#12190b` | black-forest-950 | Deepest forest |

### Full Color Scales

Five complete color scales are available as Tailwind utility classes:

| Scale | Prefix | Character |
|-------|--------|-----------|
| Olive Leaf | `olive-leaf-{50-950}` | Muted sage greens |
| Black Forest | `black-forest-{50-950}` | Deep forest greens |
| Cornsilk | `cornsilk-{50-950}` | Warm golden yellows |
| Sunlit Clay | `sunlit-clay-{50-950}` | Amber/orange tones |
| Copperwood | `copperwood-{50-950}` | Copper/burnt orange |

### Theme Rules

- **Dark mode only** — the app is permanently dark-themed with earthy forest tones.
- Use Tailwind theme tokens (`bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`) — never hardcode hex values.
- Never use `bg-gray-*` or `text-gray-*` — always use semantic tokens.
- Brand colors use the `jedith-*` prefix: `bg-jedith-forest`, `text-jedith-copper`, etc.
- Full scales available for fine-grained control: `bg-olive-leaf-200`, `text-copperwood-400`, etc.
- Icons: use `lucide-react` exclusively.
- Cards: `rounded-2xl`, `border border-border`, `shadow-sm`, hover lift via `card-hover` utility.
- Sidebar: deep forest gradient via `.sidebar-gradient`.

### Typography

- System fonts only (no Google Fonts — works behind VPN).
- Sans: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial`
- Mono: `ui-monospace, "Cascadia Code", "Fira Code", Menlo, Consolas`
- Headings: `font-bold` or `font-semibold`
- Body: `text-sm` or `text-xs` with `text-muted-foreground` for secondary text

---

## Component Patterns

- Use `cn()` from `@/lib/utils` for conditional class merging.
- Use existing shadcn-style primitives from `src/components/ui/` (tabs, modals).
- Callbacks follow the `onAction` naming pattern (e.g. `onDelete`, `onCodeClick`, `onSkillClick`).
- Loading states: use skeleton divs (`bg-muted rounded-xl animate-pulse`) or `Loader2` spinner from Lucide.
- All pages are `"use client"` — the app is fully client-rendered with stateless API routes.

---

## Skill Export (Claude Skill ZIP)

The app generates downloadable Claude Code skill packages from palettes.

- **Template files**: `src/lib/skill/` — `skill-template.ts`, `theme-template.ts`, `coding-standards.ts`
- **ZIP builder**: `src/lib/skill/generate-skill-zip.ts` — zero-dependency ZIP using raw Buffer + CRC-32
- **API**: `POST /api/palette/[id]/skill` — accepts `{ skillName, paletteName, colors, libraries }`, returns ZIP
- **UI**: Purple sparkle button on PaletteCard + SkillNameModal for naming

---

## What to Avoid

- **No server-side database** — never add Prisma, SQLite, or any DB. All data lives in IndexedDB.
- **No external font loading** — system fonts only (VPN constraint).
- **No hardcoded colors** — use Tailwind theme tokens or `jedith-*` classes.
- **No `bg-gray-*` or `text-gray-*`** — use `bg-muted`, `text-muted-foreground`, etc.
- **No heavy custom CSS** — prefer Tailwind utility classes.
- **No images/illustrations from external URLs** — use SVG, Lucide icons, or CSS gradients.
- **No `any` types** without documented reason — prefer proper typing.
- **No `console.log` in production code** — use structured error handling.

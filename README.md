# JEdithUI — AI Theme-Aware UI Code Generator

> **Scan. Theme. Generate.**
> Extract color palettes from screenshots or CSS, then generate production-ready, themed UI components and Marp slide decks using local Ollama models — entirely in your browser with no cloud API keys required.

---

## Features

| Feature | Description |
|---|---|
| 🎨 **Palette Extraction** | Extract brand colors from screenshots (AI vision), CSS variables, or build manually |
| 🤖 **Local AI Generation** | Powered by Ollama — runs entirely on your machine, no API keys |
| ⚛️ **Multi-Framework** | Generate React, Vue, Svelte, Angular, and plain HTML components |
| 📦 **Library-Aware** | Supports Tailwind CSS, shadcn/ui, MUI, Ant Design, Chakra, Mantine, Recharts, TanStack Table |
| 👁️ **Live Preview** | In-browser sandboxed iframe renders generated code instantly |
| 📊 **Marp Presentations** | Generate themed slide decks (PPTX / PDF / HTML export) |
| 🔗 **Swagger / OpenAPI** | Import API specs and auto-generate matching UI for each endpoint |
| 🕓 **Version Timeline** | Every generation is versioned — restore or fork any previous version |
| 🚫 **No Auth Required** | Session-based — no login, no accounts in Phase 1 |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.1.6 (App Router, Server Actions, Turbopack) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 3 + CSS custom properties |
| **Database** | SQLite via Prisma ORM 5 |
| **AI Runtime** | Ollama (local) — REST API at `http://localhost:11434` |
| **Slide Engine** | Marp Core + Marp CLI (`@marp-team`) |
| **Icons** | Lucide React |
| **Validation** | Zod |
| **Preview** | Babel Standalone (in-browser JSX compile) |

### Brand Colors

| Token | Hex | Usage |
|---|---|---|
| `jedith-navy` | `#1E2761` | Primary — headers, buttons, nav active |
| `jedith-coral` | `#F96167` | Accent — CTAs, highlights, icons |
| `jedith-ice` | `#CADCFC` | Secondary — subtle backgrounds, badges |

---

## Prerequisites

Before running, make sure you have:

1. **Node.js** v20+ — [Download](https://nodejs.org)
2. **Ollama** installed and running — [Download](https://ollama.com)
3. At least one Ollama model pulled (see [Recommended Models](#recommended-models))

---

## Quick Start

### 1. Clone / navigate to the project

```bash
cd /Users/v0d00ts/Development/Projects/jedith-ui
```

### 2. Install dependencies

> The project uses Walmart's internal npm registry. If you're on the corporate network:

```bash
npm install --registry=https://npm.ci.artifacts.walmart.com/artifactory/api/npm/npme-npm --legacy-peer-deps
```

> Or using the global npm registry:

```bash
npm install --legacy-peer-deps
```

### 3. Set up environment variables

Copy the example env or create `.env` in the project root:

```bash
# .env
DATABASE_URL="file:./dev.db"
OLLAMA_URL="http://localhost:11434"
```

### 4. Set up the database

```bash
# Push schema to SQLite and generate Prisma client
node node_modules/.bin/prisma db push
node node_modules/.bin/prisma generate
```

Or using npm scripts:

```bash
npm run db:push
npm run db:generate
```

### 5. Start Ollama

```bash
# In a separate terminal — keep this running
ollama serve
```

### 6. Pull a model

```bash
# Recommended: fast general-purpose model
ollama pull gemma3:12b

# For image/screenshot palette extraction (vision model)
ollama pull llava:13b
```

### 7. Start the development server

```bash
npm run dev
```

App runs at **http://localhost:3000**

---

## NPM Scripts

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `next dev` | Start dev server with hot reload |
| `npm run build` | `next build` | Production build |
| `npm run start` | `next start` | Run production build |
| `npm run lint` | `next lint` | Lint source files |
| `npm run db:push` | `prisma db push` | Sync schema → SQLite |
| `npm run db:generate` | `prisma generate` | Regenerate Prisma client |
| `npm run db:studio` | `prisma studio` | Open Prisma Studio GUI |

---

## Recommended Models

| Model | Use Case | Pull Command |
|---|---|---|
| `gemma3:12b` | General code generation (fast, accurate) | `ollama pull gemma3:12b` |
| `gemma3:27b` | High-quality code (slower, better output) | `ollama pull gemma3:27b` |
| `llava:13b` | Image palette extraction (vision) | `ollama pull llava:13b` |
| `llava-llama3` | Vision alternative | `ollama pull llava-llama3` |
| `moondream` | Lightweight vision model | `ollama pull moondream` |
| `codellama:13b` | Code-focused generation | `ollama pull codellama:13b` |

> **Tip:** The app shows your installed models in the Model Selector. Vision models are automatically tagged and available only for palette extraction from screenshots.

---

## App Structure

```
jedith-ui/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── page.tsx                # Dashboard
│   │   ├── layout.tsx              # Root layout (Sidebar + main)
│   │   ├── palettes/               # Palette management
│   │   │   ├── page.tsx            # Palette list
│   │   │   ├── new/page.tsx        # Create palette (manual/image/CSS)
│   │   │   └── [id]/page.tsx       # Palette detail + edit
│   │   ├── chat/                   # Code generation chats
│   │   │   ├── page.tsx            # Chat list
│   │   │   ├── new/page.tsx        # New chat setup
│   │   │   └── [id]/page.tsx       # Active chat thread
│   │   ├── presentations/          # Marp slide generation
│   │   │   ├── page.tsx            # Presentations list
│   │   │   ├── new/page.tsx        # New presentation setup
│   │   │   └── [id]/page.tsx       # Active presentation thread
│   │   ├── swagger/page.tsx        # OpenAPI/Swagger import
│   │   └── api/                    # API routes (14 endpoints)
│   │       ├── models/             # GET — list Ollama models
│   │       ├── palettes/           # CRUD — palette management
│   │       ├── chat/               # CRUD — chat sessions
│   │       ├── generate/           # POST — generate UI code
│   │       ├── preview/            # POST — build sandboxed preview HTML
│   │       ├── extract-theme/      # POST — AI image palette extraction
│   │       ├── parse-css/          # POST — CSS variable palette parser
│   │       ├── swagger/            # POST — OpenAPI spec parser
│   │       └── presentation/
│   │           ├── generate/       # POST — generate Marp slides
│   │           ├── preview/        # POST — render Marp HTML preview
│   │           └── export/         # POST — export PPTX / PDF / HTML
│   ├── components/
│   │   ├── chat/                   # ChatThread, MessageBubble, CodePreview,
│   │   │                           #   VersionTimeline, ExportButtons,
│   │   │                           #   SlidePreview, SlideFilmstrip
│   │   ├── generator/              # ModelSelector, FrameworkSelector,
│   │   │                           #   LibrarySelector, SlideThemeSelector,
│   │   │                           #   ThemeSelector, PromptInput
│   │   ├── layout/                 # Sidebar, Logo, OllamaStatus
│   │   ├── palette/                # PaletteCard, PaletteEditor,
│   │   │                           #   ColorSwatch, ImageDropzone
│   │   └── ui/                     # Tabs (custom shadcn-style)
│   ├── hooks/                      # useOllamaModels, usePalettes,
│   │                               #   useChat, usePreview
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── generate-code.ts    # 4-layer code generation pipeline
│   │   │   ├── generate-slides.ts  # Marp slide generation pipeline
│   │   │   ├── library-configs/    # Per-library CDN + theming instructions
│   │   │   └── prompts/            # system, theme, marp-syntax prompts
│   │   ├── marp/                   # theme-injector, marp-preview, marp-export
│   │   ├── parsers/                # css-parser, swagger-parser
│   │   ├── post-process/           # extract-code, validate-imports,
│   │   │                           #   theme-compliance, prettier format
│   │   ├── preview/                # react-wrapper, html-wrapper, cdn-manager
│   │   ├── db.ts                   # Prisma client singleton
│   │   ├── ollama.ts               # Ollama REST client
│   │   └── utils.ts                # cn(), timeAgo(), getOrCreateSessionId()
│   └── types/index.ts              # All TypeScript types
├── prisma/
│   └── schema.prisma               # DB schema (User, Palette, Chat, Message, ...)
├── public/                         # Static assets
├── .env                            # Environment variables (DATABASE_URL, OLLAMA_URL)
├── next.config.ts                  # Next.js + Turbopack config
├── tailwind.config.ts              # Tailwind + brand color tokens
└── package.json
```

---

## How It Works

### Palette Creation (3 modes)

```
1. Manual      → Color picker UI → assign roles (primary, accent, etc.)
2. Screenshot  → Drop image → vision AI extracts dominant colors → assign roles
3. CSS         → Paste :root { --var: #hex } → parser extracts + maps to roles
```

### Code Generation (4-layer prompt)

```
Layer 1: System identity    → "You are JEdithUI, expert UI code generator..."
Layer 2: Library knowledge  → Import patterns, theming instructions per library
Layer 3: Theme context      → Active palette colors with role descriptions
Layer 4: User request       → The actual prompt + framework + library list
```

### Post-Processing Pipeline

```
Raw AI response
  → extractCode()        extract code block from markdown
  → detectLanguage()     tsx / html / vue / svelte
  → validateImports()    remove imports for unlisted libraries
  → checkThemeCompliance() warn if hardcoded colors detected
  → prettier.format()    auto-format (silent fail)
  → Live preview iframe
```

### Slide Generation

```
User prompt → generateSlides() → Marp markdown
  → prepareMarpMarkdown()   inject CSS theme from palette
  → Marp Core render        → HTML preview (iframe)
  → Marp CLI export         → PPTX / PDF / HTML download
```

---

## Database Schema (SQLite)

```
User          — session-based (no auth), owns palettes and chats
Palette       — name, source (MANUAL/IMAGE/CSS), colors[]
Color         — hex, role, order (belongs to Palette)
Chat          — type (CODE/PRESENTATION), framework, libraries[], modelName
Message       — role (USER/ASSISTANT), content
CodeVersion   — code, language, version number (belongs to Message)
SlideVersion  — markdown, slideCount, version number (belongs to Message)
SwaggerSpec   — imported OpenAPI spec
SwaggerEndpoint — parsed endpoint with suggestedUI
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/models` | List Ollama models + connection status |
| `GET` | `/api/palettes` | List user palettes (session-based) |
| `POST` | `/api/palettes` | Create palette |
| `PUT` | `/api/palettes/[id]` | Update palette name or colors |
| `DELETE` | `/api/palettes/[id]` | Delete palette + cascade |
| `GET` | `/api/chat` | List chats |
| `POST` | `/api/chat` | Create chat |
| `DELETE` | `/api/chat/[id]` | Delete chat |
| `GET` | `/api/chat/[id]/messages` | Get chat messages + versions |
| `POST` | `/api/generate` | Generate UI code (calls Ollama) |
| `POST` | `/api/presentation/generate` | Generate Marp slides (calls Ollama) |
| `POST` | `/api/presentation/preview` | Render Marp HTML preview |
| `POST` | `/api/presentation/export` | Export PPTX / PDF / HTML |
| `POST` | `/api/preview` | Build sandboxed code preview HTML |
| `POST` | `/api/extract-theme` | Extract palette from image (vision AI) |
| `POST` | `/api/parse-css` | Parse CSS variables into palette |
| `POST` | `/api/swagger` | Parse OpenAPI spec into endpoints |

---

## Troubleshooting

### Ollama not connecting
```bash
# Make sure Ollama is running
ollama serve

# Verify it's accessible
curl http://localhost:11434/api/tags
```

### Prisma client error on startup
```bash
cd /Users/v0d00ts/Development/Projects/jedith-ui
node node_modules/.bin/prisma generate
node node_modules/.bin/prisma db push
```

### Port already in use
```bash
# Kill whatever is on port 3000 and retry
lsof -ti:3000 | xargs kill -9
npm run dev
```

### Dev server fails to start (symlink issue)
The project uses a specific startup command to resolve symlinked dependencies:
```bash
NODE_PATH=./node_modules node node_modules/next/dist/bin/next dev
```
This is already wired into `npm run dev` — just use that.

### No models shown in ModelSelector
Pull at least one model in Ollama:
```bash
ollama pull gemma3:12b
```
Then refresh the page — the sidebar will show a green Ollama status dot.

---

## Supported Frameworks

| Framework | Status |
|---|---|
| React (TSX) | ✅ Full support + live preview |
| HTML | ✅ Full support + live preview |
| Vue | 🔜 Phase 3 |
| Svelte | 🔜 Phase 3 |
| Angular | 🔜 Phase 3 |

## Supported UI Libraries

| Library | Import Style | CDN Preview |
|---|---|---|
| Tailwind CSS | Utility classes | ✅ via CDN |
| shadcn/ui | Component imports | ✅ (pre-built) |
| Material UI (MUI) | `@mui/material` | ✅ via CDN |
| Ant Design | `antd` | ✅ via CDN |
| Chakra UI | `@chakra-ui/react` | ✅ via CDN |
| Mantine | `@mantine/core` | ✅ via CDN |
| Recharts | `recharts` | ✅ via CDN |
| TanStack Table | `@tanstack/react-table` | ✅ via CDN |

---

## Development Notes

- **Session management**: A UUID is stored in `localStorage` as `jedith-session-id` on first visit. All data is scoped to that session.
- **No auth in Phase 1**: Authentication (Walmart SSO or OAuth) is planned for Phase 4.
- **Ollama streaming**: The generate endpoints use non-streaming mode for simplicity. Streaming SSE is planned.
- **Prisma config**: Uses Prisma 5.22 with `url = env("DATABASE_URL")` in `schema.prisma`. The `prisma.config.ts` file is a placeholder for future Prisma 7 migration.
- **Turbopack root**: Set to parent `Projects/` directory to allow Next.js to compile files through symlinked `node_modules` from a sibling project.

---

*Built with JEdithUI — Scan. Theme. Generate.* 🎨

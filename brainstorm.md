# JEdithUI — AI Theme-Aware Code Generator

> **Tagline:** "Scan. Theme. Generate."

**J** (JavaScript/JSON) + **Edith** (Tony Stark's AI — *"Even Dead I'm The Hero"*) + **UI**

Just like EDITH scanned the environment and responded to commands, **JEdithUI** scans a design/screenshot, understands the theme, and generates UI code — all through conversation.

---

## Brand Identity

```
Project:       JEdithUI
Pronunciation: "Jeh-dith UI" or "J-Edith UI"
Short form:    Jedith
CLI name:      jedith
npm scope:     @jedithui/core
GitHub:        github.com/jedithui
Domain:        jedithui.dev
Logo concept:  EDITH glasses silhouette with a color spectrum
               reflecting off the lens and </> code symbol
               in the reflection
```

---

## Core Value Proposition

Extract themes from any website/design, then generate framework-specific, library-aware UI code **and branded presentations** using those themes — all through a conversational chat interface powered by local AI. One palette, multiple outputs: code and slides.

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js** | App Router, API routes, SSR for preview |
| **Tailwind CSS** | Styling, theme generation maps directly to Tailwind config |
| **shadcn/ui** | Base UI components for JEdithUI's own interface |
| **Prisma** | Type-safe database access |
| **SQLite** | Database (Phase 1 — simple, no setup) |
| **Ollama** | Local AI inference server (auto-discovers all installed models) |
| **Any Ollama model** | User selects from installed models — Gemma 4 e4b recommended default |
| **Babel Standalone** | In-browser JSX compilation for React live preview (~800 KB, cached) |
| **Marp CLI** | Converts Marp markdown → PPTX / PDF / HTML for presentations |

---

## Features

### Feature 1: Image to Color Palette (Gemma 4 Vision)

Upload/drop a screenshot of any website, and Gemma 4's vision capability extracts the color theme with semantic role assignments.

**Current workflow (without JEdithUI):**
```
Open website -> Screenshot -> Open color picker tool -> Eyedrop each color
-> Manually name them -> Copy to Tailwind config -> Repeat for each app
~30-45 min per theme
```

**With JEdithUI:**
```
Drop screenshot -> Get named palette instantly -> Export to any app
~2 min
```

**Approach:** Gemma 4 Vision only — send the image directly to Gemma 4 e4b with a prompt to extract colors and assign semantic roles (primary, secondary, accent, background, text, etc.).

---

### Feature 2: CSS to Color Palette

Paste existing CSS code and JEdithUI parses and normalizes it into a structured color palette.

**Current workflow:**
```
Open DevTools -> Dig through CSS -> Find variables -> Manually extract
-> Organize into primary/secondary/accent -> Create theme file
~20-30 min
```

**With JEdithUI:**
```
Paste CSS -> Structured palette with roles
~1 min
```

**Use case:** Migration tool — paste CSS from existing apps to instantly get normalized palettes.

---

### Feature 3: Manual Palette Creation

Users can create palettes from scratch using a visual editor with color pickers and role assignment.

---

### Feature 4: Prompt + Theme to Code Generation

Give a text prompt describing the UI you want, select a palette, and JEdithUI generates production-ready code.

**Current workflow:**
```
Think about layout -> Write JSX -> Add Tailwind classes -> Apply theme colors
-> Make responsive -> Fix styling -> Iterate
~1-3 hours per component/page
```

**With JEdithUI:**
```
"Create a pricing page with 3 tiers" + select palette -> Get themed code
~5 min (including review + tweaks)
```

---

### Feature 5: API Response to UI Code Generation

Paste an API response (JSON) and JEdithUI generates a themed UI to display that data. Users can provide multiple sample responses for smarter schema inference.

**Current workflow:**
```
Get API contract -> Read through JSON -> Decide which fields are important
-> Choose component type -> Write table/card/list -> Handle nested objects
-> Handle arrays -> Add loading states -> Apply theme
~2-4 hours per API integration
```

**With JEdithUI:**
```
Paste API response -> "Create a data table with filters" + select palette -> Done
~5-10 min
```

**Multi-sample intelligence:** Feed multiple response samples, and JEdithUI learns which fields are optional, what varies, and builds smarter UIs with proper null/empty states.

---

### Feature 6: Swagger/OpenAPI Import

Import an entire OpenAPI spec (file or URL) and generate UI for multiple endpoints at once.

**Workflow:**

1. **Import** — Upload `.json`/`.yaml` file or paste spec URL
2. **Parse & Present** — Shows all endpoints grouped by resource with auto-suggested UI types
3. **Select & Configure** — User selects which endpoints to generate UI for
4. **Generate** — Each selected endpoint becomes its own chat thread

**Smart UI Type Suggestions:**

| OpenAPI Pattern | Auto-Suggested UI |
|----------------|-------------------|
| `GET` + returns array | Table / Card Grid / List |
| `GET` + returns object | Detail View |
| `POST` + has request body | Create Form |
| `PUT` + has request body | Edit Form (pre-filled) |
| `DELETE` | Confirmation Dialog |
| `GET` + has query params | Table + Filter Panel |

**Schema Intelligence — What the parser extracts:**

| OpenAPI Detail | What It Generates |
|----------------|-------------------|
| Enum fields | Dropdown / Select components |
| Nested objects | Expandable sections or sub-components |
| Array fields | Repeatable list/table within the page |
| Required vs optional | Form validation rules |
| Field types (string, integer, boolean) | Correct input components (text, number, toggle) |
| Format hints (date-time, uri, email) | Specialized input components |

**Linked Endpoints:** When the spec has related endpoints (e.g., `GET /products`, `GET /products/{id}`, `POST /products`), JEdithUI suggests generating navigation between them (table row click -> detail, add button -> create form).

**Spec Version Management:** When a user imports an updated spec, JEdithUI shows a diff of changes and highlights affected chat threads that may need regeneration.

---

### Feature 7: Multi-Select UI Library

Users can select **multiple UI libraries** for a single generation, with a priority system.

**Supported Libraries:**
- Tailwind CSS (layout, custom styling)
- shadcn/ui (base components)
- Material UI / MUI (data-heavy components)
- Ant Design (tables, forms)
- Chakra UI (accessible components)
- Mantine (hooks + components)
- Recharts (charts & graphs)
- React Table (headless tables)

**Priority System:** When multiple libraries have similar components, the **primary library** (user-selected) takes precedence.

```
Example:
Selected: [shadcn/ui, Ant Design, Recharts]
Priority: shadcn/ui (primary)

Button       -> shadcn/ui (primary wins)
Dialog       -> shadcn/ui (primary wins)
DataTable    -> Ant Design (richer table features)
BarChart     -> Recharts (only charts library)
Layout/Grid  -> Tailwind (always available for layout)
```

**Why multi-select:** Real projects already mix libraries. MUI for DataGrid, shadcn for buttons, Recharts for charts. JEdithUI reflects how developers actually work.

---

### Feature 8: Framework Selector

Dropdown to select the output framework. React is the default.

**Supported Frameworks:**
- React (default)
- Vue
- Svelte
- Angular
- HTML

---

### Feature 9: Chat-Based Generation (Conversational UI)

Every generation is a **persistent chat thread** — not a one-shot form. The moment a user sends their first prompt, a new chat is created, and every follow-up message builds on the previous output. This makes the entire experience a **continuous conversation** where users iteratively improve the design and code.

**Why "Generation = Chat":**
- The first prompt creates both the initial code AND the chat thread
- Every subsequent message is a refinement within that same chat
- Users never leave the conversation to "start over" — they just keep talking
- The chat preserves full context: palette, libraries, framework, and all prior versions
- Re-opening any past chat picks up exactly where it left off

**Chat Thread Actions:**

| Action | What It Does |
|--------|-------------|
| **Send** | New refinement message, builds on latest code |
| **Regenerate** | Same prompt, fresh generation — different interpretation |
| **Refine** | Keep current output + apply follow-up instruction |
| **Restore** | Go back to any previous version from history |
| **Fork** | Branch from any version to explore alternatives |

**Continuous Interaction Flow:**
```
User: "Create a pricing page with 3 tiers"
  -> v1 generated, chat created: "Pricing Page"

User: "Make the popular tier stand out more"
  -> v2 generated, same chat

User: "Add a toggle for monthly/annual billing"
  -> v3 generated, same chat

User: "The CTA buttons should use the accent color"
  -> v4 generated, same chat

[User closes app, comes back next day]

User: "Actually, change to 4 tiers and add an enterprise option"
  -> v5 generated, picks up right where they left off
```

**Version Timeline:**
```
Chat: "Pricing Page"

Timeline: [v1] -> [v2] -> [v3] -> [v4] -> [v5 current]

User can click any version to preview, restore, or fork from it.
Like "git history" for generated UI.
```

**Context Strategy for AI Model:**

Each refinement sends the **latest full code** + the **new instruction** — not the entire chat history. This keeps context focused and avoids the model getting confused by old versions.

```
What the AI model sees on each turn:
[System] Role, palette, library configs
[User]   Current code (latest version) + new refinement request

NOT the full chat history — just the latest state + delta
```

**Chat List (Dashboard Sidebar):**
```
My Chats
|-- "Pricing Page"           — 5 messages, v5, 2 min ago
|-- "User Dashboard"         — 8 messages, v4, yesterday
|-- "Login Form"             — 3 messages, v2, 3 days ago
|-- "Product Card Grid"      — 12 messages, v7, last week

Each entry shows: name, message count, latest version, last active time
Click to resume the conversation instantly
```

---

### Feature 10: Live Preview (Custom Wrappers)

Each generated version has a **live preview** rendered in a sandboxed iframe, so users can see the result immediately without copy-pasting code.

**The Problem:** JEdithUI generates framework code (JSX, Vue SFCs, etc.) — not plain HTML. You can't dump JSX into an iframe and expect it to work. Each framework needs its own compilation + runtime.

**The Solution:** Custom **preview wrappers** — per-framework HTML shells that include the runtime, compile the code in-browser, and render it live.

```
Generated Code (React or HTML)
       |
       v
Preview Wrapper (framework-specific HTML template)
  |-- Framework runtime (React CDN, etc.)
  |-- In-browser compiler (Babel Standalone for JSX)
  |-- User's palette injected as CSS variables
  |-- Generated code injected and bootstrapped
       |
       v
Sandboxed <iframe sandbox="allow-scripts"> → user sees live UI
```

**Phase 1 Supported Frameworks:** HTML + React (default). Others added in Phase 3.

#### HTML Preview Wrapper (Direct Render)

The simplest case — no compilation needed:

```html
<html>
  <head>
    <style>
      :root {
        --primary: ${palette.primary};
        --secondary: ${palette.secondary};
        --accent: ${palette.accent};
        --background: ${palette.background};
        --text: ${palette.text};
      }
    </style>
    <!-- UI library CDNs (Tailwind, etc.) loaded based on chat.libraries -->
  </head>
  <body>
    ${generatedHTML}   <!-- code injected directly -->
  </body>
</html>
```

#### React Preview Wrapper (Babel Standalone + React CDN)

```html
<html>
  <head>
    <!-- React runtime -->
    <script src="react.production.min.js"></script>
    <script src="react-dom.production.min.js"></script>

    <!-- In-browser JSX compiler -->
    <script src="babel-standalone.min.js"></script>

    <!-- UI library CDNs loaded based on chat.libraries -->
    <link href="tailwind-cdn" />
    <script src="recharts.umd.js" />       <!-- if selected -->
    <script src="@mui/material-cdn" />      <!-- if selected -->

    <!-- Palette as CSS variables -->
    <style>
      :root {
        --primary: ${palette.primary};
        --accent: ${palette.accent};
        /* ... all palette colors */
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="text/babel">
      ${generatedReactCode}

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
```

**Bundle sizes (cached after first load):**

| Dependency | Size | Purpose |
|-----------|------|---------|
| Babel Standalone | ~800 KB | JSX → JS compilation in browser |
| React + ReactDOM | ~130 KB | React runtime |
| Tailwind CDN | ~300 KB | Utility CSS (if selected) |

#### Future Framework Wrappers (Phase 3)

| Framework | Compiler | Approach |
|-----------|----------|----------|
| **Vue** | Built into Vue 3 full build | Vue 3 ships with browser-compatible template compiler (~130 KB) |
| **Svelte** | Svelte browser compiler | Official `svelte/compiler` compiles `.svelte` → vanilla JS in-browser (~250 KB) |
| **Angular** | TypeScript browser + Zone.js | Heaviest (~2 MB+); use standalone components (Angular 14+) for simplified preview |

#### CDN Manager

Manages framework + library CDN URLs. Each chat's library selection determines which CDNs are loaded:

```
chat.libraries = ["shadcn/ui", "Recharts", "Tailwind"]

CDN Manager resolves:
  Tailwind   → <script src="tailwindcss-cdn"> + palette injected into config
  shadcn/ui  → Component CSS inlined (shadcn is copy-paste, no CDN)
  Recharts   → <script src="recharts.umd.js"> + d3 dependency
  MUI        → <link href="mui-css"> + <script src="mui.umd.js">
  Ant Design → <link href="antd.min.css"> + <script src="antd.umd.js">
```

#### Preview Error Handling

AI-generated code won't always compile. The preview handles failures gracefully:

| Error Type | What Happens | User Action |
|-----------|-------------|-------------|
| **Compile error** (Babel/JSX syntax) | Shows error with line number + snippet | [Regenerate] or [Fix this error] |
| **Runtime error** (crashes after render) | Shows error overlay with stack trace | [Fix this error] sends error to chat |
| **Missing CDN** (library can't load) | Shows "code is correct, preview limited" | [Copy Code] or [Open in CodeSandbox] |

The **[Fix this error]** button auto-sends the error message back into the chat as a refinement prompt, so the AI self-corrects:

```
Auto-generated refinement:
"The preview shows this error: TypeError: Cannot read property 'map'
of undefined at ProductList (line 22). Please fix the code."
```

---

### Feature 11: No Auth (Phase 1)

No authentication for Phase 1. Use browser fingerprint or localStorage session ID to identify users. Simplifies MVP, no friction.

---

### Feature 12: Ollama Model Selector

When a user starts a prompt (new chat or within an existing one), JEdithUI queries the local Ollama instance and presents **all installed models** for the user to choose from.

**Current assumption (without this feature):**
```
Hardcoded to Gemma 4 e4b -> no choice -> stuck if model is unavailable
```

**With Model Selector:**
```
Start prompt -> See all installed models -> Pick one -> Generate with that model
~2 extra seconds
```

**How It Works:**

1. **Discovery** — On app load (and periodically), call Ollama's `GET /api/tags` endpoint
2. **Display** — Show a dropdown/selector listing all installed models with metadata
3. **Selection** — User picks a model before (or during) a chat
4. **Persistence** — The selected model is saved per chat, so each chat remembers which model generated it

**Model Discovery API:**
```
GET http://localhost:11434/api/tags

Response:
{
  "models": [
    {
      "name": "gemma4:e4b",
      "model": "gemma4:e4b",
      "size": 5500000000,
      "digest": "abc123...",
      "details": {
        "parent_model": "",
        "format": "gguf",
        "family": "gemma4",
        "families": ["gemma4"],
        "parameter_size": "4B",
        "quantization_level": "Q4_K_M"
      },
      "modified_at": "2026-04-20T10:30:00Z"
    },
    {
      "name": "llava:13b",
      "model": "llava:13b",
      "size": 8200000000,
      ...
    },
    {
      "name": "codellama:7b",
      "model": "codellama:7b",
      "size": 3800000000,
      ...
    }
  ]
}
```

**Model Selector UI:**
```
┌─────────────────────────────────────────┐
│  Select Model                      ▼    │
├─────────────────────────────────────────┤
│  ⭐ gemma4:e4b          4B  · Q4_K_M   │  <- default / recommended
│  🖼️ llava:13b           13B · Q4_0     │  <- vision capable
│  💻 codellama:7b         7B · Q4_K_M   │
│  🧠 deepseek-coder:6.7b 6.7B · Q5_K_M │
│  📝 mistral:7b          7B · Q4_K_M   │
└─────────────────────────────────────────┘

Each entry shows: icon, model name, parameter size, quantization
Vision-capable models are tagged (needed for image-to-palette)
```

**Smart Defaults & Badges:**

| Badge | Meaning |
|-------|---------|
| ⭐ **Recommended** | Best balance of quality + speed for code gen |
| 🖼️ **Vision** | Supports image input (required for Feature 1: Image to Palette) |
| 💻 **Code** | Optimized for code generation tasks |
| 🧠 **Large** | Higher quality but slower inference |

**Per-Chat Model Memory:**
- Each chat stores which model was used: `chat.modelName = "gemma4:e4b"`
- Switching models mid-chat is allowed — the version timeline shows which model generated each version
- Users can compare outputs: same prompt, different models

**Fallback Behavior:**
- If Ollama is not running → show "Ollama not detected" with setup instructions
- If no models installed → show "No models found" with `ollama pull` instructions
- If a chat's saved model was uninstalled → warn and suggest an alternative

**Connection Status Indicator:**
```
Footer bar:
┌─────────────────────────────────────────┐
│ 🟢 Ollama connected · gemma4:e4b       │  <- healthy
│ 🔴 Ollama disconnected                 │  <- not running
│ 🟡 Ollama connected · no models        │  <- running but empty
└─────────────────────────────────────────┘
```

---

### Feature 13: Palette-to-Presentation (Marp Integration)

Users can generate **themed presentations** using the same palette they use for code generation. Powered by the Marp slide skill — Markdown-based slides with CSS themes, converted to PPTX/PDF via Marp CLI.

**Why this fits:** The palette IS a brand identity. If a user builds a dashboard with their palette, they'll need those exact colors in a pitch deck, sprint review, or design showcase. Same palette, different output format.

**Current workflow (without this feature):**
```
Build UI in JEdithUI -> extract palette colors -> open PowerPoint
-> manually apply colors to slides -> fight with inconsistent themes
~1-2 hours per presentation
```

**With JEdithUI:**
```
Click "Create Presentation" -> pick palette + slide theme -> describe content -> done
~5 min (including refinements)
```

#### How It Works

Marp presentations are **Markdown files with embedded CSS**. JEdithUI's Ollama models already generate code — generating Marp markdown is the **same pipeline**:

```
Current code generation flow:
  Prompt + Palette + Model → Ollama → React/HTML code

Presentation flow (identical pipeline):
  Prompt + Palette + Model → Ollama → Marp markdown
```

The palette maps directly to CSS variables in the Marp theme:

```css
/* JEdithUI palette → Marp theme CSS variables */
:root {
  --color-primary: #1E2761;    /* palette.primary */
  --color-secondary: #CADCFC;  /* palette.secondary */
  --color-accent: #F96167;     /* palette.accent */
  --color-bg: #FFFFFF;         /* palette.background */
  --color-text: #363636;       /* palette.text */
}
section { background: var(--color-bg); color: var(--color-text); }
section h1, section h2 { color: var(--color-primary); }
```

#### 7 Base Slide Themes (from Marp Skill)

Each theme provides a **layout and style structure**. The user's palette **overrides the colors**:

| Theme | Style | Best For |
|-------|-------|----------|
| **Default** | Beige bg, clean decorative lines | General presentations, seminars |
| **Minimal** | White bg, wide margins, light fonts | Academic, content-focused talks |
| **Colorful** | Gradient bg, bold fonts, rainbow accents | Creative projects, events |
| **Dark** | Black bg, cyan/purple glow effects | Tech talks, evening presentations |
| **Gradient** | Different gradient per slide | Visual-focused, creative decks |
| **Tech** | GitHub-style dark, code fonts, `#` headers | Dev content, tutorials, meetups |
| **Business** | White bg, navy headings, top border | Corporate, proposals, reports |

**Key:** Theme thumbnails are **live-previewed in the user's palette colors** — not generic defaults. The user sees THEIR brand on every theme option.

#### Entry Points (3 Ways to Create a Presentation)

**Entry 1 — From Palette Card:**
```
Dashboard > My Palettes > "Brand Colors" > [Slides] button
→ New presentation chat with that palette pre-selected
```

**Entry 2 — From Presentations Section:**
```
Dashboard > My Presentations > [+ New Presentation]
→ Full setup: pick palette, slide theme, model, enter prompt
```

**Entry 3 — From Code Chat:**
```
Inside any code chat: "Turn this into a presentation"
→ AI proposes outline based on the code context
→ User confirms → new presentation chat created (linked to code chat)
```

#### Setup Screen

```
┌─── New Presentation ─────────────────────────────────┐
│                                                       │
│  Palette:    [Brand Colors ▼]                         │
│              ██ ██ ██ ██ ██  (color swatches)        │
│                                                       │
│  Slide Theme:                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│  │Busi- │ │Mini- │ │ Dark │ │ Tech │               │
│  │ness ✓│ │ mal  │ │      │ │      │               │
│  └──────┘ └──────┘ └──────┘ └──────┘               │
│  ┌──────┐ ┌──────┐ ┌──────┐                         │
│  │Color-│ │Grad- │ │Defa- │                         │
│  │ful   │ │ient  │ │ult   │                         │
│  └──────┘ └──────┘ └──────┘                         │
│  (each thumbnail previewed in YOUR palette colors)   │
│                                                       │
│  Model:      [gemma4:e4b ▼]                          │
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │ "5-slide pitch deck for our analytics          │  │
│  │  dashboard. Cover: problem, solution, demo,    │  │
│  │  pricing, and CTA"                    [Send →] │  │
│  └────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
```

#### Presentation Chat (Same Pattern as Code Chat)

After sending, it enters the **same continuous chat pattern** as code generation:

```
┌─── "Product Pitch Deck" ──── Brand Colors │ Business │ ⚙ ──┐
│                                                              │
│  ┌─ YOU ──────────────────────────────────────────────────┐  │
│  │ 5-slide pitch deck for our analytics dashboard.        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ JEDITH ───────────────────────────────────────────────┐  │
│  │ Here's your pitch deck:                                │  │
│  │                                                         │  │
│  │  ┌─ SLIDE FILMSTRIP ────────────────────────────────┐  │  │
│  │  │ [1 Title] [2 Problem] [3 Solution] [4 Pricing] [5]│  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  ┌─ SLIDE PREVIEW (iframe) ─────────────────────────┐  │  │
│  │  │                                                   │  │  │
│  │  │         Analytics Dashboard                       │  │  │
│  │  │      Transforming Data Into Action                │  │  │
│  │  │                                                   │  │  │
│  │  │  (rendered in palette colors, business theme)     │  │  │
│  │  │                                                   │  │  │
│  │  │  [◀ Prev]  Slide 1 of 5  [Next ▶]               │  │  │
│  │  └───────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  [📥 PPTX] [📄 PDF] [🔗 HTML] [📋 Markdown] [🔄 Regen]│  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                              │
│  Timeline: [v1 ●]                                            │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ "Make slide 3 more visual — add a diagram area"       │  │
│  │                                                [Send →]│  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

Refinement works identically to code chats — same version timeline, restore, fork, and model tracking per version.

#### From Code Chat → Presentation (Entry 3 Flow)

```
Inside "E-commerce Dashboard" code chat:

User: "Create a presentation to showcase this dashboard"

JEDITH proposes:
  ┌─── QUICK SETUP ───────────────────────────────────────┐
  │ Palette: Brand Colors (from this chat)                 │
  │ Theme:   [Business ▼]  ← AI-suggested from content    │
  │                                                        │
  │ Proposed outline:                                      │
  │  1. Title — "E-commerce Analytics Dashboard"           │
  │  2. The Problem — data scattered across tools          │
  │  3. Our Solution — unified dashboard                   │
  │  4. Key Features — real-time, filters, export          │
  │  5. Next Steps — rollout plan                          │
  │                                                        │
  │ [✅ Generate]  [✏️ Edit outline first]                 │
  └────────────────────────────────────────────────────────┘

→ Opens new presentation chat (linked to code chat)
```

#### Preview Rendering Pipeline

Marp outputs HTML natively, so the preview uses the **same sandboxed iframe** as code previews:

```
Marp Markdown (generated by Ollama)
    |
    v
Marp CLI: --html → slide.html (with palette CSS embedded)
    |
    v
Sandboxed <iframe src="slide.html">
    |-- Slide navigation (prev/next)
    |-- Slide filmstrip (clickable thumbnails)
    |-- Palette colors applied throughout
    |
    v
Export buttons trigger:
  PPTX: marp-cli slide.md --pptx
  PDF:  marp-cli slide.md --pdf
  HTML: already rendered
```

#### What the AI Model Receives (Prompt Structure)

```
[System] "You are a Marp presentation generator. Generate valid
         Marp markdown with the theme CSS embedded..."

[Context] Marp syntax rules (directives, image syntax, slide breaks)
        + Selected theme CSS (with palette colors injected)
        + Best practices (3-5 bullets, concise titles, varied layouts)

[User]   The prompt (or latest markdown + refinement instruction)
```

Same context strategy as code generation — latest version + new instruction per turn, not full history.

---

## Dashboard Layout

```
Dashboard (Home)
|-- My Palettes
|   |-- Brand Colors                [Code] [Slides]
|   |-- Dark Theme                  [Code] [Slides]
|   |-- Competitor X                [Code] [Slides]
|
|-- My Chats (Code)                                     <- click to resume conversation
|   |-- "E-commerce Dashboard"      — 8 msgs, v4, gemma4:e4b
|   |-- "User Profile Page"         — 3 msgs, v2, llava:13b
|   |-- "Order API -> Table"        — 5 msgs, v3, gemma4:e4b
|   |-- "Pricing Page"              — 2 msgs, v1, codellama:7b
|
|-- My Presentations                                    <- click to resume conversation
|   |-- "Product Pitch Deck"        — 3 msgs, v2, Brand Colors, Business
|   |-- "Sprint Review"             — 1 msg, v1, Dark Theme, Tech
|   |-- [+ New Presentation]
|
|-- Swagger Imports
|   |-- "Product Service v2.1"      — 12 endpoints
|
|-- Footer: 🟢 Ollama connected · 5 models available · Default: gemma4:e4b
```

---

## Ollama Integration (Dynamic Model Support)

### Setup
- **Ollama runs locally** on the same machine (`localhost:11434`)
- **Model:** User-selected from all installed Ollama models (default: Gemma 4 e4b if available)
- **Model Discovery:** `GET /api/tags` queries installed models on app load
- **Direct Ollama REST API** — no abstraction layer, keeps it simple
- Vision-capable models auto-detected for image-to-palette (Feature 1)

### Model Discovery Flow
```
App Starts
    |
    v
GET /api/tags -> List all installed models
    |
    v
Classify each model:
  - Vision capable? (gemma4, llava, bakllava, etc.)
  - Code optimized? (codellama, deepseek-coder, starcoder, etc.)
  - General purpose? (mistral, llama, phi, etc.)
    |
    v
Cache model list (refresh on user action or periodic poll)
    |
    v
Present in Model Selector dropdown with badges
```

### Model Selection Rules
- **New chat:** User picks a model from the dropdown (or uses their default)
- **Existing chat:** Model is pre-selected to match what was used previously
- **Image-to-palette (Feature 1):** Only vision-capable models shown
- **Mid-chat switch:** Allowed — version timeline tracks which model generated each version

### Prompt Architecture (4 Layers)

```
Layer 1: SYSTEM IDENTITY
"You are a UI code generator..."

Layer 2: LIBRARY KNOWLEDGE (static config, injected per selection)
Import patterns, component APIs, theming instructions per library

Layer 3: THEME CONTEXT
User's selected palette + how to apply it per library

Layer 4: USER REQUEST
The actual prompt, refinement, or API schema
```

### Library Knowledge Map

Static configuration files (not AI-generated) that tell the selected AI model how each library works:

```
lib/library-configs/
|-- tailwind.ts    -> how to apply palette to Tailwind
|-- mui.ts         -> how to apply palette to MUI's createTheme
|-- antd.ts        -> how to apply palette to Ant Design tokens
|-- chakra.ts      -> how to apply palette to Chakra's extendTheme
|-- shadcn.ts      -> how to apply palette to CSS variables
|-- mantine.ts     -> how to apply palette to Mantine theme
```

### Handling AI Model Limitations

| Challenge | Mitigation |
|-----------|-----------|
| Hallucinated imports (wrong package names) | Provide EXACT import patterns in the prompt |
| Mixed library usage in same component | Explicit "ONE library per component instance" rule |
| Inconsistent theming | Provide per-library theming instructions |
| Incomplete code on long outputs | Post-process: check for unclosed tags/brackets, request completion |
| Ignores palette colors after long conversation | Repeat palette in EVERY turn, not just first |
| Outdated API knowledge | Library configs provide the current correct API |
| Model quality variance | Recommend proven models; let users experiment and compare |
| Vision not available on all models | Auto-filter to vision models for image-to-palette |

### Post-Processing Pipeline

```
AI Model Output
    |
    v
Extract Code (strip markdown fences, extract JSX/TSX)
    |
    v
Validate Imports (check against known library component maps)
    |
    v
Validate Syntax (quick AST parse for unclosed tags/brackets)
    |
    v
Theme Compliance Check (scan for hardcoded colors not in palette)
    |
    v
Format (Prettier — consistent code style)
    |
    v
Show to User (preview + code)
```

---

## Data Model

```
User -> Palette
User -> Chat -> Message -> CodeVersion
                        -> SlideVersion (if presentation chat)

User
|-- id (cuid)
|-- sessionId (unique — browser fingerprint for no-auth Phase 1)
|-- palettes[]
|-- chats[]
|-- createdAt

Palette
|-- id (cuid)
|-- name
|-- source (IMAGE / CSS / MANUAL)
|-- colors[]
|-- userId
|-- createdAt
|-- updatedAt

Color
|-- id (cuid)
|-- hex
|-- role ("primary", "secondary", "accent", "background", "text", etc.)
|-- paletteId

Chat
|-- id (cuid)
|-- name
|-- type (CODE / PRESENTATION)
|-- framework (REACT / VUE / SVELTE / ANGULAR / HTML — for CODE type)
|-- libraries[] (multi-select, JSON array — for CODE type)
|-- slideTheme (string — "business", "dark", "tech", etc. — for PRESENTATION type)
|-- modelName (string — e.g., "gemma4:e4b", selected from Ollama)
|-- paletteId
|-- linkedChatId (optional — links presentation to its source code chat)
|-- userId
|-- messages[]
|-- createdAt
|-- updatedAt

Message
|-- id (cuid)
|-- role (USER / ASSISTANT)
|-- content (the prompt or response text)
|-- codeVersion (linked CodeVersion, if code chat assistant message)
|-- slideVersion (linked SlideVersion, if presentation chat assistant message)
|-- chatId
|-- createdAt

CodeVersion
|-- id (cuid)
|-- code (full generated code)
|-- version (integer, incrementing)
|-- modelName (string — which model generated this version)
|-- messageId
|-- createdAt

SlideVersion
|-- id (cuid)
|-- markdown (full Marp markdown with embedded theme CSS)
|-- slideCount (integer — number of slides)
|-- version (integer, incrementing)
|-- modelName (string — which model generated this version)
|-- messageId
|-- createdAt
```

### Enums

```
Source:     IMAGE | CSS | MANUAL
ChatType:  CODE | PRESENTATION
Framework: REACT | VUE | SVELTE | ANGULAR | HTML
SlideTheme: DEFAULT | MINIMAL | COLORFUL | DARK | GRADIENT | TECH | BUSINESS
Role:       USER | ASSISTANT
```

---

## Project Architecture

```
jedithui/
|-- src/
|   |-- app/
|   |   |-- page.tsx                    <- Landing / Dashboard
|   |   |-- palettes/
|   |   |   |-- page.tsx                <- Palette list view
|   |   |   |-- [id]/page.tsx           <- Palette detail/edit
|   |   |-- chat/
|   |   |   |-- page.tsx                <- Chat list (code generation)
|   |   |   |-- [id]/page.tsx           <- Chat thread (code generation)
|   |   |-- presentations/
|   |   |   |-- page.tsx                <- Presentation list
|   |   |   |-- [id]/page.tsx           <- Presentation chat thread
|   |   |-- swagger/
|   |   |   |-- page.tsx                <- Swagger import & endpoint browser
|   |   |-- api/
|   |       |-- palettes/route.ts       <- CRUD for palettes
|   |       |-- extract-theme/route.ts  <- Image -> palette (vision model)
|   |       |-- parse-css/route.ts      <- CSS -> palette
|   |       |-- chat/route.ts           <- Chat CRUD (code + presentation)
|   |       |-- generate/route.ts       <- Code generation (user-selected model)
|   |       |-- presentation/
|   |       |   |-- generate/route.ts   <- Marp markdown generation (Ollama)
|   |       |   |-- export/route.ts     <- Marp CLI: markdown -> PPTX/PDF/HTML
|   |       |   |-- preview/route.ts    <- Marp CLI: markdown -> HTML for iframe
|   |       |-- models/route.ts         <- GET: list Ollama models, GET status
|   |       |-- preview/route.ts        <- Code preview: wrap code -> HTML for iframe
|   |       |-- swagger/route.ts        <- OpenAPI spec parsing
|   |-- components/
|   |   |-- palette/
|   |   |   |-- PaletteCard.tsx         <- palette card with [Code] + [Slides] buttons
|   |   |   |-- PaletteEditor.tsx
|   |   |   |-- ColorSwatch.tsx
|   |   |   |-- ImageDropzone.tsx
|   |   |-- chat/
|   |   |   |-- ChatThread.tsx          <- shared chat UI (code + presentation)
|   |   |   |-- MessageBubble.tsx
|   |   |   |-- CodePreview.tsx         <- sandboxed iframe for code preview
|   |   |   |-- SlidePreview.tsx        <- sandboxed iframe for slide preview
|   |   |   |-- SlideFilmstrip.tsx      <- clickable slide thumbnails
|   |   |   |-- VersionTimeline.tsx
|   |   |   |-- ExportButtons.tsx       <- download PPTX/PDF/HTML + copy code
|   |   |-- generator/
|   |   |   |-- PromptInput.tsx
|   |   |   |-- ApiResponseInput.tsx
|   |   |   |-- FrameworkSelector.tsx
|   |   |   |-- LibrarySelector.tsx     <- multi-select with priority
|   |   |   |-- ModelSelector.tsx       <- dropdown of installed Ollama models
|   |   |   |-- ThemeSelector.tsx       <- palette selector for code gen
|   |   |   |-- SlideThemeSelector.tsx  <- 7 Marp themes, previewed in palette colors
|   |   |-- swagger/
|   |   |   |-- SpecImporter.tsx
|   |   |   |-- EndpointBrowser.tsx
|   |   |   |-- EndpointCard.tsx
|   |   |-- ui/                         <- shadcn components
|   |-- lib/
|   |   |-- db.ts                       <- Prisma client
|   |   |-- ollama.ts                   <- Ollama REST API client (chat, generate, model discovery)
|   |   |-- ai/
|   |   |   |-- extract-colors.ts       <- Vision AI logic
|   |   |   |-- generate-code.ts        <- Code generation logic
|   |   |   |-- generate-slides.ts      <- Marp markdown generation logic
|   |   |   |-- prompts/
|   |   |       |-- system.ts           <- Layer 1: System identity (code gen)
|   |   |       |-- system-slides.ts    <- Layer 1: System identity (slide gen)
|   |   |       |-- theme.ts            <- Layer 3: Theme context builder
|   |   |       |-- refinement.ts       <- Refinement prompt builder
|   |   |       |-- marp-syntax.ts      <- Marp syntax rules for AI context
|   |   |-- library-configs/
|   |   |   |-- index.ts               <- Config loader
|   |   |   |-- tailwind.ts
|   |   |   |-- shadcn.ts
|   |   |   |-- mui.ts
|   |   |   |-- antd.ts
|   |   |   |-- chakra.ts
|   |   |   |-- mantine.ts
|   |   |   |-- recharts.ts
|   |   |-- marp/                       <- Marp presentation engine
|   |   |   |-- templates/              <- 7 base Marp themes (CSS embedded in markdown)
|   |   |   |   |-- default.md
|   |   |   |   |-- minimal.md
|   |   |   |   |-- colorful.md
|   |   |   |   |-- dark.md
|   |   |   |   |-- gradient.md
|   |   |   |   |-- tech.md
|   |   |   |   |-- business.md
|   |   |   |-- theme-injector.ts       <- Palette + base theme -> CSS with palette colors
|   |   |   |-- marp-export.ts          <- Calls Marp CLI: md -> pptx/pdf/html
|   |   |   |-- marp-preview.ts         <- Calls Marp CLI: md -> html for iframe
|   |   |-- preview/                    <- Live preview engine (Custom Wrappers)
|   |   |   |-- index.ts               <- Preview orchestrator (detects framework, picks wrapper)
|   |   |   |-- wrappers/
|   |   |   |   |-- html-wrapper.ts     <- Direct render (palette CSS vars injected)
|   |   |   |   |-- react-wrapper.ts    <- Babel Standalone + React CDN + palette CSS
|   |   |   |-- cdn-manager.ts          <- Resolves UI library CDN URLs per chat.libraries
|   |   |   |-- sandbox.ts             <- iframe security (sandbox attrs, CSP)
|   |   |   |-- error-handler.ts       <- Compile/runtime error capture + "Fix this error" prompt
|   |   |-- parsers/
|   |   |   |-- css-parser.ts           <- CSS -> palette
|   |   |   |-- swagger-parser.ts       <- OpenAPI spec parser
|   |   |   |-- api-schema.ts           <- JSON response -> schema merge
|   |   |-- post-process/
|   |   |   |-- extract-code.ts         <- Strip markdown fences
|   |   |   |-- validate-imports.ts     <- Check against library maps
|   |   |   |-- validate-syntax.ts      <- AST parse check
|   |   |   |-- theme-compliance.ts     <- Check for hardcoded colors
|   |   |   |-- formatter.ts            <- Prettier formatting
|   |   |-- theme/
|   |       |-- converter.ts            <- Palette -> framework theme
|   |-- types/
|       |-- index.ts
|-- prisma/
|   |-- schema.prisma
|-- public/
|   |-- preview-assets/                 <- Cached CDN files for offline preview
|   |   |-- babel-standalone.min.js
|   |   |-- react.production.min.js
|   |   |-- react-dom.production.min.js
|-- package.json
|-- next.config.ts
|-- tailwind.config.ts
|-- tsconfig.json
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| AI generates broken code | Live preview with custom wrappers + post-processing pipeline + "Fix this error" auto-prompt |
| JSX compilation fails in browser | Babel Standalone handles most JSX; error overlay shows line number + offers regenerate |
| UI library CDN unavailable | Bundle critical CDNs in `public/preview-assets/` for offline use; fallback to "code only" view |
| Color extraction is inaccurate | Users can edit extracted palettes before saving |
| API response parsing edge cases | Merge multiple samples to infer a stable schema |
| Model context window limits | Send only latest code + new instruction per turn |
| Long code gets truncated | Post-process: detect incomplete code, request continuation |
| Library API changes over time | Library configs are static and maintainable — update as needed |
| Ollama not running / no models | Connection status indicator + clear setup instructions |
| Model quality varies | Recommend defaults, show badges, let users compare per-version |
| User picks non-vision model for image tasks | Auto-filter to vision-capable models for Feature 1 |
| AI generates invalid Marp markdown | Post-process: validate slide separators, check frontmatter, verify CSS block |
| Marp CLI not installed | Check on app start; show install instructions (`npm install -g @marp-team/marp-cli`) |
| Slide theme + palette produces poor contrast | Theme injector includes contrast checks; warn if text/bg contrast ratio < 4.5:1 |
| Presentation scope creep (becomes a full editor) | Keep it chat-based generation only — no drag-and-drop slide editor |

---

## MVP Phasing

| Phase | Features | Reasoning |
|-------|----------|-----------|
| **Phase 1** | Manual palette + Prompt -> React/HTML code + Multi-library selector + Chat-based continuous generation + Ollama model selector + Live preview (HTML + React custom wrappers) | Core loop — pick model, generate, preview live, iterate through conversation |
| **Phase 1.5** | Image -> Palette + CSS -> Palette | Theme extraction completes the palette story |
| **Phase 2** | API Response -> UI + Swagger/OpenAPI import | High ROI feature, needs solid generation first |
| **Phase 2.5** | Palette -> Presentation (Marp integration) — 7 slide themes, chat-based refinement, PPTX/PDF/HTML export | Natural extension: same palette, same chat pattern, different output format |
| **Phase 3** | Multi-framework preview wrappers (Vue, Svelte, Angular) + export configs | Broader audience, heavier preview infrastructure |
| **Phase 4** | Authentication + user accounts + shared palettes | Multi-user, collaboration |

---

## Productivity Impact

### Time Savings Per Task

| Task | Without JEdithUI | With JEdithUI |
|------|-----------------|---------------|
| Extract theme from a website | 30-45 min | ~2 min |
| Parse CSS into structured palette | 20-30 min | ~1 min |
| Build a themed component/page | 1-3 hours | ~5 min |
| Integrate an API response into UI | 2-4 hours | ~5-10 min |
| Theme change across projects | 8+ hours | ~5 min |
| Create a branded presentation | 1-2 hours | ~5 min |
| Preview generated code (no copy-paste) | 5-10 min (manual setup) | Instant (live iframe) |

### Who Benefits

| User | How They Use It |
|------|----------------|
| **Developers** | Fast themed code generation, API -> UI |
| **Teams** | Shared palette library ensures consistency |
| **Designers** | Drop a reference image -> see vision as real code |
| **PMs** | "Make it look like this" -> actual working prototype in minutes |
| **New team members** | Don't need to learn the theme system — pick a palette and prompt |

---

## What Makes JEdithUI Different

| Existing Tool | What It Does | What It Misses |
|--------------|-------------|----------------|
| **v0.dev** | Prompt -> React code | No persistent themes, no API -> UI, cloud-only, no live preview iteration |
| **ChatGPT / Claude** | Generate code from prompts | No theme memory, no palette management, no preview |
| **Coolors.co** | Generate color palettes | No code generation, no presentations |
| **Beautiful.ai** | AI-powered presentations | No palette from code, no code generation |
| **Marp** | Markdown -> slides | No palette management, no AI generation, no live preview |
| **JEdithUI** | **Palette management + multi-library themed code gen + live preview + API -> UI + Swagger import + Marp presentations + chat-based iteration** | It's the glue between design, code, and presentations |

**Unique advantages:**
1. **Persistent theme context** — palettes are saved and reused across code AND presentations
2. **Multi-library awareness** — generates code using the actual libraries you use
3. **Instant live preview** — custom wrappers compile and render React/HTML in-browser, no copy-paste needed
4. **API-aware generation** — from JSON response or full OpenAPI spec to UI
5. **Continuous conversation** — every generation is a chat thread; keep refining forever, pick up where you left off
6. **Palette-to-presentation** — same brand colors in your code AND your pitch deck (Marp → PPTX/PDF)
7. **Runs locally with any model** — Ollama auto-discovers installed models, no cloud dependency, no API costs
8. **Model flexibility** — choose the best model per task; compare outputs; switch mid-chat
9. **Version history** — every iteration is saved, restorable, forkable, and tagged with which model generated it
10. **One interaction model** — code gen and presentation gen use the same chat, same refinement, same version timeline

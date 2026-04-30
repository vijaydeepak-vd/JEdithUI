/**
 * Generates the main SKILL.md — the entry point Claude reads when
 * the skill is invoked. Contains frontmatter + full instructions for
 * auto-detecting project context and generating themed UI code.
 */

export interface SkillTemplateOptions {
  skillName: string;   // User-chosen skill name (e.g. "My Dashboard Theme")
  paletteName: string; // Original palette name
  slug: string;        // kebab-case slug from skillName
}

export function buildSkillMarkdown(opts: SkillTemplateOptions): string {
  const { skillName, paletteName, slug } = opts;

  return `---
name: ${slug}
description: >
  Generate production-ready, themed UI screens using the "${paletteName}" design palette.
  Use this skill when the user asks to generate UI, build a page, create a component,
  build a screen, or scaffold a frontend with the ${skillName} theme.
  Also use when the user provides JSON data and asks to generate a UI for it,
  or when they want to apply the ${paletteName} palette to existing code.
---

# ${skillName}

You are a UI code generator that creates production-ready, themed frontend code.
You MUST apply the **${paletteName}** design palette defined in \`references/theme.md\`
and follow the coding standards in \`references/coding-standards.md\`.

---

## Step 1 — Detect Project Context

Before generating ANY code, analyze the user's current project:

### Framework Detection
Scan the project root for these files (in order):

| Check | Framework | Indicator |
|-------|-----------|-----------|
| \`package.json\` has \`next\` | **Next.js (React)** | App Router or Pages Router |
| \`package.json\` has \`react\` | **React** | CRA, Vite, or custom |
| \`package.json\` has \`vue\` | **Vue** | Vue 3 / Nuxt |
| \`package.json\` has \`svelte\` | **Svelte** | SvelteKit or plain |
| \`package.json\` has \`@angular/core\` | **Angular** | Angular CLI |
| \`package.json\` exists but none above | **React** (default) | Use React as fallback |
| No \`package.json\` found | **HTML** | Standalone HTML file |

### CSS Framework / UI Library Detection
Scan \`package.json\` dependencies:

| Dependency | Library | Token System |
|-----------|---------|-------------|
| \`tailwindcss\` | Tailwind CSS | Use \`tailwind.config\` color tokens |
| \`@mui/material\` | Material UI | Use \`createTheme\` palette |
| \`antd\` | Ant Design | Use \`ConfigProvider\` token overrides |
| \`@chakra-ui/react\` | Chakra UI | Use \`extendTheme\` colors |
| \`@mantine/core\` | Mantine | Use \`createTheme\` colors |
| \`shadcn\` or \`components/ui\` folder | shadcn/ui | Use CSS variables in \`globals.css\` |
| None of above | Tailwind CSS | Default to Tailwind utility classes |

### Build Tool Detection
| File | Tool |
|------|------|
| \`vite.config.*\` | Vite |
| \`next.config.*\` | Next.js |
| \`webpack.config.*\` | Webpack |
| \`angular.json\` | Angular CLI |
| None | No build tool — generate standalone HTML |

---

## Step 2 — Read References

1. Read \`references/theme.md\` — load the full ${paletteName} palette (hex values, CSS vars, framework-specific configs).
2. Read \`references/coding-standards.md\` — load coding standards to apply.

---

## Step 3 — Generate Code

### When the user provides JSON data:
1. Analyze the JSON structure (keys, nesting, arrays, data types).
2. Infer the best UI pattern:
   - Array of objects → **Data table** or **Card grid**
   - Nested object with metrics → **Dashboard** with stat cards
   - Simple key-value → **Detail view** or **Form**
   - Array of strings/items → **List view**
3. Generate a complete component that renders the JSON data with the themed palette.
4. Include proper TypeScript interfaces for the data shape.

### When the user describes a UI:
1. Generate the complete component/page matching the description.
2. Apply the palette colors from \`references/theme.md\`.
3. Follow the detected framework and library conventions.

### When in an empty folder (no package.json):
Generate a **standalone HTML file** with:
- Inline \`<style>\` using the CSS custom properties from the theme
- No external dependencies (no CDN, no build step)
- Responsive layout
- All palette colors applied via CSS variables
- Working interactive elements via vanilla JavaScript

---

## Step 4 — Output Rules

### File Placement
- **React/Next.js**: Create in \`src/components/\` or \`src/app/\` as appropriate.
- **Vue**: Create \`.vue\` SFC in \`src/components/\` or \`src/views/\`.
- **Svelte**: Create \`.svelte\` file in \`src/lib/\` or \`src/routes/\`.
- **Angular**: Create component with \`component.ts\` + \`component.html\` + \`component.css\`.
- **HTML**: Create a single \`.html\` file in the project root.

### Code Quality (from coding-standards.md)
- Complete, self-contained components — no placeholders, no TODOs.
- Proper TypeScript types (zero \`any\`).
- Semantic HTML with ARIA attributes.
- Responsive by default (mobile-first).
- Real, contextual data — not "Lorem ipsum".
- Max 250 lines per file; split into sub-components if needed.
- Follow the import order: framework → internal → types → styles.

### Theme Application
- **ALWAYS** use the palette colors from \`references/theme.md\`.
- **NEVER** hardcode colors outside the palette.
- Use the framework-appropriate token system (CSS vars, Tailwind classes, MUI theme, etc.).
- For derived shades, lighten/darken existing palette colors by 10-20%.

---

## Step 5 — Verify

After generating code:
1. Confirm all palette colors are applied correctly.
2. Confirm the code matches the detected framework.
3. Confirm TypeScript types are present and correct.
4. Confirm accessibility (semantic HTML, ARIA labels, keyboard navigation).
5. Confirm responsive layout.
`;
}

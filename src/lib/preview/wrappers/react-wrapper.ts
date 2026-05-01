import type { PaletteColor, UILibrary } from "@/types";
import { buildCdnTags } from "../cdn-manager";

/**
 * React preview wrapper — Babel Standalone + React CDN + palette CSS.
 * Compiles JSX in-browser and renders to #root.
 */
export function buildReactWrapper(
  code: string,
  palette: PaletteColor[],
  libraries: UILibrary[]
): string {
  const paletteCSS = buildPaletteCSS(palette);
  const cdnTags = buildCdnTags(libraries, "react");
  const transformedCode = transformForBrowser(code);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>JEdithUI Preview</title>

  <!-- React runtime -->
  <script src="/preview-assets/react.production.min.js"></script>
  <script src="/preview-assets/react-dom.production.min.js"></script>

  <!-- Babel Standalone (in-browser JSX compilation) -->
  <script src="/preview-assets/babel-standalone.min.js"></script>

  <!-- lucide-react UMD expects global.react (lowercase) as its React peer -->
  <script>window.react = window.React;</script>
  <script src="/preview-assets/lucide-react.umd.js"></script>

  <!-- clsx (served locally) -->
  <script src="/preview-assets/clsx.min.js"></script>

  <!-- Safety net: ensure globals exist even if a script fails -->
  <script>
    window.LucideReact = window.LucideReact || {};
    window.clsx = window.clsx || function() { return ''; };
  </script>

  ${cdnTags}

  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
    :root {
      ${paletteCSS}
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react,typescript">
    class ErrorBoundary extends React.Component {
      constructor(props) { super(props); this.state = { error: null }; }
      static getDerivedStateFromError(error) { return { error }; }
      render() {
        if (this.state.error) {
          return React.createElement('div', {
            style: { padding: 20, background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, fontFamily: 'monospace', color: '#991b1b' }
          }, React.createElement('strong', null, 'Preview Error'), React.createElement('br'), String(this.state.error));
        }
        return this.props.children;
      }
    }

    ${sanitizeCode(transformedCode)}

    const rootEl = document.getElementById('root');
    if (rootEl) {
      const root = ReactDOM.createRoot(rootEl);
      const AppComponent = typeof App !== 'undefined' ? App : () => React.createElement('div', null, 'No App component found');
      root.render(React.createElement(ErrorBoundary, null, React.createElement(AppComponent)));
    }
  </script>
  <script>
    // Capture runtime errors and display them
    window.onerror = function(msg, src, line, col, err) {
      document.getElementById('root').innerHTML =
        '<div style="padding:20px;background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;font-family:monospace;color:#991b1b">' +
        '<strong>Runtime Error</strong><br/>' + msg +
        (line ? ' (line ' + line + ')' : '') +
        '</div>';
    };
  </script>
</body>
</html>`;
}

function buildPaletteCSS(palette: PaletteColor[]): string {
  return palette
    .map((c) => `--color-${c.role}: ${c.hex};`)
    .join("\n      ");
}

function sanitizeCode(code: string): string {
  // Ensure the code doesn't break the script tag
  return code.replace(/<\/script>/gi, "<\\/script>");
}

// ── Import → Global mapping ──────────────────────────────────

/**
 * Map npm package sources to their browser UMD global variable names.
 * These match the CDN scripts loaded in the preview HTML.
 */
const GLOBAL_MAP: Record<string, string> = {
  // React ecosystem (always loaded via preview-assets)
  react: "React",
  "react-dom": "ReactDOM",
  "react-dom/client": "ReactDOM",
  "react/jsx-runtime": "React",

  // UI libraries (loaded via CDN when selected)
  "@mui/material": "MaterialUI",
  "@mui/icons-material": "MaterialUI",
  antd: "antd",
  "@ant-design/icons": "icons",
  "@chakra-ui/react": "ChakraUI",
  "@mantine/core": "MantineCore",
  "@mantine/hooks": "MantineHooks",
  recharts: "Recharts",
  "@tanstack/react-table": "ReactTable",

  // Common extras the AI might import
  "lucide-react": "LucideReact",
  clsx: "clsx",
};

/**
 * Resolve an import source to its browser global.
 * Tries exact match first, then prefix match for sub-paths.
 */
function resolveGlobal(source: string): string | null {
  if (GLOBAL_MAP[source]) return GLOBAL_MAP[source];

  // Check prefix match: '@mui/material/Button' → MaterialUI
  for (const [prefix, global] of Object.entries(GLOBAL_MAP)) {
    if (source.startsWith(prefix + "/")) return global;
  }

  return null;
}

/**
 * Convert `X as Y` aliases to JS destructuring syntax `X: Y`.
 */
function normalizeNamedImports(raw: string): string {
  return raw
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean)
    .map((n) => n.replace(/(\w+)\s+as\s+(\w+)/, "$1: $2"))
    .join(", ");
}

/**
 * Extract the local binding names from a named import clause.
 * `Button, Card as MyCard` → ["Button", "MyCard"]
 */
function parseLocalNames(namedRaw: string): string[] {
  return namedRaw
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean)
    .map((n) => {
      const alias = n.match(/\w+\s+as\s+(\w+)/);
      return alias ? alias[1] : n.replace(/[^a-zA-Z0-9_$].*/, "").trim();
    })
    .filter((n) => /^\w+$/.test(n));
}

/**
 * Generate safe stubs for names imported from a package the sandbox can't resolve.
 * Capitalized names → passthrough component div wrapper (safe in JSX).
 * Lowercase names → no-op function (safe to call).
 */
function generateStubs(localNames: string[], source: string): string {
  const lines = [`// [preview - unresolved import: ${source}]`];
  for (const name of localNames) {
    if (/^[A-Z]/.test(name)) {
      lines.push(
        `const ${name} = ({ children, className, style, ...p }) => React.createElement('div', { className, style }, children);`
      );
    } else {
      lines.push(`const ${name} = (..._args) => null;`);
    }
  }
  return lines.join("\n");
}

/**
 * Transform ES module code into browser-compatible code:
 * - `import { X } from 'lib'` → `const { X } = GlobalLib;`
 * - `export default function App` → `function App`
 * - Strips type imports, side-effect imports, and unresolvable imports
 */
function transformForBrowser(code: string): string {
  return (
    code
      // 1. Strip TypeScript type-only imports
      .replace(/^import\s+type\s+.*$/gm, "")

      // 2. Default + named: import React, { useState } from 'react'
      .replace(
        /^import\s+(\w+)\s*,\s*\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?\s*$/gm,
        (match, defName, namedRaw, source) => {
          const g = resolveGlobal(source);
          if (!g) return generateStubs([defName, ...parseLocalNames(namedRaw)], source);
          const named = normalizeNamedImports(namedRaw);
          const parts: string[] = [];
          if (defName !== g) parts.push(`const ${defName} = (typeof ${g} !== 'undefined' ? ${g} : {});`);
          if (named) parts.push(`const { ${named} } = (typeof ${g} !== 'undefined' ? ${g} : {});`);
          return parts.join("\n");
        }
      )

      // 3. Named: import { useState, useEffect } from 'react'
      .replace(
        /^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?\s*$/gm,
        (match, namedRaw, source) => {
          const g = resolveGlobal(source);
          if (!g) return generateStubs(parseLocalNames(namedRaw), source);
          const named = normalizeNamedImports(namedRaw);
          return named ? `const { ${named} } = (typeof ${g} !== 'undefined' ? ${g} : {});` : "";
        }
      )

      // 4. Default only: import React from 'react'
      .replace(
        /^import\s+(\w+)\s+from\s+['"]([^'"]+)['"];?\s*$/gm,
        (match, name, source) => {
          const g = resolveGlobal(source);
          if (!g) return generateStubs([name], source);
          return name === g ? "" : `const ${name} = (typeof ${g} !== 'undefined' ? ${g} : {});`;
        }
      )

      // 5. Namespace: import * as React from 'react'
      .replace(
        /^import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"];?\s*$/gm,
        (_, name, source) => {
          const g = resolveGlobal(source);
          if (!g) return generateStubs([name], source);
          return name === g ? "" : `const ${name} = (typeof ${g} !== 'undefined' ? ${g} : {});`;
        }
      )

      // 6. Side-effect imports: import 'styles.css'
      .replace(/^import\s+['"][^'"]+['"];?\s*$/gm, "")

      // 7. Catch-all: strip any remaining import lines
      .replace(/^import\s+.+$/gm, (match) => `// [preview] ${match.trim()}`)

      // 8. Remove export keywords (keep the declarations)
      .replace(/^export\s+default\s+function\s+/gm, "function ")
      .replace(/^export\s+default\s+class\s+/gm, "class ")
      .replace(/^export\s+default\s+/gm, "")
      .replace(
        /^export\s+(const|let|var|function|class)\s+/gm,
        "$1 "
      )

      // 9. Strip TS type assertions that break Babel preview
      //    e.g. `} as any`, `} as React.CSSProperties`, `} as const`
      .replace(/\}\s+as\s+(?:any|const|React\.\w+|CSSProperties|Record<[^>]+>|[A-Z]\w*(?:<[^>]+>)?)\s*/g, "} ")

      // 10. Strip inline `as Type` on expressions (e.g. `value as string`)
      .replace(/(\w)\s+as\s+(?:any|string|number|boolean|React\.\w+|CSSProperties|[A-Z]\w*(?:<[^>]+>)?)/g, "$1")

      // 11. Strip interface/type declarations (pure TS, no runtime value)
      .replace(/^(?:export\s+)?(?:interface|type)\s+\w+[\s\S]*?(?=\n(?:const|let|var|function|class|\/\/|\/\*|$))/gm, "")

      // 12. Strip generic type parameters on function declarations
      //     e.g. `function App<T extends Props>()` → `function App()`
      .replace(/(function\s+\w+)<[^>]+>/g, "$1")
  );
}

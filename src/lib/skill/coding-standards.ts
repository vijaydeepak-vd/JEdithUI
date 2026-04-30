/**
 * Generic coding standards template — framework-agnostic best practices
 * derived from Karpathy principles + Walmart FE standards.
 * Rendered as `references/coding-standards.md` inside the exported skill.
 */
export function buildCodingStandardsMarkdown(): string {
  return `# Coding Standards

Apply these standards to every file you generate or modify.

## Philosophy

1. **Think before coding.** State assumptions explicitly. If uncertain, ask.
2. **Simplicity first.** Minimum code that solves the problem. Nothing speculative.
3. **Surgical changes.** Touch only what you must. Match existing style.
4. **Goal-driven execution.** Break work into verifiable goals with clear success criteria.

---

## Project Structure

Organize code by responsibility:

| Folder | Purpose |
|--------|---------|
| \`pages/\` or \`app/\` | Route-level page components (UI wiring only, no API calls) |
| \`components/\` | Reusable and feature-specific UI components |
| \`services/\` or \`api/\` | All API call logic (fetch/axios wrappers) |
| \`hooks/\` | Custom hooks — shared stateful logic |
| \`types/\` | Interfaces and enums, one file per domain/feature |
| \`constants/\` | Static values, config, options — no magic numbers |
| \`utils/\` | Pure logic and reusable helpers, one file per concern |
| \`styles/\` or \`theme/\` | Theme configuration and shared styles |

## File Rules

- **Max 250 lines per file.** If a file grows beyond this, split it.
- **One main component/export per file.**
- **No barrel files** that re-export everything — import directly.

## Naming

- \`camelCase\` for functions and variables.
- \`PascalCase\` for components, types, and interfaces.
- \`UPPER_SNAKE_CASE\` for constants.
- Do not include the folder name in file names (\`utils/format.ts\` not \`utils/utilFormat.ts\`).

## Import Order

1. Framework/external libraries
2. Internal modules (components, hooks, utils)
3. Types
4. Styles

Remove unused imports.

---

## Code Quality

### Types
- **Zero \`any\` types.** Replace every \`any\` with a proper interface, union, or generic.
- Define interfaces in \`types/\` — one file per domain. Import them; don't define inline.

### Constants
- All static values go in \`constants/\` — no magic strings or numbers in components.
- Replace hardcoded dates with dynamic values.

### API Layer
- All API calls must live in \`services/\` or \`api/\`.
- Never put fetch/axios calls directly in page or component files.
- Always validate response status before using data.
- Wrap every API call in try/catch; surface user-friendly error messages.

### Error Handling
- Handle API failures and empty states explicitly in UI components.
- Provide user-friendly error messages and fallback UI.
- Add proper error states instead of infinite loaders on API failure.
- No \`console.log\`, \`console.error\`, \`console.warn\` in production code.

### State Management
- When a component has more than 5 \`useState\` hooks, refactor to \`useReducer\` or a custom hook.
- Prefer a single source of truth for filter/selection state.

---

## Performance

- Use memoization (\`React.memo\`, \`useMemo\`) for expensive calculations (sorting, filtering, aggregation).
- Use \`useCallback\` for handlers passed as props — ensure dependency arrays are correct.
- Never create objects/arrays inline in JSX props.
- Add loading skeletons for async content instead of empty states or spinners.
- Virtualize long lists (100+ items).

---

## Accessibility

- Use semantic HTML elements (\`button\`, \`nav\`, \`main\`, \`section\`).
- Add proper labels and ARIA attributes for interactive elements.
- Ensure keyboard navigation support for all interactive UI.
- Maintain WCAG AA contrast ratios.

---

## Clean Code

- **Remove unused code** — imports, variables, functions, components.
- **Remove commented-out code blocks.**
- **Comments only for complex logic** — prefer clear naming over comments.
- **DRY** — before adding code, check if similar logic already exists.

---

## Testing

- On every change, check for existing tests.
- If tests exist: run them and fix any failures.
- If no tests exist: add test coverage for the changed behavior.
- Aim for: component rendering, user interactions, API integration, edge cases.
`;
}

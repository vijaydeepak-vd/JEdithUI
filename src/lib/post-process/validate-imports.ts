import type { UILibrary } from "@/types";

/**
 * Known valid import sources for each library.
 * Used to detect hallucinated imports from the AI.
 */
const VALID_IMPORTS: Record<UILibrary, string[]> = {
  tailwind: [], // No imports — class-based
  shadcn: [], // No CDN — prompt tells AI to use inline Tailwind instead
  mui: ["@mui/material", "@mui/icons-material", "@emotion/react", "@emotion/styled"],
  antd: ["antd", "@ant-design/icons"],
  chakra: ["@chakra-ui/react"],
  mantine: ["@mantine/core", "@mantine/hooks", "@mantine/dates", "@mantine/form"],
  recharts: ["recharts"],
  "react-table": ["@tanstack/react-table"],
};

export interface ImportValidationResult {
  valid: boolean;
  suspiciousImports: string[];
  warnings: string[];
}

export function validateImports(
  code: string,
  selectedLibraries: UILibrary[]
): ImportValidationResult {
  const importLines = code.match(/^import .+ from ['"].+['"]/gm) || [];
  const suspiciousImports: string[] = [];
  const warnings: string[] = [];

  for (const line of importLines) {
    const sourceMatch = line.match(/from ['"](.+)['"]/);
    if (!sourceMatch) continue;
    const source = sourceMatch[1];

    // Always allow react and react-dom
    if (source.startsWith("react") || source === "react-dom") continue;
    // Always allow sandbox-provided packages (lucide-react, clsx)
    if (source === "lucide-react" || source === "clsx") continue;
    // Allow relative imports
    if (source.startsWith(".") || source.startsWith("@/")) continue;
    // Allow node built-ins
    if (!source.includes("/") && !source.startsWith("@")) {
      // Check if it's a known valid package for selected libraries
    }

    const isValid = selectedLibraries.some((lib) =>
      VALID_IMPORTS[lib]?.some((prefix) => source.startsWith(prefix))
    );

    if (!isValid) {
      suspiciousImports.push(source);
      warnings.push(`Suspicious import: "${source}" — not in selected libraries`);
    }
  }

  return {
    valid: suspiciousImports.length === 0,
    suspiciousImports,
    warnings,
  };
}

import type { PaletteColor, UILibrary } from "@/types";

/**
 * Layer 3: Theme context — palette injection for each library.
 * Repeated on EVERY turn so the AI never forgets the palette.
 */
export function buildThemeContext(
  colors: PaletteColor[],
  libraries: UILibrary[]
): string {
  const colorMap = Object.fromEntries(colors.map((c) => [c.role, c.hex]));

  const lines: string[] = [
    "## Active Color Palette",
    "Apply these exact colors throughout the UI:",
    "",
    ...colors.map(
      (c) =>
        `- **${c.role}**: \`${c.hex}\` — use for ${getRoleUsage(c.role)}`
    ),
    "",
    "## Library Theming Instructions",
  ];

  for (const lib of libraries) {
    lines.push(...getLibraryThemingInstructions(lib, colorMap));
  }

  return lines.join("\n");
}

function getRoleUsage(role: string): string {
  const usages: Record<string, string> = {
    primary: "main actions, headers, key elements",
    secondary: "supporting elements, secondary buttons",
    accent: "highlights, CTAs, interactive states",
    background: "page/card backgrounds",
    text: "body text, paragraphs",
    surface: "card surfaces, panel backgrounds",
    border: "dividers, input borders",
    success: "success states, confirmations",
    warning: "warnings, alerts",
    error: "error states, destructive actions",
    info: "informational elements",
  };
  return usages[role] || role;
}

function getLibraryThemingInstructions(
  lib: UILibrary,
  colorMap: Record<string, string>
): string[] {
  switch (lib) {
    case "tailwind":
      return [
        "### Tailwind CSS",
        `- Use inline styles or CSS variables for palette colors since they are custom.`,
        `- Style with: style={{ backgroundColor: '${colorMap.primary || "#3b82f6"}' }}`,
        `- Or use Tailwind's arbitrary values: className="bg-[${colorMap.primary || "#3b82f6"}]"`,
        "",
      ];
    case "shadcn":
      return [
        "### shadcn/ui",
        `- shadcn/ui has NO CDN — do NOT import from "@/components/ui/*" paths.`,
        `- Instead, implement components inline using plain HTML elements styled with Tailwind CSS utility classes.`,
        `- Style buttons, cards, inputs etc. directly: <button className="px-4 py-2 rounded-md bg-[${colorMap.primary || "#3b82f6"}] text-white hover:opacity-90">`,
        `- Use palette colors via inline style or Tailwind arbitrary values: bg-[${colorMap.primary || "#3b82f6"}]`,
        "",
      ];
    case "mui":
      return [
        "### Material UI (MUI)",
        `- Import from: import { Button, Box } from "@mui/material"`,
        `- Create theme: const theme = createTheme({ palette: { primary: { main: '${colorMap.primary || "#3b82f6"}' }, secondary: { main: '${colorMap.secondary || "#e2e8f0"}' } } })`,
        `- Wrap with: <ThemeProvider theme={theme}>`,
        "",
      ];
    case "antd":
      return [
        "### Ant Design",
        `- Import from: import { Button, Table } from "antd"`,
        `- Use ConfigProvider: <ConfigProvider theme={{ token: { colorPrimary: '${colorMap.primary || "#3b82f6"}', colorBgContainer: '${colorMap.surface || "#ffffff"}' } }}>`,
        "",
      ];
    case "chakra":
      return [
        "### Chakra UI",
        `- Import from: import { Box, Button, Text } from "@chakra-ui/react"`,
        `- Extend theme: extendTheme({ colors: { brand: { 500: '${colorMap.primary || "#3b82f6"}' } } })`,
        `- Wrap with: <ChakraProvider theme={theme}>`,
        `- Use brand colors: colorScheme="brand" or color="${colorMap.accent || "#f59e0b"}"`,
        "",
      ];
    case "mantine":
      return [
        "### Mantine",
        `- Import from: import { Button, Card, TextInput } from "@mantine/core"`,
        `- Use MantineProvider: <MantineProvider theme={{ primaryColor: 'brand', colors: { brand: ['${colorMap.primary || "#3b82f6"}'] } }}>`,
        `- Override with: style={{ backgroundColor: '${colorMap.primary || "#3b82f6"}' }}`,
        "",
      ];
    case "recharts":
      return [
        "### Recharts",
        `- Import from: import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"`,
        `- Use palette colors for fills: <Bar fill="${colorMap.primary || "#3b82f6"}" />`,
        `- Accent for highlights: <Bar fill="${colorMap.accent || "#f59e0b"}" />`,
        "",
      ];
    case "react-table":
      return [
        "### TanStack Table",
        `- Import from: import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table"`,
        `- Style headers with: style={{ backgroundColor: '${colorMap.primary || "#693FBD"}', color: '${colorMap.text || "#ffffff"}' }}`,
        `- Alternating rows: even rows use '${colorMap.surface || "#f5f5f5"}'`,
        "",
      ];
    default:
      return [];
  }
}

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
        `- Style with: style={{ backgroundColor: '${colorMap.primary || "#344620"}' }}`,
        `- Or use Tailwind's arbitrary values: className="bg-[${colorMap.primary || "#344620"}]"`,
        "",
      ];
    case "shadcn":
      return [
        "### shadcn/ui",
        `- Import from: import { Button } from "@/components/ui/button"`,
        `- Use variant="default" for primary actions (maps to --primary CSS var)`,
        `- Override with style prop for palette colors: style={{ backgroundColor: '${colorMap.accent || "#d57a2a"}' }}`,
        "",
      ];
    case "mui":
      return [
        "### Material UI (MUI)",
        `- Import from: import { Button, Box } from "@mui/material"`,
        `- Create theme: const theme = createTheme({ palette: { primary: { main: '${colorMap.primary || "#344620"}' }, secondary: { main: '${colorMap.secondary || "#eaeedd"}' } } })`,
        `- Wrap with: <ThemeProvider theme={theme}>`,
        "",
      ];
    case "antd":
      return [
        "### Ant Design",
        `- Import from: import { Button, Table } from "antd"`,
        `- Use ConfigProvider: <ConfigProvider theme={{ token: { colorPrimary: '${colorMap.primary || "#344620"}', colorBgContainer: '${colorMap.surface || "#ffffff"}' } }}>`,
        "",
      ];
    case "chakra":
      return [
        "### Chakra UI",
        `- Import from: import { Box, Button, Text } from "@chakra-ui/react"`,
        `- Extend theme: extendTheme({ colors: { brand: { 500: '${colorMap.primary || "#344620"}' } } })`,
        `- Wrap with: <ChakraProvider theme={theme}>`,
        `- Use brand colors: colorScheme="brand" or color="${colorMap.accent || "#d57a2a"}"`,
        "",
      ];
    case "mantine":
      return [
        "### Mantine",
        `- Import from: import { Button, Card, TextInput } from "@mantine/core"`,
        `- Use MantineProvider: <MantineProvider theme={{ primaryColor: 'brand', colors: { brand: ['${colorMap.primary || "#344620"}'] } }}>`,
        `- Override with: style={{ backgroundColor: '${colorMap.primary || "#344620"}' }}`,
        "",
      ];
    case "recharts":
      return [
        "### Recharts",
        `- Import from: import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"`,
        `- Use palette colors for fills: <Bar fill="${colorMap.primary || "#344620"}" />`,
        `- Accent for highlights: <Bar fill="${colorMap.accent || "#d57a2a"}" />`,
        "",
      ];
    case "react-table":
      return [
        "### TanStack Table",
        `- Import from: import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table"`,
        `- Style headers with: style={{ backgroundColor: '${colorMap.primary || "#344620"}', color: '${colorMap.text || "#ffffff"}' }}`,
        `- Alternating rows: even rows use '${colorMap.surface || "#f5f5f5"}'`,
        "",
      ];
    default:
      return [];
  }
}

import type { LibraryConfig, UILibrary } from "@/types";

export const LIBRARY_CONFIGS: Record<UILibrary, LibraryConfig> = {
  tailwind: {
    id: "tailwind",
    name: "Tailwind CSS",
    description: "Utility-first CSS framework",
    importPattern: "// Use Tailwind utility classes directly — no imports needed",
    themingInstructions: `Use CSS custom properties for palette integration:
- var(--color-primary) for primary brand color
- var(--color-secondary) for secondary color
- var(--color-accent) for accent/highlight color
- var(--color-background) for backgrounds
- var(--color-text) for text
- Apply these via inline styles or extend Tailwind config`,
    cdnUrls: ["https://cdn.tailwindcss.com"],
    cdnGlobals: {},
    componentMap: {
      Button: "button with Tailwind classes",
      Card: "div with rounded shadow classes",
      Input: "input with border and focus classes",
      Badge: "span with px-2 py-1 rounded",
    },
  },

  shadcn: {
    id: "shadcn",
    name: "shadcn/ui",
    description: "Beautifully designed Radix UI components",
    importPattern: `import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";`,
    themingInstructions: `shadcn/ui uses CSS custom properties. Theme via globals.css:
- --primary: hsl() value for primary actions
- --secondary: hsl() for secondary
- --accent: hsl() for accents
- --background: hsl() for page background
- --foreground: hsl() for text
Convert palette hex to HSL values and inject them.`,
    cdnUrls: [],
    cdnGlobals: {},
    componentMap: {
      Button: "Button",
      Card: "Card + CardHeader + CardContent",
      Input: "Input",
      Badge: "Badge",
      Select: "Select + SelectTrigger + SelectContent",
    },
  },

  mui: {
    id: "mui",
    name: "Material UI",
    description: "Google Material Design components",
    importPattern: `import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import { ThemeProvider, createTheme } from '@mui/material/styles';`,
    themingInstructions: `Create a MUI theme using palette colors:
const theme = createTheme({
  palette: {
    primary: { main: '<primary-hex>' },
    secondary: { main: '<secondary-hex>' },
    background: { default: '<background-hex>' },
  }
});
Wrap the component in <ThemeProvider theme={theme}>.`,
    cdnUrls: [
      "https://unpkg.com/@mui/material@latest/umd/material-ui.production.min.js",
      "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap",
    ],
    cdnGlobals: { "@mui/material": "MaterialUI" },
    componentMap: {
      Button: "Button",
      Card: "Card + CardContent",
      Input: "TextField",
      Badge: "Chip",
      Select: "Select + MenuItem",
      Table: "Table + TableHead + TableBody + TableRow + TableCell",
    },
  },

  antd: {
    id: "antd",
    name: "Ant Design",
    description: "Enterprise-grade React UI library",
    importPattern: `import { Button, Card, Input, Table, Select, Badge, Form } from 'antd';
import { ConfigProvider } from 'antd';`,
    themingInstructions: `Use ConfigProvider for theming:
<ConfigProvider theme={{ token: { colorPrimary: '<primary-hex>', colorBgBase: '<bg-hex>' } }}>
  {/* your component */}
</ConfigProvider>`,
    cdnUrls: [
      "https://unpkg.com/antd@latest/dist/antd.min.js",
      "https://unpkg.com/antd@latest/dist/reset.css",
    ],
    cdnGlobals: { antd: "antd" },
    componentMap: {
      Button: "Button",
      Card: "Card",
      Input: "Input",
      Table: "Table",
      Select: "Select",
      Badge: "Badge",
      Form: "Form + Form.Item",
    },
  },

  chakra: {
    id: "chakra",
    name: "Chakra UI",
    description: "Accessible, themeable React component library",
    importPattern: `import { Box, Button, Card, Input, Badge, Flex, Text } from '@chakra-ui/react';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';`,
    themingInstructions: `Extend theme with palette colors:
const theme = extendTheme({
  colors: {
    brand: { 500: '<primary-hex>', 600: '<secondary-hex>' },
    accent: { 500: '<accent-hex>' }
  }
});
Wrap in <ChakraProvider theme={theme}>.`,
    cdnUrls: [
      "https://unpkg.com/@chakra-ui/react@latest/dist/chakra-ui-react.cjs.js",
    ],
    cdnGlobals: { "@chakra-ui/react": "ChakraUI" },
    componentMap: {
      Button: "Button",
      Card: "Box with shadow",
      Input: "Input",
      Badge: "Badge",
      Flex: "Flex",
      Text: "Text",
    },
  },

  mantine: {
    id: "mantine",
    name: "Mantine",
    description: "Full-featured React component library",
    importPattern: `import { Button, Card, TextInput, Badge, Group, Stack, Text } from '@mantine/core';
import { MantineProvider } from '@mantine/core';`,
    themingInstructions: `Set theme via MantineProvider:
<MantineProvider theme={{ primaryColor: 'blue', colors: { blue: ['<palette-shades>'] } }}>
  {/* component */}
</MantineProvider>`,
    cdnUrls: [
      "https://unpkg.com/@mantine/core@latest/esm/index.js",
      "https://unpkg.com/@mantine/core@latest/styles.css",
    ],
    cdnGlobals: { "@mantine/core": "MantineCore" },
    componentMap: {
      Button: "Button",
      Card: "Card",
      Input: "TextInput",
      Badge: "Badge",
      Select: "Select",
    },
  },

  recharts: {
    id: "recharts",
    name: "Recharts",
    description: "Composable charting library built on D3",
    importPattern: `import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';`,
    themingInstructions: `Use palette colors for chart elements:
- Primary color for main data series
- Secondary color for comparison series
- Accent color for highlights
- Pass colors directly to stroke, fill, and Cell fill props`,
    cdnUrls: [
      "https://unpkg.com/recharts@latest/umd/Recharts.js",
    ],
    cdnGlobals: { recharts: "Recharts" },
    componentMap: {
      LineChart: "LineChart + Line",
      BarChart: "BarChart + Bar",
      PieChart: "PieChart + Pie + Cell",
      AreaChart: "AreaChart + Area",
    },
  },

  "react-table": {
    id: "react-table",
    name: "TanStack Table",
    description: "Headless table utility with full control",
    importPattern: `import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  flexRender, createColumnHelper
} from '@tanstack/react-table';`,
    themingInstructions: `TanStack Table is headless — you supply all styling.
Use Tailwind or inline styles with palette colors for:
- Table headers: primary color background
- Alternating rows: light background
- Borders: palette border color`,
    cdnUrls: [
      "https://unpkg.com/@tanstack/react-table@latest/build/umd/index.development.js",
    ],
    cdnGlobals: { "@tanstack/react-table": "TanstackTable" },
    componentMap: {
      Table: "useReactTable + flexRender",
    },
  },
};

export function getLibraryConfig(lib: UILibrary): LibraryConfig {
  return LIBRARY_CONFIGS[lib];
}

export function getLibraryConfigs(libs: UILibrary[]): LibraryConfig[] {
  return libs.map((l) => LIBRARY_CONFIGS[l]).filter(Boolean);
}

export function buildLibraryPromptContext(libs: UILibrary[]): string {
  if (libs.length === 0) return "";
  const configs = getLibraryConfigs(libs);
  return configs
    .map(
      (c) =>
        `### ${c.name}\n**Import pattern:**\n\`\`\`\n${c.importPattern}\n\`\`\`\n**Theming:**\n${c.themingInstructions}`
    )
    .join("\n\n");
}

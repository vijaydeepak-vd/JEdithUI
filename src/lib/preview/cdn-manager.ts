import type { UILibrary } from "@/types";

type Framework = "react" | "html";

interface CDNEntry {
  links: string[];
  scripts: string[];
}

/**
 * CDN URLs for each UI library, grouped by framework context.
 */
const CDN_MAP: Record<UILibrary, CDNEntry> = {
  tailwind: {
    links: [],
    scripts: ['<script src="https://cdn.tailwindcss.com"></script>'],
  },
  shadcn: {
    links: [],
    scripts: [], // shadcn is copy-paste — no CDN
  },
  mui: {
    links: [
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />',
    ],
    scripts: [
      '<script src="https://unpkg.com/@mui/material@5/umd/material-ui.production.min.js" crossorigin="anonymous"></script>',
    ],
  },
  antd: {
    links: [
      '<link rel="stylesheet" href="https://unpkg.com/antd@5/dist/reset.css" />',
    ],
    scripts: [
      '<script src="https://unpkg.com/dayjs/dayjs.min.js"></script>',
      '<script src="https://unpkg.com/antd@5/dist/antd.min.js"></script>',
    ],
  },
  chakra: {
    links: [],
    scripts: [
      '<script src="https://unpkg.com/@chakra-ui/react/dist/umd/chakra-ui-react.min.js" crossorigin="anonymous"></script>',
    ],
  },
  mantine: {
    links: [
      '<link rel="stylesheet" href="https://unpkg.com/@mantine/core/styles.css" />',
    ],
    scripts: [
      '<script src="https://unpkg.com/@mantine/core/dist/mantine-core.umd.min.js" crossorigin="anonymous"></script>',
    ],
  },
  recharts: {
    links: [],
    scripts: [
      '<script src="https://unpkg.com/recharts/umd/Recharts.js" crossorigin="anonymous"></script>',
    ],
  },
  "react-table": {
    links: [],
    scripts: [
      '<script src="https://unpkg.com/@tanstack/react-table/build/umd/index.development.js" crossorigin="anonymous"></script>',
    ],
  },
};

export function buildCdnTags(
  libraries: UILibrary[],
  _framework: Framework
): string {
  const links: string[] = [];
  const scripts: string[] = [];

  for (const lib of libraries) {
    const entry = CDN_MAP[lib];
    if (entry) {
      links.push(...entry.links);
      scripts.push(...entry.scripts);
    }
  }

  // Deduplicate
  const uniqueLinks = [...new Set(links)];
  const uniqueScripts = [...new Set(scripts)];

  return [...uniqueLinks, ...uniqueScripts].join("\n  ");
}

/**
 * Generates the complete skill package as a collection of files.
 * The API route can either stream these as a ZIP (if archiver is available)
 * or return them as JSON for client-side ZIP assembly.
 */
import type { PaletteColor, UILibrary } from "@/types";
import { buildSkillMarkdown } from "./skill-template";
import { buildThemeMarkdown } from "./theme-template";
import { buildCodingStandardsMarkdown } from "./coding-standards";

export interface SkillFile {
  path: string;   // relative path inside the skill folder
  content: string; // file content
}

export interface SkillPackage {
  folderName: string;
  files: SkillFile[];
}

/**
 * Convert a palette name to a URL-safe slug.
 * "Ocean Blue Theme" → "ocean-blue-theme"
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate the full skill package from a palette.
 * @param skillName  User-chosen name for the skill (used in SKILL.md and folder/ZIP name)
 * @param paletteName  Original palette name (used in theme.md)
 */
export function generateSkillPackage(
  skillName: string,
  paletteName: string,
  colors: PaletteColor[],
  libraries: UILibrary[]
): SkillPackage {
  const slug = slugify(skillName);
  const folderName = slug;

  const skillMd = buildSkillMarkdown({ skillName, paletteName, slug });
  const themeMd = buildThemeMarkdown(paletteName, colors, libraries);
  const standardsMd = buildCodingStandardsMarkdown();

  return {
    folderName,
    files: [
      { path: "SKILL.md", content: skillMd },
      { path: "references/theme.md", content: themeMd },
      { path: "references/coding-standards.md", content: standardsMd },
    ],
  };
}

/**
 * Minimal ZIP creation using only Node.js built-in modules.
 * This is a simplified ZIP builder that creates valid ZIP archives
 * for text-only content without needing the archiver dependency.
 */
export function generateSkillZipBufferBuiltin(
  pkg: SkillPackage
): Buffer {
  const files = pkg.files.map((f) => ({
    name: `${pkg.folderName}/${f.path}`,
    content: Buffer.from(f.content, "utf-8"),
  }));

  const parts: Buffer[] = [];
  const centralDir: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuffer = Buffer.from(file.name, "utf-8");
    const content = file.content;

    // CRC-32 computation
    const crc = crc32(content);

    // Local file header
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);  // Local file header signature
    localHeader.writeUInt16LE(20, 4);           // Version needed
    localHeader.writeUInt16LE(0, 6);            // General purpose flags
    localHeader.writeUInt16LE(0, 8);            // Compression: stored (no compression)
    localHeader.writeUInt16LE(0, 10);           // Mod time
    localHeader.writeUInt16LE(0, 12);           // Mod date
    localHeader.writeUInt32LE(crc, 14);         // CRC-32
    localHeader.writeUInt32LE(content.length, 18); // Compressed size
    localHeader.writeUInt32LE(content.length, 22); // Uncompressed size
    localHeader.writeUInt16LE(nameBuffer.length, 26); // File name length
    localHeader.writeUInt16LE(0, 28);           // Extra field length

    // Central directory entry
    const centralEntry = Buffer.alloc(46);
    centralEntry.writeUInt32LE(0x02014b50, 0);  // Central dir signature
    centralEntry.writeUInt16LE(20, 4);          // Version made by
    centralEntry.writeUInt16LE(20, 6);          // Version needed
    centralEntry.writeUInt16LE(0, 8);           // Flags
    centralEntry.writeUInt16LE(0, 10);          // Compression
    centralEntry.writeUInt16LE(0, 12);          // Mod time
    centralEntry.writeUInt16LE(0, 14);          // Mod date
    centralEntry.writeUInt32LE(crc, 16);        // CRC-32
    centralEntry.writeUInt32LE(content.length, 20); // Compressed size
    centralEntry.writeUInt32LE(content.length, 24); // Uncompressed size
    centralEntry.writeUInt16LE(nameBuffer.length, 28); // File name length
    centralEntry.writeUInt16LE(0, 30);          // Extra field length
    centralEntry.writeUInt16LE(0, 32);          // Comment length
    centralEntry.writeUInt16LE(0, 34);          // Disk number start
    centralEntry.writeUInt16LE(0, 36);          // Internal file attributes
    centralEntry.writeUInt32LE(0, 38);          // External file attributes
    centralEntry.writeUInt32LE(offset, 42);     // Offset of local header

    centralDir.push(centralEntry, nameBuffer);

    parts.push(localHeader, nameBuffer, content);
    offset += localHeader.length + nameBuffer.length + content.length;
  }

  const centralDirBuffer = Buffer.concat(centralDir);
  const centralDirOffset = offset;

  // End of central directory record
  const endOfCentralDir = Buffer.alloc(22);
  endOfCentralDir.writeUInt32LE(0x06054b50, 0);  // End signature
  endOfCentralDir.writeUInt16LE(0, 4);            // Disk number
  endOfCentralDir.writeUInt16LE(0, 6);            // Start disk
  endOfCentralDir.writeUInt16LE(files.length, 8); // Entries on this disk
  endOfCentralDir.writeUInt16LE(files.length, 10); // Total entries
  endOfCentralDir.writeUInt32LE(centralDirBuffer.length, 12); // Central dir size
  endOfCentralDir.writeUInt32LE(centralDirOffset, 16); // Central dir offset
  endOfCentralDir.writeUInt16LE(0, 20);           // Comment length

  return Buffer.concat([...parts, centralDirBuffer, endOfCentralDir]);
}

/**
 * CRC-32 computation (no dependencies).
 */
function crc32(buf: Buffer): number {
  // Build table once
  if (!crc32Table) {
    crc32Table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      crc32Table[i] = c;
    }
  }

  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crc32Table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

let crc32Table: Uint32Array | null = null;

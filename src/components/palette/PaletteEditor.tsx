"use client";

import { useState, useRef } from "react";
import { Plus, Save } from "lucide-react";
import { ColorSwatch } from "./ColorSwatch";
import type { PaletteColor, ColorRole } from "@/types";

let nextColorId = 0;
function genColorId() {
  return `color-${Date.now()}-${nextColorId++}`;
}

interface PaletteEditorProps {
  initialName?: string;
  initialColors?: PaletteColor[];
  onSave: (name: string, colors: PaletteColor[]) => Promise<void>;
  saving?: boolean;
}

const ROLE_SUGGESTIONS: ColorRole[] = [
  "primary","secondary","accent","background","text","surface","border",
];

export function PaletteEditor({
  initialName = "",
  initialColors = [],
  onSave,
  saving = false,
}: PaletteEditorProps) {
  const [name, setName] = useState(initialName);
  const [colors, setColors] = useState<PaletteColor[]>(
    initialColors.length > 0
      ? initialColors
      : [
          { hex: "#344620", role: "primary", order: 0 },
          { hex: "#eaeedd", role: "secondary", order: 1 },
          { hex: "#d57a2a", role: "accent", order: 2 },
          { hex: "#FFFFFF", role: "background", order: 3 },
          { hex: "#363636", role: "text", order: 4 },
        ]
  );

  // Stable IDs for React keys — survive add/delete without shifting
  const colorKeys = useRef<string[]>(colors.map(() => genColorId()));
  // Keep keys array in sync with colors length
  while (colorKeys.current.length < colors.length) {
    colorKeys.current.push(genColorId());
  }

  const addColor = () => {
    const unusedRole =
      ROLE_SUGGESTIONS.find((r) => !colors.find((c) => c.role === r)) ||
      `color-${colors.length}`;
    colorKeys.current.push(genColorId());
    setColors([...colors, { hex: "#888888", role: unusedRole as ColorRole, order: colors.length }]);
  };

  const updateColor = (idx: number, hex: string) => {
    setColors(colors.map((c, i) => (i === idx ? { ...c, hex } : c)));
  };

  const updateRole = (idx: number, role: string) => {
    setColors(colors.map((c, i) => (i === idx ? { ...c, role: role as ColorRole } : c)));
  };

  const deleteColor = (idx: number) => {
    colorKeys.current.splice(idx, 1);
    setColors(colors.filter((_, i) => i !== idx).map((c, i) => ({ ...c, order: i })));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    await onSave(name.trim(), colors);
  };

  return (
    <div className="space-y-4">
      {/* Palette name */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Palette Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Brand Colors, Dark Theme…"
          className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-jedith-copper/50"
        />
      </div>

      {/* Colors */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Colors
        </label>
        <div className="mt-2 flex flex-wrap gap-4">
          {colors.map((color, idx) => (
            <ColorSwatch
              key={colorKeys.current[idx]}
              color={color}
              editable
              size="lg"
              onColorChange={(hex) => updateColor(idx, hex)}
              onRoleChange={(role) => updateRole(idx, role)}
              onDelete={() => deleteColor(idx)}
            />
          ))}

          {colors.length < 12 && (
            <button
              onClick={addColor}
              className="w-16 h-16 rounded-lg border-2 border-dashed border-border hover:border-jedith-copper text-muted-foreground hover:text-jedith-copper transition-colors flex items-center justify-center"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving || !name.trim() || colors.length === 0}
        className="flex items-center gap-2 px-4 py-2 bg-jedith-forest text-white rounded-lg text-sm font-medium hover:bg-jedith-forest-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Save className="w-4 h-4" />
        {saving ? "Saving…" : "Save Palette"}
      </button>
    </div>
  );
}

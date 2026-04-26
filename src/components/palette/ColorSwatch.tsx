"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { PaletteColor } from "@/types";

interface ColorSwatchProps {
  color: PaletteColor;
  editable?: boolean;
  onColorChange?: (hex: string) => void;
  onRoleChange?: (role: string) => void;
  onDelete?: () => void;
  size?: "sm" | "md" | "lg";
}

const ROLES = [
  "primary","secondary","accent","background","text",
  "surface","border","success","warning","error","info",
];

export function ColorSwatch({
  color,
  editable = false,
  onColorChange,
  onRoleChange,
  onDelete,
  size = "md",
}: ColorSwatchProps) {
  const [showPicker, setShowPicker] = useState(false);

  const sizeClass = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }[size];

  return (
    <div className="flex flex-col items-center gap-1 group">
      <div className="relative">
        <div
          className={cn(
            sizeClass,
            "rounded-lg border-2 border-white shadow-sm cursor-pointer transition-transform hover:scale-105",
            editable && "hover:ring-2 hover:ring-jedith-coral"
          )}
          style={{ backgroundColor: color.hex }}
          onClick={() => editable && setShowPicker(!showPicker)}
          title={`${color.role}: ${color.hex}`}
        />

        {editable && onDelete && (
          <button
            onClick={onDelete}
            className="absolute -top-1.5 -right-1.5 hidden group-hover:flex w-4 h-4 bg-destructive text-white rounded-full items-center justify-center text-[10px] leading-none"
          >
            ×
          </button>
        )}

        {/* Color picker overlay */}
        {showPicker && editable && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg p-2 shadow-lg min-w-[140px]">
            <input
              type="color"
              value={color.hex}
              onChange={(e) => onColorChange?.(e.target.value)}
              className="w-full h-8 cursor-pointer rounded border-0"
            />
            <select
              value={color.role}
              onChange={(e) => onRoleChange?.(e.target.value)}
              className="mt-1 w-full text-xs border border-border rounded px-1 py-0.5 bg-background"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button
              onClick={() => setShowPicker(false)}
              className="mt-1 w-full text-xs text-muted-foreground hover:text-foreground"
            >
              Done
            </button>
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-[10px] font-medium text-foreground capitalize leading-none">
          {color.role}
        </p>
        <p className="text-[9px] text-muted-foreground font-mono leading-none mt-0.5">
          {color.hex}
        </p>
      </div>
    </div>
  );
}

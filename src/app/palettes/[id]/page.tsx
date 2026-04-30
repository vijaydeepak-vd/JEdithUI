"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Code2, Presentation, Trash2, Save, Loader2, Sparkles, Download } from "lucide-react";
import Link from "next/link";
import { PaletteEditor } from "@/components/palette/PaletteEditor";
import { ColorSwatch } from "@/components/palette/ColorSwatch";
import { usePalettes } from "@/hooks/usePalettes";
import { SkillNameModal } from "@/components/ui/SkillNameModal";
import { getOrCreateSessionId } from "@/lib/utils";
import type { PaletteData, PaletteColor } from "@/types";

export default function PaletteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { palettes, updatePalette, deletePalette } = usePalettes();
  const [palette, setPalette] = useState<PaletteData | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloadingSkill, setDownloadingSkill] = useState(false);
  const [skillModalOpen, setSkillModalOpen] = useState(false);

  useEffect(() => {
    const found = palettes.find((p) => p.id === id);
    if (found) setPalette(found);
  }, [palettes, id]);

  // Fetch directly if not in cache yet
  useEffect(() => {
    if (palette) return;
    const sessionId = getOrCreateSessionId();
    fetch(`/api/palettes/${id}`, {
      headers: { "x-session-id": sessionId },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.palette) setPalette(data.palette);
      })
      .catch(console.error);
  }, [id, palette]);

  const handleSave = async (name: string, colors: PaletteColor[]) => {
    setSaving(true);
    try {
      await updatePalette(id, { name, colors });
      setPalette((p) => (p ? { ...p, name, colors } : p));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this palette? All chats using it will also be deleted.")) return;
    setDeleting(true);
    try {
      await deletePalette(id);
      router.push("/palettes");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadSkill = async (skillName: string) => {
    setSkillModalOpen(false);
    setDownloadingSkill(true);
    try {
      const params = new URLSearchParams({ name: skillName });
      const res = await fetch(`/api/palette/${id}/skill?${params}`);
      if (!res.ok) throw new Error("Failed to generate skill");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] || `${skillName}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Skill download failed:", e);
    } finally {
      setDownloadingSkill(false);
    }
  };

  if (!palette) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const SOURCE_LABELS: Record<string, string> = {
    MANUAL: "Manual",
    IMAGE: "From Screenshot",
    CSS: "From CSS",
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/palettes" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">{palette.name}</h1>
            <p className="text-xs text-muted-foreground">
              {SOURCE_LABELS[palette.source]} · {palette.colors.length} colors
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Color preview */}
      {!editing && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {palette.colors.map((c, i) => (
              <ColorSwatch key={i} color={c} size="lg" showLabel />
            ))}
          </div>

          {/* Color strip */}
          <div className="flex h-10 rounded-lg overflow-hidden">
            {palette.colors.map((c, i) => (
              <div
                key={i}
                className="flex-1"
                style={{ backgroundColor: c.hex }}
                title={`${c.role}: ${c.hex}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Edit mode */}
      {editing && (
        <PaletteEditor
          initialColors={palette.colors}
          initialName={palette.name}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {/* Actions */}
      {!editing && (
        <div className="grid grid-cols-3 gap-4">
          <Link
            href={`/chat/new?paletteId=${palette.id}`}
            className="flex items-center justify-center gap-2 p-4 rounded-xl border border-border hover:border-jedith-navy hover:bg-muted/30 transition-all group"
          >
            <Code2 className="w-5 h-5 text-jedith-navy group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <p className="text-sm font-semibold">Generate Code</p>
              <p className="text-xs text-muted-foreground">Open a themed code chat</p>
            </div>
          </Link>

          <Link
            href={`/presentations/new?paletteId=${palette.id}`}
            className="flex items-center justify-center gap-2 p-4 rounded-xl border border-border hover:border-jedith-coral hover:bg-muted/30 transition-all group"
          >
            <Presentation className="w-5 h-5 text-jedith-coral group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <p className="text-sm font-semibold">Generate Slides</p>
              <p className="text-xs text-muted-foreground">Create a Marp presentation</p>
            </div>
          </Link>

          <button
            onClick={() => setSkillModalOpen(true)}
            disabled={downloadingSkill}
            className="flex items-center justify-center gap-2 p-4 rounded-xl border border-border hover:border-purple-500 hover:bg-muted/30 transition-all group disabled:opacity-50"
          >
            {downloadingSkill ? (
              <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
            )}
            <div className="text-left">
              <p className="text-sm font-semibold">Claude Skill</p>
              <p className="text-xs text-muted-foreground">Download as AI skill</p>
            </div>
          </button>
        </div>
      )}

      {/* Skill name modal */}
      <SkillNameModal
        open={skillModalOpen}
        defaultName={palette.name}
        onConfirm={handleDownloadSkill}
        onCancel={() => setSkillModalOpen(false)}
      />
    </div>
  );
}

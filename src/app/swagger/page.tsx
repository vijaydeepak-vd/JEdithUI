"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileCode2, Upload, Link2, ChevronRight, Loader2 } from "lucide-react";
import { getOrCreateSessionId } from "@/lib/utils";
import type { SwaggerParseResult } from "@/types";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700",
  POST: "bg-green-100 text-green-700",
  PUT: "bg-yellow-100 text-yellow-700",
  DELETE: "bg-red-100 text-red-700",
  PATCH: "bg-purple-100 text-purple-700",
};

export default function SwaggerPage() {
  const router = useRouter();
  const [specText, setSpecText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<SwaggerParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!specText.trim()) return;
    setParsing(true);
    setError(null);
    try {
      const sessionId = getOrCreateSessionId();
      const res = await fetch("/api/swagger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specText, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");
      setResult(data.parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse spec");
    } finally {
      setParsing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setSpecText(ev.target?.result as string);
    reader.readAsText(file);
  };

  const generateForEndpoint = (endpointIdx: number) => {
    if (!result) return;
    const endpoint = result.endpoints[endpointIdx];
    router.push(
      `/chat/new?swagger=${encodeURIComponent(JSON.stringify(endpoint))}`
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileCode2 className="w-6 h-6 text-jedith-coral" />
          Swagger / OpenAPI Import
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Import an OpenAPI spec and generate UI for each endpoint
        </p>
      </div>

      {/* Input */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border cursor-pointer hover:bg-muted text-sm text-muted-foreground transition-colors">
            <Upload className="w-4 h-4" />
            Upload File
            <input
              type="file"
              accept=".json,.yaml,.yml"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <span className="text-xs text-muted-foreground">or paste JSON/YAML below</span>
        </div>

        <textarea
          value={specText}
          onChange={(e) => setSpecText(e.target.value)}
          rows={12}
          placeholder={`Paste your OpenAPI/Swagger spec here:\n\n{\n  "openapi": "3.0.0",\n  "info": { "title": "My API", "version": "1.0.0" },\n  "paths": { ... }\n}`}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-jedith-coral/50"
        />

        <button
          onClick={handleParse}
          disabled={!specText.trim() || parsing}
          className="flex items-center gap-2 px-4 py-2 bg-jedith-navy text-white rounded-lg text-sm font-medium hover:bg-jedith-navy-light disabled:opacity-50 transition-colors"
        >
          {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCode2 className="w-4 h-4" />}
          {parsing ? "Parsing…" : "Parse Spec"}
        </button>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              {result.name} <span className="text-muted-foreground font-normal text-sm">v{result.version}</span>
            </h2>
            <span className="text-sm text-muted-foreground">
              {result.endpoints.length} endpoints
            </span>
          </div>

          <div className="space-y-2">
            {result.endpoints.map((ep, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-jedith-navy/50 hover:bg-muted/30 transition-all group"
              >
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold font-mono flex-shrink-0 ${
                    METHOD_COLORS[ep.method] || "bg-muted text-foreground"
                  }`}
                >
                  {ep.method}
                </span>

                <code className="text-sm font-mono text-foreground flex-shrink-0">
                  {ep.path}
                </code>

                <span className="flex-1 text-sm text-muted-foreground truncate min-w-0">
                  {ep.summary}
                </span>

                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex-shrink-0">
                  → {ep.suggestedUI}
                </span>

                <button
                  onClick={() => generateForEndpoint(idx)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-jedith-navy text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                  Generate UI
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

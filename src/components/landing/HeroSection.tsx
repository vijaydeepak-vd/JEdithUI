"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl animate-float-slow"
          style={{ background: "radial-gradient(circle, #693FBD 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full opacity-15 blur-3xl animate-float"
          style={{ background: "radial-gradient(circle, #FF9F66 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full opacity-10 blur-2xl animate-float-slow"
          style={{
            background: "radial-gradient(circle, #BA67D3 0%, transparent 70%)",
            animationDelay: "2s",
          }}
        />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-jedith-forest/30 bg-jedith-forest/10 text-jedith-sage text-xs font-medium mb-8 animate-fade-up"
        >
          <Sparkles className="w-3.5 h-3.5 text-jedith-copper" />
          AI-Powered Theme-Aware Code Generator
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
          <span className="animate-fade-up inline-block" style={{ animationDelay: "100ms" }}>
            Scan.{" "}
          </span>
          <span
            className="animate-fade-up inline-block bg-gradient-to-r from-jedith-forest-light to-jedith-forest bg-clip-text text-transparent"
            style={{ animationDelay: "250ms" }}
          >
            Theme.{" "}
          </span>
          <span
            className="animate-fade-up inline-block bg-gradient-to-r from-jedith-copper to-[#FFCA7B] bg-clip-text text-transparent"
            style={{ animationDelay: "400ms" }}
          >
            Generate.
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up"
          style={{ animationDelay: "550ms" }}
        >
          Extract color palettes from any source, then generate production-ready
          themed UI code and presentations — all powered by AI.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up"
          style={{ animationDelay: "700ms" }}
        >
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 px-7 py-3.5 bg-jedith-copper text-white rounded-xl text-sm font-semibold hover:bg-[#E6853A] active:scale-95 transition-all shadow-lg animate-pulse-glow"
          >
            Get Started
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#features"
            className="flex items-center gap-2 px-7 py-3.5 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            See Features
          </a>
        </div>

        {/* Floating palette preview */}
        <div
          className="mt-16 animate-fade-up"
          style={{ animationDelay: "900ms" }}
        >
          <PalettePreviewGraphic />
        </div>
      </div>
    </section>
  );
}

/** Decorative palette color bar with floating animation */
function PalettePreviewGraphic() {
  const colors = [
    { hex: "#693FBD", label: "primary" },
    { hex: "#BA67D3", label: "secondary" },
    { hex: "#FF9F66", label: "accent" },
    { hex: "#F8F0FF", label: "surface" },
    { hex: "#1a1025", label: "background" },
  ];

  return (
    <div className="relative max-w-md mx-auto">
      {/* Glow behind */}
      <div className="absolute inset-0 blur-2xl opacity-30 rounded-3xl bg-gradient-to-r from-jedith-forest via-jedith-copper to-jedith-forest-light" />

      {/* Card */}
      <div className="relative bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-jedith-copper" />
          <span className="text-xs font-medium text-muted-foreground">Extracted Palette</span>
        </div>

        <div className="flex gap-2">
          {colors.map((c, i) => (
            <div
              key={`${c.label}-${i}`}
              className="flex-1 animate-scale-pop"
              style={{ animationDelay: `${1000 + i * 120}ms` }}
            >
              <div
                className="h-14 rounded-lg shadow-sm"
                style={{ backgroundColor: c.hex }}
              />
              <p className="text-[10px] text-muted-foreground mt-1.5 text-center">{c.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

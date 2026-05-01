"use client";

import { Palette, Code2, Presentation, Download, Eye, Wand2 } from "lucide-react";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Eye,
    title: "Extract from Anything",
    desc: "Upload a screenshot, paste CSS variables, or build manually — JEdith extracts a complete color palette in seconds.",
    color: "text-jedith-forest-light",
    bg: "bg-jedith-forest-light/10",
  },
  {
    icon: Code2,
    title: "Generate Themed Code",
    desc: "AI creates production-ready React, Vue, Svelte, Angular, or HTML components — fully styled with your palette.",
    color: "text-jedith-copper",
    bg: "bg-jedith-copper/10",
  },
  {
    icon: Presentation,
    title: "Generate Presentations",
    desc: "Create Marp-powered slide decks styled with your brand colors. Export to PPTX with one click.",
    color: "text-jedith-sage",
    bg: "bg-jedith-forest/10",
  },
  {
    icon: Download,
    title: "Export Claude Skills",
    desc: "Package your palette as a Claude Code skill ZIP — share your brand tokens with your entire team.",
    color: "text-[#FFCA7B]",
    bg: "bg-[#FFCA7B]/10",
  },
];

export function FeaturesSection() {
  const [sectionRef, sectionInView] = useInView({ threshold: 0.1 });
  const [centerRef, centerInView] = useInView({ threshold: 0.3 });

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative py-28 px-6 overflow-hidden"
    >
      {/* Section heading */}
      <div className="max-w-3xl mx-auto text-center mb-20">
        <p
          className={cn(
            "text-xs font-semibold uppercase tracking-widest text-jedith-copper mb-3 transition-all duration-700",
            sectionInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          Everything starts with a palette
        </p>
        <h2
          className={cn(
            "text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 transition-all duration-700",
            sectionInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
          style={{ transitionDelay: "100ms" }}
        >
          Your palette is the{" "}
          <span className="bg-gradient-to-r from-jedith-forest-light to-jedith-copper bg-clip-text text-transparent">
            center of everything
          </span>
        </h2>
        <p
          className={cn(
            "text-muted-foreground text-lg max-w-xl mx-auto transition-all duration-700",
            sectionInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
          style={{ transitionDelay: "200ms" }}
        >
          Create one palette and unlock code generation, presentations, and skill
          exports — all theme-aware from the start.
        </p>
      </div>

      {/* Palette-centric layout */}
      <div className="max-w-5xl mx-auto relative">
        {/* Center palette wheel */}
        <div
          ref={centerRef}
          className="flex justify-center mb-16 lg:mb-0 lg:absolute lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:z-10"
        >
          <div
            className={cn(
              "transition-all duration-1000",
              centerInView ? "opacity-100 scale-100" : "opacity-0 scale-75"
            )}
          >
            <PaletteWheel />
          </div>
        </div>

        {/* Feature cards — 2x2 grid, spaced around center on lg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-x-[340px] lg:gap-y-8">
          {FEATURES.map((feat, i) => (
            <FeatureCard key={feat.title} feature={feat} index={i} parentInView={sectionInView} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  feature,
  index,
  parentInView,
}: {
  feature: (typeof FEATURES)[number];
  index: number;
  parentInView: boolean;
}) {
  const isLeft = index % 2 === 0;
  const delay = 300 + index * 150;

  return (
    <div
      className={cn(
        "group relative bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 transition-all duration-700 hover:border-jedith-forest/30 hover:shadow-lg hover:-translate-y-1",
        parentInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        isLeft ? "lg:translate-x-0" : "lg:translate-x-0"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Icon */}
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", feature.bg)}>
        <feature.icon className={cn("w-5 h-5", feature.color)} />
      </div>

      {/* Content */}
      <h3 className="text-base font-semibold mb-2 text-foreground group-hover:text-jedith-copper transition-colors">
        {feature.title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>

      {/* Connecting dot to center (visible on lg) */}
      <div
        className={cn(
          "hidden lg:block absolute top-1/2 w-2 h-2 rounded-full bg-jedith-copper/40 transition-all duration-500",
          isLeft ? "-right-3" : "-left-3",
          parentInView ? "opacity-100 scale-100" : "opacity-0 scale-0"
        )}
        style={{ transitionDelay: `${delay + 200}ms` }}
      />
    </div>
  );
}

/** Animated rotating palette wheel */
function PaletteWheel() {
  const swatches = [
    { hex: "#693FBD", size: "w-12 h-12" },
    { hex: "#BA67D3", size: "w-10 h-10" },
    { hex: "#FF9F66", size: "w-11 h-11" },
    { hex: "#FFCA7B", size: "w-9 h-9" },
    { hex: "#F8F0FF", size: "w-10 h-10" },
    { hex: "#1a1025", size: "w-8 h-8" },
  ];

  return (
    <div className="relative w-48 h-48">
      {/* Glow */}
      <div className="absolute inset-0 rounded-full blur-2xl opacity-30 bg-gradient-to-br from-jedith-forest-light via-jedith-copper to-jedith-forest" />

      {/* Rotating ring */}
      <div className="absolute inset-0 animate-spin-slow">
        {swatches.map((s, i) => {
          const angle = (360 / swatches.length) * i;
          const rad = (angle * Math.PI) / 180;
          const radius = 72;
          const x = Math.round(Math.cos(rad) * radius);
          const y = Math.round(Math.sin(rad) * radius);

          return (
            <div
              key={`swatch-${i}`}
              className={cn(
                "absolute rounded-xl shadow-lg border border-white/10 animate-float",
                s.size
              )}
              style={{
                backgroundColor: s.hex,
                left: `calc(50% + ${x}px - 50%)`,
                top: `calc(50% + ${y}px - 50%)`,
                animationDelay: `${i * 0.8}s`,
              }}
            />
          );
        })}
      </div>

      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center shadow-xl">
          <Wand2 className="w-7 h-7 text-jedith-copper" />
        </div>
      </div>
    </div>
  );
}

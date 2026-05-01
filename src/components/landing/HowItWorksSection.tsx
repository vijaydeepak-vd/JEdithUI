"use client";

import { Palette, MessageSquare, Sparkles, ArrowRight } from "lucide-react";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    number: "01",
    icon: Palette,
    title: "Create a Palette",
    desc: "Upload a screenshot, paste CSS variables, import from Swagger, or build one manually. JEdith extracts your colors instantly.",
    color: "text-jedith-forest-light",
    border: "border-jedith-forest-light/30",
    glow: "from-jedith-forest-light/20",
  },
  {
    number: "02",
    icon: MessageSquare,
    title: "Describe Your UI",
    desc: "Open a code chat or presentation, pick your framework and libraries, then describe what you need in natural language.",
    color: "text-jedith-copper",
    border: "border-jedith-copper/30",
    glow: "from-jedith-copper/20",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Get Themed Output",
    desc: "AI generates production-ready code or Marp slides — fully styled with your palette. Iterate, refine, and export.",
    color: "text-[#FFCA7B]",
    border: "border-[#FFCA7B]/30",
    glow: "from-[#FFCA7B]/20",
  },
];

export function HowItWorksSection() {
  const [ref, inView] = useInView({ threshold: 0.1 });

  return (
    <section ref={ref} className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-16">
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-widest text-jedith-copper mb-3 transition-all duration-700",
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            Simple workflow
          </p>
          <h2
            className={cn(
              "text-3xl sm:text-4xl font-bold tracking-tight transition-all duration-700",
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
            style={{ transitionDelay: "100ms" }}
          >
            Three steps to themed code
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connecting arrows (desktop) */}
          <div className="hidden md:flex absolute top-1/2 left-0 right-0 -translate-y-1/2 justify-between px-[calc(33.33%-20px)] pointer-events-none z-0">
            {[0, 1].map((i) => (
              <div
                key={`arrow-${i}`}
                className={cn(
                  "flex items-center text-muted-foreground/30 transition-all duration-700",
                  inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                )}
                style={{ transitionDelay: `${600 + i * 200}ms` }}
              >
                <ArrowRight className="w-6 h-6" />
              </div>
            ))}
          </div>

          {STEPS.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({
  step,
  index,
  inView,
}: {
  step: (typeof STEPS)[number];
  index: number;
  inView: boolean;
}) {
  const delay = 200 + index * 200;

  return (
    <div
      className={cn(
        "relative z-10 group bg-card/60 backdrop-blur-sm border rounded-2xl p-7 transition-all duration-700 hover:shadow-xl hover:-translate-y-1",
        step.border,
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Glow */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br to-transparent",
          step.glow
        )}
      />

      <div className="relative">
        {/* Number badge */}
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold mb-5 border transition-all duration-500",
            step.border,
            step.color,
            inView ? "scale-100" : "scale-0"
          )}
          style={{ transitionDelay: `${delay + 150}ms` }}
        >
          {step.number}
        </div>

        {/* Icon */}
        <step.icon className={cn("w-6 h-6 mb-3", step.color)} />

        {/* Content */}
        <h3 className="text-lg font-semibold mb-2 text-foreground">{step.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
      </div>
    </div>
  );
}

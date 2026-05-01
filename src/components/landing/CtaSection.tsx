"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

export function CtaSection() {
  const [ref, inView] = useInView({ threshold: 0.2 });

  return (
    <section ref={ref} className="py-28 px-6">
      <div className="max-w-4xl mx-auto relative">
        {/* Background glow */}
        <div className="absolute inset-0 -m-8 rounded-3xl opacity-30 blur-3xl bg-gradient-to-r from-jedith-forest via-jedith-copper to-jedith-forest-light" />

        <div
          className={cn(
            "relative rounded-2xl border border-jedith-forest/20 overflow-hidden transition-all duration-1000",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          {/* Gradient bg */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-jedith-forest/80 via-[#1a1025] to-jedith-forest-light/30 animate-gradient-shift"
            style={{ backgroundSize: "200% 200%" }}
          />

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative z-10 py-16 px-8 text-center">
            <div
              className={cn(
                "inline-flex items-center gap-2 mb-4 transition-all duration-700",
                inView ? "opacity-100 scale-100" : "opacity-0 scale-90"
              )}
              style={{ transitionDelay: "200ms" }}
            >
              <Sparkles className="w-5 h-5 text-jedith-copper" />
            </div>

            <h2
              className={cn(
                "text-3xl sm:text-4xl font-bold text-white mb-4 transition-all duration-700",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: "300ms" }}
            >
              Ready to generate themed code?
            </h2>

            <p
              className={cn(
                "text-white/60 text-lg max-w-xl mx-auto mb-8 transition-all duration-700",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: "400ms" }}
            >
              Create your first palette and watch JEdith transform it into
              production-ready UI code — in seconds.
            </p>

            <Link
              href="/dashboard"
              className={cn(
                "group inline-flex items-center gap-2 px-8 py-4 bg-jedith-copper text-white rounded-xl text-sm font-semibold hover:bg-[#E6853A] active:scale-95 transition-all shadow-xl animate-pulse-glow",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: "500ms" }}
            >
              Start Building
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

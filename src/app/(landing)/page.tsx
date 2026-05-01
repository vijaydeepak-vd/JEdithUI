"use client";

import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { Footer } from "@/components/landing/Footer";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background scroll-smooth">
      {/* Sticky nav bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-jedith-copper flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">
              <span className="text-jedith-sage">J</span>
              <span className="text-jedith-copper">Edith</span>
              <span className="text-jedith-sage">UI</span>
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <a
              href="#features"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Features
            </a>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-4 py-2 bg-jedith-copper text-white rounded-lg text-xs font-semibold hover:bg-[#E6853A] active:scale-95 transition-all"
            >
              Open App
            </Link>
          </div>
        </div>
      </nav>

      {/* Sections */}
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaSection />
      <Footer />
    </div>
  );
}

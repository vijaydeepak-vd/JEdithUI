import { Sparkles } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border py-8 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-jedith-copper flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm">
            <span className="text-jedith-sage">J</span>
            <span className="text-jedith-copper">Edith</span>
            <span className="text-jedith-sage">UI</span>
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <Link href="/palettes" className="hover:text-foreground transition-colors">
            Palettes
          </Link>
          <Link href="/chat" className="hover:text-foreground transition-colors">
            Code Chats
          </Link>
          <Link href="/presentations" className="hover:text-foreground transition-colors">
            Presentations
          </Link>
        </div>

        {/* Copyright */}
        <p className="text-[11px] text-muted-foreground/60">
          Built with AI
        </p>
      </div>
    </footer>
  );
}

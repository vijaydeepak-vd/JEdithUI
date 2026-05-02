import { Logo } from "@/components/layout/Logo";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border py-8 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="group">
          <Logo size="sm" />
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
          &copy; 2026 XYZ. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

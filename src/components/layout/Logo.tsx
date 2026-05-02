import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showAlpha?: boolean;
  tagline?: string;
}

const CONFIG = {
  sm: { icon: "w-7 h-7", sparkle: "w-3.5 h-3.5", text: "text-sm", badge: "text-[8px]", gap: "gap-2" },
  md: { icon: "w-8 h-8", sparkle: "w-4 h-4", text: "text-base", badge: "text-[9px]", gap: "gap-2.5" },
  lg: { icon: "w-9 h-9", sparkle: "w-4 h-4", text: "text-lg", badge: "text-[10px]", gap: "gap-3" },
};

function AlphaBadge({ badgeClass }: { badgeClass: string }) {
  return (
    <span
      className={cn(
        "font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
        "bg-jedith-forest/20 text-jedith-forest-light border border-jedith-forest/30 leading-none",
        badgeClass
      )}
    >
      Alpha
    </span>
  );
}

function BrandName({ textClass }: { textClass: string }) {
  return (
    <span className={cn("font-bold tracking-tight leading-none", textClass)}>
      <span className="text-jedith-sage">J</span>
      <span className="text-jedith-forest-light">Edith</span>
      <span className="text-jedith-sage">UI</span>
    </span>
  );
}

export function Logo({ className, size = "md", showAlpha = true, tagline }: LogoProps) {
  const s = CONFIG[size];

  return (
    <div className={cn("flex items-center select-none", s.gap, className)}>
      <div
        className={cn(
          "rounded-lg bg-jedith-forest flex items-center justify-center shadow-lg flex-shrink-0",
          "group-hover:scale-105 transition-transform",
          s.icon
        )}
      >
        <Sparkles className={cn("text-white", s.sparkle)} />
      </div>

      {tagline ? (
        <div>
          <div className="flex items-center gap-1.5">
            <BrandName textClass={s.text} />
            {showAlpha && <AlphaBadge badgeClass={s.badge} />}
          </div>
          <p className="text-white/40 text-[10px] leading-none mt-0.5 font-normal">
            {tagline}
          </p>
        </div>
      ) : (
        <>
          <BrandName textClass={s.text} />
          {showAlpha && <AlphaBadge badgeClass={s.badge} />}
        </>
      )}
    </div>
  );
}

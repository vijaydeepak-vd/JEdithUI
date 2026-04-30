import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizes = { sm: "text-lg", md: "text-2xl", lg: "text-4xl" };

  return (
    <div className={cn("flex items-center gap-2 font-bold select-none", sizes[size], className)}>
      <span className="text-jedith-copper">⟨/⟩</span>
      <span>
        <span className="text-jedith-forest dark:text-jedith-sage">J</span>
        <span className="text-jedith-copper">Edith</span>
        <span className="text-jedith-forest dark:text-jedith-sage">UI</span>
      </span>
    </div>
  );
}

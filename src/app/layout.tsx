import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JEdithUI — AI Theme-Aware Code Generator",
  description: "Scan. Theme. Generate. Extract palettes and generate themed UI code with AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { prepareMarpMarkdown } from "@/lib/marp/marp-preview";
import { z } from "zod";
import type { PaletteColor, SlideTheme } from "@/types";

const Schema = z.object({
  markdown: z.string().min(1),
  palette: z.array(
    z.object({ hex: z.string(), role: z.string(), order: z.number() })
  ),
  theme: z.string().optional().default("default"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { markdown, palette, theme } = parsed.data;

  try {
    const { Marp } = await import("@marp-team/marp-core");
    const marp = new Marp({ html: true });

    const styledMarkdown = prepareMarpMarkdown(
      markdown,
      palette as PaletteColor[],
      theme as SlideTheme
    );

    const { html, css } = marp.render(styledMarkdown);

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    ${css}
  </style>
  <!-- Navigation styles AFTER Marp CSS so they win on specificity -->
  <style>
    html, body { width: 100%; height: 100%; overflow: hidden !important; background: #1a1a2e; position: relative; }
    .marpit { position: relative; width: 100%; height: 100%; }
    .marpit > svg[data-marpit-svg] {
      position: absolute !important;
      top: 0; left: 0;
      width: 100% !important;
      height: 100% !important;
      opacity: 0;
      pointer-events: none;
      z-index: 0;
      transition: opacity 0.15s ease;
    }
    .marpit > svg[data-marpit-svg].active-slide {
      opacity: 1;
      pointer-events: auto;
      z-index: 1;
    }
  </style>
</head>
<body>
  ${html}
  <script>
    (function() {
      var slides = document.querySelectorAll('svg[data-marpit-svg]');
      var current = 0;

      function showSlide(idx) {
        if (idx < 0 || idx >= slides.length) return;
        slides.forEach(function(s) { s.classList.remove('active-slide'); });
        slides[idx].classList.add('active-slide');
        current = idx;
      }

      // Show first slide on load
      showSlide(0);

      // Listen for navigation messages from parent
      window.addEventListener('message', function(e) {
        if (e.data && e.data.type === 'goToSlide' && typeof e.data.index === 'number') {
          showSlide(e.data.index);
        }
      });

      // Notify parent how many slides exist
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'slideCount', count: slides.length }, '*');
      }
    })();
  </script>
</body>
</html>`;

    return NextResponse.json({ html: fullHtml });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Preview failed" },
      { status: 500 }
    );
  }
}

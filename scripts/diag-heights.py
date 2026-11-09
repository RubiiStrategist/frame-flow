#!/usr/bin/env python3
"""Diagnóstico 2: alturas dos blocos do conceito C desktop."""
from pathlib import Path
from playwright.sync_api import sync_playwright

SRC = Path("/home/z/my-project/download/frameflow-prompt03-visual/mockups/conceito-c-desktop.html")

JS = """
() => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {sel, top: Math.round(r.top), h: Math.round(r.height),
            pos: cs.position, display: cs.display};
  };
  return [pick('.main'), pick('.content'), pick('.hero'), pick('.mosaic'),
          pick('.mosaic .panel:nth-child(1)'), pick('.mosaic .panel:nth-child(2)'),
          pick('.mosaic .panel:nth-child(3)'), pick('.mosaic .panel:nth-child(4)'),
          pick('.stagecol'), pick('.stage3d'), pick('.capzone'), pick('.chart-row')];
}
"""

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.goto(SRC.as_uri(), wait_until="networkidle")
    page.wait_for_timeout(600)
    for row in page.evaluate(JS):
        if row: print(row)
    b.close()

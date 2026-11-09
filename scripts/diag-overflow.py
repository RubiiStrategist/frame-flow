#!/usr/bin/env python3
"""Diagnóstico: encontra elementos que ultrapassam 900px no conceito C desktop."""
from pathlib import Path
from playwright.sync_api import sync_playwright

SRC = Path("/home/z/my-project/download/frameflow-prompt03-visual/mockups/conceito-c-desktop.html")

JS = """
() => {
  const out = [];
  document.querySelectorAll('body *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.bottom > 900.5 || r.right > 1440.5) {
      const cls = (el.className && typeof el.className === 'string') ? el.className : el.tagName;
      out.push({tag: el.tagName, cls: cls.slice(0,60), top: Math.round(r.top), bottom: Math.round(r.bottom), right: Math.round(r.right)});
    }
  });
  return out.slice(0, 30);
}
"""

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.goto(SRC.as_uri(), wait_until="networkidle")
    page.wait_for_timeout(600)
    for row in page.evaluate(JS):
        print(row)
    b.close()

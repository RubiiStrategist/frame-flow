#!/usr/bin/env python3
"""FRAME FLOW OS — Prompt 03 · Renderizador de mockups (Playwright headless).

Captura, para cada conceito:
  - Desktop: 1440x900 (primeira impressão) — sem rolagem
  - Mobile 390: topo (primeira impressão), página completa e rodapé (bottom nav)
  - Conceito C extras: modo Imersivo e paleta ⌘K (interações do protótipo)

Também registra métricas de integridade:
  - scrollHeight do desktop (deve ser 900) e scrollWidth do mobile (deve ser 390).
"""
import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = Path("/home/z/my-project/download/frameflow-prompt03-visual")
MOCKUPS = BASE / "mockups"
RENDERS = BASE / "renders"
RENDERS.mkdir(parents=True, exist_ok=True)

CONCEPTS = ["a", "b", "c"]
IMMERSIVE_WAIT = 0.9  # transição de modo é .55s

report = {}

def load(page, path: Path):
    page.goto(path.as_uri(), wait_until="networkidle")
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(900)

with sync_playwright() as p:
    browser = p.chromium.launch(args=["--force-color-profile=srgb", "--font-render-hinting=none"])

    # ── DESKTOP 1440×900 ─────────────────────────────────────────
    ctx_d = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=2)
    page = ctx_d.new_page()
    for c in CONCEPTS:
        src = MOCKUPS / f"conceito-{c}-desktop.html"
        load(page, src)
        h = page.evaluate("document.documentElement.scrollHeight")
        w = page.evaluate("document.documentElement.scrollWidth")
        report[f"desktop-{c}"] = {"scrollHeight": h, "scrollWidth": w}
        page.screenshot(path=str(RENDERS / f"conceito-{c}-desktop-1440.png"))
        # Extras do conceito C: modo imersivo + paleta de comandos
        if c == "c":
            page.evaluate("document.body.classList.add('imersivo')")
            page.wait_for_timeout(IMMERSIVE_WAIT * 1000)
            page.screenshot(path=str(RENDERS / "conceito-c-desktop-imersivo.png"))
            page.evaluate("document.body.classList.remove('imersivo')")
            page.evaluate("document.getElementById('palette').classList.add('open')")
            page.wait_for_timeout(400)
            page.screenshot(path=str(RENDERS / "conceito-c-desktop-cmdk.png"))
            page.evaluate("document.getElementById('palette').classList.remove('open')")
    ctx_d.close()

    # ── MOBILE 390×844 ──────────────────────────────────────────
    ctx_m = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    page = ctx_m.new_page()
    for c in CONCEPTS:
        src = MOCKUPS / f"conceito-{c}-mobile.html"
        load(page, src)
        sw = page.evaluate("document.documentElement.scrollWidth")
        sh = page.evaluate("document.documentElement.scrollHeight")
        report[f"mobile-{c}"] = {"scrollWidth": sw, "scrollHeight": sh}
        page.screenshot(path=str(RENDERS / f"conceito-{c}-mobile-390.png"))          # primeira impressão
        page.screenshot(path=str(RENDERS / f"conceito-{c}-mobile-full.png"), full_page=True)  # fluxo completo
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(250)
        page.screenshot(path=str(RENDERS / f"conceito-{c}-mobile-nav.png"))           # rodapé/nav
        page.evaluate("window.scrollTo(0, 0)")
    ctx_m.close()
    browser.close()

print(json.dumps(report, indent=2))
print("\nRenders:")
for f in sorted(RENDERS.glob("*.png")):
    print(f"  {f.name}  ({f.stat().st_size//1024} KB)")

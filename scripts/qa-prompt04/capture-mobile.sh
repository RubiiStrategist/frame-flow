#!/bin/bash
# FRAME FLOW OS · PROMPT 04 — captura de screenshots mobile (390×844)
set -e
OUT=/home/z/my-project/download/frameflow-prototipo-prompt04/screenshots
URL=http://localhost:3000/prototypes/mobile.html

agent-browser set viewport 390 844 >/dev/null
agent-browser open "$URL" >/dev/null
agent-browser wait 2500

# 08 — Início · Comando (padrão mobile)
agent-browser screenshot "$OUT/08-mobile-painel-comando.png" >/dev/null

# 09 — Início · Imersivo (orbital na janela de palco)
agent-browser eval "document.querySelector('#modeToggle [data-mode=\"imersivo\"]').click()" >/dev/null
agent-browser wait 1400
agent-browser screenshot "$OUT/09-mobile-painel-imersivo.png" >/dev/null

# 10 — Ecossistema (overlay imersivo adaptado)
agent-browser eval "document.querySelector('.strip-cta').click()" >/dev/null
agent-browser wait 1500
agent-browser screenshot "$OUT/10-mobile-ecossistema-imersivo.png" >/dev/null

# 11 — Decisões + bottom sheet aberto
agent-browser eval "document.querySelectorAll('.bn').forEach(b=>{if(b.dataset.ctx==='m-decisoes')b.click()})" >/dev/null
agent-browser wait 500
agent-browser eval "document.querySelector('#decList .dmrow').click()" >/dev/null
agent-browser wait 700
agent-browser screenshot "$OUT/11-mobile-decisao-sheet.png" >/dev/null
agent-browser eval "document.getElementById('shClose').click()" >/dev/null
agent-browser wait 400

# 12 — Cap (aba, estado alerta)
agent-browser eval "document.querySelectorAll('.bn').forEach(b=>{if(b.dataset.ctx==='m-cap')b.click()})" >/dev/null
agent-browser wait 500
agent-browser eval "document.querySelectorAll('.stbtn').forEach(b=>{if(b.dataset.estado==='alerta')b.click()})" >/dev/null
agent-browser wait 400
agent-browser screenshot "$OUT/12-mobile-cap.png" >/dev/null

# 13 — Paleta mobile (tela cheia)
agent-browser eval "document.getElementById('searchTrigger').click()" >/dev/null
agent-browser wait 500
agent-browser screenshot "$OUT/13-mobile-palette.png" >/dev/null

echo "Screenshots mobile concluídos:"
ls -la "$OUT" | grep mobile
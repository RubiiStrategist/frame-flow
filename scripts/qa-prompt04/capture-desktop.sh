#!/bin/bash
# FRAME FLOW OS · PROMPT 04 — captura de screenshots desktop (1440×900)
set -e
OUT=/home/z/my-project/download/frameflow-prototipo-prompt04/screenshots
URL=http://localhost:3000/prototypes/desktop.html

agent-browser set viewport 1440 900 >/dev/null
agent-browser open "$URL" >/dev/null
agent-browser wait 2500

# 01 — Painel · Imersivo
agent-browser screenshot "$OUT/01-desktop-painel-imersivo.png" >/dev/null

# 02 — Painel · Comando
agent-browser eval "document.querySelector('#modeToggle [data-mode=\"comando\"]').click()" >/dev/null
agent-browser wait 700
agent-browser screenshot "$OUT/02-desktop-painel-comando.png" >/dev/null

# 03 — Paleta Ctrl+K
agent-browser eval "document.querySelector('#modeToggle [data-mode=\"imersivo\"]').click()" >/dev/null
agent-browser wait 600
agent-browser eval "document.dispatchEvent(new KeyboardEvent('keydown',{key:'k',ctrlKey:true,bubbles:true}))" >/dev/null
agent-browser wait 300
agent-browser eval "const i=document.getElementById('palInput'); i.value='decis'; i.dispatchEvent(new Event('input',{bubbles:true}))" >/dev/null
agent-browser wait 400
agent-browser screenshot "$OUT/03-desktop-palette-ctrlk.png" >/dev/null
agent-browser eval "document.getElementById('palette').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))" >/dev/null
agent-browser wait 300

# 04 — Decisão aberta (drawer)
agent-browser eval "document.querySelector('#nav-decisoes').click()" >/dev/null
agent-browser wait 500
agent-browser eval "document.querySelector('#decList .drow').click()" >/dev/null
agent-browser wait 600
agent-browser screenshot "$OUT/04-desktop-decisao-drawer.png" >/dev/null
agent-browser eval "document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))" >/dev/null
agent-browser wait 400

# 05 — Inteligência Financeira (imersivo)
agent-browser eval "document.querySelector('#nav-financeiro').click()" >/dev/null
agent-browser wait 1200
agent-browser screenshot "$OUT/05-desktop-financeiro-imersivo.png" >/dev/null

# 06 — Ecossistema (imersivo, câmera próxima)
agent-browser eval "document.querySelector('#nav-ecos').click()" >/dev/null
agent-browser wait 1500
agent-browser screenshot "$OUT/06-desktop-ecossistema-imersivo.png" >/dev/null

# 07 — Cap aberta (estado alerta)
agent-browser eval "document.querySelector('#nav-painel').click()" >/dev/null
agent-browser wait 800
agent-browser eval "document.querySelector('#capZone').click()" >/dev/null
agent-browser wait 400
agent-browser eval "document.querySelectorAll('.stbtn').forEach(b=>{if(b.dataset.estado==='alerta')b.click()})" >/dev/null
agent-browser wait 400
agent-browser screenshot "$OUT/07-desktop-cap-panel.png" >/dev/null
agent-browser eval "document.getElementById('cpClose').click()" >/dev/null
agent-browser wait 300

echo "Screenshots desktop concluídos:"
ls -la "$OUT" | grep desktop
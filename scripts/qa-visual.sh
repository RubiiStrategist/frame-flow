#!/bin/bash
# QA visual dos renders do FRAME FLOW OS — Prompt 03 (usando z-ai vision CLI)
# Resumível: pula imagens cujo JSON de resultado já existe.
set -u
RDIR="/home/z/my-project/download/frameflow-prompt03-visual/renders"
QDIR="/home/z/my-project/scripts/qa-results"
mkdir -p "$QDIR"

PROMPT_DESK='QA visual de mockup desktop 1440x900 do FRAME FLOW OS (identidade: preto profundo #0A0A0A, branco quente #F4F0E7, vermelho #E10606, tipografia editorial). Verifique e responda em PORTUGUÊS, lista curta e objetiva: 1) Textos sobrepostos, cortados ou elementos vazando da tela? 2) Algo desalinhado ou quebrado? 3) Texto ilegivel por contraste/tamanho? 4) Parece template SaaS generico (cartoes repetidos, cinza, sem identidade)? 5) A fonte serifada elegante carregou nos titulos grandes (ou caiu em fallback generico)? 6) Ha uma area reservada para um personagem mascote (capivara geometrica) bem iluminada? 7) Em 5 segundos, quais 3 informacoes prioritarias voce identifica? Para cada item sem problema escreva OK.'

PROMPT_MOB='QA visual de mockup mobile 390px do FRAME FLOW OS (identidade: preto #0A0A0A, branco quente #F4F0E7, vermelho #E10606). Verifique e responda em PORTUGUES, lista curta: 1) Textos sobrepostos, cortados ou elementos vazando lateralmente (rolagem horizontal)? 2) Algo desalinhado ou quebrado? 3) Texto ilegivel? 4) Parece template SaaS generico? 5) Titulos elegantes (serifada) carregaram? 6) Area do mascote (capivara) presente e bem enquadrada? 7) Em 5 segundos, quais 3 informacoes prioritarias? Para cada item sem problema escreva OK.'

run() {
  local img="$1" prompt="$2" out="$3"
  if [ -s "$out" ]; then echo "SKIP $(basename "$img")"; return 0; fi
  echo "QA  $(basename "$img")"
  z-ai vision -p "$prompt" -i "$img" -o "$out" >/dev/null 2>&1 || echo "ERRO em $(basename "$img")"
}

run "$RDIR/conceito-a-desktop-1440.png"      "$PROMPT_DESK" "$QDIR/a-desktop.json"
run "$RDIR/conceito-b-desktop-1440.png"       "$PROMPT_DESK" "$QDIR/b-desktop.json"
run "$RDIR/conceito-c-desktop-1440.png"       "$PROMPT_DESK" "$QDIR/c-desktop.json"
run "$RDIR/conceito-c-desktop-imersivo.png"   "$PROMPT_DESK" "$QDIR/c-imersivo.json"
run "$RDIR/conceito-c-desktop-cmdk.png"       "$PROMPT_DESK" "$QDIR/c-cmdk.json"
run "$RDIR/conceito-a-mobile-390.png"         "$PROMPT_MOB"  "$QDIR/a-mobile.json"
run "$RDIR/conceito-b-mobile-390.png"         "$PROMPT_MOB"  "$QDIR/b-mobile.json"
run "$RDIR/conceito-c-mobile-390.png"         "$PROMPT_MOB"  "$QDIR/c-mobile.json"
run "$RDIR/conceito-c-mobile-full.png"        "$PROMPT_MOB"  "$QDIR/c-mobile-full.json"

echo "=== RESULTADOS ==="
for f in "$QDIR"/*.json; do
  echo "--- $(basename "$f") ---"
  python3 -c "import json,sys;d=json.load(open('$f'));print(d.get('content',d) if isinstance(d,dict) else d)" 2>/dev/null || head -c 600 "$f"
  echo ""
done

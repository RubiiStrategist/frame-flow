#!/usr/bin/env python3
# FRAME FLOW OS · PROMPT 04 — cálculo WCAG 2.1 dos contrastes reais do protótipo
# Mede os pares efetivamente usados (tokens CSS do common.css/desktop.css/mobile.css).
import json

def srgb_to_lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def luminance(hex_or_rgb):
    if isinstance(hex_or_rgb, str):
        h = hex_or_rgb.lstrip('#')
        rgb = tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
    else:
        rgb = hex_or_rgb
    r, g, b = (srgb_to_lin(v) for v in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def parse(c):
    if isinstance(c, str):
        h = c.lstrip('#')
        return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
    return c

def blend(fg, bg, alpha):
    """rgba sobre fundo opaco"""
    fg, bg = parse(fg), parse(bg)
    return tuple(round(f * alpha + b * (1 - alpha)) for f, b in zip(fg, bg))

def ratio(l1, l2):
    hi, lo = max(l1, l2), min(l1, l2)
    return round((hi + 0.05) / (lo + 0.05), 2)

PAPER = '#F4F0E7'
INK = '#0A0A0A'
RED = '#E10606'
PANEL = '#101010'          # panel-bg-comando
PANEL_IMERSIVO = blend('#0D0D0D', INK, 0.82)  # rgba(13,13,13,.82) sobre o palco escuro

def rgba_paper(alpha):
    return blend(PAPER, INK, alpha)

pares = [
    # (nome, fg, bg, uso, exigência WCAG)
    ('Texto primário #F4F0E7 sobre #0A0A0A', PAPER, INK, 'títulos, valores, corpo', 'AA 4.5'),
    ('Texto primário #F4F0E7 sobre painel #101010', PAPER, PANEL, 'painéis em Comando', 'AA 4.5'),
    ('Texto primário sobre painel imersivo (rgba .82)', PAPER, PANEL_IMERSIVO, 'painéis em Imersivo', 'AA 4.5'),
    ('Texto secundário rgba(244,240,231,.78) sobre #0A0A0A', rgba_paper(.78), INK, 'resumos, descrições', 'AA 4.5'),
    ('Rótulos mono rgba(.62) sobre #0A0A0A', rgba_paper(.62), INK, 'kickers, códigos ≥10px', 'AA 4.5'),
    ('Rótulos mono rgba(.62) sobre painel #101010', rgba_paper(.62), PANEL, 'labels em painéis', 'AA 4.5'),
    ('Decorativo rgba(.48) sobre #0A0A0A', rgba_paper(.48), INK, 'apenas decorativo (não-texto)', 'UI 3.0'),
    ('Vermelho #E10606 sobre #0A0A0A', RED, INK, 'índices 01/02/03 (34px serif) e indicadores', 'AA-large 3.0'),
    ('Branco #FFF sobre vermelho #E10606 (botão Aprovar/urgent)', '#FFFFFF', RED, 'botões de urgência, chips urgent', 'AA 4.5'),
    ('Vermelho #E10606 sobre papel #F4F0E7', RED, PAPER, 'linha do gráfico no brief (não-texto)', 'UI 3.0'),
    ('Tinta #141414 sobre papel #F4F0E7 (brief)', '#141414', PAPER, 'texto do brief financeiro', 'AA 4.5'),
    ('Tinta rgba(10,10,10,.72) sobre papel', blend(INK, PAPER, .72), PAPER, 'texto secundário do papel', 'AA 4.5'),
    ('Tinta #0A0A0A sobre botão primário #F4F0E7', INK, PAPER, 'botões primários invertidos', 'AA 4.5'),
    ('Chip APROVADA: tinta sobre papel (solid)', INK, PAPER, 'status de decisão aprovada', 'AA 4.5'),
    ('Chip REJEITADA: branco sobre vermelho', '#FFFFFF', RED, 'status de decisão rejeitada', 'AA 4.5'),
]

res = []
for nome, fg, bg, uso, exig in pares:
    r = ratio(luminance(fg), luminance(bg))
    # classificação automática
    ok = (r >= 4.5) if '4.5' in exig else (r >= 3.0)
    res.append({'par': nome, 'uso': uso, 'exigencia': exig, 'ratio': r, 'status': 'PASSA' if ok else 'FALHA'})

print(json.dumps(res, indent=1, ensure_ascii=False))

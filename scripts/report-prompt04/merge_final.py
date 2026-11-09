# -*- coding: utf-8 -*-
"""Mescla capa (Playwright) + corpo (ReportLab) em um único PDF A4 normalizado."""
from pypdf import PdfReader, PdfWriter
import os

A4_W, A4_H = 595.28, 841.89
BASE = os.path.dirname(os.path.abspath(__file__))

def normalize(page):
    box = page.mediabox
    w, h = float(box.width), float(box.height)
    if abs(w - A4_W) > 0.1 or abs(h - A4_H) > 0.1:
        page.scale_to(A4_W, A4_H)
    return page

def main():
    cover = os.path.join(BASE, 'cover.pdf')
    body = os.path.join(BASE, 'body.pdf')
    out = os.path.join(BASE, 'FRAME-FLOW-PROMPT04-Relatorio.pdf')
    w = PdfWriter()
    w.add_page(normalize(PdfReader(cover).pages[0]))
    for p in PdfReader(body).pages:
        w.add_page(normalize(p))
    w.add_metadata({
        '/Title': 'FRAME FLOW OS — Relatório do Protótipo Interativo (PROMPT 04)',
        '/Author': 'Z.ai',
        '/Creator': 'Z.ai',
        '/Subject': 'Consolidação da direção visual Conceito C — protótipo interativo, testes e plano de integração',
    })
    with open(out, 'wb') as f:
        w.write(f)
    print('Final:', out, '| páginas:', len(PdfReader(out).pages))

if __name__ == '__main__':
    main()

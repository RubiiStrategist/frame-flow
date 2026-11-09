#!/usr/bin/env python3
"""Pós-processamento de numeração de páginas — PROMPT 05.

Conforme references/toc.md (compatibilidade WPS/Word):
  1. Remove <w:pgNumType/> vazio emitido na seção de capa (confunde o WPS).
  2. Acrescenta o sufixo de formato ao campo PAGE de cada rodapé:
     - seção com fmt upperRoman  ->  PAGE \\* ROMAN \\* MERGEFORMAT
     - seção com fmt decimal     ->  PAGE \\* arabic \\* MERGEFORMAT
     (nunca \\* decimal — não é um sufixo de campo válido.)

Uso: python3 patch_pagenum.py <caminho.docx>
"""
import re
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"


def patch_footer_instructions(docx_path: Path) -> None:
    with zipfile.ZipFile(docx_path, "r") as zin:
        names = zin.namelist()
        data = {n: zin.read(n) for n in names}

    doc_xml = data["word/document.xml"].decode("utf-8")

    # 1) remover pgNumType vazio (sem atributos) — resíduo da seção de capa
    doc_xml, n_removed = re.subn(r"<w:pgNumType\s*/>", "", doc_xml)

    # 2) mapear rId -> arquivo de rodapé
    rels_xml = data["word/_rels/document.xml.rels"].decode("utf-8")
    rel_map = dict(re.findall(r'<Relationship[^>]*Id="([^"]+)"[^>]*Target="(footer\d+\.xml)"', rels_xml))
    rel_map.update({rid: tgt for rid, tgt in re.findall(
        r'<Relationship[^>]*Target="(?:/?word/)?(footer\d+\.xml)"[^>]*Id="([^"]+)"', rels_xml
    )[::-1]})

    # 3) para cada sectPr, descobrir fmt e o rodapé padrão correspondente
    patched = {"ROMAN": 0, "arabic": 0}
    for sect in re.findall(r"<w:sectPr[^>]*>.*?</w:sectPr>|<w:sectPr[^>]*/>", doc_xml, re.S):
        fmt_m = re.search(r'<w:pgNumType[^>]*w:fmt="([^"]+)"', sect)
        foot_m = re.search(r'<w:footerReference[^>]*w:type="default"[^>]*r:id="([^"]+)"', sect)
        if not foot_m:
            foot_m = re.search(r'<w:footerReference[^>]*r:id="([^"]+)"[^>]*w:type="default"', sect)
        if not fmt_m or not foot_m:
            continue
        target = rel_map.get(foot_m.group(1))
        if not target:
            continue
        key = "word/" + target
        if key not in data:
            continue
        suffix = "ROMAN" if "oman" in fmt_m.group(1) else "arabic"
        footer_xml = data[key].decode("utf-8")
        footer_xml, n = re.subn(
            r"(<w:instrText[^>]*>)\s*PAGE\s*(</w:instrText>)",
            r"\g<1> PAGE \\* " + suffix + r" \\* MERGEFORMAT \g<2>",
            footer_xml,
        )
        if n:
            patched[suffix] += n
            data[key] = footer_xml.encode("utf-8")

    data["word/document.xml"] = doc_xml.encode("utf-8")

    # 4) regravar o pacote preservando o resto
    tmp_fd, tmp_name = tempfile.mkstemp(suffix=".docx")
    with zipfile.ZipFile(tmp_name, "w", zipfile.ZIP_DEFLATED) as zout:
        for n in names:
            zout.writestr(n, data[n])
    shutil.move(tmp_name, docx_path)
    print(f"OK: pgNumType vazio removido ({n_removed}); rodapé ROMAN ajustado ({patched['ROMAN']}); "
          f"rodapé arabic ajustado ({patched['arabic']}).")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: patch_pagenum.py <caminho.docx>")
        sys.exit(2)
    patch_footer_instructions(Path(sys.argv[1]))

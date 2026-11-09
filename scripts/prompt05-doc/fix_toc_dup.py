#!/usr/bin/env python3
"""Remove a entrada duplicada do campo TOC (PROMPT 05).

O add_toc_placeholders insere a primeira entrada como hyperlink+PAGEREF dentro do
próprio parágrafo de início do campo (resultado em cache vazio — sem número de
página) e em seguida as 30 entradas de placeholder com números. O resultado
renderizado mostra 'Sumário Executivo' duas vezes, a primeira sem número.

Correção: remover o bloco <w:hyperlink> da primeira entrada dentro do parágrafo
de início do campo. As 30 entradas de placeholder (texto + pontos + número)
permanecem como resultado em cache; ao atualizar o campo no Word, o TOC real com
hyperlinks é recalculado a partir do \\h do instrText.

Uso: python3 fix_toc_dup.py <caminho.docx>
"""
import re
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path


def fix(docx_path: Path) -> None:
    with zipfile.ZipFile(docx_path, "r") as zin:
        names = zin.namelist()
        data = {n: zin.read(n) for n in names}

    xml = data["word/document.xml"].decode("utf-8")

    # localiza o campo TOC
    m = re.search(r'<w:instrText[^>]*>\s*TOC[^<]*</w:instrText>', xml)
    if not m:
        print("AVISO: campo TOC não encontrado; nada feito.")
        return

    # a partir do separate do campo, no mesmo parágrafo, remove o primeiro hyperlink
    sep = xml.find('<w:fldChar w:fldCharType="separate"/>', m.end())
    if sep == -1:
        print("AVISO: separate do campo TOC não encontrado; nada feito.")
        return
    par_end = xml.find('</w:p>', sep)
    seg = xml[sep:par_end]
    seg2, n = re.subn(r'<w:hyperlink[^>]*>.*?</w:hyperlink>', '', seg, flags=re.S)
    if n:
        xml = xml[:sep] + seg2 + xml[par_end:]
        data["word/document.xml"] = xml.encode("utf-8")

        tmp_fd, tmp_name = tempfile.mkstemp(suffix=".docx")
        with zipfile.ZipFile(tmp_name, "w", zipfile.ZIP_DEFLATED) as zout:
            for name in names:
                zout.writestr(name, data[name])
        shutil.move(tmp_name, docx_path)
        print(f"OK: {n} entrada duplicada removida do parágrafo de início do campo TOC.")
    else:
        print("AVISO: nenhum hyperlink duplicado encontrado no parágrafo de início; nada feito.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: fix_toc_dup.py <caminho.docx>")
        sys.exit(2)
    fix(Path(sys.argv[1]))

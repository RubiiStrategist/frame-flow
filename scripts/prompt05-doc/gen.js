/**
 * FRAME FLOW OS — PROMPT 05 · Plano Técnico de Integração — gerador DOCX
 * Skill: docx (rota Create · cena Report · receita de capa R1 · paleta custom FF)
 * Estrutura: 3 seções — Capa (sem numeração) · Sumário (romano) · Corpo (arábico, reinicia em 1)
 * Regras aplicadas: line 312 em todos os parágrafos com texto · ShadingType.CLEAR ·
 * cantSplit/tableHeader/keepNext em tabelas · larguras em PERCENTAGEM · zero PageBreak
 * (as quebras são feitas por seções NEXT_PAGE) · sem caracteres decorativos de linha.
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, NumberFormat, AlignmentType, HeadingLevel,
  WidthType, BorderStyle, ShadingType, SectionType, TableOfContents,
  TableLayoutType, LevelFormat,
} from "docx";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ── Paleta custom FF (FRAME FLOW) — construída segundo as regras de geração de cor
 *    do design-system: capa escura de marca (#0A0A0A) com texto papel (#F4F0E7) e
 *    acento vermelho (#E10606); corpo em página branca com preto puro (Perfil A) e
 *    vermelho escurecido (#A60404) nas linhas de tabela. Contraste verificado:
 *    papel sobre tinta ≈ 17:1; preto sobre branco ≈ 21:1; cabeçalho papel sobre
 *    #1A1A1A ≈ 14:1 — todos acima de AA. ── */
const P = {
  bg: "0A0A0A", accent: "E10606", ink: "1A1A1A", paper: "F4F0E7",
  cover: { titleColor: "F4F0E7", subtitleColor: "C9C2B4", metaColor: "A8A196", footerColor: "78716A" },
  table: { headerBg: "1A1A1A", headerText: "F4F0E7", accentLine: "A60404", innerLine: "DDD8CC", surface: "F7F5EF" },
};

const FONT = { ascii: "Times New Roman", eastAsia: "Times New Roman", hAnsi: "Times New Roman" };
const MONO = { ascii: "Courier New", eastAsia: "Courier New", hAnsi: "Courier New" };

const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

/* ── Runs ─────────────────────────────────────────────── */
const t = (text, extra = {}) => new TextRun({ text, size: 24, font: FONT, color: "000000", ...extra });
const b = (text) => t(text, { bold: true });
const it = (text) => t(text, { italics: true });
const c = (text) => t(text, { size: 20, font: MONO, color: "3A3430" });

function runsOf(content) {
  if (Array.isArray(content)) return content;
  return [t(String(content))];
}

/* ── Parágrafos ────────────────────────────────────────── */
function p(content, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: opts.after != null ? opts.after : 140, before: opts.before || 0 },
    children: runsOf(content),
  });
}
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1, keepNext: true,
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: P.accent, space: 6 } },
    spacing: { before: 440, after: 220, line: 400, lineRule: "atLeast" },
    children: [new TextRun({ text, bold: true, size: 32, color: P.ink, font: FONT })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2, keepNext: true,
    spacing: { before: 300, after: 150, line: 340, lineRule: "atLeast" },
    children: [new TextRun({ text, bold: true, size: 28, color: P.ink, font: FONT })],
  });
}
function bullets(items) {
  return items.map((item) => new Paragraph({
    alignment: AlignmentType.LEFT, bullet: { level: 0 },
    spacing: { line: 312, after: 80 }, children: runsOf(item),
  }));
}
const NUM_REFS = ["num-transformacao", "num-gatilhos", "num-aceite", "num-fase2passos", "num-passos"];
const numberingConfig = NUM_REFS.map((ref) => ({
  reference: ref,
  levels: [{
    level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 560, hanging: 360 } } },
  }],
}));
function num(ref, items) {
  return items.map((item) => new Paragraph({
    alignment: AlignmentType.LEFT, numbering: { reference: ref, level: 0 },
    spacing: { line: 312, after: 80 }, children: runsOf(item),
  }));
}
function note(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: 140 },
    children: [new TextRun({ text, italics: true, size: 20, color: "6E6961", font: FONT })],
  });
}

/* ── Tabelas (estilo horizontal business · zebra quente · cabeçalho tinta) ── */
let tableCount = 0;
function cellRuns(cell) {
  if (Array.isArray(cell)) return cell;
  if (cell && cell.c) return [c(cell.c)];
  return [t(String(cell), { size: 20 })];
}
function tbl({ caption, headers, rows, widths }) {
  tableCount += 1;
  const cap = new Paragraph({
    keepNext: true, alignment: AlignmentType.LEFT,
    spacing: { before: 220, after: 100, line: 312 },
    children: [new TextRun({ text: "Tabela " + tableCount + " — " + caption, bold: true, size: 21, color: P.ink, font: FONT })],
  });
  const headerRow = new TableRow({
    tableHeader: true, cantSplit: true,
    children: headers.map((h, idx) => new TableCell({
      width: { size: widths[idx], type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: P.table.headerBg },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({
        alignment: AlignmentType.LEFT, spacing: { line: 312 },
        children: [new TextRun({ text: h, bold: true, size: 20, color: P.table.headerText, font: FONT })],
      })],
    })),
  });
  const dataRows = rows.map((row, r) => new TableRow({
    cantSplit: true,
    children: row.map((cell, idx) => new TableCell({
      width: { size: widths[idx], type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: r % 2 === 1 ? P.table.surface : "FFFFFF" },
      margins: { top: 70, bottom: 70, left: 120, right: 120 },
      children: [new Paragraph({
        alignment: AlignmentType.LEFT, spacing: { line: 312 }, children: cellRuns(cell),
      })],
    })),
  }));
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: P.table.accentLine },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: P.table.accentLine },
      left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: P.table.innerLine },
      insideVertical: NB,
    },
    rows: [headerRow, ...dataRows],
  });
  return [cap, table];
}

/* ── Capa — Receita R1 (Pure Paragraph Left), título longo, cálculo dinâmico ── */
function splitTitleLines(title, charsPerLine) {
  if (title.length <= charsPerLine) return [title];
  const breakAfter = new Set([",", ".", ";", ":", "-", "/", " ", "\u00b7", "\u2014"]);
  const lines = [];
  let remaining = title;
  while (remaining.length > charsPerLine) {
    let breakAt = -1;
    for (let i = charsPerLine; i >= Math.floor(charsPerLine * 0.6); i--) {
      if (i < remaining.length && breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
    }
    if (breakAt === -1) {
      const limit = Math.min(remaining.length, Math.ceil(charsPerLine * 1.3));
      for (let i = charsPerLine + 1; i < limit; i++) {
        if (breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
      }
    }
    if (breakAt === -1) breakAt = charsPerLine;
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  if (remaining) lines.push(remaining);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop();
    lines[lines.length - 1] += " " + last;
  }
  return lines;
}
/* Variante latina do calcTitleLayout do design-system: caractere latino ≈ pt × 12 twips
   (o original usa pt × 20 para CJK; ver common-rules — largura chinesa ≈ 2× a inglesa). */
function calcTitleLayout(title, maxWidthTwips, preferredPt = 40, minPt = 24) {
  const charsPerLine = (pt) => Math.floor(maxWidthTwips / (pt * 12));
  let titlePt = preferredPt;
  let lines = splitTitleLines(title, charsPerLine(titlePt));
  while (lines.length > 3 && titlePt > minPt) {
    titlePt -= 2;
    lines = splitTitleLines(title, charsPerLine(titlePt));
  }
  return { titlePt, titleLines: lines };
}
function calcCoverSpacing(params) {
  const {
    titleLineCount = 1, titlePt = 36, hasSubtitle = false, hasEnglishLabel = false,
    metaLineCount = 0, fixedHeight = 800, pageHeight = 16838, marginTop = 0, marginBottom = 0,
  } = params;
  const SAFETY = 1200;
  const usableHeight = pageHeight - marginTop - marginBottom - SAFETY;
  const titleHeight = titleLineCount * (titlePt * 23 + 200);
  const subtitleHeight = hasSubtitle ? (12 * 23 + 600) : 0;
  const englishLabelHeight = hasEnglishLabel ? (9 * 23 + 600) : 0;
  const metaHeight = metaLineCount * (12 * 23 + 120);
  const implicitParaHeight = 3 * 300;
  const contentHeight = titleHeight + subtitleHeight + englishLabelHeight + metaHeight + fixedHeight + implicitParaHeight;
  const remainingSpace = usableHeight - contentHeight;
  const safeRemaining = Math.max(remainingSpace, 400);
  const FOOTER_MIN = 800;
  const rawTop = Math.floor(safeRemaining * 0.45);
  const rawBottom = Math.floor(safeRemaining * 0.45);
  const bottomSpacing = Math.max(rawBottom, FOOTER_MIN);
  const topSpacing = Math.max(rawTop - Math.max(0, FOOTER_MIN - rawBottom), 400);
  const midSpacing = Math.max(safeRemaining - topSpacing - bottomSpacing, 0);
  return { topSpacing, midSpacing, bottomSpacing };
}
function buildCoverR1(config) {
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR - 300;
  const { titlePt, titleLines } = calcTitleLayout(config.title, availableWidth, 40, 24);
  const titleSize = titlePt * 2;
  const spacing = calcCoverSpacing({
    titleLineCount: titleLines.length, titlePt,
    hasSubtitle: !!config.subtitle, hasEnglishLabel: !!config.eyebrow,
    metaLineCount: (config.metaLines || []).length, fixedHeight: 400,
  });
  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: P.accent, space: 12 };
  const children = [];

  children.push(new Paragraph({ spacing: { before: spacing.topSpacing } }));

  if (config.eyebrow) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 500, line: 312 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: P.accent, space: 8 } },
      children: [new TextRun({
        text: config.eyebrow.split("").join("  "), size: 18, color: P.accent,
        font: FONT, characterSpacing: 40,
      })],
    }));
  }
  for (let i = 0; i < titleLines.length; i++) {
    children.push(new Paragraph({
      indent: { left: padL },
      spacing: { after: i < titleLines.length - 1 ? 100 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: titleLines[i], size: titleSize, bold: true, color: P.cover.titleColor, font: FONT })],
    }));
  }
  if (config.subtitle) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 800, line: 340, lineRule: "atLeast" },
      children: [new TextRun({ text: config.subtitle, size: 24, color: P.cover.subtitleColor, font: FONT })],
    }));
  }
  for (const line of (config.metaLines || [])) {
    children.push(new Paragraph({
      indent: { left: padL + 200, right: padR }, spacing: { after: 90, line: 312 },
      border: { left: accentLeft },
      children: [new TextRun({ text: line, size: 24, color: P.cover.metaColor, font: FONT })],
    }));
  }
  children.push(new Paragraph({ spacing: { before: spacing.bottomSpacing } }));
  children.push(new Paragraph({
    indent: { left: padL, right: padR }, spacing: { before: 200, line: 312 },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: P.accent, space: 8 } },
    children: [
      new TextRun({ text: config.footerLeft || "", size: 16, color: P.cover.footerColor, font: FONT }),
      new TextRun({ text: "                                        ", size: 16, font: FONT }),
      new TextRun({ text: config.footerRight || "", size: 16, color: P.cover.footerColor, font: FONT }),
    ],
  }));

  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: P.bg }, borders: noBorders,
        verticalAlign: "top",
        children,
      })],
    })],
  })];
}

/* ── Cabeçalho e rodapés ──────────────────────────────── */
const bodyHeader = new Header({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { line: 312 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: P.table.innerLine, space: 4 } },
    children: [new TextRun({ text: "FRAME FLOW OS — Plano Técnico de Integração · PROMPT 05", size: 16, color: "808080", font: FONT })],
  })],
});
const pageFooter = () => new Footer({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { line: 312 },
    children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080", font: FONT })],
  })],
});

/* ── Kit para os módulos de conteúdo ───────────────────── */
const kit = { h1, h2, p, bullets, num, note, tbl, t, b, it, c };

const contentA = (await import("./content-a.js")).default(kit);
const contentB = (await import("./content-b.js")).default(kit);
const contentC = (await import("./content-c.js")).default(kit);
const contentD = (await import("./content-d.js")).default(kit);
const bodyChildren = [...contentA, ...contentB, ...contentC, ...contentD];

/* ── Sumário (seção própria, numeração romana) ─────────── */
const tocChildren = [
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 480, after: 360, line: 400, lineRule: "atLeast" },
    children: [new TextRun({ text: "Sumário", bold: true, size: 32, color: P.ink, font: FONT })],
  }),
  new TableOfContents("Sumário", { hyperlink: true, headingStyleRange: "1-2" }),
  new Paragraph({
    spacing: { before: 200, line: 312 },
    children: [new TextRun({
      text: "Nota: este Sumário é gerado por códigos de campo. Após qualquer edição, clique com o botão direito sobre o Sumário e escolha Atualizar Campo para atualizar os números de página.",
      italics: true, size: 18, color: "888888", font: FONT,
    })],
  }),
];

/* ── Documento ─────────────────────────────────────────── */
const pgSize = { width: 11906, height: 16838 };
const pgMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };

const doc = new Document({
  creator: "FRAME VISION",
  title: "FRAME FLOW OS — Plano Técnico de Integração Progressiva (PROMPT 05)",
  description: "Plano técnico das Fases 1, 2 e 3 — integração progressiva da experiência aprovada ao aplicativo FRAME FLOW",
  styles: {
    default: {
      document: {
        run: { font: FONT, size: 24, color: "000000" },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: FONT, size: 32, bold: true, color: P.ink },
        paragraph: { spacing: { before: 440, after: 220 } },
      },
      heading2: {
        run: { font: FONT, size: 28, bold: true, color: P.ink },
        paragraph: { spacing: { before: 300, after: 150 } },
      },
    },
  },
  numbering: { config: numberingConfig },
  sections: [
    { /* Seção 1 — Capa (margem 0, sem rodapé, sem numeração) */
      properties: { page: { size: pgSize, margin: { top: 0, bottom: 0, left: 0, right: 0 } } },
      children: buildCoverR1({
        eyebrow: "FRAME FLOW OS",
        title: "Plano Técnico de Integração Progressiva",
        subtitle: "PROMPT 05 — Integração da experiência visual aprovada (Conceito C) ao aplicativo FRAME FLOW, preservando integralmente a fundação técnica das Etapas 1 e 1.1",
        metaLines: [
          "Projeto: FRAME FLOW — Sistema operacional da FRAME VISION",
          "Escopo: somente o plano técnico das Fases 1, 2 e 3",
          "Estado: nenhum arquivo do aplicativo foi modificado",
          "Data: 30 de outubro de 2026 · Aguardando autorização",
        ],
        footerLeft: "FRAME VISION — Gestão Integrada",
        footerRight: "Documento de trabalho · Confidencial",
      }),
    },
    { /* Seção 2 — Sumário (romano i, ii) */
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { size: pgSize, margin: pgMargin, pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN } },
      },
      footers: { default: pageFooter() },
      children: tocChildren,
    },
    { /* Seção 3 — Corpo (arábico, reinicia em 1) */
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { size: pgSize, margin: pgMargin, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } },
      },
      headers: { default: bodyHeader },
      footers: { default: pageFooter() },
      children: bodyChildren,
    },
  ],
});

const OUT = "/home/z/my-project/download/FRAME-FLOW-PROMPT05-Plano-Tecnico-Integracao.docx";
Packer.toBuffer(doc).then((buf) => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buf);
  console.log("OK: documento gerado em " + OUT + " (" + buf.length + " bytes, " + tableCount + " tabelas)");
}).catch((e) => { console.error("FALHA:", e); process.exit(1); });



import { describe, expect, it } from "vitest";
import {
  TZ_PADRAO,
  centavosParaBRL,
  descreverPrazo,
  formatarBRL,
  formatarData,
  formatarDataHora,
  formatarMesAno,
  gradeCalendario,
  inputDataParaISO,
} from "@/lib/frameflow/format";

describe("conversões monetárias (centavos ↔ BRL)", () => {
  it("converte centavos do banco para BRL sem perder precisão", () => {
    expect(centavosParaBRL(0)).toBe(0);
    expect(centavosParaBRL(1)).toBe(0.01);
    expect(centavosParaBRL(123456)).toBe(1234.56);
    expect(centavosParaBRL(1500000)).toBe(15000);
  });

  it("arredonda sub-centavos de forma determinística (regra da camada de dados)", () => {
    // A camada de dados grava Math.round(valor * 100); a leitura divide por 100.
    expect(centavosParaBRL(Math.round(15000.5 * 100))).toBe(15000.5);
    expect(centavosParaBRL(Math.round(15000.555 * 100))).toBe(15000.56);
  });

  it("round-trip de gravação/leitura preserva o valor (R$ 15.000,00)", () => {
    const brl = 15000;
    const centavos = Math.round(brl * 100);
    expect(centavos).toBe(1500000);
    expect(centavosParaBRL(centavos)).toBe(brl);
  });

  it("formata em pt-BR com R$", () => {
    const texto = formatarBRL(15000);
    expect(texto).toContain("R$");
    expect(texto).toContain("15.000,00");
    expect(formatarBRL(1234.56)).toContain("1.234,56");
  });

  it("formato compacto também é moeda BRL", () => {
    const texto = formatarBRL(15000, true);
    expect(texto).toContain("R$");
  });
});

describe("datas (fuso America/Sao_Paulo, pt-BR)", () => {
  it("preserva datas de calendário sem recuar um dia no Brasil", () => {
    expect(formatarData("2026-11-01")).toMatch(/^01 de nov/);
    expect(formatarData("2027-01-01")).toMatch(/^01 de jan/);
  });
  it("continua convertendo timestamps completos para o fuso da empresa", () => {
    expect(formatarData("2026-11-01T01:00:00Z")).toMatch(/^31 de out/);
  });
  it("TZ_PADRAO é o fuso corporativo", () => {
    expect(TZ_PADRAO).toBe("America/Sao_Paulo");
  });

  it("formata data em português com o fuso correto", () => {
    const texto = formatarData("2026-10-30T12:00:00.000Z");
    expect(texto).toContain("out");
    expect(texto).toContain("2026");
    // 12:00 UTC = 09:00 em São Paulo (UTC-3): continua 30/out.
    expect(texto).toContain("30");
  });

  it("formata data e hora", () => {
    const texto = formatarDataHora("2026-10-30T12:00:00.000Z");
    expect(texto).toContain("30");
    expect(texto).toMatch(/\d{2}:\d{2}/);
  });

  it("formata mês e ano por referência", () => {
    const texto = formatarMesAno(new Date(2026, 10, 1));
    expect(texto).toContain("2026");
  });

  it("descreve prazos relativos: hoje, amanhã, ontem e em N dias", () => {
    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    const em3 = new Date(hoje);
    em3.setDate(em3.getDate() + 3);

    expect(descreverPrazo(hoje.toISOString())).toBe("Hoje");
    expect(descreverPrazo(amanha.toISOString())).toBe("Amanhã");
    expect(descreverPrazo(ontem.toISOString())).toBe("Ontem");
    expect(descreverPrazo(em3.toISOString())).toBe("em 3 dias");
  });

  it("converte input date para ISO com meia-noite segura no fuso (12h UTC)", () => {
    expect(inputDataParaISO("2026-11-02")).toBe("2026-11-02T12:00:00.000Z");
    // valor vazio devolve "agora" (ISO) — usado pelos prazos opcionais
    expect(inputDataParaISO("")).toBeTruthy();
  });

  it("grade do calendário: 6 semanas começando em domingo, cobrindo o mês", () => {
    const grade = gradeCalendario(new Date(2026, 9, 15)); // out/2026
    expect(grade).toHaveLength(42);
    expect(grade[0].getDay()).toBe(0); // domingo
    const diasDoMes = grade.filter((d) => d.getMonth() === 9);
    expect(diasDoMes.some((d) => d.getDate() === 1)).toBe(true);
  });
});

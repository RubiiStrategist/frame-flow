/**
 * Formatação — pt-BR, BRL, fuso America/Sao_Paulo.
 * Padrões centralizados para toda a plataforma (regra do produto: idioma e
 * moeda fixos; o banco armazena centavos e datas UTC/ISO).
 */

export const TZ_PADRAO = "America/Sao_Paulo";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const brlCompacto = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** BRL a partir de centavos (forma de armazenamento no banco). */
export function centavosParaBRL(centavos: number): number {
  return Math.round(centavos) / 100;
}

export function formatarBRL(valor: number, compacto = false): string {
  return compacto ? brlCompacto.format(valor) : brl.format(valor);
}

export function formatarData(iso: string): string {
  // A calendar date has no timezone. Keep its civil day when displaying in Brazil.
  const value = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00Z` : iso;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: TZ_PADRAO,
  }).format(new Date(value));
}

export function formatarDataHora(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ_PADRAO,
  }).format(new Date(iso));
}

export function formatarMesAno(ref: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: TZ_PADRAO,
  }).format(ref);
}

/** "Hoje", "Ontem", "em 3 dias" ou data curta — para prazos e vencimentos. */
export function descreverPrazo(iso: string): string {
  const hoje = new Date();
  const alvo = new Date(iso);
  const diffMs = new Date(
    alvo.getFullYear(),
    alvo.getMonth(),
    alvo.getDate()
  ).getTime() -
    new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
  const dias = Math.round(diffMs / 86_400_000);
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  if (dias === -1) return "Ontem";
  if (dias > 1 && dias <= 7) return `em ${dias} dias`;
  return formatarData(iso);
}

/** Converte um input date (yyyy-mm-dd) para ISO com meia-noite no fuso padrão. */
export function inputDataParaISO(valor: string): string {
  if (!valor) return new Date().toISOString();
  const [y, m, d] = valor.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12)).toISOString(); // 12h UTC evita virada de fuso
}

/** Semana ISO iniciando em domingo — grade da agenda. */
export function gradeCalendario(ref: Date): Date[] {
  const primeiro = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const inicio = new Date(primeiro);
  inicio.setDate(1 - primeiro.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    return d;
  });
}

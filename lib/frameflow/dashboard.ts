import type { FinanceTransaction, Lead, Task } from './types';

/** Calendar keys use the business timezone; date-only values stay date-only. */
export function dateKey(value: string | Date): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
}

export function dashboardSeries(transactions: FinanceTransaction[], leads: Lead[], now = new Date()) {
  const [year, month] = dateKey(now).split('-').map(Number);
  return Array.from({ length: 6 }, (_, i) => {
    const ref = new Date(Date.UTC(year, month - 6 + i, 15, 12));
    const key = ref.toISOString().slice(0, 7);
    const entries = transactions.filter(t => t.vencimento.slice(0, 7) === key);
    const income = entries.filter(t => t.tipo === 'entrada').reduce((sum, t) => sum + t.valor, 0);
    const expense = entries.filter(t => t.tipo === 'saida').reduce((sum, t) => sum + t.valor, 0);
    return { label: new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' }).format(ref).replace('.', ''), income, expense, net: income - expense, opportunities: leads.filter(l => dateKey(l.createdAt).startsWith(key)).length };
  });
}

export function projectProgress(id: string, tasks: Task[]): number | null {
  const related = tasks.filter(t => t.projetoId === id);
  return related.length ? Math.round(100 * related.filter(t => t.status === 'concluida').length / related.length) : null;
}

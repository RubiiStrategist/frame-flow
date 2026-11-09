import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataProvider, useData } from '@/lib/frameflow/data';

const mock = vi.hoisted(() => ({
  response: { data: null as null | Record<string, unknown>, error: null as null | { message: string } },
  user: { id: 'current-user' } as { id: string } | null,
  insert: vi.fn(),
}));
vi.mock('@/lib/supabase/client', () => ({ getSupabase: () => ({
  auth: { getUser: async () => ({ data: { user: mock.user }, error: null }) },
  from: () => {
    const query = {
      update: () => query, eq: () => query, select: () => query,
      insert: (payload: unknown) => { mock.insert(payload); return query; },
      maybeSingle: async () => mock.response,
      single: async () => mock.response,
    };
    return query;
  },
}) }));

describe('data mutation outcomes', () => {
  beforeEach(() => { mock.response = { data: null, error: null }; mock.user = { id: 'current-user' }; mock.insert.mockClear(); });
  for (const operation of ['lead', 'payment'] as const) {
    it.each([
      { data: null, error: null, expected: false, label: 'no rows visible under RLS' },
      { data: null, error: { message: 'permission denied' }, expected: false, label: 'database rejection' },
      { data: { id: 'record' }, error: null, expected: true, label: 'confirmed row' },
    ])(`${operation}: $label`, async ({ data, error, expected }) => {
      mock.response = { data, error };
      const { result } = renderHook(() => useData(), { wrapper: DataProvider });
      const outcome = operation === 'lead'
        ? await result.current.updateLeadStage('record', 'contato')
        : await result.current.markTransactionPaid('record');
      expect(outcome).toBe(expected);
    });
  }
  it('assigns the authenticated author to finance and decisions', async () => {
    mock.response.data = { id: 'created' };
    const { result } = renderHook(() => useData(), { wrapper: DataProvider });
    await result.current.createTransaction({ tipo: 'entrada', categoria: 'outro', descricao: 'Test', valor: 10.25, projetoId: null, clienteId: null, vencimento: '2026-10-30', pago: false, metodoPagamento: null });
    expect(mock.insert).toHaveBeenLastCalledWith(expect.objectContaining({ criado_por: 'current-user', valor: 1025 }));
    await result.current.createDecision({ titulo: 'Test', descricao: 'Test', justificativa: null, impactoFinanceiro: null, participantes: [], regraAprovacao: 'maioria', prazo: null });
    expect(mock.insert).toHaveBeenLastCalledWith(expect.objectContaining({ solicitante_id: 'current-user' }));
  });
  it('rejects decision creation without a validated user', async () => {
    mock.user = null;
    const { result } = renderHook(() => useData(), { wrapper: DataProvider });
    await expect(result.current.createDecision({ titulo: 'Test', descricao: 'Test', justificativa: null, impactoFinanceiro: null, participantes: [], regraAprovacao: 'maioria', prazo: null })).rejects.toThrow('Sessão necessária');
    expect(mock.insert).not.toHaveBeenCalled();
  });
});

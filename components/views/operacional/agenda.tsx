"use client";

/**
 * Agenda — calendário integrado (MVP): grade mensal real com marcos
 * derivados de prazos de tarefas e vencimentos financeiros (dados reais).
 */

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, IrParaConfiguracao, ModuleHeader } from "@/components/common/frame-primitives";
import { useAsyncList, useData } from "@/lib/frameflow/data";
import { useAuth } from "@/lib/frameflow/auth";
import { formatarMesAno, gradeCalendario } from "@/lib/frameflow/format";

export function AgendaView() {
  const { configured } = useAuth();
  const data = useData();
  const tarefas = useAsyncList(data.listTasks);
  const transacoes = useAsyncList(data.listTransactions);
  const [ref, setRef] = useState(() => new Date());

  const eventosPorDia = useMemo(() => {
    if (!configured) return new Map<string, { rotulo: string; tipo: string }[]>();
    const mapa = new Map<string, { rotulo: string; tipo: string }[]>();
    const chave = (iso: string) => {
      const d = new Date(iso);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    };
    if (tarefas.result.reason === "vazio") {
      for (const t of tarefas.result.data) {
        if (!t.prazo) continue;
        const k = chave(t.prazo);
        mapa.set(k, [...(mapa.get(k) ?? []), { rotulo: t.titulo, tipo: "tarefa" }]);
      }
    }
    if (transacoes.result.reason === "vazio") {
      for (const t of transacoes.result.data) {
        if (t.pago) continue;
        const k = chave(t.vencimento);
        mapa.set(k, [...(mapa.get(k) ?? []), { rotulo: `Vencimento: ${t.descricao}`, tipo: "financeiro" }]);
      }
    }
    return mapa;
  }, [configured, tarefas.result, transacoes.result]);

  const dias = useMemo(() => gradeCalendario(ref), [ref]);
  const hoje = new Date();

  return (
    <div>
      <ModuleHeader
        eyebrow="Operacional · Calendário integrado"
        title="Agenda"
        description="Prazos de tarefas e vencimentos financeiros de toda a operação em um único calendário."
        actions={
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" className="h-8 w-8 rounded-lg border-border p-0" onClick={() => setRef(new Date(ref.getFullYear(), ref.getMonth() - 1, 1))} aria-label="Mês anterior">
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Button>
            <Button size="sm" variant="outline" className="ff-meta h-8 rounded-lg border-border" onClick={() => setRef(new Date())}>
              Hoje
            </Button>
            <Button size="sm" variant="outline" className="h-8 w-8 rounded-lg border-border p-0" onClick={() => setRef(new Date(ref.getFullYear(), ref.getMonth() + 1, 1))} aria-label="Próximo mês">
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        }
      />

      <p className="ff-display mb-4 text-lg capitalize md:text-xl">{formatarMesAno(ref)}</p>

      <div className="border border-border">
        <div className="grid grid-cols-7 border-b border-border bg-secondary/50">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
            <div key={d} className="ff-eyebrow px-2 py-2 text-center text-muted-foreground">
              <span className="hidden sm:inline">{d === "Dom" ? "Domingo" : d === "Sáb" ? "Sábado" : d}</span>
              <span className="sm:hidden">{d}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {dias.map((dia) => {
            const eventos = eventosPorDia.get(`${dia.getFullYear()}-${dia.getMonth()}-${dia.getDate()}`) ?? [];
            const foraDoMes = dia.getMonth() !== ref.getMonth();
            const ehHoje =
              dia.getDate() === hoje.getDate() &&
              dia.getMonth() === hoje.getMonth() &&
              dia.getFullYear() === hoje.getFullYear();
            return (
              <div
                key={dia.toISOString()}
                className={`min-h-[72px] border-b border-r border-border p-1.5 md:min-h-[92px] ${
                  foraDoMes ? "bg-background/40 opacity-40" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`ff-numeric text-xs ${ehHoje ? "rounded-lg bg-[var(--frame-red)] px-1.5 text-white" : "text-muted-foreground"}`}
                  >
                    {dia.getDate()}
                  </span>
                  {ehHoje && <span className="ff-meta text-[8px] text-[var(--frame-red)]">HOJE</span>}
                </div>
                <ul className="mt-1 space-y-0.5">
                  {eventos.slice(0, 3).map((ev, i) => (
                    <li
                      key={i}
                      className={`truncate rounded-[1px] px-1 py-0.5 text-[10px] leading-tight ${
                        ev.tipo === "financeiro"
                          ? "bg-[var(--frame-red)]/15 text-[#ffb3b3]"
                          : "bg-secondary text-muted-foreground"
                      }`}
                      title={ev.rotulo}
                    >
                      {ev.rotulo}
                    </li>
                  ))}
                  {eventos.length > 3 && (
                    <li className="px-1 text-[9px] text-muted-foreground">+{eventos.length - 3} evento(s)</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[1px] bg-secondary" aria-hidden /> Tarefa
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[1px] bg-[var(--frame-red)]/50" aria-hidden /> Vencimento financeiro
        </span>
      </div>

      {!configured && (
        <div className="mt-6">
          <EmptyState
            result={{ data: [], reason: "not-configured" }}
            tituloVazio="Eventos aguardando conexão"
            descricaoVazio="Com o Supabase configurado, prazos de tarefas e vencimentos preenchem a agenda automaticamente."
            action={<IrParaConfiguracao rota="#/executivo/configuracoes" />}
          />
        </div>
      )}
    </div>
  );
}

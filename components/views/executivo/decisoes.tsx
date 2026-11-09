"use client";

/**
 * Central de Decisões dos Sócios (MVP).
 * Solicitações com título, justificativa, impacto financeiro, participantes,
 * regra de aprovação configurável e histórico. Regras: unanimidade é uma
 * opção — o padrão configurável não a pressupõe.
 * Votos: cada sócio registra/altera APENAS o próprio voto — gravado na tabela
 * relacional `decisao_votos`, com identidade garantida por RLS no banco.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Landmark, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, IrParaConfiguracao, ModuleHeader } from "@/components/common/frame-primitives";
import { useAsyncList, useData } from "@/lib/frameflow/data";
import { useAuth } from "@/lib/frameflow/auth";
import { formatarBRL, formatarData } from "@/lib/frameflow/format";
import { decisaoSchema, type DecisaoForm } from "@/lib/frameflow/schemas";
import { cn } from "@/lib/utils";
import { NotConfiguredError, type ApprovalRule, type DecisionRequest, type DecisionVote } from "@/lib/frameflow/types";

const REGRAS: { valor: ApprovalRule; rotulo: string }[] = [
  { valor: "maioria", rotulo: "Maioria simples" },
  { valor: "unanimidade", rotulo: "Unanimidade" },
  { valor: "socio_presente", rotulo: "Primeiro sócio presente decide" },
  { valor: "livre", rotulo: "Livre (sem regra fixa)" },
];

const ROTULO_VOTO: Record<DecisionVote["voto"], string> = {
  favor: "A favor",
  contra: "Contra",
  abstencao: "Abstenção",
};

const VOTO_ORDEM: DecisionVote["voto"][] = ["favor", "contra", "abstencao"];

const STATUS_ROTULO: Record<string, string> = {
  rascunho: "Rascunho",
  aberta: "Aberta",
  aprovada: "Aprovada",
  reprovada: "Reprovada",
  cancelada: "Cancelada",
};

export function DecisoesView() {
  const { configured, profile } = useAuth();
  const data = useData();
  const { result, loading, reload } = useAsyncList(data.listDecisions);
  const [aberto, setAberto] = useState(false);
  const [votando, setVotando] = useState<string | null>(null);

  const ehSocio = profile?.role === "ceo" || profile?.role === "cro" || profile?.role === "coo_cfo";

  function meuVoto(d: DecisionRequest): DecisionVote["voto"] | null {
    if (!profile) return null;
    return d.votos.find((v) => v.socioId === profile.id)?.voto ?? null;
  }

  async function votar(d: DecisionRequest, voto: DecisionVote["voto"]) {
    setVotando(d.id);
    try {
      const ok = await data.castVote(d.id, voto);
      if (ok) {
        toast({ title: "Voto registrado", description: `${ROTULO_VOTO[voto]} — só o seu próprio voto é gravável (RLS no banco).` });
        reload();
      } else {
        toast({ title: "Voto não registrado", description: "A decisão pode não estar mais aberta.", variant: "destructive" });
      }
    } catch (erro) {
      if (erro instanceof NotConfiguredError) {
        toast({ title: "Persistência indisponível", description: "Configure o Supabase para votar.", variant: "destructive" });
      } else {
        toast({ title: "Não foi possível votar", variant: "destructive" });
      }
    } finally {
      setVotando(null);
    }
  }

  const form = useForm<DecisaoForm>({
    resolver: zodResolver(decisaoSchema),
    defaultValues: { titulo: "", descricao: "", justificativa: "", impactoFinanceiro: "", regraAprovacao: "maioria", prazo: "" },
  });

  async function submeter(valores: DecisaoForm) {
    try {
      const impacto = valores.impactoFinanceiro
        ? Number(valores.impactoFinanceiro.replace(",", ".")) || null
        : null;
      await data.createDecision({
        titulo: valores.titulo.trim(),
        descricao: valores.descricao.trim(),
        justificativa: valores.justificativa?.trim() || null,
        impactoFinanceiro: impacto,
        participantes: [],
        regraAprovacao: valores.regraAprovacao,
        prazo: valores.prazo || null,
      });
      toast({
        title: "Solicitação aberta",
        description: "Os sócios são notificados e o histórico registra a criação.",
      });
      setAberto(false);
      form.reset();
      reload();
    } catch (erro) {
      if (erro instanceof NotConfiguredError) {
        toast({ title: "Persistência indisponível", description: "Configure o Supabase para salvar.", variant: "destructive" });
      } else {
        toast({ title: "Não foi possível salvar", variant: "destructive" });
      }
    }
  }

  const abertas = result.data.filter((d) => d.status === "aberta");
  const arquivadas = result.data.filter((d) => d.status !== "aberta");

  return (
    <div>
      <ModuleHeader
        eyebrow="Executivo · Gestão"
        title="Central de decisões"
        description="Solicitações estratégicas dos sócios: justificativa, impacto financeiro, votos e histórico — regra de aprovação configurável."
        actions={
          <Button size="sm" className="ff-meta rounded-lg bg-[var(--frame-red)] hover:bg-[#ff1a1a]" onClick={() => setAberto(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Nova solicitação
          </Button>
        }
      />

      {result.data.length > 0 ? (
        <div className="space-y-6">
          {abertas.length > 0 && (
            <section aria-label="Solicitações abertas">
              <h2 className="ff-eyebrow mb-2 text-muted-foreground">Abertas ({abertas.length})</h2>
              <div className="space-y-3">
                {abertas.map((d) => (
                  <article key={d.id} className="ff-surface border border-border bg-card p-4 md:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="ff-display text-sm md:text-base">{d.titulo}</p>
                      <span className="ff-meta rounded-lg border border-[var(--frame-red)]/40 px-2 py-0.5 text-[9px] text-[var(--frame-red)]">
                        {STATUS_ROTULO[d.status]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d.descricao}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
                      {d.impactoFinanceiro != null && (
                        <span className="ff-meta text-muted-foreground">
                          Impacto: <span className="ff-numeric text-foreground">{formatarBRL(d.impactoFinanceiro)}</span>
                        </span>
                      )}
                      <span className="ff-meta text-muted-foreground">
                        Regra: {REGRAS.find((r) => r.valor === d.regraAprovacao)?.rotulo}
                      </span>
                      <span className="ff-meta text-muted-foreground">Votos: {d.votos.length}</span>
                      <span className="ff-meta text-muted-foreground">{formatarData(d.createdAt)}</span>
                    </div>
                    {configured && ehSocio && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                        <span className="ff-meta text-[9px] text-muted-foreground">
                          {meuVoto(d) ? `Seu voto: ${ROTULO_VOTO[meuVoto(d)!]}` : "Registre seu voto"}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {VOTO_ORDEM.map((v) => (
                            <Button
                              key={v}
                              size="sm"
                              variant={meuVoto(d) === v ? "default" : "outline"}
                              disabled={votando === d.id}
                              onClick={() => votar(d, v)}
                              className={cn(
                                "ff-meta h-7 rounded-lg px-2 text-[11px]",
                                meuVoto(d) === v && "bg-[var(--frame-red)] hover:bg-[#ff1a1a]"
                              )}
                            >
                              {ROTULO_VOTO[v]}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
          {arquivadas.length > 0 && (
            <section aria-label="Histórico">
              <h2 className="ff-eyebrow mb-2 text-muted-foreground">Histórico ({arquivadas.length})</h2>
              <ul className="ff-data-list divide-y divide-border border border-border">
                {arquivadas.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 p-3.5">
                    <p className="min-w-0 truncate text-sm">{d.titulo}</p>
                    <span className="ff-meta shrink-0 text-muted-foreground">{STATUS_ROTULO[d.status]}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <EmptyState
          result={result}
          loading={loading}
          icon={Landmark}
          tituloVazio="Nenhuma solicitação de decisão"
          descricaoVazio="Abra a primeira solicitação estratégica — votos, regra de aprovação e histórico ficam registrados."
          action={
            <>
              <Button size="sm" variant="outline" className="ff-meta rounded-lg" onClick={() => setAberto(true)}>
                <Plus className="h-4 w-4" aria-hidden /> Nova solicitação
              </Button>
              {!configured && <IrParaConfiguracao rota="#/executivo/configuracoes" />}
            </>
          }
        />
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="ff-display text-base">Solicitar decisão</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {configured
                ? `Solicitante: ${profile?.fullName ?? "sócio conectado"} · histórico completo registrado.`
                : "Persistência exige configuração do Supabase."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submeter)} className="space-y-4">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ff-meta text-muted-foreground">Título</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-10 rounded-lg border-border bg-secondary" placeholder="Ex.: Investir em lente cinematográfica" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ff-meta text-muted-foreground">Descrição da decisão</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} className="rounded-lg border-border bg-secondary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="justificativa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ff-meta text-muted-foreground">Justificativa (opcional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} className="rounded-lg border-border bg-secondary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="impactoFinanceiro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="ff-meta text-muted-foreground">Impacto financeiro (R$, opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} inputMode="decimal" className="ff-numeric h-10 rounded-lg border-border bg-secondary" placeholder="12000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prazo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="ff-meta text-muted-foreground">Prazo (opcional)</FormLabel>
                      <Input {...field} type="date" className="h-10 rounded-lg border-border bg-secondary" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="regraAprovacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ff-meta text-muted-foreground">Regra de aprovação</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 rounded-lg border-border bg-secondary">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-lg border-border bg-popover">
                        {REGRAS.map((r) => (
                          <SelectItem key={r.valor} value={r.valor}>{r.rotulo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" size="sm" className="ff-meta rounded-lg" onClick={() => setAberto(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="ff-meta rounded-lg bg-[var(--frame-red)] hover:bg-[#ff1a1a]">
                  Abrir solicitação
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

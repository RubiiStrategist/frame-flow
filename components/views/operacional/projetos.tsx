"use client";

/**
 * Projetos — gestão operacional (MVP).
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clapperboard, Plus } from "lucide-react";
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
import { formatarBRL } from "@/lib/frameflow/format";
import { inputDataParaISO } from "@/lib/frameflow/format";
import { projetoSchema, type ProjetoForm } from "@/lib/frameflow/schemas";
import { NotConfiguredError, type ProjectStatus } from "@/lib/frameflow/types";

const STATUS: { valor: ProjectStatus; rotulo: string }[] = [
  { valor: "briefing", rotulo: "Briefing" },
  { valor: "planejamento", rotulo: "Planejamento" },
  { valor: "producao", rotulo: "Produção" },
  { valor: "revisao", rotulo: "Revisão" },
  { valor: "aprovacao", rotulo: "Aprovação" },
  { valor: "entregue", rotulo: "Entregue" },
  { valor: "pausado", rotulo: "Pausado" },
];

export function ProjetosView() {
  const { configured } = useAuth();
  const data = useData();
  const { result, loading, reload } = useAsyncList(data.listProjects);
  const clientes = useAsyncList(data.listClients);
  const [aberto, setAberto] = useState(false);

  const form = useForm<ProjetoForm>({
    resolver: zodResolver(projetoSchema),
    defaultValues: { titulo: "", tipoServico: "", clienteId: "", status: "briefing", orcamento: "0", dataEntregaPrevista: "", descricao: "" },
  });

  async function submeter(valores: ProjetoForm) {
    if (clientes.result.data.length === 0) {
      toast({ title: "Cadastre um cliente primeiro", description: "Todo projeto pertence a um cliente — relação obrigatória.", variant: "destructive" });
      return;
    }
    try {
      await data.createProject({
        clienteId: valores.clienteId,
        titulo: valores.titulo.trim(),
        tipoServico: valores.tipoServico.trim(),
        status: valores.status,
        responsavelId: null,
        dataInicio: new Date().toISOString(),
        dataEntregaPrevista: valores.dataEntregaPrevista ? inputDataParaISO(valores.dataEntregaPrevista) : null,
        orcamento: Number(valores.orcamento.replace(",", ".")) || 0,
        descricao: valores.descricao?.trim() || null,
      });
      toast({ title: "Projeto criado", description: "Acompanhe o status no dashboard operacional." });
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

  const nomeCliente = (id: string) => clientes.result.data.find((c) => c.id === id)?.nomeFantasia ?? "—";

  return (
    <div>
      <ModuleHeader
        eyebrow="Operacional · Produção"
        title="Projetos"
        description="Da captação à entrega: cada projeto vinculado a um cliente e ao financeiro."
        actions={
          <Button size="sm" className="ff-meta rounded-lg bg-[var(--frame-red)] hover:bg-[#ff1a1a]" onClick={() => setAberto(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Novo projeto
          </Button>
        }
      />

      {result.data.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {result.data.map((projeto) => (
            <article key={projeto.id} className="ff-surface border border-border bg-card p-4 transition-colors ff-ease hover:border-white/25">
              <div className="flex items-start justify-between gap-2">
                <p className="ff-display truncate text-sm">{projeto.titulo}</p>
                <span className="ff-meta shrink-0 rounded-lg border border-[var(--frame-red)]/40 px-2 py-0.5 text-[9px] text-[var(--frame-red)]">
                  {STATUS.find((s) => s.valor === projeto.status)?.rotulo}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {nomeCliente(projeto.clienteId)} · {projeto.tipoServico}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="ff-numeric text-sm">{formatarBRL(projeto.orcamento, true)}</span>
                {projeto.dataEntregaPrevista && (
                  <span className="text-[10px] text-muted-foreground">entrega {new Date(projeto.dataEntregaPrevista).toLocaleDateString("pt-BR")}</span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          result={result}
          loading={loading}
          icon={Clapperboard}
          tituloVazio="Nenhum projeto criado"
          descricaoVazio="Crie o primeiro projeto — todo projeto pertence a um cliente (relação obrigatória do banco)."
          action={
            <>
              <Button size="sm" variant="outline" className="ff-meta rounded-lg" onClick={() => setAberto(true)}>
                <Plus className="h-4 w-4" aria-hidden /> Criar projeto
              </Button>
              {!configured && <IrParaConfiguracao rota="#/executivo/configuracoes" />}
            </>
          }
        />
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="ff-display text-base">Novo projeto</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {configured ? "Vinculado ao cliente com integridade relacional." : "Persistência exige configuração do Supabase."}
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
                      <Input {...field} className="h-10 rounded-lg border-border bg-secondary" placeholder="Ex.: Campanha institucional 2026" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="clienteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="ff-meta text-muted-foreground">Cliente</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 rounded-lg border-border bg-secondary">
                            <SelectValue placeholder="Selecionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-lg border-border bg-popover">
                          {clientes.result.data.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-muted-foreground">Cadastre um cliente antes.</div>
                          ) : (
                            clientes.result.data.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.nomeFantasia}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipoServico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="ff-meta text-muted-foreground">Tipo de serviço</FormLabel>
                      <Input {...field} className="h-10 rounded-lg border-border bg-secondary" placeholder="Filmagem, edição, estratégia…" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="ff-meta text-muted-foreground">Status inicial</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 rounded-lg border-border bg-secondary">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-lg border-border bg-popover">
                          {STATUS.map((s) => (
                            <SelectItem key={s.valor} value={s.valor}>{s.rotulo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="orcamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="ff-meta text-muted-foreground">Orçamento (R$)</FormLabel>
                      <Input {...field} inputMode="decimal" className="ff-numeric h-10 rounded-lg border-border bg-secondary" placeholder="25000" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="dataEntregaPrevista"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ff-meta text-muted-foreground">Entrega prevista (opcional)</FormLabel>
                    <Input {...field} type="date" className="h-10 rounded-lg border-border bg-secondary" />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ff-meta text-muted-foreground">Descrição (opcional)</FormLabel>
                    <Textarea {...field} rows={3} className="rounded-lg border-border bg-secondary" />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" size="sm" className="ff-meta rounded-lg" onClick={() => setAberto(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="ff-meta rounded-lg bg-[var(--frame-red)] hover:bg-[#ff1a1a]">
                  Criar projeto
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

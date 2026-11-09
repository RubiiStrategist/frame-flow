"use client";

/**
 * Tarefas — gestão com responsáveis e prazos (MVP).
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Circle, CircleCheck, ListChecks, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, IrParaConfiguracao, ModuleHeader } from "@/components/common/frame-primitives";
import { useAsyncList, useData } from "@/lib/frameflow/data";
import { useAuth } from "@/lib/frameflow/auth";
import { descreverPrazo, inputDataParaISO } from "@/lib/frameflow/format";
import { tarefaSchema, type TarefaForm } from "@/lib/frameflow/schemas";
import { NotConfiguredError } from "@/lib/frameflow/types";

export function TarefasView() {
  const { configured } = useAuth();
  const data = useData();
  const { result, loading, reload } = useAsyncList(data.listTasks);
  const [aberto, setAberto] = useState(false);

  const form = useForm<TarefaForm>({
    resolver: zodResolver(tarefaSchema),
    defaultValues: { titulo: "", prioridade: "media", prazo: "" },
  });

  async function submeter(valores: TarefaForm) {
    try {
      await data.createTask({
        projetoId: null,
        titulo: valores.titulo.trim(),
        descricao: null,
        status: "pendente",
        prioridade: valores.prioridade,
        responsavelId: null,
        prazo: valores.prazo ? inputDataParaISO(valores.prazo) : null,
      });
      toast({ title: "Tarefa criada", description: "Ela aparece na agenda e no dashboard operacional." });
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

  const pendentes = result.data.filter((t) => t.status !== "concluida");
  const concluidas = result.data.filter((t) => t.status === "concluida");

  return (
    <div>
      <ModuleHeader
        eyebrow="Operacional · Produção"
        title="Tarefas"
        description="Responsáveis, prioridades e prazos — integradas aos projetos e à agenda."
        actions={
          <Button size="sm" className="ff-meta rounded-lg bg-[var(--frame-red)] hover:bg-[#ff1a1a]" onClick={() => setAberto(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Nova tarefa
          </Button>
        }
      />

      {result.data.length > 0 ? (
        <div className="space-y-6">
          <section aria-label="Pendentes">
            <h2 className="ff-eyebrow mb-2 text-muted-foreground">Pendentes ({pendentes.length})</h2>
            <ul className="ff-data-list divide-y divide-border border border-border">
              {pendentes.map((t) => (
                <li key={t.id} className="flex items-center gap-3 p-3.5">
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{t.titulo}</p>
                    <p className="ff-meta text-[9px] text-muted-foreground">
                      prioridade {t.prioridade} {t.prazo ? `· ${descreverPrazo(t.prazo)}` : ""}
                    </p>
                  </div>
                  {t.prioridade === "alta" && (
                    <span className="ff-meta shrink-0 rounded-lg border border-[var(--frame-red)]/40 px-1.5 py-0.5 text-[8px] text-[var(--frame-red)]">
                      URGENTE
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
          {concluidas.length > 0 && (
            <section aria-label="Concluídas">
              <h2 className="ff-eyebrow mb-2 text-muted-foreground">Concluídas ({concluidas.length})</h2>
              <ul className="ff-data-list divide-y divide-border border border-border">
                {concluidas.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 p-3.5 text-muted-foreground">
                    <CircleCheck className="h-4 w-4 shrink-0" aria-hidden />
                    <p className="truncate text-sm line-through">{t.titulo}</p>
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
          icon={ListChecks}
          tituloVazio="Nenhuma tarefa registrada"
          descricaoVazio="Crie tarefas para a equipe — com prazo, elas entram na agenda automaticamente."
          action={
            <>
              <Button size="sm" variant="outline" className="ff-meta rounded-lg" onClick={() => setAberto(true)}>
                <Plus className="h-4 w-4" aria-hidden /> Nova tarefa
              </Button>
              {!configured && <IrParaConfiguracao rota="#/executivo/configuracoes" />}
            </>
          }
        />
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="rounded-lg border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="ff-display text-base">Nova tarefa</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {configured ? "Registrada no banco com criador e data." : "Persistência exige configuração do Supabase."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submeter)} className="space-y-4">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ff-meta text-muted-foreground">Tarefa</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-10 rounded-lg border-border bg-secondary" placeholder="Ex.: Editar teaser do cliente" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="prioridade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="ff-meta text-muted-foreground">Prioridade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 rounded-lg border-border bg-secondary">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-lg border-border bg-popover">
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
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
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" size="sm" className="ff-meta rounded-lg" onClick={() => setAberto(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="ff-meta rounded-lg bg-[var(--frame-red)] hover:bg-[#ff1a1a]">
                  Criar tarefa
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

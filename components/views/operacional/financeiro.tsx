"use client";

/**
 * Financeiro — gestão financeira EMPRESARIAL (MVP).
 * Inclui movimentações legítimas com sócios: pró-labore, reembolsos e
 * distribuição de lucros. Eventos financeiros seguem condições contratuais,
 * não a conclusão da entrega.
 */

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, Plus, Wallet } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, IrParaConfiguracao, Kpi, ModuleHeader } from "@/components/common/frame-primitives";
import { useAsyncList, useData } from "@/lib/frameflow/data";
import { useAuth } from "@/lib/frameflow/auth";
import { descreverPrazo, formatarBRL, inputDataParaISO } from "@/lib/frameflow/format";
import { transacaoSchema, type TransacaoForm } from "@/lib/frameflow/schemas";
import { NotConfiguredError, type FinanceCategory, type TransactionKind } from "@/lib/frameflow/types";

const CATEGORIAS: { valor: FinanceCategory; rotulo: string; grupo: string }[] = [
  { valor: "projeto", rotulo: "Projeto", grupo: "Operacional" },
  { valor: "servico", rotulo: "Serviço", grupo: "Operacional" },
  { valor: "prazo_labore", rotulo: "Pró-labore (sócios)", grupo: "Sócios" },
  { valor: "reembolso", rotulo: "Reembolso (sócios)", grupo: "Sócios" },
  { valor: "distribuicao_lucros", rotulo: "Distribuição de lucros", grupo: "Sócios" },
  { valor: "imposto", rotulo: "Impostos", grupo: "Custos" },
  { valor: "equipe", rotulo: "Equipe", grupo: "Custos" },
  { valor: "ferramenta", rotulo: "Ferramentas", grupo: "Custos" },
  { valor: "infraestrutura", rotulo: "Infraestrutura", grupo: "Custos" },
  { valor: "marketing", rotulo: "Marketing", grupo: "Custos" },
  { valor: "produto", rotulo: "Produto", grupo: "Operacional" },
  { valor: "outro", rotulo: "Outro", grupo: "Custos" },
];

export function FinanceiroView({ lens }: { lens: "executivo" | "operacional" }) {
  const { configured } = useAuth();
  const data = useData();
  const { result, loading, reload } = useAsyncList(data.listTransactions);
  const [aberto, setAberto] = useState(false);

  const form = useForm<TransacaoForm>({
    resolver: zodResolver(transacaoSchema),
    defaultValues: { tipo: "entrada", categoria: "servico", descricao: "", valor: "", vencimento: "" },
  });

  async function submeter(valores: TransacaoForm) {
    try {
      await data.createTransaction({
        tipo: valores.tipo,
        categoria: valores.categoria,
        descricao: valores.descricao.trim(),
        valor: Number(valores.valor.replace(",", ".")),
        projetoId: null,
        clienteId: null,
        vencimento: inputDataParaISO(valores.vencimento),
        pago: false,
        metodoPagamento: null,
      });
      toast({ title: "Movimentação registrada", description: "Alertas de vencimento passam a considerar este registro." });
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

  const hoje = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const resumo = useMemo(() => {
    if (!configured || result.reason === "not-configured" || result.reason === "erro") {
      return { pronto: false, entradasAberto: null, saidasAberto: null, vencidas: null };
    }
    const aberto = result.data.filter((t) => !t.pago);
    const entradas = aberto.filter((t) => t.tipo === "entrada").reduce((s, t) => s + t.valor, 0);
    const saidas = aberto.filter((t) => t.tipo === "saida").reduce((s, t) => s + t.valor, 0);
    const vencidas = aberto.filter((t) => new Date(t.vencimento) < hoje).length;
    return { pronto: true, entradasAberto: entradas, saidasAberto: saidas, vencidas };
  }, [configured, result, hoje]);

  const emAberto = result.data.filter((t) => !t.pago);
  const quitadas = result.data.filter((t) => t.pago);

  return (
    <div>
      <ModuleHeader
        eyebrow={lens === "executivo" ? "Executivo · Gestão" : "Operacional · Financeiro"}
        title="Financeiro"
        description="Movimentações empresariais — incluindo pró-labore, reembolsos e distribuição de lucros entre sócios."
        actions={
          <Button size="sm" className="ff-meta rounded-lg bg-[var(--frame-red)] hover:bg-[#ff1a1a]" onClick={() => setAberto(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Nova movimentação
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
        <Kpi label="A receber (em aberto)" valor={resumo.pronto ? formatarBRL(resumo.entradasAberto ?? 0) : "—"} hint={resumo.pronto ? "entradas pendentes" : "aguarda conexão"} pronto={resumo.pronto} destaque />
        <Kpi label="A pagar (em aberto)" valor={resumo.pronto ? formatarBRL(resumo.saidasAberto ?? 0) : "—"} hint={resumo.pronto ? "saídas pendentes" : "aguarda conexão"} pronto={resumo.pronto} />
        <Kpi
          label="Vencidas"
          valor={resumo.pronto ? String(resumo.vencidas ?? 0) : "—"}
          hint={resumo.pronto && resumo.vencidas ? "exigem ação imediata" : !resumo.pronto ? "aguarda conexão" : "nenhuma"}
          pronto={resumo.pronto}
        />
      </div>

      {result.data.length > 0 ? (
        <div className="mt-6 space-y-6">
          {emAberto.length > 0 && (
            <section aria-label="Movimentações em aberto">
              <h2 className="ff-eyebrow mb-2 text-muted-foreground">Em aberto ({emAberto.length})</h2>
              <ul className="ff-data-list divide-y divide-border border border-border">
                {emAberto.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 p-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{t.descricao}</p>
                      <p className="ff-meta text-[9px] text-muted-foreground">
                        {CATEGORIAS.find((c) => c.valor === t.categoria)?.rotulo} · vence {descreverPrazo(t.vencimento)}
                      </p>
                    </div>
                    <span className={`ff-numeric shrink-0 text-sm ${t.tipo === "entrada" ? "text-foreground" : "text-muted-foreground"}`}>
                      {t.tipo === "entrada" ? "+" : "−"}{formatarBRL(t.valor)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {quitadas.length > 0 && (
            <section aria-label="Movimentações quitadas">
              <h2 className="ff-eyebrow mb-2 text-muted-foreground">Quitadas ({quitadas.length})</h2>
              <ul className="ff-data-list divide-y divide-border border border-border">
                {quitadas.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 p-3.5 text-muted-foreground">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <CircleCheck className="h-4 w-4 shrink-0" aria-hidden />
                      <p className="truncate text-sm">{t.descricao}</p>
                    </div>
                    <span className="ff-numeric shrink-0 text-sm">{formatarBRL(t.valor)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            result={result}
            loading={loading}
            icon={Wallet}
            tituloVazio="Nenhuma movimentação registrada"
            descricaoVazio="Registre entradas e saídas — vencimentos alimentam os alertas da Cap automaticamente."
            action={
              <>
                <Button size="sm" variant="outline" className="ff-meta rounded-lg" onClick={() => setAberto(true)}>
                  <Plus className="h-4 w-4" aria-hidden /> Registrar movimentação
                </Button>
                {!configured && <IrParaConfiguracao rota="#/executivo/configuracoes" />}
              </>
            }
          />
        </div>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="rounded-lg border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="ff-display text-base">Nova movimentação</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {configured ? "Valor em centavos no banco, exibido em BRL." : "Persistência exige configuração do Supabase."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submeter)} className="space-y-4">
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ff-meta text-muted-foreground">Descrição</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-10 rounded-lg border-border bg-secondary" placeholder="Ex.: Pagamento parcela 2 — campanha X" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="ff-meta text-muted-foreground">Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 rounded-lg border-border bg-secondary">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-lg border-border bg-popover">
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="saida">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="ff-meta text-muted-foreground">Categoria</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 rounded-lg border-border bg-secondary">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-64 overflow-y-auto rounded-lg border-border bg-popover">
                          {["Operacional", "Sócios", "Custos"].map((grupo) => (
                            <div key={grupo}>
                              <p className="ff-eyebrow bg-secondary/50 px-2 py-1 text-muted-foreground">{grupo}</p>
                              {CATEGORIAS.filter((c) => c.grupo === grupo).map((c) => (
                                <SelectItem key={c.valor} value={c.valor}>{c.rotulo}</SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="ff-meta text-muted-foreground">Valor (R$)</FormLabel>
                      <FormControl>
                        <Input {...field} inputMode="decimal" className="ff-numeric h-10 rounded-lg border-border bg-secondary" placeholder="5000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vencimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="ff-meta text-muted-foreground">Vencimento</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" className="h-10 rounded-lg border-border bg-secondary" />
                      </FormControl>
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
                  Registrar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

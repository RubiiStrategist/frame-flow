"use client";

/**
 * Leads — cadastro, edição de etapa e listagem (MVP comercial).
 * Persistência real via Supabase; sem configuração, o envio informa
 * honestamente que nada foi salvo.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, IrParaConfiguracao, ModuleHeader } from "@/components/common/frame-primitives";
import { useAsyncList, useData } from "@/lib/frameflow/data";
import { useAuth } from "@/lib/frameflow/auth";
import { leadSchema, type LeadForm } from "@/lib/frameflow/schemas";
import { formatarBRL } from "@/lib/frameflow/format";
import type { LeadSource, LeadStage } from "@/lib/frameflow/types";
import { NotConfiguredError } from "@/lib/frameflow/types";

const ESTAGIOS: { valor: LeadStage; rotulo: string }[] = [
  { valor: "novo", rotulo: "Novo" },
  { valor: "contato", rotulo: "Contato feito" },
  { valor: "qualificado", rotulo: "Qualificado" },
  { valor: "proposta", rotulo: "Proposta" },
  { valor: "negociacao", rotulo: "Negociação" },
  { valor: "ganho", rotulo: "Ganho" },
  { valor: "perdido", rotulo: "Perdido" },
];

const ORIGENS: { valor: LeadSource; rotulo: string }[] = [
  { valor: "indicacao", rotulo: "Indicação" },
  { valor: "site", rotulo: "Site" },
  { valor: "instagram", rotulo: "Instagram" },
  { valor: "linkedin", rotulo: "LinkedIn" },
  { valor: "evento", rotulo: "Evento" },
  { valor: "outbound", rotulo: "Outbound" },
  { valor: "outro", rotulo: "Outro" },
];

export function LeadsView() {
  const { configured } = useAuth();
  const data = useData();
  const { result, loading, reload } = useAsyncList(data.listLeads);
  const [aberto, setAberto] = useState(false);

  const form = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      nome: "",
      empresa: "",
      email: "",
      telefone: "",
      origem: "site",
      valorEstimado: "0",
      observacoes: "",
    },
  });

  async function submeter(valores: LeadForm) {
    try {
      await data.createLead({
        nome: valores.nome.trim(),
        empresa: valores.empresa.trim(),
        email: valores.email || null,
        telefone: valores.telefone || null,
        origem: valores.origem,
        etapa: "novo",
        valorEstimado: Number(valores.valorEstimado.replace(",", ".")) || 0,
        responsavelId: null,
        observacoes: valores.observacoes?.trim() || null,
        proximoContato: null,
      });
      toast({ title: "Lead registrado", description: "O lead entrou no funil na etapa Novo." });
      setAberto(false);
      form.reset();
      reload();
    } catch (erro) {
      if (erro instanceof NotConfiguredError) {
        toast({
          title: "Persistência indisponível",
          description: "Configure o Supabase para salvar — nenhum dado foi gravado.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Não foi possível salvar",
          description: erro instanceof Error ? erro.message : "Erro inesperado.",
          variant: "destructive",
        });
      }
    }
  }

  return (
    <div>
      <ModuleHeader
        eyebrow="Comercial · Pipeline"
        title="Leads"
        description="Cadastre e acompanhe leads da FRAME VISION — da origem ao fechamento."
        actions={
          <Button
            size="sm"
            className="ff-meta rounded-lg bg-[var(--frame-red)] hover:bg-[#ff1a1a]"
            onClick={() => setAberto(true)}
          >
            <Plus className="h-4 w-4" aria-hidden /> Novo lead
          </Button>
        }
      />

      {result.reason === "vazio" && result.data.length > 0 ? (
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                {["Lead", "Origem", "Etapa", "Valor estimado", "Próximo passo"].map((h) => (
                  <th key={h} className="ff-eyebrow px-4 py-3 text-left text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {result.data.map((lead) => (
                <tr key={lead.id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <p className="font-medium">{lead.nome}</p>
                    <p className="text-xs text-muted-foreground">{lead.empresa}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ORIGENS.find((o) => o.valor === lead.origem)?.rotulo}
                  </td>
                  <td className="px-4 py-3">
                    <span className="ff-meta rounded-lg border border-border px-2 py-0.5">
                      {ESTAGIOS.find((e) => e.valor === lead.etapa)?.rotulo}
                    </span>
                  </td>
                  <td className="ff-numeric px-4 py-3">{formatarBRL(lead.valorEstimado)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{lead.proximoContato ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          result={result}
          loading={loading}
          icon={Search}
          tituloVazio="Nenhum lead cadastrado"
          descricaoVazio="Registre o primeiro lead — ele entra automaticamente na etapa Novo do funil."
          action={
            <>
              <Button size="sm" variant="outline" className="ff-meta rounded-lg" onClick={() => setAberto(true)}>
                <Plus className="h-4 w-4" aria-hidden /> Cadastrar lead
              </Button>
              {!configured && <IrParaConfiguracao rota="#/executivo/configuracoes" />}
            </>
          }
        />
      )}

      {/* Dialog — novo lead */}
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="ff-display text-base">Novo lead</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {configured
                ? "Salvo diretamente no banco da FRAME FLOW."
                : "Persistência exige configuração do Supabase — o envio não grava nada até isso."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(submeter)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ff-meta text-muted-foreground">Nome do contato</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-10 rounded-lg border-border bg-secondary" placeholder="Como devemos chamar" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="empresa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="ff-meta text-muted-foreground">Empresa</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-10 rounded-lg border-border bg-secondary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="origem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="ff-meta text-muted-foreground">Origem</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 rounded-lg border-border bg-secondary">
                            <SelectValue placeholder="Origem" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-lg border-border bg-popover">
                          {ORIGENS.map((o) => (
                            <SelectItem key={o.valor} value={o.valor}>
                              {o.rotulo}
                            </SelectItem>
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="ff-meta text-muted-foreground">E-mail (opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" className="h-10 rounded-lg border-border bg-secondary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="ff-meta text-muted-foreground">Telefone (opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-10 rounded-lg border-border bg-secondary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="valorEstimado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ff-meta text-muted-foreground">Valor estimado (R$)</FormLabel>
                    <FormControl>
                      <Input {...field} inputMode="decimal" className="ff-numeric h-10 rounded-lg border-border bg-secondary" placeholder="15000" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ff-meta text-muted-foreground">Observações (opcional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} className="rounded-lg border-border bg-secondary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" size="sm" className="ff-meta rounded-lg" onClick={() => setAberto(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="ff-meta rounded-lg bg-[var(--frame-red)] hover:bg-[#ff1a1a]">
                  Registrar lead
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

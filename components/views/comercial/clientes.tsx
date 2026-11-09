"use client";

/**
 * Clientes — cadastro e relacionamento (MVP).
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Handshake, Plus } from "lucide-react";
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
import { formatarData } from "@/lib/frameflow/format";
import { clienteSchema, type ClienteForm } from "@/lib/frameflow/schemas";
import { NotConfiguredError, type ClientSegment } from "@/lib/frameflow/types";

const SEGMENTOS: { valor: ClientSegment; rotulo: string }[] = [
  { valor: "audiovisual", rotulo: "Audiovisual" },
  { valor: "marketing", rotulo: "Marketing" },
  { valor: "estrategia", rotulo: "Estratégia" },
  { valor: "influencia", rotulo: "Influência" },
  { valor: "outro", rotulo: "Outro" },
];

export function ClientesView() {
  const { configured } = useAuth();
  const data = useData();
  const { result, loading, reload } = useAsyncList(data.listClients);
  const [aberto, setAberto] = useState(false);

  const form = useForm<ClienteForm>({
    resolver: zodResolver(clienteSchema),
    defaultValues: { nomeFantasia: "", razaoSocial: "", documento: "", segmento: "audiovisual", site: "", observacoes: "" },
  });

  async function submeter(valores: ClienteForm) {
    try {
      await data.createClient({
        nomeFantasia: valores.nomeFantasia.trim(),
        razaoSocial: valores.razaoSocial?.trim() || null,
        documento: valores.documento?.trim() || null,
        segmento: valores.segmento,
        site: valores.site?.trim() || null,
        contatos: [],
        responsavelComercialId: null,
        observacoes: valores.observacoes?.trim() || null,
      });
      toast({ title: "Cliente registrado", description: "Vincule projetos e propostas a ele." });
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
        toast({ title: "Não foi possível salvar", variant: "destructive" });
      }
    }
  }

  return (
    <div>
      <ModuleHeader
        eyebrow="Comercial · Relacionamento"
        title="Clientes"
        description="Carteira da FRAME VISION — base para projetos, faturamento e o futuro Frame Portal."
        actions={
          <Button size="sm" className="ff-meta rounded-lg bg-[var(--frame-red)] hover:bg-[#ff1a1a]" onClick={() => setAberto(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Novo cliente
          </Button>
        }
      />

      {result.data.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {result.data.map((cliente) => (
            <article key={cliente.id} className="ff-surface border border-border bg-card p-4 transition-colors ff-ease hover:border-white/25">
              <p className="ff-display truncate text-sm">{cliente.nomeFantasia}</p>
              {cliente.razaoSocial && <p className="truncate text-xs text-muted-foreground">{cliente.razaoSocial}</p>}
              <div className="mt-3 flex items-center justify-between">
                <span className="ff-meta rounded-lg border border-border px-2 py-0.5 text-muted-foreground">
                  {SEGMENTOS.find((s) => s.valor === cliente.segmento)?.rotulo}
                </span>
                <span className="text-[10px] text-muted-foreground">desde {formatarData(cliente.createdAt)}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          result={result}
          loading={loading}
          icon={Handshake}
          tituloVazio="Nenhum cliente cadastrado"
          descricaoVazio="Cadastre clientes aqui ou registre o aceite de uma proposta para conectar a venda ao cliente e ao projeto."
          action={
            <>
              <Button size="sm" variant="outline" className="ff-meta rounded-lg" onClick={() => setAberto(true)}>
                <Plus className="h-4 w-4" aria-hidden /> Cadastrar cliente
              </Button>
              {!configured && <IrParaConfiguracao rota="#/executivo/configuracoes" />}
            </>
          }
        />
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="ff-display text-base">Novo cliente</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {configured ? "Salvo no banco com histórico de criação." : "Persistência exige configuração do Supabase."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submeter)} className="space-y-4">
              <FormField
                control={form.control}
                name="nomeFantasia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ff-meta text-muted-foreground">Nome fantasia</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-10 rounded-lg border-border bg-secondary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="segmento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="ff-meta text-muted-foreground">Segmento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 rounded-lg border-border bg-secondary">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-lg border-border bg-popover">
                          {SEGMENTOS.map((s) => (
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
                  name="documento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="ff-meta text-muted-foreground">CNPJ/CPF (opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} className="ff-numeric h-10 rounded-lg border-border bg-secondary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="razaoSocial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="ff-meta text-muted-foreground">Razão social (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-10 rounded-lg border-border bg-secondary" />
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
                  Registrar cliente
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

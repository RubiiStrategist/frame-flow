import { beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * ============================================================================
 * SUÍTE DE INTEGRAÇÃO RLS — FRAME FLOW (Etapa 1.1 · PREPARADA)
 * ============================================================================
 * Executa SOMENTE contra um banco Supabase de TESTE — nunca produção.
 *
 * Pré-requisitos:
 *  1. Projeto Supabase de teste com as 6 migrations de `supabase/migrations`
 *     executadas na ordem (0001 → 0006).
 *  2. Quatro usuários criados em Authentication → Users (convite/senha forte):
 *       - sócio A (cargo ceo)      → TEST_SOCIO_A_EMAIL / TEST_SOCIO_A_PASSWORD
 *       - sócio B (cargo cro)      → TEST_SOCIO_B_EMAIL / TEST_SOCIO_B_PASSWORD
 *       - colaborador (colaborador) → TEST_COLABORADOR_EMAIL / TEST_COLABORADOR_PASSWORD
 *       - cliente externo (cliente) → TEST_CLIENTE_EMAIL / TEST_CLIENTE_PASSWORD
 *     Cargos atribuídos via SQL (bloco SEED_SÓCIOS / update em profiles),
 *     pois o trigger `proteger_cargo` bloqueia elevação pelo cliente.
 *  3. Variáveis de ambiente ANTES de rodar:
 *       SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY  (anon key do projeto de TESTE)
 *       + as credenciais acima.
 *
 * Execução: `bun run test` — sem as variáveis, TODA esta suíte pula
 * automaticamente (describe.skipIf) e é reportada como "skipped".
 *
 * Nota de higiene: registros criados por estes testes (leads/decisões) são
 * removidos ao final de cada caso; eventos em `automacoes` são append-only por
 * design (sem policy de delete) — use um banco de teste descartável.
 * ============================================================================
 */

const TEST_URL = process.env.SUPABASE_TEST_URL ?? "";
const TEST_KEY = process.env.SUPABASE_TEST_ANON_KEY ?? "";
const habilitado = Boolean(TEST_URL && TEST_KEY);

async function clienteComSessao(email: string, senha: string): Promise<SupabaseClient> {
  const client = createClient(TEST_URL, TEST_KEY);
  const { error } = await client.auth.signInWithPassword({ email, password: senha });
  if (error) throw new Error(`Falha ao autenticar ${email}: ${error.message}`);
  return client;
}

describe.skipIf(!habilitado)("Integração RLS — exige banco Supabase de TESTE configurado", () => {
  let socioA: SupabaseClient;
  let socioB: SupabaseClient;
  let colaborador: SupabaseClient;
  let clienteExterno: SupabaseClient;

  beforeAll(async () => {
    socioA = await clienteComSessao(process.env.TEST_SOCIO_A_EMAIL!, process.env.TEST_SOCIO_A_PASSWORD!);
    socioB = await clienteComSessao(process.env.TEST_SOCIO_B_EMAIL!, process.env.TEST_SOCIO_B_PASSWORD!);
    colaborador = await clienteComSessao(process.env.TEST_COLABORADOR_EMAIL!, process.env.TEST_COLABORADOR_PASSWORD!);
    clienteExterno = await clienteComSessao(process.env.TEST_CLIENTE_EMAIL!, process.env.TEST_CLIENTE_PASSWORD!);
  });

  /* ---------- perfis e anti-elevação ---------- */

  it("trigger handle_new_user criou perfil para o sócio autenticado", async () => {
    const uid = (await socioA.auth.getUser()).data.user?.id;
    expect(uid).toBeTruthy();
    const { data } = await socioA.from("profiles").select("id, role").eq("id", uid).maybeSingle();
    expect(data?.role).toBe("ceo");
  });

  it("anti-elevação: usuário autenticado NÃO pode promover o próprio cargo", async () => {
    const uid = (await socioB.auth.getUser()).data.user?.id; // cro tenta virar ceo
    const { error } = await socioB.from("profiles").update({ role: "ceo" }).eq("id", uid);
    expect(error).toBeTruthy();
    expect(error?.message).toContain("Elevação de cargo");
  });

  /* ---------- decisões societárias ---------- */

  it("sócio cria decisão; colaborador lê mas não cria; cliente externo não lê nada", async () => {
    const uidA = (await socioA.auth.getUser()).data.user?.id;
    const { data: decisao, error } = await socioA
      .from("decisoes")
      .insert({ titulo: "TESTE RLS — decisão", descricao: "Criada pela suíte de integração.", solicitante_id: uidA, regra_aprovacao: "maioria" })
      .select("id")
      .single();
    expect(error).toBeNull();
    expect(decisao?.id).toBeTruthy();

    const leituraColab = await colaborador.from("decisoes").select("id").eq("id", decisao!.id);
    expect(leituraColab.data).toHaveLength(1); // interno lê

    const criacaoColab = await colaborador.from("decisoes").insert({
      titulo: "TESTE RLS — indevida", descricao: "Colaborador não abre decisão.", solicitante_id: (await colaborador.auth.getUser()).data.user?.id,
    });
    expect(criacaoColab.error).toBeTruthy(); // policy só permite sócios

    const leituraCliente = await clienteExterno.from("decisoes").select("id").eq("id", decisao!.id);
    expect(leituraCliente.data).toHaveLength(0); // eh_interno() = false

    await socioA.from("decisoes").delete().eq("id", decisao!.id);
  });

  it("votos: cada sócio grava apenas o PRÓPRIO voto (tabela relacional + RLS)", async () => {
    const uidA = (await socioA.auth.getUser()).data.user?.id;
    const uidB = (await socioB.auth.getUser()).data.user?.id;
    const { data: decisao } = await socioA
      .from("decisoes")
      .insert({ titulo: "TESTE RLS — votação", descricao: "Votação da suíte.", solicitante_id: uidA })
      .select("id")
      .single();
    expect(decisao?.id).toBeTruthy();

    // sócio B vota em nome próprio: ok
    const proprio = await socioB.from("decisao_votos").insert({ decisao_id: decisao!.id, socio_id: uidB, voto: "favor" });
    expect(proprio.error).toBeNull();

    // sócio B tenta votar EM NOME DO SÓCIO A: bloqueado pelo WITH CHECK
    const fraudulento = await socioB.from("decisao_votos").insert({ decisao_id: decisao!.id, socio_id: uidA, voto: "contra" });
    expect(fraudulento.error).toBeTruthy();

    // sócio B tenta ALTERAR o voto de A: USING (socio_id = auth.uid()) filtra → 0 linhas
    const { data: alterado, error: erroAlterar } = await socioB
      .from("decisao_votos")
      .update({ voto: "abstencao" })
      .eq("decisao_id", decisao!.id)
      .eq("socio_id", uidA)
      .select("socio_id");
    expect(erroAlterar).toBeNull();
    expect(alterado).toHaveLength(0);

    // leitura conjunta via join: votos integros
    const { data: decisaoComVotos } = await socioA
      .from("decisoes")
      .select("id, decisao_votos(socio_id, voto)")
      .eq("id", decisao!.id)
      .single();
    expect(decisaoComVotos?.decisao_votos).toHaveLength(1);
    expect((decisaoComVotos?.decisao_votos as { socio_id: string }[])[0].socio_id).toBe(uidB);

    await socioA.from("decisoes").delete().eq("id", decisao!.id); // cascade remove votos
  });

  it("histórico de decisão é imune a reescrita manual (trigger proteger_historico)", async () => {
    const uidA = (await socioA.auth.getUser()).data.user?.id;
    const { data: decisao } = await socioA
      .from("decisoes")
      .insert({ titulo: "TESTE RLS — histórico", descricao: "Histórico blindado.", solicitante_id: uidA })
      .select("id")
      .single();
    expect(decisao?.id).toBeTruthy();

    const { error } = await socioA
      .from("decisoes")
      .update({ historico: [{ evento: "falsificado", usuarioId: uidA, detalhe: "tentativa", em: new Date().toISOString() }] })
      .eq("id", decisao!.id);
    expect(error).toBeTruthy();
    expect(error?.message).toContain("histórico");

    // mudança legítima de status continua funcionando (histórico é anexado pelo trigger)
    const ok = await socioA.from("decisoes").update({ status: "cancelada" }).eq("id", decisao!.id);
    expect(ok.error).toBeNull();

    await socioA.from("decisoes").delete().eq("id", decisao!.id);
  });

  /* ---------- financeiro e view security_invoker ---------- */

  it("financeiro interno: sócio lê; cliente externo lê ZERO (tabela e view)", async () => {
    const uidA = (await socioA.auth.getUser()).data.user?.id;
    const { data: tx, error } = await socioA
      .from("transacoes_financeiras")
      .insert({ tipo: "saida", categoria: "prazo_labore", descricao: "TESTE RLS — pró-labore", valor: 100000, vencimento: new Date(Date.now() + 86_400_000).toISOString(), criado_por: uidA })
      .select("id")
      .single();
    expect(error).toBeNull();
    expect(tx?.id).toBeTruthy();

    // interno vê a movimentação e a view de vencimentos
    const visaoA = await socioA.from("vencimentos_em_aberto").select("id").eq("id", tx!.id);
    expect(visaoA.data).toHaveLength(1);

    // cliente externo: tabela e view retornam zero linhas (RLS via security_invoker)
    const tabela = await clienteExterno.from("transacoes_financeiras").select("id").eq("id", tx!.id);
    expect(tabela.data).toHaveLength(0);
    const view = await clienteExterno.from("vencimentos_em_aberto").select("id").eq("id", tx!.id);
    expect(view.data).toHaveLength(0);
    // colaborador interno lê (eh_interno)
    const visaoColab = await colaborador.from("vencimentos_em_aberto").select("id").eq("id", tx!.id);
    expect(visaoColab.data).toHaveLength(1);

    await socioA.from("transacoes_financeiras").delete().eq("id", tx!.id);
  });

  /* ---------- engine: idempotência ---------- */

  it("automação venda_fechada é idempotente: um evento por lead, sem duplicar", async () => {
    const { data: lead, error } = await socioA
      .from("leads")
      .insert({ nome: "TESTE RLS — Lead", empresa: "Empresa de teste", etapa: "ganho", valor_estimado: 500000 })
      .select("id")
      .single();
    expect(error).toBeNull();
    expect(lead?.id).toBeTruthy();

    const contar = async () => {
      const { data } = await socioA.from("automacoes").select("id").eq("entidade_id", lead!.id);
      return data?.length ?? 0;
    };

    // 1) insert direto em 'ganho' dispara 1 evento
    expect(await contar()).toBe(1);

    // 2) update repetido para a MESMA etapa não re-dispara (condição do trigger)
    await socioA.from("leads").update({ etapa: "ganho" }).eq("id", lead!.id);
    expect(await contar()).toBe(1);

    // 3) sair e voltar a 'ganho' re-dispara o gatilho, mas ON CONFLICT impede duplicar
    await socioA.from("leads").update({ etapa: "negociacao" }).eq("id", lead!.id);
    await socioA.from("leads").update({ etapa: "ganho" }).eq("id", lead!.id);
    expect(await contar()).toBe(1);

    await socioA.from("leads").delete().eq("id", lead!.id);
    // (o evento em automacoes é append-only por design — banco de teste descartável)
  });
});

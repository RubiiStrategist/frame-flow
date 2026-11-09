import { z } from "zod";
export type CapRow=Record<string,unknown>;
export interface CapContext {today:string;tasks:CapRow[];projects:CapRow[];leads:CapRow[];transactions:CapRow[];decisions:CapRow[];records:CapRow[]}
export interface CapDraftAction {kind:"create_task"|"complete_task"|"create_outreach"|"create_content";label:string;payload:Record<string,unknown>}
const title=z.string().trim().min(2).max(240);
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>{const d=new Date(`${v}T12:00:00Z`);return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v;});
const actionSchemas={
 create_task:z.object({title,description:z.string().max(4000).default(""),priority:z.enum(["baixa","media","alta"]).default("media"),projectId:z.string().uuid().nullable().default(null),dueDate:date.nullable().default(null)}),
 complete_task:z.object({id:z.string().uuid(),expectedStatus:z.enum(["pendente","em_andamento","bloqueada"])}),
 create_outreach:z.object({title,leadId:z.string().uuid(),dueDate:date,channel:z.string().max(40).default("email"),notes:z.string().max(4000).default("")}),
 create_content:z.object({title,dueDate:date.nullable().default(null),channel:z.string().max(40).default("Instagram"),brief:z.string().max(4000).default("")}),
};
export function validateCapAction(action:CapDraftAction,context:CapContext):CapDraftAction {
 const validator=actionSchemas[action.kind];if(!validator)throw new Error("Ação não suportada.");
 const payload=validator.parse(action.payload) as Record<string,unknown>;
 if(action.kind==="complete_task"&&!context.tasks.some(t=>t.id===payload.id&&t.status===payload.expectedStatus))throw new Error("A tarefa sugerida não está disponível neste estado.");
 if(payload.projectId&&!context.projects.some(p=>p.id===payload.projectId))throw new Error("Projeto não disponível no contexto autorizado.");
 if(action.kind==="create_outreach"&&!context.leads.some(l=>l.id===payload.leadId))throw new Error("Lead não disponível no contexto autorizado.");
 return {kind:action.kind,label:title.parse(action.label),payload};
}
const money=(cents:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(cents/100);
const n=(r:CapRow,key:string)=>Number(r[key]??0);
const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const day=(v:unknown)=>{if(typeof v!=="string")return "";if(/^\d{4}-\d{2}-\d{2}$/.test(v))return v;const parsed=new Date(v);return Number.isFinite(parsed.getTime())?new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(parsed):"";};
export function capMetrics(c:CapContext) {
 const paid=c.transactions.filter(t=>t.pago);const receivables=c.transactions.filter(t=>!t.pago&&t.tipo==="entrada");const payable=c.transactions.filter(t=>!t.pago&&t.tipo==="saida");
 const revenue=paid.filter(t=>t.tipo==="entrada").reduce((s,t)=>s+n(t,"valor"),0);const expenses=paid.filter(t=>t.tipo==="saida").reduce((s,t)=>s+n(t,"valor"),0);
 return {revenue,expenses,balance:revenue-expenses,receivables:receivables.reduce((s,t)=>s+n(t,"valor"),0),payable:payable.reduce((s,t)=>s+n(t,"valor"),0),overdue:c.transactions.filter(t=>!t.pago&&day(t.vencimento)&&day(t.vencimento)<c.today),openTasks:c.tasks.filter(t=>t.status!=="concluida"),openProjects:c.projects.filter(p=>p.status!=="entregue"),openLeads:c.leads.filter(l=>!["ganho","perdido"].includes(String(l.etapa)))};
}
/** Useful deterministic assistance works without an external provider and is explicitly labeled local. */
export function localCapReply(message:string,c:CapContext):{content:string;actions:CapDraftAction[]} {
 const text=normalize(message);const m=capMetrics(c);const actions:CapDraftAction[]=[];
 const taskCommand=message.match(/^\s*criar tarefa\s*:\s*([\s\S]+)$/i);
 if(taskCommand){const taskTitle=taskCommand[1].trim().slice(0,240);return {content:`Preparei a tarefa “${taskTitle}”. Confira e confirme abaixo para salvá-la, atribuída a você.`,actions:[validateCapAction({kind:"create_task",label:`Criar tarefa: ${taskTitle}`.slice(0,240),payload:{title:taskTitle}},c)]};}
 const contentCommand=message.match(/^\s*criar conte[uú]do\s*:\s*([\s\S]+)$/i);
 if(contentCommand){const contentTitle=contentCommand[1].trim().slice(0,240);return {content:`Preparei a ideia “${contentTitle}” para o Frame Content. Ela só será criada quando você confirmar.`,actions:[validateCapAction({kind:"create_content",label:`Criar ideia: ${contentTitle}`.slice(0,240),payload:{title:contentTitle}},c)]};}
 if(text.startsWith("concluir tarefa:")) {
  const name=normalize(message.split(":").slice(1).join(":").trim());const matches=m.openTasks.filter(t=>normalize(String(t.titulo)).includes(name));
  if(!name||matches.length!==1)return {content:matches.length>1?"Encontrei mais de uma tarefa. Informe o título completo depois de “Concluir tarefa:”.":"Não encontrei uma tarefa aberta com esse título.",actions};
  const t=matches[0];return {content:`A tarefa “${t.titulo}” está ${t.status}. Confirme abaixo para concluí-la.`,actions:[validateCapAction({kind:"complete_task",label:`Concluir: ${t.titulo}`.slice(0,240),payload:{id:t.id,expectedStatus:t.status}},c)]};
 }
 if(/financeir|receita|despesa|saldo|caixa/.test(text))return {content:`No conjunto de movimentações registrado:\n• Recebido: ${money(m.revenue)}.\n• Pago: ${money(m.expenses)}.\n• Saldo realizado: ${money(m.balance)}.\n• A receber: ${money(m.receivables)}.\n• A pagar: ${money(m.payable)}.\n• ${m.overdue.length} vencimento(s) em aberto anterior(es) a hoje.\n${m.overdue.slice(0,5).map(t=>`– ${t.descricao}: ${money(n(t,"valor"))}, vencimento ${day(t.vencimento)}.`).join("\n")}\nValores calculados dos registros visíveis à sua conta; previsões não são recebimentos.`,actions};
 if(/prioriz|tarefa|prazo/.test(text)) {
  const tasks=[...m.openTasks].sort((a,b)=>((day(a.prazo)||"9999").localeCompare(day(b.prazo)||"9999"))||(({alta:0,media:1,baixa:2}[String(a.prioridade)]??1)-({alta:0,media:1,baixa:2}[String(b.prioridade)]??1)));
  return {content:tasks.length?`Há ${tasks.length} tarefa(s) aberta(s). Sugiro começar pelos prazos mais próximos:\n${tasks.slice(0,8).map(t=>`• ${t.titulo} — ${t.prioridade}; ${t.prazo?day(t.prazo):"sem prazo"}; ${t.status}.`).join("\n")}\nPara concluir uma delas, escreva “Concluir tarefa: título”.` : "Não há tarefas abertas registradas. Você pode escrever “Criar tarefa: título” para preparar uma nova.",actions};
 }
 if(/comercial|funil|lead|venda/.test(text))return {content:`O funil contém ${c.leads.length} lead(s), sendo ${m.openLeads.length} aberto(s), ${c.leads.filter(l=>l.etapa==="ganho").length} ganho(s) e ${c.leads.filter(l=>l.etapa==="perdido").length} perdido(s). O valor estimado em aberto é ${money(m.openLeads.reduce((s,l)=>s+n(l,"valor_estimado"),0))}.\n${m.openLeads.slice(0,5).map(l=>`• ${l.nome} / ${l.empresa} — ${l.etapa}.`).join("\n")}\nEsse total representa oportunidades, não receita recebida.`,actions};
 if(/\b(?:recomend\w*|proxim\w*|acao|acoes)\b/.test(text)) {
  const recommendations:string[]=[];
  if(m.overdue.length){recommendations.push(`Revisar ${m.overdue.length} vencimento(s) em aberto.`);actions.push({kind:"create_task",label:"Criar tarefa para revisar vencimentos",payload:{title:"Revisar vencimentos financeiros em aberto",description:`Conferir ${m.overdue.length} vencimentos identificados pela Cap em ${c.today}.`,priority:"alta",dueDate:c.today}});}
  const lead=m.openLeads.find(l=>l.proximo_contato&&day(l.proximo_contato)<=c.today);
  if(lead){recommendations.push(`Retomar o contato com ${lead.nome}, de ${lead.empresa}.`);actions.push({kind:"create_outreach",label:`Agendar contato: ${lead.nome}`.slice(0,240),payload:{title:`Retomar contato com ${lead.nome}`.slice(0,240),leadId:lead.id,dueDate:c.today,channel:"email",notes:"Contato sugerido por prazo vencido no lead."}});}
  const blocked=m.openTasks.filter(t=>t.status==="bloqueada");if(blocked.length)recommendations.push(`Rever os bloqueios de ${blocked.length} tarefa(s) antes de assumir novas entregas.`);
  const approvals=c.records.filter(r=>r.kind==="approval"&&r.status==="pendente"&&!r.archived_at);if(approvals.length)recommendations.push(`Acompanhar ${approvals.length} aprovação(ões) de cliente pendente(s).`);
  return {content:recommendations.length?`Com base nos registros atuais:\n${recommendations.map(r=>`• ${r}`).join("\n")}\nAs sugestões abaixo aguardam sua confirmação; nada foi executado.`:"Não identifiquei vencimentos, contatos atrasados, bloqueios ou aprovações pendentes nos dados disponíveis. Cadastre os primeiros registros para receber recomendações contextualizadas.",actions:actions.map(a=>validateCapAction(a,c))};
 }
 return {content:`Resumo da operação em ${c.today}:\n• ${m.openProjects.length} projeto(s) em andamento.\n• ${m.openTasks.length} tarefa(s) aberta(s).\n• ${m.openLeads.length} oportunidade(s) no funil.\n• ${c.decisions.filter(d=>d.status==="aberta").length} decisão(ões) aberta(s).\n• Saldo financeiro realizado: ${money(m.balance)}.\n\nPosso analisar o financeiro, priorizar tarefas, resumir o funil e recomendar próximas ações. Para preparar uma ação, escreva “Criar tarefa: título” ou “Criar conteúdo: título”.`,actions};
}
/** Only summaries/record references are sent to the optional model, never passwords, profile emails or contract bodies. */
export function modelContext(c:CapContext) {
 const m=capMetrics(c);
 return {date:c.today,metrics:{revenue:m.revenue/100,expenses:m.expenses/100,balance:m.balance/100,receivables:m.receivables/100,payable:m.payable/100,overdueCount:m.overdue.length},
  tasks:m.openTasks.slice(0,80).map(t=>({id:t.id,title:t.titulo,status:t.status,priority:t.prioridade,dueDate:day(t.prazo)||null})),
  projects:m.openProjects.slice(0,60).map(p=>({id:p.id,title:p.titulo,status:p.status,dueDate:day(p.data_entrega_prevista)||null})),
  leads:m.openLeads.slice(0,60).map(l=>({id:l.id,name:l.nome,company:l.empresa,stage:l.etapa,value:n(l,"valor_estimado")/100,nextContact:l.proximo_contato})),
  modules:c.records.filter(r=>!r.archived_at&&!['contract','team_member','team_activity'].includes(String(r.kind))).slice(0,80).map(r=>({id:r.id,kind:r.kind,title:r.title,status:r.status,dueDate:r.due_date})),
  totals:{tasks:m.openTasks.length,projects:m.openProjects.length,leads:m.openLeads.length,records:c.records.length},
 };
}

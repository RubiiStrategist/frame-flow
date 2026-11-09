"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { useData } from "./data";
import { useAuth } from "./auth";
import { NotConfiguredError, type Project, type Task, type UserRole, type Client, type Lead } from "./types";
import { mapWorkspaceRecord, recordPayload, type RecordInput, type WorkspaceRecord } from "./workspace-schema";
export type { RecordInput, WorkspaceRecord } from "./workspace-schema";
export { WORKSPACE_KINDS, KIND_LABELS } from "./workspace-schema";
const CHANGED="frameflow:workspace-changed";
function client() { const c=getSupabase(); if(!c) throw new NotConfiguredError(); return c; }
function notify() { if(typeof window!=="undefined") window.dispatchEvent(new Event(CHANGED)); }
function message(error: {message:string;code?:string}|null) {
  if(!error) return;
  if(error.code==="42501") throw new Error("Seu perfil não tem permissão para esta operação.");
  if(error.code==="42P01") throw new Error("A estrutura deste módulo ainda precisa ser instalada no banco.");
  if(error.code==="23503") throw new Error("Um registro vinculado não está mais disponível. Atualize a página.");
  throw new Error(error.message);
}
/** Read every page; never silently truncate a financial/operational aggregate at the API limit. */
export async function listRecords(kinds?: string[]) {
  const c=client(); const records:WorkspaceRecord[]=[];
  for(let from=0;;from+=500) {
    let q=c.from("ff_records").select("*").order("created_at",{ascending:false}).order("id").range(from,from+499);
    if(kinds?.length) q=q.in("kind",kinds);
    const {data,error}=await q; message(error);
    records.push(...(data??[]).map(mapWorkspaceRecord)); if(!data || data.length<500) break;
  }
  return records;
}
export async function saveRecord(input:RecordInput,id?:string,version?:number) {
  const c=client(); const payload=recordPayload(input);
  if(id && !version) throw new Error("Atualize o registro antes de salvar.");
  const q=id?c.from("ff_records").update(payload).eq("id",id).eq("version",version!):c.from("ff_records").insert(payload);
  const {data,error}=await q.select("*").maybeSingle(); message(error);
  if(!data) throw new Error("O registro mudou ou seu acesso foi alterado. Recarregue antes de tentar novamente.");
  notify(); return mapWorkspaceRecord(data);
}
async function setArchive(record:WorkspaceRecord,archived:boolean) {
  const {data,error}=await client().from("ff_records").update({archived_at:archived?new Date().toISOString():null}).eq("id",record.id).eq("version",record.version).select("id").maybeSingle();
  message(error); if(!data) throw new Error("O registro mudou. Recarregue para continuar."); notify();
}
export function useRecords(kinds:string|string[]) {
  const key=JSON.stringify([...new Set(Array.isArray(kinds)?kinds:[kinds])].sort());
  const {session,profile,configured,isPreview}=useAuth();
  const userId=!isPreview?session?.user.id:null;
  const canQuery=Boolean(configured && userId);
  const scope=JSON.stringify([userId??null,profile?.id===userId?profile?.role:null,key]);
  const [state,setState]=useState<{scope:string;records:WorkspaceRecord[];loading:boolean;error:string|null}>(()=>({scope,records:[],loading:canQuery,error:null}));
  const serial=useRef(0);
  const reload=useCallback(async()=>{
    const current=++serial.current;
    if(!canQuery){setState({scope,records:[],loading:false,error:configured?"Entre com sua conta para carregar os registros.":"Conexão necessária para carregar os registros."});return;}
    setState(previous=>({scope,records:previous.scope===scope?previous.records:[],loading:true,error:null}));
    try{const records=await listRecords(JSON.parse(key));if(current===serial.current)setState({scope,records,loading:false,error:null});}
    catch(e){if(current===serial.current)setState({scope,records:[],loading:false,error:e instanceof Error?e.message:"Não foi possível carregar os registros."});}
  },[key,scope,canQuery,configured]);
  useEffect(()=>{let active=true; const refresh=()=>void reload(); void Promise.resolve().then(()=>{if(active)refresh();}); window.addEventListener(CHANGED,refresh);return()=>{active=false;serial.current++;window.removeEventListener(CHANGED,refresh);};},[reload]);
  // Hide the prior account synchronously, even before the new effect has run.
  const visible=state.scope===scope?state:{records:[],loading:canQuery,error:null};
  return {...visible,reload,save:saveRecord,archive:(r:WorkspaceRecord)=>setArchive(r,true),restore:(r:WorkspaceRecord)=>setArchive(r,false)};
}
export async function getRecordHistory(id:string) {
  const {data,error}=await client().from("ff_record_history").select("*").eq("record_id",id).order("version",{ascending:false});message(error);
  return (data??[]).map(r=>({id:String(r.id),recordId:String(r.record_id),version:Number(r.version),snapshot:mapWorkspaceRecord(r.snapshot),createdAt:String(r.created_at),actorId:String(r.actor_id)}));
}
export interface WorkspaceMember {id:string;fullName:string;role:UserRole}
export async function listMembers():Promise<WorkspaceMember[]> {
  const {data,error}=await client().from("profiles").select("id,full_name,role").neq("role","cliente").order("full_name");message(error);
  return (data??[]).map(r=>({id:r.id,fullName:r.full_name,role:r.role}));
}
export function useWorkspaceLinks() {
  const data=useData();
  const {session,profile,configured,isPreview}=useAuth();
  const userId=!isPreview?session?.user.id:null;
  const canQuery=Boolean(configured && userId);
  const scope=JSON.stringify([userId??null,profile?.id===userId?profile?.role:null]);
  const [state,setState]=useState<{scope:string;clients:Client[];projects:Project[];leads:Lead[];members:WorkspaceMember[];loading:boolean;error:string|null}>(()=>({scope,clients:[],projects:[],leads:[],members:[],loading:canQuery,error:null}));
  const serial=useRef(0);
  const reload=useCallback(async()=>{
    const current=++serial.current;
    if(!canQuery){setState({scope,clients:[],projects:[],leads:[],members:[],loading:false,error:configured?"Entre com sua conta para carregar os vínculos.":"Conexão necessária para carregar os vínculos."});return;}
    setState(previous=>previous.scope===scope?{...previous,loading:true,error:null}:{scope,clients:[],projects:[],leads:[],members:[],loading:true,error:null});
    try{const [clients,projects,leads,members]=await Promise.all([data.listClients(),data.listProjects(),data.listLeads(),listMembers()]);const failure=[clients,projects,leads].find(r=>r.reason==="erro"||r.reason==="not-configured");if(failure)throw new Error(failure.error??"Conexão necessária para carregar os vínculos.");if(current===serial.current)setState({scope,clients:clients.data,projects:projects.data,leads:leads.data,members,loading:false,error:null});}
    catch(e){if(current===serial.current)setState({scope,clients:[],projects:[],leads:[],members:[],loading:false,error:e instanceof Error?e.message:"Falha ao carregar vínculos."});}
  },[data,scope,canQuery,configured]);
  useEffect(()=>{let active=true; const refresh=()=>void reload(); void Promise.resolve().then(()=>{if(active)refresh();}); window.addEventListener(CHANGED,refresh);return()=>{active=false;serial.current++;window.removeEventListener(CHANGED,refresh);};},[reload]);
  return useMemo(()=>state.scope===scope?{...state,reload}:{clients:[],projects:[],leads:[],members:[],loading:canQuery,error:null,reload},[state,reload,scope,canQuery]);
}
export async function updateProjectStatus(id:string,status:Project["status"]) {
  const {data,error}=await client().from("projetos").update({status,data_entrega_real:status==="entregue"?new Date().toISOString():null}).eq("id",id).select("id").maybeSingle();message(error);if(!data)throw new Error("Projeto não encontrado ou sem permissão.");notify();
}
export async function updateTaskStatus(id:string,status:Task["status"]) {
  const {data,error}=await client().from("tarefas").update({status,concluida_em:status==="concluida"?new Date().toISOString():null}).eq("id",id).select("id").maybeSingle();message(error);if(!data)throw new Error("Tarefa não encontrada ou sem permissão.");notify();
}
export async function acceptProposal(record:WorkspaceRecord,acceptance:{name:string;email:string;acceptedAt:string;evidence:string}) {
  const {data,error}=await client().rpc("ff_accept_proposal",{proposal_id:record.id,expected_version:record.version,acceptance});message(error);
  if(!data)throw new Error("Não foi possível confirmar a proposta.");notify();return mapWorkspaceRecord(data);
}
export interface ModuleAccess {kind:string;canRead:boolean;canWrite:boolean}
export async function listModuleAccess(userId:string):Promise<ModuleAccess[]> {
  const {data,error}=await client().from("ff_module_access").select("kind,can_read,can_write").eq("user_id",userId);message(error);
  return (data??[]).map(r=>({kind:r.kind,canRead:r.can_read,canWrite:r.can_write}));
}
export async function setModuleAccess(userId:string,kind:string,canRead:boolean,canWrite:boolean) {
  const {error}=await client().from("ff_module_access").upsert({user_id:userId,kind,can_read:canRead||canWrite,can_write:canWrite},{onConflict:"user_id,kind"});message(error);notify();
}
export interface WorkspaceFile {id:string;name:string;projectId:string;clientId:string|null;recordId:string|null;path:string;mime:string;size:number;version:number;createdAt:string;archivedAt:string|null}
function mapFile(r:Record<string,unknown>):WorkspaceFile {return {id:String(r.id),name:String(r.name),projectId:String(r.project_id),clientId:r.client_id as string|null,recordId:r.record_id as string|null,path:String(r.path),mime:String(r.mime),size:Number(r.size),version:Number(r.version),createdAt:String(r.created_at),archivedAt:r.archived_at as string|null};}
export async function listFiles(projectId?:string) {
  const c=client();const files:WorkspaceFile[]=[];
  for(let from=0;;from+=500){
    let q=c.from("ff_files").select("*").order("created_at",{ascending:false}).order("id",{ascending:true}).range(from,from+499);
    if(projectId)q=q.eq("project_id",projectId);
    const {data,error}=await q;message(error);
    files.push(...(data??[]).map(mapFile));if(!data||data.length<500)break;
  }
  return files;
}
export async function uploadFile(file:File,meta:{projectId:string;clientId?:string;recordId?:string;version?:number}) {
  if(!file.size || file.size>50*1024*1024)throw new Error("Escolha um arquivo de até 50 MB.");
  if(!meta.projectId)throw new Error("Selecione o projeto do arquivo.");
  const c=client();const {data:{user},error:authError}=await c.auth.getUser();message(authError);if(!user)throw new Error("Entre novamente para enviar arquivos.");
  const filename=file.name.replace(/[^a-zA-Z0-9._-]/g,"_").slice(-180);const id=crypto.randomUUID();const path=`${meta.projectId}/${user.id}/${id}/${filename}`;
  const {error:uploadError}=await c.storage.from("frameflow-files").upload(path,file,{contentType:file.type||"application/octet-stream",upsert:false});message(uploadError);
  const {data,error}=await c.from("ff_files").insert({id,name:file.name,project_id:meta.projectId,client_id:meta.clientId??null,record_id:meta.recordId??null,path,mime:file.type||"application/octet-stream",size:file.size,version:meta.version??1}).select("*").single();
  if(error){await c.storage.from("frameflow-files").remove([path]);message(error);}
  notify();return mapFile(data!);
}
export async function getFileUrl(file:WorkspaceFile) {const {data,error}=await client().storage.from("frameflow-files").createSignedUrl(file.path,60,{download:file.name});message(error);if(!data)throw new Error("Arquivo indisponível.");return data.signedUrl;}
export async function archiveFile(file:WorkspaceFile) {const {data,error}=await client().from("ff_files").update({archived_at:new Date().toISOString()}).eq("id",file.id).select("id").maybeSingle();message(error);if(!data)throw new Error("Arquivo não encontrado ou sem permissão.");notify();}
export async function restoreFile(file:WorkspaceFile) {const {data,error}=await client().from("ff_files").update({archived_at:null}).eq("id",file.id).select("id").maybeSingle();message(error);if(!data)throw new Error("Arquivo não encontrado ou sem permissão.");notify();}

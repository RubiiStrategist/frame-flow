"use client";
import { useAuth } from '@/lib/frameflow/auth';
import { useAsyncList, useData } from '@/lib/frameflow/data';
import { ExecutiveDashboard } from '@/components/executivo/executive-dashboard';
export function ExecutivoInicio() {
 const {profile}=useAuth(),data=useData();
 const transactions=useAsyncList(data.listTransactions),projects=useAsyncList(data.listProjects),tasks=useAsyncList(data.listTasks),leads=useAsyncList(data.listLeads);
 return <><ExecutiveDashboard name={profile?.fullName} transactions={transactions.result} projects={projects.result} tasks={tasks.result} leads={leads.result}/></>;
}

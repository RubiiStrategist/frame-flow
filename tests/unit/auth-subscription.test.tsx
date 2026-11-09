import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
const state = vi.hoisted(() => ({ listener: null as null | ((event: string, session: Session | null) => unknown), inside: false }));
vi.mock('@/lib/supabase/config', () => ({ isSupabaseConfigured: () => true }));
vi.mock('@/lib/supabase/client', () => ({ getSupabase: () => ({
 auth: { getSession: async () => ({data:{session:null}}), onAuthStateChange: (cb: typeof state.listener) => { state.listener=cb; return {data:{subscription:{unsubscribe:vi.fn()}}}; } },
 from: () => { if(state.inside) throw new Error('Database queried inside auth callback'); return {select:()=>({eq:()=>({maybeSingle:async()=>({data:{id:'user',full_name:'Nome real',role:'ceo'}})})})}; }
}) }));
import { AuthProvider,useAuth } from '@/lib/frameflow/auth';
function Probe(){const auth=useAuth();return <div>{auth.status} {auth.profile?.fullName}</div>;}
describe('auth subscription',()=>{
 it('returns synchronously and loads the profile after leaving the auth callback',async()=>{
  render(<AuthProvider><Probe/></AuthProvider>);
  await waitFor(()=>expect(screen.getByText('visitante')).toBeTruthy());
  const session={user:{id:'user',email:'test@example.test',created_at:'2026-01-01'}} as Session;
  act(()=>{state.inside=true;const result=state.listener!('SIGNED_IN',session);state.inside=false;expect(result).toBeUndefined();});
  await waitFor(()=>expect(screen.getByText('autenticado Nome real')).toBeTruthy());
  act(()=>{state.listener!('SIGNED_OUT',null);});
  expect(screen.getByText('visitante')).toBeTruthy();
 });
});

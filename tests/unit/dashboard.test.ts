import { describe,it,expect } from 'vitest';
import { dashboardSeries,dateKey,projectProgress } from '@/lib/frameflow/dashboard';
import { mapTransaction,mapTask } from '@/lib/frameflow/data';
describe('dashboard executive metrics',()=>{
 it('keeps date-only values and uses São Paulo at midnight UTC',()=>{expect(dateKey('2026-10-01')).toBe('2026-10-01');expect(dateKey('2026-10-01T01:00:00Z')).toBe('2026-09-30');});
 it('aggregates by due month across year boundaries, without inventing cash balance',()=>{const tx=[mapTransaction({tipo:'entrada',valor:10000,vencimento:'2026-01-01'}),mapTransaction({tipo:'saida',valor:2500,vencimento:'2026-01-31'})];const s=dashboardSeries(tx,[],new Date('2026-01-15T12:00:00Z'));expect(s).toHaveLength(6);expect(s[5]).toMatchObject({income:100,expense:25,net:75});expect(s[0].income).toBe(0);});
 it('calculates progress only from project tasks and distinguishes unmeasured from zero',()=>{expect(projectProgress('p',[])).toBeNull();expect(projectProgress('p',[mapTask({projeto_id:'p',status:'pendente'})])).toBe(0);expect(projectProgress('p',[mapTask({projeto_id:'p',status:'concluida'}),mapTask({projeto_id:'p',status:'pendente'}),mapTask({projeto_id:'other',status:'concluida'})])).toBe(50);});
});

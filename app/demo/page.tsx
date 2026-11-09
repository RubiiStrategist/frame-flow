import DemoWorkspace from './demo-workspace';
// One request-time clock snapshot keeps SSR and browser rendering consistent.
export const dynamic = 'force-dynamic';
export default function DemoPage() {
 return <DemoWorkspace nowISO={new Date().toISOString()} />;
}

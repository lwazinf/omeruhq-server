import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { platformMode } from '@/lib/mode';
import CrShell from '@/components/CrShell';

export default async function SectionLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  return (
    <CrShell name={session.name} isRoot={session.is_root} mode={platformMode()}>
      {children}
    </CrShell>
  );
}

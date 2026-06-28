import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import LandingPage from '@/components/LandingPage';

export default async function Root() {
  const session = await getSession();
  if (session) redirect('/dashboard');
  return <LandingPage />;
}

import { redirect } from 'next/navigation';

export default async function StartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}?invite=1`);
}

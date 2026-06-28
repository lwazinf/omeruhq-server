import { redirect } from 'next/navigation';

export default function StartPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}?invite=1`);
}

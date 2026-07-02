import { put } from '@vercel/blob';
import { getSession } from '@/lib/auth';

export async function POST(request: Request): Promise<Response> {
  const session = await getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
  if (!filename) return new Response('filename required', { status: 400 });

  const blob = await put(`products/${session.merchant_id}/${Date.now()}-${filename}`, request.body!, {
    access: 'public',
  });

  return Response.json(blob);
}

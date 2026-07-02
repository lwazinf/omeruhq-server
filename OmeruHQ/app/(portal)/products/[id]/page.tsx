import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { updateProductAction } from '../actions';
import DeleteProductButton from './DeleteProductButton';
import ProductImageUpload from '../ProductImageUpload';

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.45)',
  marginBottom: 6,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;

  const product = await db.product.findUnique({
    where: { id },
    select: { id: true, name: true, description: true, price: true, image_url: true, merchant_id: true },
  });

  if (!product || product.merchant_id !== session.merchant_id) notFound();

  return (
    <div style={{ padding: '32px 36px', maxWidth: 620, animation: 'slideUp 0.22s ease' }}>

      <div style={{ marginBottom: 32 }}>
        <Link
          href="/products"
          style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 16 }}
        >
          ← Products
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', color: 'white', margin: 0 }}>
          Edit product
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 5 }}>
          {product.name}
        </p>
      </div>

      <form action={updateProductAction}>
        <input type="hidden" name="id" value={product.id} />

        <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

          <ProductImageUpload currentUrl={product.image_url} />

          <div>
            <label style={labelStyle}>Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input name="name" required defaultValue={product.name} placeholder="e.g. Grilled Chicken Wrap" className="input" />
          </div>

          <div>
            <label style={labelStyle}>Price (ZAR) <span style={{ color: '#ef4444' }}>*</span></label>
            <input name="price" type="number" step="0.01" min="0" required defaultValue={product.price} placeholder="85.00" className="input" />
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea name="description" rows={3} defaultValue={product.description ?? ''} placeholder="Brief description shown to customers…" className="input" style={{ resize: 'vertical' }} />
          </div>

        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
          <button type="submit" className="btn-lime" style={{ flex: 1, justifyContent: 'center', padding: '12px 24px', fontSize: 14, minWidth: 140 }}>
            Save changes
          </button>
          <Link href="/products" className="btn-ghost" style={{ padding: '12px 20px', textDecoration: 'none', fontSize: 14 }}>
            Cancel
          </Link>
          <div style={{ marginLeft: 'auto' }}>
            <DeleteProductButton productId={product.id} />
          </div>
        </div>
      </form>
    </div>
  );
}

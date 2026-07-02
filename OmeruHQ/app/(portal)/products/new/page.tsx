import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { createProductAction } from '../actions';
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

export default async function NewProductPage() {
  const session = await getSession();
  if (!session) redirect('/login');

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
          Add product
        </h1>
      </div>

      <form action={createProductAction}>
        <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

          <ProductImageUpload />

          <div>
            <label style={labelStyle}>Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input name="name" required placeholder="e.g. Grilled Chicken Wrap" className="input" />
          </div>

          <div>
            <label style={labelStyle}>Price (ZAR) <span style={{ color: '#ef4444' }}>*</span></label>
            <input name="price" type="number" step="0.01" min="0" required placeholder="85.00" className="input" />
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea name="description" rows={3} placeholder="Brief description shown to customers…" className="input" style={{ resize: 'vertical' }} />
          </div>

        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button type="submit" className="btn-lime" style={{ flex: 1, justifyContent: 'center', padding: '12px 24px', fontSize: 14 }}>
            Add product
          </button>
          <Link href="/products" className="btn-ghost" style={{ padding: '12px 20px', textDecoration: 'none', fontSize: 14 }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

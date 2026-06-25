import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { createProductAction } from '../actions';

export default async function NewProductPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div style={{ padding: '32px 36px', maxWidth: 640 }}>
      <div style={{ marginBottom: 32 }}>
        <Link href="/products" style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          ← Products
        </Link>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.015em' }}>Add product</div>
      </div>

      <form action={createProductAction}>
        <div className="card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                NAME <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input name="name" required placeholder="e.g. Grilled Chicken Wrap" className="input" style={{ width: '100%' }} />
            </div>

            <div>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                PRICE (ZAR) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input name="price" type="number" step="0.01" min="0" required placeholder="85.00" className="input" style={{ width: '100%' }} />
            </div>

            <div>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                DESCRIPTION
              </label>
              <textarea name="description" rows={3} placeholder="Brief description shown to customers..." className="input" style={{ width: '100%', resize: 'vertical' }} />
            </div>

            <div>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                IMAGE URL
              </label>
              <input name="image_url" type="url" placeholder="https://..." className="input" style={{ width: '100%' }} />
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--mid-gray)', marginTop: 5 }}>Paste a hosted image URL (Supabase storage recommended)</div>
            </div>
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

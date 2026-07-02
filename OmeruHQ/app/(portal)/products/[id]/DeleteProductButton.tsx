'use client';

import { deleteProductAction } from '../actions';

export default function DeleteProductButton({ productId }: { productId: string }) {
  return (
    <form action={deleteProductAction}>
      <input type="hidden" name="id" value={productId} />
      <button
        type="submit"
        className="btn-ghost"
        style={{ fontSize: 13, padding: '12px 16px', color: 'rgba(239,68,68,0.65)' }}
        onClick={(e) => {
          if (!window.confirm('Delete this product? This cannot be undone.')) e.preventDefault();
        }}
      >
        Delete product
      </button>
    </form>
  );
}

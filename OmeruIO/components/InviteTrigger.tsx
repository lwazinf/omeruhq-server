'use client';

export default function InviteTrigger({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      className={className}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', ...style }}
      onClick={() => window.dispatchEvent(new CustomEvent('omeru:invite'))}
    >
      {children}
    </button>
  );
}

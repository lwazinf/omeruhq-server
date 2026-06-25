'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { routing } from '@/i18n/routing';

const labels: Record<string, string> = { en: 'EN', af: 'AF', zu: 'ZU' };

export default function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(next: string) {
    const segments = pathname.split('/').filter(Boolean);
    if (routing.locales.includes(segments[0] as (typeof routing.locales)[number])) {
      segments[0] = next === routing.defaultLocale ? '' : next;
    } else {
      if (next !== routing.defaultLocale) segments.unshift(next);
    }
    const newPath = '/' + segments.filter(Boolean).join('/');
    router.push(newPath || '/');
  }

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {routing.locales.map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            border: 'none',
            cursor: 'pointer',
            background: locale === l ? 'var(--black)' : 'transparent',
            color: locale === l ? 'white' : 'var(--mid-gray)',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {labels[l]}
        </button>
      ))}
    </div>
  );
}

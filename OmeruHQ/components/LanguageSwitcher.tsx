'use client';

import { useLocale, useTranslations } from 'next-intl';

const locales = ['en', 'af'] as const;
const labels: Record<string, string> = { en: 'EN', af: 'AF' };

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();
  const t = useTranslations('LanguageSwitcher');

  function setLocale(next: string) {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  }

  if (compact) {
    return (
      <div style={{ display: 'flex', gap: 2 }}>
        {locales.map((l) => (
          <button
            key={l}
            onClick={() => setLocale(l)}
            title={t(l)}
            style={{
              padding: '3px 7px', borderRadius: 5, fontSize: 10,
              fontWeight: 700, letterSpacing: '0.06em',
              border: 'none', cursor: 'pointer',
              background: locale === l ? 'rgba(200,241,53,0.15)' : 'transparent',
              color: locale === l ? 'var(--lime)' : 'rgba(255,255,255,0.3)',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {labels[l]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: 'var(--mid-gray)', fontWeight: 500 }}>{t('language')}:</span>
      <div style={{ display: 'flex', gap: 2 }}>
        {locales.map((l) => (
          <button
            key={l}
            onClick={() => setLocale(l)}
            title={t(l)}
            style={{
              padding: '5px 10px', borderRadius: 7, fontSize: 11,
              fontWeight: 700, letterSpacing: '0.06em',
              border: '1px solid',
              borderColor: locale === l ? 'rgba(0,0,0,0.15)' : 'transparent',
              cursor: 'pointer',
              background: locale === l ? 'var(--black)' : 'transparent',
              color: locale === l ? 'white' : 'var(--mid-gray)',
              transition: 'background 0.15s, color 0.15s, border-color 0.15s',
            }}
          >
            {t(l)}
          </button>
        ))}
      </div>
    </div>
  );
}

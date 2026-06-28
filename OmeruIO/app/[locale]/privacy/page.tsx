'use client';

import dynamic from 'next/dynamic';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

const SmoothScroll = dynamic(() => import('@/components/SmoothScroll'), { ssr: false });
const CustomCursor = dynamic(() => import('@/components/CustomCursor'), { ssr: false });


export default function PrivacyPage() {
  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const lenis = (window as unknown as Record<string, unknown>).__lenis as { scrollTo?: (el: Element, opts: Record<string, unknown>) => void } | undefined;
    if (lenis?.scrollTo) {
      lenis.scrollTo(el, { offset: -96, duration: 1.4 });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <SmoothScroll>
      <div style={{ overflowX: 'hidden' }}>
      <div className="noise" />
      <CustomCursor />
      <Nav darkHero />

      {/* Page hero — dark */}
      <div style={{ paddingTop: 'clamp(96px, 14vh, 128px)', paddingBottom: 'clamp(40px, 8vw, 72px)', background: 'var(--black)', position: 'relative', overflow: 'hidden' }}>
        {/* Tile texture */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: "url('/bg-tile.jpg')", backgroundSize: '500px 333px', backgroundRepeat: 'repeat', mixBlendMode: 'screen', filter: 'invert(1)', opacity: 0.08 }} />
        {/* Lime glow */}
        <div style={{ position: 'absolute', bottom: '-60%', left: '10%', width: '50%', height: '120%', background: 'radial-gradient(ellipse at center, rgba(200,241,53,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <span className="pill" style={{ marginBottom: 20, background: 'rgba(200,241,53,0.12)', color: 'var(--lime)', borderColor: 'rgba(200,241,53,0.2)' }}>Legal</span>
          <h1 className="display-md" style={{ marginTop: 16, marginBottom: 12, color: 'white', wordBreak: 'break-word', overflowWrap: 'break-word' }}>Privacy Policy</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', fontWeight: 300, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            Last updated <strong style={{ fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>22 June 2026</strong>
            &nbsp;·&nbsp;REMOLUHLE (PTY) Ltd. trading as Omeru
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="container" style={{ paddingTop: 'clamp(32px, 6vw, 64px)', paddingBottom: 120 }}>
        <div className="privacy-layout">

          {/* Sticky TOC */}
          <aside style={{ position: 'sticky', top: 100 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: 16 }}>Contents</p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="toc-link"
                  onClick={e => { e.preventDefault(); scrollTo(s.id); }}
                >{s.label}</a>
              ))}
            </nav>

            <div className="divider" style={{ margin: '28px 0' }} />

            <div style={{ background: 'var(--black)', borderRadius: 16, padding: '18px 16px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>Questions?</p>
              <a href="mailto:hello@omeru.io" style={{ fontSize: 13, color: 'var(--lime)', textDecoration: 'none', fontWeight: 500 }}>hello@omeru.io</a>
            </div>
          </aside>

          {/* Article */}
          <article>

            <Lead>
              This Privacy Notice for <strong>REMOLUHLE (PTY) Ltd.</strong>, trading as <strong>Omeru</strong> ("we", "us", "our"), describes how and why we collect, store, use, and share your personal information when you use our Services — including hq.omeru.io and our WhatsApp commerce platform that enables South African merchants to sell without requiring customers to download an app.
            </Lead>

            <Card accent>
              <Row label="Information Officer (POPIA)" value="Lwazi Ndlovu" />
              <Row label="Email" value={<a href="mailto:hello@omeru.io">hello@omeru.io</a>} last />
            </Card>

            <Sep />

            {/* 1 */}
            <SectionHead id="collect" n="01" title="What information do we collect?" />

            <H3>Information you provide directly</H3>
            <Body>We collect personal information you voluntarily provide when you register, apply as a merchant, contact us, or interact with our Services:</Body>
            <Bullets items={['Full name', 'Phone number', 'Email address', 'Business name and job title', 'Username and password', 'Business and identity documents (KYC for merchants)', 'WhatsApp order and transaction details']} />
            <Body><strong>Sensitive information:</strong> We do not process sensitive personal information (race, religion, health, sexual orientation, etc.).</Body>

            <H3>Information collected automatically</H3>
            <Body>When you visit our website, we automatically collect:</Body>
            <Bullets items={[
              'IP address and approximate location (country/city)',
              'Browser type, device, and operating system',
              'Referring URLs and exit pages',
              'Pages viewed, time spent, and actions taken',
              'Date and time of visits',
              'Crash reports and performance data',
            ]} />

            <Sep />

            {/* 2 */}
            <SectionHead id="process" n="02" title="How do we process your information?" />
            <Body>We process your personal information only when we have a valid legal basis under POPIA:</Body>
            <Bullets items={[
              'Facilitate account creation, authentication, and account management',
              'Deliver WhatsApp commerce services to merchants and their customers',
              'Process and fulfil orders, payments, and refunds',
              'Respond to support requests and enquiries',
              'Enable communication between merchants and customers',
              'Measure and improve our Services through analytics',
              'Deliver and measure the effectiveness of our advertising campaigns',
              'Prevent fraud, abuse, and security threats',
              'Comply with POPIA, FICA, SARS, and other South African legal obligations',
            ]} />

            <Sep />

            {/* 3 */}
            <SectionHead id="share" n="03" title="Who do we share your information with?" />
            <Body>We do not sell your personal information. We share data only with the following parties, each bound by data processing agreements:</Body>

            <DataTable
              headers={['Party', 'Purpose', 'Location']}
              rows={[
                ['Google LLC', 'Analytics (GA4) and advertising (Google Ads remarketing)', 'USA — SCCs apply'],
                ['Meta Platforms, Inc.', 'Advertising and remarketing via Meta Pixel (Facebook/Instagram)', 'USA — SCCs apply'],
                ['Meta / WhatsApp Business API', 'WhatsApp commerce messages and order flows', 'USA — SCCs apply'],
                [<a key="stitch" href="https://stitch.money/express" target="_blank" rel="noopener noreferrer">Stitch Money</a>, 'Instant EFT payment processing', 'South Africa'],
                ['Cloud infrastructure provider', 'Secure database hosting', 'EU-West'],
                ['Cloud storage provider', 'Merchant media and image storage', 'EU region'],
              ]}
            />

            <Body>We may also share information where required by South African law, court order, or during a merger or acquisition.</Body>

            <Card>
              <strong style={{ fontSize: 14, color: 'var(--black)' }}>No PII in tracking tags</strong>
              <Body style={{ marginTop: 8, marginBottom: 0 }}>We do not pass personally identifiable information (email addresses, phone numbers, or names) through Google Ads tags, Meta Pixel, or any other third-party tracking technology, except under explicit Enhanced Conversions or Customer Match consent.</Body>
            </Card>

            <Sep />

            {/* 4 */}
            <SectionHead id="advertising" n="04" title="Advertising, remarketing & tracking" />

            <Card accent>
              <strong style={{ fontSize: 13, color: 'var(--lime-dark)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Google Ads policy disclosure</strong>
              <Body style={{ marginTop: 8, marginBottom: 0, fontSize: 14 }}>This section satisfies mandatory Google Ads and Meta advertising policy disclosure requirements for remarketing and interest-based advertising.</Body>
            </Card>

            <H3>What we do</H3>
            <Body>We use <strong>Google Ads remarketing</strong> and <strong>Meta Pixel</strong> to advertise to people who have previously visited hq.omeru.io. This means:</Body>
            <Bullets items={[
              'Third-party vendors, including Google and Meta, use cookies and/or device identifiers to serve our ads on websites and apps across the internet, based on your past visits to our site.',
              'Google may show our ads on Google Display Network, Google Search, and YouTube.',
              'Meta may show our ads on Facebook, Instagram, and their partner network.',
              'These ads are targeted using remarketing lists (data segments) built from visitors to hq.omeru.io.',
              'We do not use sensitive categories (health, race, religion, etc.) to target any ads.',
            ]} />

            <H3>Google Consent Mode v2</H3>
            <Body>We have implemented <strong>Google Consent Mode v2 (Advanced Mode)</strong>. Until you accept cookies via our consent banner, Google tags operate in a cookieless, privacy-safe mode — no personal identifiers are sent to Google. Full measurement activates only after your explicit consent. This applies to Google Analytics 4, Google Ads conversion tracking, and remarketing tags.</Body>

            <H3>Opt out of personalised advertising</H3>
            <DataTable
              headers={['Platform', 'Opt-out link']}
              rows={[
                ['Google Ads personalisation', 'adssettings.google.com'],
                ['Google Analytics', 'tools.google.com/dlpage/gaoptout'],
                ['Meta / Facebook ads', 'facebook.com/settings/?tab=ads'],
                ['Network Advertising Initiative', 'optout.networkadvertising.org'],
                ['Digital Advertising Alliance', 'optout.aboutads.info'],
              ]}
              linkCol={1}
              linkPrefix="https://"
            />
            <Body>Opting out means you will no longer see personalised ads from us, but you may still see generic non-targeted advertising.</Body>

            <Sep />

            {/* 5 */}
            <SectionHead id="cookies" n="05" title="Cookie table" />
            <Body>All non-essential cookies are only activated after you accept via our consent banner.</Body>

            <CookieTable />

            <Body>You can control cookies through your browser settings, though disabling cookies may affect site functionality. Use the opt-out links in Section 4 to disable advertising cookies specifically.</Body>

            <Sep />

            {/* 6 */}
            <SectionHead id="social" n="06" title="Social media logins" />
            <Body>Our Services may offer registration or login via third-party social media accounts (Facebook, X/Twitter, etc.). If you use this feature, the provider may share your name, email, and profile picture with us. We use this only to create or manage your account and are not responsible for how the social media provider handles your data — please review their privacy policy separately.</Body>

            <Sep />

            {/* 7 */}
            <SectionHead id="retention" n="07" title="How long do we keep your information?" />
            <Body>We keep personal information only as long as necessary for the purposes described in this notice, or as required by South African law:</Body>

            <DataTable
              headers={['Data type', 'Retention period', 'Reason']}
              rows={[
                ['Analytics data', '14 months', 'Google Analytics default'],
                ['Account data', 'Duration of account + 12 months', 'Service delivery'],
                ['Order & transaction records', '5 years from last transaction', 'SARS record-keeping'],
                ['KYC / merchant identity records', '5 years from offboarding', 'FICA requirements'],
                ['WhatsApp message logs', '12 months', 'Support and fraud prevention'],
                ['Cookie consent records', '1 year', 'POPIA accountability'],
              ]}
            />

            <Body>When retention periods expire, data is securely deleted or anonymised. Data in backup archives is isolated from active processing until deletion is possible.</Body>

            <Sep />

            {/* 8 */}
            <SectionHead id="security" n="08" title="How do we keep your information safe?" />
            <Bullets items={[
              'All data transmission is encrypted via TLS/SSL — our website runs exclusively over HTTPS',
              'Database encryption at rest using industry-standard encryption',
              'Role-based access controls — staff access only the data their role requires',
              'Regular security reviews and dependency audits',
              'No sensitive payment data (card numbers, bank details) is stored on Omeru systems — this passes directly to Stitch Money via their secure gateway',
            ]} />
            <Body>No system is 100% secure. In the event of a data breach affecting your rights, we will notify you and the Information Regulator as required by POPIA Section 22.</Body>

            <Sep />

            {/* 9 */}
            <SectionHead id="minors" n="09" title="Children and minors" />
            <Body>Our Services are not directed at persons under 18. We do not knowingly collect personal information from minors. If you believe we hold data about a minor, contact <a href="mailto:hello@omeru.io">hello@omeru.io</a> and we will immediately delete it.</Body>

            <Sep />

            {/* 10 */}
            <SectionHead id="rights" n="10" title="Your privacy rights" />
            <Body>Under POPIA and applicable South African law, you have the right to:</Body>
            <Bullets items={[
              <><strong>Access</strong> — request a copy of the personal information we hold about you</>,
              <><strong>Correct</strong> — request correction of inaccurate or incomplete data</>,
              <><strong>Delete</strong> — request deletion of your data (subject to legal retention obligations)</>,
              <><strong>Object</strong> — object to processing based on legitimate interests, including direct marketing</>,
              <><strong>Withdraw consent</strong> — withdraw consent for consent-based processing at any time</>,
              <><strong>Portability</strong> — request your data in a structured, machine-readable format where feasible</>,
              <><strong>Lodge a complaint</strong> — with the Information Regulator of South Africa (see Section 12)</>,
            ]} />
            <Body>To exercise any of these rights, email <a href="mailto:hello@omeru.io">hello@omeru.io</a> with subject line <strong>"Data Subject Request"</strong>. We will respond within 30 days and may require proof of identity.</Body>

            <Sep />

            {/* 11 */}
            <SectionHead id="dnt" n="11" title="Do-Not-Track signals" />
            <Body>Most browsers include a Do-Not-Track ("DNT") feature. No universal technical standard for DNT has been adopted, so we do not currently alter our data collection in response to DNT signals. If a binding standard is adopted in South Africa or internationally, we will update this notice.</Body>

            <Sep />

            {/* 12 */}
            <SectionHead id="popia" n="12" title="South Africa — POPIA rights" />
            <Body>South Africa&apos;s <strong>Protection of Personal Information Act 4 of 2013 (POPIA)</strong> grants you the right to request access to or correction of your personal information at any time. If you are unsatisfied with our handling of a complaint, you may escalate to:</Body>

            <Card>
              <strong style={{ display: 'block', marginBottom: 12, fontFamily: 'var(--font-display)', fontSize: 15 }}>The Information Regulator (South Africa)</strong>
              <Row label="General enquiries" value={<a href="mailto:enquiries@inforegulator.org.za">enquiries@inforegulator.org.za</a>} />
              <Row label="PAIA complaints" value={<a href="mailto:PAIAComplaints@inforegulator.org.za">PAIAComplaints@inforegulator.org.za</a>} />
              <Row label="POPIA complaints" value={<a href="mailto:POPIAComplaints@inforegulator.org.za">POPIAComplaints@inforegulator.org.za</a>} />
              <Row label="Website" value={<a href="https://www.justice.gov.za/inforeg" target="_blank" rel="noopener noreferrer">www.justice.gov.za/inforeg</a>} last />
            </Card>

            <Sep />

            {/* 13 */}
            <SectionHead id="updates" n="13" title="Updates to this notice" />
            <Body>We may update this Privacy Notice from time to time. The "Last updated" date at the top always reflects the most recent version. For material changes, we will notify affected users directly or via a prominent notice on our site.</Body>

            <Sep />

            {/* 14 */}
            <SectionHead id="contact" n="14" title="Contact us" />

            <Card>
              <strong style={{ display: 'block', marginBottom: 12, fontFamily: 'var(--font-display)', fontSize: 15 }}>REMOLUHLE (PTY) Ltd. trading as Omeru</strong>
              <Row label="Information Officer" value="Lwazi Ndlovu" />
              <Row label="Email" value={<a href="mailto:hello@omeru.io">hello@omeru.io</a>} last />
            </Card>

            <Sep />

            {/* 15 */}
            <SectionHead id="access" n="15" title="Data requests (DSAR)" />
            <Body>To request access to, correction of, or deletion of your personal information, or to withdraw consent, submit a <strong>Data Subject Access Request</strong> by emailing <a href="mailto:hello@omeru.io">hello@omeru.io</a> with the subject line <strong>"DSAR"</strong>, your full name, and a description of your request. We will acknowledge within 3 business days and respond in full within 30 days.</Body>

            {/* Footer note */}
            <div style={{ marginTop: 56, padding: '16px 20px', borderRadius: 12, background: 'var(--warm-gray)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 12, color: 'var(--mid-gray)', margin: 0, lineHeight: 1.7, fontWeight: 300 }}>
                This Privacy Policy was drafted using the Termly Privacy Policy Generator as a base and customised for REMOLUHLE (PTY) Ltd. trading as Omeru, in compliance with the <strong style={{ fontWeight: 500, color: 'var(--dark-gray)' }}>Protection of Personal Information Act, 2013 (POPIA)</strong>, <strong style={{ fontWeight: 500, color: 'var(--dark-gray)' }}>Google Ads advertising policies</strong>, <strong style={{ fontWeight: 500, color: 'var(--dark-gray)' }}>Google Consent Mode v2</strong>, and <strong style={{ fontWeight: 500, color: 'var(--dark-gray)' }}>Meta advertising data use requirements</strong>.
              </p>
            </div>

          </article>
        </div>
      </div>

      <Footer />
      </div>

      <style>{`
        .privacy-layout {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 64px;
          align-items: start;
        }
        @media (max-width: 860px) {
          .privacy-layout { grid-template-columns: 1fr; gap: 0; }
          .privacy-layout article { min-width: 0; }
          aside { display: none; }
        }
        .toc-link {
          display: block;
          font-size: 12px;
          color: var(--mid-gray);
          text-decoration: none;
          line-height: 1.5;
          padding: 5px 0;
          border-bottom: 1px solid rgba(0,0,0,0.05);
          transition: color 0.15s;
          font-weight: 300;
        }
        .toc-link:hover { color: var(--black); }
        article a { color: var(--black); font-weight: 500; text-underline-offset: 3px; }
        article a:hover { color: var(--lime-dark); }
        @media (max-width: 768px) {
          .privacy-layout article h2,
          .privacy-layout article h3 { word-break: break-word; overflow-wrap: break-word; }
          .privacy-layout article p,
          .privacy-layout article li { word-break: break-word; overflow-wrap: break-word; }
        }
      `}</style>
    </SmoothScroll>
  );
}

/* ── Design-system-aligned sub-components ── */

function SectionHead({ id, n, title }: { id: string; n: string; title: string }) {
  return (
    <div id={id} style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 20, scrollMarginTop: 96 }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--lime-dark)', letterSpacing: '0.04em', flexShrink: 0 }}>{n}</span>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px, 2.2vw, 24px)', fontWeight: 700, color: 'var(--black)', letterSpacing: '-0.02em', lineHeight: 1.1, margin: 0 }}>{title}</h2>
    </div>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--black)', margin: '20px 0 8px', letterSpacing: '-0.01em' }}>{children}</h3>;
}

function Lead({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 16, color: 'var(--dark-gray)', lineHeight: 1.75, fontWeight: 300, marginBottom: 24 }}>{children}</p>;
}

function Body({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ fontSize: 14, color: 'var(--dark-gray)', lineHeight: 1.8, fontWeight: 300, margin: '0 0 14px', ...style }}>{children}</p>;
}

function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ paddingLeft: 18, margin: '0 0 16px' }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 14, color: 'var(--dark-gray)', lineHeight: 1.8, marginBottom: 6, fontWeight: 300 }}>{item}</li>
      ))}
    </ul>
  );
}

function Sep() {
  return <div className="divider" style={{ margin: '40px 0' }} />;
}

function Card({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div className="card" style={{
      padding: '20px 22px',
      marginBottom: 18,
      background: accent ? 'rgba(200,241,53,0.06)' : 'white',
      border: accent ? '1px solid rgba(200,241,53,0.3)' : '1px solid rgba(0,0,0,0.06)',
      borderRadius: 16,
    }}>
      {children}
    </div>
  );
}

function Row({ label, value, last }: { label: string; value: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: last ? 'none' : '1px solid rgba(0,0,0,0.06)', alignItems: 'baseline', flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--mid-gray)', letterSpacing: '0.04em', textTransform: 'uppercase', minWidth: 130, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--dark-gray)', fontWeight: 300, flex: 1 }}>{value}</span>
    </div>
  );
}

function DataTable({ headers, rows, linkCol, linkPrefix }: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
  linkCol?: number;
  linkPrefix?: string;
}) {
  return (
    <div className="card" style={{ padding: 0, marginBottom: 16, borderRadius: 16, overflowX: 'auto', overflowY: 'hidden' }}>
      <table style={{ width: '100%', minWidth: 480, borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
            {headers.map(h => (
              <th key={h} style={{ padding: '11px 16px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--black)', fontSize: 12, letterSpacing: '-0.01em', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '10px 16px', color: j === 0 ? 'var(--black)' : 'var(--dark-gray)', fontWeight: j === 0 ? 500 : 300, lineHeight: 1.5 }}>
                  {linkCol === j && linkPrefix && typeof cell === 'string'
                    ? <a href={`${linkPrefix}${cell}`} target="_blank" rel="noopener noreferrer">{cell}</a>
                    : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CookieTable() {
  const cookies = [
    { name: 'omeru_consent_v1', provider: 'Omeru', purpose: 'Stores your cookie consent preference', duration: '1 year', type: 'Essential' },
    { name: '_ga', provider: 'Google Analytics', purpose: 'Distinguishes unique visitors', duration: '2 years', type: 'Analytics' },
    { name: '_ga_*', provider: 'Google Analytics', purpose: 'Persists session state', duration: '2 years', type: 'Analytics' },
    { name: '_gcl_au', provider: 'Google Ads', purpose: 'Conversion tracking and audience building', duration: '90 days', type: 'Advertising' },
    { name: '_fbp', provider: 'Meta', purpose: 'Identifies browser for Meta Pixel tracking', duration: '90 days', type: 'Advertising' },
    { name: '_fbc', provider: 'Meta', purpose: 'Stores click ID from Meta ad clicks', duration: '2 years', type: 'Advertising' },
  ];
  const tagColor: Record<string, { bg: string; color: string }> = {
    Essential:   { bg: 'rgba(0,0,0,0.06)',         color: 'var(--mid-gray)' },
    Analytics:   { bg: 'rgba(59,130,246,0.09)',    color: '#1d4ed8' },
    Advertising: { bg: 'rgba(200,241,53,0.18)',    color: 'var(--lime-dark)' },
  };
  return (
    <div className="card" style={{ padding: 0, marginBottom: 16, borderRadius: 16, overflowX: 'auto', overflowY: 'hidden' }}>
      <table style={{ width: '100%', minWidth: 540, borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
            {['Cookie', 'Provider', 'Purpose', 'Duration', 'Type'].map(h => (
              <th key={h} style={{ padding: '11px 14px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--black)', fontSize: 11, textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.07)', letterSpacing: '-0.01em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cookies.map((c, i) => (
            <tr key={i} style={{ borderBottom: i < cookies.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
              <td style={{ padding: '9px 14px', fontFamily: 'monospace', fontSize: 11, color: 'var(--black)', fontWeight: 500 }}>{c.name}</td>
              <td style={{ padding: '9px 14px', color: 'var(--dark-gray)', fontWeight: 300 }}>{c.provider}</td>
              <td style={{ padding: '9px 14px', color: 'var(--dark-gray)', fontWeight: 300 }}>{c.purpose}</td>
              <td style={{ padding: '9px 14px', color: 'var(--mid-gray)', fontWeight: 300, whiteSpace: 'nowrap' as const }}>{c.duration}</td>
              <td style={{ padding: '9px 14px' }}>
                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' as const, ...tagColor[c.type] }}>{c.type}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const sections = [
  { id: 'collect',     label: '01 · Information we collect' },
  { id: 'process',     label: '02 · How we process it' },
  { id: 'share',       label: '03 · Who we share it with' },
  { id: 'advertising', label: '04 · Advertising & remarketing' },
  { id: 'cookies',     label: '05 · Cookie table' },
  { id: 'social',      label: '06 · Social logins' },
  { id: 'retention',   label: '07 · Data retention' },
  { id: 'security',    label: '08 · Security' },
  { id: 'minors',      label: '09 · Minors' },
  { id: 'rights',      label: '10 · Your rights' },
  { id: 'dnt',         label: '11 · Do-Not-Track' },
  { id: 'popia',       label: '12 · POPIA (South Africa)' },
  { id: 'updates',     label: '13 · Updates' },
  { id: 'contact',     label: '14 · Contact us' },
  { id: 'access',      label: '15 · Data requests (DSAR)' },
];

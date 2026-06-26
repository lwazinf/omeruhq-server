import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  updateStoreProfileAction,
  updateTradingHoursAction,
  toggleStoreOpenAction,
  updateBankDetailsAction,
} from './actions';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const merchant = await db.merchant.findUnique({
    where: { id: session.merchant_id },
    select: {
      trading_name: true,
      description: true,
      support_number: true,
      welcome_message: true,
      open_time: true,
      close_time: true,
      sat_open_time: true,
      sat_close_time: true,
      sun_open: true,
      manual_closed: true,
      bank_name: true,
      bank_acc_no: true,
      bank_type: true,
      address: true,
      location_visible: true,
      store_category: true,
    },
  });

  if (!merchant) redirect('/login');

  const isOpen = !merchant.manual_closed;

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-body)',
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 6,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  };

  const sectionHeadStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: 17,
    fontWeight: 700,
    marginBottom: 20,
    letterSpacing: '-0.01em',
  };

  return (
    <div className="portal-page" style={{ padding: 'clamp(20px, 3vw, 36px) clamp(16px, 3vw, 36px)', maxWidth: 760 }}>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.015em' }}>
          Settings
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)', marginTop: 2 }}>
          Manage your store profile, trading hours, and status
        </div>
      </div>

      {/* ── Section 1: Store profile ── */}
      <div className="card" style={{ marginBottom: 24, padding: '24px 28px' }}>
        <div style={sectionHeadStyle}>Store profile</div>
        <form action={updateStoreProfileAction} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Trading name</label>
            <input
              className="input"
              name="trading_name"
              defaultValue={merchant.trading_name}
              required
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              className="input"
              name="description"
              defaultValue={merchant.description ?? ''}
              rows={3}
              placeholder="Tell customers what your store is about…"
              style={{ width: '100%', resize: 'vertical', minHeight: 80 }}
            />
          </div>
          <div>
            <label style={labelStyle}>Support number</label>
            <input
              className="input"
              name="support_number"
              defaultValue={merchant.support_number ?? ''}
              placeholder="+27821234567"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Welcome message</label>
            <textarea
              className="input"
              name="welcome_message"
              defaultValue={merchant.welcome_message ?? ''}
              rows={3}
              placeholder="Hi! Welcome to our store. How can we help you today?"
              style={{ width: '100%', resize: 'vertical', minHeight: 80 }}
            />
          </div>
          <div>
            <button type="submit" className="btn-lime" style={{ padding: '10px 24px', fontSize: 13 }}>
              Save profile
            </button>
          </div>
        </form>
      </div>

      {/* ── Section 2: Trading hours ── */}
      <div className="card" style={{ marginBottom: 24, padding: '24px 28px' }}>
        <div style={sectionHeadStyle}>Trading hours</div>
        <form action={updateTradingHoursAction} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Weekday hours */}
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Monday – Friday
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 130 }}>
                <label style={labelStyle}>Opens</label>
                <input type="time" className="input" name="open_time" defaultValue={merchant.open_time} style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1, minWidth: 130 }}>
                <label style={labelStyle}>Closes</label>
                <input type="time" className="input" name="close_time" defaultValue={merchant.close_time} style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          {/* Saturday hours */}
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Saturday
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 130 }}>
                <label style={labelStyle}>Opens</label>
                <input type="time" className="input" name="sat_open_time" defaultValue={merchant.sat_open_time} style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1, minWidth: 130 }}>
                <label style={labelStyle}>Closes</label>
                <input type="time" className="input" name="sat_close_time" defaultValue={merchant.sat_close_time} style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          {/* Sunday toggle */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="sun_open"
                defaultChecked={merchant.sun_open}
                style={{ width: 17, height: 17, accentColor: 'var(--lime)', cursor: 'pointer' }}
              />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                Open on Sundays
              </span>
            </label>
          </div>

          <div>
            <button type="submit" className="btn-lime" style={{ padding: '10px 24px', fontSize: 13 }}>
              Save hours
            </button>
          </div>
        </form>
      </div>

      {/* ── Section 3: Bank & location ── */}
      <div className="card" style={{ marginBottom: 24, padding: '24px 28px' }}>
        <div style={sectionHeadStyle}>Bank account & location</div>
        <form action={updateBankDetailsAction} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Bank name</label>
              <input className="input" name="bank_name" defaultValue={merchant.bank_name ?? ''} placeholder="e.g. FNB" style={{ width: '100%' }} />
            </div>
            <div>
              <label style={labelStyle}>Account type</label>
              <select className="input" name="bank_type" defaultValue={merchant.bank_type ?? ''} style={{ width: '100%' }}>
                <option value="">Select…</option>
                <option value="CHEQUE">Cheque</option>
                <option value="SAVINGS">Savings</option>
                <option value="TRANSMISSION">Transmission</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Account number</label>
            <input className="input" name="bank_acc_no" defaultValue={merchant.bank_acc_no ?? ''} placeholder="123456789" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={labelStyle}>Store address</label>
            <input className="input" name="address" defaultValue={merchant.address ?? ''} placeholder="123 Main St, Cape Town" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={labelStyle}>Store category</label>
            <input className="input" name="store_category" defaultValue={merchant.store_category ?? ''} placeholder="e.g. Food & Beverages" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" name="location_visible" defaultChecked={merchant.location_visible} style={{ width: 17, height: 17, accentColor: 'var(--lime)', cursor: 'pointer' }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>Show address on your store page</span>
            </label>
          </div>
          <div>
            <button type="submit" className="btn-lime" style={{ padding: '10px 24px', fontSize: 13 }}>Save details</button>
          </div>
        </form>
      </div>

      {/* ── Section 4: Store status ── */}
      <div className="card" style={{ padding: '24px 28px' }}>
        <div style={sectionHeadStyle}>Store status</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)', marginBottom: 24 }}>
          Manually override your store open/closed status for customers.
        </div>

        <form action={toggleStoreOpenAction}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Status indicator */}
              <div style={{
                width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                background: isOpen ? 'rgba(200,241,53,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${isOpen ? 'rgba(200,241,53,0.25)' : 'rgba(239,68,68,0.25)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: isOpen ? 'var(--lime)' : '#ef4444',
                  boxShadow: isOpen ? '0 0 12px var(--lime)' : '0 0 12px #ef4444',
                }} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em' }}>
                  {isOpen ? 'Store is open' : 'Store is closed'}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--mid-gray)', marginTop: 2 }}>
                  {isOpen
                    ? 'Customers can place orders and make bookings'
                    : 'Customers cannot place new orders or bookings'}
                </div>
              </div>
            </div>
            <button
              type="submit"
              className={isOpen ? 'btn-outline' : 'btn-lime'}
              style={{ padding: '10px 28px', fontSize: 13, whiteSpace: 'nowrap' }}
            >
              {isOpen ? 'Close store' : 'Open store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

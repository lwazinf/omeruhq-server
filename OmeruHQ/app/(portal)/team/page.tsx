import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { inviteTeamMemberAction, removeTeamMemberAction, revokeInviteAction } from './actions';

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'var(--lime)',
  ADMIN: '#f5c842',
  STAFF: 'rgba(255,255,255,0.5)',
};

const ROLE_BG: Record<string, string> = {
  OWNER: 'rgba(200,241,53,0.1)',
  ADMIN: 'rgba(245,200,66,0.1)',
  STAFF: 'rgba(255,255,255,0.05)',
};

export default async function TeamPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [teamMembers, pendingInvites] = await Promise.all([
    db.merchantOwner.findMany({
      where: { merchant_id: session.merchant_id, is_active: true },
      orderBy: { createdAt: 'asc' },
    }),
    db.merchantInvite.findMany({
      where: { merchant_id: session.merchant_id, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const isOwner = session.role === 'OWNER';

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

  return (
    <div className="portal-page" style={{ padding: 'clamp(20px, 3vw, 36px) clamp(16px, 3vw, 36px)', maxWidth: 760 }}>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.015em' }}>
          Team
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)', marginTop: 2 }}>
          Manage who has access to your Omeru HQ portal
        </div>
      </div>

      {/* ── Current team ── */}
      <div className="card" style={{ marginBottom: 24, padding: '24px 28px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, marginBottom: 20, letterSpacing: '-0.01em' }}>
          Current team
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 400, color: 'var(--mid-gray)', marginLeft: 8 }}>
            {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {teamMembers.map((member) => {
            const isSelf = member.wa_id === session.wa_id;
            const canRemove = isOwner && !isSelf;
            const roleColor = ROLE_COLORS[member.role] ?? 'rgba(255,255,255,0.4)';
            const roleBg = ROLE_BG[member.role] ?? 'transparent';

            return (
              <div
                key={member.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: 12, flexWrap: 'wrap', gap: 10,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(255,255,255,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                    color: 'rgba(255,255,255,0.45)',
                  }}>
                    {member.wa_id.charAt(1).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {member.wa_id}
                      {isSelf && (
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                          (you)
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--mid-gray)', marginTop: 1 }}>
                      Since {new Date(member.createdAt).toLocaleString('en-ZA', { dateStyle: 'medium' })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Role badge */}
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    padding: '4px 10px', borderRadius: 100,
                    color: roleColor, background: roleBg, border: `1px solid ${roleColor}30`,
                  }}>
                    {member.role}
                  </span>

                  {canRemove && (
                    <form action={removeTeamMemberAction} style={{ display: 'inline' }}>
                      <input type="hidden" name="id" value={member.id} />
                      <button
                        type="submit"
                        className="btn-ghost"
                        style={{ fontSize: 12, padding: '5px 12px', color: 'rgba(239,68,68,0.65)' }}
                        onClick={(e) => {
                          if (!confirm(`Remove ${member.wa_id} from your team?`)) e.preventDefault();
                        }}
                      >
                        Remove
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Pending invites ── */}
      {pendingInvites.length > 0 && (
        <div className="card" style={{ marginBottom: 24, padding: '24px 28px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, marginBottom: 20, letterSpacing: '-0.01em' }}>
            Pending invites
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 400, color: 'var(--mid-gray)', marginLeft: 8 }}>
              {pendingInvites.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingInvites.map((invite) => {
              const roleColor = ROLE_COLORS[invite.role] ?? 'rgba(255,255,255,0.4)';
              const roleBg = ROLE_BG[invite.role] ?? 'transparent';

              return (
                <div
                  key={invite.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: 12, flexWrap: 'wrap', gap: 10,
                    background: 'rgba(245,200,66,0.04)', border: '1px solid rgba(245,200,66,0.12)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1l1.854 3.146L14 5.09l-3 2.925.708 4.127L8 10l-3.708 2.142L5 8.015 2 5.09l4.146-.944L8 1z" stroke="#f5c842" strokeWidth="1.2" strokeLinejoin="round"/>
                    </svg>
                    <div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                        {invite.invited_wa_id}
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--mid-gray)', marginTop: 1 }}>
                        Invited {new Date(invite.createdAt).toLocaleString('en-ZA', { dateStyle: 'medium' })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
                      letterSpacing: '0.05em', textTransform: 'uppercase',
                      padding: '4px 10px', borderRadius: 100,
                      color: roleColor, background: roleBg, border: `1px solid ${roleColor}30`,
                    }}>
                      {invite.role}
                    </span>
                    {isOwner && (
                      <form action={revokeInviteAction} style={{ display: 'inline' }}>
                        <input type="hidden" name="id" value={invite.id} />
                        <button
                          type="submit"
                          className="btn-ghost"
                          style={{ fontSize: 12, padding: '5px 12px', color: 'rgba(239,68,68,0.65)' }}
                        >
                          Revoke
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Invite form ── */}
      {isOwner && (
        <div className="card" style={{ padding: '24px 28px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.01em' }}>
            Invite a team member
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)', marginBottom: 20 }}>
            They'll receive a WhatsApp message with their invite once submitted.
          </div>

          <form action={inviteTeamMemberAction} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>WhatsApp number (E.164)</label>
              <input
                className="input"
                name="invited_wa_id"
                required
                placeholder="+27821234567"
                pattern="^\+[1-9]\d{6,14}$"
                title="Enter in E.164 format, e.g. +27821234567"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <select
                className="input"
                name="role"
                defaultValue="ADMIN"
                style={{ width: '100%' }}
              >
                <option value="ADMIN">Admin — can manage orders, products, services</option>
                <option value="STAFF">Staff — view only access</option>
              </select>
            </div>
            <div>
              <button type="submit" className="btn-lime" style={{ padding: '10px 24px', fontSize: 13 }}>
                Send invite
              </button>
            </div>
          </form>
        </div>
      )}

      {!isOwner && (
        <div style={{
          padding: '16px 20px', borderRadius: 12,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mid-gray)', textAlign: 'center',
        }}>
          Only store owners can invite new team members.
        </div>
      )}
    </div>
  );
}

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV = [
  { href: '/',          label: 'Dashboard',    icon: DashboardIcon   },
  { href: '/meeting',   label: 'Live Meeting', icon: VideoIcon       },
  { href: '/history',   label: 'History',      icon: ClockIcon       },
  { href: '/analytics', label: 'Analytics',    icon: ChartIcon       },
];

export default function Sidebar() {
  const pathname  = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside style={{
      width: collapsed ? 72 : 240,
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 250ms ease',
      zIndex: 50,
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '20px 16px', borderBottom: '1px solid var(--border-subtle)',
        minHeight: 72,
      }}>
        <div style={{
          width: 36, height: 36, flexShrink: 0,
          background: 'var(--grad-primary)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--glow-blue)',
        }}>
          <NexusLogo />
        </div>
        {!collapsed && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.1 }}>
              <span className="gradient-text">Nexus</span>
              <span style={{ color: 'var(--text-primary)' }}> AI</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 500, letterSpacing: '0.06em' }}>
              MEETING ASSISTANT
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
              border: `1px solid ${isActive ? 'rgba(59,130,246,0.3)' : 'transparent'}`,
              color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
              fontWeight: isActive ? 600 : 400,
              fontSize: '0.875rem',
              transition: 'all 150ms ease',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              boxShadow: isActive ? '0 0 12px rgba(59,130,246,0.1)' : 'none',
            }}>
              <span style={{ flexShrink: 0 }}><Icon size={18} active={isActive} /></span>
              {!collapsed && <span style={{ animation: 'fadeIn 0.15s ease' }}>{label}</span>}
              {!collapsed && isActive && (
                <span style={{
                  marginLeft: 'auto', width: 6, height: 6,
                  background: 'var(--accent-blue)',
                  borderRadius: '50%',
                  boxShadow: 'var(--glow-blue)',
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-end',
            gap: 8, padding: '8px 12px', background: 'transparent', border: 'none',
            color: 'var(--text-tertiary)', cursor: 'pointer', borderRadius: 'var(--radius-md)',
            transition: 'all 150ms ease', fontSize: '0.8rem',
          }}
        >
          {!collapsed && <span>Collapse</span>}
          <CollapseIcon collapsed={collapsed} />
        </button>
      </div>
    </aside>
  );
}

// ── Inline Icons ──────────────────────────────────────────────
function DashboardIcon({ size = 18, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent-blue)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  );
}
function VideoIcon({ size = 18, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent-blue)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M4 8h8a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"/>
    </svg>
  );
}
function ClockIcon({ size = 18, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent-blue)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
    </svg>
  );
}
function ChartIcon({ size = 18, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent-blue)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6"/>
    </svg>
  );
}
function NexusLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
      <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M19.07 4.93l-2.12 2.12M7.05 16.95l-2.12 2.12"/>
    </svg>
  );
}
function CollapseIcon({ collapsed }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 250ms ease' }}>
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  );
}

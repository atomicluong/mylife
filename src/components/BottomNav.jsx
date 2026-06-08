import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Activity,
  DollarSign,
  Menu
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home',     icon: LayoutDashboard },
  { id: 'tasks',     label: 'Kế hoạch', icon: CheckSquare },
  { id: 'habits',    label: 'Thói quen',icon: Activity },
  { id: 'finance',   label: 'Tài chính',icon: DollarSign },
];

export default function BottomNav({ activeTab, setActiveTab, onMenuOpen }) {
  const { notifications } = useApp();

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 200,
      display: 'flex',
      alignItems: 'stretch',
      background: 'var(--bg-card)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border-color)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      boxShadow: '0 -8px 32px rgba(0,0,0,0.18)',
    }}>
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        const hasBadge = id === 'finance' && notifications.length > 0;
        return (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '10px 4px',
              border: 'none',
              background: 'none',
              color: isActive ? 'var(--accent-secondary)' : 'var(--text-muted)',
              fontSize: '0.65rem',
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              position: 'relative',
              minHeight: '56px',
              transition: 'color 0.2s',
            }}
          >
            {isActive && (
              <span style={{
                position: 'absolute',
                top: 0,
                left: '20%',
                right: '20%',
                height: '2px',
                background: 'var(--accent-secondary)',
                borderRadius: '0 0 2px 2px',
              }} />
            )}
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span>{label}</span>
            {hasBadge && (
              <span style={{
                position: 'absolute',
                top: '8px',
                right: '22%',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--accent-danger)',
              }} />
            )}
          </button>
        );
      })}

      {/* Menu button – mở sidebar overlay */}
      <button
        onClick={onMenuOpen}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          padding: '10px 4px',
          border: 'none',
          background: 'none',
          color: 'var(--text-muted)',
          fontSize: '0.65rem',
          fontWeight: 500,
          cursor: 'pointer',
          minHeight: '56px',
        }}
      >
        <Menu size={22} strokeWidth={1.8} />
        <span>Thêm</span>
      </button>
    </nav>
  );
}

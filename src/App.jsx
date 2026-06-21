import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import TaskManager from './components/TaskManager';
import FinanceTracker from './components/FinanceTracker';
import HabitTracker from './components/HabitTracker';
import Settings from './components/Settings';
import OKRs from './components/OKRs';
import AIChat from './components/AIChat';
import HandwrittenNotes from './components/HandwrittenNotes';
import { useIsMobile } from './hooks/useIsMobile';
import { Menu, X, Pause, Play, Square } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('tf_active_tab') || 'dashboard');
  const { isReaderFullscreen, selectedTaskId, focusSessions, toggleFocusSession, stopAndLogFocusSession } = useApp();
  const isMobile = useIsMobile();

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (window.innerWidth <= 768) return false;
    const saved = localStorage.getItem('tf_sidebar_open');
    return saved !== 'false';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => { localStorage.setItem('tf_active_tab', activeTab); }, [activeTab]);
  useEffect(() => {
    if (!isMobile) localStorage.setItem('tf_sidebar_open', isSidebarOpen);
  }, [isSidebarOpen, isMobile]);

  // Đóng overlay khi chuyển tab trên mobile
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
      case 'tasks':     return <TaskManager />;
      case 'finance':   return <FinanceTracker />;
      case 'habits':    return <HabitTracker />;
      case 'okrs':      return <OKRs />;
      case 'ai-chat':   return <AIChat />;
      case 'notes':     return <HandwrittenNotes />;
      case 'settings':  return <Settings />;
      default:          return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  const isDetailsView = activeTab === 'tasks' && selectedTaskId;
  const hideSidebar = isReaderFullscreen || isDetailsView || !isSidebarOpen || isMobile;
  const showToggleOpenButton = !isMobile && !isSidebarOpen && !isReaderFullscreen && !isDetailsView;

  return (
    <div className={`app-container ${hideSidebar ? 'reader-fullscreen' : ''}`}>
      {/* Desktop sidebar */}
      {!hideSidebar && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      )}

      {/* Desktop: nút mở lại sidebar khi đã thu gọn */}
      {showToggleOpenButton && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          style={{
            position: 'fixed', left: '1rem', top: '1rem', zIndex: 99,
            background: 'var(--bg-glass)', border: '1px solid var(--border-color)',
            borderRadius: '8px', width: '36px', height: '36px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-primary)', cursor: 'pointer',
            boxShadow: 'var(--card-shadow)', backdropFilter: 'blur(10px)',
            transition: 'var(--transition-smooth)'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
          <Menu size={18} />
        </button>
      )}

      {/* Mobile overlay backdrop */}
      {isMobile && isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 299,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Mobile sidebar drawer */}
      {isMobile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 300,
          width: '280px',
          transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <Sidebar
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            isSidebarOpen={true}
            setIsSidebarOpen={() => setIsMobileMenuOpen(false)}
          />
        </div>
      )}

      <main style={{
        flex: 1,
        overflowY: isReaderFullscreen ? 'hidden' : 'auto',
        height: '100vh',
        paddingBottom: isMobile ? 0 : (hideSidebar ? '0' : '3rem'),
        paddingLeft: showToggleOpenButton ? '4.5rem' : '0',
        transition: 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {renderActiveView()}
        {/* Spacer — pushes content above fixed bottom UI (timer + nav) */}
        {isMobile && !isReaderFullscreen && (() => {
          const hasNav = !isDetailsView;
          const hasTimer = !isDetailsView && focusSessions.length > 0;
          let h;
          if (hasNav && hasTimer) h = 'calc(108px + env(safe-area-inset-bottom))';
          else if (hasNav) h = 'calc(80px + env(safe-area-inset-bottom))';
          else if (hasTimer) h = '52px';
          else return null;
          return <div style={{ height: h, flexShrink: 0 }} aria-hidden />;
        })()}
      </main>

      {/* Global focus timer bar — shows above bottom nav on mobile */}
      {isMobile && !isReaderFullscreen && !isDetailsView && focusSessions.length > 0 && (() => {
        const session = focusSessions[0];
        const secs = session.secondsLeft || 0;
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return (
          <div style={{
            position: 'fixed',
            bottom: 'calc(56px + env(safe-area-inset-bottom))',
            left: 0,
            right: 0,
            zIndex: 201,
            background: 'rgba(30, 27, 60, 0.96)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(99,102,241,0.35)',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: session.isActive ? '#10b981' : '#f97316',
              boxShadow: session.isActive ? '0 0 6px #10b981' : 'none',
              flexShrink: 0,
              transition: 'background 0.3s',
            }} />
            <span style={{
              flex: 1,
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {session.title || 'Đang đếm giờ...'}
            </span>
            <span style={{
              fontSize: '0.92rem',
              fontWeight: 700,
              color: 'var(--accent-secondary)',
              fontVariantNumeric: 'tabular-nums',
              flexShrink: 0,
              minWidth: '42px',
              textAlign: 'right',
            }}>
              {timeStr}
            </span>
            <button
              onClick={() => toggleFocusSession(session.id)}
              style={{
                background: 'rgba(99,102,241,0.18)',
                border: '1px solid rgba(99,102,241,0.35)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {session.isActive ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              onClick={() => stopAndLogFocusSession(session.id)}
              style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '6px',
                color: '#ef4444',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <Square size={14} />
            </button>
          </div>
        );
      })()}

      {/* Mobile bottom navigation */}
      {isMobile && !isReaderFullscreen && !isDetailsView && (
        <BottomNav
          activeTab={activeTab}
          setActiveTab={handleTabChange}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

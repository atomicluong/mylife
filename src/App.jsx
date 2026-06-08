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
import { useIsMobile } from './hooks/useIsMobile';
import { Menu, X } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('tf_active_tab') || 'dashboard');
  const { isReaderFullscreen, selectedTaskId } = useApp();
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
        overflowY: isMobile ? 'visible' : (isReaderFullscreen ? 'hidden' : 'auto'),
        height: isMobile ? 'auto' : '100vh',
        paddingBottom: isMobile ? 0 : (hideSidebar ? '0' : '3rem'),
        paddingLeft: showToggleOpenButton ? '4.5rem' : '0',
        transition: 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {renderActiveView()}
        {/* Spacer đẩy nội dung lên trên bottom nav trên mobile */}
        {isMobile && !isReaderFullscreen && (
          <div style={{ height: 'calc(80px + env(safe-area-inset-bottom))', flexShrink: 0 }} aria-hidden />
        )}
      </main>

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

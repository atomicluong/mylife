import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TaskManager from './components/TaskManager';
import FinanceTracker from './components/FinanceTracker';
import HabitTracker from './components/HabitTracker';
import Settings from './components/Settings';
import OKRs from './components/OKRs';
import AIChat from './components/AIChat';
import { Menu } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('tf_active_tab') || 'dashboard');
  const { isReaderFullscreen, selectedTaskId } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('tf_sidebar_open');
    return saved !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('tf_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('tf_sidebar_open', isSidebarOpen);
  }, [isSidebarOpen]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'tasks':
        return <TaskManager />;
      case 'finance':
        return <FinanceTracker />;
      case 'habits':
        return <HabitTracker />;
      case 'okrs':
        return <OKRs />;
      case 'ai-chat':
        return <AIChat />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  const isDetailsView = activeTab === 'tasks' && selectedTaskId;
  const hideSidebar = isReaderFullscreen || isDetailsView || !isSidebarOpen;
  const showToggleOpenButton = !isSidebarOpen && !isReaderFullscreen && !isDetailsView;

  return (
    <div className={`app-container ${hideSidebar ? 'reader-fullscreen' : ''}`}>
      {!hideSidebar && (
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      )}
      
      {showToggleOpenButton && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          style={{
            position: 'fixed',
            left: '1rem',
            top: '1rem',
            zIndex: 99,
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            boxShadow: 'var(--card-shadow)',
            backdropFilter: 'blur(10px)',
            transition: 'var(--transition-smooth)'
          }}
          title="Mở rộng Sidebar"
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
          <Menu size={18} />
        </button>
      )}

      <main style={{ 
        flex: 1, 
        overflowY: isReaderFullscreen ? 'hidden' : 'auto', 
        height: '100vh',
        paddingBottom: hideSidebar ? '0' : '3rem',
        paddingLeft: showToggleOpenButton ? '4.5rem' : '0rem',
        transition: 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {renderActiveView()}
      </main>
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

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Timer,
  DollarSign,
  Activity,
  Calendar,
  Kanban,
  BookOpen,
  Settings,
  Sun,
  Moon,
  AlertCircle,
  Play,
  Pause,
  XCircle,
  CheckCircle2,
  Zap,
  ChevronLeft,
  Target,
  MessageSquare,
  RefreshCw,
  Download,
  Smartphone
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
const isInStandaloneMode = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

export default function Sidebar({ activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen }) {
  const {
    user,
    preferences,
    setPreferences,
    notifications,
    tasks,
    focusSessions,
    toggleFocusSession,
    stopAndLogFocusSession,
    cancelFocusSession,
    timerDemoSpeed
  } = useApp();

  const [installPrompt, setInstallPrompt] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [installed, setInstalled] = useState(isInStandaloneMode());

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setInstalled(true); setInstallPrompt(null); });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS()) { setShowHint(h => !h); return; }
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') { setInstalled(true); setInstallPrompt(null); }
    } else {
      setShowHint(h => !h);
    }
  };

  const hintText = isIOS()
    ? 'Trên Safari: nhấn nút Share (vuông + mũi tên) → Add to Home Screen'
    : 'Nhìn lên thanh địa chỉ Chrome, nhấn biểu tượng máy tính có dấu ⊕ để cài. Hoặc menu Chrome (⋮) → Cài đặt ứng dụng.';

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', name: 'Kế hoạch', icon: CheckSquare },
    { id: 'okrs', name: 'Mục tiêu OKR', icon: Target },
    { id: 'ai-chat', name: 'Trợ lý AI Chat', icon: MessageSquare },
    { id: 'habits', name: 'Thói quen', icon: Activity },
    { id: 'finance', name: 'Tài chính', icon: DollarSign },
    { id: 'settings', name: 'Thiết lập', icon: Settings },
  ];

  return (
    <aside className="glass-panel" style={{
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 2rem)', 
      margin: '1rem',
      padding: '1.5rem 1.25rem',
      borderRadius: 'var(--radius-lg)',
      justifyContent: 'space-between',
      position: 'sticky',
      top: '1rem'
    }}>
      {/* App Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '1.25rem',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}>
              ML
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }} className="gradient-text">MyLife</h1>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>PRO ACTIVE LIFE</span>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            style={{
              border: 'none',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              transition: 'var(--transition-smooth)'
            }}
            title="Thu gọn Sidebar"
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* User Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-color)',
          marginBottom: '1.5rem'
        }}>
          <img 
            src={user.avatar} 
            alt={user.name} 
            style={{ width: '38px', height: '38px', borderRadius: '50%', border: '2px solid var(--accent-primary)' }} 
          />
          <div style={{ overflow: 'hidden' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{user.name}</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {user.email}
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)' : 'transparent',
                  color: isActive ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderLeft: isActive ? '3px solid var(--accent-secondary)' : '3px solid transparent',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <Icon size={18} style={{ color: isActive ? 'var(--accent-secondary)' : 'var(--text-muted)' }} />
                <span style={{ flex: 1 }}>{item.name}</span>
                {item.id === 'finance' && notifications.length > 0 && (
                  <span style={{
                    background: 'var(--accent-danger)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>
                    {notifications.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Theme Toggle & Focus Player */}
      <div>
        {/* Global Focus Player Widgets */}
        {focusSessions.map(session => {
          const sessionTask = tasks.find(t => t.id === session.taskId);
          const sessionSubtask = sessionTask?.subtasks?.find(st => st.id === session.subtaskId);
          const runningTitle = sessionSubtask ? sessionSubtask.title : (sessionTask ? sessionTask.title : 'Đang tập trung');
          
          return (
            <div 
              key={session.id}
              className="glass-panel" 
              style={{
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
                border: '1px solid var(--accent-glow)',
                marginBottom: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: session.isActive ? 'var(--accent-success)' : 'var(--accent-warning)',
                  animation: session.isActive ? 'pulseGlow 1.5s infinite ease-in-out' : 'none'
                }} />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {session.isActive ? 'Đang tập trung' : 'Tạm dừng'}
                </span>
              </div>

              <div style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                lineHeight: 1.2
              }} title={runningTitle}>
                🎯 {runningTitle}
              </div>

              {/* Progress Bar & Timer text */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <div style={{ flex: 1, height: '4px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, (session.secondsLeft / (30 * 60)) * 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                    transition: 'width 0.5s ease-in-out'
                  }} />
                </div>
                <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent-success)', minWidth: '42px', textAlign: 'right' }}>
                  +{formatTime(session.secondsLeft)}
                </span>
              </div>

              {/* Control buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', padding: '0 4px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {/* Play/Pause Button */}
                  <button
                    onClick={() => toggleFocusSession(session.id)}
                    style={{
                      border: 'none',
                      background: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title={session.isActive ? 'Tạm dừng' : 'Tiếp tục'}
                  >
                    {session.isActive ? <Pause size={16} fill="var(--text-primary)" /> : <Play size={16} fill="var(--text-primary)" />}
                  </button>

                  {/* Log and Stop Button */}
                  <button
                    onClick={() => {
                      if (confirm('Ghi nhận và kết thúc phiên làm việc cho nhiệm vụ này?')) {
                        stopAndLogFocusSession(session.id);
                      }
                    }}
                    style={{
                      border: 'none',
                      background: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: 'var(--accent-success)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Hoàn thành & Ghi nhận"
                  >
                    <CheckCircle2 size={16} />
                  </button>

                  {/* Cancel Button */}
                  <button
                    onClick={() => cancelFocusSession(session.id)}
                    style={{
                      border: 'none',
                      background: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: 'var(--accent-danger)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Hủy phiên"
                  >
                    <XCircle size={16} />
                  </button>
                </div>

                {/* Demo Speed Indicator */}
                {timerDemoSpeed && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <Zap size={8} /> Demo
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {notifications.length > 0 && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '0.65rem',
            marginBottom: '1rem',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'flex-start'
          }}>
            <AlertCircle size={16} style={{ color: 'var(--accent-danger)', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-danger)', lineHeight: 1.3 }}>
              Cảnh báo chi tiêu! Kiểm tra tab tài chính.
            </div>
          </div>
        )}

        {/* Install PWA Button – luôn hiện khi chưa cài */}
        {!installed && (
          <div style={{ marginBottom: '0.5rem' }}>
            <button
              onClick={handleInstall}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.65rem 1rem',
                border: '1px solid var(--accent-primary)',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(134,59,255,0.15) 0%, rgba(99,102,241,0.1) 100%)',
                color: 'var(--accent-primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(134,59,255,0.28) 0%, rgba(99,102,241,0.2) 100%)'}
              onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(134,59,255,0.15) 0%, rgba(99,102,241,0.1) 100%)'}
            >
              {isIOS() ? <Smartphone size={15} /> : <Download size={15} />}
              {installPrompt ? 'Cài App về máy' : 'Hướng dẫn cài App'}
            </button>
            {showHint && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.6rem 0.75rem',
                background: 'rgba(134,59,255,0.08)',
                border: '1px solid rgba(134,59,255,0.2)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6
              }}>
                {hintText}
              </div>
            )}
          </div>
        )}

        {/* Reload Button */}
        <button
          onClick={() => window.location.reload()}
          title="Tải lại ứng dụng"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: '100%',
            padding: '0.6rem 1rem',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'var(--transition-smooth)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.color = 'var(--accent-primary)';
            e.currentTarget.querySelector('svg').style.transform = 'rotate(180deg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.querySelector('svg').style.transform = 'rotate(0deg)';
          }}
        >
          <RefreshCw size={14} style={{ transition: 'transform 0.4s ease' }} />
          Tải lại ứng dụng
        </button>
      </div>
    </aside>
  );
}

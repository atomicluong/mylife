import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  DollarSign, 
  Coffee, 
  Compass,
  Zap,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Pomodoro({ nested = false }) {
  const { 
    tasks, 
    preferences, 
    logPomodoroSession, 
    user,
    selectedTaskId,
    setSelectedTaskId,
    activeSubtaskId,
    setActiveSubtaskId,
    focusSessions,
    toggleFocusSession,
    stopAndLogFocusSession,
    cancelFocusSession
  } = useApp();

  const [sessionType, setSessionType] = useState('focus'); // 'focus' | 'short_break' | 'long_break'
  
  // Audio state
  const [isMuted, setIsMuted] = useState(true);

  // Timer states
  const getInitialSeconds = (type) => {
    switch (type) {
      case 'focus': return preferences.pomodoroDuration * 60;
      case 'short_break': return preferences.breakDuration * 60;
      case 'long_break': return 15 * 60;
      default: return 25 * 60;
    }
  };

  const [secondsLeft, setSecondsLeft] = useState(getInitialSeconds('focus'));
  const [isActive, setIsActive] = useState(false);
  const [demoSpeed, setDemoSpeed] = useState(false); // Speed run mode for testing

  const timerRef = useRef(null);
  
  // Calculate total seconds of active timer
  const totalSeconds = getInitialSeconds(sessionType);
  const progressPercent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  // Selected task data
  const linkedTask = tasks.find(t => t.id === selectedTaskId);
  const activeSubtask = linkedTask?.subtasks?.find(st => st.id === activeSubtaskId);
  const taskRate = linkedTask ? (linkedTask.billable ? (linkedTask.hourlyRate || user.hourlyRate) : 0) : 0;
  
  // Calculate real-time estimated earnings
  const elapsedMinutes = (totalSeconds - secondsLeft) / 60;
  const currentEarnings = Math.round((elapsedMinutes / 60) * taskRate * 100) / 100;

  // Sound alarms triggers
  const playAlarm = () => {
    if (isMuted) return;
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, context.currentTime); // A5 note
      osc.connect(gain);
      gain.connect(context.destination);
      gain.gain.setValueAtTime(0.5, context.currentTime);
      osc.start();
      osc.stop(context.currentTime + 0.8);
    } catch (e) {
      console.warn("Audio Context failed to play sound:", e);
    }
  };

  // Sync settings duration
  useEffect(() => {
    setSecondsLeft(getInitialSeconds(sessionType));
    setIsActive(false);
  }, [preferences.pomodoroDuration, preferences.breakDuration, sessionType]);

  // Main Timer Interval
  useEffect(() => {
    if (isActive) {
      const intervalMs = demoSpeed ? 50 : 1000; // 50ms per tick in speed run mode (approx 20x faster)
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, intervalMs);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isActive, demoSpeed]);

  const handleTimerComplete = () => {
    setIsActive(false);
    playAlarm();
    
    if (sessionType === 'focus') {
      const focusTimeMinutes = preferences.pomodoroDuration;
      logPomodoroSession(selectedTaskId, focusTimeMinutes, focusTimeMinutes);
      
      const subtaskName = activeSubtask ? `cho bước "${activeSubtask.title}" ` : '';
      alert(`🎉 Khởi tạo phiên hoàn thành! Bạn đã tập trung ${focusTimeMinutes} phút ${subtaskName}và kiếm được $${((focusTimeMinutes / 60) * taskRate).toFixed(2)}.`);
      
      // Clear active subtask
      setActiveSubtaskId(null);
      
      // Auto transition to short break
      setSessionType('short_break');
    } else {
      alert(`☕ Hết giờ giải lao! Hãy quay lại làm việc.`);
      setSessionType('focus');
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSecondsLeft(getInitialSeconds(sessionType));
  };

  const skipTimer = () => {
    setIsActive(false);
    handleTimerComplete();
  };

  const handleFinishAndLog = () => {
    setIsActive(false);
    playAlarm();
    
    const loggedMinutes = Math.max(1, Math.round(elapsedMinutes));
    logPomodoroSession(selectedTaskId, loggedMinutes, loggedMinutes);
    
    // Reset timer
    setSecondsLeft(getInitialSeconds(sessionType));
    
    const subtaskName = activeSubtask ? `cho bước "${activeSubtask.title}" ` : '';
    alert(`🎉 Đã hoàn thành và ghi nhận ${loggedMinutes} phút tập trung ${subtaskName}thành công!`);
    
    // Clear active subtask
    setActiveSubtaskId(null);
  };

  const handleSessionChange = (type) => {
    setSessionType(type);
    setIsActive(false);
  };

  // Format MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  // Break activities hints list
  const breakActivities = [
    { title: "Vươn vai giãn cơ", desc: "Đứng thẳng dậy, vươn tay qua đầu và uốn lưng nhẹ để giảm nhức mỏi cổ vai gáy." },
    { title: "Uống một cốc nước", desc: "Giữ cho cơ thể đủ nước giúp cải thiện 15% hiệu năng tập trung não bộ." },
    { title: "Thở sâu 4-7-8", desc: "Hít vào 4 giây, giữ hơi 7 giây, thở ra 8 giây. Thực hiện 4 chu kỳ để xả stress." },
    { title: "Nhìn xa 20 feet", desc: "Áp dụng quy tắc 20-20-20: Nhìn vật cách xa 20 feet (6m) trong 20 giây để thư giãn mắt." }
  ];

  const currentBreakActivity = breakActivities[Math.floor((elapsedMinutes * 10) % breakActivities.length)];

  return (
    <div className="slide-in" style={{
      padding: nested ? '0' : '1.5rem',
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr',
      gap: nested ? '1.25rem' : '2rem',
      maxWidth: nested ? '100%' : '900px',
      margin: nested ? '0' : '0 auto'
    }}>
      
      {/* Visual Clock Container */}
      <div className="glass-panel" style={{
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem'
      }}>
        
        {activeSubtask && (
          <div className="glass-panel" style={{
            background: 'rgba(99, 102, 241, 0.06)',
            border: '1px solid var(--accent-glow)',
            padding: '6px 12px',
            borderRadius: '12px',
            fontSize: '0.8rem',
            color: 'var(--accent-secondary)',
            fontWeight: 700,
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            animation: 'pulseGlow 2s infinite ease-in-out'
          }}>
            <Zap size={14} style={{ color: 'var(--accent-warning)' }} />
            <span>🎯 Tập trung: <strong>{activeSubtask.title}</strong></span>
          </div>
        )}

        {/* Toggle Session Types Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          padding: '4px'
        }}>
          {[
            { id: 'focus', name: 'Tập trung' },
            { id: 'short_break', name: 'Giải lao ngắn' },
            { id: 'long_break', name: 'Giải lao dài' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleSessionChange(tab.id)}
              style={{
                border: 'none',
                background: sessionType === tab.id 
                  ? 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)' 
                  : 'transparent',
                color: sessionType === tab.id ? '#fff' : 'var(--text-secondary)',
                padding: '0.5rem 1.25rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Circular Countdown Ring */}
        <div style={{ position: 'relative', width: '220px', height: '220px', margin: '1rem 0' }}>
          {/* Background Ring */}
          <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: 'rotate(-90deg)' }}>
            <circle 
              cx="110" 
              cy="110" 
              r="95" 
              stroke="var(--border-color)" 
              strokeWidth="10" 
              fill="transparent" 
            />
            {/* Active Ring */}
            <circle 
              cx="110" 
              cy="110" 
              r="95" 
              stroke={sessionType === 'focus' ? 'var(--accent-primary)' : 'var(--accent-success)'}
              strokeWidth="10" 
              strokeDasharray={2 * Math.PI * 95}
              strokeDashoffset={2 * Math.PI * 95 * (1 - progressPercent / 100)}
              strokeLinecap="round"
              fill="transparent"
              style={{ transition: 'stroke-dashoffset 0.1s linear' }}
            />
          </svg>

          {/* Time digits text */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
          }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
              {formatTime(secondsLeft)}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: '4px' }}>
              {sessionType === 'focus' ? '🎯 Focus Session' : '☕ Relax time'}
            </span>
          </div>
        </div>

        {/* Interactive Controls Buttons */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Reset button */}
          <button 
            onClick={resetTimer}
            style={{
              border: '1px solid var(--border-color)',
              background: 'var(--bg-glass)',
              color: 'var(--text-primary)',
              borderRadius: '50%',
              width: '46px',
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
            title="Đặt lại"
          >
            <RotateCcw size={18} />
          </button>

          {/* Start/Pause button */}
          <button
            onClick={toggleTimer}
            style={{
              border: 'none',
              background: isActive 
                ? 'linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-primary) 100%)'
                : 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              color: '#fff',
              borderRadius: '50%',
              width: '64px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
              transition: 'var(--transition-smooth)'
            }}
          >
            {isActive ? <Pause size={24} fill="#fff" /> : <Play size={24} fill="#fff" style={{ marginLeft: '4px' }} />}
          </button>

          {/* Quick finish for test */}
          <button 
            onClick={skipTimer}
            style={{
              border: '1px solid var(--border-color)',
              background: 'var(--bg-glass)',
              color: 'var(--text-primary)',
              borderRadius: '50%',
              width: '46px',
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
            title="Hoàn thành nhanh"
          >
            <CheckCircle2 size={18} />
          </button>
        </div>

        {/* Finish and Log Session early */}
        {isActive && sessionType === 'focus' && (
          <button 
            onClick={() => {
              if (confirm('Bạn có muốn hoàn thành sớm và ghi nhận thời gian tập trung này không?')) {
                handleFinishAndLog();
              }
            }}
            className="btn-primary"
            style={{
              padding: '0.4rem 1.25rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, var(--accent-success) 0%, var(--accent-primary) 100%)',
              boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)',
              marginTop: '0.5rem'
            }}
          >
            <CheckCircle2 size={14} />
            <span>Ghi nhận & Dừng tập trung</span>
          </button>
        )}

        {/* Audio / Demo speed toolbar */}
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
          <button 
            onClick={() => setIsMuted(!isMuted)}
            style={{
              border: 'none',
              background: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.78rem',
              fontWeight: 600
            }}
          >
            {isMuted ? (
              <>
                <VolumeX size={16} />
                <span>Âm thanh tắt</span>
              </>
            ) : (
              <>
                <Volume2 size={16} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ color: 'var(--text-primary)' }}>Âm thanh bật</span>
              </>
            )}
          </button>

          <button 
            onClick={() => setDemoSpeed(!demoSpeed)}
            style={{
              border: 'none',
              background: demoSpeed ? 'rgba(99, 102, 241, 0.15)' : 'none',
              color: demoSpeed ? 'var(--accent-secondary)' : 'var(--text-muted)',
              borderRadius: '6px',
              padding: '2px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.78rem',
              fontWeight: 600
            }}
            title="Chạy thử nghiệm nhanh (20x)"
          >
            <Zap size={14} style={{ color: demoSpeed ? 'var(--accent-warning)' : 'inherit' }} />
            <span>Tua nhanh (Demo)</span>
          </button>
        </div>

      </div>

      {/* Task & Earnings details side Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Link Task card */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem' }}>Liên kết nhiệm vụ</h3>
          
          {!(nested && selectedTaskId) && (
            <>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Kết nối phiên tập trung này với một công việc để cộng dồn giờ làm việc và tính tiền freelancer.
              </p>

              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  borderRadius: '8px',
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="">-- Chọn công việc thực hiện --</option>
                {tasks
                  .filter(t => t.status !== 'done')
                  .map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title} {t.billable ? '($)' : ''}
                    </option>
                  ))
                }
              </select>
            </>
          )}

          {linkedTask && (
            <div style={{
              background: 'rgba(99,102,241,0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '0.75rem',
              marginTop: (nested && selectedTaskId) ? '0' : '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Nhiệm vụ đang chạy</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{linkedTask.title}</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                <span>Giá thuê: {linkedTask.billable ? `$${linkedTask.hourlyRate || user.hourlyRate}/h` : 'Không tính phí'}</span>
                <span>Thời gian đã làm: {linkedTask.actualTime || 0}m</span>
              </div>
            </div>
          )}
        </div>

        {/* Active Focus Sessions List */}
        {focusSessions && focusSessions.length > 0 && (
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⏱️ Phiên Đang Chạy ({focusSessions.length})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {focusSessions.map(session => {
                const sessionTask = tasks.find(t => t.id === session.taskId);
                const sessionSubtask = sessionTask?.subtasks?.find(st => st.id === session.subtaskId);
                const title = sessionSubtask ? sessionSubtask.title : (sessionTask ? sessionTask.title : 'Nhiệm vụ');
                
                return (
                  <div 
                    key={session.id}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {title}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-success)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                        {formatTime(session.secondsLeft)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => toggleFocusSession(session.id)}
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {session.isActive ? 'Tạm dừng' : 'Tiếp tục'}
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Ghi nhận và dừng tập trung cho: "${title}"?`)) {
                            stopAndLogFocusSession(session.id);
                          }
                        }}
                        style={{
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          color: 'var(--accent-success)',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        Xong
                      </button>

                      <button
                        onClick={() => cancelFocusSession(session.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          color: 'var(--accent-danger)',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Real-time Earnings calculator card */}
        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-success)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <DollarSign size={20} style={{ color: 'var(--accent-success)' }} />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Tính Tiền Làm Việc</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Thời gian thực tính thành doanh số.</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Phiên hiện tại kiếm được:</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-success)' }}>
              ${sessionType === 'focus' ? currentEarnings.toFixed(2) : '0.00'}
            </span>
          </div>

          <div style={{
            marginTop: '1rem',
            padding: '0.5rem 0.75rem',
            background: 'var(--bg-glass)',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            lineHeight: 1.3
          }}>
            Công thức: (Phút tập trung / 60) × Mức giá nhiệm vụ. 
            Khi hết 25 phút, số tiền này sẽ tự động được cộng vào tổng thu nhập ngày của bạn.
          </div>
        </div>

        {/* Break time helper activity guides */}
        {sessionType !== 'focus' && (
          <div className="glass-panel slide-in" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
              <Coffee size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Gợi ý giải lao</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {currentBreakActivity.title}
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {currentBreakActivity.desc}
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

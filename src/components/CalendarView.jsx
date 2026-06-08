import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  CheckSquare, 
  Activity, 
  DollarSign, 
  Clock,
  Calendar as CalendarIcon,
  Layers,
  CheckCircle,
  Circle,
  Play
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const getLocalDateStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTomorrowStr = (dateStr) => {
  if (dateStr) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts.map(Number);
      const date = new Date(y, m - 1, d + 1);
      return getLocalDateStr(date);
    }
  }
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return getLocalDateStr(date);
};

const formatDayMonth = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
};

const sortTasksByTime = (taskList) => {
  return [...taskList].sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    
    if (a.dueTime && !b.dueTime) return -1;
    if (!a.dueTime && b.dueTime) return 1;
    if (a.dueTime && b.dueTime) {
      return a.dueTime.localeCompare(b.dueTime);
    }
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeA - timeB;
  });
};

const isOutdoorTask = (task) => {
  const keywords = [
    'đi', 'ngoài', 'siêu thị', 'chợ', 'gặp', 'mua', 'chạy bộ', 'ra ngoài', 
    'đạp xe', 'công viên', 'hẹn', 'outdoor', 'dã ngoại', 'cafe', 'làm việc ngoài', 
    'giao hàng', 'ship', 'du lịch', 'khách hàng', 'đón', 'gửi'
  ];
  const titleLower = (task.title || '').toLowerCase();
  const descLower = (task.description || '').toLowerCase();
  return keywords.some(kw => titleLower.includes(kw) || descLower.includes(kw));
};

export default function CalendarView({ 
  hideHeader = false, 
  hideToolbar = false,
  selectedTaskId, 
  setSelectedTaskId, 
  mode = 'day', 
  onModeChange,
  currentDate: propCurrentDate,
  setCurrentDate: propSetCurrentDate
}) {
  const { 
    tasks, 
    habits, 
    habitLogs, 
    expenses, 
    incomes, 
    pomodoros,
    toggleSubtask,
    updateTask,
    startFocusOnTask,
    focusSessions,
    toggleFocusSession,
    stopAndLogFocusSession,
    cancelFocusSession,
    getRealDayWeather: getDayWeather,
    getRealWeatherForHour: getWeatherForHour,
    rescheduleTask,
    getAutoRescheduleSlot,
    addSubtask
  } = useApp();

  const [internalCurrentDate, setInternalCurrentDate] = useState(new Date());
  const currentDate = propCurrentDate || internalCurrentDate;
  const setCurrentDate = propSetCurrentDate || setInternalCurrentDate;
  const calendarMode = mode;
  const [expandedTaskIds, setExpandedTaskIds] = useState({});
  const [activeRescheduleTaskId, setActiveRescheduleTaskId] = useState(null);
  const [quickAddSubtaskId, setQuickAddSubtaskId] = useState(null);
  const [quickSubtaskText, setQuickSubtaskText] = useState('');
  const [manualRescheduleDate, setManualRescheduleDate] = useState('');
  const [manualRescheduleTime, setManualRescheduleTime] = useState('');
  const [overdueExpanded, setOverdueExpanded] = useState(true);
  const [previousMode, setPreviousMode] = useState(null);

  React.useEffect(() => {
    if (mode !== 'day') {
      setPreviousMode(mode);
    }
  }, [mode]);

  const toggleTaskExpanded = (taskId) => {
    setExpandedTaskIds(prev => {
      const isCurrentlyExpanded = prev[taskId] === true;
      return {
        ...prev,
        [taskId]: !isCurrentlyExpanded
      };
    });
  };

  const getTaskStatusColor = (task) => {
    if (task.status === 'done') {
      return { text: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' };
    }
    
    const todayStr = getLocalDateStr();
    const now = new Date();
    
    // 1. Overdue (Trễ hạn): dueDate in the past
    if (task.dueDate && task.dueDate < todayStr) {
      return { text: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' };
    }
    
    // Check if due today but the due time has passed
    if (task.dueDate === todayStr && task.dueTime) {
      const [dueHour, dueMinute] = task.dueTime.split(':').map(Number);
      const dueTimeDate = new Date();
      dueTimeDate.setHours(dueHour, dueMinute, 0, 0);
      
      if (now > dueTimeDate) {
        return { text: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' };
      }
    }
    
    // 2. Due soon / upcoming (Sắp đến hạn): due today or in the future
    return { text: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', border: '1px solid rgba(249, 115, 22, 0.3)' };
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // --- Helper to get month grid dates ---
  const getDaysInMonth = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday...
    const numDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    // Fill previous month days
    const prevMonthNumDays = new Date(year, month, 0).getDate();
    const fillCount = firstDay === 0 ? 6 : firstDay - 1; // Align to Monday first
    for (let i = fillCount - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthNumDays - i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Fill current month days
    for (let i = 1; i <= numDays; i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true });
    }

    // Fill next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false });
    }

    return days;
  };

  const monthDays = getDaysInMonth(currentYear, currentMonth);

  // Navigations
  const handlePrev = () => {
    if (calendarMode === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    } else if (calendarMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (calendarMode === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    } else if (calendarMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (date) => {
    const dateStr = getLocalDateStr(date);
    
    const dayTasks = sortTasksByTime(tasks.filter(t => t.dueDate === dateStr));
    const dayHabits = habitLogs.filter(log => log.date === dateStr && log.completed);
    const dayExpenses = expenses.filter(e => e.date === dateStr);
    const dayIncomes = incomes.filter(i => i.date === dateStr);
    const dayPomodoros = pomodoros.filter(p => p.createdAt.startsWith(dateStr));

    return {
      tasks: dayTasks,
      habits: dayHabits,
      expenses: dayExpenses,
      incomes: dayIncomes,
      pomodoros: dayPomodoros,
      totalCount: dayTasks.length + dayHabits.length + dayExpenses.length + dayIncomes.length
    };
  };

  // --- Week view setup ---
  const getWeekDays = (middleDate) => {
    const currentDay = middleDate.getDay();
    const distanceToMon = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(middleDate);
    monday.setDate(middleDate.getDate() + distanceToMon);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      week.push(d);
    }
    return week;
  };

  const weekDays = getWeekDays(currentDate);

  return (
    <div className="slide-in" style={{ padding: hideHeader ? '0' : '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Calendar header control toolbar */}
      {(!hideHeader || !hideToolbar) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {!hideHeader ? (
            <div>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>Lịch Trình Tích Hợp</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Xem toàn cảnh nhiệm vụ, tài chính, thói quen và thời gian làm việc.</p>
            </div>
          ) : (
            <div />
          )}
 
          {!hideToolbar && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {/* Navigation Month buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button onClick={handlePrev} className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }}><ChevronLeft size={16} /></button>
                <div 
                  className="btn-secondary" 
                  style={{ 
                    padding: '0.4rem 0.8rem', 
                    fontSize: '0.82rem', 
                    position: 'relative', 
                    overflow: 'hidden',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={(e) => {
                    const picker = e.currentTarget.querySelector('input[type="date"]');
                    if (picker) {
                      if (typeof picker.showPicker === 'function') {
                        picker.showPicker();
                      } else {
                        picker.click();
                      }
                    }
                  }}
                >
                  {(() => {
                    const todayStr = getLocalDateStr(new Date());
                    const currentStr = getLocalDateStr(currentDate);
                    return todayStr === currentStr ? "Hôm nay" : currentDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  })()}
                  <input 
                    type="date"
                    value={getLocalDateStr(currentDate)}
                    onChange={(e) => {
                      if (e.target.value) {
                        setCurrentDate(new Date(e.target.value));
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer',
                      pointerEvents: 'none'
                    }}
                  />
                </div>
                <button onClick={handleNext} className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }}><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Render Modes */}
      {calendarMode === 'month' ? (
        // --- Month View Grid ---
        <div className="glass-panel" style={{ padding: '1rem', overflowX: 'auto' }}>
          {/* Header Title */}
          <h3 style={{ textAlign: 'center', fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 800 }}>
            {currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
          </h3>

          {/* Grid Layout */}
          <div style={{ minWidth: '600px' }}>
            {/* Week days titles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 700, fontSize: '0.82rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <span>Thứ 2</span>
              <span>Thứ 3</span>
              <span>Thứ 4</span>
              <span>Thứ 5</span>
              <span>Thứ 6</span>
              <span>Thứ 7</span>
              <span>Chủ nhật</span>
            </div>

            {/* Days cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border-color)', marginTop: '1px' }}>
              {monthDays.map((day, idx) => {
                const events = getEventsForDate(day.date);
                const isToday = getLocalDateStr(day.date) === getLocalDateStr();

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setCurrentDate(day.date);
                      if (onModeChange) {
                        onModeChange('day');
                      }
                    }}
                    style={{
                      background: day.isCurrentMonth ? 'var(--bg-app)' : 'rgba(0,0,0,0.02)',
                      minHeight: '85px',
                      padding: '0.4rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      opacity: day.isCurrentMonth ? 1 : 0.4,
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                    className="glass-card-interactive"
                    title={`Xem chi tiết lịch trình ngày ${day.date.getDate()}/${day.date.getMonth() + 1}`}
                  >
                    {/* Date label */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: isToday ? 800 : 500,
                        color: isToday ? 'var(--accent-primary)' : 'var(--text-primary)',
                        background: isToday ? 'rgba(99,102,241,0.15)' : 'transparent',
                        borderRadius: '50%',
                        width: '22px',
                        height: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {day.date.getDate()}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {(() => {
                          const weather = getDayWeather(getLocalDateStr(day.date));
                          const avgTemp = Math.round((weather.tempMin + weather.tempMax) / 2);
                          return (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }} title={`${weather.text} (${weather.tempMin}°C - ${weather.tempMax}°C)`}>
                              <span>{weather.icon}</span>
                              <span>{avgTemp}°C</span>
                            </span>
                          );
                        })()}
                        {events.totalCount > 0 && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '1px 4px', borderRadius: '4px' }}>{events.totalCount}</span>
                        )}
                      </div>
                    </div>

                    {/* Miniature dot summary */}
                    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      {events.tasks.map(t => (
                        <span key={t.id} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)' }} title={`Nhiệm vụ: ${t.title}`} />
                      ))}
                      {events.habits.map(h => (
                        <span key={h.id} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-warning)' }} title="Hoàn thành thói quen" />
                      ))}
                      {events.expenses.map(e => (
                        <span key={e.id} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-danger)' }} title={`Chi phí: -$${e.amount}`} />
                      ))}
                      {events.incomes.map(i => (
                        <span key={i.id} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-success)' }} title={`Thu nhập: +$${i.amount}`} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : calendarMode === 'week' ? (
        // --- Week View Timeline ---
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 800 }}>
            Tuần của {weekDays[0].getDate()}/{weekDays[0].getMonth()+1} - {weekDays[6].getDate()}/{weekDays[6].getMonth()+1} ({currentYear})
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {weekDays.map((day, idx) => {
              const events = getEventsForDate(day);
              const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
              const isToday = getLocalDateStr(day) === getLocalDateStr();

              return (
                <div 
                  key={idx} 
                  className="glass-panel glass-card-interactive" 
                  onClick={() => {
                    setCurrentDate(day);
                    if (onModeChange) {
                      onModeChange('day');
                    }
                  }}
                  style={{
                    padding: '1rem',
                    borderTop: isToday ? '3px solid var(--accent-primary)' : 'none',
                    minHeight: '200px',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                  title={`Xem chi tiết lịch trình ngày ${day.getDate()}/${day.getMonth() + 1}`}
                >
                  <h4 style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: isToday ? 'var(--accent-primary)' : 'var(--text-primary)',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '0.4rem',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{dayNames[day.getDay()]} ({day.getDate()}/{day.getMonth()+1})</span>
                    {(() => {
                      const weather = getDayWeather(getLocalDateStr(day));
                      const avgTemp = Math.round((weather.tempMin + weather.tempMax) / 2);
                      return (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }} title={`${weather.text} (${weather.tempMin}°C - ${weather.tempMax}°C)`}>
                          <span>{weather.icon}</span>
                          <span>{avgTemp}°C</span>
                        </span>
                      );
                    })()}
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {/* Render Tasks */}
                    {events.tasks.map(t => {
                      const colors = getTaskStatusColor(t);
                      const timeStr = t.dueTime ? `${t.dueTime}-${(() => {
                        const minutes = parseInt(t.timeEstimate) || 0;
                        const [hour, minute] = t.dueTime.split(':').map(Number);
                        const date = new Date();
                        date.setHours(hour, minute + minutes, 0, 0);
                        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                      })()}` : '';

                      const totalSub = t.subtasks ? t.subtasks.length : 0;
                      const completedSub = t.subtasks ? t.subtasks.filter(s => s.completed).length : 0;

                      return (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', flexWrap: 'wrap' }}>
                          <CheckSquare size={12} style={{ color: colors.text, flexShrink: 0 }} />
                          {timeStr && (
                            <span style={{ 
                              fontSize: '0.68rem', 
                              color: colors.text, 
                              backgroundColor: colors.bg, 
                              border: colors.border,
                              padding: '1px 4px', 
                              borderRadius: '3px', 
                              fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}>
                              {timeStr}
                            </span>
                          )}
                          <span style={{ 
                            textDecoration: t.status === 'done' ? 'line-through' : 'none', 
                            color: t.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)', 
                            textOverflow: 'ellipsis', 
                            overflow: 'hidden', 
                            whiteSpace: 'nowrap',
                            flex: 1
                          }}>
                            {t.title}
                            {totalSub > 0 && ` (${completedSub}/${totalSub})`}
                          </span>
                        </div>
                      );
                    })}

                    {/* Render Habits */}
                    {events.habits.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-warning)' }}>
                        <Activity size={12} />
                        <span>Đã hoàn thành {events.habits.length} thói quen</span>
                      </div>
                    )}

                    {/* Render Financials */}
                    {events.incomes.map(inc => (
                      <div key={inc.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-success)' }}>
                        <DollarSign size={12} />
                        <span>+{inc.amount} (Thu nhập)</span>
                      </div>
                    ))}
                    {events.expenses.map(exp => (
                      <div key={exp.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-danger)' }}>
                        <DollarSign size={12} />
                        <span>-${exp.amount} ({exp.notes})</span>
                      </div>
                    ))}

                    {events.totalCount === 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', display: 'block', marginTop: '2rem' }}>
                        Không có sự kiện
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // --- Day View Timeline ---
        <div className="glass-panel" style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            {previousMode && (
              <button 
                onClick={() => onModeChange && onModeChange(previousMode)}
                className="btn-secondary"
                style={{
                  padding: '0.3rem 0.6rem',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-glass)'
                }}
                title={`Quay lại chế độ xem ${previousMode === 'month' ? 'Tháng' : 'Tuần'}`}
              >
                <ChevronLeft size={12} />
                Quay lại {previousMode === 'month' ? 'Tháng' : 'Tuần'}
              </button>
            )}
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
              Lịch Trình Chi Tiết {currentDate.getDate()}/{currentDate.getMonth()+1}/{currentYear}
            </h3>
          </div>

          {/* Weather Summary Line */}
          {(() => {
            const weather = getDayWeather(getLocalDateStr(currentDate));
            return (
              <div style={{ 
                fontSize: '0.8rem', 
                color: 'var(--text-muted)', 
                textAlign: 'center', 
                padding: '6px 12px', 
                background: 'rgba(255, 255, 255, 0.02)', 
                borderRadius: 'var(--radius-sm)', 
                border: '1px solid var(--border-color)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginBottom: '1.25rem'
              }}>
                <span>Dự báo thời tiết hôm nay:</span>
                <span style={{ color: 'var(--text-primary)' }}>{weather.icon} {weather.text} ({weather.tempMin}°C - {weather.tempMax}°C)</span>
                {weather.hasRain && <span style={{ color: 'var(--accent-danger)' }}>(Cảnh báo có mưa!)</span>}
              </div>
            );
          })()}

          {/* Overdue Tasks Alert Banner */}
          {(() => {
            const todayStr = getLocalDateStr();
            const overdueTasks = tasks.filter(t => t.dueDate && t.dueDate < todayStr && t.status !== 'done');
            if (overdueTasks.length === 0) return null;

            return (
              <div 
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  marginBottom: '1.25rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: overdueExpanded ? '8px' : '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--accent-danger)' }}>
                    <span>⚠️ CẢNH BÁO NHIỆM VỤ QUÁ HẠN</span>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      background: 'var(--accent-danger)', 
                      color: '#fff', 
                      padding: '1px 6px', 
                      borderRadius: '10px' 
                    }}>
                      {overdueTasks.length} nhiệm vụ trễ hạn
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setOverdueExpanded(!overdueExpanded)}
                    style={{
                      border: 'none',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      transition: 'var(--transition-smooth)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                  >
                    {overdueExpanded ? 'Thu gọn' : 'Mở rộng'}
                  </button>
                </div>
                
                {overdueExpanded && (
                  <>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '10px', fontSize: '0.8rem' }}>
                      Bạn có các nhiệm vụ chưa hoàn thành từ những ngày trước. Hãy dời lịch hoặc hoàn thành chúng để tránh dồn ứ công việc!
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {overdueTasks.map(t => {
                        const overdueDays = Math.max(1, Math.ceil((new Date() - new Date(t.dueDate)) / (1000 * 60 * 60 * 24)));
                        return (
                          <div 
                            key={t.id} 
                            style={{ 
                              display: 'flex', 
                              flexDirection: 'column',
                              background: 'rgba(255, 255, 255, 0.02)', 
                              padding: '8px 10px', 
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              gap: '6px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
                                <span style={{ fontWeight: 600, fontSize: '0.8rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {t.title}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--accent-danger)' }}>
                                  Trễ {overdueDays} ngày (Hạn: {formatDayMonth(t.dueDate)} {t.dueTime || ''})
                                  {t.rescheduleHistory && t.rescheduleHistory.length > 0 && ` • Đã dời ${t.rescheduleHistory.length} lần`}
                                </span>
                              </div>

                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={() => {
                                    updateTask(t.id, { status: 'done' });
                                  }}
                                  style={{
                                    background: 'rgba(52, 211, 153, 0.15)',
                                    border: '1px solid rgba(52, 211, 153, 0.3)',
                                    color: 'var(--accent-success)',
                                    padding: '4px 10px',
                                    borderRadius: '4px',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'var(--transition-smooth)'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(52, 211, 153, 0.25)'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(52, 211, 153, 0.15)'}
                                  title="Đánh dấu nhiệm vụ này là Đã xong ngay lập tức"
                                >
                                  Đã xong
                                </button>

                                <button
                                  onClick={() => {
                                    const todayStr = getLocalDateStr();
                                    const now = new Date();
                                    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                                    const confirmReschedule = window.confirm(
                                      `Bạn có muốn dời nhiệm vụ này sang HÔM NAY (${formatDayMonth(todayStr)}) không?`
                                    );
                                    if (confirmReschedule) {
                                      rescheduleTask(t.id, todayStr, currentTimeStr);
                                    }
                                  }}
                                  style={{
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.25)',
                                    color: 'var(--accent-success)',
                                    padding: '4px 10px',
                                    borderRadius: '4px',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'var(--transition-smooth)'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}
                                >
                                  Dời sang hôm nay
                                </button>

                                <button
                                  onClick={() => {
                                    if (activeRescheduleTaskId === t.id) {
                                      setActiveRescheduleTaskId(null);
                                    } else {
                                      setActiveRescheduleTaskId(t.id);
                                      setManualRescheduleDate(t.dueDate || getLocalDateStr());
                                      setManualRescheduleTime(t.dueTime || '');
                                    }
                                  }}
                                  style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-primary)',
                                    padding: '4px 10px',
                                    borderRadius: '4px',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'var(--transition-smooth)'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                >
                                  {activeRescheduleTaskId === t.id ? 'Hủy dời' : 'Dời sang ngày khác'}
                                </button>
                              </div>
                            </div>

                            {/* Inline Reschedule form for this overdue task */}
                            {activeRescheduleTaskId === t.id && (
                              <div 
                                style={{
                                  padding: '8px 10px',
                                  background: 'rgba(9, 10, 18, 0.3)',
                                  borderRadius: '4px',
                                  borderTop: '1px dashed var(--border-color)',
                                  marginTop: '4px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px'
                                }}
                              >
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                                  🗓️ Dời lịch thủ công nhiệm vụ quá hạn
                                </span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: '1 1 120px' }}>
                                    <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Ngày chuyển đến</label>
                                    <input 
                                      type="date" 
                                      value={manualRescheduleDate}
                                      onChange={(e) => setManualRescheduleDate(e.target.value)}
                                      style={{
                                        background: 'rgba(9, 10, 18, 0.6)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        color: 'var(--text-primary)',
                                        padding: '4px 8px',
                                        fontSize: '0.75rem',
                                        outline: 'none',
                                        width: '100%'
                                      }}
                                    />
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100px' }}>
                                    <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Giờ (Tùy chọn)</label>
                                    <input 
                                      type="time" 
                                      value={manualRescheduleTime}
                                      onChange={(e) => setManualRescheduleTime(e.target.value)}
                                      style={{
                                        background: 'rgba(9, 10, 18, 0.6)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        color: 'var(--text-primary)',
                                        padding: '4px 8px',
                                        fontSize: '0.75rem',
                                        outline: 'none',
                                        width: '100%'
                                      }}
                                    />
                                  </div>

                                  <button
                                    onClick={() => {
                                      if (!manualRescheduleDate) {
                                        alert("Vui lòng chọn ngày muốn dời lịch!");
                                        return;
                                      }
                                      const targetTime = manualRescheduleTime || t.dueTime || '09:00';
                                      const numReschedules = t.rescheduleHistory ? t.rescheduleHistory.length : 0;
                                      const confirmMsg = `Bạn đang dời lịch nhiệm vụ chưa hoàn thành này.\n` + 
                                        `Nhiệm vụ này đã bị dời lịch ${numReschedules} lần.\n\n` +
                                        `Bạn có chắc chắn muốn dời sang ngày ${formatDayMonth(manualRescheduleDate)} lúc ${targetTime} không?`;
                                        
                                      const confirmReschedule = window.confirm(confirmMsg);
                                      if (confirmReschedule) {
                                        rescheduleTask(t.id, manualRescheduleDate, targetTime);
                                        setActiveRescheduleTaskId(null);
                                      }
                                    }}
                                    style={{
                                      background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                                      border: 'none',
                                      color: '#ffffff',
                                      padding: '5px 12px',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      height: '28px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'var(--transition-smooth)'
                                    }}
                                  >
                                    Xác nhận
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {(() => {
            const events = getEventsForDate(currentDate);
            const activeTasks = events.tasks.filter(t => t.status !== 'done');
            const completedTasks = events.tasks.filter(t => t.status === 'done');

            const renderTaskItem = (t) => {
              const colors = getTaskStatusColor(t);
              const isExpanded = expandedTaskIds[t.id] === true;
              const totalSub = t.subtasks ? t.subtasks.length : 0;
              const completedSub = t.subtasks ? t.subtasks.filter(s => s.completed).length : 0;
              const percent = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;

              return (
                <div 
                  key={t.id} 
                  onClick={() => setSelectedTaskId && setSelectedTaskId(t.id)}
                  style={{ 
                    fontSize: '0.88rem', 
                    display: 'flex', 
                    flexDirection: 'column',
                    background: selectedTaskId === t.id ? 'rgba(99,102,241,0.06)' : 'var(--bg-glass)', 
                    borderRadius: 'var(--radius-md)',
                    borderTop: `1px solid ${selectedTaskId === t.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    borderRight: `1px solid ${selectedTaskId === t.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    borderBottom: `1px solid ${selectedTaskId === t.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    borderLeft: `3px solid ${colors.text}`,
                    transition: 'var(--transition-smooth)',
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                >
                  {/* Task Main Info Row */}
                  <div 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem', 
                      padding: '8px 10px'
                    }}
                  >
                    {/* Chevron Toggle Button */}
                    {totalSub > 0 ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskExpanded(t.id);
                        }}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '2px',
                          borderRadius: '4px',
                          transition: 'var(--transition-smooth)'
                        }}
                        title={isExpanded ? "Thu gọn bước phụ" : "Xem bước phụ"}
                      >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    ) : (
                      <div style={{ width: '20px' }} />
                    )}

                    {/* Task checkbox */}
                    <button
                      onClick={() => updateTask(t.id, { status: t.status === 'done' ? 'todo' : 'done' })}
                      style={{ 
                        border: 'none', 
                        background: 'none', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: 0, 
                        color: t.status === 'done' ? 'var(--accent-success)' : 'var(--text-muted)' 
                      }}
                    >
                      {t.status === 'done' ? <CheckCircle size={16} /> : <Circle size={16} />}
                    </button>

                    <span style={{ 
                      color: colors.text, 
                      backgroundColor: colors.bg, 
                      border: colors.border,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      minWidth: '90px',
                      textAlign: 'center',
                      whiteSpace: 'nowrap'
                    }}>
                      {t.dueTime ? `${t.dueTime} - ${(() => {
                        const minutes = parseInt(t.timeEstimate) || 0;
                        const [hour, minute] = t.dueTime.split(':').map(Number);
                        const date = new Date();
                        date.setHours(hour, minute + minutes, 0, 0);
                        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                      })()}` : '--:--'}
                    </span>

                    {t.dueTime && (() => {
                      const [hourStr] = t.dueTime.split(':');
                      const hour = parseInt(hourStr) || 12;
                      const weather = getWeatherForHour(getLocalDateStr(currentDate), hour);
                      const outdoor = isOutdoorTask(t);
                      const isRainy = weather.type === 'rainy' || weather.type === 'stormy';

                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                          <span style={{ 
                            fontSize: '0.72rem', 
                            color: 'var(--text-muted)', 
                            background: 'rgba(255,255,255,0.04)', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            fontWeight: 600,
                            whiteSpace: 'nowrap'
                          }} title={`${weather.text} lúc ${t.dueTime}`}>
                            {weather.icon} {weather.temp}°C
                          </span>
                          
                          {outdoor && isRainy && (
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: 'var(--accent-danger)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              whiteSpace: 'nowrap'
                            }} title="Đây là việc ra ngoài và trời sắp mưa/bão! Hãy mang áo mưa.">
                              ⚠️ Trời sắp mưa (mang áo mưa!)
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                      <span style={{ 
                        textDecoration: t.status === 'done' ? 'line-through' : 'none',
                        color: t.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)',
                        fontWeight: 600,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}>
                        {t.title}
                        {t.rescheduleHistory && t.rescheduleHistory.length > 0 && (
                          <span 
                            style={{
                              fontSize: '0.7rem',
                              color: 'var(--accent-warning)',
                              background: 'rgba(245, 158, 11, 0.1)',
                              border: '1px solid rgba(245, 158, 11, 0.25)',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontWeight: 600,
                              marginLeft: '6px',
                              cursor: 'help',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                            title={`Nhiệm vụ này đã bị dời lịch ${t.rescheduleHistory.length} lần:\n` + 
                              t.rescheduleHistory.map((h, i) => 
                                `- Lần ${i+1}: từ ${formatDayMonth(h.fromDate)} ${h.fromTime || ''} đến ${formatDayMonth(h.toDate)} ${h.toTime || ''} (${new Date(h.at).toLocaleDateString('vi-VN')})`
                              ).join('\n')
                            }
                            onClick={(e) => e.stopPropagation()}
                          >
                            ⚠️ Dời lịch {t.rescheduleHistory.length} lần
                          </span>
                        )}
                      </span>

                      {/* Progress bar and indicator */}
                      {totalSub > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <Layers size={10} /> {completedSub}/{totalSub}
                          </span>
                          <div style={{ width: '60px', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '1.5px', overflow: 'hidden' }}>
                            <div style={{ width: `${percent}%`, height: '100%', background: 'var(--accent-secondary)' }} />
                          </div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{percent}%</span>
                        </div>
                      )}
                    </div>

                    {/* Reschedule Trigger Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeRescheduleTaskId === t.id) {
                          setActiveRescheduleTaskId(null);
                        } else {
                          setActiveRescheduleTaskId(t.id);
                          setManualRescheduleDate(t.dueDate || getLocalDateStr());
                          setManualRescheduleTime(t.dueTime || '');
                        }
                      }}
                      style={{
                        border: '1px solid var(--border-color)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        transition: 'var(--transition-smooth)',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.borderColor = 'var(--accent-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                      }}
                      title="Dời lịch nhiệm vụ thủ công"
                    >
                      <CalendarIcon size={12} />
                      <span>Dời lịch</span>
                    </button>

                    {/* Quick Add Subtask Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (quickAddSubtaskId === t.id) {
                          setQuickAddSubtaskId(null);
                          setQuickSubtaskText('');
                        } else {
                          setQuickAddSubtaskId(t.id);
                          setQuickSubtaskText('');
                          if (!isExpanded) {
                            toggleTaskExpanded(t.id);
                          }
                        }
                      }}
                      style={{
                        border: '1px solid var(--border-color)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '26px',
                        height: '26px',
                        borderRadius: '4px',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        transition: 'var(--transition-smooth)',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.color = 'var(--accent-primary)';
                        e.currentTarget.style.borderColor = 'var(--accent-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                      }}
                      title="Thêm nhanh bước phụ"
                    >
                      +
                    </button>
                  </div>

                  {/* Quick Add Subtask Input Panel */}
                  {quickAddSubtaskId === t.id && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '10px 14px',
                        borderTop: '1px dashed var(--border-color)',
                        background: 'rgba(255, 255, 255, 0.015)',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center'
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Nhập tên bước phụ và nhấn Enter..."
                        value={quickSubtaskText}
                        onChange={(e) => setQuickSubtaskText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (quickSubtaskText.trim()) {
                              addSubtask(t.id, quickSubtaskText.trim());
                              setQuickSubtaskText('');
                              setQuickAddSubtaskId(null);
                            }
                          } else if (e.key === 'Escape') {
                            setQuickAddSubtaskId(null);
                            setQuickSubtaskText('');
                          }
                        }}
                        autoFocus
                        style={{
                          flex: 1,
                          background: 'rgba(9, 10, 18, 0.5)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          color: 'var(--text-primary)',
                          padding: '6px 10px',
                          fontSize: '0.8rem',
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={() => {
                          if (quickSubtaskText.trim()) {
                            addSubtask(t.id, quickSubtaskText.trim());
                            setQuickSubtaskText('');
                            setQuickAddSubtaskId(null);
                          }
                        }}
                        style={{
                          background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                          border: 'none',
                          color: '#ffffff',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Thêm
                      </button>
                      <button
                        onClick={() => {
                          setQuickAddSubtaskId(null);
                          setQuickSubtaskText('');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  )}

                  {/* Reschedule Panel */}
                  {activeRescheduleTaskId === t.id && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '12px 14px',
                        borderTop: '1px dashed var(--border-color)',
                        background: 'rgba(255, 255, 255, 0.015)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                          🗓️ DỜI LỊCH NHIỆM VỤ THỦ CÔNG
                        </span>
                        <button
                          onClick={() => setActiveRescheduleTaskId(null)}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 500
                          }}
                        >
                          Đóng
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 150px' }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Ngày muốn chuyển đến</label>
                          <input 
                            type="date" 
                            value={manualRescheduleDate}
                            onChange={(e) => setManualRescheduleDate(e.target.value)}
                            style={{
                              background: 'rgba(9, 10, 18, 0.5)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              color: 'var(--text-primary)',
                              padding: '6px 10px',
                              fontSize: '0.8rem',
                              outline: 'none',
                              width: '100%'
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '120px' }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Giờ (Tùy chọn)</label>
                          <input 
                            type="time" 
                            value={manualRescheduleTime}
                            onChange={(e) => setManualRescheduleTime(e.target.value)}
                            style={{
                              background: 'rgba(9, 10, 18, 0.5)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              color: 'var(--text-primary)',
                              padding: '6px 10px',
                              fontSize: '0.8rem',
                              outline: 'none',
                              width: '100%'
                            }}
                          />
                        </div>

                        <button
                          onClick={() => {
                            if (!manualRescheduleDate) {
                              alert("Vui lòng chọn ngày muốn dời lịch!");
                              return;
                            }
                            
                            // Get target time or fall back to old time or default
                            const targetTime = manualRescheduleTime || t.dueTime || '09:00';
                            const numReschedules = t.rescheduleHistory ? t.rescheduleHistory.length : 0;
                            
                            const confirmMsg = `Bạn đang dời lịch nhiệm vụ chưa hoàn thành này.\n` + 
                              `Nhiệm vụ này đã bị dời lịch ${numReschedules} lần.\n\n` +
                              `Bạn có chắc chắn muốn dời sang ngày ${formatDayMonth(manualRescheduleDate)} lúc ${targetTime} không?`;
                              
                            const confirmReschedule = window.confirm(confirmMsg);
                            if (confirmReschedule) {
                              rescheduleTask(t.id, manualRescheduleDate, targetTime);
                              setActiveRescheduleTaskId(null);
                            }
                          }}
                          style={{
                            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                            border: 'none',
                            color: '#ffffff',
                            padding: '6px 16px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            height: '32px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
                            transition: 'var(--transition-smooth)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          Xác nhận dời
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Subtasks (displayed by default, can be toggled by Chevron) */}
                  {totalSub > 0 && isExpanded && (
                    <div 
                      style={{
                        padding: '6px 8px 6px 2.25rem',
                        borderTop: '1px dashed var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        background: 'rgba(255, 255, 255, 0.01)'
                      }}
                    >
                      {t.subtasks.map(sub => (
                        <div 
                          key={sub.id} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            padding: '2px 0',
                            fontSize: '0.78rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                            {(() => {
                              const isFocusing = focusSessions.some(s => s.taskId === t.id && s.subtaskId === sub.id && s.isActive);
                              return (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isFocusing) {
                                      const session = focusSessions.find(s => s.taskId === t.id && s.subtaskId === sub.id);
                                      if (session) toggleFocusSession(session.id);
                                    } else {
                                      startFocusOnTask(t.id, sub.id);
                                    }
                                  }}
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    color: isFocusing ? 'var(--accent-success)' : 'var(--accent-primary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: 0,
                                    width: '12px',
                                    justifyContent: 'center'
                                  }}
                                  title={isFocusing ? "Đang tập trung. Click để tạm dừng." : "Bắt đầu làm (Pomodoro)"}
                                >
                                  {isFocusing ? (
                                    <span style={{ 
                                      display: 'inline-block',
                                      width: '6px',
                                      height: '6px',
                                      borderRadius: '50%',
                                      background: 'var(--accent-success)',
                                      boxShadow: '0 0 6px var(--accent-success)'
                                    }} />
                                  ) : (
                                    <Play size={10} fill="var(--accent-primary)" />
                                  )}
                                </button>
                              );
                            })()}

                            <input 
                              type="checkbox"
                              checked={sub.completed}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleSubtask(t.id, sub.id);
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                            
                            <span style={{ 
                              textDecoration: sub.completed ? 'line-through' : 'none', 
                              color: sub.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              flex: 1
                            }}>
                              {sub.title}
                            </span>
                          </div>
                          
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: '4px', flexShrink: 0 }}>
                            ({sub.actualTime || 0}m/{sub.estimatedTime || 30}m)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Tasks section */}
                <div>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--accent-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginBottom: '0.75rem', fontWeight: 700 }}>
                    <CheckSquare size={16} /> Nhiệm vụ ({activeTasks.length})
                  </h4>
                  
                  {activeTasks.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {activeTasks.map(t => renderTaskItem(t))}
                    </div>
                  ) : (
                    activeTasks.length === 0 && completedTasks.length === 0 && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', paddingLeft: '4px' }}>
                        Không có nhiệm vụ trong ngày
                      </span>
                    )
                  )}

                  {completedTasks.length > 0 && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <h5 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', borderBottom: '1px dashed var(--border-color)', paddingBottom: '4px', marginBottom: '0.75rem', fontWeight: 700 }}>
                        <CheckCircle size={14} style={{ color: 'var(--accent-success)' }} /> Đã hoàn thành ({completedTasks.length})
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.8 }}>
                        {completedTasks.map(t => renderTaskItem(t))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

    </div>
  );
}

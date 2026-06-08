import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Award, 
  TrendingUp, 
  Check, 
  Activity, 
  Heart, 
  BookOpen, 
  Target, 
  Sparkles 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import BookReader from './BookReader';

export default function HabitTracker() {
  const { 
    habits, 
    habitLogs, 
    addHabit, 
    deleteHabit, 
    toggleHabitLog, 
    getHabitStats,
    isReaderFullscreen
  } = useApp();

  const [filterCategory, setFilterCategory] = useState('all');
  const [subTab, setSubTab] = useState('habits'); // 'habits' | 'books'

  // Habit Add Form State
  const [habitName, setHabitName] = useState('');
  const [habitDesc, setHabitDesc] = useState('');
  const [habitCategory, setHabitCategory] = useState('personal'); // 'health' | 'learn' | 'financial' | 'personal'
  const [habitIcon, setHabitIcon] = useState('🧘');
  const [habitColor, setHabitColor] = useState('#10b981');
  const [habitDays, setHabitDays] = useState(7); // default daily

  const todayStr = new Date().toISOString().split('T')[0];

  const handleCreateHabit = (e) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    addHabit({
      name: habitName.trim(),
      description: habitDesc.trim(),
      category: habitCategory,
      icon: habitIcon,
      color: habitColor,
      frequency: habitDays === 7 ? 'daily' : 'custom',
      targetDays: parseInt(habitDays)
    });

    setHabitName('');
    setHabitDesc('');
  };

  // Categories helper details
  const categories = [
    { id: 'all', name: 'Tất cả' },
    { id: 'health', name: 'Sức khỏe', icon: Heart },
    { id: 'learn', name: 'Học tập', icon: BookOpen },
    { id: 'personal', name: 'Cá nhân', icon: Target }
  ];

  const filteredHabits = filterCategory === 'all' 
    ? habits 
    : habits.filter(h => h.category === filterCategory);

  // Helper to generate last 30 days list
  const getLast30Days = () => {
    const dates = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };
  const last30Days = getLast30Days();

  if (isReaderFullscreen) {
    return <BookReader />;
  }

  return (
    <div className="slide-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Page Title & Category Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>
              {subTab === 'habits' ? 'Theo Dõi Thói Quen' : 'Đọc Sách'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              {subTab === 'habits' 
                ? 'Xây dựng lối sống lành mạnh qua chuỗi ngày rèn luyện liên tục.' 
                : 'Đọc sách trực tuyến, lập lịch trình đọc và theo dõi tiến độ của bạn.'}
            </p>
          </div>

          {/* Sub-tab switcher */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px',
            gap: '2px',
            height: 'fit-content'
          }}>
            {[
              { id: 'habits', label: 'Thói quen' },
              { id: 'books', label: 'Đọc sách' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                style={{
                  border: 'none',
                  background: subTab === tab.id ? 'var(--border-color)' : 'transparent',
                  color: 'var(--text-primary)',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Pills (Only visible when subTab is 'habits') */}
        {subTab === 'habits' && (
          <div style={{
            display: 'flex',
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-color)',
            borderRadius: '24px',
            padding: '4px',
            gap: '2px'
          }}>
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  style={{
                    border: 'none',
                    background: filterCategory === cat.id 
                      ? 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)' 
                      : 'transparent',
                    color: filterCategory === cat.id ? '#fff' : 'var(--text-secondary)',
                    padding: '0.4rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  {Icon && <Icon size={12} />}
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {subTab === 'habits' ? (
        /* Main Grid: Habit panels & Create form */
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
        
        {/* Left pane: Habits cards details list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredHabits.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Chưa có thói quen nào thuộc danh mục này. Hãy thêm mới bên cạnh!
            </div>
          ) : (
            filteredHabits.map(habit => {
              const stats = getHabitStats(habit.id);
              const isCompletedToday = habitLogs.some(log => log.habitId === habit.id && log.date === todayStr && log.completed);

              return (
                <div 
                  key={habit.id} 
                  className="glass-panel" 
                  style={{
                    padding: '1.25rem',
                    borderLeft: `5px solid ${habit.color}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    position: 'relative'
                  }}
                >
                  {/* Top line: Info, icon, status checkbox */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div style={{ fontSize: '1.85rem' }}>{habit.icon}</div>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {habit.name}
                          {stats.currentStreak >= 5 && (
                            <span style={{ fontSize: '0.7rem', background: 'rgba(251,191,36,0.12)', color: 'var(--accent-warning)', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}>
                              <Sparkles size={10} fill="var(--accent-warning)" /> STREAK {stats.currentStreak}d
                            </span>
                          )}
                        </h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{habit.description || 'Không có mô tả'}</p>
                      </div>
                    </div>

                    {/* Completion trigger */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <button
                        onClick={() => toggleHabitLog(habit.id, todayStr)}
                        style={{
                          border: `2px solid ${isCompletedToday ? habit.color : 'var(--border-color)'}`,
                          background: isCompletedToday ? habit.color : 'var(--bg-glass)',
                          color: isCompletedToday ? '#fff' : 'transparent',
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: isCompletedToday ? `0 0 10px ${habit.color}60` : 'none',
                          transition: 'var(--transition-smooth)'
                        }}
                      >
                        <Check size={18} strokeWidth={3} style={{ color: isCompletedToday ? '#fff' : 'transparent' }} />
                      </button>

                      <button
                        onClick={() => deleteHabit(habit.id)}
                        style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        title="Xóa thói quen"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Middle Line: Streak stats badges */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.75rem',
                    background: 'var(--bg-glass)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Activity size={14} style={{ color: 'var(--accent-primary)' }} />
                      <span>Chuỗi hiện tại: <strong>{stats.currentStreak} ngày</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Award size={14} style={{ color: 'var(--accent-warning)' }} />
                      <span>Kỷ lục: <strong>{stats.longestStreak} ngày</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TrendingUp size={14} style={{ color: 'var(--accent-success)' }} />
                      <span>Tỉ lệ (30 ngày): <strong>{stats.completionRate}%</strong></span>
                    </div>
                  </div>

                  {/* GitHub-style Habit Grid Tracker (Last 30 Days) */}
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.45rem' }}>LỊCH TRÌNH HOÀN THÀNH (30 NGÀY QUA)</span>
                    <div style={{
                      display: 'flex',
                      gap: '4px',
                      flexWrap: 'wrap',
                      background: 'rgba(0, 0, 0, 0.05)',
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      {last30Days.map(dateStr => {
                        const isDone = habitLogs.some(log => log.habitId === habit.id && log.date === dateStr && log.completed);
                        // Get day initials for tooltips
                        const dateObj = new Date(dateStr);
                        const label = `${dateObj.getDate()}/${dateObj.getMonth()+1}`;

                        return (
                          <div
                            key={dateStr}
                            style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '3px',
                              background: isDone ? habit.color : 'var(--border-color)',
                              opacity: isDone ? 1 : 0.25,
                              boxShadow: isDone ? `0 0 5px ${habit.color}80` : 'none',
                              cursor: 'pointer',
                              position: 'relative'
                            }}
                            onClick={() => toggleHabitLog(habit.id, dateStr)}
                            title={`${label}: ${isDone ? 'Hoàn thành' : 'Chưa hoàn thành'}`}
                          />
                        );
                      })}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Right pane: Create habit form */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem' }}>Tạo thói quen mới</h3>
          
          <form onSubmit={handleCreateHabit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tên thói quen</label>
              <input 
                type="text"
                required
                placeholder="Ví dụ: Đọc sách, Thiền..."
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.88rem', marginTop: '0.25rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Mô tả chi tiết</label>
              <textarea 
                placeholder="Mô tả mục tiêu thói quen..."
                value={habitDesc}
                onChange={(e) => setHabitDesc(e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.88rem', marginTop: '0.25rem', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Danh mục</label>
                <select
                  value={habitCategory}
                  onChange={(e) => setHabitCategory(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.85rem', marginTop: '0.25rem' }}
                >
                  <option value="personal">Cá nhân / Tinh thần</option>
                  <option value="health">Sức khỏe / Thể chất</option>
                  <option value="learn">Học tập / Phát triển</option>
                  <option value="financial">Tài chính / Tiết kiệm</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Chu kỳ mục tiêu</label>
                <select
                  value={habitDays}
                  onChange={(e) => setHabitDays(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.85rem', marginTop: '0.25rem' }}
                >
                  <option value={7}>Hàng ngày (7 ngày/tuần)</option>
                  <option value={5}>5 ngày / tuần</option>
                  <option value={3}>3 ngày / tuần</option>
                  <option value={1}>1 ngày / tuần</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Màu sắc đại diện</label>
                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                  {['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#a855f7'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setHabitColor(color)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: color,
                        border: habitColor === color ? '2px solid #fff' : 'none',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Biểu tượng (Icon)</label>
                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                  {['🧘', '🏋️', '📚', '💰', '🥦'].map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setHabitIcon(icon)}
                      style={{
                        fontSize: '1.1rem',
                        background: habitIcon === icon ? 'var(--border-color)' : 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        padding: '2px 4px'
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
            >
              <Plus size={16} /> Thêm thói quen
            </button>
          </form>
        </div>

        </div>
      ) : (
        <BookReader />
      )}
    </div>
  );
}

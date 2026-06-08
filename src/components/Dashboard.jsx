import React from 'react';
import { 
  CheckSquare, 
  Clock, 
  DollarSign, 
  Activity, 
  TrendingUp, 
  BrainCircuit, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingDown
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Dashboard({ setActiveTab }) {
  const { 
    tasks, 
    pomodoros, 
    expenses, 
    incomes, 
    habits, 
    habitLogs, 
    getAISuggestions,
    getHabitStats,
    user
  } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  // --- Calculations for Today ---
  const todayTasks = tasks.filter(t => t.dueDate === todayStr);
  const completedTodayTasks = todayTasks.filter(t => t.status === 'done');
  const taskProgress = todayTasks.length > 0 
    ? Math.round((completedTodayTasks.length / todayTasks.length) * 100) 
    : 0;

  // Today Pomodoro focus minutes
  const todayPomodoros = pomodoros.filter(p => p.createdAt.startsWith(todayStr));
  const focusMinutesToday = todayPomodoros.reduce((sum, p) => sum + p.focusTime, 0);
  const hoursWorkToday = (focusMinutesToday / 60).toFixed(1);

  // Today Income and Expenses
  const todayExpenses = expenses.filter(e => e.date === todayStr);
  const amountSpentToday = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const pomodoroEarningsToday = todayPomodoros.reduce((sum, p) => sum + (p.moneyEarned || 0), 0);
  const directIncomeToday = incomes.filter(i => i.date === todayStr).reduce((sum, i) => sum + i.amount, 0);
  const totalEarnedToday = pomodoroEarningsToday + directIncomeToday;

  // Habits today
  const activeHabitsCount = habits.length;
  const completedHabitsToday = habitLogs.filter(log => log.date === todayStr && log.completed).length;
  const habitProgress = activeHabitsCount > 0 
    ? Math.round((completedHabitsToday / activeHabitsCount) * 100) 
    : 0;

  const aiInsights = getAISuggestions();

  // --- Financial Chart Data (Last 7 Days) ---
  const getPast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const last7Days = getPast7Days();
  const chartData = last7Days.map(dateStr => {
    const dayIncomes = incomes.filter(i => i.date === dateStr).reduce((sum, i) => sum + i.amount, 0);
    const dayPomodoroEarnings = pomodoros.filter(p => p.createdAt.startsWith(dateStr)).reduce((sum, p) => sum + (p.moneyEarned || 0), 0);
    const dayExpenses = expenses.filter(e => e.date === dateStr).reduce((sum, e) => sum + e.amount, 0);
    
    // Day display name
    const d = new Date(dateStr);
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const label = `${dayNames[d.getDay()]} (${d.getDate()}/${d.getMonth()+1})`;
    
    return {
      label,
      income: dayIncomes + dayPomodoroEarnings,
      expense: dayExpenses
    };
  });

  const maxChartValue = Math.max(...chartData.map(d => Math.max(d.income, d.expense, 50)));

  const isMobile = window.innerWidth <= 768;

  return (
    <div className="slide-in" style={{ padding: isMobile ? '1rem' : '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header Greeting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: isMobile ? '1.3rem' : '1.85rem', fontWeight: 800, margin: 0 }}>Chào, {user.name}! 👋</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '0.4rem 0.75rem',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          Tỉ giá/giờ: <span style={{ color: 'var(--accent-success)' }}>${user.hourlyRate}/h</span>
        </div>
      </div>

      {/* Grid of Key Stats Card */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        {/* Tasks Stats Card */}
        <div className="glass-panel" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Nhiệm Vụ Hôm Nay</span>
            <div style={{ color: 'var(--accent-primary)', background: 'rgba(99,102,241,0.1)', padding: '6px', borderRadius: '8px' }}>
              <CheckSquare size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{completedTodayTasks.length}/{todayTasks.length}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>đã xong</span>
          </div>
          {/* Progress Bar */}
          <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', marginTop: '1rem', overflow: 'hidden' }}>
            <div style={{ width: `${taskProgress}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: '3px', transition: 'var(--transition-smooth)' }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>Hoàn thành {taskProgress}%</span>
        </div>

        {/* Pomodoro Focus Card */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Tập Trung Hôm Nay</span>
            <div style={{ color: 'var(--accent-secondary)', background: 'rgba(139,92,246,0.1)', padding: '6px', borderRadius: '8px' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{hoursWorkToday} h</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>({focusMinutesToday} phút)</span>
          </div>
          {/* Progress circle representation placeholder in tiny */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
            <TrendingUp size={14} style={{ color: 'var(--accent-success)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Khoảng {todayPomodoros.length} phiên làm việc
            </span>
          </div>
        </div>

        {/* Daily Earnings Card */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Thu Nhập Hôm Nay</span>
            <div style={{ color: 'var(--accent-success)', background: 'rgba(52,211,153,0.1)', padding: '6px', borderRadius: '8px' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800 }} className="gradient-text">${totalEarnedToday}</span>
            {pomodoroEarningsToday > 0 && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(${pomodoroEarningsToday} Pomodoro)</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-success)', marginTop: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
            <ArrowUpRight size={14} />
            <span>+{directIncomeToday > 0 ? `$${directIncomeToday} trực tiếp` : 'Hiệu suất tốt'}</span>
          </div>
        </div>

        {/* Habits Progress Card */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Thói Quen Hôm Nay</span>
            <div style={{ color: 'var(--accent-warning)', background: 'rgba(251,191,36,0.1)', padding: '6px', borderRadius: '8px' }}>
              <Activity size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{completedHabitsToday}/{activeHabitsCount}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>đã làm</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', marginTop: '1rem', overflow: 'hidden' }}>
            <div style={{ width: `${habitProgress}%`, height: '100%', background: 'var(--accent-warning)', borderRadius: '3px', transition: 'var(--transition-smooth)' }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>Hoàn thành {habitProgress}%</span>
        </div>
      </div>

      {/* Main Section: Chart & AI Insights */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr',
        gap: '1.5rem'
      }}>
        {/* Finance Chart (Last 7 Days) */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Thu Nhập & Chi Tiêu (7 Ngày Qua)</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Thống kê tổng doanh thu (gồm cả phiên Pomodoro) vs chi phí.</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'var(--accent-success)', borderRadius: '3px' }} />
                Thu nhập
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'var(--accent-danger)', borderRadius: '3px' }} />
                Chi tiêu
              </span>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div style={{
            display: 'flex',
            height: '240px',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            padding: '1rem 0.5rem 0.5rem',
            borderBottom: '1px solid var(--border-color)',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            {chartData.map((data, idx) => {
              const incomeHeight = Math.max(5, (data.income / maxChartValue) * 180);
              const expenseHeight = Math.max(5, (data.expense / maxChartValue) * 180);

              return (
                <div key={idx} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  height: '100%',
                  justifyContent: 'flex-end'
                }}>
                  {/* Bars Container */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', width: '100%', justifyContent: 'center' }}>
                    {/* Income Bar */}
                    <div style={{
                      width: '14px',
                      height: `${incomeHeight}px`,
                      background: 'linear-gradient(to top, var(--accent-success), #10b981)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'var(--transition-smooth)',
                      position: 'relative'
                    }} title={`Thu nhập: $${data.income}`}>
                      {data.income > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '-20px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          color: 'var(--accent-success)'
                        }}>${Math.round(data.income)}</div>
                      )}
                    </div>
                    {/* Expense Bar */}
                    <div style={{
                      width: '14px',
                      height: `${expenseHeight}px`,
                      background: 'linear-gradient(to top, var(--accent-danger), #ef4444)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'var(--transition-smooth)',
                      position: 'relative'
                    }} title={`Chi tiêu: $${data.expense}`}>
                      {data.expense > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '-20px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          color: 'var(--accent-danger)'
                        }}>${Math.round(data.expense)}</div>
                      )}
                    </div>
                  </div>
                  {/* Label */}
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.75rem', whiteSpace: 'nowrap' }}>
                    {data.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI & Suggestions */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BrainCircuit size={20} style={{ color: 'var(--accent-secondary)' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Gợi Ý & Phân Tích AI</h3>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            overflowY: 'auto',
            maxHeight: '260px',
            paddingRight: '4px'
          }}>
            {aiInsights.map((insight) => (
              <div 
                key={insight.id}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: insight.type === 'task' ? 'var(--accent-primary)' : (insight.type === 'budget' ? 'var(--accent-success)' : 'var(--accent-warning)'),
                    background: insight.type === 'task' ? 'rgba(99,102,241,0.1)' : (insight.type === 'budget' ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)'),
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {insight.type === 'task' ? 'Nhiệm vụ' : (insight.type === 'budget' ? 'Ngân sách' : 'Thói quen')}
                  </span>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>{insight.title}</h4>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {insight.description}
                </p>
                {insight.actionable && (
                  <button 
                    onClick={() => setActiveTab(insight.type === 'task' ? 'tasks' : 'habits')}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--accent-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      marginTop: '0.25rem',
                      padding: 0,
                      width: 'fit-content'
                    }}
                  >
                    Thực hiện ngay <ArrowUpRight size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

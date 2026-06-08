import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Calculator, 
  AlertCircle,
  Percent,
  Calendar,
  PiggyBank
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GEMINI_MODELS } from '../utils/aiPricing';

export default function FinanceTracker() {
  const { 
    expenses, 
    incomes, 
    addExpense, 
    deleteExpense, 
    addIncome, 
    deleteIncome, 
    tasks, 
    user,
    aiUsageLogs,
    syncAiCostsToExpenses
  } = useApp();

  // Active form toggles
  const [transactionType, setTransactionType] = useState('expense'); // 'expense' | 'income'
  
  // Expense Form State
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Needs'); // 'Needs' | 'Wants' | 'Savings'
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [linkedTaskId, setLinkedTaskId] = useState('');

  // Income Form State
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeSource, setIncomeSource] = useState('Freelance'); // 'Salary' | 'Freelance' | 'Business'
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);

  // Opportunity Cost Calculator State
  const [oppCostAmount, setOppCostAmount] = useState('100');

  // Filter State
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM

  // --- Transactions Lists ---
  const filteredExpenses = expenses.filter(e => e.date.startsWith(selectedMonth));
  const filteredIncomes = incomes.filter(i => i.date.startsWith(selectedMonth));

  // --- 50/30/20 Budget Calculations ---
  const totalIncomeMonth = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenseMonth = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Budget allocations
  const budgetNeedsLimit = totalIncomeMonth * 0.50 || 1500; // default bounds if no income
  const budgetWantsLimit = totalIncomeMonth * 0.30 || 900;
  const budgetSavingsLimit = totalIncomeMonth * 0.20 || 600;

  // Actual spent per category
  const spentNeeds = filteredExpenses.filter(e => e.category === 'Needs').reduce((sum, e) => sum + e.amount, 0);
  const spentWants = filteredExpenses.filter(e => e.category === 'Wants').reduce((sum, e) => sum + e.amount, 0);
  const spentSavings = filteredExpenses.filter(e => e.category === 'Savings').reduce((sum, e) => sum + e.amount, 0);

  const getPercent = (spent, limit) => {
    return Math.min(100, Math.round((spent / limit) * 100)) || 0;
  };

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (transactionType === 'expense') {
      if (!expenseAmount || parseFloat(expenseAmount) <= 0) return;
      addExpense({
        amount: parseFloat(expenseAmount),
        category: expenseCategory,
        notes: expenseNotes,
        date: expenseDate,
        taskId: linkedTaskId || null
      });
      setExpenseAmount('');
      setExpenseNotes('');
      setLinkedTaskId('');
    } else {
      if (!incomeAmount || parseFloat(incomeAmount) <= 0) return;
      addIncome({
        amount: parseFloat(incomeAmount),
        source: incomeSource,
        date: incomeDate,
        recurring: isRecurring
      });
      setIncomeAmount('');
      setIsRecurring(false);
    }
  };

  // Calculator logic
  const hourlyRate = user.hourlyRate || 50;
  const equivalentHours = (parseFloat(oppCostAmount) / hourlyRate).toFixed(1);

  const isMobile = window.innerWidth <= 768;

  return (
    <div className="slide-in" style={{ padding: isMobile ? '0.75rem' : '1.5rem', display: 'flex', flexDirection: 'column', gap: isMobile ? '0.75rem' : '1.5rem' }}>

      {/* Top filter month & Summary stats card */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: isMobile ? '1.2rem' : '1.85rem', fontWeight: 800, margin: 0 }}>{isMobile ? 'Tài Chính' : 'Quản Lý Tài Chính'}</h2>
          {!isMobile && <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Ứng dụng nguyên tắc ngân sách 50/30/20 để tích lũy tài sản.</p>}
        </div>

        {/* Month Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              padding: '0.5rem',
              borderRadius: '8px',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              fontWeight: 600
            }}
          />
        </div>
      </div>

      {/* Overview Balance Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        
        {/* Income Card */}
        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Thu Nhập Tháng</span>
            <TrendingUp size={20} style={{ color: 'var(--accent-success)' }} />
          </div>
          <h3 style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.5rem' }} className="gradient-text">${totalIncomeMonth}</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
            Tổng dòng tiền vào trong tháng {selectedMonth}
          </span>
        </div>

        {/* Expenses Card */}
        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Chi Tiêu Tháng</span>
            <TrendingDown size={20} style={{ color: 'var(--accent-danger)' }} />
          </div>
          <h3 style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.5rem' }}>${totalExpenseMonth}</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
            Tỷ lệ chi tiêu: {totalIncomeMonth > 0 ? Math.round((totalExpenseMonth / totalIncomeMonth) * 100) : 0}% thu nhập
          </span>
        </div>

        {/* Net Savings Card */}
        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Tích Lũy Ròng</span>
            <PiggyBank size={20} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h3 style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.5rem', color: totalIncomeMonth - totalExpenseMonth >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
            ${totalIncomeMonth - totalExpenseMonth}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
            {totalIncomeMonth - totalExpenseMonth >= 0 ? '👍 Đang tích lũy dương' : '⚠️ Cảnh báo chi vượt thu'}
          </span>
        </div>
      </div>

      {/* Main Grid: 50/30/20 meters & Log Transaction Form */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: isMobile ? '0.75rem' : '1.5rem', alignItems: 'flex-start' }}>
        
        {/* Left: 50/30/20 rule visual progress and transaction log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* 50/30/20 Allocation progress cards */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Ngân Sách 50 / 30 / 20</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '-0.75rem' }}>
              Phân bổ dòng tiền lý tưởng: 50% Thiết yếu (Needs), 30% Sở thích (Wants), 20% Tiết kiệm (Savings).
            </p>

            {/* Needs Row (50%) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? '0.78rem' : '0.85rem', fontWeight: 600 }}>
                <span>{isMobile ? 'Thiết Yếu - 50%' : 'Thiết Yếu (Needs) - 50%'}</span>
                <span style={{ color: spentNeeds > budgetNeedsLimit ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
                  ${spentNeeds} / ${Math.round(budgetNeedsLimit)}
                </span>
              </div>
              <div style={{ width: '100%', height: '10px', background: 'var(--border-color)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{
                  width: `${getPercent(spentNeeds, budgetNeedsLimit)}%`,
                  height: '100%',
                  background: spentNeeds > budgetNeedsLimit ? 'var(--accent-danger)' : 'var(--accent-success)',
                  borderRadius: '5px',
                  transition: 'var(--transition-smooth)'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>Tiền thuê nhà, thực phẩm, đi lại, hóa đơn</span>
                <span>{getPercent(spentNeeds, budgetNeedsLimit)}% đã dùng</span>
              </div>
            </div>

            {/* Wants Row (30%) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? '0.78rem' : '0.85rem', fontWeight: 600 }}>
                <span>{isMobile ? 'Sở Thích - 30%' : 'Sở Thích (Wants) - 30%'}</span>
                <span style={{ color: spentWants > budgetWantsLimit ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
                  ${spentWants} / ${Math.round(budgetWantsLimit)}
                </span>
              </div>
              <div style={{ width: '100%', height: '10px', background: 'var(--border-color)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{
                  width: `${getPercent(spentWants, budgetWantsLimit)}%`,
                  height: '100%',
                  background: spentWants > budgetWantsLimit ? 'var(--accent-danger)' : 'var(--accent-primary)',
                  borderRadius: '5px',
                  transition: 'var(--transition-smooth)'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>Ăn uống ngoài, cafe, mua sắm giải trí</span>
                <span>{getPercent(spentWants, budgetWantsLimit)}% đã dùng</span>
              </div>
            </div>

            {/* Savings Row (20%) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? '0.78rem' : '0.85rem', fontWeight: 600 }}>
                <span>{isMobile ? 'Tiết Kiệm - 20%' : 'Tích Lũy & Trả Nợ (Savings) - 20%'}</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  ${spentSavings} / ${Math.round(budgetSavingsLimit)}
                </span>
              </div>
              <div style={{ width: '100%', height: '10px', background: 'var(--border-color)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{
                  width: `${getPercent(spentSavings, budgetSavingsLimit)}%`,
                  height: '100%',
                  background: 'var(--accent-warning)',
                  borderRadius: '5px',
                  transition: 'var(--transition-smooth)'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>Tiết kiệm, đầu tư cổ phiếu, quỹ khẩn cấp</span>
                <span>{getPercent(spentSavings, budgetSavingsLimit)}% mục tiêu</span>
              </div>
            </div>

          </div>

          {/* Transactions History List */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Lịch Sử Giao Dịch</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
              {/* Income listing */}
              {filteredIncomes.map(inc => (
                <div 
                  key={inc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ color: 'var(--accent-success)', background: 'rgba(52,211,153,0.1)', padding: '6px', borderRadius: '50%' }}>
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{inc.source === 'Salary' ? 'Lương' : (inc.source === 'Freelance' ? 'Freelance dự án' : 'Doanh thu kinh doanh')}</span>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{inc.date}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-success)' }}>+${inc.amount}</span>
                    <button 
                      onClick={() => deleteIncome(inc.id)}
                      style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Expenses listing */}
              {filteredExpenses.map(exp => (
                <div 
                  key={exp.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ color: 'var(--accent-danger)', background: 'rgba(239,68,68,0.1)', padding: '6px', borderRadius: '50%' }}>
                      <TrendingDown size={16} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{exp.notes || 'Chi tiêu không tên'}</span>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{exp.date}</span>
                        <span style={{
                          fontSize: '0.65rem',
                          background: exp.category === 'Needs' ? 'rgba(52,211,153,0.1)' : (exp.category === 'Wants' ? 'rgba(99,102,241,0.1)' : 'rgba(251,191,36,0.1)'),
                          color: exp.category === 'Needs' ? 'var(--accent-success)' : (exp.category === 'Wants' ? 'var(--accent-primary)' : 'var(--accent-warning)'),
                          padding: '0 4px',
                          borderRadius: '3px'
                        }}>{exp.category}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-danger)' }}>-${exp.amount}</span>
                    <button 
                      onClick={() => deleteExpense(exp.id)}
                      style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {filteredExpenses.length === 0 && filteredIncomes.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Không có giao dịch nào trong tháng {selectedMonth}.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Pane: Add Transaction & Opportunity Cost Calculator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Add transaction card */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem' }}>Ghi nhận giao dịch</h3>
            
            {/* Tab select type */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '2px',
              marginBottom: '1rem'
            }}>
              <button
                onClick={() => setTransactionType('expense')}
                style={{
                  flex: 1,
                  border: 'none',
                  background: transactionType === 'expense' ? 'var(--border-color)' : 'transparent',
                  color: 'var(--text-primary)',
                  padding: '5px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Chi phí (-)
              </button>
              <button
                onClick={() => setTransactionType('income')}
                style={{
                  flex: 1,
                  border: 'none',
                  background: transactionType === 'income' ? 'var(--border-color)' : 'transparent',
                  color: 'var(--text-primary)',
                  padding: '5px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Thu nhập (+)
              </button>
            </div>

            <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Số tiền ($)</label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={transactionType === 'expense' ? expenseAmount : incomeAmount}
                  onChange={(e) => transactionType === 'expense' ? setExpenseAmount(e.target.value) : setIncomeAmount(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.88rem', marginTop: '0.25rem' }}
                />
              </div>

              {transactionType === 'expense' ? (
                // Expense details
                <>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Danh mục ngân sách</label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.85rem', marginTop: '0.25rem' }}
                    >
                      <option value="Needs">Needs (Chi phí thiết yếu)</option>
                      <option value="Wants">Wants (Sở thích/Giải trí)</option>
                      <option value="Savings">Savings (Tích lũy/Trả nợ)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ghi chú / Mô tả</label>
                    <input 
                      type="text"
                      placeholder="Ví dụ: Mua cafe, đi chợ..."
                      value={expenseNotes}
                      onChange={(e) => setExpenseNotes(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.85rem', marginTop: '0.25rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Liên kết công việc</label>
                    <select
                      value={linkedTaskId}
                      onChange={(e) => setLinkedTaskId(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.85rem', marginTop: '0.25rem' }}
                    >
                      <option value="">-- Không có --</option>
                      {tasks.map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                // Income details
                <>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Nguồn thu nhập</label>
                    <select
                      value={incomeSource}
                      onChange={(e) => setIncomeSource(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.85rem', marginTop: '0.25rem' }}
                    >
                      <option value="Freelance">Freelance (Side Hustle)</option>
                      <option value="Salary">Salary (Công việc chính)</option>
                      <option value="Business">Business (Kinh doanh)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', marginTop: '0.5rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox"
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                      />
                      Thu nhập định kỳ hàng tháng
                    </label>
                  </div>
                </>
              )}

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ngày ghi nhận</label>
                <input 
                  type="date"
                  required
                  value={transactionType === 'expense' ? expenseDate : incomeDate}
                  onChange={(e) => transactionType === 'expense' ? setExpenseDate(e.target.value) : setIncomeDate(e.target.value)}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.8rem', marginTop: '0.25rem' }}
                />
              </div>

              <button 
                type="submit"
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                  color: '#fff',
                  borderRadius: '6px',
                  padding: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '0.5rem'
                }}
              >
                Ghi nhận giao dịch
              </button>
            </form>
          </div>

          {/* Opportunity cost calculator card */}
          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-warning)' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
              <Calculator size={18} style={{ color: 'var(--accent-warning)' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Chi Phí Cơ Hội (Thời Gian = Tiền)</h3>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Nhập giá trị món đồ bạn định mua để xem bạn cần tập trung làm việc bao lâu để chi trả cho món đồ đó.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Giá mua: $</span>
              <input 
                type="number"
                value={oppCostAmount}
                onChange={(e) => setOppCostAmount(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.4rem',
                  borderRadius: '6px',
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  fontWeight: 'bold'
                }}
              />
            </div>

            <div style={{
              background: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: '8px',
              padding: '0.75rem',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>TƯƠNG ĐƯƠNG THỜI GIAN TẬP TRUNG</span>
              <span style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--accent-warning)', display: 'block', margin: '4px 0' }}>
                {equivalentHours} giờ
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Dựa trên mức giá làm việc trung bình ${hourlyRate}/h của bạn.
              </span>
            </div>
          </div>

          {/* Widget Đo Lường AI Costs & Token */}
          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.15rem' }}>🧠</span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Đo Lường AI Costs & Token</h3>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Giám sát dòng tiền chi trả cho API Gemini Pro & Flash dựa trên lượng token thực tế tiêu thụ.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
              {/* Thống kê chung */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span>Tổng lượt gọi API:</span>
                <span style={{ fontWeight: 'bold' }}>{(aiUsageLogs || []).length} lần</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span>Tổng Token tiêu thụ:</span>
                <span style={{ fontWeight: 'bold' }}>
                  {((aiUsageLogs || []).reduce((sum, log) => sum + (log.inputTokens || 0) + (log.outputTokens || 0), 0)).toLocaleString()} Tokens
                </span>
              </div>

              {/* Chi tiết chưa kết chuyển */}
              {(() => {
                const unsyncedLogs = (aiUsageLogs || []).filter(log => !log.synced);
                const unsyncedCostUSD = unsyncedLogs.reduce((sum, log) => sum + (log.costUSD || 0), 0);
                const unsyncedCostFormatted = user.currency === 'VND' 
                  ? `${Math.round(unsyncedCostUSD * 25500).toLocaleString('vi-VN')} đ`
                  : `$${unsyncedCostUSD.toFixed(4)}`;

                return (
                  <div style={{
                    background: 'rgba(99, 102, 241, 0.05)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: '8px',
                    padding: '0.65rem',
                    marginTop: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span>Chi phí chưa kết chuyển:</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--accent-success)' }}>{unsyncedCostFormatted}</span>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      ({unsyncedLogs.length} cuộc hội thoại mới chưa hạch toán)
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Breakdown by model */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '150px', overflowY: 'auto', paddingRight: '4px', marginBottom: '1rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Chi tiết theo dòng mô hình:</span>
              
              {GEMINI_MODELS.map(({ id: modelId }) => {
                const modelLogs = (aiUsageLogs || []).filter(log => log.model === modelId);
                if (modelLogs.length === 0) return null;

                const modelTokens = modelLogs.reduce((sum, log) => sum + (log.inputTokens || 0) + (log.outputTokens || 0), 0);
                const modelCostUSD = modelLogs.reduce((sum, log) => sum + (log.costUSD || 0), 0);
                const costFormatted = user.currency === 'VND'
                  ? `${Math.round(modelCostUSD * 25500).toLocaleString('vi-VN')} đ`
                  : `$${modelCostUSD.toFixed(4)}`;

                return (
                  <div key={modelId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '2px 0' }}>
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{modelId.replace('gemini-', '')}</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {modelTokens > 1000 ? `${(modelTokens / 1000).toFixed(1)}k tkn` : `${modelTokens} tkn`} | <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{costFormatted}</span>
                    </span>
                  </div>
                );
              })}

              {(aiUsageLogs || []).length === 0 && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa ghi nhận cuộc gọi nào.</span>
              )}
            </div>

            {/* Sync trigger button */}
            <button
              onClick={() => {
                const res = syncAiCostsToExpenses();
                if (res) {
                  alert('🎉 Kết chuyển chi phí AI thành công vào danh mục chi tiêu!');
                } else {
                  alert('💡 Không có chi phí AI mới nào cần kết chuyển.');
                }
              }}
              disabled={(aiUsageLogs || []).filter(log => !log.synced).length === 0}
              style={{
                width: '100%',
                border: 'none',
                background: 'rgba(99, 102, 241, 0.08)',
                color: 'var(--accent-primary)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '6px',
                padding: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
                opacity: (aiUsageLogs || []).filter(log => !log.synced).length === 0 ? 0.5 : 1
              }}
            >
              Hạch toán vào Chi Tiêu Tháng
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}

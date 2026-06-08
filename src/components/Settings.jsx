import React, { useState } from 'react';
import { 
  User, 
  Settings as SettingsIcon, 
  Database, 
  Download, 
  Upload, 
  RefreshCw,
  Sliders,
  DollarSign,
  Sun,
  Moon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GEMINI_MODELS, DEFAULT_MODEL_ID } from '../utils/aiPricing';

export default function Settings() {
  const { 
    user, setUser, 
    preferences, setPreferences, 
    resetToSeeds 
  } = useApp();

  // User Profile state
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [hourlyRate, setHourlyRate] = useState(user.hourlyRate);
  const [currency, setCurrency] = useState(user.currency);

  // Prefs state
  const [pomoLength, setPomoLength] = useState(preferences.pomodoroDuration);
  const [breakLength, setBreakLength] = useState(preferences.breakDuration);
  const [theme, setTheme] = useState(preferences.theme);
  const [budgetAlertLimit, setBudgetAlertLimit] = useState(preferences.notifyBudgetAlert);
  const [apiKey, setApiKey] = useState(preferences.geminiApiKey || '');
  const [selectedModelId, setSelectedModelId] = useState(preferences.geminiModel || DEFAULT_MODEL_ID);
  const [showApiKey, setShowApiKey] = useState(false);
  const [customAiContext, setCustomAiContext] = useState(preferences.customAiContext || '');
  const [assistantAvatar, setAssistantAvatar] = useState(preferences.assistantAvatar || '/avatars/asian1.png');

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setUser(prev => ({
      ...prev,
      name,
      avatar,
      hourlyRate: parseFloat(hourlyRate) || 0,
      currency
    }));
    alert('🎉 Đã cập nhật hồ sơ cá nhân thành công!');
  };

  const handleSavePrefs = (e) => {
    e.preventDefault();
    setPreferences(prev => ({
      ...prev,
      pomodoroDuration: parseInt(pomoLength),
      breakDuration: parseInt(breakLength),
      theme,
      notifyBudgetAlert: parseInt(budgetAlertLimit),
      geminiApiKey: apiKey,
      geminiModel: selectedModelId,
      customAiContext,
      assistantAvatar
    }));
    alert('🎉 Đã lưu thiết lập hệ thống!');
  };

  // --- Export Database to JSON File ---
  const handleExportJSON = () => {
    const fullDB = {
      tf_projects: JSON.parse(localStorage.getItem('tf_projects')),
      tf_user: JSON.parse(localStorage.getItem('tf_user')),
      tf_preferences: JSON.parse(localStorage.getItem('tf_preferences')),
      tf_tasks: JSON.parse(localStorage.getItem('tf_tasks')),
      tf_habits: JSON.parse(localStorage.getItem('tf_habits')),
      tf_habit_logs: JSON.parse(localStorage.getItem('tf_habit_logs')),
      tf_pomodoros: JSON.parse(localStorage.getItem('tf_pomodoros')),
      tf_expenses: JSON.parse(localStorage.getItem('tf_expenses')),
      tf_incomes: JSON.parse(localStorage.getItem('tf_incomes')),
      tf_boards: JSON.parse(localStorage.getItem('tf_boards')),
      tf_board_columns: JSON.parse(localStorage.getItem('tf_board_columns'))
    };

    const blob = new Blob([JSON.stringify(fullDB, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timeflow_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- Import Database from JSON File ---
  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        
        // Quick validate keys and load to localStorage
        const keys = [
          'tf_projects', 'tf_user', 'tf_preferences', 'tf_tasks', 
          'tf_habits', 'tf_habit_logs', 'tf_pomodoros', 'tf_expenses', 
          'tf_incomes', 'tf_boards', 'tf_board_columns'
        ];
        
        // Loop keys and store
        keys.forEach(k => {
          if (importedData[k]) {
            localStorage.setItem(k, JSON.stringify(importedData[k]));
          }
        });

        alert('🎉 Đã import dữ liệu thành công! Ứng dụng sẽ tải lại trang.');
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert('❌ Định dạng file backup không đúng hoặc bị lỗi!');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('⚠️ Bạn có chắc chắn muốn RESET toàn bộ dữ liệu về mặc định ban đầu không? Mọi dữ liệu tự tạo sẽ bị xóa hoàn toàn.')) {
      resetToSeeds();
      alert('🔄 Đã thiết lập lại dữ liệu gốc thành công!');
      window.location.reload();
    }
  };

  return (
    <div className="slide-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      
      <div>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>Thiết Lập Hệ Thống</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Quản lý tùy chỉnh cá nhân, hiệu suất làm việc và xuất nhập dữ liệu.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* User Profile settings card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={18} style={{ color: 'var(--accent-primary)' }} />
            Hồ Sơ Cá Nhân
          </h3>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tên hiển thị</label>
              <input 
                type="text" 
                required
                value={name} 
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.88rem', marginTop: '0.25rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Đường dẫn ảnh đại diện (URL)</label>
              <input 
                type="text" 
                value={avatar} 
                onChange={(e) => setAvatar(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.88rem', marginTop: '0.25rem' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Mức giá/giờ mặc định ($)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>$</span>
                  <input 
                    type="number" 
                    required
                    value={hourlyRate} 
                    onChange={(e) => setHourlyRate(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.88rem' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loại tiền tệ</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.85rem', marginTop: '0.25rem' }}
                >
                  <option value="USD">USD ($)</option>
                  <option value="VND">VND (đ)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', width: 'fit-content' }}>
              Lưu hồ sơ
            </button>
          </form>
        </div>

        {/* Productivity settings card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sliders size={18} style={{ color: 'var(--accent-secondary)' }} />
            Thiết Lập Hệ Hiệu Suất
          </h3>

          <form onSubmit={handleSavePrefs} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Thời gian Pomodoro (phút)</label>
                <input 
                  type="number" 
                  required
                  value={pomoLength} 
                  onChange={(e) => setPomoLength(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.88rem', marginTop: '0.25rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Thời gian giải lao (phút)</label>
                <input 
                  type="number" 
                  required
                  value={breakLength} 
                  onChange={(e) => setBreakLength(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.88rem', marginTop: '0.25rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Giao diện hiển thị</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setTheme('light');
                    setPreferences(prev => ({ ...prev, theme: 'light' }));
                  }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: theme === 'light' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    background: theme === 'light' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-glass)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <Sun size={16} style={{ color: 'var(--accent-warning)' }} />
                  <span>Sáng</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTheme('dark');
                    setPreferences(prev => ({ ...prev, theme: 'dark' }));
                  }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: theme === 'dark' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    background: theme === 'dark' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-glass)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <Moon size={16} style={{ color: 'var(--accent-secondary)' }} />
                  <span>Tối</span>
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cảnh báo ngân sách khi vượt (%)</label>
              <input 
                type="number" 
                required
                value={budgetAlertLimit} 
                onChange={(e) => setBudgetAlertLimit(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.88rem', marginTop: '0.25rem' }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', width: 'fit-content' }}>
              Lưu thiết lập
            </button>
          </form>
        </div>

        {/* Gemini AI Settings card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <SettingsIcon size={18} style={{ color: 'var(--accent-secondary)' }} />
            Trợ Lý AI Gemini
          </h3>

          <form onSubmit={handleSavePrefs} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Gemini API Key</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input 
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="Nhập API Key từ Google AI Studio..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.88rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-glass)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  {showApiKey ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                💡 Key được lưu an toàn trong trình duyệt của bạn. Lấy key tại <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>Google AI Studio</a>.
              </span>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Chọn mô hình Gemini</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '0.25rem' }}>
                {GEMINI_MODELS.map(m => {
                  const isSelected = selectedModelId === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedModelId(m.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '8px',
                        border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(99,102,241,0.08)' : 'var(--bg-glass)',
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <div style={{
                        width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
                        border: isSelected ? '4px solid var(--accent-primary)' : '2px solid var(--border-color)',
                        background: isSelected ? 'var(--accent-primary)' : 'transparent'
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{m.label}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.desc}</div>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>
                        <div>${m.inputPricePerMillion} in</div>
                        <div>${m.outputPricePerMillion} out</div>
                        <div style={{ fontSize: '0.62rem' }}>/1M tokens</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Chỉ dẫn AI / Hồ sơ Solopreneur của bạn</label>
              <textarea 
                placeholder="Ví dụ: Tôi tên Lương, là Solopreneur vận hành quán Bánh canh cao cấp tại TP.HCM. Tôi hướng tới đối tượng khách hàng văn phòng cận cao cấp, có thói quen tập gym hàng ngày..."
                value={customAiContext}
                onChange={(e) => setCustomAiContext(e.target.value)}
                style={{ width: '100%', height: '100px', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.85rem', resize: 'none', marginTop: '0.25rem', outline: 'none' }}
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                💡 Các thông tin này sẽ được tự động gửi kèm làm dữ liệu nền để Gemini luôn thấu hiểu rõ về bạn và doanh nghiệp của bạn.
              </span>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Ảnh đại diện của Trợ lý Gemini
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                {[
                  { id: 'asian1', name: 'Châu Á 1', path: '/avatars/asian1.png' },
                  { id: 'asian2', name: 'Châu Á 2', path: '/avatars/asian2.png' },
                  { id: 'euro1', name: 'Châu Âu 1', path: '/avatars/euro1.png' },
                  { id: 'euro2', name: 'Châu Âu 2', path: '/avatars/euro2.png' }
                ].map(av => {
                  const isSelected = assistantAvatar === av.path;
                  return (
                    <div 
                      key={av.id}
                      onClick={() => setAssistantAvatar(av.path)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'rgba(0,0,0,0.1)',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <img 
                        src={av.path} 
                        alt={av.name} 
                        style={{ 
                          width: '56px', 
                          height: '56px', 
                          borderRadius: '50%', 
                          objectFit: 'cover',
                          border: isSelected ? '2px solid var(--accent-primary)' : 'none'
                        }} 
                      />
                      <span style={{ fontSize: '0.7rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isSelected ? 600 : 500 }}>
                        {av.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', width: 'fit-content' }}>
              Lưu thiết lập AI
            </button>
          </form>
        </div>

      </div>

      {/* Database utilities card */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-danger)' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Database size={18} style={{ color: 'var(--accent-danger)' }} />
          Dữ Liệu Hệ Thống
        </h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Backup cơ sở dữ liệu local dưới định dạng JSON hoặc khôi phục lại dữ liệu mẫu (seeds) để chạy thử nghiệm các tính năng đầy đủ.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Export JSON */}
          <button 
            onClick={handleExportJSON}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
          >
            <Download size={16} /> Export Backup File
          </button>

          {/* Import JSON file picker button */}
          <label 
            className="btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            <Upload size={16} /> Import Backup File
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportJSON} 
              style={{ display: 'none' }} 
            />
          </label>

          {/* Reset seeds database */}
          <button 
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.05)',
              color: 'var(--accent-danger)',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
          >
            <RefreshCw size={16} /> Reset về dữ liệu mẫu
          </button>
        </div>
      </div>

    </div>
  );
}

import React, { useState } from 'react';
import { 
  Target, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  CheckCircle2, 
  PlusCircle, 
  DollarSign, 
  Clock, 
  ArrowRight, 
  X, 
  Info,
  Activity,
  Briefcase,
  Layers,
  Edit2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEFAULT_MODEL_ID } from '../utils/aiPricing';

export default function OKRs() {
  const {
    tasks,
    incomes,
    expenses,
    projects,
    addTask,
    updateTask,
    objectives,
    keyResults,
    addObjective,
    updateObjective,
    deleteObjective,
    addKeyResult,
    updateKeyResult,
    deleteKeyResult,
    preferences
  } = useApp();

  // Expanded Objective Cards State
  const [expandedObjectiveIds, setExpandedObjectiveIds] = useState(['obj-banhcanh']);

  // Modal States
  const [isObjModalOpen, setIsObjModalOpen] = useState(false);
  const [isKrModalOpen, setIsKrModalOpen] = useState(false);
  const [activeObjectiveIdForKr, setActiveObjectiveIdForKr] = useState(null);

  // Form States
  const [newObjTitle, setNewObjTitle] = useState('');
  const [newObjDescription, setNewObjDescription] = useState('');
  const [newObjCategory, setNewObjCategory] = useState('Kinh doanh');

  const [newKrTitle, setNewKrTitle] = useState('');
  const [newKrTargetValue, setNewKrTargetValue] = useState('');
  const [newKrUnit, setNewKrUnit] = useState('cái');
  const [newKrFinanceCategory, setNewKrFinanceCategory] = useState('');

  // Inline Quick Add Task state per Key Result
  const [quickTaskInputs, setQuickTaskInputs] = useState({});

  // Gemini AI Panel State
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiFeedbackMessage, setAiFeedbackMessage] = useState('');
  const [includeContext, setIncludeContext] = useState(true);

  // Helpers
  const toggleObjectiveExpand = (id) => {
    setExpandedObjectiveIds(prev => 
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  const getKRCurrentValue = (kr) => {
    if (kr.linkedFinanceCategory) {
      return incomes
        .filter(inc => inc.source && inc.source.toLowerCase() === kr.linkedFinanceCategory.toLowerCase())
        .reduce((sum, inc) => sum + inc.amount, 0);
    }
    return kr.currentValue || 0;
  };

  const calculateKrProgress = (kr) => {
    const current = getKRCurrentValue(kr);
    const target = kr.targetValue || 1;
    const pct = Math.round((current / target) * 100);
    return Math.max(0, Math.min(100, pct));
  };

  const calculateObjectiveProgress = (objId) => {
    const krs = keyResults.filter(kr => kr.objectiveId === objId);
    if (krs.length === 0) return 0;
    const totalProgress = krs.reduce((sum, kr) => sum + calculateKrProgress(kr), 0);
    return Math.round(totalProgress / krs.length);
  };

  // Actions
  const handleAddObjectiveSubmit = (e) => {
    e.preventDefault();
    if (!newObjTitle.trim()) return;
    addObjective(newObjTitle, newObjDescription, newObjCategory);
    setNewObjTitle('');
    setNewObjDescription('');
    setIsObjModalOpen(false);
  };

  const handleAddKrSubmit = (e) => {
    e.preventDefault();
    if (!newKrTitle.trim() || !newKrTargetValue || !activeObjectiveIdForKr) return;
    addKeyResult(
      activeObjectiveIdForKr,
      newKrTitle,
      parseFloat(newKrTargetValue),
      0,
      newKrUnit,
      newKrFinanceCategory.trim() || null
    );
    setNewKrTitle('');
    setNewKrTargetValue('');
    setNewKrUnit('cái');
    setNewKrFinanceCategory('');
    setIsKrModalOpen(false);
  };

  const handleQuickAddTask = (krId) => {
    const input = quickTaskInputs[krId];
    if (!input || !input.trim()) return;

    // Use Context's NLP addTask
    addTask(input, { keyResultId: krId, priority: 3, eisenhower: 'Q2' });
    setQuickTaskInputs(prev => ({ ...prev, [krId]: '' }));
  };

  const handleIncrementKrValue = (kr, offset) => {
    const current = getKRCurrentValue(kr);
    const nextVal = Math.max(0, current + offset);
    updateKeyResult(kr.id, { currentValue: nextVal });
  };

  const serializeCurrentContext = () => {
    // 1. Active Tasks
    const activeTasks = tasks.filter(t => t.status !== 'done').slice(0, 10);
    const activeTasksSummary = activeTasks.map(t => {
      const projName = projects.find(p => p.id === t.projectId)?.name || 'Chung';
      return `- ${t.title} (Dự án: ${projName}, Eisenhower: ${t.eisenhower}, Hạn chót: ${t.dueDate || 'Chưa có'})`;
    }).join('\n');

    // 2. Current OKRs
    const okrsSummary = objectives.map(obj => {
      const krs = keyResults.filter(kr => kr.objectiveId === obj.id);
      const krTitles = krs.map(kr => `  + KR: ${kr.title} (Mục tiêu: ${kr.targetValue} ${kr.unit})`).join('\n');
      return `- Mục tiêu: ${obj.title} (Tiến độ: ${calculateObjectiveProgress(obj.id)}%)\n${krTitles}`;
    }).join('\n');

    // 3. Finance Summary (Current Month)
    const thisMonthStr = new Date().toISOString().substring(0, 7);
    const thisMonthIncomes = incomes.filter(inc => inc.date.startsWith(thisMonthStr)).reduce((sum, inc) => sum + inc.amount, 0);
    const thisMonthExpenses = expenses.filter(exp => exp.date.startsWith(thisMonthStr)).reduce((sum, exp) => sum + exp.amount, 0);

    return `
=== NGỮ CẢNH CÔNG VIỆC HIỆN TẠI ===
1. Các công việc đang thực hiện:
${activeTasksSummary || '- Không có công việc nào đang dang dở.'}

2. Các mục tiêu OKRs đang theo dõi:
${okrsSummary || '- Chưa lập mục tiêu nào.'}

3. Tóm tắt tài chính tháng này:
- Tổng thu nhập: $${thisMonthIncomes}
- Tổng chi tiêu: $${thisMonthExpenses}
===================================
`;
  };

  const handleTriggerAiAnalysis = async () => {
    if (!aiPrompt.trim()) return;

    const apiKey = preferences.geminiApiKey;
    const model = preferences.geminiModel || DEFAULT_MODEL_ID;

    if (!apiKey) {
      alert('⚠️ Vui lòng cấu hình Gemini API Key trong tab "Thiết Lập" trước khi sử dụng!');
      return;
    }

    setIsAiLoading(true);
    setAiResult(null);
    setAiFeedbackMessage('');

    const contextText = includeContext ? serializeCurrentContext() : '';
    const userCustomInstructions = preferences.customAiContext
      ? `\n=== CHỈ DẪN AI & HỒ SƠ SOLOPRENEUR CỦA NGƯỜI DÙNG ===\n${preferences.customAiContext}\n======================================================\n`
      : '';

    const systemPrompt = `You are a professional OKR (Objectives and Key Results) Scaling Architect for Solopreneurs and Business Owners.
Your task is to take a raw business or personal goal from the user, look at their current work/financial context, and formulate a structured, highly quantitative OKR plan to achieve it.
You MUST output a single valid JSON object and nothing else. Do NOT wrap the JSON in markdown code blocks like \`\`\`json. Return raw JSON text.

The JSON structure MUST follow this exact schema:
{
  "objective": {
    "title": "A clear, inspirational Objective title (in Vietnamese)",
    "description": "A short, actionable description of the objective (in Vietnamese)",
    "category": "Choose one: 'Kinh doanh' | 'Học tập' | 'Tài chính' | 'Cá nhân'"
  },
  "keyResults": [
    {
      "title": "A quantitative Key Result that measures progress (in Vietnamese)",
      "targetValue": 100.0,
      "currentValue": 0.0,
      "unit": "The unit of measurement, e.g., 'bát', 'đơn', 'VNĐ', '%', 'hợp đồng', 'giờ'",
      "linkedFinanceCategory": "If the Key Result is linked to direct income tracking (like business revenue or freelance income), set this to the name of the income source (e.g., 'Bánh canh', 'Freelance'). Otherwise, set it to null.",
      "tasks": [
        "Task 1: Detailed action item to help achieve this KR (in Vietnamese, end with project tags like '@Công việc' or '@Cá nhân')",
        "Task 2: Another detailed action item"
      ]
    }
  ]
}`;

    const promptText = `
${userCustomInstructions}
${contextText}

Yêu cầu mục tiêu từ người dùng: "${aiPrompt}"

Hãy phân tích mục tiêu này và lập kế hoạch OKR chi tiết bằng JSON.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${systemPrompt}\n\n${promptText}`
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Lỗi kết nối API');
      }

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!responseText) {
        throw new Error('Mô hình không trả về dữ liệu.');
      }

      let cleanJson = responseText.trim();
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```(json)?/, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(cleanJson);
      if (!parsed.objective || !parsed.keyResults) {
        throw new Error('Dữ liệu JSON không đúng cấu trúc yêu cầu.');
      }

      setAiResult(parsed);
    } catch (err) {
      console.error(err);
      setAiFeedbackMessage(`❌ Lỗi kết nối API: ${err.message}. Vui lòng kiểm tra lại API Key hoặc kết nối mạng.`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplyAiProposal = () => {
    if (!aiResult) return;

    // 1. Add Objective
    const createdObj = addObjective(
      aiResult.objective.title,
      aiResult.objective.description,
      aiResult.objective.category
    );

    // 2. Add Key Results & Tasks
    aiResult.keyResults.forEach(kr => {
      const createdKr = addKeyResult(
        createdObj.id,
        kr.title,
        kr.targetValue,
        kr.currentValue,
        kr.unit,
        kr.linkedFinanceCategory
      );

      // Add linked tasks to task list
      kr.tasks.forEach(taskTitle => {
        addTask(`${taskTitle} @Công việc`, {
          keyResultId: createdKr.id,
          priority: 3,
          eisenhower: 'Q2',
          dueDate: new Date().toISOString().split('T')[0]
        });
      });
    });

    // Notify user of success
    setAiFeedbackMessage('✅ Đã áp dụng toàn bộ OKR và To-do list đề xuất vào hệ thống thành công!');
    setExpandedObjectiveIds(prev => [...prev, createdObj.id]);
    
    setTimeout(() => {
      setIsAiPanelOpen(false);
      setAiResult(null);
      setAiPrompt('');
      setAiFeedbackMessage('');
    }, 2000);
  };

  return (
    <div className="slide-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '100%' }}>
      
      {/* Header section with Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>Mục Tiêu & Kết Quả Then Chốt (OKRs)</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Quản trị Solopreneur theo mục tiêu định lượng bài bản, kết nối live dữ liệu tài chính.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn-primary" 
            style={{ 
              background: 'linear-gradient(135deg, var(--accent-secondary) 0%, #ec4899 100%)',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
            }}
            onClick={() => setIsAiPanelOpen(true)}
          >
            <Sparkles size={18} />
            <span>Gemini AI Architect</span>
          </button>
          
          <button 
            className="btn-secondary"
            onClick={() => setIsObjModalOpen(true)}
          >
            <Plus size={18} />
            <span>Thêm Mục Tiêu</span>
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isAiPanelOpen ? '1fr 380px' : '1fr', gap: '1.5rem', transition: 'grid-template-columns var(--transition-smooth)' }}>
        
        {/* Left Side: OKR List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {objectives.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Target size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Chưa có mục tiêu nào được lập
              </h3>
              <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Hãy tự lập một Mục tiêu đầu tiên hoặc dùng trợ lý Gemini AI Architect để thiết kế nhanh chiến lược tăng trưởng.
              </p>
              <button 
                className="btn-primary"
                onClick={() => setIsObjModalOpen(true)}
              >
                Tạo mục tiêu bằng tay
              </button>
            </div>
          ) : (
            objectives.map(obj => {
              const isExpanded = expandedObjectiveIds.includes(obj.id);
              const progress = calculateObjectiveProgress(obj.id);
              const objKrs = keyResults.filter(kr => kr.objectiveId === obj.id);

              return (
                <div 
                  key={obj.id} 
                  className="glass-panel" 
                  style={{ 
                    overflow: 'hidden',
                    borderLeft: `4px solid ${
                      progress >= 100 
                        ? 'var(--accent-success)' 
                        : progress >= 50 
                          ? 'var(--accent-primary)' 
                          : 'var(--accent-warning)'
                    }`
                  }}
                >
                  {/* Objective Header Card */}
                  <div 
                    style={{ 
                      padding: '1.25rem', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      background: 'rgba(255, 255, 255, 0.01)',
                      borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
                      transition: 'border-bottom 0.2s ease-in-out'
                    }}
                    onClick={() => toggleObjectiveExpand(obj.id)}
                  >
                    <div style={{ flex: 1, paddingRight: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                        <span style={{ 
                          fontSize: '0.72rem', 
                          fontWeight: 700, 
                          padding: '2px 8px', 
                          borderRadius: '20px', 
                          background: obj.category === 'Kinh doanh' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: obj.category === 'Kinh doanh' ? 'var(--accent-secondary)' : 'var(--accent-success)',
                          textTransform: 'uppercase'
                        }}>
                          {obj.category}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {objKrs.length} Kết quả then chốt
                        </span>
                      </div>
                      
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, margin: 0 }}>
                        {obj.title}
                      </h3>
                      
                      {obj.description && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.4 }}>
                          {obj.description}
                        </p>
                      )}
                    </div>

                    {/* Progress Indicator and Action Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ 
                          fontSize: '1.25rem', 
                          fontWeight: 800, 
                          color: progress >= 100 ? 'var(--accent-success)' : 'var(--text-primary)',
                          fontFamily: 'var(--font-display)'
                        }}>
                          {progress}%
                        </span>
                        <div style={{ width: '80px', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
                          <div style={{ 
                            width: `${progress}%`, 
                            height: '100%', 
                            background: progress >= 100 ? 'var(--accent-success)' : 'var(--accent-primary)',
                            borderRadius: '3px'
                          }} />
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Bạn thực sự muốn xóa Mục tiêu này và toàn bộ Kết quả then chốt bên trong?')) {
                            deleteObjective(obj.id);
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '5px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'var(--transition-smooth)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-danger)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        title="Xóa mục tiêu"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div style={{ color: 'var(--text-muted)' }}>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>

                  {/* Objective KRs Area */}
                  {isExpanded && (
                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'rgba(255, 255, 255, 0.005)' }}>
                      
                      {objKrs.length === 0 ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          Mục tiêu này chưa có Kết quả then chốt. Hãy thêm một kết quả then chốt để đo lường.
                        </div>
                      ) : (
                        objKrs.map(kr => {
                          const krProgress = calculateKrProgress(kr);
                          const krCurrent = getKRCurrentValue(kr);
                          const linkedTasks = tasks.filter(t => t.keyResultId === kr.id);
                          const completedTasks = linkedTasks.filter(t => t.status === 'done');

                          return (
                            <div 
                              key={kr.id} 
                              style={{ 
                                padding: '1rem', 
                                background: 'rgba(255, 255, 255, 0.02)', 
                                border: '1px solid var(--border-color)', 
                                borderRadius: 'var(--radius-md)' 
                              }}
                            >
                              {/* KR Title & Progress Stats */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Target size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                                    {kr.title}
                                  </h4>
                                  
                                  {kr.linkedFinanceCategory && (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', background: 'rgba(52, 211, 153, 0.1)', color: 'var(--accent-success)', padding: '2px 8px', borderRadius: '12px', marginTop: '6px', border: '1px solid rgba(52, 211, 153, 0.15)' }}>
                                      <DollarSign size={10} />
                                      <span>Liên kết đồng bộ Doanh thu: "{kr.linkedFinanceCategory}"</span>
                                    </div>
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                                  {/* Manual Controls for non-financial linked KRs */}
                                  {!kr.linkedFinanceCategory && (
                                    <div style={{ display: 'flex', gap: '2px' }}>
                                      <button 
                                        onClick={() => handleIncrementKrValue(kr, -1)}
                                        style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-glass)', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="Giảm giá trị thực tế"
                                      >
                                        -
                                      </button>
                                      <button 
                                        onClick={() => handleIncrementKrValue(kr, 1)}
                                        style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-glass)', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="Tăng giá trị thực tế"
                                      >
                                        +
                                      </button>
                                    </div>
                                  )}

                                  <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                                      {kr.unit === 'VNĐ' ? krCurrent.toLocaleString('vi-VN') : krCurrent} / {kr.unit === 'VNĐ' ? kr.targetValue.toLocaleString('vi-VN') : kr.targetValue} {kr.unit}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                                      ({krProgress}%)
                                    </span>
                                  </div>

                                  <button
                                    onClick={() => {
                                      if (confirm('Xóa kết quả then chốt này?')) {
                                        deleteKeyResult(kr.id);
                                      }
                                    }}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                                    title="Xóa KR"
                                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-danger)'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                                <div style={{ 
                                  width: `${krProgress}%`, 
                                  height: '100%', 
                                  background: krProgress >= 100 ? 'var(--accent-success)' : 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                                  borderRadius: '4px',
                                  transition: 'width 0.4s ease-in-out'
                                }} />
                              </div>

                              {/* Linked Tasks (Action Checklist) */}
                              <div style={{ borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '0.65rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                    Kế hoạch hành động ({completedTasks.length}/{linkedTasks.length} việc hoàn thành):
                                  </span>
                                </div>

                                {linkedTasks.length > 0 && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.5rem' }}>
                                    {linkedTasks.map(task => (
                                      <div 
                                        key={task.id}
                                        style={{ 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          justifyContent: 'space-between',
                                          padding: '0.35rem 0.5rem', 
                                          background: 'rgba(255,255,255,0.01)', 
                                          borderRadius: '6px',
                                          border: '1px solid rgba(255,255,255,0.01)'
                                        }}
                                      >
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)', cursor: 'pointer', flex: 1, textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                                          <input 
                                            type="checkbox"
                                            checked={task.status === 'done'}
                                            onChange={() => updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })}
                                            style={{ cursor: 'pointer' }}
                                          />
                                          <span>{task.title}</span>
                                        </label>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span style={{ 
                                            fontSize: '0.65rem', 
                                            padding: '1px 5px', 
                                            borderRadius: '3px',
                                            background: task.eisenhower === 'Q1' ? 'rgba(239, 68, 68, 0.1)' : (task.eisenhower === 'Q2' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)'),
                                            color: task.eisenhower === 'Q1' ? 'var(--accent-danger)' : (task.eisenhower === 'Q2' ? 'var(--accent-warning)' : 'var(--accent-primary)'),
                                            fontWeight: 600
                                          }}>
                                            {task.eisenhower}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Quick Add Task Form */}
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.45rem' }}>
                                  <input 
                                    type="text"
                                    placeholder="Thêm đầu việc nhanh cho KR này... (ví dụ: Standee quán bánh canh)"
                                    value={quickTaskInputs[kr.id] || ''}
                                    onChange={(e) => {
                                      const text = e.target.value;
                                      setQuickTaskInputs(prev => ({ ...prev, [kr.id]: text }));
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleQuickAddTask(kr.id);
                                    }}
                                    style={{
                                      flex: 1,
                                      padding: '0.35rem 0.6rem',
                                      fontSize: '0.78rem',
                                      borderRadius: '6px',
                                      background: 'var(--bg-glass)',
                                      border: '1px solid var(--border-color)',
                                      color: 'var(--text-primary)'
                                    }}
                                  />
                                  <button
                                    onClick={() => handleQuickAddTask(kr.id)}
                                    style={{
                                      padding: '0.35rem 0.75rem',
                                      background: 'var(--border-color)',
                                      border: 'none',
                                      borderRadius: '6px',
                                      color: 'var(--text-primary)',
                                      cursor: 'pointer',
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    Thêm
                                  </button>
                                </div>

                              </div>
                            </div>
                          );
                        })
                      )}

                      {/* Add KR Button for this objective */}
                      <button
                        onClick={() => {
                          setActiveObjectiveIdForKr(obj.id);
                          setIsKrModalOpen(true);
                        }}
                        style={{
                          alignSelf: 'flex-start',
                          padding: '0.5rem 1rem',
                          background: 'none',
                          border: '1px dashed var(--border-color)',
                          borderRadius: '8px',
                          color: 'var(--text-secondary)',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'var(--transition-smooth)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                      >
                        <PlusCircle size={16} />
                        <span>Thêm kết quả then chốt</span>
                      </button>

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right Side: Gemini AI Panel */}
        {isAiPanelOpen && (
          <div className="glass-panel slide-in" style={{ padding: '1.25rem', height: 'fit-content', border: '1px solid var(--accent-glow)', boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={18} style={{ color: 'var(--accent-secondary)' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>AI OKR Architect</h3>
              </div>
              <button 
                onClick={() => setIsAiPanelOpen(false)}
                style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Nhập ý tưởng hoặc mục tiêu kinh doanh thô của bạn. AI của Gemini sẽ bóc tách thành sơ đồ OKR chuẩn toán học kèm To-do list chi tiết.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <textarea
                placeholder="Ví dụ: Đột phá doanh thu quán Bánh canh từ 4.5M lên 10M/ngày"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                style={{
                  width: '100%',
                  height: '80px',
                  padding: '0.6rem',
                  borderRadius: '8px',
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  resize: 'none',
                  outline: 'none'
                }}
              />
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer', margin: '4px 0' }}>
                <input 
                  type="checkbox"
                  checked={includeContext}
                  onChange={(e) => setIncludeContext(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span>Gửi kèm ngữ cảnh công việc hiện tại</span>
              </label>

              <button
                className="btn-primary"
                onClick={handleTriggerAiAnalysis}
                disabled={isAiLoading || !aiPrompt.trim()}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                  padding: '0.6rem'
                }}
              >
                {isAiLoading ? 'Gemini đang thiết kế...' : 'Phân tích & Lập OKRs'}
              </button>
            </div>

            {/* AI Generation Success/Alert Toast */}
            {aiFeedbackMessage && (
              <div style={{
                background: 'rgba(52, 211, 153, 0.1)',
                border: '1px solid rgba(52, 211, 153, 0.2)',
                color: 'var(--accent-success)',
                padding: '0.6rem',
                borderRadius: '6px',
                fontSize: '0.78rem',
                textAlign: 'center'
              }}>
                {aiFeedbackMessage}
              </div>
            )}

            {/* AI Loading State Screen */}
            {isAiLoading && (
              <div style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                {/* Glowing Spinner */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '3px solid transparent',
                  borderTopColor: 'var(--accent-secondary)',
                  borderRightColor: 'var(--accent-primary)',
                  animation: 'spin 1s linear infinite'
                }} />
                <style>{`
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Đang bóc tách bài toán kinh tế & tạo danh mục hành động...
                </div>
              </div>
            )}

            {/* Proposal Result Review Screen */}
            {aiResult && !isAiLoading && (
              <div className="slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--accent-secondary)', fontWeight: 700 }}>Đề xuất Objective:</span>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-primary)' }}>{aiResult.objective.title}</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>{aiResult.objective.description}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--accent-success)', fontWeight: 700 }}>Kết quả then chốt đề xuất:</span>
                  
                  {aiResult.keyResults.map((kr, kIdx) => (
                    <div key={kIdx} style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                      <h5 style={{ fontSize: '0.82rem', fontWeight: 700 }}>KR {kIdx+1}: {kr.title}</h5>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Mục tiêu: {kr.targetValue} {kr.unit}
                        {kr.linkedFinanceCategory && ` (⚡ Liên kết: ${kr.linkedFinanceCategory})`}
                      </div>
                      
                      {/* Sub-checklists */}
                      <div style={{ marginTop: '0.35rem' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Hành động:</span>
                        <ul style={{ paddingLeft: '1rem', margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                          {kr.tasks.map((taskText, tIdx) => (
                            <li key={tIdx}>{taskText}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className="btn-primary"
                  onClick={handleApplyAiProposal}
                  style={{
                    marginTop: '0.5rem',
                    background: 'linear-gradient(135deg, var(--accent-success) 0%, #10b981 100%)',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                    justifyContent: 'center'
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Áp dụng vào hệ thống</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: Add Objective Dialog */}
      {isObjModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel animate-scale" style={{ width: '450px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Thêm Mục Tiêu Mới (Objective)</h3>
              <button 
                onClick={() => setIsObjModalOpen(false)}
                style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddObjectiveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tiêu đề Mục tiêu</label>
                <input 
                  type="text"
                  required
                  placeholder="Ví dụ: Đột phá doanh thu quán Bánh canh lên 10 triệu/ngày"
                  value={newObjTitle}
                  onChange={(e) => setNewObjTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    marginTop: '0.25rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Mô tả ngắn</label>
                <textarea
                  placeholder="Nhập ghi chú chi tiết hoặc lý do mục tiêu..."
                  value={newObjDescription}
                  onChange={(e) => setNewObjDescription(e.target.value)}
                  style={{
                    width: '100%',
                    height: '70px',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    resize: 'none',
                    marginTop: '0.25rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Phân nhóm danh mục</label>
                <select
                  value={newObjCategory}
                  onChange={(e) => setNewObjCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    marginTop: '0.25rem'
                  }}
                >
                  <option value="Kinh doanh">Kinh doanh / Side Hustle</option>
                  <option value="Học tập">Học tập / Phát triển</option>
                  <option value="Tài chính">Tài chính cá nhân</option>
                  <option value="Cá nhân">Cá nhân / Sức khỏe</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setIsObjModalOpen(false)}
                  style={{ flex: 1, padding: '0.5rem' }}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  style={{ flex: 1, padding: '0.5rem', justifyContent: 'center' }}
                >
                  Tạo mục tiêu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Key Result Dialog */}
      {isKrModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel animate-scale" style={{ width: '450px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Thêm Kết Quả Then Chốt (Key Result)</h3>
              <button 
                onClick={() => setIsKrModalOpen(false)}
                style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddKrSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tiêu đề KR</label>
                <input 
                  type="text"
                  required
                  placeholder="Ví dụ: Đạt doanh số trung bình 115 bát/ngày"
                  value={newKrTitle}
                  onChange={(e) => setNewKrTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    marginTop: '0.25rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Giá trị mục tiêu</label>
                  <input 
                    type="number"
                    required
                    placeholder="Chỉ điền số, ví dụ: 115"
                    value={newKrTargetValue}
                    onChange={(e) => setNewKrTargetValue(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      background: 'var(--bg-glass)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      marginTop: '0.25rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Đơn vị đo lường</label>
                  <input 
                    type="text"
                    required
                    placeholder="bát, VNĐ, %, đơn, hợp đồng"
                    value={newKrUnit}
                    onChange={(e) => setNewKrUnit(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      background: 'var(--bg-glass)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      marginTop: '0.25rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.01)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={!!newKrFinanceCategory}
                    onChange={(e) => setNewKrFinanceCategory(e.target.checked ? 'Bánh canh' : '')}
                  />
                  <span>Tự động đồng bộ từ dòng tiền Tài chính</span>
                </label>
                
                {!!newKrFinanceCategory && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nguồn thu nhập (Source) cần khớp tên:</label>
                    <input 
                      type="text"
                      placeholder="Ví dụ: Bánh canh, Freelance"
                      value={newKrFinanceCategory}
                      onChange={(e) => setNewKrFinanceCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '6px',
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        fontSize: '0.8rem',
                        marginTop: '0.25rem'
                      }}
                    />
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                      💡 Khi có giao dịch thu nhập có tên nguồn này, giá trị thực tế của KR sẽ tự động cộng dồn.
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setIsKrModalOpen(false)}
                  style={{ flex: 1, padding: '0.5rem' }}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  style={{ flex: 1, padding: '0.5rem', justifyContent: 'center' }}
                >
                  Tạo kết quả
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

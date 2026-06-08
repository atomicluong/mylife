import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon, 
  Tag, 
  Flag, 
  Clock, 
  Mic, 
  MicOff, 
  CheckCircle, 
  Circle, 
  AlertTriangle,
  Layers,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Search,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Play,
  Pause,
  Square,
  Lightbulb
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import CalendarView from './CalendarView';

const getLocalDateStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLocalTimeStr = (d = new Date()) => {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
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

const sortTasksByTime = (taskList) => {
  return [...taskList].sort((a, b) => {
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

export default function TaskManager() {
  const isMobile = window.innerWidth <= 768;
  const {
    tasks,
    setTasks,
    projects, 
    addTask, 
    addManualTask, 
    updateTask, 
    deleteTask,
    addSubtask, 
    toggleSubtask, 
    deleteSubtask,
    updateSubtask,
    addProject,
    addProjectSection,
    viewMode,
    setViewMode,
    selectedTaskId,
    setSelectedTaskId,
    startFocusOnTask,
    focusSessions,
    toggleFocusSession,
    stopAndLogFocusSession,
    getRealWeatherForHour: getWeatherForHour
  } = useApp();

  const formatFocusTime = (secs) => {
    const m = Math.floor(Math.abs(secs) / 60);
    const s = Math.abs(secs) % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const [activeList, setActiveList] = useState('proj-work');
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTaskIds, setExpandedTaskIds] = useState({});
  const [inlineSubtaskInputs, setInlineSubtaskInputs] = useState({});
  const [quickAddSubtaskId, setQuickAddSubtaskId] = useState(null);
  const [quickSubtaskText, setQuickSubtaskText] = useState('');
  const [isInputExpanded, setIsInputExpanded] = useState(true);
  const [matrixFilterMode, setMatrixFilterMode] = useState('day'); // 'day' | 'week' | 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [quickDueDate, setQuickDueDate] = useState(getLocalDateStr());
  const [quickDueTime, setQuickDueTime] = useState(getLocalTimeStr());
  const [quickDuration, setQuickDuration] = useState('30');
  const [quickEisenhower, setQuickEisenhower] = useState('');
  const [isDateModified, setIsDateModified] = useState(false);
  const [isTimeModified, setIsTimeModified] = useState(false);
  const [hoveredHelpQuadrant, setHoveredHelpQuadrant] = useState(null);

  const resetQuickFields = () => {
    setQuickDueDate(getLocalDateStr());
    setQuickDueTime(getLocalTimeStr());
    setQuickDuration('30');
    setQuickEisenhower('');
    setIsDateModified(false);
    setIsTimeModified(false);
  };

  const handlePrevDate = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (matrixFilterMode === 'month') {
        d.setMonth(d.getMonth() - 1);
      } else if (matrixFilterMode === 'week') {
        d.setDate(d.getDate() - 7);
      } else {
        d.setDate(d.getDate() - 1);
      }
      return d;
    });
  };

  const handleNextDate = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (matrixFilterMode === 'month') {
        d.setMonth(d.getMonth() + 1);
      } else if (matrixFilterMode === 'week') {
        d.setDate(d.getDate() + 7);
      } else {
        d.setDate(d.getDate() + 1);
      }
      return d;
    });
  };

  const toggleTaskExpanded = (taskId) => {
    setExpandedTaskIds(prev => {
      const isCurrentlyExpanded = !!prev[taskId];
      return {
        ...prev,
        [taskId]: !isCurrentlyExpanded
      };
    });
  };

  const handleInlineAddSubtask = (taskId) => {
    const input = inlineSubtaskInputs[taskId] || '';
    if (input.trim()) {
      addSubtask(taskId, input.trim());
      setInlineSubtaskInputs(prev => ({ ...prev, [taskId]: '' }));
    }
  };

  const [draggedMatrixTaskId, setDraggedMatrixTaskId] = useState(null);

  const handleMatrixTaskDragStart = (e, taskId) => {
    setDraggedMatrixTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleMatrixSubtaskDragStart = (e, taskId, subtaskId) => {
    e.stopPropagation();
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'matrix-subtask', taskId, subtaskId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleMatrixDragOver = (e) => {
    e.preventDefault();
  };

  const handleMatrixDrop = (e, quadrant) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (data.type === 'matrix-subtask') {
          updateTask(data.taskId, { eisenhower: quadrant });
          setDraggedMatrixTaskId(null);
          return;
        }
      }
    } catch (err) {
      // ignore
    }

    const taskId = e.dataTransfer.getData('text/plain') || draggedMatrixTaskId;
    if (taskId) {
      updateTask(taskId, { eisenhower: quadrant });
    }
    setDraggedMatrixTaskId(null);
  };

  // Projects local adding states
  const [newProjectName, setNewProjectName] = useState('');
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectColor, setNewProjectColor] = useState('#3b82f6');

  // Sections local adding states
  const [newSectionName, setNewSectionName] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

  // Add task project/section selection states
  const [inputProjectId, setInputProjectId] = useState('');
  const [inputSectionId, setInputSectionId] = useState('');

  React.useEffect(() => {
    const isProject = projects.some(p => p.id === activeList);
    if (isProject) {
      setInputProjectId(activeList);
    } else {
      setInputProjectId('');
    }
    setInputSectionId('');
  }, [activeList, projects]);

  // --- Voice Input (Web Speech API) ---
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Trình duyệt của bạn không hỗ trợ Speech Recognition. Hãy dùng Google Chrome hoặc Microsoft Edge.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setInputText(speechToText);
      setIsRecording(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  // --- NLP Submit ---
  const handleNLPAdd = (e) => {
    if (e.key === 'Enter' && inputText.trim()) {
      const overrides = { 
        projectId: inputProjectId || null, 
        sectionId: inputSectionId || null 
      };
      if (isDateModified) overrides.dueDate = quickDueDate;
      if (isTimeModified) overrides.dueTime = quickDueTime;
      if (quickDuration) overrides.timeEstimate = parseInt(quickDuration) || 30;
      if (quickEisenhower) overrides.eisenhower = quickEisenhower;

      addTask(inputText, overrides);
      setInputText('');
      setInputSectionId('');
      resetQuickFields();
    }
  };

  const handleNLPButtonClick = () => {
    if (inputText.trim()) {
      const overrides = { 
        projectId: inputProjectId || null, 
        sectionId: inputSectionId || null 
      };
      if (isDateModified) overrides.dueDate = quickDueDate;
      if (isTimeModified) overrides.dueTime = quickDueTime;
      if (quickDuration) overrides.timeEstimate = parseInt(quickDuration) || 30;
      if (quickEisenhower) overrides.eisenhower = quickEisenhower;

      addTask(inputText, overrides);
      setInputText('');
      setInputSectionId('');
      resetQuickFields();
    }
  };

  // --- Subtask additions ---
  const [subtaskInput, setSubtaskInput] = useState('');
  const handleAddSubtask = (taskId) => {
    if (subtaskInput.trim()) {
      addSubtask(taskId, subtaskInput.trim());
      setSubtaskInput('');
    }
  };

  // --- Filters based on Selected Smart List ---
  const todayStr = getLocalDateStr();

  const getFilteredTasks = () => {
    let filtered = [...tasks];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
    }

    // Smart List logic
    switch (activeList) {
      case 'all':
        return filtered.filter(t => t.status !== 'done' || viewMode === 'eisenhower');
      case 'today':
        return filtered.filter(t => 
          (t.status !== 'done' || viewMode === 'eisenhower') && 
          (t.dueDate === todayStr || t.listType === 'today' || (t.dueDate && t.dueDate < todayStr))
        );
      case 'scheduled':
        return filtered.filter(t => (t.status !== 'done' || viewMode === 'eisenhower') && t.dueDate && t.dueDate > todayStr);
      case 'someday':
        return filtered.filter(t => (t.status !== 'done' || viewMode === 'eisenhower') && t.listType === 'someday');
      case 'anytime':
        return filtered.filter(t => (t.status !== 'done' || viewMode === 'eisenhower') && t.listType === 'anytime');
      case 'waiting':
        // Blocked tasks (depends on an incomplete task)
        return filtered.filter(t => 
          (t.status !== 'done' || viewMode === 'eisenhower') && 
          t.dependencies && 
          t.dependencies.some(depId => {
            const blockingTask = tasks.find(pt => pt.id === depId);
            return blockingTask && blockingTask.status !== 'done';
          })
        );
      case 'done':
        return filtered.filter(t => t.status === 'done');
      default:
        // Project ID list
        return filtered.filter(t => t.projectId === activeList && (t.status !== 'done' || viewMode === 'eisenhower'));
    }
  };

  const isDateInCurrentWeek = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMon = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMon);
    monday.setHours(0,0,0,0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);
    return date >= monday && date <= sunday;
  };

  const isDateInCurrentMonth = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  };

  const getMatrixFilteredTasks = () => {
    let listTasks = [...tasks];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      listTasks = listTasks.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
    }
    const todayStr = getLocalDateStr();
    return listTasks.filter(t => {
      if (t.status === 'done') return false;
      if (matrixFilterMode === 'day') {
        return t.dueDate === todayStr || (t.listType === 'today' && !t.dueDate);
      } else if (matrixFilterMode === 'week') {
        return isDateInCurrentWeek(t.dueDate);
      } else if (matrixFilterMode === 'month') {
        return isDateInCurrentMonth(t.dueDate);
      }
      return true;
    });
  };

  const filteredTasks = getFilteredTasks();
  const matrixTasks = getMatrixFilteredTasks();

  // Eisenhower Matrix grouping (sorted chronologically)
  const q1Tasks = sortTasksByTime((viewMode === 'eisenhower' ? matrixTasks : filteredTasks).filter(t => t.eisenhower === 'Q1'));
  const q2Tasks = sortTasksByTime((viewMode === 'eisenhower' ? matrixTasks : filteredTasks).filter(t => t.eisenhower === 'Q2'));
  const q3Tasks = sortTasksByTime((viewMode === 'eisenhower' ? matrixTasks : filteredTasks).filter(t => t.eisenhower === 'Q3'));
  const q4Tasks = sortTasksByTime((viewMode === 'eisenhower' ? matrixTasks : filteredTasks).filter(t => t.eisenhower === 'Q4'));

  // Helper check if task is currently blocked
  const isTaskBlocked = (task) => {
    if (!task.dependencies || task.dependencies.length === 0) return false;
    return task.dependencies.some(depId => {
      const bTask = tasks.find(t => t.id === depId);
      return bTask && bTask.status !== 'done';
    });
  };

  const moveTaskInList = (taskId, direction) => {
    setTasks(prevTasks => {
      const task = prevTasks.find(t => t.id === taskId);
      if (!task) return prevTasks;

      const quad = task.eisenhower || 'Q2';
      
      let filtered = [...prevTasks];
      if (viewMode === 'eisenhower') {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
        }
        const todayStr = getLocalDateStr();
        filtered = filtered.filter(t => {
          if (t.status === 'done') return false;
          if (matrixFilterMode === 'day') {
            return t.dueDate === todayStr || (t.listType === 'today' && !t.dueDate);
          } else if (matrixFilterMode === 'week') {
            return isDateInCurrentWeek(t.dueDate);
          } else if (matrixFilterMode === 'month') {
            return isDateInCurrentMonth(t.dueDate);
          }
          return true;
        });
      } else {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
        }
        
        const todayStr = getLocalDateStr();
        switch (activeList) {
          case 'all':
            filtered = filtered.filter(t => t.status !== 'done' || viewMode === 'eisenhower');
            break;
          case 'today':
            filtered = filtered.filter(t => 
              (t.status !== 'done' || viewMode === 'eisenhower') && 
              (t.dueDate === todayStr || t.listType === 'today' || (t.dueDate && t.dueDate < todayStr))
            );
            break;
          case 'scheduled':
            filtered = filtered.filter(t => (t.status !== 'done' || viewMode === 'eisenhower') && t.dueDate && t.dueDate > todayStr);
            break;
          case 'someday':
            filtered = filtered.filter(t => (t.status !== 'done' || viewMode === 'eisenhower') && t.listType === 'someday');
            break;
          case 'anytime':
            filtered = filtered.filter(t => (t.status !== 'done' || viewMode === 'eisenhower') && t.listType === 'anytime');
            break;
          case 'waiting':
            filtered = filtered.filter(t => 
              (t.status !== 'done' || viewMode === 'eisenhower') && 
              t.dependencies && 
              t.dependencies.some(depId => {
                const blockingTask = prevTasks.find(pt => pt.id === depId);
                return blockingTask && blockingTask.status !== 'done';
              })
            );
            break;
          case 'done':
            filtered = filtered.filter(t => t.status === 'done');
            break;
          default:
            filtered = filtered.filter(t => t.projectId === activeList && (t.status !== 'done' || viewMode === 'eisenhower'));
            break;
        }
      }

      const quadTasks = filtered.filter(t => t.eisenhower === quad);
      const currentIndex = quadTasks.findIndex(t => t.id === taskId);
      if (currentIndex === -1) return prevTasks;

      let targetIndex = -1;
      if (direction === 'up' && currentIndex > 0) {
        targetIndex = currentIndex - 1;
      } else if (direction === 'down' && currentIndex < quadTasks.length - 1) {
        targetIndex = currentIndex + 1;
      }

      if (targetIndex !== -1) {
        const targetTask = quadTasks[targetIndex];
        const globalIndexCurrent = prevTasks.findIndex(t => t.id === taskId);
        const globalIndexTarget = prevTasks.findIndex(t => t.id === targetTask.id);
        
        if (globalIndexCurrent !== -1 && globalIndexTarget !== -1) {
          const newTasks = [...prevTasks];
          const temp = newTasks[globalIndexCurrent];
          newTasks[globalIndexCurrent] = newTasks[globalIndexTarget];
          newTasks[globalIndexTarget] = temp;
          return newTasks;
        }
      }
      return prevTasks;
    });
  };

  const renderTaskItem = (task) => {
    const isBlocked = isTaskBlocked(task);
    const isExpanded = !!expandedTaskIds[task.id];
    const totalSub = task.subtasks ? task.subtasks.length : 0;
    const completedSub = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
    const percent = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;

    const qClass = (task.eisenhower || 'Q2').toLowerCase();
    const isSelected = selectedTaskId === task.id;

    return (
      <div 
        key={task.id}
        className={`task-card-redesign task-accent-bar-${qClass} ${isSelected ? 'task-card-selected' : ''}`}
      >
        <div 
          onClick={() => setSelectedTaskId(task.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, marginRight: '1rem' }}>
            {/* Expansion Chevron spacer */}
            {totalSub > 0 ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTaskExpanded(task.id);
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

            <button
              onClick={(e) => {
                e.stopPropagation();
                updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' });
              }}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: task.status === 'done' ? 'var(--accent-success)' : 'var(--text-muted)' }}
            >
              {task.status === 'done' ? <CheckCircle size={20} /> : <Circle size={20} />}
            </button>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{
                fontWeight: 600,
                fontSize: '0.92rem',
                textDecoration: task.status === 'done' ? 'line-through' : 'none',
                color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)'
              }}>
                {task.title}
              </span>
              {/* Metadata list */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {task.dueDate && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <CalendarIcon size={12} /> {task.dueDate} {task.dueTime ? `@ ${task.dueTime}` : ''}
                  </span>
                )}
                {task.projectId && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: projects.find(p => p.id === task.projectId)?.color }} />
                    {projects.find(p => p.id === task.projectId)?.name}
                  </span>
                )}
                {isBlocked && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                    <AlertTriangle size={12} /> Đang bị khóa
                  </span>
                )}
                {totalSub > 0 && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Layers size={12} /> {completedSub}/{totalSub} bước
                  </span>
                )}
                {totalSub > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ width: '60px', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', background: 'var(--accent-secondary)', transition: 'width 0.3s ease' }} />
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>{percent}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Priority Badge & Delete */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: task.priority === 4 ? 'rgba(239, 68, 68, 0.1)' : (task.priority === 3 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(99, 102, 241, 0.1)'),
              color: task.priority === 4 ? 'var(--accent-danger)' : (task.priority === 3 ? 'var(--accent-warning)' : 'var(--accent-primary)')
            }}>
              {task.priority === 4 ? 'Ưu tiên cao' : (task.priority === 3 ? 'Trung bình' : 'Thấp')}
            </span>
            
            <button
              onClick={(e) => { e.stopPropagation(); deleteTask(task.id); setSelectedTaskId(null); }}
              style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              title="Xóa nhiệm vụ"
            >
              <Trash2 size={16} />
            </button>

            {/* Quick Add Subtask Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (quickAddSubtaskId === task.id) {
                  setQuickAddSubtaskId(null);
                  setQuickSubtaskText('');
                } else {
                  setQuickAddSubtaskId(task.id);
                  setQuickSubtaskText('');
                  if (!isExpanded) {
                    toggleTaskExpanded(task.id);
                  }
                }
              }}
              style={{
                border: 'none',
                background: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '16px',
                height: '16px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                padding: '2px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              title="Thêm nhanh bước phụ"
            >
              +
            </button>
          </div>
        </div>

        {/* Quick Add Subtask Input Panel */}
        {quickAddSubtaskId === task.id && (
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: '10px 14px 10px 2.75rem',
              borderTop: '1px dashed var(--border-color)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.015)'
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
                    addSubtask(task.id, quickSubtaskText.trim());
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
                  addSubtask(task.id, quickSubtaskText.trim());
                  setQuickSubtaskText('');
                  setQuickAddSubtaskId(null);
                }
              }}
              style={{
                background: 'var(--accent-primary)',
                border: 'none',
                color: '#fff',
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

        {/* Expanded Subtasks Inline List */}
        {isExpanded && totalSub > 0 && (
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: '0.75rem 1rem 0.75rem 2.75rem',
              borderTop: '1px dashed var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.01)'
            }}
          >
            {task.subtasks.map(sub => (
              <div 
                key={sub.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  gap: '0.5rem',
                  padding: '2px 0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startFocusOnTask(task.id, sub.id);
                    }}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--accent-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                    title="Bắt đầu làm (Pomodoro)"
                  >
                    <Play size={10} fill="var(--accent-primary)" />
                  </button>

                  <input 
                    type="checkbox"
                    checked={sub.completed}
                    onChange={() => toggleSubtask(task.id, sub.id)}
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
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    ({sub.actualTime || 0}m/{sub.estimatedTime || 30}m)
                  </span>
                  
                  <button
                    onClick={() => deleteSubtask(task.id, sub.id)}
                    style={{ border: 'none', background: 'none', color: 'var(--text-danger)', cursor: 'pointer', fontSize: '0.85rem', padding: '2px 4px' }}
                    title="Xóa bước phụ"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}

            {/* Quick Add Subtask Inline */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <input
                type="text"
                placeholder="Thêm bước phụ mới..."
                value={inlineSubtaskInputs[task.id] || ''}
                onChange={(e) => setInlineSubtaskInputs(prev => ({ ...prev, [task.id]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleInlineAddSubtask(task.id);
                  }
                }}
                style={{ 
                  flex: 1, 
                  padding: '0.35rem 0.6rem', 
                  borderRadius: '6px', 
                  background: 'var(--bg-glass)', 
                  border: '1px solid var(--border-color)', 
                  color: 'var(--text-primary)', 
                  fontSize: '0.8rem' 
                }}
              />
              <button
                onClick={() => handleInlineAddSubtask(task.id)}
                style={{ 
                  border: 'none', 
                  background: 'var(--accent-primary)', 
                  color: '#fff', 
                  borderRadius: '6px', 
                  padding: '0 12px', 
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                Thêm
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMatrixTask = (t) => {
    const isBlocked = isTaskBlocked(t);
    const isExpanded = !!expandedTaskIds[t.id];
    const totalSub = t.subtasks ? t.subtasks.length : 0;
    const completedSub = t.subtasks ? t.subtasks.filter(s => s.completed).length : 0;
    const percent = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;

    const qClass = (t.eisenhower || 'Q2').toLowerCase();
    const isSelected = selectedTaskId === t.id;

    return (
      <div 
        key={t.id}
        onClick={() => setSelectedTaskId(t.id)} 
        draggable="true"
        onDragStart={(e) => handleMatrixTaskDragStart(e, t.id)}
        className={`task-card-redesign task-accent-bar-${qClass} ${isSelected ? 'task-card-selected' : ''}`}
        style={{
          marginBottom: '6px',
          cursor: 'grab'
        }}
      >
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, marginRight: '1rem', minWidth: 0 }}>
            {/* Expansion Chevron spacer */}
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

            <button
              onClick={(e) => {
                e.stopPropagation();
                updateTask(t.id, { status: t.status === 'done' ? 'todo' : 'done' });
              }}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: t.status === 'done' ? 'var(--accent-success)' : 'var(--text-muted)' }}
            >
              {t.status === 'done' ? <CheckCircle size={20} /> : <Circle size={20} />}
            </button>
            
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <span style={{
                fontWeight: 600,
                fontSize: '0.92rem',
                textDecoration: t.status === 'done' ? 'line-through' : 'none',
                color: t.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}>
                {t.title}
              </span>
              {/* Metadata list */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ 
                  color: getTaskStatusColor(t).text, 
                  backgroundColor: getTaskStatusColor(t).bg, 
                  border: getTaskStatusColor(t).border,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '0.72rem',
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

                {t.dueDate && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <CalendarIcon size={12} /> {t.dueDate}
                  </span>
                )}

                {t.dueTime && (() => {
                  const [hourStr] = t.dueTime.split(':');
                  const hour = parseInt(hourStr) || 12;
                  const weather = getWeatherForHour(t.dueDate || getLocalDateStr(), hour);
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

                {t.projectId && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: projects.find(p => p.id === t.projectId)?.color }} />
                    {projects.find(p => p.id === t.projectId)?.name}
                  </span>
                )}
                
                {isBlocked && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                    <AlertTriangle size={12} /> Đang bị khóa
                  </span>
                )}

                {totalSub > 0 && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Layers size={12} /> {completedSub}/{totalSub} bước
                  </span>
                )}

                {totalSub > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ width: '60px', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', background: 'var(--accent-secondary)', transition: 'width 0.3s ease' }} />
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>{percent}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Priority Badge, Delete & Up/Down arrows */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
              <button
                onClick={() => moveTaskInList(t.id, 'up')}
                style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                title="Di chuyển lên"
              >
                <ArrowUp size={13} />
              </button>
              <button
                onClick={() => moveTaskInList(t.id, 'down')}
                style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                title="Di chuyển xuống"
              >
                <ArrowDown size={13} />
              </button>
            </div>

            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: t.priority === 4 ? 'rgba(239, 68, 68, 0.1)' : (t.priority === 3 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(99, 102, 241, 0.1)'),
              color: t.priority === 4 ? 'var(--accent-danger)' : (t.priority === 3 ? 'var(--accent-warning)' : 'var(--accent-primary)')
            }}>
              {t.priority === 4 ? 'Ưu tiên cao' : (t.priority === 3 ? 'Trung bình' : 'Thấp')}
            </span>
            
            <button
              onClick={() => { deleteTask(t.id); setSelectedTaskId(null); }}
              style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              title="Xóa nhiệm vụ"
            >
              <Trash2 size={16} />
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
                border: 'none',
                background: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '16px',
                height: '16px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                padding: '2px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              title="Thêm nhanh bước phụ"
            >
              +
            </button>
          </div>
        </div>

        {/* Quick Add Subtask Input Panel */}
        {quickAddSubtaskId === t.id && (
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: '10px 14px 10px 2.75rem',
              borderTop: '1px dashed var(--border-color)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.015)'
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
                background: 'var(--accent-primary)',
                border: 'none',
                color: '#fff',
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

        {/* Expanded Subtasks Inline List */}
        {isExpanded && totalSub > 0 && (
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: '0.75rem 1rem 0.75rem 2.75rem',
              borderTop: '1px dashed var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.01)'
            }}
          >
            {t.subtasks.map(sub => (
              <div 
                key={sub.id} 
                draggable="true"
                onDragStart={(e) => handleMatrixSubtaskDragStart(e, t.id, sub.id)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  gap: '0.5rem',
                  padding: '2px 0',
                  cursor: 'grab'
                }}
                title="Kéo thả bước phụ này sang ô phần tư khác để thay đổi mức ưu tiên của nhiệm vụ cha"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startFocusOnTask(t.id, sub.id);
                    }}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--accent-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                    title="Bắt đầu làm (Pomodoro)"
                  >
                    <Play size={10} fill="var(--accent-primary)" />
                  </button>

                  <input 
                    type="checkbox"
                    checked={sub.completed}
                    onChange={() => toggleSubtask(t.id, sub.id)}
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
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    ({sub.actualTime || 0}m/{sub.estimatedTime || 30}m)
                  </span>
                  
                  <button
                    onClick={() => deleteSubtask(t.id, sub.id)}
                    style={{ border: 'none', background: 'none', color: 'var(--text-danger)', cursor: 'pointer', fontSize: '0.85rem', padding: '2px 4px' }}
                    title="Xóa bước phụ"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}

            {/* Quick Add Subtask Inline */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <input
                type="text"
                placeholder="Thêm bước phụ mới..."
                value={inlineSubtaskInputs[t.id] || ''}
                onChange={(e) => setInlineSubtaskInputs(prev => ({ ...prev, [t.id]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleInlineAddSubtask(t.id);
                  }
                }}
                style={{ 
                  flex: 1, 
                  padding: '0.35rem 0.6rem', 
                  borderRadius: '6px', 
                  background: 'var(--bg-glass)', 
                  border: '1px solid var(--border-color)', 
                  color: 'var(--text-primary)', 
                  fontSize: '0.8rem' 
                }}
              />
              <button
                onClick={() => handleInlineAddSubtask(t.id)}
                style={{ 
                  border: 'none', 
                  background: 'var(--accent-primary)', 
                  color: '#fff', 
                  borderRadius: '6px', 
                  padding: '0 12px', 
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                Thêm
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (selectedTask) {
    const taskSession = focusSessions.find(s => s.taskId === selectedTask.id);
    return (
      <div className="slide-in task-details-screen">
        <div className="glass-panel task-details-card">
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <button 
              onClick={() => setSelectedTaskId(null)}
              className="btn-secondary"
              style={{
                border: 'none',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--text-primary)',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                border: '1px solid var(--border-color)'
              }}
            >
              ← Quay lại
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Chi Tiết Nhiệm Vụ</h3>
          </div>

          {/* Form Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tên nhiệm vụ</label>
              <input 
                type="text"
                value={selectedTask.title}
                onChange={(e) => {
                  updateTask(selectedTask.id, { title: e.target.value });
                }}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.88rem', marginTop: '0.25rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Mô tả</label>
              <textarea 
                value={selectedTask.description || ''}
                onChange={(e) => {
                  updateTask(selectedTask.id, { description: e.target.value });
                }}
                rows={3}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.88rem', marginTop: '0.25rem', resize: 'vertical' }}
              />
            </div>

            {/* Ngày thực hiện & Giờ bắt đầu */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ngày thực hiện</label>
                <input 
                  type="date"
                  value={selectedTask.dueDate || getLocalDateStr()}
                  onChange={(e) => {
                    updateTask(selectedTask.id, { dueDate: e.target.value || getLocalDateStr() });
                  }}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.8rem', marginTop: '0.25rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> Giờ bắt đầu
                </label>
                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <select
                    value={selectedTask.dueTime ? selectedTask.dueTime.split(':')[0] : '12'}
                    onChange={(e) => {
                      const h = e.target.value;
                      const m = selectedTask.dueTime ? selectedTask.dueTime.split(':')[1] : '00';
                      updateTask(selectedTask.id, { dueTime: `${h}:${m}` });
                    }}
                    style={{ 
                      flex: 1, 
                      padding: '0.4rem', 
                      borderRadius: '6px', 
                      background: 'var(--bg-glass)', 
                      border: '1px solid var(--border-color)', 
                      color: 'var(--text-primary)', 
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    {Array.from({ length: 24 }).map((_, idx) => {
                      const h = String(idx).padStart(2, '0');
                      return <option key={h} value={h}>{h} h</option>;
                    })}
                  </select>
                  <select
                    value={selectedTask.dueTime ? selectedTask.dueTime.split(':')[1] : '00'}
                    onChange={(e) => {
                      const m = e.target.value;
                      const h = selectedTask.dueTime ? selectedTask.dueTime.split(':')[0] : '12';
                      updateTask(selectedTask.id, { dueTime: `${h}:${m}` });
                    }}
                    style={{ 
                      flex: 1, 
                      padding: '0.4rem', 
                      borderRadius: '6px', 
                      background: 'var(--bg-glass)', 
                      border: '1px solid var(--border-color)', 
                      color: 'var(--text-primary)', 
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    {Array.from({ length: 60 }).map((_, idx) => {
                      const m = String(idx).padStart(2, '0');
                      return <option key={m} value={m}>{m} m</option>;
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Thời gian dự kiến & Giờ kết thúc */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Thời gian dự kiến (phút)</label>
                <input 
                  type="number"
                  min="0"
                  placeholder="Số phút..."
                  value={selectedTask.timeEstimate !== undefined && selectedTask.timeEstimate !== null ? selectedTask.timeEstimate : 30}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateTask(selectedTask.id, { timeEstimate: isNaN(val) ? 0 : val });
                  }}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.8rem', marginTop: '0.25rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Giờ kết thúc (tự tính)</label>
                <div style={{ 
                  width: '100%', 
                  padding: '0.4rem 0.6rem', 
                  borderRadius: '6px', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px dashed var(--border-color)', 
                  color: 'var(--text-muted)', 
                  fontSize: '0.85rem', 
                  marginTop: '0.25rem',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: 600
                }}>
                  {(() => {
                    const startTime = selectedTask.dueTime || '12:00';
                    const minutes = selectedTask.timeEstimate !== undefined && selectedTask.timeEstimate !== null ? parseInt(selectedTask.timeEstimate) : 30;
                    const [hour, minute] = startTime.split(':').map(Number);
                    const tempDate = new Date();
                    tempDate.setHours(hour, minute + minutes, 0, 0);
                    const endHour = String(tempDate.getHours()).padStart(2, '0');
                    const endMinute = String(tempDate.getMinutes()).padStart(2, '0');
                    return `${endHour}:${endMinute}`;
                  })()}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ma trận Eisenhower</label>
                <div style={{ display: 'flex', gap: '3px', background: 'rgba(255,255,255,0.03)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-color)', alignItems: 'center', marginTop: '0.25rem', height: '32px' }}>
                  {[
                    { id: 'Q1', color: 'var(--accent-danger)', bgActive: 'rgba(239, 68, 68, 0.2)' },
                    { id: 'Q2', color: 'var(--accent-secondary)', bgActive: 'rgba(168, 85, 247, 0.2)' },
                    { id: 'Q3', color: 'var(--accent-warning)', bgActive: 'rgba(245, 158, 11, 0.2)' },
                    { id: 'Q4', color: 'var(--text-muted)', bgActive: 'rgba(255, 255, 255, 0.15)' }
                  ].map(q => {
                    const isActive = selectedTask.eisenhower === q.id;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => updateTask(selectedTask.id, { eisenhower: q.id })}
                        style={{
                          flex: 1,
                          border: 'none',
                          background: isActive ? q.bgActive : 'transparent',
                          color: isActive ? q.color : 'var(--text-muted)',
                          padding: '3px 0',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: isActive ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'var(--transition-smooth)',
                          border: isActive ? `1px solid ${q.color}` : '1px solid transparent',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title={
                          q.id === 'Q1' ? 'Q1: Khẩn cấp & Quan trọng (Làm ngay)' :
                          q.id === 'Q2' ? 'Q2: Không khẩn nhưng Quan trọng (Lên kế hoạch)' :
                          q.id === 'Q3' ? 'Q3: Khẩn cấp nhưng Không quan trọng (Ủy quyền)' :
                          'Q4: Không khẩn & Không quan trọng (Loại bỏ)'
                        }
                      >
                        {q.id}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Độ ưu tiên</label>
                <select
                  value={selectedTask.priority || 2}
                  onChange={(e) => {
                    const p = parseInt(e.target.value);
                    updateTask(selectedTask.id, { priority: p });
                  }}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.8rem', marginTop: '0.25rem' }}
                >
                  <option value={4}>Ưu tiên cao</option>
                  <option value={3}>Trung bình</option>
                  <option value={2}>Thấp</option>
                </select>
              </div>
            </div>

            {/* Project selector */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Dự án</label>
              <select
                value={selectedTask.projectId || ''}
                onChange={(e) => {
                  const newProjId = e.target.value || null;
                  updateTask(selectedTask.id, { projectId: newProjId, sectionId: null });
                }}
                style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.8rem', marginTop: '0.25rem' }}
              >
                <option value="">-- Không phân vào dự án --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Sub-sections selector (only if task belongs to a project) */}
            {selectedTask.projectId && (
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Chuyên mục con</label>
                <select
                  value={selectedTask.sectionId || ''}
                  onChange={(e) => {
                    updateTask(selectedTask.id, { sectionId: e.target.value || null });
                  }}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.8rem', marginTop: '0.25rem' }}
                >
                  <option value="">-- Chưa phân loại --</option>
                  {(() => {
                    const proj = projects.find(p => p.id === selectedTask.projectId);
                    const sections = proj ? (proj.sections || []) : [];
                    return sections.map(sec => (
                      <option key={sec.id} value={sec.id}>{sec.name}</option>
                    ));
                  })()}
                </select>
              </div>
            )}

            {/* Subtasks (Microsoft style) */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Nhiệm vụ con (Subtasks)</label>
              
              {/* List subtasks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
                {selectedTask.subtasks && selectedTask.subtasks.map(sub => (
                  <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px dashed rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                      {/* Play button */}
                      <button
                        type="button"
                        onClick={() => startFocusOnTask(selectedTask.id, sub.id)}
                        style={{
                          border: 'none',
                          background: 'rgba(99, 102, 241, 0.1)',
                          color: 'var(--accent-primary)',
                          borderRadius: '50%',
                          width: '22px',
                          height: '22px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          marginRight: '6px',
                          flexShrink: 0
                        }}
                        title="Bắt đầu tập trung Pomodoro cho bước này"
                      >
                        <Play size={10} fill="var(--accent-primary)" />
                      </button>
                      
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer', flex: 1, minWidth: 0 }}>
                        <input 
                          type="checkbox"
                          checked={sub.completed}
                          onChange={() => {
                            toggleSubtask(selectedTask.id, sub.id);
                          }}
                        />
                        <span style={{ 
                          textDecoration: sub.completed ? 'line-through' : 'none', 
                          color: sub.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap'
                        }}>
                          {sub.title}
                        </span>
                      </label>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {sub.actualTime > 0 && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }} title="Thời gian thực tế đã hoàn thành">
                          ({sub.actualTime}m)
                        </span>
                      )}
                      <input 
                        type="number"
                        min="0"
                        value={sub.estimatedTime !== undefined ? sub.estimatedTime : 30}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          updateSubtask(selectedTask.id, sub.id, { estimatedTime: val });
                        }}
                        style={{
                          width: '50px',
                          padding: '0.25rem 0.4rem',
                          borderRadius: '6px',
                          background: 'var(--bg-glass)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          fontSize: '0.8rem',
                          textAlign: 'center',
                          outline: 'none'
                        }}
                        title="Số phút dự kiến"
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '4px' }}>m</span>
                      
                      <button
                        onClick={() => {
                          deleteSubtask(selectedTask.id, sub.id);
                        }}
                        style={{ border: 'none', background: 'none', color: 'var(--text-danger)', cursor: 'pointer', fontSize: '0.75rem', padding: '2px 4px' }}
                        title="Xóa bước phụ"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtask Input */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Thêm bước phụ..."
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddSubtask(selectedTask.id);
                    }
                  }}
                  style={{ flex: 1, padding: '0.4rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                />
                <button
                  onClick={() => handleAddSubtask(selectedTask.id)}
                  style={{ border: 'none', background: 'var(--accent-primary)', color: '#fff', borderRadius: '6px', padding: '0 10px', cursor: 'pointer' }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Hoàn thành Button */}
            <button
              onClick={() => setSelectedTaskId(null)}
              style={{
                border: 'none',
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                color: '#fff',
                borderRadius: '6px',
                padding: '0.65rem 1.2rem',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.88rem',
                marginTop: '1rem',
                width: '100%',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
              }}
              onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
              onMouseOut={(e) => e.currentTarget.style.filter = 'brightness(1)'}
            >
              Hoàn thành
            </button>
          </div>
        </div>

        {/* Mini Pomodoro timer — fixed bottom bar khi có session đang chạy */}
        {taskSession && (
          <div style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            zIndex: 210,
            background: 'var(--bg-card)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: `2px solid ${taskSession.isActive ? 'var(--accent-primary)' : 'var(--border-color)'}`,
            padding: '0.55rem 1rem',
            paddingBottom: 'calc(0.55rem + env(safe-area-inset-bottom))',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'border-color 0.3s'
          }}>
            {/* Pulse dot */}
            <div style={{
              width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
              background: taskSession.isActive ? 'var(--accent-success)' : 'var(--accent-warning)',
              boxShadow: taskSession.isActive ? '0 0 8px var(--accent-success)' : 'none',
              animation: taskSession.isActive ? 'pulse 1.5s ease-in-out infinite' : 'none'
            }} />
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

            {/* Name */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1 }}>
                {taskSession.isActive ? 'Đang tập trung' : 'Tạm dừng'}
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                {taskSession.subtaskId
                  ? selectedTask.subtasks?.find(s => s.id === taskSession.subtaskId)?.title || selectedTask.title
                  : selectedTask.title}
              </div>
            </div>

            {/* Time display */}
            <span style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent-primary)', flexShrink: 0 }}>
              {formatFocusTime(taskSession.secondsLeft)}
            </span>

            {/* Pause / Resume */}
            <button
              onClick={() => toggleFocusSession(taskSession.id)}
              style={{ border: 'none', background: 'var(--bg-glass)', color: 'var(--text-primary)', borderRadius: '8px', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
              title={taskSession.isActive ? 'Tạm dừng' : 'Tiếp tục'}
            >
              {taskSession.isActive ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
            </button>

            {/* Stop & Log */}
            <button
              onClick={() => stopAndLogFocusSession(taskSession.id)}
              style={{ border: 'none', background: 'rgba(239,68,68,0.1)', color: 'var(--accent-danger)', borderRadius: '8px', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
              title="Kết thúc & lưu"
            >
              <Square size={14} fill="currentColor" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="slide-in" style={{
      padding: isMobile ? '0.75rem' : '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      height: '100%',
      minHeight: 'calc(100vh - 3rem)'
    }}>
      
      {/* Top Header: Projects in Horizontal Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="glass-panel" style={{ 
          padding: '0.75rem 1rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginRight: '1.4rem', whiteSpace: 'nowrap' }}>Dự án:</span>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {projects.map(proj => (
              <button
                key={proj.id}
                onClick={() => { setActiveList(proj.id); setSelectedTaskId(null); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.8rem',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: activeList === proj.id ? 'var(--border-color)' : 'rgba(255,255,255,0.02)',
                  color: 'var(--text-primary)',
                  fontWeight: activeList === proj.id ? 600 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: proj.color }} />
                <span>{proj.name}</span>
                {tasks.filter(t => t.status !== 'done' && t.projectId === proj.id).length > 0 && (
                  <span style={{ fontSize: '0.7rem', background: activeList === proj.id ? 'rgba(255,255,255,0.1)' : 'var(--border-color)', padding: '1px 6px', borderRadius: '10px', color: 'var(--text-muted)' }}>
                    {tasks.filter(t => t.status !== 'done' && t.projectId === proj.id).length}
                  </span>
                )}
              </button>
            ))}

            {/* Quick add project button */}
            <button 
              onClick={() => setIsAddingProject(!isAddingProject)}
              style={{
                border: 'none',
                background: 'rgba(99, 102, 241, 0.1)',
                color: 'var(--accent-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                flexShrink: 0
              }}
              title="Thêm dự án mới"
            >
              <Plus size={16} />
            </button>

            {isAddingProject && (
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-color)', flexShrink: 0 }}>
                <input 
                  type="text" 
                  placeholder="Tên dự án..." 
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newProjectName.trim()) {
                      addProject(newProjectName.trim(), newProjectColor);
                      setNewProjectName('');
                      setIsAddingProject(false);
                    }
                  }}
                  style={{ padding: '0.2rem 0.4rem', borderRadius: '4px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.75rem', width: '100px' }}
                />
                <input 
                  type="color" 
                  value={newProjectColor}
                  onChange={(e) => setNewProjectColor(e.target.value)}
                  style={{ width: '20px', height: '20px', border: 'none', borderRadius: '4px', background: 'transparent', cursor: 'pointer', padding: 0 }}
                />
                <button 
                  onClick={() => {
                    if (newProjectName.trim()) {
                      addProject(newProjectName.trim(), newProjectColor);
                      setNewProjectName('');
                      setIsAddingProject(false);
                    }
                  }}
                  style={{ border: 'none', background: 'var(--accent-primary)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', padding: '2px 6px', fontWeight: 600 }}
                >
                  Thêm
                </button>
                <button 
                  onClick={() => setIsAddingProject(false)}
                  style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer', padding: '2px' }}
                >
                  Hủy
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content pane: Action tasks lists & details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
        
        {/* Central Listing panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Smart Vietnamese NLP Input Box */}
          <div className="nlp-input-container" style={{
            padding: '0.75rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: isInputExpanded ? '0.75rem' : '0',
            transition: 'var(--transition-smooth)'
          }}>
            {/* Collapse/Expand Toggle Header */}
            <div 
              onClick={() => setIsInputExpanded(!isInputExpanded)}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              <span style={{ 
                fontSize: '0.78rem', 
                fontWeight: 700, 
                color: 'var(--text-secondary)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                ✍️ {isInputExpanded ? 'Nhập nhiệm vụ mới (NLP Smart)' : 'Bấm vào đây để nhập nhiệm vụ mới'}
              </span>
              <button 
                type="button"
                style={{ 
                  border: 'none', 
                  background: 'none', 
                  color: 'var(--text-muted)', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center',
                  padding: '2px'
                }}
              >
                {isInputExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {isInputExpanded && (
              <>
            {/* Row 1: Voice + Input + Project + Section + Add */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', flexWrap: 'wrap' }}>
              <button 
                onClick={handleVoiceInput}
                style={{
                  border: 'none',
                  background: isRecording ? 'var(--accent-danger)' : 'rgba(99, 102, 241, 0.1)',
                  color: isRecording ? '#fff' : 'var(--accent-primary)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)',
                  animation: isRecording ? 'pulseGlow 1.5s infinite ease-in-out' : 'none'
                }}
                title="Voice-to-Task (Tiếng Việt)"
              >
                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <input
                type="text"
                placeholder={isRecording ? "Đang lắng nghe..." : "Thêm nhiệm vụ... (ví dụ: 'Nộp báo cáo thứ Sáu lúc 3 chiều @Công việc #Marketing')"}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleNLPAdd}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
              {/* Project selector dropdown */}
              <select
                value={inputProjectId}
                onChange={(e) => {
                  setInputProjectId(e.target.value);
                  setInputSectionId('');
                }}
                style={{
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  padding: '4px 8px',
                  outline: 'none',
                  maxWidth: '120px',
                  cursor: 'pointer'
                }}
              >
                <option value="">-- Dự án --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              {/* Section selector dropdown */}
              {inputProjectId && (() => {
                const proj = projects.find(p => p.id === inputProjectId);
                const sections = proj ? (proj.sections || []) : [];
                if (sections.length === 0) return null;
                return (
                  <select
                    value={inputSectionId}
                    onChange={(e) => setInputSectionId(e.target.value)}
                    style={{
                      background: 'var(--bg-glass)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      padding: '4px 8px',
                      outline: 'none',
                      maxWidth: '120px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">-- Chuyên mục --</option>
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                );
              })()}

              
              <button 
                onClick={handleNLPButtonClick}
                style={{
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                  color: '#fff',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                Thêm
              </button>
            </div>

            {/* Row 2: Quick settings bar */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              borderTop: '1px dashed var(--border-color)',
              paddingTop: '0.65rem',
              marginTop: '0.25rem',
              flexWrap: 'wrap',
              width: '100%'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Thiết lập nhanh:</span>

              {/* Date Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ngày:</span>
                <input 
                  type="date"
                  value={quickDueDate}
                  onChange={(e) => {
                    setQuickDueDate(e.target.value);
                    setIsDateModified(true);
                  }}
                  onClick={(e) => { try { e.target.showPicker(); } catch(err){} }}
                  style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem',
                    padding: '2px 6px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>

              {/* Start Time Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Giờ:</span>
                <input 
                  type="time"
                  value={quickDueTime}
                  onChange={(e) => {
                    setQuickDueTime(e.target.value);
                    setIsTimeModified(true);
                  }}
                  onClick={(e) => { try { e.target.showPicker(); } catch(err){} }}
                  style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem',
                    padding: '2px 6px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>

              {/* Duration Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Dự kiến:</span>
                <input 
                  type="number"
                  min="0"
                  placeholder="Số phút..."
                  value={quickDuration}
                  onChange={(e) => setQuickDuration(e.target.value)}
                  style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem',
                    padding: '2px 6px',
                    width: '70px',
                    textAlign: 'center',
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>m</span>
              </div>

              {/* Eisenhower Matrix Quadrant Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ma trận:</span>
                <div style={{ display: 'flex', gap: '3px', background: 'rgba(255,255,255,0.03)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-color)', alignItems: 'center' }}>
                  {[
                    { id: '', label: 'Mặc định', color: 'var(--text-muted)', bgActive: 'rgba(255,255,255,0.1)' },
                    { id: 'Q1', label: 'Q1', color: 'var(--accent-danger)', bgActive: 'rgba(239, 68, 68, 0.2)' },
                    { id: 'Q2', label: 'Q2', color: 'var(--accent-secondary)', bgActive: 'rgba(168, 85, 247, 0.2)' },
                    { id: 'Q3', label: 'Q3', color: 'var(--accent-warning)', bgActive: 'rgba(245, 158, 11, 0.2)' },
                    { id: 'Q4', label: 'Q4', color: 'var(--text-muted)', bgActive: 'rgba(255, 255, 255, 0.15)' }
                  ].map(q => {
                    const isActive = quickEisenhower === q.id;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setQuickEisenhower(q.id)}
                        style={{
                          border: 'none',
                          background: isActive ? q.bgActive : 'transparent',
                          color: isActive ? q.color : 'var(--text-muted)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: isActive ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'var(--transition-smooth)',
                          border: isActive ? `1px solid ${q.color}` : '1px solid transparent'
                        }}
                        title={
                          q.id === 'Q1' ? 'Q1: Khẩn cấp & Quan trọng (Làm ngay)' :
                          q.id === 'Q2' ? 'Q2: Không khẩn nhưng Quan trọng (Lên kế hoạch)' :
                          q.id === 'Q3' ? 'Q3: Khẩn cấp nhưng Không quan trọng (Ủy quyền)' :
                          q.id === 'Q4' ? 'Q4: Không khẩn & Không quan trọng (Loại bỏ)' :
                          'Sử dụng mức ưu tiên mặc định của dự án'
                        }
                      >
                        {q.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
              </>
            )}
          </div>

          {/* Filters & View Toggle Row */}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Search Input */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                flex: isMobile ? 1 : 'none',
                width: isMobile ? 'auto' : '240px'
              }}>
                <Search size={14} style={{ color: 'var(--text-muted)' }} />
                <input 
                  type="text"
                  placeholder="Tìm kiếm nhiệm vụ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', width: '100%' }}
                />
              </div>

              {/* View Mode Toggle (Lịch trình | Ma trận) */}
              <div style={{
                display: 'flex',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '2px',
                gap: '2px'
              }}>
                {[
                  { id: 'calendar', label: 'Lịch trình' },
                  { id: 'eisenhower', label: 'Ma trận' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setViewMode(opt.id)}
                    style={{
                      border: 'none',
                      background: viewMode === opt.id ? 'var(--border-color)' : 'transparent',
                      color: 'var(--text-primary)',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar Navigation and Time Range Selector Group */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {/* Date Navigation Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button 
                  onClick={handlePrevDate} 
                  className="btn-secondary" 
                  style={{ padding: '0.4rem 0.6rem', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Ngày trước"
                >
                  <ChevronLeft size={14} />
                </button>
                
                <div 
                  className="btn-secondary" 
                  style={{ 
                    padding: '0.4rem 0.8rem', 
                    fontSize: '0.8rem', 
                    position: 'relative', 
                    overflow: 'hidden',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '32px',
                    fontWeight: 600
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
                
                <button 
                  onClick={handleNextDate} 
                  className="btn-secondary" 
                  style={{ padding: '0.4rem 0.6rem', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Ngày sau"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Time Range Selector (Ngày | Tuần | Tháng) */}
              <div style={{
                display: 'flex',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '2px',
                gap: '2px',
                height: '32px',
                alignItems: 'center'
              }}>
                {[
                  { id: 'day', label: 'Ngày' },
                  { id: 'week', label: 'Tuần' },
                  { id: 'month', label: 'Tháng' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setMatrixFilterMode(opt.id)}
                    style={{
                      border: 'none',
                      background: matrixFilterMode === opt.id ? 'var(--border-color)' : 'transparent',
                      color: 'var(--text-primary)',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {(() => {
            switch (viewMode) {
              case 'calendar':
                return <CalendarView hideHeader={true} hideToolbar={true} selectedTaskId={selectedTaskId} setSelectedTaskId={setSelectedTaskId} mode={matrixFilterMode} onModeChange={setMatrixFilterMode} currentDate={currentDate} setCurrentDate={setCurrentDate} />;
              case 'eisenhower':
              default:
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '0.5rem' : '1rem', width: '100%' }}>
                    {/* Q1: Urgent & Important */}
                    <div 
                      className="glass-panel" 
                      onDragOver={handleMatrixDragOver}
                      onDrop={(e) => handleMatrixDrop(e, 'Q1')}
                      style={{ padding: isMobile ? '0.6rem' : '1rem 1.2rem', minHeight: '160px', borderLeft: '4px solid var(--accent-danger)', position: 'relative' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span className="quadrant-badge-q1" style={{ fontSize: isMobile ? '0.68rem' : undefined, padding: isMobile ? '4px 6px' : undefined }}>
                          {isMobile ? 'Q1: Làm ngay' : 'Q1: Khẩn cấp & Quan trọng (Làm ngay)'}
                        </span>
                        <div 
                          onMouseEnter={() => setHoveredHelpQuadrant('Q1')}
                          onMouseLeave={() => setHoveredHelpQuadrant(null)}
                          style={{ color: 'var(--accent-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', position: 'relative' }}
                          title="Tìm hiểu về ô này"
                        >
                          <Lightbulb size={16} fill={hoveredHelpQuadrant === 'Q1' ? 'rgba(239, 68, 68, 0.2)' : 'none'} />
                          
                          {hoveredHelpQuadrant === 'Q1' && (
                            <div style={{
                              position: 'absolute',
                              top: '24px',
                              right: '0',
                              width: '260px',
                              background: 'var(--bg-glass)',
                              backdropFilter: 'blur(12px)',
                              border: '1px solid var(--accent-danger)',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              zIndex: 100,
                              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                              color: 'var(--text-primary)',
                              fontSize: '0.78rem',
                              lineHeight: '1.4',
                              textAlign: 'left'
                            }}>
                              <strong style={{ color: 'var(--accent-danger)', display: 'block', marginBottom: '4px' }}>🎯 Quadrant I: Làm ngay lập tức</strong>
                              Các công việc khẩn cấp và có tầm quan trọng cao, cần hoàn thành ngay để tránh hậu quả nghiêm trọng (ví dụ: khủng hoảng, deadline sát nút, sự cố đột xuất).
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {q1Tasks.map(t => renderMatrixTask(t))}
                        {q1Tasks.length === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Không có nhiệm vụ</span>}
                      </div>
                    </div>

                    {/* Q2: Important, Not Urgent */}
                    <div 
                      className="glass-panel" 
                      onDragOver={handleMatrixDragOver}
                      onDrop={(e) => handleMatrixDrop(e, 'Q2')}
                      style={{ padding: isMobile ? '0.6rem' : '1rem 1.2rem', minHeight: '160px', borderLeft: '4px solid var(--accent-secondary)', position: 'relative' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span className="quadrant-badge-q2" style={{ fontSize: isMobile ? '0.68rem' : undefined, padding: isMobile ? '4px 6px' : undefined }}>
                          {isMobile ? 'Q2: Lên kế hoạch' : 'Q2: Quan trọng · Lên kế hoạch'}
                        </span>
                        <div 
                          onMouseEnter={() => setHoveredHelpQuadrant('Q2')}
                          onMouseLeave={() => setHoveredHelpQuadrant(null)}
                          style={{ color: 'var(--accent-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', position: 'relative' }}
                          title="Tìm hiểu về ô này"
                        >
                          <Lightbulb size={16} fill={hoveredHelpQuadrant === 'Q2' ? 'rgba(168, 85, 247, 0.2)' : 'none'} />
                          
                          {hoveredHelpQuadrant === 'Q2' && (
                            <div style={{
                              position: 'absolute',
                              top: '24px',
                              right: '0',
                              width: '260px',
                              background: 'var(--bg-glass)',
                              backdropFilter: 'blur(12px)',
                              border: '1px solid var(--accent-secondary)',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              zIndex: 100,
                              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                              color: 'var(--text-primary)',
                              fontSize: '0.78rem',
                              lineHeight: '1.4',
                              textAlign: 'left'
                            }}>
                              <strong style={{ color: 'var(--accent-secondary)', display: 'block', marginBottom: '4px' }}>🌱 Quadrant II: Lên kế hoạch thực hiện</strong>
                              Các công việc quan trọng lâu dài nhưng không gấp gáp. Đây là ô cốt lõi giúp phát triển bản thân và tạo giá trị bền vững (ví dụ: học tập, tập thể thao, lên kế hoạch). Nên dành phần lớn thời gian tại đây.
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {q2Tasks.map(t => renderMatrixTask(t))}
                        {q2Tasks.length === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Không có nhiệm vụ</span>}
                      </div>
                    </div>

                    {/* Q3: Urgent, Not Important */}
                    <div 
                      className="glass-panel" 
                      onDragOver={handleMatrixDragOver}
                      onDrop={(e) => handleMatrixDrop(e, 'Q3')}
                      style={{ padding: isMobile ? '0.6rem' : '1rem 1.2rem', minHeight: '160px', borderLeft: '4px solid var(--accent-warning)', position: 'relative' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span className="quadrant-badge-q3" style={{ fontSize: isMobile ? '0.68rem' : undefined, padding: isMobile ? '4px 6px' : undefined }}>
                          {isMobile ? 'Q3: Ủy quyền' : 'Q3: Khẩn cấp · Ủy quyền'}
                        </span>
                        <div 
                          onMouseEnter={() => setHoveredHelpQuadrant('Q3')}
                          onMouseLeave={() => setHoveredHelpQuadrant(null)}
                          style={{ color: 'var(--accent-warning)', cursor: 'pointer', display: 'flex', alignItems: 'center', position: 'relative' }}
                          title="Tìm hiểu về ô này"
                        >
                          <Lightbulb size={16} fill={hoveredHelpQuadrant === 'Q3' ? 'rgba(245, 158, 11, 0.2)' : 'none'} />
                          
                          {hoveredHelpQuadrant === 'Q3' && (
                            <div style={{
                              position: 'absolute',
                              top: '24px',
                              right: '0',
                              width: '260px',
                              background: 'var(--bg-glass)',
                              backdropFilter: 'blur(12px)',
                              border: '1px solid var(--accent-warning)',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              zIndex: 100,
                              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                              color: 'var(--text-primary)',
                              fontSize: '0.78rem',
                              lineHeight: '1.4',
                              textAlign: 'left'
                            }}>
                              <strong style={{ color: 'var(--accent-warning)', display: 'block', marginBottom: '4px' }}>⚡ Quadrant III: Ủy quyền hoặc làm nhanh</strong>
                              Các công việc gấp gáp nhưng không đóng góp nhiều vào mục tiêu dài hạn của bạn (ví dụ: email/tin nhắn rác, cuộc gọi cắt ngang, việc vặt). Hãy tìm cách ủy quyền, từ chối hoặc giải quyết nhanh gọn.
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {q3Tasks.map(t => renderMatrixTask(t))}
                        {q3Tasks.length === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Không có nhiệm vụ</span>}
                      </div>
                    </div>

                    {/* Q4: Not Urgent & Not Important */}
                    <div 
                      className="glass-panel" 
                      onDragOver={handleMatrixDragOver}
                      onDrop={(e) => handleMatrixDrop(e, 'Q4')}
                      style={{ padding: isMobile ? '0.6rem' : '1rem 1.2rem', minHeight: '160px', borderLeft: '4px solid var(--text-muted)', position: 'relative' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span className="quadrant-badge-q4" style={{ fontSize: isMobile ? '0.68rem' : undefined, padding: isMobile ? '4px 6px' : undefined }}>
                          {isMobile ? 'Q4: Loại bỏ' : 'Q4: Không quan trọng · Loại bỏ'}
                        </span>
                        <div 
                          onMouseEnter={() => setHoveredHelpQuadrant('Q4')}
                          onMouseLeave={() => setHoveredHelpQuadrant(null)}
                          style={{ color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', position: 'relative' }}
                          title="Tìm hiểu về ô này"
                        >
                          <Lightbulb size={16} fill={hoveredHelpQuadrant === 'Q4' ? 'rgba(255, 255, 255, 0.2)' : 'none'} />
                          
                          {hoveredHelpQuadrant === 'Q4' && (
                            <div style={{
                              position: 'absolute',
                              top: '24px',
                              right: '0',
                              width: '260px',
                              background: 'var(--bg-glass)',
                              backdropFilter: 'blur(12px)',
                              border: '1px solid var(--text-muted)',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              zIndex: 100,
                              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                              color: 'var(--text-primary)',
                              fontSize: '0.78rem',
                              lineHeight: '1.4',
                              textAlign: 'left'
                            }}>
                              <strong style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>🗑️ Quadrant IV: Hạn chế & Loại bỏ</strong>
                              Các hoạt động tiêu tốn thời gian mà không đem lại giá trị thiết thực (ví dụ: lướt mạng xã hội vô thức, xem phim giải trí quá độ, thói quen trì hoãn). Hãy giảm thiểu tối đa hoặc loại bỏ chúng.
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {q4Tasks.map(t => renderMatrixTask(t))}
                        {q4Tasks.length === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Không có nhiệm vụ</span>}
                      </div>
                    </div>
                  </div>
                );
            }
          })()}
        </div>

      </div>
    </div>
  );
}

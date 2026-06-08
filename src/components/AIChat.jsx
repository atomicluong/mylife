import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  FolderPlus,
  Folder,
  Edit3,
  Check,
  X,
  Layers,
  Settings,
  AlertCircle,
  ChevronRight,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GEMINI_MODELS, DEFAULT_MODEL_ID, getModelInfo } from '../utils/aiPricing';

export default function AIChat() {
  const {
    tasks,
    incomes,
    expenses,
    projects,
    preferences,
    setPreferences,
    addAiUsageLog,
    aiUsageLogs,
    user
  } = useApp();

  // --- Seed Data Initializers ---
  const defaultTopics = [
    { id: 'top-mylife', name: 'Mylife', icon: '🌱' },
    { id: 'top-business', name: 'Kinh doanh', icon: '💼' },
    { id: 'top-study', name: 'Học tập', icon: '📚' }
  ];

  const defaultThreads = [
    {
      id: 'th-mylife-seed',
      topicId: 'top-mylife',
      title: 'Ý tưởng cân bằng cuộc sống',
      messages: [
        { id: 'm1', role: 'user', text: 'Tôi muốn lập kế hoạch thói quen buổi sáng tốt cho sức khỏe solopreneur.', createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: 'm2', role: 'model', text: 'Chào anh Lương! Đối với một solopreneur, thói quen buổi sáng chính là "trọng neo" giúp giữ vững sự tập trung cả ngày. Tôi đề xuất chuỗi 3 bước tối giản:\n\n1. **Thiền 10 phút**: Giúp tĩnh tâm trước khi các email hay tin nhắn hối thúc ập đến.\n2. **Uống nước & Đọc sách 15 phút**: Phát triển tư duy bằng 5-10 trang sách thuộc chủ đề phát triển bản thân.\n3. **Lập ma trận Eisenhower ngày**: Dành 5 phút định hình rõ việc nào là Q1 (Khẩn cấp & Quan trọng) cần xử lý ngay khung giờ vàng buổi sáng.', createdAt: new Date(Date.now() - 3000000).toISOString() }
      ]
    },
    {
      id: 'th-business-seed',
      topicId: 'top-business',
      title: 'Chiến lược combo bánh canh',
      messages: [
        { id: 'm3', role: 'user', text: 'Làm thế nào để tăng giá trị trung bình bill của quán bánh canh lên 90k?', createdAt: new Date(Date.now() - 7200000).toISOString() },
        { id: 'm4', role: 'model', text: 'Để tăng bill từ mức trung bình 60k hiện tại lên 90k, anh có thể áp dụng 3 đòn bẩy tâm lý tiêu dùng sau:\n\n*   **Thiết lập Combo Đóng Gói (Upsell)**: Tạo combo gồm 1 Bát Bánh Canh Thập Cẩm + 1 Phần Quẩy Giòn + 1 Nước Ép tự chọn với giá gộp 89.000đ. Khách hàng sẽ thấy hời hơn mua lẻ từng món.\n*   **Thêm Món Ăn Kèm Đặc Biệt (Add-ons)**: Thêm các phần trứng non lòng đào, giò gân heo hầm mềm, hoặc chả mực Hạ Long bán riêng lẻ giá 15k - 25k/phần làm món gọi thêm.\n*   **Kịch bản gợi ý trực tiếp**: Đào tạo nhân viên khi nhận order luôn hỏi: *"Anh/chị có dùng thêm trứng non lòng đào béo ngậy ăn kèm bánh canh nhà em không ạ?"* thay vì hỏi *"Có ăn thêm gì không?"*.', createdAt: new Date(Date.now() - 6500000).toISOString() }
      ]
    }
  ];

  // --- States ---
  const [topics, setTopics] = useState(() => {
    try {
      const saved = localStorage.getItem('tf_chat_topics');
      if (saved && saved !== 'null' && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return defaultTopics;
  });

  const [threads, setThreads] = useState(() => {
    try {
      const saved = localStorage.getItem('tf_chat_threads');
      if (saved && saved !== 'null' && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return defaultThreads;
  });
  
  const [activeTopicId, setActiveTopicId] = useState(() => {
    const savedThreadId = localStorage.getItem('tf_active_thread_id');
    if (savedThreadId && savedThreadId !== 'null' && savedThreadId !== 'undefined') {
      const foundThread = threads.find(t => t.id === savedThreadId);
      if (foundThread) {
        return foundThread.topicId;
      }
    }
    const savedTopicId = localStorage.getItem('tf_active_topic_id');
    if (savedTopicId && savedTopicId !== 'null' && savedTopicId !== 'undefined') {
      const topicExists = topics.some(t => t.id === savedTopicId);
      if (topicExists) return savedTopicId;
    }
    return topics[0]?.id || null;
  });
  const [activeThreadId, setActiveThreadId] = useState(() => {
    const savedThreadId = localStorage.getItem('tf_active_thread_id');
    if (savedThreadId && savedThreadId !== 'null' && savedThreadId !== 'undefined') {
      const threadExists = threads.some(t => t.id === savedThreadId);
      if (threadExists) return savedThreadId;
    }
    // Fallback: first thread of the resolved activeTopicId on reload
    const savedThreadIdForTopic = localStorage.getItem('tf_active_thread_id');
    let resolvedTopicId = null;
    if (savedThreadIdForTopic && savedThreadIdForTopic !== 'null' && savedThreadIdForTopic !== 'undefined') {
      const foundThread = threads.find(t => t.id === savedThreadIdForTopic);
      if (foundThread) {
        resolvedTopicId = foundThread.topicId;
      }
    }
    if (!resolvedTopicId) {
      const savedTopicId = localStorage.getItem('tf_active_topic_id');
      if (savedTopicId && savedTopicId !== 'null' && savedTopicId !== 'undefined') {
        const topicExists = topics.some(t => t.id === savedTopicId);
        if (topicExists) resolvedTopicId = savedTopicId;
      }
    }
    if (!resolvedTopicId) {
      resolvedTopicId = topics[0]?.id || null;
    }
    const topicThreads = threads.filter(t => t.topicId === resolvedTopicId);
    return topicThreads[0]?.id || null;
  });

  const [expandedTopics, setExpandedTopics] = useState(() => {
    return {
      'top-mylife': true,
      'top-business': true,
      'top-study': true
    };
  });

  // UI inputs
  const [chatInput, setChatInput] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [editingTopicDescription, setEditingTopicDescription] = useState('');
  const [editingTopicNameId, setEditingTopicNameId] = useState(null);
  const [editingTopicNameValue, setEditingTopicNameValue] = useState('');
  const [editingThreadId, setEditingThreadId] = useState(null);
  const [editingThreadTitle, setEditingThreadTitle] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [includeContext, setIncludeContext] = useState(true);
  const [googleSearchEnabled, setGoogleSearchEnabled] = useState(() => {
    const saved = localStorage.getItem('tf_google_search_enabled');
    return saved !== 'false';
  });
  const [thinkingLevel, setThinkingLevel] = useState(() => {
    return localStorage.getItem('tf_thinking_level') || 'OFF';
  });
  const [errorMessage, setErrorMessage] = useState('');

  const chatEndRef = useRef(null);

  // --- Voice Mode & Multimodal States ---
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null); // { name, type, data, isImage }
  const [generationMode, setGenerationMode] = useState(null); // 'image' | 'video' | null
  
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'vi-VN';
      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setChatInput(prev => prev + (prev ? ' ' : '') + text);
        setIsListening(false);
      };
      rec.onerror = (e) => {
        console.error(e);
        setIsListening(false);
      };
      rec.onend = () => {
        setIsListening(false);
      };
      recognitionRef.current = rec;
    }
  }, []);

  // Speech Synthesizer
  const speakText = (text) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_\-]/g, '').slice(0, 300);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'vi-VN';
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang.includes('VI') || v.lang.includes('vi'));
    if (viVoice) {
      utterance.voice = viVoice;
    }
    window.speechSynthesis.speak(utterance);
  };

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói (Speech Recognition). Vui lòng thử Chrome hoặc Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFile({
          name: file.name,
          type: file.type,
          data: reader.result,
          isImage: true
        });
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFile({
          name: file.name,
          type: file.type,
          data: reader.result,
          isImage: false
        });
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  // Image Generation Simulation
  const handleGenerateImage = (promptText) => {
    const encodedPrompt = encodeURIComponent(promptText);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
    
    const userMsg = {
      id: `m-${uuid()}`,
      role: 'user',
      text: `🎨 Tạo ảnh AI: "${promptText}"`,
      createdAt: new Date().toISOString()
    };

    const modelMsg = {
      id: `m-${uuid()}`,
      role: 'model',
      text: `🎨 Dưới đây là tác phẩm ảnh nghệ thuật AI được tạo dựa trên mô tả của bạn:`,
      media: {
        type: 'image',
        url: imageUrl
      },
      createdAt: new Date().toISOString()
    };

    setThreads(prev => prev.map(t => 
      t.id === activeThreadId ? { ...t, messages: [...t.messages, userMsg, modelMsg] } : t
    ));
    setGenerationMode(null);
  };

  // Video Generation Simulation
  const handleGenerateVideo = (promptText) => {
    const userMsg = {
      id: `m-${uuid()}`,
      role: 'user',
      text: `🎬 Tạo video AI: "${promptText}"`,
      createdAt: new Date().toISOString()
    };

    setThreads(prev => prev.map(t => 
      t.id === activeThreadId ? { ...t, messages: [...t.messages, userMsg] } : t
    ));

    setIsAiTyping(true);
    
    setTimeout(() => {
      const videoUrls = [
        'https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-loop-41851-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-loop-1611-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-waves-of-blue-and-purple-light-loop-41584-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-flying-through-a-futuristic-tunnel-loop-41551-large.mp4'
      ];
      const hash = promptText.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const selectedVideoUrl = videoUrls[hash % videoUrls.length];

      const modelMsg = {
        id: `m-${uuid()}`,
        role: 'model',
        text: `🎬 Video AI của bạn đã kết xuất thành công! Bạn có thể phát hoặc lưu video:`,
        media: {
          type: 'video',
          url: selectedVideoUrl
        },
        createdAt: new Date().toISOString()
      };

      setThreads(prev => prev.map(t => 
        t.id === activeThreadId ? { ...t, messages: [...t.messages, modelMsg] } : t
      ));
      setIsAiTyping(false);
      setGenerationMode(null);
    }, 3000);
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('tf_chat_topics', JSON.stringify(topics));
  }, [topics]);

  useEffect(() => {
    localStorage.setItem('tf_chat_threads', JSON.stringify(threads));
  }, [threads]);

  useEffect(() => {
    localStorage.setItem('tf_thinking_level', thinkingLevel);
  }, [thinkingLevel]);

  useEffect(() => {
    localStorage.setItem('tf_google_search_enabled', googleSearchEnabled);
  }, [googleSearchEnabled]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [threads, isAiTyping, activeThreadId]);

  // Sync active topic and thread selection to localStorage to preserve state on F5 reload
  useEffect(() => {
    if (activeTopicId) {
      localStorage.setItem('tf_active_topic_id', activeTopicId);
    }
  }, [activeTopicId]);

  useEffect(() => {
    if (activeThreadId) {
      localStorage.setItem('tf_active_thread_id', activeThreadId);
    } else {
      localStorage.removeItem('tf_active_thread_id');
    }
  }, [activeThreadId]);

  // Switch active thread if topic changes
  const handleSelectTopic = (topicId) => {
    setActiveTopicId(topicId);
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: true
    }));

    const topicThreads = threads.filter(t => t.topicId === topicId);
    const currentActiveThread = threads.find(t => t.id === activeThreadId);
    if (!currentActiveThread || currentActiveThread.topicId !== topicId) {
      if (topicThreads.length > 0) {
        setActiveThreadId(topicThreads[0].id);
      } else {
        setActiveThreadId(null);
      }
    }
  };

  const toggleTopicExpand = (topicId) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  // Helper to generate UUIDs
  const uuid = () => Math.random().toString(36).substring(2, 15);

  // --- Topic actions ---
  const handleAddTopic = (e) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    const newTopic = {
      id: `top-${uuid()}`,
      name: newTopicName.trim(),
      description: newTopicDescription.trim(),
      icon: '📁'
    };
    setTopics(prev => [...prev, newTopic]);
    setNewTopicName('');
    setNewTopicDescription('');
    setIsAddingTopic(false);
    setActiveTopicId(newTopic.id);
    setActiveThreadId(null);
    setExpandedTopics(prev => ({ ...prev, [newTopic.id]: true }));
  };

  const handleDeleteTopic = (topicId, e) => {
    e.stopPropagation();
    if (confirm('Xóa Chủ đề này sẽ xóa toàn bộ các đoạn chat con bên trong. Bạn chắc chắn chứ?')) {
      const nextTopics = topics.filter(t => t.id !== topicId);
      setTopics(nextTopics);
      setThreads(prev => prev.filter(t => t.topicId !== topicId));

      // Switch active topic if deleted
      if (activeTopicId === topicId) {
        if (nextTopics.length > 0) {
          handleSelectTopic(nextTopics[0].id);
        } else {
          setActiveTopicId(null);
          setActiveThreadId(null);
        }
      }
    }
  };

  const handleSaveTopicName = (topicId) => {
    if (!editingTopicNameValue.trim()) return;
    setTopics(prev => prev.map(t =>
      t.id === topicId ? { ...t, name: editingTopicNameValue.trim() } : t
    ));
    setEditingTopicNameId(null);
    setEditingTopicNameValue('');
  };

  const handleSaveTopicDescription = (topicId) => {
    setTopics(prev => prev.map(t =>
      t.id === topicId ? { ...t, description: editingTopicDescription.trim() } : t
    ));
    setEditingTopicId(null);
    setEditingTopicDescription('');
  };

  // --- Thread actions ---
  const handleCreateThread = (topicId) => {
    const targetTopicId = topicId || activeTopicId;
    if (!targetTopicId) {
      alert('Vui lòng chọn hoặc tạo Chủ đề trước khi tạo Đoạn chat mới!');
      return;
    }
    const topicThreads = threads.filter(t => t.topicId === targetTopicId);
    const newThread = {
      id: `th-${uuid()}`,
      topicId: targetTopicId,
      title: `Đoạn chat mới #${topicThreads.length + 1}`,
      messages: []
    };
    setThreads(prev => [...prev, newThread]);
    setActiveTopicId(targetTopicId);
    setActiveThreadId(newThread.id);
    setExpandedTopics(prev => ({ ...prev, [targetTopicId]: true }));
  };

  const handleDeleteThread = (threadId, e) => {
    e.stopPropagation();
    if (confirm('Bạn thực sự muốn xóa đoạn hội thoại này?')) {
      const nextThreads = threads.filter(t => t.id !== threadId);
      setThreads(nextThreads);
      if (activeThreadId === threadId) {
        const topicThreads = nextThreads.filter(t => t.topicId === activeTopicId);
        if (topicThreads.length > 0) {
          setActiveThreadId(topicThreads[0].id);
        } else {
          setActiveThreadId(null);
        }
      }
    }
  };

  const handleStartRenameThread = (thread) => {
    setEditingThreadId(thread.id);
    setEditingThreadTitle(thread.title);
  };

  const handleSaveRenameThread = (threadId) => {
    if (!editingThreadTitle.trim()) return;
    setThreads(prev => prev.map(t => 
      t.id === threadId ? { ...t, title: editingThreadTitle.trim() } : t
    ));
    setEditingThreadId(null);
  };

  // --- Context Serialization Helper ---
  const serializeCurrentContext = () => {
    // 1. Active Tasks
    const activeTasks = tasks.filter(t => t.status !== 'done').slice(0, 10);
    const activeTasksSummary = activeTasks.map(t => {
      const projName = projects.find(p => p.id === t.projectId)?.name || 'Chung';
      return `- ${t.title} (Dự án: ${projName}, Eisenhower: ${t.eisenhower}, Hạn chót: ${t.dueDate || 'Chưa có'})`;
    }).join('\n');

    // 2. Finance Summary (Current Month)
    const thisMonthStr = new Date().toISOString().substring(0, 7);
    const thisMonthIncomes = incomes.filter(inc => inc.date.startsWith(thisMonthStr)).reduce((sum, inc) => sum + inc.amount, 0);
    const thisMonthExpenses = expenses.filter(exp => exp.date.startsWith(thisMonthStr)).reduce((sum, exp) => sum + exp.amount, 0);

    return `
=== NGỮ CẢNH CÔNG VIỆC HIỆN TẠI ===
1. Các công việc đang thực hiện:
${activeTasksSummary || '- Không có công việc nào đang dang dở.'}

2. Tóm tắt tài chính tháng này:
- Tổng thu nhập: $${thisMonthIncomes}
- Tổng chi tiêu: $${thisMonthExpenses}
===================================
`;
  };

  // --- Simple Markdown to Styled JSX/HTML Parser ---
  const renderMarkdown = (text) => {
    if (!text) return null;
    
    // Protect code blocks first
    const blocks = text.split(/(```[\s\S]*?```)/g);
    
    return blocks.map((block, idx) => {
      if (block.startsWith('```')) {
        const lines = block.split('\n');
        const language = lines[0].replace('```', '').trim();
        const codeContent = lines.slice(1, -1).join('\n');
        return (
          <pre 
            key={idx} 
            style={{ 
              background: 'rgba(0, 0, 0, 0.2)', 
              padding: '0.75rem', 
              borderRadius: '6px', 
              overflowX: 'auto', 
              fontFamily: 'monospace', 
              fontSize: '0.85rem',
              margin: '0.5rem 0',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)'
            }}
          >
            {language && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{language}</div>}
            <code>{codeContent}</code>
          </pre>
        );
      } else {
        let html = block;
        
        // 1. Headers: ###, ##, #
        html = html.replace(/^### (.*$)/gim, '<h3 style="font-size: 1.05rem; font-weight: 700; margin-top: 0.75rem; margin-bottom: 0.25rem; color: var(--text-primary);">$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2 style="font-size: 1.15rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.35rem; color: var(--text-primary);">$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1 style="font-size: 1.25rem; font-weight: 800; margin-top: 1.25rem; margin-bottom: 0.5rem; color: var(--text-primary);">$1</h1>');
        
        // 2. Horizontal lines: ---
        html = html.replace(/^---$/gim, '<hr style="border: 0; border-top: 1px solid var(--border-color); margin: 1rem 0;" />');

        // 3. Bold: **text** or __text__
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

        // 4. Italic: *text* or _text_
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // 5. Inline Code: `code`
        html = html.replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.08); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 0.9em;">$1</code>');
        
        // 6. Split by lines to parse bullet points and numbered lists
        const lines = html.split('\n');
        const parsedLines = lines.map(line => {
          const trimmed = line.trim();
          
          // Bullet list (*, -, +)
          const bulletMatch = line.match(/^(\s*)([*\-+])\s+(.*)$/);
          if (bulletMatch) {
            const indent = bulletMatch[1].length;
            const content = bulletMatch[3];
            return `<div style="display: flex; gap: 8px; margin-left: ${indent * 8 + 12}px; margin-top: 4px; margin-bottom: 4px;">
              <span style="color: var(--accent-primary); flex-shrink: 0;">•</span>
              <div>${content}</div>
            </div>`;
          }
          
          // Numbered list (1., 2.)
          const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
          if (numMatch) {
            const indent = numMatch[1].length;
            const num = numMatch[2];
            const content = numMatch[3];
            return `<div style="display: flex; gap: 8px; margin-left: ${indent * 8 + 12}px; margin-top: 4px; margin-bottom: 4px;">
              <span style="color: var(--accent-primary); flex-shrink: 0; font-weight: 600;">${num}.</span>
              <div>${content}</div>
            </div>`;
          }

          if (trimmed === '') {
            return '<div style="height: 0.5rem;"></div>';
          }
          
          return `<div>${line}</div>`;
        });
        
        const finalHtml = parsedLines.join('');
        
        return (
          <span 
            key={idx} 
            dangerouslySetInnerHTML={{ __html: finalHtml }} 
            style={{ lineHeight: 1.6, display: 'block' }} 
          />
        );
      }
    });
  };

  // --- Send Message to Gemini API (Streaming version) ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!chatInput.trim() && !attachedFile) || !activeThreadId) return;

    // Capture attached file and reset preview state instantly
    const activeFile = attachedFile;
    setAttachedFile(null);

    const userMsgText = chatInput.trim();
    setChatInput('');
    setErrorMessage('');

    // --- NLP Routing for AI Image / Video generation ---
    const normalizedText = userMsgText.toLowerCase();
    if (normalizedText.startsWith('tạo ảnh') || normalizedText.startsWith('vẽ ảnh') || normalizedText.startsWith('generate image') || generationMode === 'image') {
      const prompt = userMsgText.replace(/^(tạo ảnh|vẽ ảnh|generate image)\s*/i, '') || 'Abstract creative digital art';
      handleGenerateImage(prompt);
      return;
    }
    if (normalizedText.startsWith('tạo video') || normalizedText.startsWith('vẽ video') || normalizedText.startsWith('generate video') || generationMode === 'video') {
      const prompt = userMsgText.replace(/^(tạo video|vẽ video|generate video)\s*/i, '') || 'Cinematic neon visualizer';
      handleGenerateVideo(prompt);
      return;
    }

    const apiKey = preferences.geminiApiKey;
    const model = preferences.geminiModel || DEFAULT_MODEL_ID;

    if (!apiKey) {
      alert('⚠️ Vui lòng cấu hình Gemini API Key trong tab "Thiết Lập" trước khi gửi tin nhắn!');
      return;
    }

    // 1. Append user message to state
    const userMessage = {
      id: `m-${uuid()}`,
      role: 'user',
      text: userMsgText || (activeFile ? `[Gửi tệp: ${activeFile.name}]` : ''),
      media: activeFile && activeFile.isImage ? { type: 'image', url: activeFile.data } : undefined,
      createdAt: new Date().toISOString()
    };

    let currentThread = threads.find(t => t.id === activeThreadId);
    const updatedMessages = [...currentThread.messages, userMessage];

    // If first message, auto rename thread based on prompt
    let newTitle = currentThread.title;
    if (currentThread.messages.length === 0) {
      newTitle = userMsgText.split(' ').slice(0, 5).join(' ') + (userMsgText.split(' ').length > 5 ? '...' : '');
      if (!newTitle && activeFile) newTitle = `Tệp: ${activeFile.name}`;
    }

    setThreads(prev => prev.map(t => 
      t.id === activeThreadId ? { ...t, messages: updatedMessages, title: newTitle } : t
    ));

    // 2. Call Gemini
    setIsAiTyping(true);

    // Build context
    const contextText = includeContext ? serializeCurrentContext() : '';
    const userCustomInstructions = preferences.customAiContext
      ? `\n=== CHỈ DẪN CÁ NHÂN & HỒ SƠ SOLOPRENEUR CỦA TÔI ===\n${preferences.customAiContext}\n=====================================================\n`
      : '';

    const currentTopic = topics.find(t => t.id === activeTopicId);
    const topicContext = currentTopic?.description
      ? `\n=== NGỮ CẢNH CHỦ ĐỀ: "${currentTopic.name}" ===\n${currentTopic.description}\n==============================================\n`
      : '';

    // Standard instruction
    const systemPrompt = `You are a helpful AI Assistant integrated directly inside the Solopreneur app TimeFlow V2.
You have access to the user's custom instructions/solopreneur profile and their current work context.
Help them answer queries, outline strategies, debug issues, write emails, and generate actionable items.
Be concise, practical, and prioritize Vietnamese in your communication.`;

    // Map conversation messages to Gemini's role/parts schema
    const contentsPayload = [];

    // Prior history messages
    for (let i = 0; i < updatedMessages.length - 1; i++) {
      contentsPayload.push({
        role: updatedMessages[i].role,
        parts: [{ text: updatedMessages[i].text }]
      });
    }

    // Current message with potential multimodal parts
    const lastMsgParts = [];

    // 1. Add Image payload if exists
    if (activeFile && activeFile.isImage) {
      const base64Data = activeFile.data.split(',')[1];
      lastMsgParts.push({
        inlineData: {
          mimeType: activeFile.type,
          data: base64Data
        }
      });
    }

    // 2. Add text payload (combine with text document context if raw file uploaded)
    let textToSend = userMsgText;
    if (activeFile && !activeFile.isImage) {
      textToSend = `[Đã đính kèm tệp: ${activeFile.name}]\n\`\`\`\n${activeFile.data}\n\`\`\`\n\n${userMsgText}`;
    }

    // Prepend instructions if first message
    if (contentsPayload.length === 0) {
      textToSend = `${systemPrompt}\n\n${userCustomInstructions}${topicContext}\n${contextText}\n\nYêu cầu đầu tiên: ${textToSend}`;
    }

    lastMsgParts.push({ text: textToSend || 'Phân tích tệp này giúp tôi.' });

    contentsPayload.push({
      role: 'user',
      parts: lastMsgParts
    });

    try {
      const requestBody = JSON.stringify({
        contents: contentsPayload,
        tools: googleSearchEnabled ? [{ google_search: {} }] : undefined,
        generationConfig: thinkingLevel !== 'OFF' ? {
          thinkingConfig: {
            thinkingBudget: thinkingLevel === 'MINIMAL' ? 512
              : thinkingLevel === 'LOW' ? 1024
              : thinkingLevel === 'MEDIUM' ? 8192
              : 24576
          }
        } : undefined
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: requestBody }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Lỗi kết nối API');
      }

      // Create a placeholder message in state
      const modelMessageId = `m-${uuid()}`;
      const modelMessagePlaceholder = {
        id: modelMessageId,
        role: 'model',
        text: '', // Start empty
        createdAt: new Date().toISOString()
      };

      setThreads(prev => prev.map(t => 
        t.id === activeThreadId ? { ...t, messages: [...t.messages, modelMessagePlaceholder] } : t
      ));

      setIsAiTyping(false); // Disable typing indicator since stream has begun

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let streamText = '';
      let buffer = '';
      let rafId = null;

      // Batch DOM updates to animation frames to eliminate streaming jitter
      const scheduleUIUpdate = () => {
        if (!rafId) {
          rafId = requestAnimationFrame(() => {
            setThreads(prev => prev.map(t => {
              if (t.id === activeThreadId) {
                return {
                  ...t,
                  messages: t.messages.map(m =>
                    m.id === modelMessageId ? { ...m, text: streamText } : m
                  )
                };
              }
              return t;
            }));
            rafId = null;
          });
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let parts = buffer.split('\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const line = part.trim();
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.substring(6);
              const data = JSON.parse(jsonStr);
              if (data.usageMetadata) {
                const promptTokens = data.usageMetadata.promptTokenCount || 0;
                const candidatesTokens = data.usageMetadata.candidatesTokenCount || 0;
                if (promptTokens > 0 || candidatesTokens > 0) {
                  addAiUsageLog(model, promptTokens, candidatesTokens);
                }
              }
              const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textChunk) {
                streamText += textChunk;
                scheduleUIUpdate();
              }
            } catch (e) {
              // Ignore partial JSON parsing errors
            }
          }
        }
      }

      // Flush remaining buffer
      if (buffer.trim().startsWith('data: ')) {
        try {
          const jsonStr = buffer.trim().substring(6);
          const data = JSON.parse(jsonStr);
          if (data.usageMetadata) {
            const promptTokens = data.usageMetadata.promptTokenCount || 0;
            const candidatesTokens = data.usageMetadata.candidatesTokenCount || 0;
            if (promptTokens > 0 || candidatesTokens > 0) {
              addAiUsageLog(model, promptTokens, candidatesTokens);
            }
          }
          const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textChunk) streamText += textChunk;
        } catch (e) {}
      }

      // Cancel any pending rAF and do one final flush to guarantee full content
      if (rafId) cancelAnimationFrame(rafId);
      setThreads(prev => prev.map(t => {
        if (t.id === activeThreadId) {
          return {
            ...t,
            messages: t.messages.map(m =>
              m.id === modelMessageId ? { ...m, text: streamText } : m
            )
          };
        }
        return t;
      }));

      // Read aloud if TTS voice mode is active
      speakText(streamText);

    } catch (err) {
      console.error(err);
      let errMsg = `Lỗi kết nối: ${err.message}. Vui lòng kiểm tra lại cấu hình hoặc mạng.`;
      const normalizedMsg = err.message.toLowerCase();
      if (normalizedMsg.includes('quota') || normalizedMsg.includes('billing') || normalizedMsg.includes('limit') || normalizedMsg.includes('rate')) {
        errMsg += ' \n\n💡 Gợi ý: Nếu bạn đang sử dụng API Key miễn phí, hãy thử tắt tùy chọn "Kết nối Internet (Google Search)" vì tính năng tìm kiếm mạng tiêu tốn nhiều tài nguyên định mức (quota) hơn. Ngoài ra, hãy kiểm tra lại trạng thái hạn mức hoặc thiết lập thanh toán tại tài khoản Google AI Studio của bạn.';
      }
      setErrorMessage(errMsg);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Active items
  const activeTopic = topics.find(t => t.id === activeTopicId);
  const activeThread = threads.find(t => t.id === activeThreadId);
  const activeTopicThreads = threads.filter(t => t.topicId === activeTopicId);

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
      
      {/* CỘT 1: Quản lý Chủ đề & Đoạn chat (Sidebar) */}
      <div 
        style={{ 
          width: '280px', 
          borderRight: '1px solid var(--border-color)', 
          background: 'rgba(255, 255, 255, 0.005)',
          padding: '1.25rem 1rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Chủ Đề & Đoạn Chat
          </h3>
          <button 
            onClick={() => setIsAddingTopic(!isAddingTopic)}
            style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Thêm Chủ đề"
          >
            <FolderPlus size={16} />
          </button>
        </div>

        {/* Add Topic Input form */}
        {isAddingTopic && (
          <form onSubmit={handleAddTopic} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', borderRadius: '8px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }} className="slide-in">
            <input
              type="text"
              placeholder="Tên chủ đề..."
              required
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              style={{
                padding: '5px 8px',
                fontSize: '0.82rem',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
            <textarea
              placeholder="Mô tả ngữ cảnh (tùy chọn) — AI sẽ dùng để nắm bối cảnh chủ đề này ngay từ đầu..."
              value={newTopicDescription}
              onChange={(e) => setNewTopicDescription(e.target.value)}
              rows={3}
              style={{
                padding: '5px 8px',
                fontSize: '0.78rem',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.4
              }}
            />
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setIsAddingTopic(false); setNewTopicName(''); setNewTopicDescription(''); }}
                style={{ padding: '4px 10px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                type="submit"
                style={{ padding: '4px 10px', border: 'none', background: 'var(--accent-primary)', color: '#fff', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
              >
                Tạo chủ đề
              </button>
            </div>
          </form>
        )}

        {/* Topics & Threads Nested Listing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {topics.map(top => {
            const isActiveTopic = top.id === activeTopicId;
            const isExpanded = !!expandedTopics[top.id];
            const topicThreads = threads.filter(t => t.topicId === top.id);

            return (
              <div key={top.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* Topic Item Row */}
                <div
                  onClick={() => handleSelectTopic(top.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: isActiveTopic ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                    border: isActiveTopic ? '1px solid var(--border-glow)' : '1px solid transparent',
                    color: isActiveTopic ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isActiveTopic ? 600 : 500,
                    fontSize: '0.88rem',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    {/* Toggle Chevron */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTopicExpand(top.id);
                      }}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0,
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }}
                    >
                      <ChevronRight size={14} />
                    </button>
                    
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{top.icon}</span>
                    {editingTopicNameId === top.id ? (
                      <input
                        autoFocus
                        value={editingTopicNameValue}
                        onChange={(e) => setEditingTopicNameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); handleSaveTopicName(top.id); }
                          if (e.key === 'Escape') { setEditingTopicNameId(null); setEditingTopicNameValue(''); }
                        }}
                        onBlur={() => handleSaveTopicName(top.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          padding: '1px 5px',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          borderRadius: '4px',
                          background: 'rgba(99,102,241,0.1)',
                          border: '1px solid var(--accent-primary)',
                          color: 'var(--text-primary)',
                          outline: 'none'
                        }}
                      />
                    ) : (
                      <span
                        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingTopicNameId(top.id);
                          setEditingTopicNameValue(top.name);
                        }}
                        title="Double-click để đổi tên"
                      >
                        {top.name}
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* Plus button to add a new chat thread to this topic */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateThread(top.id);
                      }}
                      style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.7, padding: '2px', display: 'flex', alignItems: 'center' }}
                      title="Đoạn chat mới"
                    >
                      <Plus size={14} />
                    </button>

                    {/* Edit description button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTopicId(top.id);
                        setEditingTopicDescription(top.description || '');
                      }}
                      style={{ border: 'none', background: 'none', color: top.description ? 'var(--accent-primary)' : 'var(--text-muted)', cursor: 'pointer', opacity: 0.8, padding: '2px', display: 'flex', alignItems: 'center' }}
                      title={top.description ? 'Sửa mô tả ngữ cảnh' : 'Thêm mô tả ngữ cảnh'}
                    >
                      <Edit3 size={12} />
                    </button>

                    {/* Delete topic button (hide default topics delete to prevent accidental wipe) */}
                    {!['top-mylife', 'top-business', 'top-study'].includes(top.id) && (
                      <button
                        onClick={(e) => handleDeleteTopic(top.id, e)}
                        style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.7, padding: '2px', display: 'flex', alignItems: 'center' }}
                        title="Xóa chủ đề"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline description editor */}
                {editingTopicId === top.id && (
                  <div style={{ padding: '8px', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--accent-primary)', marginTop: '2px' }} className="slide-in">
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '4px' }}>
                      Mô tả ngữ cảnh — "{top.name}"
                    </div>
                    <textarea
                      autoFocus
                      value={editingTopicDescription}
                      onChange={(e) => setEditingTopicDescription(e.target.value)}
                      placeholder="Mô tả bối cảnh chủ đề này để AI hiểu ngay từ câu đầu tiên..."
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) handleSaveTopicDescription(top.id);
                        if (e.key === 'Escape') { setEditingTopicId(null); setEditingTopicDescription(''); }
                      }}
                      style={{
                        width: '100%',
                        padding: '5px 7px',
                        fontSize: '0.78rem',
                        borderRadius: '5px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        outline: 'none',
                        resize: 'vertical',
                        lineHeight: 1.4,
                        boxSizing: 'border-box'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', marginTop: '5px' }}>
                      <button
                        onClick={() => { setEditingTopicId(null); setEditingTopicDescription(''); }}
                        style={{ padding: '3px 8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', borderRadius: '5px', fontSize: '0.72rem', cursor: 'pointer' }}
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() => handleSaveTopicDescription(top.id)}
                        style={{ padding: '3px 8px', border: 'none', background: 'var(--accent-primary)', color: '#fff', borderRadius: '5px', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Lưu  (Ctrl+Enter)
                      </button>
                    </div>
                  </div>
                )}

                {/* Indented Threads list under this Topic */}
                {isExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '1.25rem', borderLeft: '1px solid var(--border-color)', marginLeft: '0.65rem' }}>
                    {topicThreads.length === 0 ? (
                      <div style={{ padding: '0.4rem 0.65rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                        Chưa có đoạn chat nào.
                      </div>
                    ) : (
                      topicThreads.map(thread => {
                        const isActiveThread = thread.id === activeThreadId;
                        const isEditing = editingThreadId === thread.id;

                        return (
                          <div
                            key={thread.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTopicId(top.id);
                              setActiveThreadId(thread.id);
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              handleStartRenameThread(thread);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.45rem 0.55rem',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              background: isActiveThread ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)' : 'transparent',
                              border: isActiveThread ? '1px solid var(--border-glow)' : '1px solid transparent',
                              color: isActiveThread ? 'var(--text-primary)' : 'var(--text-secondary)',
                              fontSize: '0.8rem',
                              transition: 'var(--transition-smooth)',
                              gap: '4px'
                            }}
                            title="Nháy đúp chuột để đổi tên"
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flex: 1 }}>
                              <MessageSquare size={12} style={{ color: isActiveThread ? 'var(--accent-primary)' : 'var(--text-muted)', flexShrink: 0 }} />
                              
                              {isEditing ? (
                                <input 
                                  type="text" 
                                  value={editingThreadTitle}
                                  onChange={(e) => setEditingThreadTitle(e.target.value)}
                                  onBlur={() => handleSaveRenameThread(thread.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveRenameThread(thread.id);
                                    if (e.key === 'Escape') setEditingThreadId(null);
                                  }}
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    width: '100%',
                                    fontSize: '0.78rem',
                                    background: 'var(--bg-app)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--accent-primary)',
                                    borderRadius: '3px',
                                    padding: '1px 3px',
                                    outline: 'none'
                                  }}
                                />
                              ) : (
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{thread.title}</span>
                              )}
                            </div>

                            {!isEditing && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteThread(thread.id, e);
                                }}
                                style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', opacity: 0.6 }}
                                title="Xóa đoạn chat"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Widget Giám sát Chi phí AI */}
        <div 
          className="glass-panel" 
          style={{ 
            marginTop: 'auto', 
            padding: '0.75rem', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border-color)',
            background: 'rgba(255,255,255,0.01)',
            fontSize: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            color: 'var(--text-secondary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '2px' }}>
            <span style={{ fontSize: '1rem' }}>🧠</span>
            <span>Giám Sát Chi Phí AI</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Số lượt gọi:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {(aiUsageLogs || []).length} lần
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Tổng Token:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {(((aiUsageLogs || []).reduce((sum, log) => sum + (log.inputTokens || 0) + (log.outputTokens || 0), 0)) / 1000).toFixed(1)}k
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Đã tiêu tốn:</span>
            <span style={{ fontWeight: 700, color: 'var(--accent-success)' }}>
              {(() => {
                const totalCostUSD = (aiUsageLogs || []).reduce((sum, log) => sum + (log.costUSD || 0), 0);
                if (user.currency === 'VND') {
                  return `${Math.round(totalCostUSD * 25500).toLocaleString('vi-VN')} đ`;
                }
                return `$${totalCostUSD.toFixed(4)}`;
              })()}
            </span>
          </div>
          
          <div style={{ borderTop: '1px dashed var(--border-color)', margin: '4px 0' }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Đang dùng:</span>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>{preferences.geminiModel || DEFAULT_MODEL_ID}</span>
            </div>
            <div style={{ fontSize: '0.62rem', fontStyle: 'italic', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Giá (In/Out):</span>
              <span>${getModelInfo(preferences.geminiModel).inputPricePerMillion} / ${getModelInfo(preferences.geminiModel).outputPricePerMillion} /M</span>
            </div>
          </div>
        </div>

      </div>

      {/* CỘT 3: Khung Chat Chính (Chat Workspace Area) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
        
        {/* Top Control Bar */}
        <div 
          style={{ 
            height: '60px', 
            borderBottom: '1px solid var(--border-color)', 
            padding: '0 1.5rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              {activeTopic ? activeTopic.name : 'AI Chat'}
            </span>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {activeThread ? activeThread.title : 'Chọn cuộc hội thoại'}
            </h4>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Context Checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={includeContext}
                onChange={(e) => setIncludeContext(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span>Gửi ngữ cảnh công việc</span>
            </label>

            {/* Google Search Grounding Checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer' }} title="Cho phép Gemini kết nối Google Search để tìm kiếm tin tức, sự kiện và thông tin mới nhất trên Internet">
              <input
                type="checkbox"
                checked={googleSearchEnabled}
                onChange={(e) => setGoogleSearchEnabled(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span>Kết nối Internet (Google Search)</span>
            </label>

            {/* Thinking Level Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="Chế độ suy luận sâu — càng cao càng chính xác nhưng chậm hơn. Chỉ hỗ trợ Gemini 3.5+">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Thinking:</span>
              {[
                { level: 'OFF',     color: '99,102,241',  cssVar: 'var(--accent-primary)',  label: 'OFF',     title: 'Tắt suy luận — nhanh nhất' },
                { level: 'MINIMAL', color: '20,184,166',  cssVar: '#14b8a6',                label: 'MINIMAL', title: 'Suy luận tối thiểu — dành cho Flash-Lite (~512 tokens)' },
                { level: 'LOW',     color: '16,185,129',  cssVar: 'var(--accent-success)',  label: 'LOW',     title: 'Suy luận nhẹ (~1K tokens)' },
                { level: 'MEDIUM',  color: '245,158,11',  cssVar: 'var(--accent-warning)',  label: 'MEDIUM',  title: 'Suy luận vừa (~8K tokens)' },
                { level: 'HIGH',    color: '239,68,68',   cssVar: 'var(--accent-danger)',   label: 'HIGH',    title: 'Suy luận sâu nhất (~24K tokens) — chậm nhất' }
              ].map(({ level, color, cssVar, label, title }) => (
                <button
                  key={level}
                  onClick={() => setThinkingLevel(level)}
                  title={title}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    border: thinkingLevel === level ? `1px solid rgba(${color},0.8)` : '1px solid var(--border-color)',
                    background: thinkingLevel === level ? `rgba(${color},0.15)` : 'transparent',
                    color: thinkingLevel === level ? cssVar : 'var(--text-muted)',
                    fontSize: '0.7rem',
                    fontWeight: thinkingLevel === level ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Model Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <select
                value={preferences.geminiModel || DEFAULT_MODEL_ID}
                onChange={(e) => setPreferences(prev => ({ ...prev, geminiModel: e.target.value }))}
                style={{
                  padding: '5px 28px 5px 10px',
                  borderRadius: '20px',
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--accent-primary)',
                  color: 'var(--accent-primary)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236366f1\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  backgroundSize: '12px'
                }}
              >
                {GEMINI_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.label} — {m.desc}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Chat History Panel */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {!activeThread ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              <Bot size={48} style={{ opacity: 0.3, marginBottom: '1rem', color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.25rem' }}>Không có cuộc hội thoại nào</h3>
              <p style={{ fontSize: '0.85rem', maxWidth: '300px' }}>
                Chọn một đoạn chat bên trái hoặc nhấn nút "+ Đoạn chat mới" để bắt đầu trao đổi với Gemini.
              </p>
            </div>
          ) : activeThread.messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              <Sparkles size={40} style={{ opacity: 0.5, marginBottom: '1rem', color: 'var(--accent-secondary)' }} className="pulse-glow-effect" />
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.25rem' }}>Bắt đầu trò chuyện</h3>
              <p style={{ fontSize: '0.85rem', maxWidth: '320px' }}>
                Gửi câu hỏi hoặc ý tưởng đầu tiên của anh. Trợ lý Gemini sẽ phân tích sâu sắc theo ngữ cảnh của anh.
              </p>
            </div>
          ) : (
            activeThread.messages.map((msg) => {
              const isAi = msg.role === 'model';
              return (
                <div 
                  key={msg.id} 
                  style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    flexDirection: isAi ? 'row' : 'row-reverse',
                    alignItems: 'flex-start'
                  }}
                >
                  {/* Avatar */}
                  <div 
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      background: isAi 
                        ? (preferences.assistantAvatar ? 'none' : 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)')
                        : 'rgba(255,255,255,0.05)',
                      color: isAi ? '#fff' : 'var(--text-secondary)',
                      flexShrink: 0,
                      boxShadow: isAi && !preferences.assistantAvatar ? '0 2px 8px rgba(99, 102, 241, 0.2)' : 'none',
                      overflow: 'hidden'
                    }}
                  >
                    {isAi ? (
                      preferences.assistantAvatar ? (
                        <img 
                          src={preferences.assistantAvatar} 
                          alt="AI Avatar" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <Bot size={16} />
                      )
                    ) : (
                      <User size={16} />
                    )}
                  </div>

                  {/* Message bubble */}
                  <div 
                    className="glass-panel"
                    style={{ 
                      padding: '0.85rem 1rem', 
                      borderRadius: 'var(--radius-md)',
                      borderTopLeftRadius: isAi ? '0' : 'var(--radius-md)',
                      borderTopRightRadius: isAi ? 'var(--radius-md)' : '0',
                      maxWidth: '75%',
                      background: isAi ? 'var(--bg-card)' : 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.03) 100%)',
                      border: isAi ? '1px solid var(--border-color)' : '1px solid var(--border-glow)',
                      fontSize: '0.92rem',
                      lineHeight: 1.5,
                      color: 'var(--text-primary)',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {renderMarkdown(msg.text)}
                    
                    {msg.media && msg.media.type === 'image' && (
                      <div style={{ marginTop: '0.75rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <img 
                          src={msg.media.url} 
                          alt="AI media" 
                          style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '320px', objectFit: 'contain', background: 'rgba(0,0,0,0.1)' }} 
                        />
                      </div>
                    )}

                    {msg.media && msg.media.type === 'video' && (
                      <div style={{ marginTop: '0.75rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <video 
                          src={msg.media.url} 
                          controls 
                          autoPlay 
                          loop 
                          muted
                          style={{ width: '100%', display: 'block', maxHeight: '320px', objectFit: 'contain', background: 'rgba(0,0,0,0.1)' }} 
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* AI Typing Indicator */}
          {isAiTyping && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: preferences.assistantAvatar ? 'none' : 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                  color: '#fff',
                  flexShrink: 0,
                  boxShadow: preferences.assistantAvatar ? 'none' : '0 2px 8px rgba(99, 102, 241, 0.2)',
                  overflow: 'hidden'
                }}
              >
                {preferences.assistantAvatar ? (
                  <img 
                    src={preferences.assistantAvatar} 
                    alt="AI Avatar" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <Bot size={16} />
                )}
              </div>
              
              <div 
                className="glass-panel" 
                style={{ 
                  padding: '0.75rem 1rem', 
                  borderRadius: 'var(--radius-md)', 
                  borderTopLeftRadius: '0', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  background: 'var(--bg-card)' 
                }}
              >
                <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--accent-primary)', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out' }} />
                <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--accent-primary)', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0.2s' }} />
                <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--accent-primary)', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0.4s' }} />
                
                <style>{`
                  @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1.0); }
                  }
                `}</style>
              </div>
            </div>
          )}

          {/* Error notification */}
          {errorMessage && (
            <div 
              style={{ 
                padding: '0.75rem 1rem', 
                background: 'rgba(239, 68, 68, 0.08)', 
                border: '1px solid rgba(239, 68, 68, 0.2)', 
                borderRadius: '8px', 
                color: 'var(--accent-danger)', 
                fontSize: '0.82rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px' 
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Bottom Message Input Bar */}
        {activeThread && (
          <div 
            style={{ 
              padding: '1rem 1.5rem 1.25rem 1.5rem', 
              borderTop: '1px solid var(--border-color)', 
              background: 'rgba(255, 255, 255, 0.002)',
              flexShrink: 0
            }}
          >
            {/* Microphone listening indicator keyframes */}
            <style>{`
              @keyframes mic-pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.15); opacity: 0.7; }
                100% { transform: scale(1); opacity: 1; }
              }
            `}</style>

            {/* Mode selection pills */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setGenerationMode(generationMode === 'image' ? null : 'image')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid ' + (generationMode === 'image' ? 'var(--accent-primary)' : 'var(--border-color)'),
                  background: generationMode === 'image' ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-glass)',
                  color: generationMode === 'image' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <span>🎨 Tạo ảnh AI</span>
              </button>

              <button
                type="button"
                onClick={() => setGenerationMode(generationMode === 'video' ? null : 'video')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid ' + (generationMode === 'video' ? 'var(--accent-primary)' : 'var(--border-color)'),
                  background: generationMode === 'video' ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-glass)',
                  color: generationMode === 'video' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <span>🎬 Tạo video AI</span>
              </button>
            </div>

            {/* Attached file preview */}
            {attachedFile && (
              <div 
                className="glass-panel slide-in" 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '6px 10px', 
                  borderRadius: '12px', 
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '8px',
                  fontSize: '0.78rem',
                  color: 'var(--text-primary)'
                }}
              >
                {attachedFile.isImage ? (
                  <img 
                    src={attachedFile.data} 
                    alt="attachment" 
                    style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} 
                  />
                ) : (
                  <span style={{ fontSize: '1rem' }}>📄</span>
                )}
                <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                  {attachedFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  style={{ border: 'none', background: 'none', color: 'var(--accent-danger)', cursor: 'pointer', display: 'flex', padding: '2px' }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <form 
              onSubmit={handleSendMessage} 
              style={{ 
                display: 'flex', 
                gap: '0.4rem', 
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: '24px',
                padding: '4px 6px 4px 10px',
                alignItems: 'center',
                boxShadow: 'var(--card-shadow)',
                transition: 'var(--transition-smooth)'
              }}
              onFocusCapture={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
              onBlurCapture={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              {/* Hidden File Input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }}
                accept="image/*,text/*" 
              />
              
              {/* File Attachment Trigger Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                title="Đính kèm tệp/ảnh"
              >
                <Plus size={20} />
              </button>

              <input 
                type="text"
                placeholder={
                  generationMode === 'image' 
                    ? "Nhập mô tả ảnh cần tạo..." 
                    : generationMode === 'video' 
                      ? "Nhập mô tả video cần tạo..." 
                      : isListening 
                        ? "Đang lắng nghe giọng nói..." 
                        : "Hỏi Gemini hoặc ra lệnh tạo ảnh/video..."
                }
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isAiTyping}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  padding: '8px 0',
                  outline: 'none'
                }}
              />

              {/* TTS Read Aloud toggle */}
              <button
                type="button"
                onClick={() => setTtsEnabled(!ttsEnabled)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: ttsEnabled ? 'var(--accent-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px',
                  transition: 'var(--transition-smooth)'
                }}
                title={ttsEnabled ? "Đang bật đọc câu trả lời" : "Đang tắt đọc câu trả lời"}
              >
                {ttsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>

              {/* Microphone Voice Recognition */}
              <button
                type="button"
                onClick={handleMicClick}
                style={{
                  border: 'none',
                  background: 'none',
                  color: isListening ? 'var(--accent-danger)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px',
                  animation: isListening ? 'mic-pulse 1.2s infinite ease-in-out' : 'none',
                  transition: 'var(--transition-smooth)'
                }}
                title={isListening ? "Đang ghi âm giọng nói... bấm để dừng" : "Nhấp để nói chuyện bằng giọng nói"}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <button 
                type="submit" 
                disabled={isAiTyping || (!chatInput.trim() && !attachedFile)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                  color: '#fff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  opacity: (chatInput.trim() || attachedFile) ? 1 : 0.6,
                  transition: 'var(--transition-smooth)'
                }}
              >
                <Send size={14} fill="#fff" />
              </button>
            </form>
          </div>
        )}

      </div>

    </div>
  );
}

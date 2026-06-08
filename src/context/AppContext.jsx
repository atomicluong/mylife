import React, { createContext, useContext, useState, useEffect } from 'react';
import { parseVietnameseNLP } from '../utils/nlp';
import { calculateAICost, GEMINI_MODELS, DEFAULT_MODEL_ID } from '../utils/aiPricing';

const AppContext = createContext();

// Helper to generate UUIDs
const uuid = () => Math.random().toString(36).substring(2, 15);

// Helper for local date string
const getLocalDateStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper for dates relative to today
const getRelativeDateStr = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return getLocalDateStr(d);
};

const mapWmoToCondition = (code) => {
  if (code === 0) {
    return { type: 'sunny', text: 'Trời nắng quang', icon: '☀️', hasRain: false };
  } else if (code === 1 || code === 2) {
    return { type: 'nice', text: 'Nắng nhẹ, mát mẻ', icon: '🌤️', hasRain: false };
  } else if (code === 3) {
    return { type: 'cloudy', text: 'Nhiều mây, dịu mát', icon: '☁️', hasRain: false };
  } else if (code === 45 || code === 48) {
    return { type: 'cloudy', text: 'Có sương mù', icon: '🌫️', hasRain: false };
  } else if (code >= 51 && code <= 55) {
    return { type: 'rainy', text: 'Mưa phùn nhẹ', icon: '🌧️', hasRain: true };
  } else if ((code >= 61 && code <= 65) || (code >= 80 && code <= 82)) {
    return { type: 'rainy', text: 'Có mưa rào', icon: '🌧️', hasRain: true };
  } else if (code >= 71 && code <= 75) {
    return { type: 'stormy', text: 'Có tuyết rơi', icon: '❄️', hasRain: false };
  } else if (code >= 95) {
    return { type: 'stormy', text: 'Dông bão lớn', icon: '⛈️', hasRain: true };
  }
  return { type: 'nice', text: 'Thời tiết ôn hòa', icon: '🌤️', hasRain: false };
};

// Time utilities
const timeToMins = (s) => { const [h, m] = (s || '00:00').split(':').map(Number); return h * 60 + m; };
const minsToTime = (n) => { const v = Math.max(0, n) % 1440; return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`; };

// Find first non-overlapping slot for a new task on a given day
const resolveNoOverlap = (tasksList, dueDate, preferredMins, durationMins = 30, excludeId = null) => {
  const BREAK = 5;
  const occupied = tasksList
    .filter(t => t.dueDate === dueDate && t.dueTime && t.id !== excludeId && t.status !== 'done')
    .map(t => ({ start: timeToMins(t.dueTime), end: timeToMins(t.dueTime) + (t.timeEstimate || 30) }))
    .sort((a, b) => a.start - b.start);
  let slot = preferredMins;
  let changed = true;
  while (changed) {
    changed = false;
    for (const seg of occupied) {
      if (slot < seg.end && slot + durationMins > seg.start) {
        slot = seg.end + BREAK;
        changed = true;
        break;
      }
    }
  }
  return slot;
};

// Cascade-shift all tasks after anchorTaskId on the same day to avoid overlap
const cascadeShiftDay = (tasksList, anchorTaskId, BREAK = 5) => {
  const anchor = tasksList.find(t => t.id === anchorTaskId);
  if (!anchor || !anchor.dueDate || !anchor.dueTime) return tasksList;
  const anchorStart = timeToMins(anchor.dueTime);
  const anchorEnd = anchorStart + (anchor.timeEstimate || 30);
  const laterTasks = tasksList
    .filter(t => t.dueDate === anchor.dueDate && t.id !== anchorTaskId && t.status !== 'done' && t.dueTime && timeToMins(t.dueTime) >= anchorStart)
    .sort((a, b) => timeToMins(a.dueTime) - timeToMins(b.dueTime));
  let slot = anchorEnd + BREAK;
  const shifts = {};
  for (const t of laterTasks) {
    const tStart = timeToMins(t.dueTime);
    if (tStart < slot) { shifts[t.id] = minsToTime(slot); }
    slot = Math.max(slot, tStart) + (t.timeEstimate || 30) + BREAK;
  }
  if (Object.keys(shifts).length === 0) return tasksList;
  return tasksList.map(t => shifts[t.id] ? { ...t, dueTime: shifts[t.id] } : t);
};

const safeLoad = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    if (saved === null || saved === undefined || saved === 'null' || saved === 'undefined') {
      return defaultValue;
    }
    const parsed = JSON.parse(saved);
    if (parsed === null || parsed === undefined) return defaultValue;
    if (Array.isArray(defaultValue) && !Array.isArray(parsed)) return defaultValue;
    return parsed;
  } catch (e) {
    console.error(`Error loading key ${key} from localStorage:`, e);
    return defaultValue;
  }
};

export const AppProvider = ({ children }) => {
  // --- Seed Data Initializers ---
  const initialProjects = [
    { id: 'proj-work', name: 'Công việc', color: '#3b82f6', description: 'Công việc solopreneur & side hustle' },
    { id: 'proj-study', name: 'Học tập', color: '#a855f7', description: 'Học lập trình, kỹ năng mới' },
    { id: 'proj-finance', name: 'Tài chính', color: '#10b981', description: 'Quản lý tài chính cá nhân' },
    { id: 'proj-personal', name: 'Cá nhân', color: '#f59e0b', description: 'Sức khỏe, gia đình, sở thích' }
  ];

  const initialUser = {
    id: 'user-luong',
    name: 'Lương',
    email: 'luong@solopreneur.dev',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
    currency: 'USD',
    hourlyRate: 50,
    timezone: 'Asia/Ho_Chi_Minh',
    language: 'vi'
  };

  const initialPreferences = {
    pomodoroDuration: 25,
    breakDuration: 5,
    theme: 'dark', // Default to premium dark mode
    dateFormat: 'DD/MM/YYYY',
    defaultProject: 'proj-work',
    budgetRule: '50-30-20',
    notifyTaskReminder: 15,
    notifyBudgetAlert: 75,
    autoStartPomodoro: false,
    geminiApiKey: '',
    geminiModel: 'gemini-3.5-flash',
    customAiContext: '',
    assistantAvatar: '/avatars/asian1.png'
  };

  // Seed Books
  const initialBooks = [
    {
      id: 'book-1',
      title: 'Atomic Habits (Thay đổi tí hon, hiệu quả bất ngờ)',
      author: 'James Clear',
      totalPages: 320,
      currentPage: 48,
      coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&h=300&q=80',
      fileType: 'manual',
      chapters: [
        {
          id: 'c1',
          title: 'Chương 1: Những thay đổi tí hon',
          content: '<p><strong>Thói quen nguyên tử</strong> là những thay đổi nhỏ, lặp đi lặp lại hàng ngày mà thoạt nhìn có vẻ không đáng kể, nhưng qua nhiều năm tháng sẽ mang lại kết quả khổng lồ ngoài mong đợi. Chúng giống như những nguyên tử cấu thành nên hệ thống thành công của cuộc đời bạn.</p><p>Nếu bạn cải thiện bản thân 1% mỗi ngày trong suốt một năm, bạn sẽ tiến bộ gấp 37 lần vào cuối năm. Ngược lại, nếu bạn tệ đi 1% mỗi ngày, bạn sẽ suy giảm năng lực gần như về mức con số không.</p><p>Mục tiêu của chúng tôi trong chương đầu tiên này là giúp bạn hiểu được sức mạnh tích lũy của những cải tiến nhỏ. Hầu hết mọi người bỏ cuộc vì họ không thấy kết quả ngay lập tức. Nhưng thói quen tốt cần có thời gian tích lũy giống như băng tan hay áp lực kiến tạo đá quý.</p><p>Hãy thử kiểm tra tính năng lật trang của trình đọc sách TimeFlow: Nhấn vào nút "Trang sau" ở thanh điều khiển phía dưới hoặc sử dụng hiệu ứng lật trang 3D tuyệt đẹp để lướt qua các trang tiếp theo của chương này!</p><p>Khi bạn lật trang, phần hiển thị nội dung sẽ tự động trượt hoặc lật theo trục Y của cuốn sách tùy theo cài đặt chuyển trang. Hãy thử thay đổi cả kích thước chữ A- / A+ và màu nền sách cổ Sepia hoặc Giấy da cổ Parchment để cảm nhận sự thay đổi.</p>'
        },
        {
          id: 'c2',
          title: 'Chương 2: Tập trung vào Hệ thống',
          content: '<p>Thay vì đặt mục tiêu, hãy tập trung xây dựng hệ thống. Mục tiêu xác định kết quả bạn muốn đạt được, còn hệ thống là quy trình giúp bạn tiến tới kết quả đó.</p><p>Những người chiến thắng và kẻ thất bại đều có chung mục tiêu. Sự khác biệt nằm ở chỗ người chiến thắng sở hữu một hệ thống hoạt động hiệu quả giúp họ tiến bộ đều đặn mỗi ngày, trong khi kẻ thất bại chỉ mơ mộng về cái đích cuối cùng.</p><p>Hệ thống của bạn bao gồm: lịch trình luyện tập hàng ngày, các bước chuẩn bị công việc, thói quen đọc sách trước khi đi ngủ, hay cách thức bạn quản lý chi tiêu. Khi bạn tối ưu hóa hệ thống, kết quả sẽ tự động được giải quyết một cách hoàn hảo nhất.</p>'
        }
      ],
      completed: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'book-2',
      title: 'Đắc Nhân Tâm',
      author: 'Dale Carnegie',
      totalPages: 290,
      currentPage: 110,
      coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=200&h=300&q=80',
      fileType: 'manual',
      chapters: [
        {
          id: 'c1',
          title: 'Chương 1: Muốn lấy mật đừng phá tổ ong',
          content: '<p>Nguyên tắc đầu tiên trong nghệ thuật đối nhân xử thế của Dale Carnegie là: <strong>Không chỉ trích, oán trách hay than phiền người khác</strong>. Sự chỉ trích như những con bồ câu đưa thư, bao giờ cũng quay trở về nơi xuất phát.</p><p>Con người là những sinh vật cảm xúc, không phải sinh vật thuần logic. Khi chúng ta chỉ trích ai đó, chúng ta đang khơi dậy niềm kiêu hãnh và lòng tự tôn của họ, khiến họ tìm mọi cách biện hộ và oán ghét lại chúng ta.</p><p>Benjamin Franklin, người từng là Đại sứ Mỹ tại Pháp và nổi tiếng khéo léo trong ngoại giao, đã chia sẻ bí quyết thành công: <em>"Tôi không nói xấu bất kỳ ai, mà chỉ nói những điều tốt đẹp tôi biết về họ"</em>.</p><p>Thay vì kết án hay phê phán người khác, chúng ta hãy tìm cách thấu hiểu họ, đặt mình vào hoàn cảnh của họ để hiểu tại sao họ lại hành động như vậy. Điều đó mang lại sự khoan dung, nhân ái và tình bạn chân thành.</p>'
        },
        {
          id: 'c2',
          title: 'Chương 2: Bí mật lớn nhất trong giao tiếp',
          content: '<p>Nguyên tắc hai: <strong>Thành thật khen ngợi và biết ơn người khác</strong>. Động lực sâu sắc nhất thúc đẩy mọi hành động của con người là khao khát được cảm thấy mình quan trọng và được tôn trọng.</p><p>John Dewey, triết gia hàng đầu nước Mỹ, đã nói rằng khao khát được công nhận là động lực mạnh mẽ nhất trong bản tính con người. Nó thúc đẩy các nhà văn viết sách, các nhà khoa học nghiên cứu, và các Solopreneur không ngừng nỗ lực xây dựng sự nghiệp.</p><p>Hãy phân biệt rõ ràng giữa lời khen chân thành xuất phát từ trái tim và lời tịnh bốc giả dối từ đầu môi chót lưỡi. Lời khen chân thành mang lại năng lượng tích cực, trong khi lời tịnh bốc chỉ là thuốc độc bọc đường.</p>'
        }
      ],
      completed: false,
      createdAt: new Date().toISOString()
    }
  ];

  // Seed tasks
  const initialTasks = [
    {
      id: 'task-banhcanh-1',
      title: 'Thiết kế standee và menu mới quảng bá Combo Bánh canh @Công việc',
      description: 'Thiết kế standee đặt trước cửa tiệm và bổ sung các món ăn kèm vào menu chính.',
      dueDate: getRelativeDateStr(0), // Today
      dueTime: '10:00',
      startDate: getRelativeDateStr(0),
      projectId: 'proj-work',
      listType: 'today',
      priority: 3, // Q2
      status: 'todo',
      eisenhower: 'Q2',
      tags: ['Bánh canh', 'Kinh doanh'],
      timeEstimate: 90,
      actualTime: 0,
      billable: false,
      hourlyRate: 0,
      subtasks: [
        { id: 'sub-bc-1', title: 'Thiết kế file in Standee', completed: false, estimatedTime: 60, actualTime: 0 },
        { id: 'sub-bc-2', title: 'Liên hệ nhà in ấn', completed: false, estimatedTime: 30, actualTime: 0 }
      ],
      dependencies: [],
      keyResultId: 'kr-average-bill',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-banhcanh-2',
      title: 'Chạy thử chương trình quảng cáo Facebook cho khách quanh khu vực @Công việc',
      description: 'Nhắm mục tiêu khách hàng bán kính 3km quanh quán bánh canh.',
      dueDate: getRelativeDateStr(0), // Today
      dueTime: '14:00',
      startDate: getRelativeDateStr(0),
      projectId: 'proj-work',
      listType: 'today',
      priority: 4, // Q1
      status: 'todo',
      eisenhower: 'Q1',
      tags: ['Bánh canh', 'Marketing'],
      timeEstimate: 60,
      actualTime: 0,
      billable: false,
      hourlyRate: 0,
      subtasks: [],
      dependencies: [],
      keyResultId: 'kr-retail-sales',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-1',
      title: 'Nộp báo cáo doanh thu tuần @Công việc',
      description: 'Tổng hợp báo cáo kinh doanh nhà hàng và doanh thu freelance gửi cho đối tác.',
      dueDate: getRelativeDateStr(0), // Today
      dueTime: '15:00',
      startDate: getRelativeDateStr(0),
      projectId: 'proj-work',
      listType: 'today',
      priority: 4, // Q1
      status: 'todo',
      eisenhower: 'Q1',
      tags: ['Báo cáo', 'Freelance'],
      timeEstimate: 60,
      actualTime: 0,
      billable: true,
      hourlyRate: 50,
      subtasks: [
        { id: 'sub-1', title: 'Tổng hợp file Excel', completed: true, estimatedTime: 30, actualTime: 30 },
        { id: 'sub-2', title: 'Gửi email cho đối tác', completed: false, estimatedTime: 30, actualTime: 0 }
      ],
      dependencies: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-2',
      title: 'Thiết kế giao diện dashboard TimeFlow @Công việc',
      description: 'Hoàn thiện giao diện Figma và chuẩn bị CSS system cho app.',
      dueDate: getRelativeDateStr(0), // Today
      dueTime: '17:30',
      startDate: getRelativeDateStr(-1),
      projectId: 'proj-work',
      listType: 'today',
      priority: 3, // Q2
      status: 'in-progress',
      eisenhower: 'Q2',
      tags: ['Design', 'UIUX'],
      timeEstimate: 120,
      actualTime: 50, // 2 Pomodoros done already
      billable: true,
      hourlyRate: 60,
      subtasks: [],
      dependencies: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-3',
      title: 'Tập gym 30 phút @Cá nhân',
      description: 'Chạy bộ và tập tạ nhẹ.',
      dueDate: getRelativeDateStr(0), // Today
      dueTime: '19:35',
      startDate: getRelativeDateStr(0),
      projectId: 'proj-personal',
      listType: 'today',
      priority: 2, // Q4
      status: 'todo',
      eisenhower: 'Q4',
      tags: ['Sức khỏe'],
      timeEstimate: 30,
      actualTime: 0,
      billable: false,
      hourlyRate: 0,
      subtasks: [],
      dependencies: ['task-2'], // Blocks until dashboard designs finished!
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-4',
      title: 'Mua quà sinh nhật cho mẹ @Cá nhân',
      description: 'Mua bó hoa và ví da.',
      dueDate: getRelativeDateStr(1), // Tomorrow
      dueTime: '10:00',
      startDate: getRelativeDateStr(1),
      projectId: 'proj-personal',
      listType: 'scheduled',
      priority: 3, // Q3
      status: 'todo',
      eisenhower: 'Q3',
      tags: ['Gia đình'],
      timeEstimate: 45,
      actualTime: 0,
      billable: false,
      hourlyRate: 0,
      subtasks: [],
      dependencies: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-5',
      title: 'Lên kế hoạch đi du lịch Đà Lạt @Cá nhân',
      description: 'Đặt homestay và tìm các quán ăn ngon.',
      dueDate: null,
      dueTime: null,
      startDate: null,
      projectId: 'proj-personal',
      listType: 'someday',
      priority: 1, // Q4
      status: 'todo',
      eisenhower: 'Q4',
      tags: ['Du lịch'],
      timeEstimate: 90,
      actualTime: 0,
      billable: false,
      hourlyRate: 0,
      subtasks: [],
      dependencies: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-6',
      title: 'Học khóa học React Advanced @Học tập',
      description: 'Học về Performance Optimization và Custom Hooks.',
      dueDate: null,
      dueTime: null,
      startDate: getRelativeDateStr(0),
      projectId: 'proj-study',
      listType: 'anytime',
      priority: 2, // Q2
      status: 'todo',
      eisenhower: 'Q2',
      tags: ['Coding'],
      timeEstimate: 180,
      actualTime: 0,
      billable: false,
      hourlyRate: 0,
      subtasks: [],
      dependencies: [],
      createdAt: new Date().toISOString()
    }
  ];

  // Seed habits
  const initialHabits = [
    {
      id: 'habit-1',
      name: 'Tập gym',
      description: 'Tập thể hình tăng cường sức khỏe',
      frequency: 'weekly',
      targetDays: 5,
      color: '#ef4444',
      icon: '🏋️',
      category: 'health',
      startDate: getRelativeDateStr(-20)
    },
    {
      id: 'habit-2',
      name: 'Đọc sách',
      description: 'Đọc sách kỹ năng hoặc phát triển bản thân 30 phút',
      frequency: 'daily',
      targetDays: 7,
      color: '#3b82f6',
      icon: '📚',
      category: 'learn',
      startDate: getRelativeDateStr(-20)
    },
    {
      id: 'habit-3',
      name: 'Thiền',
      description: 'Thiền tĩnh tâm buổi sáng 10 phút',
      frequency: 'daily',
      targetDays: 7,
      color: '#10b981',
      icon: '🧘',
      category: 'personal',
      startDate: getRelativeDateStr(-20)
    }
  ];

  // Seed habit logs (completing habits over past few days)
  const initialHabitLogs = [
    // Gym completed 3 days ago, 2 days ago, and today
    { id: uuid(), habitId: 'habit-1', date: getRelativeDateStr(-3), completed: true, completedAt: new Date().toISOString() },
    { id: uuid(), habitId: 'habit-1', date: getRelativeDateStr(-2), completed: true, completedAt: new Date().toISOString() },
    { id: uuid(), habitId: 'habit-1', date: getRelativeDateStr(0), completed: true, completedAt: new Date().toISOString() }, // today
    
    // Reading completed 4 days ago, 3 days ago, 2 days ago, 1 day ago, and today
    { id: uuid(), habitId: 'habit-2', date: getRelativeDateStr(-4), completed: true, completedAt: new Date().toISOString() },
    { id: uuid(), habitId: 'habit-2', date: getRelativeDateStr(-3), completed: true, completedAt: new Date().toISOString() },
    { id: uuid(), habitId: 'habit-2', date: getRelativeDateStr(-2), completed: true, completedAt: new Date().toISOString() },
    { id: uuid(), habitId: 'habit-2', date: getRelativeDateStr(-1), completed: true, completedAt: new Date().toISOString() },
    { id: uuid(), habitId: 'habit-2', date: getRelativeDateStr(0), completed: true, completedAt: new Date().toISOString() }, // today

    // Meditation completed every day for past 7 days
    { id: uuid(), habitId: 'habit-3', date: getRelativeDateStr(-6), completed: true, completedAt: new Date().toISOString() },
    { id: uuid(), habitId: 'habit-3', date: getRelativeDateStr(-5), completed: true, completedAt: new Date().toISOString() },
    { id: uuid(), habitId: 'habit-3', date: getRelativeDateStr(-4), completed: true, completedAt: new Date().toISOString() },
    { id: uuid(), habitId: 'habit-3', date: getRelativeDateStr(-3), completed: true, completedAt: new Date().toISOString() },
    { id: uuid(), habitId: 'habit-3', date: getRelativeDateStr(-2), completed: true, completedAt: new Date().toISOString() },
    { id: uuid(), habitId: 'habit-3', date: getRelativeDateStr(-1), completed: true, completedAt: new Date().toISOString() },
    { id: uuid(), habitId: 'habit-3', date: getRelativeDateStr(0), completed: true, completedAt: new Date().toISOString() } // today
  ];

  // Seed Pomodoro sessions
  const initialPomodoros = [
    {
      id: uuid(),
      userId: 'user-luong',
      taskId: 'task-2',
      duration: 25,
      focusTime: 25,
      completed: true,
      moneyEarned: 25, // (25/60)*60 = 25 USD
      createdAt: new Date(new Date().setHours(9, 30)).toISOString()
    },
    {
      id: uuid(),
      userId: 'user-luong',
      taskId: 'task-2',
      duration: 25,
      focusTime: 25,
      completed: true,
      moneyEarned: 25,
      createdAt: new Date(new Date().setHours(10, 15)).toISOString()
    }
  ];

  // Seed expenses & incomes
  const initialExpenses = [
    { id: uuid(), userId: 'user-luong', amount: 4.5, category: 'Wants', date: getRelativeDateStr(0), notes: 'Mua cafe sáng Starbucks', createdAt: new Date().toISOString() },
    { id: uuid(), userId: 'user-luong', amount: 85.0, category: 'Needs', date: getRelativeDateStr(-2), notes: 'Hóa đơn tiền điện tháng 5', createdAt: new Date().toISOString() },
    { id: uuid(), userId: 'user-luong', amount: 20.0, category: 'Needs', date: getRelativeDateStr(0), notes: 'Gói Vercel Pro Hosting', taskId: 'task-2', createdAt: new Date().toISOString() }
  ];

  const initialIncomes = [
    { id: uuid(), userId: 'user-luong', amount: 1500.0, source: 'Salary', date: getRelativeDateStr(-5), recurring: true, createdAt: new Date().toISOString() },
    { id: uuid(), userId: 'user-luong', amount: 350.0, source: 'Freelance', date: getRelativeDateStr(0), recurring: false, taskIds: ['task-2'], createdAt: new Date().toISOString() },
    { id: uuid(), userId: 'user-luong', amount: 4500.0, source: 'Bánh canh', date: getRelativeDateStr(0), recurring: false, createdAt: new Date().toISOString() }
  ];

  const initialObjectives = [
    {
      id: 'obj-banhcanh',
      title: 'Đột phá doanh thu quán Bánh Canh lên 10 triệu/ngày',
      description: 'Tối ưu hóa các kênh bán hàng, tăng giá trị trung bình đơn hàng và mở rộng tệp khách hàng trực tuyến để đạt doanh thu ổn định 10.000.000 VNĐ/ngày.',
      category: 'Kinh doanh',
      createdAt: new Date().toISOString()
    }
  ];

  const initialKeyResults = [
    {
      id: 'kr-retail-sales',
      objectiveId: 'obj-banhcanh',
      title: 'Đạt doanh số bán lẻ trung bình 115 bát/ngày',
      targetValue: 115,
      currentValue: 75,
      unit: 'bát',
      linkedFinanceCategory: null,
      createdAt: new Date().toISOString()
    },
    {
      id: 'kr-average-bill',
      objectiveId: 'obj-banhcanh',
      title: 'Đạt giá trị đơn hàng trung bình 90.000 VNĐ/bill (qua combo và món thêm)',
      targetValue: 90000,
      currentValue: 60000,
      unit: 'VNĐ',
      linkedFinanceCategory: null,
      createdAt: new Date().toISOString()
    },
    {
      id: 'kr-delivery-orders',
      objectiveId: 'obj-banhcanh',
      title: 'Tăng số lượng đơn giao hàng (Ship) qua ứng dụng lên 40 đơn/ngày',
      targetValue: 40,
      currentValue: 15,
      unit: 'đơn',
      linkedFinanceCategory: null,
      createdAt: new Date().toISOString()
    },
    {
      id: 'kr-total-revenue',
      objectiveId: 'obj-banhcanh',
      title: 'Tổng doanh thu kinh doanh Bánh Canh ghi nhận trên hệ thống',
      targetValue: 10000.0,
      currentValue: 4500.0,
      unit: 'USD',
      linkedFinanceCategory: 'Bánh canh',
      createdAt: new Date().toISOString()
    }
  ];

  // Boards and columns
  const initialBoards = [
    { id: 'board-default', userId: 'user-luong', name: 'Task Board', description: 'Bảng quản lý công việc hàng ngày' }
  ];

  const initialBoardColumns = [
    { id: 'col-todo', boardId: 'board-default', name: 'Cần làm', position: 1 },
    { id: 'col-progress', boardId: 'board-default', name: 'Đang làm', position: 2 },
    { id: 'col-done', boardId: 'board-default', name: 'Đã xong', position: 3 }
  ];

  // --- App State Declarations ---
  const [projects, setProjects] = useState(() => safeLoad('tf_projects', initialProjects));
  const [user, setUser] = useState(() => safeLoad('tf_user', initialUser));
  const [preferences, setPreferences] = useState(() => safeLoad('tf_preferences', initialPreferences));
  const [tasks, setTasks] = useState(() => safeLoad('tf_tasks', initialTasks));
  const [habits, setHabits] = useState(() => safeLoad('tf_habits', initialHabits));
  const [habitLogs, setHabitLogs] = useState(() => safeLoad('tf_habit_logs', initialHabitLogs));
  const [pomodoros, setPomodoros] = useState(() => safeLoad('tf_pomodoros', initialPomodoros));
  const [expenses, setExpenses] = useState(() => safeLoad('tf_expenses', initialExpenses));
  const [incomes, setIncomes] = useState(() => safeLoad('tf_incomes', initialIncomes));
  const [boards, setBoards] = useState(() => safeLoad('tf_boards', initialBoards));
  const [boardColumns, setBoardColumns] = useState(() => safeLoad('tf_board_columns', initialBoardColumns));
  const [books, setBooks] = useState(() => safeLoad('tf_books', initialBooks));
  const [bookCategories, setBookCategories] = useState(() => safeLoad('tf_book_categories', ['Kinh tế', 'Kỹ năng', 'Văn học', 'Cá nhân']));
  const [objectives, setObjectives] = useState(() => safeLoad('tf_objectives', initialObjectives));
  const [keyResults, setKeyResults] = useState(() => safeLoad('tf_key_results', initialKeyResults));
  const [notifications, setNotifications] = useState([]);
  const [aiUsageLogs, setAiUsageLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('tf_ai_usage_logs');
      if (saved && saved !== 'null' && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });
  const [isReaderFullscreen, setIsReaderFullscreen] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherCoordinates, setWeatherCoordinates] = useState({ latitude: 10.823, longitude: 106.6296 });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setWeatherCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Geolocation permission denied or error:", error.message);
        }
      );
    }
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${weatherCoordinates.latitude}&longitude=${weatherCoordinates.longitude}&hourly=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data.daily && data.hourly) {
          setWeatherData(data);
        }
      } catch (err) {
        console.error("Failed to fetch weather from Open-Meteo:", err);
      }
    };
    fetchWeather();
  }, [weatherCoordinates]);

  const getRealDayWeather = (dateStr) => {
    if (!weatherData || !weatherData.daily) {
      return { type: 'nice', text: 'Đang tải thời tiết...', tempMin: 25, tempMax: 30, icon: '🌤️', hasRain: false };
    }
    const idx = weatherData.daily.time.indexOf(dateStr);
    if (idx === -1) {
      return { type: 'nice', text: 'Nắng nhẹ', tempMin: 24, tempMax: 32, icon: '🌤️', hasRain: false };
    }
    const code = weatherData.daily.weathercode[idx];
    const cond = mapWmoToCondition(code);
    return {
      type: cond.type,
      text: cond.text,
      tempMin: Math.round(weatherData.daily.temperature_2m_min[idx]),
      tempMax: Math.round(weatherData.daily.temperature_2m_max[idx]),
      icon: cond.icon,
      hasRain: cond.hasRain
    };
  };

  const getRealWeatherForHour = (dateStr, hour) => {
    if (!weatherData || !weatherData.hourly) {
      return { type: 'nice', text: 'Đang tải...', temp: 27, icon: '🌤️' };
    }
    const hourStr = `${dateStr}T${String(hour).padStart(2, '0')}:00`;
    const idx = weatherData.hourly.time.indexOf(hourStr);
    if (idx === -1) {
      return { type: 'nice', text: 'Mát mẻ', temp: 28, icon: '🌤️' };
    }
    const code = weatherData.hourly.weathercode[idx];
    const cond = mapWmoToCondition(code);
    return {
      type: cond.type,
      text: cond.text,
      temp: Math.round(weatherData.hourly.temperature_2m[idx]),
      icon: cond.icon
    };
  };

  // Shared view mode and task selection state
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('tf_view_mode') || 'calendar');
  const [selectedTaskId, setSelectedTaskId] = useState(() => {
    const saved = localStorage.getItem('tf_selected_task_id');
    return saved && saved !== 'null' ? saved : null;
  });
  const [activeSubtaskId, setActiveSubtaskId] = useState(() => {
    const saved = localStorage.getItem('tf_active_subtask_id');
    return saved && saved !== 'null' ? saved : null;
  });

  // Global Pomodoro Timer States (Multi-Session support)
  const [focusSessions, setFocusSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('tf_focus_sessions');
      if (saved && saved !== 'null' && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });
  const [timerDemoSpeed, setTimerDemoSpeed] = useState(() => localStorage.getItem('tf_timer_demo_speed') === 'true');

  const timerIsActive = focusSessions.some(s => s.isActive);
  const timerSecondsLeft = focusSessions.length > 0 ? focusSessions[0].secondsLeft : 0;
  const timerDuration = focusSessions.length > 0 ? focusSessions[0].duration : 0;

  // Sync these states to localStorage
  useEffect(() => { localStorage.setItem('tf_view_mode', viewMode); }, [viewMode]);
  useEffect(() => {
    localStorage.setItem('tf_selected_task_id', selectedTaskId ? String(selectedTaskId) : 'null');
  }, [selectedTaskId]);
  useEffect(() => {
    localStorage.setItem('tf_active_subtask_id', activeSubtaskId ? String(activeSubtaskId) : 'null');
  }, [activeSubtaskId]);
  useEffect(() => {
    localStorage.setItem('tf_focus_sessions', JSON.stringify(focusSessions));
  }, [focusSessions]);
  useEffect(() => { localStorage.setItem('tf_timer_demo_speed', timerDemoSpeed); }, [timerDemoSpeed]);

  // Global Timer Count-Up Effect for focusSessions
  useEffect(() => {
    const hasActive = focusSessions.some(s => s.isActive);
    if (!hasActive) return;
    
    const intervalMs = timerDemoSpeed ? 50 : 1000;
    const interval = setInterval(() => {
      setFocusSessions(prev => {
        if (!prev.some(s => s.isActive)) return prev;
        return prev.map(s => s.isActive ? { ...s, secondsLeft: s.secondsLeft + 1, duration: s.duration + 1 } : s);
      });
    }, intervalMs);
    return () => clearInterval(interval);
  }, [timerDemoSpeed, focusSessions.some(s => s.isActive)]);

  // One-time migration: reset geminiModel nếu đang dùng model cũ không còn hỗ trợ
  useEffect(() => {
    const validIds = GEMINI_MODELS.map(m => m.id);
    if (!validIds.includes(preferences.geminiModel)) {
      setPreferences(prev => ({ ...prev, geminiModel: DEFAULT_MODEL_ID }));
    }
  }, []);

  // One-time startup repair: fix any overlapping tasks in localStorage
  useEffect(() => {
    if (localStorage.getItem('tf_overlap_repaired_v1')) return;
    setTasks(prev => {
      const BREAK = 5;
      const dates = [...new Set((prev || []).filter(t => t.dueDate && t.dueTime && t.status !== 'done').map(t => t.dueDate))];
      const updates = {};
      for (const date of dates) {
        const dayTasks = (prev || [])
          .filter(t => t.dueDate === date && t.dueTime && t.status !== 'done')
          .sort((a, b) => timeToMins(a.dueTime) - timeToMins(b.dueTime));
        let slot = -1;
        for (const t of dayTasks) {
          const tStart = timeToMins(t.dueTime);
          if (slot > tStart) {
            updates[t.id] = minsToTime(slot);
            slot = slot + (t.timeEstimate || 30) + BREAK;
          } else {
            slot = tStart + (t.timeEstimate || 30) + BREAK;
          }
        }
      }
      if (Object.keys(updates).length === 0) return prev || [];
      return (prev || []).map(t => updates[t.id] ? { ...t, dueTime: updates[t.id] } : t);
    });
    localStorage.setItem('tf_overlap_repaired_v1', 'true');
  }, []);



  // Sync to localStorage
  useEffect(() => { localStorage.setItem('tf_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('tf_user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('tf_preferences', JSON.stringify(preferences)); }, [preferences]);
  useEffect(() => { localStorage.setItem('tf_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('tf_habits', JSON.stringify(habits)); }, [habits]);
  useEffect(() => { localStorage.setItem('tf_habit_logs', JSON.stringify(habitLogs)); }, [habitLogs]);
  useEffect(() => { localStorage.setItem('tf_pomodoros', JSON.stringify(pomodoros)); }, [pomodoros]);
  useEffect(() => { localStorage.setItem('tf_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('tf_incomes', JSON.stringify(incomes)); }, [incomes]);
  useEffect(() => { localStorage.setItem('tf_boards', JSON.stringify(boards)); }, [boards]);
  useEffect(() => { localStorage.setItem('tf_board_columns', JSON.stringify(boardColumns)); }, [boardColumns]);
  useEffect(() => {
    localStorage.setItem('tf_books', JSON.stringify(books));
  }, [books]);
  useEffect(() => { localStorage.setItem('tf_objectives', JSON.stringify(objectives)); }, [objectives]);
  useEffect(() => { localStorage.setItem('tf_key_results', JSON.stringify(keyResults)); }, [keyResults]);
  useEffect(() => { localStorage.setItem('tf_ai_usage_logs', JSON.stringify(aiUsageLogs)); }, [aiUsageLogs]);

  // Migration for empty demo books chapters
  useEffect(() => {
    const needsMigration = books.some(b => b.id.startsWith('book-') && (!b.chapters || b.chapters.length === 0));
    if (needsMigration) {
      const updated = books.map(b => {
        const seed = initialBooks.find(s => s.id === b.id);
        if (seed && (!b.chapters || b.chapters.length === 0)) {
          return { ...b, chapters: seed.chapters };
        }
        return b;
      });
      setBooks(updated);
      localStorage.setItem('tf_books', JSON.stringify(updated));
    }
  }, []);
  useEffect(() => { localStorage.setItem('tf_book_categories', JSON.stringify(bookCategories)); }, [bookCategories]);

  // Apply visual theme globally
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(preferences.theme);
  }, [preferences.theme]);

  // Calculate finance budget status and alert user
  useEffect(() => {
    const totalWantsLimit = 900; // Mock budget bounds for wants
    const totalNeedsLimit = 1500;
    
    const wantsSpent = expenses
      .filter(e => e.category === 'Wants' && e.date.substring(0, 7) === new Date().toISOString().substring(0, 7))
      .reduce((sum, e) => sum + e.amount, 0);

    const needsSpent = expenses
      .filter(e => e.category === 'Needs' && e.date.substring(0, 7) === new Date().toISOString().substring(0, 7))
      .reduce((sum, e) => sum + e.amount, 0);

    const newNotifications = [];

    const wantsPercent = (wantsSpent / totalWantsLimit) * 100;
    if (wantsPercent >= 100) {
      newNotifications.push({ id: 'alert-wants-exceeded', type: 'budget_alert', message: `🔴 Bạn đã vượt quá ngân sách Wants (Giải trí/Mua sắm) hàng tháng! Đã chi: $${wantsSpent}/$${totalWantsLimit}` });
    } else if (wantsPercent >= preferences.notifyBudgetAlert) {
      newNotifications.push({ id: 'alert-wants-warning', type: 'budget_alert', message: `⚠️ Ngân sách Wants của bạn đã đạt ${wantsPercent.toFixed(0)}% ($${wantsSpent}/$${totalWantsLimit})` });
    }

    const needsPercent = (needsSpent / totalNeedsLimit) * 100;
    if (needsPercent >= 100) {
      newNotifications.push({ id: 'alert-needs-exceeded', type: 'budget_alert', message: `🔴 Bạn đã vượt quá ngân sách Needs (Chi phí thiết yếu) hàng tháng! Đã chi: $${needsSpent}/$${totalNeedsLimit}` });
    } else if (needsPercent >= preferences.notifyBudgetAlert) {
      newNotifications.push({ id: 'alert-needs-warning', type: 'budget_alert', message: `⚠️ Ngân sách Needs của bạn đã đạt ${needsPercent.toFixed(0)}% ($${needsSpent}/$${totalNeedsLimit})` });
    }

    setNotifications(newNotifications);
  }, [expenses, preferences.notifyBudgetAlert]);

  // --- Core CRUD Handlers ---

  // Tasks CRUD
  const addTask = (nlpString, overrides = {}) => {
    const parsed = parseVietnameseNLP(nlpString);
    if (!parsed) return;

    // Resolve project ID: overrides take priority
    let finalProjectId = null;
    if (overrides.projectId !== undefined) {
      finalProjectId = overrides.projectId;
    } else if (parsed.project) {
      const existingProj = projects.find(p => p.name.toLowerCase() === parsed.project.toLowerCase());
      if (existingProj) {
        finalProjectId = existingProj.id;
      } else {
        // Create new project
        const newProjId = `proj-${uuid()}`;
        const newProj = { id: newProjId, name: parsed.project, color: '#' + Math.floor(Math.random()*16777215).toString(16), description: '', sections: [] };
        setProjects(prev => [...prev, newProj]);
        finalProjectId = newProjId;
      }
    } else {
      finalProjectId = preferences.defaultProject || 'proj-work';
    }

    // Determine finalDueDate: default to today if not provided
    const todayStr = getRelativeDateStr(0);
    const finalDueDate = parsed.dueDate || todayStr;

    // Determine finalDueTime: default to current time if not provided
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const rawDueTime = parsed.dueTime || currentTimeStr;
    const rawDuration = overrides.timeEstimate !== undefined && overrides.timeEstimate !== null ? overrides.timeEstimate : 30;
    const rawPreferred = overrides.dueTime !== undefined && overrides.dueTime !== null ? overrides.dueTime : rawDueTime;
    const resolvedMins = resolveNoOverlap(tasks, finalDueDate, timeToMins(rawPreferred), rawDuration);
    const finalDueTime = minsToTime(resolvedMins);

    // Determine listType
    let listType = 'today';
    if (finalDueDate !== todayStr) {
      listType = 'scheduled';
    } else if (parsed.recurring) {
      listType = 'scheduled';
    }

    const newTask = {
      id: `task-${uuid()}`,
      title: parsed.title,
      description: '',
      dueDate: overrides.dueDate !== undefined && overrides.dueDate !== null ? overrides.dueDate : finalDueDate,
      dueTime: finalDueTime,
      startDate: finalDueDate ? getRelativeDateStr(0) : null,
      projectId: finalProjectId,
      sectionId: overrides.sectionId || null,
      listType: listType,
      priority: overrides.priority !== undefined && overrides.priority !== null ? overrides.priority : 4,
      status: 'todo',
      eisenhower: overrides.eisenhower !== undefined && overrides.eisenhower !== null ? overrides.eisenhower : 'Q1',
      tags: parsed.tags,
      timeEstimate: overrides.timeEstimate !== undefined && overrides.timeEstimate !== null ? overrides.timeEstimate : 30,
      actualTime: 0,
      billable: finalProjectId === 'proj-work',
      hourlyRate: finalProjectId === 'proj-work' ? user.hourlyRate : 0,
      subtasks: [],
      dependencies: [],
      keyResultId: overrides.keyResultId || null,
      createdAt: new Date().toISOString()
    };

    setTasks(prev => [newTask, ...prev]);
    return newTask;
  };

  const addManualTask = (taskData) => {
    const todayStr = getRelativeDateStr(0);
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dueDate = taskData.dueDate || todayStr;
    const preferredTime = taskData.dueTime || currentTimeStr;
    const durationMins = taskData.timeEstimate || 30;
    const resolvedTime = minsToTime(resolveNoOverlap(tasks, dueDate, timeToMins(preferredTime), durationMins));
    const newTask = {
      id: `task-${uuid()}`,
      description: '',
      tags: [],
      subtasks: [],
      dependencies: [],
      actualTime: 0,
      timeEstimate: 30,
      listType: 'today',
      keyResultId: null,
      createdAt: new Date().toISOString(),
      priority: 4,
      eisenhower: 'Q1',
      ...taskData,
      dueDate,
      dueTime: resolvedTime
    };
    setTasks(prev => [newTask, ...prev]);
    return newTask;
  };

  const addProject = (name, color) => {
    const newProj = {
      id: `proj-${uuid()}`,
      name,
      color: color || '#' + Math.floor(Math.random()*16777215).toString(16),
      description: '',
      sections: []
    };
    setProjects(prev => [...prev, newProj]);
    return newProj;
  };

  const addProjectSection = (projectId, sectionName) => {
    const newSection = {
      id: `sec-${uuid()}`,
      name: sectionName
    };
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const sections = p.sections || [];
        return {
          ...p,
          sections: [...sections, newSection]
        };
      }
      return p;
    }));
    return newSection;
  };

  const updateTask = (id, updatedFields) => {
    setTasks(prev => {
      const targetTask = prev.find(t => t.id === id);
      if (!targetTask) return prev;

      const completedAt = updatedFields.status === 'done' && targetTask.status !== 'done' 
        ? new Date().toISOString() 
        : (updatedFields.status && updatedFields.status !== 'done' ? null : targetTask.completedAt);
      
      let newTasks = prev.map(t => {
        if (t.id === id) {
          return { ...t, ...updatedFields, completedAt };
        }
        return t;
      });

      // Shifting logic when task is marked complete ('done') with actual > estimate overrun
      if (updatedFields.status === 'done' && targetTask.status !== 'done') {
        const actual = (updatedFields.actualTime !== undefined ? updatedFields.actualTime : targetTask.actualTime) || 0;
        const estimate = (updatedFields.timeEstimate !== undefined ? updatedFields.timeEstimate : targetTask.timeEstimate) || 0;
        if (actual > estimate && targetTask.dueDate && targetTask.dueTime) {
          const overrun = actual - estimate;
          const targetMinutes = timeToMins(targetTask.dueTime);
          newTasks = newTasks.map(t => {
            if (t.dueDate === targetTask.dueDate && t.dueTime && t.status !== 'done' && t.id !== id) {
              const taskMinutes = timeToMins(t.dueTime);
              if (taskMinutes > targetMinutes) {
                return { ...t, dueTime: minsToTime(taskMinutes + overrun) };
              }
            }
            return t;
          });
        }
      }

      // Cascade-shift when dueTime or timeEstimate is edited (prevent overlaps)
      if (updatedFields.dueTime !== undefined || updatedFields.timeEstimate !== undefined) {
        newTasks = cascadeShiftDay(newTasks, id);
      }

      return newTasks;
    });
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    // Clear dependencies pointing to this
    setTasks(prev => prev.map(t => ({
      ...t,
      dependencies: t.dependencies.filter(depId => depId !== id)
    })));
  };

  const rescheduleTask = (taskId, newDate, newTime = null) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (!task) return prev;
      
      const duration = task.timeEstimate || 30;
      let preferredTime = newTime || task.dueTime || '09:00';
      
      const todayStr = getLocalDateStr();
      if (newDate <= todayStr) {
        const now = new Date();
        const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (timeToMins(preferredTime) < timeToMins(currentTimeStr)) {
          preferredTime = currentTimeStr;
        }
      }

      const resolvedMins = resolveNoOverlap(prev, newDate, timeToMins(preferredTime), duration, taskId);
      const resolvedTime = minsToTime(resolvedMins);
      
      const historyEntry = {
        fromDate: task.dueDate || null,
        fromTime: task.dueTime || null,
        toDate: newDate,
        toTime: resolvedTime,
        at: new Date().toISOString()
      };
      
      const rescheduleHistory = [...(task.rescheduleHistory || []), historyEntry];
      const listType = newDate === todayStr ? 'today' : 'scheduled';
      
      let updatedTasks = prev.map(t => t.id === taskId ? { 
        ...t, 
        dueDate: newDate, 
        dueTime: resolvedTime, 
        listType, 
        rescheduleHistory 
      } : t);
      
      // Shift subsequent tasks if necessary
      updatedTasks = cascadeShiftDay(updatedTasks, taskId);
      return updatedTasks;
    });
  };

  const getAutoRescheduleSlot = (taskId, newDate) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return '09:00';
    const duration = task.timeEstimate || 30;
    const preferredTime = task.dueTime || '09:00';
    const resolvedMins = resolveNoOverlap(tasks, newDate, timeToMins(preferredTime), duration, taskId);
    return minsToTime(resolvedMins);
  };

  // Subtasks actions
  const addSubtask = (taskId, title) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id === taskId) {
          const newSubtasks = [...(t.subtasks || []), { id: `sub-${uuid()}`, title, completed: false, estimatedTime: 30, actualTime: 0 }];
          const totalEstimatedTime = newSubtasks.reduce((sum, sub) => sum + (sub.estimatedTime || 0), 0);
          return { ...t, subtasks: newSubtasks, timeEstimate: totalEstimatedTime };
        }
        return t;
      });
      return cascadeShiftDay(updated, taskId);
    });
  };

  const toggleSubtask = (taskId, subtaskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st)
        };
      }
      return t;
    }));
  };

  const deleteSubtask = (taskId, subtaskId) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id === taskId) {
          const newSubtasks = t.subtasks.filter(st => st.id !== subtaskId);
          const totalEstimatedTime = newSubtasks.length > 0 
            ? newSubtasks.reduce((sum, sub) => sum + (sub.estimatedTime || 0), 0)
            : t.timeEstimate;
          return { ...t, subtasks: newSubtasks, timeEstimate: totalEstimatedTime };
        }
        return t;
      });
      return cascadeShiftDay(updated, taskId);
    });
  };

  const updateSubtask = (taskId, subtaskId, updatedFields) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id === taskId) {
          const updatedSubtasks = (t.subtasks || []).map(st => 
            st.id === subtaskId ? { ...st, ...updatedFields } : st
          );
          const totalEstimatedTime = updatedSubtasks.reduce((sum, sub) => sum + (sub.estimatedTime || 0), 0);
          return { ...t, subtasks: updatedSubtasks, timeEstimate: totalEstimatedTime };
        }
        return t;
      });
      return cascadeShiftDay(updated, taskId);
    });
  };

  const startTimer = () => {
    if (selectedTaskId) {
      startFocusOnTask(selectedTaskId, activeSubtaskId);
    }
  };

  const pauseTimer = () => {
    setFocusSessions(prev => prev.map(s => ({ ...s, isActive: false })));
  };

  const resumeTimer = () => {
    setFocusSessions(prev => prev.map(s => ({ ...s, isActive: true })));
  };

  const stopAndLogTimer = () => {
    if (focusSessions.length > 0) {
      stopAndLogFocusSession(focusSessions[0].id);
    }
  };

  const cancelTimer = () => {
    if (focusSessions.length > 0) {
      cancelFocusSession(focusSessions[0].id);
    }
  };

  const startFocusOnTask = (taskId, subtaskId = null) => {
    const existing = focusSessions.find(s => s.taskId === taskId && s.subtaskId === subtaskId);
    if (existing) {
      // If it exists, activate it
      setFocusSessions(prev => prev.map(s => 
        s.taskId === taskId && s.subtaskId === subtaskId ? { ...s, isActive: true } : s
      ));
      return;
    }

    const task = tasks.find(t => t.id === taskId);
    const subtask = task?.subtasks?.find(st => st.id === subtaskId);
    const title = subtask ? subtask.title : (task ? task.title : 'Nhiệm vụ');

    const newSession = {
      id: `session-${uuid()}`,
      taskId,
      subtaskId,
      title,
      secondsLeft: 0,
      duration: 0,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    setFocusSessions(prev => [...prev, newSession]);
  };

  const toggleFocusSession = (sessionId) => {
    setFocusSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, isActive: !s.isActive } : s
    ));
  };

  const stopAndLogFocusSession = (sessionId) => {
    const session = focusSessions.find(s => s.id === sessionId);
    if (!session) return;

    const elapsedMinutes = Math.max(1, Math.round(session.secondsLeft / 60));
    const capturedTaskId = session.taskId;
    const capturedSubtaskId = session.subtaskId;

    const currentTask = tasks.find(t => t.id === capturedTaskId);
    const currentSubtask = currentTask?.subtasks?.find(st => st.id === capturedSubtaskId);
    const subtaskLabel = currentSubtask ? ` cho bước "${currentSubtask.title}"` : '';

    setTasks(prevTasks => {
      const targetTask = prevTasks.find(t => t.id === capturedTaskId);
      if (!targetTask) return prevTasks;

      let updatedSubtasks = targetTask.subtasks || [];
      if (capturedSubtaskId) {
        updatedSubtasks = (targetTask.subtasks || []).map(st => {
          if (st.id === capturedSubtaskId) {
            return { ...st, actualTime: (st.actualTime || 0) + elapsedMinutes, completed: true };
          }
          return st;
        });
      }

      const newActualTime = (targetTask.actualTime || 0) + elapsedMinutes;

      let updatedTasks = prevTasks.map(t => {
        if (t.id === capturedTaskId) {
          return { ...t, actualTime: newActualTime, subtasks: updatedSubtasks };
        }
        return t;
      });

      // Auto-shift next tasks on same day with 5-min break (cascade)
      if (targetTask.dueDate && targetTask.dueTime) {
        const toMins = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
        const toTime = (n) => { const v = Math.max(0, n) % 1440; return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`; };
        const BREAK = 5;
        const start = toMins(targetTask.dueTime);
        const nexts = prevTasks
          .filter(t => t.dueDate === targetTask.dueDate && t.id !== capturedTaskId && t.status !== 'done' && t.dueTime && toMins(t.dueTime) > start)
          .sort((a, b) => toMins(a.dueTime) - toMins(b.dueTime));
        if (nexts.length > 0) {
          let slot = start + elapsedMinutes + BREAK;
          const shifts = {};
          for (const t of nexts) { shifts[t.id] = toTime(slot); slot += (t.timeEstimate || 30) + BREAK; }
          updatedTasks = updatedTasks.map(t => shifts[t.id] ? { ...t, dueTime: shifts[t.id] } : t);
        }
      }

      return updatedTasks;
    });

    if (currentTask) {
      const taskRate = currentTask.billable ? (currentTask.hourlyRate || user.hourlyRate) : 0;
      const sessionEarnings = Math.round(((elapsedMinutes / 60) * taskRate) * 100) / 100;
      setPomodoros(prev => [{
        id: uuid(), userId: user.id, taskId: capturedTaskId || null, subtaskId: capturedSubtaskId || null,
        duration: elapsedMinutes, focusTime: elapsedMinutes, completed: true,
        moneyEarned: sessionEarnings, createdAt: new Date().toISOString()
      }, ...prev]);
    }

    setTimeout(() => {
      alert(`✅ Ghi nhận ${elapsedMinutes} phút${subtaskLabel}. Nhiệm vụ tiếp theo đã được cập nhật lịch!`);
    }, 100);

    setFocusSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const cancelFocusSession = (sessionId) => {
    if (confirm("Bạn có muốn hủy bỏ phiên tập trung này? Thời gian làm sẽ KHÔNG được ghi nhận.")) {
      setFocusSessions(prev => prev.filter(s => s.id !== sessionId));
    }
  };

  // Habits CRUD
  const addHabit = (habitData) => {
    const newHabit = {
      id: `habit-${uuid()}`,
      color: '#3b82f6',
      icon: '✨',
      category: 'personal',
      startDate: getRelativeDateStr(0),
      ...habitData
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const updateHabit = (id, updatedFields) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updatedFields } : h));
  };

  const deleteHabit = (id) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setHabitLogs(prev => prev.filter(log => log.habitId !== id));
  };

  const toggleHabitLog = (habitId, dateStr) => {
    const existingLog = habitLogs.find(log => log.habitId === habitId && log.date === dateStr);
    if (existingLog) {
      // Remove completion log
      setHabitLogs(prev => prev.filter(log => log.id !== existingLog.id));
    } else {
      // Add completion log
      const newLog = {
        id: uuid(),
        habitId,
        date: dateStr,
        completed: true,
        completedAt: new Date().toISOString()
      };
      setHabitLogs(prev => [...prev, newLog]);
    }
  };

  // Habit Streak Calculations
  const getHabitStats = (habitId) => {
    const logs = habitLogs
      .filter(log => log.habitId === habitId && log.completed)
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first

    if (logs.length === 0) {
      return { currentStreak: 0, longestStreak: 0, totalCompleted: 0, completionRate: 0 };
    }

    const uniqueDates = Array.from(new Set(logs.map(l => l.date))).sort().reverse(); // Newest first ['2026-06-02', '2026-05-31']

    // Calculate Current Streak
    let currentStreak = 0;
    let checkDate = new Date(); // Start check from today
    let checkDateStr = getLocalDateStr(checkDate);
    
    // If today is not logged, check yesterday. If yesterday is also not logged, streak is broken (0).
    const hasToday = uniqueDates.includes(checkDateStr);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterday);
    const hasYesterday = uniqueDates.includes(yesterdayStr);

    if (hasToday || hasYesterday) {
      let tempDate = hasToday ? checkDate : yesterday;
      let tempDateStr = getLocalDateStr(tempDate);
      
      while (uniqueDates.includes(tempDateStr)) {
        currentStreak++;
        tempDate.setDate(tempDate.getDate() - 1);
        tempDateStr = getLocalDateStr(tempDate);
      }
    }

    // Calculate Longest Streak
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedDatesAsc = [...uniqueDates].reverse(); // Oldest first

    for (let i = 0; i < sortedDatesAsc.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedDatesAsc[i - 1]);
        const currDate = new Date(sortedDatesAsc[i]);
        const diffTime = Math.abs(currDate - prevDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          if (tempStreak > longestStreak) longestStreak = tempStreak;
          tempStreak = 1;
        }
      }
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;

    // Completion Rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const logsInLast30 = logs.filter(log => new Date(log.date) >= thirtyDaysAgo);
    const completionRate = Math.round((logsInLast30.length / 30) * 100);

    return {
      currentStreak,
      longestStreak,
      totalCompleted: logs.length,
      completionRate
    };
  };

  // Pomodoro Sessions CRUD & Actions
  const logPomodoroSession = (taskId, durationMinutes, actualFocusMinutes) => {
    const linkedTask = tasks.find(t => t.id === taskId);
    const taskRate = linkedTask ? (linkedTask.billable ? (linkedTask.hourlyRate || user.hourlyRate) : 0) : 0;
    const sessionEarnings = Math.round(((actualFocusMinutes / 60) * taskRate) * 100) / 100;

    const newSession = {
      id: uuid(),
      userId: user.id,
      taskId: taskId || null,
      subtaskId: activeSubtaskId || null,
      duration: durationMinutes,
      focusTime: actualFocusMinutes,
      completed: true,
      moneyEarned: sessionEarnings,
      createdAt: new Date().toISOString()
    };

    setPomodoros(prev => [newSession, ...prev]);

    // Update actualTime on the task and subtask
    if (taskId) {
      setTasks(prevTasks => {
        const targetTask = prevTasks.find(t => t.id === taskId);
        if (!targetTask) return prevTasks;

        let updatedSubtasks = targetTask.subtasks || [];
        if (activeSubtaskId) {
          updatedSubtasks = (targetTask.subtasks || []).map(st => {
            if (st.id === activeSubtaskId) {
              const newActual = (st.actualTime || 0) + actualFocusMinutes;
              return {
                ...st,
                actualTime: newActual,
                completed: newActual >= (st.estimatedTime || 30) ? true : st.completed
              };
            }
            return st;
          });
        }

        const newActualTime = (targetTask.actualTime || 0) + actualFocusMinutes;

        // Return updated tasks array
        const updatedTasks = prevTasks.map(t => {
          if (t.id === taskId) {
            return {
              ...t,
              actualTime: newActualTime,
              subtasks: updatedSubtasks
            };
          }
          return t;
        });
        
        return updatedTasks;
      });
    }

    return newSession;
  };

  // Financial CRUD
  const addExpense = (expenseData) => {
    const newExpense = {
      id: uuid(),
      userId: user.id,
      createdAt: new Date().toISOString(),
      ...expenseData
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const deleteExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const addIncome = (incomeData) => {
    const newIncome = {
      id: uuid(),
      userId: user.id,
      createdAt: new Date().toISOString(),
      ...incomeData
    };
    setIncomes(prev => [newIncome, ...prev]);
  };

  const deleteIncome = (id) => {
    setIncomes(prev => prev.filter(i => i.id !== id));
  };

  // Drag and Drop (Kanban status transition)
  const moveTask = (taskId, targetColumnId) => {
    let newStatus = 'todo';
    if (targetColumnId === 'col-progress') newStatus = 'in-progress';
    if (targetColumnId === 'col-done') newStatus = 'done';
    
    updateTask(taskId, { status: newStatus });
  };

  // AI Suggestions Generator (analyzes mock DB in client and outputs tips)
  const getAISuggestions = () => {
    const list = [];
    
    // Task check
    const overdueTasks = tasks.filter(t => t.dueDate && t.dueDate < getRelativeDateStr(0) && t.status !== 'done');
    if (overdueTasks.length > 0) {
      list.push({
        id: 'ai-sug-1',
        type: 'task',
        title: 'Xử lý công việc trễ hạn',
        description: `Bạn có ${overdueTasks.length} việc quá hạn. Tôi khuyên bạn nên làm "${overdueTasks[0].title}" ngay hôm nay để tránh bị dồn ứ công việc.`,
        actionable: true
      });
    }

    // Expense check
    const foodExpenses = expenses
      .filter(e => e.category === 'Wants' && e.notes.toLowerCase().includes('cafe') || e.notes.toLowerCase().includes('starbucks'))
      .reduce((sum, e) => sum + e.amount, 0);
    if (foodExpenses > 50) {
      list.push({
        id: 'ai-sug-2',
        type: 'budget',
        title: 'Giảm thiểu chi phí Cafe/Ăn uống',
        description: `Tháng này bạn đã chi $${foodExpenses} cho các khoản ăn uống/cafe. Cắt giảm 2 ly nước ngoài tiệm có thể tiết kiệm thêm $15 một tuần cho quỹ tự do tài chính.`,
        actionable: false
      });
    }

    // Opportunity cost check
    list.push({
      id: 'ai-sug-3',
      type: 'budget',
      title: 'Hiệu quả thời gian kiếm tiền',
      description: `Với mức giá $${user.hourlyRate}/giờ, hóa đơn điện nước $85 của bạn tương đương khoảng 1.7 giờ làm việc tập trung. Hãy cân nhắc chi phí cơ hội này!`,
      actionable: false
    });

    // Habits check
    const gymStats = getHabitStats('habit-1');
    if (gymStats.currentStreak >= 3) {
      list.push({
        id: 'ai-sug-4',
        type: 'habit',
        title: 'Chúc mừng chuỗi thói quen!',
        description: `Chuỗi thói quen Tập gym của bạn đã đạt ${gymStats.currentStreak} ngày. Duy trì đều đặn giúp bạn hoàn thành thêm 20% công việc trong ngày!`,
        actionable: false
      });
    } else {
      list.push({
        id: 'ai-sug-5',
        type: 'habit',
        title: 'Cần duy trì thói quen tập luyện',
        description: 'Tuần này bạn bỏ lỡ một số buổi tập. Hãy đặt báo thức vào 17h chiều để nhắc nhở bản thân xách giày đi tập nhé.',
        actionable: true
      });
    }

    return list;
  };

  // --- Books CRUD & Reading actions ---
  const addBook = (bookData) => {
    // Check duplication by title or downloadUrl
    const isDuplicate = books.some(b => 
      (b.title.toLowerCase().trim() === bookData.title.toLowerCase().trim()) ||
      (bookData.downloadUrl && b.downloadUrl === bookData.downloadUrl)
    );
    if (isDuplicate) {
      return null; // Return null to indicate duplicate skipped
    }

    const newBook = {
      id: `book-${uuid()}`,
      totalPages: 100,
      currentPage: 0,
      coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=200&h=300&q=80',
      fileType: 'manual',
      chapters: [],
      completed: false,
      category: 'Cá nhân',
      createdAt: new Date().toISOString(),
      ...bookData
    };
    setBooks(prev => [newBook, ...prev]);
    return newBook;
  };

  const updateBookProgress = (bookId, page) => {
    setBooks(prev => prev.map(b => {
      if (b.id === bookId) {
        const validatedPage = Math.min(b.totalPages, Math.max(0, parseInt(page) || 0));
        const completed = validatedPage === b.totalPages;
        return { ...b, currentPage: validatedPage, completed };
      }
      return b;
    }));
  };

  const deleteBook = (bookId) => {
    setBooks(prev => prev.filter(b => b.id !== bookId));
  };

  const updateBookContent = (bookId, fields) => {
    setBooks(prev => prev.map(b => {
      if (b.id === bookId) {
        return { ...b, ...fields };
      }
      return b;
    }));
  };

  // Logs a reading session, creates a Pomodoro and checks off "Đọc sách" habit for today
  const logReadingSession = (bookId, minutesRead, targetPage) => {
    // 1. Update book page
    if (bookId && targetPage !== undefined) {
      updateBookProgress(bookId, targetPage);
    }
    
    // 2. Log Pomodoro session
    // Find or create an associated task for "Đọc sách" or log a standalone
    const readingTask = tasks.find(t => t.title.toLowerCase().includes('đọc sách'));
    const taskId = readingTask ? readingTask.id : null;
    logPomodoroSession(taskId, minutesRead, minutesRead);

    // 3. Mark habit "Đọc sách" (habit-2) as done today
    const todayStr = getLocalDateStr();
    const isHabitDone = habitLogs.some(log => log.habitId === 'habit-2' && log.date === todayStr && log.completed);
    if (!isHabitDone) {
      toggleHabitLog('habit-2', todayStr);
    }
  };

  // Objectives and Key Results CRUD handlers
  const addObjective = (title, description, category) => {
    const newObj = {
      id: `obj-${uuid()}`,
      title,
      description: description || '',
      category: category || 'Cá nhân',
      createdAt: new Date().toISOString()
    };
    setObjectives(prev => [...prev, newObj]);
    return newObj;
  };

  const updateObjective = (id, fields) => {
    setObjectives(prev => prev.map(o => o.id === id ? { ...o, ...fields } : o));
  };

  const deleteObjective = (id) => {
    setObjectives(prev => prev.filter(o => o.id !== id));
    setKeyResults(prev => prev.filter(kr => kr.objectiveId !== id));
  };

  const addKeyResult = (objectiveId, title, targetValue, currentValue, unit, linkedFinanceCategory = null) => {
    const newKR = {
      id: `kr-${uuid()}`,
      objectiveId,
      title,
      targetValue: parseFloat(targetValue) || 0,
      currentValue: parseFloat(currentValue) || 0,
      unit: unit || '',
      linkedFinanceCategory: linkedFinanceCategory || null,
      createdAt: new Date().toISOString()
    };
    setKeyResults(prev => [...prev, newKR]);
    return newKR;
  };

  const updateKeyResult = (id, fields) => {
    setKeyResults(prev => prev.map(kr => kr.id === id ? {
      ...kr,
      ...fields,
      targetValue: fields.targetValue !== undefined ? parseFloat(fields.targetValue) || 0 : kr.targetValue,
      currentValue: fields.currentValue !== undefined ? parseFloat(fields.currentValue) || 0 : kr.currentValue
    } : kr));
  };

  const deleteKeyResult = (id) => {
    setKeyResults(prev => prev.filter(kr => kr.id !== id));
  };

  const addAiUsageLog = (model, inputTokens, outputTokens) => {
    const costInfo = calculateAICost(model, inputTokens, outputTokens, 'USD');
    const newLog = {
      id: `ai-log-${Math.random().toString(36).substring(2, 15)}`,
      model,
      inputTokens: parseInt(inputTokens) || 0,
      outputTokens: parseInt(outputTokens) || 0,
      costUSD: costInfo.totalCost,
      timestamp: new Date().toISOString(),
      synced: false
    };
    setAiUsageLogs(prev => [newLog, ...(prev || [])]);
  };

  const syncAiCostsToExpenses = () => {
    const unsyncedLogs = (aiUsageLogs || []).filter(log => !log.synced);
    if (unsyncedLogs.length === 0) return false;

    const totalUnsyncedCostUSD = unsyncedLogs.reduce((sum, log) => sum + (log.costUSD || 0), 0);
    const currency = user.currency || 'USD';
    
    let amount = totalUnsyncedCostUSD;
    if (currency === 'VND') {
      amount = totalUnsyncedCostUSD * 25500;
    }

    const newExpense = {
      id: `expense-${Math.random().toString(36).substring(2, 15)}`,
      userId: user.id,
      amount: Math.round(amount * 100) / 100,
      category: 'Needs',
      date: getLocalDateStr(),
      notes: `Kết chuyển chi phí AI tích lũy (${unsyncedLogs.length} lượt gọi)`,
      createdAt: new Date().toISOString()
    };

    setExpenses(prev => [newExpense, ...prev]);
    setAiUsageLogs(prev => (prev || []).map(log => ({ ...log, synced: true })));
    return true;
  };

  // Seed resetting (helper for testing)
  const resetToSeeds = () => {
    localStorage.removeItem('tf_projects');
    localStorage.removeItem('tf_user');
    localStorage.removeItem('tf_preferences');
    localStorage.removeItem('tf_tasks');
    localStorage.removeItem('tf_habits');
    localStorage.removeItem('tf_habit_logs');
    localStorage.removeItem('tf_pomodoros');
    localStorage.removeItem('tf_expenses');
    localStorage.removeItem('tf_incomes');
    localStorage.removeItem('tf_ai_usage_logs');
    localStorage.removeItem('tf_boards');
    localStorage.removeItem('tf_board_columns');
    localStorage.removeItem('tf_books');
    localStorage.removeItem('tf_book_categories');
    localStorage.removeItem('tf_objectives');
    localStorage.removeItem('tf_key_results');
    
    setProjects(initialProjects);
    setUser(initialUser);
    setPreferences(initialPreferences);
    setTasks(initialTasks);
    setHabits(initialHabits);
    setHabitLogs(initialHabitLogs);
    setPomodoros(initialPomodoros);
    setExpenses(initialExpenses);
    setIncomes(initialIncomes);
    setBoards(initialBoards);
    setBoardColumns(initialBoardColumns);
    setBooks(initialBooks);
    setBookCategories(['Kinh tế', 'Kỹ năng', 'Văn học', 'Cá nhân']);
    setObjectives(initialObjectives);
    setKeyResults(initialKeyResults);
    setAiUsageLogs([]);
  };

  return (
    <AppContext.Provider value={{
      aiUsageLogs, setAiUsageLogs,
      addAiUsageLog,
      syncAiCostsToExpenses,
      projects, setProjects,
      user, setUser,
      preferences, setPreferences,
      tasks, setTasks,
      habits, setHabits,
      habitLogs, setHabitLogs,
      pomodoros, setPomodoros,
      expenses, setExpenses,
      incomes, setIncomes,
      boards, setBoards,
      boardColumns, setBoardColumns,
      notifications,
      getRealDayWeather,
      getRealWeatherForHour,
      addTask,
      addManualTask,
      updateTask,
      deleteTask,
      rescheduleTask,
      getAutoRescheduleSlot,
      addSubtask,
      toggleSubtask,
      deleteSubtask,
      updateSubtask,
      addProject,
      addProjectSection,
      addHabit,
      updateHabit,
      deleteHabit,
      toggleHabitLog,
      getHabitStats,
      logPomodoroSession,
      addExpense,
      deleteExpense,
      addIncome,
      deleteIncome,
      moveTask,
      getAISuggestions,
      resetToSeeds,
      objectives, setObjectives,
      keyResults, setKeyResults,
      addObjective,
      updateObjective,
      deleteObjective,
      addKeyResult,
      updateKeyResult,
      deleteKeyResult,
      books, setBooks,
      bookCategories, setBookCategories,
      addBook,
      updateBookProgress,
      updateBookContent,
      deleteBook,
      logReadingSession,
      isReaderFullscreen,
      setIsReaderFullscreen,
      viewMode, setViewMode,
      selectedTaskId, setSelectedTaskId,
      activeSubtaskId, setActiveSubtaskId,
      startFocusOnTask,
      focusSessions, setFocusSessions,
      toggleFocusSession, stopAndLogFocusSession, cancelFocusSession,
      timerSecondsLeft,
      timerIsActive,
      timerDuration,
      timerDemoSpeed, setTimerDemoSpeed,
      pauseTimer, resumeTimer,
      stopAndLogTimer, cancelTimer
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

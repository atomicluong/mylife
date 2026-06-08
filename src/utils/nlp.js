// Natural Language Parser for Vietnamese (Todoist-style)

export function parseVietnameseNLP(input) {
  if (!input || typeof input !== 'string') return null;

  let text = input.trim();
  let dueDate = null;
  let dueTime = null;
  let project = null;
  let tags = [];
  let recurring = null;

  // 1. Extract Projects (@ProjectName)
  const projectRegex = /@([\w\p{L}]+)/gu;
  const projectMatches = [...text.matchAll(projectRegex)];
  if (projectMatches.length > 0) {
    project = projectMatches[0][1];
    text = text.replace(projectMatches[0][0], '');
  }

  // 2. Extract Tags (#TagName)
  const tagRegex = /#([\w\p{L}]+)/gu;
  const tagMatches = [...text.matchAll(tagRegex)];
  if (tagMatches.length > 0) {
    tags = tagMatches.map(match => match[1]);
    tagMatches.forEach(match => {
      text = text.replace(match[0], '');
    });
  }

  // Helper to adjust dates
  const today = new Date();
  const getDayOfWeek = (dayIndex, nextWeek = false) => {
    // dayIndex: 0 = Sunday, 1 = Monday, etc.
    const resultDate = new Date(today);
    const currentDay = today.getDay();
    let distance = dayIndex - currentDay;
    if (distance <= 0) {
      distance += 7; // Get next week's day if it's past or today
    }
    if (nextWeek) {
      distance += 7;
    }
    resultDate.setDate(today.getDate() + distance);
    return resultDate;
  };

  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // 3. Extract Dates
  const datePatterns = [
    { regex: /\bhôm\s+nay\b/i, getDate: () => new Date() },
    { regex: /\bngày\s+mai\b/i, getDate: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d;
    }},
    { regex: /\bngày\s+kia\b/i, getDate: () => {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      return d;
    }},
    { regex: /\bhôm\s+qua\b/i, getDate: () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d;
    }},
    { regex: /\bthứ\s+hai\b/i, getDate: () => getDayOfWeek(1) },
    { regex: /\bthứ\s+ba\b/i, getDate: () => getDayOfWeek(2) },
    { regex: /\bthứ\s+tư\b/i, getDate: () => getDayOfWeek(3) },
    { regex: /\bthứ\s+năm\b/i, getDate: () => getDayOfWeek(4) },
    { regex: /\bthứ\s+sáu\b/i, getDate: () => getDayOfWeek(5) },
    { regex: /\bthứ\s+bảy\b/i, getDate: () => getDayOfWeek(6) },
    { regex: /\bchủ\s+nhật\b/i, getDate: () => getDayOfWeek(0) },
    { regex: /\bthứ\s+hai\s+tuần\s+sau\b/i, getDate: () => getDayOfWeek(1, true) },
    { regex: /\bthứ\s+ba\s+tuần\s+sau\b/i, getDate: () => getDayOfWeek(2, true) },
    { regex: /\bthứ\s+tư\s+tuần\s+sau\b/i, getDate: () => getDayOfWeek(3, true) },
    { regex: /\bthứ\s+năm\s+tuần\s+sau\b/i, getDate: () => getDayOfWeek(4, true) },
    { regex: /\bthứ\s+sáu\s+tuần\s+sau\b/i, getDate: () => getDayOfWeek(5, true) },
    { regex: /\bthứ\s+bảy\s+tuần\s+sau\b/i, getDate: () => getDayOfWeek(6, true) },
    { regex: /\bchủ\s+nhật\s+tuần\s+sau\b/i, getDate: () => getDayOfWeek(0, true) },
    { regex: /\btuần\s+sau\b/i, getDate: () => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d;
    }},
    { regex: /\btháng\s+sau\b/i, getDate: () => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return d;
    }}
  ];

  for (const pattern of datePatterns) {
    if (pattern.regex.test(text)) {
      dueDate = formatDate(pattern.getDate());
      text = text.replace(pattern.regex, '');
      break;
    }
  }

  // 4. Extract Times (e.g. "lúc 3 chiều", "lúc 15h", "lúc 8 giờ sáng", "10h tối", "14:30")
  const timePatterns = [
    // 15:30 or 15h30 or 15h
    { regex: /\blúc\s+(\d{1,2})(?:[h:](\d{2})?)?\b/i },
    { regex: /\b(\d{1,2})[h:](\d{2})?\b/i },
    { regex: /\blúc\s+(\d{1,2})\s*giờ\s*(\d{2})?\b/i }
  ];

  let ampm = null;
  if (/\b(chiều|tối|pm)\b/i.test(text)) {
    ampm = 'pm';
    text = text.replace(/\b(chiều|tối|pm)\b/i, '');
  } else if (/\b(sáng|am)\b/i.test(text)) {
    ampm = 'am';
    text = text.replace(/\b(sáng|am)\b/i, '');
  }

  for (const pattern of timePatterns) {
    const match = text.match(pattern.regex);
    if (match) {
      let hours = parseInt(match[1]);
      let minutes = match[2] ? parseInt(match[2]) : 0;

      if (ampm === 'pm' && hours < 12) {
        hours += 12;
      } else if (ampm === 'am' && hours === 12) {
        hours = 0;
      } else if (!ampm) {
        // Fallback guess: if user says "3 chiều" but we missed the word order, or if hours is <= 5, it's probably PM (afternoon/evening)
        if (hours > 0 && hours <= 6 && /lúc/i.test(input) && !/sáng/i.test(input)) {
          hours += 12; // E.g. "lúc 3" defaults to 15:00
        }
      }

      dueTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      text = text.replace(match[0], '');
      break;
    }
  }

  // 5. Extract Recurring ("mỗi ngày", "mỗi tuần", "hàng ngày", "hàng tuần")
  const recurringPatterns = [
    { regex: /\b(mỗi|hàng)\s+ngày\b/i, frequency: 'daily' },
    { regex: /\b(mỗi|hàng)\s+tuần\b/i, frequency: 'weekly' },
    { regex: /\b(mỗi|hàng)\s+tháng\b/i, frequency: 'monthly' }
  ];

  for (const pattern of recurringPatterns) {
    if (pattern.regex.test(text)) {
      recurring = { frequency: pattern.frequency };
      text = text.replace(pattern.regex, '');
      break;
    }
  }

  // Clean double spaces and punctuation from leftover title
  let title = text
    .replace(/\s+/g, ' ')
    .replace(/^\s*[-*,.]\s*/, '')
    .trim();

  // If title is empty, use a default
  if (!title) {
    title = 'Task không tên';
  }

  return {
    title,
    dueDate,
    dueTime,
    project,
    tags,
    recurring
  };
}

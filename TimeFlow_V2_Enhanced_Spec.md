# 📋 TIMEFLOW V2 ENHANCED - DETAILED SPECIFICATION

**Version:** 2.1  
**Last Updated:** June 2, 2026  
**Status:** Web MVP ✅ Done → Native App 🚧 In Progress  
**Author:** Lương  

---

## 📑 TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Vision & Strategic Goals](#2-vision--strategic-goals)
3. [User Personas](#3-user-personas)
4. [Feature Specifications](#4-feature-specifications)
5. [Database Schema](#5-database-schema)
6. [API Endpoints](#6-api-endpoints)
7. [Technology Stack](#7-technology-stack)
8. [Development Roadmap](#8-development-roadmap)
9. [Monetization Strategy](#9-monetization-strategy)
10. [Success Metrics](#10-success-metrics)

---

## 1. EXECUTIVE SUMMARY

### Overview
**TimeFlow V2 Enhanced** là ứng dụng quản lý thời gian, tài chính và thói quen cá nhân all-in-one, kết hợp sức mạnh của:
- **Todoist**: Natural Language Processing (tiếng Việt), Voice-to-Task
- **TickTick**: Calendar tích hợp, Habit Tracker, Pomodoro Timer
- **Things 3**: Start Date, Smart Lists (Today/Someday/Anytime)
- **Microsoft To Do**: Kanban Board View, Subtasks
- **Google Tasks**: Subtasks, Simplicity
- **Masterchef Finance**: 50/30/20 Budgeting, Expense Tracking

### Unique Selling Points
1. **Tích hợp toàn diện**: Task + Finance + Habits + Calendar + Pomodoro - không cần 5 ứng dụng
2. **Tiếng Việt thông minh**: Parse tiếng Việt tự nhiên ("Nộp báo cáo thứ Sáu 3 chiều")
3. **Tối ưu cho creator**: Dành riêng cho freelancer, solopreneur, người làm side hustle
4. **Financial Intelligence**: Tính chi phí cơ hội, theo dõi thời gian = tiền
5. **AI-powered suggestions**: Gợi ý task, ngân sách, thói quen dựa trên history

### Target Market (Phase 1)
- **Châu Á-Thái Bình Dương** (Việt Nam, Thailand, Indonesia, Philippines)
- **Freelancer, Solopreneur, Side Hustler** (25-45 tuổi)
- **Sinh viên** (19-25 tuổi)
- **Corporate employees** với personal productivity goals

---

## 2. VISION & STRATEGIC GOALS

### Vision Statement
*"Empower independent creators and solopreneurs to maximize productivity, manage finances, and build sustainable habits - all in one beautiful, intelligent app."*

### Phase 1 Goals (10 weeks)
- ✅ MVP với 6 core modules
- ✅ 1,000 early adopters
- ✅ 4.5+ star rating
- ✅ Freemium model tạo ra revenue
- ✅ Product-market fit validation

### Phase 2 Goals (Months 4-6) — Native App
- 🎯 **Native app iOS + Android** (Expo) — ưu tiên #1
- 🎯 **Server & database** (Supabase) — sync đa thiết bị
- 🎯 **Book reader module** (ePub, admin-managed)
- 🎯 Collaboration features (share tasks/budgets)
- 🎯 Integration với Notion, Google Calendar, Slack
- 🎯 Advanced analytics & insights
- 🎯 International expansion

---

## 3. USER PERSONAS

### 3.1 Persona A: "Lương" - Solopreneur

**Profile:**
- Age: 32
- Occupation: Restaurant owner + Software developer
- Tech-savvy: HIGH
- Income: $3,000-8,000/month (variable)
- Pain points:
  - Juggling 5 apps (Calendar, Todo, Finance, Timer, Habits)
  - Can't track time-to-money accurately
  - Inconsistent work schedule
  - Side projects hard to prioritize

**Goals:**
- "Tôi muốn nhìn toàn cảnh doanh thu hàng ngày và biết mỗi giờ làm việc giá trị bao nhiêu"
- "Tôi cần automatic alerts khi chi phí vượt quá budget"
- "Tôi muốn insights: tháng nào bán hàng tốt, tiếng nào bận, việc gì tốn thời gian"

**Feature Priority:**
1. Pomodoro + Task management
2. Finance tracker + Budget alerts
3. Calendar overview
4. Analytics dashboard
5. Natural language input

---

### 3.2 Persona B: "Hương" - Corporate + Side Hustle

**Profile:**
- Age: 28
- Day job: Marketing Manager (9-5)
- Side business: Freelance design, coaching
- Tech comfort: MEDIUM
- Monthly income: $2,000 (job) + $800 (side) = $2,800
- Pain points:
  - Work-life balance
  - Time-tracking across 2 jobs
  - Income from multiple sources hard to track
  - Overcommit because can't see full picture

**Goals:**
- "Tôi muốn biết mỗi tuần tôi dành bao giờ cho job vs side hustle"
- "Tôi cần reminder để không quên các deadline"
- "Tôi muốn thời gian được phân bổ hợp lý (không overwork)"

**Feature Priority:**
1. Calendar + Time blocks
2. Multi-project task management
3. Finance tracker (split by source)
4. Habit tracker (self-care)
5. Weekly review

---

### 3.3 Persona C: "Minh" - Student/Fresh Graduate

**Profile:**
- Age: 23
- Status: 3rd year student + part-time tutor
- Tech comfort: VERY HIGH
- Monthly income: $300-600 (tutoring)
- Pain points:
  - Exam schedule + work schedule conflict
  - Want to build habits (exercise, reading, learning)
  - Money tight, prefer free
  - Minimal time to switch apps

**Goals:**
- "Tôi muốn app có dark mode, đẹp, nhanh"
- "Tôi muốn theo dõi streak: tập gym, đọc sách, học tiếng Anh"
- "Tôi muốn biết có bao nhiêu task overdue"

**Feature Priority:**
1. Clean, beautiful UI
2. Habit tracker
3. Task management
4. Free tier generous
5. Mobile-first

---

### 3.4 Persona D: "Đạt" - Productivity Enthusiast

**Profile:**
- Age: 35
- Occupation: Founder + Author
- GTD practitioner: YES
- Tech comfort: EXPERT
- Monthly income: $5,000+
- Pain points:
  - Existing apps don't follow GTD perfectly
  - Needs task dependencies & complex workflows
  - Want AI to help with planning
  - Need detailed reporting

**Goals:**
- "Tôi muốn Someday/Anytime lists như Things 3"
- "Tôi muốn AI gợi ý công việc nên làm hôm nay"
- "Tôi muốn task dependencies & subtasks"

**Feature Priority:**
1. Advanced task management
2. Smart lists (Today/Someday/Anytime)
3. Start Date feature
4. AI suggestions
5. Export & integration

---

## 4. FEATURE SPECIFICATIONS

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│              TIMEFLOW V2 FEATURE ARCHITECTURE            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  A. Authentication & Onboarding                         │
│  B. Task Management (Core)                              │
│  ├─ B1: Basic Task CRUD                                 │
│  ├─ B2: Natural Language Parser (NLP)                   │
│  ├─ B3: Voice-to-Task (Speech API)                      │
│  ├─ B4: Smart Lists & Start Date                        │
│  └─ B5: Subtasks & Dependencies                         │
│                                                          │
│  C. Pomodoro & Time Tracking                            │
│  ├─ C1: Timer (25/5/15 min)                             │
│  ├─ C2: Session History                                 │
│  └─ C3: Time-to-Money Tracking                          │
│                                                          │
│  D. Finance Management                                  │
│  ├─ D1: Expense/Income Tracker                          │
│  ├─ D2: Budget Management (50/30/20)                    │
│  ├─ D3: Financial Goals                                 │
│  └─ D4: Opportunity Cost Calculator                     │
│                                                          │
│  E. Habit Tracker                                       │
│  ├─ E1: Create & Manage Habits                          │
│  ├─ E2: Streak Tracking                                 │
│  └─ E3: Habit Analytics                                 │
│                                                          │
│  F. Calendar & Views                                    │
│  ├─ F1: Month/Week Calendar                             │
│  ├─ F2: Kanban Board View                               │
│  ├─ F3: Time Block Calendar                             │
│  └─ F4: Habit Calendar                                  │
│                                                          │
│  G. Dashboard & Analytics                               │
│  ├─ G1: Daily Overview                                  │
│  ├─ G2: Weekly Insights                                 │
│  ├─ G3: Monthly Reports                                 │
│  └─ G4: Financial Dashboard                             │
│                                                          │
│  H. Alarms & Notifications                              │
│  ├─ H1: Smart Alarms                                    │
│  ├─ H2: Budget Alerts                                   │
│  └─ H3: Habit Reminders                                 │
│                                                          │
│  I. AI & Suggestions                                    │
│  ├─ I1: Smart Task Suggestions                          │
│  ├─ I2: Budget Recommendations                          │
│  └─ I3: Habit Insights                                  │
│                                                          │
│  J. Settings & Profile                                  │
│  ├─ J1: User Preferences                                │
│  ├─ J2: Integrations                                    │
│  └─ J3: Export & Backup                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

### A. AUTHENTICATION & ONBOARDING

#### A1: Sign Up / Sign In
**Status**: Same as v1 (no changes)

| Feature | Details |
|---------|---------|
| Email signup | Email + password + verify email |
| Google OAuth | One-click signup with Google |
| Sign in | Email + password + remember me |
| Forgot password | Reset link via email (24h) |
| Session management | JWT + refresh token (30-day remember) |

**Endpoints**:
```
POST /auth/register
POST /auth/login
POST /auth/google
POST /auth/reset-password
POST /auth/refresh-token
```

---

#### A2: 7-Step Onboarding (UPDATED)
**Goal**: Setup user profile, preferences, & create first task

```
Step 1: Welcome
  "Chào mừng tới TimeFlow!"
  → Skip or Next

Step 2: Basic Info
  Name, Avatar, Currency, Timezone
  → Next

Step 3: Hourly Rate (Optional)
  "Nếu bạn freelancer, nhập giá/giờ để tính tiền kiếm được"
  Example: $50/hour
  → Next

Step 4: Finance Setup
  Income sources: "Salary, Freelance, Business"
  Monthly target: "$3,000"
  → Next

Step 5: Productivity Goals
  "Bạn muốn focus vào gì?"
  Options: Task management, Finance tracking, Habit building
  → Next

Step 6: Create First Task
  "Tạo task đầu tiên của bạn"
  Example: "Nộp báo cáo thứ Sáu 3 chiều"
  → AI parse + create task automatically

Step 7: Done!
  "Bạn sẵn sàng! Hãy bắt đầu."
  Show dashboard

```

---

### B. TASK MANAGEMENT (Core Module) - **MAJOR UPGRADE**

#### B1: Basic Task CRUD

**Task Properties** (Updated from v1):
```javascript
{
  id: UUID,
  userId: UUID,
  title: String,                    // "Nộp báo cáo"
  description: String,              // Optional detailed notes
  
  // Timing
  dueDate: Date,                    // "2026-06-06"
  dueTime: Time,                    // "15:00"
  startDate: Date,                  // NEW: When task becomes visible
  recurring: {                      // NEW: Repeat pattern
    frequency: "daily|weekly|monthly",
    endDate: Date
  },
  
  // Organization
  projectId: UUID,                  // Assigned to project
  listType: "today|scheduled|someday|anytime", // NEW
  parentTaskId: UUID,               // NEW: For subtasks
  
  // Priority & Status
  priority: 1-4,                    // 4 = most urgent
  status: "todo|in-progress|done|blocked|waiting", // UPDATED
  eisenhower: "Q1|Q2|Q3|Q4",       // Quadrant
  
  // Tags & Metadata
  tags: String[],                   // ["Marketing", "Urgent"]
  timeEstimate: Number,             // Minutes
  actualTime: Number,               // Minutes (from Pomodoro)
  
  // Finance Integration
  billable: Boolean,                // Is this work billable?
  hourlyRate: Number,               // $50/hour for this task
  linkedExpenses: UUID[],           // Related expenses
  
  // Relationships
  subtasks: UUID[],                 // Child tasks
  dependencies: UUID[],             // NEW: Tasks that block this
  blockedBy: UUID[],                // NEW: Tasks blocking this
  
  // AI
  suggestedTime: Date,              // AI suggestion when to do
  aiNotes: String,                  // AI insights
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
  completedAt: Timestamp,
  deletedAt: Timestamp
}
```

**Smart Lists** (NEW - inspired by Things 3):
```
[Today]
├─ Tasks with dueDate = today
├─ Tasks with startDate <= today AND not completed
└─ Overdue tasks

[Scheduled]
├─ Tasks with specific dueDate in future
└─ Recurring tasks

[Someday]
├─ Tasks with no dueDate
├─ Tasks with startDate far in future
└─ Ý tưởng, không định kì

[Anytime]
├─ Flexible tasks, no deadline
├─ "Có thể làm bất kỳ lúc nào"

[Waiting]
├─ NEW: Tasks blocked by others
├─ "Đang chờ feedback, chờ data từ người khác"

[Done]
└─ Completed tasks (last 30 days)
```

---

#### B2: Natural Language Parser (NEW - Todoist Feature)

**Goal**: Parse Vietnamese text into structured task

**Examples:**
```
Input: "Nộp báo cáo thứ Sáu lúc 3 chiều @Công việc #Marketing"
Output: {
  title: "Nộp báo cáo",
  dueDate: "2026-06-06",       // Friday
  dueTime: "15:00",
  projectId: "proj_work",
  tags: ["Marketing"]
}

Input: "Mua bánh canh ngày mai"
Output: {
  title: "Mua bánh canh",
  dueDate: "2026-06-03"        // Tomorrow
}

Input: "Tập gym 3 lần/tuần, bắt đầu từ thứ Hai"
Output: {
  title: "Tập gym",
  recurring: { frequency: "weekly", count: 3 },
  startDate: "2026-06-03"
}
```

**Implementation**:
- **Date parser**: Chrono.js library (detects "thứ Sáu", "ngày mai", "tuần sau")
- **Project parser**: Detect @ProjectName
- **Tag parser**: Detect #TagName
- **Claude API fallback**: For complex sentences, send to Claude to extract intent

**Endpoint**:
```javascript
POST /tasks/parse-natural-language
{
  input: "Nộp báo cáo thứ Sáu 3 chiều @Công việc",
  language: "vi"
}
→ {
  title: "Nộp báo cáo",
  dueDate: "2026-06-06",
  dueTime: "15:00",
  projectId: "proj_work",
  confidence: 0.95
}
```

---

#### B3: Voice-to-Task (NEW - Todoist Ramble Feature)

**Goal**: Speak naturally, AI converts to task

**How it works:**
1. User clicks 🎤 button
2. Browser captures voice (Web Speech API)
3. Send audio to server
4. Convert to text (Google Speech-to-Text API)
5. Parse with NLP parser
6. Show preview + confirm
7. Create task

**Example:**
```
Voice: "Mua bánh canh cua vào chiều mai"
↓
Text: "Mua bánh canh cua vào chiều mai"
↓
Parsed task: {
  title: "Mua bánh canh cua",
  dueDate: "2026-06-03",
  dueTime: "14:00"  // "chiều" = afternoon
}
↓
User confirms → Task created
```

**Endpoint**:
```javascript
POST /tasks/voice-to-task
{
  audioBlob: Blob,
  language: "vi"
}
→ {
  text: "Mua bánh canh cua vào chiều mai",
  task: { ... },
  confidence: 0.92
}
```

---

#### B4: Smart Lists & Start Date (NEW - Things 3 Feature)

**Start Date Concept:**
```
Task: "Chuẩn bị roadshow tháng 7"
Created: 2026-06-02
Start Date: 2026-06-25
Due Date: 2026-07-15

Timeline:
2026-06-02 → 2026-06-24: Task HIDDEN (not shown)
2026-06-25 → 2026-07-14: Task VISIBLE (in Today/Scheduled)
2026-07-15: Task OVERDUE (if not done)
```

**Use cases:**
- Tạo task dài hạn nhưng không muốn thấy cho đến khi gần hạn
- Keep focus: "Tôi chỉ muốn thấy task relevant với tuần này"
- Someday/Anytime: "Có thể làm sau"

**Database**:
```sql
ALTER TABLE tasks ADD COLUMN startDate DATE;

-- Create index for efficient filtering
CREATE INDEX idx_tasks_start_date ON tasks(userId, startDate, status);
```

---

#### B5: Subtasks & Dependencies (NEW - Microsoft To Do + GTD)

**Subtasks:**
```
Task: "Chuẩn bị lẩu cho Masterchef"
├─ Subtask 1: "Nấu nước dùng" [DONE]
├─ Subtask 2: "Chuẩn bị topping" [TODO]
└─ Subtask 3: "Set up bàn lẩu" [TODO]

Progress: 1/3 = 33%
Parent task status: "in-progress"
```

**Dependencies:**
```
Task A: "Tập gym"
Task B: "Tắm sạch" (depends on A)

If B has dependency on A:
- B cannot be marked done until A is done
- B shows as "blocked" if A incomplete
```

**API Endpoints**:
```javascript
POST /tasks/:id/subtasks              // Create subtask
GET /tasks/:id/subtasks               // List subtasks
POST /tasks/:id/dependencies          // Add dependency
GET /tasks/:id/blocked-by             // Show blockers
```

---

### C. POMODORO & TIME TRACKING

#### C1: Enhanced Pomodoro Timer
**Status**: Same as v1, but with new features

**Features**:
- **Timer options**: 25/5/15 min (customizable)
- **Session tracking**: Auto-log to Pomodoro history
- **Linked to task**: Each session links to a specific task
- **Break activities**: Suggest light activities during break
- **Focus mode**: Hide notifications
- **Auto-pause**: If user inactive >30s, ask "Still working?"

**Database** (same as v1):
```sql
CREATE TABLE pomodoro_sessions (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES users(id),
  taskId UUID REFERENCES tasks(id),
  duration INT,           -- 25 (minutes)
  focusTime INT,          -- 24 (actual focus time)
  breakTime INT,          -- 5
  completed BOOLEAN,
  distractionCount INT,   -- How many times tab closed?
  createdAt TIMESTAMP,
  completedAt TIMESTAMP
);
```

---

#### C2: Time-to-Money Tracking (NEW)
**Goal**: Show creator what their time is worth

**Calculation**:
```
Task: "Nộp báo cáo"
Hourly Rate: $50
Actual Time: 2 hours (from 2 Pomodoros)
Money Earned: 2 × $50 = $100

Dashboard shows:
"Hôm nay bạn kiếm được $250 (5 giờ × $50/giờ)"
```

**Where it appears:**
- Dashboard: Daily earnings
- Task detail: "This task earned you $100"
- Analytics: Earnings by project, by tag, by time period

**Database**:
```sql
ALTER TABLE pomodoro_sessions ADD COLUMN (
  linkedTaskId UUID REFERENCES tasks(id),
  hourlyRate DECIMAL(10,2),
  moneyEarned DECIMAL(10,2)
);
```

---

### D. FINANCE MANAGEMENT

#### D1: Expense/Income Tracker (with new features)

**Status**: Same as v1 (no major changes)

**Features**:
- Log expense: Amount, category, date, notes
- Log income: Source, amount, date, recurring?
- Linked to task: "This 2-hour task generated $100 income"
- Categories: Customizable (Food, Transport, Tools, etc.)

**Schema** (same as v1):
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY,
  userId UUID,
  amount DECIMAL(10,2),
  category VARCHAR(50),
  date DATE,
  notes TEXT,
  taskId UUID REFERENCES tasks(id),  -- NEW: Link to task
  createdAt TIMESTAMP
);

CREATE TABLE incomes (
  id UUID PRIMARY KEY,
  userId UUID,
  amount DECIMAL(10,2),
  source VARCHAR(100),
  date DATE,
  recurring BOOLEAN,
  taskIds UUID[],                     -- NEW: Link to tasks
  createdAt TIMESTAMP
);
```

---

#### D2: Budget Management (50/30/20 Rule)

**Concept** (same as v1):
- 50% = Needs (food, rent, utilities)
- 30% = Wants (entertainment, dining out)
- 20% = Savings/Debt

**Enhanced**:
- Budget alerts: "You've spent 75% of 'Food' budget this month"
- Smart categories: "Is this Food or Entertainment?"
- Opportunity cost: "Spent $100 on dinner = 2 hours of work"

---

#### D3: Financial Goals

**Examples**:
- "Save $10,000 by end of year"
- "Reach $5,000/month income"
- "Reduce eating out to $200/month"

**Dashboard**:
```
Goal: Save $10,000
Current savings: $3,200
Progress: 32%
Time left: 7 months
Monthly target: $970
This month saved: $450
```

---

### E. HABIT TRACKER (NEW MODULE)

#### E1: Create & Manage Habits

**Habit Properties**:
```javascript
{
  id: UUID,
  userId: UUID,
  name: String,                   // "Tập gym"
  description: String,            // Optional
  frequency: "daily|weekly|custom",
  targetDays: Int,                // 7 (days per week)
  color: String,                  // #FF5733
  icon: String,                   // "🏋️"
  category: "health|learn|financial|personal",
  startDate: Date,
  goalDate: Date,                 // When to achieve this habit?
  reminderTime: Time,             // "07:00"
  linkedTasks: UUID[],            // Tasks that support this
  createdAt: Timestamp,
  deletedAt: Timestamp
}
```

**Use cases:**
- "Tập gym 5 lần/tuần"
- "Đọc sách 30 phút/ngày"
- "Thiền 10 phút/ngày"
- "Học tiếng Anh 1 giờ/tuần"
- "Review tài chính 1 lần/tuần"

**API**:
```javascript
POST /habits                        // Create
GET /habits                         // List
PUT /habits/:id                     // Update
DELETE /habits/:id                  // Delete
POST /habits/:id/log                // Log completion (today)
GET /habits/:id/logs?from=&to=      // History
GET /habits/:id/stats               // Stats
```

---

#### E2: Streak Tracking (NEW)

**Concept:**
```
Habit: "Tập gym"
Last 7 days: ✓✓✓✓✗✓✓
Current streak: 2 days
Longest streak: 23 days
```

**Database**:
```sql
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY,
  habitId UUID REFERENCES habits(id),
  date DATE,
  completed BOOLEAN,
  notes TEXT,
  completedAt TIMESTAMP
);

-- Trigger: Auto-calculate current_streak
CREATE TABLE habit_stats (
  habitId UUID PRIMARY KEY,
  currentStreak INT,              -- Days in a row
  longestStreak INT,
  totalCompleted INT,             -- All-time
  completionRate DECIMAL(5,2),    -- Percentage
  lastLogDate DATE
);
```

---

#### E3: Habit Analytics

**Dashboard Cards:**
```
Tập gym
├─ Current streak: 2 days
├─ Longest streak: 23 days
├─ This week: 2/5 (40%)
├─ This month: 8/20 (40%)
├─ All-time: 95 completions
└─ Trend: ↓ (down from last week)

Đọc sách
├─ Current streak: 12 days ✨
├─ This week: 6/7 (86%)
└─ Trend: ↑ (up!)
```

**Insights** (AI-powered):
```
"🔥 Bạn đang giữ streak tập gym 2 ngày. Cứ tiếp tục!"
"📚 Thói quen đọc sách của bạn đang lên. +25% so với tháng trước"
"⚠️ Thói quen thiền có dấu hiệu suy giảm. Hãy tạo reminder"
```

---

### F. CALENDAR & VIEWS (UPGRADED)

#### F1: Month/Week/Day Calendar

**Month View** (NEW):
```
┌──────────────────────────────────────────┐
│              JUNE 2026                   │
├──────────────────────────────────────────┤
│ Sun  Mon  Tue  Wed  Thu  Fri  Sat       │
│  2    3    4    5    6 [Báo] 8         │
│                           [2 tasks]     │
│  9   10   11   12   13   14   15        │
│            [Gym]                        │
│                      [Income log]       │
├──────────────────────────────────────────┤
│ ● Task: 4 items    ● Income: 2 items   │
│ ● Expense: 1 item  ● Habit: 1 item     │
└──────────────────────────────────────────┘
```

**Week View**:
```
┌─────────────────────────────────────────────┐
│         WEEK OF JUNE 2-8, 2026              │
├─────────────────────────────────────────────┤
│ Mon 3:  Pomodoro (9-10am)                   │
│         Task: "Review code" [Done]          │
│         Habit: "Gym" ✓                      │
│                                             │
│ Tue 4:  Pomodoro (10-10:30am)               │
│         Task: "Write blog" [In progress]    │
│         Expense: Coffee $5                  │
│                                             │
│ Fri 7:  Task: "Nộp báo cáo" [Due 3pm]     │
│         Income: Freelance $200 ✓            │
└─────────────────────────────────────────────┘
```

**Day View**:
```
Jun 3, 2026

Morning:
 08:00 - 09:00  [Pomodoro] Nộp báo cáo
 09:30 - 10:30  [Pomodoro] Review code

Afternoon:
 14:00 - 14:30  [Habit] Tập gym
 15:00 - 15:30  [Habit] Đọc sách

Evening:
 20:00 - 20:30  [Pomodoro] Write email

Summary:
 Tasks done: 2/3
 Pomodoros: 3 (1:30 focus)
 Habits: 2/2
 Money earned: $75
 Money spent: $20
```

---

#### F2: Kanban Board View (NEW - Microsoft To Do)

**Default Columns:**
```
┌──────────────────┬──────────────────┬──────────────────┐
│   TODO (4)       │  IN PROGRESS (2) │   DONE (8)       │
├──────────────────┼──────────────────┼──────────────────┤
│ [Nộp báo]        │ [Tập gym]        │ [Mua hàng] ✓     │
│ 3d left, Q1      │ 1d left, Q2      │ Done 2d ago      │
│                  │                  │                  │
│ [Review code]    │ [Call client]    │ [Fix bug] ✓      │
│ 5d left, Q1      │ 0d (due today)   │ Done 1d ago      │
│                  │                  │                  │
│ [Email]          │                  │ [Meeting] ✓      │
│ No date, Q4      │                  │ Done 5d ago      │
│                  │                  │                  │
│ [Learn React]    │                  │ [Setup app] ✓    │
│ Someday          │                  │ Done 10d ago     │
└──────────────────┴──────────────────┴──────────────────┘

Columns customizable: ADD CUSTOM → "This Week", "Blocked", "Waiting"
Drag to move: Drag task between columns
```

**Implementation:**
- React Beautiful DnD library
- Columns: TODO, IN_PROGRESS, DONE (+ custom)
- Drag task to change status automatically
- Save column preference per user

---

#### F3: Time Block Calendar (NEW)

**Goal**: Visualize time commitment

```
Monday, June 3
┌──────────────────────────────────┐
│ 08:00 ┌────────────────────────┐ │
│       │ Pomodoro: Nộp báo cáo  │ ← 1 hour allocated
│ 09:00 │ (Focused 55 min)       │ │
│       └────────────────────────┘ │
│ 10:00 ┌────────────────────────┐ │
│       │ Pomodoro: Review code  │ ← 30 min allocated
│ 10:30 │ (Focused 28 min)       │ │
│       └────────────────────────┘ │
│ 11:00                            │ ← Free time
│ 12:00                            │ ← Free time
│ 13:00 ┌────────────────────────┐ │
│       │ Gym                    │ ← 1 hour (habit)
│ 14:00 │ (Completed)            │ │
│       └────────────────────────┘ │
│ 15:00 ┌────────────────────────┐ │
│       │ Free time              │ │
│ 17:00 │ or future task         │ │
│       └────────────────────────┘ │
├──────────────────────────────────┤
│ Daily total: 2.5 hours allocated │
│ Time utilization: 65%            │
│ Money earned: $125               │
└──────────────────────────────────┘
```

---

#### F4: Habit Calendar (NEW)

**Goal**: Visual habit tracking (like GitHub commit graph)

```
Tập gym - June 2026
┌─────────────────────────────────────┐
│ Mon Tue Wed Thu Fri Sat Sun         │
│  3   4   5   6   7   8   9          │
│ [✓] [ ] [✓] [✓] [ ] [✓] [✓]        │
│ 10  11  12  13  14  15  16          │
│ [✓] [✓] [✓] [✓] [ ] [ ] [✓]        │
│ 17  18  19  20  21  22  23          │
│ [✓] [✓] [ ] [✓] [✓] [ ] [✓]        │
│ 24  25  26  27  28  29  30          │
│ [ ] [✓] [✓] [✓] [✓] [✓] [✓]        │
└─────────────────────────────────────┘

Legend:
[✓] = Completed today
[ ] = Not completed
Colors intensity = Streak count
```

---

### G. DASHBOARD & ANALYTICS

#### G1: Daily Overview

```
┌─────────────────────────────────────────────┐
│          GOOD MORNING, LƯƠNG! 👋              │
│                                             │
│ Today: Monday, June 3, 2026                │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│ 📊 TODAY'S SUMMARY                          │
│ ├─ Tasks: 2/4 done (50%)                   │
│ ├─ Pomodoros: 2 sessions (90 min)          │
│ ├─ Money earned: $100                      │
│ ├─ Money spent: $25                        │
│ └─ Habits: 2/3 completed                   │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│ 🎯 FOCUS TASKS (Due today or overdue)      │
│ ├─ [1] Nộp báo cáo @ 3:00pm (Q1, 2h)     │
│ ├─ [2] Review code (Q2, 1h)               │
│ └─ [3] Call client (Q3, 30min) - OVERDUE  │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│ 💪 HABITS TODAY                             │
│ ├─ [✓] Tập gym - 1:00pm                    │
│ ├─ [ ] Đọc sách - Due 8:00pm               │
│ └─ [✓] Thiền - 7:00am                      │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│ 💰 FINANCIAL SNAPSHOT                       │
│ ├─ Income today: $100                      │
│ ├─ Expense today: $25                      │
│ ├─ Net: $75                                │
│ └─ Budget (Food): $12/$50 used (24%)       │
│                                             │
└─────────────────────────────────────────────┘
```

---

#### G2: Weekly Insights

```
Week of June 2-8, 2026

PRODUCTIVITY
├─ Total tasks: 18
├─ Completed: 14 (78%) ↑ from last week
├─ Pomodoros: 12 (6 hours)
└─ Productivity trend: 📈 Strong

TIME ALLOCATION
├─ Work tasks: 60% (9h)
├─ Learning: 20% (3h)
├─ Personal: 20% (3h)

FINANCE
├─ Income: $850
├─ Expenses: $210
├─ Savings: $640 (75%)
├─ Budget status: On track ✓
└─ Top expense: Food ($120)

HABITS
├─ Gym: 5/7 (71%) ↑
├─ Reading: 4/7 (57%) ↓
├─ Meditation: 6/7 (86%) ✨
└─ Overall: 15/21 (71%)

AI INSIGHTS
├─ 💡 "You earned $140 from billable tasks"
├─ 💡 "Food budget trending over. Cut $20 this week"
├─ 💡 "Reading habit declining. Try setting morning reminder"
└─ 💡 "Your productive hours: 9-11am, 2-4pm. Schedule hard tasks then"
```

---

#### G3: Monthly Reports

```
JUNE 2026 REPORT

PRODUCTIVITY STATS
├─ Tasks completed: 58/72 (81%)
├─ Total Pomodoros: 52 (26 hours focus)
├─ Avg tasks/day: 1.9
├─ Most productive day: Friday (2.3 tasks/day)
└─ Busiest week: June 8-14

FINANCIAL SUMMARY
├─ Total income: $3,200
│  ├─ Salary: $2,000
│  ├─ Freelance: $1,000
│  ├─ Business: $200
│  └─ 50-30-20 allocation:
│     ├─ Needs (50%): $1,600 spent ✓
│     ├─ Wants (30%): $900 spent ✓
│     └─ Savings (20%): $700 saved ✓
│
├─ Expenses by category:
│  ├─ Food: $580 (82% of budget)
│  ├─ Transport: $150
│  ├─ Tools: $100
│  └─ Entertainment: $120
│
└─ Billable hours: 18h @ $50/h = $900

HABIT PERFORMANCE
├─ Gym: 20/30 days (67%)
├─ Reading: 18/30 days (60%)
├─ Meditation: 25/30 days (83%)
└─ Language learning: 22/30 days (73%)

TRENDS & INSIGHTS
├─ 📈 Productivity up 15% from last month
├─ 📊 Income increased $200 (billable work)
├─ ⚠️ Food spending 82% of budget - need control
├─ 💪 Meditation streak strong
├─ 📚 Reading habit needs boost
└─ 🎯 On track to hit $50k annual income target
```

---

### H. ALARMS & NOTIFICATIONS

#### H1: Smart Alarms (same as v1)

#### H2: Budget Alerts (NEW)

```
"⚠️ Food budget at 75% ($37.50 spent of $50)"

"💡 Suggested: Skip 1 meal out, save $15"

"🔴 ALERT: You exceeded Food budget by $5.20!"
   "Click to adjust budget or categorize differently"
```

#### H3: Habit Reminders (NEW)

```
"💪 Time to exercise! Your gym streak is 5 days - keep going!"
"📚 30 minutes left to read today. Your reading time is 7-8pm"
"🧘 Meditation time! Just 10 minutes for your daily calm"
```

---

### I. AI & SUGGESTIONS (NEW MODULE)

#### I1: Smart Task Suggestions

**How it works:**
- Analyze user's history: tasks completed, time patterns, productivity peaks
- Based on today's calendar, suggest what to do next
- Learn: What works, what doesn't

**Examples:**
```
9:00 AM: AI suggests
"Based on your history, you're most productive 9-11am.
I recommend doing 'Nộp báo cáo' (Q1 task) now.
Estimated: 2 hours. Start?"

2:00 PM: AI suggests
"You have 2 hours free. I can suggest:
1. 'Review code' (Q1, 1h)
2. 'Learn React' (Q2, 1.5h)
3. 'Email clients' (Q3, 30min)
Which would you like to do?"
```

**Endpoint**:
```javascript
GET /ai/task-suggestions?date=2026-06-03
→ {
  suggestions: [
    {
      taskId: "task_123",
      title: "Nộp báo cáo",
      priority: 1,
      estimatedTime: 120,
      reason: "High priority, due today, your peak productivity time"
    },
    ...
  ]
}
```

---

#### I2: Budget Recommendations

```
AI Analysis: 
"You spend average $120/month on dining out.
That's 17% of your income.
To hit $50k savings target, try: $80/month dining (~$15/week)"

"You bought coffee 25 times this month ($125).
That's a latte problem 😄
Set daily limit: 3x/week?"
```

---

#### I3: Habit Insights

```
AI Insights:
"🔍 Reading habit correlates with better sleep"
"🔍 Your gym sessions improve focus. You complete 20% more tasks on gym days"
"🔍 Morning meditation = higher daily income. Try 5min more?"
```

---

### J. SETTINGS & PROFILE

#### J1: User Preferences

```
ACCOUNT
├─ Email
├─ Password
├─ Avatar
├─ Name

PRODUCTIVITY SETTINGS
├─ Pomodoro duration (default 25 min)
├─ Break duration (default 5 min)
├─ Default task priority
├─ Default project
└─ Auto-start Pomodoro

FINANCE SETTINGS
├─ Currency (VND, USD, THB, etc)
├─ Hourly rate
├─ Income sources
├─ Expense categories
└─ Budget rules (50/30/20 or custom)

NOTIFICATIONS
├─ Task reminders (time before due)
├─ Budget alerts (percentage)
├─ Habit reminders
├─ Daily summary
└─ Email frequency

INTERFACE
├─ Theme (light/dark/auto)
├─ Language (VI, EN, TH)
├─ First day of week (Monday/Sunday)
├─ Calendar view (month/week/day)
├─ Timezone
└─ Date format (DD/MM/YYYY vs MM/DD/YYYY)

INTEGRATIONS
├─ Google Calendar sync (future)
├─ Notion export (future)
├─ Slack notifications (future)
└─ Zapier (future)
```

---

#### J2: Integrations

**Phase 1**: Manual export
**Phase 2**: 
- Google Calendar sync
- Notion export
- Slack notifications

```javascript
POST /integrations/connect
{
  provider: "google_calendar|notion|slack",
  accessToken: "..."
}

GET /integrations/status
→ {
  integrations: [
    { provider: "google_calendar", status: "connected" },
    { provider: "notion", status: "disconnected" }
  ]
}
```

---

#### J3: Export & Backup

**Formats:**
- CSV (tasks, expenses, habits)
- PDF (reports)
- JSON (full backup)
- iCal (calendar)

```javascript
POST /export
{
  format: "csv|pdf|json",
  dateRange: {
    from: "2026-01-01",
    to: "2026-06-30"
  }
}
→ { downloadUrl: "..." }
```

---

## 5. DATABASE SCHEMA

### 5.1 Core Tables (from v1)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  passwordHash VARCHAR(255),
  googleId VARCHAR(255),
  name VARCHAR(255),
  avatar TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'vi',
  currency VARCHAR(3) DEFAULT 'USD',
  hourlyRate DECIMAL(10,2),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP,
  deletedAt TIMESTAMP
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES users(id),
  name VARCHAR(255),
  color VARCHAR(7),
  description TEXT,
  archived BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW(),
  deletedAt TIMESTAMP
);

-- Tasks (SIGNIFICANTLY UPDATED)
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES users(id),
  projectId UUID REFERENCES projects(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Timing
  dueDate DATE,
  dueTime TIME,
  startDate DATE,                         -- NEW
  
  -- Recurring
  recurringId UUID,                       -- NEW: Link to recurring pattern
  
  -- Organization
  listType VARCHAR(50) DEFAULT 'scheduled', -- NEW: today|scheduled|someday|anytime
  parentTaskId UUID REFERENCES tasks(id), -- NEW: For subtasks
  
  -- Priority & Status
  priority INT DEFAULT 3,                 -- 1-4
  status VARCHAR(50) DEFAULT 'todo',      -- todo|in-progress|done|blocked|waiting
  eisenhower VARCHAR(2),                  -- Q1|Q2|Q3|Q4
  
  -- Finance
  billable BOOLEAN DEFAULT FALSE,         -- NEW
  hourlyRate DECIMAL(10,2),               -- NEW
  
  -- AI
  suggestedTime TIMESTAMP,                -- NEW: AI suggestion
  aiNotes TEXT,                           -- NEW
  
  completedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP,
  deletedAt TIMESTAMP,
  
  INDEX idx_user_date (userId, dueDate),
  INDEX idx_user_status (userId, status),
  INDEX idx_start_date (userId, startDate)
);

-- Task Tags
CREATE TABLE task_tags (
  id UUID PRIMARY KEY,
  taskId UUID REFERENCES tasks(id),
  tag VARCHAR(100),
  createdAt TIMESTAMP
);

-- Task Dependencies (NEW)
CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY,
  taskId UUID REFERENCES tasks(id),       -- Task that depends
  blockedByTaskId UUID REFERENCES tasks(id), -- Task that blocks
  createdAt TIMESTAMP
);

-- Pomodoro Sessions
CREATE TABLE pomodoro_sessions (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES users(id),
  taskId UUID REFERENCES tasks(id),
  duration INT DEFAULT 25,
  focusTime INT,
  completed BOOLEAN,
  distractionCount INT DEFAULT 0,
  hourlyRate DECIMAL(10,2),               -- NEW
  moneyEarned DECIMAL(10,2),              -- NEW
  createdAt TIMESTAMP DEFAULT NOW(),
  completedAt TIMESTAMP
);

-- Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(50),
  date DATE,
  notes TEXT,
  taskId UUID REFERENCES tasks(id),      -- NEW: Link to task
  createdAt TIMESTAMP DEFAULT NOW(),
  deletedAt TIMESTAMP
);

-- Incomes
CREATE TABLE incomes (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  source VARCHAR(100),
  date DATE,
  recurring BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW(),
  deletedAt TIMESTAMP
);

-- Income-Task Links (NEW)
CREATE TABLE income_tasks (
  incomeId UUID REFERENCES incomes(id),
  taskId UUID REFERENCES tasks(id),
  PRIMARY KEY (incomeId, taskId)
);

-- Alarms
CREATE TABLE alarms (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES users(id),
  taskId UUID REFERENCES tasks(id),
  type VARCHAR(50),                      -- budget_alert|task_reminder|habit_reminder
  message TEXT,
  scheduledTime TIMESTAMP,
  triggered BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### 5.2 NEW Tables (V2 Features)

```sql
-- Habits (NEW)
CREATE TABLE habits (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  frequency VARCHAR(50),                 -- daily|weekly|custom
  targetDays INT,                        -- 7 for weekly, or specific count
  color VARCHAR(7),
  icon VARCHAR(50),
  category VARCHAR(50),                  -- health|learn|financial|personal
  reminderTime TIME,
  startDate DATE,
  goalDate DATE,
  createdAt TIMESTAMP DEFAULT NOW(),
  deletedAt TIMESTAMP,
  INDEX idx_user_date (userId, startDate)
);

-- Habit Logs (NEW)
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY,
  habitId UUID REFERENCES habits(id),
  date DATE,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  completedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  INDEX idx_habit_date (habitId, date)
);

-- Habit Stats (NEW - for performance)
CREATE TABLE habit_stats (
  habitId UUID PRIMARY KEY REFERENCES habits(id),
  currentStreak INT DEFAULT 0,
  longestStreak INT DEFAULT 0,
  totalCompleted INT DEFAULT 0,
  completionRate DECIMAL(5,2),
  lastLogDate DATE,
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Boards (Kanban - NEW)
CREATE TABLE boards (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES users(id),
  name VARCHAR(255),
  description TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  deletedAt TIMESTAMP
);

-- Board Columns (NEW)
CREATE TABLE board_columns (
  id UUID PRIMARY KEY,
  boardId UUID REFERENCES boards(id),
  name VARCHAR(255),
  position INT,                          -- Order
  createdAt TIMESTAMP DEFAULT NOW(),
  deletedAt TIMESTAMP
);

-- Task Board Links (NEW)
CREATE TABLE task_board_links (
  taskId UUID REFERENCES tasks(id),
  boardId UUID REFERENCES boards(id),
  columnId UUID REFERENCES board_columns(id),
  position INT,                          -- Order within column
  PRIMARY KEY (taskId, boardId)
);

-- Recurring Patterns (NEW)
CREATE TABLE recurring_patterns (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES users(id),
  frequency VARCHAR(50),                 -- daily|weekly|monthly
  interval INT DEFAULT 1,
  weekDays VARCHAR(50),                  -- "1,3,5" for Mon/Wed/Fri
  dayOfMonth INT,                        -- For monthly
  endDate DATE,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- AI Suggestions (NEW)
CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES users(id),
  type VARCHAR(50),                      -- task|budget|habit
  title VARCHAR(255),
  description TEXT,
  actionable BOOLEAN,                    -- Can user act on this?
  dismissed BOOLEAN DEFAULT FALSE,
  confidence DECIMAL(3,2),               -- 0-1
  createdAt TIMESTAMP DEFAULT NOW(),
  dismissedAt TIMESTAMP
);

-- User Preferences (NEW)
CREATE TABLE user_preferences (
  userId UUID PRIMARY KEY REFERENCES users(id),
  pomodoroDuration INT DEFAULT 25,
  breakDuration INT DEFAULT 5,
  theme VARCHAR(20),                     -- light|dark|auto
  dateFormat VARCHAR(20),
  defaultProject UUID REFERENCES projects(id),
  budgetRule VARCHAR(50),                -- 50-30-20|custom
  notifyTaskReminder INT,                -- Minutes before
  notifyBudgetAlert INT,                 -- Percentage
  autoStartPomodoro BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP
);

-- Integration Tokens (NEW)
CREATE TABLE integrations (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES users(id),
  provider VARCHAR(50),                  -- google_calendar|notion|slack
  accessToken TEXT,
  refreshToken TEXT,
  tokenExpiry TIMESTAMP,
  status VARCHAR(20),                    -- connected|disconnected
  lastSync TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP
);
```

---

## 6. API ENDPOINTS

### 6.1 Authentication Endpoints

```
POST   /auth/register
POST   /auth/login
POST   /auth/google
POST   /auth/logout
POST   /auth/refresh-token
POST   /auth/forgot-password
POST   /auth/reset-password
```

### 6.2 Task Endpoints

```
-- CRUD
POST   /tasks                          // Create task
GET    /tasks                          // List (with filters)
GET    /tasks/:id                      // Get single
PUT    /tasks/:id                      // Update
DELETE /tasks/:id                      // Delete
PATCH  /tasks/:id/status               // Change status
PATCH  /tasks/:id/complete             // Mark done

-- Smart Lists
GET    /tasks/lists/today              // Today's tasks
GET    /tasks/lists/scheduled          // Scheduled
GET    /tasks/lists/someday            // Someday
GET    /tasks/lists/anytime            // Anytime
GET    /tasks/lists/waiting            // Waiting on others

-- Natural Language
POST   /tasks/parse-natural-language   // Parse text to task
POST   /tasks/voice-to-task            // Voice input

-- Subtasks
POST   /tasks/:id/subtasks             // Create subtask
GET    /tasks/:id/subtasks             // List subtasks
DELETE /tasks/:id/subtasks/:subId      // Delete subtask

-- Dependencies
POST   /tasks/:id/dependencies         // Add dependency
GET    /tasks/:id/blocked-by           // Show blockers
DELETE /tasks/:id/dependencies/:depId  // Remove dependency

-- Kanban
GET    /boards/:boardId                // Get board
POST   /tasks/:id/move                 // Move to column
```

### 6.3 Pomodoro Endpoints

```
POST   /pomodoro/start                 // Start session
POST   /pomodoro/:id/stop              // Stop session
GET    /pomodoro/history               // List sessions
GET    /pomodoro/stats                 // Statistics
```

### 6.4 Finance Endpoints

```
-- Expenses
POST   /expenses                       // Add expense
GET    /expenses                       // List
PUT    /expenses/:id                   // Update
DELETE /expenses/:id                   // Delete

-- Incomes
POST   /incomes                        // Add income
GET    /incomes                        // List
PUT    /incomes/:id                    // Update

-- Budget
GET    /budget/summary                 // 50/30/20 breakdown
PUT    /budget/rules                   // Update rules
GET    /budget/alerts                  // Alert history
```

### 6.5 Habit Endpoints (NEW)

```
POST   /habits                         // Create
GET    /habits                         // List
GET    /habits/:id                     // Get single
PUT    /habits/:id                     // Update
DELETE /habits/:id                     // Delete

POST   /habits/:id/log                 // Log completion
GET    /habits/:id/logs                // Get history
GET    /habits/:id/stats               // Statistics
GET    /habits/:id/progress            // Progress data
```

### 6.6 Calendar Endpoints (NEW)

```
GET    /calendar/month/:year/:month    // Month view
GET    /calendar/week/:year/:week      // Week view
GET    /calendar/day/:date             // Day view
GET    /calendar/habits/:habitId       // Habit calendar
```

### 6.7 Kanban Endpoints (NEW)

```
POST   /boards                         // Create board
GET    /boards                         // List boards
GET    /boards/:id                     // Get board
PUT    /boards/:id                     // Update board
DELETE /boards/:id                     // Delete board

POST   /boards/:id/columns             // Add column
PUT    /boards/:id/columns/:colId      // Update column
DELETE /boards/:id/columns/:colId      // Delete column
```

### 6.8 AI Endpoints (NEW)

```
GET    /ai/task-suggestions            // Suggest next task
GET    /ai/budget-insights             // Budget recommendations
GET    /ai/habit-insights              // Habit analysis
```

### 6.9 Dashboard Endpoints (NEW)

```
GET    /dashboard/daily                // Daily summary
GET    /dashboard/weekly               // Weekly report
GET    /dashboard/monthly              // Monthly report
GET    /dashboard/habits-summary       // Habits overview
```

### 6.10 Settings Endpoints

```
GET    /users/profile                  // Get profile
PUT    /users/profile                  // Update profile
GET    /users/preferences              // Get preferences
PUT    /users/preferences              // Update preferences
GET    /integrations                   // List integrations
POST   /integrations/connect           // Connect service
POST   /integrations/disconnect        // Disconnect service
POST   /export                         // Export data
```

---

## 7. TECHNOLOGY STACK

### 7.1 Web (Hiện tại — ✅ Hoàn thành)
```
Framework:     React 18 + Vite
State:         React Context (AppContext.jsx)
Styling:       CSS Variables + Inline Styles
Storage:       localStorage (sẽ migrate sang Supabase)
Deploy:        Vercel / Netlify
```

### 7.2 Mobile Native (Phase 2 — 🚧 Build tiếp theo)
```
Framework:     Expo (React Native) — Managed Workflow
Navigation:    @react-navigation/native + bottom-tabs + stack
Styling:       NativeWind (Tailwind cho React Native)
Storage local: @react-native-async-storage/async-storage
Animations:    react-native-reanimated
Audio:         expo-av (thay Web AudioContext)
Document:      expo-document-picker, expo-file-system
EPub reader:   react-native-epub-view
Icons:         lucide-react-native
```

### 7.3 Backend & Database (BaaS — dùng chung Web + Mobile)
```
Platform:      Supabase (PostgreSQL + Auth + Realtime + Storage)
Auth:          Supabase Auth (Email + Google OAuth)
Database:      PostgreSQL (Supabase managed)
Realtime:      Supabase Realtime Subscriptions
File storage:  Cloudflare R2 (sách ePub — rẻ, free egress)
SDK:           @supabase/supabase-js
LLM (tương lai): Claude API (Anthropic)
```

### 7.4 DevOps
```
Web deploy:    Vercel (auto từ GitHub)
Mobile build:  EAS Build (Expo Application Services)
App stores:    Google Play + Apple App Store (qua EAS)
Monitoring:    Sentry
Analytics:     PostHog
Env:           .env (Vercel) + EAS Secrets (mobile)
```

### 7.5 Code Sharing Strategy
```
d:\mylife\              ← Web (React + Vite) — giữ nguyên
  src/
    context/AppContext.jsx   ← logic tái dùng ~80%
    utils/nlp.js             ← tái dùng 100%

d:\mylife-mobile\       ← Native (Expo) — project mới
  src/
    context/AppContext.js    ← copy + đổi localStorage → AsyncStorage
    utils/nlp.js             ← copy nguyên xi
    screens/                 ← viết mới (React Native)
    components/              ← viết mới (nhỏ hơn, tách từ TaskManager)
```

---

## 8. DEVELOPMENT ROADMAP

### Phase 1: Web MVP ✅ HOÀN THÀNH

- ✅ Task Manager (CRUD, NLP tiếng Việt, subtasks, timer đếm lên)
- ✅ Eisenhower Matrix view
- ✅ Smart Lists (Today / Someday / Anytime / Scheduled)
- ✅ Pomodoro — count-up timer, ghi nhận actual time
- ✅ Auto-cascade shift: task sau tự đẩy giờ khi task trước hoàn thành
- ✅ No-overlap enforcement: không bao giờ có 2 task lồng giờ nhau
- ✅ Calendar tích hợp (ngày / tuần / tháng)
- ✅ Finance: Expense/Income tracker, 50/30/20 budget
- ✅ Habit Tracker với streak
- ✅ Book Manager (metadata, danh sách)
- ✅ Dashboard tổng hợp
- ✅ Dark/Light theme

---

### Phase 2: Native App 🚧 ĐANG BUILD

#### Giai đoạn 2.1 — Setup & Backend (Tuần 1-2)
- [ ] Tạo Supabase project (auth, database, storage)
- [ ] Thiết kế và tạo các bảng PostgreSQL (xem Section 5)
- [ ] Tạo Expo project (`d:\mylife-mobile`)
- [ ] Cài đặt dependencies (React Navigation, NativeWind, Supabase SDK)
- [ ] Auth screens (Login / Register / Google OAuth)
- [ ] Migration AppContext: localStorage → Supabase + AsyncStorage

#### Giai đoạn 2.2 — Planning Module (Tuần 3-4) ⭐ ƯU TIÊN CAO
- [ ] Bottom tab navigation (Tasks / Calendar / Finance / Habits / Books)
- [ ] Task list screen (Today / Scheduled / Matrix views)
- [ ] Task detail screen (subtasks, timer, eisenhower)
- [ ] Add task via NLP (reuse `nlp.js`)
- [ ] Pomodoro timer screen (count-up, pause, stop & log)
- [ ] Auto-cascade shift (reuse logic từ web)
- [ ] Calendar screen (ngày / tuần)

#### Giai đoạn 2.3 — Finance + Habits (Tuần 5)
- [ ] Finance screen (expense/income, 50/30/20 chart)
- [ ] Habit tracker screen (log, streak, calendar)
- [ ] Dashboard screen

#### Giai đoạn 2.4 — Book Reader (Tuần 6-7)
- [ ] Book list screen (fetch từ Supabase — do admin thêm)
- [ ] ePub reader (react-native-epub-view)
- [ ] Highlights & notes lưu vào Supabase
- [ ] Reading progress tracking
- [ ] *(Download offline — để sau)*

#### Giai đoạn 2.5 — Polish & Launch (Tuần 8)
- [ ] Realtime sync giữa web và mobile (Supabase Realtime)
- [ ] Offline mode cơ bản (AsyncStorage cache)
- [ ] Push notifications (expo-notifications)
- [ ] Build APK/IPA qua EAS Build
- [ ] Submit Google Play (Android trước)
- [ ] Submit App Store (iOS)

---

### Phase 3: Scale & Collaborate (Months 5-8)

**Integrations**
- Google Calendar sync
- Notion export
- Slack notifications

**Team Collaboration**
- Share tasks/budgets
- Comments & @mentions

**Advanced Analytics**
- Predictive insights
- Machine learning patterns
- "Best work hours" analysis

**AI Features**
- Voice-to-Task (tiếng Việt)
- AI Task Suggestions (Claude API)
- Smart Budget Recommendations

---

## 9. MONETIZATION STRATEGY

### Freemium Model (Same as v1)

**Free Tier:**
- 10 tasks per month
- 5 habits
- Basic finance tracking
- 50 expense entries/month
- Limited exports (CSV only)
- No Kanban/Board view
- No AI suggestions

**Starter ($5/month or $50/year):**
- Unlimited tasks
- 20 habits
- Basic Pomodoro
- 200 expense entries/month
- Calendar views
- Kanban board
- Export (CSV, PDF)

**Pro ($12/month or $120/year):**
- Everything in Starter
- AI task suggestions
- Budget AI insights
- Advanced analytics
- Voice-to-task
- Natural language parsing
- Priority support
- 2 GB export limit

**Business ($25/month or $250/year):**
- Everything in Pro
- Team collaboration (3 members)
- Google Calendar sync
- Notion export
- Slack integration
- Custom categories
- Advanced reporting
- API access

---

## 10. SUCCESS METRICS

### Phase 1 Goals (End of Week 10)

| Metric | Target | Rationale |
|--------|--------|-----------|
| Users | 500+ | Early adopters, founders |
| DAU | 100+ | Daily active engagement |
| Feature adoption | 70%+ | Users trying main features |
| Rating | 4.5+ | Product quality |
| Churn | <5% | Retention |
| Premium conversion | 15%+ | Monetization |

### Phase 2 Goals (Month 6)

| Metric | Target |
|--------|--------|
| Users | 10,000+ |
| DAU | 2,000+ |
| Premium users | 1,500+ |
| MRR | $8,000+ |
| NPS | 50+ |

---

## APPENDICES

### A. Glossary

- **Pomodoro**: 25-minute focused work session
- **Eisenhower Matrix**: 2x2 priority grid (Urgent/Important)
- **GTD**: Getting Things Done methodology
- **50/30/20**: Budget rule (50% needs, 30% wants, 20% savings)
- **Streak**: Consecutive days habit completed
- **Smart List**: Auto-filtered task list based on criteria
- **Kanban**: Visual task board (TODO→IN PROGRESS→DONE)

### B. User Journey Example: Lương (Solopreneur)

**Day 1: Signup**
```
1. Visits timeflow.io
2. Signs up with email
3. Completes 7-step onboarding
4. Sets hourly rate ($50)
5. Sees empty dashboard
```

**Day 2: First Task**
```
1. Says "Nộp báo cáo thứ Sáu 3 chiều"
2. App parses → Task created
3. Starts Pomodoro (25 min)
4. After 2 sessions → 2 hours done
5. Dashboard shows "$100 earned"
```

**Week 1:**
```
- Created 5 tasks via voice
- Completed Pomodoro 8 times (4 hours)
- Tracked $500 income, $120 expenses
- Set 3 habits
- Sees "You're 40% through weekly productivity goal"
```

**Month 1:**
```
- Created 50 tasks (all via voice/NLP)
- Tracked $3,200 income, $800 expenses
- 90% habit completion
- Earned insights: "Best work hours: 9-11am"
- Converted to Pro ($12/month)
```

### C. Competitive Advantages

| vs Todoist | vs TickTick | vs Things 3 | vs Microsoft |
|-----------|-----------|-----------|------------|
| + Finance module | + Finance | + Finance | + Finance |
| + Habits | - | + GTD philosophy | + AI features |
| + Pomodoro earnings | + Bilingual | - Multi-platform | - Detailed habits |
| + Vietnamese NLP | - | - | - Voice-to-task |
| + Lower price | = | - Subscription | = |

---

**Document Status**: 🚧 Phase 2 — Native App In Progress
**Last Review**: June 2, 2026
**Next Review**: After Phase 2.1 (Supabase + Expo setup) completion

### Quick Reference — Bắt đầu Native App

```
Bước 1: Tạo Supabase project tại supabase.com
Bước 2: npx create-expo-app mylife-mobile --template blank-typescript
Bước 3: Copy AppContext.jsx + utils/nlp.js sang mobile project
Bước 4: Đổi localStorage → AsyncStorage, alert() → Alert.alert()
Bước 5: Build màn hình Tasks trước (ưu tiên cao nhất)
```

---

**Questions or feedback?** Open discussion in #product-updates

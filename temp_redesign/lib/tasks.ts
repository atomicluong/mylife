export type Priority = "thap" | "trung-binh" | "cao"
export type QuadrantId = "q1" | "q2" | "q3" | "q4"

export type Task = {
  id: string
  title: string
  quadrant: QuadrantId
  start: string
  end: string
  date: string
  weather: { temp: number; condition: "sun" | "cloud" | "rain" | "storm" }
  assignee: string
  priority: Priority
  totalSteps: number
  doneSteps: number
  completed: boolean
}

export const quadrants: Record<
  QuadrantId,
  {
    id: QuadrantId
    code: string
    title: string
    action: string
    accent: string // tailwind text/border color helper key
  }
> = {
  q1: {
    id: "q1",
    code: "Q1",
    title: "Khẩn cấp & Quan trọng",
    action: "Làm ngay",
    accent: "red",
  },
  q2: {
    id: "q2",
    code: "Q2",
    title: "Quan trọng nhưng không khẩn cấp",
    action: "Lên kế hoạch",
    accent: "blue",
  },
  q3: {
    id: "q3",
    code: "Q3",
    title: "Khẩn cấp nhưng không quan trọng",
    action: "Ủy thác",
    accent: "amber",
  },
  q4: {
    id: "q4",
    code: "Q4",
    title: "Không khẩn cấp & không quan trọng",
    action: "Loại bỏ",
    accent: "emerald",
  },
}

export const priorityLabel: Record<Priority, string> = {
  thap: "Thấp",
  "trung-binh": "Trung bình",
  cao: "Ưu tiên cao",
}

export const initialTasks: Task[] = [
  {
    id: "t1",
    title: "Thiết kế lại menu MC Trúc Bạch",
    quadrant: "q1",
    start: "00:18",
    end: "04:18",
    date: "2026-06-04",
    weather: { temp: 29, condition: "storm" },
    assignee: "Mc",
    priority: "thap",
    totalSteps: 8,
    doneSteps: 0,
    completed: false,
  },
  {
    id: "t2",
    title: "Lên các set chạy quảng cáo cho MC",
    quadrant: "q1",
    start: "04:23",
    end: "05:23",
    date: "2026-06-04",
    weather: { temp: 26, condition: "rain" },
    assignee: "Mc",
    priority: "cao",
    totalSteps: 4,
    doneSteps: 1,
    completed: false,
  },
  {
    id: "t3",
    title: "Mini app và xây dựng chương trình tiếp thị liên kết",
    quadrant: "q1",
    start: "19:33",
    end: "21:03",
    date: "2026-06-04",
    weather: { temp: 26, condition: "rain" },
    assignee: "Mc",
    priority: "cao",
    totalSteps: 3,
    doneSteps: 0,
    completed: false,
  },
  {
    id: "t4",
    title: "Hoàn thiện phần mềm quản lý để đưa vào vận hành",
    quadrant: "q1",
    start: "21:08",
    end: "22:08",
    date: "2026-06-04",
    weather: { temp: 26, condition: "cloud" },
    assignee: "Mc",
    priority: "cao",
    totalSteps: 1,
    doneSteps: 0,
    completed: false,
  },
  {
    id: "t5",
    title: "Nghiên cứu đối thủ và xu hướng thị trường F&B",
    quadrant: "q2",
    start: "09:00",
    end: "10:30",
    date: "2026-06-04",
    weather: { temp: 27, condition: "sun" },
    assignee: "Mc",
    priority: "trung-binh",
    totalSteps: 5,
    doneSteps: 2,
    completed: false,
  },
  {
    id: "t6",
    title: "Đào tạo nhân sự pha chế chi nhánh mới",
    quadrant: "q2",
    start: "14:00",
    end: "16:00",
    date: "2026-06-04",
    weather: { temp: 28, condition: "cloud" },
    assignee: "Mc",
    priority: "thap",
    totalSteps: 6,
    doneSteps: 6,
    completed: true,
  },
  {
    id: "t7",
    title: "Trả lời tin nhắn khách hàng trên fanpage",
    quadrant: "q3",
    start: "08:00",
    end: "08:30",
    date: "2026-06-04",
    weather: { temp: 26, condition: "sun" },
    assignee: "Mc",
    priority: "trung-binh",
    totalSteps: 2,
    doneSteps: 1,
    completed: false,
  },
  {
    id: "t8",
    title: "Lướt xem feed cảm hứng thiết kế",
    quadrant: "q4",
    start: "12:30",
    end: "13:00",
    date: "2026-06-04",
    weather: { temp: 27, condition: "sun" },
    assignee: "Mc",
    priority: "thap",
    totalSteps: 1,
    doneSteps: 0,
    completed: false,
  },
]

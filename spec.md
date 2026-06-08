# 📋 TIMEFLOW SUPER APP - PRODUCT SPECIFICATION DOCUMENT (SPEC.MD)

**Version:** 3.0 (Lifestyle Super App Specification)  
**Last Updated:** June 2, 2026  
**Status:** In Progress & Refining  
**Author:** Antigravity (AI Architect) & Lương (Solopreneur)

---

## 📑 MỤC LỤC

0. [Tình trạng Hiện tại & Tiến độ thực tế (Current Status)](#0-tinh-trang-hien-tai--tien-do-thuc-te-current-status)
1. [Tổng quan dự án (Executive Summary)](#1-tong-quan-du-an-executive-summary)
2. [Tầm nhìn & Sứ mệnh (Vision & Mission)](#2-tam-nhin--su-menh-vision--mission)
3. [Kiến trúc Tính năng chi tiết (Feature Architecture)](#3-kien-truc-tinh-nang-chi-tiet-feature-architecture)
4. [Thiết kế Thuật toán & Logic xử lý (Algorithm & Logic Design)](#4-thiet-ke-thuat-toan--logic-xu-ly-algorithm--logic-design)
5. [Cơ sở dữ liệu mở rộng (Extended Database Schema)](#5-co-so-du-lieu-mo-rong-extended-database-schema)
6. [Hệ thống Trợ lý AI & Quy trình thực thi (AI Agents & Actions)](#6-he-thong-tro-ly-ai--quy-trinh-thuc-thi-ai-agents--actions)
7. [Tiềm năng Thương mại & Gọi vốn (Commercial & Fundraising Spec)](#7-tiem-nang-thuong-mai--goi-von-commercial--fundraising-spec)
8. [Lộ trình phát triển (Development Roadmap)](#8-lo-trinh-phat-trien-development-roadmap)

---

## 0. TÌNH TRẠNG HIỆN TẠI & TIẾN ĐỘ THỰC TẾ (CURRENT STATUS & PROGRESS)

### Công nghệ sử dụng (Technology Stack)
*   **Frontend**: React.js (Vite build system, Javascript ES6+).
*   **Styling**: Vanilla CSS thuần cho tối đa hiệu suất và khả năng tùy chỉnh. Thiết kế giao diện theo phong cách **glassmorphism** (kính mờ), dark mode mặc định, đáp ứng responsive.
*   **Icons**: Thư viện `lucide-react`.
*   **State Management & Storage**: React Context API (`AppContext.jsx`) kết nối và đồng bộ tự động với `localStorage` để hoạt động theo mô hình **Local-first** ngoại tuyến.

---

### Tiến độ triển khai thực tế (Implementation Checklist)

#### 1. Mô-đun Lập Kế hoạch & Lịch trình (Calendar & Planning) - [Hoàn thành 100%]
*   [x] **Lịch 3 chế độ xem**: Day timeline theo giờ, Week card, và Month grid.
*   [x] **Điều hướng thông minh**: Thêm nút "Quay lại" trên Day View giúp tự động ghi nhớ và quay lại chế độ xem Tháng/Tuần trước đó.
*   [x] **Thời tiết liên kết lịch trình**:
    *   Tích hợp hàm sinh dữ liệu thời tiết thực tế `getDayWeather(dateStr)`.
    *   Hiển thị nhiệt độ trung bình ngày và icon thời tiết trên Month View & Week View.
    *   Đưa dòng tóm tắt thời tiết hôm nay lên trên cùng của giao diện Ngày chi tiết.
    *   Tự động hiển thị các badge lưu ý trời mưa bên cạnh các nhiệm vụ trong khung giờ mưa dự báo.

#### 2. Mô-đun Quản lý Nhiệm vụ (TaskManager) - [Hoàn thành 100%]
*   [x] **Bộ phân tích NLP tiếng Việt**: Phân tách ngày, giờ, tag (#), dự án (@) chuẩn xác trong chuỗi văn bản.
*   [x] **Nhập liệu bằng giọng nói (Voice-to-Task)**: Tích hợp Web Speech API (nhận diện giọng nói tiếng Việt trực tiếp trên Chrome/Edge).
*   [x] **Thanh Thiết lập nhanh (Quick Settings)**:
    *   Tự động điền ngày hiện tại và giờ thực tế (đồng hồ đồng bộ) làm mặc định.
    *   Nhấp chuột vào ô ngày/giờ lập tức hiển thị bộ chọn hệ thống (`showPicker()`).
    *   Ô nhập thời lượng ước tính và hệ thống nút bấm chọn nhanh Ma trận Eisenhower `[Mặc định] [Q1] [Q2] [Q3] [Q4]` thay cho thẻ select.
    *   Cơ chế chống ghi đè: Chỉ áp dụng giá trị thiết lập nhanh nếu người dùng click thay đổi thủ công, đảm bảo NLP text vẫn phân tích đúng.

#### 3. Ma trận Eisenhower trực quan - [Hoàn thành 100%]
*   [x] Phân loại 4 ô phần tư với hiệu ứng kéo thả (drag-and-drop) đổi mức ưu tiên cho nhiệm vụ và bước phụ (subtasks).
*   [x] Nút bóng đèn (`Lightbulb`) ở góc phải mỗi ô phần tư ma trận. Hover chuột hiển thị tooltip mờ kính giải thích ngắn gọn, đầy đủ chức năng và lời khuyên hành động.

#### 4. Các mô-đun phụ trợ khác - [Đã có MVP Baseline]
*   [x] **Pomodoro**: Đồng hồ tập trung liên kết với Task/Subtask, tự động dịch chuyển giờ bắt đầu các task phía sau nếu thời gian thực tế hoàn thành lố giờ (overrun).
*   [x] **Tài chính**: Ghi chép thu chi 50/30/20, cảnh báo ngân sách khi vượt ngưỡng 75%, tính tiền kiếm được từ Pomodoro theo giờ.
*   [x] **Thói quen**: Tạo danh sách thói quen và streak ngày hoàn thành.
*   [x] **Trình đọc sách**: Trình đọc ePUB/PDF hỗ trợ hiệu ứng lật trang 3D, thay đổi cỡ chữ và màu nền sách cổ.

#### 5. Cơ chế Khởi chạy ứng dụng (Desktop Launcher) - [Hoàn thành 100%]
*   [x] Biểu tượng khởi chạy nhanh trên Desktop (Shortcut `TimeFlow.lnk` trỏ tới `run_timeflow.bat`).
*   [x] Tích hợp Edge App Mode mở ứng dụng dưới dạng cửa sổ độc lập (không thanh địa chỉ, giống Native App).
*   [x] Cấu hình đổi cache directory sang `.vite-cache` trong `vite.config.js` để giải quyết triệt để lỗi khóa tệp `EPERM` trên Windows.

#### 🚨 LỖI HIỆN TẠI (CRITICAL RUNTIME ISSUE)
*   [ ] **Lỗi màn hình trắng (Blank Page on Load)**: Khi khởi chạy ứng dụng (cả qua app mode lẫn trình duyệt thông thường), màn hình hiển thị hoàn toàn trắng.
    *   *Gợi ý chẩn đoán:* Cần kiểm tra bảng điều khiển Console của trình duyệt để tìm lỗi JS Runtime. Lỗi rất có thể nằm ở [AppContext.jsx](file:///d:/mylife/src/context/AppContext.jsx) do hàm `safeLoad` đọc dữ liệu từ `localStorage` nhưng chưa kiểm tra kiểu dữ liệu (chỉ check null/undefined mà không check `Array.isArray()`). Nếu dữ liệu cũ trong `localStorage` bị lưu sai định dạng (ví dụ `tf_tasks` là một object thay vì array), các hàm `.filter()` hay `.map()` ở các component (như `Dashboard.jsx`, `Sidebar.jsx`) sẽ bị crash và làm trắng trang.
    *   *Hướng xử lý:* Thêm kiểm tra kiểu dữ liệu trong `safeLoad` hoặc viết script xóa/reset `localStorage` để đưa ứng dụng về trạng thái ban đầu sạch sẽ.

---

## 1. TỔNG QUAN DỰ ÁN (EXECUTIVE SUMMARY)

**TimeFlow Super App** là siêu ứng dụng tích hợp "tất cả trong một" đóng vai trò làm **Hệ điều hành phong cách sống (Lifestyle OS)** cho mỗi cá nhân. Thay vì phân tán dữ liệu ở 5-6 app khác nhau, người dùng quản trị toàn bộ hoạt động hàng ngày chỉ tại một nơi duy nhất:
*   **Lập kế hoạch (Planning)**: Lịch trình tuần/tháng tích hợp thời tiết thông minh, tự động sắp xếp và dịch chuyển công việc (time-shifting) khi trễ hẹn.
*   **Lối sống & Sức khỏe (Lifestyle & Habits)**: Quản lý thói quen ăn uống, tập luyện, đọc sách và tích hợp trình đọc báo (News Reader) tự động tóm tắt tin tức bằng AI.
*   **Tài chính cá nhân (Personal Finance)**: Quản lý dòng tiền chi tiêu (quy tắc 50/30/20), theo dõi thời gian sinh tiền (time-to-money) liên kết trực tiếp với năng suất Pomodoro.
*   **Bộ não Trợ lý AI (Agentic AI Companion)**: Tự động tổng hợp báo cáo hành vi hàng tuần, đề xuất cải thiện lối sống và trực tiếp thay thế người dùng thực hiện các hành động thực tế (đặt xe Grab, thanh toán hóa đơn, lên lịch đi du lịch).

---

## 2. TẦM NHÌN & SỨ MỆNH (VISION & MISSION)

### Tầm nhìn (Vision)
*"Trở thành người bạn đồng hành số không thể thiếu mỗi ngày, giúp tối ưu hóa thời gian, cải thiện sức khỏe thể chất/tinh thần và nâng tầm tự do tài chính của thế hệ trí thức mới."*

### Giá trị độc bản (USPs)
1.  **Nhất quán dữ liệu**: Kết hợp công việc, tài chính và thói quen để AI đưa ra cái nhìn toàn diện (ví dụ: phát hiện làm việc quá sức làm giảm sức khỏe thể chất và tăng chi tiêu ăn ngoài).
2.  **Thời tiết theo giờ gắn liền lịch trình**: Ứng dụng duy nhất cảnh báo trực quan thời tiết ngay trên từng công việc (nhắc mang áo mưa lúc di chuyển).
3.  **Tự động sắp lịch thông minh (Auto-scheduling)**: Thuật toán tự tìm slot trống trên lịch để chèn thói quen và đẩy lùi công việc phía sau khi nhiệm vụ trước bị lố giờ.
4.  **AI Agent thực thi thực tế**: Không chỉ dừng lại ở chat và gợi ý, AI trực tiếp kết nối API để thay thế người dùng đặt Grab, thanh toán hóa đơn, đặt phòng.

---

## 3. KIẾN TRÚC TÍNH NĂNG CHI TIẾT (FEATURE ARCHITECTURE)

### Mô-đun A: Lập Kế Hoạch & Lịch Trình (Planning & Calendar)
*   **A1. Bộ nhập liệu NLP tiếng Việt nâng cao**:
    *   Phân tích câu tự nhiên tiếng Việt để trích xuất Ngày, Giờ, Dự án, Tags và chu kỳ lặp.
    *   Thanh **Thiết lập nhanh (Quick Settings)**: Hỗ trợ ô nhập Ngày, Giờ bắt đầu hiển thị đồng hồ trực quan, thời lượng dự kiến và các chip ma trận `[Q1] [Q2] [Q3] [Q4]`.
    *   *Click to show calendar/clock*: Nhấp bất kỳ đâu trên ô nhập sẽ mở ngay bộ chọn lịch/đồng hồ của hệ thống.
    *   *NLP-Override protection*: Chỉ khi người dùng thay đổi thủ công các trường thiết lập nhanh thì hệ thống mới ghi đè lên kết quả tự động của NLP.
*   **A2. Lịch trình Lồng ghép Thời tiết**:
    *   *Month & Week View*: Hiển thị nhiệt độ trung bình ngày kế bên icon thời tiết ở các thẻ ngày.
    *   *Day View (Timeline theo giờ)*: Dòng tóm tắt thời tiết hôm nay được đưa lên đầu trang (dưới tiêu đề).
    *   *Weather warning*: Tự động hiển thị badge cảnh báo (Ví dụ: 🌧️ *Trời sắp mưa, hãy mang áo mưa*) kế bên các nhiệm vụ diễn ra ngoài trời vào khung giờ có mưa dự báo.
*   **A3. Lịch Lịch trình & Nút điều hướng Quay lại**:
    *   Khi người dùng bấm vào xem chi tiết một ngày từ Lịch Tuần hoặc Lịch Tháng, giao diện Ngày chi tiết sẽ hiển thị nút "Quay lại" nổi bật, tự động đưa người dùng về đúng giao diện Month hoặc Week họ đã truy cập trước đó.

### Mô-đun B: Thói Quen & Lối Sống (Lifestyle & Habits)
*   **B1. Habit Tracker đa danh mục**:
    *   Quản lý thói quen theo 4 nhóm chính: **Sức khỏe/Ăn uống** (uống nước, đếm calo), **Thể thao** (gym, chạy bộ), **Trí tuệ** (đọc sách, học ngoại ngữ) và **Tài chính** (ghi chép chi tiêu).
*   **B2. Thuật toán chèn lịch tự động (Habit Time-blocking)**:
    *   Mỗi thói quen được khai báo thời lượng và khung giờ ưu tiên (Sáng/Chiều/Tối).
    *   Hệ thống quét lịch trình, tìm khoảng trống (free slot) thích hợp và tự chèn thói quen thành một nhiệm vụ thực tế trên Lịch biểu.
*   **B3. Trình đọc tin tức tích hợp AI (AI News Reader)**:
    *   Tích hợp bộ đọc RSS tin tức hàng ngày.
    *   AI tự động quét các bài báo mới thuộc lĩnh vực người dùng quan tâm, tóm tắt lại thành một bản tin ngắn gọn (Daily Briefing) gửi vào lúc 7:00 sáng mỗi ngày.

### Mô-đun C: Tài Chính & Dòng Tiền (Personal Finance)
*   **C1. Quản lý Thu/Chi liên kết công việc**:
    *   Phân chia chi tiêu theo quy tắc 50/30/20 (Thiết yếu - Sở thích - Tích lũy).
    *   Nhận diện cảnh báo tự động khi danh mục chi tiêu chạm mốc 75% ngân sách tháng.
*   **C2. Time-to-Money**:
    *   Liên kết trực tiếp thời gian chạy Pomodoro trên công việc với doanh thu thực tế (đặc biệt hữu dụng cho Freelancers tính công làm việc theo giờ).

### Mô-đun D: Bộ Não AI & Trợ Lý Thực Thi (Agentic AI Companion)
*   **D1. Báo cáo & Đề xuất AI định kỳ**:
    *   AI quét cơ sở dữ liệu về thói quen, công việc hoàn thành và chi tiêu tài chính để tổng hợp báo cáo hàng tuần.
    *   Đề xuất các phương án cải thiện: đổi giờ tập gym, cắt bớt ngân sách mua sắm, cảnh báo trì hoãn.
*   **D2. AI Action Agent (Thực thi dịch vụ)**:
    *   Hỗ trợ đặt xe Grab/Be khi lịch trình có việc cần di chuyển ngoài trời.
    *   Tự động gom hóa đơn và đề xuất thanh toán qua cổng điện tử khi đến hạn trên lịch.
    *   Tự lên lịch trình du lịch và đề xuất đặt vé máy bay/khách sạn qua Traveloka dựa trên ngân sách hiện có.

---

## 4. THIẾT KẾ THUẬT TOÁN & LOGIC XỬ LÝ (ALGORITHM & LOGIC DESIGN)

### Thuật toán Dịch chuyển thời gian khi bị trễ lịch (Task-Shifting Overrun)
Khi một nhiệm vụ đã hoàn thành có thời gian thực tế (`actualTime`) lớn hơn thời gian dự kiến (`timeEstimate`), thuật toán sẽ tự động dịch chuyển tất cả nhiệm vụ chưa hoàn thành tiếp theo trong ngày:

```
overrun = actualTime - timeEstimate
Nếu (overrun > 0) và (nhiệm vụ vừa xong có giờ cụ thể):
    Lấy danh sách các nhiệm vụ kế tiếp chưa hoàn thành trong ngày
    Với mỗi nhiệm vụ kế tiếp (t):
        Giờ_bắt_đầu_mới(t) = Giờ_bắt_đầu_cũ(t) + overrun
```

### Thuật toán Tự chèn thói quen vào Lịch (Habit Auto-blocking)
Thuật toán tìm kiếm khoảng trống đầu tiên không bị xung đột lịch trình để chèn thói quen:

```
busyIntervals = Lấy các khoảng bận [start_time, end_time] của các task trong ngày
Với mỗi thói quen (h) cần xếp lịch:
    Lấy khung giờ ưu tiên của h (Ví dụ: Sáng = 07:00 - 11:00)
    Tìm khoảng trống đầu tiên có độ dài >= h.duration mà không giao với busyIntervals
    Nếu tìm thấy:
        Tự động tạo Task mới đại diện cho thói quen đó tại thời điểm trống
```

---

## 5. CƠ SỞ DỮ LIỆU MỞ RỘNG (EXTENDED DATABASE SCHEMA)

Hệ thống lưu trữ sử dụng mô hình **Local-first** (lưu trữ IndexedDB/LocalStorage trên thiết bị và mã hóa đầu cuối khi đồng bộ cloud).

### Bảng Thói quen (`habits` - mở rộng)
```javascript
{
  id: UUID,
  userId: UUID,
  name: String,                   // "Đọc sách"
  description: String,
  frequency: "daily|weekly|custom",
  targetDays: Number,             // Số lần hoàn thành mục tiêu/tuần
  color: String,                  // Mã màu HEX
  icon: String,                   // Emoji đại diện
  category: "health|learn|financial|personal",
  duration: Number,               // Thời lượng thực hiện (phút) - MỚI
  preferredTimeSlot: String,      // "morning|afternoon|evening|flexible" - MỚI
  createdAt: Timestamp
}
```

### Bảng Nguồn tin tức (`news_feeds` - MỚI)
```javascript
{
  id: UUID,
  userId: UUID,
  title: String,
  url: String,                    // Link RSS feed
  category: String,               // "tech|business|health"
  createdAt: Timestamp
}
```

### Bảng Trợ lý AI hội thoại & Insight (`ai_insights` - MỚI)
```javascript
{
  id: UUID,
  userId: UUID,
  type: "weekly_report|lifestyle_tip|alert",
  content: String,                // Nội dung text/markdown do AI sinh ra
  read: Boolean,
  createdAt: Timestamp
}
```

---

## 6. HỆ THỐNG TRỢ LÝ AI & QUY TRÌNH THỰC THI (AI AGENTS & ACTIONS)

Để AI hoạt động chính xác và tránh rủi ro, hệ thống tuân thủ nghiêm ngặt mô hình **Human-in-the-loop (Người dùng phê duyệt cuối)**:

```
[Người dùng gõ: "đặt Grab đi gặp đối tác chiều nay"]
                   ↓
      [AI phân tích Lịch trình & Địa điểm]
                   ↓
[AI gọi API Grab lấy giá vé và lộ trình & chuẩn bị sẵn Bill thanh toán]
                   ↓
 [Giao diện hiện Thẻ xác nhận trực quan: "Đặt GrabCar đi lúc 14h, giá $5"]
                   ↓
 [Người dùng nhấn nút "Đồng ý" & Xác thực vân tay / Mã PIN]
                   ↓
      [Thực hiện giao dịch thực tế qua ví]
```

---

## 7. TIỀM NĂNG THƯƠNG MẠI & GỌI VỐN (COMMERCIAL & FUNDRAISING SPEC)

### Mô hình kinh doanh (Business Model)
1.  **SaaS Subscription**:
    *   **Gói Free**: Lập lịch cơ bản, 3 thói quen, quản lý chi tiêu thủ công.
    *   **Gói Premium ($8 - $15/tháng)**: Sử dụng NLP không giới hạn, tự động dịch chuyển lịch, tích hợp AI Insight hàng tuần và tóm tắt tin tức hàng sáng.
2.  **Affiliate & Transaction fees**:
    *   Thu 1-3% hoa hồng trên các giao dịch thanh toán hóa đơn, đặt xe, đặt khách sạn được thực hiện ngay trong ứng dụng.

### Lộ trình gọi vốn (Fundraising Targets)
*   **Vòng Angel ($100K - $250K)**: Phát triển MVP chạy mượt mà trên trình duyệt/mobile web, đạt 5,000 MAU.
*   **Vòng Seed ($1M - $2.5M)**: Tích hợp sâu API ngân hàng, Grab, các đối tác đặt phòng và mở rộng ra thị trường Đông Nam Á.

---

## 8. LỘ TRÌNH PHÁT TRIỂN (DEVELOPMENT ROADMAP)

*   **Tuần 1 - 2 (V2 Baseline Stability)**: Hoàn thiện tính năng lập lịch, thời tiết và thiết lập nhanh trong ô thêm nhiệm vụ (Đã triển khai hoàn tất!).
*   **Tuần 3 - 4 (Lifestyle & Habit Scheduling)**: Hoàn thiện mô-đun thói quen nâng cao, viết thuật toán tự chèn thói quen vào lịch biểu dựa trên khoảng trống.
*   **Tuần 5 - 6 (AI News Reader)**: Tích hợp RSS Reader và lõi AI Agent tóm tắt tin tức mỗi sáng.
*   **Tuần 7 - 8 (AI Brain & RAG Integration)**: Xây dựng hệ thống bộ nhớ dài hạn, tạo báo cáo tổng hợp thói quen, tài chính và năng suất hàng tuần bằng LLM.
*   **Tuần 9 - 10 (Action Agent Integration)**: Kết nối các cổng thanh toán và API đối tác (Stripe, Grab, Traveloka), hoàn thiện quy trình Human-in-the-loop để đặt xe và thanh toán hóa đơn thực tế.

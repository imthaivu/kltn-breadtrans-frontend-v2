# Frontend UI/UX Rules & Guidelines (BreadTrans V2)

> **Mục tiêu:** Tài liệu này quy định các chuẩn mực thiết kế giao diện (UI) và trải nghiệm người dùng (UX) cho BreadTrans Frontend V2. Tất cả các tính năng và component mới phải tuân thủ nghiêm ngặt các quy tắc này.

## 1. Hệ thống Màu sắc (Milu Theme)
Dự án sử dụng bộ màu đặc trưng "Milu", mang lại cảm giác năng động, trẻ trung và thân thiện, rất phù hợp với môi trường e-learning.

- **Primary Colors:** Sử dụng các tông màu ấm (Cam/Vàng) hoặc màu thương hiệu đặc trưng để làm nổi bật các nút bấm chính (Call-to-Action) và các yếu tố quan trọng.
- **Secondary/Accent Colors:** Các tông màu phụ trợ để phân biệt các trạng thái (Thành công - Xanh lá, Cảnh báo - Vàng, Lỗi - Đỏ).
- **Backgrounds:** Sử dụng nền trắng hoặc xám nhạt (off-white) để tôn lên nội dung bài học. Đảm bảo độ tương phản (Contrast) đạt chuẩn WCAG.

## 2. Animation & Chuyển động (Framer Motion)
Trải nghiệm học tập cần được "Trò chơi hóa" (Gamified) thông qua các chuyển động mượt mà.

- **Micro-interactions:** Mọi nút bấm (Buttons), thẻ (Cards), và danh sách (List items) đều phải có hiệu ứng `hover` (phóng to nhẹ, đổi màu nền, đổ bóng) và `tap` (lõm xuống) sử dụng Framer Motion.
- **Page Transitions:** Chuyển đổi giữa các trang phải có animation (Fade-in, Slide-in) mượt mà để tránh cảm giác khựng/đứt gãy.
- **Phản hồi ngay lập tức (Immediate Feedback):** Khi hoàn thành bài tập, nhận được Bánh mì (Currency), hoặc trả lời đúng/sai, bắt buộc phải có hiệu ứng rung lắc (shake) hoặc pháo hoa/hạt (particles) để kích thích thị giác.

## 3. Bố cục & Responsive (Mobile-First)
- **Mobile-First Design:** Giao diện phải được thiết kế và kiểm tra trên màn hình điện thoại (Mobile) đầu tiên, sau đó mới mở rộng ra Tablet và Desktop.
- **Thao tác ngón tay (Touch targets):** Các nút bấm trên màn hình nhỏ phải có kích thước tối thiểu `44x44px` để dễ dàng chạm bằng ngón tay.
- **Giao diện học tập (Study Screens):** Màn hình làm bài (Quiz, Flashcard, Speaking) phải tối giản, loại bỏ Header/Footer không cần thiết (chỉ để lại nút Thoát/Quay lại) nhằm giúp học viên tập trung 100% vào bài học.

## 4. Typography & Icons
- **Font chữ:** Sử dụng font chữ hiện đại (như Inter, Roboto, hoặc Nunito) dễ đọc, kích thước chữ tối thiểu cho bài đọc là `16px`.
- **Icons:** Sử dụng bộ icon đồng nhất (Lucide React hoặc React Icons). Icon phải có ý nghĩa rõ ràng, kết hợp với text label nếu chức năng không quá phổ biến.

## 5. Quy tắc Code & Component
- Tái sử dụng tối đa các component trong thư mục `components/ui/` (Buttons, Modals, Inputs). Không tự ý viết CSS tay (inline styles) hoặc class Tailwind tuỳ tiện cho các element phổ biến.
- Các state quản lý UI (như Mở/Đóng Modal) ưu tiên dùng cục bộ (useState) thay vì nhét vào Global State (Zustand) trừ khi cần chia sẻ giữa nhiều modules.
- **KHÔNG sử dụng placeholder:** Khi đang tải dữ liệu (Loading), phải sử dụng **Skeleton Loaders** có animation thay vì màn hình trắng hoặc chữ "Loading...".

---
*Tất cả AI Agent khi code frontend phải đọc file này và thiết kế giao diện sao cho người dùng phải thốt lên "WOW!" ở cái nhìn đầu tiên.*

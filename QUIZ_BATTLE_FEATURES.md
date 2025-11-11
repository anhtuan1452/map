# 🎮 Quiz Battle - Tính năng mới

## ✨ Các tính năng đã thêm

### 1. 🎯 Theo dõi tiến độ câu hỏi
- **Điều hướng câu hỏi**: Hiển thị các nút số (1, 2, 3...) cho tất cả câu hỏi
  - Xám: Câu chưa trả lời
  - Xanh: Câu trả lời đúng
  - Đỏ: Câu trả lời sai
  - Viền trắng: Câu hỏi hiện tại
- **Click để chuyển**: Nhấp vào số bất kỳ để chuyển đến câu hỏi đó
- **Nút "Tiếp tục"**: Tự động nhảy đến câu hỏi chưa trả lời tiếp theo

### 2. 🏆 Màn hình hoàn thành
Khi học sinh hoàn thành tất cả câu hỏi hoặc hết thời gian:
- **Thống kê chi tiết**:
  - Hạng cuối cùng (#1, #2, ...)
  - Số câu đúng/tổng số câu
  - Độ chính xác (%)
  - Tổng XP kiếm được
- **Bảng xếp hạng cuối**: Thứ hạng của tất cả người chơi
- **Ghi chú cho giáo viên**: Nhắc nhở rằng battle chỉ để xếp hạng, không tự động cộng điểm

### 3. 👨‍🏫 Quyền Admin/Giáo viên

#### Kết thúc battle sớm
- **Nút "Kết thúc Battle"**: Xuất hiện khi:
  - User là admin hoặc staff (giáo viên)
  - Battle đang trong trạng thái `in_progress`
- **Xác nhận**: Hỏi trước khi kết thúc
- **Tự động chuyển**: Chuyển battle sang trạng thái `completed`

#### Xem kết quả battle đã kết thúc
- **Danh sách battles**: Phần "Đã kết thúc"
- **Nút "Xem kết quả"**: Click để xem màn hình hoàn thành
- **Dữ liệu đầy đủ**: 
  - Bảng xếp hạng cuối cùng
  - Số câu đúng của từng học sinh
  - Thời gian hoàn thành
  - Điểm XP (chỉ tham khảo)

### 4. 🎵 Nhạc nền gay cấn
- **Tự động phát**: Khi battle đang diễn ra
- **Nút điều khiển**: Góc dưới phải màn hình
  - Icon 🔊: Đang phát
  - Icon 🔇: Đã tắt
- **Web Audio API**: Nhạc được tạo bằng code, không cần file mp3
- **Hiệu ứng**:
  - Bass line mạnh mẽ
  - Chord căng thẳng
  - Tremolo effect
  - Nhịp đập (pulse) 800ms

### 5. 📊 Lưu ý về điểm số

#### ⚠️ QUAN TRỌNG
**Quiz Battle KHÔNG tự động cộng điểm vào tài khoản học sinh!**

#### Mục đích
- Battle chỉ dùng để **xếp hạng** học sinh
- Giúp giáo viên đánh giá nhanh năng lực tương đối

#### Cách cộng điểm
1. Sau khi battle kết thúc, vào phần "Đã kết thúc"
2. Click "Xem kết quả" của battle đó
3. Xem bảng xếp hạng cuối cùng:
   - Hạng 1: ...điểm
   - Hạng 2: ...điểm
   - Hạng 3: ...điểm
   - ...
4. **Cộng điểm thủ công** cho từng học sinh dựa trên thứ hạng

#### Ví dụ
```
Battle #5 - Kết quả:
#1: Nguyễn Văn A - 6/6 đúng - 150 XP
#2: Trần Thị B - 5/6 đúng - 125 XP
#3: Lê Văn C - 4/6 đúng - 100 XP
#4: Phạm Thị D - 3/6 đúng - 75 XP

Giáo viên cộng điểm:
- Nguyễn Văn A: +10 điểm (Nhất)
- Trần Thị B: +8 điểm (Nhì)
- Lê Văn C: +6 điểm (Ba)
- Phạm Thị D: +4 điểm (Tham gia)
```

## 🔧 API Endpoints mới

### 1. Kết thúc battle
```
POST /api/heritage/battles/{id}/end_battle/
Headers: Authorization: Bearer {token}

Response:
{
  "message": "Đã kết thúc battle thành công",
  "battle": {...}
}
```

**Yêu cầu**: User phải là `is_staff=True` hoặc `is_superuser=True`

## 🎨 Components mới

### 1. BattleMusic.tsx
Component phát nhạc nền sử dụng Web Audio API:
- Tự động phát khi battle active
- Nút mute/unmute ở góc dưới phải
- Volume: 15% (không quá to)

### 2. BattleArena.tsx (cập nhật)
- Thêm question navigator
- Thêm completion screen
- Thêm nút kết thúc battle (admin only)
- Tích hợp BattleMusic
- Check quyền admin

## 📱 Responsive Design
Tất cả tính năng mới đều hoạt động tốt trên:
- Desktop (>= 768px)
- Tablet (>= 640px)
- Mobile (< 640px)

## 🚀 Hướng dẫn sử dụng

### Cho Học sinh
1. Vào phần "Quiz Battle" từ menu
2. Chờ giáo viên tạo battle và thêm bạn vào
3. Click "Tham gia" khi battle bắt đầu
4. Trả lời các câu hỏi:
   - Xem tiến độ ở thanh số câu
   - Click số để xem lại câu đã trả lời
   - Dùng nút "Tiếp tục" để nhảy đến câu chưa làm
5. Xem kết quả cuối cùng và thứ hạng

### Cho Giáo viên
1. Tạo battle mới với danh sách học sinh
2. Click "Bắt đầu" để khởi động battle
3. Trong battle:
   - Theo dõi bảng xếp hạng real-time
   - Nếu cần kết thúc sớm: Click "Kết thúc Battle"
4. Sau khi kết thúc:
   - Vào phần "Đã kết thúc"
   - Click "Xem kết quả" của battle
   - Ghi lại bảng xếp hạng
   - Cộng điểm thủ công cho học sinh

## 🎯 Lợi ích

### Cho Học sinh
- ✅ Biết rõ tiến độ làm bài
- ✅ Có thể xem lại câu đã làm
- ✅ Không bỏ sót câu hỏi nào
- ✅ Thấy kết quả và thứ hạng ngay lập tức
- ✅ Nhạc nền tăng hứng thú

### Cho Giáo viên
- ✅ Kiểm soát hoàn toàn thời gian battle
- ✅ Kết thúc sớm khi cần thiết
- ✅ Xem lại kết quả bất cứ lúc nào
- ✅ Dễ dàng đánh giá và cộng điểm
- ✅ Dữ liệu lưu trữ vĩnh viễn

## 🔒 Bảo mật
- Chỉ admin/giáo viên mới kết thúc battle được
- Token được verify ở backend
- Unauthorized request sẽ bị từ chối với HTTP 403

## 📊 Dữ liệu lưu trữ
- Tất cả kết quả battle được lưu trong database
- Không bao giờ mất dữ liệu
- Có thể xem lại mọi lúc
- Export được nếu cần

---

**Phát triển bởi**: Quiz Battle Team
**Version**: 2.0
**Ngày cập nhật**: 3/11/2025

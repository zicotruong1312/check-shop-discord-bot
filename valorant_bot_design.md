# TÀI LIỆU THIẾT KẾ KỸ THUẬT: VALORANT SHOP DISCORD BOT

## 1. TỔNG QUAN HỆ THỐNG & CLOUD INFRASTRUCTURE (100% FREE TIER)
* **Ngôn ngữ cốt lõi:** Node.js (Lý tưởng cho bot Discord và xử lý I/O bất đồng bộ).
* **Thư viện Bot:** discord.js (phiên bản v14 mới nhất, sử dụng Slash Commands & Modals).
* **Cloud Database:** MongoDB Atlas (Gói M0 Free Cluster).
  * **Lý do:** Lưu trữ dữ liệu JSON cực nhanh, tương thích hoàn hảo với Node.js qua thư viện mongoose. Gói free cấp 512MB, dư sức lưu thông tin đăng nhập của 4000+ users.
* **Cloud Hosting:** Render (Web Service Free Tier).
  * **Lý do:** Tự động deploy khi push code lên GitHub.
* **Trick chống ngủ (Anti-Sleep):** Cấu hình Node.js chạy thêm một Express web server nhỏ (port 8080). Dùng dịch vụ UptimeRobot (Free) ping vào đường link web đó mỗi 5 phút một lần để bot không bao giờ bị tắt.

## 2. DANH SÁCH THƯ VIỆN (DEPENDENCIES) CẦN CÀI ĐẶT
* `discord.js`: Tương tác API Discord.
* `mongoose`: Kết nối và thao tác với MongoDB.
* `axios` / `node-fetch`: Gửi HTTP requests đến hệ thống của Riot Games.
* `canvas`: Render hình ảnh vũ khí và giá tiền thành một file ảnh duy nhất để gửi kèm Embed.
* `crypto` (built-in Node.js): Mã hóa AES-256-CBC hai chiều.
* `express`: Tạo dummy web server để UptimeRobot ping giữ mạng.
* `dotenv`: Quản lý biến môi trường (Bot Token, Mongo URI, AES Secret Key).

## 3. CƠ CHẾ BẢO MẬT & DATABASE SCHEMA
* **KHÔNG LƯU PASSWORD:** Bot tuyệt đối không lưu password dưới bất kỳ hình thức nào vào Database.
* **Cơ chế mã hóa:** Sử dụng thư viện crypto để mã hóa toàn bộ dữ liệu nhạy cảm trước khi lưu xuống MongoDB. Khóa giải mã (`ENCRYPTION_KEY`) chỉ lưu trong biến môi trường `.env` trên Render.
* **MongoDB Schema (Collection: UserSessions):**
  * `discordId` (String, Unique): ID của người dùng trên Discord.
  * `riotUsername` (String): Tên hiển thị (chỉ để log, không lưu tag).
  * `encryptedCookies` (String): Chuỗi Session Cookies (ssid) của Riot đã được mã hóa.
  * `updatedAt` (Date): Cập nhật tự động.

## 4. LUỒNG HOẠT ĐỘNG CHÍNH (WORKFLOW & LOGIC)
**A. Lệnh Đăng Nhập (`/login`) - Tương tác 1 lần/tháng:**
1. User gõ `/login` -> Bot mở một Discord Modal form yêu cầu nhập Username và Password.
2. Code nhận data từ Modal, ngay lập tức gửi request đến auth server của Riot.
3. Lấy toàn bộ dải Cookies trả về (đặc biệt là cookie `ssid` có hạn 30 ngày).
4. Mã hóa dải Cookies này bằng AES-256 và lưu vào MongoDB kèm `discordId`.
5. Xóa sạch (Clear) biến chứa Password khỏi bộ nhớ RAM ngay lập tức.
6. Gửi tin nhắn Ephemeral (chỉ user thấy): "Đăng nhập thành công, phiên bản lưu trữ an toàn trong 30 ngày".

**B. Lệnh Xem Shop (`/shop`) - Dùng hằng ngày:**
1. User gõ `/shop`.
2. Bot query MongoDB bằng `discordId`. Nếu không có, báo lỗi yêu cầu `/login`.
3. Nếu có data, bot giải mã `encryptedCookies`.
4. **Refresh Logic:** Gửi Cookie đã giải mã lên Riot để xin cấp Access Token và Entitlement Token mới nhất.
   * *Trường hợp Cookie hết hạn (sau ~30 ngày):* Trả về lỗi yêu cầu user `/login` lại.
5. Dùng 2 Token vừa lấy để gọi API Storefront của Riot, lấy danh sách 4 ID vũ khí đang bán.
6. Gọi API public (như valorant-api.com) để map ID sang Tên, Giá (VP), Icon độ hiếm, và Link ảnh vũ khí.

**C. Render Giao diện Hình ảnh (Sử dụng Canvas):**
1. Tải 4 hình ảnh súng từ URL về dạng buffer trong Node.js.
2. Dùng canvas tạo ra một file ảnh kích thước ngang. Phân chia bố cục làm 4 ô (hoặc 4 hàng ngang).
3. Vẽ (Draw) nền tối màu, chèn tên súng, giá tiền, icon độ hiếm và hình ảnh súng lên canvas cho thật căn chỉnh và điện ảnh (cinematic).
4. Xuất canvas thành attachment và gửi vào kênh chat thông qua một Discord Embed message (Mã màu viền: `#FF4655`).

## 5. QUẢN LÝ RỦI RO & RATE LIMIT
* Áp dụng cooldown cho lệnh `/shop` (Ví dụ: 1 phút / 1 user) bằng Collection của `discord.js` để tránh spam request gây cháy server Riot hoặc bị Cloudflare chặn IP của Render.
* Mọi tác vụ gọi API Riot cần bọc trong `try...catch` để bắt lỗi Timeout hoặc Authorization failed.

## 6. TĂNG CƯỜNG BẢO MẬT & CHỐNG RỦI RO TÀI KHOẢN (ADVANCED SECURITY)
**6.1. Chống mạo danh & Tránh ghi đè dữ liệu chéo (Anti-Spoofing)**
* **Định danh an toàn tuyệt đối:** Bot chỉ được phép lấy ID của người dùng thông qua object `interaction.user.id` được xác thực trực tiếp từ backend của Discord. Tuyệt đối không lấy định danh qua input text gõ tay, ngăn chặn hoàn toàn việc user A giả mạo user B để ghi đè session.
* **Cơ chế Override an toàn:** Khi một user gọi lệnh `/login` mới, hệ thống tự động tìm và xóa (drop) hoàn toàn document session cũ của `discordId` đó trong MongoDB rồi mới tạo mới, không để lại rác dữ liệu hay nguy cơ xung đột token.

**6.2. Ngăn chặn phá hoại tài khoản Riot (Action Limitation)**
* **Hardcode Endpoints:** Code của bot chỉ được phép chứa và gọi duy nhất các endpoint thuộc `Storefront API` (để lấy danh sách shop) và `Auth API` (để refresh token).
* **Vô hiệu hóa quyền ghi (Read-Only Mode):** Chặn đứng mọi khả năng tích hợp các API POST/PUT liên quan đến việc tiêu xài Valorant Points (VP), đổi tên, hay thay mật khẩu. Nếu hacker bằng cách nào đó chiếm được quyền điều khiển bot, chúng cũng chỉ có thể "xem" shop chứ tuyệt đối không thể phá hoại tài khoản game hay mua súng trái phép.

**6.3. Mã hóa đa tầng cấp cao (Dynamic IV Encryption)**
* **Không dùng mã hóa tĩnh:** Thay vì chỉ dùng thuật toán `AES-256` cơ bản, yêu cầu thêm một `IV` (Initialization Vector - Vector khởi tạo) ngẫu nhiên cho mỗi lần mã hóa Cookies của user.
* **Lưu trữ cặp khóa:** Lưu cả `IV` và `encryptedCookies` vào MongoDB. Điều này đảm bảo dù 2 user vô tình có chuỗi cookie giống nhau, dữ liệu lưu trong database vẫn là 2 chuỗi mã hóa hoàn toàn khác biệt. Chống lại triệt để các cuộc tấn công dò mật mã (Rainbow table attacks).

**6.4. Bảo vệ Bot & Server (Infrastructure Security)**
* **Bảo vệ Keys:** Discord Bot Token, AES Secret Key, và MongoDB URI bắt buộc phải lưu trong file môi trường `.env`. Cấu hình file `.gitignore` để tuyệt đối không đẩy `.env` lên GitHub public.
* **Giới hạn quyền Bot (Discord Intents):** Trên trang Discord Developer Portal, bot chỉ được cấp quyền `applications.commands` (để nhận Slash Commands). Tuyệt đối **không** bật `Message Content Intent` (quyền đọc nội dung tin nhắn chat) để bảo vệ quyền riêng tư tuyệt đối cho tin nhắn của 4000 thành viên trong server.
* **Phòng chống DDoS lệnh:** Kích hoạt cơ chế Exponential Backoff hoặc Rate Limiting nghiêm ngặt. Nếu có hiện tượng một user spam lệnh `/shop` liên tục bằng tool auto, bot tự động đưa user đó vào `Blacklist` tạm thời (chặn dùng bot 24h) để bảo vệ IP của host không bị Riot khóa.

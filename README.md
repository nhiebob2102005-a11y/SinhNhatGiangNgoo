# Thiệp sinh nhật — Little note

Trang sinh nhật dành cho Vũ Thị Giang, từ Dương Văn Việt. Giao diện sổ lưu niệm tông kem và đỏ, sử dụng HTML, CSS và JavaScript thuần.

## Chạy trang web

Chạy `npm start` (trên PowerShell có thể dùng `npm.cmd start`), sau đó mở http://localhost:3000. Có thể mở trực tiếp `index.html` hoặc đưa các tệp tĩnh lên GitHub Pages. Không cần cài thư viện.

## Nội dung và tương tác

- Mở thiệp, thổi/thắp lại nến và bật/tắt nhạc nền.
- Trình phát nhạc nổi với đĩa vinyl xoay theo trạng thái phát, thanh tua, âm lượng, tắt tiếng, phát lại từ đầu và lặp bài. Có nút thu gọn; mặc định thu gọn trên điện thoại. Giao diện nằm trong `music-player.css`, điều khiển bổ sung trong `music-player.js`.
- Mở lời chúc bằng tên người nhận và ngày/tháng sinh. Thay thông tin tại `letterRecipient` trong `script.js`. Đây là trò mở thiệp phía trình duyệt, không phải cơ chế bảo vệ dữ liệu riêng tư.
- Chạm ảnh để phóng to; dùng các nút mũi tên hoặc phím trái/phải để chuyển ảnh, Escape để đóng.
- Cào vé để nhận quà hoặc dùng nút “Mở quà ngay”, hỗ trợ bàn phím.
- Gửi điều ước lên bảng tin, có nút tạm dừng chuyển động.
- Hỗ trợ điện thoại và cài đặt giảm chuyển động của thiết bị.
- Cánh hoa và trái tim rơi nhiều lớp; sao/tim theo con trỏ, ảnh nghiêng 3D, chữ và họa tiết chuyển động, chuyển cảnh mở phong bì, dải lời chúc chạy liên tục và pháo giấy khi tương tác.
- Nút hiệu ứng ở góc dưới bên trái cho phép tắt/bật các chuyển động. Khi thiết bị bật giảm chuyển động hoặc tab bị ẩn, hiệu ứng tự giảm/dừng. Hiệu ứng canvas nằm trong `effects.js`, các animation CSS nằm trong `effects.css`.

## Thay nội dung

Nội dung và chú thích ảnh nằm trong `index.html`; ảnh ở `assets/Pictures/`, nhạc ở `assets/Music/`. Màu sắc và phông chữ khai báo ở đầu `styles.css`.

Điều ước chỉ được giữ trong bộ nhớ của lần mở trang hiện tại. Tải lại, đóng trang hoặc quay lại trang sẽ xóa các điều ước; người xem khác không thấy điều ước này. Không gửi API, không lưu vào localStorage, sessionStorage hay tệp dữ liệu. Máy chủ Node.js chỉ phục vụ các tệp tĩnh.

Google Fonts và hiệu ứng pháo giấy được tải từ CDN; các chức năng chính vẫn hoạt động nếu CDN không khả dụng, với phông chữ dự phòng.

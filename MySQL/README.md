# MySQL Cơ bản
- DROP TABLE IF EXISTS sensor_data;
	+ Mục đích: Lệnh này xóa bảng sensor_data nếu nó tồn tại trong cơ sở dữ liệu hiện tại.
	+ Giải thích: 
		+ DROP TABLE: Làm mất bảng và tất cả dữ liệu bên trong nó.
		+ IF EXISTS: Đảm bảo rằng lệnh không gây ra lỗi nếu bảng không tồn tại; thay vào đó, nó sẽ bỏ qua lệnh.

- CREATE TABLE sensor_data ( ... );
	+ Mục đích: Lệnh này tạo một bảng mới tên là sensor_data.
	+ Giải thích: 
		+ CREATE TABLE: Dùng để tạo một bảng mới trong cơ sở dữ liệu.
		+ Các cột trong bảng bao gồm: 
			+ id INT AUTO_INCREMENT PRIMARY KEY: Cột id là kiểu số nguyên (INT), tự động tăng (tức là mỗi khi có 
			bản ghi mới, giá trị sẽ tự động tăng lên 1) và là khóa chính (PRIMARY KEY), đảm bảo rằng mỗi giá trị 
			trong cột này là duy nhất.
			+ temperature FLOAT: Cột temperature là kiểu số thực (FLOAT) để lưu trữ giá trị nhiệt độ.
			+ humidity FLOAT: Cột humidity cũng là kiểu số thực để lưu trữ độ ẩm.
			+ light BIGINT: Cột light là kiểu số nguyên lớn (BIGINT) để lưu trữ các giá trị ánh sáng.
			+ timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP: Cột timestamp lưu trữ thời gian và có giá trị mặc định 
			là thời gian hiện tại khi bản ghi được chèn vào.
			
- SHOW TABLES;
	+ Mục đích: Lệnh này hiển thị tất cả các bảng có trong cơ sở dữ liệu hiện tại (esp32_data).
	+ Giải thích: Nó cho phép bạn xác nhận xem bảng sensor_data đã được tạo thành công hay chưa và xem các bảng khác nếu có.
	
- DESCRIBE sensor_data;
	+ Mục đích: Lệnh này cung cấp thông tin chi tiết về cấu trúc của bảng sensor_data.
	+ Giải thích: Nó hiển thị tên cột, kiểu dữ liệu, và thông tin khác như khóa chính và giá trị mặc định của các cột trong 
	bảng. Thông tin này giúp bạn hiểu rõ hơn về cấu trúc của bảng.

- SELECT * FROM sensor_data;
	+ Mục đích: Lệnh này truy vấn và hiển thị tất cả dữ liệu từ bảng sensor_data.
	+ Giải thích:
		+ SELECT *: * có nghĩa là chọn tất cả các cột.
		+ FROM sensor_data: Chỉ định rằng bạn muốn lấy dữ liệu từ bảng sensor_data.
		+ Kết quả trả về sẽ là tất cả các bản ghi (nếu có) trong bảng, giúp bạn kiểm tra nội dung của bảng.
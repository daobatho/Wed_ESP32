# command-line
## Lệnh khởi động Mosquitto broker
- Khởi động broker với cấu hình mặc định:
``` mosquitto```
- Khởi động broker với file cấu hình cụ thể:
```mosquitto -c <path_to_mosquitto.conf>```
	+ VD: ```mosquitto -c C:/mosquitto/mosquitto.conf ```
- Khởi động broker và hiển thị log chi tiết:
```mosquitto -v```

## Lệnh publish (gửi dữ liệu)
Lệnh này được sử dụng để gửi một tin nhắn đến một topic nhất định trên broker.

- Publish với tin nhắn cơ bản:
```mosquitto_pub -h <broker_address> -t <topic> -m <message>```
	+VD: ```mosquitto_pub -h localhost -t test/topic -m "Hello Mosquitto"```
- Publish với xác thực (username và password):
```mosquitto_pub -h <broker_address> -t <topic> -m <message> -u <username> -P <password>```
	+ VD:```mosquitto_pub -h localhost -t test/topic -m "Hello World" -u user1 -P password123```

## Lệnh subscribe (nhận dữ liệu)
Lệnh này được sử dụng để theo dõi (subscribe) một topic và nhận tin nhắn từ broker.

- Subscribe một topic cơ bản:
```mosquitto_sub -h <broker_address> -t <topic>```
	+ VD:```mosquitto_sub -h localhost -t test/topic```
- Subscribe với xác thực (username và password):
```mosquitto_sub -h <broker_address> -t <topic> -u <username> -P <password>```
	+ VD: ```mosquitto_sub -h localhost -t test/topic -u user1 -P password123```

## Lệnh quản lý user và password

- Tạo hoặc thêm user và password vào file:
```mosquitto_passwd -c <password_file> <username>```
	+ VD: ```mosquitto_passwd -c C:/mosquitto/passwordfile.txt user1```
- Thêm user mới vào file đã tồn tại:
```mosquitto_passwd -b <password_file> <username> <password>```
	+ VD:```mosquitto_passwd -b C:/mosquitto/passwordfile.txt user2 password123```
## Lệnh hỗ trợ (help)
- Bạn có thể sử dụng lệnh sau để xem thêm các tùy chọn hoặc tham số khác:
```mosquitto_pub --help
mosquitto_sub --help
mosquitto --help
```
## Thay đổi Port Khi Khởi Động Mosquitto
Khi khởi động Mosquitto từ Command Line, bạn có thể sử dụng tham số -p để chỉ định port mà Mosquitto sẽ lắng nghe.

1. Mở Command Prompt với quyền quản trị.
2. Khởi động Mosquitto với port mới:
	+ ``` "C:\Program Files\mosquitto\mosquitto.exe" -p <new_port>```
		+ Ví dụ, nếu bạn muốn Mosquitto lắng nghe trên port 8883, lệnh sẽ là:
		```"C:\Program Files\mosquitto\mosquitto.exe" -p 8883```
	
-Lệnh kiểm tra Port : netstat -an | find "LISTEN"
- đổi mk: mosquitto_passwd -c passwordfile admin

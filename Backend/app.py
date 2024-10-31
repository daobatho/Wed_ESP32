import paho.mqtt.client as mqtt
from flask import Flask, request, jsonify
import mysql.connector
import json
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Cho phép CORS để xử lý yêu cầu từ frontend

# Thông tin kết nối đến MQTT broker
MQTT_BROKER = "192.168.0.10"
MQTT_PORT = 1884
MQTT_TOPIC = "esp32/output"
MQTT_USERNAME = "Tho"
MQTT_PASSWORD = "1"

# Hàm callback khi kết nối thành công
def on_connect(client, userdata, flags, rc):
    print("Connected with result code " + str(rc))

# Khởi tạo MQTT client
mqtt_client = mqtt.Client()
mqtt_client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
mqtt_client.on_connect = on_connect
mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
mqtt_client.loop_start()

# Cấu hình MySQL cho cảm biến
db_sensor = mysql.connector.connect(
    host="localhost",
    user="root",
    password="12345",
    database="esp32_data"
)
cursor_sensor = db_sensor.cursor()

# Cấu hình MySQL cho devices (dữ liệu LED)
db_devices = mysql.connector.connect(
    host="localhost",
    user="root",
    password="12345",
    database="devices"
)
cursor_devices = db_devices.cursor()

# API điều khiển LED
@app.route('/api/control_led', methods=['POST'])
def control_led():
    try:
        # Lấy thông tin từ request gửi từ frontend
        data = request.json
        status = data.get("status", "on")
        print(f"Publishing to MQTT topic '{MQTT_TOPIC}' with message '{status}'")

        # Gửi lệnh điều khiển LED tới MQTT
        if status == "on":
            mqtt_client.publish(MQTT_TOPIC, "led_on")
        elif status == "off":
            mqtt_client.publish(MQTT_TOPIC, "led_off")
        else:
            return jsonify({"error": "Invalid status"}), 400
        
        # Lưu trạng thái LED vào cơ sở dữ liệu "devices"
        cursor_devices.execute("INSERT INTO led_status (led1_status, timestamp) VALUES (%s, NOW())", (1 if status == "on" else 0,))
        db_devices.commit()

        return jsonify({"message": f"LED turned {status}"})

    except Exception as e:
        print(f"Error occurred: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

# API lấy trạng thái LED mới nhất từ cơ sở dữ liệu "devices"
@app.route('/api/latest_led_status', methods=['GET'])
def get_latest_led_status():
    try:
        cursor_devices.execute("SELECT led1_status, timestamp FROM led_status ORDER BY id DESC LIMIT 1")
        result = cursor_devices.fetchone()
        if result:
            data = {"status": "on" if result[0] == 1 else "off", "timestamp": result[1].isoformat()}
            return jsonify(data)
        return jsonify({"error": "No data found"}), 404
    except Exception as e:
        print(f"Error occurred: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

# API lấy dữ liệu cảm biến mới nhất
@app.route('/api/latest_sensor_data', methods=['GET'])
def get_latest_sensor_data():
    try:
        cursor_sensor.execute("SELECT Temp, Humid, Light FROM sensor_data ORDER BY id DESC LIMIT 1")
        result = cursor_sensor.fetchone()
        if result:
            data = {"temperature": result[0], "humidity": result[1], "light": result[2]}
            return jsonify(data)
        return jsonify({"error": "No data found"}), 404
    except Exception as e:
        print(f"Error occurred: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

# API lấy lịch sử thiết bị
@app.route('/api/device_history', methods=['GET'])
def get_device_history():
    try:
        cursor_devices.execute("SELECT id, device, action, time FROM devices ORDER BY time DESC")
        results = cursor_devices.fetchall()
        device_history = []
        for row in results:
            device_history.append({
                "id": row[0],
                "device": row[1],
                "action": row[2],
                "time": row[3].strftime("%Y-%m-%d %H:%M:%S")
            })
        return jsonify(device_history)

    except Exception as e:
        print(f"Error occurred: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

# Hàm để xử lý dữ liệu cảm biến nhận được từ MQTT
def on_message(client, userdata, message):
    try:
        data = json.loads(message.payload.decode())
        temperature = data.get("temperature")
        humidity = data.get("humidity")
        light = data.get("light")

        # Lưu dữ liệu vào cơ sở dữ liệu
        if temperature is not None and humidity is not None and light is not None:
            cursor_sensor.execute("INSERT INTO sensor_data (Temp, Humid, Light) VALUES (%s, %s, %s)", (temperature, humidity, light))
            db_sensor.commit()

            print(f"Data saved: Temperature={temperature}, Humidity={humidity}, Light={light}")
        else:
            print("Received incomplete data")
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")  # In lỗi khi phân tích cú pháp JSON
    except Exception as e:
        print(f"Error occurred in on_message: {e}")

# Đăng ký hàm xử lý tin nhắn
mqtt_client.on_message = on_message
mqtt_client.subscribe("esp32/sensors")

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)

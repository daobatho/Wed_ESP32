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

# Cấu hình MySQL
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="12345",
    database="esp32_data"
)
cursor = db.cursor()

# API điều khiển LED
@app.route('/api/control_led', methods=['POST'])
def control_led():
    status = request.json.get("status", "on")
    print(f"Publishing to MQTT topic '{MQTT_TOPIC}' with message '{status}'")
    
    # Gửi lệnh điều khiển LED tới MQTT
    if status == "on":
        mqtt_client.publish(MQTT_TOPIC, "led_on")
    elif status == "off":
        mqtt_client.publish(MQTT_TOPIC, "led_off")
    else:
        return jsonify({"error": "Invalid status"}), 400

    return jsonify({"message": f"LED turned {status}"})

# API lấy dữ liệu cảm biến mới nhất
@app.route('/api/latest_sensor_data', methods=['GET'])
def get_latest_sensor_data():
    cursor.execute("SELECT temperature, humidity, light FROM sensor_data ORDER BY id DESC LIMIT 1")
    result = cursor.fetchone()
    if result:
        data = {"temperature": result[0], "humidity": result[1], "light": result[2]}
        return jsonify(data)
    return jsonify({"error": "No data found"}), 404

# Hàm để xử lý dữ liệu cảm biến nhận được từ MQTT
def on_message(client, userdata, message):
    data = json.loads(message.payload.decode())
    temperature = data.get("temperature")
    humidity = data.get("humidity")
    light = data.get("light")

    # Lưu dữ liệu vào cơ sở dữ liệu
    if temperature is not None and humidity is not None and light is not None:
        cursor.execute("INSERT INTO sensor_data (temperature, humidity, light) VALUES (%s, %s, %s)",
                       (temperature, humidity, light))
        db.commit()
        print(f"Data saved: Temperature={temperature}, Humidity={humidity}, Light={light}")
    else:
        print("Received incomplete data")

# Đăng ký hàm xử lý tin nhắn
mqtt_client.on_message = on_message
mqtt_client.subscribe("esp32/sensor_data")  # Subscribe to the topic where sensor data is published

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
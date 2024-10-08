from flask import Flask, request, jsonify
from paho.mqtt.client import Client
import mysql.connector
import json
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Cho phép CORS để xử lý yêu cầu từ frontend

# Cấu hình MySQL
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="12345",
    database="esp32_data"
)
cursor = db.cursor()

# Cấu hình MQTT
mqtt_client = Client("backend_client")
mqtt_broker = "192.168.135.86"
mqtt_port = 1884
mqtt_topic_sensor = "esp32/sensors"
mqtt_topic_control = "esp32/output"

def on_connect(client, userdata, flags, rc):
    print("Connected to MQTT broker with code " + str(rc))
    client.subscribe(mqtt_topic_sensor)

def on_message(client, userdata, msg):
    print(f"Received message: {msg.payload.decode()} on topic {msg.topic}")
    data = json.loads(msg.payload.decode())
    temperature = data.get("temperature")
    humidity = data.get("humidity")
    light = data.get("light")

    # Lưu vào MySQL
    query = "INSERT INTO sensor_data (temperature, humidity, light) VALUES (%s, %s, %s)"
    cursor.execute(query, (temperature, humidity, light))
    db.commit()

mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message
mqtt_client.connect(mqtt_broker, mqtt_port, 60)
mqtt_client.loop_start()

# API để gửi dữ liệu cảm biến mới nhất
@app.route('/api/latest_sensor_data', methods=['GET'])
def get_latest_sensor_data():
    cursor.execute("SELECT temperature, humidity, light FROM sensor_data ORDER BY id DESC LIMIT 1")
    result = cursor.fetchone()
    if result:
        data = {"temperature": result[0], "humidity": result[1], "light": result[2]}
        return jsonify(data)
    return jsonify({"error": "No data found"}), 404

# API điều khiển LED
@app.route('/api/control_led', methods=['POST'])
def control_led():
    status = request.json.get("status")
    if status == "on":
        mqtt_client.publish(mqtt_topic_control, "led_on")
    elif status == "off":
        mqtt_client.publish(mqtt_topic_control, "led_off")
    else:
        return jsonify({"error": "Invalid status"}), 400
    return jsonify({"message": f"LED turned {status}"})

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)

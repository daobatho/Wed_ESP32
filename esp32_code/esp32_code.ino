#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

#define DHTPIN 23  // Chân nối với Data của DHT11
#define LDRPIN 34  // Chân nối với cảm biến ánh sáng
#define DHTTYPE DHT11

// Khai báo các chân GPIO kết nối với LED
const int LED1 = 2;  // Chân GPIO 2 kết nối với LED1
const int LED2 = 4;  // Chân GPIO 4 kết nối với LED2
const int ledPin1 = 18;  // Chân LED nháy
const int ledPin2 = 19;
const int ledPin3 = 21;
const int ledPin = 2; // Chân GPIO 2 kết nối với LED

const char* ssid = "VAP_0";
const char* password = "00000000";
const char* mqtt_server = "192.168.0.10";  // IP của máy tính hoặc server chứa MQTT Broker

WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHTPIN, DHTTYPE);

long lastMsg = 0;
char msg[150]; // Tăng kích thước cho JSON chứa nhiều cảm biến

bool ledBlinkingCompleted = false;  // Biến kiểm tra nếu LED đã nháy xong 3 lần

void setup() {
  Serial.begin(115200);
  pinMode(ledPin, OUTPUT); // Thiết lập chân LED là OUTPUT
  digitalWrite(ledPin, LOW); // Đặt trạng thái ban đầu là tắt
  // Thiết lập các chân LED là OUTPUT
  pinMode(ledPin1, OUTPUT);
  pinMode(ledPin2, OUTPUT);
  pinMode(ledPin3, OUTPUT);
  pinMode(LED1, OUTPUT);
  pinMode(LED2, OUTPUT);

  // Đặt trạng thái ban đầu của các LED là tắt
  digitalWrite(ledPin1, LOW);
  digitalWrite(ledPin2, LOW);
  digitalWrite(ledPin3, LOW);
  digitalWrite(LED1, LOW);
  digitalWrite(LED2, LOW);

  dht.begin();
  
  // Kết nối WiFi
  setup_wifi();
  
  // Thiết lập MQTT
  client.setServer(mqtt_server, 1884);
  client.setCallback(callback);
}

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Đang kết nối tới ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi đã kết nối");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.print("Payload received: ");
  Serial.println(message);

  // Xử lý tin nhắn bật/tắt LED
  if (String(topic) == "esp32/output") {
    if (message == "led1_on") {
      digitalWrite(ledPin1, HIGH);  // Bật LED 1
      Serial.println("Đã nhận lệnh: Bật LED 1");
    } else if (message == "led1_off") {
      digitalWrite(ledPin1, LOW);  // Tắt LED 1
      Serial.println("Đã nhận lệnh: Tắt LED 1");
    } else if (message == "led2_on") {
      digitalWrite(ledPin2, HIGH);  // Bật LED 2
    } else if (message == "led2_off") {
      digitalWrite(ledPin2, LOW);  // Tắt LED 2
    }else if (message == "LED1_on") {
      digitalWrite(LED1, HIGH);  
    }else if (message == "LED1_off") {
      digitalWrite(LED1, LOW);  
    }
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Đang kết nối lại MQTT...");
    if (client.connect("ESP32Client", "Tho", "1")) {Serial.println("đã kết nối");
      client.subscribe("esp32/output", 1);
    } else {
      Serial.print("Kết nối thất bại, rc=");
      Serial.print(client.state());
      Serial.println(" thử lại sau 5 giây");
      delay(5000);
    }
  }
}

// Hàm nháy LED 3 lần
void blinkLEDThreeTimes(int pin) {
  // Nháy LED 3 lần
  for (int i = 0; i < 3; i++) {
    digitalWrite(21, HIGH); // Bật LED
    delay(250); // LED bật trong 250ms
    digitalWrite(21, LOW);  // Tắt LED
    delay(250); // LED tắt trong 250ms
  }
  ledBlinkingCompleted = true;  // Đánh dấu rằng LED đã nháy 3 lần
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  long now = millis();
  if (now - lastMsg > 5000) {
    lastMsg = now;

    // Đọc giá trị từ cảm biến thật
    float h = dht.readHumidity();
    float t = dht.readTemperature();
    long ldrValue = analogRead(LDRPIN);

    // Tạo giá trị ngẫu nhiên cho cảm biến ảo
    int gasValue = random(0, 100);  // Cảm biến khí gas (0-100)

    // Ánh xạ giá trị ldrValue từ (0, 4095) về (0, 100)
    long mappedLDRValue = map(ldrValue, 0, 4095, 0, 100);
    // Gửi dữ liệu tới MQTT
    snprintf(msg, 150, "{\"temperature\":%2.1f,\"humidity\":%2.1f,\"light\":%ld,\"wind\":%d}", 
             t, h, mappedLDRValue, gasValue);
    Serial.print("Gửi dữ liệu: ");
    Serial.println(msg);
    client.publish("esp32/sensors", msg);

    // Nếu giá trị gas lớn hơn 50, nháy LED 3 lần
    if (gasValue > 50 && !ledBlinkingCompleted) {
      blinkLEDThreeTimes(21);  // Nháy LED 3 lần
    }
  }

  // Nếu LED đã nháy xong, reset trạng thái để chuẩn bị cho lần tiếp theo
  if (ledBlinkingCompleted) {
    delay(1000);  // Đợi 1s trước khi có thể nháy lại
    ledBlinkingCompleted = false;  // Reset trạng thái nháy LED
  }
}
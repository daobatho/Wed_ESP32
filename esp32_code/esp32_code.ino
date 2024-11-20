#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

#define DHTPIN 23  // Chân nối với Data của DHT11
#define LDRPIN 34  // Chân nối với cảm biến ánh sáng
#define DHTTYPE DHT11

// Khai báo các chân GPIO kết nối với LED
const int ledPin1 = 18;
const int ledPin2 = 19;
const int ledPin3 = 21;
const int ledPin = 2; // Chân GPIO 2 kết nối với LED

const char* ssid = "VAP_0";
const char* password = "00000000";
const char* mqtt_server = "192.168.0.10";  // IP của máy tính hoặc server chứa MQTT BBroker/


WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHTPIN, DHTTYPE);

long lastMsg = 0;
char msg[50];

void setup() {
  Serial.begin(115200);
  pinMode(ledPin, OUTPUT); // Thiết lập chân LED là OUTPUT
  digitalWrite(ledPin, LOW); // Đặt trạng thái ban đầu là tắt
  // Thiết lập các chân LED là OUTPUT
  pinMode(ledPin1, OUTPUT);
  pinMode(ledPin2, OUTPUT);
  pinMode(ledPin3, OUTPUT);

  // Đặt trạng thái ban đầu của các LED là tắt
  digitalWrite(ledPin1, LOW);
  digitalWrite(ledPin2, LOW);
  digitalWrite(ledPin3, LOW);

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

/*void callback(char* topic, byte* payload, unsigned int length) {
    Serial.print("Tin nhắn nhận được [");
    Serial.print(topic);
    Serial.print("] ");
    
    String message;
    for (int i = 0; i < length; i++) {
        message += (char)payload[i];
    }
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
            Serial.println("Đã nhận lệnh: Bật LED 2");
        } else if (message == "led2_off") {
            digitalWrite(ledPin2, LOW);  // Tắt LED 2
            Serial.println("Đã nhận lệnh: Tắt LED 2");
        } else if (message == "led3_on") {
            digitalWrite(ledPin3, HIGH);  // Bật LED 3
            Serial.println("Đã nhận lệnh: Bật LED 3");
        } else if (message == "led3_off") {
            digitalWrite(ledPin3, LOW);  // Tắt LED 3
            Serial.println("Đã nhận lệnh: Tắt LED 3");
        }// Bật tất cả LED
        else if (message == "led_on") {
            digitalWrite(ledPin1, HIGH);
            digitalWrite(ledPin2, HIGH);
            digitalWrite(ledPin3, HIGH);
            Serial.println("Tất cả LED đã bật");
        } 
        // Tắt tất cả LED
        else if (message == "led_off") {
            digitalWrite(ledPin1, LOW);
            digitalWrite(ledPin2, LOW);
            digitalWrite(ledPin3, LOW);
            Serial.println("Tất cả LED đã tắt");
        }
    }
}*/
void callback(char* topic, byte* payload, unsigned int length) {
    String message;
    for (int i = 0; i < length; i++) {
        message += (char)payload[i];
    }

    Serial.print("Payload received: ");
    Serial.println(message);

    Serial.print("Tin nhắn nhận được [");
    Serial.print(topic);
    Serial.print("]: ");
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
            Serial.println("Đã nhận lệnh: Bật LED 2");
        } else if (message == "led2_off") {
            digitalWrite(ledPin2, LOW);  // Tắt LED 2
            Serial.println("Đã nhận lệnh: Tắt LED 2");
        } else if (message == "led3_on") {
            digitalWrite(ledPin3, HIGH);  // Bật LED 3
            Serial.println("Đã nhận lệnh: Bật LED 3");
        } else if (message == "led3_off") { 
            digitalWrite(ledPin3, LOW);  // Tắt LED 3
            Serial.println("Đã nhận lệnh: Tắt LED 3");
        } 
        // Bật tất cả LED
        else if (message == "led_on") {
            digitalWrite(ledPin1, HIGH);
            digitalWrite(ledPin2, HIGH);
            digitalWrite(ledPin3, HIGH);
            Serial.println("Tất cả LED đã bật");
        } 
        // Tắt tất cả LED
        else if (message == "led_off") {
            digitalWrite(ledPin1, LOW);
            digitalWrite(ledPin2, LOW);
            digitalWrite(ledPin3, LOW);
            Serial.println("Tất cả LED đã tắt");
        }
    }
    // // Xử lý lệnh bật tắt LED
    // if (String(topic) == "esp32/output") {
    //     Serial.println("Topic khớp, xử lý lệnh...");
    //     if (message == "led_on") {
    //         digitalWrite(ledPin, HIGH); // Bật LED
    //         Serial.println("Đã bật LED");
    //     } else if (message == "led_off") {
    //         digitalWrite(ledPin, LOW); // Tắt LED
    //         Serial.println("Đã tắt LED");
    //     } else {//         Serial.println("Lệnh không xác định");
    //     }
    // } else {
    //     Serial.println("Topic không khớp, bỏ qua...");
    // }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Đang kết nối lại MQTT...");
    if (client.connect("ESP32Client", "Tho", "1")) {
      Serial.println("đã kết nối");
      // Đăng ký lắng nghe topic điều khiển
      client.subscribe("esp32/output",1);
    } else {
      Serial.print("Kết nối thất bại, rc=");
      Serial.print(client.state());
      Serial.println(" thử lại sau 5 giây");
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  long now = millis();
  if (now - lastMsg > 2000) {
    lastMsg = now;

    // Đọc giá trị từ cảm biến
    float h = dht.readHumidity();
    float t = dht.readTemperature();
    long ldrValue = analogRead(LDRPIN);

    // Gửi dữ liệu tới MQTT
    snprintf(msg, 50, "{\"temperature\":%2.1f,\"humidity\":%2.1f,\"light\":%ld}", t, h, ldrValue);
    Serial.print("Gửi dữ liệu: ");
    Serial.println(msg);
    client.publish("esp32/sensors", msg);
  }
}
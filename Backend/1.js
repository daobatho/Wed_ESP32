const express = require('express'); // tạo server API
const mysql = require('mysql2');    // kết nối mysql
const mqtt = require('mqtt');       // giao tiếp mqtt
const bodyParser = require('body-parser');  // xử lý các yêu cầu từ http
const cors = require('cors');               // phép các ứng dụng từ domain khác truy cập API.
const app = express();                      // Tạo ứng dụng Express
app.use(bodyParser.json());                 // Cho phép server đọc dữ liệu JSON từ body của các request.
app.use(cors()); // Enable CORS for all requests

// MQTT Configuration
const MQTT_BROKER = '192.168.0.10';
const MQTT_PORT = 1884;
const MQTT_TOPIC_OUTPUT = 'esp32/output';
const MQTT_TOPIC_SENSORS = 'esp32/sensors';
const MQTT_USERNAME = 'Tho';
const MQTT_PASSWORD = '1';

// Connect to MQTT broker
const mqttClient = mqtt.connect(`mqtt://${MQTT_BROKER}:${MQTT_PORT}`, {
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD
});

// MySQL Connection
const dbSensor = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'esp32_data'
});

const dbDevices = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'devices'
});

// Connect to MySQL
dbSensor.connect(err => {
    if (err) throw err;
    console.log('Connected to sensor database');
});

dbDevices.connect(err => {
    if (err) throw err;
    console.log('Connected to devices database');
});

// MQTT message handler
mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
    mqttClient.subscribe(MQTT_TOPIC_SENSORS, err => {
        if (err) console.error('Failed to subscribe:', err);
    });
});

mqttClient.on('message', (topic, message) => {
    if (topic === MQTT_TOPIC_SENSORS) {
        const data = JSON.parse(message.toString());
        const { temperature, humidity, light, wind} = data;

        if (
            temperature !== undefined &&
            humidity !== undefined &&
            light !== undefined &&
            wind !== undefined 
        ) {
            // Lưu dữ liệu cảm biến vào cơ sở dữ liệu
            dbSensor.query(
                'INSERT INTO sensor_data (Temp, Humid, Light, Wind) VALUES (?, ?, ?, ?)',
                [temperature, humidity, light, wind],
                (err) => {
                    if (err) {
                        console.error('Error saving sensor data:', err);
                    } else {
                        console.log(
                            `Data saved: Temperature=${temperature}, Humidity=${humidity}, Light=${light}, Wind=${wind}`
                        );
                    }
                }
            );

            // Kiểm tra nếu khí wind > 50 thì gửi lệnh bật nhấp nháy LED
            if (wind > 50) {
                console.log('Wind level is high, sending blink command to LED');
                mqttClient.publish(MQTT_TOPIC_OUTPUT, 'blink_on', (err) => {
                    if (err) {
                        console.error('Error publishing blink command to MQTT:', err);
                    } else {
                        console.log('Blink command sent to LED');
                    }
                });
            } else {
                // Nếu khí wind không còn quá cao, tắt LED (nếu cần thiết)
                mqttClient.publish(MQTT_TOPIC_OUTPUT, 'blink_off', (err) => {
                    if (err) {
                        console.error('Error publishing turn off command to MQTT:', err);
                    } else {
                        console.log('LED turned off');
                    }
                });
            }
        } else {
            console.log('Received incomplete data');
        }
    }
});

// API to control LED
app.post('/api/control_led', (req, res) => {
  console.log('Received control command for LED:', req.body);

  const status = req.body.status || 'on';
  const action = status === 'on' ? 'Bật' : 'Tắt';
  console.log(`Publishing to MQTT topic '${MQTT_TOPIC_OUTPUT}' with message 'led1_${status}'`);

  // Gửi lệnh tới MQTT broker
  mqttClient.publish(MQTT_TOPIC_OUTPUT, `led1_${status}`, (err) => {
      if (err) {
          console.error('Error publishing to MQTT:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
      }
      // Thêm log ở đây để kiểm tra xem mã có đến đoạn này không
      console.log('About to insert into database');
      // Ghi vào bảng HistoryDevice
      dbDevices.query(
          'INSERT INTO HistoryDevice (Device, Action, Time) VALUES (?, ?, NOW())',
          ['LED', action],
          (err) => {
              if (err) {
                  console.error('Error saving device history:', err);
                  return res.status(500).json({ error: 'Internal Server Error' });
              }
              console.log(`Saved to database: Device=LED, Action=${action}`); // Log để kiểm tra
              res.json({ message: `LED turned ${status}` });
          }
      );
  });
});

// API to control FAN
app.post('/api/control_fan', (req, res) => {
  const status = req.body.status || 'on';
  const action = status === 'on' ? 'Bật' : 'Tắt';
  console.log(`Publishing to MQTT topic '${MQTT_TOPIC_OUTPUT}' with message 'led2_${status}'`);

  mqttClient.publish(MQTT_TOPIC_OUTPUT, `led2_${status}`);

  // Ghi vào bảng HistoryDevice
  dbDevices.query(
      'INSERT INTO HistoryDevice (Device, Action, Time) VALUES (?, ?, NOW())',
      ['FAN', action],
      (err) => {
          if (err) {
              console.error('Error saving device history:', err);
              return res.status(500).json({ error: 'Internal Server Error' });
          }
          res.json({ message: `FAN turned ${status}` });
      }
  );
});



// API to get sensor history
app.get('/api/sensor_history', (req, res) => {
  dbSensor.query(
      'SELECT * FROM sensor_data ORDER BY id DESC LIMIT 100', // Sửa LIMIT theo số lượng bản ghi bạn muốn lấy
      (err, results) => {
          if (err) {
              console.error('Error fetching sensor history:', err);
              return res.status(500).json({ error: 'Internal Server Error' });
          }
          res.json(results);
      }
  );
});

// API to get device history
app.get('/api/device_history', (req, res) => {
  dbDevices.query(
      'SELECT * FROM HistoryDevice ORDER BY ID DESC LIMIT 100', // Sửa LIMIT theo số lượng bản ghi bạn muốn lấy
      (err, results) => {
          if (err) {
              console.error('Error fetching device history:', err);
              return res.status(500).json({ error: 'Internal Server Error' });
          }
          res.json(results);
      }
  );
});


// API to get latest sensor data
app.get('/api/latest_sensor_data', (req, res) => {
    dbSensor.query(
        'SELECT Temp, Humid, Light, Wind FROM sensor_data ORDER BY id DESC LIMIT 1',
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Internal Server Error' });
            if (results.length > 0) {
                const { Temp, Humid, Light, Wind} = results[0];
                res.json({
                    temperature: Temp,
                    humidity: Humid,
                    light: Light,
                    wind: Wind
                });
            } else {
                res.status(404).json({ error: 'No data found' });
            }
        }
    );
    
});

// API để điều khiển LED1
app.post('/api/control_led1', (req, res) => {
    const status = req.body.status || 'on';
    const action = status === 'on' ? 'Bật' : 'Tắt';
    console.log(`Publishing to MQTT topic '${MQTT_TOPIC_OUTPUT}' with message 'LED1_${status}'`);
  
    // Gửi lệnh tới MQTT broker
    mqttClient.publish(MQTT_TOPIC_OUTPUT, `LED1_${status}`, (err) => {
        if (err) {
            console.error('Error publishing to MQTT:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
  
        // Ghi vào bảng HistoryDevice
        dbDevices.query(
            'INSERT INTO HistoryDevice (Device, Action, Time) VALUES (?, ?, NOW())',
            ['LED1', action],
            (err) => {
                if (err) {
                    console.error('Error saving device history:', err);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }
                res.json({ message: `LED1 turned ${status}` });
            }
        );
    });
  });
  
  // API để điều khiển LED2
  app.post('/api/control_led2', (req, res) => {
    const status = req.body.status || 'on';
    const action = status === 'on' ? 'Bật' : 'Tắt';
    console.log(`Publishing to MQTT topic '${MQTT_TOPIC_OUTPUT}' with message 'LED2_${status}'`);
  
    mqttClient.publish(MQTT_TOPIC_OUTPUT, `LED2_${status}`);
  
    // Ghi vào bảng HistoryDevice
    dbDevices.query(
        'INSERT INTO HistoryDevice (Device, Action, Time) VALUES (?, ?, NOW())',
        ['LED2', action],
        (err) => {
            if (err) {
                console.error('Error saving device history:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            res.json({ message: `LED2 turned ${status}` });
        }
    );
  });

  

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

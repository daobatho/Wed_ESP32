const express = require('express');
const mysql = require('mysql2');
const mqtt = require('mqtt');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
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
        const { temperature, humidity, light } = data;

        if (temperature !== undefined && humidity !== undefined && light !== undefined) {
            dbSensor.query(
                'INSERT INTO sensor_data (Temp, Humid, Light) VALUES (?, ?, ?)',
                [temperature, humidity, light],
                (err) => {
                    if (err) console.error('Error saving sensor data:', err);
                    else console.log(`Data saved: Temperature=${temperature}, Humidity=${humidity}, Light=${light}`);
                }
            );
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
      'SELECT * FROM sensor_data ORDER BY id DESC LIMIT 10', // Sửa LIMIT theo số lượng bản ghi bạn muốn lấy
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
      'SELECT * FROM HistoryDevice ORDER BY ID DESC LIMIT 10', // Sửa LIMIT theo số lượng bản ghi bạn muốn lấy
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
        'SELECT Temp, Humid, Light FROM sensor_data ORDER BY id DESC LIMIT 1',
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Internal Server Error' });
            if (results.length > 0) {
                const { Temp, Humid, Light } = results[0];
                res.json({ temperature: Temp, humidity: Humid, light: Light });
            } else {
                res.status(404).json({ error: 'No data found' });
            }
        }
    );
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

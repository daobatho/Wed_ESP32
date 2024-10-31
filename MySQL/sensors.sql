USE sensors;
DROP TABLE IF EXISTS sensor_history;
CREATE TABLE sensor_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    temperature FLOAT,
    humidity FLOAT,
    light INT
);
DESCRIBE sensor_history;
SELECT * FROM sensor_history;
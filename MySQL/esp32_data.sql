DROP TABLE IF EXISTS sensor_data;
CREATE TABLE sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    temperature FLOAT,
    humidity FLOAT,
    light BIGINT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SHOW TABLES;
DESCRIBE sensor_data;
SELECT * FROM sensor_data
/*SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1;*/

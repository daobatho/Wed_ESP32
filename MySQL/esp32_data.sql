USE esp32_data;
CREATE TABLE sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Temp FLOAT,
    Humid FLOAT,
    Light BIGINT,
    Time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Wind INT
);

SELECT * FROM sensor_data


/*DROP TABLE IF EXISTS sensor_data;
USE esp32_data;
CREATE TABLE sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Temp FLOAT,
    Humid FLOAT,
    Light BIGINT,
    Time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);*/

SELECT * FROM sensor_data
WHERE Temp= ( SELECT MAX(Temp) FROM sensor_data);

SELECT * FROM sensor_data
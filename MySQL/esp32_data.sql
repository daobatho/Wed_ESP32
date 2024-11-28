USE esp32_data;
/*SELECT * 
FROM sensor_data
ORDER BY Temp DESC, Humid DESC
LIMIT 5;
SELECT * 
FROM sensor_data
WHERE Temp > 26 AND Humid > 50;*/
SELECT * 
FROM sensor_data
WHERE Humid = 55;
ALTER TABLE sensor_data DROP COLUMN infrared;
ALTER TABLE sensor_data DROP COLUMN new_light;
SELECT * FROM sensor_data

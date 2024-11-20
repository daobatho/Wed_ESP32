#DROP TABLE IF EXISTS HistoryDevice;
USE devices;

/*CREATE TABLE HistoryDevice (
	ID  INT AUTO_INCREMENT PRIMARY KEY,
    Device VARCHAR(50),
    Action VARCHAR(50),
    Time DATETIME
);*/

SELECT 
    Device,
    Action,
    COUNT(*) AS Count
FROM 
    HistoryDevice
WHERE 
    Device IN ('LED', 'FAN')
GROUP BY 	
    Device, Action;

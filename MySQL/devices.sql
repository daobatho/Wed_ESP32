DROP TABLE IF EXISTS HistoryDevice;
USE devices;

CREATE TABLE HistoryDevice (
	ID  INT AUTO_INCREMENT PRIMARY KEY,
    Device VARCHAR(50),
    Action VARCHAR(50),
    Time DATETIME
);

/*INSERT INTO HistoryDevice (Device, Action, Time) 
VALUES ('LED', 'ON', NOW());*/
DELETE FROM HistoryData WHERE ID = 4;
SELECT * FROM HistoryDevice;

const apiUrl = 'http://192.168.0.10:5000/api/latest_sensor_data'; // Đường dẫn đến API
const ledUrl = 'http://192.168.0.10:5000/api/control_led'; // Đường dẫn đến API điều khiển LED
//const fanUrl = 'http://192.168.0.10:5000/api/control_fan'; // API điều khiển FAN

let ledState = 'off'; // Trạng thái ban đầu của LED
let fanState = 'off'; // Trạng thái ban đầu của FAN

// Khởi tạo nhãn cho trục x (thời gian)
let labels = [];

// Tạo nhãn thời gian cho mỗi lần cập nhật
function addTimeLabel() {
    const now = new Date();
    const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    labels.push(timeLabel); // Thêm nhãn thời gian vào mảng nhãn
}

// Định nghĩa cấu trúc dữ liệu cho biểu đồ
const data = {
    labels: labels,
    datasets: [
        {
            label: 'Khí Gas (ppm)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            data: [], // Mảng dữ liệu khí gas
            fill: true
        },
        {
            label: 'Hồng Ngoại',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            data: [], // Mảng dữ liệu hồng ngoại
            fill: true
        },
        {
            label: 'Độ sáng (lux)',
            backgroundColor: 'rgba(255, 206, 86, 0.2)',
            borderColor: 'rgba(255, 206, 86, 1)',
            data: [], // Mảng dữ liệu độ sáng
            fill: true
        }
    ]
};

// Cấu hình cho biểu đồ
const config = {
    type: 'line',
    data: data,
    options: {
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Thời gian (giờ)',
                    color: 'white',
                    font: {
                        size: 24
                    }
                },
                ticks: {
                    color: 'white'
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.2)'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Giá trị',
                    color: 'white',
                    font: {
                        size: 24
                    }
                },
                ticks: {
                    color: 'white'
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.2)'
                },
                min: 0,
                max: 100
            }
        },
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: 'white'
                }
            }
        }
    }
};

// Khởi tạo biểu đồ Chart.js với ID 'sensorChart' và cấu hình đã định nghĩa
const sensorChart = new Chart(
    document.getElementById('sensorChart'),
    config
);

// Cập nhật dữ liệu từ API
function updateData() {
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            console.log(data); // Xem dữ liệu nhận được
            if (data && data.gas !== undefined && data.infrared !== undefined && data.new_light !== undefined) {
                // Cập nhật dữ liệu cảm biến lên giao diện web
                document.getElementById('gasValue').textContent = `${data.gas} ppm`;
                document.getElementById('infraredValue').textContent = `${data.infrared}`;
                document.getElementById('new_lightValue').textContent = `${data.new_light} lux`;

                // Thêm nhãn thời gian cho mỗi lần cập nhật
                addTimeLabel();

                // Cập nhật dữ liệu vào biểu đồ
                sensorChart.data.datasets[0].data.push(data.gas);
                sensorChart.data.datasets[1].data.push(data.infrared);
                sensorChart.data.datasets[2].data.push(data.new_light);

                // Cập nhật biểu đồ
                sensorChart.update();

                // Cập nhật màu sắc cảnh báo khi mức khí gas lớn hơn 70
                const warningIcon = document.getElementById('warningIcon');
                if (data.gas > 70) {
                    // Đổi màu bóng đèn khi gas > 70 và bật hiệu ứng nhấp nháy
                    warningIcon.classList.add('warning-on');
                } else {
                    // Trở lại màu trắng và tắt hiệu ứng nhấp nháy khi gas <= 70
                    warningIcon.classList.remove('warning-on');
                }
            } else {
                console.error('Dữ liệu không hợp lệ:', data);
            }
        })
        .catch(error => console.error('Lỗi:', error));
}

// Gửi yêu cầu điều khiển LED
function toggleLed() {
    ledState = ledState === 'on' ? 'off' : 'on';
    fetch(ledUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: ledState })
    })
    .then(response => response.json())
    .then(data => {
        console.log(`LED turned ${ledState}`);
        document.getElementById('ledStatus').textContent = ledState === 'on' ? '✓' : '✗';
    })
    .catch(error => console.error('Lỗi:', error));
}

// Gửi yêu cầu điều khiển FAN
function toggleFan() {
    fanState = fanState === 'on' ? 'off' : 'on';
    fetch(fanUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: fanState })
    })
    .then(response => response.json())
    .then(data => {
        console.log(`FAN turned ${fanState}`);
        document.getElementById('fanStatus').textContent = fanState === 'on' ? '✓' : '✗';
    })
    .catch(error => console.error('Lỗi:', error));
}

// Lắng nghe sự kiện click vào nút điều khiển LED và FAN
document.getElementById('btnLedControl').addEventListener('click', toggleLed);
document.getElementById('btnFanControl').addEventListener('click', toggleFan);

// Bắt đầu lấy dữ liệu khi trang được tải
function startDataFetching() {
    updateData(); // Gọi hàm lấy dữ liệu một lần đầu tiên
    setInterval(updateData, 5000); // Gọi lại sau mỗi 5 giây
}

// Khởi động lấy dữ liệu khi trang tải
window.onload = startDataFetching;

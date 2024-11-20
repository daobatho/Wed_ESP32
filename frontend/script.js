const apiUrl = 'http://192.168.0.10:5000/api/latest_sensor_data'; // Đường dẫn đến API
const ledUrl = 'http://192.168.0.10:5000/api/control_led'; // Đường dẫn đến API điều khiển LED
const fanUrl = 'http://192.168.0.10:5000/api/control_fan'; // API điều khiển FAN

let ledState = 'off'; // Trạng thái ban đầu của LED
let fanState = 'off'; // Trạng thái ban đầu của FAN

// Khởi tạo nhãn cho trục x (thời gian)
let labels = [];
let currentIndex = 0; // Đánh dấu vị trí hiện tại trong mảng dữ liệu

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
            label: 'Nhiệt độ (°C)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            data: [], // Mảng dữ liệu nhiệt độ
            fill: true
        },
        {
            label: 'Độ ẩm (%)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            data: [], // Mảng dữ liệu độ ẩm
            fill: true
        },
        {
            label: 'Độ sáng (%)',
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
            if (data && data.temperature !== undefined && data.humidity !== undefined && data.light !== undefined) {
                // Cập nhật dữ liệu cảm biến lên giao diện web
                document.getElementById('tempValue').textContent = `${data.temperature}°C`;
                document.getElementById('humidityValue').textContent = `${data.humidity}%`;
                document.getElementById('lightValue').textContent = `${data.light}%`;

                // Thêm nhãn thời gian cho mỗi lần cập nhật
                addTimeLabel();

                // Cập nhật dữ liệu vào biểu đồ
                sensorChart.data.datasets[0].data.push(data.temperature);
                sensorChart.data.datasets[1].data.push(data.humidity);
                sensorChart.data.datasets[2].data.push(data.light);

                // Cập nhật biểu đồ
                sensorChart.update();
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

function showNotification(message) {
    const notificationDiv = document.getElementById('notification');
    notificationDiv.textContent = message;
    notificationDiv.style.display = 'block'; // Hiển thị thông báo
    setTimeout(() => {
        notificationDiv.style.display = 'none'; // Ẩn thông báo sau 3 giây
    }, 3000);
}

// Lắng nghe sự kiện click vào nút điều khiển LED và FAN
document.getElementById('btnLedControl').addEventListener('click', toggleLed);
document.getElementById('btnFanControl').addEventListener('click', toggleFan);

// Bắt đầu lấy dữ liệu khi trang được tải
function startDataFetching() {
    updateData(); // Gọi hàm lấy dữ liệu một lần đầu tiên
    setInterval(updateData, 10000); // Gọi lại sau mỗi 10 giây
}

// Khởi động lấy dữ liệu khi trang tải
window.onload = startDataFetching;

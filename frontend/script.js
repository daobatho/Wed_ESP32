const apiUrl = 'http://192.168.0.10:5000/api/latest_sensor_data'; // Đường dẫn đến API
const ledUrl = 'http://192.168.0.10:5000/api/control_led'; // Đường dẫn đến API điều khiển LED
const fanUrl = 'http://192.168.0.10:5000/api/control_fan'; // API điều khiển FAN

let ledState = 'off'; // Trạng thái ban đầu của LED
let fanState = 'off'; // Trạng thái ban đầu của FAN

// Khởi tạo nhãn cho trục x, bắt đầu từ thời gian hiện tại
let labels = [];
const now = new Date();
const startTime = now; // Thời gian bắt đầu là hiện tại

// Tạo nhãn thời gian cho 5 phút (30 lần 10 giây)
for (let i = 0; i <= 30; i++) {
    const time = new Date(startTime.getTime() + (i * 10000)); // Mỗi nhãn cách nhau 10 giây
    if (i % 6 === 0) { // Chỉ thêm nhãn mỗi phút (mỗi 6 lần 10 giây)
        labels.push(`${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`);
    } else {
        labels.push(''); // Các nhãn khác để trống để tạo khoảng chia nhỏ hơn
    }
}

// Định nghĩa cấu trúc dữ liệu cho biểu đồ
const data = {
    labels: labels,
    datasets: [
        {
            label: 'Nhiệt độ (°C)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            data: Array(labels.length).fill(null), // Khởi tạo mảng dữ liệu với độ dài tương ứng
            fill: true
        },
        {
            label: 'Độ ẩm (%)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            data: Array(labels.length).fill(null), // Khởi tạo mảng dữ liệu với độ dài tương ứng
            fill: true
        },
        {
            label: 'Độ sáng (%)',
            backgroundColor: 'rgba(255, 206, 86, 0.2)',
            borderColor: 'rgba(255, 206, 86, 1)',
            data: Array(labels.length).fill(null), // Khởi tạo mảng dữ liệu với độ dài tương ứng
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

let currentIndex = 0; // Đánh dấu vị trí hiện tại trong mảng dữ liệu

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

                // Cập nhật dữ liệu vào biểu đồ
                sensorChart.data.datasets[0].data[currentIndex] = data.temperature;
                sensorChart.data.datasets[1].data[currentIndex] = data.humidity;
                sensorChart.data.datasets[2].data[currentIndex] = data.light;

                // Tăng chỉ số vị trí hiện tại
                currentIndex++;

                // Nếu vượt quá số nhãn, đặt lại chỉ số về 0
                if (currentIndex >= labels.length) {
                    currentIndex = 0; // Đặt lại chỉ số về 0 để bắt đầu từ đầu
                }

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

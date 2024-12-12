// Định nghĩa các URL API để lấy dữ liệu cảm biến và điều khiển thiết bị
const apiUrl = 'http://192.168.0.10:5000/api/latest_sensor_data'; 
const ledUrl = 'http://192.168.0.10:5000/api/control_led'; 
const fanUrl = 'http://192.168.0.10:5000/api/control_fan'; 

// Trạng thái ban đầu của LED và quạt
let ledState = 'off'; 
let fanState = 'off'; 

// Mảng chứa nhãn thời gian cho biểu đồ
let labels = [];
let currentIndex = 0;

// Hàm để thêm nhãn thời gian vào biểu đồ
function addTimeLabel() {
    const now = new Date();
    const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    labels.push(timeLabel);  // Thêm nhãn thời gian vào mảng
}

// Dữ liệu cho biểu đồ, bao gồm nhiệt độ, độ ẩm và độ sáng
const data = {
    labels: labels,
    datasets: [
        {
            label: 'Nhiệt độ (°C)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            data: [],
            fill: true
        },
        {
            label: 'Độ ẩm (%)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            data: [],
            fill: true
        },
        {
            label: 'Độ sáng (lux)',
            backgroundColor: 'rgba(255, 206, 86, 0.2)',
            borderColor: 'rgba(255, 206, 86, 1)',
            data: [],
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
                    font: { size: 24 }
                },
                ticks: { color: 'white' },
                grid: { color: 'rgba(255, 255, 255, 0.2)' }
            },
            y: {
                title: {
                    display: true,
                    text: 'Giá trị',
                    color: 'white',
                    font: { size: 24 }
                },
                ticks: { color: 'white' },
                grid: { color: 'rgba(255, 255, 255, 0.2)' },
                min: 0,
                max: 100
            }
        },
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: { color: 'white' }
            }
        }
    }
};

// Tạo đối tượng biểu đồ Chart.js
const sensorChart = new Chart(document.getElementById('sensorChart'), config);

// Hàm cập nhật dữ liệu cảm biến
function updateData() {
    fetch(apiUrl)
        .then(response => response.json())  // Lấy dữ liệu từ API
        .then(data => {
            if (data && data.temperature !== undefined && data.humidity !== undefined && data.light !== undefined) {
                // Cập nhật các giá trị hiển thị trên giao diện
                document.getElementById('tempValue').textContent = `${data.temperature}°C`;
                document.getElementById('humidityValue').textContent = `${data.humidity}%`;
                document.getElementById('lightValue').textContent = `${data.light} lux`;

                // Thêm nhãn thời gian vào biểu đồ
                addTimeLabel();

                // Cập nhật dữ liệu cho các dataset trên biểu đồ
                sensorChart.data.datasets[0].data.push(data.temperature);
                sensorChart.data.datasets[1].data.push(data.humidity);
                sensorChart.data.datasets[2].data.push(data.light);

                // Cập nhật biểu đồ
                sensorChart.update();

                // Giới hạn số lượng dữ liệu trên biểu đồ (giữ lại 6 điểm dữ liệu gần nhất)
                if (sensorChart.data.datasets[0].data.length > 6) {
                    sensorChart.data.datasets[0].data.shift();
                    sensorChart.data.datasets[1].data.shift();
                    sensorChart.data.datasets[2].data.shift();
                    labels.shift();
                }
                sensorChart.update();
            } else {
                console.error('Dữ liệu không hợp lệ:', data);
            }
        })
        .catch(error => console.error('Lỗi:', error));  // Xử lý lỗi nếu có
}

// Hàm điều khiển LED (ON/OFF)
function toggleLed() {
    ledState = ledState === 'on' ? 'off' : 'on';  // Chuyển đổi trạng thái LED
    fetch(ledUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: ledState })  // Gửi trạng thái LED đến API
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('ledStatus').textContent = ledState === 'on' ? 'ON' : 'OFF';
        const ledControl = document.getElementById('btnLedControl');
        if (ledState === 'on') {
            ledControl.classList.add('led-on');  // Thêm lớp CSS khi LED bật
            ledControl.classList.remove('led-off');
        } else {
            ledControl.classList.add('led-off');  // Thêm lớp CSS khi LED tắt
            ledControl.classList.remove('led-on');
        }
    })
    .catch(error => console.error('Lỗi:', error));  // Xử lý lỗi nếu có
}

// Hàm điều khiển quạt (ON/OFF)
function toggleFan() {
    fanState = fanState === 'on' ? 'off' : 'on';  // Chuyển đổi trạng thái quạt
    fetch(fanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: fanState })  // Gửi trạng thái quạt đến API
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('fanStatus').textContent = fanState === 'on' ? 'ON' : 'OFF';
    })
    .catch(error => console.error('Lỗi:', error));  // Xử lý lỗi nếu có
}

// Gắn sự kiện cho nút điều khiển LED và quạt
document.getElementById('btnLedControl').addEventListener('click', toggleLed);
document.getElementById('btnFanControl').addEventListener('click', toggleFan);

// Hàm khởi tạo việc lấy dữ liệu khi trang được tải
window.onload = startDataFetching;

function startDataFetching() {
    updateData();  // Lấy dữ liệu ban đầu
    setInterval(updateData, 5000);  // Cập nhật dữ liệu mỗi 5 giây
}

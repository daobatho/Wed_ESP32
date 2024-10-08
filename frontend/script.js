const apiUrl = 'http://192.168.135.86:5000/api/latest_sensor_data'; // Đường dẫn đến API
const ledUrl = 'http://192.168.135.86:5000/api/control_led';  // Đường dẫn đúng đến API điều khiển LED

// Định nghĩa nhãn cho trục x của biểu đồ
const labels = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '24:00'];

// Định nghĩa cấu trúc dữ liệu cho biểu đồ
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
            label: 'Độ sáng (%)',
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
let state = {}; // Định nghĩa biến state
// Cập nhật dữ liệu từ API
function updateData(data) {
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
                sensorChart.data.datasets[0].data.push(data.temperature);
                sensorChart.data.datasets[1].data.push(data.humidity);
                sensorChart.data.datasets[2].data.push(data.light);

                // Nếu vượt quá số nhãn, xóa dữ liệu cũ nhất
                if (sensorChart.data.datasets[0].data.length > labels.length) {
                    sensorChart.data.datasets.forEach(dataset => dataset.data.shift());
                }

                sensorChart.update();
            } else {
                console.error('Dữ liệu không hợp lệ:', data);
            }
        })
        .catch(error => console.error('Lỗi:', error));
}

// Gửi yêu cầu điều khiển LED
function toggleLed(state) {

    fetch(ledUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: state })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('HTTP error! status: ${response.status}');
        }
        return response.json();
    })
    .then(data => {
        const message = `LED đã ${state === 'on' ? 'bật' : 'tắt'}`;
        console.log(message);
        showNotification(message); // Hiển thị thông báo với thông báo tương ứng
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


// Lắng nghe sự kiện click vào nút bật/tắt LED
document.getElementById('btnLedOn').addEventListener('click', function () {
    toggleLed('on'); // Gửi yêu cầu bật LED
    showNotification("LED is turned ON"); // Hiển thị thông báo
});

document.getElementById('btnLedOff').addEventListener('click', function () {
    toggleLed('off'); // Gửi yêu cầu tắt LED
    showNotification("LED is turned OFF"); // Hiển thị thông báo
});

// Bắt đầu lấy dữ liệu khi trang được tải
function startDataFetching() {
    updateData(); // Gọi hàm lấy dữ liệu một lần đầu tiên
    setInterval(updateData, 5000); // Gọi lại sau mỗi 5 giây
}

// Khởi động lấy dữ liệu khi trang tải
window.onload = startDataFetching;

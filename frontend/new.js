const apiUrl = 'http://192.168.0.10:5000/api/latest_sensor_data'; // Đường dẫn đến API
const ledUrl = 'http://192.168.0.10:5000/api/control_led1'; // Đường dẫn đến API điều khiển LED

let ledState = 'off'; // Trạng thái ban đầu của LED

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
            label: 'Wind Speed (m/s)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            data: [], // Mảng dữ liệu khí wind
            fill: true
        },
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
            if (data && data.wind !== undefined ) {
                // Cập nhật dữ liệu cảm biến lên giao diện web
                document.getElementById('gasValue').textContent = `${data.wind} m/s`;

                // Thêm nhãn thời gian cho mỗi lần cập nhật
                addTimeLabel();

                // Cập nhật dữ liệu vào biểu đồ
                sensorChart.data.datasets[0].data.push(data.wind);

                // Cập nhật biểu đồ
                sensorChart.update();
                // Giới hạn mảng chỉ chứa 6 giá trị
                if (sensorChart.data.datasets[0].data.length > 6) {
                    sensorChart.data.datasets[0].data.shift(); // Loại bỏ phần tử đầu tiên
                    sensorChart.data.labels.shift(); // Loại bỏ nhãn đầu tiên
                }

                // Cập nhật biểu đồ
                sensorChart.update();
                // Cập nhật màu sắc cảnh báo khi mức khí wind lớn hơn 50
                const warningIcon = document.getElementById('warningIcon');
                if (data.wind > 50) {
                    // Đổi màu bóng đèn và bật hiệu ứng nhấp nháy 3 lần
                    let blinkCount = 0;
                
                    function toggleLed() {
                        if (blinkCount < 3) {
                            if (blinkCount % 2 === 0) {
                                // Màu đỏ
                                warningIcon.classList.add('warning-on');
                            } else {
                                // Màu trắng
                                warningIcon.classList.remove('warning-on');
                            }
                            blinkCount++;
                            setTimeout(toggleLed, 250); // Đợi 0.25s trước khi bật/tắt lần tiếp theo
                        }
                    }
                
                    // Bắt đầu hiệu ứng nhấp nháy
                    toggleLed();
                } else {
                    // Trở lại màu trắng và tắt hiệu ứng nhấp nháy khi wind <= 50
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
    // Đảo trạng thái của LED
    ledState = ledState === 'on' ? 'off' : 'on';

    fetch(ledUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: ledState }) // Gửi trạng thái LED mới
    })
    .then(response => response.json())
    .then(data => {
        console.log(`LED turned ${ledState}`);
        
        const ledIcon = document.getElementById('ledIcon');
        const ledStatus = document.getElementById('ledStatus');  // Lấy phần tử hiển thị trạng thái

        // Cập nhật trạng thái LED trên giao diện
        if (ledState === 'on') {
            ledIcon.classList.add('led-on'); // Thêm lớp để đổi màu và hiệu ứng khi LED bật
            ledStatus.textContent = 'ON';    // Cập nhật chữ thành "ON"
        } else {
            ledIcon.classList.remove('led-on'); // Xóa lớp hiệu ứng khi tắt LED
            ledStatus.textContent = 'OFF';   // Cập nhật chữ thành "OFF"
        }
    })
    .catch(error => console.error('Lỗi:', error));
}

// Lắng nghe sự kiện click vào nút điều khiển LED
document.getElementById('btnLedControl').addEventListener('click', toggleLed);

// Bắt đầu lấy dữ liệu khi trang được tải
function startDataFetching() {
    updateData(); // Gọi hàm lấy dữ liệu một lần đầu tiên
    setInterval(updateData, 5000); // Gọi lại sau mỗi 5 giây
}

// Khởi động lấy dữ liệu khi trang tải
window.onload = startDataFetching;

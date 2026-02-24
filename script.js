const firebaseConfig = {
    apiKey: "AIzaSyCF1UfpyK4_nrH68omoeC0U-jd3eUBLj8I",
    authDomain: "flashcarddatabase-774ec.firebaseapp.com",
    databaseURL: "https://flashcarddatabase-774ec-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "flashcarddatabase-774ec",
    storageBucket: "flashcarddatabase-774ec.firebasestorage.app",
    messagingSenderId: "993923644179",
    appId: "1:993923644179:web:4947ef3afacdcefd93f8e6",
    measurementId: "G-GQXC5HH3XB"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let allWords = [];
let dueWords = [];
let currentIndex = 0;
let myChart;

// Khởi tạo Biểu đồ
function initChart(levelData) {
    const ctx = document.getElementById('levelChart').getContext('2d');
    if (myChart) myChart.destroy();
    
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Lv 1', 'Lv 2', 'Lv 3', 'Lv 4', 'Lv 5+'],
            datasets: [{
                label: 'Số lượng từ theo Level',
                data: levelData,
                backgroundColor: ['#e74c3c', '#e67e22', '#f1c40f', '#3498db', '#2ecc71']
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

// Lắng nghe dữ liệu
db.ref().on('value', (snapshot) => {
    const data = snapshot.val();
    const nowVN = Date.now(); // Trình duyệt tự lấy giờ địa phương VN
    
    allWords = [];
    dueWords = [];
    let levels = [0, 0, 0, 0, 0];

    if (data) {
        for (let key in data) {
            // Kiểm tra nếu là object word (tránh các rác khác nếu có)
            if (data[key].word) {
                const item = { id: key, ...data[key] };
                allWords.push(item);

                // Thống kê level cho biểu đồ
                let lv = item.level || 1;
                if (lv > 5) lv = 5;
                levels[lv-1]++;

                // Lọc từ đến hạn học
                if (!item.nextReview || item.nextReview <= nowVN) {
                    dueWords.push(item);
                }
            }
        }
    }

    // Cập nhật giao diện
    document.getElementById('total-count').innerText = allWords.length;
    document.getElementById('due-count').innerText = dueWords.length;
    
    const listUI = document.getElementById('word-list');
    listUI.innerHTML = allWords.slice(-5).map(w => `
        <div class="word-item">
            <span>${w.word} (Lv.${w.level || 1})</span>
            <button style="width:auto; background:red; padding:2px 8px" onclick="deleteWord('${w.id}')">Xóa</button>
        </div>
    `).join('');

    initChart(levels);
    updateCard();
});

function updateCard() {
    const card = document.getElementById('card');
    if (dueWords.length > 0) {
        card.classList.remove('flipped');
        const item = dueWords[currentIndex % dueWords.length];
        document.getElementById('display-word').innerText = item.word;
        document.getElementById('display-def').innerText = item.def;
        document.getElementById('display-ex').innerText = item.ex || "";
    } else {
        document.getElementById('display-word').innerText = "Hoàn thành!";
        document.getElementById('display-def').innerText = "Hẹn gặp lại sau!";
    }
}

// Thuật toán Spaced Repetition
function processReview(isMastered) {
    if (dueWords.length === 0) return;
    const currentWord = dueWords[currentIndex % dueWords.length];
    
    let nextLevel = isMastered ? (currentWord.level || 1) + 1 : 1;
    let interval = isMastered ? Math.pow(nextLevel - 1, 2) * 24 * 60 * 60 * 1000 : 0;
    
    db.ref(currentWord.id).update({
        level: nextLevel,
        nextReview: Date.now() + interval
    });

    currentIndex++;
}

// Event Listeners
document.getElementById('card').addEventListener('click', function() {
    this.classList.toggle('flipped');
});

const mc = new Hammer(document.getElementById('card'));
mc.on("swipeleft", () => processReview(true));
mc.on("swiperight", () => processReview(false));

function deleteWord(id) {
    if(confirm("Xóa từ này?")) db.ref(id).remove();
}

function uploadCSV() {
    const file = document.getElementById('csv-file').files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const lines = e.target.result.split('\n');
        lines.forEach(line => {
            const col = line.split(',');
            if (col.length >= 2) {
                db.ref().push({
                    word: col[0].trim(),
                    def: col[1].trim(),
                    ex: col[2] ? col[2].trim() : "",
                    level: 1,
                    nextReview: Date.now()
                });
            }
        });
    };
    reader.readAsText(file, "UTF-8");
}
// 1. Firebase Configuration
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let words = [];
let currentIndex = 0;
const card = document.getElementById('card');

// 2. Load Data from Firebase
db.ref('flashcards').on('value', (snapshot) => {
    const data = snapshot.val();
    const now = Date.now();
    words = [];
    const listUI = document.getElementById('word-list');
    listUI.innerHTML = '';

    if (data) {
        for (let id in data) {
            // Filter: Only show words due for review
            if (!data[id].nextReview || data[id].nextReview <= now) {
                words.push({ id, ...data[id] });
            }
            listUI.innerHTML += `
                <div class="word-item">
                    <span>${data[id].word} (Lv.${data[id].level || 1})</span>
                    <button class="del-btn" onclick="deleteWord('${id}')">Xóa</button>
                </div>`;
        }
        document.getElementById('stats').innerText = `Cần học hôm nay: ${words.length} từ`;
        updateCard();
    } else {
        document.getElementById('display-word').innerText = "Trống";
        document.getElementById('stats').innerText = "Vui lòng nạp thêm từ vựng.";
    }
});

// 3. UI Update
function updateCard() {
    if (words.length > 0) {
        card.classList.remove('flipped');
        const item = words[currentIndex];
        document.getElementById('display-word').innerText = item.word;
        document.getElementById('display-def').innerText = item.def;
        document.getElementById('display-ex').innerText = item.ex || "";
    } else {
        document.getElementById('display-word').innerText = "Xong!";
        document.getElementById('display-def').innerText = "Đã hết từ cần học!";
    }
}

// 4. Algorithm & Swipe Logic
function processReview(isMastered) {
    if (words.length === 0) return;
    const currentWord = words[currentIndex];
    
    // Leitner Algorithm
    let nextLevel = isMastered ? (currentWord.level || 1) + 1 : 1;
    let interval = isMastered ? Math.pow(nextLevel - 1, 2) * 24 * 60 * 60 * 1000 : 0;
    
    db.ref('flashcards/' + currentWord.id).update({
        level: nextLevel,
        nextReview: Date.now() + interval
    });

    // Fade effect for smoother transition
    const inner = card.querySelector('.card-inner');
    inner.style.opacity = "0";
    setTimeout(() => {
        currentIndex = (currentIndex + 1) % (words.length || 1);
        inner.style.opacity = "1";
        updateCard();
    }, 300);
}

// Event Listeners
card.addEventListener('click', () => card.classList.toggle('flipped'));

const mc = new Hammer(card);
mc.on("swipeleft", () => processReview(true));   // Swipe Left = Mastered
mc.on("swiperight", () => processReview(false)); // Swipe Right = Review again

// 5. Admin Functions
function addWord() {
    const word = document.getElementById('input-word').value;
    const def = document.getElementById('input-def').value;
    const ex = document.getElementById('input-ex').value;
    if (word && def) {
        db.ref('flashcards').push({ word, def, ex, level: 1, nextReview: Date.now() });
        document.getElementById('input-word').value = '';
        document.getElementById('input-def').value = '';
        document.getElementById('input-ex').value = '';
    }
}

function deleteWord(id) {
    if(confirm("Xóa từ này vĩnh viễn?")) db.ref('flashcards/' + id).remove();
}

function uploadCSV() {
    const file = document.getElementById('csv-file').files[0];
    if (!file) return alert("Vui lòng chọn file CSV!");

    const reader = new FileReader();
    reader.onload = function(e) {
        const lines = e.target.result.split('\n');
        lines.forEach((line, i) => {
            if (i === 0 && line.toLowerCase().includes('word')) return;
            const col = line.split(',');
            if (col.length >= 2) {
                db.ref('flashcards').push({
                    word: col[0].trim(),
                    def: col[1].trim(),
                    ex: col[2] ? col[2].trim() : "",
                    level: 1,
                    nextReview: Date.now()
                });
            }
        });
        alert("Nạp thành công!");
    };
    reader.readAsText(file, "UTF-8");
}
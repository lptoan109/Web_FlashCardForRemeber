// 1. Cấu hình Firebase (Dán đoạn config bạn copy ở Bước 1 vào đây)
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

let words = [];
let currentIndex = 0;

// 2. Hàm Thêm từ lên Database
function addWord() {
    const word = document.getElementById('input-word').value;
    const def = document.getElementById('input-def').value;
    const ex = document.getElementById('input-ex').value;

    if (word && def) {
        db.ref('flashcards').push({
            word: word,
            def: def,
            ex: ex
        });
        // Xóa trống ô nhập sau khi nạp
        document.getElementById('input-word').value = '';
        document.getElementById('input-def').value = '';
    }
}

// 3. Hàm Lấy dữ liệu từ Database về máy (Thời gian thực)
db.ref('flashcards').on('value', (snapshot) => {
    const data = snapshot.val();
    words = [];
    const listUI = document.getElementById('word-list');
    listUI.innerHTML = ''; // Reset list

    for (let id in data) {
        words.push({ id, ...data[id] });
        
        // Hiển thị danh sách để Xóa
        listUI.innerHTML += `<li>${data[id].word} <button onclick="deleteWord('${id}')">Xóa</button></li>`;
    }
    updateCard();
});

// 4. Hàm Xóa từ khỏi Database
function deleteWord(id) {
    if(confirm("Bạn muốn xóa từ này?")) {
        db.ref('flashcards/' + id).remove();
    }
}

// Các hàm updateCard, nextCard, prevCard giữ nguyên như cũ...
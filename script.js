// 나라 데이터 (확장 가능, GeoJSON으로 대체 가능)
const countries = [
    { name_kr: "대한민국", name_en: "South Korea", coords: [37.5665, 126.9780], difficulty: "easy", outline: "M10,10 L100,10 L100,100 L10,100 Z" },
    { name_kr: "일본", name_en: "Japan", coords: [35.6762, 139.6503], difficulty: "medium", outline: "M20,20 L120,20 L120,120 L20,120 Z" },
    { name_kr: "미국", name_en: "USA", coords: [38.9072, -77.0369], difficulty: "hard", outline: "M30,30 L130,30 L130,130 L30,130 Z" },
    { name_kr: "중국", name_en: "China", coords: [39.9042, 116.4074], difficulty: "easy", outline: "M40,40 L140,40 L140,140 L40,140 Z" },
    { name_kr: "프랑스", name_en: "France", coords: [48.8566, 2.3522], difficulty: "medium", outline: "M50,50 L150,50 L150,150 L50,150 Z" }
];

// 매일 랜덤 나라 선택 (날짜 기반)
const today = new Date().toDateString();
let seed = today.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % countries.length;
let todayCountry = countries[seed];
let attempts = 0;
const maxAttempts = 6;

document.getElementById("country-outline").innerHTML = todayCountry.outline;
document.getElementById("difficulty").textContent = todayCountry.difficulty;
updateAttemptsLeft();

function updateAttemptsLeft() {
    document.getElementById("attempts-left").textContent = `${maxAttempts - attempts}`;
}

// 자동 완성 예시 (오타 방지)
const suggestions = [...countries.map(c => c.name_kr), ...countries.map(c => c.name_en)];
const datalist = document.getElementById("country-suggestions");
suggestions.forEach(suggestion => {
    const option = document.createElement("option");
    option.value = suggestion;
    datalist.appendChild(option);
});

function submitGuess() {
    const guessInput = document.getElementById("guess-input");
    const guess = guessInput.value.trim().toLowerCase();
    const correctName = todayCountry.name_kr.toLowerCase() || todayCountry.name_en.toLowerCase();
    attempts++;

    if (guess === correctName) {
        showResult(`성공! ${attempts}/6`);
        return;
    }

    if (attempts >= maxAttempts) {
        showResult(`실패! 정답은 ${todayCountry.name_kr}이었습니다.`);
        return;
    }

    const hint = calculateHint(guess);
    addHint(`${attempts}: ${hint}`);
    updateAttemptsLeft();
    guessInput.value = ""; // 입력창 초기화
}

function calculateHint(guess) {
    const guessedCountry = countries.find(c => c.name_kr.toLowerCase() === guess || c.name_en.toLowerCase() === guess);
    if (!guessedCountry) return "그런 나라는 없어요!";
    
    const distance = getDistance(todayCountry.coords, guessedCountry.coords);
    const direction = getDirection(todayCountry.coords, guessedCountry.coords);
    return `${Math.round(distance)}km ${direction}`;
}

function getDistance(coords1, coords2) {
    // 간단한 유클리드 거리 (실제론 Haversine 공식으로 수정 가능)
    const dx = coords1[0] - coords2[0];
    const dy = coords1[1] - coords2[1];
    return Math.sqrt(dx * dx + dy * dy) * 100; // 임시 스케일 조정
}

function getDirection(coords1, coords2) {
    const dy = coords2[0] - coords1[0];
    const dx = coords2[1] - coords1[1];
    if (dx > 0 && dy > 0) return "북동쪽";
    if (dx > 0 && dy < 0) return "남동쪽";
    if (dx < 0 && dy > 0) return "북서쪽";
    if (dx < 0 && dy < 0) return "남서쪽";
    if (dx > 0) return "동쪽";
    if (dx < 0) return "서쪽";
    if (dy > 0) return "북쪽";
    if (dy < 0) return "남쪽";
    return "";
}

function addHint(hint) {
    const hintsDiv = document.getElementById("hints");
    hintsDiv.innerHTML += `<p>${hint}</p>`;
}

function showResult(message) {
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = `${message} <button onclick="shareResult()">공유</button>`;
    document.getElementById("guess-input").disabled = true;
    document.querySelector("button").disabled = true;
}

function shareResult() {
    const text = `지들 ${attempts}/6, 난이도: ${todayCountry.difficulty}\n${document.getElementById("hints").innerText}\nhttps://jidle.kr`;
    navigator.clipboard.writeText(text);
    alert("결과가 클립보드에 복사됐습니다!");
}

// 모달 기능
function showStats() {
    document.getElementById("modal-content").innerHTML = "<h2>기록</h2><p>아직 기록이 없습니다. 게임을 더 플레이해보세요!</p>";
    document.getElementById("modal").style.display = "block";
}

function showSettings() {
    document.getElementById("modal-content").innerHTML = "<h2>설정</h2><p>언어: 한글/영어 (현재 한글)</p><button onclick='toggleLanguage()'>언어 전환</button>";
    document.getElementById("modal").style.display = "block";
}

function showHowToPlay() {
    document.getElementById("modal-content").innerHTML = "<h2>게임 방법</h2><p>1. 윤곽선을 보고 나라를 추측하세요.<br>2. 6번 기회 안에 맞추세요.<br>3. 힌트로 거리와 방향이 제공됩니다.<br>4. 한글 또는 영어로 입력 가능합니다.</p>";
    document.getElementById("modal").style.display = "block";
}

function closeModal() {
    document.getElementById("modal").style.display = "none";
}

function toggleLanguage() {
    alert("언어 전환 기능은 준비 중입니다!");
    // 여기에 한글/영어 전환 로직 추가 가능
}

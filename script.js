// 간단한 나라 데이터 (확장 가능)
const countries = [
    { name: "대한민국", coords: [37.5665, 126.9780], outline: "M10,10 L100,10 L100,100 L10,100 Z" }, // 임시 SVG 경로
    { name: "일본", coords: [35.6762, 139.6503], outline: "M20,20 L120,20 L120,120 L20,120 Z" },
    { name: "미국", coords: [38.9072, -77.0369], outline: "M30,30 L130,30 L130,130 L30,130 Z" }
];

// 오늘의 나라 (임시로 고정, 나중에 랜덤화)
const todayCountry = countries[0]; // 대한민국
let attempts = 0;
const maxAttempts = 6;

document.getElementById("country-outline").innerHTML = todayCountry.outline;

function submitGuess() {
    const guess = document.getElementById("guess-input").value.trim();
    attempts++;

    if (guess === todayCountry.name) {
        showResult(`성공! ${attempts}/6`);
        return;
    }

    if (attempts >= maxAttempts) {
        showResult(`실패! 정답은 ${todayCountry.name}이었습니다.`);
        return;
    }

    const hint = calculateHint(guess);
    addHint(`${attempts}: ${hint}`);
    document.getElementById("guess-input").value = ""; // 입력창 초기화
}

function calculateHint(guess) {
    const guessedCountry = countries.find(c => c.name === guess);
    if (!guessedCountry) return "그런 나라는 없어요!";
    
    const distance = getDistance(todayCountry.coords, guessedCountry.coords);
    const direction = getDirection(todayCountry.coords, guessedCountry.coords);
    return `${Math.round(distance)}km ${direction}`;
}

function getDistance(coords1, coords2) {
    // 간단한 유클리드 거리 (실제론 Haversine 공식 써야 함)
    const dx = coords1[0] - coords2[0];
    const dy = coords1[1] - coords2[1];
    return Math.sqrt(dx * dx + dy * dy) * 100; // 임시로 스케일 조정
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
    const text = `지들 ${attempts}/6\n${document.getElementById("hints").innerText}\nhttps://jidle.kr`;
    navigator.clipboard.writeText(text);
    alert("결과가 클립보드에 복사됐습니다!");
}

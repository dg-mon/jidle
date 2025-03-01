// countries.geojson을 로드
fetch('countries.geojson')
    .then(response => response.json())
    .then(data => {
        const countries = data.features.map(feature => ({
            name_kr: feature.properties.name_ko,
            name_en: feature.properties.name,
            coords: getCentroid(feature.geometry.coordinates),
            difficulty: feature.properties.difficulty,
            outline: JSON.stringify(feature.geometry)
        }));

        // 매일 랜덤 나라 선택 (날짜 기반)
        const today = new Date().toDateString();
        let seed = today.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % countries.length;
        let todayCountry = countries[seed];
        let attempts = 0;
        const maxAttempts = 6;

        document.getElementById("country-outline").innerHTML = getSVGPath(todayCountry.outline);
        document.getElementById("difficulty").textContent = todayCountry.difficulty;
        updateAttemptsLeft();

        // 자동 완성 예시 (오타 방지)
        const suggestions = [...countries.map(c => c.name_kr), ...countries.map(c => c.name_en)];
        const datalist = document.getElementById("country-suggestions");
        suggestions.forEach(suggestion => {
            const option = document.createElement("option");
            option.value = suggestion;
            datalist.appendChild(option);
        });

        function updateAttemptsLeft() {
            document.getElementById("attempts-left").textContent = `${maxAttempts - attempts}`;
        }

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
            guessInput.value = "";
        }

        function calculateHint(guess) {
            const guessedCountry = countries.find(c => 
                c.name_kr.toLowerCase() === guess || c.name_en.toLowerCase() === guess);
            if (!guessedCountry) return "그런 나라는 없어요!";
            
            const distance = getDistance(todayCountry.coords, guessedCountry.coords);
            const direction = getDirection(todayCountry.coords, guessedCountry.coords);
            return `${Math.round(distance)}km ${direction}`;
        }

        function getDistance(coords1, coords2) {
            const R = 6371; // 지구 반지름 (km)
            const toRad = deg => deg * Math.PI / 180;
            const dLat = toRad(coords2[0] - coords1[0]);
            const dLon = toRad(coords2[1] - coords1[1]);
            const lat1 = toRad(coords1[0]);
            const lat2 = toRad(coords2[0]);

            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
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
        }

        // 중심 좌표 계산 (Turf.js 사용)
        function getCentroid(coordinates) {
            const polygon = turf.polygon(coordinates);
            const centroid = turf.centroid(polygon);
            return [centroid.geometry.coordinates[1], centroid.geometry.coordinates[0]];
        }

        // SVG 경로 생성
        function getSVGPath(geojsonGeometry) {
            const geometry = JSON.parse(geojsonGeometry);
            if (geometry.type === "Polygon") {
                return geometry.coordinates[0].map(coord => `L${coord[0]},${coord[1]}`).join(" ") + "Z";
            }
            if (geometry.type === "MultiPolygon") {
                return geometry.coordinates.map(polygon => 
                    polygon[0].map(coord => `L${coord[0]},${coord[1]}`).join(" ") + "Z"
                ).join(" ");
            }
            return "";
        }
    })
    .catch(error => console.error("GeoJSON 로드 실패:", error));

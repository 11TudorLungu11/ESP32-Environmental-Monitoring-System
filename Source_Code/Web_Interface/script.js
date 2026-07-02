const tempValue = document.getElementById("tempValue");
const humidityValue = document.getElementById("humidityValue");
const lightValue = document.getElementById("lightValue");
const stateValue = document.getElementById("stateValue");
const songValue = document.getElementById("songValue");

const playBtn = document.getElementById("playBtn");
const stopBtn = document.getElementById("stopBtn");
const nextBtn = document.getElementById("nextBtn");

const audioPlayer = document.getElementById("audioPlayer");
const liveClock = document.getElementById("liveClock");
const aiStatus = document.getElementById("aiStatus");
const weatherInfo = document.getElementById("weatherInfo");
const visualizer = document.querySelector(".visualizer");
const espStatus = document.getElementById("espStatus");

const FIREBASE_URL = "https://tpi-proiect-76221-default-rtdb.firebaseio.com/esp32.json";

const API_KEY = "4f61ee5adbd09e3802fa79c4e26e9280";
const CITY = "Bucharest";
const WEATHER_URL = `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric&lang=ro`;

let espConnected = false;

const songs = {
    relaxare: ["Calm Evening.mp3"],
    concentrare: ["Focus Mode.mp3"],
    energie: ["Energy Boost.mp3"],
    alerta: ["Focus Mode.mp3"]
};

window.addEventListener("load", function () {
    const loader = document.getElementById("loader");

    if (loader) {
        setTimeout(function () {
            loader.classList.add("loader-hidden");
        }, 1500);
    }
});

function updateClock() {
    if (!liveClock) return;

    const now = new Date();

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    liveClock.textContent = `${hours}:${minutes}:${seconds}`;
}

function getWeatherIcon(condition) {
    if (condition.includes("rain")) return "🌧️";
    if (condition.includes("cloud")) return "☁️";
    if (condition.includes("clear")) return "☀️";
    if (condition.includes("snow")) return "❄️";
    if (condition.includes("mist") || condition.includes("fog")) return "🌫️";
    return "🌡️";
}

async function updateWeatherInfo() {
    if (!weatherInfo) return;

    try {
        const response = await fetch(WEATHER_URL);
        const data = await response.json();

        const temp = Math.round(data.main.temp);
        const condition = data.weather[0].main.toLowerCase();
        const icon = getWeatherIcon(condition);

        weatherInfo.textContent = `${icon} Exterior: ${temp}°C`;
    } catch (error) {
        weatherInfo.textContent = "🌡️ Exterior: indisponibil";
    }
}

function updateEspStatus() {
    if (!espStatus) return;

    if (espConnected) {
        espStatus.textContent = "🟢 ESP32 Connected";
        espStatus.classList.remove("esp-off");
        espStatus.classList.add("esp-on");
    } else {
        espStatus.textContent = "🔴 ESP32 Offline";
        espStatus.classList.remove("esp-on");
        espStatus.classList.add("esp-off");
    }
}

function generateSensorData() {
    const temperature = Math.floor(Math.random() * 16) + 18;
    const humidity = Math.floor(Math.random() * 41) + 30;
    const light = Math.floor(Math.random() * 801) + 100;

    return {
        temperature,
        humidity,
        light
    };
}

async function getFirebaseData() {
    try {
        const response = await fetch(FIREBASE_URL);
        const data = await response.json();

        if (!data) {
            espConnected = false;
            updateEspStatus();
            return null;
        }

        espConnected = data.status === "online";
        updateEspStatus();

        return {
            temperature: data.temperature,
            humidity: data.humidity,
            light: data.light
        };
    } catch (error) {
        console.log("Eroare Firebase:", error);
        espConnected = false;
        updateEspStatus();
        return null;
    }
}

function aiDecision(data) {
    if (data.temperature > 29 || data.humidity > 65) {
        return "alerta";
    }

    if (data.light < 250 && data.temperature >= 20 && data.temperature <= 26) {
        return "relaxare";
    }

    if (data.light >= 250 && data.light <= 550 && data.humidity <= 60) {
        return "concentrare";
    }

    if (data.light > 550 && data.temperature >= 24) {
        return "energie";
    }

    return "relaxare";
}

function chooseSong(state) {
    const list = songs[state];
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
}

async function updateDashboard() {
    if (!tempValue || !humidityValue || !lightValue || !stateValue || !songValue || !aiStatus) return;

    const firebaseData = await getFirebaseData();
    const data = firebaseData || generateSensorData();

    const state = aiDecision(data);
    const song = chooseSong(state);

    tempValue.textContent = `${data.temperature}°C`;
    humidityValue.textContent = `${data.humidity}%`;
    lightValue.textContent = `${data.light} lux`;

    if (state === "relaxare") {
        stateValue.textContent = "Relaxare";
        aiStatus.textContent = "Low light detected. Ambient state: Relaxare. Sistemul recomandă o melodie calmă.";
    } else if (state === "concentrare") {
        stateValue.textContent = "Concentrare";
        aiStatus.textContent = "Balanced light and humidity detected. Ambient state: Concentrare. Sistemul recomandă muzică pentru focus.";
    } else if (state === "energie") {
        stateValue.textContent = "Energie";
        aiStatus.textContent = "High light level detected. Ambient state: Energie. Sistemul recomandă o melodie dinamică.";
    } else {
        stateValue.textContent = "Alertă ambientală";
        aiStatus.textContent = "High temperature or humidity detected. Ambient state: Alertă. Sistemul recomandă atenție asupra mediului.";
    }

    songValue.textContent = song;
}

if (playBtn && audioPlayer && songValue && visualizer) {
    playBtn.addEventListener("click", function () {
        audioPlayer.src = `music/${songValue.textContent}`;
        audioPlayer.play();

        visualizer.classList.remove("paused");
    });
}

if (stopBtn && audioPlayer && visualizer) {
    stopBtn.addEventListener("click", function () {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;

        visualizer.classList.add("paused");
    });
}

if (nextBtn && audioPlayer && songValue && visualizer) {
    nextBtn.addEventListener("click", function () {
        updateDashboard();

        audioPlayer.src = `music/${songValue.textContent}`;
        audioPlayer.play();

        visualizer.classList.remove("paused");
    });
}

if (visualizer) {
    visualizer.classList.add("paused");
}

updateClock();
setInterval(updateClock, 1000);

updateWeatherInfo();
setInterval(updateWeatherInfo, 600000);

updateEspStatus();

updateDashboard();
setInterval(updateDashboard, 5000);


document.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function (event) {
        const href = link.getAttribute("href");

        if (href && href.endsWith(".html")) {
            event.preventDefault();

            const loader = document.getElementById("loader");

            if (loader) {
                loader.classList.remove("loader-hidden");
            }

            setTimeout(function () {
                window.location.href = href;
            }, 600);
        }
    });
});

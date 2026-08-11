const searchInput = document.querySelector("#city-input");
const searchBtn = document.querySelector("#search-btn");

const tempElement = document.querySelector(".temp");
const cityElement = document.querySelector(".city");
const windElement = document.querySelector(".wind");

// 1. Головна асинхронна функція для пошуку погоди за назвою міста
async function searchWeather(city) {
    if (!city.trim()) return;

    try {
        // 1. Спочатку шукаємо без жорсткої прив'язки мови (розуміє і кирилицю, і латинку)
        let geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=10&format=json`;
        let geoResponse = await fetch(geoUrl);
        let geoData = await geoResponse.json();

        // 2. Якщо не знайшли, пробуємо з мовою uk
        if (!geoData.results || geoData.results.length === 0) {
            geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=10&language=uk&format=json`;
            geoResponse = await fetch(geoUrl);
            geoData = await geoResponse.json();
        }

        // Якщо все одно не знайшли
        if (!geoData.results || geoData.results.length === 0) {
            alert("Місто не знайдено! Перевірте назву.");
            return;
        }

        const location = geoData.results[0];
        const { latitude, longitude, name } = location;

        // Отримуємо погоду
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        // Оновлюємо інтерфейс
        cityElement.textContent = name;
        tempElement.textContent = Math.round(weatherData.current_weather.temperature) + "°C";
        windElement.textContent = weatherData.current_weather.windspeed + " km/h";

    } catch (error) {
        console.error("Error:", error);
        alert("Помилка при отриманні даних.");
    }
}
// 2. Функція-обробник для запуску пошуку
function handleSearch() {
    const city = searchInput.value;
    searchWeather(city);
}

// Подія кліку на кнопку
searchBtn.addEventListener("click", handleSearch);

// Подія натискання Enter в інпуті
searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        handleSearch();
    }
});
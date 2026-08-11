const searchInput = document.querySelector("#city-input");
const searchBtn = document.querySelector("#search-btn");
const suggestionsBox = document.querySelector("#suggestions");

const tempElement = document.querySelector(".temp");
const cityElement = document.querySelector(".city");
const windElement = document.querySelector(".wind");

let debounceTimer;

// Допоміжна функція для короткого форматування: Назва, Область, Країна
function formatLocationName(item) {
    if (!item) return "";
    
    // Якщо це відповідь від Nominatim з об'єктом address
    if (item.address) {
        const addr = item.address;
        const name = addr.village || addr.town || addr.city || addr.hamlet || item.name;
        const state = addr.state || "";
        const country = addr.country || "";

        return [name, state, country].filter(Boolean).join(", ");
    }

    // Для звичайного рядка
    return item.name || item;
}

// Пошук погоди
async function searchWeather(queryOrCoords) {
    let latitude, longitude, formattedName;

    try {
        if (typeof queryOrCoords === "object" && queryOrCoords.lat) {
            latitude = queryOrCoords.lat;
            longitude = queryOrCoords.lon;
            formattedName = formatLocationName(queryOrCoords);
        } else {
            let query = typeof queryOrCoords === "string" ? queryOrCoords.trim() : searchInput.value.trim();
            if (!query) return;

            const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1&accept-language=uk`;
            const geoResponse = await fetch(geoUrl);
            const geoData = await geoResponse.json();

            if (!geoData || geoData.length === 0) {
                alert("Населений пункт не знайдено!");
                return;
            }

            latitude = geoData[0].lat;
            longitude = geoData[0].lon;
            formattedName = formatLocationName(geoData[0]);
        }

        // Запит погоди
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        const { temperature, windspeed } = weatherData.current_weather;

        cityElement.textContent = formattedName;
        tempElement.textContent = Math.round(temperature) + "°C";
        windElement.textContent = windspeed + " km/h";

        suggestionsBox.style.display = "none";
    } catch (error) {
        console.error("Error:", error);
    }
}

// Підказки (також лаконічні)
async function fetchSuggestions(query) {
    if (query.trim().length < 2) {
        suggestionsBox.style.display = "none";
        return;
    }

    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=8&countrycodes=ua&accept-language=uk`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data || data.length === 0) {
            suggestionsBox.style.display = "none";
            return;
        }

        suggestionsBox.innerHTML = "";
        data.forEach((item) => {
            const div = document.createElement("div");
            div.classList.add("suggestion-item");
            
            // Відображаємо тільки: Назва (Область)
            const addr = item.address;
            const name = addr.village || addr.town || addr.city || item.name;
            const state = addr.state ? ` (${addr.state})` : "";
            
            div.textContent = `${name}${state}`;

            div.addEventListener("click", () => {
                searchInput.value = name;
                suggestionsBox.style.display = "none";
                searchWeather(item);
            });

            suggestionsBox.appendChild(div);
        });

        suggestionsBox.style.display = "block";
    } catch (err) {
        console.error("Suggestions error:", err);
    }
}

searchInput.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        fetchSuggestions(e.target.value);
    }, 400);
});

document.addEventListener("click", (e) => {
    if (!e.target.closest(".input-wrapper")) {
        suggestionsBox.style.display = "none";
    }
});

searchBtn.addEventListener("click", () => {
    searchWeather(searchInput.value);
});

searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        searchWeather(searchInput.value);
    }
});

searchWeather("Kyiv");
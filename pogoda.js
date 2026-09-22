(function () {
    'use strict';

    function plugin() {
        // База Днів Ангела (можна розширювати)
        const nameDaysUA = {
            "01-01": "Василь, Григорій, Петро",
            "01-07": "Іван, Христина",
            "01-25": "Тетяна, Ілля",
            "03-08": "Олександр, Антон",
            "05-06": "Георгій, Юрій",
            "07-07": "Іван, Яків",
            "07-28": "Володимир, Ольга",
            "09-22": "Йосип, Анна, Микита, Феофан",
            "10-14": "Роман, Покрова",
            "11-21": "Михайло, Гавриїл",
            "12-06": "Микола",
            "12-25": "Марія, Давид"
        };

        // Декодер кодів погоди WMO
        function getWeatherDescription(code) {
            const map = {
                0: "☀️ Ясно",
                1: "🌤 Переважно ясно",
                2: "⛅ Хмарно",
                3: "☁️ Похмуро",
                45: "🌫 Туман", 48: "🌫 Паморозь",
                51: "🌧 Мряка", 53: "🌧 Мряка", 55: "🌧 Мряка",
                61: "🌧 Невеликий дощ", 63: "🌧 Дощ", 65: "🌧 Сильний дощ",
                71: "❄️ Невеликий сніг", 73: "❄️ Сніг", 75: "❄️ Сильний сніг",
                80: "🌧 Злива", 81: "🌧 Злива", 82: "🌧 Сильна злива",
                95: "🌩 Гроза"
            };
            return map[code] || "🌤";
        }

        function initLocation() {
            const defaultLat = 50.4501;
            const defaultLon = 30.5234;

            if (!navigator.geolocation) {
                fetchData(defaultLat, defaultLon, "Київ", "UA");
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;
                    try {
                        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=uk`);
                        const geoData = await geoRes.json();
                        const city = geoData.address.city || geoData.address.town || geoData.address.village || "Україна";
                        const countryCode = geoData.address.country_code ? geoData.address.country_code.toUpperCase() : "UA";

                        fetchData(lat, lon, city, countryCode);
                    } catch (e) {
                        fetchData(defaultLat, defaultLon, "Київ", "UA");
                    }
                },
                () => {
                    fetchData(defaultLat, defaultLon, "Україна", "UA");
                }
            );
        }

        async function fetchData(lat, lon, city, countryCode) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            const monthDayStr = `${month}-${day}`;

            // 1. Погода за координатами (Open-Meteo API)
            let tempStr = "";
            let weatherDesc = "";
            try {
                const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
                if (weatherRes.ok) {
                    const weatherData = await weatherRes.json();
                    const current = weatherData.current_weather;
                    const temp = Math.round(current.temperature);
                    tempStr = `${temp > 0 ? '+' : ''}${temp}°C`;
                    weatherDesc = getWeatherDescription(current.weathercode);
                }
            } catch (e) {}

            // 2. Офіційні державні свята
            let holiday = "Звичайний день";
            try {
                const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
                if (res.ok) {
                    const list = await res.json();
                    const todayH = list.filter(h => h.date === dateStr);
                    if (todayH.length > 0) {
                        holiday = todayH.map(h => h.localName || h.name).join(", ");
                    }
                }
            } catch (e) {}

            // 3. День ангела
            let nameday = nameDaysUA[monthDayStr] || "Інформація відсутня";

            // 4. Спливаюче сповіщення в Lampa
            if (window.Lampa && Lampa.Noty) {
                Lampa.Noty.show(`📍 <b>${city}</b> ${tempStr} ${weatherDesc}<br>🎉 Свято: ${holiday}<br>👼 День ангела: ${nameday}`);
            }

            // 5. Віджет у вершній панелі (шапці) Lampa
            if (window.$) {
                let headActions = $('.head__actions');
                if (headActions.length) {
                    let infoWidget = $(`
                        <div class="head__action" style="padding: 0 12px; font-size: 11px; text-align: right; color: #fff; display: flex; flex-direction: column; justify-content: center;">
                            <div style="color: #4cd964; font-weight: bold;">📍 ${city} ${tempStr} ${weatherDesc}</div>
                            <div style="opacity: 0.85;">🎉 ${holiday}</div>
                        </div>
                    `);
                    headActions.prepend(infoWidget);
                }
            }
        }

        initLocation();
    }

    if (window.appready) {
        plugin();
    } else {
        if (window.Lampa && Lampa.Listener) {
            Lampa.Listener.follow('app', function (e) {
                if (e.type == 'ready') plugin();
            });
        }
    }
})();

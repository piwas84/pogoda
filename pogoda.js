!(function () {
    "use strict";

    Lampa.Platform.tv();

    if (window.weather_plugin) return;
    window.weather_plugin = true;

    // Співставлення кодів Open-Meteo з українськими описами
    var openMeteoCodes = {
        0: "Ясно",
        1: "Ясно",
        2: "Мінлива хмарність",
        3: "Похмуро",
        45: "Туман",
        48: "Крижаний туман",
        51: "Слабка мряка",
        53: "Невелика мряка",
        55: "Невелика мряка",
        56: "Слабка мряка",
        57: "Невелика мряка",
        61: "Слабкий дощ",
        63: "Помірний дощ",
        65: "Сильний дощ",
        66: "Невеликий дощ зі снігом",
        67: "Помірний або сильний дощ зі снігом",
        71: "Невеликий сніг",
        73: "Помірний сніг",
        75: "Сильний сніг",
        77: "Невеликий сніг",
        80: "Легка злива",
        81: "Зливовий дощ",
        82: "Проливний дощ",
        85: "Невеликий сніг",
        86: "Сильний сніг",
        95: "Гроза",
        96: "Град",
        99: "Град"
    };

    // Співставлення кодів OpenWeatherMap з українськими описами
    var openWeatherCodes = {
        200: "Невеликий дощ із грозою",
        201: "Помірний або сильний дощ із грозою",
        202: "Помірний або сильний дощ із грозою",
        210: "Гроза",
        211: "Гроза",
        212: "Гроза",
        221: "Гроза",
        230: "Невеликий дощ із грозою",
        231: "Помірний або сильний дощ із грозою",
        232: "Помірний або сильний дощ із грозою",
        300: "Слабка мряка",
        301: "Невелика мряка",
        302: "Невелика мряка",
        310: "Слабкий дощ",
        311: "Невеликий дощ",
        312: "Помірний дощ",
        313: "Легка злива",
        314: "Зливовий дощ",
        321: "Легка злива",
        500: "Слабкий дощ",
        501: "Помірний дощ",
        502: "Сильний дощ",
        503: "Сильний дощ",
        504: "Проливний дощ",
        511: "Невеликий дощ зі снігом",
        520: "Легка злива",
        521: "Зливовий дощ",
        522: "Проливний дощ",
        531: "Зливовий дощ",
        600: "Невеликий сніг",
        601: "Помірний сніг",
        602: "Сильний сніг",
        611: "Дощ зі снігом",
        612: "Невеликий дощ зі снігом",
        613: "Дощ зі снігом",
        615: "Невеликий дощ зі снігом",
        616: "Помірний або сильний дощ зі снігом",
        620: "Невеликий сніг",
        621: "Помірний сніг",
        622: "Сильний сніг",
        701: "Серпанок",
        711: "Задимлення",
        721: "Серпанок",
        731: "Сильна піщана буря",
        741: "Туман",
        751: "Сильна піщана буря",
        761: "Сильна піщана буря",
        762: "Задимлення",
        771: "Хуртовина",
        781: "Хуртовина",
        800: "Ясно",
        801: "Мінлива хмарність",
        802: "Мінлива хмарність",
        803: "Хмарно",
        804: "Похмуро"
    };

    var currentWeatherData = null;
    var forecastData = null;

    function getProvider() {
        return Lampa.Storage.get("weather_provider", "weatherapi") || "weatherapi";
    }

    function getWeatherApiKey() {
        return (Lampa.Storage.get("weather_key_weatherapi", "") || "").trim() || "46a5d8546cc340f69d9123207242801";
    }

    function getOpenWeatherKey() {
        return (Lampa.Storage.get("weather_key_openweathermap", "") || "").trim() || "d3097d162509b55b3fcdcb13f1c81093";
    }

    function getWindDirection(deg) {
        var dirs = ["Пн", "ПнСх", "Сх", "ПдСх", "Пд", "ПдЗх", "Зх", "ПнЗх"];
        return dirs[Math.round(((deg || 0) % 360) / 45) % 8];
    }

    function getDetailIcon(type) {
        var icons = {
            location: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#FF6B6B" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7m0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5"/></svg>',
            wind: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#87CEEB" d="M4 10a1 1 0 0 1 0-2h8a1 1 0 1 1 0 2zm5 4a1 1 0 1 0 0 2h7a1 1 0 0 0 0-2zm-3 4a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2z"/></svg>',
            humidity: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#4FC3F7" d="M12 2c-5.33 4.55-8 8.48-8 11.8c0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8m0 18c-3.35 0-6-2.57-6-6.2c0-2.34 1.95-5.44 6-9.14c4.05 3.7 6 6.79 6 9.14c0 3.63-2.65 6.2-6 6.2"/></svg>',
            cloud: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#B0BEC5" d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5c0-2.64-2.05-4.78-4.65-4.96"/></svg>',
            pressure: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#FF9800" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 13l-3.5-3.5l1.42-1.42L12 12.17l2.08-2.09l1.42 1.42z"/></svg>',
            visibility: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#66BB6A" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5M12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5s5 2.24 5 5s-2.24 5-5 5m0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3s3-1.34 3-3s-1.34-3-3-3"/></svg>',
            uv: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5" fill="#FFD700"/><g stroke="#FFD700" stroke-width="2" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/></g></svg>',
            gust: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#AB47BC" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m0 18a8 8 0 1 1 8-8a8 8 0 0 1-8 8m0-13v5l4 2.5l-0.75 1.23L11 13V7z"/></svg>',
            calendar: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#4DB6AC" d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg>',
            details: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#FFB74D" d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>'
        };
        return icons[type] || "";
    }

    var WeatherService = new function () {
        var widgetElem = null;
        var request = new Lampa.Reguest();
        var updateTimer = null;
        var self = this;
        var retryCount = 0;

        function updateWidgetUI(data) {
            retryCount = 0;
            currentWeatherData = data;
            var loc = data.location;
            var cur = data.current;
            var tempInt = Math.floor(cur.temp_c);

            console.log("Погода", "Місто: " + loc.name);
            console.log("Погода", "Широта: " + loc.lat + ", Довгота: " + loc.lon);
            console.log("Погода", "Температура: " + tempInt + "°");
            console.log("Погода", "Умови: " + cur.condition.text);

            $("#weather-temp").text(tempInt + "°").css({ "font-size": "1.5em", "font-weight": "600", "margin-right": "0.3em" });

            var iconSvg = self.getIcon(cur.condition, cur.is_day) ||
                '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="#808080"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="12">?</text></svg>';

            $("#weather-condition").html(iconSvg);
            $("#weather-condition svg").css({
                display: "inline-block",
                width: "1.8em",
                height: "1.8em",
                "max-width": "1.8em",
                "max-height": "1.8em"
            });
        }

        function showForecastModal(data) {
            forecastData = data;
            if (!currentWeatherData) {
                Lampa.Noty.show("Дані погоди ще не завантажено");
                return;
            }

            var curData = currentWeatherData;
            var $modalContent = $('<div style="padding: 0.5em;">');

            // Блок розташування та поточної погоди
            var locHtml = '<div style="display: flex; align-items: center; font-size: 1.6em; margin-bottom: 0.8em; font-weight: bold;">' +
                '<span class="weather-detail-icon" style="margin-right: 0.5em;">' + getDetailIcon("location") + '</span> Місцезнаходження</div>' +
                '<div style="margin-bottom: 2em; border: 1px solid rgba(255,255,255,0.2); border-radius: 0.5em; padding: 0.8em;">' +
                '<div style="font-size: 1.3em; margin-bottom: 0.5em;">' + curData.location.name + ", " + curData.location.country + '</div>' +
                '<div style="display: flex; justify-content: space-between; align-items: center;">' +
                '<div style="font-size: 2.5em;">' + Math.floor(curData.current.temp_c) + '°C</div>' +
                '<div style="text-align: right; font-size: 1.1em;">' +
                '<div style="margin-bottom: 0.3em;">Відчувається як ' + Math.floor(curData.current.feelslike_c) + '°C</div>' +
                '<div>' + curData.current.condition.text + '</div></div></div></div>';

            $modalContent.append(locHtml);

            // Блок деталей
            var detailsHtml = '<div style="display: flex; align-items: center; font-size: 1.6em; margin: 2em 0 0.8em; font-weight: bold;">' +
                '<span class="weather-detail-icon" style="margin-right: 0.5em;">' + getDetailIcon("details") + '</span> Подробиці</div>' +
                '<div style="margin-bottom: 2em; border: 1px solid rgba(255,255,255,0.2); border-radius: 0.5em; overflow: hidden;">' +
                '<div style="display: flex; justify-content: space-between; align-items: center; height: 2.8em; padding: 0 0.8em; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 1.1em;"><span style="display: flex; align-items: center;"><span class="weather-detail-icon" style="margin-right: 0.5em;">' + getDetailIcon("wind") + '</span>Вітер</span><span style="margin-left: auto;">' + curData.current.wind_kph + ' км/год ' + curData.current.wind_dir + '</span></div>' +
                '<div style="display: flex; justify-content: space-between; align-items: center; height: 2.8em; padding: 0 0.8em; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 1.1em;"><span style="display: flex; align-items: center;"><span class="weather-detail-icon" style="margin-right: 0.5em;">' + getDetailIcon("humidity") + '</span>Вологість</span><span style="margin-left: auto;">' + curData.current.humidity + '%</span></div>' +
                '<div style="display: flex; justify-content: space-between; align-items: center; height: 2.8em; padding: 0 0.8em; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 1.1em;"><span style="display: flex; align-items: center;"><span class="weather-detail-icon" style="margin-right: 0.5em;">' + getDetailIcon("cloud") + '</span>Хмарність</span><span style="margin-left: auto;">' + curData.current.cloud + '%</span></div>' +
                '<div style="display: flex; justify-content: space-between; align-items: center; height: 2.8em; padding: 0 0.8em; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 1.1em;"><span style="display: flex; align-items: center;"><span class="weather-detail-icon" style="margin-right: 0.5em;">' + getDetailIcon("pressure") + '</span>Тиск</span><span style="margin-left: auto;">' + curData.current.pressure_mb + ' мбар</span></div>' +
                '<div style="display: flex; justify-content: space-between; align-items: center; height: 2.8em; padding: 0 0.8em; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 1.1em;"><span style="display: flex; align-items: center;"><span class="weather-detail-icon" style="margin-right: 0.5em;">' + getDetailIcon("visibility") + '</span>Видимість</span><span style="margin-left: auto;">' + curData.current.vis_km + ' км</span></div>' +
                '<div style="display: flex; justify-content: space-between; align-items: center; height: 2.8em; padding: 0 0.8em; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 1.1em;"><span style="display: flex; align-items: center;"><span class="weather-detail-icon" style="margin-right: 0.5em;">' + getDetailIcon("uv") + '</span>УФ-індекс</span><span style="margin-left: auto;">' + curData.current.uv + '</span></div>' +
                '<div style="display: flex; justify-content: space-between; align-items: center; height: 2.8em; padding: 0 0.8em; font-size: 1.1em;"><span style="display: flex; align-items: center;"><span class="weather-detail-icon" style="margin-right: 0.5em;">' + getDetailIcon("gust") + '</span>Пориви вітру</span><span style="margin-left: auto;">' + curData.current.gust_kph + ' км/год</span></div></div>';

            $modalContent.append(detailsHtml);

            // Блок прогнозу на 3 дні
            if (forecastData && forecastData.forecast) {
                var forecastList = forecastData.forecast.forecastday;
                var fcHtml = '<div style="display: flex; align-items: center; font-size: 1.6em; margin: 2em 0 0.8em; font-weight: bold;"><span class="weather-detail-icon" style="margin-right: 0.5em;">' + getDetailIcon("calendar") + '</span> Прогноз на 3 дні</div><div style="margin-bottom: 1em; border: 1px solid rgba(255,255,255,0.2); border-radius: 0.5em; overflow: hidden;">';

                for (var i = 0; i < forecastList.length; i++) {
                    var dayItem = forecastList[i];
                    var dObj = new Date(dayItem.date);
                    var dayTitle = i === 0 ? "Сьогодні" : i === 1 ? "Завтра" : ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"][dObj.getDay()];
                    var dayIcon = self.getIcon(dayItem.day.condition, 1) || "";

                    fcHtml += '<div style="display: flex; justify-content: space-between; align-items: center; height: 2.8em; padding: 0 0.8em;' + (i === forecastList.length - 1 ? "" : " border-bottom: 1px solid rgba(255,255,255,0.1);") + ' font-size: 1.1em;">' +
                        '<div style="font-size: 1.1em; display: flex; align-items: center; flex-shrink: 0;">' + dayTitle + " " + dObj.getDate() + "." + (dObj.getMonth() + 1) + '</div>' +
                        '<div style="display: flex; align-items: center; margin-left: auto;">' +
                        '<span style="color: #FF8A80; display: flex; align-items: center; justify-content: center; font-size: 1.1em; width: 1.8em;">' + Math.floor(dayItem.day.maxtemp_c) + '°</span>' +
                        '<div style="border-left: 1px solid rgba(255,255,255,0.2); height: 1.3em; margin: 0 0.2em;"></div>' +
                        '<span style="color: #82B1FF; display: flex; align-items: center; justify-content: center; font-size: 1.1em; width: 1.8em;">' + Math.floor(dayItem.day.mintemp_c) + '°</span>' +
                        '<div style="border-left: 1px solid rgba(255,255,255,0.2); height: 1.3em; margin: 0 0.2em;"></div>' +
                        '<span class="forecast-day-icon" style="display: flex; align-items: center; justify-content: center; width: 2em; height: 1.8em;">' + dayIcon + '</span>' +
                        '<div style="border-left: 1px solid rgba(255,255,255,0.2); height: 1.3em; margin: 0 0.2em;"></div>' +
                        '<span style="display: flex; align-items: center; justify-content: center; width: 3.8em;"><span class="weather-detail-icon" style="margin-right: 0.15em; display: flex; align-items: center;">' + getDetailIcon("humidity") + '</span>' + dayItem.day.avghumidity + '%</span>' +
                        '<div style="border-left: 1px solid rgba(255,255,255,0.2); height: 1.3em; margin: 0 0.2em;"></div>' +
                        '<span style="display: flex; align-items: center; justify-content: center; width: 4.5em;"><span class="weather-detail-icon" style="margin-right: 0.15em; display: flex; align-items: center;">' + getDetailIcon("wind") + '</span>' + dayItem.day.maxwind_kph + ' км/год</span></div></div>';
                }
                fcHtml += "</div>";
                $modalContent.append(fcHtml);
            }

            Lampa.Modal.open({
                title: "Детальна погода",
                html: $modalContent,
                size: "medium",
                mask: true,
                onBack: function () {
                    $(".modal").remove();
                    Lampa.Controller.toggle("head");
                }
            });

            setTimeout(function () {
                $(".weather-detail-icon svg").css({ width: "1.5em", height: "1.5em", "vertical-align": "middle" });
                $(".forecast-day-icon svg").css({ width: "1.8em", height: "1.8em", "max-width": "1.8em", "max-height": "1.8em" });
            }, 0);
        }

        function handleError() {
            console.log("Error retrieving weather data");
            if (retryCount < 3) {
                retryCount++;
                console.log("Погода", "Повторна спроба " + retryCount + " з 3");
                setTimeout(function () {
                    self.getWeather();
                }, 3000);
            } else {
                console.log("Погода", "Перевищено кількість спроб");
                retryCount = 0;
            }
        }

        this.create = function () {
            widgetElem = $('<div class="weather-widget head__action selector" style="display:flex;align-items:center;cursor:pointer;padding: 0 0.5em;"><div class="weather-temp" id="weather-temp" style="display:flex;align-items:center;"></div><div class="weather-condition" id="weather-condition" style="display:flex;align-items:center;justify-content:center;"></div></div>');
            
            widgetElem.on("hover:enter click", function () {
                var isManual = Lampa.Storage.get("weather_manual", false);
                var city = Lampa.Storage.get("weather_city", "");
                if (isManual && city) {
                    self.getForecastData(city);
                } else if (currentWeatherData && currentWeatherData.location && currentWeatherData.location.name) {
                    self.getForecastData(currentWeatherData.location.name);
                } else {
                    Lampa.Noty.show("Завантаження погоди...");
                }
            });
        };

        this.fetchJson = function (url, successCb, failCb) {
            request.clear();
            request.timeout(12000);
            request.silent(url, function (res) {
                var data = (function (e) {
                    if (!e) return null;
                    if (e.status !== undefined && e.body !== undefined) {
                        if (e.status < 200 || e.status >= 300) return null;
                        try {
                            return typeof e.body === "string" ? JSON.parse(e.body) : e.body;
                        } catch (err) {
                            console.log("Погода", "Помилка парсингу body", err);
                            return null;
                        }
                    }
                    return e;
                })(res);

                if (data) successCb(data);
                else (failCb || handleError)();
            }, failCb || handleError);
        };

        this.getWeatherData_weatherapi = function (city) {
            var url = "https://api.weatherapi.com/v1/current.json?key=" + getWeatherApiKey() + "&q=" + encodeURIComponent(city) + "&lang=uk&aqi=no";
            this.fetchJson(url, function (res) {
                if (res && res.current) updateWidgetUI(res);
                else handleError();
            });
        };

        this.getForecastData_weatherapi = function (city) {
            var url = "https://api.weatherapi.com/v1/forecast.json?key=" + getWeatherApiKey() + "&q=" + encodeURIComponent(city) + "&lang=uk&days=3&aqi=no";
            this.fetchJson(url, function (res) {
                if (res && res.forecast) showForecastModal(res);
                else handleError();
            });
        };

        this.getWeatherData_openweathermap = function (city) {
            var key = getOpenWeatherKey();
            var url = "https://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(city) + "&appid=" + key + "&units=metric&lang=uk";
            this.fetchJson(url, function (res) {
                if (res && res.main) {
                    var code = (res.weather && res.weather[0] && res.weather[0].id) || 800;
                    var text = openWeatherCodes[code] || (res.weather && res.weather[0] && res.weather[0].description) || "Хмарно";
                    var isDay = 1;
                    if (res.sys && res.sys.sunrise && res.sys.sunset && res.dt) {
                        isDay = res.dt >= res.sys.sunrise && res.dt < res.sys.sunset ? 1 : 0;
                    }
                    if (code === 800) text = isDay ? "Сонячно" : "Ясно";

                    updateWidgetUI({
                        location: {
                            name: res.name || city,
                            country: (res.sys && res.sys.country) || "",
                            lat: res.coord && res.coord.lat,
                            lon: res.coord && res.coord.lon
                        },
                        current: {
                            temp_c: res.main.temp,
                            feelslike_c: res.main.feels_like,
                            humidity: res.main.humidity,
                            cloud: (res.clouds && res.clouds.all) || 0,
                            pressure_mb: res.main.pressure,
                            vis_km: res.visibility != null ? Math.round(res.visibility / 1000) : "—",
                            uv: "—",
                            wind_kph: res.wind ? Math.round(3.6 * (res.wind.speed || 0)) : 0,
                            wind_dir: res.wind ? getWindDirection(res.wind.deg) : "",
                            gust_kph: res.wind && res.wind.gust != null ? Math.round(3.6 * res.wind.gust) : "—",
                            condition: { text: text, code: code },
                            is_day: isDay
                        }
                    });
                } else handleError();
            });
        };

        this.getForecastData_openweathermap = function (city) {
            var key = getOpenWeatherKey();
            var url = "https://api.openweathermap.org/data/2.5/forecast?q=" + encodeURIComponent(city) + "&appid=" + key + "&units=metric&lang=uk";
            this.fetchJson(url, function (res) {
                if (res && res.list) {
                    var grouped = {};
                    res.list.forEach(function (item) {
                        var dateStr = item.dt_txt.split(" ")[0];
                        if (!grouped[dateStr]) {
                            grouped[dateStr] = { temps: [], hum: [], wind: [], codes: [], texts: [] };
                        }
                        grouped[dateStr].temps.push(item.main.temp);
                        grouped[dateStr].hum.push(item.main.humidity);
                        grouped[dateStr].wind.push((item.wind && item.wind.speed) || 0);
                        var wCode = (item.weather && item.weather[0] && item.weather[0].id) || 800;
                        grouped[dateStr].codes.push(wCode);
                        grouped[dateStr].texts.push(openWeatherCodes[wCode] || item.weather[0].description);
                    });

                    showForecastModal({
                        forecast: {
                            forecastday: Object.keys(grouped).slice(0, 3).map(function (dateKey) {
                                var group = grouped[dateKey];
                                var midCode = group.codes[Math.floor(group.codes.length / 2)];
                                return {
                                    date: dateKey,
                                    day: {
                                        maxtemp_c: Math.max.apply(null, group.temps),
                                        mintemp_c: Math.min.apply(null, group.temps),
                                        avghumidity: Math.round(group.hum.reduce(function (a, b) { return a + b; }, 0) / group.hum.length),
                                        maxwind_kph: Math.round(3.6 * Math.max.apply(null, group.wind)),
                                        condition: { text: openWeatherCodes[midCode] || group.texts[0] || "Хмарно", code: midCode }
                                    }
                                };
                            })
                        }
                    });
                } else handleError();
            });
        };

        this.geocodeCity = function (city, callback) {
            var url = "https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(city) + "&count=1&language=uk&format=json";
            this.fetchJson(url, function (res) {
                if (res && res.results && res.results[0]) {
                    var item = res.results[0];
                    callback({
                        name: item.name || city,
                        country: item.country || item.country_code || "",
                        lat: item.latitude,
                        lon: item.longitude
                    });
                } else callback(null);
            }, function () { callback(null); });
        };

        this.getWeatherData_openmeteo = function (city, locData) {
            function queryApi(location) {
                if (location && location.lat != null) {
                    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + location.lat + "&longitude=" + location.lon + "&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,apparent_temperature,cloud_cover,surface_pressure,visibility,uv_index,wind_gusts_10m,is_day,wind_direction_10m&timezone=auto&wind_speed_unit=kmh";
                    self.fetchJson(url, function (res) {
                        if (res && res.current) {
                            var cur = res.current;
                            var code = cur.weather_code;
                            var text = openMeteoCodes[code] || "Хмарно";
                            if (code === 0) text = cur.is_day ? "Сонячно" : "Ясно";

                            updateWidgetUI({
                                location: {
                                    name: location.name || city,
                                    country: location.country || "",
                                    lat: location.lat,
                                    lon: location.lon
                                },
                                current: {
                                    temp_c: cur.temperature_2m,
                                    feelslike_c: cur.apparent_temperature != null ? cur.apparent_temperature : cur.temperature_2m,
                                    humidity: cur.relative_humidity_2m != null ? cur.relative_humidity_2m : "—",
                                    cloud: cur.cloud_cover != null ? cur.cloud_cover : "—",
                                    pressure_mb: cur.surface_pressure != null ? Math.round(cur.surface_pressure) : "—",
                                    vis_km: cur.visibility != null ? Math.round(cur.visibility / 1000) : "—",
                                    uv: cur.uv_index != null ? cur.uv_index : "—",
                                    wind_kph: cur.wind_speed_10m != null ? Math.round(cur.wind_speed_10m) : 0,
                                    wind_dir: getWindDirection(cur.wind_direction_10m),
                                    gust_kph: cur.wind_gusts_10m != null ? Math.round(cur.wind_gusts_10m) : "—",
                                    condition: { text: text, code: code },
                                    is_day: cur.is_day ? 1 : 0
                                }
                            });
                        } else handleError();
                    });
                } else handleError();
            }

            if (locData && locData.lat != null) queryApi(locData);
            else this.geocodeCity(city, function (geo) { geo ? queryApi(geo) : handleError(); });
        };

        this.getForecastData_openmeteo = function (city) {
            var loc = (currentWeatherData && currentWeatherData.location && currentWeatherData.location.lat != null) ? currentWeatherData.location : null;

            function queryForecast(location) {
                if (location && location.lat != null) {
                    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + location.lat + "&longitude=" + location.lon + "&daily=weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,wind_speed_10m_max&timezone=auto&wind_speed_unit=kmh&forecast_days=3";
                    self.fetchJson(url, function (res) {
                        if (res && res.daily) {
                            var daily = res.daily;
                            var resultDays = [];
                            for (var i = 0; i < (daily.time || []).length; i++) {
                                var code = daily.weather_code[i];
                                resultDays.push({
                                    date: daily.time[i],
                                    day: {
                                        maxtemp_c: daily.temperature_2m_max[i],
                                        mintemp_c: daily.temperature_2m_min[i],
                                        avghumidity: daily.relative_humidity_2m_mean ? Math.round(daily.relative_humidity_2m_mean[i]) : "—",
                                        maxwind_kph: daily.wind_speed_10m_max ? Math.round(daily.wind_speed_10m_max[i]) : "—",
                                        condition: { text: openMeteoCodes[code] || "Хмарно", code: code }
                                    }
                                });
                            }
                            showForecastModal({ forecast: { forecastday: resultDays } });
                        } else handleError();
                    });
                } else handleError();
            }

            if (loc) queryForecast(loc);
            else this.geocodeCity(city, function (geo) { geo ? queryForecast(geo) : handleError(); });
        };

        this.getWeatherData = function (city, locData) {
            var provider = getProvider();
            console.log("Погода", "Запит: " + city + " [" + provider + "]");
            if (provider === "openweathermap") this.getWeatherData_openweathermap(city);
            else if (provider === "openmeteo") this.getWeatherData_openmeteo(city, locData);
            else this.getWeatherData_weatherapi(city);
        };

        this.getForecastData = function (city) {
            var provider = getProvider();
            console.log("Погода", "Запит прогнозу: " + city + " [" + provider + "]");
            if (provider === "openweathermap") this.getForecastData_openweathermap(city);
            else if (provider === "openmeteo") this.getForecastData_openmeteo(city);
            else this.getForecastData_weatherapi(city);
        };

        this.weatherIcons = {
            "Сонячно": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5" fill="#FFD700"/><g stroke="#FFD700" stroke-width="2" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/><line x1="4.5" y1="4.5" x2="6.5" y2="6.5"/><line x1="17.5" y1="17.5" x2="19.5" y2="19.5"/><line x1="19.5" y1="4.5" x2="17.5" y2="6.5"/><line x1="6.5" y1="17.5" x2="4.5" y2="19.5"/></g></svg>',
            "Ясно": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5" fill="#FFD700"/><g stroke="#FFD700" stroke-width="2" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/></g></svg>',
            "Мінлива хмарність": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="4" fill="#FFD700"/><g stroke="#FFD700" stroke-width="1.5" stroke-linecap="round"><line x1="8" y1="1" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="1" y1="8" x2="3" y2="8"/><line x1="13" y1="8" x2="15" y2="8"/></g><path d="M7 17 q0 -4 5 -4 q5 0 5 4 q4 1 4 5 q0 4 -4 4 l-10 0 q-3 0 -3 -4 q0 -4 3 -5z" fill="#B0C4DE"/></svg>',
            "Хмарно": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M7 14 q0 -4 5 -4 q5 0 5 4 q4 1 4 6 q0 5 -4 5 l-10 0 q-3 0 -3 -5 q0 -5 3 -6z" fill="#B0C4DE"/><path d="M10 12 q0 -3 4 -3 q4 0 4 3 q3 1 3 4 q0 3 -3 3 l-8 0 q-2 0 -2 -3 q0 -3 2 -4z" fill="#87CEEB"/></svg>',
            "Похмуро": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 12 q0 -5 6 -5 q6 0 6 5 q5 1 5 7 q0 6 -5 6 l-12 0 q-4 0 -4 -6 q0 -6 4 -7z" fill="#A9A9A9"/><path d="M9 10 q0 -4 5 -4 q5 0 5 4 q4 1 4 5 q0 4 -4 4 l-10 0 q-3 0 -3 -4 q0 -4 3 -5z" fill="#808080"/></svg>',
            "Серпанок": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><line x1="4" y1="5" x2="20" y2="5" stroke="#B0C4DE" stroke-width="2" stroke-linecap="round"/><line x1="5" y1="10" x2="19" y2="10" stroke="#B0C4DE" stroke-width="2" stroke-linecap="round"/><line x1="4" y1="15" x2="20" y2="15" stroke="#B0C4DE" stroke-width="2" stroke-linecap="round"/><line x1="5" y1="20" x2="19" y2="20" stroke="#B0C4DE" stroke-width="2" stroke-linecap="round"/></svg>',
            "Задимлення": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><line x1="4" y1="5" x2="20" y2="5" stroke="#A9A9A9" stroke-width="2" stroke-linecap="round"/><line x1="5" y1="10" x2="19" y2="10" stroke="#A9A9A9" stroke-width="2" stroke-linecap="round"/><line x1="4" y1="15" x2="20" y2="15" stroke="#A9A9A9" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="20" x2="18" y2="20" stroke="#A9A9A9" stroke-width="2" stroke-linecap="round"/></svg>',
            "Туман": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2 7 Q5 5 8 7 Q11 9 14 7 Q17 5 20 7 Q22 8 22 7" fill="none" stroke="#D3D3D3" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/><path d="M2 11 Q5 9 8 11 Q11 13 14 11 Q17 9 20 11 Q22 12 22 11" fill="none" stroke="#D3D3D3" stroke-width="2" stroke-linecap="round"/><path d="M2 15 Q5 13 8 15 Q11 17 14 15 Q17 13 20 15 Q22 16 22 15" fill="none" stroke="#D3D3D3" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/><path d="M2 19 Q5 17 8 19 Q11 21 14 19 Q17 17 20 19 Q22 20 22 19" fill="none" stroke="#D3D3D3" stroke-width="2" stroke-linecap="round"/></svg>',
            "Крижаний туман": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><line x1="4" y1="6" x2="20" y2="6" stroke="#B0E0E6" stroke-width="2" stroke-linecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="#B0E0E6" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="18" x2="18" y2="18" stroke="#B0E0E6" stroke-width="2" stroke-linecap="round"/></svg>',
            "Слабка мряка": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M7 11 q0 -4 5 -4 q5 0 5 4 q4 1 4 6 q0 5 -4 5 l-10 0 q-3 0 -3 -5 q0 -5 3 -6z" fill="#87CEEB"/><line x1="10" y1="16" x2="9" y2="22" stroke="#4169E1" stroke-width="1" stroke-linecap="round"/><line x1="14" y1="16" x2="13" y2="22" stroke="#4169E1" stroke-width="1" stroke-linecap="round"/><line x1="18" y1="16" x2="17" y2="22" stroke="#4169E1" stroke-width="1" stroke-linecap="round"/></svg>',
            "Невелика мряка": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M7 11 q0 -4 5 -4 q5 0 5 4 q4 1 4 6 q0 5 -4 5 l-10 0 q-3 0 -3 -5 q0 -5 3 -6z" fill="#87CEEB"/><line x1="9" y1="16" x2="8" y2="22" stroke="#4169E1" stroke-width="1" stroke-linecap="round"/><line x1="13" y1="16" x2="12" y2="22" stroke="#4169E1" stroke-width="1" stroke-linecap="round"/><line x1="17" y1="16" x2="16" y2="22" stroke="#4169E1" stroke-width="1" stroke-linecap="round"/></svg>',
            "Місцями слабка мряка": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="5" r="4" fill="#FFD700"/><path d="M7 11 q0 -4 5 -4 q5 0 5 4 q4 1 4 6 q0 5 -4 5 l-10 0 q-3 0 -3 -5 q0 -5 3 -6z" fill="#87CEEB"/><line x1="9" y1="16" x2="8" y2="22" stroke="#4169E1" stroke-width="1" stroke-linecap="round"/><line x1="13" y1="16" x2="12" y2="22" stroke="#4169E1" stroke-width="1" stroke-linecap="round"/><line x1="17" y1="16" x2="16" y2="22" stroke="#4169E1" stroke-width="1" stroke-linecap="round"/></svg>',
            "Слабкий дощ": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M7 11 q0 -4 5 -4 q5 0 5 4 q4 1 4 6 q0 5 -4 5 l-10 0 q-3 0 -3 -5 q0 -5 3 -6z" fill="#87CEEB"/><line x1="10" y1="16" x2="9" y2="22" stroke="#4169E1" stroke-width="1" stroke-linecap="round"/><line x1="14" y1="16" x2="13" y2="22" stroke="#4169E1" stroke-width="1" stroke-linecap="round"/><line x1="18" y1="16" x2="17" y2="22" stroke="#4169E1" stroke-width="1" stroke-linecap="round"/></svg>',
            "Легка злива": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 10 q0 -5 6 -5 q6 0 6 5 q4 1 4 5 q0 4 -4 4 l-12 0 q-3 0 -3 -4 q0 -4 3 -5z" fill="#6A5ACD"/><line x1="8" y1="19" x2="7" y2="24" stroke="#4169E1" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="19" x2="11" y2="24" stroke="#4169E1" stroke-width="1.5" stroke-linecap="round"/><line x1="16" y1="19" x2="15" y2="24" stroke="#4169E1" stroke-width="1.5" stroke-linecap="round"/></svg>',
            "Невеликий дощ": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 10 q0 -5 6 -5 q6 0 6 5 q4 1 4 5 q0 4 -4 4 l-12 0 q-3 0 -3 -4 q0 -4 3 -5z" fill="#6A5ACD"/><line x1="8" y1="19" x2="7" y2="23" stroke="#4169E1" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="19" x2="11" y2="23" stroke="#4169E1" stroke-width="1.5" stroke-linecap="round"/><line x1="16" y1="19" x2="15" y2="23" stroke="#4169E1" stroke-width="1.5" stroke-linecap="round"/></svg>',
            "Місцями дощ поблизу": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="7" r="4" fill="#FFD700"/><path d="M9 15 q0 -3 4 -3 q4 0 4 3 q3 1 3 4 q0 3 -3 3 l-8 0 q-2 0 -2 -3 q0 -3 2 -4z" fill="#87CEEB"/><line x1="9" y1="22" x2="8" y2="25" stroke="#4169E1" stroke-width="1.5" stroke-linecap="round"/><line x1="13" y1="22" x2="12" y2="25" stroke="#4169E1" stroke-width="1.5" stroke-linecap="round"/><line x1="17" y1="22" x2="16" y2="25" stroke="#4169E1" stroke-width="1.5" stroke-linecap="round"/></svg>',
            "Помірний дощ": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 9 q0 -6 6 -6 q6 0 6 6 q5 1 5 6 q0 5 -5 5 l-12 0 q-4 0 -4 -5 q0 -5 4 -6z" fill="#483D8B"/><line x1="7" y1="20" x2="6" y2="24" stroke="#4169E1" stroke-width="2" stroke-linecap="round"/><line x1="11" y1="20" x2="10" y2="24" stroke="#4169E1" stroke-width="2" stroke-linecap="round"/><line x1="15" y1="20" x2="14" y2="24" stroke="#4169E1" stroke-width="2" stroke-linecap="round"/><line x1="19" y1="20" x2="18" y2="24" stroke="#4169E1" stroke-width="2" stroke-linecap="round"/></svg>',
            "Сильний дощ": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 8 q0 -7 7 -7 q7 0 7 7 q6 1 6 7 q0 6 -6 6 l-14 0 q-5 0 -5 -6 q0 -6 5 -7z" fill="#2F4F4F"/><line x1="6" y1="21" x2="5" y2="25" stroke="#1E90FF" stroke-width="2" stroke-linecap="round"/><line x1="10" y1="21" x2="9" y2="25" stroke="#1E90FF" stroke-width="2" stroke-linecap="round"/><line x1="14" y1="21" x2="13" y2="25" stroke="#1E90FF" stroke-width="2" stroke-linecap="round"/><line x1="18" y1="21" x2="17" y2="25" stroke="#1E90FF" stroke-width="2" stroke-linecap="round"/></svg>',
            "Часом помірний дощ": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="7" r="4" fill="#FFD700"/><path d="M5 9 q0 -6 6 -6 q6 0 6 6 q5 1 5 6 q0 5 -5 5 l-12 0 q-4 0 -4 -5 q0 -5 4 -6z" fill="#483D8B"/><line x1="7" y1="20" x2="6" y2="24" stroke="#4169E1" stroke-width="2" stroke-linecap="round"/><line x1="11" y1="20" x2="10" y2="24" stroke="#4169E1" stroke-width="2" stroke-linecap="round"/><line x1="15" y1="20" x2="14" y2="24" stroke="#4169E1" stroke-width="2" stroke-linecap="round"/></svg>',
            "Часом сильний дощ": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="7" r="4" fill="#FFD700"/><path d="M4 8 q0 -7 7 -7 q7 0 7 7 q6 1 6 7 q0 6 -6 6 l-14 0 q-5 0 -5 -6 q0 -6 5 -7z" fill="#2F4F4F"/><line x1="6" y1="21" x2="5" y2="25" stroke="#1E90FF" stroke-width="2" stroke-linecap="round"/><line x1="10" y1="21" x2="9" y2="25" stroke="#1E90FF" stroke-width="2" stroke-linecap="round"/><line x1="14" y1="21" x2="13" y2="25" stroke="#1E90FF" stroke-width="2" stroke-linecap="round"/></svg>',
            "Зливовий дощ": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 10 q0 -5 6 -5 q6 0 6 5 q4 1 4 5 q0 4 -4 4 l-12 0 q-3 0 -3 -4 q0 -4 3 -5z" fill="#6A5ACD"/><line x1="8" y1="19" x2="6" y2="25" stroke="#4169E1" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="19" x2="10" y2="25" stroke="#4169E1" stroke-width="2" stroke-linecap="round"/><line x1="16" y1="19" x2="14" y2="25" stroke="#4169E1" stroke-width="2" stroke-linecap="round"/></svg>',
            "Проливний дощ": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 8 q0 -7 7 -7 q7 0 7 7 q6 1 6 7 q0 6 -6 6 l-14 0 q-5 0 -5 -6 q0 -6 5 -7z" fill="#1a1a2e"/><line x1="6" y1="21" x2="4" y2="27" stroke="#1E90FF" stroke-width="2.5" stroke-linecap="round"/><line x1="10" y1="21" x2="8" y2="27" stroke="#1E90FF" stroke-width="2.5" stroke-linecap="round"/><line x1="14" y1="21" x2="12" y2="27" stroke="#1E90FF" stroke-width="2.5" stroke-linecap="round"/><line x1="18" y1="21" x2="16" y2="27" stroke="#1E90FF" stroke-width="2.5" stroke-linecap="round"/></svg>',
            "Гроза": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 9 q0 -6 6 -6 q6 0 6 6 q4 1 4 6 q0 5 -5 5 l-12 0 q-3 0 -3 -5 q0 -5 4 -6z" fill="#4A4A4A"/><polygon points="12,10 10,14 11.5,14 10,19 15,13 13,13 14,10" fill="#FFD700"/><polygon points="16,12 14,16 15,16 14,20 18,15 16.5,15 17.5,12" fill="#FFA500"/></svg>',
            "Місцями грім і блискавки": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="7" r="4" fill="#FFD700"/><path d="M5 9 q0 -6 6 -6 q6 0 6 6 q4 1 4 6 q0 5 -5 5 l-12 0 q-3 0 -3 -5 q0 -5 4 -6z" fill="#4A4A4A"/><polygon points="12,10 10,14 11.5,14 10,19 15,13 13,13 14,10" fill="#FFD700"/></svg>',
            "Помірний або сильний дощ із грозою": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 8 q0 -7 7 -7 q7 0 7 7 q6 1 6 7 q0 6 -6 6 l-14 0 q-5 0 -5 -6 q0 -6 5 -7z" fill="#2F4F4F"/><polygon points="12,9 10,13 11.5,13 10,18 15,12 13,12 14,9" fill="#FFD700"/><line x1="6" y1="21" x2="5" y2="25" stroke="#1E90FF" stroke-width="2" stroke-linecap="round"/><line x1="10" y1="21" x2="9" y2="25" stroke="#1E90FF" stroke-width="2" stroke-linecap="round"/><line x1="14" y1="21" x2="13" y2="25" stroke="#1E90FF" stroke-width="2" stroke-linecap="round"/></svg>',
            "Місцями помірний або сильний дощ із грозою": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="7" r="4" fill="#FFD700"/><path d="M4 8 q0 -7 7 -7 q7 0 7 7 q6 1 6 7 q0 6 -6 6 l-14 0 q-5 0 -5 -6 q0 -6 5 -7z" fill="#2F4F4F"/><polygon points="12,9 10,13 11.5,13 10,18 15,12 13,12 14,9" fill="#FFD700"/><line x1="6" y1="21" x2="5" y2="25" stroke="#1E90FF" stroke-width="2" stroke-linecap="round"/><line x1="10" y1="21" x2="9" y2="25" stroke="#1E90FF" stroke-width="2" stroke-linecap="round"/></svg>',
            "Невеликий дощ із грозою": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 10 q0 -5 6 -5 q6 0 6 5 q4 1 4 5 q0 4 -4 4 l-12 0 q-3 0 -3 -4 q0 -4 3 -5z" fill="#4A4A4A"/><polygon points="12,10 10,14 11.5,14 10,19 15,13 13,13 14,10" fill="#FFD700"/></svg>',
            "Місцями невеликий дощ із грозою": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="7" r="4" fill="#FFD700"/><path d="M5 10 q0 -5 6 -5 q6 0 6 5 q4 1 4 5 q0 4 -4 4 l-12 0 q-3 0 -3 -4 q0 -4 3 -5z" fill="#4A4A4A"/><polygon points="12,10 10,14 11.5,14 10,19 15,13 13,13 14,10" fill="#FFD700"/></svg>',
            "Місцями слабкий дощ із грозою": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="5" r="4" fill="#FFD700"/><path d="M7 11 q0 -4 5 -4 q5 0 5 4 q4 1 4 6 q0 5 -4 5 l-10 0 q-3 0 -3 -5 q0 -5 3 -6z" fill="#4A4A4A"/><line x1="10" y1="17" x2="9" y2="22" stroke="#4169E1" stroke-width="1" stroke-linecap="round"/><line x1="14" y1="17" x2="13" y2="22" stroke="#4169E1" stroke-width="1" stroke-linecap="round"/><polygon points="12,9 10,13 11.5,13 10,18 15,12 13,12 14,9" fill="#FFD700"/></svg>',
            "Невеликий сніг": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 8 q0 -5 6 -5 q6 0 6 5 q4 1 4 6 q0 5 -4 5 l-12 0 q-3 0 -3 -5 q0 -5 3 -6z" fill="#B0C4DE"/><circle cx="8" cy="19" r="1" fill="white"/><circle cx="12" cy="20" r="1" fill="white"/><circle cx="16" cy="19" r="1" fill="white"/></svg>',
            "Помірний сніг": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 10 q0 -6 7 -6 q7 0 7 6 q5 1 5 6 q0 5 -5 5 l-14 0 q-4 0 -4 -5 q0 -5 4 -6z" fill="#B0C4DE"/><circle cx="7" cy="20" r="1.5" fill="white"/><circle cx="12" cy="22" r="1.5" fill="white"/><circle cx="17" cy="20" r="1.5" fill="white"/><circle cx="9" cy="24" r="1.5" fill="white"/><circle cx="14" cy="24" r="1.5" fill="white"/></svg>',
            "Сильний сніг": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 9 q0 -7 8 -7 q8 0 8 7 q6 1 6 7 q0 6 -6 6 l-16 0 q-5 0 -5 -6 q0 -6 5 -7z" fill="#A9A9A9"/><circle cx="6" cy="20" r="1.5" fill="white"/><circle cx="11" cy="22" r="1.5" fill="white"/><circle cx="16" cy="20" r="1.5" fill="white"/><circle cx="8" cy="24" r="1.5" fill="white"/><circle cx="13" cy="24" r="1.5" fill="white"/><circle cx="18" cy="23" r="1.5" fill="white"/></svg>',
            "Часом невеликий сніг": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="6" r="4" fill="#FFD700"/><path d="M5 12 q0 -5 6 -5 q6 0 6 5 q4 1 4 6 q0 5 -4 5 l-12 0 q-3 0 -3 -5 q0 -5 3 -6z" fill="#B0C4DE"/><circle cx="8" cy="20" r="1" fill="white"/><circle cx="12" cy="21" r="1" fill="white"/></svg>',
            "Часом помірний сніг": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="6" r="4" fill="#FFD700"/><path d="M4 11 q0 -6 7 -6 q7 0 7 6 q5 1 5 6 q0 5 -5 5 l-14 0 q-4 0 -4 -5 q0 -5 4 -6z" fill="#B0C4DE"/><circle cx="7" cy="20" r="1.5" fill="white"/><circle cx="12" cy="22" r="1.5" fill="white"/></svg>',
            "Часом сильний сніг": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="6" r="4" fill="#FFD700"/><path d="M3 10 q0 -7 8 -7 q8 0 8 7 q6 1 6 7 q0 6 -6 6 l-16 0 q-5 0 -5 -6 q0 -6 5 -7z" fill="#A9A9A9"/><circle cx="6" cy="20" r="1.5" fill="white"/><circle cx="11" cy="22" r="1.5" fill="white"/></svg>',
            "Низова хуртовина": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 8 q0 -5 6 -5 q6 0 6 5 q4 1 4 6 q0 5 -4 5 l-12 0 q-3 0 -3 -5 q0 -5 3 -6z" fill="#B0C4DE"/><line x1="4" y1="19" x2="20" y2="19" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="21" x2="18" y2="21" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>',
            "Хуртовина": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 10 q0 -6 7 -6 q7 0 7 6 q5 1 5 6 q0 5 -5 5 l-14 0 q-4 0 -4 -5 q0 -5 4 -6z" fill="#A9A9A9"/><circle cx="6" cy="20" r="1.5" fill="white"/><circle cx="10" cy="22" r="1.5" fill="white"/><circle cx="14" cy="20" r="1.5" fill="white"/><circle cx="18" cy="22" r="1.5" fill="white"/><line x1="4" y1="16" x2="20" y2="16" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>',
            "Снігопад": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 9 q0 -7 8 -7 q8 0 8 7 q6 1 6 7 q0 6 -6 6 l-16 0 q-5 0 -5 -6 q0 -6 5 -7z" fill="#A9A9A9"/><circle cx="5" cy="20" r="2" fill="white"/><circle cx="10" cy="22" r="2" fill="white"/><circle cx="15" cy="20" r="2" fill="white"/><circle cx="8" cy="24" r="2" fill="white"/><circle cx="13" cy="24" r="2" fill="white"/><circle cx="18" cy="22" r="2" fill="white"/></svg>',
            "Дощ зі снігом": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 10 q0 -5 6 -5 q6 0 6 5 q4 1 4 5 q0 4 -4 4 l-12 0 q-3 0 -3 -4 q0 -4 3 -5z" fill="#6A5ACD"/><line x1="8" y1="19" x2="7" y2="23" stroke="#4169E1" stroke-width="1.5" stroke-linecap="round"/><circle cx="13" cy="21" r="1" fill="white"/><circle cx="16" cy="20" r="1" fill="white"/></svg>',
            "Невеликий дощ зі снігом": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 10 q0 -5 6 -5 q6 0 6 5 q4 1 4 5 q0 4 -4 4 l-12 0 q-3 0 -3 -4 q0 -4 3 -5z" fill="#87CEEB"/><line x1="8" y1="19" x2="7" y2="23" stroke="#4169E1" stroke-width="1.5" stroke-linecap="round"/><circle cx="13" cy="21" r="1" fill="white"/></svg>',
            "Помірний або сильний дощ зі снігом": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 9 q0 -6 6 -6 q6 0 6 6 q5 1 5 6 q0 5 -5 5 l-12 0 q-4 0 -4 -5 q0 -5 4 -6z" fill="#483D8B"/><line x1="7" y1="20" x2="6" y2="24" stroke="#4169E1" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="22" r="1.5" fill="white"/><circle cx="16" cy="20" r="1.5" fill="white"/></svg>',
            "Часом невеликий дощ зі снігом": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="7" r="4" fill="#FFD700"/><path d="M5 10 q0 -5 6 -5 q6 0 6 5 q4 1 4 5 q0 4 -4 4 l-12 0 q-3 0 -3 -4 q0 -4 3 -5z" fill="#87CEEB"/><line x1="8" y1="19" x2="7" y2="23" stroke="#4169E1" stroke-width="1.5" stroke-linecap="round"/><circle cx="13" cy="21" r="1" fill="white"/></svg>',
            "Град": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 9 q0 -6 6 -6 q6 0 6 6 q4 1 4 6 q0 5 -5 5 l-12 0 q-3 0 -3 -5 q0 -5 4 -6z" fill="#483D8B"/><circle cx="7" cy="20" r="1.5" fill="white" stroke="#87CEEB" stroke-width="0.5"/><circle cx="12" cy="22" r="1.5" fill="white" stroke="#87CEEB" stroke-width="0.5"/><circle cx="17" cy="20" r="1.5" fill="white" stroke="#87CEEB" stroke-width="0.5"/></svg>',
            "Можливий дощ": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="6" r="4" fill="#FFD700"/><path d="M9 13 q0 -3 4 -3 q4 0 4 3 q3 1 3 4 q0 3 -3 3 l-8 0 q-2 0 -2 -3 q0 -3 2 -4z" fill="#87CEEB"/><line x1="11" y1="20" x2="10.5" y2="23" stroke="#4169E1" stroke-width="1.5" stroke-linecap="round"/><line x1="14" y1="20" x2="13.5" y2="23" stroke="#4169E1" stroke-width="1.5" stroke-linecap="round"/></svg>',
            "Можливий сніг": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="6" r="4" fill="#FFD700"/><path d="M9 13 q0 -3 4 -3 q4 0 4 3 q3 1 3 4 q0 3 -3 3 l-8 0 q-2 0 -2 -3 q0 -3 2 -4z" fill="#B0C4DE"/><circle cx="11" cy="22" r="1" fill="white"/><circle cx="14" cy="22" r="1" fill="white"/></svg>',
            "Можливий дощ зі снігом": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="6" r="4" fill="#FFD700"/><path d="M9 13 q0 -3 4 -3 q4 0 4 3 q3 1 3 4 q0 3 -3 3 l-8 0 q-2 0 -2 -3 q0 -3 2 -4z" fill="#6A5ACD"/><line x1="11" y1="20" x2="10.5" y2="23" stroke="#4169E1" stroke-width="1.5" stroke-linecap="round"/><circle cx="14" cy="22" r="1" fill="white"/></svg>',
            "Сильна піщана буря": '<svg width="2em" height="2em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 6 Q7 4 11 6 Q15 8 19 6 Q22 5 22 6" fill="none" stroke="#D2B48C" stroke-width="2.5" stroke-linecap="round"/><path d="M2 10 Q6 8 10 10 Q14 12 18 10 Q21 9 22 10" fill="none" stroke="#D2B48C" stroke-width="2.5" stroke-linecap="round"/><path d="M3 14 Q7 12 11 14 Q15 16 19 14 Q22 13 22 14" fill="none" stroke="#D2B48C" stroke-width="2.5" stroke-linecap="round"/><path d="M4 18 Q8 16 12 18 Q16 20 20 18" fill="none" stroke="#D2B48C" stroke-width="2" stroke-linecap="round" opacity="0.8"/></svg>'
        };

        this.weatherCodeIcons = {
            1003: "Мінлива хмарність",
            1006: "Хмарно",
            1009: "Похмуро",
            1012: "Серпанок",
            1015: "Сильна піщана буря",
            1018: "Сильна піщана буря",
            1021: "Сильна піщана буря",
            1024: "Сильна піщана буря",
            1027: "Сильна піщана буря",
            1030: "Туман",
            1033: "Задимлення",
            1036: "Задимлення",
            1039: "Задимлення",
            1042: "Задимлення",
            1045: "Сильна піщана буря",
            1048: "Сильна піщана буря",
            1063: "Місцями дощ поблизу",
            1066: "Можливий сніг",
            1069: "Можливий дощ зі снігом",
            1072: "Місцями слабка мряка",
            1087: "Місцями грім і блискавки",
            1114: "Низова хуртовина",
            1117: "Хуртовина",
            1135: "Туман",
            1147: "Крижаний туман",
            1150: "Місцями слабка мряка",
            1153: "Слабка мряка",
            1168: "Невелика мряка",
            1171: "Невелика мряка",
            1180: "Невеликий дощ",
            1183: "Слабкий дощ",
            1186: "Часом помірний дощ",
            1189: "Помірний дощ",
            1192: "Часом сильний дощ",
            1195: "Сильний дощ",
            1198: "Невеликий дощ зі снігом",
            1201: "Помірний або сильний дощ зі снігом",
            1204: "Невеликий дощ зі снігом",
            1207: "Помірний або сильний дощ зі снігом",
            1210: "Часом невеликий сніг",
            1213: "Невеликий сніг",
            1216: "Часом помірний сніг",
            1219: "Помірний сніг",
            1222: "Часом сильний сніг",
            1225: "Сильний сніг",
            1237: "Град",
            1240: "Легка злива",
            1243: "Зливовий дощ",
            1246: "Проливний дощ",
            1249: "Невеликий дощ зі снігом",
            1252: "Помірний або сильний дощ зі снігом",
            1255: "Невеликий сніг",
            1258: "Снігопад",
            1261: "Град",
            1264: "Град",
            1273: "Місцями невеликий дощ із грозою",
            1276: "Помірний або сильний дощ із грозою",
            1279: "Гроза",
            1282: "Гроза"
        };

        this.getIcon = function (cond, isDay) {
            if (!cond) return "";
            var key;
            if (cond.code === 1000) {
                key = isDay === 0 ? "Ясно" : "Сонячно";
            } else if (this.weatherCodeIcons[cond.code]) {
                key = this.weatherCodeIcons[cond.code];
            } else if (cond.text) {
                key = cond.text;
            }
            return this.weatherIcons[key] || this.weatherIcons[cond.text] || "";
        };

        this.getWeather = function () {
            var isManual = Lampa.Storage.get("weather_manual", false);
            var city = Lampa.Storage.get("weather_city", "");
            console.log("Погода", "Режим: " + (isManual ? "ручний" : "авто"));

            if (isManual && city) {
                console.log("Погода", "Шукаємо за містом: " + city);
                this.getWeatherData(city);
            } else {
                console.log("Погода", "Визначаємо за IP...");
                this.getWeatherByIP();
            }
        };

        this.getWeatherByIP = function () {
            $.get("http://ip-api.com/json", function (res) {
                if (res && res.city) {
                    console.log("Погода", "IP визначено: " + res.city);
                    console.log("Погода", "Широта: " + res.lat + ", Довгота: " + res.lon);
                    self.getWeatherData(res.city, {
                        name: res.city,
                        country: res.country || res.countryCode || "",
                        lat: res.lat,
                        lon: res.lon
                    });
                } else {
                    console.log("Погода", "Помилка визначення IP (немає city)");
                }
            }).fail(function () {
                console.log("Погода", "Помилка визначення IP");
            });
        };

        this.startUpdateTimer = function () {
            this.stopUpdateTimer();
            var interval = parseInt(Lampa.Storage.get("weather_interval", "0"), 10);
            if (interval !== 0) {
                var ms = interval * 60 * 1000;
                console.log("Погода", "Запускаємо автооновлення кожні " + interval + " хв");
                updateTimer = setTimeout(function tick() {
                    console.log("Погода", "Автооновлення...");
                    self.getWeather();
                    updateTimer = setTimeout(tick, ms);
                }, ms);
            }
        };

        this.stopUpdateTimer = function () {
            if (updateTimer) {
                clearTimeout(updateTimer);
                updateTimer = null;
            }
        };

        this.restartUpdateTimer = function () {
            this.stopUpdateTimer();
            this.startUpdateTimer();
        };

        this.render = function () {
            return widgetElem;
        };

        this.destroy = function () {
            this.stopUpdateTimer();
            if (widgetElem) {
                widgetElem.remove();
                widgetElem = null;
            }
        };
    }();

    // Реєстрація меню налаштувань Lampa
    Lampa.Settings.listener.follow("open", function (e) {
        if (e.name === "main") {
            if (Lampa.Settings.main().render().find('[data-component="weather_settings"]').length === 0) {
                Lampa.SettingsApi.addComponent({
                    component: "weather_settings",
                    name: "Погода",
                    icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em"><circle cx="12" cy="12" r="5" fill="#FFD700"/><g stroke="#FFD700" stroke-width="2" stroke-linecap="round" fill="none"><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/><line x1="4.5" y1="4.5" x2="6.5" y2="6.5"/><line x1="17.5" y1="17.5" x2="19.5" y2="19.5"/><line x1="19.5" y1="4.5" x2="17.5" y2="6.5"/><line x1="6.5" y1="17.5" x2="4.5" y2="19.5"/></g></svg>'
                });
                Lampa.Settings.main().update();
                Lampa.Settings.main().render().find('[data-component="weather_settings"]').addClass("hide");
            }
        }
    });

    Lampa.SettingsApi.addParam({
        component: "interface",
        param: { name: "weather_settings", type: "static", default: true },
        field: { name: "Погода", description: "Налаштування міста, автооновлення та джерела даних" },
        onRender: function (item) {
            setTimeout(function () {
                $('.settings-param > div:contains("Погода")').parent().insertAfter($('div[data-name="interface_size"]'));
            }, 0);
            item.on("hover:enter", function () {
                Lampa.Settings.create("weather_settings");
                Lampa.Controller.enabled().controller.back = function () {
                    Lampa.Settings.create("interface");
                };
            });
        }
    });

    Lampa.SettingsApi.addParam({
        component: "weather_settings",
        param: {
            name: "weather_provider",
            type: "select",
            values: { weatherapi: "WeatherAPI", openweathermap: "OpenWeatherMap", openmeteo: "Open-Meteo (без ключа)" },
            default: "weatherapi"
        },
        field: { name: "Джерело погоди", description: "Оберіть сервіс: WeatherAPI, OpenWeatherMap або Open-Meteo" },
        onChange: function (val) {
            console.log("Погода", "Провайдер: " + val);
            setTimeout(function () {
                var p = val || getProvider();
                var apiWeather = $('div[data-name="weather_key_weatherapi"]');
                var apiOWM = $('div[data-name="weather_key_openweathermap"]');
                if (p === "weatherapi") { apiWeather.show(); apiOWM.hide(); }
                else if (p === "openweathermap") { apiWeather.hide(); apiOWM.show(); }
                else { apiWeather.hide(); apiOWM.hide(); }
            }, 50);
            WeatherService.getWeather();
        }
    });

    Lampa.SettingsApi.addParam({
        component: "weather_settings",
        param: { name: "weather_key_weatherapi", type: "input", values: "", placeholder: "Залиште порожнім — ключ з плагіна", default: "" },
        field: { name: "API-ключ WeatherAPI", description: "Власний ключ. Якщо порожньо — використовується ключ з плагіна" },
        onChange: function (val) {
            console.log("Погода", "Власний ключ WeatherAPI: " + (val ? "вказано" : "з плагіна"));
            if (getProvider() === "weatherapi") WeatherService.getWeather();
        },
        onRender: function (item) {
            setTimeout(function () {
                if (getProvider() !== "weatherapi") item.hide();
                else item.show();
            }, 20);
        }
    });

    Lampa.SettingsApi.addParam({
        component: "weather_settings",
        param: { name: "weather_key_openweathermap", type: "input", values: "", placeholder: "Залиште порожнім — ключ з плагіна", default: "" },
        field: { name: "API-ключ OpenWeatherMap", description: "Власний ключ. Якщо порожньо — використовується ключ з плагіна" },
        onChange: function (val) {
            console.log("Погода", "Власний ключ OpenWeatherMap: " + (val ? "вказано" : "з плагіна"));
            if (getProvider() === "openweathermap") WeatherService.getWeather();
        },
        onRender: function (item) {
            setTimeout(function () {
                if (getProvider() !== "openweathermap") item.hide();
                else item.show();
            }, 20);
        }
    });

    Lampa.SettingsApi.addParam({
        component: "weather_settings",
        param: { name: "weather_manual", type: "trigger", default: false },
        field: { name: "Ручний вибір міста", description: "Увімкніть, щоб ввести місто вручну" },
        onChange: function (val) {
            console.log("Погода", "Тригер ручного режиму: " + val);
            if (val) {
                var city = Lampa.Storage.get("weather_city", "");
                if (city) WeatherService.getWeather();
            } else {
                WeatherService.getWeather();
            }
        }
    });

    Lampa.SettingsApi.addParam({
        component: "weather_settings",
        param: { name: "weather_city", type: "input", values: "", placeholder: "Наприклад: Київ", default: "" },
        field: { name: "Назва міста", description: "Введіть назву міста" },
        onChange: function (val) {
            console.log("Погода", "Введено місто: " + val);
            if (val && Lampa.Storage.get("weather_manual", false)) {
                WeatherService.getWeather();
            }
        },
        onRender: function (item) {
            setTimeout(function () {
                if (Lampa.Storage.get("weather_manual", false)) item.show();
                else item.hide();
            }, 20);
        }
    });

    Lampa.SettingsApi.addParam({
        component: "weather_settings",
        param: {
            name: "weather_interval",
            type: "select",
            values: { 0: "Не оновлювати", 15: "15 хвилин", 30: "30 хвилин", 60: "1 година", 120: "2 години" },
            default: "0"
        },
        field: { name: "Автооновлення", description: "Оберіть інтервал оновлення погоди" },
        onChange: function () {
            WeatherService.restartUpdateTimer();
        }
    });

    Lampa.Storage.listener.follow("change", function (e) {
        if (e.name === "weather_manual") {
            setTimeout(function () {
                if (Lampa.Storage.get("weather_manual", false)) {
                    $('div[data-name="weather_city"]').show();
                } else {
                    $('div[data-name="weather_city"]').hide();
                }
            }, 50);
        }
    });

    // Ініціалізація плагіна та монтування віджета в шапку
    function initPlugin() {
        WeatherService.create();

        var timeElem = $(".head__time");
        if (timeElem.length) {
            WeatherService.render().insertBefore(timeElem);
        } else {
            $(".head__actions").append(WeatherService.render());
        }

        WeatherService.getWeather();
        WeatherService.startUpdateTimer();
    }

    if (window.appready) {
        initPlugin();
    } else {
        Lampa.Listener.follow("app", function (e) {
            if (e.type === "ready") initPlugin();
        });
    }
})();

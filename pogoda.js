(function () {
    'use strict';

    // 1. База свят та іменин за датами (день.місяць)
    function getDailyInfo() {
        var date = new Date();
        var day = date.getDate();
        var month = date.getMonth() + 1;
        var key = (day < 10 ? '0' : '') + day + '.' + (month < 10 ? '0' : '') + month;

        var calendar = {
            "22.09": {
                holiday: "День поза авто, Всесвітній день морів",
                angels: "Йосип, Микола, Олександр, Олексій, Ганна"
            },
            "23.09": {
                holiday: "День осіннього рівнодення",
                angels: "Андрій, Іван, Петро, Павло"
            }
            // Додавайте інші дати у форматі "ДД.ММ" за потреби
        };

        return calendar[key] || {
            holiday: "Офіційних свят на сьогодні немає",
            angels: "Інформація уточнюється"
        };
    }

    // 2. Головний модуль плагіна
    function WeatherHolidayPlugin() {
        var weatherData = null;

        // Завантаження погоди безкоштовно через wttr.in (або замініть на свій API)
        function fetchWeather(callback) {
            $.ajax({
                url: 'https://wttr.in/?format=j1',
                type: 'GET',
                dataType: 'json',
                success: function (res) {
                    if (res && res.current_condition && res.current_condition[0]) {
                        var current = res.current_condition[0];
                        weatherData = {
                            temp: current.temp_C,
                            description: current.lang_uk ? current.lang_uk[0].value : current.weatherDesc[0].value,
                            feelsLike: current.FeelsLikeC,
                            humidity: current.humidity + '%',
                            wind: current.windspeedKmph + ' км/год'
                        };
                        if (callback) callback(weatherData);
                    }
                },
                error: function () {
                    weatherData = { temp: '?', description: 'Не вдалося завантажити' };
                    if (callback) callback(weatherData);
                }
            });
        }

        // Відображення модального вікна при натисканні
        function showModal() {
            var info = getDailyInfo();
            var todayStr = new Date().toLocaleDateString('uk-UA', { 
                day: 'numeric', 
                month: 'long', 
                weekday: 'long' 
            });

            var html = '<div style="padding: 15px; font-size: 1.1em; line-height: 1.6;">' +
                '<div style="margin-bottom: 12px; color: #fff; font-weight: bold; text-transform: capitalize; font-size: 1.2em;">📅 ' + todayStr + '</div>' +
                '<div style="margin-bottom: 10px; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;">' +
                    '<b>🌤 Погода:</b> ' + (weatherData ? weatherData.temp + '°C, ' + weatherData.description : 'Завантаження...') + '<br>' +
                    (weatherData && weatherData.feelsLike ? '<small style="color:#aaa;">Відчувається як: ' + weatherData.feelsLike + '°C | Вологість: ' + weatherData.humidity + ' | Вітер: ' + weatherData.wind + '</small>' : '') +
                '</div>' +
                '<div style="margin-bottom: 8px; color: #ffd700;"><b>🎉 Свято:</b> ' + info.holiday + '</div>' +
                '<div style="color: #64b5f6;"><b>😇 День ангела:</b> ' + info.angels + '</div>' +
            '</div>';

            Lampa.Modal.open({
                title: 'Інформація на сьогодні',
                html: html,
                size: 'medium',
                onBack: function() {
                    Lampa.Modal.close();
                }
            });
        }

        // Створення елемента погоди у верхній панелі Lampa
        function renderWidget() {
            var button = $('<div class="head-action selector weather-btn" style="padding: 0 10px; display: flex; align-items: center; gap: 6px; cursor: pointer;">' +
                '<span class="weather-icon">🌤</span>' +
                '<span class="weather-temp">--°C</span>' +
            '</div>');

            // Обробка вибору (клік мишкою або пульт)
            button.on('hover:enter click', function () {
                showModal();
            });

            // Оновлюємо температуру після завантаження
            fetchWeather(function(data) {
                if (data && data.temp !== '?') {
                    button.find('.weather-temp').text(data.temp + '°C');
                }
            });

            // Додаємо кнопку в шапку біля годинника та налаштувань
            $('.head__actions').prepend(button);
        }

        // Ініціалізація після готовності Lampa
        if (window.appready) {
            renderWidget();
        } else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') renderWidget();
            });
        }
    }

    WeatherHolidayPlugin();
})();

/*
 * Configuration for Aeris weather js.
 * Requires subscription to developer api(FREE)
 */
aeris.config.set({
    apiId: 'NsPuRu3InFgIvvtiBFlOY',
    apiSecret: 'z2ZzlPeWZ3UeARqpU89f1mFpbr0qUoWbW5PbzTcI'
});

/*
 * Get Current weather condition by providing Latitude Longitude of any place
 * returns Object which holds the required value "current Temp, FeelsLike, Weather"
 */
function getCurrentWeather(latlong) {
    var currentWeatherData = [];

//Pop up the error msg if the valid input is not available.
    if (latlong.trim() === "")
    {
        currentWeatherData.push({
            status: 'error',
            error_code: 'Invalid Parameters',
            error_mesage: 'Please provide valid params - Latitude,Longitude OR City, State OR Zipcode'
        });
        return currentWeatherData;
    }

    var currentWeather = new aeris.api.models.Observation({
        id: latlong
    });

    currentWeather.fetch().done(function (response) {
        currentWeatherData.push({
            status: 'success',
            currentTemp: response.response.ob.tempF,
            feelsLike: response.response.ob.feelslikeF,
            weather: response.response.ob.weather
        });

    }).fail(function (err) {
        currentWeatherData.push({
            status: 'error',
            error_code: err.code,
            error_mesage: err.message

        });

    });
    console.log(currentWeatherData);
    return currentWeatherData;

}

// $(document).ready(function () {
//     var latlong = '44.86,-93.03';
//     var result =  getCurrentWeather(latlong);
//     console.log(result);
//
//     latlong = 'Eagan, MN';
//     result = getCurrentWeather(latlong);
//     console.log(result);
//
//     latlong = '55123';
//     result = getCurrentWeather(latlong);
//     console.log(result);
//
//     latlong = "";
//     result = getCurrentWeather(latlong);
//     console.log(result);
//
//     latlong = "552";
//     result = getCurrentWeather(latlong);
//     console.log(result);
//
// });

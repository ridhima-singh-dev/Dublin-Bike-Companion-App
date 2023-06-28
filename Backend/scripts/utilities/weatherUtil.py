import datetime

from scripts.utilities.MySQLUtils import DBUtils
import requests
from scripts.constants import app_constants
import json


def extract_weather_forecast(raw_forecasts, station_id):
    forecasts = []
    for raw_forecast in raw_forecasts:
        forecast = []
        forecast.append(raw_forecast['dt'])
        temp = raw_forecast['main']['feels_like']
        weather = raw_forecast['weather'][0]['main']

        forecast.append(temp)
        forecast.append(weather)
        forecast.append(station_id)
        forecasts.append(forecast)
    return forecasts


def insert_weather_forecast(station_id, position):
    lat = position['lat']
    lng = position['lng']
    weather_forecast_response = requests.get(app_constants.DataSource.WEATHER_FORECAST_API.format(lat=lat, lon=lng,
                                                                                                  weather_api_key=app_constants.DataSource.WEATHER_API_KEY))
    weather_forecast_data = weather_forecast_response.text
    weather_forecast_dict = json.loads(weather_forecast_data)
    weather_five_day_forecast = weather_forecast_dict['list']
    flush_query = 'DELETE FROM `dublinbikes`.`weather_forecast` WHERE station_id = %s and id>0;'
    DBUtils().remove_station_data(flush_query, station_id)
    weather_forecast_values = extract_weather_forecast(weather_five_day_forecast, station_id)
    query = "INSERT INTO `dublinbikes`.`weather_forecast` (`predict_date`,`temperature`," \
            "`weather`,`station_id`) VALUES (%s,%s,%s,%s); "
    DBUtils().insert_multiple_rows(query, weather_forecast_values)


def get_weather_forecast_from_db(station_id, prediction_time):
    query = "SELECT `predict_date`,`weather`,`temperature` FROM `dublinbikes`.`weather_forecast` WHERE `station_id` = " \
            "%s"
    prediction_rows = DBUtils().get_station_data(query, station_id)
    time_diff = datetime.timedelta(days=30)
    correct_db_id = 0
    correct_temp = None
    correct_weather = None
    for predictions in prediction_rows:
        forecast_time_string, weather, temp_string = predictions
        #check timezone issue @Aarya
        dt_utc_db = datetime.datetime.utcfromtimestamp(int(forecast_time_string))
        current_time_diff = dt_utc_db - prediction_time
        if current_time_diff < time_diff:
            correct_temp = int(float(temp_string)) - 273
            correct_weather = weather
    return correct_temp, correct_weather

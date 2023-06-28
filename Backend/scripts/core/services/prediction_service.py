import requests
import pickle
import pandas as pd
from flask import Blueprint, request, jsonify
from datetime import datetime

from flask_cors import cross_origin

from scripts.constants import app_constants
from scripts.utilities import weatherUtil

prediction_service_router = Blueprint('prediction_service_router', __name__, url_prefix="/predictions")

prediction_service_router.model_dictionary = dict()
prediction_service_router.station_ids = []
prediction_service_router.total_bikes_dict = dict()
prediction_service_router.last_updated_dict = dict()
prediction_service_router.position_dict = dict()
prediction_service_router.last_forecast_updated = dict()
day_ranks = {
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
    'Sunday': 7
}

weather_ranks = {
    'Clear': 1,
    'Clouds': 2,
    'Drizzle': 3,
    'Mist': 4,
    'Rain': 5,
    'Fog': 6,
    'Snow': 7
}


@prediction_service_router.record_once
def deserialize_picklefiles(state):
    # Getting station ids from the jcdeaux directly
    load_station_details()
    # Adding to a global dictionary which stores classifiers against the station id string
    for station in prediction_service_router.station_ids:
        model_file_name = str(station)
        model_file_name = 'scripts/core/models/' + model_file_name + '.pkl'
        classifier_name = str(station)
        with open(model_file_name, 'rb') as handle:
            prediction_service_router.model_dictionary[classifier_name] = pickle.load(handle)


def load_station_details():
    url = f'{app_constants.DataSource.DUBLIN_BIKES_BASE_API}/stations'
    params = {'contract': 'dublin', 'apiKey': f'{app_constants.DataSource.API_KEY}'}
    response = requests.get(url, params=params)
    stations_details = response.json()
    for station_dtl in stations_details:
        prediction_service_router.station_ids.append(station_dtl['number'])
        prediction_service_router.total_bikes_dict[station_dtl['number']] = station_dtl['bike_stands']
        prediction_service_router.position_dict[station_dtl['number']] = station_dtl['position']
        weatherUtil.insert_weather_forecast(station_dtl['number'], station_dtl['position'])
        prediction_service_router.last_forecast_updated[station_dtl['number']] = datetime.today()


# Get the day of the week as a string
def datetime_to_day(fetch_time):
    day_of_week = fetch_time.strftime('%A')
    return day_ranks[day_of_week]


def quantify_weather(weather):
    return weather_ranks[weather]


def datetime_to_decimal(fetch_time):
    hour = fetch_time.hour
    minute = fetch_time.minute
    time_in_decimal = hour + (minute / 60)
    return round(time_in_decimal, 2)


@prediction_service_router.route('/predict/<station_id>', methods=['POST'])
@cross_origin()
def get_predictions(station_id):
    # Access the JSON payload from the request body
    input_data = request.json
    prediction_time_str = input_data.get('time')
    prediction_time = datetime.strptime(prediction_time_str, '%Y-%m-%d %H:%M:%S')

    today = datetime.today()
    station_id_val = int(station_id)
    update_gap = today - prediction_service_router.last_forecast_updated[station_id_val]
    update_gap_days = update_gap.days
    if update_gap_days >= 1:
        # Insert latest weather forecast in the DB
        weatherUtil.insert_weather_forecast(station_id, prediction_service_router.position_dict[station_id_val])

    # Prediction possibility check
    time_to_prediction = prediction_time - today
    num_of_days = time_to_prediction.days
    if num_of_days > 5:
        return 'Prediction beyond 5 days is not possible.'

    # Finding the record that is closest to the prediction time in the DB
    # and fetch the weather and temp from that record @Aarya

    recieved_data = weatherUtil.get_weather_forecast_from_db(station_id_val, prediction_time)
    temperature, weather = recieved_data
    hour = datetime_to_decimal(prediction_time)
    day_of_week = datetime_to_day(prediction_time)
    weather_val = quantify_weather(weather)

    df = pd.DataFrame({
        'weather': [weather_val],
        'temperature': [temperature],
        'hour': [hour],
        'day_of_week': [day_of_week]
    })
    print(prediction_service_router.model_dictionary.keys())
    model = prediction_service_router.model_dictionary[station_id]
    print(df.hour)
    val_array = model.predict(df)
    return jsonify(val_array[0])

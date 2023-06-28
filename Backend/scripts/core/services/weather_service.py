import json

import requests
from flask import Blueprint, jsonify, request
from flask_cors import cross_origin

from scripts.constants import app_constants

weather_service_router = Blueprint('weather_service_router', __name__, url_prefix="/weather")


@weather_service_router.route("/fetch", methods=['POST'])
@cross_origin()
def fetch_current_weather():
    input_data = request.json
    lat = input_data['lat']
    lng = input_data['lng']
    weather_response = requests.get(app_constants.DataSource.WEATHER_API.format(lat=lat, lon=lng,
                                                                                weather_api_key=app_constants.DataSource.WEATHER_API_KEY))
    weather_data = weather_response.text
    print(weather_data)
    weather_dict = json.loads(weather_data)
    current_weather = weather_dict['main']
    current_weather['main'] = weather_dict['weather'][0]['main']
    response = jsonify(current_weather)
    # response.headers.add("Access-Control-Allow-Origin", "*")
    return response


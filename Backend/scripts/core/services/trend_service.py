import json
from datetime import datetime

import requests
from flask import Blueprint, jsonify, request
from flask_cors import cross_origin

from scripts.constants import app_constants
from scripts.utilities import trend_util

trend_service_router = Blueprint('trend_service_router', __name__, url_prefix="/trends")


# create APIs which gives historic data.
# All the historic data is stored in apidata table in the DB.



# When a station ID is given, need to fetch the last 7 day details for that station.
@trend_service_router.route('/weekly/<station_id>', methods=['POST'])
@cross_origin()
def get_weekly_data(station_id):
    #The time from which the trend is to be fetched will be today obv.
    today = datetime.today()
    station_id_val = int(station_id)

    # Finding all the records in the DB for that station for the past 7 days.
    recieved_data = trend_util.get_weekly_trend_from_db(station_id_val, today)
    return json.dumps(recieved_data)


@trend_service_router.route('/today/<station_id>', methods=['POST'])
@cross_origin()
def get_hourly_data_for_day(station_id):
    #The time from which the trend is to be fetched will be today obv.
    today = datetime.now()
    station_id_val = int(station_id)
    # Finding all the records in the DB for that station for the past 7 days.
    recieved_data = trend_util.get_today_hourly_data_from_db(station_id_val, today)
    return json.dumps(recieved_data)







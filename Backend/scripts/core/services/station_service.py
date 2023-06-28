import requests
from flask import Blueprint, jsonify

from scripts.constants import app_constants

station_service_router = Blueprint('station_service_router', __name__, url_prefix="/stations")


@station_service_router.route('/contract')
def get_stations_Contract():
    url = f'{app_constants.DataSource.DUBLIN_BIKES_BASE_API}/stations'
    params = {'contract': 'dublin', 'apiKey': f'{app_constants.DataSource.API_KEY}'}
    response = requests.get(url, params=params)
    data = response.json()
    response = jsonify(data)
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response


@station_service_router.route('/list')
def get_stations_lists():
    url = f'{app_constants.DataSource.DUBLIN_BIKES_BASE_API}/stations'
    params = {'apiKey': f'{app_constants.DataSource.API_KEY}'}
    response = requests.get(url, params=params)
    data = response.json()
    response = jsonify(data)
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response


@station_service_router.route('/<int:station_id>')
def get_stationInfo(station_id):
    url = f'{app_constants.DataSource.DUBLIN_BIKES_BASE_API}/stations/{station_id}'
    params = {'contract': 'rouen', 'apiKey': '345d8f2cc1b7c5cf1bd07cbea465c9b0ee666e6a'}
    response = requests.get(url, params=params)
    data = response.json()

    response = jsonify(data)
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

@station_service_router.route('/contractslist')
def get_contracts():
    url = f'{app_constants.DataSource.DUBLIN_BIKES_BASE_API}/contracts'
    params = {'apiKey': '345d8f2cc1b7c5cf1bd07cbea465c9b0ee666e6a'}
    response = requests.get(url, params=params)
    data = response.json()
    response = jsonify(data)
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response


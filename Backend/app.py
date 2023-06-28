from flask import Flask
from flask_cors import CORS

from scripts.core.services.station_service import station_service_router
from scripts.core.services.prediction_service import prediction_service_router
from scripts.core.services.trend_service import trend_service_router
from scripts.core.services.weather_service import weather_service_router

app = Flask(__name__)
CORS(app)

app.register_blueprint(station_service_router)
app.register_blueprint(prediction_service_router)
app.register_blueprint(weather_service_router)
app.register_blueprint(trend_service_router)


# @app.after_request
# def after_request(response):
#     response.headers[
#         "Access-Control-Allow-Origin"] = "*" 
#     response.headers["Access-Control-Allow-Credentials"] = "true"
#     response.headers["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS, PUT, DELETE"
#     response.headers[
#         "Access-Control-Allow-Headers"] = "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization"
#     return response


if __name__ == "__main__":
    app.run(host='localhost', port=5000)

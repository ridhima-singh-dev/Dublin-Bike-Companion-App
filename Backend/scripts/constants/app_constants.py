import configparser

config = configparser.ConfigParser()
config.read('config/app_config.conf')


class DataSource:
    API_KEY = config.get("JCDecaux", "API_KEY")
    CONTRACT = config.get("JCDecaux", "CONTRACT")
    WEATHER_API_KEY = config.get("JCDecaux", "WEATHER_API_KEY")
    DYNAMIC_DATA_API = f"https://api.jcdecaux.com/vls/v1/stations?contract={CONTRACT}&apiKey={API_KEY}"
    WEATHER_API = "https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={weather_api_key}"
    DUBLIN_BIKES_BASE_API = config.get("JCDecaux", "BASE_API")
    WEATHER_FORECAST_API = "https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={" \
                           "weather_api_key}"


class DB:
    HOST = config.get("SQL", "host")
    PORT = config.get("SQL", "port")
    USER = config.get("SQL", "user")
    PASSWORD = config.get("SQL", "password")
    DATABASE = config.get("SQL", "database")

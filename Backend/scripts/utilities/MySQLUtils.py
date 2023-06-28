import mysql.connector
from scripts.constants import app_constants


class DBUtils:
    def __init__(self):
        self.db = mysql.connector.connect(
            host=app_constants.DB.HOST,
            user=app_constants.DB.USER,
            password=app_constants.DB.PASSWORD,
            port=app_constants.DB.PORT,
            database=app_constants.DB.DATABASE
        )

    def __del__(self):
        self.db.close()

    def execute_query(self, query):
        try:
            cursor = self.db.cursor()
            cursor.execute(query)
            self.db.commit()
        except Exception as e:
            print(str(e))

    def insert_multiple_rows(self, query, val):
        try:
            cursor = self.db.cursor()
            cursor.executemany(query, val)
            self.db.commit()
        except Exception as e:
            print(str(e))

    def get_station_data(self, query, station_id):
        try:
            cursor = self.db.cursor()
            cursor.execute(query, (station_id,))
            rows = cursor.fetchall()
            return rows
        except Exception as e:
            print(str(e))

    def remove_station_data(self, query, station_id):
        try:
            cursor = self.db.cursor()
            cursor.execute(query, (station_id,))
        except Exception as e:
            print(str(e))


    def get_station_data_with_time(self, query, station_id,fetch_start, fetch_end):
        try:
            cursor = self.db.cursor()
            cursor.execute(query, (station_id,fetch_start,fetch_end,))
            rows = cursor.fetchall()
            return rows
        except Exception as e:
            print(str(e))

    def get_station_data_with_time_threshold(self, query, station_id,fetch_start):
        try:
            cursor = self.db.cursor()
            cursor.execute(query, (station_id,fetch_start,))
            rows = cursor.fetchall()
            return rows
        except Exception as e:
            print(str(e))
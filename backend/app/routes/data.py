import statistics
from flask_restful import Resource
from flask import request
from datetime import datetime, timedelta
from app.utils.database import place_latlong, data_summary, future_summary
from app.utils.calculator import (
    calculate_traffic_index_from_dict,
    calculate_aqi_from_dict,
    traffic_index_to_quality,
    try_read,
)


class DataBase(Resource):
    def get_params(self):
        location_id = int(request.form.get("id"))
        date_str = try_read("date", str(datetime.today().date()))
        date = datetime.strptime(date_str, "%Y-%m-%d")
        return location_id, date_str, date

    def prepare_response(
        self,
        location,
        date_str,
        data,
        average_traffic,
        average_air,
        future_data,
        data_return="hour",
    ):
        sum_future_traffic = sum(
            [
                future_data["traffic_data"][0]["car"],
                future_data["traffic_data"][0]["bike"],
                future_data["traffic_data"][0]["truck"],
                future_data["traffic_data"][0]["bus"],
                future_data["traffic_data"][0]["motorbike"],
            ]
        )

        return {
            "id": location["id"],
            "name": location["place"],
            "date": date_str,
            f"data_{data_return}": data,
            "traffic": self.calculate_future_traffic(
                future_data, sum_future_traffic, average_traffic
            ),
            "average_air": self.calculate_future_air(future_data, average_air),
        }

    def calculate_future_traffic(
        self, future_data, sum_future_traffic, average_traffic
    ):
        return {
            "average": average_traffic,
            "bus": (future_data["traffic_data"][0]["bus"] / sum_future_traffic)
            * average_traffic
            / 2,
            "truck": (future_data["traffic_data"][0]["truck"] / sum_future_traffic)
            * average_traffic
            / 2,
            "car": (future_data["traffic_data"][0]["car"] / sum_future_traffic)
            * average_traffic,
            "bike": (future_data["traffic_data"][0]["bus"] / sum_future_traffic)
            * average_traffic
            * 2,
            "motorbike": (
                future_data["traffic_data"][0]["motorbike"] / sum_future_traffic
            )
            * average_traffic
            * 2,
        }

    def calculate_future_air(self, future_data, average_air):
        return {
            "average": average_air,
            "co": future_data["air_data"][0]["co"],
            "o3": future_data["air_data"][0]["o3"],
            "so2": future_data["air_data"][0]["so2"],
            "pm2_5": future_data["air_data"][0]["pm2_5"],
            "pm10": future_data["air_data"][0]["pm10"],
            "nh3": future_data["air_data"][0]["nh3"],
        }

    def get_weekly_data(self, location_id, date, date_keys):
        return data_summary.find_one(
            {"id": location_id},
            {**{"id": 1, "place": 1}, **{date_key: 1 for date_key in date_keys}},
        )

    def get_range_data(self, location_id, date_keys):
        query_dict = {"id": 1, "place": 1}
        for date_key in date_keys:
            query_dict[date_key] = 1
        return data_summary.find_one({"id": location_id}, query_dict)

    def get_future_summary_data(self, location_id):
        return future_summary.find_one(
            {"id": location_id},
            {"traffic_data": {"$slice": 1}, "air_data": {"$slice": 1}},
        )

    def calculate_range_data(self, location, date_keys):
        data_day = []
        traffic_quality_index, air_quality_index = [], []
        for i, day_key in enumerate(date_keys):
            traffic_summary = location[day_key]["traffic_summary"]
            air_summary = location[day_key]["air_summary"]
            data_day.append(
                {
                    "day": i,
                    "traffic_quality_index": sum(traffic_summary) / 24,
                    "air_quality_index": sum(air_summary) / 24,
                    "source": "historical",
                }
            )
            traffic_quality_index.append(statistics.mean(traffic_summary))
            air_quality_index.append(statistics.mean(air_summary))
        return data_day, traffic_quality_index, air_quality_index

    def generate_date_keys(self, date, date_range):
        return [str((date - timedelta(i)).date()) for i in range(date_range)]


class DataCurrent(DataBase):
    def get(self, id):
        location = place_latlong.find_one({"id": id})
        traffic_data, air_data = location["traffic_data"][0], location["air_data"][0]
        traffic_data["traffic_quality_index"] = calculate_traffic_index_from_dict(
            traffic_data
        )
        traffic_data["traffic_quality"] = traffic_index_to_quality(
            traffic_data["traffic_quality_index"]
        )
        air_quality = air_data["aqp"]
        air_data = air_data["components"]
        air_quality_index = calculate_aqi_from_dict(air_data)
        return {
            "id": location["id"],
            "name": location["place"],
            "lat": location["lat"],
            "long": location["long"],
            "time": str(datetime.now()),
            "request": location["request"],
            "traffic_data": traffic_data,
            "air_data": {
                "air_quality": air_quality,
                "air_quality_index": air_quality_index,
                **air_data,
            },
        }


class DataDaily(DataBase):
    def post(self):
        location_id, date_str, date = self.get_params()

        if date.date() > datetime.today().date():
            return self.get_future_data(location_id, date, date_str)
        elif date.date() == datetime.today().date():
            return self.get_today_data(location_id, date_str)
        else:
            return self.get_past_data(location_id, date_str)

    def get_future_data(self, location_id, date, date_str):
        location, _, _, future_data = self.prepare_data(
            location_id, date_str, average=False
        )
        average_traffic, average_air = 10, 110  # Placeholder values
        timespan = (date.date() - datetime.today().date()).days
        data_hour = [
            {
                "hour": i,
                "traffic_quality_index": calculate_traffic_index_from_dict(
                    future_data["traffic_data"][24 * timespan + i]
                ),
                "air_quality_index": calculate_aqi_from_dict(
                    future_data["air_data"][24 * timespan + i]
                ),
                "source": "prediction",
            }
            for i in range(24)
        ]

        return self.prepare_response(
            location, date_str, data_hour, average_traffic, average_air, future_data
        )

    def prepare_data(self, location_id, date_str, average=True):
        location = data_summary.find_one(
            {"id": location_id}, {"id": 1, "place": 1, date_str: 1}
        )
        average_traffic, average_air = None, None
        if average:
            average_traffic = statistics.mean(location[date_str]["traffic_summary"])
            average_air = statistics.mean(location[date_str]["air_summary"])
        future_data = future_summary.find_one(
            {"id": location_id}, {"traffic_data": 1, "air_data": 1}
        )
        return location, average_traffic, average_air, future_data

    def get_today_data(self, location_id, date_str):
        location, average_traffic, average_air, future_data = self.prepare_data(
            location_id, date_str
        )

        data_hour = [
            {
                "hour": i,
                "traffic_quality_index": location[date_str]["traffic_summary"][i],
                "air_quality_index": location[date_str]["air_summary"][i],
                "source": "historical",
            }
            for i in range(24)
        ]

        for i in range(datetime.now().hour, 24):
            data_hour[i] = {
                "hour": i,
                "traffic_quality_index": calculate_traffic_index_from_dict(
                    future_data["traffic_data"][i]
                ),
                "air_quality_index": calculate_aqi_from_dict(
                    future_data["air_data"][i]
                ),
                "source": "prediction",
            }

        return self.prepare_response(
            location, date_str, data_hour, average_traffic, average_air, future_data
        )

    def get_past_data(self, location_id, date_str):
        location, average_traffic, average_air, future_data = self.prepare_data(
            location_id, date_str
        )

        data_hour = [
            {
                "hour": i,
                "traffic_quality_index": location[date_str]["traffic_summary"][i],
                "air_quality_index": location[date_str]["air_summary"][i],
                "source": "historical",
            }
            for i in range(24)
        ]

        return self.prepare_response(
            location, date_str, data_hour, average_traffic, average_air, future_data
        )


class DataWeekly(DataBase):
    def post(self):
        location_id, date_str, date = self.get_params()

        if date.date() > datetime.today().date():
            return {"error": "Date must be in range today and before"}

        date_keys = self.generate_date_keys(date, 7)
        location = self.get_weekly_data(location_id, date, date_keys)
        if not location:
            return {"error": "Location not found"}

        data_day, traffic_quality_index, air_quality_index = self.calculate_range_data(
            location, date_keys
        )
        future_data = self.get_future_summary_data(location_id)

        average_traffic = statistics.mean(traffic_quality_index)
        average_air = statistics.mean(air_quality_index)

        return self.prepare_response(
            location,
            date_str,
            data_day,
            average_traffic,
            average_air,
            future_data,
            data_return="day",
        )


class DataRange(DataBase):
    def post(self):
        location_id, date_str, date = self.get_params()
        if date.date() > datetime.today().date():
            return {"error": "End date must be in range today and before"}
        date_range = min(int(try_read("range", "3")), 7)
        date_keys = self.generate_date_keys(date, date_range)
        location = self.get_range_data(location_id, date_keys)
        if not location:
            return {"error": "Location not found"}

        data_day, traffic_quality_index, air_quality_index = self.calculate_range_data(
            location, date_keys
        )
        future_data = self.get_future_summary_data(location_id)

        average_traffic = statistics.mean(traffic_quality_index)
        average_air = statistics.mean(air_quality_index)

        return self.prepare_response(
            location,
            date_str,
            data_day,
            average_traffic,
            average_air,
            future_data,
            data_return="day",
        )

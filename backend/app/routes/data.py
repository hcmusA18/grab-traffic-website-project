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

slice_condition = {"$slice": -1}

class DataCurrent(Resource):
    def get(self, id):
        location = place_latlong.find_one({"id": id})
        # Get traffic data
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
                **air_data
            }
        }


class DataDaily(Resource):
    def post(self):
        location_id = int(request.form.get("id"))
        date_str = try_read("date", str(datetime.today().date()))
        date = datetime.strptime(date_str, "%Y-%m-%d")
        # Get hourly data of the date

        # Get future data
        if date.date() > datetime.today().date():
            print("Future")
            location = data_summary.find_one({"id": location_id}, {"id": 1, "place": 1})
            timespan = (date.date() - datetime.today().date()).days
            future_data = future_summary.find_one({"id": location_id}, {})
            average_traffic = 10  # statistics.mean(future_data["traffic_data"][24 * timespan : 24 * timespan + 24])
            average_air = 110  # statistics.mean(future_data["air_data"][24 * timespan : 24 * timespan + 24])
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
                for i in range(0, 24)
            ]
        elif date.date() == datetime.today().date():
            print("Today")
            location = data_summary.find_one(
                {"id": location_id}, {"id": 1, "place": 1, date_str: 1}
            )
            average_traffic = statistics.mean(location[date_str]["traffic_summary"])
            average_air = statistics.mean(location[date_str]["air_summary"])
            future_data = future_summary.find_one({"id": location_id}, {})
            data_hour = [
                {
                    "hour": i,
                    "traffic_quality_index": location[date_str]["traffic_summary"][i],
                    "air_quality_index": location[date_str]["air_summary"][i],
                    "source": "historical",
                }
                for i in range(0, 24)
            ]
            print(future_data["air_data"])
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
        else:
            location = data_summary.find_one(
                {"id": location_id}, {"id": 1, "place": 1, date_str: 1}
            )
            average_traffic = statistics.mean(location[date_str]["traffic_summary"])
            average_air = statistics.mean(location[date_str]["air_summary"])
            data_hour = [
                {
                    "hour": i,
                    "traffic_quality_index": location[date_str]["traffic_summary"][i],
                    "air_quality_index": location[date_str]["air_summary"][i],
                    "source": "historical",
                }
                for i in range(0, 24)
            ]
        # Get future data to fill in the blank
        future = future_summary.find_one(
            {"id": location_id}, {"id": 1, "traffic_data": 1, "air_data": 1}
        )
        future_traffic = future["traffic_data"]
        sum_future_traffic = (
            future_traffic[0]["car"]
            + future_traffic[0]["bike"]
            + future_traffic[0]["truck"]
            + future_traffic[0]["bus"]
            + future_traffic[0]["motorbike"]
        )
        return {
            "id": location["id"],
            "name": location["place"],
            "date": date_str,
            "data_hour": data_hour,
            "traffic": {
                "average": average_traffic,
                "bus": (future["traffic_data"][0]["bus"] / sum_future_traffic)
                * average_traffic
                / 2,
                "truck": (future["traffic_data"][0]["truck"] / sum_future_traffic)
                * average_traffic
                / 2,
                "car": (future["traffic_data"][0]["car"] / sum_future_traffic)
                * average_traffic,
                "bike": (future["traffic_data"][0]["bus"] / sum_future_traffic)
                * average_traffic
                * 2,
                "motorbike": (
                    future["traffic_data"][0]["motorbike"] / sum_future_traffic
                )
                * average_traffic
                * 2,
            },
            "average_air": {
                "average": average_air,
                "co": future["air_data"][0]["co"],
                "o3": future["air_data"][0]["o3"],
                "so2": future["air_data"][0]["so2"],
                "pm2_5": future["air_data"][0]["pm2_5"],
                "pm10": future["air_data"][0]["pm10"],
                "nh3": future["air_data"][0]["nh3"],
            },
        }


class DataWeekly(Resource):
    def post(self):
        location_id = int(request.form.get("id"))
        date_str = try_read("date", str(datetime.today().date()))
        date = datetime.strptime(date_str, "%Y-%m-%d")
        if date.date() > datetime.today().date():
            return {"error": "Date must be in range today and before"}
        location = data_summary.find_one(
            {"id": location_id},
            {
                "id": 1,
                "place": 1,
                str(date.date()): 1,
                str((date - timedelta(1)).date()): 1,
                str((date - timedelta(2)).date()): 1,
                str((date - timedelta(3)).date()): 1,
                str((date - timedelta(4)).date()): 1,
                str((date - timedelta(5)).date()): 1,
                str((date - timedelta(6)).date()): 1,
            },
        )
        data_day = [
            {
                "day": i,
                "traffic_quality_index": sum(
                    location[str((date - timedelta(6 - i)).date())]["traffic_summary"]
                )
                / 24,
                "air_quality_index": sum(
                    location[str((date - timedelta(6 - i)).date())]["air_summary"]
                )
                / 24,
                "source": "historical",
            }
            for i in range(0, 7)
        ]
        traffic_quality_index = []
        air_quality_index = []
        for i in range(0, 7):
            traffic_quality_index.append(
                statistics.mean(
                    location[str((date - timedelta(6 - i)).date())]["traffic_summary"]
                )
            )
            air_quality_index.append(
                statistics.mean(
                    location[str((date - timedelta(6 - i)).date())]["air_summary"]
                )
            )
        future = future_summary.find_one(
            {"id": location_id},
            {"id": 1, "traffic_data": {"$slice": 1}, "air_data": {"$slice": 1}},
        )
        sum_future_traffic = (
            future["traffic_data"][0]["car"]
            + future["traffic_data"][0]["bike"]
            + future["traffic_data"][0]["truck"]
            + future["traffic_data"][0]["bus"]
            + future["traffic_data"][0]["motorbike"]
        )
        average_traffic = statistics.mean(traffic_quality_index)
        return {
            "id": location["id"],
            "name": location["place"],
            "date": date_str,
            "data_day": data_day,
            "traffic": {
                "average": average_traffic,
                "bus": (future["traffic_data"][0]["bus"] / sum_future_traffic)
                * average_traffic
                / 2,
                "truck": (future["traffic_data"][0]["truck"] / sum_future_traffic)
                * average_traffic
                / 2,
                "car": (future["traffic_data"][0]["car"] / sum_future_traffic)
                * average_traffic,
                "bike": (future["traffic_data"][0]["bus"] / sum_future_traffic)
                * average_traffic
                * 2,
                "motorbike": (
                    future["traffic_data"][0]["motorbike"] / sum_future_traffic
                )
                * average_traffic
                * 2,
            },
            "average_air": {
                "average": statistics.mean(air_quality_index),
                "co": future["air_data"][0]["co"],
                "o3": future["air_data"][0]["o3"],
                "so2": future["air_data"][0]["so2"],
                "pm2_5": future["air_data"][0]["pm2_5"],
                "pm10": future["air_data"][0]["pm10"],
                "nh3": future["air_data"][0]["nh3"],
            },
        }


class DataRange(Resource):
    def post(self):
        location_id = int(request.form.get("id"))
        date_range = int(try_read("range", "3"))
        if date_range > 3:
            date_range = 7
        request_day = datetime.strptime(request.form.get("date"), "%Y-%m-%d")
        if request_day.date() > datetime.today().date():
            return {"error": "End date must be in range today and before"}

        query_dict = {"id": 1, "place": 1}
        for i in range(0, date_range):
            query_dict[str((request_day - timedelta(date_range - 1 - i)).date())] = 1
        print(query_dict)
        location = data_summary.find_one({"id": location_id}, query_dict)
        data_day = [
            {
                "day": i,
                "traffic_quality_index": sum(
                    location[str((request_day - timedelta(date_range - 1 - i)).date())][
                        "traffic_summary"
                    ]
                )
                / 24,
                "air_quality_index": sum(
                    location[str((request_day - timedelta(date_range - 1 - i)).date())][
                        "air_summary"
                    ]
                )
                / 24,
                "source": "historical",
            }
            for i in range(0, date_range)
        ]
        traffic_quality_index = []
        air_quality_index = []
        for i in range(0, date_range):
            traffic_quality_index.append(
                statistics.mean(
                    location[str((request_day - timedelta(date_range - 1 - i)).date())][
                        "traffic_summary"
                    ]
                )
            )
            air_quality_index.append(
                statistics.mean(
                    location[str((request_day - timedelta(date_range - 1 - i)).date())][
                        "air_summary"
                    ]
                )
            )
        future = future_summary.find_one(
            {"id": location_id},
            {"id": 1, "traffic_data": {"$slice": 1}, "air_data": {"$slice": 1}},
        )
        sum_future_traffic = (
            future["traffic_data"][0]["car"]
            + future["traffic_data"][0]["bike"]
            + future["traffic_data"][0]["truck"]
            + future["traffic_data"][0]["bus"]
            + future["traffic_data"][0]["motorbike"]
        )
        average_traffic = statistics.mean(traffic_quality_index)
        return {
            "id": location["id"],
            "name": location["place"],
            "date": str(request_day.date()),
            "data_day": data_day,
            "traffic": {
                "average": average_traffic,
                "bus": (future["traffic_data"][0]["bus"] / sum_future_traffic)
                * average_traffic
                / 2,
                "truck": (future["traffic_data"][0]["truck"] / sum_future_traffic)
                * average_traffic
                / 2,
                "car": (future["traffic_data"][0]["car"] / sum_future_traffic)
                * average_traffic,
                "bike": (future["traffic_data"][0]["bus"] / sum_future_traffic)
                * average_traffic
                * 2,
                "motorbike": (
                    future["traffic_data"][0]["motorbike"] / sum_future_traffic
                )
                * average_traffic
                * 2,
            },
            "average_air": {
                "average": statistics.mean(air_quality_index),
                "co": future["air_data"][0]["co"],
                "o3": future["air_data"][0]["o3"],
                "so2": future["air_data"][0]["so2"],
                "pm2_5": future["air_data"][0]["pm2_5"],
                "pm10": future["air_data"][0]["pm10"],
                "nh3": future["air_data"][0]["nh3"],
            },
        }

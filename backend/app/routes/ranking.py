import pickle
import statistics
import sys
import traceback
from flask_restful import Resource
from flask import request
from datetime import datetime, timedelta
from app.utils.database import place_latlong, data_summary
from app.utils.calculator import calculate_aqi, try_read
from app.utils.redis_cache import redis_cache


class RankingBase(Resource):
    def get_location_data(self, location):
        traffic_data = location["traffic_data"][0]
        air_data = location["air_data"][0]
        traffic_index = self.calculate_traffic_index(traffic_data)
        air_index = self.calculate_air_index(air_data["components"])
        return traffic_index, air_index

    def calculate_traffic_index(self, traffic_data):
        return (
            (traffic_data["bike"] + traffic_data["motorbike"]) * 0.5
            + traffic_data["car"]
            + (traffic_data["bus"] + traffic_data["truck"]) * 2
        )

    def calculate_air_index(self, air_data):
        return max(
            calculate_aqi(air_data["co"] * 0.873 * 0.001, "co"),
            calculate_aqi(air_data["no2"] * 0.531 * 1, "no2"),
            calculate_aqi(air_data["so2"] * 0.382 * 1, "so2"),
            calculate_aqi(air_data["o3"] * 0.509 * 0.001, "o3"),
            calculate_aqi(air_data["pm2_5"], "pm2_5"),
            calculate_aqi(air_data["pm10"], "pm10"),
        )

    def sort_and_rank(self, locations, key):
        sorted_locations = sorted(locations, key=lambda d: d[key])
        for i, location in enumerate(sorted_locations):
            location["rank"] = i + 1
        return sorted_locations

    def create_response(self, option, count, rankings):
        return {
            "time": str(datetime.now()),
            "count": count,
            "option": option,
            "ranking": rankings,
        }

    def get_cached_data(self, key):
        if redis_cache.exists(key):
            cached_data = redis_cache.get(key)
            return pickle.loads(cached_data)
        return None

    def cache_data(self, key, data):
        redis_cache.set(key, pickle.dumps(data))
        redis_cache.expire(key, 3600)

    def get_weekly_projection(self, today):
        return {
            "_id": 0,
            "id": 1,
            "place": 1,
            **{
                str((today - timedelta(i)).date()): {
                    "traffic_summary": 1,
                    "traffic_count": 1,
                    "air_summary": 1,
                    "air_count": 1,
                }
                for i in range(6, 0, -1)
            },
        }

    def calculate_weekly_average(self, data_piece, today, summary_key):
        avg_value = 0
        for i in range(7):
            day_key = str((today - timedelta(6 - i)).date())
            avg_value += sum(data_piece.get(day_key, {}).get(summary_key, [])) / (
                24 * 7
            )
        return avg_value


class RankingCurrent(RankingBase):
    def post(self):
        option = request.form.get("option", "both")
        locations = place_latlong.find(
            projection={
                "id": 1,
                "place": 1,
                "traffic_data": {"$slice": 1},
                "air_data": {"$slice": 1},
            }
        )
        locations_traffic, locations_air = [], []

        for location in locations:
            traffic_index, air_index = self.get_location_data(location)
            locations_traffic.append(
                {
                    "id": location["id"],
                    "name": location["place"],
                    "traffic_quality_index": traffic_index,
                }
            )
            locations_air.append(
                {
                    "id": location["id"],
                    "name": location["place"],
                    "air_quality_index": air_index,
                }
            )

        if option == "traffic":
            rankings = self.sort_and_rank(locations_traffic, "traffic_quality_index")
            return self.create_response("traffic", len(rankings), rankings)
        elif option == "air":
            rankings = self.sort_and_rank(locations_air, "air_quality_index")
            return self.create_response("air", len(rankings), rankings)
        else:
            traffic_rankings = self.sort_and_rank(
                locations_traffic, "traffic_quality_index"
            )
            air_rankings = self.sort_and_rank(locations_air, "air_quality_index")
            return {
                "time": str(datetime.now()),
                "count": len(air_rankings),
                "option": "both",
                "traffic_ranking": traffic_rankings,
                "air_ranking": air_rankings,
            }


class RankingDaily(RankingBase):
    def post(self):
        option = request.form.get("option", "change")
        today = request.form.get("date", str(datetime.today().date()))
        yesterday = str((datetime.strptime(today, "%Y-%m-%d") - timedelta(1)).date())

        traffic_ranking, air_ranking, change_ranking = [], [], []

        projection = {
            "_id": 0,
            "id": 1,
            "place": 1,
            today: {
                "traffic_summary": 1,
                "traffic_count": 1,
                "air_summary": 1,
                "air_count": 1,
            },
            yesterday: {
                "traffic_summary": 1,
                "traffic_count": 1,
                "air_summary": 1,
                "air_count": 1,
            },
        }

        for data_piece in data_summary.find({}, projection):
            try:
                avg_traffic, compared_traffic = self.calculate_average(
                    data_piece, today, yesterday, "traffic"
                )
                avg_air, compared_air = self.calculate_average(
                    data_piece, today, yesterday, "air"
                )

                traffic_ranking.append(
                    {
                        "id": data_piece["id"],
                        "name": data_piece["place"],
                        "traffic_quality_index": avg_traffic,
                    }
                )
                air_ranking.append(
                    {
                        "id": data_piece["id"],
                        "name": data_piece["place"],
                        "air_quality_index": avg_air,
                    }
                )
                change_ranking.append(
                    {
                        "id": data_piece["id"],
                        "name": data_piece["place"],
                        "change_index": (
                            (avg_air / compared_air)
                            + (avg_traffic / compared_traffic)
                            - 1
                        )
                        * (-100)
                        / 2,
                    }
                )
            except Exception as e:
                print(f"Error processing data piece: {e}")
                continue

        if option == "traffic":
            rankings = self.sort_and_rank(traffic_ranking, "traffic_quality_index")
            return self.create_response("traffic", len(rankings), rankings)
        elif option == "air":
            rankings = self.sort_and_rank(air_ranking, "air_quality_index")
            return self.create_response("air", len(rankings), rankings)
        else:
            rankings = self.sort_and_rank(change_ranking, "change_index")
            return self.create_response("change", len(rankings), rankings)

    def calculate_average(self, data_piece, today, yesterday, data_type):
        avg_value = 0
        compared_value = 0
        count = sum(data_piece[today][f"{data_type}_count"])
        for i in range(24):
            avg_value += (
                data_piece[today][f"{data_type}_summary"][i]
                * data_piece[today][f"{data_type}_count"][i]
                / count
            )
            compared_value += (
                data_piece[yesterday][f"{data_type}_summary"][i]
                * data_piece[yesterday][f"{data_type}_count"][i]
                / count
            )
        return avg_value, compared_value


class RankingWeekly(RankingBase):
    def post(self):
        option = try_read("option", "change")
        today_str = try_read("date", str(datetime.today().date()))
        today = datetime.strptime(today_str, "%Y-%m-%d")

        if option == "traffic":
            return self.handle_weekly_ranking(
                "traffic", today, self.calculate_weekly_traffic
            )
        elif option == "air":
            return self.handle_weekly_ranking("air", today, self.calculate_weekly_air)
        else:
            return self.handle_weekly_ranking(
                "change", today, self.calculate_weekly_change
            )

    def handle_weekly_ranking(self, ranking_type, today, calculate_function):
        cache_key = f"weekly-{ranking_type}-{today.date()}"
        cached_data = self.get_cached_data(cache_key)
        if cached_data:
            return cached_data

        rankings = calculate_function(today)
        if not rankings:
            return {"error": "data not found"}

        rankings = self.sort_and_rank(
            rankings,
            (
                f"{ranking_type}_quality_index"
                if ranking_type != "change"
                else "change_index"
            ),
        )
        response = self.create_response(ranking_type, len(rankings), rankings)
        self.cache_data(cache_key, response)
        return response

    def calculate_weekly_traffic(self, today):
        traffic_ranking = []
        projection = self.get_weekly_projection(today)

        for data_piece in data_summary.find({}, projection):
            try:
                avg_traffic = self.calculate_weekly_average(
                    data_piece, today, "traffic_summary"
                )
                traffic_ranking.append(
                    {
                        "id": data_piece["id"],
                        "name": data_piece["place"],
                        "traffic_quality_index": avg_traffic,
                    }
                )
            except Exception as e:
                print(f"Error: {e.with_traceback(sys.exc_info()[2])}")
                continue
        return traffic_ranking

    def calculate_weekly_air(self, today):
        air_ranking = []
        projection = self.get_weekly_projection(today)

        for data_piece in data_summary.find({}, projection):
            try:
                avg_air = self.calculate_weekly_average(
                    data_piece, today, "air_summary"
                )
                print(data_piece)
                air_ranking.append(
                    {
                        "id": data_piece["id"],
                        "name": data_piece["place"],
                        "air_quality_index": avg_air,
                    }
                )
            except Exception:
                print(f"Error: {traceback.format_exc()}")
                continue
        return air_ranking

    def calculate_weekly_change(self, today):
        change_ranking = []
        projection = self.get_weekly_projection(today)

        for data_piece in data_summary.find({}, projection):
            try:
                avg_air = self.calculate_weekly_average(
                    data_piece, today, "air_summary"
                )
                avg_traffic = self.calculate_weekly_average(
                    data_piece, today, "traffic_summary"
                )
                compared_air = statistics.mean(
                    data_piece[str((today - timedelta(6)).date())]["air_summary"]
                )
                compared_traffic = statistics.mean(
                    data_piece[str((today - timedelta(6)).date())]["traffic_summary"]
                )
                change = (
                    ((avg_air / compared_air) + (avg_traffic / compared_traffic) - 1)
                    * (-100)
                    / 2
                )
                change_ranking.append(
                    {
                        "id": data_piece["id"],
                        "name": data_piece["place"],
                        "change_index": change,
                    }
                )
            except Exception as e:
                print(f"Error: {e.with_traceback(sys.exc_info()[2])}")
                continue
        return change_ranking

import pickle
from datetime import datetime
import math
from flask_restful import Resource
from flask import request
from app.utils.database import place_latlong
from app.utils.calculator import (
    calculate_traffic_index_from_dict,
    calculate_aqi_from_dict,
    to_lowercase_english,
    traffic_index_to_quality,
    try_read
)
from app.utils.redis_cache import redis_cache

filter_air_traffic = {"traffic_data": 0, "air_data": 0, "_id": 0}
slice_condition = {"$slice": -1}
class LocationAll(Resource):
    def get(self):
        if redis_cache.get("locations"):
            cached_data = redis_cache.get("locations")
            locations = pickle.loads(cached_data)
            return {
                "count": len(locations),
                "time": str(datetime.now()),
                "locations": locations
            }
        locations = []
        for document in place_latlong.find(
            {},
            {
                "_id": 0,
                "id": 1,
                "place": 1,
                "lat": 1,
                "long": 1,
                "request": 1,
                "traffic_data": slice_condition,
                "air_data": slice_condition,
            },
        ):
            traffic_data, air_data = (
                document["traffic_data"][0],
                document["air_data"][0]["components"],
            )
            traffic_index = calculate_traffic_index_from_dict(traffic_data)
            locations.append(
                {
                    "id": document["id"],
                    "place": document["place"],
                    "lat": document["lat"],
                    "long": document["long"],
                    "request": document["request"],
                    "air_quality": document["air_data"][0]["aqp"],
                    "air_quality_index": calculate_aqi_from_dict(air_data),
                    "traffic_quality": traffic_index_to_quality(traffic_index),
                    "traffic_quality_index": traffic_index,
                }
            )
        redis_cache.set("locations", pickle.dumps(locations))
        redis_cache.expire("locations", 3600)
        return {
            "count": len(locations),
            "time": str(datetime.now()),
            "locations": locations,
        }


class LocationNameSearch(Resource):
    def post(self):
        keyword = request.form.get("keyword")
        keyword = to_lowercase_english(keyword)
        locations = []
        for document in place_latlong.find({}, filter_air_traffic):
            if keyword in to_lowercase_english(document["place"]):
                locations.append(document)
        return {"count": len(locations), "keyword": keyword, "locations": locations}


class LocationNameAutofill(Resource):
    def post(self):
        keyword = request.form.get("keyword")
        keyword = to_lowercase_english(keyword)
        locations = []
        for document in place_latlong.find({}, {"_id": 0, "id": 1, "place": 1}):
            if keyword in to_lowercase_english(document["place"]):
                locations.append({"id": document["id"], "place": document["place"]})
        return {"count": len(locations), "keyword": keyword, "locations": locations}


class LocationNearby(Resource):
    def post(self):
        location_id = int(request.form.get("id"))
        radius = int(try_read("radius", "3"))
        number = int(try_read("number", "3"))
        center = place_latlong.find_one(
            {"id": location_id}, {"traffic_data": 0, "air_data": 0, "_id": 0}
        )
        locations = []
        for document in place_latlong.find(
            {}, {"_id": 0, "id": 1, "place": 1, "lat": 1, "long": 1}
        ):
            distance = (
                math.sqrt(
                    (float(document["lat"]) - float(center["lat"])) ** 2
                    + (float(document["long"]) - float(center["long"])) ** 2
                )
                * 111
            )
            if (distance < radius) and (int(document["id"]) != location_id):
                locations.append(
                    {
                        "id": document["id"],
                        "place": document["place"],
                        "distance": distance,
                    }
                )
        locations = sorted(locations, key=lambda d: d["distance"])[0:number]
        return ({
            "count": len(locations),
            "param": {"radius": radius, "number": number},
            "center": {"id": location_id, "place": center["place"]},
            "locations": locations
        })

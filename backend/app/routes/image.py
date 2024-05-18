import pickle
from flask_restful import Resource
from flask import send_file
import requests, io
from app.utils.database import place_latlong
from app.utils.redis_cache import redis_cache

class GetImage(Resource):
    def get(self, id):
        if redis_cache.exists(f"{id}_image"):
            cached_data = redis_cache.get(f"{id}_image")
            return send_file(io.BytesIO(cached_data), mimetype="image/jpg")

        url = place_latlong.find_one({"id": id})["request"]
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.63 Safari/537.36"
        }
        file = requests.get(url, headers=headers)
        redis_cache.set(f"{id}_image", file.content)
        redis_cache.expire(f"{id}_image", 3600)
        return send_file(io.BytesIO(file.content), mimetype="image/jpg")

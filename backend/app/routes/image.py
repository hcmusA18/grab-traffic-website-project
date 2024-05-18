from flask_restful import Resource
from flask import send_file
import requests, io
from app.utils.database import place_latlong

class GetImage(Resource):
    def get(self, id):
        url = place_latlong.find_one({"id": id})["request"]
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.63 Safari/537.36"
        }
        file = requests.get(url, headers=headers)
        return send_file(io.BytesIO(file.content), mimetype="image/jpg")

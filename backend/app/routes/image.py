from flask_restful import Resource
from flask import send_file
import requests, io
from app.utils.database import place_latlong, image_database

class GetImage(Resource):
    def get(self, id):
        img = image_database.find_one({"id": id}, {"_id": 0, "id": 1, "image": 1})["image"]
        return send_file(io.BytesIO(img), mimetype="image/jpg")

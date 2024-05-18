from flask_restful import Resource
from flask import send_file
import requests, io
from app.utils.database import place_latlong
from app.utils.config import WEATHER_API_KEY as apiKey

class GetWeather(Resource):
    def get(self, id):
        center = place_latlong.find_one({"id": id}, {"_id": 0, "lat": 1, "long": 1})
        lat, lng = center["lat"], center["long"]
        print(apiKey)
        try: 
          location_key_url = f"http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey={apiKey}&q={lat},{lng}"
          res = requests.get(location_key_url).json()
          print(res)
          location_key = requests.get(location_key_url).json()["Key"]
        except Exception:
          return {"error": "Location not found"}, 404
        try:
          weather_url = f"http://dataservice.accuweather.com/currentconditions/v1/{location_key}?apikey={apiKey}&language=vi-vn&details=true"
          return requests.get(weather_url).json()[0]
        except Exception:
          return {"error": "Weather not found"}, 404

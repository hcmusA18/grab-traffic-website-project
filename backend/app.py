import os, requests, json, statistics
from flask import Flask, request
from flask_restful import Api, Resource
from flask_cors import CORS, cross_origin
from flask_pymongo import PyMongo
# from flask_caching import Cache
from datetime import datetime, timedelta
from collections import Counter
from database import *
from aqiCalculator import *
import math
# from trafficData import getData

# set up app
app = Flask(__name__)
api = Api(app)
cors = CORS(app)
# cache = Cache(config = {"CACHE_TYPE": "RedisCache", "CACHE_REDIS_HOST": "0.0.0.0", "CACHE_REDIS_PORT": 6379})
# cache.init_app(app)
app.config['CORS_HEADERS'] = 'Content-Type'


class hello(Resource):
  def get(self):
    return {"Welcome": "Hello World"}


class location_all(Resource):
  def get(self):
    locations = []
    for document in Place_LatLong_API.find({}, {"_id": 0, "id":1, "place":1, "lat":1, "long":1, "request":1, "traffic_data": {"$slice": -1}, "air_data":{"$slice": -1}}):
      traffic_data = document["traffic_data"][0]
      traffic_index = (traffic_data["person"]*0.25 + (traffic_data["bike"] + traffic_data["motorbike"])*0.5 + 
                     traffic_data["car"]*1 + (traffic_data["truck"] + traffic_data["bus"])*2)
      if (traffic_index < 2.5):
        traffic_data["traffic_quality"] = 1
      elif (traffic_index < 5):
        traffic_data["traffic_quality"] = 2
      elif (traffic_index < 7.5):
        traffic_data["traffic_quality"] = 3
      elif (traffic_index < 10):
        traffic_data["traffic_quality"] = 4
      else:
        traffic_data["traffic_quality"] = 5
      locations.append({
        "id": document["id"],
        "place": document["place"],
        "lat": document["lat"],
        "long": document["long"],
        "request": document["request"],
        "air_quality": document["air_data"][0]["aqp"],
        "traffic_quality": traffic_data["traffic_quality"]
      })
    return {
      "count": len(locations),
      "time": str(datetime.now()),
      "locations": locations
    }


class location_name_search(Resource):
  def post(self):
    name = request.form.get("keyword")
    locations = []
    for document in Place_LatLong_API.find({}, {"traffic_data":0, "air_data":0, "_id": 0}):
      if (name.lower() in document["place"].lower()):
        locations.append(document)
    return {
      "count": len(locations),
      "keyword": name,
      "locations": locations
    }


class location_name_autofill(Resource):
  def post(self):
    name = request.form.get("keyword")
    print(name)
    locations = []
    for document in Place_LatLong_API.find({}, {"traffic_data":0, "air_data":0, "_id": 0}):
      if (name.lower() in document["place"].lower()):
        locations.append({
          "id": document["id"],
          "place": document["place"]
        })
        print(document["place"])
    return {
      "count": len(locations),
      "keyword": name,
      "locations": locations
    }
  

class location_nearby(Resource):
  def post(self):
    id = int(request.form.get("id"))
    center = Place_LatLong_API.find_one({"id":id}, {"traffic_data":0, "air_data":0, "_id": 0})
    try:
      radius = float(request.form.get("radius"))
    except:
      radius = 3
    try:
      number = int(request.form.get("number"))
    except:
      number = 3
    locations = []
    for document in Place_LatLong_API.find({}, {"traffic_data":0, "air_data":0, "_id": 0}):
      distance = math.sqrt((float(document["lat"])-float(center["lat"]))**2 + (float(document["long"])-float(center["long"]))**2) * 111
      if ( distance < radius ) and (int(document["id"]) != id):
        locations.append({
          "id": document["id"],
          "place": document["place"],
          "distance": distance
        })
    locations = sorted(locations, key=lambda d: d['distance'])[0:number]
    return {
      "count": len(locations),
      "param": {
        "radius": radius,
        "number": number
      },
      "center": {
        "id": id,
        "place": center["place"]
      },
      "locations": locations
    }


class data_current(Resource):
  def get(self, id):
    location = Place_LatLong_API.find_one({"id": id}, {"id": 1, "lat": 1, "long":1, "place": 1, "request": 1, "traffic_data": {"$slice": -1}, "air_data":{"$slice": -1}})
    traffic_data = location["traffic_data"][0]
    traffic_data.pop("time")
    traffic_data["traffic_quality_index"] = (traffic_data["person"]*0.25 + (traffic_data["bike"] + traffic_data["motorbike"])*0.5 + 
                     traffic_data["car"]*1 + (traffic_data["truck"] + traffic_data["bus"])*2)
    if (traffic_data["traffic_quality_index"] < 2.5):
      traffic_data["traffic_quality"] = 1
    elif (traffic_data["traffic_quality_index"] < 5):
      traffic_data["traffic_quality"] = 2
    elif (traffic_data["traffic_quality_index"] < 7.5):
      traffic_data["traffic_quality"] = 3
    elif (traffic_data["traffic_quality_index"] < 10):
      traffic_data["traffic_quality"] = 4
    else:
      traffic_data["traffic_quality"] = 5
    air_data = location["air_data"][0]
    air_quality = air_data["aqp"]
    air_data = air_data["components"]
    air_data["air_quality"] = air_quality
    air_data["air_quality_index"] = max(
      calculate_aqi(air_data["co"] * 0.873 * 0.001, "co"), # Convert from miligram/m3 to ppm
      calculate_aqi(air_data["no2"] * 0.531 * 1, "no2"), # Convert from miligram/m3 to ppb
      calculate_aqi(air_data["so2"] * 0.382 * 1, "so2"), # Convert from miligram/m3 to ppb
      calculate_aqi(air_data["o3"] * 0.509 * 0.001, "o3"), # Convert from miligram/m3 to ppm
      calculate_aqi(air_data["pm2_5"], "pm2_5"), # Convert from miligram/m3 to ppm
      calculate_aqi(air_data["pm10"], "pm10"), # Convert from miligram/m3 to ppm
    )
    return {
      "id": location["id"],
      "name": location["place"],
      "lat": location["lat"],
      "long": location["long"],
      "time": str(datetime.now()),
      "request": location["request"],
      "traffic_data": traffic_data,
      "air_data": air_data
    }


class data_daily(Resource):
  def post(self):
    id = int(request.form.get("id"))
    try:
      today = datetime.strptime(request.form.get("date"), '%Y-%m-%d')
    except:
      today = datetime.today()
    location = data_summary.find_one({"id": id}, {"id":1, "place":1, str(today.date()) : 1})
    data_hour = [
      {
        "hour": i,
        "traffic_quality_index": location[str(today.date())]["traffic_summary"][i],
        "air_quality_index": location[str(today.date())]["air_summary"][i]
      } for i in range(0, 24)
    ]
    return {
      "id": location["id"],
      "name": location["place"],
      "date": str(today.date()),
      "data_hour": data_hour,
      "traffic_stat": {
        "average": statistics.mean(location[str(today.date())]["traffic_summary"]),
        "median": statistics.median(location[str(today.date())]["traffic_summary"]),
        "standard_deviation": statistics.stdev(location[str(today.date())]["traffic_summary"]),
        "maximum": max(location[str(today.date())]["traffic_summary"]),
        "rush_hour": location[str(today.date())]["traffic_summary"].index(max(location[str(today.date())]["traffic_summary"]))
      },
      "air_stat": {
        "average": statistics.mean(location[str(today.date())]["air_summary"]),
        "median": statistics.median(location[str(today.date())]["air_summary"]),
        "standard_deviation": statistics.stdev(location[str(today.date())]["air_summary"]),
        "maximum": max(location[str(today.date())]["air_summary"]),
        "unhealthy_hour": location[str(today.date())]["air_summary"].index(max(location[str(today.date())]["air_summary"]))
      }
    }


class data_weekly(Resource):
  def post(self):
    id = int(request.form.get("id"))
    try:
      today = datetime.strptime(request.form.get("date"), '%Y-%m-%d')
    except:
      today = datetime.today().replace(hour=0, minute=0, second=0, microsecond=0)
    location = data_summary.find_one({"id": id}, 
          {"id":1, "place":1, str(today.date()) : 1, str((today - timedelta(1)).date()): 1, str((today - timedelta(2)).date()): 1,
           str((today - timedelta(3)).date()): 1, str((today - timedelta(4)).date()): 1, str((today - timedelta(5)).date()): 1, str((today - timedelta(6)).date()): 1})
    data_day = [
      {
        "day": i,
        "traffic_quality_index": sum(location[str((today - timedelta(6-i)).date())]["traffic_summary"])/24,
        "air_quality_index": sum(location[str((today - timedelta(6-i)).date())]["air_summary"])/24
      } for i in range(0, 7)
    ]
    traffic_quality_index = []
    air_quality_index = []
    for i in range(0,7):
      traffic_quality_index.append( sum(location[str((today - timedelta(6-i)).date())]["traffic_summary"])/24 )
      air_quality_index.append( sum(location[str((today - timedelta(6-i)).date())]["air_summary"])/24 )
    return {
      "id": location["id"],
      "name": location["place"],
      "date": str(today.date()),
      "data_day": data_day,
      "traffic_stat": {
        "average": statistics.mean(traffic_quality_index),
        "median": statistics.median(traffic_quality_index),
        "standard_deviation": statistics.stdev(traffic_quality_index),
        "maximum": max(traffic_quality_index),
        "busy_day": traffic_quality_index.index(max(traffic_quality_index))
      },
      "air_stat": {
        "average": statistics.mean(air_quality_index),
        "median": statistics.median(air_quality_index),
        "standard_deviation": statistics.stdev(air_quality_index),
        "maximum": max(air_quality_index),
        "unhealthy_day": air_quality_index.index(max(air_quality_index))
      }
    }


class ranking_current(Resource):
  def post(self):
    try:
      option = request.form.get("option")
    except:
      option = "both"
    locations = Place_LatLong_API.find({}, {"_id":0, "id": 1, "place": 1,  "traffic_data": {"$slice": -1}, "air_data":{"$slice": -1}})
    locations_traffic = []
    locations_air = []
    for location in locations:
      traffic_data = location["traffic_data"][0]
      air_data = location["air_data"][0]
      locations_traffic.append(
        {
          "id": location["id"],
          "name": location["place"],
          "traffic_quality_index": ((traffic_data["bike"] + traffic_data["motorbike"])*0.5 + (traffic_data["car"])*1 + (traffic_data["bus"] + traffic_data["truck"])*2 )
        }
      )
      locations_traffic = sorted(locations_traffic, key=lambda d: d['traffic_quality_index'])
      for i in range(0, len(locations_traffic)):
        locations_traffic[i]["rank"] = i + 1
      locations_air.append(
        {
          "id": location["id"],
          "name": location["place"],
          "air_quality_index": max(
            calculate_aqi(air_data["components"]["co"] * 0.873 * 0.001, "co"), # Convert from miligram/m3 to ppm
            calculate_aqi(air_data["components"]["no2"] * 0.531 * 1, "no2"), # Convert from miligram/m3 to ppb
            calculate_aqi(air_data["components"]["so2"] * 0.382 * 1, "so2"), # Convert from miligram/m3 to ppb
            calculate_aqi(air_data["components"]["o3"] * 0.509 * 0.001, "o3"), # Convert from miligram/m3 to ppm
            calculate_aqi(air_data["components"]["pm2_5"], "pm2_5"), # Convert from miligram/m3 to ppm
            calculate_aqi(air_data["components"]["pm10"], "pm10"), # Convert from miligram/m3 to ppm
          )
        }
      )
      locations_air = sorted(locations_air, key=lambda d: d['air_quality_index'])
      for i in range(0, len(locations_traffic)):
        locations_air[i]["rank"] = i + 1
    if option == "traffic":
      return {
        "time": str(datetime.now()),
        "count": len(locations_air),
        "option": "traffic",
        "ranking": locations_traffic
      }
    elif option == "air":
      return {
        "time": str(datetime.now()),
        "count": len(locations_air),
        "option": "air",
        "ranking": locations_air
      }
    else:
      return {
        "time": str(datetime.now()),
        "count": len(locations_air),
        "option": "both",
        "traffic_ranking": locations_traffic,
        "air_ranking": locations_air,
      }


class ranking_daily(Resource):
  def post(self):
    try:
      option = request.form.get("option")
    except:
      option = "both"
    try:
      today = request.form.get("date")
    except:
      today = str(datetime.today().date())
    traffic_ranking = []
    air_ranking = []
    for data_piece in data_summary.find({}, {"_id":0, "id": 1, "place": 1, today: 1}):
      try:
        data = data_piece[today]
        avg_traffic = 0
        traffic_count = sum(data_piece[today]["traffic_count"])
        for i in range(0, 24):
          # avg_traffic += 1
          avg_traffic += data_piece[today]["traffic_summary"][i] * data_piece[today]["traffic_count"][i]/traffic_count
        traffic_ranking.append({
          "id": data_piece["id"],
          "name": data_piece["place"],
          "traffic_quality_index":  avg_traffic
        })
        avg_air = 0
        for i in range(0, 24):
          avg_air += data_piece[today]["air_summary"][i] * data_piece[today]["air_count"][i]/traffic_count
        air_ranking.append({
          "id": data_piece["id"],
          "name": data_piece["place"],
          "air_quality_index":  avg_air
        })
      except:
        pass
    traffic_ranking = sorted(traffic_ranking, key=lambda d: d['traffic_quality_index'])
    air_ranking = sorted(air_ranking, key=lambda d: d['air_quality_index'])
    for i in range(0, len(traffic_ranking)):
      traffic_ranking[i]["rank"] = i + 1
    for i in range(0, len(air_ranking)):
      air_ranking[i]["rank"] = i + 1
    if option == "traffic":
      return {
        "date": str(datetime.now()),
        "count": len(traffic_ranking),
        "option": "traffic",
        "ranking": traffic_ranking
      }
    elif option == "air":
      return {
        "date": str(datetime.now()),
        "count": len(air_ranking),
        "option": "air",
        "ranking": air_ranking
      }
    else:
      return {
        "date": str(datetime.now()),
        "count": len(traffic_ranking),
        "option": "both",
        "traffic_ranking": traffic_ranking,
        "air_ranking": air_ranking,
      }


class ranking_weekly(Resource):
  def post(self):
    try:
      option = request.form.get("option")
    except:
      option = "both"
    try:
      today = datetime.strptime(request.form.get("date"), "%Y-%m-%d")
    except:
      today = datetime.today()
    traffic_ranking = []
    air_ranking = []
    for data_piece in data_summary.find({}, {"_id":0, "id": 1, "place": 1, str(today.date()) : 1, str((today - timedelta(1)).date()): 1, str((today - timedelta(2)).date()): 1,
          str((today - timedelta(3)).date()): 1, str((today - timedelta(4)).date()): 1, str((today - timedelta(5)).date()): 1, str((today - timedelta(6)).date()): 1}):
      try:
        data = data_piece[str(today.date())]
        if not(option == "air"):
          avg_traffic = 0
          for i in range(0, 7):
            avg_traffic += sum(data_piece[str((today - timedelta(6-i)).date())]["traffic_summary"]) / (24 * 7)
          traffic_ranking.append({
            "id": data_piece["id"],
            "name": data_piece["place"],
            "traffic_quality_index":  avg_traffic
          })
        if not (option == "traffic"):
          avg_air = 0
          for i in range(0, 7):
            avg_air += sum(data_piece[str((today - timedelta(6-i)).date())]["air_summary"]) / (24 * 7) 
          air_ranking.append({
            "id": data_piece["id"],
            "name": data_piece["place"],
            "air_quality_index":  avg_air
          })
      except:
        print("Error")
    traffic_ranking = sorted(traffic_ranking, key=lambda d: d['traffic_quality_index'])
    air_ranking = sorted(air_ranking, key=lambda d: d['air_quality_index'])
    for i in range(0, len(traffic_ranking)):
      traffic_ranking[i]["rank"] = i + 1
    for i in range(0, len(air_ranking)):
      air_ranking[i]["rank"] = i + 1
    if option == "traffic":
      return {
        "date": str(datetime.now()),
        "count": len(traffic_ranking),
        "option": "traffic",
        "ranking": traffic_ranking
      }
    elif option == "air":
      return {
        "date": str(datetime.now()),
        "count": len(air_ranking),
        "option": "air",
        "ranking": air_ranking
      }
    else:
      return {
        "date": str(datetime.now()),
        "count": len(traffic_ranking),
        "option": "both",
        "traffic_ranking": traffic_ranking,
        "air_ranking": air_ranking,
      }


api.add_resource(hello, "/")
api.add_resource(location_all, "/location/all")
api.add_resource(location_name_search, "/location/name/search")
api.add_resource(location_name_autofill, "/location/name/autofill")
api.add_resource(location_nearby, "/location/nearby")
api.add_resource(data_current, "/data/current/locationID=<int:id>")
api.add_resource(data_daily, "/data/daily")
api.add_resource(data_weekly, "/data/weekly")
api.add_resource(ranking_current, "/ranking/current")
api.add_resource(ranking_daily, "/ranking/daily")
api.add_resource(ranking_weekly, "/ranking/weekly")

if __name__ == "__main__":
  app.run(debug=True, host="0.0.0.0", port=os.environ.get('LISTEN_PORT'))
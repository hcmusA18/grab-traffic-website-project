import os, requests, json, statistics, io
from flask import Flask, request, send_file
from flask_restful import Api, Resource
from flask_cors import CORS, cross_origin
from flask_pymongo import PyMongo
# from flask_caching import Cache
from datetime import datetime, timedelta
from collections import Counter
from database import *
from calculator import *
import math

app = Flask(__name__)
api = Api(app)
cors = CORS(app)
# cache = Cache(config = {"CACHE_TYPE": "RedisCache", "CACHE_REDIS_HOST": "0.0.0.0", "CACHE_REDIS_PORT": 6379})
# cache.init_app(app)
app.config['CORS_HEADERS'] = 'Content-Type'


class hello(Resource):
  def get(self):
    return {"Application": "[Application name]"}


class location_all(Resource):
  def get(self):
    locations = []
    for document in Place_LatLong_API.find({}, {"_id": 0, "id":1, "place":1, "lat":1, "long":1, "request":1, "traffic_data": {"$slice": -1}, "air_data":{"$slice": -1}}):
      traffic_data = document["traffic_data"][0]
      air_data = document["air_data"][0]["components"]
      traffic_index = calculate_traffic_index_from_dict(traffic_data)
      locations.append({
        "id": document["id"],
        "place": document["place"],
        "lat": document["lat"],
        "long": document["long"],
        "request": document["request"],
        "air_quality": document["air_data"][0]["aqp"],
        "air_quality_index": calculate_aqi_from_dict(air_data),
        "traffic_quality": traffic_index_to_quality(traffic_index),
        "traffic_quality_index": traffic_index
      })
    return {
      "count": len(locations),
      "time": str(datetime.now()),
      "locations": locations
    }


class location_name_search(Resource):
  def post(self):
    keyword = request.form.get("keyword")
    keyword = to_lowercase_english(keyword)
    locations = []
    for document in Place_LatLong_API.find({}, {"traffic_data":0, "air_data":0, "_id": 0}):
      if (keyword in to_lowercase_english(document["place"])):
        locations.append(document)
    return {
      "count": len(locations),
      "keyword": keyword,
      "locations": locations
    }


class location_name_autofill(Resource):
  def post(self):
    keyword = request.form.get("keyword")
    keyword = to_lowercase_english(keyword)
    locations = []
    for document in Place_LatLong_API.find({}, {"_id": 0, "id":1, "place": 1}):
      if (keyword in to_lowercase_english(document["place"])):
        locations.append({
          "id": document["id"],
          "place": 1
        })
    return {
      "count": len(locations),
      "keyword": keyword,
      "locations": locations
    }
  

class location_nearby(Resource):
  def post(self):
    id = int(request.form.get("id"))
    radius = int(try_read("radius", "3"))
    number = int(try_read("number", "3"))
    center = Place_LatLong_API.find_one({"id":id}, {"traffic_data":0, "air_data":0, "_id": 0})
    locations = []
    for document in Place_LatLong_API.find({}, {"_id": 0, "id":1, "place":1, "lat":1, "long":1}):
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
      "param": {"radius": radius, "number": number},
      "center": {"id": id, "place": center["place"]},
      "locations": locations
    }


class data_current(Resource):
  def get(self, id):
    location = Place_LatLong_API.find_one({"id": id}, {"id": 1, "lat": 1, "long":1, "place": 1, "request": 1, "traffic_data": {"$slice": -1}, "air_data":{"$slice": -1}})
    # Get traffic data
    traffic_data = location["traffic_data"][0]
    traffic_data.pop("time")
    traffic_data["traffic_quality_index"] = calculate_traffic_index_from_dict(traffic_data)
    traffic_data["traffic_quality"] = traffic_index_to_quality(traffic_data["traffic_quality_index"])
    # Get air data
    air_data = location["air_data"][0]
    air_quality = air_data["aqp"]
    air_data["air_quality"] = air_quality
    air_data["air_quality_index"] = calculate_aqi_from_dict(air_data["components"])
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
    date_str = try_read("date", str(datetime.today().date()))
    date = datetime.strptime(date_str, '%Y-%m-%d')
    location = data_summary.find_one({"id": id}, {"id":1, "place":1, date_str: 1})
    data_hour = [
      {
        "hour": i,
        "traffic_quality_index": location[date_str]["traffic_summary"][i],
        "air_quality_index": location[date_str]["air_summary"][i]
      } for i in range(0, 24)
    ]
    future = future_summary.find_one({"id": id}, {"id": 1, "traffic_data": {"$slice": 1}, "air_data": {"$slice": 1}})
    average_traffic = statistics.mean(location[date_str]["traffic_summary"])
    sum_future_traffic = future["traffic_data"][0]["car"] + future["traffic_data"][0]["bike"] + future["traffic_data"][0]["truck"] + future["traffic_data"][0]["bus"] + future["traffic_data"][0]["motorbike"]
    average_air = statistics.mean(location[date_str]["air_summary"])
    return {
      "id": location["id"],
      "name": location["place"],
      "date": date_str,
      "data_hour": data_hour,
      "traffic": {
        "average": average_traffic,
        "bus": (future["traffic_data"][0]["bus"] / sum_future_traffic) * average_traffic / 2,
        "truck": (future["traffic_data"][0]["truck"] / sum_future_traffic) * average_traffic / 2,
        "car": (future["traffic_data"][0]["car"] / sum_future_traffic) * average_traffic ,
        "bike": (future["traffic_data"][0]["bus"] / sum_future_traffic) * average_traffic * 2,
        "motorbike": (future["traffic_data"][0]["motorbike"] / sum_future_traffic) * average_traffic * 2,
      },
      "average_air": {
        "average": average_air,
        "co": future["air_data"][0]["co"],
        "o3": future["air_data"][0]["o3"],
        "so2": future["air_data"][0]["so2"],
        "pm2_5": future["air_data"][0]["pm2_5"],
        "pm10": future["air_data"][0]["pm10"],
        "nh3": future["air_data"][0]["nh3"],
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
      traffic_quality_index.append( statistics.mean(location[str((today - timedelta(6-i)).date())]["traffic_summary"]) )
      air_quality_index.append( statistics.mean(location[str((today - timedelta(6-i)).date())]["air_summary"]) )
    future = future_summary.find_one({"id": id}, {"id": 1, "traffic_data": {"$slice": 1}, "air_data": {"$slice": 1}})
    sum_future_traffic = future["traffic_data"][0]["car"] + future["traffic_data"][0]["bike"] + future["traffic_data"][0]["truck"] + future["traffic_data"][0]["bus"] + future["traffic_data"][0]["motorbike"]
    average_traffic = statistics.mean(traffic_quality_index)
    return {
      "id": location["id"],
      "name": location["place"],
      "date": str(today.date()),
      "data_day": data_day,
      "traffic": {
        "average": average_traffic,
        "bus": (future["traffic_data"][0]["bus"] / sum_future_traffic) * average_traffic / 2,
        "truck": (future["traffic_data"][0]["truck"] / sum_future_traffic) * average_traffic / 2,
        "car": (future["traffic_data"][0]["car"] / sum_future_traffic) * average_traffic ,
        "bike": (future["traffic_data"][0]["bus"] / sum_future_traffic) * average_traffic * 2,
        "motorbike": (future["traffic_data"][0]["motorbike"] / sum_future_traffic) * average_traffic * 2,
      },
      "average_air": {
        "average": statistics.mean(air_quality_index),
        "co": future["air_data"][0]["co"],
        "o3": future["air_data"][0]["o3"],
        "so2": future["air_data"][0]["so2"],
        "pm2_5": future["air_data"][0]["pm2_5"],
        "pm10": future["air_data"][0]["pm10"],
        "nh3": future["air_data"][0]["nh3"],
      }
    }


class data_range(Resource):
  def post(self):
    id = int(request.form.get("id"))
    try:
      date_range = int(request.form.get("range"))
      if date_range > 7:
        date_range = 7
    except:
      date_range = 3
    try:
      today = datetime.strptime(request.form.get("date"), '%Y-%m-%d')
    except:
      today = datetime.today().replace(hour=0, minute=0, second=0, microsecond=0)
    query_dict = {"id":1, "place":1}
    for i in range(0, date_range):
      query_dict[str((today - timedelta(date_range-1-i)).date())] = 1
    print(query_dict)
    location = data_summary.find_one({"id": id}, query_dict)
    data_day = [
      {
        "day": i,
        "traffic_quality_index": sum(location[str((today - timedelta(date_range-1-i)).date())]["traffic_summary"])/24,
        "air_quality_index": sum(location[str((today - timedelta(date_range-1-i)).date())]["air_summary"])/24
      } for i in range(0, date_range)
    ]
    traffic_quality_index = []
    air_quality_index = []
    for i in range(0,date_range):
      traffic_quality_index.append( statistics.mean(location[str((today - timedelta(date_range-1-i)).date())]["traffic_summary"]) )
      air_quality_index.append( statistics.mean(location[str((today - timedelta(date_range-1-i)).date())]["air_summary"]) )
    future = future_summary.find_one({"id": id}, {"id": 1, "traffic_data": {"$slice": 1}, "air_data": {"$slice": 1}})
    sum_future_traffic = future["traffic_data"][0]["car"] + future["traffic_data"][0]["bike"] + future["traffic_data"][0]["truck"] + future["traffic_data"][0]["bus"] + future["traffic_data"][0]["motorbike"]
    average_traffic = statistics.mean(traffic_quality_index)
    return {
      "id": location["id"],
      "name": location["place"],
      "date": str(today.date()),
      "data_day": data_day,
      "traffic": {
        "average": average_traffic,
        "bus": (future["traffic_data"][0]["bus"] / sum_future_traffic) * average_traffic / 2,
        "truck": (future["traffic_data"][0]["truck"] / sum_future_traffic) * average_traffic / 2,
        "car": (future["traffic_data"][0]["car"] / sum_future_traffic) * average_traffic ,
        "bike": (future["traffic_data"][0]["bus"] / sum_future_traffic) * average_traffic * 2,
        "motorbike": (future["traffic_data"][0]["motorbike"] / sum_future_traffic) * average_traffic * 2,
      },
      "average_air": {
        "average": statistics.mean(air_quality_index),
        "co": future["air_data"][0]["co"],
        "o3": future["air_data"][0]["o3"],
        "so2": future["air_data"][0]["so2"],
        "pm2_5": future["air_data"][0]["pm2_5"],
        "pm10": future["air_data"][0]["pm10"],
        "nh3": future["air_data"][0]["nh3"],
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
      option = "change"
    try:
      today = request.form.get("date")
    except:
      today = str(datetime.today().date())
    traffic_ranking = []
    air_ranking = []
    change_ranking = []
    yesterday = str((datetime.strptime(today, "%Y-%m-%d") - timedelta(1)).date())
    for data_piece in data_summary.find({}, {"_id":0, "id": 1, "place": 1, today: 1, yesterday: 1}):
      try:
        data = data_piece[today]
        avg_traffic = 0
        compared_traffic = 0
        traffic_count = sum(data_piece[today]["traffic_count"])
        for i in range(0, 24):
          avg_traffic += data_piece[today]["traffic_summary"][i] * data_piece[today]["traffic_count"][i]/traffic_count
          compared_traffic += data_piece[yesterday]["traffic_summary"][i] * data_piece[yesterday]["traffic_count"][i]/traffic_count
        traffic_ranking.append({
          "id": data_piece["id"],
          "name": data_piece["place"],
          "traffic_quality_index":  avg_traffic
        })
        avg_air = 0
        air_count = sum(data_piece[today]["air_count"])
        compared_air = 0
        for i in range(0, 24):
          avg_air += data_piece[today]["air_summary"][i] * data_piece[today]["air_count"][i]/air_count
          compared_air += data_piece[yesterday]["air_summary"][i] * data_piece[yesterday]["air_count"][i]/air_count
        air_ranking.append({
          "id": data_piece["id"],
          "name": data_piece["place"],
          "air_quality_index":  avg_air
        })
        change_ranking.append({
          "id": data_piece["id"],
          "name": data_piece["place"],
          "change_index":  ((avg_air/compared_air) + (avg_traffic/compared_traffic) - 1) * (-100)
        })
      except:
        pass
    traffic_ranking = sorted(traffic_ranking, key=lambda d: d['traffic_quality_index'])
    air_ranking = sorted(air_ranking, key=lambda d: d['air_quality_index'])
    for i in range(0, len(traffic_ranking)):
      traffic_ranking[i]["rank"] = i + 1
    for i in range(0, len(air_ranking)):
      air_ranking[i]["rank"] = i + 1
    for i in range(0, len(change_ranking)):
      change_ranking[i]["rank"] = i + 1
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
        "count": len(change_ranking),
        "option": "change",
        "ranking": change_ranking
      }


class ranking_weekly(Resource):
  def post(self):
    try:
      option = request.form.get("option")
    except:
      option = "change"
    try:
      today = datetime.strptime(request.form.get("date"), "%Y-%m-%d")
    except:
      today = datetime.today()
    traffic_ranking = []
    air_ranking = []
    change_ranking = []
    for data_piece in data_summary.find({}, {"_id":0, "id": 1, "place": 1, str(today.date()) : 1, str((today - timedelta(1)).date()): 1, str((today - timedelta(2)).date()): 1,
          str((today - timedelta(3)).date()): 1, str((today - timedelta(4)).date()): 1, str((today - timedelta(5)).date()): 1, str((today - timedelta(6)).date()): 1}):
      try:
        data = data_piece[str(today.date())]
        if (option == "traffic"):
          avg_traffic = 0
          for i in range(0, 7):
            avg_traffic += sum(data_piece[str((today - timedelta(6-i)).date())]["traffic_summary"]) / (24 * 7)
          traffic_ranking.append({
            "id": data_piece["id"],
            "name": data_piece["place"],
            "traffic_quality_index":  avg_traffic
          })
        if (option == "air"):
          avg_air = 0
          for i in range(0, 7):
            avg_air += sum(data_piece[str((today - timedelta(6-i)).date())]["air_summary"]) / (24 * 7) 
          air_ranking.append({
            "id": data_piece["id"],
            "name": data_piece["place"],
            "air_quality_index":  avg_air
          })
        if (option == "change"):
          avg_air = 0
          avg_traffic = 0
          change = 0
          compared_air = statistics.mean(data_piece[str((today - timedelta(6)).date())]["air_summary"])
          for i in range(0, 7):
            avg_air += statistics.mean(data_piece[str((today - timedelta(6-i)).date())]["air_summary"]) / 7 
          compared_traffic = statistics.mean(data_piece[str((today - timedelta(6)).date())]["air_summary"])
          for i in range(0, 7):
            avg_traffic += statistics.mean(data_piece[str((today - timedelta(6-i)).date())]["traffic_summary"]) / 7 
          change = ((avg_air/compared_air) + (avg_traffic/compared_traffic) - 1) * (-100)/2
          change_ranking.append({
            "id": data_piece["id"],
            "name": data_piece["place"],
            "change_index":  change
          })
      except:
        print("Error")
    traffic_ranking = sorted(traffic_ranking, key=lambda d: d['traffic_quality_index'])
    air_ranking = sorted(air_ranking, key=lambda d: d['air_quality_index'])
    for i in range(0, len(traffic_ranking)):
      traffic_ranking[i]["rank"] = i + 1
    for i in range(0, len(air_ranking)):
      air_ranking[i]["rank"] = i + 1
    for i in range(0, len(change_ranking)):
      change_ranking[i]["rank"] = i + 1
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
        "count": len(change_ranking),
        "option": "change",
        "ranking": change_ranking
      }


class get_image(Resource):
  def get(self, id):
    url = Place_LatLong_API.find_one({"id": id}, {"_id": 0, "request": 1})["request"]
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.63 Safari/537.36"}
    file = requests.get(url, headers=headers)
    # benc = base64.b64encode(file.content)
    return send_file(io.BytesIO(file.content), mimetype="image/jpg")


api.add_resource(hello, "/")
api.add_resource(location_all, "/location/all")
api.add_resource(location_name_search, "/location/name/search")
api.add_resource(location_name_autofill, "/location/name/autofill")
api.add_resource(location_nearby, "/location/nearby")
api.add_resource(data_current, "/data/current/locationID=<int:id>")
api.add_resource(data_daily, "/data/daily")
api.add_resource(data_weekly, "/data/weekly")
api.add_resource(data_range, "/data/range")
api.add_resource(ranking_current, "/ranking/current")
api.add_resource(ranking_daily, "/ranking/daily")
api.add_resource(ranking_weekly, "/ranking/weekly")
api.add_resource(get_image, "/image/locationID=<int:id>")

if __name__ == "__main__":
  app.run(debug=True, host="0.0.0.0", port=os.environ.get('LISTEN_PORT'))
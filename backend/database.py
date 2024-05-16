import requests
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import os
import json
from datetime import datetime

MONGO_USER_NAME = os.environ.get('MONGO_USER_NAME')
MONGO_PASSWORD = os.environ.get('MONGO_PASSWORD')

uri = f"mongodb+srv://{MONGO_USER_NAME}:{MONGO_PASSWORD}@cluster0.teog563.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

# Create a new client and connect to the server
CLIENT = MongoClient(uri, server_api=ServerApi('1'))
# CLIENT['grab-engineering-project']['Place_LatLong_API'].find_one_and_update({'id': 1},{"$unset": {'traffic_data': 1}})

#CLIENT['grab-engineering-project']['Place_LatLong_API'].find_one_and_update({'id': 1},{"$unset": {'traffic_data': 1}})



uri = "mongodb+srv://backend:5BmleaOy4vkY9zIb@cluster0.teog563.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(uri, server_api=ServerApi('1'))

# Send a ping to confirm a successful connection
try:
  client.admin.command('ping')
  print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
  print(e)

database = client["grab-engineering-project"]
Place_LatLong_API = database["Place_LatLong_API"]
data_summary = database["data_summary"]
future_summary = database["Predict_Future_Data"]

# print("Working")
# for i in range(126, 127):
#   try:
#     location = Place_LatLong_API.find_one({"id": i},{"_id":0, "id":1, "place":1, "air_data": 1})
#     print(location["place"])
#     data_05_05 = [0 for i in range(0,24)]
#     data_05_05_count = [0 for i in range(0,24)]
#     data_05_06 = [0 for i in range(0,24)]
#     data_05_06_count = [0 for i in range(0,24)]
#     data_05_07 = [0 for i in range(0,24)]
#     data_05_07_count = [0 for i in range(0,24)]
#     data_05_08 = [0 for i in range(0,24)]
#     data_05_08_count = [0 for i in range(0,24)]
#     data_05_09 = [0 for i in range(0,24)]
#     data_05_09_count = [0 for i in range(0,24)]
#     data_05_10 = [0 for i in range(0,24)]
#     data_05_10_count = [0 for i in range(0,24)]
#     data_05_11 = [0 for i in range(0,24)]
#     data_05_11_count = [0 for i in range(0,24)]

#     case = 0
#     for data_piece in location["air_data"]:
#       case += 1
#       print("Processing case ", case)
#       print(data_piece)
#       time = datetime.strptime(data_piece["time"], '%Y-%m-%d %H:%M:%S+07:00')
#       hour = time.hour
#       print(hour)
#       if str(time.date()) == "2024-05-05":
#         data_05_05[hour] = data_05_05[hour] * data_05_05_count[hour] + max(
#           calculate_aqi(data_piece["components"]["co"] * 0.873 * 0.001, "co"), # Convert from miligram/m3 to ppm
#           calculate_aqi(data_piece["components"]["no2"] * 0.531 * 1, "no2"), # Convert from miligram/m3 to ppb
#           calculate_aqi(data_piece["components"]["so2"] * 0.382 * 1, "so2"), # Convert from miligram/m3 to ppb
#           calculate_aqi(data_piece["components"]["o3"] * 0.509 * 0.001, "o3"), # Convert from miligram/m3 to ppm
#           calculate_aqi(data_piece["components"]["pm2_5"], "pm2_5"), # Convert from miligram/m3 to ppm
#           calculate_aqi(data_piece["components"]["pm10"], "pm10"), # Convert from miligram/m3 to ppm
#         )
#         data_05_05_count[hour] += 1
#         data_05_05[hour] = data_05_05[hour] / data_05_05_count[hour]
#       elif str(time.date()) == "2024-05-06":
#         data_05_06[hour] = data_05_06[hour] * data_05_06_count[hour] + max(
#           calculate_aqi(data_piece["components"]["co"] * 0.873 * 0.001, "co"), # Convert from miligram/m3 to ppm
#           calculate_aqi(data_piece["components"]["no2"] * 0.531 * 1, "no2"), # Convert from miligram/m3 to ppb
#           calculate_aqi(data_piece["components"]["so2"] * 0.382 * 1, "so2"), # Convert from miligram/m3 to ppb
#           calculate_aqi(data_piece["components"]["o3"] * 0.509 * 0.001, "o3"), # Convert from miligram/m3 to ppm
#           calculate_aqi(data_piece["components"]["pm2_5"], "pm2_5"), # Convert from miligram/m3 to ppm
#           calculate_aqi(data_piece["components"]["pm10"], "pm10"), # Convert from miligram/m3 to ppm
#         )
#         data_05_06_count[hour] += 1
#         data_05_06[hour] = data_05_06[hour] / data_05_06_count[hour]
#       elif str(time.date()) == "2024-05-07":
#         data_05_07[hour] = data_05_07[hour] * data_05_07_count[hour] + max(
#           calculate_aqi(data_piece["components"]["co"] * 0.873 * 0.001, "co"), # Convert from miligram/m3 to ppm
#           calculate_aqi(data_piece["components"]["no2"] * 0.531 * 1, "no2"), # Convert from miligram/m3 to ppb
#           calculate_aqi(data_piece["components"]["so2"] * 0.382 * 1, "so2"), # Convert from miligram/m3 to ppb
#           calculate_aqi(data_piece["components"]["o3"] * 0.509 * 0.001, "o3"), # Convert from miligram/m3 to ppm
#           calculate_aqi(data_piece["components"]["pm2_5"], "pm2_5"), # Convert from miligram/m3 to ppm
#           calculate_aqi(data_piece["components"]["pm10"], "pm10"), # Convert from miligram/m3 to ppm
#         )
#         data_05_07_count[hour] += 1
#         data_05_07[hour] = data_05_07[hour] / data_05_07_count[hour]
#       elif str(time.date()) == "2024-05-08":
#         data_05_08[hour] = data_05_08[hour] * data_05_08_count[hour] + max(
#           calculate_aqi(data_piece["components"]["co"] * 0.873 * 0.001, "co"), # Convert from miligram/m3 to ppm
#           calculate_aqi(data_piece["components"]["no2"] * 0.531 * 1, "no2"), # Convert from miligram/m3 to ppb
#           calculate_aqi(data_piece["components"]["so2"] * 0.382 * 1, "so2"), # Convert from miligram/m3 to ppb
#           calculate_aqi(data_piece["components"]["o3"] * 0.509 * 0.001, "o3"), # Convert from miligram/m3 to ppm
#           calculate_aqi(data_piece["components"]["pm2_5"], "pm2_5"), # Convert from miligram/m3 to ppm
#           calculate_aqi(data_piece["components"]["pm10"], "pm10"), # Convert from miligram/m3 to ppm
#         )
#         data_05_08_count[hour] += 1
#         data_05_08[hour] = data_05_08[hour] / data_05_08_count[hour]
#       elif str(time.date()) == "2024-05-09":
#         data_05_09[hour] = data_05_09[hour] * data_05_09_count[hour] + max(
#           calculate_aqi(data_piece["components"]["co"] * 0.873 * 0.001, "co"), # Convert from miligram/m3 to ppm
#           calculate_aqi(data_piece["components"]["no2"] * 0.531 * 1, "no2"), # Convert from miligram/m3 to ppb
#           calculate_aqi(data_piece["components"]["so2"] * 0.382 * 1, "so2"), # Convert from miligram/m3 to ppb
#           calculate_aqi(data_piece["components"]["o3"] * 0.509 * 0.001, "o3"), # Convert from miligram/m3 to ppm
#           calculate_aqi(data_piece["components"]["pm2_5"], "pm2_5"), # Convert from miligram/m3 to ppm
#           calculate_aqi(data_piece["components"]["pm10"], "pm10"), # Convert from miligram/m3 to ppm
#         )
#         data_05_09_count[hour] += 1
#         data_05_09[hour] = data_05_09[hour] / data_05_09_count[hour]
#       elif str(time.date()) == "2024-05-10":
#         data_05_10[hour] = data_05_10[hour] * data_05_10_count[hour] + max(
#           calculate_aqi(data_piece["components"]["co"] * 0.873 * 0.001, "co"), # Convert from miligram/m3 to ppm
#           calculate_aqi(data_piece["components"]["no2"] * 0.531 * 1, "no2"), # Convert from miligram/m3 to ppb
#           calculate_aqi(data_piece["components"]["so2"] * 0.382 * 1, "so2"), # Convert from miligram/m3 to ppb
#           calculate_aqi(data_piece["components"]["o3"] * 0.509 * 0.001, "o3"), # Convert from miligram/m3 to ppm
#           calculate_aqi(data_piece["components"]["pm2_5"], "pm2_5"), # Convert from miligram/m3 to ppm
#           calculate_aqi(data_piece["components"]["pm10"], "pm10"), # Convert from miligram/m3 to ppm
#         )
#         data_05_10_count[hour] += 1
#         data_05_10[hour] = data_05_10[hour] / data_05_10_count[hour]
#       elif str(time.date()) == "2024-05-11":
#         data_05_11[hour] = data_05_11[hour] * data_05_11_count[hour] + max(
#           calculate_aqi(data_piece["components"]["co"] * 0.873 * 0.001, "co"), # Convert from miligram/m3 to ppm
#           calculate_aqi(data_piece["components"]["no2"] * 0.531 * 1, "no2"), # Convert from miligram/m3 to ppb
#           calculate_aqi(data_piece["components"]["so2"] * 0.382 * 1, "so2"), # Convert from miligram/m3 to ppb
#           calculate_aqi(data_piece["components"]["o3"] * 0.509 * 0.001, "o3"), # Convert from miligram/m3 to ppm
#           calculate_aqi(data_piece["components"]["pm2_5"], "pm2_5"), # Convert from miligram/m3 to ppm
#           calculate_aqi(data_piece["components"]["pm10"], "pm10"), # Convert from miligram/m3 to ppm
#         )
#         data_05_11_count[hour] += 1
#         data_05_11[hour] = data_05_11[hour] / data_05_11_count[hour]
    
#     database["data_summary"].update_one({"id": location["id"]}, {
#         "$set": {
#           "2024-05-05.air_count": data_05_05_count,
#           "2024-05-05.air_summary": data_05_05,
#           "2024-05-06.air_count": data_05_06_count,
#           "2024-05-06.air_summary": data_05_06,
#           "2024-05-07.air_count": data_05_07_count,
#           "2024-05-07.air_summary": data_05_07,
#           "2024-05-08.air_count": data_05_08_count,
#           "2024-05-08.air_summary": data_05_08,
#           "2024-05-09.air_count": data_05_09_count,
#           "2024-05-09.air_summary": data_05_09,
#           "2024-05-10.air_count": data_05_10_count,
#           "2024-05-10.air_summary": data_05_10,
#           "2024-05-11.air_count": data_05_11_count,
#           "2024-05-11.air_summary": data_05_11,
#         }
#       }
#     )
#     print("Finish update id ", location["id"])
#   except:
#     pass

# data = database["data_summary"].find_one({"id": 1})["2024-05-09"]["air_count"]
# print(data)

# data = database["Place_LatLong_API"].find_one({"id":1}, {"id":1, "place":1, "traffic_data": {"$slice": -1}})
# print(data)
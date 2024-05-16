import requests
from detect import *
import datetime
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import pytz

def calculate_aqi(concentration, pollutant):
  aqi_low = [0, 51, 101, 151, 201, 301, 401, 501]
  aqi_high = [50, 100, 150, 200, 300, 400, 500, 999]
  if pollutant == 'pm2_5':
    c_low = [0, 12.1, 35.5, 55.5, 150.5, 250.5, 350.5, 500.5]
    c_high = [12, 35.4, 55.4, 150.4, 250.4, 350.4, 500.4, 999.9]
  elif pollutant == 'pm10':
    c_low = [0, 55, 155, 255, 355, 425, 505, 605]
    c_high = [54, 154, 254, 354, 424, 504, 604, 999]
  elif pollutant == "o3":
    c_low = [0, 0.055, 0.071, 0.086, 0.106, 0.201, 0.3, 0.4]
    c_high = [0.054, 0.07, 0.85, 0.105, 0.2, 0.299, 0.399, 1]
  elif pollutant == "co":
    c_low = [0, 4.5, 9.5, 12.5, 15.5, 30.5, 50.5, 70]
    c_high = [4.4, 9.4, 12.4, 15.4, 30.4, 50.4, 69.9, 100]
  elif pollutant == "so2":
    c_low = [0, 36, 76, 186, 304, 605, 1005, 2000]
    c_high = [35, 75, 185, 304, 604, 1004, 1999, 3000]
  elif pollutant == "no2":
    c_low = [0, 54, 101, 361, 650, 1250, 2050, 3000]
    c_high = [53, 100, 360, 649, 1249, 2049, 2999, 4000]
  else:
      raise ValueError("Invalid pollutant. Choose 'PM2.5' or 'PM10'.")

  #Calculate AQI
  try:
    i_low = 0
    while concentration > c_high[i_low]:
      i_low += 1
    i_high = i_low
    aqi = round(((aqi_high[i_high] - aqi_low[i_low]) / (c_high[i_high] - c_low[i_low])) * (concentration - c_low[i_low]) + aqi_low[i_low])
    return aqi
  except:
    return 500

AIR_API_KEY = os.environ.get('AIR_API_KEY')


def getAirData(path, db, collection):
    lat = path[3]
    long = path[4]

    url = f'http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={long}&appid={AIR_API_KEY}'

    try:
        response = requests.get(url)
        data = response.json()

        aqi = data["list"][0]["main"]["aqi"]
        components = data["list"][0]["components"]
        
        time = datetime.datetime.fromtimestamp(data["list"][0]["dt"], datetime.UTC)

        hcm_tz = pytz.timezone('Asia/Ho_Chi_Minh')

        # Convert the UTC time to Saigon time
        hcm_time = time.astimezone(hcm_tz)

        insert_data = {"aqp": aqi, "components": components, "time": str(hcm_time)}

        db[collection].find_one_and_update(
            {"id": path[0]}, {"$push": {'air_data': insert_data}})
        
        today = str(hcm_time.date())
        hour = hcm_time.hour
        try:
            data_count = db["data_summary"].find_one({"id": path[0]})[today]["air_count"][hour]
            data_count_array = db["data_summary"].find_one({"id": path[0]})[today]["air_count"]
            data_summary = db["data_summary"].find_one({"id": path[0]})[today]["air_summary"]
        except:
            db["data_summary"].update_one({"id": path[0]}, {
                "$set": {
                today + ".air_count": [0 for i in range(0, 24)],
                today + ".air_summary":[0 for i in range(0, 24)]
                }
            })
            data_count_array = db["data_summary"].find_one({"id": path[0]})[today]["air_count"]
            data_count = db["data_summary"].find_one({"id": path[0]})[today]["air_count"][hour]
            data_summary = db["data_summary"].find_one({"id": path[0]})[today]["air_summary"]
        
        data_summary[hour] = data_summary[hour]*data_count + max(
            calculate_aqi(insert_data["components"]["co"] * 0.873 * 0.001, "co"), # Convert from miligram/m3 to ppm
            calculate_aqi(insert_data["components"]["no2"] * 0.531 * 1, "no2"), # Convert from miligram/m3 to ppb
            calculate_aqi(insert_data["components"]["so2"] * 0.382 * 1, "so2"), # Convert from miligram/m3 to ppb
            calculate_aqi(insert_data["components"]["o3"] * 0.509 * 0.001, "o3"), # Convert from miligram/m3 to ppm
            calculate_aqi(insert_data["components"]["pm2_5"], "pm2_5"), # Convert from miligram/m3 to ppm
            calculate_aqi(insert_data["components"]["pm10"], "pm10"), # Convert from miligram/m3 to ppm
        )
        data_count += 1
        data_count_array[hour] = data_count
        data_summary[hour] = data_summary[hour] / data_count
        db["data_summary"].update_one({"id": path[0]}, {
            "$set": {
            today + ".air_count": data_count_array,
            today + ".air_summary": data_summary
            }
        })
        

    except Exception as e:
        print("Exception in air quality update ", e)


if __name__ == '__main__':

    MONGO_USER_NAME = os.environ.get('MONGO_USER_NAME')
    MONGO_PASSWORD = os.environ.get('MONGO_PASSWORD')

    # Create a new client and connect to the server
    paths = []
    database = None
    collection = None

    uri = f"mongodb+srv://{MONGO_USER_NAME}:{MONGO_PASSWORD}@cluster0.teog563.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    CLIENT = MongoClient(uri, server_api=ServerApi('1'))
    dbs = CLIENT.list_database_names()

    for db in dbs:
        if db == 'grab-engineering-project':
            database = CLIENT[db]
            collections = database.list_collection_names()
            for collect in collections:
                if collect == 'Place_LatLong_API':
                    collection = collect

    for document in database[collection].find():
        paths.append([document['id'], document['place'],
                     document['request'], document['lat'], document['long']])

    for path in paths:
        getAirData(path, database, collection)

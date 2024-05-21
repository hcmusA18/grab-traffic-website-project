import io
import threading
import requests
import time
from PIL import Image
from detect import *
from datetime import datetime
# from urls import *
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from pytz import timezone


def getTrafficData(path, db, collection):

    url = path[2]
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"}

    # Save image to absolute path
    k = "backend/app/trafficData/data/images/" + f"{path[0]}.jpg"

    # Create folder
    try:
        os.mkdir('backend/app/trafficData/data/images')
    except:
        pass

    saigon = timezone('Asia/Saigon')
    timepoint = datetime.now(saigon)

    try:
        response = requests.get(url, headers=headers)
        # wait 10 seconds then retry
        while response.status_code != 200:
            time.sleep(10)
            response = requests.get(url, headers=headers)
        im = Image.open(io.BytesIO(response.content))
        im.show()
    except Exception as e:
        print("Error while fetching image ", path[0], e)
        return

    try:
        # print(requests.get(url, headers=headers).content)
        if (response.status_code == 200):
            # Resizing image
            imB = im.resize((1024, 576))
            try: 
                imB.save(k, format='JPEG')
            except Exception as e:
                print("Error while saving image ", path[0], e)
            # save image into mongodb
            image_bytes = io.BytesIO()
            imB.save(image_bytes, format='JPEG')
            db["images"].update_one({"id": path[0]}, {"$set": {"image": image_bytes.getvalue()}}, upsert=True)

            s = run(source=k, nosave=True)
            x = s.split()
            count, car, bike, truck, bus, person, motorbike = 0, 0, 0, 0, 0, 0, 0
            for part in x:
                if (count >= 3):
                    if ("car" in part):
                        car = int(temp)
                    elif ("truck" in part):
                        truck = int(temp)
                    elif ("bus" in part):
                        bus = int(temp)
                    elif ("motorcycle" in part):
                        motorbike = int(temp)
                    elif ("bicycle" in part):
                        bike = int(temp)
                temp = part
                count += 1
            data = {
                "time": str(timepoint),
                "car": car,
                "bike": bike,
                "truck": truck,
                "bus": bus,
                "person": person,
                "motorbike": motorbike
            }
            db[collection].find_one_and_update(
                {"id": path[0]}, {"$push": {'traffic_data': data}})

            today = str(timepoint.date())
            hour = timepoint.hour
            try:
                data_count = db["data_summary"].find_one({"id": path[0]})[today]["traffic_count"][hour]
                data_count_array = db["data_summary"].find_one({"id": path[0]})[today]["traffic_count"]
                data_summary = db["data_summary"].find_one({"id": path[0]})[today]["traffic_summary"]
            except:
                db["data_summary"].update_one({"id": path[0]}, {
                    "$set": {
                    today + ".traffic_count": [0 for i in range(0, 24)],
                    today + ".traffic_summary":[0 for i in range(0, 24)]
                    }
                })
                data_count = db["data_summary"].find_one({"id": path[0]})[today]["traffic_count"][hour]
                data_count_array = db["data_summary"].find_one({"id": path[0]})[today]["traffic_count"]
                data_summary = db["data_summary"].find_one({"id": path[0]})[today]["traffic_summary"]

            data_summary[hour] = data_summary[hour]*data_count + (
                person*0.25 + car + (motorbike + bike) * 0.5 + (truck + bus) * 0.5
            )
            data_count += 1
            data_summary[hour] = data_summary[hour]/data_count
            data_count_array[hour] = data_count
            db["data_summary"].update_one({"id": path[0]}, {
                "$set": {
                today + ".traffic_count": data_count_array,
                today + ".traffic_summary": data_summary
                }
            })

    except Exception as e:
        print("Exception in traffic data update ", e)


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

    for document in database[collection].find({}, {"_id": 0, "id": 1, "place": 1, "request": 1, "lat": 1, "long": 1}):
        paths.append([document['id'], document['place'],
                     document['request'], document['lat'], document['long']])

    # for path in paths:
    #     getTrafficData(path, database, collection)
    threads = []

    for path in paths:
        t = threading.Thread(target=getTrafficData, args=(path, database, collection))
        t.start()
        threads.append(t)
    for t in threads:
        t.join()

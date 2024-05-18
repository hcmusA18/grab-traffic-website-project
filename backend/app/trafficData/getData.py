import requests
import time
from PIL import Image
from .detect import *
from datetime import datetime
from urls import *
    

def getData(path):
    url = path[2]
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.63 Safari/537.36"}
    
    # Save image
    k = './trafficData/data/images/' + f'{path[0]}.jpg'
    timepoint = str(datetime.now())
    print("working1")
    try:
        print("working2")
        if (requests.get(url, headers=headers).headers['Content-Type']):
            with open(k, 'wb') as f:
                f.write(requests.get(url, headers=headers).content)
                print("working3")
            #Resizing image
            im = Image.open(k)
            imB = im.resize((1024,576))
            imB.save(k)
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
                "location": path[1],
                "time": timepoint,
                "image_url": path[2],
                "traffic-data" : {
                "car": car,
                "bike": bike,
                "truck": truck,
                "bus": bus,
                "person": person,
                "motorbike": motorbike
                }
            }
            return data
    except:
        return {
            "location": path[1],
            "time": timepoint,
            "message": "cannot load data from this locaton"
        }


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
image = database["images"]

img = image.find_one({"id": 1}, {"_id": 0, "id": 1, "image": 1})["image"]
print(type(img))
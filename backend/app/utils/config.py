import os
from dotenv import load_dotenv
load_dotenv()

DEBUG = os.getenv("DEBUG", "true") == "true"
LISTEN_PORT = int(os.getenv("LISTEN_PORT", 5000))
MONGO_USER_NAME = os.getenv("MONGO_USER_NAME")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD")
MONGO_URI = f"mongodb+srv://{MONGO_USER_NAME}:{MONGO_PASSWORD}@cluster0.teog563.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
CACHE_TYPE = "RedisCache"
CORS_HEADERS = "Content-Type"
REDIS_URI = os.getenv("REDIS_URI")
REDIS_PORT = os.getenv("REDIS_PORT", 12272)
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
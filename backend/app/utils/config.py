import os
from dotenv import load_dotenv
load_dotenv()

DEBUG = os.environ.get("DEBUG", "true") == "true"
LISTEN_PORT = int(os.environ.get("LISTEN_PORT", 5000))
MONGO_USER_NAME = os.environ.get("MONGO_USER_NAME")
MONGO_PASSWORD = os.environ.get("MONGO_PASSWORD")
MONGO_URI = f"mongodb+srv://{MONGO_USER_NAME}:{MONGO_PASSWORD}@cluster0.teog563.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
CACHE_TYPE = "RedisCache"
CORS_HEADERS = "Content-Type"
REDIS_URI = os.environ.get("REDIS_URI")
REDIS_PORT = os.environ.get("REDIS_PORT", 12272)
REDIS_PASSWORD = os.environ.get("REDIS_PASSWORD")
WEATHER_API_KEY = os.environ.get("WEATHER_API_KEY")

if (DEBUG is None) or (LISTEN_PORT is None) or (MONGO_USER_NAME is None) or (MONGO_PASSWORD is None) or (MONGO_URI is None) or (CACHE_TYPE is None) or (CORS_HEADERS is None) or (REDIS_URI is None) or (REDIS_PORT is None) or (REDIS_PASSWORD is None) or (WEATHER_API_KEY is None):
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
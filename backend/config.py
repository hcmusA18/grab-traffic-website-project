import os

class Config:
    DEBUG = os.getenv("DEBUG", "true") == "true"
    LISTEN_PORT = int(os.getenv("LISTEN_PORT", 5000))
    MONGO_USER_NAME = os.environ.get("MONGO_USER_NAME")
    MONGO_PASSWORD = os.environ.get("MONGO_PASSWORD")
    MONGO_URI = f"mongodb+srv://{MONGO_USER_NAME}:{MONGO_PASSWORD}@cluster0.teog563.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    CACHE_TYPE = "RedisCache"

import redis
from app.utils.config import REDIS_URI, REDIS_PORT, REDIS_PASSWORD

redis_cache = redis.Redis(
    host=REDIS_URI,
    port=REDIS_PORT,
    password=REDIS_PASSWORD
)

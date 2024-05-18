from flask_restful import Api

from .data import DataCurrent, DataDaily, DataWeekly, DataRange
from app.routes.location import (
    LocationAll,
    LocationNameSearch,
    LocationNameAutofill,
    LocationNearby,
)
from app.routes.ranking import RankingCurrent, RankingDaily, RankingWeekly
from app.routes.image import GetImage
from app.routes.weather import GetWeather
from app.routes.hello import Hello


def init_routes(api: Api):
    api.add_resource(Hello, "/")
    api.add_resource(LocationAll, "/location/all")
    api.add_resource(LocationNameSearch, "/location/name/search")
    api.add_resource(LocationNameAutofill, "/location/name/autofill")
    api.add_resource(LocationNearby, "/location/nearby")
    api.add_resource(DataCurrent, "/data/current/locationID=<int:id>")
    api.add_resource(DataDaily, "/data/daily")
    api.add_resource(DataWeekly, "/data/weekly")
    api.add_resource(DataRange, "/data/range")
    api.add_resource(RankingCurrent, "/ranking/current")
    api.add_resource(RankingDaily, "/ranking/daily")
    api.add_resource(RankingWeekly, "/ranking/weekly")
    api.add_resource(GetImage, "/image/locationID=<int:id>")
    api.add_resource(GetWeather, "/weather/locationID=<int:id>")

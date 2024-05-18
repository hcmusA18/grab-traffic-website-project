import os
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor

from sklearn.preprocessing import StandardScaler

from skforecast.ForecasterAutoregMultiSeries import ForecasterAutoregMultiSeries

MONGO_USER_NAME = os.environ.get('MONGO_USER_NAME')
MONGO_PASSWORD = os.environ.get('MONGO_PASSWORD')

uri = f"mongodb+srv://{MONGO_USER_NAME}:{
    MONGO_PASSWORD}@cluster0.teog563.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

CLIENT = MongoClient(uri, server_api=ServerApi('1'))
air_data = []

database = CLIENT['grab-engineering-project']
collection = 'Place_LatLong_API'

for document in database[collection].find():
    place_name = document['place']
    for air in document['air_data']:
        air_data.append({
            'place_name': place_name,
            'time': air['time'],
            'aqp': air['aqp'],
            'co': air['components']['co'],
            'no': air['components']['no'],
            'no2': air['components']['no2'],
            'o3': air['components']['o3'],
            'so2': air['components']['so2'],
            'pm2_5': air['components']['pm2_5'],
            'pm10': air['components']['pm10'],
            'nh3': air['components']['nh3'],
        })
# Example time series data with timezone information

# Create a DataFrame
df_air = pd.DataFrame(air_data)
df_air = df_air[::10]

df_air.drop('time', axis=1, inplace=True)

df_air['index'] = df_air.groupby('place_name').cumcount()
df_air.set_index(['place_name', 'index'], inplace=True)
df_air = df_air.unstack(level=0)

df_air.reset_index(drop=True, inplace=True)
df_air.columns = [' '.join(col).strip()
                  for col in df_air.columns.values]
df_air = df_air.fillna(df_air.mean())
series_weights = {}
for x in df_air.columns:
  if 'aqp' in x:
    series_weights[x] = 2
  else:
    series_weights[x] = 1
forecaster = ForecasterAutoregMultiSeries(
    regressor=GradientBoostingRegressor(random_state=123),
    lags=48,
    transformer_series=StandardScaler(),
    transformer_exog=None,
    weight_func=None,
    series_weights=series_weights
)
# If you need to pass this to the forecaster, ensure you handle the data format correctly.
forecaster.fit(series=df_air)

steps = 168
predictions = forecaster.predict(steps=steps)
collection = 'Predict_Future_Data'

prediction_list = [None] * steps
for document in database[collection].find():
  for idx, row in predictions.iterrows():
    place_name = document['place']
    aqp = 'aqp' + ' ' + place_name
    co = 'co' + ' ' + place_name
    o3 = 'o3' + ' ' + place_name
    so2 = 'so2' + ' ' + place_name
    pm2_5 = 'pm2_5' + ' ' + place_name
    pm10 = 'pm10' + ' ' + place_name
    nh3 = 'nh3' + ' ' + place_name
    dic = {
        'time': idx-len(df_air.index),
        'aqp': row[aqp],
        'co': row[co],
        'o3': row[o3],
        'so2': row[so2],
        'pm2_5': row[pm2_5],
        'pm10': row[pm10],
        'nh3': row[nh3]
    }
    prediction_list[idx-len(df_air.index)] = dic
  database[collection].find_one_and_update(
      {"place": place_name}, {"$set": {'air_data': prediction_list}})
  prediction_list = [None] * steps

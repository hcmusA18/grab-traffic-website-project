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

database = CLIENT['grab-engineering-project']
collection = 'Place_LatLong_API'

traffic_data = []

for document in database[collection].find():
    place_name = document['place']
    for traffic in document['traffic_data']:
        traffic_data.append({
            'place_name': place_name,
            'time': traffic['time'],
            'car': traffic['car'],
            'bike': traffic['bike'],
            'truck': traffic['truck'],
            'bus': traffic['bus'],
            'person': traffic['person'],
            'motorbike': traffic['motorbike'],
        })
# Example time series data with timezone information

# Create a DataFrame
df_traffic = pd.DataFrame(traffic_data)
df_traffic = df_traffic[::9]

# Convert 'Datetime' to datetime type and ensure timezone is parsed
df_traffic.drop('time', axis=1, inplace=True)
df_traffic.drop('person', axis=1, inplace=True)

df_traffic['index'] = df_traffic.groupby('place_name').cumcount()
df_traffic.set_index(['place_name', 'index'], inplace=True)
df_traffic = df_traffic.unstack(level=0)
df_traffic.reset_index(drop=True, inplace=True)

df_traffic.columns = [' '.join(col).strip()
                      for col in df_traffic.columns.values]

df_traffic = df_traffic.fillna(df_traffic.mean())

series_weights = {}

for x in df_traffic.columns:
  if 'car' in x:
    series_weights[x] = 2
  if 'motorbike' in x:
    series_weights[x] = 2
  if 'bus' in x:
    series_weights[x] = 1.5
  if 'bike' in x:
    series_weights[x] = 1
  if 'truck' in x:
    series_weights[x] = 1.5

forecaster = ForecasterAutoregMultiSeries(
    regressor=GradientBoostingRegressor(random_state=123),
    lags=48,
    transformer_series=StandardScaler(),
    transformer_exog=None,
    weight_func=None,
    series_weights=series_weights
)

forecaster.fit(series=df_traffic)

steps = 168
predictions = forecaster.predict(steps=steps)
collection = 'Predict_Future_Data'

prediction_list = [None] * steps
for document in database[collection].find():
  for idx, row in predictions.iterrows():
    place_name = document['place']
    car = 'car' + ' ' + place_name
    bike = 'bike' + ' ' + place_name
    truck = 'truck' + ' ' + place_name
    bus = 'bus' + ' ' + place_name
    motorbike = 'motorbike' + ' ' + place_name
    dic = {
        'time': idx - len(df_traffic.index),
        'car': row[car],
        'bike': row[bike],
        'truck': row[truck],
        'bus': row[bus],
        'motorbike': row[motorbike],
    }
    prediction_list[idx-len(df_traffic.index)] = dic
  database[collection].find_one_and_update(
      {"place": place_name}, {"$set": {'traffic_data': prediction_list}})
  prediction_list = [None] * steps

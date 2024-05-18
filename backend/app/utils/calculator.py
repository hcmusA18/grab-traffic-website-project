from datetime import datetime
import statistics
import sys
from flask import request
# Credit:
# This AQI from component concentration calculator is created with reference
# to the AQI calculator made by HardjunoIndracahya. Many thanks to this Github user.
# URL of the repository: https://github.com/HardjunoIndracahya/aqi-calculator
# URL of the document for air quality: https://www.airnow.gov/sites/default/files/2020-05/aqi-technical-assistance-document-sept2018.pdf

# Function to calculate AQI based on US EPA standard.
# Calculate AQI based on pollutant concentration.
# concentration: float, concentration value in µg/m³
# pollutant: string, one of 'PM2.5' or 'PM10'
def calculate_aqi(concentration: float, pollutant: str):
  aqi_low = [0, 51, 101, 151, 201, 301, 401, 501]
  aqi_high = [50, 100, 150, 200, 300, 400, 500, 999]
  if pollutant == 'pm2_5':
    c_low = [0, 12.1, 35.5, 55.5, 150.5, 250.5, 350.5, 500.5]
    c_high = [12, 35.4, 55.4, 150.4, 250.4, 350.4, 500.4, 999.9]
  elif pollutant == 'pm10':
    c_low = [0, 55, 155, 255, 355, 425, 505, 605]
    c_high = [54, 154, 254, 354, 424, 504, 604, 999]
  elif pollutant == "o3":
    c_low = [0, 0.055, 0.071, 0.086, 0.106, 0.201, 0.3, 0.4]
    c_high = [0.054, 0.07, 0.85, 0.105, 0.2, 0.299, 0.399, 1]
  elif pollutant == "co":
    c_low = [0, 4.5, 9.5, 12.5, 15.5, 30.5, 50.5, 70]
    c_high = [4.4, 9.4, 12.4, 15.4, 30.4, 50.4, 69.9, 100]
  elif pollutant == "so2":
    c_low = [0, 36, 76, 186, 304, 605, 1005, 2000]
    c_high = [35, 75, 185, 304, 604, 1004, 1999, 3000]
  elif pollutant == "no2":
    c_low = [0, 54, 101, 361, 650, 1250, 2050, 3000]
    c_high = [53, 100, 360, 649, 1249, 2049, 2999, 4000]
  else:
      raise ValueError("Invalid pollutant. Choose 'PM2.5' or 'PM10'.")

  #Calculate AQI
  try:
    i_low = 0
    while concentration > c_high[i_low]:
      i_low += 1
    i_high = i_low
    aqi = round(((aqi_high[i_high] - aqi_low[i_low]) / (c_high[i_high] - c_low[i_low])) * (concentration - c_low[i_low]) + aqi_low[i_low])
    return aqi
  except Exception:
    return 500

def calculate_aqi_from_dict(inp: dict):
  # preprocess input
  inp = {
    "co": inp["co"] * 0.873 * 0.001 if "co" in inp else 0, # Convert from milligram/m3 to ppm
    "no2": inp["no2"] * 0.531 * 1 if "no2" in inp else 0, # Convert from milligram/m3 to ppb
    "so2": inp["so2"] * 0.382 * 1 if "so2" in inp else 0, # Convert from milligram/m3 to ppb
    "o3": inp["o3"] * 0.509 * 0.001 if "o3" in inp else 0, # Convert from milligram/m3 to ppm
    "pm2_5": inp["pm2_5"] if "pm2_5" in inp else 0,
    "pm10": inp["pm10"] if "pm10" in inp else 0
  }
  
  return max(
    calculate_aqi(inp["co"] * 0.873 * 0.001, "co"),
    calculate_aqi(inp["no2"] * 0.531 * 1, "no2"),
    calculate_aqi(inp["so2"] * 0.382 * 1, "so2"),
    calculate_aqi(inp["o3"] * 0.509 * 0.001, "o3"),
    calculate_aqi(inp["pm2_5"], "pm2_5"),
    calculate_aqi(inp["pm10"], "pm10"),
  )

def calculate_traffic_index_from_dict(inp: dict):
  try:
    return (inp["person"]*0.25 + (inp["bike"] + inp["motorbike"])*0.5 + 
      inp["car"]*1 + (inp["truck"] + inp["bus"])*2)
  except Exception:
    return ((inp["bike"] + inp["motorbike"])*0.5 + 
      inp["car"]*1 + (inp["truck"] + inp["bus"])*2)

def traffic_index_to_quality(traffic_index: float):
  if (traffic_index < 2.5):
    return 1
  elif (traffic_index < 5):
    return 2
  elif (traffic_index < 7.5):
    return 3
  elif (traffic_index < 10):
    return 4
  else:
    return 5

def calculate_traffic_quality_from_dict(dictionary):
  traffic_index = calculate_traffic_index_from_dict(dictionary)
  return traffic_index_to_quality(traffic_index)

def to_lowercase_english(word: str) -> str:
    """
    Convert Vietnamese characters to lowercase English characters.

    Args:
    word (str): The word to be converted.

    Returns:
    str: The converted word.
    """
    inp = "ạảãàáâậầấẩẫăắằặẳẵóòọõỏôộổỗồốơờớợởỡéèẻẹẽêếềệểễúùụủũưựữửừứíìịỉĩýỳỷỵỹđ"
    out = "a" * 17 + "o" * 17 + "e" * 11 + "u" * 11 + "i" * 5 + "y" * 5 + "d"
    word = word.lower()
    return "".join(
        out[inp.index(char)] if char in inp else char for char in word
    )

def try_read(field, default_value):
    try:
        result = request.form.get(field)
    except Exception:
        result = default_value
    return result


def get_date_from_request():
    try:
        return datetime.strptime(request.form.get("date"), "%Y-%m-%d")
    except Exception:
        return datetime.today().replace(hour=0, minute=0, second=0, microsecond=0)


def calculate_daily_data(location, date_keys):
    data_day = [
        {
            "day": i,
            "traffic_quality_index": sum(location[date_key]["traffic_summary"]) / 24,
            "air_quality_index": sum(location[date_key]["air_summary"]) / 24,
        }
        for i, date_key in enumerate(date_keys)
    ]
    return data_day


def get_quality_index(location, date_keys, quality):
    return [statistics.mean(location[date][quality]) for date in date_keys]


def calculate_traffic(data):
    traffic_data = data["traffic_data"][0]
    return (
        traffic_data["car"]
        + traffic_data["bike"]
        + traffic_data["truck"]
        + traffic_data["bus"]
        + traffic_data["motorbike"]
    ), traffic_data


def calculate_traffic_components(
    future_traffic_data, sum_future_traffic, average_traffic
):
    return {
        "average": average_traffic,
        "bus": (future_traffic_data["bus"] / sum_future_traffic) * average_traffic / 2,
        "truck": (future_traffic_data["truck"] / sum_future_traffic)
        * average_traffic
        / 2,
        "car": (future_traffic_data["car"] / sum_future_traffic) * average_traffic,
        "bike": (future_traffic_data["bus"] / sum_future_traffic) * average_traffic * 2,
        "motorbike": (future_traffic_data["motorbike"] / sum_future_traffic)
        * average_traffic
        * 2,
    }

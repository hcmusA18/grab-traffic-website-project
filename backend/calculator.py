from flask import Flask, request, send_file
# Credit:
# This AQI from component concentration calculator is created with reference
# to the AQI calculator made by HardjunoIndracahya. Many thanks to this Github user.
# URL of the repository: https://github.com/HardjunoIndracahya/aqi-calculator
# URL of the document for air quality: https://www.airnow.gov/sites/default/files/2020-05/aqi-technical-assistance-document-sept2018.pdf

#Function to calculate AQI based on US EPA standard.
def calc_aqi_us(concentration, pollutant):
  i_low = [0, 51, 101, 151, 201, 301, 401, 501]
  i_high = [50, 100, 150, 200, 300, 400, 500, 9999]
  if pollutant == 'pm2_5':
    c_low = [0, 12.1, 35.5, 55.5, 150.5, 250.5, 350.5, 500.5]
    c_high = [12, 35.4, 55.4, 150.4, 250.4, 350.4, 500.4, 1000.0]
  elif pollutant == 'pm10':
    c_low = [0, 55, 155, 255, 355, 425, 505, 605]
    c_high = [54, 154, 254, 354, 424, 504, 604, 999.0]
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
      return 'Invalid pollutant type'

  c = float(concentration)

  for i, item in enumerate(c_low):
    if item <= c <= c_high[i]:
      aqi = ((i_high[i] - i_low[i]) / (c_high[i] - item)) * (c - item) + i_low[i]
      return round(aqi, 1)
  if c > c_high[-1]:
    aqi = ((i_high[-1] - i_low[-1]) / (c_high[-1] - c_low[-1])) * (c - c_low[-1]) + i_low[-1]
    return round(aqi, 1)
  else:
    return 'Input concentration is below AQI scale'
    
#Calculate AQI based on pollutant concentration.
#concentration: float, concentration value in µg/m³
#pollutant: string, one of 'PM2.5' or 'PM10'
def calculate_aqi(concentration, pollutant):
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
  except:
    return 500

def calculate_aqi_from_dict(dictionary):
  return max(
    calculate_aqi(dictionary["co"] * 0.873 * 0.001, "co"), # Convert from miligram/m3 to ppm
    # calculate_aqi(dictionary["no2"] * 0.531 * 1, "no2"), # Convert from miligram/m3 to ppb
    calculate_aqi(dictionary["so2"] * 0.382 * 1, "so2"), # Convert from miligram/m3 to ppb
    calculate_aqi(dictionary["o3"] * 0.509 * 0.001, "o3"), # Convert from miligram/m3 to ppm
    calculate_aqi(dictionary["pm2_5"], "pm2_5"), # Convert from miligram/m3 to ppm
    calculate_aqi(dictionary["pm10"], "pm10"), # Convert from miligram/m3 to ppm
  )

def calculate_traffic_index_from_dict(dictionary):
  try:
    return (dictionary["person"]*0.25 + (dictionary["bike"] + dictionary["motorbike"])*0.5 + 
      dictionary["car"]*1 + (dictionary["truck"] + dictionary["bus"])*2)
  except:
    return ((dictionary["bike"] + dictionary["motorbike"])*0.5 + 
      dictionary["car"]*1 + (dictionary["truck"] + dictionary["bus"])*2)
  
def traffic_index_to_quality(traffic_index):
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

def to_lowercase_english(word):
  INTAB = "ạảãàáâậầấẩẫăắằặẳẵóòọõỏôộổỗồốơờớợởỡéèẻẹẽêếềệểễúùụủũưựữửừứíìịỉĩýỳỷỵỹđ"
  OUTTAB = "a"*17 + "o"*17 + "e"*11 + "u"*11 + "i"*5 + "y"*5 + "d"
  word = word.lower()
  result = ""
  for char in word:
    try:
      result += (OUTTAB[INTAB.index(char)])
    except:
      result += (char)
  return result

def try_read(field, default_value):
  try:
    result = request.form.get(field)
    if result == None:
      result = default_value
  except:
    result = default_value
  return result
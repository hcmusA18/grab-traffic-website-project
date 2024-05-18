from flask import request

AQI_BREAKPOINTS = {
    "pm2_5": (
        [0, 12.1, 35.5, 55.5, 150.5, 250.5, 350.5, 500.5],
        [12, 35.4, 55.4, 150.4, 250.4, 350.4, 500.4, 999.9],
    ),
    "pm10": (
        [0, 55, 155, 255, 355, 425, 505, 605],
        [54, 154, 254, 354, 424, 504, 604, 999],
    ),
    "o3": (
        [0, 0.055, 0.071, 0.086, 0.106, 0.201, 0.3, 0.4],
        [0.054, 0.07, 0.85, 0.105, 0.2, 0.299, 0.399, 1],
    ),
    "co": (
        [0, 4.5, 9.5, 12.5, 15.5, 30.5, 50.5, 70],
        [4.4, 9.4, 12.4, 15.4, 30.4, 50.4, 69.9, 100],
    ),
    "so2": (
        [0, 36, 76, 186, 304, 605, 1005, 2000],
        [35, 75, 185, 304, 604, 1004, 1999, 3000],
    ),
    "no2": (
        [0, 54, 101, 361, 650, 1250, 2050, 3000],
        [53, 100, 360, 649, 1249, 2049, 2999, 4000],
    ),
}


def calculate_aqi(concentration: float, pollutant: str) -> int:
    try:
        c_low, c_high = AQI_BREAKPOINTS[pollutant]
        aqi_low = [0, 51, 101, 151, 201, 301, 401, 501]
        aqi_high = [50, 100, 150, 200, 300, 400, 500, 999]

        for i in range(len(c_high)):
            if concentration <= c_high[i]:
                aqi = round(
                    ((aqi_high[i] - aqi_low[i]) / (c_high[i] - c_low[i]))
                    * (concentration - c_low[i])
                    + aqi_low[i]
                )
                return aqi
        return 500
    except KeyError:
        raise ValueError(
            "Invalid pollutant. Choose from 'pm2_5', 'pm10', 'o3', 'co', 'so2', 'no2'."
        )


def preprocess_input(inp: dict) -> dict:
    return {
        "co": inp.get("co", 0) * 0.873 * 0.001,
        "no2": inp.get("no2", 0) * 0.531,
        "so2": inp.get("so2", 0) * 0.382,
        "o3": inp.get("o3", 0) * 0.509 * 0.001,
        "pm2_5": inp.get("pm2_5", 0),
        "pm10": inp.get("pm10", 0),
    }


def calculate_aqi_from_dict(inp: dict) -> int:
    inp = preprocess_input(inp)
    return max(
        calculate_aqi(inp["co"], "co"),
        calculate_aqi(inp["no2"], "no2"),
        calculate_aqi(inp["so2"], "so2"),
        calculate_aqi(inp["o3"], "o3"),
        calculate_aqi(inp["pm2_5"], "pm2_5"),
        calculate_aqi(inp["pm10"], "pm10"),
    )


def calculate_traffic_index_from_dict(inp: dict) -> float:
    return (
        inp.get("person", 0) * 0.25
        + (inp.get("bike", 0) + inp.get("motorbike", 0)) * 0.5
        + inp.get("car", 0)
        + (inp.get("truck", 0) + inp.get("bus", 0)) * 2
    )


def traffic_index_to_quality(traffic_index: float) -> int:
    if traffic_index < 2.5:
        return 1
    elif traffic_index < 5:
        return 2
    elif traffic_index < 7.5:
        return 3
    elif traffic_index < 10:
        return 4
    else:
        return 5


def calculate_traffic_quality_from_dict(dictionary: dict) -> int:
    traffic_index = calculate_traffic_index_from_dict(dictionary)
    return traffic_index_to_quality(traffic_index)


def to_lowercase_english(word: str) -> str:
    inp = "ạảãàáâậầấẩẫăắằặẳẵóòọõỏôộổỗồốơờớợởỡéèẻẹẽêếềệểễúùụủũưựữửừứíìịỉĩýỳỷỵỹđ"
    out = "a" * 17 + "o" * 17 + "e" * 11 + "u" * 11 + "i" * 5 + "y" * 5 + "d"
    return word.lower().translate(str.maketrans(inp, out))


def try_read(field: str, default_value: str) -> str:
    return request.form.get(field, default_value)

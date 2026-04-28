import requests
import pandas as pd
import logging
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather"

# Kitwe stations with coordinates
KITWE_STATIONS = [
    {
        "station_name": "Kitwe Central AWS",
        "latitude": -12.8025,
        "longitude": 28.2132,
        "source_api": "OpenWeather"
    },
    {
        "station_name": "Mindolo ZMD Station",
        "latitude": -12.7789,
        "longitude": 28.1924,
        "source_api": "OpenWeather"
    },
    {
        "station_name": "NASA POWER Grid Kitwe",
        "latitude": -12.8000,
        "longitude": 28.2000,
        "source_api": "OpenWeather"
    }
]


def fetch_openweather_data(latitude: float, longitude: float) -> dict:
    """
    Fetch current weather data from OpenWeather API.
    """
    if not OPENWEATHER_API_KEY:
        logger.error("OpenWeather API key not found in .env file")
        return None

    params = {
        "lat": latitude,
        "lon": longitude,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric"  # Celsius
    }

    try:
        logger.info(f"Fetching OpenWeather data for lat={latitude}, lon={longitude}")
        response = requests.get(OPENWEATHER_BASE_URL, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        logger.info(f"Successfully fetched OpenWeather data")
        return data
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to fetch OpenWeather data: {e}")
        return None


def parse_openweather_response(raw_data: dict, station_name: str) -> pd.DataFrame:
    """
    Parse OpenWeather JSON response into a clean pandas DataFrame.
    """
    if not raw_data:
        return pd.DataFrame()

    try:
        records = [{
            "station_name":  station_name,
            "temperature_c": raw_data.get("main", {}).get("temp", None),
            "rainfall_mm":   raw_data.get("rain", {}).get("1h", 0.0),
            "wind_speed_ms": raw_data.get("wind", {}).get("speed", None),
            "humidity_pct":  raw_data.get("main", {}).get("humidity", None),
            "observed_at":   datetime.utcnow().replace(microsecond=0),
            "raw_format":    "JSON"
        }]

        df = pd.DataFrame(records)
        logger.info(f"Parsed {len(df)} records for {station_name}")
        return df

    except Exception as e:
        logger.error(f"Error parsing OpenWeather response: {e}")
        return pd.DataFrame()


def fetch_all_stations() -> pd.DataFrame:
    """
    Fetch and parse current weather for all Kitwe stations.
    """
    all_data = []

    for station in KITWE_STATIONS:
        raw_data = fetch_openweather_data(
            latitude=station["latitude"],
            longitude=station["longitude"]
        )

        if raw_data:
            df = parse_openweather_response(raw_data, station["station_name"])
            if not df.empty:
                df["latitude"]   = station["latitude"]
                df["longitude"]  = station["longitude"]
                df["source_api"] = station["source_api"]
                all_data.append(df)

    if all_data:
        combined_df = pd.concat(all_data, ignore_index=True)
        logger.info(f"Total OpenWeather records fetched: {len(combined_df)}")
        return combined_df

    return pd.DataFrame() 
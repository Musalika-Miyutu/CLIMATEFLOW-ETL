import requests
import pandas as pd
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── NASA POWER API Configuration ─────────────────────────────
NASA_POWER_BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

# Climate parameters we need from NASA POWER
# T2M = Temperature at 2 meters
# PRECTOTCORR = Precipitation
# WS2M = Wind Speed at 2 meters
# RH2M = Relative Humidity at 2 meters
NASA_PARAMETERS = "T2M,PRECTOTCORR,WS2M,RH2M"

# Kitwe, Copperbelt coordinates
KITWE_STATIONS = [
    {
        "station_name": "Kitwe Central AWS",
        "latitude": -12.8025,
        "longitude": 28.2132,
        "source_api": "NASA POWER"
    },
    {
        "station_name": "Mindolo ZMD Station",
        "latitude": -12.7789,
        "longitude": 28.1924,
        "source_api": "NASA POWER"
    },
    {
        "station_name": "NASA POWER Grid Kitwe",
        "latitude": -12.8000,
        "longitude": 28.2000,
        "source_api": "NASA POWER"
    }
]


def fetch_nasa_power_data(latitude: float, longitude: float, days_back: int = 7) -> dict:
    """
    Fetch climate data from NASA POWER API for a given location.
    Returns raw JSON response from NASA POWER.
    """
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days_back)

    params = {
        "parameters": NASA_PARAMETERS,
        "community": "RE",
        "longitude": longitude,
        "latitude": latitude,
        "start": start_date.strftime("%Y%m%d"),
        "end": end_date.strftime("%Y%m%d"),
        "format": "JSON"
    }

    try:
        logger.info(f"Fetching NASA POWER data for lat={latitude}, lon={longitude}")
        response = requests.get(NASA_POWER_BASE_URL, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        logger.info(f"Successfully fetched NASA POWER data")
        return data
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to fetch NASA POWER data: {e}")
        return None


def parse_nasa_power_response(raw_data: dict, station_name: str) -> pd.DataFrame:
    """
    Parse NASA POWER JSON response into a clean pandas DataFrame.
    Satisfies Objective 1.3.2.2 - Data Harmonization
    """
    if not raw_data:
        return pd.DataFrame()

    try:
        properties = raw_data.get("properties", {})
        parameter_data = properties.get("parameter", {})

        # Extract each parameter
        temperature  = parameter_data.get("T2M", {})
        rainfall     = parameter_data.get("PRECTOTCORR", {})
        wind_speed   = parameter_data.get("WS2M", {})
        humidity     = parameter_data.get("RH2M", {})

        # Build records list
        records = []
        for date_str in temperature.keys():
            try:
                observed_at = datetime.strptime(date_str, "%Y%m%d")

                temp_val     = temperature.get(date_str, None)
                rain_val     = rainfall.get(date_str, None)
                wind_val     = wind_speed.get(date_str, None)
                humidity_val = humidity.get(date_str, None)

                # NASA POWER uses -999 for missing values — replace with None
                temp_val     = None if temp_val     == -999 else temp_val
                rain_val     = None if rain_val     == -999 else rain_val
                wind_val     = None if wind_val     == -999 else wind_val
                humidity_val = None if humidity_val == -999 else humidity_val

                records.append({
                    "station_name":  station_name,
                    "temperature_c": temp_val,
                    "rainfall_mm":   rain_val,
                    "wind_speed_ms": wind_val,
                    "humidity_pct":  humidity_val,
                    "observed_at":   observed_at,
                    "raw_format":    "JSON"
                })
            except ValueError as e:
                logger.warning(f"Skipping date {date_str}: {e}")
                continue

        df = pd.DataFrame(records)
        logger.info(f"Parsed {len(df)} records for {station_name}")
        return df

    except Exception as e:
        logger.error(f"Error parsing NASA POWER response: {e}")
        return pd.DataFrame()


def fetch_all_stations(days_back: int = 7) -> pd.DataFrame:
    """
    Fetch and parse data for all Kitwe stations.
    Returns a combined DataFrame for all stations.
    """
    all_data = []

    for station in KITWE_STATIONS:
        raw_data = fetch_nasa_power_data(
            latitude=station["latitude"],
            longitude=station["longitude"],
            days_back=days_back
        )

        if raw_data:
            df = parse_nasa_power_response(raw_data, station["station_name"])
            if not df.empty:
                df["latitude"]   = station["latitude"]
                df["longitude"]  = station["longitude"]
                df["source_api"] = station["source_api"]
                all_data.append(df)

    if all_data:
        combined_df = pd.concat(all_data, ignore_index=True)
        logger.info(f"Total records fetched: {len(combined_df)}")
        return combined_df

    return pd.DataFrame()
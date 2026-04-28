import cdsapi
import pandas as pd
import logging
import os
import tempfile
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Kitwe bounding box coordinates
KITWE_AREA = [-12.70, 28.10, -12.90, 28.30]  # North, West, South, East

ERA5_VARIABLES = [
    "2m_temperature",
    "total_precipitation",
    "10m_u_component_of_wind",
    "10m_v_component_of_wind",
    "2m_dewpoint_temperature",
    "surface_pressure"
]

KITWE_STATIONS = [
    {
        "station_name": "Kitwe Central AWS",
        "latitude": -12.8025,
        "longitude": 28.2132,
        "source_api": "ERA5"
    },
    {
        "station_name": "Mindolo ZMD Station",
        "latitude": -12.7789,
        "longitude": 28.1924,
        "source_api": "ERA5"
    },
    {
        "station_name": "NASA POWER Grid Kitwe",
        "latitude": -12.8000,
        "longitude": 28.2000,
        "source_api": "ERA5"
    }
]


def fetch_era5_data(days_back: int = 7) -> str:
    """
    Fetch ERA5 reanalysis data for Kitwe area.
    Returns path to downloaded NetCDF file.
    """
    try:
        client = cdsapi.Client(
            url="https://cds.climate.copernicus.eu/api",
            key=os.getenv("ERA5_API_KEY")
        )

        end_date   = datetime.utcnow()
        start_date = end_date - timedelta(days=days_back)

        # Generate list of dates
        date_range = f"{start_date.strftime('%Y-%m-%d')}/{end_date.strftime('%Y-%m-%d')}"

        # Create temp file for download
        temp_file = tempfile.NamedTemporaryFile(suffix=".nc", delete=False)
        output_path = temp_file.name
        temp_file.close()

        logger.info(f"Fetching ERA5 data for date range: {date_range}")

        client.retrieve(
            "reanalysis-era5-single-levels",
            {
                "product_type": "reanalysis",
                "variable": ERA5_VARIABLES,
                "year":  [start_date.strftime("%Y")],
                "month": [start_date.strftime("%m")],
                "day":   [str(d) for d in range(1, 32)],
                "time":  ["00:00", "06:00", "12:00", "18:00"],
                "area":  KITWE_AREA,
                "format": "netcdf",
                "download_format": "unarchived" 
            },
            output_path
        )

        logger.info(f"ERA5 data downloaded to: {output_path}")
        return output_path

    except Exception as e:
        logger.error(f"Failed to fetch ERA5 data: {e}")
        return None


def parse_era5_data(file_path: str) -> pd.DataFrame:
    """
    Parse ERA5 data file into a clean pandas DataFrame.
    Handles both ZIP and NetCDF formats.
    """
    try:
        import xarray as xr
        import numpy as np
        import zipfile
        import tempfile
        import os

        actual_nc_path = file_path

        # Check if the downloaded file is a ZIP and extract it
        if zipfile.is_zipfile(file_path):
            logger.info("ERA5 file is a ZIP archive, extracting...")
            extract_dir = tempfile.mkdtemp()
            with zipfile.ZipFile(file_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)

            # Find the .nc file inside the ZIP
            nc_files = [
                f for f in os.listdir(extract_dir)
                if f.endswith('.nc')
            ]

            if not nc_files:
                logger.error("No NetCDF file found inside ZIP archive")
                return pd.DataFrame()

            actual_nc_path = os.path.join(extract_dir, nc_files[0])
            logger.info(f"Extracted NetCDF file: {actual_nc_path}")

        # Open with h5netcdf engine
        try:
            ds = xr.open_dataset(actual_nc_path, engine="h5netcdf")
        except Exception:
            ds = xr.open_dataset(actual_nc_path, engine="scipy")

        logger.info(f"ERA5 dataset variables: {list(ds.variables)}")

        records = []
        time_var = "valid_time" if "valid_time" in ds else "time"
        times = ds[time_var].values

        for i, time in enumerate(times):
            try:
                # Get available variables dynamically
                temp_k   = float(ds["t2m"].isel({time_var: i}).mean().values)   if "t2m"  in ds else None
                precip_m = float(ds["tp"].isel({time_var: i}).mean().values)    if "tp"   in ds else 0.0
                u_wind   = float(ds["u10"].isel({time_var: i}).mean().values)   if "u10"  in ds else 0.0
                v_wind   = float(ds["v10"].isel({time_var: i}).mean().values)   if "v10"  in ds else 0.0

                # Convert units
                temp_c     = (temp_k - 273.15) if temp_k is not None else None
                precip_mm  = max(0, precip_m * 1000)
                wind_speed = (u_wind**2 + v_wind**2)**0.5

                observed_at = pd.Timestamp(time).to_pydatetime()

                records.append({
                    "station_name":  "NASA POWER Grid Kitwe",
                    "temperature_c": round(temp_c, 2) if temp_c is not None else None,
                    "rainfall_mm":   round(precip_mm, 2),
                    "wind_speed_ms": round(wind_speed, 2),
                    "humidity_pct":  None,
                    "observed_at":   observed_at,
                    "raw_format":    "NetCDF",
                    "latitude":      -12.8000,
                    "longitude":     28.2000,
                    "source_api":    "ERA5"
                })

            except Exception as e:
                logger.warning(f"Skipping time step {i}: {e}")
                continue

        ds.close()

        # Clean up extracted files
        if zipfile.is_zipfile(file_path):
            try:
                import shutil
                shutil.rmtree(extract_dir)
            except Exception:
                pass

        df = pd.DataFrame(records)
        logger.info(f"Parsed {len(df)} ERA5 records")
        return df

    except Exception as e:
        logger.error(f"Error parsing ERA5 data: {e}")
        return pd.DataFrame()

def fetch_all_stations(days_back: int = 7) -> pd.DataFrame:
    """
    Fetch and parse ERA5 data for Kitwe area.
    """
    file_path = fetch_era5_data(days_back=days_back)
    if not file_path:
        return pd.DataFrame()

    df = parse_era5_data(file_path)

    # Clean up temp file
    try:
        os.remove(file_path)
    except Exception:
        pass

    # Make sure source_api is correctly set to ERA5
    if not df.empty:
        df["source_api"]   = "ERA5"
        df["station_name"] = "ERA5 Kitwe Grid"
        df["latitude"]     = -12.8000
        df["longitude"]    = 28.2000

    return df
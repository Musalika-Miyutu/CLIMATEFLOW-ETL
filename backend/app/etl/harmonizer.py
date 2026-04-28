import pandas as pd
import numpy as np
import pyarrow as pa
import pyarrow.parquet as pq
import os
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PARQUET_OUTPUT_DIR = "app/etl/parquet_output"


def harmonize_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean and harmonize raw weather data.
    Satisfies Objective 1.3.2.2 - Data Harmonization:
    - Handles missing values (Data Imputation)
    - Standardizes units across sources
    - Removes duplicates
    - Validates data ranges
    """
    if df.empty:
        logger.warning("Empty DataFrame received for harmonization")
        return df

    logger.info(f"Harmonizing {len(df)} records...")

    # ── Step 1: Remove duplicates ─────────────────────────────
    df = df.drop_duplicates(subset=["station_name", "observed_at"])
    logger.info(f"After deduplication: {len(df)} records")

    # ── Step 2: Data Imputation (fill missing values) ─────────
    # Fill missing values with the mean of each column
    numeric_cols = ["temperature_c", "rainfall_mm", "wind_speed_ms", "humidity_pct"]
    for col in numeric_cols:
        if col in df.columns:
            missing_count = df[col].isna().sum()
            if missing_count > 0:
                col_mean = df[col].mean()
                if pd.isna(col_mean):
                    df[col] = df[col].fillna(0.0)  # If mean is NaN, fill with 0
                else:    
                    df[col] = df[col].fillna(col_mean)
                logger.info(f"Imputed {missing_count} missing values in {col} with mean {col_mean:.2f}")

    # ── Step 3: Validate data ranges ─────────────────────────
    # Temperature in Zambia: -5°C to 45°C
    df.loc[~df["temperature_c"].between(-5, 45), "temperature_c"] = np.nan
    df["temperature_c"] = df["temperature_c"].fillna(df["temperature_c"].mean())

    # Rainfall: 0 to 200mm per day
    df.loc[df["rainfall_mm"] < 0, "rainfall_mm"] = 0
    df.loc[df["rainfall_mm"] > 200, "rainfall_mm"] = 200

    # Wind speed: 0 to 50 m/s
    df.loc[df["wind_speed_ms"] < 0, "wind_speed_ms"] = 0
    df.loc[df["wind_speed_ms"] > 50, "wind_speed_ms"] = 50

    # Humidity: 0 to 100%
    df.loc[df["humidity_pct"] < 0, "humidity_pct"]   = 0
    df.loc[df["humidity_pct"] > 100, "humidity_pct"] = 100

    # ── Step 4: Round values to 2 decimal places ─────────────
    for col in numeric_cols:
        if col in df.columns:
            df[col] = df[col].round(2)

    # ── Step 5: Sort by observed_at ───────────────────────────
    df = df.sort_values("observed_at").reset_index(drop=True)

    logger.info(f"Harmonization complete. {len(df)} clean records ready.")
    return df


def save_to_parquet(df: pd.DataFrame, source_name: str = "nasa_power") -> str:
    """
    Save harmonized data to Parquet format.
    Satisfies Objective 1.3.2.3 - Schema Standardization
    """
    if df.empty:
        logger.warning("No data to save to Parquet")
        return None

    # Create output directory if it doesn't exist
    os.makedirs(PARQUET_OUTPUT_DIR, exist_ok=True)

    timestamp  = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename   = f"{source_name}_{timestamp}.parquet"
    filepath   = os.path.join(PARQUET_OUTPUT_DIR, filename)

    # Define schema for transport vulnerability modeling
    schema = pa.schema([
        pa.field("station_name",  pa.string()),
        pa.field("temperature_c", pa.float64()),
        pa.field("rainfall_mm",   pa.float64()),
        pa.field("wind_speed_ms", pa.float64()),
        pa.field("humidity_pct",  pa.float64()),
        pa.field("observed_at",   pa.timestamp("ms")),
        pa.field("raw_format",    pa.string()),
        pa.field("latitude",      pa.float64()),
        pa.field("longitude",     pa.float64()),
        pa.field("source_api",    pa.string()),
    ])

    table = pa.Table.from_pandas(df, schema=schema)
    pq.write_table(table, filepath)
    logger.info(f"Saved {len(df)} records to Parquet: {filepath}")
    return filepath
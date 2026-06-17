# ClimateFlow ETL — Climate-Resilient Infrastructure Monitoring Dashboard

**Group 27 — 3rd Year Project**
Developing an Automated Data Pipeline for Climate-Resilient Infrastructure Monitoring in Zambia (Kitwe, Copperbelt)

---

## 📖 Overview

ClimateFlow is a full-stack system that automatically collects climate data from multiple sources, harmonizes it, evaluates infrastructure risk, and presents everything through a live monitoring dashboard. It was built to support the Road Development Agency (RDA) and other stakeholders in identifying climate-related risks to roads, bridges, and drainage systems in Kitwe, Zambia.

---

## 🏗️ System Architecture

---

## 🎯 Project Objectives

| Objective | Description | Status |
|---|---|---|
| 1.3.2.1 — Orchestration Design | Automated ingestion from NASA POWER, ERA5, and OpenWeather | ✅ Complete |
| 1.3.2.2 — Data Harmonization | Python-based cleaning, imputation, and unit standardization | ✅ Complete |
| 1.3.2.3 — Schema Standardization | Analysis-ready Parquet/SQL outputs | ✅ Complete |
| 1.3.2.4 — Framework Validation | Modular, auditable, documented pipeline with full logging | ✅ Complete |

---

## 🧰 Tech Stack

**Frontend**
- React + TypeScript + Vite
- Tailwind CSS
- Recharts (data visualization)
- React Router

**Backend**
- Python 3.10
- FastAPI
- SQLAlchemy (ORM)
- PostgreSQL 18
- JWT Authentication (python-jose, passlib)
- APScheduler (automated pipeline scheduling)
- ReportLab (PDF report generation)

**Data Sources**
- NASA POWER API (free, no key required)
- OpenWeather API
- ERA5 Copernicus Climate Data Store

---

## 📁 Project Structure

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js and npm
- PostgreSQL 16+
- API keys: [OpenWeather](https://openweathermap.org/api), [ERA5/Copernicus](https://cds.climate.copernicus.eu)

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/climateflow_db
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
OPENWEATHER_API_KEY=your_openweather_key
ERA5_API_KEY=your_user_id:your_era5_key
ERA5_API_URL=https://cds.climate.copernicus.eu/api
```

Create the ERA5 credentials file at `C:\Users\<YourUser>\.cdsapirc`:

Run the database schema (see `database_schema.sql`), then start the server:

```bash
uvicorn app.main:app --reload
```

Backend runs at: **http://127.0.0.1:8000**
API documentation: **http://127.0.0.1:8000/docs**

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🔑 Authentication

The system uses JWT-based authentication. Register a new account at `/register` or use the API directly via `/docs`.

Roles available: `admin`, `analyst`, `engineer`, `planner`

---

## 🔄 ETL Pipelines

| Pipeline | Source | Schedule | Data |
|---|---|---|---|
| NASA POWER | power.larc.nasa.gov | Daily, 1:00 AM | Temperature, rainfall, wind, humidity |
| OpenWeather | api.openweathermap.org | Every 6 hours | Live current conditions |
| ERA5 | cds.climate.copernicus.eu | Weekly, Monday 2:00 AM | Historical reanalysis data |
| Risk Assessment Engine | Internal | Daily, 3:00 AM | Calculates risk levels 1-5 per asset |

Pipelines can also be triggered manually from the **Pipeline Flow** page on the dashboard, or via the API at `/pipeline/run/{source}`.

---

## ⚠️ Risk Assessment Logic

Each infrastructure asset is evaluated against the latest weather observations using:
- Rainfall, wind speed, and temperature thresholds
- Asset type multipliers (bridges are weighted higher than roads)
- A 1–5 risk scale, with automatic alerts triggered at level 3+

---

## 📄 Reports

A PDF summary report can be generated and downloaded directly from the **Overview** page, or via the API at `/pipeline/report/pdf`. It includes asset status, active alerts, and data source summaries.

---

## 📊 Dashboard Pages

| Page | Description |
|---|---|
| Overview | Live stats, recent pipeline runs, active risk alerts, PDF report download |
| Pipeline Flow | Visual ETL pipeline architecture with manual trigger buttons |
| Data Sources | Live status and record counts for each integrated data source |
| Monitoring | Real-time activity logs and pipeline metrics |
| Analytics | Charts for data trends, risk distribution, and source breakdown |

---

## 👥 Group 27

3rd Year Project — Developing an Automated Data Pipeline for Climate-Resilient Infrastructure Monitoring in Zambia


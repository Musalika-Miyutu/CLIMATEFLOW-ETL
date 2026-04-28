from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routers import auth, assets, weather, risk, pipeline

load_dotenv()

app = FastAPI(
    title="ClimateFlow API",
    description="Automated Data Pipeline for Climate-Resilient Infrastructure Monitoring in Zambia",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(assets.router)
app.include_router(weather.router)
app.include_router(risk.router)
app.include_router(pipeline.router)


@app.get("/")
def root():
    return {
        "project": "ClimateFlow ETL Pipeline",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
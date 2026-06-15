from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from app.routers import auth, assets, weather, risk, pipeline
from app.scheduler import start_scheduler, stop_scheduler, get_scheduler_status

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start scheduler when server starts
    start_scheduler()
    yield
    # Stop scheduler when server shuts down
    stop_scheduler()


app = FastAPI(
    title="ClimateFlow API",
    description="Automated Data Pipeline for Climate-Resilient Infrastructure Monitoring in Zambia",
    version="1.0.0",
    lifespan=lifespan
)

# ── CORS ─────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────
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
        "status":  "running",
        "docs":    "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/scheduler/status")
def scheduler_status():
    """Check the status of all scheduled pipeline jobs."""
    return get_scheduler_status()
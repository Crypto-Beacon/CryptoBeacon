from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, portfolio, watchlist, intelligence, market, crypto
from .database import db

app = FastAPI(title="CryptoBeacon API")

# CORS
origins = [
    "http://localhost",
    "http://localhost:5173", # Vite default
    "http://localhost:3000", # React default
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    db.connect_db()
    from .services.scheduler import start_scheduler
    start_scheduler()

@app.on_event("shutdown")
async def shutdown_db_client():
    db.close_db()

app.include_router(auth.router, prefix="/auth")
app.include_router(portfolio.router)
app.include_router(watchlist.router)
app.include_router(intelligence.router)
app.include_router(market.router, prefix="/market")
app.include_router(crypto.router, prefix="/crypto")

@app.get("/")
async def root():
    return {"message": "Welcome to CryptoBeacon API"}

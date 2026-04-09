from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from app.models.user import User
from app.models.tracked_flight import TrackedFlight

from app.api.routes import auth, flights, tracked_flights
from app.core.database import Base, engine

import app.models.user
import app.models.tracked_flight

app = FastAPI(title="SkyMate API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(flights.router)
app.include_router(tracked_flights.router)

@app.get("/")
def read_root():
    return {"message": "SkyMate backend is running"}
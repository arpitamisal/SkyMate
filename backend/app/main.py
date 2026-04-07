from fastapi import FastAPI

from app.api.routes import auth
from app.core.database import Base, engine

app = FastAPI(title="SkyMate API")

Base.metadata.create_all(bind=engine)

app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "SkyMate backend is running"}
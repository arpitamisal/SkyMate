from fastapi import FastAPI

app = FastAPI(title="SkyMate API")

@app.get("/")
def read_root():
    return {"message": "SkyMate backend is running"}
from fastapi import FastAPI

app = FastAPI(title="GLI-OCR Service")

@app.get("/")
def ping():
    return {"status": "ok", "message": "OCR service running"}
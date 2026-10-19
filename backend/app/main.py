import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router

app = FastAPI(
    title="ExcuseMe NLP API",
    description="Multi-operation NLP workbench. Linguistic cues are not proof of deception.",
    version="0.1.0",
)

_configured_origins = os.getenv("CORS_ORIGINS", "*")
CORS_ORIGINS = [origin.strip() for origin in _configured_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS or ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "name": "ExcuseMe NLP API",
        "version": "0.1.0",
        "docs": "/docs",
        "warning": "This API does not establish whether a real person is lying.",
    }

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(router)

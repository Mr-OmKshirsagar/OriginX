from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings, validate_required_settings
from app.routes.analysis import router as analysis_router
from app.routes.claims import router as claims_router
from app.routes.health import router as health_router
from app.routes.test_db import router as test_db_router


@asynccontextmanager
async def lifespan(_: FastAPI):
	validate_required_settings()
	yield


app = FastAPI(title="OriginX Backend", lifespan=lifespan)

app.add_middleware(
	CORSMiddleware,
	allow_origins=settings.BACKEND_CORS_ORIGINS,
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(claims_router)
app.include_router(test_db_router)
app.include_router(analysis_router)

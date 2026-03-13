from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import validate_required_settings
from app.routes.claims import router as claims_router
from app.routes.health import router as health_router
from app.routes.test_db import router as test_db_router


@asynccontextmanager
async def lifespan(_: FastAPI):
	validate_required_settings()
	yield


app = FastAPI(title="TruthSeeker Backend", lifespan=lifespan)

app.include_router(health_router)
app.include_router(claims_router)
app.include_router(test_db_router)

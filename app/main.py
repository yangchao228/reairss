import uuid
from fastapi import FastAPI, Request

from app.api.routes import api_router
from app.core.config import settings
from app.core.response import success
from app.db.init import init_db


def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME)

    @app.middleware("http")
    async def add_trace_id(request: Request, call_next):
        trace_id = request.headers.get("X-Trace-Id", str(uuid.uuid4()))
        response = await call_next(request)
        response.headers["X-Trace-Id"] = trace_id
        return response

    @app.on_event("startup")
    def on_startup():
        init_db()

    app.include_router(api_router)

    @app.get("/health")
    def root_health():
        return success({"status": "ok"})

    return app


app = create_app()

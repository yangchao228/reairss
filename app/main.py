import uuid
from fastapi import FastAPI, Request

from app.api.routes import api_router
from app.core.config import settings
from app.core.response import success
from app.core.trace import reset_trace_id, set_trace_id
from app.db.init import init_db
from app.api.routes.common import utc_now_iso


def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME)

    @app.middleware("http")
    async def add_trace_id(request: Request, call_next):
        trace_id = request.headers.get("X-Trace-Id", str(uuid.uuid4()))
        token = set_trace_id(trace_id)
        try:
            response = await call_next(request)
        finally:
            reset_trace_id(token)
        response.headers["X-Trace-Id"] = trace_id
        return response

    @app.on_event("startup")
    def on_startup():
        init_db()

    app.include_router(api_router)

    @app.get("/health")
    def root_health():
        return success({"status": "healthy", "version": "1.0.0", "timestamp": utc_now_iso()})

    return app


app = create_app()

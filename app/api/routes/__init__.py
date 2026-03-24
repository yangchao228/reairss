from fastapi import APIRouter

from app.core.config import settings

from .content import router as content_router
from .feed import router as feed_router
from .sources import router as sources_router
from .subscriptions import router as subscriptions_router


api_router = APIRouter(prefix=settings.API_PREFIX)
api_router.include_router(sources_router)
api_router.include_router(subscriptions_router)
api_router.include_router(feed_router)
api_router.include_router(content_router)

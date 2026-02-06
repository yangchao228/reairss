from fastapi import APIRouter

from app.core.response import success


router = APIRouter()


@router.get("/health")
def health_check():
    return success({"status": "ok"})

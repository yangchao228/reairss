from typing import Any, Dict

from fastapi.responses import JSONResponse

from app.core.trace import get_trace_id


def success(data: Any = None, message: str = "ok") -> Dict[str, Any]:
    return {
        "code": 0,
        "message": message,
        "data": data if data is not None else {},
        "trace_id": get_trace_id(),
    }


def error(code: int, message: str) -> Dict[str, Any]:
    return {
        "code": code,
        "message": message,
        "data": {},
        "trace_id": get_trace_id(),
    }


def error_response(code: int, message: str, http_status: int = 400) -> JSONResponse:
    return JSONResponse(status_code=http_status, content=error(code, message))

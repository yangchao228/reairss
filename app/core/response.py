from typing import Any, Dict


def success(data: Any = None, message: str = "ok") -> Dict[str, Any]:
    return {
        "code": 0,
        "message": message,
        "data": data if data is not None else {},
        "trace_id": "",
    }


def error(code: int, message: str) -> Dict[str, Any]:
    return {
        "code": code,
        "message": message,
        "data": {},
        "trace_id": "",
    }

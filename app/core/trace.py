from contextvars import ContextVar, Token


_trace_id_var: ContextVar[str] = ContextVar("trace_id", default="")


def set_trace_id(trace_id: str) -> Token:
    return _trace_id_var.set(trace_id)


def reset_trace_id(token: Token) -> None:
    _trace_id_var.reset(token)


def get_trace_id() -> str:
    return _trace_id_var.get()

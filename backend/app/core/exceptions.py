"""Application exception hierarchy and its global handler.

`coding_standards.md` Section 2.3 requires custom exceptions to inherit from a
base `AppException` and requires a framework exception handler that turns them
into consistent, machine-readable JSON. TEST-03 is the first feature whose
service layer raises a domain error, so the base class and the handler land
here; later features add subclasses rather than new hierarchies.
"""

import logging

from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class AppException(Exception):
    """Base class for every error this application raises deliberately.

    `status_code` is the HTTP status the global handler maps the error to, so a
    domain error never surfaces as an unexplained 500.
    """

    status_code: int = 500

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class ValidationError(AppException):
    """Input failed a domain rule (as opposed to a schema rule)."""

    status_code = 422


class ConfigurationError(AppException):
    """The application is missing configuration it needs to serve a request."""

    status_code = 500


async def app_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Render an `AppException` as the project's standard JSON error body.

    The signature is typed against `Exception` because that is what Starlette's
    handler registry passes; the registration in `app.main` narrows it to
    `AppException`.
    """
    if not isinstance(exc, AppException):  # pragma: no cover - registry guarantees the type
        raise exc

    logger.warning(
        "%s on %s %s: %s",
        type(exc).__name__,
        request.method,
        request.url.path,
        exc.message,
    )
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})

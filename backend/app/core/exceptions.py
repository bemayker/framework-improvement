"""Application exceptions and their HTTP mapping.

Every domain error inherits from :class:`AppException`, which the app factory
registers a single handler for so the API answers with a consistent
``{"detail": "..."}`` body (`coding_standards.md` Section 2.3).
"""


class AppException(Exception):
    """Base class for domain errors that map to an HTTP status code."""

    status_code: int = 500
    message: str = "An unexpected application error occurred."

    def __init__(self, message: str | None = None) -> None:
        self.message = message if message is not None else type(self).message
        super().__init__(self.message)


class EmptyNoteError(AppException):
    """Raised when a note's text is blank after trimming."""

    status_code = 422
    message = "Note text must not be empty."

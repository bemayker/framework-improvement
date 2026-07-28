"""Application exception hierarchy.

Every domain error inherits from AppException so a single handler in
app/main.py can turn it into a consistent JSON response
(`coding_standards.md` Section 2.3).
"""


class AppException(Exception):
    """Base class for errors the application reports to its clients."""

    status_code: int = 500
    default_message: str = "An unexpected application error occurred."

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.default_message)

    @property
    def message(self) -> str:
        return str(self)


class EmptyNoteError(AppException):
    """Raised when a note carries no text once surrounding whitespace is removed."""

    status_code = 422
    default_message = "Note text must not be empty."

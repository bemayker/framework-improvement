"""Application-level exceptions.

`AppException` is the base every domain-specific exception inherits from, so
`app/main.py` can register a single handler that returns a consistent,
machine-readable JSON error response (`coding_standards.md` §2.3).
"""


class AppException(Exception):
    """Base class for application exceptions that map to an HTTP response."""


class EmptyNoteError(AppException):
    """Raised when a note's content is empty or whitespace-only."""

    def __init__(self, message: str = "Note content must not be empty.") -> None:
        super().__init__(message)

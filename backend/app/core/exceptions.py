"""Application-level exceptions and the shape of their JSON error response.

`coding_standards.md` Section 2.3: custom exceptions inherit from a common
`AppException` base, and a single registered handler (see `app.main`) turns
any of them into a consistent, machine-readable JSON response.
"""


class AppException(Exception):
    """Base class for exceptions mapped to a JSON error response by main.py."""

    status_code: int = 422

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class EmptyNoteError(AppException):
    """Raised when a note's text is empty, or only whitespace, after trimming."""

    def __init__(self, message: str = "Note text must not be empty.") -> None:
        super().__init__(message)

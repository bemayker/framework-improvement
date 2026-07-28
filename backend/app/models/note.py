"""Domain model for a saved note (TEST-03)."""

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base

MAX_NOTE_LENGTH = 500


class Note(Base):
    """A note the user saved, persisted in the `notes` table."""

    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    text: Mapped[str] = mapped_column(String(MAX_NOTE_LENGTH), nullable=False)
    # server_default: the database stamps the creation time, so it is consistent
    # regardless of which client or worker inserted the row.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging aid only
        return f"Note(id={self.id!r}, text={self.text!r})"

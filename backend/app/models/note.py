"""ORM model for the ``notes`` table (TEST-03)."""

from datetime import datetime

from sqlalchemy import DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Note(Base):
    """A saved note: free text with its creation timestamp."""

    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    # Server-side default so the database is the single clock for note ordering.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

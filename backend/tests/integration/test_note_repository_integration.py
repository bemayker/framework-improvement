"""Integration tests for `NoteRepository` against real PostgreSQL.

Isolation is per-test transaction rollback via the `db_session` fixture
(`backend/tests/conftest.py`); no test depends on another having run.
"""

from sqlalchemy.orm import Session

from app.repositories.note_repository import NoteRepository


def test_add_then_list_all_round_trip(db_session: Session):
    """Happy path: a note added via `add` is returned by `list_all`."""
    repository = NoteRepository(db_session)

    repository.add("Buy milk")
    notes = repository.list_all()

    assert [n.content for n in notes] == ["Buy milk"]


def test_add_populates_generated_id_and_created_at(db_session: Session):
    """The `id` and server-defaulted `created_at` are populated after `add`."""
    repository = NoteRepository(db_session)

    note = repository.add("Call the dentist")

    assert note.id is not None
    assert note.created_at is not None


def test_list_all_returns_empty_list_when_no_notes_exist(db_session: Session):
    """Edge case: an empty table yields an empty list, not an error."""
    repository = NoteRepository(db_session)

    assert repository.list_all() == []


def test_list_all_returns_notes_in_insertion_order(db_session: Session):
    """Notes are returned oldest first, by ascending `id` (Assumption A4)."""
    repository = NoteRepository(db_session)

    repository.add("Buy milk")
    repository.add("Call the dentist")
    notes = repository.list_all()

    assert [n.content for n in notes] == ["Buy milk", "Call the dentist"]

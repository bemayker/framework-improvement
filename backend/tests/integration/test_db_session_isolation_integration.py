"""Regression tests for the `db_session` fixture's isolation guarantee.

`NoteService.create_note()` calls `session.commit()` on every successful
write (`app/services/note_service.py`). The `db_session` fixture
(`backend/tests/conftest.py`) binds each test's session to a `Connection` on
which it has already opened a plain transaction (`connection.begin()`, no
SAVEPOINT). With `join_transaction_mode="conditional_savepoint"` and no
SAVEPOINT in progress, SQLAlchemy resolves that to `"rollback_only"`: the
session's `.commit()` flushes writes to the connection but does not commit
the outer transaction, so the fixture's closing `transaction.rollback()`
always undoes it. These tests fail loudly if that guarantee ever regresses
(for example if a future change opens a SAVEPOINT before binding the
session, which would flip the resolved mode to `"create_savepoint"` and
change commit semantics), rather than relying on it holding silently.
"""

from sqlalchemy import text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.repositories.note_repository import NoteRepository
from app.services.note_service import NoteService

_MARKER_CONTENT = "isolation-regression-marker"


def test_note_committed_via_db_session_is_invisible_to_a_separate_connection(
    db_engine: Engine, db_session: Session
):
    """A note "committed" through the service is not visible outside this test's transaction.

    This is the direct proof that `session.commit()` does not propagate to
    the fixture's outer transaction: a second, independent connection against
    the same engine must see zero matching rows while this test's
    transaction is still open.
    """
    service = NoteService(db_session, NoteRepository(db_session))
    service.create_note(_MARKER_CONTENT)

    with db_engine.connect() as other_connection:
        count = other_connection.execute(
            text("SELECT count(*) FROM notes WHERE content = :content"),
            {"content": _MARKER_CONTENT},
        ).scalar()

    assert count == 0


def test_note_committed_via_db_session_does_not_survive_fixture_teardown(db_engine: Engine):
    """Replays the `db_session` fixture's own lifecycle to prove teardown truly rolls back.

    Drives the same connect / begin / bind / commit / rollback sequence the
    fixture uses (rather than depending on `db_session`'s teardown having
    already run, which a single test cannot observe), then checks the row is
    gone afterwards.
    """
    connection = db_engine.connect()
    transaction = connection.begin()
    session_factory = sessionmaker(
        bind=connection,
        autoflush=False,
        autocommit=False,
        future=True,
        join_transaction_mode="conditional_savepoint",
    )
    session = session_factory()

    NoteService(session, NoteRepository(session)).create_note(_MARKER_CONTENT)

    session.close()
    transaction.rollback()
    connection.close()

    with db_engine.connect() as verification_connection:
        count = verification_connection.execute(
            text("SELECT count(*) FROM notes WHERE content = :content"),
            {"content": _MARKER_CONTENT},
        ).scalar()

    assert count == 0

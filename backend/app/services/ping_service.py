"""Ping counter service (FEAT-11): in-memory count of answered pings.

FastAPI runs sync handlers in a thread pool, so two pings can increment at
the same time; the lock keeps the total exact. The count lives only as long
as the instance, which matches "since the application started".
"""

import threading


class PingCounter:
    def __init__(self) -> None:
        self._count = 0
        self._lock = threading.Lock()

    def increment(self) -> int:
        with self._lock:
            self._count += 1
            return self._count

    def value(self) -> int:
        with self._lock:
            return self._count

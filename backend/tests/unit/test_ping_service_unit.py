"""Unit tests for PingCounter (FEAT-11)."""

from concurrent.futures import ThreadPoolExecutor

from app.services.ping_service import PingCounter


def test_value_starts_at_zero():
    assert PingCounter().value() == 0


def test_increment_twice_gives_two():
    counter = PingCounter()

    counter.increment()
    counter.increment()

    assert counter.value() == 2


def test_increment_returns_new_value():
    counter = PingCounter()

    assert counter.increment() == 1
    assert counter.increment() == 2


def test_value_does_not_advance_the_count():
    counter = PingCounter()

    assert counter.value() == 0
    assert counter.value() == 0


def test_separate_instances_are_independent():
    first = PingCounter()
    second = PingCounter()

    first.increment()

    assert first.value() == 1
    assert second.value() == 0


def test_concurrent_increments_give_the_exact_total():
    counter = PingCounter()
    threads = 8
    per_thread = 100

    def hammer() -> None:
        for _ in range(per_thread):
            counter.increment()

    with ThreadPoolExecutor(max_workers=threads) as pool:
        futures = [pool.submit(hammer) for _ in range(threads)]
        for future in futures:
            future.result()

    assert counter.value() == threads * per_thread

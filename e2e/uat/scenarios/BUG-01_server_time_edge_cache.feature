Feature: BUG-01 Server time is not served stale from the edge cache
  GET /api/time carries "Cache-Control: no-store" so a CDN in front of the API
  never stores the per-request clock reading. There is no UI for this endpoint;
  scenarios are HTTP requests against the running backend.

  Background:
    Given the backend is running and reachable at "http://localhost:8010"

  # Criterion 1
  Scenario: The time response forbids caching
    When a client sends GET "/api/time"
    Then the status is 200
    And the response header "Cache-Control" is exactly "no-store"
    And the body still holds exactly the keys "now" and "timezone"

  # Criterion 2
  Scenario: A test asserts the header on the response
    When the tests in "tests/integration/test_server_time_integration.py" are run with "uv run --directory backend pytest -q"
    Then the run includes "test_get_time_sets_cache_control_no_store"
    And the run reports 0 failed

  # Criterion 3
  Scenario: Two requests a second apart return different times once deployed
    Given the fix is deployed behind the CDN
    When a client sends GET "/api/time" and again one second later
    Then the two "now" values differ
    And neither response reports a CDN cache hit

  # Criterion 1, edge case (header set per request, not only on the first)
  Scenario: The header is present on every repeated call
    When a client sends GET "/api/time" twice in a row
    Then both responses have the header "Cache-Control" exactly equal to "no-store"

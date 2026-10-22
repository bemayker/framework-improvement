Feature: BUG-01 Server time is not served stale from the edge cache
  GET /api/time carries Cache-Control: no-store, so the CDN in front of the
  deployed API cannot serve a cached time reading. There is no UI for this
  endpoint; scenarios are HTTP requests against the running backend, plus one
  scenario a human runs on the deployed environment.

  Background:
    Given the backend is running and reachable at "http://localhost:8010"

  # Criterion 1
  Scenario: The time response forbids caching
    When a client sends GET "/api/time"
    Then the status is 200
    And the "Cache-Control" header is "no-store"
    And the body holds exactly the keys "now" and "timezone"

  # Criterion 2
  Scenario: A test asserts the header on the response
    When the tests in "tests/integration/test_server_time_integration.py" and "tests/unit/test_server_time_unit.py" are run with "uv run --directory backend pytest -q"
    Then the run reports 0 failed
    And "test_get_time_sets_cache_control_no_store" is among the tests run

  # Criterion 3, deployed environment, run by a human
  Scenario: Two requests a second apart return different times behind the CDN
    Given the fix is deployed behind the CDN at "https://<deployed-host>"
    When a client sends GET "/api/time" and again one second later
    Then the two "now" values differ
    And the first response carries the "Cache-Control" header "no-store"

  # Criterion 3, edge case (consecutive requests)
  Scenario: The header holds on a second, consecutive request
    When a client sends GET "/api/time" twice, one second apart
    Then both responses carry the "Cache-Control" header "no-store"
    And the two "now" values differ

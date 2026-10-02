Feature: BUG-01 Server time is not stored by shared caches
  As an operator of the deployed environment
  I want GET /api/time to forbid caching
  So that the CDN never replays a stale "now"

  Background:
    Given the backend is running and reachable at the API base URL

  # Criterion 1
  Scenario: GET /api/time carries Cache-Control no-store
    When I send GET /api/time
    Then the response status is 200
    And the Cache-Control header is exactly "no-store"
    And the body is a JSON object with the keys "now" and "timezone"

  # Criterion 2
  Scenario: A test asserts the Cache-Control header
    Given the repository is checked out on the BUG-01 branch
    When I run the backend server_time unit and integration tests
    Then all tests pass with none skipped
    And test_get_time_sets_cache_control_no_store is among the passing tests

  # Criterion 3 (manual, deployed environment only)
  Scenario: Deployed environment returns a fresh value per request
    Given the BUG-01 fix is deployed behind the CDN
    When I send GET /api/time twice, one second apart
    Then the two "now" values differ
    And the CDN cache-status header, if present, is not a hit

  # Edge case
  Scenario: Header is present on every request, not only the first
    When I send GET /api/time twice
    Then both responses carry the Cache-Control header "no-store"

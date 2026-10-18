Feature: BUG-01 Server time is served stale from the edge cache on the deployed environment
  GET /api/time tells the edge cache not to store the response, so two requests
  a second apart return different "now" values.

  Background:
    Given the backend is running and reachable at "http://localhost:8010"

  Scenario: Criterion 1 - GET /api/time carries Cache-Control no-store
    When a client sends GET "/api/time"
    Then the response status is 200
    And the response header "Cache-Control" is "no-store"
    And the body has exactly the fields "now" and "timezone"

  Scenario: Criterion 2 - a test asserts the header on the response
    When the tests in "backend/tests/integration/test_server_time_integration.py" and "backend/tests/unit/test_server_time_unit.py" are run
    Then 0 tests fail
    And "test_get_time_sets_cache_control_no_store" and "test_handler_sets_cache_control_no_store_on_response" are among the collected tests

  Scenario: Criterion 3 - after deploy the reproduction returns two different values
    Given the fix is deployed behind the edge cache and a human has the deployed host name
    When the human requests "https://DEPLOYED-HOST/api/time" twice, one second apart
    Then the two "now" values differ
    And the response header "Cache-Control" is "no-store"

  Scenario: Edge case - a non-GET method is still rejected
    When a client sends POST "/api/time"
    Then the response status is 405

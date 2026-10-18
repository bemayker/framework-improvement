Feature: TEST-07 Uptime endpoint
  As an operator of the Task Notes API
  I want GET /api/uptime to report how long the process has been running
  So that I can tell a restart from a long-lived process without reading container logs

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The uptime is returned with status 200 and two fields (criterion 1)
    When a client sends a GET request to "/api/uptime"
    Then the response status code is 200
    And the response body has exactly the fields "uptime_seconds" and "started_at"
    And the response body field "uptime_seconds" is a JSON number
    And the response body field "started_at" is a string holding an ISO 8601 timestamp

  Scenario: uptime_seconds is non-negative and grows between two calls a second apart (criterion 2)
    When a client sends a GET request to "/api/uptime"
    And the client waits one second
    And the client sends a second GET request to "/api/uptime"
    Then both "uptime_seconds" values are at least 0
    And the second "uptime_seconds" is greater than the first

  Scenario: started_at is captured once and is identical across calls (criterion 3)
    When a client sends a GET request to "/api/uptime" twice, a few seconds apart
    Then "started_at" is character-for-character identical in both responses
    And "uptime_seconds" is greater in the second response

  Scenario: started_at carries an explicit UTC offset (criterion 3)
    When a client sends a GET request to "/api/uptime"
    Then the "started_at" string ends in "+00:00"
    And the "started_at" string does not end in "Z"
    And "started_at" is not later than the current UTC time

  Scenario: The response body is defined by a Pydantic schema (criterion 4)
    Given the source file "backend/app/routers/uptime.py"
    Then the route declares response_model "UptimeResponse" imported from "app.schemas.uptime"
    And the handler returns an "UptimeResponse" instance, not a dict literal
    And the handler calls no clock itself
    And "UptimeResponse" in "backend/app/schemas/uptime.py" declares "uptime_seconds" with "ge=0" and "started_at" as "AwareDatetime"

  Scenario: A restart gives a later started_at and a small uptime (edge case)
    Given a client has noted "started_at" from "/api/uptime"
    When the backend service is restarted with "docker compose restart backend"
    And a client sends a GET request to "/api/uptime"
    Then "started_at" is later than the value noted before the restart
    And "uptime_seconds" is only a few seconds

  Scenario: Only GET is allowed (edge case)
    When a client sends a POST request to "/api/uptime"
    Then the response status code is 405

  Scenario: The criteria are covered by the automated tests (verification)
    When the tests "tests/unit/test_uptime_unit.py", "tests/unit/test_uptime_service_unit.py", "tests/unit/test_main_unit.py" and "tests/integration/test_uptime_integration.py" are run with "uv run --directory backend pytest -q"
    Then the run reports 0 failed

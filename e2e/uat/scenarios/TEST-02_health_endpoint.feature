Feature: TEST-02 Health endpoint
  As an operator of the Task Notes service
  I want a single endpoint that says whether the backend and its database are usable
  So that I can tell a healthy deployment from a degraded one without reading logs

  # This is an API feature with no UI surface, so the steps below are phrased as
  # requests and responses rather than as page interactions, and no data-testid
  # is referenced anywhere: there is nothing on screen to identify.
  #
  # The method-rejection contract (POST /api/health answers 405) is asserted by
  # the E2E spec e2e/tests/TEST-02_health_endpoint.spec.ts and is deliberately
  # not restated here. The edge cases below are the ones no E2E spec can cover:
  # they require stopping and starting containers, which would break the
  # independence of every spec running in parallel.

  Background:
    Given the Task Notes stack (db, backend, frontend) is running per docker-compose.yml
    And the backend answers on "http://localhost:8010"

  Scenario: A healthy service reports itself as ok
    Given the database container is running and healthy
    When I request "GET /api/health"
    Then I receive HTTP 200
    And the response is JSON reading {"status": "ok"}

  Scenario: A service that cannot reach PostgreSQL reports itself as degraded
    Given the database container has been stopped
    When I request "GET /api/health"
    Then I receive HTTP 503
    And the response is JSON reading {"status": "degraded"}
    And the response arrives within a few seconds rather than hanging until the driver gives up

  Scenario: The service reports itself healthy again once PostgreSQL comes back (edge case)
    Given the database container was stopped and the endpoint reported degraded
    When the database container is started again and reaches a healthy state
    And I request "GET /api/health"
    Then I receive HTTP 200 with {"status": "ok"} again
    And the backend was never restarted to recover, so the check is evaluated per request

  Scenario: The health verdict is about the backend, not the browser app (edge case)
    Given the frontend container has been stopped while db and backend keep running
    When I request "GET /api/health"
    Then I receive HTTP 200 with {"status": "ok"}
    And the verdict describes only the backend and its database, ignoring the frontend entirely

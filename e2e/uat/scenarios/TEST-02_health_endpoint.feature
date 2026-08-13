Feature: TEST-02 Health endpoint
  As an operator of the Task Notes app
  I want GET /api/health to report whether the backend and its database are working
  So that the frontend and CI can tell a healthy deployment from a degraded one

  Background:
    Given the Task Notes backend runs from docker-compose.yml with PostgreSQL as its database
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: A reachable database answers 200 with status ok
    Given the "db" service is running and healthy
    And the backend is running
    When a client sends a GET request to "/api/health"
    Then the response status code is 200
    And the response body field "status" is "ok"
    And the response body carries a "database" object naming the host and port of the connection the backend actually opened
    And that port is the database's own port inside the compose network, not the port published on the host

  Scenario: An unreachable database answers 503 with status degraded
    Given the backend is running
    And the "db" service has been stopped
    When a client sends a GET request to "/api/health"
    Then the response status code is 503
    And the response body field "status" is "degraded"
    And the response body carries a "database" object naming the target the backend attempted, read from DATABASE_URL
    And the response arrives within the probe's connect timeout of 2 seconds, never hanging

  Scenario: A backend started with no DATABASE_URL answers 503 with an empty target (edge case)
    Given the backend has been started with the environment variable "DATABASE_URL" unset
    When a client sends a GET request to "/api/health"
    Then the response status code is 503
    And the response body field "status" is "degraded"
    And the response body field "database.host" is null
    And the response body field "database.port" is null

  Scenario: The endpoint recovers when the database returns, with no backend restart
    Given the backend answered 503 "degraded" while the "db" service was stopped
    When the "db" service is started again and reports healthy
    And a client sends a GET request to "/api/health"
    Then the response status code is 200
    And the response body field "status" is "ok"
    And the backend was never restarted between the two requests

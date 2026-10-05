Feature: CHORE-02 TEST-08 follow-up: known-improvements
  As a visitor of the Task Notes app
  I want the footer to settle even when the backend never answers
  So that it never stays stuck in the loading state, and the UAT files name the real ports

  Background:
    Given the stack runs via "docker compose up" with the "db", "backend" and "frontend" services started
    And the application is running at "http://localhost:5183"

  Scenario: A hung version request resolves the footer to "version unavailable" (criterion 1)
    Given the backend container is paused with "docker compose pause backend"
    When I reload "http://localhost:5183" in the browser
    Then the footer first reads only "Task Notes"
    And within about 5 seconds the footer reads "Task Notes · version unavailable"
    And the "/api/version" request is cancelled instead of staying pending

  Scenario: The UAT files name the ports docker-compose.yml publishes (criterion 2)
    Given the TEST-01 and TEST-03 scenario files and manual UAT scripts
    When I search them for the stale ports "5173", "8000" and "localhost:5432"
    Then there is no match
    And they name the frontend on 5183, the backend on 8010 and the host PostgreSQL on 5442
    And every changed line differs from its original only in a port number

  Scenario: The backend recovers after a timeout (edge case)
    Given the footer showed "Task Notes · version unavailable" after a timeout
    When I unpause the backend with "docker compose unpause backend"
    And I reload "http://localhost:5183" in the browser
    Then the footer reads "Task Notes v0.1.0"

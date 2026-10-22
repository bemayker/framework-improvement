Feature: FEAT-6 GET /api/stamp returns a JSON stamp and the frontend shows it
  As a visitor of the Task Notes app
  I want the footer to show a stamp reported by the backend
  So that I can see the backend answered and whether its database is reachable

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is reachable at "http://localhost:5183"
    And the backend is reachable at "http://localhost:8010"

  Scenario: The stamp endpoint answers with the stamp and the database state
    Given the backend and the database are running
    When "GET /api/stamp" is requested
    Then the response status is 200
    And the response body is {"stamp": "ok", "db": true}

  Scenario: The footer shows the stamp once the backend answers
    Given the stack is running
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" is visible
    And the element identified by "app-footer-stamp" reads "stamp: ok"

  Scenario: Unit tests cover the stamp service, the stamp client and the footer
    Given a checkout of the branch with backend and frontend dependencies installed
    When the backend and frontend unit suites for the stamp run
    Then both runs report 0 failed

  Scenario: One Playwright test checks the footer against the running stack
    Given the stack is running and the Playwright browsers are installed
    When the FEAT-6 Playwright spec runs
    Then it reports 0 failed
    And it asserts the "app-footer-stamp" element reads "stamp: ok" without a mocked network route

  Scenario: The footer shows no stamp when the backend does not answer (edge case)
    Given the backend is stopped
    When I open "http://localhost:5183" in a browser
    Then the footer still shows "Task Notes" and its version
    And no "app-footer-stamp" text is shown
    And the rest of the page still works

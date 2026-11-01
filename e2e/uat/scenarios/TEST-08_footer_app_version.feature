Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version reported by the backend
  So that I know which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer renders the version on the landing page (criterion 1)
    Given the backend's pyproject.toml declares version "0.1.0"
    When I open the landing page
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0"

  Scenario: Footer shows the backend's version, not the frontend package's (criterion 2)
    Given the backend reports a version that differs from the version in frontend/package.json
    When I open the landing page
    Then the footer shows the backend's version
    And the browser requested GET /api/version from the backend
    And the footer component contains no version literal

  Scenario: Footer renders without a version when it cannot be resolved (criterion 3, edge case)
    Given the backend is unreachable
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer shows no version element
    And the footer contains none of the words "unknown", "undefined" or "null"
    And there is no trailing gap after "Task Notes"

  Scenario: Footer recovers once the backend is reachable again (criterion 3)
    Given the footer showed "Task Notes" while the backend was down
    When the backend is started again and I reload the landing page
    Then the footer reads "Task Notes v0.1.0"

  Scenario: Component tests cover both paths (criterion 4)
    Given the frontend test suite
    When I run "npm --prefix frontend test"
    Then the AppFooter tests for a present version and an absent version pass
    And the summary reports 0 failed

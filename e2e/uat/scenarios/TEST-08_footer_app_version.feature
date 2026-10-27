Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version reported by the running backend
  So that I can tell which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is available at "http://localhost:5183"
    And the backend is available at "http://localhost:8010"

  Scenario: Footer renders the version on the landing page (criterion 1)
    When I open the landing page
    Then the footer shows "Task Notes v" followed by a version
    And the version is shown in the element identified by "app-footer-version"

  Scenario: The version comes from the backend at runtime (criterion 2)
    Given the backend reports version "0.1.0" at "/api/version"
    And the frontend package declares version "0.0.0"
    When I open the landing page
    Then the footer shows "v0.1.0"
    And the footer does not show "v0.0.0"

  Scenario: Footer renders without a version when it cannot be resolved (criterion 3)
    Given the version endpoint "/api/version" is unreachable
    When I open the landing page
    Then the footer shows exactly "Task Notes"
    And the footer does not contain "undefined", "null", "unknown" or a dangling "v"
    And there is no element identified by "app-footer-version"

  Scenario: Component tests cover both paths (criterion 4)
    Given the frontend test suite
    When I run the AppFooter component tests
    Then a version-present case and a version-absent case both pass
    And 0 tests fail

  Scenario: Footer reads the app name alone before the request resolves (criterion 5)
    Given the version request has not answered yet
    When the landing page renders
    Then the footer shows exactly "Task Notes"
    And it shows no placeholder, spinner or blank footer

  Scenario: The version endpoint returns the backend's own version (criterion 6)
    Given the backend is running
    When I request "http://localhost:8010/api/version"
    Then the response is 200
    And the body holds the version declared in backend/pyproject.toml

  Scenario: Backend stopped, then restarted (edge case)
    Given the backend container is stopped
    When I open the landing page
    Then the footer shows exactly "Task Notes"
    When the backend is started again and I reload the landing page
    Then the footer shows "Task Notes v0.1.0"

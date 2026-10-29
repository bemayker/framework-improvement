Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version the backend reports
  So that I can tell which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is at "http://localhost:5183"
    And the backend is at "http://localhost:8010"

  Scenario: Footer shows the version fetched from the backend (criterion 1)
    Given the backend answers "GET /api/version" with the version declared in backend/pyproject.toml
    When I open "http://localhost:5183"
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that backend version

  Scenario: The version comes from the backend, not from the frontend package (criterion 2)
    Given the backend reports version "0.1.0" and frontend/package.json declares "0.0.0"
    When I open "http://localhost:5183"
    Then the footer shows "v0.1.0"
    And the footer does not show "v0.0.0"

  Scenario: Unresolved version renders the footer without it (criterion 3)
    Given the backend is stopped so "/api/version" cannot be reached
    When I open "http://localhost:5183"
    Then the footer reads exactly "Task Notes"
    And the footer does not contain "undefined", "null", "unknown" or a trailing "v"
    And the page shows no error message

  Scenario: Component tests cover the present and absent paths (criterion 4)
    Given the frontend test suite
    When I run the AppFooter and version client tests
    Then they pass with 0 failed

  Scenario: A frontend against a backend with a different version shows the backend's version (criterion 5)
    Given the backend reports version "9.9.9-e2e", which differs from the frontend bundle's "0.0.0"
    When I open "http://localhost:5183"
    Then the footer reads "Task Notes v9.9.9-e2e"
    And the footer does not contain "0.0.0"

  Scenario: Backend unreachable keeps the footer present but without a version (edge case)
    Given the request to "/api/version" is aborted
    When I open "http://localhost:5183"
    Then the footer is still visible as a "contentinfo" landmark
    And it reads exactly "Task Notes"

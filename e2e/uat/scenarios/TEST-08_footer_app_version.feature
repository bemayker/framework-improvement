Feature: TEST-08 Footer shows the app version reported by the backend
  As a visitor of the Task Notes app
  I want the footer to show the version the running backend reports
  So that I can tell which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer renders the backend version on the landing page (criterion 1)
    Given the backend declares its version in backend/pyproject.toml
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" contains "Task Notes"
    And the element identified by "app-footer-version" is visible
    And it shows "v" followed by the version declared in backend/pyproject.toml

  Scenario: Version comes from the backend at runtime, not from the frontend (criterion 2)
    Given the frontend package.json declares a different version than the backend
    When I open "http://localhost:5183" in a browser
    Then the page requests GET "http://localhost:8010/api/version"
    And the element identified by "app-footer-version" shows the backend version
    And it does not show the version declared in frontend/package.json

  Scenario: Footer shows the app name alone when the version cannot be resolved (criterion 3)
    Given the backend is unreachable
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" is visible
    And the footer text is exactly "Task Notes"
    And no element identified by "app-footer-version" exists
    And the footer does not contain "unknown", "undefined" or "null"

  Scenario: Footer shows the app name alone until the version request completes (criterion 3, loading edge case)
    Given the network is throttled so the version request is slow
    When I open "http://localhost:5183" in a browser
    Then until the request completes the footer text is exactly "Task Notes"
    And once the request completes the footer shows the backend version after "Task Notes"

  Scenario: Frontend test suite covers both version paths (criterion 4)
    Given the frontend test suite
    When I run the Vitest tests in "frontend/src/components/AppFooter.test.tsx" and "frontend/src/api/version.test.ts"
    Then the run reports 0 failed
    And one test asserts the footer shows the version when the client resolves one
    And other tests assert the footer reads exactly "Task Notes" when the client resolves null or rejects

Feature: TEST-08 Footer shows the app version
  As anyone looking at a running Task Notes instance
  I want the footer to show the backend's version
  So that I can tell which build I am on

  Background:
    Given the stack is running with docker compose
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer renders the version on the landing page (criterion 1)
    Given backend/pyproject.toml declares version "0.1.0"
    When I open "http://localhost:5183/"
    Then the element identified by "app-footer" reads "Task Notes v0.1.0"
    And the element identified by "app-footer-version" reads "v0.1.0"

  Scenario: Version comes from the backend at runtime (criterion 2)
    Given the backend reports "0.1.0" and frontend/package.json declares "0.0.0"
    When I open "http://localhost:5183/"
    Then the browser requests "GET http://localhost:8010/api/version" and receives status 200
    And the footer reads "Task Notes v0.1.0"
    And the footer does not contain "v0.0.0"

  Scenario: Footer renders without a version while loading (criterion 3)
    Given the response of "/api/version" is slow
    When I open "http://localhost:5183/" before the response arrives
    Then the footer reads "Task Notes"
    And the footer contains none of "undefined", "null", "unknown"
    And once the response arrives the footer reads "Task Notes v0.1.0"

  Scenario: Footer renders without a version when the backend is unreachable (criterion 3, edge case)
    Given the backend is stopped
    When I open "http://localhost:5183/"
    Then the footer reads exactly "Task Notes"
    And no element identified by "app-footer-version" is present
    And the footer contains none of "undefined", "null", "unknown"

  Scenario: Component tests cover both paths (criterion 4)
    Given the frontend test suite
    When I run the tests in "src/components/AppFooter.test.tsx" and "src/api/version.test.ts"
    Then the run reports 0 failed
    And the AppFooter tests include a version-present case and a version-absent case

  Scenario: GET /api/version returns the backend's version (criterion 5)
    Given the backend is running
    When I request "GET http://localhost:8010/api/version"
    Then the "version" field of the JSON response body is "0.1.0"
    And the tests in "backend/tests/integration/test_version_integration.py" report 0 failed

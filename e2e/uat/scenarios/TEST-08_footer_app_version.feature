Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version reported by the running backend
  So that I can tell which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the application is available at "http://localhost:5183"
    And the backend reports its version at "GET /api/version"

  Scenario: Footer renders the version on the landing page (criterion 1)
    When I open "http://localhost:5183" in a browser
    Then the element identified by "app-footer" contains "Task Notes"
    And the element identified by "app-footer-version" contains the backend version from backend/pyproject.toml

  Scenario: Version comes from the backend at runtime, not from the frontend package (criterion 2)
    Given the frontend package.json version is "0.0.0"
    And the backend reports a different version
    When I open the landing page
    Then the footer shows the backend version
    And the footer does not contain "0.0.0"
    And the browser made one "GET /api/version" request that returned status 200

  Scenario: Footer renders without a version when it cannot be resolved (criterion 3)
    Given the "/api/version" endpoint is unreachable
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And there is no element identified by "app-footer-version"
    And the footer text contains none of "undefined", "null", "unknown" or a trailing "v"

  Scenario: Component tests cover both paths (criterion 4)
    Given the frontend unit suite
    When I run the tests in "frontend/src/components/AppFooter.test.tsx" and "frontend/src/api/version.test.ts"
    Then the run reports 0 failed
    And one test covers the version present path and one covers the version absent path

  Scenario: Footer shows only the app name while the version is loading (edge case)
    Given the "/api/version" request is slow to answer
    When I open the landing page
    Then until the response arrives the footer reads exactly "Task Notes" with no spinner or placeholder
    And once the response arrives the footer reads "Task Notes" followed by " v" and the backend version

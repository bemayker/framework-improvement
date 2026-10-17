Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version the backend reports
  So that I can tell which build I am looking at

  Background:
    Given the Task Notes stack (database, backend on port 8010, frontend on port 5183) is running per docker-compose.yml
    And the backend package version is read from "backend/pyproject.toml"

  Scenario: Footer renders the backend version on the landing page (criterion 1)
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads "Task Notes" followed by "v" and the backend version
    And the version segment identified by "app-version" is visible

  Scenario: The version comes from the backend at runtime, not from the frontend package (criterion 2)
    Given "frontend/package.json" declares a version different from the backend version
    When I open "http://localhost:5183/"
    Then the footer shows the backend version
    And the footer does not show the "frontend/package.json" version
    And the browser made one request to "/api/version" on the backend

  Scenario: Footer renders without a version when it cannot be resolved (criterion 3, edge case)
    Given the request to "/api/version" is blocked or the backend is stopped
    When I open "http://localhost:5183/"
    Then the footer text is exactly "Task Notes"
    And the footer does not contain "undefined", "null" or "unknown"
    And there is no element identified by "app-version"

  Scenario: Component tests cover both the present and the absent path (criterion 4)
    When I run the frontend tests in "src/components/AppFooter.test.tsx" and "src/api/version.test.ts"
    Then the run reports 0 failed
    And one test asserts the footer shows a mocked version
    And at least one test asserts the footer text is exactly "Task Notes" with no "app-version" element

  Scenario: Loading and failure states both show the app name alone (criterion 5)
    Given the request to "/api/version" is slow or fails
    When the landing page renders
    Then the footer already reads "Task Notes" while the request is pending
    And it still reads "Task Notes" with no placeholder and no trailing space if the request fails
    And it reads "Task Notes" followed by "v" and the version once the request succeeds

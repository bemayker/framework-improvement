Feature: TEST-08 Footer shows the app version reported by the backend
  As a visitor of the Task Notes app
  I want the footer to show the version the running backend reports
  So that I know which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend at "http://localhost:8010"

  Scenario: Footer renders the version on the landing page (criterion 1)
    Given the backend answers GET /api/version with a version
    When I open the landing page
    Then the footer reads "Task Notes v" followed by that version

  Scenario: The version comes from GET /api/version at runtime (criterion 2)
    Given the backend reports version "0.1.0"
    When I open the landing page
    Then the browser requests "http://localhost:8010/api/version" and receives status 200
    And the footer shows "v0.1.0"

  Scenario: An unreachable backend leaves only the app name (criterion 3, edge case)
    Given the backend is stopped so GET /api/version is unreachable
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And it shows no "v", no "undefined", no "null", no "unknown" and no trailing gap

  Scenario: The component test covers both paths (criterion 4)
    Given the frontend test suite
    When AppFooter.test.tsx runs
    Then it passes
    And it contains a version-present test and a version-absent test

  Scenario: The backend version wins over the frontend's own (criterion 5)
    Given frontend/package.json says "0.0.0" and the backend reports "0.1.0"
    When I open the landing page
    Then the footer shows "v0.1.0"
    And "0.0.0" appears nowhere in the footer

  Scenario: The footer reads only the app name while the request is pending (criterion 6)
    Given the version request is slow because network throttling is set to "Slow 3G"
    When the landing page first renders
    Then the footer reads exactly "Task Notes" with no placeholder text such as "loading"
    And once the request completes the footer reads "Task Notes v0.1.0"

Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version reported by the running backend
  So that I can tell which build I am talking to

  Background:
    Given the backend is running at "http://localhost:8010" through "uv run"
    And the frontend is running at "http://localhost:5183"

  Scenario: Footer shows the backend version on the landing page (criterion 1)
    When I open "http://localhost:5183/" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v" followed by the backend version
    And that version equals the "version" field of "backend/pyproject.toml"

  Scenario: Footer shows the backend version, not the frontend package version (criterion 2)
    Given "frontend/package.json" and "backend/pyproject.toml" hold different versions
    When I open "http://localhost:8010/api/version" in a browser tab
    Then the response body carries the backend version
    When I open "http://localhost:5183/"
    Then the footer shows that same version
    And the footer does not show the "version" field of "frontend/package.json"

  Scenario: Footer follows the backend version without a frontend rebuild (criterion 2)
    Given I changed the backend version and restarted only the backend
    When I reload "http://localhost:5183/"
    Then the footer shows the new backend version

  Scenario: Footer renders without a version when the backend is unreachable (criterion 3)
    Given the backend is stopped
    When I open "http://localhost:5183/"
    Then the footer reads exactly "Task Notes"
    And the footer text does not contain "undefined", "null" or "unknown"
    And the page heading and note form are still visible

  Scenario: Component tests cover both the version-present and version-absent paths (criterion 4)
    When I run the AppFooter component tests with "npm --prefix frontend test -- src/components/AppFooter.test.tsx"
    Then the run reports no failed or errored test
    And the command exits 0

  Scenario: The version endpoint returns the backend version (criterion 5)
    When I open "http://localhost:8010/api/version" in a browser tab
    Then the response is a JSON object whose "version" equals "[project].version" in "backend/pyproject.toml"

  Scenario: Footer reads only the app name while the version request is pending (criterion 6, edge case)
    Given the browser network is throttled to "Slow 3G"
    When I reload "http://localhost:5183/"
    Then the footer reads exactly "Task Notes" while the version request is pending
    And once the request completes the footer reads "Task Notes v" followed by the backend version

  Scenario: Footer stays name-only when the version request is blocked (criterion 6, edge case)
    Given the "api/version" request URL is blocked in the browser
    When I reload "http://localhost:5183/"
    Then the footer reads exactly "Task Notes"
    And the footer is never blank and never reads "unknown"

Feature: TEST-08 Footer shows the app version
  As anyone looking at a running Task Notes instance
  I want the footer to show the version reported by the backend
  So that I can tell which build I am on

  Background:
    Given the Task Notes stack is running from docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"
    And "backend/pyproject.toml" declares version "0.1.0"
    And "frontend/package.json" declares version "0.0.0"

  Scenario: Footer renders the version on the landing page (criterion 1)
    Given the backend is running
    When I open "http://localhost:5183/" in a browser
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0"
    And the element identified by "app-footer-version" reads "v0.1.0"

  Scenario: Version comes from the backend at runtime (criterion 2)
    Given the backend reports version "0.1.0" and the frontend package is "0.0.0"
    When I open the landing page with the browser Network tab open
    Then a GET request to "http://localhost:8010/api/version" returns status 200
    And the footer shows "0.1.0" and not "0.0.0"
    When the backend is rebuilt with version "0.1.1" and the frontend is not rebuilt
    And I reload the landing page
    Then the footer reads "Task Notes v0.1.1"

  Scenario: Footer omits the version when the backend is unreachable (criterion 3)
    Given the backend is stopped
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer contains no "v", "undefined", "null", "unknown" or trailing gap
    And no element identified by "app-footer-version" exists

  Scenario: Footer omits the version while the request is blocked (criterion 3, loading state)
    Given the browser blocks the request URL for "/api/version"
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    When I unblock the URL and reload
    Then the footer reads "Task Notes v0.1.0"

  Scenario: Component test covers both the present and the absent version (criterion 4)
    Given the frontend test suite
    When I run "src/components/AppFooter.test.tsx" and "src/api/version.test.ts"
    Then both files are listed with 0 failed
    And AppFooter.test.tsx asserts the footer shows a mocked version
    And AppFooter.test.tsx asserts the footer text is exactly "Task Notes" when the version is unavailable

  Scenario: Backend reports the "unknown" sentinel (edge case)
    Given the backend answers "/api/version" with version "unknown"
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the word "unknown" is not shown

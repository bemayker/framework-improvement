Feature: TEST-10 Footer shows the build commit
  As anyone looking at a running Task Notes instance
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am on

  Background:
    Given the Task Notes stack is running from docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"
    And "backend/pyproject.toml" declares version "0.1.0"

  Scenario: Footer shows the first 7 characters of the commit next to the version (criterion 1)
    Given the backend is started with BUILD_COMMIT "0f0e7a668920851ba8199ffa6ae2252197be5956"
    And "http://localhost:8010/api/version" returns commit "0f0e7a668920"
    When I open "http://localhost:5183/" in a browser
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0 (0f0e7a6)"
    And the element identified by "app-footer-commit" reads "(0f0e7a6)"
    And the commit shown is 7 characters long

  Scenario: Footer shows nothing extra while the request is pending (criterion 2, pending)
    Given the backend is started with BUILD_COMMIT "0f0e7a668920851ba8199ffa6ae2252197be5956"
    And the browser network throttling is set to "Slow 3G"
    When I open the landing page
    Then while the request to "/api/version" is in flight the footer reads exactly "Task Notes"
    And the footer contains no "undefined", "null", "unknown" or error text
    When the request completes
    Then the footer reads "Task Notes v0.1.0 (0f0e7a6)"

  Scenario: Footer shows nothing extra when the request fails (criterion 2, failure)
    Given the browser blocks the request URL for "/api/version"
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer contains no "undefined", "null", "unknown" or error text
    And no element identified by "app-footer-commit" exists

  Scenario: Component test covers success, pending and failure (criterion 3)
    Given the frontend test suite
    When I run "src/components/AppFooter.test.tsx"
    Then the file is listed with 0 failed
    And it contains a success case with a commit, a pending case and a failure case
    When I run "src/api/version.test.ts" and "src/components/LandingPage.test.tsx"
    Then both files are listed with 0 failed

  Scenario: Backend reports the "unknown" commit (edge case)
    Given BUILD_COMMIT is unset so "http://localhost:8010/api/version" returns commit "unknown"
    When I open the landing page
    Then the footer reads exactly "Task Notes v0.1.0"
    And the word "unknown" is not shown
    And no element identified by "app-footer-commit" exists

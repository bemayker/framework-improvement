Feature: TEST-10 Footer shows the build commit
  As anyone looking at a running Task Notes instance
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am on

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the application is open at "http://localhost:5183"

  Scenario: Criterion 1, footer shows the first 7 characters of the commit next to the version
    Given the backend was built with BUILD_COMMIT "0123456789abcdef"
    And "GET /api/version" answers with version "0.1.0" and commit "0123456789ab"
    When I open the landing page
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0 (0123456)"
    And the footer does not contain "0123456789ab"

  Scenario: Criterion 2, footer shows no commit and no error while the request is pending
    Given the backend has not yet answered "GET /api/version"
    When I look at the footer
    Then the footer reads exactly "Task Notes"
    And the footer text contains no "undefined", no "null" and no "()"

  Scenario: Criterion 2, footer shows no commit and no error when the request fails
    Given the backend is stopped
    When I open the landing page
    Then the page still loads
    And the footer reads exactly "Task Notes"
    And the footer text contains no "undefined", no "null", no "()" and no error text

  Scenario: Criterion 3, the component test covers the success, pending and failure paths
    When the tests in frontend/src/components/AppFooter.test.tsx are run
    Then the run reports 0 failed
    And the tests include a success with a commit, a pending request and a failed request

  Scenario: Edge case, footer shows the version alone when the backend has no commit
    Given the backend was built without BUILD_COMMIT
    And "GET /api/version" answers with version "0.1.0" and commit "unknown"
    When I open the landing page
    Then the footer reads exactly "Task Notes v0.1.0"
    And the footer text contains no "()", no "unknown" and no trailing space

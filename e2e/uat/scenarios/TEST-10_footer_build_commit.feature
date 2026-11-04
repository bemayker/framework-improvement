Feature: TEST-10 Footer shows the build commit
  As anyone looking at a running instance of Task Notes
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am on

  Background:
    Given the Task Notes frontend is running at "http://localhost:5183"

  Scenario: Footer shows the first 7 characters of the commit next to the version
    Given the stack is running with BUILD_COMMIT set to a 40-character sha
    When I open the landing page
    Then the footer reads "Task Notes v0.0.0 (" followed by the sha's first 7 characters and ")"

  Scenario: Footer shows the version alone while the request is pending or when it fails
    Given the version endpoint is unreachable
    When I open the landing page
    Then the footer reads exactly "Task Notes v0.0.0"
    And it does not contain "undefined" or an error message

  Scenario: Component tests cover success, pending and failure
    Given the AppFooter test file
    When the frontend tests run
    Then the success, pending and failure tests pass with 0 failed

  Scenario: Version endpoint returns a 500 (edge case)
    Given GET /api/version responds with status 500
    When I open the landing page
    Then the footer reads exactly "Task Notes v0.0.0"
    And no commit element is shown

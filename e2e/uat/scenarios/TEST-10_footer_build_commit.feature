Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes landing page
  I want the footer to show the short build commit next to the version
  So that I can tell which build I am looking at

  Background:
    Given the Task Notes frontend is running at "http://localhost:5183"
    And the Task Notes backend is running at "http://localhost:8010"

  Scenario: The footer shows the first 7 characters of the commit next to the version
    Given the backend reports version "0.1.0" and commit "4e631128d728" on "GET /api/version"
    When I open the landing page
    Then the footer reads "Task Notes v0.1.0 (4e63112)"
    And the commit is shown after the version
    And the commit is exactly 7 characters long

  Scenario: While the version request is pending the footer shows no version and no commit
    Given the request to "/api/version" has not completed yet
    When I open the landing page
    Then the footer reads "Task Notes"
    And the footer does not contain "undefined", "null" or an error message

  Scenario: When the version request fails the footer shows no version and no commit
    Given the backend is unreachable
    When I open the landing page
    Then the footer reads "Task Notes"
    And the footer does not contain "undefined", "null" or an error message

  Scenario: A component test covers the success, pending and failure paths
    Given the repository
    When I run the AppFooter and version client component tests
    Then the run passes with no failed test
    And the success, pending and failure tests appear as passed

  Scenario: An unknown commit leaves the version alone (edge case)
    Given the environment variable "BUILD_COMMIT" is not set on the backend
    And "GET /api/version" answers with commit "unknown"
    When I open the landing page
    Then the footer reads "Task Notes v0.1.0"
    And the footer does not contain parentheses, "unknown" or "undefined"

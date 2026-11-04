Feature: TEST-08 Footer shows the app version
  As anyone looking at a running instance of Task Notes
  I want the footer to show the application version
  So that I can tell which build I am on

  Background:
    Given the Task Notes frontend is running at "http://localhost:5183"

  Scenario: Footer renders the version on the landing page
    Given the app is running
    When I open the landing page
    Then the footer reads "Task Notes v" followed by the frontend package version

  Scenario: Version comes from the single declared source
    Given frontend/package.json declares version "0.0.1"
    When I open the landing page
    Then the footer reads "Task Notes v0.0.1"
    And no version number is typed in the AppFooter component

  Scenario: Footer renders without a version when it cannot be resolved
    Given no version is resolvable
    When the footer renders
    Then the footer reads exactly "Task Notes"
    And it does not contain "undefined", "null" or a trailing "v"

  Scenario: Component tests cover both paths
    Given the AppFooter test file
    When the frontend tests run
    Then the version-present and version-absent tests pass with 0 failed

  Scenario: Blank version is treated as absent (edge case)
    Given the version is an empty or whitespace-only string
    When the footer renders
    Then the footer reads exactly "Task Notes"
    And there is no empty gap after the app name

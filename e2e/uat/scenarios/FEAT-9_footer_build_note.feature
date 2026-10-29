Feature: FEAT-9 Footer shows a build note
  As a visitor of the Task Notes app
  I want the page footer to show a one-line build note
  So that the footer carries the text "Build note" below the app identity line

  Background:
    Given the app stack is running
    And the frontend answers at "http://localhost:5183"

  Scenario: Criterion 1, the footer renders the build note on its own line
    When I open the landing page
    Then the element "app-footer" is visible
    And the element "app-footer-build-note" is visible
    And the element "app-footer-build-note" has the text "Build note"
    And the element "app-footer-build-note" is contained in the element "app-footer"
    And the build note is shown on its own line below the app name and version

  Scenario: Criterion 2, the frontend test suite passes
    Given the repository is checked out with frontend dependencies installed
    When I run "npm --prefix frontend test"
    Then the run reports 0 failed
    And the command exits with status 0
    And the test file "AppFooter.test.tsx" is listed as passed

  Scenario: Edge case, the build note is shown when the version endpoint is unreachable
    Given the request to "/api/version" fails
    When I open the landing page
    Then the first footer line reads only "Task Notes"
    And the element "app-footer-build-note" has the text "Build note"
    And the footer does not contain "undefined"
    And the footer does not contain "null"
    And the footer does not contain "unknown"

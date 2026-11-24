Feature: TEST-10 Footer shows the build commit
  As a person looking at the Task Notes landing page
  I want the footer to show the short build commit next to the version
  So that I can tell which build I am looking at

  Background:
    Given the Task Notes app is set up per docker-compose.yml
    And the frontend is reachable at "http://localhost:5183"
    And the backend is reachable at "http://localhost:8010"

  Scenario: Footer shows the first 7 characters of the commit next to the version
    Given the backend reports the commit "a1b2c3d4e5f6" and the version "0.1.0"
    When I open the landing page
    Then the footer reads "Task Notes v0.1.0 (a1b2c3d)"
    And the commit shows exactly 7 characters
    And the commit comes directly after the version

  Scenario: Footer shows the app name alone while the version request is pending
    Given the request to "/api/version" has not completed yet
    When I look at the landing page footer
    Then the footer reads "Task Notes"
    And the footer does not contain "undefined"
    And the footer does not contain "unknown"

  Scenario: Footer shows the app name alone when the version request fails
    Given the request to "/api/version" fails
    When I open the landing page
    Then the footer reads "Task Notes"
    And the footer does not contain "undefined"
    And the footer does not contain an error message

  Scenario: Component test covers the success, pending and failure paths
    Given the frontend test suite
    When "AppFooter.test.tsx" runs
    Then it passes
    And it includes a success, a pending and a failure test

  Scenario: Footer shows the version alone when the backend has no build commit (edge case)
    Given the backend reports the commit "unknown" and the version "0.1.0"
    When I open the landing page
    Then the footer reads "Task Notes v0.1.0"
    And the footer shows no parentheses
    And the footer does not contain "unknown"
    And the footer does not contain "undefined"

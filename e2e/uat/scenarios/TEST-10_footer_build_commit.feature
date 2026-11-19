Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am looking at

  Background:
    Given the Task Notes frontend is running at "http://localhost:5183"
    And the backend is running and answers "GET /api/version"

  Scenario: Footer shows the first 7 characters of the commit next to the version
    Given "GET /api/version" returns version "0.1.0" and commit "3f9a2c1d8e7b"
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0 (3f9a2c1)"

  Scenario: The footer shows the version alone while the request is pending or when it fails
    Given the request to "/api/version" is blocked or fails
    When I open "http://localhost:5183" in a browser
    Then the footer reads exactly "Task Notes"
    And the footer does not contain "undefined", "null", "unknown" or an error message

  Scenario: A component test covers the success, pending and failure paths
    Given the frontend test suite is installed
    When I run the "AppFooter" component test
    Then it passes
    And its titles include a success case, a pending case and a failure case

  Scenario: The backend reports the commit as unknown (edge case)
    Given "GET /api/version" returns version "0.1.0" and commit "unknown"
    When I open "http://localhost:5183" in a browser
    Then the footer reads exactly "Task Notes v0.1.0"
    And the footer does not contain "unknown" or parentheses

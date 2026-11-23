Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version the backend reports
  So that I can tell which build I am looking at, even when the frontend was built against an older backend

  Background:
    Given the Task Notes backend is running at "http://localhost:8010"
    And the frontend is running at "http://localhost:5183"

  Scenario: Footer shows the version the backend reports on the landing page
    Given "GET /api/version" answers with a version
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that backend version

  Scenario: The version comes from the backend at runtime, not from the frontend package
    Given the backend reports a version that differs from the "version" field of frontend/package.json
    When I open the landing page
    Then the footer version equals the value returned by "GET /api/version"
    And the footer version does not equal the "version" field of frontend/package.json

  Scenario: Footer omits the version when the backend is unreachable (edge case)
    Given "GET /api/version" is unreachable
    When I open the landing page
    Then the footer reads "Task Notes" with no version
    And the footer does not contain "undefined", "null" or "unknown"
    And the element identified by "app-footer-version" is not present

  Scenario: Footer omits the version when the backend reports the unknown sentinel (edge case)
    Given "GET /api/version" answers with the version "unknown"
    When I open the landing page
    Then the footer reads "Task Notes" with no version

  Scenario: Footer shows the name alone while the version request is pending
    Given "GET /api/version" answers slowly
    When the landing page first renders
    Then the footer reads "Task Notes" until the version arrives
    And at no moment does the footer read "Task Notes v", "undefined" or "unknown"

  Scenario: Footer component tests cover both the present and the absent path
    Given the frontend test suite
    When I run the AppFooter component tests
    Then the test for the backend version being present passes
    And the test for the version request failing passes

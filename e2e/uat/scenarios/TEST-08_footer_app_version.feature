Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version the backend reports
  So that I can tell which build I am looking at

  Background:
    Given the stack is running via docker compose
    And the frontend is served at "http://localhost:5183"
    And the backend answers "GET http://localhost:8010/api/version"

  Scenario: Footer renders the backend version on the landing page
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" is visible
    And it reads "Task Notes v" followed by the version the backend reports
    And the version is shown in the element identified by "app-version"

  Scenario: The version comes from the backend at runtime, not from the frontend package
    Given the frontend package version differs from the backend version
    When I open the landing page
    Then the footer shows the backend version from "GET /api/version"
    And the footer does not show the version in frontend/package.json

  Scenario: Footer renders without a version when the backend is unreachable (edge case)
    Given the backend is stopped
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And no element identified by "app-version" exists
    And the footer shows no "undefined", "null", "unknown" or blank gap

  Scenario: Footer component tests cover the present and absent paths
    Given the frontend tests
    When I run the AppFooter and version client tests
    Then the test "renders the version the backend reports, not the frontend package version" passes
    And the test "renders the app name without a version when the request fails" passes

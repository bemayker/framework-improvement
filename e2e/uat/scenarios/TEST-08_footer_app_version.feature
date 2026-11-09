Feature: TEST-08 Footer shows the app version from the backend
  As a visitor of the Task Notes app
  I want the footer to show the version the running backend reports
  So that I can tell which build I am looking at

  Background:
    Given the Task Notes stack is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend is at "http://localhost:8010"

  Scenario: Footer renders the backend's version on the landing page
    Given the backend is running
    When I open the landing page
    Then the footer shows "Task Notes v" followed by the backend's version

  Scenario: The version comes from the backend at runtime, not from the frontend package
    Given "GET /api/version" reports a version that differs from the "version" in frontend/package.json
    When I open the landing page
    Then the footer shows the backend's version
    And it does not show the frontend package's version

  Scenario: Footer renders without a version when it cannot be resolved (edge case)
    Given the backend is stopped
    When I open the landing page
    Then the footer reads "Task Notes"
    And it shows no "v", "undefined", "null", "unknown" or empty gap after the name

  Scenario: Component tests cover both the present and absent paths
    Given the frontend test suite
    When I run the AppFooter tests
    Then the version present and version absent cases both pass

  Scenario: Footer shows no placeholder while the version request is pending
    Given the version request has not answered yet
    When the landing page renders
    Then the footer reads "Task Notes"
    And no spinner, "Loading" text or "..." is shown

Feature: TEST-08 Footer shows the app version
  As anyone looking at a running Task Notes instance
  I want the footer to show the version the backend reports
  So that I can tell which build of the API I am talking to

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the frontend is running at "http://localhost:5183"
    And the backend is running at "http://localhost:8010"

  Scenario: Footer shows the version the backend reports (criterion 1)
    Given GET "http://localhost:8010/api/version" returns a version
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that version

  Scenario: The version comes from the backend, not from the frontend package (criterion 2)
    Given the backend reports version X from GET "/api/version"
    And the "version" field of frontend/package.json differs from X
    When I open the landing page
    Then the footer shows X
    And the footer does not show the frontend package's version

  Scenario: Footer renders without a version when it cannot be resolved (criterion 3, edge case)
    Given GET "/api/version" fails
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer contains no "undefined", "null", "unknown" or trailing "v"

  Scenario: Both the version-present and version-absent paths are covered by component tests (criterion 4)
    Given the frontend unit suite
    When I run the AppFooter component tests
    Then a test asserting the version is present passes
    And a test asserting the version is absent passes

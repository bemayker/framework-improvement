Feature: TEST-10 Footer shows the build commit next to the version
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I know exactly which build of the backend I am looking at

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5183"

  Scenario: Footer shows the first 7 characters of the commit next to the version (criterion 1)
    Given the backend's GET /api/version returns {"version": "0.1.0", "commit": "abc1234def56"}
    When I open "http://localhost:5183" in a browser
    Then the footer reads "Task Notes v0.1.0 (abc1234)"
    And the commit is shown in an element identified by "app-commit"

  Scenario: Footer shows the version alone when the request fails (criterion 2)
    Given the version endpoint is unreachable
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer does not contain "undefined", "null", "unknown" or any error text
    And no element identified by "app-commit" is present in the footer

  Scenario: Footer shows the version alone when the backend reports no usable commit (criterion 2)
    Given the backend's GET /api/version returns {"version": "0.1.0", "commit": "unknown"}
    When I open the landing page
    Then the footer reads "Task Notes v0.1.0"
    And the footer does not contain "unknown"
    And no element identified by "app-commit" is present in the footer

  Scenario: The component tests cover success, pending and failure (criterion 3)
    Given the frontend test suite
    When I run the AppFooter component tests
    Then they pass
    And they include tests for the resolved commit, the pending request and the failed request

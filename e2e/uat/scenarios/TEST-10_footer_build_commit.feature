Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am looking at

  Background:
    Given the backend is running at "http://localhost:8010"
    And the frontend is running at "http://localhost:5183"

  Scenario: Footer shows the first 7 characters of the commit next to the version
    Given the backend runs with BUILD_COMMIT "4f2a9c1e7b3d5a60"
    And GET /api/version reports commit "4f2a9c1e7b3d"
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads "Task Notes v" followed by the backend version, then " (4f2a9c1)"
    And the commit is shown in the element identified by "app-footer-commit"

  Scenario: Pending request shows no commit
    Given GET /api/version has not answered yet
    When the landing page renders
    Then the footer reads exactly "Task Notes"
    And it contains neither "undefined" nor an error

  Scenario: Failed request shows no commit
    Given the backend is stopped
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And it contains neither "undefined" nor an error

  Scenario: Component test covers success, pending and failure
    Given the frontend test suite
    When I run the AppFooter test file
    Then the success, pending and failure tests pass

  Scenario: Backend reports the unknown commit sentinel (edge case)
    Given the backend runs with no BUILD_COMMIT set
    And GET /api/version reports commit "unknown"
    When I open the landing page
    Then the footer reads "Task Notes v" followed by the backend version
    And it shows no parentheses, no "unknown" and no "undefined"

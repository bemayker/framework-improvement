Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I know exactly which build of the API I am talking to

  Background:
    Given the Task Notes stack (db, backend, frontend) is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend at "http://localhost:8010"

  Scenario: Footer shows the 7-character commit next to the version (criterion 1)
    Given the backend was built with BUILD_COMMIT set to a full sha
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads "Task Notes v" followed by the version and the first 7 characters of that sha in parentheses
    And the remaining characters of the backend's commit appear nowhere in the footer

  Scenario: Pending or failed request shows no commit and no error text (criterion 2)
    Given requests to "/api/version" are blocked or still pending
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And it does not contain "undefined", "null", "unknown" or any error text
    And it contains no empty parentheses

  Scenario: Component tests cover success, pending and failure (criterion 3)
    Given the frontend unit tests
    When I run them
    Then the AppFooter test for success with a commit passes
    And the AppFooter test for the pending state passes
    And the AppFooter test for the failure state passes

  Scenario: Backend runs with no BUILD_COMMIT (edge case)
    Given the backend answers "GET /api/version" with commit "unknown"
    When I open the landing page
    Then the footer reads "Task Notes v" followed by the version only
    And it does not contain "unknown" or empty parentheses
    And there is no "app-commit" element

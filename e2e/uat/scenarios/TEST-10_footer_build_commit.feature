Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I know exactly which build I am looking at

  Background:
    Given the Task Notes stack is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend at "http://localhost:8010"

  Scenario: Footer shows the first 7 characters of the commit next to the version (criterion 1)
    Given the backend reports version "0.1.0" and commit "0123456789ab" at GET /api/version
    When I open "http://localhost:5183"
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0 (0123456)"
    And the element "app-footer-commit" reads " (0123456)"

  Scenario: Pending request shows no version and no commit (criterion 2)
    Given GET /api/version has not answered yet
    When the landing page renders
    Then the footer reads exactly "Task Notes"
    And it does not contain "undefined", "()" or an error message

  Scenario: Failed request shows no version and no commit (criterion 2)
    Given GET /api/version is unreachable
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And it does not contain "undefined", "()" or an error message

  Scenario: Unknown commit shows the version alone (criterion 2, edge case)
    Given the backend reports version "0.1.0" and commit "unknown" at GET /api/version
    When I open the landing page
    Then the footer reads exactly "Task Notes v0.1.0"
    And there is no "app-footer-commit" element
    And the footer does not contain "unknown", brackets or "undefined"

  Scenario: Component tests cover success, pending and failure (criterion 3)
    Given the frontend test suite
    When I run the AppFooter tests
    Then the success, pending and failure cases pass with 0 failed

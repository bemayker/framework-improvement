Feature: TEST-10 Footer shows the build commit

  Background:
    Given the app is running at http://localhost:5183

  Scenario: Criterion 1 - the footer shows the first 7 characters of the commit next to the version
    Given GET /api/version reports version "0.1.0" and commit "0123456789ab"
    When I open the landing page "/"
    Then the element with data-testid "app-footer-version" has the text " v0.1.0"
    And the element with data-testid "app-footer-commit" has the text " (0123456)"
    And the element with data-testid "app-footer" reads "Task Notes v0.1.0 (0123456)"
    And the element with data-testid "app-footer" does not contain "0123456789ab"

  Scenario: Criterion 2 - while the request is pending the footer shows no version or commit
    Given GET /api/version is slow to respond
    When I open the landing page "/"
    Then the element with data-testid "app-footer" reads exactly "Task Notes" until the response arrives
    And the footer text contains none of "undefined", "null", "unknown", "()" or an error message

  Scenario: Criterion 2 - when the request fails the footer shows no version or commit
    Given GET /api/version is unreachable
    When I open the landing page "/"
    Then the element with data-testid "app-footer" reads exactly "Task Notes"
    And there is no element with data-testid "app-footer-commit"
    And the footer text contains none of "undefined", "null", "unknown", "()" or an error message

  Scenario: Criterion 3 - the component tests cover the success, pending and failure paths
    Given the frontend test suite
    When I run the tests in "frontend/src/components/AppFooter.test.tsx"
    Then the success with a commit, success without a commit, pending and failure tests run
    And 0 failed

  Scenario: Edge case - the backend reports the unknown commit sentinel
    Given GET /api/version reports version "0.1.0" and commit "unknown"
    When I open the landing page "/"
    Then the element with data-testid "app-footer" reads exactly "Task Notes v0.1.0"
    And there is no element with data-testid "app-footer-commit"
    And the footer text contains none of "undefined", "null", "unknown" or "()"

Feature: TEST-10 Footer shows the build commit

  Background:
    Given the stack is running and the landing page is served at http://localhost:5183/

  Scenario: Criterion 1 - the footer shows the 7-character commit next to the version
    Given the API reports version "9.9.9" and commit "abcdef123456" on GET /api/version
    When I open the landing page
    Then the element with data-testid "app-version" reads " v9.9.9"
    And the element with data-testid "app-commit" reads " (abcdef1)"
    And the element with data-testid "app-footer" reads "Task Notes v9.9.9 (abcdef1)"

  Scenario: Criterion 2 - while the version request is pending the footer shows the name alone
    Given the API holds the GET /api/version request open
    When I open the landing page
    Then the element with data-testid "app-footer" reads "Task Notes"
    And there is no element with data-testid "app-commit"
    And the footer does not contain "undefined" or "null" or "error"

  Scenario: Criterion 2 - when the version request fails the footer shows the name alone
    Given the API is unreachable
    When I open the landing page
    Then the page renders
    And the element with data-testid "app-footer" reads "Task Notes"
    And there is no element with data-testid "app-commit"
    And the footer does not contain "undefined" or "null" or "error"

  Scenario: Criterion 3 - the component test covers success, pending and failure
    Given the frontend test files src/components/AppFooter.test.tsx and src/api/version.test.ts
    When I run them with "npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts"
    Then the run reports 0 failed

  Scenario: Edge case - a response with the unknown commit shows the version alone
    Given the API reports version "9.9.9" and commit "unknown" on GET /api/version
    When I open the landing page
    Then the element with data-testid "app-version" reads " v9.9.9"
    And there is no element with data-testid "app-commit"
    And the footer does not contain "unknown" or "undefined"

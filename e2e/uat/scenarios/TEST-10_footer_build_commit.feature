Feature: TEST-10 Footer shows the build commit
  The landing page footer shows the first 7 characters of the build commit
  next to the version, and falls back to the version alone, never a broken value.

  Scenario: Criterion 1 - the footer shows the 7-character commit next to the version
    Given the backend reports version "0.1.0" and commit "a1b2c3d4e5f6"
    When I open the landing page
    Then the footer shows "Task Notes v0.1.0 (a1b2c3d)"

  Scenario: Criterion 1 edge case - an unknown commit is left out
    Given the backend reports version "0.1.0" and commit "unknown"
    When I open the landing page
    Then the footer shows exactly "Task Notes v0.1.0"
    And the footer contains no commit, no parentheses and no "unknown"

  Scenario: Criterion 2 - a failed request shows no commit, undefined or error text
    Given the version endpoint is unreachable
    When I open the landing page
    Then the footer shows exactly "Task Notes"
    And the footer contains no commit, "undefined", "null" or error text

  Scenario: Criterion 2 - a pending request shows no commit
    Given the version request has not yet settled
    When I look at the landing page footer
    Then the footer shows exactly "Task Notes"

  Scenario: Criterion 3 - the component test covers success, pending and failure
    Given the frontend test suite
    When I run the AppFooter tests
    Then 0 failed

Feature: TEST-10 Footer shows the build commit next to the version
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I know exactly which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend at "http://localhost:8010"

  Scenario: The footer shows the first 7 characters of the commit next to the version (criterion 1)
    Given the backend reports version "0.1.0" and commit "abc1234def56"
    When I open the landing page
    Then the footer reads "Task Notes v0.1.0 (abc1234)"
    And the commit is exactly the first 7 characters of the reported commit

  Scenario: While the version request is pending the footer shows no commit (criterion 2)
    Given the version request is slow because network throttling is set to "Slow 3G"
    When the landing page first renders
    Then the footer reads exactly "Task Notes"
    And it shows no commit, no "undefined" and no error text

  Scenario: When the version request fails the footer shows no commit (criterion 2)
    Given the backend is stopped so GET /api/version is unreachable
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And it shows no "undefined", no "null", no commit and no error text

  Scenario: The component test covers success, pending and failure (criterion 3)
    Given the frontend test suite
    When AppFooter.test.tsx runs
    Then it passes
    And it contains a success test, a pending test and a failure test for the commit

  Scenario: An unknown commit leaves the version alone (edge case)
    Given the backend reports version "0.1.0" and commit "unknown"
    When I open the landing page
    Then the footer reads "Task Notes v0.1.0"
    And it shows no parentheses, no "unknown" and no "undefined"

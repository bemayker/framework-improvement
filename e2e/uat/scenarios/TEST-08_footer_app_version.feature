Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version the backend reports
  So that I know which build I am running against

  Background:
    Given the Task Notes stack (frontend, backend, database) is running
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer renders the version on the landing page (criterion 1)
    Given GET /api/version reports "0.1.0"
    When I open the landing page
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0"

  Scenario: Version comes from the backend at runtime, not the frontend bundle (criterion 2)
    Given GET /api/version reports "0.1.0"
    And frontend/package.json declares version "0.0.0"
    When I open the landing page
    Then the footer shows "0.1.0"
    And the footer does not contain "0.0.0"
    And the browser made a GET request to "/api/version" at page load

  Scenario: Unresolvable version renders the footer without it (criterion 3)
    Given the backend is stopped
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And it does not contain "undefined", "null", "unknown" or a dangling "v"

  Scenario: Pending request renders the name with no placeholder (criterion 4)
    Given the version request has not answered yet
    When the landing page renders
    Then the footer reads exactly "Task Notes"
    And no "Loading" text or spinner is shown

  Scenario: Component tests cover both paths (criterion 5)
    Given the frontend test suite
    When I run AppFooter.test.tsx and version.test.ts
    Then 0 tests fail
    And a test asserts "Task Notes v9.9.9" for a resolved version
    And a test asserts exactly "Task Notes" for a rejected request

  Scenario: Backend reports the unknown sentinel (edge case)
    Given GET /api/version answers {"version": "unknown"}
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the word "unknown" is not shown

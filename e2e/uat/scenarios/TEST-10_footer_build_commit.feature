Feature: TEST-10 Footer shows the build commit
  As someone looking at a running Task Notes instance
  I want the landing page footer to show the short build commit next to the version
  So that I can tell exactly which build I am on

  Background:
    Given the Task Notes backend is running at "http://localhost:8010"
    And the frontend is running at "http://localhost:5183"

  Scenario: Footer shows the 7-character commit next to the version (criterion 1)
    Given the backend runs with BUILD_COMMIT "0123456789abcdef"
    And "http://localhost:8010/api/version" answers with commit "0123456789ab"
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0 (0123456)"

  Scenario: Footer shows the version alone when the backend has no commit (edge case)
    Given the backend runs without BUILD_COMMIT
    And "http://localhost:8010/api/version" answers with commit "unknown"
    When I open "http://localhost:5183/"
    Then the footer reads exactly "Task Notes v0.1.0"
    And the footer shows no "unknown" and no empty parentheses

  Scenario: Footer shows only the name while the request is pending (criterion 2)
    Given the request to "/api/version" is slow
    When I open "http://localhost:5183/"
    Then the footer reads exactly "Task Notes" until the request completes
    And the footer then reads "Task Notes v0.1.0 (0123456)"

  Scenario: Footer shows only the name when the request fails (criterion 2)
    Given the backend is stopped
    When I open "http://localhost:5183/"
    Then the landing page still renders its heading and note form
    And the footer reads exactly "Task Notes"
    And the footer shows none of "undefined", "null", "unknown", an error message or parentheses

  Scenario: Component tests cover success, pending and failure (criterion 3)
    Given the frontend test suite
    When I run the AppFooter tests
    Then they pass with 0 failed
    And they include a success case with a commit, a pending case and a rejected-fetch case
